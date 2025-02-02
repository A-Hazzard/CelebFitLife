'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import StreamGrid from '@/components/streaming/StreamGrid';

export default function StreamingPage() {
  // Array of 10 iframes for testing
  const iframes = Array(10).fill(
    <iframe
      width="560"
      height="215"
      src="https://www.youtube.com/embed/zoeoIdLQxnM?si=x9T7lZZy76GUOp0N"
      title="YouTube video player"
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    ></iframe>
  );

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite">
      <Header />
      <div className="flex flex-col md:flex-row">
        <Sidebar />
        <div className="flex-1 p-6 flex justify-center">
          <div className="w-full ">
            <h1 className="text-3xl font-edo text-brandOrange mb-6 text-center">Live Streams</h1>
            <StreamGrid iframes={iframes} />
          </div>
        </div>
      </div>
    </div>
  );
}