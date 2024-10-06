import OnboardingSteps from "@/components/chatroom/onboard";
import {createServerSupabaseClient} from "@/app/supabase.server";
import {redirect} from "next/navigation";

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