import { Router, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

export const knowledgeRouter = Router();

// Configuração do Multer para salvar arquivos temporariamente
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // Limite de 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/msword"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Tipo de arquivo não suportado. Envie PDF, TXT, DOCX, PNG, JPG, CSV, etc."));
    }
  },
});

import { getSupabase } from "../services/supabase.service";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

// Endpoint para upload de arquivos para a Base de Conhecimento (RAG)
knowledgeRouter.post("/upload", (req: Request, res: Response, next) => {
  upload.single("file")(req, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhum arquivo enviado." });
    }

    const { originalname, size, filename, path: filePath } = req.file;
    // Opcional: Pegar o org_id do usuário logado. Como é demo vamos assumir a organização padrão (criada no SQL).
    const orgId = (req as any).user?.org_id || "00000000-0000-0000-0000-000000000000";

    // Extrair o texto do arquivo
    let extractedText = "";
    const ext = path.extname(originalname).toLowerCase();

    if (ext === ".txt" || ext === ".csv") {
      extractedText = fs.readFileSync(filePath, "utf-8");
    } else if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      extractedText = pdfData.text;
    } else {
      extractedText = `Conteúdo não processado para ${ext}.`;
    }

    // Salvar o conteúdo processado no banco de dados SUPABASE
    const supabase = getSupabase();
    const { error } = await supabase.from('knowledge_documents').insert([{
      org_id: orgId,
      filename: filename,
      original_name: originalname,
      content: extractedText,
      size: size,
      status: 'ready'
    }]);

    if (error) {
      console.error("[Supabase Error]", error);
      throw new Error("Falha ao salvar o documento no Supabase.");
    }

    // Apagar o arquivo temporário local para poupar espaço
    fs.unlinkSync(filePath);

    // Retorna os dados do arquivo processado
    res.json({
      message: "Arquivo recebido e indexado com sucesso no Supabase!",
      file: {
        id: filename,
        name: originalname,
        size: size,
        status: "ready", // Pronto para uso imediato pela LLM
      },
    });
  } catch (error: any) {
    console.error("Erro no upload e extração:", error);
    res.status(500).json({ error: error.message || "Erro interno ao processar o arquivo." });
  }
});

// Endpoint para listar os arquivos da empresa logada no Supabase
knowledgeRouter.get("/files", async (req: Request, res: Response) => {
  try {
    const orgId = (req as any).user?.org_id || "00000000-0000-0000-0000-000000000000";
    const supabase = getSupabase();

    const { data: files, error } = await supabase
      .from('knowledge_documents')
      .select('id, original_name, size, status, created_at')
      .eq('org_id', orgId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Formatando para o painel frontend (mapeando original_name para name)
    const formatted = (files || []).map(f => ({
      ...f,
      name: f.original_name
    }));

    res.json(formatted);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Falha ao buscar os documentos no Supabase." });
  }
});
