import React, { useState } from 'react';
import { User, Car, DollarSign, Lock, X, CheckCircle, AlertCircle, Save } from 'lucide-react';

export default function ProfileModal({ currentUser, onClose, onProfileUpdated }) {
  const [name, setName] = useState(currentUser?.name || '');
  const [vehicleNumber, setVehicleNumber] = useState(currentUser?.vehicleNumber || '');
  const [preferredVehicleType, setPreferredVehicleType] = useState(currentUser?.preferredVehicleType || 'CAR');
  const [payoutAccountRef, setPayoutAccountRef] = useState(currentUser?.payoutAccountRef || '');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          name,
          vehicleNumber,
          preferredVehicleType,
          payoutAccountRef,
          newPassword: newPassword || null
        })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage('Profile updated successfully!');
        const updatedUser = {
          ...currentUser,
          name: data.user?.name || name,
          vehicleNumber: data.user?.vehicleNumber || vehicleNumber,
          preferredVehicleType: data.user?.preferredVehicleType || preferredVehicleType,
          payoutAccountRef: data.user?.payoutAccountRef || payoutAccountRef
        };
        onProfileUpdated(updatedUser);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection error updating profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '520px',
        padding: '2rem',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
            color: '#fff',
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              My Account Profile
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Manage personal info, vehicle plates, and payout preferences
            </p>
          </div>
        </div>

        {message && (
          <div style={{
            backgroundColor: '#ecfdf5',
            color: '#065f46',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            border: '1px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <CheckCircle size={16} /> {message}
          </div>
        )}

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#991b1b',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            border: '1px solid #fecaca',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Full Name
            </label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
              Email Address (Login Identity)
            </label>
            <input
              type="email"
              className="input-field"
              value={currentUser?.email || ''}
              disabled
              style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
                <Car size={14} /> Vehicle Plate
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. MH 12 AB 1234"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                Preferred Vehicle
              </label>
              <select
                className="input-field"
                value={preferredVehicleType}
                onChange={(e) => setPreferredVehicleType(e.target.value)}
              >
                <option value="CAR">Car</option>
                <option value="BIKE">Two Wheeler / Bike</option>
                <option value="EV">Electric Vehicle (EV)</option>
                <option value="TRUCK">Heavy / Truck</option>
              </select>
            </div>
          </div>

          {currentUser?.role === 'ROLE_OWNER' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
                <DollarSign size={14} /> Owner Payout Bank Account / UPI
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. HDFC0001234 / owner@okhdfc"
                value={payoutAccountRef}
                onChange={(e) => setPayoutAccountRef(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.35rem' }}>
              <Lock size={14} /> New Password (Optional)
            </label>
            <input
              type="password"
              className="input-field"
              placeholder="Leave blank to keep unchanged"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              style={{ flex: 1 }}
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              disabled={loading}
            >
              <Save size={16} /> {loading ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
