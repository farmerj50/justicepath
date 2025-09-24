import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Verifying...");
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setMsg("Invalid verification link.");
      return;
    }
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/verify?token=${encodeURIComponent(token)}`, {
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Verification failed");
        setMsg("Email verified! Redirecting to login...");
        setTimeout(() => navigate("/login"), 1200);
      } catch (e: any) {
        setMsg(e.message || "Verification failed.");
      }
    })();
  }, []);

  return (
    <div style={{minHeight:"60vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"#111827",color:"#fff",padding:"2rem",borderRadius:"1rem"}}>{msg}</div>
    </div>
  );
}
