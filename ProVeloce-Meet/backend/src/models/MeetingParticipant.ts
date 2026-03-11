import mongoose, { Schema, Document } from 'mongoose';

export interface IMeetingParticipant extends Document {
  meetingId: string; // Reference to Meeting streamCallId
  userId: string; // Clerk user ID
  userName: string; // Full name: firstName + lastName or firstName
  userImageUrl?: string;
  joinedAt: Date;
  leftAt?: Date;
  duration?: number; // Duration in seconds
  isHost: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MeetingParticipantSchema = new Schema<IMeetingParticipant>(
  {
    meetingId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userImageUrl: String,
    joinedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    leftAt: Date,
    duration: Number, // Calculated: leftAt - joinedAt (in seconds)
    isHost: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Unique constraint: one user can only have one active participation per meeting
MeetingParticipantSchema.index({ meetingId: 1, userId: 1 }, { unique: true });

// Indexes for efficient queries
MeetingParticipantSchema.index({ userId: 1, joinedAt: -1 });
MeetingParticipantSchema.index({ meetingId: 1, joinedAt: -1 });

export const MeetingParticipant = mongoose.models.MeetingParticipant ||
  mongoose.model<IMeetingParticipant>('MeetingParticipant', MeetingParticipantSchema);

