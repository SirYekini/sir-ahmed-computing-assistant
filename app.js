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
