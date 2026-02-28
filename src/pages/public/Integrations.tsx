import { ArrowRight, Link as LinkIcon, Box, Database, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";

export default function Integrations() {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h1 className="text-5xl font-bold tracking-tight mb-6">Integrações Nativas</h1>
                <p className="text-xl text-zinc-600">Conecte o Orion ao ecossistema que você já usa todos os dias.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-20">
                <div className="border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow bg-white">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-6">
                        <LinkIcon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">WhatsApp Cloud API</h3>
                    <p className="text-zinc-600 text-sm mb-4">A conexão oficial e não-oficial não se misturam. Estamos direto com a Meta. (Built-in)</p>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Instalado</span>
                </div>

                <div className="border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow bg-white">
                    <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6">
                        <Database className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Supabase (PostgreSQL)</h3>
                    <p className="text-zinc-600 text-sm mb-4">Isolamento de dados da sua empresa seguro por row-level security. (Built-in)</p>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Instalado</span>
                </div>

                <div className="border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow bg-white">
                    <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-6">
                        <Box className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Google Gemini 2.5</h3>
                    <p className="text-zinc-600 text-sm mb-4">Motor global de inteligência artificial generativa ultrarrápida. (Built-in)</p>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Instalado</span>
                </div>

                <div className="border border-zinc-200 rounded-2xl p-8 hover:shadow-lg transition-shadow bg-zinc-50">
                    <div className="w-16 h-16 bg-zinc-200 text-zinc-500 rounded-full flex items-center justify-center mb-6">
                        <Webhook className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">Webhooks Personalizados</h3>
                    <p className="text-zinc-600 text-sm mb-4">Envie sinais para Make, Zapier, N8N quando uma conversa for transacionada.</p>
                    <span className="text-xs font-bold text-zinc-500 bg-zinc-200 px-2 py-1 rounded">Em Breve</span>
                </div>
            </div>

            <div className="bg-emerald-600 rounded-[2rem] p-12 text-center text-white">
                <h2 className="text-3xl font-bold mb-4">Precisa de uma integração customizada?</h2>
                <p className="text-emerald-100 mb-8 max-w-2xl mx-auto">Temos a API aberta pronta para conectar ao seu ERP ou CRM. Descubra as possibilidades ou fale com nosso time para enterprise.</p>
                <Link to="/api-docs">
                    <Button className="rounded-full bg-white text-emerald-600 hover:bg-zinc-100 px-8 py-6 text-lg font-bold">Ver Documentação <ArrowRight className="ml-2 w-5 h-5" /></Button>
                </Link>
            </div>
        </div>
    );
}
