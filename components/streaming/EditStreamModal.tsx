"use client";

import React, { useState, useEffect } from "react";
import { AlertCircle, Hash } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "sonner";
import { EditStreamFormData } from "@/lib/types/ui";
import { StreamData } from "@/lib/types/streaming.types";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Category, fetchCategoriesWithTags } from "@/lib/store/categoriesStore";
import { languages } from "@/lib/data/languages";
import { validateStreamForm } from "@/lib/utils/validation";
import { tagCategories } from "@/lib/data/tags";
import Image from "next/image";

type EditStreamModalProps = {
  isOpen: boolean;
  onClose: () => void;
  stream: StreamData;
  onSuccess?: () => void;
};

// Remove the unused Tag type

const EditStreamModal: React.FC<EditStreamModalProps> = ({
  isOpen,
  onClose,
  stream,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [title, setTitle] = useState(stream.title || "");
  const [description, setDescription] = useState(stream.description || "");
  const [category, setCategory] = useState(stream.category || "Fitness");
  const [language, setLanguage] = useState("en");
  const [tagInput, setTagInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState<EditStreamFormData>({
    title: stream.title || "",
    description: stream.description || "",
    thumbnail: stream.thumbnail || "",
    category: stream.category || "",
    tags: stream.tags || [],
  });

  useEffect(() => {
    // Update form data when stream prop changes
    setFormData({
      title: stream.title || "",
      description: stream.description || "",
      thumbnail: stream.thumbnail || "",
      category: stream.category || "",
      tags: stream.tags || [],
    });
  }, [stream]);

  useEffect(() => {
    const loadCategoriesAndTags = async () => {
      try {
        const result = await fetchCategoriesWithTags();
        if (result.success) {
          setCategories(result.categoriesWithTags);
        }
      } catch (error) {
        console.error("Error loading categories and tags:", error);
        toast.error("Failed to load categories and tags");
      }
    };

    loadCategoriesAndTags();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagName: string) => {
    setFormData((prev) => {
      const newTags = prev.tags?.includes(tagName)
        ? prev.tags.filter((t) => t !== tagName)
        : [...(prev.tags || []), tagName];

      return { ...prev, tags: newTags };
    });
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      addTag(tagInput.trim());
    }
  };

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();

    if (!normalizedTag) return;

    // Prevent duplicates
    if (formData.tags?.includes(normalizedTag)) {
      toast.error("Tag already exists");
      return;
    }

    // Limit number of tags
    if ((formData.tags ?? []).length >= 5) {
      toast.error("Maximum 5 tags allowed");
      return;
    }

    // Limit tag length
    if (normalizedTag.length > 20) {
      toast.error("Tags must be less than 20 characters");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      tags: [...(prev.tags || []), normalizedTag],
    }));
    setTagInput("");
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags?.filter((tag) => tag !== tagToRemove) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the form
    const validationError = validateStreamForm({
      title,
      description,
      category,
      language,
      tags: formData.tags || [],
    });

    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const streamRef = doc(db, "streams", stream.id);

      await updateDoc(streamRef, {
        title: title.trim(),
        description: description.trim(),
        category,
        language,
        tags: formData.tags || [],
        lastUpdated: serverTimestamp(),
      });

      toast.success("Stream updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Error updating stream:", error);
      toast.error("Failed to update stream");
      setFormError("An error occurred while updating the stream");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = !stream.hasEnded;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-brandBlack border-gray-800 text-brandWhite max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl text-brandOrange font-bold">
            Edit Stream Information
          </DialogTitle>
        </DialogHeader>

        {!canEdit ? (
          <div className="bg-yellow-500/20 text-yellow-400 p-3 rounded-md flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
            <p>You cannot edit a stream that has ended.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {formError && (
              <div className="bg-red-500/20 text-red-400 p-3 rounded-md flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
                <p>{formError}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="text-brandWhite">
                Stream Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter your stream title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-brandWhite">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your stream..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-brandWhite">
                Category
              </Label>
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                }}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  {categories.map((category) => (
                    <SelectItem key={category.name} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language" className="text-brandWhite">
                Language
              </Label>
              <Select
                value={language}
                onValueChange={(value) => {
                  setLanguage(value);
                }}
              >
                <SelectTrigger className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700 text-white">
                  {Object.entries(languages).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags" className="text-brandWhite">
                Tags (up to 5)
              </Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags?.map((tag) => (
                  <div
                    key={tag}
                    className="bg-brandOrange/20 text-brandOrange px-2 py-1 rounded-full text-sm flex items-center"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-brandOrange hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex">
                <Input
                  id="tagInput"
                  placeholder="Add a tag and press Enter"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange"
                  disabled={(formData.tags ?? []).length >= 5}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="ml-2 bg-transparent border-gray-700"
                  onClick={() => addTag(tagInput)}
                  disabled={
                    tagInput.trim() === "" || (formData.tags ?? []).length >= 5
                  }
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Recommended Tags Section */}
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Recommended Tags</h3>
              <div className="space-y-3">
                {tagCategories.map((category) => (
                  <div key={category.name}>
                    <h4 className="text-xs text-gray-400 mb-1">
                      {category.name}
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {category.tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          disabled={
                            (formData.tags ?? []).length >= 5 &&
                            !(formData.tags ?? []).includes(tag)
                          }
                          className={`text-xs px-2 py-1 rounded-full flex items-center ${
                            formData.tags?.includes(tag)
                              ? "bg-brandOrange/20 text-brandOrange"
                              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                          } ${
                            (formData.tags ?? []).length >= 5 &&
                            !(formData.tags ?? []).includes(tag)
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <Hash size={10} className="mr-1" />
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="thumbnail" className="text-brandWhite">
                Thumbnail URL
              </Label>
              <Input
                id="thumbnail"
                name="thumbnail"
                placeholder="Enter thumbnail URL (optional)"
                value={formData.thumbnail}
                onChange={handleInputChange}
                className="bg-gray-900 border-gray-700 text-white focus:border-brandOrange"
              />
              {formData.thumbnail && (
                <div className="relative w-full aspect-video rounded-md overflow-hidden mt-2 border border-gray-700">
                  <Image
                    src={formData.thumbnail}
                    alt="Stream thumbnail preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="bg-transparent border-gray-700 text-white hover:bg-gray-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-brandOrange hover:bg-brandOrange/90 text-brandBlack"
              >
                {isSubmitting ? "Updating..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditStreamModal;
