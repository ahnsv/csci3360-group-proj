import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const supabase = createServerSupabaseClient();
    const { data: {user} } = await supabase.auth.getUser();
    if (!user) {
        redirect("/login");
    }
    redirect("/dashboard");
}
