// components/StatCard.jsx
import React from "react";
import Spinner from "./Spinner";

const colorStyles = {
  blue: {
    border: "border-blue-500",
    bg: "bg-blue-100",
    text: "text-blue-600",
    activeBg: "bg-blue-500",
    activeText: "text-white",
  },
  red: {
    border: "border-red-500",
    bg: "bg-red-100",
    text: "text-red-600",
    activeBg: "bg-red-500",
    activeText: "text-white",
  },
  green: {
    border: "border-green-500",
    bg: "bg-green-100",
    text: "text-green-600",
    activeBg: "bg-green-500",
    activeText: "text-white",
  },
  orange: {
    border: "border-orange-500",
    bg: "bg-orange-100",
    text: "text-orange-600",
    activeBg: "bg-orange-500",
    activeText: "text-white",
  },
  yellow: {
    border: "border-yellow-500",
    bg: "bg-yellow-100",
    text: "text-yellow-600",
    activeBg: "bg-yellow-500",
    activeText: "text-white",
  },
  cyan: {
    border: "border-cyan-500",
    bg: "bg-cyan-100",
    text: "text-cyan-600",
    activeBg: "bg-cyan-500",
    activeText: "text-white",
  },
  // Add more colors as needed
};

const StatCard = ({ icon: Icon, title, value, color = "blue", active = false }) => {
  const current = colorStyles[color] || colorStyles["blue"];

  return (
    <div
      className={`bg-white dark:bg-zinc-900 rounded-xl shadow-md p-6 border-l-4 ${current.border} ${active ? 'ring-2 ring-offset-2 dark:ring-offset-zinc-900 ring-' + color + '-500 transform scale-105 transition-all' : 'transition-all'
        }`}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${active ? current.activeBg : current.bg} ${active ? current.activeText : current.text}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="ml-4">
          <p className="text-sm font-medium text-gray-600 dark:text-customIsabelline">
            {title}
          </p>
          <p className="text-xl font-bold text-zinc-900 dark:text-customIsabelline">
            {value != null ? value : <Spinner />}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;