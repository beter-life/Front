import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Feedback } from '../../components/feedback';
import { FormSection } from '../../components/ui/form-section';
import { useServices } from '../../hooks/use-services';
import { useFinanceMutation } from './hooks';
import { parseMoney } from './money';
import { budgetAmountInput } from './budget-view';
import { CurrencySchema, RecurrenceTypeSchema, RecurrenceKindSchema, RecurrenceFrequencySchema, RecurrenceInputSchema, RecurrencePatchSchema, currencyDigits } from './contracts.generated';
import type { Account, Category, Recurrence, RecurrenceInput, RecurrencePatch } from './contracts.generated';
import { intervalLimits, frequencyLabels, validCivilDate } from './recurrence-view';
export function RecurrenceEditor({row,accounts,categories,onSaved,onCancel}:{row:Recurrence|null;accounts:Account[];categories:Category[];onSaved:()=>void;onCancel:()=>void}) {
  const {finance}=useServices(), id=useId();
  const schema=z.object({name:z.string().trim().min(1,'Informe o nome.').max(100),description:z.string().max(1000),transactionType:RecurrenceTypeSchema,recurrenceKind:RecurrenceKindSchema,amount:z.string().min(1,'Informe o valor.'),currency:CurrencySchema,accountId:z.string(),categoryId:z.string(),frequency:RecurrenceFrequencySchema,intervalCount:z.string(),startDate:z.string(),endDate:z.string()}).superRefine((v,ctx)=>{
    const issue=(path:keyof typeof v,message:string)=>ctx.addIssue({code:'custom',path:[path],message});
    try{parseMoney(v.amount,v.currency);}catch(e){issue('amount',(e as Error).message);}
    if(v.recurrenceKind==='SUBSCRIPTION'&&v.transactionType!=='EXPENSE')issue('transactionType','Assinaturas são despesas.');
    if(!/^\d+$/.test(v.intervalCount)||Number(v.intervalCount)<1||Number(v.intervalCount)>intervalLimits[v.frequency])issue('intervalCount',`Use um intervalo de 1 a ${intervalLimits[v.frequency]}.`);
    if(!validCivilDate(v.startDate))issue('startDate','Informe uma data inicial válida.');
    if(v.endDate&&(!validCivilDate(v.endDate)||v.endDate<v.startDate))issue('endDate','A data final deve ser válida e igual ou posterior à inicial.');
    const account=accounts.find(a=>a.id===v.accountId),category=categories.find(c=>c.id===v.categoryId);
    if(v.accountId&&(!account||account.currency!==v.currency||(!account.isActive&&row?.accountId!==account.id)))issue('accountId','Selecione uma conta ativa na mesma moeda.');
    if(v.categoryId&&(!category||category.kind!==v.transactionType||(!category.isActive&&row?.categoryId!==category.id)))issue('categoryId','Selecione uma categoria ativa do mesmo tipo.');
  });
  type Values=z.infer<typeof schema>;
  const {register,handleSubmit,watch,setValue,formState:{errors}}=useForm<Values>({resolver:zodResolver(schema),defaultValues:{name:row?.name??'',description:row?.description??'',transactionType:row?.transactionType??'EXPENSE',recurrenceKind:row?.recurrenceKind??'STANDARD',amount:row?budgetAmountInput(row.amountMinor,row.currency):'',currency:row?.currency??'BRL',accountId:row?.accountId??'',categoryId:row?.categoryId??'',frequency:row?.frequency??'MONTHLY',intervalCount:String(row?.intervalCount??1),startDate:row?.startDate??'',endDate:row?.endDate??''}});
  const currency=watch('currency'),type=watch('transactionType'),kind=watch('recurrenceKind'),frequency=watch('frequency');
  const mutation=useFinanceMutation<RecurrenceInput|RecurrencePatch>(input=>row?finance.patchRecurrence(row.id,RecurrencePatchSchema.parse(input)):finance.createRecurrence(RecurrenceInputSchema.parse(input)));
  const submit=handleSubmit(async values=>{const input={name:values.name.trim(),description:values.description.trim()||null,recurrenceKind:values.recurrenceKind,amountMinor:parseMoney(values.amount,values.currency),accountId:values.accountId||null,categoryId:values.categoryId||null,frequency:values.frequency,intervalCount:Number(values.intervalCount),startDate:values.startDate,endDate:values.endDate||null};try{await mutation.mutateAsync(row?RecurrencePatchSchema.parse(input):RecurrenceInputSchema.parse({...input,currency:values.currency,transactionType:values.transactionType}));onSaved();}catch{/* Mutation feedback stays with the form. */}});
  const field=(key:keyof Values,label:string,control:React.ReactNode)=> <div className="finance-field"><label htmlFor={id+'-'+key}>{label}</label>{control}{errors[key]&&<p id={id+'-'+key+'-error'} className="recurrence-field-error" role="alert">{errors[key]?.message}</p>}</div>;
  const props=(key:keyof Values)=>({id:id+'-'+key,'aria-invalid':!!errors[key],'aria-describedby':errors[key]?id+'-'+key+'-error':undefined,...register(key)});
  return <section className="finance-panel recurrence-editor" aria-labelledby={id+'-heading'}><h2 id={id+'-heading'}>{row?'Editar recorrência':'Nova recorrência'}</h2><p>Cadastre uma expectativa. Nenhum lançamento será criado automaticamente.</p><form className="recurrence-form" onSubmit={submit} noValidate>
    <FormSection title="Identificação e classificação">{field('name','Nome',<input {...props('name')} className="finance-select" maxLength={100}/>)}
    {field('description','Descrição opcional',<input {...props('description')} className="finance-select" maxLength={1000}/>)}
    {field('recurrenceKind','Classificação',<select {...props('recurrenceKind')} className="finance-select" onChange={e=>{setValue('recurrenceKind',e.target.value as Values['recurrenceKind']);if(e.target.value==='SUBSCRIPTION'){setValue('transactionType','EXPENSE');if(type!=='EXPENSE')setValue('categoryId','');}}}><option value="STANDARD">Recorrência</option><option value="SUBSCRIPTION">Assinatura</option></select>)}
    {field('transactionType','Tipo',<select {...props('transactionType')} className="finance-select" disabled={!!row||kind==='SUBSCRIPTION'} onChange={e=>{setValue('transactionType',e.target.value as Values['transactionType']);setValue('categoryId','');}}><option value="EXPENSE">Despesa</option><option value="INCOME">Receita</option></select>)}
    </FormSection><FormSection title="Valor e vínculos">
    {field('currency','Moeda',<select {...props('currency')} className="finance-select" disabled={!!row} onChange={e=>{setValue('currency',e.target.value as Values['currency']);setValue('accountId','');}}>{Object.keys(currencyDigits).map(c=><option key={c}>{c}</option>)}</select>)}
    {field('amount',`Valor em ${currency}`,<input {...props('amount')} className="finance-select" inputMode="decimal"/>)}
    {field('accountId','Conta opcional',<select {...props('accountId')} className="finance-select"><option value="">Sem conta vinculada</option>{accounts.filter(a=>a.currency===currency&&(a.isActive||a.id===row?.accountId)).map(a=><option key={a.id} value={a.id}>{a.name}{a.isActive?'':' · inativa'}</option>)}</select>)}
    {field('categoryId','Categoria opcional',<select {...props('categoryId')} className="finance-select"><option value="">Sem categoria vinculada</option>{categories.filter(c=>c.kind===type&&(c.isActive||c.id===row?.categoryId)).map(c=><option key={c.id} value={c.id}>{c.name}{c.isActive?'':' · inativa'}</option>)}</select>)}
    </FormSection><FormSection title="Periodicidade e vigência">
    {field('frequency','Frequência',<select {...props('frequency')} className="finance-select">{Object.entries(frequencyLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select>)}
    {field('intervalCount','Intervalo',<input {...props('intervalCount')} className="finance-select" type="number" min={1} max={intervalLimits[frequency]}/>)}
    {field('startDate','Data inicial',<input {...props('startDate')} className="finance-select" type="date" min="1000-01-01" max="9998-12-31"/>)}
    {field('endDate','Data final opcional',<input {...props('endDate')} className="finance-select" type="date" min="1000-01-01" max="9998-12-31"/>)}
    </FormSection>
    <p className="recurrence-form-note">Tipo e moeda permanecem fixos após a criação. Editar a regra atualiza suas projeções; lançamentos confirmados permanecem como foram registrados.</p>
    <div className="ui-form-actions"><Button type="button" variant="outline" onClick={onCancel} disabled={mutation.isPending}>Cancelar</Button><Button type="submit" disabled={mutation.isPending}>{mutation.isPending?'Salvando…':row?'Salvar alterações':'Cadastrar recorrência'}</Button></div><div className="ui-form-feedback" aria-live="polite">{mutation.isError&&<Feedback>{(mutation.error as Error).message}</Feedback>}</div>
  </form></section>;
}
