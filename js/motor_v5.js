/* ============================================================
   e3Foods — motor_v5.js (GENERADO por _build_banco_v5.js — NO editar a mano)
   Motor v5 para navegador: dietas.js + calculo.js + selector.js + motor.js de bd_v5/ (la unica
   implementacion), concatenados. Requiere data/banco_v5.js cargado antes.
   Regenerar: node _build_banco_v5.js desde 02_APP/.
   ============================================================ */

/* ---- bd_v5/dietas.js ---- */
(function () {
// FUENTE UNICA de las reglas de dieta. Sesion de RESTRICCIONES, 2026-07-29.
//
// MODULO PURO: no imprime, no lee ficheros, no ejecuta nada al cargarse. Por eso vive
// aparte de `_medir_dietas.js`, que es un ejecutable -- si `validar.js` hiciera require
// de aquel, dispararia el informe entero en cada validacion.
//
// Lo consumen:
//   - `_medir_dietas.js`  (medicion del impacto)
//   - `validar.js`        (regla 25: un nombre que afirma una dieta tiene que cumplirla)
//
// POR QUE EXISTE ESTE FICHERO: las constantes estaban duplicadas en los dos sitios. Hoy
// coincidian; el dia que se anada una excepcion -- otra miel, otro producto sin lactosa --
// uno lo sabria y el otro no, y los dos seguirian en verde diciendo cosas distintas.
// Es exactamente la clase de defecto que el validador existe para cazar.
//
// COMO SE AMPLIA: se anade la excepcion AQUI y los dos consumidores la ven. Si anades una
// dieta nueva, anadela a DIETAS y a `motivos()`; el resto se propaga solo.
'use strict';

// --- Derivacion base, de `naturaleza` --------------------------------------
const NO_VEGETARIANA = ['carne', 'pescado', 'marisco'];
const NO_VEGANA = ['carne', 'pescado', 'marisco', 'huevo', 'lacteo'];

// --- Excepciones: donde la derivacion sola se equivoca ----------------------

// Vegano != vegetal. `naturaleza` no distingue el origen animal de un producto que no es
// carne: la miel es `vegetal` y no es vegana. Verificado el 29-jul: de las 26 elaboraciones
// sin ingrediente de naturaleza animal, DOS llevan miel (`berenjenas-miel`, `judias-patata`)
// y un derivado ingenuo las daria por veganas.
// Candidatos a entrar aqui cuando existan: gelatina, cochinilla (E-120), grasa animal,
// salsa Worcestershire (lleva anchoa).
const NO_VEGANO_PESE_A_NATURALEZA = {
  'miel': 'producto de origen animal (abeja), naturaleza vegetal'
};

// Sin lactosa != sin leche. El punto 7 del Anexo II cubre "leche y sus derivados, INCLUIDA
// la lactosa", asi que un producto sin lactosa sigue llevando alergeno `leche` -- y es
// correcto, conserva la proteina. Pero SI vale para un intolerante a la lactosa.
// Derivar de alergenos.includes('leche') excluiria justo los productos hechos para el.
const APTO_SIN_LACTOSA = {
  'leche-sin-lactosa': 'sin lactosa, conserva proteina de leche',
  'yogur-sin-lactosa': 'sin lactosa, conserva proteina de leche'
};

const DIETAS = ['vegetariana', 'vegana', 'sin-gluten', 'sin-lactosa'];

// Compuestos con ingrediente animal que `naturaleza` no ve: la mayonesa es `grasa` y lleva
// huevo. El alergeno declarado SI lo ve, y en este banco es lista de INGREDIENTES reales,
// no de trazas (criterio §4 del alta) -- por eso vale como señal de dieta. Cazado el 30-jul:
// sin esto la mayonesa pasaba por vegana.
const ALERGENO_CARNE_PESCADO = ['pescado', 'crustaceos', 'moluscos'];
const ALERGENO_ANIMAL_INDIRECTO = ['huevo', 'leche'];

// ── Taxonomia de PERFIL de comensal (Roger, 30-jul) — extension para KPI/selector ──────
// Dos niveles: estilo de vida (UNO) + alergias/intolerancias (multiseleccion).
// motivos() y la regla 25 quedan intactos; esto es la pregunta por comensal:
//   vetado(alimento, { estilo: 'vegano', alergias: ['sin-gluten'] }) -> true/false
const ESTILOS = {
  'de-todo':     { nombre: 'De todo' },
  'vegetariano': { nombre: 'Vegetariano (sin carne ni pescado; con lacteos y huevo)' },
  'vegano':      { nombre: 'Vegano (sin ningun producto de origen animal)' },
  // sensibilidad cultural, NO certificacion halal (disclaimer del alta).
  // origen === 'cerdo' da exactamente los 18 alimentos de cerdo (verificado 29-jul).
  'sin-cerdo':   { nombre: 'Sin cerdo (cultural/personal; no certifica halal)' }
};

const ALERGIAS_PERFIL = {
  'sin-gluten':          { alergenos: ['gluten'] },
  // APTO_SIN_LACTOSA manda: leche-sin-lactosa declara `leche` (correcto, Anexo II) y aun asi vale.
  'sin-lactosa':         { alergenos: ['leche'], excepciones: APTO_SIN_LACTOSA },
  'sin-huevo':           { alergenos: ['huevo'] },
  // REGLA DE DIETA del cacahuete: Anexo II le da punto propio (5, es una legumbre) y el punto 8
  // (frutos-cascara) es lista cerrada que no lo incluye. "Sin frutos secos" los veta JUNTOS aqui,
  // como regla de dieta -- nunca tocando los alergenos del alimento. Test del diseño (30-jul).
  'sin-frutos-secos':    { alergenos: ['frutos-cascara', 'cacahuetes'] },
  'sin-pescado-marisco': { alergenos: ['pescado', 'crustaceos', 'moluscos'] },
  // Las rosaceas no son alergeno del Anexo II: se veta por ORIGEN con lista explicita
  // (familia del melocoton -- LTP, la alergia alimentaria n1 del adulto español).
  'sin-rosaceas':        { alergenos: [], origenes: ['melocoton', 'nectarina', 'albaricoque',
                           'cereza', 'ciruela', 'manzana', 'pera', 'fresa', 'almendra', 'membrillo'] }
};

// matching por prefijo en ambos sentidos, como el KPI historico ('gluten' casa 'gluten-trigo')
function casaAlergeno(alergenosAlimento, tag) {
  return (alergenosAlimento || []).some(y => y.indexOf(tag) === 0 || tag.indexOf(y) === 0);
}

function vetadoPorEstilo(a, estilo) {
  const al = a.alergenos || [];
  if (estilo === 'vegetariano' || estilo === 'vegano') {
    if (NO_VEGETARIANA.includes(a.naturaleza)) return true;
    if (ALERGENO_CARNE_PESCADO.some(t => casaAlergeno(al, t))) return true;
  }
  if (estilo === 'vegano') {
    if (NO_VEGANA.includes(a.naturaleza)) return true;
    if (NO_VEGANO_PESE_A_NATURALEZA[a.id]) return true;
    if (ALERGENO_ANIMAL_INDIRECTO.some(t => casaAlergeno(al, t))) return true;
  }
  if (estilo === 'sin-cerdo' && a.origen === 'cerdo') return true;
  return false;
}

function vetado(alimento, perfil) {
  if (!alimento) return true;                       // no existe: no se puede afirmar que es apto
  // VETOS por ingrediente de la ficha de Familia (fix P0-1 auditoría 31-jul, OK Roger): la
  // rejilla de vetos es la exclusion dura que el motor v3 ya consumia y v5 ignoraba. Va AQUI,
  // en la fuente unica, para que selector (sirveAMesa/paresProteina), motor (elecciones) y
  // nevera lo hereden sin reimplementar. Un id que no exista en el banco v5 no casa y es
  // inerte (mismo contrato que gustos — sin remapeo v3→v5).
  if (perfil.vetos && perfil.vetos.indexOf(alimento.id) >= 0) return true;
  if (perfil.estilo && perfil.estilo !== 'de-todo' && vetadoPorEstilo(alimento, perfil.estilo)) return true;
  return (perfil.alergias || []).some(id => {
    const r = ALERGIAS_PERFIL[id];
    if (!r) throw new Error('alergia desconocida: ' + id);
    if (r.excepciones && r.excepciones[alimento.id]) return false;
    if (r.alergenos.some(t => casaAlergeno(alimento.alergenos, t))) return true;
    return !!(r.origenes && r.origenes.includes(alimento.origen));
  });
}

// --- API -------------------------------------------------------------------

// Indice id -> alimento. Se pasa explicitamente en vez de leerlo aqui para que el
// validador pueda usar tanto ./datos como ./fixtures con el mismo codigo.
function indexar(alimentos) {
  const porId = {};
  (alimentos || []).forEach(a => { porId[a.id] = a; });
  return porId;
}

// Dado un conjunto de ids de alimento, devuelve POR DIETA la lista de ids que la
// incumplen. Lista vacia = apto. Devolver los motivos y no un booleano es deliberado:
// un "no es vegana" sin decir por que no se puede depurar ni explicar al usuario.
//
// Un id que no exista en el indice se reporta como `<id>(?)` en todas las dietas: no se
// puede afirmar que algo es apto si no se sabe lo que es. Con tres sesiones tocando el
// banco, un id que desaparece bajo los pies es lo normal, no un imprevisto.
function motivos(ids, porId) {
  const m = {};
  DIETAS.forEach(d => { m[d] = []; });
  for (const id of ids || []) {
    const a = porId[id];
    if (!a) { DIETAS.forEach(d => m[d].push(id + '(?)')); continue; }
    const al = a.alergenos || [];
    // 30-jul: tambien el ingrediente animal escondido en un compuesto (mayonesa -> huevo)
    if (NO_VEGETARIANA.includes(a.naturaleza) ||
        ALERGENO_CARNE_PESCADO.some(t => casaAlergeno(al, t))) m.vegetariana.push(id);
    if (NO_VEGANA.includes(a.naturaleza) || NO_VEGANO_PESE_A_NATURALEZA[id] ||
        ALERGENO_CARNE_PESCADO.some(t => casaAlergeno(al, t)) ||
        ALERGENO_ANIMAL_INDIRECTO.some(t => casaAlergeno(al, t))) m.vegana.push(id);
    if (al.includes('gluten')) m['sin-gluten'].push(id);
    if (al.includes('leche') && !APTO_SIN_LACTOSA[id]) m['sin-lactosa'].push(id);
  }
  return m;
}

// Un nombre que AFIRMA una dieta tiene que cumplirla en TODAS sus opciones (regla 25).
// A diferencia de la aptitud, que es por (elaboracion x opcion) porque eso sostiene la
// mesa mixta, el nombre no admite matices: se lee entero. Es el unico punto del modelo
// donde la elaboracion entera manda, y por eso no choca con el foso del producto.
const AFIRMACIONES = [
  { patron: /vegan/i,          dieta: 'vegana' },
  { patron: /vegetarian/i,     dieta: 'vegetariana' },
  { patron: /sin[- ]gluten/i,  dieta: 'sin-gluten' },
  { patron: /sin[- ]lactosa/i, dieta: 'sin-lactosa' }
];

// Que dietas afirma el texto (id + nombre) de una elaboracion. Vacio = no afirma nada.
// Ojo: `vegetal` NO contiene `vegan`, asi que las 13 elaboraciones del banco con
// "verdura"/"vegetal" en el nombre no disparan. Comprobado, no supuesto.
function dietasAfirmadas(texto) {
  return AFIRMACIONES.filter(a => a.patron.test(texto || '')).map(a => a.dieta);
}

const apiDietas = {
  NO_VEGETARIANA,
  NO_VEGANA,
  NO_VEGANO_PESE_A_NATURALEZA,
  APTO_SIN_LACTOSA,
  DIETAS,
  AFIRMACIONES,
  indexar,
  motivos,
  dietasAfirmadas,
  // extension 30-jul (taxonomia de Roger): perfil de comensal para KPI/selector
  ESTILOS,
  ALERGIAS_PERFIL,
  vetado
};
// dual window/module (sesion motor v5): en navegador via motor_v5.js GENERADO
if (typeof window !== 'undefined') window.E3DietasV5 = apiDietas;
if (typeof module !== 'undefined' && module.exports) module.exports = apiDietas;

})();

