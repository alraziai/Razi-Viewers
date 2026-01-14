import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserAuthentication } from '@ohif/ui-next';
import PropTypes from 'prop-types';
import { publicUrl } from '../../utils/publicUrl';

function Login({ servicesManager }) {
  const navigate = useNavigate();
  const [authState] = useUserAuthentication();
  const user = authState?.user;
  const { userAuthenticationService } = servicesManager.services;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleLogin = async e => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate credentials
    if (email === 'amahdy@alrazi.ai' && password === 'amahdy') {
      const userData = {
        email: 'amahdy@alrazi.ai',
        firstName: 'Abd Elrahman',
        lastName: 'Mahdy',
        name: 'Abd Elrahman Mahdy',
      };

      // Store in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');

      // Set user in authentication service
      userAuthenticationService.setUser(userData);

      // Enable authentication
      userAuthenticationService.set({ enabled: true });

      // Log login event
      console.log('[AUTH] User logged in:', userData.email, new Date().toISOString());

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } else {
      setError('Invalid email or password');
    }

    setIsLoading(false);
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center overflow-hidden bg-[#0A1628]">
      {/* Background with dots pattern */}
      <div
        className="absolute inset-0 bg-[#0A1628]"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(72, 255, 246, 0.15) 1px, transparent 1px)`,
          backgroundSize: '30px 30px',
        }}
      />

      {/* Main container - centered with width = 1.2 * height */}
      <div
        className="flex flex-row items-center justify-center overflow-hidden rounded-xl backdrop-blur-sm"
        style={{
          height: '66vh',
          width: 'calc(66vh * 1.2)',
          maxWidth: '90vw',
          maxHeight: 'calc(90vw / 1.2)',
          backgroundColor: 'rgba(10, 22, 40, 0.75)',
          boxShadow:
            '0 0 30px rgba(72, 255, 246, 0.3), 0 0 60px rgba(72, 255, 246, 0.15), inset 0 0 20px rgba(72, 255, 246, 0.1)',
          border: '1px solid rgba(72, 255, 246, 0.4)',
        }}
      >
        {/* Login form container - 45% width */}
        <div
          className="relative z-10 flex h-full items-center justify-center"
          style={{ width: '45%' }}
        >
          <div
            className="w-full p-8"
            style={{
              backgroundColor: 'transparent',
            }}
          >
            {/* Logo and Brand */}
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9H21ZM19 21H5V3H13V9H19V21Z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white">AI RAZI</span>
            </div>

            {/* Login Title */}
            <h1 className="mb-8 text-3xl font-bold text-white">Login</h1>

            {/* Error message */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/20 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Login Form */}
            <form
              onSubmit={handleLogin}
              className="space-y-6"
            >
              {/* Email/Username Input */}
              <div>
                <input
                  type="text"
                  placeholder="Username or email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-[#1A1F2E] px-4 py-3 text-white transition-colors placeholder:text-gray-400 focus:border-[#48FFF6] focus:outline-none focus:ring-2 focus:ring-[#48FFF6]/20"
                  required
                />
              </div>

              {/* Password Input */}
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-600 bg-[#1A1F2E] px-4 py-3 text-white transition-colors placeholder:text-gray-400 focus:border-[#48FFF6] focus:outline-none focus:ring-2 focus:ring-[#48FFF6]/20"
                  required
                />
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm text-white transition-colors hover:text-[#48FFF6]"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-lg bg-gradient-to-r from-[#5ACCE6] to-[#48FFF6] px-6 py-3 font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:shadow-[#48FFF6]/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <span className="text-sm text-white">
                New user?{' '}
                <button
                  type="button"
                  className="text-sm font-semibold text-[#48FFF6] transition-colors hover:text-[#5ACCE6]"
                >
                  Signup
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Skull image on the right - 55% width */}
        <div
          className="relative flex h-full items-center justify-center overflow-hidden"
          style={{ width: '55%' }}
        >
          <img
            src={`${publicUrl}assets/login/login-skull.svg`}
            alt="Medical skull"
            className="h-full w-full object-cover object-center"
            style={{
              opacity: 0.85,
              mixBlendMode: 'lighten',
            }}
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
              const target = e.target as HTMLImageElement;
              console.error('Failed to load skull image. Tried path:', target.src);
              // Try fallback path
              target.src = '/assets/login/login-skull.svg';
            }}
            onLoad={() => {
              console.log(
                'Skull image loaded successfully from:',
                `${publicUrl}assets/login/login-skull.svg`
              );
            }}
          />
          {/* Overlay gradient to blend image with container */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to left, rgba(10, 22, 40, 0.4) 0%, transparent 30%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

Login.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      userAuthenticationService: PropTypes.shape({
        setUser: PropTypes.func.isRequired,
        set: PropTypes.func.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default Login;
