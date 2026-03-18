import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Add system prompt to guide the AI to be helpful for the SGE platform
    const fullMessages = [
      { role: "system", content: "You are the SGE Energy Platform AI Assistant. You help users understand the platform, connect their wallets, and claim SGE tokens. Keep your answers concise, friendly, and professional. Always speak in a way that sounds natural when spoken aloud." },
      ...messages
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: fullMessages,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("OpenAI Error:", errorData);
      return NextResponse.json({ error: "Failed to fetch AI response." }, { status: 500 });
    }

    const data = await response.json();
    return NextResponse.json({ 
      text: data.choices[0].message.content,
      role: data.choices[0].message.role 
    });
  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
