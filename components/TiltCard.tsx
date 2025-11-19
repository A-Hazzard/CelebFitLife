"use client";

import { useRef, useEffect, ReactNode } from "react";
import * as THREE from "three";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
}

export default function TiltCard({ 
  children, 
  className = "", 
  intensity = 12 
}: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const eulerRef = useRef(new THREE.Euler(0, 0, 0, 'XYZ'));
  const targetEulerRef = useRef(new THREE.Euler(0, 0, 0, 'XYZ'));

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    // Use Three.js Euler for smooth 3D rotation calculations
    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = (e.clientX - centerX) / rect.width;
      const mouseY = (e.clientY - centerY) / rect.height;
      
      // Calculate target rotation using Three.js math
      targetEulerRef.current.set(
        -mouseY * intensity * (Math.PI / 180),
        mouseX * intensity * (Math.PI / 180),
        0,
        'XYZ'
      );
    };

    const handleMouseLeave = () => {
      targetEulerRef.current.set(0, 0, 0, 'XYZ');
    };

    card.addEventListener("mousemove", handleMouseMove);
    card.addEventListener("mouseleave", handleMouseLeave);

    // Animation loop using Three.js math for smooth interpolation
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);

      // Smooth interpolation using lerp
      const lerpFactor = 0.15;
      eulerRef.current.x += (targetEulerRef.current.x - eulerRef.current.x) * lerpFactor;
      eulerRef.current.y += (targetEulerRef.current.y - eulerRef.current.y) * lerpFactor;
      eulerRef.current.z += (targetEulerRef.current.z - eulerRef.current.z) * lerpFactor;

      // Convert Three.js Euler angles to degrees for CSS
      const rotateX = eulerRef.current.x * (180 / Math.PI);
      const rotateY = eulerRef.current.y * (180 / Math.PI);
      
      // Calculate translateZ based on rotation intensity
      const rotationMagnitude = Math.sqrt(
        eulerRef.current.x * eulerRef.current.x + 
        eulerRef.current.y * eulerRef.current.y
      );
      const translateZ = rotationMagnitude * 15;

      // Apply 3D transform
      card.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        translateZ(${translateZ}px)
      `;
      card.style.transformStyle = "preserve-3d";
      card.style.transition = "none";
    };

    animate();

    return () => {
      card.removeEventListener("mousemove", handleMouseMove);
      card.removeEventListener("mouseleave", handleMouseLeave);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [intensity]);

  return (
    <div
      ref={cardRef}
      className={className}
      style={{ 
        transformStyle: "preserve-3d",
        willChange: "transform"
      }}
    >
      {children}
    </div>
  );
}

