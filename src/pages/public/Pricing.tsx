import { CheckCircle2, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";

export default function Pricing() {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
            <div className="text-center max-w-3xl mx-auto mb-16">
                <h1 className="text-5xl font-bold tracking-tight mb-6">Preços simples para escalar.</h1>
                <p className="text-xl text-zinc-600">Invista em Inteligência Artificial e economize com equipes de suporte. Pague em Kwanza pelos atendimentos do seu agente na Meta.</p>
            </div>

            {/* Free Trial Banner */}
            <div className="max-w-5xl mx-auto mb-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-[2rem] p-8 md:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <Gift className="w-8 h-8 text-emerald-200" />
                        <h3 className="text-3xl font-bold">7 Dias de Teste 100% Gratuito</h3>
                    </div>
                    <p className="text-emerald-50 max-w-lg text-lg">Experimente o poder dos Agentes de IA nas suas vendas sem compromisso. Avalie os relatórios de conversação e decida depois.</p>
                </div>
                <div className="shrink-0 w-full md:w-auto">
                    <Link to="/register" target="_blank" className="w-full">
                        <Button className="w-full md:w-auto rounded-full bg-white text-emerald-600 hover:bg-zinc-100 font-bold px-8 py-6 text-lg shadow-lg">Ativar Meu Teste Grátis</Button>
                    </Link>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {/* Starter Plan */}
                <div className="border border-zinc-200 rounded-[2rem] p-8 bg-white flex flex-col">
                    <h3 className="text-2xl font-bold mb-2">Starter</h3>
                    <p className="text-zinc-500 mb-6 text-sm">Para pequenas empresas e autônomos.</p>
                    <div className="mb-6">
                        <span className="text-4xl font-bold">18.990 Kz</span>
                        <span className="text-zinc-500">/mês</span>
                    </div>
                    <Link to="/register" target="_blank" className="w-full mb-8">
                        <Button variant="outline" className="w-full rounded-xl py-6 border-zinc-300 font-bold">Escolher Plano</Button>
                    </Link>
                    <ul className="space-y-4 text-sm font-medium flex-1">
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 1 Número de WhatsApp</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> 1.500 Mensagens da IA</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Treinamento RAG Básico</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> Suporte Comunitário</li>
                    </ul>
                </div>

                {/* Pro Plan */}
                <div className="border border-emerald-500 rounded-[2rem] p-8 bg-zinc-900 text-white flex flex-col shadow-2xl relative transform md:scale-105">
                    <div className="absolute top-0 right-8 transform -translate-y-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Mais Popular</div>
                    <h3 className="text-2xl font-bold mb-2">Scale</h3>
                    <p className="text-zinc-400 mb-6 text-sm">Para operações de vendas a todo vapor.</p>
                    <div className="mb-6">
                        <span className="text-4xl font-bold text-emerald-400">35.990 Kz</span>
                        <span className="text-zinc-400">/mês</span>
                    </div>
                    <Link to="/register" target="_blank" className="w-full mb-8">
                        <Button className="w-full rounded-xl py-6 bg-emerald-500 hover:bg-emerald-600 text-white font-bold">Escolher Plano</Button>
                    </Link>
                    <ul className="space-y-4 text-sm font-medium flex-1">
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> 3 Números de WhatsApp</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> 5.000 Mensagens da IA</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Upload de Documentos Ilimitado</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Escalonamento Humano no Chat</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> Suporte Prioritário</li>
                    </ul>
                </div>

                {/* Enterprise Plan */}
                <div className="border border-zinc-200 rounded-[2rem] p-8 bg-white flex flex-col">
                    <h3 className="text-2xl font-bold mb-2">Enterprise</h3>
                    <p className="text-zinc-500 mb-6 text-sm">Altíssimo volume. Redes e Franquias.</p>
                    <div className="mb-6">
                        <span className="text-4xl font-bold">69.500 Kz</span>
                        <span className="text-zinc-500">/mês</span>
                    </div>
                    <Link to="/register" target="_blank" className="w-full mb-8">
                        <Button variant="outline" className="w-full rounded-xl py-6 border-zinc-300 font-bold">Escolher Plano</Button>
                    </Link>
                    <ul className="space-y-4 text-sm font-medium flex-1 text-zinc-600">
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> 10 Números de WhatsApp</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> 15.000 Mensagens da IA</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> Integração API REST direta</li>
                        <li className="flex gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> Gerente de Contas Orion</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
