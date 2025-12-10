import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import passport from "passport";
import { requireAuth, hashPassword } from "./auth";
import {
  insertUserSchema,
  insertBoardSchema,
  updateBoardSchema,
  type InsertBoard,
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

  // ============ AUTHENTICATION ============

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const data = insertUserSchema.parse(req.body);

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash password and create user
      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        ...data,
        password: hashedPassword,
      });

      // Auto-login the user after registration
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        // Don't send password back
        const { password: _, ...userWithoutPassword } = user;
        return res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ error: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ error: info?.message || "Login failed" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        return res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  // ============ BOARDS ============

  app.post("/api/boards", requireAuth, async (req: any, res) => {
    try {
      const data = insertBoardSchema.parse(req.body);
      const board = await storage.createBoard(data, req.user.id);
      res.json(board);
    } catch (error) {
      console.error("Board creation error:", error);
      res.status(400).json({ error: "Invalid board data" });
    }
  });

  app.get("/api/boards", requireAuth, async (req: any, res) => {
    try {
      const boards = await storage.getAllBoards(req.user.id);
      res.json(boards);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch boards" });
    }
  });

  app.get("/api/boards/:id", requireAuth, async (req: any, res) => {
    try {
      const boardData = await storage.getBoardWithElements(req.params.id, req.user.id);
      if (!boardData) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(boardData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch board" });
    }
  });

  app.patch("/api/boards/:id", requireAuth, async (req: any, res) => {
    try {
      const data = updateBoardSchema.parse(req.body);
      const board = await storage.updateBoard(req.params.id, req.user.id, data);
      if (!board) {
        return res.status(404).json({ error: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.delete("/api/boards/:id", requireAuth, async (req: any, res) => {
    try {
      await storage.deleteBoard(req.params.id, req.user.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board" });
    }
  });

  app.post("/api/boards/:id/clear", requireAuth, async (req: any, res) => {
    try {
      const board = await storage.getBoard(req.params.id, req.user.id);
      if (!board) {
        return res.status(404).json({ error: "Board not found or unauthorized" });
      }

      await storage.clearBoard(req.params.id);
      res.status(200).json({ message: "Board cleared successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear board" });
    }
  });

  app.post("/api/boards/:id/save", requireAuth, async (req: any, res) => {
    try {
      const board = await storage.getBoard(req.params.id, req.user.id);
      if (!board) {
        return res.status(404).json({ error: "Board not found or unauthorized" });
      }

      await storage.saveBoardContent(req.params.id, req.body);
      res.status(200).json({ message: "Board saved successfully" });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save board" });
    }
  });

  // ============ STICKY NOTES ============

  app.post("/api/sticky-notes", requireAuth, async (req, res) => {
    try {
      const data = insertStickyNoteSchema.parse(req.body);
      const note = await storage.createStickyNote(data);
      res.json(note);
    } catch (error) {
      res.status(400).json({ error: "Invalid sticky note data" });
    }
  });

  app.patch("/api/sticky-notes/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/sticky-notes/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteStickyNote(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete sticky note" });
    }
  });

  // ============ DRAWINGS ============

  app.post("/api/drawings", requireAuth, async (req, res) => {
    try {
      const data = insertDrawingSchema.parse(req.body);
      const drawing = await storage.createDrawing(data);
      res.json(drawing);
    } catch (error) {
      res.status(400).json({ error: "Invalid drawing data" });
    }
  });

  app.delete("/api/drawings/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteDrawing(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete drawing" });
    }
  });

  // ============ TEXT LABELS ============

  app.post("/api/text-labels", requireAuth, async (req, res) => {
    try {
      const data = insertTextLabelSchema.parse(req.body);
      const label = await storage.createTextLabel(data);
      res.json(label);
    } catch (error) {
      res.status(400).json({ error: "Invalid text label data" });
    }
  });

  app.patch("/api/text-labels/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/text-labels/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteTextLabel(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete text label" });
    }
  });

  // ============ LINES ============

  app.post("/api/lines", requireAuth, async (req, res) => {
    try {
      const data = insertLineSchema.parse(req.body);
      const line = await storage.createLine(data);
      res.json(line);
    } catch (error) {
      res.status(400).json({ error: "Invalid line data" });
    }
  });

  app.patch("/api/lines/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/lines/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteLine(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete line" });
    }
  });

  // ============ BOARD IMAGES ============

  app.post("/api/board-images", requireAuth, async (req, res) => {
    try {
      const data = insertBoardImageSchema.parse(req.body);
      const image = await storage.createBoardImage(data);
      res.json(image);
    } catch (error) {
      res.status(400).json({ error: "Invalid board image data" });
    }
  });

  app.patch("/api/board-images/:id", requireAuth, async (req, res) => {
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

  app.delete("/api/board-images/:id", requireAuth, async (req, res) => {
    try {
      await storage.deleteBoardImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete board image" });
    }
  });

  return httpServer;
}
