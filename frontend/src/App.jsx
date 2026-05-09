import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { geoMercator, geoPath } from "d3-geo";

const API = "http://127.0.0.1:8000";
const Q_COLORS = { 1:"#ef4444", 2:"#f59e0b", 3:"#eab308", 4:"#3b82f6", 5:"#00d4aa" };
const PERFIL_COLORS = {
  "Líder digital":"#00d4aa","En desarrollo":"#3b82f6",
  "Brecha crítica":"#f59e0b","Rezagado":"#ef4444"
};
const COORDS = {
  "05":{x:105,y:148},"08":{x:120,y:85},"11":{x:148,y:158},"13":{x:115,y:105},
  "15":{x:148,y:145},"17":{x:115,y:168},"18":{x:160,y:210},"19":{x:115,y:215},
  "20":{x:148,y:95},"23":{x:95,y:130},"25":{x:145,y:163},"27":{x:75,y:150},
  "41":{x:150,y:195},"44":{x:140,y:75},"47":{x:130,y:100},"50":{x:175,y:185},
  "52":{x:115,y:240},"54":{x:160,y:118},"63":{x:108,y:178},"66":{x:110,y:163},
  "68":{x:148,y:120},"70":{x:110,y:118},"73":{x:130,y:175},"76":{x:110,y:195},
  "81":{x:185,y:140},"85":{x:185,y:155},"86":{x:140,y:235},"88":{x:55,y:75},
  "91":{x:190,y:255},"94":{x:215,y:170},"95":{x:185,y:200},"97":{x:210,y:220},
  "99":{x:205,y:165}
};

function BarH({ label, val, color="#3b82f6", h=13 }) {
  return (
    <div style={{marginBottom:6}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginBottom:3}}>
        <span>{label}</span><span style={{color}}>{val??'—'}%</span>
      </div>
      <div style={{height:h,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}>
        <div style={{width:`${val||0}%`,height:"100%",background:color,borderRadius:3,transition:"width 0.5s ease"}}/>
      </div>
    </div>
  );
}

