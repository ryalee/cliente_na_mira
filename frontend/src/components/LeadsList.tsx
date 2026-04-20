import { useState } from "react";
import { Star } from "lucide-react";

type Lead = {
  name: string;
  status: string;
  phone?: string;
  address?: string;
  website?: string;
};

type LeadsListProps = {
  leads: Lead[];
  user?: string;
};

export default function LeadsList({ leads, user }: LeadsListProps) {
  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [favorites, setFavorites] = useState<Lead[]>(() => {
    const data = localStorage.getItem("favorites");
    return data ? JSON.parse(data) : [];
  });

  const atualizarStatus = (leadName: string, status: string) => {
    setStatusMap((prev) => ({
      ...prev,
      [leadName]: status,
    }));
  };

  const toggleFavorite = (lead: lead) => {
    let updated;

    if (favorites.find((f: Lead) => f.name === lead.name)) {
      updated = favorites.filter((f: Lead) => f.name !== lead.name);
    } else {
      updated = [...favorites, lead];
    }

    setFavorites(updated);
    localStorage.setItem("favorites", JSON.stringify(updated));
  };

  const formatPhone = (phone: string) => {
    if (!phone) return "";

    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = "55" + cleaned;
    }

    return cleaned;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 py-10">
      {leads.map((lead: Lead) => {
        return (
          <div
            key={lead.name}
            className="p-4 flex flex-col gap-3 rounded-2xl shadow-md border border-white/10 hover:shadow-lg transition bg-[#111]"
          >
            <div className="flex justify-between">
              <h2 className="text-xl font-semibold">{lead.name}</h2>

              <button onClick={() => toggleFavorite(lead)}>
                {favorites.find((f) => f.name === lead.name) ? (
                  <p className="text-2xl">⭐</p>
                ) : (
                  <Star size={26} />
                )}
              </button>
            </div>

            <div className="text-sm text-white/80 mt-2 space-y-2">
              {lead.address && <p>📍 {lead.address}</p>}
              {lead.phone && <p>📞 {lead.phone}</p>}
              {lead.website ? (
                <a
                  href={lead.website}
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  Ver site
                </a>
              ) : (
                <p className="text-gray-500">
                  Nenhum link relevante encontrado
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-3 items-center flex-wrap">
              {lead.phone && (
                <>
                  <a
                    href={`https://wa.me/${formatPhone(lead.phone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-green-600 px-3 py-1 rounded"
                  >
                    💬 WhatsApp
                  </a>

                  <a
                    href={`tel:${lead.phone}`}
                    className="bg-blue-600 px-3 py-1 rounded"
                  >
                    Ligar
                  </a>
                </>
              )}

              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  lead.name,
                )}`}
                target="_blank"
                className="px-5 py-2 bg-black text-white rounded-lg text-sm hover:bg-purple-700 transition-all duration-300"
              >
                Ver no Google Maps
              </a>
            </div>

            <select
              value={statusMap[lead.name] || "novo"}
              onChange={(e) => atualizarStatus(lead.name, e.target.value)}
              className="bg-[#111] border border-white/10 rounded px-2 py-1 w-[60%]"
            >
              <option value="novo">Novo</option>
              <option value="contatado">Já entrei em contato</option>
              <option value="interessado">Interessado</option>
            </select>
          </div>
        );
      })}
    </div>
  );
}
