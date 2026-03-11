'use client';
import { useEffect, useState, useCallback, memo, ErrorInfo, Component, ReactNode } from 'react';
import {
  DeviceSettings,
  VideoPreview,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { Mic, MicOff, Video, VideoOff, Settings, X } from 'lucide-react';

import Alert from './Alert';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

// Error boundary for VideoPreview
class VideoPreviewErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('VideoPreview error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-surface">
          <p className="text-white/50 text-sm px-4 text-center">Camera preview unavailable</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// Memoized toggle button
interface ToggleButtonProps {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
  iconOn: React.ReactNode;
  iconOff: React.ReactNode;
  label: string;
}

const ToggleButton = memo(function ToggleButton({
  isOn,
  onToggle,
  disabled,
  iconOn,
  iconOff,
  label
}: ToggleButtonProps) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all touch-target no-select",
        "active:scale-95",
        isOn
          ? "bg-surface hover:bg-control-hover"
          : "bg-control-danger hover:bg-red-600"
      )}
      aria-label={label}
      aria-pressed={isOn}
    >
      {isOn ? iconOn : iconOff}
    </button>
  );
});

const MeetingSetup = ({
  setIsSetupComplete,
}: {
  setIsSetupComplete: (value: boolean) => void;
}) => {
  const call = useCall();

  if (!call) {
    throw new Error('useStreamCall must be used within a StreamCall component.');
  }

  const callStateHooks = useCallStateHooks();

  let callStartsAt: Date | undefined;
  let callEndedAt: Date | undefined;

  try {
    if (callStateHooks && typeof callStateHooks.useCallStartsAt === 'function') {
      callStartsAt = callStateHooks.useCallStartsAt();
    }
  } catch (error) { }

  try {
    if (callStateHooks && typeof callStateHooks.useCallEndedAt === 'function') {
      callEndedAt = callStateHooks.useCallEndedAt();
    }
  } catch (error) { }

  if (!callStartsAt && call?.state?.startsAt) {
    callStartsAt = new Date(call.state.startsAt);
  }

  if (!callEndedAt && call?.state?.endedAt) {
    callEndedAt = new Date(call.state.endedAt);
  }

  const callTimeNotArrived = callStartsAt && new Date(callStartsAt) > new Date();
  const callHasEnded = !!callEndedAt;

  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isDevicesReady, setIsDevicesReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize devices
  useEffect(() => {
    if (!call) return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    const initializeDevices = async () => {
      try {
        let attempts = 0;
        const maxAttempts = 20;

        const checkDevicesReady = (): boolean => {
          try {
            if (!call?.camera || !call?.microphone) return false;
            return typeof call.camera.listDevices === 'function' &&
              typeof call.camera.enable === 'function' &&
              typeof call.microphone.listDevices === 'function' &&
              typeof call.microphone.enable === 'function';
          } catch {
            return false;
          }
        };

        const pollDevices = (): Promise<void> => {
          return new Promise((resolve) => {
            intervalId = setInterval(() => {
              if (!isMounted) {
                if (intervalId) clearInterval(intervalId);
                resolve();
                return;
              }

              attempts++;

              if (checkDevicesReady()) {
                if (intervalId) clearInterval(intervalId);
                setTimeout(() => {
                  if (isMounted) setIsDevicesReady(true);
                }, 100);
                resolve();
              } else if (attempts >= maxAttempts) {
                if (intervalId) clearInterval(intervalId);
                if (isMounted) setIsDevicesReady(true);
                resolve();
              }
            }, 200);
          });
        };

        timeoutId = setTimeout(async () => {
          if (isMounted) await pollDevices();
        }, 300);
      } catch (error) {
        if (isMounted) {
          timeoutId = setTimeout(() => {
            if (isMounted) setIsDevicesReady(true);
          }, 2000);
        }
      }
    };

    initializeDevices();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [call]);

  // Toggle mic/camera - memoized
  const toggleMic = useCallback(() => {
    if (!isDevicesReady || !call?.microphone) return;
    if (isMicOn) {
      call.microphone.disable();
    } else {
      call.microphone.enable();
    }
    setIsMicOn(!isMicOn);
  }, [isMicOn, isDevicesReady, call]);

  const toggleCamera = useCallback(() => {
    if (!isDevicesReady || !call?.camera) return;
    if (isCameraOn) {
      call.camera.disable();
    } else {
      call.camera.enable();
    }
    setIsCameraOn(!isCameraOn);
  }, [isCameraOn, isDevicesReady, call]);

  const handleJoin = useCallback(() => {
    call.join();
    setIsSetupComplete(true);
  }, [call, setIsSetupComplete]);

  if (callTimeNotArrived) {
    return (
      <Alert
        title={`Your meeting has not started yet. It is scheduled for ${callStartsAt ? callStartsAt.toLocaleString() : "a later time"
          }`}
      />
    );
  }

  if (callHasEnded) {
    return (
      <Alert
        title="The call has been ended by the host"
        iconUrl="/icons/call-ended.svg"
      />
    );
  }

  const canRenderVideoPreview = isDevicesReady &&
    call?.camera &&
    call?.microphone &&
    typeof call.camera.listDevices === 'function';

  // Status message
  const getStatusMessage = () => {
    if (!isMicOn && !isCameraOn) return "Camera and microphone are off";
    if (!isMicOn) return "Microphone is off";
    if (!isCameraOn) return "Camera is off";
    return "Ready to join";
  };

  return (
    <div className="flex h-screen h-[100dvh] w-full bg-meeting">
      <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-6 max-w-4xl mx-auto w-full">
        {/* Title */}
        <h1 className="text-white text-xl sm:text-2xl font-medium mb-4 sm:mb-6 text-center">
          Ready to join?
        </h1>

        {/* Video Preview Container - Responsive */}
        <div className="relative w-full aspect-video max-h-[50vh] sm:max-h-[60vh] rounded-xl overflow-hidden bg-surface mb-4 sm:mb-6">
          <VideoPreviewErrorBoundary>
            {canRenderVideoPreview ? (
              <VideoPreview />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <div className="loader-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
          </VideoPreviewErrorBoundary>

          {/* Overlay Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
            <ToggleButton
              isOn={isMicOn}
              onToggle={toggleMic}
              disabled={!canRenderVideoPreview}
              iconOn={<Mic className="w-5 h-5 text-white" />}
              iconOff={<MicOff className="w-5 h-5 text-white" />}
              label={isMicOn ? "Mute microphone" : "Unmute microphone"}
            />

            <ToggleButton
              isOn={isCameraOn}
              onToggle={toggleCamera}
              disabled={!canRenderVideoPreview}
              iconOn={<Video className="w-5 h-5 text-white" />}
              iconOff={<VideoOff className="w-5 h-5 text-white" />}
              label={isCameraOn ? "Turn off camera" : "Turn on camera"}
            />

            {canRenderVideoPreview && (
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={cn(
                  "w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all touch-target no-select",
                  "active:scale-95",
                  showSettings ? "bg-google-blue" : "bg-surface hover:bg-control-hover"
                )}
                aria-label="Device settings"
              >
                <Settings className="w-5 h-5 text-white" />
              </button>
            )}
          </div>
        </div>

        {/* Device Settings Panel - Modal on mobile */}
        {showSettings && canRenderVideoPreview && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-40 sm:hidden"
              onClick={() => setShowSettings(false)}
            />
            <div className="fixed sm:relative inset-x-0 bottom-0 sm:inset-auto bg-surface rounded-t-2xl sm:rounded-xl p-4 z-50 sm:z-auto mb-0 sm:mb-6 animate-slideUp sm:animate-fadeIn max-h-[60vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sm:hidden">
                <h3 className="text-white font-medium">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-full hover:bg-control-hover touch-target"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
              <DeviceSettings />
            </div>
          </>
        )}

        {/* Status Text */}
        <p className="text-white/60 text-sm mb-4 sm:mb-6 text-center">
          {getStatusMessage()}
        </p>

        {/* Join Button */}
        <Button
          onClick={handleJoin}
          disabled={!canRenderVideoPreview}
          className="bg-google-blue hover:bg-google-blue-hover text-white px-8 sm:px-10 py-3 rounded-full font-medium text-base transition-all active:scale-97 touch-target min-w-[160px]"
        >
          Join now
        </Button>
      </div>
    </div>
  );
};

export default memo(MeetingSetup);
