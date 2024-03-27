import OpenAI from "openai";
import { Request, Response } from "express";
import { Pinecone } from '@pinecone-database/pinecone'


const openai = new OpenAI();



export const gptResponse = async (req: Request, res: Response) => {

  console.log("============= NEW CALL ==============");
  console.log("=====================================");
  console.log("=====================================");
  console.log("=====================================");



  if (!process.env.OPENAI_API_KEY || typeof process.env.OPENAI_API_KEY !== 'string') {
    throw new Error('OpenAI API key is not defined or is not a string.');
  }
  const pc = new Pinecone({ apiKey: "687a64aa-177a-4b9a-875f-10ffd8b3f0ed" })
  const index = pc.index("dfccchatbot");
  const namespace = index.namespace('gpt-chat-test-langchain')




  //============= get question ======================
  // get user message with history
  let chatHistory = req.body.messages || [];


  // Get the user question from the chat history
  let userQuestion = "";
  for (let i = chatHistory.length - 1; i >= 0; i--) {
    if (chatHistory[i].role === "user") {
      userQuestion = chatHistory[i].content;
      break;
    }
  }
  console.log("userQuestion : ", userQuestion)




  //============= change context ======================
  async function handleSearchRequest(userQuestion: string) {



    // ================================================================
    // STANDALONE QUESTION GENERATE
    // ================================================================
    const filteredChatHistory = chatHistory.filter((item: { role: string; }) => item.role !== 'system');

    const chatHistoryString = JSON.stringify(filteredChatHistory);

    const questionRephrasePrompt = `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
----------
CHAT HISTORY: {${chatHistoryString}}
----------
FOLLOWUP QUESTION: {${userQuestion}}
----------
Standalone question:`

    const completionQuestion = await openai.completions.create({
      model: "gpt-3.5-turbo-instruct",
      prompt: questionRephrasePrompt,
      max_tokens: 100,
      temperature: 0,
    });

    console.log("chatHistory : ", chatHistory);
    console.log("Standalone Question PROMPT :", questionRephrasePrompt)
    console.log("Standalone Question :", completionQuestion.choices[0].text)




    // =============================================================================
    // create embeddings
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: completionQuestion.choices[0].text,
    });
    // console.log(embedding.data[0].embedding);




    // =============================================================================
    // query from pinecone
    const queryResponse = await namespace.query({
      vector: embedding.data[0].embedding,
      topK: 3,
      includeMetadata: true,
    });
    // console.log("VECTOR RESPONSE : ",queryResponse.matches)






    // =============================================================================
    // get vector documents into one string
    const results: string[] = [];
    queryResponse.matches.forEach(match => {
      if (match.metadata && typeof match.metadata.source === 'string') {
        const filename = match.metadata.source.split('\\').pop()?.split('.pdf')[0];
        const result = `Title: ${filename}, \n Content: ${match.metadata.text} \n \n `;
        results.push(result);
      }
    });
    let context = results.join('\n');
    console.log("CONTEXT : ", context);



    // set system prompt
    // =============================================================================
    if (chatHistory.length === 0 || chatHistory[0].role !== 'system') {
      chatHistory.unshift({ role: 'system', content: '' });
    }
    chatHistory[0].content = `You are a helpful assistant and you are friendly. Your name is DFCC GPT. Answer user question based on given Context: ${context}, If it has math question relevent to given Context give calculated answer, If user question is not relevent to the Context just say "I'm sorry.. information not provided".`;
    // console.log("Frontend Question : ", chatHistory);
  }



  async function processRequest(userQuestion: string) {
    await handleSearchRequest(userQuestion);


    // GPT response ===========================
    try {

      // chat streaming
      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: chatHistory,
        frequency_penalty: 0.6,
        max_tokens: 150,
        temperature: 0.6
      });


      // get streaming data into a variable
      // let contentArray = [];
      // for await (const chunk of completion) {
      //   contentArray.push(chunk.choices[0].delta.content);
      // }
      // const chatTextHistory = contentArray.join('');

      let botResponse = completion.choices[0].message.content
      console.log("GPT : ", botResponse);

      
      // add assistant to array
      chatHistory.push({ role: 'assistant', content: botResponse });

      res.json({ answer: botResponse, chatHistory: chatHistory });


    } catch (error) {
      console.error("Error processing question:", error);
      res.status(500).json({ error: "An error occurred." });
    }
  }
  await processRequest(userQuestion);

}









