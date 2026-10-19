import { describe,expect,it } from 'vitest';
import { importMappingFromForm,validateImportFile,importError,importIssueLabels } from '../../src/features/finance/import-view';
describe('MDL12 explicit file and mapping boundary',()=>{
  it('refuses empty, oversized, unsupported or mismatched files before reading bytes',()=>{
    expect(()=>validateImportFile({name:'synthetic.csv',size:0},'CSV')).toThrow();expect(()=>validateImportFile({name:'synthetic.csv',size:2097153},'CSV')).toThrow();expect(()=>validateImportFile({name:'synthetic.exe',size:10},'CSV')).toThrow();expect(()=>validateImportFile({name:'synthetic.pdf',size:10},'CSV')).toThrow();expect(()=>validateImportFile({name:'synthetic.CSV',size:10},'CSV')).not.toThrow();
  });
  it('requires deliberate date/number formats and rejects duplicate/absent columns',()=>{
    const form=new FormData();form.set('accountId','11111111-1111-4111-8111-111111111111');form.set('date','0');form.set('description','1');form.set('amount','2');
    expect(()=>importMappingFromForm(form,1,'CSV')).toThrow();form.set('dateFormat','DMY');form.set('numberFormat','BR');form.set('amountMode','SIGNED');expect(importMappingFromForm(form,1,'CSV')).toMatchObject({expectedVersion:1,columns:{date:0,description:1,amount:2,type:null,currency:null,externalId:null}});form.set('amount','1');expect(()=>importMappingFromForm(form,1,'CSV')).toThrow();
  });
  it('locks native OFX/PDF semantic columns and translates issues without displaying parser errors',()=>{
    const form=new FormData();form.set('accountId','11111111-1111-4111-8111-111111111111');expect(importMappingFromForm(form,2,'OFX')).toMatchObject({dateFormat:'ISO',numberFormat:'INT',amountMode:'SIGNED',columns:{date:0,description:1,amount:2,type:3,currency:4,externalId:5}});expect(importMappingFromForm(form,2,'PDF').dateFormat).toBe('DMY');expect(importIssueLabels.PDF_NO_TEXT).toContain('OCR');expect(importError(new Error('SENSITIVE_PAYLOAD'))).not.toContain('SENSITIVE_PAYLOAD');
  });
});
