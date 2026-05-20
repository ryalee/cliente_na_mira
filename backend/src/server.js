require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const { scrapeGoogleMaps } = require("./scraper");
const fs = require("fs");
const path = require("path");

const USER_PROFILES_PATH = path.join(__dirname, "../data/user_profiles.json");

function readUserProfiles() {
  try {
    const raw = fs.readFileSync(USER_PROFILES_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeUserProfiles(store) {
  fs.mkdirSync(path.dirname(USER_PROFILES_PATH), { recursive: true });
  fs.writeFileSync(USER_PROFILES_PATH, JSON.stringify(store, null, 2), "utf8");
}

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

    const store = readUserProfiles();
    const existing = store[userId];

    if (!existing) {
      const newProfile = { user_id: userId, plan: "free" };
      store[userId] = newProfile;
      writeUserProfiles(store);
      return res.json(newProfile);
    }

    return res.json(existing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
