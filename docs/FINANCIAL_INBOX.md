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

## Roteiro do gate humano (após migration DEV autorizada)

1. Anotar saldo, Budget, Net Worth e Quanto posso gastar da conta de teste.
2. Criar proposta manual incompleta; confirmar que os valores não mudaram.
3. Revisar, informar conta/valor/data/categoria e salvar; valores seguem iguais.
4. Confirmar uma vez; verificar uma única receita/despesa, seu saldo e os read
   models. Reload e consulta do histórico mantêm a mesma referência.
5. Criar proposta semelhante; revisar o aviso e reconhecer apenas se legítima.
6. Criar e descartar outra proposta; verificar histórico e ausência de movimento.
7. Conferir filtros, tema, mobile/teclado e sessão após reload. Não é preciso
   criar dados de outro usuário real: ownership/RLS têm teste PostgreSQL próprio.

Migration `0012_financial_inbox` permanece local até autorização para Supabase
DEV. Não declarar gate humano aprovado, COMPLETE ou prontidão de MDL12 antes dele.
