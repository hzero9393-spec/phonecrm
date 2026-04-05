import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ─── GET ────────────────────────────────────────────
// ?type=invoice|customers|stock&invoiceNo=INV-xxx&from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || '';

    switch (type) {
      case 'invoice':
        return printInvoice(searchParams);
      case 'customers':
        return printCustomers();
      case 'buysell':
        return printBuySellReport(searchParams);
      case 'stock':
        return printStockReport();
      default:
        return NextResponse.json({ error: 'Invalid print type. Use: invoice, customers, buysell, stock' }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Print data fetch failed';
    console.error('Print API error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── Print Invoice ─────────────────────────────────
async function printInvoice(searchParams: URLSearchParams) {
  const invoiceNo = searchParams.get('invoiceNo') || '';

  if (!invoiceNo) {
    return NextResponse.json({ error: 'Invoice number is required' }, { status: 400 });
  }

  const invoice = await db.invoice.findUnique({
    where: { invoiceNo },
    include: {
      sale: {
        include: {
          inventory: {
            select: { brand: true, model: true, ram: true, storage: true, color: true, imeiNo: true, condition: true },
          },
          buyer: {
            select: { name: true, phone: true, address: true },
          },
        },
      },
      customer: {
        select: { name: true, phone: true, address: true },
      },
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  // Get shop details
  const shop = await db.shop.findFirst({ take: 1 });

  return NextResponse.json({
    invoice: {
      invoiceNo: invoice.invoiceNo,
      date: invoice.createdAt.toISOString().split('T')[0],
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      pendingAmount: invoice.pendingAmount,
      gstAmount: invoice.gstAmount,
      subTotal: Math.round((invoice.totalAmount / 1.18) * 100) / 100,
      cgst: Math.round(invoice.gstAmount / 2 * 100) / 100,
      sgst: Math.round(invoice.gstAmount / 2 * 100) / 100,
      warrantyMonths: invoice.sale.warrantyMonths,
    },
    phone: invoice.sale.inventory,
    buyer: invoice.customer,
    shop: shop ? {
      name: shop.shopName,
      gstNo: shop.gstNo,
      address: shop.address,
      phone: shop.phone,
    } : null,
  });
}

// ─── Print Customer List ───────────────────────────
async function printCustomers() {
  const customers = await db.customer.findMany({
    orderBy: { name: 'asc' },
  });

  const customerData = customers.map((c) => ({
    name: c.name,
    phone: c.phone,
    address: c.address,
    aadharNo: c.aadharNo,
    type: c.type,
    createdAt: c.createdAt.toISOString().split('T')[0],
  }));

  // Get shop details
  const shop = await db.shop.findFirst({ take: 1 });

  return NextResponse.json({
    customers: customerData,
    totalCustomers: customers.length,
    generatedAt: new Date().toISOString(),
    shop: shop ? {
      name: shop.shopName,
      gstNo: shop.gstNo,
      address: shop.address,
      phone: shop.phone,
    } : null,
  });
}

// ─── Print Buy/Sell Report ─────────────────────────
async function printBuySellReport(searchParams: URLSearchParams) {
  const fromStr = searchParams.get('from') || '';
  const toStr = searchParams.get('to') || '';
  const from = fromStr ? new Date(fromStr) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const to = toStr ? new Date(toStr) : new Date();
  to.setHours(23, 59, 59, 999);
  from.setHours(0, 0, 0, 0);

  const [inventoryItems, sales] = await Promise.all([
    db.inventory.findMany({
      where: { addedAt: { gte: from, lte: to } },
      include: { seller: { select: { name: true, phone: true } } },
      orderBy: { addedAt: 'asc' },
    }),
    db.sale.findMany({
      where: { saleDate: { gte: from, lte: to } },
      include: {
        inventory: { select: { brand: true, model: true, buyPrice: true, repairCost: true } },
        buyer: { select: { name: true, phone: true } },
      },
      orderBy: { saleDate: 'asc' },
    }),
  ]);

  const totalBuy = inventoryItems.reduce((s, i) => s + i.buyPrice, 0);
  const totalSell = sales.reduce((s, sa) => s + sa.salePrice, 0);
  const totalRepairs = inventoryItems.reduce((s, i) => s + i.repairCost, 0);

  // Get shop details
  const shop = await db.shop.findFirst({ take: 1 });

  return NextResponse.json({
    buys: inventoryItems.map((item) => ({
      date: item.addedAt.toISOString().split('T')[0],
      brand: item.brand,
      model: item.model,
      imeiNo: item.imeiNo || 'N/A',
      condition: item.condition,
      buyPrice: item.buyPrice,
      repairCost: item.repairCost,
      seller: item.seller?.name || 'Walk-in',
    })),
    sells: sales.map((sale) => ({
      date: sale.saleDate.toISOString().split('T')[0],
      brand: sale.inventory.brand,
      model: sale.inventory.model,
      buyer: sale.buyer?.name || 'Unknown',
      salePrice: sale.salePrice,
      paymentStatus: sale.paymentStatus,
    })),
    summary: {
      totalBuyCount: inventoryItems.length,
      totalBuyAmount: totalBuy,
      totalRepairCosts: totalRepairs,
      totalSellCount: sales.length,
      totalSellAmount: totalSell,
      grossProfit: totalSell - totalBuy,
      netProfit: totalSell - totalBuy - totalRepairs,
    },
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
    generatedAt: new Date().toISOString(),
    shop: shop ? {
      name: shop.shopName,
      gstNo: shop.gstNo,
      address: shop.address,
      phone: shop.phone,
    } : null,
  });
}

// ─── Print Stock Report ────────────────────────────
async function printStockReport() {
  const unsoldItems = await db.inventory.findMany({
    where: { status: { in: ['pending', 'complete'] } },
    include: {
      seller: { select: { name: true, phone: true } },
    },
    orderBy: { addedAt: 'desc' },
  });

  const now = new Date();
  const stockData = unsoldItems.map((item) => {
    const addedDate = new Date(item.addedAt);
    const daysInStock = Math.floor((now.getTime() - addedDate.getTime()) / (1000 * 60 * 60 * 24));
    return {
      date: item.addedAt.toISOString().split('T')[0],
      brand: item.brand,
      model: item.model,
      imeiNo: item.imeiNo || 'N/A',
      condition: item.condition,
      status: item.status,
      buyPrice: item.buyPrice,
      repairCost: item.repairCost,
      seller: item.seller?.name || 'Walk-in',
      daysInStock,
    };
  });

  const totalInvested = unsoldItems.reduce((s, i) => s + i.buyPrice, 0);
  const totalRepairPending = unsoldItems.reduce((s, i) => s + i.repairCost, 0);

  // Get shop details
  const shop = await db.shop.findFirst({ take: 1 });

  return NextResponse.json({
    stock: stockData,
    totalItems: unsoldItems.length,
    totalInvested,
    totalRepairPending,
    generatedAt: new Date().toISOString(),
    shop: shop ? {
      name: shop.shopName,
      gstNo: shop.gstNo,
      address: shop.address,
      phone: shop.phone,
    } : null,
  });
}
