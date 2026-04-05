import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const adminId = searchParams.get('adminId');

    // Try to find shop settings
    let shop = null;

    if (adminId) {
      shop = await db.shop.findUnique({
        where: { adminId },
      });
    }

    // If not found, try to get the first record
    if (!shop) {
      shop = await db.shop.findFirst();
    }

    // If still no record, create a default one
    if (!shop) {
      shop = await db.shop.create({
        data: {
          adminId: adminId || 'default',
          shopName: 'My Mobile Shop',
          gstNo: '',
          address: '',
          phone: '',
          logo: '',
        },
      });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Shop GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Shop ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { shopName, gstNo, address, phone, logo, adminId } = body;

    const existing = await db.shop.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Shop settings not found' }, { status: 404 });
    }

    const shop = await db.shop.update({
      where: { id },
      data: {
        ...(shopName !== undefined && { shopName }),
        ...(gstNo !== undefined && { gstNo }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone }),
        ...(logo !== undefined && { logo }),
        ...(adminId !== undefined && { adminId }),
      },
    });

    return NextResponse.json(shop);
  } catch (error) {
    console.error('Shop PUT error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
