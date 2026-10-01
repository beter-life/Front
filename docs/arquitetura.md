# Finance frontend — MDL 2

`src/features/finance/` é isolado do Auth V2: API, contratos gerados, money,
datas, hooks, formulários e páginas. Auth/provider/guards existentes continuam
responsáveis pela sessão. Finance usa o transporte Bearer existente; nunca
acessa tabelas Supabase diretamente nem adiciona service-role/secret key.

Rotas protegidas: `/finance`, `/finance/accounts`, `/finance/categories`,
`/finance/transactions`. Navegação principal passa a incluir Finanças;
`/app` e os fluxos Identity validados permanecem intactos.

QueryClient usa chaves privadas por owner. Logout/mudança de identidade limpa
o cache; mutation tardia de sessão anterior não repopula dados. AbortSignal é
propagado às queries. Mutations não têm retry automático e o formulário bloqueia
submissão dupla/Enter+click. Transferências preservam a chave idempotente em
retry da mesma submissão, sem chamar duas operações independentes.

`contracts.generated.ts` vem do gerador TypeBox do Back, não de um contrato
financeiro duplicado manualmente. O arquivo é versionado, autocontido e traz
SHA-256 da fonte; clonar Front não exige checkout Back em runtime/build.
Regenerar a partir do artefato publicado do Back, mantendo o cabeçalho.
Mais detalhes de Auth em [ARCHITECTURE](ARCHITECTURE.md).
