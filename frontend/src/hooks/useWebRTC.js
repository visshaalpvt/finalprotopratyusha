import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const getSocketUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  // If we are on localhost but the env says Render, prioritize localhost to avoid stale config issues
  if (window.location.hostname === 'localhost' && envUrl?.includes('onrender.com')) {
    return 'http://localhost:3001';
  }
  return envUrl || 'http://localhost:3001';
};

const SOCKET_URL = getSocketUrl();

export function useWebRTC(roomId, isTeacher, userName, isJoined, onJoinApproved) {
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const iceCandidateQueue = useRef({});

  // Sync ref with state for async handlers
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // ICE Servers for STUN
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  // 1. Socket Lifecycle: Stabilize connection
  useEffect(() => {
    if (!isJoined) return;

    console.log(`[Socket] Connecting to ${SOCKET_URL}`);
    
    // Explicitly allow polling first for better compatibility with proxies/Render
    const newSocket = io(SOCKET_URL, { 
      transports: ['polling', 'websocket'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });
    
    socketRef.current = newSocket;
    setSocket(newSocket);

    const createPeer = (peerId, isInitiator, peerIsTeacher, peerName) => {
      if (peersRef.current[peerId]) return peersRef.current[peerId].pc;
      const peer = new RTCPeerConnection(iceServers);

      // Use the ref to get the current stream without making it a dependency
      const currentStream = localStreamRef.current;
      if (currentStream) {
        currentStream.getTracks().forEach(track => {
          peer.addTrack(track, currentStream);
        });
      }

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          newSocket.emit('webrtc-ice-candidate', {
            target: peerId,
            candidate: event.candidate
          });
        }
      };

      peer.ontrack = (event) => {
        setRemotePeers(prev => {
          if (prev.find(p => p.peerId === peerId)) return prev;
          return [...prev, {
            peerId,
            stream: event.streams[0],
            isTeacher: peerIsTeacher,
            name: peerName
          }];
        });
      };

      if (isInitiator) {
        peer.onnegotiationneeded = async () => {
          try {
            const offer = await peer.createOffer();
            await peer.setLocalDescription(offer);
            newSocket.emit('webrtc-offer', {
              target: peerId,
              offer,
              isTeacher,
              name: userName
            });
          } catch (err) {
            console.error('[WebRTC] Error creating offer', err);
          }
        };
      }

      peersRef.current[peerId] = { pc: peer, isTeacher: peerIsTeacher, name: peerName };
      return peer;
    };

    newSocket.on('connect', () => {
      console.log('[Socket] Connected!', newSocket.id);
      if (isTeacher) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            setLocalStream(stream);
            newSocket.emit('join-video-room', { roomId, isTeacher });
          })
          .catch(err => {
            console.error("Failed to get local stream", err);
            alert("Could not access camera/microphone.");
          });
      } else {
        newSocket.emit('join-request', { roomId, studentName: userName });
      }
    });

    newSocket.on('join-approved', ({ roomId: approvedRoomId }) => {
      console.log(`[Approve] Joined room ${approvedRoomId}`);
      if (onJoinApproved) onJoinApproved();

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
          newSocket.emit('join-video-room', { roomId: approvedRoomId, isTeacher: false });
        })
        .catch(err => {
          console.error("Failed to get local stream", err);
          newSocket.emit('join-video-room', { roomId: approvedRoomId, isTeacher: false });
        });
    });

    newSocket.on('join-rejected', () => {
      alert('Your request to join was declined by the teacher.');
      window.location.href = '/student'; 
    });

    newSocket.on('user-connected', ({ userId, isTeacher: peerIsTeacher, name: peerName }) => {
      createPeer(userId, true, peerIsTeacher, peerName);
    });

    newSocket.on('webrtc-offer', async (data) => {
      const peer = createPeer(data.callerId, false, data.isTeacher, data.name);
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      newSocket.emit('webrtc-answer', { target: data.callerId, answer });

      if (iceCandidateQueue.current[data.callerId]) {
        for (const candidate of iceCandidateQueue.current[data.callerId]) {
          try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
        }
        iceCandidateQueue.current[data.callerId] = [];
      }
    });

    newSocket.on('webrtc-answer', async (data) => {
      const peer = peersRef.current[data.replierId]?.pc;
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        if (iceCandidateQueue.current[data.replierId]) {
          for (const candidate of iceCandidateQueue.current[data.replierId]) {
            try { await peer.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
          }
          iceCandidateQueue.current[data.replierId] = [];
        }
      }
    });

    newSocket.on('webrtc-ice-candidate', async (data) => {
      const peerData = peersRef.current[data.senderId];
      if (peerData && peerData.pc.remoteDescription) {
        try { await peerData.pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch (e) {}
      } else {
        if (!iceCandidateQueue.current[data.senderId]) iceCandidateQueue.current[data.senderId] = [];
        iceCandidateQueue.current[data.senderId].push(data.candidate);
      }
    });

    newSocket.on('room-users', (users) => {
       if (!isTeacher) {
           users.forEach(user => {
               if (user.userId !== newSocket.id) {
                   createPeer(user.userId, true, user.isTeacher, user.name);
               }
           });
       }
    });
    
    newSocket.on('user-disconnected', (userId) => {
       setRemotePeers(prev => prev.filter(p => p.peerId !== userId));
       if (peersRef.current[userId]) {
           peersRef.current[userId].pc.close();
           delete peersRef.current[userId];
       }
    });

    return () => {
      console.log('[Socket] Cleaning up...');
      newSocket.disconnect();
      Object.values(peersRef.current).forEach(p => p.pc.close());
      peersRef.current = {};
    };
  }, [isJoined, roomId, isTeacher, userName]); // localStream removed

  // 2. Stream Lifecycle: Sync tracks when localStream changes without resetting socket
  useEffect(() => {
    if (!localStream) return;
    
    Object.values(peersRef.current).forEach(({ pc }) => {
      if (pc.signalingState !== 'closed') {
        localStream.getTracks().forEach(track => {
          const senders = pc.getSenders();
          const existingSender = senders.find(s => s.track?.kind === track.kind);
          if (existingSender) {
            existingSender.replaceTrack(track);
          } else {
            pc.addTrack(track, localStream);
          }
        });
      }
    });
  }, [localStream]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  return { localStream, remotePeers, socket, toggleMic, toggleCamera };
}
