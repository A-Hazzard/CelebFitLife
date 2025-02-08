import { useState, ReactNode, Children } from "react";

interface DropdownProps {
  children: ReactNode;
}

export function DropdownMenu({ children }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const childArray = Children.toArray(children); // Ensures `children` is an array

  return (
    <div className="relative inline-block text-left">
      <div onClick={() => setIsOpen(!isOpen)}>{childArray[0]}</div> 

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-brandBlack border border-brandGray rounded-lg shadow-lg">
          {childArray.slice(1)}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuTrigger({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuContent({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export function DropdownMenuItem({ children }: { children: ReactNode }) {
  return <div className="px-4 py-2 hover:bg-brandGray cursor-pointer">{children}</div>;
}
