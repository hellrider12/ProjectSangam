const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');


brushsize = 1;
let canSendCords = true;
let sendTick = 0, recieveTick = 0;
let playerCount = 0;
var chatString = "";

let coord = { x: 0, y: 0, brushsize: brushsize };
let paint = false;
const canvas = document.querySelector('#canvasBoard');
const ctx = canvas.getContext('2d');
var pName = "";
var isHost = true;
var hasGameStarted = true;
var canDraw = true
var canChooseWord = true;
var guessWord = "";
var guessedPlayer = false;
var atleastOneGuessed = false;
var audioMute = false;

var penColor = "#000000";


// get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

console.log(username, room);

const socket = io();

//join chat room
socket.emit('joinRoom', { username, room });

// get room and users
socket.on('roomUsers',({room, users}) => {
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

    //Emit message to server
    socket.emit('chatMessage', msg);

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



/* <--------------------------------------------------------------------------------> */





/* <--------------------------------------------------------------------------------> */
/* <--------------------------------------------------------------------------------> */


window.addEventListener('load', () => {
    canvas.addEventListener('mousedown', startPainting);
    canvas.addEventListener('mouseup', stopPainting);
    document.addEventListener('mousemove', sketch);
    canvas.addEventListener('wheel', brushSize);
    canvas.addEventListener('onmouseout', stopPainting);
});

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
    sendTick = 0;
}

function brushSize(event) {
    if (event.deltaY < 0 && brushsize < 10) {
        brushsize += 1;
    } else if (brushsize > 1) {
        brushsize -= 1;
    }
}

function setColor(hexValue) {
    if (canDraw) {
        socket.emit('penColor', hexValue);
    }
}

socket.on('startPaint', paintStatus => {
    paint = paintStatus;
    if (!paint) {
        recieveTick = 0;
    }
})


function startGame() {
    socket.emit('startGame');
    loginContainer.innerHTML = "";
}

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


/* <-----------------------------------------------------------------> */

function sendPosition(Xpos, Ypos) {
    if (canDraw) {
        socket.emit('position', { x: Xpos, y: Ypos, brushsize: brushsize });
        sendTick++;
    }
}

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

socket.on('clearCanvas', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});

socket.on('gameStarted', () => {
    console.log("GAME STARTED!!");
    loginContainer.innerHTML = "";
    hasGameStarted = true;

});

socket.on('drawEnd', () => {
    clearInterval(drawTimerReset);
    canDraw = false;
    clearCanvas();
    if (!atleastOneGuessed) {
        var noGuess = new sound("/sfx/noGuess.mp3");
        noGuess.play();
    }
})