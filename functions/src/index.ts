
// Triggering a new deployment to access the secret.
import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {defineString} from "firebase-functions/params";
import {GoogleGenerativeAI} from "@google/generative-ai";
import * as cors from "cors";

const corsHandler = cors({origin: true});

const GEMINI_API_KEY = defineString("GEMINI_API_KEY");

export const api = onRequest({secrets: [GEMINI_API_KEY]}, async (request, response) => {
  corsHandler(request, response, async () => {
    if (request.method !== "POST") {
      response.status(405).send("Method Not Allowed");
      return;
    }

    try {
      const {prompt} = request.body;
      if (!prompt) {
        response.status(400).send("Bad Request: prompt is required");
        return;
      }

      logger.info(`Received prompt: ${prompt}`, {structuredData: true});

      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY.value());
      const model = genAI.getGenerativeModel({model: "gemini-pro"});

      const result = await model.generateContentStream(prompt);

      response.setHeader("Content-Type", "text/plain");

      for await (const chunk of result.stream) {
        response.write(chunk.text());
      }

      response.end();

    } catch (error) {
      logger.error("Error processing request:", error);
      if (!response.headersSent) {
        response.status(500).send("Internal Server Error");
      }
    }
  });
});
