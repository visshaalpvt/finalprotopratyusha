import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { classifySign } from './SignClassifier';
import { CLASSROOM_SIGNS } from '../utils/signMapping';

/**
 * Resolve MediaPipe constructors.
 * Priority: window globals (CDN in index.html) > NPM imports.
 * Vite mangles @mediapipe CJS exports, so CDN is the reliable path.
 */
function getMediaPipe() {
  // CDN scripts in index.html set these on window
  const H = window.Hands;
  const HC = window.HAND_CONNECTIONS;
  const Cam = window.Camera;
  const dc = window.drawConnectors;
  const dl = window.drawLandmarks;

  if (H && HC && Cam && dc && dl) {
    return { Hands: H, HAND_CONNECTIONS: HC, Camera: Cam, drawConnectors: dc, drawLandmarks: dl };
  }
  return null;
}

const SignCamera = ({ onSignDetected, isEnabled, externalStream }) => {
  const webcamRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [detectedSign, setDetectedSign] = useState(null);
  const [confidence, setConfidence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoRef.current && externalStream) {
      videoRef.current.srcObject = externalStream;
    }
  }, [externalStream]);

  useEffect(() => {
    if (!isEnabled) return;

    let camera = null;
    let hands = null;
    let cancelled = false;
    let retryTimer = null;

    const init = () => {
      if (cancelled) return;

      const mp = getMediaPipe();
      if (!mp) {
        console.warn('[SignCamera] CDN globals not ready, retrying in 200ms...');
        retryTimer = setTimeout(init, 200);
        return;
      }

      try {
        hands = new mp.Hands({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.7,
          minTrackingConfidence: 0.7
        });

        hands.onResults((results) => {
          if (cancelled) return;
          if (loading) setLoading(false);

          const video = videoRef.current || webcamRef.current?.video;
          if (!canvasRef.current || !video || !video.videoWidth) return;

          if (canvasRef.current.width !== video.videoWidth) {
            canvasRef.current.width = video.videoWidth;
            canvasRef.current.height = video.videoHeight;
          }

          const ctx = canvasRef.current.getContext('2d');
          ctx.save();
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          ctx.translate(canvasRef.current.width, 0);
          ctx.scale(-1, 1);

          if (results.multiHandLandmarks?.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
              mp.drawConnectors(ctx, landmarks, mp.HAND_CONNECTIONS, {
                color: '#6366f1',
                lineWidth: 4,
              });
              mp.drawLandmarks(ctx, landmarks, {
                color: '#ffffff',
                fillColor: '#6366f1',
                lineWidth: 1,
                radius: 3
              });

              const classification = classifySign(landmarks);
              if (classification) {
                const signData = Object.values(CLASSROOM_SIGNS).find(s => s.id === classification.id);
                if (signData) {
                  setDetectedSign(signData);
                  setConfidence(classification.confidence);
                  onSignDetected(signData, classification.confidence);
                }
              }
            }
          }
          ctx.restore();
        });

        // Start feeding frames
        const startCamera = () => {
          if (cancelled) return;
          const video = videoRef.current || webcamRef.current?.video;
          if (!video) {
            retryTimer = setTimeout(startCamera, 100);
            return;
          }

          if (externalStream) {
            const processFrame = async () => {
              if (cancelled || !hands) return;
              if (video && !video.paused && !video.ended) {
                try { await hands.send({ image: video }); } catch (e) {}
              }
              if (!cancelled) requestAnimationFrame(processFrame);
            };
            processFrame();
          } else {
            camera = new mp.Camera(video, {
              onFrame: async () => {
                if (video && hands && !cancelled) {
                  try { await hands.send({ image: video }); } catch (e) {}
                }
              },
              width: 640,
              height: 480,
            });
            camera.start();
          }
        };

        startCamera();
        setError(null);
        console.log('[SignCamera] MediaPipe Hands initialized successfully');
      } catch (err) {
        console.error('[SignCamera] Hands initialization failed:', err);
        setError('Gesture recognition unavailable');
        setLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
      if (camera) { try { camera.stop(); } catch (e) {} }
      if (hands) { try { hands.close(); } catch (e) {} }
    };
  }, [isEnabled, onSignDetected, externalStream]);

  return (
    <div className="relative rounded-[2rem] overflow-hidden bg-slate-900 border-4 border-white dark:border-slate-800 shadow-2xl aspect-video group">
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md z-10">
          <div className="w-20 h-20 rounded-full bg-red-900/50 flex items-center justify-center text-3xl mb-4">
            ⚠️
          </div>
          <p className="text-red-400 font-bold uppercase tracking-widest text-xs text-center px-4">
            {error}
          </p>
          <button
            onClick={() => { setError(null); setLoading(true); }}
            className="mt-4 px-4 py-2 bg-red-800/60 hover:bg-red-700/80 text-red-200 text-xs font-bold rounded-xl transition-colors"
          >
            Retry
          </button>
        </div>
      ) : null}

      {externalStream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover mirror"
        />
      ) : (
        <Webcam
          ref={webcamRef}
          mirrored={true}
          className="w-full h-full object-cover"
          audio={false}
          videoConstraints={{
            width: 1280,
            height: 720,
            facingMode: "user"
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {isEnabled && loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 backdrop-blur-xl z-10">
          <div className="text-white flex flex-col items-center">
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-brand-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
            </div>
            <span className="text-sm font-black uppercase tracking-[0.2em] animate-pulse">Initializing Vision Engine</span>
          </div>
        </div>
      )}

      {!isEnabled && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 backdrop-blur-md z-10">
          <div className="w-20 h-20 rounded-full bg-slate-700/50 flex items-center justify-center text-3xl mb-4 text-slate-500">
            📷
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Camera is Standby</p>
        </div>
      )}

      {detectedSign && isEnabled && !loading && !error && (
        <div className="absolute bottom-6 left-6 right-6 animate-slide-up z-20">
          <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 border border-white/20 shadow-2xl flex items-center justify-between overflow-hidden relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center text-3xl shadow-inner animate-bounce-soft">
                {detectedSign.icon}
              </div>
              <div>
                <h4 className="text-white text-xl font-black leading-tight">{detectedSign.label}</h4>
                <p className="text-brand-200 text-xs font-medium">{detectedSign.meaning}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em] mb-1">Confidence</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-500 transition-all duration-500 ease-out"
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-black text-brand-400 font-mono">{(confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignCamera;
