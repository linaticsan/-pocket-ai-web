const q=id=>document.getElementById(id);
const MAX=20*1024*1024;
const TEXT_EXT=new Set(['txt','md','csv','json','html','htm','xml','js','mjs','ts','tsx','jsx','css','py','java','c','cpp','h','hpp','go','rs','sh','yaml','yml','toml','ini','log']);
function ext(name=''){return name.split('.').pop().toLowerCase()}
function cleanXML(xml){return xml.replace(/<w:tab\/?\s*>/g,'\t').replace(/<w:br\/?\s*>/g,'\n').replace(/<a:br\/?\s*>/g,'\n').replace(/<\/w:p>/g,'\n').replace(/<\/a:p>/g,'\n').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/[ \t]+/g,' ').replace(/\n\s+/g,'\n').trim()}
async function pdfText(file){
  const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.8.69/build/pdf.worker.min.mjs';
  const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;let out='';
  for(let i=1;i<=Math.min(pdf.numPages,80);i++){const p=await pdf.getPage(i),tc=await p.getTextContent();out+='\n\n[Page '+i+']\n'+tc.items.map(x=>x.str).join(' ');if(out.length>120000)break}
  return out.trim()
}
async function officeText(file,type){
  const JSZip=(await import('https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm')).default;
  const zip=await JSZip.loadAsync(await file.arrayBuffer());let paths=[];
  if(type==='docx')paths=Object.keys(zip.files).filter(p=>/^word\/(document|header\d*|footer\d*)\.xml$/.test(p));
  else if(type==='pptx')paths=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a,b)=>(+a.match(/\d+/)?.[0]||0)-(+b.match(/\d+/)?.[0]||0));
  else if(type==='xlsx')paths=Object.keys(zip.files).filter(p=>/^xl\/worksheets\/sheet\d+\.xml$/.test(p)).sort();
  let out='';
  for(let i=0;i<paths.length;i++){const xml=await zip.file(paths[i]).async('text');out+='\n\n['+(type==='pptx'?'Slide ':type==='xlsx'?'Sheet ':'Section ')+(i+1)+']\n'+cleanXML(xml);if(out.length>120000)break}
  return out.trim()
}
async function readOne(file){
  if(file.size>MAX)throw Error(file.name+' is larger than 20 MB.');
  const e=ext(file.name);
  if(TEXT_EXT.has(e)||file.type.startsWith('text/'))return await file.text();
  if(e==='pdf')return await pdfText(file);
  if(['docx','pptx','xlsx'].includes(e))return await officeText(file,e);
  if(['doc','ppt','xls'].includes(e))throw Error(file.name+': old .'+e+' format is not readable yet. Save it as '+(e==='doc'?'.docx':e==='ppt'?'.pptx':'.xlsx')+' first.');
  throw Error(file.name+': unsupported file type.')
}
function iconFor(e){return e==='pdf'?'📕':e==='docx'?'📘':e==='pptx'?'📙':e==='xlsx'?'📗':TEXT_EXT.has(e)?'📝':'📄'}
function enhance(){
  const panel=q('files'),input=q('fileInput');if(!panel||!input||q('fileTypeStrip'))return;
  input.accept='.pdf,.docx,.pptx,.xlsx,.txt,.md,.csv,.json,.html,.xml,.js,.mjs,.ts,.tsx,.jsx,.css,.py,.java,.c,.cpp,.h,.hpp,.go,.rs,.sh,.yaml,.yml,.toml,.ini,.log,text/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  input.multiple=true;
  const picker=input.closest('.picker');if(picker){picker.childNodes[0].textContent='Choose documents';const intro=document.createElement('div');intro.id='fileTypeStrip';intro.className='file-type-strip';intro.innerHTML='<span>📕 PDF</span><span>📘 Word</span><span>📙 PowerPoint</span><span>📗 Excel</span><span>📝 Text & code</span>';picker.before(intro)}
  const p=panel.querySelector('h1');if(p)p.textContent='Your document workspace.';
  const muted=p?.nextElementSibling;if(muted?.classList.contains('muted'))muted.textContent='Open PDF, Word, PowerPoint, Excel, text and code files locally. Select up to 5 files at once.';
  input.onchange=async()=>{
    const files=[...input.files].slice(0,5);if(!files.length)return;
    q('fileStatus').textContent='Reading '+files.length+' file'+(files.length>1?'s':'')+'…';
    const parts=[],errors=[];
    for(const f of files){try{const t=await readOne(f);parts.push((files.length>1?'===== '+iconFor(ext(f.name))+' '+f.name+' =====\n':'')+t)}catch(e){errors.push(e.message)}}
    if(parts.length){q('fileText').value=parts.join('\n\n');q('fileName').value=files.length===1?files[0].name.replace(/\.(pdf|docx|pptx|xlsx)$/i,'.txt'):'combined-documents.txt';q('fileText').dispatchEvent(new Event('input'));q('fileStatus').textContent=(files.length===1?'Opened '+files[0].name:'Combined '+parts.length+' documents')+' locally.'+(errors.length?' '+errors.join(' '):'')}
    else q('fileStatus').textContent=errors.join(' ')||'Could not read the selected file.';
    input.value=''
  };
  const intelligence=q('v3DocTools');if(intelligence){const small=intelligence.querySelector('small');if(small)small.textContent='Summarize, explain or quiz the PDF / Word / PowerPoint / Excel / text currently open above.'}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance);else enhance();
window.PocketFiles={readOne};
