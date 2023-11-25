/*--------------CLIENT SIDE ------------- */

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
messageField.style.display = 'flex';



//undo redo buttons
const undoButton = document.getElementById('undo');


const redoButton = document.getElementById('redo');

/* <--------------------------------- Modal Menu ---------------------------------------------> */

const modalMenuContainer = document.getElementById('modalContainer');
const modalTimer = document.getElementById('modalTimer');
const modalContent = document.getElementById('modalValue');
const correctWord = document.getElementById('correctWord');

modalTimer.addEventListener('click', () => {
    modalMenuContainer.style.display = 'none';
})
/* <--------------------------------- Modal Menu ---------------------------------------------> */





/* <--------------------------------- BrushSize Slider ---------------------------------------------> */

const brushSizeSlider = document.getElementById('brushSizeSlider');
brushSizeSlider.addEventListener('change', brushSlider);

/* <--------------------------------- BrushSize Slider ---------------------------------------------> */


/* <--------------------------------- toolbar Buttons ---------------------------------------------> */
let isEraser = false;
const eraserButton = document.getElementById('eraserButton')
eraserButton.addEventListener('click', setEraser);

function setEraser() {
    setColor('#FFFFFF');
    isEraser = true;
}

/* <--------------------------------- toolBar Buttons ---------------------------------------------> */


/* <--------------------------------- Color Buttons ---------------------------------------------> */

const colorPicker = document.getElementById('colorPicker');
colorPicker.addEventListener('change',colorChange);
colorPicker.value =  '#000000';

function colorChange() {
    isEraser = false;
    canvas.style.cursor = 'crosshair'
    setColor(colorPicker.value);
}

/* <--------------------------------- Color Buttons ---------------------------------------------> */


let brushsize = 1;


let coord = { x: 0, y: 0, brushsize: brushsize };
let recieveTick = 0;
let paint = false;
const canvas = document.querySelector('#canvasBoard');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

canvas.addEventListener('mouseover', () => {
    if (isEraser)
        canvas.style.cursor = 'cell'
    else 
        canvas.style.cursor = 'crosshair'
})

/* <--------------------------------- vars done ---------------------------------------------> */

let saveInterval;

var pName = "";
var isHost = false;
var isRoomOwner = false;
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
    resizeWindow();
});

const chatMessagesId = document.getElementById('chatMessages');

const brushSizeSliderContainer = document.getElementById('brushSizeSliderContainer');

const colorContainer = document.getElementById('colorContainer');

const toolContainer = document.getElementById('toolContainer')

const shrink = document.getElementById('shrink');
window.addEventListener('resize', resizeWindow)

let isSmall = false;

function resizeWindow() {

    const container = document.createElement('div');
    container.innerHTML = 'Tools'
    if (window.innerWidth <= 700 && !isSmall) {
        canvas.width = window.innerWidth - 60;
        canvas.height = 250;
        chatSidebar.style.display = 'none';
        chatSidebar.style.zIndex = '0';

        shrink.classList.remove('bar');
        isSmall = true;


        container.style.height = '20px'
        container.style.width = '60px'
        const list = document.createElement('ul');
        let listE = document.createElement('li');
        listE.appendChild(brushSizeSliderContainer)
        list.appendChild(listE)
        listE = document.createElement('li');
        listE.appendChild(toolContainer)
        list.appendChild(listE)
        listE = document.createElement('li');
        listE.appendChild(colorContainer)
        list.appendChild(listE)
        container.appendChild(list);
        shrink.appendChild(container);
        list.style.display = 'none';
        list.style.position = 'relative';
        list.style.zIndex = '1';
        container.classList.add('btn');
        container.addEventListener('click', () => {
            list.style.display = 'block';

        })
        canvas.addEventListener('mousedown', () => {
            list.style.display = 'none';
        })


    }
    else if (window.innerWidth > 700) {

        canvas.width = 0.54 * window.innerWidth;
        canvas.height = 0.717 * window.innerHeight;
        chatSidebar.style.display = 'initial';

        isSmall = false;
        shrink.classList.add('bar')
        shrink.removeChild(shrink.firstChild);
        shrink.appendChild(brushSizeSliderContainer)
        shrink.appendChild(toolContainer)
        shrink.appendChild(colorContainer)
    }
}

