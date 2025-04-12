"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegistrationForm } from "@/lib/hooks/useRegistrationForm";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i = 1) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: "easeOut",
    },
  }),
};

export default function BasicInfo() {
  const { 
    formData, 
    error, 
    loading, 
    usernameChecking,
    usernameAvailable,
    handleInputChange, 
    handleSubmit 
  } = useRegistrationForm();

  return (
    <div>
      <h1 className="text-4xl font-edo text-brandOrange mb-6 text-center">
        Sign Up
      </h1>
      {error && (
        <p className="text-red-500 bg-gray-800 p-3 rounded mb-4 text-center font-semibold">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
          <div className="mb-1">
            <Input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              required
              className={`bg-[#111827] text-white border ${
                usernameAvailable === true
                  ? "border-green-500"
                  : usernameAvailable === false
                  ? "border-red-500"
                  : "border-gray-700"
              } px-4 py-3 rounded w-full`}
            />
            {formData.username.length >= 3 && (
              <div className="mt-1 text-xs">
                {usernameChecking ? (
                  <span className="text-gray-400">Checking availability...</span>
                ) : usernameAvailable === true ? (
                  <span className="text-green-500">Username is available</span>
                ) : usernameAvailable === false ? (
                  <span className="text-red-500">Username is already taken</span>
                ) : null}
              </div>
            )}
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
          <Input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded w-full"
          />
          <div className="mt-1 text-xs text-gray-400">
            We&apos;ll use this to confirm your account
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
          <Input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleInputChange}
            required
            className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded w-full"
          />
          <div className="mt-1 text-xs text-gray-400">
            Use at least 8 characters with a mix of letters and numbers
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
          <Input
            type="text"
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleInputChange}
            required
            className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded w-full"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5}>
            <Input
              type="text"
              name="country"
              placeholder="Country"
              value={formData.country}
              onChange={handleInputChange}
              required
              className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded w-full"
            />
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={6}>
            <Input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleInputChange}
              required
              className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded w-full"
            />
          </motion.div>
        </div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={8}>
          <Input
            type="number"
            name="age"
            placeholder="Age"
            value={formData.age}
            onChange={handleInputChange}
            required
            min="18"
            className="bg-[#111827] text-white border border-gray-700 px-4 py-3 rounded w-full"
          />
          <div className="mt-1 text-xs text-gray-400">
            You must be at least 18 years old
          </div>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={9}>
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              name="acceptedTnC"
              checked={formData.acceptedTnC}
              onChange={handleInputChange}
              className="rounded text-orange-500 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-300">I accept the Terms & Conditions</span>
          </label>
        </motion.div>

        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={10}>
          <Button
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 text-white w-full px-6 py-3 rounded-full text-sm"
            disabled={loading || usernameAvailable === false}
          >
            {loading ? "Processing..." : "Next"}
          </Button>
        </motion.div>
      </form>
    </div>
  );
}
