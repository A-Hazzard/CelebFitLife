import React, { useRef, useEffect } from "react";
import { useStreamChat } from "@/lib/hooks/useStreamChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface StreamChatProps {
  streamId: string;
  className?: string;
  onUserClick?: (username: string, userId: string) => void;
}

const StreamChat: React.FC<StreamChatProps> = ({
  streamId,
  className = "",
  onUserClick,
}) => {
  const {
    messages,
    newMessage,
    setNewMessage,
    handleSubmit,
    handleKeyPress,
    isLoading,
    error,
    retryConnection,
  } = useStreamChat(streamId);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Helper to format time - consider moving to a utils file if used elsewhere
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      console.warn("Error formatting time:", e);
      return "Just now";
    }
  };

  return (
    <div
      className={`flex flex-col h-full border border-gray-800 rounded-lg overflow-hidden bg-brandBlack ${className}`}
    >
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-800 bg-gray-900">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-t-brandOrange border-gray-600"></div>
            )}
            {error && (
              <div className="text-red-500 text-xs">Connection Error</div>
            )}
          </div>
          {error && (
            <Button
              variant="ghost"
              onClick={retryConnection}
              className="h-8 px-2 text-xs text-brandOrange hover:bg-gray-800"
            >
              <RefreshCw size={14} className="mr-1" />
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-900 bg-opacity-50">
        {isLoading ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-brandOrange border-gray-600 mr-2"></div>
            Loading messages...
          </div>
        ) : error ? (
          <div className="flex flex-col justify-center items-center h-full text-gray-400">
            <p className="mb-4 text-center">{error}</p>
            <Button
              variant="outline"
              onClick={retryConnection}
              className="flex items-center gap-2 text-brandOrange border-brandOrange/50 hover:bg-brandOrange/10"
            >
              <RefreshCw size={16} />
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
                  } ${onUserClick ? "cursor-pointer hover:underline" : ""}`}
                  onClick={() =>
                    onUserClick && onUserClick(message.sender, message.id)
                  }
                >
                  {message.sender}
                  {message.isHost && (
                    <span className="ml-1 text-xs bg-brandOrange bg-opacity-20 text-brandOrange px-1 py-0.5 rounded">
                      Host
                    </span>
                  )}
                </span>
                <span className="text-xs text-gray-500">
                  {formatTime(message.createdAt)}
                </span>
              </div>
              <p className="text-gray-300">{message.message}</p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Send a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 bg-gray-700 border-gray-600 text-white focus:border-brandOrange focus:ring-brandOrange"
            disabled={isLoading || !!error}
          />
          <Button
            type="submit"
            className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
            disabled={!newMessage.trim() || isLoading || !!error}
          >
            <Send size={16} />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default StreamChat;
