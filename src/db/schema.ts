import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";
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

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  website: text("website"),
  sector: text("sector").notNull().default(""),
  size: text("size").notNull().default(""),
  description: text("description").notNull().default(""),
  businessModel: text("business_model").notNull().default(""),
  keyProducts: text("key_products").notNull().default(""),
  marketScope: text("market_scope").notNull().default(""),
  headquarters: text("headquarters").notNull().default(""),
  approvedSourceUrls: jsonb("approved_source_urls")
    .$type<string[]>()
    .notNull()
    .default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const organizationSources = pgTable("organization_sources", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  title: text("title").notNull().default(""),
  excerpt: text("excerpt").notNull().default(""),
  status: text("status").notNull().default("proposed"),
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
  organizationId: uuid("organization_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  brandStyleId: uuid("brand_style_id").references(() => brandStyles.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  organizationName: text("organization_name").notNull(),
  sector: text("sector").notNull(),
  size: text("size").notNull(),
  description: text("description").notNull().default(""),
  projectGoals: text("project_goals").notNull().default(""),
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

export const actionPlanItems = pgTable("action_plan_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sourceAnalysisId: uuid("source_analysis_id").references(() => analyses.id, {
    onDelete: "set null",
  }),
  sourceRecommendationIndex: integer("source_recommendation_index"),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  owner: text("owner").notNull().default(""),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("todo"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  brandStyles: many(brandStyles),
  organizations: many(organizations),
}));

export const brandStylesRelations = relations(brandStyles, ({ one, many }) => ({
  user: one(users, {
    fields: [brandStyles.userId],
    references: [users.id],
  }),
  projects: many(projects),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  user: one(users, {
    fields: [organizations.userId],
    references: [users.id],
  }),
  projects: many(projects),
  sources: many(organizationSources),
}));

export const organizationSourcesRelations = relations(
  organizationSources,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationSources.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(users, {
    fields: [projects.userId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  brandStyle: one(brandStyles, {
    fields: [projects.brandStyleId],
    references: [brandStyles.id],
  }),
  analyses: many(analyses),
  reports: many(reports),
  actionPlanItems: many(actionPlanItems),
}));

export const analysesRelations = relations(analyses, ({ one, many }) => ({
  project: one(projects, {
    fields: [analyses.projectId],
    references: [projects.id],
  }),
  actionPlanItems: many(actionPlanItems),
}));

export const actionPlanItemsRelations = relations(actionPlanItems, ({ one }) => ({
  project: one(projects, {
    fields: [actionPlanItems.projectId],
    references: [projects.id],
  }),
  sourceAnalysis: one(analyses, {
    fields: [actionPlanItems.sourceAnalysisId],
    references: [analyses.id],
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
export type Organization = typeof organizations.$inferSelect;
export type OrganizationSource = typeof organizationSources.$inferSelect;
export type Project = typeof projects.$inferSelect;
export type Analysis = typeof analyses.$inferSelect;
export type Report = typeof reports.$inferSelect;
export type ActionPlanItem = typeof actionPlanItems.$inferSelect;
