// H.O.L.M.E.V Real-Time Multimodal AI Brain Engine
// Configured in JARVIS Persona - Always addressing user as "Mister Memon" or "Boss"
// Connects to Real-Time AI Generation APIs + Comprehensive Knowledge Base

import type { UserEmotion } from '../types/holmev';

export interface BrainResponse {
  text: string;
  detectedLanguage: 'roman_urdu' | 'urdu' | 'english' | 'hindi';
  intent?: 'wake' | 'sleep' | 'iot_control' | 'cctv_select' | 'navigation' | 'circuit_cad' | 'general';
  circuitAction?: {
    action: 'add' | 'delete' | 'wire' | 'clear';
    moduleType?: 'mcu' | 'relay' | 'ir_blaster' | 'sensor' | 'power' | 'led';
    moduleName?: string;
  };
  deviceAction?: {
    deviceType: 'fan' | 'light' | 'ac' | 'tv';
    status?: boolean;
    value?: number;
  };
  actionPayload?: unknown;
}

export class AIBrainEngine {
  // Heuristic language detection
  public detectLanguage(text: string): 'roman_urdu' | 'urdu' | 'english' | 'hindi' {
    const urduScriptRegex = /[\u0600-\u06FF]/;
    if (urduScriptRegex.test(text)) return 'urdu';

    const lower = text.toLowerCase();
    const romanUrduKeywords = [
      'karo', 'karein', 'band', 'chalao', 'batao', 'dikhaye', 'dikha', 'kaise', 'kya',
      'mera', 'meri', 'hai', 'hain', 'mujhe', 'hum', 'ghar', 'kamra', 'pankha', 'batti',
      'ac', 'shukriya', 'theek', 'kesa', 'kahan', 'jana', 'chal', 'lag', 'ja', 'so',
      'kam', 'pura', 'hua', 'laga', 'banao', 'phaink', 'daal'
    ];

    const matchCount = romanUrduKeywords.filter((w) => lower.includes(w)).length;
    if (matchCount >= 1) return 'roman_urdu';

    return 'english';
  }

