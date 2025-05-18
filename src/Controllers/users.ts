import jwt from "jsonwebtoken";
import { type Request, type Response } from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import { type user } from "../types";
import db from "../db/databse";
import { addDefaultTasks } from "./tasks";
import { RunResult } from "sqlite3";

dotenv.config();

const register = async (req: Request, res: Response) => {
  const { email, password, fullname, username } = req.body;

  const hashedPassword = await hashPassword(password, res);

  try {
    const user = await checkIfUserExists(username);

    if (user) {
      res.status(409).json({ message: "User already exists" });
    } else {
      db.run(
        "INSERT INTO users (username, fullname, password, email) VALUES (?, ?, ?, ?)",
        [username, fullname, hashedPassword, email],
        async function (this: RunResult, err: Error | null) {
          if (err) {
            res
              .status(500)
              .json({ message: "user could be inserted for some reason" });
          }
          await addDefaultTasks(res, this.lastID);
          res.status(200).json({ message: "User registered successfully" });
        }
      );
    }
  } catch (error) {
    res.status(500).json({ message: "could not check if user exists" });
  }
};

const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    const user = await checkIfUserExists(username);
    if (user) {
      const passwordIsMatching = await bcrypt.compare(password, user.password);
      if (passwordIsMatching) {
        const accessToken = jwt.sign(
          user,
          String(process.env.ACCESS_TOKEN_SECRET)
        );
        res.send({ accessToken });
      } else {
        res.json({
          code: 404,
          message: "Invalid username or password",
        });
      }
    } else {
      res.json({
        code: 404,
        message: "Invalid username or password",
      });
    }
  } catch (error: unknown) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const checkIfUserExists = async (username: string) => {
  return new Promise<user | undefined>((resolve, reject) => {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err: Error, user: user) => {
        if (err) reject(err);
        resolve(user);
      }
    );
  });
};

const hashPassword = async (password: string, res: Response) => {
  try {
    return await bcrypt.hash(password, 10);
  } catch (error: unknown) {
    res.status(500).json({ error: "could not hash password" });
  }
};

export { register, login };