const chatSidebar = document.getElementById('chatSidebar');
const displaySidebarButton = document.getElementById('displaySidebarButton');
displaySidebarButton.addEventListener('click', () => {
    chatSidebar.style.display = chatSidebar.style.display === 'none' ? 'block' : 'none';
    chatSidebar.style.zIndex = chatSidebar.style.zIndex === '0' ? '2' : '0';
    chatSidebar.style.position = 'relative';
})

/* <--------------------------------- Chat Stuff ---------------------------------------------> */

// Get username and room from URL
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

pName = username;

//create  a new socket.io client instance
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
    outputMessage(message);
    //scroll down 
    chatMessages.scrollTop = chatMessages.scrollHeight;
});


//message submit
chatForm.addEventListener('submit', (e) => {
    e.preventDefault();                      //prevent the default submission of form

    const msg = e.target.elements.msg.value; // get message text

    let m = msg.trim().toLowerCase();        //New var to check if the entered word is correct or not

    if (m == guessWord) {
        socket.emit('wordGuessed');
        messageField.style.display = 'none'; //disable the inputbox and send button so player wont be able to text after guessing correct ans
    }
    else {
        socket.emit('chatMessage', msg);     //Emit message to server
    }

    e.target.elements.msg.value = '';        //clear input box after sending message
    e.target.elements.msg.focus;
});



//output message to DOM
//function create a div which contain all the informations(username,text,time)
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

//add users to Dom
function outputUsers(users) {
    console.log(users)
    userList.innerHTML = `${users.map(user => (user.isRoomOwner) ? ((user.isHost) ? `<li>${user.playerName} : ${user.score} 🛠️ 🧑‍🚀 </li>` : `<li>${user.playerName} : ${user.score} 🛠️  </li>`) : ((user.isHost) ? `<li>${user.playerName} : ${user.score} 🧑‍🚀  <button name='${user.socID}' class ='kickBtn'>👢kick</button> </li>` : `<li>${user.playerName} : ${user.score} <button name='${user.socID}' class ='kickBtn'>👢kick</button> </li>`)).join('')}`;
    sendServer();
}

/* <-------------------------------------- Chat Stuff ------------------------------------------> */


/* <-------------------------------------------- Admin Controls ------------------------------------------------> */
let kickButton = [];
function sendServer() {
    kickButton = document.querySelectorAll('.kickBtn');
    if (isRoomOwner) {
        kickButton.forEach((button) => button.addEventListener('click', () => {
            let n = button.getAttribute('name');
            console.log(n);
            socket.emit('removePlayer', n);
        }))
    }
    else {
        kickButton.forEach((button) => button.style.display = 'none');
    }
}

socket.on('diconnectUser', () => {
    location.replace('../index.html')
}) 

/* <-------------------------------------------- Admin Controls ------------------------------------------------> */





/* <--------------------------------------------------------------------------------------------> */



function getPosition(event) { //Getting the mouse position
    if (canDraw) {
        coord.x = event.clientX - canvas.getBoundingClientRect().left;
        coord.y = event.clientY - canvas.getBoundingClientRect().top;
        if ((coord.x < 0 || coord.y < 0) || (coord.x > canvas.getBoundingClientRect().right || coord.y > canvas.getBoundingClientRect().bottom)) {
            stopPainting();
        }
        sendPosition(coord.x, coord.y); // @Networking
        return;
    }
}

function startPainting(event) { //Setting the canvas to drawable or not
    paint = true;
    getPosition(event);
    socket.emit('startPaint', paint);
    saveStateCall();//canvas Undo
}


function stopPainting() { //Setting the canvas to drawable or not
    paint = false;
    socket.emit('startPaint', paint);

}



//Canvas Undo
undoButton.addEventListener('click', () => { //canvas undo
    if (isHost) {
        socket.emit('retrieveState');
    }
})

redoButton.addEventListener('click', () => {//canvas redo
    if (isHost) {
        console.log('redo clicked')
        socket.emit('restoreStateServer');
    }
})

let undoStack = [];
let redoStack = [];

function saveStateCall() {
    socket.emit('saveStateServer');
}

