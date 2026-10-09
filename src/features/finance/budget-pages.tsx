import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  CheckCircle2,
  TriangleAlert,
  ChevronLeft,
  ChevronRight,
  Copy,
  Plus,
  ArrowRight,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Feedback } from '../../components/feedback';
import { useMe } from '../../profile/hooks';
import { useServices } from '../../hooks/use-services';
import { useCategories, useFinanceMutation } from './hooks';
import { useBudgetSummary } from './budget-hooks';
import { Field, FinanceForm } from './forms';
import { value } from './form-data';
import { formatMoney, parseMoney } from './money';
import { BudgetAllocationInputSchema, CurrencySchema, currencyDigits } from './contracts.generated';
import type { Currency, BudgetCategoryProgress, BudgetPaceStatus } from './contracts.generated';
import {
  budgetAmountInput,
  budgetMonthLabel,
  budgetPercentLabel,
  budgetProgress,
  currentBudgetMonth,
  shiftBudgetMonth,
  validBudgetMonth,
} from './budget-view';

const paceLabels = {
  ON_TRACK: 'Dentro do ritmo',
  ATTENTION: 'Acima do ritmo',
  OVER_BUDGET: 'Acima do orçamento',
};
function Pace({ status }: { status: BudgetPaceStatus }) {
  const Icon = status === 'ON_TRACK' ? CheckCircle2 : TriangleAlert;
  return (
    <span className={'budget-pace budget-pace-' + status.toLowerCase()}>
      <Icon aria-hidden="true" />
      {paceLabels[status]}
    </span>
  );
}
function BudgetAction({
  label,
  children,
  action,
  complete,
}: {
  label: string;
  children?: ReactNode;
  action: () => Promise<unknown>;
  complete?: (data: unknown) => string;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  return (
    <div className="budget-action">
      <Button
        type="button"
        disabled={busy}
        onClick={async () => {
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          setError('');
          setResult('');
          try {
            const data = await action();
            setResult(complete?.(data) ?? 'Orçamento atualizado.');
          } catch (failure) {
            setError(
              failure instanceof Error
                ? failure.message
                : 'Não foi possível atualizar o orçamento.',
            );
          } finally {
            lock.current = false;
            setBusy(false);
          }
        }}
      >
        {children}
        {busy ? 'Atualizando…' : label}
      </Button>
      {error && <Feedback>{error}</Feedback>}
      {result && <Feedback success>{result}</Feedback>}
    </div>
  );
}
function AllocationEditor({
  month,
  currency,
  existing,
  available,
  done,
}: {
  month: string;
  currency: Currency;
  existing?: BudgetCategoryProgress;
  available: { id: string; name: string }[];
  done: () => void;
}) {
  const { finance } = useServices();
  const mutation = useFinanceMutation(
    (input: {
      categoryId: string;
      amountMinor: string;
      rolloverPolicy: 'NONE' | 'POSITIVE_ONLY';
    }) =>
      finance.putBudgetAllocation(
        month,
        input.categoryId,
        BudgetAllocationInputSchema.parse({
          currency,
          amountMinor: input.amountMinor,
          rolloverPolicy: input.rolloverPolicy,
        }),
      ),
  );
  return (
    <FinanceForm
      reset={false}
      onCancel={done}
      cancelLabel={existing ? 'Cancelar edição' : 'Cancelar'}
      button={existing ? 'Salvar limite' : 'Adicionar limite'}
      submit={async (data) => {
        await mutation.mutateAsync({
          categoryId: existing?.categoryId ?? value(data, 'categoryId'),
          amountMinor: parseMoney(value(data, 'amount'), currency, false),
          rolloverPolicy: value(data, 'rolloverPolicy') as 'NONE' | 'POSITIVE_ONLY',
        });
        done();
      }}
    >
      {!existing && (
        <Field label="Categoria de despesa" name="categoryId" required>
          <option value="">Escolha uma categoria</option>
          {available.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Field>
      )}
      <Field
        label="Limite planejado"
        name="amount"
        required
        inputMode="decimal"
        autoComplete="off"
        defaultValue={existing ? budgetAmountInput(existing.baseMinor, currency) : ''}
        placeholder="0,00"
      />
      <Field
        label="Sobra do mês anterior"
        name="rolloverPolicy"
        defaultValue={existing?.rolloverPolicy ?? 'NONE'}
        required
      >
        <option value="NONE">Não carregar</option>
        <option value="POSITIVE_ONLY">Carregar apenas saldo positivo</option>
      </Field>
      <p className="finance-note">
        Zero é permitido. A sobra considera o mês anterior já encerrado, nesta mesma moeda.
      </p>
    </FinanceForm>
  );
}
function CategoryBudget({
  row,
  month,
  currency,
  locale,
}: {
  row: BudgetCategoryProgress;
  month: string;
  currency: Currency;
  locale: string;
}) {
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const { finance } = useServices();
  const remove = useFinanceMutation(() =>
    finance.removeBudgetAllocation(month, row.categoryId, currency),
  );
  const percent = budgetPercentLabel(row.utilizationPercent, locale);
  return (
    <Card className="budget-category">
      <div className="budget-category-head">
        <div>
          <h3>{row.categoryName}</h3>
          {!row.categoryIsActive && <span className="finance-badge">Inativa · histórico</span>}
        </div>
        <Pace status={row.paceStatus} />
      </div>
      <dl className="budget-category-values">
        <div>
          <dt>Planejado</dt>
          <dd>{formatMoney(row.baseMinor, currency, locale)}</dd>
        </div>
        <div>
          <dt>Gasto</dt>
          <dd>{formatMoney(row.spentMinor, currency, locale)}</dd>
        </div>
        <div>
          <dt>Restante</dt>
          <dd>{formatMoney(row.remainingMinor, currency, locale)}</dd>
        </div>
      </dl>
      {row.rolloverPolicy === 'POSITIVE_ONLY' && (
        <p className="finance-caption">
          Sobra positiva: {formatMoney(row.rolloverMinor, currency, locale)} · Disponível:{' '}
          {formatMoney(row.availableMinor, currency, locale)}
        </p>
      )}
      <div
        className="budget-progress"
        role="progressbar"
        aria-label={`${row.categoryName}: orçamento utilizado`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={budgetProgress(row.utilizationPercent)}
        aria-valuetext={percent}
      >
        <span style={{ width: budgetProgress(row.utilizationPercent) + '%' }} />
      </div>
      <p className="finance-caption">
        {percent}
        {row.utilizationPercent !== null && ' utilizado'}
      </p>
      {editing ? (
        <>
          <AllocationEditor
            month={month}
            currency={currency}
            existing={row}
            available={[]}
            done={() => setEditing(false)}
          />
        </>
      ) : (
        <div className="budget-row-actions">
          <Button type="button" variant="outline" onClick={() => setEditing(true)}>
            Editar limite
          </Button>
          <Button type="button" variant="ghost" onClick={() => setRemoving(true)}>
            Remover limite
          </Button>
        </div>
      )}
      {removing && (
        <div className="budget-remove">
          <p>
            Remover este limite? Os gastos e o registro serão preservados. Os gastos passarão a
            aparecer sem orçamento.
          </p>
          <BudgetAction label="Confirmar remoção" action={() => remove.mutateAsync(undefined)} />
          <Button type="button" variant="ghost" onClick={() => setRemoving(false)}>
            Manter limite
          </Button>
        </div>
      )}
    </Card>
  );
}
export function BudgetPage() {
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const me = useMe();
  const categories = useCategories();
  const { finance } = useServices();
  const locale = me.data?.profile?.locale ?? 'pt-BR';
  const zone = me.data?.profile?.timezone ?? 'UTC';
  const month = params.get('month') ?? currentBudgetMonth(zone);
  const parsedCurrency = CurrencySchema.safeParse(params.get('currency') ?? 'BRL');
  const currency = parsedCurrency.success ? parsedCurrency.data : 'BRL';
  const valid = validBudgetMonth(month) && parsedCurrency.success;
  const summary = useBudgetSummary(month, currency, valid && !me.isPending && !me.isError);
  const ensure = useFinanceMutation(() => finance.ensureBudget(month, { currency }));
  const copy = useFinanceMutation(() => finance.copyBudgetPrevious(month, { currency }));
  const change = (next: string, nextCurrency = currency) => {
    setAdding(false);
    setParams({ month: next, currency: nextCurrency });
  };
  const s = summary.data;
  const money = (value: string) => formatMoney(value, currency, locale);
  const available =
    categories.data?.filter(
      (c) =>
        c.kind === 'EXPENSE' && c.isActive && !s?.categories.some((a) => a.categoryId === c.id),
    ) ?? [];
  return (
    <>
      <div className="page-intro">
        <p className="eyebrow">CLAREZA FINANCEIRA</p>
        <h1 tabIndex={-1}>Orçamento mensal</h1>
        <p>Planeje por categoria e acompanhe o que já foi gasto.</p>
      </div>
      <div className="budget-toolbar">
        <div className="budget-month-navigation">
          <Button
            variant="ghost"
            aria-label="Mês anterior"
            disabled={!valid || !validBudgetMonth(shiftBudgetMonth(month, -1))}
            onClick={() => change(shiftBudgetMonth(month, -1))}
          >
            <ChevronLeft />
          </Button>
          <Field
            label="Mês do orçamento"
            type="month"
            min="1000-01"
            max="9998-12"
            value={month}
            onChange={(e) => {
              if (e.target.value) change(e.target.value);
            }}
          />
          <Button
            variant="ghost"
            aria-label="Próximo mês"
            disabled={!valid || !validBudgetMonth(shiftBudgetMonth(month, 1))}
            onClick={() => change(shiftBudgetMonth(month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>
        <label className="budget-currency">
          Moeda
          <select
            aria-label="Moeda do orçamento"
            className="finance-select"
            value={currency}
            onChange={(e) =>
              change(valid ? month : currentBudgetMonth(zone), CurrencySchema.parse(e.target.value))
            }
          >
            {Object.keys(currencyDigits).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      {!valid ? (
        <Feedback>Escolha um mês e uma moeda válidos.</Feedback>
      ) : me.isError ? (
        <>
          <Feedback>Não foi possível carregar seu perfil.</Feedback>
          <Button
            onClick={() => {
              void me.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </>
      ) : summary.isPending ? (
        <p role="status">Carregando orçamento…</p>
      ) : summary.isError ? (
        <>
          <Feedback>{summary.error.message}</Feedback>
          <Button
            onClick={() => {
              void summary.refetch();
            }}
          >
            Tentar novamente
          </Button>
        </>
      ) : (
        s && (
          <>
            <div className="budget-month-title">
              <h2>{budgetMonthLabel(month, locale)}</h2>
              <span className="finance-caption">Calendário em {s.timeZone}</span>
            </div>
            <div className="budget-summary-grid">
              <Card>
                <p className="eyebrow">DISPONÍVEL NO ORÇAMENTO</p>
                <strong className="finance-total">{money(s.budgetedTotalMinor)}</strong>
                <p className="finance-caption">
                  Base {money(s.baseBudgetTotalMinor)} + sobra {money(s.rolloverTotalMinor)}
                </p>
              </Card>
              <Card>
                <p className="eyebrow">GASTO DO MÊS</p>
                <strong className="finance-total">{money(s.expenseTotalMinor)}</strong>
                <p className="finance-caption">
                  {budgetPercentLabel(s.utilizationPercent, locale)}
                </p>
              </Card>
              <Card>
                <p className="eyebrow">RESTANTE PLANEJADO</p>
                <strong className="finance-total">{money(s.remainingBudgetedMinor)}</strong>
                <p className="finance-caption">Nas categorias com limite definido</p>
              </Card>
            </div>
            {!s.periodId ? (
              <Card className="budget-empty">
                <h2>Seu orçamento começa aqui.</h2>
                <p>
                  Defina limites para as categorias de despesa deste mês. Os gastos existentes
                  continuam visíveis.
                </p>
                <div className="budget-empty-actions">
                  <BudgetAction
                    label="Criar orçamento deste mês"
                    action={() => ensure.mutateAsync(undefined)}
                  >
                    <Plus aria-hidden="true" />
                  </BudgetAction>
                  {s.canCopyPrevious && (
                    <BudgetAction
                      label="Copiar mês anterior"
                      action={() => copy.mutateAsync(undefined)}
                    >
                      <Copy aria-hidden="true" />
                    </BudgetAction>
                  )}
                </div>
              </Card>
            ) : (
              <>
                <Card className="budget-rhythm">
                  <div>
                    <p className="eyebrow">RITMO DO MÊS</p>
                    <Pace status={s.paceStatus} />
                    <p>
                      Gasto atual: {money(s.expenseTotalMinor)}. Referência até hoje:{' '}
                      {money(s.expectedSpendToDateMinor)}.
                    </p>
                    <p className="finance-caption">
                      {s.elapsedDays} de {s.daysInMonth} dias. Comparação linear do limite
                      disponível; inclui gastos sem orçamento.
                    </p>
                  </div>
                  {s.canCopyPrevious && (
                    <BudgetAction
                      label="Copiar mês anterior"
                      action={() => copy.mutateAsync(undefined)}
                      complete={(result) => {
                        const r = result as {
                          copiedCount: number;
                          alreadyPresentCount: number;
                          skippedInactiveCount: number;
                        };
                        return `${r.copiedCount} limites copiados. ${r.alreadyPresentCount} existentes preservados. ${r.skippedInactiveCount} categorias inativas ignoradas.`;
                      }}
                    >
                      <Copy aria-hidden="true" />
                    </BudgetAction>
                  )}
                </Card>
                <section className="budget-planning">
                  <div className="budget-section-head">
                    <div>
                      <h2>Planejado por categoria</h2>
                      <p className="finance-caption">
                        Limites, gastos e saldo disponível no mesmo lugar.
                      </p>
                    </div>
                    <Button disabled={!available.length} onClick={() => setAdding(!adding)}>
                      <Plus aria-hidden="true" />
                      Adicionar categoria
                    </Button>
                  </div>
                  {categories.isError && (
                    <Feedback>Não foi possível carregar as categorias para novos limites.</Feedback>
                  )}
                  {adding && (
                    <Card>
                      <h3>Novo limite</h3>
                      <AllocationEditor
                        key={month + currency}
                        month={month}
                        currency={currency}
                        available={available}
                        done={() => setAdding(false)}
                      />
                    </Card>
                  )}
                  {!s.categories.length && (
                    <div className="finance-empty">
                      <p>Nenhuma categoria planejada para este mês.</p>
                      {!available.length && (
                        <Link to="/finance/categories">
                          Criar categoria de despesa <ArrowRight aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  )}
                  <div className="budget-categories">
                    {s.categories.map((row) => (
                      <CategoryBudget
                        key={month + currency + row.allocationId}
                        row={row}
                        month={month}
                        currency={currency}
                        locale={locale}
                      />
                    ))}
                  </div>
                </section>
              </>
            )}
            <section className="budget-unplanned">
              <div className="budget-section-head">
                <div>
                  <h2>Gastos sem orçamento</h2>
                  <p>
                    Despesas de categorias sem limite neste mês, incluindo despesas sem categoria.
                  </p>
                </div>
                <strong>{money(s.unbudgetedSpendingMinor)}</strong>
              </div>
              {s.unbudgetedCategories.length ? (
                <ul>
                  {s.unbudgetedCategories.map((c) => (
                    <li key={c.categoryId ?? 'uncategorized'}>
                      <span>
                        {c.categoryName ?? 'Sem categoria'}
                        {c.categoryId && !c.categoryIsActive && (
                          <span className="finance-badge">Inativa</span>
                        )}
                      </span>
                      <strong>{money(c.spentMinor)}</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="finance-caption">Nenhum gasto fora das categorias planejadas.</p>
              )}
            </section>
            <p className="finance-note">
              Cada moeda tem seu orçamento. Receitas, transferências e movimentos cancelados não
              entram nos gastos. Saldos e limites são recalculados a partir dos registros.
            </p>
          </>
        )
      )}
    </>
  );
}
