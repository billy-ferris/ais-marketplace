import {
  LayoutDashboard,
  Package,
  Users,
  Handshake,
  ShoppingBag,
  ClipboardList,
  type LucideIcon,
} from 'lucide-react';
import { UserRole } from '@ais/shared';

export interface NavItem {
  label: string;
  icon: LucideIcon;
  path: string;
}

const ADMIN_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Manage', icon: Package, path: '/manage' },
  { label: 'Users', icon: Users, path: '/users' },
];

const MANUFACTURER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'Offers', icon: Handshake, path: '/offers' },
];

const RETAILER_NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Shop', icon: ShoppingBag, path: '/shop' },
  { label: 'Orders', icon: ClipboardList, path: '/orders' },
];

const NAV_ITEMS_BY_ROLE: Record<UserRole, NavItem[]> = {
  [UserRole.ADMIN]: ADMIN_NAV_ITEMS,
  [UserRole.MANUFACTURER]: MANUFACTURER_NAV_ITEMS,
  [UserRole.RETAILER]: RETAILER_NAV_ITEMS,
};

export function getNavItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS_BY_ROLE[role] ?? [];
}
