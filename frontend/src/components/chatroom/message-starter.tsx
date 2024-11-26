import { Button } from "@/components/ui/button"
import { HelpCircle } from "lucide-react"

interface MessageStarterProps {
  onMessageSelect: (message: string) => void
  isOpen: boolean
  onToggle: () => void
}

const MessageStarter = ({ onMessageSelect, isOpen, onToggle }: MessageStarterProps) => {
  const sampleMessages = [
    {
      title: "What's my assignments/quizzes next week?",
      message: "What's my assignments/quizzes next week?"
    },
    {
      title: "What classes am I taking?",
      message: "What classes am I taking?"
    }
  ]

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    onToggle();
  };

  const handleSelect = (e: React.MouseEvent, message: string) => {
    e.preventDefault();
    onMessageSelect(message);
    onToggle();
  };

  return (
    <div className="relative inline-block">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggle}
        className="h-10 w-10"
        aria-label="Toggle FAQ suggestions"
      >
        <HelpCircle className="h-5 w-5" />
      </Button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2 min-w-[280px] z-50">
          <div className="flex flex-col gap-1">
            {sampleMessages.map((item, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                className="w-full justify-start text-sm h-auto py-2 px-3 hover:bg-gray-100"
                onClick={(e) => handleSelect(e, item.message)}
              >
                {item.title}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MessageStarter 