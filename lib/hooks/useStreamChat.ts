import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/config/firebase";
import {
  collection,
  query,
  where,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store/useAuthStore";

export interface ChatMessage {
  id: string;
  createdAt: string;
  sender: string;
  message: string;
  isHost: boolean;
}

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();

  // Load and subscribe to messages
  useEffect(() => {
    if (!slug) {
      console.error("No slug provided to useStreamChat hook");
      return;
    }

    setIsLoading(true);
    setError(null);

    // Create a query against the stream_chat collection
    const chatRef = collection(db, "stream_chat");
    const q = query(
      chatRef,
      where("streamSlug", "==", slug),
      orderBy("createdAt", "asc")
    );

    // Create a listener for real-time updates
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const chatMessages: ChatMessage[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          chatMessages.push({
            id: doc.id,
            createdAt: data.createdAt?.toDate?.()
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString(),
            sender: data.senderName || "Anonymous",
            message: data.message || "",
            isHost: data.isHost || false,
          });
        });
        setMessages(chatMessages);
        setIsLoading(false);
      },
      (err) => {
        console.error("Error listening to chat messages:", err);
        setError(
          "Failed to load chat messages. Please try refreshing the page."
        );
        setIsLoading(false);
      }
    );

    // Clean up the listener on unmount
    return () => {
      unsubscribe();
    };
  }, [slug]);

  // Send a new message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      setError(null);

      // Check if user is host or admin
      const isHost =
        currentUser.role &&
        (currentUser.role.streamer === true || currentUser.role.admin === true);

      // Add a new document to the stream_chat collection
      await addDoc(collection(db, "stream_chat"), {
        streamSlug: slug,
        senderId: currentUser.uid,
        senderName:
          currentUser.username ||
          currentUser.email?.split("@")[0] ||
          "Anonymous",
        message: newMessage.trim(),
        isHost: isHost || false,
        createdAt: serverTimestamp(),
      });

      setNewMessage("");
    } catch (err) {
      console.error("Error sending chat message:", err);
      setError("Failed to send your message. Please try again.");
    }
  }, [newMessage, slug, currentUser]);

  // Handle form submission
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      sendMessage();
    },
    [sendMessage]
  );

  // Handle enter key press
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    handleSubmit,
    handleKeyPress,
    isLoading,
    error,
  };
};
