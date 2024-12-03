import { AppSidebar } from "@/components/app-sidebar-v2";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList
} from "@/components/ui/breadcrumb";
import { JobsNotification } from "@/components/ui/jobs-notification";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { checkRequiredIntegrations } from "../_api/chat";
import { Toaster } from "@/components/ui/toaster"

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
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!user) {
    redirect("/signin");
  }

  const { error } = await checkRequiredIntegrations(session?.access_token);
  if (error) {
    console.error(error);
    redirect("/onboard");
  }

  const headersList = headers();
  const pathname = headersList.get('x-current-path');

  const currentNav = navMain.find(item =>
    item.url === pathname
  );

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
          <div className="flex items-center gap-2 ml-auto mr-4">
            <JobsNotification accessToken={session?.access_token} />
          </div>
        </header>
        {children}
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}