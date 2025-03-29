import React from "react";
import { useStreamChat } from "@/lib/hooks/useStreamChat";
import { Send, RefreshCw } from "lucide-react";
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
    retryConnection,
  } = useStreamChat(slug);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={`flex flex-col h-full border border-gray-800 rounded-lg overflow-hidden bg-brandBlack ${className}`}
    >
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-800 bg-gray-900">
        <h3 className="font-medium text-brandWhite">Live Chat</h3>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-900 bg-opacity-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-brandOrange border-gray-600 mr-2"></div>
            Loading messages...
          </div>
        ) : error && messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400">
            <p className="mb-4 text-center">{error}</p>
            <Button
              variant="outline"
              onClick={retryConnection}
              className="flex items-center gap-2 text-brandOrange border-brandOrange/50 hover:bg-brandOrange/10"
            >
              <RefreshCw size={16} className="animate-spin" />
              Retry Connection
            </Button>
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
                    message.isHost ? "text-brandOrange" : "text-brandWhite"
                  }`}
                >
                  {message.sender}
                  {message.isHost && (
                    <span className="ml-1 text-xs bg-brandOrange bg-opacity-20 text-brandOrange px-1 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.createdAt), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-gray-300">{message.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-800 p-3 bg-gray-900"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-brandOrange text-brandWhite placeholder:text-gray-500"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex items-center gap-1 bg-brandOrange hover:bg-brandOrange/80 text-brandBlack"
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
