# Imagens e referência visual

## Atualização da frota

O banner agora usa a fotografia original `transcol-caminhao.jpeg`, obtida em https://transcolgo.com.br/wp-content/uploads/2026/09/WhatsApp-Image-2026-09-01-at-20.56.33-4.jpeg, com veículos e logotipos originais. A foto de rodovia permanece original. A imagem anterior `motoristas-epi.png` foi preservada, mas não é mais exibida.

`motoristas-transcol-epi.png` é uma composição ilustrativa editada com imagegen integrado, tendo a cena anterior como alvo e a foto do pátio/logotipo como referências. Não é fotografia de um veículo real específico. A apresentação mantém o caminhão inteiro e os logotipos visíveis, sem corte por preenchimento.

Prompt final da edição:

> Edit target: first image, existing illustrative scene of two drivers in PPE. Reference image 2: real Transcol fleet and depot, vehicle appearance reference. Reference image 3: exact Transcol logo. Preserve both people, their faces, helmets, glasses, orange reflective vests and gloves. Replace the generic unmarked white truck behind them with a Transcol branded white rigid box truck matching the white vehicles in reference 2, with the original red TRANSCol/TRANSCOL branding and diagonal red/black livery clearly visible on the box side and a small company logo on the cab door, based on reference 3. Position the truck on the left, both people on right. Show enough truck side so the TRANSCOL logo is unobscured and legible. Do not invent extra vehicles or logos. Photorealistic illustrative composite, matching original warm daylight, wide landscape aspect ratio. No captions or watermarks.

Identidade inspirada no site https://transcolgo.com.br/, consultado em 2026-11-08: vermelho `#C8202F`, grafite `#262626`, branco, fotografias de transporte e navegação escura. Logotipo e foto institucional usados no contexto da personalização para a Transcol solicitada pelo usuário; direitos das marcas e imagens permanecem com seus titulares.

- `transcol-logo.webp`: https://transcolgo.com.br/wp-content/uploads/2026/09/img-site-75-2.webp
- `transcol-frota.webp`: https://transcolgo.com.br/wp-content/uploads/2026/10/imagem_2026-10-31_152217383.webp
- `motoristas-epi.png`: gerada com a ferramenta integrada imagegen. Personagens ilustrativos; não são apresentados como funcionários reais. Cópia local usada no banner e no cartão de segurança.

Prompt final usado (modo integrado, sem CLI):

> Use case: photorealistic-natural. Asset type: wide hero photograph for a Brazilian transport company's employee PPE inventory web application. Primary request: two adult Brazilian truck drivers, one man and one woman, wearing navy long-sleeve work uniforms, orange reflective high-visibility vests, white safety helmets, clear safety glasses and work gloves, standing safely beside a parked white freight truck at a clean logistics yard. Natural candid professional photography, authentic faces, realistic hands and protective equipment, late afternoon light. Wide landscape composition, subjects on the right half, truck and warehouse visible on the left with room for a dark text overlay added later by code. No lettering, no brand logos, no watermark. This is an illustrative scene, not real company employees.

Todos os recursos são servidos localmente. Não foram incorporados rastreadores, scripts, cookies ou fontes externas do site de referência. Efeitos em CSS são finitos ou acionados por interação; `prefers-reduced-motion` desativa animações e transições. Imagens decorativas são removidas da impressão.

Verificação executada: suíte existente de navegador aprovada em 320/390/1440 px; inspeção visual das telas de acesso em 390/1440 px; todas as imagens carregadas; ausência de transbordamento horizontal; animação computada `none` com movimento reduzido; banner oculto na impressão. Autenticação dos testes continua simulada, como documentado no projeto.
