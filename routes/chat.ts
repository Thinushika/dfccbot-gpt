import express, { Express, Request, Response } from "express";
import { chat } from "../controllers/chat";

const Router = express.Router();

Router.post('/', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const response = await chat(question);
    res.json(response);

   
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default Router;
