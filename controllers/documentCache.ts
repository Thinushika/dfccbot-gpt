

import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import {
  ContextChatEngine,
  Document,
  serviceContextFromDefaults,
  VectorStoreIndex,
  SimpleDirectoryReader,
  SimpleNodeParser,
  OpenAI,
  ChatMessage,
  storageContextFromDefaults,
} from "llamaindex";


import * as dotenv from "dotenv";

dotenv.config();

async function getRuntime(func: () => Promise<void>): Promise<number> {
  const start = Date.now();
  await func();
  const end = Date.now();
  return end - start;
}

async function generateDatasource(serviceContext: any /* Replace 'any' with the actual type */) {
  console.log(`Generating storage context...`);
  // Split documents, create embeddings and store them in the storage context
  const ms = await getRuntime(async () => {
    const storageContext = await storageContextFromDefaults({
      persistDir: "./cache",
    });
    const documents = await new SimpleDirectoryReader().loadData({
      directoryPath: "./data",
    });
    await VectorStoreIndex.fromDocuments(documents, {
      storageContext,
      serviceContext,
    });
  });
  console.log(`Storage context successfully generated in ${ms / 1000}s.`);
}

export async function chat(): Promise<string> {

  const serviceContext = serviceContextFromDefaults({
    chunkSize: 512,
    chunkOverlap: 20,
  });
  await generateDatasource(serviceContext);
  return "response";
}

(async () => {
  console.log("Finished generating storage.");
})();
