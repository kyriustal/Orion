import { ShieldCheck, Lock, Server } from "lucide-react";

export default function Security() {
    return (
        <div className="max-w-4xl mx-auto px-6 pt-20 pb-32">
            <div className="text-center mb-20">
                <h1 className="text-5xl font-bold tracking-tight mb-6">Segurança e Privacidade</h1>
                <p className="text-xl text-zinc-600">A proteção dos dados da sua empresa e dos seus clientes é o pilar da arquitetura Orion.</p>
            </div>

            <div className="space-y-12">
                <section className="bg-zinc-50 rounded-[2rem] p-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <ShieldCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Conformidade com LGPD</h2>
                    </div>
                    <p className="text-zinc-600 leading-relaxed mb-4">
                        A Orion foi desenvolvida com a Lei Geral de Proteção de Dados do Brasil (LGPD) e a GDPR europeia em mente. Não retemos os números de telefone finais dos seus clientes de forma crua após o término da sessão (24h da Meta). Toda identificação pessoal pode ser anonimizada via painel administrativo.
                    </p>
                    <ul className="list-disc pl-5 text-zinc-600 space-y-2">
                        <li>Nós não vendemos logs de conversa.</li>
                        <li>Seu painel conta com um botão de "Purge" para exclusão instantânea e permanente.</li>
                        <li>Conformidade com os termos estritos da API Cloud do Facebook.</li>
                    </ul>
                </section>

                <section className="bg-zinc-50 rounded-[2rem] p-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Lock className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Isolamento Multi-tenant (Supabase RLS)</h2>
                    </div>
                    <p className="text-zinc-600 leading-relaxed mb-4">
                        O seu banco de dados de Inteligência (os manuais e PDFs que você enviou ao sistema RAG) são estritamente isolados através de Row-Level Security (Segurança a Nível de Linha) no PostgreSQL via Supabase.
                    </p>
                    <p className="text-zinc-600 leading-relaxed">
                        Isto garante matematicamente, no nível do kernel do banco de dados, que nenhuma outra empresa usando a Orion consiga consultar seus dados de faturamento, suas chaves da Meta ou os seus arquivos de aprendizagem da IA.
                    </p>
                </section>

                <section className="bg-zinc-50 rounded-[2rem] p-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                            <Server className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h2 className="text-2xl font-bold">Inteligência Privada (Google Cloud)</h2>
                    </div>
                    <p className="text-zinc-600 leading-relaxed mb-4">
                        A Orion utiliza o modelo Google Gemini Flash 2.5 pelas APIs Enterprise em Nuvem, e seus dados de prompt não são usados pelo Google para treinar modelos base públicos secundários. Você obtém a eficácia global de IA combinada com a sua privacidade local.
                    </p>
                </section>
            </div>
        </div>
    );
}
