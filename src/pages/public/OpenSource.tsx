import { Github, Code, Users, ExternalLink } from "lucide-react";
import { Button } from "@/src/components/ui/button";

export default function OpenSource() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-6">GitHub Open Source</h1>
                <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
                    Acreditamos no poder da comunidade. Explore, contribua e escale.
                </p>
            </div>

            <div className="bg-zinc-900 rounded-[3rem] p-12 text-white mb-24 shadow-2xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-12 opacity-10">
                    <Github className="w-64 h-64" />
                </div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-bold mb-6">Orion Core Engine</h2>
                    <p className="text-lg opacity-80 mb-8 max-w-2xl">
                        Nosso motor principal é open-source. Queremos que desenvolvedores de todo o mundo possam construir soluções de IA incríveis sobre a nossa base sólida.
                    </p>
                    <a href="https://github.com/kyriustal/Orion" target="_blank" rel="noopener noreferrer">
                        <Button className="bg-white text-zinc-900 hover:bg-zinc-100 rounded-full px-8 py-6 font-bold flex items-center gap-2">
                            <Github className="w-5 h-5" />
                            Ver no GitHub
                            <ExternalLink className="w-4 h-4" />
                        </Button>
                    </a>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
                <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Code className="text-emerald-600 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-3">Extensível</h3>
                        <p className="text-zinc-600">Adicione novos provedores de IA, exportadores de dados e integrações personalizadas com facilidade.</p>
                    </div>
                </div>
                <div className="flex gap-6 items-start">
                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                        <Users className="text-blue-600 w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold mb-3">Comunidade</h3>
                        <p className="text-zinc-600">Junte-se a centenas de desenvolvedores focados em levar o atendimento automatizado ao próximo nível.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
