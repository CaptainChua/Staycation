"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import Link from "next/link";

const AdminFooter = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="w-full">
        {/* Single Row Layout: Copyright | Theme Toggle | Links */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
          {/* Left: Copyright */}
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap order-2 lg:order-1">
            &copy; {new Date().getFullYear()} Staycation Haven. All rights reserved.
          </p>

          {/* Center: Theme Toggle */}
          <div className="flex justify-center order-1 lg:order-2">
            {mounted ? (
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                <button
                  onClick={() => setTheme("dark")}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    theme === "dark"
                      ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  aria-label="Dark mode"
                  title="Dark"
                >
                  <Moon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme("light")}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    theme === "light"
                      ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  aria-label="Light mode"
                  title="Light"
                >
                  <Sun className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTheme("system")}
                  className={`p-1.5 rounded-full transition-all duration-200 ${
                    theme === "system"
                      ? "bg-white dark:bg-gray-700 text-brand-primary shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                  aria-label="System mode"
                  title="System"
                >
                  <Monitor className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-full p-1">
                <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
                <div className="w-7 h-7 bg-gray-300 dark:bg-gray-600 rounded-full animate-pulse"></div>
              </div>
            )}
          </div>

          {/* Right: Links */}
          <div className="flex flex-wrap justify-center lg:justify-end items-center gap-x-3 sm:gap-x-4 gap-y-2 text-xs sm:text-sm order-3">
            <Link
              href="/help-center"
              className="text-gray-600 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
            >
              Help Center
            </Link>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <Link
              href="/privacy-policy"
              className="text-gray-600 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-400 hidden sm:inline">•</span>
            <Link
              href="/terms-of-service"
              className="text-gray-600 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFooter;
