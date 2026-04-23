"use client";

import { LogOut } from "lucide-react";
import { toast } from "react-hot-toast";
import { signOut } from "next-auth/react";

interface CsrLogoutProps {
  sidebar: boolean;
}

export default function CsrLogout({ sidebar }: CsrLogoutProps) {
  const handleLogout = async () => {
    try {
      await signOut({
        callbackUrl: "/admin/login",
        redirect: true,
      });
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-left"
    >
      <LogOut className="w-4 h-4" />
      {sidebar && <span className="text-sm font-medium">Sign Out</span>}
    </button>
  );
}