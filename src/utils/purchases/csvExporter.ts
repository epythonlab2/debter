import { formatNumber } from '../formatters';

interface GroupedReceiptExport {
  id: string;
  purchase_date: string;
  vendor_name: string;
  invoice_ref?: string | null;
  subtotal: number;
  vat_amount: number;
  withholding_amount: number;
  total_amount: number;
  items: Array<{ item_name: string }>;
}

/**
 * Escapes characters and prevents Formula Injection (=, +, -, @) in CSV files
 */
export const sanitizeForCSV = (value: string | number | null | undefined): string => {
  if (value == null) return '""';
  let str = String(value).replace(/"/g, '""');
  
  // Prevent CSV Formula Injection
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str}"`;
};

export const exportPurchasesToCSV = (
  receipts: GroupedReceiptExport[],
  t: Record<string, any>
): void => {
  if (!receipts || receipts.length === 0) return;

  const headers = [
    t.receiptId || "Receipt ID",
    t.date || "Date",
    t.vendor || "Vendor",
    t.itemName || "Items",
    t.invoiceRef || "Invoice Ref",
    t.itemsCount || "Items Count",
    `${t.subtotal || "Subtotal"} (${t.currency || "ETB"})`,
    `${t.vat15 || "VAT 15%"} (${t.currency || "ETB"})`,
    `${t.withholding3 || "Withholding 3%"} (${t.currency || "ETB"})`,
    `${t.totalSpendLabel || "Total Spend"} (${t.currency || "ETB"})`,
  ];

  const rows = receipts.map((r) => [
    sanitizeForCSV(r.id),
    sanitizeForCSV(r.purchase_date),
    sanitizeForCSV(r.vendor_name),
    sanitizeForCSV(r.items ? r.items.map((i) => i.item_name).join('; ') : ''),
    sanitizeForCSV(r.invoice_ref || 'N/A'),
    sanitizeForCSV(r.items ? r.items.length : 0),
    sanitizeForCSV(formatNumber(r.subtotal)),
    sanitizeForCSV(formatNumber(r.vat_amount)),
    sanitizeForCSV(formatNumber(r.withholding_amount)),
    sanitizeForCSV(formatNumber(r.total_amount))
  ]);

  // Build CSV content
  const csvString = [headers.map(h => sanitizeForCSV(h)).join(","), ...rows.map(row => row.join(","))].join("\r\n");

  // Add UTF-8 BOM (\uFEFF) so Excel opens Ethiopian characters and formatting seamlessly
  const blob = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Purchases_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  
  // Clean up DOM and Memory
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};