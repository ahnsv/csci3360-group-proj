'use client'

import { useState } from 'react';
import ChatSidebar from './chat-sidebar';
import ChatArea from './chat-area';
import { Button } from '../ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { API_URL } from '@/app/_api/constants';

interface ChatroomMember {
    user_id: string;
    is_admin: boolean;
    first_name: string;
    last_name: string;
    email: string;
}

interface Chatroom {
    id: number;
    name: string | null;
    type: 'DIRECT' | 'GROUP' | 'COURSE';
    course_id: number | null;
    members: ChatroomMember[];
    created_at: string;
    updated_at: string;
}

interface ChatLayoutProps {
    initialChatrooms: Chatroom[];
}

export default function ChatLayout({ initialChatrooms }: ChatLayoutProps) {
    const { accessToken, user } = useAuth();
    const [chatrooms, setChatrooms] = useState<Chatroom[]>(initialChatrooms);
    const [selectedChatroom, setSelectedChatroom] = useState<number | null>(null);

    const handleNewChat = async () => {
        try {
            const response = await fetch(`${API_URL}/chatrooms`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    type: 'DIRECT',
                    member_ids: [user.id]
                })
            });
            
            if (!response.ok) throw new Error('Failed to create chatroom');
            
            const newChatroom = await response.json();
            setChatrooms(prev => [...prev, newChatroom]);
            setSelectedChatroom(newChatroom.id);
        } catch (error) {
            console.error('Error creating new chat:', error);
        }
    };

    const handleClearChat = () => {
        setSelectedChatroom(null);
    };

    return (
        <div className="flex h-full">
            <ChatSidebar 
                chatrooms={chatrooms}
                selectedChatroom={selectedChatroom}
                onSelectChatroom={setSelectedChatroom}
            />
            <div className="flex-1 flex flex-col border-t">
                <div className="p-4 border-b flex justify-end gap-2">
                    <Button onClick={handleNewChat} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        New Chat
                    </Button>
                    <Button onClick={handleClearChat} variant="outline">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Clear Chat
                    </Button>
                </div>
                <ChatArea 
                    chatroomId={selectedChatroom}
                />
            </div>
        </div>
    );
} 