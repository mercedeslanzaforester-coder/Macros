import { useState, useEffect } from "react";

const PROFILE_KEY = "macroar_profile_v3";
const LOG_KEY     = "macroar_log_v3";
const WATER_KEY   = "macroar_water_v3";
const STEPS_KEY   = "macroar_steps_v3";

function todayKey() { return new Date().toISOString().split("T")[0]; }
function todayLabel() {
  return new Date().toLocaleDateString("es-AR", { weekday:"long", day:"numeric", month:"long" });
}
function weekDays() {
  const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const today = new Date().getDay();
  return Array.from({ length:7 }, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - today + i);
    return { label:days[i], key:d.toISOString().split("T")[0], isToday:i===today };
  });
}

const FRASES = [
  "Lo que hacés hoy se refleja en tu cuerpo de mañana ✨",
  "Cada comida saludable es un acto de amor propio 💖",
  "Tu cuerpo escucha todo lo que vos le das 🌸",
  "Disciplina es elegirte a vos misma todos los días 🎀",
  "No buscás la perfección, buscás el progreso 🌷",
  "Cada paso cuenta, cada vaso de agua importa 💧",
  "Tu versión más fuerte ya está en construcción 🏗️✨",
  "Hoy sufrís un poco, mañana te lo agradecés 💪🌸",
  "La constancia hace magia que la motivación no puede 🪄",
  "Comé bien, movete, tomá agua y repetí 🔁💕",
];

const SYSTEM_PROMPT = `Sos una nutricionista deportiva, simpática y empática, especializada en musculación y contexto argentino.
Cuando el usuario mencione alimentos, estimá los macros con criterio local:
- Conocés marcas argentinas: Marolio, La Serenísima, Arcor, Ser, Ilolay, Sancor, Georgalos, Bagley, etc.
- Porciones típicas argentinas: medialunas ~60g c/u, facturas ~80g, milanesa mediana ~180g, empanada ~90g, mate (sin azúcar) ~0 kcal, asado costilla ~200g, choripán ~280g.
- Para porciones sin cantidad exacta, usá porción estándar de adulto activo que hace musculación.
- Proteína: asado 18g/100g, pollo pechuga 31g/100g, milanesa novillo 22g/100g.
Respondé SOLO con JSON válido, sin texto, sin markdown.
{"nombre":"nombre descriptivo","calorias":número,"proteina":número,"carbos":número,"grasa":número,"porcion":"descripción breve"}
Todos los valores numéricos deben ser enteros. Si hay varios alimentos, sumalos en un objeto.`;

function calcMacros(p, isTraining=false) {
  const peso=parseFloat(p.peso), alt=parseFloat(p.altura), edad=parseFloat(p.edad);
  if(!peso||!alt||!edad) return null;
  let bmr = p.sexo==="masculino" ? 10*peso+6.25*alt-5*edad+5 : 10*peso+6.25*alt-5*edad-161;
  const act = {sedentario:1.2,ligero:1.375,moderado:1.55,activo:1.725,"muy activo":1.9};
  let tdee = bmr*(act[p.actividad]||1.55);
  if(p.objetivo==="bajar") tdee-=400;
  if(p.objetivo==="subir") tdee+=300;
  if(isTraining) tdee+=200;
  const proteina=Math.round(peso*2.2), grasa=Math.round(tdee*0.25/9), carbos=Math.round((tdee-proteina*4-grasa*9)/4);
  return { calorias:Math.round(tdee), proteina, carbos, grasa };
}

