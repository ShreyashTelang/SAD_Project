import React, { useState, useEffect } from 'react';
import { Search, MapPin, Star, Clock, Car, Zap, CheckCircle2, AlertTriangle, ShieldAlert, CreditCard, ChevronRight, X, QrCode, Smartphone, Landmark, ShieldCheck, RefreshCw } from 'lucide-react';

export default function ParkFinderView({ currentUser, onRequireAuth }) {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Selected facility modal state
  const [selectedFacilityId, setSelectedFacilityId] = useState(null);
  const [facilityDetails, setFacilityDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [alternativeFacilities, setAlternativeFacilities] = useState([]);
  const [alternativesLoading, setAlternativesLoading] = useState(false);

  // Reservation & Lock state
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState(currentUser?.vehicleNumber || '');
  const [pendingBooking, setPendingBooking] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

  // Enhanced Payment Gateway state
  const [paymentMethod, setPaymentMethod] = useState('CARD'); // 'CARD', 'UPI', 'NETBANKING'
  const [cardData, setCardData] = useState({
    nameOnCard: 'Amit Patil',
    cardNumber: '4532 8912 3456 7890',
    expiry: '12/28',
    cvv: '321',
    cardBrand: 'VISA'
  });
  const [upiVpa, setUpiVpa] = useState('amit@okhdfc');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [simulateDecline, setSimulateDecline] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [cancellationNotice, setCancellationNotice] = useState('');

  // Format Card Number
  const handleCardNumberChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 16);
    let formatted = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardData({ ...cardData, cardNumber: formatted });
  };

  // Initialize start and end time (default to next hour)
  useEffect(() => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

    const formatToLocalISO = (d) => {
      const pad = (n) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setStartTime(formatToLocalISO(start));
    setEndTime(formatToLocalISO(end));
  }, []);

  // Fetch facilities
  const fetchFacilities = async () => {
    setLoading(true);
    try {
      let url = '/api/discovery/search?';
      const params = new URLSearchParams();
      if (searchQuery) params.append('query', searchQuery);
      if (vehicleFilter) params.append('vehicleType', vehicleFilter);
      if (maxPrice) params.append('maxPrice', maxPrice);

      const res = await fetch(url + params.toString());
      if (res.ok) {
        const data = await res.json();
        setFacilities(data);
      }
    } catch (err) {
      console.error('Error fetching parking facilities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [vehicleFilter]);

  // Open Facility Details
  const handleOpenFacility = async (id) => {
    setSelectedFacilityId(id);
    setDetailsLoading(true);
    setSelectedSlot(null);
    setPendingBooking(null);
    setConfirmedBooking(null);
    setBookingError('');
    setCancellationNotice('');
    setAlternativeFacilities([]);

    try {
      const res = await fetch(`/api/discovery/facilities/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFacilityDetails(data);
      }

      // Fetch alternatives according to UML Activity & Interaction Overview specifications
      fetchAlternatives(id);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const fetchAlternatives = async (facId) => {
    setAlternativesLoading(true);
    try {
      const url = `/api/discovery/facilities/${facId}/alternatives${vehicleFilter ? `?vehicleType=${vehicleFilter}` : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAlternativeFacilities(data);
      }
    } catch (err) {
      console.error('Failed to fetch alternatives:', err);
    } finally {
      setAlternativesLoading(false);
    }
  };

  // Step 1: Lock Slot and Initiate Booking
  const handleInitiateBooking = async () => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!selectedSlot) {
      setBookingError('Please select an available parking slot.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setBookingError('Please enter your vehicle license plate number.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await fetch('/api/bookings/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          slotId: selectedSlot.slotId,
          vehicleNumber: vehicleNumber.trim(),
          startTime: startTime + ':00',
          endTime: endTime + ':00'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Could not lock parking slot. Please try another slot.');
      }

      setPendingBooking(data);
      handleOpenFacility(selectedFacilityId);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  // Step 2: Confirm Payment through Payment Gateway
  const handleConfirmPayment = async () => {
    if (!pendingBooking) return;
    setBookingLoading(true);
    setBookingError('');

    try {
      const cardLast4 = cardData.cardNumber.replace(/\s/g, '').slice(-4) || '7890';

      const res = await fetch('/api/bookings/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          bookingId: pendingBooking.bookingId,
          paymentMethod: paymentMethod,
          cardNumberLast4: cardLast4,
          cardBrand: cardData.cardBrand,
          upiVpa: upiVpa,
          bankName: bankName,
          simulateFailure: simulateDecline
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Payment was declined by payment gateway.');
      }

      if (data.bookingState === 'FAILED') {
        throw new Error('Payment was declined by issuing bank. The slot lock has been released.');
      }

      setConfirmedBooking(data);
      setPendingBooking(null);
      fetchFacilities();
    } catch (err) {
      setBookingError(err.message);
      // Refresh slots if failed to show released slot
      handleOpenFacility(selectedFacilityId);
    } finally {
      setBookingLoading(false);
    }
  };

  // Direct Cancellation from the receipt dialog
  const handleCancelFromReceipt = async (bookingId) => {
    if (!confirm('Cancel this confirmed parking reservation? 100% refund will be issued to your payment method.')) {
      return;
    }
    setBookingLoading(true);
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCancellationNotice(`Reservation ${data.bookingRef} cancelled. ₹${data.totalAmount} refund dispatched to ${data.payment?.paymentMethod}.`);
        setConfirmedBooking(null);
        fetchFacilities();
        handleOpenFacility(selectedFacilityId);
      } else {
        alert(data.message || 'Cancellation failed.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="app-container">
      
      {/* Search Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
        color: '#ffffff',
        padding: '2.5rem 2rem',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '2rem',
        boxShadow: 'var(--shadow-md)',
        textAlign: 'left'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div className="badge badge-warning" style={{ marginBottom: '0.75rem', fontWeight: 800 }}>
            LIVE AVAILABILITY & ATOMIC LOCKING
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.5rem' }}>
            Find & Reserve Nearest Parking in Real Time
          </h2>
          <p style={{ opacity: 0.9, fontSize: '0.95rem', marginBottom: '1.5rem' }}>
            Search verified parking locations, check real-time vacant slots, lock your spot, and pay seamlessly.
          </p>

          {/* Search Box */}
          <div style={{
            display: 'flex',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-md)',
            padding: '0.375rem',
            boxShadow: 'var(--shadow-lg)',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: '220px', padding: '0 0.75rem' }}>
              <Search size={20} color="#94a3b8" style={{ marginRight: '0.5rem' }} />
              <input
                type="text"
                placeholder="Search by city, mall, station or landmark..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchFacilities()}
                style={{ width: '100%', border: 'none', outline: 'none', color: 'var(--text-main)', fontSize: '0.9rem' }}
              />
            </div>

            <select
              className="form-select"
              value={vehicleFilter}
              onChange={(e) => setVehicleFilter(e.target.value)}
              style={{ width: 'auto', minWidth: '130px', border: 'none', backgroundColor: '#f8fafc', fontWeight: 600 }}
            >
              <option value="">All Vehicles</option>
              <option value="CAR">Car</option>
              <option value="BIKE">Two-Wheeler</option>
              <option value="EV">Electric (EV)</option>
            </select>

            <button className="btn btn-primary" onClick={fetchFacilities}>
              Explore Slots
            </button>
          </div>
        </div>
      </div>

      {/* Facilities Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Available Parking Locations ({facilities.length})
        </h3>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Updated with live slot availability
        </span>
      </div>

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Searching for verified parking locations...
        </div>
      ) : facilities.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={36} color="#f59e0b" style={{ margin: '0 auto 1rem' }} />
          <h3>No parking locations found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search criteria or clearing filters.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {facilities.map((fac) => (
            <div key={fac.facilityId} className="card card-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'left' }}>
                    {fac.name}
                  </h4>
                  <span className={`badge ${fac.availableSlots > 0 ? 'badge-success' : 'badge-danger'}`}>
                    {fac.availableSlots > 0 ? `${fac.availableSlots}/${fac.totalSlots} Free` : 'Full'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem', textAlign: 'left' }}>
                  <MapPin size={16} />
                  <span>{fac.address}, {fac.city}</span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#f59e0b', fontWeight: 700 }}>
                    <Star size={16} fill="#f59e0b" />
                    <span>{fac.averageRating}</span>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>({fac.totalReviews} reviews)</span>
                  </div>
                  {fac.distanceKm && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                      <Clock size={16} />
                      <span>{fac.distanceKm} km (~{fac.travelTimeMinutes} mins)</span>
                    </div>
                  )}
                </div>

                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '0.625rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  fontSize: '0.8rem',
                  display: 'flex',
                  justifyContent: 'space-around',
                  border: '1px solid var(--border)'
                }}>
                  {fac.pricingByVehicle?.CAR && (
                    <span><strong>Car:</strong> ₹{fac.pricingByVehicle.CAR}/hr</span>
                  )}
                  {fac.pricingByVehicle?.BIKE && (
                    <span><strong>Bike:</strong> ₹{fac.pricingByVehicle.BIKE}/hr</span>
                  )}
                  {fac.pricingByVehicle?.EV && (
                    <span><Zap size={12} style={{ display: 'inline' }} /> <strong>EV:</strong> ₹{fac.pricingByVehicle.EV}/hr</span>
                  )}
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => handleOpenFacility(fac.facilityId)}
              >
                Inspect Slots & Reserve <ChevronRight size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Facility Details & Slot Booking Modal */}
      {selectedFacilityId && (
        <div className="modal-overlay" onClick={() => setSelectedFacilityId(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {facilityDetails?.facility?.name}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {facilityDetails?.facility?.address}, {facilityDetails?.facility?.city}
                </p>
              </div>
              <button onClick={() => setSelectedFacilityId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {cancellationNotice && (
              <div style={{
                backgroundColor: 'var(--success-light)',
                color: '#065f46',
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1rem',
                border: '1px solid #a7f3d0'
              }}>
                <CheckCircle2 size={16} style={{ display: 'inline', marginRight: '6px' }} />
                {cancellationNotice}
              </div>
            )}

            {detailsLoading ? (
              <div style={{ padding: '2rem', textAlign: 'center' }}>Loading slot inventory...</div>
            ) : confirmedBooking ? (
              
              /* --- CONFIRMED BOOKING & DIGITAL RECEIPT VIEW --- */
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  backgroundColor: 'var(--success-light)',
                  color: 'var(--success)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem'
                }}>
                  <CheckCircle2 size={32} />
                </div>
                <h4 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#065f46' }}>
                  Reservation Confirmed & Paid!
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                  Your spot has been secured. Show this pass upon gate entry.
                </p>

                {/* Digital Receipt Card */}
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '2px dashed var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  textAlign: 'left',
                  marginBottom: '1.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>BOOKING REFERENCE</span>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {confirmedBooking.bookingRef}
                      </div>
                    </div>
                    <div className="badge badge-success">ACTIVE & SECURED</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Slot:</span>
                      <div style={{ fontWeight: 700 }}>{confirmedBooking.slot?.slotNumber} ({confirmedBooking.slot?.vehicleType})</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Vehicle Plate:</span>
                      <div style={{ fontWeight: 700 }}>{confirmedBooking.vehicleNumber}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Start Time:</span>
                      <div style={{ fontWeight: 600 }}>{new Date(confirmedBooking.startTime).toLocaleString()}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>End Time:</span>
                      <div style={{ fontWeight: 600 }}>{new Date(confirmedBooking.endTime).toLocaleString()}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Paid Amount:</span>
                      <div style={{ fontWeight: 800, color: '#065f46', fontSize: '1rem' }}>₹{confirmedBooking.totalAmount}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Gateway Transaction:</span>
                      <div style={{ fontWeight: 600 }}>{confirmedBooking.payment?.gatewayTxnId || 'TXN-APPROVED'}</div>
                    </div>
                  </div>
                </div>

                {/* Receipt Actions: Option to Cancel Right Here */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                    onClick={() => handleCancelFromReceipt(confirmedBooking.bookingId)}
                    disabled={bookingLoading}
                  >
                    Cancel Parking & Refund
                  </button>
                  <button
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedFacilityId(null)}
                  >
                    Done & Exit
                  </button>
                </div>
              </div>

            ) : pendingBooking ? (
              
              /* --- PAYMENT GATEWAY CHECKOUT MODAL --- */
              <div style={{ textAlign: 'left' }}>
                <div style={{
                  backgroundColor: 'var(--warning-light)',
                  border: '1px solid #fde68a',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}>
                  <Clock size={22} color="#f59e0b" />
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e', fontSize: '0.85rem' }}>
                      Slot Locked for 10 Minutes! (Booking Ref: {pendingBooking.bookingRef})
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#b45309' }}>
                      Complete payment via our secure payment gateway to confirm your spot.
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div style={{
                    backgroundColor: 'var(--danger-light)',
                    color: 'var(--danger)',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                    fontSize: '0.85rem',
                    border: '1px solid #fecaca',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div>
                      <AlertTriangle size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                      {bookingError}
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      style={{ backgroundColor: '#ffffff', color: 'var(--danger)', borderColor: '#fca5a5', padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setBookingError('');
                        setSimulateDecline(false);
                      }}
                    >
                      <RefreshCw size={12} style={{ display: 'inline', marginRight: '4px' }} /> Retry Payment
                    </button>
                  </div>
                )}

                {/* Payment Gateway Header & Security Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>SPS Payment Gateway</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>
                    <ShieldCheck size={16} /> 256-Bit SSL Encrypted
                  </div>
                </div>

                {/* Gateway Methods Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPaymentMethod('CARD')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  >
                    <CreditCard size={15} /> Card
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPaymentMethod('UPI')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  >
                    <Smartphone size={15} /> UPI / QR
                  </button>
                  <button
                    type="button"
                    className={`btn ${paymentMethod === 'NETBANKING' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setPaymentMethod('NETBANKING')}
                    style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                  >
                    <Landmark size={15} /> Net Banking
                  </button>
                </div>

                {/* Card Fields */}
                {paymentMethod === 'CARD' && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Cardholder Name</label>
                      <input
                        type="text"
                        className="form-input"
                        value={cardData.nameOnCard}
                        onChange={(e) => setCardData({ ...cardData, nameOnCard: e.target.value })}
                      />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Card Number</label>
                      <input
                        type="text"
                        className="form-input"
                        value={cardData.cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="4532 •••• •••• 7890"
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>Valid Thru</label>
                        <input
                          type="text"
                          className="form-input"
                          value={cardData.expiry}
                          maxLength={5}
                          onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                        />
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.75rem' }}>CVV</label>
                        <input
                          type="password"
                          className="form-input"
                          value={cardData.cvv}
                          maxLength={4}
                          onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* UPI Fields */}
                {paymentMethod === 'UPI' && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem', textAlign: 'center' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'inline-flex', padding: '12px', background: '#fff', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                        <QrCode size={110} color="#1e3a8a" />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Scan with GPay, PhonePe, Paytm, or BHIM</div>
                    </div>
                    <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Or enter UPI Virtual Address (VPA)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value)}
                        placeholder="username@okhdfcbank"
                      />
                    </div>
                  </div>
                )}

                {/* Net Banking Fields */}
                {paymentMethod === 'NETBANKING' && (
                  <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Bank</label>
                      <select className="form-select" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                        <option value="HDFC Bank">HDFC Bank</option>
                        <option value="State Bank of India">State Bank of India (SBI)</option>
                        <option value="ICICI Bank">ICICI Bank</option>
                        <option value="Axis Bank">Axis Bank</option>
                        <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Test Simulation Controls */}
                <div style={{
                  backgroundColor: '#fff',
                  border: '1px dashed var(--border)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem'
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>Test Gateway Decline / Release Lock:</span>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={simulateDecline}
                      onChange={(e) => setSimulateDecline(e.target.checked)}
                    />
                    Simulate Failure
                  </label>
                </div>

                {/* Total & Pay Button */}
                <div style={{
                  backgroundColor: '#f1f5f9',
                  padding: '0.875rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Total Tariff Payable:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                    ₹{pendingBooking.totalAmount}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setPendingBooking(null)}
                  >
                    Cancel Lock
                  </button>
                  <button
                    className="btn btn-success"
                    style={{ flex: 2 }}
                    onClick={handleConfirmPayment}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Processing Gateway...' : `Authorize & Pay ₹${pendingBooking.totalAmount}`}
                  </button>
                </div>
              </div>

            ) : (

              /* --- SLOT SELECTION & RESERVATION VIEW --- */
              <div>
                <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="form-label">Select an Available Parking Space</label>
                    <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#10b981' }}></span> Available
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#f59e0b' }}></span> Locked
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#ef4444' }}></span> Occupied
                      </span>
                    </div>
                  </div>

                  <div className="slot-grid">
                    {facilityDetails?.slots?.map((slot) => {
                      const isAvail = slot.slotStatus === 'AVAILABLE';
                      const isSelected = selectedSlot?.slotId === slot.slotId;
                      let statusClass = 'slot-available';
                      if (slot.slotStatus === 'LOCKED') statusClass = 'slot-locked';
                      if (slot.slotStatus === 'OCCUPIED') statusClass = 'slot-occupied';
                      if (slot.slotStatus === 'MAINTENANCE') statusClass = 'slot-maintenance';

                      return (
                        <div
                          key={slot.slotId}
                          className={`slot-box ${statusClass} ${isSelected ? 'slot-selected' : ''}`}
                          onClick={() => isAvail && setSelectedSlot(slot)}
                          title={`Status: ${slot.slotStatus}`}
                        >
                          <div style={{ fontSize: '0.7rem', fontWeight: 600 }}>{slot.vehicleType}</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800 }}>{slot.slotNumber}</div>
                          <div style={{ fontSize: '0.65rem' }}>{slot.slotStatus}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* UML Activity Diagram Decision: [No] Slot available? -> Suggest Alternatives */}
                  {facilityDetails?.slots && facilityDetails?.slots?.length > 0 && facilityDetails?.slots?.every(s => s.slotStatus !== 'AVAILABLE') && (
                    <div style={{
                      backgroundColor: '#fffbeb',
                      border: '1px solid #fde68a',
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      marginTop: '0.75rem',
                      color: '#92400e',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <AlertTriangle size={18} color="#d97706" />
                      <span>All slots in this facility are currently occupied or locked. Browse nearby alternatives below.</span>
                    </div>
                  )}

                  {alternativeFacilities.length > 0 && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.75rem',
                      marginTop: '0.75rem'
                    }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Suggested Alternative Facilities ({alternativeFacilities.length})</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>From UML Activity Spec</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {alternativeFacilities.map(alt => (
                          <div key={alt.facilityId} style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            padding: '0.5rem 0.75rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.8rem'
                          }}>
                            <div>
                              <strong style={{ display: 'block', color: 'var(--text-main)' }}>{alt.name}</strong>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                {alt.address} • {alt.distanceKm ? `${alt.distanceKm.toFixed(1)} km away` : ''} • {alt.availableSlots} available spots
                              </span>
                            </div>
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              onClick={() => handleOpenFacility(alt.facilityId)}
                            >
                              Switch to this
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.25rem', textAlign: 'left' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>
                    Reservation Details {selectedSlot && <span style={{ color: 'var(--primary)' }}>for Slot {selectedSlot.slotNumber}</span>}
                  </h4>

                  {bookingError && (
                    <div style={{
                      backgroundColor: 'var(--danger-light)',
                      color: 'var(--danger)',
                      padding: '0.625rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.85rem',
                      marginBottom: '1rem'
                    }}>
                      {bookingError}
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input
                        type="datetime-local"
                        className="form-input"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Vehicle License Plate</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. MH-12-AB-1234"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                    />
                  </div>

                  <button
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.75rem' }}
                    onClick={handleInitiateBooking}
                    disabled={bookingLoading}
                  >
                    {bookingLoading ? 'Checking Engine & Locking Slot...' : 'Lock Slot & Proceed to Payment Gateway'}
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
