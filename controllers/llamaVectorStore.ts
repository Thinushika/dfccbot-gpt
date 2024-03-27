import {
    serviceContextFromDefaults,
    VectorStoreIndex,
    SimpleDirectoryReader,
    SimpleNodeParser,
    OpenAI,
    storageContextFromDefaults,
    TextNode,
    ContextChatEngine,
    ChatHistory,
    SummaryChatHistory,
} from "llamaindex";


import * as dotenv from "dotenv";

dotenv.config();


export async function retriveSearchResults(query: string): Promise<string> {

    // console.log("=============  LLAMA - STARTED ===============")
    const serviceContext = serviceContextFromDefaults({
        llm: new OpenAI({ 
            model: "gpt-4", 
            maxTokens: 150, 
            temperature: 0.4 
        }),
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
    // console.log("user message : ", userMessage)


    //  vector search
    const retriever = vectorIndex.asRetriever();
    retriever.similarityTopK = 2;


    // query engine - search
    // const queryEngine = vectorIndex.asQueryEngine();
    // const results = await queryEngine.query({
    //     query: userMessage,
    // });


    const chatSummeryHistory = new SummaryChatHistory({
        llm: new OpenAI({ model: "gpt-4-0125-preview", maxTokens: 1024 }),
        messages: [],
        tokensToSummarize: 150,
    });
    chatSummeryHistory.addMessage({ role: "user", content: userMessage });


    const chatEngine = new ContextChatEngine({ retriever });
    const results = await chatEngine.chat({
        message: `if the question:${userMessage} is a greeting give a 
        simple friendly response, only give answers based on given provided documents data. If question is not relevent to the context just say "information not provided". Treat every question as a new question and try to answer the questions from the given context unless you feel it has a connection to the history; then you can refer to the old conversation and come up with a good answer.`,
        chatHistory: chatSummeryHistory,
    });

    chatSummeryHistory.addMessage({ role: "assistant", content: results.response });

    // get source nodes
    let responseText = "";

    if (results.sourceNodes) {
        results.sourceNodes.forEach(node => {
            if (node instanceof TextNode) {
                responseText += node.text + "\n";
            }
        });
    } else {
        console.log("sourceNodes is undefined");
    }
    // console.log("SOURCE DOC : ", results.sourceNodes)
    
    console.log("============================================")
    console.log("SOURCE DOC : ", responseText)
    console.log("Llama : ", results.response)

    return responseText;
}
