"use client";

import { useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useStreamVideoClient } from "@stream-io/video-react-sdk";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { meetingApi } from "@/lib/meeting-api";
import Loader from "@/components/Loader";
import { ScrollAnimation } from "@/lib/animations";

const Table = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => {
  return (
    <div className="flex flex-col items-start gap-2 xl:flex-row">
      <h1 className="text-base font-medium text-google-blue lg:text-xl xl:min-w-32">
        {title}:
      </h1>
      <h1 className="truncate text-sm font-bold text-black max-sm:max-w-[320px] lg:text-xl">
        {description}
      </h1>
    </div>
  );
};

const PersonalRoom = () => {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const client = useStreamVideoClient();
  const { toast } = useToast();
  const [isStarting, setIsStarting] = useState(false);

  if (!isLoaded || !user) {
    return <Loader />;
  }

  const displayName = user.firstName 
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ''}`
    : (user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0] || 'User');

  const startRoom = async () => {
    if (!client || !user) return;

    setIsStarting(true);

    try {
      const token = await getToken({ template: "meet" });
      if (!token) {
        toast({
          title: "Authentication required",
          variant: "destructive",
        });
        setIsStarting(false);
        return;
      }

      // Create meeting in database when starting
      const newMeeting = await meetingApi.createMeeting({
        title: `${displayName}'s Meeting Room`,
        type: 'personal',
      }, token);

      // Create Stream call
      const newCall = client.call("default", newMeeting.streamCallId);

      await newCall.getOrCreate({
        data: {
          starts_at: new Date().toISOString(),
        },
      });

      // Navigate to meeting room
      router.push(`/meeting/${newMeeting.streamCallId}?personal=true`);
    } catch (error: any) {
      console.error('Error starting meeting:', error);
      toast({
        title: "Failed to start meeting",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      setIsStarting(false);
    }
  };

  return (
    <section className="flex size-full flex-col gap-6 sm:gap-8 md:gap-10 text-black p-4 sm:p-6">
      <ScrollAnimation variant="fadeUp">
        <h1 className="text-2xl sm:text-3xl font-bold text-black">Personal Meeting Room</h1>
      </ScrollAnimation>
      <ScrollAnimation variant="fadeUp" delay={0.1}>
        <div className="flex w-full flex-col gap-6 sm:gap-8 xl:max-w-[900px]">
        <Table title="Topic" description={`${displayName}'s Meeting Room`} />
        <Table title="Room Code" description="Will be generated when you start the meeting" />
        <Table title="Invite Link" description="Will be available after starting the meeting" />
      </div>
      </ScrollAnimation>
      <ScrollAnimation variant="fadeUp" delay={0.2}>
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-start sm:items-center">
        <Button 
          onClick={startRoom}
          disabled={isStarting}
            className="w-full sm:w-auto"
        >
          {isStarting ? "Starting..." : "Start Meeting"}
        </Button>
          <p className="text-sm text-text-secondary self-center">
          Click &quot;Start Meeting&quot; to create your personal room and get the room code and invite link.
        </p>
      </div>
      </ScrollAnimation>
    </section>
  );
};

export default PersonalRoom;
