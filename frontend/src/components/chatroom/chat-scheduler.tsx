'use client';

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import ChatArea from './chat-area';
import { useGetTasks } from "@/app/_api/auth";

export default function ChatScheduler({accessToken}: {accessToken: string}) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const { data: tasks, isLoading, error } = useGetTasks();

    // Mock schedule data
    const schedules = [
        {id: 1, title: 'Team Meeting', date: '2024-11-04', time: '10:00 AM'},
        {id: 2, title: 'Project Review', date: '2024-11-05', time: '2:00 PM'},
        {id: 3, title: 'Client Call', date: '2024-11-06', time: '11:30 AM'},
    ]

    const TaskList = () => {
        if (isLoading) return <div>Loading...</div>;
        if (error) return <div>Error: {error.message}</div>;

        if (!tasks) return <div className="text-gray-500 text-center py-4">No tasks found</div>;
        return (
            <ScrollArea className="h-[calc(100vh-120px)]">
                {tasks?.map((task) => (
                    <Card key={task.id} className="mb-4">
                        <CardContent className="p-4">
                            <h3 className="font-semibold">{task.name}</h3>
                        </CardContent>
                    </Card>
                ))}
            </ScrollArea>
        )
    }

    return (
        <div className="flex h-full bg-gray-100 text-sm tracking-tight">
            <div className="w-1/2">
                <ChatArea accessToken={accessToken} />
            </div>
            
            {/* Schedule View */}
            <div className="w-1/2 p-4 bg-white">
                <Tabs defaultValue="list" className="flex flex-col items-center">
                    <TabsList className="mb-4">
                        <TabsTrigger value="list">List View</TabsTrigger>
                        <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="list">
                        <ScrollArea className="h-[calc(100vh-120px)]">
                            <TaskList />
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
