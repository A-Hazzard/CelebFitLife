'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUpUser } from '@/lib/services/AuthService';
import { FirebaseError } from 'firebase/app';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@radix-ui/react-checkbox';
import { Form } from '@/components/ui/form';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [age, setAge] = useState('');
  const [acceptedTnC, setAcceptedTnC] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!acceptedTnC) {
        throw new Error('You must accept the Terms & Conditions.');
      }
      if (!username || !email || !password || !phone || !country || !city || !age) {
        throw new Error('Please fill out all required fields.');
      }

      const ageNum = parseInt(age, 10);
      await signUpUser({
        email,
        password,
        username,
        phone,
        country,
        city,
        age: ageNum,
        acceptedTnC,
      });

      router.push('/login?verification=sent');
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        // Handle Firebase error
        setError(err.message);
      } else {
        // Handle unknown error
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brandBlack text-brandWhite">
      <div className="w-full max-w-md px-6 py-8">
        <h1 className="text-4xl font-edo text-brandOrange mb-6">Sign Up</h1>
        {error && <p className="text-brandOrange mb-2 font-semibold">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          <label className="flex flex-col space-y-1">
            <span className="text-sm">Username</span>
            <Input
              type="text"
              placeholder="dummy_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm">Email</span>
            <Input
              type="email"
              placeholder="dummy@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm">Password</span>
            <Input
              type="password"
              placeholder="dummy_password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm">Phone Number</span>
            <Input
              type="text"
              placeholder="123-456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm">Country</span>
            <Input
              type="text"
              placeholder="United States"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm">City</span>
            <Input
              type="text"
              placeholder="New York"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </label>
          <label className="flex flex-col space-y-1">
            <span className="text-sm">Age</span>
            <Input
              type="number"
              placeholder="25"
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </label>

          <label className="flex items-center space-x-2">
            <Checkbox 
              id="terms"
              checked={acceptedTnC}
              onCheckedChange={(checked) => setAcceptedTnC(!!checked)}
              className="border-white bg-white data-[state=checked]:bg-brandOrange data-[state=checked]:text-brandBlack"
              style={{ width: '20px', height: '20px' }}
            />
            <Label htmlFor="terms" className="text-sm">
              I accept the Terms & Conditions
            </Label>
          </label>

          <Button
            disabled={loading}
            className="bg-brandOrange text-brandBlack font-semibold py-2 mt-4 rounded disabled:bg-opacity-50"
            type="submit"
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </form>
      </div>
    </div>
  );
}