// ─── Kawaii Ring ─────────────────────────────────────────────────
function KawaiiRing({ value, max, color, label, unit="g", emoji }) {
  const pct = Math.min(value/(max||1),1);
  const R=34, circ=2*Math.PI*R, over=value>max;
  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
      <svg width={84} height={84} viewBox="0 0 84 84">
        <defs>
          <filter id={`shadow-${label}`}>
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor={color} floodOpacity="0.3"/>
          </filter>
        </defs>
        <circle cx={42} cy={42} r={R} fill="none" stroke="#fce4ec" strokeWidth={7}/>
        <circle cx={42} cy={42} r={R} fill="none"
          stroke={over?"#f48fb1":color} strokeWidth={7}
          strokeDasharray={`${pct*circ} ${circ}`}
          strokeLinecap="round" transform="rotate(-90 42 42)"
          style={{transition:"stroke-dasharray .6s ease",filter:`url(#shadow-${label})`}}/>
        <text x={42} y={40} textAnchor="middle" style={{fontSize:13,fontWeight:700,fill:over?"#f48fb1":color,fontFamily:"'Space Mono',monospace"}}>{Math.round(value)}</text>
        <text x={42} y={55} textAnchor="middle" style={{fontSize:10,fill:"#f8bbd0",fontFamily:"sans-serif"}}>{emoji}</text>
      </svg>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:11,fontWeight:700,color:"#e91e8c",letterSpacing:1}}>{label.toUpperCase()}</div>
        <div style={{fontSize:10,color:"#f48fb1"}}>/ {Math.round(max)}{unit}</div>
      </div>
    </div>
  );
}

