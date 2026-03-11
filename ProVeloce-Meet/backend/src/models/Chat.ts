import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  meetingId: string; // Reference to Meeting
  userId: string; // Clerk user ID
  userName: string;
  userImageUrl?: string;
  message: string; // Plaintext (for backward compatibility) or placeholder for encrypted
  encryptedMessage?: string; // E2EE encrypted message (base64)
  iv?: string; // Initialization vector for E2EE (base64)
  isEncrypted?: boolean; // Flag to indicate if message is encrypted
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>(
  {
    meetingId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userImageUrl: String,
    message: {
      type: String,
      required: function (this: IChat) {
        // Either message or encryptedMessage must be present
        return !!(this.message || this.encryptedMessage);
      },
    },
    encryptedMessage: String, // E2EE encrypted message
    iv: String, // Initialization vector for E2EE
    isEncrypted: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient chat retrieval by meeting
ChatSchema.index({ meetingId: 1, timestamp: -1 });

export const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

