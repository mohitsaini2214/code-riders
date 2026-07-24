// src/App.jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import confetti from "canvas-confetti";

// Connect to local backend
const socket = io("http://localhost:4000");

export default function App() {
  const [role, setRole] = useState(null); // 'HOST' or 'PLAYER'
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");
  const [players, setPlayers] = useState([]);
  const [gameState, setGameState] = useState("INIT"); // INIT, LOBBY, QUESTION, REVEAL, END
  
  // Game Play States
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswer, setCorrectAnswer] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    // Socket Event Listeners
    socket.on("room_created", ({ roomCode }) => {
      setRoomCode(roomCode);
      setRole("HOST");
      setGameState("LOBBY");
    });

    socket.on("join_success", ({ roomCode }) => {
      setRoomCode(roomCode);
      setRole("PLAYER");
      setGameState("LOBBY");
    });

    socket.on("players_updated", (updatedPlayers) => {
      setPlayers(updatedPlayers);
    });

    socket.on("question_received", (data) => {
      setCurrentQuestion(data);
      setSelectedAnswer(null);
      setCorrectAnswer(null);
      setGameState("QUESTION");
    });

    socket.on("answer_submitted", ({ optionIndex }) => {
      setSelectedAnswer(optionIndex);
    });

    socket.on("answer_revealed", ({ correctAnswer, leaderboard }) => {
      setCorrectAnswer(correctAnswer);
      setLeaderboard(leaderboard);
      setGameState("REVEAL");
    });

    socket.on("game_over", (finalLeaderboard) => {
      setLeaderboard(finalLeaderboard);
      setGameState("END");
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    });

    socket.on("error_message", (msg) => setError(msg));

    return () => socket.off();
  }, []);

  // --- Actions ---
  const handleCreateRoom = () => socket.emit("create_room");
  const handleJoinRoom = () => {
    if (!roomCode || !name) return setError("Enter Name and Room PIN");
    setError("");
    socket.emit("join_room", { roomCode, name });
  };
  const handleStartGame = () => socket.emit("start_quiz", { roomCode });
  const handleSelectOption = (index) => socket.emit("submit_answer", { roomCode, optionIndex: index });
  const handleRevealAnswer = () => socket.emit("reveal_answer", { roomCode });
  const handleNextQuestion = () => socket.emit("next_question", { roomCode });

  // --- UI Renders ---
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      {/* 1. INITIAL ROLE SELECTION */}
      {gameState === "INIT" && (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md text-center shadow-xl">
          <h1 className="text-3xl font-extrabold text-indigo-400 mb-6">⚡ Live Quiz Hack</h1>
          {error && <p className="text-red-400 mb-4 text-sm font-semibold">{error}</p>}

          <button
            onClick={handleCreateRoom}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold mb-4 transition"
          >
            Create Room (Host)
          </button>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-slate-700"></div>
            <span className="flex-shrink mx-4 text-slate-500 text-xs font-bold uppercase">Or Join</span>
            <div className="flex-grow border-t border-slate-700"></div>
          </div>

          <input
            type="text"
            placeholder="Room PIN"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl mt-2 mb-3 text-center text-lg font-bold tracking-widest uppercase focus:outline-none focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Your Nickname"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl mb-4 text-center text-lg focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleJoinRoom}
            className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold transition"
          >
            Join Game
          </button>
        </div>
      )}

      {/* 2. LOBBY STATE */}
      {gameState === "LOBBY" && (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-xl text-center shadow-xl">
          <p className="text-slate-400 font-medium">ROOM PIN</p>
          <h2 className="text-6xl font-black text-indigo-400 tracking-widest my-2">{roomCode}</h2>

          <div className="my-6">
            <h3 className="text-lg font-semibold mb-3 text-slate-300">Joined Players ({players.length})</h3>
            <div className="flex flex-wrap gap-2 justify-center max-h-48 overflow-y-auto p-2">
              {players.map((p, idx) => (
                <span key={idx} className="bg-slate-700 text-indigo-300 px-4 py-1.5 rounded-full font-semibold text-sm">
                  {p.name}
                </span>
              ))}
            </div>
          </div>

          {role === "HOST" ? (
            <button
              onClick={handleStartGame}
              disabled={players.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 py-3 rounded-xl font-bold text-lg transition"
            >
              Start Game
            </button>
          ) : (
            <p className="text-slate-400 animate-pulse">Waiting for host to start...</p>
          )}
        </div>
      )}

      {/* 3. QUESTION STATE */}
      {gameState === "QUESTION" && currentQuestion && (
        <div className="w-full max-w-2xl">
          <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl mb-6 text-center">
            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">
              Question {currentQuestion.questionIndex + 1} of {currentQuestion.totalQuestions}
            </p>
            <h2 className="text-2xl font-bold mb-4">{currentQuestion.question}</h2>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-2 gap-4">
            {currentQuestion.options.map((opt, idx) => {
              const colors = ["bg-red-600", "bg-blue-600", "bg-amber-600", "bg-emerald-600"];
              const isSelected = selectedAnswer === idx;

              return (
                <button
                  key={idx}
                  disabled={role === "HOST" || selectedAnswer !== null}
                  onClick={() => handleSelectOption(idx)}
                  className={`${colors[idx % 4]} p-6 rounded-xl font-bold text-lg text-left shadow-lg transition transform active:scale-95 disabled:opacity-80 relative ${
                    isSelected ? "ring-4 ring-white" : ""
                  }`}
                >
                  {opt}
                  {isSelected && <span className="absolute top-2 right-2 text-xs bg-black/40 px-2 py-0.5 rounded">Selected</span>}
                </button>
              );
            })}
          </div>

          {/* Host Controls */}
          {role === "HOST" && (
            <button
              onClick={handleRevealAnswer}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold transition"
            >
              Reveal Answer
            </button>
          )}
        </div>
      )}

      {/* 4. REVEAL / LEADERBOARD STATE */}
      {gameState === "REVEAL" && (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md shadow-xl text-center">
          <h2 className="text-2xl font-bold mb-2">Correct Answer:</h2>
          <p className="text-xl font-extrabold text-emerald-400 mb-6">
            {currentQuestion.options[correctAnswer]}
          </p>

          <h3 className="text-lg font-bold text-slate-300 mb-3 border-b border-slate-700 pb-2">Top Leaderboard</h3>
          <div className="space-y-2 mb-6">
            {leaderboard.map((p, idx) => (
              <div key={idx} className="flex justify-between bg-slate-900 p-3 rounded-lg font-semibold">
                <span>{idx + 1}. {p.name}</span>
                <span className="text-indigo-400">{p.score} pts</span>
              </div>
            ))}
          </div>

          {role === "HOST" && (
            <button
              onClick={handleNextQuestion}
              className="w-full bg-emerald-600 hover:bg-emerald-500 py-3 rounded-xl font-bold transition"
            >
              Next Question ➔
            </button>
          )}
        </div>
      )}

      {/* 5. GAME OVER STATE */}
      {gameState === "END" && (
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 w-full max-w-md text-center shadow-xl">
          <h1 className="text-4xl font-black text-amber-400 mb-4">🏆 Game Over!</h1>
          <div className="space-y-3 mb-6">
            {leaderboard.map((p, idx) => (
              <div key={idx} className={`flex justify-between p-4 rounded-xl font-bold ${idx === 0 ? "bg-amber-500/20 border border-amber-500 text-amber-300" : "bg-slate-900"}`}>
                <span>{idx === 0 ? "👑 " : ""}{p.name}</span>
                <span>{p.score} pts</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 py-3 rounded-xl font-bold transition"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}