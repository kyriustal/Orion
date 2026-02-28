import { Webhook, ShieldCheck, Zap } from "lucide-react";

export default function MetaWebhooks() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-6">Webhooks Meta</h1>
                <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
                    Integração robusta e certificada com a WhatsApp Cloud API da Meta.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 mb-24 items-center">
                <div className="order-2 md:order-1">
                    <div className="bg-zinc-100 rounded-3xl p-8 border border-zinc-200">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-sm font-mono font-bold text-zinc-600">LISTENING TO META WEBHOOKS...</span>
                        </div>
                        <div className="space-y-3 font-mono text-xs text-zinc-500">
                            <div className="bg-white p-3 rounded-lg border border-zinc-200">
                                {`{ mode: "subscribe", verification_token: "orion_..." }`}
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-zinc-200 text-emerald-600">
                                {`Status: 200 OK - Webhook Verified`}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="order-1 md:order-2">
                    <h2 className="text-3xl font-bold mb-6">Conectividade de Nível Empresarial</h2>
                    <p className="text-zinc-600 text-lg mb-6">
                        Nossa infraestrutura escala automaticamente para processar milhares de eventos por segundo, garantindo que nenhuma mensagem do seu cliente seja perdida.
                    </p>
                    <div className="space-y-4">
                        <div className="flex gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-colors">
                            <Zap className="w-6 h-6 text-amber-500" />
                            <div>
                                <h4 className="font-bold">Tempo Real</h4>
                                <p className="text-sm text-zinc-500">Latência ultra-baixa no processamento de mensagens.</p>
                            </div>
                        </div>
                        <div className="flex gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-colors">
                            <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            <div>
                                <h4 className="font-bold">Tokens Seguros</h4>
                                <p className="text-sm text-zinc-500">Gerenciamento seguro de Meta Access Tokens.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
