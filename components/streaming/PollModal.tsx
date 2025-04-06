"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, X, Check, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Poll, PollOption } from "@/lib/types/ui";
import { v4 as uuidv4 } from "uuid";
import {
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/config/firebase";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PollModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stream: { id: string };
};

const PollModal: React.FC<PollModalProps> = ({ isOpen, onClose, stream }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [pollDuration, setPollDuration] = useState("60");
  const [formError, setFormError] = useState<string | null>(null);

  const addPollOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    } else {
      toast.error("Maximum 5 options allowed");
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    } else {
      toast.error("Minimum 2 options required");
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const validatePoll = (): boolean => {
    if (!pollQuestion.trim()) {
      setFormError("Poll question is required");
      return false;
    }

    if (pollOptions.some((option) => !option.trim())) {
      setFormError("All poll options must be filled");
      return false;
    }

    const uniqueOptions = new Set(pollOptions.map((opt) => opt.trim()));
    if (uniqueOptions.size !== pollOptions.length) {
      setFormError("All poll options must be unique");
      return false;
    }

    const durationNum = parseInt(pollDuration);
    if (isNaN(durationNum) || durationNum < 15 || durationNum > 300) {
      setFormError("Duration must be between 15 and 300 seconds");
      return false;
    }

    setFormError(null);
    return true;
  };

  const createPoll = async () => {
    if (!validatePoll()) return;
    if (!stream.id) {
      toast.error("Stream ID is missing");
      return;
    }

    setIsSubmitting(true);

    try {
      const options: PollOption[] = pollOptions.map((text) => ({
        id: uuidv4(),
        text: text.trim(),
        votes: 0,
      }));

      const now = new Date();
      const expiryTime = new Date(
        now.getTime() + parseInt(pollDuration) * 1000
      );

      const pollData: Omit<Poll, "id"> = {
        question: pollQuestion.trim(),
        options,
        createdAt: serverTimestamp() as Timestamp,
        expiresAt: Timestamp.fromDate(expiryTime),
        isActive: true,
        streamId: stream.id,
      };

      await addDoc(collection(db, `streams/${stream.id}/polls`), pollData);

      toast.success("Poll created successfully");
      resetForm();
      onClose();
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
      setFormError("An error occurred while creating the poll");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollDuration("60");
    setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-brandBlack border-gray-800 text-brandWhite max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-brandOrange font-bold">
            Create Poll
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {formError && (
            <div className="bg-red-500/20 text-red-400 p-3 rounded-md flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{formError}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="question" className="text-brandWhite">
              Poll Question <span className="text-red-500">*</span>
            </Label>
            <Input
              id="question"
              placeholder="Ask your audience something..."
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange"
            />
          </div>

          <div className="space-y-3">
            <Label className="text-brandWhite">
              Poll Options <span className="text-red-500">*</span>
            </Label>
            {pollOptions.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-gray-400 hover:text-red-400"
                  onClick={() => removePollOption(index)}
                  disabled={pollOptions.length <= 2}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-brandOrange"
              onClick={addPollOption}
              disabled={pollOptions.length >= 5}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Option
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration" className="text-brandWhite">
              Poll Duration (seconds)
            </Label>
            <Select
              value={pollDuration}
              onValueChange={(value) => setPollDuration(value)}
            >
              <SelectTrigger className="bg-gray-900 border-gray-700">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="30">30 seconds</SelectItem>
                <SelectItem value="60">1 minute</SelectItem>
                <SelectItem value="120">2 minutes</SelectItem>
                <SelectItem value="180">3 minutes</SelectItem>
                <SelectItem value="300">5 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button
            variant="default"
            onClick={createPoll}
            disabled={isSubmitting}
            className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack font-medium"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-t-current border-current border-opacity-30 rounded-full"></div>
                Creating...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Create Poll
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PollModal;
