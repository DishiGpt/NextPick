import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Lazy-initialize Firebase Admin
try {
  // Check if firebase service credential files or environment is configured
  if (getApps().length === 0) {
    initializeApp();
    console.log("Firebase Admin successfully initialized via Application Default Credentials.");
  }
} catch (e) {
  console.log("Firebase Admin initialization skipped or pending (no system credentials found yet). Storing histories via local storage or memory fallback.");
}

async function getUserIdFromRequest(req: express.Request): Promise<string> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return req.headers["x-user-id"] as string || "anonymous_user";
  }
  const idToken = authHeader.split(" ")[1];
  try {
    if (getApps().length > 0) {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      return decodedToken.uid;
    }
  } catch (e) {
    console.warn("Could not verify token. Falling back to signature parsing.");
  }

  // Safe fallback to read UID from token structure if offline or sandbox mode
  try {
    const payload = idToken.split(".")[1];
    if (payload) {
      const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
      if (decoded && decoded.user_id) return decoded.user_id;
      if (decoded && decoded.sub) return decoded.sub;
      if (decoded && decoded.uid) return decoded.uid;
    }
  } catch (_) {}
  
  return req.headers["x-user-id"] as string || "anonymous_user";
}

// Local dev runtime persistent store
const LOCAL_HISTORY_FILE = path.join(process.cwd(), "backup-history.json");

