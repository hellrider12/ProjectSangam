const path = require('path');
const http = require('http');
const express = require('express');
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const { userJoin, getCurrentUser, userLeave, getRoomUsers } = require('./utils/users');


const app = express();
const server = http.createServer(app);
const io = socketio(server);
//set static folder
app.use(express.static(path.join(__dirname, 'public')));

/* ---------------------------- vars done ------------------------------ */

var roomName;
var hasGameStarted = false;

/* ---------------------------- vars done ------------------------------ */


var chooseWordTime = 20; // in seconds
var drawTime = 80; // in seconds

var playerIndex = 0;

var wordToDraw = null;
var cancelChooseWordTimer;

var wordOptions = [];
var guessersList = [];
var scoreBoard = [];


class Player {
    constructor(playerName, socID, isHost, isRoomOwner, ) {
        this.playerName = playerName;
        this.socID = socID;
        this.isHost = isHost;
        this.isRoomOwner = isRoomOwner;
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
}

let players = []


const botName = 'bot';
// Run when client connects

io.on('connection', socket => {
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

        //room name setting initially only
        if(players.length == 0)
            roomName = room;

        //maintaining players list
        let p = new Player(username, socket.id, players.length == 0, players.length == 0)
        players.push(p);
        console.log(players)

        updateHost();
        

        // welcome current user
        socket.emit('message', formatMessage(botName, 'welcome to  the chatCord!')); // to single client 

        //broadcast when a user connect
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, ` ${user.username} has joined the chat!`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    //updates the host for the connected clients
    function updateHost() {
        players.forEach((player) => {
            io.to(player.getPlayerSocID()).emit('setHost', player.getIsHost());
        })
    }

    //if the host leaves to shift the host to someone else
    function setHost(indexIdToIgnore = -1) {
        let index = Math.floor(Math.random() * (players.length - 1))
        while(index == indexIdToIgnore){
            index = Math.floor(Math.random() * (players.length - 1))
        }
        
        for (let i = 0; i < players.length; i++) {
            if (i == index ) {
                players[i].setIsHost(true);
                break;
            }
        }
        updateHost();
    }


    //if the Room Owner leaves to shift the owner to someone else
    function setRoomOwner(indexIdToIgnore = -1) {
        let index = Math.floor(Math.random() * (players.length - 1))
        while(index == indexIdToIgnore){
            index = Math.floor(Math.random() * (players.length - 1))
        }
        
        for (let i = 0; i < players.length; i++) {
            if (i == index ) {
                players[i].setIsRoomOwner(true);
                break;
            }
        }
    }


    //listen for chatMessage
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    // runs when client disconnects
    socket.on('disconnect', () => {
        if (players.length > 1) {
            let b=false;
            players.forEach((player) => {
                if (player.getPlayerSocID() == socket.id && !b) {
                    if (player.getIsHost() == true)
                        setHost(players.map(e => e.getPlayerSocID()).indexOf(socket.id));
                    if(player.getIsRoomOwner() == true)
                        setRoomOwner(players.map(e => e.getPlayerSocID()).indexOf(socket.id));
                    players.splice(player, 1)
                    b=true;
                    console.log(players)
                }
            })
        }
        const user = userLeave(socket.id);
        if (user) {
            io.to(user.room).emit('message', formatMessage(botName, `${user.username} has left the chat!`));
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
        io.sockets.emit('gameStarted');
        hasGameStarted = true;
        gameStart();
    });

    socket.on('penColor', hexValue => {
        io.emit('penColor', hexValue);

    });

    socket.on('clearCanvas', () => {
        io.sockets.emit('clearCanvas');
    });

    socket.on('startPaint', paint => {
        socket.broadcast.emit('startPaint', paint);
    });

    function gameStart() {
        socket.broadcast.emit('startPaint', true);
    }

});





const PORT = process.env.PORT || 3000;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));



