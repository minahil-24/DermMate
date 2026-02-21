// src/components/Navbar.js
import React from "react";

const Navbar = () => {
  return (
    <div className="w-full bg-white shadow p-4 flex justify-between items-center">
      <h2 className="text-lg font-semibold">Welcome, Dr. Smith</h2>
      <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
        Logout
      </button>
    </div>
  );
};

export default Navbar;
    