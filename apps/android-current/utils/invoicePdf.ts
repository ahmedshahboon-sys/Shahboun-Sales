import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import type { Sale, Customer, StoreProfile } from '@/context/AppContext';

const money = (v: number) => `${v.toFixed(2)} د.ل`;

function buildQrSvg(text: string): string {
  // Simple text-based QR placeholder (real QR needs native lib; we embed invoice number as styled badge)
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
    <rect width="80" height="80" fill="#1a1a2e" rx="6"/>
    <text x="40" y="30" font-family="monospace" font-size="8" fill="#ffffff" text-anchor="middle">QR</text>
    <text x="40" y="46" font-family="monospace" font-size="7" fill="#a0aec0" text-anchor="middle">${escaped.slice(0, 12)}</text>
    <text x="40" y="60" font-family="monospace" font-size="6" fill="#718096" text-anchor="middle">${escaped.slice(12, 24)}</text>
  </svg>`;
}

export function buildInvoiceHtml(
  sale: Sale,
  store: StoreProfile,
  customer: Customer | undefined
): string {
  const businessName = store.storeName || 'فاتورة مبيعات';
  const contactLine = [store.phone, store.whatsapp && store.whatsapp !== store.phone ? `واتساب: ${store.whatsapp}` : '', [store.city, store.address].filter(Boolean).join(' - ')].filter(Boolean).join(' · ');
  const logoImg = store.logoUri ? `<img src="${store.logoUri}" style="width:52px;height:52px;border-radius:10px;object-fit:cover;margin-left:10px;" />` : '';
  const dateFormatted = new Intl.DateTimeFormat('ar', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(sale.createdAt));

  const qrSvg = buildQrSvg(`${sale.invoiceNumber}|${sale.total}|${sale.createdAt}`);
  const qrDataUri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrSvg)}`;

  const itemRows = sale.items
    .map(
      (item, i) => `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="td-name">${item.name}</td>
        <td class="td-center">${item.quantity}</td>
        <td class="td-right">${money(item.unitPrice)}</td>
        <td class="td-right bold">${money(item.total)}</td>
      </tr>`
    )
    .join('');

  const remaining = sale.total - sale.paid;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background: #f8f9fa;
    color: #1a1a2e;
    font-size: 13px;
    direction: rtl;
  }
  .page {
    max-width: 794px;
    margin: 0 auto;
    background: #ffffff;
    min-height: 100vh;
    padding: 0;
  }
  /* Header */
  .header {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    color: #ffffff;
    padding: 28px 36px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-brand h1 {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: -0.3px;
    margin-bottom: 4px;
  }
  .header-brand p {
    font-size: 12px;
    color: #a0aec0;
  }
  .header-invoice {
    text-align: left;
  }
  .invoice-number {
    font-size: 24px;
    font-weight: 800;
    color: #e2b96f;
    letter-spacing: 1px;
  }
  .invoice-label {
    font-size: 11px;
    color: #a0aec0;
    margin-bottom: 3px;
  }
  /* Meta bar */
  .meta-bar {
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    padding: 14px 36px;
    display: flex;
    gap: 32px;
    flex-wrap: wrap;
  }
  .meta-item label {
    display: block;
    font-size: 10px;
    color: #718096;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 2px;
  }
  .meta-item span {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a2e;
  }
  /* Body */
  .body {
    padding: 24px 36px;
  }
  /* Items table */
  .items-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 13px;
  }
  .items-table thead tr {
    background: #1a1a2e;
    color: #ffffff;
  }
  .items-table thead th {
    padding: 10px 12px;
    font-weight: 600;
    font-size: 12px;
    letter-spacing: 0.3px;
  }
  .th-name { text-align: right; }
  .th-center { text-align: center; }
  .th-right { text-align: left; }
  .row-even { background: #ffffff; }
  .row-odd  { background: #f8fafc; }
  .td-name   { padding: 9px 12px; text-align: right; }
  .td-center { padding: 9px 12px; text-align: center; color: #4a5568; }
  .td-right  { padding: 9px 12px; text-align: left; color: #4a5568; }
  .bold { font-weight: 700; color: #1a1a2e !important; }
  .items-table tbody tr { border-bottom: 1px solid #e2e8f0; }
  /* Totals */
  .totals-section {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 20px;
    margin-top: 8px;
  }
  .qr-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .qr-block img { width: 80px; height: 80px; border-radius: 6px; }
  .qr-label { font-size: 10px; color: #718096; }
  .totals-box {
    flex: 1;
    max-width: 300px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    overflow: hidden;
    margin-right: auto;
  }
  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 14px;
    font-size: 13px;
    border-bottom: 1px solid #f1f5f9;
  }
  .totals-row:last-child { border-bottom: none; }
  .totals-row .t-label { color: #718096; }
  .totals-row .t-value { font-weight: 600; }
  .totals-grand {
    background: #1a1a2e;
    color: #ffffff;
  }
  .totals-grand .t-label { color: #a0aec0 !important; }
  .totals-grand .t-value { color: #e2b96f !important; font-size: 15px; font-weight: 800; }
  .totals-paid .t-value { color: #38a169; }
  .totals-remaining .t-value { color: #e53e3e; }
  /* Payment badge */
  .payment-badge {
    display: inline-block;
    background: #ebf8ff;
    color: #2b6cb0;
    border: 1px solid #bee3f8;
    border-radius: 20px;
    padding: 3px 12px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 2px;
  }
  /* Footer */
  .footer {
    border-top: 1px solid #e2e8f0;
    padding: 16px 36px;
    text-align: center;
    color: #a0aec0;
    font-size: 11px;
    background: #f8f9fa;
  }
  .footer strong { color: #718096; }
  @media print {
    body { background: white; }
    .page { box-shadow: none; }
  }
</style>
</head>
<body>
<div class="page">
  <!-- Header -->
  <div class="header">
    <div class="header-brand" style="display:flex;align-items:center;">
      ${logoImg}
      <div>
        <h1>${businessName}</h1>
        <p>${contactLine || store.activityType || 'نظام إدارة المبيعات والمخزون'}</p>
      </div>
    </div>
    <div class="header-invoice">
      <div class="invoice-label">رقم الفاتورة</div>
      <div class="invoice-number">${sale.invoiceNumber}</div>
    </div>
  </div>

  <!-- Meta bar -->
  <div class="meta-bar">
    <div class="meta-item">
      <label>التاريخ والوقت</label>
      <span>${dateFormatted}</span>
    </div>
    <div class="meta-item">
      <label>طريقة الدفع</label>
      <span><span class="payment-badge">${sale.paymentMethod}</span></span>
    </div>
    ${customer ? `
    <div class="meta-item">
      <label>العميل</label>
      <span>${customer.name}</span>
    </div>
    ${customer.phone ? `
    <div class="meta-item">
      <label>الهاتف</label>
      <span>${customer.phone}</span>
    </div>` : ''}
    ${customer.address ? `
    <div class="meta-item">
      <label>العنوان</label>
      <span>${customer.address}</span>
    </div>` : ''}
    ` : ''}
    <div class="meta-item">
      <label>الكاشير</label>
      <span>${sale.user}</span>
    </div>
  </div>

  <!-- Body -->
  <div class="body">
    <!-- Items table -->
    <table class="items-table">
      <thead>
        <tr>
          <th class="th-name">الصنف</th>
          <th class="th-center">الكمية</th>
          <th class="th-right">السعر</th>
          <th class="th-right">الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <!-- Totals + QR -->
    <div class="totals-section">
      <div class="qr-block">
        <img src="${qrDataUri}" alt="QR Code"/>
        <span class="qr-label">${sale.invoiceNumber}</span>
      </div>
      <div class="totals-box">
        <div class="totals-row">
          <span class="t-label">المجموع الجزئي</span>
          <span class="t-value">${money(sale.subtotal)}</span>
        </div>
        ${sale.discount > 0 ? `
        <div class="totals-row">
          <span class="t-label">الخصم</span>
          <span class="t-value" style="color:#e53e3e">- ${money(sale.discount)}</span>
        </div>` : ''}
        <div class="totals-row totals-grand">
          <span class="t-label">الإجمالي</span>
          <span class="t-value">${money(sale.total)}</span>
        </div>
        <div class="totals-row totals-paid">
          <span class="t-label">المدفوع</span>
          <span class="t-value">${money(sale.paid)}</span>
        </div>
        ${remaining > 0.005 ? `
        <div class="totals-row totals-remaining">
          <span class="t-label">المتبقي (دين)</span>
          <span class="t-value">${money(remaining)}</span>
        </div>` : `
        <div class="totals-row">
          <span class="t-label">الحالة</span>
          <span class="t-value" style="color:#38a169">✓ مدفوعة بالكامل</span>
        </div>`}
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <strong>${businessName}</strong> — وثيقة محاسبية رسمية · شكرًا لثقتكم
  </div>
</div>
</body>
</html>`;
}

export async function printInvoice(
  sale: Sale,
  store: StoreProfile,
  customer: Customer | undefined
): Promise<void> {
  try {
    const html = buildInvoiceHtml(sale, store, customer);
    if (Platform.OS === 'web') {
      // On web, open print dialog via a blob URL
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => {
          win.print();
          URL.revokeObjectURL(url);
        };
      }
      return;
    }
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `فاتورة ${sale.invoiceNumber}`,
        UTI: 'com.adobe.pdf',
      });
    } else {
      await Print.printAsync({ uri });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    Alert.alert('خطأ', `تعذّر توليد الفاتورة: ${message}`);
  }
}
