// utils/billUtils.js

import { LOGO_BASE64, COMPANY_INFO } from './printassest';

/**
 * Generates the HTML for the bill/PDF, embedding the logo and company info.
 * @param {Object} options - All info to display on the bill.
 * @param {string} options.customerName
 * @param {string} options.phoneNumber
 * @param {string} options.invoiceNo
 * @param {string} options.date
 * @param {string} options.vehicleNo
 * @param {string} options.vehicleModel
 * @param {string} options.currentKM
 * @param {string} options.service
 * @param {string|number} options.totalAmount
 * @returns {string} - HTML string for PDF generation
 */
export const generateBillHTML = ({
  customerName,
  phoneNumber,
  invoiceNo,
  date,
  vehicleNo,
  vehicleModel,
  currentKM,
  service,
  totalAmount,
}) => `
  <div style="width:100%;font-family:sans-serif;color:#000;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <img src="${LOGO_BASE64}" style="width:70px;height:70px;object-fit:contain" />
      <div style="text-align:right;font-size:13px;line-height:1.3;">
        <strong>${COMPANY_INFO.name}</strong><br/>
        ${COMPANY_INFO.address}<br/>
        Phone: ${COMPANY_INFO.phone}<br/>
        Website: ${COMPANY_INFO.website}
      </div>
    </div>
    <h3 style="margin: 24px 0 12px 0; font-weight: bold; text-align:center;">BILL / INVOICE</h3>
    <table style="width:100%;font-size:15px;margin-bottom:18px;border-collapse:collapse;">
      <tbody>
        <tr><td><b>Date:</b></td><td>${date}</td></tr>
        <tr><td><b>Invoice No:</b></td><td>${invoiceNo}</td></tr>
        <tr><td><b>Customer Name:</b></td><td>${customerName}</td></tr>
        <tr><td><b>Phone No:</b></td><td>${phoneNumber}</td></tr>
        <tr><td><b>Vehicle No:</b></td><td>${vehicleNo}</td></tr>
        <tr><td><b>Vehicle Model:</b></td><td>${vehicleModel}</td></tr>
        <tr><td><b>Current KM:</b></td><td>${currentKM}</td></tr>
        <tr><td><b>Service:</b></td><td>${service}</td></tr>
      </tbody>
    </table>
    <div style="font-size:18px;font-weight:bold;margin-top:16px;text-align:right;">
      TOTAL AMOUNT: ₹${totalAmount}
    </div>
    <div style="font-size:12px;text-align:center;margin-top:30px;color:#555;">
      Thank you for your business!
    </div>
  </div>
`;
