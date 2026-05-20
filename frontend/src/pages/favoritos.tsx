import { useEffect, useState } from "react";
import LeadsList from "../components/LeadsList";
import Header from "../components/Header";
import { useUser } from "@clerk/clerk-react";

export default function Favoritos() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const { user } = useUser();

  useEffect(() => {
    const run = async () => {
      if (!user?.id) return;
      try {
        const { getFavorites } = await import("../lib/searchStorage");
        const data = await getFavorites(user.id);
        setFavorites(data);
      } catch (e) {
        console.error("Erro ao carregar favoritos:", e);
      }
    };

    run();
  }, [user?.id]);

  return (
    <>
      <Header />

      <div className="min-h-screen bg-[#0a0a0a] text-white px-6 mt-10">
        <h2 className="text-2xl font-bold mb-6">⭐ Meus Favoritos</h2>

        {favorites.length === 0 ? (
          <p className="text-white/50">Nenhum lead favoritado ainda...</p>
        ) : (
          <LeadsList leads={favorites} />
        )}
      </div>
    </>
  );
}
