import { describe, it, expect } from 'vitest';

describe('Database Schema', () => {
  describe('companies table', () => {
    it.todo('should define all required columns');
    it.todo('should use pgEnum for company type');
    it.todo('should default marginPercentage to 10.00');
  });

  describe('users table', () => {
    it.todo('should define all required columns');
    it.todo('should have unique constraint on clerkId');
    it.todo('should have unique constraint on email');
    it.todo('should reference companies.id via foreign key');
    it.todo('should use pgEnum for user role');
  });
});
