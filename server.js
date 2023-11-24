const path = require('path'); // bring in node.js core module 
const http = require('http'); // bring in http module
const express = require('express'); // bring in express
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');

const Filter = require("bad-words"); // bring in the library of bad words

const filter = new Filter();

const app = express();
const server = http.createServer(app);
const io = socketio(server);
//set static folder
app.use(express.static(path.join(__dirname, 'public')));





/* ---------------------------- vars done ------------------------------ */



/* var roomName;
var hasGameStarted = false;
var wordToDraw = null;
var time = 0;
var isTimerOn = false;
var timer;
var guessersList = [];
let timeLimit = 30; */
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
    constructor(playerName, { roomname, hasGameStarted, wordToDraw, time, isTimerOn, timer, guessersList, timeLimit, blankWord }, socID, isHost, isRoomOwner, score, warning) {
        this.playerName = playerName;
        this.room = { roomname, hasGameStarted, wordToDraw, time, isTimerOn, timer, guessersList, timeLimit, blankWord };
        this.socID = socID;
        this.isHost = isHost;
        this.isRoomOwner = isRoomOwner;
        this.score = score;
        this.warning = warning;
    }

    getPlayerSocID() {
        return this.socID;
    }

    getPlayerName() {
        return this.playerName;
    }

    getPlayerRoom() {
        return this.room;
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

    setWarning(count) {
        this.warning = count;
    }

    getWarning() {
        return this.warning;
    }
}

let players = []


const botName = 'bot';

