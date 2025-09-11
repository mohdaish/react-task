// src/App.js
import React, { useState } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import Users from "./components/Users";
import TaskLists from "./components/TaskLists";
import Tasks from "./components/Tasks";

function App() {
  const [user, setUser] = useState(null); // simple static login
  const [view, setView] = useState("users"); // users | lists | tasks

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="app">
      <Sidebar view={view} setView={setView} onLogout={() => setUser(null)} />
      <div className="content">
        <div className="header">
          <h2>Back Office Panel</h2>
          <div>
            <span className="small-muted">Logged as: {user.username}</span>
          </div>
        </div>

        {view === "users" && <Users />}
        {view === "lists" && <TaskLists />}
        {view === "tasks" && <Tasks />}
      </div>
    </div>
  );
}

export default App;
