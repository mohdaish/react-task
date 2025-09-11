// src/components/Dashboard.js
import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
  updateDoc,   // ✅ added
} from "firebase/firestore";
import { db } from "../firebase";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import ListColumn from "./ListColumn";

export default function Dashboard({ user }) {
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);

  const priorityColors = {
    High: "bg-red-200 text-red-800",
    Medium: "bg-yellow-200 text-yellow-800",
    Low: "bg-green-200 text-green-800",
  };

  // Subscribe to lists
  useEffect(() => {
    const q = query(
      collection(db, "lists"),
      where("userId", "==", user.uid),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setLists(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [user.uid]);

  // Subscribe to tasks
  useEffect(() => {
    const q = query(
      collection(db, "tasks"),
      where("userId", "==", user.uid),
      orderBy("order", "asc")
    );
    const unsub = onSnapshot(q, (snap) =>
      setTasks(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, [user.uid]);

  // Create new list
  const addList = async (name) => {
    if (!name.trim()) return;
    await addDoc(collection(db, "lists"), {
      name,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  // Create new task
  const addTask = async (listId, taskData) => {
    const tasksInList = tasks.filter((t) => t.listId === listId);
    await addDoc(collection(db, "tasks"), {
      ...taskData,
      listId,
      userId: user.uid,
      order: tasksInList.length,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // ✅ also bump list's updatedAt
    await updateDoc(doc(db, "lists", listId), {
      updatedAt: serverTimestamp(),
    });
  };

  // Handle drag & drop
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const movedTask = tasks.find((t) => t.id === draggableId);
    if (!movedTask) return;

    const batch = writeBatch(db);

    const isPriorityDrop = destination.droppableId.includes("priority-");
    const isListDrop = destination.droppableId.startsWith("list-");

    // Priority drop
    if (isPriorityDrop) {
      const match = destination.droppableId.match(
        /^priority-(.+?)-(High|Medium|Low)$/
      );
      if (match) {
        const [, listId, level] = match;
        const priorityMap = { High: 1, Medium: 2, Low: 3 };
        const newPriority = priorityMap[level];

        if (movedTask.priority !== newPriority) {
          const ref = doc(db, "tasks", movedTask.id);
          batch.update(ref, {
            priority: newPriority,
            listId: movedTask.listId, // keep task in same list
            updatedAt: serverTimestamp(),
          });
        }

        // ✅ bump parent list updatedAt
        batch.update(doc(db, "lists", listId), {
          updatedAt: serverTimestamp(),
        });

        await batch.commit();
        return;
      }
    }

    // List drop
    if (isListDrop) {
      const sourceListId = source.droppableId.replace("list-", "");
      const destListId = destination.droppableId.replace("list-", "");

      const destTasks = tasks
        .filter((t) => t.listId === destListId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

      if (sourceListId === destListId) {
        destTasks.splice(source.index, 1);
      }

      destTasks.splice(destination.index, 0, movedTask);

      if (movedTask.listId !== destListId) {
        const ref = doc(db, "tasks", movedTask.id);
        batch.update(ref, {
          listId: destListId,
          updatedAt: serverTimestamp(),
        });

        // ✅ bump both lists
        batch.update(doc(db, "lists", sourceListId), {
          updatedAt: serverTimestamp(),
        });
        batch.update(doc(db, "lists", destListId), {
          updatedAt: serverTimestamp(),
        });
      }

      destTasks.forEach((t, idx) => {
        const ref = doc(db, "tasks", t.id);
        if ((t.order ?? 0) !== idx) {
          batch.update(ref, {
            order: idx,
            updatedAt: serverTimestamp(),
          });
        }
      });

      // ✅ bump list when reordered
      batch.update(doc(db, "lists", destListId), {
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      return;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
        <span className="text-gray-600 text-sm">Welcome, {user.email}</span>
      </header>

      {/* Add List */}
      <div className="mb-8">
        <AddList onAdd={addList} />
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Task Lists */}
        <div className="flex gap-6 overflow-x-auto pb-6">
          {lists.map((list) => {
            const listTasks = tasks
              .filter((t) => t.listId === list.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

            return (
              <div
                key={list.id}
                className="bg-white rounded-xl shadow-md p-5 w-80 flex-shrink-0"
              >
                <ListColumn list={list} tasks={listTasks} onAddTask={addTask} />

                {/* Priority Drop Zones */}
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">
                    Change Task Priority (Drop here)
                  </h3>
                  <div className="flex flex-col gap-3">
                    {["High", "Medium", "Low"].map((level) => (
                      <Droppable
                        droppableId={`priority-${list.id}-${level}`}
                        key={`${list.id}-${level}`}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`rounded-xl p-3 min-h-[60px] text-center text-xs font-semibold
                              ${snapshot.isDraggingOver ? "ring-2 ring-blue-400" : ""}
                              ${priorityColors[level]}`}
                          >
                            {level}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}

/* Add List Component */
function AddList({ onAdd }) {
  const [name, setName] = useState("");

  return (
    <div className="flex gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New list name"
        className="flex-1 px-3 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button
        onClick={() => {
          if (!name.trim()) return;
          onAdd(name);
          setName("");
        }}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Add List
      </button>
    </div>
  );
}
