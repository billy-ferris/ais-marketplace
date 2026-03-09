import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { companies, companyTypeEnum } from '../db/schema/companies';
import { users, userRoleEnum } from '../db/schema/users';

describe('Database Schema', () => {
  describe('companies table', () => {
    it('should define all required columns', () => {
      const columns = getTableColumns(companies);
      const columnNames = Object.keys(columns);

      const requiredColumns = [
        'id',
        'name',
        'type',
        'marginPercentage',
        'contactName',
        'phone',
        'street',
        'city',
        'state',
        'zip',
        'createdAt',
        'updatedAt',
      ];

      for (const col of requiredColumns) {
        expect(columnNames).toContain(col);
      }
    });

    it('should use pgEnum for company type with manufacturer and retailer values', () => {
      expect(companyTypeEnum.enumValues).toEqual(['manufacturer', 'retailer']);
    });

    it('should default marginPercentage to 10.00', () => {
      const columns = getTableColumns(companies);
      const marginCol = columns.marginPercentage;

      expect(marginCol.hasDefault).toBe(true);
      expect(marginCol.default).toBe('10.00');
    });
  });

  describe('users table', () => {
    it('should define all required columns', () => {
      const columns = getTableColumns(users);
      const columnNames = Object.keys(columns);

      const requiredColumns = [
        'id',
        'clerkId',
        'email',
        'firstName',
        'lastName',
        'role',
        'companyId',
        'createdAt',
        'updatedAt',
      ];

      for (const col of requiredColumns) {
        expect(columnNames).toContain(col);
      }
    });

    it('should have unique constraint on clerkId', () => {
      const columns = getTableColumns(users);
      expect(columns.clerkId.isUnique).toBe(true);
    });

    it('should have unique constraint on email', () => {
      const columns = getTableColumns(users);
      expect(columns.email.isUnique).toBe(true);
    });

    it('should reference companies.id via foreign key', () => {
      const config = getTableConfig(users);
      const fks = config.foreignKeys;

      expect(fks.length).toBeGreaterThanOrEqual(1);

      // Find FK from companyId to companies.id
      const companyFk = fks.find((fk) => {
        const ref = fk.reference();
        const fromColNames = ref.columns.map((c) => c.name);
        const toColNames = ref.foreignColumns.map((c) => c.name);
        return fromColNames.includes('company_id') && toColNames.includes('id');
      });

      expect(companyFk).toBeDefined();

      // Verify it references the companies table
      const ref = companyFk!.reference();
      const foreignTable = ref.foreignTable;
      const tableConfig = getTableConfig(foreignTable);
      expect(tableConfig.name).toBe('companies');
    });

    it('should use pgEnum for user role with admin, manufacturer, and retailer values', () => {
      expect(userRoleEnum.enumValues).toEqual([
        'admin',
        'manufacturer',
        'retailer',
      ]);
    });
  });
});
