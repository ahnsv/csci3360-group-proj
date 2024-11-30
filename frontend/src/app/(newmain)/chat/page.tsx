import { API_URL } from "@/app/_api/constants";
import ChatLayout from "@/components/chatroom/chat-layout";
import { AuthProvider } from "@/contexts/AuthContext";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface Chatroom {
    id: number;
    name: string | null;
    type: 'DIRECT' | 'GROUP' | 'COURSE';
    course_id: number | null;
    members: {
        user_id: string;
        is_admin: boolean;
        first_name: string;
        last_name: string;
        email: string;
    }[];
    created_at: string;
    updated_at: string;
}

async function getChatrooms(): Promise<Chatroom[]> {
    const supabase = createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    const response = await fetch(`${API_URL}/chatrooms`, {
        headers: {
            'Authorization': `Bearer ${session?.access_token}`
        },
        cache: 'no-store'
    });

    if (!response.ok) {
        throw new Error('Failed to fetch chatrooms');
    }

    return response.json();
}

export default async function Page() {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.access_token) {
        console.error('Error fetching session:', sessionError);
        redirect('/signin')
    }

    const chatrooms = await getChatrooms();

    return (
        <AuthProvider accessToken={session.access_token} user={session.user}>
            <ChatLayout initialChatrooms={chatrooms} />
        </AuthProvider>
    )
}