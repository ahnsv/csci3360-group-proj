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
    const { data: tasks, isLoading, error, execute } = useGetTasks();

    React.useEffect(() => {
        execute({
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
    }, [execute]);

    const TaskList = () => {
        if (isLoading) return (
            <div className="flex items-center justify-center py-4">
                <div className="space-y-3">
                    <div className="w-[200px] h-[20px] bg-gray-200 rounded-full animate-pulse" />
                    <div className="w-[150px] h-[20px] bg-gray-200 rounded-full animate-pulse" />
                </div>
            </div>
        );
        if (error) return <div>Error: {error.message}</div>;

        if (!tasks) return <div className="text-gray-500 text-center py-4">No tasks found</div>;
        return (
            <ScrollArea className="h-[calc(100vh-120px)]">
                {tasks?.map((task) => (
                    <Card key={task.id} className="mb-4">
                        <CardContent className="p-4">
                            <h3 className="font-semibold">{task.name}</h3>
                            <p className="text-sm text-gray-500">{task.description}</p>
                            <p className="text-sm text-gray-500">{task.due_at}</p>
                            <p className="text-sm text-gray-500">{task.link}</p>
                            <p className="text-sm text-gray-500">{task.type}</p>
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
