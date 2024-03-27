// // chatFunction.ts
// import { stdin as input, stdout as output } from "node:process";
// import readline from "node:readline/promises";
// import {
//   ContextChatEngine,
//   Document,
//   serviceContextFromDefaults,
//   VectorStoreIndex,
//   SimpleDirectoryReader,
//   SimpleNodeParser,
//   OpenAI,
//   ChatMessage,
// } from "llamaindex";

// export async function chatFunction(query: string, chatHistory: ChatMessage[]): Promise<string> {
//   const documents = await new SimpleDirectoryReader().loadData({
//     directoryPath: "data",
//   });
//   const nodeParser = new SimpleNodeParser({
//     chunkSize: 1024,
//   });
//   const serviceContext = serviceContextFromDefaults({
//     nodeParser,
//     llm: new OpenAI({model: "gpt-4-0125-preview"}),
//   });

//   const vectorIndex = await VectorStoreIndex.fromDocuments(documents, {
//     serviceContext,
//   });
//   let userMessage = query;
//   const retriever = vectorIndex.asRetriever();
//   retriever.similarityTopK = 5;
//   const chatEngine = new ContextChatEngine({ retriever });
//   const rl = readline.createInterface({ input, output });
//   console.log(chatHistory);
//    const stream = await chatEngine.chat({
//     message:  query + `. if the question is a greeting give a 
//     simple friendly response otherwise only give answers based on the provided documents data but do the calculation based on the document data 
//     , if there are any links in the documents related give them otherwise give the fonded answers.
//      if you can't find the answers only say "I am sorry" do not give any reasons.`,
//     chatHistory: chatHistory,
//     stream: true,
//   });
//   let response = "";
//   for await (const chunk of stream) {
//     response += chunk.response;
//   }
//   chatHistory.push({ role: 'user', content: userMessage});
//   chatHistory.push({ role: 'assistant', content: response });
//   return response;
// }
// mainScript.ts

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

export async function chatFunction(query: string, chatHistory: ChatMessage[]): Promise<string> {
  const documents = await new SimpleDirectoryReader().loadData({
    directoryPath: "data",
  });
  const nodeParser = new SimpleNodeParser({
    chunkSize: 1024,
  });
  const serviceContext = serviceContextFromDefaults({
    nodeParser,
    llm: new OpenAI({ model: "gpt-4-0125-preview" }),
  });

  await generateDatasource(serviceContext);

  const vectorIndex = await VectorStoreIndex.fromDocuments(documents, {
    serviceContext,
  });

  let userMessage = query;
  const retriever = vectorIndex.asRetriever();
  retriever.similarityTopK = 5;
  const chatEngine = new ContextChatEngine({ retriever });
  const rl = readline.createInterface({ input, output });
  console.log(chatHistory);

  const stream = await chatEngine.chat({
    message: query + `. if the question is a greeting give a 
      simple friendly response otherwise only give answers based on the provided documents data but do the calculation based on the document data 
      , if there are any links in the documents related give them otherwise give the fonded answers.
      if you can't find the answers only say "I am sorry" do not give any reasons.`,
    chatHistory: chatHistory,
    stream: true,
  });

  let response = "";
  for await (const chunk of stream) {
    response += chunk.response;
  }

  chatHistory.push({ role: "user", content: userMessage });
  chatHistory.push({ role: "assistant", content: response });
  return response;
}

(async () => {
  const serviceContext = serviceContextFromDefaults({
    chunkSize: 512,
    chunkOverlap: 20,
  });

  await chatFunction("Hello", []); // Example usage with a greeting
  console.log("Finished generating storage.");
})();
