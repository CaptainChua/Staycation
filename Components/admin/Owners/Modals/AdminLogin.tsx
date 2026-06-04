"use client";

import {
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  User,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import axios from "axios";
import Image from "next/image";
import Navbar from "@/Components/Navbar";
import Footer from "@/Components/Footer";
import OtpVerification from "@/Components/admin/Csr/OtpVerification";

// TypeScript declaration for Turnstile
declare global {
  interface Window {
    turnstile: {
      render: (container: string | HTMLElement, params: {
        sitekey: string;
        callback?: (token: string) => void;
        'expired-callback'?: () => void;
        'error-callback'?: () => void;
      }) => string;
      remove: (widgetId: string) => void;
    };
  }
}

interface LoginFormState {
  email: string;
  password: string;
  showPassword: boolean;
  isLoading: boolean;
  error: string | null;
  turnstileToken: string | null;
}

const AdminLogin = () => {
  const router = useRouter();
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileInitializedRef = useRef(false);
  const turnstileWidgetIdRef = useRef<string | null>(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpPassword, setOtpPassword] = useState("");

  // MFA (email OTP) step
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  const [formData, setFormData] = useState<LoginFormState>({
    email: "",
    password: "",
    showPassword: false,
    isLoading: false,
    error: null,
    turnstileToken: null,
  });

  useEffect(() => {
    if (turnstileInitializedRef.current) return;

    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      setFormData(prev => ({
        ...prev,
        error: "Security configuration missing. Please contact administrator.",
      }));
      return;
    }

    const initializeTurnstile = () => {
      if (turnstileInitializedRef.current || !turnstileRef.current || !window.turnstile) return;
      try {
        turnstileInitializedRef.current = true;
        turnstileWidgetIdRef.current = window.turnstile.render(turnstileRef.current, {
          sitekey: siteKey,
          callback: (token: string) => setFormData(prev => ({ ...prev, turnstileToken: token })),
          'expired-callback': () => setFormData(prev => ({ ...prev, turnstileToken: null })),
          'error-callback': () => setFormData(prev => ({ ...prev, turnstileToken: null })),
        });
      } catch (error) {
        console.error("❌ Failed to initialize Turnstile widget:", error);
        turnstileInitializedRef.current = false;
      }
    };

    let checkInterval: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (window.turnstile) {
      initializeTurnstile();
    } else {
      checkInterval = setInterval(() => {
        if (window.turnstile) {
          clearInterval(checkInterval!);
          initializeTurnstile();
        }
      }, 100);

      timeout = setTimeout(() => {
        clearInterval(checkInterval!);
        if (!turnstileInitializedRef.current) {
          setFormData(prev => ({
            ...prev,
            error: "Security widget failed to load. Please refresh the page.",
          }));
        }
      }, 10000);
    }

    return () => {
      if (checkInterval) clearInterval(checkInterval);
      if (timeout) clearTimeout(timeout);
      if (turnstileWidgetIdRef.current && window.turnstile) {
        window.turnstile.remove(turnstileWidgetIdRef.current);
        turnstileWidgetIdRef.current = null;
        turnstileInitializedRef.current = false;
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      error: null,
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin();
    }
  };

  const handleOtpSuccess = async () => {
  try {
    toast.success("Account verified! Logging you in...");

    const result = await signIn("credentials", {
      email: otpEmail,
      password: otpPassword,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Account unlocked, but auto-login failed. Please login again.");
      setShowOtpVerification(false);
      return;
    }

    const { data: session } = await axios.get("/api/auth/session");

    if (!session?.user) {
      toast.error("Failed to create session. Please login again.");
      setShowOtpVerification(false);
      return;
    }

    const role = session.user.role?.toLowerCase();

    switch (role) {
      case "csr":
        router.push("/admin/csr");
        break;
      case "owner":
        router.push("/admin/owners");
        break;
      case "partner":
        router.push("/admin/partners");
        break;
      case "cleaner":
        router.push("/admin/cleaners");
        break;
      default:
        router.push("/admin/owners");
    }
  } catch (error) {
    console.error("Auto-login error:", error);
    toast.error("Auto-login failed. Please login again.");
    setShowOtpVerification(false);
  }
};

  const handleBackToLogin = () => {
    setShowOtpVerification(false);
    setOtpEmail("");
  };

  const handleLogin = async () => {
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

    if (!formData.turnstileToken) {
      setFormData((prev) => ({
        ...prev,
        error: "Please complete the security verification",
      }));
      toast.error("Please complete the security verification");
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
        turnstileToken: formData.turnstileToken,
        redirect: false,
      });

      if (result?.error) {
        // 🔐 MFA required: a code was emailed — show the code prompt
        if (result.error.includes("MFA_REQUIRED")) {
          setShowMfa(true);
          setMfaCode("");
          setFormData((prev) => ({ ...prev, isLoading: false, error: null }));
          toast.success("We emailed you a 6-digit verification code.");
          return;
        }

        // Check if error indicates OTP is required
        if (result.error.includes("Account locked due to multiple failed attempts")) {
        setOtpEmail(formData.email);
        setOtpPassword(formData.password); // 🔑 store password
        setShowOtpVerification(true);

        setFormData((prev) => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return;
      }

        
        setFormData((prev) => ({
          ...prev,
          isLoading: false,
          error: result.error || "Invalid email or password",
        }));
        toast.error(result.error || "Invalid email or password");
        
        // Reload page after showing error
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
      
      // Reload page after showing error for wrong credentials
      if (errorMessage.includes("Invalid email or password") || errorMessage.includes("Invalid credentials")) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    }
  }

  const redirectByRole = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "csr": router.push("/admin/csr"); break;
      case "owner": router.push("/admin/owners"); break;
      case "partner": router.push("/admin/partners"); break;
      case "cleaner": router.push("/admin/cleaners"); break;
      default: router.push("/admin/owners");
    }
  };

  const handleMfaVerify = async () => {
    if (mfaCode.trim().length !== 6) {
      toast.error("Please enter the 6-digit code");
      return;
    }
    setMfaSubmitting(true);
    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        mfaCode: mfaCode.trim(),
        redirect: false,
      });

      if (result?.error) {
        toast.error(
          result.error.includes("Invalid or expired")
            ? "Invalid or expired code. Please try again."
            : result.error || "Verification failed",
        );
        setMfaSubmitting(false);
        return;
      }

      if (result?.ok) {
        const { data: session } = await axios.get("/api/auth/session");
        toast.success(`Welcome back, ${session?.user?.name || ""}!`);
        redirectByRole(session?.user?.role);
      }
    } catch (error) {
      console.error("MFA verify error:", error);
      toast.error("Verification failed. Please try again.");
      setMfaSubmitting(false);
    }
  };

  const handleBackFromMfa = () => {
    setShowMfa(false);
    setMfaCode("");
    // Turnstile token was consumed on the first attempt — reload to get a fresh one
    window.location.reload();
  };

  return (
    <>
      {/* Navbar */}
      <Navbar />

      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col pt-14 sm:pt-16">
        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          {/* Main Container */}
          <div className="w-full max-w-md">

            {/* Show OTP Verification if required */}
            {showOtpVerification ? (
              <OtpVerification
                email={otpEmail}
                onBack={handleBackToLogin}
                onSuccess={handleOtpSuccess}
              />
            ) : showMfa ? (
              /* MFA Code Card */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-7 h-7 text-brand-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                    Two-Factor Verification
                  </h1>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    Enter the 6-digit code we emailed to
                    <br />
                    <span className="font-semibold">{formData.email}</span>
                  </p>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleMfaVerify();
                  }}
                  placeholder="000000"
                  autoFocus
                  className="w-full text-center tracking-[0.5em] text-2xl font-semibold py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                />

                <button
                  onClick={handleMfaVerify}
                  disabled={mfaSubmitting || mfaCode.length !== 6}
                  className="w-full mt-5 flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-brand-primary hover:bg-brand-primaryDark text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mfaSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-orange-300/40 border-t-white rounded-full animate-spin"></div>
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <span>Verify &amp; Sign In</span>
                  )}
                </button>

                <button
                  onClick={handleBackFromMfa}
                  className="w-full mt-3 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  Back to login
                </button>

                <p className="mt-4 text-xs text-center text-gray-400 dark:text-gray-500">
                  The code expires in 10 minutes. Check your spam folder if you don&apos;t see it.
                </p>
              </div>
            ) : (
              /* Login Card */
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8 border border-gray-200 dark:border-gray-700">
                {/* Logo/Home Link */}
                <div className="flex justify-center mb-6">
                  <button
                    onClick={() => router.push("/")}
                    className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                    aria-label="Go to homepage"
                    suppressHydrationWarning
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
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your email"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400"
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  {/* Password Field */}
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
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your password"
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-300 placeholder-gray-500 dark:placeholder-gray-400"
                        suppressHydrationWarning
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
                        suppressHydrationWarning
                      >
                        {formData.showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Turnstile Widget */}
                  <div>
                    <div ref={turnstileRef} className="flex justify-center" />
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
                    suppressHydrationWarning
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
            )}
          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};

export default AdminLogin;
