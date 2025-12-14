"use client";

import { useState } from "react";
import ContactSupportForm from "./ContactSupportForm";

interface ContactSupportButtonProps {
  userEmail?: string;
}

export default function ContactSupportButton({ userEmail }: ContactSupportButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="bg-gray-800 text-white px-8 py-3 rounded-lg font-medium transition-all duration-300 hover:bg-gray-700 hover:scale-105 border border-gray-700 cursor-pointer"
      >
        Contact Support
      </button>
      {showForm && (
        <ContactSupportForm
          onClose={() => setShowForm(false)}
          userEmail={userEmail}
        />
      )}
    </>
  );
}

