const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');

const canvasControls = document.getElementById('controls');
canvasControls.style.visibility = 'hidden';

const clearCanvasButton = document.getElementById('clearCanvasButton');
clearCanvasButton.addEventListener('click', clearCanvasClient)

const startGameBanner = document.getElementById('StartGame')
startGameBanner.style.visibility = 'hidden'

const startGameButton = document.getElementById('hostSelector');
startGameButton.style.visibility = 'hidden'


const timerLabel = document.getElementById('timerLabel')
timerLabel.style.visibility = 'hidden';
timerLabel.innerHTML = '00:00';

const messageField = document.getElementById('chat-form');
messageField.style.display = 'inline';

/* <--------------------------------- BrushSize Slider ---------------------------------------------> */

const brushSizeSlider = document.getElementById('brushSizeSlider');
brushSizeSlider.addEventListener('change', brushSlider);

/* <--------------------------------- BrushSize Slider ---------------------------------------------> */

/* <--------------------------------- Color Buttons ---------------------------------------------> */

const redButton = document.getElementById('redButton');
const yellowButton = document.getElementById('yellowButton');
const blueButton = document.getElementById('blueButton');
const blackButton = document.getElementById('blackButton');

redButton.addEventListener('click', red)
yellowButton.addEventListener('click', yellow)
blueButton.addEventListener('click', blue)
blackButton.addEventListener('click', black)

function red() {
    setColor('#FF0000');
}

function yellow() {
    setColor('#FFFF00')
}

function blue() {
    setColor('#0000FF')
}

function black() {
    setColor('#000000')
}

/* <--------------------------------- Color Buttons ---------------------------------------------> */


let brushsize = 1;
let canSendCords = true;
let sendTick = 0, recieveTick = 0;
let playerCount = 0;

let coord = { x: 0, y: 0, brushsize: brushsize };
let paint = false;
const canvas = document.querySelector('#canvasBoard');
const ctx = canvas.getContext('2d');

/* <--------------------------------- vars done ---------------------------------------------> */

var pName = "";
var isHost = false;
var hasGameStarted = false;
var canDraw = false;
var penColor = "#000000";
var guessWord = "";
var hasPlayerguessed = false;


/* <--------------------------------- vars done ---------------------------------------------> */











//Event Listeners for mouse
window.addEventListener('load', () => {
    canvas.addEventListener('mousedown', startPainting);
    canvas.addEventListener('mouseup', stopPainting);
    document.addEventListener('mousemove', sketch);
    canvas.addEventListener('onmouseout', stopPainting);
});



/* <--------------------------------- Chat Stuff ---------------------------------------------> */
// get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

pName = username;

const socket = io();

//join chat room
socket.emit('joinRoom', { username, room });

// get room and users
socket.on('roomUsers', ({ room, users }) => {
    outputRoomName(room);
    outputUsers(users);
});


//message from server
socket.on('message', message => {
    console.log(message);
    outputMessage(message);


    //scroll down 
    chatMessages.scrollTop = chatMessages.scrollHeight;
});



//message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();



    // get message  text
    const msg = e.target.elements.msg.value;

    let m = msg.trim().toLowerCase();//New var to check if the entered word is correct or not

    if (m == guessWord) {
        socket.emit('wordGuessed');
        messageField.style.display = 'none';
    }


    else {
        socket.emit('chatMessage', msg);    //Emit message to server
    }

    //clear input 
    e.target.elements.msg.value = '';
    e.target.elements.msg.focus;
});



