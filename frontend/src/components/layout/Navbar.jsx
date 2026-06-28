import React, { useState, useEffect } from 'react';
import { 
  Code2, Sun, Moon, LogOut, User, KeyRound, Check, RefreshCw, X, ShieldAlert 
} from 'lucide-react';

export const Navbar = ({ user, token, theme, toggleTheme, onLogout }) => {
  const [healthStatus, setHealthStatus] = useState('offline');
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [feedbackType, setFeedbackType] = useState('success');
  const [updating, setUpdating] = useState(false);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const response = await fetch('http://localhost:5000/api/health');
      if (response.ok) {
        setHealthStatus('online');
      } else {
        setHealthStatus('offline');
      }
    } catch {
      setHealthStatus('offline');
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setUpdating(true);

    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to update profile');
      }

      localStorage.setItem('devmate_user', JSON.stringify(resJson.data));
      setFeedback('Profile details updated successfully');
      setFeedbackType('success');
    } catch (err) {
      setFeedback(err.message);
      setFeedbackType('error');
    } finally {
      setUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setFeedback(null);
    setUpdating(true);

    try {
      if (newPassword.length < 6) {
        throw new Error('New password must be at least 6 characters long');
      }

      const response = await fetch('http://localhost:5000/api/profile/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || 'Failed to change password');
      }

      setFeedback('Password changed successfully');
      setFeedbackType('success');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setFeedback(err.message);
      setFeedbackType('error');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#090d16]/80 border-b border-gray-800/60 px-6 py-4 flex items-center justify-between transition-all dark:bg-[#090d16]/80 light:bg-white/80 light:border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Code2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white light:text-gray-900 bg-clip-text bg-gradient-to-r from-white to-gray-400">
              DevMate <span className="text-indigo-400">AI</span>
            </span>
            <span className="block text-[10px] text-gray-500 font-mono tracking-wider uppercase">SaaS Workspace</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* API Health Monitor */}
          <div className="flex items-center space-x-2">
            <button 
              onClick={fetchHealth}
              disabled={loadingHealth}
              className="p-2 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-white transition-all disabled:opacity-50 light:bg-gray-100 light:border-gray-200 light:text-gray-600"
              title="Refresh Connection State"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHealth ? 'animate-spin' : ''}`} />
            </button>
            <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-[10px] font-medium font-mono ${
              healthStatus === 'online'
                ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400 light:bg-emerald-50 light:border-emerald-200 light:text-emerald-600'
                : 'bg-red-950/30 border-red-800/60 text-red-400 light:bg-red-50 light:border-red-200 light:text-red-600'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                healthStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'
              }`}></span>
              <span className="hidden sm:inline">{healthStatus === 'online' ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
          </div>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700 transition-all light:bg-gray-100 light:border-gray-200 light:text-gray-600 light:hover:bg-gray-200"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Settings Dropdown */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowProfileModal(true)}
              className="px-3 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all light:bg-gray-100 light:border-gray-200 light:text-gray-700"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{user?.name || 'Account'}</span>
            </button>

            <button
              onClick={onLogout}
              className="p-2.5 bg-red-950/30 border border-red-900/40 hover:bg-red-950/60 text-red-400 hover:text-red-300 rounded-xl transition-all"
              title="Logout Account"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Profile/Account management dialog modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-3xl p-6 relative shadow-2xl glow-indigo">
            <button 
              onClick={() => {
                setShowProfileModal(false);
                setFeedback(null);
              }}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-2">
              <User className="w-5 h-5 text-indigo-400" />
              <span>Profile Settings</span>
            </h3>
            <p className="text-xs text-gray-400 mb-6">Manage your credentials and change account passwords.</p>

            {feedback && (
              <div className={`mb-6 p-4 rounded-xl text-xs flex items-center space-x-2 border ${
                feedbackType === 'success' 
                  ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-400' 
                  : 'bg-red-950/30 border-red-800/60 text-red-400'
              }`}>
                {feedbackType === 'success' ? <Check className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                <span>{feedback}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Form 1: General Info Details */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono">Personal Info</h4>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-semibold font-mono uppercase">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-lg p-2 text-sm text-white outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-semibold font-mono uppercase">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-lg p-2 text-sm text-white outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Save Changes
                </button>
              </form>

              {/* Form 2: Password Updates Details */}
              <form onSubmit={handlePasswordUpdate} className="space-y-4 border-t md:border-t-0 md:border-l md:pl-6 border-gray-800/80">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Update Password</span>
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-semibold font-mono uppercase">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-lg p-2 text-sm text-white outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-gray-500 font-semibold font-mono uppercase">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 focus:border-indigo-500 rounded-lg p-2 text-sm text-white outline-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={updating}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
                >
                  Change Password
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
