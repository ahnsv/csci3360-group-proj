import ChatScheduler from "@/components/chatroom/chat-scheduler";
import {redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";
import { checkRequiredIntegrations } from "../_api/chat";


export default async function Home() {
    const supabase = createServerSupabaseClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) {
        redirect('/signin')
    }
    const {error} = await checkRequiredIntegrations();
    if (error) {
        console.error('Error fetching required integrations:', error);
        redirect('/onboard');
    }
    return (
        <ChatScheduler/>
    );
}
