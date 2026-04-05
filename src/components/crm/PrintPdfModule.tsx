'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
  FileText,
  Users,
  ShoppingBag,
  Package,
  Search,
  Calendar,
  IndianRupee,
  AlertCircle,
  CheckCircle,
  X,
  Smartphone,
  Store,
} from 'lucide-react';

/* ──────────────────────────── Helpers ──────────────────────────── */
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

/* ──────────────────────────── Types ──────────────────────────── */
interface ShopInfo {
  name: string;
  gstNo: string;
  address: string;
  phone: string;
}

interface InvoicePrintData {
  invoice: {
    invoiceNo: string;
    date: string;
    totalAmount: number;
    paidAmount: number;
    pendingAmount: number;
    gstAmount: number;
    subTotal: number;
    cgst: number;
    sgst: number;
    warrantyMonths: number;
  };
  phone: {
    brand: string;
    model: string;
    ram: string;
    storage: string;
    color: string;
    imeiNo: string;
    condition: string;
  };
  buyer: {
    name: string;
    phone: string;
    address: string;
  } | null;
  shop: ShopInfo | null;
}

interface CustomerPrintData {
  customers: Array<{
    name: string;
    phone: string;
    address: string;
    aadharNo: string;
    type: string;
    createdAt: string;
  }>;
  totalCustomers: number;
  generatedAt: string;
  shop: ShopInfo | null;
}

interface BuySellPrintData {
  buys: Array<{
    date: string;
    brand: string;
    model: string;
    imeiNo: string;
    condition: string;
    buyPrice: number;
    repairCost: number;
    seller: string;
  }>;
  sells: Array<{
    date: string;
    brand: string;
    model: string;
    buyer: string;
    salePrice: number;
    paymentStatus: string;
  }>;
  summary: {
    totalBuyCount: number;
    totalBuyAmount: number;
    totalRepairCosts: number;
    totalSellCount: number;
    totalSellAmount: number;
    grossProfit: number;
    netProfit: number;
  };
  from: string;
  to: string;
  generatedAt: string;
  shop: ShopInfo | null;
}

interface StockPrintData {
  stock: Array<{
    date: string;
    brand: string;
    model: string;
    imeiNo: string;
    condition: string;
    status: string;
    buyPrice: number;
    repairCost: number;
    seller: string;
    daysInStock: number;
  }>;
  totalItems: number;
  totalInvested: number;
  totalRepairPending: number;
  generatedAt: string;
  shop: ShopInfo | null;
}

