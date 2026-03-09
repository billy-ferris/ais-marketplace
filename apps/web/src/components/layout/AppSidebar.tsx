import { useUser } from '@clerk/react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/hooks/useRole';
import { getNavItemsForRole } from '@/lib/constants';
import { ROLE_LABELS } from '@ais/shared';

export function AppSidebar() {
  const { role } = useRole();
  const { user } = useUser();

  const navItems = role ? getNavItemsForRole(role) : [];

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
                AIS
              </div>
              <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                <span className="truncate font-semibold">AIS Marketplace</span>
                <span className="truncate text-xs text-muted-foreground">
                  CPG Platform
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={item.path === '/'}
                    tooltip={item.label}
                  >
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-xs font-medium">
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </div>
              <div className="flex flex-col gap-0.5 leading-none overflow-hidden">
                <span className="truncate font-medium text-sm">
                  {user?.fullName ?? 'User'}
                </span>
                <div className="flex items-center gap-1.5">
                  {role && (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                      {ROLE_LABELS[role]}
                    </Badge>
                  )}
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
