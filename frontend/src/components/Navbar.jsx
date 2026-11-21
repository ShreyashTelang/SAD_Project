import React from 'react';
import { Car, ShieldCheck, UserCheck, LogOut, Sparkles, MapPin, Calendar, LayoutDashboard } from 'lucide-react';

export default function Navbar({ currentUser, activeTab, setActiveTab, onLogout, onQuickLogin, onOpenAuth }) {
  return (
    <header style={{
      backgroundColor: '#ffffff',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="app-container" style={{ padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => setActiveTab('discovery')}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#fff',
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(37,99,235,0.3)'
          }}>
            <Car size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.025em', margin: 0 }}>
              Smart<span style={{ color: 'var(--primary)' }}>Parking</span>
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              REAL-TIME DISCOVERY & BOOKING
            </p>
          </div>
        </div>

        {/* Navigation Tabs based on role */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            className={`btn btn-sm ${activeTab === 'discovery' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('discovery')}
          >
            <MapPin size={16} /> ParkFinder
          </button>

          {currentUser?.role === 'ROLE_TRAVELER' && (
            <button
              className={`btn btn-sm ${activeTab === 'my-bookings' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('my-bookings')}
            >
              <Calendar size={16} /> My Bookings
            </button>
          )}

          {currentUser?.role === 'ROLE_OWNER' && (
            <button
              className={`btn btn-sm ${activeTab === 'owner-portal' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('owner-portal')}
            >
              <LayoutDashboard size={16} /> Owner Portal
            </button>
          )}

          {currentUser?.role === 'ROLE_ADMIN' && (
            <button
              className={`btn btn-sm ${activeTab === 'admin-portal' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setActiveTab('admin-portal')}
            >
              <ShieldCheck size={16} /> Admin Console
            </button>
          )}
        </nav>

        {/* User / Demo Switcher Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Quick Demo Switcher */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            backgroundColor: '#f1f5f9',
            padding: '0.25rem 0.5rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.75rem'
          }}>
            <Sparkles size={14} color="#f59e0b" />
            <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>Demo:</span>
            <button
              style={{ background: 'none', border: 'none', color: '#2563eb', cursor: 'pointer', fontWeight: 600, padding: '0 4px' }}
              onClick={() => onQuickLogin('traveler@sps.com', 'traveler123')}
            >
              Traveler
            </button>
            <span>|</span>
            <button
              style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 600, padding: '0 4px' }}
              onClick={() => onQuickLogin('owner@sps.com', 'owner123')}
            >
              Owner
            </button>
            <span>|</span>
            <button
              style={{ background: 'none', border: 'none', color: '#7c3aed', cursor: 'pointer', fontWeight: 600, padding: '0 4px' }}
              onClick={() => onQuickLogin('admin@sps.com', 'admin123')}
            >
              Admin
            </button>
          </div>

          {/* User profile / Login */}
          {currentUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {currentUser.name}
                </div>
                <div className={`badge ${
                  currentUser.role === 'ROLE_ADMIN' ? 'badge-danger' :
                  currentUser.role === 'ROLE_OWNER' ? 'badge-warning' : 'badge-primary'
                }`} style={{ fontSize: '0.65rem' }}>
                  {currentUser.role.replace('ROLE_', '')}
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={onLogout}
                title="Sign Out"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <UserCheck size={16} /> Sign In / Register
            </button>
          )}

        </div>
      </div>
    </header>
  );
}