function Sparkline({ data, color="#00d4aa", width=120, height=40 }) {
  if (!data||data.length<2) return null;
  const min=Math.min(...data), max=Math.max(...data), range=max-min||0.01;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*width},${height-((v-min)/range)*height}`).join(" ");
  return (
    <svg width={width} height={height}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v,i)=>{
        const x=(i/(data.length-1))*width, y=height-((v-min)/range)*height;
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color}/>;
      })}
    </svg>
  );
}

function Panel({ title, badge, children, style={} }) {
  return (
    <div style={{background:"#141d2e",border:"1px solid #1e2d4a",borderRadius:8,overflow:"hidden",...style}}>
      <div style={{padding:"11px 16px",borderBottom:"1px solid #1e2d4a",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:500,color:"#e2e8f0"}}>{title}</span>
        {badge&&<span style={{fontSize:10,color:"#64748b"}}>{badge}</span>}
      </div>
      <div style={{padding:16}}>{children}</div>
    </div>
  );
}

function MapaColombia({ depts, selected, onSelect, onHover, getColor }) {
  const [puntos, setPuntos] = useState([]);
  const [poligonos, setPoligonos] = useState([]);

  const project = ([lon, lat]) => {
    const x = (lon + 82.5) / (82.5 - 66.8) * 280 + 10;
    const y = (13.5 - lat) / (13.5 + 4.2) * 370 + 10;
    return [x, y];
  };

  const polyToPath = (coords) => {
    return coords[0].map((pt, i) => {
      const [x, y] = project(pt);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ') + ' Z';
  };

  useEffect(() => {
    // Cargar puntos centroides
    fetch("/colombia.json").then(r => r.json()).then(geo => {
      setPuntos(geo.features.map(f => {
        const [lon, lat] = f.geometry.coordinates;
        const [x, y] = project([lon, lat]);
        return { cod: String(f.properties.DPTO).padStart(2,"0"), x, y };
      }));
    });
    // Cargar polígonos
    fetch("/colombia_poly.json").then(r => r.json()).then(geo => {
      setPoligonos(geo.features.map(f => ({
        cod: String(f.properties.DPTO).padStart(2,"0"),
        path: polyToPath(f.geometry.coordinates),
      })));
    });
  }, []);

  return (
    <svg viewBox="0 0 300 410" style={{ width:"100%", height:"100%" }}>
      {/* Polígonos de fondo */}
      {poligonos.map(p => {
        const dept = depts.find(d => d.id === p.cod);
        const color = dept ? getColor(dept) : "#1e2d4a";
        const isSelected = dept && selected?.id === dept.id;
        return (
          <path key={`poly-${p.cod}`} d={p.path}
            fill={color} fillOpacity={isSelected ? 0.25 : 0.08}
            stroke="#1e3a5f"
            strokeWidth={0.8}/>
        );
      })}

      {/* Círculos encima con datos */}
      {puntos.map(p => {
        const dept = depts.find(d => d.id === p.cod);
        if (!dept) return null;
        const color = getColor(dept);
        const isSelected = selected?.id === dept.id;
        const r = isSelected ? 13 : 10;
        return (
          <g key={`pt-${p.cod}`} style={{ cursor:"pointer" }}
            onClick={() => onSelect(dept)}
            onMouseEnter={e => onHover({ d:dept, x:e.clientX, y:e.clientY, c:color })}
            onMouseLeave={() => onHover(null)}>
            {isSelected && (
              <circle cx={p.x} cy={p.y} r={r+5}
                fill="none" stroke={color} strokeWidth={1.5} opacity={0.3}/>
            )}
            <circle cx={p.x} cy={p.y} r={r}
              fill={color} opacity={isSelected?1:0.9}
              stroke={isSelected?"#fff":"rgba(255,255,255,0.25)"}
              strokeWidth={isSelected?2:0.8}/>
            <text x={p.x} y={p.y+1}
              textAnchor="middle" dominantBaseline="middle"
              fill="#fff" fontSize={isSelected?7.5:6.5}
              fontFamily="DM Mono,monospace" fontWeight={isSelected?"600":"400"}
              style={{ pointerEvents:"none" }}>
              {dept.score?.toFixed(2)}
            </text>
          </g>
        );
      })}

      {/* Leyenda */}
      {[1,2,3,4,5].map((q,i) => (
        <g key={q}>
          <circle cx={14+i*52} cy={394} r={6} fill={Q_COLORS[q]}/>
          <text x={24+i*52} y={398} fill="#64748b"
            fontSize={7} fontFamily="DM Mono,monospace">Q{q}</text>
        </g>
      ))}
    </svg>
  );
}

export default function App() {
  const [depts,setDepts]=useState([]);
  const [resumen,setResumen]=useState({});
  const [demo,setDemo]=useState({});
  const [historico,setHistorico]=useState({});
  const [selected,setSelected]=useState(null);
  const [tab,setTab]=useState("Mapa");
  const [mapVista,setMapVista]=useState("quintil");
  const [tooltip,setTooltip]=useState(null);
  const [loading,setLoading]=useState(true);
  const chartRef=useRef(null);
  const chartInst=useRef(null);

  useEffect(()=>{
    Promise.all([
      fetch(`${API}/api/departamentos`).then(r=>r.json()),
      fetch(`${API}/api/resumen`).then(r=>r.json()),
      fetch(`${API}/api/demograficos`).then(r=>r.json()),
      fetch(`${API}/api/historico`).then(r=>r.json()),
    ]).then(([d,r,dm,h])=>{
      setDepts(d); setResumen(r); setDemo(dm); setHistorico(h);
      setSelected(d.find(x=>x.id==="27")||d[0]);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(tab!=="Histórico"||!chartRef.current||!Object.keys(historico).length) return;
    const build=()=>{
      if(!window.Chart) return;
      if(chartInst.current) chartInst.current.destroy();
      const rezagados=[...depts].sort((a,b)=>a.score-b.score).slice(0,6);
      const years=["2018","2019","2020","2021"];
      const colors=["#ef4444","#f59e0b","#8b5cf6","#06b6d4","#ec4899","#00d4aa"];
      chartInst.current=new window.Chart(chartRef.current,{
        type:"line",
        data:{labels:years,datasets:rezagados.map((d,i)=>({
          label:d.name,
          data:years.map(y=>historico[d.name]?.[y]??null),
          borderColor:colors[i],backgroundColor:"transparent",
          borderWidth:2,pointRadius:3,tension:0.4,
        }))},
        options:{responsive:true,maintainAspectRatio:false,
          plugins:{legend:{labels:{color:"#64748b",font:{size:10,family:"DM Mono"},boxWidth:10,padding:12}}},
          scales:{
            x:{ticks:{color:"#64748b",font:{size:10}},grid:{color:"rgba(255,255,255,0.04)"}},
            y:{ticks:{color:"#64748b",font:{size:10},callback:v=>v.toFixed(2)},grid:{color:"rgba(255,255,255,0.04)"},min:0.3,max:0.85}
          }}
      });
    };
    if(window.Chart){build();return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    s.onload=build; document.head.appendChild(s);
  },[tab,historico,depts]);

  function getColor(d){
    if(mapVista==="perfil") return PERFIL_COLORS[d.perfil]||"#64748b";
    if(mapVista==="brecha"){
      const b=d.brecha||0;
      if(b>45)return Q_COLORS[1];if(b>35)return Q_COLORS[2];
      if(b>25)return Q_COLORS[3];if(b>15)return Q_COLORS[4];return Q_COLORS[5];
    }
    return Q_COLORS[d.q]||"#64748b";
  }

  const sorted=[...depts].sort((a,b)=>a.score-b.score);
  const sel=selected||{};
  const histSel=historico[sel.name]||{};
  const histVals=["2018","2019","2020","2021"].map(y=>histSel[y]).filter(Boolean);

  if(loading) return(
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100vh",
      background:"#0a0f1e",color:"#64748b",fontFamily:"DM Mono,monospace"}}>
      Cargando datos ENTIC 2021 · DANE...
    </div>
  );

  return(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Fraunces:wght@400;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0f1e;color:#e2e8f0;font-family:'DM Mono',monospace;font-size:13px}
        select{background:#141d2e;color:#e2e8f0;border:1px solid #1e2d4a;border-radius:4px;padding:5px 10px;font-family:'DM Mono',monospace;font-size:12px;cursor:pointer;outline:none}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0a0f1e}::-webkit-scrollbar-thumb{background:#1e2d4a;border-radius:2px}
        tr:hover td{background:rgba(0,212,170,0.03)!important}
      `}</style>

      <div style={{display:"grid",gridTemplateRows:"auto auto 1fr",height:"100vh",background:"#0a0f1e",overflow:"hidden"}}>

        {/* TOPBAR */}
        <div style={{background:"#111827",borderBottom:"1px solid #1e2d4a",padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:32,height:32,background:"linear-gradient(135deg,#00d4aa,#3b82f6)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🌎</div>
            <div>
              <div style={{fontFamily:"'Fraunces',serif",fontSize:14,fontWeight:600}}>Plataforma Inteligencia Territorial · Brecha Digital Colombia</div>
              <div style={{fontSize:10,color:"#64748b"}}>Ministerio TIC · ENTIC 2021 + ECV 2023 · DANE · {depts.length} departamentos · Análisis avanzado</div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <span style={{fontSize:10,color:"#64748b"}}>● {resumen.total_encuestas?.toLocaleString()} encuestas</span>
            <span style={{background:"rgba(0,212,170,0.12)",color:"#00d4aa",border:"1px solid rgba(0,212,170,0.25)",borderRadius:4,padding:"3px 8px",fontSize:10}}>ENTIC 2021 · DANE</span>
          </div>
        </div>

        {/* NAV */}
        <div style={{background:"#111827",borderBottom:"1px solid #1e2d4a",padding:"0 24px",display:"flex",alignItems:"center"}}>
          {["Mapa","Demografía","Perfiles","Histórico"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{padding:"10px 18px",fontSize:11,cursor:"pointer",fontFamily:"'DM Mono',monospace",background:"transparent",border:"none",borderBottom:`2px solid ${tab===t?"#00d4aa":"transparent"}`,color:tab===t?"#00d4aa":"#64748b",transition:"all 0.2s"}}>{t}</button>
          ))}
          <div style={{marginLeft:"auto",display:"flex",gap:8}}>
            <select onChange={e=>{const d=depts.find(x=>x.id===e.target.value);if(d)setSelected(d);}}>
              {sorted.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        {/* MAIN GRID */}
        <div style={{display:"grid",gridTemplateColumns:"250px 1fr",overflow:"hidden"}}>

          {/* SIDEBAR */}
          <div style={{background:"#111827",borderRight:"1px solid #1e2d4a",display:"flex",flexDirection:"column",overflow:"hidden"}}>
            <div style={{padding:"12px 10px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
              {[
                {l:"IBRD",v:resumen.indice_nacional?.toFixed(3),c:"#00d4aa"},
                {l:"Internet",v:`${resumen.acceso_internet?.toFixed(1)}%`,c:"#3b82f6"},
                {l:"Brecha",v:`${resumen.brecha_cab_rural?.toFixed(1)} pp`,c:"#f59e0b"},
                {l:"Críticos",v:resumen.depts_criticos,c:"#ef4444"},
              ].map(k=>(
                <div key={k.l} style={{background:"#141d2e",border:"1px solid #1e2d4a",borderRadius:6,padding:"7px 9px",position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:k.c}}/>
                  <div style={{fontSize:9,color:"#64748b",textTransform:"uppercase",marginBottom:3}}>{k.l}</div>
                  <div style={{fontFamily:"'Fraunces',serif",fontSize:17,fontWeight:600,color:k.c}}>{k.v}</div>
                </div>
              ))}
            </div>
            <div style={{padding:"10px 10px 4px",fontSize:9,color:"#64748b",letterSpacing:"0.1em",textTransform:"uppercase",marginTop:6}}>Ranking · menor → mayor</div>
            <div style={{flex:1,overflowY:"auto",padding:"0 6px 10px"}}>
              {sorted.map((d,i)=>(
                <div key={d.id} onClick={()=>setSelected(d)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 6px",borderRadius:4,cursor:"pointer",marginBottom:1,background:sel.id===d.id?"rgba(0,212,170,0.08)":"transparent",transition:"background 0.15s"}}>
                  <span style={{fontSize:9,color:"#475569",width:14,textAlign:"right"}}>{i+1}</span>
                  <span style={{flex:1,fontSize:10,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.name}</span>
                  <div style={{width:36,height:3,background:"rgba(255,255,255,0.06)",borderRadius:2,overflow:"hidden"}}>
                    <div style={{width:`${d.score*100}%`,height:"100%",background:Q_COLORS[d.q]}}/>
                  </div>
                  <span style={{fontSize:10,fontWeight:500,color:Q_COLORS[d.q],width:30,textAlign:"right"}}>{d.score?.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CONTENT */}
          <div style={{overflowY:"auto",padding:14,display:"flex",flexDirection:"column",gap:12}}>

            {/* ── TAB MAPA ── */}
            {tab==="Mapa"&&(
              <>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{fontSize:10,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em"}}>Vista:</span>
                  {["quintil","brecha","perfil"].map(v=>(
                    <button key={v} onClick={()=>setMapVista(v)} style={{background:mapVista===v?"rgba(0,212,170,0.08)":"transparent",border:`1px solid ${mapVista===v?"#00d4aa":"#1e2d4a"}`,color:mapVista===v?"#00d4aa":"#64748b",borderRadius:4,padding:"4px 12px",cursor:"pointer",fontSize:11,fontFamily:"'DM Mono',monospace"}}>
                      {v==="quintil"?"Quintiles DANE":v==="brecha"?"Brecha cab/rural":"Perfiles cluster"}
                    </button>
                  ))}
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  <Panel title="Mapa · Índice brecha digital" badge="ENTIC 2021 real"
                    style={{minHeight:460}}>
                    <div style={{position:"relative",height:420}}>
                      <MapaColombia
                        depts={depts}
                        selected={sel}
                        onSelect={setSelected}
                        onHover={setTooltip}
                        getColor={getColor}
                      />
                      {tooltip&&(
                        <div style={{position:"fixed",left:tooltip.x+12,top:tooltip.y+12,
                          background:"#111827",border:"1px solid #1e2d4a",borderRadius:6,
                          padding:"8px 12px",fontSize:11,zIndex:100,pointerEvents:"none",minWidth:180}}>
                          <div style={{fontWeight:600,marginBottom:4}}>{tooltip.d.name}</div>
                          <div style={{color:"#64748b"}}>IBRD: <span style={{color:tooltip.c}}>{tooltip.d.score?.toFixed(3)}</span></div>
                          <div style={{color:"#64748b"}}>Internet cab: <span style={{color:"#3b82f6"}}>{tooltip.d.inter_cab}%</span></div>
                          <div style={{color:"#64748b"}}>Internet rural: <span style={{color:"#f59e0b"}}>{tooltip.d.inter_rural??'—'}%</span></div>
                          <div style={{color:"#64748b"}}>Brecha: <span style={{color:"#ef4444"}}>{tooltip.d.brecha} pp</span></div>
                          <div style={{color:"#64748b"}}>Perfil: <span style={{color:PERFIL_COLORS[tooltip.d.perfil]}}>{tooltip.d.perfil}</span></div>
                        </div>
                      )}
                    </div>
                  </Panel>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    <Panel title={`Detalle · ${sel.name}`} badge={<span style={{color:PERFIL_COLORS[sel.perfil]}}>{sel.perfil}</span>}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                        {[{l:"IBRD",v:sel.score?.toFixed(3),c:Q_COLORS[sel.q]},{l:"Quintil",v:`Q${sel.q}`,c:Q_COLORS[sel.q]},{l:"Brecha",v:`${sel.brecha} pp`,c:"#ef4444"},{l:"Perfil",v:sel.perfil,c:PERFIL_COLORS[sel.perfil]}].map(k=>(
                          <div key={k.l} style={{background:"#1a2235",borderRadius:6,padding:"8px 10px"}}>
                            <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>{k.l}</div>
                            <div style={{fontSize:12,fontWeight:600,color:k.c,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{k.v}</div>
                          </div>
                        ))}
                      </div>
                      <BarH label="Internet cabecera" val={sel.inter_cab} color="#3b82f6"/>
                      <BarH label="Internet rural" val={sel.inter_rural??0} color="#f59e0b"/>
                      <BarH label="Computador cabecera" val={sel.disp_cab} color="#3b82f6"/>
                      <BarH label="Computador rural" val={sel.disp_rural??0} color="#f59e0b"/>
                    </Panel>
                    <Panel title="Tendencia IBRD · dpto. seleccionado" badge="2018–2021">
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                        <div>
                          {Object.entries(histSel).map(([y,v])=>(
                            <div key={y} style={{fontSize:10,marginBottom:3}}>
                              <span style={{color:"#475569",marginRight:8}}>{y}</span>
                              <span style={{color:"#00d4aa"}}>{v?.toFixed(3)}</span>
                            </div>
                          ))}
                          {histVals.length>=2&&<div style={{fontSize:10,marginTop:6}}>
                            <span style={{color:"#64748b"}}>Variación: </span>
                            <span style={{color:histVals[histVals.length-1]>histVals[0]?"#00d4aa":"#ef4444",fontWeight:600}}>
                              {histVals[histVals.length-1]>histVals[0]?"▲":"▼"} {Math.abs((histVals[histVals.length-1]-histVals[0])*100).toFixed(1)} pp
                            </span>
                          </div>}
                        </div>
                        <Sparkline data={histVals} color={Q_COLORS[sel.q]} width={110} height={50}/>
                      </div>
                    </Panel>
                  </div>
                </div>
              </>
            )}

            {/* ── TAB DEMOGRAFÍA ── */}
            {tab==="Demografía"&&demo.por_edad&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
                  <Panel title="Acceso por grupo de edad" badge="ECV 2023">
                    {Object.entries(demo.por_edad).map(([g,v])=>(
                      <div key={g} style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginBottom:5}}>
                          <span>{g}</span><span style={{color:"#64748b"}}>n={v.n?.toLocaleString()}</span>
                        </div>
                        <BarH label="Internet" val={v.internet} color="#3b82f6" h={11}/>
                        <BarH label="Computador" val={v.computador} color="#8b5cf6" h={11}/>
                      </div>
                    ))}
                    <div style={{marginTop:4,padding:"8px",background:"rgba(59,130,246,0.06)",borderRadius:6,fontSize:10,color:"#64748b",lineHeight:1.6}}>
                      💡 Paradoja generacional: adultos mayores tienen más acceso a nivel hogar, pero menor uso activo. La brecha no es solo de acceso sino de competencias.
                    </div>
                  </Panel>
                  <Panel title="Brecha de género" badge="ECV 2023">
                    {demo.por_sexo&&Object.entries(demo.por_sexo).map(([g,v])=>(
                      <div key={g} style={{marginBottom:16}}>
                        <div style={{fontSize:11,fontWeight:500,marginBottom:8}}>{g==="Hombre"?"👨":"👩"} {g} <span style={{fontSize:10,color:"#64748b"}}>n={v.n?.toLocaleString()}</span></div>
                        <BarH label="Internet" val={v.internet} color={g==="Hombre"?"#3b82f6":"#ec4899"} h={13}/>
                        <BarH label="Computador" val={v.computador} color={g==="Hombre"?"#3b82f6":"#ec4899"} h={13}/>
                      </div>
                    ))}
                    {demo.por_sexo&&<div style={{background:"rgba(239,68,68,0.08)",borderRadius:6,padding:"8px 10px",fontSize:10}}>
                      <span style={{color:"#64748b"}}>Brecha género internet: </span>
                      <span style={{color:"#ef4444",fontWeight:600}}>{((demo.por_sexo["Hombre"]?.internet||0)-(demo.por_sexo["Mujer"]?.internet||0)).toFixed(1)} pp</span>
                      <div style={{color:"#64748b",marginTop:4,lineHeight:1.5}}>Los hombres tienen mayor acceso en todos los indicadores TIC medidos por la ECV 2023.</div>
                    </div>}
                  </Panel>
                  <Panel title="Acceso por etnia" badge="ECV 2023">
                    {demo.por_etnia&&Object.entries(demo.por_etnia).sort((a,b)=>b[1].internet-a[1].internet).map(([g,v])=>(
                      <div key={g} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"#94a3b8",marginBottom:4}}>
                          <span>{g}</span><span style={{color:"#64748b"}}>n={v.n?.toLocaleString()}</span>
                        </div>
                        <BarH label="Internet" val={v.internet} color="#06b6d4" h={10}/>
                        <BarH label="Computador" val={v.computador} color="#6366f1" h={10}/>
                      </div>
                    ))}
                    <div style={{marginTop:4,padding:"8px",background:"rgba(6,182,212,0.06)",borderRadius:6,fontSize:10,color:"#64748b",lineHeight:1.6}}>
                      💡 La brecha étnica refleja correlación entre marginación histórica y exclusión digital.
                    </div>
                  </Panel>
                </div>
                <Panel title="Síntesis multidimensional de exclusión digital" badge="Análisis cruzado">
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
                    {[
                      {dim:"Territorial",grupo:"Vaupés · Vichada",val:"~45%",gap:"vs 96% Bogotá",color:"#ef4444",nota:"Brecha de 51 pp entre dpto. mejor y peor conectado"},
                      {dim:"Generacional",grupo:"18–35 años",val:`${demo.por_edad?.["18-35 años"]?.internet}%`,gap:"internet más bajo",color:"#f59e0b",nota:"Paradoja: jóvenes usan más pero tienen menos acceso por ingresos"},
                      {dim:"Género",grupo:"Mujeres",val:`${demo.por_sexo?.["Mujer"]?.internet}%`,gap:`vs ${demo.por_sexo?.["Hombre"]?.internet}% hombres`,color:"#ec4899",nota:`Brecha de ${((demo.por_sexo?.["Hombre"]?.internet||0)-(demo.por_sexo?.["Mujer"]?.internet||0)).toFixed(1)} pp. Persistente en todos los grupos.`},
                      {dim:"Étnica",grupo:"Indígenas",val:`${demo.por_etnia?.["Indígena"]?.internet}%`,gap:"mayor exclusión",color:"#8b5cf6",nota:"Comunidades indígenas con menor acceso a dispositivos y conectividad"},
                    ].map(k=>(
                      <div key={k.dim} style={{background:"#1a2235",border:"1px solid #1e2d4a",borderRadius:8,padding:"12px 14px"}}>
                        <div style={{fontSize:9,color:"#64748b",textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>{k.dim}</div>
                        <div style={{fontFamily:"'Fraunces',serif",fontSize:22,fontWeight:600,color:k.color,marginBottom:3}}>{k.val}</div>
                        <div style={{fontSize:11,color:"#e2e8f0",marginBottom:3}}>{k.grupo}</div>
                        <div style={{fontSize:9,color:"#64748b",marginBottom:6}}>{k.gap}</div>
                        <div style={{fontSize:9,color:"#475569",lineHeight:1.5,borderTop:"1px solid #1e2d4a",paddingTop:6}}>{k.nota}</div>
                      </div>
                    ))}
                  </div>
                </Panel>
              </>
            )}

            {/* ── TAB PERFILES ── */}
            {tab==="Perfiles"&&(
              <>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                  {Object.entries(PERFIL_COLORS).map(([perfil,color])=>{
                    const grupo=depts.filter(d=>d.perfil===perfil);
                    if(!grupo.length) return null;
                    const avgIBRD=(grupo.reduce((s,d)=>s+d.score,0)/grupo.length).toFixed(3);
                    const avgBrecha=(grupo.reduce((s,d)=>s+(d.brecha||0),0)/grupo.length).toFixed(1);
                    const avgInt=(grupo.reduce((s,d)=>s+d.inter_cab,0)/grupo.length).toFixed(1);
                    return(
                      <Panel key={perfil} title={<span style={{color}}>{perfil}</span>} badge={`${grupo.length} departamentos`}>
                        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:12}}>
                          {[{l:"IBRD prom.",v:avgIBRD,c:color},{l:"Brecha prom.",v:`${avgBrecha}pp`,c:"#ef4444"},{l:"Internet cab.",v:`${avgInt}%`,c:"#3b82f6"}].map(k=>(
                            <div key={k.l} style={{background:"#1a2235",borderRadius:6,padding:"8px 10px"}}>
                              <div style={{fontSize:9,color:"#64748b",marginBottom:3}}>{k.l}</div>
                              <div style={{fontSize:14,fontWeight:600,color:k.c}}>{k.v}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:12}}>
                          {grupo.map(d=>(
                            <span key={d.id} onClick={()=>{setSelected(d);setTab("Mapa");}}
                              style={{background:"rgba(255,255,255,0.05)",border:"1px solid #1e2d4a",borderRadius:4,padding:"3px 8px",fontSize:10,cursor:"pointer",color:"#e2e8f0"}}>
                              {d.name}
                            </span>
                          ))}
                        </div>
                        <div style={{padding:"8px 10px",background:"rgba(255,255,255,0.03)",borderRadius:6,fontSize:10,color:"#94a3b8",lineHeight:1.6}}>
                          {perfil==="Líder digital"&&"Alta conectividad y brechas moderadas. Sirven como referentes de política pública y modelo de adopción digital."}
                          {perfil==="En desarrollo"&&"Conectividad media con brechas moderadas. Requieren intervención focalizada en zonas rurales dispersas."}
                          {perfil==="Brecha crítica"&&"Alta conectividad urbana pero muy baja rural. La desigualdad interna es el principal desafío de política."}
                          {perfil==="Rezagado"&&"Conectividad baja en todas las zonas. Requieren inversión estructural en infraestructura TIC y subsidios."}
                        </div>
                      </Panel>
                    );
                  })}
                </div>
                <Panel title="Tabla comparativa · Todos los departamentos">
                  <div style={{overflowX:"auto", overflowY:"auto", maxHeight:"420px"}}>
                    <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                      <thead>
                        <tr style={{borderBottom:"1px solid #1e2d4a"}}>
                          {["#","Departamento","IBRD","Q","Internet cab.","Internet rural","Brecha","Perfil"].map(h=>(
                            <th key={h} style={{padding:"6px 10px",textAlign:"left",color:"#64748b",fontSize:10,fontWeight:500}}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {sorted.map((d,i)=>(
                          <tr key={d.id} onClick={()=>setSelected(d)} style={{borderBottom:"1px solid rgba(30,45,74,0.4)",cursor:"pointer",background:sel.id===d.id?"rgba(0,212,170,0.05)":"transparent"}}>
                            <td style={{padding:"5px 10px",color:"#475569"}}>{i+1}</td>
                            <td style={{padding:"5px 10px",color:"#e2e8f0"}}>{d.name}</td>
                            <td style={{padding:"5px 10px",color:Q_COLORS[d.q],fontWeight:600}}>{d.score?.toFixed(3)}</td>
                            <td style={{padding:"5px 10px"}}><span style={{background:Q_COLORS[d.q]+"22",color:Q_COLORS[d.q],borderRadius:4,padding:"2px 6px",fontSize:10}}>Q{d.q}</span></td>
                            <td style={{padding:"5px 10px",color:"#3b82f6"}}>{d.inter_cab}%</td>
                            <td style={{padding:"5px 10px",color:"#f59e0b"}}>{d.inter_rural??'—'}%</td>
                            <td style={{padding:"5px 10px",color:"#ef4444"}}>{d.brecha} pp</td>
                            <td style={{padding:"5px 10px"}}><span style={{color:PERFIL_COLORS[d.perfil],fontSize:10}}>{d.perfil}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </>
            )}

            {/* ── TAB HISTÓRICO ── */}
            {tab==="Histórico"&&(
              <>
                <Panel title="Evolución IBRD 2018–2021 · 6 departamentos más rezagados" badge="ENTIC + tendencia" style={{gridColumn:"1/-1"}}>
                  <div style={{position:"relative",height:260}}>
                    <canvas ref={chartRef}/>
                  </div>
                </Panel>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
                  {sorted.slice(0,6).map(d=>{
                    const h=historico[d.name]||{};
                    const vals=Object.values(h);
                    const mejora=vals.length>=2?vals[vals.length-1]-vals[0]:0;
                    return(
                      <Panel key={d.id} title={d.name} badge={<span style={{color:Q_COLORS[d.q]}}>Q{d.q}</span>}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                          <div style={{flex:1}}>
                            {Object.entries(h).map(([y,v])=>(
                              <div key={y} style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                                <span style={{color:"#475569",fontSize:10,width:32}}>{y}</span>
                                <div style={{flex:1,height:10,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                                  <div style={{width:`${v*100}%`,height:"100%",background:Q_COLORS[d.q],borderRadius:2}}/>
                                </div>
                                <span style={{color:Q_COLORS[d.q],fontSize:10,width:36,textAlign:"right"}}>{v?.toFixed(3)}</span>
                              </div>
                            ))}
                            <div style={{fontSize:10,marginTop:6,color:"#64748b"}}>
                              Cambio: <span style={{color:mejora>=0?"#00d4aa":"#ef4444",fontWeight:600}}>{mejora>=0?"▲":"▼"} {Math.abs(mejora*100).toFixed(1)} pp</span>
                            </div>
                          </div>
                          <div style={{marginLeft:10}}>
                            <Sparkline data={vals} color={Q_COLORS[d.q]} width={80} height={48}/>
                          </div>
                        </div>
                      </Panel>
                    );
                  })}
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </>
  );
}