"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import ChatBubble from './chat-bubble';
import { Button } from '../ui/button';
import { Send } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { API_URL } from '@/app/_api/constants';

interface Message {
    id: number;
    chatroom_id: number;
    author: 'user' | 'agent';
    message: string;
    sent_at: string;
    actions?: {
        name: string;
        value: string;
        type: "button" | "link";
    }[];
}

interface ChatAreaProps {
    chatroomId: number | null;
}

export default function ChatArea({ chatroomId }: ChatAreaProps) {
    const { accessToken, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chatroomId) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            try {
                const response = await fetch(`${API_URL}/chatrooms/${chatroomId}/chats`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!response.ok) throw new Error('Failed to fetch messages');

                const data = await response.json();
                setMessages(data);
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        fetchMessages();
    }, [chatroomId, accessToken]);

    useEffect(() => {
        // Scroll to bottom when messages change
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!input.trim() || !chatroomId || isLoading) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/chatrooms/${chatroomId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: input.trim(),
                    user_id: user.id
                })
            });

            if (!response.ok) throw new Error('Failed to send message');

            const newMessage = await response.json();
            setMessages(prev => [...prev, newMessage]);
            setInput('');
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    if (!chatroomId) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat or start a new conversation
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.map((message) => (
                        <ChatBubble
                            key={message.id}
                            message={{
                                author: message.author,
                                message: message.message,
                                sent_at: new Date(message.sent_at),
                                actions: message.actions
                            }}
                        />
                    ))}
                </div>
            </ScrollArea>
            
            <div className="p-4 border-t">
                <div className="flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        className="min-h-[60px] max-h-[200px]"
                        disabled={isLoading}
                    />
                    <Button 
                        onClick={handleSendMessage}
                        disabled={!input.trim() || isLoading}
                        className="px-4"
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}