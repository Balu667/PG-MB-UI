// src/utils/receiptGenerator.ts
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";
import { Asset } from "expo-asset";

// Use require for expo-file-system to avoid TypeScript issues with legacy exports
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FileSystem = require("expo-file-system");

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

export interface PaymentReceiptData {
  /** Receipt date (defaults to current date if not provided) */
  date?: Date | string;
  /** Tenant/Customer name */
  tenantName: string;
  /** Room number or unit */
  roomNumber: string;
  /** Mobile/Phone number */
  mobileNumber: string;
  /** Sharing type (for PG/hostel) */
  sharingType?: number | string;
  /** Payment details - list of items with description and amount */
  paymentItems: Array<{
    description: string;
    amount: number;
  }>;
  /** Grand total amount (paid amount) */
  grandTotal: number;
  /** Total amount due (optional, for showing both total and paid) */
  totalAmount?: number;
  /** Amount actually paid (optional, defaults to grandTotal) */
  amountPaid?: number;
  /** Payment mode (cash, UPI, card, etc.) */
  paymentMode: string;
  /** Property/Business name */
  propertyName?: string;
  /** Property address */
  propertyAddress?: string;
  /** Custom footer message */
  footerMessage?: string;
}

export interface ReceiptGeneratorOptions {
  /** File name for the PDF (without extension). Default: 'payment_receipt' */
  fileName?: string;
  /** Whether to share after generating (default: true) */
  shareAfterGenerate?: boolean;
  /** Custom logo base64 (if not using default) */
  customLogoBase64?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
   LOGO BASE64 (Embedded PGMS Logo)
───────────────────────────────────────────────────────────────────────────── */

// This will be loaded dynamically from the asset
let cachedLogoBase64: string | null = null;

/**
 * Load the logo image and convert to base64
 */
const loadLogoBase64 = async (): Promise<string> => {
  if (cachedLogoBase64) {
    return cachedLogoBase64;
  }

  try {
    // Load the logo asset
    const logoAsset = Asset.fromModule(require("@/assets/images/logo.png"));
    await logoAsset.downloadAsync();

    if (logoAsset.localUri) {
      const base64 = await FileSystem.readAsStringAsync(logoAsset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      cachedLogoBase64 = `data:image/png;base64,${base64}`;
      return cachedLogoBase64;
    }
  } catch (error) {
    // Fallback: Return empty string if logo loading fails
  }

  return "";
};

/* ─────────────────────────────────────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Format date to DD/MM/YYYY
 */
const formatDate = (date?: Date | string): string => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return new Date().toLocaleDateString("en-GB");

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

/**
 * Format currency in INR
 */
const formatCurrency = (amount: number): string => {
  return amount.toLocaleString("en-IN");
};

/**
 * Capitalize first letter
 */
const capitalize = (str: string): string => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get month name from date
 */
const getMonthName = (date?: Date | string): string => {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short" });
};

/* ─────────────────────────────────────────────────────────────────────────────
   HTML TEMPLATE
───────────────────────────────────────────────────────────────────────────── */

/**
 * Generate HTML template for the receipt - matching web/Figma version exactly
 */
const generateReceiptHTML = (
  data: PaymentReceiptData,
  logoBase64: string
): string => {
  const {
    date,
    tenantName,
    roomNumber,
    mobileNumber,
    sharingType,
    paymentItems,
    grandTotal,
    paymentMode,
    propertyName = "PGMS",
    propertyAddress = "",
    footerMessage,
    totalAmount,
    amountPaid,
  } = data;

  const formattedDate = formatDate(date);
  const displayTotal = totalAmount ?? grandTotal;
  const displayPaid = amountPaid ?? grandTotal;

  // Generate payment items rows with inline styles for iOS compatibility
  const paymentItemsHTML = paymentItems
    .map(
      (item) => `
        <div class="payment-row" style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #dddddd; font-size: 13px;">
          <span class="payment-desc" style="color: #333333;">${item.description}</span>
          <span class="payment-amount" style="color: #7B4DC4; font-weight: 600;">${item.amount}</span>
        </div>
      `
    )
    .join("");

  // Auto-generated message
  const autoGeneratedMessage =
    footerMessage ||
    `This invoice is automatically generated by ${propertyName.toLowerCase()} via PGMS and does not require a physical signature.`;

  // Current year for footer
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payment Receipt</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #FFFFFF !important;
      color: #333333;
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    
    .container {
      flex: 1;
      max-width: 700px;
      margin: 0 auto;
      padding: 0;
      background-color: #FFFFFF !important;
      border: 1px solid #e0e0e0;
    }
    
    /* Purple Header Bar - iOS compatible */
    .header-bar {
      background-color: #7B4DC4 !important;
      -webkit-background-color: #7B4DC4 !important;
      padding: 15px 25px;
      display: flex;
      align-items: center;
      gap: 20px;
    }
    
    .logo-container {
      flex-shrink: 0;
    }
    
    .logo {
      height: 50px;
      width: auto;
    }
    
    .logo-text {
      font-size: 24px;
      font-weight: bold;
      color: #FFFFFF !important;
    }
    
    .header-divider {
      width: 2px;
      height: 40px;
      background-color: rgba(255,255,255,0.5) !important;
    }
    
    .property-info {
      color: #FFFFFF !important;
    }
    
    .property-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 2px;
      color: #FFFFFF !important;
    }
    
    .property-address {
      font-size: 12px;
      color: rgba(255,255,255,0.9) !important;
    }
    
    /* Content Area */
    .content {
      padding: 20px 25px;
      background-color: #FFFFFF !important;
    }
    
    /* Date Row */
    .date-row {
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid #e8e8e8;
    }
    
    .date-text {
      font-size: 13px;
      color: #666666 !important;
    }
    
    .date-text strong {
      color: #333333 !important;
    }
    
    /* Tenant Info */
    .tenant-info {
      margin-bottom: 20px;
    }
    
    .tenant-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
    }
    
