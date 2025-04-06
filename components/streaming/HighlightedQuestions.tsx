"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { HighlightedQuestion } from "@/lib/types/ui";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, Trash } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

type HighlightedQuestionsProps = {
  streamId: string;
  isStreamer: boolean;
  className?: string;
};

export const HighlightedQuestions: React.FC<HighlightedQuestionsProps> = ({
  streamId,
  isStreamer,
  className = "",
}) => {
  const [questions, setQuestions] = useState<HighlightedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!streamId) {
      setLoading(false);
      return;
    }

    // Set up listener for questions - using a simpler query that doesn't require a compound index
    const questionsRef = collection(db, `streams/${streamId}/questions`);
    // Just order by timestamp - we'll sort by highlighted in memory
    const questionsQuery = query(questionsRef, orderBy("timestamp", "desc"));

    const unsubscribe = onSnapshot(
      questionsQuery,
      (snapshot) => {
        const questionsList: HighlightedQuestion[] = [];
        snapshot.forEach((doc) => {
          questionsList.push({
            id: doc.id,
            ...(doc.data() as Omit<HighlightedQuestion, "id">),
          });
        });

        // Sort questions in memory - highlighted ones first, then by timestamp
        const sortedQuestions = questionsList.sort((a, b) => {
          // First sort by highlighted status (highlighted first)
          if (a.highlighted && !b.highlighted) return -1;
          if (!a.highlighted && b.highlighted) return 1;

          // Then sort by timestamp (newest first)
          const aTime = a.timestamp?.toMillis() || 0;
          const bTime = b.timestamp?.toMillis() || 0;
          return bTime - aTime;
        });

        setQuestions(sortedQuestions);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching questions:", err);
        setError("No questions available. Please try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [streamId]);

  const handleHighlight = async (
    questionId: string,
    isHighlighted: boolean
  ) => {
    if (!isStreamer) return;

    try {
      const questionRef = doc(
        db,
        `streams/${streamId}/questions/${questionId}`
      );
      await updateDoc(questionRef, {
        highlighted: !isHighlighted,
      });

      toast.success(
        !isHighlighted
          ? "Question highlighted successfully"
          : "Question unhighlighted"
      );
    } catch (error) {
      console.error("Error highlighting question:", error);
      toast.error("Failed to update question");
    }
  };

  const handleDelete = async (questionId: string) => {
    if (!isStreamer) return;

    try {
      const questionRef = doc(
        db,
        `streams/${streamId}/questions/${questionId}`
      );
      await deleteDoc(questionRef);

      toast.success("Question deleted successfully");
    } catch (error) {
      console.error("Error deleting question:", error);
      toast.error("Failed to delete question");
    }
  };

  if (loading) {
    return (
      <div className={`p-4 bg-gray-900 rounded-lg ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin w-8 h-8 border-2 border-brandOrange border-opacity-50 border-t-brandOrange rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-4 bg-gray-900 rounded-lg ${className}`}>
        <div className="text-center py-6 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto opacity-30 mb-4" />
          <p className="text-lg">
            {isStreamer ? "No questions yet" : "No questions available"}
          </p>
          {!isStreamer && (
            <p className="text-sm mt-2 text-gray-500">
              Ask a question in the chat using /question command
            </p>
          )}
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div
        className={`p-4 bg-gray-900 rounded-lg border border-gray-800 ${className}`}
      >
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto opacity-30 mb-4" />
          <p className="text-lg">
            {isStreamer ? "No questions yet" : "No questions available"}
          </p>
          {!isStreamer && (
            <p className="text-sm mt-2 text-gray-500">
              Ask a question in the chat using /question command
            </p>
          )}
        </div>
      </div>
    );
  }

  // Filter for viewer - only show highlighted questions
  const visibleQuestions = isStreamer
    ? questions
    : questions.filter((q) => q.highlighted);

  if (!isStreamer && visibleQuestions.length === 0) {
    return (
      <div
        className={`p-4 bg-gray-900 rounded-lg border border-gray-800 ${className}`}
      >
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto opacity-30 mb-4" />
          <p className="text-lg">No highlighted questions yet</p>
          <p className="text-sm mt-2 text-gray-500">
            Ask a question in the chat using /question command
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="font-medium text-lg text-white mb-3">
        {isStreamer ? "Questions" : "Highlighted Questions"}
      </h3>

      {visibleQuestions.map((question) => (
        <div
          key={question.id}
          className={`bg-gray-900 rounded-lg p-4 border ${
            question.highlighted
              ? "border-brandOrange/40 bg-gradient-to-r from-gray-900 to-brandOrange/10"
              : "border-gray-800"
          }`}
        >
          <div className="flex items-start gap-3">
            {question.avatarUrl ? (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 relative">
                <Image
                  src={question.avatarUrl}
                  alt={question.username}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://ui-avatars.com/api/?name=" + question.username;
                  }}
                />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium">
                  {question.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span
                  className={`font-medium ${
                    question.highlighted ? "text-brandOrange" : "text-white"
                  }`}
                >
                  {question.username}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(question.timestamp.toDate(), {
                    addSuffix: true,
                  })}
                </span>
              </div>

              <p className="text-gray-300 mt-1 break-words">
                {question.question}
              </p>
            </div>
          </div>

          {isStreamer && (
            <div className="flex justify-end mt-3 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-transparent hover:bg-gray-800"
                onClick={() =>
                  handleHighlight(question.id, question.highlighted)
                }
              >
                {question.highlighted ? (
                  <>
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5" />
                    Unhighlight
                  </>
                ) : (
                  <>
                    <ThumbsUp className="w-3.5 h-3.5 mr-1.5 text-yellow-400" />
                    Highlight
                  </>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs bg-transparent hover:bg-red-900/30"
                onClick={() => handleDelete(question.id)}
              >
                <Trash className="w-3.5 h-3.5 mr-1.5 text-red-400" />
                Delete
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HighlightedQuestions;
