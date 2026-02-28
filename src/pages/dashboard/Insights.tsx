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
            <div className="text-2xl font-bold text-zinc-400">---</div>
            <p className="text-xs text-zinc-500 mt-1">
              Aguardando interações reais
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento Neutro</CardTitle>
            <Minus className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-400">---</div>
            <p className="text-xs text-zinc-500 mt-1">
              Frequência de interações neutras
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sentimento Negativo</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-400">---</div>
            <p className="text-xs text-zinc-500 mt-1">
              Monitoramento de frustração
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 bg-zinc-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-zinc-500">
            <BarChart className="w-5 h-5" /> Análise de Detratores
          </CardTitle>
          <CardDescription className="text-zinc-500">
            A IA monitorará conversas com sentimento negativo para alertar você nestas situações.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-sm text-zinc-400 border-2 border-dashed rounded-lg">
            Nenhum alerta crítico no momento.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
