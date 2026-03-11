"use client";
import { ReactNode } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Image from "next/image";

interface MeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
  children?: ReactNode;
  handleClick?: () => void;
  buttonText?: string;
  instantMeeting?: boolean;
  image?: string;
  buttonClassName?: string;
  buttonIcon?: string;
  buttonDisabled?: boolean;
}

const MeetingModal = ({
  isOpen,
  onClose,
  title,
  className,
  children,
  handleClick,
  buttonText,
  image,
  buttonIcon,
  buttonDisabled = false,
}: MeetingModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex w-full max-w-[520px] flex-col gap-6 border border-light-4 bg-white px-6 py-8 text-text-primary shadow-xl">
        <div className="flex flex-col gap-6">
          {image && (
            <div className="flex justify-center checked-icon-wrapper">
              <Image 
                src={image} 
                alt="" 
                width={72} 
                height={72} 
                className="w-[72px] h-[72px]" 
                aria-hidden="true" 
              />
            </div>
          )}
          <DialogTitle asChild>
            <h2 className={cn("text-2xl sm:text-3xl font-bold leading-tight text-text-primary", className)}>
            {title}
            </h2>
          </DialogTitle>
          <DialogDescription className="sr-only">
            {title} dialog
          </DialogDescription>
          {children}
          <Button
            className="w-full"
            onClick={handleClick}
            disabled={buttonDisabled}
          >
            {buttonIcon && (
              <Image
                src={buttonIcon}
                alt=""
                width={13}
                height={13}
                className="brightness-0 invert"
                aria-hidden="true"
              />
            )}
            {buttonIcon && <span className="ml-2" />}
            {buttonText || "Schedule Meeting"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MeetingModal;
