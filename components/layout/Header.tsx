import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-brandBlack border-b border-brandGray p-4 flex items-center justify-between">
      <div className="w-1/3"></div>

      {/* Centered Search Bar */}
      <div className="w-1/3 flex justify-center">
        <Input
          type="text"
          placeholder="Search streamers..."
          className="bg-brandGray text-brandWhite placeholder-brandGray rounded-full px-4 py-2 w-full max-w-md"
        />
      </div>

      {/* User Profile Dropdown */}
      <div className="w-1/3 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Avatar>
              <AvatarImage src="/path/to/profile.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent>
            <DropdownMenuItem>
              <Link href="/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Log Out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
