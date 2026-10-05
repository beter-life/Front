export const netWorthLabels={PROPERTY:'Imóvel',VEHICLE:'Veículo',BUSINESS:'Negócio',VALUABLE:'Bem de valor',OTHER:'Outro',MORTGAGE:'Hipoteca',LOAN:'Empréstimo',FINANCING:'Financiamento'};
export const netWorthCategories={ASSET:['PROPERTY','VEHICLE','BUSINESS','VALUABLE','OTHER'],LIABILITY:['MORTGAGE','LOAN','FINANCING','OTHER']} as const;
export function historyStart(month:string) {const n=Number(month.slice(0,4))*12+Number(month.slice(5))-12;return Math.floor(n/12)+'-'+String(n%12+1).padStart(2,'0');}
// Only dimensionless SVG coordinates use Number; money remains exact BigInt/strings.
export function chartCoordinates(values:string[]) {const numbers=values.map(BigInt);if(!numbers.length)return[];const min=numbers.reduce((a,b)=>a<b?a:b),max=numbers.reduce((a,b)=>a>b?a:b),span=max-min||1n;return numbers.map((n,i)=>({x:values.length===1?50:10+80*i/(values.length-1),y:90-Number((n-min)*8000n/span)/100}));}
