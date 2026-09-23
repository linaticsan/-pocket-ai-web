const q=id=>document.getElementById(id);
const MAX=20*1024*1024,MAX_PDF_PAGES=120,MAX_CHARS=180000;
const TEXT_EXT=new Set(['txt','md','csv','json','html','htm','xml','js','mjs','ts','tsx','jsx','css','py','java','c','cpp','h','hpp','go','rs','sh','yaml','yml','toml','ini','log']);
const ext=(name='')=>name.split('.').pop().toLowerCase();
const decodeXML=s=>s.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
function cleanXML(xml){return decodeXML(xml.replace(/<w:tab\/?\s*>/g,'\t').replace(/<w:br\/?\s*>/g,'\n').replace(/<a:br\/?\s*>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<\/a:p>/g,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' ').replace(/\n\s+/g,'\n')).trim()}
function pagePlan(total,max=MAX_PDF_PAGES){
 if(total<=max)return Array.from({length:total},(_,i)=>i+1);
 const set=new Set();for(let i=1;i<=45;i++)set.add(i);for(let i=Math.max(46,total-19);i<=total;i++)set.add(i);
 const slots=max-set.size,start=46,end=Math.max(start,total-20);
 for(let i=0;i<slots;i++)set.add(Math.round(start+(end-start)*(i/Math.max(1,slots-1))));
 return [...set].sort((a,b)=>a-b).slice(0,max)
}
async function pdfText(file){
 const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs');
 pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
 const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise,plan=pagePlan(pdf.numPages);let out='',read=0,truncated=false;
 for(const i of plan){const p=await pdf.getPage(i),tc=await p.getTextContent(),t=tc.items.map(x=>x.str).join(' ').trim();if(t)out+='\n\n[Page '+i+']\n'+t;read++;if(out.length>MAX_CHARS){truncated=true;break}}
 if(out.trim().length<20)throw Error(file.name+': this PDF appears to be scanned/image-only. Pocket AI found no selectable text. OCR is not enabled yet, so the app will not pretend it read the document.');
 const sampled=pdf.numPages>plan.length;
 const note=(sampled||truncated)?'[Pocket AI document preview: '+read+' of '+pdf.numPages+' pages '+(sampled?'sampled across the whole PDF':'read')+(truncated?'; text limit reached':'')+'.]\n':'';
 return note+out.trim()
}
function sharedStrings(xml){return [...xml.matchAll(/<si[\s\S]*?<\/si>/g)].map(m=>decodeXML([...m[0].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map(x=>x[1]).join('')))}
function xlsxSheet(xml,shared){const rows=[];for(const row of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)){const vals=[];for(const c of row[1].matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)){const attrs=c[1],body=c[2],v=(body.match(/<v>([\s\S]*?)<\/v>/)||[])[1]??'',inline=(body.match(/<t[^>]*>([\s\S]*?)<\/t>/)||[])[1];vals.push(/t="s"/.test(attrs)?(shared[Number(v)]??v):decodeXML(inline??v))}if(vals.some(Boolean))rows.push(vals.join('\t'))}return rows.join('\n')}
async function officeText(file,type){
 const JSZip=(await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default,zip=await JSZip.loadAsync(await file.arrayBuffer());let paths=[],shared=[];
 if(type==='docx')paths=Object.keys(zip.files).filter(p=>/^word\/(document|header\d*|footer\d*)\.xml$/.test(p));
 else if(type==='pptx')paths=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a,b)=>(+a.match(/\d+/)?.[0]||0)-(+b.match(/\d+/)?.[0]||0));
 else if(type==='xlsx'){paths=Object.keys(zip.files).filter(p=>/^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort();const ss=zip.file('xl/sharedStrings.xml');if(ss)shared=sharedStrings(await ss.async('text'))}
 let out='',read=0,truncated=false;
 for(let i=0;i<paths.length;i++){const xml=await zip.file(paths[i]).async('text'),t=type==='xlsx'?xlsxSheet(xml,shared):cleanXML(xml);out+='\n\n['+(type==='pptx'?'Slide ':type==='xlsx'?'Sheet ':'Section ')+(i+1)+']\n'+t;read++;if(out.length>MAX_CHARS){truncated=true;break}}
 if(!out.trim())throw Error(file.name+': no readable text was found.');
 return (truncated?'[Pocket AI preview: large document text was limited for mobile stability.]\n':'')+out.trim()
}
async function readOne(file){
 if(file.size>MAX)throw Error(file.name+' is larger than 20 MB.');
 const e=ext(file.name);if(TEXT_EXT.has(e)||file.type.startsWith('text/'))return (await file.text()).slice(0,MAX_CHARS);
 if(e==='pdf')return await pdfText(file);if(['docx','pptx','xlsx'].includes(e))return await officeText(file,e);
 if(['doc','ppt','xls'].includes(e))throw Error(file.name+': old .'+e+' format is not readable yet. Save it as '+(e==='doc'?'.docx':e==='ppt'?'.pptx':'.xlsx')+' first.');
 throw Error(file.name+': unsupported file type.')
}
function iconFor(e){return e==='pdf'?'📕':e==='docx'?'📘':e==='pptx'?'📙':e==='xlsx'?'📗':TEXT_EXT.has(e)?'📝':'📄'}
function enhance(){
 const panel=q('files'),input=q('fileInput');if(!panel||!input||q('fileTypeStrip'))return;
 input.accept='.pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.json,.html,.xml,.js,.mjs,.ts,.tsx,.jsx,.css,.py,.java,.c,.cpp,.h,.hpp,.go,.rs,.sh,.yaml,.yml,.toml,.ini,.log,text/*,application/pdf';input.multiple=true;
 const picker=input.closest('.picker');if(picker){picker.childNodes[0].textContent='Choose documents';const intro=document.createElement('div');intro.id='fileTypeStrip';intro.className='file-type-strip';intro.innerHTML='<span>📕 PDF</span><span>📘 Word</span><span>📙 PowerPoint</span><span>📗 Excel</span><span>📝 Text & code</span>';picker.before(intro)}
 const h=panel.querySelector('h1');if(h)h.textContent='Your document workspace.';const muted=h?.nextElementSibling;if(muted?.classList.contains('muted'))muted.textContent='Open PDF, Word, PowerPoint, Excel, text and code locally. Long PDFs are sampled across the whole document instead of silently reading only the beginning.';
 input.onchange=async()=>{const files=[...input.files].slice(0,5);if(!files.length)return;panel.classList.add('is-reading');q('fileStatus').textContent='Reading '+files.length+' document'+(files.length>1?'s':'')+'…';const parts=[],errors=[];
  for(const f of files){try{const t=await readOne(f);parts.push((files.length>1?'===== '+iconFor(ext(f.name))+' '+f.name+' =====\n':'')+t)}catch(e){errors.push(e.message)}}
  if(parts.length){q('fileText').value=parts.join('\n\n');q('fileName').value=files.length===1?files[0].name.replace(/\.(pdf|docx|pptx|xlsx)$/i,'.txt'):'combined-documents.txt';q('fileText').dispatchEvent(new Event('input'));q('fileStatus').textContent=(files.length===1?'Opened '+files[0].name:'Combined '+parts.length+' documents')+' locally.'+(errors.length?' '+errors.join(' '):'');window.PocketProgression?.recordAction?.('file')}
  else q('fileStatus').textContent=errors.join(' ')||'Could not read the selected file.';panel.classList.remove('is-reading');input.value=''};
 const intelligence=q('v3DocTools');if(intelligence){const small=intelligence.querySelector('small');if(small)small.textContent='Summarize, explain or quiz the PDF / Word / PowerPoint / Excel / text currently open above.'}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
window.PocketFiles={readOne,pagePlan,version:'32'};
