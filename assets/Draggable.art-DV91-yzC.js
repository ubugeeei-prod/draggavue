import{B as e,C as t,D as n,E as r,F as i,G as a,I as o,K as s,L as c,M as l,N as u,R as d,S as f,V as p,W as m,_ as h,a as g,b as _,c as v,d as y,f as b,g as x,h as S,i as C,j as w,k as T,l as E,m as D,n as O,o as k,p as A,r as j,s as M,t as N,u as P,x as F,y as I,z as L}from"./styles-DqHsZ62y.js";var R={axis:`both`,grid:null,bounds:null,activationDistance:F(0)},z=(e,t)=>{if(e===`parent`){let e=t.parentElement;return e===null?null:j(e)}return O(e)?j(e):e},B=(e,t,n)=>{let r=a(e),i=a(t)??null;if(r==null||i===null)return null;let o=z(i,r);if(o===null)return null;let s=j(r);return{rect:{left:F(o.left-(s.left-n.x)),top:F(o.top-(s.top-n.y)),width:o.width,height:o.height},size:{width:s.width,height:s.height}}},V=(e,t,n)=>({axis:a(t.axis)??`both`,grid:a(t.grid)??null,bounds:B(e,t.bounds,n),activationDistance:F(a(t.activationDistance)??0)}),H=e=>e.status===`dragging`&&e.source===`keyboard`;function U(e,n){let i=n.a11y===!1?null:{...h,...n.a11y},a=n.keyboard===!1?null:{...I,...n.keyboard===!0?void 0:n.keyboard},o=m(null);l(()=>{i!==null&&a!==null&&(o.value=t(i.instructions))});let s=r(()=>{let t={"data-draggavue":``,...e.getState().status===`dragging`?{"data-dragging":`true`}:{}};return a===null?t:{...t,role:`button`,tabindex:0,"aria-roledescription":(i??h).roleDescription,...o.value===null?{}:{"aria-describedby":o.value}}});function c(e){if(i!==null)switch(e.effect){case`none`:return;case`started`:f(i.grabbed(x(e.session.origin,e.session.delta)));return;case`moved`:e.session.source===`keyboard`&&f(i.moved(x(e.session.origin,e.session.delta)));return;case`committed`:f(i.dropped(e.position));return;case`canceled`:f(i.canceled(e.position))}}function u(t){if(a===null||e.isDisabled())return;let n=H(e.getState()),r=_(t.key,t.shiftKey,n,a);if(r.kind!==`none`)switch(t.key!==`Tab`&&t.preventDefault(),r.kind){case`grab`:e.grab();return;case`drop`:e.drop();return;case`move`:e.moveBy(r.delta.dx,r.delta.dy);return;case`cancel`:e.cancel()}}function d(){H(e.getState())&&e.cancel()}return{attrs:s,announceTransition:c,onKeydown:u,onFocusout:d}}function W(t,n={}){let{initialPosition:i=S}=n,o=m(M),s=n.position??m(i),c=r(()=>o.value.status===`dragging`),l=r(()=>{let e=o.value;return e.status===`dragging`?x(e.origin,e.delta):s.value}),u=r(()=>{let{x:e,y:t}=l.value,n=`translate3d(${e}px, ${t}px, 0)`;return c.value?{transform:n,willChange:`transform`}:{transform:n}}),f=R,h=!1,_=N({onMove:(e,t)=>{if(w()){I();return}T(b(o.value,t,e,f))},onUp:e=>{T(D(o.value,e))},onCancel:()=>{I()}});function w(){return a(n.disabled)??!1}function T(e){switch(o.value=e.state,e.state.status===`idle`&&j(),L.announceTransition(e),e.effect){case`none`:return;case`started`:k(),h=!0,n.onDragStart?.(e.session);return;case`moved`:n.onDragMove?.(e.session);return;case`committed`:s.value=e.position,n.onDragEnd?.(e.position);return;case`canceled`:n.onDragCancel?.(e.position)}}function O(e){w()||e.button!==0||o.value.status===`idle`&&(f=V(t,n,s.value),_.begin(),T(A(o.value,e.pointerId,s.value,C(e),f)))}function j(){_.end(),h&&=(g(),!1)}function I(){T(v(o.value)),o.value.status===`idle`&&j()}let L=U({getState:()=>o.value,isDisabled:w,grab:()=>{o.value.status===`idle`&&(f=V(t,n,s.value),T(P(o.value,s.value)))},moveBy:(e,t)=>{T(y(o.value,{dx:F(e),dy:F(t)},f))},drop:()=>{T(E(o.value))},cancel:I},n);return d(r(()=>a(n.handle)??a(t)??null),(e,t,n)=>{if(e===null)return;let r=new AbortController,i=e,{signal:a}=r;i.addEventListener(`pointerdown`,O,{signal:a}),i.addEventListener(`keydown`,L.onKeydown,{signal:a}),i.addEventListener(`focusout`,L.onFocusout,{signal:a});let o=e.style,s=o.touchAction;o.touchAction=`none`,n(()=>{r.abort(),o.touchAction=s})},{immediate:!0,flush:`post`}),e()&&p(j),{position:l,state:r(()=>o.value),isDragging:c,style:u,attrs:L.attrs,setPosition:e=>{s.value=e},reset:()=>{s.value=i},cancel:I}}var G={__name:`Draggable`,props:{tag:{type:String,required:!1},position:{type:Object,required:!1},initialPosition:{type:Object,required:!1},axis:{type:String,required:!1},grid:{type:[Array,null],required:!1},bounds:{type:null,required:!1},disabled:{type:Boolean,required:!1},activationDistance:{type:Number,required:!1},keyboard:{type:null,required:!1},a11y:{type:null,required:!1}},emits:[`drag:start`,`drag:move`,`drag:end`,`drag:cancel`,`update:position`],setup(e,{expose:t,emit:a}){let l=a,d=e,f=c(`root`),p=m(d.position??d.initialPosition??S),h=W(f,{position:r({get:()=>d.position??p.value,set:e=>{p.value=e,l(`update:position`,e)}}),initialPosition:d.position??d.initialPosition??S,axis:()=>d.axis,grid:()=>d.grid,bounds:()=>d.bounds,disabled:()=>d.disabled,activationDistance:()=>d.activationDistance,keyboard:d.keyboard,a11y:d.a11y,onDragStart:e=>l(`drag:start`,e),onDragMove:e=>l(`drag:move`,e),onDragEnd:e=>l(`drag:end`,e),onDragCancel:e=>l(`drag:cancel`,e)}),g=h.position,_=h.state,v=h.isDragging,y=h.style,b=h.attrs,x=r(()=>d.tag??`div`);return t({element:f,setPosition:h.setPosition,reset:h.reset,cancel:h.cancel}),(e,t)=>(u(),n(o(x.value),w({ref_key:`root`,ref:f},s(b),{style:s(y)}),{default:L(()=>[i(e.$slots,`default`,{isDragging:s(v),position:s(g),state:s(_)})]),_:3},16,[`style`]))}},K=G,q=[`.musea-variant {
  /*
   * Ink on paper. Every value hangs off two decisions:
   *
   * ink is a near-black with a whisper of blue-violet (hue 272) —
   * pure gray reads as dead on screens, and the cool cast keeps
   * the demo neutral next to any brand color. paper sits at
   * L 0.985, not white: the cards need somewhere brighter to go.
   *
   * accent shares the ink's hue family (265) so it reads as "the
   * same light, brighter" — it appears only when the system is
   * responding to your hand.
   */
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

  /* System stack: the demo shows the library inside *your* app,
   * so it must not bring a voice of its own. 13px — tool-sized
   * text, one step below prose. */
  font:
    500 13px/1.5 ui-sans-serif,
    system-ui,
    sans-serif;
}

.track {
  /* inline-grid: the card hugs its content — a draggable should
   * look holdable, and full-width slabs don't. Columns: grip,
   * name (flexible), time. */
  display: inline-grid;
  grid-template-columns: auto 1fr auto;
  gap: 10px;
  align-items: center;
  min-width: 200px;
  padding: 10px 14px;

  /* The border is the boundary of what your hand owns: 1px of
   * function, not decoration. It is also the only hover response —
   * anything that *moves* on hover makes the target feel like it's
   * escaping the grab. */
  border: 1px solid var(--line);
  border-radius: 10px;
  background: var(--card);
  transition: border-color 160ms cubic-bezier(0.2, 0, 0, 1);

  &:hover {
    border-color: var(--line-hover);
  }

  /* While held, the boundary lights up in the accent: "this is in
   * your hand now". The shadow and scale come from lift.css. */
  &[data-dragging="true"] {
    border-color: color-mix(in oklab, var(--accent) 55%, var(--line));
  }
}

.grip {
  /* Six dots — the drag glyph screen readers skip and every hand
   * recognizes. Drawn with dotted borders so it inherits currentColor
   * and needs no asset. */
  width: 3px;
  height: 14px;
  border-inline: 2px dotted var(--ink-2);
  opacity: 0.65;
}

.name {
  letter-spacing: 0.01em;
}

.time {
  color: var(--ink-2);

  /* Coordinates and durations change while things move — tabular
   * digits keep the card's width from trembling. */
  font-variant-numeric: tabular-nums;
}

.loose {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.desk {
  /* A bounded stage is drawn dashed: the convention for "limits,
   * not walls" — content may touch it, nothing may pass it. */
  height: 176px;
  overflow: hidden;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
}

.rail {
  /* One-axis variant gets a one-axis stage: a strip as tall as the
   * card plus breathing room, so the constraint is visible before
   * the first drag. */
  overflow: hidden;
  padding: 12px;
  border: 1px dashed var(--line);
  border-radius: 12px;
}

.dotted {
  /* The grid the card snaps to, shown honestly: dots at the exact
   * 24px pitch of the constraint, faint enough to be furniture. */
  background-image: radial-gradient(circle, var(--line) 1px, transparent 1px);
  background-size: 24px 24px;
}

.hint {
  margin: 0 0 12px;
  color: var(--ink-2);
  font-weight: 400;

  & kbd {
    padding: 1px 6px;
    border: 1px solid var(--line);

    /* The thicker bottom edge is the entire keycap metaphor —
     * one border-width instead of a gradient. */
    border-bottom-width: 2px;
    border-radius: 5px;
    background: var(--card);
    font: inherit;
  }
}`],J=T({name:`Basic`,components:{Draggable:G},setup(){return{px:F,GRID:[F(24),F(24)]}},template:`<div data-variant="Basic"><p class="hint">Drag anywhere. Or focus it — <kbd>Space</kbd>, arrows, <kbd>Space</kbd>.</p>
    <Draggable class="track">
      <span class="grip" aria-hidden="true"></span>
      <span class="name">Overture</span>
      <span class="time">3:12</span>
    </Draggable></div>`}),Y=T({name:`MultipleDraggables`,components:{Draggable:G},setup(){return{px:F,GRID:[F(24),F(24)]}},template:`<div data-variant="Multiple draggables"><p class="hint">Each card is its own session — try two fingers on touch.</p>
    <div class="loose">
      <Draggable class="track">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Overture</span>
        <span class="time">3:12</span>
      </Draggable>
      <Draggable class="track">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Interlude</span>
        <span class="time">1:47</span>
      </Draggable>
      <Draggable class="track">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Finale</span>
        <span class="time">5:21</span>
      </Draggable>
    </div></div>`}),X=T({name:`SpringSettle`,components:{Draggable:G},setup(){return{px:F,GRID:[F(24),F(24)]}},template:`<div data-variant="Spring settle"><p class="hint">Throw it somewhere, then press <kbd>Esc</kbd> — it springs home.</p>
    <Draggable class="track">
      <span class="grip" aria-hidden="true"></span>
      <span class="name">Crescendo</span>
      <span class="time">4:05</span>
    </Draggable></div>`}),Z=T({name:`InsideParentBounds`,components:{Draggable:G},setup(){return{px:F,GRID:[F(24),F(24)]}},template:`<div data-variant="Inside parent bounds"><div class="desk">
      <Draggable class="track" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Bounded</span>
        <span class="time">0:58</span>
      </Draggable>
    </div></div>`}),Q=T({name:`XAxisOnly`,components:{Draggable:G},setup(){return{px:F,GRID:[F(24),F(24)]}},template:`<div data-variant="X axis only"><div class="rail">
      <Draggable class="track" axis="x" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Slides on x</span>
      </Draggable>
    </div></div>`}),$=T({name:`SnapToA24pxGrid`,components:{Draggable:G},setup(){return{px:F,GRID:[F(24),F(24)]}},template:`<div data-variant="Snap to a 24px grid"><div class="desk dotted">
      <Draggable class="track" :grid="GRID" bounds="parent">
        <span class="grip" aria-hidden="true"></span>
        <span class="name">Snaps</span>
      </Draggable>
    </div></div>`}),ee=T({name:`ActivationDistance`,components:{Draggable:G},setup(){return{px:F,GRID:[F(24),F(24)]}},template:`<div data-variant="Activation distance"><p class="hint">Needs 12px of travel first — clicks inside stay clicks.</p>
    <Draggable class="track" :activation-distance="12">
      <span class="grip" aria-hidden="true"></span>
      <span class="name">Deliberate</span>
      <span class="time">2:33</span>
    </Draggable></div>`});export{$ as a,K as c,Y as i,q as l,J as n,X as o,Z as r,Q as s,ee as t};