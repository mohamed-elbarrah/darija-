import React, { useState, useEffect } from 'react';

// ===============================================
// DUMMY LESSON DATA (FOR DEMO/PREVIEW)
// ===============================================

// Helper to parse the Fill-in-the-Blanks text template (e.g., "Shno {smeetk}?")
const parseFillInBlanks = (template) => {
    if (!template) return { sentenceTemplate: [], correctWords: [] };
    const parts = template.split(/(\{.*?\})/g).filter(p => p.length > 0);
    const sentenceTemplate = [];
    let blankIndex = 0;
    const correctWords = [];

    parts.forEach(part => {
        if (part.startsWith('{') && part.endsWith('}')) {
            const word = part.substring(1, part.length - 1).trim();
            sentenceTemplate.push({ blank: blankIndex, correct: word });
            correctWords.push(word);
            blankIndex++;
        } else {
            sentenceTemplate.push({ text: part });
        }
    });

    return { sentenceTemplate, correctWords };
};


export const DUMMY_LESSON_DATA = {
    title: "Lesson 1: Greetings and Goodbyes",
    objectives: [
        "Use greeting and goodbye expressions.",
        "Correctly use Nta/Nty.",
    ],
    introParts: [
        "Welcome! This lesson covers basic Moroccan Darija greetings and goodbyes.",
        "🗣️ GramStop: The pronoun 'you' has two versions: Nta (Masculine) and Nty (Feminine)."
    ],
    activities: [
        // --- ACTIVITY 1: Multiple Choice ---
        {
            id: 1,
            type: "multiple-choice",
            question: { 
                translation: "What is the correct way to say 'Good morning'?", 
                audioUrl: "/audio/q_morning.mp3" 
            },
            options: [
                { text: "Msa L5eer", translation: "Good evening", audioUrl: "/audio/msa_l5eer.mp3", isCorrect: false },
                { text: "Sba7 L5eer", translation: "Good morning", audioUrl: "/audio/sba7_l5eer.mp3", isCorrect: true },
                { text: "B'slama", translation: "Goodbye", audioUrl: "/audio/bslama.mp3", isCorrect: false },
            ],
            feedback: "Sba7 L5eer literally means 'Morning of goodness'."
        },
        // --- ACTIVITY 2: Fill-in-the-Blanks with Word Blocks ---
        {
            id: 2,
            type: "fill-in-blanks",
            question: { 
                text: "Smeety Alex, o {nty}?", 
                translation: "How about you? (Addressing a female)", 
                audioUrl: "/audio/q_blanks.mp3" 
            }, 
            wordPool: ["nta", "nty", "Labass", "Smeetk"],
            feedback: "Remember to use NTY when asking a female.",
        },
        // --- ACTIVITY 3: Dialogue / Listening ---
        {
            id: 3,
            type: "dialogue",
            question: { translation: "Read and listen to the conversation:", audioUrl: null },
            items: [
                { text: "Salam!", translation: "Hello!", audioUrl: "/audio/salam.mp3" },
                { text: "Wa 3alaykum assalam!", translation: "Hello (response)!", audioUrl: "/audio/wa_salam.mp3" },
                { text: "Keedayr?", translation: "How are you? (Masc)", audioUrl: "/audio/keedayr.mp3" },
            ],
            feedback: "This is a typical short greeting exchange."
        },
        // --- ACTIVITY 4: Match Image ---
        {
            id: 4,
            type: "match-image",
            question: { translation: "Match the phrase with the correct emoji:", audioUrl: "/audio/q_match.mp3" },
            pairs: [
                { text: "Tsb7 3la 5eer", translation: "Good night", image: "🌃", audioUrl: "/audio/tsb7.mp3", id: 'p1' },
                { text: "B'slama", translation: "Goodbye", image: "👋", audioUrl: "/audio/bslama.mp3", id: 'p3' },
                { text: "Msa L5eer", translation: "Good evening", image: "🌇", audioUrl: "/audio/msa_l5eer.mp3", id: 'p2' },
            ],
            feedback: "Good use of visual aids!"
        },
    ]
};


