import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, ChevronLeft, Volume2, CheckCircle2, AlertCircle, RefreshCw, Zap, Award, Mic, MicOff } from 'lucide-react';
import { RoleplayScenario, ChatMessage } from '../types';

interface RoleplayCoachProps {
  scenario: RoleplayScenario;
  onBack: () => void;
  onCompleteChat: (xpEarned: number) => void;
}

export default function RoleplayCoach({ scenario, onBack, onCompleteChat }: RoleplayCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-msg',
      sender: 'ai',
      text: scenario.initialPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeCorrectionId, setActiveCorrectionId] = useState<string | null>(null);

  // Speech Recognition states
  const [isListening, setIsListening] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Speech Recognition in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // Stop when the user finishes speaking a phrase
    rec.interimResults = true; // Use interim results to give real-time typing preview feedback
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      setRecognitionError(null);
    };

    rec.onend = () => {
      setIsListening(false);
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition handler reports:", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        setRecognitionError('Microphone permission blocked. Pro-tip: For sandbox frames inside Google AI Studio, please click "Open in a new tab" at the top-right/bottom of the page for native Safari, Chrome, and Edge mic prompt support.');
      } else if (event.error === 'no-speech') {
        setRecognitionError('No voice/speech was detected. Speak closer to the microphone, speaking clearly in English.');
      } else if (event.error === 'network') {
        setRecognitionError('Speech recognition requires online access to translate spoken words. Please check your network connection.');
      } else {
        setRecognitionError(`Voice processing check failed: ${event.error}. Feel free to type your response if voice capture fails.`);
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
        setInputText(prev => {
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
      setRecognitionError('Speech Recognition is not supported by your current browser. We recommend using Google Chrome.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setRecognitionError(null);
      setIsListening(true);
      try {
        // Pre-flight check: Request standard audio permissions first in browser to secure hardware binding
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop()); // instantly free up resource
        
        // Success: Trigger the full linguistic recognition system
        recognitionRef.current?.start();
      } catch (err: any) {
        console.error("Speech pre-flight or authorization error:", err);
        setIsListening(false);
        
        let customMessage = "Could not activate microphone.";
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.message?.includes('denied')) {
          customMessage = 'Microphone access is blocked! Click "Open in a new tab" at the bottom of the screen to load the application as a standalone tab where the browser will natively prompt you for Microphone permission!';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          customMessage = 'No microphone hardware was detected. Please plug in a headset or verify your system audio settings.';
        } else {
          customMessage = `Microphone check problem: ${err.message || 'Restricted permission context'}. Please open the application in a new tab to bypass iframe security boundaries and prompt for voice access.`;
        }
        setRecognitionError(customMessage);
      }
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle Speech synthesis (pronunciation helper)
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel previous speech first
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.9; // Slightly slower for easy learning
      window.speechSynthesis.speak(utterance);
    }
  };

  // Run the dialogue exchange
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMsgText = inputText.trim();
    setInputText('');
    setError(null);

    // Create immediate user message
    const userMessageId = `msg-${Date.now()}`;
    const newUserMessage: ChatMessage = {
      id: userMessageId,
      sender: 'user',
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          scenario: scenario
        })
      });

      if (!response.ok) {
        throw new Error('Our English server returned an issue. Please make sure your Gemini API Secret is configured.');
      }

      const resData = await response.json();

      // Add feedback correction to the user's message
      setMessages(prev => prev.map(m => {
        if (m.id === userMessageId) {
          return {
            ...m,
            correction: resData.correction
          };
        }
        return m;
      }));

      // Autoselect the last correction to show educational panel
      setActiveCorrectionId(userMessageId);

      // Append character response
      const characterMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: resData.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, characterMsg]);

      // Automatically speak AI reply
      speak(resData.response);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting with our English Coach went wrong. Check that your GEMINI_API_KEY is configured in Settings > Secrets.');
    } finally {
      setIsTyping(false);
    }
  };

  // Finish session
  const handleFinish = () => {
    // Standard reward: 30 base XP + 10 XP for each message sent
    const activeMessagesSent = messages.filter(m => m.sender === 'user').length;
    const gainedXp = 30 + (activeMessagesSent * 10);
    onCompleteChat(gainedXp);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[500px]">
      {/* Dialogue Left Column */}
      <div className="flex-1 flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs relative">
        {/* Scenario Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition text-slate-300 cursor-pointer"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm md:text-base tracking-tight">{scenario.title}</h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-indigo-300 font-semibold px-2 py-0.5 rounded-md">
                  {scenario.level}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Practicing with <b>{scenario.characterName} ({scenario.role})</b></p>
            </div>
          </div>

          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-sm cursor-pointer"
          >
            <CheckCircle2 size={13} fill="currentColor" className="text-emerald-100" /> Finish Lesson
          </button>
        </div>

        {/* Message Logs */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
          {messages.map((m, index) => {
            const isUser = m.sender === 'user';
            const hasFeedback = !!m.correction;
            const isCorrectionSelected = activeCorrectionId === m.id;

            return (
              <div key={m.id} className={`flex max-w-[85%] ${isUser ? 'ml-auto' : 'mr-auto'}`}>
                {/* Bubble Container */}
                <div className="space-y-1.5 w-full">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-slate-400 font-mono">
                      {isUser ? 'You' : scenario.characterName}
                    </span>
                    <button
                      onClick={() => speak(m.text)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 transition cursor-pointer"
                      title="Listen audio pronunciation"
                    >
                      <Volume2 size={12} />
                    </button>
                  </div>

                  <div 
                    onClick={() => isUser && hasFeedback && setActiveCorrectionId(isCorrectionSelected ? null : m.id)}
                    className={`rounded-2xl p-4 text-xs md:text-sm shadow-xs leading-relaxed transition-all duration-200 ${
                      isUser 
                        ? 'bg-indigo-600 text-white rounded-tr-none hover:bg-indigo-500 cursor-pointer' 
                        : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                    } ${isCorrectionSelected ? 'ring-2 ring-indigo-300' : ''}`}
                  >
                    <p>{m.text}</p>

                    {/* Quick feedback indicators on user messages */}
                    {isUser && hasFeedback && (
                      <div className="mt-2.5 pt-2 border-t border-indigo-500/50 flex items-center justify-between pointer-events-none">
                        {m.correction?.hasErrors ? (
                          <span className="flex items-center gap-1 text-[10px] text-amber-200 font-semibold">
                            <AlertCircle size={10} className="fill-amber-500 text-amber-200" /> Improvement Suggestion
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] text-emerald-200 font-semibold">
                            <CheckCircle2 size={10} className="fill-emerald-600 text-emerald-200" /> Grammatically Flawless!
                          </span>
                        )}
                        <span className="text-[9px] bg-indigo-700/80 text-indigo-100 px-1.5 py-0.5 rounded-sm uppercase tracking-wide font-mono scale-90">
                          {isCorrectionSelected ? 'Hide Tips' : 'Click for Tips'}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-400 block px-1 text-right">{m.timestamp}</span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex max-w-[80%] mr-auto items-center gap-2">
              <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 flex items-center gap-1 text-xs text-slate-400 font-medium">
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-[11px] font-mono">{scenario.characterName} is replying...</span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-slate-200 text-slate-600 text-xs rounded-xl flex items-start gap-2 max-w-xl mx-auto">
              <AlertCircle size={16} className="text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-rose-700">English Coach Connection Issue</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
                <p className="text-[10px] text-slate-400 mt-1">To fix this, please verify that your <b>GEMINI_API_KEY</b> is correctly declared in the AI Studio Settings secrets panel to establish full-stack model context.</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Form Input */}
        <div className="bg-white border-t border-slate-100 px-5 py-3 space-y-2">
          {recognitionError && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-medium">
                <AlertCircle size={13} className="text-amber-600" />
                {recognitionError}
              </span>
              <button 
                type="button"
                onClick={() => setRecognitionError(null)}
                className="text-[10px] text-amber-500 hover:text-amber-700 underline font-semibold"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-center gap-3">
            {/* Voice input button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-3 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer ${
                isListening 
                  ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-md' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title={isListening ? "Listening... Click to stop" : "Speak to write English"}
            >
              {isListening ? (
                <div className="flex items-center gap-1.5">
                  <Mic size={15} />
                  <span className="text-[10px] uppercase font-bold tracking-widest font-mono">REC</span>
                </div>
              ) : (
                <Mic size={15} />
              )}
            </button>

            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Listening... Speak clearly in English." : `Say or speak to ${scenario.characterName}...`}
              className={`flex-1 py-3 px-4 border text-xs md:text-sm rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-300 transition duration-150 ${
                isListening 
                  ? 'bg-red-50/50 border-red-200 text-red-900 placeholder-red-400' 
                  : 'bg-slate-50 border-slate-100 focus:border-indigo-300 focus:bg-white'
              }`}
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isTyping}
              className={`p-3 rounded-xl flex items-center justify-center transition cursor-pointer ${
                inputText.trim() ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Coach Grammar and Correction Side Panel */}
      <div className="w-full lg:w-80 xl:w-96 flex flex-col bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-xs p-5 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600">
            <Zap size={18} fill="currentColor" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-800">Grammar Coach Insights</h4>
            <p className="text-[10px] text-slate-400">Click user bubbles to see evaluations</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-between overflow-y-auto min-h-[250px]">
          <AnimatePresence mode="wait">
            {activeCorrectionId ? (
              <motion.div
                key={activeCorrectionId}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-4 text-xs"
              >
                {(() => {
                  const message = messages.find(m => m.id === activeCorrectionId);
                  if (!message || !message.correction) return <p className="text-slate-400 italic">No correction selected.</p>;

                  const corr = message.correction;

                  return (
                    <div className="space-y-4">
                      {/* Typo review comparing raw vs corrected */}
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-400">Review</span>
                        <div className="p-3 bg-rose-50 border border-slate-200 text-slate-600 rounded-xl space-y-1">
                          <p className="font-semibold text-[10px] text-rose-500 uppercase tracking-widest">You said:</p>
                          <p className="italic text-slate-700">"{message.text}"</p>
                        </div>
                        <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl space-y-1">
                          <p className="font-semibold text-[10px] text-emerald-600 uppercase tracking-widest">Recommended Phrasing:</p>
                          <p className="font-medium text-slate-800">"{corr.corrected}"</p>
                        </div>
                      </div>

                      {/* Educational Explain block */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-400">Grammar rule explained</span>
                        <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-600 leading-relaxed">
                          {corr.explanation}
                        </div>
                      </div>

                      {/* Alternative selections */}
                      {corr.suggestions && corr.suggestions.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-indigo-400">Alternative ways to speak</span>
                          <div className="space-y-2">
                            {corr.suggestions.map((s, sIdx) => (
                              <div key={sIdx} className="flex gap-2 items-start p-2.5 bg-indigo-50/50 border border-indigo-100/10 rounded-lg">
                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <p className="text-slate-700 italic font-mono text-[11px] leading-relaxed">"{s}"</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-3">
                <div className="border border-slate-100 p-3 rounded-full bg-slate-50">
                  <MessageSquare size={24} className="text-slate-300" />
                </div>
                <div>
                  <p className="font-medium text-xs text-slate-500">Practice dialogue above</p>
                  <p className="text-[11px] text-slate-400 mt-1">Your grammar corrections and alternative structures will display here automatically.</p>
                </div>
              </div>
            )}
          </AnimatePresence>

          {/* Prompt Suggestion Pill */}
          <div className="border-t border-slate-100 pt-3 mt-4">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Award size={14} className="text-indigo-600" /> Live Speaking tip:
            </div>
            <p className="text-[10px] text-slate-400 italic mt-1 font-sans">
              "Try ordering food, expressing conditions using 'if I could...', or making a request. Our coach is responsive!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
