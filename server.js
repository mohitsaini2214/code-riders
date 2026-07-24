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
//helper: generate 4-digit room pin
function generateRoomPin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

io.on("connection", (socket) => {
  console.log(`[Socket Connected] ID: ${socket.id}`);

  // 1. Host creates a new room
  socket.on("create_room", () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      hostId: socket.id,
      players: {}, // { socketId: { name, score, currentAnswer } }
      questions: SAMPLE_QUESTIONS,
      currentQuestionIndex: 0,
      state: "LOBBY" // LOBBY, QUESTION, REVEAL, LEADERBOARD
    };

    socket.join(roomCode);
    socket.emit("room_created", { roomCode });
    console.log(`Room Created: ${roomCode}`);
  });

  // 2. Player joins an existing room
  socket.on("join_room", ({ roomCode, name }) => {
    const room = rooms[roomCode];

    if (!room) {
      return socket.emit("error_message", "Room does not exist.");
    }
    if (room.state !== "LOBBY") {
      return socket.emit("error_message", "Game has already started.");
    }

    socket.join(roomCode);
    room.players[socket.id] = { name, score: 0, currentAnswer: null, answerTime: 0 };

    // Broadcast updated player list to everyone in the room (especially Host)
    io.to(roomCode).emit("players_updated", Object.values(room.players));
    socket.emit("join_success", { roomCode, name });
  });

  // 3. Host starts the game
  socket.on("start_quiz", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;

    sendQuestion(roomCode);
  });

  // Helper Function: Send Next Question
  function sendQuestion(roomCode) {
    const room = rooms[roomCode];
    if (!room) return;

    const question = room.questions[room.currentQuestionIndex];
    if (!question) {
      // No more questions -> End Game
      room.state = "GAME_OVER";
      io.to(roomCode).emit("game_over", getLeaderboard(room));
      return;
    }

    // Reset player answers for this question
    Object.keys(room.players).forEach((id) => {
      room.players[id].currentAnswer = null;
      room.players[id].answerTime = 0;
    });

    room.state = "QUESTION";
    room.questionStartTime = Date.now();

    // Broadcast question to room (Hide correct answer from payload!)
    io.to(roomCode).emit("question_received", {
      questionIndex: room.currentQuestionIndex,
      totalQuestions: room.questions.length,
      question: question.question,
      options: question.options,
      timeLimit: question.timeLimit
    });
  }

  // 4. Player submits an answer
  socket.on("submit_answer", ({ roomCode, optionIndex }) => {
    const room = rooms[roomCode];
    if (!room || room.state !== "QUESTION") return;

    const player = room.players[socket.id];
    if (!player || player.currentAnswer !== null) return; // Prevent double submitting

    const question = room.questions[room.currentQuestionIndex];
    const timeTaken = (Date.now() - room.questionStartTime) / 1000;

    player.currentAnswer = optionIndex;
    player.answerTime = timeTaken;

    // Calculate score based on speed
    if (optionIndex === question.correctAnswer) {
      const timeBonus = Math.max(0, 1 - timeTaken / question.timeLimit);
      const points = Math.round(500 + 500 * timeBonus); // Up to 1000 pts
      player.score += points;
    }

    socket.emit("answer_submitted", { optionIndex });
  });

  // 5. Host reveals answer and shows current standings
  socket.on("reveal_answer", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;

    room.state = "REVEAL";
    const currentQ = room.questions[room.currentQuestionIndex];

    io.to(roomCode).emit("answer_revealed", {
      correctAnswer: currentQ.correctAnswer,
      leaderboard: getLeaderboard(room)
    });
  });

  // 6. Host triggers next question
  socket.on("next_question", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || room.hostId !== socket.id) return;

    room.currentQuestionIndex += 1;
    sendQuestion(roomCode);
  });

  // Handle Disconnections
  socket.on("disconnect", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (room.players[socket.id]) {
        delete room.players[socket.id];
        io.to(roomCode).emit("players_updated", Object.values(room.players));
      }
    }
  });
});

function getLeaderboard(room) {
  return Object.values(room.players)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5); // Top 5
}

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Quiz Socket Server running on port ${PORT}`));