// ===============================================
// UTILITY COMPONENTS
// ===============================================

const AudioPlayer = ({ src, label }) => {
    const handlePlay = () => alert(`Simulating playback for: ${src ? src.split('/').pop() : 'N/A'} (${label})`);
    if (!src) return null;
    return (
        <button onClick={handlePlay} className="ml-2 text-indigo-600 hover:text-indigo-800 focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
        </button>
    );
};

// ===============================================
// MAIN LEARNER COMPONENT
// ===============================================

const LearnerLessonView = ({ lessonData }) => {
    const [step, setStep] = useState(0); 
    const [isAnswered, setIsAnswered] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState(null); 
    const [matchingState, setMatchingState] = useState({});
    const [blanksState, setBlanksState] = useState({}); 
    const [availableWords, setAvailableWords] = useState([]);

    const totalSteps = lessonData.activities.length + 1; 
    const currentContent = step === 0 ? lessonData : lessonData.activities[step - 1];
    const isActivity = step > 0;
    
    // Derived state for Fill-in-the-Blanks
    const { sentenceTemplate, correctWords } = isActivity && currentContent.type === 'fill-in-blanks' 
        ? parseFillInBlanks(currentContent.question.text) 
        : { sentenceTemplate: [], correctWords: [] };
    
    const blankParts = sentenceTemplate.filter(p => p.blank !== undefined);
    const allBlanksFilled = Object.keys(blanksState).length === blankParts.length;


    // Effect to initialize word blocks when activity changes
    useEffect(() => {
        if (isActivity && currentContent.type === 'fill-in-blanks' && !isAnswered) {
            setAvailableWords([...currentContent.wordPool].sort(() => Math.random() - 0.5));
            setBlanksState({});
        }
    }, [step, isAnswered]);


    // --- HANDLERS ---
    
    const handleWordBlockTap = (word) => {
        if (isAnswered) return;

        const nextBlankIndex = blankParts.find(p => blanksState[p.blank] === undefined)?.blank;

        if (nextBlankIndex !== undefined) {
            setBlanksState(prev => ({ ...prev, [nextBlankIndex]: word }));
            setAvailableWords(prev => prev.filter(w => w !== word));
        }
    };

    const handleBlankClick = (blankIndex) => {
        if (isAnswered) return;
        const wordToReturn = blanksState[blankIndex];
        if (wordToReturn) {
            setBlanksState(prev => {
                const newState = { ...prev };
                delete newState[blankIndex];
                return newState;
            });
            setAvailableWords(prev => [...prev, wordToReturn].sort(() => Math.random() - 0.5));
        }
    };

    const handleAnswerSelect = (answerId) => {
        if (isAnswered) return;
        setSelectedAnswer(answerId);
    };

    const checkAnswer = () => {
        if (step === 0) { setIsCorrect(true); setIsAnswered(true); return; }

        let correct = false;
        
        switch (currentContent.type) {
            case 'multiple-choice':
                correct = currentContent.options.find(opt => opt.text === selectedAnswer)?.isCorrect || false;
                break;

            case 'fill-in-blanks':
                correct = blankParts.every(part => blanksState[part.blank] === part.correct);
                break;
                
            case 'dialogue':
            case 'match-image':
            case 'ordering':
                correct = true;
                break;

            default:
                correct = false;
        }

        setIsCorrect(correct);
        setIsAnswered(true);
    };

    const handleContinue = () => {
        if (step < totalSteps) {
            setStep(step + 1);
            setIsAnswered(false);
            setIsCorrect(false);
            setSelectedAnswer(null);
            setBlanksState({}); 
            setMatchingState({});
        }
    };

    // --- RENDER FUNCTIONS FOR ACTIVITIES ---

    const renderActivityContent = (activity) => {
        switch (activity.type) {
            case 'multiple-choice':
                return (
                    <div className="space-y-3">
                        {activity.options.map((opt, i) => (
                            <button
                                key={i}
                                onClick={() => handleAnswerSelect(opt.text)}
                                disabled={isAnswered}
                                className={`w-full p-4 border rounded-lg text-left transition text-gray-800 ${
                                    isAnswered && opt.isCorrect ? 'bg-green-100 border-green-500' :
                                    isAnswered && opt.text === selectedAnswer && !opt.isCorrect ? 'bg-red-100 border-red-500' :
                                    opt.text === selectedAnswer ? 'bg-indigo-100 border-indigo-500' :
                                    'bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <span className="font-bold">{opt.text}</span>
                                <span className="text-sm ml-2 text-gray-500">({opt.translation})</span>
                                <AudioPlayer src={opt.audioUrl} label={opt.text} />
                            </button>
                        ))}
                    </div>
                );

            case 'fill-in-blanks':
                return (
                    <div className="space-y-8">
                        {/* 1. Sentence with Blanks */}
                        <div className="text-3xl font-bold flex flex-wrap justify-center space-x-2 min-h-[100px] items-center">
                            {sentenceTemplate.map((part, i) => {
                                if (part.text) {
                                    return <span key={i} className="text-gray-700">{part.text}</span>;
                                } else if (part.blank !== undefined) {
                                    const word = blanksState[part.blank];
                                    const isFinalCorrect = isAnswered && word === part.correct;
                                    const isFinalIncorrect = isAnswered && word !== part.correct;

                                    return (
                                        <button 
                                            key={i} 
                                            onClick={() => handleBlankClick(part.blank)} 
                                            disabled={isAnswered || !word}
                                            className={`p-2 border-b-2 font-semibold text-center transition-all min-w-[80px] rounded-sm ${
                                                !word ? 'border-gray-500 text-gray-500' : 
                                                isFinalCorrect ? 'bg-green-200 border-green-700 text-green-800' :
                                                isFinalIncorrect ? 'bg-red-200 border-red-700 text-red-800' :
                                                'bg-indigo-100 border-indigo-500 text-indigo-700 hover:bg-indigo-200'
                                            }`}
                                        >
                                            {word || "____"}
                                        </button>
                                    );
                                }
                                return null;
                            })}
                        </div>
                        
                        {/* 2. Word Blocks */}
                        <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                            <h4 className="text-sm font-semibold mb-3 text-gray-700">Tap to select:</h4>
                            <div className="flex flex-wrap justify-center gap-3">
                                {availableWords.map((word, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => handleWordBlockTap(word)} 
                                        disabled={isAnswered || allBlanksFilled}
                                        className="bg-indigo-500 text-white py-2 px-4 rounded-full shadow-md hover:bg-indigo-600 transition disabled:bg-gray-400"
                                    >
                                        {word}
                                    </button>
                                ))}
                            </div>
                            {isAnswered && !isCorrect && (
                                <p className="mt-4 text-center text-sm text-red-700">The correct word was: {correctWords.join(', ')}</p>
                            )}
                        </div>
                    </div>
                );

            case 'dialogue':
                return (
                    <div className="space-y-4">
                        {activity.items.map((item, i) => (
                            <div key={i} className={`p-3 rounded-lg ${i % 2 === 0 ? 'bg-blue-50 text-left' : 'bg-gray-50 text-right'}`}>
                                <p className="font-bold text-lg">{item.text}</p>
                                <p className="text-sm text-gray-600">({item.translation}) <AudioPlayer src={item.audioUrl} label={item.text} /></p>
                            </div>
                        ))}
                        {!isAnswered && (
                            <div className="mt-4 p-3 bg-yellow-100 border-l-4 border-yellow-500">
                                <p>Tap 'Check' to confirm you have finished reading/listening.</p>
                            </div>
                        )}
                    </div>
                );

            case 'match-image':
                return (
                    <div className="grid grid-cols-3 gap-4">
                        {activity.pairs.map((pair) => (
                            <button
                                key={pair.id}
                                onClick={() => handleAnswerSelect(pair.id)}
                                disabled={isAnswered}
                                className={`flex flex-col items-center justify-center p-4 border rounded-lg text-center h-40 transition ${
                                    isAnswered && selectedAnswer === pair.id ? 'bg-green-100 border-green-500' :
                                    selectedAnswer === pair.id ? 'bg-indigo-100 border-indigo-500' :
                                    'bg-gray-50 hover:bg-gray-100'
                                }`}
                            >
                                <span className="text-4xl mb-2">{pair.image}</span>
                                <span className="font-bold">{pair.text}</span>
                                <span className="text-xs text-gray-500">({pair.translation})</span>
                                <AudioPlayer src={pair.audioUrl} label={pair.text} />
                            </button>
                        ))}
                        {isAnswered && <p className="col-span-3 mt-4 text-center text-sm text-gray-600">In a real app, you would drag and drop lines to match.</p>}
                    </div>
                );
            
            default:
                return <p className="text-red-500">Activity Type Not Supported Yet: {activity.type}</p>;
        }
    };

    // --- MAIN LAYOUT ---

    const progress = Math.round((step / totalSteps) * 100);

    if (step === totalSteps) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
                <div className="text-center bg-white p-10 rounded-xl shadow-2xl">
                    <h1 className="text-4xl font-extrabold text-green-600 mb-4">🎉 Congratulations!</h1>
                    <p className="text-xl text-gray-700">You have completed the <strong>{lessonData.title}</strong> lesson successfully.</p>
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            <header className="w-full bg-white shadow p-4 sticky top-0">
                <div className="max-w-3xl mx-auto flex items-center space-x-4">
                    <h1 className="text-lg font-bold text-gray-800">{lessonData.title}</h1>
                    <div className="flex-grow bg-gray-200 rounded-full h-2.5">
                        <div className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Step {step + 1}/{totalSteps}</span>
                </div>
            </header>

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-3xl w-full bg-white p-6 md:p-10 rounded-xl shadow-2xl">
                    {!isActivity && (
                        <div>
                            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Lesson Objectives</h2>
                            <ul className="list-disc list-inside space-y-2 mb-6">
                                {currentContent.objectives.map((obj, i) => <li key={i} className="text-gray-700">{obj}</li>)}
                            </ul>
                            <h2 className="text-2xl font-bold mb-4 text-indigo-700">Introduction</h2>
                            {currentContent.introParts.map((p, i) => <p key={i} className="mb-3 text-gray-700">{p}</p>)}
                        </div>
                    )}
                    
                    {isActivity && (
                        <div>
                            <h2 className="text-xl font-bold mb-4 text-gray-800">
                                {currentContent.question.translation}
                                {currentContent.question.audioUrl && <AudioPlayer src={currentContent.question.audioUrl} label="Question" />}
                            </h2>
                            <div className="min-h-[200px] flex items-center justify-center">
                                {renderActivityContent(currentContent)}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <footer className={`w-full text-white p-4 transition-all ${
                !isAnswered ? 'bg-gray-900' : isCorrect ? 'bg-green-700' : 'bg-red-700'
            }`}>
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    {!isAnswered ? (
                        <button 
                            onClick={checkAnswer} 
                            disabled={!(step === 0 || currentContent.type === 'dialogue' || selectedAnswer || allBlanksFilled)}
                            className={`py-3 px-6 rounded-lg font-bold transition ${
                                (step === 0 || currentContent.type === 'dialogue' || selectedAnswer || allBlanksFilled) 
                                ? 'bg-indigo-600 hover:bg-indigo-700' 
                                : 'bg-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {step === 0 ? 'Start Activity' : 'Check'}
                        </button>
                    ) : (
                        <>
                            <span className="font-semibold text-lg">
                                {isCorrect ? '🎉 Correct!' : '❌ Incorrect.'}
                                <span className="mr-2 block md:inline text-sm font-normal ml-2">
                                    {isCorrect ? currentContent.feedback : 'Review the rule and try again.'}
                                </span>
                            </span>
                            <button onClick={handleContinue} className="bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-lg font-bold">
                                Continue →
                            </button>
                        </>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default function App() {
    return <LearnerLessonView lessonData={DUMMY_LESSON_DATA} />;
}