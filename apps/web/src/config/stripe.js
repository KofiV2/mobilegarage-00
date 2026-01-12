import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with publishable key
// This will be fetched from the API or environment variable
let stripePromise = null;

export const getStripe = async () => {
  if (!stripePromise) {
    try {
      // Try to get from environment first
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

      if (publishableKey) {
        stripePromise = loadStripe(publishableKey);
      } else {
        // Fallback: fetch from API
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/payments-stripe/publishable-key`);
        const data = await response.json();

        if (data.publishableKey) {
          stripePromise = loadStripe(data.publishableKey);
        } else {
          throw new Error('Stripe publishable key not found');
        }
      }
    } catch (error) {
      console.error('Error loading Stripe:', error);
      throw error;
    }
  }

  return stripePromise;
};

// Test card numbers for development
export const TEST_CARDS = {
  success: {
    number: '4242 4242 4242 4242',
    description: 'Payment succeeds'
  },
  declined: {
    number: '4000 0000 0000 9995',
    description: 'Card declined'
  },
  insufficientFunds: {
    number: '4000 0000 0000 9995',
    description: 'Insufficient funds'
  },
  expired: {
    number: '4000 0000 0000 0069',
    description: 'Expired card'
  },
  processing: {
    number: '4000 0000 0000 3220',
    description: 'Processing error'
  },
  authentication: {
    number: '4000 0025 0000 3155',
    description: 'Requires authentication (3D Secure)'
  }
};

// Card element styling options
export const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      '::placeholder': {
        color: '#aab7c4'
      },
      padding: '12px'
    },
    invalid: {
      color: '#fa755a',
      iconColor: '#fa755a'
    }
  },
  hidePostalCode: true
};

// Payment element appearance options
export const paymentElementOptions = {
  layout: {
    type: 'tabs',
    defaultCollapsed: false
  },
  appearance: {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0066cc',
      colorBackground: '#ffffff',
      colorText: '#30313d',
      colorDanger: '#df1b41',
      fontFamily: '"Segoe UI", Roboto, sans-serif',
      spacingUnit: '4px',
      borderRadius: '8px'
    },
    rules: {
      '.Input': {
        border: '1px solid #e0e0e0',
        boxShadow: 'none'
      },
      '.Input:focus': {
        border: '1px solid #0066cc',
        boxShadow: '0 0 0 3px rgba(0, 102, 204, 0.1)'
      },
      '.Label': {
        fontSize: '14px',
        fontWeight: '500',
        marginBottom: '8px'
      }
    }
  }
};
