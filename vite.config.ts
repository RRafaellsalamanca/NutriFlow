import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { GoogleGenerativeAI } from '@google/generative-ai'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      {
        name: 'api-handler',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/gerar-plano' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { patientData } = JSON.parse(body);
                  const apiKey = env.GOOGLE_API_KEY || env.VITE_GEMINI_API_KEY;
                  
                  if (!apiKey) {
                    throw new Error('API Key não encontrada no arquivo .env');
                  }

                  const genAI = new GoogleGenerativeAI(apiKey);
                  const model = genAI.getGenerativeModel({ 
                    model: "gemini-2.5-flash",
                    generationConfig: {
                      responseMimeType: "application/json",
                    }
                  });

                  const prompt = `Você é um nutricionista profissional. Gere um plano alimentar semanal em JSON para o paciente: ${JSON.stringify(patientData)}.
                  ⚠️ Formato obrigatório:
                  {
                    "plano_semanal": [
                      {
                        "dia": "Segunda-feira",
                        "refeicoes": {
                          "cafe_da_manha": ["", "", "", "", ""],
                          "lanche_manha": ["", "", "", "", ""],
                          "almoco": ["", "", "", "", ""],
                          "lanche_tarde": ["", "", "", "", ""],
                          "jantar": ["", "", "", "", ""]
                        }
                      }
                    ]
                  }
                  Regras: responda APENAS o JSON, sem explicações, 7 dias completos, 5 opções por refeição.`;

                  const result = await model.generateContent(prompt);
                  const responseText = result.response.text().replace(/```json|```/g, "").trim();
                  
                  res.setHeader('Content-Type', 'application/json');
                  res.end(responseText);
                } catch (error: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: error.message }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
  }
})
