import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase/client";
import {
  collection,
  query,
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
 * @param streamId - The ID of the stream document containing the messages subcollection
 * @returns Object containing messages, sending functionality, and message input state
 */
export const useStreamChat = (streamId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuthStore();
  const retryCount = useRef(0);
  const maxRetries = 3;
  const unsubscribeRef = useRef<(() => void) | null>(null); // Ref to hold unsubscribe function
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Define fetchInitialMessages outside useEffect but use useCallback if needed elsewhere
  const fetchInitialMessages = useCallback(async () => {
    if (!streamId) return false;
    console.log(`Fetching initial messages for stream: ${streamId}`);
    try {
      const messagesCollectionRef = collection(
        db,
        "streams",
        streamId,
        "messages"
      );
      const q = query(messagesCollectionRef, orderBy("createdAt", "asc"));
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
        console.log(`Fetched ${chatMessages.length} initial messages.`);
        setMessages(chatMessages); // Update state
        return true;
      }
      console.log("No initial messages found.");
      setMessages([]); // Clear messages if none found
      return false;
    } catch (err) {
      console.error("Error fetching initial messages:", err);
      return false;
    }
  }, [streamId]);

  // Define setupListener outside useEffect, use useCallback for stable reference
  const setupListener = useCallback(() => {
    if (!streamId) return;
    console.log(`Setting up snapshot listener for stream: ${streamId}`);

    // Clean up previous listener before starting a new one
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
      console.log("Cleaned up previous listener.");
    }

    const messagesCollectionRef = collection(
      db,
      "streams",
      streamId,
      "messages"
    );
    const q = query(messagesCollectionRef, orderBy("createdAt", "asc"));

    const newUnsubscribe = onSnapshot(
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
              : new Date().toISOString(),
            sender: data.senderName || "Anonymous",
            message: data.message || "",
            isHost: data.isHost || false,
          });
        });
        setMessages(chatMessages);
        setIsLoading(false); // Got messages, stop loading
        setError(null); // Clear errors on success
        retryCount.current = 0; // Reset retries on success
      },
      async (err) => {
        console.error("Error in snapshot listener:", err);
        setIsLoading(false); // Stop loading on error

        // If listener fails, check if we have *any* messages (maybe from initial fetch)
        if (messages.length === 0) {
          if (retryCount.current < maxRetries) {
            retryCount.current += 1;
            const delay = Math.min(1000 * 2 ** retryCount.current, 10000);
            console.log(
              `Retrying listener setup (${
                retryCount.current
              }/${maxRetries}) in ${delay / 1000}s...`
            );
            setTimeout(setupListener, delay); // Retry setupListener itself
          } else {
            console.error("Max retries reached. Failed to connect listener.");
            setError(
              "Failed to connect to real-time chat. Check connection or refresh."
            );
          }
        } else {
          // We have messages (likely initial fetch worked), but listener failed.
          console.warn(
            "Real-time chat listener failed, showing potentially stale messages."
          );
          // Don't set error state here, as we have some data
          setError(null);
        }
      }
    );

    unsubscribeRef.current = newUnsubscribe; // Store the new unsubscribe function
    console.log("New listener attached.");
  }, [streamId, messages.length]); // Dependency array for useCallback

  // Main effect for initialization and cleanup
  useEffect(() => {
    if (!streamId) {
      setError("Stream ID missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    retryCount.current = 0;

    const initialize = async () => {
      const fetched = await fetchInitialMessages();
      setIsLoading(false); // Initial fetch is done, loading stops unless listener fails later
      if (!fetched && messages.length === 0) {
        // Only set error if fetch failed AND we have no prior messages
        // setError("Failed to fetch initial messages."); // Optional: more specific error?
      }
      // Always setup listener regardless of initial fetch result
      setupListener();
    };

    initialize();

    // Cleanup function for when the component unmounts or streamId changes
    return () => {
      if (unsubscribeRef.current) {
        console.log(`Unsubscribing from chat listener on cleanup: ${streamId}`);
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [streamId, fetchInitialMessages, setupListener, messages.length]); // Dependencies

  // Manual retry
  const retryConnection = useCallback(() => {
    if (!streamId) return;
    console.log("Manual retry requested.");
    setIsLoading(true); // Indicate loading during retry
    setError(null);
    retryCount.current = 0; // Reset retries
    fetchInitialMessages().then((fetched) => {
      if (!fetched && messages.length === 0) {
        // setError("Retry: Failed initial fetch."); // Optional
      }
      // Always re-setup listener on retry
      setupListener();
      // Loading state will be handled by the listener/fetch results
    });
  }, [streamId, fetchInitialMessages, setupListener, messages.length]);

  // Send a new message - Ensure correct path and fields
  const sendMessage = useCallback(async () => {
    // Ensure all required data is present
    if (!newMessage.trim() || !currentUser || !streamId) {
      console.warn("Cannot send message: Missing data", {
        hasMessage: !!newMessage.trim(),
        hasUser: !!currentUser,
        hasStreamId: !!streamId,
      });
      return;
    }

    try {
      setError(null);

      const isHost =
        currentUser.role &&
        (currentUser.role.streamer === true || currentUser.role.admin === true);

      const senderName =
        currentUser.username || currentUser.email?.split("@")[0] || "Anonymous";

      // Log before sending
      console.log(`Sending message to streams/${streamId}/messages:`, {
        senderId: currentUser.uid,
        senderName: senderName,
        message: newMessage.trim(),
        isHost: isHost || false,
      });

      // Reference the correct subcollection path
      const messagesCollectionRef = collection(
        db,
        "streams",
        streamId,
        "messages"
      );

      // Add the message document
      await addDoc(messagesCollectionRef, {
        senderId: currentUser.uid,
        senderName: senderName,
        message: newMessage.trim(),
        isHost: isHost || false,
        createdAt: serverTimestamp(), // Use server timestamp for consistency
      });

      console.log("Message sent successfully.");
      setNewMessage(""); // Clear input after successful send
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

  // Add an effect to scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

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
    scrollRef,
  };
};
