import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons, useUserAuthentication } from '@ohif/ui-next';
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
      <div className="absolute inset-0 overflow-hidden bg-[#2E86D51A]">
        <div className="h-full w-full">
          <Icons.BackgroundDots />
        </div>
      </div>

      {/* Main container - centered with width = 1.2 * height */}
      <div
        className="flex flex-row items-center justify-center overflow-hidden rounded-xl bg-[#2E86D51A] backdrop-blur-md"
        style={{
          height: '66vh',
          width: 'calc(66vh * 1.2)',
          maxWidth: '90vw',
          maxHeight: 'calc(90vw / 1.2)',
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
              <div className="ml-1 flex flex-row items-center gap-4">
                <Icons.RAZILogo />
                <Icons.RAZILogoText />
              </div>
            </div>

            {/* Login Title */}
            <h1 className="mb-8 text-2xl font-bold text-white text-center">Login</h1>

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
              <div
                className="rounded-full p-[2.5px]"
                style={{
                  background: 'linear-gradient(90deg, #42E3EE, #3ABDE4, #2E85D5, #2559C9, #1E3AC0, #1A26BB, #1920BA)',
                }}
              >
                <div className="rounded-full bg-[#0A1628]">
                  <input
                    type="text"
                    placeholder="Username or email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-full bg-[#D9D9D980] px-4 py-3 text-[#2E3957] transition-colors placeholder:text-[#2E3957] focus:outline-none font-bold text-lg"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div
                className="rounded-full p-[2.5px]"
                style={{
                  background: 'linear-gradient(90deg, #42E3EE, #3ABDE4, #2E85D5, #2559C9, #1E3AC0, #1A26BB, #1920BA)',
                }}
              >
                <div className="rounded-full bg-[#0A1628]">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full rounded-full bg-[#D9D9D980] px-4 py-3 text-[#2E3957] transition-colors placeholder:text-[#2E3957] focus:outline-none font-bold text-lg"
                    required
                  />
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-lg text-white font-bold transition-colors hover:text-[#48FFF6] duration-300"
                >
                  Forgot password?
                </button>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-full bg-gradient-to-b from-[#2E86D5] to-[#48FFF6] px-6 py-3 font-semibold text-[#001236] shadow-lg transition-all hover:shadow-xl hover:shadow-[#48FFF6]/20 disabled:cursor-not-allowed disabled:opacity-50 duration-150"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            {/* Signup Link */}
            <div className="mt-6 text-center">
              <span className="text-lg font-bold text-white">
                New user?{' '}
                <button
                  type="button"
                  className="text-[#48FFF6] transition-colors hover:text-[#5ACCE6] duration-300"
                >
                  Signup
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Skull image on the right - 55% width */}
        <div
          className="relative flex h-full items-center justify-center overflow-hidden bg-[#2E86D51A]"
          style={{ width: '55%' }}
        >
          <img
            src={`${publicUrl}assets/login/login-skull.png`}
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
                `${publicUrl}assets/login/login-skull.png`
              );
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
