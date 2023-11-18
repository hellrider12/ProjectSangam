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
messageField.style.display = 'inline';

const chatSidebar = document.getElementById('chatSidebar');
const displaySidebarButton = document.getElementById('displaySidebarButton');
displaySidebarButton.addEventListener('click', ()=> {
    chatSidebar.style.display =  chatSidebar.style.display ==='none'?'block': 'none';
    chatSidebar.style.zIndex =  chatSidebar.style.zIndex ==='0'?'2':'0';
    chatSidebar.style.position = 'relative';
})

//undo redo buttons
const undoButton = document.getElementById('undo');


const redoButton = document.getElementById('redo');

/* <--------------------------------- Modal Menu ---------------------------------------------> */

const modalMenuContainer = document.getElementById('modalContainer');
const modalTimer = document.getElementById('modalTimer');
const modalContent = document.getElementById('modalValue');

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
    isEraser = false;
}

function yellow() {
    setColor('#FFFF00')
    isEraser = false;
}

function blue() {
    setColor('#0000FF')
    isEraser = false;
}

function black() {
    setColor('#000000')
    isEraser = false;
}

/* <--------------------------------- Color Buttons ---------------------------------------------> */


let brushsize = 1;
let sendTick = 0, recieveTick = 0;

let coord = { x: 0, y: 0, brushsize: brushsize };

let paint = false;
const canvas = document.querySelector('#canvasBoard');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

canvas.addEventListener('mouseover', () => {
    if(isEraser)
    canvas.style.cursor = 'cell'
    else
    canvas.style.cursor = 'crosshair'
})

/* <--------------------------------- vars done ---------------------------------------------> */

let saveInterval;

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
    if(window.innerWidth <= 700 && !isSmall)
    {
        canvas.width = window.innerWidth - 60;
        canvas.height= 250;
        chatSidebar.style.display = 'none';
        chatSidebar.style.zIndex ='0';

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
    else if(window.innerWidth > 700 ) {
        
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
    userList.innerHTML = `${users.map(user => !(user.isHost)?`<li>${user.playerName} : ${user.score}</li>`:`<li>${user.playerName} : ${user.score} (Host) </li>`).join('')}`;
}


/* <-------------------------------------- Chat Stuff ------------------------------------------> */



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
}


function stopPainting() { //Setting the canvas to drawable or not
    paint = false;
    socket.emit('startPaint', paint);
    /* saveStateTimeout();//canvas Undo */
}


/* {//Canvas Undo
    undoButton.addEventListener('click', () => { //canvas undo
        if (isHost) {
            console.log('undo clicked!')
            socket.emit('retrieveState');
        }
    })


    let canSave = true;


    function saveStateTimeout() {
        if (canSave) {
            canSave = false;
            socket.emit('saveState', ctx.getImageData(0, 0, canvas.width, canvas.height));  //savestate canvas
            setTimeout(() => { }, 1000);
            canSave = true;
        }
    }

    socket.on('setState', (canvasState) => { ///canvas undo
        console.log('put func')
        ctx.putImageData(canvasState, 0, 0);
    })
}*/


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
        if(isEraser)
        ctx.lineCap='square';
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
    messageField.style.display = 'inline';
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
    if(winnerList.length >= 1){
        modalContent.innerHTML = `${winnerList.map(winner => `<li>${winner.playerName}  : ${winner.score}</li><br>`).join('')}`;
    }
    else
    {
        modalContent.innerHTML = `<li>No one gained any points</li>`
    }
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

function blanks() {
    var blank = "";
    var n = guessWord.length;
    let count = Math.ceil(Math.log(n));
    let c = Math.floor(Math.random() * n);
    for (var i = 0; i < n; i++) {
        let r = Math.floor(Math.random() * n)
        if (r == c && count >= 0) {
            blank = blank + guessWord[i];
            count--;
        }
        else {
            blank = blank + "_ ";
        }
    }
    return blank;
}

socket.on('gameStarted', (word) => { // function executed when the server signals the game is started
    console.log("GAME STARTED!!");
    guessWord = word;
    console.log(guessWord)
    hasGameStarted = true;
    var Blanks = blanks();
    modalMenuContainer.style.display = 'none';
    timerLabel.style.visibility = 'visible';
    if (isHost) {
        canDraw = true;
        startGameBanner.innerHTML = guessWord;
        startGameBanner.style.visibility = 'visible';
        messageField.style.display = 'none';
    }
    else {
        canDraw = false;
        startGameBanner.innerHTML = Blanks; 
        startGameBanner.style.visibility = 'visible';
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


