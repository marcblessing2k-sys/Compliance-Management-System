import logoImage from "../../../imports/majtech_vector_logo_3.png";
import { useState } from "react";
import { Mail, Phone, User, Lock, ArrowRight, Shield } from "lucide-react";
import { registerUser, saveRememberMe } from "../../utils/authService";

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onLoginClick: () => void;
}

export function RegisterPage({ onRegisterSuccess, onLoginClick }: RegisterPageProps) {
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) { setError("Please enter your name"); return; }
    if (!identifier) { setError(`Please enter your ${loginMethod}`); return; }
    if (loginMethod === "email" && !identifier.includes("@")) { setError("Please enter a valid email address"); return; }
    if (loginMethod === "phone" && identifier.length < 10) { setError("Please enter a valid phone number"); return; }
    if (!password) { setError("Please enter a password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      const result = await registerUser(name, identifier, password, loginMethod);
      if (!result.user) {
        setError(result.error || "Registration failed.");
        return;
      }
      if (rememberMe) saveRememberMe(identifier);
      onRegisterSuccess();
    } catch (err) {
      setError((err as Error).message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <img src={logoImage} alt="Majtech Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-600 mt-2">Register to access Compliance Management System</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]" />
              </div>
            </div>

            <div className="flex gap-2 mb-4">
              <button type="button" onClick={() => setLoginMethod("email")} className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${loginMethod === "email" ? "bg-[#5B9BD5] text-white" : "bg-gray-100 text-gray-600"}`}>
                <Mail size={20} /> Email
              </button>
              <button type="button" onClick={() => setLoginMethod("phone")} className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2 ${loginMethod === "phone" ? "bg-[#5B9BD5] text-white" : "bg-gray-100 text-gray-600"}`}>
                <Phone size={20} /> Phone
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {loginMethod === "email" ? "Email Address" : "Phone Number"}
              </label>
              <input type={loginMethod === "email" ? "email" : "tel"} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={loginMethod === "email" ? "your@email.com" : "+1234567890"} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Minimum 6 characters" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]" />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9BD5]" />
              </div>
            </div>

            <div className="mb-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 border-gray-300 rounded focus:ring-2 focus:ring-[#5B9BD5]" />
                <span className="text-sm text-gray-700">Remember me</span>
              </label>
            </div>

            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

            <button type="submit" disabled={loading} className="w-full bg-[#5B9BD5] hover:bg-[#4682B4] text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? "Creating Account..." : "Create Account"}
              <ArrowRight size={20} />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button onClick={onLoginClick} className="text-[#5B9BD5] hover:text-[#4682B4] font-semibold">Sign in here</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
