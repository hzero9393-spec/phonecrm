import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@libsql/client';
import { createHash } from 'crypto';

export const dynamic = 'force-dynamic';

const CREATE_TABLES_SQL = `
CREATE TABLE IF NOT EXISTS "Admin" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'admin',
  "fullName" TEXT NOT NULL DEFAULT '',
  "mobile" TEXT NOT NULL DEFAULT '',
  "email" TEXT NOT NULL DEFAULT '',
  "theme" TEXT NOT NULL DEFAULT 'theme-blue',
  "createdBy" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username");
CREATE TABLE IF NOT EXISTS "Shop" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "adminId" TEXT NOT NULL,
  "shopName" TEXT NOT NULL DEFAULT '',
  "gstNo" TEXT NOT NULL DEFAULT '',
  "address" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "logo" TEXT NOT NULL DEFAULT '',
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Shop_adminId_key" ON "Shop"("adminId");
CREATE TABLE IF NOT EXISTS "Customer" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL DEFAULT '',
  "address" TEXT NOT NULL DEFAULT '',
  "aadharNo" TEXT NOT NULL DEFAULT '',
  "type" TEXT NOT NULL DEFAULT 'both',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Inventory" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "ram" TEXT NOT NULL DEFAULT '',
  "storage" TEXT NOT NULL DEFAULT '',
  "color" TEXT NOT NULL DEFAULT '',
  "imeiNo" TEXT NOT NULL DEFAULT '',
  "condition" TEXT NOT NULL DEFAULT 'good',
  "status" TEXT NOT NULL DEFAULT 'pending',
  "sellerId" TEXT,
  "buyPrice" REAL NOT NULL DEFAULT 0,
  "repairRequired" BOOLEAN NOT NULL DEFAULT 0,
  "repairDetails" TEXT NOT NULL DEFAULT '',
  "repairCost" REAL NOT NULL DEFAULT 0,
  "repairStatus" TEXT NOT NULL DEFAULT 'none',
  "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Sale" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "inventoryId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "salePrice" REAL NOT NULL DEFAULT 0,
  "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
  "paidAmount" REAL NOT NULL DEFAULT 0,
  "pendingAmount" REAL NOT NULL DEFAULT 0,
  "warrantyMonths" INTEGER NOT NULL DEFAULT 0,
  "saleDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "Invoice" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "invoiceNo" TEXT NOT NULL,
  "saleId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "totalAmount" REAL NOT NULL DEFAULT 0,
  "paidAmount" REAL NOT NULL DEFAULT 0,
  "pendingAmount" REAL NOT NULL DEFAULT 0,
  "gstAmount" REAL NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_invoiceNo_key" ON "Invoice"("invoiceNo");
CREATE TABLE IF NOT EXISTS "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "customerId" TEXT NOT NULL,
  "brand" TEXT NOT NULL DEFAULT '',
  "model" TEXT NOT NULL DEFAULT '',
  "advanceAmount" REAL NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "orderDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deliveryDate" DATETIME,
  "deliveryBy" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
`;

async function ensureDatabase(): Promise<boolean> {
  try {
    const dbUrl = process.env.DATABASE_URL;
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    if (!dbUrl) return false;

    const libsql = createClient({ url: dbUrl, authToken: authToken || '' });

    // Create all tables
    const statements = CREATE_TABLES_SQL.split(';').filter(s => s.trim());
    for (const sql of statements) {
      if (sql.trim()) await libsql.execute(sql.trim());
    }

    // Create master admin if not exists
    const hash = createHash('md5').update('goutamji100').digest('hex');
    const existing = await libsql.execute({
      sql: 'SELECT id FROM Admin WHERE username = ?',
      args: ['goutamji100'],
    });

    if (existing.rows.length === 0) {
      await libsql.execute({
        sql: `INSERT INTO Admin (id, username, password, role, fullName, theme, createdAt, updatedAt)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        args: ['master-' + Date.now(), 'goutamji100', hash, 'master', 'Goutam Ji', 'theme-blue'],
      });
    }

    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const hash = createHash('md5').update(password).digest('hex');

    // Try login first
    try {
      const dbUrl = process.env.DATABASE_URL || 'file:./db/custom.db';

      if (dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://')) {
        // Turso: use libsql directly for login
        const authToken = process.env.DATABASE_AUTH_TOKEN || '';
        const libsql = createClient({ url: dbUrl, authToken });

        const result = await libsql.execute({
          sql: 'SELECT * FROM Admin WHERE username = ?',
          args: [username],
        });

        if (result.rows.length === 0) {
          // Table might not exist, try to initialize
          const initialized = await ensureDatabase();
          if (initialized) {
            // Retry login after init
            const retry = await libsql.execute({
              sql: 'SELECT * FROM Admin WHERE username = ?',
              args: [username],
            });
            if (retry.rows.length === 0 || retry.rows[0].password !== hash) {
              return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
            }
            const admin = retry.rows[0];
            return NextResponse.json({
              id: admin.id,
              username: admin.username,
              role: admin.role,
              fullName: admin.fullName,
              mobile: admin.mobile,
              email: admin.email,
              theme: admin.theme,
            });
          }
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const admin = result.rows[0];
        if (admin.password !== hash) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        return NextResponse.json({
          id: admin.id,
          username: admin.username,
          role: admin.role,
          fullName: admin.fullName,
          mobile: admin.mobile,
          email: admin.email,
          theme: admin.theme,
        });
      } else {
        // Local SQLite: use Prisma
        const { PrismaClient } = await import('@prisma/client');
        const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
        const prisma = globalForPrisma.prisma ?? new PrismaClient();
        if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

        const admin = await prisma.admin.findUnique({ where: { username } });

        if (!admin || admin.password !== hash) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        return NextResponse.json({
          id: admin.id,
          username: admin.username,
          role: admin.role,
          fullName: admin.fullName,
          mobile: admin.mobile,
          email: admin.email,
          theme: admin.theme,
        });
      }
    } catch (tableError) {
      // If table doesn't exist error, initialize and retry
      const initialized = await ensureDatabase();
      if (!initialized) {
        console.error('Login error:', tableError);
        return NextResponse.json({ error: 'Server error - DB not configured' }, { status: 500 });
      }

      // Retry login after init
      const dbUrl = process.env.DATABASE_URL || '';
      const libsql = createClient({ url: dbUrl, authToken: process.env.DATABASE_AUTH_TOKEN || '' });
      const result = await libsql.execute({
        sql: 'SELECT * FROM Admin WHERE username = ?',
        args: [username],
      });

      if (result.rows.length === 0 || result.rows[0].password !== hash) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }

      const admin = result.rows[0];
      return NextResponse.json({
        id: admin.id,
        username: admin.username,
        role: admin.role,
        fullName: admin.fullName,
        mobile: admin.mobile,
        email: admin.email,
        theme: admin.theme,
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
