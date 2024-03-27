/* eslint-disable turbo/no-undeclared-env-vars */
import cors from "cors";
import "dotenv/config";
import express, { Express, Request, Response } from "express";
import chatRouter from "./routes/chat";
import chatResponse from "./routes/chatResponse";
import path from "path"; // 
const bodyParser = require("body-parser");
const { chatFunction } = require("./controllers/chatFunction");
import documentRouter from "./routes/documentRouter";
const app: Express = express();
const port = parseInt(process.env.PORT || "8008");
app.use('/images', express.static('public/images'));


app.use(express.json());

app.use(express.text());

app.get("/", (req: Request, res: Response) => {
    // Use path.join to create an absolute path to the index.html file
    const indexPath = path.join(__dirname, "public/pages", "chat_engine.html");
    
    // Send the HTML file as a response
    res.sendFile(indexPath);
  });
  app.get("/chat-engine", (req: Request, res: Response) => {
    // Use path.join to create an absolute path to the index.html file
    const indexPath = path.join(__dirname, "public/pages", "chat_engine.html");
    
    // Send the HTML file as a response
    res.sendFile(indexPath);
  });
  app.get("/chat-prompt", (req: Request, res: Response) => {
    // Use path.join to create an absolute path to the index.html file
    const indexPath = path.join(__dirname, "public/pages", "chat_prompt.html");
    
    // Send the HTML file as a response
    res.sendFile(indexPath);
  });
  app.get("/change-prompt", (req: Request, res: Response) => {
    // Use path.join to create an absolute path to the index.html file
    const indexPath = path.join(__dirname, "public/pages", "change_prompt.html");
    
    // Send the HTML file as a response
    res.sendFile(indexPath);
  });
  app.post("/api/chat-engine", async (req, res) => {
    try {
      const question = req.body.question;
      const chatHistory = req.body.chatHistory || [];
      const answer = await chatFunction(question, chatHistory);
      console.log(req.body.chatHistory);
      res.json({ answer, chatHistory });
    } catch (error) {
      console.error("Error processing question:", error);
      res.status(500).json({ error: "An error occurred." });
    }
  });

app.use("/api/chat-response", chatResponse); 
app.use("/api/document-generate", documentRouter);
app.use("/api/chat", chatRouter);
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});
