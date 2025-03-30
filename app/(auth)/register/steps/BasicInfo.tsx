"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRegistrationForm } from "@/lib/hooks/useRegistrationForm";

export default function BasicInfo() {
  const { formData, error, loading, handleInputChange, handleSubmit } = useRegistrationForm();

  return (
    <div>
      <h1 className="text-4xl font-edo text-brandOrange mb-6 text-center">
        Sign Up
      </h1>
      {error && <p className="text-brandOrange mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="text"
          name="username"
          placeholder="Username"
          value={formData.username}
          onChange={handleInputChange}
          required
        />
        <Input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleInputChange}
          required
        />
        <Input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleInputChange}
          required
        />
        <Input
          type="text"
          name="phone"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={handleInputChange}
          required
        />
        <Input
          type="text"
          name="country"
          placeholder="Country"
          value={formData.country}
          onChange={handleInputChange}
          required
        />
        <Input
          type="text"
          name="city"
          placeholder="City"
          value={formData.city}
          onChange={handleInputChange}
          required
        />
        <Input
          type="number"
          name="age"
          placeholder="Age"
          value={formData.age}
          onChange={handleInputChange}
          required
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            name="acceptedTnC"
            checked={formData.acceptedTnC}
            onChange={handleInputChange}
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
