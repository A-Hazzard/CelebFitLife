'use client';

import React, { useState } from 'react';
import { sendPasswordReset } from '@/lib/services/AuthService';
import { FirebaseError } from 'firebase/app';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    try {
      await sendPasswordReset(email);
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
    <div className="min-h-screen bg-brandBlack text-brandWhite flex items-center justify-center">
      <div className="w-full max-w-md px-6 py-8">
        <h1 className="text-4xl font-edo text-brandOrange mb-6">Reset Password</h1>

        {error && <p className="text-brandOrange mb-4 font-semibold">{error}</p>}
        {message && <p className="text-brandOrange mb-4 font-semibold">{message}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <input
            className="bg-transparent border-b border-brandGray focus:outline-none py-2"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="bg-brandOrange text-brandBlack font-semibold py-2 rounded"
            type="submit"
          >
            Send Reset Email
          </button>
        </form>

        <div className="mt-6 text-center text-sm space-x-4">
          <a href="/login" className="text-brandGray underline">
            Back to Login
          </a>
          <a href="/register" className="text-brandOrange underline">
            Don&apos;t have an account? Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}