// ─── Water kawaii ─────────────────────────────────────────────────
function WaterRow({ glasses, setGlasses }) {
  const goal=8;
  return (
    <div style={{background:"linear-gradient(135deg,#fce4ec,#f8bbd0)",borderRadius:20,padding:"1rem 1.25rem",border:"2px solid #f48fb1"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#c2185b"}}>💧 Agua del día</div>
          <div style={{fontSize:12,color:"#e91e8c"}}>{glasses*250}ml <span style={{color:"#f06292"}}>/ 2000ml</span></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button onClick={()=>setGlasses(Math.max(0,glasses-1))}
            style={{width:34,height:34,borderRadius:50,background:"#fff",border:"2px solid #f48fb1",color:"#e91e8c",fontSize:16,cursor:"pointer",fontWeight:700}}>−</button>
          <button onClick={()=>setGlasses(Math.min(12,glasses+1))}
            style={{width:34,height:34,borderRadius:50,background:"#e91e8c",border:"none",color:"#fff",fontSize:16,cursor:"pointer",fontWeight:700}}>+</button>
        </div>
      </div>
      <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
        {Array.from({length:goal},(_,i)=>(
          <div key={i} onClick={()=>setGlasses(i<glasses?i:i+1)}
            style={{flex:"1 1 auto",minWidth:28,height:30,borderRadius:10,cursor:"pointer",
              background:i<glasses?"#e91e8c":"rgba(255,255,255,0.5)",
              border:`2px solid ${i<glasses?"#c2185b":"#f48fb1"}`,
              display:"flex",alignItems:"center",justifyContent:"center",
              transition:"all .2s",fontSize:14}}>
            {i<glasses?"💧":""}
          </div>
        ))}
      </div>
      {glasses>=goal&&<div style={{marginTop:8,fontSize:12,color:"#c2185b",textAlign:"center",fontWeight:700}}>🎀 ¡Meta de agua cumplida!</div>}
    </div>
  );
}

// ─── Steps kawaii ─────────────────────────────────────────────────
function StepsRow({ steps, setSteps }) {
  const goal=10000;
  const pct=Math.min(100,Math.round(steps/goal*100));
  const [inputV,setInputV]=useState(String(steps));
  return (
    <div style={{background:"linear-gradient(135deg,#fce4ec,#fdf2f8)",borderRadius:20,padding:"1rem 1.25rem",border:"2px solid #f48fb1"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#c2185b"}}>👟 Pasos del día</div>
          <div style={{fontSize:22,fontWeight:700,color:"#e91e8c",fontFamily:"'Space Mono',monospace"}}>
            {steps.toLocaleString("es-AR")}
            <span style={{fontSize:12,color:"#f48fb1",fontWeight:400}}> / 10.000</span>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:22,fontWeight:700,color: pct>=100?"#c2185b":"#e91e8c"}}>{pct}%</div>
          {pct>=100&&<div style={{fontSize:11,color:"#c2185b"}}>🎀 ¡Goal!</div>}
        </div>
      </div>
      <div style={{background:"rgba(255,255,255,0.5)",borderRadius:100,height:10,overflow:"hidden",marginBottom:10}}>
        <div style={{background:"linear-gradient(90deg,#f48fb1,#e91e8c)",height:"100%",width:`${pct}%`,borderRadius:100,transition:"width .5s ease"}}/>
      </div>
      <div style={{display:"flex",gap:8}}>
        <input type="number" value={inputV} onChange={e=>setInputV(e.target.value)}
          placeholder="Ingresá tus pasos"
          style={{flex:1,padding:"8px 12px",borderRadius:12,border:"2px solid #f48fb1",fontSize:14,background:"#fff",color:"#c2185b",outline:"none",fontFamily:"'Space Mono',monospace"}}/>
        <button onClick={()=>{ const n=parseInt(inputV)||0; setSteps(Math.max(0,n)); }}
          style={{padding:"8px 16px",borderRadius:12,background:"#e91e8c",border:"none",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer"}}>OK</button>
      </div>
    </div>
  );
}

// ─── Profile Setup ────────────────────────────────────────────────
function ProfileSetup({ onSave }) {
  const [form,setForm]=useState({nombre:"",peso:"",altura:"",edad:"",sexo:"femenino",actividad:"moderado",objetivo:"mantener",diasEntrenamiento:["Lun","Mar","Jue","Vie"]});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleDay=d=>setForm(f=>({...f,diasEntrenamiento:f.diasEntrenamiento.includes(d)?f.diasEntrenamiento.filter(x=>x!==d):[...f.diasEntrenamiento,d]}));
  const macros=calcMacros(form);
  const macrosTrain=calcMacros(form,true);
  const dias=["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fce4ec 0%,#fdf2f8 50%,#fff0f5 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"2rem",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet"/>
      <div style={{maxWidth:440,width:"100%"}}>
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:40,marginBottom:8}}>🌸</div>
          <h1 style={{margin:0,fontSize:28,fontWeight:700,color:"#c2185b",fontFamily:"'Quicksand',sans-serif"}}>Tu perfil nutricional</h1>
          <p style={{color:"#f06292",fontSize:14,marginTop:6}}>Lo configurás una vez, la app hace el resto 💕</p>
        </div>

        <div style={{background:"rgba(255,255,255,0.85)",backdropFilter:"blur(10px)",borderRadius:24,padding:"1.75rem",border:"2px solid #f48fb1",boxShadow:"0 8px 32px rgba(233,30,140,0.1)"}}>
          {[["Tu nombre","text","nombre","ej: Sofi ✨"],["Peso (kg)","number","peso","ej. 62"],["Altura (cm)","number","altura","ej. 165"],["Edad","number","edad","ej. 26"]].map(([label,type,key,ph])=>(
            <div key={key} style={{marginBottom:"1rem"}}>
              <label style={{fontSize:12,fontWeight:700,color:"#e91e8c",letterSpacing:0.5,display:"block",marginBottom:5}}>{label}</label>
              <input type={type} placeholder={ph} value={form[key]} onChange={e=>set(key,e.target.value)}
                style={{width:"100%",padding:"10px 14px",borderRadius:14,border:"2px solid #f8bbd0",fontSize:15,boxSizing:"border-box",background:"#fff9fc",color:"#c2185b",outline:"none",fontFamily:"inherit"}}/>
            </div>
          ))}

          {[["Sexo","sexo",["femenino","masculino"]],["Actividad","actividad",["sedentario","ligero","moderado","activo","muy activo"]],["Objetivo","objetivo",["bajar","mantener","subir"]]].map(([label,key,opts])=>(
            <div key={key} style={{marginBottom:"1rem"}}>
              <label style={{fontSize:12,fontWeight:700,color:"#e91e8c",letterSpacing:0.5,display:"block",marginBottom:5}}>{label}</label>
              <select value={form[key]} onChange={e=>set(key,e.target.value)}
                style={{width:"100%",padding:"10px 14px",borderRadius:14,border:"2px solid #f8bbd0",fontSize:15,background:"#fff9fc",color:"#c2185b",appearance:"none",fontFamily:"inherit"}}>
                {opts.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}

          <div style={{marginBottom:"1.25rem"}}>
            <label style={{fontSize:12,fontWeight:700,color:"#e91e8c",letterSpacing:0.5,display:"block",marginBottom:8}}>💪 Días de entrenamiento (pesas)</label>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {dias.map(d=>(
                <button key={d} onClick={()=>toggleDay(d)}
                  style={{padding:"7px 13px",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",
                    background:form.diasEntrenamiento.includes(d)?"#e91e8c":"#fff0f5",
                    border:`2px solid ${form.diasEntrenamiento.includes(d)?"#c2185b":"#f8bbd0"}`,
                    color:form.diasEntrenamiento.includes(d)?"#fff":"#f48fb1",transition:"all .2s"}}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {macros&&(
            <div style={{background:"linear-gradient(135deg,#fce4ec,#fff0f5)",borderRadius:16,padding:"1rem",marginBottom:"1.25rem",border:"1.5px solid #f8bbd0"}}>
              <div style={{fontSize:12,fontWeight:700,color:"#e91e8c",marginBottom:10}}>🎀 Tus macros calculados</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"10px 8px"}}>
                {[["🔥 Día normal",`${macros.calorias} kcal`,"#c2185b"],["💪 Día entreno",`${macrosTrain?.calorias} kcal`,"#e91e8c"],["🥩 Proteína",`${macros.proteina}g / ${macrosTrain?.proteina}g`,"#e91e8c"],["🍞 Carbos",`${macros.carbos}g / ${macrosTrain?.carbos}g`,"#c2185b"],["🥑 Grasa",`${macros.grasa}g`,"#ad1457"],["💧 Agua","2 litros / día","#1565c0"]].map(([l,v,c])=>(
                  <div key={l}><div style={{fontSize:11,color:"#f48fb1"}}>{l}</div><div style={{fontSize:15,fontWeight:700,color:c,fontFamily:"'Space Mono',monospace"}}>{v}</div></div>
                ))}
              </div>
            </div>
          )}

          <button onClick={()=>{ if(macros) onSave({...form,...macros,macrosTrain}); }} disabled={!macros}
            style={{width:"100%",padding:"15px",background:macros?"linear-gradient(135deg,#e91e8c,#c2185b)":"#f8bbd0",color:"#fff",border:"none",borderRadius:16,fontSize:16,fontWeight:700,cursor:macros?"pointer":"not-allowed",boxShadow:macros?"0 4px 20px rgba(233,30,140,0.4)":"none",letterSpacing:0.5}}>
            ¡Empezar mi journey! 🌸
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [profile,setProfile]=useState(null);
  const [log,setLog]=useState({});
  const [water,setWaterRaw]=useState({});
  const [stepsData,setStepsData]=useState({});
  const [input,setInput]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [tab,setTab]=useState("hoy");
  const [ready,setReady]=useState(false);
  const [frase]=useState(()=>FRASES[Math.floor(Math.random()*FRASES.length)]);

  useEffect(()=>{
    const p=localStorage.getItem(PROFILE_KEY);
    const l=localStorage.getItem(LOG_KEY);
    const w=localStorage.getItem(WATER_KEY);
    const s=localStorage.getItem(STEPS_KEY);
    if(p) setProfile(JSON.parse(p));
    if(l) setLog(JSON.parse(l));
    if(w) setWaterRaw(JSON.parse(w));
    if(s) setStepsData(JSON.parse(s));
    setReady(true);
  },[]);

  if(!ready) return null;
  if(!profile) return <ProfileSetup onSave={p=>{ localStorage.setItem(PROFILE_KEY,JSON.stringify(p)); setProfile(p); }}/>;

  const tKey=todayKey();
  const dayName=new Date().toLocaleDateString("es-AR",{weekday:"short"}).replace(".","");
  const dayShort=dayName.charAt(0).toUpperCase()+dayName.slice(1,3);
  const isTraining=profile.diasEntrenamiento?.some(d=>d.slice(0,3)===dayShort||d===dayShort||d.startsWith(dayShort));
  const goals=isTraining&&profile.macrosTrain?profile.macrosTrain:profile;
  const todayLog=log[tKey]||[];
  const glasses=water[tKey]||0;
  const steps=stepsData[tKey]||0;

  const totals=todayLog.reduce((a,i)=>({calorias:a.calorias+(i.calorias||0),proteina:a.proteina+(i.proteina||0),carbos:a.carbos+(i.carbos||0),grasa:a.grasa+(i.grasa||0)}),{calorias:0,proteina:0,carbos:0,grasa:0});

  function setGlasses(n){ const u={...water,[tKey]:n}; setWaterRaw(u); localStorage.setItem(WATER_KEY,JSON.stringify(u)); }
  function setSteps(n){ const u={...stepsData,[tKey]:n}; setStepsData(u); localStorage.setItem(STEPS_KEY,JSON.stringify(u)); }

  async function handleAdd(){
    if(!input.trim()) return;
    setLoading(true); setError("");
    try {
      const resp=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",headers:{"Content-Type":"application/json","x-api-key":import.meta.env.VITE_ANTHROPIC_API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,system:SYSTEM_PROMPT,messages:[{role:"user",content:input}]})
      });
      const data=await resp.json();
      const text=data.content?.[0]?.text||"";
      const parsed=JSON.parse(text.replace(/```json|```/g,"").trim());
      const entry={...parsed,id:Date.now(),hora:new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}),raw:input};
      const updated={...log,[tKey]:[...todayLog,entry]};
      setLog(updated); localStorage.setItem(LOG_KEY,JSON.stringify(updated));
      setInput("");
    } catch { setError("No se pudo procesar. Intentá de nuevo 🥺"); }
    setLoading(false);
  }

  function removeItem(id){ const u={...log,[tKey]:todayLog.filter(i=>i.id!==id)}; setLog(u); localStorage.setItem(LOG_KEY,JSON.stringify(u)); }

  const calLeft=Math.round(goals.calorias-totals.calorias);
  const calPct=Math.min(100,Math.round(totals.calorias/goals.calorias*100));
  const weeks=weekDays();

  // Score del día (0-100) para mostrar estrellitas
  const waterScore=Math.min(glasses/8,1);
  const stepsScore=Math.min(steps/10000,1);
  const calScore=calPct>=80&&calPct<=110?1:calPct>=60?0.5:0;
  const protScore=Math.min(totals.proteina/goals.proteina,1);
  const dayScore=Math.round((waterScore+stepsScore+calScore+protScore)/4*100);

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#fce4ec 0%,#fdf2f8 40%,#fff0f5 100%)",fontFamily:"'DM Sans',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Quicksand:wght@500;600;700&display=swap" rel="stylesheet"/>

      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#e91e8c,#c2185b)",padding:"1.25rem 1.5rem",boxShadow:"0 4px 20px rgba(233,30,140,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",letterSpacing:2}}>🌸 {todayLabel().toUpperCase()}</div>
            <div style={{fontSize:20,fontWeight:700,color:"#fff",fontFamily:"'Quicksand',sans-serif"}}>
              Hola, {profile.nombre||"hermosa"} &nbsp;
              <span style={{fontSize:12,padding:"3px 10px",borderRadius:20,background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff"}}>
                {isTraining?"💪 Día de entreno":"🌙 Día de descanso"}
              </span>
            </div>
          </div>
          <button onClick={()=>{ localStorage.removeItem(PROFILE_KEY); setProfile(null); }}
            style={{background:"rgba(255,255,255,0.2)",border:"1px solid rgba(255,255,255,0.3)",color:"#fff",fontSize:11,padding:"5px 10px",borderRadius:10,cursor:"pointer"}}>perfil</button>
        </div>
        {/* Frase motivacional */}
        <div style={{background:"rgba(255,255,255,0.15)",borderRadius:12,padding:"8px 12px",fontSize:12,color:"#fff",fontStyle:"italic",fontFamily:"'Quicksand',sans-serif",fontWeight:600}}>
          ✨ {frase}
        </div>
      </div>

      {/* Score banner */}
      <div style={{background:"#fff",borderBottom:"2px solid #fce4ec",padding:"10px 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{fontSize:12,color:"#f48fb1",fontWeight:700}}>SCORE DEL DÍA</div>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          {Array.from({length:5},(_,i)=>(
            <span key={i} style={{fontSize:16,opacity:i<Math.round(dayScore/20)?1:0.2}}>⭐</span>
          ))}
          <span style={{fontSize:12,color:"#e91e8c",fontWeight:700,marginLeft:4,fontFamily:"'Space Mono',monospace"}}>{dayScore}%</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:"#fff",borderBottom:"2px solid #fce4ec"}}>
        {["hoy","semana"].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            style={{flex:1,padding:"12px",background:"none",border:"none",cursor:"pointer",fontSize:13,fontWeight:700,
              color:tab===t?"#e91e8c":"#f48fb1",fontFamily:"'Quicksand',sans-serif",
              borderBottom:tab===t?"3px solid #e91e8c":"3px solid transparent"}}>
            {t==="hoy"?"🌸 Hoy":"📅 Semana"}
          </button>
        ))}
      </div>

      <div style={{maxWidth:500,margin:"0 auto",padding:"1.25rem"}}>
        {tab==="hoy"&&<>
          {/* Calorias card */}
          <div style={{background:"#fff",borderRadius:20,padding:"1.25rem",marginBottom:"1rem",border:"2px solid #f8bbd0",boxShadow:"0 4px 20px rgba(233,30,140,0.08)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
              <div>
                <div style={{fontSize:11,color:"#f48fb1",fontWeight:700,letterSpacing:1}}>🔥 CALORÍAS</div>
                <div style={{fontSize:38,fontWeight:700,color:totals.calorias>goals.calorias?"#e91e8c":"#c2185b",fontFamily:"'Space Mono',monospace",lineHeight:1.1}}>
                  {Math.round(totals.calorias)}<span style={{fontSize:16,color:"#f48fb1",fontWeight:400}}> / {goals.calorias}</span>
                </div>
                <div style={{fontSize:13,color:calLeft<0?"#e91e8c":"#4caf50",fontWeight:700,marginTop:2}}>
                  {calLeft<0?`🚨 +${Math.abs(calLeft)} kcal de más`:`💚 ${calLeft} kcal restantes`}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:11,color:"#f48fb1"}}>objetivo</div>
                <div style={{fontSize:12,color:"#e91e8c",fontWeight:700}}>{isTraining?"Entreno":"Descanso"}</div>
                <div style={{fontSize:22,marginTop:4}}>{calPct>=100?"🎉":calPct>=70?"😊":"🍽️"}</div>
              </div>
            </div>
            <div style={{background:"#fce4ec",borderRadius:100,height:10,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(90deg,#f48fb1,#e91e8c)",height:"100%",width:`${calPct}%`,borderRadius:100,transition:"width .5s ease",boxShadow:"0 0 8px rgba(233,30,140,0.4)"}}/>
            </div>
          </div>

          {/* Macro rings */}
          <div style={{background:"#fff",borderRadius:20,padding:"1.25rem",marginBottom:"1rem",border:"2px solid #f8bbd0",boxShadow:"0 4px 20px rgba(233,30,140,0.08)",display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>
            <KawaiiRing value={totals.proteina} max={goals.proteina} color="#e91e8c" label="Proteína" emoji="🥩"/>
            <KawaiiRing value={totals.carbos}   max={goals.carbos}   color="#f06292" label="Carbos"   emoji="🍞"/>
            <KawaiiRing value={totals.grasa}    max={goals.grasa}    color="#f48fb1" label="Grasa"    emoji="🥑"/>
          </div>

          {/* Water */}
          <div style={{marginBottom:"1rem"}}><WaterRow glasses={glasses} setGlasses={setGlasses}/></div>

          {/* Steps */}
          <div style={{marginBottom:"1rem"}}><StepsRow steps={steps} setSteps={setSteps}/></div>

          {/* Input */}
          <div style={{background:"#fff",borderRadius:20,padding:"1.25rem",marginBottom:"1rem",border:"2px solid #f8bbd0",boxShadow:"0 4px 20px rgba(233,30,140,0.08)"}}>
            <div style={{fontSize:12,fontWeight:700,color:"#e91e8c",letterSpacing:1,marginBottom:8}}>🍽️ ¿QUÉ COMISTE?</div>
            <textarea value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleAdd();} }}
              placeholder="ej: 2 medialunas y un café con leche, milanesa con ensalada..."
              style={{width:"100%",background:"#fff9fc",border:"2px solid #f8bbd0",borderRadius:14,padding:"10px 14px",fontSize:14,color:"#c2185b",resize:"none",outline:"none",boxSizing:"border-box",fontFamily:"inherit",minHeight:64}}
              rows={2}/>
            {error&&<div style={{fontSize:12,color:"#e91e8c",marginTop:6}}>{error}</div>}
            <button onClick={handleAdd} disabled={loading||!input.trim()}
              style={{marginTop:10,width:"100%",padding:"13px",background:(!loading&&input.trim())?"linear-gradient(135deg,#e91e8c,#c2185b)":"#fce4ec",color:(!loading&&input.trim())?"#fff":"#f48fb1",border:"none",borderRadius:14,fontSize:14,fontWeight:700,cursor:(!loading&&input.trim())?"pointer":"not-allowed",transition:"all .2s",boxShadow:(!loading&&input.trim())?"0 4px 16px rgba(233,30,140,0.35)":"none"}}>
              {loading?"🤔 Calculando con Claude...":"Agregar comida 🌸"}
            </button>
            <div style={{fontSize:11,color:"#f8bbd0",marginTop:6,textAlign:"center"}}>Conoce marcas argentinas: Ser, La Serenísima, Marolio, Arcor... 🇦🇷</div>
          </div>

          {/* Log */}
          {todayLog.length===0?(
            <div style={{textAlign:"center",padding:"2rem",color:"#f8bbd0"}}>
              <div style={{fontSize:40,marginBottom:8}}>🌸</div>
              <div style={{fontSize:14,fontWeight:600}}>Registrá tu primera comida del día</div>
              <div style={{fontSize:12,marginTop:4,fontStyle:"italic"}}>{frase}</div>
            </div>
          ):(
            <div>
              <div style={{fontSize:11,fontWeight:700,color:"#f48fb1",letterSpacing:1,marginBottom:10}}>📋 REGISTRO DE HOY</div>
              {[...todayLog].reverse().map(item=>(
                <div key={item.id} style={{background:"#fff",borderRadius:16,padding:"1rem 1.25rem",marginBottom:8,border:"1.5px solid #fce4ec",boxShadow:"0 2px 12px rgba(233,30,140,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#c2185b"}}>{item.nombre}</div>
                      <div style={{fontSize:11,color:"#f48fb1",marginTop:2}}>{item.hora} · {item.porcion}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700,color:"#e91e8c"}}>
                        {Math.round(item.calorias)}<span style={{fontSize:10,color:"#f48fb1"}}>kcal</span>
                      </div>
                      <button onClick={()=>removeItem(item.id)}
                        style={{background:"#fce4ec",border:"none",color:"#f48fb1",fontSize:14,cursor:"pointer",width:24,height:24,borderRadius:50,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6}}>
                    {[["🥩 P",item.proteina,"#fce4ec","#e91e8c"],["🍞 C",item.carbos,"#fce4ec","#f06292"],["🥑 G",item.grasa,"#fce4ec","#f48fb1"]].map(([l,v,bg,c])=>(
                      <div key={l} style={{background:bg,borderRadius:8,padding:"3px 8px",fontSize:12,fontWeight:700,color:c,border:`1px solid ${c}44`}}>
                        {l} {Math.round(v)}g
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>}

        {tab==="semana"&&(
          <div>
            <div style={{fontSize:11,fontWeight:700,color:"#f48fb1",letterSpacing:1,marginBottom:14}}>📅 ESTA SEMANA</div>
            {weeks.map(({label,key,isToday})=>{
              const dl=log[key]||[];
              const dt=dl.reduce((a,i)=>({cal:a.cal+(i.calorias||0),pro:a.pro+(i.proteina||0)}),{cal:0,pro:0});
              const dw=water[key]||0;
              const ds=stepsData[key]||0;
              const dTrain=profile.diasEntrenamiento?.some(d=>d.slice(0,3)===label||d===label);
              const dGoal=dTrain&&profile.macrosTrain?profile.macrosTrain.calorias:profile.calorias;
              const pct=Math.min(100,Math.round(dt.cal/dGoal*100));
              return (
                <div key={key} style={{background:"#fff",border:isToday?"2px solid #e91e8c":"1.5px solid #fce4ec",borderRadius:16,padding:"1rem 1.25rem",marginBottom:10,boxShadow:isToday?"0 4px 16px rgba(233,30,140,0.15)":"none"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <div style={{fontWeight:700,fontSize:15,color:isToday?"#e91e8c":"#c2185b"}}>{label}</div>
                      {isToday&&<span style={{fontSize:10,background:"#e91e8c",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:700}}>hoy</span>}
                      {dTrain&&<span style={{fontSize:10,background:"#fce4ec",color:"#e91e8c",padding:"2px 8px",borderRadius:10,fontWeight:700}}>💪 entreno</span>}
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:15,fontWeight:700,color:dt.cal===0?"#f8bbd0":"#c2185b"}}>{Math.round(dt.cal)}<span style={{fontSize:10,color:"#f48fb1"}}>kcal</span></div>
                      <div style={{fontSize:10,color:"#f48fb1"}}>💧{dw*250}ml · 👟{ds.toLocaleString("es-AR")}</div>
                    </div>
                  </div>
                  <div style={{background:"#fce4ec",borderRadius:100,height:6}}>
                    <div style={{background:"linear-gradient(90deg,#f48fb1,#e91e8c)",height:"100%",width:`${pct}%`,borderRadius:100,transition:"width .4s"}}/>
                  </div>
                  {/* mini score día */}
                  <div style={{display:"flex",gap:3,marginTop:6,alignItems:"center"}}>
                    {Array.from({length:5},(_,i)=>{
                      const sc=Math.round((Math.min(dw/8,1)+Math.min(ds/10000,1)+(pct>=80&&pct<=110?1:0)+Math.min(dt.pro/(profile.proteina||1),1))/4*100);
                      return <span key={i} style={{fontSize:12,opacity:i<Math.round(sc/20)?1:0.15}}>⭐</span>;
                    })}
                    {dl.length===0&&key<=tKey&&<span style={{fontSize:10,color:"#f8bbd0",marginLeft:4}}>sin registros</span>}
                  </div>
                </div>
              );
            })}

            {/* Resumen semanal */}
            <div style={{background:"linear-gradient(135deg,#fce4ec,#fff0f5)",border:"2px solid #f48fb1",borderRadius:20,padding:"1.25rem",marginTop:8}}>
              <div style={{fontSize:12,fontWeight:700,color:"#e91e8c",marginBottom:12}}>🎀 RESUMEN DE LA SEMANA</div>
              {(()=>{
                const tw=weeks.reduce((a,{key})=>{
                  const dl=log[key]||[];
                  const t=dl.reduce((b,i)=>({cal:b.cal+(i.calorias||0),pro:b.pro+(i.proteina||0),car:b.car+(i.carbos||0),gra:b.gra+(i.grasa||0)}),{cal:0,pro:0,car:0,gra:0});
                  return {cal:a.cal+t.cal,pro:a.pro+t.pro,car:a.car+t.car,gra:a.gra+t.gra,days:a.days+(dl.length>0?1:0),water:a.water+(water[key]||0),steps:a.steps+(stepsData[key]||0)};
                },{cal:0,pro:0,car:0,gra:0,days:0,water:0,steps:0});
                const avg=n=>tw.days>0?Math.round(n/tw.days):0;
                return (
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px 8px"}}>
                    {[["🔥 Prom. calorías",`${avg(tw.cal)} kcal`],["📅 Días registrados",`${tw.days} / 7`],["🥩 Prom. proteína",`${avg(tw.pro)}g`],["🍞 Prom. carbos",`${avg(tw.car)}g`],["💧 Agua total",`${tw.water*250}ml`],["👟 Pasos total",tw.steps.toLocaleString("es-AR")]].map(([l,v])=>(
                      <div key={l}><div style={{fontSize:11,color:"#f48fb1"}}>{l}</div><div style={{fontSize:15,fontWeight:700,color:"#c2185b",fontFamily:"'Space Mono',monospace"}}>{v}</div></div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
