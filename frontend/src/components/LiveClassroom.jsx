import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { VideoRenderer } from './VideoRenderer';
import TranscriptPanel from './TranscriptPanel';
import SignCamera from './SignCamera';
import SignLanguageViewer from './SignLanguageViewer';
import SignPanel from './SignPanel';
import BraillePanel from './BraillePanel';
import AudioPlayer from './AudioPlayer';
import AIQuestionPanel from './AIQuestionPanel';
import GamificationHUD from './GamificationHUD';
import LectureSummary from './LectureSummary';
import TextToVoiceInput from './TextToVoiceInput';
import MeetingTopBar from './MeetingTopBar';
import MeetingControls from './MeetingControls';
import ParticipantsPanel from './ParticipantsPanel';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { X, Users as UsersIcon, Shield, User } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Accessibility mode definitions                                     */
/* ------------------------------------------------------------------ */
const A11Y_MODES = [
  { id: 'deaf',  label: 'Deaf Mode',  icon: '👂', desc: 'Captions + Sign Visuals' },
  { id: 'blind', label: 'Blind Mode', icon: '👁️', desc: 'Audio Narration + Braille' },
  { id: 'mute',  label: 'Mute Mode',  icon: '🤐', desc: 'Sign Chat + Text-to-Voice' },
];

