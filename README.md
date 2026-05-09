# 🌎 Plataforma de Inteligencia Territorial
## Índice de Brecha Digital por Departamento · Colombia

> Dashboard analítico avanzado para la visualización, análisis y toma de decisiones sobre la brecha digital en Colombia, desarrollado con datos reales de la **ENTIC 2021** y la **ECV 2023** del DANE.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-4+-646CFF?style=flat&logo=vite&logoColor=white)
![Jupyter](https://img.shields.io/badge/Jupyter-Notebook-F37626?style=flat&logo=jupyter&logoColor=white)

---

## 📋 Tabla de contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Requisitos previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración de datos](#-configuración-de-datos)
- [Uso](#-uso)
- [Módulos del dashboard](#-módulos-del-dashboard)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Tecnologías](#-tecnologías)
- [Fuentes de datos](#-fuentes-de-datos)

---

## 📌 Descripción

Esta plataforma permite al **Ministerio TIC**, gobernaciones, alcaldías e investigadores visualizar y analizar el **Índice de Brecha Digital por Departamento (IBRD)** en Colombia, calculado a partir de los microdatos oficiales del DANE.

El sistema procesa **143.455 encuestas** de la ENTIC 2021 y **240.212 registros** de la ECV 2023 para generar indicadores de acceso, uso y apropiación de TIC desagregados por:

- Departamento y zona (cabecera / rural)
- Grupo de edad (5-17, 18-35, 36-60, 60+)
- Género (hombre / mujer)
- Grupo étnico (indígena, afrocolombiano, gitano, raizal)
- Perfil digital (clustering K-Means)

---

## ✨ Características

- 📊 **Mapa interactivo** con índice IBRD por departamento coloreado por quintiles DANE
- 👥 **Análisis demográfico** por edad, género y etnia con datos reales ECV 2023
- 🤖 **Clustering avanzado** K-Means en 4 perfiles digitales (Líder, En desarrollo, Brecha crítica, Rezagado)
- 📈 **Evolución histórica** 2018–2021 con sparklines por departamento
- 🔄 **Pipeline automatizado** de procesamiento de microdatos DANE via Jupyter
- ⚡ **API REST** con FastAPI para consumo desde cualquier cliente
- 🌐 **Sin dependencias de mapas externos** — funciona completamente offline

---

## 🏗 Arquitectura

```
Microdatos DANE (CSV)
        │
        ▼
┌─────────────────┐
│  Jupyter Notebook│  ← análisis.ipynb
│  Python + Pandas │  ← Limpieza, cálculo IBRD, clustering
└────────┬────────┘
         │ exporta JSON
         ▼
┌─────────────────┐
│   Backend       │  ← main.py
│   FastAPI       │  ← API REST en localhost:8000
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│   Frontend      │  ← App.jsx
│   React + Vite  │  ← Dashboard en localhost:5173
└─────────────────┘
```

---

## 💻 Requisitos previos

Antes de instalar, asegúrate de tener lo siguiente en tu máquina:

| Herramienta | Versión mínima | Descarga |
|-------------|---------------|----------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Git | cualquiera | [git-scm.com](https://git-scm.com) |
| VS Code | cualquiera | [code.visualstudio.com](https://code.visualstudio.com) |

> ⚠️ **Importante**: Al instalar Python en Windows, marca la casilla **"Add Python to PATH"**

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU-USUARIO/plataforma-tic-colombia.git
cd plataforma-tic-colombia
```

### 2. Configurar el Backend

```bash
# Entrar a la carpeta del backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar el entorno virtual
# En Windows CMD:
venv\Scripts\activate.bat
# En Mac/Linux:
source venv/bin/activate

# Instalar dependencias
pip install fastapi uvicorn pandas numpy scikit-learn jupyter pyreadstat
```

Verifica que la instalación fue exitosa:
```bash
uvicorn --version
# Debe mostrar: Running uvicorn 0.x.x
```

### 3. Configurar el Frontend

Abre una **nueva terminal** y ejecuta:

```bash
# Entrar a la carpeta del frontend
cd frontend

# Instalar dependencias de Node
npm install

# Instalar librerías adicionales
npm install axios recharts d3
```

Verifica que la instalación fue exitosa:
```bash
npm run dev
# Debe mostrar: Local: http://localhost:5173/
```

### 4. Instalar extensiones de VS Code (recomendadas)

Abre VS Code y desde el panel de extensiones (`Ctrl+Shift+X`) instala:

- **Python** — soporte completo Python
- **Pylance** — autocompletado inteligente
- **Jupyter** — para ejecutar el notebook
- **ES7+ React Snippets** — atajos para React
- **Tailwind CSS IntelliSense** — autocompletado CSS

---

## 📊 Configuración de datos

### Paso 1 — Descargar los microdatos del DANE

Descarga los siguientes datasets desde el portal oficial:

| Dataset | Fuente | URL |
|---------|--------|-----|
| ENTIC 2021 Hogares | DANE | [microdatos.dane.gov.co](https://microdatos.dane.gov.co) |
| ECV 2023 · Caract. Hogar y TIC | DANE | [microdatos.dane.gov.co](https://microdatos.dane.gov.co) |
| Zonas WiFi municipios | MinTIC | [datos.gov.co](https://datos.gov.co) |
| Índice Brecha Digital | MinTIC | [colombiatic.mintic.gov.co](https://colombiatic.mintic.gov.co) |

Coloca los archivos descargados en la carpeta `datos/`:

```
datos/
  ├── Caract_Hogar y tenencia TIC_ECV2023.csv
  ├── Datos_ENTIC 2021 Hogares.csv
  ├── Mapa_de__zonas_Wifi_del_municipio.csv
  └── articles-383104_recurso_00.csv
```

### Paso 2 — Ejecutar el notebook de análisis

1. Abre VS Code
2. Navega a `datos/analisis.ipynb`
3. Haz clic en **Run All** (`Ctrl+Shift+P` → "Run All Cells")
4. Espera a que todas las celdas terminen (aprox. 2–3 minutos)
5. Verifica que se generaron los archivos en `backend/`:
   - `ibrd_depts.json` — índice por departamento
   - `demograficos.json` — análisis por grupos
   - `historico.json` — evolución temporal

### Paso 3 — Verificar los datos generados

```bash
# En la carpeta backend/
# Verifica que los archivos existen
dir backend\*.json

# Debe mostrar:
# ibrd_depts.json
# demograficos.json
# historico.json
```

---

## ▶️ Uso

### Iniciar el backend

```bash
cd backend
venv\Scripts\activate.bat      # Windows
# o: source venv/bin/activate  # Mac/Linux

uvicorn main:app --reload --port 8000
```

Verifica que el backend funciona abriendo en el navegador:
```
http://127.0.0.1:8000
```
Debe mostrar: `{"status":"ok","version":"2.0",...}`

### Iniciar el frontend

En una **segunda terminal**:

```bash
cd frontend
npm run dev
```

Abre el dashboard en el navegador:
```
http://localhost:5173
```

### Endpoints disponibles de la API

| Endpoint | Descripción |
|----------|-------------|
| `GET /api/departamentos` | Índice IBRD de los 33 departamentos |
| `GET /api/resumen` | KPIs nacionales agregados |
| `GET /api/demograficos` | Análisis por edad, género y etnia |
| `GET /api/historico` | Evolución temporal 2018–2021 |
| `GET /api/departamentos/{id}` | Detalle de un departamento específico |
| `GET /docs` | Documentación interactiva Swagger |

---

## 📱 Módulos del dashboard

### 🗺 Mapa
Visualización geográfica del Índice IBRD con tres vistas:
- **Quintiles DANE** — clasificación en 5 grupos según metodología oficial
- **Brecha cab/rural** — diferencia en puntos porcentuales entre zonas
- **Perfiles cluster** — agrupación por similitud de indicadores TIC

### 👥 Demografía
Análisis de exclusión digital por grupos poblacionales:
- Acceso a internet y computador por grupo de edad
- Brecha de género en todos los indicadores TIC
- Comparativo por grupo étnico (indígena, afrocolombiano, gitano, raizal)
- Matriz síntesis multidimensional de exclusión

### 🤖 Perfiles
Clustering K-Means con 4 perfiles digitales:
- **Líder digital** — alta conectividad, brechas moderadas
- **En desarrollo** — conectividad media, brechas moderadas
- **Brecha crítica** — alta conectividad urbana, muy baja rural
- **Rezagado** — baja conectividad en todas las zonas

### 📈 Histórico
Evolución del IBRD 2018–2021:
- Gráfico de líneas para los 6 departamentos más rezagados
- Sparklines individuales por departamento
- Indicador de variación total en el período

---

## 📁 Estructura del proyecto

```
plataforma-tic-colombia/
│
├── backend/                    # API FastAPI
│   ├── main.py                 # Endpoints REST
│   ├── ibrd_depts.json         # Datos calculados por notebook
│   ├── demograficos.json       # Análisis demográfico
│   ├── historico.json          # Serie temporal
│   └── requirements.txt        # Dependencias Python
│
├── frontend/                   # Dashboard React
│   ├── src/
│   │   └── App.jsx             # Componente principal
│   ├── public/
│   │   ├── colombia.json       # Centroides geográficos
│   │   └── colombia_poly.json  # Polígonos departamentales
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── datos/                      # Microdatos DANE (no incluidos en repo)
│   ├── analisis.ipynb          # Notebook de procesamiento
│   └── .gitkeep
│
├── .gitignore
└── README.md
```

---

## 🛠 Tecnologías

### Backend
| Librería | Uso |
|----------|-----|
| FastAPI | Framework API REST |
| Uvicorn | Servidor ASGI |
| Pandas | Procesamiento de microdatos |
| NumPy | Cálculos estadísticos |
| Scikit-learn | Clustering K-Means |
| Jupyter | Notebook de análisis |

### Frontend
| Librería | Uso |
|----------|-----|
| React 18 | Framework UI |
| Vite | Bundler y dev server |
| D3 | Proyección geográfica |
| Recharts | Gráficos de tendencia |
| Chart.js | Gráfico de líneas histórico |

---

## 📚 Fuentes de datos

| Fuente | Dataset | Registros | Año |
|--------|---------|-----------|-----|
| DANE | ENTIC — Encuesta TIC Hogares | 143.455 | 2021 |
| DANE | ECV — Calidad de Vida | 240.212 | 2023 |
| MinTIC | Zonas WiFi municipios | 56 | 2026 |
| MinTIC | Índice Brecha Digital | 21.630 | 2023 |

> Los microdatos del DANE requieren registro gratuito en [microdatos.dane.gov.co](https://microdatos.dane.gov.co)

---

## 👨‍💻 Desarrollado con

- **Datos**: DANE — Departamento Administrativo Nacional de Estadística
- **Metodología**: Quintiles DANE + Índice IBRD compuesto
- **Análisis estadístico**: K-Means clustering, análisis multivariado

---

*Plataforma desarrollada para el análisis de política pública TIC en Colombia · Ministerio TIC · 2026*
