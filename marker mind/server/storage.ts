import { drizzle } from "drizzle-orm/node-postgres";
import pkg from 'pg';
const { Pool } = pkg;
import { 
  boards, 
  stickyNotes, 
  drawings,
  textLabels,
  lines,
  boardImages,
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
  // Boards
  createBoard(board: InsertBoard): Promise<Board>;
  getBoard(id: string): Promise<Board | undefined>;
  getAllBoards(): Promise<Board[]>;
  updateBoard(id: string, updates: Partial<InsertBoard>): Promise<Board | undefined>;
  deleteBoard(id: string): Promise<void>;

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
  getBoardWithElements(id: string): Promise<{
    board: Board;
    stickyNotes: StickyNote[];
    drawings: Drawing[];
    textLabels: TextLabel[];
    lines: Line[];
    images: BoardImage[];
  } | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const [board] = await db.insert(boards).values(insertBoard).returning();
    return board;
  }

  async getBoard(id: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(eq(boards.id, id));
    return board;
  }

  async getAllBoards(): Promise<Board[]> {
    return await db.select().from(boards).orderBy(desc(boards.updatedAt));
  }

  async updateBoard(id: string, updates: Partial<InsertBoard>): Promise<Board | undefined> {
    const [board] = await db
      .update(boards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(boards.id, id))
      .returning();
    return board;
  }

  async deleteBoard(id: string): Promise<void> {
    await db.delete(boards).where(eq(boards.id, id));
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

  async getBoardWithElements(id: string): Promise<{
    board: Board;
    stickyNotes: StickyNote[];
    drawings: Drawing[];
    textLabels: TextLabel[];
    lines: Line[];
    images: BoardImage[];
  } | undefined> {
    const board = await this.getBoard(id);
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
}

export const storage = new DatabaseStorage();
