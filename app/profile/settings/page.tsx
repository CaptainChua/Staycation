"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import SidebarLayout from "@/Components/SidebarLayout";
import Link from "next/link";
import { ChevronLeft, Mail, User, SunMedium, Moon, Laptop2, ShieldCheck } from "lucide-react";

const ProfileSettingsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [appearance, setAppearance] = useState({
    theme: "system",
    density: "comfortable",
    accent: "gold",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/profile/settings");
      return;
    }
  }, [status, router]);

  useEffect(() => {
    if (theme && theme !== appearance.theme) {
      setAppearance((prev) => ({ ...prev, theme }));
    }
  }, [theme, appearance.theme]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const connectedEmail = session.user.email || "Not connected";
  const emailProvider = connectedEmail.includes("@gmail.com") ? "Google / Gmail" : "Email login";
  const displayName = session.user.name || "Guest";

  const handleAppearanceChange = (field: keyof typeof appearance, value: string) => {
    setAppearance((prev) => ({ ...prev, [field]: value }));
    if (field === "theme") {
      setTheme(value);
    }
  };

  return (
    <SidebarLayout>
      <div className="relative bg-gradient-to-br from-gray-100 via-gray-50 to-orange-50 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 text-gray-900 dark:text-white py-12 overflow-hidden border-b border-gray-200 dark:border-gray-700">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-primary/10 dark:bg-brand-primary/20 backdrop-blur-sm rounded-full mb-6 border border-brand-primary/20 dark:border-brand-primary/30">
            <ShieldCheck className="w-8 h-8 text-brand-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Preferences & Settings</h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Manage your connected account details and appearance preferences.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primaryDark mb-6 font-medium transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          Back to Profile
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-8">
            <div className="flex flex-col gap-2 mb-8">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Account</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Connected account</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Your signed-in account and provider information.
              </p>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-5">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-brand-primary" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Name</p>
                </div>
                <p className="mt-3 text-base text-gray-700 dark:text-gray-300">{displayName}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-5">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-brand-primary" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Connected email</p>
                </div>
                <p className="mt-3 text-base text-gray-700 dark:text-gray-300">{connectedEmail}</p>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Provider: {emailProvider}</p>
              </div>
              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-5">
                <div className="flex items-center gap-3">
                  <Laptop2 className="w-5 h-5 text-brand-primary" />
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Email status</p>
                </div>
                <p className="mt-3 text-base text-gray-700 dark:text-gray-300">Your account email is used to sign in and receive booking notifications.</p>
              </div>
            </div>
          </section>

          <aside className="rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm p-8">
            <div className="flex flex-col gap-2 mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">Appearance</p>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Display preferences</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Change the theme and layout density for your dashboard experience.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Theme mode</label>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { label: "System", value: "system" },
                    { label: "Light", value: "light" },
                    { label: "Dark", value: "dark" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAppearanceChange("theme", option.value)}
                      className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                        appearance.theme === option.value
                          ? "border-brand-primary bg-brand-primary/10 text-brand-primary"
                          : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                      }`}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">Layout density</label>
                <select
                  value={appearance.density}
                  onChange={(e) => handleAppearanceChange("density", e.target.value)}
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-brand-primary dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                  <option value="spacious">Spacious</option>
                </select>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Use a denser layout for more information on screen.
                </p>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 p-4">
                <div className="flex items-center gap-3 text-gray-900 dark:text-white">
                  {appearance.theme === "dark" ? <Moon className="w-5 h-5 text-brand-primary" /> : <SunMedium className="w-5 h-5 text-brand-primary" />}
                  <p className="text-sm font-semibold">Current theme</p>
                </div>
                <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
                  {appearance.theme === "system"
                    ? "Matching your system theme"
                    : appearance.theme === "dark"
                    ? "Dark mode is active"
                    : "Light mode is active"}
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </SidebarLayout>
  );
};

export default ProfileSettingsPage;
