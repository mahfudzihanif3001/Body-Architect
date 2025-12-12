import { Link, useNavigate } from "react-router"; 
import Swal from "sweetalert2";

// REDUX IMPORT
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../features/authSlice";

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // AMBIL STATE DARI REDUX STORE
  const { isLoggedIn, role } = useSelector((state) => state.auth);

  const handleLogout = () => {
    localStorage.clear();

    dispatch(logoutUser());

    Swal.fire({
      icon: "success",
      title: "Logged Out",
      background: "#000",
      color: "#fff",
      showConfirmButton: false,
      timer: 1500,
    });
    navigate("/login");
  };

  return (
    <nav
      className="navbar navbar-expand-lg fixed-top py-4"
      style={{
        backgroundColor: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(5px)",
      }}
    >
      <div className="container">
        <Link
          className="navbar-brand fw-bold text-white fs-4 text-uppercase tracking-wider"
          to="/"
        >
          BODY ARCHITECT.
        </Link>

        <button
          className="navbar-toggler border-white"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span
            className="navbar-toggler-icon"
            style={{ filter: "invert(1)" }}
          ></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto gap-4 align-items-center">
            <li className="nav-item">
              <Link
                className="nav-link text-white text-uppercase small fw-bold"
                to="/"
              >
                Home
              </Link>
            </li>

            {/* KONDISI BERDASARKAN REDUX */}
            {isLoggedIn && (
              <>
                <li className="nav-item">
                  <Link
                    className="nav-link text-white text-uppercase small fw-bold"
                    to="/dashboard"
                  >
                    Dashboard
                  </Link>
                </li>
                {/* Cek Role Admin (Case Insensitive) */}
                {role.toLowerCase() !== "admin" && (
                  <li className="nav-item">
                    <Link
                      className="nav-link text-white text-uppercase small fw-bold"
                      to="/generate-plan"
                    >
                      AI Generator
                    </Link>
                  </li>
                )}
                <li className="nav-item ms-lg-3">
                  <button
                    onClick={handleLogout}
                    className="btn btn-outline-danger rounded-0 text-uppercase fw-bold"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Logout
                  </button>
                </li>
              </>
            )}

            {!isLoggedIn && (
              <li className="nav-item ms-lg-3 d-flex gap-2">
                <Link to="/login" className="btn btn-outline-mono border-0">
                  Login
                </Link>
                <Link to="/register" className="btn btn-mono">
                  Join Now
                </Link>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}