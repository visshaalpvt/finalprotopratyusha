import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  userId: string; // Clerk user ID
  meetingId: string; // Reference to Meeting
  action: 'joined' | 'left' | 'started' | 'ended' | 'recorded' | 'shared_screen' | 'muted' | 'unmuted';
  timestamp: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const HistorySchema = new Schema<IHistory>(
  {
    userId: {
      type: String,
      required: true,
    },
    meetingId: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: ['joined', 'left', 'started', 'ended', 'recorded', 'shared_screen', 'muted', 'unmuted'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient history queries
HistorySchema.index({ userId: 1, timestamp: -1 });
HistorySchema.index({ meetingId: 1, timestamp: -1 });

export const History = mongoose.models.History || mongoose.model<IHistory>('History', HistorySchema);

