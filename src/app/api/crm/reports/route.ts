import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ─── Helper ─────────────────────────────────────────
function parseDateRange(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const fromStr = searchParams.get('from') || '';
  const toStr = searchParams.get('to') || '';
  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toStr ? new Date(toStr) : new Date();
  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

// ─── GET ────────────────────────────────────────────
// ?type=buy|sell|profit|top&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'buy';

    switch (type) {
      case 'buy':
        return buyReport(request);
      case 'sell':
        return sellReport(request);
      case 'profit':
        return profitLossReport(request);
      case 'top':
        return topReport();
      default:
        return NextResponse.json({ error: 'Invalid report type. Use: buy, sell, profit, top' }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Report generation failed';
    console.error('Reports API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Section 1: Buy Report ─────────────────────────
async function buyReport(request: NextRequest) {
  const { from, to } = parseDateRange(request);

  const items = await db.inventory.findMany({
    where: {
      addedAt: { gte: from, lte: to },
    },
    include: {
      seller: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { addedAt: 'desc' },
  });

  const count = items.length;
  const totalBuyAmount = items.reduce((sum, item) => sum + item.buyPrice, 0);
  const totalRepairCost = items.reduce((sum, item) => sum + item.repairCost, 0);

  const tableData = items.map((item) => ({
    id: item.id,
    date: item.addedAt.toISOString().split('T')[0],
    brand: item.brand,
    model: item.model,
    imeiNo: item.imeiNo || 'N/A',
    seller: item.seller?.name || 'Walk-in',
    buyPrice: item.buyPrice,
    condition: item.condition,
    status: item.status,
    repairCost: item.repairCost,
  }));

  return NextResponse.json({
    count,
    totalBuyAmount,
    totalRepairCost,
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
    items: tableData,
  });
}

// ─── Section 2: Sell Report ────────────────────────
async function sellReport(request: NextRequest) {
  const { from, to } = parseDateRange(request);

  const sales = await db.sale.findMany({
    where: {
      saleDate: { gte: from, lte: to },
    },
    include: {
      inventory: {
        select: { id: true, brand: true, model: true, buyPrice: true },
      },
      buyer: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { saleDate: 'desc' },
  });

  const count = sales.length;
  const totalSellAmount = sales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
  const totalPending = sales.reduce((sum, s) => sum + s.pendingAmount, 0);

  const tableData = sales.map((sale) => ({
    id: sale.id,
    date: sale.saleDate.toISOString().split('T')[0],
    brand: sale.inventory.brand,
    model: sale.inventory.model,
    buyer: sale.buyer?.name || 'Unknown',
    salePrice: sale.salePrice,
    paidAmount: sale.paidAmount,
    pendingAmount: sale.pendingAmount,
    paymentStatus: sale.paymentStatus,
    warrantyMonths: sale.warrantyMonths,
  }));

  return NextResponse.json({
    count,
    totalSellAmount,
    totalPaid,
    totalPending,
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
    sales: tableData,
  });
}

// ─── Section 3: Profit/Loss Report ─────────────────
async function profitLossReport(request: NextRequest) {
  const { from, to } = parseDateRange(request);

  const sales = await db.sale.findMany({
    where: {
      saleDate: { gte: from, lte: to },
    },
    include: {
      inventory: {
        select: { id: true, brand: true, model: true, buyPrice: true, repairCost: true },
      },
      buyer: {
        select: { id: true, name: true, phone: true },
      },
    },
    orderBy: { saleDate: 'desc' },
  });

  const inventoryItems = await db.inventory.findMany({
    where: {
      addedAt: { gte: from, lte: to },
    },
  });

  const totalSellAmount = sales.reduce((sum, s) => sum + s.salePrice, 0);
  const totalBuyAmount = sales.reduce((sum, s) => sum + s.inventory.buyPrice, 0);
  const totalRepairCosts = sales.reduce((sum, s) => sum + s.inventory.repairCost, 0);
  const totalUnsoldBuyAmount = inventoryItems.reduce((sum, item) => sum + item.buyPrice, 0);
  const totalUnsoldRepairCosts = inventoryItems.reduce((sum, item) => sum + item.repairCost, 0);

  const grossProfit = totalSellAmount - totalBuyAmount;
  const netProfit = grossProfit - totalRepairCosts;
  const totalInvestment = totalBuyAmount + totalRepairCosts + totalUnsoldBuyAmount + totalUnsoldRepairCosts;
  const profitMargin = totalSellAmount > 0 ? ((netProfit / totalSellAmount) * 100) : 0;

  return NextResponse.json({
    totalSellAmount,
    totalBuyAmount,
    totalRepairCosts,
    grossProfit,
    netProfit,
    totalUnsoldItems: inventoryItems.filter((i) => i.status !== 'done').length,
    totalUnsoldBuyAmount,
    totalUnsoldRepairCosts,
    totalInvestment,
    profitMargin,
    totalSalesCount: sales.length,
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  });
}

// ─── Section 4: Top Reports ────────────────────────
async function topReport() {
  // Top 5 customers by purchase amount
  const topCustomers = await db.sale.groupBy({
    by: ['buyerId'],
    _sum: { salePrice: true },
    _count: { id: true },
    orderBy: { _sum: { salePrice: 'desc' } },
    take: 5,
  });

  const topCustomersData = await Promise.all(
    topCustomers.map(async (tc) => {
      const customer = await db.customer.findUnique({
        where: { id: tc.buyerId },
        select: { name: true, phone: true },
      });
      return {
        rank: 0,
        name: customer?.name || 'Unknown',
        phone: customer?.phone || '',
        totalAmount: tc._sum.salePrice || 0,
        purchaseCount: tc._count.id,
      };
    })
  );
  topCustomersData.forEach((c, i) => (c.rank = i + 1));

  // Top 5 brands by sales count
  const topBrands = await db.inventory.findMany({
    where: { status: 'done' },
    select: { brand: true },
  });

  const brandCountMap: Record<string, number> = {};
  topBrands.forEach((item) => {
    brandCountMap[item.brand] = (brandCountMap[item.brand] || 0) + 1;
  });

  const topBrandsData = Object.entries(brandCountMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count], i) => ({
      rank: i + 1,
      name,
      salesCount: count,
    }));

  // Top 5 highest profit phones
  const profitableSales = await db.sale.findMany({
    where: { paymentStatus: 'full' },
    include: {
      inventory: {
        select: { brand: true, model: true, buyPrice: true, repairCost: true },
      },
    },
    orderBy: { salePrice: 'desc' },
    take: 50,
  });

  const profitPhones = profitableSales
    .map((s) => ({
      brand: s.inventory.brand,
      model: s.inventory.model,
      buyPrice: s.inventory.buyPrice,
      sellPrice: s.salePrice,
      repairCost: s.inventory.repairCost,
      profit: s.salePrice - s.inventory.buyPrice - s.inventory.repairCost,
    }))
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 5)
    .map((p, i) => ({ ...p, rank: i + 1 }));

  return NextResponse.json({
    topCustomers: topCustomersData,
    topBrands: topBrandsData,
    topProfitPhones: profitPhones,
  });
}
