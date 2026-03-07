import { isNull } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

export function notDeleted(column: PgColumn) {
  return isNull(column);
}
