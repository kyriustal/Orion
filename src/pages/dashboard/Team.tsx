import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/src/components/ui/card";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Users, UserPlus, Shield, MoreVertical, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Team() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [team, setTeam] = useState([
    { id: 1, name: "Carlos Admin", email: "carlos@orion.com", role: "ADMIN", status: "ACTIVE" },
    { id: 2, name: "Ana Atendimento", email: "ana@orion.com", role: "AGENT", status: "ACTIVE" },
    { id: 3, name: "Pedro Marketing", email: "pedro@orion.com", role: "VIEWER", status: "INVITED" },
  ]);

  const [newMember, setNewMember] = useState({ name: "", email: "", role: "AGENT" });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.name || !newMember.email) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setTeam([
        ...team,
        {
          id: Date.now(),
          name: newMember.name,
          email: newMember.email,
          role: newMember.role,
          status: "INVITED"
        }
      ]);
      
      toast.success("Convite enviado com sucesso!");
      setIsModalOpen(false);
      setNewMember({ name: "", email: "", role: "AGENT" });
    } catch (error) {
      toast.error("Erro ao enviar convite.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Equipe e Permissões</h2>
          <p className="text-zinc-500">Adicione funcionários para ajudar no atendimento manual e gestão.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> Convidar Membro
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
          <CardDescription>Gerencie quem tem acesso ao painel e ao Live Chat.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {team.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-900">{member.name}</p>
                    <p className="text-xs text-zinc-500">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    <span className="text-sm font-medium text-zinc-700">{member.role}</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      member.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {member.status}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-600">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Convidar Membro */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <form onSubmit={handleInvite}>
              <CardHeader>
                <CardTitle>Convidar Novo Membro</CardTitle>
                <CardDescription>Envie um convite por e-mail para adicionar alguém à sua equipe.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="memberName">Nome Completo</Label>
                  <Input 
                    id="memberName" 
                    placeholder="Ex: João Silva" 
                    value={newMember.name}
                    onChange={(e) => setNewMember({...newMember, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberEmail">E-mail</Label>
                  <Input 
                    id="memberEmail" 
                    type="email" 
                    placeholder="joao@empresa.com" 
                    value={newMember.email}
                    onChange={(e) => setNewMember({...newMember, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memberRole">Permissão (Role)</Label>
                  <select 
                    id="memberRole"
                    className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950"
                    value={newMember.role}
                    onChange={(e) => setNewMember({...newMember, role: e.target.value})}
                  >
                    <option value="ADMIN">Admin (Acesso Total)</option>
                    <option value="AGENT">Agente (Apenas Live Chat e Histórico)</option>
                    <option value="VIEWER">Visualizador (Apenas Relatórios)</option>
                  </select>
                </div>
              </CardContent>
              <CardFooter className="bg-zinc-50 border-t border-zinc-200 py-4 flex justify-end gap-2 rounded-b-xl">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar Convite'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
