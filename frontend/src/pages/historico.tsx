import { useEffect, useState } from "react";
import Header from "../components/Header";
import { useUser } from "@clerk/clerk-react";
import type { SearchHistoryRow } from "../lib/searchStorage";

type GroupsMap = Record<string, SearchHistoryRow[]>;

export default function Historico() {
  const { user } = useUser();
  const [groups, setGroups] = useState<GroupsMap>({});

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      try {
        const { getSearchHistoryGroups } = await import("../lib/searchStorage");
        const grouped = await getSearchHistoryGroups(user.id);

        const map: GroupsMap = {};
        for (const g of grouped) {
          map[g.categoria] = g.items;
        }

        setGroups(map);
      } catch (e) {
        console.error("Erro ao carregar histórico:", e);
      }
    };

    run();
  }, [user?.id]);

  return (
    <>
      <Header />

      <div className="min-h-screen bg-[#0a0a0a] text-white px-6 mt-10">
        <h2 className="text-2xl font-bold mb-6">📂 Histórico de busca</h2>

        {Object.entries(groups).map(([categoria, items]) => (
          <div key={categoria} className="mb-10 mt-10">
            <h2 className="text-xl font-bold mb-4 capitalize">{categoria}</h2>

            <div className="flex gap-4 overflow-x-auto pb-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="min-w-62.5 bg-[#1a1a1a] p-4 rounded-xl border border-white/10 hover:scale-105 transition cursor-pointer"
                  onClick={() => {
                    // gravar no cache local compatível com o Home
                    try {
                      const queryStr = item.query;
                      // const [q, loc] = queryStr.split(" em ");

                      // Home vai ler lastSearchCache:v1:${user.id}
                      localStorage.setItem(
                        `lastSearchCache:${user?.id}:${"v1"}`,
                        JSON.stringify({
                          query: item.query,
                          leads: item.leads_json,
                          updatedAt: Date.now(),
                        }),
                      );

                      // opcional: melhora a chance do usuário já ver campos preenchidos ao voltar
                      localStorage.setItem(
                        `searchCache:${user?.id}:${"v1"}:${encodeURIComponent(queryStr)}`,
                        JSON.stringify({ leads: item.leads_json }),
                      );
                    } catch {
                      // ignore
                    }

                    window.location.href = "/";
                  }}
                >
                  <p className="text-sm text-white/50 mb-2">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>

                  <h3 className="font-bold mb-2">{item.query}</h3>

                  <p className="text-green-400">
                    {item.leads_json.length} leads
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
