CREATE TABLE "product_vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"vendor_id" uuid NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cart_items" ADD COLUMN "vendor_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN "vendor_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "product_vendors" ADD CONSTRAINT "product_vendors_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_vendors" ADD CONSTRAINT "product_vendors_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stock";