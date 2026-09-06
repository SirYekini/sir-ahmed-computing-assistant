const form = document.getElementById("chat-form");
const input = document.getElementById("prompt");
const messages = document.getElementById("messages");
const level = document.getElementById("level");
const send = document.getElementById("send");
let lastQuestion = "";

function formatMarkdown(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^### (.*?)$/gm, "<h3>$1</h3>")
    .replace(/^## (.*?)$/gm, "<h2>$1</h2>")
    .replace(/^# (.*?)$/gm, "<h1>$1</h1>")
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

  const p = document.createElement("p");
  p.innerHTML = formatMarkdown(text);

  body.append(name, p);
  row.append(avatar, body);

  messages.append(row);
  messages.scrollTop = messages.scrollHeight;
}

async function ask(text, remember = true) {
  if (remember) {
    lastQuestion = text;
  }

  addMessage(text, "user");
  input.value = "";
  send.disabled = true;
  send.textContent = "...";

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
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text,
        level: level.value
      })
    });

    const data = await response.json();

    typing.remove();

    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    addMessage(
      data.reply || "I couldn't produce an answer. Please try again."
    );

  } catch (error) {
    typing.remove();

    addMessage(
      "Sorry, I couldn't connect to the Computing Assistant right now. Please try again."
    );

    console.error(error);

  } finally {
    send.disabled = false;
    send.textContent = "Send";
    input.focus();
  }
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const text = input.value.trim();

  if (text) {
    ask(text);
  }
});

document.querySelectorAll("[data-prompt]").forEach(function (button) {
  button.addEventListener("click", function () {
    ask(button.dataset.prompt);
  });
});

input.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    form.requestSubmit();
  }
});
document.querySelectorAll("[data-action]").forEach(function (button) {
  button.addEventListener("click", function () {
    const action = button.dataset.action;

    if (!lastQuestion) {
      addMessage(
        "Please ask me a Computing question first, then choose one of the learning tools.",
        "bot"
      );
      return;
    }

    const actions = {
      explain:
        `The student's previous Computing question was: "${lastQuestion}"

Explain this topic again in simpler language for the selected JHS level. Give a clear explanation and one simple example.`,

      quiz:
        `The student's previous Computing question was: "${lastQuestion}"

Create a short 5-question quiz about this topic for the selected JHS level. Do not give the answers yet.`,

      test:
        `The student's previous Computing question was: "${lastQuestion}"

Test the student on this topic. Ask ONE question appropriate for the selected JHS level and wait for the student's answer.`,

      examples:
        `The student's previous Computing question was: "${lastQuestion}"

Give three practical examples related to this Computing topic. Make the examples appropriate for the selected JHS level and explain each example briefly.`
    };

    if (actions[action]) {
      ask(actions[action], false);
    }
  });
});
