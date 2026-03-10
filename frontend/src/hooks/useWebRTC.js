import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useWebRTC(roomId, isTeacher, userName, isJoined) {
  const [localStream, setLocalStream] = useState(null);
  const [remotePeers, setRemotePeers] = useState([]);
  const socketRef = useRef(null);
  const peersRef = useRef({});

  // ICE Servers for STUN
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    if (!isJoined) return;

    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      if (isTeacher) {
        // Teacher joins immediately
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            setLocalStream(stream);
            socket.data = { name: userName, role: 'admin' };
            socket.emit('join-video-room', { roomId, isTeacher });
          })
          .catch(err => {
            console.error("Failed to get local stream", err);
            alert("Could not access camera/microphone.");
          });
      } else {
        // Student requests to join and waits in waiting room
        socket.data = { name: userName, role: 'student' };
        socket.emit('request-join-room', { roomId, userName });
      }
    });

    socket.on('join-response-result', ({ status }) => {
      if (status === 'accepted') {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then(stream => {
            setLocalStream(stream);
            socket.emit('join-video-room', { roomId, isTeacher });
          })
          .catch(err => {
            console.error("Failed to get local stream", err);
            alert("Could not access camera/microphone.");
          });
      } else {
        alert('Your request to join was declined by the teacher.');
        window.location.href = '/student'; // Kick back to dashboard
      }
    });

    socket.on('user-connected', ({ userId, isTeacher: peerIsTeacher, name: peerName }) => {
      // A new user joined. I will initiate the call (offer).
      createPeer(userId, true, peerIsTeacher, peerName);
    });

    socket.on('webrtc-offer', async (data) => {
      // Received an offer, answer it
      const peer = createPeer(data.callerId, false, data.isTeacher, data.name);
      await peer.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.emit('webrtc-answer', { target: data.callerId, answer });
    });

    socket.on('webrtc-answer', async (data) => {
      // Received an answer to my offer
      const peer = peersRef.current[data.replierId]?.pc;
      if (peer) {
        await peer.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      const peer = peersRef.current[data.senderId]?.pc;
      if (peer) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error("Error adding ice candidate", e);
        }
      }
    });

    return () => {
      socket.disconnect();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      Object.values(peersRef.current).forEach(p => p.pc.close());
    };
  }, [isJoined, roomId, isTeacher, userName]);

  const createPeer = (peerId, isInitiator, peerIsTeacher, peerName) => {
    const peer = new RTCPeerConnection(iceServers);

    // Add our local stream to the peer connection
    if (localStream) {
      localStream.getTracks().forEach(track => {
        peer.addTrack(track, localStream);
      });
    }

    peer.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit('webrtc-ice-candidate', {
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
          socketRef.current.emit('webrtc-offer', {
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

  return { localStream, remotePeers, socket: socketRef.current };
}
