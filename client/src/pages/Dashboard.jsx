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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

      Swal.fire({ icon: "error", title: "Error", text: "Update failed" });
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

      Swal.fire("Error", "Failed to load profile", "error");
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
      Swal.fire("Success", "Profile updated successfully!", "success");
      fetchData();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Update failed",
        "error"
      );
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );

  const hasPlan = data?.today_plan && typeof data.today_plan === "object";
  const isAdmin = data?.role?.toLowerCase() === "admin";

  const chartData = {
    labels: data?.weekly_stats?.labels || [],
    datasets: [
      {
        label: "Food (Intake)",
        data: data?.weekly_stats?.intake || [],
        backgroundColor: "rgba(25, 135, 84, 0.7)",
        borderRadius: 4,
      },
      {
        label: "Workout (Burned)",
        data: data?.weekly_stats?.burned || [],
        backgroundColor: "rgba(220, 53, 69, 0.7)",
        borderRadius: 4,
      },
    ],
  };

  return (
    <div className="container pb-5">
      <div className="d-flex justify-content-between align-items-center bg-light p-4 rounded-3 shadow-sm border mt-4 flex-wrap gap-3">
        <div>
          <h1 className="fw-bold m-0">{data?.message}</h1>
          <div className="d-flex gap-2 align-items-center mt-2">
            <span className="badge bg-dark">{data?.role}</span>

            <button
              onClick={handleOpenProfile}
              className="btn btn-sm btn-outline-primary fw-bold"
            >
              👤 Edit Profile
            </button>
          </div>
        </div>

        {!isAdmin &&
          data?.date_range?.start &&
          data.date_range.start !== "-" && (
            <div className="text-end">
              <small className="text-muted fw-bold d-block">ACTIVE PLAN</small>
              <span className="fs-5 fw-bold">
                {format(parseISO(data.date_range.start), "d MMM")} -{" "}
                {format(parseISO(data.date_range.end), "d MMM yyyy")}
              </span>
            </div>
          )}
      </div>

      {!isAdmin && (
        <>
          <div className="row g-4 my-4">
            <div className="col-lg-4 d-flex flex-column gap-3">
              <div className="card bg-success text-white border-0 shadow-sm flex-fill text-center py-4">
                <h6 className="opacity-75">Today's Intake</h6>
                <h2 className="display-4 fw-bold">
                  {data?.today_summary?.calories_intake || 0}
                </h2>
                <small>kcal</small>
              </div>
              <div className="card bg-danger text-white border-0 shadow-sm flex-fill text-center py-4">
                <h6 className="opacity-75">Today's Burn</h6>
                <h2 className="display-4 fw-bold">
                  {data?.today_summary?.calories_burned || 0}
                </h2>
                <small>kcal</small>
              </div>
            </div>
            <div className="col-lg-8">
              <div className="card border-0 shadow-sm h-100 p-3">
                <Bar
                  options={{
                    responsive: true,
                    plugins: {
                      title: { display: true, text: "Weekly Progress" },
                    },
                  }}
                  data={chartData}
                />
              </div>
            </div>
          </div>

          {!hasPlan ? (
            <div className="alert alert-warning text-center p-5 rounded-4 shadow-sm">
              <h3>No Active Plan</h3>
              <p>Generate your AI plan to start tracking.</p>
              <Link to="/generate-plan" className="btn btn-dark">
                Generate Plan
              </Link>
            </div>
          ) : (
            <div className="row">
              {/* WORKOUT SECTION */}
              <div className="col-12 mb-5">
                <div className="d-flex align-items-center gap-2 mb-3">
                  <span className="fs-2">🔥</span>
                  <h3 className="fw-bold m-0">Today's Workout</h3>
                </div>
                <div className="row row-cols-1 row-cols-md-3 g-4">
                  {data.today_plan.Workouts.map((workout) => (
                    <div className="col" key={workout.id}>
                      <div
                        className={`card h-100 border-0 shadow-sm rounded-4 ${
                          workout.isCompleted
                            ? "bg-light opacity-75"
                            : "bg-white"
                        }`}
                      >
                        <div className="card-body d-flex flex-column p-4">
                          <div className="d-flex justify-content-between mb-3">
                            <span
                              className={`badge ${
                                workout.type === "Strength"
                                  ? "bg-primary"
                                  : "bg-warning text-dark"
                              }`}
                            >
                              {workout.type}
                            </span>
                            {workout.isCompleted && (
                              <span className="text-success fw-bold">
                                Done ✅
                              </span>
                            )}
                          </div>
                          <h5
                            className={`card-title fw-bold mb-3 ${
                              workout.isCompleted
                                ? "text-decoration-line-through text-muted"
                                : ""
                            }`}
                          >
                            {workout.name}
                          </h5>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <div className="d-flex align-items-center gap-1 text-muted">
                              <span className="fw-bold">
                                {workout.duration_mins} mins
                              </span>
                            </div>
                            <div className="d-flex align-items-center gap-1 text-danger">
                              <span className="fw-bold">
                                {workout.calories_burned} kcal
                              </span>
                            </div>
                          </div>
                          <div className="alert alert-light border mb-4 py-2 px-3 text-center">
                            <small
                              className="text-muted fw-bold text-uppercase"
                              style={{ fontSize: "0.7rem" }}
                            >
                              Instruction
                            </small>
                            <div className="fw-bold text-dark">
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
                              className="btn btn-outline-danger btn-sm"
                            >
                              ▶ Watch Tutorial
                            </a>
                            <button
                              onClick={() =>
                                handleToggle(
                                  "workout",
                                  workout.id,
                                  workout.isCompleted
                                )
                              }
                              className={`btn btn-sm fw-bold ${
                                workout.isCompleted
                                  ? "btn-secondary"
                                  : "btn-success"
                              }`}
                            >
                              {workout.isCompleted ? "Undo" : "Mark as Done"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="col-12 mb-5">
                <h3 className="fw-bold mb-3">🥗 Nutrition Plan</h3>
                <div className="list-group shadow-sm rounded-4">
                  {data.today_plan.Meals.map((meal) => (
                    <div
                      key={meal.id}
                      className={`list-group-item list-group-item-action d-flex align-items-center gap-3 p-3 ${
                        meal.isCompleted ? "bg-light" : ""
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
                        className="form-check-input"
                        style={{ width: "1.5em", height: "1.5em" }}
                      />
                      <div className="w-100 d-flex justify-content-between align-items-center">
                        <div>
                          <h6
                            className={`mb-0 ${
                              meal.isCompleted
                                ? "text-decoration-line-through text-muted"
                                : "fw-bold"
                            }`}
                          >
                            {meal.name}
                          </h6>
                          <small className="badge bg-secondary bg-opacity-10 text-secondary text-capitalize">
                            {meal.type}
                          </small>
                        </div>
                        <span className="fw-bold text-success">
                          {meal.calories} kcal
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

      {isAdmin && (
        <div className="row g-4 mt-2">
          <div className="col-md-6">
            <div className="card text-white bg-primary bg-gradient mb-3 shadow border-0 h-100 rounded-4">
              <div className="card-body text-center p-5">
                <h6 className="opacity-75">Total Users</h6>
                <h1 className="card-title display-3 fw-bold">
                  {data.statistics?.total_users || 0}
                </h1>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card text-white bg-success bg-gradient mb-3 shadow border-0 h-100 rounded-4">
              <div className="card-body text-center p-5">
                <h6 className="opacity-75">Active Plans</h6>
                <h1 className="card-title display-3 fw-bold">
                  {data.statistics?.active_plans || 0}
                </h1>
              </div>
            </div>
          </div>
          <div className="col-12 text-end">
            <Link to="/admin/users" className="btn btn-dark btn-lg shadow-sm">
              👥 Manage All Users &rarr;
            </Link>
          </div>
          <div className="col-12">
            <div className="card shadow-sm border-0 rounded-4">
              <div className="card-header bg-dark text-white fw-bold py-3 rounded-top-4">
                Recent Registrations
              </div>
              <ul className="list-group list-group-flush">
                {data.recent_registrations?.map((user) => (
                  <li
                    key={user.id}
                    className="list-group-item d-flex justify-content-between align-items-center p-3"
                  >
                    <div>
                      <span className="fw-bold d-block">{user.username}</span>
                      <small className="text-muted">{user.email}</small>
                    </div>
                    <span className="badge bg-secondary rounded-pill">
                      Joined: {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {showProfileModal && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit My Profile</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowProfileModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form onSubmit={handleSaveProfile}>
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        name="username"
                        className="form-control"
                        value={profileForm.username}
                        onChange={handleProfileChange}
                        required
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col">
                        <label className="form-label">Weight (kg)</label>
                        <input
                          name="weight"
                          type="number"
                          className="form-control"
                          value={profileForm.weight}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">Height (cm)</label>
                        <input
                          name="height"
                          type="number"
                          className="form-control"
                          value={profileForm.height}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">Age</label>
                        <input
                          name="age"
                          type="number"
                          className="form-control"
                          value={profileForm.age}
                          onChange={handleProfileChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Goal</label>
                      <select
                        name="goal"
                        className="form-select"
                        value={profileForm.goal}
                        onChange={handleProfileChange}
                      >
                        <option value="weight_loss">Weight Loss</option>
                        <option value="muscle_build">Muscle Build</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Activity Level</label>
                      <select
                        name="activityLevel"
                        className="form-select"
                        value={profileForm.activityLevel}
                        onChange={handleProfileChange}
                      >
                        <option value="sedentary">Sedentary</option>
                        <option value="moderate">Moderate</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowProfileModal(false)}
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-primary">
                        Save Changes
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
