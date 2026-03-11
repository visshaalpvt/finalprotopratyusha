/**
 * SEO Utility Functions
 * Provides helpers for generating SEO-friendly content, URLs, and metadata
 */

export interface SEOKeywords {
  primary: string[];
  secondary: string[];
  longTail: string[];
}

export const SEO_KEYWORDS: SEOKeywords = {
  primary: [
    'secure online meeting platform',
    'real-time video calling app',
    'business video conferencing software',
    'remote collaboration tool',
    'host controlled meeting system',
  ],
  secondary: [
    'browser-based WebRTC solution',
    'meeting recording and history tracking',
    'cloud meeting dashboard',
    'participant attendance analytics',
    'video conferencing software',
  ],
  longTail: [
    'best video conferencing platform for businesses',
    'secure video calling app with recording',
    'WebRTC video meeting software',
    'online meeting platform with analytics',
    'host controlled video conferencing solution',
  ],
};

/**
 * Generate SEO-friendly title for a meeting
 */
export function generateMeetingTitle(meetingTitle: string, hostName?: string): string {
  const baseTitle = meetingTitle || 'Video Meeting';
  const hostPart = hostName ? ` by ${hostName}` : '';
  return `${baseTitle}${hostPart} - ProVeloce Meet`;
}

/**
 * Generate SEO-friendly description for a meeting
 */
export function generateMeetingDescription(
  meetingTitle: string,
  hostName?: string,
  scheduledTime?: Date,
  type?: string
): string {
  const typeLabel = type === 'scheduled' ? 'scheduled' : type === 'personal' ? 'personal' : 'instant';
  const timeInfo = scheduledTime
    ? ` scheduled for ${scheduledTime.toLocaleDateString()}`
    : '';
  const hostInfo = hostName ? ` hosted by ${hostName}` : '';
  
  return `Join ${meetingTitle}${hostInfo}${timeInfo}. ${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} video meeting on ProVeloce Meet - secure online meeting platform with real-time collaboration.`;
}

/**
 * Generate SEO-friendly filename for recordings
 */
export function generateRecordingFilename(
  meetingTitle: string,
  hostName: string,
  startTime: Date,
  extension: string = 'mp4'
): string {
  // Sanitize title: lowercase, replace spaces with hyphens, remove special chars
  const sanitizedTitle = meetingTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50); // Limit length

  // Sanitize host name
  const sanitizedHost = hostName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 30);

  // Format date: YYYY-MM-DD
  const dateStr = startTime.toISOString().split('T')[0];

  // Format: title-hostname-YYYY-MM-DD.mp4
  return `${sanitizedTitle}-${sanitizedHost}-${dateStr}.${extension}`;
}

/**
 * Generate semantic URL for joining a meeting
 */
export function generateJoinMeetingUrl(roomCode: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  return `${base}/join-meeting/${roomCode}`;
}

/**
 * Generate semantic URL for host dashboard
 */
export function generateHostDashboardUrl(hostId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  return `${base}/host/dashboard/${hostId}`;
}

/**
 * Generate semantic URL for recordings
 */
export function generateRecordingUrl(recordingId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  return `${base}/host/dashboard/recordings/${recordingId}`;
}

/**
 * Generate semantic URL for user meeting history
 */
export function generateHistoryUrl(userId: string, baseUrl?: string): string {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  return `${base}/user/meeting-history/${userId}`;
}

/**
 * Generate structured data for Software Application
 */
export function generateSoftwareAppSchema(baseUrl?: string): object {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ProVeloce Meet',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '1000',
    },
    description: 'Secure online meeting platform with real-time video calling, meeting recording, and participant analytics.',
    url: base,
    screenshot: `${base}/screenshot.png`,
    featureList: [
      'Real-time video calling',
      'Meeting recording',
      'Participant analytics',
      'Host-controlled meetings',
      'Browser-based WebRTC',
      'Secure collaboration',
    ],
  };
}

/**
 * Generate structured data for a Meeting Event
 */
export function generateMeetingEventSchema(
  meetingTitle: string,
  hostName: string,
  scheduledTime?: Date,
  meetingUrl?: string,
  baseUrl?: string
): object {
  const base = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://meet.proveloce.com';
  const url = meetingUrl || `${base}/meeting`;
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: meetingTitle,
    description: `Video meeting hosted by ${hostName} on ProVeloce Meet`,
    startDate: scheduledTime?.toISOString() || new Date().toISOString(),
    organizer: {
      '@type': 'Person',
      name: hostName,
    },
    location: {
      '@type': 'VirtualLocation',
      url: url,
    },
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
  };
}

/**
 * Generate structured data for a Video Recording
 */
export function generateVideoObjectSchema(
  recordingTitle: string,
  recordingUrl: string,
  thumbnailUrl?: string,
  duration?: number,
  uploadDate?: Date
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: recordingTitle,
    description: `Meeting recording: ${recordingTitle}`,
    contentUrl: recordingUrl,
    thumbnailUrl: thumbnailUrl || recordingUrl,
    uploadDate: uploadDate?.toISOString() || new Date().toISOString(),
    duration: duration ? `PT${Math.floor(duration / 60)}M${duration % 60}S` : undefined,
    embedUrl: recordingUrl,
  };
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Extract keywords from text for SEO
 */
export function extractKeywords(text: string, maxKeywords: number = 10): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3);
  
  const wordCount: Record<string, number> = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

