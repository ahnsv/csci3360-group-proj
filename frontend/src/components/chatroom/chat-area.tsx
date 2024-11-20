"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Send, Loader2, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import ReactMarkdown from 'react-markdown'
import { chatWithScheduler, getChatMessages, talkToAgent } from '@/app/_api/chat'
import ChatBubble from "./chat-bubble"
import AssignmentQuizCard from "./assignment-quiz-card"

type ChatAction = {
    name: string
    value: string
    type: "button" | "link"
}

type ToolInvocation = {
    name: string
    result: Record<string, any>
    state: "result" | "failure"
}

type ChatMessage = {
    author: string
    message: string
    sent_at: Date
    actions?: ChatAction[]
    toolInvocations?: any[]
}

function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
    return (
        <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-full shadow-lg transition-opacity duration-500"
            onClick={onClick}
            aria-label="Scroll to bottom"
            id="scroll-to-bottom-button"
            style={{
                opacity: 1,
                animation: 'fade 500ms ease-in-out'
            }}
        >
            <ChevronDown className="h-4 w-4" />
            <style jsx>{`
                @keyframes fade {
                    0% { opacity: 0; }
                    100% { opacity: 1; }
                }
            `}</style>
        </Button>
    )
}


const ChatArea = ({ accessToken }: { accessToken: string }) => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getChatMessages(accessToken).then(setChatMessages);
    }, [accessToken]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        scrollToBottom();
        setChatMessages((prev) => [...prev, {
            author: 'user',
            message: inputMessage,
            sent_at: new Date(),
        }]);
        talkToAgent(accessToken, inputMessage).then((msg) => {
            setChatMessages((prev) => [...prev, msg]);
        })
        .catch(() => {
            setChatMessages((prev) => [...prev, {
                author: 'agent',
                message: 'Sorry, I\'m having trouble processing your message. Please try again later.',
                sent_at: new Date(),
            }]);
        })
        .finally(() => {
            setIsLoading(false);
        });
        setInputMessage('');
    };

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target as HTMLDivElement;
        setShowScrollButton(scrollTop + clientHeight < scrollHeight - 20);
    };

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <ScrollArea 
                className="h-[calc(100vh-90px)] p-4"
                onScrollCapture={handleScroll}
            >
                <div className="h-full" ref={scrollAreaRef}>
                    {chatMessages.map((msg, index) => {
                        const hasAssignmentTool = msg.toolInvocations?.some(
                            tool => tool.name === "get_upcoming_assignments_and_quizzes_tool" && 
                            tool.state === "result"
                        );

                        if (hasAssignmentTool && msg.toolInvocations) {
                            const assignments = msg.toolInvocations.find(
                                tool => tool.name === "get_upcoming_assignments_and_quizzes_tool"
                            )?.result?.assignments;
                            return <AssignmentQuizCard key={index} assignments={assignments} />;
                        }

                        return <ChatBubble key={index} message={msg} />;
                    })}
                    {isLoading && (
                        <div className="flex items-start mb-4">
                            <Avatar className="mr-2">
                                <AvatarImage alt="AI"/>
                                <AvatarFallback>AI</AvatarFallback>
                            </Avatar>
                            <div className="rounded-lg p-2 bg-gray-200 flex items-center">
                                <Loader2 className="h-4 w-4 animate-spin text-gray-500 mr-2" />
                                <span>Thinking...</span>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
            
            {showScrollButton && <ScrollToBottomButton onClick={scrollToBottom} />}
            
            <div className="px-4 border-t border-gray-200 flex-1 h-24 p-2">
                <form className="flex items-center" onSubmit={handleSubmit}>
                    <Input 
                        type="text" 
                        placeholder="Type your message..." 
                        className="flex-grow mr-2"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" disabled={isLoading}>
                        <Send className="h-4 w-4"/>
                    </Button>
                </form>
            </div>
        </div>
    );
};

export default ChatArea;