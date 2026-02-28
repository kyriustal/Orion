import { MessageSquare, Bot, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function WhatsappIA() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-6">WhatsApp IA</h1>
                <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
                    Transforme seu número de WhatsApp em uma máquina de vendas e suporte com Inteligência Artificial de elite.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                <div>
                    <h2 className="text-3xl font-bold mb-6">Automação Inteligente</h2>
                    <p className="text-lg text-zinc-600 mb-6">
                        Nossa IA não apenas responde, ela entende o contexto do seu cliente e fornece soluções precisas em segundos, sem a necessidade de intervenção humana constante.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs font-mono">✓</div>
                            <span>Disponibilidade 24/7 sem interrupções</span>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs font-mono">✓</div>
                            <span>Conexão direta com a Cloud API da Meta</span>
                        </li>
                        <li className="flex gap-3">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-xs font-mono">✓</div>
                            <span>Escalabilidade para milhares de mensagens simultâneas</span>
                        </li>
                    </ul>
                </div>
                <div className="bg-zinc-900 rounded-[2rem] p-8 text-white shadow-2xl">
                    <div className="space-y-4">
                        <div className="bg-zinc-800 p-4 rounded-xl rounded-bl-none max-w-[80%]">
                            Como posso ajudar você hoje?
                        </div>
                        <div className="bg-emerald-600 p-4 rounded-xl rounded-br-none max-w-[80%] ml-auto">
                            Qual é o prazo de entrega para Benguela?
                        </div>
                        <div className="bg-zinc-800 p-4 rounded-xl rounded-bl-none max-w-[80%]">
                            O prazo para **Benguela** é de 3 a 5 dias úteis. Gostaria de rastrear um pedido?
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
