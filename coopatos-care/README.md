# Zeladoria Coopatos

Sistema acadêmico para registro, acompanhamento e comunicação de chamados de zeladoria/manutenção no ambiente da Coopatos.

O projeto nasceu em conversas separadas de desenvolvimento, então este README também funciona como memória técnica para próximos ciclos. Antes de implementar qualquer item listado como pendência, confira o código atual: algumas ideias podem já ter sido feitas, alteradas ou descartadas.

## Objetivo

Permitir que funcionários registrem chamados com categoria, descrição, localização e mídias, acompanhem o andamento das ocorrências e conversem em tempo real sobre cada chamado.

Categorias citadas no contexto do projeto incluem manutenção hídrica, elétrica, erosão, segurança, vegetação e outros tipos de zeladoria.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS e shadcn/ui
- Backend: Node.js, Express e TypeScript
- ORM: Prisma
- Banco de dados: PostgreSQL no Neon
- Hospedagem do frontend: Vercel
- Hospedagem da API: Render
- Uploads de mídia: Cloudinary
- Tempo real: Socket.IO
- E-mail: Nodemailer com SMTP Gmail

## Estrutura Principal

- `src/config/brand.ts`: preset whitelabel do frontend com nome, slogan, logo, favicon e cores.
- `src/components/BrandLogo.tsx`: componente único para renderizar a logo configurada no preset.
- `backend/src/config/brand.ts`: preset whitelabel usado pelo backend em e-mails e textos server-side.
- `src/pages/EmployeeLogin.tsx`: login do funcionário, recuperação de matrícula e bloqueio do domínio público.
- `src/pages/EmployeePanel.tsx`: painel principal do funcionário, chamados, chat, notificações e interações em tempo real.
- `src/pages/AdminLogin.tsx`: login administrativo.
- `src/pages/Dashboard.tsx`: início do painel administrativo.
- `src/contexts/AuthContext.tsx`: autenticação local de funcionário/admin.
- `backend/src/server.ts`: servidor Express, HTTP server e Socket.IO.
- `backend/src/routes/index.ts`: rotas principais da API.
- `prisma/schema.prisma`: modelos do banco.
- `vercel.json`: rewrite do frontend para SPA.

## Whitelabel

O projeto pode ser usado como modelo para outras empresas. A identidade visual possui preset padrão no código e também pode ser alterada pelo painel administrativo.

- `src/config/brand.ts`: altera nome do app, nome curto, organização, slogan, logo, favicon e cores do frontend.
- `backend/src/config/brand.ts`: altera nome, logo pública e cores usadas em e-mails enviados pela API.
- `prisma/schema.prisma`: modelo `BrandSetting`, usado para persistir o preset whitelabel no banco.
- `backend/src/routes/index.ts`: rotas `GET /brand-settings` e `PUT /admin/brand-settings`, carregando/salvando o preset usado por frontend e e-mails.

As cores do frontend são aplicadas como CSS variables no carregamento da aplicação. Elementos que usam `primary`, `secondary`, `gradient-primary`, `gradient-secondary` e `gradient-hero` acompanham o preset automaticamente.

Em `Configurações > Personalização`, o admin altera nome do sistema, nome curto, organização, título administrativo, slogan, cores principais e envia uma logo PNG. A aplicação valida o formato PNG, envia a imagem para o Cloudinary, salva o preset no backend e sincroniza no login, no painel administrativo, na área do funcionário e nos e-mails de validação. O botão de restaurar padrão volta para a identidade Coopatos e também atualiza o backend.

Modelo recomendado para acesso administrativo: `Employee` representa a pessoa/funcionário real e `User` representa a credencial administrativa. Quando alguém precisar acessar o admin, crie/vincule um `User` ao `Employee` existente pelo campo `employeeId`. Assim permissões por departamento, auditoria, sessão única e rastreio de ações continuam ligados a uma pessoa real.

Quando um funcionário do departamento administrativo valida o e-mail, a API cria ou vincula automaticamente um `User` administrativo e envia um e-mail para definir a senha do painel. O login administrativo também possui fluxo de "Esqueci minha senha", com link temporário de redefinição por e-mail.

