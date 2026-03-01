import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

type KnowledgeFile = {
  id: string;
  name: string;
  size: string | number;
  status: string;
  created_at?: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

export default function KnowledgeBase() {
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);

  // Load existing documents from the database on mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/knowledge/files", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });
      if (!response.ok) throw new Error("Falha ao carregar documentos");
      const data = await response.json();
      setFiles(data.map((f: any) => ({
        id: f.id,
        name: f.name || f.original_name,
        size: typeof f.size === "number" ? formatSize(f.size) : f.size,
        status: f.status || "ready",
        created_at: f.created_at
      })));
    } catch (error: any) {
      console.error("Erro ao carregar base de conhecimento:", error);
      toast.error("Não foi possível carregar os documentos.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsUploading(true);

    const tempId = Date.now().toString();
    const fileSizeStr = formatSize(file.size);

    setFiles(prev => [
      { id: tempId, name: file.name, size: fileSizeStr, status: "processing" },
      ...prev
    ]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/knowledge/upload", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao fazer upload");
      }

      const data = await response.json();

      // Update the temporary file entry with real data from the server
      setFiles(prev => prev.map(f =>
        f.id === tempId
          ? { ...f, id: data.file.id, status: "ready" }
          : f
      ));

      toast.success(`✅ "${file.name}" indexado com sucesso! A IA já pode usar este documento.`);
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao fazer upload do arquivo.");
      setFiles(prev => prev.filter(f => f.id !== tempId));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Base de Conhecimento (RAG)</h2>
        <p className="text-zinc-500">Faça upload de documentos para a IA usar como contexto nas respostas. Quanto mais documentos, mais inteligente fica o agente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivos</CardTitle>
          <CardDescription>PDF, TXT, DOCX, PNG, JPG, CSV — até 10MB por arquivo.</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            aria-label="Upload de documento para base de conhecimento"
            accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.csv,.xlsx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword"
          />
          <div
            onClick={handleUploadClick}
            className="border-2 border-dashed border-zinc-200 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-emerald-50 hover:border-emerald-400 transition-colors cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-4 border border-emerald-200">
              {isUploading ? (
                <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
              ) : (
                <Upload className="w-7 h-7 text-emerald-600" />
              )}
            </div>
            <p className="text-sm font-semibold text-zinc-900">
              {isUploading ? "A indexar documento..." : "Clique para enviar ou arraste um ficheiro"}
            </p>
            <p className="text-xs text-zinc-500 mt-1">PDF, TXT, DOCX, PNG, JPG, CSV (Máx 10MB)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Documentos Indexados</CardTitle>
            <CardDescription>A IA consulta estes documentos em tempo real ao responder.</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={loadFiles} disabled={isLoading} className="gap-2 text-zinc-500">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "↻ Atualizar"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto" />
                <p className="text-sm text-zinc-500 mt-2">A carregar documentos...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-xl bg-zinc-50/50">
                <FileText className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-zinc-600 font-medium text-sm">Nenhum documento indexado</p>
                <p className="text-zinc-400 text-xs mt-1">Envie um PDF, TXT ou CSV acima para treinar o agente.</p>
              </div>
            ) : (
              files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900">{file.name}</p>
                      <p className="text-xs text-zinc-500">{file.size}</p>
                    </div>
                  </div>
                  <div>
                    {file.status === 'ready' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Pronto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Indexando...
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
