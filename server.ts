import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());
const PORT = 3000;

// Lazy initialization of Gemini client to prevent crashes if key is missing
let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.");
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Ensure server is healthy
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"
  });
});

// Interactive AI Tutor Chat Route (Roleplay + Translation + Correction)
app.post("/api/chat/respond", async (req, res) => {
  try {
    const ai = getAI();
    const { messages, scenario } = req.body;

    if (!messages || !scenario) {
      return res.status(400).json({ error: "Missing messages or scenario parameters." });
    }

    // Capture the user's latest text to correct it specifically
    const userMessages = messages.filter((m: any) => m.sender === "user");
    const lastUserMessage = userMessages.length > 0 ? userMessages[userMessages.length - 1].text : "";

    // Build the structural instructions
    const promptInstructions = `
You are roleplaying as the character "${scenario.characterName}" whose role is "${scenario.role}".
Context of roleplay: ${scenario.description}
Difficulty level: ${scenario.level} (adjust vocabulary density and complexity accordingly).

Your task:
1. Act completely in character. Greet, respond, or follow up naturally matching your role.
2. Carefully analyze the last English sentence typed by the user: "${lastUserMessage}".
3. Provide constructive, educational grammar and phrasing corrections of that sentence.

Rules for correction:
- Locate spelling errors, faulty tense usage, awkward phrasing, missing prepositions, or preposition mistakes.
- If the text is sound, set hasErrors to false, but still provide 2 beautiful alternate native-sounding ways the user could say this.
- Write a short (1-2 sentences), encouraging, educational tip explained in simple terms.

Generate a JSON object conforming exactly to this schema:
{
  "response": "Your next dialogue line as the character",
  "correction": {
    "hasErrors": true/false,
    "corrected": "A polished, natural version of the user's last sentence (or original if perfect)",
    "explanation": "Friendly, clear grammar explanation or tip (max 2 sentences)",
    "suggestions": ["Alternate phrasing A", "Alternate phrasing B"]
  }
}
    `;

    // Map conversation context for the AI model
    const conversationHistory = messages.map((m: any) => {
      const senderRole = m.sender === "user" ? "user" : "model";
      return `${senderRole.toUpperCase()}: ${m.text}`;
    }).join("\n");

    const fullPrompt = `
${promptInstructions}

CONVERSATION HISTORY:
${conversationHistory}
Please generate the next response now.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: {
              type: Type.STRING,
              description: "The character's next spoken reply in context (1-3 sentences)."
            },
            correction: {
              type: Type.OBJECT,
              properties: {
                hasErrors: {
                  type: Type.BOOLEAN,
                  description: "True if the user's last message has errors/awkwardness."
                },
                corrected: {
                  type: Type.STRING,
                  description: "A corrected and natural-sounding version."
                },
                explanation: {
                  type: Type.STRING,
                  description: "Brief educational tip explaining why or highlighting a grammar point (max 2 sentences)."
                },
                suggestions: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "2 natural alternative ways to say the same thing."
                }
              },
              required: ["hasErrors", "corrected", "explanation", "suggestions"]
            }
          },
          required: ["response", "correction"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);

  } catch (error: any) {
    console.error("AI Chat Route Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate AI dialogue response."
    });
  }
});

// Dynamic Vocabulary Generator Route
app.post("/api/vocab/generate", async (req, res) => {
  try {
    const ai = getAI();
    const { category, level } = req.body;

    if (!category || !level) {
      return res.status(400).json({ error: "Missing category or level." });
    }

    const prompt = `
Generate 5 useful, practical English vocabulary words or expressions for an English learner.
Topic/Category: ${category}
Language Level: ${level} (Beginner, Intermediate, or Advanced)

For each word, provide:
1. The word or phrase.
2. The part of speech (noun, verb, adjective, adverb, idiom, phrasal verb).
3. A simple, easy to understand definition.
4. A realistic, high-quality example sentence in daily/work conversation.

Generate a JSON array of objects with the exact schema.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING, description: "The English word or expression." },
              partOfSpeech: { type: Type.STRING, description: "Part of speech designation." },
              definition: { type: Type.STRING, description: "A simple dictionary style definition." },
              exampleSentence: { type: Type.STRING, description: "Realistic example sentence using the word." },
              level: { type: Type.STRING, description: "Must be: " + level },
              category: { type: Type.STRING, description: "Must be: " + category }
            },
            required: ["word", "partOfSpeech", "definition", "exampleSentence", "level", "category"]
          }
        }
      }
    });

    const words = JSON.parse(response.text?.trim() || "[]");
    res.json({ words });

  } catch (error: any) {
    console.error("AI Vocab Generate Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate custom vocabulary words."
    });
  }
});

