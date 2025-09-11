// src/components/Sidebar.jsx
import React from "react";

export default function Sidebar({ view, setView, onLogout }) {
  return (
    <div className="sidebar">
      <h3>Admin</h3>
      <div style={{marginTop:12}}>
        <div className={`menu-item ${view==="users"?"active":""}`} onClick={()=>setView("users")}>Users</div>
        <div className={`menu-item ${view==="lists"?"active":""}`} onClick={()=>setView("lists")}>Task Lists</div>
        <div className={`menu-item ${view==="tasks"?"active":""}`} onClick={()=>setView("tasks")}>Tasks</div>
      </div>

      <div style={{position:"absolute", bottom:20, left:20}}>
        <button className="btn" onClick={onLogout}>Logout</button>
      </div>
    </div>
  );
}
