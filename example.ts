import fs from "node:fs/promises";
import cors from "cors";
import "dotenv/config";
import express, { Express, Request, Response } from "express";
import {
  OpenAI,
  RouterQueryEngine,
  SimpleDirectoryReader,
  SimpleNodeParser,
  SummaryIndex,
  VectorStoreIndex,
  serviceContextFromDefaults,
} from "llamaindex";

async function main() {
  // Load documents from a directory
  const documents = await new SimpleDirectoryReader().loadData({
    directoryPath: "data",
  });

  // Parse the documents into nodes
  const nodeParser = new SimpleNodeParser({
    chunkSize: 1024,
  });

  // Create a service context
  const serviceContext = serviceContextFromDefaults({
    nodeParser,
    llm: new OpenAI(),
  });

  // Create indices
  const vectorIndex = await VectorStoreIndex.fromDocuments(documents, {
    serviceContext,
  });



  // Create query engines
  const vectorQueryEngine = vectorIndex.asQueryEngine();

  // Create a router query engine
  const queryEngine = RouterQueryEngine.fromDefaults({
    queryEngineTools: [
      {
        queryEngine: vectorQueryEngine,
        description: `Useful for summarization questions related to asked questions`,
      },
    ],
    serviceContext,
  });

  const question = "what about rs 100000";

  const specificResponse = await queryEngine.query({
    query: `You are an AI assistant providing helpful advice. Your name is DFCC GPT. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided. If there is basic greeting, greet friendly. Do not give description about greeting.
    You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.
    If you can't find the answer in the context below, just say "Hmm, I am not sure." Don't try to make up an answer.
    If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context. `+question+``,
  });

  console.log({
    answer: specificResponse.response,
    metadata: specificResponse.metadata.selectorResult,
  });
}

main().then(() => console.log("Done"));