import { useState } from 'react';
import { Link, Outlet } from 'react-router';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Plus, Wallet } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { ConfirmAction } from '../../components/ui/confirm-action';
import { Feedback } from '../../components/feedback';
import { PageHeader, SectionHeader } from '../../components/ui/surface';
import { useCreationShortcut } from '../../navigation/use-creation-shortcut';
import { navigationItems } from '../../navigation/navigation-config';
import { useServices } from '../../hooks/use-services';
import { useMe } from '../../profile/hooks';
import {
  useAccounts,
  useCategories,
  useFinanceMutation,
  useTransactions,
  useSummary,
} from './hooks';
import { Field, FinanceForm } from './forms';
import { value } from './form-data';
import {
  currencyDigits,
  AccountInputSchema,
  CategoryInputSchema,
  TransactionInputSchema,
  TransferInputSchema,
} from './contracts.generated';
import type { Account, Currency, TransactionQuery } from './contracts.generated';
import { formatMoney, parseMoney } from './money';
import { displayDate, localDateTime, toInstant } from './dates';

const accountTypes = {
  checking: 'Conta corrente',
  savings: 'Poupança',
  cash: 'Dinheiro',
  credit: 'Crédito',
  investment: 'Investimento',
  other: 'Outra',
  debt: 'Dívida',
};
const kindLabel = { INCOME: 'Receita', EXPENSE: 'Despesa', TRANSFER: 'Transferência' };
function Intro({ title, description }: { title: string; description: string }) {
  return <PageHeader title={title} description={description} />;
}
function usePresentation() {
  const me = useMe();
  return {
    timezone: me.data?.profile?.timezone ?? 'UTC',
    locale: me.data?.profile?.locale ?? 'pt-BR',
    ready: !me.isPending,
  };
}
export function FinanceLayout() { return <Outlet />; }
export function FinanceDashboard() {
  const { timezone, locale } = usePresentation();
  const now = localDateTime(new Date().toISOString(), timezone);
  const [period, setPeriod] = useState({ from: now.slice(0, 7) + '-01', to: now.slice(0, 10) });
  const from = toInstant(period.from + 'T00:00', timezone);
  const end = new Date(Date.parse(period.to + 'T00:00:00Z') + 86400000).toISOString().slice(0, 10);
  const to = toInstant(end + 'T00:00', timezone);
  const summary = useSummary(from, to);
  const accounts = useAccounts();
  return (
    <>
      <Intro
        title="Seu dinheiro, com clareza."
        description="Saldos reais, movimentos organizados e um passo de cada vez."
      />
      <div className="finance-toolbar">
        <div className="finance-period">
          <Field
            label="De"
            type="date"
            value={period.from}
            max={period.to}
            onChange={(event) => setPeriod({ ...period, from: event.target.value || period.from })}
          />
          <Field
            label="Até"
            type="date"
            value={period.to}
            min={period.from}
            onChange={(event) => setPeriod({ ...period, to: event.target.value || period.to })}
          />
        </div>
        <Button asChild>
          <Link to="/finance/transactions?action=create">
            <Plus />
            Novo movimento
          </Link>
        </Button>
      </div>
      {summary.isPending ? (
        <p role="status">Carregando sua visão financeira…</p>
      ) : summary.isError ? (
        <Feedback>Não foi possível carregar os saldos. Tente novamente.</Feedback>
      ) : !summary.data.currencies.length ? (
        <Card className="finance-empty">
          <Wallet aria-hidden="true" />
          <h2>Sua primeira conta é o começo.</h2>
          <p>Organize seu dinheiro sem perder de vista o que importa.</p>
          <Button asChild>
            <Link to="/finance/accounts?action=create">Criar primeira conta</Link>
          </Button>
        </Card>
      ) : (
        <div className="finance-summary">
          {summary.data.currencies.map((row) => (
            <Card key={row.currency}>
              <p className="eyebrow">{row.currency} · SALDO ATÉ O FIM DO PERÍODO</p>
              <p className="finance-balance">
                {formatMoney(row.totalBalanceMinor, row.currency, locale)}
              </p>
              <dl>
                <div>
                  <dt>
                    <ArrowDownLeft />
                    Receitas
                  </dt>
                  <dd>{formatMoney(row.incomeMinor, row.currency, locale)}</dd>
                </div>
                <div>
                  <dt>
                    <ArrowUpRight />
                    Despesas
                  </dt>
                  <dd>{formatMoney(row.expenseMinor, row.currency, locale)}</dd>
                </div>
                <div>
                  <dt>Resultado do período</dt>
                  <dd>{formatMoney(row.netMinor, row.currency, locale)}</dd>
                </div>
              </dl>
            </Card>
          ))}
        </div>
      )}
      {!!accounts.data?.length && (
        <section className="finance-overview">
          <h2>Suas contas</h2>
          <div className="finance-account-grid">
            {accounts.data.map((account) => (
              <Card key={account.id}>
                <p>
                  {account.name}{' '}
                  {!account.isActive && <span className="finance-badge">Inativa</span>}
                </p>
                <strong>{formatMoney(account.balanceMinor, account.currency, locale)}</strong>
                <p className="finance-caption">{accountTypes[account.type]}</p>
              </Card>
            ))}
          </div>
        </section>
      )}
      <SectionHeader title="Seu próximo passo" /><div className="ui-actions">{navigationItems.filter(item => ['budget', 'cards', 'debts', 'safe-spend'].includes(item.id)).map(item => <Button key={item.id} asChild variant="outline"><Link to={item.path}>{item.label}</Link></Button>)}</div>
      <p className="finance-note">
        Moedas são mostradas separadamente. Transferências não são receitas nem despesas. Datas no
        fuso {timezone}.
      </p>
    </>
  );
}
function AccountEditor({ account, done }: { account?: Account; done: () => void }) {
  const { finance } = useServices();
  const mutation = useFinanceMutation((data: FormData) =>
    account
      ? finance.patchAccount(account.id, {
          name: value(data, 'name').trim(),
          type: value(data, 'type') as Account['type'],
        })
      : finance.createAccount(
          AccountInputSchema.parse({
            name: value(data, 'name').trim(),
            type: value(data, 'type'),
            currency: value(data, 'currency'),
            initialBalanceMinor: parseMoney(
              value(data, 'balance'),
              value(data, 'currency') as Currency,
              false,
            ),
          }),
        ),
  );
  return (
    <Card>
      <h2>{account ? 'Editar conta' : 'Nova conta'}</h2>
      <FinanceForm
        reset={false}
        button={account ? 'Salvar conta' : 'Criar conta'}
        submit={async (data) => {
          await mutation.mutateAsync(data);
          done();
        }}
      >
        <Field
          label="Nome da conta"
          name="name"
          required
          maxLength={100}
          defaultValue={account?.name}
        />
        <Field label="Tipo de conta" name="type" defaultValue={account?.type ?? 'checking'}>
          {Object.entries(accountTypes).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Field>
        {!account && (
          <>
            <Field label="Moeda" name="currency" defaultValue="BRL">
              {Object.keys(currencyDigits).map((code) => (
                <option key={code}>{code}</option>
              ))}
            </Field>
            <Field
              label="Saldo inicial"
              name="balance"
              defaultValue="0"
              required
              inputMode="decimal"
            />
            <p className="finance-note">
              Saldo inicial e moeda ficam preservados após a criação. Use vírgula ou ponto decimal,
              sem milhar.
            </p>
          </>
        )}
      </FinanceForm>
      <Button variant="ghost" onClick={done}>
        Fechar
      </Button>
    </Card>
  );
}
export function AccountsPage() {
  const accounts = useAccounts();
  const { locale } = usePresentation();
  const { finance } = useServices();
  const [creating, setCreating] = useCreationShortcut();
  const [editingState, setEditingState] = useState<Account | 'new' | null>(null);
  const editing = editingState ?? (creating ? 'new' : null);
  const setEditing = (next: Account | 'new' | null) => { setEditingState(next); if (next !== 'new') setCreating(false); };
  const patch = useFinanceMutation((account: Account) =>
    finance.patchAccount(account.id, { isActive: !account.isActive }),
  );
  return (
    <>
      <Intro
        title="Um lugar para cada conta."
        description="Separe seu dinheiro por conta. O histórico continua disponível mesmo quando você desativa uma delas."
      />
      <div className="finance-toolbar">
        <h2>Contas financeiras</h2>
        <Button onClick={() => setEditing('new')}>
          <Plus />
          Nova conta
        </Button>
      </div>
      {editing && (
        <AccountEditor
          key={editing === 'new' ? 'new' : editing.id}
          account={editing === 'new' ? undefined : editing}
          done={() => setEditing(null)}
        />
      )}
      {accounts.isPending ? (
        <p role="status">Carregando contas…</p>
      ) : accounts.isError ? (
        <Feedback>Não foi possível carregar suas contas.</Feedback>
      ) : !accounts.data.length ? (
        <Card className="finance-empty">
          <h2>Nenhuma conta ainda.</h2>
          <p>Comece cadastrando onde seu dinheiro está.</p>
          <Button onClick={() => setEditing('new')}>Criar primeira conta</Button>
        </Card>
      ) : (
        <div className="finance-account-grid">
          {accounts.data.map((account) => (
            <Card key={account.id}>
              <div className="finance-card-heading">
                <h2>{account.name}</h2>
                <span className="finance-badge">{account.isActive ? 'Ativa' : 'Inativa'}</span>
              </div>
              <p className="finance-balance">
                {formatMoney(account.balanceMinor, account.currency, locale)}
              </p>
              <p className="finance-caption">
                {accountTypes[account.type]} · {account.currency}
              </p>
              <div className="finance-actions">
                <Button variant="outline" onClick={() => setEditing(account)}>
                  Editar {account.name}
                </Button>
                <ConfirmAction label={account.isActive ? 'Desativar' : 'Reativar'} title={account.isActive ? 'Desativar conta' : 'Reativar conta'} impact="O histórico e o saldo permanecem preservados. A disponibilidade da conta em novos registros será atualizada." pending={patch.isPending} onConfirm={() => patch.mutateAsync(account)} />
              </div>
            </Card>
          ))}
        </div>
      )}
      {patch.isError && <Feedback>Não foi possível atualizar a conta.</Feedback>}
    </>
  );
}
export function CategoriesPage() {
  const categories = useCategories();
  const { finance } = useServices();
  const create = useFinanceMutation((data: FormData) =>
    finance.createCategory(
      CategoryInputSchema.parse({ name: value(data, 'name').trim(), kind: value(data, 'kind') }),
    ),
  );
  const patch = useFinanceMutation((category: { id: string; isActive: boolean }) =>
    finance.patchCategory(category.id, { isActive: !category.isActive }),
  );
  return (
    <>
      <Intro
        title="Cada movimento tem um contexto."
        description="Crie categorias de receita e despesa. Desativar mantém seus movimentos anteriores intactos."
      />
      <div className="finance-columns">
        <Card>
          <h2>Nova categoria</h2>
          <FinanceForm button="Criar categoria" submit={(data) => create.mutateAsync(data)}>
            <Field label="Nome da categoria" name="name" required maxLength={100} />
            <Field label="Tipo da categoria" name="kind" defaultValue="EXPENSE">
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </Field>
          </FinanceForm>
        </Card>
        <Card>
          <h2>Suas categorias</h2>
          {categories.isPending ? (
            <p role="status">Carregando categorias…</p>
          ) : categories.isError ? (
            <Feedback>Não foi possível carregar categorias.</Feedback>
          ) : !categories.data.length ? (
            <p className="finance-note">
              Nenhuma categoria ainda. Movimentos também podem ficar sem categoria.
            </p>
          ) : (
            <ul className="finance-list">
              {categories.data.map((category) => (
                <li key={category.id}>
                  <div>
                    <strong>{category.name}</strong>
                    <p>
                      {kindLabel[category.kind]} · {category.isActive ? 'Ativa' : 'Inativa'}
                    </p>
                  </div>
                  <ConfirmAction label={category.isActive ? 'Desativar' : 'Reativar'} title={category.isActive ? 'Desativar categoria' : 'Reativar categoria'} impact="Os movimentos existentes permanecem preservados. A disponibilidade da categoria em novos registros será atualizada." pending={patch.isPending} onConfirm={() => patch.mutateAsync(category)} />
                </li>
              ))}
            </ul>
          )}
          {patch.isError && <Feedback>Não foi possível atualizar a categoria.</Feedback>}
        </Card>
      </div>
    </>
  );
}
function MovementEditor({ done }: { done: () => void }) {
  const accounts = useAccounts();
  const categories = useCategories();
  const { timezone, ready } = usePresentation();
  const { finance } = useServices();
  const [kind, setKind] = useState<'INCOME' | 'EXPENSE' | 'TRANSFER'>('EXPENSE');
  const [source, setSource] = useState('');
  const [key, setKey] = useState(() => crypto.randomUUID());
  const available = accounts.data?.filter((account) => account.isActive) ?? [];
  const selected = available.find((account) => account.id === source) ?? available[0];
  const mutation = useFinanceMutation(async (data: FormData) => {
    const account = available.find((row) => row.id === value(data, 'account'));
    if (!account) throw new Error('Selecione uma conta ativa.');
    const common = {
      amountMinor: parseMoney(value(data, 'amount'), account.currency),
      currency: account.currency,
      description: value(data, 'description').trim(),
      occurredAt: toInstant(value(data, 'date'), timezone),
    };
    if (kind === 'TRANSFER') {
      const destination = value(data, 'destination');
      if (destination === account.id) throw new Error('Origem e destino devem ser diferentes.');
      await finance.createTransfer(
        TransferInputSchema.parse({
          ...common,
          sourceAccountId: account.id,
          destinationAccountId: destination,
          idempotencyKey: key,
        }),
      );
      setKey(crypto.randomUUID());
    } else
      await finance.createTransaction(
        TransactionInputSchema.parse({
          ...common,
          type: kind,
          accountId: account.id,
          ...(value(data, 'category') ? { categoryId: value(data, 'category') } : {}),
        }),
      );
  });
  return (
    <Card>
      <h2>Novo movimento</h2>
      <div className="finance-kind" role="group" aria-label="Tipo do movimento">
        {Object.entries(kindLabel).map(([code, label]) => (
          <Button
            key={code}
            type="button"
            variant={kind === code ? 'default' : 'outline'}
            disabled={mutation.isPending}
            aria-pressed={kind === code}
            onClick={() => setKind(code as typeof kind)}
          >
            {label}
          </Button>
        ))}
      </div>
      {!ready ? <p role="status">Carregando seu fuso…</p> : !available.length ? (
        <p className="finance-note">Crie uma conta ativa antes de registrar um movimento.</p>
      ) : (
        <FinanceForm
          reset={false}
          button={
            kind === 'TRANSFER'
              ? 'Registrar transferência'
              : kind === 'INCOME'
                ? 'Registrar receita'
                : 'Registrar despesa'
          }
          submit={async (data) => {
            await mutation.mutateAsync(data);
            done();
          }}
        >
          <div className="finance-field">
            <label htmlFor="movement-account">
              {kind === 'TRANSFER' ? 'Conta de origem' : 'Conta'}
            </label>
            <select
              id="movement-account"
              name="account"
              className="finance-select"
              value={selected?.id}
              onChange={(event) => setSource(event.target.value)}
            >
              {available.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {account.currency}
                </option>
              ))}
            </select>
          </div>
          {kind === 'TRANSFER' ? (
            <Field label="Conta de destino" name="destination" required>
              <option value="">Selecione</option>
              {available
                .filter(
                  (account) =>
                    account.id !== selected?.id && account.currency === selected?.currency,
                )
                .map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
            </Field>
          ) : (
            <Field key={kind} label="Categoria" name="category">
              <option value="">Sem categoria</option>
              {categories.data
                ?.filter((category) => category.isActive && category.kind === kind)
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
            </Field>
          )}
          <Field
            label={`Valor (${selected?.currency ?? 'BRL'})`}
            name="amount"
            inputMode="decimal"
            required
          />
          <Field label="Descrição" name="description" maxLength={500} />
          <Field
            label="Data e hora do movimento"
            name="date"
            type="datetime-local"
            required
            defaultValue={localDateTime(new Date().toISOString(), timezone)}
          />
          <p className="finance-note">
            Fuso: {timezone}. Não use separador de milhar. Transferências exigem a mesma moeda.
          </p>
        </FinanceForm>
      )}
      <Button variant="ghost" onClick={done}>
        Fechar
      </Button>
    </Card>
  );
}
export function TransactionsPage() {
  const [filters, setFilters] = useState<TransactionQuery>({ limit: '25' });
  const [editing, setEditing] = useCreationShortcut();
  const accounts = useAccounts();
  const categories = useCategories();
  const transactions = useTransactions(filters);
  const { timezone, locale } = usePresentation();
  const { finance } = useServices();
  const cancel = useFinanceMutation((row: { id: string; type: string }) =>
    row.type === 'TRANSFER'
      ? finance.patchTransfer(row.id, { isCancelled: true })
      : finance.patchTransaction(row.id, { isCancelled: true }),
  );
  const accountName = (id: string) =>
    accounts.data?.find((account) => account.id === id)?.name ?? 'Conta';
  return (
    <>
      <Intro
        title="Sua vida financeira em movimento."
        description="Receitas, despesas e transferências, sem perder a história. Cancelar um movimento preserva o registro e remove seu efeito no saldo."
      />
      <div className="finance-toolbar">
        <h2>Movimentos</h2>
        <Button onClick={() => setEditing(true)}>
          <Plus />
          Novo movimento
        </Button>
      </div>
      {editing && <MovementEditor done={() => setEditing(false)} />}
      <form
        className="finance-filters"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          setFilters({
            limit: '25',
            ...(value(data, 'account') ? { accountId: value(data, 'account') } : {}),
            ...(value(data, 'category') ? { categoryId: value(data, 'category') } : {}),
            ...(value(data, 'type')
              ? { type: value(data, 'type') as TransactionQuery['type'] }
              : {}),
            ...(value(data, 'from')
              ? { from: toInstant(value(data, 'from') + 'T00:00', timezone) }
              : {}),
            ...(value(data, 'to')
              ? {
                  to: toInstant(
                    new Date(Date.parse(value(data, 'to') + 'T00:00:00Z') + 86400000)
                      .toISOString()
                      .slice(0, 10) + 'T00:00',
                    timezone,
                  ),
                }
              : {}),
          });
        }}
      >
        <Field label="Filtrar conta" name="account">
          <option value="">Todas as contas</option>
          {accounts.data?.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Field>
        <Field label="Filtrar categoria" name="category">
          <option value="">Todas as categorias</option>
          {categories.data?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Field>
        <Field label="Filtrar tipo" name="type">
          <option value="">Todos os tipos</option>
          {Object.entries(kindLabel).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Field>
        <Field label="Data inicial" name="from" type="date" />
        <Field label="Data final" name="to" type="date" />
        <Button variant="outline" type="submit">
          Aplicar filtros
        </Button>
        <Button variant="ghost" type="reset" onClick={() => setFilters({ limit: '25' })}>
          Limpar
        </Button>
      </form>
      {transactions.isPending ? (
        <p role="status">Carregando movimentos…</p>
      ) : transactions.isError ? (
        <Feedback>
          Não foi possível carregar movimentos. Confira o período e tente novamente.
        </Feedback>
      ) : !transactions.data.items.length ? (
        <Card className="finance-empty">
          <h2>Nenhum movimento neste filtro.</h2>
          <p>Registre sua primeira receita ou despesa para acompanhar seu saldo.</p>
        </Card>
      ) : (
        <Card className="finance-movements">
          <ul className="finance-list">
            {transactions.data.items.map((row) => (
              <li key={row.id}>
                <div className={`movement-icon ${row.type.toLowerCase()}`}>
                  {row.type === 'TRANSFER' ? (
                    <ArrowLeftRight aria-hidden="true" />
                  ) : row.type === 'INCOME' ? (
                    <ArrowDownLeft aria-hidden="true" />
                  ) : (
                    <ArrowUpRight aria-hidden="true" />
                  )}
                </div>
                <div className="movement-detail">
                  <strong>{row.description || kindLabel[row.type]}</strong>
                  <p>
                    {accountName(row.accountId)}
                    {row.destinationAccountId &&
                      ' → ' + accountName(row.destinationAccountId)} · {kindLabel[row.type]}
                    {row.categoryId &&
                      ' · ' +
                        (categories.data?.find((category) => category.id === row.categoryId)
                          ?.name ?? 'Categoria')}
                  </p>
                  <p>
                    {displayDate(row.occurredAt, timezone, locale)}
                    {row.isCancelled && ' · Cancelado'}
                  </p>
                </div>
                <strong className="movement-value">
                  {formatMoney(row.amountMinor, row.currency, locale)}
                </strong>
                {!row.isCancelled && (
                  <ConfirmAction label="Cancelar" title="Cancelar este movimento?" impact="O registro será preservado e deixará de afetar o saldo. Esta é uma correção de lançamento." confirmLabel="Confirmar cancelamento" pending={cancel.isPending} onConfirm={() => cancel.mutateAsync(row)} />
                )}
              </li>
            ))}
          </ul>
          {transactions.data.nextCursor && (
            <Button
              variant="outline"
              onClick={() =>
                setFilters({
                  ...filters,
                  cursorAt: transactions.data.nextCursor!.occurredAt,
                  cursorId: transactions.data.nextCursor!.id,
                })
              }
            >
              Próxima página
            </Button>
          )}
          {filters.cursorId && (
            <Button
              variant="ghost"
              onClick={() => {
                const first = { ...filters };
                delete first.cursorAt;
                delete first.cursorId;
                setFilters(first);
              }}
            >
              Primeira página
            </Button>
          )}
        </Card>
      )}
      {cancel.isError && <Feedback>Não foi possível cancelar o movimento.</Feedback>}
    </>
  );
}
