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


var playerIndex = 0;
var hasGameStarted = false;
var wordToDraw = null;
var cancelChooseWordTimer;
var chooseWordTime = 20; // in seconds
var drawTime = 80; // in seconds
var wordOptions = [];
var chosenPlayer;
var guessersList = [];
var scoreBoard = [];


class Player {
    constructor(playerName, socID, isHost, isRoomOwner) {
        this.playerName = playerName;
        this.socID = socID;
        this.isHost = isHost;
        this.isRoomOwner=isRoomOwner;
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

        let p = new Player(username, socket.id, players.length == 0, players.length == 0)
        players.push(p);
        console.log(players)
        

        // welcom current user
        socket.emit('message', formatMessage(botName, 'welcome to  the chatCord!')); // to single client 

        //broadcast when a user connect
        socket.broadcast.to(user.room).emit('message', formatMessage(botName, ` ${user.username} has joined the chat!`));

        //send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    });

    


    //listen for chaTMeSSAGE 
    socket.on('chatMessage', (msg) => {
        const user = getCurrentUser(socket.id);
        io.to(user.room).emit('message', formatMessage(user.username, msg));
    });

    socket.on('checkDrawer', (e) => {
        if(socket.id == players[0].getPlayerSocID())
            io.broadcast.emit('replicatedDrawing', e);
    })
    
    socket.on('setPosition', (e) => {
        if(socket.id == players[0].getPlayerSocID())
            io.broadcast.emit('replicatedPosition', e);
    })

    // runs when client disconnects
    socket.on('disconnect', () => {
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
        socket.broadcast.emit('gameStarted');
        hasGameStarted = true;
        gameStart();
    });

    socket.on('penColor', hexValue => {
        io.sockets.emit('penColor', hexValue);

    });

    socket.on('clearCanvas', () => {
        io.sockets.emit('clearCanvas');
    });

    socket.broadcast.emit('startPaint', true);

});





const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));



