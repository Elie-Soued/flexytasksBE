import express from "express";
import {
  register,
  login,
  forgotPassword,
  updatePassword,
} from "../Controllers/users";

import { authenticateToken } from "../Controllers/tasks";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.post("/updatepassword", authenticateToken, updatePassword);

export default router;
