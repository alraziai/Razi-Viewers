import { useUserAuthentication } from '@ohif/ui-next';
import { Navigate } from 'react-router-dom';

export const PrivateRoute = ({ children, handleUnauthenticated }) => {
  const [authState] = useUserAuthentication();
  const user = authState?.user;
  const enabled = authState?.enabled;

  if (enabled && !user) {
    // If handleUnauthenticated is provided, use it (for OIDC)
    if (handleUnauthenticated) {
      return handleUnauthenticated();
    }
    // Otherwise, redirect to login
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return children;
};

export default PrivateRoute;
