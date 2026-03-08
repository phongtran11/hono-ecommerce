export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Hono Ecommerce API",
    version: "1.0.0",
    description: "API documentation for the Hono Ecommerce backend",
  },
  servers: [{ url: "/", description: "API Base URL" }],
  paths: {
    "/api/auth/register": {
      post: {
        summary: "Register a new user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password", "name"],
                properties: {
                  email: { type: "string", format: "email", description: "User email" },
                  password: { type: "string", minLength: 6, description: "Password (min 6 chars)" },
                  name: { type: "string", description: "User name" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Registration successful" },
          "400": { description: "Validation error or user already exists" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Login user",
        tags: ["Auth"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Login successful (sets cookies)" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        summary: "Logout user",
        tags: ["Auth"],
        responses: { "200": { description: "Logged out successfully" } },
      },
    },
    "/api/products": {
      get: {
        summary: "List products",
        tags: ["Products"],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
          { name: "categoryId", in: "query", schema: { type: "string", format: "uuid" } },
        ],
        responses: { "200": { description: "Paginated list of products" } },
      },
      post: {
        summary: "Create a product",
        tags: ["Products"],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "description", "vendorId", "categoryId", "variants"],
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  vendorId: { type: "string", format: "uuid" },
                  categoryId: { type: "string", format: "uuid" },
                  variants: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["name", "stock", "prices"],
                      properties: {
                        name: { type: "string" },
                        stock: { type: "integer", minimum: 0 },
                        prices: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: { name: { type: "string" }, price: { type: "number" } },
                          },
                        },
                        images: {
                          type: "array",
                          items: { type: "object", properties: { imageUrl: { type: "string" } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Product created" } },
      },
    },
    "/api/products/{id}": {
      get: {
        summary: "Get product by ID",
        tags: ["Products"],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Product details" }, "404": { description: "Product not found" } },
      },
    },
    "/api/cart": {
      get: {
        summary: "Get cart",
        tags: ["Cart"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Current user's cart" } },
      },
      delete: {
        summary: "Clear cart",
        tags: ["Cart"],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "Cart cleared" } },
      },
    },
    "/api/cart/items": {
      post: {
        summary: "Add item to cart",
        tags: ["Cart"],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["variantId", "quantity"],
                properties: {
                  variantId: { type: "string", format: "uuid" },
                  quantity: { type: "integer", minimum: 1 },
                },
              },
            },
          },
        },
        responses: { "201": { description: "Item added to cart" } },
      },
    },
    "/api/cart/items/{itemId}": {
      patch: {
        summary: "Update cart item",
        tags: ["Cart"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: { quantity: { type: "integer", minimum: 1 } },
              },
            },
          },
        },
        responses: { "200": { description: "Cart item updated" } },
      },
      delete: {
        summary: "Remove item from cart",
        tags: ["Cart"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "itemId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Item removed" } },
      },
    },
    "/api/orders": {
      get: {
        summary: "List orders",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
        ],
        responses: { "200": { description: "Paginated list of orders" } },
      },
      post: {
        summary: "Create order from cart",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        responses: { "201": { description: "Order created" } },
      },
    },
    "/api/orders/{id}": {
      get: {
        summary: "Get order by ID",
        tags: ["Orders"],
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: { "200": { description: "Order details" }, "404": { description: "Order not found" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Access token (or use cookies)",
      },
    },
  },
} as const;
