const path = require('path'); // bring in node.js core module 
const http = require('http'); // bring in http module
const express = require('express'); // bring in express
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');

const Filter = require("bad-words"); // bring in the library of bad words
const filter = new Filter();

const app = express();
const server = http.createServer(app);
const io = socketio(server);
//set static folder
app.use(express.static(path.join(__dirname, 'public')));



/* ---------------------------- vars done ------------------------------ */

let undoStack = [];

var roomName;
var hasGameStarted = false;
var wordToDraw = null;
var time = 0;
var isTimerOn = false;
var timer;
var guessersList = [];

/* ---------------------------- vars done ------------------------------ */

var playerIndex = 0;
var scoreBoard = [];


var words = ['sunflower', 'elephant', 'pizza', 'guitar', 'mountain', 'sailboat', 'butterfly', 'dragon', 'clock', 'umbrella', 'snowman', 'beach', 'book',
    'robot', 'rainbow', 'camera', 'apple', 'tree', 'bicycle', 'fireworks', 'star', 'moon', 'television', 'computer', 'basketball', 'cat', 'dog', 'house', 'car',
    'flower', 'helicopter', 'octopus', 'penguin', 'cactus', 'jellyfish', 'volcano', 'kangaroo', 'train', 'suitcase', 'lighthouse', 'candle', 'keyboard',
    'telephone', 'mushroom', 'banana', 'glasses', 'sunglasses', 'cow', 'ice cream', 'whale', 'surfboard', 'spider', 'skyscraper', 'hot air balloon', 'football',
    'peacock', 'castle', 'rocket', 'trampoline', 'tent', 'piano', 'mailbox', 'scissors', 'hammer', 'shark', 'dolphin', 'zebra', 'puzzle', 'mosquito', 'feather', 'owl',
    'giraffe', 'koala', 'jigsaw', 'crown', 'toothbrush', 'watermelon', 'broom', 'grape', 'pumpkin', 'raccoon', 'skateboard', 'backpack', 'globe', 'hamburger', 'kite',
    'caterpillar', 'garden', 'unicorn', 'mermaid', 'tornado', 'dragonfly', 'spider web', 'lightbulb', 'whistle', 'ocean', 'eagle', 'starfish', 'magnet', 'paintbrush',
    'hourglass', 'raincoat', 'cruise ship', 'rocket', 'palm tree', 'compass', 'waterfall', 'snowflake', 'ballet', 'toucan', 'cottage', 'key', 'windmill', 'flamingo',
    'magnifying glass', 'zeppelin', 'ferris wheel', 'hiking', 'tunnel', 'fishing', 'pencil', 'map', 'dinosaur', 'fireplace', 'knight', 'treasure chest', 'parrot',
    'carousel', 'clam', 'beehive', 'chess', 'coconut', 'crab', 'banjo', 'island', 'broomstick', 'wagon', 'snowball', 'ice cream cone', 'spaceship', 'bathtub', 'teapot',
    'bowtie', 'teddy bear', 'crayon', 'seesaw', 'harmonica', 'umbrella', 'palette', 'fire truck', 'pineapple', 'accordion', 'ballet shoes', 'swan', 'caterpillar',
    'tractor', 'mitten', 'chandelier', 'stethoscope', 'pajamas', 'sunrise', 'wind chime', 'panda', 'bowl', 'bald eagle', 'headphones', 'bonfire', 'megaphone', 'cape',
    'lipstick', 'jigsaw puzzle', 'easel', 'satellite', 'sushi', 'painting', 'elevator', 'frisbee', 'fountain', 'microphone', 'saxophone'
];

class Player {
    constructor(playerName, socID, isHost, isRoomOwner, score) {
        this.playerName = playerName;
        this.socID = socID;
        this.isHost = isHost;
        this.isRoomOwner = isRoomOwner;
        this.score = score;
    }

    getPlayerSocID() {
        return this.socID;
    }

    getPlayerName() {
        return this.playerName;
    }

    setIsHost(value) {
        this.isHost = value
    }

    getIsHost() {
        return this.isHost;
    }

    setIsRoomOwner(value) {
        this.isRoomOwner = value
    }

    getIsRoomOwner() {
        return this.isRoomOwner
    }

    getScore() {
        return this.score;
    }

    setScore(score) {
        this.score = score;
    }
}

let players = []


