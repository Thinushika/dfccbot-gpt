import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";
import "dotenv/config";
import {
  ContextChatEngine,
  Document,
  serviceContextFromDefaults,
  VectorStoreIndex,
  SimpleDirectoryReader,
  SimpleNodeParser,
  OpenAI,
} from "llamaindex";



async function main() {
  const documents = await new SimpleDirectoryReader().loadData({
    directoryPath: "data",
  });
  const nodeParser = new SimpleNodeParser({
    chunkSize: 1024,
  });
  const serviceContext = serviceContextFromDefaults({
    nodeParser,
    llm: new OpenAI(),
  });

  const vectorIndex = await VectorStoreIndex.fromDocuments(documents, {
    serviceContext,
  });

  const retriever = vectorIndex.asRetriever();
  retriever.similarityTopK = 5;
  const chatEngine = new ContextChatEngine({ retriever });
  const rl = readline.createInterface({ input, output });

  while (true) {
    const query = await rl.question("Query: ");
    const stream = await chatEngine.chat({ message: query, stream: true });
    console.log();
    for await (const chunk of stream) {
      process.stdout.write(chunk.response);
    }
  }
}

main().catch(console.error);