import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn().mockResolvedValue({ id: 'test-id' });

vi.mock('resend', () => {
  return {
    Resend: class {
      emails = { send: mockSend };
    },
  };
});

import { sendApprovalEmail } from '../../services/email';

const baseParams = {
  to: 'user@example.com',
  recipientName: 'Jane',
  listingName: 'Widget Pro',
  listingId: 42,
} as const;

describe('Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.RESEND_API_KEY = 'test-key';
  });

  describe('sendApprovalEmail', () => {
    it('should send listing_submitted email with correct subject', async () => {
      await sendApprovalEmail({ ...baseParams, type: 'listing_submitted' });

      expect(mockSend).toHaveBeenCalledOnce();
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'New listing submitted for review: Widget Pro',
        }),
      );
    });

    it('should send listing_approved email with correct subject', async () => {
      await sendApprovalEmail({ ...baseParams, type: 'listing_approved' });

      expect(mockSend).toHaveBeenCalledOnce();
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your listing has been approved: Widget Pro',
        }),
      );
    });

    it('should send listing_rejected email with rejection reason in body', async () => {
      await sendApprovalEmail({
        ...baseParams,
        type: 'listing_rejected',
        rejectionReason: 'Missing specs',
      });

      expect(mockSend).toHaveBeenCalledOnce();
      const html = mockSend.mock.calls[0][0].html as string;
      expect(html).toContain('Reason:</strong> Missing specs');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Your listing needs changes: Widget Pro',
        }),
      );
    });

    it('should not throw when Resend API fails', async () => {
      mockSend.mockRejectedValueOnce(new Error('API down'));

      await expect(
        sendApprovalEmail({ ...baseParams, type: 'listing_approved' }),
      ).resolves.toBeUndefined();
    });

    it('should include CTA button linking to listing edit page', async () => {
      await sendApprovalEmail({ ...baseParams, type: 'listing_approved' });

      const html = mockSend.mock.calls[0][0].html as string;
      expect(html).toContain('/manage/listings/42/edit');
    });
  });
});
