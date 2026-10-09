import { Input } from '../../components/ui/input';
import { useId,useRef,useState } from 'react';
import { Button } from '../../components/ui/button';
import { Feedback } from '../../components/feedback';
import { FormSection } from '../../components/ui/form-section';
import { useServices } from '../../hooks/use-services';
import { useFinanceMutation } from './hooks';
import { parseMoney } from './money';
import { validCivilDate } from './recurrence-view';
import { addYieldDays,decimalPercent,yieldRulePayload,yieldCapInput } from './yield-view';
import { YieldRuleInputSchema,type Account,type YieldProfile,type YieldRuleInput } from './contracts.generated';
export function YieldEditor({accounts,profile,today,onClose}:{accounts:Account[];profile:YieldProfile|null;today:string;onClose:()=>void}){
 const {finance}=useServices(),id=useId(),lock=useRef(false),latest=profile?.rules.at(-1);
 const [accountId,setAccountId]=useState(profile?.accountId??accounts[0]?.id??''),[type,setType]=useState<'ZERO'|'CDI'|'SELIC'|'FIXED_RATE'|'SAVINGS_BR'>(latest?.ruleType==='BENCHMARK_PERCENTAGE'?latest.benchmark!:latest?.ruleType??'FIXED_RATE');
 const [date,setDate]=useState(latest?addYieldDays(latest.effectiveFrom>=today?latest.effectiveFrom:today,1):today),[rate,setRate]=useState(decimalPercent(latest?.fixedRate??latest?.benchmarkPercentage??'0.10')),[period,setPeriod]=useState<'ANNUAL'|'MONTHLY'>(latest?.ratePeriod??'ANNUAL'),[calendar,setCalendar]=useState<'CALENDAR_365'|'BUSINESS_252'>(latest?.dayCountConvention==='BUSINESS_252'?'BUSINESS_252':'CALENDAR_365'),[tax,setTax]=useState<YieldRuleInput['taxTreatment']>(latest?.taxTreatment??'NONE'),[delay,setDelay]=useState(String(latest?.eligibilityDelayDays??0)),[cap,setCap]=useState(yieldCapInput(latest?.eligibleBalanceCapMinor,profile?.currency??accounts[0]?.currency??'BRL')),[taxDate,setTaxDate]=useState(latest?.taxReferenceDate??''),[error,setError]=useState('');
 const account=accounts.find(a=>a.id===accountId),benchmark=type==='CDI'||type==='SELIC',fixed=type==='FIXED_RATE';
 const save=useFinanceMutation<YieldRuleInput>(input=>finance.saveYieldRule(accountId,input,!profile));
 async function submit(e:React.FormEvent){e.preventDefault();if(lock.current)return;lock.current=true;setError('');try{
  if(!account||!account.isActive)throw Error('Selecione uma conta ativa.');
  if(!validCivilDate(date)||date>'9988-12-31'||(latest&&(date<=latest.effectiveFrom||date<today)))throw Error('A nova versão precisa começar depois da última versão, sem alterar dias anteriores a hoje.');
  if(taxDate&&(!validCivilDate(taxDate)||taxDate>date))throw Error('A referência tributária deve ser válida e não posterior ao início da regra.');
  const payload=YieldRuleInputSchema.parse(yieldRulePayload({type,date,rate,period,calendar,tax:account.currency==='BRL'?tax:'NONE',delay,capMinor:cap?parseMoney(cap,account.currency):null,taxDate}));
  await save.mutateAsync(payload);onClose();
 }catch(err){setError(err instanceof Error&&err.name!=='ZodError'?err.message:'Confira os campos, limites e a taxa informada.');}finally{lock.current=false;}}
 const field=(name:string,label:string,node:React.ReactNode)=><div className="finance-field"><label htmlFor={id+name}>{label}</label>{node}</div>;
 return <section className="finance-panel"><h2>{profile?'Nova versão de rendimento':'Configurar rendimento'}</h2><form className="recurrence-form" onSubmit={submit}>
 <FormSection title="Conta e regra">{field('account','Conta do rendimento',<select id={id+'account'} className="finance-select" value={accountId} disabled={!!profile} onChange={e=>{setAccountId(e.target.value);setType('FIXED_RATE');setTax('NONE');}}>{accounts.map(a=><option key={a.id} value={a.id}>{a.name} · {a.currency}</option>)}</select>)}
 {field('type','Tipo de rendimento',<select id={id+'type'} className="finance-select" value={type} onChange={e=>{const t=e.target.value as typeof type;setType(t);setRate(t==='CDI'||t==='SELIC'?'100':'10');setTax('NONE');}}><option value="ZERO">Sem rendimento</option><option value="FIXED_RATE">Taxa fixa</option>{account?.currency==='BRL'&&<><option value="CDI">CDI</option><option value="SELIC">Selic Over</option><option value="SAVINGS_BR">Poupança brasileira</option></>}</select>)}
 {field('date','Início de vigência',<Input id={id+'date'} className="finance-select" type="date" value={date} onChange={e=>setDate(e.target.value)} min={latest?addYieldDays(latest.effectiveFrom>=today?latest.effectiveFrom:today,1):'1000-01-01'} max="9988-12-31" required/>)}
 {(benchmark||fixed)&&field('rate',benchmark?'Percentual do benchmark (%)':'Taxa efetiva (%)',<input id={id+'rate'} className="finance-select" inputMode="decimal" value={rate} onChange={e=>setRate(e.target.value)} required/>)}
 {fixed&&<>{field('period','Período da taxa',<select id={id+'period'} className="finance-select" value={period} onChange={e=>setPeriod(e.target.value as typeof period)}><option value="ANNUAL">Anual</option><option value="MONTHLY">Mensal</option></select>)}{field('calendar','Convenção de dias',<select id={id+'calendar'} className="finance-select" value={calendar} onChange={e=>setCalendar(e.target.value as typeof calendar)}><option value="CALENDAR_365">Dias corridos · 365</option><option value="BUSINESS_252">Dias úteis · 252</option></select>)}</>}
 </FormSection>{type!=='ZERO'&&<FormSection title="Elegibilidade e tributação">{type==='SAVINGS_BR'?<p className="recurrence-form-note">Rendimento creditado no aniversário, derivado do início da primeira regra. Dias 29, 30 e 31 passam para o dia 1 do mês seguinte. Usa o menor saldo real do período. Isenta para pessoa física.</p>:account?.currency==='BRL'?field('tax','Estimativa de impostos',<select id={id+'tax'} className="finance-select" value={tax==='BR_SAVINGS_EXEMPT'?'NONE':tax} onChange={e=>setTax(e.target.value as typeof tax)}><option value="NONE">Sem cálculo tributário</option><option value="BR_FIXED_INCOME_STANDARD">Renda fixa brasileira · IR/IOF</option></select>):null}
 <>{field('delay','Carência em dias',<input id={id+'delay'} className="finance-select" type="number" min="0" max="3650" step="1" value={delay} onChange={e=>setDelay(e.target.value)}/>)}{field('cap','Limite elegível opcional',<input id={id+'cap'} className="finance-select" inputMode="decimal" value={cap} onChange={e=>setCap(e.target.value)} placeholder={'Valor em '+(account?.currency??'BRL')}/>)}{tax==='BR_FIXED_INCOME_STANDARD'&&field('taxDate','Data de referência tributária opcional',<Input id={id+'taxDate'} className="finance-select" type="date" value={taxDate} max={date} onChange={e=>setTaxDate(e.target.value)}/>)}</>
 </FormSection>}<p className="recurrence-form-note">Estimativa — não altera seu saldo. Acima do limite elegível não há rendimento. Não há cálculo por lotes; sem data tributária, usa o início da primeira regra. Novas versões preservam o histórico e não podem compartilhar a mesma data de início.</p>
 <div className="ui-form-actions"><Button type="button" variant="outline" disabled={save.isPending} onClick={onClose}>Cancelar</Button><Button type="submit" disabled={save.isPending}>{save.isPending?'Salvando…':profile?'Salvar nova versão':'Salvar rendimento'}</Button></div><div className="ui-form-feedback" aria-live="polite">{error&&<Feedback>{error}</Feedback>}</div>
 </form></section>;
}
