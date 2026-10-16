# MDL12 — Importação de extratos

Estado: REAL_GATE_PASS_PENDING_MERGE. REAL_GATE=PASS; MDL12_HUMAN_GATE=PASS;
MDL12_HUMAN_TESTS=9/9; MIGRATION_0013_DEV=PASS; DRIZZLE_MIGRATIONS=13/13;
READY_FOR_MDL13=false. Gate humano informado pelo usuário em2026-10-16. Não há
merge, checkpoint COMPLETE ou início do MDL13. A migration0013 foi autorizada e
aplicada exclusivamente ao Supabase `beter-life-dev` em2026-10-16: Drizzle13/13,
zero pendentes, schema esperado, RLS/ownership e preservação dos dados aprovados.
O backup lógico de app+Drizzle foi criptografado e sua integridade verificada;
**não houve teste de restauração**. Os testes financeiros automatizados continuam
em PostgreSQL17 descartável e com fixtures sintéticas, sem contas ou extratos reais.

## Fluxo e limites

`/finance/inbox/import` usa o Design System V2.3 e os contratos Zod gerados pelo
Back. O usuário escolhe arquivo, conta, formatos e colunas; revisa uma tabela
paginada de50 linhas; seleciona explicitamente as linhas válidas; envia propostas
PENDING à Inbox. A confirmação financeira acontece separadamente no MDL11.

**Importar não altera seu saldo. Os lançamentos deverão ser confirmados na Caixa
de Entrada.**

Não há análise, categorização, OCR ou serviço de IA externo. Arquivos originais
não são persistidos. Células da prévia ficam disponíveis por24h; são eliminadas
quando o proprietário acessa a importação/histórico ou envia um novo arquivo após
o prazo. As referências mínimas às propostas permanecem; um reenvio do mesmo
arquivo recupera a prévia sem gerar novamente as propostas já vinculadas.

Limites:2MiB,1000 linhas,32 colunas,8192 caracteres por registro,10 páginas PDF,
1milhão de caracteres extraídos,5s por análise e2 análises simultâneas por processo.
Há limite por usuário de200 lotes,10 prévias ativas e20MiB de prévias. Excesso
simultâneo retorna429 temporário. O limite de128MiB do worker cobre o heap V8,
não todo o RSS do sistema operacional.

CSV: cabeçalho, vírgula/ponto e vírgula, aspas/quebras de linha; UTF-8/BOM ou
Windows-1252 explícito. Datas ISO/DMY/MDY e números BR/INT exigem confirmação.
Modo SIGNED: positivo é receita, negativo é despesa. TYPE_COLUMN permite despesas
sem sinal quando a coluna de tipo é inequívoca. Moeda divergente, zero, escala
inválida, totais/saldos e operações desconhecidas ficam bloqueados por linha.
Um identificador externo mapeado deve ser único por movimento da conta.

OFX: um extrato bancário SGML1.x ou XML2, com FITID, moeda e valores assinados.
Cartões, investimentos, transferências e correções/delete não viram novos gastos.
PDF: somente texto digital no layout simples `EXTRATO`, `MOEDA: BRL`, cabeçalho
`DATA DESCRICAO VALOR` e linhas como `16/10/2026 Mercado -12,34`. Outros layouts,
documentos sem texto e arquivos protegidos por senha têm mensagens específicas.
Não se promete compatibilidade universal com bancos.

Valores usam minor units exatos e os expoentes de moeda do Finance Core, sem FX.
Datas sem hora usam meio-dia no fuso do perfil. Cartões/dívidas gerenciadas são
identificados pelos vínculos reais; o mapeamento bloqueia até carregar esses
vínculos. A validação definitiva de ownership e elegibilidade permanece no Back.

## Gate humano — 9/9 PASS informado pelo usuário

CSV_IMPORT, OFX_IMPORT, PDF_IMPORT, NORMALIZATION, PREVIEW, DUPLICATE_DETECTION,
INBOX_INTEGRATION, FINANCIAL_ISOLATION e OWNERSHIP: PASS informado pelo usuário.
O roteiro abaixo preserva os nove cenários aprovados, sem nova execução automática
no DEV. A aprovação9/9 não é uma observação separada de24h de relógio real.

