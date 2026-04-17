import { useState } from "react";
import { useUser } from "@clerk/clerk-react";

export default function OnboardingModal({ onClose }) {
  const { user } = useUser();

  const [profession, setProfession] = useState("");
  const [service, setService] = useState("");
  const [diferencial, setDiferencial] = useState("");

  const salvarPerfil = async () => {
    // trava se não preencher
    if (!profession || !service) {
      alert("Preencha profissão e serviço");
      return;
    }

    await fetch("http://localhost:3000/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        profession,
        service,
        diferencial,
      }),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-[#111] p-6 rounded-xl w-100 border border-white/10">
        <h2 className="text-xl font-bold mb-4">
          Vamos configurar seu perfil 🚀
        </h2>

        <input
          placeholder="O que você faz?"
          value={profession}
          onChange={(e) => setProfession(e.target.value)}
          className="w-full mb-3 p-2 bg-[#1a1a1a] rounded"
        />

        <input
          placeholder="O que você oferece?"
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full mb-3 p-2 bg-[#1a1a1a] rounded"
        />

        <input
          placeholder="Seu diferencial"
          value={diferencial}
          onChange={(e) => setDiferencial(e.target.value)}
          className="w-full mb-4 p-2 bg-[#1a1a1a] rounded"
        />

        <button
          onClick={salvarPerfil}
          className="bg-purple-600 w-full py-2 rounded font-bold"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
