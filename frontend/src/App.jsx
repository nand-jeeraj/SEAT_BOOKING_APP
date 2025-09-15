import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import FacultyClassForm from "./components/FacultyClassForm";
import ClassCatalog from "./components/ClassCatalog";
import Login from "./components/Login";
import global1 from "./global1";

export default function App() {
  const [user, setUser] = useState(global1.user);
  const navigate = useNavigate();

  useEffect(() => {
    const interval = setInterval(() => {
      if (user !== global1.user) {
        setUser(global1.user);
      }
    }, 300);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogin = (data) => {
    global1.authenticated = true;
    global1.user = { id: data.user_id, name: data.name, role: data.role };
    setUser(global1.user);
    navigate(data.role === "Faculty" ? "/faculty" : "/student");
  };

  const handleLogout = () => {
    global1.authenticated = false;
    global1.user = null;
    setUser(null);
    navigate("/");
  };

  return (
    <Routes>
      {/* Login Page */}
      <Route path="/" element={<Login onLogin={handleLogin} />} />

      {/* Faculty Dashboard */}
      <Route
        path="/faculty"
        element={
          user?.role === "Faculty" ? (
            <FacultyClassForm facultyId={user.id} onCreated={() => {}} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Student Dashboard */}
      <Route
        path="/student"
        element={
          user?.role === "Student" ? (
            // ONLY ClassCatalog renders BookingList inside itself
            <ClassCatalog student={user} />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Fallback redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
