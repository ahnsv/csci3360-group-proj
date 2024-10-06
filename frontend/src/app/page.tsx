import ChatScheduler from "@/components/chatroom/chat-scheduler";
import {redirect} from "next/navigation";

import {createServerSupabaseClient} from "@/app/supabase.server";

export default async function Home() {
    const supabase = createServerSupabaseClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) {
        redirect('/signin')
    }
    return (
        <ChatScheduler/>
    );
}
