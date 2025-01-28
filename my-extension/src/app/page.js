"use client"; // Required for using React hooks and client-side functionality

import { useState } from "react";

export default function Popup() {
  const [status, setStatus] = useState("");
  const [dataDisplay, setDataDisplay] = useState("");

  // Function to handle the "Auto Fill" button click
  const handleFetchAndFill = async () => {
    setStatus("Fetching data...");

    try {
      // Simulate fetching data (replace with your actual API call)
      const response = await fetch("/api/fetchDrivers"); // Example API route
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setStatus("Data fetched successfully!");
      setDataDisplay(JSON.stringify(data, null, 2)); // Display the data
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      console.error("Fetch error:", error);
    }
  };

  return (
    <div className="w-[330px] h-[300px] p-0 m-0 bg-[#f4f8fb] flex flex-col items-center justify-center rounded-2xl shadow-lg">
      <div className="bg-white rounded-2xl shadow-md pt-20 w-full text-center">
        <div className="mb-5">
          <img src="/image/image.svg" alt="Auto-Fill Icon" className="w-24 h-auto mx-auto" />
        </div>
        <h3 className="text-xl font-semibold my-2">Auto-Fill in an Instant</h3>
        <p className="text-sm text-gray-600 mb-5">
          Quickly and effortlessly complete online forms with precision, saving time and reducing errors.
        </p>
        <button
          className="bg-green-500 text-white px-5 py-3 rounded-lg text-base cursor-pointer transition-colors hover:bg-green-600 w-1/2"
          onClick={handleFetchAndFill}
        >
          Auto Fill
        </button>
        <div
          id="status"
          className={`mt-4 p-3 rounded-lg text-sm ${
            status.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
          }`}
        >
          {status}
        </div>
        <div id="dataDisplay" className="mt-4 p-3 rounded-lg text-sm bg-gray-50 border border-gray-200 max-h-[150px] overflow-y-auto">
          <pre>{dataDisplay}</pre>
        </div>
      </div>
    </div>
  );
}