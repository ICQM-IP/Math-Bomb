const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync(__dirname+'/index.html','utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/data:image\/png;base64,[A-Za-z0-9+/=]+/g,'');
const els=new Map(),defaults={mode:'1',deviceMode:'desktop',grade:'8',difficulty:'2',rain:'off',qtime:'30',duration:'180',starTarget:'7'};
function el(id=''){const classes=new Set();return{value:defaults[id]||'',textContent:'',innerHTML:'',style:{setProperty(){}},dataset:{},classList:{add(x){classes.add(x)},remove(x){classes.delete(x)},contains(x){return classes.has(x)},toggle(x,v){v?classes.add(x):classes.delete(x)}},focus(){},appendChild(){},getContext(){return{}},setAttribute(){},addEventListener(){}}}
const document={body:el(),getElementById(id){if(!els.has(id))els.set(id,el(id));return els.get(id)},querySelectorAll(s){if(s==='#topics input:checked')return[{value:'0'}];if(s==='.answer')return[el(),el(),el()];return[]},addEventListener(){}};
const window={matchMedia(){return{matches:false}},addEventListener(){},scrollTo(){}};
const ctx=vm.createContext({document,window,matchMedia:window.matchMedia,Image:class{},requestAnimationFrame(){},performance:{now:()=>0},Math,console,assert,URLSearchParams,location:{search:''}});
vm.runInContext(code,ctx);let count=0;
function test(name,body){vm.runInContext('ready=true;start();',ctx);vm.runInContext(body,ctx);console.log('PASS '+name);count++}
test('splash is not a submitted answer',`hurt(players[0],-1);assert.equal(players[0].total,0);assert.equal(players[0].records[0].status,'splash');`);
test('correct answer records other players as unanswered',`answer(players[0],q.correct);assert.equal(players[0].correct,1);assert.equal(players[0].total,1);assert.equal(players[1].total,0);assert.equal(players[1].records[0].status,'advanced');`);
test('wrong answer counted once',`answer(players[0],(q.correct+1)%3);assert.equal(players[0].total,1);assert.equal(players[0].records.length,1);assert.equal(players[0].records[0].status,'wrong');`);
test('timeout does not lower submitted-answer accuracy',`revealQuestion();assert.equal(players[0].total,0);assert.equal(players[0].records[0].status,'timeout');nextQuestion();assert.equal(players[0].records.length,1);`);
test('final question is included in results',`finish();assert.equal(players[0].records[0].status,'ended');assert.equal(players[0].total,0);`);
test('new match clears old records',`record(players[0],q.correct);start();assert.equal(players[0].records.length,0);assert.equal(qid,1);`);
test('reading pauses clocks and bombs',`placeBomb(players[0]);const t=bombs[0].t;openReading();const c=clock,l=qleft;tick(5);assert.equal(clock,c);assert.equal(qleft,l);assert.equal(bombs[0].t,t);closeReading();assert.equal(state,'play');`);
test('reading preserves an already paused game',`pause();openReading();closeReading();assert.equal(state,'pause');`);
test('returning to menu dismisses pause overlay',`pause();menu();assert($('pauseOverlay').classList.contains('hide'));assert(!document.body.classList.contains('match-view'));`);
test('math groups preserve complete factors',`assert.equal(mathHTML('(3)(x − 4)(x + 4)').match(/class="math-token"/g).length,3);assert(!mathHTML('−48').includes('<wbr>'));assert.deepEqual(Array.from(splitPrompt('Expand (x + 2)(x − 1).')),['Expand','(x + 2)(x − 1)']);`);
// Independent numeric checks on generated expressions and all options.
vm.runInContext(`function evaluatePrinted(text,x){let z=text.replace(/−/g,'-').replace(/([⁰¹²³⁴⁵⁶⁷⁸⁹]+)/g,m=>'**'+[...m].map(c=>'⁰¹²³⁴⁵⁶⁷⁸⁹'.indexOf(c)).join(''));z=z.replace(/(\\d|x|\\))(?=x|\\()/g,'$1*');z=z.replace(/x\\*\\*(\\d+)/g,'(x**$1)');assert(/^[0-9x+*(). \\-]+$/.test(z));return Function('x','return '+z)(x)};for(const g of [7,8,9])for(const d of [1,2,3])for(const topic of gradeTopics[g])for(let n=0;n<50;n++){const item=makeQuestion(topic,d,g);assert.equal(item.options.filter(o=>o.correct).length,1);assert.equal(new Set(item.options.map(o=>o.text)).size,3);for(const o of item.options)for(const x of [-3,-1,0,2,5]){const actual=evaluatePrinted(o.text,x),expected=o.p.reduce((sum,c,i)=>sum+c*x**i,0);assert(actual===expected)}assert(same(item.options[item.correct].p,item.answer));if(item.kind!=='factor')assert.equal(item.options.filter(o=>same(o.p,item.answer)).length,1)}`,ctx);
console.log('PASS 3150 generated questions: printed formulas and choices agree');
console.log(count+' regression scenarios passed');
