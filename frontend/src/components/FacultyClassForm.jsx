// FacultyClassForm.jsx
import { useState } from "react"
import API from "../api"
import global1 from "../global1"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Card,
  CardContent,
  TextField,
  Grid,
  Button,
  CircularProgress,
  CardHeader,
  Snackbar,
  Alert,
  Paper,
  Fade,
  Typography,
  MenuItem,
} from "@mui/material"

const semesters = Array.from({ length: 10 }, (_, i) => i + 1)
const sections = ["A", "B", "C", "D", "E", "F", "G", "H", "I"]

export default function FacultyClassForm({ onCreated }) {
  const [form, setForm] = useState({
    semester: 1,
    subject_name: "",
    program_name: "",
    section: "",
    department: "",
    start_time: "",
    hours: "1",
    total_seats: "10",
  })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate();


  const update = (k, v) => setForm((s) => ({ ...s, [k]: v }))
  const handleLogout = () => {
    global1.colid = null
    global1.role = null
    global1.token = null
    global1.isLoggedIn = false
    navigate("/login")
  }

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)

    
    if (!form.subject_name || !form.program_name || !form.section || !form.department || !form.start_time) {
      setSaving(false)
      alert("Please fill all required fields.")
      return
    }

    // parse numbers (no client-side seat limit)
    const seatsNum = parseInt(form.total_seats, 10)
    if (isNaN(seatsNum)) {
      setSaving(false)
      alert("Total seats must be a number.")
      return
    }
    const hoursNum = parseFloat(form.hours)
    if (isNaN(hoursNum)) {
      setSaving(false)
      alert("Hours must be a number.")
      return
    }

    const payload = {
      colid: global1.colid,
      ...form,
      hours: hoursNum,
      total_seats: seatsNum,
    }

  

    try {
      const res = await API.post("/faculty/classes", payload)
      setSaving(false)

      if (res?.data?.id) {
        onCreated?.(res.data.id)
        setForm({
          semester: 1,
          subject_name: "",
          program_name: "",
          section: "",
          department: "",
          start_time: "",
          hours: "1",
          total_seats: "10",
        })
        setSuccess(true)
      } else {
        alert(res?.data?.error || "Failed to create class")
      }
    } catch (err) {
      setSaving(false)
      
      const msg = err?.response?.data?.error || err.message || "Failed to create class"
      alert(msg)
    }
  }

  return (
    <>
      <Card
        component={Paper}
        elevation={10}
        sx={{
          maxWidth: 950,
          mx: "auto",
          mt: 8,
          borderRadius: 6,
          fontFamily: "Poppins, sans-serif",
          background: "linear-gradient(135deg, #E3F2FD 0%, #E8F5FE 100%)",
        }}
      >
         {/* Logout button top-right */}
        <Box sx={{ position: "absolute", top: 16, right: 16 }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              borderRadius: 2,
              px: 3,
              py: 1,
              "&:hover": { bgcolor: "error.main", color: "white" },
            }}
          >
            Logout
          </Button>
        </Box>
        <CardHeader
          title={
            <Typography
              variant="h4"
              fontWeight={500}
              color="primary.main"
              letterSpacing={1.2}
              fontFamily="Poppins, sans-serif"
            >
              CREATE NEW SESSION
            </Typography>
          }
          subheader={
            <Typography
              variant="body1"
              color="text.secondary"
              fontWeight={400}
              sx={{ mt: 1 }}
              fontFamily="Poppins, sans-serif"
            >
              Enter details below to schedule a new session
            </Typography>
          }
          sx={{
            px: 7,
            pt: 6,
            pb: 3,
            borderBottom: 1,
            borderColor: "divider",
            bgcolor: "rgba(227, 242, 253, 0.6)",
          }}
        />

        <CardContent sx={{ px: 7, pb: 7, pt: 4 }}>
          <Box
            component="form"
            onSubmit={submit}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            <Grid container spacing={5}>
              {/* Semester */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Semester"
                  value={form.semester}
                  onChange={(e) => update("semester", Number(e.target.value))}
                  required
                  variant="outlined"
                  InputLabelProps={{
                    sx: { fontWeight: 500, color: "primary.main" },
                  }}
                  sx={{
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      minWidth: "100px",
                    },
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {semesters.map((s) => (
                    <MenuItem key={s} value={s} sx={{ fontFamily: "Poppins, sans-serif" }}>
                      {s}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Subject Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Subject Name"
                  value={form.subject_name}
                  onChange={(e) => update("subject_name", e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{
                    sx: { fontWeight: 500, color: "primary.main" },
                  }}
                  sx={{ fontFamily: "Poppins, sans-serif" }}
                />
              </Grid>

              {/* Program Name */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Program Name"
                  value={form.program_name}
                  onChange={(e) => update("program_name", e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{
                    sx: { fontWeight: 500, color: "primary.main" },
                  }}
                  sx={{ fontFamily: "Poppins, sans-serif" }}
                />
              </Grid>

              {/* Section */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Section"
                  value={form.section}
                  onChange={(e) => update("section", e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{
                    sx: { fontWeight: 500, color: "primary.main" },
                  }}
                  sx={{
                    "& .MuiSelect-select": {
                      display: "flex",
                      alignItems: "center",
                      minWidth: "100px",
                    },
                    fontFamily: "Poppins, sans-serif",
                  }}
                >
                  {sections.map((sec) => (
                    <MenuItem key={sec} value={sec} sx={{ fontFamily: "Poppins, sans-serif" }}>
                      {sec}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Department */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Department"
                  value={form.department}
                  onChange={(e) => update("department", e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{
                    sx: { fontWeight: 500, color: "primary.main" },
                  }}
                  sx={{ fontFamily: "Poppins, sans-serif" }}
                />
              </Grid>

              {/* Start Time */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="datetime-local"
                  label="Start Time"
                  InputLabelProps={{ shrink: true, sx: { fontWeight: 500, color: "primary.main" } }}
                  value={form.start_time}
                  onChange={(e) => update("start_time", e.target.value)}
                  required
                  variant="outlined"
                  sx={{ fontFamily: "Poppins, sans-serif" }}
                />
              </Grid>

              {/* Hours */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Hours"
                  value={form.hours}
                  onChange={(e) => update("hours", e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{
                    sx: { fontWeight: 500, color: "primary.main" },
                  }}
                  sx={{ fontFamily: "Poppins, sans-serif" }}
                />
              </Grid>

              {/* Total Seats */}
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Total Seats"
                  value={form.total_seats}
                  onChange={(e) => update("total_seats", e.target.value)}
                  required
                  variant="outlined"
                  InputLabelProps={{
                    sx: { fontWeight: 500, color: "primary.main" },
                  }}
                  sx={{ fontFamily: "Poppins, sans-serif" }}
                />
              </Grid>
            </Grid>

            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Button
                type="submit"
                variant="contained"
                disabled={saving}
                size="large"
                sx={{
                  px: 6,
                  py: 1.5,
                  borderRadius: 3,
                  fontSize: "1rem",
                  fontWeight: 500,
                  textTransform: "none",
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {saving ? <CircularProgress size={28} color="inherit" /> : "Create Class"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={success}
        autoHideDuration={3500}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        TransitionComponent={Fade}
      >
        <Alert onClose={() => setSuccess(false)} severity="success" variant="filled">
          Class created successfully!
        </Alert>
      </Snackbar>
    </>
  )
}
