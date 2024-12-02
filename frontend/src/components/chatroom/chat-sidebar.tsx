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
    onDeleteChatroom?: (id: number) => void;
}

export default function ChatSidebar({
    chatrooms,
    selectedChatroom,
    onSelectChatroom,
    onDeleteChatroom
}: ChatSidebarProps) {
    return (
        <div className="w-64 border-r border-t">
            <ScrollArea className="h-full">
                <div className="p-4 text-sm">
                    <h2 className="font-semibold mb-4">Chat History</h2>
                    <div className="space-y-2">
                        {chatrooms.map((chatroom) => (
                            <div
                                key={chatroom.id}
                                className="flex items-center gap-2"
                            >
                                <button
                                    onClick={() => onSelectChatroom(chatroom.id)}
                                    className={`flex-1 text-left p-2 rounded ${
                                        selectedChatroom === chatroom.id
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
                                {onDeleteChatroom && (
                                    <button
                                        onClick={() => onDeleteChatroom(chatroom.id)}
                                        className="p-2 text-gray-500 hover:text-red-500 rounded"
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M3 6h18" />
                                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </ScrollArea>
        </div>
    );
} 