    .tenant-label {
      color: #666666 !important;
    }
    
    .tenant-value {
      color: #333333 !important;
      font-weight: 500;
    }
    
    /* Payment Details Header - iOS compatible solid color */
    .payment-header {
      background-color: #7B4DC4 !important;
      -webkit-background-color: #7B4DC4 !important;
      padding: 12px 20px;
      display: flex;
      justify-content: space-between;
      margin: 0 -25px;
      margin-bottom: 15px;
    }
    
    .payment-header-text {
      color: #FFFFFF !important;
      font-size: 14px;
      font-weight: 600;
    }
    
    /* Payment Items */
    .payment-items {
      padding: 0 5px;
    }
    
    .payment-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px dashed #dddddd;
      font-size: 13px;
    }
    
    .payment-desc {
      color: #333333 !important;
    }
    
    .payment-amount {
      color: #7B4DC4 !important;
      font-weight: 600;
    }
    
    /* Grand Total Row */
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 5px;
      border-bottom: 1px dashed #dddddd;
      font-size: 14px;
      font-weight: bold;
    }
    
    .grand-total-label {
      color: #333333 !important;
      text-transform: uppercase;
    }
    
    .grand-total-amount {
      color: #333333 !important;
      font-weight: bold;
    }
    
    /* Payment Mode */
    .payment-mode-row {
      text-align: center;
      padding: 12px 0;
      border-bottom: 1px solid #e8e8e8;
      font-size: 13px;
      color: #666666 !important;
    }
    
    .payment-mode-row strong {
      color: #333333 !important;
    }
    
    /* Auto Notice */
    .auto-notice {
      padding: 15px 0;
      border-bottom: 1px solid #e8e8e8;
    }
    
    .auto-notice p {
      font-size: 12px;
      color: #666666 !important;
      font-style: italic;
      line-height: 1.5;
    }
    
    .auto-notice strong {
      font-weight: 600;
      color: #333333 !important;
    }
    
    /* Terms Section */
    .terms-section {
      padding: 20px 0;
    }
    
    .terms-title {
      font-size: 18px;
      font-weight: bold;
      color: #333333 !important;
      margin-bottom: 12px;
    }
    
    .terms-list {
      font-size: 12px;
      color: #666666 !important;
      line-height: 1.8;
    }
    
    .terms-list p {
      margin-bottom: 8px;
      padding-left: 0;
      color: #666666 !important;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      padding: 15px;
      border-top: 1px solid #e8e8e8;
      margin-top: auto;
      background-color: #FFFFFF !important;
    }
    
    .footer-text {
      font-size: 11px;
      color: #999999 !important;
    }
    
    /* Print styles - ensure colors print on iOS */
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      body {
        min-height: auto;
        background-color: #FFFFFF !important;
      }
      .container {
        border: none;
        max-width: 100%;
      }
      .header-bar {
        background-color: #7B4DC4 !important;
      }
      .payment-header {
        background-color: #7B4DC4 !important;
      }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FFFFFF; color: #333333; line-height: 1.5; min-height: 100vh; display: flex; flex-direction: column; margin: 0; padding: 0;">
  <div class="container" style="flex: 1; max-width: 700px; margin: 0 auto; padding: 0; background-color: #FFFFFF; border: 1px solid #e0e0e0;">
    <!-- Purple Header Bar -->
    <div class="header-bar" style="background-color: #7B4DC4; padding: 15px 25px; display: flex; align-items: center; gap: 20px;">
      <div class="logo-container" style="flex-shrink: 0;">
        ${logoBase64 ? `<img src="${logoBase64}" alt="PGMS Logo" class="logo" style="height: 50px; width: auto;" />` : '<span class="logo-text" style="font-size: 24px; font-weight: bold; color: #FFFFFF;">PGMS</span>'}
      </div>
      <div class="header-divider" style="width: 2px; height: 40px; background-color: rgba(255,255,255,0.5);"></div>
      <div class="property-info" style="color: #FFFFFF;">
        <div class="property-name" style="font-size: 18px; font-weight: 600; margin-bottom: 2px; color: #FFFFFF;">${propertyName}</div>
        ${propertyAddress ? `<div class="property-address" style="font-size: 12px; color: rgba(255,255,255,0.9);">${propertyAddress}</div>` : ""}
      </div>
    </div>
    
    <!-- Content -->
    <div class="content" style="padding: 20px 25px; background-color: #FFFFFF;">
      <!-- Date -->
      <div class="date-row" style="margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #e8e8e8;">
        <span class="date-text" style="font-size: 13px; color: #666666;"><strong style="color: #333333;">Date :</strong> ${formattedDate}</span>
      </div>
      
      <!-- Tenant Info -->
      <div class="tenant-info" style="margin-bottom: 20px;">
        <div class="tenant-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span class="tenant-label" style="color: #666666;">Tenant Name : <span class="tenant-value" style="color: #333333; font-weight: 500;">${tenantName}</span></span>
          <span class="tenant-label" style="color: #666666;">Room Number : <span class="tenant-value" style="color: #333333; font-weight: 500;">${roomNumber}</span></span>
        </div>
        <div class="tenant-row" style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px;">
          <span class="tenant-label" style="color: #666666;">Mobile Number : <span class="tenant-value" style="color: #333333; font-weight: 500;">${mobileNumber}</span></span>
          ${sharingType ? `<span class="tenant-label" style="color: #666666;">Sharing Type : <span class="tenant-value" style="color: #333333; font-weight: 500;">${sharingType}</span></span>` : ""}
        </div>
      </div>
      
      <!-- Payment Details Header -->
      <div class="payment-header" style="background-color: #7B4DC4; padding: 12px 20px; display: flex; justify-content: space-between; margin: 0 -25px; margin-bottom: 15px;">
        <span class="payment-header-text" style="color: #FFFFFF; font-size: 14px; font-weight: 600;">Payment Details</span>
        <span class="payment-header-text" style="color: #FFFFFF; font-size: 14px; font-weight: 600;">Paid Amount</span>
      </div>
      
      <!-- Payment Items -->
      <div class="payment-items" style="padding: 0 5px;">
        ${paymentItemsHTML}
      </div>
      
      <!-- Grand Total -->
      <div class="grand-total-row" style="display: flex; justify-content: space-between; padding: 12px 5px; border-bottom: 1px dashed #dddddd; font-size: 14px; font-weight: bold;">
        <span class="grand-total-label" style="color: #333333; text-transform: uppercase;">GRAND TOTAL</span>
        <span class="grand-total-amount" style="color: #333333; font-weight: bold;">${displayPaid}</span>
      </div>
      
      <!-- Payment Mode -->
      <div class="payment-mode-row" style="text-align: center; padding: 12px 0; border-bottom: 1px solid #e8e8e8; font-size: 13px; color: #666666;">
        <span>Payment Mode : <strong style="color: #333333;">${capitalize(paymentMode)}</strong></span>
      </div>
      
      <!-- Auto Notice -->
      <div class="auto-notice" style="padding: 15px 0; border-bottom: 1px solid #e8e8e8;">
        <p style="font-size: 12px; color: #666666; font-style: italic; line-height: 1.5;"><strong style="font-weight: 600; color: #333333;">${autoGeneratedMessage}</strong></p>
      </div>
      
      <!-- Terms & Conditions -->
      <div class="terms-section" style="padding: 20px 0;">
        <h3 class="terms-title" style="font-size: 18px; font-weight: bold; color: #333333; margin-bottom: 12px;">Terms & Conditions</h3>
        <div class="terms-list" style="font-size: 12px; color: #666666; line-height: 1.8;">
          <p style="margin-bottom: 8px; color: #666666;">This receipt acknowledges the payment made by the tenant through any available payment method for the provided services.</p>
          <p style="margin-bottom: 8px; color: #666666;">In case of failed or incomplete payments, for any reason, this receipt will become null and void.</p>
          <p style="margin-bottom: 8px; color: #666666;">No claims for refunds or discounts will be entertained based on this receipt under any circumstances.</p>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer" style="text-align: center; padding: 15px; border-top: 1px solid #e8e8e8; margin-top: auto; background-color: #FFFFFF;">
      <span class="footer-text" style="font-size: 11px; color: #999999;">© ${currentYear} PGMS. All Rights Reserved.</span>
    </div>
  </div>
