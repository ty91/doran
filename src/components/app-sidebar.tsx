"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioLines, Mic, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";

const navItems = [
  {
    title: "미팅",
    href: "/",
    icon: Mic,
    matches: (pathname: string) => pathname === "/" || pathname.startsWith("/meetings"),
  },
  {
    title: "설정",
    href: "/settings",
    icon: Settings,
    matches: (pathname: string) => pathname.startsWith("/settings"),
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<Link href="/" />}
              onClick={() => setOpenMobile(false)}
            >
              <span className="flex aspect-square size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
                <AudioLines className="size-4" aria-hidden />
              </span>
              <span className="truncate text-base font-semibold tracking-tight">Doran</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    isActive={item.matches(pathname)}
                    tooltip={item.title}
                    render={<Link href={item.href} />}
                    onClick={() => setOpenMobile(false)}
                  >
                    <item.icon aria-hidden />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
