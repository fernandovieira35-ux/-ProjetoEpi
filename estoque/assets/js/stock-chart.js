const $=id=>document.getElementById(id);
const colors=['#dc3545','#2674c4','#178577','#bd730d','#855ac1','#bc4784','#527a28'];
const format=n=>n.toLocaleString('pt-BR',{maximumFractionDigits:1});
function svgNode(tag,attrs={}){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el;}
export function renderStockChart(items,categories){
 const unit=$('stock-chart-unit').value,type=$('stock-chart-type').value,container=$('chart');container.replaceChildren();
 const totals=categories.map(c=>({name:c.name,total:items.filter(i=>i.category_id===c.id&&(!unit||i.unit===unit)).reduce((sum,i)=>sum+i.balance,0)}));
 const sum=totals.reduce((s,c)=>s+c.total,0),max=Math.max(1,...totals.map(c=>c.total));
 $('stock-chart-summary').textContent=`${format(sum)} ${unit||'quantidades (unidades, pares e caixas somados)'} · ${totals.length} categorias autorizadas. ${unit?'':'Selecione uma unidade para comparar quantidades equivalentes.'}`;
 if(!totals.length){container.textContent='Nenhuma categoria disponível para seu usuário.';return;}
 if(!sum){const notice=document.createElement('p');notice.textContent='Sem saldo disponível para o filtro selecionado.';container.append(notice);}
 if(type==='bars'){
  for(const c of totals){const row=document.createElement('div');row.className='chart--row';const name=document.createElement('span');name.textContent=c.name;const meter=document.createElement('meter');meter.min=0;meter.max=max;meter.value=c.total;meter.setAttribute('aria-label',`${c.name}: ${format(c.total)}`);const count=document.createElement('strong');count.textContent=format(c.total);row.append(name,meter,count);container.append(row);}return;
 }
 const layout=document.createElement('div');layout.className='stock--chart--layout';container.append(layout);
 if(sum){
  const svg=svgNode('svg',{viewBox:'0 0 360 300',role:'img','aria-label':`Estoque por categoria: ${$('stock-chart-type').selectedOptions[0].textContent}. Valores detalhados na legenda.`});svg.classList.add('stock--chart--visual');
  if(type==='columns'){
   svg.append(svgNode('line',{x1:20,y1:260,x2:340,y2:260,stroke:'currentColor'}));
   const step=320/totals.length;
   totals.forEach((c,i)=>{const height=c.total/max*210;const rect=svgNode('rect',{x:20+i*step+step*.15,y:260-height,width:step*.7,height,fill:colors[i%colors.length]});const title=svgNode('title');title.textContent=`${c.name}: ${format(c.total)}`;rect.append(title);svg.append(rect);const label=svgNode('text',{x:20+(i+.5)*step,y:280,'text-anchor':'middle',fill:'currentColor','font-size':12});label.textContent=String(i+1);svg.append(label);});
  }else{
   let angle=-Math.PI/2;
   totals.forEach((c,i)=>{if(!c.total)return;const end=angle+c.total/sum*2*Math.PI;let piece;
    if(c.total===sum)piece=svgNode('circle',{cx:180,cy:150,r:125,fill:colors[i%colors.length]});
    else piece=svgNode('path',{d:`M180 150 L${180+125*Math.cos(angle)} ${150+125*Math.sin(angle)} A125 125 0 ${end-angle>Math.PI?1:0} 1 ${180+125*Math.cos(end)} ${150+125*Math.sin(end)} Z`,fill:colors[i%colors.length],stroke:'var(--color-surface)','stroke-width':2});
    const title=svgNode('title');title.textContent=`${c.name}: ${format(c.total)} (${format(c.total/sum*100)}%)`;piece.append(title);svg.append(piece);angle=end;
   });
   if(type==='donut'){svg.append(svgNode('circle',{cx:180,cy:150,r:76,fill:'var(--color-surface)'}));const label=svgNode('text',{x:180,y:158,'text-anchor':'middle',fill:'currentColor','font-size':24});label.textContent=format(sum);svg.append(label);}
  }
  layout.append(svg);
 }
 const legend=document.createElement('ol');legend.className='stock--chart--legend';legend.setAttribute('aria-label','Valores por categoria');
 totals.forEach((c,i)=>{const li=document.createElement('li'),swatch=svgNode('svg',{viewBox:'0 0 12 12','aria-hidden':'true'});swatch.append(svgNode('rect',{width:12,height:12,rx:3,fill:colors[i%colors.length]}));const label=document.createElement('span');label.textContent=`${i+1}. ${c.name}`;const value=document.createElement('strong');value.textContent=`${format(c.total)} · ${format(sum?c.total/sum*100:0)}%`;li.append(swatch,label,value);legend.append(li);});layout.append(legend);
}