## Funcionalidades Já Presentes

- Login de funcionário por matrícula e CPF.
- Login administrativo.
- Sessão persistente no navegador.
- Controle de sessão única com token ativo.
- Logout forçado via Socket.IO.
- Controle de inatividade.
- Chamados com categoria, endereço, coordenadas e mídia.
- Upload de imagem, vídeo e áudio via Cloudinary.
- Edição de chamados.
- Remoção de mídia também no Cloudinary.
- Participantes de chamados.
- Chat por chamado.
- Chat privado.
- Resposta, edição e exclusão de mensagens.
- Notificações em tempo real.
- Indicador de digitação.
- Busca/filtros em telas do funcionário.
- Recuperação de matrícula por e-mail e CPF.
- Preset whitelabel para trocar nome, logo, favicon e cores principais.
- Admin: CRUD de funcionários iniciado com listagem, busca, criação/edição em modal, foto de perfil, data de nascimento, departamento por preset, desativação/restauração e validação de e-mail.
- Admin: registro visual de quando o e-mail de validação foi enviado, cooldown de reenvio e validação por rota do frontend (`/validar-email/:token`) chamando a API.
- Admin: criação, edição, exclusão e atribuição múltipla de funcionários em chamados pelo modal administrativo.
- Admin: chamados com GPS, busca por endereço, preenchimento por CEP, upload de fotos/vídeos, expansão, download, remoção de mídia e preview responsivo.
- Admin: filtro de período personalizado por data inicial/final, além dos atalhos de 7, 30, 90, 180 e 365 dias.
- Admin: acesso administrativo bloqueado para usuários fora do departamento administrativo.
- Chamados: prioridade persistida no banco (`BAIXA`, `MEDIA`, `ALTA`, `CRITICA`) e exibida visualmente na lista/admin.
- Validação de e-mail: link volta para o site, a página valida no backend, o token é invalidado após uso e e-mails já validados não podem receber novo link de validação.
- Validação de e-mail: usuários existentes com e-mail foram marcados como validados via migration; novos cadastros e trocas futuras de e-mail continuam exigindo validação.
- Vercel: `vercel.json` mantém apenas o rewrite de SPA; o domínio em produção responde em `www.zeladoriacoopatos.com.br`, e o domínio raiz pode ser definido como primário nas configurações do Vercel se a Coopatos quiser remover o `www`.
- Admin: filtros de chamados por categoria, status, funcionário atribuído, período e busca textual.
- Admin: mapa de chamados reconectado para pins e mapa de calor com base nos chamados filtrados, com z-index ajustado para não cobrir modais.
- Admin: cadastro de funcionário com CPF e telefone mascarados, limite de caracteres, validações de CPF/e-mail/telefone, e-mail obrigatório e envio assíncrono da validação logo após criar/alterar e-mail.
- Admin: exportações CSV para planilhas de funcionários, chamados e auditoria.
- Admin: auditoria inicial de cadastro/edição/desativação de funcionários, envio de validação e criação/edição de chamados.
- Admin: aba de indicadores com filtros próprios por categoria, status, pessoa, período e busca/local, seleção de quais cards/gráficos ficam visíveis, cards clicáveis para abrir chamados filtrados sem alterar os filtros dos indicadores, visão executiva, evolução mensal, status, prioridade, categorias, produtividade individual, eficiência por pessoa, backlog por status, produtividade por departamento, recorrência de locais, críticos pendentes e exportação PDF configurável.
- Admin: CRUD inicial de departamentos com criação/edição em modal, cor de identificação, ativação/desativação, busca, contadores e auditoria.
- Admin: rotas `/admin/*` protegidas no backend por sessão administrativa e departamento administrativo, não apenas pelo bloqueio visual do frontend.
- Funcionário: criação/edição de chamados com prioridade, finalização do próprio chamado e ordenação de "Meus Reportes" com pendentes primeiro, por prioridade e depois data.
- Admin: login administrativo apenas por e-mail, usuários com filtros por status/perfil/departamento, auditoria visual antes do download CSV e mudança rápida de departamento de funcionários.
- Admin: recuperação de senha administrativa por e-mail, página de redefinição e convite automático para funcionários administrativos com e-mail validado.
- Admin: navegação principal simplificada para apresentação com Indicadores, Chamados, Mapa e Configurações; Funcionários, Usuários, Departamentos, Auditoria/Planilhas e Personalização ficam agrupados dentro de Configurações.
- Admin: aba Mapa separada com filtros próprios, pins/heatmap e atalho para criar chamado.
- Admin: Personalização whitelabel com upload de logo PNG, prévia, persistência no backend, aplicação no login/funcionário/admin/e-mails, restauração do preset original e edição ampliada de cores de identidade, interface, texto, cards, bordas, hover e ações.
- Sessão: inatividade centralizada em 15 minutos, aviso específico no login administrativo e comparação de token por aba usando `sessionStorage` para impedir que uma nova sessão no mesmo navegador mantenha a aba antiga ativa.
- Admin: exportação de chamados em CSV e PDF com personalização de colunas e respeitando os filtros atuais de categoria, pessoa, status, período e local/busca; funcionários e auditoria também contam com relatório PDF.
- Admin: auditoria passa a exibir o responsável pela alteração, resolvendo ids para nome/e-mail quando possível e registrando automaticamente o ator das rotas administrativas.
- Admin: auditoria com filtros por texto, entidade, responsável e intervalo de datas; exportação CSV/PDF respeita os filtros aplicados e alterações de funcionário registram campos efetivamente modificados, como foto de perfil.

