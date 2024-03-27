import express, { Express, Request, Response } from "express";
import { chat } from "../controllers/documentCache";

const Router = express.Router();

Router.get('/', async (req: Request, res: Response) => {
  try {
    const response = await chat();
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default Router;
