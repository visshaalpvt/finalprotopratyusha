import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoRenderer } from './VideoRenderer';
import TranscriptPanel from './TranscriptPanel';
import SignLanguageViewer from './SignLanguageViewer';

export default function LiveClassroom() {
  const { user } = useAuth();
  const [inLobby, setInLobby] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [userName, setUserName] = useState(user?.displayName || '');
  const [role, setRole] = useState(user?.role || 'student');
  const [isWaiting, setIsWaiting] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  // Waiting Room / Join Requests (Teacher-side)
  const [joinRequests, setJoinRequests] = useState([]);

  // Accessibility State Toggles
  const [showCaptions, setShowCaptions] = useState(true);
  const [showSignLanguage, setShowSignLanguage] = useState(false);

  // This hook handles the heavy lifting for WebRTC & Socket signaling.
  // It only connects when `!inLobby` is true.
  const { localStream, remotePeers, socket } = useWebRTC(
    roomId,
    role === 'teacher',
    userName,
    !inLobby
  );

  // Transcript state fetched directly from the WebRTC signaling socket logic for convenience
  const [transcript, setTranscript] = useState([]);

  useEffect(() => {
    if (!socket) return;
    socket.on('transcript-broadcast', (entry) => {
      setTranscript(prev => [...prev, entry]);
    });
    socket.on('transcript-history', (history) => {
      setTranscript(history);
    });

    // Listen for join requests (teacher sees these)
    socket.on('join-request', ({ studentId, userName: reqName }) => {
      setJoinRequests(prev => {
        if (prev.find(r => r.studentId === studentId)) return prev;
        return [...prev, { studentId, userName: reqName }];
      });
    });

    return () => {
      socket.off('transcript-broadcast');
      socket.off('transcript-history');
      socket.off('join-request');
    };
  }, [socket]);

  // Load from URL ?room=XYZ and generate initial room codes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    
    if (roomParam) {
      setRoomId(roomParam);
    } else if (role === 'teacher' && !roomId) {
      // Auto-generate code for host
      setRoomId('CLASS' + Math.floor(1000 + Math.random() * 9000));
    }
  }, [role, roomId]);

  const handleCopyInvite = () => {
    const inviteUrl = `${window.location.origin}/classroom?room=${roomId}`;
    navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const handleAcceptRequest = (studentId) => {
    if (!socket) return;
    socket.emit('join-response', { studentId, roomId, status: 'accepted' });
    setJoinRequests(prev => prev.filter(r => r.studentId !== studentId));
  };

  const handleDeclineRequest = (studentId) => {
    if (!socket) return;
    socket.emit('join-response', { studentId, roomId, status: 'declined' });
    setJoinRequests(prev => prev.filter(r => r.studentId !== studentId));
  };


  // 1️⃣ LOBBY VIEW
  if (inLobby) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-900 text-white p-6">
        <div className="glass-panel w-full max-w-md p-8 animate-fade-in border-indigo-500/30">
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block animate-bounce-slow">🏫</span>
            <h1 className="text-3xl font-black text-white tracking-tight">Live Classroom</h1>
            <p className="text-slate-400 mt-2 text-sm">Create or join an interactive learning session.</p>
          </div>

          <div className="space-y-6">
            {role === 'teacher' ? (
              /* TEACHER LOBBY UI */
              <div className="space-y-6">
                <div className="p-6 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-center shadow-inner">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2">Host Session ID</p>
                  <p className="text-4xl font-mono font-black text-white">{roomId || '...'}</p>
                  <p className="text-[10px] text-slate-500 mt-3 font-medium uppercase tracking-tighter">Share this code with your students</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Your Display Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="e.g. Prof. Smith"
                      className="input-field mt-1 font-semibold"
                    />
                  </div>

                  <button
                    onClick={() => setInLobby(false)}
                    disabled={!roomId || !userName}
                    className="btn-primary w-full py-4 text-lg bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30 font-black tracking-tight"
                  >
                    🚀 Start Broadcast
                  </button>
                </div>
              </div>
            ) : (
              /* STUDENT LOBBY UI */
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Classroom ID to Join</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value)}
                    placeholder="e.g. CLASS1234"
                    className="input-field mt-1 font-mono tracking-wider font-bold text-indigo-400"
                    readOnly={!!new URLSearchParams(window.location.search).get('room')}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Your Full Name</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="e.g. Rahul Kumar"
                    className="input-field mt-1 font-semibold"
                  />
                </div>

                <button
                  onClick={() => {
                    setIsWaiting(true);
                    setInLobby(false);
                  }}
                  disabled={!roomId || !userName}
                  className="btn-primary w-full py-4 text-lg bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25 font-black tracking-tight"
                >
                  🚪 Join Classroom
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Find the teacher stream
  const teacherPeer = remotePeers.find(p => p.isTeacher);
  const amITeacher = role === 'teacher';

  const mainStream = amITeacher ? localStream : (teacherPeer?.stream || null);
  const students = amITeacher ? remotePeers : remotePeers.filter(p => !p.isTeacher);

  // 1.5 WAITING ROOM (Student waiting for approval AFTER lobby)
  if (!amITeacher && isWaiting && remotePeers.length === 0 && !mainStream) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-slate-900 border-x border-slate-800 text-white p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-20 pointer-events-none mix-blend-screen" />
        <div className="glass-panel text-center max-w-sm p-8 space-y-4 animate-fade-in relative z-10 border-amber-500/30">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-2xl font-black">Waiting Room</h2>
          <p className="text-slate-300 text-sm">Waiting for the teacher to accept your request to join classroom <span className="font-mono text-amber-400 font-bold">{roomId}</span>...</p>
        </div>
      </div>
    );
  }

  // 2️⃣ ROOM VIEW
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-slate-950">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-slate-900 border-b border-slate-800 shrink-0 shadow-lg z-10 relative">
        <div className="flex items-center gap-4">
          <div className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg border border-indigo-500/30 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
            <span className="font-mono font-bold tracking-widest text-sm">{roomId}</span>
          </div>
          {amITeacher && (
            <div className="relative">
              <button
                onClick={handleCopyInvite}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20"
              >
                {inviteCopied ? '✅ Copied!' : '🔗 Copy Invite'}
              </button>
              
              {/* Join Requests Dropdown */}
              {joinRequests.length > 0 && (
                <div className="absolute top-full left-0 mt-3 w-72 bg-slate-800 border border-indigo-500/50 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] p-3 z-50">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3 pl-1 flex items-center justify-between">
                    Waiting Room
                    <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[10px]">{joinRequests.length}</span>
                  </p>
                  <div className="space-y-2">
                    {joinRequests.map(req => (
                      <div key={req.studentId} className="flex items-center justify-between text-sm bg-slate-900/50 border border-slate-700 p-2.5 rounded-lg shadow-inner">
                        <span className="font-bold text-slate-200 truncate pr-2 max-w-[120px]">{req.userName}</span>
                        <div className="flex gap-1.5 shrink-0">
                          <button onClick={() => handleAcceptRequest(req.studentId)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors">Accept</button>
                          <button onClick={() => handleDeclineRequest(req.studentId)} className="bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 rounded-md text-xs font-bold transition-colors">Deny</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <p className="text-slate-400 text-sm font-medium border-l border-slate-700 pl-4">{remotePeers.length + 1} Participants</p>
        </div>
        <button className="btn-danger py-1.5 px-6 rounded-full text-sm font-bold" onClick={() => window.location.reload()}>Leave Meeting</button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Main Video Area */}
        <div className="flex-1 flex flex-col p-4 overflow-y-auto relative z-0">

          {/* Main Stage (Teacher) */}
          <div className="flex justify-center mb-4 min-h-[50vh]">
            <div className="w-full max-w-5xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-slate-800">
              {mainStream ? (
                <VideoRenderer
                  stream={mainStream}
                  isLocal={amITeacher}
                  isTeacher={true}
                  name={amITeacher ? userName : (teacherPeer?.name || 'Teacher')}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                  <span className="text-6xl mb-4 opacity-50 block animate-pulse">👨‍🏫</span>
                  <p className="font-bold tracking-wider">Waiting for teacher to join...</p>
                </div>
              )}
            </div>
          </div>

          {/* Student Grid (If any) */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* If I am a student, show my placeholder here */}
            {!amITeacher && (
              <div className="aspect-video relative rounded-2xl overflow-hidden shadow-xl border border-slate-700 bg-slate-800 flex flex-col items-center justify-center">
                <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-xl shadow-lg mb-2">🎓</div>
                <span className="text-white font-bold text-sm">{userName} (You)</span>
              </div>
            )}
            {/* Show other students */}
            {students.map((peer, i) => (
              <div key={i} className="aspect-video relative rounded-2xl overflow-hidden shadow-xl border border-slate-700 bg-slate-800 flex flex-col items-center justify-center">
                {peer.stream ? (
                   <VideoRenderer stream={peer.stream} isLocal={false} isTeacher={false} name={peer.name} />
                ) : (
                  <>
                    <div className="w-12 h-12 bg-slate-600 rounded-full flex items-center justify-center text-xl shadow-lg mb-2">🎓</div>
                    <span className="text-white font-bold text-sm tracking-wide">{peer.name}</span>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* ⚡ Live Caption Panel Overflow */}
          {showCaptions && transcript.length > 0 && (
            <div className="fixed bottom-12 left-0 right-80 pointer-events-none flex justify-center z-50">
              <div className="bg-black/80 backdrop-blur-md px-8 py-4 rounded-[2rem] max-w-4xl w-11/12 border border-slate-700/50 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-all">
                <p className="text-center font-medium tracking-wide drop-shadow-md text-white md:text-2xl">
                  {transcript[transcript.length - 1]?.text}
                </p>
              </div>
            </div>
          )}

        </div>

        {/* 3️⃣ ACCESSIBILITY CONTROLS PANEL */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] z-20">
          <div className="p-5 border-b border-slate-800">
            <h3 className="font-black text-xl text-white flex items-center gap-3">
              <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-lg">⚙️</span>
              Accessibility Controls
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">

            {/* Core Toggles */}
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <p className="font-bold text-white text-sm">Live Captions</p>
                  <p className="text-xs text-slate-400 mt-1">Real-time STT Overlay</p>
                </div>
                <button
                  onClick={() => setShowCaptions(!showCaptions)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${showCaptions ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}
                >
                  {showCaptions ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                <div>
                  <p className="font-bold text-white text-sm">Sign Language UI</p>
                  <p className="text-xs text-slate-400 mt-1">3D Visualization Mode</p>
                </div>
                <button
                  onClick={() => setShowSignLanguage(!showSignLanguage)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${showSignLanguage ? 'bg-emerald-500 text-emerald-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-700 text-slate-400'}`}
                >
                  {showSignLanguage ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>

            {/* Extras */}
            {showSignLanguage && (
              <div className="animate-fade-in">
                <SignLanguageViewer transcript={transcript} currentLanguage={'en-US'} />
              </div>
            )}

            <TranscriptPanel transcript={transcript} fontSize="sm" />
          </div>
        </div>
      </div>
    </div>
  );
}
