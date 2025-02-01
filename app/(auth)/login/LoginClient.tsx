'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  loginWithEmailPassword,
  sendSignInLink,
  completeSignInWithEmailLink,
} from '@/lib/services/AuthService';
import { FirebaseError } from 'firebase/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [linkMode, setLinkMode] = useState(false);

  // This is the crucial line that triggers the warning if not in <Suspense>.
  const verificationMsg = searchParams.get('verification');

  useEffect(() => {
    completeSignInWithEmailLink()
      .then((result) => {
        if (result) {
          router.push('/dashboard');
        }
      })
      .catch(console.error);
  }, [router]);

  const handleLoginPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await loginWithEmailPassword(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleSendLink = async () => {
    setError('');
    try {
      await sendSignInLink(email);
      alert('Check your email for the sign-in link!');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  return (
    <div className="min-h-screen bg-brandBlack flex items-center justify-center text-brandWhite">
      <div className="w-full max-w-md px-6 py-8">
        <h1 className="text-4xl font-edo text-brandOrange mb-6">Login</h1>

        {verificationMsg === 'sent' && (
          <p className="text-brandOrange mb-4">
            We sent a verification link. Please check your email before logging in.
          </p>
        )}

        {error && <p className="text-brandOrange mb-4 font-semibold">{error}</p>}

        {!linkMode ? (
          <form onSubmit={handleLoginPassword} className="flex flex-col space-y-4">
            <Input
              className="bg-transparent border-b border-brandGray focus:outline-none py-2"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              className="bg-transparent border-b border-brandGray focus:outline-none py-2"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button
              className="bg-brandOrange text-brandBlack font-semibold py-2 rounded"
              type="submit"
            >
              Login
            </Button>

            <div className="flex items-center justify-between text-sm mt-2">
              <Button
                className="text-brandGray underline"
                onClick={() => setLinkMode(true)}
              >
                Sign in with Email Link
              </Button>
              <a href="/reset-password" className="text-brandGray underline">
                Forgot Password?
              </a>
            </div>

            <div className="mt-4 text-center">
              <a href="/register" className="text-brandOrange underline">
                Don&apos;t have an account? Sign Up
              </a>
            </div>
          </form>
        ) : (
          <div className="flex flex-col space-y-4">
            <Input
              className="bg-transparent border-b border-brandGray focus:outline-none py-2"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button
              onClick={handleSendLink}
              className="bg-brandOrange text-brandBlack font-semibold py-2 rounded"
            >
              Send Magic Link
            </Button>

            <div className="flex items-center justify-between text-sm mt-2">
              <Button
                className="text-brandGray underline"
                onClick={() => setLinkMode(false)}
              >
                Login with Password
              </Button>
              <a href="/reset-password" className="text-brandGray underline">
                Forgot Password?
              </a>
            </div>

            <div className="mt-4 text-center">
              <a href="/register" className="text-brandOrange underline">
                Don&apos;t have an account? Sign Up
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
