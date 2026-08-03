/* ============================================================
   e3Foods — motor_v6.js (GENERADO por _build_banco_v6.js — NO editar a mano)
   Motor V6 para navegador: 20 módulos de motor_v6/src/ (la ÚNICA
   implementación), con un registro CommonJS mínimo. Requiere data/banco_v6.js antes.
   Regenerar: node _build_banco_v6.js desde 02_APP/.
   ============================================================ */
(function (global) {
  'use strict';
  var REG = {}, CACHE = {};
  function require(ruta) {
    var id = ruta.replace(/^\.\//, '').replace(/\.js$/, '');
    if (CACHE[id]) return CACHE[id].exports;
    if (!REG[id]) throw new Error('motor_v6: módulo no empaquetado: ' + ruta);
    var m = CACHE[id] = { exports: {} };
    REG[id](m, m.exports, require);
    return m.exports;
  }

  /* ---- motor_v6/src/banco_hogar.js ---- */
  REG['banco_hogar'] = function (module, exports, require) {
// BANCO DEL HOGAR · la política de alergia SEVERA (spec §13), aplicada en UN SOLO LUGAR.
//
// QUÉ ES. `alergias_severas` no es una restricción del miembro: es una propiedad del HOGAR — el
// alérgeno no entra en casa (patrón real elegido, research §1a). Cambia el UNIVERSO de platos de
// toda la mesa, esté o no el miembro severo sentado a ella: la cocina, la olla y la despensa son
// compartidas. Por eso NO se resuelve plato a plato —eso es el mapa de las 4 vías, §2-bis— sino
// ANTES: aquí se compone el banco EFECTIVO del hogar y aguas abajo (pools, prevuelo, T1-T4,
// memoria, superficie §15, lista de compra) nadie vuelve a mirar el alérgeno severo.
// **Prohibido re-comprobarlo en un segundo sitio**: dos implementaciones de la misma medida es
// el patrón de bug nº1 del proyecto. La doble contabilidad es del JUEZ (batería I del harness),
// que barre la composición derivada de 8+ semanas consecutivas, no del motor.
//
// QUÉ SALE, caso a caso (§13.1.2):
//   opción de eje con el alérgeno   → la opción no existe PARA NADIE; el eje sobrevive si le
//                                     quedan opciones y muere con la última
//   on-top / condimento             → la línea se ELIMINA del banco y la card lo dice UNA vez:
//                                     nota `eliminar` con `miembro: '*'` (§13.1.3)
//   base-olla / ligante / vehículo  → VARIANTE DE HOGAR: la línea cambia de alimento en el banco
//                                     + nota `variante-todos`. La vía POR PERSONA (vía 3) queda
//                                     PROHIBIDA con severo: o la come toda la mesa, o la
//                                     elaboración sale del universo. El mecanismo es la COMPRA
//   estructural / sin `funcion`     → la elaboración sale del universo. JAMÁS nota-sustituto: no
//                                     se cocina el alérgeno para nadie
//   fila de `sustitutos`            → cuyo `sustituto_id` lleve el alérgeno, no existe para el
//                                     hogar (la guardia dura, elevada a hogar)
//
// LO QUE EL HOGAR PIERDE ES SALIDA, NO SILENCIO (§13.4 · §14.3): cada elaboración que muere y
// cada sustituto que falta se emite en `politica`, el prevuelo lo nombra en su informe de hueco
// y el hueco de dato dice qué alta lo arreglaría (`leche × frito` en cocciones, p. ej.).
//
// La comibilidad INDIVIDUAL no se toca aquí: quien tenga otra alergia la resuelve el prevuelo
// con su mecanismo de siempre, ya sobre este banco efectivo.
'use strict';
const { casaAlergeno } = require('./contrato_familia.js');

// función de línea → qué hace la política de hogar con ella. `undefined` (funcion desconocida o
// ausente) ⇒ 'fuera': jamás se auto-clasifica una línea, es dictado (§14.1).
const VIA_HOGAR = {
  'on-top': 'eliminar',
  condimento: 'eliminar',
  'base-olla': 'variante',
  ligante: 'variante',
  'hidrato-vehiculo': 'variante',      // vía 3 prohibida con severo: se eleva a variante de hogar
  'proteina-eje': 'fuera',             // línea FIJA con función de eje: no hay opción que rotar
  estructural: 'fuera'
};

const clave = n => JSON.stringify(n);

// familia normalizada + banco canónico → banco EFECTIVO del hogar + la política que lo explica.
// Sin alergia severa devuelve el banco tal cual y `politica: null` (coste cero, cero rodeos).
function bancoDelHogar(datos, familia) {
  const severos = [...new Set((familia.miembros || []).flatMap(m => m.alergias_severas || []))].sort();
  if (!severos.length) return { datos, politica: null };

  const alim = Object.fromEntries(datos.alimentos.map(a => [a.id, a]));
  const lleva = id => casaAlergeno((alim[id] || {}).alergenos, severos);
  // servibilidad del par (alimento × técnica): MISMA regla que `pools.servible` — sin
  // `factor_agua` ese alimento no se puede cocinar así, y una variante no puede inventarlo.
  const coc = {};
  for (const c of datos.cocciones) if (c.factor_agua != null)
    (coc[c.alimento_id] = coc[c.alimento_id] || new Set()).add(c.tecnica_id);
  const derivable = (a, t) => alim[a] != null && (t == null || (coc[a] || new Set()).has(t));
  // lo que el RESTO del hogar declara: solo para preferir un sustituto que no choque con ello.
  // Es preferencia, jamás decisión — la comibilidad individual la resuelve el prevuelo.
  const otras = [...new Set((familia.miembros || []).flatMap(m =>
    (m.alergias || []).concat(m.intolerancias || [])))].filter(t => !severos.includes(t));

  // ── sustituto DE HOGAR para una línea de variante: comible por la casa entera (empezando por
  //    no llevar el severo), válido para la dimensión del conflicto (alergia, §14.1 regla b) y
  //    servible con la técnica de la línea.
  function sustitutoDeHogar(l) {
    const filas = (datos.sustitutos || []).filter(s => s.original === l.alimento_id
      && (s.funcion_aplicable == null || s.funcion_aplicable === l.funcion)
      && !lleva(s.sustituto_id)
      && (!Array.isArray(s.valido_para) || s.valido_para.includes('alergia')));
    const servibles = filas.filter(s => derivable(s.sustituto_id, l.tecnica_id));
    if (!servibles.length) return { fila: null, candidatas: filas };
    return { fila: servibles.find(s => !casaAlergeno((alim[s.sustituto_id] || {}).alergenos, otras)) || servibles[0] };
  }

  const muertos = new Set();                 // padres (elaboración o componente) fuera del universo
  const notasPorPadre = {};                  // padre → notas de card de SUS líneas
  const huecos = [];
  const lineas = [];
  const nota = (padre, n) => (notasPorPadre[padre] = notasPorPadre[padre] || []).push(n);

  for (const l of datos.lineas) {
    if (Array.isArray(l.alternativas)) {     // ── eje: la opción con el alérgeno no existe
      const ops = l.alternativas.filter(op => !lleva(op));
      if (!ops.length) { muertos.add(l.padre); continue; }
      lineas.push(ops.length === l.alternativas.length ? l : { ...l, alternativas: ops });
      continue;
    }
    if (!lleva(l.alimento_id)) { lineas.push(l); continue; }
    const via = VIA_HOGAR[l.funcion];
    if (via === 'eliminar') {                // fuera del banco Y dicho en la card, una sola vez
      nota(l.padre, { tipo: 'eliminar', miembro: '*', alimento_id: l.alimento_id });
      continue;
    }
    if (via === 'variante') {
      const { fila, candidatas } = sustitutoDeHogar(l);
      if (fila) {
        lineas.push({ ...l, alimento_id: fila.sustituto_id });
        nota(l.padre, { tipo: 'variante-todos', alimento_id: l.alimento_id, sustituto_id: fila.sustituto_id });
        continue;
      }
      muertos.add(l.padre);
      huecos.push({ tipo: 'sustituto-ausente-hogar', padre: l.padre, alimento: l.alimento_id,
        funcion: l.funcion, tecnica: l.tecnica_id || null,
        motivo: candidatas && candidatas.length
          ? `${l.padre}: ${candidatas.map(s => s.sustituto_id).join('/')} sustituirían ${l.alimento_id}, pero falta el par ` +
            `(${candidatas[0].sustituto_id} × ${l.tecnica_id}) en cocciones — alta de dato, no conflicto real`
          : `${l.padre}: ninguna fila de sustitutos cambia ${l.alimento_id} como ${l.funcion} para el hogar`
      });
      continue;
    }
    muertos.add(l.padre);                    // estructural, proteína-eje fija, o sin clasificar
    if (l.funcion == null) huecos.push({ tipo: 'linea-sin-funcion-hogar', padre: l.padre,
      alimento: l.alimento_id,
      motivo: `${l.padre}|${l.alimento_id} sin \`funcion\`: tratada como ESTRUCTURAL, jamás auto-clasificada (D6)` });
  }

  // ── cierre: un componente muerto mata a quien lo incluye, y una elaboración cuyas
  //    eliminaciones la dejan sin sustancia (y sin eje) tampoco existe (test de realidad §0.7).
  const lineasDe = {};
  for (const l of lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);
  const teniaSustancia = new Set();
  for (const l of datos.lineas) if (l.papel !== 'condimento') teniaSustancia.add(l.padre);
  for (const padre of teniaSustancia)
    if (!(lineasDe[padre] || []).some(l => l.papel !== 'condimento' || Array.isArray(l.alternativas)))
      muertos.add(padre);
  for (let cambio = true; cambio;) {
    cambio = false;
    for (const l of lineas)
      if (l.componente_id && muertos.has(l.componente_id) && !muertos.has(l.padre)) { muertos.add(l.padre); cambio = true; }
  }

  // ── notas por ELABORACIÓN servida: la de una línea de componente la hereda quien lo incluye
  //    (la card nombra el plato, no el componente), y el resultado es lo que T2 cuelga del
  //    servicio sin decidir nada.
  const notas = {};
  const elaboraciones = datos.elaboraciones.filter(e => !muertos.has(e.id));
  for (const e of elaboraciones) {
    const acc = [], visto = new Set();
    (function rec(id) {
      if (visto.has(id)) return;
      visto.add(id);
      for (const n of notasPorPadre[id] || []) acc.push({ ...n, elaboracion_id: e.id });
      for (const l of lineasDe[id] || []) if (l.componente_id) rec(l.componente_id);
    })(e.id);
    if (acc.length) {
      const vistas = new Set();
      notas[e.id] = acc.filter(n => { const k = clave(n); if (vistas.has(k)) return false; vistas.add(k); return true; });
    }
  }

  const politica = {
    alergenos: severos,
    fuera: [...muertos].sort(),                                  // elaboraciones Y componentes
    elaboraciones_fuera: datos.elaboraciones.filter(e => muertos.has(e.id)).map(e => e.id).sort(),
    notas,
    huecos
  };
  return {
    datos: {
      ...datos,
      elaboraciones,
      componentes: (datos.componentes || []).filter(c => !muertos.has(c.id)),
      lineas: lineas.filter(l => !muertos.has(l.padre)),
      sustitutos: (datos.sustitutos || []).filter(s => !lleva(s.sustituto_id)),
      politica_hogar: politica
    },
    politica
  };
}

// las notas de hogar sobre una semana ya construida: mecánico, sin decidir nada — a cada
// servicio se le cuelgan las notas de las elaboraciones que REALMENTE lleva, incluidas las del
// plato/postre sustituto de un excluido (también se cocinan en esta casa).
function anotarHogar(semana, politica) {
  if (!politica) return semana;
  for (const sv of semana.servicios) {
    if (!sv.plato) continue;
    const ids = new Set(sv.plato.map(pe => pe.elaboracion_id));
    if (sv.postre) ids.add(sv.postre.elaboracion_id);
    for (const n of sv.notas || []) {
      if (n.tipo !== 'sustituto') continue;
      for (const pe of n.plato || []) ids.add(pe.elaboracion_id);
      if (n.postre) ids.add(n.postre.elaboracion_id);
    }
    const nuevas = [...ids].flatMap(id => politica.notas[id] || []);
    if (!nuevas.length) continue;
    const vistas = new Set((sv.notas || []).map(clave));
    sv.notas = (sv.notas || []).concat(nuevas.filter(n => {
      const k = clave(n);
      if (vistas.has(k)) return false;
      vistas.add(k);
      return true;
    }));
  }
  return semana;
}

module.exports = { bancoDelHogar, anotarHogar, VIA_HOGAR };

  };

  /* ---- motor_v6/src/config.js ---- */
  REG['config'] = function (module, exports, require) {
// CONFIG ÚNICA del harness — espejo de la tabla A CALIBRAR de la spec §11 + decisiones de
// Roger (plan §8). Cero constantes dispersas: toda vara numérica del harness vive aquí, con su
// origen. Cambiar un valor aquí re-mide TODO sin tocar fixtures (la deriva el harness).
'use strict';

module.exports = {
  // ── fronteras provisionales declaradas (plan §8 · supuestos baratos de vetar)
  EDAD_RACION_ADULTO: 12,                // <12 → gramos_nino. A CALIBRAR / confirmar Roger
  ESTACION_POR_MES: {                    // meteorológicas; elaboraciones declaran estación string
    12: 'invierno', 1: 'invierno', 2: 'invierno',
    3: 'primavera', 4: 'primavera', 5: 'primavera',
    6: 'verano', 7: 'verano', 8: 'verano',
    9: 'otono', 10: 'otono', 11: 'otono'
  },

  // ── clases de postre (decisión Roger 1-ago, plan §8.5; mel-i-mato y cuajada-miel = dulce
  //    por azúcar libre añadido). Pendiente de pasar al banco como dato vía alta.
  CLASE_POSTRE: {
    'postre-fruta': 'fruta', 'macedonia': 'fruta',
    'postre-yogur': 'lacteo',
    'arroz-con-leche': 'dulce', 'natillas': 'dulce', 'flan-huevo': 'dulce',
    'torrijas': 'dulce', 'crema-catalana': 'dulce', 'mel-i-mato': 'dulce', 'cuajada-miel': 'dulce'
  },

  // ── energía (spec §5)
  ENERGIA: {
    actividad: { baja: 1.2, media: 1.55, alta: 1.725 },   // adultos (spec §5)
    reparto: { comida: 0.35, cena: 0.30 },                // L-V
    reparto_finde: { comida: 0.375, cena: 0.275 },        // objetivo PUNTUAL (muere la banda de extremos)

    // MENORES — Schofield 1985 endosado por FAO/WHO/UNU 2004 (decisión Roger 1-ago).
    // Fuente verificada 1-ago en fao.org/4/y5686e/y5686e07.htm (Human Energy Requirements,
    // cap. 5), kcal/día en función del peso en kg. VERBATIM de la fuente:
    //   niños  3-10 a: 22,706×kg + 504,3   ·  10-18 a: 17,686×kg + 658,2
    //   niñas  3-10 a: 20,315×kg + 485,9   ·  10-18 a: 13,384×kg + 692,6
    schofield: {
      m: [{ min: 3, max: 10, a: 22.706, b: 504.3 }, { min: 10, max: 18, a: 17.686, b: 658.2 }],
      f: [{ min: 3, max: 10, a: 20.315, b: 485.9 }, { min: 10, max: 18, a: 13.384, b: 692.6 }]
    },
    // PAL de menores — FAO/WHO/UNU 2004 cap. 4 (verificado 1-ago, mismo informe):
    // <6 años las tablas NO diferencian actividad (solo «moderada»): PAL medido 1,43-1,50
    // → se usa 1,45 para toda actividad y se DECLARA. Desde 6 años: 1,30/1,55/1,80 (tabla
    // 4.5/4.6, banda 6-7 a) y el propio informe deriva light/vigorous como ∓15% de moderada.
    pal_menores: { menor_6: { baja: 1.45, media: 1.45, alta: 1.45 },
                   desde_6: { baja: 1.30, media: 1.55, alta: 1.80 } },
    // Mifflin-St Jeor (adultos, spec §5): kcal/día = 10×kg + 6,25×cm − 5×edad + s (m:+5, f:−161)
    mifflin: { s: { m: 5, f: -161 } },
    // Suelo proteico: PRI EFSA 2012 (DRV for protein, tabla 11) g proteína/kg/día — extraída
    // 1-ago del PDF oficial de EFSA. Adultos 18+: 0,83. Menores por edad (m/f donde difiere).
    pri_proteina: {
      adulto: 0.83,
      menores: [
        { edad: 3, m: 0.90, f: 0.90 }, { edad: 4, m: 0.86, f: 0.86 }, { edad: 5, m: 0.85, f: 0.85 },
        { edad: 6, m: 0.89, f: 0.89 }, { edad: 7, m: 0.91, f: 0.91 }, { edad: 8, m: 0.92, f: 0.92 },
        { edad: 9, m: 0.92, f: 0.92 }, { edad: 10, m: 0.91, f: 0.91 }, { edad: 11, m: 0.91, f: 0.90 },
        { edad: 12, m: 0.90, f: 0.89 }, { edad: 13, m: 0.90, f: 0.88 }, { edad: 14, m: 0.89, f: 0.87 },
        { edad: 15, m: 0.88, f: 0.85 }, { edad: 16, m: 0.87, f: 0.84 }, { edad: 17, m: 0.86, f: 0.83 }
      ]
    },
    // 'perdida': el −500 plano queda SUSPENDIDO (spec §5, hallazgo de la sesión a ciegas).
    // Mientras no haya suelo de seguridad con fuente: déficit suave declarado. A CALIBRAR.
    deficit_perdida: 0.90                              // 10% bajo objetivo, con suelo proteico intocable
  },

  // ── ventanas de variedad, valores iniciales (spec §3 — A CALIBRAR §11)
  VENTANAS: { plato_dias: 7, M2_servicios: 4, M3_servicios: 2, M4_servicios: 2 },
  MARGEN_AFORO: 1.5,                   // pre-vuelo §7: aforo < mínimo×margen ⇒ hueco informativo
                                       // (spec §11 «margen aforo 1,5×» — A CALIBRAR)
  POOL_ESTRECHO_CATEGORIAS: 3,         // pre-vuelo: < N categorías vivas por servicio ⇒ hueco
                                       // informativo (medido: mesa vegana con 2 no cierra) — A CALIBRAR

  // ── coste S de T2 (spec §2) — pesos enteros PÚBLICOS en el ORDEN de importancia de la spec;
  //    los afinará la calibración por máquina sobre el harness (§11). Términos SIEMPRE en [0,1]
  //    (0 = ideal), saturados con las cotas de abajo. `favoritos` está a 0 — Q4 (OK Roger
  //    1-ago): la señal no existe en la entrada; saldrá de la UI de favoritas (dato explícito,
  //    jamás inferido). Su rango natural al activarse: 32 (entre progreso_cuotas y temporada).
  PESOS_S: {
    frescura_plato: 256,               // S1 distancia de plato percibido más allá de la ventana
    distancia_origen: 128,             // S2 origen dominante
    progreso_cuotas: 64,               // S3 avance de mínimos pendientes de los presentes
    favoritos: 0,                      // S4 — RESERVADO (sin señal; ver nota de cabecera)
    temporada: 16,                     // S5 estación de la elaboración / mes del alimento
    esfuerzo_slot: 8,                  // S6 tiempo del slot (L-V corto mejor; finde invertido)
    rotacion_eje: 4,                   // S7 frescura P2 de las opciones ofrecidas
    equilibrio_coste: 2,               // S8 desvío de coste_banda vs media semanal
    solapamiento_compra: 1             // S9 BONUS de compra compartida (nunca malus)
  },
  SATURACIONES_S: {
    frescura_dias: 28,                 // S1: a ≥28 días el plato es «nuevo del todo» (ventana D3)
    origen_servicios: 8,               // S2: a ≥8 servicios el origen ya no pesa
    progreso_raciones: 2,              // S3: ≥2 raciones de avance saturan el término
    tiempo_min: 90                     // S6: minutos de cocina que saturan la escala
  },

  // ── política de postre (spec §6) — la CLASE por servicio es política, jamás optimización.
  //    Techos/objetivos SEMANALES sobre los 14 slots; con gobierno/presencia parcial se
  //    pro-ratean (floor) con la misma vara que la batería A. Dulce: POSTRE_DULCE_SEMANA_MAX.
  POLITICA_POSTRE: {
    FRUTA_MIN: 9,                      // «fruta como defecto la mayoría de días» — A CALIBRAR
    LACTEO_MAX: 4,                     // «lácteo natural el resto» — A CALIBRAR
    ROTACION_LACTEO: 3                 // 1 lácteo cada N servicios, desplazado por semana ISO
  },

  // ── relleno T2 (consumidor: t2_relleno, sub-paso 3 — declarados ya para cerrar la §11)
  LOOKAHEAD_T2: 1,                     // forward-checking a profundidad 1 tras cada commit — A CALIBRAR
  BACKTRACK_MAX_NODOS: 2000,           // backstop del backtracking de T2. BAJADO de 20.000 el
                                       // 3-ago con el bucle T1↔T2 ya en pie: el presupuesto
                                       // grande estaba COMPENSANDO la falta de bucle. Medido
                                       // sobre 11 familias × 8 semanas consecutivas —
                                       // 20.000 nodos/1 esqueleto: 14 semanas sin menú, 69 s ·
                                       // 20.000/4: 3 sin menú, 38 s · 2.000/6: 2 sin menú, 9 s.
                                       // Buscar más hondo dentro de un esqueleto malo cuesta
                                       // segundos y no encuentra; pedir otro esqueleto cuesta
                                       // milisegundos y sí. Menos búsqueda + más repartos =
                                       // mejor Y más rápido. — A CALIBRAR
  P4_NOVEDAD_SEMANA: 2,                // cupo de novedad de menores (spec §3-P4, §11 «1-2/sem»;
                                       // research: los niños rechazan lo nuevo, no la repetición)

  // ── T3 · fracciones y deuda (decisiones de Roger 2-ago, BUGS_V5 `725b92d`)
  FRACCIONES: {
    // REFUNDACIÓN 2-ago (spec §4): la cantidad personal es CONTINUA — mueren los escalones (Q7)
    // y el medio plato (Q9). Solo el TOTAL agregado se redondea a cocinable, una vez (§0.5).
    // Lo que queda es un límite de REALIDAD, no de dieta: nadie sirve un tercio de plato ni
    // tres platos a la misma persona. A CALIBRAR §11.
    LIMITE_REALIDAD: { min: 0.4, max: 2.0 }
  },
  MARGEN_TECHO_T1: 0.85,               // T1 solo compromete esta fracción de cada techo al
                                       // presupuestar (los gramos secundarios —el embutido del
                                       // potaje, el bacon del salteado— los consume T2 y el
                                       // esqueleto no los ve; medido: 3 carnes por medianas
                                       // 3,86/4 dejaban la semana sin cierre) — A CALIBRAR
  VENTANA_DIARIO_SERVICIOS: 28,        // diario D3: más allá se olvida a propósito (spec §3)
  VENTANA_DIARIO_LOCAL_SERVICIOS: 112, // lo que el CLIENTE guarda (§15.1: ~8 semanas × 14). Mayor
                                       // que la ventana de memoria a propósito: la ventana móvil
                                       // de 30 días del atún (§4) mira más atrás — A CALIBRAR

  // ── cuotas AESAN (spec §4; fuentes A22 adultos · AI22/AC25 niños — vía research primaria).
  //    Bandas SEMANALES de raciones fraccionales por persona [min, max]; null = sin cota.
  //    Asimetría: mínimos solo con gramo de EJE/dominante; techos con todo gramo no-condimento.
  CUOTAS: {
    legumbre: { adulto: [2, 4], nino: [3, 4] },
    'pescado-total': { adulto: [2, null], nino: [2, null] },
    'pescado-azul': { adulto: [1, 2], nino: [1, 2] },
    huevo: { adulto: [2, 4], nino: [3, 4] },
    'carne-total': { adulto: [2, 4], nino: [null, 3] },      // AC25 comedor: ≤3
    'carne-roja': { adulto: [null, 2], nino: [null, 1] },    // TECHO DE SALUD: jamás relajable
    'carne-procesada': { adulto: [null, null], nino: [null, null] } // semanal sin cota; niño ≤2/MES aparte
  },
  PROCESADA_MENSUAL_NINO_MAX: 2,       // AC25 ≤2/mes → ventana móvil de 28 días (convención declarada)

  // ── REFUNDACIÓN DE LA UNIDAD (spec §4, OK Roger 2-ago): la cuota es FRECUENCIA en TOMAS;
  //    la cantidad es personal en gramos; los techos de salud son absolutos en gramos/semana.
  TOMA_MIN_FRACCION: 0.5,              // una toma cuenta si la cantidad servida ≥ esta fracción
                                       // de la ración de referencia de SU tramo — sustituye a la
                                       // asimetría vieja («no cumplir pescado con tropiezos»).
                                       // A CALIBRAR §11
  // ── COBERTURA DE EJE EN GRAMOS (bloqueante cazado por Roger leyendo el menú, 2-ago).
  //    `ejes` era una ETIQUETA: la hamburguesa declaraba cubrir fruta-verdura con 30 g de lechuga
  //    y 50 g de tomate, ambos CONDIMENTO, frente a una ración de 175 g — y salía sola en la
  //    comida del lunes. Es el mismo defecto que este proyecto ya mató una vez con el campo
  //    `aporte` (BD_ESQUEMA §1.8: si no se puede expresar en gramos contra un número real, no
  //    entra en el modelo). Un eje se da por cubierto solo con gramos NO-condimento por encima
  //    del umbral; la etiqueta ya no basta.
  EJE_MIN_FRACCION: 0.5,               // misma convención que TOMA_MIN_FRACCION, deliberadamente:
                                       // media ración de referencia del tramo. A CALIBRAR §11
  TECHOS_SALUD_G_SEMANA: {             // absolutos y poblacionales: el riesgo no escala con la
    'carne-roja': 350                  // persona. WCRF/AICR 350-500 g/semana COCINADA — Roger
                                       // dicta el extremo DESEABLE, no el permisivo («ok 350»,
                                       // 2-ago). Techo de salud: innegociable (spec §7)
  },
  FRITOS_SEMANA_MAX: 2,                // regla de la casa (spec §4) — servicios, no raciones
  ESQUELETOS_POR_SEMANA: 6,            // cuántos repartos legales distintos puede pedirle T2 a T1
                                       // antes de rendirse (bucle T1↔T2). El canal era de un
                                       // sentido y un intento: la semana moría con un reparto
                                       // que otro esqueleto legal sí habría llenado.
  ELABORADO_POR_SEMANA_MAX: 2,         // dictado Roger 3-ago: «acepto 1 o 2, siempre en comidas
                                       // de finde, jamás en una cena» (sábado/domingo mediodía,
                                       // donde va la cuota grande del día)
  ELABORADO_POR_SEMANA: 1,             // OBJETIVO, no obligación. Dictado Roger 3-ago, matiza el
                                       // «una por semana» del 1-ago: «el plato de calma es una
                                       // OPCIÓN, 1 o 2, pero no es obligatorio — quizá están de
                                       // viaje, comen fuera, o en una casa rural con un pollo al
                                       // ast». `generar.js` intenta la semana CON el cupo y, solo
                                       // si ninguna combinación sale, repite SIN él y lo declara
                                       // (R0). Con el mínimo duro tumbaba semanas enteras por un
                                       // plato prescindible; con el mínimo a 0 no salía nunca.

  POSTRE_DULCE_SEMANA_MAX: 1,          // AC25 extrapolado — A CALIBRAR
  FACTOR_LEGUMBRE_SECO_COCIDO: 2.5,    // CONVENCION-D1-LEGUMBRE-SECO-COCIDO (fuentes.js) — A CALIBRAR
  // Qué gramos cumplen MÍNIMOS: 'eje-o-dominante' = línea de eje elegida + línea proteica
  // dominante de cada principal (la merluza fija de un plato de merluza cuenta; el bacon de un
  // salteado no). 'solo-eje' = lectura literal spec §4. PREGUNTA elevada a Roger 1-ago.
  MINIMOS_CUENTAN: 'eje-o-dominante',

  // ── umbrales de baterías (spec §9)
  UMBRALES: {
    A_semanas_en_banda: 0.95,            // ≥95% semanas en banda por persona
    B_desvio_servicio: 0.03,             // ±3% POR SERVICIO (dictado 2-ago: cada comida ofrece
                                         // lo correcto; muere la media a 14 días y la deriva)
    B_desvio_dia_max: 0.10,              // ningún día >+10%
    D_jamas_servidas_max: 0.20,          // <20% del banco jamás servido
    F1_n: 1000,                          // regeneraciones por celda
    F3_max_cambio: null                  // % máx. menú que cambia ante 1 veto — A CALIBRAR:
  }                                      // null = sin umbral, la prueba solo REPORTA
};

  };

  /* ---- motor_v6/src/contrato_familia.js ---- */
  REG['contrato_familia'] = function (module, exports, require) {
// CONTRATO DE FAMILIA · la frontera ÚNICA entre lo que declara el usuario y el vocabulario del
// banco. Aguas abajo de este fichero NADIE habla el idioma del front: todo son ids reales de
// `alimentos.js`. La traducción ocurre una vez, aquí, y se versiona junto al banco.
//
// POR QUÉ EXISTE (auditoría ciega 2-ago · orden de Roger 3-ago). `prevuelo.motivoNoComible`
// compara `m.alergias` contra `a.alergenos` por igualdad exacta. El front declara
// `sin-gluten | sin-lactosa | sin-huevo | sin-frutos-secos | sin-pescado-marisco | sin-rosaceas`
// (frontend/js/ui.js) y el banco declara `gluten | leche | huevo | frutos-cascara | cacahuetes |
// pescado | crustaceos | moluscos | apio | mostaza | sesamo | soja | sulfitos`: intersección
// CERO ⇒ cero exclusiones y CERO avisos, con menores en la mesa.
//
// La tabla que lo traduce ya existía —`bd_v6/dietas.js` §ALERGIAS_PERFIL, 30-jul, con los tres
// casos difíciles resueltos y comentados—. V6 no la heredó porque `ENCARGO_CONSTRUCTORA.md` §1
// prohibía expresamente abrir `bd_v6/*.js` de raíz: la frontera ciega protegió la refundación
// del motor y se llevó por delante este dato. Rescatada por orden expresa de Roger (3-ago) con
// tres mejoras sobre el original:
//
//   1. `sin-lactosa` deja de ser «alergia con excepciones» y pasa a DIMENSIÓN PROPIA
//      (`intolerancias`). Es lo que abre la VÍA 2 (cambio de base para toda la olla): la tabla
//      `sustitutos` ya declara `valido_para: ['intolerancia']` para leche→leche-sin-lactosa y
//      esa dimensión era inalcanzable porque el motor nunca emitía el motivo `intolerancia`.
//   2. El vocabulario se DERIVA del banco en cada llamada, no se copia. Si mañana entra un
//      alérgeno nuevo en `alimentos.js`, este fichero no puede mentir.
//   3. Se valida la familia ENTERA —no solo las alergias— y un token desconocido REVIENTA.
//      v5 ya lanzaba ante alergia desconocida (`dietas.js:114`); V6 callaba. Ahí murieron
//      también `nacimiento` inválido → edad NaN → ración de adulto, y el orden de `miembros`
//      cambiando el menú. Los tres eran el mismo pecado: fallar declarándose exitoso.
//
// SEVERIDAD, y es una decisión de criterio: lo DURO revienta (alergia · intolerancia · dieta ·
// datos de cálculo energético), lo BLANDO avisa (vetos y `no_gusta` con id inexistente). Un
// gusto que no casa es una preferencia que no se aplica; una alergia que no casa es un niño
// comiendo su alérgeno.
//
// ALERGIA SEVERA (spec §13, 3-ago). `alergias_severas` se traduce con la MISMA tabla
// `PERFIL_RESTRICCION` que las alergias —token desconocido REVIENTA igual— y el resultado viaja
// en DOS sitios porque son dos cosas distintas: en `alergias` del miembro (sigue siendo una
// alergia suya: la red individual) y en `alergias_severas` (la política de HOGAR, que compone
// el banco efectivo en `banco_hogar.js`). Una severa que no apunte a ningún alérgeno declarado
// del banco revienta: la política necesita un alérgeno, no un origen. Y la `despensa` del hogar
// con el alérgeno dentro revienta también — si está en la despensa, está en casa.
'use strict';

// ── productos hechos PARA el intolerante: declaran alérgeno `leche` (Anexo II punto 7 cubre
//    «leche y sus derivados, INCLUIDA la lactosa», y es correcto: conservan la proteína) y aun
//    así son aptos para él. Derivar de `alergenos.includes('leche')` excluiría justo esos.
//    JAMÁS valen para el ALÉRGICO a la leche: por eso solo eximen de la dimensión intolerancia.
const APTO_SIN_LACTOSA = {
  'leche-sin-lactosa': 'sin lactosa, conserva proteína de leche',
  'yogur-sin-lactosa': 'sin lactosa, conserva proteína de leche'
};

// ── lo que el usuario declara → lo que el banco entiende
const PERFIL_RESTRICCION = {
  'sin-gluten':          { dimension: 'alergia', alergenos: ['gluten'] },
  // el cacahuete tiene punto propio en el Anexo II (5: es legumbre) y el punto 8
  // (frutos-cascara) es lista cerrada que no lo incluye. «Sin frutos secos» los veta JUNTOS
  // como regla de dieta — nunca tocando los alérgenos declarados del alimento.
  'sin-frutos-secos':    { dimension: 'alergia', alergenos: ['frutos-cascara', 'cacahuetes'] },
  'sin-huevo':           { dimension: 'alergia', alergenos: ['huevo'] },
  // el banco declara los tres por separado, así que el front puede pedirlos por separado. El
  // mando agrupado se conserva (perfiles ya dados de alta): un alérgico SOLO al marisco perdía
  // con él 19 de 93 elaboraciones que sí puede comer — y el pescado es el cuello medido del banco.
  'sin-pescado':         { dimension: 'alergia', alergenos: ['pescado'] },
  'sin-marisco':         { dimension: 'alergia', alergenos: ['crustaceos', 'moluscos'] },
  'sin-pescado-marisco': { dimension: 'alergia', alergenos: ['pescado', 'crustaceos', 'moluscos'] },
  // las rosáceas no son alérgeno del Anexo II: se vetan por ORIGEN con lista explícita
  // (familia del melocotón — LTP, la alergia alimentaria nº1 del adulto español).
  'sin-rosaceas':        { dimension: 'alergia', alergenos: [],
                           origenes: ['melocoton', 'nectarina', 'albaricoque', 'cereza', 'ciruela',
                                      'manzana', 'pera', 'fresa', 'almendra', 'membrillo'] },
  'sin-lactosa':         { dimension: 'intolerancia', alergenos: ['leche'], excepciones: APTO_SIN_LACTOSA }
};

// ── dieta: `naturaleza` no ve el origen animal de lo que no es carne
const NO_VEGETARIANA = ['carne', 'pescado', 'marisco'];
const NO_VEGANA = ['carne', 'pescado', 'marisco', 'huevo', 'lacteo'];
// vegano ≠ vegetal: la miel es `naturaleza: vegetal` y no es vegana.
// Candidatos a entrar cuando existan: gelatina, cochinilla (E-120), grasa animal, Worcestershire.
const NO_VEGANO_PESE_A_NATURALEZA = { miel: 'producto de origen animal (abeja), naturaleza vegetal' };
// compuestos con ingrediente animal que `naturaleza` no ve: la mayonesa es `grasa` y lleva
// huevo; los ñoquis son `cereal` y llevan leche. El alérgeno declarado SÍ lo ve, y en este banco
// es lista de INGREDIENTES reales, no de trazas — por eso vale como señal de dieta.
const ALERGENO_CARNE_PESCADO = ['pescado', 'crustaceos', 'moluscos'];
const ALERGENO_ANIMAL_INDIRECTO = ['huevo', 'leche'];

const DIETAS = ['omnivora', 'vegetariana', 'vegana'];
// `estilo` es el campo del handoff visual; `dieta` el que consume el motor. `sin-cerdo` no es un
// régimen: es un veto por ORIGEN, y así lo resolvía v5 (`dietas.js:vetadoPorEstilo`).
const ESTILO_A_DIETA = { 'de-todo': 'omnivora', vegetariano: 'vegetariana', vegano: 'vegana', 'sin-cerdo': 'omnivora' };
const SEXOS = ['m', 'f'];
const ACTIVIDADES = ['baja', 'media', 'alta'];
const OBJETIVOS = ['mantenimiento', 'perdida', 'ganancia'];
const NACIMIENTO = /^\d{4}-(0[1-9]|1[0-2])(-\d{2})?$/;

// matching por prefijo en AMBOS sentidos ('leche' casa 'leche-cabra' y al revés): el banco puede
// granularizar un alérgeno sin que una ficha de familia se quede sin casar en silencio.
function casaAlergeno(alergenosAlimento, tags) {
  if (!tags || !tags.length) return false;
  return (alergenosAlimento || []).some(y => tags.some(t => y.indexOf(t) === 0 || t.indexOf(y) === 0));
}

// familia declarada → familia en vocabulario del banco. Lanza si algo duro no casa.
// Devuelve { familia, avisos }; los avisos viajan en `familia.avisos_contrato` si los hay.
function normalizarFamilia(familia, datos) {
  if (!familia || !Array.isArray(familia.miembros) || !familia.miembros.length)
    throw new Error('contrato de familia: sin miembros');

  const alimentoPorId = Object.fromEntries(datos.alimentos.map(a => [a.id, a]));
  const alimentos = new Set(datos.alimentos.map(a => a.id));
  const origenes = new Set(datos.alimentos.map(a => a.origen).filter(Boolean));
  const alergenos = new Set();
  for (const a of datos.alimentos) for (const x of (a.alergenos || [])) alergenos.add(x);

  const errores = [], avisos = [], ids = new Set();

  // ── el contrato habla el vocabulario del PRODUCTO, no al revés. La ficha de familia lleva
  //    `sexo: 'mujer'|'hombre'`, `anioNacimiento: 1985`, `altura`, `peso` desde el motor v3, y
  //    obligar al frontend a traducirlos sería exactamente lo que Roger prohibió el 3-ago:
  //    «cero rastro de v5, conexión nativa». La traducción vive AQUÍ, que es la frontera, junto
  //    a la del vocabulario de alergias. Un campo en su forma canónica siempre manda.
  const SEXO_FICHA = { mujer: 'f', hombre: 'm', f: 'f', m: 'm' };
  function normalizarCampos(m) {
    const o = { ...m };
    if (o.sexo != null && SEXO_FICHA[o.sexo]) o.sexo = SEXO_FICHA[o.sexo];
    if (o.altura_cm == null && o.altura != null) o.altura_cm = o.altura;
    if (o.peso_kg == null && o.peso != null) o.peso_kg = o.peso;
    if (o.id == null && o.nombre) o.id = String(o.nombre).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return o;
  }

  const miembros = familia.miembros.map(mCrudo => {
    const m = normalizarCampos(mCrudo);
    const quien = m && m.id != null ? String(m.id) : '(miembro sin id)';
    const err = msg => errores.push(`${quien}: ${msg}`);
    const avisa = msg => avisos.push(`${quien}: ${msg}`);
    if (!m || m.id == null || m.id === '') err('sin id');
    else if (ids.has(m.id)) err('id duplicado'); else ids.add(m.id);

    // ── datos que alimentan el cálculo energético: un `undefined` aquí sale por NaN
    // la ficha de familia solo pide el AÑO (`anioNacimiento`). Se acepta y se asume junio —
    // el error de edad queda acotado a ±6 meses en vez de ±12— pero se DECLARA: la edad manda
    // sobre la ración del menor y sobre las prohibiciones por edad de D2, así que el supuesto
    // no puede ser silencioso. Pedir el mes en la ficha lo elimina (petición a producto).
    if (m.nacimiento == null && m.anioNacimiento != null) {
      const anio = Number(m.anioNacimiento);
      if (Number.isInteger(anio) && anio > 1900 && anio < 2100) {
        m.nacimiento = `${anio}-06`;
        avisa(`la ficha solo trae el año de nacimiento (${anio}): se asume junio y la edad puede desviarse ±6 meses`);
      }
    }
    if (!NACIMIENTO.test(String(m.nacimiento || ''))) err(`nacimiento inválido: ${JSON.stringify(m.nacimiento)} (AAAA-MM o AAAA-MM-DD)`);
    if (!SEXOS.includes(m.sexo)) err(`sexo desconocido: ${JSON.stringify(m.sexo)}`);
    if (!ACTIVIDADES.includes(m.actividad)) err(`actividad desconocida: ${JSON.stringify(m.actividad)}`);
    if (!(Number(m.altura_cm) > 30 && Number(m.altura_cm) < 250)) err(`altura_cm fuera de rango: ${JSON.stringify(m.altura_cm)}`);
    if (!(Number(m.peso_kg) > 1 && Number(m.peso_kg) < 400)) err(`peso_kg fuera de rango: ${JSON.stringify(m.peso_kg)}`);
    const objetivo = m.objetivo == null ? 'mantenimiento' : m.objetivo;
    if (!OBJETIVOS.includes(objetivo)) err(`objetivo desconocido: ${JSON.stringify(m.objetivo)}`);

    // ── dieta: `dieta` manda; si falta, se deriva de `estilo` (handoff)
    let dieta = m.dieta;
    if (dieta == null && m.estilo != null) {
      dieta = ESTILO_A_DIETA[m.estilo];
      if (dieta == null) err(`estilo desconocido: ${JSON.stringify(m.estilo)}`);
    }
    if (dieta == null) dieta = 'omnivora';
    if (!DIETAS.includes(dieta)) err(`dieta desconocida: ${JSON.stringify(dieta)}`);

    // ── restricciones: id del banco pasa tal cual, id de perfil se traduce, desconocido revienta.
    //    `origenes_vetados` es exclusión DURA por origen (rosáceas por LTP, cerdo por estilo):
    //    el motor la trata con el mismo motivo que la alergia — es la lectura conservadora, y la
    //    única que no deja que un veto duro ceda ante una relajación.
    const alergias = new Set(), intolerancias = new Set(), origVetados = new Set(), aptos = new Set();
    if (m.estilo === 'sin-cerdo') {
      origVetados.add('cerdo');
      avisa('estilo `sin-cerdo`: se veta el origen cerdo (regla rescatada de v5); NO altera cuotas ni dieta — pendiente de dictado si debe hacerlo');
    }
    // `recogidos` (§13): los tokens de alérgeno a los que la restricción acaba apuntando. La
    // alergia severa los necesita para su política de hogar — y para reventar si no hay ninguno.
    const aplicar = (id, dimensionForzada, recogidos) => {
      if (alergenos.has(id)) {
        (dimensionForzada === 'intolerancia' ? intolerancias : alergias).add(id);
        if (recogidos) recogidos.push(id);
        return;
      }
      const r = PERFIL_RESTRICCION[id];
      if (!r) { err(`restricción desconocida: ${JSON.stringify(id)}`); return; }
      const destino = (dimensionForzada || r.dimension) === 'intolerancia' ? intolerancias : alergias;
      for (const t of r.alergenos) {
        if (!alergenos.has(t)) { err(`la restricción ${id} apunta a un alérgeno que el banco no declara: ${t}`); continue; }
        destino.add(t);
        if (recogidos) recogidos.push(t);
      }
      for (const o of r.origenes || []) {
        if (!origenes.has(o)) { avisa(`la restricción ${id} veta un origen sin alimentos en el banco: ${o}`); continue; }
        origVetados.add(o);
      }
      for (const apto of Object.keys(r.excepciones || {})) {
        if (!alimentos.has(apto)) { avisa(`la restricción ${id} exime un alimento inexistente: ${apto}`); continue; }
        aptos.add(apto);
      }
    };
    for (const id of m.alergias || []) aplicar(id, null);
    for (const id of m.intolerancias || []) aplicar(id, 'intolerancia');
    // ── ALERGIA SEVERA (§13): misma tabla y misma severidad. Entra en `alergias` (es una
    //    alergia suya) y además en `alergias_severas`, que es lo que compone el banco del hogar.
    const severas = [];
    for (const id of m.alergias_severas || []) {
      const antes = severas.length;
      aplicar(id, null, severas);
      if (severas.length === antes && PERFIL_RESTRICCION[id])
        err(`alergia_severa ${JSON.stringify(id)} no apunta a ningún alérgeno declarado del banco: ` +
          'la política de hogar (§13) saca un ALÉRGENO de casa, y un veto por origen no lo es');
    }

    // ── preferencias: id que no casa es AVISO. No se aplica, pero tampoco tumba la generación.
    for (const id of (m.vetos || []).concat(m.no_gusta || []))
      if (!alimentos.has(id)) avisa(`preferencia sobre un id que no existe en el banco (inerte): ${id}`);

    const out = { ...m, dieta, objetivo, alergias: [...alergias].sort(), vetos: m.vetos || [], no_gusta: m.no_gusta || [] };
    // campos nuevos solo cuando aportan: una familia sin intolerancias serializa igual que antes
    if (severas.length) out.alergias_severas = [...new Set(severas)].sort();
    if (intolerancias.size) out.intolerancias = [...intolerancias].sort();
    if (origVetados.size) out.origenes_vetados = [...origVetados].sort();
    if (aptos.size) out.aptos_pese_a_alergeno = [...aptos].sort();
    return out;
  });

  // ── DESPENSA del hogar (§13.1.2): `{ alimento_id: sustituto_id }` declarado en onboarding —
  //    el sustituto es lo que la familia COMPRA y tiene en casa. Si lleva un alérgeno severo del
  //    hogar, el alérgeno entra en casa: revienta. El original no se mira: declararlo es
  //    justamente lo contrario, es la marca que el hogar sustituye.
  const severasHogar = [...new Set(miembros.flatMap(m => m.alergias_severas || []))];
  for (const [orig, sust] of Object.entries(familia.despensa || {})) {
    if (!alimentos.has(orig)) { errores.push(`despensa: original inexistente en el banco: ${orig}`); continue; }
    if (!alimentos.has(sust)) { errores.push(`despensa: sustituto inexistente en el banco: ${sust}`); continue; }
    const choque = ((alimentoPorId[sust].alergenos || [])
      .filter(x => severasHogar.some(t => x.indexOf(t) === 0 || t.indexOf(x) === 0)));
    if (choque.length) errores.push(`despensa: ${orig} → ${sust} lleva ${choque.join(', ')} y el hogar declara ` +
      'alergia severa a eso (§13: el alérgeno no entra en casa)');
  }

  if (errores.length) throw new Error('contrato de familia:\n  · ' + errores.join('\n  · '));

  // ── orden canónico: el motor daba resultados distintos según el orden del array (auditoría
  //    ciega: con el niño primero, 5 de 6 semanas fallaban). Se normaliza en la frontera.
  miembros.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));

  const salida = { ...familia, miembros };
  if (avisos.length) salida.avisos_contrato = avisos;
  return { familia: salida, avisos };
}

module.exports = {
  normalizarFamilia, casaAlergeno,
  PERFIL_RESTRICCION, APTO_SIN_LACTOSA, ESTILO_A_DIETA, DIETAS,
  NO_VEGETARIANA, NO_VEGANA, NO_VEGANO_PESE_A_NATURALEZA,
  ALERGENO_CARNE_PESCADO, ALERGENO_ANIMAL_INDIRECTO
};

  };

  /* ---- motor_v6/src/costes.js ---- */
  REG['costes'] = function (module, exports, require) {
// COSTE S de T2 (spec §2) + POLÍTICA DE POSTRE (spec §6).
//
// COSTE S — la ÚNICA capa con coste del motor. Cada término es una función PURA de señales ya
// extraídas → [0,1] donde 0 = ideal; el coste total es Σ peso × término con los pesos enteros
// públicos de config.PESOS_S (orden de importancia de la spec; la calibración por máquina los
// afinará sobre el harness, §11). H filtra y C cuenta ANTES de que esto puntúe nada: aquí no
// llega ningún candidato ilegal — anti-burla: sin conversión entre monedas.
//
// CONTRATO DE SEÑALES (las produce el relleno, t2_relleno — sub-paso 3; la suite las fabrica a
// mano). Toda señal ausente se trata como el PEOR caso de su término, jamás como el mejor: un
// dato que falta no puede regalar puntos.
//   dias_desde_percibido      nº días desde que la mesa vio este plato percibido (null = jamás)
//   servicios_desde_origen    nº servicios desde el último con este origen dominante (null = jamás)
//   avance_raciones           raciones fraccionales que el candidato aporta a mínimos AÚN
//                             pendientes de los presentes esta semana (Σ, saturado en config)
//   es_favorito               true/false — SIN SEÑAL HOY (Q4: peso 0; vendrá de la UI, explícito)
//   temporada                 0 = elaboración en estación (u opción en mes) · 0.5 = sin declarar
//   tiempo_min                minutos de la elaboración · finde: bool del slot
//   rotacion_eje              [0,1]: 0 = opciones nuevas (P2) para todos los presentes · 1 = todo repetido
//   desvio_coste              |coste_banda − media móvil semanal| ∈ [0,2]
//   solapamiento              fracción de alimentos del candidato ya usados esta semana ∈ [0,1]
'use strict';

const clamp01 = x => x < 0 ? 0 : x > 1 ? 1 : x;

// término: más días desde el último visto = mejor; nunca visto = ideal (0).
// El contrato C (ventana dura M1) ya eliminó los < 7 días: aquí solo se gradúa 7…saturación.
const TERMINOS = {
  frescura_plato: (s, sat) => s.dias_desde_percibido == null ? 0
    : clamp01((sat.frescura_dias - s.dias_desde_percibido) / sat.frescura_dias),
  distancia_origen: (s, sat) => s.servicios_desde_origen == null ? 0
    : clamp01((sat.origen_servicios - s.servicios_desde_origen) / sat.origen_servicios),
  progreso_cuotas: (s, sat) =>
    1 - clamp01((s.avance_raciones || 0) / sat.progreso_raciones),
  favoritos: s => s.es_favorito === true ? 0 : 1,
  temporada: s => s.temporada == null ? 0.5 : clamp01(s.temporada),
  // L-V manda la promesa (rápido primero): menos minutos = mejor. En finde vive la cocina con
  // tiempo: se invierte. El esfuerzo grueso (rapido/medio/elaborado) ya lo reservó T1; esto
  // solo gradúa DENTRO del esfuerzo reservado.
  esfuerzo_slot: (s, sat) => {
    if (s.tiempo_min == null) return 1;               // señal ausente = peor caso, también aquí
    const t = clamp01(s.tiempo_min / sat.tiempo_min);
    return s.finde ? 1 - t : t;
  },
  rotacion_eje: s => s.rotacion_eje == null ? 1 : clamp01(s.rotacion_eje),
  equilibrio_coste: s => s.desvio_coste == null ? 1 : clamp01(s.desvio_coste / 2),
  // BONUS, nunca malus (spec §2): solapar compra REDUCE el coste respecto al peor caso; ningún
  // candidato paga por encima de peso×1 por no solapar — el término solo compara hacia abajo.
  solapamiento_compra: s => 1 - clamp01(s.solapamiento || 0)
};

// coste total con desglose por término — el desglose es parte del contrato: los informes y la
// calibración necesitan VER de dónde sale cada coste (términos saturados visibles, spec §2).
function costeS(senales, config) {
  const pesos = config.PESOS_S, sat = config.SATURACIONES_S;
  let total = 0;
  const desglose = {};
  for (const [nombre, fn] of Object.entries(TERMINOS)) {
    const v = fn(senales, sat);
    desglose[nombre] = +v.toFixed(6);
    total += (pesos[nombre] || 0) * v;
  }
  return { total: +total.toFixed(6), desglose };
}

// ── POLÍTICA DE POSTRE (spec §6): la CLASE de cada servicio es política declarada, jamás
// optimización (prohibido por arquitectura que el flan cuadre energía). Determinista:
//  · dulce: techo POSTRE_DULCE_SEMANA_MAX pro-rateado (floor, misma vara que la batería A),
//    sesgado a finde — se sirve en el PRIMER slot de finde activo cuya mesa pueda comer dulce.
//  · lácteo: hasta LACTEO_MAX pro-rateado, 1 de cada ROTACION_LACTEO servicios, desplazado por
//    semana ISO (que el yogur no caiga SIEMPRE en lunes-cena).
//  · fruta: el defecto — todo lo demás (con FRUTA_MIN de los 14 sale ≥9 por construcción).
//  · clase propuesta que la mesa NO puede comer (clasesViables del prevuelo) → cae a fruta,
//    luego a lácteo; el dulce JAMÁS entra por fallback (es capricho semanal, no relleno).
//    Sin clase viable → null + descargo (la emite el relleno en el servicio).
//
// slotsActivos: [{slot, dia, servicio}] en orden · clasesViables: slot → Set('fruta'|'lacteo'|'dulce')
function politicaPostre(slotsActivos, semanaNum, clasesViables, config) {
  const P = config.POLITICA_POSTRE;
  const factor = slotsActivos.length / 14;
  const cupoDulce = Math.floor(config.POSTRE_DULCE_SEMANA_MAX * factor + 1e-9);
  const cupoLacteo = Math.floor(P.LACTEO_MAX * factor + 1e-9);
  const porSlot = {}, descargos = [];
  let dulces = 0, lacteos = 0;

  slotsActivos.forEach((s, idx) => {
    const viables = clasesViables[s.slot] || new Set();
    let clase = 'fruta';
    if (s.dia >= 6 && dulces < cupoDulce && viables.has('dulce')) clase = 'dulce';
    else if (lacteos < cupoLacteo && (idx + semanaNum) % P.ROTACION_LACTEO === 0) clase = 'lacteo';
    // viabilidad de mesa: fruta → lácteo → nada (el dulce jamás por fallback)
    if (clase !== 'dulce' && !viables.has(clase)) clase = viables.has('fruta') ? 'fruta' : viables.has('lacteo') ? 'lacteo' : null;
    if (clase === 'dulce') dulces++;
    else if (clase === 'lacteo') lacteos++;
    else if (clase == null) descargos.push({ tipo: 'postre-inviable', slot: s.slot,
      detalle: 'ninguna clase de postre es comible por todos los presentes' });
    porSlot[s.slot] = clase;
  });
  return { porSlot, descargos, cupos: { dulce: cupoDulce, lacteo: cupoLacteo } };
}

module.exports = { costeS, politicaPostre, TERMINOS };

  };

  /* ---- motor_v6/src/derivar.js ---- */
  REG['derivar'] = function (module, exports, require) {
// DERIVADOR nutricional del harness — la vara única (FORMATO_MENU_NEUTRO.md §4).
// Convierte lo servido (corrida en e3f-menu-neutro/1) en gramos y macros POR MIEMBRO y
// servicio, desde el banco pinneado. Mismas reglas para v5 y V6; el generador jamás manda
// números. Reglas del esquema (BD_ESQUEMA_V5.md): energía SIEMPRE 4P+4H+9G+2F; hidratos =
// disponibles; agua nunca cambia energía; grasa entra/sale por 100 g CRUDOS; hueco ≠ 0 —
// todo dato ausente se DECLARA en `huecos`, nunca se inventa.
'use strict';

const CONFIG = require('./config.js');   // config única del harness — jamás constantes locales

const MACROS = ['proteina', 'hidratos', 'grasa', 'fibra'];
const KCAL_POR_G = { proteina: 4, hidratos: 4, grasa: 9, fibra: 2 };

// ── calendario ISO (fechas de la ENTRADA; jamás reloj del sistema)
function juevesISO(semanaIso) {
  const [anio, sem] = semanaIso.split('-W').map(Number);
  const ene4 = new Date(Date.UTC(anio, 0, 4));
  const lunesW1 = new Date(ene4.getTime() - ((ene4.getUTCDay() + 6) % 7) * 86400000);
  return new Date(lunesW1.getTime() + ((sem - 1) * 7 + 3) * 86400000);
}
function edadEnSemana(nacimiento, semanaIso) {        // años cumplidos; nacimiento AAAA-MM (día 1 por convención)
  const [an, mn] = nacimiento.split('-').map(Number);
  const j = juevesISO(semanaIso);
  let edad = j.getUTCFullYear() - an;
  if (j.getUTCMonth() + 1 < mn) edad--;
  return edad;
}
const mesDeSemana = s => juevesISO(s).getUTCMonth() + 1;
const estacionDeSemana = s => CONFIG.ESTACION_POR_MES[mesDeSemana(s)];
const fechaDia = (s, dia) => new Date(juevesISO(s).getTime() + (dia - 4) * 86400000); // lunes=1

// ── índices del banco
function indexar(datos) {
  const nut = {};                                     // alimento → base → nutriente → fila
  for (const n of datos.nutricion)
    ((nut[n.alimento_id] = nut[n.alimento_id] || {})[n.base] = nut[n.alimento_id][n.base] || {})[n.nutriente] = n;
  const coc = {};                                     // alimento → tecnica → fila
  for (const c of datos.cocciones)
    (coc[c.alimento_id] = coc[c.alimento_id] || {})[c.tecnica_id] = c;
  const lineasDe = {};
  for (const l of datos.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);
  const elab = Object.fromEntries(datos.elaboraciones.map(e => [e.id, e]));
  const tec = Object.fromEntries(datos.tecnicas.map(t => [t.id, t]));
  return { nut, coc, lineasDe, elab, tec };
}

// ── una línea de alimento, para un miembro
// Devuelve {abs:{proteina,hidratos,grasa,fibra}, gramos_base, gramos_crudos} y anota huecos.
function derivarLinea(ix, linea, alimentoId, esNino, fraccion, huecos, supuestos, donde) {
  const gramosBase = (esNino ? linea.gramos_nino : linea.gramos_adulto) * (linea.escala || 1) * fraccion;
  const porBase = (ix.nut[alimentoId] || {});
  // BD_ESQUEMA_V5.md §1.8 (regla 1-ago, OK de Roger): tecnica_id null = «se incorpora tal
  // cual» — identidad, factor 1, sin grasa entra/sale. NO confundir con técnica declarada sin
  // fila en cocciones: eso sigue siendo combinación no servible (§1.5) y cae al hueco de abajo.
  const fc = linea.tecnica_id == null
    ? { factor_agua: 1, grasa_entra_g100: null, grasa_sale_g100: null }
    : (ix.coc[alimentoId] || {})[linea.tecnica_id];
  if (!fc) {                                          // par sin fila ⇒ no servible («sin fuente no se sirve»)
    huecos.push({ donde, alimento: alimentoId, tipo: 'coccion-sin-fila', tecnica: linea.tecnica_id });
    return null;
  }
  if (linea.tecnica_id != null && fc.factor_agua == null) {
    // esquema §1.5: par sin DATO ⇒ «ese alimento no se puede cocinar así» — el banco PODA la
    // opción (aviso [opcion-no-disponible]); la vara no deriva lo que el gate declara incocinable.
    huecos.push({ donde, alimento: alimentoId, tipo: 'coccion-sin-dato', tecnica: linea.tecnica_id });
    return null;
  }
  const abs = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
  for (const m of MACROS) {
    let fila = (porBase[linea.base] || {})[m], per100;
    if (fila && fila.valor != null) per100 = fila.valor;
    else {
      // derivar de la otra base con factor_agua (concentración; la energía no cambia)
      const otra = linea.base === 'crudo' ? 'cocido' : 'crudo';
      const filaOtra = (porBase[otra] || {})[m];
      if (filaOtra && filaOtra.valor != null && fc.factor_agua != null)
        per100 = linea.base === 'cocido' ? filaOtra.valor / fc.factor_agua : filaOtra.valor * fc.factor_agua;
      else { huecos.push({ donde, alimento: alimentoId, tipo: 'macro-hueco', nutriente: m, base: linea.base }); continue; }
    }
    abs[m] = gramosBase / 100 * per100;
  }
  // grasa de cocción: por 100 g CRUDOS
  const gramosCrudos = linea.base === 'crudo' ? gramosBase
    : (fc.factor_agua != null ? gramosBase / fc.factor_agua : null);
  if ((fc.grasa_entra_g100 != null || fc.grasa_sale_g100 != null)) {
    if (gramosCrudos == null) huecos.push({ donde, alimento: alimentoId, tipo: 'sin-gramos-crudos-para-grasa' });
    else abs.grasa += gramosCrudos / 100 * ((fc.grasa_entra_g100 || 0) - (fc.grasa_sale_g100 || 0));
  } else if (linea.tecnica_id != null && (ix.tec[linea.tecnica_id] || {}).medio === 'grasa') {
    // técnica en medio grasa SIN dato de grasa entra/sale (p. ej. panceta×salteado, arbitraje
    // QA 1-ago): hueco de banco real — visible por derivación, jamás un 0 silencioso.
    supuestos.push({ donde, alimento: alimentoId, tipo: 'grasa-coccion-sin-dato', tecnica: linea.tecnica_id });
  }
  return { abs, gramos_base: gramosBase, gramos_crudos: gramosCrudos, alimento: alimentoId, papel: linea.papel };
}

// ── una elaboración servida (plato o postre), para un miembro.
// `ajustes` (/2 §9.2, opcional): { eliminar: Set(alimento_id), sustituir: {alimento_id→sustituto_id} }
// — la nota cambia el ALIMENTO de la línea, jamás sus gramos ni su técnica (misma cantidad,
// mismo gesto: doctrina de la card). Sin ajustes, comportamiento /1 EXACTO.
function derivarElaboracion(ix, servida, miembroId, esNino, fraccion, huecos, supuestos, ajustes) {
  const id = servida.elaboracion_id;
  const donde = id;
  const totales = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
  const lineasOut = [];
  const expandir = (padreId, escala) => {
    for (const l of ix.lineasDe[padreId] || []) {
      if (l.componente_id) {                          // inclusión de componente: recursión × escala
        expandir(l.componente_id, escala * (esNino ? l.escala_nino : l.escala_adulto));
        continue;
      }
      let alimentoId = l.alimento_id, esEje = false;
      if (Array.isArray(l.alternativas)) {            // línea de eje → la opción del miembro
        const op = servida.opciones_eje && (servida.opciones_eje[miembroId] || servida.opciones_eje['*']);
        if (!op) { huecos.push({ donde, tipo: 'eje-sin-opcion', miembro: miembroId }); continue; }
        alimentoId = op; esEje = true;
      } else if (ajustes) {                           // las notas solo tocan líneas FIJAS
        if (ajustes.eliminar && ajustes.eliminar.has(alimentoId)) continue;
        // las sustituciones ENCADENAN sobre la misma línea: la variante de HOGAR (§13, huevo→
        // leche para toda la casa) y la individual que esa variante provoca (leche→bebida-soja
        // para el alérgico a leche) se componen. Quedarse en el primer salto le serviría leche
        // al alérgico. Tope de 4 saltos: un ciclo en las notas no cuelga la derivación.
        for (let salto = 0; salto < 4 && ajustes.sustituir && ajustes.sustituir[alimentoId]; salto++)
          alimentoId = ajustes.sustituir[alimentoId];
      }
      // `ajustes_linea` (/2 §3): gramos ABSOLUTOS finales de esa línea para ese miembro —
      // la palanca de rango declarado (`gramos_*_min/max`). Sustituye a gramos×fracción, no se
      // suma: el número que viaja es el que se cocina.
      const gAjuste = ajustes && ajustes.gramos && ajustes.gramos[alimentoId];
      const lineaFinal = gAjuste != null
        ? { ...l, escala: 1, gramos_adulto: gAjuste, gramos_nino: gAjuste }
        : { ...l, escala };
      const r = derivarLinea(ix, lineaFinal, alimentoId, esNino, gAjuste != null ? 1 : fraccion, huecos, supuestos, donde);
      if (r) { r.eje = esEje; lineasOut.push(r); for (const m of MACROS) totales[m] += r.abs[m]; }
    }
  };
  expandir(id, 1);
  return { elaboracion_id: id, totales, lineas: lineasOut };
}

const kcalDe = t => MACROS.reduce((k, m) => k + KCAL_POR_G[m] * t[m], 0);

// ── corrida entera → derivación por semana × servicio × miembro presente.
// /1: comportamiento EXACTO de siempre (la línea base v5 no se mueve un dígito).
// /2 (§9.2): las notas componen la ración INDIVIDUAL — y toda nota cuyo resultado no sea
// H-comible por su beneficiario es ILEGAL: con `opciones.failFast` (default true) REVIENTA con
// nombre (condición de auditoría QA-2: caza bugs del generador al instante); con false se
// registra en `notas_ilegales` y SE APLICA igualmente, para que el juez (G, chequeo H) la mida.
function derivarCorrida(corrida, datos, config = CONFIG, opciones = {}) {
  const ix = indexar(datos);
  const esV2 = corrida.formato === 'e3f-menu-neutro/2';
  const failFast = opciones.failFast !== false;
  const miembros = corrida.familia.miembros;
  const alim = Object.fromEntries(datos.alimentos.map(a => [a.id, a]));
  const NO_VEGETARIANO = new Set(['carne', 'pescado', 'marisco']);
  const NO_VEGANO = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);
  const prohibidasPorEdad = {};                       // D2, solo prohibiciones puras
  for (const f of datos.seguridad_infantil || []) {
    if (f.limite_g_dia != null || f.condicion != null) continue;
    const previa = prohibidasPorEdad[f.alimento_id];
    prohibidasPorEdad[f.alimento_id] = previa == null ? f.edad_max_anos : Math.max(previa, f.edad_max_anos);
  }
  // ¿por qué un alimento NO es H-comible por un miembro? (regla (a) universal: alérgenos
  // REALES del banco — jamás heurística de prefijo; la intolerancia NO entra aquí: su validez
  // fina es del `valido_para` de la tabla `sustitutos` cuando aterrice, TODO contrastar)
  function motivoIlegal(mid, alimentoId, edad) {
    const a = alim[alimentoId];
    if (!a) return `alimento inexistente ${alimentoId}`;
    const m = miembros.find(x => x.id === mid);
    const alergias = (m.alergias || []).concat(m.alergias_severas || []);
    const choque = (a.alergenos || []).find(x => alergias.includes(x));
    if (choque) return `${alimentoId} lleva ${choque} y ${mid} es alérgico`;
    const prohibidas = m.dieta === 'vegana' ? NO_VEGANO : m.dieta === 'vegetariana' ? NO_VEGETARIANO : null;
    if (prohibidas && prohibidas.has(a.naturaleza)) return `${alimentoId} es ${a.naturaleza} y ${mid} es ${m.dieta}`;
    if ((m.vetos || []).includes(alimentoId) || (m.no_gusta || []).includes(alimentoId)) return `${alimentoId} está vetado por ${mid}`;
    const edadMax = prohibidasPorEdad[alimentoId];
    if (edadMax != null && edad < edadMax) return `${alimentoId} prohibido a menores de ${edadMax} (D2) y ${mid} tiene ${edad}`;
    return null;
  }

  return corrida.semanas.map(sem => ({
    semana_iso: sem.semana_iso,
    mes: mesDeSemana(sem.semana_iso),
    estacion: estacionDeSemana(sem.semana_iso),
    servicios: sem.servicios.map(sv => {
      const slot = `${sv.dia}-${sv.servicio}`;
      if (!sv.plato) return { slot, servido: false, no_servido: sv.no_servido || (sem.fallo ? 'fallo-semana' : null) };
      const notas = esV2 ? (sv.notas || []) : [];
      const notasIlegales = [];
      const ilegal = (nota, miembro, motivo) => {
        if (failFast) throw new Error(`nota ilegal en ${sem.semana_iso} ${slot} (${nota.tipo}): ${motivo}`);
        notasIlegales.push({ tipo: nota.tipo, miembro, motivo });
      };
      // índices de notas del servicio
      const soloPara = {};                            // elaboracion_id → Set(miembros)
      const sustitutoDe = {};                         // mid → nota sustituto
      const ajustesDe = {};                           // mid → elaboracion_id → {eliminar, sustituir, gramos}
      const ajuste = (mid, eid) => {
        const porElab = ajustesDe[mid] = ajustesDe[mid] || {};
        return porElab[eid] = porElab[eid] || { eliminar: new Set(), sustituir: {}, gramos: {} };
      };
      const presentes = miembros.filter(m => sem.presencia[m.id] && sem.presencia[m.id][slot] === true);
      for (const n of notas) {
        if (n.tipo === 'solo-para') soloPara[n.elaboracion_id] = new Set(n.miembros);
        else if (n.tipo === 'sustituto')                    // plato Y postre pueden sustituirse
          (sustitutoDe[n.miembro] = sustitutoDe[n.miembro] || {})[n.ambito] = n;
        // `miembro: '*'` = eliminación de HOGAR (§13.1.3): esa línea no se cocina para nadie
        else if (n.tipo === 'eliminar') {
          if (n.miembro === '*') for (const m of presentes) ajuste(m.id, n.elaboracion_id).eliminar.add(n.alimento_id);
          else ajuste(n.miembro, n.elaboracion_id).eliminar.add(n.alimento_id);
        }
        else if (n.tipo === 'vehiculo-persona') ajuste(n.miembro, n.elaboracion_id).sustituir[n.alimento_id] = n.sustituto_id;
        else if (n.tipo === 'variante-todos')
          for (const m of presentes) ajuste(m.id, n.elaboracion_id).sustituir[n.alimento_id] = n.sustituto_id;
      }
      for (const a of (esV2 && sv.ajustes_linea) || [])
        ajuste(a.miembro, a.elaboracion_id).gramos[a.alimento_id] = a.gramos;

      const porMiembro = {};
      for (const m of presentes) {
        const edad = edadEnSemana(m.nacimiento, sem.semana_iso);
        const esNino = edad < config.EDAD_RACION_ADULTO;
        const fraccion = (sv.fracciones && sv.fracciones[m.id]) != null ? sv.fracciones[m.id] : 1;
        const huecos = [], supuestos = [];
        const sust = sustitutoDe[m.id] || {};
        // su composición: el plato de mesa (menos solo-para ajenos, con sus ajustes) o SU sustituto
        const platoReal = sust.plato ? sust.plato.plato
          : sv.plato.filter(pe => !soloPara[pe.elaboracion_id] || soloPara[pe.elaboracion_id].has(m.id));
        const postreReal = sust.postre ? sust.postre.postre : sv.postre;
        const partes = platoReal.map(pe => derivarElaboracion(ix, pe, m.id, esNino, fraccion, huecos, supuestos,
          (ajustesDe[m.id] || {})[pe.elaboracion_id]));
        if (postreReal) partes.push(derivarElaboracion(ix, postreReal, m.id, esNino, fraccion, huecos, supuestos,
          (ajustesDe[m.id] || {})[postreReal.elaboracion_id]));
        const totales = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
        for (const p of partes) for (const mac of MACROS) totales[mac] += p.totales[mac];
        porMiembro[m.id] = { edad, es_nino: esNino, fraccion, totales, kcal: kcalDe(totales), partes, huecos, supuestos };

        // ── chequeo de notas (solo lo que las notas INTRODUCEN; el plato de mesa lo juzga el
        //    chequeo H de siempre): sustitutos de variante/vehículo y el plato-sustituto entero
        for (const [eid, aj] of Object.entries(ajustesDe[m.id] || {})) {
          if (!platoReal.some(pe => pe.elaboracion_id === eid) && !(postreReal && postreReal.elaboracion_id === eid)) continue;
          for (const orig of Object.keys(aj.sustituir)) {
            // se juzga lo que se COME: el final de la cadena, con la misma regla que la deriva
            let sustId = aj.sustituir[orig];
            for (let salto = 0; salto < 4 && aj.sustituir[sustId]; salto++) sustId = aj.sustituir[sustId];
            const motivo = motivoIlegal(m.id, sustId, edad);
            if (motivo) ilegal({ tipo: 'sustitucion', elaboracion_id: eid, alimento_id: orig }, m.id, motivo);
          }
        }
        for (const ambito of ['plato', 'postre']) {
          const nota = sust[ambito];
          if (!nota) continue;
          const propias = ambito === 'plato' ? new Set(nota.plato.map(pe => pe.elaboracion_id))
            : new Set([nota.postre.elaboracion_id]);
          for (const p of partes) {
            if (!propias.has(p.elaboracion_id)) continue;
            for (const l of p.lineas) {
              const motivo = motivoIlegal(m.id, l.alimento, edad);
              if (motivo) ilegal(nota, m.id, `el sustituto no es comible: ${motivo}`);
            }
          }
        }
      }
      const out = { slot, servido: true, por_miembro: porMiembro };
      if (esV2) out.notas_ilegales = notasIlegales;
      return out;
    })
  }));
}

module.exports = { CONFIG, derivarCorrida, derivarElaboracion, derivarLinea, indexar, kcalDe,
  edadEnSemana, mesDeSemana, estacionDeSemana, juevesISO, fechaDia };

  };

  /* ---- motor_v6/src/diario.js ---- */
  REG['diario'] = function (module, exports, require) {
// DIARIO D3 · las TRES operaciones de la spec §15.1 sobre el diario de lo SERVIDO
// (contrato completo → `../D3_DIARIO_SERVIDO.md`). Sustituyen a las CINCO funciones de historial
// de v5, que mueren: `serializarHistorialSemana` · `aplanarHistorial` · `fusionarHistorial` ·
// `podarHistorial` · `serializarPlanHistorico`.
//
// POR QUÉ EXISTE. Sin diario, V6 arranca con memoria FRÍA cada semana y devuelve siempre el mismo
// menú: la memoria (M1-M8 / P1-P5) NO se persiste jamás, se DERIVA del diario en cada generación
// (§15.1 · D3 §4). El diario es el hecho registrado; la memoria, el derivado.
//
// FUNCIONES PURAS: ni `localStorage`, ni reloj, ni red. El cliente les pasa lo que tiene y decide
// dónde guardar lo que devuelven (la poda la hace quien ESCRIBE — D3 §6.2). Nunca mutan la
// entrada: devuelven un diario nuevo.
'use strict';
const { diarioDesdeCorrida } = require('./memoria.js');
const { fechaDia } = require('./derivar.js');

const ESQUEMA = 'e3f-diario/1';

const vacio = () => ({ esquema: ESQUEMA, servicios: [] });
const sano = d => (d && Array.isArray(d.servicios) ? d.servicios : []);

// orden estable por (fecha, comida antes que cena) — el mismo que aplica `memoria()` antes de
// recortar su ventana. Que el fichero guardado ya venga ordenado hace la poda trivial y el
// diff del sync legible.
const ordenar = ss => ss.slice().sort((a, b) =>
  (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0) ||
  (a.servicio === b.servicio ? 0 : a.servicio === 'comida' ? -1 : 1));

// semana `/2` → servicios de diario. Reutiliza `diarioDesdeCorrida` A PROPÓSITO: es la MISMA
// derivación que `generar.js` usa entre semanas. Escribir aquí una segunda sería el patrón de
// bug nº1 del proyecto (dos implementaciones de la misma medida). Los miembros salen de la
// propia semana: `presencia` lleva los 14 slots de cada uno, explícitos.
function serviciosDeSemana(semana, bancoGeneracion) {
  const miembros = Object.keys(semana.presencia || {}).map(id => ({ id }));
  const corrida = { familia: { miembros }, semanas: [semana],
    generador: { banco_generacion: bancoGeneracion || null } };
  return diarioDesdeCorrida(corrida, fechaDia).servicios;
}

// (1) ARCHIVAR lo servido. Idempotente por la clave natural `id` (D3 §1): re-escribir la misma
// semana SUSTITUYE, jamás duplica — el sync puede reintentar sin ensuciar la memoria. Lo que
// ya estaba con `servido: false` no se resucita: si la semana vuelve a traer ese slot, gana la
// versión nueva, que es lo que el usuario acaba de decir.
function apendizarSemana(diario, semana, bancoGeneracion) {
  if (!semana || !Array.isArray(semana.servicios)) return { esquema: ESQUEMA, servicios: ordenar(sano(diario)) };
  const porId = new Map(sano(diario).map(s => [s.id, s]));
  for (const s of serviciosDeSemana(semana, bancoGeneracion)) porId.set(s.id, s);
  return { esquema: ESQUEMA, servicios: ordenar([...porId.values()]) };
}

// (2) PODAR: fuera de ventana. Por CONTEO de servicios servidos, nunca por días — dos semanas de
// vacaciones sin registrar no pueden borrar la memoria (D3 §1). La ventana guardada
// (`VENTANA_DIARIO_LOCAL_SERVICIOS`) es MAYOR que la de memoria (`VENTANA_DIARIO_SERVICIOS`, 28)
// a propósito: la ventana móvil de 30 días del atún (§4) necesita más pasado del que la memoria
// de mesa mira. Ambas A CALIBRAR (§11).
function podarDiario(diario, config) {
  const orden = ordenar(sano(diario));
  const tope = (config && config.VENTANA_DIARIO_LOCAL_SERVICIOS) || 112;
  const servidos = orden.filter(s => s.servido !== false);
  if (servidos.length <= tope) return { esquema: ESQUEMA, servicios: orden };
  // se corta por el primer SERVIDO que entra en ventana; lo no servido anterior cae con él
  const corte = servidos[servidos.length - tope];
  return { esquema: ESQUEMA, servicios: orden.slice(orden.indexOf(corte)) };
}

// (3) FUSIONAR entre dispositivos (post-encendido, backend): unión por clave natural. Ante el
// mismo `id` gana el REMOTO — mismo criterio LWW que el resto del sync. `solo_locales` dice qué
// servicios tiene este dispositivo y el remoto no, para que el cliente sepa si debe re-empujar.
function fusionarDiario(local, remoto) {
  const porId = new Map(sano(local).map(s => [s.id, s]));
  const soloLocales = new Set(porId.keys());
  for (const s of sano(remoto)) { porId.set(s.id, s); soloLocales.delete(s.id); }
  return { diario: { esquema: ESQUEMA, servicios: ordenar([...porId.values()]) },
    solo_locales: [...soloLocales].sort() };
}

module.exports = { apendizarSemana, podarDiario, fusionarDiario, diarioVacio: vacio, ESQUEMA };

  };

  /* ---- motor_v6/src/energia.js ---- */
  REG['energia'] = function (module, exports, require) {
// ENERGÍA · objetivo diario por persona y suelo proteico. Mifflin-St Jeor para adultos,
// Schofield/FAO para menores, PRI de EFSA para el suelo.
//
// Vivía en `harness/baterias/b_energia.js`, así que T3 —el que decide las cantidades— importaba
// la función de la BATERÍA QUE LE PONE NOTA. El auditor del harness lo llamó por su nombre: «en
// cuanto V6 se mida, B deja de ser medición y pasa a ser comprobación aritmética del propio
// motor». Bajarla aquí no rompe la circularidad por sí sola (juez y motor siguen compartiendo la
// vara) pero pone el dueño donde toca y saca a producción del banco de pruebas. El antídoto real
// es `t4_auditoria.js`, que reimplementa desde el banco sin fiarse de ninguna vara del motor.
'use strict';
const { edadEnSemana } = require('./derivar.js');

function objetivoDiario(m, semanaIso, cfg) {
  const edad = edadEnSemana(m.nacimiento, semanaIso);
  let base, pal;
  if (edad >= 18) {
    base = 10 * m.peso_kg + 6.25 * m.altura_cm - 5 * edad + cfg.ENERGIA.mifflin.s[m.sexo];
    pal = cfg.ENERGIA.actividad[m.actividad];
  } else {
    const tramos = cfg.ENERGIA.schofield[m.sexo];
    const t = tramos.find(x => edad >= x.min && edad < x.max) || tramos[tramos.length - 1];
    base = t.a * m.peso_kg + t.b;
    pal = (edad < 6 ? cfg.ENERGIA.pal_menores.menor_6 : cfg.ENERGIA.pal_menores.desde_6)[m.actividad];
  }
  const objetivo = base * pal * (m.objetivo === 'perdida' ? cfg.ENERGIA.deficit_perdida : 1);
  const pri = edad >= 18 ? cfg.ENERGIA.pri_proteina.adulto
    : (cfg.ENERGIA.pri_proteina.menores.find(x => x.edad === Math.max(3, Math.min(17, edad))) || {})[m.sexo]
      || cfg.ENERGIA.pri_proteina.adulto;
  return { edad, objetivo_dia: objetivo, suelo_proteina_dia: pri * m.peso_kg, fuera_de_rango_schofield: edad < 3 };
}

module.exports = { objetivoDiario };

  };

  /* ---- motor_v6/src/generar.js ---- */
  REG['generar'] = function (module, exports, require) {
// GENERAR · la cara pública del motor V6 en fase T2: corrida completa (familia × N semanas)
// en `e3f-menu-neutro/2`. Orquesta por semana: prevuelo (§7) → T1 esqueleto (exacto) → T2
// relleno (card) → serializa; la MEMORIA entre semanas se deriva del diario simulado con la
// definición ejecutable de D3 (harness/memoria.js) — el motor no inventa contadores propios
// entre semanas: lo servido se convierte en diario y el diario en memoria, como en producción.
//
// Determinismo (spec §0.2): función pura de (familia + semanas ISO + banco + config). Sin
// reloj, sin RNG; `sustitutos` la compone el llamador en `datos` (cableado explícito, patrón
// acordado con la QA-2).
'use strict';
const { compilarPools } = require('./pools.js');
const { prevuelo } = require('./prevuelo.js');
const { esqueleto, SLOTS } = require('./t1_esqueleto.js');
const { rellenarSemana } = require('./t2_relleno.js');
const { fraccionarSemana } = require('./t3_fracciones.js');
const { serializarCorrida } = require('./serializar.js');
const { normalizarFamilia } = require('./contrato_familia.js');
const { bancoDelHogar, anotarHogar } = require('./banco_hogar.js');
const { anotarSemana } = require('./seguridad_infantil.js');
const { memoria, diarioDesdeCorrida } = require('./memoria.js');
const { edadEnSemana, estacionDeSemana, fechaDia, juevesISO } = require('./derivar.js');

const VERSION = 'v6-t2';

function siguienteSemana(iso) {
  const [a, w] = iso.split('-W').map(Number);
  const d = new Date(juevesISO(iso).getTime() + 7 * 86400000);
  // la semana del jueves siguiente (ISO 8601 la define por su jueves)
  const anio = d.getUTCFullYear();
  const ene4 = new Date(Date.UTC(anio, 0, 4));
  const lunesW1 = new Date(ene4.getTime() - ((ene4.getUTCDay() + 6) % 7) * 86400000);
  const num = Math.floor((d.getTime() - lunesW1.getTime()) / (7 * 86400000)) + 1;
  return num >= 1 ? `${anio}-W${String(num).padStart(2, '0')}` : `${anio - 1}-W53`;
}

function entradaDe(familia, semana_iso) {
  const presencia = {};
  for (const m of familia.miembros) {
    presencia[m.id] = {};
    for (const s of SLOTS) presencia[m.id][s.slot] =
      !(familia.ausencias_fijas || []).some(a => a.miembro === m.id && a.slot === s.slot);
  }
  const edades = Object.fromEntries(familia.miembros.map(m => [m.id, edadEnSemana(m.nacimiento, semana_iso)]));
  return { semana_iso, estacion: estacionDeSemana(semana_iso), presencia, edades,
    familia: { id: familia.id, gobierno: familia.gobierno == null ? null : familia.gobierno,
      anclas: familia.anclas || [], miembros: familia.miembros } };
}

// familia × arranque × nSemanas → corrida /2 completa
//
// `diarioPrevio` (opcional, spec §15.1) — el diario D3 de lo YA SERVIDO antes de este arranque.
// Es lo que permite al FRONTEND generar semana a semana sin arrancar frío cada lunes: la memoria
// no se persiste jamás, se deriva del diario en cada generación (diario → memoria → semana, el
// mismo flujo que este bucle ya ejecuta con sus propias semanas). Sin él —el caso del harness,
// que mide corridas de memoria fría— nada cambia.
function generarCorrida(familiaDeclarada, arranqueIso, nSemanas, datos, config, diarioPrevio) {
  // CONTRATO primero: lo que entra al motor ya está en vocabulario del banco, validado y con
  // los miembros en orden canónico. Un token duro desconocido revienta AQUÍ, no en un menú.
  const familia = normalizarFamilia(familiaDeclarada, datos).familia;
  // POLÍTICA DE HOGAR (spec §13): el banco EFECTIVO del hogar se compone UNA vez, aquí, antes de
  // los pools y del prevuelo. De este punto en adelante `banco` es el único banco que el motor
  // conoce: si el hogar tiene una alergia severa, su alérgeno no existe aguas abajo y nadie
  // vuelve a comprobarlo. El banco CANÓNICO solo se usa para el hash de la corrida (abajo): la
  // política es propiedad de la familia, no un banco distinto, y las corridas siguen siendo
  // comparables entre familias.
  const { datos: banco, politica } = bancoDelHogar(datos, familia);
  const pools = compilarPools(banco);
  const semanas = [];
  let semanaIso = arranqueIso;
  const corridaParcial = { familia, semanas };       // para derivar el diario acumulado

  for (let i = 0; i < nSemanas; i++) {
    const entrada = entradaDe(familia, semanaIso);
    // memoria de ENTRADA: derivada del diario de lo YA servido (fría en la semana 1)
    const diario = diarioDesdeCorrida({ ...corridaParcial, generador: { banco_generacion: 'en-curso' } }, fechaDia);
    // lo servido ANTES de este arranque va DELANTE, y lo de esta corrida gana ante el mismo id
    // (clave natural fecha|servicio, D3 §1): re-generar una semana ya archivada la sustituye,
    // no la duplica. `memoria()` ordena por fecha y recorta su ventana, así que basta con que
    // los ids no colisionen dos veces.
    if (diarioPrevio && Array.isArray(diarioPrevio.servicios) && diarioPrevio.servicios.length) {
      const propios = new Set(diario.servicios.map(s => s.id));
      diario.servicios = diarioPrevio.servicios.filter(s => !propios.has(s.id)).concat(diario.servicios);
    }
    // EL MENÚ DEL COLE (spec §2-ter) entra en el diario como servicio REAL del día: ocupa su
    // hueco en la memoria de mesa (M1/M3) para que la cena no repita lo del mediodía, y sus
    // tomas cuentan en la semana del menor. La CANTIDAD no se declara ni se mide (se asume el
    // 35% del día, §5): por eso el servicio va marcado `origen: 'cole'` y sin fracciones.
    for (const s of semanasDelCole(familia, arranqueIso, i, semanaIso)) diario.servicios.push(s);
    const hoy = fechaDia(semanaIso, 1).toISOString().slice(0, 10);   // lunes de la semana a generar
    const mem = memoria(diario, banco, config, hoy);

    entrada.memoria = mem;                           // el prevuelo la necesita para las claves
    const pre = prevuelo(entrada, pools, banco, config);   // de profundidad 1 (spec §7)
    // BUCLE T1↔T2 (auditoría ciega 2-ago): el canal era de UN SENTIDO Y UN INTENTO — T1 repartía
    // una vez y, si T2 no podía llenar ese reparto, la semana moría aunque existiera otro reparto
    // legal que sí se podía llenar. Ahora T2 puede devolverle la pregunta a T1 hasta
    // `ESQUELETOS_POR_SEMANA` veces. Sigue siendo determinista: el intento solo desplaza el orden
    // de exploración, no introduce azar. El fallo que se reporta es el del ÚLTIMO intento y dice
    // cuántos se probaron, para no confundir «imposible» con «no lo intenté».
    const maxIntentos = config.ESQUELETOS_POR_SEMANA || 1;
    // el presupuesto de nodos del backtracking se REPARTE entre los intentos, no se reinicia:
    // el techo de tiempo de una semana es el mismo con 1 esqueleto que con 4 (medido: sin esto,
    // `sin-gluten` se comía 31 s en 8 semanas — fallar salía 4 veces más caro que antes).
    const configIntento = { ...config,
      BACKTRACK_MAX_NODOS: Math.max(1, Math.floor((config.BACKTRACK_MAX_NODOS || 20000) / maxIntentos)) };
    let esq = null, r = null, intentos = 0, cedioElaborado = false;
    // dos rondas: primero CON el cupo de plato de calma, y solo si ninguna sale, otra ronda SIN
    // él. Dictado de Roger (3-ago): «el plato de calma es una opción, 1 o 2, pero no es
    // obligatorio — quizá están de viaje, comen fuera, o en una casa rural con un pollo al ast».
    // La relajación R0 de T1 solo se disparaba cuando fallaba T1; aquí falla T2, así que nunca
    // llegaba y la semana moría por un plato que ni siquiera es obligatorio. Cede DECLARADO.
    const configSinCalma = { ...configIntento, ELABORADO_POR_SEMANA: 0 };
    for (const cfg of [configIntento, configSinCalma]) {
      for (let i = 0; i < maxIntentos; i++) {
        const e = esqueleto(entrada, pools, cfg, pre, i);
        intentos++;
        if (!e.ok) { esq = esq && esq.ok ? esq : e; continue; }
        esq = e;
        r = rellenarSemana({ entrada, esq: e, pre, pools, datos: banco, config: cfg, memoria: mem,
          menuCole: familia.menu_cole });
        if (r.ok) { cedioElaborado = cfg === configSinCalma; break; }
      }
      if (r && r.ok) break;
    }
    if (!esq.ok && !r) {
      semanas.push({ semana_iso: semanaIso, presencia: entrada.presencia,
        servicios: serviciosNulos(), fallo: { motivo: `${esq.motivo}: ${esq.restriccion_vinculante} (${intentos} esqueleto(s) probado(s))` } });
      semanaIso = siguienteSemana(semanaIso);
      continue;
    }
    if (!r.ok) {
      r = { ...r, motivo: `${r.motivo} — ${intentos} esqueleto(s) probado(s)` };
      semanas.push({ semana_iso: semanaIso, presencia: entrada.presencia,
        servicios: serviciosNulos(), fallo: { motivo: r.motivo } });
    } else {
      // RELAJACIONES DE SEMANA → al primer servicio servido, jamás en silencio. Cubre las dos
      // vías por las que el plato de calma puede caerse: la que declara T1 cuando no cabe en su
      // reparto (`esq.relajaciones` — existía y NO LA LEÍA NADIE, hallazgo de la auditoría) y la
      // que declara este bucle cuando T1 sí lo colocó pero T2 no pudo llenarlo.
      const deSemana = (esq.relajaciones || []).slice();
      if (cedioElaborado) deSemana.push({
        peldano: 'R0',
        detalle: 'cupo de plato de calma 1→0: no había ninguno servible para esta mesa esta semana',
        frase: 'Esta semana no ha salido ningún plato de los de cocinar con calma.'
      });
      if (deSemana.length) {
        const primero = r.semana.servicios.find(sv => sv.plato);
        if (primero) primero.relajaciones = (primero.relajaciones || []).concat(deSemana);
      }
      // T3 · cierre individual: fracciones y deuda sobre el menú ya fijado (spec §1-T3)
      const t3 = fraccionarSemana({ semana: r.semana, familia, config }, banco);
      for (const sv of r.semana.servicios) {
        const f = t3.servicios.find(x => x.slot === `${sv.dia}-${sv.servicio}`);
        if (!f || !sv.plato) continue;
        sv.fracciones = Object.keys(f.fracciones).length ? f.fracciones : null;
        if (f.ajustes_linea && f.ajustes_linea.length) sv.ajustes_linea = f.ajustes_linea;
        sv.descargos = (sv.descargos || []).concat(f.descargos);
        sv.relajaciones = (sv.relajaciones || []).concat(f.relajaciones);
      }
      // D2 · las 16 reglas de atragantamiento: nota en la card, jamás prohibición (§seguridad_infantil)
      // + §13: la card dice UNA vez lo que la política de hogar hizo con cada plato que lleva.
      semanas.push(anotarHogar(anotarSemana(r.semana, familia, entrada.edades, banco), politica));
    }
    semanaIso = siguienteSemana(semanaIso);
  }
  return serializarCorrida({ familia, semanas, version: VERSION, datos });
}

// menú del cole → servicios de diario de la semana ANTERIOR y la EN CURSO (la memoria mira
// hacia atrás; el cole de la semana que se genera también cuenta, porque su comida ya está
// decidida cuando el motor elige la cena de ese mismo día)
function semanasDelCole(familia, arranqueIso, iSemana, semanaIso) {
  const cole = familia.menu_cole;
  if (!cole) return [];
  const out = [];
  for (const [mid, porDia] of Object.entries(cole)) {
    for (const [dia, plato] of Object.entries(porDia)) {
      const d = Number(dia);
      const fecha = fechaDia(semanaIso, d).toISOString().slice(0, 10);
      out.push({ id: `${fecha}|comida|cole`, fecha, semana_iso: semanaIso, servicio: 'comida',
        origen: 'cole', plato, postre: null, presentes: [mid], fracciones: null, servido: true });
    }
  }
  return out;
}

const serviciosNulos = () => {
  const out = [];
  for (let d = 1; d <= 7; d++) for (const s of ['comida', 'cena'])
    out.push({ dia: d, servicio: s, plato: null, postre: null, relajaciones: [], descargos: [], notas: [], no_servido: null });
  return out;
};

module.exports = { generarCorrida, entradaDe, VERSION };

  };

  /* ---- motor_v6/src/memoria.js ---- */
  REG['memoria'] = function (module, exports, require) {
// MEMORIA derivada del diario de lo servido (D3, `../D3_DIARIO_SERVIDO.md` §4). Función PURA:
// (diario, banco, config) → { mesa: M1-M8, personas: P1-P5 }. Ni un contador se guarda: todo se
// recalcula del diario, siempre — un contador guardado se desincroniza en cuanto un servicio se
// edita, se borra o llega tarde.
//
// Es ENTRADA del motor (spec §3), no estado oculto: dos familias con el mismo diario reciben el
// mismo menú. Y es lo que permite arrancar el harness con memoria caliente en vez de fría.
'use strict';
const { indexarBanco, percibidosDe, origenDominante } = require('./percibidos.js');

const DIA_MS = 86400000;
const fechaAMs = f => Date.parse(f + 'T00:00:00Z');

// diario → memoria. `hoy` (AAAA-MM-DD) fija el origen de las distancias en días.
function memoria(diario, datos, config, hoy) {
  const ix = indexarBanco(datos);
  const cat = Object.fromEntries((datos.categorias_aesan || []).map(f => [f.alimento_id, f]));
  const servidos = diario.servicios
    .filter(s => s.servido !== false)                        // §3: lo no comido no alimenta memoria
    .sort((a, b) => fechaAMs(a.fecha) - fechaAMs(b.fecha) || (a.servicio === 'comida' ? -1 : 1))
    .slice(-config.VENTANA_DIARIO_SERVICIOS);                // ventana rodante (28)
  const hoyMs = fechaAMs(hoy);
  const d5 = { n: 0 };

  const mesa = { M1: {}, M2: {}, M3: null, M4: {}, M5: {}, M6: {}, M7: {}, M8: {} };
  const personas = {};
  const persona = id => personas[id] = personas[id] || { P1: {}, P2: {}, P3: 0, P4: [], P5: [] };

  servidos.forEach((s, idx) => {
    const dias = (hoyMs - fechaAMs(s.fecha)) / DIA_MS;       // 0 = hoy, 1 = ayer…
    const desdeFinal = servidos.length - 1 - idx;            // 0 = último servicio servido
    const semana = s.semana_iso;
    const principales = s.plato.filter(p => (ix.elab[p.elaboracion_id] || {}).tipo === 'principal');
    const secundarias = s.plato.filter(p => (ix.elab[p.elaboracion_id] || {}).tipo !== 'principal');

    // M1 · plato percibido (lo más reciente gana: se sobrescribe al avanzar)
    for (const p of principales) for (const per of percibidosDe(ix, p, d5))
      mesa.M1[per] = { dias, semana };
    // M2 · elaboración estructural, distancia en SERVICIOS
    for (const p of principales) mesa.M2[p.elaboracion_id] = { servicios: desdeFinal, dias };
    // M4 · secundarias y postre por percibido + contador semanal
    for (const x of secundarias.concat(s.postre ? [s.postre] : []))
      for (const per of percibidosDe(ix, x, d5)) {
        const reg = mesa.M4[per] = mesa.M4[per] || { servicios: desdeFinal, semanas: {} };
        reg.servicios = desdeFinal;
        reg.semanas[semana] = (reg.semanas[semana] || 0) + 1;
      }
    // M5 · bigramas principal+secundaria
    for (const p of principales) for (const x of secundarias) {
      const bg = `${p.elaboracion_id}+${x.elaboracion_id}`;
      mesa.M5[bg] = (mesa.M5[bg] || 0) + 1;
    }
    // M6 · técnica pesada por semana
    if (s.plato.some(p => ix.esPesada(p.elaboracion_id)))
      mesa.M6[semana] = (mesa.M6[semana] || 0) + 1;
    // M7 · perfil de servicio del día (coherencia intradía)
    for (const p of s.plato) {
      const perf = (ix.elab[p.elaboracion_id] || {}).perfil_servicio;
      if (perf) (mesa.M7[s.fecha] = mesa.M7[s.fecha] || []).push({ servicio: s.servicio, ...perf });
    }
    // M8 · clase de postre
    if (s.postre) {
      const clase = config.CLASE_POSTRE[s.postre.elaboracion_id] || 'otro';
      const reg = mesa.M8[clase] = mesa.M8[clase] || { servicios: desdeFinal, semanas: {} };
      reg.servicios = desdeFinal;
      reg.semanas[semana] = (reg.semanas[semana] || 0) + 1;
    }

    // ── por persona (nada se imputa a quien no estuvo)
    for (const mid of s.presentes) {
      const P = persona(mid);
      // P2 · última opción del eje por (persona × elaboración)
      for (const p of s.plato.concat(s.postre ? [s.postre] : [])) {
        const op = p.opciones_eje && (p.opciones_eje[mid] || p.opciones_eje['*']);
        if (op) P.P2[p.elaboracion_id] = { opcion: op, servicios: desdeFinal };
      }
      // P4 · novedades (primera vez que esa persona ve ese percibido)
      for (const p of principales) for (const per of percibidosDe(ix, p, d5))
        if (!P.__vistos) { P.__vistos = new Set([per]); P.P4.push({ percibido: per, semana }); }
        else if (!P.__vistos.has(per)) { P.__vistos.add(per); P.P4.push({ percibido: per, semana }); }
    }
  });

  // M3 · origen dominante del ÚLTIMO servicio (el motor solo necesita el borde)
  const ultimo = servidos[servidos.length - 1];
  if (ultimo) {
    const dom = origenDominanteDeServicio(ix, cat, ultimo);
    if (dom) mesa.M3 = { origen: dom, fecha: ultimo.fecha, servicios: 0 };
  }

  return { ventana: servidos.length, hoy, mesa, personas, huecos_d5: d5.n };
}

// origen dominante sin pasar por el derivador: la línea no-condimento de más gramos de naturaleza
// animal del plato; si no hay animal, la de más gramos. (El derivador afina por proteína real
// cuando hay derivación; aquí basta el borde para la distancia M3.)
function origenDominanteDeServicio(ix, cat, s) {
  const ANIMAL = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);
  let mejorAnimal = null, mejor = null;
  for (const p of s.plato) {
    for (const l of ix.lineasDe[p.elaboracion_id] || []) {
      if (l.papel === 'condimento' || l.componente_id) continue;
      let alimentoId = l.alimento_id;
      if (Array.isArray(l.alternativas)) {
        const op = p.opciones_eje && (p.opciones_eje['*'] || Object.values(p.opciones_eje)[0]);
        if (!op) continue;
        alimentoId = op;
      }
      const a = ix.alim[alimentoId];
      if (!a) continue;
      const g = l.gramos_adulto || 0;
      if (ANIMAL.has(a.naturaleza) && (!mejorAnimal || g > mejorAnimal.g)) mejorAnimal = { a, g };
      if (!mejor || g > mejor.g) mejor = { a, g };
    }
  }
  const elegido = mejorAnimal || mejor;
  return elegido && elegido.a.origen;
}

// corrida en formato neutro → diario (para arrancar el harness con memoria caliente y para
// comprobar que ambos formatos dicen lo mismo)
function diarioDesdeCorrida(corrida, fechaDia) {
  const servicios = [];
  for (const sem of corrida.semanas) sem.servicios.forEach(sv => {
    if (!sv.plato) return;
    const fecha = fechaDia(sem.semana_iso, sv.dia).toISOString().slice(0, 10);
    servicios.push({
      id: `${fecha}|${sv.servicio}`, fecha, semana_iso: sem.semana_iso, servicio: sv.servicio,
      origen: 'generado', plato: sv.plato, postre: sv.postre,
      presentes: Object.keys(corrida.familia.miembros.reduce((acc, m) => {
        if (sem.presencia[m.id] && sem.presencia[m.id][`${sv.dia}-${sv.servicio}`] === true) acc[m.id] = 1;
        return acc;
      }, {})),
      fracciones: sv.fracciones, servido: true,
      banco_generacion: corrida.generador.banco_generacion || corrida.generador.banco
    });
  });
  return { esquema: 'e3f-diario/1', servicios };
}

module.exports = { memoria, diarioDesdeCorrida, origenDominanteDeServicio };

  };

  /* ---- motor_v6/src/percibidos.js ---- */
  REG['percibidos'] = function (module, exports, require) {
// PERCIBIDOS · qué cuenta como «el mismo plato» a ojos de la familia, y de dónde es un menú.
//
// Vivía en `harness/baterias/c_variedad.js` — es decir: `memoria.js`, y con ella TODO el motor,
// importaba una BATERÍA DE TEST para funcionar. Es la deuda de empaquetado que señalaron tres
// auditores el 2-ago, y la razón de fondo por la que V6 no se podía llevar al navegador.
//
// La identidad de un plato es DOCTRINA DEL MOTOR, no criterio del juez: `c_variedad.js` ahora la
// importa de aquí. (Que juez y motor compartan esta definición sigue siendo circularidad
// declarada — el antídoto es `t4_auditoria.js`, que reimplementa desde el banco.)
'use strict';

// naturalezas que hacen que una proteína «mande» en el plato percibido
const ANIMAL = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);

function indexarBanco(datos) {
  const elab = Object.fromEntries(datos.elaboraciones.map(e => [e.id, e]));
  const alim = Object.fromEntries(datos.alimentos.map(a => [a.id, a]));
  const lineasDe = {};
  for (const l of datos.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);
  const compTipo = Object.fromEntries(datos.componentes.map(c => [c.id, c.tipo]));
  // pesada (M6): frito en alguna línea (recursivo) o componente recubrimiento
  const pesada = {};
  const esPesada = id => {
    if (id in pesada) return pesada[id];
    pesada[id] = false;
    for (const l of lineasDe[id] || []) {
      if (l.componente_id && (compTipo[l.componente_id] === 'recubrimiento' || esPesada(l.componente_id))) pesada[id] = true;
      if (l.tecnica_id === 'frito') pesada[id] = true;
    }
    return pesada[id];
  };
  return { elab, alim, lineasDe, esPesada };
}

// percibidos de una elaboración servida, a nivel MESA (opciones distintas ⇒ percibidos distintos)
// percibidos de una elaboración servida, a nivel MESA (opciones distintas ⇒ percibidos distintos)
function percibidosDe(ix, servida, contadorD5) {
  const e = ix.elab[servida.elaboracion_id];
  const npo = e.nombre_por_opcion || {};
  const tieneEje = (ix.lineasDe[e.id] || []).some(l => Array.isArray(l.alternativas));
  if (!tieneEje || !servida.opciones_eje) return [e.id];
  const opciones = [...new Set(Object.values(servida.opciones_eje))];
  return opciones.map(op => {
    if (npo[op]) return npo[op];
    contadorD5.n++;
    return `${e.id}×${op}`;
  });
}

// origen dominante de la mesa en un servicio (ver convención de cabecera)
// origen dominante de la mesa en un servicio (ver convención de cabecera)
function origenDominante(ix, porMiembro, platoIds) {
  const votos = {};
  for (const r of Object.values(porMiembro)) {
    let mejorAnimal = null, mejorProt = null;
    for (const parte of r.partes) {
      if (!platoIds.has(parte.elaboracion_id)) continue;          // postre fuera
      for (const l of parte.lineas) {
        if (l.papel === 'condimento') continue;
        const nat = (ix.alim[l.alimento] || {}).naturaleza;
        if (ANIMAL.has(nat) && (!mejorAnimal || l.gramos_base > mejorAnimal.gramos_base)) mejorAnimal = l;
        if (!mejorProt || l.abs.proteina > mejorProt.abs.proteina) mejorProt = l;
      }
    }
    const linea = mejorAnimal || mejorProt;
    if (linea) { const o = (ix.alim[linea.alimento] || {}).origen; if (o) votos[o] = (votos[o] || 0) + 1; }
  }
  let mejor = null;
  for (const [o, n] of Object.entries(votos)) if (!mejor || n > mejor.n) mejor = { origen: o, n };
  return mejor && mejor.origen;
}

module.exports = { indexarBanco, percibidosDe, origenDominante };

  };

  /* ---- motor_v6/src/pools.js ---- */
  REG['pools'] = function (module, exports, require) {
// POOLS — precompilado del banco para el motor V6. Función pura del banco: no conoce familias
// ni semanas, así que se calcula una vez por build (spec §1: «precompilación en build»).
//
// Qué produce, por cada CANDIDATO = (elaboración principal × opción de eje):
//   categoria  — el cubo AESAN de su línea proteica DOMINANTE (D1). Es lo que T1 reserva.
//                `sin-cuota` = ninguna línea cae en cubo con banda (canelones, croquetas): se
//                sirve igual y ocupa slot, pero no consume techo ni cumple mínimo. Es categoría
//                de pleno derecho, no un null: si no lo fuera, T1 no podría reservarla y esas
//                elaboraciones no se servirían JAMÁS (lo mediría la batería D).
//   servicio   — para qué servicios es apta · esfuerzo · temporada (estación o null)
//   servible   — todas sus líneas derivables (esquema §1.5 y §7): sin dato no se sirve.
//
// La categoría depende de la OPCIÓN, no solo de la elaboración: la misma pizza es
// carne-procesada con jamón y pescado-azul con atún. Por eso el candidato es el par.
'use strict';

const ANIMAL = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);
// cubos que T1 reserva (los que tienen banda en config.CUOTAS, vía APORTA de la batería A)
const CUBOS = new Set(['legumbre', 'pescado-blanco', 'pescado-azul', 'marisco', 'huevo',
  'carne-roja', 'carne-blanca', 'carne-procesada']);

function compilarPools(datos) {
  const alim = Object.fromEntries(datos.alimentos.map(a => [a.id, a]));
  const cat = Object.fromEntries((datos.categorias_aesan || []).map(f => [f.alimento_id, f]));
  const coc = {};
  for (const c of datos.cocciones) if (c.factor_agua != null)
    (coc[c.alimento_id] = coc[c.alimento_id] || new Set()).add(c.tecnica_id);
  const lineasDe = {};
  for (const l of datos.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);

  const derivable = (al, tec) => alim[al] != null && (tec == null || (coc[al] || new Set()).has(tec));

  // ¿es servible esta elaboración con esta opción concreta? (componentes incluidos, recursivo)
  function servible(id, opcion, visto = new Set()) {
    if (visto.has(id)) return true;
    visto.add(id);
    return (lineasDe[id] || []).every(l => {
      if (l.componente_id) return servible(l.componente_id, null, visto);
      if (Array.isArray(l.alternativas)) return derivable(opcion, l.tecnica_id);
      return derivable(l.alimento_id, l.tecnica_id);
    });
  }

  // línea proteica dominante con esta opción → su cubo AESAN
  function categoriaDe(id, opcion) {
    let mejorAnimal = null, mejorProt = null;
    const recorrer = (padre, escala) => {
      for (const l of lineasDe[padre] || []) {
        if (l.componente_id) { recorrer(l.componente_id, escala); continue; }
        if (l.papel === 'condimento') continue;
        const alimentoId = Array.isArray(l.alternativas) ? opcion : l.alimento_id;
        const a = alim[alimentoId];
        if (!a) continue;
        const g = (l.gramos_adulto || 0) * escala;
        if (ANIMAL.has(a.naturaleza) && (!mejorAnimal || g > mejorAnimal.g)) mejorAnimal = { id: alimentoId, g };
        // sin animal: manda la proteína real, no los gramos (una pasta pesa más que su legumbre)
        const f = cat[alimentoId];
        if (f && CUBOS.has(f.categoria) && (!mejorProt || g > mejorProt.g)) mejorProt = { id: alimentoId, g };
      }
    };
    recorrer(id, 1);
    const elegido = mejorAnimal || mejorProt;
    if (!elegido) return 'sin-cuota';
    const fila = cat[elegido.id];
    return fila && CUBOS.has(fila.categoria) ? fila.categoria : 'sin-cuota';
  }

  // candidatos = PRINCIPALES (lo que T1 reserva). piezas = SECUNDARIAS y POSTRES servibles por
  // opción — el material de cierre de T2 (guarniciones vía `combinaciones`, postre §6). Mismo
  // átomo (elaboración × opción) y misma regla de servibilidad; sin categoría-cubo porque las
  // piezas no reservan cuota (los mínimos son del eje/dominante del principal, spec §4) — sus
  // gramos SÍ consumen techos, pero eso se cuenta en T2 sobre gramos, no aquí.
  const candidatos = [], piezas = [];
  for (const e of datos.elaboraciones) {
    const esPrincipal = e.tipo === 'principal';
    const lineaEje = (lineasDe[e.id] || []).find(l => Array.isArray(l.alternativas));
    const opciones = lineaEje ? lineaEje.alternativas : [null];
    for (const opcion of opciones) {
      if (!servible(e.id, opcion)) continue;
      const base = {
        elaboracion_id: e.id, opcion,
        apta: e.apta || [],
        esfuerzo: e.esfuerzo,
        temporada: typeof e.temporada === 'string' ? e.temporada : null,
        ninos: e.ninos === true
      };
      if (esPrincipal) candidatos.push({ ...base, categoria: categoriaDe(e.id, opcion) });
      else piezas.push({ ...base, tipo: e.tipo });
    }
  }
  return { candidatos, piezas, CUBOS: [...CUBOS] };
}

// índice de disponibilidad para T1: ¿existe algún candidato con (categoría, servicio, esfuerzo)
// compatible con la estación? Devuelve Set de claves 'categoria|servicio|esfuerzo'.
function disponibilidad(pools, estacion) {
  const disponible = new Set();
  for (const c of pools.candidatos) {
    if (c.temporada != null && c.temporada !== estacion) continue;
    for (const s of c.apta) disponible.add(`${c.categoria}|${s}|${c.esfuerzo}`);
  }
  return disponible;
}

module.exports = { compilarPools, disponibilidad, CUBOS: [...CUBOS] };

  };

  /* ---- motor_v6/src/prevuelo.js ---- */
  REG['prevuelo'] = function (module, exports, require) {
// PREVUELO · factibilidad por familia (spec §7 REESCRITO 2-ago + Q1). Se ejecuta ANTES de
// generar: aquí se sabe qué puede comer cada uno, CÓMO se le sirve (doctrina de la CARD,
// §2-bis) y qué mínimos son alcanzables — el fallo, si existe, se conoce antes y CON NOMBRE.
//
// DOCTRINA (2-ago, OK Roger — sustituye a «mesa única»): una línea que un presente no puede
// comer NO veta el plato. Se resuelve por su FUNCIÓN:
//   on-top / lo-que-entra-tarde  → NOTA de eliminación para esa persona (y dirección positiva:
//                                  añadir al que sí puede)
//   base-olla · ligante          → VARIANTE para todos (exige `sustitutos` con validez por TIPO)
//   hidrato-vehículo             → vehículo POR PERSONA (pasta normal + pasta GF)
//   proteína-eje                 → su opción del mapa (ya era individual)
//   condimento                   → eliminación por nota (salsa aparte, especia fuera)
//   ESTRUCTURAL                  → el conflicto es el plato: nota-SUSTITUTO solo para esa
//                                  persona (computa en el gate G de días-de-exclusión)
// El plato deja de existir únicamente si no puede servir a NINGÚN presente.
//
// ESTADO DE DATOS (D6 en curso, QA — no bloquea por orden de Roger): el banco AÚN no trae
// `funcion` por línea ni tabla `sustitutos`. Regla conservadora declarada: línea sin `funcion`
// = tratamiento ESTRUCTURAL (jamás se auto-clasifica — dictado) + hueco `linea-sin-funcion`;
// vía que exige sustituto sin tabla donde mirarlo = ESTRUCTURAL + hueco `sustituto-ausente`.
// El mecanismo completo ya vive aquí; los datos lo van abriendo al aterrizar.
//
// Q1 (intacta, base nueva): el mínimo de un cubo imposible por H INDIVIDUAL cede a lo
// alcanzable con descargo estructural; los techos jamás. La base del aforo ya no es «lo que
// toda la mesa puede» sino la composición INDIVIDUAL — el alérgico a huevo sigue sin huevo,
// pero su familia lo recupera (tortilla con nota-sustituto para él).
'use strict';
const { SLOTS, cubosDe } = require('./t1_esqueleto.js');
const { racionParaLinea, EDAD_TABLA_INFANTIL_MIN: EDAD_MINIMA_PRODUCTO } = require('./raciones.js');
const { casaAlergeno, NO_VEGANO_PESE_A_NATURALEZA, ALERGENO_CARNE_PESCADO,
  ALERGENO_ANIMAL_INDIRECTO } = require('./contrato_familia.js');

// misma convención de dieta que el chequeo H del harness: la dieta gobierna por `naturaleza`
const NO_VEGETARIANO = new Set(['carne', 'pescado', 'marisco']);
const NO_VEGANO = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);

// función de línea → vía de resolución cuando el miembro NO puede comerla (doctrina §2-bis).
// `null` = exige tabla `sustitutos` (sin ella: estructural + hueco).
const VIA_POR_FUNCION = {
  'on-top': 'nota-eliminar',
  condimento: 'nota-eliminar',
  'base-olla': null,
  ligante: null,
  'hidrato-vehiculo': null,
  'proteina-eje': 'opcion-persona',
  estructural: 'excluido'
};

function prevuelo(entrada, pools, datos, config) {
  const { familia, estacion, presencia, edades, memoria } = entrada;
  const alim = Object.fromEntries(datos.alimentos.map(a => [a.id, a]));
  const cat = Object.fromEntries((datos.categorias_aesan || []).map(f => [f.alimento_id, f]));
  const lineasDe = {};
  for (const l of datos.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);
  const prohibidasPorEdad = {};                       // prohibiciones PURAS de D2 (límites y
  for (const f of datos.seguridad_infantil || []) {   // dependientes: contadores de T2/E)
    if (f.limite_g_dia != null || f.condicion != null) continue;
    const previa = prohibidasPorEdad[f.alimento_id];
    prohibidasPorEdad[f.alimento_id] = previa == null ? f.edad_max_anos : Math.max(previa, f.edad_max_anos);
  }

  // ── ¿por qué NO puede este miembro comer este alimento? null = puede (la moneda H).
  //    El MOTIVO alimenta la capa (b) del matching de sustitutos: valido_para por dimensión.
  function motivoNoComible(mid, alimentoId) {
    const a = alim[alimentoId];
    if (!a) return 'inexistente';
    const m = familia.miembros.find(x => x.id === mid);
    const al = a.alergenos || [];
    // (1) ALERGIA — dura, sin excepción posible: `leche-sin-lactosa` conserva la proteína.
    if (casaAlergeno(al, m.alergias)) return 'alergia';
    if ((m.origenes_vetados || []).includes(a.origen)) return 'alergia';   // rosáceas (LTP)
    // (2) INTOLERANCIA — dura, pero cede ante los productos hechos PARA él (contrato §APTO_*).
    //     Es el motivo que abre la vía 2 contra `sustitutos.valido_para: ['intolerancia']`.
    if (!(m.aptos_pese_a_alergeno || []).includes(alimentoId) && casaAlergeno(al, m.intolerancias))
      return 'intolerancia';
    // (3) DIETA — `naturaleza` más lo que `naturaleza` no ve (miel, mayonesa, ñoquis)
    const prohibidas = m.dieta === 'vegana' ? NO_VEGANO : m.dieta === 'vegetariana' ? NO_VEGETARIANO : null;
    if (prohibidas && (prohibidas.has(a.naturaleza) || casaAlergeno(al, ALERGENO_CARNE_PESCADO)))
      return m.dieta === 'vegana' ? 'vegano' : 'vegetariano';
    if (m.dieta === 'vegana' && (NO_VEGANO_PESE_A_NATURALEZA[alimentoId]
      || casaAlergeno(al, ALERGENO_ANIMAL_INDIRECTO))) return 'vegano';
    if ((m.vetos || []).includes(alimentoId) || (m.no_gusta || []).includes(alimentoId)) return 'preferencia';
    const edadMax = prohibidasPorEdad[alimentoId];
    if (edadMax != null && edades[mid] < edadMax) return 'edad';
    return null;
  }
  const comible = (mid, alimentoId) => motivoNoComible(mid, alimentoId) == null;

  // ── matching de la tabla `sustitutos` (esquema BD_ESQUEMA §1.8; el llamador la compone en
  //    `datos.sustitutos` — no está cableada a index.js a propósito). Regla (a) SIEMPRE y
  //    dominante: el sustituto tiene que ser H-comible por el miembro (alérgenos REALES del
  //    banco — jamás el prefijo del nombre — más dieta, vetos y D2, vía motivoNoComible).
  //    Regla (b): si la fila declara `valido_para`, debe cubrir la dimensión del conflicto
  //    (vegano/vegetariano/alergia/intolerancia/preferencia); el conflicto por edad (D2) no
  //    tiene dimensión en la tabla — (a) decide sola.
  function sustitutoPara(mid, alimentoId, funcion, motivo) {
    const filas = (datos.sustitutos || []).filter(s => s.original === alimentoId
      && (s.funcion_aplicable == null || s.funcion_aplicable === funcion));
    if (!filas.length) return { estado: 'sin-tabla' };
    const apta = filas.find(s => comible(mid, s.sustituto_id)
      && (motivo === 'edad' || !Array.isArray(s.valido_para) || s.valido_para.includes(motivo)));
    return apta ? { estado: 'ok', fila: apta } : { estado: 'no-apto' };
  }

  // ── líneas FIJAS de una elaboración (recursivo por componentes, condimentos incluidos),
  //    con la FUNCIÓN de cada una — la resolución necesita la línea, no solo el alimento
  function lineasFijas(id, out = [], visto = new Set()) {
    if (visto.has(id)) return out;
    visto.add(id);
    for (const l of lineasDe[id] || []) {
      if (l.componente_id) { lineasFijas(l.componente_id, out, visto); continue; }
      if (Array.isArray(l.alternativas)) continue;    // el eje se resuelve por persona
      if (l.alimento_id) out.push(l);
    }
    return out;
  }

  // ── opciones SERVIBLES por elaboración (candidatos + piezas: sin dato no se sirve)
  const todas = pools.candidatos.concat(pools.piezas || []);
  const opcionesServibles = {};
  const tieneEje = {};
  for (const c of todas) {
    if (c.opcion == null) continue;
    (opcionesServibles[c.elaboracion_id] = opcionesServibles[c.elaboracion_id] || new Set()).add(c.opcion);
    tieneEje[c.elaboracion_id] = true;
  }

  const mids = familia.miembros.map(m => m.id);
  const elabs = [...new Set(todas.map(c => c.elaboracion_id))];
  const huecosFuncion = new Set(), huecosSustituto = new Set(), huecosNoApto = new Set();

  // ── RESOLUCIÓN por (miembro × elaboración): cómo se le sirve, doctrina §2-bis.
  //    resolucion[mid][elab] = { estado: 'tal-cual'|'adaptado'|'excluido', notas: [...] }
  //    Nota de alcance: la resolución es POR MIEMBRO («¿existe sustituto que ÉL pueda comer?»);
  //    la elección del sustituto ÚNICO de mesa para variante-todos es de T2, que conoce los
  //    presentes del slot y busca la intersección.
  const resolucion = {}, fijosOK = {}, opcionesLegales = {};
  for (const mid of mids) {
    resolucion[mid] = {}; fijosOK[mid] = {}; opcionesLegales[mid] = {};
    for (const e of elabs) {
      const notas = [];
      let excluido = false;
      let sustancia = 0, eliminadas = 0;             // líneas fijas no-condimento vivas/quitadas
      for (const l of lineasFijas(e)) {
        const esSustancia = l.papel !== 'condimento';
        if (esSustancia) sustancia++;
        const motivo = motivoNoComible(mid, l.alimento_id);
        if (motivo == null) continue;
        const via = l.funcion == null
          ? (huecosFuncion.add(`${e}|${l.alimento_id}`), 'excluido')      // sin clasificar ⇒ conservador
          : VIA_POR_FUNCION[l.funcion] !== undefined ? VIA_POR_FUNCION[l.funcion] : 'excluido';
        if (l.funcion === 'base-olla' || l.funcion === 'ligante' || l.funcion === 'hidrato-vehiculo') {
          // vías de variante/vehículo: viven de la tabla `sustitutos` (D6)
          const s = sustitutoPara(mid, l.alimento_id, l.funcion, motivo);
          if (s.estado !== 'ok') {
            (s.estado === 'sin-tabla' ? huecosSustituto : huecosNoApto).add(`${e}|${l.alimento_id}`);
            excluido = true; break;
          }
          notas.push({ via: l.funcion === 'hidrato-vehiculo' ? 'vehiculo-persona' : 'variante-todos',
            alimento: l.alimento_id, sustituto: s.fila.sustituto_id, funcion: l.funcion });
          continue;
        }
        if (via === 'excluido') { excluido = true; break; }
        if (via === 'nota-eliminar' && esSustancia) eliminadas++;
        notas.push({ via, alimento: l.alimento_id, funcion: l.funcion || null });
      }
      // la eliminación no puede VACIAR el plato (test de realidad §0.7): si las notas quitan
      // toda la sustancia y no hay eje que lo sostenga, para esa persona el plato no existe
      // (cazado con huevo-duro «adaptado» a plato vacío para un vegano)
      if (!excluido && !tieneEje[e] && sustancia > 0 && eliminadas >= sustancia) excluido = true;
      // el eje: individual por construcción — sin opción legal para él, el eje lo excluye
      const legales = tieneEje[e] ? [...opcionesServibles[e]].filter(op => comible(mid, op)) : null;
      if (legales) opcionesLegales[mid][e] = legales;
      if (!excluido && legales && legales.length === 0) excluido = true;
      fijosOK[mid][e] = !excluido && notas.length === 0;
      resolucion[mid][e] = excluido ? { estado: 'excluido', notas: [] }
        : { estado: notas.length ? 'adaptado' : 'tal-cual', notas };
    }
  }

  const comibleCandidato = (mid, c) => resolucion[mid][c.elaboracion_id].estado !== 'excluido'
    && (!tieneEje[c.elaboracion_id] || opcionesLegales[mid][c.elaboracion_id].length > 0);

  function alimentaCubo(mid, c, cubo) {
    if (!comibleCandidato(mid, c)) return false;
    const fila = cat[c.opcion];
    const cuboDelEje = c.opcion != null && fila && cubosDe(fila.categoria).includes(cubo);
    if (!cuboDelEje) {
      // cubo por dominante FIJO. Alimenta a quien SE COME esa línea: si su resolución la
      // elimina o la sustituye (vías 1/2/4), ese cubo no le llega — dárselo por bueno le
      // colgaba un mínimo de `carne-total` a un vegetariano (cazado al abrir las bandas a los
      // no-omnívoros, 3-ago). Si no se identifica qué línea alimenta el cubo se conserva el
      // comportamiento anterior: la etiqueta manda solo donde no hay dato mejor.
      const r = resolucion[mid][c.elaboracion_id];
      if (!r.notas.length) return true;               // se lo come tal cual
      const tocadas = new Set(r.notas.map(n => n.alimento));
      const alimentan = lineasFijas(c.elaboracion_id).filter(l =>
        cat[l.alimento_id] && cubosDe(cat[l.alimento_id].categoria).includes(cubo));
      return alimentan.length === 0 || alimentan.some(l => !tocadas.has(l.alimento_id));
    }
    return opcionesLegales[mid][c.elaboracion_id]
      .some(op => (cat[op] ? cubosDe(cat[op].categoria) : []).includes(cubo));
  }

  // ── slots activos · candidato SERVIBLE = sirve a ≥1 presente (doctrina: el plato solo muere
  //    si no puede servir a NADIE) · exclusiones proyectadas para el gate G
  const gobierno = familia.gobierno == null ? null : new Set(familia.gobierno);
  const activos = SLOTS.filter(s => (gobierno == null || gobierno.has(s.slot))
    && mids.some(mid => presencia[mid] && presencia[mid][s.slot] === true));

  const servible = {}, dispPorSlot = {}, exclusiones = {};
  for (const s of activos) {
    const presentes = mids.filter(mid => presencia[mid][s.slot] === true);
    const viables = new Set(), claves = new Set(), exc = {};
    pools.candidatos.forEach((c, i) => {
      if (c.temporada != null && c.temporada !== estacion) return;
      if (!c.apta.includes(s.servicio)) return;
      const sirven = presentes.filter(mid => comibleCandidato(mid, c));
      if (sirven.length === 0) return;               // no sirve a NADIE ⇒ no existe
      viables.add(i);
      claves.add(`${c.categoria}|${s.servicio}|${c.esfuerzo}`);
      const fuera = presentes.filter(mid => !comibleCandidato(mid, c));
      if (fuera.length) exc[i] = fuera;
    });
    servible[s.slot] = viables;
    dispPorSlot[s.slot] = claves;
    exclusiones[s.slot] = exc;
  }

  // técnica pesada (misma convención que la vara M6 de c_variedad — duplicado mínimo declarado)
  const compTipo = Object.fromEntries((datos.componentes || []).map(c => [c.id, c.tipo]));
  const cachePesada = {};
  const esPesada = id => {
    if (id in cachePesada) return cachePesada[id];
    cachePesada[id] = false;
    for (const l of lineasDe[id] || []) {
      if (l.componente_id && (compTipo[l.componente_id] === 'recubrimiento' || esPesada(l.componente_id))) cachePesada[id] = true;
      if (l.tecnica_id === 'frito') cachePesada[id] = true;
    }
    return cachePesada[id];
  };

  // ── bandas efectivas (Q1, base individual) + puedeCubo para el conteo de T1.
  //    TODOS los miembros, no solo los omnívoros (auditoría ciega 2-ago · paso 2 del cierre,
  //    3-ago): filtrar por `dieta === 'omnivora'` dejaba a un vegetariano SIN NINGUNA BANDA —
  //    ni mínimos, ni techos, ni descargo. Su plato no entraba en el sistema de cuotas y la
  //    semana se declaraba conforme sin haberlo mirado. No se inventa aquí ninguna tabla por
  //    dieta (AESAN no publica cuotas vegana/vegetariana y el dictado prohíbe extrapolar): se
  //    aplica la MISMA tabla y el mecanismo Q1 que ya existía hace el resto — el cubo que esa
  //    persona no puede comer tiene aforo 0, su mínimo cede a 0 y sale DECLARADO como
  //    `minimo-inalcanzable`. Antes era silencio; ahora es un descargo que se puede auditar.
  const bandasEfectivas = {}, puedeCubo = {}, descargos = [], huecos = [];
  for (const m of familia.miembros) puedeCubo[m.id] = {};
  for (const m of familia.miembros) {
    const slotsPresente = activos.filter(s => presencia[m.id][s.slot] === true);
    if (!slotsPresente.length) continue;
    const factor = slotsPresente.length / 14;
    const tramo = edades[m.id] < config.EDAD_RACION_ADULTO ? 'nino' : 'adulto';
    bandasEfectivas[m.id] = {};
    // EDAD MÍNIMA DEL PRODUCTO: 3 AÑOS (dictado Roger 2-ago, spec §8-D1-bis). Por debajo no hay
    // gramaje publicado por ningún organismo y jamás se extrapola: un miembro <3 está FUERA DEL
    // PRODUCTO, no es un caso a resolver. El motor no lo gobierna y lo dice en voz alta — la
    // entrada no debería traerlo (la parrilla del harness ya cumple el dictado).
    if (edades[m.id] < EDAD_MINIMA_PRODUCTO) {
      for (const cubo of Object.keys(config.CUOTAS))
        bandasEfectivas[m.id][cubo] = { min: 0, max: Infinity, fuera_de_alcance: true };
      descargos.push({ tipo: 'miembro-fuera-de-alcance', miembro: m.id,
        detalle: `${m.id} tiene ${edades[m.id]} años y la edad mínima del producto es ${EDAD_MINIMA_PRODUCTO} (dictado 2-ago): sus cuotas quedan fuera del gobierno del motor — nada se extrapola` });
      continue;
    }
    for (const [cubo, porEdad] of Object.entries(config.CUOTAS)) {
      const [min, max] = porEdad[tramo];
      let aforo = 0;
      for (const s of slotsPresente) {
        const hay = [...servible[s.slot]].some(i => {
          const c = pools.candidatos[i];
          return cubosDe(c.categoria).includes(cubo) && alimentaCubo(m.id, c, cubo);
        });
        if (hay) aforo++;
      }
      puedeCubo[m.id][cubo] = aforo > 0;
      const minPro = min == null ? 0 : min * factor;
      // conflicto mínimo↔techo-de-fritos (estructural del banco, cazado con el huevo: si TODO
      // candidato comible del cubo es pesado, el cubo solo puede servirse FRITOS_SEMANA_MAX
      // veces — v5 lo violaba en silencio por los dos lados; aquí el mínimo cede DECLARADO)
      const hayNoPesado = pools.candidatos.some(c =>
        (c.temporada == null || c.temporada === estacion)
        && cubosDe(c.categoria).includes(cubo) && !esPesada(c.elaboracion_id)
        && alimentaCubo(m.id, c, cubo));
      const capFritos = hayNoPesado ? Infinity : (config.FRITOS_SEMANA_MAX || Infinity) * factor;
      const minEfectivo = Math.min(minPro, aforo, capFritos);
      if (min != null && minEfectivo < minPro - 1e-9) {
        const porFritos = capFritos < Math.min(minPro, aforo);
        descargos.push({
          tipo: porFritos ? 'minimo-vs-techo-fritos' : 'minimo-inalcanzable', miembro: m.id, cubo,
          minimo: +minPro.toFixed(3), alcanzable: +minEfectivo.toFixed(3),
          detalle: porFritos
            ? `${m.id}: todo ${cubo} comible es frito/rebozado — el mínimo ${minPro.toFixed(1)} cede al techo de fritos ${capFritos.toFixed(1)} (banco sin ${cubo} no-pesado; reportado a altas)`
            : `${m.id} no puede alcanzar ${cubo} ${minPro.toFixed(1)}/sem: ` +
              (aforo === 0 ? 'ningún plato del cubo tiene composición comible para esa persona'
                : `solo ${aforo} servicio(s) viable(s)`) + ' (H individual: la cuota cede, el veto jamás)'
        });
      } else if (min != null && aforo < minPro * (config.MARGEN_AFORO || 1.5)) {
        huecos.push({ tipo: 'aforo-justo', miembro: m.id, cubo, aforo, minimo: +minPro.toFixed(3) });
      }
      bandasEfectivas[m.id][cubo] = {
        min: minEfectivo,
        // techos AESAN: JAMÁS se suben (Q1). Sí pueden BAJAR por M6: un cubo cuyo candidato
        // comible es siempre frito no puede ocupar más slots que el techo de fritos
        max: Math.min(max == null ? Infinity : max * factor, capFritos)
      };
    }
  }

  // ── huecos de contenido y de datos D6
  for (const s of activos) {
    if (servible[s.slot].size === 0)
      huecos.push({ tipo: 'slot-sin-candidatos', slot: s.slot,
        motivo: `ningún candidato de ${s.servicio} puede servir a nadie en ${estacion}` });
  }
  const categoriasBanco = [...new Set(pools.candidatos.map(c => c.categoria))];
  const categoriasVivas = new Set();
  for (const claves of Object.values(dispPorSlot))
    for (const k of claves) categoriasVivas.add(k.split('|')[0]);
  for (const categoria of categoriasBanco) {
    if (!categoriasVivas.has(categoria))
      huecos.push({ tipo: 'categoria-muerta', categoria,
        motivo: `ningún plato de ${categoria} puede servir a nadie de esta mesa en ${estacion}` });
  }
  for (const servicio of ['comida', 'cena']) {
    const vivas = new Set();
    for (const s of activos) if (s.servicio === servicio)
      for (const k of dispPorSlot[s.slot]) vivas.add(k.split('|')[0]);
    if (vivas.size > 0 && vivas.size < (config.POOL_ESTRECHO_CATEGORIAS || 3))
      huecos.push({ tipo: 'pool-estrecho', servicio, categorias: [...vivas].sort(),
        motivo: `solo ${vivas.size} categoría(s) viva(s) en ${servicio}: la alternancia y los techos estrangulan la semana` });
  }
  // ── lo que la POLÍTICA DE HOGAR le cuesta a esta casa (§13.4). El banco efectivo ya viene
  //    filtrado de `banco_hogar.js`: aquí no se comprueba ningún alérgeno, solo se NOMBRA la
  //    contrapartida —cuántas elaboraciones mueren y con cuántas se queda la cena— y se emiten
  //    los huecos de dato que la política destapa, que son cola de altas.
  const pol = datos.politica_hogar;
  if (pol) {
    const principalesCena = new Set();
    for (const s of activos) if (s.servicio === 'cena')
      for (const i of servible[s.slot]) principalesCena.add(pools.candidatos[i].elaboracion_id);
    const nComp = pol.fuera.length - pol.elaboraciones_fuera.length;
    huecos.push({ tipo: 'politica-hogar', alergenos: pol.alergenos,
      fuera: pol.elaboraciones_fuera.length, componentes_fuera: nComp,
      principales_cena: principalesCena.size,
      motivo: `sin ${pol.alergenos.join(' ni ')} en casa: mueren ${pol.elaboraciones_fuera.length} elaboraciones` +
        (nComp ? ` (y ${nComp} componente(s) que se llevan por delante a los suyos)` : '') +
        `, quedan ${principalesCena.size} principales de cena para esta mesa` });
    for (const h of pol.huecos) huecos.push(h);
  }
  if (huecosFuncion.size) huecos.push({ tipo: 'linea-sin-funcion', n: huecosFuncion.size,
    motivo: `${huecosFuncion.size} pares elaboración|alimento en conflicto sin `+
      `funcion declarada (D6 en curso): tratados como ESTRUCTURALES, jamás auto-clasificados` });
  if (huecosSustituto.size) huecos.push({ tipo: 'sustituto-ausente', n: huecosSustituto.size,
    motivo: `${huecosSustituto.size} pares con vía de variante/vehículo sin fila en sustitutos: caen a estructural (cola de altas D6)` });
  if (huecosNoApto.size) huecos.push({ tipo: 'sustituto-no-apto', n: huecosNoApto.size,
    motivo: `${huecosNoApto.size} pares con fila en sustitutos pero ninguna comible/válida para el miembro en conflicto: caen a estructural` });

  // ── aporte fraccional TÍPICO por cubo × tramo (mediana y máximo sobre los candidatos del
  //    cubo: raciones del dominante/eje por servicio). Es el puente reserva-entera↔banda-
  //    fraccional: T1 presupuesta con la mediana y poda con el máximo — cazado en vivo con
  //    mesa-1 (3 slots de huevo × 2,07 raciones reventaban el techo 4; la reserva real es 1).
  //    (Cálculo del dominante duplicado de pools/t2 con matices — TODO consolidar helper común.)
  // POR MIEMBRO (no por tramo genérico): sus gramos de línea (niño/adulto) y su ración de
  // referencia POR EDAD (D1-bis). Un niño de 4 y uno de 10 no comparten vara.
  const ANIMAL = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);
  function aporteDominante(eid, opcion, mid) {
    const edad = edades[mid];
    const esNino = edad < config.EDAD_RACION_ADULTO;
    let mejorAnimal = null, mejorProt = null;
    const rec = (padre, escala, visto) => {
      if (visto.has(padre)) return;
      visto.add(padre);
      for (const l of lineasDe[padre] || []) {
        if (l.componente_id) { rec(l.componente_id, escala * ((esNino ? l.escala_nino : l.escala_adulto) || 1), visto); continue; }
        if (l.papel === 'condimento') continue;
        const aid = Array.isArray(l.alternativas) ? opcion : l.alimento_id;
        const a = alim[aid];
        if (!a) continue;
        const g = ((esNino ? l.gramos_nino : l.gramos_adulto) || 0) * escala;
        if (ANIMAL.has(a.naturaleza) && (!mejorAnimal || g > mejorAnimal.g)) mejorAnimal = { id: aid, g };
        const f = cat[aid];
        if (f && cubosDe(f.categoria).length && (!mejorProt || g > mejorProt.g)) mejorProt = { id: aid, g };
      }
    };
    rec(eid, 1, new Set());
    const dom = mejorAnimal || mejorProt;
    if (!dom) return null;
    const fila = cat[dom.id];
    const rac = racionParaLinea(datos, fila, edad);
    if (rac.hueco) return { hueco: rac.hueco, categoria: fila ? fila.categoria : null };
    let g = dom.g;
    if (fila.categoria === 'legumbre') g = g / (config.FACTOR_LEGUMBRE_SECO_COCIDO || 2.5);
    return { categoria: fila.categoria, raciones: g / rac.g };
  }
  const porCuboMiembro = {}, sinRacionPorEdad = {}, sinRacionD1 = new Set();
  for (const c of pools.candidatos) {
    for (const mid of mids) {
      const ap = aporteDominante(c.elaboracion_id, c.opcion, mid);
      if (!ap) continue;
      if (ap.hueco) {
        if (ap.hueco === 'menor-3' && ap.categoria)   // la literatura no publica gramaje <3 años
          (sinRacionPorEdad[mid] = sinRacionPorEdad[mid] || new Set()).add(ap.categoria);
        else if (ap.categoria) sinRacionD1.add(ap.categoria);   // alimento sin ración en D1
        continue;
      }
      for (const cubo of cubosDe(ap.categoria).filter(x => config.CUOTAS[x]))
        ((porCuboMiembro[cubo] = porCuboMiembro[cubo] || {})[mid] = porCuboMiembro[cubo][mid] || []).push(ap.raciones);
    }
  }
  const aporteCubo = { mediana: {}, max: {}, min: {} };
  for (const [cubo, porMid] of Object.entries(porCuboMiembro)) {
    aporteCubo.mediana[cubo] = {}; aporteCubo.max[cubo] = {}; aporteCubo.min[cubo] = {};
    for (const [mid, vals] of Object.entries(porMid)) {
      vals.sort((a, b) => a - b);
      aporteCubo.mediana[cubo][mid] = vals[Math.floor(vals.length / 2)];
      aporteCubo.max[cubo][mid] = vals[vals.length - 1];
      aporteCubo.min[cubo][mid] = vals[0];            // proyección de techos de T2: lo MENOS
    }                                                 // que un slot del cubo puede consumir
  }
  if (sinRacionD1.size) huecos.push({ tipo: 'sin-racion-en-d1', categorias: [...sinRacionD1].sort(),
    motivo: `${sinRacionD1.size} categoría(s) con candidatos cuyo alimento dominante no tiene ración de referencia en D1 (tofu, hummus, heura…): sus cuotas no son medibles — cola de altas` });
  for (const [mid, cats] of Object.entries(sinRacionPorEdad))
    huecos.push({ tipo: 'sin-racion-por-edad', miembro: mid, edad: edades[mid],
      categorias: [...cats].sort(),
      motivo: `ninguna fuente publica ración para ${edades[mid]} años (<3): las cuotas de ${mid} no son medibles y NO se extrapolan` });

  // ── PROFUNDIDAD por clave (spec §7 «pool ≥ slots que comparten ventana»): nº de
  //    elaboraciones DISTINTAS servibles de cada categoría|servicio|esfuerzo — T1 no puede
  //    reservar más slots de una clave que elaboraciones tiene (M2 veta repetir la misma a <4
  //    servicios; cazado en vivo: dos cenas sin-cuota/rapido con UNA sola elaboración =
  //    semana imposible). Conservador: el multi-opción de una elaboración no suma profundidad.
  const elabsPorClave = {}, ligerasPorClave = {};
  pools.candidatos.forEach((c, i) => {
    if (c.temporada != null && c.temporada !== estacion) return;
    const sirveAAlguien = Object.values(servible).some(set => set.has(i));
    if (!sirveAAlguien) return;
    for (const sv of c.apta) {
      const k = `${c.categoria}|${sv}|${c.esfuerzo}`;
      (elabsPorClave[k] = elabsPorClave[k] || new Set()).add(c.elaboracion_id);
      if (!esPesada(c.elaboracion_id))
        (ligerasPorClave[k] = ligerasPorClave[k] || new Set()).add(c.elaboracion_id);
    }
  });
  const profundidadClave = Object.fromEntries(Object.entries(elabsPorClave).map(([k, s]) => [k, s.size]));

  // CLAVES BLOQUEADAS POR MEMORIA (cazado con la familia `curso-escolar`, el caso normal del
  // producto): una clave de profundidad 1 cuya ÚNICA elaboración está dentro de la ventana dura
  // M1/M2 no es reservable esta semana — T2 no tendría con qué rellenarla y la semana moriría
  // en el relleno en vez de saberse antes. El pre-vuelo es donde esto se sabe (spec §7).
  const clavesBloqueadas = new Set();
  const clavesProfundidad1 = [];
  if (memoria) {
    for (const [clave, elabs] of Object.entries(elabsPorClave)) {
      if (elabs.size !== 1) continue;
      const eid = [...elabs][0];
      clavesProfundidad1.push({ clave, elaboracion: eid });
      const m2 = (memoria.mesa.M2 || {})[eid];
      const bloqueadaM2 = m2 != null && m2.servicios < (config.VENTANAS.M2_servicios || 4);
      // M1 mira el PERCIBIDO, que puede tener nombre propio («Seitán a la plancha»): comparar
      // por prefijo del id fallaba justo en esos casos. Se calculan los percibidos REALES de la
      // elaboración (nombre_por_opcion) y la clave se bloquea si TODOS están en ventana — si
      // alguna opción está libre, la clave sigue siendo reservable.
      const e = (datos.elaboraciones || []).find(x => x.id === eid) || {};
      const opsClave = [...new Set(pools.candidatos.filter(c => c.elaboracion_id === eid).map(c => c.opcion))];
      const percibidos = opsClave.map(op => op == null ? eid : ((e.nombre_por_opcion || {})[op] || `${eid}×${op}`));
      const enVentana = per => {
        const reg = (memoria.mesa.M1 || {})[per];
        return reg != null && reg.dias < (config.VENTANAS.plato_dias || 7);
      };
      const bloqueadaM1 = percibidos.length > 0 && percibidos.every(enVentana);
      if (bloqueadaM2 || bloqueadaM1) clavesBloqueadas.add(clave);
    }
  }
  // presupuesto M6 del esqueleto: cada slot de una clave POR ENCIMA de sus elaboraciones
  // ligeras exigirá un frito en T2 (cazado con mesa-6: dos huevo/rapido con una sola ligera)
  const profundidadLigera = Object.fromEntries(Object.keys(elabsPorClave)
    .map(k => [k, (ligerasPorClave[k] || new Set()).size]));

  return { fijosOK, opcionesLegales, resolucion, servible, dispPorSlot, exclusiones,
    puedeCubo, bandasEfectivas, aporteCubo, profundidadClave, profundidadLigera,
    clavesBloqueadas, clavesProfundidad1, descargos, huecos };
}

module.exports = { prevuelo, NO_VEGETARIANO, NO_VEGANO, VIA_POR_FUNCION };

  };

  /* ---- motor_v6/src/raciones.js ---- */
  REG['raciones'] = function (module, exports, require) {
// RACIÓN DE REFERENCIA por (categoría × EDAD) — la vara única de raciones fraccionales.
// Resuelve D1 (`categorias_aesan`, ración ADULTA) y D1-bis (`raciones_infantiles`, 4 tramos
// 3-6/7-12/13-15/16-18, AESAN-DC10-2010) en una sola función que consumen la batería A, el
// prevuelo y el relleno — si vara y motor midieran distinto, el careo no significaría nada.
//
// REGLAS DECLARADAS (dictado 2-ago + avisos de la tanda D1-bis):
//  · < 3 años: NINGUNA fuente publica gramaje ⇒ HUECO (`hueco: 'menor-3'`). Jamás se extrapola
//    el tramo 3-6: un niño de 2 años no es uno de 3 con menos apetito.
//  · 3-18: manda la fila infantil de su tramo. La ración es la del PLATO PRINCIPAL (el papel de
//    guarnición ya lo captura la división por gramos servidos).
//  · ≥ 19: ración adulta de D1.
//  · Categoría sin fila infantil (lácteo, frutos secos, aceite, cereal, tubérculo): cae a la
//    ADULTA y se declara (`fallback: 'adulta'`) — ninguna de ellas tiene cuota hoy, así que no
//    contamina A; si alguna la tuviera, el fallback sería visible en el informe.
//  · La base (seco/crudo) viaja con la fila: la legumbre infantil es seco igual que la adulta,
//    así que `FACTOR_LEGUMBRE_SECO_COCIDO` se aplica igual y ANTES de dividir.
//  · El huevo no escala con la edad (la ración es la unidad, 58 g en los 4 tramos).
'use strict';

// 3 años = donde arranca AESAN-DC10 Y **la edad mínima del producto** (dictado Roger 2-ago,
// spec §8-D1-bis): por debajo no hay gramaje publicado y un miembro así está fuera del alcance,
// no es un caso a resolver.
const EDAD_TABLA_INFANTIL_MIN = 3;
const EDAD_ADULTO = 19;                               // ≥ 19: ración adulta de D1

// Devuelve { g, base, fuente, tramo, fallback } · o { hueco: 'menor-3' | 'sin-racion' }
function racionRef(datos, categoria, edad) {
  const adulta = (datos.categorias_aesan || []).find(f => f.categoria === categoria && f.racion_ref_g != null);
  const gAdulta = adulta ? adulta.racion_ref_g : null;
  if (edad == null || edad >= EDAD_ADULTO)
    return gAdulta == null ? { hueco: 'sin-racion' }
      : { g: gAdulta, base: adulta.base || null, fuente: adulta.fuente_id, tramo: 'adulto' };
  if (edad < EDAD_TABLA_INFANTIL_MIN) return { hueco: 'menor-3' };
  const fila = (datos.raciones_infantiles || []).find(f => f.categoria === categoria
    && edad >= f.edad_min && edad <= f.edad_max);
  if (fila) return { g: fila.racion_ref_g, base: fila.base, fuente: fila.fuente_id,
    tramo: `${fila.edad_min}-${fila.edad_max}` };
  if (gAdulta == null) return { hueco: 'sin-racion' };
  return { g: gAdulta, base: adulta.base || null, fuente: adulta.fuente_id,
    tramo: 'adulto', fallback: 'adulta' };
}

// La ración adulta se resuelve por ALIMENTO en D1 (cada alimento trae la suya); la infantil, por
// CATEGORÍA. Este helper acepta la fila de D1 ya localizada y solo la sustituye si el comensal
// es menor — así el llamador no pierde el dato por-alimento de los adultos.
function racionParaLinea(datos, filaD1, edad) {
  if (!filaD1) return { hueco: 'sin-racion' };
  if (edad == null || edad >= EDAD_ADULTO)
    return filaD1.racion_ref_g == null ? { hueco: 'sin-racion' }
      : { g: filaD1.racion_ref_g, base: filaD1.base || null, fuente: filaD1.fuente_id, tramo: 'adulto' };
  if (edad < EDAD_TABLA_INFANTIL_MIN) return { hueco: 'menor-3' };
  const fila = (datos.raciones_infantiles || []).find(f => f.categoria === filaD1.categoria
    && edad >= f.edad_min && edad <= f.edad_max);
  if (fila) return { g: fila.racion_ref_g, base: fila.base, fuente: fila.fuente_id,
    tramo: `${fila.edad_min}-${fila.edad_max}` };
  if (filaD1.racion_ref_g == null) return { hueco: 'sin-racion' };
  return { g: filaD1.racion_ref_g, base: filaD1.base || null, fuente: filaD1.fuente_id,
    tramo: 'adulto', fallback: 'adulta' };
}

module.exports = { racionRef, racionParaLinea, EDAD_TABLA_INFANTIL_MIN, EDAD_ADULTO };

  };

  /* ---- motor_v6/src/seguridad_infantil.js ---- */
  REG['seguridad_infantil'] = function (module, exports, require) {
// D2 · SEGURIDAD INFANTIL — la parte que el motor no estaba aplicando.
//
// La tabla `datos/seguridad_infantil.js` tiene 25 filas y TRES clases que no se resuelven igual.
// El prevuelo solo sabía tratar la primera y descartaba las otras dos con un `continue`
// (`prevuelo.js:53-58`), así que 20 de 25 reglas estaban cargadas con disciplina y con efecto
// CERO en el producto (auditoría ciega 2-ago: «5 de 25 efectivas · 0 de 16 de atragantamiento»).
//
//  1. PROHIBICIÓN PURA (5 filas: miel<2 · azúcar<2 · arroz-integral<3 · atún<10 ·
//     atún-conserva<10). Ya funcionaba: el prevuelo saca el alimento del universo de ese menor.
//
//  2. ATRAGANTAMIENTO (16 filas) — LO QUE RESUELVE ESTE FICHERO. El alimento NO está prohibido:
//     lo está la FORMA de servirlo. «uva entera», «cereza con hueso», «zanahoria cruda en trozos
//     grandes», «salchicha en rodajas». Prohibir el alimento sería leer mal la fuente y vaciaría
//     el banco —manzana, zanahoria y tomate están en 49 líneas—; y no es lo que dice AESAN.
//     Se resuelve con una NOTA EN LA CARD dirigida a quien cocina, nunca tocando el menú.
//     La nota cita `condicion` VERBATIM del banco: es dato con fuente, no redacción inventada.
//
//  3. LÍMITE POR CANTIDAD (4 filas: espinacas y acelgas <3 a 45 g/día · atún y atún-conserva
//     <14 a 4 g/día). NO se resuelve aquí y se declara por qué:
//       · espinacas/acelgas <3 años son INERTES por construcción — la edad mínima del producto
//         es 3 (dictado Roger 2-ago), así que ningún miembro gobernado entra en ese tramo.
//       · el atún 10-14 es 120 g/MES (la fila lo expresa como 4 g/día para una ventana móvil de
//         30 días, y su `nota` lo dice). NO es una prohibición: permite ~1-2 servicios al mes.
//         Derivarlo a «prohibido» sería más restrictivo que la fuente, y derivarlo a «libre»,
//         menos. Exige un contador de 30 días sobre el diario D3 — pendiente, con dueño.
'use strict';

// alimento → filas de forma insegura (las de `condicion`), indexadas una sola vez
function indiceDeFormas(datos) {
  const idx = {};
  for (const f of datos.seguridad_infantil || []) {
    if (f.condicion == null) continue;
    (idx[f.alimento_id] = idx[f.alimento_id] || []).push(f);
  }
  return idx;
}

// EL RIESGO ES DE LA LÍNEA, NO DEL ALIMENTO. Primer intento: 307 avisos, de los que 144 eran
// `tomate` — y el riesgo de la fila es «cherry ENTERO», no el tomate del sofrito. Un aviso de
// atragantamiento que salta en cada guiso no es una red de seguridad, es ruido que entrena a
// ignorar avisos (el mismo pecado que `rangos_categoria` disparando en el 50% de las filas).
// Las cuatro condiciones ruidosas son riesgos de pieza CRUDA («cruda en trozos grandes»,
// «cherry entero», «entero»), así que el filtro sale del propio banco: solo avisa la línea
// servida en crudo. Tomate salteado o guisado y zanahoria hervida dejan de avisar; la manzana
// cruda, la nuez y la aceituna siguen avisando. Derivado del dato, no de una opinión.
const ES_CRUDO = t => t == null || t === 'crudo';

// líneas de una elaboración resueltas para ESTE miembro: fijas (recursivo por componentes) + la
// opción de eje que le tocó. Devuelve pares alimento×técnica — la técnica decide si hay riesgo.
function lineasServidas(lineasPorPadre, eid, opcionesEje, out = [], visto = new Set()) {
  if (visto.has(eid)) return out;
  visto.add(eid);
  for (const l of lineasPorPadre[eid] || []) {
    if (l.componente_id) { lineasServidas(lineasPorPadre, l.componente_id, opcionesEje, out, visto); continue; }
    if (Array.isArray(l.alternativas)) {
      for (const op of opcionesEje || []) if (l.alternativas.includes(op)) out.push({ alimento_id: op, tecnica_id: l.tecnica_id });
      continue;
    }
    if (l.alimento_id) out.push({ alimento_id: l.alimento_id, tecnica_id: l.tecnica_id });
  }
  return out;
}

// notas de forma insegura para un servicio ya montado. Una por (miembro presente × alimento):
// el mismo alimento en dos piezas del plato no repite nota.
function notasDeServicio(sv, presentes, edades, datos, lineasPorPadre, formas) {
  const notas = [];
  if (!sv.plato || !sv.plato.length) return notas;
  for (const mid of presentes) {
    const edad = edades[mid];
    if (edad == null) continue;
    // el sustituto de plato de este miembro manda sobre el plato de mesa: come otra cosa
    const suSustituto = (sv.notas || []).find(n => n.tipo === 'sustituto' && n.miembro === mid && n.ambito === 'plato');
    const piezas = suSustituto ? (suSustituto.plato || []) : sv.plato;
    const quitados = new Set((sv.notas || [])
      .filter(n => (n.tipo === 'eliminar' && n.miembro === mid) || n.tipo === 'variante-todos'
        || (n.tipo === 'vehiculo-persona' && n.miembro === mid))
      .map(n => n.alimento_id));
    const vistos = new Set();
    for (const p of piezas) {
      const suya = (p.opciones_eje || {})[mid];
      const opciones = suya ? [suya] : Object.values(p.opciones_eje || {});
      for (const l of lineasServidas(lineasPorPadre, p.elaboracion_id, opciones)) {
        const aid = l.alimento_id;
        if (quitados.has(aid) || vistos.has(aid) || !ES_CRUDO(l.tecnica_id)) continue;
        for (const f of formas[aid] || []) {
          if (edad >= f.edad_max_anos) continue;
          vistos.add(aid);
          notas.push({ tipo: 'seguridad-infantil', miembro: mid, alimento_id: aid,
            forma_insegura: f.condicion, edad_max_anos: f.edad_max_anos, riesgo: f.riesgo || 'atragantamiento' });
        }
      }
    }
  }
  return notas;
}

// recorre la semana ya montada y le añade las notas. Muta `semana` a propósito: es el mismo
// patrón con el que T3 le engancha fracciones y descargos en `generar.js`.
function anotarSemana(semana, familia, edades, datos) {
  const formas = indiceDeFormas(datos);
  if (!Object.keys(formas).length) return semana;
  const lineasPorPadre = {};
  for (const l of datos.lineas) (lineasPorPadre[l.padre] = lineasPorPadre[l.padre] || []).push(l);
  for (const sv of semana.servicios) {
    if (!sv.plato) continue;
    const presentes = familia.miembros
      .filter(m => semana.presencia[m.id] && semana.presencia[m.id][`${sv.dia}-${sv.servicio}`] === true)
      .map(m => m.id);
    const nuevas = notasDeServicio(sv, presentes, edades, datos, lineasPorPadre, formas);
    if (nuevas.length) sv.notas = (sv.notas || []).concat(nuevas);
  }
  return semana;
}

module.exports = { anotarSemana, notasDeServicio, indiceDeFormas };

  };

  /* ---- motor_v6/src/serializar.js ---- */
  REG['serializar'] = function (module, exports, require) {
// SERIALIZADOR · salida del motor V6 → corrida `e3f-menu-neutro/2` (contrato:
// harness/FORMATO_MENU_NEUTRO.md §9 — la CARD de la doctrina §2-bis: plato de mesa + notas
// tipadas por persona/olla). Es FORMATO puro: no decide nada — ordena, completa la cabecera y
// VALIDA la forma. Importa el canónico y los hashes del banco de harness/herramientas: son el
// CONTRATO compartido motor↔harness (la definición ejecutable del formato), no la vara del
// juez — duplicarlos aquí crearía dos canónicos que divergen.
//
// ANTI-FUGA (compromiso de diseño con la QA, registrado en su acta): el estado de trabajo del
// solver (contadores, señales, memoria viva) JAMÁS viaja en la corrida. Whitelist ESTRICTA de
// claves por nivel — una clave fuera de contrato no se filtra en silencio: REVIENTA, porque un
// campo extraño en la salida es un bug del generador, no una opción.
//
// CAPACIDADES de V6 (T2 + T3): las seis a `true`. Las fracciones las emite T3 (spec §1-T3) y
// el validador las exige en (0,4] por miembro presente.
'use strict';
const { hashGeneracion, hashCompleto } = require('./hash_banco.js');

const CAPACIDADES = {
  opciones_por_persona: true,
  fracciones: true,                     // T3 (2-ago): fracción por comensal, escalones 0,5-1,5
  relajaciones_declaradas: true,
  anclas: true,
  postres: true,
  notas_tipadas: true                   // /2: la card (§9 del formato)
};

const CLAVES = {
  servicio: ['dia', 'servicio', 'plato', 'postre', 'fracciones', 'ajustes_linea', 'relajaciones', 'descargos', 'notas', 'no_servido'],
  plato_item: ['elaboracion_id', 'opciones_eje'],
  relajacion: ['peldano', 'detalle', 'frase'],
  descargo: ['tipo', 'miembro', 'detalle'],
  semana: ['semana_iso', 'presencia', 'servicios', 'fallo']
};

// tipos CERRADOS de nota (/2 §9.2) — whitelist de campos por tipo, mismo anti-fuga que arriba
const CLAVES_NOTA = {
  eliminar: ['tipo', 'miembro', 'elaboracion_id', 'alimento_id'],
  'variante-todos': ['tipo', 'elaboracion_id', 'alimento_id', 'sustituto_id'],
  'vehiculo-persona': ['tipo', 'miembro', 'elaboracion_id', 'alimento_id', 'sustituto_id'],
  // D2 · forma insegura para un menor: el alimento se sirve, la FORMA se avisa (nunca prohíbe)
  'seguridad-infantil': ['tipo', 'miembro', 'alimento_id', 'forma_insegura', 'edad_max_anos', 'riesgo'],
  'solo-para': ['tipo', 'miembros', 'elaboracion_id'],
  sustituto: ['tipo', 'miembro', 'ambito', 'plato', 'postre']
};

function exigirClaves(obj, permitidas, donde) {
  const extra = Object.keys(obj).filter(k => !permitidas.includes(k));
  if (extra.length) throw new Error(`clave fuera de contrato en ${donde}: ${extra.join(', ')} — el estado del solver no viaja`);
}

const ORDEN_SLOTS = [];
for (let d = 1; d <= 7; d++) for (const s of ['comida', 'cena']) ORDEN_SLOTS.push(`${d}-${s}`);

// una semana del motor → semana del formato (orden fijo, forma validada)
function serializarSemana(sem, familia) {
  exigirClaves(sem, CLAVES.semana, `semana ${sem.semana_iso}`);
  if (!/^\d{4}-W\d{2}$/.test(sem.semana_iso)) throw new Error(`semana_iso inválida: ${sem.semana_iso}`);
  for (const m of familia.miembros) {
    const p = sem.presencia[m.id];
    if (!p || ORDEN_SLOTS.some(s => typeof p[s] !== 'boolean'))
      throw new Error(`presencia incompleta de ${m.id} en ${sem.semana_iso}: los 14 slots son explícitos`);
  }
  const porSlot = {};
  for (const sv of sem.servicios) {
    exigirClaves(sv, CLAVES.servicio, `servicio ${sv.dia}-${sv.servicio}`);
    porSlot[`${sv.dia}-${sv.servicio}`] = sv;
  }
  const servicios = ORDEN_SLOTS.map(slot => {
    const sv = porSlot[slot];
    if (!sv) throw new Error(`falta el servicio ${slot} en ${sem.semana_iso}: los 14 van SIEMPRE, no_servido incluido`);
    if (sv.fracciones != null) for (const [mid, f] of Object.entries(sv.fracciones))
      if (!(f > 0 && f <= 4)) throw new Error(`fracción fuera de (0,4] en ${slot}: ${mid}=${f}`);
    for (const p of sv.plato || []) exigirClaves(p, CLAVES.plato_item, `plato de ${slot}`);
    if (sv.postre) exigirClaves(sv.postre, CLAVES.plato_item, `postre de ${slot}`);
    for (const r of sv.relajaciones || []) exigirClaves(r, CLAVES.relajacion, `relajación de ${slot}`);
    for (const d of sv.descargos || []) exigirClaves(d, CLAVES.descargo, `descargo de ${slot}`);
    for (const n of sv.notas || []) {
      const claves = CLAVES_NOTA[n.tipo];
      if (!claves) throw new Error(`nota de tipo desconocido en ${slot}: ${n.tipo}`);
      exigirClaves(n, claves, `nota ${n.tipo} de ${slot}`);
      // el comodín de HOGAR (§13.1.3): solo la eliminación puede decir «para nadie». Una nota
      // individual con `*` sería una restricción de una persona aplicada a la mesa entera.
      if (n.miembro === '*' && n.tipo !== 'eliminar')
        throw new Error(`nota ${n.tipo} con miembro '*' en ${slot}: el comodín es solo de la eliminación de hogar (§13)`);
      if (n.tipo === 'sustituto') {
        if (n.ambito !== 'plato' && n.ambito !== 'postre') throw new Error(`sustituto con ámbito inválido en ${slot}: ${n.ambito}`);
        if (n.ambito === 'plato' && !Array.isArray(n.plato)) throw new Error(`sustituto de plato sin plato[] en ${slot}`);
        if (n.ambito === 'postre' && !n.postre) throw new Error(`sustituto de postre sin postre en ${slot}`);
        for (const p of n.plato || []) exigirClaves(p, CLAVES.plato_item, `plato del sustituto de ${slot}`);
        if (n.postre) exigirClaves(n.postre, CLAVES.plato_item, `postre del sustituto de ${slot}`);
      }
    }
    if (sv.plato == null && !sv.no_servido && !sem.fallo)
      throw new Error(`plato null sin motivo en ${slot}: no_servido o fallo de semana, siempre`);
    for (const a of sv.ajustes_linea || []) {
      const claves = ['miembro', 'elaboracion_id', 'alimento_id', 'gramos'];
      const extra = Object.keys(a).filter(k => !claves.includes(k));
      if (extra.length) throw new Error(`ajuste_linea con campo fuera de contrato en ${slot}: ${extra.join(', ')}`);
      if (!(a.gramos > 0)) throw new Error(`ajuste_linea con gramos inválidos en ${slot}: ${a.gramos}`);
    }
    return {
      dia: sv.dia, servicio: sv.servicio,
      plato: sv.plato || null,
      postre: sv.postre || null,
      fracciones: sv.fracciones || null,
      ajustes_linea: sv.ajustes_linea || [],
      relajaciones: sv.relajaciones || [],
      descargos: sv.descargos || [],
      notas: sv.notas || [],
      no_servido: sv.no_servido || null
    };
  });
  return { semana_iso: sem.semana_iso, presencia: sem.presencia, servicios, fallo: sem.fallo || null };
}

// salida del motor (familia + semanas) → corrida completa lista para el harness
function serializarCorrida({ familia, semanas, version, datos }) {
  if (!familia || !Array.isArray(semanas) || !semanas.length) throw new Error('corrida sin familia o sin semanas');
  return {
    formato: 'e3f-menu-neutro/2',
    generador: {
      nombre: 'v6',
      version: version || 'v6-t2',
      banco: hashCompleto(datos),
      banco_generacion: hashGeneracion(datos),
      capacidades: { ...CAPACIDADES }
    },
    familia,
    semanas: semanas.map(s => serializarSemana(s, familia))
  };
}

module.exports = { serializarCorrida, serializarSemana, CAPACIDADES };

  };

  /* ---- motor_v6/src/superficie.js ---- */
  REG['superficie'] = function (module, exports, require) {
// SUPERFICIE DE PRODUCTO · las funciones de la app sobre la forma de V6 (spec §15).
//
// QUÉ ES. V6 exponía UNA función: `generarCorrida`. Esto es el resto de la superficie —lo que
// la app enseña y toca— como funciones PURAS de (semana `/2` + banco + diario): deterministas,
// sin DOM, sin reloj, sin red, testeables en node y empaquetadas junto al motor. Prohibido el
// adaptador que traduzca la forma de V6 a la de v5 (dictado 3-ago: «cero rastro de v5»).
//
// LAS DOS REGLAS QUE GOBIERNAN ESTE FICHERO:
//  1. **UN SOLO DERIVADOR.** Toda cantidad que ve el usuario —lista de compra, cantidad de
//     receta, kcal por comensal— sale de `src/derivar.js`, el mismo que usan T3, la ficha y el
//     juez. Aquí no se multiplica ni un gramo a mano. Dos implementaciones de la misma medida es
//     el patrón de bug nº1 del proyecto.
//  2. **LA POLÍTICA DE HOGAR SE HEREDA, NO SE RE-COMPRUEBA** (§13). El banco efectivo se compone
//     una vez con `banco_hogar.js` y de ahí en adelante el alérgeno severo NO EXISTE: catálogo,
//     nevera, descubrir y compra ven ese banco y nadie vuelve a mirar la alergia severa.
//
// POR QUÉ UNA FÁBRICA Y NO 11 FUNCIONES SUELTAS. Las 11 comparten (familia normalizada + banco
// del hogar + pools + prevuelo). El prevuelo es lo caro —resuelve miembro × elaboración— y la
// app lo pide en cada render de Recetas, Descubrir y Nevera. La fábrica lo calcula PEREZOSAMENTE
// y una sola vez; las funciones que devuelve tienen la firma exacta de §15.
'use strict';
const { normalizarFamilia } = require('./contrato_familia.js');
const { bancoDelHogar, anotarHogar } = require('./banco_hogar.js');
const { compilarPools } = require('./pools.js');
const { prevuelo } = require('./prevuelo.js');
const { SLOTS } = require('./t1_esqueleto.js');
const { rellenarSemana } = require('./t2_relleno.js');
const { fraccionarSemana } = require('./t3_fracciones.js');
const { auditar } = require('./t4_auditoria.js');
const { notasDeServicio, indiceDeFormas } = require('./seguridad_infantil.js');
const { memoria } = require('./memoria.js');
const { objetivoDiario } = require('./energia.js');
const { derivarCorrida, edadEnSemana, estacionDeSemana, fechaDia } = require('./derivar.js');

const ORDEN_SLOTS = SLOTS.map(s => s.slot);

// ── redondeo de CANTIDAD PARA COMPRAR (mecánica v5 conservada, dictada por Roger 2026-07-21):
//    <10 g al gramo · 10-99 g a múltiplos de 5 · ≥100 g a múltiplos de 10. Se aplica UNA vez y
//    sobre el TOTAL agregado (§15.2): redondear por línea y sumar después infla la lista.
function redondearCompra(g) {
  const n = Math.round(g || 0);
  if (n <= 0) return 0;
  if (n < 10) return n;
  if (n < 100) return Math.round(n / 5) * 5;
  return Math.round(n / 10) * 10;
}

// grasa y condimento se asumen EN CASA (supuesto declarado de §15.6, conservado de v5): ni la
// nevera los pregunta ni la lista de la compra los pone como cantidad a comprar. Siguen
// derivándose y viajando con su `naturaleza` — quien pinta decide si los enseña como recordatorio.
const NATURALEZA_DESPENSA = new Set(['grasa', 'condimento']);

// ── CATEGORÍAS DE DESCUBRIR (§15.5: «mecánica v5 conservada» — temporada primero, fijas
//    delante, rotación determinista por día, sin RNG). Lo que cambia es de dónde sale el test:
//    v5 leía un campo `tematica` que V6 no tiene, así que cada categoría se define sobre datos
//    REALES del banco (`perfil_servicio.estilo`, `esfuerzo`, `temporada`) — jamás un dato nuevo
//    inventado para que la pantalla tenga contenido.
const CATEGORIAS_DESCUBRIR = [
  { id: 'ensaladas', kicker: 'Frescas', titulo: 'Ensaladas frescas para el calor',
    test: e => estiloDe(e) === 'ensalada' },
  { id: 'rapidas', kicker: 'En poco tiempo', titulo: 'Ideas para cuando no hay tiempo',
    test: e => e.esfuerzo === 'rapido', orden: (a, b) => (a.tiempo_min || 0) - (b.tiempo_min || 0) },
  { id: 'guisos', kicker: 'Cuchara', titulo: 'Guisos y potajes de cuchara',
    test: e => estiloDe(e) === 'guiso' },
  { id: 'arroces', kicker: 'Arroces', titulo: 'De la paella al arroz caldoso',
    test: e => estiloDe(e) === 'arroz' },
  { id: 'horno', kicker: 'Al horno', titulo: 'Se hace solo mientras haces otra cosa',
    test: e => estiloDe(e) === 'horno' },
  { id: 'calma', kicker: 'Con calma', titulo: 'Para cocinar sin prisa el fin de semana',
    test: e => e.esfuerzo === 'elaborado' }
];
// fijas delante y en este orden mientras tengan candidatas (criterio de Roger 2026-07-22,
// conservado); el resto rota por día detrás.
const FIJAS_DESCUBRIR = ['ensaladas', 'rapidas', 'guisos'];
const estiloDe = e => (e.perfil_servicio || {}).estilo;

// frase humana de un desvío. El HUECO SEMÁNTICO viene del motor (`tipo` + `detalle`); la frase
// es capa de copy y vive aquí, en UN solo sitio, nunca en el banco (§15.7).
const FRASE_DESVIO = {
  'suelo-proteico': 'Ese día la proteína se queda algo corta de lo que tocaría.',
  'energia-fuera-de-banda': 'Ese día la ración queda un poco fuera de lo justo.',
  'minimo-no-cubierto': 'Esta semana os quedáis cortos de algún grupo de alimentos.',
  'techo-fraccional-vs-reserva': 'Hemos tenido que ajustar las cantidades para que cuadre.',
  'cupo-novedad-excedido': 'Es un plato nuevo para los peques y ya había otro esta semana.',
  'postre-inviable': 'Ese día alguien se queda sin postre de la mesa.',
  'ancla-vs-techo': 'Mandas tú: servimos lo que has pedido aunque se pase de lo recomendado.',
  'divergencia-de-reserva': 'Alguien come una variante distinta a la prevista para ese día.',
  'eje-fruta-verdura-corto': 'Ese plato se queda corto de verdura para alguien.',
  'techo-salud-superado': 'Esta semana se pasa de lo recomendado en un grupo de salud.',
  'M1-sin-declarar': 'Un plato se repite más cerca de lo habitual.',
  'M2-sin-declarar': 'Una receta vuelve antes de lo habitual.',
  'sin-alternativa': 'No hemos encontrado otro plato que encaje en esa mesa.',
  'cambio-de-tipo': 'Te proponemos otro tipo de plato: no quedaba ninguno más de esa clase.',
  'variedad-cedida': 'Ese plato se repite más cerca de lo que solemos dejar.',
  'eje-abierto': 'Ese día el plato se queda sin acompañamiento de alguno de los tres grupos.',
  'alergia': 'OJO: ese plato lleva un alérgeno de alguien que se sienta a la mesa.',
  'seguridad-infantil': 'OJO: ese plato tiene una forma de riesgo para un menor de la mesa.'
};
const frasearDesvio = (tipo, detalle) => FRASE_DESVIO[tipo] || detalle || tipo;

// El mismo desvío no se cuenta igual según QUIÉN eligió el plato. «Mandas tú» solo vale cuando
// la familia ha elegido ESE plato (`asignar`); si solo rotó la guarnición o cambió quién se
// sienta, el plato es el que ya tenía y la frase honesta es otra. El HECHO no cambia —el techo
// se pasa igual y se declara igual—, cambia a quién se le atribuye.
const FRASE_SIN_ELECCION = {
  'ancla-vs-techo': 'Con ese plato la semana se pasa un poco de lo recomendado en un grupo.',
  'variedad-cedida': 'Ese plato ya se repetía dentro de la semana.',
  'minimo-no-cubierto': 'Esta semana os quedáis cortos de algún grupo de alimentos.'
};
const reatribuir = desvios => desvios.map(d => (FRASE_SIN_ELECCION[d.tipo]
  ? { ...d, frase: FRASE_SIN_ELECCION[d.tipo] } : d));

function crearSuperficie({ familia: familiaDeclarada, datos, config, semanaRef }) {
  if (!familiaDeclarada || !datos || !config) throw new Error('superficie: faltan familia, datos o config');
  const familia = normalizarFamilia(familiaDeclarada, datos).familia;
  // §13 en UN solo lugar: de aquí abajo, `banco` es el ÚNICO banco que la superficie conoce.
  const { datos: banco, politica } = bancoDelHogar(datos, familia);
  const semanaBase = semanaRef || null;

  // ── perezosos: la compra no paga el prevuelo y el catálogo no paga la derivación
  let _pools = null, _preBase = null, _formas = null;
  const pools = () => (_pools = _pools || compilarPools(banco));
  const formas = () => (_formas = _formas || indiceDeFormas(banco));
  const elabPorId = Object.fromEntries(banco.elaboraciones.map(e => [e.id, e]));
  const alimPorId = Object.fromEntries(banco.alimentos.map(a => [a.id, a]));
  const combPorId = Object.fromEntries((banco.combinaciones || []).map(c => [c.principal_id, c]));
  const lineasDe = {};
  for (const l of banco.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);

  const edadesEn = semanaIso => Object.fromEntries(
    familia.miembros.map(m => [m.id, edadEnSemana(m.nacimiento, semanaIso)]));

  // entrada del prevuelo a partir de una PRESENCIA dada (la de la semana servida, o todos
  // presentes para las vistas de catálogo, que no cuelgan de ningún día concreto)
  function entradaDe(semanaIso, presencia) {
    return { semana_iso: semanaIso, estacion: estacionDeSemana(semanaIso), presencia,
      edades: edadesEn(semanaIso), familia, memoria: null };
  }
  const presenciaLlena = () => Object.fromEntries(familia.miembros.map(m =>
    [m.id, Object.fromEntries(ORDEN_SLOTS.map(s => [s, true]))]));

  // prevuelo de CATÁLOGO: la casa entera sentada a la mesa, semana de referencia. Es el que
  // responde «¿esta receta sirve en esta casa?» sin colgar de ningún día.
  function preBase() {
    if (_preBase) return _preBase;
    if (!semanaBase) throw new Error('superficie: sin `semanaRef` no hay catálogo (la edad y la temporada dependen de la semana)');
    return (_preBase = prevuelo(entradaDe(semanaBase, presenciaLlena()), pools(), banco, config));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // §15.2 · LISTA DE COMPRA — y con ella la cantidad de receta y las kcal por comensal
  // ─────────────────────────────────────────────────────────────────────────────
  // TODO sale de `derivarCorrida`, el derivador ÚNICO del motor, que ya aplica en este orden:
  //   1. plato/postre de mesa, menos quien tiene nota `sustituto` (que suma SU plato)
  //   2. `solo-para` limita la elaboración a sus miembros
  //   3. `opciones_eje`: cada presente computa SU opción
  //   4. `variante-todos`: la línea computa con el sustituto para toda la olla
  //   5. `vehiculo-persona`: sustituto para ese miembro, original para el resto
  //   6. `eliminar`: la línea no computa para ese miembro (`'*'` = para nadie, §13)
  //   7. ración de su edad × su fracción, y `ajustes_linea` SUSTITUYE ese número, jamás suma
  // Aquí solo se AGREGA por alimento real y se redondea una vez. El menú del cole no compra:
  // ni aparece en `servicios` (el menor va con presencia `false`) ni tiene gramos declarados.
  const _cacheDer = new WeakMap();
  function derivacion(semana) {
    if (_cacheDer.has(semana)) return _cacheDer.get(semana);
    const corrida = { formato: 'e3f-menu-neutro/2', familia, semanas: [semana] };
    // `failFast: false`: una nota ilegal es un bug del generador y lo caza el juez — pero jamás
    // puede dejar a la familia sin lista de la compra el sábado por la mañana.
    const der = derivarCorrida(corrida, banco, config, { failFast: false })[0];
    _cacheDer.set(semana, der);
    return der;
  }

  // gramos que se COMPRAN de una línea derivada: los crudos. El banco declara muchas líneas en
  // base `cocido` (200 g de lentejas guisadas) y lo que entra en la cesta es el peso crudo que
  // las da (80 g secos) — el mismo `factor_agua` que usa el derivador para los macros.
  const gramosCompra = l => (l.gramos_crudos != null ? l.gramos_crudos : l.gramos_base);

  const enFiltro = (slot, filtro) => {
    if (!filtro) return true;
    if (filtro.slot && filtro.slot !== slot) return false;
    const [dia, servicio] = slot.split('-');
    if (filtro.dia != null && Number(filtro.dia) !== Number(dia)) return false;
    // `soloCena` (Roger 2026-07-22): pasadas las 16 h la compra de hoy ya no necesita el
    // mediodía. Presentacional: solo cambia qué se ACUMULA, jamás el plan ni una cantidad.
    if (filtro.soloCena && servicio !== 'cena') return false;
    return true;
  };

  // agregación cruda por alimento sobre los servicios que pasan el filtro
  function agregar(semana, filtro) {
    const der = derivacion(semana);
    const total = {}, porElaboracion = {}, comensales = [], huecos = [];
    for (const sv of der.servicios) {
      if (!sv.servido || !enFiltro(sv.slot, filtro)) continue;
      for (const [mid, m] of Object.entries(sv.por_miembro)) {
        comensales.push({ slot: sv.slot, miembro: mid, kcal: Math.round(m.kcal), fraccion: m.fraccion,
          es_nino: m.es_nino, edad: m.edad });
        for (const h of m.huecos) huecos.push({ slot: sv.slot, miembro: mid, ...h });
        for (const parte of m.partes) {
          for (const l of parte.lineas) {
            const g = gramosCompra(l);
            if (!(g > 0)) continue;
            total[l.alimento] = (total[l.alimento] || 0) + g;
            const pe = porElaboracion[parte.elaboracion_id] = porElaboracion[parte.elaboracion_id] || {};
            pe[l.alimento] = (pe[l.alimento] || 0) + g;
          }
        }
      }
    }
    return { total, porElaboracion, comensales, huecos };
  }

  const catPorId = Object.fromEntries((banco.categorias_aesan || []).map(f => [f.alimento_id, f]));
  const lineaCompra = (id, gramos) => {
    const a = alimPorId[id] || {};
    return { id, nombre: a.nombre || id, gramos: redondearCompra(gramos),
      naturaleza: a.naturaleza || null,
      // la categoría AESAN del alimento viaja porque es como se COMPRA (carnicería, pescadería,
      // frutería): agrupar por `naturaleza` metería la lenteja con la lechuga. Es dato del banco,
      // no una taxonomía inventada en la pantalla.
      categoria: (catPorId[id] || {}).categoria || a.naturaleza || null,
      // unidades sobre el total SIN redondear (huevo/yogur se compran por piezas): mínimo 1 si
      // hay gramos, para no enseñar «0 uds» por un redondeo hacia abajo
      unidades: a.unidad_g ? Math.max(1, Math.round(gramos / a.unidad_g)) : null,
      despensa: NATURALEZA_DESPENSA.has(a.naturaleza) };
  };
  const ordenar = obj => Object.keys(obj).sort().map(id => lineaCompra(id, obj[id]));

  function listaCompra(semana, filtro) {
    if (!semana || !semana.servicios) return [];
    return ordenar(agregar(semana, filtro).total);
  }

  // §0.5 · la CANTIDAD DE RECETA sale de esta MISMA derivación: la suma agregada de las
  // cantidades personales, jamás ración estándar × comensales (una mesa con fracciones
  // {1 · 0,75 · 1,5 · 1} cocina 4,25 raciones, no 4).
  function cantidadesServicio(semana, slot) {
    const r = agregar(semana, { slot });
    // la PIEZA servida viaja entera (`{elaboracion_id, opciones_eje}`) porque el nombre que ve
    // la familia es el PERCIBIDO —`nombre_por_opcion` resuelto con la opción de mesa— y esa
    // resolución vive en UN solo sitio, la capa que pinta. Devolver aquí `elaboracion.nombre` a
    // secas enseñaba «{hoja} rellenas» en la ficha: el bug 6.2, otra vez, por otra puerta.
    const sv = semana.servicios.find(x => `${x.dia}-${x.servicio}` === slot);
    const piezas = {};
    if (sv) {
      const registrar = pe => { if (pe && !piezas[pe.elaboracion_id]) piezas[pe.elaboracion_id] = pe; };
      (sv.plato || []).forEach(registrar);
      registrar(sv.postre);
      for (const n of sv.notas || []) {
        if (n.tipo !== 'sustituto') continue;
        (n.plato || []).forEach(registrar);
        registrar(n.postre);
      }
    }
    return {
      slot,
      ingredientes: ordenar(r.total),
      por_elaboracion: Object.keys(r.porElaboracion).sort().map(eid => ({
        elaboracion_id: eid,
        pieza: piezas[eid] || { elaboracion_id: eid, opciones_eje: null },
        nombre_plantilla: (elabPorId[eid] || {}).nombre || eid,
        ingredientes: ordenar(r.porElaboracion[eid])
      })),
      comensales: r.comensales,
      huecos: r.huecos
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // §15.5 · FICHA Y CATÁLOGO
  // ─────────────────────────────────────────────────────────────────────────────
  // El catálogo es el del HOGAR: `bancoDelHogar` ya sacó lo que la alergia severa prohíbe, y
  // `pools.servible` RECALCULA la servibilidad de cada (elaboración × opción) contra el banco
  // vivo — que es la definición de «bloqueada por falta de dato» (BD_ESQUEMA §7). Nunca un campo
  // guardado: `bd_v6/bloqueadas.js` es la herramienta de TRAZABILIDAD con esa misma regla, no
  // una fuente que este fichero pueda leer (vive fuera del bundle, a propósito).
  function opcionesDe(id) {
    return [...new Set(pools().candidatos.concat(pools().piezas || [])
      .filter(c => c.elaboracion_id === id).map(c => c.opcion))].filter(x => x != null).sort();
  }
  const nombrePorOpcion = (e, op) => (op && (e.nombre_por_opcion || {})[op]) || e.nombre;

  function fichaResumida(e) {
    const ops = opcionesDe(e.id);
    return { id: e.id, nombre: nombrePorOpcion(e, ops[0]), nombre_plantilla: e.nombre,
      tipo: e.tipo, tiempo_min: e.tiempo_min, esfuerzo: e.esfuerzo, temporada: e.temporada,
      region: e.region, apta: e.apta || [], ninos: e.ninos === true, foto: e.foto || null,
      opcion: ops[0] || null, opciones: ops };
  }

  function catalogoRecetas() {
    const vivos = new Set(pools().candidatos.map(c => c.elaboracion_id));
    return banco.elaboraciones.filter(e => e.tipo === 'principal' && vivos.has(e.id))
      .map(fichaResumida)
      .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }

  // líneas planas de una elaboración (componentes incluidos), con la opción del eje resuelta
  function lineasPlanas(id, opcion, out = [], escala = 1, visto = new Set()) {
    if (visto.has(id)) return out;
    visto.add(id);
    for (const l of lineasDe[id] || []) {
      if (l.componente_id) { lineasPlanas(l.componente_id, opcion, out, escala * (l.escala_adulto || 1), visto); continue; }
      const alimento_id = Array.isArray(l.alternativas) ? opcion : l.alimento_id;
      if (!alimento_id) continue;
      out.push({ ...l, alimento_id, escala, eje: Array.isArray(l.alternativas) });
    }
    return out;
  }

  function previsualizarElaboracion(id, opcionPedida) {
    const e = elabPorId[id];
    if (!e) return null;
    const ops = opcionesDe(id);
    const opcion = opcionPedida && ops.includes(opcionPedida) ? opcionPedida : (ops[0] || null);
    const ficha = fichaResumida(e);
    ficha.nombre = nombrePorOpcion(e, opcion);
    ficha.opcion = opcion;
    ficha.pasos = (e.pasos || []).slice();
    ficha.tips = (e.tips || []).slice();
    // variantes del eje: lo que la familia puede pedir «también con…»
    ficha.variantes = ops.filter(op => op !== opcion)
      .map(op => ({ id: op, nombre: (alimPorId[op] || {}).nombre || op, nombre_plato: nombrePorOpcion(e, op) }));
    // ALÉRGENOS DEL DESGLOSE REAL, no de una etiqueta: los del alimento de cada línea servida
    const lineas = lineasPlanas(id, opcion);
    ficha.alergenos = [...new Set(lineas.flatMap(l => (alimPorId[l.alimento_id] || {}).alergenos || []))].sort();
    ficha.ingredientes = lineas.filter(l => l.alimento_id)
      .map(l => ({ id: l.alimento_id, nombre: (alimPorId[l.alimento_id] || {}).nombre || l.alimento_id,
        papel: l.papel, eje: !!l.eje }));
    // acompañamiento DE EJEMPLO vía `combinaciones` (lo que el motor le pondría al lado)
    const comb = combPorId[id] || {};
    const clase = comb.admite_base_fibra;
    const fibra = clase && clase !== 'ninguna'
      ? banco.elaboraciones.filter(x =>
        (clase === 'ambas' && (x.tipo === 'secundaria-ensalada' || x.tipo === 'secundaria-verdura'))
        || (clase === 'ensalada' && x.tipo === 'secundaria-ensalada')
        || (clase === 'verdura' && x.tipo === 'secundaria-verdura')).slice(0, 1)
      : [];
    ficha.acompanamiento = (comb.admite_base_hidrato || []).slice(0, 1).map(x => elabPorId[x])
      .concat(fibra).filter(Boolean)
      .map(x => ({ id: x.id, nombre: x.nombre, pasos: (x.pasos || []).slice() }));
    // NOTAS DE SEGURIDAD INFANTIL aplicables (2.5: son sanitarias, se enseñan) — con la MISMA
    // función que las emite en la card, sobre un servicio sintético de esta sola elaboración.
    if (semanaBase) {
      const edades = edadesEn(semanaBase);
      const sv = { plato: [{ elaboracion_id: id, opciones_eje: opcion ? { '*': opcion } : null }], notas: [] };
      ficha.seguridad_infantil = notasDeServicio(sv, familia.miembros.map(m => m.id), edades, banco, lineasDe, formas());
    } else ficha.seguridad_infantil = [];
    return ficha;
  }

  // ── ¿sirve a esta mesa? La resolución del prevuelo, ni más ni menos: estado ≠ `excluido` para
  //    ≥1 presente (y con eje, alguna opción legal). `mesa` = ids de miembros de la familia, o
  //    miembros SINTÉTICOS de 1 comensal para los chips del catálogo (vegetariana · sin-gluten):
  //    el chip responde con el mismo motor que la mesa real, no con una simulación.
  const _preSint = {};
  function preDeMesa(mesa) {
    if (!mesa || !mesa.length || typeof mesa[0] === 'string')
      return { pre: preBase(), mids: (mesa && mesa.length ? mesa : familia.miembros.map(m => m.id)) };
    const clave = JSON.stringify(mesa);
    if (_preSint[clave]) return _preSint[clave];
    const fam = normalizarFamilia({ id: 'chip', gobierno: null, ausencias_fijas: [], anclas: [],
      miembros: mesa.map((m, i) => ({ ...MANIQUI_CHIP, ...m, id: m.id || `chip${i}` })) }, banco).familia;
    const presencia = Object.fromEntries(fam.miembros.map(m =>
      [m.id, Object.fromEntries(ORDEN_SLOTS.map(s => [s, true]))]));
    const entrada = { semana_iso: semanaBase, estacion: estacionDeSemana(semanaBase), presencia,
      edades: Object.fromEntries(fam.miembros.map(m => [m.id, edadEnSemana(m.nacimiento, semanaBase)])),
      familia: fam, memoria: null };
    return (_preSint[clave] = { pre: prevuelo(entrada, pools(), banco, config), mids: fam.miembros.map(m => m.id) });
  }

  function sirveAMesa(id, mesa) {
    const { pre, mids } = preDeMesa(mesa);
    return mids.some(mid => {
      const res = pre.resolucion[mid] && pre.resolucion[mid][id];
      if (!res || res.estado === 'excluido') return false;
      const legales = pre.opcionesLegales[mid][id];
      return legales == null || legales.length > 0;
    });
  }

  // ── DESCUBRIR: temporada primero, fijas delante, rotación determinista por día (sin RNG),
  //    sobre el catálogo del HOGAR. `fechaISO` es ENTRADA: esta función no toca el reloj.
  function categoriasDescubrir(fechaISO, ocultas) {
    const fuera = new Set(ocultas || []);
    const disponibles = catalogoRecetas().filter(p => !fuera.has(p.id)).map(p => elabPorId[p.id]);
    const d = new Date(`${fechaISO}T00:00:00Z`);
    const mes = d.getUTCMonth() + 1;
    const estacion = config.ESTACION_POR_MES[mes];
    const pool = CATEGORIAS_DESCUBRIR.slice();
    if (estacion) pool.unshift({ id: 'temporada', kicker: 'De temporada',
      titulo: estacion === 'verano' || estacion === 'primavera'
        ? 'Recetas fresquitas para el buen tiempo' : 'Recetas de cuchara para el frío',
      test: e => e.temporada === estacion });
    const conCandidatas = pool.map(cat => {
      let candidatas = disponibles.filter(cat.test);
      if (!candidatas.length) return null;
      if (cat.orden) candidatas = candidatas.slice().sort(cat.orden);
      return { id: cat.id, kicker: cat.kicker, titulo: cat.titulo,
        candidatas: candidatas.map(fichaResumida) };
    }).filter(Boolean);
    if (!conCandidatas.length) return [];
    const fijas = FIJAS_DESCUBRIR.map(id => conCandidatas.find(c => c.id === id)).filter(Boolean);
    const idsFijas = new Set(fijas.map(c => c.id));
    const resto = conCandidatas.filter(c => !idsFijas.has(c.id));
    const diaNum = Math.floor(d.getTime() / 86400000);
    const off = resto.length ? diaNum % resto.length : 0;
    return fijas.concat(resto.slice(off), resto.slice(0, off)).map((cat, i) => ({
      ...cat,
      // la que se enseña en la ficha rota con el día, como en v5
      destacada: cat.candidatas[(diaNum + i) % cat.candidatas.length],
      foto: (cat.candidatas.find(p => p.foto) || {}).foto || null
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // §15.6 · NEVERA — PROPONE, ya no monta menús
  // ─────────────────────────────────────────────────────────────────────────────
  // El filtro está INVERTIDO: manda la disponibilidad. `alimentosNevera()` es el checklist real
  // (lo que de verdad decide si un plato se puede montar); grasa y condimento se asumen en casa.
  function alimentosNevera() {
    const usados = {};
    for (const p of catalogoRecetas()) {
      for (const op of (p.opciones.length ? p.opciones : [null])) {
        for (const l of lineasPlanas(p.id, op)) {
          const a = alimPorId[l.alimento_id];
          if (!a || NATURALEZA_DESPENSA.has(a.naturaleza)) continue;
          usados[a.id] = { id: a.id, nombre: a.nombre, naturaleza: a.naturaleza };
        }
      }
    }
    return Object.values(usados).sort((x, y) => x.nombre.localeCompare(y.nombre, 'es'));
  }

  // montables (todo lo fijo disponible + eje con ≥1 opción disponible y comible) y
  // casi-montables (falta UNO), con `faltan[]`. NO monta el menú: elegir candidata pasa por
  // `cambiarPlato {modo:'asignar'}` — una sola puerta para cambiar la semana.
  function opcionesNevera(slot, disponibles, semana) {
    const hay = new Set(disponibles || []);
    const servicio = slot && slot.split('-')[1];
    const presentes = semana && semana.presencia
      ? familia.miembros.map(m => m.id).filter(mid => semana.presencia[mid] && semana.presencia[mid][slot] === true)
      : familia.miembros.map(m => m.id);
    const montables = [], casi = [];
    for (const p of catalogoRecetas()) {
      if (servicio && !p.apta.includes(servicio)) continue;
      if (presentes.length && !sirveAMesa(p.id, presentes)) continue;
      // la opción del eje que la mesa puede comer Y está en la nevera
      const legales = p.opciones.filter(op => presentes.some(mid =>
        (preBase().opcionesLegales[mid][p.id] || []).includes(op)));
      const conEje = p.opciones.length > 0;
      const opsDisponibles = legales.filter(op => hay.has(op));
      const faltan = [];
      for (const l of lineasPlanas(p.id, opsDisponibles[0] || legales[0] || null)) {
        const a = alimPorId[l.alimento_id];
        if (!a || NATURALEZA_DESPENSA.has(a.naturaleza)) continue;   // asumidos en casa
        if (Array.isArray(l.alternativas) || l.eje) continue;        // el eje se juzga aparte
        if (!hay.has(a.id) && !faltan.includes(a.id)) faltan.push(a.id);
      }
      if (conEje && !opsDisponibles.length) {
        // el eje no está en la nevera: falta UNA opción legal cualquiera (la primera, ordenada)
        if (!legales.length) continue;
        faltan.push(legales[0]);
      }
      const ficha = { ...p, opcion: opsDisponibles[0] || legales[0] || null,
        faltan: faltan.map(id => ({ id, nombre: (alimPorId[id] || {}).nombre || id })) };
      if (!faltan.length) montables.push(ficha);
      else if (faltan.length === 1) casi.push(ficha);
    }
    return { montables, casi_montables: casi };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // §15.3 · CAMBIAR EL PLATO — SOLO ese slot; T4 re-audita la semana ENTERA
  // ─────────────────────────────────────────────────────────────────────────────
  // El «esqueleto vigente» se LEE de la propia semana servida: los 14 slots con plato son
  // exactamente los que T1 repartió (los demás llevan `no_servido`), y la categoría de cada uno
  // es la del candidato (elaboración × opción) que se sirvió. Reconstruirlo así —en vez de
  // re-correr T1— garantiza que la reserva contra la que se busca es la que la familia TIENE.
  function categoriaServida(pe) {
    const ops = pe.opciones_eje ? Object.values(pe.opciones_eje) : [null];
    const cuenta = {};
    for (const o of ops) cuenta[o] = (cuenta[o] || 0) + 1;
    const op = Object.keys(cuenta).sort((a, b) => cuenta[b] - cuenta[a] || (a < b ? -1 : 1))[0];
    const opcion = op === 'null' || op === 'undefined' ? null : op;
    const c = pools().candidatos.find(x => x.elaboracion_id === pe.elaboracion_id && x.opcion === opcion);
    return { categoria: c ? c.categoria : 'sin-cuota', opcion };
  }
  const principalDe = sv => (sv.plato || []).find(pe => (elabPorId[pe.elaboracion_id] || {}).tipo === 'principal')
    || (sv.plato || [])[0] || null;

  function esqueletoVigente(semana) {
    const slots = [];
    for (const s of SLOTS) {
      const sv = semana.servicios.find(x => `${x.dia}-${x.servicio}` === s.slot);
      if (!sv || !sv.plato) continue;
      const pe = principalDe(sv);
      const { categoria } = categoriaServida(pe);
      slots.push({ slot: s.slot, dia: s.dia, servicio: s.servicio, categoria,
        esfuerzo: (elabPorId[pe.elaboracion_id] || {}).esfuerzo || 'medio', ancla: null });
    }
    return { ok: true, slots, relajaciones: [] };
  }

  // declaraciones (relajaciones + descargos + gates de T4) de una semana, como claves comparables
  function declaraciones(semana, aud) {
    const out = new Map();
    for (const sv of semana.servicios) {
      const slot = `${sv.dia}-${sv.servicio}`;
      for (const r of sv.relajaciones || []) out.set(`rel|${slot}|${r.peldano}`, { tipo: r.peldano, slot, frase: r.frase, detalle: r.detalle });
      for (const d of sv.descargos || []) out.set(`des|${slot}|${d.tipo}|${d.miembro || ''}`, { tipo: d.tipo, slot, miembro: d.miembro || null, detalle: d.detalle, frase: frasearDesvio(d.tipo, d.detalle) });
    }
    for (const grupo of ['silenciosas', 'divergencias', 'eje_corto']) {
      for (const x of (aud && aud[grupo]) || [])
        out.set(`t4|${x.slot || ''}|${x.tipo}|${x.miembro || ''}`, { tipo: x.tipo, slot: x.slot || null, miembro: x.miembro || null, detalle: x.detalle, frase: frasearDesvio(x.tipo, x.detalle) });
    }
    return out;
  }

  const objetivosDe = semanaIso => Object.fromEntries(
    familia.miembros.map(m => [m.id, objetivoDiario(m, semanaIso, config)]));
  const auditarSemana = semana => auditar({ familia, semanas: [semana] }, banco, config, objetivosDe(semana.semana_iso));

  // avisos DUROS de una asignación directa (§15.3): alergia no severa o seguridad infantil. No
  // bloquean —la familia está por encima de la app— pero nombran persona y alérgeno y persisten.
  function avisosDeAsignacion(elaboracionId, presentes, semanaIso, opcionPedida) {
    const out = [];
    const e = elabPorId[elaboracionId];
    if (!e) return [{ tipo: 'sin-alternativa', detalle: `${elaboracionId} no existe en el banco de esta casa`, frase: frasearDesvio('sin-alternativa') }];
    const ops = opcionesDe(elaboracionId);
    const opcion = opcionPedida && ops.includes(opcionPedida) ? opcionPedida : (ops[0] || null);
    const lineas = lineasPlanas(elaboracionId, opcion);
    for (const mid of presentes) {
      const m = familia.miembros.find(x => x.id === mid);
      if (!m) continue;
      const suyas = (m.alergias || []).concat(m.intolerancias || []);
      for (const l of lineas) {
        const a = alimPorId[l.alimento_id];
        if (!a) continue;
        const choque = (a.alergenos || []).find(x => suyas.includes(x));
        if (choque) out.push({ tipo: 'alergia', miembro: mid, alimento_id: a.id, alergeno: choque,
          detalle: `${a.nombre} lleva ${choque} y ${m.nombre || mid} lo tiene declarado`,
          frase: `${m.nombre || mid}: ese plato lleva ${a.nombre.toLowerCase()} (${choque}).`, duro: true });
      }
    }
    const edades = edadesEn(semanaIso);
    const sv = { plato: [{ elaboracion_id: elaboracionId, opciones_eje: opcion ? { '*': opcion } : null }], notas: [] };
    for (const n of notasDeServicio(sv, presentes, edades, banco, lineasDe, formas())) {
      const m = familia.miembros.find(x => x.id === n.miembro) || {};
      out.push({ tipo: 'seguridad-infantil', miembro: n.miembro, alimento_id: n.alimento_id,
        detalle: `${n.alimento_id}: ${n.forma_insegura} (menores de ${n.edad_max_anos})`,
        frase: `${m.nombre || n.miembro}: ${n.forma_insegura}.`, duro: true });
    }
    return out;
  }

  function cambiarPlato(semanaEntrada, slot, peticion, diario, datosOpc, configOpc) {
    const cfg = configOpc || config;
    // FUNCIÓN PURA: se trabaja sobre una copia. Los slots fijados viajan por referencia dentro de
    // T2 y la pasada de cierre puede colgarles una declaración — sobre el clon, jamás sobre la
    // semana que la app tiene en la mano.
    const original = semanaEntrada;
    const semana = structuredClone(semanaEntrada);
    const svActual = semana.servicios.find(x => `${x.dia}-${x.servicio}` === slot);
    const noHay = (tipo, detalle) => ({ ok: false, semana: original,
      desvios: [{ tipo, slot, detalle, frase: frasearDesvio(tipo, detalle) }] });
    if (!svActual || !svActual.plato) return noHay('sin-alternativa', `${slot} no tiene plato que cambiar`);
    const modo = (peticion && peticion.modo) || 'otro';
    const peActual = principalDe(svActual);

    // 1 · MEMORIA de entrada: la del diario de lo YA servido, exactamente como en la generación
    //     (diario → memoria → semana). El resto de la semana no va aquí: va en `fijados`.
    const lunes = fechaDia(semana.semana_iso, 1).toISOString().slice(0, 10);
    const mem = memoria(diario && Array.isArray(diario.servicios) ? diario : { servicios: [] }, banco, cfg, lunes);
    const entrada = { ...entradaDe(semana.semana_iso, semana.presencia), memoria: mem };
    const pre = prevuelo(entrada, pools(), banco, cfg);

    // 2 · el esqueleto vigente + lo que este modo pide de ESE slot
    const esq = esqueletoVigente(semana);
    const s = esq.slots.find(x => x.slot === slot);
    if (!s) return noHay('sin-alternativa', `${slot} no está en el esqueleto de la semana`);
    const evitar = { principales: new Set(), piezas: new Set() };
    let avisos = [];
    if (modo === 'asignar') {
      if (!peticion.elaboracion_id) return noHay('sin-alternativa', 'asignar sin `elaboracion_id`');
      s.ancla = peticion.elaboracion_id;
      s.ancla_libre = true;                            // apta/temporada ceden: manda la familia
      const presentes = familia.miembros.map(m => m.id)
        .filter(mid => semana.presencia[mid] && semana.presencia[mid][slot] === true);
      // LO QUE LA FAMILIA ELIGE ES EL PLATO PERCIBIDO, no la plantilla: «alitas de pollo al
      // horno» y «dorada al horno» son la MISMA elaboración con distinta opción de eje. Sin
      // fijar la opción, pedir alitas servía dorada (cazado en el navegador, 3-ago). Se fija
      // para todos los presentes y quien no pueda comerla conserva su resolución: la guardia
      // dura de `resolverEje` no la vence una elección de la familia.
      if (peticion.opcion) s.opciones_previas = Object.fromEntries(presentes.map(mid => [mid, peticion.opcion]));
      avisos = avisosDeAsignacion(peticion.elaboracion_id, presentes, semana.semana_iso, peticion.opcion);
    } else if (modo === 'guarnicion') {
      // mismo principal, otra complementaria. La opción del eje se conserva: `asado-horno` sirve
      // alitas o dorada, y rotar la guarnición no puede cambiarle el plato a nadie (el mismo
      // defecto que en `asignar`, por la otra puerta — cazado en el navegador).
      s.ancla = peActual.elaboracion_id;
      s.ancla_libre = true;
      s.opciones_previas = peActual.opciones_eje || null;
      for (const pe of svActual.plato) if (pe !== peActual) evitar.piezas.add(pe.elaboracion_id);
      if (!evitar.piezas.size) return noHay('sin-alternativa', 'ese plato no lleva acompañamiento que rotar');
    } else {
      evitar.principales.add(peActual.elaboracion_id);
    }

    // 3 · T2 SOLO sobre ese slot: el resto de la semana entra como `fijados` y se precarga en el
    //     estado vivo, así variedad, techos y ventanas cuentan contra lo que la familia ya tiene.
    const fijados = {};
    for (const sv of semana.servicios) {
      const sl = `${sv.dia}-${sv.servicio}`;
      if (sl !== slot && sv.plato) fijados[sl] = sv;
    }
    const correr = () => {
      try {
        return rellenarSemana({ entrada, esq, pre, pools: pools(), datos: banco, config: cfg,
          memoria: mem, menuCole: familia.menu_cole, fijados, evitar });
      } catch (e) { return { ok: false, motivo: `no se pudo re-resolver ${slot}: ${e.message}` }; }
    };
    let r = correr();
    // AVISO, JAMÁS BLOQUEO: si en la clase que T1 reservó no queda otro plato, se abre la reserva
    // antes que devolver «no hay nada». El cambio de tipo se DECLARA como desvío.
    if (!r.ok && modo === 'otro') {
      s.categoria_libre = true;
      const r2 = correr();
      if (r2.ok) { r = r2; avisos = avisos.concat([{ tipo: 'cambio-de-tipo', slot,
        detalle: `sin otro plato de ${s.categoria} servible en ese slot: se abre la reserva de la semana`,
        frase: frasearDesvio('cambio-de-tipo') }]); }
    }
    if (!r.ok) return { ok: false, semana: original,
      desvios: [{ tipo: 'sin-alternativa', slot, detalle: r.motivo, frase: frasearDesvio('sin-alternativa') }]
        .concat(avisos) };

    // 4 · T3 re-fracciona ESE slot. Se corre sobre la semana ENTERA —el acumulado de salud es de
    //     semana— y solo se aplica al slot cambiado: los demás quedan VERBATIM (§15.3).
    const nueva = r.semana;
    nueva.semana_iso = semana.semana_iso;
    // los slots sin plato conservan SU motivo declarado (`sin-presentes` / `no-gobernado`): T2 lo
    // reconstruye desde su propio esqueleto y aquí el esqueleto son solo los slots servidos
    for (const sv of nueva.servicios) {
      if (sv.plato) continue;
      const antes = original.servicios.find(x => x.dia === sv.dia && x.servicio === sv.servicio);
      if (antes) sv.no_servido = antes.no_servido;
    }
    const t3 = fraccionarSemana({ semana: nueva, familia, config: cfg }, banco);
    for (const sv of nueva.servicios) {
      const sl = `${sv.dia}-${sv.servicio}`;
      if (sl !== slot) {                               // verbatim: se re-cuelga lo que ya tenía
        const antes = fijados[sl];
        if (antes) { sv.fracciones = antes.fracciones; if (antes.ajustes_linea) sv.ajustes_linea = antes.ajustes_linea; }
        continue;
      }
      const f = t3.servicios.find(x => x.slot === sl);
      if (!f || !sv.plato) continue;
      sv.fracciones = Object.keys(f.fracciones || {}).length ? f.fracciones : null;
      if (f.ajustes_linea && f.ajustes_linea.length) sv.ajustes_linea = f.ajustes_linea;
      sv.descargos = (sv.descargos || []).concat(f.descargos);
      sv.relajaciones = (sv.relajaciones || []).concat(f.relajaciones);
      // D2 y §13 sobre el servicio NUEVO (solo él: `anotarSemana` no deduplica y re-correrla
      // sobre la semana entera duplicaría las notas de los slots que no se han tocado)
      const edades = edadesEn(semana.semana_iso);
      const presentes = familia.miembros
        .filter(m => nueva.presencia[m.id] && nueva.presencia[m.id][sl] === true).map(m => m.id);
      sv.notas = (sv.notas || []).concat(notasDeServicio(sv, presentes, edades, banco, lineasDe, formas()));
      anotarHogar({ servicios: [sv] }, politica);
    }

    // 5 · T4 re-audita la semana ENTERA y los desvíos son los NUEVOS (§15.3). Aviso, jamás
    //     bloqueo: cuotas, variedad, ejes y energía se declaran y no impiden nada.
    const antes = declaraciones(original, auditarSemana(original));
    const despues = declaraciones(nueva, auditarSemana(nueva));
    const desvios = [];
    for (const [k, v] of despues) if (!antes.has(k)) desvios.push(v);
    return { ok: true, semana: nueva,
      desvios: avisos.concat(modo === 'asignar' ? desvios : reatribuir(desvios)) };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // §15.4 · PRESENCIA DEL DÍA — mismo plato, mesa real
  // ─────────────────────────────────────────────────────────────────────────────
  // «Hoy no como / hoy vuelve papá»: no toca el plato ni el resto de la semana. Re-corre T2 sobre
  // ESE slot con el principal, las guarniciones y el postre FIJADOS —solo se re-resuelven las
  // opciones de eje y las notas con la mesa de hoy— y luego T3 para las cantidades. El alérgeno
  // severo no puede aparecer: es independiente de la presencia (§13), y ya no está en el banco.
  function reescalarServicio(semanaEntrada, slot, presentes, diario) {
    const original = semanaEntrada;
    const semana = structuredClone(semanaEntrada);     // pura, igual que `cambiarPlato`
    const svActual = semana.servicios.find(x => `${x.dia}-${x.servicio}` === slot);
    if (!svActual || !svActual.plato) return { ok: false, semana: original,
      desvios: [{ tipo: 'sin-alternativa', slot, frase: 'Ese servicio no tiene plato que reescalar.' }] };
    const nuevaPresencia = {};
    for (const m of familia.miembros)
      nuevaPresencia[m.id] = { ...(semana.presencia[m.id] || {}), [slot]: presentes.includes(m.id) };
    const semanaConMesa = { ...semana, presencia: nuevaPresencia };
    if (!presentes.length) {                           // nadie come: el slot queda sin servir
      const sv = semanaConMesa.servicios.find(x => `${x.dia}-${x.servicio}` === slot);
      sv.plato = null; sv.postre = null; sv.notas = []; sv.fracciones = null; sv.no_servido = 'sin-presentes';
      return { ok: true, semana: semanaConMesa, servicio: sv, desvios: [] };
    }
    const peActual = principalDe(svActual);
    const esq = esqueletoVigente(semanaConMesa);
    const s = esq.slots.find(x => x.slot === slot);
    if (!s) return { ok: false, semana: original, desvios: [{ tipo: 'sin-alternativa', slot, frase: 'Ese servicio no está en el esqueleto.' }] };
    s.ancla = peActual.elaboracion_id;
    s.ancla_libre = true;
    s.opciones_previas = peActual.opciones_eje || null;
    s.piezas_fijas = (svActual.plato || []).filter(pe => pe !== peActual);
    s.postre_fijo = svActual.postre || null;
    const lunes = fechaDia(semana.semana_iso, 1).toISOString().slice(0, 10);
    const mem = memoria(diario && Array.isArray(diario.servicios) ? diario : { servicios: [] }, banco, config, lunes);
    const entrada = { ...entradaDe(semana.semana_iso, nuevaPresencia), memoria: mem };
    const pre = prevuelo(entrada, pools(), banco, config);
    const fijados = {};
    for (const sv of semanaConMesa.servicios) {
      const sl = `${sv.dia}-${sv.servicio}`;
      if (sl !== slot && sv.plato) fijados[sl] = sv;
    }
    let r;
    try {
      r = rellenarSemana({ entrada, esq, pre, pools: pools(), datos: banco, config,
        memoria: mem, menuCole: familia.menu_cole, fijados });
    } catch (e) {
      return { ok: false, semana: original, desvios: [{ tipo: 'sin-alternativa', slot, detalle: e.message,
        frase: 'No hemos podido recalcular ese servicio con esa mesa.' }] };
    }
    if (!r.ok) return { ok: false, semana: original, desvios: [{ tipo: 'sin-alternativa', slot, detalle: r.motivo,
      frase: 'Con esa mesa el plato ya no se sostiene: cámbialo y te proponemos otro.' }] };
    const nueva = r.semana;
    nueva.semana_iso = semana.semana_iso;
    for (const sv of nueva.servicios) {
      if (sv.plato) continue;
      const antes = original.servicios.find(x => x.dia === sv.dia && x.servicio === sv.servicio);
      if (antes) sv.no_servido = antes.no_servido;
    }
    const t3 = fraccionarSemana({ semana: nueva, familia, config }, banco);
    const desvios = [];
    for (const sv of nueva.servicios) {
      const sl = `${sv.dia}-${sv.servicio}`;
      if (sl !== slot) {
        const antes = fijados[sl];
        if (antes) { sv.fracciones = antes.fracciones; if (antes.ajustes_linea) sv.ajustes_linea = antes.ajustes_linea; }
        continue;
      }
      const f = t3.servicios.find(x => x.slot === sl);
      if (!f) continue;
      sv.fracciones = Object.keys(f.fracciones || {}).length ? f.fracciones : null;
      if (f.ajustes_linea && f.ajustes_linea.length) sv.ajustes_linea = f.ajustes_linea;
      sv.descargos = (sv.descargos || []).concat(f.descargos);
      const edades = edadesEn(semana.semana_iso);
      sv.notas = (sv.notas || []).concat(notasDeServicio(sv, presentes, edades, banco, lineasDe, formas()));
      anotarHogar({ servicios: [sv] }, politica);
      for (const d of sv.descargos || [])
        desvios.push({ tipo: d.tipo, slot: sl, miembro: d.miembro || null, detalle: d.detalle,
          frase: frasearDesvio(d.tipo, d.detalle) });
    }
    const servicio = nueva.servicios.find(x => `${x.dia}-${x.servicio}` === slot);
    return { ok: true, semana: nueva, servicio, desvios: reatribuir(desvios) };
  }

  return {
    // §15.2 — y de la misma derivación, la cantidad de receta y las kcal por comensal
    listaCompra, cantidadesServicio,
    // §15.3 · §15.4
    cambiarPlato, reescalarServicio,
    // §15.5
    catalogoRecetas, previsualizarElaboracion, categoriasDescubrir, sirveAMesa,
    // §15.6
    alimentosNevera, opcionesNevera,
    // lo que la política de hogar dejó fuera: SALIDA, jamás silencio (§13.4)
    politicaHogar: politica,
    familia, banco
  };
}

// maniquí de los chips del catálogo: adulto P50 declarado como tal. Es ENTRADA sintética (misma
// convención que las familias del harness), jamás dato nutricional del banco.
const MANIQUI_CHIP = { sexo: 'f', nacimiento: '1988-06', altura_cm: 165, peso_kg: 62,
  actividad: 'media', objetivo: 'mantenimiento' };

module.exports = { crearSuperficie, redondearCompra, CATEGORIAS_DESCUBRIR, FRASE_DESVIO };

  };

  /* ---- motor_v6/src/t1_esqueleto.js ---- */
  REG['t1_esqueleto'] = function (module, exports, require) {
// T1 · ESQUELETO de la semana (spec §1, primer tiempo del motor V6).
//
// QUÉ HACE: asigna a los slots gobernados una CATEGORÍA proteica dominante + un NIVEL DE
// ESFUERZO, satisfaciendo de golpe: bandas AESAN por presente (pro-rateadas por presencia),
// alternancia comida≠cena del día, pools por aptitud y temporada, `elaborado` solo en finde y
// las anclas del usuario como pre-asignación que MANDA.
//
// EXACTO, no greedy (spec §1): búsqueda en profundidad completa con poda por cotas. Si existe
// un reparto legal, se encuentra — la poda solo descarta ramas donde ya es imposible cerrar los
// mínimos o se ha superado un techo, nunca ramas viables. Si no existe, el fallo NOMBRA la
// restricción vinculante (spec §7) en vez de devolver algo a medias.
//
// DETERMINISTA (spec §0.2): sin reloj ni azar. El orden de exploración es fijo salvo una
// ROTACIÓN por número de semana ISO, que es lo que evita que todas las semanas salgan iguales
// y mata el sesgo alfabético que la batería D mide.
//
// LAS CUOTAS SE RESERVAN AQUÍ, nunca se persiguen slot a slot (defecto medido de v5).
//
// FRONTERAS DECLARADAS de este tiempo:
//  · Las cuotas AESAN aplican SOLO a comensales omnívoros (spec §4: vegetariano/vegano tiene
//    `CUOTAS_POR_ESTILO` a cero hasta tener valor con fuente).
//  · La viabilidad de la MESA MIXTA (que exista opción de eje para cada dieta presente) es del
//    pre-vuelo §7 y de T2, no de T1: aquí se reserva categoría, no plato.
'use strict';
const { disponibilidad } = require('./pools.js');

const SLOTS = [];
for (let d = 1; d <= 7; d++) for (const s of ['comida', 'cena']) SLOTS.push({ slot: `${d}-${s}`, dia: d, servicio: s });

const AGREGADOS = {
  'pescado-total': ['pescado-blanco', 'pescado-azul', 'marisco'],
  'carne-total': ['carne-roja', 'carne-blanca', 'carne-procesada']
};
// Preferencia de esfuerzo por tipo de día. Entre semana manda la promesa del producto («me
// quita de pensar, no de cocinar»): rápido primero. En finde vive la cocina con tiempo.
// CUPO de `elaborado`: entre `ELABORADO_POR_SEMANA` y `ELABORADO_POR_SEMANA_MAX` a la semana,
// y SOLO EN LAS COMIDAS DEL FINDE — dictado de Roger (3-ago, sustituye al «una por semana en
// finde» del 1-ago): «plato elaborado nunca se guarda para domingo noche; es para sábado y
// domingo mediodía, que es donde va la cuota grande del día y los platos más pesados. Acepto 1
// o 2, siempre en comidas, no en cenas». Es contrato C, no preferencia: si la semana no puede
// cerrarlo (pools, ancla, cuotas), se relaja a cero y se DECLARA con descargo R0.
// MEDIDO al aplicarlo, y conviene que quede escrito porque contradice la intuición: el dictado
// SOLO empeoró la parrilla (7 → 10 semanas fallidas de 44). El cuello `sin-cuota/elaborado`
// no estaba en la cena: está en la casilla, que tiene 2 candidatos en todo el banco — al
// restringirla a 2 slots en vez de 4, aprieta más. Lo que arregla de verdad esas semanas es el
// BUCLE T1↔T2 de `generar.js` (10 → 3). El dictado se mantiene porque es criterio de producto,
// no de motor: un plato de cocinar con calma un domingo por la noche no lo cocina nadie.
const ESFUERZO_PREFERIDO = { diario: ['rapido', 'medio'], finde: ['medio', 'elaborado', 'rapido'] };

// cubos que una categoría alimenta (ella misma + sus agregados)
function cubosDe(categoria) {
  if (!categoria) return [];
  const out = [categoria];
  for (const [agg, miembros] of Object.entries(AGREGADOS)) if (miembros.includes(categoria)) out.push(agg);
  return out;
}

// Cupo exacto de `elaborado` (contrato C): se intenta con el cupo del dictado; si la semana no
// puede cerrarlo, se reintenta sin él y se declara la relajación. Nunca se pierde en silencio.
// `pre` (opcional) = resultado del PREVUELO §7: restringe dominios a lo que la MESA puede comer
// y sustituye las bandas por las efectivas (Q1). Sin él, T1 se comporta exactamente como antes.
function esqueleto(entrada, pools, config, pre, intento = 0) {
  const min = config.ELABORADO_POR_SEMANA || 0;
  const max = Math.max(min, config.ELABORADO_POR_SEMANA_MAX || min);
  const conCupo = resolver(entrada, pools, config, { min, max }, pre, intento);
  if (conCupo.ok || min === 0) return conCupo;
  const sinCupo = resolver(entrada, pools, config, { min: 0, max }, pre, intento);
  if (!sinCupo.ok) return sinCupo;
  return { ...sinCupo, relajaciones: [{
    peldano: 'R0',
    detalle: `cupo de esfuerzo elaborado ${min}→0: ${conCupo.restriccion_vinculante}`,
    frase: 'Esta semana no ha salido ningún plato de los de cocinar con calma.'
  }] };
}

function resolver(entrada, pools, config, cupoElaborado, pre, intento = 0) {
  const cupoMin = cupoElaborado.min, cupoMax = cupoElaborado.max;
  const { semana_iso, familia, estacion, edades } = entrada;
  const semanaNum = Number(semana_iso.split('-W')[1]);
  const gobierno = familia.gobierno == null ? null : new Set(familia.gobierno);
  const presencia = entrada.presencia;                   // { miembro: { slot: bool } }

  // ── slots a rellenar: gobernados y con al menos un presente
  const activos = SLOTS.filter(s => (gobierno == null || gobierno.has(s.slot))
    && familia.miembros.some(m => presencia[m.id] && presencia[m.id][s.slot] === true));

  // ── bandas por miembro OMNÍVORO, pro-rateadas a su presencia en slots activos.
  //    Con prevuelo: MANDAN las bandas efectivas (Q1 — mínimos capados a lo alcanzable por H
  //    individual, con descargo estructural emitido por el prevuelo; techos intactos).
  const omnivoros = familia.miembros.filter(m => m.dieta === 'omnivora');
  const bandas = {};
  if (pre && pre.bandasEfectivas) {
    for (const [mid, cubos] of Object.entries(pre.bandasEfectivas)) bandas[mid] = { cubos };
  } else for (const m of omnivoros) {
    const presentes = activos.filter(s => presencia[m.id][s.slot] === true).length;
    if (!presentes) continue;
    const factor = presentes / 14;
    const edad = entrada.edades[m.id];
    const tramo = edad < config.EDAD_RACION_ADULTO ? 'nino' : 'adulto';
    bandas[m.id] = { presentes, cubos: {} };
    for (const [cubo, porEdad] of Object.entries(config.CUOTAS)) {
      const [min, max] = porEdad[tramo];
      bandas[m.id].cubos[cubo] = {
        min: min == null ? 0 : min * factor,
        max: max == null ? Infinity : max * factor
      };
    }
  }

  // ── dominios por slot (categoría × esfuerzo legales)
  const disp = disponibilidad(pools, estacion);
  const anclas = {};
  for (const a of familia.anclas || []) anclas[`${a.dia}-${a.servicio}`] = a;
  const catsAncla = {};                                   // slot → categorías que el ancla permite
  for (const [slot, a] of Object.entries(anclas)) {
    const cs = pools.candidatos.filter(c => c.elaboracion_id === a.elaboracion_id
      && (c.temporada == null || c.temporada === estacion));
    catsAncla[slot] = { categorias: new Set(cs.map(c => c.categoria)), esfuerzos: new Set(cs.map(c => c.esfuerzo)) };
  }

  // ROTACIÓN por semana ISO **y por slot**. Con una rotación única por semana el patrón se
  // repetía cada 8 semanas (medido 1-ago: 8 esqueletos distintos en 65 semanas) y además hacía
  // que el DFS recorriera siempre el mismo orden lexicográfico, que es de donde salía la cola
  // de ~1 s. Desplazar también por índice de slot da muchas más combinaciones y rompe esa
  // patología. Sigue siendo determinista: solo depende de la semana y de la posición.
  const categorias = [...new Set(pools.candidatos.map(c => c.categoria))].filter(Boolean).sort();
  const ordenPara = idx => {
    if (!categorias.length) return [];
    // 4, 5 y 2 son coprimos con 9 (el número de categorías): barren TODO el ciclo. El `3` que
    // había aquí no lo era —gcd(3,9)=3— y dejaba solo 3 esqueletos distintos en 52 semanas,
    // secuencia 012012…, para cualquier forma de familia (auditoría ciega 2-ago; el comentario
    // anterior daba el bug por arreglado y lo había empeorado). El término `intento` es el que
    // permite a generar.js pedir OTRO reparto legal cuando T2 no puede llenar el primero.
    const rot = (semanaNum * 4 + idx * 5 + intento * 2) % categorias.length;
    return categorias.slice(rot).concat(categorias.slice(0, rot));
  };

  const dominios = activos.map((s, idx) => {
    const finde = s.dia >= 6;
    const ancla = catsAncla[s.slot];
    // el finde también rota: sin rotar, `medio` gana siempre y `elaborado` no se serviría nunca
    const preferidos = ESFUERZO_PREFERIDO[finde ? 'finde' : 'diario'];
    const rotE = finde ? (semanaNum + s.dia + intento) % preferidos.length : 0;
    const ordenEsfuerzo = preferidos.slice(rotE).concat(preferidos.slice(0, rotE));
    const opciones = [];
    for (const categoria of ordenPara(idx)) {
      if (ancla && !ancla.categorias.has(categoria)) continue;
      for (const esfuerzo of ordenEsfuerzo) {
        // dictado 3-ago: `elaborado` SOLO en las comidas del finde, jamás en una cena
        if (esfuerzo === 'elaborado' && !(finde && s.servicio === 'comida')) continue;
        if (ancla && !ancla.esfuerzos.has(esfuerzo)) continue;
        const clave = `${categoria}|${s.servicio}|${esfuerzo}`;
        if (!disp.has(clave)) continue;
        // prevuelo: la clave además tiene que ser COMIBLE por la mesa de este slot (H)
        if (pre && pre.dispPorSlot && pre.dispPorSlot[s.slot] && !pre.dispPorSlot[s.slot].has(clave)) continue;
        // y no puede estar BLOQUEADA POR MEMORIA: una clave con una sola elaboración cuya única
        // opción está en ventana dura no es reservable — se sabe aquí, no al fallar el relleno
        if (pre && pre.clavesBloqueadas && pre.clavesBloqueadas.has(clave)) continue;
        opciones.push({ categoria, esfuerzo });
      }
    }
    return { ...s, opciones, anclado: !!ancla };
  });

  const vacio = dominios.find(d => d.opciones.length === 0);
  if (vacio) return fallo(`pool vacío en ${vacio.slot}`,
    vacio.anclado ? `el ancla de ${vacio.slot} no tiene ninguna variante servible en ${estacion}`
      : `ninguna categoría tiene candidato apto para ${vacio.servicio} en ${estacion}` +
        (pre ? ' que toda la mesa pueda comer' : ''));

  // ── búsqueda exacta con poda
  const conteo = {};                                      // miembro → cubo → nº de servicios
  for (const mid of Object.keys(bandas)) { conteo[mid] = {}; for (const c of Object.keys(bandas[mid].cubos)) conteo[mid][c] = 0; }
  // profundidad de pool (spec §7, vía prevuelo): una clave no puede ocupar más slots que
  // elaboraciones distintas tiene — M2 haría imposible el relleno de T2
  const usosClave = {};
  const cabeClave = clave => !pre || !pre.profundidadClave
    || (usosClave[clave] || 0) < (pre.profundidadClave[clave] || 0);
  // presupuesto M6 del esqueleto: cada uso de una clave por encima de sus elaboraciones
  // LIGERAS consumirá un frito en T2 (cota inferior; T2 gobierna el gasto real). LIFO exacto.
  let fritosT1 = 0;
  const esExceso = clave => !pre || !pre.profundidadLigera ? false
    : (usosClave[clave] || 0) + 1 > (pre.profundidadLigera[clave] != null ? pre.profundidadLigera[clave] : Infinity);
  const cabeFrito = clave => !esExceso(clave) || fritosT1 < (config.FRITOS_SEMANA_MAX || Infinity);
  // doctrina 2-ago (§2-bis): el cubo del slot computa SOLO a quien puede recibirlo — el
  // excluido come su composición individual y ni su mínimo avanza ni su techo se consume.
  // Sin prevuelo: todos (comportamiento anterior). T1 aproxima por (miembro × cubo) global;
  // el conteo exacto por candidato es de T2/T4.
  const puede = (mid, cubo) => !pre || !pre.puedeCubo || pre.puedeCubo[mid] == null
    || pre.puedeCubo[mid][cubo] !== false;
  // PRESUPUESTO EN RACIONES (cazado en vivo con mesa-1): un slot del cubo no aporta «1» —
  // aporta las raciones típicas de sus candidatos (tortilla = 2,07 huevos). Con prevuelo, el
  // conteo suma la MEDIANA del cubo (presupuesto realista) y la poda usa el MÁXIMO (cota
  // optimista: jamás poda ramas viables). Sin prevuelo: peso 1 = comportamiento histórico.
  // ⚠️ T1 PRESUPUESTA EN SERVICIOS (peso 1), NO en raciones — y con D1-bis ya en el banco esto
  // deja de ser «falta el dato» para ser una VERDAD DE DISEÑO, medida el 2-ago sobre el banco
  // real con la vara por edad correcta (omnivora-2a2n, a1 45a · n1 8a · n2 3a):
  //     legumbre → n1 necesita 4 servicios para su mínimo (0,87 raciones c/u); a1 solo TOLERA 2
  //                (1,45 c/u, techo 4). huevo → los niños necesitan 3; a1 tolera 1 (2,07 c/u).
  // El mínimo infantil y el techo adulto del MISMO cubo no caben en la misma mesa mientras
  // todos coman la ración entera: un slot es un SERVICIO, y su conversión a raciones depende de
  // la FRACCIÓN que sirve T3 (spec §1-T3). Presupuestar el esqueleto en raciones lo vuelve
  // infactible por construcción (medido: 5/9 familias sin reparto legal, 20-28 s de DFS).
  // Reparto de responsabilidad, por tanto: T1 reserva SERVICIOS · T2 cuenta las raciones reales
  // por gramos servidos y DECLARA el choque (`techo-fraccional-vs-reserva`) · T3 lo resuelve con
  // fracciones · la batería A audita con la vara por edad (D1-bis, `harness/raciones.js`).
  // La infraestructura fraccional (pre.aporteCubo por miembro, MARGEN_TECHO_T1) queda viva para
  // que T3 la consuma. REPORTADO a Roger y QA-2 con los números.
  const pesoDe = () => 1;
  const pesoMax = () => 1;
  const margenTecho = 1;
  const asignacion = new Array(dominios.length).fill(null);
  let nodos = 0, motivoPoda = null;
  const mids = Object.keys(bandas);

  // PRECÓMPUTO de cotas: sufijos de presencia y de slots que pueden alimentar cada cubo. Sin
  // esto la poda costaba O(slots × cubos) por nodo y era el 90% del tiempo.
  const nS = dominios.length;
  const presentesEn = dominios.map(d => mids.filter(mid => presencia[mid][d.slot] === true));
  const cubosPorOpcion = dominios.map(d => d.opciones.map(o => cubosDe(o.categoria)));
  const sufPresencia = {}, sufCubo = {};
  for (const mid of mids) {
    sufPresencia[mid] = new Array(nS + 1).fill(0);
    sufCubo[mid] = {};
    for (const cubo of Object.keys(bandas[mid].cubos)) sufCubo[mid][cubo] = new Array(nS + 1).fill(0);
    for (let k = nS - 1; k >= 0; k--) {
      const presente = presencia[mid][dominios[k].slot] === true;
      sufPresencia[mid][k] = sufPresencia[mid][k + 1] + (presente ? 1 : 0);
      const alcanzables = new Set(presente ? cubosPorOpcion[k].flat() : []);
      for (const cubo of Object.keys(sufCubo[mid]))
        sufCubo[mid][cubo][k] = sufCubo[mid][cubo][k + 1] + (alcanzables.has(cubo) ? 1 : 0);
    }
  }

  // ¿quedan slots suficientes para que cada miembro alcance sus mínimos? (cotas, O(1) por cubo)
  // `falta` = nº de SLOTS aún necesarios (raciones pendientes / aporte máximo del cubo)
  function minimosAlcanzables(idx) {
    for (const mid of mids) {
      const banda = bandas[mid];
      const falta = {};
      for (const cubo in banda.cubos) {
        const f = banda.cubos[cubo].min - conteo[mid][cubo];
        falta[cubo] = f > 1e-9 ? Math.ceil(f / pesoMax(mid, cubo) - 1e-9) : 0;
        if (falta[cubo] && sufCubo[mid][cubo][idx] < falta[cubo]) {
          motivoPoda = `${mid} no puede alcanzar el mínimo de ${cubo}`; return false;
        }
      }
      // Slots que hacen falta como MÍNIMO: los de cada cubo propio, más lo que un agregado
      // todavía exija por encima de lo que ya cubren sus componentes (p. ej. pescado-total ≥2
      // con azul ≥1 pendiente = 1 slot extra). Sin esta parte la cota subestimaba y la búsqueda
      // se internaba en ramas muertas: 551k nodos en el peor caso, 24 con ella.
      let deficitTotal = 0;
      for (const cubo in falta) if (!AGREGADOS[cubo]) deficitTotal += falta[cubo];
      for (const [agg, componentes] of Object.entries(AGREGADOS)) {
        if (!falta[agg]) continue;
        const yaCubierto = componentes.reduce((s, c) => s + (falta[c] || 0), 0);
        deficitTotal += Math.max(0, falta[agg] - yaCubierto);
      }
      if (deficitTotal > sufPresencia[mid][idx]) { motivoPoda = `${mid} no tiene servicios suficientes para todos sus mínimos`; return false; }
    }
    return true;
  }

  // ORDEN DE VALORES. Manda la ROTACIÓN (variedad); el cierre de mínimos solo desempata cuando
  // ya aprieta. Probado el 1-ago: ordenar por «lo que cierra mínimos» primero hacía el solver
  // instantáneo pero devolvía esqueletos monótonos —solo `rapido`, jamás carne roja—, y eso deja
  // 52 elaboraciones del banco fuera del alcance de T2 (lo mediría la batería D). La velocidad
  // real venía de las cotas O(1) de arriba, no de este orden. No afecta a la EXACTITUD: se
  // prueban todas las opciones en cualquier orden; esto solo decide CUÁL de los repartos legales
  // se devuelve.
  function ordenar(idx) {
    const d = dominios[idx];
    const holgura = holguraDeMinimos(idx);      // 0 = aún sobra margen, 1 = ya hay que cerrar
    if (!holgura) return d.opciones;
    return d.opciones.map((o, i) => {
      let ayuda = 0;
      for (const mid of presentesEn[idx]) {
        const banda = bandas[mid];
        for (const cubo of cubosPorOpcion[idx][i])
          if (banda.cubos[cubo] && puede(mid, cubo) && conteo[mid][cubo] < banda.cubos[cubo].min - 1e-9) ayuda++;
      }
      return { o, i, ayuda };
    }).sort((a, b) => b.ayuda - a.ayuda || a.i - b.i).map(p => p.o);
  }

  // ¿queda holgura para elegir libremente, o los mínimos pendientes ya necesitan casi todos los
  // slots restantes? Con holgura manda la variedad; sin ella, cerrar la salud.
  function holguraDeMinimos(idx) {
    for (const mid of mids) {
      const falta = {};
      for (const cubo in bandas[mid].cubos) {
        const f = bandas[mid].cubos[cubo].min - conteo[mid][cubo];
        falta[cubo] = f > 1e-9 ? Math.ceil(f / pesoMax(mid, cubo) - 1e-9) : 0;
      }
      let deficit = 0;
      for (const cubo in falta) if (!AGREGADOS[cubo]) deficit += falta[cubo];
      for (const [agg, comp] of Object.entries(AGREGADOS)) {
        if (!falta[agg]) continue;
        deficit += Math.max(0, falta[agg] - comp.reduce((s, c) => s + (falta[c] || 0), 0));
      }
      // margen de UN slot: en cuanto los mínimos pendientes casi agotan los servicios que le
      // quedan, se cierra la salud primero. Antes esperaba a que fuera exacto y la búsqueda se
      // internaba en ramas muertas (562k nodos en el peor caso; con este margen, 24).
      if (deficit + 1 >= sufPresencia[mid][idx]) return true;
    }
    return false;
  }

  // cupo de elaborado: cuántos slots de finde quedan por delante para colocarlo
  const findeRestantes = new Array(nS + 1).fill(0);
  for (let k = nS - 1; k >= 0; k--)
    findeRestantes[k] = findeRestantes[k + 1] + (dominios[k].opciones.some(o => o.esfuerzo === 'elaborado') ? 1 : 0);
  let elaborados = 0;

  function dfs(idx) {
    if (++nodos > 2e6) return false;                      // backstop; jamás alcanzado en la parrilla
    if (idx === dominios.length) {
      for (const [mid, banda] of Object.entries(bandas))
        for (const [cubo, { min }] of Object.entries(banda.cubos))
          if (conteo[mid][cubo] < min - 1e-9) { motivoPoda = `${mid} cierra por debajo del mínimo de ${cubo}`; return false; }
      if (elaborados < cupoMin || elaborados > cupoMax) { motivoPoda = `no cabe el cupo de ${cupoMin}-${cupoMax} plato(s) elaborado(s) en comidas de finde`; return false; }
      return true;
    }
    if (!minimosAlcanzables(idx)) return false;
    if (elaborados > cupoMax) return false;
    if (elaborados + findeRestantes[idx] < cupoMin) {
      motivoPoda = `no quedan slots de finde para el cupo de elaborado`; return false;
    }
    const d = dominios[idx];
    // alternancia comida≠cena del mismo día
    const previoDelDia = idx > 0 && dominios[idx - 1].dia === d.dia ? asignacion[idx - 1] : null;
    const presentes = presentesEn[idx];
    for (const opcion of ordenar(idx)) {
      if (previoDelDia && previoDelDia.categoria === opcion.categoria) continue;
      const claveProf = `${opcion.categoria}|${d.servicio}|${opcion.esfuerzo}`;
      if (!cabeClave(claveProf)) { motivoPoda = motivoPoda || `profundidad agotada en ${claveProf}`; continue; }
      if (!cabeFrito(claveProf)) { motivoPoda = motivoPoda || `presupuesto de fritos agotado para ${claveProf}`; continue; }
      const cubos = cubosDe(opcion.categoria);
      // techos
      let excede = false;
      for (const mid of presentes) {
        const banda = bandas[mid];
        for (const cubo of cubos) if (banda.cubos[cubo] && puede(mid, cubo)
          && conteo[mid][cubo] + pesoDe(mid, cubo) > banda.cubos[cubo].max * margenTecho + 1e-9) { excede = true; break; }
        if (excede) break;
      }
      if (excede) { motivoPoda = motivoPoda || `techo alcanzado en ${opcion.categoria}`; continue; }
      if (opcion.esfuerzo === 'elaborado' && elaborados + 1 > cupoMax) continue;
      // aplicar
      const excesoFrito = esExceso(claveProf);
      for (const mid of presentes) for (const cubo of cubos) if (conteo[mid][cubo] != null && puede(mid, cubo)) conteo[mid][cubo] += pesoDe(mid, cubo);
      if (opcion.esfuerzo === 'elaborado') elaborados++;
      usosClave[claveProf] = (usosClave[claveProf] || 0) + 1;
      if (excesoFrito) fritosT1++;
      asignacion[idx] = opcion;
      if (dfs(idx + 1)) return true;
      asignacion[idx] = null;
      if (excesoFrito) fritosT1--;
      usosClave[claveProf]--;
      if (opcion.esfuerzo === 'elaborado') elaborados--;
      for (const mid of presentes) for (const cubo of cubos) if (conteo[mid][cubo] != null && puede(mid, cubo)) conteo[mid][cubo] -= pesoDe(mid, cubo);
    }
    return false;
  }

  if (!dfs(0)) return fallo('no existe reparto legal para la semana',
    motivoPoda || 'ninguna combinación satisface a la vez bandas, alternancia y pools', { nodos });

  return {
    ok: true,
    semana_iso, estacion, nodos,
    slots: dominios.map((d, i) => ({
      slot: d.slot, dia: d.dia, servicio: d.servicio,
      categoria: asignacion[i].categoria, esfuerzo: asignacion[i].esfuerzo,
      ancla: anclas[d.slot] ? anclas[d.slot].elaboracion_id : null
    })),
    reserva: conteo,                                     // lo que T2 tiene que respetar
    no_gobernados: SLOTS.filter(s => !activos.some(a => a.slot === s.slot)).map(s => s.slot)
  };
}

const fallo = (motivo, restriccion_vinculante, extra = {}) =>
  ({ ok: false, motivo, restriccion_vinculante, ...extra });

module.exports = { esqueleto, SLOTS, cubosDe, AGREGADOS };

  };

  /* ---- motor_v6/src/t2_relleno.js ---- */
  REG['t2_relleno'] = function (module, exports, require) {
// T2 · RELLENO de la semana (spec §1 segundo tiempo + §2-bis: la CARD). Dentro de la categoría
// y esfuerzo que T1 reservó por slot: elige la elaboración principal por coste S, resuelve el
// eje comensal a comensal, cierra los ejes del plato vía `combinaciones`, emite las notas de la
// card desde la resolución del prevuelo, postre por política (§6), escalera R1-R4 POR SLOT
// (Q6-A: se aplica donde se decide, declarada en el servicio) y re-verificación POR PRESENTE.
//
// Contratos C contados aquí (jamás coste): ventana dura M1 del percibido REAL (las opciones ya
// resueltas) · distancia M2 · origen M3 · techos fraccionales por miembro (roja y procesada del
// niño: innegociables) · fritos M6 · cupo de novedad P4 de menores (con descargo si es la única
// vía de cierre, patrón ancla-vs-techo).
//
// Aproximaciones v1 DECLARADAS (el harness las mide; se refinan si los números lo piden):
//  · most-constrained con orden estático inicial (nº de candidatos válidos al arrancar);
//  · origen dominante del candidato por su opción canónica (la moda de mesa la mide C);
//  · fritos como contador de MESA (la batería A pro-ratea por miembro);
//  · procesada del niño: ventana aproximada = P1 histórico no disponible ⇒ techo semanal
//    conservador PROCESADA_MENSUAL_NINO_MAX/4, declarado (T4/A miden la ventana real de 28d);
//  · el sustituto del excluido prefiere candidatos del mismo perfil (gesto compartido, G mide).
'use strict';
// Interruptores de depuración por variable de entorno. En NAVEGADOR no existe `process` y una
// referencia directa a `process.env` reventaba la generación entera con un ReferenceError
// (cazado el 3-ago al correr el bundle fuera de node, en el bloque 2). El motor tiene que
// correr igual en los dos sitios: es el mismo código, no dos.
const ENV = (typeof process !== 'undefined' && process.env) ? process.env : {};
const { cubosDe } = require('./t1_esqueleto.js');
const { costeS, politicaPostre } = require('./costes.js');
const { fechaDia } = require('./derivar.js');
const { racionParaLinea } = require('./raciones.js');

const DIA_MS = 86400000;
const ORDEN_CAL = [];
for (let d = 1; d <= 7; d++) for (const s of ['comida', 'cena']) ORDEN_CAL.push(`${d}-${s}`);

// `fijados` y `evitar` (spec §15.3, superficie): lo que permite RE-RESOLVER UN SOLO SLOT sin
// duplicar el relleno. `fijados` = { slot → servicio ya servido }: se precarga en el estado vivo
// con el MISMO `aplicar()` que un slot recién decidido —así variedad, techos y ventanas cuentan
// contra el resto de la semana— y queda FUERA del bucle de decisión, verbatim en la salida.
// `evitar` = { principales:Set, piezas:Set }: lo que el usuario acaba de rechazar. Sin estos dos
// parámetros el comportamiento es EXACTAMENTE el de siempre (generación de semana entera).
function rellenarSemana({ entrada, esq, pre, pools, datos, config, memoria, menuCole, fijados, evitar }) {
  const { semana_iso, familia, presencia, edades, estacion } = entrada;
  const semanaNum = Number(semana_iso.split('-W')[1]);
  const ix = indexar(datos);
  const mem = memoria || { mesa: { M1: {}, M2: {}, M3: null, M4: {}, M5: {}, M6: {}, M7: {}, M8: {} }, personas: {} };

  // ── estado vivo de la semana (muere al emitir: jamás se serializa — contrato anti-fuga)
  const st = {
    porSlot: {},                                    // slot → servicio construido
    minimos: {}, techos: {},                        // mid → cubo → raciones fraccionales
    minSvc: {},                                     // mid → cubo → nº de SERVICIOS que se lo dieron
    fritos: 0, dulces: 0, lacteos: 0,
    novedades: {},                                  // mid → n novedades servidas (menores)
    procesadaNino: {},                              // mid → raciones esta semana (aprox v1)
    percibidos: {},                                 // percibido principal → [dia…] (TODOS)
    elabServida: {},                                // elaboracion_id → [idxCal…] (TODOS)
    secPercibidos: {},                              // percibido secundaria/postre → [idxCal…] (TODOS)
    bigramas: {},                                   // principal+sec → n
    origenDeSlot: {},                               // slot calendario → origen dominante
    alimentosSemana: new Set(),
    costeBandaAcum: [], idxServicio: 0
  };
  for (const m of familia.miembros) { st.minimos[m.id] = {}; st.techos[m.id] = {}; st.minSvc[m.id] = {}; }

  // banderas de FALLBACK: se encienden cuando no hay pieza fuera de ventana M4 y se sirve la
  // cercana — eso ES una relajación R2 y se declara (jamás un silencio, doctrina §7)
  let sustUsoR2 = false, postreUsoR2 = false;

  // EL COLE DE ESTA SEMANA (spec §2-ter) no es memoria histórica: son servicios YA COLOCADOS en
  // el calendario de la semana que se está generando. Precargarlos con su idxCal hace que las
  // distancias bidireccionales (M1/M4) los vean igual que a los slots propios — sin esto, la
  // menestra del comedor del jueves reaparecía en la cena del jueves (medido con el menú real).
  const precargaCole = () => {
    if (!menuCole) return;
    for (const porDia of Object.values(menuCole)) {
      for (const [dia, plato] of Object.entries(porDia)) {
        const idxCal = ORDEN_CAL.indexOf(`${dia}-comida`);
        if (idxCal < 0) continue;
        for (const pe of plato || []) {
          const e = ix.elab[pe.elaboracion_id];
          if (!e) continue;
          const ops = pe.opciones_eje ? [...new Set(Object.values(pe.opciones_eje))] : [null];
          for (const op of ops) {
            const per = percibidoDe(pe.elaboracion_id, op);
            if (e.tipo === 'principal') (st.percibidos[per] = st.percibidos[per] || []).push(Number(dia));
            else (st.secPercibidos[per] = st.secPercibidos[per] || []).push(idxCal);
          }
          if (e.tipo === 'principal')
            (st.elabServida[pe.elaboracion_id] = st.elabServida[pe.elaboracion_id] || []).push(idxServDe(`${dia}-comida`));
        }
      }
    }
  };

  const slots = esq.slots.map(s => ({ ...s }));
  const activos = new Set(slots.map(s => s.slot));
  const fijos = fijados || {};
  const evitarPrincipales = evitar && evitar.principales;
  const evitarPiezas = evitar && evitar.piezas;

  // ── ÍNDICE EN SERVICIOS REALMENTE SERVIDOS (no posiciones de calendario).
  // La ventana M2 se mide en SERVICIOS: para una familia que solo cena en casa, «hace 4
  // servicios» son 4 cenas, no 4 casillas de una rejilla de 14 que nunca ocurren. El motor
  // usaba idxCal y además lo sumaba a `mem.mesa.M2[].servicios`, que memoria.js SÍ cuenta en
  // servicios servidos: mezcla de unidades que dejaba pasar repeticiones a 2-3 servicios en las
  // familias con presencia parcial (cazado por T4, 2-ago). Incluye los servicios del comedor
  // escolar: el niño come, luego cuentan en la secuencia.
  const servidosCal = [...new Set(slots.map(s => s.slot)
    .concat(menuCole ? Object.values(menuCole).flatMap(pd => Object.keys(pd).map(d => `${d}-comida`)) : []))]
    .sort((a, b) => ORDEN_CAL.indexOf(a) - ORDEN_CAL.indexOf(b));
  const IDX_SERV = {};
  servidosCal.forEach((s, i) => { IDX_SERV[s] = i; });
  // fallback para slots fuera del plan (no debería ocurrir): posición proporcional en calendario
  const idxServDe = slot => IDX_SERV[slot] != null ? IDX_SERV[slot]
    : Math.round(ORDEN_CAL.indexOf(slot) * servidosCal.length / ORDEN_CAL.length);
  const fechaDe = dia => fechaDia(semana_iso, dia).getTime() / DIA_MS;
  const tramoDe = mid => edades[mid] < config.EDAD_RACION_ADULTO ? 'nino' : 'adulto';
  const presentesDe = slot => familia.miembros.map(m => m.id).filter(mid => presencia[mid][slot] === true);

  // aporte fraccional del candidato: dominante/eje para MÍNIMOS, todo no-condimento para
  // TECHOS. POR MIEMBRO: sus gramos de línea (niño/adulto) ÷ SU ración de referencia
  // por edad (D1-bis). <3 años no tiene ración publicada ⇒ no computa cuotas (hueco declarado
  // por el prevuelo; jamás se extrapola).
  const cacheAporte = {};
  function aportes(c, mid) {
    const k = `${c.elaboracion_id}|${c.opcion}|${mid}`;
    if (cacheAporte[k]) return cacheAporte[k];
    const edad = edades[mid];
    const esNino = edad < config.EDAD_RACION_ADULTO;
    const minimos = {}, techos = {};
    const dominante = dominanteDe(ix, c.elaboracion_id, c.opcion);
    for (const l of lineasPlanas(ix, c.elaboracion_id)) {
      const alimentoId = Array.isArray(l.alternativas) ? c.opcion : l.alimento_id;
      const fila = ix.cat[alimentoId];
      if (!fila || l.papel === 'condimento') continue;
      const cubos = cubosDe(fila.categoria).filter(x => config.CUOTAS[x]);
      if (!cubos.length) continue;
      const racRef = racionParaLinea(datos, fila, edad);
      if (racRef.hueco) continue;
      let g = (esNino ? l.gramos_nino : l.gramos_adulto) * (l.escala || 1);
      if (fila.categoria === 'legumbre') g = g / config.FACTOR_LEGUMBRE_SECO_COCIDO;
      const rac = g / racRef.g;
      const esMin = Array.isArray(l.alternativas) || (dominante && dominante.linea === l);
      for (const cubo of cubos) {
        techos[cubo] = (techos[cubo] || 0) + rac;
        if (esMin) minimos[cubo] = (minimos[cubo] || 0) + rac;
      }
    }
    return cacheAporte[k] = { minimos, techos, categoria: ix.cat[dominante ? dominante.id : ''] };
  }

  // distancia M4 de una secundaria/postre: el MÍNIMO |Δ| contra TODOS sus índices de la semana
  // (el relleno no es cronológico: quedarse con el último registrado deja pasar repeticiones)
  // más el borde de la memoria de entrada. null = nunca visto.
  function distSec(per, idxCal) {
    const idxs = st.secPercibidos[per];
    let mejor = null;
    if (idxs && idxs.length) for (const i of idxs) {
      const d = Math.abs(idxCal - i);
      if (mejor == null || d < mejor) mejor = d;
    }
    const m = mem.mesa.M4[per];
    if (m) { const d = m.servicios + idxCal + 1; if (mejor == null || d < mejor) mejor = d; }
    return mejor;
  }

  // ── percibidos de mesa de un servicio propuesto (opciones únicas reales)
  const percibidoDe = (eid, op) => {
    const e = ix.elab[eid];
    if (!e) return eid;
    if (op == null) return eid;
    return (e.nombre_por_opcion || {})[op] || `${eid}×${op}`;
  };

  // distancia en días del percibido — BIDIRECCIONAL en calendario: el relleno no va en orden
  // temporal (most-constrained), así que «cerca» puede ser un slot ya relleno del futuro
  // El MÍNIMO |Δ| contra TODAS las apariciones de la semana, no contra la última registrada:
  // guardar una sola dejaba pasar la 3ª repetición de un percibido (cazado por T4, 2-ago). Misma
  // cicatriz que ya se curó en `distSec`; estaba sin curar en M1 y M2.
  function diasDesdePercibido(per, dia) {
    const dias = st.percibidos[per];
    let mejor = null;
    if (dias && dias.length) for (const d0 of dias) {
      const d = Math.abs(fechaDe(dia) - fechaDe(d0));
      if (mejor == null || d < mejor) mejor = d;
    }
    const m = mem.mesa.M1[per];
    // memoria.js mide `dias` desde el LUNES de la semana a generar ⇒ distancia real al día
    // `dia` = m.dias + (dia − 1). El +1 de más inflaba la distancia y colaba repeticiones a 6d.
    if (m != null) { const d = m.dias + (fechaDe(dia) - fechaDe(1)); if (mejor == null || d < mejor) mejor = d; }
    return mejor;
  }
  // distancia estructural M2 en SLOTS DE CALENDARIO (|Δ|, mismo motivo)
  function serviciosDesdeElab(eid, slotActual) {
    const idxServ = idxServDe(slotActual);            // servicios servidos, NO posiciones de calendario
    const idxs = st.elabServida[eid];
    let mejor = null;
    if (idxs && idxs.length) for (const i of idxs) {
      const d = Math.abs(idxServ - i);
      if (mejor == null || d < mejor) mejor = d;
    }
    const m = mem.mesa.M2[eid];                       // memoria.js también cuenta en servicios servidos
    if (m != null) { const d = m.servicios + idxServ + 1; if (mejor == null || d < mejor) mejor = d; }
    return mejor;                                     // M2 en servicios: el borde SÍ suma 1
  }

  // ── resolver el EJE comensal a comensal para un candidato (el foso)
  function resolverEje(c, presentes, relaj, s) {
    if (!ix.tieneEje[c.elaboracion_id]) return { opciones: null, divergencias: [] };
    const porMiembro = {}, divergencias = [];
    // §15.4 (`reescalarServicio`): quien YA estaba sentado conserva su opción mientras le siga
    // siendo legal — que vuelva papá no puede cambiarle el plato a nadie más. Solo se resuelve
    // de nuevo al que llega. Sin `opciones_previas` (el caso normal) esto no existe.
    const previas = (s && s.opciones_previas) || null;
    // ¿el cubo del candidato viene del EJE? (pizza×atún: sí; potaje×zanahoria: no — su cubo es
    // la legumbre fija). Solo entonces la opción del omnívoro se ata a la CATEGORÍA EXACTA
    // reservada — «algún cubo con banda» dejaba colar salmón (azul) en un slot de blanco y el
    // techo de azul reventaba (cazado en vivo, 7-comida de mesa-1).
    const catCanonica = ix.cat[c.opcion] && ix.cat[c.opcion].categoria;
    const ejeProteico = catCanonica != null && catCanonica === c.categoria;
    for (const mid of presentes) {
      if (pre.resolucion[mid][c.elaboracion_id].estado === 'excluido') continue;
      let legales = sinVariantesInnecesarias(pre.opcionesLegales[mid][c.elaboracion_id] || []);
      if (!legales.length) continue;                 // sin opción: quedará excluido→sustituto
      if (previas && previas[mid] != null
        && (pre.opcionesLegales[mid][c.elaboracion_id] || []).includes(previas[mid])) {
        porMiembro[mid] = previas[mid];
        continue;
      }
      const m = familia.miembros.find(x => x.id === mid);
      // omnívoro en eje proteico: su opción DENTRO de la categoría reservada si existe (la
      // reserva se cumple por construcción); si no → legal de otra CON descargo (H manda)
      let pool = legales;
      if (m.dieta === 'omnivora' && ejeProteico) {
        const delCubo = legales.filter(op => ix.cat[op] && ix.cat[op].categoria === c.categoria);
        if (delCubo.length) pool = delCubo;
        else divergencias.push({ tipo: 'divergencia-de-reserva', miembro: mid,
          detalle: `${mid} sin opción legal de ${c.categoria} en ${c.elaboracion_id}: se sirve fuera de reserva (H manda)` });
      }
      const ultima = ((mem.personas[mid] || {}).P2 || {})[c.elaboracion_id];
      const frescas = pool.filter(op => !ultima || ultima.opcion !== op);
      const candidatas = frescas.length ? frescas : pool;
      // avance de mínimos pendientes → temporada del alimento → rotación estable
      const rot = (semanaNum + st.idxServicio) % candidatas.length;
      const orden = candidatas.slice(rot).concat(candidatas.slice(0, rot));
      let mejor = orden[0], mejorAvance = -1;
      for (const op of orden) {
        const fila = ix.cat[op];
        const cubos = fila ? cubosDe(fila.categoria).filter(x => config.CUOTAS[x]) : [];
        let avance = 0;
        for (const cubo of cubos) {
          const banda = (pre.bandasEfectivas[mid] || {})[cubo];
          if (banda && (st.minimos[mid][cubo] || 0) < banda.min - 1e-9) avance++;
        }
        if (avance > mejorAvance) { mejorAvance = avance; mejor = op; }
      }
      porMiembro[mid] = mejor;
    }
    return { opciones: porMiembro, divergencias };
  }

  // ── contratos C sobre un candidato YA con opciones (ventanas con peldaños de la escalera)
  function contratos(c, opciones, presentes, s, relaj) {
    const dia = s.dia;
    const ventanaM1 = relaj.R3 ? 5 : config.VENTANAS.plato_dias;
    const pers = opciones ? [...new Set(Object.values(opciones))].map(op => percibidoDe(c.elaboracion_id, op))
      : [percibidoDe(c.elaboracion_id, c.opcion == null ? null : c.opcion)];
    for (const per of pers) {
      const d = diasDesdePercibido(per, dia);
      // el espejo R1 exime SOLO la distancia ≈7 con la semana anterior — jamás una repetición
      // cercana cualquiera (coló una a 1 día: el espejo era un pase global)
      if (d != null && d < ventanaM1 && !(relaj.R1 && d === 7))
        return `M1: ${per} visto hace ${d.toFixed(0)}d`;
    }
    const sm2 = serviciosDesdeElab(c.elaboracion_id, s.slot);
    if (sm2 != null && sm2 < config.VENTANAS.M2_servicios && !(relaj.R1 && esEspejo(c, dia)))
      return `M2: ${c.elaboracion_id} a ${sm2} servicios`;
    if (!relaj.R4) {
      // M3 sobre ADYACENTES TEMPORALES ya rellenos (el orden de relleno no es el de la semana):
      // servicio anterior y siguiente en el calendario
      const org = ix.origenDe[`${c.elaboracion_id}|${c.opcion}`];
      if (org) {
        const idxCal = ORDEN_CAL.indexOf(s.slot);
        for (const vecino of [ORDEN_CAL[idxCal - 1], ORDEN_CAL[idxCal + 1]]) {
          if (vecino && st.porSlot[vecino] && st.origenDeSlot[vecino] === org)
            return `M3: origen ${org} consecutivo con ${vecino}`;
        }
        if (idxCal === 0 && mem.mesa.M3 && mem.mesa.M3.origen === org && mem.mesa.M3.servicios === 0)
          return `M3: origen ${org} consecutivo con la semana anterior`;
      }
    }
    if (ix.esPesada(c.elaboracion_id) && st.fritos >= config.FRITOS_SEMANA_MAX) return 'M6: techo de fritos semanal';
    // techos fraccionales por presente APTO (roja y procesada: innegociables; el resto, banda)
    // — con PROYECCIÓN: el candidato debe dejar sitio para lo que los slots reservados
    // pendientes consumirán COMO MÍNIMO (cazado en vivo: una procesada de 3,2 raciones se comía
    // el techo de carne-total y el slot de roja reservado ya no cabía)
    for (const mid of presentes) {
      if (pre.resolucion[mid][c.elaboracion_id].estado === 'excluido') continue;
      const tramo = tramoDe(mid);
      const op = opciones ? opciones[mid] : null;
      const ap = aportes({ ...c, opcion: op != null ? op : c.opcion }, mid);
      for (const [cubo, rac] of Object.entries(ap.techos)) {
        const banda = (pre.bandasEfectivas[mid] || {})[cubo];
        if (!banda) continue;
        // roja y procesada: innegociables SIEMPRE. El resto de techos fraccionales pueden
        // chocar con la reserva del esqueleto (unidades D1-bis pendientes: 3 potajes del niño
        // = 4,35 raciones-adulto): ese choque se sirve CON DESCARGO, jamás mata la semana ni
        // pasa en silencio — T3 (fracciones) y D1-bis lo resuelven de raíz.
        const salud = cubo === 'carne-roja' || cubo === 'carne-procesada';
        // EL ANCLA MANDA (dictado Roger, spec §1.5): si el slot es anclado, el techo — salud
        // incluida — cede CON descargo humano, jamás se desobedece el ancla en silencio
        if ((st.techos[mid][cubo] || 0) + rac > banda.max + 1e-9)
          return { motivo: `techo de ${cubo} de ${mid}`, techoDeclarable: !salud || !!s.ancla, esAncla: !!s.ancla };
        if (banda.max < Infinity) {
          let pendienteMin = 0;
          for (const p of pendientes) {
            if (p.slot === s.slot || !presencia[mid][p.slot]) continue;
            if (!cubosDe(p.categoria).includes(cubo)) continue;
            const t = (pre.aporteCubo && pre.aporteCubo.min[cubo]) || {};
            pendienteMin += t[mid] || 0;
          }
          if ((st.techos[mid][cubo] || 0) + rac + pendienteMin > banda.max + 1e-9)
            return { motivo: `techo proyectado de ${cubo} de ${mid}`, techoDeclarable: !salud };
        }
      }
      if (tramo === 'nino') {
        const proc = (ap.techos['carne-procesada'] || 0);
        if (proc > 0 && (st.procesadaNino[mid] || 0) + proc > config.PROCESADA_MENSUAL_NINO_MAX / 4 + 1e-9)
          return { motivo: `procesada del niño ${mid} (techo mensual, aprox semanal)`,
            techoDeclarable: !!s.ancla, esAncla: !!s.ancla };   // solo el ancla lo vence, declarado
      }
      // MÍNIMOS PROYECTADOS por miembro (cazado por G: la pizza dio jamón al niño y su
      // pescado-azul murió sin declarar): servir este candidato debe dejar los mínimos
      // pendientes de CADA presente aún alcanzables con los slots que quedan. En SERVICIOS,
      // coherente con el interino de T1 (1 servicio ≈ 1 ración hasta D1-bis).
      for (const [cubo, banda] of Object.entries(pre.bandasEfectivas[mid] || {})) {
        if (!(banda.min > 0) || !(pre.puedeCubo[mid] || {})[cubo]) continue;
        const leDa = (ap.minimos[cubo] || 0) > 1e-9 ? 1 : 0;
        const pendiente = Math.ceil(banda.min - (st.minSvc[mid][cubo] || 0) - leDa - 1e-9);
        if (pendiente <= 0) continue;
        let capacidad = 0;
        for (const p of pendientes) {
          if (!presencia[mid][p.slot]) continue;
          if (cubosDe(p.categoria).includes(cubo)) capacidad++;
        }
        if (pendiente > capacidad)
          return `mínimo de ${cubo} de ${mid} moriría sirviendo esto (pendiente ${pendiente} > capacidad ${capacidad})`;
      }
    }
    return null;
  }
  // R1 · espejo: el mismo percibido EXACTAMENTE una semana antes (mismo día de la semana). Usa
  // `diasDesdePercibido` — UNA sola función de distancia para M1 y para el espejo: dos
  // implementaciones de la misma medida es cómo un `+1` sobrevivió a su propia corrección
  // (cazado por la QA-2 el 2-ago; blindaje suyo). Y `=== 7` en vez de `|d−7| ≤ 1`: con la
  // tolerancia, un miércoles y el martes siguiente (6 días) pasaban por «espejo» y R1 eximía
  // una repetición que NO es la misma cita semanal.
  const esEspejo = (c, dia) => {
    const per = percibidoDe(c.elaboracion_id, c.opcion);
    const d = diasDesdePercibido(per, dia);
    return d != null && d === 7;
  };

  // ── señales S del candidato con opciones
  function señales(c, opciones, s, finde) {
    const dia = s.dia;
    const pers = opciones ? [...new Set(Object.values(opciones))].map(op => percibidoDe(c.elaboracion_id, op))
      : [percibidoDe(c.elaboracion_id, c.opcion)];
    const dmin = pers.map(p => diasDesdePercibido(p, dia)).filter(d => d != null);
    const e = ix.elab[c.elaboracion_id];
    const alimentos = lineasPlanas(ix, c.elaboracion_id)
      .map(l => Array.isArray(l.alternativas) ? null : l.alimento_id).filter(Boolean);
    const solap = alimentos.length ? alimentos.filter(a => st.alimentosSemana.has(a)).length / alimentos.length : 0;
    const org = ix.origenDe[`${c.elaboracion_id}|${c.opcion}`];
    let sOrg = null;
    if (org) {                                       // distancia de origen en slots de CALENDARIO
      const idxCal = ORDEN_CAL.indexOf(s.slot);
      for (let i = idxCal - 1; i >= 0; i--)
        if (st.origenDeSlot[ORDEN_CAL[i]] === org) { sOrg = idxCal - i; break; }
    }
    const media = st.costeBandaAcum.length ? st.costeBandaAcum.reduce((s, x) => s + x, 0) / st.costeBandaAcum.length : 2;
    let avance = 0;
    for (const mid of Object.keys(pre.bandasEfectivas)) {
      const op = opciones && opciones[mid] != null ? opciones[mid] : c.opcion;
      const ap = aportes({ ...c, opcion: op }, mid);
      for (const [cubo, rac] of Object.entries(ap.minimos)) {
        const banda = pre.bandasEfectivas[mid][cubo];
        if (banda && (st.minimos[mid][cubo] || 0) < banda.min - 1e-9) avance += Math.min(rac, banda.min - (st.minimos[mid][cubo] || 0));
      }
    }
    let rotRep = 0, rotTot = 0;
    if (opciones) for (const [mid, op] of Object.entries(opciones)) {
      const ultima = ((mem.personas[mid] || {}).P2 || {})[c.elaboracion_id];
      rotTot++; if (ultima && ultima.opcion === op) rotRep++;
    }
    return {
      dias_desde_percibido: dmin.length ? Math.min(...dmin) : null,
      servicios_desde_origen: sOrg,
      avance_raciones: avance,
      temporada: c.temporada === estacion ? 0 : c.temporada == null ? 0.5 : 1,
      tiempo_min: e && e.tiempo_min != null ? e.tiempo_min : null,
      finde,
      rotacion_eje: rotTot ? rotRep / rotTot : null,
      desvio_coste: Math.abs((coste_banda(ix, c.elaboracion_id) || 2) - media),
      solapamiento: solap
    };
  }

  // ── COBERTURA DEL EJE FRUTA-VERDURA EN GRAMOS, no por etiqueta (spec §2-bis; bloqueante
  // cazado por Roger leyendo el menú, 2-ago). `ejes` decía la verdad de boquilla: la hamburguesa
  // declaraba cubrirlo con 30 g de lechuga y 50 g de tomate, ambos CONDIMENTO, frente a una
  // ración de 175 g — y salía sola en la comida del lunes. Mismo defecto que el difunto campo
  // `aporte` (BD_ESQUEMA §1.8). Aquí se cuentan gramos NO-condimento; una línea de eje solo
  // cuenta si TODAS sus opciones son fruta/verdura (peor caso: el motor elige después).
  // Solo se valida fruta-verdura: `cereal` y `tuberculo` no tienen ración de referencia en el
  // banco, así que hidrato no es medible todavía — declarado, no silenciado.
  const RACION_FV_ADULTO = 175;                    // verdura; la fruta (160) es más laxa
  const gramosFVCache = {};
  function gramosFV(eid, tramo) {
    const k = `${eid}|${tramo}`;
    if (gramosFVCache[k] != null) return gramosFVCache[k];
    const esFV = aid => { const f = ix.cat[aid]; return !!f && (f.categoria === 'verdura' || f.categoria === 'fruta'); };
    let g = 0;
    for (const l of lineasPlanas(ix, eid)) {
      if (l.papel === 'condimento') continue;
      const gr = (tramo === 'nino' ? l.gramos_nino : l.gramos_adulto) || 0;
      if (Array.isArray(l.alternativas)) { if (l.alternativas.every(esFV)) g += gr * (l.escala || 1); continue; }
      if (esFV(l.alimento_id)) g += gr * (l.escala || 1);
    }
    return (gramosFVCache[k] = g);
  }
  // ¿el conjunto de piezas cubre fruta-verdura EN GRAMOS para el tramo dado?
  const cubreFV = (ids, tramo) => {
    const umbral = RACION_FV_ADULTO * config.EJE_MIN_FRACCION;
    return ids.reduce((s, id) => s + gramosFV(id, tramo), 0) >= umbral;
  };

  // ── cierre del plato: ejes que faltan → guarniciones vía combinaciones
  function cerrarPlato(c, presentes, s, relaj) {
    const dia = s.dia;
    // §15.4 (`reescalarServicio`): «mismo plato, mesa real». Las guarniciones NO se re-eligen —
    // se conservan tal cual y solo se recalcula a quién se le sirve cada una (`solo-para`) y qué
    // notas de adaptación le tocan a cada presente. Es la MISMA emisión de notas de siempre, con
    // el pool reducido a lo que ya hay en la mesa.
    if (s.piezas_fijas) return cerrarPlatoFijado(presentes, s);
    const e = ix.elab[c.elaboracion_id];
    const cubiertos = new Set(e.ejes || []);
    // la etiqueta no basta para fruta-verdura: si los gramos no llegan, el eje NO está cubierto
    if (cubiertos.has('fruta-verdura') && !cubreFV([c.elaboracion_id], 'adulto')) cubiertos.delete('fruta-verdura');
    const falta = ['proteina', 'hidrato', 'fruta-verdura'].filter(x => !cubiertos.has(x));
    if (!falta.length) return { piezas: [], notas: [], usoR2: false };
    const comb = ix.comb[c.elaboracion_id] || {};
    const piezas = [], notas = [];
    let usoR2 = false;
    // §15.3: con el plato FIJADO por la familia, un eje que no se puede cerrar se DECLARA y el
    // servicio sale igual — «los ejes se declaran como desvío y no impiden nada». Sin esto,
    // pedir salmón al horno un día sin guarnición disponible devolvía «no hay alternativa»
    // (cazado por la suite de la superficie). En la generación normal `abierto()` no existe: el
    // candidato sigue cayendo y T2 prueba el siguiente, que es lo correcto cuando elige el motor.
    const ejesAbiertos = [];
    const abierto = eje => { if (!s.ancla_libre) return false; ejesAbiertos.push(eje); return true; };
    for (const eje of falta) {
      let pool = [];
      if (eje === 'hidrato') pool = (comb.admite_base_hidrato || []).map(id => ix.elab[id]).filter(Boolean)
        .filter(x => x.tipo === 'secundaria-hidrato' || x.tipo === 'secundaria-mixta');
      else if (eje === 'fruta-verdura') {
        const clase = comb.admite_base_fibra;
        if (clase && clase !== 'ninguna') pool = Object.values(ix.elab).filter(x =>
          (clase === 'ambas' && (x.tipo === 'secundaria-ensalada' || x.tipo === 'secundaria-verdura'))
          || (clase === 'ensalada' && x.tipo === 'secundaria-ensalada')
          || (clase === 'verdura' && x.tipo === 'secundaria-verdura'));
        // …y que la guarnición APORTE los gramos que dice su tipo: `ajo-blanco` es
        // `secundaria-verdura` con 0 g de verdura contable (todo condimento), y cerraba el eje
        // sobre el papel dejando 9 servicios por debajo de media ración. Si ninguna del pool
        // llega al umbral se conserva el pool entero: mejor una verdura floja que ninguna, y el
        // hueco queda visible en el gate de T4 en vez de tumbar el servicio.
        const conGramos = pool.filter(x => cubreFV([x.id], 'adulto'));
        if (conGramos.length) pool = conGramos;
      } else pool = [];                              // proteína la cubre el principal SIEMPRE (tipo)
      if (!pool.length && eje !== 'proteina') { if (abierto(eje)) continue; return null; }   // sin cierre → fuera
      if (!pool.length) continue;
      // servible + no repetida M4 + coste S de pieza; primero las que sirven a TODOS
      const distM4 = relaj.R2 ? 1 : config.VENTANAS.M4_servicios;
      const distM4Estricta = config.VENTANAS.M4_servicios;
      const idxCal = ORDEN_CAL.indexOf(s.slot);
      const fritosLlenos = st.fritos >= config.FRITOS_SEMANA_MAX;
      // M6 es un RECURSO ESCASO del plato entero (cazado en vivo: berenjenas fritas y patatas
      // fritas de guarnición vaciaban el presupuesto y los slots de huevo morían): guarnición
      // pesada solo acompaña a un principal YA pesado (el servicio cuenta 1 frito igual) o
      // cuando el pool no tiene ligera
      const principalPesado = ix.esPesada(c.elaboracion_id);
      const hayLigera = pool.some(x => !ix.esPesada(x.id));
      const evaluar = pool.map(x => {
        if (evitarPiezas && evitarPiezas.has(x.id)) return null;   // §15.3 `guarnicion`: rota
        if (ix.esPesada(x.id) && (fritosLlenos || (!principalPesado && hayLigera))) return null;
        const excluidos = presentes.filter(mid => pre.resolucion[mid][x.id] == null
          || pre.resolucion[mid][x.id].estado === 'excluido'
          || (ix.tieneEje[x.id] && !(pre.opcionesLegales[mid][x.id] || []).length));
        if (excluidos.length === presentes.length) return null;
        const opMesa = ix.tieneEje[x.id]
          ? elegirOpcionMesa(x.id, presentes.filter(p => !excluidos.includes(p)))
          : null;
        if (ix.tieneEje[x.id] && opMesa == null) return null;
        const per = percibidoDe(x.id, opMesa);
        const uS = distSec(per, idxCal);
        if (uS != null && uS < distM4) return null;
        const soloConR2 = uS != null && uS < distM4Estricta;   // habría caído sin el peldaño
        const bg = `${c.elaboracion_id}+${x.id}`;
        const sen = señales({ elaboracion_id: x.id, opcion: opMesa, temporada: typeof x.temporada === 'string' ? x.temporada : null },
          opMesa ? Object.fromEntries(presentes.map(p => [p, opMesa])) : null, s, dia >= 6);
        const coste = costeS(sen, config).total + (st.bigramas[bg] || 0) * 64 + excluidos.length * 32;
        return { x, opMesa, excluidos, coste, soloConR2 };
      }).filter(Boolean).sort((a, b) => a.coste - b.coste
        || (a.x.id < b.x.id ? -1 : 1));
      const rot = evaluar.length ? (semanaNum + dia) % evaluar.length : 0;
      const elegida = evaluar.length ? evaluar[(0 + rot) % evaluar.length] : null;
      if (!elegida) { if (abierto(eje)) continue; return null; }
      if (elegida.soloConR2) usoR2 = true;
      piezas.push({ elaboracion_id: elegida.x.id,
        opciones_eje: elegida.opMesa != null ? { '*': elegida.opMesa } : null });
      if (elegida.excluidos.length) {
        notas.push({ tipo: 'solo-para', miembros: presentes.filter(p => !elegida.excluidos.includes(p)),
          elaboracion_id: elegida.x.id });
        // PAR COMPLEMENTARIO (cazado con el celíaco: la sopa de fideos iba solo-para el resto
        // y su eje hidrato quedaba descubierto): pieza B del MISMO eje, tal-cual para los
        // excluidos de la A. Sin pieza B posible (o sin hueco en las 3 del plato) el candidato
        // no cierra.
        const poolB = pool.filter(x => x.id !== elegida.x.id
          && !(evitarPiezas && evitarPiezas.has(x.id))
          && elegida.excluidos.every(mid => pre.resolucion[mid][x.id]
            && pre.resolucion[mid][x.id].estado === 'tal-cual'
            && (!ix.tieneEje[x.id] || (pre.opcionesLegales[mid][x.id] || []).length)));
        if (!poolB.length || 1 + piezas.length >= 3) { if (abierto(eje)) continue; return null; }
        // la pieza B respeta la MISMA distancia M4 que la A (computa en memorias vía plato[];
        // sin este filtro su elección era ciega a la repetición — pedido de auditoría QA-2)
        const bLejos = poolB.filter(x => {
          const per = percibidoDe(x.id, null);
          const u = distSec(per, idxCal);
          return u == null || u >= distM4;
        });
        const poolB2 = bLejos.length ? bLejos : (usoR2 = true, poolB);
        const xB = poolB2[(semanaNum + dia) % poolB2.length];
        const opB = ix.tieneEje[xB.id] ? elegirOpcionMesa(xB.id, elegida.excluidos) : null;
        if (ix.tieneEje[xB.id] && opB == null) return null;
        piezas.push({ elaboracion_id: xB.id, opciones_eje: opB != null ? { '*': opB } : null });
        notas.push({ tipo: 'solo-para', miembros: elegida.excluidos, elaboracion_id: xB.id });
      }
      for (const mid of presentes) {
        const r = pre.resolucion[mid][elegida.x.id];
        if (r && r.estado === 'adaptado') notas.push(...notasDeResolucion(mid, elegida.x.id, r, presentes));
      }
    }
    return { piezas, notas: dedupNotas(notas), usoR2, ejes_abiertos: ejesAbiertos };
  }
  // guarniciones YA servidas, con la mesa de hoy (§15.4). Una pieza que hoy no come nadie sale
  // del plato; una que come parte de la mesa lleva su `solo-para`; quien vuelve trae sus notas.
  function cerrarPlatoFijado(presentes, s) {
    const piezas = [], notas = [];
    for (const pf of s.piezas_fijas) {
      const eid = pf.elaboracion_id;
      const excluidos = presentes.filter(mid => !pre.resolucion[mid][eid]
        || pre.resolucion[mid][eid].estado === 'excluido'
        || (ix.tieneEje[eid] && !(pre.opcionesLegales[mid][eid] || []).length));
      if (excluidos.length === presentes.length) continue;
      const incluidos = presentes.filter(mid => !excluidos.includes(mid));
      let opciones = pf.opciones_eje || null;
      if (ix.tieneEje[eid]) {
        const previa = opciones ? (opciones['*'] || Object.values(opciones)[0]) : null;
        const sigueLegal = previa != null && incluidos.every(mid => (pre.opcionesLegales[mid][eid] || []).includes(previa));
        const op = sigueLegal ? previa : elegirOpcionMesa(eid, incluidos);
        if (op == null) continue;                     // hoy nadie puede una opción común: fuera
        opciones = { '*': op };
      }
      piezas.push({ elaboracion_id: eid, opciones_eje: opciones });
      if (excluidos.length) notas.push({ tipo: 'solo-para', miembros: incluidos, elaboracion_id: eid });
      for (const mid of incluidos) {
        const r = pre.resolucion[mid][eid];
        if (r && r.estado === 'adaptado') notas.push(...notasDeResolucion(mid, eid, r, presentes));
      }
    }
    return { piezas, notas: dedupNotas(notas), usoR2: false };
  }

  // variantes de restricción (sin-lactosa…) FUERA de la rotación de quien no las necesita
  // (cazado en vivo: yogur-sin-lactosa servido por rotación a una mesa sana): una opción que la
  // tabla `sustitutos` declara sustituto de OTRA opción legal disponible no es elegible
  const varianteDe = {};
  for (const f of datos.sustitutos || [])
    (varianteDe[f.sustituto_id] = varianteDe[f.sustituto_id] || new Set()).add(f.original);
  function sinVariantesInnecesarias(legales) {
    const filtradas = legales.filter(op => {
      const origs = varianteDe[op];
      return !origs || ![...origs].some(o => legales.includes(o));
    });
    return filtradas.length ? filtradas : legales;
  }

  // opción de MESA de una pieza con eje (Q3: única para todos): legal para TODOS los incluidos
  function elegirOpcionMesa(eid, incluidos) {
    if (!incluidos.length) return null;
    let comunes = null;
    for (const mid of incluidos) {
      const legales = new Set(pre.opcionesLegales[mid][eid] || []);
      comunes = comunes == null ? legales : new Set([...comunes].filter(x => legales.has(x)));
    }
    if (!comunes || !comunes.size) return null;
    const arr = sinVariantesInnecesarias([...comunes].sort());
    return arr[(semanaNum + st.idxServicio) % arr.length];
  }

  // notas de la card desde la resolución del prevuelo (variantes/vehículos/eliminar)
  function notasDeResolucion(mid, eid, r, presentes) {
    const out = [];
    for (const n of r.notas) {
      if (n.via === 'nota-eliminar') out.push({ tipo: 'eliminar', miembro: mid, elaboracion_id: eid, alimento_id: n.alimento });
      else if (n.via === 'variante-todos') out.push({ tipo: 'variante-todos', elaboracion_id: eid, alimento_id: n.alimento, sustituto_id: n.sustituto });
      else if (n.via === 'vehiculo-persona') out.push({ tipo: 'vehiculo-persona', miembro: mid, elaboracion_id: eid, alimento_id: n.alimento, sustituto_id: n.sustituto });
    }
    return out;
  }
  const dedupNotas = notas => {
    const vistos = new Set();
    return notas.filter(n => { const k = JSON.stringify(n); if (vistos.has(k)) return false; vistos.add(k); return true; });
  };

  // ── sustituto para el excluido: candidato comible por ÉL, mismo gesto si se puede, que
  //    cierre sus 3 ejes (reutilizando guarniciones de mesa que él coma)
  function sustitutoPara(mid, cPrincipal, piezasMesa, slot, dia) {
    const perfil = (ix.elab[cPrincipal.elaboracion_id].perfil_servicio || {}).estilo;
    // el plato sustituto viaja SIN notas (el contrato /2 no admite notas sobre elaboraciones
    // fuera del servicio) ⇒ solo elaboraciones TAL-CUAL para el beneficiario — un sustituto
    // «adaptado» emitía la panceta a la vegetariana (cazado por H y tipado del harness)
    const cands = pools.candidatos.filter(c =>
      (c.temporada == null || c.temporada === estacion)
      && c.apta.includes(slot.endsWith('comida') ? 'comida' : 'cena')
      && pre.resolucion[mid][c.elaboracion_id].estado === 'tal-cual'
      && (!ix.tieneEje[c.elaboracion_id] || (pre.opcionesLegales[mid][c.elaboracion_id] || []).length));
    if (!cands.length) return null;
    const puntuado = cands.map(c => {
      const per = percibidoDe(c.elaboracion_id, c.opcion);
      const d = diasDesdePercibido(per, dia);
      const mismoGesto = (ix.elab[c.elaboracion_id].perfil_servicio || {}).estilo === perfil ? 0 : 1;
      const frescura = d == null ? 0 : Math.max(0, (28 - d) / 28);
      return { c, coste: mismoGesto * 64 + frescura * 256 };
    }).sort((a, b) => a.coste - b.coste || (a.c.elaboracion_id < b.c.elaboracion_id ? -1 : 1));
    const elegido = puntuado[(semanaNum + dia) % Math.min(3, puntuado.length)].c;
    const op = ix.tieneEje[elegido.elaboracion_id]
      ? (pre.opcionesLegales[mid][elegido.elaboracion_id] || [])[0] : null;
    // el sustituto REEMPLAZA el plato entero para su miembro (semántica /2 consagrada: el
    // derivador no le sirve las guarniciones de mesa) ⇒ debe cerrar sus 3 ejes POR SÍ SOLO
    const plato = [{ elaboracion_id: elegido.elaboracion_id, opciones_eje: op != null ? { [mid]: op } : null }];
    const cubiertos = new Set(ix.elab[elegido.elaboracion_id].ejes || []);
    for (const eje of ['hidrato', 'fruta-verdura']) {
      if (cubiertos.has(eje)) continue;
      const pool = Object.values(ix.elab).filter(x =>
        (eje === 'hidrato' ? (x.tipo === 'secundaria-hidrato') : (x.tipo === 'secundaria-ensalada' || x.tipo === 'secundaria-verdura'))
        && pre.resolucion[mid][x.id] && pre.resolucion[mid][x.id].estado === 'tal-cual'
        && (!ix.tieneEje[x.id] || (pre.opcionesLegales[mid][x.id] || []).length));
      if (!pool.length) return null;
      const idxCalS = ORDEN_CAL.indexOf(slot);
      const lejos = pool.filter(x => {
        const per = percibidoDe(x.id, null);
        const u = distSec(per, idxCalS);
        return u == null || u >= config.VENTANAS.M4_servicios;
      });
      const poolM4 = lejos.length ? lejos : (sustUsoR2 = true, pool);
      const x = poolM4[(semanaNum + dia) % poolM4.length];
      const opX = ix.tieneEje[x.id] ? (pre.opcionesLegales[mid][x.id] || [])[0] : null;
      if (plato.length >= 3) break;
      plato.push({ elaboracion_id: x.id, opciones_eje: opX != null ? { [mid]: opX } : null });
      for (const ej of x.ejes || []) cubiertos.add(ej);
    }
    return plato;
  }

  // ── EL BUCLE: slots por orden most-constrained (estático v1), anclas primero.
  //    Los `fijados` (§15.3) no se deciden: ya están servidos y solo se precargan (más abajo).
  const orden = slots.filter(s => !fijos[s.slot]).sort((a, b) => {
    const anc = (b.ancla ? 1 : 0) - (a.ancla ? 1 : 0);
    if (anc) return anc;
    const na = candidatosDe(a).length, nb = candidatosDe(b).length;
    return na - nb || (a.slot < b.slot ? -1 : 1);
  });
  function candidatosDe(s, relaj) {
    const esfuerzoOK = c => c.esfuerzo === s.esfuerzo
      // R0: `medio` vale donde se prefirió `rapido` (jamás `elaborado` fuera de su cupo)
      || (relaj && relaj.R0 && s.esfuerzo === 'rapido' && c.esfuerzo === 'medio');
    // `ancla_libre` (§15.3, modo `asignar`): la familia ELIGE ese plato — apta y temporada son
    // preferencias, no seguridad, y no pueden convertir una elección explícita en un bloqueo
    // («aviso, jamás bloqueo»). Lo que NO cede nunca es `pre.servible`: ahí viven la alergia, la
    // dieta y el dato que falta.
    const libre = !!(s.ancla && s.ancla_libre);
    return pools.candidatos.map((c, i) => ({ c, i })).filter(({ c, i }) =>
      // `categoria_libre` (§15.3, «dame otra cosa» sin más platos de esa clase): antes que dejar
      // a la familia sin alternativa se abre la reserva de T1 y el cambio de tipo se DECLARA.
      (s.ancla ? c.elaboracion_id === s.ancla
        : (s.categoria_libre || c.categoria === s.categoria) && esfuerzoOK(c))
      && !(evitarPrincipales && evitarPrincipales.has(c.elaboracion_id))
      && (libre || c.apta.includes(s.servicio))
      && (libre || c.temporada == null || c.temporada === estacion)
      && pre.servible[s.slot] && pre.servible[s.slot].has(i));
  }

  // ── postre: clase por política sobre los slots activos (ANTES del bucle: los servicios la
  //    consumen al construirse)
  const clasesViables = {};
  for (const s of slots) {
    const presentes = presentesDe(s.slot);
    const v = new Set();
    for (const [pid, clase] of Object.entries(config.CLASE_POSTRE)) {
      const e = ix.elab[pid];
      if (!e) continue;
      const alguien = presentes.some(mid => pre.resolucion[mid][pid]
        && pre.resolucion[mid][pid].estado !== 'excluido'
        && (!ix.tieneEje[pid] || (pre.opcionesLegales[mid][pid] || []).length));
      if (alguien) v.add(clase);
    }
    clasesViables[s.slot] = v;
  }
  const politica = politicaPostre(slots.map(s => ({ slot: s.slot, dia: s.dia, servicio: s.servicio })),
    semanaNum, clasesViables, config);

  precargaCole();                                    // antes de rellenar: el cole ya está puesto
  // LOS SLOTS FIJADOS (§15.3): se aplican al estado vivo en orden de calendario ANTES del bucle,
  // con el mismo `aplicar()` que cualquier slot decidido — así el slot que sí se re-resuelve ve
  // la variedad, los techos y las ventanas del resto de la semana exactamente como las vería en
  // una generación completa. No se re-deciden ni se re-verifican: son lo que la familia ya tiene.
  for (const slot of ORDEN_CAL) {
    const sv = fijos[slot];
    const s = slots.find(x => x.slot === slot);
    if (!sv || !s) continue;
    st.porSlot[slot] = sv;
    aplicar(sv, s, presentesDe(slot));
  }
  const descargosEstructurales = pre.descargos.map(d => ({ tipo: d.tipo, miembro: d.miembro, detalle: d.detalle }));
  // escalera pública de la spec §7, aplicada POR SLOT (Q6-A). R0 = esfuerzo: T2 puede servir
  // `medio` donde T1 prefirió `rapido` (cazado con mesa-6: tres huevos rápidos con una sola
  // elaboración ligera — la flamenca, de esfuerzo medio, salva el slot). Jamás `elaborado`
  // fuera de su cupo.
  const RELAJACIONES = [{}, { R0: true }, { R0: true, R1: true }, { R0: true, R1: true, R2: true },
    { R0: true, R1: true, R2: true, R3: true }, { R0: true, R1: true, R2: true, R3: true, R4: true }];
  const PELDANO = [null, 'R0', 'R1', 'R2', 'R3', 'R4'];

  // intentos de un slot con el ESTADO ACTUAL: lista aplanada (nivel de escalera × candidato),
  // ordenada por coste dentro de cada nivel y con la rotación semanal, sin duplicar candidatos
  // que ya pasaron en un nivel más bajo. Los `rechazos` alimentan el fallo con nombre.
  function intentosDe(s, rechazos) {
    const presentes = presentesDe(s.slot);
    const finde = s.dia >= 6;
    const out = [];
    const vistos = new Set();
    for (let nivel = 0; nivel < RELAJACIONES.length; nivel++) {
      const relaj = RELAJACIONES[nivel];
      const evaluados = [];
      for (const { c } of candidatosDe(s, relaj)) {
        const k = `${c.elaboracion_id}|${c.opcion}`;
        if (vistos.has(k)) continue;
        const eje = resolverEje(c, presentes, relaj, s);
        const res = contratos(c, eje.opciones, presentes, s, relaj);
        if (ENV.E3F_DEBUG_SLOT === s.slot)
          console.error(`[debug ${s.slot} n${nivel}] ${k}: ${res ? (typeof res === 'string' ? res : res.motivo) : 'contratos OK'}`);
        let descargoTecho = null;
        if (res) {
          const motivo = typeof res === 'string' ? res : res.motivo;
          // techo no-salud en el ÚLTIMO nivel: candidato de RESERVA con descargo (jamás mata
          // la semana ni pasa en silencio). En slot ANCLADO el techo cede en CUALQUIER nivel
          // (el ancla manda — sin esperar peldaños que no hacen falta).
          // Y con `ancla_libre` (§15.3: el plato lo ha FIJADO la familia) cede TODO contrato C
          // —variedad, mínimos, techos— porque el dictado es «aviso, JAMÁS bloqueo»: lo que la
          // familia pide se sirve y lo que se cede se DECLARA. Sin el flag, nada cambia.
          if (s.ancla_libre) descargoTecho = motivo;
          else if (typeof res === 'object' && res.techoDeclarable
            && (nivel === RELAJACIONES.length - 1 || res.esAncla))
            descargoTecho = motivo;
          else {
            if (nivel === RELAJACIONES.length - 1) rechazos[motivo.split(':')[0]] = (rechazos[motivo.split(':')[0]] || 0) + 1;
            continue;
          }
        }
        const cierre = cerrarPlato(c, presentes, s, relaj);
        if (cierre == null) { if (nivel === RELAJACIONES.length - 1) rechazos['sin-cierre-de-ejes'] = (rechazos['sin-cierre-de-ejes'] || 0) + 1; continue; }
        const sen = señales(c, eje.opciones, s, finde);
        const excluidos = presentes.filter(mid => pre.resolucion[mid][c.elaboracion_id].estado === 'excluido'
          || (ix.tieneEje[c.elaboracion_id] && !(pre.opcionesLegales[mid][c.elaboracion_id] || []).length));
        const novedadExcedida = presentes.some(mid => tramoDe(mid) === 'nino' && !excluidos.includes(mid)
          && esNovedadPara(mid, c, eje.opciones) && (st.novedades[mid] || 0) >= config.P4_NOVEDAD_SEMANA);
        vistos.add(k);
        evaluados.push({ c, eje, cierre, excluidos, novedadExcedida, nivel, descargoTecho,
          coste: costeS(sen, config).total + excluidos.length * 128 + (novedadExcedida ? 512 : 0)
            + (descargoTecho ? 4096 : 0) });
      }
      evaluados.sort((a, b) => a.coste - b.coste || (a.c.elaboracion_id < b.c.elaboracion_id ? -1 : 1)
        || ((a.c.opcion || '') < (b.c.opcion || '') ? -1 : 1));
      if (evaluados.length) {
        const rot = semanaNum % Math.min(3, evaluados.length);
        out.push(...evaluados.slice(rot), ...evaluados.slice(0, rot));
      }
    }
    return out;
  }

  // ── BACKTRACKING acotado con snapshots (BACKTRACK_MAX_NODOS es backstop anti-patología; el
  //    relleno greedy se pintaba callejones REALES: los techos los consume todo gramo — también
  //    el embutido del potaje suma carne-total — y sin vuelta atrás la semana moría)
  let nodos = 0;
  const pila = [];                                   // por slot: {intentos, cursor, snapshot, rechazos}
  let k = 0;
  const agotados = {};                               // slot → {veces, rechazos agregados} — el
  let pendientes = [];                               //   CUELLO real, no el último de la pila
  while (k < orden.length) {
    pendientes = orden.slice(k + 1);
    if (!pila[k]) {
      const rechazos = {};
      pila[k] = { intentos: intentosDe(orden[k], rechazos), cursor: 0,
        snapshot: structuredClone(st), rechazos };
    }
    const marco = pila[k];
    if (marco.cursor >= marco.intentos.length) {
      const ag = agotados[orden[k].slot] = agotados[orden[k].slot] || { s: orden[k], veces: 0, rechazos: {} };
      ag.veces++;
      for (const [m, n] of Object.entries(marco.rechazos)) ag.rechazos[m] = (ag.rechazos[m] || 0) + n;
      if (k === 0) break;
      k--;                                           // backtrack: el slot anterior prueba otro
      Object.assign(st, structuredClone(pila[k].snapshot));
      pila[k].cursor++;
      pila.length = k + 1;                           // los marcos posteriores quedan obsoletos
      continue;
    }
    if (++nodos > (config.BACKTRACK_MAX_NODOS || 20000)) break;
    const s = orden[k];
    const el = marco.intentos[marco.cursor];
    const servicio = construirServicio(s, el, presentesDe(s.slot), RELAJACIONES[el.nivel], PELDANO[el.nivel]);
    if (!servicio) {
      marco.rechazos['sustituto-imposible'] = (marco.rechazos['sustituto-imposible'] || 0) + 1;
      marco.cursor++; continue;
    }
    st.porSlot[s.slot] = servicio;
    aplicar(servicio, s, presentesDe(s.slot));
    if (ENV.E3F_DEBUG_ORDEN)
      console.error(`[orden ${k}] ${s.slot} (${s.categoria}/${s.esfuerzo}) → ${servicio.plato.map(p => p.elaboracion_id).join('+')} · fritos=${st.fritos}`);
    k++;
  }
  if (k < orden.length) {
    const cuello = Object.values(agotados).sort((a, b) => b.veces - a.veces)[0]
      || { s: orden[k], veces: 0, rechazos: {} };
    return fallo(semana_iso,
      `sin reparto legal tras escalera R1-R4 y backtracking (${nodos} nodos) — cuello: ${cuello.s.slot} `
      + `(${cuello.s.categoria}/${cuello.s.esfuerzo}) agotado ×${cuello.veces}, rechazos: ${JSON.stringify(cuello.rechazos)}`,
      { slot: cuello.s.slot, categoria: cuello.s.categoria });
  }
  // los descargos estructurales del prevuelo viajan en el primer servicio del calendario
  if (descargosEstructurales.length) {
    const primero = ORDEN_CAL.map(sl => st.porSlot[sl]).find(Boolean);
    if (primero) primero.descargos.push(...descargosEstructurales);
  }
  // RED FINAL: mínimo que aun así quedó sin cubrir → descargo declarado en el último servicio
  // (jamás en silencio; el detalle usa «alcanzar <cubo>», el formato que la batería G exime)
  const ultimoSv = [...ORDEN_CAL].reverse().map(sl => st.porSlot[sl]).find(Boolean);
  if (ultimoSv) for (const [mid, bandas] of Object.entries(pre.bandasEfectivas)) {
    for (const [cubo, banda] of Object.entries(bandas)) {
      if (!(banda.min > 0)) continue;
      const recibido = st.minSvc[mid][cubo] || 0;
      if (recibido < banda.min - 1e-9)
        ultimoSv.descargos.push({ tipo: 'minimo-no-cubierto', miembro: mid,
          detalle: `${mid} no puede alcanzar ${cubo} esta semana (${recibido}/${banda.min.toFixed(1)} servicios): divergencia de eje o pool — se compensa vía memoria` });
    }
  }

  function esNovedadPara(mid, c, opciones) {
    const op = opciones ? opciones[mid] : c.opcion;
    const per = percibidoDe(c.elaboracion_id, op != null ? op : c.opcion);
    const P = mem.personas[mid];
    const vistos = P && P.P4 ? new Set(P.P4.map(x => x.percibido)) : new Set();
    return !vistos.has(per) && !(st.percibidos[per] != null);
  }

  function construirServicio(s, el, presentes, relaj, peldano) {
    const { c, eje, cierre, excluidos } = el;
    const plato = [{ elaboracion_id: c.elaboracion_id,
      opciones_eje: eje.opciones && Object.keys(eje.opciones).length ? eje.opciones : (ix.tieneEje[c.elaboracion_id] ? null : null) }];
    plato.push(...cierre.piezas);
    const notas = [...cierre.notas];
    const relajaciones = [], descargos = [];
    for (const d of eje.divergencias) descargos.push({ tipo: d.tipo, miembro: d.miembro, detalle: d.detalle });
    if (el.novedadExcedida) descargos.push({ tipo: 'cupo-novedad-excedido',
      detalle: `única vía de cierre del slot ${s.slot}: se sirve novedad sobre el cupo P4` });
    // el TIPO del descargo lo dicta el contrato que cedió, no el mecanismo: un M1 que cede es
    // variedad, no un techo. En la generación normal `descargoTecho` solo lleva techos, así que
    // esto es idéntico a lo de siempre; con `ancla_libre` (§15.3) puede llevar cualquiera.
    if (el.descargoTecho) {
      const m = el.descargoTecho;
      const tipo = /^M[1-9]/.test(m) ? 'variedad-cedida'
        : /^mínimo /.test(m) ? 'minimo-no-cubierto'
          : s.ancla ? 'ancla-vs-techo' : 'techo-fraccional-vs-reserva';
      descargos.push({ tipo, detalle: tipo === 'ancla-vs-techo'
        ? `${m} — el ancla ${s.ancla} manda (dictado): el techo cede declarado`
        : tipo === 'techo-fraccional-vs-reserva'
          ? `${m} — la reserva del esqueleto choca con las raciones reales (D1-bis pendiente); T3 ajustará con fracciones`
          : `${m} — el plato ${s.ancla} lo ha fijado la familia (§15.3): se sirve y se declara` });
    }
    // RELAJACIONES REALMENTE USADAS, no las del nivel donde se encontró el candidato. Medido
    // 2-ago: declarar el nivel entero ponía R0-R4 en el 57% de los servicios para UNA violación
    // real de origen en 224 — ruido que contamina el recuento honesto que leen C y G. Ahora se
    // re-verifica el candidato ELEGIDO sin relajación y solo se declara el peldaño que lo salva:
    //   R0 esfuerzo (sirvió `medio` donde T1 pidió `rapido`) · R1/R3 memoria del plato (M1/M2) ·
    //   R2 distancia de guarnición (M4, cuando el cierre la necesitó) · R4 origen (M3).
    const FRASES = {
      R0: 'Un plato de un poco más de cocina en un día de diario, para que todo cuadre.',
      R1: 'Repetimos un plato de la semana pasada que funcionó.',
      R2: 'Una guarnición vuelve algo antes de lo habitual.',
      R3: 'Hemos acercado un plato que gustó hace poco.',
      R4: 'Hemos aflojado un poco la variedad para cuadrar la semana.'
    };
    const usados = new Set();
    sustUsoR2 = false;
    if (relaj.R0 && c.esfuerzo !== s.esfuerzo) usados.add('R0');
    if (peldano) {
      const sinRelajar = contratos(c, eje.opciones, presentes, s, {});
      const motivo = sinRelajar && (typeof sinRelajar === 'string' ? sinRelajar : sinRelajar.motivo);
      if (motivo) {
        if (/^M1/.test(motivo)) { if (relaj.R3) usados.add('R3'); else if (relaj.R1) usados.add('R1'); }
        else if (/^M2/.test(motivo)) { if (relaj.R1) usados.add('R1'); if (relaj.R3) usados.add('R3'); }
        else if (/^M3/.test(motivo) && relaj.R4) usados.add('R4');
      }
    }
    if (cierre.usoR2) usados.add('R2');
    // un eje que se quedó sin cerrar porque el plato lo fijó la familia (§15.3): se DECLARA
    for (const eje of cierre.ejes_abiertos || []) descargos.push({ tipo: 'eje-abierto',
      detalle: `${eje} sin cerrar en ${s.slot}: no había acompañamiento disponible para el plato que has fijado` });
    // notas del principal (adaptaciones del prevuelo) + sustitutos de excluidos
    for (const mid of presentes) {
      const r = pre.resolucion[mid][c.elaboracion_id];
      if (r && r.estado === 'adaptado') notas.push(...notasDeResolucion(mid, c.elaboracion_id, r, presentes));
    }
    for (const mid of excluidos) {
      const platoSust = sustitutoPara(mid, c, cierre.piezas, s.slot, s.dia);
      if (!platoSust) return null;                   // sin sustituto no hay servicio legal
      notas.push({ tipo: 'sustituto', miembro: mid, ambito: 'plato', plato: platoSust });
    }
    // postre por política (la clase la trae la pasada previa de política, ver abajo)
    const postreInfo = postrePara(s, presentes);
    if (sustUsoR2 || postreUsoR2) usados.add('R2');
    for (const p of ['R0', 'R1', 'R2', 'R3', 'R4']) {
      if (!usados.has(p)) continue;
      relajaciones.push({ peldano: p,
        detalle: `escalera aplicada en ${s.slot} para poder cerrar (Q6-A: donde se decide)`,
        frase: FRASES[p] });
    }
    return { dia: s.dia, servicio: s.servicio, plato, postre: postreInfo.postre,
      relajaciones, descargos: descargos.concat(postreInfo.descargos), notas: dedupNotas(notas.concat(postreInfo.notas)), no_servido: null };
  }

  // ── postre concreto por servicio (la CLASE viene de la política computada arriba)
  function postrePara(s, presentes) {
    postreUsoR2 = false;
    const clase = politica.porSlot[s.slot];
    const notas = [], descargos = [];
    // §15.4: con postre YA servido, la clase de la política no vuelve a decidir nada — el postre
    // es el que hay; lo único que se recalcula son sus opciones y sus notas con la mesa de hoy.
    if (s.postre_fijo) return postrePorId(s.postre_fijo.elaboracion_id, s, presentes, notas, descargos);
    if (clase == null) return { postre: null, notas, descargos: [{ tipo: 'postre-inviable', detalle: `sin clase de postre comible en ${s.slot}` }] };
    const deClase = Object.entries(config.CLASE_POSTRE).filter(([, c]) => c === clase).map(([pid]) => pid)
      .filter(pid => ix.elab[pid]);
    // el postre de mesa con ventana M4 REAL (cazado en vivo: macedonia ×5/semana): un postre
    // SIN eje se percibe por id y la ventana lo gobierna; uno CON eje rota por opción (manzana
    // ≠ pera, vara C) y el envoltorio no bloquea
    const idxCal = ORDEN_CAL.indexOf(s.slot);
    const orden = deClase.map(pid => {
      const per = percibidoDe(pid, null);
      // distancia M4 del postre: semana en curso Y memoria de entrada (sin ella, la macedonia
      // volvía cada lunes — medido 2-ago)
      const d = distSec(per, idxCal);
      const u = ix.tieneEje[pid] ? Infinity : (d == null ? Infinity : d);
      return { pid, u };
    }).sort((a, b) => b.u - a.u || (a.pid < b.pid ? -1 : 1));
    const validos = orden.filter(o => o.u >= config.VENTANAS.M4_servicios);
    const pool = validos.length ? validos : (postreUsoR2 = true, orden);
    return postrePorId(pool[(semanaNum + s.dia) % pool.length].pid, s, presentes, notas, descargos);
  }

  // el postre YA elegido, resuelto comensal a comensal (opción de eje, fruta individual del que
  // no puede la clase, notas de adaptación). Es el cuerpo de siempre de `postrePara`, extraído
  // para que §15.4 pueda entrar por aquí con un postre dado sin duplicar una línea.
  function postrePorId(pid, s, presentes, notas, descargos) {
    if (!ix.elab[pid]) return { postre: null, notas: [], descargos: [{ tipo: 'postre-inviable', detalle: `${pid} no existe en el banco del hogar` }] };
    const idxCal = ORDEN_CAL.indexOf(s.slot);
    const opciones = {};
    let algunoDentro = false;
    for (const mid of presentes) {
      const r = pre.resolucion[mid][pid];
      const puede = r && r.estado !== 'excluido' && (!ix.tieneEje[pid] || (pre.opcionesLegales[mid][pid] || []).length);
      if (!puede) {
        // su postre individual: fruta legal (P2-rotada); si ni fruta, sin postre para él
        const frutas = sinVariantesInnecesarias(pre.opcionesLegales[mid]['postre-fruta'] || []);
        if (frutas.length) {
          const ultima = ((mem.personas[mid] || {}).P2 || {})['postre-fruta'];
          const frescas = frutas.filter(f => !ultima || ultima.opcion !== f);
          const eleg = (frescas.length ? frescas : frutas)[(semanaNum + s.dia) % (frescas.length ? frescas.length : frutas.length)];
          notas.push({ tipo: 'sustituto', miembro: mid, ambito: 'postre',
            postre: { elaboracion_id: 'postre-fruta', opciones_eje: { [mid]: eleg } } });
        } else descargos.push({ tipo: 'postre-inviable', miembro: mid, detalle: `${mid} sin clase ni fruta legal en ${s.slot}` });
        continue;
      }
      algunoDentro = true;
      if (ix.tieneEje[pid]) {
        // §15.4: la fruta que ya tenía servida no cambia porque hoy se siente otro a la mesa
        const previa = s.postre_fijo && s.postre_fijo.opciones_eje
          && (s.postre_fijo.opciones_eje[mid] || s.postre_fijo.opciones_eje['*']);
        if (previa != null && (pre.opcionesLegales[mid][pid] || []).includes(previa)) opciones[mid] = previa;
        else {
          // sin variantes de restricción innecesarias, sin repetir la última P2, y fuera de la
          // ventana M4 de la PROPIA semana (la uva no repite en servicios pegados)
          const enVentana = op => {
            const u = distSec(percibidoDe(pid, op), idxCal);
            return u != null && u < config.VENTANAS.M4_servicios;
          };
          let pool = sinVariantesInnecesarias(pre.opcionesLegales[mid][pid]);
          const ultima = ((mem.personas[mid] || {}).P2 || {})[pid];
          const frescas = pool.filter(f => (!ultima || ultima.opcion !== f) && !enVentana(f));
          pool = frescas.length ? frescas : pool.filter(f => !enVentana(f)).length ? pool.filter(f => !enVentana(f)) : pool;
          opciones[mid] = pool[(semanaNum + s.dia + mid.length) % pool.length];
        }
      }
      const r2 = pre.resolucion[mid][pid];
      if (r2 && r2.estado === 'adaptado') notas.push(...notasDeResolucion(mid, pid, r2, presentes));
    }
    if (!algunoDentro) return { postre: null, notas: [], descargos: [{ tipo: 'postre-inviable', detalle: `nadie puede ${pid} en ${s.slot}` }] };
    return { postre: { elaboracion_id: pid, opciones_eje: ix.tieneEje[pid] ? opciones : null }, notas, descargos };
  }

  // ── aplicar el servicio elegido al estado vivo (distancias SIEMPRE en calendario)
  function aplicar(sv, s, presentes) {
    const idxCal = ORDEN_CAL.indexOf(s.slot);
    for (const pe of sv.plato) {
      const e = ix.elab[pe.elaboracion_id];
      const ops = pe.opciones_eje ? [...new Set(Object.values(pe.opciones_eje))] : [null];
      for (const op of ops) {
        const per = percibidoDe(pe.elaboracion_id, op);
        if (e.tipo === 'principal') (st.percibidos[per] = st.percibidos[per] || []).push(s.dia);
        else (st.secPercibidos[per] = st.secPercibidos[per] || []).push(idxCal);
      }
      if (e.tipo === 'principal')
        (st.elabServida[pe.elaboracion_id] = st.elabServida[pe.elaboracion_id] || []).push(idxServDe(s.slot));
      for (const l of lineasPlanas(ix, pe.elaboracion_id))
        if (!Array.isArray(l.alternativas) && l.alimento_id) st.alimentosSemana.add(l.alimento_id);
      st.costeBandaAcum.push(coste_banda(ix, pe.elaboracion_id) || 2);
    }
    const principal = sv.plato[0];
    for (const pz of sv.plato.slice(1)) {
      const bg = `${principal.elaboracion_id}+${pz.elaboracion_id}`;
      st.bigramas[bg] = (st.bigramas[bg] || 0) + 1;
    }
    // las piezas de los platos SUSTITUTO cuentan en la ventana de guarnición como las de mesa
    for (const n of sv.notas || []) {
      if (n.tipo !== 'sustituto') continue;
      const piezasN = n.ambito === 'plato' ? (n.plato || []) : (n.postre ? [n.postre] : []);
      for (const pe of piezasN) {
        if ((ix.elab[pe.elaboracion_id] || {}).tipo === 'principal') continue;
        const ops = pe.opciones_eje ? [...new Set(Object.values(pe.opciones_eje))] : [null];
        for (const op of ops) { const k = percibidoDe(pe.elaboracion_id, op);
          (st.secPercibidos[k] = st.secPercibidos[k] || []).push(idxCal); }
      }
    }
    if (sv.plato.some(pe => ix.esPesada(pe.elaboracion_id))) st.fritos++;
    if (sv.postre) {
      // el postre se percibe por OPCIÓN (manzana ≠ pera, vara C): la fruta rota, el envoltorio no bloquea
      const opsP = sv.postre.opciones_eje ? [...new Set(Object.values(sv.postre.opciones_eje))] : [null];
      for (const op of opsP) { const k = percibidoDe(sv.postre.elaboracion_id, op);
        (st.secPercibidos[k] = st.secPercibidos[k] || []).push(idxCal); }
      const clase = config.CLASE_POSTRE[sv.postre.elaboracion_id];
      if (clase === 'dulce') st.dulces++;
    }
    st.origenDeSlot[s.slot] = ix.origenDe[`${principal.elaboracion_id}|${principal.opciones_eje ? Object.values(principal.opciones_eje)[0] : null}`] || null;
    // contadores por miembro (composición REAL: sustituto aparte, excluidos fuera)
    const sustDe = {};
    for (const n of sv.notas) if (n.tipo === 'sustituto' && n.ambito === 'plato') sustDe[n.miembro] = n;
    for (const mid of presentes) {
      const tramo = tramoDe(mid);
      const piezas = sustDe[mid] ? sustDe[mid].plato : sv.plato.filter(pe => {
        const soloPara = sv.notas.find(n => n.tipo === 'solo-para' && n.elaboracion_id === pe.elaboracion_id);
        if (soloPara && !soloPara.miembros.includes(mid)) return false;
        const r = pre.resolucion[mid][pe.elaboracion_id];
        return r && r.estado !== 'excluido';
      });
      for (const pe of piezas) {
        const op = pe.opciones_eje ? (pe.opciones_eje[mid] || pe.opciones_eje['*']) : null;
        const ap = aportes({ elaboracion_id: pe.elaboracion_id, opcion: op }, mid);
        for (const [cubo, r] of Object.entries(ap.minimos)) {
          st.minimos[mid][cubo] = (st.minimos[mid][cubo] || 0) + r;
          if (r > 1e-9) st.minSvc[mid][cubo] = (st.minSvc[mid][cubo] || 0) + 1;
        }
        for (const [cubo, r] of Object.entries(ap.techos)) {
          st.techos[mid][cubo] = (st.techos[mid][cubo] || 0) + r;
          if (cubo === 'carne-procesada' && tramo === 'nino') st.procesadaNino[mid] = (st.procesadaNino[mid] || 0) + r;
        }
        if (tramo === 'nino' && esNovedadPara(mid, { elaboracion_id: pe.elaboracion_id, opcion: op }, null))
          st.novedades[mid] = (st.novedades[mid] || 0) + 1;
      }
    }
    st.idxServicio++;
  }

  // ── RE-VERIFICACIÓN POR PRESENTE (doble contabilidad interna: divergencia = bug, se aborta)
  for (const s of slots) {
    const sv = st.porSlot[s.slot];
    if (!sv || fijos[s.slot]) continue;               // lo fijado ya se verificó al construirse
    // un slot con el plato FIJADO por la familia (§15.3) puede salir con un eje abierto: ya está
    // DECLARADO como descargo arriba, y abortar aquí convertiría el aviso en el bloqueo que el
    // dictado prohíbe. La doble contabilidad sigue intacta donde decide el motor, que es su sitio.
    if (s.ancla_libre) continue;
    const presentes = presentesDe(s.slot);
    const sustDe = {};
    for (const n of sv.notas) if (n.tipo === 'sustituto' && n.ambito === 'plato') sustDe[n.miembro] = n;
    for (const mid of presentes) {
      const piezas = sustDe[mid] ? sustDe[mid].plato : sv.plato.filter(pe => {
        const sp = sv.notas.find(n => n.tipo === 'solo-para' && n.elaboracion_id === pe.elaboracion_id);
        if (sp && !sp.miembros.includes(mid)) return false;
        const r = pre.resolucion[mid][pe.elaboracion_id];
        return r && r.estado !== 'excluido';
      });
      if (!piezas.length) throw new Error(`re-verificación: ${mid} sin composición en ${s.slot}`);
      const ejes = new Set();
      for (const pe of piezas) for (const ej of (ix.elab[pe.elaboracion_id].ejes || [])) ejes.add(ej);
      for (const eje of ['proteina', 'hidrato', 'fruta-verdura'])
        if (!ejes.has(eje)) throw new Error(`re-verificación: ${mid} sin eje ${eje} en ${s.slot} (${piezas.map(p => p.elaboracion_id).join('+')})`);
    }
  }

  // ── serialización de la semana (14 slots SIEMPRE)
  const servicios = [];
  for (let d = 1; d <= 7; d++) for (const sv of ['comida', 'cena']) {
    const slot = `${d}-${sv}`;
    if (st.porSlot[slot]) servicios.push(st.porSlot[slot]);
    else servicios.push({ dia: d, servicio: sv, plato: null, postre: null,
      relajaciones: [], descargos: [], notas: [],
      no_servido: activos.has(slot) ? 'sin-presentes' : 'no-gobernado' });
  }

  // ── CIERRE: la declaración va donde el LECTOR ve la repetición.
  // El relleno es most-constrained, no cronológico: el peldaño se aplica y se anota en el
  // servicio donde se DECIDE (Q6-A), que a menudo es el ANTERIOR del par. Quien lee el menú en
  // orden encuentra entonces «hemos acercado un plato que gustó hace poco» en la primera
  // aparición —donde aún no se ha repetido nada— y ninguna explicación en la segunda, que es
  // la que chirría. Esta pasada no cambia ni un plato: copia el peldaño ya usado al extremo
  // posterior del par. Sin esto, T4 las cuenta como relajaciones silenciosas, y con razón.
  const FRASE_VAR = { R1: 'Repetimos un plato de la semana pasada que funcionó.',
    R3: 'Hemos acercado un plato que gustó hace poco.' };
  const conPlato = servicios.filter(s => s.plato);
  const vistoPer = {}, vistoElab = {};
  conPlato.forEach((sv, i) => {
    const anota = (p) => {
      if ((sv.relajaciones || []).some(r => r.peldano === p)) return;
      sv.relajaciones.push({ peldano: p, frase: FRASE_VAR[p],
        detalle: `escalera aplicada para poder cerrar; declarada aquí porque es donde se percibe la repetición` });
    };
    for (const pe of sv.plato) {
      const e = ix.elab[pe.elaboracion_id];
      if (!e || e.tipo !== 'principal') continue;
      const ops = pe.opciones_eje ? [...new Set(Object.values(pe.opciones_eje))] : [null];
      for (const op of ops) {
        const per = percibidoDe(pe.elaboracion_id, op);
        const a = vistoPer[per];
        if (a != null && Math.abs(fechaDe(sv.dia) - fechaDe(conPlato[a].dia)) < config.VENTANAS.plato_dias
          && !(sv.relajaciones || []).some(r => ['R1', 'R3'].includes(r.peldano))) {
          const usado = (conPlato[a].relajaciones || []).find(r => ['R1', 'R3'].includes(r.peldano));
          anota(usado ? usado.peldano : 'R3');
        }
        vistoPer[per] = i;
      }
      const ue = vistoElab[pe.elaboracion_id];
      const dM2 = ue != null ? i - ue
        // borde con la semana anterior: la repetición cruza la frontera y dentro de esta semana
        // no hay par que la explique (cazado por T4 en `curso-escolar`, 2-ago)
        : (mem.mesa.M2[pe.elaboracion_id] != null
          ? mem.mesa.M2[pe.elaboracion_id].servicios + idxServDe(`${sv.dia}-${sv.servicio}`) + 1 : null);
      if (dM2 != null && dM2 < config.VENTANAS.M2_servicios
        && !(sv.relajaciones || []).some(r => ['R1', 'R3'].includes(r.peldano))) {
        const usado = ue != null && (conPlato[ue].relajaciones || []).find(r => ['R1', 'R3'].includes(r.peldano));
        anota(usado ? usado.peldano : 'R3');
      }
      vistoElab[pe.elaboracion_id] = i;
    }
  });

  return { ok: true, semana: { semana_iso, presencia, servicios, fallo: null } };
}

const fallo = (semana_iso, motivo, extra) => ({ ok: false, motivo, ...extra });

// ── índices del banco para el relleno
function indexar(datos) {
  const elab = Object.fromEntries(datos.elaboraciones.map(e => [e.id, e]));
  const alim = Object.fromEntries(datos.alimentos.map(a => [a.id, a]));
  const cat = Object.fromEntries((datos.categorias_aesan || []).map(f => [f.alimento_id, f]));
  const comb = Object.fromEntries((datos.combinaciones || []).map(c => [c.principal_id, c]));
  const lineasDe = {};
  for (const l of datos.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);
  const compTipo = Object.fromEntries((datos.componentes || []).map(c => [c.id, c.tipo]));
  const tieneEje = {};
  const nEjes = {};
  for (const l of datos.lineas) if (Array.isArray(l.alternativas) && elab[l.padre]) {
    tieneEje[l.padre] = true;
    nEjes[l.padre] = (nEjes[l.padre] || 0) + 1;
  }
  // GUARDA · UN SOLO EJE POR ELABORACIÓN (2-ago, tras derogarse la Regla 7 del banco).
  // El motor resuelve «el eje» en singular: `pools.js` hace `.find()` sobre las líneas
  // intercambiables —la 2ª no generaría candidatos— y `c.opcion` es un valor único que se
  // aplicaría a TODAS ellas: un salmón al horno con salmón de guarnición. El fallo sería
  // SILENCIOSO, que es lo inaceptable. Hasta que N ejes esté implementado de verdad (contrato
  // `opciones_eje` incluido), un plato multi-eje para el motor en seco y con nombre.
  const multi = Object.entries(nEjes).filter(([, n]) => n > 1).map(([id]) => id);
  if (multi.length) throw new Error(
    `banco con ${multi.length} elaboración(es) de MÁS DE UN eje intercambiable: ${multi.join(', ')}. ` +
    `El motor solo resuelve un eje por elaboración y aplicaría la misma opción a todas las líneas. ` +
    `Ver TRASPASO §11 antes de darlas de alta.`);
  const pesada = {};
  const esPesada = id => {
    if (id in pesada) return pesada[id];
    pesada[id] = false;
    for (const l of lineasDe[id] || []) {
      if (l.componente_id && (compTipo[l.componente_id] === 'recubrimiento' || esPesada(l.componente_id))) pesada[id] = true;
      if (l.tecnica_id === 'frito') pesada[id] = true;
    }
    return pesada[id];
  };
  const planas = {};
  const lineasPlanasDe = id => {
    if (planas[id]) return planas[id];
    const out = [];
    const rec = (padre, escala, visto) => {
      if (visto.has(padre)) return;
      visto.add(padre);
      for (const l of lineasDe[padre] || []) {
        if (l.componente_id) { rec(l.componente_id, escala, visto); continue; }
        out.push({ ...l, escala });
      }
    };
    rec(id, 1, new Set());
    return planas[id] = out;
  };
  // origen del dominante por (elab × opción) — proxy del M3 (la moda de mesa la mide C)
  const ANIMAL = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);
  const origenDe = {};
  for (const e of datos.elaboraciones) {
    if (e.tipo !== 'principal') continue;
    const lEje = (lineasDe[e.id] || []).find(l => Array.isArray(l.alternativas));
    for (const op of lEje ? lEje.alternativas : [null]) {
      const dom = dominanteDe({ lineasDe, alim, cat, lineasPlanas: lineasPlanasDe }, e.id, op);
      origenDe[`${e.id}|${op}`] = dom && alim[dom.id] ? alim[dom.id].origen : null;
    }
  }
  return { elab, alim, cat, comb, lineasDe, tieneEje, esPesada, lineasPlanas: lineasPlanasDe, origenDe };
}
const lineasPlanas = (ix, id) => ix.lineasPlanas(id);
function dominanteDe(ix, id, opcion) {
  const ANIMAL = new Set(['carne', 'pescado', 'marisco', 'huevo', 'lacteo']);
  let mejorAnimal = null, mejorProt = null;
  for (const l of ix.lineasPlanas(id)) {
    if (l.papel === 'condimento') continue;
    const aid = Array.isArray(l.alternativas) ? opcion : l.alimento_id;
    const a = ix.alim[aid];
    if (!a) continue;
    const g = (l.gramos_adulto || 0) * (l.escala || 1);
    if (ANIMAL.has(a.naturaleza) && (!mejorAnimal || g > mejorAnimal.g)) mejorAnimal = { id: aid, g, linea: l };
    const f = ix.cat[aid];
    if (f && cubosDe(f.categoria).length && (!mejorProt || g > mejorProt.g)) mejorProt = { id: aid, g, linea: l };
  }
  return mejorAnimal || mejorProt;
}
const coste_banda = (ix, eid) => {
  const costes = ix.lineasPlanas(eid)
    .map(l => Array.isArray(l.alternativas) ? null : (ix.alim[l.alimento_id] || {}).coste_banda)
    .filter(x => x != null);
  return costes.length ? costes.reduce((s, x) => s + x, 0) / costes.length : null;
};

module.exports = { rellenarSemana };

  };

  /* ---- motor_v6/src/t3_fracciones.js ---- */
  REG['t3_fracciones'] = function (module, exports, require) {
// T3 · CIERRE INDIVIDUAL: fracciones (spec §1-T3 y §5; plan PLAN_T3.md aprobado por Roger
// 2-ago con Q7-Q9 · Q10 superseded el mismo día: nada compensa a nada).
//
// QUÉ HACE: con el menú de T2 ya fijado, elige por (comensal × servicio) la FRACCIÓN de ración
// que acerca su energía del MENÚ (plato + postre — el ámbito de macros del esquema §8.0.1) a su
// objetivo de ESE servicio. No re-elige platos ni mira otros servicios: solo mueve cantidades.
//
// DECISIONES DE ROGER QUE ESTO IMPLEMENTA (BUGS_V5, commit 725b92d):
//  · Q8 — UNA fracción por comensal para TODO su plato («a Estéfani, tres cuartos de todo»):
//    una sola nota por persona en la card; fraccionar plato a plato llenaría la card de números.
//  · Q7 MUERTO (refundación 2-ago, spec §4): no hay escalones. La cantidad personal es
//    CONTINUA en gramos porque «nunca se comen 1,5 raciones» — nadie sirve porciones medidas:
//    el reparto es a ojo y lo único que se redondea a cocinable/comprable es el TOTAL agregado,
//    una vez (capa de receta, §0.5). El factor por comensal sigue siendo uno solo (Q8 vive).
//  · Q9 MUERTO (misma refundación): el suelo de «medio plato» era respuesta a una pregunta mal
//    planteada. Su equivalente vivo es el SUELO PROTEICO, que ya es cota inferior dura.
//  · Q10 SUPERSEDED (dictado 2-ago, spec §5): **NADA COMPENSA A NADA.** Muere la deuda P3 y
//    toda compensación entre servicios y entre semanas. Razón de producto de Roger: la app
//    gobierna ~65% del día y no ve el otro 35% (desayuno, merienda, comidas fuera, el comedor
//    del cole — ni la ración que le pusieron ni cuánto se comió). Compensar dentro de lo
//    controlado por desviaciones ocurridas en lo NO controlado es falsa precisión: el error que
//    corriges es imaginario y el que introduces es real. Cada servicio ofrece LO CORRECTO.
//
// PRECEDENCIA INNEGOCIABLE (spec §1-T3): el suelo proteico del servicio es COTA INFERIOR; la
// energía ajusta POR ENCIMA. Si bajar la fracción rompería el suelo, la fracción se queda arriba
// y el exceso se declara — jamás al revés, jamás en silencio.
'use strict';
const { derivarElaboracion, indexar, kcalDe, edadEnSemana } = require('./derivar.js');
const { objetivoDiario } = require('./energia.js');
const { racionParaLinea } = require('./raciones.js');
const { cubosDe } = require('./t1_esqueleto.js');

// TECHOS DE SALUD: innegociables por spec §7 («Jamás: H entero, ni los techos de salud»). La
// fracción puede subir por energía, pero JAMÁS hasta romperlos — medido 2-ago: sin esta cota,
// las fracciones de 1,25-1,5 subían la carne roja de los niños de 10 a 13 violaciones. No es
// una decisión de producto: es doctrina ya escrita.
const CUBOS_SALUD = ['carne-roja', 'carne-procesada'];

// fracción → composición individual real de ese miembro en ese servicio (respeta las notas /2:
// sustituto de plato/postre, solo-para ajeno, eliminar y variantes)
function piezasDe(sv, mid) {
  const notas = sv.notas || [];
  const sust = {};
  for (const n of notas) if (n.tipo === 'sustituto' && n.miembro === mid) sust[n.ambito] = n;
  const soloPara = {};
  for (const n of notas) if (n.tipo === 'solo-para') soloPara[n.elaboracion_id] = new Set(n.miembros);
  const plato = sust.plato ? sust.plato.plato
    : (sv.plato || []).filter(pe => !soloPara[pe.elaboracion_id] || soloPara[pe.elaboracion_id].has(mid));
  const postre = sust.postre ? sust.postre.postre : sv.postre;
  const ajustes = { eliminar: new Set(), sustituir: {} };
  for (const n of notas) {
    if (n.tipo === 'eliminar' && n.miembro === mid) ajustes.eliminar.add(n.alimento_id);
    else if (n.tipo === 'vehiculo-persona' && n.miembro === mid) ajustes.sustituir[n.alimento_id] = n.sustituto_id;
    else if (n.tipo === 'variante-todos') ajustes.sustituir[n.alimento_id] = n.sustituto_id;
  }
  return { piezas: postre ? plato.concat([postre]) : plato, ajustes };
}

// macros del MENÚ de un miembro a fracción 1 (escalan linealmente con la fracción: los gramos
// de cada línea se multiplican por ella — por eso basta derivar una vez por servicio), más sus
// raciones de los cubos de SALUD, que la fracción tampoco puede desbordar
function macrosBase(ix, sv, mid, esNino, datos, edad, config) {
  const { piezas, ajustes } = piezasDe(sv, mid);
  const totales = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
  const salud = {};
  const huecos = [], supuestos = [];
  for (const pe of piezas) {
    const r = derivarElaboracion(ix, pe, mid, esNino, 1, huecos, supuestos, ajustes);
    for (const k of Object.keys(totales)) totales[k] += r.totales[k];
    for (const l of r.lineas) {
      if (l.papel === 'condimento') continue;
      const fila = ix.cat && ix.cat[l.alimento];
      const filaD1 = fila || (datos.categorias_aesan || []).find(f => f.alimento_id === l.alimento);
      if (!filaD1) continue;
      const cubos = cubosDe(filaD1.categoria).filter(c => CUBOS_SALUD.includes(c));
      if (!cubos.length) continue;
      const rac = racionParaLinea(datos, filaD1, edad);
      if (rac.hueco) continue;
      let g = l.gramos_crudos != null ? l.gramos_crudos : l.gramos_base;
      if (filaD1.categoria === 'legumbre') g = g / config.FACTOR_LEGUMBRE_SECO_COCIDO;
      for (const c of cubos) salud[c] = (salud[c] || 0) + g / rac.g;
    }
  }
  return { totales, salud };
}

// proteína por gramo de una línea (el suelo acota el ajuste fino igual que acota la fracción)
function protPorGramo(ix, l) {
  const porBase = ix.nut[l.alimento_id] || {};
  const fila = (porBase[l.base] || {}).proteina || (porBase[l.base === 'crudo' ? 'cocido' : 'crudo'] || {}).proteina;
  return fila && fila.valor != null ? fila.valor / 100 : 0;
}

// kcal por gramo de una línea (para el ajuste fino de rango): macros de su base declarada
function kcalPorGramo(ix, l, mid) {
  const porBase = ix.nut[l.alimento_id] || {};
  const t = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
  for (const k of Object.keys(t)) {
    const fila = (porBase[l.base] || {})[k] || (porBase[l.base === 'crudo' ? 'cocido' : 'crudo'] || {})[k];
    if (fila && fila.valor != null) t[k] = fila.valor;
  }
  return kcalDe(t) / 100;
}

// T3 sobre una semana ya rellena: devuelve { servicios: [{slot, fracciones, ajustes_linea,
// descargos, relajaciones}] } — el llamador lo funde en la semana serializada.
function fraccionarSemana({ semana, familia, config }, datos) {
  const ix = indexar(datos);
  const LIMITE = config.FRACCIONES.LIMITE_REALIDAD;   // cota de sentido común, no de dieta
  const objetivos = {};
  for (const m of familia.miembros) objetivos[m.id] = objetivoDiario(m, semana.semana_iso, config);

  const salida = [];
  const saludAcum = {};                              // mid → cubo de salud → raciones servidas
  for (const m of familia.miembros) saludAcum[m.id] = {};

  for (const sv of semana.servicios) {
    if (!sv.plato) { salida.push({ slot: `${sv.dia}-${sv.servicio}`, fracciones: null, descargos: [], relajaciones: [] }); continue; }
    const finde = sv.dia >= 6;
    const repartoCfg = finde ? config.ENERGIA.reparto_finde : config.ENERGIA.reparto;
    const reparto = repartoCfg[sv.servicio];
    const fracciones = {}, descargos = [], relajaciones = [];

    const ajustesLinea = [];
    for (const m of familia.miembros) {
      if (!semana.presencia[m.id] || semana.presencia[m.id][`${sv.dia}-${sv.servicio}`] !== true) continue;
      const obj = objetivos[m.id];
      const esNino = obj.edad < config.EDAD_RACION_ADULTO;
      const { totales: base, salud } = macrosBase(ix, sv, m.id, esNino, datos, obj.edad, config);
      const kcalBase = kcalDe(base);
      if (!(kcalBase > 0)) { fracciones[m.id] = 1; continue; }   // sin dato derivable: ración entera

      // objetivo de ESTE servicio y nada más: nada compensa a nada (§5)
      const objetivoServicio = obj.objetivo_dia * reparto;
      const sueloServicio = obj.suelo_proteina_dia * reparto;

      // CANTIDAD CONTINUA (refundación §4): el factor exacto que iguala su energía, acotado
      // por (a) el SUELO PROTEICO abajo — cota innegociable de §1-T3 — y (b) los TECHOS DE
      // SALUD arriba (§7). Sin escalones: la familia reparte a ojo y solo el total se redondea.
      const fEnergia = kcalBase > 0 ? objetivoServicio / kcalBase : 1;
      const fMinSuelo = base.proteina > 0 ? sueloServicio / base.proteina : 0;
      const tramo = esNino ? 'nino' : 'adulto';
      // techo de salud en TOMAS: la toma cuenta con la cantidad servida ≥ umbral del tramo, así
      // que reducir por debajo del umbral es lo que evita la toma — el factor máximo que no la
      // cuenta cuando el cubo ya está en su techo
      let fMaxSalud = Infinity;
      for (const c of CUBOS_SALUD) {
        if (!(salud[c] > 0)) continue;
        const max = ((config.CUOTAS[c] || {})[tramo] || [])[1];
        if (max == null) continue;
        if ((saludAcum[m.id][c] || 0) + 1 > max + 1e-9) {
          // servir esto contaría una toma que rompe el techo: solo cabe por debajo del umbral
          fMaxSalud = Math.min(fMaxSalud, config.TOMA_MIN_FRACCION * 0.999 / (salud[c] || 1));
        }
      }
      // PRECEDENCIA (§1-T3): el suelo proteico es cota inferior INNEGOCIABLE — manda sobre la
      // energía, sobre los techos de salud y también sobre el límite de realidad. Si para
      // cumplirlo hay que pasarse del límite, se pasa y se DECLARA (cazado midiendo: recortar
      // al límite rompía 3 suelos que estaban a cero).
      let factor = Math.min(Math.max(fEnergia, LIMITE.min), LIMITE.max);
      if (factor > fMaxSalud) factor = fMaxSalud;
      if (factor < fMinSuelo) factor = fMinSuelo;      // el suelo, el último y por encima de todo
      const mejor = +factor.toFixed(3);
      fracciones[m.id] = mejor;
      // el acumulado de salud cuenta TOMAS (vara nueva): solo si la cantidad servida llega al umbral
      for (const c of CUBOS_SALUD) if (salud[c] * mejor >= config.TOMA_MIN_FRACCION)
        saludAcum[m.id][c] = (saludAcum[m.id][c] || 0) + 1;

      // 2-bis · AJUSTE FINO por rango declarado (`gramos_*_min/max`): con cantidad continua ya
      // no hace falta para la energía general, pero SÍ recupera los servicios donde el factor
      // queda acotado por techo de salud o límite de realidad. Medido: retirarlo empeora el
      // suelo proteico de 3 a 7 violaciones (ayuda a recolocar proteína), así que se queda.
      let restante = objetivoServicio - kcalBase * mejor;
      let protViva = base.proteina * mejor;
      if (Math.abs(restante) > objetivoServicio * config.UMBRALES.B_desvio_servicio) {
        const { piezas } = piezasDe(sv, m.id);
        for (const pe of piezas) {
          for (const l of ix.lineasDe[pe.elaboracion_id] || []) {
            if (Array.isArray(l.alternativas) || l.componente_id || !l.alimento_id) continue;
            const gMin = esNino ? l.gramos_nino_min : l.gramos_adulto_min;
            const gMax = esNino ? l.gramos_nino_max : l.gramos_adulto_max;
            if (gMin == null && gMax == null) continue;
            const nominal = (esNino ? l.gramos_nino : l.gramos_adulto) * mejor;
            const kcalPorG = kcalPorGramo(ix, l, m.id);
            if (!(kcalPorG > 0)) continue;
            const deseado = nominal + restante / kcalPorG;
            let g = Math.round(Math.max(gMin != null ? gMin : 0, Math.min(gMax != null ? gMax : Infinity, deseado)));
            const protPorG = protPorGramo(ix, l);
            if (protPorG > 0 && g < nominal) {
              const margen = Math.max(0, protViva - sueloServicio);
              const gMinProt = nominal - margen / protPorG;
              if (g < gMinProt) g = Math.ceil(gMinProt);
            }
            if (g === Math.round(nominal) || !(g > 0)) continue;
            ajustesLinea.push({ miembro: m.id, elaboracion_id: pe.elaboracion_id, alimento_id: l.alimento_id, gramos: g });
            restante -= (g - nominal) * kcalPorG;
            protViva += (g - nominal) * protPorG;
            if (Math.abs(restante) <= objetivoServicio * config.UMBRALES.B_desvio_servicio) break;
          }
          if (Math.abs(restante) <= objetivoServicio * config.UMBRALES.B_desvio_servicio) break;
        }
      }

      // 3 · DECLARACIONES — «conflicto → descargo, jamás silencio» (spec §1-T3). El `tipo` es
      // SIEMPRE `suelo-proteico`, que es lo que la vara busca (b_energia): el matiz del caso va
      // en `detalle`, jamás en un tipo propio, o la violación viajaría muda ante el juez.
      // (Restaurado tras cazarlo la QA-2 con un grep: mi edición por script del bloque anterior
      // se llevó por delante estas líneas y T3 quedó SIN emitir un solo descargo.)
      const protFinal = base.proteina * mejor;
      if (protFinal < sueloServicio - 1e-9) {
        descargos.push({ tipo: 'suelo-proteico', miembro: m.id,
          detalle: `${m.id}: la proteína del servicio queda en ${protFinal.toFixed(1)} g frente al suelo ${sueloServicio.toFixed(1)} g — ` +
            (fMinSuelo > LIMITE.max ? `cumplirlo exigiría ×${fMinSuelo.toFixed(2)}, por encima del límite de realidad ×${LIMITE.max}`
              : fMaxSalud < fMinSuelo ? 'el techo de salud impide subir más la ración'
                : 'la composición del plato no da para más con esta cantidad') });
      } else if (fEnergia < fMinSuelo - 1e-9) {
        descargos.push({ tipo: 'suelo-proteico', miembro: m.id,
          detalle: `${m.id}: la energía pedía ×${fEnergia.toFixed(2)} y el suelo proteico obliga a ×${fMinSuelo.toFixed(2)} — el suelo manda y la ración sube (spec §1-T3)` });
      }
      const desvio = (kcalBase * mejor - objetivoServicio) / objetivoServicio;
      if (Math.abs(desvio) > config.UMBRALES.B_desvio_servicio) {
        descargos.push({ tipo: 'energia-fuera-de-banda', miembro: m.id,
          detalle: `${m.id}: la cantidad queda en ${(100 * desvio).toFixed(0)}% del objetivo del servicio — acotada por suelo, techo de salud o límite de realidad` });
        relajaciones.push({ peldano: 'R5',
          detalle: `banda de energía del servicio fuera para ${m.id} (${(100 * desvio).toFixed(0)}%): se DECLARA y ahí muere — nada compensa a nada (§5)`,
          frase: 'Hoy la ración queda un poco fuera de lo justo.' });
      }
    }
    salida.push({ slot: `${sv.dia}-${sv.servicio}`, fracciones, ajustes_linea: ajustesLinea, descargos, relajaciones });
  }
  return { servicios: salida };
}

module.exports = { fraccionarSemana, piezasDe };

  };

  /* ---- motor_v6/src/t4_auditoria.js ---- */
  REG['t4_auditoria'] = function (module, exports, require) {
// T4 · AUDITORÍA CON DOBLE CONTABILIDAD (spec §1-T4).
//
// QUÉ ES: un contador INDEPENDIENTE del generador que re-cuenta lo servido y lo compara con lo
// que el motor declaró. **Divergencia = BUG, jamás ajuste.**
//
// ⚠️ VARA PROPIA, DELIBERADAMENTE (pedido de auditoría QA-2, 2-ago): este módulo NO importa
// `harness/raciones.js` ni ninguna batería. Motor y juez comparten esa vara —correcto para que
// el careo signifique algo— pero T4 existe justamente para cazar el caso en que AMBOS se
// equivoquen igual. Si T4 llamara a la misma función, no auditaría: confirmaría. Por eso aquí
// se releen las MISMAS FUENTES (el banco) con implementación propia, y una divergencia entre
// las dos implementaciones es exactamente la señal que este tiempo busca.
//
// GATE (spec §9 y §1-T4): **cero relajaciones silenciosas.** Toda ventana incumplida tiene que
// llevar su peldaño declarado en el servicio; todo suelo o techo roto, su descargo.
'use strict';

const KCAL = { proteina: 4, hidratos: 4, grasa: 9, fibra: 2 };
const CUBOS_DE = {                                   // categoría D1 → cubos de cuota (propio)
  legumbre: ['legumbre'],
  'pescado-blanco': ['pescado-total'],
  'pescado-azul': ['pescado-total', 'pescado-azul'],
  marisco: ['pescado-total'],
  huevo: ['huevo'],
  'carne-roja': ['carne-total', 'carne-roja'],
  'carne-blanca': ['carne-total'],
  'carne-procesada': ['carne-total', 'carne-procesada']
};

// ── índices propios (no se reutiliza `indexar` del derivador: misma fuente, otra implementación)
function indice(datos) {
  const alim = {}, cat = {}, nut = {}, lin = {}, elab = {}, infantil = [];
  for (const a of datos.alimentos) alim[a.id] = a;
  for (const f of datos.categorias_aesan || []) cat[f.alimento_id] = f;
  for (const n of datos.nutricion) {
    if (n.valor == null) continue;
    ((nut[n.alimento_id] = nut[n.alimento_id] || {})[n.base] = nut[n.alimento_id][n.base] || {})[n.nutriente] = n.valor;
  }
  for (const l of datos.lineas) (lin[l.padre] = lin[l.padre] || []).push(l);
  for (const e of datos.elaboraciones) elab[e.id] = e;
  for (const f of datos.raciones_infantiles || []) infantil.push(f);
  return { alim, cat, nut, lin, elab, infantil };
}

// ración de referencia por (categoría × edad) — RE-IMPLEMENTADA a propósito
function racionPropia(ix, categoria, edad, filaD1) {
  if (edad != null && edad < 3) return null;                    // fuera de alcance del producto
  if (edad != null && edad < 19) {
    const f = ix.infantil.find(x => x.categoria === categoria && edad >= x.edad_min && edad <= x.edad_max);
    if (f) return f.racion_ref_g;
  }
  return filaD1 && filaD1.racion_ref_g != null ? filaD1.racion_ref_g : null;
}

// composición individual de un miembro en un servicio, según las notas /2 (re-implementada)
function composicion(sv, mid) {
  const notas = sv.notas || [];
  const sust = {};
  for (const n of notas) if (n.tipo === 'sustituto' && n.miembro === mid) sust[n.ambito] = n;
  const fuera = new Set();
  for (const n of notas) if (n.tipo === 'solo-para' && !n.miembros.includes(mid)) fuera.add(n.elaboracion_id);
  const quitar = new Set(), cambiar = {};
  for (const n of notas) {
    // `miembro: '*'` = eliminación de HOGAR (§13.1.3): no se cocina para nadie
    if (n.tipo === 'eliminar' && (n.miembro === mid || n.miembro === '*')) quitar.add(n.alimento_id);
    if (n.tipo === 'vehiculo-persona' && n.miembro === mid) cambiar[n.alimento_id] = n.sustituto_id;
    if (n.tipo === 'variante-todos') cambiar[n.alimento_id] = n.sustituto_id;
  }
  const plato = sust.plato ? sust.plato.plato : (sv.plato || []).filter(p => !fuera.has(p.elaboracion_id));
  const postre = sust.postre ? sust.postre.postre : sv.postre;
  const gramos = {};
  for (const a of sv.ajustes_linea || []) if (a.miembro === mid) gramos[`${a.elaboracion_id}|${a.alimento_id}`] = a.gramos;
  return { piezas: postre ? plato.concat([postre]) : plato, quitar, cambiar, gramos };
}

// líneas servidas a un miembro, con gramos finales (recorrido propio, componentes incluidos)
function lineasServidas(ix, sv, mid, esNino, fraccion) {
  const { piezas, quitar, cambiar, gramos } = composicion(sv, mid);
  const out = [];
  for (const pe of piezas) {
    const rec = (padre, escala, visto) => {
      if (visto.has(padre)) return;
      visto.add(padre);
      for (const l of ix.lin[padre] || []) {
        if (l.componente_id) { rec(l.componente_id, escala * ((esNino ? l.escala_nino : l.escala_adulto) || 1), visto); continue; }
        let aid = l.alimento_id;
        if (Array.isArray(l.alternativas)) {
          const op = pe.opciones_eje && (pe.opciones_eje[mid] || pe.opciones_eje['*']);
          if (!op) continue;
          aid = op;
        } else {
          if (quitar.has(aid)) continue;
          // encadenadas: variante de hogar + la individual que provoca (misma regla que el
          // derivador, contada por separado — para eso existe la doble contabilidad)
          for (let salto = 0; salto < 4 && cambiar[aid]; salto++) aid = cambiar[aid];
        }
        const ajuste = gramos[`${pe.elaboracion_id}|${aid}`];
        const g = ajuste != null ? ajuste
          : ((esNino ? l.gramos_nino : l.gramos_adulto) || 0) * escala * fraccion;
        out.push({ elaboracion: pe.elaboracion_id, alimento: aid, gramos: g, papel: l.papel, base: l.base, eje: Array.isArray(l.alternativas) });
      }
    };
    rec(pe.elaboracion_id, 1, new Set());
  }
  return out;
}

// ¿el plato servido llega a media ración de fruta/verdura EN GRAMOS? (bloqueante 2-ago: `ejes`
// era una etiqueta y la hamburguesa salía sola). Recuento propio sobre las líneas ya resueltas
// del miembro, sin reutilizar la función del motor: si ambas se equivocan igual, no se ve.
const RACION_FV = { adulto: 175, nino: 135 };
const gramosFVServidos = (ix, lineas) => lineas.reduce((s, l) => {
  if (l.papel === 'condimento') return s;
  const f = ix.cat[l.alimento];
  return s + (f && (f.categoria === 'verdura' || f.categoria === 'fruta') ? l.gramos : 0);
}, 0);

const protDeLinea = (ix, l) => {
  const porBase = ix.nut[l.alimento] || {};
  const m = porBase[l.base] || porBase.crudo || porBase.cocido || {};
  return (l.gramos / 100) * (m.proteina || 0);
};

// ── AUDITORÍA de una corrida ya serializada
function auditar(corrida, datos, config, objetivos) {
  const ix = indice(datos);
  const divergencias = [], silenciosas = [], ejeCorto = [];
  const miembros = Object.fromEntries(corrida.familia.miembros.map(m => [m.id, m]));
  const anclas = new Set((corrida.familia.anclas || []).map(a => `${a.dia}-${a.servicio}:${a.elaboracion_id}`));
  const tomasPorSemana = {};

  // La memoria de variedad CRUZA semanas (M1 se mide en días, M2 en servicios). Día absoluto por
  // índice de semana × 7: las corridas se generan en semanas consecutivas. Si alguna vez hubiera
  // salto, las distancias salen MENORES de lo real ⇒ el auditor peca de estricto, nunca de laxo,
  // que es el único sesgo aceptable en un auditor.
  const vistoPercibidoDia = {}, vistoElabIdx = {};
  let idxServido = -1, semIdx = -1;

  for (const sem of corrida.semanas) {
    semIdx++;
    if (sem.fallo) continue;
    const tomas = {}, saludG = {};                   // mid → cubo/categoría → recuento propio
    tomasPorSemana[sem.semana_iso] = tomas;
    let idx = -1;

    for (const sv of sem.servicios) {
      idx++;
      if (!sv.plato) continue;
      idxServido++;
      const diaAbs = semIdx * 7 + sv.dia;
      const presentes = Object.keys(miembros).filter(mid => sem.presencia[mid] && sem.presencia[mid][`${sv.dia}-${sv.servicio}`] === true);
      const peldanos = new Set((sv.relajaciones || []).map(r => r.peldano));
      const tiposDescargo = new Set((sv.descargos || []).map(d => d.tipo));

      // 1 · VARIEDAD: ¿alguna repetición dentro de ventana viaja sin su peldaño declarado?
      //     M1 en DÍAS sobre el percibido de mesa · M2 en SERVICIOS sobre la elaboración.
      for (const pe of sv.plato) {
        const e = ix.elab[pe.elaboracion_id];
        if (!e || e.tipo !== 'principal') continue;
        const esAncla = anclas.has(`${sv.dia}-${sv.servicio}:${pe.elaboracion_id}`);
        const ops = pe.opciones_eje ? [...new Set(Object.values(pe.opciones_eje))] : [null];
        for (const op of ops) {
          const per = op == null ? e.id : ((e.nombre_por_opcion || {})[op] || `${e.id}×${op}`);
          const antes = vistoPercibidoDia[per];
          if (antes != null && !esAncla && diaAbs - antes < config.VENTANAS.plato_dias
            && !peldanos.has('R1') && !peldanos.has('R3'))
            silenciosas.push({ semana: sem.semana_iso, slot: `${sv.dia}-${sv.servicio}`,
              tipo: 'M1-sin-declarar', detalle: `${per} repetido a ${diaAbs - antes} d sin peldaño R1/R3` });
          vistoPercibidoDia[per] = diaAbs;
        }
        const ue = vistoElabIdx[pe.elaboracion_id];
        if (ue != null && !esAncla && idxServido - ue < config.VENTANAS.M2_servicios
          && !peldanos.has('R3') && !peldanos.has('R4'))
          silenciosas.push({ semana: sem.semana_iso, slot: `${sv.dia}-${sv.servicio}`,
            tipo: 'M2-sin-declarar', detalle: `${pe.elaboracion_id} a ${idxServido - ue} servicios sin peldaño R3/R4` });
        vistoElabIdx[pe.elaboracion_id] = idxServido;
      }

      // 2 · POR MIEMBRO: suelo proteico del servicio y acumulados de la semana
      for (const mid of presentes) {
        const m = miembros[mid];
        const obj = objetivos[mid];
        if (!obj) continue;
        const esNino = obj.edad < config.EDAD_RACION_ADULTO;
        const fraccion = (sv.fracciones && sv.fracciones[mid]) != null ? sv.fracciones[mid] : 1;
        const lineas = lineasServidas(ix, sv, mid, esNino, fraccion);
        const reparto = (sv.dia >= 6 ? config.ENERGIA.reparto_finde : config.ENERGIA.reparto)[sv.servicio];

        // eje fruta-verdura en gramos, sobre el plato en la ración BASE de su tramo (fracción 1).
        // La fracción de T3 ajusta ENERGÍA, no composición: quien come al 45% por su gasto come
        // también menos verdura, y medir el eje después de la fracción convertiría este gate en
        // un gate de energía disfrazado. Son dos capas y la spec las mantiene separadas. Si se
        // decidiera lo contrario, basta pasar `fraccion` aquí en vez de 1.
        const gFV = gramosFVServidos(ix, lineasServidas(ix, sv, mid, esNino, 1));
        const umbralFV = RACION_FV[esNino ? 'nino' : 'adulto'] * config.EJE_MIN_FRACCION;
        if (gFV < umbralFV)
          ejeCorto.push({ semana: sem.semana_iso, slot: `${sv.dia}-${sv.servicio}`, miembro: mid,
            tipo: 'eje-fruta-verdura-corto',
            detalle: `${Math.round(gFV)} g < ${Math.round(umbralFV)} g (media ración de su tramo)` });

        const prot = lineas.reduce((s, l) => s + protDeLinea(ix, l), 0);
        const sueloSv = obj.suelo_proteina_dia * reparto;
        if (prot < sueloSv - 1e-6 && !tiposDescargo.has('suelo-proteico')) {
          silenciosas.push({ semana: sem.semana_iso, slot: `${sv.dia}-${sv.servicio}`, miembro: mid,
            tipo: 'suelo-proteico-sin-descargo',
            detalle: `${prot.toFixed(1)} g < ${sueloSv.toFixed(1)} g y el servicio no lo declara` });
        }

        // tomas y gramos de salud, con recuento propio
        const gramosCubo = {}, refCubo = {};
        for (const l of lineas) {
          if (l.papel === 'condimento') continue;
          const fila = ix.cat[l.alimento];
          if (!fila) continue;
          const cubos = CUBOS_DE[fila.categoria];
          if (!cubos) continue;
          const ref = racionPropia(ix, fila.categoria, obj.edad, fila);
          if (ref == null) continue;
          let g = l.gramos;
          if (fila.categoria === 'legumbre') g = g / config.FACTOR_LEGUMBRE_SECO_COCIDO;
          for (const c of cubos) { gramosCubo[c] = (gramosCubo[c] || 0) + g; refCubo[c] = ref; }
          if (config.TECHOS_SALUD_G_SEMANA[fila.categoria])
            ((saludG[mid] = saludG[mid] || {})[fila.categoria] = (saludG[mid][fila.categoria] || 0) + l.gramos);
        }
        for (const [c, g] of Object.entries(gramosCubo))
          if (refCubo[c] > 0 && g >= refCubo[c] * config.TOMA_MIN_FRACCION)
            ((tomas[mid] = tomas[mid] || {})[c] = (tomas[mid][c] || 0) + 1);
      }
    }

    // 3 · CIERRE DE SEMANA: techos de salud en gramos, con recuento propio
    for (const [mid, cats] of Object.entries(saludG)) {
      for (const [cat, g] of Object.entries(cats)) {
        const techo = config.TECHOS_SALUD_G_SEMANA[cat];
        if (techo != null && g > techo + 1e-6)
          divergencias.push({ semana: sem.semana_iso, miembro: mid, tipo: 'techo-salud-superado',
            detalle: `${cat}: ${g.toFixed(0)} g > ${techo} g/semana (recuento independiente)` });
      }
    }
  }

  const gates = { relajaciones_silenciosas_cero: silenciosas.length === 0,
    ejes_cubiertos_en_gramos: ejeCorto.length === 0,
    techos_salud_respetados: divergencias.filter(d => d.tipo === 'techo-salud-superado').length === 0 };
  return { tiempo: 'T4', gates, ok: Object.values(gates).every(Boolean),
    metricas: { silenciosas: silenciosas.length, divergencias: divergencias.length, eje_fv_corto: ejeCorto.length },
    // recuento propio de tomas, expuesto para contrastarlo contra el de la batería A: si las dos
    // implementaciones difieren, una de las dos tiene un bug — que es justo lo que T4 busca
    tomas: tomasPorSemana,
    silenciosas: silenciosas.slice(0, 50), divergencias: divergencias.slice(0, 50), eje_corto: ejeCorto.slice(0, 50) };
}

module.exports = { auditar };

  };

  /* ---- hash_banco (precalculado en build; sin crypto en el navegador) ---- */
  REG['hash_banco'] = function (module) {
    module.exports = {
      hashCompleto: function () { return '86a9b6e04190611087ad262abbbc86bd3681272cf3b3472fa8bf6f03fbbbd5e6'; },
      hashGeneracion: function () { return '63c075ea3480a364b2d7a065087c2f918e7cb957782e3c31a286b7702200f9d7'; }
    };
  };

  // cara pública: lo que el frontend necesita para generar y leer una semana
  global.E3MotorV6 = {
    generarCorrida: require('./generar.js').generarCorrida,
    VERSION: require('./generar.js').VERSION,
    normalizarFamilia: require('./contrato_familia.js').normalizarFamilia,
    memoria: require('./memoria.js'),
    diario: require('./diario.js'),
    // SUPERFICIE DE PRODUCTO (spec §15): las 11 funciones que la app enseña y toca —compra,
    // cambiar plato, presencia, catálogo, descubrir, ficha y nevera— sobre la semana `/2`.
    crearSuperficie: require('./superficie.js').crearSuperficie,
    // los DOS hashes del banco, constantes de build: el diario D3 guarda `banco_generacion`
    // con cada servicio para que el pasado sea auditable (D3 §5) — y son los del banco
    // FUENTE, así que una corrida del navegador es comparable con una de node.
    hashBanco: require('./hash_banco.js').hashCompleto,
    hashGeneracion: require('./hash_banco.js').hashGeneracion,
    derivar: require('./derivar.js'),
    config: require('./config.js'),
    // el banco llega por window.E3_BANCO_V6; esto lo compone como lo hace src/datos.js
    datos: function () {
      if (!global.E3_BANCO_V6) throw new Error('motor_v6: falta data/banco_v6.js');
      return global.E3_BANCO_V6;
    }
  };
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
