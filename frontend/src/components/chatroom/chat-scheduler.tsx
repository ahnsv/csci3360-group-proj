'use client';

import React from 'react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Calendar} from "@/components/ui/calendar"
import {Card, CardContent} from "@/components/ui/card"
import {Send, Loader2, ChevronDown} from "lucide-react"
import { chatWithScheduler, getChatMessages } from '@/app/_api/chat';
import ReactMarkdown from 'react-markdown'

function formatTimestamp(date: Date): string {
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

type ChatMessage = {
    author: string
    message: string
    sent_at: Date
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

export default function ChatScheduler({accessToken}: {accessToken: string}) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([])
    const [inputMessage, setInputMessage] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [showScrollButton, setShowScrollButton] = React.useState(false)
    const scrollAreaRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        // Initial fetch
        getChatMessages(accessToken).then((messages) => {
            setChatMessages(messages.map((msg: {author: string, message: string, sent_at: string}) => ({
                author: msg.author,
                message: msg.message,
                sent_at: new Date(msg.sent_at),
            })))
        })

        const interval = setInterval(() => {
            getChatMessages(accessToken).then((messages) => {
                setChatMessages(messages.map((msg: {author: string, message: string, sent_at: string}) => ({
                    author: msg.author,
                    message: msg.message,
                    sent_at: new Date(msg.sent_at),
                })))
            })
        }, 1000)

        return () => clearInterval(interval)
    }, [accessToken])

    // Mock schedule data
    const schedules = [
        {id: 1, title: 'Team Meeting', date: '2023-05-15', time: '10:00 AM'},
        {id: 2, title: 'Project Review', date: '2023-05-16', time: '2:00 PM'},
        {id: 3, title: 'Client Call', date: '2023-05-17', time: '11:30 AM'},
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputMessage.trim()) return

        setIsLoading(true)
        const messageText = inputMessage
        setInputMessage('') // Clear input immediately for better UX

        try {
            // Send message to server and get response
            const aiResponse = await chatWithScheduler(messageText, accessToken)
            
            // Get latest messages after sending to ensure consistency
            const updatedMessages = await getChatMessages(accessToken)
            setChatMessages(updatedMessages.map((msg: {author: string, message: string, sent_at: string}) => ({
                author: msg.author,
                message: msg.message,
                sent_at: new Date(msg.sent_at),
            })))
        } catch (error) {
            console.error('Error sending message:', error)
            // Add error message only if API call failed
            setChatMessages(prev => [...prev, {
                author: 'AI', 
                message: 'Sorry, there was an error processing your request.', 
                sent_at: new Date()
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleScroll = (event: React.UIEvent<HTMLDivElement>) => {
        const target = event.target as HTMLDivElement
        const isScrolledUp = target.scrollTop < target.scrollHeight - target.clientHeight - 100
        setShowScrollButton(isScrolledUp)
    }

    const scrollToBottom = () => {
        if (scrollAreaRef.current) {
            const scrollArea = scrollAreaRef.current
            scrollArea.scrollTop = scrollArea.scrollHeight
        }
    }

    React.useEffect(() => {
        scrollToBottom()
    }, [chatMessages])

    return (
        <div className="flex h-full bg-gray-100 text-sm tracking-tight">
            {/* Chat Interface */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white relative">
                <ScrollArea 
                    className="h-[calc(100vh-90px)] p-4"
                    ref={scrollAreaRef}
                    onScroll={handleScroll}
                >
                    {chatMessages.map((msg, index) => (
                        <div key={index}
                             className={`flex items-start mb-4 ${msg.author === 'user' ? 'justify-end' : ''}`}>
                            {msg.author === 'agent' && (
                                <Avatar className="mr-2">
                                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="AI"/>
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                            )}
                            <div className="flex flex-col">
                                <div
                                    className={`rounded-lg p-2 ${msg.author === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                    <ReactMarkdown className="prose dark:prose-invert max-w-none">
                                        {msg.message}
                                    </ReactMarkdown>
                                </div>
                                <span className="text-xs text-gray-500 mt-1">
                                    {formatTimestamp(msg.sent_at)}
                                </span>
                            </div>
                            {msg.author === 'user' && (
                                <Avatar className="ml-2">
                                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User"/>
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start mb-4">
                            <Avatar className="mr-2">
                                <AvatarImage src="/placeholder.svg?height=40&width=40" alt="AI"/>
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

            {/* Schedule View */}
            <div className="w-1/2 p-4 bg-white">
                <Tabs defaultValue="list">
                    <TabsList className="mb-4">
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list">
                        <ScrollArea className="h-[calc(100vh-120px)]">
                            {schedules.map((schedule) => (
                                <Card key={schedule.id} className="mb-4">
                                    <CardContent className="p-4">
                                        <h3 className="font-semibold">{schedule.title}</h3>
                                        <p className="text-sm text-gray-500">{schedule.date} at {schedule.time}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </ScrollArea>
                    </TabsContent>
                    <TabsContent value="calendar">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