</body>
</html>
  `;
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN EXPORT FUNCTIONS
───────────────────────────────────────────────────────────────────────────── */

/**
 * Generate and share/download a payment receipt PDF
 */
export const generatePaymentReceipt = async (
  data: PaymentReceiptData,
  options: ReceiptGeneratorOptions = {}
): Promise<{ success: boolean; filePath?: string; error?: string }> => {
  const {
    fileName = "Payment_Receipt",
    shareAfterGenerate = true,
    customLogoBase64,
  } = options;

  try {
    // Load logo
    const logoBase64 = customLogoBase64 || (await loadLogoBase64());

    // Generate HTML
    const html = generateReceiptHTML(data, logoBase64);

    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Rename file if on supported platform
    let finalUri = uri;
    if (Platform.OS !== "web") {
      const pdfName = `${fileName}.pdf`;
      const directory = FileSystem.documentDirectory;
      if (directory) {
        finalUri = `${directory}${pdfName}`;
        await FileSystem.moveAsync({
          from: uri,
          to: finalUri,
        });
      }
    }

    // Share the PDF
    if (shareAfterGenerate) {
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(finalUri, {
          mimeType: "application/pdf",
          dialogTitle: "Save or Share Receipt",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert(
          "Sharing Unavailable",
          "Sharing is not available on this device. The receipt has been saved.",
          [{ text: "OK" }]
        );
      }
    }

    return { success: true, filePath: finalUri };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to generate receipt";
    return { success: false, error: errorMessage };
  }
};

/**
 * Generate receipt data from a collection payment object
 * This is a convenience function to transform API data to receipt format
 */
export const createReceiptDataFromCollection = (
  collection: {
    tenantDetails?: {
      name?: string;
      roomNumber?: string;
      phoneNumber?: string;
      sharingType?: number;
    };
    paymentDate?: string;
    dueDate?: string;
    paymentCategory?: string;
    amount?: number;
    totalAmount?: number;
    paymentMode?: string;
  },
  propertyName?: string,
  propertyAddress?: string
): PaymentReceiptData => {
  const tenantName = collection.tenantDetails?.name || "N/A";
  const roomNumber = collection.tenantDetails?.roomNumber || "N/A";
  const mobileNumber = collection.tenantDetails?.phoneNumber || "N/A";
  const sharingType = collection.tenantDetails?.sharingType;
  const paymentDate = collection.paymentDate;
  const dueDate = collection.dueDate;
  const category = collection.paymentCategory || "Payment";
  const amountPaid = collection.amount || 0;
  const totalAmount = collection.totalAmount || amountPaid;
  const paymentMode = collection.paymentMode || "Cash";

  // Get month name from due date for the description
  const monthName = dueDate ? getMonthName(dueDate) : "";
  const description = monthName
    ? `${monthName} ${capitalize(category)}`
    : capitalize(category);

  return {
    date: paymentDate,
    tenantName,
    roomNumber,
    mobileNumber,
    sharingType,
    paymentItems: [
      {
        description,
        amount: amountPaid,
      },
    ],
    grandTotal: amountPaid,
    totalAmount,
    amountPaid,
    paymentMode,
    propertyName,
    propertyAddress,
  };
};

/**
 * Preview receipt in print dialog (useful for debugging or direct printing)
 */
export const previewReceipt = async (
  data: PaymentReceiptData
): Promise<void> => {
  try {
    const logoBase64 = await loadLogoBase64();
    const html = generateReceiptHTML(data, logoBase64);
    await Print.printAsync({ html });
  } catch (error) {
    Alert.alert("Error", "Failed to preview receipt. Please try again.");
  }
};

export default {
  generatePaymentReceipt,
  createReceiptDataFromCollection,
  previewReceipt,
};

