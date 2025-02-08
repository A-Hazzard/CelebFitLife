"use client";

import LandingHeader from "@/components/layout/landing/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpUser } from "@/lib/services/AuthService";
import { FirebaseError } from "firebase/app";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

function LabelInput({
  label,
  type,
  value,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (val: string) => void;
}) {
  return (
    <label className="flex flex-col space-y-1">
      <span className="text-sm">{label}</span>
      <Input
        type={type}
        placeholder={`Enter ${label.toLowerCase()}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-900 text-white border border-gray-500 focus:outline-none focus:ring-2 focus:ring-brandOrange py-2 px-4 rounded"
      />
    </label>
  );
}
export default function RegisterPage() {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!acceptedTnC) {
        throw new Error("You must accept the Terms & Conditions.");
      }
      if (
        !username ||
        !email ||
        !password ||
        !phone ||
        !country ||
        !city ||
        !age
      ) {
        throw new Error("Please fill out all required fields.");
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

      router.push("/login?verification=sent");
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LandingHeader />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#ff7f3017] to-brandBlack text-brandWhite">
        <div className="w-full max-w-md bg-gray-800 shadow-xl rounded-lg px-8 py-10">
          <h1 className="text-4xl font-extrabold text-brandOrange text-center mb-6">
            Sign Up
          </h1>

          {error && (
            <p className="text-red-500 bg-gray-700 p-3 rounded mb-4 text-center font-semibold">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <LabelInput
              label="Username"
              type="text"
              value={username}
              onChange={setUsername}
            />
            <LabelInput
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
            />
            <LabelInput
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
            />
            <LabelInput
              label="Phone Number"
              type="text"
              value={phone}
              onChange={setPhone}
            />
            <LabelInput
              label="Country"
              type="text"
              value={country}
              onChange={setCountry}
            />
            <LabelInput
              label="City"
              type="text"
              value={city}
              onChange={setCity}
            />
            <LabelInput
              label="Age"
              type="number"
              value={age}
              onChange={setAge}
            />

            <label className="flex items-center space-x-2">
              <input
                id="terms"
                type="checkbox"
                checked={acceptedTnC}
                onChange={(e) => setAcceptedTnC(e.target.checked)}
                className="border-brandOrange bg-white checked:bg-brandOrange checked:text-brandBlack w-5 h-5"
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
              {loading ? "Signing Up..." : "Sign Up"}
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}


