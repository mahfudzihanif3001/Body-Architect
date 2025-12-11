import { useEffect, useState } from "react";
import { Link } from "react-router";
import { api } from "../helpers/http-client";

export default function Home() {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("access_token");

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("createdAt_desc");
  const [, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/", {
          params: { page, limit: 9, search, type, sort },
        });
        setExercises(data.data);
        setTotalPages(data.pagination.totalPages);
      } catch (error) {
        console.error("Failed to fetch exercises", error);
      } finally {
        setLoading(false);
      }
    };
    const timeoutId = setTimeout(() => {
      fetchExercises();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [page, search, type, sort]);

  const handleFilterChange = (setter, value) => {
    setter(value);
    setPage(1);
  };

  return (
    <div className="pb-5">
      <div className="px-4 py-5 text-center bg-dark text-white mb-5 shadow">
        <h1 className="display-4 fw-bold">Body Architect</h1>
        <div className="col-lg-6 mx-auto">
          <p className="lead mb-4 text-white-50">
            Transform your body with science-backed, AI-generated meal and
            workout plans.
          </p>

          <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
            {!token ? (
              <>
                <Link
                  to="/register"
                  className="btn btn-warning btn-lg px-4 gap-3 fw-bold"
                >
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline-light btn-lg px-4">
                  Login
                </Link>
              </>
            ) : (
              <Link
                to="/dashboard"
                className="btn btn-success btn-lg px-5 gap-3 fw-bold shadow"
              >
                Go to Dashboard &raquo;
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="text-center mb-4">
          <h2 className="fw-bold">🔥 Workout Library</h2>
        </div>

        <div className="row g-2 mb-4 bg-light p-3 rounded shadow-sm">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Search..."
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
              <option value="">All Types</option>
              <option value="Strength">Strength</option>
              <option value="Cardio">Cardio</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select"
              value={sort}
              onChange={(e) => handleFilterChange(setSort, e.target.value)}
            >
              <option value="createdAt_desc">Newest</option>
              <option value="calories_desc">Calories High</option>
            </select>
          </div>
          <div className="col-md-2">
            <button
              className="btn btn-secondary w-100"
              onClick={() => {
                setSearch("");
                setType("");
                setSort("createdAt_desc");
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border"></div>
          </div>
        ) : (
          <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 g-4">
            {exercises.map((item, idx) => (
              <div className="col" key={idx}>
                <div className="card h-100 border-0 shadow-sm rounded-4 bg-white">
                  <div className="card-body p-4">
                    <span className="badge bg-warning text-dark mb-3">
                      {item.type}
                    </span>
                    <h5 className="fw-bold">{item.name}</h5>
                    <div className="d-flex justify-content-between text-muted small my-3">
                      <span>{item.duration_mins || 15} mins</span>
                      <span>{item.calories_burned} kcal</span>
                    </div>
                    <a
                      href={`https://www.youtube.com/results?search_query=${item.name}`}
                      target="_blank"
                      className="btn btn-outline-danger btn-sm w-100"
                    >
                      Watch Tutorial
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
