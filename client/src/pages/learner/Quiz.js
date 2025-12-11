import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import './Quiz.css';

const Quiz = ({ courseId, onClose, onPass }) => {
    const [questions, setQuestions] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuiz();
    }, [courseId]);

    const fetchQuiz = async () => {
        try {
            const res = await api.get(`/learner/courses/${courseId}/quiz`);
            setQuestions(res.data.questions);
            setLoading(false);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to load quiz');
            onClose();
        }
    };

    const handleAnswerSelect = (questionId, answerIndex) => {
        setSelectedAnswers({
            ...selectedAnswers,
            [questionId]: answerIndex
        });
    };

    const handleSubmit = async () => {
        // Check if all questions are answered
        if (Object.keys(selectedAnswers).length !== questions.length) {
            alert('Please answer all questions before submitting');
            return;
        }

        setSubmitting(true);
        try {
            const answers = questions.map(q => ({
                questionId: q._id,
                selectedAnswer: selectedAnswers[q._id]
            }));

            const res = await api.post(`/learner/courses/${courseId}/quiz/submit`, { answers });
            setResult(res.data);

            if (res.data.passed) {
                setTimeout(() => {
                    onPass();
                }, 3000);
            }
        } catch (err) {
            alert('Failed to submit quiz');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="quiz-modal">
                <div className="quiz-container">
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading quiz...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="quiz-modal">
                <div className="quiz-container">
                    <div className="quiz-result">
                        <div className={`result-icon ${result.passed ? 'success' : 'fail'}`}>
                            {result.passed ? '🎉' : '😔'}
                        </div>
                        <h2>{result.passed ? 'Congratulations!' : 'Try Again'}</h2>
                        <div className="score-display">
                            <span className="score">{result.score}</span>
                            <span className="total">/ {result.totalQuestions}</span>
                        </div>
                        <p className="result-message">{result.message}</p>
                        {result.passed ? (
                            <div className="alert alert-success">
                                ✅ Course completed! Certificate generated.
                            </div>
                        ) : (
                            <button onClick={onClose} className="btn btn-primary">
                                Try Again Later
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    const currentQ = questions[currentQuestion];

    return (
        <div className="quiz-modal">
            <div className="quiz-container">
                <div className="quiz-header">
                    <h2>Course Completion Quiz</h2>
                    <p>Answer all 10 questions. You need 8/10 to pass.</p>
                    <div className="quiz-progress">
                        <span>Question {currentQuestion + 1} of {questions.length}</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                <div className="quiz-content">
                    <h3 className="question-text">{currentQ.question}</h3>
                    <div className="options-list">
                        {currentQ.options.map((option, index) => (
                            <div
                                key={index}
                                className={`option-item ${selectedAnswers[currentQ._id] === index ? 'selected' : ''}`}
                                onClick={() => handleAnswerSelect(currentQ._id, index)}
                            >
                                <div className="option-radio">
                                    {selectedAnswers[currentQ._id] === index && <div className="radio-dot"></div>}
                                </div>
                                <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                                <span className="option-text">{option}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="quiz-footer">
                    <button
                        onClick={() => setCurrentQuestion(currentQuestion - 1)}
                        disabled={currentQuestion === 0}
                        className="btn btn-secondary"
                    >
                        Previous
                    </button>

                    {currentQuestion < questions.length - 1 ? (
                        <button
                            onClick={() => setCurrentQuestion(currentQuestion + 1)}
                            className="btn btn-primary"
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || Object.keys(selectedAnswers).length !== questions.length}
                            className="btn btn-success"
                        >
                            {submitting ? 'Submitting...' : 'Submit Quiz'}
                        </button>
                    )}
                </div>

                <button onClick={onClose} className="quiz-close-btn">✕</button>
            </div>
        </div>
    );
};

export default Quiz;