/* ---- bd_v5/calculo.js ---- */
(function () {
// CALCULO POR LINEA + NECESIDADES — modulo comun del banco v5. Sesion motor v5 (2026-07-30).
//
// UNICA implementacion de: macros por linea (gramos x factor de coccion x macros/100g),
// energia derivada 4P+4H+9G+2F, Mifflin-St Jeor + bandas por servicio (35/30 entre semana,
// finde 35-40/25-30 como rango), PRI de proteina EFSA 2012, fracciones servibles y suelo
// de racion.
//
// Consumidores (la leccion "una sola implementacion" del selector):
//   - `validar_preparaciones.js`  (la referencia ejecutada contra 6,9 M de combinaciones)
//   - `motor.js`                  (el motor v5: mismos numeros que la referencia, por construccion)
//
// MODULO PURO (contrato de dietas.js): no imprime, no lee ficheros, no ejecuta nada al cargarse.
// El banco entra por parametro (`crearCalculo(datos)`) — en node, bd_v5/datos; en navegador,
// window.E3_BANCO_V5. Dual window/module como recetas.js.
//
// ⚠️ VALORES DE TRABAJO, NO VALIDADOS POR ROGER (29-jul, revision global pendiente junto a los
// platos por UNIDADES/porciones — pizza, tabla): SUELO_PROTEINA_G = 100 (suelo absoluto de la
// pieza de proteina adulta) y FACTOR_PERSONA_MAX = 1.35 (techo 135%). El criterio (suelo en
// gramos, no en porcentaje) SI esta aprobado. No tocar sin Roger.
'use strict';
(function () {

// --- Reparto kcal por servicio — portado de engine.js v3 (REPARTO_KCAL), no reinventado ------
var REPARTO_KCAL = {
  entresemana: { comida: 0.35, cena: 0.30 },
  finde: { comida: { min: 0.35, max: 0.40 }, cena: { min: 0.25, max: 0.30 } }
};
var MARGEN_KCAL_DEFECTO = 0.10;                    // ±10% de trabajo, calibrado en v3
var FACTOR_ACTIVIDAD_MIFFLIN = { baja: 1.2, media: 1.55, alta: 1.725 };
var FACTOR_ACTIVIDAD_BANDA = { baja: 1.0, media: 1.2, alta: 1.4 };
var EDAD_MENOR = 12;
var FACTOR_PERSONA_MIN = 0.75, FACTOR_PERSONA_MAX = 1.35;   // techo 1.35: valor de trabajo (ver cabecera)
var SUELO_PROTEINA_G = 100;                                 // valor de trabajo (ver cabecera)
var FACTOR_MIN_ABSOLUTO = 0.50;                             // media racion — "media pizza" (Roger 29-jul)
var MACROS = ['proteina', 'hidratos', 'grasa', 'fibra'];

// Las fracciones que una persona SIRVE de verdad (validar_preparaciones, 29-jul): un factor de
// 0,52 no se le dice a nadie; "media racion" si.
var FRACCIONES = [
  { f: 1 / 2, texto: 'media racion' },
  { f: 5 / 8, texto: '5/8 de racion' },
  { f: 2 / 3, texto: 'dos tercios de racion' },
  { f: 3 / 4, texto: 'tres cuartos de racion' },
  { f: 7 / 8, texto: '7/8 de racion' },
  { f: 1, texto: 'racion completa' },
  { f: 9 / 8, texto: 'racion y un octavo' },
  { f: 5 / 4, texto: 'racion y cuarto' },
  { f: 4 / 3, texto: 'racion y un tercio' }
];

// Posiciones de la banda de guarnicion (0 = minimo, 0.5 = por defecto, 1 = maximo) — el eje
// independiente de la fraccion: aqui se mueve UN ingrediente, alli la receta entera.
var POSICIONES = [
  { pos: 0.5, etiqueta: 'sin tocar nada' },
  { pos: 0.25, etiqueta: 'con la guarnicion algo mas corta' },
  { pos: 0.75, etiqueta: 'con la guarnicion algo mas larga' },
  { pos: 0.0, etiqueta: 'TENSIONADO: guarnicion al minimo' },
  { pos: 1.0, etiqueta: 'TENSIONADO: guarnicion al maximo' }
];

// --- Necesidades por persona — portadas de engine.js v3 -------------------------------------
function edadDe(miembro, fechaISO) {
  if (!miembro.anioNacimiento) return 30;
  return parseInt(String(fechaISO).slice(0, 4), 10) - miembro.anioNacimiento;
}

// Mifflin-St Jeor con los defaults de actividad por edad y el objetivo 'perdida' del motor v3
// (necesidadKcalDia, portada tal cual — los menores nunca llevan deficit).
function kcalDia(miembro, fechaISO) {
  var edad = edadDe(miembro, fechaISO);
  var sexo = miembro.sexo || 'mujer';
  var esMenor = edad < EDAD_MENOR;
  var actividad = miembro.actividad || (esMenor ? 'media' : 'baja');
  var kcal;
  if (!esMenor && miembro.peso && miembro.altura) {
    var bmr = 10 * miembro.peso + 6.25 * miembro.altura - 5 * edad + (sexo === 'hombre' ? 5 : -161);
    kcal = Math.round(bmr * (FACTOR_ACTIVIDAD_MIFFLIN[actividad] || FACTOR_ACTIVIDAD_MIFFLIN.media));
  } else {
    var base;
    if (edad < 4) base = 1000;
    else if (edad < 9) base = 1200;
    else if (edad < 14) base = sexo === 'hombre' ? 1600 : 1400;
    else if (edad < 19) base = sexo === 'hombre' ? 2000 : 1800;
    else if (edad < 31) base = sexo === 'hombre' ? 2400 : 2000;
    else if (edad < 51) base = sexo === 'hombre' ? 2200 : 1800;
    else if (edad < 71) base = sexo === 'hombre' ? 2000 : 1600;
    else base = sexo === 'hombre' ? 1800 : 1600;
    kcal = Math.round(base * (FACTOR_ACTIVIDAD_BANDA[actividad] || FACTOR_ACTIVIDAD_BANDA.media));
  }
  if (!esMenor && miembro.objetivo === 'perdida') return Math.max(1200, kcal - 500);
  return kcal;
}

// PRI de proteina — EFSA 2012 Tabla 11 (la que adopta AESAN). Tabla completa del motor v3.
var PRI_PROTEINA = [
  { edad: 0.5, gkg: 1.31, gd_m: 10, gd_f: 10 }, { edad: 1, gkg: 1.14, gd_m: 11, gd_f: 11 },
  { edad: 2, gkg: 0.97, gd_m: 12, gd_f: 12 }, { edad: 3, gkg: 0.90, gd_m: 14, gd_f: 13 },
  { edad: 4, gkg: 0.86, gd_m: 15, gd_f: 15 }, { edad: 5, gkg: 0.85, gd_m: 17, gd_f: 17 },
  { edad: 6, gkg: 0.89, gd_m: 20, gd_f: 19 }, { edad: 7, gkg: 0.91, gd_m: 22, gd_f: 22 },
  { edad: 8, gkg: 0.92, gd_m: 25, gd_f: 25 }, { edad: 9, gkg: 0.92, gd_m: 28, gd_f: 28 },
  { edad: 10, gkg: 0.91, gd_m: 30, gd_f: 31 }, { edad: 11, gkg: 0.905, gd_m: 33, gd_f: 34 },
  { edad: 12, gkg: 0.895, gd_m: 37, gd_f: 38 }, { edad: 13, gkg: 0.89, gd_m: 42, gd_f: 42 },
  { edad: 14, gkg: 0.88, gd_m: 47, gd_f: 44 }, { edad: 15, gkg: 0.865, gd_m: 51, gd_f: 45 },
  { edad: 16, gkg: 0.855, gd_m: 54, gd_f: 45 }, { edad: 17, gkg: 0.845, gd_m: 55, gd_f: 45 },
  { edad: 18, gkg: 0.83, gd_m: 62, gd_f: 52 }
];
function priDia(miembro, fechaISO) {
  var edad = edadDe(miembro, fechaISO);
  var fila = PRI_PROTEINA[0];
  for (var i = 0; i < PRI_PROTEINA.length; i++) if (edad >= PRI_PROTEINA[i].edad) fila = PRI_PROTEINA[i];
  if (miembro.peso) return fila.gkg * miembro.peso;
  return (miembro.sexo || 'mujer') === 'hombre' ? fila.gd_m : fila.gd_f;
}

// Banda kcal de UNA persona para un servicio. SIN redondear (floats): la referencia ejecutada
// (validar_preparaciones) compara contra la banda cruda, y redondear los extremos moveria casos
// limite. `objetivo` del finde = punto medio del rango, como en la referencia.
function bandaPersona(miembro, tipoComida, esFinde, fechaISO, margen) {
  margen = margen == null ? MARGEN_KCAL_DEFECTO : margen;
  var kd = kcalDia(miembro, fechaISO);
  if (esFinde) {
    var rf = REPARTO_KCAL.finde[tipoComida];
    return { min: kd * rf.min * (1 - margen), max: kd * rf.max * (1 + margen), objetivo: kd * (rf.min + rf.max) / 2 };
  }
  var objetivo = kd * REPARTO_KCAL.entresemana[tipoComida];
  return { min: objetivo * (1 - margen), max: objetivo * (1 + margen), objetivo: objetivo };
}

// Banda AGREGADA de mesa (v3 §14.1): suma de minimos, suma de maximos — nunca un check
// por-persona sobre el mismo menu fisico.
function bandaMesa(presentes, tipoComida, esFinde, fechaISO, margen) {
  var min = 0, max = 0;
  (presentes || []).forEach(function (m) {
    var b = bandaPersona(m, tipoComida, esFinde, fechaISO, margen);
    min += b.min; max += b.max;
  });
  return { min: min, max: max };
}

// Suelo de proteina del servicio: PRI diario x reparto del slot (finde: extremo bajo, conservador).
function sueloProteina(miembro, tipoComida, esFinde, fechaISO) {
  var r = esFinde ? REPARTO_KCAL.finde[tipoComida].min : REPARTO_KCAL.entresemana[tipoComida];
  return priDia(miembro, fechaISO) * r;
}

function kcalDe(t) { return 4 * t.proteina + 4 * t.hidratos + 9 * t.grasa + 2 * t.fibra; }

// ELIGE la fraccion servible que cuadra (validar_preparaciones — misma semantica que la
// version filter+sort original, reescrita sin allocations: esta funcion corre millones de
// veces en el barrido del motor y el par filter/sort dominaba el coste medido): se prueban
// las fracciones que el suelo permite y gana la que cuadra y queda mas cerca de la racion
// completa; a igual distancia, la primera de la lista (como el sort estable original).
function fraccionServible(k0, banda, minF, maxF) {
  if (k0 >= banda[0] && k0 <= banda[1]) return FRACCION_COMPLETA;
  var mejor = null, mejorDist = Infinity;
  for (var i = 0; i < FRACCIONES.length; i++) {
    var x = FRACCIONES[i];
    if (x.f < minF - 1e-9 || x.f > maxF + 1e-9) continue;
    var k = k0 * x.f;
    if (k < banda[0] || k > banda[1]) continue;
    var dist = Math.abs(x.f - 1);
    if (dist < mejorDist) { mejorDist = dist; mejor = x; }
  }
  return mejor;
}
var FRACCION_COMPLETA = { f: 1, texto: 'racion completa' };

// El suelo por gramos RELAJA, nunca endurece (validar_preparaciones, verbatim): fraccion minima
// admisible dada la pieza de proteina mas grande del plato. El suelo de 100 g es de adulto.
function minFraccion(gProteina, quien) {
  if (quien === 'nino') return FACTOR_MIN_ABSOLUTO;
  if (gProteina >= SUELO_PROTEINA_G) {
    return Math.min(FACTOR_PERSONA_MIN, Math.max(FACTOR_MIN_ABSOLUTO, SUELO_PROTEINA_G / gProteina));
  }
  return FACTOR_MIN_ABSOLUTO;
}

// --- Fabrica: indices + calculo por linea sobre UN banco -------------------------------------
function crearCalculo(datos) {
  var nut = {};
  datos.nutricion.forEach(function (n) {
    nut[n.alimento_id] = nut[n.alimento_id] || {};
    nut[n.alimento_id][n.base] = nut[n.alimento_id][n.base] || {};
    nut[n.alimento_id][n.base][n.nutriente] = n.valor;
  });
  var coc = {};
  datos.cocciones.forEach(function (c) { coc[c.alimento_id + '|' + c.tecnica_id] = c; });
  var elabIdx = {};
  datos.elaboraciones.forEach(function (e) { elabIdx[e.id] = e; });
  var alimIdx = {};
  datos.alimentos.forEach(function (a) { alimIdx[a.id] = a; });
  var compIdx = {};
  (datos.componentes || []).forEach(function (c) { compIdx[c.id] = c; });
  var lineasDeElab = {}, lineasDeComp = {};
  datos.lineas.forEach(function (l) {
    var t = l.padre_tipo === 'elaboracion' ? lineasDeElab : lineasDeComp;
    (t[l.padre] = t[l.padre] || []).push(l);
  });

  // La alternativa por defecto es la primera SERVIBLE, no la primera de la lista
  // (validar_preparaciones, verbatim).
  function opcionPorDefecto(l) {
    var ids = l.alternativas || [];
    for (var i = 0; i < ids.length; i++) {
      if (nut[ids[i]] && nut[ids[i]][l.base] && nut[ids[i]][l.base].proteina != null) return ids[i];
    }
    return ids[0];
  }

  function gramosDe(l, alimento, quien) {
    var mapa = quien === 'nino' ? l.gramos_nino_por_opcion : l.gramos_por_opcion;
    if (mapa && mapa[alimento] != null) return mapa[alimento];
    return quien === 'nino' ? l.gramos_nino : l.gramos_adulto;
  }

  // Una linea de alimento, acumulada sobre `t`: gramos (en su base) x macros/100g, con la
  // conversion crudo<->cocido via factor_agua cuando la nutricion vive en la otra base, y la
  // grasa que ENTRA o SALE en la coccion (#1.5, declarada por 100 g CRUDOS).
  // `escala` multiplica los gramos (referencia de componente); `conGrasaCoccion` = false cuando
  // el componente ya modela la absorcion a nivel de pieza (empanado) — contarla ademas por
  // sublinea seria el mismo aceite dos veces (PASO5 §3).
  // `opcion` admite dos formas: un id (contrato de la referencia: UNA opcion global, cae a
  // opcionPorDefecto donde no aplica) o una FUNCION (linea) -> id, que es lo que necesita la
  // mesa mixta por comensal (cada miembro puede llevar SU opcion en mas de una linea).
  function acumularLinea(t, l, quien, opcion, pos, escala, conGrasaCoccion) {
    var a = l.alimento_id ||
      (typeof opcion === 'function' ? (opcion(l) || opcionPorDefecto(l))
        : ((l.alternativas || []).indexOf(opcion) >= 0 ? opcion : opcionPorDefecto(l)));
    if (!a) return;
    var g = gramosDe(l, a, quien);
    var min = quien === 'nino' ? l.gramos_nino_min : l.gramos_adulto_min;
    var max = quien === 'nino' ? l.gramos_nino_max : l.gramos_adulto_max;
    if (pos != null && min != null && max != null) g = pos <= 0.5 ? min + (g - min) * (pos / 0.5) : g + (max - g) * ((pos - 0.5) / 0.5);
    g = g * (escala == null ? 1 : escala);
    var c = l.tecnica_id ? coc[a + '|' + l.tecnica_id] : null;
    var base = nut[a] && nut[a][l.base], gm = g;
    if (!base) {
      var otra = l.base === 'crudo' ? 'cocido' : 'crudo';
      base = nut[a] && nut[a][otra];
      if (!base || !c || c.factor_agua == null) return;
      gm = l.base === 'crudo' ? g * c.factor_agua : g / c.factor_agua;
    }
    MACROS.forEach(function (m) { t[m] += (base[m] || 0) * gm / 100; });
    if (conGrasaCoccion && c && (c.grasa_entra_g100 != null || c.grasa_sale_g100 != null)) {
      var gCrudos = l.base === 'crudo' ? g : (c.factor_agua ? g / c.factor_agua : g);
      t.grasa += ((c.grasa_entra_g100 || 0) - (c.grasa_sale_g100 || 0)) * gCrudos / 100;
    }
  }

  // Macros de una elaboracion con la racion en un punto de su banda. Base de la referencia
  // ejecutada (validar_preparaciones) + CORRECCION de esta sesion (motor v5, 30-jul): las
  // sublineas de un COMPONENTE suman sus macros al plato (x escala), como dicta el criterio
  // escrito (PASO5 "un componente suma sus propios macros"; esquema §8.2 "el huevo del rebozado
  // cuenta") — la referencia solo miraba lineas propias y 20 elaboraciones con empanado/
  // enharinado/salsa-tomate contaban de menos. Corregido AQUI (unica implementacion) y
  // re-medida la referencia; el delta queda en la cronica de la sesion, no en silencio.
  function macros(id, quien, opcion, pos) {
    var t = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
    (lineasDeElab[id] || []).forEach(function (l) {
      if (l.componente_id) return;
      acumularLinea(t, l, quien, opcion, pos, 1, true);
    });
    (lineasDeElab[id] || []).forEach(function (l) {
      if (!l.componente_id) return;
      var comp = compIdx[l.componente_id];
      var escala = quien === 'nino' ? l.escala_nino : l.escala_adulto;
      if (escala == null) escala = 1;
      var absorbeEnPieza = comp && comp.grasa_absorbe_g100_pieza != null;
      // macros de las sublineas del componente (la banda de guarnicion no aplica dentro de un
      // componente: `pos` no entra — sus gramos son receta, no guarnicion escalable)
      (lineasDeComp[l.componente_id] || []).forEach(function (s) {
        acumularLinea(t, s, quien, opcion, null, escala, !absorbeEnPieza);
      });
      // el recubrimiento capta aceite sobre la PIEZA que reboza, no sobre sus propios gramos
      if (absorbeEnPieza) {
        var gPieza = 0;
        (lineasDeElab[id] || []).forEach(function (x) {
          if (!x.tecnica_id || x.tecnica_id !== 'frito' || x.componente_id) return;
          gPieza += gramosDe(x, x.alimento_id || opcionPorDefecto(x), quien) || 0;
        });
        t.grasa += comp.grasa_absorbe_g100_pieza * gPieza / 100 * escala;
      }
    });
    return t;
  }

  function sumar(ids, quien, opcion, pos) {
    var t = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
    ids.forEach(function (i) { var m = macros(i, quien, opcion, pos); MACROS.forEach(function (x) { t[x] += m[x]; }); });
    return t;
  }

  // La pieza de proteina mas grande del plato (validar_preparaciones, verbatim): sostiene el
  // suelo de gramos de la racion adulta.
  function piezaProteina(ids, opcion, quien) {
    var gProteina = 0;
    ids.forEach(function (eid) {
      (lineasDeElab[eid] || []).forEach(function (l) {
        if (!l.alimento_id && !(l.alternativas || []).length) return;
        var a = l.alimento_id || ((l.alternativas || []).indexOf(opcion) >= 0 ? opcion : opcionPorDefecto(l));
        var al = alimIdx[a];
        if (!al || ['carne', 'pescado', 'marisco', 'huevo'].indexOf(al.naturaleza) < 0) return;
        var g = gramosDe(l, a, quien);
        if (g > gProteina) gProteina = g;
      });
    });
    return gProteina;
  }

  // Combinaciones logicas de un principal (validar_preparaciones, verbatim): lo que
  // `combinaciones` le permite + un postre. Si la tabla no lo permite, no se prueba.
  var POSTRES = datos.elaboraciones.filter(function (e) { return e.tipo === 'postre'; }).map(function (e) { return e.id; });
  function combinacionesDe(principal) {
    var regla = datos.combinaciones.filter(function (c) { return c.principal_id === principal; })[0];
    var hidratos = regla ? (regla.admite_base_hidrato || []) : [];
    var fibra = regla ? regla.admite_base_fibra : 'ninguna';
    var secundariasFibra = [];
    if (fibra === 'ensalada' || fibra === 'ambas') secundariasFibra = secundariasFibra.concat(datos.elaboraciones.filter(function (e) { return e.tipo === 'secundaria-ensalada'; }).map(function (e) { return e.id; }));
    if (fibra === 'verdura' || fibra === 'ambas') secundariasFibra = secundariasFibra.concat(datos.elaboraciones.filter(function (e) { return e.tipo === 'secundaria-verdura'; }).map(function (e) { return e.id; }));
    var combos = [];
    var conHidrato = [null].concat(hidratos);
    var conFibra = [null].concat(secundariasFibra);
    conHidrato.forEach(function (h) {
      conFibra.forEach(function (f) {
        POSTRES.forEach(function (p) {
          var ids = [principal];
          if (h) ids.push(h);
          if (f) ids.push(f);
          ids.push(p);
          combos.push({ ids: ids, hidrato: h, fibra: f, postre: p });
        });
      });
    });
    return combos;
  }

  // Los 3 ejes se comprueban en el PLATO — el postre no cuenta (#8.0.1).
  function ejesQueFaltan(ids) {
    var ejes = {};
    ids.forEach(function (i) { var e = elabIdx[i]; if (e && e.tipo !== 'postre') (e.ejes || []).forEach(function (x) { ejes[x] = true; }); });
    return ['proteina', 'hidrato', 'fruta-verdura'].filter(function (x) { return !ejes[x]; });
  }

  return {
    datos: datos, nut: nut, coc: coc, elabIdx: elabIdx, alimIdx: alimIdx, compIdx: compIdx,
    lineasDeElab: lineasDeElab, lineasDeComp: lineasDeComp, POSTRES: POSTRES,
    opcionPorDefecto: opcionPorDefecto, gramosDe: gramosDe, macros: macros, sumar: sumar,
    piezaProteina: piezaProteina, combinacionesDe: combinacionesDe, ejesQueFaltan: ejesQueFaltan
  };
}

var api = {
  REPARTO_KCAL: REPARTO_KCAL, MARGEN_KCAL_DEFECTO: MARGEN_KCAL_DEFECTO,
  FACTOR_ACTIVIDAD_MIFFLIN: FACTOR_ACTIVIDAD_MIFFLIN, FACTOR_ACTIVIDAD_BANDA: FACTOR_ACTIVIDAD_BANDA,
  EDAD_MENOR: EDAD_MENOR, FACTOR_PERSONA_MIN: FACTOR_PERSONA_MIN, FACTOR_PERSONA_MAX: FACTOR_PERSONA_MAX,
  SUELO_PROTEINA_G: SUELO_PROTEINA_G, FACTOR_MIN_ABSOLUTO: FACTOR_MIN_ABSOLUTO,
  MACROS: MACROS, FRACCIONES: FRACCIONES, POSICIONES: POSICIONES, PRI_PROTEINA: PRI_PROTEINA,
  edadDe: edadDe, kcalDia: kcalDia, priDia: priDia, bandaPersona: bandaPersona, bandaMesa: bandaMesa,
  sueloProteina: sueloProteina, kcalDe: kcalDe, fraccionServible: fraccionServible,
  minFraccion: minFraccion, crearCalculo: crearCalculo
};

if (typeof window !== 'undefined') window.E3CalculoV5 = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;

})();

})();