//output message to DOM
function outputMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
        ${message.text}
    </p>`;
    document.querySelector('.chat-messages').appendChild(div);
}

//add room name to Dom
function outputRoomName(room) {
    roomName.innerText = room;
}

//add usrrs to Dom
function outputUsers(users) {
    userList.innerHTML = `${users.map(user => `<li>${user.username}</li>`).join('')}`;
}


/* <-------------------------------------- Chat Stuff ------------------------------------------> */



/* <--------------------------------------------------------------------------------> */



function getPosition(event) { //Getting the mouse position
    if (canDraw) {
        coord.x = event.clientX - canvas.offsetLeft;
        coord.y = event.clientY - canvas.offsetTop;
        if ((coord.x < 0 || coord.y < 0) || (coord.x > 800 || coord.y > 600)) {
            stopPainting();
        }
        else if (canSendCords) {
            sendPosition(coord.x, coord.y); // @Networking
            return;
        }
    }
}

function startPainting(event) { //Setting the canvas to drawable or not
    paint = true;
    getPosition(event);
    socket.emit('startPaint', paint);
}

function stopPainting() { //Setting the canvas to drawable or not
    paint = false;
    socket.emit('startPaint', paint);
}

function brushSlider() {
    brushsize = brushSizeSlider.value;
}



function setColor(hexValue) {
    console.log(hexValue)
    if (canDraw && isHost) {
        socket.emit('penColor', hexValue);
    }
}

socket.on('startPaint', paintStatus => {
    paint = paintStatus;
    if (!paint) {
        recieveTick = 0;
    }
})

function sketch(event) {
    if (!paint) return;
    if (canDraw) {
        ctx.beginPath();
        ctx.lineWidth = brushsize;
        ctx.lineCap = 'round';
        console.log(penColor);
        ctx.strokeStyle = penColor;
        ctx.moveTo(coord.x, coord.y);
        getPosition(event);
        ctx.lineTo(coord.x, coord.y);
        ctx.stroke();
    }
}

function sendPosition(Xpos, Ypos) {
    if (canDraw) {
        socket.emit('position', { x: Xpos, y: Ypos, brushsize: brushsize });
        sendTick++;
    }
}

socket.on('timeSet', (timeRec) => {
    timerLabel.innerHTML = timeRec;
})

socket.on('setHostClient', (value) => {
    this.isHost = value;
    if (isHost) {
        startGameButton.style.visibility = 'visible';
        canvasControls.style.visibility = 'visible';
    }
    else {
        startGameButton.style.visibility = 'hidden';
        canvasControls.style.visibility = 'hidden';
    }
})

socket.on('otherPOS', position => {
    recieveTick++;
    paint = true;
    ctx.beginPath();

    ctx.lineWidth = position.brushsize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = penColor;
    if (recieveTick == 1) {
        ctx.moveTo(position.x, position.y);
    } else {
        ctx.moveTo(coord.x, coord.y);
    }
    ctx.lineTo(position.x, position.y);
    coord.x = position.x;
    coord.y = position.y;
    ctx.stroke();
    paint = false;
});

socket.on('penColor', hexValue => {
    penColor = hexValue;
    console.log('PC: ', penColor);
});




function clearCanvasClient() {
    if (isHost)
        socket.emit('clearCanvas');
}

socket.on('clearCanvas', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});


socket.on('drawEnd', () => {
    if (isHost) {
        startGameButton.style.visibility = 'visible';
        canvasControls.style.visibility = 'visible';
    }
    else {
        startGameButton.style.visibility = 'hidden';
        canvasControls.style.visibility = 'hidden';
    }
    messageField.style.display = 'inline';
    startGameBanner.style.visibility = 'hidden';
    timerLabel.style.visibility = 'hidden';
    paint = false;
    hasGameStarted = false;
    canDraw = false;
    clearCanvasClient();
})



//client clicks start Game
startGameButton.addEventListener('click', () => {
    if (isHost) {
        startGame();
        startGameButton.style.visibility = 'hidden';
    }
})

//informs server to start game
function startGame() {
    socket.emit('startGame');
}



/* <-----------------------------------------------------------------> */



socket.on('gameStarted', (word) => {
    console.log("GAME STARTED!!");
    guessWord = word;
    console.log(guessWord)
    hasGameStarted = true;
    
    timerLabel.style.visibility = 'visible';
    if (isHost) {
        canDraw = true;
        startGameBanner.innerHTML = guessWord;
        startGameBanner.style.visibility = 'visible';
        messageField.style.display = 'none';
    }
    else {
        canDraw = false;
        startGameBanner.style.visibility = 'hidden';
        messageField.style.display = 'inline';
    }
});



/* canvas.addEventListener('wheel', brushSize); */ //mouse wheel event for brush size *was in window load*
/* function brushSize(event) {
brushSizeSlider.value = brushsize;
if (event.deltaY < 0 && brushsize < 10) {
    brushsize += 1;
} else if (brushsize > 1) {
    brushsize -= 1;
}
} */


