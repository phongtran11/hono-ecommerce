import { Hono } from "hono";
import { products } from "../data";
import type { Bindings } from "../types";

const aiRoutes = new Hono<{ Bindings: Bindings }>();

// POST /api/ai/assistant — A simple shopping assistant
aiRoutes.post("/assistant", async (c) => {
  const { prompt } = await c.req.json<{ prompt: string }>();

  if (!prompt) {
    return c.json({ success: false, message: "Prompt is required" }, 400);
  }

  // Inject product context into the prompt
  const productContext = products
    .map((p) => `- ${p.name}: ${p.description} ($${p.price})`)
    .join("\n");

  try {
    const response = await c.env.AI.run("@cf/meta/llama-3-8b-instruct", {
      messages: [
        {
          role: "system",
          content: `You are a helpful shopping assistant for "Hono Ecommerce". 
          Here is our current inventory:\n${productContext}\n
          Answer the user's question about products concisely.`,
        },
        { role: "user", content: prompt },
      ],
    });

    return c.json({ success: true, data: response });
  } catch (err: any) {
    return c.json({ success: false, message: err.message }, 500);
  }
});

export { aiRoutes };
