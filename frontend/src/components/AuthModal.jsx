import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Truck, Building, CheckCircle2, KeyRound, ArrowLeft } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  // Modes: 'login', 'register', 'forgot_request', 'forgot_reset'
  const [mode, setMode] = useState('login');
  const [role, setRole] = useState('ROLE_TRAVELER');
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    vehicleNumber: '',
    preferredVehicleType: 'CAR',
    payoutAccountRef: '',
    resetCode: '',
    newPassword: ''
  });

  const [demoCodeNotice, setDemoCodeNotice] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const isReg = mode === 'register';
      const endpoint = isReg ? '/api/auth/register' : '/api/auth/login';
      const payload = isReg ? { ...formData, role } : { email: formData.email, password: formData.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Authentication failed. Please check your inputs.');
      }

      onAuthSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordRequest = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset code.');
      }

      setDemoCodeNotice(data.demoVerificationCode || '');
      setSuccessMessage('A 6-digit verification code has been generated!');
      setMode('forgot_reset');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          resetCode: formData.resetCode,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed.');
      }

      setSuccessMessage(data.message || 'Password successfully updated! Please sign in.');
      setMode('login');
      setFormData({ ...formData, password: '', resetCode: '', newPassword: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {mode.startsWith('forgot') && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
              {mode === 'register' && 'Create Your SPS Account'}
              {mode === 'login' && 'Sign In to Smart Parking'}
              {mode === 'forgot_request' && 'Reset Your Password'}
              {mode === 'forgot_reset' && 'Enter Verification Code'}
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            border: '1px solid #fecaca'
          }}>
            {error}
          </div>
        )}

        {successMessage && (
          <div style={{
            backgroundColor: 'var(--success-light)',
            color: '#065f46',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            marginBottom: '1rem',
            border: '1px solid #a7f3d0'
          }}>
            {successMessage}
          </div>
        )}

        {/* --- LOGIN & REGISTER FORMS --- */}
        {(mode === 'login' || mode === 'register') && (
          <form onSubmit={handleAuthSubmit}>
            {mode === 'register' && (
              <>
                <div className="form-group">
                  <label className="form-label">I want to register as:</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className={`btn ${role === 'ROLE_TRAVELER' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setRole('ROLE_TRAVELER')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Truck size={16} /> Traveler
                    </button>
                    <button
                      type="button"
                      className={`btn ${role === 'ROLE_OWNER' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setRole('ROLE_OWNER')}
                      style={{ fontSize: '0.85rem' }}
                    >
                      <Building size={16} /> Parking Owner
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g. John Doe"
                    className="form-input"
                    value={formData.name}
                    onChange={handleChange}
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="you@domain.com"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                    onClick={() => { setMode('forgot_request'); setError(''); setSuccessMessage(''); }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {mode === 'register' && role === 'ROLE_TRAVELER' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div className="form-group">
                  <label className="form-label">Vehicle Plate</label>
                  <input
                    type="text"
                    name="vehicleNumber"
                    placeholder="e.g. MH-12-AB-1234"
                    className="form-input"
                    value={formData.vehicleNumber}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select
                    name="preferredVehicleType"
                    className="form-select"
                    value={formData.preferredVehicleType}
                    onChange={handleChange}
                  >
                    <option value="CAR">Car</option>
                    <option value="BIKE">Two-Wheeler</option>
                    <option value="EV">Electric (EV)</option>
                    <option value="TRUCK">Truck / Heavy</option>
                  </select>
                </div>
              </div>
            )}

            {mode === 'register' && role === 'ROLE_OWNER' && (
              <div className="form-group">
                <label className="form-label">Payout Bank Account / UPI</label>
                <input
                  type="text"
                  name="payoutAccountRef"
                  placeholder="e.g. HDFC-98273641 or name@okhdfc"
                  className="form-input"
                  value={formData.payoutAccountRef}
                  onChange={handleChange}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : mode === 'register' ? 'Complete Registration' : 'Sign In'}
            </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD STEP 1: REQUEST CODE --- */}
        {mode === 'forgot_request' && (
          <form onSubmit={handleForgotPasswordRequest}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Enter the email associated with your account, and we will dispatch a 6-digit password reset verification code.
            </p>

            <div className="form-group">
              <label className="form-label">Account Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="e.g. traveler@sps.com"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Dispatching Code...' : 'Send Verification Code'}
            </button>
          </form>
        )}

        {/* --- FORGOT PASSWORD STEP 2: ENTER CODE & NEW PASSWORD --- */}
        {mode === 'forgot_reset' && (
          <form onSubmit={handleResetPasswordSubmit}>
            {demoCodeNotice && (
              <div style={{
                backgroundColor: 'var(--warning-light)',
                color: '#92400e',
                border: '1px dashed #f59e0b',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <KeyRound size={18} />
                <span>Demo Code: <strong>{demoCodeNotice}</strong></span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">6-Digit Verification Code</label>
              <input
                type="text"
                name="resetCode"
                required
                maxLength={6}
                placeholder="e.g. 123456"
                className="form-input"
                value={formData.resetCode}
                onChange={handleChange}
                style={{ letterSpacing: '0.25em', fontSize: '1.1rem', fontWeight: 700, textAlign: 'center' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                name="newPassword"
                required
                placeholder="Minimum 6 characters"
                className="form-input"
                value={formData.newPassword}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-success"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Updating Password...' : 'Confirm & Save New Password'}
            </button>
          </form>
        )}

        {/* Footer toggles */}
        <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.85rem' }}>
          {mode === 'register' ? (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
              >
                Sign In
              </button>
            </span>
          ) : mode === 'login' ? (
            <span>
              Need a new account?{' '}
              <button
                type="button"
                style={{ color: 'var(--primary)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                onClick={() => { setMode('register'); setError(''); setSuccessMessage(''); }}
              >
                Register Here
              </button>
            </span>
          ) : (
            <button
              type="button"
              style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => { setMode('login'); setError(''); setSuccessMessage(''); }}
            >
              Back to Sign In
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