/* ──────────────────────────── Animation ──────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.04, duration: 0.35, ease: 'easeOut' },
  }),
};

/* ──────────────────────────── Print Button Card ──────────────────────────── */
function PrintOptionCard({
  icon: Icon,
  title,
  description,
  onClick,
  active,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  active: boolean;
  index: number;
}) {
  return (
    <motion.button
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      onClick={onClick}
      className={`crm-card text-left w-full transition-all duration-200 ${
        active
          ? 'ring-2 ring-primary shadow-lg shadow-primary/10'
          : 'hover:shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
          active ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'
        }`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <Printer size={16} className={`flex-shrink-0 mt-1 transition-colors ${active ? 'text-primary' : 'text-muted-foreground/40'}`} />
      </div>
    </motion.button>
  );
}

/* ──────────────────────────── Print Invoice Section ──────────────────────────── */
function PrintInvoiceSection() {
  const [invoiceNo, setInvoiceNo] = useState('');
  const [data, setData] = useState<InvoicePrintData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  const searchInvoice = useCallback(async () => {
    if (!invoiceNo.trim()) { setError('Please enter an invoice number'); return; }
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/crm/print?type=invoice&invoiceNo=${encodeURIComponent(invoiceNo.trim())}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Invoice not found');
      }
      setData(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to find invoice');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [invoiceNo]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Invoice ${data?.invoice.invoiceNo}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #111; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #FF5F00; padding-bottom: 20px; margin-bottom: 24px; }
        .shop-name { font-size: 24px; font-weight: 700; color: #00092C; }
        .shop-details { font-size: 12px; color: #555; margin-top: 4px; }
        .invoice-title { text-align: right; }
        .invoice-title h2 { font-size: 20px; font-weight: 600; color: #FF5F00; }
        .invoice-title p { font-size: 12px; color: #555; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
        .info-box { background: #f8f9fa; padding: 14px 16px; border-radius: 8px; }
        .info-box h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 6px; }
        .info-box p { font-size: 14px; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #00092C; color: white; padding: 10px 14px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
        td { padding: 10px 14px; border-bottom: 1px solid #eee; font-size: 13px; }
        .totals { display: flex; justify-content: flex-end; }
        .totals-table { width: 280px; }
        .totals-table td { padding: 8px 12px; font-size: 13px; }
        .totals-table .grand td { border-top: 2px solid #000; font-size: 16px; font-weight: 700; }
        .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 16px; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="crm-card">
        <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          <Search size={16} className="text-primary" /> Search Invoice
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            className="crm-input flex-1"
            placeholder="e.g., INV-20250101-0001"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchInvoice()}
          />
          <button onClick={searchInvoice} disabled={loading} className="crm-btn-primary whitespace-nowrap">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />}
            Search
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-destructive text-sm">
            <AlertCircle size={14} />
            {error}
          </div>
        )}
      </div>

      {/* Invoice Preview */}
      {data && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          <div className="flex justify-end mb-3 no-print">
            <button onClick={handlePrint} className="crm-btn-primary">
              <Printer size={16} /> Print Invoice
            </button>
          </div>
          <div className="crm-card p-6 bg-white text-gray-900 max-w-3xl mx-auto" ref={printRef}>
            {/* Shop Header */}
            <div className="header">
              <div>
                <div className="shop-name">{data.shop?.name || 'Phone Shop'}</div>
                {data.shop?.address && <div className="shop-details">{data.shop.address}</div>}
                {data.shop?.phone && <div className="shop-details">Phone: {data.shop.phone}</div>}
                {data.shop?.gstNo && <div className="shop-details">GSTIN: {data.shop.gstNo}</div>}
              </div>
              <div className="invoice-title">
                <h2>INVOICE</h2>
                <p>{data.invoice.invoiceNo}</p>
                <p>{data.invoice.date}</p>
              </div>
            </div>

            {/* Customer Info */}
            <div className="info-grid">
              <div className="info-box">
                <h4>Bill To</h4>
                <p className="font-semibold">{data.buyer?.name || 'Customer'}</p>
                {data.buyer?.phone && <p>{data.buyer.phone}</p>}
                {data.buyer?.address && <p>{data.buyer.address}</p>}
              </div>
              <div className="info-box">
                <h4>Warranty</h4>
                <p>{data.invoice.warrantyMonths > 0 ? `${data.invoice.warrantyMonths} months` : 'No warranty'}</p>
              </div>
            </div>

            {/* Item Table */}
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Brand</th>
                  <th>Model</th>
                  <th>IMEI</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Used Mobile Phone</td>
                  <td>{data.phone.brand}</td>
                  <td>{data.phone.model}</td>
                  <td className="font-mono text-xs">{data.phone.imeiNo || 'N/A'}</td>
                  <td className="text-right font-semibold">{formatINR(data.invoice.subTotal)}</td>
                </tr>
                {data.phone.ram && (
                  <tr>
                    <td colSpan={4} className="text-gray-500 text-xs">Specs: {data.phone.ram} RAM, {data.phone.storage} Storage, {data.phone.color} Color, {data.phone.condition} Condition</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>

            {/* Totals */}
            <div className="totals">
              <table className="totals-table">
                <tbody>
                  <tr><td>Sub Total</td><td className="text-right">{formatINR(data.invoice.subTotal)}</td></tr>
                  <tr><td>CGST (9%)</td><td className="text-right">{formatINR(data.invoice.cgst)}</td></tr>
                  <tr><td>SGST (9%)</td><td className="text-right">{formatINR(data.invoice.sgst)}</td></tr>
                  <tr className="grand"><td>Total</td><td className="text-right">{formatINR(data.invoice.totalAmount)}</td></tr>
                  <tr><td>Paid</td><td className="text-right text-green-600 font-semibold">{formatINR(data.invoice.paidAmount)}</td></tr>
                  <tr><td>Balance</td><td className="text-right text-red-600 font-semibold">{formatINR(data.invoice.pendingAmount)}</td></tr>
                </tbody>
              </table>
            </div>

            <div className="footer">
              <p>Thank you for your purchase! | Generated by PhoneCRM</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ──────────────────────────── Print Customer List ──────────────────────────── */
function PrintCustomerListSection() {
  const [data, setData] = useState<CustomerPrintData | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/print?type=customers');
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Customer List</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; }
        .header { border-bottom: 3px solid #FF5F00; padding-bottom: 16px; margin-bottom: 24px; }
        .shop-name { font-size: 22px; font-weight: 700; color: #00092C; }
        .shop-details { font-size: 12px; color: #555; margin-top: 4px; }
        h2 { font-size: 16px; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #00092C; color: white; padding: 8px 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; text-align: left; }
        td { padding: 8px 12px; border-bottom: 1px solid #eee; font-size: 12px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (loading) {
    return <div className="crm-card animate-pulse h-64" />;
  }

  if (!data) {
    return (
      <div className="crm-card text-center py-8">
        <Users size={36} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Load customer list to print</p>
        <button onClick={fetchData} className="crm-btn-primary">
          <Users size={16} /> Load All Customers
        </button>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="space-y-4">
      <div className="flex justify-between items-center no-print">
        <p className="text-sm text-muted-foreground">{data.totalCustomers} customers loaded</p>
        <button onClick={handlePrint} className="crm-btn-primary">
          <Printer size={16} /> Print Customer List
        </button>
      </div>
      <div className="crm-card p-6 bg-white text-gray-900" ref={printRef}>
        <div className="header">
          <div className="shop-name">{data.shop?.name || 'Phone Shop'}</div>
          {data.shop?.address && <div className="shop-details">{data.shop.address}</div>}
          {data.shop?.phone && <div className="shop-details">Phone: {data.shop.phone}</div>}
          {data.shop?.gstNo && <div className="shop-details">GSTIN: {data.shop.gstNo}</div>}
        </div>
        <h2>Complete Customer List</h2>
        <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Generated: {new Date(data.generatedAt).toLocaleString('en-IN')} | Total: {data.totalCustomers} customers</p>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Address</th>
              <th>Aadhar</th>
              <th>Type</th>
              <th>Added</th>
            </tr>
          </thead>
          <tbody>
            {data.customers.map((c, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td className="font-semibold">{c.name}</td>
                <td>{c.phone || '-'}</td>
                <td>{c.address || '-'}</td>
                <td className="font-mono">{c.aadharNo || '-'}</td>
                <td><span style={{
                  padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                  background: c.type === 'buyer' ? '#dcfce7' : c.type === 'seller' ? '#fef3c7' : '#e0e7ff',
                  color: c.type === 'buyer' ? '#166534' : c.type === 'seller' ? '#92400e' : '#3730a3',
                }}>{c.type}</span></td>
                <td>{c.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="footer">
          <p>PhoneCRM - Customer Directory | Printed on {new Date().toLocaleDateString('en-IN')}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────── Print Buy/Sell Report ──────────────────────────── */
function PrintBuySellSection() {
  const [from, setFrom] = useState(formatDateForInput(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  const [to, setTo] = useState(formatDateForInput(new Date()));
  const [data, setData] = useState<BuySellPrintData | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/print?type=buysell&from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Buy/Sell Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; }
        .header { border-bottom: 3px solid #FF5F00; padding-bottom: 16px; margin-bottom: 20px; }
        .shop-name { font-size: 22px; font-weight: 700; color: #00092C; }
        .shop-details { font-size: 12px; color: #555; margin-top: 4px; }
        h2 { font-size: 16px; margin-bottom: 12px; margin-top: 24px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 20px; }
        .summary-box { background: #f8f9fa; padding: 12px; border-radius: 8px; text-align: center; }
        .summary-box .value { font-size: 18px; font-weight: 700; }
        .summary-box .label { font-size: 10px; color: #888; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #00092C; color: white; padding: 8px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
        .profit { color: #16a34a; font-weight: 700; }
        .loss { color: #dc2626; font-weight: 700; }
        .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (loading) {
    return <div className="crm-card animate-pulse h-64" />;
  }

  return (
    <div className="space-y-5">
      <div className="crm-card">
        <h3 className="font-semibold text-foreground text-sm mb-3 flex items-center gap-2">
          <Calendar size={16} className="text-primary" /> Select Date Range
        </h3>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="crm-label">From Date</label>
            <input type="date" className="crm-input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="crm-label">To Date</label>
            <input type="date" className="crm-input" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button onClick={fetchReport} className="crm-btn-primary whitespace-nowrap">
            <Search size={16} /> Generate Report
          </button>
        </div>
      </div>

      {data && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="space-y-4">
          <div className="flex justify-end no-print">
            <button onClick={handlePrint} className="crm-btn-primary">
              <Printer size={16} /> Print Report
            </button>
          </div>
          <div className="crm-card p-6 bg-white text-gray-900" ref={printRef}>
            <div className="header">
              <div className="shop-name">{data.shop?.name || 'Phone Shop'}</div>
              {data.shop?.address && <div className="shop-details">{data.shop.address}</div>}
              {data.shop?.phone && <div className="shop-details">Phone: {data.shop.phone}</div>}
              {data.shop?.gstNo && <div className="shop-details">GSTIN: {data.shop.gstNo}</div>}
            </div>

            <h2>Buy / Sell Report: {data.from} to {data.to}</h2>

            <div className="summary">
              <div className="summary-box"><div className="value">{data.summary.totalBuyCount}</div><div className="label">Phones Bought</div></div>
              <div className="summary-box"><div className="value">{formatINR(data.summary.totalBuyAmount)}</div><div className="label">Total Buy</div></div>
              <div className="summary-box"><div className="value">{data.summary.totalSellCount}</div><div className="label">Phones Sold</div></div>
              <div className="summary-box"><div className="value">{formatINR(data.summary.totalSellAmount)}</div><div className="label">Total Sell</div></div>
              <div className="summary-box"><div className="value">{formatINR(data.summary.totalRepairCosts)}</div><div className="label">Repairs</div></div>
              <div className="summary-box"><div className={`value ${data.summary.netProfit >= 0 ? 'profit' : 'loss'}`}>{formatINR(data.summary.netProfit)}</div><div className="label">Net Profit</div></div>
            </div>

            <h2>Purchase Details</h2>
            <table>
              <thead>
                <tr><th>Date</th><th>Brand</th><th>Model</th><th>IMEI</th><th>Condition</th><th>Price</th><th>Repair</th><th>Seller</th></tr>
              </thead>
              <tbody>
                {data.buys.map((b, i) => (
                  <tr key={i}>
                    <td>{b.date}</td>
                    <td className="font-semibold">{b.brand}</td>
                    <td>{b.model}</td>
                    <td className="font-mono text-xs">{b.imeiNo}</td>
                    <td>{b.condition}</td>
                    <td>{formatINR(b.buyPrice)}</td>
                    <td>{formatINR(b.repairCost)}</td>
                    <td>{b.seller}</td>
                  </tr>
                ))}
                {data.buys.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', color: '#999' }}>No purchases in this period</td></tr>}
              </tbody>
            </table>

            <h2>Sale Details</h2>
            <table>
              <thead>
                <tr><th>Date</th><th>Brand</th><th>Model</th><th>Buyer</th><th>Price</th><th>Payment</th></tr>
              </thead>
              <tbody>
                {data.sells.map((s, i) => (
                  <tr key={i}>
                    <td>{s.date}</td>
                    <td className="font-semibold">{s.brand}</td>
                    <td>{s.model}</td>
                    <td>{s.buyer}</td>
                    <td>{formatINR(s.salePrice)}</td>
                    <td><span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: 10, fontWeight: 600,
                      background: s.paymentStatus === 'full' ? '#dcfce7' : s.paymentStatus === 'partial' ? '#fef3c7' : '#fee2e2',
                      color: s.paymentStatus === 'full' ? '#166534' : s.paymentStatus === 'partial' ? '#92400e' : '#991b1b',
                    }}>{s.paymentStatus}</span></td>
                  </tr>
                ))}
                {data.sells.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#999' }}>No sales in this period</td></tr>}
              </tbody>
            </table>

            <div className="footer">
              <p>PhoneCRM - Buy/Sell Report | Period: {data.from} to {data.to}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ──────────────────────────── Print Stock Report ──────────────────────────── */
function PrintStockSection() {
  const [data, setData] = useState<StockPrintData | null>(null);
  const [loading, setLoading] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/crm/print?type=stock');
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePrint = () => {
    if (!printRef.current) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Stock Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #111; }
        .header { border-bottom: 3px solid #FF5F00; padding-bottom: 16px; margin-bottom: 20px; }
        .shop-name { font-size: 22px; font-weight: 700; color: #00092C; }
        .shop-details { font-size: 12px; color: #555; margin-top: 4px; }
        h2 { font-size: 16px; margin-bottom: 12px; }
        .summary { display: flex; gap: 16px; margin-bottom: 20px; }
        .summary-box { background: #f8f9fa; padding: 12px 20px; border-radius: 8px; }
        .summary-box .value { font-size: 18px; font-weight: 700; }
        .summary-box .label { font-size: 10px; color: #888; text-transform: uppercase; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #00092C; color: white; padding: 8px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }
        td { padding: 7px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
        .stale { color: #dc2626; font-weight: 600; }
        .footer { margin-top: 32px; text-align: center; font-size: 10px; color: #999; }
        @media print { body { padding: 20px; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  if (loading) {
    return <div className="crm-card animate-pulse h-64" />;
  }

  if (!data) {
    return (
      <div className="crm-card text-center py-8">
        <Package size={36} className="mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground mb-4">Load stock data to print</p>
        <button onClick={fetchData} className="crm-btn-primary">
          <Package size={16} /> Load Stock Report
        </button>
      </div>
    );
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="space-y-4">
      <div className="flex justify-between items-center no-print">
        <p className="text-sm text-muted-foreground">{data.totalItems} items in stock</p>
        <button onClick={handlePrint} className="crm-btn-primary">
          <Printer size={16} /> Print Stock Report
        </button>
      </div>
      <div className="crm-card p-6 bg-white text-gray-900" ref={printRef}>
        <div className="header">
          <div className="shop-name">{data.shop?.name || 'Phone Shop'}</div>
          {data.shop?.address && <div className="shop-details">{data.shop.address}</div>}
          {data.shop?.phone && <div className="shop-details">Phone: {data.shop.phone}</div>}
          {data.shop?.gstNo && <div className="shop-details">GSTIN: {data.shop.gstNo}</div>}
        </div>

        <h2>Current Stock Report</h2>
        <p style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>Generated: {new Date(data.generatedAt).toLocaleString('en-IN')}</p>

        <div className="summary">
          <div className="summary-box">
            <div className="value">{data.totalItems}</div>
            <div className="label">Total Items</div>
          </div>
          <div className="summary-box">
            <div className="value">{formatINR(data.totalInvested)}</div>
            <div className="label">Total Invested</div>
          </div>
          <div className="summary-box">
            <div className="value">{formatINR(data.totalRepairPending)}</div>
            <div className="label">Repair Costs</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Brand</th>
              <th>Model</th>
              <th>IMEI</th>
              <th>Condition</th>
              <th>Status</th>
              <th>Buy Price</th>
              <th>Repair</th>
              <th>Seller</th>
              <th>Days</th>
            </tr>
          </thead>
          <tbody>
            {data.stock.map((item, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{item.date}</td>
                <td className="font-semibold">{item.brand}</td>
                <td>{item.model}</td>
                <td className="font-mono text-xs">{item.imeiNo}</td>
                <td>{item.condition}</td>
                <td>{item.status}</td>
                <td>{formatINR(item.buyPrice)}</td>
                <td>{formatINR(item.repairCost)}</td>
                <td>{item.seller}</td>
                <td className={item.daysInStock > 60 ? 'stale' : ''}>{item.daysInStock}</td>
              </tr>
            ))}
            {data.stock.length === 0 && (
              <tr><td colSpan={11} style={{ textAlign: 'center', color: '#999' }}>No unsold items in stock</td></tr>
            )}
          </tbody>
        </table>

        <div className="footer">
          <p>PhoneCRM - Stock Report | Items older than 60 days highlighted in red</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────── Print Options ──────────────────────────── */
const printOptions = [
  { key: 'invoice', label: 'Print Invoice', description: 'Search by invoice number and print a professional invoice with shop letterhead, GST breakdown, and payment details', icon: FileText },
  { key: 'customers', label: 'Print Customer List', description: 'Generate a printable directory of all customers with contact details, Aadhar numbers, and types', icon: Users },
  { key: 'buysell', label: 'Print Buy/Sell Report', description: 'Date-range filtered report showing all purchases, sales, repair costs, and net profit/loss', icon: ShoppingBag },
  { key: 'stock', label: 'Print Stock Report', description: 'Current unsold inventory with brand, model, IMEI, condition, buy price, and days in stock', icon: Package },
] as const;

type PrintKey = (typeof printOptions)[number]['key'];

/* ──────────────────────────── Main Component ──────────────────────────── */
export default function PrintPdfModule() {
  const [activeOption, setActiveOption] = useState<PrintKey | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Printer size={22} className="text-primary" />
          Print & PDF Export
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">Generate professional printable documents with shop letterhead</p>
      </div>

      {/* Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {printOptions.map((opt, i) => {
          const Icon = opt.icon;
          return (
            <PrintOptionCard
              key={opt.key}
              icon={Icon}
              title={opt.label}
              description={opt.description}
              active={activeOption === opt.key}
              onClick={() => setActiveOption(activeOption === opt.key ? null : opt.key)}
              index={i}
            />
          );
        })}
      </div>

      {/* Active Print Section */}
      <AnimatePresence mode="wait">
        {activeOption && (
          <motion.div
            key={activeOption}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setActiveOption(null)}
                className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
              >
                <X size={16} />
              </button>
              <h3 className="font-semibold text-foreground text-sm">
                {printOptions.find((o) => o.key === activeOption)?.label}
              </h3>
            </div>
            {activeOption === 'invoice' && <PrintInvoiceSection />}
            {activeOption === 'customers' && <PrintCustomerListSection />}
            {activeOption === 'buysell' && <PrintBuySellSection />}
            {activeOption === 'stock' && <PrintStockSection />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
