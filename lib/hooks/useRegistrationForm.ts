import { useState, FormEvent } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { useRouter } from "next/router";
import { RegistrationData } from "@/lib/types/auth";

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
      const registrationData: RegistrationData = {
        ...formData,
        age: ageNum,
      };
      
      // Assuming registerUser is a function that needs to be imported or defined
      // For demonstration, let's assume it's a placeholder function that resolves immediately
      const registerUser = async (data: RegistrationData) => {
        console.log("Registered user:", data);
      };
      await registerUser(registrationData);

      nextStep({
        ...formData,
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

  return {
    formData,
    error,
    loading,
    handleInputChange,
    handleSubmit
  };
} 