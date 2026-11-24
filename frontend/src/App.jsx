import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import ParkFinderView from './components/ParkFinderView';
import TravelerBookingsView from './components/TravelerBookingsView';
import OwnerPortalView from './components/OwnerPortalView';
import AdminPortalView from './components/AdminPortalView';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sps_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('discovery');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Sync tab with user role upon login
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'ROLE_OWNER' && activeTab === 'discovery') {
        setActiveTab('owner-portal');
      } else if (currentUser.role === 'ROLE_ADMIN' && activeTab === 'discovery') {
        setActiveTab('admin-portal');
      }
    }
  }, [currentUser]);

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    localStorage.setItem('sps_user', JSON.stringify(userData));
    if (userData.role === 'ROLE_OWNER') {
      setActiveTab('owner-portal');
    } else if (userData.role === 'ROLE_ADMIN') {
      setActiveTab('admin-portal');
    } else {
      setActiveTab('discovery');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('sps_user');
    setActiveTab('discovery');
  };

  const handleQuickLogin = async (email, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        handleAuthSuccess(data);
      } else {
        alert('Quick login failed. Ensure the backend server is running.');
      }
    } catch (err) {
      console.error(err);
      alert('Backend connection error.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        onQuickLogin={handleQuickLogin}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '3rem' }}>
        {activeTab === 'discovery' && (
          <ParkFinderView
            currentUser={currentUser}
            onRequireAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'my-bookings' && (
          <TravelerBookingsView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'owner-portal' && (
          <OwnerPortalView
            currentUser={currentUser}
          />
        )}

        {activeTab === 'admin-portal' && (
          <AdminPortalView
            currentUser={currentUser}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#ffffff',
        borderTop: '1px solid var(--border)',
        padding: '1.5rem 0',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
        marginTop: 'auto'
      }}>
        <div className="app-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>Smart Parking System (Release 1.0)</strong> — Software Architecture & Design Full Stack Project
          </div>
          <div style={{ fontSize: '0.8rem' }}>
            Built with Spring Boot 3.4 • MySQL 8.0 • React • JWT Security
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile Modal */}
      {isProfileOpen && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          onClose={() => setIsProfileOpen(false)}
          onProfileUpdated={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('sps_user', JSON.stringify(updated));
          }}
        />
      )}

    </div>
  );
}
