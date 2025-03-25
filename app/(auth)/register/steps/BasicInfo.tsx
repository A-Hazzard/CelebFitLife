'use client';

import { useSignupStore } from '@/store/useSignupStore';
import { signUpUser } from '@/lib/services/AuthService'; // your Firebase function
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BasicInfo() {
  const { nextStep } = useSignupStore();
  const router = useRouter();

  // Local state for form fields
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!acceptedTnC) {
        throw new Error('You must accept the Terms & Conditions.');
      }
      if (!username || !email || !password || !phone || !country || !city || !age) {
        throw new Error('Please fill out all required fields.');
      }

      const ageNum = parseInt(age, 10);

      // ✅ Send user data to Firebase
      try{
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username, email,
            password, phone,
            country, city,
            age: ageNum,
            acceptedTnC,
            isStreamer: false,
            isAdmin: false,
          })
        })
        const data = await response.json()
        if(!response.ok) throw new Error(data.error || "Registration Failed")

        nextStep({
          username,
          email,
          password,
          phone,
          country,
          city,
          age: ageNum,
        });

      } catch (error: unknown) {
        console.error('Registration error:', error);
        const message = error instanceof Error ? error.message : 'Failed to register. Please try again.';
        throw new Error(message);
      }

      // ✅ Save data in Zustand and go to next step
      
    } catch (err: Error | unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-4xl font-edo text-brandOrange mb-6 text-center">Sign Up</h1>
      {error && <p className="text-brandOrange mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Phone Number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
        <Input
          type="number"
          placeholder="Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={acceptedTnC}
            onChange={() => setAcceptedTnC(!acceptedTnC)}
          />
          <span className="text-sm">I accept the Terms & Conditions</span>
        </label>

        <Button
          type="submit"
          className="w-full bg-brandOrange text-brandBlack font-semibold py-2 mt-4 rounded disabled:bg-opacity-50"
          disabled={loading}
        >
          {loading ? 'Signing Up...' : 'Next'}
        </Button>
      </form>
    </div>
  );
}
