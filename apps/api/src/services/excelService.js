const ExcelJS = require('exceljs');
const moment = require('moment');

class ExcelService {
  // Generate Financial Report
  async generateFinancialReport(transactions, startDate, endDate) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Financial Report');

    // Add header
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = `Financial Report: ${moment(startDate).format('MMM DD, YYYY')} - ${moment(endDate).format('MMM DD, YYYY')}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Column headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow(['Date', 'Type', 'Category', 'Description', 'Amount', 'Payment Method']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E88E5' }
    };
    headerRow.font = { color: { argb: 'FFFFFF' }, bold: true };

    // Add data
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(transaction => {
      const row = worksheet.addRow([
        moment(transaction.date).format('YYYY-MM-DD'),
        transaction.type,
        transaction.category,
        transaction.description,
        transaction.amount,
        transaction.paymentMethod
      ]);

      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
        row.getCell(5).font = { color: { argb: '4CAF50' } };
      } else {
        totalExpense += transaction.amount;
        row.getCell(5).font = { color: { argb: 'F44336' } };
      }
    });

    // Add summary
    worksheet.addRow([]);
    worksheet.addRow(['Summary', '', '', '', '', '']);
    worksheet.addRow(['Total Income', '', '', '', totalIncome, '']);
    worksheet.addRow(['Total Expenses', '', '', '', totalExpense, '']);
    worksheet.addRow(['Net Profit/Loss', '', '', '', totalIncome - totalExpense, '']);

    // Format summary
    const summaryStartRow = worksheet.rowCount - 3;
    for (let i = 0; i < 4; i++) {
      const row = worksheet.getRow(summaryStartRow + i);
      row.font = { bold: true };
      row.getCell(5).numFmt = '$#,##0.00';
    }

    // Column widths
    worksheet.columns = [
      { width: 15 },
      { width: 12 },
      { width: 20 },
      { width: 40 },
      { width: 15 },
      { width: 20 }
    ];

    // Number format for amount column
    worksheet.getColumn(5).numFmt = '$#,##0.00';

    return workbook;
  }

  // Generate Payroll Report
  async generatePayrollReport(payrolls, period) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payroll Report');

    // Header
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `Payroll Report - ${period}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Column headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Employee ID',
      'Employee Name',
      'Regular Hours',
      'Overtime Hours',
      'Gross Pay',
      'Deductions',
      'Net Pay',
      'Status'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E88E5' }
    };

    // Add data
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    for (const payroll of payrolls) {
      const employee = await payroll.populate('employeeId');
      const user = await employee.employeeId.populate('userId');

      worksheet.addRow([
        employee.employeeId.employeeId,
        `${user.userId.firstName} ${user.userId.lastName}`,
        payroll.earnings.regularHours.hours,
        payroll.earnings.overtimeHours.hours,
        payroll.grossPay,
        payroll.totalDeductions,
        payroll.netPay,
        payroll.paymentStatus
      ]);

      totalGross += payroll.grossPay;
      totalDeductions += payroll.totalDeductions;
      totalNet += payroll.netPay;
    }

    // Summary
    worksheet.addRow([]);
    worksheet.addRow(['Totals', '', '', '', totalGross, totalDeductions, totalNet, '']);

    const summaryRow = worksheet.lastRow;
    summaryRow.font = { bold: true };

    // Column widths
    worksheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 },
      { width: 15 }
    ];

    // Number formats
    [5, 6, 7].forEach(col => {
      worksheet.getColumn(col).numFmt = '$#,##0.00';
    });

    return workbook;
  }

  // Generate Attendance Report
  async generateAttendanceReport(attendances, startDate, endDate) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance Report');

    // Header
    worksheet.mergeCells('A1:H1');
    worksheet.getCell('A1').value = `Attendance Report: ${moment(startDate).format('MMM DD, YYYY')} - ${moment(endDate).format('MMM DD, YYYY')}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Column headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Date',
      'Employee Name',
      'Check In',
      'Check Out',
      'Total Hours',
      'Status',
      'Late (minutes)',
      'Overtime'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E88E5' }
    };

    // Add data
    for (const attendance of attendances) {
      const employee = await attendance.populate('employeeId');
      const user = await employee.employeeId.populate('userId');

      worksheet.addRow([
        moment(attendance.date).format('YYYY-MM-DD'),
        `${user.userId.firstName} ${user.userId.lastName}`,
        attendance.checkIn.time ? moment(attendance.checkIn.time).format('HH:mm') : '-',
        attendance.checkOut.time ? moment(attendance.checkOut.time).format('HH:mm') : '-',
        attendance.totalHours || 0,
        attendance.status,
        attendance.lateMinutes || 0,
        attendance.overtimeHours || 0
      ]);
    }

    // Column widths
    worksheet.columns = [
      { width: 15 },
      { width: 25 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 12 },
      { width: 15 },
      { width: 12 }
    ];

    return workbook;
  }

  // Generate Revenue Report
  async generateRevenueReport(bookings, startDate, endDate) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Revenue Report');

    // Header
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = `Revenue Report: ${moment(startDate).format('MMM DD, YYYY')} - ${moment(endDate).format('MMM DD, YYYY')}`;
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Column headers
    worksheet.addRow([]);
    const headerRow = worksheet.addRow([
      'Booking Number',
      'Date',
      'Service',
      'Customer',
      'Amount',
      'Payment Status'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1E88E5' }
    };

    let totalRevenue = 0;
    let paidRevenue = 0;

    for (const booking of bookings) {
      const service = await booking.populate('serviceId');
      const user = await booking.populate('userId');

      worksheet.addRow([
        booking.bookingNumber,
        moment(booking.scheduledDate).format('YYYY-MM-DD'),
        service.serviceId.name,
        `${user.userId.firstName} ${user.userId.lastName}`,
        booking.totalPrice,
        booking.paymentStatus
      ]);

      totalRevenue += booking.totalPrice;
      if (booking.paymentStatus === 'paid') {
        paidRevenue += booking.totalPrice;
      }
    }

    // Summary
    worksheet.addRow([]);
    worksheet.addRow(['Summary', '', '', '', '', '']);
    worksheet.addRow(['Total Revenue', '', '', '', totalRevenue, '']);
    worksheet.addRow(['Paid Revenue', '', '', '', paidRevenue, '']);
    worksheet.addRow(['Pending Revenue', '', '', '', totalRevenue - paidRevenue, '']);

    // Column widths
    worksheet.columns = [
      { width: 20 },
      { width: 15 },
      { width: 25 },
      { width: 25 },
      { width: 15 },
      { width: 15 }
    ];

    worksheet.getColumn(5).numFmt = '$#,##0.00';

    return workbook;
  }
}

module.exports = new ExcelService();
