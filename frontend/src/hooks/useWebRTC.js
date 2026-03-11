import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useWebRTC(roomId, isTeacher, userName, isJoined) {
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const peersRef = useRef({});
  const iceCandidateQueue = useRef({});

  // ICE Servers for STUN
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!isJoined) return;

    const newSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = newSocket;
    setSocket(newSocket);

    const createPeer = (peerId, isInitiator, peerIsTeacher, peerName) => {
      // If peer connection already exists, just return it
      if (peersRef.current[peerId]) return peersRef.current[peerId].pc;

      const peer = new RTCPeerConnection(iceServers);

      // Add our local stream to the peer connection so others can see us
      if (localStream) {
        localStream.getTracks().forEach(track => {
          peer.addTrack(track, localStream);
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
          // Only add one stream per peer
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
      if (isTeacher) {
        // Teacher joins immediately and broadcasts
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            setLocalStream(stream);
            newSocket.data = { name: userName, role: 'admin' };
            newSocket.emit('join-video-room', { roomId, isTeacher });
          })
          .catch(err => {
            console.error("Failed to get local stream", err);
            alert("Could not access camera/microphone.");
          });
      } else {
        // Student requests to join and waits in waiting room
        newSocket.data = { name: userName, role: 'student' };
        newSocket.emit('join-request', { roomId, studentName: userName });
      }
    });

    newSocket.on('join-approved', ({ roomId: approvedRoomId }) => {
      console.log(`[Approve] Joined room ${approvedRoomId}`);
      
      // Get local stream for student too, so they can be seen
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream);
          newSocket.emit('join-video-room', { roomId: approvedRoomId, isTeacher: false });
        })
        .catch(err => {
          console.error("Failed to get local stream", err);
          // Still join even if camera fails, just as observer
          newSocket.emit('join-video-room', { roomId: approvedRoomId, isTeacher: false });
        });
    });

    newSocket.on('join-rejected', () => {
      alert('Your request to join was declined by the teacher.');
      window.location.href = '/student'; 
    });

    newSocket.on('user-connected', ({ userId, isTeacher: peerIsTeacher, name: peerName }) => {
      // A new user joined. I will initiate the call (offer).
      createPeer(userId, true, peerIsTeacher, peerName);
    });

    newSocket.on('webrtc-offer', async (data) => {
      // Received an offer, answer it
      const peer = createPeer(data.callerId, false, data.isTeacher, data.name);
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      newSocket.emit('webrtc-answer', { target: data.callerId, answer });

      // Process any queued ICE candidates that arrived before remote description was set
      if (iceCandidateQueue.current[data.callerId]) {
        for (const candidate of iceCandidateQueue.current[data.callerId]) {
          try {
            await peer.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.error("Error adding queued ice candidate", e);
          }
        }
        iceCandidateQueue.current[data.callerId] = [];
      }
    });

    newSocket.on('webrtc-answer', async (data) => {
      // Received an answer to my offer
      const peer = peersRef.current[data.replierId]?.pc;
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        
        // Process queued candidates
        if (iceCandidateQueue.current[data.replierId]) {
          for (const candidate of iceCandidateQueue.current[data.replierId]) {
            try {
              await peer.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
              console.error("Error adding queued ice candidate", e);
            }
          }
          iceCandidateQueue.current[data.replierId] = [];
        }
      }
    });

    newSocket.on('webrtc-ice-candidate', async (data) => {
      const peerData = peersRef.current[data.senderId];
      if (peerData && peerData.pc.remoteDescription) {
        try {
          await peerData.pc.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      } else {
        // Queue it because RTCPeerConnection isn't ready or doesn't have remote description yet
        if (!iceCandidateQueue.current[data.senderId]) {
          iceCandidateQueue.current[data.senderId] = [];
        }
        iceCandidateQueue.current[data.senderId].push(data.candidate);
      }
    });

    newSocket.on('room-users', (users) => {
       // Only students need to initiate connections to existing users (like the teacher)
       if (!isTeacher) {
           users.forEach(user => {
               if (user.userId !== newSocket.id) {
                   createPeer(user.userId, true, user.isTeacher, user.name);
               }
           });
       }
    });
    
    // Handle user leaving
    newSocket.on('user-disconnected', (userId) => {
       setRemotePeers(prev => prev.filter(p => p.peerId !== userId));
       if (peersRef.current[userId]) {
           peersRef.current[userId].pc.close();
           delete peersRef.current[userId];
       }
    });

    return () => {
      newSocket.disconnect();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      Object.values(peersRef.current).forEach(p => p.pc.close());
      peersRef.current = {};
    };
  }, [isJoined, roomId, isTeacher, userName, localStream]);

  const toggleMic = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
    }
  };

  return { localStream, remotePeers, socket, toggleMic, toggleCamera };
}
