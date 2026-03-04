import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/index';
import Inventory from '@/lib/db/models/Inventory';
import { authorize } from '@/lib/auth/session';
import { PERMISSIONS } from '@/lib/rbac/permissions';

/**
 * INVENTORY MANAGEMENT API
 * Multi-tenant supply tracking.
 */

export async function GET(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.VIEW_INVENTORY);
        const { clinicId } = session;

        const { searchParams } = new URL(req.url);
        const category = searchParams.get('category');
        const search = searchParams.get('search');

        const query = { clinicId };
        if (category && category !== 'ALL') query.category = category;
        if (search) query.itemName = { $regex: search, $options: 'i' };

        const items = await Inventory.find(query).sort({ itemName: 1 }).lean();

        return NextResponse.json(items.map(i => ({
            id: i._id.toString(),
            name: i.itemName,
            category: i.category,
            quantity: i.quantity,
            unit: i.unit,
            threshold: i.lowStockThreshold,
            isLow: i.quantity <= i.lowStockThreshold,
            lastRestocked: i.lastRestocked,
            supplier: i.supplier
        })));

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const session = await authorize(PERMISSIONS.MANAGE_INVENTORY);
        const { clinicId } = session;

        const body = await req.json();
        const { id, name, category, quantity, unit, threshold, supplier } = body;

        if (id) {
            const item = await Inventory.findOne({ _id: id, clinicId });
            if (!item) return NextResponse.json({ error: 'Item not found' }, { status: 404 });

            if (name) item.itemName = name;
            if (category) item.category = category;
            if (quantity !== undefined) item.quantity = quantity;
            if (unit) item.unit = unit;
            if (threshold !== undefined) item.lowStockThreshold = threshold;
            if (supplier) item.supplier = supplier;

            await item.save();
            return NextResponse.json({ success: true, item });
        } else {
            if (!name || quantity === undefined) return NextResponse.json({ error: 'Missing Fields' }, { status: 400 });

            const item = await Inventory.create({
                clinicId,
                itemName: name,
                category: category || 'CONSUMABLE',
                quantity,
                unit: unit || 'pcs',
                lowStockThreshold: threshold || 10,
                supplier: supplier || {}
            });

            return NextResponse.json({ success: true, item });
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
