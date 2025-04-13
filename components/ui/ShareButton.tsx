"use client";

import React, { useState, useEffect, useRef } from "react";
import { Share, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ShareButtonProps } from "@/lib/types/ui";

export default function ShareButton({ streamLink }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(streamLink);
      setCopied(true);
      setIsOpen(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 bg-brandGray rounded-full hover:bg-brandOrange transition-colors duration-300"
      >
        <Share size={20} className="text-brandBlack" />
      </button>
      {isOpen && (
        <div
          className={cn(
            // Position the popup to the left of the share button
            "absolute top-0 right-full mr-2 z-50 bg-brandWhite text-brandBlack rounded shadow-lg p-4 flex items-center space-x-2 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )}
          style={{ minWidth: "250px" }}
        >
          <span className="text-sm break-all flex-1">{streamLink}</span>
          <button
            onClick={handleCopy}
            className="p-1 bg-brandOrange rounded-full hover:bg-brandWhite transition-colors duration-300"
          >
            <Copy size={16} className="text-white" />
          </button>
          {copied && (
            <span className="text-xs text-brandOrange font-semibold">
              Copied!
            </span>
          )}
        </div>
      )}
    </div>
  );
}
