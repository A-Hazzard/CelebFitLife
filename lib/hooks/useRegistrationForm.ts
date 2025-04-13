import { useState, FormEvent } from "react";
import { useSignupStore } from "@/lib/store/useSignupStore";
import { RegistrationData } from "@/lib/types/auth";
import { db } from "@/lib/firebase/client";
import { collection, getDocs, query, where } from "firebase/firestore";

// Simple email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRegistrationForm() {
  const { nextStep } = useSignupStore();

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
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(
    null
  );

  // Check if username exists in Firebase
  const checkUsername = async (username: string) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setUsernameChecking(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("username", "==", username));
      const querySnapshot = await getDocs(q);
      setUsernameAvailable(querySnapshot.empty);
    } catch (err) {
      console.error("Error checking username:", err);
      setUsernameAvailable(null);
    } finally {
      setUsernameChecking(false);
    }
  };

  // Check if email exists in Firebase - using email as document ID
  const checkEmail = async (email: string) => {
    if (!email || !EMAIL_REGEX.test(email)) {
      return false;
    }

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return querySnapshot.empty;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Check username availability when username changes
    if (name === "username" && value.length >= 3) {
      const timeoutId = setTimeout(() => {
        checkUsername(value);
      }, 500);

      return () => clearTimeout(timeoutId);
    }

    // Return undefined for other input changes
    return undefined;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Basic validation
      if (!formData.username || !formData.email || !formData.password) {
        throw new Error("Please fill in all required fields");
      }

      // Username length validation
      if (formData.username.length < 3) {
        throw new Error("Username must be at least 3 characters");
      }

      // Password length validation
      if (formData.password.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      // Email format validation
      if (!EMAIL_REGEX.test(formData.email)) {
        throw new Error("Please enter a valid email address");
      }

      // Age validation
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 18) {
        throw new Error("You must be at least 18 years old to register");
      }

      // Terms & Conditions validation
      if (!formData.acceptedTnC) {
        throw new Error("You must accept the Terms & Conditions to register");
      }

      // Check if username is taken
      if (usernameAvailable === false) {
        throw new Error(
          "This username is already taken. Please choose another."
        );
      }

      // Check if email is already registered
      const emailAvailable = await checkEmail(formData.email);
      if (!emailAvailable) {
        throw new Error(
          "This email is already registered. Please use a different email."
        );
      }

      // Create registration data with proper role structure
      const registrationData: RegistrationData = {
        ...formData,
        age: ageNum,
        role: {
          viewer: true,
          streamer: false,
          admin: false,
        },
      };

      // Just move to next step without registering now
      nextStep({
        ...registrationData,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Registration failed. Please try again.";
      setError(errorMessage);
      console.error("Registration validation error:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    formData,
    error,
    loading,
    usernameChecking,
    usernameAvailable,
    handleInputChange,
    handleSubmit,
  };
}
