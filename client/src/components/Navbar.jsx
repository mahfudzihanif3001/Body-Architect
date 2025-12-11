import { Link, useNavigate, useLocation } from "react-router";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    const userRole = localStorage.getItem("role");

    setIsLoggedIn(!!token);
    setRole(userRole || "");
  }, [location]);

  const handleLogout = () => {
    localStorage.clear();
    setIsLoggedIn(false);
    setRole("");

    Swal.fire({
      icon: "success",
      title: "Logged Out",
      showConfirmButton: false,
      timer: 1500,
    });
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4 shadow-sm sticky-top">
      <div className="container">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          🏋️ Body Architect
        </Link>

        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className="nav-link" to="/">
                Home
              </Link>
            </li>

            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link className="nav-link" to="/dashboard">
                    {role === "admin" || role === "Admin"
                      ? "Admin Dashboard"
                      : "My Dashboard"}
                  </Link>
                </li>

                {role !== "admin" && role !== "Admin" && (
                  <li className="nav-item">
                    <Link className="nav-link" to="/generate-plan">
                      AI Generator
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>

          <div className="d-flex gap-2">
            {isLoggedIn ? (
              <div className="d-flex align-items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="btn btn-danger btn-sm fw-bold"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-light btn-sm">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="btn btn-warning btn-sm text-dark fw-bold"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
