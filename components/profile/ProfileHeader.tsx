import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function ProfileHeader() {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <Avatar>
              <AvatarImage src="/path/to/profile.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
      <h1 className="text-3xl font-edo text-brandOrange mt-4">John Doe</h1>
      <p className="text-brandGray">Premium Subscriber</p>
    </div>
  );
}
