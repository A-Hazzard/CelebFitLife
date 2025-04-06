import { z } from "zod";
import { CreateStreamFormData } from "@/lib/types/ui";

/**
 * Validates stream title
 * @param title Stream title to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateStreamTitle = (title: string): string => {
  if (!title.trim()) {
    return "Stream title is required";
  }
  if (title.length < 3) {
    return "Stream title must be at least 3 characters";
  }
  if (title.length > 100) {
    return "Stream title must be less than 100 characters";
  }
  return "";
};

/**
 * Validates stream description
 * @param description Stream description to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateStreamDescription = (description: string): string => {
  if (description && description.length > 500) {
    return "Description must be less than 500 characters";
  }
  return "";
};

/**
 * Validates stream category
 * @param category Stream category to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateStreamCategory = (category: string): string => {
  if (!category.trim()) {
    return "Stream category is required";
  }
  return "";
};

/**
 * Validates stream tags
 * @param tags Array of stream tags to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateStreamTags = (tags: string[]): string => {
  if (tags.length > 10) {
    return "Maximum 10 tags allowed";
  }
  return "";
};

/**
 * Validates scheduled time
 * @param isScheduled Whether the stream is scheduled
 * @param scheduledTime Scheduled time to validate
 * @returns Error message if invalid, empty string if valid
 */
export const validateScheduledTime = (
  isScheduled: boolean,
  scheduledTime?: Date
): string => {
  if (isScheduled && !scheduledTime) {
    return "Scheduled time is required";
  }
  if (isScheduled && scheduledTime && scheduledTime < new Date()) {
    return "Scheduled time must be in the future";
  }
  return "";
};

/**
 * Validates the entire stream form data using traditional validation
 * @param data Form data to validate
 * @returns Object with validation errors for each field
 */
export const validateStreamFormLegacy = (
  data: CreateStreamFormData
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const titleError = validateStreamTitle(data.title);
  if (titleError) errors.title = titleError;

  const descriptionError = validateStreamDescription(data.description);
  if (descriptionError) errors.description = descriptionError;

  const categoryError = validateStreamCategory(data.category);
  if (categoryError) errors.category = categoryError;

  const tagsError = validateStreamTags(data.tags);
  if (tagsError) errors.tags = tagsError;

  const scheduledTimeError = validateScheduledTime(
    data.isScheduled,
    data.scheduledTime
  );
  if (scheduledTimeError) errors.scheduledTime = scheduledTimeError;

  return errors;
};

// Type for stream form validation
type StreamFormData = {
  title: string;
  description?: string;
  category?: string;
  language?: string;
  tags?: string[];
  scheduledAt?: Date | null;
};

/**
 * Validates the entire stream form data using Zod schema validation
 * @param data Form data to validate
 * @returns Error message if invalid, null if valid
 */
export function validateStreamForm(data: StreamFormData): string | null {
  try {
    // Define schema
    const streamSchema = z.object({
      title: z
        .string()
        .min(3, "Title must be at least 3 characters")
        .max(100, "Title must be less than 100 characters")
        .refine((val) => val.trim().length > 0, "Title is required"),
      description: z
        .string()
        .max(1000, "Description must be less than 1000 characters")
        .optional(),
      category: z.string().optional(),
      language: z.string().optional(),
      tags: z
        .array(z.string())
        .max(5, "Maximum 5 tags allowed")
        .refine(
          (tags) => {
            // Check if all tags are valid
            return tags.every((tag) => tag.length <= 20 && tag.length > 0);
          },
          { message: "Tags must be between 1 and 20 characters" }
        )
        .refine(
          (tags) => {
            // Check for duplicates
            return new Set(tags).size === tags.length;
          },
          { message: "Duplicate tags are not allowed" }
        )
        .optional(),
      scheduledAt: z
        .date()
        .refine(
          (date) => {
            // If date is provided, it must be in the future
            if (!date) return true;
            return date.getTime() > Date.now();
          },
          { message: "Scheduled date must be in the future" }
        )
        .nullable()
        .optional(),
    });

    // Validate data
    streamSchema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return first error message
      return error.errors[0].message;
    }
    return "Invalid form data";
  }
}

// Type for poll form validation
type PollFormData = {
  question: string;
  options: string[];
  duration: number;
};

// Poll form validation function
export function validatePollForm(data: PollFormData): string | null {
  try {
    // Define schema
    const pollSchema = z.object({
      question: z
        .string()
        .min(5, "Question must be at least 5 characters")
        .max(100, "Question must be less than 100 characters")
        .refine((val) => val.trim().length > 0, "Question is required"),
      options: z
        .array(z.string())
        .min(2, "At least 2 options are required")
        .max(5, "Maximum 5 options allowed")
        .refine(
          (options) => {
            // Check if all options are valid
            return options.every((option) => option.trim().length > 0);
          },
          { message: "All options must be filled" }
        )
        .refine(
          (options) => {
            // Check for duplicates
            const normalized = options.map((opt) => opt.trim().toLowerCase());
            return new Set(normalized).size === options.length;
          },
          { message: "Duplicate options are not allowed" }
        ),
      duration: z
        .number()
        .min(15, "Duration must be at least 15 seconds")
        .max(300, "Duration must be less than 5 minutes"),
    });

    // Validate data
    pollSchema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return first error message
      return error.errors[0].message;
    }
    return "Invalid form data";
  }
}

// Type for chat message validation
type ChatMessageData = {
  message: string;
};

// Chat message validation function
export function validateChatMessage(data: ChatMessageData): string | null {
  try {
    // Define schema
    const messageSchema = z.object({
      message: z
        .string()
        .min(1, "Message cannot be empty")
        .max(200, "Message must be less than 200 characters")
        .refine((val) => val.trim().length > 0, "Message cannot be empty"),
    });

    // Validate data
    messageSchema.parse(data);
    return null;
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Return first error message
      return error.errors[0].message;
    }
    return "Invalid message";
  }
}
