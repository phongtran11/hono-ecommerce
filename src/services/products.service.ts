import { and, eq, SQL } from "drizzle-orm";
import { products, productVendors, vendors } from "../db/schema";
import type { Database } from "../db";

export async function getProducts(db: Database, category?: string) {
    let where: SQL<unknown> | undefined = eq(productVendors.productId, products.id);

    if (category) {
        where = and(where, eq(products.category, category));
    }

    const result = await db
        .select({
            id: products.id,
            name: products.name,
            description: products.description,
            price: products.price,
            image: products.image,
            category: products.category,
            vendorId: vendors.id,
            vendorName: vendors.name,
            stock: productVendors.stock,
        })
        .from(products)
        .innerJoin(productVendors, eq(products.id, productVendors.productId))
        .innerJoin(vendors, eq(productVendors.vendorId, vendors.id))
        .where(where);

    return { success: true, data: result, total: result.length };
}

export async function getProductById(db: Database, id: string) {
    const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, id))
        .limit(1);

    if (!product) {
        return { success: false, status: 404, message: "Product not found" };
    }

    const pvRows = await db
        .select({
            vendorId: vendors.id,
            vendorName: vendors.name,
            stock: productVendors.stock,
        })
        .from(productVendors)
        .innerJoin(vendors, eq(productVendors.vendorId, vendors.id))
        .where(eq(productVendors.productId, product.id));

    return { success: true, status: 200, data: { ...product, vendors: pvRows } };
}
