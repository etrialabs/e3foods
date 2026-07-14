# e3Foods app v2 — SPEC de construcción

> Fuente funcional: `../DOC_FUNCIONAL_SAAS.md` (canónico). Reglas nutricionales: `../RESEARCH_ALIMENTACION_ESPANA.md` (§ 6.1 híbrido Harvard+AESAN).
> Codebase NUEVA desde cero. El HTML viejo (`../e3foods.html`) es cantera: paleta, landing, cálculo calórico.

## Estructura

```
app/
  index.html          # shell único: landing + nav 3 pestañas + vistas
  manifest.json        # instalación pantalla de inicio (Android/Chrome; iOS ignora esto, ver apple-touch-icon)
  css/styles.css      # paleta Etria (copiada del :root del HTML viejo), mobile-first
  js/app.js           # init, routing pestañas, estado
  js/engine.js        # motor determinista (puro, sin DOM)
  js/ui.js            # render de vistas
  data/recetas.js     # banco semilla → window.E3_RECETAS = {...}  (JS, no JSON: debe funcionar en file:// sin fetch)
  assets/portada.png  # copiada de ../Portada.png
  assets/icons/       # favicon.svg + apple-touch-icon.png (180) + icon-192/512.png — mark de 3 hojas
                       # (fuente: portada.png, recoloreado a fondo midnight — ver icon-square.svg de referencia
                       # en el historial, no versionado). Regenerar con rsvg-convert si cambia el diseño.
```

