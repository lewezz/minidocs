import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {encodeReply} from 'next/dist/compiled/react-server-dom-webpack/client.node.js';
if(process.env.MINIDOCS_LIVE_TEST!=='1') throw new Error('This test writes verification documents. Set MINIDOCS_LIVE_TEST=1 to opt in.');
const base=process.env.MINIDOCS_TEST_URL??'http://127.0.0.1:3010';
const manifest=JSON.parse(readFileSync('.next/server/server-reference-manifest.json','utf8'));
const actions=Object.fromEntries(Object.entries(manifest.node).map(([id,entry])=>[entry.exportedName,id]));
async function action(name,args,handle,path='/'){
 const body=await encodeReply(args);
 const headers={'Next-Action':actions[name],Origin:base,Cookie:`minidocs-demo-user=${handle}`,Accept:'text/x-component'};
 if(typeof body==='string')headers['Content-Type']='text/plain;charset=UTF-8';
 const response=await fetch(base+path,{method:'POST',headers,body,signal:AbortSignal.timeout(30000)});
 const wire=await response.text();
 assert.equal(response.status,200,`${name}: HTTP ${response.status}`);
 for(const line of wire.split('\n')){
  const colon=line.indexOf(':');
  if(colon<0)continue;
  try{const result=JSON.parse(line.slice(colon+1));if(result&&typeof result.ok==='boolean')return result;}catch{}
 }
 throw new Error(`${name}: no action result in response`);
}
const created=await action('createDocumentAction',[],'alice');
assert.equal(created.ok,true);
const id=created.data.id;
const path=`/documents/${id}`;
const content={type:'doc',content:[{type:'heading',attrs:{level:2},content:[{type:'text',text:'HTTP action verification'}]},{type:'paragraph',content:[{type:'text',text:'Unicode café 日本語',marks:[{type:'bold'},{type:'italic'},{type:'underline'}]}]}]};
assert.equal((await action('saveDocumentAction',[{id,title:'HTTP action verification',content}],'alice',path)).ok,true);
assert.equal((await action('saveDocumentAction',[{id,content}],'bob',path)).ok,false);
assert.equal((await action('shareDocumentAction',[id],'alice',path)).ok,true);
assert.equal((await action('shareDocumentAction',[id],'alice',path)).ok,true);
assert.equal((await action('shareDocumentAction',[id],'bob',path)).ok,false);
assert.equal((await action('saveDocumentAction',[{id,title:'Not allowed',content}],'bob',path)).ok,false);
const changed={type:'doc',content:[...content.content,{type:'paragraph',content:[{type:'text',text:'Bob saved through the server action'}]}]};
assert.equal((await action('saveDocumentAction',[{id,content:changed}],'bob',path)).ok,true);
const form=new FormData();form.set('file',new File(['Café 日本語\n\n<script>literal</script>\n'],'HTTP import.txt',{type:'text/plain'}));
const imported=await action('importTxtAction',[form],'alice');assert.equal(imported.ok,true);
const bad=new FormData();bad.set('file',new File(['bad'],'unsupported.pdf'));
const rejected=await action('importTxtAction',[bad],'alice');assert.equal(rejected.ok,false);assert.equal(rejected.code,'VALIDATION');
const invalidActor=await action('createDocumentAction',[],'admin');assert.equal(invalidActor.ok,false);
const switched=await action('setDemoUserAction',['bob'],'alice');assert.equal(switched.ok,true);
const result={verifiedAt:new Date().toISOString(),transport:'Real HTTP React server actions on production build',browser:false,documentId:id,importedDocumentId:imported.data.id,checks:['create','save formatted JSON','private Bob write denied','share twice idempotently','recipient reshare and rename denied','Bob save','multipart TXT import','unsupported file rejected','tampered actor rejected','demo-user action'],retainedDocuments:true};
writeFileSync('docs/verification/http-actions.json',JSON.stringify(result,null,2)+'\n');
console.log('PASS: real HTTP server actions, cookies, private-write denial, duplicate sharing, Bob edit, UTF-8 multipart import and invalid inputs.');
console.log(JSON.stringify({documentId:id,importedDocumentId:imported.data.id,browser:false}));
