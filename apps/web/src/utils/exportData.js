import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Helper function to format date for filenames
const getTimestampedFilename = (baseFilename) => {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${baseFilename}_${timestamp}`;
};

// Export data to Excel
export const exportToExcel = (data, filename = 'export', options = {}) => {
  try {
    const { sheetName = 'Sheet1', columnWidths = {} } = options;

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths if provided
    const wscols = Object.keys(data[0] || {}).map(key => ({
      wch: columnWidths[key] || 15
    }));
    worksheet['!cols'] = wscols;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and download
    const timestampedFilename = getTimestampedFilename(filename);
    XLSX.writeFile(workbook, `${timestampedFilename}.xlsx`);

    return { success: true, filename: `${timestampedFilename}.xlsx` };
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return { success: false, error: error.message };
  }
};

// Export data to CSV
export const exportToCSV = (data, filename = 'export') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate CSV file and download
    const timestampedFilename = getTimestampedFilename(filename);
    XLSX.writeFile(workbook, `${timestampedFilename}.csv`, { bookType: 'csv' });

    return { success: true, filename: `${timestampedFilename}.csv` };
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return { success: false, error: error.message };
  }
};

// Export data to PDF
export const exportToPDF = (data, columns, filename = 'export', title = 'Report', options = {}) => {
  try {
    const {
      orientation = 'portrait',
      companyName = 'Car Wash Management System',
      subtitle = '',
      includeFooter = true,
      tableStartY = 28
    } = options;

    const doc = new jsPDF({ orientation });

    // Add title
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text(title, 14, 15);

    // Add company name if provided
    if (companyName) {
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(companyName, 14, 21);
    }

    // Add subtitle if provided
    if (subtitle) {
      doc.setFontSize(9);
      doc.text(subtitle, 14, 26);
    }

    // Add timestamp
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${timestamp}`, 14, subtitle ? 31 : 26);

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Prepare table data
    const headers = columns.map(col => col.label || col.key);
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col.key];
        // Handle different data types
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        // Format numbers with thousands separator
        if (typeof value === 'number' && !col.key.includes('id')) {
          return value.toLocaleString();
        }
        return String(value);
      })
    );

    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: subtitle ? 35 : tableStartY,
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak'
      },
      headStyles: {
        fillColor: [41, 128, 185], // Professional blue
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      },
      margin: { top: 10, bottom: 20 },
      didDrawPage: (data) => {
        // Add footer with page numbers
        if (includeFooter) {
          const pageCount = doc.internal.getNumberOfPages();
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height || pageSize.getHeight();

          doc.setFontSize(8);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            pageHeight - 10
          );
        }
      }
    });

    // Save the PDF
    const timestampedFilename = getTimestampedFilename(filename);
    doc.save(`${timestampedFilename}.pdf`);

    return { success: true, filename: `${timestampedFilename}.pdf` };
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return { success: false, error: error.message };
  }
};

// Specialized export functions for different data types

// Export Users data
export const exportUsers = (users, format = 'excel', filters = {}) => {
  try {
    if (!users || users.length === 0) {
      throw new Error('No users data to export');
    }

    // Prepare data for export
    const exportData = users.map(user => ({
      'User ID': user.id,
      'First Name': user.firstName,
      'Last Name': user.lastName,
      'Email': user.email,
      'Role': user.role,
      'Status': user.isActive ? 'Active' : 'Inactive',
      'Total Bookings': user.totalBookings || 0,
      'Join Date': new Date(user.createdAt).toLocaleDateString()
    }));

    const filterInfo = [];
    if (filters.role && filters.role !== 'all') {
      filterInfo.push(`Role: ${filters.role}`);
    }
    if (filters.search) {
      filterInfo.push(`Search: ${filters.search}`);
    }

    const subtitle = filterInfo.length > 0 ? `Filters: ${filterInfo.join(', ')}` : '';

    if (format === 'excel') {
      return exportToExcel(exportData, 'users_export', {
        sheetName: 'Users',
        columnWidths: { 'Email': 25, 'First Name': 15, 'Last Name': 15 }
      });
    } else if (format === 'csv') {
      return exportToCSV(exportData, 'users_export');
    } else if (format === 'pdf') {
      const columns = [
        { key: 'User ID', label: 'ID' },
        { key: 'First Name', label: 'First Name' },
        { key: 'Last Name', label: 'Last Name' },
        { key: 'Email', label: 'Email' },
        { key: 'Role', label: 'Role' },
        { key: 'Status', label: 'Status' },
        { key: 'Total Bookings', label: 'Bookings' },
        { key: 'Join Date', label: 'Joined' }
      ];
      return exportToPDF(exportData, columns, 'users_report', 'Users Report', {
        orientation: 'landscape',
        subtitle
      });
    }
  } catch (error) {
    console.error('Error exporting users:', error);
    return { success: false, error: error.message };
  }
};

