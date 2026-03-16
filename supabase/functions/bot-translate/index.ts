import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LANGUAGE_NAMES: Record<string, string> = {
  ru: "Russian", en: "English", de: "German", fr: "French", es: "Spanish",
  it: "Italian", zh: "Chinese", ja: "Japanese", ar: "Arabic", pt: "Portuguese",
  ko: "Korean", tr: "Turkish", uk: "Ukrainian", pl: "Polish", nl: "Dutch",
  sv: "Swedish", cs: "Czech", he: "Hebrew", hi: "Hindi", id: "Indonesian",
  th: "Thai", vi: "Vietnamese", ro: "Romanian", hu: "Hungarian", bg: "Bulgarian",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, targetLang, sourceLang, contentType, caption } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const targetLanguage = LANGUAGE_NAMES[targetLang] || targetLang || "English";
    const sourceLanguage = sourceLang && sourceLang !== "auto"
      ? (LANGUAGE_NAMES[sourceLang] || sourceLang)
      : "auto-detected language";

    // Build system prompt based on content type
    let systemPrompt = `You are a professional translator. Translate text accurately and naturally, preserving tone, emoji, formatting and meaning. Return ONLY the translated text, nothing else.`;

    if (contentType === "post") {
      systemPrompt = `You are a professional social media translator. Translate social media posts from ${sourceLanguage} to ${targetLanguage}. 
Preserve: hashtags structure (#word), mentions (@user), emoji, line breaks, and the original tone (formal/casual/promotional).
Translate hashtag CONTENT but keep # symbol. Return ONLY the translated text.`;
    } else if (contentType === "caption") {
      systemPrompt = `You are a professional translator for social media captions. Translate from ${sourceLanguage} to ${targetLanguage}.
Keep emoji, hashtags (translate content), mentions (@user as-is), and the engaging tone.
Return ONLY the translated caption text.`;
    } else if (contentType === "video_description") {
      systemPrompt = `You are a professional video content translator. Translate this video description/title from ${sourceLanguage} to ${targetLanguage}.
Preserve line structure, emoji, links (do not translate URLs), and timestamps.
Return ONLY the translated text.`;
    } else if (contentType === "audio_transcript") {
      systemPrompt = `You are a professional audio transcription translator. Translate this spoken text from ${sourceLanguage} to ${targetLanguage}.
Maintain natural speech flow, punctuation, and speaker expressions.
Return ONLY the translated transcript.`;
    }

    const messages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: text },
    ];

    // If there's a caption to translate separately (for media posts)
    let translatedCaption: string | undefined;
    if (caption) {
      const captionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: `Translate this social media caption to ${targetLanguage}. Preserve emoji, hashtags, mentions. Return ONLY translated text.` },
            { role: "user", content: caption },
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });
      if (captionResponse.ok) {
        const captionData = await captionResponse.json();
        translatedCaption = captionData.choices?.[0]?.message?.content || caption;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Lovable AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const txt = await response.text();
      console.error("AI gateway error:", response.status, txt);
      return new Response(JSON.stringify({ error: "AI translation error: " + txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const translatedText = data.choices?.[0]?.message?.content || text;

    return new Response(JSON.stringify({
      translatedText,
      translatedCaption,
      targetLang,
      sourceLang: sourceLang || "auto",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("translate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
