import OnboardingSteps from "@/components/chatroom/onboard";
import {redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export default async function OnBoardingPage() {
    const supabase = createServerSupabaseClient()
    const {data: {session}} = await supabase.auth.getSession()
    if (!session?.user) {
        redirect('/signin')
    }

    return (
        <OnboardingSteps accessToken={session.access_token}/>
    )
}