# Manual de Boas Práticas Técnicas: WhatsApp Cloud API

Este documento orienta a configuração do ambiente de produção para o SaaS de Agentes de IA.

## 1. Configuração do Webhook na Meta for Developers

Para que o sistema receba mensagens em tempo real, você deve configurar o Webhook no painel da Meta:

1. Acesse [Meta for Developers](https://developers.facebook.com/).
2. Vá no seu aplicativo > **WhatsApp** > **Configuração**.
3. Na seção **Webhooks**, clique em **Editar**.
4. **URL de Retorno (Callback URL):** Insira a URL pública do seu backend seguida de `/api/webhook` (Ex: `https://seu-dominio.com/api/webhook`).
5. **Token de Verificação:** Insira o mesmo valor definido na variável de ambiente `META_VERIFY_TOKEN` do seu arquivo `.env`.
6. Clique em **Verificar e Salvar**.
7. Em **Campos do Webhook**, clique em **Gerenciar** e assine o campo `messages`.

## 2. Gerenciamento do Token de Acesso Permanente (System User Token)

Tokens temporários expiram em 24 horas. Para um SaaS, você precisa de um Token Permanente:

1. Acesse o [Gerenciador de Negócios da Meta](https://business.facebook.com/settings).
2. Vá em **Usuários** > **Usuários do Sistema**.
3. Clique em **Adicionar** e crie um usuário com a função de **Administrador**.
4. Selecione o usuário criado e clique em **Adicionar Ativos**. Atribua o seu Aplicativo com controle total.
5. Clique em **Gerar Novo Token**.
6. Selecione o aplicativo e marque as permissões:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
7. Copie o token gerado. **Este token não expira** e deve ser salvo na tabela `whatsapp_configs` no campo `access_token` para cada cliente (Tenant).

## 3. Conformidade e Anti-Banimento (Políticas da Meta)

* **Janela de 24 Horas:** A API da Meta só permite enviar mensagens livres (texto) em até 24 horas após a última mensagem do usuário. O sistema trata o erro `131030` caso isso ocorra.
* **Delay de Envio:** O código implementa um `setTimeout` de 1 segundo antes de enviar a resposta da IA. Isso simula digitação humana e evita bloqueios por *spam/rate limit*.
* **Opt-out e Transbordo:** O sistema reconhece os comandos `/sair` e `/falar com humano`, parando imediatamente a atuação da IA para aquele usuário, garantindo conformidade com as regras de opt-out da Meta.
