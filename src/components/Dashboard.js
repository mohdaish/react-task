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
} from "firebase/firestore";
import { db } from "../firebase";
import { DragDropContext, Droppable } from "@hello-pangea/dnd";
import ListColumn from "./ListColumn";

export default function Dashboard({ user }) {
  const [lists, setLists] = useState([]);
  const [tasks, setTasks] = useState([]);

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
    if (!name) return;
    await addDoc(collection(db, "lists"), {
      name,
      userId: user.uid,
      createdAt: serverTimestamp(),
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

    const isPriorityDrop = destination.droppableId.startsWith("priority-");
    const isListDrop = destination.droppableId.startsWith("list-");


    // 1️⃣ Priority Drop → only update priority
   if (isPriorityDrop) {
  const level = destination.droppableId.replace("priority-", "");
  const priorityMap = { High: 1, Medium: 2, Low: 3 };
  const newPriority = priorityMap[level];

  if (movedTask.priority !== newPriority) {
    const ref = doc(db, "tasks", movedTask.id);
    batch.update(ref, { priority: newPriority });
  }

      await batch.commit();
      return;
    }

    // 2️⃣ List Drop → only update listId/order
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
        batch.update(ref, { listId: destListId });
      }

      destTasks.forEach((t, idx) => {
        const ref = doc(db, "tasks", t.id);
        if ((t.order ?? 0) !== idx) {
          batch.update(ref, { order: idx });
        }
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
              </div>
            );
          })}
        </div>

        {/* Priority Drop Zones */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Change Task Priority</h2>
          <div className="flex gap-8">
            {["High", "Medium", "Low"].map((level) => (
              <Droppable droppableId={`priority-${level}`} key={level}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="bg-gray-200 rounded-xl p-5 w-40 min-h-[100px] flex-shrink-0 text-center"
                  >
                    {level}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
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
