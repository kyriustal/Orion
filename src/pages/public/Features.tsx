import { Bot, MessageSquare, Zap, Target, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";

export default function Features() {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h1 className="text-5xl font-bold tracking-tight mb-6">Funcionalidades</h1>
                <p className="text-xl text-zinc-600">Tudo o que você precisa para automatizar seu atendimento no WhatsApp de ponta a ponta.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-20">
                <div className="bg-zinc-50 p-10 rounded-[2rem]">
                    <Bot className="w-10 h-10 text-emerald-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Base de Conhecimento (RAG)</h3>
                    <p className="text-zinc-600 mb-6">Faça upload de FAQs, catálogos e manuais em PDF ou TXT. O sistema lê o conteúdo e treina a IA instantaneamente para responder aos seus clientes sem alucinar.</p>
                    <ul className="space-y-3 font-medium text-sm text-zinc-700">
                        <li className="flex items-center gap-2">- Upload ilimitado de documentos</li>
                        <li className="flex items-center gap-2">- Indexação instantânea (Vector Database)</li>
                        <li className="flex items-center gap-2">- Conversação baseada em fatos reais</li>
                    </ul>
                </div>

                <div className="bg-zinc-50 p-10 rounded-[2rem]">
                    <MessageSquare className="w-10 h-10 text-emerald-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Meta WhatsApp Oficial</h3>
                    <p className="text-zinc-600 mb-6">Não corra risco de banimento com WhatsApp Web clandestino. Utilizamos a Cloud API oficial da Meta (Facebook) para estabilidade 100%.</p>
                    <ul className="space-y-3 font-medium text-sm text-zinc-700">
                        <li className="flex items-center gap-2">- Recebimento instantâneo (Webhooks)</li>
                        <li className="flex items-center gap-2">- Disparo de respostas sem atraso</li>
                        <li className="flex items-center gap-2">- Configuração WABA ID no Painel</li>
                    </ul>
                </div>

                <div className="bg-zinc-50 p-10 rounded-[2rem]">
                    <Zap className="w-10 h-10 text-emerald-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">IA Gemini 2.5 Flash</h3>
                    <p className="text-zinc-600 mb-6">Processamento de Linguagem Natural avançado fornecido pelo Google. Respostas humanas, rápidas e precisas, que entendem o tom de voz da sua marca.</p>
                </div>

                <div className="bg-zinc-50 p-10 rounded-[2rem]">
                    <Target className="w-10 h-10 text-emerald-600 mb-6" />
                    <h3 className="text-2xl font-bold mb-4">Transferência Humana Activa</h3>
                    <p className="text-zinc-600 mb-6">O bot percebe quando o cliente está irritado ou pede para falar com um humano, pausando a automação e notificando sua equipe de atendimento imediatamente via Dashboard.</p>
                </div>
            </div>

            <div className="text-center">
                <Link to="/register" target="_blank">
                    <Button className="rounded-full bg-emerald-600 text-white px-8 py-6 text-lg hover:bg-emerald-700">Testar Funcionalidades <ArrowRight className="ml-2 w-5 h-5" /></Button>
                </Link>
            </div>
        </div>
    );
}
