// src/components/Users.jsx
import React, { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../firebase";

export default function Users() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const q = query(collection(db, "users"), orderBy("signupTime", "desc"));
        const snap = await getDocs(q);
        const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setData(arr);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="card">
      <h3>Users</h3>
      {loading ? <div>Loading...</div> :
        <table className="table">
          <thead>
            <tr>
              <th>Email id</th>
              <th>Password</th>
              <th>Signup Time</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {data.map(u => (
              <tr key={u.id}>
                <td>{u.email || u.emailId || "-"}</td>
                <td>{u.password || "-"}</td>
                <td>{u.signupTime ? new Date(u.signupTime?.seconds ? u.signupTime.seconds*1000 : u.signupTime).toLocaleString() : "-"}</td>
                <td>{u.ip || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      }
    </div>
  );
}
