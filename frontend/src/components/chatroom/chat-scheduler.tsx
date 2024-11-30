'use client';

import { ResizablePanel, ResizablePanelGroup } from "../ui/resizable";
import ChatArea from './chat-area';

export default function ChatScheduler() {
    return (
        <ResizablePanelGroup direction="horizontal" className="flex h-full bg-gray-100 text-sm tracking-tight">
            <ResizablePanel className="w-1/2">
                <ChatArea chatroomId={null} />
            </ResizablePanel>
        </ResizablePanelGroup>
    )
}
