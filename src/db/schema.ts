import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email"),
  name: text("name"),
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const brandStyles = pgTable("brand_styles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  accentColor: text("accent_color").notNull().default("#185FA5"),
  secondaryColor: text("secondary_color").notNull().default("#0F172A"),
  mutedColor: text("muted_color").notNull().default("#64748B"),
  logoUrl: text("logo_url"),
  footerText: text("footer_text").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  brandStyleId: uuid("brand_style_id").references(() => brandStyles.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  organizationName: text("organization_name").notNull(),
  sector: text("sector").notNull(),
  size: text("size").notNull(),
  description: text("description").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  modelId: text("model_id").notNull(),
  modelName: text("model_name").notNull(),
  inputData: jsonb("input_data").$type<Record<string, unknown>>().notNull(),
  outputData: jsonb("output_data")
    .$type<Record<string, unknown> | null>()
    .default(null),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const reports = pgTable("reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  reportType: text("report_type").notNull(),
  title: text("title"),
  content: text("content").notNull().default(""),
  selectedAnalysisIds: jsonb("selected_analysis_ids")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  brandStyles: many(brandStyles),
}));

export const brandStylesRelations = relations(brandStyles, ({ one, many }) => ({
  user: one(users, {
    fields: [brandStyles.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  brandStyle: one(brandStyles, {
    fields: [projects.brandStyleId],
    references: [brandStyles.id],
  }),
  analyses: many(analyses),
  reports: many(reports),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  project: one(projects, {
    fields: [analyses.projectId],
    references: [projects.id],
  }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
  project: one(projects, {
    fields: [reports.projectId],
    references: [projects.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type BrandStyle = typeof brandStyles.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type Report = typeof reports.$inferSelect;
