import{B as e,C as t,D as n,E as r,F as i,G as a,I as o,K as s,L as c,M as l,N as u,O as d,P as f,R as p,S as m,T as h,U as g,V as _,W as v,a as y,b,c as x,d as S,f as C,h as w,i as ee,j as T,k as E,l as te,m as ne,n as D,o as O,p as k,r as A,s as re,t as ie,u as ae,v as j,x as M,y as N,z as P}from"./styles-DqHsZ62y.js";var oe=(e,t,n)=>{if(t===n||t<0||t>=e.length||n<0||n>=e.length)return e;let r=[...e],[i]=r.splice(t,1);return i===void 0?e:(r.splice(n,0,i),r)},F=(e,t)=>t===`vertical`?e.top:e.left,I=(e,t)=>t===`vertical`?e.height:e.width,se=(e,t,n)=>{let r=e.map(e=>M(F(e,t)+I(e,t)/2)),i=e[n],a=e[n+1]??e[n-1],o=i===void 0?0:I(i,t),s=i===void 0||a===void 0?0:Math.abs(F(a,t)-F(i,t))-o;return{orientation:t,centers:r,shift:M(o+Math.max(0,s))}},L=(e,t,n)=>{let r=e.centers[t];if(r===void 0)return t;let i=r+n;for(let n=0;n<t;n+=1){let t=e.centers[n];if(t!==void 0&&i<t)return n}for(let n=e.centers.length-1;n>t;--n){let t=e.centers[n];if(t!==void 0&&i>t)return n}return t},R=(e,t,n,r)=>M(t<n&&e>t&&e<=n?-r:n<t&&e>=n&&e<t?r:0),z=(e,t)=>t===`vertical`?e.dy:e.dx,B=(e,t)=>{let n=z(e,t);return n<0?-1:+(n>0)},V={touchAction:`none`},H=(e,t)=>e.orientation===`vertical`?`translate3d(0, ${t}px, 0)`:`translate3d(${t}px, 0, 0)`,U=(e,t,n,r,i)=>{if(t===null||n===null)return V;if(e===t.from)return{touchAction:`none`,transform:H(n,t.offset),transition:`none`,willChange:`transform`,zIndex:1,position:`relative`};let a={touchAction:`none`,transform:H(n,R(e,t.from,t.to,n.shift))};return r===null||i?a:{...a,transition:r}},W=(e,t,n)=>{let r={"data-draggavue-index":e,...t?.from===e?{"data-dragging":`true`}:{}};return n.keyboardEnabled?{...r,role:`button`,tabindex:0,"aria-roledescription":n.roleDescription,...n.instructionsId===null?{}:{"aria-describedby":n.instructionsId}}:r},G={axis:`y`,grid:null,bounds:null,activationDistance:M(0)};function K(n,i){let o=i.a11y===!1?null:{...j,...i.a11y},s=i.keyboard!==!1,c=i.transition===!1?null:i.transition??`transform 180ms var(--dv-ease, ease)`,u=v(null),d=r(()=>u.value!==null),f=re,h=null,g=G,T=-1,E=!1,P=!1,F=v(null);l(()=>{o!==null&&s&&(F.value=t(o.instructions))});function I(){return a(i.disabled)??!1}function R(e){e!==null&&m(e)}let V=ie({onMove:(e,t)=>{if(I()){Y();return}K(C(f,t,e,g))},onUp:e=>{K(ne(f,e))},onCancel:()=>{Y()}});function H(e){let t=a(n);if(t==null)return!1;let r=[];for(let e of t.querySelectorAll(`:scope > [data-draggavue-index]`))r[Number(e.getAttribute(`data-draggavue-index`))]=e;if(r.length===0)return!1;let o=a(i.orientation)??`vertical`;return h=se(r.map(A),o,e),g={...G,axis:o===`vertical`?`y`:`x`,activationDistance:M(a(i.activationDistance)??0)},E=window.matchMedia(`(prefers-reduced-motion: reduce)`).matches,T=e,!0}function K(e){switch(f=e.state,f.status===`idle`&&J(),e.effect){case`none`:return;case`started`:O(),P=!0,u.value={from:T,to:T,offset:M(0)},R(o&&o.grabbed(T+1,q())),i.onSortStart?.({from:T,to:T});return;case`moved`:{let t=u.value;if(t===null||h===null||e.session.source===`keyboard`)return;let n=M(z(e.session.delta,h.orientation)),r=L(h,t.from,n),a=r!==t.to;u.value={from:t.from,to:r,offset:n},a&&(R(o&&o.moved(r+1,q())),i.onSortMove?.({from:t.from,to:r}));return}case`committed`:{let e=u.value;if(e===null)return;if(u.value=null,e.from!==e.to){let t={from:e.from,to:e.to};i.onReorder(oe(a(i.items),e.from,e.to),t)}R(o&&o.dropped(e.from+1,e.to+1)),i.onSortEnd?.({from:e.from,to:e.to});return}case`canceled`:{let e=u.value;if(e===null)return;u.value=null,R(o&&o.canceled(e.from+1)),i.onSortCancel?.({from:e.from,to:e.from})}}}function q(){return h===null?0:h.centers.length}function J(){V.end(),P&&=(y(),!1)}function Y(){K(x(f)),f.status===`idle`&&J()}function X(e){let t=a(n);if(t==null||!D(e.target))return null;let r=e.target.closest(`[data-draggavue-index]`);if(r===null||r.parentElement!==t)return null;let i=Number(r.getAttribute(`data-draggavue-index`));return Number.isInteger(i)?i:null}function Z(e){if(I()||e.button!==0||f.status!==`idle`)return;let t=X(e);t===null||!H(t)||(V.begin(),K(k(f,e.pointerId,w,ee(e),g)))}function Q(e){if(!s||I())return;let t=X(e);if(t===null)return;let n=f.status===`dragging`&&f.source===`keyboard`,r=b(e.key,e.shiftKey,n,N);if(r.kind!==`none`)switch(e.key!==`Tab`&&e.preventDefault(),r.kind){case`grab`:if(f.status!==`idle`||!H(t))return;K(ae(f,w));return;case`drop`:K(te(f));return;case`move`:$(r.delta);return;case`cancel`:Y()}}function $(e){let t=u.value;if(t===null||h===null)return;let n=B(e,h.orientation),r=Math.min(Math.max(t.to+n,0),h.centers.length-1),a=h.centers[t.from],s=h.centers[r];if(n===0||r===t.to||a===void 0||s===void 0)return;let c=M(s-a),l=h.orientation===`vertical`?{dx:M(0),dy:M(c-t.offset)}:{dx:M(c-t.offset),dy:M(0)};K(S(f,l,g)),u.value={from:t.from,to:r,offset:c},R(o&&o.moved(r+1,q())),i.onSortMove?.({from:t.from,to:r})}function ce(){f.status===`dragging`&&f.source===`keyboard`&&Y()}return p(r(()=>a(n)??null),(e,t,n)=>{if(e===null)return;let r=new AbortController,i=e,{signal:a}=r;i.addEventListener(`pointerdown`,Z,{signal:a}),i.addEventListener(`keydown`,Q,{signal:a}),i.addEventListener(`focusout`,ce,{signal:a}),n(()=>{r.abort()})},{immediate:!0,flush:`post`}),e()&&_(J),{active:r(()=>u.value),isSorting:d,itemStyle:e=>U(e,u.value,h,c,E),itemAttrs:e=>W(e,u.value,{keyboardEnabled:s,roleDescription:(o??j).roleDescription,instructionsId:F.value}),cancel:Y}}var q={__name:`SortableList`,props:{items:{type:Array,required:!0},itemKey:{type:Function,required:!0},tag:{type:String,required:!1},itemTag:{type:String,required:!1},orientation:{type:String,required:!1},disabled:{type:Boolean,required:!1},activationDistance:{type:Number,required:!1},transition:{type:[String,Boolean],required:!1},keyboard:{type:Boolean,required:!1},a11y:{type:null,required:!1}},emits:[`update:items`,`sort:start`,`sort:move`,`sort:end`,`sort:cancel`],setup(e,{expose:t,emit:a}){let l=a,p=e,m=c(`list`),g=K(m,{items:()=>p.items,onReorder:(e,t)=>l(`update:items`,e,t),orientation:()=>p.orientation,disabled:()=>p.disabled,activationDistance:()=>p.activationDistance,transition:p.transition,keyboard:p.keyboard,a11y:p.a11y,onSortStart:e=>l(`sort:start`,e),onSortMove:e=>l(`sort:move`,e),onSortEnd:e=>l(`sort:end`,e),onSortCancel:e=>l(`sort:cancel`,e)}),_=g.active,v=g.itemStyle,y=g.itemAttrs,b=r(()=>p.tag??`ul`),x=r(()=>p.itemTag??`li`),S=r(()=>p.items);function C(e){return p.itemKey(e)}return t({element:m,cancel:g.cancel,isSorting:g.isSorting}),(e,t)=>(u(),n(o(b.value),{ref_key:`list`,ref:m},{default:P(()=>[(u(!0),d(h,null,f(S.value,(t,r)=>(u(),n(o(x.value),T({key:C(t)},s(y)(r),{style:s(v)(r)}),{default:P(()=>[i(e.$slots,`item`,{item:t,index:r,isDragging:s(_)?.from===r})]),_:2},1040,[`style`]))),128))]),_:3},512))}},J=q,Y=[`.musea-variant {
  /* Same ink-on-paper tokens as the Draggable stories — one
   * product, one light. See Draggable.art.vue for the reasoning
   * behind each value. */
  --ink: oklch(0.28 0.022 272);
  --ink-2: oklch(0.51 0.02 272);
  --line: oklch(0.9 0.008 272);
  --line-hover: oklch(0.82 0.012 272);
  --paper: oklch(0.985 0.002 272);
  --card: oklch(1 0 0);
  --accent: oklch(0.54 0.19 265);

  padding: 24px;
  background: var(--paper);
  color: var(--ink);
  font:
    500 13px/1.5 ui-sans-serif,
    system-ui,
    sans-serif;
}

.setlist {
  display: grid;

  /* 6px, tighter than the free cards' 12px: rows of one list are
   * siblings, and the gap must say so. Wide gaps read as separate
   * things — bad for a list you reorder as a whole. */
  gap: 6px;
  width: 288px;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    display: grid;
    grid-template-columns: auto auto 1fr auto;
    gap: 10px;
    align-items: center;
    padding: 9px 12px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--card);
    transition: border-color 160ms cubic-bezier(0.2, 0, 0, 1);

    /* Hover answers only at the boundary (see Draggable stories:
     * nothing may move under an approaching pointer). */
    &:hover {
      border-color: var(--line-hover);
    }

    &[data-dragging="true"] {
      border-color: color-mix(in oklab, var(--accent) 55%, var(--line));
    }
  }
}

.springy :deep(li) {
  /* styles/spring.css, reproduced as scoped custom properties —
   * which is itself the demo: the whole preset is variables, so a
   * subtree opt-in is just this. */
  --dv-ease: linear(
    0,
    0.32 5.8%,
    0.674 11.6%,
    0.892 16.5%,
    1.047 22%,
    1.116 27.6%,
    1.118 32.4%,
    1.077 38.8%,
    1.01 49.5%,
    0.985 57.5%,
    0.993 66.9%,
    1.001 80.4%,
    1
  );
}

.days {
  display: flex;
  gap: 24px;
}

.day {
  /* An eyebrow, not a heading: uppercase at 11px with wide
   * tracking marks a column label without stealing weight from
   * the rows it labels. */
  margin: 0 0 8px;
  color: var(--ink-2);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.stops {
  display: flex;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;

  & :deep(li) {
    padding: 9px 14px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--card);
    transition: border-color 160ms cubic-bezier(0.2, 0, 0, 1);

    &:hover {
      border-color: var(--line-hover);
    }

    &[data-dragging="true"] {
      border-color: color-mix(in oklab, var(--accent) 55%, var(--line));
    }
  }
}

.grip {
  width: 3px;
  height: 14px;
  border-inline: 2px dotted var(--ink-2);
  opacity: 0.65;
}

.order {
  min-width: 14px;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.name {
  letter-spacing: 0.01em;
}

.time {
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

.hint {
  margin: 0 0 12px;
  color: var(--ink-2);
  font-weight: 400;

  & kbd {
    padding: 1px 6px;
    border: 1px solid var(--line);
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--card);
    font: inherit;
  }

  & code {
    font:
      400 12px ui-monospace,
      monospace;
  }
}`],X=E({name:`Setlist`,components:{SortableList:q},setup(){let e=()=>[{id:1,title:`Overture`,length:`3:12`},{id:2,title:`Interlude`,length:`1:47`},{id:3,title:`Crescendo`,length:`4:05`},{id:4,title:`Finale`,length:`5:21`}];return{ref:g,makeTracks:e,setlist:g(e()),springy:g(e()),saturday:g(e().slice(0,3)),sunday:g(e().slice(1)),stops:g(e().slice(0,3)),trackKey:e=>e.id}},template:`<div data-variant="Setlist"><p class="hint">Drag rows, or focus one — <kbd>Space</kbd>, arrows, <kbd>Space</kbd>.</p>
    <SortableList
      class="setlist"
      :items="setlist"
      :item-key="trackKey"
      @update:items="(next) => (setlist = next)"
    >
      <template #item="{ item, index }">
        <span class="grip" aria-hidden="true"></span>
        <span class="order">{{ index + 1 }}</span>
        <span class="name">{{ item.title }}</span>
        <span class="time">{{ item.length }}</span>
      </template>
    </SortableList></div>`}),Z=E({name:`SpringyNeighbors`,components:{SortableList:q},setup(){let e=()=>[{id:1,title:`Overture`,length:`3:12`},{id:2,title:`Interlude`,length:`1:47`},{id:3,title:`Crescendo`,length:`4:05`},{id:4,title:`Finale`,length:`5:21`}];return{ref:g,makeTracks:e,setlist:g(e()),springy:g(e()),saturday:g(e().slice(0,3)),sunday:g(e().slice(1)),stops:g(e().slice(0,3)),trackKey:e=>e.id}},template:`<div data-variant="Springy neighbors"><p class="hint">
      The same list with <code>styles/spring.css</code> physics, scoped to this subtree.
    </p>
    <SortableList
      class="setlist springy"
      :items="springy"
      :item-key="trackKey"
      @update:items="(next) => (springy = next)"
    >
      <template #item="{ item, index }">
        <span class="grip" aria-hidden="true"></span>
        <span class="order">{{ index + 1 }}</span>
        <span class="name">{{ item.title }}</span>
        <span class="time">{{ item.length }}</span>
      </template>
    </SortableList></div>`}),Q=E({name:`TwoIndependentLists`,components:{SortableList:q},setup(){let e=()=>[{id:1,title:`Overture`,length:`3:12`},{id:2,title:`Interlude`,length:`1:47`},{id:3,title:`Crescendo`,length:`4:05`},{id:4,title:`Finale`,length:`5:21`}];return{ref:g,makeTracks:e,setlist:g(e()),springy:g(e()),saturday:g(e().slice(0,3)),sunday:g(e().slice(1)),stops:g(e().slice(0,3)),trackKey:e=>e.id}},template:`<div data-variant="Two independent lists"><div class="days">
      <section>
        <h3 class="day">Saturday</h3>
        <SortableList
          class="setlist"
          :items="saturday"
          :item-key="trackKey"
          @update:items="(next) => (saturday = next)"
        >
          <template #item="{ item }">
            <span class="grip" aria-hidden="true"></span>
            <span class="name">{{ item.title }}</span>
          </template>
        </SortableList>
      </section>
      <section>
        <h3 class="day">Sunday</h3>
        <SortableList
          class="setlist"
          :items="sunday"
          :item-key="trackKey"
          @update:items="(next) => (sunday = next)"
        >
          <template #item="{ item }">
            <span class="grip" aria-hidden="true"></span>
            <span class="name">{{ item.title }}</span>
          </template>
        </SortableList>
      </section>
    </div></div>`}),$=E({name:`Horizontal`,components:{SortableList:q},setup(){let e=()=>[{id:1,title:`Overture`,length:`3:12`},{id:2,title:`Interlude`,length:`1:47`},{id:3,title:`Crescendo`,length:`4:05`},{id:4,title:`Finale`,length:`5:21`}];return{ref:g,makeTracks:e,setlist:g(e()),springy:g(e()),saturday:g(e().slice(0,3)),sunday:g(e().slice(1)),stops:g(e().slice(0,3)),trackKey:e=>e.id}},template:`<div data-variant="Horizontal"><SortableList
      class="stops"
      orientation="horizontal"
      :items="stops"
      :item-key="trackKey"
      @update:items="(next) => (stops = next)"
    >
      <template #item="{ item }">
        <span class="name">{{ item.title }}</span>
      </template>
    </SortableList></div>`});export{J as a,Q as i,X as n,Y as o,Z as r,$ as t};