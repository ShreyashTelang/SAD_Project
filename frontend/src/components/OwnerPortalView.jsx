import React, { useState, useEffect } from 'react';
import { Building, Plus, DollarSign, Car, Calendar, CheckCircle, AlertCircle, Wrench, X, Cpu, Radio, ShieldCheck, Printer, ArrowRightCircle, CheckCircle2, RefreshCw } from 'lucide-react';

export default function OwnerPortalView({ currentUser }) {
  const [stats, setStats] = useState(null);
  const [facilities, setFacilities] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeOwnerTab, setActiveOwnerTab] = useState('facilities'); // 'facilities', 'iot-simulator', 'revenue-report'

  // Modals
  const [isAddFacilityOpen, setIsAddFacilityOpen] = useState(false);
  const [facilityForm, setFacilityForm] = useState({ name: '', address: '', city: 'Pune', latitude: 18.5204, longitude: 73.8567 });

  const [activeFacilityForSlot, setActiveFacilityForSlot] = useState(null);
  const [slotForm, setSlotForm] = useState({ slotNumber: '', vehicleType: 'CAR' });

  const [activeFacilityForPricing, setActiveFacilityForPricing] = useState(null);
  const [pricingForm, setPricingForm] = useState({ vehicleType: 'CAR', ratePerHour: 40 });

  const [feedback, setFeedback] = useState('');

  // IoT Simulator State
  const [selectedIoTFacilityId, setSelectedIoTFacilityId] = useState('');
  const [iotSlots, setIotSlots] = useState([]);
  const [entryPlate, setEntryPlate] = useState('MH 12 AB 1234');
  const [entryScanResult, setEntryScanResult] = useState(null);
  const [exitPlate, setExitPlate] = useState('MH 12 AB 1234');
  const [exitScanResult, setExitScanResult] = useState(null);
  const [iotActionLoading, setIotActionLoading] = useState(false);

  // Revenue Report State
  const [revenueReport, setRevenueReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Fetch Revenue Report
  const fetchRevenueReport = async () => {
    if (!currentUser?.token) return;
    setReportLoading(true);
    try {
      const res = await fetch('/api/owner/reports/revenue', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        setRevenueReport(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  // Fetch Live IoT State for Facility
  const fetchIoTState = async (facId) => {
    if (!facId) return;
    try {
      const res = await fetch(`/api/iot/facility/${facId}/live-status`);
      if (res.ok) {
        setIotSlots(await res.json());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (facilities.length > 0 && !selectedIoTFacilityId) {
      setSelectedIoTFacilityId(facilities[0].facilityId);
      fetchIoTState(facilities[0].facilityId);
    }
  }, [facilities]);

  useEffect(() => {
    if (selectedIoTFacilityId) {
      fetchIoTState(selectedIoTFacilityId);
    }
  }, [selectedIoTFacilityId]);

  useEffect(() => {
    if (activeOwnerTab === 'revenue-report') {
      fetchRevenueReport();
    }
  }, [activeOwnerTab]);

  // Simulate Gate Entry Scan (ANPR)
  const handleSimulateEntryScan = async (e) => {
    e.preventDefault();
    if (!selectedIoTFacilityId) return;
    setIotActionLoading(true);
    setEntryScanResult(null);

    try {
      const res = await fetch('/api/iot/gate/validate-plate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: selectedIoTFacilityId,
          licensePlate: entryPlate
        })
      });
      const data = await res.json();
      setEntryScanResult(data);
      fetchIoTState(selectedIoTFacilityId);
      fetchOwnerData();
    } catch (err) {
      console.error(err);
    } finally {
      setIotActionLoading(false);
    }
  };

  // Simulate Gate Exit Scan (ANPR)
  const handleSimulateExitScan = async (e) => {
    e.preventDefault();
    if (!selectedIoTFacilityId) return;
    setIotActionLoading(true);
    setExitScanResult(null);

    try {
      const res = await fetch('/api/iot/gate/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: selectedIoTFacilityId,
          licensePlate: exitPlate
        })
      });
      const data = await res.json();
      setExitScanResult(data);
      fetchIoTState(selectedIoTFacilityId);
      fetchOwnerData();
    } catch (err) {
      console.error(err);
    } finally {
      setIotActionLoading(false);
    }
  };

  // Simulate Ground Ultrasonic IoT Sensor Trigger
  const handleSimulateSpotSensor = async (slotId, status) => {
    setIotActionLoading(true);
    try {
      const res = await fetch('/api/iot/sensor/update-spot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, status })
      });
      if (res.ok) {
        fetchIoTState(selectedIoTFacilityId);
        fetchOwnerData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIotActionLoading(false);
    }
  };

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

      {/* Sub-Navigation Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          className={`btn btn-sm ${activeOwnerTab === 'facilities' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveOwnerTab('facilities')}
        >
          <Building size={14} /> Facilities & Slots
        </button>
        <button
          className={`btn btn-sm ${activeOwnerTab === 'iot-simulator' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveOwnerTab('iot-simulator')}
        >
          <Cpu size={14} /> IoT Sensors & Gate ANPR
        </button>
        <button
          className={`btn btn-sm ${activeOwnerTab === 'revenue-report' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveOwnerTab('revenue-report')}
        >
          <DollarSign size={14} /> Revenue Report
        </button>
      </div>

      {/* --- TAB 1: FACILITIES & SLOTS --- */}
      {activeOwnerTab === 'facilities' && (
        <>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{fac.name}</h4>
                          <span className={`badge ${fac.verificationStatus === 'APPROVED' ? 'badge-success' : fac.verificationStatus === 'BLOCKED' ? 'badge-danger' : 'badge-warning'}`}>
                            {fac.verificationStatus}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
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
        </>
      )}

      {/* --- TAB 2: IOT SENSORS & GATE ANPR SIMULATOR --- */}
      {activeOwnerTab === 'iot-simulator' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div className="card" style={{ backgroundColor: '#f8fafc' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Radio size={20} color="#2563eb" /> IoT Sensors & Gate ANPR Test Harness
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                  Simulates hardware ANPR cameras (Use Case: Validate License Plate) and Ultrasonic Ground Spot Sensors (Update Spot Status).
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>Select Facility:</label>
                <select
                  className="form-select"
                  value={selectedIoTFacilityId}
                  onChange={(e) => setSelectedIoTFacilityId(e.target.value)}
                  style={{ minWidth: '220px' }}
                >
                  {facilities.map(f => (
                    <option key={f.facilityId} value={f.facilityId}>{f.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fetchIoTState(selectedIoTFacilityId)}
                  title="Refresh Live Sensor State"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
            
            {/* Gate ANPR Entry Camera */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#dbeafe', color: '#1e40af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Car size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Entry Gate ANPR Scanner</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Validate License Plate &lt;&lt;extend&gt;&gt; Update Spot Status</span>
                </div>
              </div>

              <form onSubmit={handleSimulateEntryScan}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Vehicle License Plate (Scanned by Camera)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MH 12 AB 1234"
                    value={entryPlate}
                    onChange={(e) => setEntryPlate(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ width: '100%' }}
                  disabled={iotActionLoading}
                >
                  {iotActionLoading ? 'Scanning Plate...' : 'Simulate Vehicle Arrival (Entry Gate)'}
                </button>
              </form>

              {entryScanResult && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: entryScanResult.accessGranted ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${entryScanResult.accessGranted ? '#a7f3d0' : '#fecaca'}`,
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: entryScanResult.accessGranted ? '#065f46' : '#991b1b', marginBottom: '0.35rem' }}>
                    {entryScanResult.accessGranted ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {entryScanResult.accessGranted ? 'BARRIER LIFTED - ACCESS GRANTED' : 'BARRIER CLOSED - ACCESS DENIED'}
                  </div>
                  <div>{entryScanResult.message}</div>
                  {entryScanResult.accessGranted && (
                    <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', color: '#065f46', fontSize: '0.75rem' }}>
                      <div><strong>Booking Ref:</strong> {entryScanResult.bookingRef}</div>
                      <div><strong>Assigned Spot:</strong> {entryScanResult.slotNumber}</div>
                      <div><strong>Driver:</strong> {entryScanResult.travelerName}</div>
                      <div><strong>Valid Until:</strong> {new Date(entryScanResult.validUntil).toLocaleTimeString()}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gate ANPR Exit Camera */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef3c7', color: '#92400e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowRightCircle size={18} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Exit Gate ANPR Scanner</h4>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Session Completion & Auto Slot Release</span>
                </div>
              </div>

              <form onSubmit={handleSimulateExitScan}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Vehicle License Plate (Departing)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. MH 12 AB 1234"
                    value={exitPlate}
                    onChange={(e) => setExitPlate(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-warning btn-sm"
                  style={{ width: '100%', color: '#92400e' }}
                  disabled={iotActionLoading}
                >
                  {iotActionLoading ? 'Processing Exit...' : 'Simulate Vehicle Departure (Exit Gate)'}
                </button>
              </form>

              {exitScanResult && (
                <div style={{
                  marginTop: '1rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: exitScanResult.exitGranted ? '#ecfdf5' : '#fef2f2',
                  border: `1px solid ${exitScanResult.exitGranted ? '#a7f3d0' : '#fecaca'}`,
                  fontSize: '0.8rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#065f46', marginBottom: '0.35rem' }}>
                    <CheckCircle2 size={18} />
                    EXIT BARRIER OPENED
                  </div>
                  <div>{exitScanResult.message}</div>
                </div>
              )}
            </div>

          </div>

          {/* Ultrasonic Ground Spot Sensors Matrix */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Ultrasonic Ground Spot Sensors Matrix
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
                  Real-time telemetry from in-ground sensors. Click actions below to simulate hardware triggers.
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }}></span> Available
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Occupied
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#64748b' }}></span> Maintenance
                </span>
              </div>
            </div>

            {iotSlots.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                No slots found for this facility. Add slots from the Facilities tab.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.85rem' }}>
                {iotSlots.map(slot => (
                  <div
                    key={slot.slotId}
                    style={{
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      backgroundColor: slot.status === 'AVAILABLE' ? '#f0fdf4' : slot.status === 'OCCUPIED' ? '#fef2f2' : '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '1rem' }}>{slot.slotNumber}</span>
                      <span className={`badge ${slot.status === 'AVAILABLE' ? 'badge-success' : slot.status === 'OCCUPIED' ? 'badge-danger' : 'badge-outline'}`} style={{ fontSize: '0.65rem' }}>
                        {slot.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Vehicle: {slot.vehicleType}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem', marginTop: '0.25rem' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem', backgroundColor: '#fff' }}
                        onClick={() => handleSimulateSpotSensor(slot.slotId, 'OCCUPIED')}
                        title="Simulate vehicle parked"
                      >
                        Set Occupied
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.7rem', padding: '0.25rem', backgroundColor: '#fff' }}
                        onClick={() => handleSimulateSpotSensor(slot.slotId, 'AVAILABLE')}
                        title="Simulate vehicle left"
                      >
                        Set Free
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- TAB 3: REVENUE & FINANCIAL REPORT --- */}
      {activeOwnerTab === 'revenue-report' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0 }}>
                Owner Financial & Revenue Statement
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                UML Class Diagram viewRevenue() & generateReport() implementation.
              </p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => window.print()}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <Printer size={16} /> Print / Export Statement
            </button>
          </div>

          {reportLoading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>Compiling financial statements...</div>
          ) : revenueReport ? (
            <>
              {/* Financial KPI Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>GROSS PLATFORM BOOKINGS</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                    ₹{revenueReport.grossRevenue || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    From {revenueReport.confirmedBookings + revenueReport.completedBookings} paid bookings
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>PLATFORM COMMISSION (10%)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#b45309', marginTop: '0.25rem' }}>
                    ₹{revenueReport.platformFee || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    SPS platform hosting & gateway fees
                  </div>
                </div>

                <div className="card" style={{ padding: '1.25rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534' }}>NET OWNER PAYOUT (90%)</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#15803d', marginTop: '0.25rem' }}>
                    ₹{revenueReport.netPayout || 0}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#166534', marginTop: '0.25rem' }}>
                    Target Account: {revenueReport.payoutAccountRef}
                  </div>
                </div>
              </div>

              {/* Facility Breakdown */}
              <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
                <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 800 }}>
                  Facility Revenue & Occupancy Breakdown
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Facility</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Total Slots</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Occupancy</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Bookings</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Total Revenue</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueReport.facilityBreakdown?.map(f => (
                      <tr key={f.facilityId} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>
                          <div>{f.name}</div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{f.address}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>{f.totalSlots}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{f.occupancyPercentage}%</td>
                        <td style={{ padding: '0.75rem 1rem' }}>{f.bookingsCount}</td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 800, color: '#065f46' }}>₹{f.revenue}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className={`badge ${f.status === 'APPROVED' ? 'badge-success' : 'badge-warning'}`}>
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vehicle Type Earnings */}
              <div className="card">
                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Revenue by Vehicle Class</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
                  {Object.entries(revenueReport.revenueByVehicleType || {}).map(([vType, amount]) => (
                    <div key={vType} style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{vType}</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem' }}>₹{amount}</div>
                    </div>
                  ))}
                </div>
              </div>

            </>
          ) : null}

        </div>
      )}

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
