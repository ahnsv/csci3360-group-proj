import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"
import {createClient} from '@supabase/supabase-js'

// Create a single supabase client for interacting with your database


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const createSupabaseClient = () => createClient(SUPABASE_URL, SUPABASE_KEY)
