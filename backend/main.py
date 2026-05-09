from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json, os, math

app = FastAPI(title="API Plataforma Inteligencia Territorial TIC")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE = os.path.dirname(os.path.abspath(__file__))

def cargar(nombre):
    with open(os.path.join(BASE, nombre), 'r', encoding='utf-8') as f:
        return json.load(f)

@app.get("/")
def root():
    return {"status": "ok", "version": "2.0", "endpoints": [
        "/api/departamentos", "/api/resumen",
        "/api/demograficos", "/api/historico"
    ]}

@app.get("/api/departamentos")
def get_departamentos():
    try: return cargar('ibrd_depts.json')
    except Exception as e: return {"error": str(e)}

@app.get("/api/resumen")
def get_resumen():
    try:
        data = cargar('ibrd_depts.json')
        scores  = [d['score'] for d in data if d.get('score')]
        brechas = [d['brecha'] for d in data if d.get('brecha') and d['brecha'] > 0]
        return {
            "total_encuestas":  143455,
            "indice_nacional":  round(sum(scores)/len(scores), 3),
            "acceso_internet":  round(sum(d.get('inter_cab',0) for d in data)/len(data), 1),
            "brecha_cab_rural": round(sum(brechas)/len(brechas), 1) if brechas else 0,
            "depts_criticos":   len([d for d in data if d.get('q')==1]),
            "perfiles": {
                p: len([d for d in data if d.get('perfil')==p])
                for p in set(d.get('perfil','') for d in data)
            }
        }
    except Exception as e: return {"error": str(e)}

@app.get("/api/demograficos")
def get_demograficos():
    try: return cargar('demograficos.json')
    except Exception as e: return {"error": str(e)}

@app.get("/api/historico")
def get_historico():
    try: return cargar('historico.json')
    except Exception as e: return {"error": str(e)}

@app.get("/api/departamentos/{dept_id}")
def get_departamento(dept_id: str):
    try:
        data = cargar('ibrd_depts.json')
        dept = next((d for d in data if d['id']==dept_id), None)
        if not dept: return {"error": "No encontrado"}
        hist = cargar('historico.json')
        dept['historico'] = hist.get(dept['name'], {})
        return dept
    except Exception as e: return {"error": str(e)}