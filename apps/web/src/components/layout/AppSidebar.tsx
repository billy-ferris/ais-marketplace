import { useUser } from '@clerk/react';
import { Link, useLocation } from 'react-router';
import { ChevronRight } from 'lucide-react';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { useRole } from '@/hooks/useRole';
import { getNavItemsForRole, type NavItem } from '@/lib/constants';
import { ROLE_LABELS } from '@ais/shared';

export function AppSidebar() {
  const { role } = useRole();
  const { user } = useUser();
  const location = useLocation();

  const navItems = role ? getNavItemsForRole(role) : [];

  const isPathActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

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
              {navItems.map((item) =>
                item.children ? (
                  <CollapsibleNavItem
                    key={item.path}
                    item={item}
                    isPathActive={isPathActive}
                  />
                ) : (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      render={<Link to={item.path} />}
                      isActive={isPathActive(item.path)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
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

function CollapsibleNavItem({
  item,
  isPathActive,
}: {
  item: NavItem;
  isPathActive: (path: string) => boolean;
}) {
  const isOpen = isPathActive(item.path);

  return (
    <Collapsible defaultOpen={isOpen} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger className="w-full">
          <SidebarMenuButton tooltip={item.label} isActive={isOpen}>
            <item.icon />
            <span>{item.label}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.children?.map((child) => (
              <SidebarMenuSubItem key={child.path}>
                <SidebarMenuSubButton
                  render={<Link to={child.path} />}
                  isActive={isPathActive(child.path)}
                >
                  <child.icon />
                  <span>{child.label}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}
