// Executado antes dos estilos para evitar piscar o tema oposto.
(()=>{let theme;try{theme=localStorage.getItem('transcol-theme');}catch{}document.documentElement.dataset.theme=['light','dark'].includes(theme)?theme:matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';})();
