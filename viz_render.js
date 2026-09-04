/* ============================================================
   VIZ RENDERERS — geram SVG/HTML inline por tipo.
   Usam a cor do pilar via var(--pc)/var(--pbg) do card.
   ============================================================ */
function renderViz(v, compact){
  if(!v) return '';
  const fn = VIZR[v.type];
  const inner = fn ? fn(v, compact) : '';
  const cap = v.caption ? `<figcaption class="viz-cap">${v.caption}</figcaption>` : '';
  return `<figure class="viz viz-${v.type}">${inner}${cap}</figure>`;
}
const esc = s => (''+s);

const VIZR = {
  /* horizontal bars */
  bars(v){
    const max = Math.max(...v.data.map(d=>d.v));
    return `<div class="v-bars">`+v.data.map(d=>{
      const w = Math.max(6, Math.round(d.v/max*100));
      const tag = d.tag?`<span class="v-tag">${d.tag}</span>`:'';
      return `<div class="v-bar-row"><span class="v-bar-l">${d.l}${tag}</span>
        <span class="v-bar-track"><span class="v-bar-fill ${d.hi?'hi':''}" style="width:${w}%"></span></span>
        <span class="v-bar-v">${d.v}${v.unit||''}</span></div>`;
    }).join('')+`</div>`;
  },
  /* from -> to migration */
  migration(v){
    return `<div class="v-mig">`+v.data.map(d=>{
      const up = d.to>=d.from;
      return `<div class="v-mig-row"><span class="v-mig-l">${d.l}</span>
        <span class="v-mig-vals"><b>${d.from}%</b><svg class="v-arrow ${up?'up':'down'}" viewBox="0 0 24 24"><path d="M5 12h12"/><path d="${up?'M13 6l6 6-6 6':'M13 18l6-6-6-6'}"/></svg><b class="${up?'up':'down'}">${d.to}%</b></span></div>`;
    }).join('')+`</div>`;
  },
  /* metric arrows (equity) */
  metrics(v){
    return `<div class="v-metrics">`+v.data.map(d=>{
      const up=d.dir==='up';
      return `<div class="v-metric ${up?'up':'down'}"><div class="v-metric-l">${d.l}</div>
        <div class="v-metric-vals">${d.from}<svg viewBox="0 0 24 24" class="${up?'up':'down'}"><path d="${up?'M7 14l5-5 5 5':'M7 10l5 5 5-5'}"/></svg>${d.to}</div></div>`;
    }).join('')+`</div>`;
  },
  /* Heineken vs Ambev paired bars */
  versus(v){
    const max = Math.max(...v.pairs.flatMap(p=>[p.a,p.b]));
    return `<div class="v-vs"><div class="v-vs-key"><span><i class="k-a"></i>${v.aLabel}</span><span><i class="k-b"></i>${v.bLabel}</span></div>`+
      v.pairs.map(p=>`<div class="v-vs-row"><span class="v-vs-l">${p.l}</span>
        <div class="v-vs-bars">
          <span class="v-vs-track"><span class="v-vs-fill a" style="width:${Math.round(p.a/max*100)}%"></span><em>${p.a}%</em></span>
          <span class="v-vs-track"><span class="v-vs-fill b" style="width:${Math.round(p.b/max*100)}%"></span><em>${p.b}%</em></span>
        </div></div>`).join('')+`</div>`;
  },
  /* narrowing funnel with leaks */
  funnel(v){
    const n=v.steps.length;
    return `<div class="v-funnel">`+v.steps.map((s,i)=>{
      const w=100-(i*(58/(n-1)));
      return `<div class="v-fn-step">
        <span class="v-fn-l">${s.l}</span>
        <span class="v-fn-note">${s.note||''}</span>
        <span class="v-fn-rail" style="width:${w}%"></span>
        ${s.leak?'<span class="v-fn-leak">ponto de fuga</span>':''}</div>`;
    }).join('')+`</div>`;
  },
  /* 2x2 matrix */
  matrix(v){
    const cell=(x,y)=>{const c=v.cells.find(c=>c.x===x&&c.y===y);return c?`<div class="v-mx-cell ${c.active?'on':''}">${c.l}</div>`:'<div class="v-mx-cell"></div>';};
    return `<div class="v-matrix">
      <div class="v-mx-yhi">${v.axisY[1]}</div>
      <div class="v-mx-grid">${cell(0,1)}${cell(1,1)}${cell(0,0)}${cell(1,0)}</div>
      <div class="v-mx-ylo">${v.axisY[0]}</div>
      <div class="v-mx-x"><span>${v.axisX[0]}</span><span>${v.axisX[1]}</span></div>
    </div>`;
  },
  /* fridge planogram */
  planogram(v){
    return `<div class="v-plano"><div class="v-plano-body">`+v.shelves.map(sh=>
      `<div class="v-shelf"><div class="v-shelf-tag"><b>${sh.tier}</b><span>${sh.label}</span></div>
        <div class="v-shelf-items">`+sh.items.map(it=>`<span class="v-sku ${it.c}">${it.n}</span>`).join('')+`</div></div>`
    ).join('')+`</div></div>`;
  },
  /* ladder / vertical numbered steps */
  steps(v){
    return `<div class="v-steps">`+v.steps.map((s,i)=>
      `<div class="v-step"><span class="v-step-n">${i+1}</span><div class="v-step-tx"><b>${s.l}</b>${s.d?`<span>${s.d}</span>`:''}</div></div>`
    ).join('')+`</div>`;
  },
  /* horizontal journey */
  journey(v){
    return `<div class="v-journey">`+v.steps.map((s,i)=>
      `<div class="v-jn"><span class="v-jn-dot">${i+1}</span><span class="v-jn-l">${s.l}</span></div>`+
      (i<v.steps.length-1?'<span class="v-jn-line"></span>':'')
    ).join('')+`</div>`;
  },
  /* balance / trade-off scale */
  balance(v){
    const col=(s,side)=>`<div class="v-bal-col ${side}"><div class="v-bal-t">${s.title}</div>`+
      s.items.map(i=>`<span class="v-bal-i">${i}</span>`).join('')+`</div>`;
    return `<div class="v-balance">${col(v.left,'l')}<div class="v-bal-mid"><svg viewBox="0 0 24 24"><path d="M12 3v18M4 8h16M4 8l-2 5a3 3 0 0 0 6 0zM20 8l-2 5a3 3 0 0 0 6 0z"/></svg></div>${col(v.right,'r')}</div>`;
  },
  /* pack occasion map */
  packmap(v){
    const ic={bottle:'<svg viewBox="0 0 24 24"><path d="M10 2h4v3l1 2v13a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V7l1-2V2z"/></svg>',
      share:'<svg viewBox="0 0 24 24"><circle cx="7" cy="12" r="3"/><circle cx="17" cy="6" r="3"/><circle cx="17" cy="18" r="3"/><path d="M9.5 10.5l5-3M9.5 13.5l5 3"/></svg>',
      can:'<svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="18" rx="2"/><path d="M8 7h8"/></svg>',
      jug:'<svg viewBox="0 0 24 24"><path d="M7 6h8v13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6z"/><path d="M15 9h2a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2"/><path d="M7 4h8v2H7z"/></svg>',
      draft:'<svg viewBox="0 0 24 24"><path d="M6 8h9v9a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8z"/><path d="M15 10h3l2-3"/><path d="M6 8V6a2 2 0 0 1 2-2h5"/></svg>'};
    return `<div class="v-packmap">`+v.packs.map(p=>
      `<div class="v-pack"><span class="v-pack-ic">${ic[p.ic]||ic.bottle}</span><b>${p.n}</b><span class="v-pack-o">${p.o}</span></div>`
    ).join('')+`</div>`;
  },
  /* donut share */
  donut(v){
    const tot=v.segments.reduce((a,b)=>a+b.v,0);let acc=0;const R=42,C=2*Math.PI*R;
    const segs=v.segments.map((s,i)=>{const frac=s.v/tot;const dash=frac*C;const off=acc*C;acc+=frac;
      return `<circle r="${R}" cx="60" cy="60" fill="none" stroke="var(--dc${i%6})" stroke-width="16" stroke-dasharray="${dash} ${C-dash}" stroke-dashoffset="${-off}" transform="rotate(-90 60 60)"/>`;}).join('');
    const leg=v.segments.map((s,i)=>`<span class="v-dl"><i style="background:var(--dc${i%6})"></i>${s.l}</span>`).join('');
    return `<div class="v-donut"><svg viewBox="0 0 120 120">${segs}<circle r="30" cx="60" cy="60" fill="var(--card)"/></svg><div class="v-donut-leg">${leg}</div></div>`;
  },
  /* photo placeholder */
  photo(v){
    const src = (typeof IMG!=='undefined' && v.img && IMG[v.img]) ? IMG[v.img] : null;
    if(src) return `<div class="v-photo-real"><img src="${src}" alt=""></div>`;
    return `<div class="v-photo"><svg viewBox="0 0 24 24" class="v-cam"><rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-2.5h5L16 7"/></svg><span class="v-photo-cap">${v.sub||'Imagem'}</span></div>`;
  },
  /* personas — clean list rows */
  personas(v){
    return `<div class="v-personas">`+v.people.map(p=>
      `<div class="v-persona"><span class="v-avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg></span>`+
      `<div class="v-persona-tx"><b>${p.n}</b><span>${p.t.join(' · ')}</span></div></div>`
    ).join('')+`</div>`;
  },
  /* checklist */
  checklist(v){
    return `<div class="v-check">`+v.items.map(i=>
      `<div class="v-check-i"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>${i}</div>`
    ).join('')+`</div>`;
  }
};
