import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function MainLayout({children}: Readonly<{
  children: React.ReactNode;
}>)  {
    return (
        <SidebarProvider defaultOpen={false}>
          <AppSidebar />
          <main className="w-full h-full flex flex-col">
            <SidebarTrigger  className="p-1 ml-4"/>
            {children}
          </main>
        </SidebarProvider>
    )
}