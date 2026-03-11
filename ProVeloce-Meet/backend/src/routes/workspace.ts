import { Router, Request, Response } from 'express';
import { verifyAuth } from './auth';
import {
    Workspace,
    WorkspaceMember,
    hasPermission,
    getPlanLimits,
    WorkspaceRole,
    PlanType,
} from '../models/Workspace';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 50) + '-' + uuidv4().substring(0, 8);
}

/**
 * Get all workspaces for current user
 */
router.get('/', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const memberships = await WorkspaceMember.find({
            userId,
            status: 'active'
        }).populate('workspaceId');

        const workspaces = memberships.map(m => ({
            workspace: m.workspaceId,
            role: m.role,
            joinedAt: m.joinedAt,
        }));

        res.json(workspaces);
    } catch (error: any) {
        console.error('[Workspace] Get error:', error.message);
        res.status(500).json({ error: 'Failed to fetch workspaces' });
    }
});

/**
 * Create a new workspace
 */
router.post('/', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, description } = req.body;
        if (!name?.trim()) {
            return res.status(400).json({ error: 'Workspace name is required' });
        }

        // Create workspace
        const workspace = new Workspace({
            name: name.trim(),
            slug: generateSlug(name),
            description: description?.trim(),
            planType: 'free',
        });

        await workspace.save();

        // Add creator as owner
        const member = new WorkspaceMember({
            workspaceId: workspace._id,
            userId,
            role: 'owner',
            email: req.body.email || `${userId}@unknown.com`,
            displayName: req.body.displayName,
            status: 'active',
            joinedAt: new Date(),
        });

        await member.save();

        res.status(201).json({
            workspace,
            membership: member,
        });
    } catch (error: any) {
        console.error('[Workspace] Create error:', error.message);
        res.status(500).json({ error: 'Failed to create workspace' });
    }
});

/**
 * Get workspace by ID
 */
router.get('/:workspaceId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { workspaceId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify membership
        const membership = await WorkspaceMember.findOne({
            workspaceId,
            userId,
            status: 'active',
        });

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        const workspace = await Workspace.findById(workspaceId);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }

        const limits = getPlanLimits(workspace.planType as PlanType);

        res.json({
            workspace,
            role: membership.role,
            limits,
        });
    } catch (error: any) {
        console.error('[Workspace] Get by ID error:', error.message);
        res.status(500).json({ error: 'Failed to fetch workspace' });
    }
});

/**
 * Update workspace settings
 */
router.patch('/:workspaceId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { workspaceId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify permission
        const membership = await WorkspaceMember.findOne({
            workspaceId,
            userId,
            status: 'active',
        });

        if (!membership || !hasPermission(membership.role as WorkspaceRole, 'workspace:settings')) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const { name, description, settings } = req.body;
        const updates: any = { updatedAt: new Date() };

        if (name?.trim()) updates.name = name.trim();
        if (description !== undefined) updates.description = description?.trim();
        if (settings) updates.settings = settings;

        const workspace = await Workspace.findByIdAndUpdate(
            workspaceId,
            updates,
            { new: true }
        );

        res.json(workspace);
    } catch (error: any) {
        console.error('[Workspace] Update error:', error.message);
        res.status(500).json({ error: 'Failed to update workspace' });
    }
});

/**
 * Get workspace members
 */
