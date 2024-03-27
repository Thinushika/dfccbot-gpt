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
  ChatMessage,
  OpenAI,
} from "llamaindex";

export async function chatFunction(query: string): Promise<string> {
  const documents = await new SimpleDirectoryReader().loadData({
    directoryPath: "data",
  });
  const nodeParser = new SimpleNodeParser({
    chunkSize: 1024,
  });
  const serviceContext = serviceContextFromDefaults({
    nodeParser,
    llm: new OpenAI({model: "gpt-4-0125-preview"}),
  });

  const vectorIndex = await VectorStoreIndex.fromDocuments(documents, {
    serviceContext,
  });

  const retriever = vectorIndex.asRetriever();
  retriever.similarityTopK = 5;
  const chatEngine = new ContextChatEngine({ retriever });
  const rl = readline.createInterface({ input, output });
  type ChatMessage = {
    role: 'user' | 'assistant';
    content: string;
  };
  
  const conversation: ChatMessage[] = [
    {
      role: 'user',
      content: 'if i deposit Rs 50000 for the aloka account what would be the interest in 2 years time.'
    },
    {
      role: 'assistant',
      content: 'To calculate the interest earned on a deposit of Rs 50,000 in a DFCC Aloka account over 2 years, we will use the interest rate provided for the deposit range of Rs 50,001 - 200,000, which is 4.00% per annum. Since your deposit is Rs 50,000, it falls just below this range, but for the purpose of this calculation, lets proceed as if it qualifies for the 4.00% rate to illustrate the method. If the actual applicable rate is different due to the deposit amount, adjustments would need to be made. Interest calculation for a simple interest scenario (not compounded): \[ \text{Interest} = \text{Principal} \times \text{Rate} \times \text{Time} \] Where: - Principal = Rs 50,000 - Rate = 4.00% per annum (or 0.04 as a decimal) - Time = 2 years \[ \text{Interest} = 50,000 \times 0.04 \times 2 \] \[ \text{Interest} = 2,000 \times 2 \] \[ \text{Interest} = 4,000 \] So, over 2 years, the interest earned on a deposit of Rs 50,000 at an annual interest rate of 4.00% would be Rs 4,000, assuming simple interest. This means the total amount after 2 years would be Rs 54,000 (Rs 50,000 principal + Rs 4,000 interest). However, if the interest is compounded annually or more frequently, the calculation would be slightly different and could result in a higher total due to the effect of compounding. The provided information does not specify if the interest is compounded or calculated in a simple manner, so this calculation assumes simple interest for illustrative purposes.'
    }
  ];

  const stream = await chatEngine.chat({
    message: query,
    chatHistory: conversation,
    stream: true,
  });


  // const stream = await chatEngine.chat({ message: query , chatHistory: conversation, stream: true });
  let response = "";
  for await (const chunk of stream) {
    response += chunk.response;
  }

  return response;
}
