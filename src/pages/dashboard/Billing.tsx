import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function Billing() {
  const plans = [
    {
      name: "Starter",
      price: "15.000 Kz",
      description: "Ideal para pequenos negócios começando com automação.",
      features: [
        "1 Número de WhatsApp",
        "500 Mensagens/mês",
        "IA Gemini 1.5 Flash",
        "Suporte por E-mail"
      ],
      buttonText: "Assinar Starter",
      popular: false
    },
    {
      name: "Pro",
      price: "45.000 Kz",
      description: "Para empresas que precisam de escala e inteligência avançada.",
      features: [
        "3 Números de WhatsApp",
        "Mensagens Ilimitadas*",
        "IA Gemini 1.5 Pro (Mais inteligente)",
        "Base de Conhecimento (RAG)",
        "Campanhas em Massa",
        "Suporte via WhatsApp"
      ],
      buttonText: "Assinar Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Sob Consulta",
      description: "Solução completa com white-label e suporte dedicado.",
      features: [
        "Números Ilimitados",
        "Mensagens Ilimitadas",
        "IA Personalizada",
        "White-label (Sua marca)",
        "Gerente de Conta Dedicado",
        "SLA de 99.9%"
      ],
      buttonText: "Falar com Consultor",
      popular: false
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900">Planos e Faturamento</h2>
        <p className="text-zinc-500 mt-4">Escolha o plano ideal para escalar o atendimento da sua empresa com Inteligência Artificial.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative flex flex-col ${plan.popular ? 'border-emerald-500 shadow-lg shadow-emerald-100' : 'border-zinc-200'}`}>
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Mais Popular
                </span>
              </div>
            )}
            <CardHeader className="text-center pb-8 pt-8">
              <CardTitle className="text-xl font-semibold text-zinc-900">{plan.name}</CardTitle>
              <div className="mt-4 flex items-baseline justify-center gap-x-2">
                <span className="text-4xl font-bold tracking-tight text-zinc-900">{plan.price}</span>
                {plan.price !== "Sob Consulta" && <span className="text-sm font-semibold leading-6 text-zinc-500">/mês</span>}
              </div>
              <CardDescription className="mt-4 text-sm leading-6 text-zinc-500">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-4 text-sm leading-6 text-zinc-600">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckCircle2 className="h-6 w-5 flex-none text-emerald-600" aria-hidden="true" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="mt-8">
              <Button 
                className={`w-full ${plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-zinc-900 hover:bg-zinc-800 text-white'}`}
                variant={plan.popular ? 'default' : 'outline'}
              >
                {plan.buttonText}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 text-center text-sm text-zinc-500">
        <p>* O uso ilimitado está sujeito à política de uso justo (Fair Use Policy).</p>
        <p>Pagamentos processados de forma segura via Proxypay (Referências Multicaixa).</p>
      </div>
    </div>
  );
}
