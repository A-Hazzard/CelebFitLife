'use client';

import React, { useState } from 'react';
import { FirebaseError } from 'firebase/app';
import Link from 'next/link';
import LandingHeader from '@/components/layout/landing/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      // await sendPasswordReset(email);
      setMessage('Password reset email sent. Check your inbox.');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <>
      <LandingHeader />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brandBlack to-gray-900 text-brandWhite">
        <div className="w-full max-w-md bg-gray-800 shadow-xl rounded-lg px-8 py-10">
          <h1 className="text-4xl font-extrabold text-brandOrange text-center mb-6">
            Reset Password
          </h1>

          {error && (
            <p className="text-red-500 bg-gray-700 p-3 rounded mb-4 text-center font-semibold">
              {error}
            </p>
          )}
          {message && (
            <p className="text-green-500 bg-gray-700 p-3 rounded mb-4 text-center font-semibold">
              {message}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <Input
              className="bg-gray-900 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-brandOrange py-2 px-4 rounded"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              className="bg-brandOrange hover:bg-orange-600 text-brandBlack font-semibold py-2 rounded text-lg"
              type="submit"
            >
              Send Reset Email
            </Button>
          </form>

          <div className="mt-6 text-center text-sm space-x-4">
            <Link
              href="/login"
              className="text-brandGray underline hover:text-brandOrange"
            >
              Back to Login
            </Link>
            <Link
              href="/register"
              className="text-brandOrange underline hover:text-orange-400"
            >
              Don&apos;t have an account? Sign Up
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
