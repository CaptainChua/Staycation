"use client";

import {
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";
import Image from "next/image";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";

interface LoginFormState {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
}

const AdminLogin = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
    showPassword: false,
    isLoading: false,
    error: null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      error: null,
    }));
  };

  const handleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setFormData((prev) => ({
        ...prev,
        error: "Please fill in all fields",
      }))
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error("Please enter a valid email");
      setFormData((prev) => ({
        ...prev,
        error: "Please enter a valid email"
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setFormData((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Invalid email or password",
        }));
        toast.error(result.error || "Invalid email or password");
        return;
      }

      if (result?.ok) {
        const { data: session } = await axios.get('/api/auth/session');

        if (!session?.user) {
          setFormData((prev) => ({
            ...prev,
            isLoading: false,
            error: "Failed to get session",
          }));
          toast.error("Failed to get session");
          return;
        }

        toast.success(`Welcome back, ${session.user.name}!`)

        const role = session.user.role?.toLowerCase();

        switch(role) {
          case 'csr': 
            router.push("/admin/csr");
            break;

          case 'owner':
            router.push("/admin/owners");
            break;

          case 'partner': 
            router.push("/admin/partners");
            break;

          case 'cleaner': 
            router.push("/admin/cleaners");
            break;
          default:
            router.push("/admin/owners")
        }
      }
    } catch(error: unknown) {
      console.log("Login error: ", error);

      let errorMessage: string;
      
      if (error && typeof error === 'object' && 'response' in error &&
          error.response && typeof error.response === 'object' && 'data' in error.response &&
          error.response.data && typeof error.response.data === 'object') {
        
        if ('error' in error.response.data && typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if ('message' in error.response.data && typeof error.response.data.message === 'string') {
          errorMessage = error.response.data.message;
        } else {
          errorMessage = "An error occurred. Please try again.";
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = "An error occurred. Please try again.";
      }
      
      setFormData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-14 sm:pt-16">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Main Container */}
          <div className="w-full max-w-md">

            {/* Login Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
              {/* Logo/Home Link */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => router.push("/")}
                  className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                  aria-label="Go to homepage"
                >
                  <Image
                    src="/haven_logo.png"
                    alt="Staycation Haven Logo"
                    width={24}
                    height={24}
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-xl font-display text-brand-primary dark:text-brand-primary">
                    taycation Haven
                  </span>
                </button>
              </div>

              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  Admin Login
                </h1>
                <p className="text-gray-600 dark:text-gray-300">
                  Sign in to your admin account
                </p>
              </div>

              {/* Login Form */}
              <div className="space-y-3 mb-6">
                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Password Fieldd */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 dark:text-gray-500" />
                    <input
                      type={formData.showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          showPassword: !prev.showPassword,
                        }))
                      }
                      className="absolute right-4 top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {formData.showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Error Message */}
                {formData.error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                    {formData.error}
                  </div>
                )}
              </div>

              {/* Login Button */}
              <div className="mb-8">
                <button
                  onClick={handleLogin}
                  disabled={formData.isLoading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-brand-primary hover:bg-brand-primaryDark text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Login"
                >
                  {formData.isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-orange-300/40 border-t-white rounded-full animate-spin"></div>
                      <span>Logging in...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>

              {/* Terms */}
              <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  By continuing, you agree to our{" "}
                  <a
                    href="/terms"
                    className="text-brand-primary hover:text-brand-primaryDark underline transition-colors"
                  >
                    Terms
                  </a>{" "}
                  and{" "}
                  <a
                    href="/privacy"
                    className="text-brand-primary hover:text-brand-primaryDark underline transition-colors"
                  >
                    Privacy Policy
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default AdminLogin;