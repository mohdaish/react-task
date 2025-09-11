import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

function formatTimestamp(ts) {
  if (!ts) return "-";

  // Firestore Timestamp object has a .toDate() method
  if (typeof ts.toDate === "function") {
    return ts.toDate().toLocaleString();
  }

  // Plain object with seconds (sometimes Firestore returns this)
  if (ts.seconds) {
    return new Date(ts.seconds * 1000).toLocaleString();
  }

  // fallback if it's already a Date or string
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "-";
  }
}

export default function TaskLists() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLists() {
      try {
        const q = query(collection(db, "lists"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        const arr = await Promise.all(
          snap.docs.map(async (docSnap, index) => {
            const list = docSnap.data();

            // --- count tasks for this list ---
            const taskQuery = query(
              collection(db, "tasks"),
              where("listId", "==", docSnap.id)
            );
            const taskSnap = await getDocs(taskQuery);
            const taskCount = taskSnap.size;

            // --- resolve creator email (userId may be uid or email) ---
            let creator = list.createdBy || list.createdByEmail || list.userId || "";
            let createdByEmail = "Unknown";
            if (creator) {
              if (typeof creator === "string" && creator.includes("@")) {
                createdByEmail = creator;
              } else {
                // assume creator is a uid -> try to read users/{uid}.email
                try {
                  const userDoc = await getDoc(doc(db, "users", creator));
                  if (userDoc.exists()) {
                    createdByEmail = userDoc.data().email || creator;
                  } else {
                    createdByEmail = creator;
                  }
                } catch {
                  createdByEmail = creator;
                }
              }
            }

            // --- last updated fallback keys ---
            const updatedField =
              list.updatedAt || list.lastUpdated || list.updated || null;

            return {
              id: docSnap.id,
              sno: index + 1,
              title: list.name || list.title || "",
              createdBy: createdByEmail,
              taskCount,
              createdAt: formatTimestamp(list.createdAt),
              updatedAt: formatTimestamp(updatedField),
            };
          })
        );

        setData(arr);
      } catch (err) {
        console.error("Error fetching lists:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchLists();
  }, []);

  return (
    <div className="card">
      <h3>Task Lists</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Task List Title</th>
              <th>Created By</th>
              <th>No. of Tasks</th>
              <th>Created At</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td>{row.sno}</td>
                <td>{row.title}</td>
                <td>{row.createdBy}</td>
                <td>{row.taskCount}</td>
                <td>{row.createdAt}</td>
                <td>{row.updatedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