// User Vocabulary Sentence Verifier Route
app.post("/api/vocab/evaluate-sentence", async (req, res) => {
  try {
    const ai = getAI();
    const { word, userSentence } = req.body;

    if (!word || !userSentence) {
      return res.status(400).json({ error: "Missing word or userSentence parameter." });
    }

    const prompt = `
The student is practicing English by writing a sentence using the word: "${word}".
The student wrote: "${userSentence}"

Evaluate their sentence:
1. Is the word used correctly (both grammatically and logically)?
2. Is the overall sentence grammatically correct, natural, and spelling-error free?
3. Give an overall score from 1 up to 10 (10 being perfect native level).
4. Provide a corrected version of the sentence (keep it close to their original concept, just make it correct and highly natural).
5. Add a friendly, helpful explanation in simple English. Keep it under 2 sentences.

Generate a JSON object matching this schema:
{
  "isCorrect": true/false,
  "score": 8,
  "corrected": "Corrected sentence",
  "explanation": "Friendly feedback and quick grammar lesson."
}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: { type: Type.BOOLEAN, description: "True if the word is used correctly and sentence structure is decent." },
            score: { type: Type.INTEGER, description: "Legibility, correctness and natural fit score from 1 to 10." },
            corrected: { type: Type.STRING, description: "A grammatically flawless or highly polished correct version of the sentence." },
            explanation: { type: Type.STRING, description: "Encouraging explanation of grammatical errors or praise of good usage." }
          },
          required: ["isCorrect", "score", "corrected", "explanation"]
        }
      }
    });

    const parsedData = JSON.parse(response.text?.trim() || "{}");
    res.json(parsedData);

  } catch (error: any) {
    console.error("AI Vocab Evaluate Error:", error);
    res.status(500).json({
      error: error.message || "Failed to analyze phrase usage."
    });
  }
});

// Dynamic Adaptive Quiz Generator Route
app.post("/api/quiz/generate", async (req, res) => {
  try {
    const ai = getAI();
    const { category, difficulty } = req.body;

    if (!category || !difficulty) {
      return res.status(400).json({ error: "Missing category or difficulty." });
    }

    const prompt = `
Generate 3 unique, high-quality multiple choice English learning questions.
Category: ${category} (e.g. grammar, vocabulary, idioms, phrasal verbs, formal phrases)
Difficulty: ${difficulty} (Beginner, Intermediate, or Advanced)

For each question, ensure:
1. A clear, contextual question or fill-in-the-blank prompt.
2. Exactly 4 logical, realistic choices (options) labelled.
3. Only ONE choice is correct.
4. Provide the correct index (0-based: 0, 1, 2, or 3).
5. A detailed, helpful explanation explaining why the correct option is right and highlighting key learning points for the incorrect ones.

Generate a JSON array of size 3 conforming exactly to this schema:
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: "The multiple choice question text." },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Array of exactly 4 choices."
              },
              answerIndex: { type: Type.INTEGER, description: "0-based index of the correct answer." },
              explanation: { type: Type.STRING, description: "Clear explanation of the grammar/vocabulary rule." },
              category: { type: Type.STRING, description: "Must be: " + category },
              difficulty: { type: Type.STRING, description: "Must be: " + difficulty }
            },
            required: ["question", "options", "answerIndex", "explanation", "category", "difficulty"]
          }
        }
      }
    });

    const questions = JSON.parse(response.text?.trim() || "[]");
    res.json({ questions });

  } catch (error: any) {
    console.error("AI Quiz Generate Error:", error);
    res.status(500).json({
      error: error.message || "Failed to generate interactive questions."
    });
  }
});


// Set up Vite / Serve Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
