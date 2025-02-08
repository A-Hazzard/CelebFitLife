import { useState } from "react";
export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      {/* Toggle Button for Mobile */}
      <button
        className="md:hidden p-2 bg-brandOrange text-brandWhite rounded-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "✖ Close" : "☰ Menu"}
      </button>

      {/* Sidebar Panel */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-brandBlack border-r border-brandGray p-4 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:block hidden transition-transform duration-300 ease-in-out`}
      >
        <h2 className="text-brandOrange font-edo text-lg mb-4">Filters</h2>
        <ul className="space-y-2">
          <li className="text-brandWhite hover:text-brandOrange cursor-pointer">
            Popular
          </li>
          <li className="text-brandWhite hover:text-brandOrange cursor-pointer">
            Upcoming
          </li>
          <li className="text-brandWhite hover:text-brandOrange cursor-pointer">
            Favorites
          </li>
        </ul>
      </aside>

      {/* Background Overlay to Close Menu on Click */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
}
