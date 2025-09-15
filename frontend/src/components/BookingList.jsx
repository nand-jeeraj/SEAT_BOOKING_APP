// BookingList.jsx
import {
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  CircularProgress,
} from "@mui/material";
import API from "../api";
import { formatIndianTime } from "../utils/date";
import global1 from "../global1";
import moment from "moment";

const toDate = (d) => {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
};
const nowMs = () => Date.now();

const BookingList = forwardRef(({ student }, ref) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    if (!student) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const res = await API.get("/bookings", {
        params: {
          student_id: student?._id || student?.id,
          colid: global1.colid,
        },
      });

      const raw = res.data || [];
      const now = nowMs();
      const map = new Map();

      for (const b of raw) {
        const classId = `${b.class_id || b.classId || b.classObj || ""}-${global1.colid}`;
        const start = toDate(b.start_time || b.scheduledAt || b.scheduled_at);
        if (start && start.getTime() < now) continue;

        if (!map.has(classId)) map.set(classId, b);
        else {
          const existing = map.get(classId);
          const score = (x) => (x.status === "confirmed" ? 2 : 1);
          if (score(b) > score(existing)) map.set(classId, b);
        }
      }

      const unique = Array.from(map.values());
      unique.sort((a, b) => {
        const aStart = toDate(a.start_time || a.scheduledAt || a.scheduled_at)?.getTime() || Infinity;
        const bStart = toDate(b.start_time || b.scheduledAt || b.scheduled_at)?.getTime() || Infinity;
        return aStart - bStart;
      });
      setItems(unique);
    } catch (err) {
      console.error("Error loading bookings:", err);
      setItems([]);
    }
    setLoading(false);
  }, [student]);

  useImperativeHandle(ref, () => ({ reload: () => load() }), [load]);
  useEffect(() => { load(); }, [student, load]);

  const cancelOne = async (b) => {
    if (!window.confirm("Cancel this booking?")) return;
    try {
      const res = await API.delete(`/bookings/${b._id || b.id}`, { params: { colid: global1.colid } });
      if (res.data?.ok) {
        alert(res.data.promoted ? "Cancelled. Someone was promoted from waiting." : "Cancelled.");
        load();
      } else alert("Cancellation failed.");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      alert("Failed to cancel booking.");
    }
  };

  if (loading) return <Box display="flex" justifyContent="center" mt={5}><CircularProgress /></Box>;
  if (!items.length) return <Typography align="center" mt={3} color="text.secondary">No upcoming bookings.</Typography>;

  return (
    <Stack spacing={3} sx={{ mt: 4 }}>
      <Typography variant="h6" color="primary" align="center" fontWeight="530">
        My Bookings
      </Typography>
      {items.map((b) => {
        const start = toDate(b.start_time || b.scheduledAt || b.scheduled_at);
        const bookedAt = toDate(b.created_at || b.createdAt);

        return (
          <Card key={`${b._id || b.id || b.class_id || Math.random()}-${global1.colid}`} sx={{ borderRadius: 2, p: 2, bgcolor: "#f9f9f9" }}>
            <CardContent>
              <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">{b.subject_name || "Untitled Class"}</Typography>
                  <Chip label={(b.status || "unknown").toUpperCase()} color={b.status === "confirmed" ? "success" : "warning"} size="small" sx={{ mt: 1 }} />
                  {b.status === "waiting" && b.waiting_number && <Typography variant="body2" color="error" mt={1}>Waiting List: WL-{b.waiting_number}</Typography>}
                  <Typography variant="body2" color="text.secondary" mt={1}>
                    Scheduled at: {moment.utc(b.start_time).format('DD-MM-YYYY hh:mm A')} (IST)
                  </Typography>
                  {bookedAt && <Typography variant="body2" color="text.secondary" mt={1}>Booked at: {formatIndianTime(bookedAt)}</Typography>}
                </Box>
                <Button variant="contained" color="error" size="small" onClick={() => cancelOne(b)} sx={{ mt: { xs: 2, sm: 0 } }}>Cancel</Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
});

export default BookingList;
