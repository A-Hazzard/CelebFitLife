import React from "react";
import { useStreamChat } from "@/lib/hooks/useStreamChat";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

interface StreamChatProps {
  slug: string;
  className?: string;
}

const StreamChat: React.FC<StreamChatProps> = ({ slug, className = "" }) => {
  const {
    messages,
    newMessage,
    setNewMessage,
    handleSubmit,
    handleKeyPress,
    isLoading,
    error,
  } = useStreamChat(slug);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={`flex flex-col h-full border rounded-lg overflow-hidden bg-white ${className}`}
    >
      {/* Chat Header */}
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-medium">Live Chat</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            No messages yet. Be the first to send a message!
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex flex-col">
              <div className="flex items-baseline gap-2">
                <span
                  className={`font-medium ${
                    message.isHost ? "text-blue-600" : ""
                  }`}
                >
                  {message.sender}
                  {message.isHost && (
                    <span className="ml-1 text-xs bg-blue-100 text-blue-600 px-1 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-gray-700">{message.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-2 text-sm text-red-500 bg-red-50 border-t border-red-200">
          {error}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="border-t p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex items-center gap-1"
          >
            <Send size={16} />
            Send
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StreamChat;
