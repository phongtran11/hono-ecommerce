import { z } from "zod";
import { paginationSchema } from "@/utils/pagination";

export const getOrdersSchema = paginationSchema;

export const orderIdParamSchema = z.object({
  id: z.string().uuid("Invalid order ID"),
});
