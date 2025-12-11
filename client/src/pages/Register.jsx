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
        title: "Account Created",
        text: "Please login now.",
      });
      navigate("/login");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message,
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
    <div className="container py-5">
      <div
        className="card mx-auto shadow-lg border-0"
        style={{ maxWidth: "700px", borderRadius: "15px" }}
      >
        <div className="card-header bg-white border-0 text-center pt-4">
          <h2 className="fw-bold">Create Account</h2>
          <p className="text-muted">Join Body Architect today</p>
        </div>

        <div className="card-body p-4">
          <div className="d-flex justify-content-center mb-4">
            <GoogleLogin
              onSuccess={handleGoogleRegister}
              onError={() => {}}
              text="signup_with"
              width="300"
            />
          </div>

          <div className="text-center mb-4 text-muted small border-bottom pb-3">
            OR REGISTER MANUALLY
          </div>

          <form onSubmit={handleSubmit} className="row g-3">
            <div className="col-md-6">
              <label className="form-label small fw-bold">Username</label>
              <input
                name="username"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-6">
              <label className="form-label small fw-bold">Email</label>
              <input
                name="email"
                type="email"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-12">
              <label className="form-label small fw-bold">Password</label>
              <input
                name="password"
                type="password"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>

            <div className="col-12">
              <hr className="text-muted my-2" />
            </div>
            <h6 className="fw-bold text-primary">Body Stats</h6>

            <div className="col-md-3">
              <label className="form-label small">Age</label>
              <input
                name="age"
                type="number"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Height (cm)</label>
              <input
                name="height"
                type="number"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Weight (kg)</label>
              <input
                name="weight"
                type="number"
                className="form-control"
                onChange={handleChange}
                required
              />
            </div>
            <div className="col-md-3">
              <label className="form-label small">Gender</label>
              <select
                name="gender"
                className="form-select"
                onChange={handleChange}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label small">Activity Level</label>
              <select
                name="activityLevel"
                className="form-select"
                onChange={handleChange}
              >
                <option value="sedentary">Sedentary</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label small">Goal</label>
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

            <div className="col-12 mt-4">
              <button type="submit" className="btn btn-warning w-100 fw-bold">
                Create Account
              </button>
            </div>
          </form>
          <div className="text-center mt-3">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
