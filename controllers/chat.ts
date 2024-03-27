import {
    ContextChatEngine,
    OpenAI,
    RouterQueryEngine,
    SimpleDirectoryReader,
    SimpleNodeParser,
    SummaryIndex,
    VectorStoreIndex,
    serviceContextFromDefaults,
    TextQaPrompt,
    ResponseSynthesizer,
    CompactAndRefine,
    storageContextFromDefaults
  } from "llamaindex";
  
  async function chat(question: string): Promise<any> {
    try {
      const newTextQaPrompt: TextQaPrompt = ({ context, query }) => {
        return `Context information is below.
        ---------------------
        ${context}
        ---------------------
        Query: ${query}
        Answer the query following the given guidelines as a DFCC AI Assistant.
        1. Do not say you understand the query or any reasons with the answers and do not include suggestions.
        2. if the query is a greeting give a simple friendly response.
        3. Give the answers based on context data only.
        4. Do not search for answers on the internet.
        5. Do not give made up answers.
        6. If you can do calculations based on context data do them.
        7. If there are any links in the context related to the query attach them to the answers.
        8. If you can not find the answers from the context only say "I am sorry", do not give any reasons.
        9. Use the give Chat History to give the best answers possible.
        
        `;
      };

      const serviceContext = serviceContextFromDefaults({
        llm: new OpenAI({ model: "gpt-4-0125-preview" }),
        chunkSize: 512,
        chunkOverlap: 20,
      });
  
      let storageContext = await storageContextFromDefaults({
        persistDir: "./cache",
      });
  
     
      const responseSynthesizer = new ResponseSynthesizer({
        responseBuilder: new CompactAndRefine(serviceContext, newTextQaPrompt),
      });
      
      // Create index
      const index = await VectorStoreIndex.init({
        storageContext,
        serviceContext,
      });

      
      // Query the index
      const queryEngine = index.asQueryEngine({ responseSynthesizer });
      
      const response = await queryEngine.query({
        query: question,
      });

      console.log(response.response);
      return response.response;
    } catch (error) {
      console.error(error);
      throw new Error("An error occurred during the chat process");
    }
  }
  
  export { chat };
  