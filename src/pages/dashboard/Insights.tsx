import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { BarChart, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";

export default function Insights() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Insights de IA & Sentimento</h2>
        <p className="text-zinc-500">Acompanhe como seus clientes se sentem ao interagir com o bot.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento Positivo</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">68%</div>
            <p className="text-xs text-zinc-500 mt-1">
              "Ótimo atendimento", "Obrigado!"
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento Neutro</CardTitle>
            <Minus className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-700">25%</div>
            <p className="text-xs text-zinc-500 mt-1">
              Dúvidas gerais, navegação.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento Negativo</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">7%</div>
            <p className="text-xs text-zinc-500 mt-1">
              "Quero falar com humano", "Não entendi"
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="w-5 h-5" /> Alerta de Detratores
          </CardTitle>
          <CardDescription className="text-amber-700">
            A IA detectou 3 clientes frustrados na última hora. Recomendamos intervenção humana.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-amber-100">
              <span className="text-sm font-medium text-zinc-900">+55 11 9999-8888</span>
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">FRUSTRATED</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white rounded-md border border-amber-100">
              <span className="text-sm font-medium text-zinc-900">+55 21 7777-6666</span>
              <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">FRUSTRATED</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
