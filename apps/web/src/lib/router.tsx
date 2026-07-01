import { createBrowserRouter } from 'react-router';
import { UserRole } from '@ais/shared';
import { RoleGuard } from '@/components/shared/RoleGuard';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { BrandsPage } from '@/pages/manage/BrandsPage';
import { CategoriesPage } from '@/pages/manage/CategoriesPage';
import { ListingsPage } from '@/pages/manage/ListingsPage';
import { ListingCreatePage } from '@/pages/manage/ListingCreatePage';
import { ListingEditPage } from '@/pages/manage/ListingEditPage';
import { ListingViewPage } from '@/pages/manage/ListingViewPage';
import { ApprovalsPage } from '@/pages/manage/ApprovalsPage';
import { ApprovalReviewPage } from '@/pages/manage/ApprovalReviewPage';
import { NotificationsPage } from '@/pages/NotificationsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardLayout /> },
      {
        path: 'manage',
        children: [
          {
            path: 'brands',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANUFACTURER]}>
                <BrandsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'categories',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <CategoriesPage />
              </RoleGuard>
            ),
          },
          {
            path: 'listings',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANUFACTURER]}>
                <ListingsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'listings/new',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANUFACTURER]}>
                <ListingCreatePage />
              </RoleGuard>
            ),
          },
          {
            path: 'listings/:id',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANUFACTURER]}>
                <ListingViewPage />
              </RoleGuard>
            ),
          },
          {
            path: 'listings/:id/edit',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN, UserRole.MANUFACTURER]}>
                <ListingEditPage />
              </RoleGuard>
            ),
          },
          {
            path: 'approvals',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <ApprovalsPage />
              </RoleGuard>
            ),
          },
          {
            path: 'approvals/:id',
            element: (
              <RoleGuard allowedRoles={[UserRole.ADMIN]}>
                <ApprovalReviewPage />
              </RoleGuard>
            ),
          },
        ],
      },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
