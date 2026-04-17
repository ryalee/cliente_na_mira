import { SignIn } from "@clerk/clerk-react";
import { motion } from "framer-motion";

export default function Login() {
  return (
    <div className="flex h-screen">
      {/* LADO ESQUERDO */}
      <div className="hidden md:flex w-1/2 bg-linear-to-br from-purple-600 to-blue-600 text-[#e9e9e9] p-10 flex-col justify-between">
        <motion.img
          src="/login-bg.png"
          alt="radar"
          className="absolute z-0 opacity-20 w-[35%]"
          animate={{
            x: [0, 200, -150, 100, 0],
            y: [0, -100, 150, 50, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="flex flex-col my-auto gap-2 z-10">
          <h1 className="text-5xl font-bold logo-name">Cliente na Mira 📡</h1>

          <div>
            <h2 className="text-4xl font-medium leading-tight">
              Encontre potenciais clientes antes dos seus concorrentes
            </h2>

            <p className="mt-4 text-lg opacity-80">
              Descubra negócios que precisam de você{" "}
              <span className="font-bold">agora</span>.
            </p>
          </div>
        </div>
        <p className="text-sm opacity-70 ">
          © {new Date().getFullYear()} Cliente na Mira | Desenvolvido por{" "}
          <a
            className="font-bold text-[#ffc300]"
            href="https://zunbee.com.br"
            target="_blank"
          >
            ZunBee
          </a>
        </p>
      </div>

      {/* LADO DIREITO */}
      <div className="flex w-full md:w-1/2 items-center justify-center bg-[#e9e9e9]">
        <SignIn
          appearance={{
            elements: {
              card: "bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl",
              formButtonPrimary:
                "bg-gradient-to-r from-purple-500 to-blue-500 hover:opacity-90",
              formFieldInput: "bg-zinc-800 text-white border border-zinc-700",
            },
          }}
        />
      </div>
    </div>
  );
}
