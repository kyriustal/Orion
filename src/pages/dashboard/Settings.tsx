import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Switch } from "@/src/components/ui/switch";
import { Save, Loader2, Key } from "lucide-react";
import { toast } from "sonner";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    name: "",
    use_emojis: true
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/settings/org", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!response.ok) throw new Error("Erro ao carregar configurações");
      const data = await response.json();
      setSettings(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/settings/org", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ use_emojis: settings.use_emojis })
      });
      if (!response.ok) throw new Error("Erro ao salvar configurações");
      toast.success("Configurações atualizadas com sucesso!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Configurações</h2>
        <p className="text-zinc-500">Personalize o comportamento da sua IA e gerencie sua empresa.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Personalidade da IA</CardTitle>
              <CardDescription>Defina como o robô deve interagir com seus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2">
                <div className="space-y-0.5">
                  <Label htmlFor="use-emojis">Usar Emojis</Label>
                  <p className="text-sm text-zinc-500">
                    A IA usará emojis para tornar as conversas mais amigáveis e descontraídas.
                  </p>
                </div>
                <Switch
                  id="use-emojis"
                  checked={settings.use_emojis}
                  onCheckedChange={(checked) => setSettings({ ...settings, use_emojis: checked })}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Salvar Preferências
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Perfil da Empresa</CardTitle>
              <CardDescription>Informações básicas do seu negócio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input id="companyName" value={settings.name} onChange={(e) => setSettings({ ...settings, name: e.target.value })} />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Editar Perfil Completo</Button>
            </CardFooter>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Segurança e API</CardTitle>
              <CardDescription>Gerencie suas chaves de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Chave do Webhook Meta</Label>
                <div className="flex gap-2">
                  <Input id="apiKey" readOnly value="************************" className="font-mono text-sm bg-zinc-50" />
                  <Button variant="outline" size="icon"><Key className="w-4 h-4" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
