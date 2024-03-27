import { Request, Response } from "express";
import {
  ContextChatEngine,
  serviceContextFromDefaults,
  VectorStoreIndex,
  storageContextFromDefaults,
  OpenAI,
  ChatMessage,
  MessageContent
} from "llamaindex";

const convertMessageContent = (
  textMessage: string,
  imageUrl: string | undefined,
): MessageContent => {
  if (!imageUrl) return textMessage;
  return [
    {
      type: "text",
      text: textMessage,
    },
    {
      type: "image_url",
      image_url: {
        url: imageUrl,
      },
    },
  ];
};

export const chat = async (req: Request, res: Response) => {
  try {
    const { messages, data }: { messages: ChatMessage[]; data: any } = req.body;
    const userMessage = messages.pop();
    
    if (!messages || !userMessage || userMessage.role !== "user") {
      return res.status(400).json({
        error:
          "messages are required in the request body, and the last message must be from the user",
      });
    }

    const serviceContext = serviceContextFromDefaults({
      llm: new OpenAI({ model: "gpt-4-0125-preview" }),
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

    const userMessageContent = convertMessageContent(
      userMessage.content,
      data?.imageUrl,
    );

    const retriever = vectorIndex.asRetriever();
    retriever.similarityTopK = 5;
    const chatEngine = new ContextChatEngine({ retriever });

   
      // This is the first user message, customize the prompt
      // let promptMessage = `. if the question is a greeting give a 
      // simple friendly response otherwise only give answers based on the provided documents data but do the calculation based on the document data 
      // , if there are any links in the documents related give them otherwise give the fonded answers.
      //  if you can't find the answers only say "I am sorry" do not give any reasons. It is important that you answer only based on document data and
      //  do the calculation based on document data and give the available links from the document.`;
      const reqDta = req.body;
      // let promptMessage = `This is the user question "${userMessageContent}".  Answer the question following the given guidelines.
      // It is mandatory you answer according to the given guidelines below.
      // 1. Do not say you understand the question or any reasons with the answers and do not include suggestions.
      // 2. if the question is a greeting give a simple friendly response.
      // 3. Give the answers based on documents data only.
      // 4. Do not search for answers on the internet.
      // 5. Do not give made up answers.
      // 6. If you can do calculations based on documents data do them.
      // 7. If there are any links in the documents related to the questions attach them to the answers.
      // 8. If you can not find the answers from the documents only say "I am sorry", do not give any reasons.
      // 9. Use the give Chat History to give the best answers possible.
      // `;

      
    //   let promptMessage =`This is the user question "${userMessageContent}".  `+reqDta.prompt;
    // const stream = await chatEngine.chat({
    //   message: promptMessage,
    //   chatHistory: messages,
    //   stream: true,
    // });

    const stream = await chatEngine.chat({
      message: userMessageContent,
      chatHistory: messages,
      stream: true,
    });

    let response = "";
    for await (const chunk of stream) {
      response += chunk.response;
    }

    console.log("user message: " + userMessageContent);
    console.log("history: ", messages);
    // Send the response to the client
    res.json({ answer: response, chatHistory: messages });
  } catch (error) {
    console.error("Error processing question:", error);
    res.status(500).json({ error: "An error occurred." });
  }
};