/* ---- bd_v5/selector.js ---- */
(function () {
// EL SELECTOR v5 — criterio de seleccion de Roger (30-jul), cerrado. Sesion del selector.
//
// MODULO PURO (contrato de dietas.js): no imprime, no escribe, no ejecuta nada al cargarse.
// Carga ./datos una vez por proceso (0,08 s, medido en la auditoria del 30-jul).
//
// UNICA implementacion del criterio. La sonda `kpi_sonda_criterio30jul.js` (referencia
// historica) queda retirada: dos copias que puedan divergir = mal hecho. Consumidores:
//   - `kpi_menu14.js`      (KPI oficial del banco)
//   - `_test_selector.js`  (gate de sesion)
//
// API:
//   generarMenu({ mesa, dias, favoritos, noMeGusta, historial, opciones })
//     mesa:      [{ nombre, perfil: { estilo, alergias } }]  — perfiles de dietas.js
//     dias:      entero >= 1 (p. ej. 14)
//     favoritos / noMeGusta: ids de elaboracion (opcionales)
//     historial: ids de elaboracion ya servidos a este cliente, en orden cronologico
//                (el ultimo = servicio inmediatamente anterior al dia 1). Alimenta la regla
//                de consecutivos, el descubrimiento y — solo para platos SIN variante
//                interna, donde el id determina el par — las ventanas de repeticion.
//     opciones:  { kcal, temporada }
//                kcal (sesion motor v5, 30-jul — el hueco declarado, ya conectado): una
//                FUNCION (idElab, par, dia, turno) -> boolean inyectada por el motor — true =
//                el plato puede cerrar la banda kcal de la mesa en ese servicio. Se aplica
//                como veto de nivel 1; si vacia el pool de un slot, se sirve sin el filtro y
//                se avisa (`kcal-fuera-de-banda`) — la banda nunca rompe el menu, como los
//                minimos. Cualquier otro valor no-funcion conserva el aviso
//                `kcal-no-implementado` de siempre (compatibilidad con el contrato previo).
//                temporada: 'primavera'|'verano'|'otono'|'invierno' — alimenta el
//                descubrimiento (sin Date.now(): la temporada es entrada, no reloj).
//   -> { servicios: [{ dia, turno, elaboracion, par, categorias }], avisos, stats }
//      avisos:  [{ tipo, ...detalle, msg }] — tipos: kcal-no-implementado ·
//               minimo-desactivado · semana-incumplida · guisado-entre-semana · menu-truncado
//      stats:   { dias, repPlato, repPlatoSinVariante, repPar, semanas, minsDesactivados }
//
// DETERMINISTA: misma entrada -> mismo menu. Sin Date.now() ni random; los sort son
// estables y desempatan por orden de datos.
//
// CONVENCION DE CALENDARIO: dia 1 = lunes; el finde son los dias 6 y 7 de cada semana.
//
// Jerarquia lexicografica (cerrada 30-jul, no reabrir):
//   1 Vetos        exclusiones de mesa (dietas.vetado, sobre el DESGLOSE COMPLETO: los
//                  componentes se expanden — la sonda no lo hacia y un celiaco pasaba por
//                  apto en milanesa/fingers, con el pan rallado dentro del componente) ·
//                  maximos/semana · mismo plato >3 usos en ventana de 14 dias o a <4 dias
//                  del ultimo uso · misma elaboracion en dos servicios consecutivos
//   2 Obligaciones minimos/semana; un minimo inalcanzable por la mesa se DESACTIVA con
//                  aviso; un minimo NUNCA rompe el menu (si reservar para minimos vacia el
//                  pool, se sirve lo que haya y la semana cierra con aviso)
//   3 Favoritos    justo debajo de las cuotas; los vetos les siguen aplicando.
//                  noMeGusta = penalizacion espejo, nunca veto
//   4 Higiene      plato nuevo > repetido · par nuevo > repetido; entre repetidos, menos
//                  usos y mas dias desde el ultimo
//   5 Contexto     entre semana los GUISOS DE ELABORACION LARGA se reservan al finde
//                  (aclarado por Roger en la sesion del selector, 30-jul): plato "de
//                  finde" = guiso o salsa (tecnica `guisado` en el desglose o estilo
//                  guiso/salsa) Y tiempo_min > 30 — la salsa ligera/expres (revueltos con
//                  tomate, pasta con atun, pizza) se permite entre semana; si un minimo
//                  solo fuera alcanzable con guisado entre semana, se sirve y se avisa ·
//                  <=30 min gana el desempate
//   6 Descubrim.   1 hueco/semana fuera del ranking, en servicios de finde:
//                  nunca-en-historial > temporada actual > `ocasion`
//
// CUOTA DE REBOZADOS (lo unico nuevo de cuota, 30-jul): computa el plato cuyo desglose
// incluye el componente `empanado` o el rebozado a la romana. NO computa la tecnica
// `frito` (tortillas y huevos fritos fuera) NI el enharinado (merluza-enharinada y
// fricando fuera).
'use strict';

// En navegador (motor_v5.js, GENERADO por _build_banco_v5.js) el banco y dietas llegan por
// window; en node siguen siendo los modulos de siempre. Una sola implementacion, dos entornos.
const d = (typeof window !== 'undefined' && window.E3_BANCO_V5) ? window.E3_BANCO_V5 : require('./datos');
const dietas = (typeof window !== 'undefined' && window.E3DietasV5) ? window.E3DietasV5 : require('./dietas');

// --- Constantes del criterio (30-jul, cerradas) ------------------------------
const CUOTAS = {
  'legumbre':      { min: 3, max: 4 },
  'pescado-total': { min: 2, max: null },
  'pescado-azul':  { min: 1, max: 2 },
  'carne-roja':    { min: 0, max: 2 },
  'huevo':         { min: 3, max: 4 },
  'rebozado':      { min: 0, max: 2 }
};
const ROJA = { cerdo: 1, ternera: 1, cordero: 1 };
const AZUL = { salmon: 1, atun: 1, sardina: 1, boqueron: 1, 'anchoa conserva': 1 };
// El banco no tiene naturaleza `legumbre` (van por id) — correccion del 30-jul, OK de Roger.
// Los derivados de soja COMPUTAN como legumbre (Roger, 30-jul en sesion; precedente: edamame).
// El seitan es gluten de trigo: proteina si, legumbre no.
const LEGUMBRE_IDS = { garbanzos: 1, lentejas: 1, 'alubias-blancas': 1, edamame: 1,
                       tofu: 1, tempeh: 1, heura: 1, 'soja-texturizada': 1 };
// Proteinas vegetales por id: `naturaleza: vegetal` no las distingue (mismo punto ciego que
// tuvieron las legumbres). Aportan PAR de proteina — sin esto la pauta de la dietista
// (proteina-vegetal-plancha, boniato-relleno) quedaba fuera del menu vegano.
const PROTEINA_VEGETAL_IDS = { tofu: 1, tempeh: 1, seitan: 1, heura: 1, 'soja-texturizada': 1 };
const VENTANA = 14, DIST_MIN_PLATO = 4, MAX_USOS_PLATO = 3, TIEMPO_RAPIDO = 30;

// CUOTAS POR ESTILO (Roger, 30-jul en sesion): "vegano y vegetariano deberian tener limites
// de cuota distintos que el omnivoro" y, dictado despues, "deja las cuotas a cero hasta
// encontrar un valor valido; manten cuotas solo para omnivoro". Tabla vacia = sin minimos
// que obligar ni maximos que vetar (rige solo variedad/higiene/contexto); AESAN A22/AI22
// solo trae frecuencias omnivoras y no se inventa dato. La dieta mas restrictiva de la mesa
// elige la tabla — coherente con el pool: un vegano en la mesa ya hace vegano el menu
// compartido. Un solo sitio a tocar cuando exista valor con fuente.
const CUOTAS_POR_ESTILO = { vegano: {}, vegetariano: {} };
function cuotasDeMesa(mesa) {
  const estilos = mesa.map(c => c.perfil && c.perfil.estilo);
  if (estilos.includes('vegano')) return CUOTAS_POR_ESTILO.vegano;
  if (estilos.includes('vegetariano')) return CUOTAS_POR_ESTILO.vegetariano;
  return CUOTAS;
}

// --- Indices del banco (una vez por proceso) ---------------------------------
const alim = {}; d.alimentos.forEach(a => { alim[a.id] = a; });
const elabPorId = {}; d.elaboraciones.forEach(e => { elabPorId[e.id] = e; });
const porElab = {}, porComp = {};
d.lineas.forEach(l => {
  const t = l.padre_tipo === 'elaboracion' ? porElab : porComp;
  (t[l.padre] = t[l.padre] || []).push(l);
});
// desglose completo: las lineas propias con los componentes expandidos (sin anidamiento
// en el banco de hoy; si algun dia lo hay, este es el sitio a tocar)
const desglose = {};
Object.keys(porElab).forEach(id => {
  desglose[id] = porElab[id].flatMap(l => l.componente_id ? (porComp[l.componente_id] || []) : [l]);
});
// variante interna: alguna linea intercambiable con >1 opcion
const tieneVariante = {};
Object.keys(porElab).forEach(id => {
  tieneVariante[id] = porElab[id].some(l =>
    l.papel === 'intercambiable' && (l.alternativas || []).length > 1);
});
const REBOZADAS = {}, DE_FINDE = {};
d.elaboraciones.forEach(e => {
  if ((porElab[e.id] || []).some(l => l.componente_id === 'empanado') ||
      /romana/i.test(e.id + ' ' + e.nombre)) REBOZADAS[e.id] = true;
  // guiso de ELABORACION LARGA (Roger, 30-jul en sesion): guiso/salsa y ademas >30 min.
  // El corte por tiempo es lo que deja la salsa expres entre semana y retiene la fideua.
  const estilo = e.perfil_servicio && e.perfil_servicio.estilo;
  const esGuiso = (desglose[e.id] || []).some(l => l.tecnica_id === 'guisado') ||
                  estilo === 'guiso' || estilo === 'salsa';
  if (esGuiso && e.tiempo_min > TIEMPO_RAPIDO) DE_FINDE[e.id] = true;
});

// --- Lectura del banco -------------------------------------------------------

function catsAlimento(a, out) {
  if (!a) return out;
  if (a.naturaleza === 'carne' && ROJA[a.origen]) out.push('carne-roja');
  if (a.naturaleza === 'huevo') out.push('huevo');
  if (a.naturaleza === 'pescado' || a.naturaleza === 'marisco') out.push('pescado-total');
  if (AZUL[a.origen]) out.push('pescado-azul');
  if (LEGUMBRE_IDS[a.id]) out.push('legumbre');
  return out;
}

// CUOTAS SOBRE EL PLATO ENTERO, no solo el par (Roger, 31-jul — fix P0-2 de la auditoria E2E:
// 20 principales multi-proteina infracontados; la carbonara servida "como huevo" no contaba su
// panceta). Dictado: "TODOS los alimentos —excepto condimentos— suman". Computan las lineas
// PROPIAS fijas de la elaboracion (alternativas de 1 opcion incluidas); el eje real lo aporta
// el par elegido. Fronteras deliberadas: `condimento` fuera (dictado) · las sublineas de
// COMPONENTE suman macros pero NO racion de cuota (doctrina §8.2: el huevo del rebozado no es
// una racion de huevo — su cuota ya la lleva REBOZADAS) · las guarniciones las elige el motor
// despues y siguen fuera del conteo del selector (limitacion conocida, informe auditoria §C-2).
const CATS_FIJAS = {};
d.elaboraciones.forEach(e => {
  const set = {};
  (porElab[e.id] || []).forEach(l => {
    if (l.papel === 'condimento') return;
    const ops = l.alternativas || (l.alimento_id ? [l.alimento_id] : []);
    if (ops.length !== 1) return;                 // el eje intercambiable lo cubre el par
    catsAlimento(alim[ops[0]], []).forEach(c => { set[c] = 1; });
  });
  CATS_FIJAS[e.id] = Object.keys(set);
});

function categorias(par, idElab) {
  const out = [];
  catsAlimento(alim[par.split('|')[0]], out);
  (CATS_FIJAS[idElab] || []).forEach(c => { if (out.indexOf(c) < 0) out.push(c); });
  if (REBOZADAS[idElab]) out.push('rebozado');
  return out;
}

function lineaComible(l, perfil) {
  const ops = l.alternativas || (l.alimento_id ? [l.alimento_id] : []);
  if (!ops.length) return true;
  if (l.papel === 'intercambiable' && ops.length > 1) {
    return ops.some(o => !dietas.vetado(alim[o], perfil));   // le queda opcion
  }
  return ops.every(o => !dietas.vetado(alim[o], perfil));    // fijo/condimento: todo o nada
}

// Un plato SIRVE A LA MESA si cada comensal tiene al menos una forma de comerlo.
// Sobre el DESGLOSE COMPLETO: una alergia es seguridad y el rebozado tambien cuenta.
function sirveAMesa(idElab, mesa) {
  const lineas = desglose[idElab] || [];
  return mesa.every(c => lineas.every(l => lineaComible(l, c.perfil)));
}

// Pares (alimento, tecnica) que aportan proteina, desplegando intercambiables. Solo
// lineas PROPIAS: el huevo del rebozado no es la proteina del plato. Cada opcion tiene
// que ser comible por TODA la mesa para contar como recurso de variedad.
function paresProteina(idElab, mesa) {
  const e = elabPorId[idElab];
  if (!e || (e.ejes || []).indexOf('proteina') === -1) return [];
  const out = [];
  (porElab[idElab] || []).forEach(l => {
    // un condimento no puede ser la identidad de proteina del plato (31-jul, mismo criterio
    // que el conteo de cuotas: el yogur de la salsa no convierte a la ensalada en "de yogur")
    if (l.papel === 'condimento') return;
    const ops = l.alternativas || (l.alimento_id ? [l.alimento_id] : []);
    ops.forEach(o => {
      const a = alim[o];
      if (!a) return;
      const esProt = ['carne', 'pescado', 'marisco', 'huevo', 'lacteo'].includes(a.naturaleza)
                     || LEGUMBRE_IDS[o] || PROTEINA_VEGETAL_IDS[o];
      if (!esProt) return;
      if (mesa.length && !mesa.every(c => !dietas.vetado(a, c.perfil))) return;
      out.push(o + '|' + (l.tecnica_id || 'crudo'));
    });
  });
  return out;
}

// --- El selector -------------------------------------------------------------

function generarMenu({ mesa = [], dias, favoritos = [], noMeGusta = [], historial = [], opciones = {} } = {}) {
  if (!Number.isInteger(dias) || dias < 1) throw new Error('dias: entero >= 1 requerido');
  const avisos = [];
  const favSet = new Set(favoritos), malSet = new Set(noMeGusta);
  // El hueco kcal, conectado (motor v5, 30-jul): funcion inyectada = filtro de nivel 1.
  // Cualquier otro valor conserva el contrato previo (aviso, sin simular).
  const filtroKcal = typeof opciones.kcal === 'function' ? opciones.kcal : null;
  if (opciones.kcal !== undefined && !filtroKcal) {
    avisos.push({ tipo: 'kcal-no-implementado', msg: 'opciones.kcal es un hueco declarado: entra al conectar macros' });
  }

  // opciones.excluidos (motor v5, 30-jul): veto DURO de nivel 1 por id — jamas se relaja (ni
  // por minimos ni por el fallback kcal). Lo alimenta el motor con las elaboraciones BLOQUEADAS
  // por falta de dato (regla de servicio §7, recalculadas — nunca guardadas como campo).
  const excluidos = new Set(opciones.excluidos || []);
  const principales = d.elaboraciones.filter(e => e.tipo === 'principal' && !excluidos.has(e.id) && sirveAMesa(e.id, mesa));
  const poolTurno = {};
  ['comida', 'cena'].forEach(t => {
    poolTurno[t] = principales
      .filter(e => (e.apta || []).includes(t))
      .map(e => ({ id: e.id, pares: paresProteina(e.id, mesa) }))
      .filter(x => x.pares.length);
  });

  const cuotas = cuotasDeMesa(mesa);

  // un minimo que la mesa hace inalcanzable se DESACTIVA con aviso, nunca rompe el menu
  const alcanzable = {};
  Object.keys(cuotas).forEach(cat => {
    alcanzable[cat] = ['comida', 'cena'].some(t =>
      poolTurno[t].some(x => x.pares.some(p => categorias(p, x.id).includes(cat))));
  });
  const minsDesactivados = Object.keys(cuotas).filter(c => cuotas[c].min && !alcanzable[c]);
  minsDesactivados.forEach(cat => avisos.push({
    tipo: 'minimo-desactivado', categoria: cat,
    msg: 'minimo semanal de ' + cat + ' desactivado: la mesa lo hace inalcanzable'
  }));

  // estado de ventanas, sembrado desde el historial
  const platoDias = {}, parUsos = {}, parUltimoDia = {};
  const enHistorial = new Set(historial);
  historial.forEach((id, i) => {
    const j = historial.length - 1 - i;          // 0 = el mas reciente
    const dia = -Math.floor(j / 2);              // dos servicios por dia, hacia atras desde el dia 0
    if (tieneVariante[id]) return;               // par desconocido: no puede alimentar ventanas
    const pares = paresProteina(id, []);
    if (pares.length !== 1) return;
    const par = pares[0], clave = id + '||' + par;
    (platoDias[clave] = platoDias[clave] || []).push(dia);
    parUsos[par] = (parUsos[par] || 0) + 1;
    if (parUltimoDia[par] == null || dia > parUltimoDia[par]) parUltimoDia[par] = dia;
  });
  const recientes = historial.slice(-2);

  const servicios = [], servidos = new Set(), semanas = [];
  let semanaCont = {}, semanaActual = 1, descubiertoSemana = false, truncado = false;
  let repPlato = 0, repPlatoSinVariante = 0, repPar = 0;

  const usosPlatoVentana = (clave, dia) =>
    (platoDias[clave] || []).filter(u => dia - u < VENTANA).length;
  const rompeMax = (par, idElab) => categorias(par, idElab).some(cat => {
    const c = cuotas[cat];
    return c && c.max != null && (semanaCont[cat] || 0) + 1 > c.max;
  });
  const ayudaMin = (par, idElab) => categorias(par, idElab).some(cat => {
    const c = cuotas[cat];
    return c && c.min && alcanzable[cat] && (semanaCont[cat] || 0) < c.min;
  });
  const faltanMins = () => Object.keys(cuotas).reduce((f, cat) => {
    const c = cuotas[cat];
    return f + (c.min && alcanzable[cat] ? Math.max(0, c.min - (semanaCont[cat] || 0)) : 0);
  }, 0);
  const cierraSemana = (n, completa) => {
    const fallos = [];
    Object.keys(cuotas).forEach(cat => {
      const c = cuotas[cat];
      if (c.min && alcanzable[cat] && (semanaCont[cat] || 0) < c.min) {
        fallos.push(cat + ' ' + (semanaCont[cat] || 0) + '/' + c.min);
      }
    });
    semanas.push({ semana: n, completa, fallos });
    if (completa && fallos.length) avisos.push({
      tipo: 'semana-incumplida', semana: n, fallos,
      msg: 'semana ' + n + ' cierra con minimos incumplidos: ' + fallos.join(', ')
    });
  };

  // coste lexicografico (niveles 2-5; el nivel 1 son los filtros de candidatos)
  const coste = (idElab, par, dia) => {
    const clave = idElab + '||' + par;
    return [
      ayudaMin(par, idElab) ? 0 : 1,                                   // 2 obligaciones
      favSet.has(idElab) ? 0 : 1,                                      // 3 favoritos
      malSet.has(idElab) ? 1 : 0,                                      // 3 espejo blando
      usosPlatoVentana(clave, dia) > 0 ? 1 : 0,                        // 4 plato nuevo > repetido
      parUsos[par] ? 1 : 0,                                            // 4 par nuevo > repetido
      parUsos[par] || 0,                                               // 4 menos usos
      -(parUltimoDia[par] != null ? dia - parUltimoDia[par] : 999),    // 4 mas distancia
      elabPorId[idElab].tiempo_min > TIEMPO_RAPIDO ? 1 : 0             // 5 <=30 min desempata
    ];
  };
  const cmp = (a, b) => {
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
    return 0;
  };

  const candidatos = (turno, dia, reservando, sinKcal) => poolTurno[turno]
    .map(x => {
      let libres = x.pares.filter(p => {
        const clave = x.id + '||' + p;
        if (usosPlatoVentana(clave, dia) >= MAX_USOS_PLATO) return false;
        const ult = (platoDias[clave] || []).slice(-1)[0];
        if (ult != null && dia - ult < DIST_MIN_PLATO) return false;
        return !rompeMax(p, x.id);
      });
      // el filtro kcal del motor es veto de nivel 1; `sinKcal` es el fallback del caller
      // (banda inalcanzable en el slot: se sirve igual y se avisa — nunca rompe el menu)
      if (filtroKcal && !sinKcal) libres = libres.filter(p => filtroKcal(x.id, p, dia, turno));
      if (reservando) libres = libres.filter(p => ayudaMin(p, x.id));
      return { id: x.id, libres };
    })
    .filter(x => x.libres.length && !recientes.slice(-2).includes(x.id));

  // nivel 6: fuera del ranking, con los vetos del nivel 1 intactos. Prioridad:
  // nunca-en-historial > temporada actual > ocasion. Alfabetico dentro de la clase
  // (determinista; al servirse entra en `servidos` y no se repite la semana siguiente).
  const elegirDescubrimiento = (turno, dia) => {
    const cands = candidatos(turno, dia, false);
    const clases = [
      x => !enHistorial.has(x.id) && !servidos.has(x.id),
      x => opciones.temporada && elabPorId[x.id].temporada === opciones.temporada,
      x => elabPorId[x.id].ocasion != null
    ];
    for (const pred of clases) {
      const grupo = cands.filter(pred).sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      if (grupo.length) {
        const x = grupo[0];
        x.libres.sort((a, b) => cmp(coste(x.id, a, dia), coste(x.id, b, dia)));
        return { id: x.id, par: x.libres[0] };
      }
    }
    return null;
  };

  const servir = (el, dia, turno, esDescubrimiento) => {
    const clave = el.id + '||' + el.par;
    if (parUsos[el.par]) repPar++;
    if (usosPlatoVentana(clave, dia) > 0) {
      repPlato++;
      if (!tieneVariante[el.id]) repPlatoSinVariante++;
    }
    (platoDias[clave] = platoDias[clave] || []).push(dia);
    parUsos[el.par] = (parUsos[el.par] || 0) + 1;
    parUltimoDia[el.par] = dia;
    const cats = categorias(el.par, el.id);
    cats.forEach(c => { semanaCont[c] = (semanaCont[c] || 0) + 1; });
    recientes.push(el.id);
    servidos.add(el.id);
    const s = { dia, turno, elaboracion: el.id, par: el.par, categorias: cats };
    if (esDescubrimiento) s.descubrimiento = true;
    servicios.push(s);
  };

  for (let dia = 1; dia <= dias && !truncado; dia++) {
    const sem = Math.ceil(dia / 7);
    if (sem !== semanaActual) {
      cierraSemana(semanaActual, true);
      semanaActual = sem; semanaCont = {}; descubiertoSemana = false;
    }
    const finde = ((dia - 1) % 7) >= 5;
    for (const turno of ['comida', 'cena']) {
      const slotsRestantes = (semanaActual * 7 - dia) * 2 + (turno === 'comida' ? 2 : 1);
      const reservar = faltanMins() >= slotsRestantes;

      let elegido = null, esDescubrimiento = false;
      if (finde && !descubiertoSemana && !reservar) {
        elegido = elegirDescubrimiento(turno, dia);
        if (elegido) { esDescubrimiento = true; descubiertoSemana = true; }
      }
      if (!elegido) {
        const preparar = (reservando, sinKcal) => {
          let cands = candidatos(turno, dia, reservando, sinKcal);
          let avisoGuiso = false;
          if (!finde) {
            const permitidos = cands.filter(x => !DE_FINDE[x.id]);
            if (permitidos.length) cands = permitidos;
            else if (cands.length) avisoGuiso = true;   // solo el guisado alcanza: servir y avisar
          }
          return { cands, avisoGuiso };
        };
        let { cands, avisoGuiso } = preparar(reservar);
        if (!cands.length && reservar) {
          // la obligacion nunca rompe el menu: si reservar vacia el pool, se sirve lo que
          // haya y la semana cerrara con su aviso de minimos incumplidos
          ({ cands, avisoGuiso } = preparar(false));
        }
        if (!cands.length && filtroKcal) {
          // la banda kcal tampoco rompe el menu: si el filtro del motor vacia el slot, se
          // sirve lo que haya y se deja dicho (espejo de la regla de los minimos)
          ({ cands, avisoGuiso } = preparar(false, true));
          if (cands.length) avisos.push({ tipo: 'kcal-fuera-de-banda', dia, turno,
            msg: 'dia ' + dia + ' ' + turno + ': ningun candidato cierra la banda kcal de la mesa — servido el mejor disponible' });
        }
        if (!cands.length) {
          avisos.push({ tipo: 'menu-truncado', dia, turno,
            msg: 'sin candidatos para dia ' + dia + ' ' + turno + ': menu truncado' });
          truncado = true;
          break;
        }
        if (avisoGuiso) avisos.push({ tipo: 'guisado-entre-semana', dia, turno,
          msg: 'dia ' + dia + ' ' + turno + ': guisado servido entre semana (unica via para el minimo)' });
        cands.forEach(x => {
          x.libres.sort((a, b) => cmp(coste(x.id, a, dia), coste(x.id, b, dia)));
          x.mejor = x.libres[0];
        });
        cands.sort((a, b) =>
          cmp(coste(a.id, a.mejor, dia), coste(b.id, b.mejor, dia)) || (a.libres.length - b.libres.length));
        elegido = { id: cands[0].id, par: cands[0].mejor };
      }
      servir(elegido, dia, turno, esDescubrimiento);
    }
  }
  const diasServidos = Math.floor(servicios.length / 2);
  cierraSemana(semanaActual, diasServidos >= semanaActual * 7);

  return {
    servicios, avisos,
    stats: { dias: diasServidos, repPlato, repPlatoSinVariante, repPar, semanas, minsDesactivados }
  };
}

// sirveAMesa exportada para el motor v5 (misma pregunta, mismo desglose — no se reimplementa).
const apiSelector = { generarMenu, categorias, sirveAMesa };
if (typeof window !== 'undefined') window.E3SelectorV5 = apiSelector;
if (typeof module !== 'undefined' && module.exports) module.exports = apiSelector;

})();

