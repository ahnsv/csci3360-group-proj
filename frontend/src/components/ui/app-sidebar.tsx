"use client";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { createSupabaseClient } from "@/lib/supabase/client";
import { ChevronUp, Link2, MessageCircleDashed, MessageSquare, User2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import React from "react";
import { User } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";


export function AppSidebar() {
    const supabase = createSupabaseClient();
    const [user, setUser] = React.useState<User | null>(null);
    const router = useRouter();

    React.useEffect(() => {
        const fetchUser = async () => {
            const { data } = await supabase.auth.getUser();
            if (!data?.user) {
                return;
            }
            setUser(data.user);
        };
        fetchUser();
    }, []);

    const handleSignoutButtonClick = () => {
        supabase.auth.signOut();
        router.push("/signin");
    }

    return (
        <Sidebar>
            <SidebarHeader />
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Platform</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <MessageSquare />
                                Chats
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton>
                                <Link2 />
                                Integration
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>
                <SidebarGroup />
            </SidebarContent>
            <SidebarFooter>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="flex p-2 space-x-1">
                            <User2 />
                            <div className="flex-1 tracking-tight px-2">
                                <p>{user?.user_metadata?.full_name}</p>
                                <p className="text-xs">{user?.email}</p>
                            </div>
                            <ChevronUp className="ml-auto" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="top"
                        className="w-[--radix-popper-anchor-width]"
                    >
                        <DropdownMenuItem>
                            <span>Account</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleSignoutButtonClick}>
                            <span>Sign out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
