"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { getGuestIdentifier, getOrCreateGuestIdentifier } from "@/lib/guest";
import Image from "next/image";
import {
  User,
  LogOut,
  ChevronDown,
  Calendar,
  Heart,
  HelpCircle,
  Moon,
  Sun,
  Monitor,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "next-themes";
import HelpSidebar from "./HelpSidebar";
import { useGetUserBookingsQuery } from "@/redux/api/bookingsApi";
import { useGetUserWishlistQuery } from "@/redux/api/wishlistApi";

interface UserData {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  profile_image_url?: string;
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpSidebarOpen, setIsHelpSidebarOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Get user ID for API calls
  const userId = (session?.user as UserData)?.id || null;

  // Guest identifier (if not authenticated)
  const [guestIdentifier, setGuestIdentifier] = useState<string | null>(null);

  // nav identifier - prefer the logged-in user id, otherwise use guest identifier (formatted as `guest_<token>`)
  const navUserId = userId || guestIdentifier;

  useEffect(() => {
    // If a real user is present, clear any guest identifier
    if (userId) {
      setGuestIdentifier(null);
      return;
    }

    // Try to read an existing guest identifier (no side-effects)
    const existing = getGuestIdentifier();
    if (existing) {
      setGuestIdentifier(existing);
      return;
    }

    // Otherwise create one client-side (deferred to avoid sync setState in effect)
    Promise.resolve().then(() => {
      const created = getOrCreateGuestIdentifier();
      if (created) setGuestIdentifier(created);
    });
  }, [userId]);

  // Fetch user bookings (only for logged-in users) and wishlist counts (supports guest identifiers)
  const { data: userBookings } = useGetUserBookingsQuery(
    { userId },
    { skip: !userId },
  );
  const { data: userWishlist } = useGetUserWishlistQuery(navUserId, {
    skip: !navUserId,
  });

  // Calculate counts with better error handling
  const bookingsCount = Array.isArray(userBookings)
    ? userBookings.length
    : userBookings?.data?.length || 0;
  const wishlistCount = Array.isArray(userWishlist)
    ? userWishlist.length
    : userWishlist?.data?.length || 0;

  const menuItems = ["Havens", "Contacts", "Location", "About"];

  // Define profile dropdown items with dynamic counts
  const profileDropdownItems = [
    {
      href: "/profile",
      label: "My Profile",
      icon: User,
      iconColor: "text-brand-primary",
    },
    {
      href: "/my-bookings",
      label: "My Bookings",
      icon: Calendar,
      iconColor: "text-brand-primary",
      count: bookingsCount,
    },
    {
      href: "/my-wishlist",
      label: "My Wishlist",
      icon: Heart,
      iconColor: "text-brand-primary",
      count: wishlistCount,
    },
  ];

  // Check if a path is active (exact match or starts with for nested routes)
  const isActivePath = (href: string) => {
    if (href === "/profile") {
      return pathname === href || pathname.startsWith("/profile/");
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileContainerRef.current &&
        !profileContainerRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    if (isProfileOpen) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isProfileOpen]);

  // Handle navigation from dropdown items
  const handleDropdownNavigation = (href: string) => {
    setIsProfileOpen(false);
    router.push(href);
  };

  // Toggle profile dropdown with event handling
  const toggleProfileDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsProfileOpen(!isProfileOpen);
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        console.log("✅ Account deleted successfully");
        setIsDeleteModalOpen(false);
        setIsProfileOpen(false);
        // Sign out the user and redirect
        await signOut({ callbackUrl: "/" });
      } else {
        const error = await response.json();
        console.error("❌ Failed to delete account:", error);
        alert("Failed to delete account. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error deleting account:", error);
      alert("An error occurred while deleting your account.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Toggle profile dropdown with event handling

  // Hide navbar on certain pages (not on admin login, only on admin dashboards)
  const shouldHideNavbar =
    pathname === "/admin/owners" ||
    pathname === "/admin/csr" ||
    pathname === "/admin/partners" ||
    pathname === "/admin/cleaners";

  if (!mounted || shouldHideNavbar) return null;

  return (
    <nav className="fixed w-full h-14 sm:h-16 bg-white dark:bg-gray-900 z-50">
      <div className="h-full flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href={"/"}>
          <div className="flex items-center gap-1 cursor-pointer">
            <Image
              src="/haven_logo.png"
              alt="Staycation Haven Logo"
              width={24}
              height={24}
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
            />
            <span className="text-xl sm:text-2xl font-display text-brand-primary dark:text-brand-primary relative">
              taycation Haven
              <sup className="text-xs text-brand-primary dark:text-brand-primary ml-0.5 font-normal">
                PH
              </sup>
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-4 sm:gap-6 lg:gap-8">
          {menuItems.map((item, idx) => {
            let href = "/";
            if (item === "Contacts") href = "/contacts";
            else if (item === "Location") href = "/location";
            else if (item === "Havens") href = "/rooms";
            else if (item === "About") href = "/about";

            const isActive = pathname === href;

            return (
              <Link key={idx} href={href}>
                <div className="cursor-pointer">
                  <span
                    className={`text-sm sm:text-base ${
                      isActive
                        ? "text-brand-primary dark:text-brand-primary"
                        : "text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary"
                    } transition-colors`}
                  >
                    {item}
                  </span>
                </div>
              </Link>
            );
          })}

          {/* Help Button */}
          <button
            onClick={() => setIsHelpSidebarOpen(true)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors" />
          </button>

          {/* CTA Button / User Profile */}
          {status === "loading" ? (
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          ) : session?.user ? (
            <div className="relative" ref={profileContainerRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primary transition-colors duration-200"
              >
                {(session.user as UserData).profile_image_url ||
                (session.user as UserData).image ? (
                  <Image
                    src={
                      (session.user as UserData).profile_image_url ||
                      (session.user as UserData).image ||
                      "/default-avatar.png"
                    }
                    alt={(session.user as UserData).name || "User"}
                    width={32}
                    height={32}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-brand-primary"
                  />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-primary flex items-center justify-center">
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                )}
                <span className="hidden sm:block font-medium text-gray-800 dark:text-gray-100 max-w-20 sm:max-w-32 truncate text-sm">
                  {(session.user as UserData).name || "User"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      {(session.user as UserData).profile_image_url ||
                      (session.user as UserData).image ? (
                        <Image
                          src={
                            (session.user as UserData).profile_image_url ||
                            (session.user as UserData).image ||
                            "/default-avatar.png"
                          }
                          alt={(session.user as UserData).name || "User"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-primary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                          {(session.user as UserData).name || "User"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {(session.user as UserData).email || ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {profileDropdownItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = isActivePath(item.href);

                      return (
                        <button
                          key={index}
                          onClick={() => handleDropdownNavigation(item.href)}
                          className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 text-left ${
                            isActive
                              ? "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-medium border-l-2 border-red-500"
                              : "text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive ? "text-brand-primary" : item.iconColor
                              }`}
                            />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.count !== undefined && (
                            <span className="bg-red-500 text-white text-xs  px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Theme Toggle */}
                  <div className="flex justify-center py-2 border-t border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme("dark");
                        }}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          theme === "dark"
                            ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        aria-label="Dark mode"
                        title="Dark"
                      >
                        <Moon className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme("light");
                        }}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          theme === "light"
                            ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        aria-label="Light mode"
                        title="Light"
                      >
                        <Sun className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setTheme("system");
                        }}
                        className={`p-1 rounded-full transition-all duration-200 ${
                          theme === "system"
                            ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                            : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                        }`}
                        aria-label="System mode"
                        title="System"
                      >
                        <Monitor className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => {
                        setIsDeleteModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors duration-150 text-left"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        Delete Account
                      </span>
                    </button>
                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await signOut({ callbackUrl: "/" });
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : guestIdentifier ? (
            <div className="relative" ref={profileContainerRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primary transition-colors duration-200"
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-700" />
                </div>
                <span className="hidden sm:block font-medium text-gray-800 dark:text-gray-100 truncate text-sm">
                  Guest
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                          Guest
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          Signed in as guest
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => handleDropdownNavigation("/my-wishlist")}
                      className="w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 text-left text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-4 h-4 text-brand-primary" />
                        <span className="text-sm">My Wishlist</span>
                      </div>
                      <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                        {wishlistCount}
                      </span>
                    </button>
                    <button
                      onClick={() => router.push("/login")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span className="text-sm">Sign In / Register</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-brand-primary dark:bg-brand-primary hover:bg-brand-primaryDark dark:hover:bg-brand-primaryDark text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-full font-medium transition-all duration-300 text-xs sm:text-sm">
                Sign In
              </button>
            </Link>
          )}
        </div>

        {/* Tablet Menu - Show condensed version */}
        <div className="hidden md:flex lg:hidden items-center gap-3">
          {/* Help Button */}
          <button
            onClick={() => setIsHelpSidebarOpen(true)}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary transition-colors" />
          </button>

          {/* CTA Button / User Profile */}
          {status === "loading" ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          ) : session?.user ? (
            <div className="relative" ref={profileContainerRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primary transition-colors duration-200"
              >
                {(session.user as UserData).profile_image_url ||
                (session.user as UserData).image ? (
                  <Image
                    src={
                      (session.user as UserData).profile_image_url ||
                      (session.user as UserData).image ||
                      "/default-avatar.png"
                    }
                    alt={(session.user as UserData).name || "User"}
                    width={28}
                    height={28}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-brand-primary"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      {(session.user as UserData).profile_image_url ||
                      (session.user as UserData).image ? (
                        <Image
                          src={
                            (session.user as UserData).profile_image_url ||
                            (session.user as UserData).image ||
                            "/default-avatar.png"
                          }
                          alt={(session.user as UserData).name || "User"}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-primary"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-brand-primary flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate text-sm">
                          {(session.user as UserData).name || "User"}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {(session.user as UserData).email || ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    {profileDropdownItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = isActivePath(item.href);

                      return (
                        <button
                          key={index}
                          onClick={() => handleDropdownNavigation(item.href)}
                          className={`w-full px-4 py-2.5 flex items-center justify-between gap-3 transition-colors duration-150 text-left ${
                            isActive
                              ? "bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 font-medium border-l-2 border-red-500"
                              : "text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon
                              className={`w-4 h-4 ${
                                isActive ? "text-brand-primary" : item.iconColor
                              }`}
                            />
                            <span className="text-sm">{item.label}</span>
                          </div>
                          {item.count !== undefined && (
                            <span className="bg-red-500 text-white text-xs  px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                              {item.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 py-1">
                    {/* Theme Toggle */}
                    <div className="flex justify-center py-2">
                      <div className="flex items-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTheme("dark");
                          }}
                          className={`p-1 rounded-full transition-all duration-200 ${
                            theme === "dark"
                              ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                          aria-label="Dark mode"
                          title="Dark"
                        >
                          <Moon className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTheme("light");
                          }}
                          className={`p-1 rounded-full transition-all duration-200 ${
                            theme === "light"
                              ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                          aria-label="Light mode"
                          title="Light"
                        >
                          <Sun className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTheme("system");
                          }}
                          className={`p-1 rounded-full transition-all duration-200 ${
                            theme === "system"
                              ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                          }`}
                          aria-label="System mode"
                          title="System"
                        >
                          <Monitor className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await signOut({ callbackUrl: "/" });
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : guestIdentifier ? (
            <div className="relative" ref={profileContainerRef}>
              <button
                onClick={toggleProfileDropdown}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-primary transition-colors duration-200"
              >
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-700" />
                </div>
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-brand-primary hover:bg-brand-primaryDark text-white px-4 py-1.5 rounded-full font-medium transition-all duration-300 text-sm">
                Sign In
              </button>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden relative w-8 h-8 sm:w-10 sm:h-10 flex flex-col items-center justify-center gap-1 focus:outline-none group"
          aria-label="Toggle menu"
        >
          <span
            className={`w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded-full transition-all duration-300 ${
              isMenuOpen ? "rotate-45 translate-y-1.5" : ""
            }`}
          ></span>
          <span
            className={`w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded-full transition-all duration-300 ${
              isMenuOpen ? "opacity-0" : "opacity-100"
            }`}
          ></span>
          <span
            className={`w-5 h-0.5 bg-gray-800 dark:bg-gray-200 rounded-full transition-all duration-300 ${
              isMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
            }`}
          ></span>
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div
        className={`md:hidden absolute top-16 left-0 w-full bg-white dark:bg-gray-800 shadow-lg overflow-hidden transition-all duration-300 ease-in-out z-50 ${
          isMenuOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 space-y-4">
          {menuItems.map((item, idx) => {
            let href = "/";
            if (item === "Contacts") href = "/contacts";
            else if (item === "Location") href = "/location";
            else if (item === "Havens") href = "/rooms";
            else if (item === "About") href = "/about";

            const isActive = pathname === href;

            return (
              <div
                key={idx}
                className={`transform transition-all duration-300 ${
                  isMenuOpen
                    ? "translate-x-0 opacity-100"
                    : "-translate-x-4 opacity-0"
                }`}
                style={{ transitionDelay: `${idx * 50}ms` }}
              >
                <Link href={href}>
                  <div
                    onClick={() => setIsMenuOpen(false)}
                    className={`${
                      isActive
                        ? "text-brand-primary dark:text-brand-primary bg-brand-primary/10 dark:bg-brand-primary/20 font-semibold border-l-4 border-brand-primary dark:border-brand-primary"
                        : "text-gray-700 dark:text-gray-300 hover:text-brand-primary dark:hover:text-brand-primary hover:bg-brand-primary/10 dark:hover:bg-brand-primary/20"
                    } transition-colors duration-300 font-medium py-2 px-4 rounded-lg cursor-pointer`}
                  >
                    {item}
                  </div>
                </Link>
              </div>
            );
          })}

          {/* Mobile CTA Button / User Profile */}
          <div
            className={`transform transition-all duration-300 ${
              isMenuOpen
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0"
            }`}
            style={{ transitionDelay: `${menuItems.length * 50}ms` }}
          >
            {status === "loading" ? (
              <div className="w-full h-12 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            ) : session?.user ? (
              <div className="space-y-3">
                {/* User Info */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  {(session.user as UserData).profile_image_url ||
                  (session.user as UserData).image ? (
                    <Image
                      src={
                        (session.user as UserData).profile_image_url ||
                        (session.user as UserData).image ||
                        "/default-avatar.png"
                      }
                      alt={(session.user as UserData).name || "User"}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-brand-primary"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {(session.user as UserData).name || "User"}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {(session.user as UserData).email || ""}
                    </p>
                  </div>
                </div>

                {/* Profile Dropdown Items */}
                {profileDropdownItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = isActivePath(item.href);

                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push(item.href);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg font-medium transition-all duration-300 ${
                        isActive
                          ? "bg-red-500/20 text-red-600 border border-red-500"
                          : "bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </div>
                      {item.count !== undefined && (
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full min-w-[20px] text-center flex items-center justify-center">
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Delete Account Button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-all duration-300"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Delete Account</span>
                </button>

                {/* Sign Out Button */}
                <button
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await signOut({ callbackUrl: "/" });
                  }}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>

                {/* Theme Toggle */}
                <div className="flex items-center justify-center gap-0.5 bg-gray-100 dark:bg-gray-700 rounded-full p-0.5">
                  <button
                    onClick={() => setTheme("dark")}
                    className={`p-1 rounded-full transition-all duration-200 ${
                      theme === "dark"
                        ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    aria-label="Dark mode"
                    title="Dark"
                  >
                    <Moon className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`p-1 rounded-full transition-all duration-200 ${
                      theme === "light"
                        ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    aria-label="Light mode"
                    title="Light"
                  >
                    <Sun className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setTheme("system")}
                    className={`p-1 rounded-full transition-all duration-200 ${
                      theme === "system"
                        ? "bg-white dark:bg-gray-600 text-brand-primary shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    }`}
                    aria-label="System mode"
                    title="System"
                  >
                    <Monitor className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : guestIdentifier ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">
                      Guest
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Signed in as guest
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/my-wishlist");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/10 text-gray-800 dark:text-gray-200"
                >
                  <Heart className="w-5 h-5 text-brand-primary" />
                  View Wishlist ({wishlistCount})
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/login");
                  }}
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white px-6 py-3 rounded-lg font-medium transform hover:scale-105 transition-all duration-300 shadow-md"
                >
                  Sign In / Register
                </button>
              </div>
            ) : (
              <Link href="/login">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full bg-brand-primary hover:bg-brand-primaryDark text-white px-6 py-3 rounded-lg font-medium transform hover:scale-105 transition-all duration-300 shadow-md"
                >
                  Sign In
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div
          onClick={() => setIsMenuOpen(false)}
          className="md:hidden fixed inset-0 bg-black/30 dark:bg-black/50 backdrop-blur-sm top-16 z-40 animate-fade-in"
        ></div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      {/* Help Sidebar */}
      <HelpSidebar
        isOpen={isHelpSidebarOpen}
        onClose={() => setIsHelpSidebarOpen(false)}
      />

      {/* Delete Account Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm w-full animate-scale-in">
            {/* Modal Header */}
            <div className="bg-red-50 dark:bg-red-900/20 px-6 py-4 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Delete Account
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-4 space-y-4">
              <p className="text-gray-700 dark:text-gray-300 text-sm">
                Are you sure you want to delete your account? This action{" "}
                <span className="font-semibold text-red-600 dark:text-red-400">
                  cannot be undone
                </span>
                .
              </p>
              <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase">
                  This will permanently:
                </p>
                <ul className="text-xs text-red-600 dark:text-red-400 space-y-1 ml-4">
                  <li>✓ Delete your account and profile</li>
                  <li>✓ Remove all your bookings</li>
                  <li>✓ Delete your wishlist</li>
                  <li>✓ Remove your reviews and messages</li>
                  <li>✓ Erase all activity history</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 dark:bg-gray-700/30 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="px-4 py-2 rounded-lg bg-red-600 dark:bg-red-700 text-white hover:bg-red-700 dark:hover:bg-red-800 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
