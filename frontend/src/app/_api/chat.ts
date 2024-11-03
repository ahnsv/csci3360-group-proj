import { redirect } from "next/navigation";
import { API_URL } from "./constants";
export async function chatWithScheduler(message: string, accessToken: string) {
    const response = await fetch(`${API_URL}/chat/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
            author: 'user',
            message: message,
            sent_at: new Date(),
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Chat API error: ${errorData.detail.message}`);
    }

    const data = await response.json();
    return {
        author: data.author as string,
        message: data.message as string,
        sent_at: new Date(data.sent_at),
    };
}

export const checkRequiredIntegrations = async (accessToken: string) => {
    let response;
    try {
        response = await fetch(`${API_URL}/auth/required-integrations/`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            signal: AbortSignal.timeout(5000)
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            redirect('/504')
        }
        throw error;
    }

    if (response.status === 504) {
        redirect('/504')
    }

    if (!response.ok) {
        const errorText = await response.text();
        const errorData = { message: errorText };

        return {
            data: null,
            error: errorData,
        }
    }

    return {
        data: await response.json(),
        error: null,
    }

}

export const getChatMessages = async (accessToken: string) => {
    const response = await fetch(`${API_URL}/chat/`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch chat messages');
    }

    const data = await response.json();
    return data.map((msg: Record<string, any>) => ({
        author: msg.author,
        message: msg.message,
        sent_at: new Date(msg.sent_at),
        actions: msg?.actions,
    }));
}

