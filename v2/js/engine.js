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
  var IDS_CERDO_CONOCIDOS = ['cerdo', 'lomo', 'panceta', 'jamon', 'chorizo', 'salchicha', 'beicon', 'morcilla', 'costillas-cerdo', 'secreto', 'presa', 'solomillo-cerdo'];

  // ---------------------------------------------------------------
  // Utilidades
  // ---------------------------------------------------------------

  function edadEnAnios(nacimientoISO, hoy) {
    if (!nacimientoISO) return 30; // defensivo — nacimiento es obligatorio en el alta de miembro
    var d = hoy ? new Date(hoy) : new Date();
    var nac = new Date(nacimientoISO);
    var edad = d.getFullYear() - nac.getFullYear();
    var m = d.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && d.getDate() < nac.getDate())) edad--;
    return edad;
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
    var edad = edadEnAnios(miembro.nacimiento);
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
  function resolverPlato(plantilla, seleccion, presentes, banco) {
    var nombre = plantilla.nombre_patron;
    Object.keys(plantilla.ejes || {}).forEach(function (eje) {
      var id = seleccion[eje];
      var ing = banco.ingredientes[id];
      nombre = nombre.split('{' + eje + '}').join(ing ? capitaliza(ing.nombre) : (id || ('{' + eje + '}')));
    });

    var ingredientesCompra = []; // [{id, gramos}] — estable por id (para checks persistentes)
    var kcalPorComensal = [];
    var kcalTotal = 0;

    var idsUnicos = idsUnicosDeSeleccion(seleccion);

    (presentes || []).forEach(function (miembro) {
      var esNino = edadEnAnios(miembro.nacimiento) < EDAD_MENOR;
      var kcalMiembro = plantilla.kcal_extra || 0;
      idsUnicos.forEach(function (id) {
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

    return { nombre: nombre, kcalPorComensal: kcalPorComensal, kcalTotal: Math.round(kcalTotal), ingredientes: ingredientesCompra };
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
  function presentesEnComida(estado, fecha, diaIndex, tipoComida) {
    var ausenciasDia = (estado.ausenciasPuntuales && estado.ausenciasPuntuales[fecha] && estado.ausenciasPuntuales[fecha][tipoComida]) || [];
    return (estado.familia || []).filter(function (m) {
      var patronDia = (m.patron && m.patron[tipoComida]) ? m.patron[tipoComida][diaIndex] : 'casa';
      if (patronDia !== 'casa') return false; // ausencia estructural (fuera/cole)
      if (ausenciasDia.indexOf(m.id) !== -1) return false; // ausencia puntual
      return true;
    });
  }

  // ---------------------------------------------------------------
  // Plantillas: catálogo disponible, viabilidad de mesa, combinatoria de ejes
  // ---------------------------------------------------------------
  function plantillasDisponibles(banco, estado) {
    var ocultas = {};
    (estado.ocultas || []).forEach(function (id) { ocultas[id] = 1; });
    var propias = estado.propias || [];
    return (banco.plantillas || []).concat(propias).filter(function (p) { return !ocultas[p.id]; });
  }

  function plantillaPorId(banco, estado, id) {
    var todas = (banco.plantillas || []).concat(estado.propias || []);
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

  // ---------------------------------------------------------------
  // Ajuste kcal — restricción 7 (±15%, orientativo)
  // ---------------------------------------------------------------
  function puntuarKcal(kcalTotal, objetivoKcal) {
    if (!objetivoKcal) return 0;
    var desvio = Math.abs(kcalTotal - objetivoKcal) / objetivoKcal;
    return -desvio * 20; // penalización suave — las cuotas pesan más que el ajuste fino de kcal
  }

  // ---------------------------------------------------------------
  // Elección del mejor plantilla+selección para un hueco (comida o cena de un día)
  // aplicando las 7 restricciones en orden.
  // ---------------------------------------------------------------
  function elegirParaSlot(opts) {
    var mejor = null;
    var mejorScore = -Infinity;
    opts.plantillasCandidatas.forEach(function (plantilla) {
      if (!opts.esFinde && plantilla.esfuerzo === 'elaborado') return; // restricción 6: tiempo
      if (!plantillaViableParaMesa(plantilla, opts.presentes, opts.vetosUnion, opts.banco)) return; // restricciones 2+3
      var combos = combinacionesEjes(plantilla, opts.vetosUnion);
      combos.forEach(function (seleccion) {
        if (!Object.keys(seleccion).length && Object.keys(plantilla.ejes || {}).length) return; // sin combo viable (todo vetado)
        if (violaVariedad(seleccion, opts.usadosHoy, opts.usadosAyer)) return; // restricción 4
        if (violaMaximoCuota(seleccion, opts.contadorCuotas, opts.cuotas, opts.banco)) return; // restricción 5 (máx.)
        var resuelto = resolverPlato(plantilla, seleccion, opts.presentes, opts.banco);
        var score = puntuarCuotas(seleccion, opts.contadorCuotas, opts.cuotas, opts.banco, opts.slotsRestantes) // restricción 5 (mín.)
                  + puntuarKcal(resuelto.kcalTotal, opts.objetivoKcal); // restricción 7
        if (score > mejorScore) {
          mejorScore = score;
          mejor = { plantilla: plantilla, seleccion: seleccion, resuelto: resuelto };
        }
      });
    });
    return mejor;
  }

  // ---------------------------------------------------------------
  // 4. Generación de la semana completa
  // ---------------------------------------------------------------
  function generarSemana(estado, banco, desde, planExistente) {
    desde = desde || 0;
    var semanaISO = (planExistente && planExistente.semanaISO) || lunesDeEstaSemana(new Date());
    var cuotas = (banco && banco.categorias_cuota) || {};
    var contadorCuotas = contadorInicialDesdeDias(planExistente ? planExistente.dias.slice(0, desde) : [], banco);
    var dias = [];

    for (var i = 0; i < 7; i++) {
      if (i < desde && planExistente && planExistente.dias[i]) {
        dias.push(planExistente.dias[i]);
        continue;
      }
      var fecha = fechaISO(semanaISO, i);
      var usadosAyer = usadosEnDia(dias[i - 1]);
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
          esFinde: esFinDeSemana(i), slotsRestantes: slotsRestantes
        });

        if (!elegido) { diaActual[tipoComida] = null; return; }

        var adaptaciones = calcularAdaptaciones(elegido.plantilla, elegido.seleccion, presentes, banco, vetosUnion);
        diaActual[tipoComida] = { plantillaId: elegido.plantilla.id, seleccion: elegido.seleccion, adaptaciones: adaptaciones };
        actualizarContadorCuotas(contadorCuotas, elegido.seleccion, banco);
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
    var objetivoKcal = kcalObjetivo(presentes, tipoComida);
    var usadosAyer = usadosEnDia(plan.dias[dia - 1]);
    var otraComida = tipoComida === 'comida' ? diaObj.cena : diaObj.comida;
    var usadosHoy = {};
    if (otraComida && otraComida.seleccion) Object.keys(otraComida.seleccion).forEach(function (eje) { usadosHoy[otraComida.seleccion[eje]] = 1; });

    var cuotas = (banco && banco.categorias_cuota) || {};
    // cuotas de toda la semana salvo el propio hueco que se está cambiando
    var diasParaContar = plan.dias.map(function (d, i) {
      if (i !== dia) return d;
      var copia = { fecha: d.fecha, comida: d.comida, cena: d.cena };
      copia[tipoComida] = null;
      return copia;
    });
    var contadorCuotas = contadorInicialDesdeDias(diasParaContar, banco);

    var candidatas = plantillasDisponibles(banco, estado).filter(function (p) { return (p.apta || []).indexOf(tipoComida) !== -1; });

    if (opciones && opciones.modo === 'manual' && opciones.plantillaId) {
      candidatas = candidatas.filter(function (p) { return p.id === opciones.plantillaId; });
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
    }

    if (!candidatas.length) return null;

    var elegido = elegirParaSlot({
      plantillasCandidatas: candidatas, presentes: presentes, vetosUnion: vetosUnion,
      objetivoKcal: objetivoKcal, usadosHoy: usadosHoy, usadosAyer: usadosAyer,
      contadorCuotas: contadorCuotas, cuotas: cuotas, banco: banco,
      esFinde: esFinDeSemana(dia), slotsRestantes: Math.max(1, (7 - dia) * 2)
    });
    if (!elegido) return null;

    var adaptaciones = calcularAdaptaciones(elegido.plantilla, elegido.seleccion, presentes, banco, vetosUnion);
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

  function listaCompra(estado, plan, rango, banco) {
    var hoyISO = fechaLocalISO(new Date());
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
        var resuelto = resolverPlato(plantilla, slot.seleccion, presentes, banco);
        resuelto.ingredientes.forEach(function (linea) {
          var ing = banco.ingredientes[linea.id];
          if (!acumulado[linea.id]) acumulado[linea.id] = { id: linea.id, nombre: ing ? ing.nombre : linea.id, categoria: ing ? ing.categoria : 'otro', gramos: 0 };
          acumulado[linea.id].gramos += linea.gramos;
        });
      });
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
    necesidadKcalDia: necesidadKcalDia,
    kcalObjetivo: kcalObjetivo,
    resolverPlato: resolverPlato,
    generarSemana: generarSemana,
    regenerarDesde: regenerarDesde,
    cambiarPlato: cambiarPlato,
    listaCompra: listaCompra,
    // helpers reutilizados por ui.js / app.js
    edadEnAnios: edadEnAnios,
    presentesEnComida: presentesEnComida,
    lunesDeEstaSemana: lunesDeEstaSemana,
    fechaISO: fechaISO,
    fechaLocalISO: fechaLocalISO,
    diaIndexDesdeFecha: diaIndexDesdeFecha,
    plantillaPorId: plantillaPorId,
    plantillasDisponibles: plantillasDisponibles,
    vetosDe: vetosDe,
    categoriaExcluidaPorDieta: categoriaExcluidaPorDieta
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = E3Engine;
  if (global) global.E3Engine = E3Engine;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
