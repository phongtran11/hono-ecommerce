# Rules:

- Priority use alias import
- Define type in folder type (Not use interface)
- Define schema in folder schemas
- Define logic in folder service
- Define repository in folder repository
- Define route in folder route
- Define middleware in folder middleware
- Define hook in folder hook
- Define validator in folder validator
- Define helper in folder helper
- Define constant in folder constant
- Export type of databases schema from schema file
  - Example:

```ts
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
```
