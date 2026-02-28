import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Plus, MessageSquare, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function Templates() {
  const templates = [
    { id: 1, name: "boas_vindas", category: "MARKETING", status: "APPROVED", language: "pt_BR" },
    { id: 2, name: "lembrete_carrinho", category: "UTILITY", status: "PENDING", language: "pt_BR" },
    { id: 3, name: "oferta_relampago", category: "MARKETING", status: "REJECTED", language: "pt_BR" },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Gestor de Templates (HSM)</h2>
          <p className="text-zinc-500">Crie e gerencie mensagens proativas aprovadas pela Meta.</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Novo Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates Ativos</CardTitle>
          <CardDescription>Para iniciar conversas após 24h, você deve usar um template aprovado.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map(template => (
              <div key={template.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{template.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 uppercase tracking-wider">
                        {template.category}
                      </span>
                      <span className="text-xs text-zinc-500">{template.language}</span>
                    </div>
                  </div>
                </div>
                <div>
                  {template.status === 'APPROVED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      <CheckCircle2 className="w-4 h-4" /> Aprovado
                    </span>
                  )}
                  {template.status === 'PENDING' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                      <Clock className="w-4 h-4" /> Em Análise
                    </span>
                  )}
                  {template.status === 'REJECTED' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      <XCircle className="w-4 h-4" /> Rejeitado
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
