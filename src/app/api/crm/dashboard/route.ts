import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // ---- 1. Total customers ----
    const totalCustomers = await db.customer.count();

    // ---- 2. Inventory stats ----
    const inventoryByStatus = await db.inventory.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const inventoryStatusMap: Record<string, number> = {
      pending: 0,
      complete: 0,
      done: 0,
    };
    for (const item of inventoryByStatus) {
      inventoryStatusMap[item.status] = item._count.id;
    }

    const totalInventory = Object.values(inventoryStatusMap).reduce(
      (sum, count) => sum + count,
      0
    );

    // ---- 3. Sales stats ----
    const totalSales = await db.sale.count();

    const revenueResult = await db.sale.aggregate({
      _sum: { salePrice: true },
    });
    const totalRevenue = revenueResult._sum.salePrice ?? 0;

    // ---- 4. Order stats ----
    const ordersByStatus = await db.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    const orderStatusMap: Record<string, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    };
    for (const order of ordersByStatus) {
      orderStatusMap[order.status] = order._count.id;
    }

    const totalOrders = Object.values(orderStatusMap).reduce(
      (sum, count) => sum + count,
      0
    );

    // ---- 5. Recent 5 sales ----
    const recentSales = await db.sale.findMany({
      take: 5,
      orderBy: { saleDate: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, phone: true } },
        inventory: { select: { id: true, brand: true, model: true } },
      },
    });

    // ---- 6. Recent 5 inventory items ----
    const recentInventory = await db.inventory.findMany({
      take: 5,
      orderBy: { addedAt: 'desc' },
      include: {
        seller: { select: { id: true, name: true } },
      },
    });

    // ---- 7. Repair needed count ----
    const repairNeededCount = await db.inventory.count({
      where: {
        repairRequired: true,
        repairStatus: { in: ['pending', 'in_progress'] },
      },
    });

    return NextResponse.json({
      totalCustomers,
      totalInventory,
      inventoryByStatus: inventoryStatusMap,
      totalSales,
      totalRevenue,
      ordersByStatus: orderStatusMap,
      totalOrders,
      recentSales,
      recentInventory,
      repairNeededCount,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      { error: 'Failed to load dashboard statistics' },
      { status: 500 }
    );
  }
}
