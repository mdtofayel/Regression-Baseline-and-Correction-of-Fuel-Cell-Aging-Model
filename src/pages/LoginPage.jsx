import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  console.log("Logging in with:", { email, password });

  try {
    const response = await axios.post("http://localhost:8080/auth/login", {
      email,
      password
    }, {
      withCredentials: true
    });

    if (response.status === 200) {
      login({ email }); // Save email to context
      setStatus("✅ Login successful");

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } else {
      setStatus("❌ Login failed.");
    }
  } catch (err) {
    const msg = err.response?.data || "Login failed.";
    setStatus(`❌ ${msg}`);
  }
};


  return (
    <div className="flex justify-center items-center min-h-[80vh] bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 shadow-md rounded-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-bremen-blue mb-4 text-center">Login</h2>

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
          Login
        </button>

        {status && <p className="mt-4 text-center text-sm">{status}</p>}
      </form>
    </div>
  );
}
