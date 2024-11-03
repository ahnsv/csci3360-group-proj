'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import ChatArea from './chat-area';

export default function ChatScheduler({accessToken}: {accessToken: string}) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())

    // Mock schedule data
    const schedules = [
        {id: 1, title: 'Team Meeting', date: '2024-11-04', time: '10:00 AM'},
        {id: 2, title: 'Project Review', date: '2024-11-05', time: '2:00 PM'},
        {id: 3, title: 'Client Call', date: '2024-11-06', time: '11:30 AM'},
    ]

    return (
        <div className="flex h-full bg-gray-100 text-sm tracking-tight">
            <div className="w-1/2">
                <ChatArea accessToken={accessToken} />
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
