import {
    ContextChatEngine,
    OpenAI,
    RouterQueryEngine,
    SimpleDirectoryReader,
    SimpleNodeParser,
    SummaryIndex,
    VectorStoreIndex,
    serviceContextFromDefaults,
  } from "llamaindex";
  
  async function chat(question: string): Promise<any> {
    try {
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
        llm: new OpenAI({model: "gpt-4-0125-preview"}),
      });
  
      // Create indices
      const vectorIndex = await VectorStoreIndex.fromDocuments(documents, {
        serviceContext,
      });

      ///////////////////////////////////////////////////////////////////////////////////////

    //   const retriever = vectorIndex.asRetriever();
    //   retriever.similarityTopK = 5;
    //   const chatEngine = new ContextChatEngine({ retriever });

    //   while (true) {
    //     const query = `You are an AI assistant providing helpful advice. Your name is DFCC GPT. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided. If there is a basic greeting, greet friendly. Do not give a description about greeting.
    //     You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.
    //     If you can't find the answer in the context below, just say "Hmm, I am not sure." Don't try to make up an answer.
    //     If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context. `+ question +``;
    //     const stream = await chatEngine.chat({ message: query, stream: true });
    //     console.log();
    //     for await (const chunk of stream) {
    //       //process.stdout.write(chunk.response);
    //       return {
    //         answer: chunk.response,
    //       };
    //     }
    //   }
      //////////////////////////////////////////////////////////////////////////////////////



  
      // Create query engines
      const vectorQueryEngine = vectorIndex.asQueryEngine();
  
      // Create a router query engine
      const queryEngine = RouterQueryEngine.fromDefaults({
        queryEngineTools: [
          {
            queryEngine: vectorQueryEngine,
            description: `gives the answers based on the document content`,
          },
        ],
        serviceContext,
      });
  
      const specificResponse = await queryEngine.query({
        query: `You are an AI assistant providing helpful advice. You are given the following extracted parts of a long document and a question. Provide a conversational answer based on the context provided. If there is a basic greeting, greet friendly. Do not give a description about greeting.
        You should only provide hyperlinks that reference the context below. Do NOT make up hyperlinks.
        If you can't find the answer in the context below, just say "Hmm, I am not sure." Don't try to make up an answer.
        If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context. `+ question +``,
      });
  
      console.log({
        answer: specificResponse.response,
        metadata: specificResponse.metadata.selectorResult,
      });
      return {
        answer: specificResponse.response,
        metadata: specificResponse.metadata.selectorResult,
      };
    } catch (error) {
      console.error(error);
      throw new Error("An error occurred during the chat process");
    }
  }
  
  export { chat };
  