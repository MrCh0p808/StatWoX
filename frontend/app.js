// --- audio helpers ---
const clickSound = document.getElementById('clickSound');
const successSound = document.getElementById('successSound');
function playClick(){ try{ clickSound.currentTime=0; clickSound.play(); }catch(e){} }
function playSuccess(){ try{ successSound.currentTime=0; successSound.play(); }catch(e){} }


// Auto-inserted Phase2: runtime flags & autosave helpers
window.APP_STARTED = false;
window._STATWOX_AUTOSAVE = { timer: null, count: 0, pending: false };

// PHASE2 autosave: batch after 3 answers or 20s idle
function scheduleAutoSave(){
  try{
    const s = window._STATWOX_AUTOSAVE;
    s.count = (s.count || 0) + 1;
    if(s.count >= 3){
      clearTimeout(s.timer); s.count = 0; s.pending = false; autoSave();
      return;
    }
    s.pending = true;
    clearTimeout(s.timer);
    s.timer = setTimeout(()=>{ s.count = 0; s.pending = false; autoSave(); }, 20000);
  }catch(e){ console.warn('scheduleAutoSave', e); }
}

function autoSave(){
  try{
    const payload = {};
    questions.forEach(q => { payload[q.id] = (responses[q.id] === undefined ? '' : responses[q.id]); });
    payload['Timestamp'] = new Date().toISOString();
    payload['SessionID'] = responses['SessionID'] || localStorage.getItem('session_id') || '';
    // mark as autosave for logs; backend will ignore unknown keys
    payload['autosave'] = true;
    // fire-and-forget, UI shows toast on success
    fetch(`${API_URL}/submit`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
      .then(r => r.json())
      .then(j => {
         try{ if(j && j.success){ showSavedToast(); } }catch(e){}
      }).catch(()=>{});
  }catch(e){ console.warn('autoSave error', e); }
}

function showSavedToast(){
  try{
    let s = document.getElementById('statwox-saved-toast');
    if(!s){ s = document.createElement('div'); s.id='statwox-saved-toast';
      s.style.position='fixed'; s.style.right='16px'; s.style.top='16px'; s.style.padding='8px 12px'; s.style.background='rgba(0,0,0,0.6)'; s.style.color='white'; s.style.borderRadius='8px'; s.style.zIndex='9999'; s.textContent='Auto-saved ✔'; document.body.appendChild(s);
    }
    s.style.opacity='1';
    setTimeout(()=>{ try{ s.style.opacity='0'; }catch(e){} }, 1800);
  }catch(e){}
}


// --- Add Language Selection on Page Load ---
let currentLang = localStorage.getItem('lang') || null;

window.addEventListener('DOMContentLoaded', () => {
  if (!currentLang) {
    document.getElementById('languageScreen').classList.remove('hidden');
    document.getElementById('langEn').addEventListener('click', () => setLanguage('en'));
    document.getElementById('langHi').addEventListener('click', () => setLanguage('hi'));
  } else {
    startApp();
  }
});

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  document.getElementById('languageScreen').classList.add('hidden');
  // If app already started, re-render current UI without restarting welcome
  if (window.APP_STARTED) {
    try { reRenderLanguage(); } catch(e){ console.warn('reRenderLanguage failed', e); startApp(); }
  } else {
    startApp();
  }
}



// helper to re-render UI when language changes without restarting
function reRenderLanguage(){
  try{
    // keep current state and re-render question UI in new language
    render();
    // If welcome screen visible, ensure texts updated
    const welcome = document.getElementById('welcomeScreen');
    if(welcome && !welcome.classList.contains('hidden')) {
      // update localized labels (if present)
    }
  }catch(e){ console.warn('reRenderLanguage error', e); }
}

function startApp() {
  try { window.APP_STARTED = true; } catch(e){}
  renderWelcomeScreen();
}


// --- Welcome Screen ---
function renderWelcomeScreen() {
  const card = document.getElementById('card');
  const thankyou = document.getElementById('thankyou');
  card.classList.add('hidden');
  thankyou.classList.add('hidden');

  const main = document.querySelector('main');
  const wrapper = document.createElement('div');
  wrapper.id = 'welcomeScreen';
  wrapper.className = 'text-center space-y-4';
  wrapper.innerHTML = `
    <h2 class="text-2xl font-bold text-indigo-300">🌟 ${currentLang === 'hi' ? 'हमारे डिजिटल समुदाय में आपका स्वागत है!' : 'Welcome to Our Digital Community Exploration!'}</h2>
    <p class="text-gray-300 leading-relaxed text-sm sm:text-base">
      ${currentLang === 'hi' 
        ? 'संस्कृतियों, समुदायों और विभिन्न दृष्टिकोणों के बीच — आपकी आवाज़ महत्वपूर्ण है। हम एक ऐसा मंच बना रहे हैं जहाँ हर व्यक्ति सुना और महत्व दिया जाता है। अपने सच्चे अनुभव साझा करें — अच्छे, चुनौतीपूर्ण और उनके बीच के सभी। आपकी कहानियाँ एक बेहतर डिजिटल दुनिया बनाएंगी।' 
        : 'Thank you for joining us in this important conversation about how we connect in today\'s virtual social spaces. Across cultures, communities, and diverse perspectives — your voice matters. We\'re building more than just a platform; we\'re creating a space where every individual feels heard, valued, and truly part of something meaningful. Share your authentic experiences with us — the good, the challenging, and everything in between. Your stories will shape a better digital world for everyone.'}
    </p>
    <button id="beginSurvey" class="mt-6 px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition text-white font-semibold">Begin</button>
  `;
  main.appendChild(wrapper);

  document.getElementById('beginSurvey').addEventListener('click', () => {
    playClick();
    wrapper.remove();
    document.getElementById('card').classList.remove('hidden');
    render();
  });
}

