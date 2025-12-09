import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertBoardSchema, 
  updateBoardSchema,
  insertStickyNoteSchema,
  updateStickyNoteSchema,
  insertDrawingSchema,
  insertTextLabelSchema,
  updateTextLabelSchema,
  insertLineSchema,
  updateLineSchema,
  insertBoardImageSchema,
  updateBoardImageSchema
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // ============ BOARDS ============
  
  app.post("/api/boards", async (req, res) => {
    try {
      const data = insertBoardSchema.parse(req.body);
      const board = await storage.createBoard(data);
      res.json(board);
    } catch (error) {
      res.status(400).json({ error: "Invalid board data" });
    }
  });

  app.get("/api/boards", async (req, res) => {
    try {
      const boards = await storage.getAllBoards();
      res.json(boards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch boards" });
    }
  });

  app.get("/api/boards/:id", async (req, res) => {
    try {
      const boardData = await storage.getBoardWithElements(req.params.id);
      if (!boardData) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(boardData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch board" });
    }
  });

  app.patch("/api/boards/:id", async (req, res) => {
    try {
      const data = updateBoardSchema.parse(req.body);
      const board = await storage.updateBoard(req.params.id, data);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/boards/:id", async (req, res) => {
    try {
      await storage.deleteBoard(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board" });
    }
  });

  // ============ STICKY NOTES ============
  
  app.post("/api/sticky-notes", async (req, res) => {
    try {
      const data = insertStickyNoteSchema.parse(req.body);
      const note = await storage.createStickyNote(data);
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid sticky note data" });
    }
  });

  app.patch("/api/sticky-notes/:id", async (req, res) => {
    try {
      const data = updateStickyNoteSchema.parse(req.body);
      const note = await storage.updateStickyNote(req.params.id, data);
      if (!note) {
        return res.status(404).json({ error: "Sticky note not found" });
      }
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/sticky-notes/:id", async (req, res) => {
    try {
      await storage.deleteStickyNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sticky note" });
    }
  });

  // ============ DRAWINGS ============
  
  app.post("/api/drawings", async (req, res) => {
    try {
      const data = insertDrawingSchema.parse(req.body);
      const drawing = await storage.createDrawing(data);
      res.json(drawing);
    } catch (error) {
      res.status(400).json({ error: "Invalid drawing data" });
    }
  });

  app.delete("/api/drawings/:id", async (req, res) => {
    try {
      await storage.deleteDrawing(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete drawing" });
    }
  });

  // ============ TEXT LABELS ============
  
  app.post("/api/text-labels", async (req, res) => {
    try {
      const data = insertTextLabelSchema.parse(req.body);
      const label = await storage.createTextLabel(data);
      res.json(label);
    } catch (error) {
      res.status(400).json({ error: "Invalid text label data" });
    }
  });

  app.patch("/api/text-labels/:id", async (req, res) => {
    try {
      const data = updateTextLabelSchema.parse(req.body);
      const label = await storage.updateTextLabel(req.params.id, data);
      if (!label) {
        return res.status(404).json({ error: "Text label not found" });
      }
      res.json(label);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/text-labels/:id", async (req, res) => {
    try {
      await storage.deleteTextLabel(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete text label" });
    }
  });

  // ============ LINES ============
  
  app.post("/api/lines", async (req, res) => {
    try {
      const data = insertLineSchema.parse(req.body);
      const line = await storage.createLine(data);
      res.json(line);
    } catch (error) {
      res.status(400).json({ error: "Invalid line data" });
    }
  });

  app.patch("/api/lines/:id", async (req, res) => {
    try {
      const data = updateLineSchema.parse(req.body);
      const line = await storage.updateLine(req.params.id, data);
      if (!line) {
        return res.status(404).json({ error: "Line not found" });
      }
      res.json(line);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/lines/:id", async (req, res) => {
    try {
      await storage.deleteLine(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete line" });
    }
  });

  // ============ BOARD IMAGES ============
  
  app.post("/api/board-images", async (req, res) => {
    try {
      const data = insertBoardImageSchema.parse(req.body);
      const image = await storage.createBoardImage(data);
      res.json(image);
    } catch (error) {
      res.status(400).json({ error: "Invalid board image data" });
    }
  });

  app.patch("/api/board-images/:id", async (req, res) => {
    try {
      const data = updateBoardImageSchema.parse(req.body);
      const image = await storage.updateBoardImage(req.params.id, data);
      if (!image) {
        return res.status(404).json({ error: "Board image not found" });
      }
      res.json(image);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/board-images/:id", async (req, res) => {
    try {
      await storage.deleteBoardImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board image" });
    }
  });

  return httpServer;
}
