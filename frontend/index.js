//get DOM elements
//containers
const loginContainer = document.getElementById('login-container');
const roomContainer = document.getElementById('room-container');
const infoContainer = document.getElementById('info-container');

//login
const usernameButton = document.getElementById('username-button');
const usernameInput = document.getElementById('username-input');

const createButton = document.getElementById('create-button');
const joinButton = document.getElementById('join-button');
const joinInput = document.getElementById('join-input');

//room
const promptLogin = document.getElementById('prompt-login');
const promptInfo = document.getElementById('prompt-info');
const promptSubmissions = document.getElementById('prompt-submissions');

const promptButton = document.getElementById('prompt-button');
const promptInput = document.getElementById('prompt-input');

//instantiate socket to connect to server
const socket = io('http://localhost:3000');
socket.on('connect', () => {
  displayMessage(`You connected with id ${socket.id}`);

  //reveice message from server and display it
  socket.on('receive-message', (message, isError = false) => {
    displayMessage(message, isError);
  });

  //triggered when everyone in the room submitted a prompt
  socket.on('show-submissions', (submissions) => {
    for(let submission of submissions) {
      const li = document.createElement('li');
      li.textContent = submission;
      promptSubmissions.append(li);
      
      promptInfo.style.display = 'none';
      promptSubmissions.style.display = 'block';
    }
  });
});

promptButton.addEventListener('click', e => {
  const prompt = promptInput.value;

  socket.emit('submit-prompt', prompt, message => {
    //displayMessage(message);

    //hide prompt input
    promptLogin.style.display = 'none';

    //show waiting screen
    promptInfo.style.display = 'block';
    promptInfo.textContent = "Your prompt has been submitted. Wait for the others to submit their prompt!";
  });
});

usernameButton.addEventListener('click', e => {
  const username = usernameInput.value;
  usernameInput.value = "";
  console.log(username);
});

createButton.addEventListener('click', e => {
  //get random room number
  const MAX_ROOM = 1000000;
  const room = Math.floor(Math.random() * MAX_ROOM).toString();

  //try to create given room
  socket.emit('create-room', room, loginServerErrorHandling);
});

joinButton.addEventListener('click', e => {
  const room = joinInput.value;
  joinInput.value = "";

  //try to join given room
  socket.emit('join-room', room, loginServerErrorHandling);
});

//used as callback function given from client, is called from server (error handling)
function loginServerErrorHandling(room, message, isError = false) {
  displayMessage(message, isError);

  //only show room if there was no error
  if(!isError) showRoomContainer(room);
}

function displayMessage(message, error = false) {
  const div = document.createElement("div");
  if(error) div.style.color = "red";
  div.textContent = message;

  infoContainer.append(div);
}

function showRoomContainer(room) {
  //show room
  roomContainer.style.display = 'flex';
  promptLogin.style.display = 'block';
  //hide other room components
  promptInfo.style.display = 'none';
  promptSubmissions.style.display = 'none';

  document.getElementById('room').textContent = `Room ${room}`;

  //hide login
  loginContainer.style.display = 'none';
}