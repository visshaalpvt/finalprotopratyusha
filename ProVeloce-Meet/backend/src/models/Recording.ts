import mongoose, { Schema, Document } from 'mongoose';

/**
 * Recording - Metadata for locally saved recordings
 * No cloud storage - recordings are saved to user's Downloads folder
 */
export interface IRecording extends Document {
    meetingId: string;
    userId: string;          // Clerk user ID who made the recording
    fileName: string;        // Local file name in Downloads
    recordedAt: Date;        // When recording was made
    durationSeconds: number; // Recording duration
    fileSizeMB?: number;     // Optional file size
    meetingTitle?: string;   // Meeting title for reference
    participants?: string[]; // Names of participants
    createdAt: Date;
    updatedAt: Date;
}

const RecordingSchema = new Schema<IRecording>(
    {
        meetingId: { type: String, required: true },
        userId: { type: String, required: true },
        fileName: { type: String, required: true },
        recordedAt: { type: Date, required: true, default: Date.now },
        durationSeconds: { type: Number, required: true, default: 0 },
        fileSizeMB: { type: Number },
        meetingTitle: { type: String },
        participants: [{ type: String }],
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
RecordingSchema.index({ userId: 1, recordedAt: -1 });
RecordingSchema.index({ meetingId: 1 });

export const Recording = mongoose.models.Recording ||
    mongoose.model<IRecording>('Recording', RecordingSchema);
