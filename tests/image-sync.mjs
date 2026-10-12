// 使用專用 Vite env 與兩個獨立 browser contexts；所有雲端請求由測試攔截。
// VITE_SUPABASE_URL=http://127.0.0.1:5186 VITE_SUPABASE_ANON_KEY=public-test-key npm run dev -- --host 127.0.0.1 --port 5186 --strictPort
// node tests/image-sync.mjs
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const base=process.env.PAGES_TEST_URL || 'http://127.0.0.1:5186';
const browser=await chromium.launch({headless:true});
const rows=new Map(),storage=new Map(),requests=[],errors=[],passed=[];storage.set('test-user/invalid.jpg',Buffer.from('invalid-image'));
const id='test-note',key=`note-img-${id}`,path=`test-user/${id}.jpg`;
const strokes=[[{x:.2,y:.5},{x:.8,y:.5}]];
async function createDevice(){
 const context=await browser.newContext();const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/storage/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),name=decodeURIComponent(url.pathname.split('/note-images/')[1]||'');requests.push({method:req.method(),name});
  if(name.includes('network'))return route.abort('failed');
  if(req.method()==='POST'){
   const data=req.postDataBuffer(),boundary=req.headers()['content-type'].split('boundary=')[1];
   const fileHeader=data.indexOf(Buffer.from('filename='));
   const start=data.indexOf(Buffer.from('\r\n\r\n'),fileHeader)+4,end=data.indexOf(Buffer.from(`\r\n--${boundary}`),start);
   storage.set(name,data.subarray(start,end));return route.fulfill({json:{Key:`note-images/${name}`}});
  }
  return storage.has(name)?route.fulfill({contentType:'image/jpeg',body:storage.get(name)}):route.fulfill({status:404,json:{message:'Not found',statusCode:'404'}});
 });
 await context.route('**/rest/v1/**',async route=>{
  const req=route.request(),url=new URL(req.url()),noteId=(url.searchParams.get('id')||'').replace('eq.','');
  if(url.pathname.endsWith('/books'))return route.fulfill({json:{id:'test-book',title:'Test Book'}});
  if(req.method()==='POST'){
   const row={...req.postDataJSON(),created_at:'2026-10-12T00:00:00Z',updated_at:'2026-10-12T00:00:00Z'};rows.set(row.id,row);return route.fulfill({json:row});
  }
  if(req.method()==='PATCH'){
   const row={...rows.get(noteId),...req.postDataJSON(),updated_at:new Date().toISOString()};rows.set(noteId,row);return route.fulfill({json:row});
  }
  const list=noteId?[rows.get(noteId)].filter(Boolean):[...rows.values()];
  return route.fulfill({json:req.headers().accept?.includes('object+json')?list[0]:list});
 });
 await page.goto(`${base}/tests/image-sync.html`);await page.waitForFunction(()=>window.testApi);return {context,page};
}
async function pixel(page,blobExpression){return page.evaluate(async expression=>{
 const blob=await eval(expression);if(!blob)return null;
 const bitmap=await createImageBitmap(blob),canvas=document.createElement('canvas');canvas.width=bitmap.width;canvas.height=bitmap.height;
 const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0);bitmap.close();return [...ctx.getImageData(100,50,1,1).data];
},blobExpression)}
try {
 const A=await createDevice(),B=await createDevice();
 await A.page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=200;canvas.height=100;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,200,100);
  const blob=await new Promise(r=>canvas.toBlob(r,'image/jpeg'));
  await testApi.images.saveNoteImage('note-img-test-note',blob);
  await testApi.notes.addNote({id:'test-note',bookId:'test-book',content:'keep this text',page:7,imageKey:'note-img-test-note'});
 });
 assert.ok(storage.get(path)?.length);await A.page.evaluate(strokes=>testApi.notes.updateNote('test-note',{strokes}),strokes);
 await A.page.evaluate(async()=>{const n=await testApi.notes.getNoteById('test-note');await testApi.images.saveNoteImage('note-img-display-test-note',await testApi.annotation.getNoteDisplayBlob(n))});
 const ADisplay=await A.page.evaluate(async()=>[...new Uint8Array(await (await testApi.images.getNoteImage('note-img-display-test-note')).arrayBuffer())]);
 const before=JSON.stringify(rows.get(id)),remoteOriginal=Buffer.from(storage.get(path));
 const AHash=await A.page.evaluate(async()=>[...new Uint8Array(await (await testApi.images.getNoteImage('note-img-test-note')).arrayBuffer())]);
 assert.equal(await B.page.evaluate(()=>testApi.images.getNoteImage('note-img-test-note')),undefined);
 await B.page.evaluate(async()=>{window.note=await testApi.notes.getNoteById('test-note');testApi.mountList([note])});
 await B.page.locator('.note-timeline-thumb').waitFor({timeout:5000});assert.equal(await B.page.locator('.note-timeline-content').textContent(),'keep this text');
 assert.equal(requests.filter(r=>r.method==='GET'&&r.name===path).length,1);passed.push('A API upload + remote strokes; independent B downloads and list renders');
 const mark=await pixel(B.page,'testApi.annotation.getNoteDisplayBlob(note)');assert.ok(mark[0]>220&&mark[1]>240&&mark[2]<20);passed.push('B reconstructed normalized yellow stroke verified by pixel');
 await B.page.evaluate(()=>testApi.mountDetail('test-note'));await B.page.locator('.note-detail-image').waitFor();
 await B.page.evaluate(()=>testApi.mountAnnotator(note));await B.page.locator('.annotator-canvas').waitFor({timeout:5000}).catch(async()=>{await B.page.locator('canvas').waitFor()});
 const canvasPixel=await B.page.locator('canvas').evaluate(canvas=>[...canvas.getContext('2d').getImageData(100,50,1,1).data]);assert.ok(canvasPixel[2]<20);passed.push('B detail and annotation editor both restored');
 await B.page.reload();await B.page.waitForFunction(()=>window.testApi);await B.page.evaluate(async()=>{window.note=await testApi.notes.getNoteById('test-note');testApi.mountList([note])});await B.page.locator('.note-timeline-thumb').waitFor();
 assert.equal(requests.filter(r=>r.method==='GET'&&r.name===path).length,1);passed.push('B reload uses persisted original cache without another download');
 const changed={...rows.get(id),strokes:[[{x:.2,y:.2},{x:.8,y:.2}]],updated_at:'2026-10-13T00:00:00Z',image_original:key};
 const clean=await pixel(B.page,`testApi.annotation.getNoteDisplayBlob(${JSON.stringify(changed)})`);assert.ok(clean[2]>240);passed.push('remote stroke changes render on B without a local display cache');
 await B.page.evaluate(async()=>{
  const missing={...note,id:'missing',image_original:'note-img-missing',image_path:'test-user/missing.jpg',content:'missing image text'};
  const network={...note,id:'network',image_original:'note-img-network',image_path:'test-user/network.jpg',content:'network failure text'};
  const bad={...note,id:'invalid',image_original:'note-img-invalid',image_path:'test-user/invalid.jpg',content:'invalid image text'};
  const results=await Promise.all([missing,network,bad].map(n=>testApi.annotation.getNoteDisplayBlob(n)));if(results.some(Boolean))throw Error('failure returned a blob');
  testApi.mountList([note,missing,network,bad]);
 });
 await B.page.locator('.note-timeline-card').nth(3).waitFor();assert.equal(await B.page.locator('.note-timeline-card').count(),4);assert.equal(await B.page.locator('.note-timeline-thumb').count(),1);passed.push('404/network/invalid image isolated; all four text cards survive');
 await B.page.evaluate(async()=>{testApi.setUser('other-user');if(await testApi.annotation.getNoteOriginalBlob(note))throw Error('cross-account image');testApi.setUser('test-user')});passed.push('other account cannot read cached remote original');
 await B.page.evaluate(async()=>{
  let rejected=false;try{await testApi.notes.updateNote('test-note',{resetAnnotation:true,imageKey:'missing-upload'})}catch{rejected=true}if(!rejected)throw Error('missing upload accepted');
 });assert.equal(JSON.stringify(rows.get(id)),before);passed.push('missing upload cannot clear remote image_path or strokes');
 await B.page.evaluate(async()=>{await testApi.notes.updateNote('test-note',{content:'text edit only'})});assert.equal(rows.get(id).image_path,path);assert.deepEqual(rows.get(id).strokes,strokes);rows.set(id,JSON.parse(before));passed.push('text-only edit preserves image and strokes');
 assert.deepEqual(await A.page.evaluate(async()=>[...new Uint8Array(await (await testApi.images.getNoteImage('note-img-display-test-note')).arrayBuffer())]),ADisplay);
 assert.deepEqual(storage.get(path),remoteOriginal);assert.deepEqual(await A.page.evaluate(async()=>[...new Uint8Array(await (await testApi.images.getNoteImage('note-img-test-note')).arrayBuffer())]),AHash);assert.equal(JSON.stringify(rows.get(id)),before);passed.push('A original bytes, remote original, content and strokes unchanged by restore');
 await B.page.evaluate(async()=>{
  const blob=await testApi.images.getNoteImage('note-img-test-note');await testApi.images.restoreNoteImage('note-img-test-note',new Blob(['replacement']));
  const now=await testApi.images.getNoteImage('note-img-test-note');if(now.size!==blob.size)throw Error('overwritten cache');
  await testApi.images.saveNoteImage('legacy-image',blob);await testApi.images.saveNoteImage('note-img-display-legacy',blob);
  if(!(await testApi.annotation.getNoteDisplayBlob({id:'legacy',image_key:'legacy-image'})))throw Error('legacy failed');
 });passed.push('restore is insert-only; legacy image_key and local display cache remain compatible');
 assert.deepEqual(errors,[]);console.log(JSON.stringify({passed,errors,limitation:'Mock cloud, independent browser contexts; not physical cross-device verification'},null,2));
 await A.context.close();await B.context.close();
} finally {await browser.close()}
