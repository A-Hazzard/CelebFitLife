"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function LandingHeader() {
  const router = useRouter();
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const openMobileMenu = () => {
    setShowMobileMenu(true);
    // Wait until the overlay is mounted before triggering fade in
    requestAnimationFrame(() => {
      setMobileMenuOpen(true);
    });
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      setShowMobileMenu(false);
    }, 300); // match transition duration (300ms)
  };

  const toggleMobileMenu = () => {
    if (isMobileMenuOpen) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  };

  // When the user clicks on the logo, ensure mobile menu is closed.
  const handleLogoClick = () => {
    setMobileMenuOpen(false);
    setShowMobileMenu(false);
    router.push("/");
  };

  return (
    <header className="bg-brandBlack border-b border-brandOrange p-4 flex items-center justify-between relative">
      {/* Logo and Title */}
      <div
        className="flex items-center space-x-4 cursor-pointer"
        onClick={handleLogoClick}
      >
        <div>
          <Image
            src="/og-image.jpg"
            alt="CelebFitLife Logo"
            width={100}
            height={100}
            className="w-12 h-12 object-contain "
          />
        </div>
        <h1 className="text-2xl font-bold">CelebFitLife</h1>
      </div>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex space-x-4">
        <Link
          href="/login"
          className="transition-colors duration-300 hover:text-brandOrange"
        >
          Login
        </Link>
        <Link
          href="/register"
          className="transition-colors duration-300 hover:text-brandOrange"
        >
          Sign Up
        </Link>
        <Link
          href="/#contact"
          className="transition-colors duration-300 hover:text-brandOrange"
        >
          Contact
        </Link>
      </nav>

      {/* Mobile Hamburger Icon */}
      <div className="md:hidden">
        <button
          onClick={toggleMobileMenu}
          className="text-brandWhite focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      {showMobileMenu && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-brandBlack bg-opacity-95 transition-opacity duration-300 ${
            isMobileMenuOpen ? "opacity-100" : "opacity-0"
          } space-y-12`}
        >
          <button
            onClick={toggleMobileMenu}
            className="absolute top-4 right-4 text-brandWhite focus:outline-none"
          >
            <X size={30} />
          </button>
          <Link
            href="/login"
            className="text-2xl transition-colors duration-300 hover:text-brandOrange"
            onClick={closeMobileMenu}
          >
            Login
          </Link>
          <Link
            href="/register"
            className="text-2xl transition-colors duration-300 hover:text-brandOrange"
            onClick={closeMobileMenu}
          >
            Sign Up
          </Link>
          <Link
            href="#contact"
            className="text-2xl transition-colors duration-300 hover:text-brandOrange"
            onClick={closeMobileMenu}
          >
            Contact
          </Link>
        </div>
      )}
    </header>
  );
}