// --- QUESTIONS  ---
const questions = [
  { id: 'FullName', en: 'Full Name', hi: 'अपना पूरा नाम दर्ज करें', type: 'text' },
  { id: 'Email', en: 'Email Address', hi: 'अपना ईमेल पता दर्ज करें', type: 'text' },
  { id: 'Age', en: 'Age', hi: 'कृपया अपनी आयु चुनें', type: 'mcq', opts: ['Under 18 / 18 वर्ष से कम', '18–24 / 18–24', '25–34 / 25–34', '35–44 / 35–44', '45–54 / 45–54', '55–64 / 55–64', '65+ / 65 या उससे अधिक'] },

  { id: 'Q1', en: 'How frequently do you participate in online communities?', hi: 'आप ऑनलाइन समुदायों में कितनी बार भाग लेते हैं जैसे पोस्ट करना, टिप्पणी देना या मतदान करना', type: 'mcq', opts: ['Multiple times a day / दिन में कई बार', 'Daily / रोज़', 'A few times a week / सप्ताह में कुछ बार', 'Occasionally / कभी-कभार', 'Never / कभी नहीं'] },
  { id: 'Q2', en: 'What motivates you most to engage in online discussions?', hi: 'आपको ऑनलाइन चर्चाओं में भाग लेने के लिए सबसे अधिक क्या प्रेरित करता हैं?', type: 'mcq', opts: ['To gain information or advice / जानकारी या सलाह लेना', 'To connect with like-minded people / समान विचारधारा वाले लोगों से जुड़ना', 'To express personal views / अपने विचार व्यक्त करना', 'For debate or entertainment / बहस और मनोरंजन का आनंद', 'Out of curiosity for others\' perspectives / दूसरों के दृष्टिकोण की जिज्ञासा'] },
  { id: 'Q3', en: 'What kind of content makes you stop and participate?', hi: 'किस प्रकार की सामग्री आपको स्क्रॉल रोककर भाग लेने के लिए प्रेरित करती हैं?', type: 'mcq', opts: ['Personal stories / जीवन से जुड़ी कहानियाँ', 'Controversial topics / विवादास्पद मुद्दे', 'Humor or satire / हास्य या व्यंग्य', 'Informative polls / जानकारीपरक पोल', 'Helping opportunities / जहाँ आप मदद कर सकें'] },
  { id: 'Q4', en: 'To what extent do you feel a sense of belonging in your online groups?', hi: 'आप अपने ऑनलाइन समुदायों में कितना जुड़ाव महसूस करते हैं?', type: 'mcq', opts: ['Strongly agree / पूर्णतः सहमत', 'Agree / सहमत', 'Neutral / तटस्थ', 'Disagree / असहमत', 'Strongly disagree / पूर्णतः असहमत'] },
  { id: 'Q5', en: 'What brings you back to your favourite online spaces?', hi: 'आपको अपने पसंदीदा ऑनलाइन स्थानों पर वापस आने के लिए क्या प्रेरित करता हैं?', type: 'text' },

  { id: 'Q6', en: 'How important is anonymity when sharing honest opinions?', hi: 'ऑनलाइन अपनी सच्ची राय साझा करते समय आपके लिए अनाम रहना कितना महत्वपूर्ण हैं?', type: 'mcq', opts: ['Extremely important / बहुत ज़्यादा महत्वपूर्ण', 'Somewhat important / कुछ हद तक महत्वपूर्ण', 'Neutral / तटस्थ', 'Less important / कम महत्वपूर्ण', 'Not important / बिलकुल महत्वपूर्ण नहीं'] },
  { id: 'Q7', en: 'Which describes your identity preference online?', hi: 'ऑनलाइन चर्चाओं में आपकी पहचान की वरीयता क्या हैं?', type: 'mcq', opts: ['Fully anonymous / पूर्णतः अनाम', 'Partially anonymous / आंशिक रूप से अनाम', 'Fully identified / पूर्णतः पहचाना गया'] },
  { id: 'Q8', en: 'Do people share true opinions or filtered versions online?', hi: 'क्या लोग अपनी सच्ची राय साझा करते हैं या फ़िल्टर की हुई राय', type: 'mcq', opts: ['Mostly true opinions / ज़्यादातर सच्ची राय', 'A mix of both / दोनों का मिश्रण', 'Mostly filtered opinions / ज़्यादातर फ़िल्टर की हुई राय'] },
  { id: 'Q9', en: 'What builds your trust in an online community?', hi: 'ऑनलाइन समुदायों में आपके विश्वास का सबसे बड़ा कारण क्या होता हैं?', type: 'mcq', opts: ['Transparent rules and moderation / पारदर्शी नियम और संचालन', 'Strong privacy policies / मज़बूत गोपनीयता नीतियाँ', 'Clean design / साफ-सुथरा डिज़ाइन', 'Visible feedback-driven changes / प्रतिक्रिया से बदलाव दिखना', 'Recommendations from trusted people / विश्वसनीय लोगों की सिफारिश'] },
  { id: 'Q10', en: 'Describe a positive or negative experience related to trust or identity.', hi: 'विश्वास या पहचान से जुड़ा कोई सकारात्मक या नकारात्मक अनुभव बताएं', type: 'text' },

  { id: 'Q11', en: 'When you give your opinion, what do you expect in return?', hi: 'जब आप अपनी राय देते हैं तो बदले में आप क्या अपेक्षा करते हैं?', type: 'mcq', opts: ['Immediate results / तुरंत परिणाम', 'Meaningful discussion / सार्थक चर्चा', 'Recognition or likes / मान्यता या लाइक्स', 'Personal satisfaction / केवल संतुष्टि'] },
  { id: 'Q12', en: 'How do you prefer to give feedback to admins or developers?', hi: 'आप प्रशासकों या डेवलपर्स को प्रतिक्रिया देने का कौन-सा तरीका पसंद करते हैं?', type: 'mcq', opts: ['In-app survey / इन-ऐप सर्वे', 'Suggestion box or forum / सुझाव बॉक्स या फ़ोरम', 'Email or message / ईमेल या संदेश', 'Public comment / सार्वजनिक टिप्पणी', 'I usually do not give feedback / मैं सामान्यतः प्रतिक्रिया नहीं देता'] },
  { id: 'Q13', en: 'How much does design affect your trust and engagement?', hi: 'प्लेटफ़ॉर्म का डिज़ाइन और इंटरैक्शन आपके विश्वास और सहभागिता को कितना प्रभावित करता है?', type: 'mcq', opts: ['A lot / बहुत ज़्यादा', 'Somewhat / कुछ हद तक', 'A little / थोड़ा बहुत', 'Not at all / बिलकुल नहीं'] },
  { id: 'Q14', en: 'Would you prefer a minimal or detailed opinion platform?', hi: 'क्या आप तेज़ और सरल प्लेटफ़ॉर्म पसंद करेंगे या विस्तृत और चर्चा-आधारित', type: 'mcq', opts: ['Fast & simple interface / तेज़ और सरल इंटरफ़ेस', 'Rich discussion experience / चर्चा और प्रोफ़ाइल वाला समृद्ध अनुभव'] },
  { id: 'Q15', en: 'When did your feedback lead to change?', hi: 'कभी ऐसा हुआ जब आपकी प्रतिक्रिया से बदलाव आया हो तो वह अनुभव बताएं', type: 'text' },

  { id: 'Q16', en: 'Which feature would make you join a new platform?', hi: 'कौन-सा फीचर आपको किसी नए प्लेटफ़ॉर्म से जुड़ने के लिए प्रेरित करेगा', type: 'mcq', opts: ['One-tap anonymous voting / एक-टैप अनाम मतदान', 'Create & share polls / पोल बनाना और साझा करना', 'Personalized feed / व्यक्तिगत फ़ीड', 'Reward or recognition system / पुरस्कार या मान्यता प्रणाली', 'View real-time trends / रीयल-टाइम ट्रेंड्स देखना'] },
  { id: 'Q17', en: 'Which feature would make you return regularly?', hi: 'कौन-सा फीचर आपको बार-बार वापस आने के लिए प्रेरित करेगा', type: 'mcq', opts: ['Fresh daily content / ताज़ा दैनिक सामग्री', 'Personalized feed / व्यक्तिगत फ़ीड', 'Gamification / गेमिफिकेशन', 'Collaboration opportunities / सहयोग के अवसर', 'Active moderation / सक्रिय संचालन'] },
  { id: 'Q18', en: 'How appealing is a personal insight profile?', hi: 'क्या आपकी राय पर आधारित व्यक्तिगत प्रोफ़ाइल देखना आपको आकर्षक लगता हैं?', type: 'mcq', opts: ['Very appealing / बहुत आकर्षक', 'Somewhat appealing / कुछ आकर्षक', 'Neutral / तटस्थ', 'Less appealing / कम आकर्षक', 'Not appealing / बिलकुल नहीं'] },
  { id: 'Q19', en: 'Which poll results interest you more?', hi: 'आपको किस प्रकार के पोल परिणाम अधिक रोचक लगते हैं?', type: 'mcq', opts: ['Local opinions / स्थानीय लोगों की राय', 'Global opinions / वैश्विक राय', 'No preference / कोई विशेष पसंद नहीं'] },
  { id: 'Q20', en: 'Share one idea that could improve community engagement.', hi: 'ऐसी कोई एक चीज़ साझा करें जो ऑनलाइन सहभागिता को बेहतर बना सकती हैं?', type: 'text' },

  { id: 'Q21', en: 'When you disagree with majority, how do you respond?', hi: 'जब आप बहुमत की राय से असहमत होते हैं तो आप क्या करते हैं?', type: 'mcq', opts: ['Express my view openly / खुलकर अपनी राय देते हैं', 'Ignore the post / पोस्ट को अनदेखा कर आगे बढ़ते हैं', 'Observe silently / चुपचाप देखते हैं', 'Sometimes change my opinion / कभी-कभी अपना विचार बदलते हैं'] },
  { id: 'Q22', en: 'How much does positive feedback affect your future posts?', hi: 'सकारात्मक प्रतिक्रिया आपके भविष्य के पोस्ट करने के निर्णय को कितना प्रभावित करती हैं?', type: 'mcq', opts: ['A lot / बहुत अधिक', 'Moderate impact / मध्यम प्रभाव', 'Slight impact / थोड़ा प्रभाव', 'No impact / कोई प्रभाव नहीं'] },
  { id: 'Q23', en: 'What kind of community tone feels safest to you?', hi: 'किस प्रकार का माहौल आपको अपनी ईमानदार राय व्यक्त करने में सबसे सुरक्षित महसूस कराता हैं?', type: 'mcq', opts: ['Respectful & polite / सम्मानजनक और सभ्य', 'Light & fun / हल्का-फुल्का और मनोरंजक', 'Intellectual & factual / बौद्धिक और तथ्य-आधारित', 'Direct & unfiltered / सीधा और अनफ़िल्टर्ड'] },
  { id: 'Q24', en: 'Do you agree that expressing opinions helps you feel part of something bigger?', hi: 'क्या आप मानते हैं कि अपनी राय साझा करने से आपको किसी बड़े समुदाय का हिस्सा महसूस होता हैं?', type: 'mcq', opts: ['Strongly agree / पूर्णतः सहमत', 'Agree / सहमत', 'Neutral / तटस्थ', 'Disagree / असहमत', 'Strongly disagree / पूर्णतः असहमत'] },
  { id: 'Q25', en: 'What emotional impact do online communities have on you?', hi: 'ऑनलाइन समुदायों से आपको कौन-सा भावनात्मक प्रभाव महसूस होता हैं?', type: 'text' }
];

