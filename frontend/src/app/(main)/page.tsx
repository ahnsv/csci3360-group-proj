import ChatScheduler from "@/components/chatroom/chat-scheduler";
import {redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import { checkRequiredIntegrations } from "../_api/chat";

export default async function Home() {
    const supabase = createServerSupabaseClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
        console.error('Error fetching user:', userError);
        redirect('/signin')
    }

    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session?.access_token) {
        console.error('Error fetching session:', sessionError);
        redirect('/signin')
    }

    const { error: integrationError } = await checkRequiredIntegrations(session.access_token);
    if (integrationError) {
        console.error('Error fetching required integrations:', integrationError);
        redirect('/onboard');
    }

    return (
        <ChatScheduler accessToken={session.access_token} />
    );
}
