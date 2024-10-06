import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

// Create a single supabase client for interacting with your database


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}


