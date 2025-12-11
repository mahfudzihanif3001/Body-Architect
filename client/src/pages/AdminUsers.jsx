import { useEffect, useState } from "react";
import { api } from "../helpers/http-client";
import Swal from "sweetalert2";
import { Link } from "react-router";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (error) {
      console.error(error);
      if (error.response && error.response.status !== 404) {
        Swal.fire("Error", "Failed to fetch users", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "User will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        await api.delete(`/admin/users/${id}`);
        Swal.fire("Deleted!", "User has been deleted.", "success");
        fetchUsers();
      }
    } catch (error) {
      Swal.fire("Error", "Failed to delete user", "error");
    }
  };

  const openEditModal = (user) => {
    setEditForm(user);
    setShowModal(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSaveEdit = async () => {
    try {
      await api.put(`/admin/users/${editForm.id}`, editForm);
      setShowModal(false);
      Swal.fire("Success", "User updated successfully", "success");
      fetchUsers();
    } catch (error) {
      Swal.fire("Error", "Failed to update user", error);
    }
  };

  if (loading)
    return (
      <div className="text-center mt-5">
        <div className="spinner-border text-primary"></div>
      </div>
    );

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">👥 User Management</h2>
        <Link to="/dashboard" className="btn btn-secondary">
          Back to Dashboard
        </Link>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="p-3">User</th>
                  <th>Age / Gender</th>
                  <th>Goal</th>
                  <th>Activity Level</th>
                  <th>Status</th>
                  <th>Role</th>
                  <th className="text-end p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <tr key={user.id}>
                      {/* Name & Email */}
                      <td className="p-3">
                        <div className="fw-bold">{user.username}</div>
                        <small className="text-muted">{user.email}</small>
                      </td>

                      {/* Age & Gender */}
                      <td>
                        {user.age} yo <span className="text-muted mx-1">|</span>{" "}
                        {user.gender}
                      </td>

                      {/* Goal */}
                      <td>
                        <span
                          className={`badge ${
                            user.goal === "muscle_build"
                              ? "bg-primary"
                              : user.goal === "weight_loss"
                              ? "bg-danger"
                              : "bg-success"
                          }`}
                        >
                          {user.goal?.replace("_", " ")}
                        </span>
                      </td>

                      {/* Activity */}
                      <td>{user.activityLevel}</td>

                      {/* Tracking Status */}
                      <td>
                        {user.tracking_status === "On Track" ? (
                          <span className="badge bg-success bg-opacity-10 text-success rounded-pill">
                            ● Active
                          </span>
                        ) : (
                          <span className="badge bg-secondary bg-opacity-10 text-secondary rounded-pill">
                            ○ No Plan
                          </span>
                        )}
                      </td>

                      {/* Role */}
                      <td>
                        <span
                          className={`fw-bold ${
                            user.role === "admin" ? "text-danger" : "text-dark"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="text-end p-3">
                        <button
                          onClick={() => openEditModal(user)}
                          className="btn btn-sm btn-outline-primary me-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn btn-sm btn-outline-danger"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-5 text-muted">
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {showModal && editForm && (
        <>
          <div className="modal-backdrop fade show"></div>
          <div className="modal fade show d-block">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="mb-3">
                      <label className="form-label">Username</label>
                      <input
                        name="username"
                        className="form-control"
                        value={editForm.username}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col">
                        <label className="form-label">Age</label>
                        <input
                          name="age"
                          type="number"
                          className="form-control"
                          value={editForm.age}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label">Gender</label>
                        <select
                          name="gender"
                          className="form-select"
                          value={editForm.gender}
                          onChange={handleEditChange}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Goal</label>
                      <select
                        name="goal"
                        className="form-select"
                        value={editForm.goal}
                        onChange={handleEditChange}
                      >
                        <option value="weight_loss">Weight Loss</option>
                        <option value="muscle_build">Muscle Build</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Role</label>
                      <select
                        name="role"
                        className="form-select"
                        value={editForm.role}
                        onChange={handleEditChange}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </form>
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                  <button className="btn btn-primary" onClick={handleSaveEdit}>
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
