const form = document.getElementById("chat-form");
const input = document.getElementById("prompt");
const messages = document.getElementById("messages");
const level = document.getElementById("level");
const send = document.getElementById("send");

let lastQuestion = "";

// Stores the conversation during the current session
let conversationHistory = [];

function formatMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
    .replace(/^\- (.*?)$/gm, "<li>$1</li>")
    .replace(/\n/g, "<br>");
}


function addMessage(text, who = "bot") {
  const row = document.createElement("div");
  row.className = `message ${who}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = who === "bot" ? "SY" : "YOU";

  const body = document.createElement("div");

  const name = document.createElement("b");
  name.textContent =
    who === "bot" ? "Sir Ahmed's Assistant" : "You";

  const p = document.createElement("div");
  p.className = "message-content";
  p.innerHTML = formatMarkdown(text);

  body.append(name, p);
  row.append(avatar, body);

  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}


// Creates a version of the conversation that Gemini can understand
function buildConversationText(newMessage) {
  let conversation = "";

  conversationHistory.forEach(function (item) {
    conversation += `${item.role}: ${item.text}\n\n`;
  });

  conversation += `Student: ${newMessage}`;

  return conversation;
}


async function ask(text, remember = true, displayText = text) {

  if (remember) {
    lastQuestion = text;
  }

  // Show the student's message on screen
  addMessage(displayText, "user");

  input.value = "";
  send.disabled = true;
  send.textContent = "...";


  // Show Thinking message
  const typing = document.createElement("div");
  typing.className = "message bot";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "SY";

  const body = document.createElement("div");

  const name = document.createElement("b");
  name.textContent = "Sir Ahmed's Assistant";

  const p = document.createElement("p");
  p.className = "typing";
  p.textContent = "Thinking...";

  body.append(name, p);
  typing.append(avatar, body);

  messages.append(typing);
  messages.scrollTop = messages.scrollHeight;


  try {

    // Build the full conversation
    const conversationText = buildConversationText(text);

    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: conversationText,
        level: level.value
      })
    });


    const data = await response.json();

    typing.remove();


    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }


    const reply =
      data.reply ||
      "I couldn't produce an answer. Please try again.";


    // Save the conversation
    conversationHistory.push({
      role: "Student",
      text: text
    });

    conversationHistory.push({
      role: "Assistant",
      text: reply
    });


    // Keep the conversation from becoming unnecessarily large
    if (conversationHistory.length > 12) {
      conversationHistory =
        conversationHistory.slice(-12);
    }


    addMessage(reply);


  } catch (error) {

    typing.remove();

    addMessage(
      "Sorry, I couldn't connect to the Computing Assistant right now. Please try again."
    );

    console.error("FULL ERROR:", error);

  } finally {

    send.disabled = false;
    send.textContent = "Send";
    input.focus();

  }
}


// Normal chat submission
form.addEventListener("submit", function (event) {

  event.preventDefault();

  const text = input.value.trim();

  if (text) {
    ask(text);
  }

});


// Starter prompt buttons
document.querySelectorAll("[data-prompt]").forEach(function (button) {

  button.addEventListener("click", function () {

    ask(button.dataset.prompt);

  });

});


// Enter key
input.addEventListener("keydown", function (event) {

  if (event.key === "Enter" && !event.shiftKey) {

    event.preventDefault();

    form.requestSubmit();

  }

});


// Learning tools
document.querySelectorAll("[data-action]").forEach(function (button) {

  button.addEventListener("click", function () {

    const action = button.dataset.action;


    if (conversationHistory.length === 0) {

      addMessage(
        "Please ask me a Computing question first, then choose one of the learning tools."
      );

      return;

    }


    const actions = {

      explain:
        `Explain the Computing topic we are currently discussing again in simpler language for my selected JHS level. Give a clear explanation and one simple example.`,

      quiz:
        `Give me a short 5-question quiz about the Computing topic we are currently discussing. Make the questions appropriate for my selected JHS level. Do not show the answers yet.`,

      test:
        `Continue testing me on the Computing topic we are currently discussing. Ask me ONE question appropriate for my selected JHS level. Wait for my answer before asking another question.`,

      examples:
        `Give me three practical examples related to the Computing topic we are currently discussing. Make the examples appropriate for my selected JHS level and explain each example briefly.`

    };


    if (actions[action]) {

      // Friendly text shown to the student
      const displayMessages = {

        explain: "💡 Explain the topic again",

        quiz: "📝 Quiz me on this topic",

        test: "🎯 Test my knowledge",

        examples: "📚 Give me examples"

      };


      ask(
        actions[action],
        false,
        displayMessages[action]
      );

    }

  });

});
```javascript
// ===============================
// QUIZ MODE
// ===============================

let quizMode = false;
let quizQuestionNumber = 0;
let quizScore = 0;
let quizTopic = "";
let quizQuestions = [];

// Start Quiz button
const startQuizButton = document.getElementById("start-quiz");

if (startQuizButton) {

  startQuizButton.addEventListener("click", async function () {

    // Make sure the student has discussed a topic first
    if (conversationHistory.length === 0) {
      addMessage(
        "Please ask me a Computing question first. I will use that topic for your quiz."
      );
      return;
    }

    // Start a new quiz
    quizMode = true;
    quizQuestionNumber = 0;
    quizScore = 0;

    // Find the most recent Computing topic
    quizTopic =
      conversationHistory[0]?.text ||
      lastQuestion ||
      "the Computing topic we are discussing";

    addMessage("🚀 Quiz Mode started! Get ready for 5 questions.");

    // Ask Gemini to create the quiz
    const quizRequest = `
Create a 5-question Computing quiz for ${level.value}.

The topic being discussed is:
${quizTopic}

Rules:
- Create exactly 5 questions.
- Ask ONE question at a time.
- Do not show the answers.
- Questions must be appropriate for ${level.value}.
- Use clear Computing questions.
- Wait for the student's answer before continuing.
- Keep track of the student's score.
`;

    try {

      const response = await fetch("/api/chat", {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          message: quizRequest,
          level: level.value
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Quiz request failed");
      }

      const reply =
        data.reply ||
        "I couldn't start the quiz. Please try again.";

      // Save quiz information
      conversationHistory.push({
        role: "Assistant",
        text: reply
      });

      addMessage(reply);

      // Tell the system that the next student message is a quiz answer
      quizQuestionNumber = 1;

    } catch (error) {

      console.error("QUIZ ERROR:", error);

      quizMode = false;

      addMessage(
        "Sorry, I couldn't start Quiz Mode right now. Please try again."
      );
    }

  });

}


// =====================================
// HANDLE ANSWERS WHILE IN QUIZ MODE
// =====================================

form.addEventListener("submit", async function (event) {

  // If Quiz Mode is not active, allow the normal
  // submit event above to handle the message.
  if (!quizMode) {
    return;
  }

  event.preventDefault();

  const answer = input.value.trim();

  if (!answer) {
    return;
  }

  // Show student's answer
  addMessage(answer, "user");

  input.value = "";

  send.disabled = true;
  send.textContent = "...";

  // Tell Gemini that this is the student's answer
  const quizAnswerRequest = `
The student is currently taking a 5-question Computing quiz.

Quiz topic:
${quizTopic}

This is Question ${quizQuestionNumber} of 5.

The student's answer is:
"${answer}"

Evaluate the student's answer.

Rules:
- Say whether the answer is correct or incorrect.
- Give a short explanation.
- If it is incorrect, give the correct answer.
- If Question ${quizQuestionNumber} is less than 5, ask the next question.
- Ask only ONE next question.
- Do not reveal answers to future questions.
- If this is Question 5, give the student's final score out of 5.
`;

  try {

    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        message: quizAnswerRequest,
        level: level.value
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Quiz answer request failed");
    }

    const reply =
      data.reply ||
      "I couldn't evaluate that answer. Please try again.";

    addMessage(reply);

    // Save the quiz exchange
    conversationHistory.push({
      role: "Student",
      text: answer
    });

    conversationHistory.push({
      role: "Assistant",
      text: reply
    });

    // Move to the next question
    quizQuestionNumber++;

    // After Question 5, end Quiz Mode
    if (quizQuestionNumber > 5) {

      quizMode = false;
      quizQuestionNumber = 0;

      addMessage(
        "🎉 Quiz Mode completed! You can start another quiz whenever you're ready."
      );
    }

  } catch (error) {

    console.error("QUIZ ANSWER ERROR:", error);

    addMessage(
      "Sorry, I couldn't process your quiz answer. Please try again."
    );

  } finally {

    send.disabled = false;
    send.textContent = "Send";
    input.focus();

  }

});
```
