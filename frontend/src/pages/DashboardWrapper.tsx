import React from 'react';
import Dashboard from './Dashboard';
import { UserRole } from '../types/UserType';

const DashboardWrapper = () => {
  const [role, setRole] = React.useState<string | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);

  React.useEffect(() => {
    setRole(localStorage.getItem('role'));
    setAccessToken(localStorage.getItem('accessToken'));
  }, []);

  if (!role) return <div>Loading role...</div>;
  if (!accessToken) {
    console.error('Access token is missing. Please log in again.');
  }

  return <Dashboard role={role as UserRole} />;
};

export default DashboardWrapper;
