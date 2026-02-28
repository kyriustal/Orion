import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/components/ui/card";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/src/components/ui/button";
import { toast } from "sonner";

export default function KnowledgeBase() {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<any[]>([]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setIsUploading(true);

    // Create a temporary file entry in the UI
    const tempId = Date.now().toString();
    const fileSizeStr = (file.size / (1024 * 1024)).toFixed(2) + " MB";

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
          "Authorization": "Bearer mock-jwt-token" // Required by requireAuth middleware
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao fazer upload");
      }

      const data = await response.json();

      // Update the temporary file with the real data
      setFiles(prev => prev.map(f =>
        f.id === tempId ? { ...f, id: data.file.id, status: data.file.status } : f
      ));

      toast.success(data.message);

      // If the backend returns 'processing', simulate it finishing after a few seconds
      if (data.file.status === 'processing') {
        setTimeout(() => {
          setFiles(prev => prev.map(f => f.id === data.file.id ? { ...f, status: 'ready' } : f));
        }, 3000);
      } else {
        // Force ready status for UI demonstration if backend returns ready immediately
        setFiles(prev => prev.map(f => f.id === data.file.id ? { ...f, status: 'ready' } : f));
      }

    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erro ao fazer upload do arquivo.");
      // Remove the temporary file on error
      setFiles(prev => prev.filter(f => f.id !== tempId));
    } finally {
      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Base de Conhecimento (RAG)</h2>
        <p className="text-zinc-500">Faça upload de documentos para a IA usar como contexto nas respostas.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivos</CardTitle>
          <CardDescription>Arraste arquivos PDF, DOCX, TXT, PNG, JPG ou CSV para treinar seu agente.</CardDescription>
        </CardHeader>
        <CardContent>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept=".pdf,.txt,.docx,.png,.jpg,.jpeg,.csv,.xlsx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword"
          />
          <div
            onClick={handleUploadClick}
            className="border-2 border-dashed border-zinc-200 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
              {isUploading ? <Loader2 className="w-6 h-6 text-zinc-600 animate-spin" /> : <Upload className="w-6 h-6 text-zinc-600" />}
            </div>
            <p className="text-sm font-medium text-zinc-900">Clique para anexar ficheiro ou arraste arquivos</p>
            <p className="text-xs text-zinc-500 mt-1">PDF, TXT, DOCX, PNG, JPG, CSV (Max 10MB)</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Arquivos Indexados</CardTitle>
          <CardDescription>Documentos que a IA já consegue ler e interpretar.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {files.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed rounded-xl bg-zinc-50/50">
                <p className="text-zinc-500 text-sm">Nenhum documento cadastrado na base de conhecimento.</p>
              </div>
            ) : (
              files.map(file => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-lg border border-zinc-200 bg-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-zinc-500" />
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
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Processando (Gerando Embeddings)
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
