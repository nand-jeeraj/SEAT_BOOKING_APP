// ClassCatalog.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Stack,
  Box,
  CircularProgress,
} from "@mui/material";
import API from "../api";
import BookingList from "./BookingList";
import { formatIndianTime } from "../utils/date";
import global1 from "../global1";
import { useNavigate } from "react-router-dom";

export default function ClassCatalog({ student }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const bookingListRef = useRef();
  const navigate = useNavigate();

  const toDate = (d) => {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  };


  const handleLogout = () => {
    global1.colid = null;
    global1.role = null;
    global1.token = null;
    global1.isLoggedIn = false;
    navigate("/login");
  };

  const dedupeAndFilterClasses = (arr) => {
    const seen = new Set();
    const out = [];
    const now = Date.now();
    for (const c of arr || []) {
      const id = c.id || c._id || (c._id && String(c._id));
      const key = `${id}-${global1.colid}`;
      if (seen.has(key)) continue;
      const start = toDate(c.start_time);
      if (start && start.getTime() < now) continue;
      seen.add(key);
      out.push(c);
    }
    return out;
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const resClasses = await API.get("/student/classes", {
        params: {
          student_id: student?._id || student?.id,
          colid: global1.colid,
        },
      });
      const raw = resClasses.data || [];
      const filtered = dedupeAndFilterClasses(raw);
      setItems(filtered);
    } catch (err) {
      console.error("Error loading classes:", err);
      setItems([]);
    }
    setLoading(false);
  }, [student]);

  useEffect(() => {
    if (student) load();
    else setItems([]);
  }, [student, load]);

  const book = async (cls) => {
    try {
      const res = await API.post("/bookings", {
        class_id: cls.id || cls._id,
        student_id: student._id || student.id,
        student_name: student.name,
        colid: global1.colid,
      });
      if (res.data?.status) {
        alert(`Booking ${res.data.status.toUpperCase()}`);
        await load();
        bookingListRef.current?.reload?.();
      } else if (res.data?.ok) {
        alert(`Booking ${res.data.status ? res.data.status.toUpperCase() : "CREATED"}`);
        await load();
        bookingListRef.current?.reload?.();
      } else {
        alert(res.data?.error || "Booking failed");
      }
    } catch (err) {
      if (err?.response?.status === 409) {
        alert(err.response.data?.error || "You have already booked this class.");
      } else {
        alert("Booking failed due to server error");
      }
      console.error(err);
    }
  };

  if (loading)
    return (
      <Box display="flex" justifyContent="center" mt={5}>
        <CircularProgress />
      </Box>
    );

  return (
    <>

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          Logout
        </Button>
      </Box>
      <Box display="flex" justifyContent="center" alignItems="center" mb={3}>
        <Typography
          variant="h5"
          fontWeight="550"
          color="primary"
          align="center"
        >
          Your Sessions
        </Typography>
      </Box>

      

      {/* No Classes */}
      {items.length === 0 ? (
        <Box textAlign="center" mt={3}>
          <Typography align="center" color="text.secondary">
            No upcoming classes available.
          </Typography>
        </Box>
      ) : (
        <Stack spacing={3} sx={{ mt: 2 }}>
          {items.map((cls) => {
            const seatInfo = cls.seats || {
              confirmed: 0,
              total_seats: 0,
              available: 0,
              waiting: 0,
            };
            const isFull = seatInfo.available === 0;
            const start = toDate(cls.start_time);
            const scheduledLabel = start ? formatIndianTime(start) : "TBA";

            const displayName = cls.subject_name || "Untitled Class";
            const semester = cls.semester || "";

            return (
              <Card
                key={`${cls.id || cls._id}-${global1.colid}`}
                elevation={4}
                sx={{ borderRadius: 3, p: 2, bgcolor: "#fafafa" }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      {displayName}
                    </Typography>
                    <Chip
                      label={`Scheduled: ${scheduledLabel}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Stack>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Semester : <b>{semester}</b>
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Department : <b>{cls.department ? cls.department.toUpperCase() : ""}</b>
                  </Typography>

                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography variant="body2">
                      Duration: {cls.hours} hr(s)
                    </Typography>
                    <Chip
                      label={`Seats: ${seatInfo.confirmed}/${seatInfo.total_seats} (Avail: ${seatInfo.available})`}
                      size="small"
                      color={
                        seatInfo.available > 0
                          ? "success"
                          : seatInfo.waiting > 0
                          ? "warning"
                          : "error"
                      }
                    />
                  </Stack>

                  {isFull && seatInfo.waiting > 0 && (
                    <Typography variant="body2" color="error" mt={2}>
                      Waiting List (WL-{seatInfo.waiting})
                    </Typography>
                  )}

                  <Box mt={2} textAlign="right">
                    <Button
                      variant="contained"
                      color={isFull ? "warning" : "primary"}
                      onClick={() => book(cls)}
                      sx={{ borderRadius: 2, textTransform: "none", px: 3 }}
                    >
                      {isFull ? "Join Waiting List" : "Book Seat"}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}

      {student && <BookingList ref={bookingListRef} student={student} />}
    </>
  );
}
