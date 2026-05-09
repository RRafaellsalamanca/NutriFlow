import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../auth/AuthContext';
import { LoveEffect } from './LoveEffect';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="layout-container">
      {user?.email === 'isabella@gmail.com' && <LoveEffect />}
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};