router.get('/:workspaceId/members', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { workspaceId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify membership
        const membership = await WorkspaceMember.findOne({
            workspaceId,
            userId,
            status: 'active',
        });

        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this workspace' });
        }

        const members = await WorkspaceMember.find({ workspaceId });
        res.json(members);
    } catch (error: any) {
        console.error('[Workspace] Get members error:', error.message);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

/**
 * Invite member to workspace
 */
router.post('/:workspaceId/invite', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { workspaceId } = req.params;
        const { email, role = 'member' } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Verify permission
        const membership = await WorkspaceMember.findOne({
            workspaceId,
            userId,
            status: 'active',
        });

        if (!membership || !hasPermission(membership.role as WorkspaceRole, 'members:invite')) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Check if already invited
        const existing = await WorkspaceMember.findOne({ workspaceId, email });
        if (existing) {
            return res.status(400).json({ error: 'User already invited' });
        }

        // Create invite
        const inviteToken = uuidv4();
        const invite = new WorkspaceMember({
            workspaceId,
            userId: `pending_${inviteToken}`,
            role: role as WorkspaceRole,
            email,
            invitedBy: userId,
            inviteToken,
            inviteExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            status: 'pending',
        });

        await invite.save();

        res.status(201).json({
            invite,
            inviteLink: `/invite/${inviteToken}`,
        });
    } catch (error: any) {
        console.error('[Workspace] Invite error:', error.message);
        res.status(500).json({ error: 'Failed to invite member' });
    }
});

/**
 * Accept workspace invite
 */
router.post('/invite/:token/accept', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { token } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const invite = await WorkspaceMember.findOne({
            inviteToken: token,
            status: 'pending',
        });

        if (!invite) {
            return res.status(404).json({ error: 'Invite not found or expired' });
        }

        if (invite.inviteExpires && invite.inviteExpires < new Date()) {
            return res.status(400).json({ error: 'Invite has expired' });
        }

        // Activate membership
        invite.userId = userId;
        invite.status = 'active';
        invite.joinedAt = new Date();
        invite.inviteToken = undefined;
        invite.inviteExpires = undefined;

        await invite.save();

        res.json({ message: 'Joined workspace successfully', membership: invite });
    } catch (error: any) {
        console.error('[Workspace] Accept invite error:', error.message);
        res.status(500).json({ error: 'Failed to accept invite' });
    }
});

/**
 * Update member role
 */
router.patch('/:workspaceId/members/:memberId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { workspaceId, memberId } = req.params;
        const { role } = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify permission
        const membership = await WorkspaceMember.findOne({
            workspaceId,
            userId,
            status: 'active',
        });

        if (!membership || !hasPermission(membership.role as WorkspaceRole, 'members:manage')) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        // Can't change owner role unless you're owner
        const targetMember = await WorkspaceMember.findById(memberId);
        if (!targetMember) {
            return res.status(404).json({ error: 'Member not found' });
        }

        if (targetMember.role === 'owner' && membership.role !== 'owner') {
            return res.status(403).json({ error: 'Cannot modify owner' });
        }

        targetMember.role = role as WorkspaceRole;
        await targetMember.save();

        res.json(targetMember);
    } catch (error: any) {
        console.error('[Workspace] Update member error:', error.message);
        res.status(500).json({ error: 'Failed to update member' });
    }
});

/**
 * Remove member from workspace
 */
router.delete('/:workspaceId/members/:memberId', verifyAuth, async (req: Request, res: Response) => {
    try {
        const userId = req.userId;
        const { workspaceId, memberId } = req.params;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Verify permission
        const membership = await WorkspaceMember.findOne({
            workspaceId,
            userId,
            status: 'active',
        });

        if (!membership || !hasPermission(membership.role as WorkspaceRole, 'members:manage')) {
            return res.status(403).json({ error: 'Permission denied' });
        }

        const targetMember = await WorkspaceMember.findById(memberId);
        if (!targetMember) {
            return res.status(404).json({ error: 'Member not found' });
        }

        // Can't remove owner
        if (targetMember.role === 'owner') {
            return res.status(403).json({ error: 'Cannot remove workspace owner' });
        }

        await WorkspaceMember.deleteOne({ _id: memberId });
        res.json({ message: 'Member removed' });
    } catch (error: any) {
        console.error('[Workspace] Remove member error:', error.message);
        res.status(500).json({ error: 'Failed to remove member' });
    }
});

export { router as workspaceRoutes };
