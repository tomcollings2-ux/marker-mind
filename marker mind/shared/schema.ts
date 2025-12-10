import { sql } from "drizzle-orm";
import { pgTable, text, varchar, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt hash
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const boards = pgTable("boards", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardName: text("board_name").notNull(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const stickyNotes = pgTable("sticky_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  text: text("text").notNull().default(""),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  shape: varchar("shape", { length: 20 }).notNull(),
  rotation: integer("rotation").notNull().default(0),
  width: integer("width"),
  height: integer("height"),
  fontSize: integer("font_size").notNull().default(18),
  fontFamily: varchar("font_family", { length: 50 }).notNull().default("marker"),
  textColor: varchar("text_color", { length: 20 }).notNull().default("#333333"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const drawings = pgTable("drawings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  color: varchar("color", { length: 20 }).notNull(),
  thickness: integer("thickness").notNull(),
  path: jsonb("path").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const textLabels = pgTable("text_labels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  text: text("text").notNull().default(""),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  fontSize: integer("font_size").notNull().default(24),
  fontStyle: varchar("font_style", { length: 20 }).notNull().default("handwritten"),
  color: varchar("color", { length: 20 }).notNull().default("#000000"),
  rotation: integer("rotation").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const lines = pgTable("lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  x1: integer("x1").notNull(),
  y1: integer("y1").notNull(),
  x2: integer("x2").notNull(),
  y2: integer("y2").notNull(),
  color: varchar("color", { length: 20 }).notNull().default("#000000"),
  thickness: integer("thickness").notNull().default(3),
  lineStyle: varchar("line_style", { length: 20 }).notNull().default("solid"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const boardImages = pgTable("board_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  boardId: varchar("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  src: text("src").notNull(),
  x: integer("x").notNull(),
  y: integer("y").notNull(),
  width: integer("width").notNull().default(200),
  height: integer("height").notNull().default(200),
  rotation: integer("rotation").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBoardSchema = createInsertSchema(boards).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStickyNoteSchema = createInsertSchema(stickyNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDrawingSchema = createInsertSchema(drawings).omit({
  id: true,
  createdAt: true,
});

export const insertTextLabelSchema = createInsertSchema(textLabels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLineSchema = createInsertSchema(lines).omit({
  id: true,
  createdAt: true,
});

export const insertBoardImageSchema = createInsertSchema(boardImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial();
export const updateBoardSchema = insertBoardSchema.partial();
export const updateStickyNoteSchema = insertStickyNoteSchema.omit({ boardId: true }).partial();
export const updateTextLabelSchema = insertTextLabelSchema.omit({ boardId: true }).partial();
export const updateLineSchema = insertLineSchema.omit({ boardId: true }).partial();
export const updateBoardImageSchema = insertBoardImageSchema.omit({ boardId: true }).partial();

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boards.$inferSelect;

export type InsertStickyNote = z.infer<typeof insertStickyNoteSchema>;
export type StickyNote = typeof stickyNotes.$inferSelect;

export type InsertDrawing = z.infer<typeof insertDrawingSchema>;
export type Drawing = typeof drawings.$inferSelect;

export type InsertTextLabel = z.infer<typeof insertTextLabelSchema>;
export type TextLabel = typeof textLabels.$inferSelect;

export type InsertLine = z.infer<typeof insertLineSchema>;
export type Line = typeof lines.$inferSelect;

export type InsertBoardImage = z.infer<typeof insertBoardImageSchema>;
export type BoardImage = typeof boardImages.$inferSelect;
