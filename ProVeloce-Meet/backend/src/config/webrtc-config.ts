/**
 * WebRTC Configuration for ProVeloce Meet
 * 
 * Note: Stream SDK handles most WebRTC internally.
 * These configurations are passed to Stream for optimization.
 */

// ============================================
// TURN/STUN CONFIGURATION
// ============================================
export const iceServers = {
    // Default STUN servers
    stun: [
        'stun:stun.l.google.com:19302',
        'stun:stun1.l.google.com:19302',
    ],

    // TURN relay fallback (for restricted networks)
    // Configure with your own TURN server in production
    turn: process.env.TURN_SERVER_URL ? {
        urls: process.env.TURN_SERVER_URL,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
    } : null,
};

// ============================================
// BANDWIDTH PROFILES
// ============================================
export const bandwidthProfiles = {
    // Screen sharing (high quality)
    screenShare: {
        maxBitrate: 2_500_000,  // 2.5 Mbps
        maxFramerate: 30,
        resolution: { width: 1920, height: 1080 },
        priority: 'high' as const,
    },

    // Camera video (balanced)
    camera: {
        maxBitrate: 1_500_000,  // 1.5 Mbps
        maxFramerate: 30,
        resolution: { width: 1280, height: 720 },
        priority: 'medium' as const,
    },

    // Low bandwidth fallback
    cameraLow: {
        maxBitrate: 500_000,    // 500 Kbps
        maxFramerate: 15,
        resolution: { width: 640, height: 360 },
        priority: 'low' as const,
    },

    // Audio
    audio: {
        maxBitrate: 64_000,     // 64 Kbps
        channelCount: 1,        // Mono for meetings
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
    },
};

// ============================================
// ADAPTIVE BITRATE
// ============================================
export const adaptiveBitrate = {
    enabled: true,

    // Quality levels (highest to lowest)
    levels: [
        { bitrate: 2_500_000, resolution: '1080p', label: 'HD' },
        { bitrate: 1_500_000, resolution: '720p', label: 'Standard' },
        { bitrate: 800_000, resolution: '480p', label: 'Medium' },
        { bitrate: 400_000, resolution: '360p', label: 'Low' },
        { bitrate: 150_000, resolution: '240p', label: 'Very Low' },
    ],

    // Thresholds for switching
    upgradeThreshold: 1.2,    // Upgrade when bandwidth is 20% above current
    downgradeThreshold: 0.8,  // Downgrade when bandwidth is 20% below current

    // Debounce time (ms) before switching
    switchDebounce: 5000,
};

// ============================================
// PACKET LOSS RECOVERY (NACK)
// ============================================
export const packetLossRecovery = {
    // Enable NACK (Negative Acknowledgement)
    nackEnabled: true,

    // Maximum retransmission attempts
    maxRetransmit: 3,

    // RTX (retransmission) settings
    rtxEnabled: true,

    // FEC (Forward Error Correction) for audio
    audioFecEnabled: true,

    // Packet loss threshold to trigger quality reduction
    qualityReductionThreshold: 0.05, // 5% packet loss
};

// ============================================
// CONGESTION CONTROL
// ============================================
export const congestionControl = {
    // Enable Google Congestion Control
    gccEnabled: true,

    // Initial bandwidth estimate
    initialBandwidth: 1_000_000, // 1 Mbps

    // Minimum/Maximum bandwidth
    minBandwidth: 100_000,     // 100 Kbps
    maxBandwidth: 5_000_000,   // 5 Mbps

    // Probe for bandwidth increases
    probeEnabled: true,
    probeInterval: 10000, // Every 10 seconds
};

// ============================================
// STREAM SDK CONFIGURATION
// ============================================
export const streamSdkConfig = {
    // Video settings
    video: {
        ...bandwidthProfiles.camera,
        facingMode: 'user' as const,
    },

    // Audio settings
    audio: bandwidthProfiles.audio,

    // Screen share settings
    screenShare: bandwidthProfiles.screenShare,

    // Simulcast (multiple quality streams)
    simulcast: {
        enabled: true,
        layers: 3, // High, Medium, Low
    },

    // SVC (Scalable Video Coding) - if supported
    svc: {
        enabled: false, // Requires VP9 or AV1
        mode: 'L3T3' as const,
    },
};

export default {
    iceServers,
    bandwidthProfiles,
    adaptiveBitrate,
    packetLossRecovery,
    congestionControl,
    streamSdkConfig,
};
