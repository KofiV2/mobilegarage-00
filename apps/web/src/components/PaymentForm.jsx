import React, { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { cardElementOptions } from '../config/stripe';
import './PaymentForm.css';

const PaymentForm = ({
  clientSecret,
  amount,
  currency = 'AED',
  onSuccess,
  onError,
  saveCard = false,
  onSaveCardChange
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    if (event.error) {
      setErrorMessage(event.error.message);
    } else {
      setErrorMessage('');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardComplete) {
      setErrorMessage('Please complete your card details');
      return;
    }

    setProcessing(true);
    setErrorMessage('');

    try {
      const cardElement = elements.getElement(CardElement);

      // Confirm the payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            // Can add billing details here if needed
          }
        },
        setup_future_usage: saveCard ? 'off_session' : undefined
      });

      if (error) {
        setErrorMessage(error.message);
        if (onError) {
          onError(error);
        }
      } else if (paymentIntent.status === 'succeeded') {
        if (onSuccess) {
          onSuccess(paymentIntent);
        }
      } else {
        setErrorMessage(`Payment status: ${paymentIntent.status}`);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setErrorMessage('An unexpected error occurred. Please try again.');
      if (onError) {
        onError(err);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-amount">
        <span className="amount-label">Total Amount:</span>
        <span className="amount-value">{currency} {amount.toFixed(2)}</span>
      </div>

      <div className="card-element-container">
        <label className="card-label">Card Details</label>
        <div className="card-element-wrapper">
          <CardElement
            options={cardElementOptions}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {onSaveCardChange && (
        <div className="save-card-checkbox">
          <label>
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => onSaveCardChange(e.target.checked)}
            />
            <span>Save card for future payments</span>
          </label>
        </div>
      )}

      {errorMessage && (
        <div className="payment-error">
          <span className="error-icon">⚠</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <button
        type="submit"
        className="payment-submit-btn"
        disabled={!stripe || processing || !cardComplete}
      >
        {processing ? (
          <>
            <span className="spinner"></span>
            Processing...
          </>
        ) : (
          `Pay ${currency} ${amount.toFixed(2)}`
        )}
      </button>

      <div className="payment-security-note">
        <span className="lock-icon">🔒</span>
        <span>Your payment is secure and encrypted</span>
      </div>

      <div className="test-cards-info">
        <details>
          <summary>Test Cards (Development Only)</summary>
          <div className="test-cards-list">
            <p><strong>Success:</strong> 4242 4242 4242 4242</p>
            <p><strong>Declined:</strong> 4000 0000 0000 9995</p>
            <p><strong>Authentication Required:</strong> 4000 0025 0000 3155</p>
            <p>Use any future expiry date and any 3-digit CVC</p>
          </div>
        </details>
      </div>
    </form>
  );
};

export default PaymentForm;
