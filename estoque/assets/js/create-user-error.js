export async function createUserError(error){
 const status=error.context?.status;let code;
 try{code=(await error.context.clone().json()).code;}catch{}
 if(status===404)return 'O serviço create-user não está publicado no Supabase. Publique a Edge Function antes de criar acessos.';
 if(code==='PROFILE_NOT_READY')return 'O login foi criado, mas o perfil não foi confirmado. Não repita o cadastro. Confira a migração 011 no Supabase.';
 if(status===401)return 'Sessão não aceita pelo serviço de criação. Saia, entre novamente e confirme o segundo fator. Se persistir, confira a configuração JWT da função.';
 if(status===403)return 'Criação não autorizada. Confira o perfil administrador, o segundo fator e APP_ORIGIN da função.';
 if(status===429)return 'Muitas solicitações. Aguarde antes de tentar novamente.';
 if(error.name==='FunctionsFetchError')return 'Não foi possível alcançar create-user. Confira a publicação da função, a conexão e APP_ORIGIN (endereço autorizado do programa).';
 return 'Não foi possível confirmar a criação. Confira se o usuário já existe, a política de senha e os logs da função create-user antes de repetir.';
}
