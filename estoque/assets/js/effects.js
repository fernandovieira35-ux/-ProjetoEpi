const sheet=document.createElement('link');sheet.rel='stylesheet';sheet.href='assets/css/efeitos.css';document.head.append(sheet);
const strip=document.createElement('aside');strip.className='fleet--strip';strip.setAttribute('aria-label','Frota Transcol');
const copy=document.createElement('p'),title=document.createElement('strong');title.textContent='Proteção para quem move a Transcol';copy.append(title,document.createTextNode('Cuidado com a equipe em cada entrega.'));
const photos=document.createElement('div');photos.className='fleet--photos';
for(const [file,alt]of [['transcol-frota.webp','Caminhões da frota Transcol na rodovia.'],['transcol-caminhao.jpeg','Caminhão com a identidade da Transcol.']]){const img=document.createElement('img');img.src='assets/images/'+file;img.alt=alt;img.width=220;img.height=100;img.loading='lazy';photos.append(img);}
strip.append(copy,photos);document.getElementById('workspace').prepend(strip);
document.addEventListener('click',event=>{const target=event.target.closest('button,a');if(!target||target.disabled||matchMedia('(prefers-reduced-motion: reduce)').matches)return;target.classList.remove('click--feedback');void target.offsetWidth;target.classList.add('click--feedback');});
document.addEventListener('animationend',event=>{if(event.animationName==='click--glow')event.target.classList.remove('click--feedback');});
