/**
 * Recording Download Utility
 * Auto-saves recordings to Downloads folder with proper filename
 * Uses File System Access API with fallback for older browsers
 */

import { apiClient } from './api-client';

interface RecordingMetadata {
    meetingId: string;
    meetingTitle?: string;
    durationSeconds: number;
    fileSizeMB?: number;
    participants?: string[];
}

/**
 * Generate filename for recording
 * Format: ProVeloceMeet_Recording_<title>_<YYYY-MM-DD_HH-mm>.mp4
 */
export function generateRecordingFilename(meetingTitle?: string): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');

    // Sanitize title for filename
    const safeTitle = (meetingTitle || 'Meeting')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 30);

    return `ProVeloceMeet_Recording_${safeTitle}_${dateStr}.mp4`;
}

/**
 * Download blob to user's device
 * Uses File System Access API if available, falls back to anchor download
 */
export async function downloadRecording(
    blob: Blob,
    fileName: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Try File System Access API (Chrome/Edge)
        if ('showSaveFilePicker' in window) {
            try {
                const handle = await (window as any).showSaveFilePicker({
                    suggestedName: fileName,
                    types: [{
                        description: 'MP4 Video',
                        accept: { 'video/mp4': ['.mp4'] },
                    }],
                });

                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();

                return { success: true };
            } catch (err: any) {
                // User cancelled - fall through to anchor method
                if (err.name === 'AbortError') {
                    return { success: false, error: 'Download cancelled' };
                }
                console.warn('[Recording] File System API failed, using fallback:', err.message);
            }
        }

        // Fallback: Create anchor and trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        return { success: true };
    } catch (error: any) {
        console.error('[Recording] Download failed:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Save recording metadata to backend
 */
export async function saveRecordingMetadata(
    token: string,
    metadata: RecordingMetadata & { fileName: string }
): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.post('/recordings/save', {
            meetingId: metadata.meetingId,
            fileName: metadata.fileName,
            recordedAt: new Date().toISOString(),
            durationSeconds: metadata.durationSeconds,
            fileSizeMB: metadata.fileSizeMB,
            meetingTitle: metadata.meetingTitle,
            participants: metadata.participants,
        }, token);

        return { success: true };
    } catch (error: any) {
        console.error('[Recording] Failed to save metadata:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Complete recording workflow:
 * 1. Download to user's device
 * 2. Save metadata to backend
 */
export async function handleRecordingComplete(
    blob: Blob,
    token: string,
    metadata: RecordingMetadata
): Promise<{ success: boolean; fileName?: string; error?: string }> {
    // Generate filename
    const fileName = generateRecordingFilename(metadata.meetingTitle);

    // Calculate file size
    const fileSizeMB = Math.round((blob.size / (1024 * 1024)) * 100) / 100;

    // Download to device
    const downloadResult = await downloadRecording(blob, fileName);
    if (!downloadResult.success) {
        return downloadResult;
    }

    // Save metadata to backend
    const saveResult = await saveRecordingMetadata(token, {
        ...metadata,
        fileName,
        fileSizeMB,
    });

    if (!saveResult.success) {
        console.warn('[Recording] Downloaded but metadata save failed:', saveResult.error);
        // Still return success since file was downloaded
    }

    return { success: true, fileName };
}

/**
 * Format duration for display
 */
export function formatDuration(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
        return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(mb?: number): string {
    if (!mb) return 'Unknown size';
    if (mb < 1) return `${Math.round(mb * 1024)} KB`;
    if (mb >= 1024) return `${(mb / 1024).toFixed(2)} GB`;
    return `${mb.toFixed(2)} MB`;
}
