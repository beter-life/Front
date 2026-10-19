# MDL13 — Conciliação financeira

Rota protegida: `/finance/reconciliation`. TypeBox/OpenAPI do Back é a fonte
oficial; Zod é gerado pelo pipeline existente, sem DTO ou Finance Core paralelo.
V2.3 azul/verde, Auth V2, cache privado por usuário, scrollbars e temas preservados.

## Conferir não é lançar

Extrato original, proposta pendente, receipt de importação, lançamento financeiro,
sugestão e conciliação são conceitos distintos. Pendentes/descartados continuam
fora do saldo. Confirmar conciliação apenas vincula uma evidência a um lançamento
existente; desfazer só registra reversão. Nenhum dos comandos posta, cancela,
edita, compensa ou corrige o ledger, Budget, Net Worth ou Safe to Spend.

Receipts MDL12 representam linhas selecionadas, não o extrato inteiro. Os campos
atuais de uma proposta editada não reconstituem o original expirado. Ausência de
evidência preservada não comprova ausência no banco. Não são inventados saldos,
cobertura, movimentos faltantes ou divergências definitivas com dados insuficientes.

## Captura explícita e retenção mínima

Na prévia MDL12, selecione linhas válidas e marque o consentimento para
“Preservar selecionadas para conciliação”. A ação é separada de enviar à Inbox:
mantém conta/moeda/tipo/minor units/data/descrição normalizada e rastreabilidade,
não o arquivo/células originais. Os dados escolhidos permanecem no histórico
contábil de conferência, sem expiração automática; apagamento global de conta/dados
continua fora do módulo. O consentimento é explícito e nenhuma captura é automática.

A prévia temporária MDL12 mantém sua expiração24h e limpeza em acesso posterior.
Depois de expirar, somente o usuário pode reenviar o arquivo antes de capturar
dados ainda não preservados. Evidências já capturadas permanecem consultáveis.
Reenvio com identidade confiável reaproveita a evidência e mantém cada origem;
identidade repetida com campos diferentes retorna conflito, sem sobrescrever.
Sem identificador externo confiável, arquivo/conta/linha define a identidade;
semelhança de descrição/valor não comprova que dois arquivos representam a mesma linha.

## Visões e revisão

- Evidências: valores normalizados preservados e vínculo ativo, quando houver.
- Movimentos: ledger existente, incluindo cancelamentos e transferências; uma
  transferência não é reinterpretada como receita/despesa para poder conciliá-la.
- Propostas importadas: estado atual da Inbox e links para proposta/importação,
  inclusive quando os campos originais já não estão disponíveis.
- Histórico: conciliações e reversões preservadas; o filtro usa a data da
  conciliação, enquanto evidências/movimentos usam sua data de ocorrência.

Consultas têm período máximo366dias e páginas de25 registros com cursor estável.
A revisão retorna até50 sugestões/origens, com aviso explícito de truncamento.
Filtrar movimentos por estado pode produzir uma página vazia com próxima página;
não é uma afirmação de que toda a conta não possui registros.

Vínculo persistente receipt→Inbox→ledger pode comprovar origem compatível, mas
nunca concilia automaticamente. Sugestões e ambiguidades exigem revisão e escolha
explícita. Conta/moeda/operação/valor exato devem coincidir. Data/hora diferente
exige reconhecimento, com distância máxima31dias. Valores diferentes, movimento
cancelado, vínculo conflitante ou gerenciado não oferecem bypass.
Cartões, suas datas de início, dívidas e seus movimentos vinculados conservam seus
fluxos específicos. Categoria/descrição do ledger não são editadas para casar dados.

Confirmar exige seleção e confirmação de conferência. Duplo clique não emite duas
ações; retry após falha conserva a chave. Desfazer exige confirmação própria e
preserva IDs/histórico. Repetir uma reversão antiga não desfaz uma conciliação nova.
Mudanças posteriores no lançamento invalidam a conferência sem correção automática.

## Evidências automatizadas de entrega

