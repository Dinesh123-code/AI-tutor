import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, CheckCircle2, AlertCircle, RefreshCw, Sparkles, BookOpen, ChevronRight, HelpCircle } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizModuleProps {
  quizList: QuizQuestion[];
  onAddQuizzes: (newQuizzes: QuizQuestion[]) => void;
  onAnswerQuestion: (isCorrect: boolean) => void;
}

export default function QuizModule({ quizList, onAddQuizzes, onAnswerQuestion }: QuizModuleProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedOptIdx, setSelectedOptIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);

  const currentQuestion = quizList[currentIdx];

  // Submit Selected Answer
  const handleSubmitAnswer = () => {
    if (selectedOptIdx === null || isAnswered || !currentQuestion) return;

    setIsAnswered(true);
    const isCorrect = selectedOptIdx === currentQuestion.answerIndex;
    onAnswerQuestion(isCorrect);
  };

  // Move to next question
  const handleNext = () => {
    setSelectedOptIdx(null);
    setIsAnswered(false);
    if (currentIdx + 1 < quizList.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      // Rotate back to first question as a loop, or prompt custom generation
      setCurrentIdx(0);
    }
  };

  // Request new customized AI questions
  const handleGenerateAIQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = customTopic.trim() || "English grammar and phrasing";
    setIsGenerating(true);
    setQuizError(null);

    try {
      const response = await fetch('/api/quiz/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: topic,
          difficulty: difficulty
        })
      });

      if (!response.ok) {
        throw new Error('Our quiz generator encountered a connection issue. Verify your GEMINI_API_KEY.');
      }

      const resData = await response.json();
      if (resData.questions && resData.questions.length > 0) {
        const structured: QuizQuestion[] = resData.questions.map((q: any) => ({
          ...q,
          id: `q-ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`
        }));

        onAddQuizzes(structured);
        setCurrentIdx(0); // Reset to first of new items
        setSelectedOptIdx(null);
        setIsAnswered(false);
        setCustomTopic('');
      } else {
        throw new Error('Our English server returned empty questions. Try another topic phrasing.');
      }

    } catch (err: any) {
      console.error(err);
      setQuizError(err.message || 'Could not fetch quiz questions.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      {/* Left major block: Test Workspace (8 Grid) */}
      <div className="lg:col-span-8 space-y-6">
        <AnimatePresence mode="wait">
          {currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6"
            >
              {/* Card headers */}
              <div className="flex justify-between items-baseline border-b border-slate-50 pb-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md font-mono tracking-wider">
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-[11px] text-slate-400 capitalize font-medium ml-1.5">{currentQuestion.category}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  Question {currentIdx + 1} of {quizList.length}
                </span>
              </div>

              {/* The Question Text */}
              <div className="space-y-4">
                <div className="flex gap-2 items-start text-slate-800">
                  <HelpCircle size={18} className="text-indigo-505 mt-1 shrink-0" />
                  <h3 className="text-sm md:text-base font-bold tracking-tight leading-relaxed">
                    {currentQuestion.question}
                  </h3>
                </div>

                {/* Multiple choices options */}
                <div className="grid gap-3 pt-3">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOptIdx === idx;
                    const isCorrect = idx === currentQuestion.answerIndex;

                    let optionStyle = "border-slate-100 hover:border-indigo-150 hover:bg-indigo-50/10";
                    if (isSelected) {
                      optionStyle = "border-indigo-600 bg-indigo-50/50 text-indigo-900";
                    }

                    if (isAnswered) {
                      if (isCorrect) {
                        optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-900 font-medium";
                      } else if (isSelected) {
                        optionStyle = "border-rose-550 bg-rose-50 text-rose-900";
                      } else {
                        optionStyle = "border-slate-100 opacity-60";
                      }
                    }

                    return (
                      <button
                        key={idx}
                        disabled={isAnswered}
                        onClick={() => setSelectedOptIdx(idx)}
                        className={`w-full text-left p-4 rounded-2xl border text-xs md:text-sm flex items-center gap-3 transition-all duration-150 ${
                          !isAnswered ? 'cursor-pointer' : ''
                        } ${optionStyle}`}
                      >
                        <span className={`text-[10px] font-bold h-6 w-6 rounded-full flex items-center justify-center shrink-0 border uppercase font-mono ${
                          isAnswered && isCorrect ? 'bg-emerald-500 border-emerald-500 text-white' :
                          isAnswered && isSelected && !isCorrect ? 'bg-rose-500 border-rose-505 text-white' :
                          isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="flex-1 text-slate-700 font-sans">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <div>
                  {isAnswered && (
                    <div className="flex items-center gap-1.5">
                      {selectedOptIdx === currentQuestion.answerIndex ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                          <CheckCircle2 size={14} className="fill-emerald-500 text-emerald-50" /> +15 XP Gained!
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-rose-600 font-bold">
                          <AlertCircle size={14} className="text-rose-500 shrink-0" /> Incorrect Phrasing
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isAnswered ? (
                    <button
                      onClick={handleSubmitAnswer}
                      disabled={selectedOptIdx === null}
                      className={`text-xs md:text-sm font-bold px-5 py-2.5 rounded-xl text-white transition-all cursor-pointer ${
                        selectedOptIdx !== null ? 'bg-indigo-600 hover:bg-indigo-500 shadow-md' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      Submit Answer
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-505 text-white text-xs md:text-sm font-bold px-5 py-2.5 rounded-xl shadow-md cursor-pointer"
                    >
                      Next Question <ChevronRight size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Educational rule explanation block */}
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2 mt-4"
                >
                  <div className="flex gap-1.5 items-center">
                    <BookOpen size={14} className="text-indigo-600" />
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Tutor Grammatical Breakdowns</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    {currentQuestion.explanation}
                  </p>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400 space-y-4">
              <BookOpen size={44} className="mx-auto text-slate-200" />
              <div>
                <h3 className="font-bold text-slate-600">No active test session</h3>
                <p className="text-xs mt-1">Please build a customized AI quiz using the prompt panel on the right.</p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Right Column: Quiz Customize Generator (4 Grid) */}
      <div className="lg:col-span-4 space-y-4">
        <form onSubmit={handleGenerateAIQuiz} className="bg-slate-950 border border-slate-800 text-white p-5 rounded-3xl space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles size={16} className="text-indigo-400 fill-indigo-400" />
            <div>
              <h4 className="font-bold text-xs">AI Quiz Weaver</h4>
              <p className="text-[10px] text-slate-400 font-mono">Formulate specific lessons</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-slate-400 font-mono">Grammar Point or Phrase Topic</label>
              <input
                type="text"
                required
                placeholder="e.g. Past perfect vs past, phrasal verbs, idioms"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full mt-1.5 px-3 py-2.5 bg-slate-800 border border-slate-700 focus:border-indigo-400 font-sans text-xs text-slate-100 rounded-xl focus:outline-none"
                disabled={isGenerating}
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-mono">Fluency difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full mt-1.5 px-3 py-2 bg-slate-800 border border-slate-700 text-xs text-slate-100 rounded-xl focus:outline-none"
                disabled={isGenerating}
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-505 active:bg-indigo-700 text-white font-bold text-xs tracking-wide py-3 px-4 rounded-xl shadow-md transition cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw size={12} className="animate-spin" /> Weaving Quiz...
                </>
              ) : (
                <>
                  <Sparkles size={12} fill="white" /> Generate Custom Quiz
                </>
              )}
            </button>
          </div>
        </form>

        {quizError && (
          <div className="p-4 bg-rose-50 border border-slate-100 text-slate-600 text-xs rounded-2xl flex items-start gap-2">
            <AlertCircle size={15} className="text-rose-500 mt-0.5 shrink-0" />
            <div>
              <p className="font-bold text-rose-800">Connection Error</p>
              <p className="mt-0.5 leading-relaxed">{quizError}</p>
              <p className="text-[9px] text-slate-400 mt-1">Check that Gemini API Secret is validated.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
