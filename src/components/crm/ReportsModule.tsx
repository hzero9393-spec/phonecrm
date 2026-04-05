'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Calendar,
  Download,
  Search,
  Users,
  Smartphone,
  Trophy,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Wrench,
  Clock,
} from 'lucide-react';

/* ──────────────────────────── Helpers ──────────────────────────── */
const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDateForInput = (date: Date) => date.toISOString().split('T')[0];

const getStartOfMonth = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
};

/* ──────────────────────────── Types ──────────────────────────── */
interface BuyReport {
  count: number;
  totalBuyAmount: number;
  totalRepairCost: number;
  from: string;
  to: string;
  items: Array<{
    id: string;
    date: string;
    brand: string;
    model: string;
    imeiNo: string;
    seller: string;
    buyPrice: number;
    condition: string;
    status: string;
    repairCost: number;
  }>;
}

interface SellReport {
  count: number;
  totalSellAmount: number;
  totalPaid: number;
  totalPending: number;
  from: string;
  to: string;
  sales: Array<{
    id: string;
    date: string;
    brand: string;
    model: string;
    buyer: string;
    salePrice: number;
    paidAmount: number;
    pendingAmount: number;
    paymentStatus: string;
    warrantyMonths: number;
  }>;
}

interface ProfitReport {
  totalSellAmount: number;
  totalBuyAmount: number;
  totalRepairCosts: number;
  grossProfit: number;
  netProfit: number;
  totalUnsoldItems: number;
  totalUnsoldBuyAmount: number;
  totalUnsoldRepairCosts: number;
  totalInvestment: number;
  profitMargin: number;
  totalSalesCount: number;
  from: string;
  to: string;
}

