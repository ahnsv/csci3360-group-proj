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
    {
        title: "Coursework",
        url: "/coursework",
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

    const headersList = headers();
    const pathname = headersList.get('x-current-path');
    
    const currentNav = navMain.find(item => 
      item.url === pathname
    );
    console.log({currentNav});

    return (
    <SidebarProvider defaultOpen={false}>
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
                  <BreadcrumbLink href={currentNav?.url}>{currentNav?.title}</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
    )
}