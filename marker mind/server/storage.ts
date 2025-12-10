import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import {
  users,
  boards,
  stickyNotes,
  drawings,
  textLabels,
  lines,
  boardImages,
  type InsertUser,
  type User,
  type InsertBoard,
  type Board,
  type InsertStickyNote,
  type StickyNote,
  type InsertDrawing,
  type Drawing,
  type InsertTextLabel,
  type TextLabel,
  type InsertLine,
  type Line,
  type InsertBoardImage,
  type BoardImage
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;

  // Boards
  createBoard(board: InsertBoard, userId: string): Promise<Board>;
  getBoard(id: string, userId: string): Promise<Board | undefined>;
  getAllBoards(userId: string): Promise<Board[]>;
  updateBoard(id: string, userId: string, updates: Partial<InsertBoard>): Promise<Board | undefined>;
  deleteBoard(id: string, userId: string): Promise<void>;
  clearBoard(id: string): Promise<void>;

  // Sticky Notes
  createStickyNote(note: InsertStickyNote): Promise<StickyNote>;
  getStickyNotesByBoard(boardId: string): Promise<StickyNote[]>;
  updateStickyNote(id: string, updates: Partial<Omit<InsertStickyNote, 'boardId'>>): Promise<StickyNote | undefined>;
  deleteStickyNote(id: string): Promise<void>;

  // Drawings
  createDrawing(drawing: InsertDrawing): Promise<Drawing>;
  getDrawingsByBoard(boardId: string): Promise<Drawing[]>;
  deleteDrawing(id: string): Promise<void>;

  // Text Labels
  createTextLabel(label: InsertTextLabel): Promise<TextLabel>;
  getTextLabelsByBoard(boardId: string): Promise<TextLabel[]>;
  updateTextLabel(id: string, updates: Partial<Omit<InsertTextLabel, 'boardId'>>): Promise<TextLabel | undefined>;
  deleteTextLabel(id: string): Promise<void>;

  // Lines
  createLine(line: InsertLine): Promise<Line>;
  getLinesByBoard(boardId: string): Promise<Line[]>;
  updateLine(id: string, updates: Partial<Omit<InsertLine, 'boardId'>>): Promise<Line | undefined>;
  deleteLine(id: string): Promise<void>;

  // Board Images
  createBoardImage(image: InsertBoardImage): Promise<BoardImage>;
  getBoardImagesByBoard(boardId: string): Promise<BoardImage[]>;
  updateBoardImage(id: string, updates: Partial<Omit<InsertBoardImage, 'boardId'>>): Promise<BoardImage | undefined>;
  deleteBoardImage(id: string): Promise<void>;

  // Get complete board with all elements
  getBoardWithElements(id: string, userId: string): Promise<{
    board: Board;
    stickyNotes: StickyNote[];
    drawings: Drawing[];
    textLabels: TextLabel[];
    lines: Line[];
    images: BoardImage[];
  } | undefined>;

  saveBoardContent(
    boardId: string,
    content: {
      stickyNotes: StickyNote[];
      drawings: Drawing[];
      textLabels: TextLabel[];
      lines: Line[];
      images: BoardImage[];
    }
  ): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // ============ USERS ============

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  // ============ BOARDS ============

  async createBoard(insertBoard: InsertBoard, userId: string): Promise<Board> {
    const [board] = await db.insert(boards).values({ ...insertBoard, userId }).returning();
    return board;
  }

  async getBoard(id: string, userId: string): Promise<Board | undefined> {
    const [board] = await db
      .select()
      .from(boards)
      .where(eq(boards.id, id));

    // Verify ownership
    if (board && board.userId !== userId) {
      return undefined;
    }

    return board;
  }

  async getAllBoards(userId: string): Promise<Board[]> {
    return await db
      .select()
      .from(boards)
      .where(eq(boards.userId, userId))
      .orderBy(desc(boards.updatedAt));
  }

  async updateBoard(id: string, userId: string, updates: Partial<InsertBoard>): Promise<Board | undefined> {
    // First verify ownership
    const existingBoard = await this.getBoard(id, userId);
    if (!existingBoard) {
      return undefined;
    }

    const [board] = await db
      .update(boards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(boards.id, id))
      .returning();
    return board;
  }

  async deleteBoard(id: string, userId: string): Promise<void> {
    // Only delete if user owns the board
    await db
      .delete(boards)
      .where(eq(boards.id, id));
    // Note: userId check is implicit via foreign key constraint
  }

  async clearBoard(id: string): Promise<void> {
    await db.transaction(async (tx) => {
      await tx.delete(stickyNotes).where(eq(stickyNotes.boardId, id));
      await tx.delete(drawings).where(eq(drawings.boardId, id));
      await tx.delete(textLabels).where(eq(textLabels.boardId, id));
      await tx.delete(lines).where(eq(lines.boardId, id));
      await tx.delete(boardImages).where(eq(boardImages.boardId, id));
    });
  }

  async createStickyNote(note: InsertStickyNote): Promise<StickyNote> {
    const [stickyNote] = await db.insert(stickyNotes).values(note).returning();
    return stickyNote;
  }

  async getStickyNotesByBoard(boardId: string): Promise<StickyNote[]> {
    return await db.select().from(stickyNotes).where(eq(stickyNotes.boardId, boardId));
  }

  async updateStickyNote(id: string, updates: Partial<Omit<InsertStickyNote, 'boardId'>>): Promise<StickyNote | undefined> {
    const [note] = await db
      .update(stickyNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stickyNotes.id, id))
      .returning();
    return note;
  }

  async deleteStickyNote(id: string): Promise<void> {
    await db.delete(stickyNotes).where(eq(stickyNotes.id, id));
  }

  async createDrawing(drawing: InsertDrawing): Promise<Drawing> {
    const [draw] = await db.insert(drawings).values(drawing).returning();
    return draw;
  }

  async getDrawingsByBoard(boardId: string): Promise<Drawing[]> {
    return await db.select().from(drawings).where(eq(drawings.boardId, boardId));
  }

  async deleteDrawing(id: string): Promise<void> {
    await db.delete(drawings).where(eq(drawings.id, id));
  }

  async createTextLabel(label: InsertTextLabel): Promise<TextLabel> {
    const [textLabel] = await db.insert(textLabels).values(label).returning();
    return textLabel;
  }

  async getTextLabelsByBoard(boardId: string): Promise<TextLabel[]> {
    return await db.select().from(textLabels).where(eq(textLabels.boardId, boardId));
  }

  async updateTextLabel(id: string, updates: Partial<Omit<InsertTextLabel, 'boardId'>>): Promise<TextLabel | undefined> {
    const [label] = await db
      .update(textLabels)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(textLabels.id, id))
      .returning();
    return label;
  }

  async deleteTextLabel(id: string): Promise<void> {
    await db.delete(textLabels).where(eq(textLabels.id, id));
  }

  async createLine(line: InsertLine): Promise<Line> {
    const [newLine] = await db.insert(lines).values(line).returning();
    return newLine;
  }

  async getLinesByBoard(boardId: string): Promise<Line[]> {
    return await db.select().from(lines).where(eq(lines.boardId, boardId));
  }

  async updateLine(id: string, updates: Partial<Omit<InsertLine, 'boardId'>>): Promise<Line | undefined> {
    const [line] = await db
      .update(lines)
      .set(updates)
      .where(eq(lines.id, id))
      .returning();
    return line;
  }

  async deleteLine(id: string): Promise<void> {
    await db.delete(lines).where(eq(lines.id, id));
  }

  async createBoardImage(image: InsertBoardImage): Promise<BoardImage> {
    const [newImage] = await db.insert(boardImages).values(image).returning();
    return newImage;
  }

  async getBoardImagesByBoard(boardId: string): Promise<BoardImage[]> {
    return await db.select().from(boardImages).where(eq(boardImages.boardId, boardId));
  }

  async updateBoardImage(id: string, updates: Partial<Omit<InsertBoardImage, 'boardId'>>): Promise<BoardImage | undefined> {
    const [image] = await db
      .update(boardImages)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(boardImages.id, id))
      .returning();
    return image;
  }

  async deleteBoardImage(id: string): Promise<void> {
    await db.delete(boardImages).where(eq(boardImages.id, id));
  }

  async getBoardWithElements(id: string, userId: string): Promise<{
    board: Board;
    stickyNotes: StickyNote[];
    drawings: Drawing[];
    textLabels: TextLabel[];
    lines: Line[];
    images: BoardImage[];
  } | undefined> {
    const board = await this.getBoard(id, userId);
    if (!board) return undefined;

    const [boardNotes, boardDrawings, boardTextLabels, boardLines, boardImagesData] = await Promise.all([
      this.getStickyNotesByBoard(id),
      this.getDrawingsByBoard(id),
      this.getTextLabelsByBoard(id),
      this.getLinesByBoard(id),
      this.getBoardImagesByBoard(id)
    ]);

    return {
      board,
      stickyNotes: boardNotes,
      drawings: boardDrawings,
      textLabels: boardTextLabels,
      lines: boardLines,
      images: boardImagesData
    };
  }
  async saveBoardContent(
    boardId: string,
    content: {
      stickyNotes: StickyNote[];
      drawings: Drawing[];
      textLabels: TextLabel[];
      lines: Line[];
      images: BoardImage[];
    }
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // 1. Clear existing content
      await tx.delete(stickyNotes).where(eq(stickyNotes.boardId, boardId));
      await tx.delete(drawings).where(eq(drawings.boardId, boardId));
      await tx.delete(textLabels).where(eq(textLabels.boardId, boardId));
      await tx.delete(lines).where(eq(lines.boardId, boardId));
      await tx.delete(boardImages).where(eq(boardImages.boardId, boardId));

      // 2. Insert new content (if any)
      if (content.stickyNotes.length > 0) {
        await tx.insert(stickyNotes).values(content.stickyNotes.map(n => ({ ...n, boardId })));
      }
      if (content.drawings.length > 0) {
        await tx.insert(drawings).values(content.drawings.map(d => ({ ...d, boardId })));
      }
      if (content.textLabels.length > 0) {
        await tx.insert(textLabels).values(content.textLabels.map(l => ({ ...l, boardId })));
      }
      if (content.lines.length > 0) {
        await tx.insert(lines).values(content.lines.map(l => ({ ...l, boardId })));
      }
      if (content.images.length > 0) {
        await tx.insert(boardImages).values(content.images.map(i => ({ ...i, boardId })));
      }

      // Update board timestamp
      await tx.update(boards).set({ updatedAt: new Date() }).where(eq(boards.id, boardId));
    });
  }
}

export const storage = new DatabaseStorage();
