import OnboardingSteps from "@/components/chatroom/onboard";
import {redirect} from "next/navigation";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export default async function OnBoardingPage() {
    const supabase = createServerSupabaseClient()
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) {
        redirect('/signin')
    }

    return (
        <OnboardingSteps/>
    )
}