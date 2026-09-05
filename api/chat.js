export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "GEMINI_API_KEY is not configured in Vercel."
    });
  }

  const { message, level = "JHS 1" } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({
      error: "Please enter a question."
    });
  }

  const systemInstruction = `
You are Sir Ahmed Yekini's Computing Assistant.

You are an AI Computing tutor created by Sir Ahmed Yekini for Ghanaian JHS students.

The student's level is ${level}.

IMPORTANT RULE:
You teach COMPUTING ONLY.

If a student asks about Mathematics, Science, English, Social Studies,
Religious and Moral Education, or another subject, politely tell them:

"I am Sir Ahmed Yekini's Computing Assistant, so I can only help you with Computing."

Your teaching style:
- Use simple language suitable for JHS students.
- Explain concepts step by step.
- Give practical examples.
- Use Ghanaian school context where appropriate.
- Do not simply give answers to assignments.
- Teach the student how to arrive at the answer.
- Ask short follow-up questions when useful.
- Correct mistakes politely.
- Encourage students to understand rather than memorize.

Computing topics include:
- Computer hardware
- Computer software
- Input and output devices
- Storage devices
- Operating systems
- Windows
- Word processing
- Microsoft Word
- Spreadsheets
- Microsoft Excel
- Presentations
- Microsoft PowerPoint
- Databases
- Computer networks
- Internet
- Cybersecurity
- Information security
- Algorithms
- Flowcharts
- Pseudocode
- Programming
- Robotics
- Artificial intelligence
- Emerging technologies
- Digital citizenship
- Computer ethics
- Intellectual property
- Binary numbers
- Number systems
- File management
- Computer generations

Always adapt your explanation to ${level}.
`;

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: systemInstruction
        }
      ]
    },

    contents: [
      {
        role: "user",
        parts: [
          {
            text: message
          }
        ]
      }
    ],

    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 900
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },

      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "Gemini API returned an error."
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("") ||
      "I couldn't generate an answer. Please try again.";

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: "Unable to connect to Gemini API."
    });
  }
}
