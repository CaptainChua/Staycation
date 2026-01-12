"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import {
  User,
  LogOut,
  ChevronDown,
  Calendar,
  Heart,
  HelpCircle,
} from "lucide-react";
import HelpSidebar from "./HelpSidebar";

interface User {
  name?: string;
  email?: string;
  image?: string;
  profile_image_url?: string;
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHelpSidebarOpen, setIsHelpSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const profileContainerRef = useRef<HTMLDivElement>(null);

  const menuItems = ["Havens", "Contacts", "Location", "About"];

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Hide navbar on certain pages (not on admin login, only on admin dashboards)
  const shouldHideNavbar = pathname === "/admin/owners" ||
                           pathname === "/admin/csr" ||
                           pathname === "/admin/partners" ||
                           pathname === "/admin/cleaners";

  if (!mounted || shouldHideNavbar) return null;

  return (
    <nav className="fixed w-full h-14 sm:h-16 px-3 sm:px-6 bg-white dark:bg-gray-900 z-50">
      <div className="h-full flex items-center justify-between max-w-7xl mx-auto">
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
            <span className="text-xl sm:text-2xl font-display text-brand-primary dark:text-brand-primary">taycation Haven</span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-4 sm:gap-6 lg:gap-8">
          {menuItems.map((item, idx) => {
            let href = "/";
            if (item === "Contacts") href = "/contacts";
            else if (item === "Location") href = "/location";
            else if (item === "Login") href = "/login";
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
                {(session.user as User).profile_image_url ||
                (session.user as User).image ? (
                  <Image
                    src={(session.user as User).profile_image_url ||
                    (session.user as User).image || ''}
                    alt={(session.user as User).name || "User"}
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
                  {(session.user as User).name}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-52 sm:w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slide-down">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      {(session.user as User).profile_image_url ||
                      (session.user as User).image ? (
                        <Image
                          src={(session.user as User).profile_image_url ||
                          (session.user as User).image || ''}
                          alt={(session.user as User).name || "User"}
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
                          {session.user.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => handleDropdownNavigation("/profile")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                    >
                      <User className="w-4 h-4 text-brand-primary" />
                      <span className="text-sm font-medium">My Profile</span>
                    </button>

                    <button
                      onClick={() => handleDropdownNavigation("/my-bookings")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                    >
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      <span className="text-sm font-medium">My Bookings</span>
                    </button>

                    <button
                      onClick={() => handleDropdownNavigation("/my-wishlist")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                    >
                      <Heart className="w-4 h-4 text-brand-primary" />
                      <span className="text-sm font-medium">My Wishlist</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 py-1">
                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await signOut({ callbackUrl: "/login" });
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
                {(session.user as User).profile_image_url ||
                (session.user as User).image ? (
                  <Image
                    src={(session.user as User).profile_image_url ||
                    (session.user as User).image || ''}
                    alt={(session.user as User).name || "User"}
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
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50 animate-slide-down">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                    <div className="flex items-center gap-3">
                      {(session.user as User).profile_image_url ||
                      (session.user as User).image ? (
                        <Image
                          src={(session.user as User).profile_image_url ||
                          (session.user as User).image || ''}
                          alt={(session.user as User).name || "User"}
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
                          {session.user.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                          {session.user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="py-1">
                    <button
                      onClick={() => handleDropdownNavigation("/profile")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                    >
                      <User className="w-4 h-4 text-brand-primary" />
                      <span className="text-sm font-medium">My Profile</span>
                    </button>

                    <button
                      onClick={() => handleDropdownNavigation("/my-bookings")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                    >
                      <Calendar className="w-4 h-4 text-brand-primary" />
                      <span className="text-sm font-medium">My Bookings</span>
                    </button>

                    <button
                      onClick={() => handleDropdownNavigation("/my-wishlist")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-150 text-left"
                    >
                      <Heart className="w-4 h-4 text-brand-primary" />
                      <span className="text-sm font-medium">My Wishlist</span>
                    </button>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-600 py-1">
                    <button
                      onClick={async () => {
                        setIsProfileOpen(false);
                        await signOut({ callbackUrl: "/login" });
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
          isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-4 space-y-4">
          {menuItems.map((item, idx) => {
            let href = "/";
            if (item === "Contacts") href = "/contacts";
            else if (item === "Location") href = "/location";
            else if (item === "Login") href = "/login";
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
                  {(session.user as User).profile_image_url ||
                  (session.user as User).image ? (
                    <Image
                      src={(session.user as User).profile_image_url ||
                      (session.user as User).image || ''}
                      alt={(session.user as User).name || "User"}
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
                      {session.user.name}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                {/* Profile Button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-all duration-300 shadow-md"
                >
                  <User className="w-5 h-5" />
                  <span>My Profile</span>
                </button>
                {/* My Bookings Button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/my-bookings");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-all duration-300 shadow-md"
                >
                  <Calendar className="w-5 h-5" />
                  <span>My Bookings</span>
                </button>
                {/* My Wishlist Button */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/my-wishlist");
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white rounded-lg font-medium transition-all duration-300 shadow-md"
                >
                  <Heart className="w-5 h-5" />
                  <span>My Wishlist</span>
                </button>

                {/* Sign Out Button */}
                <button
                  onClick={async () => {
                    setIsMenuOpen(false);
                    await signOut({ callbackUrl: "/login" });
                  }}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all duration-300 shadow-md"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
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
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>

      {/* Help Sidebar */}
      <HelpSidebar
        isOpen={isHelpSidebarOpen}
        onClose={() => setIsHelpSidebarOpen(false)}
      />
    </nav>
  );
};

export default Navbar;