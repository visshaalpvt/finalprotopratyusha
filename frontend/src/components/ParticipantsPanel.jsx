import React, { memo } from 'react';
import { X, UserCheck, UserX, User, Shield, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

const ParticipantsPanel = ({ 
  isOpen, 
  onClose, 
  participants, 
  joinRequests, 
  isTeacher, 
  onAccept, 
  onReject,
  userName
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-4 top-20 bottom-24 w-80 bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between p-4 border-b border-white/5">
            <h3 className="text-white font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Participants ({participants.length + 1})
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {/* Waiting Room Section */}
            {isTeacher && joinRequests.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest px-3 mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Waiting Room ({joinRequests.length})
                </p>
                {joinRequests.map(req => (
                  <div key={req.studentId} className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-200 truncate pr-2">{req.userName}</span>
                    <div className="flex gap-1 shrink-0">
                      <button 
                        onClick={() => onAccept(req.studentId)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 rounded-lg transition-colors"
                        title="Accept"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onReject(req.studentId)}
                        className="bg-rose-600 hover:bg-rose-500 text-white p-1.5 rounded-lg transition-colors"
                        title="Reject"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* List Current Participants */}
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">In Meeting</p>
              
              {/* Me */}
              <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                  {isTeacher ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{userName} <span className="text-indigo-400 font-medium">(You)</span></p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{isTeacher ? 'Teacher / Host' : 'Student'}</p>
                </div>
              </div>

              {/* Others */}
              {participants.map((peer, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-lg",
                    peer.isTeacher ? "bg-indigo-600" : "bg-slate-700"
                  )}>
                    {peer.isTeacher ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{peer.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{peer.isTeacher ? 'Teacher' : 'Student'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default memo(ParticipantsPanel);
