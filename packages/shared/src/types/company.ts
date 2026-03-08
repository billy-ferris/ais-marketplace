export const CompanyType = {
  MANUFACTURER: 'manufacturer',
  RETAILER: 'retailer',
} as const;

export type CompanyType = (typeof CompanyType)[keyof typeof CompanyType];

export interface Company {
  id: number;
  name: string;
  type: CompanyType;
  marginPercentage: string;
  contactName: string;
  phone: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  createdAt: Date;
  updatedAt: Date;
}
