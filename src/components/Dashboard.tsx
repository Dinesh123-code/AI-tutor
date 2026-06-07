import { motion } from 'motion/react';
import { Flame, Trophy, Award, BookOpen, MessageSquare, Plus, ArrowRight, Play, CheckCircle } from 'lucide-react';
import { RoleplayScenario, VocabWord, ScoreStats } from '../types';

interface DashboardProps {
  stats: ScoreStats;
  scenarios: RoleplayScenario[];
  vocab: VocabWord[];
  onSelectScenario: (scenario: RoleplayScenario) => void;
  onNavigate: (tab: 'scenarios' | 'vocab' | 'quiz') => void;
}

export default function Dashboard({ stats, scenarios, vocab, onSelectScenario, onNavigate }: DashboardProps) {
  const learnedCount = vocab.filter(w => w.isLearned).length;
  const favoriteCount = vocab.filter(w => w.isFavorite).length;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden bg-radial from-slate-900 to-slate-950 text-white rounded-3xl p-8 border border-slate-800 shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32"></div>

        <div className="relative z-10 max-w-2xl">
          <span className="bg-slate-800/80 border border-slate-700/50 text-indigo-300 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
            Your Personal AI English Coach
          </span>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mt-4 text-slate-100">
            Learn English through immersive roleplay.
          </h1>
          <p className="text-slate-400 mt-2 text-sm md:text-base leading-relaxed">
            Practice realistic, interactive everyday dialogues. Get immediate grammatical corrections, alternate vocabulary recommendations, and master pronunciation in a safe environment.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <button 
              onClick={() => onNavigate('scenarios')}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg transition duration-200 cursor-pointer"
            >
              <Play size={16} fill="white" /> Start Practice
            </button>
            <button 
              onClick={() => onNavigate('vocab')}
              className="flex items-center gap-2 bg-slate-800/85 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-semibold px-5 py-3 rounded-xl transition duration-200 cursor-pointer"
            >
              Learn Vocabulary
            </button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          {
            title: "Daily Streak",
            value: `${stats.dailyStreak} Days`,
            description: "Practice daily to keep it up!",
            icon: Flame,
            color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
          },
          {
            title: "Total Experience",
            value: `${stats.xp} XP`,
            description: "Keep practicing to level up!",
            icon: Trophy,
            color: "text-indigo-500 bg-indigo-500/10 border-indigo-500/20"
          },
          {
            title: "Vocabulary Saved",
            value: `${vocab.length}`,
            description: `${learnedCount} marked as mastered`,
            icon: BookOpen,
            color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
          },
          {
            title: "Conversations Done",
            value: `${stats.lessonsDone}`,
            description: "Scenarios completed",
            icon: MessageSquare,
            color: "text-sky-500 bg-sky-500/10 border-sky-500/20"
          }
        ].map((item, idx) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex flex-col justify-between"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 font-medium text-xs tracking-wide uppercase">{item.title}</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-2 tracking-tight">{item.value}</h3>
              </div>
              <div className={`p-2.5 rounded-xl border ${item.color}`}>
                <item.icon size={20} className="stroke-[2.2]" />
              </div>
            </div>
            <p className="text-slate-500 font-normal text-xs mt-3">{item.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Suggested Scenarios */}
      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Active Scenarios</h2>
            <p className="text-xs text-slate-500">Pick any real-life situation to start text chatting</p>
          </div>
          <button 
            onClick={() => onNavigate('scenarios')}
            className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
          >
            View all <ArrowRight size={14} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {scenarios.slice(0, 2).map((sc, scIdx) => (
            <motion.div
              key={sc.id}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: scIdx * 0.1 }}
              id={`scenario-card-${sc.id}`}
              className="bg-white border border-slate-100 p-6 rounded-2xl hover:border-indigo-100 hover:shadow-md transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex justify-between items-start">
                  <span className={`text-[10px] uppercase tracking-wider font-semibold px-2 px-2.5 py-1 rounded-md ${
                    sc.level === 'Beginner' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    sc.level === 'Intermediate' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-rose-55 text-rose-600 border border-rose-100'
                  }`}>
                    {sc.level}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">with {sc.characterName}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-800 mt-3 group-hover:text-indigo-600 transition-colors">
                  {sc.title}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1 min-h-[2.5rem]">
                  {sc.description}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 italic">Role: {sc.role}</span>
                <button
                  onClick={() => onSelectScenario(sc)}
                  className="flex items-center gap-1 bg-slate-50 group-hover:bg-indigo-600 text-slate-700 group-hover:text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition duration-200 cursor-pointer"
                >
                  Chat <Play size={10} fill="currentColor" className="ml-0.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Double Column: Quick Study Vocabulary & Pro Quiz tips */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Vocab study snippet */}
        <div className="bg-white border border-slate-100 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-slate-800">Vocabulary Deck</h3>
              <p className="text-xs text-slate-400">Save and practice phrases</p>
            </div>
            <button 
              onClick={() => onNavigate('vocab')}
              className="text-xs text-indigo-600 hover:text-indigo-500 font-semibold cursor-pointer"
            >
              Study Deck <ArrowRight size={12} className="inline ml-1" />
            </button>
          </div>

          <div className="space-y-2">
            {vocab.slice(0, 3).map((v) => (
              <div key={v.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition duration-150">
                <div>
                  <h4 className="text-sm font-semibold text-slate-700">{v.word}</h4>
                  <p className="text-[11px] text-slate-400 capitalize">{v.partOfSpeech} • {v.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-sm ${
                    v.level === 'Beginner' ? 'text-emerald-500 bg-emerald-50' :
                    v.level === 'Intermediate' ? 'text-amber-500 bg-amber-50' :
                    'text-rose-500 bg-rose-50'
                  }`}>
                    {v.level}
                  </span>
                  {v.isLearned ? <CheckCircle size={15} className="text-emerald-500" /> : <div className="w-4 h-4 rounded-full border border-slate-200"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Practice Tip block */}
        <div className="bg-indigo-50/50 border border-indigo-100/30 p-6 rounded-2xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="p-2.5 bg-indigo-500 text-white rounded-xl w-10 h-10 flex items-center justify-center">
              <Award size={20} />
            </div>
            <h3 className="text-base font-bold text-slate-800">Test Your Placement</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Unlock vocabulary milestones by challenging yourself with our English Quizzes. Each response yields detailed instructions, breakdown of perfect structures, and points.
            </p>
          </div>
          <button 
            onClick={() => onNavigate('quiz')}
            className="mt-6 flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold py-3 px-4 rounded-xl shadow-xs transition cursor-pointer"
          >
            Take English Test <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
