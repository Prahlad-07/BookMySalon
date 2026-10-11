/**
 * @author Prahlad Yadav
 * @version 1.0
 * @since 2026-08-31
 */
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../config/api';

export default function PaymentResult({ outcome }) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get('bookingId');
  const [status, setStatus] = useState(outcome === 'success' ? 'processing' : 'cancelled');

  useEffect(() => {
    if (outcome !== 'success' || !bookingId) return undefined;

    let attempts = 0;
    let timer;

    const poll = async () => {
      attempts += 1;
      try {
        const payments = await api.get(`/api/payments/booking/${bookingId}`);
        const paid = Array.isArray(payments) && payments.some((payment) => payment.status === 'COMPLETED');
        if (paid) {
          setStatus('paid');
          return;
        }
      } catch (_) {
        // keep polling; webhook may not have landed yet
      }
      if (attempts < 6) {
        timer = window.setTimeout(poll, 2500);
      } else {
        setStatus('pending');
      }
    };

    poll();
    return () => window.clearTimeout(timer);
  }, [outcome, bookingId]);

  const content = {
    processing: {
      eyebrow: 'Payment',
      title: 'Confirming your payment…',
      body: 'We’re waiting for the payment provider to confirm. This usually takes a few seconds — no need to refresh.',
    },
    paid: {
      eyebrow: 'Payment received',
      title: 'You’re all set.',
      body: 'Your booking is confirmed and the salon has been notified. You’ll find it under Appointments.',
    },
    pending: {
      eyebrow: 'Payment received',
      title: 'Almost there.',
      body: 'Your payment went through, but the confirmation is taking longer than usual. Check Appointments in a moment.',
    },
    cancelled: {
      eyebrow: 'Checkout cancelled',
      title: 'No charge was made.',
      body: 'Your booking is still held. You can pay from Appointments whenever you’re ready.',
    },
  }[status];

  return (
    <div className="shell flex min-h-[70vh] flex-col justify-center py-20">
      <div className="max-w-lg">
        <p className="eyebrow flex items-center gap-2">
          {status === 'processing' && <span className="spinner !h-3.5 !w-3.5" aria-hidden="true" />}
          {content.eyebrow}
        </p>
        <h1 className="display mt-4 text-[52px] text-ink sm:text-[64px]">{content.title}</h1>
        <p className="lede mt-4">{content.body}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/bookings" className="btn-dark">
            View appointments
          </Link>
          <Link to="/salons" className="btn-secondary">
            Browse salons
          </Link>
        </div>
      </div>
    </div>
  );
}
