import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function MainLayout({children}: Readonly<{
  children: React.ReactNode;
}>)  {
    return (
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <main className="w-full h-full">
            <SidebarTrigger  className="my-1 mx-2 p-1"/>
            {children}
          </main>
        </SidebarProvider>
    )
}