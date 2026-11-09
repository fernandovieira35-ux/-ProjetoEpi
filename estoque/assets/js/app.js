import './effects.js';
import {createUserError} from './create-user-error.js';
import {showMfaSetup,clearMfaSetup} from './mfa-setup.js';
import {loginErrorMessage} from './login-errors.js';
import {setupUnitChoice,unitGuidance,suggestedUnit} from './epi-units.js';
import {inventoryRows,buildInventoryReport,exportInventoryReport} from './inventory-report.js';
import {normalizeManualCode,renderCodeChoice} from './epi-code.js';
import {validateEpiDetails,addMonths,businessDate,showDate} from './epi-expiry.js';
import {downloadImportTemplate} from './import-template.js';
import {expiredReportRows,buildExpiredReport} from './expired-report.js';
import {renderExpiry} from './expiry-view.js';
import {renderStockChart} from './stock-chart.js';
import {loginEmail,normalizeUsername} from './username.js';
import {setupPassword,resetPasswordForm} from './password.js';
import {requireStrongPassword} from './password-policy.js';
import {setupDashboard,updateDashboard,dashboardSheets,validateDashboard,clearDashboard} from './dashboard.js';
import {syncLayout} from './layout.js';
import {buildReceipt} from './receipt.js';
import {client,configured,rpc,rows,demoMode} from './api.js';
import {validateRows} from './validation.js';
import {validateRecipient,maskedDocument} from './recipients.js';
let recipients=[],deliveries=[],reasons=[],editingReasonId=null;
setupDashboard();setupPassword();setupUnitChoice();
document.addEventListener('password-updated',()=>{if(document.body.classList.contains('password--required'))task(async()=>{await afterLogin();});});
const $=id=>document.getElementById(id);
const stockNotice=document.createElement('p');stockNotice.id='stock-notice';stockNotice.className='stock--notice';stockNotice.setAttribute('role','status');stockNotice.setAttribute('aria-live','polite');stockNotice.setAttribute('aria-atomic','true');
$('move-item').closest('label').after(stockNotice);$('move-item').setAttribute('aria-describedby','stock-notice');
function updateStockNotice(){
 const selected=state.items.find(i=>i.id===$('move-item').value);
 let unitNotice=$('move-unit-notice');if(!unitNotice){unitNotice=document.createElement('p');unitNotice.id='move-unit-notice';unitNotice.className='code--notice';unitNotice.setAttribute('role','status');const quantity=$('move-form').elements.quantity;quantity.setAttribute('aria-describedby',unitNotice.id);quantity.closest('label').after(unitNotice);}unitNotice.textContent=selected?`${selected.sku}: ${unitGuidance(selected.name,selected.unit)}`:'';
 if(!selected||selected.balance>selected.minimum){stockNotice.textContent='';return;}
 const unit=({un:'unidade(s)',par:'par(es)',caixa:'caixa(s)'})[selected.unit]||selected.unit;
 stockNotice.textContent=`${selected.balance===0?'Estoque esgotado':'Atenção: estoque baixo'} — ${selected.sku} · ${selected.name}. Disponível: ${selected.balance} ${unit}. Estoque mínimo: ${selected.minimum} ${unit}. Providencie a reposição.${selected.balance===0?' Não há saldo para saída.':''}`;
}
$('move-item').addEventListener('change',updateStockNotice);
const roleLabel=role=>({admin:'Administrador',operador:'Usuário simples',leitor:'Leitor (legado)'})[role]||role;
let adjustmentExpected=null,adjustmentRequest=null,adjustmentPayload='';
let restoreRequest=null;
let epiCodeStatus=null,epiRequest=null,epiPayload='';
$('item-code-mode').addEventListener('change',()=>{if($('item-code-mode').value==='manual')$('item-code').value='';renderCodeChoice(epiCodeStatus);});
let state={items:[],categories:[],movements:[],profiles:[]}, pending=[], factor=null, busy=false;
const message=text=>{$('message').textContent=text;};
const category=id=>state.categories.find(c=>c.id===id)?.name??'Categoria';
const item=id=>state.items.find(i=>i.id===id)?.name??'Equipamento';
function updateAdjustmentBalance(){const selected=state.items.find(i=>i.id===$('adjust-item').value);adjustmentExpected=selected?.balance??null;$('adjust-before').value=selected?`${selected.balance} ${selected.unit}`:'';}
$('adjust-item').addEventListener('change',updateAdjustmentBalance);
function updateReasonNotice(){const selected=reasons.find(r=>r.active&&r.name===$('move-reason').value);$('reason-notice').textContent=selected?`Motivo selecionado: ${selected.name}. ${selected.guidance||'Confira se este motivo corresponde à movimentação.'}`:'Selecione um motivo ativo cadastrado. Exemplo: Troca de EPI por prazo de uso.';}
$('move-reason').addEventListener('change',updateReasonNotice);
function renderReasons(isAdmin){
 options('move-reason',reasons.filter(r=>r.active).sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')),r=>r.name,r=>r.name,'Selecione um motivo');updateReasonNotice();
 options('adjust-reason',reasons.filter(r=>r.active),r=>r.name,r=>r.name,'Selecione um motivo');
 $('reasons-body').replaceChildren();if(!isAdmin)return;
 for(const r of reasons){const actions=document.createElement('div');actions.className='reason--actions';const editButton=document.createElement('button');editButton.type='button';editButton.textContent='Editar';editButton.setAttribute('aria-label','Editar motivo: '+r.name);editButton.addEventListener('click',()=>{editingReasonId=r.id;$('reason-form').elements.name.value=r.name;$('reason-form').elements.guidance.value=r.guidance||'';$('reason-save').textContent='Salvar alterações';$('reason-cancel').hidden=false;$('reason-form').scrollIntoView({block:'center'});$('reason-form').elements.name.focus();});const removeButton=document.createElement('button');removeButton.type='button';removeButton.textContent='Excluir';removeButton.setAttribute('aria-label','Excluir motivo: '+r.name);removeButton.addEventListener('click',()=>{if(!window.confirm(`Excluir o motivo “${r.name}”? O histórico das movimentações será preservado.`))return;task(async()=>{await rpc('delete_reason',{p_reason:r.id});if(editingReasonId===r.id)resetReasonEditor();await refresh();message('Motivo excluído. Histórico preservado.');});});const button=document.createElement('button');button.type='button';button.textContent=r.active?'Desativar':'Ativar';button.addEventListener('click',()=>task(async()=>{await rpc('set_reason_active',{p_reason:r.id,p_active:!r.active});await refresh();message('Situação do motivo atualizada.');}));actions.append(editButton,button,removeButton);cellRow($('reasons-body'),[r.name,r.guidance||'Sem aviso adicional',r.active?'Ativo':'Inativo',actions]);}
}
function refreshExpiry(){renderExpiry(deliveries,state.movements,!$('vencimentos').hidden,(d,m)=>{if(!m)return;const form=$('move-form');form.elements.kind.value='saida';$('move-item').value=m.item_id;$('move-recipient').value=d.recipient_id;updateDeliveryFields();updateReplacementOptions();$('move-replaces').value=d.id;form.elements.quantity.value=m.quantity;form.elements.reason.value='Troca de EPI por prazo de uso';updateReasonNotice();updateStockNotice();location.hash='movimentacoes';});}
function updateReplacementOptions(){
 const selected=state.items.find(i=>i.id===$('move-item').value);
 const previous=deliveries.filter(d=>!d.replaced_by&&d.recipient_id===$('move-recipient').value&&state.movements.some(m=>m.id===d.id&&m.item_id===selected?.id));
 options('move-replaces',previous,d=>d.id,d=>`${showDate(d.delivered_on)} · ${d.item_name} · troca ${showDate(d.due_date)}`,'Nova entrega, sem substituição');
 $('delivery-expiry-preview').textContent=selected?`CA: ${selected.ca||'não informado'}. ${selected.validity_months?`Prazo: ${selected.validity_months} meses. Troca prevista para entrega hoje: ${showDate(addMonths(businessDate(),selected.validity_months))}.`:'Sem prazo de troca configurado; esta entrega não gerará alerta de vencimento.'}`:'';
}
$('move-item').addEventListener('change',updateReplacementOptions);$('move-recipient').addEventListener('change',updateReplacementOptions);
$('expiry-filter').addEventListener('change',refreshExpiry);
$('details-item').addEventListener('change',()=>{const i=state.items.find(i=>i.id===$('details-item').value);$('epi-details-form').elements.ca.value=i?.ca||'';$('epi-details-form').elements.validade_meses.value=i?.validity_months??'';});
function cellRow(body,values){const tr=document.createElement('tr');for(const value of values){const td=document.createElement('td');if(value instanceof Node)td.append(value);else td.textContent=String(value??'');tr.append(td);}body.append(tr);}
function options(id,list,value,label,placeholder){const el=$(id);const previous=el.value;el.replaceChildren();if(placeholder)el.add(new Option(placeholder,''));for(const r of list)el.add(new Option(label(r),value(r)));if([...el.options].some(o=>o.value===previous))el.value=previous;}
function selectedItems(){return state.items.filter(i=>(!$('filter-category').value||i.category_id===$('filter-category').value)&&`${i.sku} ${i.name}`.toLocaleLowerCase('pt-BR').includes($('search').value.toLocaleLowerCase('pt-BR')));}
function selectedMoves(){return state.movements.filter(m=>{const d=new Date(m.created_at);const local=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;return (!$('from').value||local>=$('from').value)&&(!$('to').value||local<=$('to').value);}).sort((a,b)=>b.created_at.localeCompare(a.created_at));}
function renderTables(){
 $('items-body').replaceChildren();
 for(const i of selectedItems()){const badge=document.createElement('span');badge.className='badge'+(i.balance<=i.minimum?' badge--low':'');badge.textContent=i.balance<=i.minimum?'Repor estoque':'Disponível';cellRow($('items-body'),[i.sku,i.name,category(i.category_id),i.unit,i.balance,i.minimum,i.ca||'Não informado',i.validity_months?i.validity_months+' meses':'Não informado',badge]);}
 if(!$('items-body').children.length)cellRow($('items-body'),['Nenhum item encontrado.']);
 $('moves-body').replaceChildren();for(const m of selectedMoves()){
  const d=deliveries.find(d=>d.id===m.id);const button=document.createElement('button');button.textContent='Imprimir requisição';button.type='button';button.addEventListener('click',()=>task(()=>printDelivery(m.id)));
  cellRow($('moves-body'),[new Date(m.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),item(m.item_id),m.is_adjustment?'Ajuste ('+m.kind+')':m.kind,m.quantity,m.reason,m.actor,d?d.recipient_name:'—',d?d.delivered_by:'—',m.balance_before??'Não registrado',m.balance_after??'Não registrado',m.actor_name||m.actor,m.workstation_label?m.workstation_label+' (informada)':'Não informada',d?button:'—']);
 }
 if(!$('moves-body').children.length)cellRow($('moves-body'),['Nenhuma movimentação no período.']);
}
async function passwordGate(){
 const status=await rpc('access_status',{});
 if(!status?.active)throw new Error('Usuário sem perfil ativo. Solicite acesso ao administrador.');
 const required=!!status.must_change_password;
 document.body.classList.toggle('password--required',required);$('first-access-notice').hidden=!required;
 if(required){clearDashboard();$('workspace').hidden=false;$('login').hidden=true;$('logout').hidden=false;$('print').disabled=true;location.hash='meu-acesso';syncLayout();message('Troque a senha inicial antes de acessar os registros.');}
 return required;
}
async function refresh(){
 if(await passwordGate())return;
 const [items,categories,movements,profiles]=await Promise.all(['items','categories','movements','profiles'].map(rows));
 state={items,categories,movements,profiles};
 const {data:{user},error}=await client.auth.getUser();if(error)throw error;
 const profile=profiles.find(p=>p.id===user.id);if(!profile?.active)throw new Error('Usuário sem perfil ativo. Solicite acesso ao administrador.');
 [recipients,deliveries]=profile.role==='leitor'?[[],[]]:await Promise.all([rows('recipients'),rows('deliveries')]);
 options('move-recipient',recipients,r=>r.id,r=>`${r.full_name} · ${r.sector}`,'Selecione quem recebe');
 $('recipients-body').replaceChildren();for(const r of recipients)cellRow($('recipients-body'),[r.full_name,maskedDocument(r),r.sector]);
 $('delivered-by').value=profile.username||user.email||user.id;
 $('identity').textContent=`${profile.username||user.email} · ${roleLabel(profile.role)}`;
 document.querySelectorAll('[data-write]').forEach(e=>e.hidden=profile.role==='leitor');
 document.querySelectorAll('[data-admin]').forEach(e=>e.hidden=profile.role!=='admin');
 $('move-entry-option').hidden=profile.role!=='admin';$('move-entry-option').disabled=profile.role!=='admin';if(profile.role!=='admin'){$('move-form').elements.kind.value='saida';$('import-mode').value='new';}updateDeliveryFields();
 options('adjust-item',profile.role==='admin'?items:[],i=>i.id,i=>i.sku+' · '+i.name,'Selecione o EPI');if(adjustmentExpected===null)updateAdjustmentBalance();
 reasons=profile.role==='leitor'?[]:await rows('movement_reasons');
 renderReasons(profile.role==='admin');
 $('categories-body').replaceChildren();if(profile.role==='admin')for(const c of [...categories].sort((a,b)=>a.name.localeCompare(b.name,'pt-BR')))cellRow($('categories-body'),[c.name]);
 options('filter-category',categories,c=>c.id,c=>c.name,'Todas as categorias');
 if(profile.role!=='leitor'){epiCodeStatus=await rpc('epi_code_status',{});renderCodeChoice(epiCodeStatus);}
 options('item-category',categories,c=>c.name,c=>c.name,'Selecione');
 options('move-item',items,i=>i.id,i=>`${i.sku} · ${i.name}`,'Selecione');
 updateStockNotice();updateReplacementOptions();
 options('details-item',items,i=>i.id,i=>`${i.sku} · ${i.name}`,'Selecione');
 refreshExpiry();
 options('access-user',profiles.filter(p=>p.id!==user.id),p=>p.id,p=>p.username||p.id,'Selecione o usuário');
 $('count').textContent=items.length;$('balance').textContent=items.reduce((n,i)=>n+i.balance,0).toLocaleString('pt-BR');$('low').textContent=items.filter(i=>i.balance<=i.minimum).length;
 $('date').textContent=`Atualizado em ${new Date().toLocaleString('pt-BR')}`;
 renderStockChart(items,categories);
 $('stock-chart-status').textContent='Atualizado em '+new Date().toLocaleString('pt-BR')+'. Atualização automática a cada 60 segundos nesta tela.';
 $('users-body').replaceChildren();for(const p of profiles)cellRow($('users-body'),[p.username||p.id,roleLabel(p.role),p.active?'Sim':'Não',p.must_change_password?'Sim':'Não']);
 if(profile.role!=='leitor')updateDashboard({...state,deliveries,role:profile.role,identity:profile.username||user.email||user.id,updated:new Date(),demo:demoMode});else clearDashboard();
 renderTables();$('workspace').hidden=false;$('login').hidden=true;$('logout').hidden=false;$('print').disabled=false;syncLayout();
}
async function task(fn){if(busy)return;busy=true;const buttons=[...document.querySelectorAll('button')].map(b=>[b,b.disabled]);buttons.forEach(([b])=>b.disabled=true);try{await fn();}catch(e){message(`Não foi possível concluir: ${e.message}`);}finally{busy=false;buttons.forEach(([b,disabled])=>b.disabled=disabled);$('print').disabled=$('workspace').hidden||document.body.classList.contains('password--required');$('confirm-import').disabled=!pending.length;}}
function form(id,fn){$(id).addEventListener('submit',e=>{e.preventDefault();const values=Object.fromEntries(new FormData(e.target));task(()=>fn(values,e.target));});}
async function afterLogin(){
 clearMfaSetup();
 if(await passwordGate())return;
 if(demoMode){await refresh();message('');return;}
 $('workspace').hidden=true;$('login').hidden=false;
 const {data,error}=await client.auth.mfa.listFactors();if(error)throw error;
 factor=data.totp.find(f=>f.status==='verified')?.id;
 if(!factor){for(const f of data.totp.filter(f=>f.status==='unverified'))await client.auth.mfa.unenroll({factorId:f.id});const enrolled=await client.auth.mfa.enroll({factorType:'totp',friendlyName:'Estoque EPI'});if(enrolled.error)throw enrolled.error;factor=enrolled.data.id;showMfaSetup(enrolled.data.totp);}
 $('login-form').hidden=true;$('mfa-form').hidden=false;message('Confirme o segundo fator para acessar os registros.');
}
form('login-form',async(v,f)=>{if(!configured)throw new Error('Configure assets/js/config.js primeiro.');if(demoMode&&v.email.trim().toLowerCase()==='adcmim')throw new Error('Este usuário pertence ao ambiente real. Clique em Voltar ao ambiente real e entre com a senha mais recente.');let error;try{requireStrongPassword(v.password);({error}=await client.auth.signInWithPassword({email:demoMode&&!v.email.includes('@')&&['admin','operador','leitor'].includes(v.email.trim().toLowerCase())?v.email.trim().toLowerCase()+'@demo.local':loginEmail(v.email),password:v.password}));}finally{f.password.value='';}if(error)throw new Error(loginErrorMessage(error));$('logout').hidden=false;await afterLogin();});
form('mfa-form',async(v,f)=>{const {error}=await client.auth.mfa.challengeAndVerify({factorId:factor,code:v.code});if(error)throw new Error('Código inválido ou expirado.');clearMfaSetup();f.reset();await refresh();message('Conexão ativa. Os registros exibidos respeitam suas permissões.');});
form('category-form',async(v,f)=>{await rpc('create_category',{p_name:v.name});await refresh();f.reset();message('Categoria cadastrada.');});
function resetReasonEditor(){editingReasonId=null;$('reason-form').reset();$('reason-save').textContent='Cadastrar motivo';$('reason-cancel').hidden=true;}
$('reason-cancel').addEventListener('click',resetReasonEditor);
form('reason-form',async(v)=>{const editing=editingReasonId;await rpc(editing?'update_reason':'create_reason',{...(editing?{p_reason:editing}:{}),p_name:v.name,p_guidance:v.guidance});resetReasonEditor();await refresh();message(editing?'Motivo atualizado. Histórico preservado.':'Motivo cadastrado e disponível para seleção.');});
form('item-form',async(v,f)=>{const manual=v.code_mode==='manual';const row=validateRows([{...v,codigo:manual?normalizeManualCode(v.codigo):'AUTO'}])[0];if(!manual)delete row.codigo;const payload=JSON.stringify({row,manual});if(payload!==epiPayload){epiPayload=payload;epiRequest=crypto.randomUUID();}const result=await rpc('create_epi',{p_row:row,p_manual:manual,p_request:epiRequest});epiPayload='';epiRequest=null;f.reset();await refresh();renderCodeChoice(epiCodeStatus);message('EPI cadastrado com saldo zero. Código: '+result.codigo);});
form('epi-details-form',async(v,f)=>{const details=validateEpiDetails(v.ca,v.validade_meses);await rpc('set_epi_details',{p_item:v.item,p_ca:details.ca,p_months:details.validity_months});await refresh();f.reset();message('CA e prazo atualizados para novas entregas. Histórico preservado.');});
form('adjust-form',async(v,f)=>{if(adjustmentExpected===null)throw new Error('Selecione o EPI e consulte o saldo.');const args={p_item:v.item,p_balance:Number(v.balance),p_expected:adjustmentExpected,p_reason:v.reason,p_station:v.station.trim()};if(!Number.isInteger(args.p_balance)||args.p_balance<0||args.p_balance>100000000)throw new Error('Informe um saldo inteiro válido.');const payload=JSON.stringify(args);if(payload!==adjustmentPayload){adjustmentPayload=payload;adjustmentRequest=crypto.randomUUID();}await rpc('adjust_stock',{...args,p_request:adjustmentRequest});f.reset();adjustmentExpected=null;adjustmentPayload='';adjustmentRequest=null;await refresh();message(`Ajuste registrado: saldo anterior ${args.p_expected}, novo saldo ${args.p_balance}. Consulte Entregas e histórico.`);});
let moveRequest=null,movePayload='';
form('move-form',async(v,f)=>{
 const payload=JSON.stringify(v);if(payload!==movePayload){movePayload=payload;moveRequest=crypto.randomUUID();}
 const args={p_item:v.item,p_quantity:Number(v.quantity),p_reason:v.reason,p_request:moveRequest};
 const previous=v.kind==='saida'&&v.replaces?deliveries.find(d=>d.id===v.replaces):null;
 const saved=v.kind==='saida'?await rpc('deliver_epi',{...args,p_recipient:v.recipient,...(v.replaces?{p_replaces:v.replaces}:{})}):await rpc('move_stock',{...args,p_kind:v.kind});
 if(previous){previous.replaced_by=saved;refreshExpiry();}
 movePayload='';moveRequest=null;f.reset();updateDeliveryFields();
 const success=previous?`Movimentação registrada. Troca de ${previous.item_name} para ${previous.recipient_name} concluída. O alerta da entrega substituída foi resolvido; outras entregas pendentes continuam nos avisos.`:'Movimentação registrada.';
 try{await refresh();message(success);}catch{message(success+' Não foi possível atualizar todos os dados. Clique em atualizar os alertas; não repita a gravação.');}
});
form('recipient-form',async(v,f)=>{const r=validateRecipient(v);await rpc('create_recipient',{p_name:r.full_name,p_document_type:r.document_type,p_document:r.document_number,p_sector:r.sector});f.reset();await refresh();message('Colaborador cadastrado.');});
function updateDeliveryFields(){const delivery=$('move-form').elements.kind.value==='saida';$('delivery-fields').hidden=!delivery;for(const field of $('delivery-fields').querySelectorAll('input,select')){field.required=delivery&&!field.readOnly&&field.id!=='move-replaces';field.disabled=!delivery;}}
$('move-form').elements.kind.addEventListener('change',updateDeliveryFields);updateDeliveryFields();
async function printDelivery(id){
 await refresh();const m=state.movements.find(m=>m.id===id),d=deliveries.find(d=>d.id===id);
 if(!m||!d)throw new Error('Requisição indisponível ou acesso negado.');
 const sheet=$('delivery-receipt');await buildReceipt(sheet,m,d,demoMode);
 document.body.classList.add('receipt--printing');try{window.print();}finally{document.body.classList.remove('receipt--printing');sheet.replaceChildren();}
}
const createUserStatus=document.createElement('p');createUserStatus.id='create-user-status';createUserStatus.className='code--notice';createUserStatus.setAttribute('role','status');$('create-user-form').after(createUserStatus);
form('create-user-form',async(v,f)=>{try{createUserStatus.textContent='Validando acesso…';const username=normalizeUsername(v.username);requireStrongPassword(v.initial_password);const body={username,password:v.initial_password,role:v.role,active:v.active==='true',must_change_password:v.must_change_password==='on'};
 createUserStatus.textContent='Criando usuário… Aguarde a confirmação.';
 if(demoMode)await rpc('create_user',body);else{const {data,error}=await client.functions.invoke('create-user',{body});if(error)throw new Error(await createUserError(error));if(!data?.id)throw new Error('O serviço não confirmou a criação. Confira o cadastro antes de repetir.');}
 f.reset();let result='Usuário criado. Informe a senha inicial por um canal privado.';
 try{await refresh();}catch{result='Usuário criado, mas a lista não pôde ser atualizada. Atualize a página; não repita o cadastro.';}
 createUserStatus.textContent=result;message(result);
 }catch(error){createUserStatus.textContent=error.message;throw error;}finally{f.elements.initial_password.value='';}});
$('access-user').addEventListener('change',()=>{const p=state.profiles.find(p=>p.id===$('access-user').value);if(p){const roleSelect=$('access-form').elements.role;const legacy=roleSelect.querySelector('option[value=leitor]');if(legacy)legacy.remove();if(p.role==='leitor')roleSelect.add(new Option('Leitor (legado)','leitor'));roleSelect.value=p.role;$('access-form').elements.active.value=String(p.active);}});
form('access-form',async(v,f)=>{await rpc('set_user_access',{p_user:v.user,p_role:v.role,p_active:v.active==='true'});await refresh();f.reset();message('Permissões atualizadas.');});
for(const id of ['search','filter-category','from','to'])$(id).addEventListener('input',renderTables);
function exportBook(sheets,filename){const book=XLSX.utils.book_new();for(const [name,data] of sheets){const sheet=XLSX.utils.json_to_sheet(data);for(const [key,value]of Object.entries(sheet)){if(!key.startsWith('!')&&typeof value.v==='string'){value.t='s';delete value.f;delete value.l;}}XLSX.utils.book_append_sheet(book,sheet,name);}XLSX.writeFile(book,filename,{bookType:'xlsx'});}
const exportItems=()=>selectedItems().map(i=>({codigo:i.sku,nome:i.name,categoria:category(i.category_id),unidade:i.unit,minimo:i.minimum,ca:i.ca||'',validade_meses:i.validity_months??'',saldo:i.balance}));
function action(id,fn){$(id).addEventListener('click',()=>task(fn));}
action('expiry-refresh',async()=>{await refresh();message('Alertas de troca atualizados.');});
action('adjust-refresh',async()=>{await refresh();updateAdjustmentBalance();message('Saldo consultado atualizado. Confira o novo saldo antes de confirmar o ajuste.');});
async function expiredReportData(){
 await refresh();
 if($('workspace').hidden||$('vencimentos').hidden||document.body.classList.contains('password--required'))throw new Error('Acesso não autorizado ao relatório de colaboradores.');
 const {data:{user},error}=await client.auth.getUser();if(error)throw error;
 const profile=state.profiles.find(p=>p.id===user?.id);if(!profile?.active||!['admin','operador'].includes(profile.role))throw new Error('Acesso não autorizado.');
 return {records:expiredReportRows({...state,deliveries,recipients}),meta:{demo:demoMode,identity:profile.username||user.email||user.id,role:profile.role}};
}
action('expiry-print',async()=>{const {records,meta}=await expiredReportData();const report=$('expired-report');try{await buildExpiredReport(report,records,meta);document.body.classList.add('overdue--printing');window.print();}finally{document.body.classList.remove('overdue--printing');report.replaceChildren();}});
action('expiry-export',async()=>{const {records,meta}=await expiredReportData();exportBook([['Resumo',[{relatorio:'EPIs vencidos sem substituição',referencia:businessDate(),emitido_em:new Date().toISOString(),responsavel:meta.identity,escopo:meta.role==='admin'?'Categorias autorizadas':'Escopo parcial: categorias autorizadas',demonstracao:demoMode?'SIM · DADOS FICTÍCIOS':'Não',colaboradores:new Set(records.map(r=>r.colaborador_id)).size,entregas_vencidas:records.length}]],['Vencidos',records]],(demoMode?'DEMO-':'')+'epis-vencidos.xlsx');message('Relatório de EPIs vencidos exportado.');});
action('export-items',async()=>{await refresh();exportBook([['Inventario',exportItems()]],'inventario.xlsx');message('Inventário exportado com os filtros selecionados. A coluna saldo não é importada pelo cadastro.');});
action('export-moves',async()=>{await refresh();exportBook([['Movimentacoes',selectedMoves().map(m=>({id:m.id,data:m.created_at,data_brasilia:new Date(m.created_at).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'}),equipamento:item(m.item_id),tipo:m.kind,quantidade:m.quantity,motivo:m.reason,usuario:m.actor,usuario_nome:m.actor_name||'',saldo_anterior:m.balance_before??'',saldo_novo:m.balance_after??'',ajuste:m.is_adjustment?'Sim':'Não',estacao_informada:m.workstation_label||'',recebido_por:deliveries.find(d=>d.id===m.id)?.recipient_name??'',entregue_por:deliveries.find(d=>d.id===m.id)?.delivered_by??''}))]],'movimentacoes.xlsx');});
action('template',async()=>{await refresh();downloadImportTemplate(state.items,state.categories,$('import-mode').value==='restore');message('Modelo completo baixado com três exemplos fictícios e uma aba Instrucoes separada. Revise os dados antes de importar.');});
function parseExcel(buffer){return new Promise((resolve,reject)=>{const worker=new Worker('assets/js/excel-worker.js');const timer=setTimeout(()=>{worker.terminate();reject(new Error('Arquivo excedeu o tempo de processamento.'));},10000);const done=()=>{clearTimeout(timer);worker.terminate();};worker.onmessage=({data})=>{done();data.error?reject(new Error(data.error)):resolve(data.rows);};worker.onerror=()=>{done();reject(new Error('Não foi possível ler a planilha.'));};worker.postMessage({buffer,restore:$("import-mode").value==="restore"},[buffer]);});}
$('file').addEventListener('change',()=>task(async()=>{pending=[];$('preview-table').hidden=true;$('preview').textContent='Validando arquivo…';const file=$('file').files[0];if(!file){$('preview').textContent='Nenhum arquivo selecionado.';return;}if(!/\.xlsx$/i.test(file.name)||file.size>2*1024*1024)throw new Error('Selecione um .xlsx de até 2 MB.');const imported=validateRows(await parseExcel(await file.arrayBuffer()),$("import-mode").value==="restore");for(const r of imported){if(!state.categories.some(c=>c.name===r.categoria))throw new Error(`Categoria não autorizada ou inexistente: ${r.categoria}`);if($("import-mode").value!=="restore" && state.items.some(i=>i.sku===r.codigo))throw new Error(`Código já cadastrado: ${r.codigo}`);}pending=imported;restoreRequest=crypto.randomUUID();$('preview-body').replaceChildren();for(const r of pending)cellRow($('preview-body'),[r.codigo,r.nome,r.categoria,r.unidade,r.minimo,r.ca||'',r.validade_meses??'',r.saldo??'']);$('preview-table').hidden=false;$('preview').textContent=`${pending.length} cadastros validados. Confira os dados antes de confirmar.`;const divergences=pending.filter(r=>suggestedUnit(r.nome)&&suggestedUnit(r.nome)!==r.unidade);if(divergences.length){const warning=' Atenção às unidades: '+divergences.map(r=>r.codigo+' ('+r.unidade+'; padrão sugerido: '+suggestedUnit(r.nome)+')').join(', ')+'. Revise a planilha se necessário. Nenhuma conversão automática é realizada.';$('preview').textContent+=warning;}message('Planilha validada. Confira as unidades na prévia antes de confirmar.');}));
action('confirm-import',async()=>{if(!pending.length)return;if($('import-mode').value==='restore')await rpc('restore_inventory',{p_rows:pending,p_request:restoreRequest});else await rpc('import_items',{p_rows:pending});pending=[];$('file').value='';$('preview').textContent='Importação concluída.';$('preview-table').hidden=true;await refresh();message('Importação concluída em uma única transação.');});
action('exec-refresh',async()=>{await refresh();message('Painel executivo atualizado.');});
action('exec-export',async()=>{await refresh();if($('executivo').hidden)throw new Error('Acesso não autorizado.');exportBook(dashboardSheets(),(demoMode?'DEMO-':'')+'relatorio-executivo.xlsx');});
action('exec-print',async()=>{await refresh();if($('executivo').hidden)throw new Error('Acesso não autorizado.');validateDashboard();document.body.classList.add('executive--printing');try{window.print();}finally{document.body.classList.remove('executive--printing');}});
setInterval(()=>{if(!busy&&!document.hidden&&!$('workspace').hidden&&!$('executivo').hidden&&location.hash==='#executivo')task(async()=>{try{await refresh();}catch(e){$('exec-updated').textContent='Atualização falhou. Os dados exibidos são da última consulta bem-sucedida.';throw e;}});},60000);
for(const id of ['stock-chart-type','stock-chart-unit'])$(id).addEventListener('change',()=>renderStockChart(state.items,state.categories));
action('stock-chart-refresh',async()=>{try{await refresh();}catch(e){$('stock-chart-status').textContent='Falha na atualização. Os dados anteriores foram mantidos; tente novamente.';throw e;}});
setInterval(()=>{if(!busy&&!document.hidden&&!$('workspace').hidden&&!document.body.classList.contains('password--required')&&$('executivo').classList.contains('screen--inactive'))task(async()=>{try{await refresh();}catch(e){$('stock-chart-status').textContent='Falha na atualização. Os dados anteriores foram mantidos; tente novamente.';throw e;}});},60000);
async function inventoryReportData(){await refresh();if($('workspace').hidden||document.body.classList.contains('password--required'))throw new Error('Acesso não autorizado.');const {data:{user},error}=await client.auth.getUser();if(error)throw error;const profile=state.profiles.find(p=>p.id===user?.id);return {records:inventoryRows(selectedItems(),state.categories),meta:{demo:demoMode,identity:profile?.username||user?.email||'',role:profile?.role,search:$('search').value,category:$('filter-category').selectedOptions[0]?.textContent}};}
async function printInventory(){const {records,meta}=await inventoryReportData();const target=$('inventory-report');try{await buildInventoryReport(target,records,meta);document.body.classList.add('inventory--printing');window.print();}finally{document.body.classList.remove('inventory--printing');target.replaceChildren();}}
action('inventory-print',printInventory);
action('inventory-export',async()=>{const {records,meta}=await inventoryReportData();await exportInventoryReport(records,meta);message('Relatório de inventário com logo exportado. Para restauração, use Excel de dados.');});
action('print',async()=>{if(location.hash==='#inventario')return printInventory();await refresh();window.print();});
$('logout').addEventListener('click',async()=>{if(client)await client.auth.signOut();if(!demoMode){location.reload();return;}state={items:[],categories:[],movements:[],profiles:[]};recipients=[];deliveries=[];pending=[];clearDashboard();resetPasswordForm();$('adjust-form').reset();adjustmentExpected=null;adjustmentRequest=null;adjustmentPayload='';resetReasonEditor();reasons=[];$('reasons-body').replaceChildren();$('categories-body').replaceChildren();$('move-reason').replaceChildren();updateReasonNotice();$('item-form').reset();epiCodeStatus=null;epiRequest=null;epiPayload='';renderCodeChoice(null);$('expiry-banner').hidden=true;$('expiry-body').replaceChildren();document.body.classList.remove('password--required');$('workspace').hidden=true;$('login').hidden=false;$('login-form').hidden=false;$('login-form').reset();$('logout').hidden=true;$('print').disabled=true;$('identity').textContent='DEMONSTRAÇÃO';for(const id of ['items-body','moves-body','users-body','recipients-body','delivery-receipt','chart'])$(id).replaceChildren();location.hash='';syncLayout();message('Sessão encerrada. Os dados de demonstração permanecem nesta aba até recarregar.');});
if(configured){message('Entre com seu usuário para acessar o estoque.');client.auth.onAuthStateChange(event=>{if(event==='SIGNED_OUT'){clearMfaSetup();state={items:[],categories:[],movements:[],profiles:[]};pending=[];resetPasswordForm();$('item-form').reset();epiCodeStatus=null;epiRequest=null;epiPayload='';renderCodeChoice(null);$('expiry-banner').hidden=true;$('expiry-body').replaceChildren();clearDashboard();$('workspace').hidden=true;$('print').disabled=true;$('identity').textContent='Sessão encerrada';for(const id of ['items-body','moves-body','users-body','preview-body','recipients-body','delivery-receipt','chart'])$(id).replaceChildren();message('Sessão encerrada. Recarregue a página para entrar novamente.');}});}else{message('Configuração pendente: preencha a URL e a chave publicável em assets/js/config.js e aplique a migração SQL.');$('login-form').querySelector('button').disabled=true;}

$('import-mode').addEventListener('change',()=>{pending=[];$('file').value='';$('preview-table').hidden=true;$('confirm-import').disabled=true;$('preview').textContent='Selecione a planilha para o modo escolhido.';});
if(demoMode){$('demo-banner').hidden=false;$('identity').textContent='DEMONSTRAÇÃO';document.title='DEMO · Transcol · Gestão de EPIs';message('Entre com um usuário de demonstração. Nenhuma conexão com o Supabase será feita.');}
