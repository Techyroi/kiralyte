(function(){
  var RM=matchMedia('(prefers-reduced-motion:reduce)').matches,de=document.documentElement;
  /* split headings into words that rise in */
  document.querySelectorAll('.split').forEach(function(h){
    var n=0;
    (function wrap(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(c){
        if(c.nodeType===3){
          var f=document.createDocumentFragment();
          c.textContent.split(/(\s+)/).forEach(function(p){
            if(!p)return;
            if(/^\s+$/.test(p)){f.appendChild(document.createTextNode(' '));return}
            var o=document.createElement('span');o.className='wd';
            var w=document.createElement('span');w.className='wi';w.style.transitionDelay=(n++*70)+'ms';w.textContent=p;
            o.appendChild(w);f.appendChild(o);
          });
          node.replaceChild(f,c);
        }else if(c.nodeType===1&&c.classList.contains('ul')){
          var o2=document.createElement('span');o2.className='wd wd--ul';
          var w2=document.createElement('span');w2.className='wi';w2.style.transitionDelay=(n++*70)+'ms';
          node.insertBefore(o2,c);w2.appendChild(c);o2.appendChild(w2);
        }else if(c.nodeType===1&&c.tagName!=='BR'){wrap(c)}
      });
    })(h);
    h.classList.add('rv');
  });
  /* reveal on scroll (waits for preloader on the hero) */
  var els=document.querySelectorAll('.rv,.steps'),started=false;
  function reveal(){
    if(started)return;started=true;
    if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
    var io=new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting){en.target.classList.add('in');io.unobserve(en.target)}})},{threshold:.14,rootMargin:'0px 0px -6% 0px'});
    els.forEach(function(e){io.observe(e)});
  }
  /* preloader: counts to 100, splits open, releases hero animation */
  var pre=document.querySelector('.pre');
  function finish(){
    if(pre){pre.classList.add('out');de.style.overflow='';setTimeout(function(){pre&&pre.parentNode&&pre.parentNode.removeChild(pre)},1200)}
    try{sessionStorage.setItem('kPre','1')}catch(e){}
    reveal();
  }
  var shown=false;try{shown=sessionStorage.getItem('kPre')==='1'}catch(e){}
  if(!pre||shown||RM){if(pre)pre.style.display='none';reveal()}
  else{
    de.style.overflow='hidden';
    var pct=pre.querySelector('.pre__pct'),bar=pre.querySelector('.pre__trk i'),v=0,loaded=document.readyState==='complete',t0=Date.now(),done=false;
    addEventListener('load',function(){loaded=true});
    (function step(){
      var t=loaded?100:90,min=Date.now()-t0>1700;
      v+=(t-v)*(loaded&&min?.16:.05)+.3;if(v>t)v=t;
      pct.textContent=Math.round(v)+'%';bar.style.transform='scaleX('+v/100+')';
      if(v>=99.5&&min){pct.textContent='100%';if(!done){done=true;setTimeout(finish,250)}return}
      if(Date.now()-t0>4500){if(!done){done=true;finish()}return}
      requestAnimationFrame(step);
    })();
  }
  setTimeout(reveal,6000);
  /* header hide/show, scroll progress */
  var hh=document.querySelector('.hh'),tg=document.querySelector('.nav__toggle'),pg=document.querySelector('.prog'),last=0;
  function onS(){
    var y=scrollY,m=document.body.scrollHeight-innerHeight;
    hh.classList.toggle('is-scrolled',y>20);
    if(!hh.classList.contains('is-open'))hh.classList.toggle('is-hidden',y>last&&y>400);
    last=y;pg.style.transform='scaleX('+(m>0?y/m:0)+')';
  }
  addEventListener('scroll',onS,{passive:true});onS();
  tg.addEventListener('click',function(){var o=hh.classList.toggle('is-open');hh.classList.remove('is-hidden');tg.setAttribute('aria-expanded',o)});
  document.querySelectorAll('.nav__menu a').forEach(function(a){a.addEventListener('click',function(){hh.classList.remove('is-open');tg.setAttribute('aria-expanded','false')})});
  /* parallax on photos */
  var par=document.querySelectorAll('[data-par]'),tick=false;
  function pr(){tick=false;par.forEach(function(el){var r=el.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;var p=(r.top+r.height/2-innerHeight/2)/innerHeight;el.style.setProperty('--py',(p*-(parseFloat(el.getAttribute('data-par'))||40)).toFixed(1)+'px')})}
  if(par.length&&!RM){addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(pr)}},{passive:true});pr()}
  /* counters */
  var cio=new IntersectionObserver(function(es){es.forEach(function(en){
    if(!en.isIntersecting)return;cio.unobserve(en.target);
    var el=en.target,to=+el.dataset.count,t0=performance.now();
    if(RM){el.textContent=to;return}
    (function f(t){var k=Math.min(1,(t-t0)/1600),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e);if(k<1)requestAnimationFrame(f)})(t0);
  })},{threshold:.6});
  document.querySelectorAll('[data-count]').forEach(function(e){cio.observe(e)});
  /* card spotlight */
  document.querySelectorAll('.card').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px')})});
  /* build terminal */
  var L=['<b>$</b> kiralyte new project','<b>✓</b> Discovery: goals and users mapped','<b>✓</b> Design: screens and flows approved','<b>✓</b> Build: app, API, and database','<b>✓</b> Automate: AI handles repeat work','<b>→</b> Live and ready to scale'],t=document.getElementById('build'),n=0;
  function step2(){n++;t.innerHTML=L.slice(0,n).join('\n');setTimeout(n<L.length?step2:function(){n=0;step2()},n<L.length?900:4200)}
  if(RM)t.innerHTML=L.join('\n');else step2();
  /* sticky contact + form */
  var sc=document.querySelector('.sticky-contact'),sb=sc.querySelector('button');
  sb.addEventListener('click',function(){var o=sc.classList.toggle('open');sb.setAttribute('aria-expanded',o)});
  document.getElementById('enquiry').addEventListener('submit',function(e){
    e.preventDefault();var f=e.target,b='Name: '+f.name.value+'\nEmail: '+f.email.value+'\n\n'+f.message.value;
    location.href='mailto:kiralytetechnology@gmail.com?subject='+encodeURIComponent('Project enquiry from '+f.name.value)+'&body='+encodeURIComponent(b);
    document.getElementById('ok').textContent='Opening your email app to send this enquiry.';
  });
  document.querySelectorAll('img').forEach(function(im){im.addEventListener('error',function(){im.style.visibility='hidden'})});
})();
