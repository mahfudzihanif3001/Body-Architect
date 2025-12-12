import { useEffect, useState } from "react";
import { api } from "../helpers/http-client";
import Swal from "sweetalert2";
import { format, parseISO } from "date-fns";
import { Link } from "react-router";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// CONFIG CHART JS FOR DARK MODE
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
ChartJS.defaults.color = "#a0a0a0";
ChartJS.defaults.borderColor = "#333";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: "",
    age: "",
    weight: "",
    height: "",
    gender: "male",
    activityLevel: "moderate",
    goal: "maintenance",
  });

  // 1. FETCH DASHBOARD DATA
  const fetchData = async () => {
    try {
      const { data } = await api.get("/dashboard");
      setData(data);
    } catch (error) {
      console.error("Dashboard Error", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. HANDLE CHECKLIST (MARK AS DONE)
  const handleToggle = async (type, id, currentStatus) => {
    try {
      await api.patch(`/items/${type}/${id}`, { isCompleted: !currentStatus });
      fetchData();
    } catch (error) {
      console.log(error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Update failed",
        background: "#000",
        color: "#fff",
      });
    }
  };

  // --- 3. PROFILE FUNCTIONS ---
  const handleOpenProfile = async () => {
    try {
      const { data } = await api.get("/profile");
      setProfileForm({
        username: data.username,
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        activityLevel: data.activityLevel,
        goal: data.goal,
      });
      setShowProfileModal(true);
    } catch (error) {
      console.log(error);
      Swal.fire({
        title: "Error",
        text: "Failed to load profile",
        icon: "error",
        background: "#000",
        color: "#fff",
      });
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm({ ...profileForm, [name]: value });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put("/profile", {
        ...profileForm,
        age: Number(profileForm.age),
        weight: Number(profileForm.weight),
        height: Number(profileForm.height),
      });

      setShowProfileModal(false);
      Swal.fire({
        title: "Success",
        text: "Profile updated successfully!",
        icon: "success",
        background: "#000",
        color: "#fff",
      });
      fetchData();
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Update failed",
        icon: "error",
        background: "#000",
        color: "#fff",
      });
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-white"></div>
      </div>
    );

  const hasPlan = data?.today_plan && typeof data.today_plan === "object";
  const isAdmin = data?.role?.toLowerCase() === "admin";

  const chartData = {
    labels: data?.weekly_stats?.labels || [],
    datasets: [
      {
        label: "INTAKE",
        data: data?.weekly_stats?.intake || [],
        backgroundColor: "#ffffff",
        barThickness: 15,
      },
      {
        label: "BURNED",
        data: data?.weekly_stats?.burned || [],
        backgroundColor: "rgba(255, 255, 255, 0.2)",
        borderColor: "#fff",
        borderWidth: 1,
        barThickness: 15,
      },
    ],
  };

  return (
    <div className="container pb-5 pt-5 mt-5">
      {/* HEADER SECTION */}
      <div className="glass-panel p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h1 className="fw-bold m-0 text-uppercase">{data?.message}</h1>
          <div className="d-flex gap-2 align-items-center mt-2">
            <span className="badge border border-white rounded-0 bg-transparent text-white text-uppercase px-3 py-2">
              {data?.role}
            </span>
            <button
              onClick={handleOpenProfile}
              className="btn btn-sm btn-outline-light rounded-0 fw-bold text-uppercase px-3"
            >
              Edit Profile
            </button>
          </div>
        </div>

        {!isAdmin &&
          data?.date_range?.start &&
          data.date_range.start !== "-" && (
            <div className="text-end">
              <small className="text-muted-light fw-bold d-block text-uppercase letter-spacing-1">
                Active Protocol
              </small>
              <span className="fs-5 fw-bold text-white">
                {format(parseISO(data.date_range.start), "d MMM")} —{" "}
                {format(parseISO(data.date_range.end), "d MMM yyyy")}
              </span>
            </div>
          )}
      </div>

      {!isAdmin && (
        <>
          {/* STATS & CHART */}
          <div className="row g-4 mb-5">
            <div className="col-lg-4 d-flex flex-column gap-4">
              <div className="glass-panel text-white text-center py-5 flex-fill d-flex flex-column justify-content-center">
                <h6 className="text-muted-light text-uppercase tracking-wider">
                  Today's Intake
                </h6>
                <h2 className="display-3 fw-bold mb-0">
                  {data?.today_summary?.calories_intake || 0}
                </h2>
                <small className="text-muted-light text-uppercase fw-bold">
                  kcal
                </small>
              </div>
              <div className="glass-panel text-white text-center py-5 flex-fill d-flex flex-column justify-content-center">
                <h6 className="text-muted-light text-uppercase tracking-wider">
                  Today's Burn
                </h6>
                <h2 className="display-3 fw-bold mb-0">
                  {data?.today_summary?.calories_burned || 0}
                </h2>
                <small className="text-muted-light text-uppercase fw-bold">
                  kcal
                </small>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="glass-panel h-100 p-4">
                <Bar
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      title: {
                        display: true,
                        text: "WEEKLY PROGRESS",
                        color: "#fff",
                        font: { weight: "bold", size: 14 },
                      },
                      legend: { labels: { color: "#fff" } },
                    },
                    scales: {
                      x: { grid: { display: false }, ticks: { color: "#888" } },
                      y: { grid: { color: "#222" }, ticks: { color: "#888" } },
                    },
                  }}
                  data={chartData}
                  style={{ minHeight: "300px" }}
                />
              </div>
            </div>
          </div>

          {!hasPlan ? (
            <div className="glass-panel text-center p-5 border border-secondary">
              <h3 className="text-white text-uppercase fw-bold">
                No Active Plan
              </h3>
              <p className="text-muted-light mb-4">
                Initialize AI generator to start your transformation protocol.
              </p>
              <Link to="/generate-plan" className="btn btn-mono btn-lg px-5">
                GENERATE PLAN
              </Link>
            </div>
          ) : (
            <div className="row">
              {/* WORKOUT SECTION */}
              <div className="col-12 mb-5">
                <div className="d-flex align-items-center gap-2 mb-4 border-bottom border-secondary pb-2">
                  <h3 className="fw-bold m-0 text-white text-uppercase">
                    Today's Workout
                  </h3>
                </div>
                <div className="row row-cols-1 row-cols-md-3 g-4">
                  {data.today_plan.Workouts.map((workout) => (
                    <div className="col" key={workout.id}>
                      <div
                        className={`glass-panel h-100 p-4 d-flex flex-column ${
                          workout.isCompleted ? "opacity-50" : ""
                        }`}
                      >
                        <div className="d-flex justify-content-between mb-4">
                          <span className="badge bg-white text-black rounded-0 text-uppercase p-2">
                            {workout.type}
                          </span>
                          {workout.isCompleted && (
                            <span className="text-white fw-bold text-uppercase small border border-white px-2 py-1">
                              DONE
                            </span>
                          )}
                        </div>
                        <h4
                          className={`fw-bold mb-3 text-uppercase ${
                            workout.isCompleted
                              ? "text-decoration-line-through text-muted"
                              : "text-white"
                          }`}
                        >
                          {workout.name}
                        </h4>

                        <div className="d-flex justify-content-between align-items-center mb-4 text-muted-light small fw-bold tracking-wider">
                          <span>{workout.duration_mins} MIN</span>
                          <span>{workout.calories_burned} KCAL</span>
                        </div>

                        <div className="border border-secondary p-3 mb-4 text-center">
                          <small
                            className="text-muted-light text-uppercase d-block mb-1"
                            style={{ fontSize: "0.65rem" }}
                          >
                            Instruction
                          </small>
                          <div className="fw-bold text-white small">
                            {workout.reps || "3 sets x 12 reps"}
                          </div>
                        </div>

                        <div className="mt-auto d-grid gap-2">
                          <a
                            href={`https://www.youtube.com/results?search_query=how+to+do+${encodeURIComponent(
                              workout.name
                            )}+exercise`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline-light rounded-0 btn-sm text-uppercase"
                          >
                            Watch Tutorial
                          </a>
                          <button
                            onClick={() =>
                              handleToggle(
                                "workout",
                                workout.id,
                                workout.isCompleted
                              )
                            }
                            className={`btn rounded-0 fw-bold text-uppercase ${
                              workout.isCompleted
                                ? "btn-outline-secondary text-white"
                                : "btn-mono"
                            }`}
                          >
                            {workout.isCompleted
                              ? "MARK UNCOMPLETED"
                              : "MARK COMPLETE"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NUTRITION SECTION */}
              <div className="col-12 mb-5">
                <h3 className="fw-bold mb-4 text-white text-uppercase border-bottom border-secondary pb-2">
                  Nutrition Protocol
                </h3>
                <div className="glass-panel p-0">
                  {data.today_plan.Meals.map((meal) => (
                    <div
                      key={meal.id}
                      className={`d-flex align-items-center gap-3 p-4 border-bottom border-secondary hover-effect ${
                        meal.isCompleted ? "bg-white bg-opacity-10" : ""
                      }`}
                      onClick={() =>
                        handleToggle("meal", meal.id, meal.isCompleted)
                      }
                      style={{ cursor: "pointer" }}
                    >
                      <input
                        type="checkbox"
                        checked={meal.isCompleted}
                        readOnly
                        className="form-check-input bg-transparent border-white rounded-0"
                        style={{ width: "1.5em", height: "1.5em" }}
                      />
                      <div className="w-100 d-flex justify-content-between align-items-center">
                        <div>
                          <h5
                            className={`mb-1 text-uppercase fw-bold ${
                              meal.isCompleted
                                ? "text-decoration-line-through text-muted"
                                : "text-white"
                            }`}
                          >
                            {meal.name}
                          </h5>
                          <span className="text-muted-light small text-uppercase fw-bold tracking-wider">
                            {meal.type}
                          </span>
                        </div>
                        <span className="fw-bold text-white fs-5">
                          {meal.calories}{" "}
                          <small className="fs-6 text-muted-light">KCAL</small>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ADMIN STATS */}
      {isAdmin && (
        <div className="row g-4 mt-2">
          <div className="col-md-6">
            <div className="glass-panel mb-3 h-100 p-5 text-center d-flex flex-column justify-content-center">
              <h6 className="text-muted-light text-uppercase tracking-wider">
                Total Users
              </h6>
              <h1 className="display-2 fw-bold text-white mb-0">
                {data.statistics?.total_users || 0}
              </h1>
            </div>
          </div>
          <div className="col-md-6">
            <div className="glass-panel mb-3 h-100 p-5 text-center d-flex flex-column justify-content-center">
              <h6 className="text-muted-light text-uppercase tracking-wider">
                Active Plans
              </h6>
              <h1 className="display-2 fw-bold text-white mb-0">
                {data.statistics?.active_plans || 0}
              </h1>
            </div>
          </div>
          <div className="col-12 text-end">
            <Link
              to="/admin/users"
              className="btn btn-mono btn-lg text-uppercase px-5"
            >
              Manage Users &rarr;
            </Link>
          </div>
          <div className="col-12">
            <div className="glass-panel p-0">
              <div className="p-3 border-bottom border-secondary">
                <h5 className="text-white fw-bold text-uppercase m-0">
                  Recent Registrations
                </h5>
              </div>
              <ul className="list-group list-group-flush bg-transparent">
                {data.recent_registrations?.map((user) => (
                  <li
                    key={user.id}
                    className="list-group-item bg-transparent text-white border-secondary d-flex justify-content-between align-items-center p-3"
                  >
                    <div>
                      <span className="fw-bold d-block">{user.username}</span>
                      <small className="text-muted-light">{user.email}</small>
                    </div>
                    <span className="badge border border-white rounded-0 fw-normal bg-transparent">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFILE */}
      {showProfileModal && (
        <>
          <div
            className="modal-backdrop fade show"
            style={{ backgroundColor: "rgba(0,0,0,0.8)" }}
          ></div>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content bg-black border border-white rounded-0">
                <div className="modal-header border-secondary">
                  <h5 className="modal-title text-white text-uppercase fw-bold">
                    Edit Profile
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowProfileModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSaveProfile}>
                    <div className="mb-3">
                      <label className="form-label text-muted-light small">
                        USERNAME
                      </label>
                      <input
                        name="username"
                        className="form-control text-white bg-dark border-secondary rounded-0"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col">
                        <label className="form-label text-muted-light small">
                          WEIGHT (KG)
                        </label>
                        <input
                          name="weight"
                          type="number"
                          className="form-control text-white bg-dark border-secondary rounded-0"
                          value={profileForm.weight}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="col">
                        <label className="form-label text-muted-light small">
                          HEIGHT (CM)
                        </label>
                        <input
                          name="height"
                          type="number"
                          className="form-control text-white bg-dark border-secondary rounded-0"
                          value={profileForm.height}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="col">
                        <label className="form-label text-muted-light small">
                          AGE
                        </label>
                        <input
                          name="age"
                          type="number"
                          className="form-control text-white bg-dark border-secondary rounded-0"
                          value={profileForm.age}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted-light small">
                        GOAL
                      </label>
                      <select
                        name="goal"
                        className="form-select text-white bg-dark border-secondary rounded-0"
                        value={profileForm.goal}
                        onChange={handleProfileChange}
                      >
                        <option value="weight_loss">Weight Loss</option>
                        <option value="muscle_build">Muscle Build</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="form-label text-muted-light small">
                        ACTIVITY LEVEL
                      </label>
                      <select
                        name="activityLevel"
                        className="form-select text-white bg-dark border-secondary rounded-0"
                        value={profileForm.activityLevel}
                        onChange={handleProfileChange}
                      >
                        <option value="sedentary">Sedentary</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-mono text-uppercase fw-bold"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-light rounded-0 text-uppercase"
                        onClick={() => setShowProfileModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
