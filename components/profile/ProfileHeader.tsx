import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Twitch, Twitter, Instagram, BadgeCheck, Edit } from 'lucide-react';
import React from 'react';

interface ProfileHeaderProps {
  isOwnProfile?: boolean;
  name: string;
  username: string;
  followers: number;
  views: number;
  profilePicture?: string;
  isVerified?: boolean;
}

export function StreamerProfileHeader({
  name,
  username,
  followers,
  views,
  profilePicture,
  isVerified = false,
  isOwnProfile = false
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className="relative">
      <Avatar>
              <AvatarImage src="/path/to/profile.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
        {isVerified && (
          <div className="absolute bottom-0 right-0 bg-brandOrange rounded-full p-1">
            <BadgeCheck size={16} className="text-brandBlack" />
          </div>
        )}
        {isOwnProfile && (
          <div className="absolute bottom-0 right-0 bg-brandBlack rounded-full p-1">
            <Edit size={16} className="text-brandWhite" />
          </div>
        )}
      </div>
      
      <h1 className="text-3xl font-edo text-brandOrange mt-4">{name}</h1>
      <p className="text-brandGray">@{username} | Professional Streamer</p>
      
      <div className="flex items-center space-x-4 mt-2">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-brandWhite">{followers.toLocaleString()}</span>
          <span className="text-xs text-brandGray">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-brandWhite">{views.toLocaleString()}</span>
          <span className="text-xs text-brandGray">Total Views</span>
        </div>
      </div>
      
      <div className="flex space-x-4 mt-4">
        <a href="#" className="text-brandGray hover:text-brandWhite">
          <Twitch size={24} strokeWidth={1.5} />
        </a>
        <a href="#" className="text-brandGray hover:text-brandWhite">
          <Twitter size={24} strokeWidth={1.5} />
        </a>
        <a href="#" className="text-brandGray hover:text-brandWhite">
          <Instagram size={24} strokeWidth={1.5} />
        </a>
      </div>
    </div>
  );
}

export function ViewerProfileHeader({
  name,
  username,
  followers,
  views,
  profilePicture,
  isVerified = false
}: ProfileHeaderProps) {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className="relative">
      <Avatar>
              <AvatarImage src="/path/to/profile.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
        {isVerified && (
          <div className="absolute bottom-0 right-0 bg-brandOrange rounded-full p-1">
            <BadgeCheck size={16} className="text-brandBlack" />
          </div>
        )}
      </div>
      
      <h1 className="text-3xl font-edo text-brandOrange mt-4">{name}</h1>
      <p className="text-brandGray">@{username} | Community Member</p>
      
      <div className="flex items-center space-x-4 mt-2">
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-brandWhite">{followers.toLocaleString()}</span>
          <span className="text-xs text-brandGray">Followers</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-lg font-bold text-brandWhite">{views.toLocaleString()}</span>
          <span className="text-xs text-brandGray">Total Interactions</span>
        </div>
      </div>
    </div>
  );
}

export default StreamerProfileHeader;
