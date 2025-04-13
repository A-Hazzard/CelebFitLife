import React from "react";
import { PageContainerProps } from "@/lib/types/ui";

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  description,
  children,
}) => {
  return (
    <div className="container mx-auto px-4 py-6">
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          {description && <p className="text-gray-500 mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};