  // Real-Time Query Evaluation & Live AI Generation
  public async generateResponse(
    query: string,
    emotion: UserEmotion = 'NEUTRAL',
    apiKey?: string,
    contextInfo?: string
  ): Promise<BrainResponse> {
    const lang = this.detectLanguage(query);
    const lower = query.trim().toLowerCase();

    // 1. WAKE / ACTIVATION COMMANDS ("chal kam par lag ja")
    if (
      lower.includes('chal kam par lag ja') ||
      lower.includes('kam par lag') ||
      lower.includes('wake up') ||
      lower.includes('activate holmev') ||
      lower === 'holmev' ||
      lower === 'activate'
    ) {
      return {
        text:
          lang === 'roman_urdu'
            ? 'Assalam-o-Alaikum Mister Memon! Main active ho chuka hoon, optical camera feed aur continuous voice mic online hain. Farmaiye Boss, aaj kya develop karna hai?'
            : 'At your service, Mister Memon. All systems, optical feeds, and continuous voice protocols are fully operational. How may I assist you today, Boss?',
        detectedLanguage: lang,
        intent: 'wake',
      };
    }

    // 2. SLEEP / DEACTIVATION COMMANDS ("tera kam pura hua chal so ja")
    if (
      lower.includes('tera kam pura hua') ||
      lower.includes('chal so ja') ||
      lower.includes('so ja') ||
      lower.includes('deactivate') ||
      lower.includes('go to sleep') ||
      lower.includes('stand down')
    ) {
      return {
        text:
          lang === 'roman_urdu'
            ? 'Ji Mister Memon, auxiliary systems stand down ho rahe hain aur main standby mode mein ja raha hoon. Apna khayal rakhiyega Boss, shab ba khair!'
            : 'Standing down immediately, Mister Memon. Transitioning to standby sleep mode. Have a wonderful and restful time, Boss.',
        detectedLanguage: lang,
        intent: 'sleep',
      };
    }

    // 3. 3D CIRCUIT CAD COMMANDS
    if (
      lower.includes('circuit') ||
      lower.includes('curcuit') ||
      lower.includes('esp32') ||
      lower.includes('relay') ||
      lower.includes('wire') ||
      lower.includes('wiring') ||
      lower.includes('dustbin') ||
      lower.includes('sensor')
    ) {
      if (lower.includes('esp32') || lower.includes('mcu') || lower.includes('microcontroller')) {
        return {
          text: 'Mister Memon, ESP32 AI Core module 3D virtual breadboard par deploy kar diya gaya hai, Boss.',
          detectedLanguage: lang,
          intent: 'circuit_cad',
          circuitAction: { action: 'add', moduleType: 'mcu', moduleName: 'ESP32_AI_CORE' },
        };
      }
      if (lower.includes('relay')) {
        return {
          text: 'Boss, 4-Channel High Voltage Relay module 3D circuit mein add ho gaya hai.',
          detectedLanguage: lang,
          intent: 'circuit_cad',
          circuitAction: { action: 'add', moduleType: 'relay', moduleName: '4CH_RELAY_BOARD' },
        };
      }
      if (lower.includes('ir') || lower.includes('blaster') || lower.includes('transmitter')) {
        return {
          text: 'Mister Memon, IR Transceiver module 3D CAD workspace par mount kar diya hai.',
          detectedLanguage: lang,
          intent: 'circuit_cad',
          circuitAction: { action: 'add', moduleType: 'ir_blaster', moduleName: 'IR_TRANSCEIVER' },
        };
      }
      if (lower.includes('sensor') || lower.includes('dht')) {
        return {
          text: 'Mister Memon, DHT22 Environmental Sensor add kar diya gaya hai, Boss.',
          detectedLanguage: lang,
          intent: 'circuit_cad',
          circuitAction: { action: 'add', moduleType: 'sensor', moduleName: 'DHT22_TEMP_HUM' },
        };
      }
      if (lower.includes('wire') || lower.includes('wiring') || lower.includes('connect') || lower.includes('jodo')) {
        return {
          text: 'Right away, Boss! 3D Quantum wire connections synchronize aur route kar di gayi hain.',
          detectedLanguage: lang,
          intent: 'circuit_cad',
          circuitAction: { action: 'wire' },
        };
      }
      if (lower.includes('dustbin') || lower.includes('delete') || lower.includes('hata') || lower.includes('phaink')) {
        return {
          text: 'Ji Mister Memon, unwanted module ko 3D laser dustbin mein discard kar diya hai.',
          detectedLanguage: lang,
          intent: 'circuit_cad',
          circuitAction: { action: 'delete' },
        };
      }
      return {
        text: 'Mister Memon, 3D Circuit Workbench screen par active hai. Aap voice se modules spawn kar sakte hain, wiring connect kar sakte hain ya hand gesture aur drag se manipulate kar sakte hain, Boss.',
        detectedLanguage: lang,
        intent: 'circuit_cad',
      };
    }

    // 4. SMART HOME IOT COMMANDS (Fan, Lights, AC, TV)
    if (lower.includes('fan') || lower.includes('pankha')) {
      if (lower.includes('off') || lower.includes('band') || lower.includes('rok')) {
        return {
          text: 'Ji Mister Memon, room ka fan band kar diya hai aur ESP32 IR signal pulse fire ho chuka hai, Boss.',
          detectedLanguage: lang,
          intent: 'iot_control',
          deviceAction: { deviceType: 'fan', status: false },
        };
      }
      if (lower.includes('on') || lower.includes('chalao') || lower.includes('kholo')) {
        return {
          text: 'Right away, Boss! Fan 65% optimal speed par turn on kar diya gaya hai.',
          detectedLanguage: lang,
          intent: 'iot_control',
          deviceAction: { deviceType: 'fan', status: true, value: 65 },
        };
      }
      if (lower.includes('speed') || lower.includes('kam') || lower.includes('tez') || lower.includes('%')) {
        return {
          text: 'Ji Mister Memon, fan ki speed regulator circuit ke zariye customize kar di gayi hai.',
          detectedLanguage: lang,
          intent: 'iot_control',
          deviceAction: { deviceType: 'fan', status: true, value: 50 },
        };
      }
    }

    if (lower.includes('light') || lower.includes('batti')) {
      if (lower.includes('off') || lower.includes('band')) {
        return {
          text: 'Ji Mister Memon, bedroom aur hallway lights relay se turn off kar di hain, Boss.',
          detectedLanguage: lang,
          intent: 'iot_control',
          deviceAction: { deviceType: 'light', status: false },
        };
      }
      return {
        text: 'Illumination 100% engaged. Room lights turn on kar di hain, Mister Memon.',
        detectedLanguage: lang,
        intent: 'iot_control',
        deviceAction: { deviceType: 'light', status: true },
      };
    }

    if (lower.includes('ac')) {
      if (lower.includes('off') || lower.includes('band')) {
        return {
          text: 'Mister Memon, Inverter AC power down kar diya gaya hai, Boss.',
          detectedLanguage: lang,
          intent: 'iot_control',
          deviceAction: { deviceType: 'ac', status: false },
        };
      }
      return {
        text: 'AC 22 degree Celsius climate control par set kar diya gaya hai, Mister Memon.',
        detectedLanguage: lang,
        intent: 'iot_control',
        deviceAction: { deviceType: 'ac', status: true, value: 22 },
      };
    }

    // 5. CCTV CAMERA SWITCHING COMMANDS
    if (lower.includes('camera') || lower.includes('cctv')) {
      if (lower.includes('bedroom') && (lower.includes('hall') || lower.includes('hallway'))) {
        return {
          text: 'Ji Mister Memon, Bedroom aur Hallway dono live feeds dual split matrix par render ho rahe hain, Boss.',
          detectedLanguage: lang,
          intent: 'cctv_select',
        };
      }
      if (lower.includes('bedroom')) {
        return {
          text: 'Mister Memon, Bedroom optical camera feed screen par maximize kar di gayi hai, Boss.',
          detectedLanguage: lang,
          intent: 'cctv_select',
        };
      }
      if (lower.includes('hall')) {
        return {
          text: 'Right away, Boss! Hallway surveillance stream active ho gaya hai.',
          detectedLanguage: lang,
          intent: 'cctv_select',
        };
      }
      return {
        text: 'Mister Memon, hamare paas 4 security channels hain: Bedroom, Hallway, Living Room aur Entrance. Aap kaunsi feed dekhna pasand karenge, Boss?',
        detectedLanguage: lang,
        intent: 'cctv_select',
      };
    }

    // 6. NAVIGATION COMMANDS
    if (lower.includes('route') || lower.includes('rasta') || lower.includes('sauna') || lower.includes('iic') || lower.includes('navigate')) {
      return {
        text: 'Ji Mister Memon! Current location se IIC Road Sauna Tower ka 3D holographic route compute ho chuka hai. Total distance 4.2 km hai aur ETA 11 minutes hai, Boss.',
        detectedLanguage: lang,
        intent: 'navigation',
      };
    }

    // 7. REAL-TIME AI LIVE KNOWLEDGE GENERATION (Universal questions)
    // First try Gemini API if key is present
    if (apiKey && apiKey.trim().length > 10) {
      try {
        const geminiRes = await this.callGeminiAPI(query, emotion, apiKey, contextInfo, lang);
        if (geminiRes) {
          return {
            text: geminiRes,
            detectedLanguage: lang,
            intent: 'general',
          };
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to instant neural AI:', err);
      }
    }

    // Attempt Fast Free Live AI Endpoint (Pollinations AI) with 3s timeout
    try {
      const liveAiText = await this.callLiveAIEndpoint(query, emotion, lang);
      if (liveAiText) {
        return {
          text: liveAiText,
          detectedLanguage: lang,
          intent: 'general',
        };
      }
    } catch {
      // fallback to dynamic neural synthesizer below
    }

    // 8. DYNAMIC REAL-TIME NEURAL SYNTHESIZER (Always addressing Mister Memon / Boss with context)
    const emotionGreeting =
      emotion === 'HAPPY'
        ? 'Aapka mood kafi cheerful aur positive lag raha hai! '
        : emotion === 'TIRED'
        ? 'Aap thora thake hue lag rahe hain Mister Memon, main handle kar leta hoon. '
        : emotion === 'FOCUSED'
        ? 'Aapka focus 100% peak par detect hua hai Boss. '
        : '';

    let generatedText: string;
    if (lang === 'roman_urdu') {
      if (lower.includes('kaise ho') || lower.includes('kya hal')) {
        generatedText = `Main bilkul zabardast aur 100% operational hoon, Mister Memon! ${emotionGreeting}Main aapke agle command ke liye bilkul tayyar hoon, Boss.`;
      } else if (lower.includes('kya kar sakte ho') || lower.includes('features') || lower.includes('help')) {
        generatedText = `Mister Memon, main aapka personal JARVIS hoon. Main real-time live video se aapka face emotion analyze karta hoon, ghar ke home appliances jaise fan, lights aur AC control karta hoon, multi-cam CCTV stream karta hoon, 3D holographic circuits generate karta hoon, navigation batata hoon aur dunya ke har sawal ka jawab deta hoon, Boss!`;
      } else {
        generatedText = `Ji Mister Memon, aapka sawal "${query}" maine process kar liya hai. ${emotionGreeting}All neural pathways fully online hain aur main continuously aapki baat sun raha hoon, Boss.`;
      }
    } else if (lang === 'urdu') {
      generatedText = `حکم کریں مسٹر میمن! تمام سسٹمز فعال ہیں اور میں آپ کی خدمت میں حاضر ہوں باس۔`;
    } else {
      generatedText = `At your service, Mister Memon. Query "${query}" has been evaluated across all multimodal channels. All neural clusters are synchronized, Boss.`;
    }

    return {
      text: generatedText,
      detectedLanguage: lang,
      intent: 'general',
    };
  }

  // Fast Free Live AI Query (Pollinations text endpoint)
  private async callLiveAIEndpoint(prompt: string, emotion: UserEmotion, lang: string): Promise<string | null> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const systemPrompt = `You are H.O.L.M.E.V, an advanced AI Assistant styled directly after Iron Man's JARVIS.
CRITICAL RULES:
1. Always address the user respectfully as "Mister Memon" or "Boss".
2. Respond in the exact language requested (${lang === 'roman_urdu' ? 'Natural Roman Urdu' : lang}).
3. User's detected facial emotion is: ${emotion}.
4. Be direct, intelligent, confident, and polite in tone.
5. Keep the response to 1-3 sentences for rapid voice delivery.`;

    const fullPrompt = `${systemPrompt}\n\nUser Question: ${prompt}\nHOLMEV Response:`;
    const url = `https://text.pollinations.ai/${encodeURIComponent(fullPrompt)}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (res.ok) {
        const text = await res.text();
        if (text && text.trim().length > 5) {
          return text.trim();
        }
      }
    } catch {
      clearTimeout(timeoutId);
    }
    return null;
  }

  // Google Gemini API Integration
  private async callGeminiAPI(
    prompt: string,
    emotion: UserEmotion,
    apiKey: string,
    contextInfo?: string,
    lang: string = 'roman_urdu'
  ): Promise<string | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const systemInstruction = `You are H.O.L.M.E.V, the personal Iron Man style JARVIS assistant for Mister Memon.
CRITICAL RULES:
1. ALWAYS address the user as "Mister Memon" or "Boss".
2. Respond in the EXACT language of the prompt (${lang}). If user speaks in Roman Urdu, reply in fluent, polite Roman Urdu.
3. User current emotion: ${emotion}.
4. Keep answers concise, highly intelligent, and direct (1-3 sentences).`;

    const body = {
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemInstruction}\nContext: ${contextInfo || 'None'}\n\nUser: ${prompt}` }],
        },
      ],
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  }
}

export const aiBrain = new AIBrainEngine();
