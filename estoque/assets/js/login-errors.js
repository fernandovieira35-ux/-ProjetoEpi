export function loginErrorMessage(error){
 if(error.code==='email_not_confirmed')return 'Confirme o e-mail do acesso no Supabase antes de entrar. Código: email_not_confirmed.';
 if(error.code==='user_banned')return 'O acesso está bloqueado no serviço de autenticação. Solicite a revisão ao administrador.';
 if(error.status===429||['over_request_rate_limit','over_email_send_rate_limit'].includes(error.code))return 'Muitas tentativas de acesso. Aguarde alguns minutos antes de tentar novamente.';
 if(error.name==='AuthRetryableFetchError'||error.status>=500)return 'Não foi possível acessar o serviço de autenticação. Verifique a conexão e tente novamente; isso não confirma senha inválida.';
 const code=/^[a-z0-9_]{1,60}$/.test(error.code||'')?` Código: ${error.code}.`:'';
 return 'Usuário ou senha inválidos, ou acesso não autorizado. Confira o usuário e use a senha mais recente. Cada recuperação substitui a senha anterior.'+code;
}
