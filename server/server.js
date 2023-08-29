//map of rooms as keys and the submissions in each room as their value
let submissions = new Map();

const io = require('socket.io')(3000, {
  cors: {
    origin: ['http://localhost:8080', 'http://127.0.0.1:53316'],
  }
});

io.on('connection', socket => {
  socket.on('create-room', (room, callback) => {
    //room collision detection todo
    socket.join(room);

    callback(room, `Created room ${room}!`);
  })

  socket.on('join-room', (room, callback) => {
    //join room if it exists, otherwise throw error
    if(io.sockets.adapter.rooms.get(room)) {
      //join the room
      socket.join(room);

      //update to room interface instead of login
      callback(room, `Joined room ${room}!`);

      //tell other room members that user has joined
      socket.to(room).emit('receive-message', `${socket.id} joined the room!`);
    } else {
      callback(room, `Room ${room} does not exist!`, true);
    }
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