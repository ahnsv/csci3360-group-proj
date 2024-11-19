import ChatScheduler from "@/components/chatroom/chat-scheduler";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const supabase = createServerSupabaseClient();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.access_token) {
        console.error('Error fetching session:', sessionError);
        redirect('/signin')
    }

    return (
        <ChatScheduler accessToken={session.access_token} />
    )
}