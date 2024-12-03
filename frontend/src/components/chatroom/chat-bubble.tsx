import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import ReactMarkdown from 'react-markdown'
import { Loader2 } from "lucide-react"

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
    isTyping?: boolean
}

const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

interface ChatBubbleProps {
    message: {
        author: 'user' | 'agent';
        message: string;
        sent_at: Date;
        actions?: {
            name: string;
            value: string;
            type: "button" | "link";
        }[];
        isTyping?: boolean;
    };
}

export default function ChatBubble({ message }: ChatBubbleProps) {
    const handleActionClick = (action: ChatAction) => {
        if (action.type === "link") {
            window.location.href = action.value;
        } else {
            // Handle modal opening logic here
            console.log("Opening modal for:", action.value);
        }
    };

    return (
        <div className={`flex ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`rounded-lg p-4 max-w-[80%] ${
                message.author === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
            }`}>
                {message.isTyping ? (
                    <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>AI is typing...</span>
                    </div>
                ) : (
                    <>
                        <div className="whitespace-pre-wrap">{message.message}</div>
                        {message.actions && (
                            <div className="mt-2 flex gap-2">
                                {message.actions.map((action, index) => (
                                    <Button
                                        key={index}
                                        variant={action.type === "link" ? "link" : "secondary"}
                                        onClick={() => handleActionClick(action)}
                                    >
                                        {action.name}
                                    </Button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}