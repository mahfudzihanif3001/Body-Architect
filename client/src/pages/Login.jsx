import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { api } from "../helpers/http-client";
import Swal from "sweetalert2";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post("/login", { email, password });
      handleSuccess(data);
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.response?.data?.message || "Invalid credentials",
      });
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const { data } = await api.post("/google-login", {
        token: credentialResponse.credential,
      });
      handleSuccess(data);
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Google Login Failed",
        text: "Could not authenticate with Google",
      });
    }
  };

  const handleSuccess = (data) => {
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("role", data.role);
    localStorage.setItem("username", data.username);

    Swal.fire({
      icon: "success",
      title: "Welcome back!",
      text: `Logged in as ${data.username}`,
      timer: 1500,
      showConfirmButton: false,
    });

    navigate("/dashboard");
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-black pt-5">
      <div
        className="glass-panel p-5 m-3"
        style={{ width: "100%", maxWidth: "450px" }}
      >
        <h2 className="display-6 fw-bold mb-4 text-center">LOGIN ACCOUNT</h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="form-label mb-2">Email Address</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-5">
            <label className="form-label mb-2">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-mono w-100 py-3 mb-4">
            ENTER SYSTEM
          </button>
        </form>

        <div className="text-center">
          <p className="form-label mb-2">OR</p>
          <div className="d-flex justify-content-center mb-4">
            {/* Note: Customize Google Button CSS might be hard, wrapper needed */}
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              theme="filled_black"
              shape="rectangular"
            />
          </div>
          <Link
            to="/register"
            className="text-white small text-decoration-none border-bottom"
          >
            CREATE NEW ACCOUNT
          </Link>
        </div>
      </div>
    </div>
  );
}
