import { NextFunction, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import db from "../db/databse";
import dotenv from "dotenv";

dotenv.config();

const getAllTasks = async (req: Request, res: Response) => {
  try {
    const { id } = req.body.user;
    const limit = parseInt(req.query.limit as string, 10) || 5;
    let offset = parseInt(req.query.offset as string, 10) || 0;

    db.get(
      "SELECT COUNT(*) AS total FROM tasks WHERE userID = ?",
      [id],
      (err: Error, countResult: any) => {
        if (err) {
          return res
            .status(500)
            .json({ error: "Could not get the total count of tasks" });
        }

        const totalCount = countResult.total;

        if (totalCount === limit) {
          offset = 0;
        }

        db.all(
          "SELECT * FROM tasks WHERE userID = ? ORDER BY id DESC LIMIT ? OFFSET ?",
          [id, limit, offset],
          (err: Error, tasks: any) => {
            if (err) {
              res
                .status(500)
                .json({ error: "Could not get the tasks for that user" });
            }

            res.json({
              tasks,
              meta: {
                totalCount,
              },
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.body.user;
    const { newTask } = req.body;
    await db.run("INSERT INTO tasks (content, userID) VALUES (?, ?)", [
      newTask,
      id,
    ]);

    getAllTasks(req, res);
  } catch (error) {
    res.status(500).json({ error: "could not add task" });
  }
};

const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(401);
  jwt.verify(
    token,
    String(process.env.ACCESS_TOKEN_SECRET),
    (err: Error | null, decoder) => {
      if (err) {
        console.log("err :>> ", err);
        return res.status(403);
      }
      req.body.user = decoder;

      next();
    }
  );
};

const deleteTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userID = req.body.user.id;
    await db.run("DELETE from tasks WHERE id = (?) AND userID = (?)", [
      id,
      userID,
    ]);

    getAllTasks(req, res);
  } catch (error) {
    res.status(500).json({ error: "could not delete task" });
  }
};

const updateTask = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const userID = req.body.user.id;
    const content = req.body.updatedTask;
    const checked = req.body.checkedTask;

    if (content !== undefined) {
      await db.run(
        "UPDATE tasks SET content = (?) WHERE id = (?) AND userID = (?)",
        [content, id, userID]
      );
    }

    if (checked !== undefined) {
      await db.run(
        "UPDATE tasks SET checked = (?) WHERE id = (?) AND userID = (?)",
        [checked, id, userID]
      );
    }

    getAllTasks(req, res);
  } catch (error) {
    res.status(500).json({ error: "Could not update task" });
  }
};

const addDefaultTasks = async (res: Response, id: number) => {
  try {
    for (let i = 0; i < 5; i++) {
      await db.run("INSERT INTO tasks (content, userID) VALUES (?, ?)", [
        "",
        id,
      ]);
    }
  } catch (error) {
    res.status(500).json({ error: "Could not add default tasks" });
  }
};

const deleteAllTasks = async (req: Request, res: Response) => {
  try {
    const userID = req.body.user.id;
    await db.run("DELETE  from tasks WHERE userID = (?)", [userID]);

    getAllTasks(req, res);
  } catch (error) {
    res.status(500).json({ error: "could not delete task" });
  }
};

export {
  getAllTasks,
  authenticateToken,
  addTask,
  deleteTask,
  updateTask,
  addDefaultTasks,
  deleteAllTasks,
};
