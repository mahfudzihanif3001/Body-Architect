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
      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      Swal.fire({
        icon: "error",
        title: "Failed",
        background: "#000",
        color: "#fff",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 text-center container">
      <h1 className="display-1 fw-bold mb-4">LETS GENERATE</h1>
      <p className="form-label mb-2" style={{ maxWidth: "600px" }}>
        AI analysis of your biometrics is ready. Generate your 7-day
        high-performance schedule now.
      </p>

      {loading ? (
        <div
          className="spinner-border text-white"
          style={{ width: "3rem", height: "3rem" }}
        ></div>
      ) : (
        <button
          onClick={handleGenerate}
          className="btn btn-mono btn-lg px-5 py-4 fs-4"
        >
          GENERATE
        </button>
      )}
    </div>
  );
}
