import { inArray } from 'drizzle-orm';
import { db } from '../db/index';
import { notifications } from '../db/schema/index';
import { users } from '../db/schema/index';
import { sendApprovalEmail } from './email';

type NotificationType =
  | 'listing_submitted'
  | 'listing_approved'
  | 'listing_rejected';

interface NotifyApprovalEventParams {
  type: NotificationType;
  listingId: number;
  listingName: string;
  recipientUserIds: number[];
  rejectionReason?: string;
}

const TITLE_MAP: Record<NotificationType, string> = {
  listing_submitted: 'New listing pending review',
  listing_approved: 'Listing approved',
  listing_rejected: 'Listing rejected',
};

const MESSAGE_MAP: Record<
  NotificationType,
  (name: string, reason?: string) => string
> = {
  listing_submitted: (name) =>
    `'${name}' has been submitted for review.`,
  listing_approved: (name) =>
    `'${name}' has been approved and is now active.`,
  listing_rejected: (name, reason) =>
    `'${name}' has been rejected. Reason: ${reason || 'No reason provided.'}`,
};

export async function notifyApprovalEvent(
  params: NotifyApprovalEventParams,
): Promise<void> {
  try {
    const { type, listingId, listingName, recipientUserIds, rejectionReason } =
      params;

    if (recipientUserIds.length === 0) {
      return;
    }

    const title = TITLE_MAP[type];
    const message = MESSAGE_MAP[type](listingName, rejectionReason);

    // Insert one notification row per recipient
    await db.insert(notifications).values(
      recipientUserIds.map((userId) => ({
        userId,
        type,
        title,
        message,
        entityType: 'listing' as const,
        entityId: listingId,
      })),
    );

    // Look up recipient emails for email notifications
    const recipients = await db.query.users.findMany({
      where: inArray(users.id, recipientUserIds),
      columns: { email: true, firstName: true },
    });

    // Send email to each recipient (fire-and-forget, errors caught per-send)
    for (const recipient of recipients) {
      await sendApprovalEmail({
        to: recipient.email,
        recipientName: recipient.firstName || 'there',
        type,
        listingId,
        listingName,
        rejectionReason,
      });
    }
  } catch (error) {
    console.error('[notification] Failed to process approval event:', error);
    // Do NOT throw -- notification failure must not block approval actions
  }
}
