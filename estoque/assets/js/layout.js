const titles={ajustes:['Ajuste de saldo','Correções administrativas com histórico dos valores anterior e novo.'],categorias:['Cadastro de categorias','Organize as categorias utilizadas nos equipamentos.'],motivos:['Cadastro de motivos','Cadastre, edite e gerencie os motivos das movimentações.'],vencimentos:['Validade e trocas','Acompanhe os EPIs entregues que precisam de substituição.'],'meu-acesso':['Meu acesso','Atualize sua senha com segurança.'],executivo:['Painel executivo','Indicadores de entregas para acompanhamento da diretoria.'],visao:['Visão geral','Acompanhe os saldos e os itens que precisam de reposição.'],inventario:['Inventário','Consulte equipamentos, filtre categorias e exporte o estoque.'],movimentacoes:['Entregas e movimentações','Registre entradas e entregas. Consulte o histórico e imprima requisições.'],cadastros:['Cadastro de EPIs','Cadastre equipamentos e configure CA e prazo de troca.'],recebedores:['Colaboradores','Cadastre e consulte as pessoas que recebem os equipamentos.'],importacao:['Importação Excel','Valide planilhas antes de cadastrar itens ou restaurar saldos.'],usuarios:['Permissões de acesso','Crie usuários e gerencie as permissões de acesso.']};
const $=id=>document.getElementById(id);
function closeMenu(){$('navigation').classList.remove('menu--open');$('menu-toggle').setAttribute('aria-expanded','false');}
export function syncLayout(focus=false){
 const active=!$('workspace').hidden;document.body.classList.toggle('session--active',active);
 const required=document.body.classList.contains('password--required');
 const available=Object.keys(titles).filter(id=>!$(id).hidden&&(!required||id==='meu-acesso'));
 let route=location.hash.slice(1);if(!available.includes(route))route=required?'meu-acesso':'visao';
 for(const id of Object.keys(titles)){
  $(id).classList.toggle('screen--inactive',id!==route);
  const link=document.querySelector(`#navigation a[href="#${id}"]`);link.hidden=!active||!available.includes(id);if(id===route&&active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
 }
 $('screen-title').textContent=active?titles[route][0]:'Acesse a gestão de EPIs';$('screen-description').textContent=active?titles[route][1]:'Entre com seu usuário para acessar o sistema.';
 $('nav-operation').hidden=!active||required;
 $('nav-registration').hidden=!active||!['cadastros','categorias','motivos','recebedores','usuarios'].some(id=>available.includes(id));
 $('nav-session').hidden=!active;
 $('menu-toggle').hidden=!active;
 if(focus&&active){$('screen-title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
 closeMenu();
}
document.querySelector('#navigation').addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(!link)return;e.preventDefault();if(location.hash===link.hash)syncLayout(true);else location.hash=link.hash;});
window.addEventListener('hashchange',()=>syncLayout(true));
document.querySelector('.brand').addEventListener('click',e=>{
 if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;
 e.preventDefault();
 if($('workspace').hidden){window.scrollTo({top:0,behavior:'instant'});return;}
 if(location.hash==='#visao')syncLayout(true);else location.hash='visao';
});
$('menu-toggle').addEventListener('click',()=>{const open=$('navigation').classList.toggle('menu--open');$('menu-toggle').setAttribute('aria-expanded',String(open));if(open)window.scrollTo({top:0,behavior:'instant'});});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('navigation').classList.contains('menu--open')){closeMenu();$('menu-toggle').focus();}});
const themeButton=$('theme-toggle');function themeLabel(){const dark=document.documentElement.dataset.theme==='dark';themeButton.textContent=dark?'☀ Modo claro':'☾ Modo escuro';themeButton.setAttribute('aria-label',dark?'Ativar modo claro':'Ativar modo escuro');}
themeButton.addEventListener('click',()=>{const theme=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=theme;try{localStorage.setItem('transcol-theme',theme);}catch{}themeLabel();});themeLabel();
new MutationObserver(()=>syncLayout()).observe($('workspace'),{attributes:true,attributeFilter:['hidden']});
syncLayout();
