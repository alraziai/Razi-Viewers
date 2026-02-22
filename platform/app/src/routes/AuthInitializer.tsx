import { useEffect } from 'react';
import { useUserAuthentication } from '@ohif/ui-next';
import PropTypes from 'prop-types';

/**
 * Component that initializes authentication state from localStorage on app load
 */
function AuthInitializer({ servicesManager }) {
  const { userAuthenticationService } = servicesManager.services;
  const [authState] = useUserAuthentication();
  const user = authState?.user;

  useEffect(() => {
    // Check localStorage for existing session
    const storedUser = localStorage.getItem('user');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (storedUser && isLoggedIn && !user) {
      try {
        const userData = JSON.parse(storedUser);
        // Set user in authentication service
        userAuthenticationService.setUser(userData);
        // Enable authentication
        userAuthenticationService.set({ enabled: true });
        console.log('[AUTH] Session restored from localStorage:', userData.email);
      } catch (e) {
        console.error('[AUTH] Failed to restore session:', e);
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
      }
    }
  }, []); // Only run on mount

  return null; // This component doesn't render anything
}

AuthInitializer.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      userAuthenticationService: PropTypes.shape({
        setUser: PropTypes.func.isRequired,
        set: PropTypes.func.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
};

export default AuthInitializer;
