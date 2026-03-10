import { useState } from 'react';
import { useNavigate } from 'react-router';
import { CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
  type Notification,
} from '@/hooks/useNotifications';
import { Skeleton } from '@/components/ui/skeleton';

function timeAgo(dateString: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateString).getTime()) / 1000,
  );
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationItem({
  notification,
  onMarkRead,
  onNavigate,
}: {
  notification: Notification;
  onMarkRead: (id: number) => void;
  onNavigate: (notification: Notification) => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-start gap-3 rounded-lg border p-4 text-left transition-colors hover:bg-muted/50"
      onClick={() => onNavigate(notification)}
    >
      {/* Unread indicator */}
      <div className="mt-1.5 shrink-0">
        {!notification.isRead ? (
          <span className="block size-2 rounded-full bg-blue-500" />
        ) : (
          <span className="block size-2" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium text-muted-foreground'}`}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {timeAgo(notification.createdAt)}
        </p>
      </div>

      {/* Mark as read button */}
      {!notification.isRead && (
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onMarkRead(notification.id);
          }}
        >
          Mark read
        </Button>
      )}
    </button>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 20;

  const { data, isLoading } = useNotifications({ page, limit });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const notifications = data?.data ?? [];
  const pagination = data?.pagination;
  const hasUnread = notifications.some((n) => !n.isRead);

  function handleMarkRead(id: number) {
    markRead.mutate(id);
  }

  function handleNavigate(notification: Notification) {
    if (!notification.isRead) {
      markRead.mutate(notification.id);
    }
    if (notification.entityType === 'listing' && notification.entityId) {
      navigate(`/manage/listings/${notification.entityId}/edit`);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on your listings and approvals
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => markAllRead.mutate()}
          disabled={!hasUnread || markAllRead.isPending}
        >
          <CheckCheck className="size-4" />
          Mark all as read
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="rounded-lg border p-4">
              <div className="flex items-start gap-3">
                <Skeleton className="mt-1.5 size-2 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border py-12">
            <p className="text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkRead={handleMarkRead}
              onNavigate={handleNavigate}
            />
          ))
        )}
      </div>

      {pagination && pagination.pageCount > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.pageCount}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
