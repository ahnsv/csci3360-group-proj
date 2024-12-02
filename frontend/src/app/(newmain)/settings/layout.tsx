import { Metadata } from "next"
import Image from "next/image"

import { Separator } from "@/components/ui/separator"
import { SidebarNav } from "@/components/ui/sidebar-nav"
import { AuthProvider } from "@/contexts/AuthContext"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
    title: "Forms",
    description: "Advanced form example using react-hook-form and Zod.",
}

const sidebarNavItems = [
    {
        title: "Preferences",
        href: "/settings",
    },
    {
        title: "Prompts",
        href: "/settings/prompts",
    },
    {
        title: "Integrations",
        href: "/settings/integrations",
    },
    //   {
    //     title: "Notifications",
    //     href: "/examples/forms/notifications",
    //   },
    //   {
    //     title: "Display",
    //     href: "/examples/forms/display",
    //   },
]

interface SettingsLayoutProps {
    children: React.ReactNode
}

export default async function SettingsLayout({ children }: SettingsLayoutProps) {
    const supabase = createServerSupabaseClient()
    const { data: { session } } = await supabase.auth.getSession()
    const accessToken = session?.access_token || ""
    if (!session) {
        redirect('/signin')
    }

    return (
        <AuthProvider accessToken={accessToken} user={session.user}>
            <div className="hidden space-y-6 p-10 pb-16 md:block">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your preferences.
                    </p>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="-mx-4 lg:w-1/5">
                        <SidebarNav items={sidebarNavItems} />
                    </aside>
                    <div className="flex-1 lg:max-w-2xl">{children}</div>
                </div>
            </div>
        </AuthProvider>
    )
}