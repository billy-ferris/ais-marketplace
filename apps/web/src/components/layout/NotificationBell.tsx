import { Link } from 'react-router';
import { Bell } from 'lucide-react';
import { useUnreadCount } from '@/hooks/useNotifications';

export function NotificationBell() {
  const { data: unreadCount } = useUnreadCount();

  return (
    <Link to="/notifications" className="relative inline-flex">
      <Bell className="size-5 text-muted-foreground hover:text-foreground transition-colors" />
      {unreadCount != null && unreadCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </Link>
  );
}
