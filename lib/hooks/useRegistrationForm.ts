import { useState, FormEvent } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { useRouter } from "next/navigation";
import { RegistrationData } from "@/lib/types/auth";
import { registerUser } from "@/lib/helpers/auth";

export function useRegistrationForm() {
  const { nextStep } = useSignupStore();
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
    country: "",
    city: "",
    age: "",
    acceptedTnC: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const ageNum = parseInt(formData.age, 10);

      // Create the registration data object
      const registrationData: RegistrationData = {
        ...formData,
        age: ageNum,
        role: {
          viewer: true,
          streamer: false,
          admin: false,
        },
      };

      // Call the registerUser function from lib/helpers/auth
      await registerUser(registrationData);

      // Update the signup store and navigate to login
      nextStep(registrationData);
      router.push("/login");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      console.error("Registration error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    error,
    loading,
    handleInputChange,
    handleSubmit,
  };
}
