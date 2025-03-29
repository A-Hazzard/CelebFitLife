import { useState, useCallback, useEffect } from "react";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { ChatMessage } from "@/lib/types/stream";
import { useAuthStore } from "@/lib/store/useAuthStore";

/**
 * Custom hook to manage chat functionality for streams.
 * Handles chat message listening, sending messages, and state management.
 *
 * @param slug - The stream identifier to connect to the correct chat
 * @returns Object containing messages, sending functionality, and message input state
 */
export const useStreamChat = (slug: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const { currentUser } = useAuthStore();

  // Set up message listener
  useEffect(() => {
    if (!slug) return;

    const unsubscribe = listenToMessages(slug, (newMessages) => {
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [slug]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!newMessage.trim() || !currentUser) return;

      try {
        await sendChatMessage({
          streamId: slug,
          userId: currentUser.uid,
          username: currentUser.username || currentUser.email || "Anonymous",
          message: newMessage,
          timestamp: new Date().toISOString(),
        });

        setNewMessage("");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    },
    [slug, newMessage, currentUser]
  );

  // Handle enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return {
    messages,
    newMessage,
    setNewMessage,
    handleSendMessage,
    handleKeyPress,
  };
};
