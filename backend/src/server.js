require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { scrapeGoogleMaps } = require("./scraper");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" },
});

io.on("connection", () => {
  console.log("🟢 Cliente conectado");
});

function log(message) {
  console.log(message);
  io.emit("log", message);
}

app.post("/leads", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "Query é obrigatória" });
  }

  try {
    log(`🔍 Buscando ${query}`);
    const data = await scrapeGoogleMaps(query, log);
    log(`📊 ${data.length} leads encontrados`);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar leads" });
  }
});

// 🔥 fallback inteligente (nunca deixa quebrar)
function fallbackResponse(lead) {
  return {
    insights: [
      "Empresa com presença digital limitada",
      "Pode melhorar captação de clientes online",
      "Oportunidade de destacar diferenciais",
    ],
    message: `Olá ${lead.name || "tudo bem?"}, vi seu negócio e acredito que posso te ajudar a atrair mais clientes com um site profissional. Podemos conversar?`,
  };
}

app.get("/profile/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    let { data } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!data) {
      const { data: newProfile, error } = await supabase
        .from("user_profiles")
        .insert([{ user_id: userId, plan: "free" }])
        .select()
        .single();

      if (error) {
        return res.status(500).json({ error: "Erro ao criar perfil" });
      }

      return res.json(newProfile);
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

server.listen(3000, () => {
  console.log("🚀 Servidor rodando em http://localhost:3000");
});
