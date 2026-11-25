import React, { useState, useEffect } from 'react';
import { ShieldCheck, Users, Building, Calendar, DollarSign, Check, X, Ban, Activity, FileText, Printer, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';

export default function AdminPortalView({ currentUser }) {
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [executiveReport, setExecutiveReport] = useState(null);
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

  const handleToggleBlockFacility = async (facId) => {
    try {
      const res = await fetch(`/api/admin/facilities/${facId}/toggle-block`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setFeedback('Facility block status updated successfully.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchExecutiveReport = async () => {
    if (!currentUser?.token) return;
    try {
      const res = await fetch('/api/admin/report', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setExecutiveReport(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeAdminTab === 'report') {
      fetchExecutiveReport();
    }
  }, [activeAdminTab]);

  const handleResetAllSlots = async () => {
    if (!confirm('Reset all parking spaces to AVAILABLE and expire old locks?')) return;
    try {
      const res = await fetch('/api/admin/reset-all-slots', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setFeedback('All parking slots across all facilities have been successfully reset to AVAILABLE.');
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container" style={{ textAlign: 'left' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>System Administration Console</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
            Platform-wide governance: approvals, user blocking, facility listing oversight, and analytics.
          </p>
        </div>
        <button
          className="btn btn-warning btn-sm"
          onClick={handleResetAllSlots}
          style={{ color: '#92400e', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          title="Reset all slots to Available and expire old locks"
        >
          <RefreshCw size={14} /> Reset All Slots to Available
        </button>
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
        <button
          className={`btn btn-sm ${activeAdminTab === 'report' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveAdminTab('report')}
        >
          <FileText size={14} /> Executive Report
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
                    <span className={`badge ${
                      fac.verificationStatus === 'APPROVED' ? 'badge-success' :
                      fac.verificationStatus === 'BLOCKED' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {fac.verificationStatus}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {fac.verificationStatus !== 'APPROVED' && fac.verificationStatus !== 'BLOCKED' && (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleUpdateFacilityStatus(fac.facilityId, 'APPROVED')}
                        >
                          Approve
                        </button>
                      )}
                      {fac.verificationStatus !== 'REJECTED' && fac.verificationStatus !== 'BLOCKED' && (
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleUpdateFacilityStatus(fac.facilityId, 'REJECTED')}
                        >
                          Reject
                        </button>
                      )}
                      {/* Use Case 20: blockEntity(e) */}
                      <button
                        className={`btn btn-sm ${fac.verificationStatus === 'BLOCKED' ? 'btn-success' : 'btn-danger'}`}
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        onClick={() => handleToggleBlockFacility(fac.facilityId)}
                        title={fac.verificationStatus === 'BLOCKED' ? 'Restore Facility Listing' : 'Block Facility from Discovery'}
                      >
                        <Ban size={12} /> {fac.verificationStatus === 'BLOCKED' ? 'Unblock' : 'Block'}
                      </button>
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

      {/* Executive Operational Report Tab */}
      {activeAdminTab === 'report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={22} color="#2563eb" /> SPS Executive Operations Report
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                System-level governance, capacity, telemetry, and revenue statement for platform leadership.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Printer size={16} /> Print Executive Report
            </button>
          </div>

          {executiveReport ? (
            <>
              {/* Core Operational KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>TOTAL PLATFORM REVENUE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46', marginTop: '0.25rem' }}>
                    ₹{executiveReport.totalPlatformRevenue || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Across {executiveReport.confirmedBookings || 0} confirmed sessions
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PLATFORM OCCUPANCY RATE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
                    {executiveReport.occupancyRatePercentage || 0}%
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {executiveReport.occupiedSlots || 0} Occupied / {executiveReport.totalSlots || 0} Total Spots
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>FACILITY GOVERNANCE</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    {executiveReport.approvedFacilities || 0} Active
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {executiveReport.pendingFacilities || 0} Pending • {executiveReport.blockedFacilities || 0} Blocked
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>USER BASE HEALTH</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
                    {executiveReport.totalUsers || 0} Users
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    {executiveReport.activeUsers || 0} Active • {executiveReport.blockedUsers || 0} Blocked
                  </div>
                </div>
              </div>

              {/* Vehicle Distribution & Capacity breakdown */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                <div className="card">
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    Parking Capacity by Vehicle Class
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {Object.entries(executiveReport.slotsByType || {}).map(([type, count]) => (
                      <div key={type} style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{type}</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>
                          {count} slots
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>
                    System Architecture & Compliance Overview
                  </h4>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Package Architecture:</span>
                      <strong style={{ color: '#065f46' }}>9 Acyclic Packages (Clean Arch)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>IoT Telemetry State:</span>
                      <strong style={{ color: '#065f46' }}>ANPR Gate + Ultrasonic Ready</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Database Integrity:</span>
                      <strong style={{ color: '#065f46' }}>MySQL 8.0 InnoDB (ACID)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Payment Gateway Adapter:</span>
                      <strong style={{ color: '#065f46' }}>Atomic Retries & Refunds Active</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Report Generated At:</span>
                      <strong>{new Date(executiveReport.generatedAt).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              </div>

            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Compiling executive report...</div>
          )}

        </div>
      )}

    </div>
  );
}
