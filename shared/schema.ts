import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Original users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Financial indicator data table
export const indicators = pgTable("indicators", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  frequency: text("frequency").notNull(),
  units: text("units"),
  source: text("source").notNull(),
  lastUpdated: timestamp("last_updated").notNull(),
});

export const insertIndicatorSchema = createInsertSchema(indicators).omit({
  id: true
});

export type InsertIndicator = z.infer<typeof insertIndicatorSchema>;
export type Indicator = typeof indicators.$inferSelect;

// Financial indicator values table
export const values = pgTable("values", {
  id: serial("id").primaryKey(),
  indicatorId: integer("indicator_id").notNull(),
  date: timestamp("date").notNull(),
  value: text("value").notNull(), // Using text to handle various numeric formats
});

export const insertValueSchema = createInsertSchema(values).omit({
  id: true
});

export type InsertValue = z.infer<typeof insertValueSchema>;
export type Value = typeof values.$inferSelect;

// ETL job status
export const etlJobs = pgTable("etl_jobs", {
  id: serial("id").primaryKey(),
  task: text("task").notNull(),
  status: text("status").notNull(), // 'completed', 'failed', 'in_progress', 'scheduled'
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  recordsProcessed: integer("records_processed"),
  error: text("error"),
  metadata: jsonb("metadata"),
});

export const insertEtlJobSchema = createInsertSchema(etlJobs).omit({
  id: true
});

export type InsertEtlJob = z.infer<typeof insertEtlJobSchema>;
export type EtlJob = typeof etlJobs.$inferSelect;

// Analysis results
export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'correlation', 'forecast', etc.
  indicators: text("indicators").array().notNull(),
  parameters: jsonb("parameters").notNull(),
  results: jsonb("results").notNull(),
  createdAt: timestamp("created_at").notNull(),
});

export const insertAnalysisResultSchema = createInsertSchema(analysisResults).omit({
  id: true
});

export type InsertAnalysisResult = z.infer<typeof insertAnalysisResultSchema>;
export type AnalysisResult = typeof analysisResults.$inferSelect;
