/**
 * useSpeechRecognition.js
 * Custom hook wrapping the Web Speech API for continuous speech-to-text.
 * Used by the teacher to generate live captions from their microphone.
 * Broadcasts transcript entries via socket to all participants.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useSpeechRecognition(socket, roomId) {
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      console.warn('[SpeechRecognition] Not supported in this browser');
    }
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition || !socket) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          const text = event.results[i][0].transcript.trim();
          if (text) {
            const entry = {
              id: `t-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              text,
              timestamp: new Date().toISOString(),
              speaker: 'Teacher',
            };
            // Broadcast to all participants via socket
            socket.emit('transcript-entry', entry);
            console.log('[Speech]', text);
          }
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.error('[SpeechRecognition] Error:', event.error);
    };

    recognition.onend = () => {
      // Auto-restart if we're still supposed to be listening
      if (isListeningRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Already started, ignore
        }
      }
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
      console.log('[SpeechRecognition] Started');
    } catch (e) {
      console.error('[SpeechRecognition] Failed to start:', e);
    }
  }, [socket]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    console.log('[SpeechRecognition] Stopped');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isListeningRef.current = false;
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  return { isListening, startListening, stopListening, supported };
}
