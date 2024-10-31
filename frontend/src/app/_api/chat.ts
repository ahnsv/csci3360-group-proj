import { API_URL } from "./constants";
export async function chatWithScheduler(message: string) {
    const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            author: 'user',
            message: message,
            sent_at: new Date().toISOString(),
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Chat API error: ${errorData.detail.message}`);
    }

    const data = await response.json();
    return {
        author: data.author,
        message: data.message,
        sent_at: new Date(data.sent_at),
    };
}

export const checkRequiredIntegrations = async (accessToken: string) => {
    const response = await fetch(`${API_URL}/auth/required-integrations/`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Cache-Control': 'no-cache' // Ensure the request is not cached
        }
    });

    if (!response.ok) {
        const errorData = await response.json();

        return {
            data: null,
            error: errorData,
        }
    }

    return {
      data: await response.json(),
      error: null,
    };
}