// Run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        //maintaining players list hasGameStarted, wordToDraw, time, isTimerOn, timer, guessersList, timeLimit
        let player = new Player(username, { roomname: room, hasGameStarted: false, wordToDraw: null, time: 0, isTimerOn: false, guessersList: [], timeLimit: 30, blankWord: null }, socket.id, (players.filter(e => e.getPlayerRoom().roomname === room)).length == 0, (players.filter(e => e.getPlayerRoom().roomname === room)).length == 0, 0, 0)
        players.push(player);
        console.log(players)

        socket.join(player.getPlayerRoom().roomname);


        updateHost(players.filter(e => e.getPlayerRoom().roomname === room));


        // welcome current user, send the message to client side (only to the user that's connecting)
        socket.emit('message', formatMessage(botName, 'welcome to MARS DOODLES!')); // to single client 

        //broadcast when a user connects (emit message to everybody expect the user that's connecting)
        socket.broadcast.to(player.getPlayerRoom().roomname).emit('message', formatMessage(botName, ` ${player.getPlayerName()} has joined the game!`));

        //send users and room info (broadcast to everybody)
        io.to(player.getPlayerRoom().roomname).emit('roomUsers', {
            room: player.getPlayerRoom().roomname,
            users: players.filter(p => p.getPlayerRoom().roomname === room)
        });
    });

    //updates the host for the connected clients
    function updateHost(roomPlayers) {
        console.log('update Host')
        roomPlayers.forEach((player) => {
            console.log(player.getIsHost());
            io.to(player.getPlayerSocID()).emit('setHostClient', player.getIsHost());
        })


        io.to(roomPlayers[0].roomname).emit('roomUsers', {
            room: roomPlayers[0].getPlayerRoom().roomname,
            users: players.filter(p => p.getPlayerRoom().roomname === roomPlayers[0].getPlayerRoom().roomname)
        });
    }

    //if the host leaves to shift the host to someone else
    function setHost(roomPlayers, id) {
        console.log(roomPlayers.length);
        if (roomPlayers.length > 1) {
            let index = Math.floor(Math.random() * (roomPlayers.length))
            while (index == roomPlayers.map(e => e.getPlayerSocID).indexOf(id)) {
                index = Math.floor(Math.random() * (roomPlayers.length))
            }

            for (let i = 0; i < roomPlayers.length; i++) {
                if (i == index) {
                    players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[i].getPlayerSocID())].setIsHost(true);

                }
                else {
                    players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[i].getPlayerSocID())].setIsHost(false);
                }
            }
        }
        /* else if(roomPlayers.length == 2)
        {
            console.log(roomPlayers[0].isHost)
            if(roomPlayers[0].isHost){
                players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[1].getPlayerSocID())].setIsRoomOwner(true);
                players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[0].getPlayerSocID())].setIsRoomOwner(false);
            }
            else {
                players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[1].getPlayerSocID())].setIsRoomOwner(false);
                players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[0].getPlayerSocID())].setIsRoomOwner(true);
            }
        } */
        else
            players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[0].getPlayerSocID())].setIsHost(true);
        updateHost(roomPlayers);
    }


    //if the Room Owner leaves to shift the owner to someone else
    function setRoomOwner(roomPlayers, id) {
        if (roomPlayers.length > 1) {
            let index = Math.floor(Math.random() * (roomPlayers.length))
            while (index == roomPlayers.map(e => e.getPlayerSocID).indexOf(id)) {
                index = Math.floor(Math.random() * (roomPlayers.length))
            }

            for (let i = 0; i < roomPlayers.length; i++) {
                if (i == index) {
                    players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[i].getPlayerSocID())].setIsRoomOwner(true);
                }
                else {
                    players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[i].getPlayerSocID())].setIsRoomOwner(false);
                }
            }
        }
        else
            players[players.map(e => e.getPlayerSocID()).indexOf(roomPlayers[0].getPlayerSocID())].setIsRoomOwner(true);

    }

    //function to generate the random word for the host to draw
    function randomWordGenerator() {
        let index = Math.floor(Math.random() * (words.length));
        return words[index];
    }


    //On the event when correct word is guessed
    socket.on('wordGuessed', () => {
        let r = players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)];
        r.setScore(r.getScore() + 100 + ((r.getPlayerRoom().timeLimit - r.getPlayerRoom().time) - ((r.getPlayerRoom().timeLimit - r.getPlayerRoom().time) % 10)));
        // to the one who has guessed correctly
        io.to(r.getPlayerRoom().roomname).emit('roomUsers', {
            room: r.getPlayerRoom().roomname,
            users: players.filter(p => p.getPlayerRoom().roomname === r.getPlayerRoom().roomname)
        });
        socket.emit('message', formatMessage(botName, 'You Have Guessed Correctly!')); // to single client 
        //to the everyone else
        socket.broadcast.to(r.getPlayerRoom().roomname).emit('message', formatMessage(botName, ` ${players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerName()} has guessed correctly!`));
    })

    function formatTime(t) { // formats the time in the correct structure
        let min = Math.floor(t / 60);
        let sec = t - (min * 60);
        min = min >= 10 ? min : '0' + min;
        sec = sec >= 10 ? sec : '0' + sec;
        return min + ':' + sec;
    }


    function showWinner(roomPlayers) { // sets the leaderboard array 
        let p = roomPlayers;
        p.sort((a, b) => {
            return b.getScore() - a.getScore();
        })
        let gList = [];
        if (p[0].getScore() > 0) {
            gList.push(p[0]);
            for (let i = 1; i < p.length; i++) {
                if (p[i].getScore() == gList[0].getScore())
                    gList.push(p[i]);
            }
        }
        io.to(roomPlayers[0].getPlayerRoom().roomname).emit('displayWinners', gList); //relays the leaderboard to all the clients
    }

    function startTimer(sId){
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(sId)].getPlayerRoom().roomname);
        roomPlayers.forEach(p => {
            if (p.isTimerOn) {
                if (p.time == p.timeLimit) {// Time limit
                    showWinner(roomPlayers);
                    p.isTimerOn = false;
                    p.hasGameStarted = false;
                    p.wordToDraw = null;
                    p.time = 0;
                    if (p.isHost) {
                        p.timer = null;
                        setHost(roomPlayers, p.socID);
                    }
                    io.to(roomPlayers[0].getPlayerRoom().roomname).emit('timeSet', '00:00')
                    io.to(roomPlayers[0].getPlayerRoom().roomname).emit('startPaint', false);
                    io.to(roomPlayers[0].getPlayerRoom().roomname).emit('drawEnd')
                }
                else {
                    let t = formatTime(p.timeLimit - p.time);
                    io.to(roomPlayers[0].getPlayerRoom().roomname).emit('timeSet', t);
                    p.time += 1;
                }
            }
        })
        setTimeout(startTimer.bind(null,sId), 1000);
    }

    //function to filter the chats and blocking all the bad words
    function check(msg) {
        return filter.clean(msg);
    }

    //listen for chatMessage
    socket.on('chatMessage', (msg) => {
        let nmsg = check(msg);
        const user = players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)];
        console.log(user)
        io.to(user.getPlayerRoom().roomname).emit('message', formatMessage(user.getPlayerName(), nmsg));  // server send the message to everybody
        if (nmsg != msg) {
            if (user.getWarning() == 0) {
                socket.emit('message', formatMessage(botName, '⚠️Warning: DO NOT USE SUCH LANGUAGE OTHERWISE YOU WILL BE PENALISED!!'));
                user.setWarning(user.getWarning() + 1);
            }
            else if (user.getWarning() == 1) {
                socket.emit('message', formatMessage(botName, '⚠️Warning: YOU AGAIN! 50pts deducted ! LAST WARNING ELSE YOU WILL BE KICKED!!'));
                user.setScore(user.getScore() - 50);
                io.to(user.getPlayerRoom().roomname).emit('roomUsers', {
                    room: user.getPlayerRoom().roomname,
                    users: players.filter(p => p.getPlayerRoom().roomname === user.getPlayerRoom().roomname)
                });
                user.setWarning(user.getWarning() + 1);
            }
            else {
                socket.emit('diconnectUser');
                user.setWarning(user.getWarning() + 1);
            }
        }
    });


    // Runs when client disconnects
    socket.on('disconnect', () => {
        let lp = players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)];
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === lp.getPlayerRoom().roomname);
        if (lp.isHost == true)
            setHost(roomPlayers, socket.id);
        /* if (lp.isRoomOwner == true)
            setRoomOwner(roomPlayers, socket.id); */
        players.splice(players.map(p => p.getPlayerSocID()).indexOf(socket.id), 1)
        //broadcast to everybody that the user has left the game
        io.to(lp.getPlayerRoom().roomname).emit('message', formatMessage(botName, `${lp.playerName} has left the game!`));
        //send users and room info
        io.to(lp.getPlayerRoom().roomname).emit('roomUsers', {
            room: lp.getPlayerRoom().roomname,
            users: players.filter(p => p.getPlayerRoom().roomname === lp.getPlayerRoom().roomname)
        });
    });

    socket.on('position', position => {
        // Broadcast the message to all clients
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        socket.broadcast.to(roomPlayers[0].getPlayerRoom().roomname).emit('otherPOS', position);
    });

    function blanks(wordToDraw) {
        var blank = "";
        var n = wordToDraw.length;
        let count = Math.ceil(Math.log(n));
        let c = Math.floor(Math.random() * n);
        for (var i = 0; i < n; i++) {
            let r = Math.floor(Math.random() * n)
            if (r == c && count >= 0) {
                blank = blank + wordToDraw[i];
                count--;
            }
            else {
                blank = blank + "_ ";
            }
        }
        return blank.trim();
    }

    socket.on('startGame', () => {
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        let w = randomWordGenerator();
        let b = blanks(w);
        console.log(w)
        console.log(b)
        roomPlayers.forEach((p) => {
            p.wordToDraw = w;
            p.isTimerOn = true;
            p.blankWord = b;
            p.hasGameStarted = true;
            p.timeLimit = 30;
            p.time = 0;
        })
        startTimer(socket.id);
        /* let wordstartgame = randomWordGenerator()
        wordToDraw = wordstartgame;
        isTimerOn = true;
        startTimer(socket.id);
        let blankWord = blanks();
        hasGameStarted = true; */

        io.to(roomPlayers[0].getPlayerRoom().roomname).emit('gameStarted', { w: roomPlayers[0].wordToDraw, b: roomPlayers[0].blankWord });

        gameStart(roomPlayers);
    });

    socket.on('penColor', hexValue => {
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        console.log(roomPlayers);
        io.to(roomPlayers[0].getPlayerRoom().roomname).emit('penColor', hexValue);

    });

    socket.on('clearCanvas', () => {
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        io.to(roomPlayers[0].getPlayerRoom().roomname).emit('clearCanvas');
    });



    socket.on('startPaint', paint => {
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        socket.broadcast.to(roomPlayers[0].getPlayerRoom().roomname).emit('startPaint', paint);

    });

    function gameStart(roomPlayers) {
        socket.broadcast.to(roomPlayers[0].getPlayerRoom().roomname).emit('startPaint', true);
    }


    socket.on('saveStateServer', () => {
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        io.to(roomPlayers[0].getPlayerRoom().roomname).emit('saveStateClient');
    })

    socket.on('retrieveState', () => {
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        io.to(roomPlayers[0].getPlayerRoom().roomname).emit('setState');
    })

    socket.on('restoreStateServer', () => {
        let roomPlayers = players.filter(p => p.getPlayerRoom().roomname === players[players.map(e => e.getPlayerSocID()).indexOf(socket.id)].getPlayerRoom().roomname);
        io.to(roomPlayers[0].getPlayerRoom().roomname).emit('restoreStateClient');
    })


    socket.on('removePlayer', (sId) => {
        socket.broadcast.to(sId.toString()).emit('diconnectUser');
    })
});





const PORT = process.env.PORT || 3000; //check if there's a environment variable named port

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));



