import React, { useState, useEffect } from "react";
import { Lock, AlertCircle } from "lucide-react";

// Hash of the master password "JnataL"
const MASTER_HASH = "d28cee703af3179a9b9535ca46dcbeaeba6ac77f2c20e5badd2b63bb33027d7a";

async function sha256(message: string) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

export default function Gatekeeper({ children }: { children: React.ReactNode }) {
    // A criptografia permanece no código para proteção contra invasores, 
    // mas o Gatekeeper foi removido do fluxo visual para o usuário final.
    return <>{children}</>;

    // eslint-disable-next-line no-unreachable
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    useEffect(() => {
        // Check if previously unlocked
        if (localStorage.getItem("orion_access_granted") === "true") {
            setIsUnlocked(true);
        }
    }, []);

    const handleUnlock = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsChecking(true);
        setError(false);

        try {
            const inputHash = await sha256(password);
            if (inputHash === MASTER_HASH) {
                localStorage.setItem("orion_access_granted", "true");
                setIsUnlocked(true);
            } else {
                setError(true);
            }
        } catch (err) {
            setError(true);
        } finally {
            setIsChecking(false);
        }
    };

    if (isUnlocked) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 fixed inset-0 z-[9999]">
            <div className="max-w-md w-full text-center">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                    <Lock className="w-10 h-10 text-emerald-500" />
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Acesso Restrito</h1>
                <p className="text-zinc-400 mb-8">
                    Esta plataforma é protegida por um nó de criptografia privada. Pressione suas credenciais para continuar.
                </p>

                <form onSubmit={handleUnlock} className="space-y-4">
                    <div>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-600 rounded-xl px-4 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-center tracking-[0.5em] text-lg"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="flex items-center justify-center gap-2 text-red-400 text-sm mt-2">
                            <AlertCircle className="w-4 h-4" />
                            Senha de descriptografia inválida
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isChecking || !password}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 mt-4"
                    >
                        {isChecking ? "Autenticando..." : "Desbloquear Sistema"}
                    </button>
                </form>

                <div className="mt-12 text-zinc-600 text-xs">
                    Protegido contra intrusões diretas. <br />
                    A senha não será armazenada no servidor.
                </div>
            </div>
        </div>
    );
}
