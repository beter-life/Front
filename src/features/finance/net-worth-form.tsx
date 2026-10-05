import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../components/ui/button';
import { Feedback } from '../../components/feedback';
import { useServices } from '../../hooks/use-services';
import { useFinanceMutation } from './hooks';
import { parseMoney } from './money';
import { validCivilDate } from './recurrence-view';
import { CurrencySchema,NetWorthKindSchema,NetWorthCategorySchema,currencyDigits } from './contracts.generated';
import type { NetWorthItem,NetWorthItemInput,NetWorthItemPatch,NetWorthValuationInput } from './contracts.generated';
import { netWorthCategories,netWorthLabels } from './net-worth-view';
export function NetWorthEditor({item,mode,today,onClose}:{item:NetWorthItem|null;mode:'create'|'edit'|'valuation';today:string;onClose:()=>void}) {
 const {finance}=useServices(),id=useId(),isValuation=mode==='valuation',isEdit=mode==='edit';
 const schema=z.object({name:z.string(),description:z.string().max(1000),kind:NetWorthKindSchema,category:NetWorthCategorySchema,currency:CurrencySchema,amount:z.string(),date:z.string(),note:z.string().max(1000)}).superRefine((v,ctx)=>{
  const error=(path:keyof typeof v,message:string)=>ctx.addIssue({code:'custom',path:[path],message});
  if(!isValuation){if(!v.name.trim()||v.name.trim().length>100)error('name','Informe um nome de até 100 caracteres.');if(!(netWorthCategories[v.kind] as readonly string[]).includes(v.category))error('category','Categoria incompatível com o tipo.');}
  if(!isEdit){try{if(BigInt(parseMoney(v.amount,v.currency,!isValuation))<0n)throw Error('Não use valores negativos.');}catch(e){error('amount',(e as Error).message);}if(!validCivilDate(v.date)||v.date>today)error('date','Use uma data válida, até hoje.');}
 });
 type Values=z.infer<typeof schema>;
 const {register,handleSubmit,watch,setValue,formState:{errors,isSubmitting}}=useForm<Values>({resolver:zodResolver(schema),defaultValues:{name:item?.name??'',description:item?.description??'',kind:item?.kind??'ASSET',category:item?.category??'VEHICLE',currency:item?.currency??'BRL',amount:'',date:today,note:''}});
 const kind=watch('kind'),currency=watch('currency');
 const mutation=useFinanceMutation<NetWorthItemInput|NetWorthItemPatch|NetWorthValuationInput>(input=>isEdit?finance.patchNetWorthItem(item!.id,input as NetWorthItemPatch):isValuation?finance.addNetWorthValuation(item!.id,input as NetWorthValuationInput):finance.createNetWorthItem(input as NetWorthItemInput));
 const submit=handleSubmit(async v=>{try{await mutation.mutateAsync(isEdit?{name:v.name.trim(),description:v.description.trim()||null,category:v.category}:isValuation?{valueMinor:parseMoney(v.amount,v.currency,false),valuationDate:v.date,note:v.note.trim()||null}:{name:v.name.trim(),description:v.description.trim()||null,kind:v.kind,category:v.category,currency:v.currency,initialValueMinor:parseMoney(v.amount,v.currency),valuationDate:v.date,valuationNote:v.note.trim()||null});onClose();}catch{/* Safe API feedback below. */}});
 const field=(key:keyof Values,label:string,node:React.ReactNode)=><div className="finance-field"><label htmlFor={id+key}>{label}</label>{node}{errors[key]&&<p role="alert" id={id+key+'-error'}>{errors[key]?.message}</p>}</div>;
 const props=(key:keyof Values)=>({id:id+key,...register(key),'aria-invalid':!!errors[key],'aria-describedby':errors[key]?id+key+'-error':undefined,className:'finance-select'});
 const busy=mutation.isPending||isSubmitting;
 return <section className="finance-panel" aria-labelledby={id+'heading'}><h2 id={id+'heading'}>{isEdit?'Editar dados':isValuation?'Nova avaliação':'Novo item patrimonial'}</h2><form onSubmit={submit} className="recurrence-form" noValidate>
 {!isValuation&&<>{field('kind','Tipo do item',<select {...props('kind')} disabled={isEdit} onChange={e=>{const k=e.target.value as Values['kind'];setValue('kind',k);setValue('category',netWorthCategories[k][0]);}}><option value="ASSET">Ativo</option><option value="LIABILITY">Passivo</option></select>)}{field('name','Nome',<input {...props('name')} maxLength={100}/>)}{field('category','Categoria do item',<select {...props('category')}>{netWorthCategories[kind].map(c=><option key={c} value={c}>{netWorthLabels[c]}</option>)}</select>)}{field('description','Descrição opcional',<input {...props('description')} maxLength={1000}/>)}</>}
 {!isEdit&&<>{field('currency','Moeda do item',<select {...props('currency')} disabled={isValuation}>{Object.keys(currencyDigits).map(c=><option key={c}>{c}</option>)}</select>)}{field('amount',`Valor em ${currency}`,<input {...props('amount')} inputMode="decimal"/>)}{field('date','Data da avaliação',<input {...props('date')} type="date" max={today} min="1000-01-01"/>)}{field('note','Nota opcional',<input {...props('note')} maxLength={1000}/>)}</>}
 <p className="recurrence-form-note">Evite cadastrar novamente valores que já estejam representados em suas contas. Avaliações são manuais; não há câmbio ou valorização automática.</p>
 {mutation.isError&&<Feedback>{(mutation.error as Error).message}</Feedback>}<div className="finance-actions"><Button disabled={busy} type="submit">{busy?'Salvando…':isEdit?'Salvar dados':isValuation?'Salvar avaliação':'Cadastrar item'}</Button><Button variant="outline" type="button" onClick={onClose} disabled={busy}>Cancelar</Button></div>
 </form></section>;
}
