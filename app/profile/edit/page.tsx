'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function EditProfilePage() {
  const [name, setName] = useState('John Doe');
  const [bio, setBio] = useState('Fitness Enthusiast');
  const [avatar, setAvatar] = useState('/path/to/profile.jpg');

  const handleSave = () => {
    // Handle profile save logic (connect to Firebase or API)
    alert('Profile updated successfully!');
  };

  return (
    <div className="min-h-screen bg-brandBlack text-brandWhite flex items-center justify-center">
      <div className="max-w-lg w-full bg-brandGray p-6 rounded-lg shadow-lg">
        <h1 className="text-3xl font-edo text-brandOrange mb-6 text-center">Edit Profile</h1>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center mb-6">
        <Avatar>
              <AvatarImage src="/path/to/profile.jpg" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          <input type="file" className="text-sm text-brandWhite" onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) setAvatar(URL.createObjectURL(file));
          }} />
        </div>

        {/* Profile Fields */}
        <div className="space-y-4">
          <div>
            <label className="text-brandWhite">Name</label>
            <Input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="w-full bg-brandBlack text-brandWhite border border-brandGray p-2 rounded-md"
            />
          </div>

          <div>
            <label className="text-brandWhite">Bio</label>
            <textarea 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              className="w-full bg-brandBlack text-brandWhite border border-brandGray p-2 rounded-md"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-center">
          <Button className="bg-brandOrange text-brandBlack px-6 py-2 rounded-full" onClick={handleSave}>Save Changes</Button>
        </div>
      </div>
    </div>
  );
}