// --- configuration ---
const MULTI_SELECT_IDS = ['Q5','Q6','Q12','Q14','Q15','Q19','Q20'];
const REQUIRED_IDS = ['FullName','Email','Age'];

// API URL injected via config.js (uploaded by Terraform)
const API_URL = (typeof window !== 'undefined' && window.STATWOX_API_URL) ? window.STATWOX_API_URL : 'REPLACE_WITH_API_URL';

// cache DOM
const titleEl = document.getElementById('title');
const subtitleEl = document.getElementById('subtitle');
const optionsEl = document.getElementById('options');
const progressFill = document.getElementById('progressFill');
const backBtn = document.getElementById('backBtn');
const nextBtn = document.getElementById('nextBtn');
const skipBtn = document.getElementById('skipBtn');
const statusEl = document.getElementById('status');

let idx = 0, responses = {}, total = questions.length;

function render(){
  // Phase2: disable Skip for first 3 questions
  try{ skipBtn.disabled = (idx < 3); }catch(e){}

  const q = questions[idx];
  if(!q){ statusEl.textContent = 'No question found'; return; }

  titleEl.textContent = q.en || '';
  subtitleEl.textContent = q.hi || '';
  optionsEl.innerHTML = '';

  const isMulti = q.type==='mcq' && MULTI_SELECT_IDS.includes(q.id);

  if(q.type==='mcq'){
    q.opts.forEach(opt=>{
      const btn=document.createElement('button');
      btn.className='option-btn';
      btn.type='button';
      btn.textContent=opt;
      btn.onmousemove = e => { btn.style.setProperty('--x', `${e.offsetX}px`); btn.style.setProperty('--y', `${e.offsetY}px`); };

      const prev = responses[q.id];
      if(isMulti){ if(Array.isArray(prev) && prev.includes(opt)) btn.classList.add('selected'); }
      else { if(prev === opt) btn.classList.add('selected'); }

      btn.onclick = () => {
        playClick();
        if(isMulti){
          responses[q.id] = responses[q.id] || [];
          const arr = responses[q.id];
          const i = arr.indexOf(opt);
          if(i >= 0){ arr.splice(i,1); btn.classList.remove('selected'); }
          else { arr.push(opt); btn.classList.add('selected'); }
        } else {
          responses[q.id] = opt; try{ scheduleAutoSave(); }catch(e){};
          optionsEl.querySelectorAll('.option-btn').forEach(b=>b.classList.remove('selected'));
          btn.classList.add('selected');
          setTimeout(()=>{ nextQuestion(); }, 220);
        }
      };
      optionsEl.appendChild(btn);
    });
    nextBtn.style.display = isMulti ? 'inline-block' : 'none';
  } else {
    const ta = document.createElement('textarea');
    ta.id='textResp'; ta.rows=5; ta.placeholder='Type your answer here / अपना उत्तर यहाँ लिखें';
    ta.value = responses[q.id] || '';
    ta.addEventListener('input', () => { responses[q.id] = ta.value; try{ scheduleAutoSave(); }catch(e){} });
    optionsEl.appendChild(ta);
    nextBtn.style.display = 'inline-block';
  }

  progressFill.style.width = `${Math.round((idx/total)*100)}%`;
  backBtn.style.display = idx === 0 ? 'none' : 'block';

  const contentEl = document.getElementById('content');
  contentEl.classList.add('question-transition');
  setTimeout(()=>contentEl.classList.remove('question-transition'),700);

  statusEl.textContent = '';
}

