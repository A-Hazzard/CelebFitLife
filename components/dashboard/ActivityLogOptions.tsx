import React, { useState, useRef } from "react";
import { Trash, ExternalLink, BellOff, MoreVertical } from "lucide-react";
import { useOnClickOutside } from "@/lib/hooks/useOnClickOutside";
import { ActivityLogOptionsProps } from "@/lib/types/dashboard";

export default function ActivityLogOptions({
  onMarkAsRead,
  onDelete,
  onOpenDetails,
}: ActivityLogOptionsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useOnClickOutside(ref, () => setIsOpen(false));

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);

    switch (action) {
      case "markAsRead":
        onMarkAsRead?.();
        break;
      case "delete":
        onDelete?.();
        break;
      case "openDetails":
        onOpenDetails?.();
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        className="p-1 rounded-full hover:bg-gray-700/50 transition-colors focus:outline-none"
        onClick={handleToggle}
        aria-label="Activity options"
      >
        <MoreVertical className="h-4 w-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-gray-800 border border-gray-700 z-50">
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              role="menuitem"
              onClick={(e) => handleAction("markAsRead", e)}
            >
              <BellOff className="h-4 w-4 mr-2 text-gray-400" />
              Mark as read
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              role="menuitem"
              onClick={(e) => handleAction("openDetails", e)}
            >
              <ExternalLink className="h-4 w-4 mr-2 text-gray-400" />
              View details
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center"
              role="menuitem"
              onClick={(e) => handleAction("delete", e)}
            >
              <Trash className="h-4 w-4 mr-2 text-gray-400" />
              Delete notification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