// Export Bookings data
export const exportBookings = (bookings, format = 'excel', filters = {}) => {
  try {
    if (!bookings || bookings.length === 0) {
      throw new Error('No bookings data to export');
    }

    // Prepare data for export
    const exportData = bookings.map(booking => ({
      'Booking #': booking.bookingNumber,
      'Customer': booking.customer,
      'Service': booking.service,
      'Vehicle': booking.vehicle,
      'Date': new Date(booking.date).toLocaleDateString(),
      'Time': booking.time,
      'Status': booking.status,
      'Payment Status': booking.paymentStatus,
      'Amount (AED)': booking.amount
    }));

    const filterInfo = [];
    if (filters.status && filters.status !== 'all') {
      filterInfo.push(`Status: ${filters.status}`);
    }
    if (filters.search) {
      filterInfo.push(`Search: ${filters.search}`);
    }

    const subtitle = filterInfo.length > 0 ? `Filters: ${filterInfo.join(', ')}` : '';

    if (format === 'excel') {
      return exportToExcel(exportData, 'bookings_export', {
        sheetName: 'Bookings',
        columnWidths: { 'Booking #': 15, 'Customer': 20, 'Service': 20, 'Vehicle': 25 }
      });
    } else if (format === 'csv') {
      return exportToCSV(exportData, 'bookings_export');
    } else if (format === 'pdf') {
      const columns = [
        { key: 'Booking #', label: 'Booking #' },
        { key: 'Customer', label: 'Customer' },
        { key: 'Service', label: 'Service' },
        { key: 'Vehicle', label: 'Vehicle' },
        { key: 'Date', label: 'Date' },
        { key: 'Time', label: 'Time' },
        { key: 'Status', label: 'Status' },
        { key: 'Payment Status', label: 'Payment' },
        { key: 'Amount (AED)', label: 'Amount' }
      ];
      return exportToPDF(exportData, columns, 'bookings_report', 'Bookings Report', {
        orientation: 'landscape',
        subtitle
      });
    }
  } catch (error) {
    console.error('Error exporting bookings:', error);
    return { success: false, error: error.message };
  }
};

// Export Services data
export const exportServices = (services, format = 'excel') => {
  try {
    if (!services || services.length === 0) {
      throw new Error('No services data to export');
    }

    // Prepare data for export
    const exportData = services.map(service => ({
      'Service ID': service.id,
      'Name': service.name,
      'Description': service.description,
      'Category': service.category,
      'Base Price (AED)': service.basePrice,
      'Duration (min)': service.durationMinutes,
      'Status': service.isActive ? 'Active' : 'Inactive',
      'Total Bookings': service.totalBookings || 0,
      'Revenue (AED)': service.revenue || 0,
      'Features': service.features ? service.features.join(', ') : ''
    }));

    if (format === 'excel') {
      return exportToExcel(exportData, 'services_export', {
        sheetName: 'Services',
        columnWidths: { 'Name': 20, 'Description': 35, 'Features': 40 }
      });
    } else if (format === 'csv') {
      return exportToCSV(exportData, 'services_export');
    } else if (format === 'pdf') {
      const columns = [
        { key: 'Service ID', label: 'ID' },
        { key: 'Name', label: 'Name' },
        { key: 'Category', label: 'Category' },
        { key: 'Base Price (AED)', label: 'Price' },
        { key: 'Duration (min)', label: 'Duration' },
        { key: 'Status', label: 'Status' },
        { key: 'Total Bookings', label: 'Bookings' },
        { key: 'Revenue (AED)', label: 'Revenue' }
      ];
      return exportToPDF(exportData, columns, 'services_report', 'Services Report', {
        orientation: 'landscape'
      });
    }
  } catch (error) {
    console.error('Error exporting services:', error);
    return { success: false, error: error.message };
  }
};

