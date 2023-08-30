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
const roomClients = document.getElementById('room-clients');
const roomClientsInfo = document.getElementById('room-clients-info');
const leaveButton = document.getElementById('room-disconnect');

const promptLogin = document.getElementById('prompt-login');
const promptInfo = document.getElementById('prompt-info');
const promptSubmissions = document.getElementById('prompt-submissions');

const promptButton = document.getElementById('prompt-button');
const promptInput = document.getElementById('prompt-input');

//instantiate socket to connect to server
const socket = io('http://localhost:3000');

//get messages from server
socket.on('connect', () => {
  displayMessage(`You connected with id ${socket.id}!`);

  //reveice message from server and display it
  socket.on('receive-message', (message, isError = false) => {
    displayMessage(message, isError);
  });

  //list all users in current room
  socket.on('update-clients', clients => {
    roomClientsInfo.textContent = `${clients.length} user${clients.length == 1 ? '' : 's'} connected!`;

    roomClients.innerHTML = '';
    for(const client of clients) {
      roomClients.append(createDOMElement('li', client));
    }
  });

  //triggered when everyone in the room submitted a prompt
  socket.on('show-submissions', (submissions) => {
    for(let submission of submissions) {
      promptSubmissions.append(createDOMElement('li', submission));
      
      promptInfo.style.display = 'none';
      promptSubmissions.style.display = 'block';
    }
  });
});

//EVENT LISTENERS
usernameButton.addEventListener('click', e => {
  const username = usernameInput.value;
  usernameInput.value = "";
  console.log(username);

  socket.emit('set-username', username, (message, isError = false) => {
    displayMessage(message, isError);
  });
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

leaveButton.addEventListener('click', e => {
  socket.emit('leave-room', (message, isError = false) => {
    displayMessage(message, isError);

    roomContainer.style.display = 'none';
    loginContainer.style.display = 'flex';
  });
});


//HELPER FUNCTIONS
function createDOMElement(element, text) {
  const DOMElement = document.createElement(element);
  DOMElement.textContent = text;

  return DOMElement;
}

//callback function passed to backend
function logMessageCallback(message, isError = false) {
  displayMessage(message, isError);
}

//used as callback function given from client, is called from server (error handling)
function loginServerErrorHandling(room, message, isError = false) {
  displayMessage(message, isError);

  //only show room if there was no error
  if(!isError) showRoomContainer(room);
}

function displayMessage(message, isError = false) {
  const div = createDOMElement('div', message);
  if(isError) div.style.color = "red";

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