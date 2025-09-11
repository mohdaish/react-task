import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, getDoc } from "firebase/firestore";

function formatTimestamp(ts) {
  if (!ts) return "-";
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "-";
  }
}

export default function Tasks() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tasks"), async (snapshot) => {
      try {
        const promises = snapshot.docs.map(async (docSnap, index) => {
          const task = docSnap.data();

          // --- resolve list title ---
          const listId = task.listId || task.taskListId || null;
          let taskListTitle = "";
          if (listId) {
            try {
              const listDoc = await getDoc(doc(db, "lists", listId));
              taskListTitle = listDoc.exists() ? listDoc.data().name || "" : "";
            } catch {
              taskListTitle = "";
            }
          }

          // --- resolve creator email (userId may be uid or email) ---
          let creator =
            task.createdBy || task.userId || task.createdByEmail || "";
          let createdByEmail = "-";
          if (creator) {
            if (typeof creator === "string" && creator.includes("@")) {
              createdByEmail = creator;
            } else {
              try {
                const userDoc = await getDoc(doc(db, "users", creator));
                createdByEmail = userDoc.exists()
                  ? userDoc.data().email || creator
                  : creator;
              } catch {
                createdByEmail = creator;
              }
            }
          }

          // --- description - check multiple possible field names ---
          const description =
            task.description || task.desc || task.taskDesc || task.details || "";

          return {
            id: docSnap.id,
            sno: index + 1,
            title: task.title || task.name || "-",
            description,
            taskList: taskListTitle,
            createdBy: createdByEmail,
            createdAt: formatTimestamp(task.createdAt),
          };
        });

        const arr = await Promise.all(promises);
        setData(arr);
      } catch (err) {
        console.error("Error fetching tasks:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  return (
    <div className="card">
      <h3>Tasks</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Task Title</th>
              <th>Description</th>
              <th>Task List</th>
              <th>Created By</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id}>
                <td>{row.sno}</td>
                <td>{row.title}</td>
                <td style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {row.description}
                </td>
                <td>{row.taskList}</td>
                <td>{row.createdBy}</td>
                <td>{row.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
