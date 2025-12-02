'use client';

import { useState } from 'react';

interface InteractiveQuizProps {
  onComplete: () => void;
}

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function InteractiveQuiz({ onComplete }: InteractiveQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      question: "Qu'est-ce qu'un Fonds d'investissement ?",
      options: [
        "Un compte bancaire avec intérêts élevés",
        "Un véhicule financier collectant l'argent de plusieurs investisseurs pour investir collectivement",
        "Une action d'une seule entreprise",
        "Un prêt accordé par une banque"
      ],
      correctAnswer: 1,
      explanation: "Un Fonds d'investissement est un véhicule financier conçu pour collecter l'argent de plusieurs investisseurs et l'investir de manière collective et professionnelle dans un portefeuille diversifié d'actifs."
    },
    {
      id: 2,
      question: "Quelle est la différence principale entre OPC et Private Equity ?",
      options: [
        "Le montant minimum d'investissement",
        "OPC concerne le marché coté, Private Equity le marché non coté",
        "La durée de l'investissement",
        "Les frais de gestion"
      ],
      correctAnswer: 1,
      explanation: "Sur le marché coté, nous analysons les Organismes de Placement Collectif (OPC), tandis que sur le marché non coté, il est question du Private Equity."
    },
    {
      id: 3,
      question: "Quel type de fonds OPCVM présente généralement le risque le plus faible ?",
      options: [
        "Fonds Actions",
        "Fonds Mixtes",
        "Fonds Monétaires",
        "Fonds Immobiliers"
      ],
      correctAnswer: 2,
      explanation: "Les Fonds Monétaires investissent dans des titres de créance à court terme et présentent généralement un niveau de risque faible, adaptés pour des placements de trésorerie à court terme."
    },
    {
      id: 4,
      question: "Quelle est la différence entre gestion active et gestion passive ?",
      options: [
        "La gestion active coûte moins cher",
        "La gestion passive cherche à surperformer le marché",
        "La gestion active cherche à surperformer un indice, la passive à le répliquer",
        "Il n'y a pas de différence significative"
      ],
      correctAnswer: 2,
      explanation: "La gestion passive (indicielle) vise à répliquer la performance d'un indice de référence avec des frais généralement plus faibles, tandis que la gestion active cherche à surperformer un indice grâce à la sélection de titres par des gérants."
    },
    {
      id: 5,
      question: "Qu'est-ce qui distingue principalement un FIA d'un OPCVM ?",
      options: [
        "Le FIA utilise des stratégies plus larges et moins conventionnelles",
        "Le FIA est toujours plus rentable",
        "Le FIA n'a pas de frais de gestion",
        "Le FIA est réservé aux banques"
      ],
      correctAnswer: 0,
      explanation: "Le FIA utilise des stratégies d'investissement plus larges et moins conventionnelles, peut détenir des actifs illiquides (Private Equity, Immobilier) et recherche une performance absolue indépendamment de l'évolution du marché."
    },
    {
      id: 6,
      question: "Parmi ces risques, lequel est spécifique aux fonds investis en devises étrangères ?",
      options: [
        "Risque de marché",
        "Risque de change",
        "Risque de liquidité",
        "Risque de concentration"
      ],
      correctAnswer: 1,
      explanation: "Le risque de change concerne spécifiquement les fonds investis en devises étrangères, avec un impact des fluctuations des taux de change sur la valeur de l'investissement."
    }
  ];

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    setShowExplanation(true);
    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const getScoreMessage = () => {
    const percentage = (score / questions.length) * 100;
    if (percentage === 100) return "Parfait ! Vous maîtrisez le sujet ! 🎉";
    if (percentage >= 80) return "Excellent ! Très bonne compréhension ! 👏";
    if (percentage >= 60) return "Bien ! Vous avez de bonnes bases ! 👍";
    if (percentage >= 40) return "Pas mal ! Continuez à apprendre ! 📚";
    return "Continuez vos efforts ! Relisez le contenu ! 💪";
  };

  if (quizCompleted) {
    return (
      <div className="learn-section quiz-section">
        <div className="quiz-completed">
          <div className="completion-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Quiz Terminé !</h2>
          <div className="score-display">
            <div className="score-circle">
              <svg width="200" height="200">
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="12"
                />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="12"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - score / questions.length)}`}
                  transform="rotate(-90 100 100)"
                />
              </svg>
              <div className="score-text">
                <span className="score-number">{score}/{questions.length}</span>
                <span className="score-percentage">{Math.round((score / questions.length) * 100)}%</span>
              </div>
            </div>
          </div>
          <p className="score-message">{getScoreMessage()}</p>
          <div className="quiz-actions">
            <button className="btn-restart" onClick={handleRestartQuiz}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              Recommencer le quiz
            </button>
            <button className="btn-complete" onClick={onComplete}>
              Terminer le guide
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="learn-section quiz-section">
      <div className="section-header">
        <h2 className="section-title">Testez vos connaissances</h2>
        <div className="section-badge">Quiz Interactif</div>
      </div>

      <div className="quiz-progress">
        <div className="progress-info">
          <span>Question {currentQuestion + 1} sur {questions.length}</span>
          <span className="score-info">Score: {score}/{currentQuestion + (showExplanation ? 1 : 0)}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          ></div>
        </div>
      </div>

      <div className="quiz-card">
        <h3 className="question-text">{questions[currentQuestion].question}</h3>
        
        <div className="options-list">
          {questions[currentQuestion].options.map((option, index) => (
            <button
              key={index}
              className={`option-button ${
                selectedAnswer === index ? 'selected' : ''
              } ${
                showExplanation && index === questions[currentQuestion].correctAnswer
                  ? 'correct'
                  : ''
              } ${
                showExplanation && selectedAnswer === index && index !== questions[currentQuestion].correctAnswer
                  ? 'incorrect'
                  : ''
              }`}
              onClick={() => handleAnswerSelect(index)}
              disabled={showExplanation}
            >
              <span className="option-letter">{String.fromCharCode(65 + index)}</span>
              <span className="option-text">{option}</span>
              {showExplanation && index === questions[currentQuestion].correctAnswer && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {showExplanation && selectedAnswer === index && index !== questions[currentQuestion].correctAnswer && (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {showExplanation && (
          <div className={`explanation-box ${
            selectedAnswer === questions[currentQuestion].correctAnswer ? 'correct' : 'incorrect'
          }`}>
            <div className="explanation-header">
              {selectedAnswer === questions[currentQuestion].correctAnswer ? (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  <span>Bonne réponse !</span>
                </>
              ) : (
                <>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>Réponse incorrecte</span>
                </>
              )}
            </div>
            <p className="explanation-text">{questions[currentQuestion].explanation}</p>
          </div>
        )}

        <div className="quiz-actions">
          {!showExplanation ? (
            <button 
              className="btn-submit" 
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
            >
              Valider ma réponse
            </button>
          ) : (
            <button className="btn-next" onClick={handleNextQuestion}>
              {currentQuestion < questions.length - 1 ? 'Question suivante' : 'Voir les résultats'}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
