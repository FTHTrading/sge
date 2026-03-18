import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    // Use a good voice from ElevenLabs. "Rachel" is a good default.
    const voiceId = "21m00Tcm4TlvDq8ikWAM"; 
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("ElevenLabs Error:", err);
      return NextResponse.json({ error: 'Failed to synthesize voice' }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();
    
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
      }
    });
  } catch (error: any) {
    console.error("Speak API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
