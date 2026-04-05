import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ─── Price formatter ─────────────────────────────────────
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ─── GET ─────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { buyer: { name: { contains: search } } },
        { buyer: { phone: { contains: search } } },
        { inventory: { brand: { contains: search } } },
        { inventory: { model: { contains: search } } },
        { inventory: { imeiNo: { contains: search } } },
      ];
    }

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { saleDate: 'desc' },
        include: {
          inventory: {
            select: {
              id: true,
              brand: true,
              model: true,
              ram: true,
              storage: true,
              color: true,
              imeiNo: true,
              condition: true,
              buyPrice: true,
              status: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
              type: true,
            },
          },
          invoices: {
            select: {
              id: true,
              invoiceNo: true,
            },
          },
        },
      }),
      db.sale.count({ where }),
    ]);

    return NextResponse.json({
      sales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch sales';
    console.error('Sales GET error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST ────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      inventoryId,
      buyerId,
      salePrice,
      paymentStatus,
      paidAmount,
      pendingAmount,
      warrantyMonths,
      saleDate,
    } = body;

    if (!inventoryId || !buyerId || !salePrice) {
      return NextResponse.json(
        { error: 'inventoryId, buyerId, and salePrice are required' },
        { status: 400 }
      );
    }

    // Validate payment status
    const validStatuses = ['full', 'partial', 'pending'];
    if (!validStatuses.includes(paymentStatus)) {
      return NextResponse.json(
        { error: `paymentStatus must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate invoice number: INV-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Count today's invoices to generate sequential number
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const todayInvoiceCount = await db.invoice.count({
      where: {
        createdAt: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
    });

    const seq = String(todayInvoiceCount + 1).padStart(4, '0');
    const invoiceNo = `INV-${dateStr}-${seq}`;

    // Calculate GST (18% of totalAmount)
    const totalAmount = Number(salePrice);
    const gstAmount = Math.round(totalAmount * 0.18 * 100) / 100;
    const paid = Number(paidAmount || 0);
    const pending = Number(pendingAmount || totalAmount - paid);

    // Use a transaction to create sale + invoice + update inventory
    const result = await db.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          inventoryId,
          buyerId,
          salePrice: totalAmount,
          paymentStatus,
          paidAmount: paid,
          pendingAmount: pending,
          warrantyMonths: warrantyMonths || 0,
          saleDate: saleDate ? new Date(saleDate) : new Date(),
        },
        include: {
          inventory: true,
          buyer: true,
        },
      });

      // Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          saleId: sale.id,
          customerId: buyerId,
          totalAmount,
          paidAmount: paid,
          pendingAmount: pending,
          gstAmount,
        },
      });

      // Update inventory status to 'done'
      await tx.inventory.update({
        where: { id: inventoryId },
        data: { status: 'done' },
      });

      return { sale, invoice };
    });

    return NextResponse.json(
      {
        message: 'Sale created successfully',
        sale: result.sale,
        invoice: result.invoice,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create sale';
    console.error('Sales POST error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── PUT ─────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Sale id is required as ?id=' }, { status: 400 });
    }

    const body = await request.json();
    const {
      salePrice,
      paymentStatus,
      paidAmount,
      pendingAmount,
      warrantyMonths,
      saleDate,
    } = body;

    // Validate payment status if provided
    if (paymentStatus) {
      const validStatuses = ['full', 'partial', 'pending'];
      if (!validStatuses.includes(paymentStatus)) {
        return NextResponse.json(
          { error: `paymentStatus must be one of: ${validStatuses.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const sale = await db.sale.findUnique({ where: { id }, include: { invoices: true } });
    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 });
    }

    const updatedSale = await db.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {};
      if (salePrice !== undefined) updateData.salePrice = Number(salePrice);
      if (paymentStatus !== undefined) updateData.paymentStatus = paymentStatus;
      if (paidAmount !== undefined) updateData.paidAmount = Number(paidAmount);
      if (pendingAmount !== undefined) updateData.pendingAmount = Number(pendingAmount);
      if (warrantyMonths !== undefined) updateData.warrantyMonths = Number(warrantyMonths);
      if (saleDate !== undefined) updateData.saleDate = new Date(saleDate);

      const sale = await tx.sale.update({
        where: { id },
        data: updateData,
        include: {
          inventory: true,
          buyer: true,
          invoices: true,
        },
      });

      // Update all associated invoices
      const newTotal = salePrice !== undefined ? Number(salePrice) : sale.salePrice;
      const newPaid = paidAmount !== undefined ? Number(paidAmount) : sale.paidAmount;
      const newPending = pendingAmount !== undefined ? Number(pendingAmount) : sale.pendingAmount;
      const newGst = Math.round(newTotal * 0.18 * 100) / 100;

      if (sale.invoices && sale.invoices.length > 0) {
        for (const invoice of sale.invoices) {
          await tx.invoice.update({
            where: { id: invoice.id },
            data: {
              totalAmount: newTotal,
              paidAmount: newPaid,
              pendingAmount: newPending,
              gstAmount: newGst,
            },
          });
        }
      }

      return sale;
    });

    return NextResponse.json({
      message: 'Sale updated successfully',
      sale: updatedSale,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update sale';
    console.error('Sales PUT error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
