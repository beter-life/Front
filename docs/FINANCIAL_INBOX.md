# MDL11 — Caixa de entrada financeira

Rota protegida: `/finance/inbox`; navegação Principal → Caixa de entrada.
Fonte disponível nesta etapa: proposta manual de receita ou despesa.
Pendente e descartado não são movimentos financeiros e não alteram saldos,
orçamento, patrimônio nem Quanto posso gastar. Confirmar cria exatamente um
lançamento no Finance Core; retry retorna a referência do lançamento original.

## Fluxo e contrato

- Nova proposta: descrição, tipo, moeda, valor/data opcionais, conta e categoria.
  Mudança de moeda limpa valor/conta; mudança de tipo limpa a categoria.
- Revisão: dados atuais, campos faltantes, possíveis duplicidades e bloqueios do
  servidor. Edição utiliza a versão revisada; conflito pede atualização.
- Confirmar: exige conta ativa compatível, valor e data válidos. Categoria pode
  ficar sem classificação, como já permite o Finance Core. Duplicidades exigem
  reconhecimento explícito. Compras de cartão/dívida gerenciada usam seus fluxos.
- Descartar: confirmação explícita, estado terminal e histórico preservado.
- Filtros: estado, tipo e moeda; paginação por cursor do servidor. Histórico
  confirmado/descartado pode ser consultado e resiste ao reload.

O Backend é o único responsável por validação financeira, ownership, detecção de
duplicidades e posting. `contracts.generated.ts` é gerado por
`Back/scripts/finance-contract.ts`; não existem DTOs paralelos no Front.
Os avisos de duplicidade são heurísticos (mesma conta/tipo/moeda/valor, ±24h),
com até dez ocorrências de cada fonte e indicação de truncamento. Não há dedução
automática, importação, sincronização, Gmail, Outlook, IA ou voz.

## Apresentação e segurança

Usa os componentes e tokens UI/UX V2.3 azul/verde, Light/Dark/System, feedback
reservado, formulário estável, teclado, labels e estados loading/empty/error/retry.
Valores usam minor units exatos (0/2/3 decimais), datas usam o fuso do perfil.
As mutations invalidam os dados privados financeiros para refletir o lançamento
confirmado. Propostas incompletas mantêm campos vazios na edição.
Nenhum token, fingerprint, descrição financeira ou dado de proposta é logado.
Testes de browser usam somente sessões/contas sintéticas. A validação automatizada
de acessibilidade não representa certificação completa ou teste de leitor de tela.

## Roteiro do gate humano

Pré-condição: migration DEV autorizada e aplicada; usuário deve escolher
explicitamente uma conta Auth de teste e as contas financeiras de teste antes
de qualquer escrita. Não usar dados financeiros reais como fixtures. Entrar em
`http://localhost:3101/finance/inbox`; confirmar leitura autenticada sem erro.

1. Anotar saldo, Budget, Net Worth e Quanto posso gastar da conta de teste.
2. Criar proposta manual incompleta; confirmar que os valores não mudaram.
3. Revisar, informar conta/valor/data/categoria e salvar; valores seguem iguais.
4. Confirmar uma vez; verificar uma única receita/despesa, seu saldo e os read
   models. Reload e consulta do histórico mantêm a mesma referência.
5. Criar proposta semelhante; revisar o aviso e reconhecer apenas se legítima.
6. Criar e descartar outra proposta; verificar histórico e ausência de movimento.
7. Conferir filtros, tema, mobile/teclado e sessão após reload. Não é preciso
   criar dados de outro usuário real: ownership/RLS têm teste PostgreSQL próprio.

Migration `0012_financial_inbox` aplicada uma única vez no `beter-life-dev` em
2026-10-15 pelo Drizzle oficial após pré-flight, backup lógico criptografado e
snapshot. Ledger12/12, sem pendências; tabela vazia, RLS/permissões restritas e
preservação das24 tabelas anteriores validados naquele momento. Nenhum gate
financeiro foi executado automaticamente. O usuário depois aprovou os sete
fluxos humanos: `MDL11_HUMAN_GATE=PASS`, `MDL11_HUMAN_TESTS=7/7`.

## Identificação de contas de cartão e validação final

Contas identifica o vínculo por `card.accountId === account.id`, consumindo
`useCards` e contratos gerados oficiais, inclusive cartões arquivados. Nome,
tipo, saldo, moeda, status e operações da conta não são alterados. O marcador
Cartão vinculado mostra o nome e abre `/finance/cards/:cardId`. Falha de consulta
não é interpretada como ausência de vínculo; há informação indisponível/retry.

Novas propostas Inbox exibem cartões vinculados como opções desabilitadas,
identificadas e com orientação para Cartões. Uma conta `credit` sem vínculo não
é classificada como cartão, mesmo se os nomes forem iguais. Propostas antigas
mantêm a conta original, inclusive ao salvar metadata; apenas uma escolha
explícita altera a associação durante a edição. Falha do lookup bloqueia o
formulário de nova proposta e o salvamento, sem limpar a seleção anterior.

`canConfirm`, avisos e elegibilidade de data continuam pertencendo ao Backend:
um vínculo não bloqueia por si só a confirmação de um registro histórico que
o servidor considere válido. MANAGED_ACCOUNT direciona ao cartão/dívida pelo
vínculo real; vínculo desconhecido não é apresentado como cartão ou dívida.
Compra é despesa em Cartões; pagamento é transferência pelo fluxo oficial.
Nenhuma transação é movida/criada para corrigir a interface.

Os indicadores de rolagem da página/sidebar seguem no mesmo envio: sobrepostos
ao conteúdo, sem trilho/gutter, contraste Light/Dark maior, aproximação animada,
arraste/teclado, fallback nativo para touch/alto contraste e respeito à
preferência por movimento reduzido.

Validação humana complementar, sem execução automática ou novas escritas DEV:

1. Em Contas, conferir marcador/nome/link de um cartão e seu status arquivado,
   preservando saldo e nome originais; conta comum continua sem o marcador.
2. Em Inbox, conferir opções desabilitadas e orientação para Cartões; revisar
   proposta antiga e a possibilidade de escolher outra conta, sem descarte automático.
3. Conferir Light/Dark, mobile e os indicadores sobrepostos da página/sidebar.

A promoção final ainda requer validação da correção de UX e liberação explícita
do usuário. Não criar checkpoint COMPLETE, PR final, merge ou MDL12 nesta etapa.
