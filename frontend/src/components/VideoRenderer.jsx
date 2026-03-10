import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, User, Shield } from 'lucide-react';
import { cn } from '../lib/utils';

export const VideoRenderer = ({ stream, isLocal = false, name, isTeacher }) => {
  const videoRef = useRef(null);
  const [isVideoOn, setIsVideoOn] = React.useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      
      const checkTracks = () => {
        setIsVideoOn(stream.getVideoTracks().some(t => t.enabled));
      };

      checkTracks();
      const interval = setInterval(checkTracks, 1000);
      return () => clearInterval(interval);
    }
  }, [stream]);

  return (
    <div className={cn(
      "relative w-full h-full rounded-2xl overflow-hidden bg-slate-800 border-2 transition-all duration-300",
      isTeacher ? "border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]" : "border-white/10"
    )}>
      {isVideoOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover mirror" 
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-meeting">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-700 flex items-center justify-center text-white text-3xl font-black shadow-2xl border-4 border-white/5 animate-pulse-soft">
            {name?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      )}

      {/* Identity Tag */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 max-w-[calc(100%-2rem)]">
        <div className={cn(
          "px-3 py-1.5 rounded-xl backdrop-blur-xl border border-white/10 text-xs font-bold flex items-center gap-2 transition-colors",
          isTeacher ? "bg-indigo-600/60 text-white" : "bg-black/40 text-slate-200"
        )}>
          {isTeacher ? <Shield className="w-3 h-3 text-indigo-300" /> : <User className="w-3 h-3 text-slate-400" />}
          <span className="truncate">{name || (isLocal ? 'You' : 'Student')}</span>
          {isLocal && <span className="opacity-60 font-medium">(You)</span>}
        </div>
      </div>
    </div>
  );
};
