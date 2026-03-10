import {
  LayoutDashboard,
  Package,
  Users,
  Handshake,
  ShoppingBag,
  ClipboardList,
  Tag,
  LayoutGrid,
  Bell,
  ClipboardCheck,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@ais/shared';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
  children?: NavItem[];
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  {
    label: 'Manage',
    icon: Package,
    path: '/manage',
    children: [
      { label: 'Brands', icon: Tag, path: '/manage/brands' },
      { label: 'Categories', icon: LayoutGrid, path: '/manage/categories' },
      { label: 'Listings', icon: Package, path: '/manage/listings' },
      { label: 'Approvals', icon: ClipboardCheck, path: '/manage/approvals' },
    ],
  },
  { label: 'Users', icon: Users, path: '/users' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
];

const MANUFACTURER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  {
    label: 'Manage',
    icon: Package,
    path: '/manage',
    children: [
      { label: 'Brands', icon: Tag, path: '/manage/brands' },
      { label: 'Listings', icon: Package, path: '/manage/listings' },
    ],
  },
  { label: 'Offers', icon: Handshake, path: '/offers' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
];

const RETAILER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Shop', icon: ShoppingBag, path: '/shop' },
  { label: 'Orders', icon: ClipboardList, path: '/orders' },
  { label: 'Notifications', icon: Bell, path: '/notifications' },
];

const NAV_ITEMS_BY_ROLE: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: ADMIN_NAV_ITEMS,
  [UserRole.MANUFACTURER]: MANUFACTURER_NAV_ITEMS,
  [UserRole.RETAILER]: RETAILER_NAV_ITEMS,
};

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS_BY_ROLE[role] ?? [];
}
