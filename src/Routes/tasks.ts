import express from "express";
import {
  getAllTasks,
  authenticateToken,
  addTask,
  deleteTask,
  deleteAllTasks,
  updateTask,
} from "../Controllers/tasks";

const router = express.Router();

router.get("/", authenticateToken, getAllTasks);
router.post("/", authenticateToken, addTask);
router.delete("/:id", authenticateToken, deleteTask);
router.delete("/", authenticateToken, deleteAllTasks);
router.put("/:id", authenticateToken, updateTask);

export default router;
