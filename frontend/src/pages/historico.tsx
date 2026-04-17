import { useEffect, useState } from "react";
import Header from "../components/Header";

export default function Historico() {
  const [groups, setGroups] = useState({});

  const agruparPorCategoria = (history) => {
    return history.reduce((acc, item) => {
      const categoria = item.query.split(" em ")[0].toLowerCase();

      if (!acc[categoria]) {
        acc[categoria] = [];
      }

      acc[categoria].push(item);

      return acc;
    }, {});
  };

  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("searchHistory")) || [];

    const grouped = agruparPorCategoria(history);
    setGroups(grouped);
  }, []);

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
                    localStorage.setItem(
                      "lastSearch",
                      JSON.stringify(item.leads),
                    );
                    window.location.href = "/";
                  }}
                >
                  <p className="text-sm text-white/50 mb-2">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>

                  <h3 className="font-bold mb-2">{item.query}</h3>

                  <p className="text-green-400">{item.leads.length} leads</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
