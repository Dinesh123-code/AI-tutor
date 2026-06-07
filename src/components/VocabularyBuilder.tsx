import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Check, Heart, Plus, Sparkles, Send, RefreshCw, AlertCircle, Info, ChevronRight, Mic } from 'lucide-react';
import { VocabWord } from '../types';

interface VocabularyBuilderProps {
  vocabList: VocabWord[];
  onAddVocabWords: (newWords: VocabWord[]) => void;
  onUpdateWord: (updatedWord: VocabWord) => void;
  onMarkLearned: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export default function VocabularyBuilder({ vocabList, onAddVocabWords, onUpdateWord, onMarkLearned, onToggleFavorite }: VocabularyBuilderProps) {
  const [selectedWord, setSelectedWord] = useState<VocabWord | null>(vocabList[0] || null);
  const [customTopic, setCustomTopic] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [userSentence, setUserSentence] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [vocabError, setVocabError] = useState<string | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'learning' | 'favorites'>('all');

  // Speech Recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setSpeechError(null);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition reports error:", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setSpeechError('Microphone permission blocked! To solve this, click the "Open in a new tab" button at the bottom/top-right of this page so the browser can ask you directly for mic privilege.');
      } else if (event.error === 'no-speech') {
        setSpeechError('No word or sentence was detected. Try speaking closer to the microphone.');
      } else {
        setSpeechError(`Voice evaluation check failed: ${event.error}. Please write or try open in a new tab.`);
      }
    };

    rec.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setUserSentence(prev => {
          const suffix = prev.trim() ? ' ' : '';
          return prev + suffix + finalTranscript;
        });
      }
    };

    recognitionRef.current = rec;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const toggleListening = async () => {
    if (!speechSupported) {
      setSpeechError('Speech recognition is not supported in this browser. We suggest Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setSpeechError(null);
      setIsListening(true);
      try {
        // Run hardware permission check
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // dismiss mic instantly
        
        // Start live recording
        recognitionRef.current?.start();
      } catch (err: any) {
        console.error("Failed to start speech in vocab builder:", err);
        setIsListening(false);
        
        let customMessage = "Could not activate microphone.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied')) {
          customMessage = 'Microphone permission blocked inside the sandboxed preview window. Click "Open in a new tab" at the bottom of the page to speak natively!';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          customMessage = 'No microphonic device detected. Please attach a working headset.';
        } else {
          customMessage = `Mic error: ${err.message || 'Restricted context'}. Open in a new tab to permit speech.`;
        }
        setSpeechError(customMessage);
      }
    }
  };

  // Generate brand new vocabulary words with AI
  const handleGenerateAIWords = async (e: React.FormEvent) => {
    e.preventDefault();
    const topic = customTopic.trim() || "General Conversation";
    setIsGenerating(true);
    setVocabError(null);

    try {
      const response = await fetch('/api/vocab/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: topic,
          level: selectedLevel
        })
      });

      if (!response.ok) {
        throw new Error('Our AI word workshop could not connect. Check your GEMINI_API_KEY in secrets.');
      }

      const resData = await response.json();
      if (resData.words && resData.words.length > 0) {
        // Appends IDs & persistence props
        const structured = resData.words.map((w: any) => ({
          ...w,
          id: `word-ai-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          isLearned: false,
          isFavorite: false
        }));

        onAddVocabWords(structured);
        setSelectedWord(structured[0]);
        setCustomTopic('');
      } else {
        throw new Error('AI didn\'t return any words. Try a different topic phrasing.');
      }
    } catch (err: any) {
      console.error(err);
      setVocabError(err.message || 'Error occurred generating vocabulary.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Evaluate user's constructed sentence
  const handleEvaluateSentence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWord || !userSentence.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setVocabError(null);

    try {
      const response = await fetch('/api/vocab/evaluate-sentence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word: selectedWord.word,
          userSentence: userSentence.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Sentence evaluation server failed. Ensure GEMINI_API_KEY is registered.');
      }

      const evalData = await response.json();

      // Update Local Vocab word stats
      const updated: VocabWord = {
        ...selectedWord,
        userSentence: userSentence.trim(),
        sentenceFeedback: evalData
      };

      onUpdateWord(updated);
      setSelectedWord(updated);
      setUserSentence(''); // Clear input
    } catch (err: any) {
      console.error(err);
      setVocabError(err.message || 'Could not compile sentence check.');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Filter vocabulary deck
  const filteredVocab = vocabList.filter(v => {
    if (filterMode === 'learning') return !v.isLearned;
    if (filterMode === 'favorites') return v.isFavorite;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Interactive Vocabulary Studio</h2>
        <p className="text-xs md:text-sm text-slate-400">Expand your vocabulary on any technical, work, or lifestyle domain using AI feedback.</p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left column: Word list & Topic Generator (5 Grid) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Filtering */}
          <div className="bg-white border border-slate-100 rounded-2xl p-3 flex gap-2">
            {[
              { id: 'all', label: 'All Words' },
              { id: 'learning', label: 'In Progress' },
              { id: 'favorites', label: 'Favorites' }
            ].map(m => (
              <button
                key={m.id}
                onClick={() => setFilterMode(m.id as any)}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl text-center transition tracking-wide cursor-pointer ${
                  filterMode === m.id 
                    ? 'bg-indigo-600 text-white shadow-xs' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* List of Words */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden max-h-[350px] overflow-y-auto">
            {filteredVocab.length > 0 ? (
              <div className="divide-y divide-slate-50">
                {filteredVocab.map((w) => (
                  <div
                    key={w.id}
                    onClick={() => setSelectedWord(w)}
                    className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition duration-150 ${
                      selectedWord?.id === w.id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-800">{w.word}</h4>
                        <span className="text-[9px] text-slate-400 italic">({w.partOfSpeech})</span>
                      </div>
                      <p className="text-[11px] text-slate-400 capitalize mt-0.5">{w.category}</p>
                    </div>

                    <div className="flex gap-2 items-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onToggleFavorite(w.id)}
                        className={`p-1.5 rounded-lg transition ${
                          w.isFavorite ? 'text-rose-550' : 'text-slate-300 hover:text-rose-400'
                        }`}
                      >
                        <Heart size={14} fill={w.isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button
                        onClick={() => onMarkLearned(w.id)}
                        className={`p-1.5 rounded-lg border transition ${
                          w.isLearned 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'border-slate-200 text-slate-400 hover:bg-slate-50'
                        }`}
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No words in this view. Change filters or let AI generate new terms!
              </div>
            )}
          </div>

          {/* AI Generator Box */}
          <form onSubmit={handleGenerateAIWords} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-white space-y-4">
            <div className="flex gap-2 items-center text-xs text-indigo-300 font-semibold uppercase tracking-wider">
              <Sparkles size={14} className="fill-indigo-300" />
              <span>Prompt AI Vocabulary Topic</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-slate-400 font-mono">Any Topic / Domain</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Airport, Restaurant, Coding, Finance"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full mt-1 px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                  disabled={isGenerating}
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-[10px] text-slate-400 font-mono">Fluency Target</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none"
                    disabled={isGenerating}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="w-full flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shrink-0"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={12} className="animate-spin" /> Fetching...
                      </>
                    ) : (
                      <>
                        <Plus size={14} /> AI Generate
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Right column: Flashcard display & Practice Arena (7 Grid) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedWord ? (
              <motion.div
                key={selectedWord.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-xs space-y-6"
              >
                {/* Header indicators */}
                <div className="flex justify-between items-start border-b border-slate-50 pb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md tracking-wider">
                      {selectedWord.level}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-2.5 capitalize">{selectedWord.category}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleFavorite(selectedWord.id)}
                      className={`p-2 rounded-xl border border-slate-100 text-xs font-medium flex items-center gap-1 cursor-pointer transition ${
                        selectedWord.isFavorite ? 'text-rose-600 bg-rose-50/50 border-rose-100' : 'text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Heart size={14} className="fill-current" /> Favorite
                    </button>
                    <button
                      onClick={() => onMarkLearned(selectedWord.id)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1 cursor-pointer transition ${
                        selectedWord.isLearned ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      <Check size={14} /> {selectedWord.isLearned ? 'Learned' : 'Mark Learned'}
                    </button>
                  </div>
                </div>

                {/* Big Word showcase */}
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2.5">
                    <h3 className="text-2xl md:text-3xl font-extrabold text-slate-800 tracking-tight">{selectedWord.word}</h3>
                    <span className="text-xs md:text-sm text-slate-400 italic">/{selectedWord.partOfSpeech}/</span>
                  </div>
                  <p className="text-sm md:text-base text-slate-600 leading-relaxed font-sans">{selectedWord.definition}</p>
                </div>

                {/* Example sentence */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-400 block font-mono">Interactive usage context</span>
                  <p className="text-xs md:text-sm text-slate-700 font-sans italic font-medium leading-relaxed">
                    "{selectedWord.exampleSentence}"
                  </p>
                </div>

                {/* Sentence Practice helper */}
                <div className="border-t border-slate-50 pt-5 space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">English Practice Playground</h4>
                    <p className="text-xs text-slate-400">Compose a sentence using "<b>{selectedWord.word}</b>" to receive real-time grammatical score.</p>
                  </div>

                  {speechError && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-805 text-[11px] rounded-xl flex items-center justify-between">
                      <span>{speechError}</span>
                      <button 
                        type="button" 
                        onClick={() => setSpeechError(null)}
                        className="text-[10px] text-amber-500 underline font-bold"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleEvaluateSentence} className="space-y-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={toggleListening}
                        className={`p-3 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                          isListening 
                            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md' 
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                        title={isListening ? "Listening... Click to stop" : "Speak your sentence aloud"}
                      >
                        <Mic size={14} />
                      </button>

                      <input
                        type="text"
                        required
                        value={userSentence}
                        onChange={(e) => setUserSentence(e.target.value)}
                        placeholder={isListening ? "Listening... Speak sentence." : `Write or speak your own sentence...`}
                        className={`flex-1 px-4 py-3 border text-xs md:text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-300 transition duration-150 ${
                          isListening 
                            ? 'bg-red-50/50 border-red-200 text-red-950 placeholder-red-400 font-medium' 
                            : 'bg-slate-50 border-slate-100 focus:bg-white focus:border-indigo-300 text-slate-800'
                        }`}
                        disabled={isEvaluating}
                      />
                      <button
                        type="submit"
                        disabled={!userSentence.trim() || isEvaluating}
                        className="bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white p-3 rounded-xl flex items-center justify-center cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 shrink-0"
                      >
                        {isEvaluating ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                      </button>
                    </div>
                  </form>

                  {/* Feedback display */}
                  {selectedWord.sentenceFeedback && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.99 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-2xl overflow-hidden border border-slate-100"
                    >
                      <div className="bg-slate-950 text-white p-4 flex justify-between items-center">
                        <div className="flex gap-2 items-center">
                          <BookOpen size={16} className="text-indigo-400" />
                          <span className="text-xs font-bold">Vocabulary Grade</span>
                        </div>
                        <span className={`text-xs font-bold font-mono px-2 py-1 rounded-md ${
                          selectedWord.sentenceFeedback.score >= 8 ? 'bg-emerald-500/20 text-emerald-400' :
                          selectedWord.sentenceFeedback.score >= 5 ? 'bg-amber-500/25 text-amber-300' :
                          'bg-rose-550/20 text-rose-400'
                        }`}>
                          Score: {selectedWord.sentenceFeedback.score}/10
                        </span>
                      </div>

                      <div className="p-4 space-y-3 text-xs bg-slate-50/50">
                        {/* Corrected block */}
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-400 font-mono text-[9px] uppercase tracking-wider">Polished Phrasing:</p>
                          <p className="font-semibold text-slate-800 italic leading-relaxed font-sans">
                            "{selectedWord.sentenceFeedback.corrected}"
                          </p>
                        </div>

                        {/* Explanation block */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                          <p className="font-semibold text-slate-400 font-mono text-[9px] uppercase tracking-wider">Educational Explanation:</p>
                          <p className="text-slate-600 leading-relaxed font-sans">
                            {selectedWord.sentenceFeedback.explanation}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-3xl p-12 text-center text-slate-400">
                <BookOpen size={40} className="mx-auto text-slate-200 mb-4" />
                <h3 className="font-bold text-sm text-slate-500">No words selected</h3>
                <p className="text-xs mt-1">Pick a word from the left list or type a topic to generate terms.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {vocabError && (
        <div className="p-4 bg-rose-50 border border-slate-100 text-slate-600 font-normal text-xs rounded-xl flex items-start gap-2 max-w-xl mx-auto">
          <AlertCircle size={16} className="text-rose-500 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800">Connection Interrupted</p>
            <p className="mt-0.5 leading-relaxed">{vocabError}</p>
            <p className="text-[10px] text-slate-400 mt-1">Please ensure your <b>GEMINI_API_KEY</b> is defined inside the Settings panel to enable real server-side vocabulary retrieval.</p>
          </div>
        </div>
      )}
    </div>
  );
}
