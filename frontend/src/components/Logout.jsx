// src/components/LogoutButton.jsx
import { Button } from "@mui/material"
import { useNavigate } from "react-router-dom"
import global1 from "../global1"

export default function LogoutButton() {
  const navigate = useNavigate()

  const handleLogout = () => {
   
    global1.colid = null


    
    navigate("/login")
  }

  return (
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
  )
}
