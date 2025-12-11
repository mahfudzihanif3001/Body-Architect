import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router";
import Navbar from "./components/navbar";

// Pages
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import GeneratePlan from "./pages/generatePlan";
import AdminUsers from "./pages/AdminUsers";

function ProtectedLayout() {
  const token = localStorage.getItem("access_token");
  if (!token) return <Navigate to="/login" replace />;
  return (
    <>
      <Navbar />
      <div className="container mt-4">
        <Outlet />
      </div>
    </>
  );
}

function GuestLayout() {
  const token = localStorage.getItem("access_token");
  if (token) return <Navigate to="/dashboard" replace />;
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
        </Route>

        <Route element={<GuestLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/generate-plan" element={<GeneratePlan />} />
          <Route path="/admin/users" element={<AdminUsers />} />{" "}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
