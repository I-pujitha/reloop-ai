import { z } from 'zod';
const resultSchema = z.object({
  itemCategory:z.string().min(2).max(160),
  plasticType:z.string().min(2).max(160),
  confidence:z.number().min(0).max(1),
  observations:z.array(z.string().max(240)).max(8),
  recyclability:z.string().min(2).max(500),
  preparationSteps:z.array(z.string().max(240)).min(1).max(8),
  recommendedAction:z.string().min(2).max(500),
  impact:z.string().min(2).max(500),
  safetyWarning:z.string().max(500)
});
export async function analyseImage(buffer, mimeType) {
const base = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/+$/, '');
  const model = process.env.OLLAMA_VISION_MODEL || 'gemma4:e2b';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.OLLAMA_TIMEOUT_MS || 90000));
  try {
    const response = await fetch(`${base}/api/chat`, {
      method:'POST', headers:{'Content-Type':'application/json'}, signal:controller.signal,
      body:JSON.stringify({
        model, stream:false, format:'json',
        messages:[{role:'user', images:[buffer.toString('base64')], content:
`Inspect this image for plastic waste. Do not overclaim material or resin identification from appearance alone. If uncertain, say so in plasticType and use low confidence. Return ONLY a JSON object with exactly these keys: itemCategory (string), plasticType (string), confidence (number 0..1), observations (array of short strings), recyclability (string), preparationSteps (array of strings), recommendedAction (string), impact (string), safetyWarning (string). Explain uncertainty and local rules vary. If no clear waste item is visible, say "Unclear image" and recommend retaking the image. Do not identify exact resin code unless visible in image. MIME type: ${mimeType}.`}]
      })
    });
    if (!response.ok) {
  const details = await response.text();
  throw new Error(
    `Ollama returned HTTP ${response.status}: ${details}`
  );
}
    const data = await response.json();
    if (!data.message?.content) throw new Error('Ollama returned an empty response.');
    let parsed;
    try { parsed = JSON.parse(data.message.content); } catch { throw new Error('The vision model returned malformed JSON. Try another image or model.'); }
    const validated = resultSchema.safeParse(parsed);
    if (!validated.success) throw new Error('The vision model response did not match the required format. Try again.');
    return { ...validated.data, aiModel:model, mode:'ollama-live' };
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('AI analysis timed out. Check that Ollama is running and the model is loaded.');
    if (error.cause?.code === 'ECONNREFUSED' || /fetch failed/i.test(error.message)) throw new Error(`Cannot reach Ollama at ${base}. Start Ollama and pull the model "${model}".`);
    throw error;
  } finally { clearTimeout(timeout); }
}
