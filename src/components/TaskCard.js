
  import React from "react";
  export default function TaskCard({ task }) {
    // format date as dd-mm-yyyy
    const formatDate = (date) => {
      if (!date) return "—";
      try {
        const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
        const day = String(d.getDate()).padStart(2, "0");
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
      } catch {
        return "—";
      }
    };

    const due = formatDate(task.dueDate);
    return (
      <div className="bg-white p-3 rounded-lg shadow border hover:shadow-md transition">
    <div className="flex justify-between items-start">
      <div>
        <div className="font-medium text-gray-800">{task.title}</div>
        <div className="text-xs text-gray-500">{task.desc}</div>
      </div>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded 
        ${task.priority === 1 ? "bg-red-100 text-red-600" : 
          task.priority === 2 ? "bg-yellow-100 text-yellow-600" : 
          "bg-green-100 text-green-600"}`}>
        {task.priority === 1 ? "High" : task.priority === 2 ? "Medium" : "Low"}
      </span>
    </div>
    <div className="mt-2 text-xs text-gray-500">Due: {due}</div>
  </div>

    );
  }
