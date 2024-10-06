'use client';

import React from 'react'
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {ScrollArea} from "@/components/ui/scroll-area"
import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
import {Button} from "@/components/ui/button"
import {Input} from "@/components/ui/input"
import {Calendar} from "@/components/ui/calendar"
import {Card, CardContent} from "@/components/ui/card"
import {Send} from "lucide-react"

export default function ChatScheduler() {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    // Mock chat messages
    const chatMessages = [
        {sender: 'AI', message: 'Hello! How can I assist you today?'},
        {sender: 'User', message: 'I need help scheduling a meeting.'},
        {sender: 'AI', message: 'What date and time would you prefer?'},
    ]

    // Mock schedule data
    const schedules = [
        {id: 1, title: 'Team Meeting', date: '2023-05-15', time: '10:00 AM'},
        {id: 2, title: 'Project Review', date: '2023-05-16', time: '2:00 PM'},
        {id: 3, title: 'Client Call', date: '2023-05-17', time: '11:30 AM'},
    ]

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Chat Interface */}
            <div className="w-1/2 flex flex-col border-r border-gray-200 bg-white">
                <ScrollArea className="flex-grow p-4">
                    {chatMessages.map((msg, index) => (
                        <div key={index}
                             className={`flex items-start mb-4 ${msg.sender === 'User' ? 'justify-end' : ''}`}>
                            {msg.sender === 'AI' && (
                                <Avatar className="mr-2">
                                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="AI"/>
                                    <AvatarFallback>AI</AvatarFallback>
                                </Avatar>
                            )}
                            <div
                                className={`rounded-lg p-2 max-w-[70%] ${msg.sender === 'User' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>
                                {msg.message}
                            </div>
                            {msg.sender === 'User' && (
                                <Avatar className="ml-2">
                                    <AvatarImage src="/placeholder.svg?height=40&width=40" alt="User"/>
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                            )}
                        </div>
                    ))}
                </ScrollArea>
                <div className="p-4 border-t border-gray-200">
                    <form className="flex items-center">
                        <Input type="text" placeholder="Type your message..." className="flex-grow mr-2"/>
                        <Button type="submit" size="icon">
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