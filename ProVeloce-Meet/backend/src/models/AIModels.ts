import mongoose, { Schema, Document } from 'mongoose';

/**
 * TranscriptChunk - Individual segment of meeting transcript
 * Stores speaker-attributed text with timestamps
 */
export interface ITranscriptChunk extends Document {
    meetingId: string;
    speakerId: string;
    speakerName: string;
    startTime: number; // Seconds from meeting start
    endTime: number;
    text: string;
    confidence: number; // STT confidence score
    createdAt: Date;
}

const TranscriptChunkSchema = new Schema<ITranscriptChunk>({
    meetingId: { type: String, required: true },
    speakerId: { type: String, required: true },
    speakerName: { type: String, required: true },
    startTime: { type: Number, required: true },
    endTime: { type: Number, required: true },
    text: { type: String, required: true },
    confidence: { type: Number, default: 1.0 },
    createdAt: { type: Date, default: Date.now },
});

// Compound index for efficient queries
TranscriptChunkSchema.index({ meetingId: 1, startTime: 1 });

export const TranscriptChunk = mongoose.models.TranscriptChunk ||
    mongoose.model<ITranscriptChunk>('TranscriptChunk', TranscriptChunkSchema);

/**
 * MeetingTranscript - Full merged transcript for a meeting
 */
export interface IMeetingTranscript extends Document {
    meetingId: string;
    fullText: string;
    speakers: string[];
    duration: number; // Total meeting duration in seconds
    wordCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const MeetingTranscriptSchema = new Schema<IMeetingTranscript>({
    meetingId: { type: String, required: true, unique: true },
    fullText: { type: String, required: true },
    speakers: [{ type: String }],
    duration: { type: Number, default: 0 },
    wordCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const MeetingTranscript = mongoose.models.MeetingTranscript ||
    mongoose.model<IMeetingTranscript>('MeetingTranscript', MeetingTranscriptSchema);

/**
 * MeetingAIInsight - AI-generated meeting intelligence
 */
export interface IActionItem {
    title: string;
    assignee?: string;
    dueDate?: string;
    status: 'pending' | 'in_progress' | 'completed';
}

export interface IMeetingAIInsight extends Document {
    meetingId: string;
    summary: string[];
    decisions: string[];
    actions: IActionItem[];
    risks: string[];
    keyTopics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    processingTime: number; // Milliseconds to generate
    modelUsed: string;
    createdAt: Date;
}

const MeetingAIInsightSchema = new Schema<IMeetingAIInsight>({
    meetingId: { type: String, required: true, unique: true },
    summary: [{ type: String }],
    decisions: [{ type: String }],
    actions: [{
        title: { type: String, required: true },
        assignee: { type: String },
        dueDate: { type: String },
        status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
    }],
    risks: [{ type: String }],
    keyTopics: [{ type: String }],
    sentiment: { type: String, enum: ['positive', 'neutral', 'negative'], default: 'neutral' },
    processingTime: { type: Number, default: 0 },
    modelUsed: { type: String, default: 'unknown' },
    createdAt: { type: Date, default: Date.now },
});

export const MeetingAIInsight = mongoose.models.MeetingAIInsight ||
    mongoose.model<IMeetingAIInsight>('MeetingAIInsight', MeetingAIInsightSchema);

/**
 * MeetingMemory - Vector embeddings for semantic search
 */
export interface IMeetingMemory extends Document {
    meetingId: string;
    chunkId: string;
    text: string;
    embedding: number[]; // Vector embedding
    startTime: number;
    endTime: number;
    speakerName: string;
    createdAt: Date;
}

const MeetingMemorySchema = new Schema<IMeetingMemory>({
    meetingId: { type: String, required: true },
    chunkId: { type: String, required: true },
    text: { type: String, required: true },
    embedding: [{ type: Number }],
    startTime: { type: Number },
    endTime: { type: Number },
    speakerName: { type: String },
    createdAt: { type: Date, default: Date.now },
});

MeetingMemorySchema.index({ meetingId: 1 });

export const MeetingMemory = mongoose.models.MeetingMemory ||
    mongoose.model<IMeetingMemory>('MeetingMemory', MeetingMemorySchema);
