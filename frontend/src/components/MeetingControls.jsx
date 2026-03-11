import React, { memo } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Users, MessageSquare, LayoutGrid, Settings, Monitor, MoreVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const ControlButton = ({ onClick, active, icon: Icon, activeIcon: ActiveIcon, label, danger, activeColor = 'bg-brand-600', hasNotification }) => {
  const CurrentIcon = active ? (ActiveIcon || Icon) : Icon;
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "control-btn relative",
        active && activeColor,
        danger && "bg-rose-500 hover:bg-rose-600",
        !active && !danger && "bg-surface"
      )}
      title={label}
    >
      <CurrentIcon className="w-5 h-5 text-white" />
      {hasNotification && (
        <span className="absolute top-2 right-2 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
        </span>
      )}
    </motion.button>
  );
};

const MeetingControls = ({ 
  isMicMuted, 
  onToggleMic, 
  isCameraOff, 
  onToggleCamera, 
  onLeave, 
  onToggleParticipants, 
  onToggleChat, 
  onToggleLayout,
  activePanel,
  layout,
  hasJoinRequests
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 safe-bottom z-50 pointer-events-none">
      <div className="max-w-max mx-auto flex items-center gap-2 sm:gap-4 px-6 py-3 bg-black/80 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl pointer-events-auto">
        <ControlButton 
          onClick={onToggleMic} 
          active={!isMicMuted} 
          icon={MicOff} 
          activeIcon={Mic} 
          label={isMicMuted ? "Unmute" : "Mute"}
          activeColor="bg-indigo-600"
        />
        
        <ControlButton 
          onClick={onToggleCamera} 
          active={!isCameraOff} 
          icon={VideoOff} 
          activeIcon={Video} 
          label={isCameraOff ? "Start Video" : "Stop Video"}
          activeColor="bg-indigo-600"
        />

        <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

        <ControlButton 
          onClick={onToggleLayout} 
          active={false} 
          icon={LayoutGrid} 
          label="Change Layout" 
        />

        <ControlButton 
          onClick={onToggleParticipants} 
          active={activePanel === 'participants'} 
          icon={Users} 
          label="Participants"
          hasNotification={hasJoinRequests}
          activeColor="bg-indigo-600"
        />

        <ControlButton 
          onClick={onToggleChat} 
          active={activePanel === 'chat'} 
          icon={MessageSquare} 
          label="Chat"
          activeColor="bg-indigo-600"
        />

        <ControlButton 
          onClick={() => {}} 
          active={false} 
          icon={Monitor} 
          label="Share Screen" 
        />

        <div className="w-px h-8 bg-white/10 mx-1 hidden sm:block" />

        <ControlButton 
          onClick={onLeave} 
          danger 
          icon={PhoneOff} 
          label="Leave Meeting" 
        />
      </div>
    </div>
  );
};

export default memo(MeetingControls);
