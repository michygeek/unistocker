"use client";

import { Bell, Search, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  title: string;
  unreadCount?: number;
}

export function Header({ title, unreadCount = 0 }: HeaderProps) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark");
    setDark(isDark);
  }, []);

  const toggleDark = () => {
    document.documentElement.classList.toggle("dark");
    setDark(!dark);
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-gray-900 dark:text-white ml-12 lg:ml-0">{title}</h1>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2 text-sm text-gray-500 dark:text-gray-400 w-56">
          <Search size={16} />
          <span>Search...</span>
        </div>

        <button
          onClick={toggleDark}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <Link
          href="/notifications"
          className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
