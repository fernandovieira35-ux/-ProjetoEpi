import {client,demoMode} from './api.js';
import {passwordChecks,requireStrongPassword} from './password-policy.js';
const $=id=>document.getElementById(id);
export function resetPasswordForm(){$('password-form').reset();renderRules();$('password-status').textContent='';}
function renderRules(){const list=$('password-rules');list.replaceChildren();for(const [label,ok]of passwordChecks($('new-password').value)){const li=document.createElement('li');li.textContent=`${ok?'✓':'○'} ${label}`;li.className=ok?'password--met':'password--pending';list.append(li);}}
export function setupPassword(){
 $('new-password').addEventListener('input',renderRules);renderRules();
 $('password-form').addEventListener('submit',async e=>{
  e.preventDefault();const form=e.target,button=form.querySelector('button');if(button.disabled)return;
  const current=form.elements.current_password.value,next=form.elements.new_password.value,confirmation=form.elements.confirm_password.value;
  const status=$('password-status');status.textContent='';
  try{requireStrongPassword(next);if(next!==confirmation)throw new Error('A confirmação não corresponde à nova senha.');if(next===current)throw new Error('Escolha uma senha diferente da atual.');if(!current)throw new Error('Informe a senha atual.');
   button.disabled=true;
   const {error}=await client.auth.updateUser({password:next,current_password:current});
   if(error)throw new Error('Não foi possível alterar a senha. Confira a senha atual; se a sessão expirou ou requer nova verificação, entre novamente e tente outra vez.');
   form.reset();renderRules();document.dispatchEvent(new Event('password-updated'));status.textContent=demoMode?'Senha de demonstração alterada nesta aba. Recarregar restaura o acesso de teste.':'Senha alterada. Use a nova senha no próximo acesso.';
  }catch(error){status.textContent=error.message;}
  finally{form.elements.current_password.value='';button.disabled=false;}
 });
}
