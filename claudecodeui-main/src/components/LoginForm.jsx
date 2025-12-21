import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Terminal } from 'lucide-react';

/**
 * LoginForm - CCui styled login page
 *
 * Design: Pure black background with coral accent
 * Matches the terminal-style aesthetic of the main UI
 */
const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }

    setIsLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Card with subtle border */}
        <div className="bg-ccui-bg-secondary border border-ccui-border-primary rounded-lg p-8 space-y-6">
          {/* Logo and Title */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-ccui-bg-tertiary border border-ccui-border-secondary rounded-lg flex items-center justify-center">
                <Terminal className="w-6 h-6 text-ccui-accent" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-ccui-text-primary">Claude Code UI</h1>
            <p className="text-ccui-text-muted text-sm mt-1">
              Sign in to continue
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-medium text-ccui-text-secondary mb-1.5 uppercase tracking-wide">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 border border-ccui-border-secondary rounded bg-ccui-bg-tertiary text-ccui-text-primary placeholder-ccui-text-tertiary focus:outline-none focus:border-ccui-accent focus:ring-1 focus:ring-ccui-accent/50 text-sm transition-colors"
                placeholder="Enter username"
                required
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-ccui-text-secondary mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-ccui-border-secondary rounded bg-ccui-bg-tertiary text-ccui-text-primary placeholder-ccui-text-tertiary focus:outline-none focus:border-ccui-accent focus:ring-1 focus:ring-ccui-accent/50 text-sm transition-colors"
                placeholder="Enter password"
                required
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-red-900/20 border border-red-800/50 rounded">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-ccui-accent hover:bg-ccui-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded text-sm transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Footer hint */}
          <div className="text-center pt-2 border-t border-ccui-border-primary">
            <p className="text-xs text-ccui-text-tertiary">
              Terminal-style interface for Claude Code
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
