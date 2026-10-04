import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute — wraps any React Router <Route> element to enforce
 * authentication and optional role-based access control.
 *
 * Usage:
 *   <Route path="/admin/*" element={
 *     <ProtectedRoute allowedRole="admin">
 *       <AdminDashboard />
 *     </ProtectedRoute>
 *   } />
 *
 * Reads auth state from localStorage so that it stays correct even after
 * a hard page reload (e.g. following the inactivity-timeout redirect).
 *
 * Props:
 *   children    — the component tree to render when auth passes.
 *   allowedRole — optional string; if provided, the logged-in user's `role`
 *                 field must match. Redirects to "/" otherwise.
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem("token") || localStorage.getItem("mcp_access_token");

  let user = {};
  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    // Malformed JSON — treat as unauthenticated.
  }

  // No valid token → send to landing page.
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Token exists but role doesn't match the required role → send to landing page.
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
