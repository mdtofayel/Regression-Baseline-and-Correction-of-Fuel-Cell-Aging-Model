import React from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FlaskConical, PlayCircle } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isLoggedIn = !!user;

  return (
    <nav className="bg-bremen-blue text-white py-3 px-6">
      <div className="flex justify-end space-x-6 text-sm sm:text-base">
        {!isLoggedIn ? (
          <>
            <Link to="/register" className="hover:text-bremen-red">Register</Link>
            <Link to="/login" className="hover:text-bremen-red">Login</Link>
          </>
        ) : (
          <>
            <Link to="/upload" className="hover:text-bremen-red">Upload</Link>
            <Link to="/myFiles" className="hover:text-bremen-red">My files</Link>
            <Link to="/results" className="hover:text-bremen-red">Results</Link>
             {/* New: Test Run */}
            <Link to="/myTest" className="flex items-center gap-1 hover:text-bremen-red">
              <FlaskConical size={18} />
              Test Run
            </Link>

            {/* New: Run All */}
            <Link to="/run-all" className="flex items-center gap-1 hover:text-bremen-red">
              <PlayCircle size={18} />
              Run All
            </Link>
            <Link to="/run-fuelcell" className="flex items-center gap-1 hover:text-bremen-red">
              <PlayCircle size={18} />
              Run Fuel Cell
            </Link>

            <button
              onClick={async () => {
                try {
                  await axios.post("http://localhost:8080/auth/logout", {}, {
                    withCredentials: true
                  });
                } catch (error) {
                  console.warn("Logout failed on server:", error);
                } finally {
                  logout(); // always clear frontend state
                  navigate("/login");
                }
              }}
              className="hover:text-bremen-red"
            >
              Logout
            </button>

          </>
        )}
      </div>
    </nav>
  );
}
