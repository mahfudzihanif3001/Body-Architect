import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../helpers/http-client";
import Swal from "sweetalert2";

export default function GeneratePlan() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      await api.post("/generate-plan");
      Swal.fire({
        icon: "success",
        title: "Plan Generated!",
        text: "Your 7-day workout & meal plan is ready.",
      });
      navigate("/dashboard");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: error.response?.data?.message || "AI Service Timeout",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container text-center mt-5">
      <h1 className="display-4 fw-bold mb-3">AI Workout Generator</h1>
      <p className="lead text-muted mb-5">
        Let our advanced AI build a personalized 7-day routine based on your
        body stats and goals.
      </p>

      <div className="d-flex justify-content-center">
        {loading ? (
          <button className="btn btn-secondary btn-lg disabled px-5 py-3">
            <span className="spinner-border spinner-border-sm me-2"></span>
            Generating Plan...
          </button>
        ) : (
          <button
            onClick={handleGenerate}
            className="btn btn-warning btn-lg px-5 py-3 fw-bold shadow"
          >
            ✨ Generate My Plan Now
          </button>
        )}
      </div>
    </div>
  );
}
