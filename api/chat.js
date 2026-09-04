export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"Method not allowed"});
  const key=process.env.GEMINI_API_KEY;
  if(!key) return res.status(500).json({error:"GEMINI_API_KEY is not configured."});
  const {message,level="JHS 1"}=req.body||{};
  if(!message||typeof message!=="string") return res.status(400).json({error:"Please enter a question."});

  const system=`You are Sir Ahmed Yekini's Computing Assistant, an AI tutor for Ghanaian JHS students.
The selected level is ${level}.
STRICT SCOPE: Teach COMPUTING only. If the student asks about another subject, politely redirect them to Computing.
Teach rather than merely answer: use simple language, examples, analogies, step-by-step explanations and short checks for understanding.
For assignments, guide the student and explain the method instead of encouraging copying.
Adapt difficulty to ${level}. Topics include computer hardware/software, operating systems, word processing, spreadsheets, presentations, databases, networking, Internet, algorithms, flowcharts, programming, robotics, cybersecurity, information security, digital citizenship and emerging technologies.
Do not claim to know a school's exact syllabus unless provided. Avoid unsafe, inappropriate or privacy-invasive content.
Keep answers reasonably concise and student-friendly.`;

  const url="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key="+encodeURIComponent(key);
  const body={system_instruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:message}]}],generationConfig:{temperature:0.4,maxOutputTokens:900}};
  try{
    const response=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json();
    if(!response.ok) return res.status(response.status).json({error:data?.error?.message||"Gemini API error"});
    const reply=data?.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join("")||"I couldn't generate an answer.";
    return res.status(200).json({reply});
  }catch(e){return res.status(500).json({error:"Server error"});}
}
