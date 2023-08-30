//map of rooms as keys and the submissions in each room as their value
let submissions = new Map();
//map of ids as keys and usernames as values
let usernames = new Map();

const io = require('socket.io')(3000, {
  cors: {
    origin: ['http://localhost:8080', 'http://127.0.0.1:61674'],
  }
});

io.on('connection', socket => {
  socket.on('set-username', (username, callback) => {
    usernames.set(socket.id, username);

    callback(`Successfully changed username to ${username}!`);
  });

  socket.on('create-room', (room, callback) => {
    //room collision detection todo

    socket.join(room);

    callback(room, `Created room ${room}!`);

    //send connected clients list of all connected clients
    io.sockets.in(room).emit('update-clients', getClientsInRoom(room));
  })

  socket.on('join-room', (room, callback) => {
    //join room if it exists, otherwise throw error
    if(io.sockets.adapter.rooms.get(room)) {
      //join the room
      socket.join(room);

      //tell other room members that user has joined
      socket.to(room).emit('receive-message', `${getUsername(socket.id)} joined the room!`);

      //update to room interface instead of login
      callback(room, `Joined room ${room}!`);

      //send connected clients list of all connected clients
      io.sockets.in(room).emit('update-clients', getClientsInRoom(room));
    } else {
      callback(room, `Room ${room} does not exist!`, true);
    }
  });

  socket.on('leave-room', (callback) => {
    const room = [...socket.rooms][1]; //[0] is socket.id

    socket.leave(room);

    //show all connected clients in room
    io.sockets.in(room).emit('update-clients', getClientsInRoom(room));

    //tell other room members that user has left
    socket.to(room).emit('receive-message', `${getUsername(socket.id)} left the room!`);

    callback(`You left room ${room}!`);
  });

  socket.on('submit-prompt', (prompt, callback) => {
    //get room of socket and every socket in that room
    const room = [...socket.rooms][1]; //[0] is socket.id
    const clients = io.sockets.adapter.rooms.get(room);

    callback(`Your prompt has been submitted!`)

    //populate submissions for each room, calculate number of submitted prompts
    let length = 1;
    if(submissions.get(room) == undefined) submissions.set(room, new Array(prompt));
    else {
      submissions.get(room).push(prompt);
      length = submissions.get(room).length;
    }

    //console.log(clients, submissions, length, clients.size);
    //show submissions if every player has submitted
    if(length >= clients.size) {
      //send submissions to everyone with randomly shuffled array
      io.sockets.in(room).emit('show-submissions', shuffle(submissions.get(room)));
      //reset submissions
      submissions.set(room, new Array());
    }
  });
});

function getUsername(id) {
  return usernames.get(id) ? usernames.get(id) : id;
}

function getClientsInRoom(room) {
  if(io.sockets.adapter.rooms.get(room) == undefined) return [];
  
  const clients = [...io.sockets.adapter.rooms.get(room)];

  //match client ids with their username
  for(let i = 0;i < clients.length;i++) {
    clients[i] = getUsername(clients[i]);
  }

  return clients;
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