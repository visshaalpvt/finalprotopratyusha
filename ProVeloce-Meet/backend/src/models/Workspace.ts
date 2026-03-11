import mongoose, { Schema, Document } from 'mongoose';

/**
 * Workspace Roles
 */
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Pricing Plan Types
 */
export type PlanType = 'free' | 'pro' | 'enterprise';

/**
 * Plan Limits Configuration
 */
export interface PlanLimits {
    callMinutesPerMeeting: number;  // -1 = unlimited
    recordingStorageGB: number;     // -1 = unlimited
    aiSummariesPerMonth: number;    // -1 = unlimited
    collaboratorsPerWhiteboard: number;  // -1 = unlimited
    ssoEnabled: boolean;
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        callMinutesPerMeeting: 60,
        recordingStorageGB: 15,
        aiSummariesPerMonth: 3,
        collaboratorsPerWhiteboard: 3,
        ssoEnabled: false,
    },
    pro: {
        callMinutesPerMeeting: -1,
        recordingStorageGB: 200,
        aiSummariesPerMonth: -1,
        collaboratorsPerWhiteboard: -1,
        ssoEnabled: false,
    },
    enterprise: {
        callMinutesPerMeeting: -1,
        recordingStorageGB: -1,
        aiSummariesPerMonth: -1,
        collaboratorsPerWhiteboard: -1,
        ssoEnabled: true,
    },
};

/**
 * Workspace - Multi-tenant organization
 */
export interface IWorkspace extends Document {
    name: string;
    slug: string;
    description?: string;
    planType: PlanType;
    logoUrl?: string;
    settings: {
        allowGuestAccess: boolean;
        defaultMeetingDuration: number;
        aiEnabled: boolean;
        recordingEnabled: boolean;
    };
    usage: {
        totalMeetings: number;
        totalRecordingMB: number;
        aiSummariesThisMonth: number;
        lastResetDate: Date;
    };
    createdAt: Date;
    updatedAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
    name: { type: String, required: true, maxlength: 100 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, maxlength: 500 },
    planType: {
        type: String,
        enum: ['free', 'pro', 'enterprise'],
        default: 'free'
    },
    logoUrl: { type: String },
    settings: {
        allowGuestAccess: { type: Boolean, default: true },
        defaultMeetingDuration: { type: Number, default: 60 },
        aiEnabled: { type: Boolean, default: true },
        recordingEnabled: { type: Boolean, default: true },
    },
    usage: {
        totalMeetings: { type: Number, default: 0 },
        totalRecordingMB: { type: Number, default: 0 },
        aiSummariesThisMonth: { type: Number, default: 0 },
        lastResetDate: { type: Date, default: Date.now },
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export const Workspace = mongoose.models.Workspace ||
    mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);

/**
 * WorkspaceMember - User membership in a workspace
 */
export interface IWorkspaceMember extends Document {
    workspaceId: mongoose.Types.ObjectId;
    userId: string; // Clerk user ID
    role: WorkspaceRole;
    email: string;
    displayName?: string;
    avatarUrl?: string;
    invitedBy?: string;
    inviteToken?: string;
    inviteExpires?: Date;
    status: 'pending' | 'active' | 'suspended';
    joinedAt?: Date;
    lastActiveAt?: Date;
    createdAt: Date;
}

const WorkspaceMemberSchema = new Schema<IWorkspaceMember>({
    workspaceId: { type: Schema.Types.ObjectId, ref: 'Workspace', required: true },
    userId: { type: String, required: true },
    role: {
        type: String,
        enum: ['owner', 'admin', 'member', 'viewer'],
        default: 'member'
    },
    email: { type: String, required: true },
    displayName: { type: String },
    avatarUrl: { type: String },
    invitedBy: { type: String },
    inviteToken: { type: String },
    inviteExpires: { type: Date },
    status: {
        type: String,
        enum: ['pending', 'active', 'suspended'],
        default: 'pending'
    },
    joinedAt: { type: Date },
    lastActiveAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
});

// Compound index: one membership per user per workspace
WorkspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
// Index for invite token lookups
WorkspaceMemberSchema.index({ inviteToken: 1 });

export const WorkspaceMember = mongoose.models.WorkspaceMember ||
    mongoose.model<IWorkspaceMember>('WorkspaceMember', WorkspaceMemberSchema);

/**
 * Permission Matrix
 */
export const PERMISSIONS: Record<WorkspaceRole, Set<string>> = {
    owner: new Set([
        'workspace:delete',
        'workspace:billing',
        'workspace:settings',
        'members:manage',
        'members:invite',
        'meetings:create',
        'meetings:schedule',
        'meetings:join',
        'recordings:view',
        'recordings:delete',
        'ai:use',
        'notes:create',
        'notes:edit',
        'whiteboard:create',
        'whiteboard:edit',
    ]),
    admin: new Set([
        'workspace:settings',
        'members:manage',
        'members:invite',
        'meetings:create',
        'meetings:schedule',
        'meetings:join',
        'recordings:view',
        'recordings:delete',
        'ai:use',
        'notes:create',
        'notes:edit',
        'whiteboard:create',
        'whiteboard:edit',
    ]),
    member: new Set([
        'meetings:create',
        'meetings:schedule',
        'meetings:join',
        'recordings:view',
        'ai:use',
        'notes:create',
        'notes:edit',
        'whiteboard:create',
        'whiteboard:edit',
    ]),
    viewer: new Set([
        'meetings:join',
        'recordings:view',
        'notes:view',
    ]),
};

/**
 * Check if a role has a permission
 */
export function hasPermission(role: WorkspaceRole, permission: string): boolean {
    return PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Get limits for a plan (respects BUSINESS_MODE)
 */
export function getPlanLimits(planType: PlanType): PlanLimits {
    const businessMode = process.env.BUSINESS_MODE || 'development';

    // In development mode, all plans have enterprise limits
    if (businessMode === 'development') {
        return PLAN_LIMITS.enterprise;
    }

    return PLAN_LIMITS[planType];
}