interface TopReport {
  topCustomers: Array<{ rank: number; name: string; phone: string; totalAmount: number; purchaseCount: number }>;
  topBrands: Array<{ rank: number; name: string; salesCount: number }>;
  topProfitPhones: Array<{
    rank: number;
    brand: string;
    model: string;
    buyPrice: number;
    sellPrice: number;
    repairCost: number;
    profit: number;
  }>;
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

/* ──────────────────────────── Date Range Picker ──────────────────────────── */
function DateRangePicker({
  from,
  to,
  setFrom,
  setTo,
  onApply,
  loading,
}: {
  from: string;
  to: string;
  setFrom: (v: string) => void;
  setTo: (v: string) => void;
  onApply: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex-1 min-w-[140px]">
        <label className="crm-label flex items-center gap-1.5">
          <Calendar size={13} /> From Date
        </label>
        <input type="date" className="crm-input" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="flex-1 min-w-[140px]">
        <label className="crm-label flex items-center gap-1.5">
          <Calendar size={13} /> To Date
        </label>
        <input type="date" className="crm-input" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <button onClick={onApply} disabled={loading} className="crm-btn-primary whitespace-nowrap">
        {loading ? (
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Search size={16} />
        )}
        Generate
      </button>
    </div>
  );
}

/* ──────────────────────────── Section 1: Buy Report ──────────────────────────── */
function BuyReportSection() {
  const [from, setFrom] = useState(formatDateForInput(getStartOfMonth()));
  const [to, setTo] = useState(formatDateForInput(new Date()));
  const [data, setData] = useState<BuyReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/reports?type=buy&from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  const conditionBadge = (c: string) => {
    const m: Record<string, string> = { good: 'badge-success', average: 'badge-warning', poor: 'badge-danger' };
    return `badge ${m[c] || 'badge-default'}`;
  };

  return (
    <div className="space-y-5">
      <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} onApply={fetchReport} loading={loading} />

      {loading && (
        <div className="crm-card animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4" />
          <div className="h-40 bg-muted rounded" />
        </div>
      )}

      {!loading && data && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
            <div className="crm-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShoppingBag size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Phones Bought</p>
                <p className="text-2xl font-bold text-foreground">{data.count}</p>
              </div>
            </div>
            <div className="crm-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <IndianRupee size={22} className="text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Buy Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatINR(data.totalBuyAmount)}</p>
              </div>
            </div>
            <div className="crm-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                <Wrench size={22} className="text-amber-500 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Repair Costs</p>
                <p className="text-2xl font-bold text-foreground">{formatINR(data.totalRepairCost)}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          {data.items.length === 0 ? (
            <div className="crm-card text-center py-12 text-muted-foreground">
              <Package size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No phones bought in this period</p>
            </div>
          ) : (
            <div className="crm-card p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="crm-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Date</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>IMEI</th>
                      <th>Seller</th>
                      <th>Buy Price</th>
                      <th>Condition</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id}>
                        <td className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock size={10} />
                          {item.date}
                        </td>
                        <td className="font-medium text-foreground">{item.brand}</td>
                        <td>{item.model}</td>
                        <td className="text-muted-foreground text-xs font-mono">{item.imeiNo}</td>
                        <td>{item.seller}</td>
                        <td className="font-semibold text-foreground">{formatINR(item.buyPrice)}</td>
                        <td><span className={conditionBadge(item.condition)}>{item.condition}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ──────────────────────────── Section 2: Sell Report ──────────────────────────── */
function SellReportSection() {
  const [from, setFrom] = useState(formatDateForInput(getStartOfMonth()));
  const [to, setTo] = useState(formatDateForInput(new Date()));
  const [data, setData] = useState<SellReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/reports?type=sell&from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  return (
    <div className="space-y-5">
      <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} onApply={fetchReport} loading={loading} />

      {loading && (
        <div className="crm-card animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4" />
          <div className="h-40 bg-muted rounded" />
        </div>
      )}

      {!loading && data && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-5">
            <div className="crm-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <TrendingUp size={22} className="text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Phones Sold</p>
                <p className="text-2xl font-bold text-foreground">{data.count}</p>
              </div>
            </div>
            <div className="crm-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                <IndianRupee size={22} className="text-emerald-500 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Sell Amount</p>
                <p className="text-2xl font-bold text-foreground">{formatINR(data.totalSellAmount)}</p>
              </div>
            </div>
            <div className="crm-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center flex-shrink-0">
                <ArrowUpRight size={22} className="text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Received</p>
                <p className="text-2xl font-bold text-foreground">{formatINR(data.totalPaid)}</p>
              </div>
            </div>
            <div className="crm-card flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <ArrowDownRight size={22} className="text-red-500 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Total Pending</p>
                <p className="text-2xl font-bold text-foreground">{formatINR(data.totalPending)}</p>
              </div>
            </div>
          </div>

          {/* Table */}
          {data.sales.length === 0 ? (
            <div className="crm-card text-center py-12 text-muted-foreground">
              <Receipt size={40} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No phones sold in this period</p>
            </div>
          ) : (
            <div className="crm-card p-0 overflow-hidden">
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="crm-table">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th>Date</th>
                      <th>Brand</th>
                      <th>Model</th>
                      <th>Buyer</th>
                      <th>Sale Price</th>
                      <th>Payment Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock size={10} />
                          {sale.date}
                        </td>
                        <td className="font-medium text-foreground">{sale.brand}</td>
                        <td>{sale.model}</td>
                        <td>{sale.buyer}</td>
                        <td className="font-semibold text-foreground">{formatINR(sale.salePrice)}</td>
                        <td>
                          <span className={`badge ${sale.paymentStatus === 'full' ? 'badge-success' : sale.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
                            {sale.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

/* ──────────────────────────── Section 3: Profit/Loss ──────────────────────────── */
function ProfitLossSection() {
  const [from, setFrom] = useState(formatDateForInput(getStartOfMonth()));
  const [to, setTo] = useState(formatDateForInput(new Date()));
  const [data, setData] = useState<ProfitReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/crm/reports?type=profit&from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Failed');
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  return (
    <div className="space-y-5">
      <DateRangePicker from={from} to={to} setFrom={setFrom} setTo={setTo} onApply={fetchReport} loading={loading} />

      {loading && (
        <div className="crm-card animate-pulse h-64" />
      )}

      {!loading && data && (
        <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="space-y-5">
          {/* Big Profit/Loss Number */}
          <div className={`rounded-2xl p-8 text-center relative overflow-hidden ${
            data.netProfit >= 0
              ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 dark:from-emerald-800 dark:to-emerald-700'
              : 'bg-gradient-to-br from-red-700 to-red-600 dark:from-red-900 dark:to-red-800'
          }`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-white/5 rounded-full translate-y-1/2" />
            <div className="relative">
              <p className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">
                Net {data.netProfit >= 0 ? 'Profit' : 'Loss'}
              </p>
              <p className="text-5xl font-bold text-white tracking-tight">
                {formatINR(Math.abs(data.netProfit))}
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {data.netProfit >= 0 ? (
                  <TrendingUp size={18} className="text-white/70" />
                ) : (
                  <TrendingDown size={18} className="text-white/70" />
                )}
                <p className="text-white/70 text-sm">
                  {data.netProfit >= 0 ? 'Great performance!' : 'Review your margins'}
                </p>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Sales Amount', value: formatINR(data.totalSellAmount), icon: IndianRupee, bg: 'bg-emerald-500/10', color: 'text-emerald-500 dark:text-emerald-400', sub: `${data.totalSalesCount} sales` },
              { label: 'Total Buy Cost', value: formatINR(data.totalBuyAmount), icon: ShoppingBag, bg: 'bg-primary/10', color: 'text-primary', sub: 'Cost of goods sold' },
              { label: 'Repair Costs', value: formatINR(data.totalRepairCosts), icon: Wrench, bg: 'bg-amber-500/10', color: 'text-amber-500 dark:text-amber-400', sub: 'Deducted from profit' },
              { label: 'Gross Profit', value: formatINR(data.grossProfit), icon: data.grossProfit >= 0 ? TrendingUp : TrendingDown, bg: data.grossProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10', color: data.grossProfit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400', sub: 'Before repairs' },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="crm-card">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center`}>
                      <Icon size={18} className={card.color} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{card.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{card.value}</p>
                  <p className="text-[0.7rem] text-muted-foreground/60 mt-1">{card.sub}</p>
                </div>
              );
            })}
          </div>

          {/* Additional Info Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="crm-card flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">Profit Margin</p>
                <p className="text-lg font-bold text-foreground">{data.profitMargin.toFixed(1)}%</p>
              </div>
              <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center ${
                data.profitMargin >= 20 ? 'border-emerald-500/30' : data.profitMargin >= 10 ? 'border-amber-500/30' : 'border-red-500/30'
              }`}>
                <span className="text-sm font-bold text-foreground">{data.profitMargin.toFixed(0)}%</span>
              </div>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted-foreground font-medium mb-1">Unsold Inventory</p>
              <p className="text-lg font-bold text-foreground">{data.totalUnsoldItems} items</p>
              <p className="text-xs text-muted-foreground/60">Invested: {formatINR(data.totalUnsoldBuyAmount + data.totalUnsoldRepairCosts)}</p>
            </div>
            <div className="crm-card">
              <p className="text-xs text-muted-foreground font-medium mb-1">Total Investment</p>
              <p className="text-lg font-bold text-foreground">{formatINR(data.totalInvestment)}</p>
              <p className="text-xs text-muted-foreground/60">Buy + Repairs + Unsold</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ──────────────────────────── Section 4: Top Reports ──────────────────────────── */
function TopReportSection() {
  const [data, setData] = useState<TopReport | null>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchTop = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/crm/reports?type=top');
        if (!res.ok) throw new Error('Failed');
        setData(await res.json());
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTop();
  }, []);

  const rankColors = ['bg-primary text-white', 'bg-foreground/10 text-foreground', 'bg-foreground/10 text-foreground', 'bg-muted text-muted-foreground', 'bg-muted text-muted-foreground'];
  const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="crm-card animate-pulse h-80" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="crm-card text-center py-12 text-muted-foreground">
        <Trophy size={40} className="mx-auto mb-3 opacity-30" />
        <p className="font-medium">Unable to load top reports</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Top 5 Customers */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="crm-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Users size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Top Customers</h3>
            <p className="text-xs text-muted-foreground/60">By purchase amount</p>
          </div>
        </div>
        {data.topCustomers.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No customer data yet</p>
        ) : (
          <div className="space-y-3">
            {data.topCustomers.map((c) => (
              <div key={c.rank} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankColors[c.rank - 1]}`}>
                  {c.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.purchaseCount} purchases</p>
                </div>
                <p className="font-bold text-foreground text-sm whitespace-nowrap">{formatINR(c.totalAmount)}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Top 5 Brands */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={1} className="crm-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
            <Smartphone size={18} className="text-indigo-500 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Top Brands</h3>
            <p className="text-xs text-muted-foreground/60">By sales count</p>
          </div>
        </div>
        {data.topBrands.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No brand data yet</p>
        ) : (
          <div className="space-y-3">
            {data.topBrands.map((b) => (
              <div key={b.rank} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${rankColors[b.rank - 1]}`}>
                  {b.rank}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{b.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(b.salesCount * 8, 80)}px` }} />
                  <p className="font-bold text-foreground text-sm">{b.salesCount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Top 5 Profit Phones */}
      <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={2} className="crm-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Trophy size={18} className="text-emerald-500 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Top Profit Phones</h3>
            <p className="text-xs text-muted-foreground/60">Highest profit margins</p>
          </div>
        </div>
        {data.topProfitPhones.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground text-sm">No profit data yet</p>
        ) : (
          <div className="space-y-3">
            {data.topProfitPhones.map((p) => (
              <div key={p.rank} className="p-2.5 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-base">{rankIcons[p.rank - 1]}</span>
                  <p className="font-medium text-foreground text-sm truncate">{p.brand} {p.model}</p>
                </div>
                <div className="flex items-center justify-between pl-8">
                  <p className="text-xs text-muted-foreground">
                    Buy {formatINR(p.buyPrice)} → Sell {formatINR(p.sellPrice)}
                  </p>
                  <p className={`font-bold text-sm ${p.profit >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                    {p.profit >= 0 ? '+' : ''}{formatINR(p.profit)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

/* ──────────────────────────── Receipt Icon (for Sell Report empty state) ──────────────────────────── */
function Receipt({ size }: { size: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/>
      <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
      <path d="M12 17.5v-11"/>
    </svg>
  );
}

/* ──────────────────────────── Tabs ──────────────────────────── */
const tabs = [
  { key: 'buy', label: 'Buy Report', icon: ShoppingBag },
  { key: 'sell', label: 'Sell Report', icon: TrendingUp },
  { key: 'profit', label: 'Profit / Loss', icon: IndianRupee },
  { key: 'top', label: 'Top Reports', icon: Trophy },
] as const;

type TabKey = (typeof tabs)[number]['key'];

/* ──────────────────────────── Main Component ──────────────────────────── */
export default function ReportsModule() {
  const [activeTab, setActiveTab] = useState<TabKey>('buy');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={22} className="text-primary" />
            Reports & Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Detailed business insights with date range filters</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 bg-muted/50 p-1.5 rounded-xl border border-border">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-card text-foreground shadow-sm border border-border'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              }`}
            >
              <Icon size={16} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'buy' && <BuyReportSection />}
          {activeTab === 'sell' && <SellReportSection />}
          {activeTab === 'profit' && <ProfitLossSection />}
          {activeTab === 'top' && <TopReportSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
