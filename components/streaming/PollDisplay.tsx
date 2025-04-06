"use client";

import React, { useState, useEffect } from "react";
import { Poll, PollOption } from "@/lib/types/ui";
import { BarChart, Timer, CheckSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  collection,
  query,
  onSnapshot,
  doc,
  updateDoc,
  orderBy,
  getDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";

type PollDisplayProps = {
  streamId: string;
  isStreamer: boolean;
  className?: string;
};

const PollDisplay: React.FC<PollDisplayProps> = ({
  streamId,
  isStreamer = false,
  className = "",
}) => {
  const { currentUser } = useAuthStore();
  const [activePolls, setActivePolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!streamId) {
      setLoading(false);
      return;
    }

    // Load voted polls from localStorage
    const loadVotedPolls = () => {
      try {
        const saved = localStorage.getItem(`stream_${streamId}_voted_polls`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setVotedPolls(parsed);
        }
      } catch (err) {
        console.error("Error loading voted polls:", err);
      }
    };

    loadVotedPolls();

    // Set up listener for active polls
    const pollsRef = collection(db, "polls");
    const pollsQuery = query(pollsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      pollsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setActivePolls([]);
          setLoading(false);
          return;
        }

        const now = Timestamp.now();
        const polls: Poll[] = [];

        snapshot.forEach((doc) => {
          const pollData = doc.data() as Omit<Poll, "id">;

          // Only include polls for this stream
          if (pollData.streamId === streamId) {
            // Filter for active polls that haven't expired
            if (
              pollData.isActive &&
              (!pollData.endTime ||
                pollData.endTime.toMillis() > now.toMillis())
            ) {
              polls.push({
                id: doc.id,
                ...pollData,
              } as Poll);
            }
          }
        });

        setActivePolls(polls);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching polls:", err);
        setError("Failed to load polls. Please try again later.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [streamId]);

  // Update time left for each poll
  useEffect(() => {
    if (activePolls.length === 0) return;

    const interval = setInterval(() => {
      const newTimeLeft: Record<string, string> = {};
      const now = new Date();

      activePolls.forEach((poll) => {
        if (poll.endTime) {
          const expiryDate = poll.endTime.toDate();
          if (expiryDate > now) {
            newTimeLeft[poll.id] = formatDistanceToNow(expiryDate, {
              addSuffix: false,
            });
          } else {
            newTimeLeft[poll.id] = "Ended";
          }
        } else {
          newTimeLeft[poll.id] = "No limit";
        }
      });

      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(interval);
  }, [activePolls]);

  const handleVote = async (pollId: string, optionId: string) => {
    if (!currentUser) {
      toast.error("You need to be logged in to vote");
      return;
    }

    if (votedPolls[pollId]) {
      toast.error("You've already voted in this poll");
      return;
    }

    try {
      // Get the current poll data
      const pollRef = doc(db, "polls", pollId);
      const pollDoc = await getDoc(pollRef);

      if (!pollDoc.exists()) {
        toast.error("Poll not found");
        return;
      }

      const pollData = pollDoc.data() as Poll;

      // Update the votes for the selected option
      const updatedOptions = pollData.options.map((option) => {
        if (option.text === optionId) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });

      // Update the poll in Firestore
      await updateDoc(pollRef, {
        options: updatedOptions,
        totalVotes: (pollData.totalVotes || 0) + 1,
      });

      // Save the voted poll to localStorage
      const newVotedPolls = { ...votedPolls, [pollId]: optionId };
      localStorage.setItem(
        `stream_${streamId}_voted_polls`,
        JSON.stringify(newVotedPolls)
      );
      setVotedPolls(newVotedPolls);

      toast.success("Vote recorded successfully");
    } catch (error) {
      console.error("Error voting:", error);
      toast.error("Failed to record your vote");
    }
  };

  const endPoll = async (pollId: string) => {
    if (!isStreamer) return;

    try {
      const pollRef = doc(db, "polls", pollId);
      await updateDoc(pollRef, {
        isActive: false,
      });

      toast.success("Poll ended successfully");
    } catch (error) {
      console.error("Error ending poll:", error);
      toast.error("Failed to end poll");
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
        <div className="text-red-400 text-center py-6">
          <AlertCircle className="w-12 h-12 mx-auto opacity-50 mb-2 text-red-400" />
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4 bg-transparent border-gray-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (activePolls.length === 0) {
    return (
      <div
        className={`p-4 bg-gray-900 rounded-lg border border-gray-800 ${className}`}
      >
        <div className="text-center py-8 text-gray-400">
          <BarChart className="w-12 h-12 mx-auto opacity-30 mb-4" />
          <p className="text-lg">
            {isStreamer ? "No active polls" : "No polls available"}
          </p>
          {isStreamer && (
            <p className="text-sm mt-2 text-gray-500">
              Create a poll using the button above to engage with your audience
            </p>
          )}
        </div>
      </div>
    );
  }

  // Calculate total votes for percentage display
  const getTotalVotes = (options: PollOption[]): number => {
    return options.reduce((total, option) => total + option.votes, 0);
  };

  // Get vote percentage for an option
  const getVotePercentage = (votes: number, totalVotes: number): number => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {activePolls.map((poll) => {
        const totalVotes = getTotalVotes(poll.options);
        const hasVoted = !!votedPolls[poll.id];
        const userVote = votedPolls[poll.id];

        return (
          <div
            key={poll.id}
            className="bg-gray-900 rounded-lg p-4 border border-gray-800"
          >
            <div className="mb-3 flex justify-between items-start">
              <h3 className="font-medium text-lg text-white">
                {poll.question}
              </h3>
              <div className="flex items-center text-xs text-gray-400">
                <Timer className="w-3.5 h-3.5 mr-1" />
                {timeLeft[poll.id] || "Calculating..."}
              </div>
            </div>

            <div className="space-y-3">
              {poll.options.map((option) => {
                const percentage = getVotePercentage(option.votes, totalVotes);
                const isVoted = userVote === option.text;

                return (
                  <div key={option.text}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="flex-1">
                        <span
                          className={`${
                            isVoted
                              ? "text-brandOrange font-medium"
                              : "text-white"
                          }`}
                        >
                          {option.text}
                          {isVoted && (
                            <CheckSquare className="w-3.5 h-3.5 inline-block ml-1.5 mb-0.5" />
                          )}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {option.votes} {option.votes === 1 ? "vote" : "votes"} (
                        {percentage}%)
                      </span>
                    </div>

                    <div className="relative w-full h-7">
                      <div className="absolute inset-0 bg-gray-800 rounded"></div>
                      <div
                        className={`absolute top-0 left-0 h-full rounded ${
                          isVoted
                            ? "bg-brandOrange bg-opacity-30"
                            : "bg-gray-700 bg-opacity-30"
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                      {!hasVoted && !isStreamer && (
                        <button
                          className="absolute inset-0 hover:bg-gray-700 hover:bg-opacity-30 rounded flex items-center justify-center text-sm text-gray-300 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() => handleVote(poll.id, option.text)}
                        >
                          Click to vote
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                {totalVotes} {totalVotes === 1 ? "vote" : "votes"} total
              </div>

              {isStreamer && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-xs bg-red-700 hover:bg-red-800 text-white"
                  onClick={() => endPoll(poll.id)}
                >
                  End Poll
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default PollDisplay;
