//instantiate socket to connect to server
//'dev' for local hosting (development)
//'prod' for global hosting (production)
const socket = initServer('prod');

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
  socket.on('show-submissions', submissions => {
    for(let submission of submissions) {
      promptSubmissions.append(createDOMElement('li', `${submission.prompt}`));
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

  socket.on('show-usernames', newSubmissions => {
    let submissions = promptSubmissions.children;

    //i = [0] is header
    for(let i = 1;i < submissions.length;i++) {
      //find submission in new Submissions and get username
      for(let newSubmission of newSubmissions) {
        if(submissions[i].textContent == newSubmission.prompt) {
          submissions[i].textContent += ` (${newSubmission.user})`;
          break;
        }
      }
    }

    hideDOMElement(userButton);
  });

  socket.on('show-next', () => {
    showDOMElement(userButton);
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

userButton.addEventListener('click', e => {
  socket.emit('show-username');
});

nextButton.addEventListener('click', e => {
  socket.emit('reset-game');
});



//HELPER FUNCTIONS
function initServer(mode) {
  if(mode == 'dev') return io('http://localhost:3000');
  else if(mode == 'prod') return io('https://nobody-is-perfect-223a44bfe5d9.herokuapp.com/');

  return null;
}

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
  hideDOMElement(userButton);
  hideDOMElement(nextButton);

  showDOMElement(roomContainer, 'flex');

  promptSubmissions.innerHTML = '<h3>Submissions</h3>';
}