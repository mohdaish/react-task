// src/components/Login.jsx
import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  // static credentials (change as needed)
  const STATIC_USER = { username: "admin", password: "admin123" };

  function handleSubmit(e) {
    e.preventDefault();
    if (username === STATIC_USER.username && password === STATIC_USER.password) {
      onLogin({ username });
    } else {
      setErr("Incorrect username or password");
    }
  }

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h3>Back Office Login</h3>
        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:10}}>
            <label>Username</label><br/>
            <input value={username} onChange={e=>setUsername(e.target.value)} style={{width:"100%", padding:8}} />
          </div>
          <div style={{marginBottom:12}}>
            <label>Password</label><br/>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} style={{width:"100%", padding:8}} />
          </div>
          {err && <div style={{color:"red", marginBottom:10}}>{err}</div>}
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <button className="btn btn-primary" type="submit">Login</button>
            <div className="small-muted">username: admin / pass: admin123</div>
          </div>
        </form>
      </div>
    </div>
  );
}
