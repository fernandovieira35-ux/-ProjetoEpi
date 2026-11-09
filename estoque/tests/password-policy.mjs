import assert from 'node:assert/strict';
import {requireStrongPassword,passwordChecks} from '../assets/js/password-policy.js';
for(const value of ['curta','apenasminusculas123!','APENASMAIUSCULAS123!','SemNumerosAqui!!','SemSimbolos1234',`Aa1!${'á'.repeat(40)}`])assert.throws(()=>requireStrongPassword(value));
assert.doesNotThrow(()=>requireStrongPassword('TesteLocal2026!'));assert.doesNotThrow(()=>requireStrongPassword('Aa1!'+ 'x'.repeat(68)));assert.throws(()=>requireStrongPassword('Aa1!'+ 'x'.repeat(69)));assert.equal(passwordChecks('TesteLocal2026!').every(([,ok])=>ok),true);
console.log('Política de senha: comprimento, classes e limite UTF-8 aprovados.');
