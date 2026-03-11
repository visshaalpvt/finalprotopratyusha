/**
 * TextToVoiceInput.jsx
 * For mute students: type a message → it's spoken aloud via SpeechSynthesis
 * and optionally broadcast to the meeting via socket.
 */
import React, { useState, useRef } from 'react';

const QUICK_PHRASES = [
  { text: 'I have a question', icon: '✋' },
  { text: 'I understand', icon: '👍' },
  { text: 'I am confused', icon: '🤔' },
  { text: 'Please repeat that', icon: '🔄' },
  { text: 'Thank you', icon: '🙏' },
  { text: 'Can you explain more?', icon: '💡' },
];

export default function TextToVoiceInput({ socket, roomId, userName }) {
  const [message, setMessage] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastSpoken, setLastSpoken] = useState('');
  const utteranceRef = useRef(null);

  const speak = (text) => {
    if (!text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.volume = 1;
    utterance.lang = 'en-US';

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);

    setLastSpoken(text);
    setMessage('');

    // Broadcast to meeting participants via socket
    if (socket && roomId) {
      socket.emit('text-to-voice', {
        roomId,
        userName: userName || 'Student',
        text,
        timestamp: new Date().toISOString(),
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    speak(message);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="glass-panel p-5 animate-slide-up border-purple-500/30 bg-slate-900/80">
      <div className="flex items-center gap-3 mb-4">
        <span className="p-2 bg-purple-500/20 rounded-xl text-xl">🗣️</span>
        <div>
          <h3 className="font-black text-lg text-purple-400">Text to Voice</h3>
          <p className="text-xs text-slate-400">Type a message to speak it aloud</p>
        </div>
      </div>

      {/* Quick phrases */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {QUICK_PHRASES.map((phrase, i) => (
          <button
            key={i}
            onClick={() => speak(phrase.text)}
            disabled={isSpeaking}
            className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-xl text-xs text-white font-medium transition-all disabled:opacity-50"
          >
            <span>{phrase.icon}</span>
            <span>{phrase.text}</span>
          </button>
        ))}
      </div>

      {/* Custom message input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none transition-colors"
          disabled={isSpeaking}
        />
        {isSpeaking ? (
          <button
            type="button"
            onClick={stopSpeaking}
            className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-xl transition-colors"
          >
            ⏹ Stop
          </button>
        ) : (
          <button
            type="submit"
            disabled={!message.trim()}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            🔊 Speak
          </button>
        )}
      </form>

      {/* Speaking indicator */}
      {isSpeaking && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 bg-purple-500/10 border border-purple-500/20 rounded-xl animate-pulse">
          <div className="flex gap-0.5">
            <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-4 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
            <span className="w-1 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '200ms' }} />
            <span className="w-1 h-5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-xs text-purple-300 font-bold">Speaking...</span>
        </div>
      )}

      {/* Last spoken */}
      {lastSpoken && !isSpeaking && (
        <div className="mt-3 px-3 py-2 bg-white/5 rounded-xl border border-white/5">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Last Spoken</p>
          <p className="text-sm text-slate-300 mt-0.5">"{lastSpoken}"</p>
        </div>
      )}
    </div>
  );
}