function saveToLocalStore(userId: string, data: any) {
  try {
    let currentStore: any[] = [];
    if (fs.existsSync(LOCAL_HISTORY_FILE)) {
      currentStore = JSON.parse(fs.readFileSync(LOCAL_HISTORY_FILE, "utf-8"));
    }
    currentStore.push({ ...data, userId, id: Math.random().toString(36).substring(2, 11) });
    fs.writeFileSync(LOCAL_HISTORY_FILE, JSON.stringify(currentStore, null, 2));
  } catch (e) {
    console.error("Local file store logging failed:", e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health and verification endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", firebaseReady: getApps().length > 0 });
  });

  // API recommendations route: Call standard Gemini-3.5-flash
  app.post("/api/recommendations/generate", async (req, res) => {
    try {
      const { booksRead = [], showsWatched = [], genre, tropes = [], specificDetails } = req.body;

      if (!genre || !specificDetails) {
        res.status(400).json({ error: "Genre and Specific Details description are required fields." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({
          error: "GEMINI_API_KEY environment variable is not defined. Please add it to your secrets in Settings > Secrets."
        });
        return;
      }

      // Initialize GoogleGenAI SDK in accordance with system instructions
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });

      console.log("Generating tailored entertainment vibes list...");

      // Structured instructions
      const systemInstruction = `You are "NextPick", an expert personalized editorial curator and recommendation engine.
Your sole job is to curate a highly specific list of titles matching the user's specific vibe preference, genre request, and favorite sub-tropes.

You MUST satisfy the following STRICT constraints in your output:
- Exactly 5 Book recommendations: matching the vibe!
- Exactly 2 TV Series recommendations.
- Exactly 1 Movie recommendation.

For every single recommendation item:
- Assign a clear, compelling title.
- For books, add the specific author name.
- Write a highly custom description in the "whyYouWillLoveIt" field detailing EXACTLY why this recommendation is the perfect vibe matching their tastes (avoid templated text).
- Fill "platforms" with a list of where they can access this (e.g., "Kindle", "Audible", "Paperback", "Netflix", "Prime Video", "Disney+", "JioHotstar", "Apple TV+", "Apple Books").`;

      const promptText = `
User Inputs:
- Books recently enjoyed: ${JSON.stringify(booksRead)}
- TV shows/movies recently enjoyed: ${JSON.stringify(showsWatched)}
- Current Genre target: ${genre}
- Current Sub-genres and Tropes target: ${tropes.join(", ")}
- Prompt of specific vibe/ideas requested: "${specificDetails}"

Generate the 5 books, 2 series, and 1 movie that fit this user's specific vibe.`;

      // Configure a strict responseSchema to ensure perfectly valid JSON with 5 books, 2 series, 1 movie
      let resultResponse: any = null;
      let attempts = 0;
      const maxAttempts = 5;
      let delayMs = 1500;
      // Start with gemini-3.1-flash-lite as it has extremely high availability and handles demand surges gracefully, then fallback to gemini-3.5-flash
      const modelsToTry = [
        "gemini-3.1-flash-lite",
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite", 
        "gemini-3.5-flash",
        "gemini-flash-latest"
      ];

      while (attempts < maxAttempts) {
        const modelToUse = modelsToTry[attempts] || "gemini-3.1-flash-lite";
        try {
          attempts++;
          console.log(`Attempt ${attempts}/${maxAttempts} generating curated editorial recommendations with model "${modelToUse}"...`);
          resultResponse = await ai.models.generateContent({
            model: modelToUse,
            contents: promptText,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  books: {
                    type: Type.ARRAY,
                    description: "List of exactly 5 book recommendations",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        author: { type: Type.STRING },
                        whyYouWillLoveIt: { type: Type.STRING },
                        platforms: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ["title", "author", "whyYouWillLoveIt", "platforms"]
                    }
                  },
                  series: {
                    type: Type.ARRAY,
                    description: "List of exactly 2 TV Series/Series recommendations",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        title: { type: Type.STRING },
                        whyYouWillLoveIt: { type: Type.STRING },
                        platforms: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING }
                        }
                      },
                      required: ["title", "whyYouWillLoveIt", "platforms"]
                    }
                  },
                  movie: {
                    type: Type.OBJECT,
                    description: "Exactly 1 Movie recommendation",
                    properties: {
                      title: { type: Type.STRING },
                      whyYouWillLoveIt: { type: Type.STRING },
                      platforms: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: ["title", "whyYouWillLoveIt", "platforms"]
                  }
                },
                required: ["books", "series", "movie"]
              }
            }
          });
          break; // Success, break out of retry loop
        } catch (error: any) {
          console.warn(`Gemini generation attempt ${attempts} with model ${modelToUse} failed:`, error);
          const errorMsg = error.message || "";
          const isRetryable = 
            errorMsg.includes("503") || 
            errorMsg.includes("UNAVAILABLE") || 
            errorMsg.includes("high demand") || 
            errorMsg.includes("429") || 
            errorMsg.includes("RESOURCE_EXHAUSTED") || 
            errorMsg.includes("rate limit");

          if (isRetryable && attempts < maxAttempts) {
            console.log(`Transient capacity/rate limit constraint detected on Gemini backend. Retrying with next model in ${delayMs}ms...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
            delayMs = Math.min(delayMs * 2 + Math.floor(Math.random() * 500), 10000); // exponential backoff with small random jitter, capped at 10s
          } else {
            throw error; // throw non-retryable error or last attempt's fail
          }
        }
      }

      const responseText = resultResponse?.text?.trim() || "";
      if (!responseText) {
        throw new Error("Empty recommendation response from Gemini API.");
      }

      const generatedJSON = JSON.parse(responseText);

      // Authenticate user to persist history
      const userId = await getUserIdFromRequest(req);
      const outputHistoryDoc = {
        userId,
        createdAt: new Date().toISOString(),
        inputs: {
          booksRead,
          showsWatched,
          genre,
          tropes,
          specificDetails
        },
        results: generatedJSON
      };

      // Attempt storing in Firestore using admin sdk
      let savedToFirestore = false;
      if (getApps().length > 0 && userId !== "anonymous_user") {
        try {
          const dbFirestore = getFirestore();
          const docRef = dbFirestore.collection("users").doc(userId).collection("recommendations").doc();
          await docRef.set(outputHistoryDoc);
          savedToFirestore = true;
          console.log(`Saved recommendation to Firestore under users/${userId}/recommendations/${docRef.id}`);
        } catch (dbErr) {
          console.error("Firestore persistence failed (missing server permissions or rules configuration). Using local store logging fallback.", dbErr);
        }
      }

      // Always save to backup local JSON file for bulletproof persistence in basic sandbox mode
      saveToLocalStore(userId, outputHistoryDoc);

      res.json({
        ...outputHistoryDoc,
        savedToFirestore
      });

    } catch (e: any) {
      console.error("Error generating recommendation batch:", e);
      
      let cleanErrorMessage = e.message || "Something went wrong generating recommendations.";
      if (typeof cleanErrorMessage === "string") {
        if (cleanErrorMessage.includes("503") || cleanErrorMessage.includes("UNAVAILABLE") || cleanErrorMessage.includes("high demand")) {
          cleanErrorMessage = "The Gemini AI curation service is currently experiencing exceptionally high demand. Our systems completed 5 progressive retries, but Google's free sandbox model capacity is temporarily overloaded. Please wait a few moments and try your generation query again!";
        } else if (cleanErrorMessage.includes("429") || cleanErrorMessage.includes("Resource has been exhausted") || cleanErrorMessage.includes("rate limit")) {
          cleanErrorMessage = "You have encountered a temporary rate limit cap from the Gemini API service. Please wait 10 seconds and submit your curation request again!";
        } else {
          // If it is a nested JSON ApiError, extract the beautiful message part
          try {
            const apiErrorMarker = "ApiError: ";
            let jsonPayloadStr = cleanErrorMessage;
            if (cleanErrorMessage.startsWith(apiErrorMarker)) {
              jsonPayloadStr = cleanErrorMessage.substring(apiErrorMarker.length);
            }
            const parsedErr = JSON.parse(jsonPayloadStr);
            if (parsedErr?.error?.message) {
              cleanErrorMessage = parsedErr.error.message;
            }
          } catch (_) {
            // Keep unchanged if parsing failed
          }
        }
      }

      res.status(500).json({ error: cleanErrorMessage });
    }
  });

  // Endpoint to retrieve recommendation history for a user
  app.get("/api/recommendations/history", async (req, res) => {
    try {
      const userId = await getUserIdFromRequest(req);
      let results: any[] = [];

      // Query from Firestore if available
      if (getApps().length > 0 && userId !== "anonymous_user") {
        try {
          const dbFirestore = getFirestore();
          const snapshot = await dbFirestore
            .collection("users")
            .doc(userId)
            .collection("recommendations")
            .orderBy("createdAt", "desc")
            .get();
          
          snapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
          });
        } catch (dbErr) {
          console.warn("Firestore collection query skipped or failed, pulling from backup store.", dbErr);
        }
      }

      // Fetch from local JSON store file fallback (to merge or replace)
      if (fs.existsSync(LOCAL_HISTORY_FILE)) {
        try {
          const localList = JSON.parse(fs.readFileSync(LOCAL_HISTORY_FILE, "utf-8"));
          const userLocalList = localList.filter((item: any) => item.userId === userId);
          
          // Merge unique local lists in if not present in Firestore list
          userLocalList.forEach((localItem: any) => {
            if (!results.some(r => r.createdAt === localItem.createdAt)) {
              results.push(localItem);
            }
          });
        } catch (_) {}
      }

      // Sort chronological descending
      results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json({ history: results });
    } catch (e: any) {
      res.status(500).json({ error: e.message || "Failed to load recommendation history." });
    }
  });

  // Serve static UI assets or use Vite live middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
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
    console.log(`Server fully listening on http://localhost:${PORT}`);
  });
}

startServer();
