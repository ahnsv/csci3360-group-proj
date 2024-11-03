import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import ReactMarkdown from 'react-markdown'

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



const ChatBubble = ({ message }: { message: ChatMessage }) => {
    const handleActionClick = (action: ChatAction) => {
        if (action.type === "link") {
            window.location.href = action.value;
        } else {
            // Handle modal opening logic here
            console.log("Opening modal for:", action.value);
        }
    };

    return (
        <div className={`flex items-start mb-4 ${message.author === 'user' ? 'justify-end' : ''}`}>
            {message.author === 'agent' && (
                <Avatar className="mr-2">
                    <AvatarImage alt="AI"/>
                    <AvatarFallback>AI</AvatarFallback>
                </Avatar>
            )}
            <div className="flex flex-col">
                <div className={`rounded-lg p-2 ${message.author === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                    <ReactMarkdown className="prose dark:prose-invert max-w-none">
                        {message.message}
                    </ReactMarkdown>
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
                </div>
                <span className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(message.sent_at)}
                </span>
            </div>
            {message.author === 'user' && (
                <Avatar className="ml-2">
                    <AvatarImage alt="User"/>
                    <AvatarFallback>U</AvatarFallback>
                </Avatar>
            )}
        </div>
    );
};

export default ChatBubble;