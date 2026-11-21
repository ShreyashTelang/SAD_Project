import React, { useState, useEffect } from 'react';
import { Building, Plus, DollarSign, Car, Calendar, CheckCircle, AlertCircle, Wrench, X } from 'lucide-react';

export default function OwnerPortalView({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const [facilityForm, setFacilityForm] = useState({ name: '', address: '', city: 'Pune', latitude: 18.5204, longitude: 73.8567 });

  const [activeFacilityForSlot, setActiveFacilityForSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ slotNumber: '', vehicleType: 'CAR' });

  const [activeFacilityForPricing, setActiveFacilityForPricing] = useState(null);
  const [pricingForm, setPricingForm] = useState({ vehicleType: 'CAR', ratePerHour: 40 });

  const [feedback, setFeedback] = useState('');

  const fetchOwnerData = async () => {
    if (!currentUser?.token) return;
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${currentUser.token}` };

      // Stats
      const statsRes = await fetch('/api/owner/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      // Facilities
      const facRes = await fetch('/api/owner/facilities', { headers });
      if (facRes.ok) setFacilities(await facRes.json());

      // Reservations
      const resRes = await fetch('/api/owner/reservations', { headers });
      if (resRes.ok) setReservations(await resRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOwnerData();
  }, [currentUser]);

  // Create Facility
  const handleCreateFacility = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/owner/facilities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(facilityForm)
      });
      if (res.ok) {
        setIsAddFacilityOpen(false);
        setFeedback('Parking facility created successfully!');
        fetchOwnerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Slot
  const handleAddSlot = async (e) => {
    e.preventDefault();
    if (!activeFacilityForSlot) return;

    try {
      const res = await fetch(`/api/owner/facilities/${activeFacilityForSlot.facilityId}/slots`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(slotForm)
      });
      if (res.ok) {
        setActiveFacilityForSlot(null);
        setSlotForm({ slotNumber: '', vehicleType: 'CAR' });
        setFeedback('Slot added successfully!');
        fetchOwnerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Set Pricing Rule
  const handleSetPricing = async (e) => {
    e.preventDefault();
    if (!activeFacilityForPricing) return;

    try {
      const res = await fetch(`/api/owner/facilities/${activeFacilityForPricing.facilityId}/pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify(pricingForm)
      });
      if (res.ok) {
        setActiveFacilityForPricing(null);
        setFeedback('Tariff rule configured successfully!');
        fetchOwnerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Slot Maintenance
  const handleToggleSlot = async (slotId, currentStatus) => {
    const newStatus = currentStatus === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      const res = await fetch(`/api/owner/slots/${slotId}/status?status=${newStatus}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setFeedback(`Slot status changed to ${newStatus}.`);
        fetchOwnerData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container" style={{ textAlign: 'left' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Parking Owner Dashboard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage parking locations, live slot allocations, tariff rules, and revenue.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddFacilityOpen(true)}>
          <Plus size={16} /> Add Parking Facility
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

      {/* KPI Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>TOTAL REVENUE</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#065f46', marginTop: '0.25rem' }}>
            ₹{stats?.totalRevenue || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>OWNED FACILITIES</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
            {stats?.totalFacilities || 0}
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>CAPACITY & OCCUPANCY</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {stats?.availableSlots || 0} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ {stats?.totalSlots || 0} Free</span>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>CONFIRMED BOOKINGS</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#7c3aed', marginTop: '0.25rem' }}>
            {stats?.confirmedBookings || 0}
          </div>
        </div>
      </div>

      {/* Facilities Section */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>My Parking Facilities</h3>
        
        {facilities.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <Building size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
            <p>You haven't added any facilities yet. Click "Add Parking Facility" above.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {facilities.map((fac) => (
              <div key={fac.facilityId} className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{fac.name}</h4>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {fac.address}, {fac.city}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-outline btn-sm" onClick={() => setActiveFacilityForSlot(fac)}>
                      <Plus size={14} /> Add Slot
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setActiveFacilityForPricing(fac)}>
                      <DollarSign size={14} /> Set Tariff
                    </button>
                  </div>
                </div>

                {/* Slots list */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Slots ({fac.slots?.length || 0}):
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {fac.slots?.map((slot) => (
                      <div
                        key={slot.slotId}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: slot.slotStatus === 'AVAILABLE' ? '#ecfdf5' :
                                           slot.slotStatus === 'LOCKED' ? '#fffbeb' :
                                           slot.slotStatus === 'OCCUPIED' ? '#fef2f2' : '#f1f5f9',
                          border: '1px solid var(--border)',
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <strong>{slot.slotNumber}</strong> ({slot.vehicleType})
                        <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>[{slot.slotStatus}]</span>
                        <button
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onClick={() => handleToggleSlot(slot.slotId, slot.slotStatus)}
                          title="Toggle Maintenance"
                        >
                          <Wrench size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reservations Table */}
      <div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
          Incoming Customer Reservations ({reservations.length})
        </h3>
        
        {reservations.length === 0 ? (
          <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
            <Calendar size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
            <p>No reservations received yet.</p>
          </div>
        ) : (
          <div className="card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Ref #</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Traveler</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Slot & Plate</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Window</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Revenue</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r.bookingId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>{r.bookingRef}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{r.traveler?.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{r.slot?.slotNumber} ({r.vehicleNumber})</td>
                    <td style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)' }}>
                      {new Date(r.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(r.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 700, color: '#065f46' }}>₹{r.totalAmount}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span className={`badge ${r.bookingState === 'CONFIRMED' ? 'badge-success' : 'badge-warning'}`}>
                        {r.bookingState}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Facility Modal */}
      {isAddFacilityOpen && (
        <div className="modal-overlay" onClick={() => setIsAddFacilityOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Register New Parking Facility</h3>
              <button onClick={() => setIsAddFacilityOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateFacility}>
              <div className="form-group">
                <label className="form-label">Facility Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Phoenix Mall Multi-level Parking"
                  value={facilityForm.name}
                  onChange={(e) => setFacilityForm({ ...facilityForm, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="Full street address..."
                  value={facilityForm.address}
                  onChange={(e) => setFacilityForm({ ...facilityForm, address: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={facilityForm.city}
                    onChange={(e) => setFacilityForm({ ...facilityForm, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    className="form-input"
                    value={facilityForm.latitude}
                    onChange={(e) => setFacilityForm({ ...facilityForm, latitude: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
                Register Facility
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add Slot Modal */}
      {activeFacilityForSlot && (
        <div className="modal-overlay" onClick={() => setActiveFacilityForSlot(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Add Slot to {activeFacilityForSlot.name}</h3>
              <button onClick={() => setActiveFacilityForSlot(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddSlot}>
              <div className="form-group">
                <label className="form-label">Slot Number / Code</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. A-101, B-05, EV-01"
                  value={slotForm.slotNumber}
                  onChange={(e) => setSlotForm({ ...slotForm, slotNumber: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-select"
                  value={slotForm.vehicleType}
                  onChange={(e) => setSlotForm({ ...slotForm, vehicleType: e.target.value })}
                >
                  <option value="CAR">Car</option>
                  <option value="BIKE">Two-Wheeler</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="TRUCK">Heavy / Truck</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Save Slot
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Set Pricing Modal */}
      {activeFacilityForPricing && (
        <div className="modal-overlay" onClick={() => setActiveFacilityForPricing(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Configure Hourly Tariff</h3>
              <button onClick={() => setActiveFacilityForPricing(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSetPricing}>
              <div className="form-group">
                <label className="form-label">Vehicle Type</label>
                <select
                  className="form-select"
                  value={pricingForm.vehicleType}
                  onChange={(e) => setPricingForm({ ...pricingForm, vehicleType: e.target.value })}
                >
                  <option value="CAR">Car</option>
                  <option value="BIKE">Two-Wheeler</option>
                  <option value="EV">Electric Vehicle (EV)</option>
                  <option value="TRUCK">Heavy / Truck</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Rate Per Hour (₹)</label>
                <input
                  type="number"
                  step="5"
                  required
                  className="form-input"
                  value={pricingForm.ratePerHour}
                  onChange={(e) => setPricingForm({ ...pricingForm, ratePerHour: parseFloat(e.target.value) })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Update Pricing
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
