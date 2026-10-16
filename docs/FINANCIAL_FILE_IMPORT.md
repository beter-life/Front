# MDL12 — Importação de extratos

Estado: AWAITING_REAL_GATE; gates locais aprovados e gate humano pendente. Não há
merge, checkpoint COMPLETE ou início do MDL13. A migration0013 ainda **não foi
autorizada nem aplicada ao Supabase DEV**. Os testes de banco usam PostgreSQL17
descartável, sem extratos ou contas reais.

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

## Gate humano — executar somente no ambiente autorizado

Pré-requisito DEV: autorização separada para0013, revisão SQL, backup e verificação
de TLS/RLS conforme o procedimento do Back. Não executar db:migrate contra DEV
como parte deste roteiro sem essa liberação. O agente não fará lançamentos reais.
Use usuário/conta de teste e apenas os exemplos sintéticos desta pasta.

1. Registre saldo, movimentos, orçamento, patrimônio e Quanto posso gastar da conta
   de teste. Abra Caixa de Entrada → Importar extrato e confira o aviso de saldo.
2. Envie [synthetic.csv](./examples/imports/synthetic.csv), UTF-8/ponto e vírgula.
   Escolha conta BRL, DMY, BR e SIGNED. Mapeie data0, descrição1, valor2, tipo3,
   moeda4, identificador5 (a UI apresenta os números de coluna começando em1).
   Confira despesa12,34 e receita150,00. Saldo final deve ficar bloqueado.
3. Selecione apenas a despesa e envie. Deve existir uma única proposta PENDING,
   fonte Arquivo CSV; saldo e todos os indicadores anteriores permanecem iguais.
   Recarregue a importação e abra a proposta pelo link. Recarregue a Inbox também.
4. Confirme essa proposta pelo fluxo MDL11. Deve surgir exatamente uma despesa de
   R$12,34 no Core e um único impacto nos indicadores existentes. Retry/reload não
   pode duplicar. Não confirme as demais propostas se não quiser criar movimentos.
5. Reenvie o mesmo CSV. Deve recuperar o mesmo lote e as mesmas referências.
   Envie [synthetic-repeat.csv](./examples/imports/synthetic-repeat.csv) para a mesma
   conta: o primeiro ID é comprovado/reutilizável; o outro valor semelhante exige
   revisão de possível duplicidade, sem descarte automático. Mapeamento fica
   bloqueado após o primeiro envio de propostas.
6. Envie [synthetic.ofx](./examples/imports/synthetic.ofx). Escolha conta BRL; os
   formatos nativos são fixos. Confira compra23,45, FITID e data/offset. A transferência
   deve ficar bloqueada. Envie somente a compra e confira fonte Arquivo OFX/PENDING.
7. Envie [synthetic-statement.pdf](./examples/imports/synthetic-statement.pdf), escolha
   conta BRL e confira12,34/150,00, sem linhas de saldo/total. Um PDF sem texto ou fora
   do layout precisa de recusa explícita, sem inventar transações. A proposta PDF
   continua pendente até a confirmação normal da Inbox.
8. Teste Light/Dark/System,320/375/390/768/1024/1440px, teclado/Tab, labels, tabela,
   conteúdo original expansível, scrollbars aprovadas e ausência de overflow global.
   Confira carregamento, erro/retry, arquivo>2MiB, sessão expirada e recarga por URL.
9. Em uma segunda sessão/usuário, tente a URL do lote e da proposta do primeiro:
   deve haver indisponibilidade/404. Conta de cartão/dívida não pode oferecer um
   caminho alternativo de lançamento comum. Após24h, a prévia expira e os links às
   propostas já criadas permanecem; reenvio recupera sem duplicação.

Registrar resultados: CSV, OFX, PDF, NORMALIZATION, PREVIEW, DUPLICATES, INBOX,
NO_BALANCE_BEFORE_CONFIRM, SINGLE_CONFIRMATION, RELOAD, OWNERSHIP, THEMES_MOBILE.
Só após aprovação humana será possível propor fechamento do MDL12; MDL13 permanece
false e não há autorização de merge nesta entrega.

## Evidências automatizadas

Testes Back cobrem parsing/precisão/limites, PostgreSQL17 com0013, RLS/ownership,
concorrência, idempotência, rollback forçado, isolamento financeiro e confirmação
MDL11 compartilhada. Os testes Front usam fixtures sintéticas e fronteira HTTP
controlada; os de navegador não substituem um gate com Backend real.
Os arquivos do gate e os PDFs de teste não contêm dados bancários reais.

Metas declaradas antes do volume:1000 linhas<5s, prévia50 linhas<2,5s e seleção100
propostas<5s no PostgreSQL local. Isso não certifica carga no Supabase hospedado.
Os resultados finais, commits e links das CIs serão reportados na entrega.

Validação local2026-10-16: lint/typecheck/build/secret scan/harness PASS;261 testes
unitários+integração PASS;206 testes de navegador PASS e4 skips previamente
previstos, sem retries ou aumento de timeouts. Todos os testes MDL0–MDL11 foram
mantidos. Uma primeira rodada concorrente excedeu o carregamento do calendário
existente; a suíte completa passou com maxWorkers1, sem modificar calendário ou
suas asserções. Os12 casos novos de navegador também passaram isoladamente.
JS principal gzip273,90KiB; aviso de chunk>500KiB já existente permanece.
O CI deve ser conferido no HEAD publicado antes da entrega; o relatório final
contém os links e os hashes efetivamente verificados.
