import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, MessageSquare, BookOpen, HelpCircle, Trophy, Flame, ChevronRight, RefreshCw, Star, Info } from 'lucide-react';
import { DEFAULT_SCENARIOS, DEFAULT_VOCABULARY, DEFAULT_QUIZZES } from './data';
import { RoleplayScenario, VocabWord, QuizQuestion, ScoreStats } from './types';
import Dashboard from './components/Dashboard';
import RoleplayCoach from './components/RoleplayCoach';
import VocabularyBuilder from './components/VocabularyBuilder';
import QuizModule from './components/QuizModule';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scenarios' | 'vocab' | 'quiz'>('dashboard');
  const [selectedScenario, setSelectedScenario] = useState<RoleplayScenario | null>(null);

  // States with LocalStorage Hydration
  const [stats, setStats] = useState<ScoreStats>(() => {
    const saved = localStorage.getItem('english_tutor_stats_v1');
    if (saved) return JSON.parse(saved);
    return {
      dailyStreak: 1, // Start with a friendly 1 day count
      xp: 120, // Starting default padding
      lessonsDone: 0,
      chatsStarted: 0,
      quizAccuracy: 0,
      quizAnswered: 0,
      quizCorrect: 0
    };
  });

  const [vocabList, setVocabList] = useState<VocabWord[]>(() => {
    const saved = localStorage.getItem('english_tutor_vocab_v1');
    if (saved) return JSON.parse(saved);
    return DEFAULT_VOCABULARY;
  });

  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => {
    const saved = localStorage.getItem('english_tutor_quizzes_v1');
    if (saved) return JSON.parse(saved);
    return DEFAULT_QUIZZES;
  });

  const [showXpModal, setShowXpModal] = useState(false);
  const [claimedXp, setClaimedXp] = useState(0);

  // Persist States to LocalStorage
  useEffect(() => {
    localStorage.setItem('english_tutor_stats_v1', JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    localStorage.setItem('english_tutor_vocab_v1', JSON.stringify(vocabList));
  }, [vocabList]);

  useEffect(() => {
    localStorage.setItem('english_tutor_quizzes_v1', JSON.stringify(quizQuestions));
  }, [quizQuestions]);


  // Navigation trigger
  const handleNavigate = (tab: 'dashboard' | 'scenarios' | 'vocab' | 'quiz') => {
    setSelectedScenario(null);
    setActiveTab(tab);
  };

  const handleStartRoleplay = (sc: RoleplayScenario) => {
    setSelectedScenario(sc);
    // increment stats
    setStats(prev => ({
      ...prev,
      chatsStarted: prev.chatsStarted + 1
    }));
  };

  // Complete Dialogue practice session celebration
  const handleCompleteDialogueSession = (xpEarned: number) => {
    setStats(prev => ({
      ...prev,
      xp: prev.xp + xpEarned,
      lessonsDone: prev.lessonsDone + 1,
      dailyStreak: prev.dailyStreak + (Math.random() > 0.8 ? 1 : 0) // random daily streak chance
    }));
    setClaimedXp(xpEarned);
    setSelectedScenario(null);
    setShowXpModal(true);
    setActiveTab('dashboard');
  };

  // Answer multiple-choice quizzes
  const handleAnswerQuiz = (isCorrect: boolean) => {
    setStats(prev => {
      const newAnswered = prev.quizAnswered + 1;
      const newCorrect = prev.quizCorrect + (isCorrect ? 1 : 0);
      return {
        ...prev,
        quizAnswered: newAnswered,
        quizCorrect: newCorrect,
        quizAccuracy: Math.round((newCorrect / newAnswered) * 100),
        xp: prev.xp + (isCorrect ? 15 : 5) // +15 XP for correct, +5 XP for effort
      };
    });
  };

  // Append new AI Generated vocab to state
  const handleAddVocabWords = (newWords: VocabWord[]) => {
    setVocabList(prev => [...newWords, ...prev]);
  };

  const handleUpdateWord = (updated: VocabWord) => {
    setVocabList(prev => prev.map(w => w.id === updated.id ? updated : w));
  };

  const handleMarkLearned = (id: string) => {
    setVocabList(prev => prev.map(w => {
      if (w.id === id) {
        const learnedState = !w.isLearned;
        // Award 10 XP for mastering a word
        if (learnedState) {
          setStats(s => ({ ...s, xp: s.xp + 10 }));
        }
        return { ...w, isLearned: learnedState };
      }
      return w;
    }));
  };

  const handleToggleFavorite = (id: string) => {
    setVocabList(prev => prev.map(w => w.id === id ? { ...w, isFavorite: !w.isFavorite } : w));
  };

  // Append new AI Quizzes to state
  const handleAddQuizzes = (newQuizzes: QuizQuestion[]) => {
    setQuizQuestions(prev => [...newQuizzes, ...prev]);
  };

  // Reset Progress data clean trigger (optional maintenance helper)
  const handleResetProgress = () => {
    if (confirm("Are you sure you want to reset all your learning logs and statistics?")) {
      localStorage.clear();
      setStats({
        dailyStreak: 1,
        xp: 120,
        lessonsDone: 0,
        chatsStarted: 0,
        quizAccuracy: 0,
        quizAnswered: 0,
        quizCorrect: 0
      });
      setVocabList(DEFAULT_VOCABULARY);
      setQuizQuestions(DEFAULT_QUIZZES);
      setSelectedScenario(null);
      setActiveTab('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      {/* Visual Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-100 px-4 md:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => handleNavigate('dashboard')}>
          <div className="bg-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-650/20">
            <Sparkles size={18} fill="white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm md:text-base tracking-tight text-slate-800">
              AI English Tutor
            </h1>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider -mt-0.5">Fluent AI Coach</p>
          </div>
        </div>

        {/* Dynamic Center navigation indicators */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          {[
            { id: 'dashboard', label: 'Tutor Dashboard', icon: Trophy },
            { id: 'scenarios', label: 'Dialogue Labs', icon: MessageSquare },
            { id: 'vocab', label: 'Vocab Studio', icon: BookOpen },
            { id: 'quiz', label: 'Grammar Quizzes', icon: HelpCircle }
          ].map(tab => {
            const isActive = activeTab === tab.id || (tab.id === 'scenarios' && selectedScenario !== null);
            return (
              <button
                key={tab.id}
                onClick={() => handleNavigate(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl cursor-pointer transition ${
                  isActive ? 'bg-indigo-50 text-indigo-700 shadow-3xs' : 'hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            );
          })}
        </nav>

        {/* XP Status badge */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full" title="Daily Streak">
            <Flame size={15} className="fill-amber-500 text-amber-500 animate-pulse stroke-[2.2]" />
            <span className="text-xs font-extrabold text-slate-700">{stats.dailyStreak} Days</span>
          </div>

          <div className="flex items-center gap-2 bg-indigo-55/80 border border-indigo-100/50 px-3.5 py-1.5 rounded-full" title="Fluency Experience">
            <Trophy size={14} className="text-indigo-600 stroke-[2.2]" />
            <span className="text-xs font-extrabold text-indigo-700 font-mono">{stats.xp} XP</span>
          </div>
        </div>
      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8">
        <AnimatePresence mode="wait">
          {selectedScenario ? (
            <motion.div
              key="chat-session"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <RoleplayCoach
                scenario={selectedScenario}
                onBack={() => setSelectedScenario(null)}
                onCompleteChat={handleCompleteDialogueSession}
              />
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {activeTab === 'dashboard' && (
                <Dashboard
                  stats={stats}
                  scenarios={DEFAULT_SCENARIOS}
                  vocab={vocabList}
                  onSelectScenario={handleStartRoleplay}
                  onNavigate={handleNavigate}
                />
              )}

              {activeTab === 'scenarios' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Active Conversation Scenarios</h2>
                    <p className="text-xs md:text-sm text-slate-400">Select any simulated real-world situation to chat and learn natively.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {DEFAULT_SCENARIOS.map((sc) => (
                      <div
                        key={sc.id}
                        className="bg-white border border-slate-100 p-6 rounded-2xl hover:border-indigo-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md ${
                              sc.level === 'Beginner' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                              sc.level === 'Intermediate' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                              'bg-rose-55 text-rose-600 border border-rose-100'
                            }`}>
                              {sc.level}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">with {sc.characterName}</span>
                          </div>
                          <h3 className="text-lg font-bold text-slate-800 mt-3 group-hover:text-indigo-600 transition-colors">
                            {sc.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {sc.description}
                          </p>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <span className="text-xs text-slate-400 font-medium italic">Role: {sc.role}</span>
                          <button
                            onClick={() => handleStartRoleplay(sc)}
                            className="bg-indigo-600 hover:bg-indigo-505 text-white text-xs font-bold px-4 py-2.5 rounded-xl block cursor-pointer transition shadow-sm"
                          >
                            Speak with AI
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'vocab' && (
                <VocabularyBuilder
                  vocabList={vocabList}
                  onAddVocabWords={handleAddVocabWords}
                  onUpdateWord={handleUpdateWord}
                  onMarkLearned={handleMarkLearned}
                  onToggleFavorite={handleToggleFavorite}
                />
              )}

              {activeTab === 'quiz' && (
                <QuizModule
                  quizList={quizQuestions}
                  onAddQuizzes={handleAddQuizzes}
                  onAnswerQuestion={handleAnswerQuiz}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation (Mobile Only) */}
      <footer className="md:hidden sticky bottom-0 z-30 bg-white border-t border-slate-100 grid grid-cols-4 py-1.5 px-1 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]">
        {[
          { id: 'dashboard', label: 'Trophy', icon: Trophy },
          { id: 'scenarios', label: 'Dialogue', icon: MessageSquare },
          { id: 'vocab', label: 'Vocab', icon: BookOpen },
          { id: 'quiz', label: 'Quizzes', icon: HelpCircle }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavigate(tab.id as any)}
              className={`flex flex-col items-center gap-1 py-1.5 rounded-xl cursor-pointer ${
                isActive ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={17} />
              <span className="text-[9px] font-bold tracking-wide">{tab.label}</span>
            </button>
          );
        })}
      </footer>

      {/* Celebration XP Claim Modal */}
      <AnimatePresence>
        {showXpModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 15 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full border border-slate-100 text-center shadow-xl space-y-5"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-500/20">
                <Trophy size={30} className="stroke-[2.2]" />
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider bg-slate-900 text-indigo-300 font-bold px-2 py-1 rounded-sm">
                  Lesson Milestone Achieved!
                </span>
                <h3 className="text-xl font-black text-slate-800 mt-3.5 tracking-tight">Excellent Dialogue practice!</h3>
                <p className="text-xs text-slate-500 leading-relaxed mt-2 font-sans">
                  You successfully communicated with the AI English Coach, resolved constraints, and expanded your grammar awareness. Keep it going!
                </p>
              </div>

              <div className="bg-indigo-50/50 p-4 border border-indigo-150/10 rounded-2xl flex justify-between items-center text-xs">
                <span className="text-slate-600 font-semibold font-sans">Fluency Reward:</span>
                <span className="text-indigo-700 font-black font-mono">+{claimedXp} Experience Points (XP)</span>
              </div>

              <button
                onClick={() => setShowXpModal(false)}
                className="w-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs md:text-sm py-3.5 rounded-2xl shadow-md transition cursor-pointer"
              >
                Claim Rewards & Continue
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Subtle Utility Indicator */}
      <section className="bg-slate-100 border-t border-slate-100 py-3 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-2 text-[10px] text-slate-400 font-mono">
          <span>AI English Tutor • Powered by Gemini Flash</span>
          <button
            onClick={handleResetProgress}
            className="text-slate-400 hover:text-rose-500 underline transition cursor-pointer font-sans"
          >
            Reset Learning Logs
          </button>
        </div>
      </section>
    </div>
  );
}