export default function LiveClassroom() {
  const { user } = useAuth();
  const [inLobby, setInLobby] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [role, setRole] = useState(user?.role || 'student');
  const [isWaiting, setIsWaiting] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Layout & Panel State
  const [layout, setLayout] = useState('speaker');
  const [activePanel, setActivePanel] = useState(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [signBroadcasts, setSignBroadcasts] = useState({});

  // Accessibility State
  const [accessibilityMode, setAccessibilityMode] = useState(null); // null | 'deaf' | 'blind' | 'mute'
  const [showCaptions, setShowCaptions] = useState(false);
  const [showSignLanguage, setShowSignLanguage] = useState(false);

  // Transcript & AI
  const [transcript, setTranscript] = useState([]);
  const [summaryText, setSummaryText] = useState('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  // Gamification
  const [xp, setXp] = useState(0);
  const [lastXpReason, setLastXpReason] = useState('');

  // Text-to-voice notifications
  const [voiceNotification, setVoiceNotification] = useState(null);

  // Waiting Room / Join Requests (Teacher-side)
  const [joinRequests, setJoinRequests] = useState([]);

  // WebRTC & Socket signaling
  const { localStream, remotePeers, socket, toggleMic, toggleCamera } = useWebRTC(
    roomId,
    role === 'teacher',
    userName,
    !inLobby,
    () => setIsWaiting(false)
  );

  // Speech Recognition (teacher only)
  const { isListening, startListening, stopListening, supported: speechSupported } = useSpeechRecognition(socket, roomId);

  /* ---- Apply accessibility mode presets ---- */
  useEffect(() => {
    if (accessibilityMode === 'deaf') {
      setShowCaptions(true);
      setShowSignLanguage(true);
    } else if (accessibilityMode === 'blind') {
      setShowCaptions(false);
      setShowSignLanguage(false);
    } else if (accessibilityMode === 'mute') {
      setShowCaptions(true);
      setShowSignLanguage(false);
    }
  }, [accessibilityMode]);

  /* ---- Socket event listeners ---- */
  useEffect(() => {
    if (!socket) return;

    const handleTranscript = (entry) => setTranscript(prev => [...prev, entry]);
    const handleHistory = (history) => setTranscript(history);
    const handleJoinReq = ({ studentId, userName: reqName }) => {
      setJoinRequests(prev => {
        if (prev.find(r => r.studentId === studentId)) return prev;
        return [...prev, { studentId, userName: reqName }];
      });
    };
    const handleWaitingList = (list) => setJoinRequests(list);

    const handleSignBroadcast = (data) => {
      setSignBroadcasts(prev => ({
        ...prev,
        [data.userId]: { ...data, timestamp: Date.now() }
      }));
      setTimeout(() => {
        setSignBroadcasts(prev => {
          const newState = { ...prev };
          if (newState[data.userId]?.timestamp === data.timestamp) {
            delete newState[data.userId];
          }
          return newState;
        });
      }, 5000);
    };

    const handleXpUpdate = (data) => {
      setXp(data.xp);
      setLastXpReason(data.reason);
      setTimeout(() => setLastXpReason(''), 3000);
    };

    const handleSummary = (data) => {
      setSummaryText(data.summary);
      setIsSummaryLoading(false);
    };

    const handleTextToVoice = (data) => {
      setVoiceNotification(data);
      // Auto-speak the received message
      const utterance = new SpeechSynthesisUtterance(`${data.userName} says: ${data.text}`);
      utterance.rate = 1;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
      setTimeout(() => setVoiceNotification(null), 5000);
    };

    socket.on('transcript-broadcast', handleTranscript);
    socket.on('transcript-history', handleHistory);
    socket.on('join-request-received', handleJoinReq);
    socket.on('waiting-list', handleWaitingList);
    socket.on('sign-broadcast', handleSignBroadcast);
    socket.on('xp-update', handleXpUpdate);
    socket.on('summary-generated', handleSummary);
    socket.on('text-to-voice-broadcast', handleTextToVoice);

    return () => {
      socket.off('transcript-broadcast', handleTranscript);
      socket.off('transcript-history', handleHistory);
      socket.off('join-request-received', handleJoinReq);
      socket.off('waiting-list', handleWaitingList);
      socket.off('sign-broadcast', handleSignBroadcast);
      socket.off('xp-update', handleXpUpdate);
      socket.off('summary-generated', handleSummary);
      socket.off('text-to-voice-broadcast', handleTextToVoice);
    };
  }, [socket]);

  // Auto-start speech recognition for teachers when they enter the classroom
  useEffect(() => {
    if (!inLobby && role === 'teacher' && speechSupported && socket && !isListening) {
      const timer = setTimeout(() => startListening(), 2000);
      return () => clearTimeout(timer);
    }
  }, [inLobby, role, speechSupported, socket]);

  // Load room from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomFromUrl = params.get('room');
    if (roomFromUrl) {
      setRoomId(roomFromUrl);
    } else if (role === 'teacher') {
      const generated = 'CLASS' + Math.floor(1000 + Math.random() * 9000);
      setRoomId(generated);
    }
  }, [role]);

  /* ---- Handlers ---- */
  const handleCopyInvite = () => {
    const link = `${window.location.origin}/classroom?room=${roomId}`;
    navigator.clipboard.writeText(link);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 3000);
  };

  const handleAcceptRequest = (studentId) => {
    socket?.emit('approve-user', { roomId, studentSocketId: studentId });
    setJoinRequests(prev => prev.filter(r => r.studentId !== studentId));
  };

  const handleDeclineRequest = (studentId) => {
    socket?.emit('reject-user', { roomId, studentSocketId: studentId });
    setJoinRequests(prev => prev.filter(r => r.studentId !== studentId));
  };

  const handleToggleMic = () => {
    toggleMic();
    setIsMicMuted(!isMicMuted);
  };

  const handleToggleCamera = () => {
    toggleCamera();
    setIsCameraOff(!isCameraOff);
  };

  const handleSignDetected = useCallback((signData, confidence) => {
    if (socket && roomId) {
      socket.emit('sign-detected', { roomId, signData, confidence });
      const timestamp = Date.now();
      setSignBroadcasts(prev => ({
        ...prev,
        'local': { signData, confidence, timestamp }
      }));
      setTimeout(() => {
        setSignBroadcasts(prev => {
          const newState = { ...prev };
          if (newState['local']?.timestamp === timestamp) {
            delete newState['local'];
          }
          return newState;
        });
      }, 5000);
    }
  }, [socket, roomId]);

  const handleGenerateSummary = () => {
    if (transcript.length === 0) return;
    setIsSummaryLoading(true);
    socket?.emit('request-summary');
  };

  /* ============================================================ */
  /*  LOBBY SCREEN                                                  */
  /* ============================================================ */
  if (inLobby) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-950 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none" />
        
        <div className="w-full max-w-xl animate-slide-up relative z-10">
          <div className="glass-panel p-8 sm:p-12 space-y-8 border-indigo-500/20 shadow-2xl">
            <div className="text-center space-y-2">
              <h1 className="text-4xl font-black text-white tracking-tight">
                {role === 'teacher' ? 'Start a Lecture' : 'Join Classroom'}
              </h1>
              <p className="text-slate-400 font-medium">Configure your session before entering</p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Room Identity</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter Room ID"
                    className="input-field text-center font-mono text-xl tracking-[0.2em] font-black py-4 bg-slate-900/50"
                  />
                  {role === 'teacher' && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="badge-info">Auto-Generated</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pl-1">Your Name</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Rahul Kumar"
                  className="input-field mt-1 font-bold text-lg"
                />
              </div>

              <button
                onClick={() => {
                  setIsWaiting(true);
                  setInLobby(false);
                }}
                disabled={!roomId || !userName}
                className="btn-primary w-full py-5 text-xl bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 font-black"
              >
                {role === 'teacher' ? '🚀 Launch Classroom' : '🚪 Request to Join'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================ */
  /*  WAITING ROOM (Student)                                        */
  /* ============================================================ */
  const amITeacher = role === 'teacher';
  const teacherPeer = remotePeers.find(p => p.isTeacher);
  const mainStream = amITeacher ? localStream : (teacherPeer?.stream || null);
  const students = amITeacher ? remotePeers : remotePeers.filter(p => !p.isTeacher);

  if (!amITeacher && isWaiting && remotePeers.length === 0 && !mainStream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-meeting text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-10 pointer-events-none" />
        <div className="glass-panel text-center max-w-sm p-10 space-y-6 animate-fade-in relative z-10 border-amber-500/30">
          <div className="w-20 h-20 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-2xl font-black">Waiting for Teacher</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Knocking on the door of <span className="font-mono text-amber-400 font-bold">{roomId}</span>.<br/> 
              Please stay on this screen while the teacher reviews your request.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ============================================================ */
  /*  MAIN CLASSROOM VIEW                                           */
  /* ============================================================ */
  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] w-full bg-meeting overflow-hidden">
      <MeetingTopBar 
        roomId={roomId} 
        participantCount={remotePeers.length + 1}
        onCopyInvite={handleCopyInvite}
        inviteCopied={inviteCopied}
      />

      {/* Prominent Knock Notification for Teacher */}
      <AnimatePresence>
        {amITeacher && joinRequests.length > 0 && activePanel !== 'participants' && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] pointer-events-auto"
          >
            <button 
              onClick={() => setActivePanel('participants')}
              className="bg-amber-500 text-amber-950 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-amber-400/50 hover:scale-105 transition-transform group"
            >
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center animate-bounce">
                <UsersIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-black text-sm uppercase tracking-tight leading-none mb-1">Knock, Knock!</p>
                <p className="text-[10px] font-bold opacity-80 uppercase tracking-wider">{joinRequests.length} student{joinRequests.length > 1 ? 's' : ''} waiting</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text-to-Voice Notification */}
      <AnimatePresence>
        {voiceNotification && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 60, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-20 right-8 z-[60] pointer-events-none"
          >
            <div className="bg-purple-600/90 backdrop-blur-xl text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 max-w-xs">
              <p className="text-[10px] uppercase tracking-widest font-bold text-purple-200 mb-1">🗣️ Voice Message</p>
              <p className="text-sm font-bold">{voiceNotification.userName}: "{voiceNotification.text}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col relative overflow-hidden min-h-0">
        {/* Main Stage / Grid */}
        <div className={cn(
          "flex-1 flex flex-col p-2 pb-20 transition-all duration-500 ease-in-out min-h-0",
          activePanel ? "pr-[340px]" : "pr-2"
        )}>

          {layout === 'speaker' ? (
            <div className="flex-1 flex flex-col gap-2 min-h-0">
              {/* Speaker View */}
              <div className="flex-1 flex items-center justify-center min-h-0">
                <div className="w-full h-full max-w-6xl">
                  {mainStream ? (
                    <div className="relative w-full h-full">
                      <VideoRenderer
                        stream={mainStream}
                        isLocal={amITeacher}
                        isTeacher={true}
                        name={amITeacher ? userName : (teacherPeer?.name || 'Teacher')}
                      />
                      <AnimatePresence>
                        {signBroadcasts[amITeacher ? 'local' : (teacherPeer?.peerId)] && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            className="absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-xl p-3 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-3"
                          >
                            <span className="text-2xl">{signBroadcasts[amITeacher ? 'local' : (teacherPeer?.peerId)].signData.icon}</span>
                            <span className="text-white font-bold text-sm tracking-tight">{signBroadcasts[amITeacher ? 'local' : (teacherPeer?.peerId)].signData.label}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-surface rounded-2xl border border-white/5">
                      <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-5xl mb-4 shadow-2xl animate-pulse-soft">👨‍🏫</div>
                      <p className="text-slate-400 font-bold tracking-widest text-sm uppercase">Waiting for teacher broadcast...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Floating captions — overlaid at bottom of video */}
              {showCaptions && transcript.length > 0 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-full max-w-4xl px-6 pointer-events-none z-20">
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-black/80 backdrop-blur-2xl px-6 py-3 rounded-2xl border border-white/10 shadow-3xl text-center"
                  >
                    <p className="text-white text-base md:text-lg font-medium tracking-wide drop-shadow-lg">
                      {transcript[transcript.length - 1]?.text}
                    </p>
                  </motion.div>
                </div>
              )}

              {/* Strip of students at bottom */}
              <div className="h-24 sm:h-28 flex-shrink-0 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {!amITeacher && (
                  <div className="w-40 flex-shrink-0 relative group">
                    <VideoRenderer stream={localStream} isLocal={true} isTeacher={false} name={userName} />
                    <AnimatePresence>
                      {signBroadcasts['local'] && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-xl flex items-center gap-2"
                        >
                          <span className="text-xl">{signBroadcasts['local'].signData.icon}</span>
                          <span className="text-white font-bold text-xs">{signBroadcasts['local'].signData.label}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {students.map((peer, i) => (
                  <div key={i} className="w-40 flex-shrink-0 relative group">
                    <VideoRenderer stream={peer.stream} isLocal={false} isTeacher={false} name={peer.name} />
                    <AnimatePresence>
                      {signBroadcasts[peer.peerId] && (
                        <motion.div 
                          initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                          className="absolute top-2 right-2 bg-indigo-600/90 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-xl flex items-center gap-2"
                        >
                          <span className="text-xl">{signBroadcasts[peer.peerId].signData.icon}</span>
                          <span className="text-white font-bold text-xs">{signBroadcasts[peer.peerId].signData.label}</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Grid View */
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar min-h-0">
              <div className="aspect-video relative group">
                <VideoRenderer 
                  stream={mainStream} 
                  isLocal={amITeacher} 
                  isTeacher={true} 
                  name={amITeacher ? userName : (teacherPeer?.name || 'Teacher')} 
                />
              </div>
              {!amITeacher && (
                <div className="aspect-video relative group">
                  <VideoRenderer stream={localStream} isLocal={true} isTeacher={false} name={userName} />
                </div>
              )}
              {students.map((peer, i) => (
                <div key={i} className="aspect-video relative group">
                  <VideoRenderer stream={peer.stream} isLocal={false} isTeacher={false} name={peer.name} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ============================================================ */}
        {/*  ACCESSIBILITY SIDEBAR                                        */}
        {/* ============================================================ */}
        <AnimatePresence>
          {activePanel === 'accessibility' && (
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              className="fixed right-2 top-[4.5rem] bottom-20 w-[320px] bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden"
            >
              <div className="p-3 border-b border-white/5 flex items-center justify-between flex-shrink-0">
                <h3 className="text-white font-bold flex items-center gap-2 text-sm">✨ Accessibility & Tools</h3>
                <button onClick={() => setActivePanel(null)} className="p-1 hover:bg-white/5 rounded-full text-slate-400 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">

                {/* Gamification HUD (moved from video area) */}
                <GamificationHUD xp={xp} lastXpReason={lastXpReason} />

                {/* Teacher Speech Recognition Controls (moved from video area) */}
                {amITeacher && speechSupported && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/5 rounded-xl border border-white/10">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={cn(
                        "px-3 py-1 rounded-full text-[9px] font-black tracking-widest transition-all flex items-center gap-1.5",
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-emerald-500 text-emerald-950"
                      )}
                    >
                      {isListening ? (
                        <><span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> REC</>
                      ) : (
                        <><span className="w-1.5 h-1.5 bg-emerald-900 rounded-full" /> CAPTIONS</>
                      )}
                    </button>
                    <span className="text-slate-400 text-[10px]">
                      {isListening ? 'Recording...' : 'Start captions'}
                    </span>
                  </div>
                )}

                {/* Accessibility Mode Selector */}
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Accessibility Mode</p>
                  <div className="grid grid-cols-3 gap-2">
                    {A11Y_MODES.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setAccessibilityMode(accessibilityMode === m.id ? null : m.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-center",
                          accessibilityMode === m.id
                            ? "border-indigo-500 bg-indigo-500/20 shadow-md scale-[1.02]"
                            : "border-white/10 hover:border-indigo-500/50 hover:bg-white/5"
                        )}
                      >
                        <span className="text-xl">{m.icon}</span>
                        <span className="text-[10px] font-bold text-white">{m.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Individual Toggles */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-white text-xs font-bold">📝 Live Captions</span>
                    <button onClick={() => setShowCaptions(!showCaptions)} className={cn("px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all", showCaptions ? "bg-emerald-500 text-emerald-950" : "bg-slate-700 text-slate-400")}>
                      {showCaptions ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                    <span className="text-white text-xs font-bold">🤟 Sign Visuals</span>
                    <button onClick={() => setShowSignLanguage(!showSignLanguage)} className={cn("px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition-all", showSignLanguage ? "bg-emerald-500 text-emerald-950" : "bg-slate-700 text-slate-400")}>
                      {showSignLanguage ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                {/* ---- DEAF MODE panels ---- */}
                {(accessibilityMode === 'deaf' || showSignLanguage) && (
                  <div className="space-y-3">
                    <SignCamera
                      isEnabled={true}
                      onSignDetected={handleSignDetected}
                      externalStream={localStream}
                    />
                    <SignLanguageViewer transcript={transcript} />
                  </div>
                )}

                {/* ---- BLIND MODE panels ---- */}
                {accessibilityMode === 'blind' && (
                  <div className="space-y-3">
                    <AudioPlayer transcript={transcript} />
                    <BraillePanel transcript={transcript} />
                  </div>
                )}

                {/* ---- MUTE MODE panels ---- */}
                {accessibilityMode === 'mute' && (
                  <div className="space-y-3">
                    <SignCamera
                      isEnabled={true}
                      onSignDetected={handleSignDetected}
                      externalStream={localStream}
                    />
                    <SignPanel socket={socket} studentName={userName} />
                    <TextToVoiceInput socket={socket} roomId={roomId} userName={userName} />
                  </div>
                )}

                {/* ---- TRANSCRIPT (always visible) ---- */}
                <TranscriptPanel transcript={transcript} fontSize="sm" />

                {/* ---- AI Learning Assistant ---- */}
                <AIQuestionPanel socket={socket} />

                {/* ---- Lecture Summary ---- */}
                <LectureSummary
                  summary={summaryText}
                  onGenerate={handleGenerateSummary}
                  isLoading={isSummaryLoading}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <ParticipantsPanel 
          isOpen={activePanel === 'participants'}
          onClose={() => setActivePanel(null)}
          participants={remotePeers}
          joinRequests={joinRequests}
          isTeacher={amITeacher}
          onAccept={handleAcceptRequest}
          onReject={handleDeclineRequest}
          userName={userName}
        />
      </div>

      <MeetingControls 
        isMicMuted={isMicMuted}
        onToggleMic={handleToggleMic}
        isCameraOff={isCameraOff}
        onToggleCamera={handleToggleCamera}
        onLeave={() => window.location.reload()}
        onToggleParticipants={() => setActivePanel(activePanel === 'participants' ? null : 'participants')}
        onToggleChat={() => setActivePanel(activePanel === 'accessibility' ? null : 'accessibility')}
        onToggleLayout={() => setLayout(layout === 'grid' ? 'speaker' : 'grid')}
        activePanel={activePanel}
        layout={layout}
        hasJoinRequests={amITeacher && joinRequests.length > 0}
      />
    </div>
  );
}
