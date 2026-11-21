import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Building, Calendar, DollarSign, Check, X, Ban, Activity } from 'lucide-react';

export default function AdminPortalView({ currentUser }) {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [activeAdminTab, setActiveAdminTab] = useState('analytics');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const fetchAdminData = async () => {
    if (!currentUser?.token) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${currentUser.token}` };

      const anaRes = await fetch('/api/admin/analytics', { headers });
      if (anaRes.ok) setAnalytics(await anaRes.json());

      const userRes = await fetch('/api/admin/users', { headers });
      if (userRes.ok) setUsers(await userRes.json());

      const facRes = await fetch('/api/admin/facilities', { headers });
      if (facRes.ok) setFacilities(await facRes.json());

      const bkRes = await fetch('/api/admin/bookings', { headers });
      if (bkRes.ok) setBookings(await bkRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [currentUser]);

  const handleUpdateOwnerApproval = async (userId, status) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/approval?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setFeedback(`Owner status updated to ${status}.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBlockUser = async (userId) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-block`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setFeedback('User status toggled successfully.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateFacilityStatus = async (facId, status) => {
    try {
      const res = await fetch(`/api/admin/facilities/${facId}/verification?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setFeedback(`Facility listing verification set to ${status}.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container" style={{ textAlign: 'left' }}>
      
      {/* Title */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>System Administration Console</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Platform-wide governance: approvals, user blocking, facility listing oversight, and analytics.
        </p>
      </div>

      {feedback && (
        <div style={{
          backgroundColor: 'var(--success-light)',
          color: '#065f46',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          border: '1px solid #a7f3d0'
        }}>
          {feedback}
        </div>
      )}

      {/* Sub-nav tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          className={`btn btn-sm ${activeAdminTab === 'analytics' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveAdminTab('analytics')}
        >
          <Activity size={14} /> Analytics Overview
        </button>
        <button
          className={`btn btn-sm ${activeAdminTab === 'users' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveAdminTab('users')}
        >
          <Users size={14} /> User Governance ({users.length})
        </button>
        <button
          className={`btn btn-sm ${activeAdminTab === 'facilities' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveAdminTab('facilities')}
        >
          <Building size={14} /> Facility Approvals ({facilities.length})
        </button>
        <button
          className={`btn btn-sm ${activeAdminTab === 'bookings' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveAdminTab('bookings')}
        >
          <Calendar size={14} /> Global Bookings ({bookings.length})
        </button>
      </div>

      {/* Analytics Tab */}
      {activeAdminTab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>PLATFORM REVENUE</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46', marginTop: '0.25rem' }}>
                ₹{analytics?.totalPlatformRevenue || 0}
              </div>
            </div>

            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL USERS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                {analytics?.totalUsers || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {analytics?.totalTravelers} Travelers, {analytics?.totalOwners} Owners
              </div>
            </div>

            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL PARKING FACILITIES</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
                {analytics?.totalFacilities || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Across {analytics?.totalSlots} physical slots
              </div>
            </div>

            <div className="card">
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>ALL-TIME RESERVATIONS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#d97706', marginTop: '0.25rem' }}>
                {analytics?.totalBookings || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {analytics?.confirmedBookings} Confirmed
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Governance Tab */}
      {activeAdminTab === 'users' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>User ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Name & Email</th>
                <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                <th style={{ padding: '0.75rem 1rem' }}>Account Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Owner Approval</th>
                <th style={{ padding: '0.75rem 1rem' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.userId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>#{u.userId}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className="badge badge-primary">{u.role.replace('ROLE_', '')}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${u.accountStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                      {u.accountStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {u.role === 'ROLE_OWNER' ? (
                      <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                        <span className={`badge ${u.approvalStatus === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                          {u.approvalStatus}
                        </span>
                        {u.approvalStatus === 'PENDING' && (
                          <>
                            <button
                              className="btn btn-sm btn-success"
                              style={{ padding: '2px 6px' }}
                              onClick={() => handleUpdateOwnerApproval(u.userId, 'APPROVED')}
                              title="Approve Owner"
                            >
                              <Check size={12} />
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              style={{ padding: '2px 6px' }}
                              onClick={() => handleUpdateOwnerApproval(u.userId, 'REJECTED')}
                              title="Reject Owner"
                            >
                              <X size={12} />
                            </button>
                          </>
                        )}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    {u.role !== 'ROLE_ADMIN' && (
                      <button
                        className={`btn btn-sm ${u.accountStatus === 'BLOCKED' ? 'btn-success' : 'btn-danger'}`}
                        onClick={() => handleToggleBlockUser(u.userId)}
                        style={{ fontSize: '0.75rem' }}
                      >
                        <Ban size={12} /> {u.accountStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Facilities Tab */}
      {activeAdminTab === 'facilities' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Facility ID</th>
                <th style={{ padding: '0.75rem 1rem' }}>Facility Name</th>
                <th style={{ padding: '0.75rem 1rem' }}>Owner</th>
                <th style={{ padding: '0.75rem 1rem' }}>Location</th>
                <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {facilities.map((fac) => (
                <tr key={fac.facilityId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>#{fac.facilityId}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{fac.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{fac.owner?.name}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>{fac.address}, {fac.city}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${fac.verificationStatus === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                      {fac.verificationStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      {fac.verificationStatus !== 'APPROVED' && (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleUpdateFacilityStatus(fac.facilityId, 'APPROVED')}
                        >
                          Approve
                        </button>
                      )}
                      {fac.verificationStatus !== 'REJECTED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleUpdateFacilityStatus(fac.facilityId, 'REJECTED')}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Global Bookings Tab */}
      {activeAdminTab === 'bookings' && (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem 1rem' }}>Ref #</th>
                <th style={{ padding: '0.75rem 1rem' }}>Traveler</th>
                <th style={{ padding: '0.75rem 1rem' }}>Facility & Slot</th>
                <th style={{ padding: '0.75rem 1rem' }}>Plate</th>
                <th style={{ padding: '0.75rem 1rem' }}>Amount</th>
                <th style={{ padding: '0.75rem 1rem' }}>State</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.bookingId} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>{b.bookingRef}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{b.traveler?.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{b.slot?.facility?.name} - {b.slot?.slotNumber}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{b.vehicleNumber}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#065f46' }}>₹{b.totalAmount}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${
                      b.bookingState === 'CONFIRMED' ? 'badge-success' :
                      b.bookingState === 'COMPLETED' ? 'badge-primary' :
                      b.bookingState === 'CANCELLED' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {b.bookingState}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
}
