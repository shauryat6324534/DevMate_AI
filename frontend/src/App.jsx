import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';

// Import PrismTomorrow theme stylesheets for syntax highlighting
import 'prismjs/themes/prism-tomorrow.css';

export function App() {
  const [token, setToken] = useState(localStorage.getItem('devmate_token') || null);
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('devmate_theme') || 'dark');

  // Load user data on startup
  useEffect(() => {
    const cachedUser = localStorage.getItem('devmate_user');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
      } catch (err) {
        console.error('Failed to parse cached user:', err);
      }
    }
  }, [token]);

  // Synchronize CSS class modifiers on document base element for theme support
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('devmate_theme', theme);
  }, [theme]);

  const handleAuthSuccess = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('devmate_token');
    localStorage.removeItem('devmate_user');
    setToken(null);
    setUser(null);
  };

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  if (!token) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <DashboardPage
      token={token}
      user={user}
      theme={theme}
      toggleTheme={toggleTheme}
      onLogout={handleLogout}
    />
  );
}

export default App;
