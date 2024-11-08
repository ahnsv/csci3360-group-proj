'use client';

import { useGetTasks } from "@/app/_api/auth";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import ChatArea from './chat-area';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "../ui/resizable";

export default function ChatScheduler({accessToken}: {accessToken: string}) {
    const [date, setDate] = React.useState<Date | undefined>(new Date())
    const { data: tasks, isLoading, error, execute } = useGetTasks();

    React.useEffect(() => {
        const interval = setInterval(() => {
            execute({
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
        }, 10000);
        return () => clearInterval(interval);
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

        const Participants = (participants: string[]) => {
            return participants.map((participant) => (
                <Avatar 
                    key={participant}
                    className="h-8 w-8 border-2 border-white transition-transform duration-300 ease-in-out"
                    title={participant}
                >
                    <AvatarImage src={`https://ui-avatars.com/api/?name=${encodeURIComponent(participant)}`} alt={participant} />
                    <AvatarFallback>{participant[0]}</AvatarFallback>
                </Avatar>
            ));
        }
        return (
            <ScrollArea className="h-[calc(100vh-120px)]">
                {tasks?.map((task) => (
                    <Card key={task.id} className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex justify-between">
                                <div>
                                    <h3 className="font-semibold">{task.name}</h3>
                                    <p className="text-sm text-gray-500">{task.description}</p>
                                    <p className="text-sm text-gray-500">{task.due_at}</p>
                                    <p className="text-sm text-gray-500">{task.link}</p>
                                    <p className="text-sm text-gray-500">{task.type}</p>
                                </div>
                                <div className="group relative">
                                    <div className="flex -space-x-3 transition-all duration-300 group-hover:space-x-1">
                                        {Participants(['John Doe', 'Jane Doe', 'John Smith', 'Jane Smith'])}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </ScrollArea>
        )
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="flex h-full bg-gray-100 text-sm tracking-tight">
            <ResizablePanel className="w-1/2">
                <ChatArea accessToken={accessToken} />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel className="w-1/2 p-4 bg-white hidden md:block">
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
                            modifiers={{
                                hasTasks: tasks?.map(task => new Date(task.due_at || '')) || []
                            }}
                            modifiersStyles={{
                                hasTasks: {
                                    backgroundColor: "#e2e8f0",
                                    fontWeight: "bold"
                                }
                            }}
                            components={{
                                DayContent: ({ date }) => {
                                    const dayTasks = tasks?.filter(task => 
                                        new Date(task.due_at || '').toDateString() === date.toDateString()
                                    );
                                    return (
                                        <div className="relative">
                                            <div>{date.getDate()}</div>
                                            {dayTasks && dayTasks.length > 0 && (
                                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                                                    <div className="h-1 w-1 rounded-full bg-blue-500" />
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            }}
                        />
                        {/* Add List of Tasks for the selected date */}
                        <ScrollArea className="mt-4">
                            {
                                tasks?.filter((task) => 
                                    new Date(task.due_at || '').toDateString() === date?.toDateString()
                                )
                                .map((task) => (
                                    <Card key={task.id} className="mb-4">
                                        <CardContent className="p-4">
                                            <p className="font-semibold">{task.name}</p>
                                            <p className="text-sm text-gray-500">{task.description}</p>
                                        </CardContent>
                                    </Card>
                                ))
                            }
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
