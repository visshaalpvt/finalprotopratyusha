import React, { memo, useState, useEffect } from 'react';
import { Copy, Check, Clock, Users as UsersIcon } from 'lucide-react';
import { cn } from '../lib/utils';

const MeetingTopBar = ({ roomId, participantCount, onCopyInvite, inviteCopied }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-30 pointer-events-none safe-top">
      {/* Left side: Room Info */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-mono font-black tracking-widest text-sm uppercase">{roomId}</span>
          </div>
          <div className="w-px h-4 bg-white/20" />
          <button 
            onClick={onCopyInvite}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-indigo-400 hover:text-white transition-colors"
          >
            {inviteCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {inviteCopied ? 'Copied' : 'Invite'}
          </button>
        </div>
      </div>

      {/* Center: Clock (Optional style from ProVeloce) */}
      <div className="hidden sm:block pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-xl">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-white font-mono font-bold text-sm">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Right side: Participant Stats */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-xl">
          <UsersIcon className="w-4 h-4 text-slate-400" />
          <span className="text-white font-bold text-sm">{participantCount}</span>
        </div>
      </div>
    </div>
  );
};

export default memo(MeetingTopBar);
