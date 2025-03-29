import { useState, useCallback, useEffect } from "react";
import { listenToMessages, sendChatMessage } from "@/lib/services/ChatService";
import { ChatMessage } from "@/lib/types/stream";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { createLogger } from "@/lib/utils/logger";

const logger = createLogger("StreamChat");

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
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();

  // Set up message listener
  useEffect(() => {
    if (!slug) {
      logger.warn("No slug provided to useStreamChat hook");
      return;
    }

    logger.info(`Setting up chat listener for stream: ${slug}`);
    setError(null);

    const unsubscribe = listenToMessages(slug, (newMessages) => {
      setMessages(newMessages);
      logger.debug(
        `Received ${newMessages.length} messages for stream: ${slug}`
      );
    });

    return () => {
      logger.debug(`Cleaning up chat listener for stream: ${slug}`);
      unsubscribe();
    };
  }, [slug]);

  // Handle sending messages
  const handleSendMessage = useCallback(
    async (e?: React.FormEvent) => {
      if (e) e.preventDefault();

      if (!newMessage.trim()) {
        logger.debug("Attempted to send empty message, ignoring");
        return;
      }

      if (!currentUser) {
        logger.warn("Attempted to send message without being logged in");
        setError("You must be logged in to send messages");
        return;
      }

      logger.debug(`Sending message to stream: ${slug}`);
      setError(null);

      try {
        await sendChatMessage(
          slug,
          currentUser.username || currentUser.email || "Anonymous",
          newMessage
        );

        logger.debug("Message sent successfully");
        setNewMessage("");
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error sending message";
        logger.error(`Error sending message: ${errorMessage}`, err);
        setError(errorMessage);
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
    error,
  };
};
