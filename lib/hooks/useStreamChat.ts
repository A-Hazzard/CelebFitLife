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
  getDocs,
} from "firebase/firestore";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { toast } from "sonner";

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
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

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

    // Initial fetch to handle the case where onSnapshot fails but data exists
    const fetchInitialMessages = async () => {
      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const chatMessages: ChatMessage[] = [];
          querySnapshot.forEach((doc) => {
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
          setError(null);
          return true;
        }
        return false;
      } catch (err) {
        console.error("Error fetching initial messages:", err);
        return false;
      }
    };

    // Set up listener for real-time updates
    const setupListener = () => {
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
          setError(null); // Clear any previous errors
          setRetryCount(0); // Reset retry count on success
        },
        async (err) => {
          console.error("Error listening to chat messages:", err);

          // Try to fetch messages directly if listener fails
          const fetchSuccess = await fetchInitialMessages();

          if (!fetchSuccess) {
            if (retryCount < maxRetries) {
              // Retry connecting
              setRetryCount((prev) => prev + 1);
              console.log(
                `Retrying chat connection (${retryCount + 1}/${maxRetries})...`
              );

              // Wait a bit before retrying
              setTimeout(() => {
                setupListener();
              }, 2000);
            } else {
              // Don't set error if we have messages already cached
              if (messages.length === 0) {
                setError(
                  "Failed to load chat messages. Please try refreshing the page."
                );
              }
              setIsLoading(false);
            }
          }
        }
      );

      return unsubscribe;
    };

    // Start the listener
    const unsubscribe = setupListener();

    // Clean up the listener on unmount
    return () => {
      unsubscribe();
    };
  }, [slug, retryCount]);

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
      toast.error("Failed to send message. Please try again.");
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

  // Manual retry function that users can call
  const retryConnection = useCallback(() => {
    setIsLoading(true);
    setError(null);
    setRetryCount(0); // Reset retry count to trigger useEffect
  }, []);

  return {
    messages,
    newMessage,
    setNewMessage,
    sendMessage,
    handleSubmit,
    handleKeyPress,
    isLoading,
    error,
    retryConnection,
  };
};
