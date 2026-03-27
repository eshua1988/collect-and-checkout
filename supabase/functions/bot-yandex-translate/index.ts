import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text, targetLang, sourceLang, folderId, apiKey } = await req.json();

    if (!text) {
      return new Response(JSON.stringify({ error: "text is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const yandexFolderId = folderId || Deno.env.get("YANDEX_FOLDER_ID");
    const yandexApiKey = apiKey || Deno.env.get("YANDEX_API_KEY");

    if (!yandexFolderId || !yandexApiKey) {
      return new Response(JSON.stringify({ error: "Yandex Cloud credentials not configured (folderId + apiKey)" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Yandex Translate API v2
    const body: any = {
      folderId: yandexFolderId,
      texts: [text],
      targetLanguageCode: targetLang || "ru",
    };

    if (sourceLang) {
      body.sourceLanguageCode = sourceLang;
    }

    const response = await fetch("https://translate.api.cloud.yandex.net/translate/v2/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Api-Key ${yandexApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`Yandex Translate error: ${response.status} ${errText}`);
      return new Response(JSON.stringify({ error: `Yandex API error: ${response.status}` }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const translatedText = data.translations?.[0]?.text || "";
    const detectedLang = data.translations?.[0]?.detectedLanguageCode || "";

    return new Response(JSON.stringify({
      translatedText,
      detectedLang,
      targetLang: targetLang || "ru",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Yandex translate error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
