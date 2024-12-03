"use client"

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useRef, useState } from 'react';
import { ScrollArea } from '../ui/scroll-area';
import ChatBubble from './chat-bubble';
import { Button } from '../ui/button';
import { Send, Loader2 } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { API_URL } from '@/app/_api/constants';
import { Card } from '../ui/card';
import { Assignment } from './assignment-quiz-card';
import AssignmentQuizCard from './assignment-quiz-card';
import CalendarEventCard from './calendar-event-card';
import CourseListCard from './course-list-card';
// import MaterialDocumentsCard from './material-documents-card';
// import TaskConfirmationCard from './task-confirmation-card';
// import TaskCard from './task-card';

interface ToolInvocation {
    name: string;
    result: string | Array<unknown> | Record<string, unknown>;
    state: "result" | "failure";
}

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
    tool_invocations?: ToolInvocation[];
}

interface ChatAreaProps {
    chatroomId: number | null;
}

interface ConversationStarter {
    title: string;
    prompt: string;
}

export interface CanvasCourse {
    id: number;
    name: string;
    created_at: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    description?: string;
}
interface CalendarEvents {
    created_events: CalendarEvent[];
}

const CONVERSATION_STARTERS: ConversationStarter[] = [
    {
        title: "Checking for upcoming assignments",
        prompt: "What quizzes are due this week?"
    },
    {
        title: "Getting information about enrolled courses",
        prompt: "What courses am I enrolled in?"
    },
    {
        title: "Chat about your course reading materials",
        prompt: "What are the readings for next week's history response paper?"
    },
    {
        title: "Planning study sessions",
        prompt: "Can you plan and schedule my study sessions for the final?"
    }
];

const ToolResultComponent = ({ tool, messageId, accessToken }: {
    tool: ToolInvocation;
    messageId: number;
    accessToken: string;
}) => {
    switch (tool.name) {
        case 'get_user_upcoming_work':
            return (
                <AssignmentQuizCard
                    assignments={(tool.result as { assignments: Assignment[] }).assignments}
                    accessToken={accessToken}
                />
            );
        case 'add_event_to_calendar':
            const calendarResult = tool.result as Record<string, unknown>;
            return (
                <CalendarEventCard
                    event={(calendarResult.created_events as CalendarEvent[])[0]}
                />
            );
        case 'list_courses':
            return (
                <CourseListCard
                    courses={tool.result as CanvasCourse[]}
                />
            );
        // case 'material_documents_retriever':
        //     return (
        //         <MaterialDocumentsCard
        //             documents={tool.result as Document[]}
        //         />
        //     );
        // case 'ask_if_adding_task_is_ok':
        //     return (
        //         <TaskConfirmationCard
        //             task={tool.result as Task}
        //             messageId={messageId}
        //         />
        //     );
        // case 'add_task':
        //     return (
        //         <TaskCard
        //             task={tool.result as Task}
        //         />
        //     );
        default:
            return null;
    }
};

export default function ChatArea({ chatroomId }: ChatAreaProps) {
    const { accessToken, user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const [isAgentTyping, setIsAgentTyping] = useState(false);

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
        setIsAgentTyping(true);
        const message = input.trim();
        setInput('');

        // Add user message immediately to the UI
        const userMessage: Message = {
            id: Date.now(), // Temporary ID
            chatroom_id: chatroomId,
            author: 'user',
            message: message,
            sent_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch(`${API_URL}/chatrooms/${chatroomId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    user_id: user.id
                })
            });

            if (!response.ok) throw new Error('Failed to send message');

            const newMessage = await response.json();
            // Append the server response instead of replacing the user message
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
            setIsAgentTyping(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleStarterClick = async (starter: ConversationStarter) => {
        if (!chatroomId || isLoading) return;

        const message = `${starter.prompt}`;
        setIsLoading(true);
        setIsAgentTyping(true);

        // Add user message immediately to the UI
        const userMessage: Message = {
            id: Date.now(), // Temporary ID
            chatroom_id: chatroomId,
            author: 'user',
            message: message,
            sent_at: new Date().toISOString()
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch(`${API_URL}/chatrooms/${chatroomId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    user_id: user.id
                })
            });

            if (!response.ok) throw new Error('Failed to send message');

            const newMessage = await response.json();
            // Append the server response instead of replacing the user message
            setMessages(prev => [...prev, newMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            setIsLoading(false);
            setIsAgentTyping(false);
        }
    };

    const WelcomeMessage = () => (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="max-w-2xl w-full space-y-8 flex flex-col">
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold tracking-tight">Welcome to Aquila Chat</h2>
                    <p className="text-muted-foreground">
                        This is an open source chatbot template built with Next.js and the AI SDK by Vercel.
                    </p>
                </div>

                <div className="space-y-8 mt-auto">
                    <h3 className="text-lg font-medium italic">Start a conversation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {CONVERSATION_STARTERS.map((starter, index) => (
                            <Card
                                key={index}
                                className="p-4 hover:bg-muted cursor-pointer transition-colors"
                                onClick={() => handleStarterClick(starter)}
                            >
                                <h4 className="font-medium">{starter.title}</h4>
                                <p className="text-sm text-muted-foreground">{starter.prompt}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    if (!chatroomId) {
        return (
            <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a chat or start a new conversation
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col max-h-[calc(100vh-150px)] text-sm">
            <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
                <div className="space-y-4">
                    {messages.length === 0 ? (
                        <WelcomeMessage />
                    ) : (
                        <>
                            {messages.map((message) => (
                                <div key={message.id}>
                                    {message.tool_invocations && 
                                     message.tool_invocations.length > 0 && 
                                     message.tool_invocations[message.tool_invocations.length - 1].state === "result" ? (
                                        <ToolResultComponent
                                            key={`${message.id}-last`}
                                            tool={message.tool_invocations[message.tool_invocations.length - 1]}
                                            messageId={message.id}
                                            accessToken={accessToken}
                                        />
                                    ) : (
                                        <ChatBubble
                                            message={{
                                                author: message.author,
                                                message: message.message,
                                                sent_at: new Date(message.sent_at),
                                                actions: message.actions
                                            }}
                                        />
                                    )}
                                </div>
                            ))}
                            {isAgentTyping && (
                                <ChatBubble
                                    message={{
                                        author: 'agent',
                                        message: '',
                                        sent_at: new Date(),
                                        isTyping: true
                                    }}
                                />
                            )}
                        </>
                    )}
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