## Ambiente

Localmente, o frontend usa Vite e a API costuma rodar em:

```txt
http://localhost:3333
```

Em produção, o frontend chama a API do Render:

```txt
https://zeladoria-coopatos-api.onrender.com
```

O frontend deve usar `VITE_API_URL` quando estiver fora de `localhost`.

## Variáveis de Ambiente

No Render/API:

```txt
DATABASE_URL=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=
MAIL_PASS=
MAIL_FROM=
ADMIN_SUPPORT_EMAIL=
PUBLIC_APP_URL=https://www.zeladoriacoopatos.com.br
PUBLIC_API_URL=https://zeladoria-coopatos-api.onrender.com
```

Na Vercel/frontend:

```txt
VITE_API_URL=
VITE_CLOUDINARY_CLOUD_NAME=
VITE_CLOUDINARY_UPLOAD_PRESET=
```

Nunca commitar `.env` ou credenciais reais.

## Banco de Dados

O projeto usa Prisma com PostgreSQL no Neon. O contexto do projeto indica que houve migração do Neon em São Paulo para Virginia/us-east-1 para reduzir latência com o Render.

Pontos de atenção:

- Confirmar se `DATABASE_URL` local e do Render apontam para o banco correto.
- Manter banco antigo por alguns dias como backup quando houver migração.
- Rodar deploy limpo no Render após troca de variáveis importantes.

## Fluxos Importantes

### Login do Funcionário

O login usa:

```http
POST /employee-login
```

Body esperado:

```json
{
  "registrationNumber": "123",
  "cpf": "00000000000"
}
```

O backend normaliza CPF removendo caracteres não numéricos.

### Recuperação de Matrícula

O fluxo atual usa e-mail vinculado ao cadastro e CPF:

```http
POST /employee/recover-registration
```

Body esperado:

```json
{
  "email": "funcionario@email.com",
  "cpf": "00000000000"
}
```

Em produção, considerar resposta genérica para evitar enumeração de cadastros.

### Socket.IO

Eventos relevantes citados no projeto:

- `join-report`
- `leave-report`
- `new-message`
- `messages-read`
- `reports-updated`
- `report-created`
- `report-updated`
- `participant-added`
- `participant-removed`
- `notification-created`
- `private-message`
- `private-message-updated`
- `private-message-deleted`
- `private-messages-read`
- `report-message-notification`
- `force-logout`

