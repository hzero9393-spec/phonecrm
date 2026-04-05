import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// ─── GET ─────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const search = searchParams.get('search') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const skip = (page - 1) * limit;

    // Single invoice detail view
    if (id) {
      const invoice = await db.invoice.findUnique({
        where: { id },
        include: {
          sale: {
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
                },
              },
              buyer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                  address: true,
                  aadharNo: true,
                  type: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
              aadharNo: true,
              type: true,
            },
          },
        },
      });

      if (!invoice) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      // Get shop details
      const shop = await db.shop.findFirst();

      return NextResponse.json({
        invoice,
        shop,
      });
    }

    // List invoices with search and pagination
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { phone: { contains: search } } },
        { sale: { inventory: { brand: { contains: search } } } },
        { sale: { inventory: { model: { contains: search } } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sale: {
            include: {
              inventory: {
                select: {
                  id: true,
                  brand: true,
                  model: true,
                  imeiNo: true,
                },
              },
              buyer: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              address: true,
            },
          },
        },
      }),
      db.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch invoices';
    console.error('Invoices GET error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
