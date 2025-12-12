import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../helpers/http-client";

export default function Home() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("access_token");

  // PAGINATION STATE
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("createdAt_desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/", {
          params: { limit: 9, page, search, type, sort }, // Pass page param
        });
        setExercises(data.data);
        setTotalPages(data.pagination.totalPages); // Set total pages
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, [search, type, sort, page]); // Add page to dependency array

  // Reset page when filter changes
  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="min-vh-100 position-relative pt-5">
      {/* BACKGROUND MARQUEE */}
      <div className="marquee-container">
        <div className="marquee-content">
          ARCHITECT YOUR BODY • DESIGN YOUR STRENGTH • BUILD YOUR LEGACY •
          ARCHITECT YOUR BODY • DESIGN YOUR STRENGTH • BUILD YOUR LEGACY •
        </div>
      </div>

      {/* HERO SECTION */}
      <div
        className="container position-relative d-flex flex-column justify-content-center align-items-center text-center"
        style={{ minHeight: "80vh" }}
      >
        <h1 className="display-giant mb-2">
          BODY
          <br />
          ARCHITECT
        </h1>
        <p className="lead text-white-50 mb-5" style={{ maxWidth: "500px" }}>
          Precision engineered AI-generated meal and workout plans.
        </p>

        <div className="d-flex gap-3">
          {!token ? (
            <>
              <Link to="/register" className="btn btn-mono btn-lg px-5">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-outline-mono btn-lg px-5">
                Login
              </Link>
            </>
          ) : (
            <Link to="/dashboard" className="btn btn-mono btn-lg px-5">
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* LIBRARY SECTION */}
      <div className="container pb-5">
        <div className="glass-panel p-4 mb-5">
          <div className="row g-3">
            <div className="col-md-6">
              <input
                className="form-control text-white"
                placeholder="SEARCH WORKOUTS..."
                value={search}
                onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={type}
                onChange={(e) => handleFilterChange(setType, e.target.value)}
              >
                <option value="">ALL TYPES</option>
                <option value="Strength">STRENGTH</option>
                <option value="Cardio">CARDIO</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={sort}
                onChange={(e) => handleFilterChange(setSort, e.target.value)}
              >
                <option value="createdAt_desc">NEWEST</option>
                <option value="calories_desc">CALORIES HIGH</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-white"></div>
          </div>
        ) : (
          <>
            <div className="row row-cols-1 row-cols-md-3 g-4 mb-5">
              {exercises.map((item, idx) => (
                <div className="col" key={idx}>
                  <div className="glass-panel h-100 p-4 d-flex flex-column hover-effect">
                    <div className="d-flex justify-content-between mb-4">
                      <span className="badge bg-white text-black rounded-0 text-uppercase fw-bold p-2">
                        {item.type}
                      </span>
                      <small
                        className="text-muted-light fw-bold"
                        style={{ letterSpacing: "1px" }}
                      >
                        {item.calories_burned} KCAL
                      </small>
                    </div>

                    <h3 className="fw-bold mb-4 text-uppercase text-white">
                      {item.name}
                    </h3>

                    <div className="mt-auto">
                      <div className="d-flex justify-content-between align-items-end border-top border-secondary pt-3">
                        <span className="fs-5 fw-bold text-white">
                          {item.duration_mins} MIN
                        </span>
                        <a
                          href={`https://youtube.com/results?search_query=${item.name}`}
                          target="_blank"
                          className="text-white text-decoration-none small fw-bold"
                        >
                          WATCH TUTORIAL ↗
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* PAGINATION CONTROLS */}
            <div className="d-flex justify-content-center align-items-center gap-3">
              <button
                className="btn btn-outline-mono rounded-0"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              >
                &laquo; PREV
              </button>

              <span className="text-white fw-bold">
                PAGE {page} OF {totalPages}
              </span>

              <button
                className="btn btn-outline-mono rounded-0"
                disabled={page === totalPages || totalPages === 0}
                onClick={() =>
                  setPage((prev) => Math.min(prev + 1, totalPages))
                }
              >
                NEXT &raquo;
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
