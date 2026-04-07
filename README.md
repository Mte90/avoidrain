# AvoidRain - 3D Endless Runner

Un gioco browser 3D dove corri sotto i balconi per evitare la pioggia!

## 🎮 Come Giocare

**Obiettivo**: Sopravvivi il più a lungo possibile rimanendo asciutto sotto i balconi dei palazzi.

**Controlli**:
- **Tastiera**: 
  - `A` / `Freccia Sinistra` → Spostati a sinistra
  - `D` / `Freccia Destra` → Spostati a destra
  - `Invio` / `Spazio` → Inizia/Ricomincia il gioco
- **Touch (mobile)**:
  - Swipe sinistra/destra → Spostati
  - Tocca per iniziare

**Meccaniche**:
- La pioggia riempie il **wet meter** (barra verde/rossa in alto a sinistra)
- Sotto i balconi il wet meter si svuota
- Se raggiunge 100% → Game Over!
- Le macchine sulla strada ti spingono indietro e aumentano la bagnatura
- La difficoltà aumenta col tempo (meno balconi, più pioggia, più macchine)

## 🚀 Esecuzione Locale

### Prerequisiti
- [Node.js](https://nodejs.org/) (versione 16 o superiore)
- npm (incluso con Node.js)

### Installazione

```bash
# Clona il repository (se non lo hai già)
cd avoidrain

# Installa le dipendenze
npm install
```

### Avvio Development Server

```bash
# Avvia il server di sviluppo
npm run dev
```

Il gioco sarà disponibile all'indirizzo: **http://localhost:5173**

### Build per Produzione

```bash
# Crea una build ottimizzata
npm run build

# Preview della build di produzione
npm run preview
```

## 🛠️ Stack Tecnologico

- **Three.js** - Rendering 3D
- **Vite** - Build tool e dev server
- **Vanilla JavaScript** - Nessun framework UI

## 📁 Struttura del Progetto

```
avoidrain/
├── src/
│   ├── audio/          # Sistema audio procedurale
│   ├── environment/    # Sistema pioggia
│   ├── input/          # Gestione input (tastiera/touch)
│   ├── player/         # Personaggio e controller
│   ├── systems/        # Game logic (wet meter, score, difficulty)
│   ├── ui/             # Interfaccia utente
│   ├── world/          # Generazione procedurale mondo
│   └── main.js         # Entry point
├── index.html
├── package.json
└── README.md
```

## 🎨 Asset Procedurali

Tutti gli asset sono generati proceduralmente:
- Personaggio low-poly (box + sphere + cylinder)
- Palazzi con finestre e balconi
- Macchine con colori casuali
- Suoni via Web Audio API (nessun file audio esterno)

## 🎯 Features

- ✅ Mondo procedurale infinito
- ✅ Sistema pioggia con particelle
- ✅ Balconi asimmetrici (SX/DX/BOTH/NEITHER)
- ✅ Macchine con collisione
- ✅ Wet meter con fill/drain
- ✅ Difficoltà progressiva
- ✅ Punteggio (tempo + distanza + bonus asciutto)
- ✅ Suoni procedurali
- ✅ UI responsive
- ✅ Controlli tastiera + touch

## 📝 Licenza

Progetto didattico.
