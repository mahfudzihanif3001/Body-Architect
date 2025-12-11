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
    <div className="container d-flex justify-content-center align-items-center vh-100 bg-light">
      <div
        className="card border-0 shadow-lg p-4"
        style={{ width: "400px", borderRadius: "15px" }}
      >
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark">Welcome Back</h2>
          <p className="text-muted">Login to manage your body goals</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label fw-bold small">Email Address</label>
            <input
              type="email"
              className="form-control form-control-lg"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label fw-bold small">Password</label>
            <input
              type="password"
              className="form-control form-control-lg"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-dark w-100 btn-lg mb-3">
            Sign In
          </button>
        </form>

        <div className="text-center mb-3 text-muted small">OR</div>

        <div className="d-flex justify-content-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => console.log("Login Failed")}
            theme="filled_blue"
            shape="circle"
            width="320"
          />
        </div>

        <div className="text-center">
          <p className="small text-muted">
            Don't have an account?{" "}
            <Link to="/register" className="fw-bold text-decoration-none">
              Register Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
