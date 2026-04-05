import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const where: Prisma.OrderWhereInput = {};

    if (search) {
      where.OR = [
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { phone: { contains: search } } },
        { deliveryBy: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [orders, total] = await Promise.all([
      db.order.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, brand, model, advanceAmount, status, orderDate, deliveryDate, deliveryBy } = body;

    if (!customerId || !brand) {
      return NextResponse.json({ error: 'Customer and brand are required' }, { status: 400 });
    }

    const order = await db.order.create({
      data: {
        customerId,
        brand: brand || '',
        model: model || '',
        advanceAmount: parseFloat(advanceAmount) || 0,
        status: status || 'pending',
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        deliveryBy: deliveryBy || '',
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Orders POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { customerId, brand, model, advanceAmount, status, orderDate, deliveryDate, deliveryBy } = body;

    const existing = await db.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const order = await db.order.update({
      where: { id },
      data: {
        ...(customerId && { customerId }),
        ...(brand !== undefined && { brand }),
        ...(model !== undefined && { model }),
        ...(advanceAmount !== undefined && { advanceAmount: parseFloat(advanceAmount) }),
        ...(status && { status }),
        ...(orderDate && { orderDate: new Date(orderDate) }),
        ...(deliveryDate !== undefined && {
          deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
        }),
        ...(deliveryBy !== undefined && { deliveryBy }),
      },
      include: {
        customer: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Orders PUT error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
