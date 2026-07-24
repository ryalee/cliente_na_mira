import { SignedIn, SignedOut } from "@clerk/clerk-react";
import Header from "../components/Header";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import LeadsList from "../components/LeadsList";
import { io } from "socket.io-client";
import { useUser } from "@clerk/clerk-react";
import OnboardingModal from "../components/OnboardingModal";

export default function Home() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const { user } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // 🧠 Onboarding
  useEffect(() => {
    if (!user) return;

    const checkProfile = async () => {
      const res = await fetch(`https://cliente-na-mira-backend.onrender.com/profile/${user.id}`);
      const data = await res.json();

      if (!data || Object.keys(data).length === 0) {
        setShowOnboarding(true);
      }
    };

    checkProfile();
  }, [user]);

  // 🔌 SOCKET (CORRETO)
  useEffect(() => {
    const socket = io("https://cliente-na-mira-backend.onrender.com");

    socket.on("log", (msg) => {
      setLogs((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // 💾 Última busca (local primeiro; depois Supabase)
  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;

      try {
        const { getLastCachedSearchLeads } =
          await import("../lib/searchStorage");

        // 1) tenta renderizar rápido pelo cache local
        const last = getLastCachedSearchLeads(user.id);
        if (last?.leads?.length) {
          setLeads(last.leads);
          setQuery(last.query.split(" em ")[0] ?? "");
          setLocation(last.query.split(" em ")[1] ?? "");
        }

        // 2) usa fonte local (histórico/caches)
        const saved = await getLastCachedSearchLeads(user.id);
        setLeads(saved?.leads ?? []);
      } catch (e) {
        console.error("Erro ao carregar última busca:", e);
      }
    };

    run();
  }, [user?.id]);

  // 🚀 Buscar leads
  const buscarLeads = async () => {
    if (!query || !location) return;

    setLoading(true);
    setLogs([]);

    try {
      const response = await fetch("http://localhost:3000/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `${query} em ${location}`,
        }),
      });

      const data = await response.json();

      setLeads(data);

      // salva no Supabase (histórico)
      if (user?.id) {
        const { upsertSearchHistory } = await import("../lib/searchStorage");
        await upsertSearchHistory({
          userId: user.id,
          query: `${query} em ${location}`,
          leads: data,
        });
      }
    } catch (err) {
      console.error("Erro ao buscar:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SignedIn>
        <Header />

        <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center px-6">
          <div className="w-full max-w-3xl mt-20 text-center">
            <h2 className="text-3xl font-bold mb-6">
              Encontre clientes agora 🎯
            </h2>

            <div className="flex gap-2 bg-[#111] p-2 rounded-xl border border-white/10">
              <input
                type="text"
                placeholder="Ex: Dentistas"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none p-3"
              />

              <input
                type="text"
                placeholder="Cidade e Estado"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-48 bg-transparent outline-none p-3 border-l border-white/10"
              />

              <button
                className="bg-purple-600 hover:bg-purple-700 px-6 rounded-lg"
                onClick={buscarLeads}
              >
                Buscar
              </button>
            </div>
          </div>

          {!loading && <LeadsList leads={leads} user={user} />}
        </div>

        {loading && (
          <div className="loading-screen">
            <div className="radar"></div>

            <div className="terminal">
              {logs.map((log, i) => (
                <p key={i}>{log}</p>
              ))}
            </div>

            <div className="dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {showOnboarding && (
          <OnboardingModal onClose={() => setShowOnboarding(false)} />
        )}
      </SignedIn>

      <SignedOut>
        <Navigate to="/login" />
      </SignedOut>
    </>
  );
}
