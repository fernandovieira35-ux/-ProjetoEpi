export function passwordChecks(value){return [
 ['Pelo menos 12 caracteres',Array.from(value).length>=12],
 ['Uma letra maiúscula (A–Z)',/[A-Z]/.test(value)],
 ['Uma letra minúscula (a–z)',/[a-z]/.test(value)],
 ['Um número (0–9)',/[0-9]/.test(value)],
 ['Um símbolo, como ! @ # $ %',/[!@#$%^&*()_+\-=\[\]{};':"\\|<>?,./`~]/.test(value)],
 ['Até 72 bytes (letras acentuadas podem ocupar mais de um)',new TextEncoder().encode(value).length<=72]
 ];}
export function requireStrongPassword(value){if(typeof value!=='string'||passwordChecks(value).some(([,ok])=>!ok))throw new Error('A senha deve ter pelo menos 12 caracteres, maiúscula, minúscula, número e símbolo, até 72 bytes. Se sua senha antiga não atende, solicite a redefinição ao administrador.');}
