'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
// Suppose you have a Firestore or DB to store the created streams
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/config/firebase';
import { v4 as uuidv4 } from 'uuid';

export default function CreateStreamPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Generate a slug or use something like slugify
    const slug = `${title.trim().replace(/\s+/g, '-').toLowerCase()}-${uuidv4()}`;

    // In a real app, store this in Firestore
    // e.g. streams/{slug}
    await setDoc(doc(db, 'streams', slug), {
      title,
      description,
      slug,
      createdAt: new Date().toISOString(),
    });

    // After creation, redirect to the manage page
    router.push(`/dashboard/streams/manage/${slug}`);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="bg-gray-800 w-full max-w-md rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Create New Stream</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block mb-1 text-gray-400">Title</label>
            <input
              className="w-full border border-gray-700 rounded p-2 bg-black text-white"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="E.g. Morning Yoga Session"
            />
          </div>
          <div>
            <label className="block mb-1 text-gray-400">Description</label>
            <textarea
              className="w-full border border-gray-700 rounded p-2 bg-black text-white"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about the workout, difficulty level, etc."
            />
          </div>
          <button
            type="submit"
            className="bg-orange-500 text-black px-4 py-2 rounded hover:bg-orange-600"
          >
            Create Stream
          </button>
        </form>
      </div>
    </div>
  );
}
