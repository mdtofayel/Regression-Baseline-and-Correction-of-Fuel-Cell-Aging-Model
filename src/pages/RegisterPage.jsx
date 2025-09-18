import React, { useState } from "react";
import axios from "axios";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

 const handleRegister = async (e) => {
  e.preventDefault();

  console.log("Sending to backend:", { email, password });

  try {
    const response = await axios.post("http://localhost:8080/auth/register", null, {
      params: { email, password },
    });

    setStatus(`✅ ${response.data}`);

    // Wait 1.5 seconds then redirect
    setTimeout(() => {
      navigate("/login");
    }, 1500);
  } catch (err) {
    const message = err.response?.data || "Registration failed.";
    setStatus(`❌ ${message}`);
  }
};


  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-50">
      <form onSubmit={handleRegister} className="bg-white p-8 shadow-md rounded-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-bremen-blue mb-4 text-center">Register</h2>
        <input
          type="email"
          placeholder="Email"
          className="w-full px-3 py-2 mb-4 border rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-3 py-2 mb-4 border rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-bremen-blue hover:bg-bremen-red text-white py-2 rounded transition"
        >
          Register
        </button>
        {status && <p className="mt-4 text-center text-sm">{status}</p>}
      </form>
    </div>
  );
}
