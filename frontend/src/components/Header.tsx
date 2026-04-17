import { UserButton } from "@clerk/clerk-react";
import React from "react";

export default function Header() {
  return (
    <header className="bg-[#0a0a0a] h-25 shadow-sm flex items-center px-8 justify-between">
      <a href="/" className="logo-name text-2xl [text-shadow:0_0_3px_#e7e7e7d7] font-bold text-white flex items-center gap-2">
          Cliente na Mira
        📡
      </a>

      <div className="flex gap-4 items-center">
        <a href="/favoritos" className="text-white/70 hover:text-white duration-200 transition">
          ⭐ Favoritos
        </a>

        <a href="/historico" className="text-white/70 hover:text-white duration-200 transition">
          📂 Histórico de busca
        </a>

        <UserButton />
      </div>
    </header>
  );
}