// Export Analytics report
export const exportAnalyticsReport = (analyticsData, timeframe = 'week') => {
  try {
    const doc = new jsPDF();

    // Title
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Analytics Report', 14, 20);

    // Company name
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Car Wash Management System', 14, 27);

    // Timeframe
    doc.setFontSize(10);
    doc.text(`Period: ${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)}`, 14, 33);

    // Timestamp
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generated: ${timestamp}`, 14, 39);

    // Reset color
    doc.setTextColor(0, 0, 0);

    // Key Metrics Section
    doc.setFontSize(13);
    doc.setFont(undefined, 'bold');
    doc.text('Key Performance Metrics', 14, 50);

    const metrics = [
      ['Metric', 'Current Period', 'Previous Period', 'Growth'],
      [
        'Revenue',
        `AED ${analyticsData.revenue?.current?.toLocaleString() || 0}`,
        `AED ${analyticsData.revenue?.previous?.toLocaleString() || 0}`,
        `${analyticsData.revenue?.growth || 0}%`
      ],
      [
        'Bookings',
        `${analyticsData.bookings?.current || 0}`,
        `${analyticsData.bookings?.previous || 0}`,
        `${analyticsData.bookings?.growth || 0}%`
      ],
      [
        'New Customers',
        `${analyticsData.customers?.current || 0}`,
        `${analyticsData.customers?.previous || 0}`,
        `${analyticsData.customers?.growth || 0}%`
      ],
      [
        'Avg Order Value',
        `AED ${analyticsData.avgOrderValue?.current || 0}`,
        `AED ${analyticsData.avgOrderValue?.previous || 0}`,
        `${analyticsData.avgOrderValue?.growth || 0}%`
      ]
    ];

    doc.autoTable({
      head: [metrics[0]],
      body: metrics.slice(1),
      startY: 55,
      theme: 'grid',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: {
        fontSize: 9
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 40 },
        1: { halign: 'right', cellWidth: 45 },
        2: { halign: 'right', cellWidth: 45 },
        3: { halign: 'center', cellWidth: 30 }
      }
    });

    // Top Services Section
    if (analyticsData.topServices && analyticsData.topServices.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 100;

      doc.setFontSize(13);
      doc.setFont(undefined, 'bold');
      doc.text('Top Performing Services', 14, finalY + 15);

      const servicesData = [
        ['Rank', 'Service Name', 'Bookings', 'Revenue (AED)']
      ];

      analyticsData.topServices.forEach((service, index) => {
        servicesData.push([
          `#${index + 1}`,
          service.name,
          `${service.bookings}`,
          `AED ${service.revenue?.toLocaleString() || 0}`
        ]);
      });

      doc.autoTable({
        head: [servicesData[0]],
        body: servicesData.slice(1),
        startY: finalY + 20,
        theme: 'striped',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 20 },
          1: { cellWidth: 70 },
          2: { halign: 'center', cellWidth: 30 },
          3: { halign: 'right', cellWidth: 40 }
        }
      });
    }

    // Revenue by Day Section
    if (analyticsData.revenueByDay && analyticsData.revenueByDay.length > 0) {
      const finalY = doc.lastAutoTable.finalY || 150;

      // Check if we need a new page
      if (finalY > 220) {
        doc.addPage();
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('Daily Revenue Breakdown', 14, 20);

        const revenueData = [['Day', 'Revenue (AED)']];
        analyticsData.revenueByDay.forEach(item => {
          revenueData.push([item.day, `AED ${item.revenue?.toLocaleString() || 0}`]);
        });

        doc.autoTable({
          head: [revenueData[0]],
          body: revenueData.slice(1),
          startY: 25,
          theme: 'striped',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: 'right', cellWidth: 60 }
          }
        });
      } else {
        doc.setFontSize(13);
        doc.setFont(undefined, 'bold');
        doc.text('Daily Revenue Breakdown', 14, finalY + 15);

        const revenueData = [['Day', 'Revenue (AED)']];
        analyticsData.revenueByDay.forEach(item => {
          revenueData.push([item.day, `AED ${item.revenue?.toLocaleString() || 0}`]);
        });

        doc.autoTable({
          head: [revenueData[0]],
          body: revenueData.slice(1),
          startY: finalY + 20,
          theme: 'striped',
          headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold',
            halign: 'center'
          },
          columnStyles: {
            0: { cellWidth: 60 },
            1: { halign: 'right', cellWidth: 60 }
          }
        });
      }
    }

    // Add footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height || pageSize.getHeight();
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 14, pageHeight - 10);
      doc.text('Car Wash Management System', pageSize.width - 70, pageHeight - 10);
    }

    // Save the PDF
    const timestampedFilename = getTimestampedFilename('analytics_report');
    doc.save(`${timestampedFilename}.pdf`);

    return { success: true, filename: `${timestampedFilename}.pdf` };
  } catch (error) {
    console.error('Error exporting analytics report:', error);
    return { success: false, error: error.message };
  }
};

// Export current page as image (HTML to Canvas to Image)
export const exportPageAsImage = async (elementId, filename = 'screenshot') => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Use html2canvas library if available
    if (window.html2canvas) {
      const canvas = await window.html2canvas(element);
      const link = document.createElement('a');
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL();
      link.click();
      return true;
    } else {
      console.warn('html2canvas library not found. Please install: npm install html2canvas');
      return false;
    }
  } catch (error) {
    console.error('Error exporting page as image:', error);
    return false;
  }
};
