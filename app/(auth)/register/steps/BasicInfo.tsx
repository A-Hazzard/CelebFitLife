"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { useRouter } from "next/navigation";
import {FormEvent, useState} from "react";
import { registerUser } from "@/lib/helpers/auth";
import { RegistrationData } from "@/lib/types/auth";

export default function BasicInfo() {
  const { nextStep } = useSignupStore();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [age, setAge] = useState("");
  const [acceptedTnC, setAcceptedTnC] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const ageNum = parseInt(age, 10);
      const registrationData: RegistrationData = {
        username,
        email,
        password,
        phone,
        country,
        city,
        age: ageNum,
        acceptedTnC,
      };
      await registerUser(registrationData);

      nextStep({
        username,
        email,
        password,
        phone,
        country,
        city,
        age: ageNum,
        role: {
          viewer: true,
          streamer: false,
          admin: false
        }
      });

      router.push("/login");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-edo text-brandOrange mb-6 text-center">
        Sign Up
      </h1>
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
          className="bg-brandOrange text-brandBlack font-semibold py-2 mt-4 rounded disabled:bg-opacity-50"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Next"}
        </Button>
      </form>
    </div>
  );
}
