import mongoose, { Schema, Document } from 'mongoose';

export interface IMeeting extends Document {
  streamCallId: string;
  roomCode?: string; // Room code in XXX-XXXX-XXX format
  title: string;
  description?: string;
  type: 'instant' | 'scheduled' | 'personal';
  hostId: string; // Clerk user ID
  hostName: string;
  hostImageUrl?: string;
  startTime?: Date;
  endTime?: Date;
  scheduledTime?: Date;
  participants: string[]; // Array of Clerk user IDs
  duration?: number; // Meeting duration in seconds
  recordingUrl?: string;
  recordingId?: string;
  status: 'scheduled' | 'ongoing' | 'ended' | 'cancelled';
  meetingLink: string;
  // SEO fields
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  recordingFilename?: string; // SEO-friendly filename for recordings
  thumbnailUrl?: string; // For social sharing
  isPublic?: boolean; // Whether meeting can be indexed by search engines
  createdAt: Date;
  updatedAt: Date;
}

const MeetingSchema = new Schema<IMeeting>(
  {
    streamCallId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    roomCode: {
      type: String,
      unique: true,
      sparse: true,
      match: /^[A-Z0-9]{3}-[A-Z0-9]{4}-[A-Z0-9]{3}$/,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: ['instant', 'scheduled', 'personal'],
      required: true,
    },
    hostId: {
      type: String,
      required: true,
      index: true,
    },
    hostName: {
      type: String,
      required: true,
    },
    hostImageUrl: String,
    startTime: Date,
    endTime: Date,
    scheduledTime: Date,
    participants: [{
      type: String,
    }],
    duration: Number, // Meeting duration in seconds
    recordingUrl: String,
    recordingId: String,
    status: {
      type: String,
      enum: ['scheduled', 'ongoing', 'ended', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    meetingLink: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // SEO fields
    seoTitle: String,
    seoDescription: String,
    seoKeywords: [String],
    recordingFilename: String,
    thumbnailUrl: String,
    isPublic: {
      type: Boolean,
      default: false, // Meetings are private by default
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
// Note: roomCode already has a unique index from the field definition
MeetingSchema.index({ hostId: 1, status: 1 });
MeetingSchema.index({ participants: 1, status: 1 });
MeetingSchema.index({ scheduledTime: 1 });
MeetingSchema.index({ createdAt: -1 });

export const Meeting = mongoose.models.Meeting || mongoose.model<IMeeting>('Meeting', MeetingSchema);

