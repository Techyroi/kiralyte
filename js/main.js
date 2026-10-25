(function(){
  var tg=document.querySelector('.nav__toggle'),mn=document.getElementById('main-navigation');
  tg.addEventListener('click',function(){var o=mn.classList.toggle('open');tg.setAttribute('aria-expanded',o)});
  mn.addEventListener('click',function(e){if(e.target.tagName==='A'){mn.classList.remove('open');tg.setAttribute('aria-expanded','false')}});
  var sc=document.querySelector('.sticky-contact'),sb=sc.querySelector('button');
  sb.addEventListener('click',function(){var o=sc.classList.toggle('open');sb.setAttribute('aria-expanded',o)});
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  var L=['<b>$</b> kiralyte new project','<b>✓</b> Discovery: goals and users mapped','<b>✓</b> Design: screens and flows approved','<b>✓</b> Build: app, API, and database','<b>✓</b> Automate: AI handles repeat work','<b>→</b> Live and ready to scale'],t=document.getElementById('build'),n=0;
  function step(){n++;t.innerHTML=L.slice(0,n).join('\n');setTimeout(n<L.length?step:function(){n=0;step()},n<L.length?900:4200)}
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)t.innerHTML=L.join('\n');else step();
  document.getElementById('enquiry').addEventListener('submit',function(e){
    e.preventDefault();var f=e.target;
    var body='Name: '+f.name.value+'\nEmail: '+f.email.value+'\n\n'+f.message.value;
    location.href='mailto:kiralytetechnology@gmail.com?subject='+encodeURIComponent('Project enquiry from '+f.name.value)+'&body='+encodeURIComponent(body);
    document.getElementById('ok').textContent='Opening your email app to send this enquiry.';
  });
})();
