'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSignupStore } from '@/store/useSignupStore';
import { signUpUser } from '@/lib/services/AuthService'; // Firebase signup function
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function BasicInfo() {
  const { nextStep } = useSignupStore();
  const router = useRouter();

  // ✅ Declare all fields properly
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

  // ✅ Handles form submission and sends data to Firebase
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

      // ✅ Send user data to Firebase
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

      // ✅ Save data in Zustand and go to next step
      nextStep({ username, email, password, phone, country, city, age: ageNum });

      // ✅ Redirect to login after successful signup
      router.push('/login?verification=sent');
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-edo text-brandOrange mb-6 text-center">Sign Up</h1>
      {error && <p className="text-brandOrange mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Input type="text" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <Input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
        <Input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
        <Input type="number" placeholder="Age" value={age} onChange={(e) => setAge(e.target.value)} required />
        
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={acceptedTnC} onChange={() => setAcceptedTnC(!acceptedTnC)} />
          <span className="text-sm">I accept the Terms & Conditions</span>
        </label>

        <Button type="submit" className="bg-brandOrange text-brandBlack font-semibold py-2 mt-4 rounded disabled:bg-opacity-50" disabled={loading}>
          {loading ? 'Signing Up...' : 'Next'}
        </Button>
      </form>
    </div>
  );
}
