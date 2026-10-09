import { useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { CheckCircle2, Target, TriangleAlert } from 'lucide-react';
import { z } from 'zod';
import { useCreationShortcut } from '../../navigation/use-creation-shortcut';
import { ConfirmAction } from '../../components/ui/confirm-action';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Feedback } from '../../components/feedback';
import { FormSection } from '../../components/ui/form-section';
import { useServices } from '../../hooks/use-services';
import { useMe } from '../../profile/hooks';
import { useFinanceMutation } from './hooks';
import { useGoals, useGoal, useGoalEvents } from './goal-hooks';
import { Field, FinanceForm } from './forms';
import { value } from './form-data';
import { formatMoney, parseMoney } from './money';
import { displayDate, localDateTime, toInstant } from './dates';
import { budgetAmountInput, budgetMonthLabel, budgetPercentLabel, budgetProgress } from './budget-view';
import { goalTotals, goalStatusLabels, goalPriorityLabels, goalPlanLabels } from './goal-view';
import { GoalInputSchema, GoalPatchSchema, GoalEventInputSchema, GoalSchema, GoalQuerySchema, currencyDigits } from './contracts.generated';
import type { Goal, GoalInput, GoalPatch, GoalEventInput } from './contracts.generated';

function PlanningNote() { return <p className="goal-planning-note">Metas são planejamento: adicionar ou retirar valores registra dinheiro destinado à meta. Isso não movimenta suas contas e não altera transações, transferências ou orçamentos.</p>; }
function PlanLabel({ goal }: { goal: Goal }) {
  const Icon = goal.planStatus === 'ACHIEVED' || goal.planStatus === 'ON_TRACK' ? CheckCircle2 : TriangleAlert;
  return <span className="goal-badge"><Icon aria-hidden="true" />{goalPlanLabels[goal.planStatus]}</span>;
}
function GoalNumbers({ goal, locale }: { goal: Goal; locale: string }) {
  const month = (v: string | null) => v ? budgetMonthLabel(v, locale) : 'Não definido';
  const amount = (v: string | null) => v === null ? 'Não disponível' : formatMoney(v, goal.currency, locale);
  return <>
    <div className="goal-progress" role="progressbar" aria-label={'Progresso de ' + goal.name} aria-valuemin={0} aria-valuemax={100} aria-valuenow={budgetProgress(goal.progressPercent)} aria-valuetext={budgetPercentLabel(goal.progressPercent, locale)}><span style={{ width: budgetProgress(goal.progressPercent) + '%' }} /></div>
    <p className="goal-percent">{budgetPercentLabel(goal.progressPercent, locale)} do valor alvo</p>
    <dl className="goal-metrics">
      <div><dt>Acumulado declarado</dt><dd>{amount(goal.currentAmountMinor)}</dd></div><div><dt>Valor alvo</dt><dd>{amount(goal.targetAmountMinor)}</dd></div><div><dt>Falta alcançar</dt><dd>{amount(goal.remainingAmountMinor)}</dd></div>
      <div><dt>Prazo</dt><dd>{month(goal.targetMonth)}</dd></div><div><dt>Planejado por mês</dt><dd>{amount(goal.plannedMonthlyMinor)}</dd></div><div><dt>Necessário por mês</dt><dd>{amount(goal.requiredMonthlyMinor)}</dd></div>
      <div><dt>Previsão sem rendimento</dt><dd>{goal.estimatedCompletionMonth ? month(goal.estimatedCompletionMonth) : 'Sem previsão'}</dd></div>
    </dl>
  </>;
}
function GoalEditor({ existing, done, onCancel }: { existing?: Goal; done: (goal: Goal) => void; onCancel: () => void }) {
  const { finance } = useServices();
  const mutation = useFinanceMutation((input: GoalInput | GoalPatch) => existing ? finance.patchGoal(existing.id, GoalPatchSchema.parse(input)) : finance.createGoal(GoalInputSchema.parse(input)));
  return <FinanceForm reset={false} onCancel={onCancel} button={existing ? 'Salvar meta' : 'Criar meta'} submit={async data => {
    const currency = existing?.currency ?? GoalInputSchema.shape.currency.parse(value(data, 'currency'));
    const planned = value(data, 'planned');
    const input = { name: value(data, 'name'), description: value(data, 'description') || null, targetAmountMinor: parseMoney(value(data, 'target'), currency), targetMonth: value(data, 'targetMonth') || null, plannedMonthlyMinor: planned ? parseMoney(planned, currency, false) : null, priority: value(data, 'priority') };
    const payload = existing ? GoalPatchSchema.parse(input) : GoalInputSchema.parse({ ...input, currency });
    done(GoalSchema.parse(await mutation.mutateAsync(payload)));
  }}>
    <FormSection title="Seu objetivo"><Field label="Nome" name="name" required maxLength={100} defaultValue={existing?.name} placeholder="Ex.: Reserva, viagem ou estudos" />
    <Field label="Descrição opcional" name="description" maxLength={1000} defaultValue={existing?.description ?? ''} />
    </FormSection><FormSection title="Valor e planejamento">
    <Field label="Moeda" name="currency" required disabled={!!existing} defaultValue={existing?.currency ?? 'BRL'}>{Object.keys(currencyDigits).map(c => <option key={c} value={c}>{c}</option>)}</Field>
    {existing && <p className="form-hint">A moeda é fixa para preservar o histórico da meta.</p>}
    <Field label="Valor alvo" name="target" inputMode="decimal" required defaultValue={existing ? budgetAmountInput(existing.targetAmountMinor, existing.currency) : ''} placeholder="10000,00" />
    <Field label="Prazo opcional" name="targetMonth" type="month" min="1000-01" max="9998-12" defaultValue={existing?.targetMonth ?? ''} />
    <Field label="Contribuição mensal planejada opcional" name="planned" inputMode="decimal" defaultValue={existing?.plannedMonthlyMinor != null ? budgetAmountInput(existing.plannedMonthlyMinor, existing.currency) : ''} placeholder="1000,00" />
    <Field label="Prioridade" name="priority" required defaultValue={existing?.priority ?? 'MEDIUM'}>{Object.entries(goalPriorityLabels).map(([v, label]) => <option key={v} value={v}>{label}</option>)}</Field>
    </FormSection>
  </FinanceForm>;
}
export function GoalsPage() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [editing, setEditing] = useCreationShortcut();
  const parsed = GoalQuerySchema.safeParse({ ...(params.get('status') ? { status: params.get('status') } : {}), ...(params.get('currency') ? { currency: params.get('currency') } : {}) });
  const goals = useGoals(parsed.success ? parsed.data : {});
  const me = useMe();
  const locale = me.data?.profile?.locale ?? 'pt-BR';
  const filter = (key: string, v: string) => { const next = new URLSearchParams(params); if (v) next.set(key, v); else next.delete(key); setParams(next); };
  return <>
    <div className="page-intro"><h1 tabIndex={-1}>Metas financeiras</h1><p>Acompanhe valores destinados às suas metas.</p></div><PlanningNote />
    <div className="goal-toolbar"><div className="goal-filters"><label>Status<select aria-label="Status" className="finance-select" value={parsed.success ? parsed.data.status ?? '' : ''} onChange={e => filter('status', e.target.value)}><option value="">Todos os status</option>{Object.entries(goalStatusLabels).map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></label><label>Filtrar moeda<select aria-label="Filtrar moeda" className="finance-select" value={parsed.success ? parsed.data.currency ?? '' : ''} onChange={e => filter('currency', e.target.value)}><option value="">Todas as moedas</option>{Object.keys(currencyDigits).map(c => <option key={c}>{c}</option>)}</select></label></div><Button variant={editing ? "outline" : "default"} onClick={() => setEditing(!editing)}>{editing ? 'Cancelar criação' : 'Nova meta'}</Button></div>
    {!parsed.success && <Feedback>Os filtros informados são inválidos.</Feedback>}
    {editing && <Card><h2>Nova meta financeira</h2><GoalEditor onCancel={() => setEditing(false)} done={goal => { setEditing(false); navigate('/finance/goals/' + goal.id); }} /></Card>}
    {goals.isPending ? <p role="status">Carregando metas…</p> : goals.isError ? <Feedback>Não foi possível carregar suas metas. Tente novamente.</Feedback> : !goals.data.length ? <Card className="finance-empty"><Target aria-hidden="true" /><h2>{params.size ? 'Nenhuma meta nesses filtros' : 'Nenhuma meta cadastrada'}</h2><p>Crie uma meta e defina o valor que deseja alcançar.</p></Card> : <>
      <div className="finance-summary">{goalTotals(goals.data).map(total => <Card key={total.currency}><p className="eyebrow">{total.currency} · METAS EXIBIDAS</p><dl><div><dt>Acumulado declarado</dt><dd>{formatMoney(String(total.current), total.currency, locale)}</dd></div><div><dt>Valor alvo total</dt><dd>{formatMoney(String(total.target), total.currency, locale)}</dd></div><div><dt>Falta alcançar</dt><dd>{formatMoney(String(total.remaining), total.currency, locale)}</dd></div></dl></Card>)}</div>
      <div className="goal-grid">{goals.data.map(goal => <Card key={goal.id} className="goal-card"><div className="goal-card-head"><h2><Link to={'/finance/goals/' + goal.id}>{goal.name}</Link></h2><span>{goalStatusLabels[goal.status]}</span></div><p>Prioridade {goalPriorityLabels[goal.priority].toLowerCase()} · {goal.currency}</p><PlanLabel goal={goal} /><GoalNumbers goal={goal} locale={locale} /><Button asChild variant="outline"><Link to={'/finance/goals/' + goal.id}>Ver meta e histórico</Link></Button></Card>)}</div>
    </>}
  </>;
}
function GoalAction({ goal, status, label }: { goal: Goal; status: Goal['status']; label: string }) {
  const { finance } = useServices();
  const mutation = useFinanceMutation(() => finance.patchGoal(goal.id, { status }));
  const locked = useRef(false);
  if (status === 'ARCHIVED') return <ConfirmAction label={label} title="Arquivar meta" impact="O histórico permanece disponível. A meta sai do planejamento ativo e não poderá receber novos eventos." confirmLabel="Confirmar arquivamento" pending={mutation.isPending} onConfirm={() => mutation.mutateAsync(undefined)} />;
  return <div><Button variant="outline" disabled={mutation.isPending} onClick={async () => { if (locked.current) return; locked.current = true; try { await mutation.mutateAsync(undefined); } catch { /* mutation exposes safe feedback */ } finally { locked.current = false; } }}>{label}</Button>{mutation.isError && <Feedback>{mutation.error.message}</Feedback>}</div>;
}
function GoalEventForm({ goal, type, done }: { goal: Goal; type: GoalEventInput['type']; done: () => void }) {
  const { finance } = useServices();
  const mutation = useFinanceMutation((input: GoalEventInput) => finance.addGoalEvent(goal.id, input));
  const retry = useRef<{ fingerprint: string; payload: GoalEventInput } | null>(null);
  return <FinanceForm reset={false} button={type === 'CONTRIBUTION' ? 'Registrar contribuição' : 'Registrar retirada'} submit={async data => {
    const body = { type, amountMinor: parseMoney(value(data, 'amount'), goal.currency), occurredAt: toInstant(value(data, 'occurredAt'), goal.timeZone), note: value(data, 'note').trim() || null };
    if (type === 'WITHDRAWAL' && BigInt(body.amountMinor) > BigInt(goal.currentAmountMinor)) throw new Error('A retirada não pode superar o acumulado da meta.');
    const fingerprint = JSON.stringify(body);
    if (retry.current?.fingerprint !== fingerprint) retry.current = { fingerprint, payload: GoalEventInputSchema.parse({ ...body, idempotencyKey: crypto.randomUUID() }) };
    await mutation.mutateAsync(retry.current.payload);
    retry.current = null; done();
  }}><Field label={'Valor em ' + goal.currency} name="amount" required inputMode="decimal" /><Field label="Data e hora" name="occurredAt" required type="datetime-local" defaultValue={localDateTime(new Date().toISOString(), goal.timeZone)} /><Field label="Nota opcional" name="note" maxLength={1000} /><p>Corrija registros com um novo evento compensatório. O histórico não é editado.</p></FinanceForm>;
}
function GoalHistory({ goal, locale }: { goal: Goal; locale: string }) {
  const history = useGoalEvents(goal.id);
  return <section aria-labelledby="goal-history-title"><h2 id="goal-history-title">Histórico da meta</h2>{history.isPending ? <p role="status">Carregando histórico…</p> : history.isError ? <Feedback>Não foi possível carregar o histórico.</Feedback> : <>{!history.data.pages[0]!.items.length ? <p>Nenhuma contribuição ou retirada registrada.</p> : <ol className="goal-history">{history.data.pages.flatMap(p => p.items).map(event => <li key={event.id}><div><strong>{event.type === 'CONTRIBUTION' ? 'Contribuição' : 'Retirada'}</strong><time dateTime={event.occurredAt}>{displayDate(event.occurredAt, goal.timeZone, locale)}</time>{event.note && <p>{event.note}</p>}</div><span>{event.type === 'WITHDRAWAL' ? '−' : '+'}{formatMoney(event.amountMinor, event.currency, locale)}</span></li>)}</ol>}{history.hasNextPage && <Button disabled={history.isFetchingNextPage} onClick={() => { void history.fetchNextPage(); }}>Carregar mais eventos</Button>}</>}</section>;
}
function GoalDetail({ id }: { id: string }) {
  const result = useGoal(id);
  const me = useMe();
  const locale = me.data?.profile?.locale ?? 'pt-BR';
  const [panel, setPanel] = useState<'edit' | 'CONTRIBUTION' | 'WITHDRAWAL' | null>(null);
  if (result.isPending) return <p role="status">Carregando meta…</p>;
  if (result.isError) return <Feedback>{result.error.message}</Feedback>;
  const goal = result.data;
  return <><div className="page-intro"><h1 tabIndex={-1}>{goal.name}</h1>{goal.description && <p>{goal.description}</p>}</div><PlanningNote /><Card><div className="goal-card-head"><p>{goalStatusLabels[goal.status]} · Prioridade {goalPriorityLabels[goal.priority].toLowerCase()} · {goal.currency}</p><PlanLabel goal={goal} /></div><GoalNumbers goal={goal} locale={locale} /></Card>
    {goal.status !== 'ARCHIVED' ? <><div className="goal-actions">{goal.status === 'ACTIVE' && <><Button onClick={() => setPanel('CONTRIBUTION')}>Adicionar valor</Button><Button variant="outline" onClick={() => setPanel('WITHDRAWAL')}>Retirar valor</Button></>}<Button variant="outline" onClick={() => setPanel('edit')}>Editar meta</Button><GoalAction goal={goal} status={goal.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'} label={goal.status === 'ACTIVE' ? 'Pausar meta' : 'Retomar meta'} /><GoalAction goal={goal} status="ARCHIVED" label="Arquivar meta" /></div>{goal.status === 'PAUSED' && <p>Meta pausada: retome para registrar contribuições ou retiradas.</p>}
      {panel && (panel === 'edit' || goal.status === 'ACTIVE') && <Card className="goal-editor"><div className="goal-card-head"><h2>{panel === 'edit' ? 'Editar meta' : panel === 'CONTRIBUTION' ? 'Adicionar valor à meta' : 'Retirar valor da meta'}</h2><Button variant="ghost" onClick={() => setPanel(null)}>Cancelar</Button></div>{panel === 'edit' ? <GoalEditor existing={goal} onCancel={() => setPanel(null)} done={() => setPanel(null)} /> : <GoalEventForm key={panel} goal={goal} type={panel} done={() => setPanel(null)} />}</Card>}
    </> : <p>Meta arquivada. Seu progresso e histórico continuam disponíveis; novos eventos estão bloqueados.</p>}
    <GoalHistory goal={goal} locale={locale} />
  </>;
}
export function GoalDetailPage() {
  const { goalId } = useParams();
  return <><Link className="goal-back" to="/finance/goals">← Todas as metas</Link>{z.uuid().safeParse(goalId).success ? <GoalDetail key={goalId} id={goalId!} /> : <Feedback>Esta meta não está disponível.</Feedback>}</>;
}