Fonte testada: Frontc1137032c7f37fefa65cbce017eb976598609b37 e
Back6fa33bfb8477cb259f0df24f6e34229957347f12. Front278 unit/integration PASS;
Playwright completo214 PASS/4 skips condicionais preexistentes, sem retries novos,
timeouts ampliados ou remoção de verificações. Back302 unit+217 PostgreSQL17 PASS.
Lint, tipos, build, OpenAPI/drift, secret scan e harness PASS; sem nova dependência.
CI deve corresponder ao HEAD publicado, não ao merge anterior. O checkpoint final
altera somente documentação; o gate humano continua PENDING.

Diagnóstico preservado localmente em logs ignorados: a primeira rodada concorrente
teve dois timeouts de bootstrap/login, aprovados depois isoladamente sem mudança
em Auth. A rodada com tracing revelou um seletor antigo ambíguo (“Principal” na
sidebar e na conta), corrigido somente pelo escopo `#main`, e timeout no inventário
visual com tracing. A suíte completa normal com fonte congelada passou. Todos os
cenários financeiros e seus limites/assertions originais foram preservados.

## Gate humano — somente após autorização e implantação DEV0014

Não executar automaticamente. O usuário deve escolher explicitamente uma conta
Auth e conta financeira **de teste**. Não usar contas ou extratos financeiros reais
como fixtures. Até autorizar/aplicar0014, a readiness não comprova disponibilidade
da tabela nova; uma falha de API não deve ser mascarada com dados simulados no app.

1. **Correspondência correta:** escolher lançamento de teste existente; importar
   arquivo sintético compatível pelo MDL12 e capturar explicitamente uma linha.
   Conferir origem, moeda, minor units, data/fuso; ainda não existe conciliação.
2. **Divergências:** conferir sugestões com valor/data distintos e possível
   ambiguidade. Valor incompatível/cancelado deve ficar bloqueado; data diferente
   exige reconhecimento. Não fabricar movimento ou extrato para “corrigir” a tela.
3. **Manual:** escolher o lançamento e confirmar somente a conferência; observar
   um vínculo e nenhum novo lançamento financeiro.
4. **Reversão:** confirmar “desfazer somente esta conferência”; verificar histórico
   e lançamento original preservados. Uma nova conferência tem identidade própria.
5. **Idempotência:** conferir um duplo clique/retry controlado, sem disparar várias
   ações ou e-mails. Deve existir apenas um vínculo ativo para cada evidência/movimento.
6. **Persistência:** reload mantém evidências, origens e histórico, inclusive após
   a prévia expirar; receipt antigo sem snapshot não vira evidência original inventada.
7. **Isolamento:** se houver outro usuário explicitamente escolhido para teste,
   verificar que referências alheias não são acessíveis. RLS/ownership têm cobertura
   PostgreSQL independente; não declarar o cenário humano PASS sem executá-lo.
8. **Interface:** Light/Dark/System, mobile/tablet, teclado, estados vazios,
   loading/error/retry, links Inbox/Importações e scrollbars sem regressão.
9. **Zero efeito financeiro:** comparar saldos, Budget, Net Worth e Safe to Spend
   antes/depois da conferência e reversão. Metas, cartões, dívidas, recorrências e
   rendimentos permanecem inalterados. Corrigir ledger somente pelo fluxo oficial,
   por confirmação independente, fora desta ação.

`REAL_GATE=PENDING`, `READY_FOR_MDL14=false`. Nenhum PR final/merge/COMPLETE.
Limites anteriores mantidos: restauração isolada do backup NOT_RUN; proteção de
senhas vazadas DISABLED_PREEXISTING; não alterar Auth. Chromium/mobile emulado
não constitui certificação de todos os browsers, dispositivos ou leitores de tela.

Decisão de banco e limites reproduzíveis:
[Backend architecture](https://github.com/beter-life/Back/blob/codex/mdl13-financial-reconciliation/docs/FINANCIAL_RECONCILIATION.md);
o contrato publicado permanece o OpenAPI oficial do Back.
