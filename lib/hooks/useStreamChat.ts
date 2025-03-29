import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/config/firebase";
import {
  collection,
  query,
  orderBy,
  addDoc,
  onSnapshot,
  serverTimestamp,
  getDocs,
  doc,
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
 * @param streamId - The ID of the stream document containing the messages subcollection
 * @returns Object containing messages, sending functionality, and message input state
 */
export const useStreamChat = (streamId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();
  const retryCount = useRef(0); // Use ref for retry count to avoid re-renders
  const maxRetries = 3;

  // Load and subscribe to messages
  useEffect(() => {
    if (!streamId) {
      console.error("No streamId provided to useStreamChat hook");
      setError("Stream ID is missing, cannot load chat.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    retryCount.current = 0; // Reset retries when streamId changes

    // Reference the messages subcollection within the specific stream document
    const messagesCollectionRef = collection(
      db,
      "streams",
      streamId,
      "messages"
    );
    const q = query(messagesCollectionRef, orderBy("createdAt", "asc"));

    // Initial fetch to handle the case where onSnapshot fails but data exists
    const fetchInitialMessages = async () => {
      console.log(`Fetching initial messages for stream: ${streamId}`);
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
                : new Date().toISOString(), // Fallback for missing timestamp
              sender: data.senderName || "Anonymous",
              message: data.message || "",
              isHost: data.isHost || false,
            });
          });
          console.log(`Fetched ${chatMessages.length} initial messages.`);
          setMessages(chatMessages);
          setIsLoading(false);
          setError(null);
          return true;
        }
        console.log("No initial messages found.");
        return false;
      } catch (err) {
        console.error("Error fetching initial messages:", err);
        return false;
      }
    };

    // Set up listener for real-time updates
    const setupListener = () => {
      console.log(`Setting up snapshot listener for stream: ${streamId}`);
      // Create a listener for real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          console.log(
            `Received snapshot update with ${snapshot.docs.length} messages.`
          );
          const chatMessages: ChatMessage[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            chatMessages.push({
              id: doc.id,
              createdAt: data.createdAt?.toDate?.()
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(), // Fallback
              sender: data.senderName || "Anonymous",
              message: data.message || "",
              isHost: data.isHost || false,
            });
          });
          setMessages(chatMessages);
          setIsLoading(false);
          setError(null); // Clear any previous errors
          retryCount.current = 0; // Reset retry count on success
        },
        async (err) => {
          console.error("Error listening to chat messages:", err);

          // Try to fetch messages directly if listener fails
          const fetchSuccess = await fetchInitialMessages();

          if (!fetchSuccess) {
            if (retryCount.current < maxRetries) {
              // Retry connecting
              retryCount.current += 1;
              console.log(
                `Retrying chat connection (${retryCount.current}/${maxRetries})...`
              );

              // Wait a bit before retrying (exponential backoff)
              const delay = Math.min(1000 * 2 ** retryCount.current, 10000);
              setTimeout(() => {
                setupListener();
              }, delay);
            } else {
              console.error("Max retries reached. Failed to connect to chat.");
              // Only show error if we have no messages cached
              if (messages.length === 0) {
                setError(
                  "Failed to load chat messages. Please try refreshing the page."
                );
              } else {
                console.warn(
                  "Connection to chat lost, but showing cached messages"
                );
                setError(null);
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

    // Clean up the listener on unmount or when streamId changes
    return () => {
      console.log(`Unsubscribing from chat listener for stream: ${streamId}`);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [streamId]); // Re-run effect if streamId changes

  // Send a new message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !currentUser || !streamId) return;

    try {
      setError(null);

      const isHost =
        currentUser.role &&
        (currentUser.role.streamer === true || currentUser.role.admin === true);

      // Add the message to the subcollection
      await addDoc(collection(db, "streams", streamId, "messages"), {
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
  }, [newMessage, streamId, currentUser]);

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
    if (!streamId) return; // Don't retry if no streamId
    setIsLoading(true);
    setError(null);
    retryCount.current = 0; // Reset retry count
    // The useEffect hook will automatically trigger a reconnect attempt due to state change
    // We need to force a state update if streamId hasn't changed, maybe toggle loading briefly?
    // Or better, directly call setupListener if needed (though useEffect handles it)
    console.log("Manual retry requested.");
    // Note: A state change here might be needed if useEffect doesn't re-run
    // For now, relying on isLoading change.
  }, [streamId]);

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