Pré-flight e pós-migration técnicos aprovados. Back em localhost:3001 e Front em
[Importar extrato](http://localhost:3101/finance/inbox/import). Health live/ready200;
proteção de login conferida em desktop/mobile sem usar uma sessão real. Se a sessão
estiver expirada, faça login e abra o endereço novamente. O agente não fará os
testes financeiros a seguir automaticamente. Escolha explicitamente usuário e
conta de teste; use apenas os exemplos sintéticos desta pasta, nunca extratos
pessoais sem uma nova escolha explícita.

1. **CSV: prévia, mapeamento e linhas bloqueadas.** Antes de importar, registre
   saldo, movimentos, orçamento, patrimônio e Quanto posso gastar da conta de
   teste. Envie [synthetic.csv](./examples/imports/synthetic.csv), UTF-8/ponto e vírgula.
   Escolha conta BRL, DMY, BR e SIGNED. Mapeie data0, descrição1, valor2, tipo3,
   moeda4, identificador5 (a UI apresenta os números de coluna começando em1).
   Confira despesa12,34 e receita150,00. Saldo final deve ficar bloqueado.
2. **Seleção cria somente propostas pendentes.** Selecione apenas a despesa e envie.
   Deve existir uma única proposta PENDING,
   fonte Arquivo CSV; saldo e todos os indicadores anteriores permanecem iguais.
   Recarregue a importação e abra a proposta pelo link. Recarregue a Inbox também.
3. **Confirmação manual e impacto único.** Confirme essa proposta pelo fluxo MDL11.
   Deve surgir exatamente uma despesa de
   R$12,34 no Core e um único impacto nos indicadores existentes. Retry/reload não
   pode duplicar. Não confirme as demais propostas se não quiser criar movimentos.
4. **Reimportação e duplicidades.** Reenvie o mesmo CSV: deve recuperar o mesmo lote e referências.
   Envie [synthetic-repeat.csv](./examples/imports/synthetic-repeat.csv) para a mesma
   conta: o primeiro ID é comprovado/reutilizável; o outro valor semelhante exige
   revisão de possível duplicidade, sem descarte automático. Mapeamento fica
   bloqueado após o primeiro envio de propostas.
5. **OFX bancário XML e SGML.** Envie [synthetic.ofx](./examples/imports/synthetic.ofx)
   (XML) e [synthetic-sgml.ofx](./examples/imports/synthetic-sgml.ofx) (SGML). Escolha conta BRL; os
   formatos nativos são fixos. Confira compra23,45, FITID e data/offset. A transferência
   deve ficar bloqueada. Cada arquivo usa um FITID sintético próprio; revise eventual
   aviso de valores semelhantes. Envie somente a compra e confira fonte Arquivo OFX/PENDING.
6. **PDF digital documentado.** Envie [synthetic-statement.pdf](./examples/imports/synthetic-statement.pdf), escolha
   conta BRL e confira12,34/150,00, sem linhas de saldo/total. Um PDF sem texto ou fora
   do layout precisa de recusa explícita, sem inventar transações. A proposta PDF
   continua pendente até a confirmação normal da Inbox.
7. **Arquivos não suportados.** Tente [unsupported.txt](./examples/imports/unsupported.txt)
   como CSV/OFX/PDF, além de arquivo maior que2MiB. A seleção/análise deve recusar
   explicitamente; não devem surgir propostas nem movimentos financeiros.
8. **Tema, mobile, teclado, scrollbars e persistência.** Teste Light/Dark/System,
   320/375/390/768/1024/1440px, teclado/Tab, labels, tabela,
   conteúdo original expansível, scrollbars aprovadas e ausência de overflow global.
   Confira carregamento, erro/retry, sessão expirada e recarga por URL.
9. **Ownership e proteção de contas vinculadas.** Em uma segunda sessão/usuário de teste,
   tente a URL do lote e da proposta do primeiro:
   deve haver indisponibilidade/404. Conta de cartão/dívida não pode oferecer um
   caminho alternativo de lançamento comum. Após24h, a prévia expira e os links às
   propostas já criadas permanecem; reenvio recupera sem duplicação.

Registrar resultados: CSV, OFX, PDF, NORMALIZATION, PREVIEW, DUPLICATES, INBOX,
NO_BALANCE_BEFORE_CONFIRM, SINGLE_CONFIRMATION, RELOAD, OWNERSHIP, THEMES_MOBILE.
O usuário aprovou os nove cenários. Esta entrega publica o fechamento documental e
prepara PRs; o merge depende de nova autorização explícita. MDL13 permanece false.

O backup e o procedimento de recuperação ficam no Back, em
`.harness/tmp/mdl12-dev-deployment/backup-verified/`. O arquivo inclui app e o ledger
Drizzle, sem os schemas gerenciados Auth/Storage; não é um backup completo do
projeto Supabase. A chave exige o mesmo perfil/máquina Windows. Preserve essa
pasta; leitura/descriptografia verificada não equivale a um teste de restauração.

## Evidências automatizadas

Testes Back cobrem parsing/precisão/limites, PostgreSQL17 com0013, RLS/ownership,
concorrência, idempotência, rollback forçado, isolamento financeiro e confirmação
MDL11 compartilhada. Os testes Front usam fixtures sintéticas e fronteira HTTP
controlada; os de navegador não substituem um gate com Backend real.
Os arquivos do gate e os PDFs de teste não contêm dados bancários reais.

Metas declaradas antes do volume:1000 linhas<5s, prévia50 linhas<2,5s e seleção100
propostas<5s no PostgreSQL local. Isso não certifica carga no Supabase hospedado.
Os resultados finais, commits e links das CIs serão reportados na entrega.

Validação anterior à implantação2026-10-16: lint/typecheck/build/secret scan/harness PASS;261 testes
unitários+integração PASS;206 testes de navegador PASS e4 skips previamente
previstos, sem retries ou aumento de timeouts. Todos os testes MDL0–MDL11 foram
mantidos. Uma primeira rodada concorrente excedeu o carregamento do calendário
existente; a suíte completa passou com maxWorkers1, sem modificar calendário ou
suas asserções. Os12 casos novos de navegador também passaram isoladamente.
JS principal gzip273,90KiB; aviso de chunk>500KiB já existente permanece.
O CI deve ser conferido no HEAD publicado antes da entrega; o relatório final
contém os links e os hashes efetivamente verificados.


## Evidência de expiração e limites reais

O teste PostgreSQL do Back
[expires raw preview after 24h while keeping receipts, replay and recovery without duplication](https://github.com/beter-life/Back/blob/d8f4abf18d3fe71064100687037d6eb2d8ec7ddb/tests/integration/import.test.ts#L88)
avança o relógio injetado em86400001ms e verifica EXPIRED, parsed=NULL,
parsed_bytes=0, referências preservadas e recuperação/reimportação sem duplicar.
Esse código permanece inalterado nos commits de fechamento. No Front,
[restores a batch by URL and explains expiry without enabling selection](../tests/integration/import.test.tsx#L38)
e [expiry keeps proposal references...](../tests/e2e/import.spec.ts#L23) usam respostas
HTTP controladas para verificar a tela expirada, bloquear seleção e manter links.
Essas fixtures não comprovam a passagem real de24h.

A expiração lógica ocorre após24h; a remoção física das células ocorre no próximo
acesso do proprietário ou nova análise. Não há agendador de limpeza em background.
Não foi registrada uma espera separada de24h no DEV, nem remoção exatamente no prazo
sem acesso posterior. Essa observação operacional está pendente; não foi inventado
PASS manual para ela nem executado novo teste financeiro hospedado nesta entrega.

- PDF é restrito ao layout digital documentado. Não há OCR ou suporte universal a
  extratos bancários, imagens, documentos criptografados ou layouts arbitrários.
- CSV e OFX são limitados aos formatos/encodings/operações documentados. A importação
  não faz reconciliação bancária completa, conferência integral de saldos/totais ou
  interpretação de toda classe de operação bancária.
- Backup restaurável ainda não comprovado por restauração em banco isolado.
  Descriptografia e integridade aprovadas não substituem esse teste.
- A [proteção contra senhas vazadas](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
  estava desativada no advisor da implantação. É uma pendência preexistente;
  configurações Auth permanecem intactas.
- Os testes de navegador usam Chromium e emulação desktop/mobile em larguras
  selecionadas, temas e teclado. Não certificam todos os aparelhos reais,
  Safari/Firefox, leitores de tela ou conformidade WCAG completa.
- A limpeza exata no prazo sem acesso posterior e a carga hospedada não foram
  certificadas. O limite de heap do worker não é isolamento de RSS do sistema.

Os SHAs iniciais da implantação não são considerados HEADs finais. Após os commits
de fechamento, os PRs e o relatório de entrega registram os hashes e links dos
CIs de branch e de PR efetivamente aprovados. Não criar checkpoint COMPLETE antes
dos merges e da CI final de main; não realizar merge sem autorização explícita.

Na regressão local de fechamento, uma primeira rodada de integração passou116/117:
o calendário existente permaneceu em carregamento além da espera de10s. O teste
inalterado passou isoladamente4/4 em3,2s e a repetição integral passou117/117.
O diagnóstico e a falha inicial foram preservados; nenhum código, asserção, timeout
ou configuração de retry foi alterado. Isso registra uma ocorrência de timing
local, sem afirmar uma causa definitiva ou esconder a execução que falhou.

O Playwright completo local do fechamento terminou com205 aprovados,1 falha e4
skips existentes. O caso de alinhamento desktop em blue-green.spec.ts perdeu o
contexto durante navegação em locator.evaluateAll; o mesmo caso inalterado passou
isoladamente com trace. Log, screenshot e contexto originais foram preservados.
Essa rodada completa local **não é PASS**. Antes de abrir os PRs e entregar, exige-se
SUCCESS da suíte completa no CI do novo HEAD e depois nos checks específicos do PR,
sem remover o caso nem ampliar timeouts/retries. A causa exata não foi comprovada.