const botName = 'bot';

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //room name setting initially only
        if (players.length == 0)
            roomName = room;

        //maintaining players list
        let p = new Player(username, socket.id, players.length == 0, players.length == 0, 0)
        players.push(p);
        console.log(players)

        updateHost();


        // welcome current user, send the message to client side (only to the user that's connecting)
        socket.emit('message', formatMessage(botName, 'welcome to MARS DOODLES!')); // to single client 

        //broadcast when a user connects (emit message to everybody expect the user that's connecting)
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, ` ${user.username} has joined the game!`));

        //send users and room info (broadcast to everybody)
        io.to(roomName).emit('roomUsers', {
            room: roomName,
            users: players
        });
    });

    //updates the host for the connected clients
    function updateHost() {
        console.log('update Host')
        players.forEach((player) => {
            io.to(player.getPlayerSocID()).emit('setHostClient', player.getIsHost());
            io.to(roomName).emit('roomUsers', {
                room: roomName,
                users: players
            });
        })
    }

    //if the host leaves to shift the host to someone else
    function setHost(indexIdToIgnore = -1) {
        if (players.length > 1) {
            let index = Math.floor(Math.random() * (players.length))
            while (index == indexIdToIgnore) {
                index = Math.floor(Math.random() * (players.length))
            }

            for (let i = 0; i < players.length; i++) {
                if (i == index) {
                    players[i].setIsHost(true);
                }
                else {
                    players[i].setIsHost(false);
                }
            }
        }
        else
            players[0].setIsHost(true);
        updateHost();
    }


    //if the Room Owner leaves to shift the owner to someone else
    function setRoomOwner(indexIdToIgnore = -1) {
        if (players.length > 2) {
            let index = Math.floor(Math.random() * (players.length))
            while (index == indexIdToIgnore) {
                index = Math.floor(Math.random() * (players.length))
            }

            for (let i = 0; i < players.length; i++) {
                if (i == index) {
                    players[i].setIsRoomOwner(true);
                    break;
                }
            }
        }
        else {
            if (indexIdToIgnore == 1)
                players[0].setIsRoomOwner(true);
            else
                players[1].setIsRoomOwner(true);
        }
    }

    //function to generate the random word for the host to draw
    function randomWordGenerator() {
        let index = Math.floor(Math.random() * (words.length));
        return words[index];
    }


    //On the event when correct word is guessed
    socket.on('wordGuessed', () => {
        players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].setScore(players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getScore() + 5);
        // to the one who has guessed correctly
        socket.emit('message', formatMessage(botName, 'You Have Guessed Correctly!')); // to single client 
        //to the everyone else
        socket.broadcast.to(roomName).emit('message', formatMessage(botName, ` ${players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerName()} has guessed correctly!`));
    })

    function formatTime(t) { // formats the time in the correct structure
        let min = Math.floor(t / 60);
        let sec = t - (min * 60);
        min = min >= 10 ? min : '0' + min;
        sec = sec >= 10 ? sec : '0' + sec;
        return min + ':' + sec;
    }


    function showWinner() { // sets the leaderboard array 
        let p = players;
        p.sort((a, b) => {
            return b.getScore() - a.getScore();
        })
        if (p[0].getScore() > 0) {
            guessersList.push(p[0]);
            for (let i = 1; i < p.length; i++) {
                if (p[i].getScore() == guessersList[0].getScore())
                    guessersList.push(p[i]);
            }
        }
        io.to(roomName).emit('displayWinners', guessersList); //relays the leaderboard to all the clients
    }

    function startTimer() {
        if (isTimerOn) {
            if (time == 30) {// Time limit
                showWinner();
                isTimerOn = false;
                setHost(players.map(e => e.getPlayerSocID()).indexOf());
                hasGameStarted = false;
                wordToDraw = null;
                time = 0;
                io.sockets.emit('timeSet', '00:00')
                io.sockets.emit('startPaint', false);
                io.sockets.emit('drawEnd')
                undoStack = [];
            }
            let t = formatTime(30 - time);
            io.to(roomName).emit('timeSet', t)
            timer = setTimeout(startTimer, 1000);
            time += 1;
        }
    }

    //function to filter the chats and blocking all the bad words
    function check(msg) {
        return filter.clean(msg);
    }

    //listen for chatMessage
    socket.on('chatMessage', (msg) => {
        msg = check(msg);
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));  // server send the message to everybody
    });


    // Runs when client disconnects
    socket.on('disconnect', () => {
        if (players.length > 1) {
            let b = false;
            players.forEach((player) => {
                if (player.getPlayerSocID() == socket.id && !b) {
                    if (player.getIsHost() == true)
                        setHost(players.map(e => e.getPlayerSocID()).indexOf(socket.id));
                    if (player.getIsRoomOwner() == true)
                        setRoomOwner(players.map(e => e.getPlayerSocID()).indexOf(socket.id));
                    players.splice(player, 1)
                    b = true;
                    console.log(players)
                }
            })
        }
        const user = userLeave(socket.id);
        if (user) {
            //broadcast to everybody that the user has left the game
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the game!`));
            //send users and room info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
        }
    });

    socket.on('position', position => {
        // Broadcast the message to all clients
        socket.broadcast.emit('otherPOS', position);

    });

    socket.on('startGame', () => {
        let wordstartgame = randomWordGenerator()
        wordToDraw = wordstartgame;
        isTimerOn = true;

        startTimer(socket.id);
        io.to(roomName).emit('gameStarted', wordstartgame);
        hasGameStarted = true;
        undoStack = [];
        gameStart();
    });

    socket.on('penColor', hexValue => {
        io.to(roomName).emit('penColor', hexValue);

    });

    socket.on('clearCanvas', () => {
        io.to(roomName).emit('clearCanvas');
    });



    socket.on('startPaint', paint => {
        socket.broadcast.to(roomName).emit('startPaint', paint);

    });

    function gameStart() {
        socket.broadcast.to(roomName).emit('startPaint', true);
        guessersList = [];
    }

    /*socket.on('undoServer', () => {
        console.log('undoserver')
        io.to(roomName).emit('undoClient');
    })

     socket.on('saveState', (state) => {
        console.log('save state')
        undoStack.push = state;
    })

    socket.on('retrieveState', () => {
        console.log('state send back')
        io.to(roomName).emit('setState', undoStack.pop());
    }) */
});





const PORT = process.env.PORT || 3000; //check if there's a environment variable named port

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));



