import React, { JSX } from "react";

export default function StreamGrid({ iframes }: { iframes: JSX.Element[] }) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {iframes.map((iframe, index) => (
          <div key={index} className="bg-brandGray rounded-lg overflow-hidden">
            {iframe}
          </div>
        ))}
      </div>
    );
  }