## Alterações Recentes

- Chat privado: adicionada leitura real com `PrivateMessageRead`, rota de `mark-read`, check azul e atualização em tempo real por Socket.IO.
- Chat privado: corrigido listener com estado antigo da conversa, evitando falha em imagens, emojis e mensagens chegando sem atualizar a tela.
- Chat de chamados: adicionada notificação em tempo real por funcionário para manter o balão de mensagens não lidas atualizado.
- Conversas: mensagens do chamado agora também aceitam arrastar para responder, seguindo o comportamento do chat privado.
- UI responsiva: emoji picker reposicionado para não cortar no desktop/mobile e base da página ajustada para manter rolagem suave.

## Pendências e Roadmap

Antes de mexer nesses itens, verificar se já foram implementados no código atual.

### Alta prioridade

- Reduzir polling e depender mais de Socket.IO.
- Evitar duplicação de mensagens em envios repetidos.
- Melhorar menu de mensagem no mobile usando seta em vez de long press.
- Finalizar expansão fullscreen de imagens e vídeos no chat.
- Criar/validar galeria de mídias da conversa.
- Ajustar emoji picker no iPhone para não reabrir teclado.
- Garantir `text-base` em inputs/textareas para evitar zoom no iPhone.

### Média prioridade

- Melhorar segurança da recuperação de matrícula.
- Adicionar rate limit em endpoints sensíveis.
- Conferir logs e variáveis do Render.
- Revisar z-index de modais, toasts, header e tabs.
- Reduzir tamanho e complexidade de `EmployeePanel.tsx`.
- Avaliar virtualização de listas se houver muitos chamados/mensagens.

### Administrativo

Roadmap sugerido:

1. CRUD de funcionários: listar, buscar, criar/editar em modal, foto de perfil, nascimento, departamento presetado, desativar/restaurar e validação de e-mail já iniciado. Próximos passos: resetar acesso, validação visual de CPF/matrícula, auditoria e permissões por papel.
2. CRUD de admins e permissões.
3. Perfis: Master, Supervisor, Analista e Somente leitura.
4. Departamentos: responsáveis, cores, edição e exclusão.
5. Chamados avançados: criar, editar, excluir e atribuir funcionário já iniciado. Próximos passos: prazo, SLA, histórico de auditoria e permissões finas por papel.
6. Notificações avançadas: menções, resumo diário e histórico completo.

## Segurança

Durante o desenvolvimento foram mencionadas credenciais sensíveis em conversas. Recomendações:

- Rotacionar senha do banco se ela foi exposta.
- Revogar e recriar senha de app do Gmail se ela foi exposta.
- Conferir se `.env` está ignorado.
- Não publicar chaves do Cloudinary secret, banco, SMTP ou JWT.
- Separar variáveis do frontend e backend corretamente.

## Testes Manuais Recomendados

Depois de alterações importantes:

1. Rodar frontend e backend localmente.
2. Testar login de funcionário.
3. Criar chamado com mídia.
4. Editar chamado e remover mídia.
5. Abrir conversa em dois usuários diferentes.
6. Enviar mensagem de texto, imagem, vídeo e áudio.
7. Conferir recebimento em tempo real.
8. Validar check azul/leitura.
9. Testar envio repetido por Enter.
10. Testar recuperação de matrícula.
11. Conferir produção na Vercel e API no Render.
12. Verificar logs do Render para Prisma, SMTP, Cloudinary e Socket.IO.

## Notas Para Próximas Conversas Com Codex

- Use este README como ponto de partida, mas sempre leia o código antes de alterar.
- Não assumir que uma pendência ainda existe só porque está documentada.
- O arquivo `EmployeePanel.tsx` é grande e concentra muita lógica; mudanças nele devem ser pequenas e bem verificadas.
- Preferir manter o padrão atual do projeto antes de criar novas abstrações.
- Em mudanças de frontend, testar visualmente em desktop e mobile quando possível.
- Em mudanças de chat/tempo real, testar com dois usuários ou duas sessões.
