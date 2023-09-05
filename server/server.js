const RoomConfig = {
  submissions: new Map(), //map of rooms as keys and the submissions in each room as their value
  usernames: new Map(), //map of ids as keys and usernames as values
  gameMasters: new Map(), //map of rooms as keys and game master socket id as value
  activeRooms: new Map() //map of rooms as keys and whether a game is active in this room as value
};

const io = require('socket.io')(process.env.PORT || 3000, {
  cors: {
    origin: ['http://localhost:8080', 'http://127.0.0.1:63449', 'https://zor-nobody-is-perfect.netlify.app'],
  }
});

io.on('connection', socket => {
  socket.on('set-username', (username, callback) => {
    if(username == '') {
      return; 
    }

    RoomConfig.usernames.set(socket.id, username);

    callback(`Successfully changed username to ${username}!`);
  });

  socket.on('set-gamemaster', () => {
    chooseGamemaster(socket);
  });

  socket.on('create-room', (room, callback) => {
    //room collision detection todo

    socket.join(room);

    callback(room, `You created room ${room}!`);

    //send connected clients list of all connected clients
    io.sockets.in(room).emit('update-clients', getClientsInRoom(room));
  })

  socket.on('join-room', (room, callback) => {
    //if room has active game dont allow join
    if(RoomConfig.activeRooms.get(room) == true) {
      callback(room, `You cannot join an active room!`, true);
      return;
    }

    //join room if it exists, otherwise throw error
    if(io.sockets.adapter.rooms.get(room)) {
      //join the room
      socket.join(room);

      //tell other room members that user has joined
      io.to(room).emit('receive-message', `${getUsername(socket.id)} joined the room!`);

      //update to room interface instead of login
      callback(room, `You joined room ${room}!`);

      //send connected clients list of all connected clients
      io.sockets.in(room).emit('update-clients', getClientsInRoom(room));
    } else {
      callback(room, `Room ${room} does not exist!`, true);
    }
  });

  socket.on('leave-room', (callback) => {
    const room = getRoom(socket);
    socket.leave(room);

    //show all connected clients in room
    io.sockets.in(room).emit('update-clients', getClientsInRoom(room));

    if(socket.id == RoomConfig.gameMasters.get(room)) {
          //set new gamemaster if he leaves
    };

    //tell other room members that user has left
    io.to(room).emit('receive-message', `${getUsername(socket.id)} left the room!`);

    callback(`You left room ${room}!`);
  });

  socket.on('reset-game', () => {
    //reset game for everyone
    const room = getRoom(socket);
    io.sockets.in(room).emit('show-reset');

    chooseGamemaster(socket);
    RoomConfig.submissions.set(room, new Array());
    RoomConfig.activeRooms.set(room, false);
  });

  socket.on('submit-question', (question, callback) => {
    const room = getRoom(socket);

    //show question to all
    io.sockets.in(room).emit('show-question', question);
    callback(`Submitted question ${question}!`);

    //show X out of Y submission to users
    const clients = getClientsInRoom(room);
    io.sockets.in(room).emit('show-submission-state', 0, clients.length);

    RoomConfig.activeRooms.set(room, true);
  });

  socket.on('submit-prompt', (prompt, callback) => {
    //get room of socket and every socket in that room
    const room = getRoom(socket);
    const clients = getClientsInRoom(room);

    callback(`Your prompt has been submitted!`)

    //populate submissions for each room, calculate number of submitted prompts
    const Submission = {
      prompt: prompt,
      user: getUsername(socket.id)
    }

    let length = 1;
    if(RoomConfig.submissions.get(room) == undefined) RoomConfig.submissions.set(room, new Array(Submission));
    else {
      RoomConfig.submissions.get(room).push(Submission);
      length = RoomConfig.submissions.get(room).length;
    }

    //show X out of Y submission to users
    io.sockets.in(room).emit('show-submission-state', length, clients.length);

    //show submissions if every player has submitted
    if(length >= clients.length) {
      //send submissions to everyone with randomly shuffled array
      io.sockets.in(room).emit('show-submissions', shuffle(RoomConfig.submissions.get(room)));

      //show next round button only to gamemaster
      io.to(RoomConfig.gameMasters.get(room)).emit('show-next');
    }
  });

  socket.on('show-username' , () => {
    const room = getRoom(socket);

    io.sockets.in(room).emit('show-usernames', RoomConfig.submissions.get(room));
  });
});

function getRoom(socket) {
  return [...socket.rooms][1]; //[0] is socket.id
}

function getUsername(id) {
  return RoomConfig.usernames.get(id) ? RoomConfig.usernames.get(id) : id;
}

function getClientsInRoom(room, byUsername = true) {
  if(io.sockets.adapter.rooms.get(room) == undefined) return [];
  
  const clients = [...io.sockets.adapter.rooms.get(room)];

  //return client ids when specified
  if(!byUsername) return clients;

  //match client ids with their username
  for(let i = 0;i < clients.length;i++) {
    clients[i] = getUsername(clients[i]);
  }

  return clients;
}

function chooseGamemaster(socket) {
  const room = getRoom(socket);
  const clients = getClientsInRoom(room, false);

  //if there is no gameMaster, set client to gamemaster (ie on create command)
  if(RoomConfig.gameMasters.get(room) == undefined) RoomConfig.gameMasters.set(room, socket.id);
  else {
    //otherwise get next client in list as new gamemaster
    let i = clients.indexOf(RoomConfig.gameMasters.get(room));

    if(i == -1) RoomConfig.gameMasters.set(room, socket.id);
    else {
      if(i == clients.length - 1) i = 0;
      else i++;

      RoomConfig.gameMasters.set(room, clients[i]);
    }
  }

  //only show gamemaster ui to new gamemaster
  io.to(RoomConfig.gameMasters.get(room)).emit('show-gamemaster');
}

function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}