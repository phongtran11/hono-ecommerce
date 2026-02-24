import { eq, and, sql } from "drizzle-orm";
import {
    products,
    productVendors,
    vendors,
    orders,
    orderItems,
} from "../db/schema";
import type { Database } from "../db";

export async function createOrder(
    db: Database,
    userId: string,
    items: { productId: string; vendorId: string; quantity: number }[]
) {
    let total = 0;
    const validatedItems: {
        productId: string;
        vendorId: string;
        quantity: number;
        price: number;
    }[] = [];

    for (const item of items) {
        // Validate product exists
        const [product] = await db
            .select()
            .from(products)
            .where(eq(products.id, item.productId))
            .limit(1);

        if (!product) {
            return {
                success: false,
                status: 404,
                message: `Product ${item.productId} not found`,
            };
        }

        // Validate product-vendor stock
        const [pv] = await db
            .select()
            .from(productVendors)
            .where(
                and(
                    eq(productVendors.productId, item.productId),
                    eq(productVendors.vendorId, item.vendorId)
                )
            )
            .limit(1);

        if (!pv) {
            return {
                success: false,
                status: 404,
                message: `Product-vendor combination not found for product "${product.name}"`,
            };
        }

        if (pv.stock < item.quantity) {
            return {
                success: false,
                status: 400,
                message: `Insufficient stock for "${product.name}" from this vendor. Available: ${pv.stock}`,
            };
        }

        const price = Number(product.price);
        total += price * item.quantity;
        validatedItems.push({
            productId: item.productId,
            vendorId: item.vendorId,
            quantity: item.quantity,
            price,
        });
    }

    // Use transaction for atomicity
    const order = await db.transaction(async (tx) => {
        // Deduct stock from product_vendors
        for (const item of validatedItems) {
            await tx
                .update(productVendors)
                .set({ stock: sql`${productVendors.stock} - ${item.quantity}` })
                .where(
                    and(
                        eq(productVendors.productId, item.productId),
                        eq(productVendors.vendorId, item.vendorId)
                    )
                );
        }

        // Create order
        const [newOrder] = await tx
            .insert(orders)
            .values({
                userId,
                total: String(Math.round(total * 100) / 100),
                status: "pending",
            })
            .returning();

        // Create order items
        await tx.insert(orderItems).values(
            validatedItems.map((item) => ({
                orderId: newOrder.id,
                productId: item.productId,
                vendorId: item.vendorId,
                quantity: item.quantity,
                price: String(item.price),
            }))
        );

        return newOrder;
    });

    return { success: true, status: 201, data: order };
}

export async function getUserOrders(db: Database, userId: string) {
    const userOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.userId, userId));

    return {
        success: true,
        data: userOrders,
        total: userOrders.length,
    };
}

export async function getOrderById(db: Database, userId: string, orderId: string) {
    const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);

    if (!order || order.userId !== userId) {
        return { success: false, status: 404, message: "Order not found" };
    }

    // Get order items with vendor info
    const items = await db
        .select({
            id: orderItems.id,
            productId: orderItems.productId,
            vendorId: orderItems.vendorId,
            quantity: orderItems.quantity,
            price: orderItems.price,
            vendorName: vendors.name,
        })
        .from(orderItems)
        .innerJoin(vendors, eq(orderItems.vendorId, vendors.id))
        .where(eq(orderItems.orderId, orderId));

    return { success: true, status: 200, data: { ...order, items } };
}
