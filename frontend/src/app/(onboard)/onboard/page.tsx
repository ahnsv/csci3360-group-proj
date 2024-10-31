import OnboardingSteps from "@/components/chatroom/onboard";
import {redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export default async function OnBoardingPage() {
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

    return (
        <OnboardingSteps accessToken={session.access_token}/>
    )
}