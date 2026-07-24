import React, { useState, useEffect } from 'react'

const SAMPLE_QUESTIONS = [
  {
    id: 1,
    question: "Which keyword defines a constant variable in JavaScript?",
    options: ["const", "let", "var", "constant"],
    correctAnswer: 0,
    timeLimit: 15
  },
  {
    id: 2,
    question: "What does HTML stand for?",
    options: [
      "Hyper Text Preprocessor",
      "Hyper Text Markup Language",
      "Hyper Text Multiple Language",
      "Hyper Tool Multi Language"
    ],
    correctAnswer: 1,
    timeLimit: 15
  },
  {
    id: 3,
    question: "Which hook is used for side-effects in React?",
    options: ["useState", "useReducer", "useEffect", "useContext"],
    correctAnswer: 2,
    timeLimit: 15
  }
]

export default function App() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedOption, setSelectedOption] = useState(null)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SAMPLE_QUESTIONS[0].timeLimit)
  const [isFinished, setIsFinished] = useState(false)

  const currentQ = SAMPLE_QUESTIONS[currentIndex]

  // Timer Logic
  useEffect(() => {
    if (isFinished) return
    if (timeLeft <= 0) {
      handleNext()
      return
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, isFinished])

  const handleOptionSelect = (index) => {
    if (selectedOption !== null) return // Prevent changing option
    setSelectedOption(index)
    if (index === currentQ.correctAnswer) {
      setScore(prev => prev + 10)
    }
  }

  const handleNext = () => {
    if (currentIndex + 1 < SAMPLE_QUESTIONS.length) {
      setCurrentIndex(prev => prev + 1)
      setSelectedOption(null)
      setTimeLeft(SAMPLE_QUESTIONS[currentIndex + 1].timeLimit)
    } else {
      setIsFinished(true)
    }
  }

  const handleRestart = () => {
    setCurrentIndex(0)
    setSelectedOption(null)
    setScore(0)
    setTimeLeft(SAMPLE_QUESTIONS[0].timeLimit)
    setIsFinished(false)
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {isFinished ? (
          <div style={styles.resultBox}>
            <h2>🎉 Quiz Completed!</h2>
            <p style={styles.scoreText}>Your Final Score: <strong>{score}</strong> / {SAMPLE_QUESTIONS.length * 10}</p>
            <button style={styles.button} onClick={handleRestart}>Play Again 🔄</button>
          </div>
        ) : (
          <div>
            <div style={styles.header}>
              <span style={styles.badge}>Question {currentIndex + 1}/{SAMPLE_QUESTIONS.length}</span>
              <span style={{ ...styles.badge, backgroundColor: timeLeft <= 5 ? '#ff4d4f' : '#1890ff' }}>
                ⏱️ {timeLeft}s
              </span>
            </div>

            <h3 style={styles.question}>{currentQ.question}</h3>

            <div style={styles.optionsGrid}>
              {currentQ.options.map((option, idx) => {
                let btnStyle = { ...styles.optionBtn }
                if (selectedOption !== null) {
                  if (idx === currentQ.correctAnswer) {
                    btnStyle.backgroundColor = '#52c41a' // Green for correct
                    btnStyle.color = '#fff'
                  } else if (idx === selectedOption) {
                    btnStyle.backgroundColor = '#ff4d4f' // Red for wrong
                    btnStyle.color = '#fff'
                  }
                }
                return (
                  <button
                    key={idx}
                    style={btnStyle}
                    onClick={() => handleOptionSelect(idx)}
                    disabled={selectedOption !== null}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            <div style={styles.footer}>
              <span style={styles.scoreBoard}>Score: {score}</span>
              <button
                style={{ ...styles.button, opacity: selectedOption === null ? 0.6 : 1 }}
                onClick={handleNext}
                disabled={selectedOption === null}
              >
                {currentIndex + 1 === SAMPLE_QUESTIONS.length ? "Finish Quiz 🏁" : "Next Question ➔"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Inline Styling
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#f8fafc',
    padding: '20px'
  },
  card: {
    backgroundColor: '#1e293b',
    padding: '30px',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  badge: {
    backgroundColor: '#334155',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: 'bold'
  },
  question: {
    fontSize: '20px',
    marginBottom: '24px',
    lineHeight: '1.4'
  },
  optionsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },
  optionBtn: {
    padding: '14px 18px',
    borderRadius: '10px',
    border: '1px solid #475569',
    backgroundColor: '#334155',
    color: '#f8fafc',
    fontSize: '16px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s ease'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '20px'
  },
  scoreBoard: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#38bdf8'
  },
  button: {
    backgroundColor: '#6366f1',
    color: '#fff',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  resultBox: {
    textAlign: 'center',
    padding: '20px 0'
  },
  scoreText: {
    fontSize: '18px',
    margin: '20px 0 30px 0'
  }
}