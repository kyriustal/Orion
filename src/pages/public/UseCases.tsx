import { ArrowRight, ShoppingBag, Headset, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/src/components/ui/button";

export default function UseCases() {
    return (
        <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
            <div className="text-center max-w-3xl mx-auto mb-20">
                <h1 className="text-5xl font-bold tracking-tight mb-6">Casos de Uso</h1>
                <p className="text-xl text-zinc-600">Veja como a tecnologia Orion revoluciona diferentes modelos de negócios pelo mundo.</p>
            </div>

            <div className="space-y-24">
                {/* E-commerce */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="bg-zinc-100 p-8 rounded-[2rem] h-full flex flex-col justify-center">
                        <ShoppingBag className="w-12 h-12 text-emerald-600 mb-6" />
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl rounded-bl-none shadow-sm max-w-[80%]">Você tem tênis de corrida tamanho 42?</div>
                            <div className="bg-emerald-600 text-white p-4 rounded-xl rounded-br-none shadow-sm ml-auto max-w-[80%]">Temos sim! O modelo AirRunner está em estoque. Posso te enviar o link da compra?</div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-4">E-commerce e Varejo</h2>
                        <p className="text-lg text-zinc-600 mb-6">Treine a IA com seu catálogo de produtos (PDF/CSV). O Orion atuará como vendedor virtual recomendando itens, informando estoque e enviando links de checkout diretamente no WhatsApp.</p>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Recuperação de carrinho</li>
                            <li className="flex items-center gap-3 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Status de entrega automático</li>
                            <li className="flex items-center gap-3 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> FAQ de devolução</li>
                        </ul>
                    </div>
                </div>

                {/* Support */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1">
                        <h2 className="text-3xl font-bold mb-4">Suporte Técnico Nível 1</h2>
                        <p className="text-lg text-zinc-600 mb-6">Pare de sobrecarregar seus analistas com dúvidas básicas ("Reset de senha", "Como configurar OSPF", etc). A IA absorve todos os manuais da empresa e resolve mais de 70% das ligações técnicas.</p>
                        <ul className="space-y-3 mb-8">
                            <li className="flex items-center gap-3 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Solução instantânea com base em manuais PDF</li>
                            <li className="flex items-center gap-3 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Transferência autônoma em problemas complexos</li>
                            <li className="flex items-center gap-3 font-medium"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> SLA Nível Prata sem desgaste humano</li>
                        </ul>
                    </div>
                    <div className="order-1 md:order-2 bg-zinc-100 p-8 rounded-[2rem] h-full flex flex-col justify-center">
                        <Headset className="w-12 h-12 text-emerald-600 mb-6" />
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl rounded-bl-none shadow-sm max-w-[80%]">Meu roteador pisca em vermelho, o que eu faço?</div>
                            <div className="bg-emerald-600 text-white p-4 rounded-xl rounded-br-none shadow-sm ml-auto max-w-[80%]">Segundo o manual oficial, luz vermelha indica falta de sinal de fibra. Por favor, reinicie e, se persistir, te passo para o suporte Nível 2.</div>
                        </div>
                    </div>
                </div>

                {/* Education & Info */}
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="bg-zinc-100 p-8 rounded-[2rem] h-full flex flex-col justify-center">
                        <BookOpen className="w-12 h-12 text-emerald-600 mb-6" />
                        <div className="space-y-4">
                            <div className="bg-white p-4 rounded-xl rounded-bl-none shadow-sm max-w-[80%]">Quais os documentos exigidos para Bolsas ProUni neste semestre?</div>
                            <div className="bg-emerald-600 text-white p-4 rounded-xl rounded-br-none shadow-sm ml-auto max-w-[80%]">A documentação atualizada do edital 2026 pede CPF, Identidade e comprovante de ensino médio via pública.</div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold mb-4">Instituições de Ensino</h2>
                        <p className="text-lg text-zinc-600 mb-6">Ajude candidatos ou alunos já matriculados tirando dúvidas baseadas apenas nos editais oficiais da universidade, e não em informações genéricas da internet.</p>
                    </div>
                </div>
            </div>

            <div className="text-center mt-20 pt-16 border-t border-zinc-200">
                <h2 className="text-3xl font-bold mb-6">Descubra se serve para o seu negócio</h2>
                <Link to="/register" target="_blank">
                    <Button className="rounded-full bg-emerald-600 text-white px-8 py-6 text-lg hover:bg-emerald-700">Falar no Chat ao Vivo <ArrowRight className="ml-2 w-5 h-5" /></Button>
                </Link>
            </div>
        </div>
    );
}
