// chatFunction.ts
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import {
  ContextChatEngine,
  Document,
  serviceContextFromDefaults,
  VectorStoreIndex,
  SimpleDirectoryReader,
  SimpleNodeParser,
  storageContextFromDefaults,
  OpenAI,
  ChatMessage,
} from "llamaindex";

export async function chatFunction(query: string, chatHistory: ChatMessage[]): Promise<string> {
  // const documents = await new SimpleDirectoryReader().loadData({
  //   directoryPath: "data",
  // });
  // const nodeParser = new SimpleNodeParser({
  //   chunkSize: 1024,
  // });
  // const serviceContext = serviceContextFromDefaults({
  //   nodeParser,
  //   llm: new OpenAI({model: "gpt-4-0125-preview"}),
  // });

  // const vectorIndex = await VectorStoreIndex.fromDocuments(documents, {
  //   serviceContext,
  // });
  const serviceContext = serviceContextFromDefaults({
    llm: new OpenAI({model: "gpt-4-0125-preview"}),
    chunkSize: 512,
    chunkOverlap: 20,
  });
  let storageContext = await storageContextFromDefaults({
    persistDir: "./cache",
  });

  const vectorIndex = await VectorStoreIndex.init({
    storageContext,
    serviceContext,
  });
  let userMessage = query;
  const retriever = vectorIndex.asRetriever();
  retriever.similarityTopK = 5;
  const chatEngine = new ContextChatEngine({ retriever });
  const rl = readline.createInterface({ input, output });
  console.log(chatHistory);
   const stream = await chatEngine.chat({
    message:  query + `. if the question is a greeting give a 
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
  chatHistory.push({ role: 'assistant', content: response });
  chatHistory.push({ role: 'user', content: userMessage});
  return response;
}
