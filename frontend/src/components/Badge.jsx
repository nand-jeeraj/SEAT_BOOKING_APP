// src/components/Badge.jsx
import React from "react";
import { Chip } from "@mui/material";

export default function Badge({ label, type }) {
  let color = "default";

  if (type === "confirmed") color = "success";
  else if (type === "waiting") color = "warning";
  else if (type === "full") color = "error";

  return (
    <Chip
      label={label}
      color={color}
      size="small"
      sx={{ fontWeight: "bold", textTransform: "uppercase" }}
    />
  );
}
