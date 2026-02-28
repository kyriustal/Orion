import { Bot, FileText, Database, Shield } from "lucide-react";

export default function KnowledgeRAG() {
    return (
        <div className="max-w-7xl mx-auto px-6 py-20">
            <div className="text-center mb-16">
                <h1 className="text-5xl font-bold mb-6">Base de Conhecimento RAG</h1>
                <p className="text-xl text-zinc-600 max-w-3xl mx-auto">
                    Alimente sua IA com a inteligência específica da sua empresa. Sem alucinações, apenas fatos.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-24">
                <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <FileText className="w-10 h-10 text-emerald-600 mb-6" />
                    <h3 className="text-xl font-bold mb-4">Upload de Documentos</h3>
                    <p className="text-zinc-600">Arraste seus manuais em PDF, TXT ou DOCX e nossa IA extrai o conhecimento instantaneamente.</p>
                </div>
                <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <Database className="w-10 h-10 text-blue-600 mb-6" />
                    <h3 className="text-xl font-bold mb-4">Memória Dinâmica</h3>
                    <p className="text-zinc-600">A IA resgata a informação certa no momento exato da conversa usando Retrieval-Augmented Generation.</p>
                </div>
                <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-100">
                    <Shield className="w-10 h-10 text-amber-500 mb-6" />
                    <h3 className="text-xl font-bold mb-4">Segurança de Dados</h3>
                    <p className="text-zinc-600">Seus documentos são criptografados e acessíveis apenas pela sua organização.</p>
                </div>
            </div>

            <div className="bg-emerald-600 rounded-[3rem] p-12 text-white text-center">
                <h2 className="text-3xl font-bold mb-6">Treine sua IA em 30 segundos</h2>
                <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
                    Chega de configurar fluxos complexos. Apenas dê a ela os manuais e deixe que a inteligência do Google Gemini cuide do resto.
                </p>
            </div>
        </div>
    );
}
