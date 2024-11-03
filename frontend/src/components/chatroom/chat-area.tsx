"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Send, Loader2, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import ReactMarkdown from 'react-markdown'
import { chatWithScheduler, getChatMessages } from '@/app/_api/chat'
import ChatBubble from "./chat-bubble"

type ChatAction = {
    name: string
    value: string
    type: "button" | "link"
}

type ChatMessage = {
    author: string
    message: string
    sent_at: Date
    actions?: ChatAction[]
}

function ScrollToBottomButton({ onClick }: { onClick: () => void }) {
    return (
        <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-20 right-4 rounded-full shadow-lg"
            onClick={onClick}
            aria-label="Scroll to bottom"
            id="scroll-to-bottom-button"
        >
            <ChevronDown className="h-4 w-4" />
        </Button>
    )
}


const ChatArea = ({ accessToken }: { accessToken: string }) => {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        getChatMessages(accessToken).then(setChatMessages);
    }, [accessToken]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setChatMessages((prev) => [...prev, {
            author: 'user',
            message: inputMessage,
            sent_at: new Date(),
        }]);
        chatWithScheduler(inputMessage, accessToken).then((msg) => {
            setChatMessages((prev) => [...prev, msg]);
        }).finally(() => {
            setIsLoading(false);
        });
        setInputMessage('');
    };

    const handleScroll = () => {
        if (scrollAreaRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
            setShowScrollButton(scrollTop + clientHeight < scrollHeight);
        }
    };

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    };

    return (
        <div className="flex flex-col h-full bg-white relative">
            <ScrollArea 
                className="h-[calc(100vh-90px)] p-4"
                ref={scrollAreaRef}
            >
                {chatMessages.map((msg, index) => (
                    <ChatBubble key={index} message={msg} />
                ))}
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