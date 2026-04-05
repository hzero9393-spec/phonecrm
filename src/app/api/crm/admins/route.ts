import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createHash } from 'crypto';

export async function GET(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if requester is a master
    const requester = await db.admin.findUnique({ where: { id: adminId } });
    if (!requester || requester.role !== 'master') {
      return NextResponse.json({ error: 'Access denied. Master role required.' }, { status: 403 });
    }

    const admins = await db.admin.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        mobile: true,
        email: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(admins);
  } catch (error) {
    console.error('Admins GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if requester is a master
    const requester = await db.admin.findUnique({ where: { id: adminId } });
    if (!requester || requester.role !== 'master') {
      return NextResponse.json({ error: 'Access denied. Master role required.' }, { status: 403 });
    }

    const body = await request.json();
    const { username, password, role, fullName, mobile, email } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    // Check for existing username
    const existing = await db.admin.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }

    const hash = createHash('md5').update(password).digest('hex');

    const admin = await db.admin.create({
      data: {
        username,
        password: hash,
        role: role || 'admin',
        fullName: fullName || '',
        mobile: mobile || '',
        email: email || '',
        createdBy: adminId,
      },
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        mobile: true,
        email: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(admin, { status: 201 });
  } catch (error) {
    console.error('Admins POST error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if requester is a master
    const requester = await db.admin.findUnique({ where: { id: adminId } });
    if (!requester || requester.role !== 'master') {
      return NextResponse.json({ error: 'Access denied. Master role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    const existing = await db.admin.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const body = await request.json();
    const { username, password, role, fullName, mobile, email } = body;

    // Check username uniqueness if changing
    if (username && username !== existing.username) {
      const duplicate = await db.admin.findUnique({ where: { username } });
      if (duplicate) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
    }

    const updateData: Record<string, unknown> = {};
    if (username !== undefined) updateData.username = username;
    if (password) updateData.password = createHash('md5').update(password).digest('hex');
    if (role !== undefined) updateData.role = role;
    if (fullName !== undefined) updateData.fullName = fullName;
    if (mobile !== undefined) updateData.mobile = mobile;
    if (email !== undefined) updateData.email = email;

    const admin = await db.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        fullName: true,
        mobile: true,
        email: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Admins PUT error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const adminId = request.headers.get('x-admin-id');
    if (!adminId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Check if requester is a master
    const requester = await db.admin.findUnique({ where: { id: adminId } });
    if (!requester || requester.role !== 'master') {
      return NextResponse.json({ error: 'Access denied. Master role required.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Admin ID is required' }, { status: 400 });
    }

    // Cannot delete self
    if (id === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const target = await db.admin.findUnique({ where: { id } });
    if (!target) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    // Cannot delete master admin
    if (target.role === 'master') {
      return NextResponse.json({ error: 'Cannot delete master admin' }, { status: 400 });
    }

    await db.admin.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admins DELETE error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
