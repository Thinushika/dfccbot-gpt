import express from "express";
import { gptResponse } from "../controllers/GPT";
// import { gptResponse } from "../controllers/llamaVectorStore";


const llmRouter = express.Router();

llmRouter.route("/").post(gptResponse);


export default llmRouter;
