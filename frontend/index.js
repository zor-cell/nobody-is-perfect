//get DOM elements
//containers
const loginContainer = document.getElementById('login-container');
const roomContainer = document.getElementById('room-container');
const infoContainer = document.getElementById('info-container');

//login
const usernameInput = document.getElementById('username-input');

const createButton = document.getElementById('create-button');
const joinButton = document.getElementById('join-button');
const joinInput = document.getElementById('join-input');

//room
const roomClients = document.getElementById('room-clients');
const roomClientsInfo = document.getElementById('room-clients-info');
const leaveButton = document.getElementById('room-disconnect');

const gameMaster = document.getElementById('game-master');
const gameMasterInput = document.getElementById('game-master-input');
const gameMasterButton = document.getElementById('game-master-button');

const promptCounter = document.getElementById('prompt-counter');
const promptCurrent = document.getElementById('prompt-current');
const promptMax = document.getElementById('prompt-max');
const promptLogin = document.getElementById('prompt-login');
const promptQuestion = document.getElementById('prompt-question');
const promptInfo = document.getElementById('prompt-info');
const promptSubmissions = document.getElementById('prompt-submissions');

const promptButton = document.getElementById('prompt-button');
const promptInput = document.getElementById('prompt-input');

const nextButton = document.getElementById('next-button');

//instantiate socket to connect to server
//const socket = io('https://nobody-is-perfect-223a44bfe5d9.herokuapp.com/'); //production
const socket = io('http://localhost:3000'); //development

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

  socket.on('show-question', question => {
    promptQuestion.textContent = question;

    hideDOMElement(gameMasterInput);
    hideDOMElement(gameMasterButton);

    showDOMElement(promptLogin);
    showDOMElement(promptCounter);
  });

  socket.on('show-submission-state', (currentSubmissions, maxSubmissions) => {
    promptCurrent.textContent = currentSubmissions;
    promptMax.textContent = maxSubmissions;
  })

  //triggered when everyone in the room submitted a prompt
  socket.on('show-submissions', (submissions) => {
    for(let submission of submissions) {
      promptSubmissions.append(createDOMElement('li', submission));
    }

    hideDOMElement(promptInfo);
    hideDOMElement(promptCounter);
    showDOMElement(promptSubmissions);
  });

  socket.on('show-gamemaster', () => {
    showDOMElement(gameMaster, 'flex');
    showDOMElement(gameMasterInput);
    showDOMElement(gameMasterButton);
  });

  socket.on('show-next', () => {
    showDOMElement(nextButton);
  });

  socket.on('show-reset' , () => {
    startRound();
  });
});

//EVENT LISTENERS
usernameInput.addEventListener('input', e => {
  const username = usernameInput.value;

  socket.emit('set-username', username, (message, isError = false) => {
    //displayMessage(message, isError);
  });
});

createButton.addEventListener('click', e => {
  //get random room number
  const MAX_ROOM = 1000;
  const room = Math.floor(Math.random() * MAX_ROOM).toString();

  //try to create given room
  socket.emit('create-room', room, (room, message, isError = false) => {
    displayMessage(message, isError);
  
    //only show room if there was no error
    if(!isError) {
      startRound();
      document.getElementById('room').textContent = `Room ${room}`;

      //choose new gamemaster
      socket.emit('set-gamemaster');
    };
  });
});

joinButton.addEventListener('click', e => {
  const room = joinInput.value;
  joinInput.value = "";

  //try to join given room
  socket.emit('join-room', room, (room, message, isError = false) => {
    displayMessage(message, isError);
  
    //only show room if there was no error
    if(!isError) {
      startRound();
      document.getElementById('room').textContent = `Room ${room}`;
    }
  });
});

leaveButton.addEventListener('click', e => {
  socket.emit('leave-room', (message, isError = false) => {
    displayMessage(message, isError);

    hideDOMElement(roomContainer);
    showDOMElement(loginContainer, 'flex');
  });
});

gameMasterButton.addEventListener('click', e => {
  const question = gameMasterInput.value;
  gameMasterInput.value = '';

  socket.emit('submit-question', question, message => {
    displayMessage(message);
  });
});

promptButton.addEventListener('click', e => {
  const prompt = promptInput.value;
  promptInput.value = '';

  socket.emit('submit-prompt', prompt, message => {
    //displayMessage(message);

    hideDOMElement(promptLogin);
    showDOMElement(promptInfo);
    promptInfo.textContent = "Your prompt has been submitted. Wait for the others to submit their prompt!";
  });
});

nextButton.addEventListener('click', e => {
  socket.emit('reset-game');
});



//HELPER FUNCTIONS
function createDOMElement(element, text) {
  const DOMElement = document.createElement(element);
  DOMElement.textContent = text;

  return DOMElement;
}

function hideDOMElement(element) {
  element.style.display = 'none';
}

function showDOMElement(element, display = 'block') {
  element.style.display = display;
}

//callback function passed to backend
function logMessageCallback(message, isError = false) {
  displayMessage(message, isError);
}

function displayMessage(message, isError = false) {
  const div = createDOMElement('div', message);
  if(isError) div.style.color = "red";

  infoContainer.append(div);
}

function startRound() {
  promptQuestion.textContent = 'No question submitted';

  hideDOMElement(loginContainer);
  hideDOMElement(gameMaster);
  hideDOMElement(promptLogin);
  hideDOMElement(promptInfo);
  hideDOMElement(promptCounter);
  hideDOMElement(promptSubmissions);
  hideDOMElement(nextButton);

  showDOMElement(roomContainer, 'flex');

  promptSubmissions.innerHTML = '<h3>Submissions</h3>';
}