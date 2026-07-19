/* ============================================================
   e3Foods — engine.js
   Motor determinista puro: sin DOM, sin lectura de localStorage,
   sin globals mutables. Testeable en consola / node.

   Todas las funciones que necesitan el banco de recetas/ingredientes
   lo reciben como parámetro explícito `banco` ({ingredientes, plantillas,
   categorias_cuota}) — la SPEC muestra firmas abreviadas
   (p.ej. `resolverPlato(plantilla, seleccion, presentes)`); aquí se añade
   `banco` (y `estado` donde hace falta leer familia/patrón) como parámetro
   explícito adicional en vez de leerlo de un global, para que el motor
   siga siendo puro y comprobable fuera del navegador.

   Convención de índice de día: 0=lunes … 6=domingo (semana ISO, empieza
   en lunes). `patron.comida[i]` / `patron.cena[i]` usan el mismo índice.
   ============================================================ */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------
  // Constantes del modelo nutricional (ver SPEC.md y RESEARCH_ALIMENTACION_ESPANA.md)
  // ---------------------------------------------------------------

  // § reparto de kcal diarias entre comidas — SPEC: comida 35%, cena 30% del día de cada presente
  var REPARTO_KCAL = { comida: 0.35, cena: 0.30 };

  // Factor de actividad para Mifflin-St Jeor (adultos/adolescentes con peso+altura) — SPEC literal
  var FACTOR_ACTIVIDAD_MIFFLIN = { baja: 1.2, media: 1.55, alta: 1.725 };

  // Factor de actividad para la banda orientativa (menores, o adultos sin peso/altura) —
  // canibalizado de e3foods.html; deliberadamente más suave que el de Mifflin porque la
  // banda ya parte de un valor "actividad media" de referencia (WHO/DRI), no de un BMR puro.
  var FACTOR_ACTIVIDAD_BANDA = { baja: 1.0, media: 1.2, alta: 1.4 };

  // SPEC (resolverPlato): "ración niño si <12" — mismo umbral se reutiliza para decidir si
  // se aplica Mifflin-St Jeor o banda en necesidadKcalDia (banda siempre para <12).
  var EDAD_MENOR = 12;

  // aptitud dietética derivada de categoría — SPEC: "vegetariana: legumbre/huevo/lacteo/
  // cereal/tuberculo/verdura/fruta" (+ 'otro' para asimilados tipo tofu/seitán)
  var CATEGORIAS_VEGETARIANA_OK = { legumbre: 1, huevo: 1, lacteo: 1, cereal: 1, tuberculo: 1, verdura: 1, fruta: 1, otro: 1 };
  var CATEGORIAS_SIN_PESCADO_EXCLUIDAS = { 'pescado-blanco': 1, 'pescado-azul': 1, marisco: 1 };
  // 'sin-cerdo' no tiene categoría propia en el esquema (carne-blanca/carne-roja no distinguen
  // especie) — heurística mínima por id/nombre de ingrediente, documentada como limitación.
  var IDS_CERDO_CONOCIDOS = ['cerdo', 'lomo', 'panceta', 'jamon', 'chorizo', 'salchicha', 'beicon', 'morcilla', 'costillas-cerdo', 'secreto', 'presa', 'solomillo-cerdo', 'lacon', 'compango', 'ternera-rellena'];

  // ---------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------

  // anioNacimiento sustituye a la fecha completa (Roger 2026-07-13, alta más ágil) — edad
  // aproximada anioActual - anioNacimiento, orientativo (ver SPEC.md § Estado).
  function edadEnAnios(anioNacimiento, hoy) {
    if (!anioNacimiento) return 30; // defensivo — año de nacimiento es obligatorio en el alta de miembro
    var anioActual = (hoy ? new Date(hoy) : new Date()).getFullYear();
    return anioActual - anioNacimiento;
  }

  function capitaliza(s) {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // Formatea un Date como YYYY-MM-DD usando componentes LOCALES (getFullYear/
  // getMonth/getDate), nunca toISOString().slice(0,10) — toISOString() convierte
  // a UTC, y medianoche local en una zona adelantada a UTC (p.ej. CEST, UTC+2)
  // cae en el día UTC ANTERIOR, desplazando toda la semana un día. Bug real
  // encontrado y corregido en verificación (2026-07-13, ver STATUS/resumen).
  function fechaLocalISO(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function fechaISO(fechaBase, offsetDias) {
    var d = new Date(fechaBase + 'T00:00:00');
    d.setDate(d.getDate() + offsetDias);
    return fechaLocalISO(d);
  }

  function lunesDeEstaSemana(hoy) {
    var d = new Date(hoy || new Date());
    var diaJs = d.getDay(); // 0=domingo … 6=sábado
    var offsetALunes = diaJs === 0 ? -6 : 1 - diaJs;
    d.setDate(d.getDate() + offsetALunes);
    return fechaLocalISO(d);
  }

  function esFinDeSemana(diaIndex) { return diaIndex >= 5; } // 5=sábado, 6=domingo

  function vetosDe(miembros) {
    var set = {};
    (miembros || []).forEach(function (m) { (m.vetos || []).forEach(function (id) { set[id] = 1; }); });
    return set;
  }

  function estaEn(set, id) { return !!set[id]; }

  // Ids de ingrediente ÚNICOS de una selección — un plato-único de legumbre ocupa
  // eje proteína e hidrato A LA VEZ con el MISMO id (p.ej. {proteina:'alubias-blancas',
  // hidrato:'alubias-blancas'}, ver SPEC.md). Sin deduplicar, kcal/gramos/cuotas
  // contarían esa ración dos veces (bug real encontrado en verificación con el
  // banco de datos/recetas.js: "alubias-guiso" define ambos ejes con el mismo id).
  function idsUnicosDeSeleccion(seleccion) {
    var vistos = {};
    var lista = [];
    Object.keys(seleccion || {}).forEach(function (eje) {
      var id = seleccion[eje];
      if (id && !vistos[id]) { vistos[id] = true; lista.push(id); }
    });
    return lista;
  }

  // ---------------------------------------------------------------
  // 1. Necesidad calórica individual — Mifflin-St Jeor × actividad, o
  //    banda orientativa por edad/sexo para menores / sin peso+altura.
  // ---------------------------------------------------------------
  function necesidadKcalDia(miembro) {
    var edad = edadEnAnios(miembro.anioNacimiento);
    var sexo = miembro.sexo || 'mujer';
    var actividad = miembro.actividad || 'media';
    var esMenor = edad < EDAD_MENOR;

    if (!esMenor && miembro.peso && miembro.altura) {
      var bmr = 10 * miembro.peso + 6.25 * miembro.altura - 5 * edad + (sexo === 'hombre' ? 5 : -161);
      var factor = FACTOR_ACTIVIDAD_MIFFLIN[actividad] || FACTOR_ACTIVIDAD_MIFFLIN.media;
      return Math.round(bmr * factor);
    }

    // banda orientativa (WHO/DRI aprox.) — canibalizada de e3foods.html
    var base;
    if (edad < 4) base = 1000;
    else if (edad < 9) base = 1200;
    else if (edad < 14) base = sexo === 'hombre' ? 1600 : 1400;
    else if (edad < 19) base = sexo === 'hombre' ? 2000 : 1800;
    else if (edad < 31) base = sexo === 'hombre' ? 2400 : 2000;
    else if (edad < 51) base = sexo === 'hombre' ? 2200 : 1800;
    else if (edad < 71) base = sexo === 'hombre' ? 2000 : 1600;
    else base = sexo === 'hombre' ? 1800 : 1600;

    var factorBanda = FACTOR_ACTIVIDAD_BANDA[actividad] || FACTOR_ACTIVIDAD_BANDA.media;
    return Math.round(base * factorBanda);
  }

  // ---------------------------------------------------------------
  // 2. Agregado familiar por comida — SPEC: comida 35%, cena 30% de cada presente, sumado.
  // ---------------------------------------------------------------
  function kcalObjetivo(miembrosPresentes, tipoComida) {
    var reparto = REPARTO_KCAL[tipoComida];
    if (!reparto || !miembrosPresentes || !miembrosPresentes.length) return 0;
    var total = 0;
    miembrosPresentes.forEach(function (m) { total += necesidadKcalDia(m) * reparto; });
    return Math.round(total);
  }

  // ---------------------------------------------------------------
  // 3. Resolución de un plato concreto: nombre, kcal por comensal e
  //    ingredientes con cantidades (para la lista de la compra).
  // ---------------------------------------------------------------

  // nombre + pasos resueltos para UNA selección de ejes dada — extraído para
  // reutilizarlo tal cual con la selección adaptada de cada miembro (mesa
  // mixta), no solo con la compartida.
  function resolverNombreYPasos(plantilla, seleccionUsada, banco) {
    var nombre = plantilla.nombre_patron;
    var sustituciones = {};
    Object.keys(plantilla.ejes || {}).forEach(function (eje) {
      var id = seleccionUsada[eje];
      var ing = banco.ingredientes[id];
      var texto = ing ? capitaliza(ing.nombre) : (id || ('{' + eje + '}'));
      sustituciones[eje] = texto;
      nombre = nombre.split('{' + eje + '}').join(texto);
    });
    var pasos = (plantilla.pasos || []).map(function (paso) {
      var texto = paso;
      Object.keys(sustituciones).forEach(function (eje) { texto = texto.split('{' + eje + '}').join(sustituciones[eje]); });
      return texto;
    });
    return { nombre: nombre, pasos: pasos, sustituciones: sustituciones };
  }

  // adaptaciones (Roger 2026-07-14, bug real encontrado por Roger: un miembro
  // con tofu asignado por mesa mixta no aparecía en la lista de la compra).
  // ANTES: se ignoraban aquí por completo — todo el mundo se contaba con la
  // selección compartida, aunque algún presente tuviera un sustituto por
  // dieta. Resultado: el ingrediente adaptado nunca se compraba y el
  // compartido se compraba de más (ración de gente que no lo iba a comer).
  // AHORA: cada miembro cuenta con SU propia selección efectiva (compartida,
  // salvo el eje adaptado si lo tiene) tanto para gramos/kcal como para los
  // pasos — la receta explica las dos cocciones, no solo la compartida.
  function resolverPlato(plantilla, seleccion, presentes, banco, adaptaciones) {
    adaptaciones = adaptaciones || [];
    var base = resolverNombreYPasos(plantilla, seleccion, banco);

    var mapaAdaptaciones = {};
    adaptaciones.forEach(function (a) { mapaAdaptaciones[a.miembroId] = a; });

    function seleccionEfectiva(miembroId) {
      var a = mapaAdaptaciones[miembroId];
      if (!a) return seleccion;
      var copia = {};
      Object.keys(seleccion).forEach(function (eje) { copia[eje] = seleccion[eje]; });
      copia[a.eje] = a.valor;
      return copia;
    }

    var pasosAdaptados = []; // [{miembroId, ingrediente, pasos}] — la "segunda cocción"
    (presentes || []).forEach(function (m) {
      var a = mapaAdaptaciones[m.id];
      if (!a) return;
      var alt = resolverNombreYPasos(plantilla, seleccionEfectiva(m.id), banco);
      pasosAdaptados.push({ miembroId: m.id, ingrediente: alt.sustituciones[a.eje], pasos: alt.pasos });
    });

    var ingredientesCompra = []; // [{id, gramos}] — estable por id (para checks persistentes)
    var kcalPorComensal = [];
    var kcalTotal = 0;

    (presentes || []).forEach(function (miembro) {
      var esNino = edadEnAnios(miembro.anioNacimiento) < EDAD_MENOR;
      var kcalMiembro = plantilla.kcal_extra || 0;
      idsUnicosDeSeleccion(seleccionEfectiva(miembro.id)).forEach(function (id) {
        var ing = banco.ingredientes[id];
        if (!ing) return;
        var gramos = esNino ? ing.racion_nino_g : ing.racion_adulto_g;
        kcalMiembro += gramos * ing.kcal_100g / 100;
        var linea = null;
        for (var i = 0; i < ingredientesCompra.length; i++) { if (ingredientesCompra[i].id === id) { linea = ingredientesCompra[i]; break; } }
        if (!linea) { linea = { id: id, gramos: 0 }; ingredientesCompra.push(linea); }
        linea.gramos += gramos;
      });
      kcalMiembro = Math.round(kcalMiembro);
      kcalPorComensal.push({ miembroId: miembro.id, kcal: kcalMiembro });
      kcalTotal += kcalMiembro;
    });

    return { nombre: base.nombre, kcalPorComensal: kcalPorComensal, kcalTotal: Math.round(kcalTotal), ingredientes: ingredientesCompra, pasos: base.pasos, pasosAdaptados: pasosAdaptados };
  }

  // ---------------------------------------------------------------
  // Dieta / mesa mixta — helpers
  // ---------------------------------------------------------------
  function categoriaExcluidaPorDieta(categoria, dieta, ingredienteId) {
    if (!dieta || dieta === 'omnivora') return false;
    if (dieta === 'vegetariana') return !CATEGORIAS_VEGETARIANA_OK[categoria];
    if (dieta === 'sin-pescado') return !!CATEGORIAS_SIN_PESCADO_EXCLUIDAS[categoria];
    if (dieta === 'sin-cerdo') {
      var idNorm = (ingredienteId || '').toLowerCase();
      return IDS_CERDO_CONOCIDOS.some(function (k) { return idNorm.indexOf(k) !== -1; });
    }
    return false;
  }

  function opcionAptaParaDieta(opciones, dieta, banco, vetosUnion) {
    var encontrada = null;
    (opciones || []).some(function (id) {
      if (estaEn(vetosUnion, id)) return false;
      var ing = banco.ingredientes[id];
      if (!ing) return false;
      if (categoriaExcluidaPorDieta(ing.categoria, dieta, id)) return false;
      encontrada = id;
      return true;
    });
    return encontrada;
  }

  function calcularAdaptaciones(plantilla, seleccion, presentes, banco, vetosUnion) {
    var adaptaciones = [];
    if (!plantilla.ejes || !plantilla.ejes.proteina) return adaptaciones;
    var idPrincipal = seleccion.proteina;
    var ingPrincipal = banco.ingredientes[idPrincipal];
    (presentes || []).forEach(function (m) {
      var dieta = m.dieta || 'omnivora';
      if (dieta === 'omnivora') return;
      if (ingPrincipal && !categoriaExcluidaPorDieta(ingPrincipal.categoria, dieta, idPrincipal)) return; // ya le vale la opción común
      var alt = opcionAptaParaDieta(plantilla.ejes.proteina, dieta, banco, vetosUnion);
      if (alt && alt !== idPrincipal) adaptaciones.push({ miembroId: m.id, eje: 'proteina', valor: alt });
    });
    return adaptaciones;
  }

  // ---------------------------------------------------------------
  // Presencia — restricción 1 (estructural por patrón + puntual del día)
  // ---------------------------------------------------------------
  // Menú del cole cargado (F1, Roger 2026-07-17): los niños comen SIEMPRE en
  // casa salvo que haya menú importado para esa fecha — ese mediodía comen en
  // el cole. Va al revés que el patrón: subir el menú desmarca a los menores
  // de esas comidas, sin tocar nada más; sin menú (verano), vuelven solos.
  // Exportado (audit 2026-07-20): app.js lo usa para que el avatar de un menor
  // excluido por cole no escriba una "ausencia fantasma" en ausenciasPuntuales
  // (un toggle ahí no puede cambiar el resultado — la exclusión vive en cole).
  function excluidoPorCole(estado, miembro, fecha, tipoComida) {
    return tipoComida === 'comida' &&
      !!(estado.cole && estado.cole.dias && estado.cole.dias[fecha]) &&
      edadEnAnios(miembro.anioNacimiento) < EDAD_MENOR;
  }

  function presentesEnComida(estado, fecha, diaIndex, tipoComida) {
    var ausenciasDia = (estado.ausenciasPuntuales && estado.ausenciasPuntuales[fecha] && estado.ausenciasPuntuales[fecha][tipoComida]) || [];
    return (estado.familia || []).filter(function (m) {
      var patronDia = (m.patron && m.patron[tipoComida]) ? m.patron[tipoComida][diaIndex] : 'casa';
      if (patronDia !== 'casa') return false; // ausencia estructural (fuera/cole)
      if (ausenciasDia.indexOf(m.id) !== -1) return false; // ausencia puntual
      if (excluidoPorCole(estado, m, fecha, tipoComida)) return false; // menú del cole (ver arriba)
      return true;
    });
  }

  // ---------------------------------------------------------------
  // Plantillas: catálogo disponible, viabilidad de mesa, combinatoria de ejes
  // ---------------------------------------------------------------
  // banco + recetas propias de la familia, sin filtrar — base común de
  // plantillasDisponibles/plantillaPorId y del banco de Recetas en ui.js
  function todasLasPlantillas(banco, estado) {
    return (banco.plantillas || []).concat((estado && estado.propias) || []);
  }

  function plantillasDisponibles(banco, estado) {
    var ocultas = {};
    (estado.ocultas || []).forEach(function (id) { ocultas[id] = 1; });
    return todasLasPlantillas(banco, estado).filter(function (p) { return !ocultas[p.id]; });
  }

  function plantillaPorId(banco, estado, id) {
    var todas = todasLasPlantillas(banco, estado);
    for (var i = 0; i < todas.length; i++) { if (todas[i].id === id) return todas[i]; }
    return null;
  }

  // restricción 2 (vetos) + restricción 3 (mesa mixta): ¿esta plantilla es viable para
  // los presentes dados, una vez descontados los ingredientes vetados por cualquiera?
  function plantillaViableParaMesa(plantilla, presentes, vetosUnion, banco) {
    var ejeOk = Object.keys(plantilla.ejes || {}).every(function (eje) {
      return (plantilla.ejes[eje] || []).some(function (id) { return !estaEn(vetosUnion, id); });
    });
    if (!ejeOk) return false;
    if (!plantilla.ejes || !plantilla.ejes.proteina) return true;
    return (presentes || []).every(function (m) {
      var dieta = m.dieta || 'omnivora';
      if (dieta === 'omnivora') return true;
      return !!opcionAptaParaDieta(plantilla.ejes.proteina, dieta, banco, vetosUnion);
    });
  }

  function combinacionesEjes(plantilla, vetosUnion) {
    var ejes = Object.keys(plantilla.ejes || {});
    var combos = [{}];
    ejes.forEach(function (eje) {
      var opciones = (plantilla.ejes[eje] || []).filter(function (id) { return !estaEn(vetosUnion, id); });
      var nuevas = [];
      combos.forEach(function (c) {
        opciones.forEach(function (id) {
          var copia = {};
          Object.keys(c).forEach(function (k) { copia[k] = c[k]; });
          copia[eje] = id;
          nuevas.push(copia);
        });
      });
      combos = nuevas;
    });
    return combos;
  }

  // ---------------------------------------------------------------
  // Variedad dura — restricción 4: ningún ingrediente de eje repetido el
  // mismo día ni en días consecutivos.
  // ---------------------------------------------------------------
  function usadosEnDia(dia) {
    var set = {};
    if (!dia) return set;
    ['comida', 'cena'].forEach(function (tipo) {
      var slot = dia[tipo];
      if (slot && slot.seleccion) Object.keys(slot.seleccion).forEach(function (eje) { set[slot.seleccion[eje]] = 1; });
    });
    return set;
  }

  function violaVariedad(seleccion, usadosHoy, usadosAyer) {
    return idsUnicosDeSeleccion(seleccion).some(function (id) {
      return estaEn(usadosHoy, id) || estaEn(usadosAyer, id);
    });
  }

  // ---------------------------------------------------------------
  // Cuotas semanales — restricción 5 (§6.1 del funcional / RESEARCH_ALIMENTACION_ESPANA)
  // ---------------------------------------------------------------
  function categoriasQueSuma(categoria) {
    var claves = [categoria];
    if (categoria === 'pescado-azul' || categoria === 'pescado-blanco') claves.push('pescado-total');
    return claves;
  }

  function violaMaximoCuota(seleccion, contador, cuotas, banco) {
    return idsUnicosDeSeleccion(seleccion).some(function (id) {
      var ing = banco.ingredientes[id];
      if (!ing) return false;
      return categoriasQueSuma(ing.categoria).some(function (clave) {
        var cuota = cuotas[clave];
        if (!cuota || cuota.max_sem == null) return false;
        return (contador[clave] || 0) + 1 > cuota.max_sem;
      });
    });
  }

  function puntuarCuotas(seleccion, contador, cuotas, banco, slotsRestantes) {
    var bonus = 0;
    idsUnicosDeSeleccion(seleccion).forEach(function (id) {
      var ing = banco.ingredientes[id];
      if (!ing) return;
      categoriasQueSuma(ing.categoria).forEach(function (clave) {
        var cuota = cuotas[clave];
        if (!cuota || !cuota.min_sem) return;
        var faltan = cuota.min_sem - (contador[clave] || 0);
        if (faltan > 0) bonus += 10 * (faltan / Math.max(1, slotsRestantes));
      });
    });
    return bonus;
  }

  function actualizarContadorCuotas(contador, seleccion, banco) {
    idsUnicosDeSeleccion(seleccion).forEach(function (id) {
      var ing = banco.ingredientes[id];
      if (!ing) return;
      categoriasQueSuma(ing.categoria).forEach(function (clave) { contador[clave] = (contador[clave] || 0) + 1; });
    });
  }

  function contadorInicialDesdeDias(diasPrevios, banco) {
    var contador = {};
    (diasPrevios || []).forEach(function (dia) {
      ['comida', 'cena'].forEach(function (tipo) {
        var slot = dia && dia[tipo];
        if (slot && slot.seleccion) actualizarContadorCuotas(contador, slot.seleccion, banco);
      });
    });
    return contador;
  }

  // días del plan con un hueco concreto vaciado — base del contador de cuotas
  // (y de usosSemana en cambiarPlato) cuando se evalúa el cambio de ese hueco:
  // el plato saliente no debe contarse a sí mismo.
  function diasSinSlot(plan, dia, tipoComida) {
    return plan.dias.map(function (d, i) {
      if (i !== dia) return d;
      var copia = { fecha: d.fecha, comida: d.comida, cena: d.cena };
      copia[tipoComida] = null;
      return copia;
    });
  }

  function contadorSemanaSinSlot(plan, dia, tipoComida, banco) {
    return contadorInicialDesdeDias(diasSinSlot(plan, dia, tipoComida), banco);
  }

  // ¿Tiene la plantilla ALGÚN combo (respetando vetos) que no viole cuotas
  // máximas con ese contador? Espejo exacto del modo manual de cambiarPlato,
  // que mantiene las cuotas máximas (protegen salud): pre-filtra la lista de
  // "Elegir otro plato" para no ofrecer platos que el motor vetará después.
  // Misma paridad lista↔motor que el filtro por plantillaViableParaMesa del
  // 2026-07-16 — aquel fix dejó las cuotas sin pre-filtrar (documentado en
  // ui.js) y el hueco se cerró en el audit del 2026-07-20.
  function plantillaPasaCuotas(plantilla, vetosUnion, contador, cuotas, banco) {
    return combinacionesEjes(plantilla, vetosUnion).some(function (seleccion) {
      if (!Object.keys(seleccion).length && Object.keys(plantilla.ejes || {}).length) return false;
      return !violaMaximoCuota(seleccion, contador, cuotas, banco);
    });
  }

  // Semáforo de equilibrio semanal (P1, feedback externo 2026-07-16): reutiliza
  // el mismo contador que ya usa el generador — solo lo expone por categoría de
  // cuota en vez de mantenerlo interno. Sin lógica nueva, cero riesgo de divergir
  // de lo que el motor realmente decide.
  function resumenCuotasSemana(plan, banco) {
    var cuotas = (banco && banco.categorias_cuota) || {};
    var contador = contadorInicialDesdeDias((plan && plan.dias) || [], banco);
    return Object.keys(cuotas).map(function (clave) {
      var cuota = cuotas[clave];
      var cuenta = contador[clave] || 0;
      var minOk = cuota.min_sem == null || cuenta >= cuota.min_sem;
      var maxOk = cuota.max_sem == null || cuenta <= cuota.max_sem;
      return { categoria: clave, cuenta: cuenta, min_sem: cuota.min_sem, max_sem: cuota.max_sem, cumplido: minOk && maxOk };
    });
  }

  // ---------------------------------------------------------------
  // Ajuste kcal — restricción 7 (±15%, orientativo)
  // ---------------------------------------------------------------
  function puntuarKcal(kcalTotal, objetivoKcal) {
    if (!objetivoKcal) return 0;
    var desvio = Math.abs(kcalTotal - objetivoKcal) / objetivoKcal;
    return -desvio * 20; // penalización suave — las cuotas pesan más que el ajuste fino de kcal
  }

  // ---------------------------------------------------------------
  // Feedback loop (P1, 2026-07-16): "capturar, no modelar" — un toque post-comida
  // por slot (fecha+tipoComida) en estado.valoraciones. Aquí solo se agrega el
  // conteo de rechazos por plantilla, para sesgar el scoring; el gusto/neutro no
  // puntúa (con 3 opciones simétricas, sesgar también hacia "le gustó" repetiría
  // el mismo plato más de la cuenta — lo pedido es evitar lo rechazado, no más).
  // ---------------------------------------------------------------
  function contarRechazosPorPlantilla(estado) {
    var contador = {};
    var valoraciones = (estado && estado.valoraciones) || {};
    Object.keys(valoraciones).forEach(function (clave) {
      var v = valoraciones[clave];
      if (v && v.valor === 'no-gusta' && v.plantillaId) contador[v.plantillaId] = (contador[v.plantillaId] || 0) + 1;
    });
    return contador;
  }

  // penalización suave y acotada — nunca debe pesar más que una restricción dura
  // (cuotas/dieta), solo desempata entre plantillas ya viables. Techo en 3 rechazos:
  // más allá no hace falta hundir más el score, ya perdió cualquier empate real.
  function puntuarRechazos(plantillaId, rechazosPorPlantilla) {
    var n = Math.min((rechazosPorPlantilla && rechazosPorPlantilla[plantillaId]) || 0, 3);
    return -n * 6;
  }

  // ---------------------------------------------------------------
  // Señales suaves del scoring (tramo 1, 2026-07-17): rotación entre semanas,
  // novedad, temporada y región. Regla fija (Roger 2026-07-16): señales
  // internas del motor, nunca mandos del usuario. Desempatan entre plantillas
  // ya viables — mismo orden de magnitud que puntuarRechazos, siempre por
  // debajo de cuotas/dieta/variedad. Diseño → 01_Research/2026-07-17_RESEARCH_BANCO_AMPLIACION.md §7.
  // ---------------------------------------------------------------

  // estado.historialPlantillas = { plantillaId: semanaISO del último uso }.
  // Lo escribe app.js con historialConPlan() al pasar de semana; más viejo que
  // HISTORIAL_SEMANAS se poda (y ese plato vuelve a contar como "novedad").
  var HISTORIAL_SEMANAS = 6;

  function semanasEntre(semanaISOAntigua, semanaISONueva) {
    var a = new Date(semanaISOAntigua + 'T00:00:00');
    var b = new Date(semanaISONueva + 'T00:00:00');
    return Math.round((b - a) / (7 * 24 * 3600 * 1000));
  }

  // Devuelve el historial actualizado con el plan saliente (NO muta estado —
  // el motor sigue puro; app.js asigna el resultado antes de generar la semana nueva).
  function historialConPlan(estado, plan, lunesActualISO) {
    var historial = {};
    var previo = (estado && estado.historialPlantillas) || {};
    Object.keys(previo).forEach(function (id) { historial[id] = previo[id]; });
    if (plan && plan.dias) {
      plan.dias.forEach(function (dia) {
        ['comida', 'cena'].forEach(function (tipo) {
          var slot = dia && dia[tipo];
          if (slot && slot.plantillaId) historial[slot.plantillaId] = plan.semanaISO;
        });
      });
    }
    Object.keys(historial).forEach(function (id) {
      if (semanasEntre(historial[id], lunesActualISO) > HISTORIAL_SEMANAS) delete historial[id];
    });
    return historial;
  }

  // Rotación: usada hace 1 semana −12, hace 2 −6, ≥3 libre. Un plato con
  // "me gusta" repetido (≥2) vuelve un escalón antes — protección, no refuerzo:
  // el feedback loop sigue sin premiar el 👍 para no repetir en bucle.
  function puntuarRecencia(plantillaId, historial, semanaISO, gustasPorPlantilla) {
    var ultimo = historial && historial[plantillaId];
    if (!ultimo) return 0;
    var distancia = semanasEntre(ultimo, semanaISO);
    if (gustasPorPlantilla && gustasPorPlantilla[plantillaId] >= 2) distancia += 1;
    if (distancia <= 1) return -12;
    if (distancia === 2) return -6;
    return 0;
  }

  // Novedad acotada: sin rastro en el historial (nunca probada, o hace >6
  // semanas) → bonus pequeño. Cada semana tienden a colarse 1-2 platos nuevos.
  function puntuarNovedad(plantillaId, historial) {
    return historial && historial[plantillaId] ? 0 : 4;
  }

  // Repetición DENTRO de la semana: la variedad dura (restricción 4) solo mira
  // ingredientes en días consecutivos — sin esto, el mismo plato top-score se
  // repetía lunes/viernes/domingo (visto en verificación 2026-07-17: la señal
  // estacional concentra candidatos y lo agrava). Penalización suave por cada
  // uso previo esta semana: si no queda alternativa viable (cuotas/dieta), el
  // plato aún puede repetir — mejor repetir que dejar el hueco vacío.
  function puntuarRepeticionSemana(plantillaId, usosSemana) {
    var n = Math.min((usosSemana && usosSemana[plantillaId]) || 0, 3);
    return -n * 8;
  }

  function usosDePlan(dias) {
    var usos = {};
    (dias || []).forEach(function (dia) {
      ['comida', 'cena'].forEach(function (tipo) {
        var slot = dia && dia[tipo];
        if (slot && slot.plantillaId) usos[slot.plantillaId] = (usos[slot.plantillaId] || 0) + 1;
      });
    });
    return usos;
  }

  function contarGustasPorPlantilla(estado) {
    var contador = {};
    var valoraciones = (estado && estado.valoraciones) || {};
    Object.keys(valoraciones).forEach(function (clave) {
      var v = valoraciones[clave];
      if (v && v.valor === 'gusta' && v.plantillaId) contador[v.plantillaId] = (contador[v.plantillaId] || 0) + 1;
    });
    return contador;
  }

  // Temporada del año por mes — versión sin API del clima→menú (UPGRADES §8):
  // verano jun-sep, invierno nov-mar, abr/may/oct neutro (research 2026-07-17,
  // AEMET + picos del calendario MAPA).
  function estacionDelMes(mes) {
    if (mes >= 6 && mes <= 9) return 'verano';
    if (mes >= 11 || mes <= 3) return 'invierno';
    return null;
  }

  function puntuarTemporada(plantilla, estacion) {
    if (!plantilla.temporada || !estacion) return 0;
    return plantilla.temporada === estacion ? 5 : -5;
  }

  // Región de la familia (estado.familiaRegion, dato opcional de Ajustes/alta):
  // empujón a los platos de tu tierra; sin dato, sin sesgo.
  function puntuarRegion(plantilla, familiaRegion) {
    return (familiaRegion && plantilla.region === familiaRegion) ? 4 : 0;
  }

  // ---------------------------------------------------------------
  // Menú del cole (F1, 2026-07-17 — versión manual del P1 #2, MOTOR_RECETAS §2).
  // estado.cole = { semanaISO, dias: { "YYYY-MM-DD": {resumen, proteina, hidrato,
  // verdura} } }, importado pegando el JSON del prompt de ChatGPT hasta que
  // exista /ai/cole-menu. Señal SOLO en la cena de ese día: evitar repetir la
  // proteína y el hidrato que los niños ya comieron a mediodía. Suave — nunca
  // por encima de cuotas/dieta/variedad, como todas las señales.
  // ---------------------------------------------------------------
  var TIPOS_HIDRATO_COLE = {
    pasta: { 'pasta': 1, 'fideos': 1, 'placas-lasana': 1 },
    arroz: { 'arroz': 1 },
    patata: { 'patata': 1, 'boniato': 1 },
    pan: { 'pan': 1, 'pan-integral': 1, 'pan-pita': 1, 'pan-hamburguesa': 1, 'tortilla-trigo': 1, 'masa-pizza': 1, 'masa-empanadilla': 1 }
    // 'legumbre' se detecta por categoría del ingrediente, no por lista
  };

  function puntuarCole(seleccion, coleDia, banco) {
    if (!coleDia) return 0;
    var malus = 0;
    idsUnicosDeSeleccion(seleccion).forEach(function (id) {
      var ing = banco.ingredientes[id];
      if (!ing) return;
      if (coleDia.proteina && ing.categoria === coleDia.proteina) malus -= 8;
      if (coleDia.hidrato) {
        var esTipo = coleDia.hidrato === 'legumbre'
          ? ing.categoria === 'legumbre'
          : !!(TIPOS_HIDRATO_COLE[coleDia.hidrato] && TIPOS_HIDRATO_COLE[coleDia.hidrato][id]);
        if (esTipo) malus -= 8;
      }
    });
    return malus;
  }

  // "Me apetece otra cosa" repetido (F1, MOTOR_RECETAS §2): app.js incrementa
  // estado.cambios[plantillaId] SOLO en cambios por elección — los de modo nevera
  // no se registran jamás (necesidad ≠ preferencia, Roger 2026-07-17). Señal más
  // débil que el rechazo explícito (−6): cambiar no siempre es "no nos gusta".
  function contarCambiosPorPlantilla(estado) {
    return (estado && estado.cambios) || {};
  }

  function puntuarCambios(plantillaId, cambiosPorPlantilla) {
    var n = Math.min((cambiosPorPlantilla && cambiosPorPlantilla[plantillaId]) || 0, 3);
    return -n * 3;
  }

  // ---------------------------------------------------------------
  // Postre del día (tramo 1, 2026-07-17) — modelo AESAN trasladado a la semana
  // familiar (consenso comedores escolares 2010; research §4): L-V fruta de
  // temporada rotada por mes (calendario MAPA), sábado lácteo sencillo,
  // domingo dulce tradicional como sugerencia (receta aparte, no entra en
  // compra). Determinista — no pasa por el scoring ni toca kcal del plato.
  // ---------------------------------------------------------------
  function postreDelDia(banco, fecha, diaIndex) {
    var postres = banco && banco.postres;
    if (!postres) return null;
    var d = new Date(fecha + 'T00:00:00');
    var mes = d.getMonth() + 1;
    if (diaIndex === 5 && postres.lacteo) { // sábado
      var ingL = banco.ingredientes[postres.lacteo];
      return { tipo: 'lacteo', id: postres.lacteo, nombre: (ingL ? ingL.nombre : 'Yogur natural') + ' con fruta' };
    }
    if (diaIndex === 6 && (postres.tradicionales || []).length) { // domingo — sugerencia
      var estacion = estacionDelMes(mes);
      var aptos = postres.tradicionales.filter(function (p) { return !p.temporada || !estacion || p.temporada === estacion; });
      if (!aptos.length) aptos = postres.tradicionales;
      var nSemana = Math.floor(d.getTime() / (7 * 24 * 3600 * 1000));
      var elegido = aptos[nSemana % aptos.length];
      return { tipo: 'tradicional', nombre: elegido.nombre, receta_aparte: true };
    }
    var frutas = (postres.frutas_mes && postres.frutas_mes[mes]) || [];
    if (!frutas.length) return null;
    var idFruta = frutas[diaIndex % frutas.length];
    var ingF = banco.ingredientes[idFruta];
    return { tipo: 'fruta', id: idFruta, nombre: ingF ? ingF.nombre : idFruta };
  }

  // ---------------------------------------------------------------
  // Descubrir — categorías reales rotando (2026-07-20, Roger: "busca en tu
  // catálogo... y otras categorías que podamos incluir, no visibles ahora
  // pero sí en bbdd"). Cada categoría es un filtro sobre datos reales de la
  // plantilla — desde que existe el campo `tematica` (2026-07-20, una por
  // cada una de las 82) se filtra por ese campo directamente en vez de
  // inferirlo por regex sobre el nombre; "rápidas"/"temporada" siguen
  // filtrando por `esfuerzo`/`temporada`, son otra dimensión, no un tema.
  // Todas con >=5 candidatas reales salvo "temporada" (varía con el mes; en
  // abr/may/oct, mes neutro sin verano ni invierno, se cae del pool ese día,
  // no se fuerza un valor falso). "Para peques" (`ninos`) NO se incluye a
  // propósito: el campo es true en 68-77 de 82 plantillas según el corte —
  // no diferencia un subconjunto real, sería una categoría de mentira con
  // ropaje de dato real. "Otoño" y "extras de Navidad/cena con invitados"
  // tampoco: no hay tag de otoño ni platos de gran formato en el banco
  // todavía (visto con Roger, pendiente de un tramo de banco nuevo si se
  // quiere de verdad — ver UPGRADES.md §3). Rotación determinista por día
  // (mismo patrón que el postre tradicional de domingo, arriba, y la
  // portada de index.html): sin Math.random, sin persistir nada, cambia
  // sola a las 00:00 — recibe `fecha` como parámetro (no Date.now() interno)
  // para seguir siendo puro y testeable en consola.
  // ---------------------------------------------------------------
  var CATEGORIAS_DESCUBRIR = [
    { id: 'arroces', kicker: 'Arroces', titulo: 'De la paella al arroz caldoso',
      test: function (p) { return p.tematica === 'Arroces y fideuà'; } },
    { id: 'potajes', kicker: 'Cuchara de invierno', titulo: 'Potajes y guisos para los días fríos',
      test: function (p) { return p.tematica === 'Potajes y guisos' && p.temporada === 'invierno'; } },
    { id: 'ensaladas', kicker: 'Ensaladas completas', titulo: 'Platos únicos que no dan pereza',
      test: function (p) { return p.tematica === 'Ensaladas completas'; } },
    { id: 'cremas', kicker: 'Cremas y sopas', titulo: 'Reconfortantes, con cuchara',
      test: function (p) { return p.tematica === 'Cremas y sopas'; } },
    { id: 'rapidas', kicker: 'En poco tiempo', titulo: 'Ideas para cuando no hay tiempo',
      test: function (p) { return p.esfuerzo === 'rapido'; } }
  ];

  function categoriasDescubrir(banco, estado, fecha) {
    var disponibles = plantillasDisponibles(banco, estado);
    var d = new Date(fecha + 'T00:00:00');
    var estacion = estacionDelMes(d.getMonth() + 1);
    var pool = CATEGORIAS_DESCUBRIR.slice();
    if (estacion) {
      pool.unshift({
        id: 'temporada', kicker: 'De temporada',
        titulo: estacion === 'verano' ? 'Recetas fresquitas para el verano' : 'Recetas de cuchara para el invierno',
        test: function (p) { return p.temporada === estacion; }
      });
    }
    var conCandidatas = pool.map(function (cat) {
      var candidatas = disponibles.filter(cat.test);
      return candidatas.length ? { kicker: cat.kicker, titulo: cat.titulo, candidatas: candidatas } : null;
    }).filter(Boolean);
    if (!conCandidatas.length) return [];
    var diaNum = Math.floor(d.getTime() / (24 * 3600 * 1000));
    var offset = diaNum % conCandidatas.length;
    var rotado = conCandidatas.slice(offset).concat(conCandidatas.slice(0, offset));
    return rotado.slice(0, 3).map(function (cat, i) {
      var elegida = cat.candidatas[(diaNum + i) % cat.candidatas.length];
      // las recetas propias no llevan foto — si la rotación cae en una, la
      // portada de la ficha usa la primera candidata con foto para no pintar
      // un <img src="undefined"> roto (audit 2026-07-20); si ninguna tiene,
      // null y ui.js omite la imagen (el degradado + texto siguen legibles).
      var foto = elegida.foto || (cat.candidatas.filter(function (p) { return p.foto; })[0] || {}).foto || null;
      return { kicker: cat.kicker, titulo: cat.titulo, foto: foto, candidatas: cat.candidatas };
    });
  }

  // ---------------------------------------------------------------
  // Elección del mejor plantilla+selección para un hueco (comida o cena de un día)
  // aplicando las 7 restricciones en orden.
  // ---------------------------------------------------------------

  // kcal totales de una selección — mismo cálculo (y mismos redondeos) que
  // resolverPlato, sin construir nombre/pasos/lista de compra: es lo único que
  // necesita el scoring, que se ejecuta por CADA combo de CADA plantilla.
  function kcalTotalSeleccion(plantilla, seleccion, presentes, banco) {
    var total = 0;
    (presentes || []).forEach(function (miembro) {
      var esNino = edadEnAnios(miembro.anioNacimiento) < EDAD_MENOR;
      var kcalMiembro = plantilla.kcal_extra || 0;
      idsUnicosDeSeleccion(seleccion).forEach(function (id) {
        var ing = banco.ingredientes[id];
        if (!ing) return;
        var gramos = esNino ? ing.racion_nino_g : ing.racion_adulto_g;
        kcalMiembro += gramos * ing.kcal_100g / 100;
      });
      total += Math.round(kcalMiembro);
    });
    return Math.round(total);
  }

  function elegirParaSlot(opts) {
    var mejor = null;
    var mejorScore = -Infinity;
    // vetosViabilidad: vetos reales de los presentes, para mesa mixta. En modo
    // nevera vetosUnion llega contaminado con "no está en la nevera", pero la
    // adaptación de dieta es una ración extra que va a la compra — no tiene por
    // qué estar en la nevera, así que la viabilidad se evalúa con los vetos limpios.
    var vetosViabilidad = opts.vetosViabilidad || opts.vetosUnion;
    opts.plantillasCandidatas.forEach(function (plantilla) {
      if (!opts.esFinde && !opts.ignorarEsfuerzo && plantilla.esfuerzo === 'elaborado') return; // restricción 6: tiempo
      if (!plantillaViableParaMesa(plantilla, opts.presentes, vetosViabilidad, opts.banco)) return; // restricciones 2+3
      var combos = combinacionesEjes(plantilla, opts.vetosUnion);
      combos.forEach(function (seleccion) {
        if (!Object.keys(seleccion).length && Object.keys(plantilla.ejes || {}).length) return; // sin combo viable (todo vetado)
        if (violaVariedad(seleccion, opts.usadosHoy, opts.usadosAyer)) return; // restricción 4
        if (violaMaximoCuota(seleccion, opts.contadorCuotas, opts.cuotas, opts.banco)) return; // restricción 5 (máx.)
        var score = puntuarCuotas(seleccion, opts.contadorCuotas, opts.cuotas, opts.banco, opts.slotsRestantes) // restricción 5 (mín.)
                  + puntuarKcal(kcalTotalSeleccion(plantilla, seleccion, opts.presentes, opts.banco), opts.objetivoKcal) // restricción 7
                  + puntuarRechazos(plantilla.id, opts.rechazosPorPlantilla) // feedback loop, sesgo suave
                  + puntuarRecencia(plantilla.id, opts.historialPlantillas, opts.semanaISO, opts.gustasPorPlantilla) // rotación entre semanas
                  + puntuarNovedad(plantilla.id, opts.historialPlantillas) // novedad acotada
                  + puntuarRepeticionSemana(plantilla.id, opts.usosSemana) // no repetir plato dentro de la semana
                  + puntuarTemporada(plantilla, opts.estacion) // señal estacional (mes)
                  + puntuarRegion(plantilla, opts.familiaRegion) // señal de región de la familia
                  + puntuarCambios(plantilla.id, opts.cambiosPorPlantilla) // "me apetece otra cosa" repetido
                  + puntuarCole(seleccion, opts.coleDia, opts.banco); // cena: no repetir lo del cole
        if (score > mejorScore) {
          mejorScore = score;
          mejor = { plantilla: plantilla, seleccion: seleccion };
        }
      });
    });
    if (mejor) mejor.resuelto = resolverPlato(mejor.plantilla, mejor.seleccion, opts.presentes, opts.banco);
    return mejor;
  }

  // ---------------------------------------------------------------
  // 4. Generación de la semana completa
  // ---------------------------------------------------------------
  // diaPrevio (audit 2026-07-20): día anterior al día 0 de esta semana — el
  // domingo del plan vigente cuando se genera la semana siguiente. Sin él, la
  // variedad dura (restricción 4, "ningún ingrediente en días consecutivos")
  // arrancaba ciega en la frontera dom→lun: 10 de 12 rollovers simulados
  // repetían ingrediente, visible en la tira continua de 14 días de la Home.
  function generarSemana(estado, banco, desde, planExistente, diaPrevio) {
    desde = desde || 0;
    var semanaISO = (planExistente && planExistente.semanaISO) || lunesDeEstaSemana(new Date());
    var cuotas = (banco && banco.categorias_cuota) || {};
    var contadorCuotas = contadorInicialDesdeDias(planExistente ? planExistente.dias.slice(0, desde) : [], banco);
    var rechazosPorPlantilla = contarRechazosPorPlantilla(estado);
    // señales suaves del scoring (rotación/novedad/temporada/región/cambios) — se calculan una vez por semana
    var historialPlantillas = (estado && estado.historialPlantillas) || null;
    var gustasPorPlantilla = contarGustasPorPlantilla(estado);
    var cambiosPorPlantilla = contarCambiosPorPlantilla(estado);
    var estacion = estacionDelMes(new Date(semanaISO + 'T00:00:00').getMonth() + 1);
    var familiaRegion = (estado && estado.familiaRegion) || null;
    var usosSemana = usosDePlan(planExistente ? planExistente.dias.slice(0, desde) : []);
    var dias = [];

    for (var i = 0; i < 7; i++) {
      if (i < desde && planExistente && planExistente.dias[i]) {
        dias.push(planExistente.dias[i]);
        continue;
      }
      var fecha = fechaISO(semanaISO, i);
      var usadosAyer = i === 0 ? usadosEnDia(diaPrevio) : usadosEnDia(dias[i - 1]);
      var diaActual = { fecha: fecha, comida: null, cena: null };

      ['comida', 'cena'].forEach(function (tipoComida) {
        var presentes = presentesEnComida(estado, fecha, i, tipoComida);
        if (!presentes.length) { diaActual[tipoComida] = null; return; }
        var vetosUnion = vetosDe(presentes);
        var objetivoKcal = kcalObjetivo(presentes, tipoComida);
        var usadosHoy = usadosEnDia(diaActual);
        var candidatas = plantillasDisponibles(banco, estado).filter(function (p) { return (p.apta || []).indexOf(tipoComida) !== -1; });
        var slotsRestantes = Math.max(1, (7 - i) * 2);

        var elegido = elegirParaSlot({
          plantillasCandidatas: candidatas, presentes: presentes, vetosUnion: vetosUnion,
          objetivoKcal: objetivoKcal, usadosHoy: usadosHoy, usadosAyer: usadosAyer,
          contadorCuotas: contadorCuotas, cuotas: cuotas, banco: banco,
          esFinde: esFinDeSemana(i), slotsRestantes: slotsRestantes,
          rechazosPorPlantilla: rechazosPorPlantilla,
          historialPlantillas: historialPlantillas, semanaISO: semanaISO,
          gustasPorPlantilla: gustasPorPlantilla, estacion: estacion, familiaRegion: familiaRegion,
          usosSemana: usosSemana, cambiosPorPlantilla: cambiosPorPlantilla,
          // el cole solo condiciona la CENA del día (los niños ya comieron eso a mediodía)
          coleDia: tipoComida === 'cena' ? ((estado.cole && estado.cole.dias && estado.cole.dias[fecha]) || null) : null
        });

        if (!elegido) { diaActual[tipoComida] = null; return; }

        var adaptaciones = calcularAdaptaciones(elegido.plantilla, elegido.seleccion, presentes, banco, vetosUnion);
        diaActual[tipoComida] = { plantillaId: elegido.plantilla.id, seleccion: elegido.seleccion, adaptaciones: adaptaciones };
        actualizarContadorCuotas(contadorCuotas, elegido.seleccion, banco);
        usosSemana[elegido.plantilla.id] = (usosSemana[elegido.plantilla.id] || 0) + 1;
      });

      dias.push(diaActual);
    }

    return { semanaISO: semanaISO, dias: dias };
  }

  // ---------------------------------------------------------------
  // 5. Regenerar desde un día concreto, conservando lo anterior como
  //    restricción de variedad/cuotas.
  // ---------------------------------------------------------------
  function regenerarDesde(estado, plan, diaIndex, banco) {
    return generarSemana(estado, banco, diaIndex, plan);
  }

  // ---------------------------------------------------------------
  // 6. Cambiar un plato concreto — manual o "con lo que hay en la nevera"
  // ---------------------------------------------------------------
  function plantillasMontables(disponibles, plantillasCandidatas) {
    var disponiblesSet = {};
    (disponibles || []).forEach(function (id) { disponiblesSet[id] = 1; });
    return plantillasCandidatas.filter(function (p) {
      return Object.keys(p.ejes || {}).every(function (eje) {
        return (p.ejes[eje] || []).some(function (id) { return disponiblesSet[id]; });
      });
    });
  }

  function cambiarPlato(estado, plan, dia, tipoComida, opciones, banco) {
    var diaObj = plan.dias[dia];
    if (!diaObj) return null;
    var fecha = diaObj.fecha;
    var presentes = presentesEnComida(estado, fecha, dia, tipoComida);
    if (!presentes.length) return null;

    var vetosUnion = vetosDe(presentes);
    var vetosViabilidad = vetosDe(presentes); // copia limpia: mesa mixta/adaptaciones no ven el filtro de nevera
    var objetivoKcal = kcalObjetivo(presentes, tipoComida);
    var usadosAyer = usadosEnDia(plan.dias[dia - 1]);
    var otraComida = tipoComida === 'comida' ? diaObj.cena : diaObj.comida;
    var usadosHoy = {};
    if (otraComida && otraComida.seleccion) Object.keys(otraComida.seleccion).forEach(function (eje) { usadosHoy[otraComida.seleccion[eje]] = 1; });

    var cuotas = (banco && banco.categorias_cuota) || {};
    // cuotas de toda la semana salvo el propio hueco que se está cambiando
    var diasParaContar = diasSinSlot(plan, dia, tipoComida);
    var contadorCuotas = contadorInicialDesdeDias(diasParaContar, banco);

    var candidatas = plantillasDisponibles(banco, estado).filter(function (p) { return (p.apta || []).indexOf(tipoComida) !== -1; });

    var esManual = !!(opciones && opciones.modo === 'manual' && opciones.plantillaId);
    if (esManual) {
      candidatas = candidatas.filter(function (p) { return p.id === opciones.plantillaId; });
      // El usuario ha elegido ESTA plantilla a mano: la elección explícita manda
      // sobre las preferencias (mismo criterio ya fijado para nevera, Roger
      // 2026-07-15). Variedad y el bloqueo de "elaborado entre semana" se
      // relajan; cuotas máximas y dieta/mesa mixta se mantienen — protegen salud.
      // Sin esto, la lista de "Elegir otro plato" ofrecía plantillas que el motor
      // luego vetaba (18/43 caían solo por variedad) → alert de "no encontramos
      // un plato", el bug real reportado el 2026-07-16.
      usadosHoy = {};
      usadosAyer = {};
    } else if (opciones && opciones.modo === 'nevera' && opciones.disponibles) {
      candidatas = plantillasMontables(opciones.disponibles, candidatas);
      // fuerza a que sólo se elijan ids disponibles: se vetan (para esta operación) todos los
      // ids de esos ejes que NO estén en la lista de "lo que hay" — reutiliza el mismo mecanismo
      // de filtrado por vetos ya usado en el resto del motor.
      var disponiblesSet = {};
      opciones.disponibles.forEach(function (id) { disponiblesSet[id] = 1; });
      candidatas.forEach(function (p) {
        Object.keys(p.ejes || {}).forEach(function (eje) {
          (p.ejes[eje] || []).forEach(function (id) { if (!disponiblesSet[id]) vetosUnion[id] = 1; });
        });
      });
      // la variedad (restricción 4) es una preferencia de "no comer lo mismo" — cuando el
      // usuario dice explícitamente qué tiene disponible ahora mismo, esa realidad manda:
      // si lo único disponible ya se usó hoy o ayer, bloquear en vez de proponerlo deja la
      // función sin poder resolver nada (bug real, Roger 2026-07-15). Cuotas máximas y
      // mesa mixta/dieta sí se mantienen — esas protegen salud, no varidad.
      usadosHoy = {};
      usadosAyer = {};
    }

    if (!candidatas.length) return null;

    var elegido = elegirParaSlot({
      plantillasCandidatas: candidatas, presentes: presentes, vetosUnion: vetosUnion,
      vetosViabilidad: vetosViabilidad, ignorarEsfuerzo: esManual,
      objetivoKcal: objetivoKcal, usadosHoy: usadosHoy, usadosAyer: usadosAyer,
      contadorCuotas: contadorCuotas, cuotas: cuotas, banco: banco,
      esFinde: esFinDeSemana(dia), slotsRestantes: Math.max(1, (7 - dia) * 2),
      rechazosPorPlantilla: contarRechazosPorPlantilla(estado),
      historialPlantillas: (estado && estado.historialPlantillas) || null,
      semanaISO: plan.semanaISO,
      gustasPorPlantilla: contarGustasPorPlantilla(estado),
      estacion: estacionDelMes(new Date(diaObj.fecha + 'T00:00:00').getMonth() + 1),
      familiaRegion: (estado && estado.familiaRegion) || null,
      usosSemana: usosDePlan(diasParaContar),
      cambiosPorPlantilla: contarCambiosPorPlantilla(estado),
      coleDia: tipoComida === 'cena' ? ((estado.cole && estado.cole.dias && estado.cole.dias[diaObj.fecha]) || null) : null
    });
    if (!elegido) return null;

    var adaptaciones = calcularAdaptaciones(elegido.plantilla, elegido.seleccion, presentes, banco, vetosViabilidad);
    var nuevoSlot = { plantillaId: elegido.plantilla.id, seleccion: elegido.seleccion, adaptaciones: adaptaciones };

    var nuevoPlan = { semanaISO: plan.semanaISO, dias: plan.dias.slice() };
    var nuevoDia = { fecha: diaObj.fecha, comida: diaObj.comida, cena: diaObj.cena };
    nuevoDia[tipoComida] = nuevoSlot;
    nuevoPlan.dias[dia] = nuevoDia;

    return { plan: nuevoPlan, slot: nuevoSlot, resuelto: elegido.resuelto };
  }

  // ---------------------------------------------------------------
  // 7. Lista de la compra — agregada por ingrediente-id, estable frente a
  //    regeneraciones parciales (los marcados se guardan por ingrediente-id).
  // ---------------------------------------------------------------
  function diaIndexDesdeFecha(plan, fechaISOStr) {
    for (var i = 0; i < plan.dias.length; i++) { if (plan.dias[i].fecha === fechaISOStr) return i; }
    return -1;
  }

  // `hoy` opcional (audit 2026-07-20): inyectable para tests deterministas del
  // rango 'hoy' — en producción se omite y usa la fecha real, como siempre.
  function listaCompra(estado, plan, rango, banco, hoy) {
    var hoyISO = hoy || fechaLocalISO(new Date());
    var diasRango;
    if (rango === 'hoy') {
      var idx = diaIndexDesdeFecha(plan, hoyISO);
      diasRango = idx === -1 ? [] : [{ dia: plan.dias[idx], idx: idx }];
    } else {
      diasRango = plan.dias.map(function (d, idx) { return { dia: d, idx: idx }; });
    }

    var acumulado = {};
    diasRango.forEach(function (entry) {
      var dia = entry.dia, idx = entry.idx;
      ['comida', 'cena'].forEach(function (tipoComida) {
        var slot = dia[tipoComida];
        if (!slot) return;
        var plantilla = plantillaPorId(banco, estado, slot.plantillaId);
        if (!plantilla) return;
        var presentes = presentesEnComida(estado, dia.fecha, idx, tipoComida);
        var resuelto = resolverPlato(plantilla, slot.seleccion, presentes, banco, slot.adaptaciones);
        resuelto.ingredientes.forEach(function (linea) {
          var ing = banco.ingredientes[linea.id];
          if (!acumulado[linea.id]) acumulado[linea.id] = { id: linea.id, nombre: ing ? ing.nombre : linea.id, categoria: ing ? ing.categoria : 'otro', gramos: 0 };
          acumulado[linea.id].gramos += linea.gramos;
        });
      });

      // postre del día (tramo 1, 2026-07-17): la fruta de L-V y el yogur del
      // sábado entran en la compra por ración de los presentes en la cena; el
      // dulce del domingo es sugerencia con receta aparte — no se compra solo.
      var postre = postreDelDia(banco, dia.fecha, idx);
      if (postre && postre.id) {
        var ingPostre = banco.ingredientes[postre.id];
        if (ingPostre) {
          presentesEnComida(estado, dia.fecha, idx, 'cena').forEach(function (miembro) {
            var esNino = edadEnAnios(miembro.anioNacimiento) < EDAD_MENOR;
            var gramos = esNino ? ingPostre.racion_nino_g : ingPostre.racion_adulto_g;
            if (!acumulado[postre.id]) acumulado[postre.id] = { id: postre.id, nombre: ingPostre.nombre, categoria: ingPostre.categoria, gramos: 0 };
            acumulado[postre.id].gramos += gramos;
          });
        }
      }
    });

    var marcados = {};
    ((estado.compra && estado.compra.marcados) || []).forEach(function (id) { marcados[id] = 1; });

    return Object.keys(acumulado).map(function (id) {
      var linea = acumulado[id];
      return { id: linea.id, nombre: linea.nombre, categoria: linea.categoria, gramos: Math.round(linea.gramos), marcado: !!marcados[id] };
    }).sort(function (a, b) {
      if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria);
      return a.nombre.localeCompare(b.nombre);
    });
  }

  // ---------------------------------------------------------------
  // Export — UMD mínimo: window en navegador, module.exports en node (tests)
  // ---------------------------------------------------------------
  var E3Engine = {
    resolverPlato: resolverPlato,
    generarSemana: generarSemana,
    regenerarDesde: regenerarDesde,
    cambiarPlato: cambiarPlato,
    listaCompra: listaCompra,
    // helpers reutilizados por ui.js / app.js
    edadEnAnios: edadEnAnios,
    presentesEnComida: presentesEnComida,
    excluidoPorCole: excluidoPorCole,
    contadorSemanaSinSlot: contadorSemanaSinSlot,
    plantillaPasaCuotas: plantillaPasaCuotas,
    lunesDeEstaSemana: lunesDeEstaSemana,
    fechaLocalISO: fechaLocalISO,
    fechaISO: fechaISO,
    diaIndexDesdeFecha: diaIndexDesdeFecha,
    plantillaPorId: plantillaPorId,
    plantillasDisponibles: plantillasDisponibles,
    todasLasPlantillas: todasLasPlantillas,
    plantillaViableParaMesa: plantillaViableParaMesa,
    vetosDe: vetosDe,
    capitaliza: capitaliza,
    resumenCuotasSemana: resumenCuotasSemana,
    // tramo 1 (2026-07-17): rotación entre semanas + postre del día
    historialConPlan: historialConPlan,
    postreDelDia: postreDelDia,
    // Descubrir (2026-07-20): categorías reales rotando
    categoriasDescubrir: categoriasDescubrir
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = E3Engine;
  if (global) global.E3Engine = E3Engine;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
