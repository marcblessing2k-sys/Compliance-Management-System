import { useState, useEffect } from "react";
import { Mail, Phone, Lock, ArrowRight } from "lucide-react";
import {
  authenticateUser,
  createSession,
  saveRememberMe,
  getRememberMe,
  clearRememberMe,
} from "../../utils/authService";
import { ForgotPasswordModal } from "./ForgotPasswordModal";
import logoImage from "../../../imports/majtech_vector_logo_3.png";
import { toast, Toaster } from "sonner";
import React from "react";

interface LoginPageProps {
  onLoginSuccess: () => void;
  onRegisterClick: () => void;
}

export function LoginPage({ onLoginSuccess, onRegisterClick }: LoginPageProps) {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  useEffect(() => {
    const saved = getRememberMe();
    if (saved) {
      setIdentifier(saved.identifier);
      setRememberMe(true);
      setLoginMethod(saved.identifier.includes("@") ? "email" : "phone");
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!identifier) {
      setError(`Please enter your ${loginMethod}`);
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }
    if (loginMethod === "email" && !identifier.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (loginMethod === "phone" && identifier.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    setLoading(true);
    try {
      const result = await authenticateUser(identifier, password);
      if (!result.user) {
        setError(result.error || "Invalid credentials.");
        return;
      }

      if (rememberMe) {
        saveRememberMe(identifier);
      } else {
        clearRememberMe();
      }

      await createSession(result.user);
      toast.success("Login successful! A security notification has been sent to your email.", { duration: 5000 });
      onLoginSuccess();
    } catch (err) {
      setError((err as Error).message || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <img src={logoImage} alt="Majtech Logo" className="w-24 h-24 object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to access Compliance Management System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <form onSubmit={handleLogin}>
              <div className="flex gap-2 mb-6">
                <button type="button" onClick={() => setLoginMethod("email")} className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${loginMethod === "email" ? "bg-[#5B9BD5] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  <Mail size={20} /> Email
                </button>
                <button type="button" onClick={() => setLoginMethod("phone")} className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all ${loginMethod === "phone" ? "bg-[#5B9BD5] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  <Phone size={20} /> Phone
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {loginMethod === "email" ? "Email Address" : "Phone Number"}
                </label>
                <input
                  type={loginMethod === "email" ? "email" : "tel"}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={loginMethod === "email" ? "your@email.com" : "+1234567890"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]"
                  />
                </div>
              </div>

              <div className="mb-6 flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-[#5B9BD5] border-gray-300 rounded focus:ring-2 focus:ring-[#5B9BD5]" />
                  <span className="text-sm text-gray-700">Remember me</span>
                </label>
                <button type="button" onClick={() => setShowForgotPassword(true)} className="text-sm text-[#5B9BD5] hover:text-[#4682B4] font-semibold">
                  Forgot Password?
                </button>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <button type="submit" disabled={loading} className="w-full bg-[#5B9BD5] hover:bg-[#4682B4] text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                {loading ? "Signing in..." : "Sign In"}
                <ArrowRight size={20} />
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <button onClick={onRegisterClick} className="text-[#5B9BD5] hover:text-[#4682B4] font-semibold">
                  Register here
                </button>
              </p>
            </div>
          </div>

          {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
        </div>
      </div>
    </>
  );
}
