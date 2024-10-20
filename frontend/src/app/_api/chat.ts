export const API_URL = process.env.NEXT_PUBLIC_API_URL!

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