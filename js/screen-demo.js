/* Scripted desktop demo on the home page.
   A voice bar sits outside the screen and "speaks" each command; the cursor then
   does the work on a browser and a presentation. Nothing here is recorded, sent
   or connected to anything. */
(function(){
  var root=document.getElementById('ds'); if(!root) return;
  var scr=document.getElementById('ds-screen');
  var $=function(id){return document.getElementById(id)};
  var cur=$('ds-cur'), ring=$('ds-ring'), chipEl=$('ds-chip'), keyEl=$('ds-key'), menu=$('ds-menu'), toast=$('ds-toast');
  var para=$('ds-para'), txBox=$('ds-tx'), imBox=$('ds-im'), grid=$('ds-grid8'), search=$('ds-search'), qEl=$('ds-q');
  var br=$('ds-br'), ppt=$('ds-ppt'), icBr=$('ds-ic-br'), icPpt=$('ds-ic-ppt'), statusEl=$('ds-status');
  var voice=$('ds-voice'), barsEl=$('ds-bars'), cap=$('ds-cap');
  var steps=[].slice.call(document.querySelectorAll('#ds-steps li'));
  var reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  var CANCEL={}, run=0, cx=0, cy=0, flip=1, PICK=2, QUERY='city skyline at night';

  /* ---------- timing: every wait is cancellable ---------- */
  function sleep(ms){var id=run;return new Promise(function(res,rej){setTimeout(function(){id===run?res():rej(CANCEL)},ms)})}

  /* ---------- skyline images (generated, so every result matches the search) ---------- */
  var PALETTES=[['#1b2a49','#e0795a'],['#2b1f4e','#f2a65a'],['#3b4cc0','#f08a5d'],['#10303a','#5ec2b7'],['#3a1f3d','#e86a92'],['#14213d','#fca311'],['#22304f','#8fb8de'],['#2d2a55','#ff7b54']];
  function rnd(seed){var s=seed*9301+49297;return function(){s=(s*9301+49297)%233280;return s/233280}}
  function skyline(i,uid){
    var r=rnd(i+3),p=PALETTES[i%PALETTES.length],x=-2,out='',win='';
    while(x<100){
      var w=8+Math.floor(r()*7),h=18+Math.floor(r()*30),y=56-h;
      out+='<rect x="'+x+'" y="'+y+'" width="'+(w-1)+'" height="'+h+'"/>';
      for(var wy=y+4;wy<54;wy+=5)for(var wx=x+2;wx<x+w-3;wx+=4) if(r()>.62) win+='<rect x="'+wx+'" y="'+wy+'" width="1.6" height="1.6"/>';
      x+=w;
    }
    return '<svg viewBox="0 0 100 56" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="'+uid+'" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="'+p[0]+'"/><stop offset="1" stop-color="'+p[1]+'"/></linearGradient></defs><rect width="100" height="56" fill="url(#'+uid+')"/><circle cx="'+(14+i*9)+'" cy="12" r="4" fill="#fff" opacity=".7"/><g fill="#0b1030">'+out+'</g><g fill="#ffd36b">'+win+'</g></svg>';
  }
  var tiles=[];
  for(var t=0;t<8;t++){var d=document.createElement('div');d.className='ds-tile';d.innerHTML=skyline(t,'dssky'+t);grid.appendChild(d);tiles.push(d)}
  imBox.innerHTML=skyline(PICK,'dssky-ppt');

  /* ---------- wrap the paragraph in word spans (highlight continues across lines) ---------- */
  var sentence=para.textContent.trim();
  para.innerHTML=sentence.split(' ').map(function(w){return '<span class="w">'+w+' </span>'}).join('');
  var words=[].slice.call(para.querySelectorAll('.w'));

  /* ---------- voice bar ---------- */
  var N=22, bars=[];
  for(var b=0;b<N;b++){var bi=document.createElement('i');barsEl.appendChild(bi);bars.push(bi)}
  var level=0, target=0, ampRaf=0, tAmp=0;
  function amp(t){
    ampRaf=requestAnimationFrame(amp);
    level+=(target-level)*.18;
    for(var i=0;i<N;i++){
      var env=Math.pow(Math.sin(Math.PI*(i+.5)/N),.8);
      var wob=.45+.55*Math.abs(Math.sin(t*.0105*(1+i*.29)+i*1.7));
      var v=Math.max(.1,level*env*wob*1.0);
      bars[i].style.transform='scaleY('+v.toFixed(3)+')';
    }
  }
  function ampStart(){if(!ampRaf&&!reduce)ampRaf=requestAnimationFrame(amp)}
  function ampStop(){cancelAnimationFrame(ampRaf);ampRaf=0;level=target=0;bars.forEach(function(e){e.style.transform='scaleY(.1)'})}
  function setCap(text,idle){
    cap.className='ds-cap'+(idle?' idle':'');
    var box=document.createElement('span'); cap.innerHTML=''; cap.appendChild(box);
    if(idle){box.textContent=text;return []}
    return text.split(' ').map(function(w,i,a){var s=document.createElement('span');s.className='w';s.textContent=w+(i<a.length-1?' ':'');box.appendChild(s);return s})
  }
  async function speak(text){
    var spans=setCap(text,false);
    voice.classList.add('live'); target=.9; root.dataset.wave='on'; statusEl.textContent='You: '+text;
    for(var i=0;i<spans.length;i++){
      spans[i].classList.add('on');
      var w=spans[i].textContent;
      target=.55+Math.random()*.45;
      await sleep(120+w.length*38+(/[,?.]/.test(w)?170:0));
    }
    target=0; voice.classList.remove('live'); root.dataset.wave='';
    await sleep(350);
  }
  function listening(){setCap('Listening for \u201CHey CAL\u201D',true)}

  /* ---------- small UI helpers ---------- */
  function mark(n){steps.forEach(function(li,i){li.classList.toggle('on',i<n);li.classList.toggle('now',i===n-1)})}
  function chip(text){
    if(!text){chipEl.classList.remove('show');return}
    chipEl.textContent=text; chipEl.classList.add('show'); statusEl.textContent='CAL: '+text;
  }
  function think(on){root.dataset.proc=on?'on':''}
  async function key(list,ms){
    keyEl.innerHTML=list.map(function(k){return '<kbd>'+k+'</kbd>'}).join('');
    keyEl.classList.add('show'); await sleep(ms||900); keyEl.classList.remove('show');
  }
  function pos(el,fx,fy){
    var s=scr.getBoundingClientRect(), r=el.getBoundingClientRect();
    return {x:r.left-s.left+r.width*(fx==null?.5:fx), y:r.top-s.top+r.height*(fy==null?.5:fy)};
  }
  function place(x,y){
    cx=x;cy=y; cur.style.transform='translate3d('+x.toFixed(1)+'px,'+y.toFixed(1)+'px,0)';
    /* CAL's eyes follow the pointer */
    var w=scr.clientWidth,h=scr.clientHeight;
    root.style.setProperty('--ex',(((x/w)-.5)*6).toFixed(2));
    root.style.setProperty('--ey',(((y/h)-.35)*4).toFixed(2));
    root.style.setProperty('--sy','0');
  }
  function glide(p,dur,opt){
    opt=opt||{}; var id=run,x0=cx,y0=cy,dx=p.x-x0,dy=p.y-y0,d=Math.sqrt(dx*dx+dy*dy)||1;
    dur=dur||Math.max(420,Math.min(1200,d*2.6));
    flip=-flip; var bend=opt.linear?0:Math.min(d*.14,46)*flip, nx=-dy/d, ny=dx/d;
    var qx=x0+dx/2+nx*bend, qy=y0+dy/2+ny*bend;
    return new Promise(function(res,rej){
      var t0=null;
      function f(t){
        if(id!==run) return rej(CANCEL);
        if(t0===null) t0=t;
        var k=Math.min(1,(t-t0)/dur);
        var e=opt.linear?k:(k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2), u=1-e;
        place(u*u*x0+2*u*e*qx+e*e*p.x, u*u*y0+2*u*e*qy+e*e*p.y);
        if(k<1) requestAnimationFrame(f); else res();
      }
      requestAnimationFrame(f);
    });
  }
  async function go(el,fx,fy,dur){await glide(pos(el,fx,fy),dur)}
  async function click(el){
    ring.style.left=cx+'px'; ring.style.top=cy+'px'; ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go');
    cur.classList.add('down'); if(el) el.classList.add('press');
    await sleep(110); cur.classList.remove('down'); if(el) el.classList.remove('press'); await sleep(160);
  }
  async function front(name){
    var toPpt=name==='ppt';
    br.classList.toggle('front',!toPpt); ppt.classList.toggle('front',toPpt);
    icBr.classList.toggle('on',!toPpt); icPpt.classList.toggle('on',toPpt); icPpt.classList.add('run');
    await sleep(560);
  }

  /* ---------- reset ---------- */
  function reset(){
    root.className='ds'; root.dataset.view='article'; root.dataset.wave=''; root.dataset.proc='';
    words.forEach(function(w){w.classList.remove('sel')});
    tiles.forEach(function(t){t.classList.remove('in','hov','pick')});
    search.classList.remove('focus','has'); qEl.textContent='';
    txBox.classList.remove('focus'); imBox.classList.remove('focus');
    br.classList.add('front'); ppt.classList.remove('front'); icBr.classList.add('on'); icPpt.classList.remove('on','run');
    toast.classList.remove('show'); menu.classList.remove('show'); keyEl.classList.remove('show'); chip('');
    cur.classList.remove('down'); mark(0); listening();
    var s=scr.getBoundingClientRect(); place(s.width*.62,s.height*.62); cur.style.opacity=1;
  }

  /* ---------- the scene ---------- */
  async function scene(){
    reset(); await sleep(1100);

    /* 1: "Hey CAL" + select and copy the paragraph */
    mark(1);
    await speak('\u201CHey CAL, can you see this screen? Copy the paragraph about teams.\u201D');
    think(true); chip('Looking at the page'); await sleep(900);
    mark(2); chip('Selecting the paragraph'); think(false);
    await go(words[0],0,.5,800); await sleep(160);
    cur.classList.add('down');
    var lastY=null;
    for(var i=0;i<words.length;i++){
      var r=pos(words[i],1,.5), newLine=lastY!==null&&Math.abs(r.y-lastY)>4;
      await glide({x:r.x-2,y:r.y},newLine?120:58,{linear:true});
      words[i].classList.add('sel'); lastY=r.y;
    }
    cur.classList.remove('down'); await sleep(220);
    await key(['Ctrl','C'],1000); chip('Copied the paragraph'); await sleep(900); chip('');

    /* 2: screenshot */
    await go(br.querySelector('.ds-view'),.9,.88,700);
    await speak('\u201CNow take a screenshot of it.\u201D');
    mark(3); chip('Taking a screenshot'); await sleep(450);
    root.classList.add('shot'); await key(['PrtSc'],1000); await sleep(1500); root.classList.remove('shot'); chip('');

    /* 3: open the presentation and paste the text */
    await speak('\u201CNow open my presentation and paste it on slide 3.\u201D');
    mark(4); chip('Opening the presentation');
    await go(icPpt,.5,.5,900); await click(icPpt); await front('ppt');
    chip('Adding the text to slide 3');
    await go(txBox,.45,.4,900); await click(); txBox.classList.add('focus'); await sleep(250);
    await key(['Ctrl','V'],900); root.classList.add('s-text'); await sleep(500); txBox.classList.remove('focus'); chip('');

    /* 4: find a matching image */
    await go(imBox,.8,.85,600);
    await speak('\u201CFind me a matching image.\u201D');
    mark(5); chip('Searching for an image');
    await go(icBr,.5,.5,900); await click(icBr); await front('br');
    var tab=br.querySelector('.t-img'); await go(tab,.5,.5,700); await click(); root.dataset.view='images'; await sleep(350);
    await go(search,.4,.5,650); await click(); search.classList.add('focus'); await sleep(250);
    search.classList.add('has');
    for(var c=1;c<=QUERY.length;c++){qEl.textContent=QUERY.slice(0,c); await sleep(48+Math.random()*60)}
    await sleep(350); await key(['Enter'],700);
    for(var k=0;k<tiles.length;k++){tiles[k].classList.add('in'); await sleep(90)}
    search.classList.remove('focus'); chip(''); await sleep(500);

    /* 5: copy the best image, move it to the slide */
    await speak('\u201CMove that image to the same slide.\u201D');
    mark(6); chip('Moving the image');
    await go(tiles[PICK],.55,.5,900); tiles[PICK].classList.add('hov'); await sleep(250);
    var tp=pos(tiles[PICK],.55,.5), s=scr.getBoundingClientRect();
    ring.style.left=cx+'px'; ring.style.top=cy+'px'; ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go');
    menu.style.left=Math.min(tp.x,s.width-menu.offsetWidth-8)+'px'; menu.style.top=Math.min(tp.y,s.height*.7)+'px'; menu.classList.add('show');
    await sleep(350);
    var mi=$('ds-copyimg'); await go(mi,.3,.5,520);
    [].slice.call(menu.children).forEach(function(l){l.classList.remove('hot')}); mi.classList.add('hot'); await sleep(280);
    await click(); menu.classList.remove('show'); mi.classList.remove('hot');
    tiles[PICK].classList.remove('hov'); tiles[PICK].classList.add('pick'); await sleep(500);
    await go(icPpt,.5,.5,900); await click(icPpt); await front('ppt');
    await go(imBox,.5,.5,800); await click(); imBox.classList.add('focus'); await sleep(250);
    await key(['Ctrl','V'],900); root.classList.add('s-img'); await sleep(500); imBox.classList.remove('focus');
    chip('Done'); toast.classList.add('show');
    await glide({x:cx+scr.clientWidth*.04,y:cy+scr.clientHeight*.05},900); 
    await sleep(4800); chip('');
    root.classList.add('fade'); await sleep(900);
  }

  /* ---------- run control ---------- */
  var visible=false;
  function start(){
    var id=++run; ampStart();
    (async function(){
      try{ while(id===run){ await scene(); } }
      catch(e){ if(e!==CANCEL&&window.console) console.error(e) }
    })();
  }
  function stop(){run++; ampStop(); target=0}
  var btn=$('ds-replay'); if(btn) btn.addEventListener('click',function(){stop();start()});

  if(reduce){
    /* finished scene, no motion */
    reset(); front('ppt'); root.classList.add('s-text','s-img'); words.forEach(function(w){w.classList.add('sel')});
    tiles.forEach(function(t){t.classList.add('in')}); tiles[PICK].classList.add('pick');
    mark(6); chip('Done'); toast.classList.add('show'); cur.style.opacity=0;
    setCap('\u201CMove that image to the same slide.\u201D',false).forEach(function(s){s.classList.add('on')});
    return;
  }
  if('IntersectionObserver' in window){
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting&&!visible){visible=true;start()}
        else if(!e.isIntersecting&&visible){visible=false;stop()}
      })
    },{threshold:.4}).observe(root);
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){if(visible)stop()} else if(visible){stop();start()}
    });
  } else { start() }
})();