Sin frameworks, sin build. Vanilla HTML/CSS/JS. Debe funcionar abriendo `index.html` en local (file://) y en GitHub Pages.

## Paleta (NO cambiar) y tipografía (v2: cambia — Roger 2026-07-13)

Colores: mantener el bloque `:root` ya construido (`--bg:#EEF1F5`, `--panel:#FFFFFF`, `--ink:#081222`, `--accent/--gold:#C9A96E`, `--gold-soft:#E0C896`, etc.) — paleta oficial Etria, NO la del handoff de diseño (`Downloads/design_handoff_e3foods_redesign/`, colores `#0E1E36`/`#C2A14D` — usar solo como referencia de COMPOSICIÓN visual, sustituir sus colores por los `--ink`/`--gold` ya definidos).

**Tipografía: migrar de Fraunces+Inter a Manrope (UI) + Instrument Serif (display)** — decisión Roger 2026-07-13, clona las fuentes del handoff. Cambiar el `<link>` de Google Fonts en `index.html` y las custom properties `--font-display`/`--font-ui` en `css/styles.css`; revisar que no queden `font-family` hardcodeadas apuntando a Fraunces/Inter.

Landing: mantener el bloque `.landing-screen`/`.landing-hero` ya construido, apuntando a `assets/portada.png` (geometría del CTA ya fijada — no tocar salvo bug).

## Esquema del banco (`data/recetas.js`)

```js
window.E3_RECETAS = {
  version: 1,
  ingredientes: {
    // id-kebab: datos. TODOS los ingredientes usados en ejes deben existir aquí.
    "pollo": { nombre: "Pollo", categoria: "carne-blanca", kcal_100g: 145, racion_adulto_g: 150, racion_nino_g: 90 },
    "lentejas": { nombre: "Lentejas", categoria: "legumbre", kcal_100g: 116, racion_adulto_g: 200, racion_nino_g: 130 } // cocidas
    // categorias: carne-blanca | carne-roja | pescado-blanco | pescado-azul | huevo | legumbre |
    //             marisco | lacteo | cereal | tuberculo | verdura | fruta | otro
    // aptitud dietética se deriva de categoria (vegetariana: legumbre/huevo/lacteo/cereal/tuberculo/verdura/fruta)
  },
  categorias_cuota: {
    // contador semanal § 6.1 — VALORES: sacarlos de RESEARCH_ALIMENTACION_ESPANA.md (tabla reglas), no inventar
    "legumbre": { min_sem: 3, max_sem: null },
    "pescado-total": { min_sem: 3, max_sem: null },
    "pescado-azul": { min_sem: 1, max_sem: null },
    "carne-roja": { min_sem: 0, max_sem: 2 },
    "huevo": { min_sem: 3, max_sem: 4 }
  },
  plantillas: [
    {
      id: "plancha-guarnicion",
      nombre_patron: "{proteina} a la plancha con {hidrato} y {verdura}",
      tipo: "plantilla",            // plantilla | plato-unico (paella, lentejas, tortilla: ejes más fijos)
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",           // rapido (<=25) | medio (<=45) | elaborado (>45)
      ninos: true,                  // apta para niños pequeños sin adaptación
      ejes: {
        proteina: ["pollo", "pavo", "salmon", "merluza"],   // ids de ingredientes
        hidrato:  ["arroz", "patata", "cuscus"],
        verdura:  ["brocoli", "judias-verdes", "calabacin"]
      },
      kcal_extra: 100,              // aceite/sofrito/etc. no capturado por ejes
      pasos: ["Salpimentar {proteina} y hacer a la plancha...", "..."],  // 3-6 pasos, con placeholders
      notas: "",
      foto: null                   // opcional — url/path a foto de plato; si existe, la card usa layout con foto (ver renderSlot en ui.js). Sin banco de fotos real todavía (pendiente decisión Roger, ver STATUS_E3FOODS.md)
    }
  ]
};
```

Reglas del banco: cocina **española/mediterránea familiar** · nombres y textos en español · un plato-único de legumbre ocupa eje proteína e hidrato a la vez (lentejas, garbanzos) · kcal aproximadas (orientativo, NO app médica).

## Motor (`js/engine.js`) — funciones puras

- `necesidadKcalDia(miembro)` → Mifflin-St Jeor × factor actividad (1.2/1.55/1.725). Menores: bandas orientativas por edad/sexo (canibalizar del HTML viejo — buscar "mifflin"/"kcal"/bandas). Peso/altura opcionales en niños → banda por edad.
- `kcalObjetivo(miembros_presentes, tipoComida)` → agregado familiar: comida = 35% del día de cada presente, cena = 30%. Suma.
- `resolverPlato(plantilla, seleccion, presentes)` → nombre compuesto, kcal por comensal (Σ ración_g×kcal/100 + kcal_extra, ración niño si <12), lista de ingredientes con cantidades para la compra.
- `generarSemana(estado, desde?)` → plan 7 días × {comida, cena}. Restricciones en orden:
  1. Presencia: ausencias estructurales (patrón semanal por miembro y comida: casa/fuera/cole) y puntuales. Nadie en casa → hueco vacío.
  2. Vetos/gustos por miembro (ingrediente vetado → no elegible su eje para esa mesa).
  3. Mesa mixta: miembro con `dieta` distinta (vegetariana/sin-pescado/sin-cerdo) → misma plantilla, su eje proteína sustituido por opción apta; si la plantilla no tiene opción apta, elegir otra plantilla. Marcar la variación en el plato ("· Ana: tofu" estilo).
  4. Variedad dura § 6.3: ningún ingrediente de eje repetido el mismo día ni en días consecutivos.
  5. Cuotas § 6.1: contador semanal por categoría. Los valores NO se hardcodean: se leen de `categorias_cuota` del banco (derivados del research: legumbre 3-4, pescado-total ≥2, azul 1-2, carne roja ≤2, huevo 3-4). El generador fuerza el cumplimiento.
  6. Tiempo: L-V por defecto `rapido|medio`; `elaborado` solo fin de semana.
  7. Ajuste kcal: elegir combinaciones de eje cuya kcal por comensal se acerque al objetivo (±15% tolerancia; es orientativo).
- `regenerarDesde(estado, plan, diaIndex)` → regenera de ese día en adelante manteniendo lo anterior como restricción de variedad/cuotas.
- `cambiarPlato(estado, plan, dia, tipoComida, opciones)` → opciones: `{modo:"manual", plantillaId}` o `{modo:"nevera", disponibles:[ids]}` (filtra plantillas montables con esos ingredientes). Devuelve plato nuevo; la UI pregunta después si regenerar siguientes (§ 7).
- `listaCompra(plan, rango)` → rango "hoy" | "semana". Agrega cantidades por ingrediente. **Estabilidad:** ids de línea = ingrediente, no posición — los checks marcados sobreviven a regeneraciones parciales (los marcados se guardan por ingrediente-id).

## Estado (`localStorage`, clave `e3foods_v2`)

```js
{ nombreFamilia: "",  // nuevo campo — cabecera del hub de alta y del avatar-sheet
  familia: [ { id, nombre, sexo, anioNacimiento, foto?,  // foto: dataURL JPEG recortado/comprimido (~10-20KB), como el motor viejo
               peso?, altura?, actividad?, dieta?, vetos:[ids],
               patron: { comida:[7 valores casa|fuera|cole], cena:[7] } } ],
  ausenciasPuntuales: { "2026-07-14": { comida:[miembroIds fuera], cena:[] } },
  plan: { semanaISO, dias:[ { fecha, comida:{plantillaId, seleccion, adaptaciones}, cena:{...} } ] },
  ocultas: [plantillaIds], propias: [plantillas usuario], compra: { marcados:[ingredienteIds] } }
```

**Nota edad:** `anioNacimiento` sustituye a `nacimiento` (fecha completa) — Roger 2026-07-13, alta más ágil. `necesidadKcalDia` calcula edad como `anioActual - anioNacimiento` (aproximado, orientativo — no cambia el resto del motor).

## Navegación y vistas (§ 13 del funcional — v3, Roger 2026-07-13 tarde: retira HOY como tab)

**3 tabs de primer nivel + 1 sheet.** SEMANA cargada por defecto (sustituye a HOY: el selector de día ya cubre "qué comemos hoy" sin necesitar una pantalla aparte).

- **Landing** (cada carga) → tap → si no hay familia: **wizard de alta** → genera semana → **SEMANA**.
- **Wizard de alta (rediseñado):** cabecera con campo **Nombre de familia**. Copy: *"Para que lo nuestro funcione necesito saber algo de vosotros. ¿Nos conocemos?"* Hub con botón **"+"** → abre alta de UN miembro (nombre, sexo, año de nacimiento obligatorios; altura/peso/actividad/dieta opcionales colapsados; foto opcional con recorte+compresión) → vuelve al hub con el miembro en lista (chip/tarjeta, editable/eliminable) → "+" sigue disponible. CTA final (deshabilitado con 0 miembros) → genera semana → SEMANA.
- **SEMANA** (tab 1, default, única vista de día a día): **cabecera fija** (`position:sticky`) con título "La semana en la mesa" + fila de **7 píldoras de día** integrada dentro (letra + número, L13...D19; hoy en dorado, seleccionada en fondo dorado — no ink, se fundiría con el fondo navy de la cabecera) — tap en una píldora cambia el día mostrado, sin salir de la pantalla. Debajo, comida+cena del día seleccionado a pantalla completa. Decisión Roger 2026-07-13, referencia visual del handoff externo (`~/Downloads/design_handoff_e3foods_redesign/`) — estructura traducida a paleta/tipografía Etria, no copiado el prototipo (nunca sus hex).
  - **Card de plato (rediseño completo, misma tarde):** icono sol (comida) / luna (cena) + etiqueta, ambos en dorado — un único acento, no el verde/morado por tipo de comida del handoff. Foto del plato a la izquierda si `plantilla.foto` existe (§ esquema del banco), si no la info ocupa todo el ancho. Título del plato partido en **título + subtítulo** ("Salmón a la plancha" / "con Patata y Calabacín", heurística: primer " con "). Meta: **kcal media por persona** (kcal totales ÷ comensales presentes, no la suma — Roger: la suma "no aporta nada") · tiempo (`tiempo_min`). **Proteína en gramos NO se muestra** — el banco no tiene ese dato por ingrediente todavía; se omite en vez de inventarlo (pendiente real, no descarte). Avatares con **badge de estado superpuesto** (✓ verde si presente, − gris si ausente — color semántico, no el acento de marca) + el propio avatar más translúcido/difuminado si está ausente (`filter:blur`, sin punteado). Botón **"✨ Sorpréndeme con otra opción"** a todo el ancho, tintado en dorado suave (antes "Cambiar" → "Quiero otra cosa ↗" en píldora — todo eso queda sustituido) → sheet con 2 opciones (Elegir otro / Con lo que hay en la nevera) → tras cambiar, pregunta "¿Regenero los días siguientes?" (sí/no). El menú "⋮" del handoff (por card) no se construyó — sin acciones definidas todavía.
  - **Retirado con el tab HOY:** la franja "¿Qué me falta hoy?" (`renderFranjaHoy`) — la necesidad la cubre COMPRA con su segmento "Solo hoy" (§ 8), no se duplicó.
- **RECETAS** (tab 2): banco de plantillas con filtros por categoría (chips), ocultar/mostrar, añadir receta propia (form simple = plantilla de 1 opción por eje).
- **COMPRA** (tab 3): segmented control interno "Próximos 7 días" / "Solo hoy" — un único listado que conmuta entre los dos horizontes del § 8, checks persistentes por ingrediente-id.
- **Sheet "Mi Familia"** (vía avatar, no tab): miembros (CRUD + patrón semanal + dieta + vetos + foto), recetas ocultas (contador), ajustes.
- **Bottom nav 3 tabs con icono (línea, 24×24, `stroke:currentColor`) + texto** + punto dorado como indicador de activo. Icono siempre visible; el **texto se oculta al hacer scroll hacia abajo** y reaparece al subir o cerca del principio de la vista (`y<40`) — puerto directo de `setupNavShrink()` de `e3foods.html` (v1), mismo throttle por tiempo (no rAF). Zona pulgar, targets ≥44px, safe-areas iOS, grid 8px, máx 4 tamaños de fuente por vista. Criterio: entenderse al 90% en el primer uso.

## Calidad

- `engine.js` sin dependencia de DOM (testeable en consola).
- Al terminar: correr `../00_Skills/e3foods-mobile-design/scripts/check-contrast.py --scan index.html` (o sobre el CSS) y `validate-touch-targets.py` si aplica; corregir fallos AA.
- Código mínimo: nada especulativo, sin features fuera de esta SPEC.
- **Cache-busting de CSS y JS:** `index.html` referencia `css/styles.css?v=N` **y también** `data/recetas.js?v=N`, `js/engine.js?v=N`, `js/ui.js?v=N`, `js/app.js?v=N` — mismo `N` para los 5, un único contador global. Cada vez que se edite CUALQUIERA de esos ficheros y se despliegue, incrementar `N` en **todas** las referencias de `index.html` a la vez (2026-07-14: el JS se quedó sin bustear varios deploys seguidos — Roger veía cambios de CSS pero no de comportamiento/estructura, porque `app.js`/`ui.js` sí cacheaban 600s sin URL nueva que forzara refetch). GitHub Pages y los navegadores (sobre todo Safari/iOS) cachean agresivamente y sirven la versión vieja en silencio (`transferSize:0`, sin ir a red) aunque el archivo en el servidor ya esté actualizado.
