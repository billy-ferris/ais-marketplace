import { describe, it } from 'vitest';

describe('Email Service', () => {
  describe('sendApprovalEmail', () => {
    it.todo('should send listing_submitted email with correct subject');
    it.todo('should send listing_approved email with correct subject');
    it.todo('should send listing_rejected email with rejection reason in body');
    it.todo('should not throw when Resend API fails');
    it.todo('should include CTA button linking to listing edit page');
  });
});
