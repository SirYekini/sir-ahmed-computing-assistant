const form=document.getElementById("chat-form"), input=document.getElementById("prompt"), messages=document.getElementById("messages"), level=document.getElementById("level"), send=document.getElementById("send");

function addMessage(text, who="bot"){
  const row=document.createElement("div"); row.className=`message ${who}`;
  const avatar=document.createElement("div"); avatar.className="avatar"; avatar.textContent=who==="bot"?"SY":"YOU";
  const body=document.createElement("div"); const name=document.createElement("b"); name.textContent=who==="bot"?"Sir Ahmed's Assistant":"You";
  const p=document.createElement("p"); p.textContent=text; body.append(name,p); row.append(avatar,body); messages.append(row); messages.scrollTop=messages.scrollHeight;
}
async function ask(text){
  addMessage(text,"user"); input.value=""; send.disabled=true; send.textContent="...";
  const typing=document.createElement("div"); typing.className="message bot"; typing.innerHTML='<div class="avatar">SY</div><div><b>Sir Ahmed\\'s Assistant</b><p class="typing">Thinking...</p></div>'; messages.append(typing); messages.scrollTop=messages.scrollHeight;
  try{
    const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text,level:level.value})});
    const data=await r.json(); typing.remove();
    if(!r.ok) throw new Error(data.error||"Request failed");
    addMessage(data.reply||"I couldn't produce an answer. Please try again.");
  }catch(e){typing.remove();addMessage("Sorry, I couldn't connect right now. Please try again in a moment.");console.error(e)}
  finally{send.disabled=false;send.textContent="Send";input.focus()}
}
form.addEventListener("submit",e=>{e.preventDefault(); if(input.value.trim()) ask(input.value.trim())});
document.querySelectorAll("[data-prompt]").forEach(b=>b.addEventListener("click",()=>ask(b.dataset.prompt)));
input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}});
