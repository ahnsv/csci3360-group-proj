'use client'

import { ScrollArea } from '../ui/scroll-area';

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
}

interface ChatSidebarProps {
    chatrooms: Chatroom[];
    selectedChatroom: number | null;
    onSelectChatroom: (id: number) => void;
}

export default function ChatSidebar({
    chatrooms,
    selectedChatroom,
    onSelectChatroom
}: ChatSidebarProps) {
    return (
        <div className="w-64 border-r border-t">
            <ScrollArea className="h-full">
                <div className="p-4">
                    <h2 className="font-semibold mb-4">Chat History</h2>
                    <div className="space-y-2">
                        {chatrooms.map((chatroom) => (
                            <button
                                key={chatroom.id}
                                onClick={() => onSelectChatroom(chatroom.id)}
                                className={`w-full text-left p-2 rounded ${selectedChatroom === chatroom.id
                                        ? 'bg-blue-100'
                                        : 'hover:bg-gray-100'
                                    }`}
                            >
                                {chatroom.name ||
                                    (() => {
                                        const date = new Date(chatroom.created_at);
                                        const today = new Date();
                                        return date.toDateString() === today.toDateString()
                                            ? date.toLocaleTimeString()
                                            : date.toLocaleDateString();
                                    })()}
                            </button>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
} 