"use client";

import { ArrowRight, Mail, Eye, EyeOff, User, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppDispatch } from "@/redux/hooks";
import { setCheckInDate, setCheckOutDate, setGuests } from "@/redux/slices/bookingSlice";
import { signIn } from "next-auth/react";
import { toast } from "react-hot-toast";
import Footer from "./Footer";
import Image from "next/image";

const Login = () => {
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isHavenLoading, setIsHavenLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isFacebookLoading, setIsFacebookLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSocialLogin = async (provider: string) => {
    if (provider.toLowerCase() === "google") {
      setIsGoogleLoading(true);
    } else if (provider.toLowerCase() === "facebook") {
      setIsFacebookLoading(true);
    }

    try {
      if (provider.toLowerCase() === "google") {
        await signIn("google", { callbackUrl: "/rooms" });
      } else if (provider.toLowerCase() === "facebook") {
        await signIn("facebook", { callbackUrl: "/rooms" });
      } else {
        alert(`${provider} login not yet implemented`);
        setIsGoogleLoading(false);
        setIsFacebookLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login");
      setIsGoogleLoading(false);
      setIsFacebookLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { name, value } = e.target;

  // ❌ Disallow spaces in password fields
  if ((name === "password" || name === "confirmPassword") && /\s/.test(value)) {
    setErrors((prev) => ({
      ...prev,
      [name]: "Password must not contain spaces",
    }));
    return;
  }

  setFormData((prev) => ({ ...prev, [name]: value }));
  setErrors((prev) => ({ ...prev, [name]: "" }));
};


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showEmailForm) {
        if (mode === "login") {
          handleEmailLogin();
        } else {
          handleRegister();
        }
      }
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    };
    let isValid = true;

    // Name validation (only for register mode)
    if (mode === "register" && !formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
      isValid = false;
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (/\s/.test(formData.password)) {
      newErrors.password = "Password must not contain spaces";
      isValid = false;
    } else if (mode === "register" && formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
      isValid = false;
    }

    // Confirm password validation (only for register mode)
    if (mode === "register") {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
        isValid = false;
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }
    if (mode === "register" && /\s/.test(formData.confirmPassword)) {
      newErrors.confirmPassword = "Password must not contain spaces";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleEmailLogin = async () => {
    if (!validateForm()) return;

    setIsEmailLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error(result.error || "Invalid email or password", {
          duration: 4000,
          position: 'top-center',
        });
        // Clear form fields on error
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setIsEmailLoading(false);
        return;
      }

      if (result?.ok) {
        toast.success("Login successful!", {
          duration: 3000,
          position: 'top-center',
        });
        router.push("/rooms");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred during login", {
        duration: 4000,
        position: 'top-center',
      });
      // Clear form fields on error
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setIsEmailLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsEmailLoading(true);

    try {
      const requestBody = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      };
      
      console.log("Sending registration request:", requestBody);
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      console.log("Response status:", response.status);
      
      let data;
      try {
        data = await response.json();
        console.log("Response data:", data);
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        throw new Error("Failed to parse server response");
      }

      if (!response.ok) {
        // Display error message from API or fallback message
        const errorMessage = data.error || "Registration failed";
        toast.error(errorMessage, {
          duration: 4000,
          position: 'top-center',
        });
        // Clear form fields on error
        setFormData({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setIsEmailLoading(false);
        return;
      }

      toast.success("Registration successful! Logging you in...", {
        duration: 3000,
        position: 'top-center',
      });

      // Auto-login after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.ok) {
        router.push("/rooms");
      } else {
        toast.error("Please login with your new account", {
          duration: 4000,
          position: 'top-center',
        });
        setMode("login");
        setIsEmailLoading(false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Show more specific error message
      const errorMessage = error instanceof Error ? error.message : "An error occurred during registration";
      toast.error(errorMessage, {
        duration: 4000,
        position: 'top-center',
      });
      // Clear form fields on error
      setFormData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
      });
      setIsEmailLoading(false);
    }
  };

  const handleGuestLogin = () => {
    setIsGuestLoading(true);

    // Set smart defaults: today + tomorrow + 2 guests
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Format dates as YYYY-MM-DD for the date pickers
    const formatDate = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Set booking data with smart defaults
    dispatch(setCheckInDate(formatDate(today)));
    dispatch(setCheckOutDate(formatDate(tomorrow)));
    dispatch(setGuests({ adults: 2, children: 0, infants: 0 }));

    setTimeout(() => {
      router.push("/rooms");
      setIsGuestLoading(false);
    }, 1500);
  };

  return (
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
                {showEmailForm
                  ? (mode === "login" ? "Welcome Back" : "Create Account")
                  : "Welcome Back"}
              </h1>
              <p className="text-gray-600 dark:text-gray-300">
                {showEmailForm
                  ? (mode === "login" ? "Sign in to continue your booking" : "Join Staycation Haven today")
                  : "Sign in to continue your booking"}
              </p>
            </div>

            {showEmailForm ? (
              <>
                {/* Back Button */}
                <button
                  onClick={() => setShowEmailForm(false)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-brand-primary dark:hover:text-brand-primary mb-6 transition-colors"
                >
                  <ArrowRight className="w-4 h-4 rotate-180" />
                  <span>Back to all options</span>
                </button>

                {/* Mode Toggle */}
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <button
                    onClick={() => setMode("login")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      mode === "login"
                        ? "bg-white dark:bg-gray-800 text-brand-primary shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    Login
                  </button>
                  <button
                    onClick={() => setMode("register")}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      mode === "register"
                        ? "bg-white dark:bg-gray-800 text-brand-primary shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                    }`}
                  >
                    Register
                  </button>
                </div>

                {/* Email/Password Form */}
                <div className="space-y-4 mb-6">
                  {/* Name field (only for register) */}
                  {mode === "register" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Enter your full name"
                          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                        />
                      </div>
                      {errors.name && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>
                  )}

                  {/* Email field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  {/* Password field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.password}</p>
                    )}
                  </div>

                  {/* Confirm Password field (only for register) */}
                  {mode === "register" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          placeholder="Confirm your password"
                          className="w-full pl-10 pr-12 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all placeholder-gray-500 dark:placeholder-gray-400"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-red-600 dark:text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    onClick={mode === "login" ? handleEmailLogin : handleRegister}
                    disabled={isEmailLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-brand-primary hover:bg-brand-primaryDark text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isEmailLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-orange-300/40 border-t-white rounded-full animate-spin"></div>
                        <span>{mode === "login" ? "Logging in..." : "Creating account..."}</span>
                      </>
                    ) : (
                      <>
                        <span>{mode === "login" ? "Login" : "Create Account"}</span>
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                      Or continue with
                    </span>
                  </div>
                </div>

                {/* Social Sign In Options */}
                <div className="space-y-3">
                  {/* Google Sign In */}
                  <button
                    onClick={() => handleSocialLogin("google")}
                    disabled={isGoogleLoading || isFacebookLoading || isGuestLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Continue with Google"
                  >
                {isGoogleLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-red-200 dark:border-red-900 border-t-red-600 dark:border-t-red-500 rounded-full animate-spin"></div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Processing...
                    </span>
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5 text-red-600 dark:text-red-500" />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Continue with Google
                    </span>
                  </>
                )}
              </button>
                  {/* Facebook Sign In */}
                  <button
                    onClick={() => handleSocialLogin("facebook")}
                    disabled={isGoogleLoading || isFacebookLoading || isGuestLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Continue with Facebook"
                  >
                {isFacebookLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin"></div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Processing...
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-500" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Continue with Facebook
                    </span>
                  </>
                )}
                  </button>

                   {/* Continue with Haven Button */}
                <button
                  onClick={() => {
                    setIsHavenLoading(true);
                    setTimeout(() => {
                      setShowEmailForm(true);
                      setIsHavenLoading(false);
                    }, 300);
                  }}
                  disabled={isGoogleLoading || isFacebookLoading || isGuestLoading || isHavenLoading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-lg bg-white border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Continue with Haven"
                >
                {isHavenLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-orange-200 dark:border-orange-900 border-t-orange-600 dark:border-t-orange-500 rounded-full animate-spin"></div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Processing...
                    </span>
                  </>
                ) : (
                  <>
                    <Image
                      src="/haven_logo.png"
                      alt="Haven"
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Continue with Haven
                    </span>
                  </>
                )}
                </button>
                </div>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm">
                      Or continue as guest
                    </span>
                  </div>
                </div>

                {/* Guest Login */}
                <div className="mb-8">
                  <button
                    onClick={handleGuestLogin}
                    disabled={isGoogleLoading || isFacebookLoading || isGuestLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-brand-primary hover:bg-brand-primaryDark text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Continue as Guest"
                  >
                {isGuestLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-orange-300/40 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>Continue as Guest</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Guest users can book rooms with smart defaults
                  </p>
                </div>
              </>
            )}

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
  );
};

export default Login;