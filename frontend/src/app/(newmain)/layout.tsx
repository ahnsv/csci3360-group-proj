import { AppSidebar } from "@/components/app-sidebar-v2"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const navMain = [
    {
        title: "Dashboard",
        url: "/dashboard",
    },
    {
        title: "Chat",
        url: "/chat",
    },
    {
        title: "Settings",
        url: "/settings",
    },
]


export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { segments: string[] };
}) {
    const supabase = createServerSupabaseClient();
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) {
        redirect("/signin");
    }

    // Get current path segments from headers
    const pathSegments = headers().get("x-pathname")?.split('/')
      .filter(Boolean)
      .map(segment => ({
        title: segment.charAt(0).toUpperCase() + segment.slice(1),
        href: '/' + segment
      })) ?? [];

    return (
    <SidebarProvider open={false}>
      <AppSidebar user={{
        name: user.user_metadata.name ?? user.email ?? "",
        email: user.email ?? "",
        avatar: user.user_metadata.avatar_url ?? "",
      }} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                {pathSegments.map((segment, index) => (
                  <BreadcrumbItem key={segment.href}>
                    <BreadcrumbSeparator />
                    {index === pathSegments.length - 1 ? (
                      <BreadcrumbPage>{segment.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={segment.href}>
                        {segment.title}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
    )
}