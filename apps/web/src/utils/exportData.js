import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Export data to Excel
export const exportToExcel = (data, filename = 'export') => {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    // Generate Excel file and download
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return false;
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
    XLSX.writeFile(workbook, `${filename}.csv`, { bookType: 'csv' });

    return true;
  } catch (error) {
    console.error('Error exporting to CSV:', error);
    return false;
  }
};

// Export data to PDF
export const exportToPDF = (data, columns, filename = 'export', title = 'Report') => {
  try {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text(title, 14, 15);

    // Add timestamp
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);

    // Prepare table data
    const headers = columns.map(col => col.label || col.key);
    const rows = data.map(item =>
      columns.map(col => {
        const value = item[col.key];
        // Handle different data types
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'Yes' : 'No';
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
      })
    );

    // Add table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 28,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [102, 126, 234],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250]
      }
    });

    // Save the PDF
    doc.save(`${filename}.pdf`);

    return true;
  } catch (error) {
    console.error('Error exporting to PDF:', error);
    return false;
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
