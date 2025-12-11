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
        Swal.fire({
          title: "Error",
          text: "Failed to fetch users",
          icon: "error",
          background: "#000",
          color: "#fff",
        });
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
        title: "ARE YOU SURE?",
        text: "User will be deleted permanently.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#fff",
        cancelButtonColor: "#333",
        confirmButtonText: "YES, DELETE",
        cancelButtonText: "CANCEL",
        background: "#000",
        color: "#fff",
        customClass: {
          confirmButton: "btn btn-mono",
          cancelButton: "btn btn-outline-light",
        },
      });

      if (result.isConfirmed) {
        await api.delete(`/admin/users/${id}`);
        Swal.fire({
          title: "Deleted!",
          text: "User has been deleted.",
          icon: "success",
          background: "#000",
          color: "#fff",
        });
        fetchUsers();
      }
    } catch (error) {
      console.log(error);
      Swal.fire({
        title: "Error",
        text: "Failed to delete user",
        icon: "error",
        background: "#000",
        color: "#fff",
      });
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
      Swal.fire({
        title: "Success",
        text: "User updated successfully",
        icon: "success",
        background: "#000",
        color: "#fff",
      });
      fetchUsers();
    } catch (error) {
      console.log(error);

      Swal.fire({
        title: "Error",
        text: "Failed to update user",
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

  return (
    <div className="container pb-5 pt-5 mt-5">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h2 className="fw-bold text-white text-uppercase display-6">
          User Management
        </h2>
        <Link
          to="/dashboard"
          className="btn btn-outline-light rounded-0 text-uppercase fw-bold"
        >
          &laquo; Dashboard
        </Link>
      </div>

      <div className="glass-panel p-0 border border-secondary">
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0 bg-transparent">
            <thead>
              <tr className="border-bottom border-secondary">
                <th className="p-4 text-muted-light small text-uppercase font-weight-bold">
                  User
                </th>
                <th className="p-4 text-muted-light small text-uppercase font-weight-bold">
                  Age / Gender
                </th>
                <th className="p-4 text-muted-light small text-uppercase font-weight-bold">
                  Goal
                </th>
                <th className="p-4 text-muted-light small text-uppercase font-weight-bold">
                  Activity
                </th>
                <th className="p-4 text-muted-light small text-uppercase font-weight-bold">
                  Status
                </th>
                <th className="p-4 text-muted-light small text-uppercase font-weight-bold">
                  Role
                </th>
                <th className="p-4 text-end text-muted-light small text-uppercase font-weight-bold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {users.length > 0 ? (
                users.map((user) => (
                  <tr key={user.id} className="border-secondary">
                    {/* Name & Email */}
                    <td className="p-4">
                      <div className="fw-bold text-white">{user.username}</div>
                      <small className="text-muted">{user.email}</small>
                    </td>

                    {/* Age & Gender */}
                    <td className="p-4 text-white">
                      {user.age} <small className="text-muted">yo</small>{" "}
                      <span className="text-muted mx-1">|</span>{" "}
                      <span className="text-uppercase">{user.gender}</span>
                    </td>

                    {/* Goal */}
                    <td className="p-4">
                      <span className="badge border border-white bg-transparent rounded-0 text-uppercase">
                        {user.goal?.replace("_", " ")}
                      </span>
                    </td>

                    {/* Activity */}
                    <td className="p-4 text-white text-capitalize">
                      {user.activityLevel}
                    </td>

                    {/* Tracking Status */}
                    <td className="p-4">
                      {user.tracking_status === "On Track" ? (
                        <span className="text-success fw-bold text-uppercase small">
                          ● Active
                        </span>
                      ) : (
                        <span className="text-muted fw-bold text-uppercase small">
                          ○ No Plan
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span
                        className={`fw-bold text-uppercase ${
                          user.role === "admin" ? "text-danger" : "text-white"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-end p-4">
                      <button
                        onClick={() => openEditModal(user)}
                        className="btn btn-sm btn-outline-light rounded-0 me-2 text-uppercase"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="btn btn-sm btn-outline-danger rounded-0 text-uppercase"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-5 text-muted">
                    NO USERS FOUND IN DATABASE.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && editForm && (
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
                    Edit User
                  </h5>
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <form>
                    <div className="mb-3">
                      <label className="form-label text-muted-light small">
                        USERNAME
                      </label>
                      <input
                        name="username"
                        className="form-control text-white bg-dark border-secondary rounded-0"
                        value={editForm.username}
                        onChange={handleEditChange}
                      />
                    </div>
                    <div className="row g-2 mb-3">
                      <div className="col">
                        <label className="form-label text-muted-light small">
                          AGE
                        </label>
                        <input
                          name="age"
                          type="number"
                          className="form-control text-white bg-dark border-secondary rounded-0"
                          value={editForm.age}
                          onChange={handleEditChange}
                        />
                      </div>
                      <div className="col">
                        <label className="form-label text-muted-light small">
                          GENDER
                        </label>
                        <select
                          name="gender"
                          className="form-select text-white bg-dark border-secondary rounded-0"
                          value={editForm.gender}
                          onChange={handleEditChange}
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                        </select>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label text-muted-light small">
                        GOAL
                      </label>
                      <select
                        name="goal"
                        className="form-select text-white bg-dark border-secondary rounded-0"
                        value={editForm.goal}
                        onChange={handleEditChange}
                      >
                        <option value="weight_loss">Weight Loss</option>
                        <option value="muscle_build">Muscle Build</option>
                        <option value="maintenance">Maintenance</option>
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="form-label text-muted-light small">
                        ROLE
                      </label>
                      <select
                        name="role"
                        className="form-select text-white bg-dark border-secondary rounded-0"
                        value={editForm.role}
                        onChange={handleEditChange}
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </form>
                </div>
                <div className="modal-footer border-secondary">
                  <button
                    className="btn btn-outline-light rounded-0 text-uppercase"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                  <button
                    className="btn btn-mono text-uppercase fw-bold"
                    onClick={handleSaveEdit}
                  >
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
