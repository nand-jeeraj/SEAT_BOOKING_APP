import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./AuthContext";
import API from "../api";
import global1 from "../global1";


import {
  Container,
  TextField,
  Typography,
  Button,
  CircularProgress,
  Paper,
  Stack,
} from "@mui/material";

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuthenticated } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await API.post(`/api/login`, form);
      if (res.data?.success && res.data?.token) {
        const role = res.data.role === "Faculty" ? "Faculty" : "Student";

        global1.authenticated = true;
        global1.token = res.data.token || "session";
        global1.user_role = role;
        global1.user_id = res.data.user_id;
        global1.user_name = res.data.name;
        global1.colid = res.data.colid;

        console.log("colid", res.data.colid);

        setAuthenticated(true);

       
        if (onLogin) {
          onLogin({
            user_id: res.data.user_id,
            name: res.data.name,
            role,
          });
        }

      
        navigate(role === "Faculty" ? "/faculty" : "/student");
      } else {
        alert(res.data?.message || "Invalid credentials");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container
      maxWidth="sm"
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom right, #f7fafc, #ebf8ff)",
      }}
    >
      <Paper elevation={4} sx={{ p: 4, borderRadius: 3, width: "100%", maxWidth: 400 }}>
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            <Typography
              variant="h5"
              textAlign="center"
              fontWeight={600}
              color="primary"
            >
              Welcome
            </Typography>

            <TextField
              type="email"
              label="Email"
              fullWidth
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              disabled={isLoading}
            />

            <TextField
              type="password"
              label="Password"
              fullWidth
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              disabled={isLoading}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              sx={{ py: 1.2, fontWeight: 600, fontSize: "1rem" }}
            >
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                  Signing In...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Container>
  );
}
