import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Star, AlertCircle, X, CheckCircle2, Navigation, AlertTriangle, RotateCcw, CreditCard, ShieldCheck, ExternalLink, QrCode, Smartphone, Landmark } from 'lucide-react';

export default function TravelerBookingsView({ currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');

  // Modals
  const [summaryBooking, setSummaryBooking] = useState(null);
  const [cancelModalBooking, setCancelModalBooking] = useState(null);
  const [payModalBooking, setPayModalBooking] = useState(null);
  const [reviewBooking, setReviewBooking] = useState(null);

  // Payment Gateway inside My Bookings
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [cardData, setCardData] = useState({
    nameOnCard: 'Amit Patil',
    cardNumber: '4532 8912 3456 7890',
    expiry: '12/28',
    cvv: '321'
  });
  const [upiVpa, setUpiVpa] = useState('amit@okhdfc');
  const [bankName, setBankName] = useState('HDFC Bank');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  // Review state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchBookings = async () => {
    if (!currentUser?.token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/my-bookings', {
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [currentUser]);

  // Cancel Booking
  const handleConfirmCancel = async () => {
    if (!cancelModalBooking) return;
    setCancelling(true);

    try {
      const res = await fetch(`/api/bookings/${cancelModalBooking.bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${currentUser.token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage(`Booking ${data.bookingRef} cancelled. ₹${data.totalAmount} refund dispatched to original payment source.`);
        setCancelModalBooking(null);
        if (summaryBooking?.bookingId === cancelModalBooking.bookingId) {
          setSummaryBooking(null);
        }
        fetchBookings();
      } else {
        alert(data.message || 'Could not cancel booking.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  // Pay for Locked Booking directly from My Bookings
  const handleCompletePayment = async () => {
    if (!payModalBooking) return;
    setPaymentLoading(true);
    setPaymentError('');

    try {
      const cardLast4 = cardData.cardNumber.replace(/\s/g, '').slice(-4) || '7890';
      const res = await fetch('/api/bookings/confirm-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          bookingId: payModalBooking.bookingId,
          paymentMethod: paymentMethod,
          cardNumberLast4: cardLast4,
          cardBrand: 'VISA',
          upiVpa: upiVpa,
          bankName: bankName
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Payment processing failed.');
      }

      setActionMessage(`Payment successful! Booking ${data.bookingRef} is now confirmed.`);
      setPayModalBooking(null);
      fetchBookings();
    } catch (err) {
      setPaymentError(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Submit Review
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewBooking) return;

    try {
      const res = await fetch(`/api/bookings/${reviewBooking.bookingId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      if (res.ok) {
        setReviewBooking(null);
        setComment('');
        setActionMessage('Review submitted successfully! Thank you for your feedback.');
        fetchBookings();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="app-container" style={{ textAlign: 'left' }}>
      
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Parking Bookings</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Click on any booking to view the full summary and parking location, complete payments, or cancel reservations with instant refunds.
        </p>
      </div>

      {actionMessage && (
        <div style={{
          backgroundColor: 'var(--success-light)',
          color: '#065f46',
          padding: '0.75rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1rem',
          border: '1px solid #a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{actionMessage}</span>
        </div>
      )}

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading your reservation history...
        </div>
      ) : bookings.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Calendar size={36} color="#94a3b8" style={{ margin: '0 auto 1rem' }} />
          <h3>No bookings yet</h3>
          <p style={{ color: 'var(--text-muted)' }}>Use ParkFinder to locate and book your first parking space!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {bookings.map((b) => {
            const fac = b.slot?.facility;
            const isConfirmed = b.bookingState === 'CONFIRMED';
            const isLocked = b.bookingState === 'SLOT_LOCKED';
            const isCancelled = b.bookingState === 'CANCELLED';

            return (
              <div
                key={b.bookingId}
                className="card card-hover"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  borderLeft: isConfirmed ? '4px solid var(--success)' : isLocked ? '4px solid var(--warning)' : '4px solid var(--border)'
                }}
              >
                {/* Left: Summary Preview (Clickable) */}
                <div
                  style={{ cursor: 'pointer', flex: 1, minWidth: '260px' }}
                  onClick={() => setSummaryBooking(b)}
                  title="Click to view detailed summary & location"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {b.bookingRef}
                    </span>
                    <span className={`badge ${
                      isConfirmed ? 'badge-success' :
                      b.bookingState === 'COMPLETED' ? 'badge-primary' :
                      isCancelled ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {b.bookingState}
                    </span>
                    {b.payment?.paymentStatus === 'REFUNDED' && (
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem' }}>
                        REFUNDED (₹{b.totalAmount})
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {fac?.name || 'Smart Parking Facility'} — Slot <strong>{b.slot?.slotNumber}</strong> ({b.slot?.vehicleType})
                  </div>

                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <span><MapPin size={14} style={{ display: 'inline', marginRight: '2px' }} /> {fac?.address || 'City Center'}, {fac?.city || 'Pune'}</span>
                    <span><strong>Plate:</strong> {b.vehicleNumber}</span>
                    <span><strong>Total:</strong> ₹{b.totalAmount}</span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  
                  {/* View Summary & Location Button */}
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setSummaryBooking(b)}
                  >
                    <MapPin size={14} /> View Summary & Location
                  </button>

                  {/* Proceed to Payment Gateway if SLOT_LOCKED */}
                  {isLocked && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setPayModalBooking(b)}
                    >
                      <CreditCard size={14} /> Pay via Gateway (₹{b.totalAmount})
                    </button>
                  )}

                  {/* Cancel Button (Always visible on active or locked bookings) */}
                  {(isConfirmed || isLocked) && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setCancelModalBooking(b)}
                    >
                      <RotateCcw size={14} /> Cancel Booking
                    </button>
                  )}

                  {/* Review Button */}
                  {(isConfirmed || b.bookingState === 'COMPLETED') && !b.review && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setReviewBooking(b)}
                    >
                      <Star size={14} /> Rate
                    </button>
                  )}

                  {b.review && (
                    <div style={{ fontSize: '0.85rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <Star size={14} fill="#f59e0b" /> {b.review.rating}/5
                    </div>
                  )}

                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. BOOKED SLOT SUMMARY & PARKING LOCATION MODAL          */}
      {/* ======================================================== */}
      {summaryBooking && (
        <div className="modal-overlay" onClick={() => setSummaryBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.05em' }}>
                  RESERVATION SUMMARY & PARKING PASS
                </span>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800 }}>
                  Booking Ref: {summaryBooking.bookingRef}
                </h3>
              </div>
              <button onClick={() => setSummaryBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Status & Timing Banner */}
            <div style={{
              backgroundColor: summaryBooking.bookingState === 'CONFIRMED' ? '#ecfdf5' :
                               summaryBooking.bookingState === 'CANCELLED' ? '#fef2f2' : '#fffbeb',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RESERVATION STATUS</div>
                <div style={{ fontSize: '1rem', fontWeight: 800 }}>
                  {summaryBooking.bookingState}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textAlign: 'right' }}>TARIFF CHARGE</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#065f46', textAlign: 'right' }}>
                  ₹{summaryBooking.totalAmount}
                </div>
              </div>
            </div>

            {/* --- PARKING LOCATION DETAILS SECTION --- */}
            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              marginBottom: '1.25rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <MapPin size={20} color="#2563eb" />
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Location of Parking
                </h4>
              </div>

              <div style={{ fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '0.75rem' }}>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                  {summaryBooking.slot?.facility?.name || 'Central Parking Hub'}
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  {summaryBooking.slot?.facility?.address || 'Main Street, Metro Zone'}, {summaryBooking.slot?.facility?.city || 'Pune'}
                </div>
                {summaryBooking.slot?.facility?.latitude && summaryBooking.slot?.facility?.longitude && (
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                    GPS Coordinates: {summaryBooking.slot?.facility?.latitude}° N, {summaryBooking.slot?.facility?.longitude}° E
                  </div>
                )}
              </div>

              {/* Navigation Action */}
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${summaryBooking.slot?.facility?.latitude || 18.5204},${summaryBooking.slot?.facility?.longitude || 73.8567}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary btn-sm"
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                <Navigation size={14} /> Open Turn-by-Turn Navigation in Google Maps
              </a>
            </div>

            {/* --- SLOT & VEHICLE SUMMARY --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              <div className="card" style={{ padding: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Allocated Slot:</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {summaryBooking.slot?.slotNumber}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Type: {summaryBooking.slot?.vehicleType}
                </span>
              </div>

              <div className="card" style={{ padding: '0.75rem' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Vehicle Plate:</span>
                <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                  {summaryBooking.vehicleNumber}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Driver: {summaryBooking.traveler?.name}
                </span>
              </div>
            </div>

            {/* Time Window */}
            <div style={{
              backgroundColor: '#ffffff',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '0.875rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Start Time:</span>
                  <div style={{ fontWeight: 700 }}>{new Date(summaryBooking.startTime).toLocaleString()}</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>End Time:</span>
                  <div style={{ fontWeight: 700 }}>{new Date(summaryBooking.endTime).toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Payment Summary */}
            <div style={{
              backgroundColor: '#f1f5f9',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Payment Status:</span>
                <strong style={{ color: summaryBooking.payment?.paymentStatus === 'SUCCESSFUL' ? '#065f46' : '#b45309' }}>
                  {summaryBooking.payment?.paymentStatus || 'COMPLETED'}
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                <span>Payment Method:</span>
                <strong>{summaryBooking.payment?.paymentDetails || summaryBooking.payment?.paymentMethod || 'Card'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Gateway Txn ID:</span>
                <code style={{ fontSize: '0.75rem' }}>{summaryBooking.payment?.gatewayTxnId || 'TXN-APPROVED'}</code>
              </div>
            </div>

            {/* Actions inside Modal */}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {(summaryBooking.bookingState === 'CONFIRMED' || summaryBooking.bookingState === 'SLOT_LOCKED') && (
                <button
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                  onClick={() => {
                    const target = summaryBooking;
                    setSummaryBooking(null);
                    setCancelModalBooking(target);
                  }}
                >
                  <RotateCcw size={16} /> Cancel Reservation & Refund
                </button>
              )}
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setSummaryBooking(null)}
              >
                Close Summary
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. PAYMENT GATEWAY MODAL (FOR PAYING IN MY BOOKINGS)     */}
      {/* ======================================================== */}
      {payModalBooking && (
        <div className="modal-overlay" onClick={() => setPayModalBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>SPS Payment Gateway</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Complete checkout for Ref: {payModalBooking.bookingRef}</p>
              </div>
              <button onClick={() => setPayModalBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {paymentError && (
              <div style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)', padding: '0.625rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                {paymentError}
              </div>
            )}

            {/* Method Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'CARD' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPaymentMethod('CARD')}
              >
                <CreditCard size={14} /> Card
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'UPI' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPaymentMethod('UPI')}
              >
                <Smartphone size={14} /> UPI / QR
              </button>
              <button
                type="button"
                className={`btn btn-sm ${paymentMethod === 'NETBANKING' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setPaymentMethod('NETBANKING')}
              >
                <Landmark size={14} /> NetBanking
              </button>
            </div>

            {/* Card Inputs */}
            {paymentMethod === 'CARD' && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Cardholder Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cardData.nameOnCard}
                    onChange={(e) => setCardData({ ...cardData, nameOnCard: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Card Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={cardData.cardNumber}
                    onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Expiry</label>
                    <input
                      type="text"
                      className="form-input"
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>CVV</label>
                    <input
                      type="password"
                      className="form-input"
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* UPI QR */}
            {paymentMethod === 'UPI' && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'inline-flex', padding: '8px', background: '#fff', borderRadius: '6px', border: '1px solid var(--border)', marginBottom: '0.5rem' }}>
                  <QrCode size={100} color="#1e3a8a" />
                </div>
                <div className="form-group" style={{ textAlign: 'left', marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>UPI ID (VPA)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={upiVpa}
                    onChange={(e) => setUpiVpa(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* NetBanking */}
            {paymentMethod === 'NETBANKING' && (
              <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                <label className="form-label" style={{ fontSize: '0.75rem' }}>Select Bank</label>
                <select className="form-select" value={bankName} onChange={(e) => setBankName(e.target.value)}>
                  <option value="HDFC Bank">HDFC Bank</option>
                  <option value="State Bank of India">State Bank of India</option>
                  <option value="ICICI Bank">ICICI Bank</option>
                  <option value="Axis Bank">Axis Bank</option>
                </select>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 1rem', background: '#f1f5f9', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
              <span style={{ fontWeight: 600 }}>Total Tariff:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>₹{payModalBooking.totalAmount}</span>
            </div>

            <button
              className="btn btn-success"
              style={{ width: '100%', padding: '0.75rem' }}
              onClick={handleCompletePayment}
              disabled={paymentLoading}
            >
              {paymentLoading ? 'Processing Gateway...' : `Authorize & Pay ₹${payModalBooking.totalAmount}`}
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CANCEL BOOKING & REFUND CONFIRMATION MODAL            */}
      {/* ======================================================== */}
      {cancelModalBooking && (
        <div className="modal-overlay" onClick={() => setCancelModalBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <AlertTriangle size={24} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Cancel Parking Booking</h3>
              </div>
              <button onClick={() => setCancelModalBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Are you sure you want to cancel this reservation? The slot will be released back immediately to free inventory.
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem',
              fontSize: '0.85rem'
            }}>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Booking Ref:</strong> {cancelModalBooking.bookingRef}
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Facility:</strong> {cancelModalBooking.slot?.facility?.name || 'Smart Parking Hub'} (Slot {cancelModalBooking.slot?.slotNumber})
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Location:</strong> {cancelModalBooking.slot?.facility?.address || 'City Center'}
              </div>
              <div style={{ marginBottom: '0.35rem' }}>
                <strong>Refund Amount:</strong> <span style={{ color: '#065f46', fontWeight: 700 }}>₹{cancelModalBooking.totalAmount} (100% Full Refund)</span>
              </div>
              <div>
                <strong>Destination:</strong> Original payment source ({cancelModalBooking.payment?.paymentMethod || 'Gateway'})
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                style={{ flex: 1 }}
                onClick={() => setCancelModalBooking(null)}
              >
                Keep Booking
              </button>
              <button
                className="btn btn-danger"
                style={{ flex: 2 }}
                onClick={handleConfirmCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelling & Refunding...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. LEAVE REVIEW MODAL                                    */}
      {/* ======================================================== */}
      {reviewBooking && (
        <div className="modal-overlay" onClick={() => setReviewBooking(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Leave Parking Review</h3>
              <button onClick={() => setReviewBooking(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">Rating (1 to 5 Stars)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: star <= rating ? '#f59e0b' : '#cbd5e1'
                      }}
                    >
                      <Star size={28} fill={star <= rating ? '#f59e0b' : 'none'} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Review Comment</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  required
                  placeholder="How was the parking experience? Ease of access, cleanliness, security..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                Submit Review
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
