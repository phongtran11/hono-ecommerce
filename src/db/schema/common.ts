import { sql } from "drizzle-orm";
import { timestamp } from "drizzle-orm/pg-core";

export const auditColumns = {
  createdAt: timestamp("created_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", {
    withTimezone: true,
  })
    .defaultNow()
    .notNull()
    .$onUpdate(() => sql`CURRENT_TIMESTAMP`),
  deletedAt: timestamp("deleted_at", {
    withTimezone: true,
  }),
};
