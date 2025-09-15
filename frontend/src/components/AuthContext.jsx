
import React, { createContext, useEffect, useState } from "react";
import axios from "axios";
import global1 from "../global1";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(
    global1.authenticated === "true"
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await axios.get("/check-auth");
        setAuthenticated(res.data?.status === "ok");
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    
    const token = global1.token;
    if (token) check();
    else setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, setAuthenticated, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
