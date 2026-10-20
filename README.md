# ERPFront · 0.1.0

Painel responsivo para vendas internas, pensado para comércio e alimentação: frente de caixa, produtos por unidade/peso, recebimentos divididos, histórico, indicadores, equipe, auditoria e personalização de identidade visual.

Nova base independente, com ERPBack. Não modifica o Bonamassa e não inclui aplicativo de cliente, delivery, produção, estoque, emissão fiscal, TEF/gateway ou confirmação automática de pagamento. Mesas é um canal de venda, não gestão de comandas. A primeira versão é um módulo comercial de vendas, não um ERP completo.

## Tecnologias e segurança

Next.js 16, React 19, TypeScript e Node 24. O navegador fala com um backend intermediário no mesmo domínio (BFF); os tokens Bearer da API são guardados em cookies AES-GCM/HttpOnly/SameSite=Strict, nunca em localStorage. Cookies vinculados à API/empresa e sessão de 12 horas. Rotas intermediárias têm lista de permissões e validação de origem nas mutações. Credenciais de banco e e-mail ficam somente no ERPBack. O painel nunca recebe DATABASE_URL.

A implantação inicial é por cliente: um front, um back, banco novo e código comum. Nome, cores e logo são salvos no gerente, sem alterar arquivos por cliente. COMPANY_SLUG identifica a instalação. O gerente habilita somente os módulos liberados em LICENSE_MODULES pelo operador da API; o servidor verifica as permissões. Funcionalidades ainda não implementadas não são oferecidas como módulos selecionáveis.

## Local

```
npm ci
# Copie .env.example para .env.local e configure as variáveis.
npm run dev
```

Prepare ERPBack primeiro. O gerente inicial é criado pelo seed da API e usa SEED_MANAGER_EMAIL/SEED_MANAGER_PASSWORD. No painel não há hash de senha configurado por ambiente, diferente do antigo BonamassaAdmin. Usuários posteriores entram por convite, e podem recuperar a senha por e-mail.

## Render

Crie Web Service Node, branch main. A URL onrender.com é fornecida pelo serviço.

| Campo          | Valor                                           |
| -------------- | ----------------------------------------------- |
| Build Command  | npm ci && npm run build                         |
| Start Command  | npm start                                       |
| NODE_VERSION   | 24                                              |
| NODE_ENV       | production                                      |
| API_URL        | URL exata do ERPBack, sem barra final e sem /v1 |
| APP_ORIGIN     | URL exata deste ERPFront, sem barra final       |
| COMPANY_SLUG   | Mesmo SEED_COMPANY_SLUG do ERPBack              |
| SESSION_SECRET | Chave aleatória de pelo menos 32 caracteres     |

Gere a chave no computador: node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))". As variáveis são definidas em Environment no Render; não é necessário arquivo .env no servidor e não devem usar prefixo NEXT_PUBLIC. Configure CORS_ORIGINS e PANEL_URL no ERPBack com a URL deste painel. render.yaml traz opção Blueprint/free para testes.

## Operação

- Cadastre os produtos em Produtos, informando preço em reais, SKU, categoria e UN/KG.
- No caixa, escolha a frente, adicione produtos e quantidades. Para 250 g de produto KG, informe 0,250; para UN, números inteiros. Desconto absoluto em reais somente para gerente.
- Receber e finalizar permite dividir em até oito meios. Confirme o pagamento no banco ou maquininha antes de registrar. Não há integração de cobrança ou estorno nesta versão.
- Se a resposta da confirmação não chegar, a tela mantém a operação bloqueada e oferece reenviar a mesma chave, evitando duplicação. A proteção vale enquanto a tela estiver aberta. Não recarregue durante confirmação incerta: confira o histórico antes de tentar nova venda.
- Vendas e auditoria carregam 50 linhas/página, com botão Carregar mais e período máximo de 93 dias. Horários são apresentados no fuso do navegador e enviados à API em UTC.
- Cancelar requer gerente e justificativa. Não altera/exclui itens históricos e não devolve valores automaticamente. Indicadores ignoram vendas canceladas.
- Os totais são faturamento gerencial após descontos; não são lucro, apuração tributária ou demonstração contábil. Ranking de produtos mostra valor dos itens antes do desconto global, separando UN e KG.
- Identidade visual e frentes de atendimento ficam em Configurações. Cores aplicadas após salvar; logo aceita PNG/JPEG/WebP de até 500 KB. Upload/remover logo salva imediatamente e recarrega configurações; salve outros campos antes do upload.
- Contas compartilhadas ficam identificadas na auditoria, sem identificar a pessoa física. Gerente pode consultar dados da própria instalação; caixa consulta catálogo/vendas e registra recebimentos, sem gestão e descontos.
- Equipe usa convites enviados pela API/Resend. Sem envio configurado, o sistema explica o bloqueio. Convite vence em 24h, recuperação em 30min.
- Sem modo offline, impressão, exportação, leitura de balança, leitor integrado, fechamento de caixa, contas a receber ou emissão de documento fiscal nesta primeira versão. Carrinho fica na memória da tela e não deve ser tratado como venda salva.

## Validação

npm test valida cookies, expiração, vínculo à empresa e permissões do proxy. npm run build valida TypeScript e build de produção. npm run test:e2e usa ERPBack real com PostgreSQL descartável: cadastro de produtos, venda por peso/unidade, recebimento, histórico, indicadores, personalização, bloqueio de módulo pela API, navegação mobile e logout. GitHub Actions fixa a revisão da API e publica capturas desktop/mobile. Nunca configurar o teste com banco real.

Back: https://github.com/nvpetri/ERPBack
