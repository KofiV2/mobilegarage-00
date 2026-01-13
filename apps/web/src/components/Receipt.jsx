import React from 'react';
import { jsPDF } from 'jspdf';
import './Receipt.css';

const Receipt = ({ receipt, onClose }) => {
  const downloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('In and Out Car Wash', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Premium Car Wash Services', pageWidth / 2, 28, { align: 'center' });

    // Receipt Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT RECEIPT', pageWidth / 2, 45, { align: 'center' });

    // Transaction Details
    let y = 60;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Transaction Details:', 20, y);

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Transaction Number: ${receipt.transactionNumber}`, 20, y);
    y += 7;
    doc.text(`Transaction ID: ${receipt.transactionId}`, 20, y);
    y += 7;
    doc.text(`Date: ${new Date(receipt.date).toLocaleString()}`, 20, y);
    y += 7;
    doc.text(`Status: ${receipt.status.toUpperCase()}`, 20, y);

    // Customer Details
    if (receipt.customer) {
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Details:', 20, y);

      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${receipt.customer.name}`, 20, y);
      y += 7;
      doc.text(`Email: ${receipt.customer.email}`, 20, y);
      if (receipt.customer.phone) {
        y += 7;
        doc.text(`Phone: ${receipt.customer.phone}`, 20, y);
      }
    }

    // Booking Details
    if (receipt.booking) {
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text('Booking Details:', 20, y);

      y += 10;
      doc.setFont('helvetica', 'normal');
      doc.text(`Booking Number: ${receipt.booking.bookingNumber}`, 20, y);
      y += 7;
      doc.text(`Service: ${receipt.booking.serviceName}`, 20, y);
      y += 7;
      doc.text(
        `Scheduled: ${new Date(receipt.booking.scheduledDate).toLocaleDateString()} at ${receipt.booking.scheduledTime}`,
        20,
        y
      );
      y += 7;
      doc.text(`Number of Vehicles: ${receipt.booking.numberOfVehicles}`, 20, y);
    }

    // Payment Details
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Details:', 20, y);

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Payment Method: ${receipt.paymentMethod.toUpperCase()}`, 20, y);
    y += 7;
    doc.text(`Provider: ${receipt.paymentProvider.toUpperCase()}`, 20, y);

    // Amount (highlighted)
    y += 15;
    doc.setFillColor(102, 126, 234);
    doc.rect(15, y - 5, pageWidth - 30, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Total Amount: ${receipt.currency} ${receipt.amount.toFixed(2)}`,
      pageWidth / 2,
      y + 5,
      { align: 'center' }
    );

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Thank you for choosing In and Out Car Wash!', pageWidth / 2, 270, { align: 'center' });
    doc.text('For support, contact: support@inandoutcarwash.com', pageWidth / 2, 277, { align: 'center' });

    // Save PDF
    doc.save(`Receipt-${receipt.transactionNumber}.pdf`);
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="receipt-modal">
      <div className="receipt-content">
        <button className="receipt-close" onClick={onClose}>×</button>

        <div className="receipt-header">
          <h1>In and Out Car Wash</h1>
          <p>Premium Car Wash Services</p>
        </div>

        <div className="receipt-title">
          <h2>Payment Receipt</h2>
        </div>

        <div className="receipt-section">
          <h3>Transaction Details</h3>
          <div className="receipt-row">
            <span>Transaction Number:</span>
            <strong>{receipt.transactionNumber}</strong>
          </div>
          <div className="receipt-row">
            <span>Transaction ID:</span>
            <strong>{receipt.transactionId}</strong>
          </div>
          <div className="receipt-row">
            <span>Date:</span>
            <strong>{new Date(receipt.date).toLocaleString()}</strong>
          </div>
          <div className="receipt-row">
            <span>Status:</span>
            <strong className={`status-${receipt.status}`}>
              {receipt.status.toUpperCase()}
            </strong>
          </div>
        </div>

        {receipt.customer && (
          <div className="receipt-section">
            <h3>Customer Details</h3>
            <div className="receipt-row">
              <span>Name:</span>
              <strong>{receipt.customer.name}</strong>
            </div>
            <div className="receipt-row">
              <span>Email:</span>
              <strong>{receipt.customer.email}</strong>
            </div>
            {receipt.customer.phone && (
              <div className="receipt-row">
                <span>Phone:</span>
                <strong>{receipt.customer.phone}</strong>
              </div>
            )}
          </div>
        )}

        {receipt.booking && (
          <div className="receipt-section">
            <h3>Booking Details</h3>
            <div className="receipt-row">
              <span>Booking Number:</span>
              <strong>{receipt.booking.bookingNumber}</strong>
            </div>
            <div className="receipt-row">
              <span>Service:</span>
              <strong>{receipt.booking.serviceName}</strong>
            </div>
            <div className="receipt-row">
              <span>Scheduled:</span>
              <strong>
                {new Date(receipt.booking.scheduledDate).toLocaleDateString()} at{' '}
                {receipt.booking.scheduledTime}
              </strong>
            </div>
            <div className="receipt-row">
              <span>Number of Vehicles:</span>
              <strong>{receipt.booking.numberOfVehicles}</strong>
            </div>
          </div>
        )}

        <div className="receipt-section">
          <h3>Payment Details</h3>
          <div className="receipt-row">
            <span>Payment Method:</span>
            <strong>{receipt.paymentMethod.toUpperCase()}</strong>
          </div>
          <div className="receipt-row">
            <span>Provider:</span>
            <strong>{receipt.paymentProvider.toUpperCase()}</strong>
          </div>
        </div>

        <div className="receipt-total">
          <span>Total Amount:</span>
          <strong>{receipt.currency} {receipt.amount.toFixed(2)}</strong>
        </div>

        {receipt.stripe?.receiptUrl && (
          <div className="receipt-stripe-link">
            <a href={receipt.stripe.receiptUrl} target="_blank" rel="noopener noreferrer">
              View Stripe Receipt
            </a>
          </div>
        )}

        <div className="receipt-actions">
          <button className="btn-download" onClick={downloadPDF}>
            Download PDF
          </button>
          <button className="btn-print" onClick={printReceipt}>
            Print Receipt
          </button>
        </div>

        <div className="receipt-footer">
          <p>Thank you for choosing In and Out Car Wash!</p>
          <p>For support, contact: support@inandoutcarwash.com</p>
        </div>
      </div>
    </div>
  );
};

export default Receipt;
