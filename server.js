//server.js
const express = require('express');
const http = require('http');
const { Server }= require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*",methods: ["GET", "POST"]
    }
});

// in-memory database for active quiz rooms
const rooms = {};

//sample questions set
const questions=[
    {
     id : 1,
     question:"which keyword defines a constant variable in JavaScript?",
     options: ["const", "let", "var", "constant"],
     _correctAnswer: 2,//index of 'const'
     get correctAnswer() {
         return this._correctAnswer;
     },
     set correctAnswer(value) {
         this._correctAnswer = value;
     },
     timelimit: 15
    },
    {
        id:2,
        question:"what protocol powers real-time bi-directional socket connections?",
        options: ["HTTP", "WebSocket", "TCP", "UDP"],
        _correctAnswer: 1,//index of 'WebSocket'
        get correctAnswer() {
            return this._correctAnswer;
        },
        set correctAnswer(value) {
            this._correctAnswer = value;
        },
        timelimit: 10
    }
];