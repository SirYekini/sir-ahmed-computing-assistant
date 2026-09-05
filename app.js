const form = document.getElementById("chat-form");
const input = document.getElementById("prompt");
const messages = document.getElementById("messages");
const level = document.getElementById("level");
const send = document.getElementById("send");

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

async function ask(text) {
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
      "ERROR: " + error.message
    );

    console.error("FULL ERROR:", error);

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
