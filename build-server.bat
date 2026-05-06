@echo off
echo 🛠️ Compilando Orion 2 para Produção...
npx esbuild server.ts --bundle --platform=node --target=node22 --format=esm --outfile=server-dist.js --external:express --external:socket.io --external:dotenv --external:bcryptjs --external:jsonwebtoken --external:lucide-react --external:react --external:react-dom --external:react-router-dom --external:sonner --external:clsx --external:tailwind-merge --external:date-fns --external:zod --external:axios --external:tailwindcss --external:react-markdown --external:@google/genai --external:@supabase/supabase-js --external:@hookform/resolvers --external:react-hook-form --external:@radix-ui/*
echo ✅ Compilação concluída: server-dist.js criado!
pause