socket.on('restoreStateClient', () => {
    console.log('redo happen')
    if (redoStack.length > 0) {
        let i = redoStack.pop();
        undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        ctx.putImageData(i, 0, 0);
    }
})

socket.on('saveStateClient', () => {
    if (hasGameStarted) {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        undoStack.push(imgData);
        redoStack = [];
    }//savestate canvas
})

socket.on('setState', () => { //canvas undo
    if (undoStack.length > 0) {
        redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
        let i = undoStack.pop();
        console.log(redoStack)
        ctx.putImageData(i, 0, 0);
    }
    else if (undoStack.length == 0) {
        ctx.putImageData(undoStack[0], 0, 0);
    }
})



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
        if (isEraser)
            ctx.lineCap = 'square';
        else
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

socket.on('setRoomOwnerClient', (value) => {
    this.isRoomOwner = value;
})


socket.on('otherPOS', position => {
    
    paint = true;
    ctx.beginPath();
    recieveTick++;
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

socket.on('penColor', hexValue => { // function that recieves the request to change the pencolor variable
    penColor = hexValue;
    console.log('PC: ', penColor);
});




function clearCanvasClient() { //function the sends server the request to clear the canvas
    if (isHost)
        socket.emit('clearCanvas');
}



socket.on('clearCanvas', () => { //function that clears the canvas when requested by the server
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});




socket.on('drawEnd', () => { //function is called when the a game session is finished
    if (isHost) {
        startGameButton.style.visibility = 'visible';
        canvasControls.style.visibility = 'visible';
    }
    else {
        startGameButton.style.visibility = 'hidden';
        canvasControls.style.visibility = 'hidden';
    }
    messageField.style.display = 'flex';
    startGameBanner.style.visibility = 'hidden';
    timerLabel.style.visibility = 'hidden';
    paint = false;
    hasGameStarted = false;
    canDraw = false;
    clearCanvasClient();
})




socket.on('displayWinners', (winnerList) => { //Display winners to every client 
    modalMenuContainer.style.display = 'block';
    console.log(winnerList);
    if (winnerList.length >= 1) {
        modalContent.innerHTML = `${winnerList.map(winner => `<li>${winner.playerName}  : ${winner.score}</li><br>`).join('')}`;
    }
    else {
        modalContent.innerHTML = `<li>No one gained any points</li>`
    }
    correctWord.innerHTML = `The word is <label style="font-weight:700;color:white">${guessWord}</label>`;
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


socket.on('gameStarted', ({w, b}) => { // function executed when the server signals the game is started
    console.log("GAME STARTED!!");
    guessWord = w;
    blankWord = b;
    hasGameStarted = true;
    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
    redoStack = [];
    penColor = '#000000';
    colorPicker.value = '#000000'; 
    modalMenuContainer.style.display = 'none';
    timerLabel.style.visibility = 'visible';
    if (isHost) {
        canDraw = true;  // Enable drawing for host
        startGameBanner.innerHTML = guessWord;  // Display guess word for host
        startGameBanner.style.visibility = 'visible';// Make start game banner visible
        messageField.style.display = 'none';    // Hide message field for host
    }
    else {
        canDraw = false;
        startGameBanner.innerHTML = blankWord;
        startGameBanner.style.visibility = 'visible';
        messageField.style.display = 'flex';
    }
});

////////////////////image download
ctx.fillStyle = 'white';
ctx.fillRect(0, 0, canvas.width, canvas.height);

function saveImage() {

const dataURL = canvas.toDataURL('image/png'); // Convert canvas content to data URL

const link = document.createElement('a'); // Create link element

link.href = dataURL;  // Set href attribute with data URL

link.download = 'drawing.png'; // Set download attribute with desired filename

document.body.appendChild(link); // Append link to document

link.click(); // a click event on link to start download

document.body.removeChild(link);// Remove the link from the document
}

/* canvas.addEventListener('wheel', brushSize); */ //mouse wheel event for brush size *was in window load*
/* function brushSize(event) {
brushSizeSlider.value = brushsize;
if (event.deltaY < 0 && brushsize < 10) {
    brushsize += 1;
} else if (brushsize > 1) {
    brushsize -= 1;
}
} */