/* ---- bd_v5/motor.js ---- */
(function () {
// MOTOR v5 — la capa que conecta el SELECTOR (que plato) con el CALCULO (cuanto, para quien).
// Sesion motor v5 (2026-07-30). NO es el motor de produccion: v3 sigue sirviendo hasta que la
// auditoria end-to-end este en verde; en la app solo corre tras el flag de desarrollo.
//
// MODULO PURO y DETERMINISTA (contrato de dietas.js/selector.js): sin Date.now(), sin random;
// `fechaLunes` siempre inyectada. En navegador llega via motor_v5.js (GENERADO); en node, estos
// mismos ficheros son la unica implementacion.
//
// Que completa respecto al selector (sus huecos declarados):
//   - kcal por servicio: bandas Mifflin por miembro y agregadas (35/30 entre semana, finde
//     35-40/25-30 como rango) — mecanismo PORTADO de v3 via calculo.js, no reinventado. La
//     banda se valida con lo que cada comensal COME DE VERDAD (su opcion adaptada de mesa
//     mixta) — v5 nace con la leccion del fix del 30-jul puesta.
//   - cantidades reales: gramos por linea (adulto/nino) x factor de coccion x fraccion servible
//     derivada de la necesidad Mifflin de CADA miembro — nunca "racion H/M" inventada. El
//     calculo por linea es calculo.js, COMPARTIDO con validar_preparaciones.js.
//   - menu completo: principal + guarniciones por `combinaciones` (cerrar los 3 ejes;
//     pasta/arroz solo ensalada — eso ya vive en la tabla) + postre (los macros del MENU se
//     miden con el postre dentro, esquema §8.0.1) + proteina secundaria en cenas que quedan
//     cortas (criterio 30-jul punto 14: fiambre/salmon ahumado + tostadas).
//   - mesa mixta POR COMENSAL: la opcion del intercambiable se elige por miembro con
//     `dietas.vetado` sobre el desglose completo. Es el foso del producto.
//   - estado real: favoritos (estado.favoritas), no-me-gusta (gustos=2 por ingrediente +
//     caritas 'no-gusta'), historial v5 (lo gestiona el caller, nunca el estado sincronizado).
//
// LOS IMPOSIBLES (22 tras el fix de componentes; eran 13 — cronica de esta sesion): platos
// cuya racion minima servible ya se pasa de la banda de un perfil de bajo gasto. El motor los
// SALTA con aviso (`kcal-plato-saltado` en plan.avisos), jamas rompe ni arregla datos en
// silencio. Su revision global (suelo 100 g / techo 135% / porciones) es decision de Roger
// pendiente — no de esta capa.
'use strict';

var d = (typeof window !== 'undefined' && window.E3_BANCO_V5) ? window.E3_BANCO_V5 : require('./datos');
var dietas = (typeof window !== 'undefined' && window.E3DietasV5) ? window.E3DietasV5 : require('./dietas');
var selector = (typeof window !== 'undefined' && window.E3SelectorV5) ? window.E3SelectorV5 : require('./selector');
var CAL = (typeof window !== 'undefined' && window.E3CalculoV5) ? window.E3CalculoV5 : require('./calculo');

var C = CAL.crearCalculo(d);

// BLOQUEADAS (regla de servicio §7): recalculadas SIEMPRE, nunca guardadas como campo. En el
// navegador el build ya las dejo fuera del banco (lista vacia); en node se derivan del
// validador y entran al selector como `opciones.excluidos` (veto duro) — asi el pool de los
// dos entornos es el mismo.
var BLOQUEADAS = [];
if (typeof window === 'undefined' || !window.E3_BANCO_V5) {
  try { BLOQUEADAS = require('./validar').validarBanco(d).bloqueadas.map(function (b) { return b.id; }); }
  catch (e) { BLOQUEADAS = []; }
}

// OCULTAS (obra de encendido, 31-jul): estado.ocultas entra al veto duro `opciones.excluidos`
// del selector — mismo mecanismo que las BLOQUEADAS, jamas se relaja. Un id que no exista en
// v5 es inerte (contrato de gustos: sin remapeo v3→v5; post-reset los ids son v5 de nacimiento).
function excluidosDe(estado) {
  var out = BLOQUEADAS.slice();
  ((estado && estado.ocultas) || []).forEach(function (id) {
    if (C.elabIdx[id] && out.indexOf(id) < 0) out.push(id);
  });
  return out;
}

// --- utilidades de calendario (portadas de engine.js v3, minimas) ------------------------
function fechaISOmas(fechaBase, offsetDias) {
  var dt = new Date(fechaBase + 'T00:00:00');
  dt.setDate(dt.getDate() + offsetDias);
  var y = dt.getFullYear(), m = String(dt.getMonth() + 1).padStart(2, '0'), dd = String(dt.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + dd;
}
function temporadaDe(fechaISO) {
  var mes = parseInt(fechaISO.slice(5, 7), 10);
  if (mes >= 3 && mes <= 5) return 'primavera';
  if (mes >= 6 && mes <= 8) return 'verano';
  if (mes >= 9 && mes <= 11) return 'otono';
  return 'invierno';
}

// --- perfil y presencia ------------------------------------------------------------------
// vetos: la rejilla por ingrediente de la ficha (fix P0-1 auditoría 31-jul) — entra al perfil
// y dietas.vetado la aplica en la fuente unica; selector/nevera/elecciones la heredan.
function perfilDe(m) { return { estilo: m.estilo || 'de-todo', alergias: m.alergias || [], vetos: m.vetos || [] }; }

// Presencia por slot (portada de presentesEnComida v3): patron casa/fuera + ausencias
// puntuales + cole (menores fuera de la comida los dias con menu escolar cargado).
function presentesEnServicio(estado, fecha, diaIndex, tipoComida, fechaRef) {
  var aus = (estado.ausenciasPuntuales && estado.ausenciasPuntuales[fecha] && estado.ausenciasPuntuales[fecha][tipoComida]) || [];
  return (estado.familia || []).filter(function (m) {
    var p = (m.patron && m.patron[tipoComida]) ? m.patron[tipoComida][diaIndex] : 'casa';
    if (p !== 'casa') return false;
    if (aus.indexOf(m.id) !== -1) return false;
    if (tipoComida === 'comida' && estado.cole && estado.cole.dias && estado.cole.dias[fecha] &&
        CAL.edadDe(m, fechaRef) < CAL.EDAD_MENOR) return false;
    return true;
  });
}

// --- mesa mixta por comensal: eleccion de opcion POR LINEA y POR MIEMBRO ------------------
function servible(o, l) {
  var n = C.nut[o];
  if (!n) return false;
  if (n[l.base] && n[l.base].proteina != null) return true;
  var otra = l.base === 'crudo' ? 'cocido' : 'crudo';
  var c = l.tecnica_id ? C.coc[o + '|' + l.tecnica_id] : null;
  return !!(n[otra] && n[otra].proteina != null && c && c.factor_agua != null);
}

// Mapa linea -> alimento elegido para UN miembro sobre TODAS las lineas intercambiables de un
// conjunto de elaboraciones. La base de mesa es el `par` del selector (solo aplica a la linea
// que lo contenga); el resto arranca en la opcion por defecto. Si la base esta vetada para el
// miembro, se le sirve la primera alternativa servible no vetada — la mesa comparte plato,
// cada uno lleva SU opcion.
var memoElecciones = Object.create(null);
function claveDePerfil(perfil) {
  if (!perfil) return '-';
  // los vetos entran en la clave: dos perfiles que solo difieren en un veto NO pueden
  // compartir memo de elecciones (fix P0-1 — sin esto el memo serviria el alimento vetado)
  return (perfil.estilo || 'de-todo') + '~' + (perfil.alergias || []).join('~') +
    '~v:' + (perfil.vetos || []).join('~');
}
function eleccionesDe(ids, parAlimento, perfil) {
  var claveMemo = ids.join('+') + '|' + (parAlimento || '') + '|' + claveDePerfil(perfil);
  var hit = memoElecciones[claveMemo];
  if (hit) return hit;
  var mapa = new Map();
  ids.forEach(function (id) {
    (C.lineasDeElab[id] || []).forEach(function (l) {
      if (l.papel !== 'intercambiable' || !(l.alternativas || []).length) return;
      var ops = l.alternativas;
      var base = (parAlimento && ops.indexOf(parAlimento) >= 0) ? parAlimento : C.opcionPorDefecto(l);
      if (perfil && dietas.vetado(C.alimIdx[base], perfil)) {
        var alt = null;
        for (var i = 0; i < ops.length; i++) {
          if (!dietas.vetado(C.alimIdx[ops[i]], perfil) && servible(ops[i], l)) { alt = ops[i]; break; }
        }
        if (!alt) for (var j = 0; j < ops.length; j++) {
          if (!dietas.vetado(C.alimIdx[ops[j]], perfil)) { alt = ops[j]; break; }
        }
        base = alt || base;
      }
      mapa.set(l, base);
    });
  });
  memoElecciones[claveMemo] = mapa;
  return mapa;
}

// Bandas y pieza de proteina, memoizadas (se piden miles de veces por semana con las mismas
// entradas; el banco y los perfiles no cambian dentro de una generacion).
var memoBanda = Object.create(null);
function bandaMemo(m, turno, esFinde, fechaRef) {
  var k = (m.id || m.nombre) + '|' + turno + '|' + (esFinde ? 'f' : 's') + '|' + fechaRef + '|' +
    (m.peso || '') + '|' + (m.altura || '') + '|' + (m.anioNacimiento || '') + '|' + (m.actividad || '') + '|' + (m.objetivo || '') + '|' + (m.sexo || '');
  return memoBanda[k] || (memoBanda[k] = CAL.bandaPersona(m, turno, esFinde, fechaRef));
}
var memoPieza = Object.create(null);
function piezaMemo(ids, opEje, quien) {
  var k = ids.join('+') + '|' + (opEje || '') + '|' + quien;
  if (memoPieza[k] === undefined) memoPieza[k] = C.piezaProteina(ids, opEje, quien);
  return memoPieza[k];
}

// --- macros memoizados: la clave incluye las elecciones del miembro sobre ESA elaboracion --
var memoMacros = Object.create(null);
function macrosElab(id, quien, elecciones, pos) {
  var clave = id + '|' + quien + '|' + pos;
  (C.lineasDeElab[id] || []).forEach(function (l) {
    if (elecciones.has(l)) clave += '|' + elecciones.get(l);
  });
  var m = memoMacros[clave];
  if (!m) {
    m = memoMacros[clave] = C.macros(id, quien, function (l) { return elecciones.get(l); }, pos);
  }
  return m;
}
function sumarElabs(ids, quien, elecciones, pos) {
  var t = { proteina: 0, hidratos: 0, grasa: 0, fibra: 0 };
  ids.forEach(function (id) {
    var m = macrosElab(id, quien, elecciones, pos);
    CAL.MACROS.forEach(function (x) { t[x] += m[x]; });
  });
  return t;
}

// --- nombres ------------------------------------------------------------------------------
function resolverNombre(e, opcionId) {
  if (e.nombre_por_opcion && opcionId && e.nombre_por_opcion[opcionId]) return e.nombre_por_opcion[opcionId];
  var m = /\{[^}]+\}/.exec(e.nombre || '');
  if (m && opcionId && C.alimIdx[opcionId]) return e.nombre.replace(m[0], C.alimIdx[opcionId].nombre.toLowerCase());
  return e.nombre;
}

// --- resolucion de un servicio: combo + posicion + fraccion POR MIEMBRO -------------------
var SEC_PROTEINA = d.elaboraciones.filter(function (e) { return e.tipo === 'secundaria-proteina'; }).map(function (e) { return e.id; });

// GUARNICION NUEVA > REPETIDA, vision 15 dias (Roger, 31-jul — nacio del consome: sin higiene
// de guarniciones, el cierre elegia siempre el comodin que no mueve la banda). Es el espejo del
// nivel 4 del selector para las piezas h/f del combo: primero menos guarniciones repetidas en
// la ventana; entre repetidas, mas dias desde el ultimo uso. Nunca por encima de "sin
// tensionar" (posRank) — la variedad no justifica servir una guarnicion al minimo/maximo.
var VENTANA_GUARNICION = 15;

// Solo 9 lineas del banco declaran banda de guarnicion (min/max): si ninguna pieza del combo
// la tiene, las 5 POSICIONES son identicas y basta evaluar la central.
var tieneBanda = {};
d.elaboraciones.forEach(function (e) {
  tieneBanda[e.id] = (C.lineasDeElab[e.id] || []).some(function (l) { return l.gramos_adulto_min != null || l.gramos_nino_min != null; });
});

function claveCombo(ids) { return ids.join('+'); }

function cmpArr(a, b) {
  for (var i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// Mascara de ejes por elaboracion (proteina 1 · hidrato 2 · fruta-verdura 4): la cobertura de
// un plato es el OR de sus piezas == 7. El postre no cuenta (esquema #8.0.1) — sus `ejes` ya
// son [] en el banco.
var MASK_EJE = {};
d.elaboraciones.forEach(function (e) {
  var m = 0;
  (e.ejes || []).forEach(function (x) { m |= x === 'proteina' ? 1 : x === 'hidrato' ? 2 : x === 'fruta-verdura' ? 4 : 0; });
  MASK_EJE[e.id] = m;
});
var combIdx = {};
d.combinaciones.forEach(function (c) { combIdx[c.principal_id] = c; });

// kcal y pieza de proteina POR COMPONENTE — cache GLOBAL: solo dependen de (elaboracion, quien,
// perfil, posicion, par) y el par solo pesa si aparece en las alternativas de esa elaboracion
// (el kcal de un arroz blanco no cambia porque el principal lleve pollo o merluza). Es lo que
// convierte el barrido de combos en sumas de floats.
var memoComp = Object.create(null);
var altSet = {};   // id -> alternativas de todas sus lineas (para saber si el par le es relevante)
d.elaboraciones.forEach(function (e) {
  var s = Object.create(null);
  (C.lineasDeElab[e.id] || []).forEach(function (l) { (l.alternativas || []).forEach(function (o) { s[o] = 1; }); });
  altSet[e.id] = s;
});
function compMemo(id, quien, perfilKey, perfil, parAlimento, pos) {
  var parRelevante = (parAlimento && altSet[id][parAlimento]) ? parAlimento : '';
  var k = id + '|' + quien + '|' + perfilKey + '|' + parRelevante + '|' + pos;
  var hit = memoComp[k];
  if (hit) return hit;
  var elec = eleccionesDe([id], parRelevante || null, perfil);
  var t = macrosElab(id, quien, elec, pos);
  var opEje = parRelevante || null;
  elec.forEach(function (v, l) { if (parRelevante && (l.alternativas || []).indexOf(parRelevante) >= 0) opEje = v; });
  return (memoComp[k] = { k: CAL.kcalDe(t), pieza: piezaMemo([id], opEje || '', quien) });
}
var SEC_ENSALADA = d.elaboraciones.filter(function (e) { return e.tipo === 'secundaria-ensalada'; }).map(function (e) { return e.id; });
var SEC_VERDURA = d.elaboraciones.filter(function (e) { return e.tipo === 'secundaria-verdura'; }).map(function (e) { return e.id; });

// Nucleo: para (principal, par, presentes, turno, finde) busca la combinacion permitida +
// posicion de guarnicion + fraccion servible POR MIEMBRO que cierra la banda de TODOS los
// presentes. Devuelve null si ninguna cierra (el plato "no cierra la racion" para esta mesa).
//
// La busqueda enumera EXACTAMENTE el espacio de `combinacionesDe` (hidrato x fibra x postre,
// mismo orden — la referencia), pero con el kcal precalculado POR COMPONENTE y por miembro:
// el barrido de combos son sumas de floats, no reconstrucciones de plato (el producto
// cartesiano con 10 postres hacia inviable el camino ingenuo: medido, segundos por semana).
function resolverServicio(ctx) {
  var claveR = null;
  // Lo ESTATICO del slot (combos viables con su posicion/ajustes) se memoiza; los terminos de
  // guarnicion (nueva>repetida) cambian en cada slot y se aplican en el escaneo final sobre la
  // lista cacheada — asi la regla de variedad no paga el barrido entero otra vez.
  if (!ctx.soloExiste) {
    claveR = ctx.principalId + '|' + (ctx.par || '') + '|' + ctx.turno + '|' + (ctx.esFinde ? 'f' : 's') + '|' +
      (ctx.postrePreferido || '') + '|' + (ctx.excluirCombo || '') + '|' + ctx.fechaRef.slice(0, 4) + '|' +
      ctx.presentes.map(claveMiembro).join(',');
    var listaCacheada = memoViables[claveR];
    if (listaCacheada !== undefined) return elegirDeLista(listaCacheada, ctx);
  }
  var parAlimento = ctx.par ? ctx.par.split('|')[0] : null;
  var mesa = ctx.presentes.map(function (m) { return { nombre: m.nombre, perfil: perfilDe(m) }; });
  if (!selector.sirveAMesa(ctx.principalId, mesa)) { if (claveR) memoViables[claveR] = []; return null; }

  var aptoYSirve = function (id) {
    var el = C.elabIdx[id];
    if (!el) return false;
    if (el.apta && el.apta.indexOf(ctx.turno) < 0) return false;
    return selector.sirveAMesa(id, mesa);
  };
  var regla = combIdx[ctx.principalId];
  var hidratos = (regla ? (regla.admite_base_hidrato || []) : []).filter(aptoYSirve);
  var fibraTipo = regla ? regla.admite_base_fibra : 'ninguna';
  var fibras = [];
  if (fibraTipo === 'ensalada' || fibraTipo === 'ambas') fibras = fibras.concat(SEC_ENSALADA);
  if (fibraTipo === 'verdura' || fibraTipo === 'ambas') fibras = fibras.concat(SEC_VERDURA);
  fibras = fibras.filter(aptoYSirve);
  var postres = C.POSTRES.filter(aptoYSirve);
  if (!postres.length) { if (claveR) memoViables[claveR] = []; return null; }

  // poda temprana: el comensal de banda mas estrecha (menor gasto) falla primero
  var miembros = ctx.presentes.map(function (m) {
    var perfil = perfilDe(m);
    return {
      m: m, quien: CAL.edadDe(m, ctx.fechaRef) < CAL.EDAD_MENOR ? 'nino' : 'adulto',
      b: bandaMemo(m, ctx.turno, ctx.esFinde, ctx.fechaRef), perfil: perfil, perfilKey: claveDePerfil(perfil)
    };
  }).sort(function (a, b) { return a.b.max - b.b.max; });

  // cache local por (miembro, componente, posicion) — clave corta; el global respalda entre llamadas
  var cacheLocal = Object.create(null);
  function comp(mi, id, pos) {
    var k = mi.quien + '|' + id + '|' + pos + '|' + mi.perfilKey;
    return cacheLocal[k] || (cacheLocal[k] = compMemo(id, mi.quien, mi.perfilKey, mi.perfil, parAlimento, pos));
  }

  var maskP = MASK_EJE[ctx.principalId] || 0;

  // Dos modos: ctx.soloExiste devuelve el primer viable (filtro kcal, con memo propio en
  // esViable); con `coleccion` acumula el MEJOR (posicion, ajustes) de cada combo viable — la
  // lista es estatica respecto al slot y se memoiza; los terminos de guarnicion se aplican
  // despues, en elegirDeLista.
  function evaluar(extraIds, coleccion) {
    var mejor = null, idx = -1;
    var porCombo = coleccion ? Object.create(null) : null;
    var extrasPorMiembro = null;
    if (extraIds) {
      extrasPorMiembro = miembros.map(function (mi) {
        var k = 0, pieza = 0;
        extraIds.forEach(function (id) { var c = comp(mi, id, 0.5); k += c.k; if (c.pieza > pieza) pieza = c.pieza; });
        return { k: k, pieza: pieza };
      });
    }
    var conH = [null].concat(hidratos), conF = [null].concat(fibras);
    for (var hi = 0; hi < conH.length; hi++) {
      var h = conH[hi];
      for (var fi = 0; fi < conF.length; fi++) {
        var f = conF[fi];
        var mask = maskP | (h ? MASK_EJE[h] : 0) | (f ? MASK_EJE[f] : 0);
        if (mask !== 7) continue;                        // el plato no cubre los 3 ejes
        var conBanda = tieneBanda[ctx.principalId] || (h && tieneBanda[h]) || (f && tieneBanda[f]);
        var posiciones = conBanda ? CAL.POSICIONES : [CAL.POSICIONES[0]];
        for (var pi = 0; pi < postres.length; pi++) {
          var postre = postres[pi];
          idx++;
          var ids = [ctx.principalId];
          if (h) ids.push(h);
          if (f) ids.push(f);
          ids.push(postre);
          if (extraIds) ids = ids.concat(extraIds);
          if (ctx.excluirCombo && claveCombo(ids) === ctx.excluirCombo) continue;
          for (var qi = 0; qi < posiciones.length; qi++) {
            var P = posiciones[qi];
            var ok = true, nAjustes = 0, porBanda = [];
            for (var i = 0; i < miembros.length; i++) {
              var mi = miembros[i];
              var cP = comp(mi, ctx.principalId, P.pos);
              var k0 = cP.k, pieza = cP.pieza;
              if (h) { var cH = comp(mi, h, P.pos); k0 += cH.k; if (cH.pieza > pieza) pieza = cH.pieza; }
              if (f) { var cF = comp(mi, f, P.pos); k0 += cF.k; if (cF.pieza > pieza) pieza = cF.pieza; }
              var cPo = comp(mi, postre, P.pos); k0 += cPo.k; if (cPo.pieza > pieza) pieza = cPo.pieza;
              if (extrasPorMiembro) { k0 += extrasPorMiembro[i].k; if (extrasPorMiembro[i].pieza > pieza) pieza = extrasPorMiembro[i].pieza; }
              var minF = CAL.minFraccion(pieza, mi.quien);
              var frac = CAL.fraccionServible(k0, [mi.b.min, mi.b.max], minF, CAL.FACTOR_PERSONA_MAX);
              if (!frac) { ok = false; break; }
              if (frac.f !== 1) nAjustes++;
              porBanda.push({ mi: mi, k0: k0, frac: frac });
            }
            if (!ok) continue;
            var res = { combo: { ids: ids, hidrato: h, fibra: f, postre: postre }, ids: ids, P: P, porBanda: porBanda, extraIds: extraIds || null };
            if (ctx.soloExiste) return res;
            // parte ESTATICA del rank (independiente de la memoria de guarniciones)
            res.e = [
              P.pos === 0.5 ? 0 : (P.pos === 0 || P.pos === 1 ? 2 : 1),   // sin tocar > ajuste > tension
              nAjustes,
              ctx.postrePreferido && postre === ctx.postrePreferido ? 0 : 1,
              extraIds ? 1 : 0,                                            // sin refuerzo antes que con el
              idx
            ];
            // por combo se guarda su MEJOR posicion (posRank, luego ajustes): los terminos de
            // guarnicion son constantes dentro del combo, asi que esta eleccion es optima
            var previo = porCombo[idx];
            if (!previo || res.e[0] < previo.e[0] || (res.e[0] === previo.e[0] && res.e[1] < previo.e[1])) {
              if (!previo) coleccion.push(res); else coleccion[coleccion.indexOf(previo)] = res;
              porCombo[idx] = res;
              mejor = res;
            }
          }
        }
      }
    }
    return mejor;
  }

  // Proteina secundaria cuando el patron de cena lo pida (criterio 30-jul punto 14): si la
  // cena no cierra tal cual, se completa con fiambre/salmon ahumado/huevo duro... y, si aun
  // asi no llega, con tostadas ademas. Solo aptas y comibles por la mesa presente.
  if (ctx.soloExiste) {
    // camino del filtro kcal: primer viable y fuera (el memo de esto vive en esViable)
    var res1 = evaluar(null);
    if (!res1 && ctx.turno === 'cena') {
      var refuerzosE = SEC_PROTEINA.filter(aptoYSirve);
      for (var re = 0; re < refuerzosE.length && !res1; re++) res1 = evaluar([refuerzosE[re]]);
      var tostadasOkE = C.elabIdx.tostadas && aptoYSirve('tostadas');
      for (var te = 0; te < refuerzosE.length && !res1 && tostadasOkE; te++) res1 = evaluar([refuerzosE[te], 'tostadas']);
    }
    return res1;
  }
  var lista = [];
  evaluar(null, lista);
  if (!lista.length && ctx.turno === 'cena') {
    var refuerzos = SEC_PROTEINA.filter(aptoYSirve);
    for (var ri = 0; ri < refuerzos.length && !lista.length; ri++) evaluar([refuerzos[ri]], lista);
    var tostadasOk = C.elabIdx.tostadas && aptoYSirve('tostadas');
    for (var rj = 0; rj < refuerzos.length && !lista.length && tostadasOk; rj++) evaluar([refuerzos[rj], 'tostadas'], lista);
  }
  if (claveR) memoViables[claveR] = lista;
  return elegirDeLista(lista, ctx);
}
var memoViables = Object.create(null);

// Escaneo final sobre la lista de combos viables: aplica los terminos de guarnicion
// (nueva > repetida en ventana de 15 dias; entre repetidas, mas dias desde el ultimo uso)
// SOBRE la parte estatica cacheada, elige el minimo y construye el detalle por miembro.
function elegirDeLista(lista, ctx) {
  if (!lista || !lista.length) return null;
  var mejor = null, mejorRank = null;
  for (var i = 0; i < lista.length; i++) {
    var en = lista[i];
    var nRepetidas = 0, distancia = 0;
    if (ctx.guarnUso && ctx.dia != null) {
      var gs = [en.combo.hidrato, en.combo.fibra];
      for (var gi = 0; gi < 2; gi++) {
        var g = gs[gi];
        if (!g || ctx.guarnUso[g] == null) continue;
        var d2 = ctx.dia - ctx.guarnUso[g];
        if (d2 < VENTANA_GUARNICION) { nRepetidas++; distancia += d2; }
      }
    }
    var rank = [en.e[0], nRepetidas, -distancia, en.e[1], en.e[2], en.e[3], en.e[4]];
    if (!mejorRank || cmpArr(rank, mejorRank) < 0) { mejorRank = rank; mejor = en; }
  }
  // copia superficial: la entrada cacheada no se muta (finalizar cuelga porMiembro del resultado)
  return finalizarResolucion({
    combo: mejor.combo, ids: mejor.ids, P: mejor.P, porBanda: mejor.porBanda, extraIds: mejor.extraIds
  }, ctx);
}

// Del resultado numerico del barrido al detalle por miembro que construirMenu necesita
// (elecciones completas, proteina y suelo). Solo se paga para el combo ELEGIDO.
function finalizarResolucion(res, ctx) {
  var parAlimento = ctx.par ? ctx.par.split('|')[0] : null;
  res.porMiembro = ctx.presentes.map(function (m) {
    var quien = CAL.edadDe(m, ctx.fechaRef) < CAL.EDAD_MENOR ? 'nino' : 'adulto';
    var elec = eleccionesDe(res.ids, parAlimento, perfilDe(m));
    var t = sumarElabs(res.ids, quien, elec, res.P.pos);
    var k0 = CAL.kcalDe(t);
    var b = bandaMemo(m, ctx.turno, ctx.esFinde, ctx.fechaRef);
    var frac = null;
    // por clave, no por identidad de objeto: la lista viene del memo y puede ser de otra
    // instancia de estado con los mismos miembros
    var cm = claveMiembro(m);
    for (var i = 0; i < res.porBanda.length; i++) if (claveMiembro(res.porBanda[i].mi.m) === cm) frac = res.porBanda[i].frac;
    if (!frac) frac = { f: 1, texto: 'racion completa' };
    return {
      miembro: m, quien: quien, elecciones: elec, k0: k0, fraccion: frac,
      kcal: k0 * frac.f, banda: b,
      proteina: t.proteina * frac.f, sueloProteina: CAL.sueloProteina(m, ctx.turno, ctx.esFinde, ctx.fechaRef)
    };
  });
  return res;
}

// Viabilidad memoizada — es el filtro kcal que se inyecta al selector (veto de nivel 1).
// La clave ignora el dia: la banda solo depende de turno/finde/presentes. El miembro entra en
// la clave con TODOS sus parametros (dos familias de test pueden compartir ids).
function claveMiembro(m) {
  return [m.nombre, m.anioNacimiento, m.sexo, m.peso, m.altura, m.actividad, m.objetivo,
    m.estilo, (m.alergias || []).join('~'), (m.vetos || []).join('~')].join('·');
}
var memoViable = Object.create(null);
function esViable(principalId, par, turno, esFinde, presentes, fechaRef) {
  var clave = principalId + '|' + par + '|' + turno + '|' + (esFinde ? 'f' : 's') + '|' + fechaRef.slice(0, 4) + '|' +
    presentes.map(claveMiembro).join(',');
  if (memoViable[clave] === undefined) {
    memoViable[clave] = !!resolverServicio({
      principalId: principalId, par: par, presentes: presentes, turno: turno,
      esFinde: esFinde, fechaRef: fechaRef, soloExiste: true
    });
  }
  return memoViable[clave];
}

// --- del resultado interno al MENU que consume la UI (forma v3: slot = { menu }) ----------
function construirMenu(res, ctx) {
  var principal = C.elabIdx[ctx.principalId];
  var parAlimento = ctx.par ? ctx.par.split('|')[0] : null;
  var postreId = res.combo.postre;
  var acompanantes = res.ids.filter(function (id) { return id !== ctx.principalId && id !== postreId; });
  // elecciones BASE de mesa (sin perfil): resuelven los nombres con la opcion que se sirve
  var eleccionBase = eleccionesDe(res.ids, parAlimento, null);
  function opcionDe(id) {
    var op = null;
    (C.lineasDeElab[id] || []).forEach(function (l) { if (eleccionBase.has(l)) op = eleccionBase.get(l); });
    return op;
  }
  var opcionPrincipal = parAlimento || opcionDe(ctx.principalId);

  var adaptaciones = [], kcalPorComensal = [], fracciones = [], kcalTotal = 0;
  res.porMiembro.forEach(function (pm) {
    kcalTotal += pm.kcal;
    kcalPorComensal.push({ miembroId: pm.miembro.id, kcal: Math.round(pm.kcal) });
    fracciones.push({ miembroId: pm.miembro.id, fraccion: pm.fraccion.f, texto: pm.fraccion.texto });
    pm.elecciones.forEach(function (v, l) {
      if (parAlimento && (l.alternativas || []).indexOf(parAlimento) >= 0 && v !== parAlimento) {
        adaptaciones.push({ miembroId: pm.miembro.id, eje: 'proteina', valor: v });
      }
    });
  });

  // Compra: gramos REALES por alimento — por miembro, con su opcion, su gramaje (adulto/nino),
  // su fraccion y la escala del componente. Los ingredientes del componente entran (el tomate
  // de la salsa, el huevo del empanado): si esta en el plato, esta en la lista.
  var compra = {};
  function sumarLinea(l, escala, pm, pos) {
    var a = l.alimento_id || pm.elecciones.get(l) || C.opcionPorDefecto(l);
    if (!a) return;
    var g = C.gramosDe(l, a, pm.quien);
    var min = pm.quien === 'nino' ? l.gramos_nino_min : l.gramos_adulto_min;
    var max = pm.quien === 'nino' ? l.gramos_nino_max : l.gramos_adulto_max;
    if (pos != null && min != null && max != null) g = pos <= 0.5 ? min + (g - min) * (pos / 0.5) : g + (max - g) * ((pos - 0.5) / 0.5);
    g = g * escala * pm.fraccion.f;
    if (!compra[a]) compra[a] = { id: a, nombre: C.alimIdx[a] ? C.alimIdx[a].nombre : a, gramos: 0, naturaleza: C.alimIdx[a] ? C.alimIdx[a].naturaleza : null, unidad_g: C.alimIdx[a] ? C.alimIdx[a].unidad_g : null };
    compra[a].gramos += g;
  }
  res.ids.forEach(function (id) {
    (C.lineasDeElab[id] || []).forEach(function (l) {
      res.porMiembro.forEach(function (pm) {
        if (l.componente_id) {
          var esc = (pm.quien === 'nino' ? l.escala_nino : l.escala_adulto);
          if (esc == null) esc = 1;
          (C.lineasDeComp[l.componente_id] || []).forEach(function (s) { sumarLinea(s, esc, pm, null); });
        } else {
          sumarLinea(l, 1, pm, res.P.pos);
        }
      });
    });
  });

  var menu = {
    motorV5: true,
    principalId: ctx.principalId,
    par: ctx.par || null,
    seleccionEje: opcionPrincipal,
    nombre: resolverNombre(principal, opcionPrincipal),
    foto: principal.foto || null,
    pasos: principal.pasos || [],
    tips: principal.tips || [],
    complementarias: acompanantes.map(function (id) { return { id: id, seleccionEje: opcionDe(id) }; }),
    complementariasResueltas: acompanantes.map(function (id) {
      var e = C.elabIdx[id];
      return { id: id, nombre: resolverNombre(e, opcionDe(id)), pasos: e.pasos || [], seleccionEje: opcionDe(id) };
    }),
    postre: { id: postreId, nombre: C.elabIdx[postreId] ? C.elabIdx[postreId].nombre : postreId },
    comboClave: claveCombo(res.ids),
    posicionGuarnicion: res.P.pos,
    kcalTotal: Math.round(kcalTotal),
    kcalPorComensal: kcalPorComensal,
    fracciones: fracciones,
    adaptaciones: adaptaciones,
    categorias: ctx.categorias || [],
    descubrimiento: !!ctx.descubrimiento,
    ingredientes: Object.keys(compra).map(function (k) {
      var it = compra[k];
      return { id: it.id, nombre: it.nombre, gramos: Math.round(it.gramos), naturaleza: it.naturaleza, unidad_g: it.unidad_g };
    })
  };
  return menu;
}

// --- estado real: favoritos / no-me-gusta desde el esquema de estado vigente (v2) ---------
// gustos { ingredienteId: 1|2 } (2 = "mejor no", señal blanda, no veto): una elaboracion cuyo
// DESGLOSE contiene un ingrediente marcado 2 por alguien de la familia entra en noMeGusta.
// Las caritas 'no-gusta' (valoraciones) tambien. Ids que no existan en v5 no casan y no hacen
// nada — sin remapeo, como dicta el encargo.
function derivarNoMeGusta(estado) {
  var malos = {};
  (estado.familia || []).forEach(function (m) {
    Object.keys(m.gustos || {}).forEach(function (ing) { if (m.gustos[ing] === 2) malos[ing] = true; });
  });
  var out = {};
  if (Object.keys(malos).length) {
    d.elaboraciones.forEach(function (e) {
      if (e.tipo !== 'principal') return;
      var lineas = C.lineasDeElab[e.id] || [];
      var toca = lineas.some(function (l) {
        if (l.componente_id) {
          return (C.lineasDeComp[l.componente_id] || []).some(function (s) { return malos[s.alimento_id]; });
        }
        if (l.alimento_id) return malos[l.alimento_id];
        return false; // un intercambiable con una opcion marcada no condena el plato: hay eleccion
      });
      if (toca) out[e.id] = true;
    });
  }
  Object.keys(estado.valoraciones || {}).forEach(function (k) {
    var v = estado.valoraciones[k];
    if (v && v.valor === 'no-gusta' && C.elabIdx[v.principalId]) out[v.principalId] = true;
  });
  return Object.keys(out).sort();
}

// --- catalogo para Recetas/Descubrir (obra de encendido, 31-jul) --------------------------
// Con el motor v5 activo las pestanas Recetas y Descubrir navegan el banco v5. Todo sale de
// datos reales del banco: nombre previsualizado con la opcion POR DEFECTO del eje (sin mesa
// real detras), variantes = resto de alternativas, guarnicion de ejemplo de `combinaciones`.
// Las categorias de Descubrir se derivan de campos reales (perfil_servicio.estilo, esfuerzo,
// temporada, region) — nunca contenido inventado. Los pasos v5 no llevan placeholders
// (verificado contra el banco entero: 0), no hay nada que resolver en ellos.
function lineaEje(id) {
  // tambien ejes de UNA sola opcion (croquetas-caseras: relleno=jamon-serrano) — el nombre
  // se resuelve con esa opcion igual que hace construirMenu via eleccionesDe
  var out = null;
  (C.lineasDeElab[id] || []).forEach(function (l) {
    if (!out && l.papel === 'intercambiable' && (l.alternativas || []).length) out = l;
  });
  return out;
}

function fichaCatalogo(e) {
  var l = lineaEje(e.id);
  var op = l ? C.opcionPorDefecto(l) : null;
  return { v5: true, id: e.id, nombre: resolverNombre(e, op), foto: e.foto || null,
    tiempo_min: e.tiempo_min || null, esfuerzo: e.esfuerzo || null, apta: e.apta || [] };
}

function catalogoRecetas() {
  return d.elaboraciones.filter(function (e) { return e.tipo === 'principal' && BLOQUEADAS.indexOf(e.id) < 0; })
    .map(fichaCatalogo);
}

function previsualizarElaboracion(id) {
  var e = C.elabIdx[id];
  if (!e || e.tipo !== 'principal') return null;
  var ficha = fichaCatalogo(e);
  var l = lineaEje(id);
  var op = l ? C.opcionPorDefecto(l) : null;
  ficha.pasos = e.pasos || [];
  ficha.tips = e.tips || [];
  ficha.variantes = l ? l.alternativas.filter(function (o) { return o !== op; }).slice(0, 3)
    .map(function (o) { return C.alimIdx[o] ? C.alimIdx[o].nombre : o; }) : [];
  // guarnicion de ejemplo REAL: primera base de hidrato admitida por `combinaciones` + el
  // tipo de fibra que la tabla admite para este principal
  var regla = combIdx[id];
  var acomp = [];
  if (regla) {
    var h = (regla.admite_base_hidrato || [])[0];
    if (h && C.elabIdx[h]) acomp.push(C.elabIdx[h].nombre.toLowerCase());
    if (regla.admite_base_fibra === 'ensalada' || regla.admite_base_fibra === 'ambas') acomp.push('ensalada');
    else if (regla.admite_base_fibra === 'verdura') acomp.push('verdura');
  }
  ficha.acompanamientoEjemplo = acomp;
  return ficha;
}

// --- historial v5 sincronizado (obra de encendido F1.1, 31-jul) ---------------------------
// El historial vive KEYED POR SEMANA SERVIDA — { semanas: { semanaISO: [{e, g}] } } — nunca
// como array crudo: la fusion entre dispositivos es UNION por clave de semana. Dos
// dispositivos que archivan la misma semana escriben contenido identico (el plan viaja
// compartido por el estado sincronizado y el motor es determinista), asi que el LWW dentro
// de una clave es inocuo; semanas distintas se suman. El doc remoto es
// families/{id}/meta/historial (cubierto por la regla meta/{doc} vigente — sin cambio de
// reglas) y JAMAS va dentro del blob meta/estado (LWW de blob = el motivo del hallazgo 5).
var MAX_SEMANAS_HISTORIAL = 26; // ~medio año: sobra para recencia (14d), descubrimiento y guarniciones (15d)

function serializarHistorialSemana(plan) {
  if (!plan || !plan.servicios) return null;
  return plan.servicios.map(function (s) { return { e: s.elaboracion, g: s.guarniciones || [] }; });
}

function podarHistorial(semanas) {
  var claves = Object.keys(semanas || {}).sort();
  if (claves.length <= MAX_SEMANAS_HISTORIAL) return semanas || {};
  var out = {};
  claves.slice(-MAX_SEMANAS_HISTORIAL).forEach(function (k) { out[k] = semanas[k]; });
  return out;
}

// semanas -> las dos entradas planas que consume generarSemana. Las claves ISO ordenan
// lexicograficamente = cronologicamente; el ultimo servicio del array es el inmediatamente
// anterior al dia 1 de la semana nueva (mismo convenio que las claves de dispositivo viejas).
function aplanarHistorial(semanas) {
  var historial = [], guarniciones = [];
  Object.keys(semanas || {}).sort().forEach(function (k) {
    (semanas[k] || []).forEach(function (s) {
      historial.push(s.e);
      guarniciones.push(s.g || []);
    });
  });
  return { historial: historial, guarniciones: guarniciones };
}

// Fusion local↔remoto: union por clave; en colision gana el REMOTO (es la verdad compartida
// y el contenido deberia ser identico por determinismo). soloLocales = semanas que este
// dispositivo tiene y el doc remoto no — el caller las re-empuja (write-behind con merge).
function fusionarHistorial(localSemanas, remotoSemanas) {
  var out = {}, soloLocales = [];
  Object.keys(localSemanas || {}).forEach(function (k) { out[k] = localSemanas[k]; });
  Object.keys(remotoSemanas || {}).forEach(function (k) { out[k] = remotoSemanas[k]; });
  Object.keys(localSemanas || {}).forEach(function (k) {
    if (!(remotoSemanas || {})[k]) soloLocales.push(k);
  });
  return { semanas: podarHistorial(out), soloLocales: soloLocales.sort() };
}

// Historico plan/{semanaISO} de un plan v5 — decision + hechos servidos, SIN prosa
// re-derivable (nombre/pasos/ingredientes salen del banco; el historico es el registro
// honesto de lo que se sirvio). Espejo v5 del serializarPlanHistorico de engine.js: el
// write-behind de sync.js es motor-agnostico y guarda lo que le den.
function menuParaHistoricoV5(menu) {
  if (!menu) return null;
  return {
    principalId: menu.principalId,
    par: menu.par || null,
    seleccionEje: menu.seleccionEje || null,
    complementarias: (menu.complementarias || []).map(function (c) { return { id: c.id, seleccionEje: c.seleccionEje || null }; }),
    postre: menu.postre ? menu.postre.id : null,
    comboClave: menu.comboClave || null,
    posicionGuarnicion: menu.posicionGuarnicion != null ? menu.posicionGuarnicion : null,
    fracciones: menu.fracciones || [],
    adaptaciones: menu.adaptaciones || [],
    categorias: menu.categorias || [],
    kcalTotal: menu.kcalTotal != null ? menu.kcalTotal : null,
    kcalPorComensal: menu.kcalPorComensal || []
  };
}

function serializarPlanHistorico(plan) {
  if (!plan || !plan.semanaISO) return null;
  return {
    semanaISO: plan.semanaISO,
    motor: 'v5',
    dias: (plan.dias || []).map(function (dd) {
      return {
        fecha: dd.fecha,
        comida: menuParaHistoricoV5(dd.comida && dd.comida.menu),
        cena: menuParaHistoricoV5(dd.cena && dd.cena.menu)
      };
    })
  };
}

// Mismo espiritu que categoriasDescubrir v3 (fijas delante + rotacion diaria determinista),
// con los tests sobre campos v5 reales. Sin fotos por plato en v5 (0/92, decision: fase API
// posterior) — las 3 categorias con asset estatico propio lo conservan; el resto, degradado.
var CATEGORIAS_DESCUBRIR_V5 = [
  { id: 'ensaladas', kicker: 'Frescas', titulo: 'Ensaladas frescas para el calor', foto: 'assets/descubrir/frescas.jpg', test: function (e) { return (e.perfil_servicio || {}).estilo === 'ensalada'; } },
  { id: 'rapidas', kicker: 'En poco tiempo', titulo: 'Ideas para cuando no hay tiempo', foto: 'assets/descubrir/rapidas.jpg', test: function (e) { return e.esfuerzo === 'rapido'; } },
  { id: 'guisos', kicker: 'Cuchara', titulo: 'Potajes y guisos de toda la vida', foto: 'assets/descubrir/potajes.jpg', test: function (e) { return (e.perfil_servicio || {}).estilo === 'guiso'; } },
  { id: 'arroces', kicker: 'Arroces', titulo: 'De la paella al arroz caldoso', test: function (e) { return (e.perfil_servicio || {}).estilo === 'arroz'; } },
  { id: 'horno', kicker: 'Al horno', titulo: 'El horno trabaja por ti', test: function (e) { return (e.perfil_servicio || {}).estilo === 'horno'; } },
  { id: 'tierra', kicker: 'De la tierra', titulo: 'Recetas con raíz regional', test: function (e) { return !!e.region; } }
];
var PINNED_DESCUBRIR_V5 = ['ensaladas', 'rapidas', 'guisos'];

function categoriasDescubrir(fecha, ocultas) {
  var excl = {};
  (ocultas || []).forEach(function (id) { excl[id] = true; });
  var disponibles = d.elaboraciones.filter(function (e) {
    return e.tipo === 'principal' && !excl[e.id] && BLOQUEADAS.indexOf(e.id) < 0;
  });
  var estacion = temporadaDe(fecha);
  var pool = CATEGORIAS_DESCUBRIR_V5.slice();
  pool.unshift({
    id: 'temporada', kicker: 'De temporada',
    titulo: estacion === 'verano' ? 'Recetas fresquitas para el verano' : 'Recetas de cuchara para los días fríos',
    test: function (e) { return e.temporada === estacion; }
  });
  var conCandidatas = pool.map(function (cat) {
    var candidatas = disponibles.filter(cat.test);
    if (!candidatas.length) return null;
    if (cat.id === 'rapidas') candidatas = candidatas.slice().sort(function (a, b) { return (a.tiempo_min || 0) - (b.tiempo_min || 0); });
    return { id: cat.id, kicker: cat.kicker, titulo: cat.titulo, foto: cat.foto || null, candidatas: candidatas.map(fichaCatalogo) };
  }).filter(function (x) { return x; });
  if (!conCandidatas.length) return [];

  var pinned = PINNED_DESCUBRIR_V5.map(function (id) { return conCandidatas.filter(function (c) { return c.id === id; })[0]; }).filter(function (x) { return x; });
  var pinnedIds = pinned.map(function (c) { return c.id; });
  var resto = conCandidatas.filter(function (c) { return pinnedIds.indexOf(c.id) === -1; });
  var diaNum = Math.floor(new Date(fecha + 'T00:00:00').getTime() / (24 * 3600 * 1000));
  var offsetResto = resto.length ? diaNum % resto.length : 0;
  var restoRotado = resto.slice(offsetResto).concat(resto.slice(0, offsetResto));
  return pinned.concat(restoRotado).map(function (cat) {
    return { kicker: cat.kicker, titulo: cat.titulo, foto: cat.foto, candidatas: cat.candidatas };
  });
}

// --- generacion de la semana ---------------------------------------------------------------
// generarSemana(estado, fechaLunes, historial, opts) -> plan con la MISMA forma de slot que v3
// (dias[].comida = { menu } | null) para que la UI lo consuma con adaptacion minima.
//   historial: ids de elaboracion v5 ya servidos (orden cronologico) — lo gestiona el caller
//   en su propia clave (NUNCA en el estado sincronizado: v3 sigue siendo produccion).
//   opts.excluir: { dia (1-7), turno, id } — "otro menu" (reensambla ese slot sin ese plato;
//   los slots anteriores no cambian por determinismo, los siguientes se re-derivan).
function generarSemana(estado, fechaLunes, historial, opts) {
  opts = opts || {};
  var fechaRef = fechaLunes;
  var familia = estado.familia || [];
  var mesaFamilia = familia.map(function (m) { return { nombre: m.nombre, perfil: perfilDe(m) }; });

  var presentesSlot = {};
  for (var i = 0; i < 7; i++) {
    ['comida', 'cena'].forEach(function (turno) {
      presentesSlot[i + '|' + turno] = presentesEnServicio(estado, fechaISOmas(fechaLunes, i), i, turno, fechaRef);
    });
  }

  var favoritos = (estado.favoritas || []).filter(function (id) { return C.elabIdx[id]; });
  var noMeGusta = derivarNoMeGusta(estado);

  // memoria de guarniciones (regla "nueva > repetida", 31-jul): id -> ultimo dia de uso.
  // opts.historialGuarniciones = arrays de ids por servicio, cronologico (el ultimo = el
  // servicio anterior al dia 1) — mismo convenio de dias hacia atras que el historial del
  // selector (dos servicios por dia).
  var guarnUso = {};
  var hg = opts.historialGuarniciones || [];
  hg.forEach(function (ids, i) {
    var j = hg.length - 1 - i;
    var diaH = -Math.floor(j / 2);
    (ids || []).forEach(function (g) {
      if (guarnUso[g] == null || diaH > guarnUso[g]) guarnUso[g] = diaH;
    });
  });

  var saltados = {};
  var filtro = function (idElab, par, dia, turno) {
    if (opts.excluir && opts.excluir.dia === dia && opts.excluir.turno === turno && opts.excluir.id === idElab) return false;
    var presentes = presentesSlot[(dia - 1) + '|' + turno];
    if (!presentes || !presentes.length) return true;   // slot vacio: no se restringe
    var esFinde = ((dia - 1) % 7) >= 5;
    var ok = esViable(idElab, par, turno, esFinde, presentes, fechaRef);
    if (!ok) saltados[idElab] = true;
    return ok;
  };

  var r = selector.generarMenu({
    mesa: mesaFamilia, dias: 7, favoritos: favoritos, noMeGusta: noMeGusta,
    historial: historial || [],
    opciones: { kcal: filtro, temporada: temporadaDe(fechaLunes), excluidos: excluidosDe(estado) }
  });

  var dias = [];
  for (var di = 0; di < 7; di++) dias.push({ fecha: fechaISOmas(fechaLunes, di), comida: null, cena: null });

  var guarnPorServicio = {};                             // 'dia|turno' -> ids servidos (para el caller)
  r.servicios.forEach(function (s) {
    var diaIndex = s.dia - 1;
    if (diaIndex < 0 || diaIndex > 6) return;
    var presentes = presentesSlot[diaIndex + '|' + s.turno];
    if (!presentes || !presentes.length) return;        // nadie en casa: hueco vacio, como v3
    var esFinde = diaIndex >= 5;
    var ctx = {
      principalId: s.elaboracion, par: s.par, presentes: presentes, turno: s.turno,
      esFinde: esFinde, fechaRef: fechaRef, categorias: s.categorias, descubrimiento: s.descubrimiento,
      postrePreferido: diaIndex === 5 ? 'postre-yogur' : 'postre-fruta',
      guarnUso: guarnUso, dia: s.dia
    };
    var res = resolverServicio(ctx);
    var menu;
    if (!res) {
      // el selector lo sirvio pese al filtro (fallback kcal-fuera-de-banda): mejor esfuerzo —
      // combo mas cercano sin garantia de banda, con la fraccion mas cercana admisible
      res = mejorEsfuerzo(ctx);
      if (!res) return;                                  // sin combinacion que cubra los 3 ejes
      menu = construirMenu(res, ctx);
      menu.fueraDeBanda = true;
    } else {
      menu = construirMenu(res, ctx);
    }
    dias[diaIndex][s.turno] = { menu: menu };
    // registrar las guarniciones servidas: alimentan la regla en los slots siguientes
    var gIds = menu.complementarias.map(function (c) { return c.id; });
    gIds.forEach(function (g) { if (guarnUso[g] == null || s.dia > guarnUso[g]) guarnUso[g] = s.dia; });
    guarnPorServicio[s.dia + '|' + s.turno] = gIds;
  });

  var avisos = r.avisos.slice();
  var idsSaltados = Object.keys(saltados).sort();
  if (idsSaltados.length) avisos.push({
    tipo: 'kcal-plato-saltado', elaboraciones: idsSaltados,
    msg: 'platos saltados por banda kcal para esta mesa (racion que no cierra): ' + idsSaltados.join(', ')
  });

  return {
    motor: 'v5', semanaISO: fechaLunes, dias: dias, avisos: avisos, stats: r.stats,
    servicios: r.servicios.map(function (s) {
      return { dia: s.dia, turno: s.turno, elaboracion: s.elaboracion, par: s.par,
        guarniciones: guarnPorServicio[s.dia + '|' + s.turno] || [] };
    })
  };
}

// Mejor esfuerzo cuando NINGUNA combinacion cierra la banda de todos (slot con aviso
// kcal-fuera-de-banda del selector): minimiza la desviacion total, fraccion valida mas cercana.
function mejorEsfuerzo(ctx) {
  var parAlimento = ctx.par ? ctx.par.split('|')[0] : null;
  var mesa = ctx.presentes.map(function (m) { return { nombre: m.nombre, perfil: perfilDe(m) }; });
  if (!selector.sirveAMesa(ctx.principalId, mesa)) return null;
  var aptoYSirve = function (id) {
    var el = C.elabIdx[id];
    if (!el) return false;
    if (el.apta && el.apta.indexOf(ctx.turno) < 0) return false;
    return selector.sirveAMesa(id, mesa);
  };
  var regla = combIdx[ctx.principalId];
  var hidratos = (regla ? (regla.admite_base_hidrato || []) : []).filter(aptoYSirve);
  var fibraTipo = regla ? regla.admite_base_fibra : 'ninguna';
  var fibras = [];
  if (fibraTipo === 'ensalada' || fibraTipo === 'ambas') fibras = fibras.concat(SEC_ENSALADA);
  if (fibraTipo === 'verdura' || fibraTipo === 'ambas') fibras = fibras.concat(SEC_VERDURA);
  fibras = fibras.filter(aptoYSirve);
  var postres = C.POSTRES.filter(aptoYSirve);
  if (!postres.length) return null;
  var maskP = MASK_EJE[ctx.principalId] || 0;

  var mejor = null;
  var conH = [null].concat(hidratos), conF = [null].concat(fibras);
  conH.forEach(function (h) {
    conF.forEach(function (f) {
      var mask = maskP | (h ? MASK_EJE[h] : 0) | (f ? MASK_EJE[f] : 0);
      if (mask !== 7) return;
      postres.forEach(function (postre) {
        var ids = [ctx.principalId];
        if (h) ids.push(h);
        if (f) ids.push(f);
        ids.push(postre);
        var porMiembro = [], desvio = 0;
        ctx.presentes.forEach(function (m) {
          var quien = CAL.edadDe(m, ctx.fechaRef) < CAL.EDAD_MENOR ? 'nino' : 'adulto';
          var elec = eleccionesDe(ids, parAlimento, perfilDe(m));
          var t = sumarElabs(ids, quien, elec, 0.5);
          var k0 = CAL.kcalDe(t);
          var b = bandaMemo(m, ctx.turno, ctx.esFinde, ctx.fechaRef);
          var minF = CAL.minFraccion(piezaMemo(ids, parAlimento || '', quien), quien);
          var frac = CAL.fraccionServible(k0, [b.min, b.max], minF, CAL.FACTOR_PERSONA_MAX);
          if (!frac) {
            // fraccion admisible que menos se desvia de la banda
            var candidatas = CAL.FRACCIONES.filter(function (x) { return x.f >= minF - 1e-9 && x.f <= CAL.FACTOR_PERSONA_MAX + 1e-9; });
            frac = candidatas[0];
            var mejorDesv = Infinity;
            candidatas.forEach(function (x) {
              var k = k0 * x.f;
              var dv = k < b.min ? b.min - k : (k > b.max ? k - b.max : 0);
              if (dv < mejorDesv) { mejorDesv = dv; frac = x; }
            });
            desvio += mejorDesv;
          }
          porMiembro.push({ miembro: m, quien: quien, elecciones: elec, k0: k0, fraccion: frac, kcal: k0 * frac.f, banda: b, proteina: t.proteina * frac.f, sueloProteina: CAL.sueloProteina(m, ctx.turno, ctx.esFinde, ctx.fechaRef) });
        });
        if (!mejor || desvio < mejor.desvio) mejor = { combo: { ids: ids, hidrato: h, fibra: f, postre: postre }, ids: ids, P: { pos: 0.5 }, porMiembro: porMiembro, desvio: desvio, rank: [9, 9, 9, 9] };
      });
    });
  });
  return mejor;
}

// --- cambiar plato -------------------------------------------------------------------------
// modo 'otro-menu': regenera la semana excluyendo el principal actual en ese slot. Por
//   determinismo los slots anteriores no cambian; los posteriores se re-derivan (variedad y
//   cuotas consistentes — el equivalente v5 de regenerarDesde). Devuelve { plan }.
// modo 'solo-complementaria': mismo principal y par, siguiente combinacion viable (excluye la
//   actual). Devuelve { menu } (o el mismo si no hay otra).
// memoria de guarniciones de un plan ya construido (para cambiarPlato): historial archivado
// (dias negativos) + lo servido esta semana
function guarnUsoDePlan(plan, historialGuarniciones) {
  var uso = {};
  var hg = historialGuarniciones || [];
  hg.forEach(function (ids, i) {
    var j = hg.length - 1 - i;
    var diaH = -Math.floor(j / 2);
    (ids || []).forEach(function (g) { if (uso[g] == null || diaH > uso[g]) uso[g] = diaH; });
  });
  (plan.servicios || []).forEach(function (s) {
    (s.guarniciones || []).forEach(function (g) { if (uso[g] == null || s.dia > uso[g]) uso[g] = s.dia; });
  });
  return uso;
}

function cambiarPlato(estado, plan, diaIndex, turno, modo, historial, fechaLunes, historialGuarniciones) {
  var slot = plan.dias[diaIndex] && plan.dias[diaIndex][turno];
  if (!slot || !slot.menu) return null;
  if (modo === 'otro-menu') {
    var nuevo = generarSemana(estado, fechaLunes || plan.semanaISO, historial, {
      excluir: { dia: diaIndex + 1, turno: turno, id: slot.menu.principalId },
      historialGuarniciones: historialGuarniciones
    });
    return { plan: nuevo };
  }
  if (modo === 'solo-complementaria') {
    var presentes = presentesEnServicio(estado, plan.dias[diaIndex].fecha, diaIndex, turno, plan.semanaISO);
    if (!presentes.length) return null;
    var ctx = {
      principalId: slot.menu.principalId, par: slot.menu.par, presentes: presentes, turno: turno,
      esFinde: diaIndex >= 5, fechaRef: plan.semanaISO, categorias: slot.menu.categorias,
      excluirCombo: slot.menu.comboClave,
      postrePreferido: diaIndex === 5 ? 'postre-yogur' : 'postre-fruta',
      // la guarnicion actual queda como "recien usada": la regla nueva>repetida empuja a otra
      guarnUso: guarnUsoDePlan(plan, historialGuarniciones), dia: diaIndex + 1
    };
    var res = resolverServicio(ctx);
    if (!res) return { menu: slot.menu };               // no hay otra combinacion viable: se queda
    return { menu: construirMenu(res, ctx) };
  }
  return null;
}

// Re-escala un slot YA elegido cuando cambian los presentes ("hoy no como"): mismo principal
// y mismo par — se re-cierra la banda para la mesa real (la guarnicion/postre pueden ajustarse,
// el plato no cambia). Equivalente v5 de reescalarMenuParaPresentes.
function reescalarServicio(estado, plan, diaIndex, turno) {
  var slot = plan.dias[diaIndex] && plan.dias[diaIndex][turno];
  if (!slot || !slot.menu) return null;
  var presentes = presentesEnServicio(estado, plan.dias[diaIndex].fecha, diaIndex, turno, plan.semanaISO);
  if (!presentes.length) return { menu: null };
  var ctx = {
    principalId: slot.menu.principalId, par: slot.menu.par, presentes: presentes, turno: turno,
    esFinde: diaIndex >= 5, fechaRef: plan.semanaISO, categorias: slot.menu.categorias,
    descubrimiento: slot.menu.descubrimiento,
    postrePreferido: diaIndex === 5 ? 'postre-yogur' : 'postre-fruta'
  };
  var res = resolverServicio(ctx) || mejorEsfuerzo(ctx);
  if (!res) return { menu: slot.menu };
  var menu = construirMenu(res, ctx);
  if (res.desvio) menu.fueraDeBanda = true;
  return { menu: menu };
}

// --- nevera --------------------------------------------------------------------------------
// "Con lo que hay": filtro INVERTIDO — disponibilidad primero. Montable = todas las lineas
// fijas del principal disponibles y el intercambiable con >=1 opcion disponible no vetada;
// casi-montable = falta exactamente UN alimento. Supuesto declarado: el aceite (naturaleza
// `grasa`) y las lineas `condimento` se asumen en casa — pedir marcar el aceite en la nevera
// seria ruido, no informacion.
function opcionesNevera(estado, plan, diaIndex, turno, disponibles, historial) {
  var presentes = presentesEnServicio(estado, plan.dias[diaIndex].fecha, diaIndex, turno, plan.semanaISO);
  if (!presentes.length) return { menu: null, opciones: [] };
  var mesa = presentes.map(function (m) { return { nombre: m.nombre, perfil: perfilDe(m) }; });
  var dispo = {};
  (disponibles || []).forEach(function (id) { dispo[id] = true; });
  var esFinde = diaIndex >= 5;
  var excluidos = excluidosDe(estado);

  var candidatos = [];
  d.elaboraciones.forEach(function (e) {
    if (e.tipo !== 'principal') return;
    if (excluidos.indexOf(e.id) >= 0) return;
    if ((e.apta || []).indexOf(turno) < 0) return;
    if (!selector.sirveAMesa(e.id, mesa)) return;
    var faltan = {};
    var lineas = C.lineasDeElab[e.id] || [];
    var okEje = true;
    lineas.forEach(function (l) {
      if (l.componente_id) {
        (C.lineasDeComp[l.componente_id] || []).forEach(function (s) {
          if (!s.alimento_id) return;
          var al = C.alimIdx[s.alimento_id];
          if (al && al.naturaleza === 'grasa') return;
          if (s.papel === 'condimento') return;
          if (!dispo[s.alimento_id]) faltan[s.alimento_id] = true;
        });
        return;
      }
      var al2 = l.alimento_id && C.alimIdx[l.alimento_id];
      if (l.papel === 'condimento' || (al2 && al2.naturaleza === 'grasa')) return;
      if (l.alimento_id) { if (!dispo[l.alimento_id]) faltan[l.alimento_id] = true; return; }
      var ops = (l.alternativas || []).filter(function (o) {
        return dispo[o] && mesa.every(function (c) { return !dietas.vetado(C.alimIdx[o], c.perfil); });
      });
      if (!ops.length) okEje = false;
    });
    var nFaltan = Object.keys(faltan).length;
    if (okEje && nFaltan === 0) candidatos.push({ id: e.id, falta: null });
    else if (okEje && nFaltan === 1) candidatos.push({ id: e.id, falta: Object.keys(faltan)[0] });
  });

  candidatos.sort(function (a, b) {
    if (!a.falta !== !b.falta) return a.falta ? 1 : -1;   // montables primero
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  var opciones = [];
  for (var i = 0; i < candidatos.length && opciones.length < 3; i++) {
    var cand = candidatos[i];
    // par: la primera proteina disponible del plato (o la por defecto si el plato es fijo)
    var ctx = {
      principalId: cand.id, par: null, presentes: presentes, turno: turno,
      esFinde: esFinde, fechaRef: plan.semanaISO,
      postrePreferido: diaIndex === 5 ? 'postre-yogur' : 'postre-fruta'
    };
    var res = resolverServicio(ctx) || mejorEsfuerzo(ctx);
    if (!res) continue;
    var menu = construirMenu(res, ctx);
    // faltaIngrediente = ID (contrato v3 de renderOpcionesNevera) + nombre resuelto aparte
    if (cand.falta) {
      menu.faltaIngrediente = cand.falta;
      menu.faltaIngredienteNombre = C.alimIdx[cand.falta] ? C.alimIdx[cand.falta].nombre : cand.falta;
    }
    opciones.push(menu);
  }
  return { menu: null, opciones: opciones };
}

// Checklist de la nevera: los alimentos que de verdad deciden si un plato se monta (lineas de
// principales, sin grasas ni condimentos), ordenados por nombre.
function alimentosNevera() {
  var usados = {};
  d.elaboraciones.forEach(function (e) {
    if (e.tipo !== 'principal') return;
    (C.lineasDeElab[e.id] || []).forEach(function (l) {
      if (l.papel === 'condimento') return;
      var ids = l.alimento_id ? [l.alimento_id] : (l.alternativas || []);
      ids.forEach(function (id) {
        var al = C.alimIdx[id];
        if (al && al.naturaleza !== 'grasa') usados[id] = al.nombre;
      });
    });
  });
  return Object.keys(usados).sort(function (a, b) { return usados[a] < usados[b] ? -1 : 1; })
    .map(function (id) { return { id: id, nombre: usados[id] }; });
}

// --- lista de la compra sobre un plan v5 ---------------------------------------------------
// Agrega los `ingredientes` (gramos reales por comensal) de todos los slots. Devuelve la
// `naturaleza` de cada alimento — el equivalente v5 de la categoria de v3; el mapeo a grupos
// de la vista es cosa de la UI. `filtro` opcional: { dia (0-6, solo ese dia), soloCena }.
function listaCompra(plan, filtro) {
  var acc = {};
  (plan.dias || []).forEach(function (dia, i) {
    if (filtro && filtro.dia != null && i !== filtro.dia) return;
    ['comida', 'cena'].forEach(function (turno) {
      if (filtro && filtro.soloCena && turno === 'comida') return;
      var slot = dia[turno];
      if (!slot || !slot.menu || !slot.menu.ingredientes) return;
      slot.menu.ingredientes.forEach(function (it) {
        if (!acc[it.id]) acc[it.id] = { id: it.id, nombre: it.nombre, gramos: 0, naturaleza: it.naturaleza, unidad_g: it.unidad_g };
        acc[it.id].gramos += it.gramos;
      });
    });
  });
  return Object.keys(acc).sort().map(function (k) {
    var it = acc[k];
    // `unidad_g` se lee del BANCO, no del plan congelado: es propiedad del alimento, no de la
    // foto del menú. Un plan generado antes de que el dato existiera lo lleva a null para
    // siempre, y la compra seguiría diciendo "416 g de yogur" en vez de "4 yogures" hasta la
    // siguiente regeneración (cazado el 01-ago al dar de alta yogur/huevo). El valor del plan
    // queda de reserva por si el alimento ya no estuviera en el banco.
    var unidadG = (C.alimIdx[it.id] || {}).unidad_g || it.unidad_g;
    var unidades = unidadG ? Math.ceil(it.gramos / unidadG) : null;
    return { id: it.id, nombre: it.nombre, gramos: Math.round(it.gramos), naturaleza: it.naturaleza, unidades: unidades };
  });
}

var api = {
  generarSemana: generarSemana,
  cambiarPlato: cambiarPlato,
  reescalarServicio: reescalarServicio,
  opcionesNevera: opcionesNevera,
  alimentosNevera: alimentosNevera,
  listaCompra: listaCompra,
  catalogoRecetas: catalogoRecetas,
  previsualizarElaboracion: previsualizarElaboracion,
  categoriasDescubrir: categoriasDescubrir,
  serializarHistorialSemana: serializarHistorialSemana,
  aplanarHistorial: aplanarHistorial,
  fusionarHistorial: fusionarHistorial,
  podarHistorial: podarHistorial,
  serializarPlanHistorico: serializarPlanHistorico,
  MAX_SEMANAS_HISTORIAL: MAX_SEMANAS_HISTORIAL,
  // internos expuestos para la suite (testeabilidad, mismo criterio que engine.js v3)
  resolverServicio: resolverServicio,
  esViable: esViable,
  eleccionesDe: eleccionesDe,
  derivarNoMeGusta: derivarNoMeGusta,
  presentesEnServicio: presentesEnServicio,
  perfilDe: perfilDe,
  temporadaDe: temporadaDe,
  construirMenu: construirMenu
};

if (typeof window !== 'undefined') window.E3MotorV5 = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;

})();
