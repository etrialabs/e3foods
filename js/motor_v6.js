/* ============================================================
   e3Foods — motor_v6.js (GENERADO por _build_banco_v6.js — NO editar a mano)
   Motor V6 para navegador: 23 módulos de motor_v6/src/ (la ÚNICA
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
  // ⚑ 4-ago (Roger): `plato_dias` baja de 7 a 5. Razón medida, no estética: el menú REAL del
  //   comedor escolar que vive en el harness repite tortilla francesa a 5 días y filete de cerdo
  //   a 6 (Lesseps, mayo 2026). Exigirle 7 al motor era pedirle más de lo que se pide una cocina
  //   profesional con menú publicado. Igualar las dos realidades da margen a las cenas de casa.
  // ⚑ `plato_dias_R3` es la ventana del peldaño R3. Estaba CABLEADA a 5 en `t2_relleno`, así que
  //   al bajar la base a 5 R3 pasaba a declarar una relajación sin relajar nada — el motor diría
  //   «hemos acercado un plato que gustó hace poco» sin haber acercado ninguno. A CALIBRAR.
  VENTANAS: { plato_dias: 5, plato_dias_R3: 3, M2_servicios: 4, M3_servicios: 2, M4_servicios: 2 },
  MARGEN_AFORO: 1.5,                   // pre-vuelo §7: aforo < mínimo×margen ⇒ hueco informativo
                                       // (spec §11 «margen aforo 1,5×» — A CALIBRAR)
  POOL_ESTRECHO_CATEGORIAS: 3,         // pre-vuelo: < N categorías vivas por servicio ⇒ hueco
                                       // informativo (medido: mesa vegana con 2 no cierra) — A CALIBRAR

  // ── coste S de T2 (spec §2) — pesos enteros PÚBLICOS en el ORDEN de importancia de la spec;
  //    los afinará la calibración por máquina sobre el harness (§11). Términos SIEMPRE en [0,1]
  //    (0 = ideal), saturados con las cotas de abajo. `favoritos` está a 0 — Q4 (OK Roger
  //    1-ago): la señal no existe en la entrada; saldrá de la UI de favoritas (dato explícito,
  //    jamás inferido). Su rango natural al activarse: 32 (entre estado_cuotas y temporada).
  PESOS_S: {
    frescura_plato: 256,               // S1 distancia de plato percibido más allá de la ventana
    distancia_origen: 128,             // S2 origen dominante
    estado_cuotas: 64,                 // S3 estado de la banda de cuota de los presentes: lo que
                                       // AVANZA de mínimos pendientes y lo que GASTA de techos ya
                                       // cubiertos. ⚑ 4-ago-2026 (§13.4): se llamaba
                                       // `progreso_cuotas` y solo veía el mínimo. Medido sobre la
                                       // parrilla: 78 de las 214 tomas de `carne-total` de los
                                       // veredictos que se pasan del techo NO salen de la casilla
                                       // que T1 reservó sino de la OPCIÓN del comensal, y con el
                                       // avance empatado a 0 decidía la rotación a ciegas. NO es
                                       // un peso nuevo: un segundo 64 habría roto la escala
                                       // lexicográfica (128 debe dominar a todo lo de abajo junto).
    favoritos: 0,                      // S4 — RESERVADO (sin señal; ver nota de cabecera)
    temporada: 16,                     // S5 estación de la elaboración / mes del alimento
    esfuerzo_slot: 8,                  // S6 tiempo del slot (L-V corto mejor; finde invertido)
    rotacion_eje: 4,                   // S7 frescura P2 de las opciones ofrecidas
    equilibrio_coste: 2,               // S8 desvío de coste_banda vs media semanal
    solapamiento_compra: 1             // S9 BONUS de compra compartida (nunca malus)
  },
  // ── LOS OTROS CUATRO COSTES BLANDOS, que vivían SUELTOS en `t2_relleno` (§20.0, 4-ago-2026).
  //    `20.0` dice que ninguna vara numérica se escribe suelta en el código, y estos cuatro lo
  //    estaban: `+ excluidos.length * 128`, `+ novedadExcedida ? 512`, `+ descargoTecho ? 4096` y
  //    `+ st.bigramas[bg] * 64` escritos a mano en dos expresiones. No son deuda ni sobras: cada
  //    uno codifica una regla de producto que el funcional ya tiene escrita, solo que §13.4 no los
  //    enumeraba entre las blandas y por eso nadie los veía. Se suman al coste S; sus valores son
  //    los mismos que estaban cableados, así que sacarlos aquí NO mueve un solo menú (verificado
  //    con la huella) — lo que mueve es que ahora se pueden calibrar y leer.
  PESOS_S_EXTRA: {
    comer_aparte: 128,                 // §7.6: comer aparte es normal pero se MINIMIZA. Por cada
                                       // presente que queda excluido del plato de mesa. Domina a
                                       // todo lo que hay por debajo de la frescura: partir la mesa
                                       // es peor que cualquier consideración de temporada o coste.
    comer_aparte_secundaria: 32,       // el mismo criterio al elegir la GUARNICIÓN, donde pesa
                                       // menos: partir la mesa en el acompañamiento (§7.4) no es
                                       // lo mismo que partirla en el principal.
    novedad_sobre_cupo: 512,           // §11.3-P4 · sirve una novedad a un menor por encima del
                                       // cupo de la semana. Por encima de partir la mesa: los
                                       // niños rechazan lo nuevo, y un rechazo tira el servicio.
    techo_cedido: 4096,                // §13.4 CONTRATOS · el candidato solo entra cediendo un
                                       // techo declarado. Es el coste más alto del motor a
                                       // propósito: por encima de la suma de todo lo demás, de
                                       // modo que un candidato que cede un techo pierde SIEMPRE
                                       // contra cualquiera que no lo ceda. No es un veto —eso lo
                                       // hace `contratos`—: es el último recurso, ordenado último.
    bigrama_repetido: 64               // §11.2-M5 · el par principal+guarnición ya visto. Laxa a
                                       // propósito: distingue un ancla elegida de la monotonía.
  },
  SATURACIONES_S: {
    frescura_dias: 28,                 // S1: a ≥28 días el plato es «nuevo del todo» (ventana D3)
    origen_servicios: 8,               // S2: a ≥8 servicios el origen ya no pesa
    progreso_tomas: 2,                 // S3-mínimos: ≥2 TOMAS de avance saturan esa mitad (5.4: la
                                       // cuota es frecuencia; era `progreso_raciones`)
    gasto_tomas: 2,                    // S3-techos: ≥2 TOMAS de techo ya cubierto saturan la otra
                                       // mitad. Mismo número que su espejo A PROPÓSITO: las dos
                                       // mitades son la misma moneda y saturarlas distinto sería
                                       // convertir una en la otra por la puerta de atrás (§13.5)
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
  T1_MAX_NODOS: 2e6,                   // §20.0 · backstop del DFS de T1, que estaba cableado a mano
                                       // en `t1_esqueleto`. NO es el presupuesto de búsqueda de
                                       // §20.36 —ése es de T2—: T1 resuelve exacto y esto solo
                                       // impide que una patología cuelgue la app. Medido en la
                                       // parrilla: el máximo real está cinco órdenes por debajo.
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
  // ⚑ `MARGEN_TECHO_T1` BORRADO el 4-ago-2026 (§20.40). Estaba declarado en 0,85 y NINGÚN código
  // lo leía —`t1_esqueleto` tenía un `margenTecho = 1` cableado al lado—, o sea un mando de
  // calibración que no calibraba. Al cerrar el bloque 10 se evaluó cablearlo y NO se hizo, con
  // dos razones medidas:
  //  · No arregla el problema para el que se escribió. Ese problema existe y está medido: el
  //    techo de `carne-total` lo ceden los MENORES en 33 de 41 casos de la parrilla, y con solo
  //    2 casillas de carne acumulan 5 tomas — la carne de más entra por el chorizo del potaje y
  //    el jamón de la pizza, que son cubos SECUNDARIOS de una casilla que no es de carne. Un
  //    margen sobre el techo no ve esos gramos: T1 razona sobre categorías, no sobre platos.
  //  · Aplicado, rompe la mesa mixta. El techo de carne roja de un menor es 1, y 1×0,85 = 0,85
  //    veta la PRIMERA casilla: ninguna mesa con un niño podría servir carne roja jamás.
  // Queda como fila abierta de `CONFORMIDAD.md` con su número, no como una constante muerta que
  // aparenta gobernar algo.
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
    // ⚑ 4-ago · FILA 5.1 — el techo del menor era `null` y T1 NO LO VEÍA. AC25 publica ≤2 al MES
    // y T2 sí lo aplicaba (`PROCESADA_MENSUAL_NINO_MAX / 4`), así que el esqueleto reservaba una
    // casilla de procesada que el niño no podía comer y el relleno la rechazaba: callejón puro.
    // Estaba enmascarado porque los tres platos que la traen se etiquetaban `sin-cuota` (fila
    // 5.2, el mismo bug de fondo) — al cerrar 5.2 salieron **3 semanas de 48 sin menú**, con el
    // motivo literal «procesada del niño n1 (techo mensual, aprox semanal)». Ahora T1 lo ve.
    // El valor es el mismo número repartido a semana, escrito una sola vez abajo: dos copias de
    // un techo es cómo T1 y T2 acabaron en desacuerdo.
    // ⚑ 4-ago-2026 (§20.39): el techo del menor SALE de aquí. Era `2/4` —el techo mensual de AC25
    // repartido a semana— y no podía cumplirse: no existe media ración. Vive ahora en
    // `CUOTAS_MENSUALES`, en su periodo, contado sobre el diario. Sin cota semanal para nadie.
    'carne-procesada': { adulto: [null, null], nino: [null, null] }
  },
  // fila 5.5 · los techos de D2 con `limite_g_dia` NO tienen todos la misma ventana (el atún es
  // de mes, los nitratos de día), así que la ventana es DATO DEL BANCO —`ventana_dias` en
  // `seguridad_infantil`— y no una constante de aquí. Escribirla en config habría vuelto a poner
  // un número de la fuente lejos de su unidad, que es el bug que 5.4 pagó. El contador vive en
  // `src/ventana_movil.js` y arranca del diario D3, la única memoria del motor que pasa de la semana.
  // ── §20.39 · TECHOS QUE LA FUENTE PUBLICA POR MES, CONTADOS POR MES (4-ago-2026)
  // AC25 publica la carne procesada de un menor como ≤2 al MES. Vivía repartida a semana —el
  // `2/4` de `CUOTAS`— y el propio funcional la marcaba como imposible: no existe media ración y
  // cualquier ración de un menor la supera. Medido con el techo semanal: 19 de 164 veredictos por
  // encima. Ahora el techo es el de la fuente, con su periodo, y el contador arranca del diario
  // D3 (`ventana_movil.js` §tomasPreviasDeCubo), igual que el atún. El techo SEMANAL de este cubo
  // desaparece de `CUOTAS` porque una banda de semana no puede expresar un techo de mes.
  CUOTAS_MENSUALES: {                  // cubo → { tramo: máximo de TOMAS en la ventana }
    'carne-procesada': { nino: 2 }     // AC25 ≤2/mes · adulto: «minimizar», sin cifra publicada
  },
  VENTANA_MENSUAL_DIAS: 30,            // el mes de la fuente, en días reales — la misma convención
                                       // que `seguridad_infantil.ventana_dias` usa para el atún

  // ── REFUNDACIÓN DE LA UNIDAD (spec §4, OK Roger 2-ago): la cuota es FRECUENCIA en TOMAS;
  //    la cantidad es personal en gramos; los techos de salud son absolutos en gramos/semana.
  TOMA_MIN_FRACCION: 0.5,              // una toma cuenta si la cantidad servida ≥ esta fracción
                                       // de la ración de referencia de SU tramo — sustituye a la
                                       // asimetría vieja («no cumplir pescado con tropiezos»).
                                       // A CALIBRAR §11
  // ── CATEGORÍAS CONTABLES (Roger, 4-ago): las que la fuente publica en PIEZAS, no en comidas.
  //    A22 escribe el huevo como «2-4/semana (unidades medianas, 53-63 g)» — son HUEVOS, no veces.
  //    En estas, un servicio aporta `round(gramos / unidad)`: la tortilla de dos huevos gasta 2 de
  //    los 4, el huevo duro 1, y los 15 g de un rebozado siguen aportando 0. Sin ellas, «4» de la
  //    fuente se leía como 4 COMIDAS y cuatro tortillas pasaban con 8 huevos dentro (caso C, 4-ago).
  //    Roger, textual: «nadie pesa los huevos y cortar por 12 g es una broma» — por eso la unidad
  //    es la pieza contada y NO un techo de gramos, que fue la propuesta que descartó.
  //    Legumbre, pescado y carne NO entran: su fuente las publica en raciones-cantidad y ahí un
  //    plato es una ración; su exceso lo gobiernan los techos de salud en gramos.
  CUOTAS_CONTABLES: ['huevo'],
  // ── EL PAPEL DE LA LÍNEA manda sobre cuánto puede moverla T3 (Roger, 4-ago). Es la misma
  //    regla que D12 detectó en el hidrato (AESAN publica arroz/pasta a 50-90 g en plato
  //    principal, 20-25 g en sopa, 20-40 g en guarnición), aquí en el huevo:
  //    · PROTAGONISTA — el huevo ES el plato. T3 lo mueve entre 1 y 2 piezas según sus kcal.
  //      Roger: «una tortilla de 1 huevo es pobre»; el suelo real medido en r/eggs también es 2.
  //    · COMPLEMENTO — el huevo marca la receta y no se mueve: salmorejo (1 huevo por cuenco),
  //      ensaladilla rusa (3 huevos/4 personas = 0,75), arroz tres delicias, flan. Roger:
  //      «subir el nivel de huevo rompe el equilibrio de receta».
  //    Los `ligante` del banco (empanado, rebozado, torrijas, pastel de carne) ya caen solos:
  //    15-30 g no llegan a pieza. ⚠️ DEUDA: esto es dato de BANCO viviendo en el motor — debe
  //    migrar a un campo de `lineas` cuando se pueda tocar `elaboraciones.js` (hoy lo tiene
  //    abierto la sesión de fotos, fila 6.4).
  PIEZAS_PROTAGONISTA: {
    huevo: ['tortilla-patata', 'tortilla-francesa', 'tortilla-francesa-verdura', 'tortilla-atun',
      'tortilla-campera', 'huevos-fritos-patatas', 'huevos-revueltos-tomate', 'huevos-rotos-jamon',
      'huevos-flamenca', 'huevo-duro'],
  },
  PIEZAS_PROTAGONISTA_RANGO: [1, 2],   // «siempre entre 1 y 2 (no más) en función de la persona»
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
    'carne-roja': 500                  // persona. WCRF/AICR publica 350-500 g/semana COCINADA.
                                       // ⚑ 4-ago: Roger pasa de 350 a 500 — sigue DENTRO del
                                       // rango de la fuente, ahora en su extremo permisivo.
                                       // Techo de salud: innegociable, jamás se relaja.
  },
  FRITOS_SEMANA_MAX: 2,                // regla de la casa (spec §4) — servicios, no raciones
  ESQUELETOS_POR_SEMANA: 6,            // cuántos repartos legales distintos puede pedirle T2 a T1
                                       // antes de rendirse (bucle T1↔T2). El canal era de un
                                       // sentido y un intento: la semana moría con un reparto
                                       // que otro esqueleto legal sí habría llenado.
  // ⚑ §20.41 · SON DOS CONSTANTES Y NINGUNA SOBRA (revisado el 4-ago-2026 y verificado con
  // `grep`: las dos se leen — `t1_esqueleto.js:63-64` y `generar.js:121`). No son dos copias del
  // mismo número: son los DOS extremos de un cupo, y el dictado de Roger del 3-ago tiene los dos
  // dentro — «acepto 1 o 2». `_MAX` es el techo duro; el otro es el OBJETIVO que puede ceder a 0
  // con descargo R0. Lo que estaba mal era el NOMBRE: `ELABORADO_POR_SEMANA` a secas parecía «el
  // número», y por eso el aviso §20.41 lo leyó como duplicado. Renombrado a `_MIN`, que es lo que
  // es, el par se lee solo y el aviso queda cerrado.
  ELABORADO_POR_SEMANA_MAX: 2,         // dictado Roger 3-ago: «acepto 1 o 2, siempre en comidas
                                       // de finde, jamás en una cena» (sábado/domingo mediodía,
                                       // donde va la cuota grande del día)
  ELABORADO_POR_SEMANA_MIN: 1,         // OBJETIVO, no obligación. Dictado Roger 3-ago, matiza el
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
const { edadEnSemana } = require('./derivar.js');   // para el supuesto del alta sin peso (3.4)

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
// `arranqueIso` (opcional, ley e27f4bd): la semana de referencia para el supuesto del alta sin
// peso — sin ella el contrato valida como siempre y ningún peso se rellena.
function normalizarFamilia(familia, datos, arranqueIso) {
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
    // ── EL SUPUESTO DEL ALTA SIN PESO (ley e27f4bd · funcional 3.4 con 1.13/1.14): un menor de
    //    3-10 sin peso NO revienta el contrato — recibe el peso mediano OMS de su edad y sexo
    //    (tabla `pesos_referencia` del banco) y el supuesto se DECLARA, jamás en silencio.
    //    RELLENA, no exime: aguas abajo todo el motor ve un miembro con peso real y nadie más
    //    tiene que saber de esto (propagar un `peso = null` sería un NaN esperando sitio).
    //    Y NO es quitar la validación: sin fila de referencia —adulto, 11-17 (la OMS no publica
    //    peso por edad ahí y 10.2 prohíbe extrapolar), o tabla ausente— el error de abajo sigue
    //    siendo el de siempre. La ALTURA de un menor no se usa en ningún cálculo (energia.js
    //    solo la lee en la fórmula adulta), así que aquí solo se exige donde se consume.
    const edadRef = (arranqueIso && NACIMIENTO.test(String(m.nacimiento || '')))
      ? edadEnSemana(m.nacimiento, arranqueIso) : null;
    if (m.peso_kg == null && edadRef != null && SEXOS.includes(m.sexo)) {
      const ref = (datos.pesos_referencia || []).find(p => p.edad === edadRef && p.sexo === m.sexo);
      if (ref) {
        m.peso_kg = ref.mediana_kg;
        m.peso_estimado = true;
        avisa(`peso estimado por edad: la ficha no trae peso y se usa la mediana OMS de ${edadRef} años (${ref.mediana_kg} kg) — funcional 3.4`);
      }
    }
    // La ALTURA solo la consume la fórmula adulta (energia.js, rama edad >= 18; los menores van
    //    por Schofield, que es a·peso + b): se exige donde se lee. En un menor es opcional por
    //    ley (3.4) — si viene, se valida el rango; si no hay `arranqueIso` (llamadores viejos),
    //    la exigencia queda como siempre.
    if ((edadRef == null || edadRef >= 18 || m.altura_cm != null)
        && !(Number(m.altura_cm) > 30 && Number(m.altura_cm) < 250)) err(`altura_cm fuera de rango: ${JSON.stringify(m.altura_cm)}`);
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
//   avance_tomas              TOMAS que el candidato aporta a mínimos AÚN pendientes de los
//                             presentes esta semana (Σ sobre miembro×cubo, saturado en config).
//                             Era `avance_raciones` y contaba fracciones de ración contra una
//                             banda escrita en tomas — fila 5.4, 4-ago: lo que hace progresar
//                             «legumbre 3 veces» es comerla una vez más, no comer más de una vez.
//   gasto_techo               su ESPEJO (§13.4, 4-ago-2026): cubos que el candidato DESBORDA a
//                             algún presente contando la proyección —lo que hay + lo que aporta +
//                             lo que las casillas pendientes consumirán—. Σ sobre miembro×cubo,
//                             saturado en config. El borde es «desborda», no «gasta»: las tres
//                             alternativas están medidas en `t2_relleno` §aporta.
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
  // ── S3 · EL ESTADO DE LA CUOTA, LOS DOS EXTREMOS DE LA BANDA (§13.4, reescrito el 4-ago-2026)
  // Se llamaba `progreso_cuotas` y era `1 − avance`: solo veía el MÍNIMO. Una banda tiene dos
  // extremos, y el que faltaba es el que la parrilla estaba pagando (§13.4 en el funcional, con
  // la medida). No es un término NUEVO —eso habría roto la escala lexicográfica de `PESOS_S`, en
  // la que 256 > 128+64+16+8+4+2+1 y cada peso domina a todos los de abajo juntos—: es el mismo
  // término midiendo la banda entera. Su rango sigue siendo [0,1] y su peso sigue siendo 64.
  //   0   = avanza mínimos a saturación y no gasta ningún techo → ideal
  //   0,5 = ni avanza ni gasta → neutro (antes ESTE caso valía 1, el peor)
  //   1   = no avanza nada y gasta techo a saturación → peor
  // Las dos mitades pesan igual a propósito: cubrir un mínimo y no quemar un techo son la misma
  // moneda (TOMAS de `config.CUOTAS`, §10.3), y ninguna se convierte en la otra.
  estado_cuotas: (s, sat) => clamp01((
    (1 - clamp01((s.avance_tomas || 0) / sat.progreso_tomas))
    + clamp01((s.gasto_techo || 0) / sat.gasto_tomas)) / 2),
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

  /* ---- motor_v6/src/cuotas.js ---- */
  REG['cuotas'] = function (module, exports, require) {
// CUOTAS · LA DEFINICIÓN ÚNICA DE LA UNIDAD EN QUE SE CUENTA UNA CUOTA (fila 5.4, 4-ago).
//
// ── QUÉ ARREGLA
// `config.CUOTAS` está escrita en TOMAS («legumbre 2-4/semana» = comer legumbre 2-4 VECES,
// spec §4). T1 la respetaba —presupuesta en SERVICIOS, peso 1— y T4 también —cuenta tomas
// enteras con `TOMA_MIN_FRACCION`—, pero **T2 acumulaba fracciones de ración contra la misma
// banda**: `st.minimos[mid][cubo] += gramos/racionRef`. Dos monedas, un solo número, y el motor
// las sumaba como si fueran una. Medido el 4-ago sobre la parrilla (12 familias × 4 semanas):
//   · 1.442 de 2.240 servicios-miembro (64,4%) con al menos un cubo donde la fracción no es la
//     toma que aporta.
//   · 262 de 1.031 veredictos de banda (25,4%) en los que las dos varas dicen COSAS DISTINTAS:
//     `omnivora-2a2n` W04 a1 huevo — 6,5 «raciones» ⇒ PASADO contra un techo de 4, cuando las
//     tomas reales son 3 y la semana está en banda. Y al revés: n1 legumbre 2,9 ⇒ CORTO con 4
//     tomas servidas, o sea un descargo de «mínimo no cubierto» que era falso.
// La consecuencia de producto es la que bloqueaba el bloque 3: el panel de equilibrio no podía
// pintarse porque el número que la familia vería no era el que el motor usa para decidir.
//
// ── EL PATRÓN, HEREDADO DE LA ETAPA D (`ejes.js`): UNA definición, DOS recuentos
// Este módulo NO recorre nada. Recibe las líneas YA RESUELTAS por quien llama —T2 sobre la
// PLANTILLA de la elaboración, T4 sobre lo SERVIDO a cada miembro— y solo aplica el metro. Eso
// es lo que mantiene viva la doble contabilidad de §1-T4: lo propio del juez es el RECORRIDO
// (qué se sirvió, a quién, con cuántos gramos), jamás la DEFINICIÓN de la unidad. Dos
// definiciones del mismo número no auditan mejor; hacen que el desacuerdo sea ininterpretable.
// La batería A del harness conserva su implementación INDEPENDIENTE a propósito: es el tercer
// testigo y su careo con T4 es un gate vivo — no se toca.
//
// ── LAS TRES MONEDAS DE §4, SEPARADAS AQUÍ Y NO CONVERTIBLES ENTRE SÍ
//  1. TOMAS — frecuencia, idéntica para todos. Un servicio aporta **1 toma** de un cubo al
//     comensal que lo come, tenga el plato el tamaño que tenga: «nadie gasta más cuota por comer
//     más» (Roger, 2-ago). Umbral para que cuente: gramos del cubo EN EL SERVICIO ENTERO ≥
//     `TOMA_MIN_FRACCION` × la ración de referencia de SU tramo — evita cumplir pescado con
//     tropiezos. Es la unidad de `config.CUOTAS`.
//  2. GRAMOS DE TECHO DE SALUD — absolutos y poblacionales (`TECHOS_SALUD_G_SEMANA`). No escalan
//     con la persona porque el riesgo tampoco. Cuenta TODO gramo: no existe «demasiado poco para
//     contar», existe el gramo (fila 4.5).
//  3. FRACCIONES — se calculan y se exponen porque son la materia prima de las otras dos y la
//     señal de progreso de T2 las usa, pero **jamás se comparan contra una banda de `CUOTAS`**.
//     Ese era exactamente el bug.
//
// ── POR QUÉ LA TOMA SE DECIDE SOBRE EL SERVICIO Y NO SOBRE LA PIEZA
// El umbral es del plato que se come, no de cada trozo: 0,3 raciones de legumbre en el principal
// y 0,3 en la guarnición son 0,6 y son UNA toma, no dos medias ni ninguna. Por eso la API
// acumula gramos y decide al cerrar el servicio; sumar tomas pieza a pieza contaba de más y
// filtrar pieza a pieza contaba de menos.
'use strict';
const { racionParaLinea } = require('./raciones.js');

// categoría D1 → cubos de cuota que alimenta (ella misma + sus agregados de §4).
// Único sitio donde se dice qué cubo alimenta qué: `t1_esqueleto.js` lo deriva de aquí vía
// `AGREGADOS`/`cubosDe`, que sigue siendo suyo porque T1 razona sobre CATEGORÍAS de pool.
const CUBOS_DE = {
  legumbre: ['legumbre'],
  'pescado-blanco': ['pescado-total'],
  'pescado-azul': ['pescado-total', 'pescado-azul'],
  marisco: ['pescado-total'],
  huevo: ['huevo'],
  'carne-roja': ['carne-total', 'carne-roja'],
  'carne-blanca': ['carne-total'],
  'carne-procesada': ['carne-total', 'carne-procesada']
};

// índice alimento_id → fila D1, cacheado por banco (mismo patrón y motivo que `ejes.js`:
// este módulo lo llaman T2, T4 y la superficie, y no puede depender de que traigan índice).
const cacheD1 = new WeakMap();
function filaD1De(datos, alimentoId) {
  let ix = cacheD1.get(datos);
  if (!ix) {
    ix = {};
    for (const f of datos.categorias_aesan || []) ix[f.alimento_id] = f;
    cacheD1.set(datos, ix);
  }
  return ix[alimentoId];
}

// unidad física del alimento en gramos (`alimentos.unidad_g`), cacheada por banco.
// ⚑ Por qué NO vale la ración de la categoría para contar piezas (4-ago, sesión 6): D1 publica
// `racion_ref_g: 58` para las TRES formas del huevo —entero, yema y clara— porque su rango
// «53-63 g» es el de la UNIDAD MEDIANA. Dividir por 58 los 34 g de yema de unas natillas da 1
// pieza, cuando el banco dice que una yema pesa 17 g: son DOS. La nota de D1 en `clara-huevo`
// («fracción de unidad: el conteo fraccional por gramos lo resuelve») era cierta mientras la
// cuota fuese fraccional; 5.4 la pasó a piezas contadas y la nota quedó obsoleta sin que nadie
// la revisara. El error va hacia CONTAR DE MENOS, que es el lado peligroso: un adulto con
// natillas y crema catalana en la misma semana come 4 yemas y el motor le apuntaba 2.
const cacheUnidad = new WeakMap();
function unidadDe(datos, alimentoId) {
  let ix = cacheUnidad.get(datos);
  if (!ix) {
    ix = {};
    for (const a of datos.alimentos || []) if (a.unidad_g > 0) ix[a.id] = a.unidad_g;
    cacheUnidad.set(datos, ix);
  }
  return ix[alimentoId];
}

// ── DE FRACCIÓN DE UNIDAD A PIEZAS CONTADAS (§10.8, decisión de Roger 4-ago-2026)
// El funcional escribe la tabla del huevo con una fila que fija el borde: «ligante de rebozado o
// empanado, **de 15 a 30 g — 0/0**». Treinta gramos son media unidad exacta, y `Math.round` los
// subía a 1 porque JavaScript desempata el 0,5 hacia arriba. Medido el 4-ago sobre el banco: son
// tres líneas reales —`torrijas` 30 g, `pastel-carne` 30 g, `pollo-pepitoria` 30 g— y la de
// torrijas es un POSTRE, que se elige por política y no pasa por el techo de `contratos`: un
// huevo entero del cupo semanal entraba por la puerta que nadie vigila.
//
// El corte es ESTRICTO, no una tolerancia: cuenta una pieza quien pasa de media, no quien la
// iguala. Es la misma doctrina de §10.9 —«por debajo del ruido de la propia unidad, afinar es
// falsa precisión»—, con el ruido puesto donde la fuente lo pone: la unidad mediana del huevo es
// 53-63 g, así que medio huevo cae dentro del margen de un huevo real y redondear al alza inventa
// precisión que el dato no tiene. El empate va a la baja SIEMPRE, incluido 1,5 → 1.
const aPiezas = x => Math.max(0, Math.ceil(x - 0.5 - 1e-9));

// ── LA FUNCIÓN DE LA UNIDAD
// `piezas` = líneas ya resueltas por quien llama: { alimento, gramos } (`papel` se ignora a
// propósito — fila 4.5: una etiqueta que EXIME de contar es tan peligrosa como una que afirma).
// `miembro` = { edad } · null/undefined ⇒ vara adulta.
// Devuelve, POR SERVICIO:
//   tomas      — { cubo: 1 } de los cubos que superan el umbral. La unidad de `config.CUOTAS`.
//   fracciones — { cubo: nº } raciones acumuladas. Informativo: NUNCA contra una banda.
//   gramosSalud— { categoria: gramos } de las categorías con techo absoluto en gramos/semana.
//   huecos     — líneas cuyo alimento no tiene ración publicada para ese comensal. No son
//                incumplimientos: son dato que falta, y se cuentan aparte para que un veredicto
//                no pueda salir verde PORQUE no se midió.
function cuotaDeServicio(piezas, miembro, datos, config, opts = {}) {
  const edad = miembro ? miembro.edad : null;
  const gramosCubo = {}, racionCubo = {}, gramosSalud = {}, huecos = [], protagonista = {};
  const piezasCubo = {};                       // solo para categorías CONTABLES: piezas físicas
  for (const l of piezas) {
    const filaD1 = filaD1De(datos, l.alimento);
    if (!filaD1) continue;
    const cubos = CUBOS_DE[filaD1.categoria];
    if (!cubos) continue;
    const r = racionParaLinea(datos, filaD1, edad);
    if (r.hueco) { huecos.push({ alimento: l.alimento, gramos: l.gramos, hueco: r.hueco }); continue; }
    // la legumbre del banco viaja en SECO y su ración también: se convierte ANTES de dividir,
    // igual que en el eje. Es la única categoría con base doble hoy.
    let g = l.gramos || 0;
    if (filaD1.categoria === 'legumbre') g = g / config.FACTOR_LEGUMBRE_SECO_COCIDO;
    // piezas FÍSICAS de esta línea, con la unidad de SU alimento y no la de su categoría. Se
    // acumulan fraccionales y se redondea UNA vez al cerrar el servicio: dos yemas y un huevo
    // entero son tres piezas, y media yema en un ligante sigue sin llegar a ninguna.
    const u = unidadDe(datos, l.alimento);
    for (const c of cubos) {
      gramosCubo[c] = (gramosCubo[c] || 0) + g; racionCubo[c] = r.g;
      if (u > 0) piezasCubo[c] = (piezasCubo[c] || 0) + g / u;
      // ¿esta categoría contable llega por una elaboración donde es PROTAGONISTA? Entonces T3
      // podrá moverla dentro del rango, y quien PREVÉ (T2) tiene que contar con el extremo alto.
      if (((config.PIEZAS_PROTAGONISTA || {})[filaD1.categoria] || []).includes(l.elaboracion_id))
        protagonista[c] = true;
    }
    // el techo de salud cuenta el gramo REAL servido, sin conversión ni umbral
    if (config.TECHOS_SALUD_G_SEMANA[filaD1.categoria])
      gramosSalud[filaD1.categoria] = (gramosSalud[filaD1.categoria] || 0) + (l.gramos || 0);
  }
  const contables = config.CUOTAS_CONTABLES || [];
  const tomas = {}, fracciones = {};
  for (const [c, g] of Object.entries(gramosCubo)) {
    if (!(racionCubo[c] > 0)) continue;
    fracciones[c] = g / racionCubo[c];
    // categorías CONTABLES (huevo): la fuente publica PIEZAS, así que el servicio aporta las
    // piezas que sirve — 120 g de tortilla son 2 huevos de los 4 de la semana, no «una comida
    // con huevo». En el resto la unidad es la toma: 1 si supera el umbral, y comer más no gasta
    // más cuota (§4 punto 1).
    if (contables.includes(c)) {
      // sin `unidad_g` en el banco no se inventa una pieza: se cae a la ración de la categoría,
      // que es lo que había antes, y el hueco es visible en el dato, no aquí.
      let piezas = aPiezas(piezasCubo[c] != null ? piezasCubo[c] : g / racionCubo[c]);
      // PREVISIÓN vs VERDAD: T2 decide ANTES de que T3 exista, y en las protagonistas T3 puede
      // subir la ración hasta el extremo del rango. Quien prevé cuenta con ese extremo — si
      // contara la receta, serviría por encima del techo creyendo que le cabe. T4 no lo hace:
      // mide lo servido, que ya es la verdad. Es la misma DEFINICIÓN con dos recorridos (§1-T4).
      if (opts.peorCaso && protagonista[c] && piezas > 0)
        piezas = Math.max(piezas, config.PIEZAS_PROTAGONISTA_RANGO[1]);
      if (piezas > 0) tomas[c] = piezas;
    } else if (g >= racionCubo[c] * config.TOMA_MIN_FRACCION) tomas[c] = 1;
  }
  return { tomas, fracciones, gramosSalud, huecos };
}

module.exports = { cuotaDeServicio, CUBOS_DE, filaD1De, unidadDe, aPiezas };

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

  /* ---- motor_v6/src/ejes.js ---- */
  REG['ejes'] = function (module, exports, require) {
// EJES · ETAPA D — la DEFINICIÓN ÚNICA de «cuánto es una ración de este eje para este comensal»,
// EN GRAMOS y por comensal (fila 4.1 de la lista única, 3-ago).
//
// ── QUÉ SE UNIFICA Y QUÉ NO (decisión explícita, porque las dos cosas se pedían a la vez)
//
// Se UNIFICA la definición. Antes vivía duplicada como literales en TRES sitios:
//   · `t2_relleno.js`  → `const RACION_FV_ADULTO = 175`
//   · `t4_auditoria.js`→ `const RACION_FV = { adulto: 175, nino: 135 }`
//   · `bd_v6/validar.js` → `var RACION_VERDURA_ADULTO = 175`
// Tres copias del mismo número, ninguna leída del banco, y ya divergentes: T2 medía SIEMPRE con
// vara adulta y T4 con la del tramo. Es el patrón de bug nº1 del proyecto («dos implementaciones
// de la misma medida: una está mal») con el agravante de que el número ni siquiera salía del
// banco — 175 es la ración de verdura de A22 y estaba escrita a mano en el código.
//
// NO se unifica el RECUENTO, y es deliberado. §1-T4 exige que el juez tenga vara propia: T2
// recorre la PLANTILLA de la elaboración (antes de saber quién se sienta, con el peor caso en
// las líneas de eje) y T4 recorre lo SERVIDO a cada miembro (con sustitutos, eliminaciones y la
// opción realmente elegida). Son dos preguntas distintas y las dos implementaciones se conservan
// intactas. Lo que este módulo da a los dos es EL METRO —qué categorías cuentan, cuántos gramos
// son una ración para ese comensal, qué fracción exige el umbral—, jamás la medición.
//
// ── CÓMO SE MIDE: en FRACCIONES DE RACIÓN, no en gramos contra un divisor único
// Un eje lo cubren categorías con raciones distintas (verdura 175 g y fruta 160 g; arroz 70 g y
// patata 175 g). Dividir todo por un solo número era posible mientras el eje medible era uno;
// con `hidrato` es imposible —70 g de arroz y 175 g de patata son la MISMA ración— así que cada
// línea aporta `gramos / su ración` y se suman las fracciones. La ración por línea sale de
// `raciones.js`, que ya es la vara única de la batería A, el prevuelo y el relleno: aquí no se
// inventa ninguna ración nueva, se reusa la que ya existe.
//
// ── BASE: si no se puede comparar, se declara hueco
// La ración trae la base en la que la fuente la pesó (`crudo` el grano, `cocido` el pan). Si la
// línea del banco declara otra base, los gramos NO son comparables y la línea se cuenta como
// HUECO — nunca se convierte a ojo. Hoy no hay ni un choque (medido: 56 líneas de cereal y
// tuberculo, 0 choques), pero el día que entre uno tiene que verse, no colarse.
'use strict';
const { racionParaLinea } = require('./raciones.js');

// eje → categorías D1 que lo cubren. Único sitio donde se dice qué cuenta para qué eje.
// `proteina` se define para que la etapa D esté completa, pero NO se usa como gate: la cubre
// SIEMPRE el principal por tipo (T2) y su suelo real es el proteico de T3, en gramos de
// proteína y no de alimento. Aquí está para medir, no para bloquear.
const EJE_CATEGORIAS = {
  'fruta-verdura': ['verdura', 'fruta'],
  hidrato: ['cereal', 'tuberculo'],
  proteina: ['legumbre', 'pescado-blanco', 'pescado-azul', 'marisco', 'huevo',
    'carne-roja', 'carne-blanca', 'carne-procesada'],
};
const EJES = Object.keys(EJE_CATEGORIAS);

const catDeEje = {};
for (const [eje, cats] of Object.entries(EJE_CATEGORIAS)) for (const c of cats) catDeEje[c] = eje;

// ¿la categoría D1 de este alimento cuenta para este eje?
const cuentaParaEje = (filaD1, eje) => !!filaD1 && catDeEje[filaD1.categoria] === eje;

// índice alimento_id → fila D1, cacheado por banco. T2 y T4 tienen cada uno el suyo, pero este
// módulo se llama también desde el validador y desde la superficie: que no dependa de que quien
// llama traiga índice. WeakMap = no retiene el banco del hogar cuando la familia se va.
const cacheD1 = new WeakMap();
function filaD1De(datos, alimentoId) {
  let ix = cacheD1.get(datos);
  if (!ix) {
    ix = {};
    for (const f of datos.categorias_aesan || []) ix[f.alimento_id] = f;
    cacheD1.set(datos, ix);
  }
  return ix[alimentoId];
}

// Fracción de ración que aporta UNA línea ya resuelta.
//   linea: { alimento, gramos, papel, base }  — la forma mínima que T2 y T4 pueden dar los dos
//   miembro: { edad }                          — null/undefined = vara adulta
// Devuelve { fraccion } o { hueco: 'sin-racion' | 'menor-3' | 'base-incompatible' }.
function fraccionDeLinea(datos, filaD1, linea, miembro) {
  const r = racionParaLinea(datos, filaD1, miembro ? miembro.edad : null);
  if (r.hueco) return { hueco: r.hueco };
  if (filaD1.base && linea.base && filaD1.base !== linea.base) return { hueco: 'base-incompatible' };
  return { fraccion: (linea.gramos || 0) / r.g };
}

// ── LA FUNCIÓN DE LA ETAPA D
// `piezas` = las líneas YA resueltas por quien llama, cada una { alimento, gramos, papel, base }.
// Quien llama es dueño de su recorrido (plantilla en T2, servido en T4): eso es lo que mantiene
// viva la doble contabilidad. Aquí solo se aplica el metro.
function cubreEje(piezas, miembro, eje, datos, config) {
  let fraccion = 0;
  const huecos = [];
  for (const l of piezas) {
    if (l.papel === 'condimento') continue;          // el condimento no cierra ejes (spec §2-bis)
    const filaD1 = filaD1De(datos, l.alimento);
    if (!cuentaParaEje(filaD1, eje)) continue;
    const r = fraccionDeLinea(datos, filaD1, l, miembro);
    if (r.hueco) { huecos.push({ alimento: l.alimento, gramos: l.gramos, hueco: r.hueco }); continue; }
    fraccion += r.fraccion;
  }
  const umbral = config.EJE_MIN_FRACCION;
  return { fraccion, umbral, cubre: fraccion >= umbral, huecos };
}

module.exports = { cubreEje, fraccionDeLinea, cuentaParaEje, EJE_CATEGORIAS, EJES };

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
const { fraccionarSemana, sellarResumenSemana } = require('./t3_fracciones.js');
const { serializarCorrida } = require('./serializar.js');
const { auditar } = require('./t4_auditoria.js');
const { objetivoDiario } = require('./energia.js');
const { normalizarFamilia } = require('./contrato_familia.js');
const { bancoDelHogar, anotarHogar } = require('./banco_hogar.js');
const { anotarSemana } = require('./seguridad_infantil.js');
const { memoria, diarioDesdeCorrida } = require('./memoria.js');
const { acumuladoPrevio, tomasPreviasDeCubo } = require('./ventana_movil.js');
const { cuotaDeServicio } = require('./cuotas.js');
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
  const familia = normalizarFamilia(familiaDeclarada, datos, arranqueIso).familia;
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
    //
    // ⚑ 5-ago-2026 · EN SU POSICIÓN REAL, Y SOLO LO YA SERVIDO. Antes se inyectaba el cole de la
    // semana QUE SE ESTÁ GENERANDO —días 1 a 5, todos en el futuro— y el de las semanas pasadas
    // no entraba nunca. Las dos mitades del error se sumaban en `memoria()`, que ordena por fecha
    // y mide M2 como distancia DESDE EL FINAL: cinco servicios futuros al final del array alejan
    // artificialmente lo que sí se sirvió, y además la ventana rodante de 28 puede desalojar
    // pasado real para hacerles sitio. Medido: `curso-escolar` W05 1-cena repetía `asado-horno` a
    // 2 servicios con M2=4 y T2 no lo veía, mientras T4 —que no ve el cole— sí. La memoria es una
    // ventana de servicios SERVIDOS (§11.1, §17.5); lo que aún no ha ocurrido no es memoria. El
    // futuro del cole tiene su regla propia, la D+1 de §9.6, y esa la aplica `rellenarSemana`
    // desde `menuCole` — no desde aquí.
    for (const sv of semanas) for (const c of serviciosDelCole(familia, sv.semana_iso)) diario.servicios.push(c);
    const hoy = fechaDia(semanaIso, 1).toISOString().slice(0, 10);   // lunes de la semana a generar
    const mem = memoria(diario, banco, config, hoy);
    // fila 5.5 · los techos de D2 que son de MES viven fuera de la semana: lo ya servido en la
    // ventana móvil sale del diario, igual que la memoria. Se calcula aquí, junto a `memoria()`,
    // porque comparte exactamente su fuente y su momento — el diario ya montado con el pasado
    // real, el cole incluido, antes de que T1 reparta nada.
    const ventanaPrevia = acumuladoPrevio(diario, banco, config, entrada.edades,
      fechaDia(semanaIso, 1), fechaDia);
    // §20.39 · el techo MENSUAL de carne procesada de un menor (AC25 ≤2/mes) se cuenta en su
    // ventana real de 30 días, no repartido a semana: media ración no existe, así que el `2/4`
    // que había era un techo imposible de cumplir. Sale del mismo diario y del mismo momento que
    // la memoria y que la ventana de gramos: el pasado real ya montado, con el cole dentro.
    const tomasPreviasCubo = tomasPreviasDeCubo(diario, banco, config, entrada.edades,
      fechaDia(semanaIso, 1), Object.keys(config.CUOTAS_MENSUALES || {}),
      config.VENTANA_MENSUAL_DIAS, cuotaDeServicio);

    entrada.memoria = mem;                           // el prevuelo la necesita para las claves
    entrada.tomasPreviasCubo = tomasPreviasCubo;     // §20.39: y lo ya servido en la ventana de mes
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
    const configSinCalma = { ...configIntento, ELABORADO_POR_SEMANA_MIN: 0 };
    for (const cfg of [configIntento, configSinCalma]) {
      for (let i = 0; i < maxIntentos; i++) {
        const e = esqueleto(entrada, pools, cfg, pre, i);
        intentos++;
        if (!e.ok) { esq = esq && esq.ok ? esq : e; continue; }
        esq = e;
        r = rellenarSemana({ entrada, esq: e, pre, pools, datos: banco, config: cfg, memoria: mem,
          menuCole: familia.menu_cole, ventanaPrevia, tomasPreviasCubo });
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
      // ── EL SELLO (ley 13.11.1): el resumen de semana —mínimos y techos fuera de banda— se
      // escribe AQUÍ, al cerrar T3, desde la columna Servida y con las bandas del prevuelo.
      // El número declarado es el que llegó al plato; la proyección de T2 queda como dato
      // interno. Antes lo escribía T2 y el 71% de las cifras no eran las del juez.
      sellarResumenSemana(r.semana, pre.bandasEfectivas, t3.tomas_servidas);
      // D2 · las 16 reglas de atragantamiento: nota en la card, jamás prohibición (§seguridad_infantil)
      // + §13: la card dice UNA vez lo que la política de hogar hizo con cada plato que lleva.
      semanas.push(anotarHogar(anotarSemana(r.semana, familia, entrada.edades, banco), politica));
    }
    semanaIso = siguienteSemana(semanaIso);
  }
  // ── T4 · AUDITORÍA, DENTRO DEL PIPELINE (fila 4.2, 3-ago). Hasta hoy `auditar()` estaba
  // escrita y la GENERACIÓN no la llamaba: el único invocador real era `cambiarPlato` de la
  // superficie, así que un menú generado salía por la puerta sin que nadie lo re-contase.
  //
  // QUÉ HACE Y QUÉ NO. NO regenera, NO corrige y NO tumba la semana: si T4 corrigiera al
  // generador dejaría de ser un contador independiente y pasaría a ser parte del generador
  // (§1-T4: «divergencia = BUG, jamás ajuste»). Lo que hace es dejar el veredicto PEGADO a la
  // corrida —`auditoria`, con su gate binario POR SERVICIO en `auditoria.servicios`— para que
  // ningún consumidor pueda leer un menú sin ver si pasó o no. Quien decide qué hacer con un
  // gate rojo es el llamador; lo que ya no puede es no enterarse.
  const corrida = serializarCorrida({ familia, semanas, version: VERSION, datos });
  corrida.auditoria = auditoriaDeCorrida(corrida, banco, config);
  return corrida;
}

// veredicto de T4 + su desglose BINARIO por servicio (dia-servicio → true/false y por qué)
function auditoriaDeCorrida(corrida, banco, config) {
  const objetivos = Object.fromEntries(corrida.familia.miembros.map(m =>
    [m.id, objetivoDiario(m, corrida.semanas[0].semana_iso, config)]));
  const r = auditar(corrida, banco, config, objetivos);
  // gate por servicio: un servicio es ROJO si arrastra una relajación sin declarar, una
  // divergencia o un eje corto DE LOS QUE HOY SON GATE (fruta-verdura). El hidrato viaja en
  // `informativos` porque su umbral está pendiente de Roger — visible, nunca callado.
  const servicios = {};
  const marca = (lista, campo) => {
    for (const x of lista) {
      if (!x.semana || !x.slot) continue;
      const k = `${x.semana}|${x.slot}`;
      const s = servicios[k] = servicios[k] || { ok: true, motivos: [], informativos: [] };
      if (campo === 'informativos') { s.informativos.push(x.tipo); continue; }
      s.ok = false;
      s.motivos.push(x.tipo);
    }
  };
  marca(r.silenciosas, 'motivos');
  marca(r.divergencias, 'motivos');
  marca(r.eje_corto.filter(e => e.tipo === 'eje-fruta-verdura-corto'), 'motivos');
  marca(r.eje_corto.filter(e => e.tipo !== 'eje-fruta-verdura-corto'), 'informativos');
  return { gates: r.gates, gates_informativos: r.gates_informativos, ok: r.ok,
    metricas: r.metricas, servicios,
    servicios_en_rojo: Object.values(servicios).filter(s => !s.ok).length };
}

// menú del cole de UNA semana → servicios de diario, con su fecha real. El llamador decide QUÉ
// semanas pasa: solo las YA SERVIDAS, porque la memoria es una ventana de lo servido (§11.1).
function serviciosDelCole(familia, semanaIso) {
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
      // fila 5.5 · las NOTAS son parte de lo que se sirvió, no un derivado: son la forma en que
      // la mesa mixta expresa quién come qué (`solo-para`, `sustituto`, `eliminar`). Sin ellas el
      // diario dice que todos comieron el plato de la mesa, y cualquier contador que mire hacia
      // atrás —el de ventana móvil de D2, el primero— atribuye a un comensal comida que no probó.
      // Medido al construirlo: 247 g de atún imputados a un niño de 9 años que come CERO.
      // Es campo ADITIVO: un diario viejo sin `notas` se lee igual, solo que sin poder afinar.
      notas: sv.notas || [],
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
  //
  // ⚑ 4-ago · FILA 5.2 — `sin-cuota` ESCONDÍA CARNE ROJA. El encabezado de este fichero define
  // `sin-cuota` como «NINGUNA línea cae en cubo con banda», y el código no lo implementaba:
  // elegía el animal de más gramos SIN mirar si su categoría tenía banda y, si el ganador caía
  // fuera de los cubos, devolvía `sin-cuota` tirando el resto. Con `canelones-carne` ganaba la
  // LECHE de la bechamel —`lacteo` es ANIMAL pero no es cubo de cuota— y los 110 g de carne roja
  // desaparecían del reparto: T1 reservaba la casilla como «no consume techo» y T2 después SÍ
  // contaba esos gramos, así que la semana rompía un techo de SALUD que el esqueleto creía
  // intacto. Medido sobre el banco: de 5 candidatos `sin-cuota`, **3 escondían un cubo con banda
  // y los 3 eran techo de salud** — `canelones-carne` (carne-roja 110 g), `pasta-gratinada`
  // (procesada 60 g) y `croquetas-caseras×jamon-serrano` (procesada 50 g).
  //
  // Es la MISMA familia que 4.5 (una etiqueta que exime de contar) y se cierra igual: quitando
  // la exención, no poniéndole umbral. La diferencia con 4.5 es dónde vivía — allí era el
  // `papel === 'condimento'` del cómputo de T2; aquí es un `lacteo` que gana por peso y silencia
  // a los demás. `papel === 'condimento'` SÍ se conserva aquí, y no es una exención de contar
  // sino de RESERVAR: T2 y T4 cuentan esos gramos igual (4.5), y si el condimento pudiera ser
  // dominante, un plato de verdura con 5 g de jamón se reservaría como carne procesada.
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
        const f = cat[alimentoId];
        // el candidato a dominante tiene que PODER serlo: solo cuenta si su categoría es un cubo
        // que T1 reserva. Un animal fuera de cubo (la leche de la bechamel) no gana la carrera —
        // ni la gana ni la tapa.
        if (f && CUBOS.has(f.categoria)) {
          if (ANIMAL.has(a.naturaleza) && (!mejorAnimal || g > mejorAnimal.g)) mejorAnimal = { id: alimentoId, g };
          // sin animal: manda la proteína real, no los gramos (una pasta pesa más que su legumbre)
          if (!mejorProt || g > mejorProt.g) mejorProt = { id: alimentoId, g };
        }
      }
    };
    recorrer(id, 1);
    const elegido = mejorAnimal || mejorProt;
    // ahora sí: `sin-cuota` significa lo que el encabezado dice, ninguna línea en cubo con banda
    return elegido ? cat[elegido.id].categoria : 'sin-cuota';
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
const { cuotaDeServicio } = require('./cuotas.js');
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
      // ⚑ §20.39 · TECHO DE VENTANA MENSUAL VISTO DESDE LA SEMANA. Un cubo con techo de MES
      // (`CUOTAS_MENSUALES`) no tiene banda semanal —repartirlo entre 4 daba media ración, que no
      // existe—, pero T1 sí necesita una cota o reservaría casillas que T2 tendrá que rechazar.
      // La cota correcta no es el mes partido: es **lo que queda del mes**, que es un hecho leído
      // del diario. Con la ventana vacía el menor puede tener sus 2 en la misma semana, que es
      // exactamente lo que la fuente permite; con una ya servida, solo le queda una.
      const mensual = (config.CUOTAS_MENSUALES || {})[cubo];
      const techoMes = mensual ? mensual[tramo] : null;
      const restanteMes = techoMes == null ? Infinity
        : Math.max(0, techoMes - (((entrada.tomasPreviasCubo || {})[m.id] || {})[cubo] || 0));
      bandasEfectivas[m.id][cubo] = {
        min: minEfectivo,
        // techos AESAN: JAMÁS se suben (Q1). Sí pueden BAJAR por M6: un cubo cuyo candidato
        // comible es siempre frito no puede ocupar más slots que el techo de fritos
        max: Math.min(max == null ? Infinity : max * factor, capFritos, restanteMes)
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

  // ── EL PESO DE UNA CASILLA, EN LA UNIDAD DE LA FRECUENCIA (§13.7-13.8, 4-ago-2026)
  //
  // ── QUÉ ARREGLA, MEDIDO
  // T1 presupuestaba con peso 1 (`pesoDe = () => 1`): una casilla, una unidad. Mientras toda
  // cuota se contó en TOMAS eso era exacto. Desde que el huevo se cuenta en PIEZAS (§10.3 nivel 1
  // y §20.20) dejó de serlo: una casilla de tortilla NO cuesta una, cuesta las dos piezas que el
  // plato lleva dentro, y no lo mismo a un adulto (120 g = 2) que a un niño (60 g = 1). Medido el
  // 4-ago sobre la parrilla (12 familias × 4 semanas consecutivas): T1 reservaba 3 y hasta 4
  // casillas de huevo creyendo que cabían bajo el techo de 4, y el resultado eran **6, 7 y 8
  // huevos** por adulto y semana. **38 de las 48 semanas** cedían el techo. No en silencio —T2
  // lo servía con descargo `techo-vs-reserva`, 429 de ellos— pero ceder un techo cuatro semanas
  // de cada cinco no es ceder: es no tenerlo.
  //
  // ── LA UNIDAD SALE DEL BANCO, JAMÁS DEL MOTOR (§13.8, literal)
  // El peso se calcula con `cuotaDeServicio`, la MISMA función que cuenta la cuota en T2 y en T4:
  // una definición, tres recorridos (§13.11). Aquí el recorrido es «los candidatos del pool»; en
  // T2 «el plato propuesto» y en T4 «lo servido». Escribir un 2 en el motor habría sido cablear
  // un dato del banco, que es el bug que este proyecto ya pagó con `MINIMOS_CUENTAN`.
  //
  // ── POR QUÉ DOS PESOS Y NO UNO
  // Un solo peso no puede ser conservador en las dos direcciones. Contra un TECHO, subestimar
  // deja pasar; contra un MÍNIMO, sobreestimar da por cubierto lo que no lo está. Así que hay dos
  // y T1 lleva dos conteos:
  //   · `max` — lo MÁS que una casilla del cubo puede costarle. Es peor caso porque en las
  //     protagonistas T3 puede subir la ración hasta `PIEZAS_PROTAGONISTA_RANGO[1]` (por eso se
  //     pide `peorCaso`, exactamente como hace T2 al prever). Gobierna los techos.
  //   · `min` — lo MENOS que una casilla puede aportarle, con la ración de la receta. Gobierna
  //     los mínimos.
  // En todo cubo NO contable las dos valen 1 y T1 se comporta EXACTAMENTE como antes: la
  // asimetría solo muerde donde la fuente publica piezas, que hoy es el huevo y solo él (§20.20).
  const pesoCubo = { min: {}, max: {} };
  // ⚑ LO QUE UNA CASILLA CONSUME DE CUBOS AJENOS: MEDIDO, NO IMPLEMENTADO (§10.5, 4-ago-2026).
  // Sobre la parrilla, **0,75 tomas de `carne-total` por miembro y semana NO salen de una casilla
  // de carne**: son el chorizo del potaje, el jamón de la pizza, el bacon del salteado. Con techo
  // infantil de 3 tomas es un cuarto del techo, y a T1 le es invisible porque reserva CATEGORÍAS
  // y esto depende del PLATO. Se intentó darle aquí un peso por (categoría × cubo ajeno) y se
  // descartó con la medida delante: la MEDIANA sale 0 en todas las categorías —la mayoría de
  // potajes no llevan chorizo, el efecto lo produce una minoría de platos—, y subir el percentil
  // devuelve a T1 a presupuestar en fracciones, que el 2-ago ya demostró infactible (5 de 9
  // familias sin reparto legal). El sitio correcto no es un presupuesto de T1: es que T2 prefiera,
  // dentro de la categoría reservada, los candidatos que no gastan cubos ajenos cuando el techo
  // aprieta — o sea una señal de coste, que es materia del bloque 13. Queda como fila abierta de
  // `CONFORMIDAD.md` con su número, no como código que aparenta cubrirlo.
  const planasConEscala = (id, esNino) => {
    const out = [];
    const rec = (padre, escala, visto) => {
      if (visto.has(padre)) return;
      visto.add(padre);
      for (const l of lineasDe[padre] || []) {
        if (l.componente_id) { rec(l.componente_id, escala * ((esNino ? l.escala_nino : l.escala_adulto) || 1), visto); continue; }
        out.push({ ...l, escala });
      }
    };
    rec(id, 1, new Set());
    return out;
  };
  for (const c of pools.candidatos) {
    for (const mid of mids) {
      if (edades[mid] == null || edades[mid] < EDAD_MINIMA_PRODUCTO) continue;
      const esNino = edades[mid] < config.EDAD_RACION_ADULTO;
      const lineas = [];
      for (const l of planasConEscala(c.elaboracion_id, esNino)) {
        const aid = Array.isArray(l.alternativas) ? c.opcion : l.alimento_id;
        if (!aid || !cat[aid]) continue;
        lineas.push({ alimento: aid, elaboracion_id: c.elaboracion_id,
          gramos: ((esNino ? l.gramos_nino : l.gramos_adulto) || 0) * (l.escala || 1) });
      }
      if (!lineas.length) continue;
      const m = { edad: edades[mid] };
      const alto = cuotaDeServicio(lineas, m, datos, config, { peorCaso: true }).tomas;
      const bajo = cuotaDeServicio(lineas, m, datos, config).tomas;
      for (const cubo of Object.keys(config.CUOTAS)) {
        if (!cubosDe(c.categoria).includes(cubo)) continue;
        if (alto[cubo] > 0) {
          (pesoCubo.max[cubo] = pesoCubo.max[cubo] || {})[mid] =
            Math.max(pesoCubo.max[cubo][mid] || 0, alto[cubo]);
        }
        if (bajo[cubo] > 0) {
          (pesoCubo.min[cubo] = pesoCubo.min[cubo] || {})[mid] =
            Math.min(pesoCubo.min[cubo][mid] == null ? Infinity : pesoCubo.min[cubo][mid], bajo[cubo]);
        }
      }
    }
  }
  const pesoMaxDe = (mid, cubo) => ((pesoCubo.max[cubo] || {})[mid]) || 1;
  const pesoMinDe = (mid, cubo) => ((pesoCubo.min[cubo] || {})[mid]) || 1;

  // ── EL MÍNIMO QUE LAS CASILLAS NO PUEDEN CUBRIR (§13.9 y §10.11, literales)
  //
  // «Una casilla no es la única vía de una unidad. La tercera pieza de huevo del niño no sale de
  // una tercera tortilla: sale del cierre del plato, como complemento. T1 no reserva el cierre,
  // así que el mínimo que no puede cubrir con casillas lo acota, lo declara, y lo persigue T2.»
  //
  // El conflicto es de MESA, no de persona, y §10.11 lo dice con nombre y apellido: «el mínimo
  // del niño no se cubre con tres tortillas, porque esas mismas tres darían seis al adulto». La
  // cuenta es esa misma: cuántas casillas del cubo tolera el comensal MÁS apretado de la mesa, y
  // cuánto le aporta ese número de casillas a cada uno. Lo que falte no es un incumplimiento ni
  // un silencio: es una cuota que se cierra por otra vía y se dice cuánta.
  //
  // Sin esta acotación T1 no encontraría reparto legal y la semana moriría por un huevo duro.
  for (const cubo of Object.keys(config.CUOTAS)) {
    const conBanda = familia.miembros.map(m => m.id).filter(mid => bandasEfectivas[mid]
      && bandasEfectivas[mid][cubo] && !bandasEfectivas[mid][cubo].fuera_de_alcance
      && puedeCubo[mid][cubo]);
    if (!conBanda.length) continue;
    let casillasMax = Infinity;
    for (const mid of conBanda) {
      const max = bandasEfectivas[mid][cubo].max;
      if (!(max < Infinity)) continue;
      casillasMax = Math.min(casillasMax, Math.floor(max / pesoMaxDe(mid, cubo) + 1e-9));
    }
    if (!(casillasMax < Infinity)) continue;
    for (const mid of conBanda) {
      const banda = bandasEfectivas[mid][cubo];
      if (!(banda.min > 0)) continue;
      const porCasillas = casillasMax * pesoMinDe(mid, cubo);
      if (porCasillas >= banda.min - 1e-9) continue;
      const deficit = banda.min - porCasillas;
      banda.min = porCasillas;
      banda.min_por_complemento = +deficit.toFixed(3);
      descargos.push({ tipo: 'minimo-por-complemento', miembro: mid, cubo,
        minimo: +(porCasillas + deficit).toFixed(3), alcanzable: +porCasillas.toFixed(3),
        detalle: `${mid}: la mesa solo tolera ${casillasMax} casilla(s) de ${cubo} —el techo del `
          + `comensal más apretado manda— y esas ${casillasMax} le dan ${porCasillas}. `
          + `Las ${deficit.toFixed(1)} unidad(es) que faltan se cierran con el complemento del `
          + `plato, no con otra casilla (§13.9)` });
    }
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
    puedeCubo, bandasEfectivas, aporteCubo, pesoCubo, profundidadClave, profundidadLigera,
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
  // `cubo` (5.4, 4-ago): QUÉ grupo de alimentos cedió. Es dato del hecho declarado, no estado del
  // solver — sin él, un techo superado se sabía pero no se podía carear contra el recuento de T4,
  // y «cero relajaciones silenciosas» no llegaba a cubrir las cuotas. Opcional: solo lo llevan
  // los descargos de techo y de mínimo.
  descargo: ['tipo', 'miembro', 'cubo', 'detalle'],
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
  // 5.4 · era `techo-fraccional-vs-reserva` y su frase decía «hemos ajustado las cantidades»,
  // que describía la vara vieja (fracciones de ración) y no lo que pasa: lo que se pasa es la
  // FRECUENCIA de un grupo, y las cantidades no tienen nada que ver.
  'techo-vs-reserva': 'Esta semana un grupo de alimentos se repite más veces de lo recomendado.',
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
// CUPO de `elaborado`: entre `ELABORADO_POR_SEMANA_MIN` y `ELABORADO_POR_SEMANA_MAX` a la semana,
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
  const min = config.ELABORADO_POR_SEMANA_MIN || 0;
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
  //
  // ⚑ 4-ago-2026 (§13.8) · DOS CONTEOS, PORQUE HAY DOS PESOS. `conteoAlto` acumula lo MÁS que
  // una casilla puede costarle a cada comensal y gobierna los TECHOS; `conteoBajo` acumula lo
  // MENOS que puede aportarle y gobierna los MÍNIMOS. Con un solo conteo no se puede ser
  // conservador en las dos direcciones a la vez: contra un techo, subestimar deja pasar; contra
  // un mínimo, sobreestimar da por cubierto lo que no lo está. En todo cubo NO contable los dos
  // pesos valen 1 y los dos conteos van clavados, así que esto solo se separa donde la fuente
  // publica piezas — hoy el huevo, y solo él (§20.20).
  const conteoAlto = {}, conteoBajo = {};                 // miembro → cubo → unidades de frecuencia
  for (const mid of Object.keys(bandas)) {
    conteoAlto[mid] = {}; conteoBajo[mid] = {};
    for (const c of Object.keys(bandas[mid].cubos)) { conteoAlto[mid][c] = 0; conteoBajo[mid][c] = 0; }
  }
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
  // ── EL PESO DE UNA CASILLA (§13.8, cerrado el 4-ago-2026 · antes: `pesoDe = () => 1`)
  //
  // «T1 reserva en la unidad de la frecuencia, no en casillas. El peso de una casilla es el
  // número de piezas que sus candidatos sirven a ese comensal según su tramo, y ese peso se lee
  // del banco, jamás se escribe en el motor.» El peso lo calcula el PREVUELO con
  // `cuotaDeServicio` —la misma función que cuenta la cuota en T2 y en T4, §13.11— y aquí solo
  // se consume. Sin prevuelo: peso 1, comportamiento histórico intacto.
  //
  // ── QUÉ SE INTENTÓ ANTES Y POR QUÉ ESTO NO ES AQUELLO
  // El 2-ago se probó presupuestar en RACIONES FRACCIONALES (legumbre 0,87 · huevo 2,07 por
  // servicio) y salió infactible por construcción: 5 de 9 familias sin reparto legal y 20-28 s de
  // DFS. La diferencia no es de calibración, es de unidad. Una ración fraccional no es la unidad
  // de ninguna cuota: `config.CUOTAS` está escrita en TOMAS y en PIEZAS (§10.3), que es lo que T2
  // y T4 cuentan desde la fila 5.4. Al presupuestar en la unidad REAL, todo cubo no contable pesa
  // exactamente 1 —igual que antes— y solo el huevo se separa. Medido: la parrilla sigue cerrando
  // y el techo de huevo deja de romperse.
  const pesoDe = (mid, cubo) => (pre && pre.pesoCubo && (pre.pesoCubo.max[cubo] || {})[mid]) || 1;
  const pesoMin = (mid, cubo) => (pre && pre.pesoCubo && (pre.pesoCubo.min[cubo] || {})[mid]) || 1;
  // cota OPTIMISTA para «¿aún se puede alcanzar el mínimo?»: lo más que un slot puede aportar.
  // Una poda que subestima la capacidad mata ramas viables, y eso sí sería un bug.
  const pesoMax = (mid, cubo) => pesoDe(mid, cubo);
  const asignacion = new Array(dominios.length).fill(null);
  let nodos = 0, motivoPoda = null, agotado = false;
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
        const f = banda.cubos[cubo].min - conteoBajo[mid][cubo];
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
          if (banda.cubos[cubo] && puede(mid, cubo) && conteoBajo[mid][cubo] < banda.cubos[cubo].min - 1e-9) ayuda++;
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
        const f = bandas[mid].cubos[cubo].min - conteoBajo[mid][cubo];
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
    // backstop del DFS de T1. ⚑ 4-ago-2026 (§20.0): estaba escrito `2e6` a mano, y §20.0 dice que
    // ninguna vara numérica vive suelta en el código. Es un presupuesto distinto del de T2
    // (`BACKTRACK_MAX_NODOS`, §20.36) y por eso tiene su propia constante: T1 resuelve un problema
    // pequeño de forma EXACTA y esto solo existe para que una patología no cuelgue la app.
    //
    // ⚑ Y NO ESTÁ HOLGADO, medido sobre la parrilla el 4-ago: la mediana son **21 nodos** pero el
    // MÁXIMO son **965.599** contra un backstop de 2.000.000 — margen ×2, no los órdenes de
    // magnitud que el comentario anterior daba por supuestos («jamás alcanzado» era cierto y
    // «holgado» no). Importa porque cuando este backstop muerde, T1 deja de ser exacto y §13.6
    // deja de cumplirse en silencio: la rama de abajo devolvería «no existe reparto legal», que
    // es una afirmación FALSA — lo cierto sería «me he rendido». Por eso el agotamiento se
    // distingue y se nombra: una cota de tiempo puede acabar una búsqueda, pero no puede
    // disfrazarse de imposibilidad (§13.2).
    if (++nodos > (config.T1_MAX_NODOS || 2e6)) { agotado = true; return false; }
    if (idx === dominios.length) {
      for (const [mid, banda] of Object.entries(bandas))
        for (const [cubo, { min }] of Object.entries(banda.cubos))
          if (conteoBajo[mid][cubo] < min - 1e-9) { motivoPoda = `${mid} cierra por debajo del mínimo de ${cubo}`; return false; }
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
          && conteoAlto[mid][cubo] + pesoDe(mid, cubo) > banda.cubos[cubo].max + 1e-9) { excede = true; break; }
        if (excede) break;
      }
      if (excede) { motivoPoda = motivoPoda || `techo alcanzado en ${opcion.categoria}`; continue; }
      if (opcion.esfuerzo === 'elaborado' && elaborados + 1 > cupoMax) continue;
      // aplicar
      const excesoFrito = esExceso(claveProf);
      for (const mid of presentes) for (const cubo of cubos) if (conteoAlto[mid][cubo] != null && puede(mid, cubo)) {
        conteoAlto[mid][cubo] += pesoDe(mid, cubo); conteoBajo[mid][cubo] += pesoMin(mid, cubo);
      }
      if (opcion.esfuerzo === 'elaborado') elaborados++;
      usosClave[claveProf] = (usosClave[claveProf] || 0) + 1;
      if (excesoFrito) fritosT1++;
      asignacion[idx] = opcion;
      if (dfs(idx + 1)) return true;
      asignacion[idx] = null;
      if (excesoFrito) fritosT1--;
      usosClave[claveProf]--;
      if (opcion.esfuerzo === 'elaborado') elaborados--;
      for (const mid of presentes) for (const cubo of cubos) if (conteoAlto[mid][cubo] != null && puede(mid, cubo)) {
        conteoAlto[mid][cubo] -= pesoDe(mid, cubo); conteoBajo[mid][cubo] -= pesoMin(mid, cubo);
      }
    }
    return false;
  }

  // AGOTARSE NO ES SER IMPOSIBLE (§13.2). Si el backstop mordió, la búsqueda dejó de ser
  // exhaustiva y decir «no existe reparto legal» sería afirmar más de lo que se ha comprobado —
  // el mismo pecado que la regla dura de este proyecto prohíbe. Se dice lo que pasó.
  if (!dfs(0)) return agotado
    ? fallo('búsqueda agotada antes de decidir si existe reparto legal',
      `el DFS de T1 llegó al backstop de ${config.T1_MAX_NODOS || 2e6} nodos sin recorrer el espacio entero: `
      + 'NO se ha demostrado que la semana sea imposible, solo que no se encontró a tiempo', { nodos, agotado: true })
    : fallo('no existe reparto legal para la semana',
      motivoPoda || 'ninguna combinación satisface a la vez bandas, alternancia y pools', { nodos });

  return {
    ok: true,
    semana_iso, estacion, nodos,
    slots: dominios.map((d, i) => ({
      slot: d.slot, dia: d.dia, servicio: d.servicio,
      categoria: asignacion[i].categoria, esfuerzo: asignacion[i].esfuerzo,
      ancla: anclas[d.slot] ? anclas[d.slot].elaboracion_id : null
    })),
    reserva: conteoAlto,                                 // lo que T2 tiene que respetar (techos)
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
//  · procesada del niño: CERRADO el 4-ago-2026 (§20.39). Era un techo semanal aproximado
//    (el mensual /4 = media ración, que no existe) y ahora es la ventana mensual real de 30 días
//    arrancada del diario D3 — `CUOTAS_MENSUALES` en config, contador `st.tomasMes`;
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
const { cuotaDeServicio } = require('./cuotas.js');
const { reglasDeVentana, techoVentana } = require('./ventana_movil.js');
const { cubreEje, EJE_CATEGORIAS } = require('./ejes.js');
const ejeDeCategoria = {};
for (const [eje, cats] of Object.entries(EJE_CATEGORIAS)) for (const c of cats) ejeDeCategoria[c] = eje;

const DIA_MS = 86400000;
const ORDEN_CAL = [];
for (let d = 1; d <= 7; d++) for (const s of ['comida', 'cena']) ORDEN_CAL.push(`${d}-${s}`);

// `fijados` y `evitar` (spec §15.3, superficie): lo que permite RE-RESOLVER UN SOLO SLOT sin
// duplicar el relleno. `fijados` = { slot → servicio ya servido }: se precarga en el estado vivo
// con el MISMO `aplicar()` que un slot recién decidido —así variedad, techos y ventanas cuentan
// contra el resto de la semana— y queda FUERA del bucle de decisión, verbatim en la salida.
// `evitar` = { principales:Set, piezas:Set }: lo que el usuario acaba de rechazar. Sin estos dos
// parámetros el comportamiento es EXACTAMENTE el de siempre (generación de semana entera).
function rellenarSemana({ entrada, esq, pre, pools, datos, config, memoria, menuCole, fijados, evitar, ventanaPrevia, tomasPreviasCubo }) {
  const { semana_iso, familia, presencia, edades, estacion } = entrada;
  const semanaNum = Number(semana_iso.split('-W')[1]);
  // los cuatro costes blandos que no son términos de `costeS` (§20.0: ninguna vara suelta en el
  // código). El respaldo son los MISMOS valores que estaban cableados aquí, para que un config
  // viejo —el del frontend antes de re-empaquetar, o el de una suite que fabrica su config— siga
  // dando exactamente el mismo menú en vez de fallar en silencio con ceros.
  const EXTRA = Object.assign({ comer_aparte: 128, comer_aparte_secundaria: 32,
    novedad_sobre_cupo: 512, techo_cedido: 4096, bigrama_repetido: 64 }, config.PESOS_S_EXTRA || {});
  const ix = indexar(datos);
  const mem = memoria || { mesa: { M1: {}, M2: {}, M3: null, M4: {}, M5: {}, M6: {}, M7: {}, M8: {} }, personas: {} };

  // ── estado vivo de la semana (muere al emitir: jamás se serializa — contrato anti-fuga)
  const st = {
    porSlot: {},                                    // slot → servicio construido
    // ⚑ 5.4 · LA MONEDA DE CADA CONTADOR, y son DOS, inconvertibles (spec §4):
    tomas: {},                                      // mid → cubo → nº de TOMAS (entero) ← config.CUOTAS
    // ⚑ §13.9.1 · EL LIBRO DE LA DEUDA. mid → cubo → TOMAS de complemento ya COBRADAS. La deuda
    // la acuña el prevuelo con su cuantía exacta (`min_por_complemento` = el mínimo menos lo
    // reservable en casillas) y T2 la cobra UNA sola vez, en el primer slot donde quepa. Esto es
    // lo que impide el doble cobro; antes lo impedía ESPERAR al último slot, y esa espera dejaba
    // el mínimo corto cuando el último slot no admitía complemento. Va en `st` a propósito: el
    // backtracking clona `st`, así que deshacer un servicio deshace también su cobro.
    deuda: {},
    saludG: {},                                     // mid → categoría → GRAMOS ← TECHOS_SALUD_G_SEMANA
    fritos: 0, dulces: 0, lacteos: 0,
    novedades: {},                                  // mid → n novedades servidas (menores)
    // ⚑ §20.39 · mid → cubo → TOMAS dentro de la VENTANA MENSUAL (30 días), no de la semana.
    // Cuarta moneda y tampoco convertible: es un techo que la fuente publica por mes
    // (`CUOTAS_MENSUALES`), y una banda de semana no puede expresarlo — repartirlo entre 4 daba
    // media ración, que no existe. Arranca con lo que el diario ya trae servido: sin eso el
    // contador se reiniciaría cada lunes y un techo mensual medido por semanas no es un techo.
    tomasMes: JSON.parse(JSON.stringify(tomasPreviasCubo || {})),
    // ⚑ 5.5 · mid → alimento → GRAMOS dentro de la ventana móvil de 30 días. Tercera moneda y
    // tampoco convertible: no es una toma (frecuencia) ni un gramo de techo SEMANAL, es un techo
    // de MES de `seguridad_infantil`. Arranca con lo que el diario ya trae servido — sin eso el
    // contador se reiniciaría cada lunes y un techo mensual medido por semanas no es un techo.
    ventanaG: JSON.parse(JSON.stringify(ventanaPrevia || {})),
    percibidos: {},                                 // percibido principal → [dia…] (TODOS)
    elabServida: {},                                // elaboracion_id → [idxCal…] (TODOS)
    secPercibidos: {},                              // percibido secundaria/postre → [idxCal…] (TODOS)
    bigramas: {},                                   // principal+sec → n
    origenDeSlot: {},                               // slot calendario → origen dominante
    alimentosSemana: new Set(),
    costeBandaAcum: [], idxServicio: 0
  };
  for (const m of familia.miembros) { st.tomas[m.id] = {}; st.saludG[m.id] = {}; }

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

  // ⚑ 4-ago · FILA 5.4 — LA UNIDAD DE LA CUOTA. Esto devolvía `{minimos, techos}` en RACIONES
  // FRACCIONALES y el motor las comparaba contra las bandas de `config.CUOTAS`, que están
  // escritas en TOMAS («legumbre 2-4/semana» = comer legumbre 2-4 VECES, spec §4). Dos monedas,
  // un solo número. Medido sobre la parrilla antes de tocarlo: **64,4% de los servicios-miembro
  // con al menos un cubo donde la fracción no es la toma que aporta, y 25,4% de los veredictos
  // de banda dando resultados DISTINTOS con una vara y con la otra** (a1 huevo: 6,5 «raciones»
  // ⇒ techo PASADO, cuando las tomas reales son 3 contra un techo de 4).
  //
  // Ahora `aportes` devuelve LAS LÍNEAS RESUELTAS del candidato para ese comensal, y quien las
  // junta decide la cuota con `cuotas.js` — la misma definición que usa T4. El recorrido sigue
  // siendo propio de cada uno (T2 la PLANTILLA, T4 lo SERVIDO): eso es lo que §1-T4 protege.
  //
  // MUERE también la asimetría dominante-para-mínimos / todo-para-techos que vivía aquí. No es
  // una pérdida: el umbral `TOMA_MIN_FRACCION` hace ya ese trabajo mejor (los 10 g de limón no
  // llegan a media ración y no cuentan solos), y sobre todo **T4 y la batería A nunca la
  // tuvieron** — mantenerla en T2 era garantizar que generador y juez contaran distinto, que es
  // literalmente el defecto que 5.4 cierra. El condimento sigue SIN cerrar ejes (`cubreEje` lo
  // excluye): esa es la puerta de la hamburguesa sola y sigue cerrada.
  //
  // POR MIEMBRO: sus gramos de línea (niño/adulto). <3 años no tiene ración publicada ⇒ no
  // computa cuotas (hueco declarado por el prevuelo; jamás se extrapola).
  const cacheAporte = {};
  function aportes(c, mid) {
    const k = `${c.elaboracion_id}|${c.opcion}|${mid}`;
    if (cacheAporte[k]) return cacheAporte[k];
    const esNino = edades[mid] < config.EDAD_RACION_ADULTO;
    const lineas = [];
    for (const l of lineasPlanas(ix, c.elaboracion_id)) {
      const alimentoId = Array.isArray(l.alternativas) ? c.opcion : l.alimento_id;
      if (!ix.cat[alimentoId]) continue;
      lineas.push({ alimento: alimentoId, elaboracion_id: c.elaboracion_id,
        gramos: (esNino ? l.gramos_nino : l.gramos_adulto) * (l.escala || 1) });
    }
    return cacheAporte[k] = lineas;
  }

  // la cuota de un SERVICIO para un comensal: se juntan TODAS sus líneas y se decide una vez.
  // El umbral es del plato que se come, no de cada trozo (0,3 raciones en el principal + 0,3 en
  // la guarnición son UNA toma, no dos medias ni ninguna) — por eso nunca se llama por pieza.
  const cuotaDe = (lineas, mid) => cuotaDeServicio(lineas, { edad: edades[mid] }, datos, config, { peorCaso: true });
  const reglasVentana = reglasDeVentana(datos);
  // el peso de una casilla en la unidad de la frecuencia (§13.8), calculado por el prevuelo con
  // esta misma `cuotaDeServicio`. Aquí solo se lee: es la MISMA definición que usa T1 al
  // reservar, y por eso las proyecciones de T2 hablan su idioma. Sin prevuelo: 1, como siempre.
  const pesoMaxDe = (mid, cubo) => ((pre.pesoCubo && pre.pesoCubo.max[cubo] || {})[mid]) || 1;

  // ⚑ 5.4 (sesión 6, 4-ago) — EL POSTRE ES COMIDA Y CUENTA. Los contadores de este fichero
  // recorrían `sv.plato` y **el postre no entraba en ninguno**: ni en tomas ni en gramos de
  // salud. T3 y T4 sí lo recorren (`piezasDe`, `composicion`), así que las dos varas medían
  // composiciones distintas y de ahí salían los 6 casos rojos que la sesión 5 dejó sin
  // diagnosticar (T2 preveía 6 piezas de huevo y T4 contaba 7, todos en W05 y en adultos).
  // El hueco es del banco entero, no del huevo: cuatro postres llevan un cubo de cuota dentro
  // —`flan-huevo` 60 g, `crema-catalana` 40 g, `natillas` 34 g, `torrijas` 30 g— y contra la
  // ración adulta de 60 g cada uno es UNA pieza que T2 no veía. En niños la ración de su tramo
  // es menor y el redondeo cae del otro lado, que es por qué los 6 casos eran todos de adulto.
  // Roger ya lo había dictado el 4-ago sobre el flan: «cuenta 100%… para tu cuerpo un huevo es
  // un huevo». La composición se resuelve igual que en T4 (`composicion`): el sustituto de
  // postre manda sobre el postre de mesa.
  const postreDe = (sv, mid, sustPostre) => {
    const p = sustPostre[mid] ? sustPostre[mid].postre : sv.postre;
    return p ? [p] : [];
  };

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

  // ── EL ESTADO DE LA CUOTA DE UN COMENSAL ANTE UNA CATEGORÍA (§13.4 blandas · §20.32, 4-ago-2026)
  //
  // Una banda tiene DOS extremos y hasta hoy el motor solo miraba uno. `avance` —cuántos mínimos
  // pendientes toca esta categoría— existía en los dos sitios donde T2 elige (la opción de cada
  // comensal en `resolverEje` y el coste S del candidato en `señales`); su espejo, `gasto`, no
  // existía en ninguno. La consecuencia está medida sobre la parrilla (12 familias × 4 semanas):
  // de las 214 tomas de `carne-total` de los 50 veredictos que se pasan del techo, **78 (36%) no
  // salen de la casilla que T1 reservó, sino de la OPCIÓN que recibe el comensal** — 38 de
  // `risotto|pollo` en slots reservados `sin-cuota`, o sea una casilla que T1 presupuestó como
  // «no consume techo» y que acaba sirviendo carne. Con `avance` empatado a 0 —el caso normal—
  // decidía la rotación, a ciegas: entre dos opciones legales, la que gastaba techo y la que no
  // valían lo mismo.
  //
  // `gasto` = cuántos cubos DESBORDA esta categoría para este comensal: los que quedarían por
  // encima de su techo al servirle esto. Es el espejo exacto de `avance`, con su misma
  // aproximación barata —cuenta CUBOS, no tomas— para que las dos señales sean comparables.
  //
  // ⚑ POR QUÉ EL BORDE ESTÁ EN «DESBORDA» Y NO EN «GASTA», con las dos alternativas medidas sobre
  // la parrilla antes de elegir:
  //  · «gasta un techo cuyo mínimo ya está cubierto» (ancho): se enciende desde la primera toma en
  //    todo cubo que solo tiene techo —`carne-total` de un menor es [—,3], sin mínimo— y entonces
  //    no ordena, empuja: `carne-total` 50→42 pero `legumbre` 0→6. Mueve el consumo, no lo reduce.
  //  · «esta toma es la última que cabe» (estrecho): no mueve nada (50→50), porque en ese punto la
  //    toma todavía es legal y no hay nada que prevenir.
  //  · «desborda» (el elegido): coincide EXACTAMENTE con lo que `contratos` va a vetar, y ahí está
  //    el problema real — `resolverEje` elige la opción de cada comensal UNA vez y a ciegas, y si
  //    la elegida rompe el techo, `contratos` tumba el CANDIDATO ENTERO aunque otra opción legal
  //    del mismo plato cupiese. Medido: 78 de las 214 tomas de `carne-total` de los veredictos que
  //    se pasan entran por la opción del comensal y no por la casilla de T1 — 38 de ellas de
  //    `risotto|pollo` en slots que T1 reservó `sin-cuota`, o sea presupuestados como «no consume
  //    techo». La señal no relaja el techo: evita elegir la opción que lo rompe pudiendo no hacerlo.
  //
  // ⚑ ES BLANDA, NO CONTRATO: ordena entre candidatos LEGALES y jamás veta. El techo lo sigue
  // vetando `contratos` en su moneda (§13.4), y quien no encuentra alternativa sigue cediendo CON
  // descargo. Esto solo evita gastar el techo cuando había otra opción igual de buena.
  function estadoDeCuota(categoria, mid) {
    const cubos = categoria ? cubosDe(categoria).filter(x => config.CUOTAS[x]) : [];
    let avance = 0, gasto = 0;
    for (const cubo of cubos) {
      const v = aporta(mid, cubo, 1);
      avance += v.avance; gasto += v.gasto;
    }
    return { avance, gasto };
  }
  // el veredicto de UN cubo para UN comensal ante `t` tomas nuevas. Definición única de los dos
  // extremos de la banda: la consumen `resolverEje` (por categoría nominal) y `señales` (por lo
  // que el candidato aporta de verdad). Dos recorridos, una definición — §13.11.
  //
  // ⚑ EL TECHO SE MIRA PROYECTADO, con la misma cuenta que `contratos`: lo que hay + lo que esto
  // aporta + UNA toma por cada slot PENDIENTE cuya categoría reservada alimenta el cubo. Sin la
  // proyección la señal no ve nada y no mueve nada (medido: 50→50 veredictos cedidos), porque en
  // el momento de elegir la opción el techo todavía no se ha roto — lo que se rompe es la reserva
  // que viene después. La proyección es exactamente lo que `contratos` va a vetar, así que esto no
  // adivina: anticipa el mismo veredicto para poder elegir OTRA opción antes de provocarlo.
  function aporta(mid, cubo, t) {
    const banda = (pre.bandasEfectivas[mid] || {})[cubo];
    if (!banda) return { avance: 0, gasto: 0 };
    const tiene = st.tomas[mid][cubo] || 0;
    if (banda.max < Infinity) {
      let pendienteMin = 0;
      for (const p of pendientes) if (presencia[mid][p.slot] && cubosDe(p.categoria).includes(cubo)) pendienteMin++;
      if (tiene + t + pendienteMin > banda.max + 1e-9) return { avance: 0, gasto: 1 };
    }
    if (tiene < banda.min - 1e-9) return { avance: 1, gasto: 0 };
    return { avance: 0, gasto: 0 };
  }

  // ── resolver el EJE comensal a comensal para un candidato (el foso)
  function resolverEje(c, presentes, relaj, s) {
    if (!ix.tieneEje[c.elaboracion_id]) return { opciones: null, divergencias: [] };
    const porMiembro = {}, divergencias = [];
    // §15.4 (`reescalarServicio`): quien YA estaba sentado conserva su opción mientras le siga
    // siendo legal — que vuelva papá no puede cambiarle el plato a nadie más. Solo se resuelve
    // de nuevo al que llega. Sin `opciones_previas` (el caso normal) esto no existe.
    const previas = (s && s.opciones_previas) || null;
    // ── LA OPCIÓN DEL OMNÍVORO RESPETA LO QUE T1 RESERVÓ. Son dos casos y hasta el 4-ago-2026
    // solo estaba implementado uno:
    //  · el cubo del candidato viene del EJE (pizza×atún) → la opción se ata a la CATEGORÍA EXACTA
    //    reservada. «Algún cubo con banda» dejaba colar salmón (azul) en un slot de blanco y el
    //    techo de azul reventaba (cazado en vivo, 7-comida de mesa-1).
    //  · la reserva es `sin-cuota` → la opción se ata a NO ALIMENTAR NINGÚN CUBO. `sin-cuota`
    //    significa, literalmente, que T1 presupuestó esa casilla como «no consume techo ni cumple
    //    mínimo» (`pools.js` §categoriaDe). Sin esta rama la casilla no ataba nada y el eje elegía
    //    por rotación: medido sobre la parrilla, **38 tomas de `carne-total` entraban por
    //    `risotto|pollo` en slots `sin-cuota`**, y al taparlo por coste se iban a
    //    `proteina-vegetal-plancha|tempeh`, que es legumbre — el mismo agujero por otro cubo.
    //    Es el sitio correcto y no un parche sobre el otro: lo que estaba mal era que la promesa
    //    de la reserva se cumplía para las casillas con cubo y no para las que prometían ninguno.
    //  · el cubo viene de una línea FIJA (potaje×zanahoria) → la opción es libre, porque el cubo
    //    ya está puesto y atar el eje forzaría a que la verdura fuese una legumbre.
    // En los dos primeros casos, si no queda ninguna opción que cumpla, se sirve fuera de reserva
    // y se DECLARA (H manda): la divergencia es la misma y se emite igual.
    const catCanonica = ix.cat[c.opcion] && ix.cat[c.opcion].categoria;
    const ejeProteico = catCanonica != null && catCanonica === c.categoria;
    const reservaSinCuota = c.categoria === 'sin-cuota';
    const sinCubo = op => { const f = ix.cat[op]; return !f || !cubosDe(f.categoria).some(x => config.CUOTAS[x]); };
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
      if (m.dieta === 'omnivora' && (ejeProteico || reservaSinCuota)) {
        const enReserva = reservaSinCuota ? legales.filter(sinCubo)
          : legales.filter(op => ix.cat[op] && ix.cat[op].categoria === c.categoria);
        if (enReserva.length) pool = enReserva;
        else divergencias.push({ tipo: 'divergencia-de-reserva', miembro: mid,
          detalle: reservaSinCuota
            ? `${mid} sin opción legal sin cubo de cuota en ${c.elaboracion_id}: la casilla se reservó sin-cuota y se sirve fuera de reserva (H manda)`
            : `${mid} sin opción legal de ${c.categoria} en ${c.elaboracion_id}: se sirve fuera de reserva (H manda)` });
      }
      const ultima = ((mem.personas[mid] || {}).P2 || {})[c.elaboracion_id];
      const frescas = pool.filter(op => !ultima || ultima.opcion !== op);
      const candidatas = frescas.length ? frescas : pool;
      // avance de mínimos pendientes → GASTO DE TECHO → rotación estable
      const rot = (semanaNum + st.idxServicio) % candidatas.length;
      const orden = candidatas.slice(rot).concat(candidatas.slice(0, rot));
      let mejor = orden[0], mejorAvance = -1, mejorGasto = Infinity;
      for (const op of orden) {
        const { avance, gasto } = estadoDeCuota(ix.cat[op] && ix.cat[op].categoria, mid);
        if (avance > mejorAvance || (avance === mejorAvance && gasto < mejorGasto)) {
          mejorAvance = avance; mejorGasto = gasto; mejor = op;
        }
      }
      porMiembro[mid] = mejor;
    }
    return { opciones: porMiembro, divergencias };
  }

  // ── contratos C sobre un candidato YA con opciones (ventanas con peldaños de la escalera)
  function contratos(c, opciones, presentes, s, relaj) {
    const dia = s.dia;
    const ventanaM1 = relaj.R3 ? (config.VENTANAS.plato_dias_R3 || 3) : config.VENTANAS.plato_dias;
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
      // los servicios a MENOS de `VENTANAS.M3_servicios` de distancia en el calendario, a ambos
      // lados. ⚑ 4-ago (censo): la ventana estaba cableada a mano como «el vecino» y la constante
      // de `config` no la leía nadie — un mando de calibración que no calibraba. Con el valor
      // vigente (2) el comportamiento es EXACTAMENTE el mismo que antes —distancia 1, el vecino—
      // y se verificó con la huella: cero menús movidos. Misma convención que M2 y M4, que ya
      // comparaban «distancia < ventana».
      const org = ix.origenDe[`${c.elaboracion_id}|${c.opcion}`];
      if (org) {
        const idxCal = ORDEN_CAL.indexOf(s.slot);
        const radio = Math.max(1, (config.VENTANAS.M3_servicios || 2) - 1);
        for (let dd = 1; dd <= radio; dd++) for (const vecino of [ORDEN_CAL[idxCal - dd], ORDEN_CAL[idxCal + dd]]) {
          if (vecino && st.porSlot[vecino] && st.origenDeSlot[vecino] === org)
            return `M3: origen ${org} a ${dd} servicio(s) de ${vecino}`;
        }
        if (idxCal === 0 && mem.mesa.M3 && mem.mesa.M3.origen === org && mem.mesa.M3.servicios === 0)
          return `M3: origen ${org} consecutivo con la semana anterior`;
      }
    }
    if (ix.esPesada(c.elaboracion_id) && st.fritos >= config.FRITOS_SEMANA_MAX) return 'M6: techo de fritos semanal';
    // ⚑ 5.4 · techos EN SU MONEDA por presente APTO — con PROYECCIÓN: el candidato debe dejar
    // sitio para lo que los slots reservados pendientes consumirán COMO MÍNIMO (cazado en vivo:
    // una procesada se comía el techo de carne-total y el slot de roja reservado ya no cabía).
    // Son DOS comprobaciones porque son dos monedas (§4), y ninguna sustituye a la otra:
    //   · el techo de FRECUENCIA de `config.CUOTAS`, en TOMAS;
    //   · el techo de SALUD de `TECHOS_SALUD_G_SEMANA`, en GRAMOS absolutos.
    // «Conviven con su límite de frecuencia y manda el más restrictivo de los dos» (§4).
    for (const mid of presentes) {
      if (pre.resolucion[mid][c.elaboracion_id].estado === 'excluido') continue;
      const tramo = tramoDe(mid);
      const op = opciones ? opciones[mid] : null;
      const q = cuotaDe(aportes({ ...c, opcion: op != null ? op : c.opcion }, mid), mid);
      for (const cubo of Object.keys(q.tomas)) {
        const banda = (pre.bandasEfectivas[mid] || {})[cubo];
        if (!banda) continue;
        // roja y procesada: innegociables SIEMPRE. El resto puede chocar con la reserva del
        // esqueleto y ese choque se sirve CON DESCARGO, jamás mata la semana ni pasa en silencio.
        const salud = cubo === 'carne-roja' || cubo === 'carne-procesada';
        // EL ANCLA MANDA (dictado Roger, spec §1.5): si el slot es anclado, el techo — salud
        // incluida — cede CON descargo humano, jamás se desobedece el ancla en silencio
        // lo que este candidato aporta NO es siempre 1: en categorías contables (huevo) son las
        // piezas que sirve. Sumar 1 aquí dejaba entrar una tortilla que gasta 2 creyendo que cabía.
        const aporta = q.tomas[cubo] || 0;
        if ((st.tomas[mid][cubo] || 0) + aporta > banda.max + 1e-9)
          return { motivo: `techo de ${cubo} de ${mid}`, techoDeclarable: !salud || !!s.ancla, esAncla: !!s.ancla };
        if (banda.max < Infinity) {
          // los slots pendientes que alimentan este cubo aportarán UNA TOMA cada uno: es la
          // misma unidad en que T1 los reservó, y por fin la misma en que T2 los cuenta.
          let pendienteMin = 0;
          for (const p of pendientes) {
            if (p.slot === s.slot || !presencia[mid][p.slot]) continue;
            if (cubosDe(p.categoria).includes(cubo)) pendienteMin++;
          }
          if ((st.tomas[mid][cubo] || 0) + aporta + pendienteMin > banda.max + 1e-9)
            return { motivo: `techo proyectado de ${cubo} de ${mid}`, techoDeclarable: !salud };
        }
      }
      // TECHOS DE SALUD EN GRAMOS: absolutos y poblacionales, no escalan con la persona porque
      // el riesgo tampoco (§4). Cuentan TODO gramo, sin umbral de toma. Innegociables salvo ancla.
      for (const [cat, g] of Object.entries(q.gramosSalud)) {
        const techo = config.TECHOS_SALUD_G_SEMANA[cat];
        if (techo == null) continue;
        if ((st.saludG[mid][cat] || 0) + g > techo + 1e-6)
          return { motivo: `techo de salud de ${cat} de ${mid} (gramos/semana)`,
            techoDeclarable: !!s.ancla, esAncla: !!s.ancla };
      }
      // ⚑ 5.5 · TECHOS DE VENTANA MÓVIL (D2 con `limite_g_dia`). El atún del tramo 10-14 son
      // 120 g al MES, no 4 g al día: el `4` del banco es el mes partido por 30 y su nota lo dice.
      // Innegociable como los demás techos de seguridad — el ancla tampoco lo vence, porque no
      // es un contrato de menú sino una prohibición sanitaria por edad (misma familia que las
      // prohibiciones puras de D2, que ya son H y filtran antes de llegar aquí).
      for (const l of aportes({ ...c, opcion: op != null ? op : c.opcion }, mid)) {
        const techo = techoVentana(reglasVentana, l.alimento, edades[mid]);
        if (techo == null) continue;
        if (((st.ventanaG[mid] || {})[l.alimento] || 0) + (l.gramos || 0) > techo + 1e-6)
          return { motivo: `${l.alimento} de ${mid}: techo de ventana de D2 `
            + `(${Math.round(((st.ventanaG[mid] || {})[l.alimento] || 0) + (l.gramos || 0))} g > ${techo} g)` };
      }
      // ⚑ §20.39 · TECHOS DE VENTANA MENSUAL, en su periodo y en tomas. Antes era el techo del
      // mes dividido entre 4 —media ración de procesada, que no existe— y por eso se rompía en
      // 19 de 164 veredictos de la parrilla haciendo lo correcto. Ahora el contador es el de 30
      // días reales, arrancado del diario, y lo que veta es el techo que la fuente publica.
      for (const [cubo, porTramo] of Object.entries(config.CUOTAS_MENSUALES || {})) {
        const techoMes = porTramo[tramo];
        if (techoMes == null || !q.tomas[cubo]) continue;
        if (((st.tomasMes[mid] || {})[cubo] || 0) + q.tomas[cubo] > techoMes + 1e-9)
          return { motivo: `techo mensual de ${cubo} de ${mid} (${config.VENTANA_MENSUAL_DIAS} d)`,
            techoDeclarable: !!s.ancla, esAncla: !!s.ancla };   // solo el ancla lo vence, declarado
      }
      // MÍNIMOS PROYECTADOS por miembro (cazado por G: la pizza dio jamón al niño y su
      // pescado-azul murió sin declarar): servir este candidato debe dejar los mínimos
      // pendientes de CADA presente aún alcanzables con los slots que quedan. En TOMAS — la
      // misma unidad que la banda y que la reserva de T1.
      for (const [cubo, banda] of Object.entries(pre.bandasEfectivas[mid] || {})) {
        if (!(banda.min > 0) || !(pre.puedeCubo[mid] || {})[cubo]) continue;
        const leDa = q.tomas[cubo] || 0;
        const pendiente = Math.ceil(banda.min - (st.tomas[mid][cubo] || 0) - leDa - 1e-9);
        if (pendiente <= 0) continue;
        // ⚑ 5.4 (sesión 6): la capacidad también va en TOMAS. Contaba SLOTS —un slot, una toma—
        // y eso dejó de ser cierto con las categorías contables: un servicio de huevo puede
        // aportar hasta `PIEZAS_PROTAGONISTA_RANGO[1]` piezas. Es una cota OPTIMISTA a propósito:
        // este guard poda, y una poda que subestima la capacidad mata ramas viables (medido: con
        // capacidad en slots, `omnivora-2a2n` se quedaba sin reparto legal en W03 con «pendiente
        // 3 > capacidad 2» para el mínimo de huevo del niño, que sí cabía en 2 servicios).
        const porSlot = (config.CUOTAS_CONTABLES || []).includes(cubo)
          ? config.PIEZAS_PROTAGONISTA_RANGO[1] : 1;
        let capacidad = 0;
        for (const p of pendientes) {
          if (!presencia[mid][p.slot]) continue;
          if (cubosDe(p.categoria).includes(cubo)) capacidad += porSlot;
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
    // ⚑ 5.4 · avance EN TOMAS, no en fracciones de ración: lo que hace progresar un mínimo de
    // «legumbre 3 veces» es comer legumbre una vez más, no comer más legumbre de una vez.
    // ⚑ 13.4 (4-ago-2026) · y su ESPEJO, `gasto`: los cubos con techo finito que el candidato
    // consume a este comensal con el mínimo ya cubierto. Aquí la cuenta se hace sobre lo que el
    // candidato REALMENTE aporta a cada uno —`q.tomas`, con su opción— y no sobre una categoría
    // nominal, que es lo que distingue este recorrido del de `resolverEje`: allí se elige la
    // opción de UNA persona, aquí se puntúa el candidato para TODA la mesa.
    let avance = 0, gasto = 0;
    for (const mid of Object.keys(pre.bandasEfectivas)) {
      const op = opciones && opciones[mid] != null ? opciones[mid] : c.opcion;
      const q = cuotaDe(aportes({ ...c, opcion: op }, mid), mid);
      for (const cubo of Object.keys(q.tomas)) {
        const v = aporta(mid, cubo, q.tomas[cubo] || 1);
        avance += v.avance; gasto += v.gasto;
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
      avance_tomas: avance,
      gasto_techo: gasto,
      temporada: c.temporada === estacion ? 0 : c.temporada == null ? 0.5 : 1,
      tiempo_min: e && e.tiempo_min != null ? e.tiempo_min : null,
      finde,
      rotacion_eje: rotTot ? rotRep / rotTot : null,
      desvio_coste: Math.abs((coste_banda(ix, c.elaboracion_id) || 2) - media),
      solapamiento: solap
    };
  }

  // ── COBERTURA DEL EJE EN GRAMOS, no por etiqueta (spec §2-bis; bloqueante cazado por Roger
  // leyendo el menú, 2-ago). `ejes` decía la verdad de boquilla: la hamburguesa declaraba cubrir
  // fruta-verdura con 30 g de lechuga y 50 g de tomate, ambos CONDIMENTO, frente a una ración de
  // 175 g — y salía sola en la comida del lunes. Mismo defecto que el difunto campo `aporte`
  // (BD_ESQUEMA §1.8).
  //
  // ⚑ 3-ago (fila 4.1): el `175` que vivía escrito a mano aquí MUERE. La ración sale de
  // `ejes.js` → `raciones.js` → banco, que es la misma definición que usa el juez (T4). El
  // RECORRIDO sigue siendo el de aquí —la PLANTILLA de la elaboración, con el peor caso en las
  // líneas de eje, porque T2 mide antes de saber quién se sienta— y ese es el que T4 no comparte.
  //
  // TRAMO: se mide contra la vara ADULTA porque lo que se decide aquí es el PLATO DE LA MESA, no
  // la ración de una persona (eso lo ajusta T3 y lo audita T4 por comensal). La vara adulta es
  // la más exigente en fruta-verdura (175 g frente a 135 de un menor de 12), así que el sesgo va
  // al lado estricto — el único aceptable cuando se construye.
  const gramosCache = {};
  function piezasDe(eid, tramo) {
    const k = `${eid}|${tramo}`;
    if (gramosCache[k]) return gramosCache[k];
    const out = [];
    for (const l of lineasPlanas(ix, eid)) {
      const gramos = ((tramo === 'nino' ? l.gramos_nino : l.gramos_adulto) || 0) * (l.escala || 1);
      if (Array.isArray(l.alternativas)) {
        // PEOR CASO declarado: el motor elige la opción DESPUÉS de esta comprobación, así que una
        // línea de eje solo cuenta si TODAS sus opciones caen en el MISMO eje — y entonces cuenta
        // con la que tiene la ración MAYOR, que es la que menos fracción aporta. (Comparar por
        // categoría en vez de por eje habría descartado en silencio un futuro `[patata, arroz]`,
        // que son dos categorías y un solo eje. Hoy no hay ninguna: 14 líneas de eje con
        // categorías mixtas, 0 con eje único — medido.)
        const ejes = new Set(l.alternativas.map(a => ejeDeCategoria[(ix.cat[a] || {}).categoria]));
        if (ejes.size !== 1 || ejes.has(undefined)) continue;
        const peor = l.alternativas.reduce((p, a) =>
          ((ix.cat[a] || {}).racion_ref_g || 0) > ((ix.cat[p] || {}).racion_ref_g || 0) ? a : p);
        out.push({ alimento: peor, gramos, papel: l.papel, base: l.base });
        continue;
      }
      out.push({ alimento: l.alimento_id, gramos, papel: l.papel, base: l.base });
    }
    return (gramosCache[k] = out);
  }
  // ¿el conjunto de piezas cubre el eje EN GRAMOS para el tramo dado?
  const cubreEjeDe = (ids, eje, tramo) => cubreEje(
    ids.flatMap(id => piezasDe(id, tramo)), null, eje, datos, config).cubre;
  const cubreFV = (ids, tramo) => cubreEjeDe(ids, 'fruta-verdura', tramo);

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
        const coste = costeS(sen, config).total
          + (st.bigramas[bg] || 0) * EXTRA.bigrama_repetido
          + excluidos.length * EXTRA.comer_aparte_secundaria;
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
    const comp = complemento(c, presentes, s, piezas, notas, relaj);
    piezas.push(...comp.piezas);
    notas.push(...comp.notas);
    return { piezas, notas: dedupNotas(notas), usoR2: usoR2 || comp.usoR2, ejes_abiertos: ejesAbiertos };
  }

  // ── EL COMPLEMENTO DE CUOTA (§10.11 y §13.9, construido el 4-ago-2026)
  //
  // ── QUÉ ES Y POR QUÉ NO EXISTÍA
  // «Una casilla no es la única vía de una unidad. La tercera pieza de huevo del niño no sale de
  // una tercera tortilla: sale del cierre del plato, como complemento» (§13.9). Y §10.11 lo dice
  // con la aritmética delante: «el mínimo del niño no se cubre con tres tortillas, porque esas
  // mismas tres darían seis al adulto: se cubre con el complemento».
  //
  // El banco tiene cinco `secundaria-proteina` —`huevo-duro`, `hummus`, `virutas-jamon`,
  // `fiambre`, `salmon-ahumado`— y ninguna había salido JAMÁS: 0 apariciones en 644 servicios,
  // medido el 4-ago sobre la parrilla. El motivo era estructural, no de coste: `cerrarPlato`
  // rellena los ejes que FALTAN, la proteína la cierra siempre el principal por tipo, y por tanto
  // no existía ningún camino por el que una secundaria de proteína pudiera entrar en un plato.
  // Cinco elaboraciones cargadas con disciplina y con efecto cero — el mismo molde que el censo
  // ya cazó en las reglas de D2.
  //
  // ── CUÁNDO ENTRA
  // Solo cuando el PREVUELO ha declarado que un mínimo no cabe en casillas
  // (`min_por_complemento`, ver allí la cuenta) y ese comensal sigue por debajo de su mínimo REAL
  // con lo que lleva servido. No es una preferencia ni un relleno: es la única vía que le queda a
  // una cuota que la mesa no puede darle por la vía de las casillas.
  //
  // ── A QUIÉN SE LE SIRVE
  // SOLO a quien lo necesita, con `solo-para`. Servirlo a toda la mesa es exactamente lo que
  // §10.11 prohíbe: el huevo duro que salva el mínimo del niño rompería el techo del adulto. Y
  // por eso se comprueba el techo de cada beneficiario ANTES de servírselo — un complemento que
  // cierra un mínimo rompiendo un techo no ha cerrado nada.
  //
  // ── LO QUE HOY NO ALCANZA, DICHO Y NO ESCONDIDO
  // De las cinco, solo `huevo-duro` puede cerrar un mínimo hoy: `hummus` y `salmon-ahumado` no
  // tienen ración de referencia en D1 (hueco `sin-racion-en-d1` que el prevuelo ya declara),
  // `fiambre` resuelve por eje y `virutas-jamon` solo alimenta cubos de TECHO (carne-procesada),
  // donde un complemento nunca ayuda. El mecanismo es genérico y las otras cuatro entrarán solas
  // el día que su dato entre; hoy la que muerde es la que §10.11 nombra por su nombre.
  //
  // ── LA CUENTA SE HACE SOBRE EL SERVICIO ENTERO, NO SOBRE EL ESTADO PREVIO
  // Primera versión medida el 4-ago: comprobar el techo contra `st.tomas` subió las semanas por
  // encima del techo de huevo de 11 a 20. El motivo es que `cerrarPlato` corre ANTES de aplicar,
  // así que `st.tomas` todavía no lleva lo que el principal de ESTE servicio va a servir: con el
  // adulto en 2 y una tortilla de 2 delante, el complemento veía sitio para una tercera pieza que
  // ya no existía. La cuota se cierra UNA VEZ por servicio y con todas las líneas del comensal
  // juntas (fila 5.4) — así que aquí se hace igual: se monta su composición completa (principal +
  // las guarniciones que le tocan + la candidata) y se mide sobre ella.
  function complemento(cPrincipal, presentes, s, piezasYa, notasYa, relaj) {
    const vacio = { piezas: [], notas: [], usoR2: false };
    // composición YA decidida de este servicio para un miembro (respeta `solo-para`)
    const suyasDelServicio = mid => {
      const out = [{ elaboracion_id: cPrincipal.elaboracion_id, opcion: cPrincipal.opcion }];
      for (const pz of piezasYa) {
        const sp = notasYa.find(n => n.tipo === 'solo-para' && n.elaboracion_id === pz.elaboracion_id);
        if (sp && !sp.miembros.includes(mid)) continue;
        const r = pre.resolucion[mid][pz.elaboracion_id];
        if (!r || r.estado === 'excluido') continue;
        out.push({ elaboracion_id: pz.elaboracion_id,
          opcion: pz.opciones_eje ? (pz.opciones_eje[mid] || pz.opciones_eje['*']) : null });
      }
      return out;
    };
    const cuotaCon = (mid, extraId) => {
      const lineas = [];
      for (const p of suyasDelServicio(mid).concat(extraId ? [{ elaboracion_id: extraId, opcion: null }] : []))
        lineas.push(...aportes(p, mid));
      return cuotaDe(lineas, mid);
    };
    // ── EL COMPLEMENTO ES EL ÚLTIMO RECURSO, NO EL PRIMERO
    // El bucle de relleno recorre los slots por most-constrained, NO por calendario, así que
    // cuando se decide un servicio puede quedar por delante media semana de casillas del mismo
    // cubo. Medido el 4-ago: sin esta proyección el mismo niño recibía DOS huevos duros en una
    // semana —uno por cada slot que se rellenó antes que sus tortillas— y cerraba en 5 piezas con
    // techo 4. Así que solo se complementa lo que las casillas que aún quedan no pueden dar ni en
    // lo que van a dar. La cota es el peso BAJO —lo que la receta sirve— y no el alto: contra un
    // mínimo, contar con el mejor caso de cada casilla es dar por cubierto lo que no lo está, y
    // medido con el peso alto el complemento se apagaba entero (56 → 4 apariciones) porque dos
    // casillas de huevo «prometían» cuatro piezas al niño que T3 nunca le sirve. Es la misma
    // proyección sobre `pendientes` que ya hacen los techos, con la cota del lado correcto.
    const necesitan = {};                              // cubo → [mid…] con deuda VIVA
    for (const mid of presentes) {
      if (pre.resolucion[mid][cPrincipal.elaboracion_id].estado === 'excluido') continue;
      for (const [cubo, banda] of Object.entries(pre.bandasEfectivas[mid] || {})) {
        if (!(banda.min_por_complemento > 0)) continue;
        // ⚑ §13.9.1 · LA DEUDA ES UN OBJETO DEL LIBRO, NO UNA ESPERA (5-ago-2026).
        // Lo que decide si el complemento entra es si la deuda sigue viva, no cuántas casillas
        // quedan por delante. La cuantía la acuñó el prevuelo (`min_por_complemento`) y el libro
        // (`st.deuda`) dice cuánto se ha cobrado ya: mientras quede deuda, se cobra en el PRIMER
        // slot donde quepa — y `cabe`, más abajo, es quien garantiza que quepa sin romper ningún
        // techo del beneficiario.
        // Lo que había antes era una proyección sobre `pendientes` que esperaba a que no quedara
        // ninguna casilla del cubo por delante. Esa espera existía para no servirlo dos veces, y
        // el libro lo impide mejor: cobrar dos veces es imposible si se anota lo cobrado. Su coste
        // estaba medido y era el punto 2 de lo abierto del bloque 10: el mínimo de huevo del niño
        // quedaba corto en 9 de 164 veredictos porque el ÚLTIMO slot no siempre admite complemento
        // —o no lo puede comer quien lo necesita, o choca con M4, o no queda hueco en el plato.
        if (((st.deuda[mid] || {})[cubo] || 0) >= banda.min_por_complemento - 1e-9) continue;
        (necesitan[cubo] = necesitan[cubo] || []).push(mid);
      }
    }
    if (!Object.keys(necesitan).length) return vacio;
    const idxCal = ORDEN_CAL.indexOf(s.slot);
    const distM4 = relaj.R2 ? 1 : config.VENTANAS.M4_servicios;
    const yaEnPlato = new Set(piezasYa.map(p => p.elaboracion_id));
    const evaluadas = [];
    for (const e of Object.values(ix.elab)) {
      if (e.tipo !== 'secundaria-proteina' || yaEnPlato.has(e.id)) continue;
      if (evitarPiezas && evitarPiezas.has(e.id)) continue;
      if (ix.esPesada(e.id) && st.fritos >= config.FRITOS_SEMANA_MAX) continue;
      // ¿a quién de los que lo necesitan puede servirle, y sin romperle un techo?
      const para = [];
      for (const [cubo, mids] of Object.entries(necesitan)) {
        for (const mid of mids) {
          if (para.includes(mid)) continue;
          const r = pre.resolucion[mid][e.id];
          if (!r || r.estado !== 'tal-cual') continue;   // el complemento viaja SIN notas propias
          if (ix.tieneEje[e.id] && !(pre.opcionesLegales[mid][e.id] || []).length) continue;
          const sin = cuotaCon(mid, null), con = cuotaCon(mid, e.id);
          if (!((con.tomas[cubo] || 0) > (sin.tomas[cubo] || 0))) continue;   // no le mueve SU cubo
          // ningún techo suyo puede romperse por recibirlo — ni el de frecuencia ni el de salud
          let cabe = true;
          for (const [c2, n] of Object.entries(con.tomas)) {
            const b = (pre.bandasEfectivas[mid] || {})[c2];
            if (b && (st.tomas[mid][c2] || 0) + n > b.max + 1e-9) { cabe = false; break; }
          }
          if (cabe) for (const [cat, g] of Object.entries(con.gramosSalud)) {
            const techo = config.TECHOS_SALUD_G_SEMANA[cat];
            if (techo != null && (st.saludG[mid][cat] || 0) + g > techo + 1e-6) { cabe = false; break; }
          }
          if (cabe) for (const l of aportes({ elaboracion_id: e.id, opcion: null }, mid)) {
            const t = techoVentana(reglasVentana, l.alimento, edades[mid]);
            if (t != null && ((st.ventanaG[mid] || {})[l.alimento] || 0) + (l.gramos || 0) > t + 1e-6) { cabe = false; break; }
          }
          if (cabe) para.push(mid);
        }
      }
      if (!para.length) continue;
      const per = percibidoDe(e.id, null);
      const u = distSec(per, idxCal);
      if (u != null && u < distM4) continue;
      evaluadas.push({ e, para, soloConR2: u != null && u < config.VENTANAS.M4_servicios,
        coste: -para.length });                          // sirve a más gente = mejor; luego id
    }
    if (!evaluadas.length) return vacio;
    evaluadas.sort((a, b) => a.coste - b.coste || (a.e.id < b.e.id ? -1 : 1));
    const el = evaluadas[0];
    const notas = [];
    // `solo-para` SIEMPRE, aunque hoy coincida con toda la mesa: el complemento es de quien tiene
    // la cuota corta, y que la mesa entera lo necesite es una coincidencia de esta semana, no la
    // regla. Sin la nota, el techo del que no lo necesita se rompería la semana que no coincidan.
    notas.push({ tipo: 'solo-para', miembros: el.para, elaboracion_id: el.e.id });
    return { piezas: [{ elaboracion_id: el.e.id, opciones_eje: null }], notas,
      usoR2: el.soloConR2 };
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
  // el `cubo` del prevuelo se CONSERVA (5.4): lo sabía y lo tiraba aquí, así que un mínimo
  // declarado inalcanzable no se podía cruzar con el recuento de T4 y parecía un incumplimiento
  // silencioso. El campo ya es parte del contrato del formato (`serializar.js`).
  const descargosEstructurales = pre.descargos.map(d =>
    ({ tipo: d.tipo, miembro: d.miembro, cubo: d.cubo || null, detalle: d.detalle }));
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
          coste: costeS(sen, config).total
            + excluidos.length * EXTRA.comer_aparte
            + (novedadExcedida ? EXTRA.novedad_sobre_cupo : 0)
            + (descargoTecho ? EXTRA.techo_cedido : 0) });
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
  // ⚑ EL RESUMEN DE SEMANA (mínimos y techos fuera de banda) YA NO SE ESCRIBE AQUÍ (7-ago-2026,
  // ley 13.11.1: «la vara es LO SERVIDO»). Este bloque declaraba con el recuento de T2 —la
  // PROYECCIÓN de la receta— y T3 movía los gramos después: medido, 97 de 136 descargos de
  // techo (71%) con cifra distinta de la del juez y 21 mínimos MUDOS (receta al mínimo, servido
  // corto, nadie lo decía). Ahora lo escribe `sellarResumenSemana` (t3_fracciones.js) desde la
  // columna Servida, al cerrar T3 — con las MISMAS bandas (`pre.bandasEfectivas`, que generar
  // le pasa). El recuento de T2 (`st.tomas`) sigue siendo su dato interno de decisión: lo que
  // muere es que se DECLARE. Los descargos de servicio («aquí cedí») siguen emitiéndose donde
  // se cede — el motivo de que el resumen no viva en `contratos` sigue siendo el medido el
  // 4-ago: `contratos` retorna al primer choque y solo ve el principal.

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
          : s.ancla ? 'ancla-vs-techo' : 'techo-vs-reserva';
      // ⚑ 5.4 · el descargo dice QUÉ CUBO cedió y A QUIÉN. Sin eso, un techo superado no se
      // puede carear contra el recuento de T4: se sabía que «algo cedió», no qué, y el gate de
      // «cero silenciosas» no podía cubrir las cuotas. El tipo se llamaba
      // `techo-fraccional-vs-reserva` y ya no hay nada fraccional que declarar: la reserva de T1
      // y el recuento de T2 están por fin en la misma unidad, y lo que puede chocar es el techo
      // con el pool, no una vara con otra.
      const mc = /^techo (?:proyectado )?de ([a-z-]+) de (\S+)/.exec(m)
        || /^techo de salud de ([a-z-]+) de (\S+)/.exec(m);
      descargos.push({ tipo, cubo: mc ? mc[1] : null, miembro: mc ? mc[2] : null,
        detalle: tipo === 'ancla-vs-techo'
          ? `${m} — el ancla ${s.ancla} manda (dictado): el techo cede declarado`
          : tipo === 'techo-vs-reserva'
            ? `${m} — la reserva del esqueleto choca con lo que el pool puede servir a esta mesa; se sirve y se declara`
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
    const sustDe = {}, sustPostre = {};
    for (const n of sv.notas) {
      if (n.tipo !== 'sustituto') continue;
      if (n.ambito === 'plato') sustDe[n.miembro] = n;
      else if (n.ambito === 'postre') sustPostre[n.miembro] = n;
    }
    for (const mid of presentes) {
      const tramo = tramoDe(mid);
      const piezas = (sustDe[mid] ? sustDe[mid].plato : sv.plato.filter(pe => {
        const soloPara = sv.notas.find(n => n.tipo === 'solo-para' && n.elaboracion_id === pe.elaboracion_id);
        if (soloPara && !soloPara.miembros.includes(mid)) return false;
        const r = pre.resolucion[mid][pe.elaboracion_id];
        return r && r.estado !== 'excluido';
      })).concat(postreDe(sv, mid, sustPostre));
      // ⚑ 5.4 · la cuota se cierra UNA VEZ por servicio, con TODAS las líneas del comensal
      // juntas. Acumularla pieza a pieza contaba de más (dos medias raciones = dos tomas) o de
      // menos (dos medias raciones = ninguna); es del plato que se come, no de cada trozo.
      const lineasDelServicio = [];
      for (const pe of piezas) {
        const op = pe.opciones_eje ? (pe.opciones_eje[mid] || pe.opciones_eje['*']) : null;
        lineasDelServicio.push(...aportes({ elaboracion_id: pe.elaboracion_id, opcion: op }, mid));
        if (tramo === 'nino' && esNovedadPara(mid, { elaboracion_id: pe.elaboracion_id, opcion: op }, null))
          st.novedades[mid] = (st.novedades[mid] || 0) + 1;
      }
      const q = cuotaDe(lineasDelServicio, mid);
      // ⚑ §13.9.1 · EL LIBRO ANOTA LO COBRADO. Una `secundaria-proteina` que este comensal recibe
      // es un cobro de deuda: se apunta lo que aporta a cada cubo, y a partir de ahí esa deuda
      // deja de estar viva para él. `piezas` ya viene filtrada por `solo-para`, así que aquí solo
      // están las que REALMENTE come — que es la condición de que el cobro exista.
      for (const pe of piezas) {
        if ((ix.elab[pe.elaboracion_id] || {}).tipo !== 'secundaria-proteina') continue;
        const qc = cuotaDe(aportes({ elaboracion_id: pe.elaboracion_id, opcion: null }, mid), mid);
        for (const cubo of Object.keys(qc.tomas))
          (st.deuda[mid] = st.deuda[mid] || {})[cubo] = ((st.deuda[mid] || {})[cubo] || 0) + qc.tomas[cubo];
      }
      for (const cubo of Object.keys(q.tomas)) {
        st.tomas[mid][cubo] = (st.tomas[mid][cubo] || 0) + q.tomas[cubo];
        // §20.39 · y el contador de la ventana MENSUAL, que sigue vivo la semana que viene
        if ((config.CUOTAS_MENSUALES || {})[cubo] && (config.CUOTAS_MENSUALES[cubo][tramo] != null))
          (st.tomasMes[mid] = st.tomasMes[mid] || {})[cubo] = ((st.tomasMes[mid] || {})[cubo] || 0) + q.tomas[cubo];
      }
      for (const [cat, g] of Object.entries(q.gramosSalud))
        st.saludG[mid][cat] = (st.saludG[mid][cat] || 0) + g;
      // 5.5 · y los gramos vigilados por ventana móvil, que siguen contando la semana que viene
      for (const l of lineasDelServicio) {
        if (techoVentana(reglasVentana, l.alimento, edades[mid]) == null) continue;
        (st.ventanaG[mid] = st.ventanaG[mid] || {})[l.alimento] =
          ((st.ventanaG[mid] || {})[l.alimento] || 0) + (l.gramos || 0);
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
const { unidadDe, aPiezas, cuotaDeServicio } = require('./cuotas.js');
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
  // ── §13.10 · T3 NO PUEDE DESBORDAR LA FRECUENCIA (cerrado el 4-ago-2026)
  // «Al servir gramos, una línea de categoría contable se redondea a piezas enteras con la unidad
  // de su propio alimento.» Lo que faltaba es el techo: el bloque de piezas de abajo movía la
  // ración de una protagonista entre 1 y 2 por ENERGÍA y nadie miraba la cuota, así que T3 podía
  // subir a un niño de 1 a 2 huevos en un servicio y romperle la semana después de que T2 la
  // hubiera cuadrado. Medido el 4-ago: era la vía por la que el techo seguía cediendo con el
  // reparto de T1 ya correcto. Aquí se lleva el acumulado de piezas y la subida se para en el
  // techo — bajar sí puede, subir por encima del techo no.
  // La banda es la ENTERA de `config.CUOTAS`, sin pro-ratear por presencia: es una cota laxa a
  // propósito (con presencia parcial el techo real es menor y lo gobierna T2, que sí pro-ratea).
  // T3 nunca debe ser MÁS restrictivo que quien decidió el menú; solo debe dejar de romperlo.
  const piezasAcum = {};                             // mid → categoría contable → piezas servidas
  for (const m of familia.miembros) piezasAcum[m.id] = {};
  // ── LA COLUMNA SERVIDA DEL LIBRO (ley 13.11.1, 5-ago: «la vara es LO SERVIDO»). Las tomas
  //    que cada miembro RECIBE de verdad, contadas con la definición única (`cuotaDeServicio`)
  //    sobre los gramos finales de T3 — fracción, ajustes de rango y piezas enteras incluidos.
  //    El recorrido es el del MOTOR (piezasDe + derivador), jamás el del juez: T4 conserva el
  //    suyo y el careo entre ambos es lo que vigila que no se separen (§13.11).
  const tomasServidas = {};                          // mid → cubo → tomas/piezas servidas
  for (const m of familia.miembros) tomasServidas[m.id] = {};

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
      // ── QUÉ COTA MANDÓ DE VERDAD (§13.6 «cero relajaciones silenciosas», 4-ago-2026)
      // El límite de realidad de §20.9 —«fuera de 0,4-2 el plato deja de ser ese plato»— CEDE
      // ante las dos cotas que están por encima de él: el suelo proteico (§1-T3, cota inferior
      // innegociable) y el techo de salud (§14.4, jamás relajable). Que ceda es correcto y ya
      // estaba escrito. Lo que faltaba es que se DIJERA: el único descargo que salía era el de
      // energía, y su detalle listaba «suelo, techo de salud o límite de realidad» — un «o» que
      // no se puede auditar. Un niño de 3 años recibiendo un 30% del plato para que el techo de
      // carne roja aguante es una decisión defendible y una cesión de §20.9; enseñarla como una
      // desviación de energía la esconde. Ahora la cota que mordió se nombra, y salir del límite
      // lleva su propio descargo con su motivo.
      // La cota se DERIVA de los valores, no de qué lado del límite cayó: por debajo solo puede
      // bajar `fMaxSalud` y por encima solo puede subir `fMinSuelo`, pero escribirlo por posición
      // sería una correlación que se rompe sola en cuanto alguien añada una tercera cota.
      const cota = mejor < LIMITE.min - 1e-9 && Math.abs(mejor - fMaxSalud) < 1e-3 ? 'techo de salud'
        : mejor > LIMITE.max + 1e-9 && Math.abs(mejor - fMinSuelo) < 1e-3 ? 'suelo proteico'
          : (mejor < LIMITE.min - 1e-9 || mejor > LIMITE.max + 1e-9) ? 'una cota sin identificar' : null;
      if (cota) descargos.push({ tipo: 'fuera-de-limite-de-realidad', miembro: m.id,
        detalle: `${m.id}: se sirve ×${mejor} de la receta, fuera del límite de realidad ${LIMITE.min}-${LIMITE.max} (§20.9) — manda el ${cota}, que está por encima de ese límite y no se relaja` });
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

      // 2-ter · PIEZAS ENTERAS en categorías contables (Roger, 4-ago: «nadie pesa los huevos»).
      // Un huevo se sirve entero: servir 84 g —huevo y medio— no existe en una cocina, y con la
      // cuota contada en piezas hacía además que T2 predijera una cosa y T4 contara otra (26% de
      // los servicios con huevo). Donde el huevo es PROTAGONISTA la ración se mueve entre 1 y 2
      // según su energía; donde es COMPLEMENTO manda la receta y no se mueve.
      for (const cat of (config.CUOTAS_CONTABLES || [])) {
        const protagonistas = (config.PIEZAS_PROTAGONISTA || {})[cat] || [];
        const [pMin, pMax] = config.PIEZAS_PROTAGONISTA_RANGO;
        for (const pe of piezasDe(sv, m.id).piezas) {
          for (const l of ix.lineasDe[pe.elaboracion_id] || []) {
            if (Array.isArray(l.alternativas) || l.componente_id || !l.alimento_id) continue;
            const ficha = (datos.categorias_aesan || []).find(x => x.alimento_id === l.alimento_id);
            if (!ficha || ficha.categoria !== cat) continue;
            // ⚑ 4-ago (sesión 6) · LA MISMA UNIDAD QUE CUENTA LA CUOTA, no una propia. Aquí
            // vivía `racionParaLinea`, que devuelve los 58 g de la UNIDAD MEDIANA del huevo para
            // las tres formas —entero, yema y clara—, y con ella este bloque convertía los 34 g
            // de yema de la carbonara en «1 pieza = 58 g»: 3,4 yemas servidas donde la receta
            // pone 2. Era el patrón de bug nº1 del proyecto —dos implementaciones de la misma
            // medida— y además rompía el dictado de Roger del 4-ago: donde el huevo es
            // COMPLEMENTO manda la receta y no se mueve. Con la unidad correcta, el complemento
            // se re-ancla a sus propias piezas y deja de moverse.
            const unidad = unidadDe(datos, l.alimento_id)
              || (racionParaLinea(datos, ficha, obj.edad) || {}).g;
            if (!(unidad > 0)) continue;
            const nominal = (esNino ? l.gramos_nino : l.gramos_adulto) || 0;
            // MISMA función de pieza que cuenta la cuota (`cuotas.js`), no una propia: es el
            // patrón de §13.11 —una definición, tres recorridos—. Con `Math.round` aquí y el
            // corte estricto allí, T3 servía la pieza que la cuota no contaba.
            const piezasReceta = aPiezas(nominal / unidad);
            if (piezasReceta < 1) continue;             // ligante: 15-30 g, no llega a pieza
            let piezas = piezasReceta;
            if (protagonistas.includes(pe.elaboracion_id)) {
              // el huevo ES el plato: la energía puede moverlo, pero solo en piezas, dentro del
              // rango que la receta admite y SIN pasar del techo de la semana (§13.10)
              piezas = Math.min(pMax, Math.max(pMin, aPiezas(nominal * mejor / unidad)));
              const techo = ((config.CUOTAS[cat] || {})[tramo] || [])[1];
              if (techo != null) {
                const sitio = techo - (piezasAcum[m.id][cat] || 0);
                if (piezas > sitio) piezas = Math.max(pMin, Math.min(piezas, Math.max(0, sitio)));
              }
            }
            piezasAcum[m.id][cat] = (piezasAcum[m.id][cat] || 0) + piezas;
            const g = Math.round(piezas * unidad);
            if (g === Math.round(nominal * mejor)) continue;
            ajustesLinea.push({ miembro: m.id, elaboracion_id: pe.elaboracion_id,
              alimento_id: l.alimento_id, gramos: g });
            // la proteína VIVA sigue a los gramos que de verdad se sirven: redondear a piezas
            // enteras mueve proteína, y la declaración de más abajo tiene que ver ese movimiento.
            // Sin esto, T3 declaraba (o callaba) sobre la receta y no sobre el plato — cazado por
            // T4 en `2026-W05 4-cena a2`, 15,1 g contra un suelo de 15,4 g **sin descargo**.
            protViva += (g - nominal * mejor) * protPorGramo(ix, l);
          }
        }
      }

      // 3 · DECLARACIONES — «conflicto → descargo, jamás silencio» (spec §1-T3). El `tipo` es
      // SIEMPRE `suelo-proteico`, que es lo que la vara busca (b_energia): el matiz del caso va
      // en `detalle`, jamás en un tipo propio, o la violación viajaría muda ante el juez.
      // (Restaurado tras cazarlo la QA-2 con un grep: mi edición por script del bloque anterior
      // se llevó por delante estas líneas y T3 quedó SIN emitir un solo descargo.)
      // ⚑ 4-ago-2026 · la declaración mide lo SERVIDO (`protViva`), no la receta escalada. Los dos
      // ajustes de arriba —el fino por rango y el de piezas enteras— mueven gramos después de
      // fijar la fracción, así que `base.proteina × factor` dejó de ser lo que el comensal come.
      // T4 cuenta lo servido: declarar sobre otra cosa es fabricar un desacuerdo entre generador y
      // juez, que es el bug nº1 de este proyecto.
      const protFinal = protViva;
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
        // ⚑ 4-ago-2026 · el detalle NOMBRA la cota que mordió. Decía «acotada por suelo, techo de
        // salud o límite de realidad», y un «o» no se audita: quien lee no sabe cuál de las tres
        // fue, así que el descargo no permite comprobar nada. Se deriva de los valores.
        const quien = Math.abs(mejor - fMinSuelo) < 1e-3 ? 'el suelo proteico'
          : Math.abs(mejor - fMaxSalud) < 1e-3 ? 'el techo de salud'
            : Math.abs(mejor - LIMITE.min) < 1e-3 ? `el límite de realidad (×${LIMITE.min})`
              : Math.abs(mejor - LIMITE.max) < 1e-3 ? `el límite de realidad (×${LIMITE.max})`
                : 'la composición del plato';
        descargos.push({ tipo: 'energia-fuera-de-banda', miembro: m.id,
          detalle: `${m.id}: la cantidad queda en ${(100 * desvio).toFixed(0)}% del objetivo del servicio — la acota ${quien}` });
        relajaciones.push({ peldano: 'R5',
          detalle: `banda de energía del servicio fuera para ${m.id} (${(100 * desvio).toFixed(0)}%): se DECLARA y ahí muere — nada compensa a nada (§5)`,
          frase: 'Hoy la ración queda un poco fuera de lo justo.' });
      }

      // ── 4 · LA COLUMNA SERVIDA de este miembro en este servicio (ley 13.11.1). Los gramos
      //    finales son los de arriba: fracción `mejor` + los `ajustes_linea` de ESTE miembro
      //    (rango fino y piezas enteras), que el derivador aplica como absolutos (gAjuste).
      {
        const { piezas: piezasSello, ajustes: ajustesSello } = piezasDe(sv, m.id);
        const lineasSello = [];
        for (const pe of piezasSello) {
          const ajG = {};
          for (const a of ajustesLinea)
            if (a.miembro === m.id && a.elaboracion_id === pe.elaboracion_id) ajG[a.alimento_id] = a.gramos;
          const r = derivarElaboracion(ix, pe, m.id, esNino, mejor, [], [], { ...ajustesSello, gramos: ajG });
          for (const l of r.lineas) lineasSello.push({ alimento: l.alimento, gramos: l.gramos_base, papel: l.papel });
        }
        const q = cuotaDeServicio(lineasSello, { edad: obj.edad }, datos, config);
        for (const c of Object.keys(q.tomas))
          tomasServidas[m.id][c] = (tomasServidas[m.id][c] || 0) + q.tomas[c];
      }
    }
    salida.push({ slot: `${sv.dia}-${sv.servicio}`, fracciones, ajustes_linea: ajustesLinea, descargos, relajaciones });
  }
  return { servicios: salida, tomas_servidas: tomasServidas };
}

// ── EL SELLO DEL RESUMEN DE SEMANA (ley 13.11.1, 5-ago-2026: «la vara es LO SERVIDO»).
// Hasta hoy el resumen de mínimos y techos lo escribía T2 al cerrar su contador — la PROYECCIÓN
// de la receta — y T3 movía los gramos después: medido, 97 de 136 descargos de techo (71%)
// decían una cifra distinta de la del juez, y 21 mínimos quedaban MUDOS (la receta llegaba al
// mínimo, lo servido no, y nadie lo declaraba). Este sello borra el resumen proyectado y lo
// reescribe desde la columna Servida al cerrar T3: el número declarado es el que llegó al
// plato. La proyección de T2 sigue siendo su dato interno de decisión — lo que muere es que se
// DECLARE. El filtro es quirúrgico: solo los dos tipos del resumen y solo con el formato
// `(x/y tomas)` — los descargos de servicio («aquí cedí») no se tocan.
function sellarResumenSemana(semana, bandasEfectivas, tomasServidas) {
  const FORMATO = /\(\d+(?:\.\d+)?\/\d+(?:\.\d+)? tomas\)/;
  for (const sv of semana.servicios) if (sv.descargos && sv.descargos.length)
    sv.descargos = sv.descargos.filter(d =>
      !(['minimo-no-cubierto', 'techo-vs-reserva'].includes(d.tipo) && FORMATO.test(d.detalle || '')));
  const ultimo = [...semana.servicios].reverse().find(sv => sv.plato && !sv.no_servido);
  if (!ultimo) return;
  ultimo.descargos = ultimo.descargos || [];
  for (const [mid, bandas] of Object.entries(bandasEfectivas || {})) {
    for (const [cubo, banda] of Object.entries(bandas)) {
      const recibido = (tomasServidas[mid] || {})[cubo] || 0;
      if (banda.min > 0 && recibido < banda.min - 1e-9)
        ultimo.descargos.push({ tipo: 'minimo-no-cubierto', miembro: mid, cubo,
          detalle: `${mid} se queda corto de ${cubo} esta semana (${recibido}/${banda.min.toFixed(1)} tomas) — la vara es lo SERVIDO (13.11.1)` });
      if (banda.max < Infinity && recibido > banda.max + 1e-9)
        ultimo.descargos.push({ tipo: 'techo-vs-reserva', miembro: mid, cubo,
          detalle: `${mid} se pasa de ${cubo} esta semana (${recibido}/${banda.max} tomas) — la vara es lo SERVIDO (13.11.1)` });
    }
  }
}

module.exports = { fraccionarSemana, piezasDe, sellarResumenSemana };

  };

  /* ---- motor_v6/src/t4_auditoria.js ---- */
  REG['t4_auditoria'] = function (module, exports, require) {
// T4 · AUDITORÍA CON DOBLE CONTABILIDAD (spec §1-T4).
//
// QUÉ ES: un contador INDEPENDIENTE del generador que re-cuenta lo servido y lo compara con lo
// que el motor declaró. **Divergencia = BUG, jamás ajuste.**
//
// ⚠️ VARA PROPIA, DELIBERADAMENTE (pedido de auditoría QA-2, 2-ago): este módulo NO importa
// ninguna batería, y su RECORRIDO —composición del miembro, sustitutos, opción elegida, gramos
// finales— está reimplementado aquí y no se comparte con nadie. T4 existe justamente para cazar
// el caso en que generador y juez se equivoquen igual: si T4 llamara a las funciones del motor,
// no auditaría, confirmaría.
//
// ⚑ FRONTERA, fijada el 3-ago al cerrar la fila 4.1: lo propio es el RECUENTO, no el METRO.
// `src/ejes.js` (y a través de él `src/raciones.js`, la vara única del banco) sí se importa: la
// ración de referencia es DATO del banco y tener dos copias a mano del mismo número no era
// independencia, era el bug nº1 esperando —de hecho ya divergían: T4 medía con la ración del
// tramo y T2 con la adulta para todos—. Dos varas distintas no auditan mejor: hacen que el
// desacuerdo sea ininterpretable. Lo que T4 conserva es lo que sí puede fallar de forma
// distinta: qué líneas se sirvieron, a quién y con cuántos gramos.
//
// GATE (spec §9 y §1-T4): **cero relajaciones silenciosas.** Toda ventana incumplida tiene que
// llevar su peldaño declarado en el servicio; todo suelo o techo roto, su descargo.
'use strict';

const { cubreEje } = require('./ejes.js');
const { cuotaDeServicio } = require('./cuotas.js');

const KCAL = { proteina: 4, hidratos: 4, grasa: 9, fibra: 2 };

// ── índices propios (no se reutiliza `indexar` del derivador: misma fuente, otra implementación)
function indice(datos) {
  const alim = {}, cat = {}, nut = {}, lin = {}, elab = {};
  for (const a of datos.alimentos) alim[a.id] = a;
  for (const f of datos.categorias_aesan || []) cat[f.alimento_id] = f;
  for (const n of datos.nutricion) {
    if (n.valor == null) continue;
    ((nut[n.alimento_id] = nut[n.alimento_id] || {})[n.base] = nut[n.alimento_id][n.base] || {})[n.nutriente] = n.valor;
  }
  for (const l of datos.lineas) (lin[l.padre] = lin[l.padre] || []).push(l);
  for (const e of datos.elaboraciones) elab[e.id] = e;
  return { alim, cat, nut, lin, elab };
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
  // el PLATO y el POSTRE viajan separados a propósito (§6.3, §6.9): son las dos partes del
  // servicio y hay medidas que se hacen sobre el servicio entero (cuotas, techos, energía) y
  // otras sobre el plato solo (los ejes). Fundirlos aquí era exactamente lo que hacía que la
  // fruta del postre eximiera del eje de verdura del plato.
  return { plato, postre, quitar, cambiar, gramos };
}

// líneas servidas a un miembro, con gramos finales (recorrido propio, componentes incluidos).
// `ambito`: 'servicio' = plato + postre (cuotas, techos de salud, suelo proteico, energía —
// la fruta del postre SÍ cuenta ahí, dictado de Roger 6-ago) · 'plato' = sólo el plato (§6.9).
function lineasServidas(ix, sv, mid, esNino, fraccion, ambito = 'servicio') {
  const { plato, postre, quitar, cambiar, gramos } = composicion(sv, mid);
  const piezas = ambito === 'plato' || !postre ? plato : plato.concat([postre]);
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

// ¿el plato servido llega a media ración del eje EN GRAMOS? (bloqueante 2-ago: `ejes` era una
// etiqueta y la hamburguesa salía sola).
//
// EL RECUENTO SIGUE SIENDO PROPIO —`lineasServidas` de aquí arriba, con su composición, sus
// sustitutos y su opción elegida— y eso es lo que §1-T4 protege. Lo que ya NO es propio es la
// DEFINICIÓN de ración: el `{ adulto: 175, nino: 135 }` que vivía aquí era una copia a mano de
// la ración de verdura de A22, no coincidía con la del constructor (que usaba 175 para todos) y
// dejaba `hidrato` sin medir. Ahora la vara sale de `ejes.js` → `raciones.js` → banco. Compartir
// el METRO no es compartir la MEDICIÓN: si el motor y el juez leen el mismo dato del banco y
// caminan las líneas por su cuenta, la divergencia que T4 busca sigue siendo visible.

const protDeLinea = (ix, l) => {
  const porBase = ix.nut[l.alimento] || {};
  const m = porBase[l.base] || porBase.crudo || porBase.cocido || {};
  return (l.gramos / 100) * (m.proteina || 0);
};

// ── AUDITORÍA de una corrida ya serializada
function auditar(corrida, datos, config, objetivos) {
  const ix = indice(datos);
  const divergencias = [], silenciosas = [], ejeCorto = [], huecosEje = [], minimoCorto = [], techoMudo = [];
  let fvConPostre = 0;                              // §6.9 · el MISMO eje contando el postre
  const miembros = Object.fromEntries(corrida.familia.miembros.map(m => [m.id, m]));
  const anclas = new Set((corrida.familia.anclas || []).map(a => `${a.dia}-${a.servicio}:${a.elaboracion_id}`));
  const tomasPorSemana = {};

  // ── EL DENOMINADOR DEL PRORRATEO (§10.7) · slots GOBERNADOS donde el miembro está presente.
  //
  // No es lo mismo «ausente» que «no gobernado», y confundirlos rompía el gate de §14.6. Una
  // familia que solo gobierna las 7 cenas —come fuera el resto— tiene a todos sus miembros
  // PRESENTES en los 14 slots: nadie falta, es la app la que no manda en 7 de ellos, y salen
  // marcados `no_servido: 'no-gobernado'`. Prorratear por `sem.presencia` le exigía la cuota
  // semanal entera a media semana de gobierno y llamaba «mínimo corto sin declarar» a lo que el
  // motor había cumplido: medido sobre la parrilla, **28 de los 52 mudos eran esto, todos de
  // `presencia-7-14`**. El prevuelo ya usa este denominador (`prevuelo.js` §bandasEfectivas,
  // `factor = slotsPresente.length / 14` sobre los slots ACTIVOS), así que el juez estaba
  // midiendo contra una banda que el motor nunca tuvo — dos varas para el mismo número.
  //
  // Se lee de `corrida.familia.gobierno`, que ya viaja en el formato serializado. Sin `gobierno`
  // el denominador son los 14 slots, que es el caso de las otras once familias de la parrilla.
  const SLOTS_SEMANA = [];
  for (let d = 1; d <= 7; d++) for (const s of ['comida', 'cena']) SLOTS_SEMANA.push(`${d}-${s}`);
  const gobernados = corrida.familia.gobierno ? new Set(corrida.familia.gobierno) : new Set(SLOTS_SEMANA);
  const serviciosGobernados = (sem, mid) =>
    SLOTS_SEMANA.filter(s => gobernados.has(s) && (sem.presencia[mid] || {})[s] === true).length;

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

        // ejes en gramos, sobre el PLATO en la ración BASE de su tramo (fracción 1).
        //
        // La fracción de T3 ajusta ENERGÍA, no composición: quien come al 45% por su gasto come
        // también menos verdura, y medir el eje después de la fracción convertiría este gate en
        // un gate de energía disfrazado. Son dos capas y la spec las mantiene separadas. Si se
        // decidiera lo contrario, basta pasar `fraccion` aquí en vez de 1.
        //
        // ⚑ 6-ago · ÁMBITO 'plato', NO 'servicio' (§6.9: «la fruta del postre no exime del eje
        // fruta-verdura del plato»). Hasta hoy `composicion()` devolvía `plato.concat([postre])`
        // y el eje se medía sobre la bolsa entera, así que un plato flojo de verdura pasaba si
        // de postre había macedonia. Medido antes de corregirlo, por dos vías independientes que
        // dan lo mismo: 3 servicios-miembro cubrían el eje SÓLO gracias al postre
        // (`asado-horno` + `postre-fruta`: el plato daba 0,23 raciones y el postre lo subía a
        // 1,17). Sobre el eje hidrato el efecto era 0.
        // ⚠️ El postre NO desaparece de la contabilidad: sigue contando en las cuotas, en los
        // techos de salud y en la energía, que se miden sobre `lineas` (ámbito 'servicio', unas
        // líneas más abajo). Es dictado explícito de Roger, 6-ago: «no cuentan como verdura del
        // plato PERO sí suman en las calorías totales del menú».
        const lineasBase = lineasServidas(ix, sv, mid, esNino, 1, 'plato');
        // …y la MISMA medida con el postre dentro, publicada al lado. No es redundancia: es la
        // única forma de que la diferencia entre las dos siga siendo visible sin volver a
        // fabricar una vista. Mientras `eje_fv_corto` < `eje_fv_corto_con_postre`, hay platos que
        // sólo llegan a la verdura por el postre — y ésos son los que §6.9 no perdona.
        // (Pedido del controlador de la obra, 6-ago.)
        const lineasConPostre = lineasServidas(ix, sv, mid, esNino, 1, 'servicio');
        // ⚑ 6-ago · LOS TRES EJES, no dos (§6.4: «todo servicio debe cubrir tres ejes para cada
        // presente: proteína, hidrato y fruta-verdura», medidos en gramos «nunca por etiqueta»).
        // El de proteína no se auditaba y el motivo escrito en `ejes.js:39-41` era que su suelo
        // real es el proteico de T3. ESA DEFENSA ESTÁ REFUTADA CON NÚMERO, medido sobre la
        // parrilla (12 familias × 4 semanas, 2.240 servicios-miembro,
        // `harness/herramientas/ejes_del_plato.js`): de los 309 cortos de eje de proteína, el
        // suelo proteico sólo ve 20 — no ve 289 —, y en la otra dirección hay 56 servicios que
        // cubren el eje y aun así caen bajo el suelo. Son dos medidas distintas y ninguna
        // sustituye a la otra.
        for (const eje of ['fruta-verdura', 'hidrato', 'proteina']) {
          const d = cubreEje(lineasBase, { edad: obj.edad }, eje, datos, config);
          if (d.huecos.length) for (const h of d.huecos)
            huecosEje.push({ semana: sem.semana_iso, slot: `${sv.dia}-${sv.servicio}`, miembro: mid,
              eje, alimento: h.alimento, gramos: Math.round(h.gramos), motivo: h.hueco });
          if (!d.cubre)
            ejeCorto.push({ semana: sem.semana_iso, slot: `${sv.dia}-${sv.servicio}`, miembro: mid,
              tipo: `eje-${eje}-corto`,
              detalle: `${d.fraccion.toFixed(2)} raciones < ${d.umbral} (media ración de su tramo)`
                + (d.huecos.length ? ` · ${d.huecos.length} línea(s) sin ración en el banco` : '') });
        }
        // la contramedida de §6.9, publicada al lado y NUNCA como gate: el mismo eje de
        // fruta-verdura contando el postre. La distancia entre los dos números es cuántos platos
        // sólo llegan a la verdura por el postre.
        if (!cubreEje(lineasConPostre, { edad: obj.edad }, 'fruta-verdura', datos, config).cubre) fvConPostre++;

        const prot = lineas.reduce((s, l) => s + protDeLinea(ix, l), 0);
        const sueloSv = obj.suelo_proteina_dia * reparto;
        if (prot < sueloSv - 1e-6 && !tiposDescargo.has('suelo-proteico')) {
          silenciosas.push({ semana: sem.semana_iso, slot: `${sv.dia}-${sv.servicio}`, miembro: mid,
            tipo: 'suelo-proteico-sin-descargo',
            detalle: `${prot.toFixed(1)} g < ${sueloSv.toFixed(1)} g y el servicio no lo declara` });
        }

        // tomas y gramos de salud, con RECORRIDO propio y METRO compartido.
        //
        // ⚑ 3-ago (fila 4.5): AQUÍ YA NO SE MIRA `papel === 'condimento'`. Era una ETIQUETA
        // eximiendo de contar, y este proyecto ya mató una vez esa figura (`aporte`): «toda
        // etiqueta que gobierne una decisión del motor debe ser derivable desde gramos». Medido
        // el 3-ago sobre el banco: de 58 líneas de condimento, **una** cae en cubo de cuota —
        // `jamon-serrano` 40 g en `huevos-rotos-jamon`, que son 0,8 raciones de carne procesada
        // que ni consumían cuota ni tocaban el techo de salud. Un techo de salud es ABSOLUTO
        // (spec §4): no existe «demasiado poco para contar», existe el gramo.
        // Y no hace falta ningún umbral nuevo: para las TOMAS ya filtra `TOMA_MIN_FRACCION`
        // (los 10 g de limón son 0,06 raciones y no cuentan solos), y para los TECHOS cuenta
        // todo. El condimento sigue SIN cerrar ejes —eso lo protege `cubreEje`— que es por
        // donde volvería la hamburguesa sola: la asimetría es la que declara el encabezado de
        // `categorias_aesan` («los mínimos, el gramo del eje; los techos, todo gramo»).
        //
        // ⚑ 4-ago (fila 5.4): el bucle que vivía aquí —CUBOS_DE propio, `racionPropia` propia,
        // umbral aplicado a mano— pasa a `src/cuotas.js`. NO se pierde independencia: lo que se
        // comparte es la DEFINICIÓN de la unidad (qué cubo alimenta qué, cuántos gramos son una
        // ración de ese comensal, qué umbral hace una toma), y lo propio sigue siendo el
        // RECORRIDO — `lineasServidas` de este mismo fichero, con su composición, sus sustitutos
        // y su opción elegida. Es la misma frontera que ya se cruzó con `ejes.js` el 3-ago, y el
        // motivo es el mismo: T4 conservaba una vara y T2 otra, y de ahí salía 5.4.
        const q = cuotaDeServicio(lineas, { edad: obj.edad }, datos, config);
        for (const c of Object.keys(q.tomas))
          ((tomas[mid] = tomas[mid] || {})[c] = (tomas[mid][c] || 0) + q.tomas[c]);
        for (const [cat, g] of Object.entries(q.gramosSalud))
          ((saludG[mid] = saludG[mid] || {})[cat] = (saludG[mid][cat] || 0) + g);
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

    // 4 · MÍNIMOS DE FRECUENCIA con recuento propio (5.4, 4-ago).
    //
    // POR QUÉ ES NUEVO Y POR QUÉ ES INFORMATIVO. Hasta hoy T4 no miraba los mínimos: no podía,
    // porque T2 los contaba en fracciones de ración y «corto» significaba cosas distintas a cada
    // lado. Ahora los dos cuentan TOMAS y la comparación por fin significa algo.
    //
    // ⚑ EL NÚMERO DE ESTE COMENTARIO ESTABA CADUCADO Y SE CORRIGE MIDIENDO (5-ago, sesión 3).
    // Decía «71 mínimos cortos sin que nadie lo declare»; luego se heredó como 47. Los dos
    // contaban de más: el denominador de arriba era la PRESENCIA y no los servicios GOBERNADOS,
    // así que a `presencia-7-14` se le exigía la cuota semanal entera sobre media semana de
    // gobierno. Con el denominador de §10.7 —el mismo que ya usaba el prevuelo— la parrilla da
    // **21 mínimos mudos, y los 21 son de la vara**: T2 los contó cubiertos con la ración de la
    // RECETA y T3 los dejó bajo el umbral. Cero sin causa conocida.
    //   node tests/test_bloque14_no_puede.js  →  21 = 21, y el mutante del denominador da 52
    //
    // El motivo está medido y es de arquitectura, no un descuido de T2: la toma se mide sobre lo
    // SERVIDO (dictado de Roger, 4-ago: «manda T3»), y T2 decide ANTES de que T3 exista. T2
    // cuenta la ración de la receta, T3 la ajusta a la energía de esa persona, y si la deja por
    // debajo de media ración la toma desaparece. Medido: pasa en 93 de 2.002 servicios-miembro
    // (4,6%), y en pescado —el cubo donde quedarse corto duele— en 25 de 587. El sesgo es el
    // seguro en los techos (T2 nunca cuenta MENOS que T4: 0 casos de 115) y el peligroso en los
    // mínimos, que es exactamente esto.
    //
    // Va a `gates_informativos` y NO a `gates` por la misma razón que el eje hidrato: cerrarlo
    // pide que T3 respete un suelo de toma en los cubos con mínimo pendiente —simétrico al que
    // YA tiene para los de salud (`t3_fracciones.js`, que baja la fracción a propósito para que
    // una toma de carne roja no consuma techo)— y eso toca el reparto de energía de §5. Es
    // decisión de Roger y fila propia. Aquí se MIDE y se ENSEÑA: un hueco con número es deuda
    // declarada; sin número es un silencio.
    for (const m of corrida.familia.miembros) {
      const edad = (objetivos[m.id] || {}).edad;
      if (edad == null || edad < 3) continue;
      const tramo = edad < config.EDAD_RACION_ADULTO ? 'nino' : 'adulto';
      const presentes = serviciosGobernados(sem, m.id);
      if (!presentes) continue;
      // ¿alguien de la semana nombró este cubo para este miembro, con un descargo de esta clase?
      // Lo que la semana YA declara no es un silencio: es deuda dicha. Solo cuenta lo que nadie
      // nombró. La clase la elige quien pregunta — mínimos y techos no se declaran igual.
      const declarado = (cubo, clase) => sem.servicios.some(sv => (sv.descargos || []).some(d =>
        d.miembro === m.id && (d.cubo === cubo || (d.detalle || '').includes(cubo)) && clase.test(d.tipo)));

      for (const [cubo, porEdad] of Object.entries(config.CUOTAS)) {
        const [min, max] = porEdad[tramo];
        const real = ((tomas[m.id] || {})[cubo] || 0);

        if (min != null) {
          const minPro = min * presentes / 14;
          if (real < minPro - 1e-9 && !declarado(cubo, /minimo|inalcanzable/))
            minimoCorto.push({ semana: sem.semana_iso, miembro: m.id, cubo,
              tipo: 'minimo-corto-sin-declarar',
              detalle: `${real} de ${minPro.toFixed(1)} tomas — T2 lo contó cubierto con la ración de la receta y T3 la dejó bajo el umbral` });
        }

        // ── EL OTRO LADO DE LA BANDA · TECHOS DE FRECUENCIA (5-ago, sesión 3, bloque 14).
        //
        // Hasta hoy el juez solo miraba los mínimos, y §13.6 dice que T4 «recuenta CUOTAS»: un
        // techo es una cuota. Un juez que mira media banda no es el juez que la ley describe, y
        // §14.6 es binario sobre TODO lo que se cede. Ceder un techo es legal —§13.12: se sirve
        // el menos malo y **se le dice a la familia**— y por eso lo que se audita no es la
        // cesión, es el SILENCIO.
        //
        // El denominador es el mismo de §10.7 desde el primer día: sin él, a una familia de
        // gobierno parcial se le concede el techo semanal entero sobre media semana, que es el
        // error simétrico al de los mínimos y va hacia el lado PERMISIVO — el peligroso en un
        // techo. Medido al construirlo: las cesiones pasan de 36 a 40 al corregir el
        // denominador, y las 4 nuevas son `presencia-7-14`/`carne-total`, **las 4 ya declaradas
        // por el motor**: T2 las vetaba con la banda prorrateada del prevuelo y el único que no
        // las veía era el juez.
        if (max != null) {
          const maxPro = max * presentes / 14;
          if (real > maxPro + 1e-9 && !declarado(cubo, /techo|ancla-vs/))
            techoMudo.push({ semana: sem.semana_iso, miembro: m.id, cubo,
              tipo: 'techo-cedido-sin-declarar',
              detalle: `${real} de ${maxPro.toFixed(1)} tomas de techo y ningún descargo lo nombra (recuento independiente)` });
        }
      }
    }
  }

  const cortos = eje => ejeCorto.filter(e => e.tipo === `eje-${eje}-corto`).length;
  // ⚑ DOS GATES DE EJE, NO UNO — decisión declarada del 3-ago (fila 4.1), NO un descuido:
  //  · `ejes_cubiertos_en_gramos` es el gate que ya existía y solo mide FRUTA-VERDURA. Sigue
  //    significando exactamente lo mismo que el 2-ago (verificado: veredicto idéntico servicio a
  //    servicio con la vara vieja y con la nueva) y sigue verde. Es el que cablea el pipeline.
  //  · `eje_hidrato_cubierto` es NUEVO: hasta el 3-ago el hidrato no era medible porque el banco
  //    no tenía ración de cereal ni de tuberculo. Hoy sí, y lo primero que la medida dice es que
  //    **181 de 644 servicios de la parrilla se quedan entre 0,25 y 0,50 raciones** — ninguno a
  //    cero: los platos SÍ llevan hidrato, no llega a media ración. Convertirlo en bloqueo
  //    reescribiría un cuarto de los menús por un umbral que nadie ha aprobado, así que se MIDE
  //    y se REPORTA, y la decisión (D1 de la lista: ¿media ración por servicio o ración completa
  //    por día? ¿y la ración de la sopa es la del plato principal?) es de Roger.
  //    Un gate rojo que se apaga solo no vale: por eso está en `gates`, a la vista, no escondido.
  const gates = { relajaciones_silenciosas_cero: silenciosas.length === 0,
    ejes_cubiertos_en_gramos: cortos('fruta-verdura') === 0,
    techos_salud_respetados: divergencias.filter(d => d.tipo === 'techo-salud-superado').length === 0,
    // §14.6 es binario y el techo es cuota (§13.6): ceder está permitido, callarlo no. Va a
    // `gates` y no a informativos porque no depende de ninguna decisión pendiente — hoy es 0.
    techos_de_frecuencia_declarados: techoMudo.length === 0 };
  //  · `eje_proteina_cubierto` es NUEVO (6-ago) y nace INFORMATIVO, no bloqueante, por la misma
  //    razón que el hidrato y por una propia. La propia: de los 309 cortos medidos, **171 son
  //    hueco de BANCO ya fichado** —tofu 85, tempeh 37, heura 34, soja-texturizada 15, los cinco
  //    de proteína alternativa que tienen fila D1 y `racion_ref_g` null (§15.2)—, y un hueco de
  //    banco no es una deficiencia: es la siguiente alta. Un gate bloqueante ahí pondría el árbol
  //    a defender justo lo que hay que arreglar en el banco. Los otros **138 sí son del plato**:
  //    la elaboración DECLARA el eje `proteina` en su campo `ejes` y la opción realmente servida
  //    no aporta un gramo de categoría proteica — `risotto`→champiñones 123, `pizza-casera` 11,
  //    `fajita-vegetal` 4. Eso es cobertura por ETIQUETA, que es lo que §6.4 prohíbe con todas
  //    las letras. Se MIDE y se REPORTA a la vista; cerrarlo es alta de banco (los 171) más
  //    revisión del campo `ejes` de tres elaboraciones (los 138), y ninguna de las dos cosas se
  //    hace desde el juez.
  const gatesInformativos = { eje_hidrato_cubierto: cortos('hidrato') === 0,
    eje_proteina_cubierto: cortos('proteina') === 0,
    minimos_de_frecuencia_cubiertos: minimoCorto.length === 0 };
  return { tiempo: 'T4', gates, gates_informativos: gatesInformativos,
    ok: Object.values(gates).every(Boolean),
    metricas: { silenciosas: silenciosas.length, divergencias: divergencias.length,
      eje_fv_corto: cortos('fruta-verdura'), eje_hidrato_corto: cortos('hidrato'),
      eje_proteina_corto: cortos('proteina'),
      // §6.9 · la contramedida: el eje de fruta-verdura contando el postre. `eje_fv_corto` es el
      // que manda (la ley dice que el postre no exime); éste sólo existe para que la diferencia
      // entre los dos —los platos que sólo llegan a la verdura por el postre— siga siendo visible.
      eje_fv_corto_con_postre: fvConPostre,
      // huecos = líneas cuyo alimento no tiene ración en el banco (o la tiene en otra base): no
      // son incumplimientos, son dato que falta. Se cuentan aparte para que un gate verde nunca
      // pueda estarlo PORQUE no se midió (§«un gate puede estar verde POR el ruido»).
      eje_huecos: huecosEje.length, minimo_corto: minimoCorto.length, techo_mudo: techoMudo.length },
    // recuento propio de tomas, expuesto para contrastarlo contra el de la batería A: si las dos
    // implementaciones difieren, una de las dos tiene un bug — que es justo lo que T4 busca
    tomas: tomasPorSemana,
    silenciosas: silenciosas.slice(0, 50), divergencias: divergencias.slice(0, 50),
    eje_corto: ejeCorto.slice(0, 50), eje_huecos: huecosEje.slice(0, 50),
    minimo_corto: minimoCorto.slice(0, 50), techo_mudo: techoMudo.slice(0, 50) };
}

module.exports = { auditar };

  };

  /* ---- motor_v6/src/ventana_movil.js ---- */
  REG['ventana_movil'] = function (module, exports, require) {
// VENTANA MÓVIL · los techos de D2 que la fuente publica POR MES, no por semana (fila 5.5).
//
// ── QUÉ ARREGLA
// De las 25 reglas de `seguridad_infantil` (D2), dos no se aplicaban en ninguna parte del motor:
// las que traen `limite_g_dia`. `derivar.js` y `prevuelo.js` las SALTAN explícitamente
// (`if (f.limite_g_dia != null || f.condicion != null) continue`) porque no son prohibiciones
// puras, y la única implementación viva —la batería E del harness— las acumula POR DÍA. Por día
// el límite del atún son 4 g, así que una lata de 120 g en la ensalada del martes salía como
// violación y 120 g cada semana durante un mes salían como cuatro violaciones de un día cada
// una, cuando la fuente dice exactamente lo contrario:
//
//   AESAN AI22, tramo 10-14 años: **120 g de atún al MES**. El `4` del banco es ese 120 partido
//   por 30 —lo dice su propia nota: «se expresa como 4 g/día equivalentes para que el contador
//   diario pueda acumularlo en ventana móvil de 30 días»— y **copiar ese 4 sin copiar su ventana
//   es el mismo bug que 5.4**: el número de la fuente sin su unidad. Aquí la unidad es el mes.
//
// Un mes no cabe en una semana, que es la única memoria que T2 tiene viva. Por eso el contador
// arranca del DIARIO (D3): lo servido en los 30 días anteriores es un hecho registrado, y sobre
// él se sigue acumulando lo que la semana en curso vaya sirviendo.
//
// ── POR QUÉ NO ES UNA CUOTA MÁS
// `config.CUOTAS` son bandas SEMANALES en tomas y las gobierna `cuotas.js`. Esto es otra cosa:
// un techo de SEGURIDAD, en gramos, con ventana propia y por alimento (no por cubo AESAN), que
// vive en el banco (`seguridad_infantil`) y no en `config`. Mezclarlos habría metido un techo de
// mes en una banda de semana, que es justo la clase de conversión que este proyecto ya paga dos
// veces. Mismo motivo por el que tampoco hereda el `TOMA_MIN_FRACCION`: aquí cuenta todo gramo,
// como en los techos de salud (fila 4.5).
//
// ── LO QUE ESTE TECHO MIDE, Y LO QUE NO
// Cuenta los gramos de la PLANTILLA (receta × escala × fracción del servicio), que es la vara
// con la que T2 decide. Los `ajustes_linea` finos de T3 —que llegan después— pueden mover esos
// gramos por energía, así que un servicio justo en el borde puede acabar servido por encima.
// Es la misma frontera T2-prevé / T3-sirve que 5.4 resolvió en las cuotas con `peorCaso`, y aquí
// NO se ha replicado: hacerlo pide saber cuánto puede moverla T3 en cada línea, que hoy solo
// está declarado para las categorías contables. Queda dicho, no escondido.
//
// ── LA APROXIMACIÓN, DECLARADA
// Los gramos del pasado se RE-DERIVAN del banco (`banco_generacion`) sobre receta × escala ×
// fracción, que es exactamente lo que el diario está diseñado para permitir (D3 §2: «ni macros
// ni kcal; se recalculan del banco»). Lo que el diario no guarda son los `ajustes_linea` finos
// de T3, así que un ajuste energético sobre una línea de atún no se refleja en el pasado. Se
// declara aquí en vez de esconderlo: la desviación es la de un ajuste de energía sobre una
// línea, no la de una ración entera, y el diario no puede dar más sin duplicar la verdad.
'use strict';

// reglas con techo por ventana, indexadas por alimento. `edad_max_anos` es EXCLUYENTE (mismo
// criterio que la batería E: con esa edad cumplida la regla ya no aplica).
function reglasDeVentana(datos) {
  const out = {};
  for (const f of datos.seguridad_infantil || []) {
    if (f.limite_g_dia == null || f.condicion != null) continue;
    (out[f.alimento_id] = out[f.alimento_id] || []).push(f);
  }
  return out;
}

// ¿cuántos gramos de los alimentos vigilados lleva ya cada miembro dentro de la ventana?
// `diario` = D3 · `hasta` = Date del primer día de la semana que se está generando.
// Devuelve { mid: { alimento_id: gramos } }. Los servicios `servido: false` NO cuentan (D3 §3)
// y los ausentes tampoco (no existe para cuotas quien no estaba).
function acumuladoPrevio(diario, datos, config, edades, hasta, fechaDia) {
  const reglas = reglasDeVentana(datos);
  const vigilados = new Set(Object.keys(reglas));
  const acc = {};
  if (!vigilados.size || !diario || !Array.isArray(diario.servicios)) return acc;
  // cada regla trae SU ventana (`ventana_dias`): el atún es de mes y los nitratos de día. Se
  // resuelve por alimento y no con una ventana global, porque una ventana global es justo la
  // conversión que este fichero existe para no volver a hacer.
  const ventanaDe = aid => Math.max(...(reglas[aid] || [{}]).map(r => r.ventana_dias || 1));
  const desdeDe = aid => new Date(hasta.getTime() - ventanaDe(aid) * 86400000);
  const lineasDe = {};
  for (const l of datos.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);
  const planas = {};
  const lineasPlanas = id => {
    if (planas[id]) return planas[id];
    const out = [];
    const rec = (padre, escala, visto) => {
      if (visto.has(padre)) return;
      visto.add(padre);
      for (const l of lineasDe[padre] || []) {
        if (l.componente_id) { rec(l.componente_id, escala * (l.escala_adulto || 1), visto); continue; }
        out.push({ ...l, escala });
      }
    };
    rec(id, 1, new Set());
    return planas[id] = out;
  };

  for (const s of diario.servicios) {
    if (s.servido === false || !s.fecha) continue;
    const f = new Date(s.fecha + 'T00:00:00Z');
    if (!(f < hasta)) continue;
    const notas = s.notas || [];
    for (const mid of s.presentes || []) {
      const edad = edades[mid];
      if (edad == null) continue;
      const esNino = edad < config.EDAD_RACION_ADULTO;
      const fr = (s.fracciones && s.fracciones[mid] != null) ? s.fracciones[mid] : 1;
      // composición REAL del comensal, con las mismas reglas que el juez (`t4_auditoria.js`
      // §composicion): su sustituto manda sobre el plato de mesa, el `solo-para` que no le nombra
      // lo deja fuera, y `eliminar` le quita la línea. Un diario ANTERIOR a este campo no trae
      // `notas` y entonces se cuenta el plato entero: sesgo hacia contar de más, que en un techo
      // de seguridad es el único lado aceptable.
      const sust = {};
      for (const n of notas) if (n.tipo === 'sustituto' && n.miembro === mid) sust[n.ambito] = n;
      const fuera = new Set();
      for (const n of notas) if (n.tipo === 'solo-para' && !n.miembros.includes(mid)) fuera.add(n.elaboracion_id);
      const quitar = new Set();
      for (const n of notas) if (n.tipo === 'eliminar' && (n.miembro === mid || n.miembro === '*')) quitar.add(n.alimento_id);
      const plato = sust.plato ? sust.plato.plato : (s.plato || []).filter(p => !fuera.has(p.elaboracion_id));
      const postre = sust.postre ? sust.postre.postre : s.postre;
      const piezas = postre ? plato.concat([postre]) : plato;
      for (const pe of piezas) {
        for (const l of lineasPlanas(pe.elaboracion_id)) {
          const aid = Array.isArray(l.alternativas)
            ? (pe.opciones_eje && (pe.opciones_eje[mid] || pe.opciones_eje['*'])) : l.alimento_id;
          if (!aid || !vigilados.has(aid) || quitar.has(aid)) continue;
          if (f < desdeDe(aid)) continue;                       // fuera de LA ventana de ESE alimento
          if (!reglas[aid].some(r => r.edad_max_anos == null || edad < r.edad_max_anos)) continue;
          const g = ((esNino ? l.gramos_nino : l.gramos_adulto) || 0) * (l.escala || 1) * fr;
          (acc[mid] = acc[mid] || {})[aid] = (acc[mid][aid] || 0) + g;
        }
      }
    }
  }
  return acc;
}

// El techo de la ventana para (alimento × edad): el más restrictivo de las reglas que le aplican.
// null = ninguna regla vigente para ese comensal (ya tiene la edad, o el alimento no se vigila).
function techoVentana(reglas, alimentoId, edad) {
  const fs = (reglas[alimentoId] || []).filter(r => r.edad_max_anos == null || edad < r.edad_max_anos);
  if (!fs.length) return null;
  return Math.min(...fs.map(r => r.limite_g_dia * (r.ventana_dias || 1)));
}

// ── TOMAS YA SERVIDAS DE UN CUBO DENTRO DE UNA VENTANA DE DÍAS (§20.39, 4-ago-2026)
//
// ── QUÉ ARREGLA
// AC25 publica la carne procesada de un menor como **≤2 al MES**. En `config.CUOTAS` estaba
// escrita como `2/4` — el mes repartido a semana— y el propio funcional lo marcaba como aviso:
// «no puede cumplirse: no existe media ración, y cualquier ración de un menor lo supera». Es
// literalmente el bug que este fichero existe para no repetir: copiar el número de la fuente sin
// copiar su PERIODO. Medido el 4-ago sobre la parrilla, con el techo semanal de 0,5: **19 de 164
// veredictos de semana** por encima del techo, todos por el mismo motivo aritmético.
//
// ── POR QUÉ NO ES `acumuladoPrevio`
// Aquella cuenta GRAMOS de un ALIMENTO vigilado por `seguridad_infantil`. Ésta cuenta TOMAS de un
// CUBO de `config.CUOTAS`. Misma ventana, otra moneda y otro sujeto (§10.3: los tres niveles no
// se convierten entre sí). Comparten el diario D3 y la vara del día, que es lo único que deben
// compartir. La toma se decide con `cuotaDeServicio`, la definición única (§13.11).
function tomasPreviasDeCubo(diario, datos, config, edades, hasta, cubos, ventanaDias, cuotaDeServicio) {
  const acc = {};
  if (!diario || !Array.isArray(diario.servicios) || !cubos.length) return acc;
  const desde = new Date(hasta.getTime() - ventanaDias * 86400000);
  const lineasDe = {};
  for (const l of datos.lineas) (lineasDe[l.padre] = lineasDe[l.padre] || []).push(l);
  const planas = {};
  const lineasPlanas = (id, esNino) => {
    const k = `${id}|${esNino}`;
    if (planas[k]) return planas[k];
    const out = [];
    const rec = (padre, escala, visto) => {
      if (visto.has(padre)) return;
      visto.add(padre);
      for (const l of lineasDe[padre] || []) {
        if (l.componente_id) { rec(l.componente_id, escala * ((esNino ? l.escala_nino : l.escala_adulto) || 1), visto); continue; }
        out.push({ ...l, escala });
      }
    };
    rec(id, 1, new Set());
    return planas[k] = out;
  };
  for (const s of diario.servicios) {
    if (s.servido === false || !s.fecha) continue;
    const f = new Date(s.fecha + 'T00:00:00Z');
    if (!(f < hasta) || f < desde) continue;
    const notas = s.notas || [];
    for (const mid of s.presentes || []) {
      const edad = edades[mid];
      if (edad == null) continue;
      const esNino = edad < config.EDAD_RACION_ADULTO;
      const fr = (s.fracciones && s.fracciones[mid] != null) ? s.fracciones[mid] : 1;
      // misma composición individual que el juez (`t4_auditoria.js` §composicion)
      const sust = {};
      for (const n of notas) if (n.tipo === 'sustituto' && n.miembro === mid) sust[n.ambito] = n;
      const fuera = new Set();
      for (const n of notas) if (n.tipo === 'solo-para' && !n.miembros.includes(mid)) fuera.add(n.elaboracion_id);
      const quitar = new Set();
      for (const n of notas) if (n.tipo === 'eliminar' && (n.miembro === mid || n.miembro === '*')) quitar.add(n.alimento_id);
      const plato = sust.plato ? sust.plato.plato : (s.plato || []).filter(p => !fuera.has(p.elaboracion_id));
      const postre = sust.postre ? sust.postre.postre : s.postre;
      const lineas = [];
      for (const pe of (postre ? plato.concat([postre]) : plato)) {
        for (const l of lineasPlanas(pe.elaboracion_id, esNino)) {
          const aid = Array.isArray(l.alternativas)
            ? (pe.opciones_eje && (pe.opciones_eje[mid] || pe.opciones_eje['*'])) : l.alimento_id;
          if (!aid || quitar.has(aid)) continue;
          lineas.push({ alimento: aid, elaboracion_id: pe.elaboracion_id,
            gramos: ((esNino ? l.gramos_nino : l.gramos_adulto) || 0) * (l.escala || 1) * fr });
        }
      }
      if (!lineas.length) continue;
      const q = cuotaDeServicio(lineas, { edad }, datos, config);
      for (const cubo of cubos) if (q.tomas[cubo] > 0)
        (acc[mid] = acc[mid] || {})[cubo] = (acc[mid][cubo] || 0) + q.tomas[cubo];
    }
  }
  return acc;
}

module.exports = { reglasDeVentana, acumuladoPrevio, techoVentana, tomasPreviasDeCubo };

  };

  /* ---- hash_banco (precalculado en build; sin crypto en el navegador) ---- */
  REG['hash_banco'] = function (module) {
    module.exports = {
      hashCompleto: function () { return 'ee8d2d756cf03d8e1068822c8addf52891e7dfc0a852357cfaf561d4ed969e6d'; },
      hashGeneracion: function () { return '1a623f5aa08ea7ebdd6f55ef89ba8de598eb16c4b2b65be96c25988d212978f4'; }
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
