import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/crm/inventory - List inventory items with filters and pagination
// GET /api/crm/inventory?action=sellers - Get list of seller customers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Special action: fetch sellers
    if (action === 'sellers') {
      const sellers = await db.customer.findMany({
        where: {
          OR: [{ type: 'seller' }, { type: 'both' }],
        },
        select: {
          id: true,
          name: true,
          phone: true,
          type: true,
        },
        orderBy: { name: 'asc' },
      });
      return NextResponse.json({ sellers });
    }

    // Standard inventory listing
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const condition = searchParams.get('condition') || '';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { brand: { contains: search } },
        { model: { contains: search } },
        { imeiNo: { contains: search } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (condition) {
      where.condition = condition;
    }

    const [items, total] = await Promise.all([
      db.inventory.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
        orderBy: { addedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.inventory.count({ where }),
    ]);

    return NextResponse.json({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    console.error('GET /api/crm/inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory items' },
      { status: 500 }
    );
  }
}

// POST /api/crm/inventory - Create a new inventory item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      brand,
      model,
      ram,
      storage,
      color,
      imeiNo,
      condition,
      status,
      sellerId,
      buyPrice,
      repairRequired,
      repairDetails,
      repairCost,
      repairStatus,
    } = body;

    // Validate required fields
    if (!brand || !model) {
      return NextResponse.json(
        { error: 'Brand and model are required' },
        { status: 400 }
      );
    }

    // Validate condition
    const validConditions = ['average', 'good', 'poor'];
    if (condition && !validConditions.includes(condition)) {
      return NextResponse.json(
        { error: `Condition must be one of: ${validConditions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'complete', 'done'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate repairStatus
    const validRepairStatuses = ['none', 'pending', 'in_progress', 'completed'];
    if (repairStatus && !validRepairStatuses.includes(repairStatus)) {
      return NextResponse.json(
        { error: `Repair status must be one of: ${validRepairStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // If sellerId is provided, verify the seller exists
    if (sellerId) {
      const seller = await db.customer.findUnique({
        where: { id: sellerId },
      });
      if (!seller) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 400 }
        );
      }
    }

    const item = await db.inventory.create({
      data: {
        brand: brand.trim(),
        model: model.trim(),
        ram: ram || '',
        storage: storage || '',
        color: color || '',
        imeiNo: imeiNo || '',
        condition: condition || 'good',
        status: status || 'pending',
        sellerId: sellerId || null,
        buyPrice: buyPrice || 0,
        repairRequired: repairRequired || false,
        repairDetails: repairDetails || '',
        repairCost: repairCost || 0,
        repairStatus: repairStatus || (repairRequired ? 'pending' : 'none'),
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/crm/inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to create inventory item' },
      { status: 500 }
    );
  }
}

// PUT /api/crm/inventory?id=xxx - Update an inventory item
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Item id is required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await db.inventory.findUnique({
      where: { id },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      brand,
      model,
      ram,
      storage,
      color,
      imeiNo,
      condition,
      status,
      sellerId,
      buyPrice,
      repairRequired,
      repairDetails,
      repairCost,
      repairStatus,
    } = body;

    // Validate condition
    const validConditions = ['average', 'good', 'poor'];
    if (condition && !validConditions.includes(condition)) {
      return NextResponse.json(
        { error: `Condition must be one of: ${validConditions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'complete', 'done'];
    if (status && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Status must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate repairStatus
    const validRepairStatuses = ['none', 'pending', 'in_progress', 'completed'];
    if (repairStatus && !validRepairStatuses.includes(repairStatus)) {
      return NextResponse.json(
        { error: `Repair status must be one of: ${validRepairStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // If sellerId is provided, verify the seller exists
    if (sellerId) {
      const seller = await db.customer.findUnique({
        where: { id: sellerId },
      });
      if (!seller) {
        return NextResponse.json(
          { error: 'Seller not found' },
          { status: 400 }
        );
      }
    }

    const item = await db.inventory.update({
      where: { id },
      data: {
        ...(brand !== undefined && { brand: brand.trim() }),
        ...(model !== undefined && { model: model.trim() }),
        ...(ram !== undefined && { ram }),
        ...(storage !== undefined && { storage }),
        ...(color !== undefined && { color }),
        ...(imeiNo !== undefined && { imeiNo }),
        ...(condition !== undefined && { condition }),
        ...(status !== undefined && { status }),
        ...(sellerId !== undefined && { sellerId: sellerId || null }),
        ...(buyPrice !== undefined && { buyPrice }),
        ...(repairRequired !== undefined && { repairRequired }),
        ...(repairDetails !== undefined && { repairDetails }),
        ...(repairCost !== undefined && { repairCost }),
        ...(repairStatus !== undefined && { repairStatus }),
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ item });
  } catch (error: unknown) {
    console.error('PUT /api/crm/inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory item' },
      { status: 500 }
    );
  }
}

// DELETE /api/crm/inventory?id=xxx - Delete an inventory item (only if not sold)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Item id is required' },
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await db.inventory.findUnique({
      where: { id },
      include: {
        sales: true,
      },
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: 'Inventory item not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if item has been sold
    if (existingItem.sales.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete this item because it has associated sale records' },
        { status: 400 }
      );
    }

    await db.inventory.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Inventory item deleted successfully' });
  } catch (error: unknown) {
    console.error('DELETE /api/crm/inventory error:', error);
    return NextResponse.json(
      { error: 'Failed to delete inventory item' },
      { status: 500 }
    );
  }
}
