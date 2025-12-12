import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { api } from "../helpers/http-client";
import Swal from "sweetalert2";
import { GoogleLogin } from "@react-oauth/google";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    age: "",
    gender: "male",
    height: "",
    weight: "",
    activityLevel: "moderate",
    goal: "maintenance",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/register", {
        ...form,
        age: Number(form.age),
        height: Number(form.height),
        weight: Number(form.weight),
      });
      Swal.fire({
        icon: "success",
        title: "Welcome Aboard",
        text: "Identity Verification Complete. Please Login.",
        background: "#000",
        color: "#fff",
        confirmButtonColor: "#fff",
        confirmButtonText: "PROCEED", // Text hitam otomatis karena button putih
      });
      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: error.response?.data?.message,
        background: "#000",
        color: "#fff",
      });
    }
  };

  const handleGoogleRegister = async (credentialResponse) => {
    try {
      const { data } = await api.post("/google-login", {
        token: credentialResponse.credential,
      });
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("role", data.role);
      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      Swal.fire("Error", "Google Register Failed", "error");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-black py-5">
      <div
        className="glass-panel p-4 p-md-5 m-3"
        style={{ width: "100%", maxWidth: "800px" }}
      >
        <div className="text-center mb-5">
          <h2 className="display-6 fw-bold mb-2">
            NEW MEMBER
            <br />
            APPLICATION
          </h2>
          <p className="text-muted-light small text-uppercase">
            Architect your body starting today
          </p>
        </div>

        <div className="d-flex justify-content-center mb-4">
          <GoogleLogin
            onSuccess={handleGoogleRegister}
            theme="filled_black"
            shape="rectangular"
            width="300"
          />
        </div>

        <div
          className="text-center mb-4 text-muted-light small border-bottom border-secondary pb-3 mx-auto"
          style={{ maxWidth: "200px" }}
        >
          OR MANUAL INPUT
        </div>

        <form onSubmit={handleSubmit}>
          {/* Account Info */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Username</label>
              <input
                name="username"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Email</label>
              <input
                name="email"
                type="email"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Password</label>
              <input
                name="password"
                type="password"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <h6
            className="text-white border-bottom border-secondary pb-2 mb-3 mt-4 fw-bold text-uppercase"
            style={{ fontSize: "0.8rem", letterSpacing: "2px" }}
          >
            Body Metrics
          </h6>

          {/* Stats Grid */}
          <div className="row g-3 mb-4">
            <div className="col-6 col-md-3">
              <label className="form-label">Age</label>
              <input
                name="age"
                type="number"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Height (cm)</label>
              <input
                name="height"
                type="number"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Weight (kg)</label>
              <input
                name="weight"
                type="number"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-6 col-md-3">
              <label className="form-label">Gender</label>
              <select
                name="gender"
                className="form-select"
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-5">
            <div className="col-md-6">
              <label className="form-label">Activity Level</label>
              <select
                name="activityLevel"
                className="form-select"
                onChange={handleChange}
              >
                <option value="sedentary">
                  Sedentary (Little/No Exercise)
                </option>
                <option value="moderate">Moderate (3-5 days/week)</option>
                <option value="high">High (Active Job/Daily Exercise)</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Goal</label>
              <select
                name="goal"
                className="form-select"
                onChange={handleChange}
              >
                <option value="weight_loss">Weight Loss</option>
                <option value="muscle_build">Muscle Build</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-mono w-100 py-3 mb-4">
            CREATE ACCOUNT
          </button>
        </form>

        <div className="text-center">
          <Link
            to="/login"
            className="text-white small text-decoration-none border-bottom hover-opacity"
          >
            ALREADY A MEMBER? LOGIN HERE
          </Link>
        </div>
      </div>
    </div>
  );
}