function nextQuestion(){
  const q = questions[idx];
  if(REQUIRED_IDS.includes(q.id)){
    let empty = false;
    if(q.type === 'text'){
      const ta = document.getElementById('textResp');
      if(!ta || !ta.value.trim()) empty = true;
    } else if(q.type === 'mcq'){
      const val = responses[q.id];
      if(!val || (Array.isArray(val) && val.length === 0)) empty = true;
    }
    if(empty){ statusEl.textContent = 'Please answer this required question.'; setTimeout(()=>statusEl.textContent='',3000); return; }
  }
  idx++;
  if(idx < total) render(); else submitAll();
}

function prevQuestion(){ if(idx>0){ idx--; render(); } }

function skipQuestion(){
  const q = questions[idx];
  responses[q.id] = (q.type==='mcq' && MULTI_SELECT_IDS.includes(q.id)) ? [] : '';
  idx++;
  if(idx<total) render(); else submitAll();
}

function showThankYou(){
  document.getElementById('card').classList.add('hidden');
  const t = document.getElementById('thankyou');
  t.classList.remove('hidden');
  t.setAttribute('aria-hidden','false');
}

function showError(msg){
  statusEl.textContent = msg || 'Something went wrong';
  setTimeout(()=> statusEl.textContent = '', 4000);
}

