const $=id=>document.getElementById(id);
export function clearMfaSetup(){
 $('mfa-qr').removeAttribute('src');$('mfa-qr').hidden=true;
 $('mfa-qr-toggle').hidden=true;$('mfa-qr-toggle').textContent='Ocultar QR Code';$('mfa-secret').textContent='';$('mfa-manual').open=false;$('mfa-setup').hidden=true;
}
export function showMfaSetup(totp){
 clearMfaSetup();const image=$('mfa-qr'),qr=totp.qr_code||'';
 const source=qr.trim().startsWith('<svg')?`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qr)}`:/^data:image\/svg\+xml[;,]/i.test(qr)?qr:null;
 $('mfa-secret').textContent=totp.secret||'';
 if(source){image.onerror=()=>{image.hidden=true;image.removeAttribute('src');$('mfa-manual').open=true;};image.src=source;image.hidden=false;$('mfa-qr-toggle').hidden=false;}
 else $('mfa-manual').open=true;
 $('mfa-setup').hidden=false;
}
