"use client";

import {
  ChevronRight,
  Eye,
  EyeOff,
  Home,
  Lock,
  LogIn,
  User,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";

interface LoginFormState {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string;
}

const AdminLogin = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
    showPassword: false,
    isLoading: false,
    error: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      error: "",
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
      }))
      return;
    }

    setFormData((prev) => ({
      ...prev,
      isLoading: true,
      error: ""
    }))

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
    } catch(error: any) {
      console.log("Login error: ", error);

      const errorMessage = 
        error?.response?.data?.error || 
        error?.response?.data?.message || 
        error?.message || 
        "An error occurred. Please try again.";
      
      setFormData((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      toast.error(errorMessage);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-primaryLighter via-white to-brand-primarySoft flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-primaryLight/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-primaryLight/30 rounded-full blur-3xl"></div>
    
      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-10 animate-in fade-in-slide-from-top duration-700">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 flex items-center justify-center">
              {/* <Home className="w-8 h-8 text-white" /> */}
              <img src="/Images/shlogo.png" alt="no-logo" className="w-full h-full rounded-full"/>
            </div>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-800 mb-2">
            Staycation Haven
          </h1>
          <p className="text-gray-600">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div
          className="bg-white rounded-2xl p-8 sm:p-10 border border-gray-200 shadow-2xl animate-in fade-in-slide-in-from-bottom duration-700"
          style={{ animationDelay: "100ms" }}
        >
          {/* Title */}
          <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">
            Admin Login
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Sign in to your account
          </p>

          {/* Login Form */}
          <div
            className="space-y-5 animate-in fade-in duration-700"
            style={{ animationDelay: "200ms" }}
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type={formData.showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-300 text-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      showPassword: !prev.showPassword,
                    }))
                  }
                  className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
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
              <div className="p-3 bg-red-50 border border-red-300 rounded-lg text-red-700 text-sm animate-in fade-in duration-300">
                {formData.error}
              </div>
            )}

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300" />
                <span>Remember me</span>
              </label>
              <Link
                className="text-brand-primary hover:text-brand-primaryDark transition-colors font-semibold"
                href={"#"}
              >
                Forgot Password
              </Link>
            </div>

            {/* Login Bottom */}
            <button
              onClick={handleLogin}
              disabled={formData.isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-lg bg-gradient-to-r from-brand-primary to-brand-primaryLight hover:from-brand-primaryDark hover:to-brand-primaryLight text-white font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mt-6"
            >
              {!formData.isLoading && <LogIn className="w-5 h-5" />}
              <span>{formData.isLoading ? "Logging in..." : "Login"}</span>
              {!formData.isLoading && <ChevronRight className="w-5 h-5" />}
            </button>
          </div>

          {/* footer */}
          <p className="text-center text-xs text-gray-500 mt-6">Need help? Contact{' '}
            <Link href={"mailto:support@staycationhaven.com"} className="text-brand-primary hover:text-brand-primaryDark transition-colors">support@staycationhaven.com</Link>
          </p>
        </div>

        {/* Security Note */}
        <div className="mt-6 p-4 bg-white/80 border border-gray-300 rounded-lg text-center text-xs text-gray-600 animate-in fade-in duration-700" style={{ animationDelay: '400ms'}}>
        🔒 This is a secure admin portal. Keep your credentials confidential.
        </div>
      </div>

      {formData.isLoading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center border border-gray-300">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-brand-primary rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-semibold">Verifying Credentials...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogin;