function submitAll(){
  const payload = {};
  questions.forEach(q => { payload[q.id] = (responses[q.id] === undefined ? '' : responses[q.id]); });
  payload['Timestamp'] = new Date().toISOString();

  document.getElementById('card').classList.add('opacity-60');
  statusEl.textContent = 'Submitting...';

  fetch(`${API_URL}/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(r => r.json())
  .then(r => {
    if(r && r.success){ playSuccess(); showThankYou(); }
    else { showError((r && r.message) || 'Submission failed'); document.getElementById('card').classList.remove('opacity-60'); }
  })
  .catch(err => {
    console.error(err);
    showError('Network error');
    document.getElementById('card').classList.remove('opacity-60');
  });
}

// Share button (fixed quotes)
document.addEventListener('DOMContentLoaded', function(){
  render();
  const shareBtn = document.getElementById('shareBtn');
  if(shareBtn){
    shareBtn.addEventListener('click', ()=>{
      const shareData = {
        title: "3Dev's Survey",
        text: 'Share your opinion — take this short survey',
        url: location.href
      };
      if(navigator.share){ navigator.share(shareData).catch(()=>{}); }
      else if(navigator.clipboard){
        navigator.clipboard.writeText(location.href).then(()=>{ alert('Link copied to clipboard'); }).catch(()=>{ alert('Copy this URL: '+location.href); });
      } else { alert('Copy this URL: '+location.href); }
    });
  }
});

// wire nav buttons
backBtn && backBtn.addEventListener('click', prevQuestion);
nextBtn && nextBtn.addEventListener('click', nextQuestion);
skipBtn && skipBtn.addEventListener('click', skipQuestion);


// === Dynamic 10-language selector (auto-generated grid) ===
window.addEventListener("DOMContentLoaded", () => {
  const langContainer = document.querySelector("#languageScreen .flex");
  if (langContainer) {
    langContainer.innerHTML = "";
    const languages = {
      en: "English",
      hi: "हिंदी (Hindi)",
      bn: "বাংলা (Bengali)",
      mr: "मराठी (Marathi)",
      te: "తెలుగు (Telugu)",
      ta: "தமிழ் (Tamil)",
      gu: "ગુજરાતી (Gujarati)",
      ur: "اردو (Urdu)",
      kn: "ಕನ್ನಡ (Kannada)",
      or: "ଓଡ଼ିଆ (Odia)",
      ml: "മലയാളം (Malayalam)"
    };

    const colors = [
      "from-indigo-600 to-purple-600",
      "from-fuchsia-600 to-pink-600",
      "from-blue-600 to-cyan-600",
      "from-green-600 to-emerald-600",
      "from-orange-500 to-amber-500",
      "from-rose-500 to-pink-600",
      "from-teal-600 to-cyan-600",
      "from-sky-600 to-blue-700",
      "from-purple-600 to-indigo-700",
      "from-yellow-500 to-orange-600"
    ];

    Object.entries(languages).forEach(([code, label], i) => {
      const btn = document.createElement("button");
      btn.className =
        "px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-white font-semibold shadow-md hover:opacity-90 transition transform hover:scale-105 bg-gradient-to-r";
      btn.classList.add(...colors[i % colors.length].split(" "));
      btn.textContent = label;
      btn.title = `Select ${label.replace(/\(.+\)/, "")}`; // tooltip shows English fallback
      btn.onclick = () => setLanguage(code);
      langContainer.appendChild(btn);
    });

    langContainer.className = "grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4";
  }
});

// === Auto-Localized Labels + Language-Change Toggle ===

// localized labels dictionary (pure native scripts)
window.LANG_LABELS_NATIVE = {
  en: "English",
  hi: "हिंदी",
  bn: "বাংলা",
  mr: "मराठी",
  te: "తెలుగు",
  ta: "தமிழ்",
  gu: "ગુજરાતી",
  ur: "اردو",
  kn: "ಕನ್ನಡ",
  or: "ଓଡ଼ିଆ",
  ml: "മലയാളം"
};

// rebuild buttons using native labels
window.addEventListener("DOMContentLoaded", () => {
  const langContainer = document.querySelector("#languageScreen .flex");
  if (langContainer && window.LANG_LABELS_NATIVE) {
    langContainer.innerHTML = "";
    const colors = [
      "from-indigo-600 to-purple-600",
      "from-fuchsia-600 to-pink-600",
      "from-blue-600 to-cyan-600",
      "from-green-600 to-emerald-600",
      "from-orange-500 to-amber-500",
      "from-rose-500 to-pink-600",
      "from-teal-600 to-cyan-600",
      "from-sky-600 to-blue-700",
      "from-purple-600 to-indigo-700",
      "from-yellow-500 to-orange-600"
    ];
    Object.entries(window.LANG_LABELS_NATIVE).forEach(([code, label], i) => {
      const btn = document.createElement("button");
      btn.className =
        "px-4 py-3 sm:px-5 sm:py-3 rounded-xl text-white font-semibold shadow-md hover:opacity-90 transition transform hover:scale-105 bg-gradient-to-r";
      btn.classList.add(...colors[i % colors.length].split(" "));
      btn.textContent = label;
      btn.title = `Select ${label}`;
      btn.onclick = () => setLanguage(code);
      langContainer.appendChild(btn);
    });
    langContainer.className = "grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4";
  }
});

// --- Add floating 🌐 Change Language toggle ---
window.addEventListener("DOMContentLoaded", () => {
  const toggle = document.createElement("button");
  toggle.id = "langToggle";
  toggle.innerHTML = "🌐 Change Language";
  toggle.className =
    "fixed top-4 right-4 z-50 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs sm:text-sm text-indigo-200 border border-white/10 shadow-md backdrop-blur transition";
  toggle.onclick = () => {
    playClick();
    localStorage.removeItem("lang");
    document.getElementById("languageScreen").classList.remove("hidden");
  };
  document.body.appendChild(toggle);
});

// === PATCH BLOCK: StatWoX Final UX + Validation Enhancements ===

// 🌐 Fade-in toggle control (appears after Welcome Screen only)
window.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.style.opacity = "0";
    toggle.style.transition = "opacity 1s ease-in-out";
    // fade-in only after welcome screen hidden
    const observer = new MutationObserver(() => {
      const welcome = document.getElementById("welcomeScreen");
      if (!welcome || welcome.classList.contains("hidden")) {
        setTimeout(() => { toggle.style.opacity = "1"; }, 800);
      } else {
        toggle.style.opacity = "0";
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
});

// === Enhanced Validation: Name + Email + Skip logic ===
function validateRequiredInput(q, val) {
  if (q.id === "FullName") {
    if (!val || val.trim().length < 3 || /^\d+$/.test(val.trim()))
      return "Please enter a valid name (min 3 letters).";
  }
  if (q.id === "Email") {
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!regex.test(val.trim()))
      return "Please enter a valid email address.";
  }
  return "";
}

// Override nextQuestion and skipQuestion validation
const _nextQuestion = nextQuestion;
nextQuestion = function() {
  const q = questions[idx];
  const val = responses[q.id];
  if (REQUIRED_IDS.includes(q.id)) {
    const err = validateRequiredInput(q, val);
    if (err) {
      statusEl.textContent = err;
      setTimeout(() => (statusEl.textContent = ""), 3000);
      return;
    }
  }
  _nextQuestion();
};

const _skipQuestion = skipQuestion;
skipQuestion = function() {
  const q = questions[idx];
  // disable skip for first 3 (required)
  if (REQUIRED_IDS.includes(q.id)) {
    const val = responses[q.id];
    const err = validateRequiredInput(q, val);
    if (err) {
      statusEl.textContent = err;
      setTimeout(() => (statusEl.textContent = ""), 3000);
      return;
    }
  }
  _skipQuestion();
};

// === Dual Language Rendering (Questions + Options) ===
const _render = render;
render = function() {
  // Phase2: disable Skip for first 3 questions
  try{ skipBtn.disabled = (idx < 3); }catch(e){}

  const q = questions[idx];
  if (!q) return;
  const primaryLang = currentLang;
  const secondaryLang = currentLang === "en" ? "hi" : "en";
  titleEl.innerHTML = `
    <div class="text-xl font-semibold mb-1">${q[primaryLang] || q.en}</div>
    <div class="text-sm text-gray-400 italic">${q[secondaryLang] || ""}</div>
  `;
  subtitleEl.textContent = "";
  optionsEl.innerHTML = "";

  const isMulti = q.type === "mcq" && MULTI_SELECT_IDS.includes(q.id);

  if (q.type === "mcq") {
    q.opts.forEach(opt => {
      const [primary, secondary] = (opt.split(" / ") || [opt, ""]);
      const shownPrimary = currentLang === "en" ? primary : secondary || primary;
      const shownSecondary = currentLang === "en" ? secondary : primary || "";
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML = `
        <div class="text-base">${shownPrimary}</div>
        <div class="text-xs text-indigo-300/80">${shownSecondary}</div>
      `;
      const prev = responses[q.id];
      if (isMulti && Array.isArray(prev) && prev.includes(opt)) btn.classList.add("selected");
      else if (prev === opt) btn.classList.add("selected");

      btn.onclick = () => {
        playClick();
        if (isMulti) {
          responses[q.id] = responses[q.id] || [];
          const arr = responses[q.id];
          const i = arr.indexOf(opt);
          if (i >= 0) {
            arr.splice(i, 1);
            btn.classList.remove("selected");
          } else {
            arr.push(opt);
            btn.classList.add("selected");
          }
        } else {
          responses[q.id] = opt; try{ scheduleAutoSave(); }catch(e){};
          optionsEl.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          setTimeout(() => { nextQuestion(); }, 220);
        }
      };
      optionsEl.appendChild(btn);
    });
    nextBtn.style.display = isMulti ? "inline-block" : "none";
  } else {
    const ta = document.createElement("textarea");
    ta.id = "textResp";
    ta.rows = 5;
    ta.placeholder = currentLang === "hi"
      ? "अपना उत्तर यहाँ लिखें / Type your answer here"
      : "Type your answer here / अपना उत्तर यहाँ लिखें";
    ta.value = responses[q.id] || "";
    ta.addEventListener("input", () => { responses[q.id] = ta.value; try{ scheduleAutoSave(); }catch(e){} });
    optionsEl.appendChild(ta);
    nextBtn.style.display = "inline-block";
  }

  progressFill.style.width = `${Math.round((idx / total) * 100)}%`;
  backBtn.style.display = idx === 0 ? "none" : "block";
  statusEl.textContent = "";
};

// === Welcome Screen Dual Language Message ===
const _renderWelcomeScreen = renderWelcomeScreen;
renderWelcomeScreen = function() {
  try{ const _ws = JSON.parse(localStorage.getItem('statwox_welcome_shown') || '{}'); if(_ws && _ws.lang === currentLang){ /* already shown for this lang → skip showing */ render(); return; } }catch(e){}
  const main = document.querySelector("main");
  const card = document.getElementById("card");
  const thankyou = document.getElementById("thankyou");
  card.classList.add("hidden");
  thankyou.classList.add("hidden");

  const wrapper = document.createElement("div");
  wrapper.id = "welcomeScreen";
  wrapper.className = "text-center space-y-4";
  const hiMsg =
    "संस्कृतियों, समुदायों और विभिन्न दृष्टिकोणों के बीच — आपकी आवाज़ महत्वपूर्ण है। हम एक ऐसा मंच बना रहे हैं जहाँ हर व्यक्ति सुना और महत्व दिया जाता है। अपने सच्चे अनुभव साझा करें — अच्छे, चुनौतीपूर्ण और उनके बीच के सभी। आपकी कहानियाँ एक बेहतर डिजिटल दुनिया बनाएंगी।";
  const enMsg =
    "Across cultures, communities, and diverse perspectives — your voice matters. We're creating a space where every individual feels heard, valued, and part of something meaningful.";
  const primary = currentLang === "hi" ? hiMsg : enMsg;
  const secondary = currentLang === "hi" ? enMsg : hiMsg;
  wrapper.innerHTML = `
    <h2 class="text-2xl font-bold text-indigo-300">🌟 ${
      currentLang === "hi"
        ? "हमारे डिजिटल समुदाय में आपका स्वागत है!"
        : "Welcome to Our Digital Community Exploration!"
    }</h2>
    <p class="text-gray-300 leading-relaxed text-sm sm:text-base mb-4">
      ${primary}
    </p>
    <p class="text-gray-400 text-xs sm:text-sm italic">
      ${secondary}
    </p>
    <div class="mt-6">
      <button id="beginSurvey" class="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition text-white font-semibold">
        ${currentLang === "hi" ? "सर्वे शुरू करें" : "Start Survey"}
      </button>
    </div>
  `;
  main.appendChild(wrapper);

  document.getElementById("beginSurvey").addEventListener("click", () => {
    playClick();
    wrapper.classList.add("hidden");
    document.getElementById("card").classList.remove("hidden");
    render();
  });
};

// === PATCH BLOCK: StatWoX Final UX + Validation Enhancements ===

// 🌐 Fade-in toggle control (appears after Welcome Screen only)
window.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("langToggle");
  if (toggle) {
    toggle.style.opacity = "0";
    toggle.style.transition = "opacity 1s ease-in-out";
    // fade-in only after welcome screen hidden
    const observer = new MutationObserver(() => {
      const welcome = document.getElementById("welcomeScreen");
      if (!welcome || welcome.classList.contains("hidden")) {
        setTimeout(() => { toggle.style.opacity = "1"; }, 800);
      } else {
        toggle.style.opacity = "0";
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
});

// === Enhanced Validation: Name + Email + Skip logic ===
function validateRequiredInput(q, val) {
  if (q.id === "FullName") {
    if (!val || val.trim().length < 3 || /^\d+$/.test(val.trim()))
      return "Please enter a valid name (min 3 letters).";
  }
  if (q.id === "Email") {
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!regex.test(val.trim()))
      return "Please enter a valid email address.";
  }
  return "";
}

// Override nextQuestion and skipQuestion validation
const _nextQuestion = nextQuestion;
nextQuestion = function() {
  const q = questions[idx];
  const val = responses[q.id];
  if (REQUIRED_IDS.includes(q.id)) {
    const err = validateRequiredInput(q, val);
    if (err) {
      statusEl.textContent = err;
      setTimeout(() => (statusEl.textContent = ""), 3000);
      return;
    }
  }
  _nextQuestion();
};

const _skipQuestion = skipQuestion;
skipQuestion = function() {
  const q = questions[idx];
  // disable skip for first 3 (required)
  if (REQUIRED_IDS.includes(q.id)) {
    const val = responses[q.id];
    const err = validateRequiredInput(q, val);
    if (err) {
      statusEl.textContent = err;
      setTimeout(() => (statusEl.textContent = ""), 3000);
      return;
    }
  }
  _skipQuestion();
};

// === Dual Language Rendering (Questions + Options) ===
const _render = render;
render = function() {
  const q = questions[idx];
  if (!q) return;
  const primaryLang = currentLang;
  const secondaryLang = currentLang === "en" ? "hi" : "en";
  titleEl.innerHTML = `
    <div class="text-xl font-semibold mb-1">${q[primaryLang] || q.en}</div>
    <div class="text-sm text-gray-400 italic">${q[secondaryLang] || ""}</div>
  `;
  subtitleEl.textContent = "";
  optionsEl.innerHTML = "";

  const isMulti = q.type === "mcq" && MULTI_SELECT_IDS.includes(q.id);

  if (q.type === "mcq") {
    q.opts.forEach(opt => {
      const [primary, secondary] = (opt.split(" / ") || [opt, ""]);
      const shownPrimary = currentLang === "en" ? primary : secondary || primary;
      const shownSecondary = currentLang === "en" ? secondary : primary || "";
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerHTML = `
        <div class="text-base">${shownPrimary}</div>
        <div class="text-xs text-indigo-300/80">${shownSecondary}</div>
      `;
      const prev = responses[q.id];
      if (isMulti && Array.isArray(prev) && prev.includes(opt)) btn.classList.add("selected");
      else if (prev === opt) btn.classList.add("selected");

      btn.onclick = () => {
        playClick();
        if (isMulti) {
          responses[q.id] = responses[q.id] || [];
          const arr = responses[q.id];
          const i = arr.indexOf(opt);
          if (i >= 0) {
            arr.splice(i, 1);
            btn.classList.remove("selected");
          } else {
            arr.push(opt);
            btn.classList.add("selected");
          }
        } else {
          responses[q.id] = opt;
          optionsEl.querySelectorAll(".option-btn").forEach(b => b.classList.remove("selected"));
          btn.classList.add("selected");
          setTimeout(() => { nextQuestion(); }, 220);
        }
      };
      optionsEl.appendChild(btn);
    });
    nextBtn.style.display = isMulti ? "inline-block" : "none";
  } else {
    const ta = document.createElement("textarea");
    ta.id = "textResp";
    ta.rows = 5;
    ta.placeholder = currentLang === "hi"
      ? "अपना उत्तर यहाँ लिखें / Type your answer here"
      : "Type your answer here / अपना उत्तर यहाँ लिखें";
    ta.value = responses[q.id] || "";
    ta.addEventListener("input", () => { responses[q.id] = ta.value; });
    optionsEl.appendChild(ta);
    nextBtn.style.display = "inline-block";
  }

  progressFill.style.width = `${Math.round((idx / total) * 100)}%`;
  backBtn.style.display = idx === 0 ? "none" : "block";
  statusEl.textContent = "";
};

// === Welcome Screen Dual Language Message ===
const _renderWelcomeScreen = renderWelcomeScreen;
renderWelcomeScreen = function() {
  const main = document.querySelector("main");
  const card = document.getElementById("card");
  const thankyou = document.getElementById("thankyou");
  card.classList.add("hidden");
  thankyou.classList.add("hidden");

  const wrapper = document.createElement("div");
  wrapper.id = "welcomeScreen";
  wrapper.className = "text-center space-y-4";
  const hiMsg =
    "संस्कृतियों, समुदायों और विभिन्न दृष्टिकोणों के बीच — आपकी आवाज़ महत्वपूर्ण है। हम एक ऐसा मंच बना रहे हैं जहाँ हर व्यक्ति सुना और महत्व दिया जाता है। अपने सच्चे अनुभव साझा करें — अच्छे, चुनौतीपूर्ण और उनके बीच के सभी। आपकी कहानियाँ एक बेहतर डिजिटल दुनिया बनाएंगी।";
  const enMsg =
    "Across cultures, communities, and diverse perspectives — your voice matters. We're creating a space where every individual feels heard, valued, and part of something meaningful.";
  const primary = currentLang === "hi" ? hiMsg : enMsg;
  const secondary = currentLang === "hi" ? enMsg : hiMsg;
  wrapper.innerHTML = `
    <h2 class="text-2xl font-bold text-indigo-300">🌟 ${
      currentLang === "hi"
        ? "हमारे डिजिटल समुदाय में आपका स्वागत है!"
        : "Welcome to Our Digital Community Exploration!"
    }</h2>
    <p class="text-gray-300 leading-relaxed text-sm sm:text-base mb-4">
      ${primary}
    </p>
    <p class="text-gray-400 text-xs sm:text-sm italic">
      ${secondary}
    </p>
    <div class="mt-6">
      <button id="beginSurvey" class="px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:opacity-90 transition text-white font-semibold">
        ${currentLang === "hi" ? "सर्वे शुरू करें" : "Start Survey"}
      </button>
    </div>
  `;
  main.appendChild(wrapper);

  document.getElementById("beginSurvey").addEventListener("click", () => {
    playClick();
    wrapper.classList.add("hidden");
    document.getElementById("card").classList.remove("hidden");
    render();
  });
};

// === PATCH: Refine Toggle Visibility + Dual Language Logic ===

// Hide toggle on choose-language screen + fade in only after welcome is gone
(function() {
  const toggle = document.getElementById("langToggle");
  if (!toggle) return; // safety

  const observer = new MutationObserver(() => {
    const langScreen = document.getElementById("languageScreen");
    const welcome = document.getElementById("welcomeScreen");

    // hide toggle when language selection is visible
    if (langScreen && !langScreen.classList.contains("hidden")) {
      toggle.style.opacity = "0";
      return;
    }

    // hide toggle on welcome screen until start clicked
    if (welcome && !welcome.classList.contains("hidden")) {
      toggle.style.opacity = "0";
      return;
    }

    // after welcome is hidden → fade in
    setTimeout(() => { toggle.style.opacity = "1"; }, 600);
  });

  observer.observe(document.body, { childList: true, subtree: true });
})();


// === PATCH: Dual-language helper overwrite ===
// If lang=en => secondary=Hindi
// else => secondary=English
window.getSecondaryLang = function(primary) {
  return primary === "en" ? "hi" : "en";
};

// Patch question title rendering (non-destructive override)
(function() {
  if (!window._orig_render_question_title) {
    window._orig_render_question_title = titleEl.innerHTML;
  }

  const oldRender = render;
  render = function() {
    oldRender();

    // After original render updates content, rewrite dual text properly
    const q = questions[idx];
    if (!q) return;

    const primaryLang = currentLang;
    const secondaryLang = getSecondaryLang(primaryLang);

    const primaryText = q[primaryLang] || q.en;
    const secondaryText = q[secondaryLang] || "";

    titleEl.innerHTML = `
      <div class="text-xl font-semibold mb-1">${primaryText}</div>
      <div class="text-sm text-gray-400 italic">${secondaryText}</div>
    `;

    // Patch options
    optionsEl.querySelectorAll(".option-btn").forEach((btn, i) => {
      const opt = q.opts[i];
      if (!opt) return;
      const [optEn, optHi] = opt.split(" / ");

      const primaryOpt = primaryLang === "en" ? optEn : optHi || optEn;
      const secondaryOpt = primaryLang === "en" ? optHi : optEn;

      btn.innerHTML = `
        <div class="text-base">${primaryOpt}</div>
        <div class="text-xs text-indigo-300/80 italic">${secondaryOpt || ""}</div>
      `;
    });
  };
})();
