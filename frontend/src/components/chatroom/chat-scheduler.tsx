'use client';

import React from 'react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Calendar} from "@/components/ui/calendar"
import {Card, CardContent} from "@/components/ui/card"
import {Send, Loader2} from "lucide-react"
import { chatWithScheduler } from '@/app/_api/chat';

export default function ChatScheduler() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const [chatMessages, setChatMessages] = React.useState([
        {author: 'agent', message: 'Hello! How can I assist you today?', sent_at: new Date()}
    ])
    const [inputMessage, setInputMessage] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)

    // Mock schedule data
    const schedules = [
        {id: 1, title: 'Team Meeting', date: '2023-05-15', time: '10:00 AM'},
        {id: 2, title: 'Project Review', date: '2023-05-16', time: '2:00 PM'},
        {id: 3, title: 'Client Call', date: '2023-05-17', time: '11:30 AM'},
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputMessage.trim()) return

        // Add user message to chat
        const userMessage = {author: 'User', message: inputMessage, sent_at: new Date()}
        setChatMessages(prev => [...prev, userMessage])

        // Clear input
        setInputMessage('')

        // Set loading to true
        setIsLoading(true)

        try {
            // Send message to server and get response
            const aiResponse = await chatWithScheduler(inputMessage)
            setChatMessages(prev => [...prev, aiResponse])
        } catch (error) {
            console.error('Error sending message:', error)
            // Optionally, add an error message to the chat
            setChatMessages(prev => [...prev, {author: 'AI', message: 'Sorry, there was an error processing your request.', sent_at: new Date()}])
        } finally {
            // Set loading to false when done
            setIsLoading(false)
        }
    }

    return (
        <div className="flex h-full bg-gray-100 text-sm tracking-tight">
            {/* Chat Interface */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
                <ScrollArea className="flex-grow p-4">
                    {chatMessages.map((msg, index) => (
                        <div key={index}
                             className={`flex items-start mb-4 ${msg.author === 'User' ? 'justify-end' : ''}`}>
                            {msg.author === 'agent' && (
                                <Avatar className="mr-2">
                                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="AI"/>
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={`rounded-lg p-2 max-w-[70%] ${msg.author === 'User' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                {msg.message}
                            </div>
                            {msg.author === 'User' && (
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
                <div className="p-4 border-t border-gray-200">
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
