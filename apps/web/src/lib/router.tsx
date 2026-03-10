import { createBrowserRouter } from 'react-router';
import { AppShell } from '@/components/layout/AppShell';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { BrandsPage } from '@/pages/manage/BrandsPage';
import { CategoriesPage } from '@/pages/manage/CategoriesPage';
import { ListingsPage } from '@/pages/manage/ListingsPage';
import { ListingCreatePage } from '@/pages/manage/ListingCreatePage';
import { ListingEditPage } from '@/pages/manage/ListingEditPage';
import { ApprovalsPage } from '@/pages/manage/ApprovalsPage';
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
          { path: 'brands', element: <BrandsPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'listings', element: <ListingsPage /> },
          { path: 'listings/new', element: <ListingCreatePage /> },
          { path: 'listings/:id/edit', element: <ListingEditPage /> },
          { path: 'approvals', element: <ApprovalsPage /> },
        ],
      },
      { path: 'notifications', element: <NotificationsPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
