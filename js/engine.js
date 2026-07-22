/* ============================================================
   e3Foods — engine.js (v3)

   Motor determinista puro: ensamblaje de MENÚS por ELABORACIONES (principal
   + complementarias + postre), banda de kcal AGREGADA de mesa, fases puras
   (generar candidatos válidos → puntuar solo válidos → elegir determinista
   top-N — nunca un solver CSP formal, ver borrador §15/§16). Sin DOM, sin
   Date.now()/new Date() interno (fechaReferencia siempre inyectada), sin
   Math.random(). Convención de índice de día: 0=lunes…6=domingo.

   Sustituye al motor v2 (plantillas monoliticas de 3 ejes) — ver
   02_APP/_REVISION_MOTOR_borrador.md para el diseño completo y
   00_Decisiones_Log/ para la crónica de la obra.
   ============================================================ */
(function (global) {
  'use strict';

  // ---------------------------------------------------------------
  // Constantes (ver 01_Research/2026-07-20_RESEARCH_REPARTO_KCAL_COMIDA_CENA.md
  // y borrador §3 punto 8 + §14 matiz)
  // ---------------------------------------------------------------
  var REPARTO_KCAL = {
    // entre semana: comida 35% / cena 30%, simétrico ±margen
    entresemana: { comida: 0.35, cena: 0.30 },
    // finde: rango directo, no banda simétrica — comida 35-40% (copiosa), cena 25-30% (ligera)
    finde: { comida: { min: 0.35, max: 0.40 }, cena: { min: 0.25, max: 0.30 } }
  };
  var MARGEN_KCAL_DEFECTO = 0.10; // ±10% de trabajo (borrador §14 matiz, corrige el ±5% original — a calibrar en tramo 5

  var FACTOR_ACTIVIDAD_MIFFLIN = { baja: 1.2, media: 1.55, alta: 1.725 };
  var FACTOR_ACTIVIDAD_BANDA = { baja: 1.0, media: 1.2, alta: 1.4 };
  var EDAD_MENOR = 12;

  var FACTOR_PERSONA_MIN = 0.75, FACTOR_PERSONA_MAX = 1.25; // borrador §12 INGREDIENTES: escalado por persona

  var CATEGORIAS_VEGETARIANA_OK = { legumbre: 1, huevo: 1, lacteo: 1, cereal: 1, tuberculo: 1, verdura: 1, fruta: 1, otro: 1 };
  var CATEGORIAS_SIN_PESCADO_EXCLUIDAS = { 'pescado-blanco': 1, 'pescado-azul': 1, marisco: 1 };
  var IDS_CERDO_CONOCIDOS = ['cerdo', 'lomo', 'panceta', 'jamon', 'chorizo', 'salchicha', 'beicon', 'morcilla', 'costillas-cerdo', 'secreto', 'presa', 'solomillo-cerdo', 'lacon', 'compango', 'ternera-rellena'];
  // Mercurio alto (Fase 4, 2026-07-21, borrador §PESCADO+HUEVOS + research AESAN 2019, evitar <10
  // años/embarazadas): atún rojo, pez espada/emperador, tiburón (varias especies), lucio. NINGUNO
  // está en el banco hoy (decisión ya resuelta: "atún fresco" del banco = atún claro, mercurio medio,
  // permitido) — preventivo para si algún día se da de alta alguno de estos, mismo patrón que
  // IDS_CERDO_CONOCIDOS. EDAD_MERCURIO=10 (AESAN), distinto de EDAD_MENOR=12 (criterio kcal).
  var IDS_MERCURIO_ALTO = ['atun-rojo', 'pez-espada', 'emperador', 'cazon', 'marrajo', 'mielga', 'pintarroja', 'tintorera', 'lucio'];
  var EDAD_MERCURIO = 10;

  var MAX_COMPLEMENTARIAS_POR_MENU = 2; // proteína ya cubierta por principal; hidrato+verdura como mucho (borrador §15 punto 2, límite duro)

  // ---------------------------------------------------------------
  // Utilidades (idénticas a engine.js v2 — sin cambios, se re-declaran aquí
  // para que este fichero sea autocontenido durante la obra; se deduplican
  // al fusionar en el cambio atómico final)
  // ---------------------------------------------------------------
  function edadEnAnios(anioNacimiento, hoyISO) {
    if (!anioNacimiento) return 30;
    var anioActual = parseInt((hoyISO || fechaLocalISO()).slice(0, 4), 10);
    return anioActual - anioNacimiento;
  }

  function capitaliza(s) { if (!s) return s; return s.charAt(0).toUpperCase() + s.slice(1); }

  function fechaLocalISO(d) {
    d = d || new Date(); // única función que puede tocar reloj real — solo si no se inyecta fechaReferencia (uso en navegador real)
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function fechaISO(fechaBase, offsetDias) {
    var d = new Date(fechaBase + 'T00:00:00');
    d.setDate(d.getDate() + offsetDias);
    return fechaLocalISO(d);
  }

  function lunesDeEstaSemana(fechaISOStr) {
    var d = new Date((fechaISOStr || fechaLocalISO()) + 'T00:00:00');
    var diaJs = d.getDay();
    var offsetALunes = diaJs === 0 ? -6 : 1 - diaJs;
    d.setDate(d.getDate() + offsetALunes);
    return fechaLocalISO(d);
  }

  function esFinDeSemana(diaIndex) { return diaIndex >= 5; }
  function estaEn(set, id) { return !!set[id]; }
  function vetosDe(miembros, fechaReferencia) {
    var set = {};
    (miembros || []).forEach(function (m) { (m.vetos || []).forEach(function (id) { set[id] = 1; }); });
    // Regla de mercurio (Fase 4, 2026-07-21): con un menor <10 en la mesa, veta las especies de
    // mercurio alto igual que un veto explícito — activa donde el motor ya filtra los vetos, sin
    // mecanismo nuevo. Sin efecto hoy (ninguna de esas especies está en el banco).
    var hayMenorMercurio = (miembros || []).some(function (m) { return edadEnAnios(m.anioNacimiento, fechaReferencia) < EDAD_MERCURIO; });
    if (hayMenorMercurio) IDS_MERCURIO_ALTO.forEach(function (id) { set[id] = 1; });
    return set;
  }

  // Disponibilidad por temporada (Roger 2026-07-21): un ingrediente con temporada:[meses]
  // solo está disponible en esos meses; sin temporada (o vacía) = todo el año. Se aplica en los
  // MISMOS puntos donde el motor filtra los vetos al resolver un eje — una opción fuera del mes se
  // descarta igual que un veto; si el pool del eje queda vacío, el plato entero no se ofrece.
  function mesDeFecha(fechaISOStr) { return new Date((fechaISOStr || fechaLocalISO()) + 'T00:00:00').getMonth() + 1; }
  function disponibleEnMes(banco, id, mes) {
    if (!mes) return true; // sin mes de contexto (previews, reescalado) = sin filtro de temporada
    var ing = banco && banco.ingredientes[id];
    if (!ing || !ing.temporada || !ing.temporada.length) return true; // sin temporada = todo el año
    return ing.temporada.indexOf(mes) !== -1;
  }

  // ---------------------------------------------------------------
  // 1. Necesidad calórica individual — IDÉNTICO a v2 (borrador §7: "Intacta")
  // ---------------------------------------------------------------
  function necesidadKcalDia(miembro, fechaReferencia) {
    var edad = edadEnAnios(miembro.anioNacimiento, fechaReferencia);
    var sexo = miembro.sexo || 'mujer';
    var esMenor = edad < EDAD_MENOR;
    // Default de actividad POR EDAD (Roger + ciencia 2026-07-21, IOM DRI EER usa 4 niveles en niños;
    // un niño sano que cumple la OMS de ≥60 min/día es "activo", nunca sedentario): adultos 'baja'
    // (vida de oficina sedentaria, lo común); menores 'media'. 'alta' si el niño hace deporte, a mano.
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
    // Objetivo "reducir" (recuperado de v1, estándar NIH): -500 kcal/día, suelo 1200, SOLO adultos.
    // Sin objetivo o 'mantenimiento' -> TDEE tal cual. Los menores nunca llevan déficit.
    if (!esMenor && miembro.objetivo === 'perdida') return Math.max(1200, kcal - 500);
    return kcal;
  }

  // ---------------------------------------------------------------
  // 2. Banda kcal AGREGADA de mesa (§14 punto 1 — EL cambio central de v3)
  // ---------------------------------------------------------------
  // objetivoBandaPersona: [min, max] de kcal para ESTA persona en este slot,
  // ya con el margen de trabajo aplicado. esFinde usa rango directo (no
  // simétrico); entresemana usa % fijo ±margen.
  function objetivoBandaPersona(miembro, tipoComida, esFinde, fechaReferencia, margen) {
    margen = margen == null ? MARGEN_KCAL_DEFECTO : margen;
    var kcalDia = necesidadKcalDia(miembro, fechaReferencia);
    var reparto = esFinde ? REPARTO_KCAL.finde[tipoComida] : REPARTO_KCAL.entresemana[tipoComida];
    if (!reparto) return null;
    if (esFinde) {
      // rango directo del reparto + margen de trabajo aplicado a cada extremo
      return [Math.round(kcalDia * reparto.min * (1 - margen)), Math.round(kcalDia * reparto.max * (1 + margen))];
    }
    var objetivo = kcalDia * reparto;
    return [Math.round(objetivo * (1 - margen)), Math.round(objetivo * (1 + margen))];
  }

  // banda agregada de TODA la mesa: suma de mínimos, suma de máximos (§14.1)
  function bandaAgregadaMesa(presentes, tipoComida, esFinde, fechaReferencia, margen) {
    var sumaMin = 0, sumaMax = 0;
    presentes.forEach(function (m) {
      var b = objetivoBandaPersona(m, tipoComida, esFinde, fechaReferencia, margen);
      if (!b) return;
      sumaMin += b[0]; sumaMax += b[1];
    });
    return { min: Math.round(sumaMin), max: Math.round(sumaMax) };
  }

  // ---------------------------------------------------------------
  // 3. Presencia — IDÉNTICO a v2 (borrador §7: "Intacta")
  // ---------------------------------------------------------------
  function excluidoPorCole(estado, miembro, fecha, tipoComida) {
    return tipoComida === 'comida' &&
      !!(estado.cole && estado.cole.dias && estado.cole.dias[fecha]) &&
      edadEnAnios(miembro.anioNacimiento, fecha) < EDAD_MENOR;
  }

  function presentesEnComida(estado, fecha, diaIndex, tipoComida) {
    var ausenciasDia = (estado.ausenciasPuntuales && estado.ausenciasPuntuales[fecha] && estado.ausenciasPuntuales[fecha][tipoComida]) || [];
    return (estado.familia || []).filter(function (m) {
      var patronDia = (m.patron && m.patron[tipoComida]) ? m.patron[tipoComida][diaIndex] : 'casa';
      if (patronDia !== 'casa') return false;
      if (ausenciasDia.indexOf(m.id) !== -1) return false;
      if (excluidoPorCole(estado, m, fecha, tipoComida)) return false;
      return true;
    });
  }

  // ---------------------------------------------------------------
  // 4. Elaboraciones — catálogo, disponibilidad, compatibilidad
  // ---------------------------------------------------------------
  function todasLasElaboraciones(bancoV3, estado) {
    return (bancoV3.elaboraciones || []).concat((estado && estado.propias) || []);
  }

  function elaboracionesDisponibles(bancoV3, estado) {
    var ocultas = {};
    (estado.ocultas || []).forEach(function (id) { ocultas[id] = 1; });
    return todasLasElaboraciones(bancoV3, estado).filter(function (e) { return !ocultas[e.id]; });
  }

  function elaboracionPorId(bancoV3, estado, id) {
    var todas = todasLasElaboraciones(bancoV3, estado);
    for (var i = 0; i < todas.length; i++) { if (todas[i].id === id) return todas[i]; }
    return null;
  }

  function principalesMixtas(bancoV3, estado, tipoComida) {
    return elaboracionesDisponibles(bancoV3, estado).filter(function (e) {
      return e.roles.indexOf('principal') !== -1 && (e.apta || []).indexOf(tipoComida) !== -1;
    });
  }

  // familia genérica por defecto cuando un principal no tiene entrada en
  // COMPATIBILIDAD (recetas propias del usuario, tramo 6: no forman parte del
  // banco curado — sin este fallback nunca generarían un combo válido, ningún
  // grupo faltante tendría complementaria candidata).
  var COMPLEMENTARIA_DEFECTO = { hidrato: 'hidrato-cocido', verdura: 'verdura-salteada-vapor' };

  function complementariasCompatibles(bancoV3, principalId, grupo) {
    var entradas = bancoV3.compatibilidad.filter(function (c) { return c.principalId === principalId; });
    var familias = entradas.length
      ? entradas.map(function (c) { return c.complementariaFamilia; })
      : [COMPLEMENTARIA_DEFECTO[grupo]].filter(Boolean);
    return bancoV3.elaboraciones.filter(function (e) {
      return e.roles.indexOf('complementaria') !== -1 && familias.indexOf(e.id) !== -1 && e.grupos.indexOf(grupo) !== -1;
    });
  }

  // ---------------------------------------------------------------
  // Dieta / mesa mixta — sobre el eje paramétrico de la elaboración (mismo
  // mecanismo que v2 `calcularAdaptaciones`/`plantillaViableParaMesa`; la
  // auditoría externa confirmó que NO hace falta flag `descomponible` nuevo
  // — borrador §14 "corregidos": si la elaboración no expone eje proteína
  // intercambiable, simplemente no es viable para esa mesa, se descarta).
  // ---------------------------------------------------------------
  function categoriaExcluidaPorDieta(categoria, dieta, ingredienteId) {
    if (!dieta || dieta === 'omnivora') return false;
    if (dieta === 'vegetariana') return !CATEGORIAS_VEGETARIANA_OK[categoria];
    if (dieta === 'sin-pescado') return !!CATEGORIAS_SIN_PESCADO_EXCLUIDAS[categoria];
    // Sin lactosa (Roger 2026-07-21, borrador §7): mismo mecanismo que vegetariana/sin-pescado —
    // excluye la categoría lácteo del eje paramétrico; el motor busca otra opción del MISMO eje
    // (p.ej. ensalada-completa con queso-feta -> pollo), no sustituye por un lácteo "sin lactosa"
    // (no hay tal opción en ningún eje hoy — los ingredientes sin-lactosa nuevos son de despensa).
    if (dieta === 'sin-lactosa') return categoria === 'lacteo';
    if (dieta === 'sin-cerdo') {
      var idNorm = (ingredienteId || '').toLowerCase();
      return IDS_CERDO_CONOCIDOS.some(function (k) { return idNorm.indexOf(k) !== -1; });
    }
    return false;
  }

  function opcionAptaParaDieta(opciones, dieta, banco, vetosUnion, mes) {
    var encontrada = null;
    (opciones || []).some(function (id) {
      if (estaEn(vetosUnion, id)) return false;
      if (!disponibleEnMes(banco, id, mes)) return false; // una adaptación de dieta tampoco escoge algo fuera de temporada
      var ing = banco.ingredientes[id];
      if (!ing) return false;
      if (categoriaExcluidaPorDieta(ing.categoria, dieta, id)) return false;
      encontrada = id;
      return true;
    });
    return encontrada;
  }

  // ¿Es esta elaboración PRINCIPAL/MIXTA viable para la mesa (vetos + dieta + temporada),
  // considerando solo su eje paramétrico (si lo tiene) y sus ids fijos?
  function elaboracionViableParaMesa(elaboracion, presentes, vetosUnion, banco, mes) {
    // restricción de vetos + temporada: al menos una opción del eje paramétrico (si existe) debe
    // sobrevivir a los vetos Y estar en temporada; los ids fijos NO tienen alternativa — si alguno
    // está vetado o fuera de temporada, la elaboración entera es inviable para esta mesa/mes.
    if (elaboracion.ingredientes.eje) {
      var quedaAlguna = elaboracion.ingredientes.opciones.some(function (id) { return !estaEn(vetosUnion, id) && disponibleEnMes(banco, id, mes); });
      if (!quedaAlguna) return false;
    }
    var fijosOk = Object.keys(elaboracion.ingredientes.fijos || {}).every(function (g) {
      return elaboracion.ingredientes.fijos[g].every(function (id) { return !estaEn(vetosUnion, id) && disponibleEnMes(banco, id, mes); });
    });
    if (!fijosOk) return false;

    // dieta/mesa mixta: solo aplica si el grupo paramétrico es 'proteina' (única adaptación soportada, §14 confirmado)
    if (elaboracion.ingredientes.eje !== 'proteina') return true;
    return (presentes || []).every(function (m) {
      var dieta = m.dieta || 'omnivora';
      if (dieta === 'omnivora') return true;
      return !!opcionAptaParaDieta(elaboracion.ingredientes.opciones, dieta, banco, vetosUnion, mes);
    });
  }

  function calcularAdaptaciones(elaboracion, seleccionEje, presentes, banco, vetosUnion, mes) {
    var adaptaciones = [];
    if (elaboracion.ingredientes.eje !== 'proteina' || !seleccionEje) return adaptaciones;
    var ingPrincipal = banco.ingredientes[seleccionEje];
    (presentes || []).forEach(function (m) {
      var dieta = m.dieta || 'omnivora';
      if (dieta === 'omnivora') return;
      if (ingPrincipal && !categoriaExcluidaPorDieta(ingPrincipal.categoria, dieta, seleccionEje)) return;
      var alt = opcionAptaParaDieta(elaboracion.ingredientes.opciones, dieta, banco, vetosUnion, mes);
      if (alt && alt !== seleccionEje) adaptaciones.push({ miembroId: m.id, eje: 'proteina', valor: alt });
    });
    return adaptaciones;
  }

  // ---------------------------------------------------------------
  // Kcal de un ingrediente con factor de TÉCNICA (§14 punto 2 + tramo 1
  // research: factor por GRUPO, nunca constante global — hallazgo del
  // factor frito no-uniforme x3.8 patata vs x1.3 huevo). Sin factor
  // sourced (null) → sin ajuste, se usa el kcal_100g base tal cual
  // (principio 9: sin dato, no se inventa multiplicador).
  // ---------------------------------------------------------------
  function kcalIngredienteConTecnica(ing, grupo, tecnicaCoccion, acabado, bancoV3) {
    var kcal = ing.kcal_100g;
    var tec = bancoV3.tecnicas_coccion[tecnicaCoccion];
    if (tec && tec.factor_kcal && tec.factor_kcal[grupo]) kcal = kcal * tec.factor_kcal[grupo];
    if (acabado) {
      var ac = bancoV3.acabados[acabado];
      if (ac && ac.factor_kcal && ac.factor_kcal[grupo]) kcal = ing.kcal_100g * ac.factor_kcal[grupo]; // el acabado (rebozado) sustituye al factor de cocción base, no se multiplican ambos
    }
    return kcal;
  }

  // ---------------------------------------------------------------
  // Variedad dura — restricción 5: ningún ingrediente de elaboración repetido
  // el mismo día ni en días consecutivos (intacta) + NUEVA: misma CATEGORÍA
  // de proteína no dos veces el mismo día (borrador §3.5, absorbe §11.2 de
  // MOTOR_RECETAS — cierra "pescado comida y cena").
  // ---------------------------------------------------------------
  function idsDeMenu(menu) {
    var ids = [];
    if (menu.seleccionEje) ids.push(menu.seleccionEje);
    Object.keys((menu.ingredientesFijos) || {}).forEach(function (g) { ids = ids.concat(menu.ingredientesFijos[g]); });
    (menu.complementarias || []).forEach(function (c) { if (c.seleccionEje) ids.push(c.seleccionEje); ids = ids.concat(c.fijos || []); });
    return ids;
  }

  function usadosEnDia(dia) {
    var set = {};
    if (!dia) return set;
    ['comida', 'cena'].forEach(function (tipo) {
      var slot = dia[tipo];
      if (slot && slot.menu) idsDeMenu(slot.menu).forEach(function (id) { set[id] = 1; });
    });
    return set;
  }

  function categoriasProteinaEnDia(dia, banco) {
    var set = {};
    if (!dia) return set;
    ['comida', 'cena'].forEach(function (tipo) {
      var slot = dia[tipo];
      if (!slot || !slot.menu) return;
      var idProteina = slot.menu.seleccionEje && slot.menu.grupoEje === 'proteina' ? slot.menu.seleccionEje : (slot.menu.ingredientesFijos && slot.menu.ingredientesFijos.proteina && slot.menu.ingredientesFijos.proteina[0]);
      var ing = idProteina && banco.ingredientes[idProteina];
      if (ing) set[ing.categoria] = 1;
    });
    return set;
  }

  function violaVariedad(idsCandidato, usadosHoy, usadosAyer) {
    return idsCandidato.some(function (id) { return estaEn(usadosHoy, id) || estaEn(usadosAyer, id); });
  }

  function violaProteinaMismaCategoriaMismoDia(categoriaProteinaCandidata, categoriasHoy) {
    return !!categoriaProteinaCandidata && estaEn(categoriasHoy, categoriaProteinaCandidata);
  }

  // ---------------------------------------------------------------
  // Cuotas semanales — restricción 6: categorias_cuota (intactas) + fritos
  // (nueva, dura). Mismo mecanismo que v2 (categoriasQueSuma/contador).
  // ---------------------------------------------------------------
  function categoriasQueSuma(categoria) {
    var claves = [categoria];
    if (categoria === 'pescado-azul' || categoria === 'pescado-blanco') claves.push('pescado-total');
    return claves;
  }

  function violaMaximoCuota(idsCandidato, contador, cuotas, banco) {
    return idsCandidato.some(function (id) {
      var ing = banco.ingredientes[id];
      if (!ing) return false;
      return categoriasQueSuma(ing.categoria).some(function (clave) {
        var cuota = cuotas[clave];
        if (!cuota || cuota.max_sem == null) return false;
        return (contador[clave] || 0) + 1 > cuota.max_sem;
      });
    });
  }

  function actualizarContadorCuotas(contador, idsCandidato, banco) {
    idsCandidato.forEach(function (id) {
      var ing = banco.ingredientes[id];
      if (!ing) return;
      categoriasQueSuma(ing.categoria).forEach(function (clave) { contador[clave] = (contador[clave] || 0) + 1; });
    });
  }

  // fritos: cuenta por tecnicaCoccion==='frito' de la elaboración PRINCIPAL del
  // menú (tramo 2, decisión documentada: la técnica de cocción real determina
  // absorción de aceite, no el acabado/recubrimiento)
  function violaCuotaFritos(tecnicaPrincipal, contadorFritos, cuotaFritos) {
    if (tecnicaPrincipal !== 'frito') return false;
    if (!cuotaFritos || cuotaFritos.max_sem == null) return false;
    return (contadorFritos.n || 0) + 1 > cuotaFritos.max_sem;
  }

  // ---------------------------------------------------------------
  // Estructura del menú — restricción 2 (NUEVA, borrador §3.2 + §15 punto 4):
  // los 3 grupos cubiertos (verificado por construcción de COMPATIBILIDAD,
  // pero se re-verifica aquí como guardarraíl) + máx 1 hidrato/menú + no 2
  // fritos en el mismo menú (además de la cuota semanal de fritos).
  // ---------------------------------------------------------------
  function verificarEstructura(principal, complementariasElegidas) {
    var grupos = {};
    principal.grupos.forEach(function (g) { grupos[g] = (grupos[g] || 0) + 1; });
    var fritosEnMenu = principal.tecnicaCoccion === 'frito' ? 1 : 0;
    var hidratosEnMenu = principal.grupos.indexOf('hidrato') !== -1 ? 1 : 0;

    var ok = complementariasElegidas.every(function (c) {
      c.elaboracion.grupos.forEach(function (g) { grupos[g] = (grupos[g] || 0) + 1; });
      if (c.elaboracion.grupos.indexOf('hidrato') !== -1) hidratosEnMenu++;
      if (c.elaboracion.tecnicaCoccion === 'frito') fritosEnMenu++;
      return true;
    });
    if (!ok) return { valido: false, motivo: 'error interno' };
    if (hidratosEnMenu > 1) return { valido: false, motivo: 'más de 1 hidrato en el menú' };
    if (fritosEnMenu > 1) return { valido: false, motivo: '2 fritos en el mismo menú' };
    if (!grupos.proteina || !grupos.hidrato || !grupos.verdura) return { valido: false, motivo: 'no cubre los 3 grupos: ' + JSON.stringify(grupos) };
    return { valido: true };
  }

  // ---------------------------------------------------------------
  // DecisionTrace (§15 punto 1): por qué se descarta cada candidato. Se
  // genera durante la búsqueda, se devuelve con el resultado, NUNCA se
  // persiste (no rompe pureza ni infla memoria) — alimenta debug/tests y la
  // transparencia "por qué este plato" (MOTOR_RECETAS §7 P2) leyendo el
  // trace real en vez de inventar prosa.
  // ---------------------------------------------------------------
  function nuevoTrace() {
    return { evaluados: 0, descartados: [], sobrevivientes: 0 };
  }
  function traceDescarta(trace, principalId, motivo, detalle) {
    trace.evaluados++;
    trace.descartados.push({ principalId: principalId, motivo: motivo, detalle: detalle || null });
  }
  function traceSobrevive(trace) { trace.evaluados++; trace.sobrevivientes++; }

  // ---------------------------------------------------------------
  // Construcción de candidatos: combos de complementarias para los grupos
  // que el principal NO cubre (0, 1 o 2 grupos faltantes — nunca más,
  // proteína siempre la cubre el principal).
  // ---------------------------------------------------------------
  function opcionesDeComplementaria(complementaria, vetosUnion, banco, mes) {
    return (complementaria.ingredientes.opciones || []).filter(function (id) { return !estaEn(vetosUnion, id) && disponibleEnMes(banco, id, mes); });
  }

  function generarCombosComplementarias(bancoV3, principalId, gruposFaltantes, vetosUnion, mes) {
    if (!gruposFaltantes.length) return [[]];
    var porGrupo = gruposFaltantes.map(function (grupo) {
      var compatibles = complementariasCompatibles(bancoV3, principalId, grupo);
      var opciones = [];
      compatibles.forEach(function (comp) {
        opcionesDeComplementaria(comp, vetosUnion, bancoV3, mes).forEach(function (id) { opciones.push({ elaboracion: comp, seleccionEje: id }); });
      });
      return opciones;
    });
    // producto cartesiano (como mucho 2 grupos faltantes, MAX_COMPLEMENTARIAS_POR_MENU) — espacio pequeño, sin necesidad de poda avanzada (§16)
    var combos = [[]];
    porGrupo.forEach(function (opciones) {
      var nuevas = [];
      combos.forEach(function (combo) { opciones.forEach(function (o) { nuevas.push(combo.concat([o])); }); });
      combos = nuevas;
    });
    return combos;
  }

  // ids únicos + metadata (grupo/tecnica/acabado) de TODOS los componentes de
  // un candidato (principal + complementarias) — base para kcal y para
  // idsDeMenu/variedad/cuotas, dedup por id (legumbre proteína=hidrato mismo id).
  function componentesDeCandidato(principal, seleccionEje, complementarias) {
    var vistos = {};
    var lista = [];
    function agrega(id, grupo, tecnicaCoccion, acabado) {
      if (!id || vistos[id]) return;
      vistos[id] = 1;
      lista.push({ id: id, grupo: grupo, tecnicaCoccion: tecnicaCoccion, acabado: acabado });
    }
    if (principal.ingredientes.eje) agrega(seleccionEje, principal.ingredientes.eje, principal.tecnicaCoccion, principal.acabado);
    Object.keys(principal.ingredientes.fijos || {}).forEach(function (g) {
      principal.ingredientes.fijos[g].forEach(function (id) { agrega(id, g, principal.tecnicaCoccion, principal.acabado); });
    });
    (complementarias || []).forEach(function (c) {
      if (c.elaboracion.ingredientes.eje) agrega(c.seleccionEje, c.elaboracion.ingredientes.eje, c.elaboracion.tecnicaCoccion, c.elaboracion.acabado);
      // fijos de la complementaria (p.ej. la lechuga base de una ensalada de 2 verduras) — cuentan
      // para kcal/compra/variedad igual que los del principal, no solo el ingrediente variable.
      Object.keys(c.elaboracion.ingredientes.fijos || {}).forEach(function (g) {
        c.elaboracion.ingredientes.fijos[g].forEach(function (id) { agrega(id, g, c.elaboracion.tecnicaCoccion, c.elaboracion.acabado); });
      });
    });
    return lista;
  }

  // ---------------------------------------------------------------
  // Cierre de banda kcal (§15 punto 2): ESCALAR raciones dentro de la
  // estructura primero (factor por persona, acotado 0.75-1.25, derivado de
  // SU propia necesidad Mifflin — nunca "ración H/M" inventada, principio 9).
  // Solo si escalar no basta (corto incluso al factor máximo), añadir UN
  // componente extra acotado: pan de acompañamiento (realista en mesa
  // española, simple, sin búsqueda — evita sobre-ingeniería, §16).
  // ---------------------------------------------------------------
  var ID_PAN_EXTRA = 'pan'; // único componente extra posible — bounded a propósito, no una búsqueda

  // Aliño/sofrito por técnica (addendum research 2026-07-21 §7): suma FIJA por ración, no
  // multiplicativa — el aceite de un guisado/salteado se reparte en el plato entero, no se
  // absorbe en un ingrediente concreto (a diferencia del factor de frito, que sí sube por
  // ingrediente). Se cuenta UNA VEZ por cada elaboración realmente usada en el menú (principal +
  // cada complementaria), nunca por línea de ingrediente — un guisado con 3 fijos no triplica el
  // aceite. Compartida entre cerrarBandaKcal (decide viabilidad) y resolverMenu (kcal final) para
  // que ambos coincidan siempre.
  function kcalAlinioPorRacion(principal, complementarias, bancoV3) {
    var tecnicas = [principal.tecnicaCoccion].concat((complementarias || []).map(function (c) { return c.elaboracion.tecnicaCoccion; }));
    return tecnicas.reduce(function (suma, tec) {
      var t = bancoV3.tecnicas_coccion[tec];
      return suma + ((t && t.kcal_extra_racion) || 0);
    }, 0);
  }

  function calcularKcalYFactor(componentes, presentes, bandaPersonaFn, banco, bancoV3, kcalAlinio) {
    var factorRacion = {};
    var kcalTotal = 0;
    presentes.forEach(function (persona) {
      var esNino = edadEnAnios(persona.anioNacimiento) < EDAD_MENOR;
      var kcalBase = kcalAlinio || 0;
      componentes.forEach(function (comp) {
        var ing = banco.ingredientes[comp.id];
        if (!ing) return;
        var gramos = esNino ? ing.racion_nino_g : ing.racion_adulto_g;
        var kcal100 = kcalIngredienteConTecnica(ing, comp.grupo, comp.tecnicaCoccion, comp.acabado, bancoV3);
        kcalBase += gramos * kcal100 / 100;
      });
      var bandaPersona = bandaPersonaFn(persona);
      var objetivoPersona = bandaPersona ? (bandaPersona[0] + bandaPersona[1]) / 2 : kcalBase;
      var factorNecesario = kcalBase > 0 ? objetivoPersona / kcalBase : 1;
      var factorClamp = Math.min(FACTOR_PERSONA_MAX, Math.max(FACTOR_PERSONA_MIN, factorNecesario));
      factorRacion[persona.id] = factorClamp;
      kcalTotal += kcalBase * factorClamp;
    });
    return { kcalTotal: Math.round(kcalTotal), factorRacion: factorRacion };
  }

  function cerrarBandaKcal(principal, seleccionEje, complementarias, presentes, banda, bandaPersonaFn, banco, bancoV3) {
    var componentes = componentesDeCandidato(principal, seleccionEje, complementarias);
    var kcalAlinio = kcalAlinioPorRacion(principal, complementarias, bancoV3);
    var r = calcularKcalYFactor(componentes, presentes, bandaPersonaFn, banco, bancoV3, kcalAlinio);
    if (r.kcalTotal >= banda.min && r.kcalTotal <= banda.max) {
      return { viable: true, kcalTotal: r.kcalTotal, factorRacion: r.factorRacion, componenteExtra: null };
    }
    if (r.kcalTotal > banda.max) return { viable: false, motivo: 'excede banda incluso al factor mínimo (' + r.kcalTotal + '>' + banda.max + ')' };

    // corto incluso escalando al máximo — probar el único extra permitido (pan), salvo que el
    // menú ya tenga pan como hidrato (no duplicar el mismo ingrediente como "extra")
    var yaTienePan = componentes.some(function (c) { return c.id === ID_PAN_EXTRA; });
    if (yaTienePan) return { viable: false, motivo: 'corto (' + r.kcalTotal + '<' + banda.min + ') y ya incluye pan, sin más extra posible' };

    var componentesConExtra = componentes.concat([{ id: ID_PAN_EXTRA, grupo: 'hidrato', tecnicaCoccion: null, acabado: null }]);
    var r2 = calcularKcalYFactor(componentesConExtra, presentes, bandaPersonaFn, banco, bancoV3, kcalAlinio);
    if (r2.kcalTotal >= banda.min && r2.kcalTotal <= banda.max) {
      return { viable: true, kcalTotal: r2.kcalTotal, factorRacion: r2.factorRacion, componenteExtra: ID_PAN_EXTRA };
    }
    return { viable: false, motivo: 'corto ni escalando ni con pan extra (' + r2.kcalTotal + ' vs [' + banda.min + ',' + banda.max + '])' };
  }

  // ---------------------------------------------------------------
  // Generación de candidatos para UN slot (comida o cena de un día) — fase
  // pura "generar candidatos válidos" (§15): enumeración con poda temprana,
  // NO un solver CSP (§16). Devuelve {candidatos, trace, banda}.
  // ---------------------------------------------------------------
  function generarCandidatosSlot(ctx) {
    // ctx: { bancoV3, banco, estado, presentes, tipoComida, esFinde, fechaReferencia,
    //        vetosUnion, vetosViabilidad, usadosHoy, usadosAyer, categoriasProteinaHoy,
    //        contadorCuotas, cuotas, contadorFritos, cuotaFritos, margenKcal,
    //        ignorarEsfuerzo, disponibles (modo nevera, opcional), principalExcluido (opcional) }
    var trace = nuevoTrace();
    var candidatos = [];
    var banda = bandaAgregadaMesa(ctx.presentes, ctx.tipoComida, ctx.esFinde, ctx.fechaReferencia, ctx.margenKcal);
    var bandaPersonaFn = function (persona) { return objetivoBandaPersona(persona, ctx.tipoComida, ctx.esFinde, ctx.fechaReferencia, ctx.margenKcal); };

    principalesMixtas(ctx.bancoV3, ctx.estado, ctx.tipoComida).forEach(function (principal) {
      if (ctx.principalExcluido && principal.id === ctx.principalExcluido) { traceDescarta(trace, principal.id, 'excluido: es el principal ya mostrado en este slot (otro menú)'); return; }
      if (!ctx.ignorarEsfuerzo && !ctx.esFinde && principal.esfuerzo === 'elaborado') { traceDescarta(trace, principal.id, 'esfuerzo: elaborado solo finde'); return; }
      if (!elaboracionViableParaMesa(principal, ctx.presentes, ctx.vetosViabilidad || ctx.vetosUnion, ctx.banco, ctx.mes)) { traceDescarta(trace, principal.id, 'mesa mixta/dieta/temporada inviable'); return; }

      var opcionesEje = principal.ingredientes.eje ? principal.ingredientes.opciones.filter(function (id) { return !estaEn(ctx.vetosUnion, id) && disponibleEnMes(ctx.banco, id, ctx.mes); }) : [null];
      if (principal.ingredientes.eje && !opcionesEje.length) { traceDescarta(trace, principal.id, 'todas las opciones del eje vetadas o fuera de temporada'); return; }

      opcionesEje.forEach(function (opcionEje) {
        var idsPrincipal = [];
        if (opcionEje) idsPrincipal.push(opcionEje);
        Object.values(principal.ingredientes.fijos || {}).forEach(function (lista) { idsPrincipal = idsPrincipal.concat(lista); });

        if (violaVariedad(idsPrincipal, ctx.usadosHoy, ctx.usadosAyer)) { traceDescarta(trace, principal.id, 'variedad (día actual/anterior)'); return; }

        var idProteinaCandidata = principal.ingredientes.eje === 'proteina' ? opcionEje : (principal.ingredientes.fijos && principal.ingredientes.fijos.proteina && principal.ingredientes.fijos.proteina[0]);
        var ingProteina = idProteinaCandidata && ctx.banco.ingredientes[idProteinaCandidata];
        if (violaProteinaMismaCategoriaMismoDia(ingProteina && ingProteina.categoria, ctx.categoriasProteinaHoy)) { traceDescarta(trace, principal.id, 'misma categoría de proteína ya usada hoy'); return; }

        if (violaMaximoCuota(idsPrincipal, ctx.contadorCuotas, ctx.cuotas, ctx.banco)) { traceDescarta(trace, principal.id, 'cuota máxima semanal'); return; }
        if (violaCuotaFritos(principal.tecnicaCoccion, ctx.contadorFritos, ctx.cuotaFritos)) { traceDescarta(trace, principal.id, 'cuota máxima de fritos'); return; }

        var gruposFaltantes = ['proteina', 'hidrato', 'verdura'].filter(function (g) { return principal.grupos.indexOf(g) === -1; });
        var combos = generarCombosComplementarias(ctx.bancoV3, principal.id, gruposFaltantes, ctx.vetosUnion, ctx.mes);

        combos.forEach(function (combo) {
          var idsCombo = [];
          combo.forEach(function (c) { idsCombo.push(c.seleccionEje); });

          if (violaVariedad(idsCombo, ctx.usadosHoy, ctx.usadosAyer)) { traceDescarta(trace, principal.id, 'complementaria viola variedad'); return; }
          if (violaMaximoCuota(idsCombo, ctx.contadorCuotas, ctx.cuotas, ctx.banco)) { traceDescarta(trace, principal.id, 'complementaria viola cuota máxima'); return; }

          var estructura = verificarEstructura(principal, combo.map(function (c) { return { elaboracion: c.elaboracion }; }));
          if (!estructura.valido) { traceDescarta(trace, principal.id, 'estructura: ' + estructura.motivo); return; }

          var idsTotal = idsPrincipal.concat(idsCombo);
          var faltantesNevera = [];
          if (ctx.disponibles) {
            faltantesNevera = idsTotal.filter(function (id) { return ctx.disponibles.indexOf(id) === -1; });
            if (faltantesNevera.length > 1) { traceDescarta(trace, principal.id, 'nevera: faltan ' + faltantesNevera.length + ' ingredientes'); return; }
          }

          var cierre = cerrarBandaKcal(principal, opcionEje, combo, ctx.presentes, banda, bandaPersonaFn, ctx.banco, ctx.bancoV3);
          if (!cierre.viable) { traceDescarta(trace, principal.id, 'banda kcal: ' + cierre.motivo); return; }

          traceSobrevive(trace);
          candidatos.push({
            principal: principal, seleccionEje: opcionEje, complementarias: combo,
            kcalTotal: cierre.kcalTotal, factorRacion: cierre.factorRacion, componenteExtra: cierre.componenteExtra,
            faltantesNevera: faltantesNevera
          });
        });
      });
    });

    return { candidatos: candidatos, trace: trace, banda: banda };
  }

  // ---------------------------------------------------------------
  // Señales SUAVES (§2 MOTOR_RECETAS + §4 borrador v3) — desempatan entre
  // candidatos YA válidos (todas las restricciones duras cumplidas). Todas
  // re-ancladas a la elaboración PRINCIPAL, mismo mecanismo que v2.
  // ---------------------------------------------------------------
  function puntuarCuotasPendientes(idsCandidato, contador, cuotas, banco, slotsRestantes) {
    var bonus = 0;
    idsCandidato.forEach(function (id) {
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

  // centrado dentro de la banda ya aprobada (restricción dura §8 cumplida) — más cerca del
  // centro, mejor. Reemplaza puntuarKcal de v2 (allí era la restricción; aquí es desempate).
  function puntuarCentradoBanda(kcalTotal, banda) {
    var centro = (banda.min + banda.max) / 2;
    var mitadRango = Math.max(1, (banda.max - banda.min) / 2);
    var desvio = Math.abs(kcalTotal - centro) / mitadRango; // 0 en el centro, 1 en el borde
    return -desvio * 8;
  }

  function puntuarRechazos(principalId, rechazosPorPrincipal) {
    var n = Math.min((rechazosPorPrincipal && rechazosPorPrincipal[principalId]) || 0, 3);
    return -n * 6;
  }

  var HISTORIAL_SEMANAS = 6;
  function semanasEntre(semanaISOAntigua, semanaISONueva) {
    var a = new Date(semanaISOAntigua + 'T00:00:00'), b = new Date(semanaISONueva + 'T00:00:00');
    return Math.round((b - a) / (7 * 24 * 3600 * 1000));
  }

  function puntuarRecencia(principalId, historial, semanaISO, gustasPorPrincipal) {
    var ultimo = historial && historial[principalId];
    if (!ultimo) return 0;
    var distancia = semanasEntre(ultimo, semanaISO);
    if (gustasPorPrincipal && gustasPorPrincipal[principalId] >= 2) distancia += 1;
    if (distancia <= 1) return -12;
    if (distancia === 2) return -6;
    return 0;
  }

  function puntuarNovedad(principalId, historial) { return historial && historial[principalId] ? 0 : 4; }

  function puntuarRepeticionSemana(principalId, usosSemana) {
    var n = Math.min((usosSemana && usosSemana[principalId]) || 0, 3);
    return -n * 8;
  }

  function estacionDelMes(mes) {
    if (mes >= 6 && mes <= 9) return 'verano';
    if (mes >= 11 || mes <= 3) return 'invierno';
    return null;
  }
  function puntuarTemporada(principal, estacion) {
    if (!principal.temporada || !estacion) return 0;
    return principal.temporada === estacion ? 5 : -5;
  }
  function puntuarRegion(principal, familiaRegion) { return (familiaRegion && principal.region === familiaRegion) ? 4 : 0; }

  // ---------------------------------------------------------------
  // Ocasión de plato (Fase 4, 2026-07-21, borrador §Preparaciones·MIXTOS "Ocasión: canelones (Sant
  // Esteve), escudella (Navidad), potaje de vigilia (Semana Santa) -> entran tagueados"). Señal
  // BLANDA (realza el plato en su ventana, no filtra por stock — igual espíritu que puntuarTemporada,
  // nunca un veto). Semana Santa es fiesta movible: domingo de Pascua vía el algoritmo gregoriano
  // anónimo (Meeus/Jones/Butcher, verificado contra python-dateutil para 2024-2028) — pura aritmética
  // de calendario, Date.UTC(y,m,d) con argumentos explícitos no toca el reloj real.
  // ---------------------------------------------------------------
  function pascuaDomingo(anio) {
    var a = anio % 19, b = Math.floor(anio / 100), c = anio % 100;
    var d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
    var h = (19 * a + b - d - g + 15) % 30;
    var i = Math.floor(c / 4), k = c % 4;
    var l = (32 + 2 * e + 2 * i - h - k) % 7;
    var m = Math.floor((a + 11 * h + 22 * l) / 451);
    var mes = Math.floor((h + l - 7 * m + 114) / 31);
    var dia = ((h + l - 7 * m + 114) % 31) + 1;
    return { anio: anio, mes: mes, dia: dia };
  }
  function diaEpoch(anio, mes, dia) { return Date.UTC(anio, mes - 1, dia) / 86400000; }
  function ocasionDeFecha(fechaISOStr) {
    var partes = fechaISOStr.split('-');
    var anio = parseInt(partes[0], 10), mes = parseInt(partes[1], 10), dia = parseInt(partes[2], 10);
    if (mes === 12 && dia >= 20 && dia <= 25) return 'navidad'; // Nochebuena/Navidad
    if (mes === 12 && dia >= 26 && dia <= 28) return 'sant-esteve'; // 26-dic + margen corto
    var pascua = pascuaDomingo(anio);
    var offset = diaEpoch(anio, mes, dia) - diaEpoch(pascua.anio, pascua.mes, pascua.dia);
    if (offset >= -7 && offset <= 1) return 'semana-santa'; // domingo de Ramos -> lunes de Pascua
    return null;
  }
  function puntuarOcasion(principal, ocasionActual) {
    if (!principal.ocasion || !ocasionActual) return 0;
    return principal.ocasion === ocasionActual ? 8 : 0; // nunca malus — no penaliza fuera de fecha, solo realza dentro
  }
  function puntuarCambios(principalId, cambiosPorPrincipal) {
    var n = Math.min((cambiosPorPrincipal && cambiosPorPrincipal[principalId]) || 0, 3);
    return -n * 3;
  }

  // Cole → cena, AMPLIADA y SCOPED (§14 punto 5 + borrador §4): compara
  // contra D y D+1 (calendario real del cole) — regla única: cena del día D
  // evita comidas de cole de D y D+1. SCOPING: el malus solo se aplica si
  // ALGÚN presente en esta cena es un menor (<12) — si todos los menores
  // están ausentes de esta cena concreta, no hay a quién "complementar" y
  // el malus no debe penalizar la cena de los adultos.
  var TIPOS_HIDRATO_COLE = {
    pasta: { pasta: 1, fideos: 1, 'placas-lasana': 1 }, arroz: { arroz: 1 }, patata: { patata: 1, boniato: 1 },
    pan: { pan: 1, 'pan-integral': 1, 'pan-pita': 1, 'pan-hamburguesa': 1, 'tortilla-trigo': 1, 'masa-pizza': 1, 'masa-empanadilla': 1 }
  };
  function puntuarCole(idsCandidato, coleDiaD, coleDiaDMas1, presentes, banco) {
    var hayMenorPresente = (presentes || []).some(function (m) { return edadEnAnios(m.anioNacimiento) < EDAD_MENOR; });
    if (!hayMenorPresente) return 0; // SCOPING — sin menor en esta cena, sin señal
    var malus = 0;
    [coleDiaD, coleDiaDMas1].forEach(function (coleDia) {
      if (!coleDia) return;
      idsCandidato.forEach(function (id) {
        var ing = banco.ingredientes[id];
        if (!ing) return;
        if (coleDia.proteina && ing.categoria === coleDia.proteina) malus -= 8;
        if (coleDia.hidrato) {
          var esTipo = coleDia.hidrato === 'legumbre' ? ing.categoria === 'legumbre' : !!(TIPOS_HIDRATO_COLE[coleDia.hidrato] && TIPOS_HIDRATO_COLE[coleDia.hidrato][id]);
          if (esTipo) malus -= 8;
        }
      });
    });
    return malus;
  }

  // Preferencia de técnica saludable (NUEVA v3, borrador §4): bonus/malus por
  // salubridad de la técnica del PRINCIPAL. Blando a propósito (dosifica, no
  // excluye — principio 8). Técnicas sin cita (salubridad null: guisado/
  // salteado/crudo) NO puntúan — ausencia de señal, no cita positiva (mismo
  // criterio que el research documentó, nunca inventar un nivel neutro).
  function puntuarSalubridadTecnica(principal, bancoV3) {
    var tec = bancoV3.tecnicas_coccion[principal.tecnicaCoccion];
    if (!tec || tec.salubridad == null) return 0;
    if (tec.salubridad === 1) return 3;
    if (tec.salubridad === 3) return -3;
    return 0;
  }

  // Favoritas (NUEVA v3 con efecto real — MOTOR_RECETAS §11.3 resuelto:
  // hoy decorativo, aquí señal real sobre principales). Peso >+8 (más que
  // repertorio +8, por ser explícita y no inferida) — valor de partida,
  // calibrable.
  var PESO_FAVORITA = 10;
  function puntuarFavorita(principalId, favoritas) { return (favoritas && favoritas.indexOf(principalId) !== -1) ? PESO_FAVORITA : 0; }

  // Ausencia estructural (NUEVA v3): bonus a ingredientes vetados por un
  // miembro que estructuralmente NO está en casa hoy (patrón, no presente) —
  // compensa que hoy esos ingredientes están infra-representados toda la
  // semana solo por la presencia de quien los veta.
  function puntuarAusenciaEstructural(idsCandidato, familiaCompleta, presentesIds, tipoComida, diaIndex, banco) {
    var bonus = 0;
    (familiaCompleta || []).forEach(function (m) {
      if (presentesIds.indexOf(m.id) !== -1) return; // está presente, no aplica
      var patronDia = (m.patron && m.patron[tipoComida]) ? m.patron[tipoComida][diaIndex] : 'casa';
      if (patronDia === 'casa') return; // ausencia puntual solamente cuenta como "fuera" a efectos de esta señal si el patrón ya lo marca fuera
      (m.vetos || []).forEach(function (idVetado) { if (idsCandidato.indexOf(idVetado) !== -1) bonus += 4; });
    });
    return bonus;
  }

  function puntuarCandidato(candidato, ctx, senales) {
    var idsCombo = candidato.complementarias.map(function (c) { return c.seleccionEje; });
    var idsPrincipal = [];
    if (candidato.seleccionEje) idsPrincipal.push(candidato.seleccionEje);
    Object.values(candidato.principal.ingredientes.fijos || {}).forEach(function (l) { idsPrincipal = idsPrincipal.concat(l); });
    var idsTotal = idsPrincipal.concat(idsCombo);
    var presentesIds = ctx.presentes.map(function (p) { return p.id; });

    return puntuarCuotasPendientes(idsTotal, ctx.contadorCuotas, ctx.cuotas, ctx.banco, senales.slotsRestantes)
      + puntuarCentradoBanda(candidato.kcalTotal, ctx.bandaSlot)
      + puntuarRechazos(candidato.principal.id, senales.rechazosPorPrincipal)
      + puntuarRecencia(candidato.principal.id, senales.historialPrincipales, senales.semanaISO, senales.gustasPorPrincipal)
      + puntuarNovedad(candidato.principal.id, senales.historialPrincipales)
      + puntuarRepeticionSemana(candidato.principal.id, senales.usosSemana)
      + puntuarTemporada(candidato.principal, senales.estacion)
      + puntuarOcasion(candidato.principal, senales.ocasion)
      + puntuarRegion(candidato.principal, senales.familiaRegion)
      + puntuarCambios(candidato.principal.id, senales.cambiosPorPrincipal)
      + puntuarCole(idsTotal, senales.coleDiaD, senales.coleDiaDMas1, ctx.presentes, ctx.banco)
      + puntuarSalubridadTecnica(candidato.principal, ctx.bancoV3)
      + puntuarFavorita(candidato.principal.id, senales.favoritas)
      + puntuarAusenciaEstructural(idsTotal, senales.familiaCompleta, presentesIds, ctx.tipoComida, senales.diaIndex, ctx.banco);
  }

  // ---------------------------------------------------------------
  // Elegir determinista top-N (§14 punto 4 + §15): tie-breaker TOTAL
  // score DESC, id-canónico ASC — nunca desempate implícito de motor de JS.
  // ---------------------------------------------------------------
  function idCanonicoCandidato(candidato) {
    var idsCombo = candidato.complementarias.map(function (c) { return c.elaboracion.id + ':' + c.seleccionEje; }).sort();
    return candidato.principal.id + '|' + (candidato.seleccionEje || '') + '|' + idsCombo.join(',') + (candidato.componenteExtra ? '|+' + candidato.componenteExtra : '');
  }

  function ordenarDeterminista(puntuados) {
    return puntuados.slice().sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.idCanonico < b.idCanonico ? -1 : (a.idCanonico > b.idCanonico ? 1 : 0);
    });
  }

  function elegirTopN(candidatos, ctx, senales, n) {
    var puntuados = candidatos.map(function (c) { return { candidato: c, score: puntuarCandidato(c, ctx, senales), idCanonico: idCanonicoCandidato(c) }; });
    return ordenarDeterminista(puntuados).slice(0, n);
  }

  // ---------------------------------------------------------------
  // Jerarquía de RELAJACIÓN ante 0 soluciones (§15 punto 3): distinto del
  // orden de APLICACIÓN de restricciones (solo poda, no cambia qué
  // sobrevive) — esto SÍ es lógica de producto, orden decidido y explícito.
  // Vetos y dieta/mesa-mixta NUNCA se relajan (foso #1 + posible alergia).
  // Orden: (1) tal cual → (2) esfuerzo → (3) variedad → (4) banda kcal más
  // ancha → (5) cuotas máximas (último recurso, protegen salud) → (6) vacío.
  // ---------------------------------------------------------------
  var NIVELES_RELAJACION = [
    { id: 'estricto', ignorarEsfuerzo: false, ignorarVariedad: false, margenKcal: null, ignorarCuotas: false },
    { id: 'esfuerzo', ignorarEsfuerzo: true, ignorarVariedad: false, margenKcal: null, ignorarCuotas: false },
    { id: 'variedad', ignorarEsfuerzo: true, ignorarVariedad: true, margenKcal: null, ignorarCuotas: false },
    { id: 'banda-ancha', ignorarEsfuerzo: true, ignorarVariedad: true, margenKcal: 0.20, ignorarCuotas: false },
    { id: 'cuotas', ignorarEsfuerzo: true, ignorarVariedad: true, margenKcal: 0.20, ignorarCuotas: true }
  ];

  function generarCandidatosConRelajacion(ctxBase, margenDefecto) {
    for (var i = 0; i < NIVELES_RELAJACION.length; i++) {
      var nivel = NIVELES_RELAJACION[i];
      var ctx = Object.assign({}, ctxBase, {
        ignorarEsfuerzo: ctxBase.ignorarEsfuerzo || nivel.ignorarEsfuerzo,
        usadosHoy: nivel.ignorarVariedad ? {} : ctxBase.usadosHoy,
        usadosAyer: nivel.ignorarVariedad ? {} : ctxBase.usadosAyer,
        principalExcluido: nivel.ignorarVariedad ? null : ctxBase.principalExcluido,
        margenKcal: nivel.margenKcal != null ? nivel.margenKcal : (margenDefecto == null ? MARGEN_KCAL_DEFECTO : margenDefecto),
        contadorCuotas: nivel.ignorarCuotas ? {} : ctxBase.contadorCuotas,
        cuotaFritos: nivel.ignorarCuotas ? null : ctxBase.cuotaFritos
      });
      var r = generarCandidatosSlot(ctx);
      if (r.candidatos.length) return { candidatos: r.candidatos, trace: r.trace, banda: r.banda, nivelRelajacion: nivel.id, ctxUsado: ctx };
    }
    return { candidatos: [], trace: nuevoTrace(), banda: bandaAgregadaMesa(ctxBase.presentes, ctxBase.tipoComida, ctxBase.esFinde, ctxBase.fechaReferencia, margenDefecto), nivelRelajacion: 'vacio', ctxUsado: ctxBase };
  }

  // ---------------------------------------------------------------
  // Postre del día — modelo AESAN sin cambios (borrador §7), componente del
  // menú determinista fuera del scoring. Fusión frutas_mes → temporada (Roger
  // 2026-07-21): la fruta de diario ya NO vive en postres.frutas_mes; el
  // selector lee la temporada de cada ingrediente-fruta (mismo campo que el
  // filtro de disponibilidad del motor). Rotación por día + semana para que
  // todas las frutas de temporada del mes tengan turno a lo largo de las semanas.
  // ---------------------------------------------------------------
  function frutasDeTemporada(banco, mes) {
    return Object.keys(banco.ingredientes).filter(function (id) {
      var ing = banco.ingredientes[id];
      return ing.categoria === 'fruta' && disponibleEnMes(banco, id, mes);
    });
  }
  function postreDelDia(banco, fecha, diaIndex) {
    var postres = banco && banco.postres;
    if (!postres) return null;
    var d = new Date(fecha + 'T00:00:00');
    var mes = d.getMonth() + 1;
    if (diaIndex === 5 && postres.lacteo) {
      var ingL = banco.ingredientes[postres.lacteo];
      return { tipo: 'lacteo', id: postres.lacteo, nombre: (ingL ? ingL.nombre : 'Yogur natural') + ' con fruta' };
    }
    if (diaIndex === 6 && (postres.tradicionales || []).length) {
      var estacion = estacionDelMes(mes);
      var aptos = postres.tradicionales.filter(function (p) { return !p.temporada || !estacion || p.temporada === estacion; });
      if (!aptos.length) aptos = postres.tradicionales;
      var nSemana = Math.floor(d.getTime() / (7 * 24 * 3600 * 1000));
      var elegido = aptos[nSemana % aptos.length];
      return { tipo: 'tradicional', nombre: elegido.nombre, receta_aparte: true };
    }
    var frutas = frutasDeTemporada(banco, mes);
    if (!frutas.length) return null;
    var nSemana = Math.floor(d.getTime() / (7 * 24 * 3600 * 1000));
    var idFruta = frutas[(diaIndex + nSemana) % frutas.length];
    var ingF = banco.ingredientes[idFruta];
    return { tipo: 'fruta', id: idFruta, nombre: ingF ? ingF.nombre : idFruta };
  }

  // ---------------------------------------------------------------
  // Resolución de un candidato a menú completo (nombre, pasos, kcal por
  // comensal, ingredientes para la compra) — el paso CARO que el iterator
  // lazy difiere hasta que el caller realmente lo consume (1 o top-3 nevera).
  // ---------------------------------------------------------------
  var PASOS_GENERICOS_COMPLEMENTARIA = {
    hervido: 'Cocer {ingrediente} en agua con sal hasta que esté tierno/a.',
    horno: 'Hornear {ingrediente} a 200°C hasta que esté hecho/a.',
    frito: 'Freír {ingrediente} en aceite bien caliente hasta dorar.',
    salteado: 'Saltear {ingrediente} en una sartén con un poco de aceite.',
    crudo: 'Lavar y preparar {ingrediente} en crudo.',
    vapor: 'Cocer {ingrediente} al vapor hasta que esté tierno/a.'
  };
  function pasosComplementaria(complementaria, idElegido, banco) {
    var ing = banco.ingredientes[idElegido];
    var nombre = ing ? ing.nombre.toLowerCase() : idElegido;
    // Ensalada (Roger 2026-07-21): preparación propia, SIEMPRE aliñada y como plato de verdura, no
    // un ingrediente crudo suelto. Enumera todas sus verduras (fijas + la variable) y termina en el
    // aliño — nadie come una ensalada sin aliñar.
    if (complementaria.tecnicaCoccion === 'ensalada') {
      var verduras = [];
      Object.keys(complementaria.ingredientes.fijos || {}).forEach(function (g) {
        (complementaria.ingredientes.fijos[g] || []).forEach(function (fid) { var f = banco.ingredientes[fid]; verduras.push((f ? f.nombre : fid).toLowerCase()); });
      });
      if (idElegido) verduras.push(nombre);
      verduras = verduras.filter(function (v, i) { return verduras.indexOf(v) === i; });
      var listaTxt = verduras.length > 1 ? verduras.slice(0, -1).join(', ') + ' y ' + verduras[verduras.length - 1] : verduras[0];
      var matizZanahoria = verduras.indexOf('zanahoria') !== -1 ? ' (la zanahoria, rallada)' : '';
      return [
        'Lavar y cortar ' + listaTxt + matizZanahoria + '.',
        'Aliñar con aceite de oliva, sal y un chorrito de vinagre, y servir.'
      ];
    }
    if (!complementaria.tecnicaCoccion) return ['Servir ' + nombre + ' tal cual, sin cocinar.'];
    var plantillaPaso = PASOS_GENERICOS_COMPLEMENTARIA[complementaria.tecnicaCoccion] || 'Preparar {ingrediente}.';
    return [plantillaPaso.split('{ingrediente}').join(capitaliza(nombre))];
  }

  function minuscula(s) { if (!s) return s; return s.charAt(0).toLowerCase() + s.slice(1); }

  function resolverNombre(elaboracion, seleccionEje, banco) {
    if (!elaboracion.ingredientes.eje || !seleccionEje) return elaboracion.nombre;
    var ing = banco.ingredientes[seleccionEje];
    // Sin el paréntesis del corte en el TÍTULO (Roger 2026-07-21): "Pollo (pechuga o contramuslo)"
    // -> "pollo" para que "Wrap casero de pollo" quede limpio. El detalle se conserva íntegro en la
    // lista de ingredientes de la receta (que usa ing.nombre directo, no esta función).
    var nombreIng = ing ? ing.nombre.replace(/\s*\([^)]*\)/g, '').trim() : seleccionEje;
    // los nombres de ingrediente en el banco vienen SIEMPRE capitalizados ("Arroz") — v2
    // solo sustituía al inicio de frase. A mitad de frase ("Guarnición de {hidrato}") hay
    // que minuscular explícitamente, no basta con no capitalizar (la fuente ya lo está).
    var placeholder = '{' + elaboracion.ingredientes.eje + '}';
    var texto = elaboracion.nombre.indexOf(placeholder) === 0 ? capitaliza(nombreIng) : minuscula(nombreIng);
    return elaboracion.nombre.split(placeholder).join(texto);
  }

  // Pasos de una elaboración resueltos para SU propio eje — filtra líneas que
  // mencionen un placeholder de un grupo que ya NO es interno (v2 describía
  // proteína+hidrato+verdura como un solo texto; en v3 hidrato/verdura externos
  // tienen su PROPIA elaboración con sus propios pasos vía pasosComplementaria,
  // así que esas líneas del principal ya no aplican — se descartan, no se dejan
  // con el placeholder colgado).
  function pasosDeElaboracion(elaboracion, seleccionEje, banco) {
    var eje = elaboracion.ingredientes.eje;
    var pasos = (elaboracion.pasos || []).filter(function (paso) {
      var placeholders = (paso.match(/\{(\w+)\}/g) || []).map(function (p) { return p.slice(1, -1); });
      return placeholders.every(function (p) { return p === eje; });
    });
    // pasosPorOpcion (Roger 2026-07-22, hallazgo real: "Ensalada de quinoa con huevo" solo decía
    // "Preparar huevo" — el nombre sustituido en una frase genérica no dice CÓMO). Cuando existen
    // instrucciones específicas para el ingrediente EXACTO elegido, sustituyen en su sitio el paso
    // que menciona el eje; el resto de pasos (sin placeholder) sigue igual. Opt-in por elaboración —
    // sin entrada para la opción elegida, se usa la sustitución genérica de siempre (sin cambios).
    var pasosOpcion = eje && elaboracion.pasosPorOpcion && seleccionEje && elaboracion.pasosPorOpcion[seleccionEje];
    if (pasosOpcion) {
      var idx = pasos.findIndex(function (p) { return p.indexOf('{' + eje + '}') !== -1; });
      if (idx !== -1) return pasos.slice(0, idx).concat(pasosOpcion, pasos.slice(idx + 1));
    }
    return pasos
      .map(function (paso) {
        if (!eje || !seleccionEje) return paso;
        var ing = banco.ingredientes[seleccionEje];
        return paso.split('{' + eje + '}').join(ing ? capitaliza(ing.nombre) : seleccionEje);
      });
  }

  function resolverMenu(candidato, ctx) {
    var banco = ctx.banco, bancoV3 = ctx.bancoV3;
    var nombrePrincipal = resolverNombre(candidato.principal, candidato.seleccionEje, banco);
    var pasosPrincipal = pasosDeElaboracion(candidato.principal, candidato.seleccionEje, banco);

    var complementariasResueltas = candidato.complementarias.map(function (c) {
      return { id: c.elaboracion.id, nombre: resolverNombre(c.elaboracion, c.seleccionEje, banco), seleccionEje: c.seleccionEje, pasos: pasosComplementaria(c.elaboracion, c.seleccionEje, banco) };
    });

    var adaptaciones = calcularAdaptaciones(candidato.principal, candidato.seleccionEje, ctx.presentes, banco, ctx.vetosViabilidad || ctx.vetosUnion, ctx.mes);
    var mapaAdaptaciones = {};
    adaptaciones.forEach(function (a) { mapaAdaptaciones[a.miembroId] = a; });

    var componentes = componentesDeCandidato(candidato.principal, candidato.seleccionEje, candidato.complementarias);
    if (candidato.componenteExtra) componentes = componentes.concat([{ id: candidato.componenteExtra, grupo: 'hidrato', tecnicaCoccion: null, acabado: null }]);

    var kcalAlinioBase = kcalAlinioPorRacion(candidato.principal, candidato.complementarias, bancoV3);

    var ingredientesCompra = []; // [{id, gramos}]
    var kcalPorComensal = [];
    var kcalTotalReal = 0;

    ctx.presentes.forEach(function (miembro) {
      var esNino = edadEnAnios(miembro.anioNacimiento) < EDAD_MENOR;
      var factor = candidato.factorRacion[miembro.id] || 1;
      var adapt = mapaAdaptaciones[miembro.id];
      var kcalMiembro = kcalAlinioBase * factor;
      componentes.forEach(function (comp) {
        var idEfectivo = (adapt && comp.id === candidato.seleccionEje) ? adapt.valor : comp.id;
        var ing = banco.ingredientes[idEfectivo];
        if (!ing) return;
        var gramosBase = esNino ? ing.racion_nino_g : ing.racion_adulto_g;
        var gramos = gramosBase * factor;
        var kcal100 = kcalIngredienteConTecnica(ing, comp.grupo, comp.tecnicaCoccion, comp.acabado, bancoV3);
        kcalMiembro += gramos * kcal100 / 100;
        var linea = null;
        for (var i = 0; i < ingredientesCompra.length; i++) { if (ingredientesCompra[i].id === idEfectivo) { linea = ingredientesCompra[i]; break; } }
        if (!linea) { linea = { id: idEfectivo, gramos: 0 }; ingredientesCompra.push(linea); }
        linea.gramos += gramos;
      });
      kcalMiembro = Math.round(kcalMiembro);
      kcalPorComensal.push({ miembroId: miembro.id, kcal: kcalMiembro });
      kcalTotalReal += kcalMiembro;
    });

    // "Segunda cocción" por mesa mixta (Roger 2026-07-14, v2): los pasos del
    // PRINCIPAL re-resueltos con el ingrediente adaptado de cada miembro — la
    // receta explica la variación, no solo la selección compartida.
    var pasosAdaptados = adaptaciones.map(function (a) {
      return { miembroId: a.miembroId, ingrediente: (banco.ingredientes[a.valor] || {}).nombre || a.valor, pasos: pasosDeElaboracion(candidato.principal, a.valor, banco) };
    });

    return {
      principalId: candidato.principal.id, seleccionEje: candidato.seleccionEje,
      complementarias: candidato.complementarias.map(function (c) { return { id: c.elaboracion.id, seleccionEje: c.seleccionEje }; }),
      componenteExtra: candidato.componenteExtra, factorRacion: candidato.factorRacion, adaptaciones: adaptaciones,
      nombre: nombrePrincipal, pasos: pasosPrincipal, pasosAdaptados: pasosAdaptados, complementariasResueltas: complementariasResueltas,
      kcalPorComensal: kcalPorComensal, kcalTotal: Math.round(kcalTotalReal), ingredientes: ingredientesCompra
    };
  }

  // Re-escala un menú YA elegido cuando cambian los presentes de ESE slot (p.ej. alguien se
  // marca "hoy no como") — NUNCA cambia el plato (mismo principal/seleccionEje/complementarias),
  // solo recalcula cantidades/kcal para quiénes están de verdad. Bug real hallado en uso real
  // 2026-07-21: togglePresente solo actualizaba ausenciasPuntuales sin recalcular nada, dejando
  // el menú con las cantidades de la mesa original (2200 kcal "por persona" al quedar 1 solo
  // comensal, porque se dividía en la UI el total ya calculado para 4 entre 1).
  function reescalarMenuParaPresentes(estado, bancoV3, banco, menuActual, presentesNuevos, tipoComida, diaIndex, fechaReferencia, margenKcal) {
    if (!presentesNuevos.length) return null; // nadie presente -> hueco vacío, igual que generarSemana
    var esFinde = esFinDeSemana(diaIndex);
    var principal = elaboracionPorId(bancoV3, estado, menuActual.principalId);
    if (!principal) return null;
    var complementarias = [];
    for (var i = 0; i < (menuActual.complementarias || []).length; i++) {
      var c = menuActual.complementarias[i];
      var elaboracion = elaboracionPorId(bancoV3, estado, c.id);
      if (!elaboracion) return null; // dato corrupto/id no encontrado, no forzar un resultado a medias
      complementarias.push({ elaboracion: elaboracion, seleccionEje: c.seleccionEje });
    }
    var banda = bandaAgregadaMesa(presentesNuevos, tipoComida, esFinde, fechaReferencia, margenKcal);
    var bandaPersonaFn = function (p) { return objetivoBandaPersona(p, tipoComida, esFinde, fechaReferencia, margenKcal); };
    var cierre = cerrarBandaKcal(principal, menuActual.seleccionEje, complementarias, presentesNuevos, banda, bandaPersonaFn, banco, bancoV3);
    var kcalTotal, factorRacion, componenteExtra;
    if (cierre.viable) {
      kcalTotal = cierre.kcalTotal; factorRacion = cierre.factorRacion; componenteExtra = cierre.componenteExtra;
    } else {
      // ni escalando (0.75-1.25) ni con pan cabe en la banda de la mesa nueva — se acepta el
      // mejor ajuste posible (factor calculado igualmente) antes que dejar la cantidad de la
      // mesa vieja, que es estrictamente peor: aquí prioriza "cantidad real de quien está",
      // no la banda (la banda ya hizo su trabajo al generar el menú originalmente)
      var componentesSinExtra = componentesDeCandidato(principal, menuActual.seleccionEje, complementarias);
      var kcalAlinio = kcalAlinioPorRacion(principal, complementarias, bancoV3);
      var r = calcularKcalYFactor(componentesSinExtra, presentesNuevos, bandaPersonaFn, banco, bancoV3, kcalAlinio);
      kcalTotal = r.kcalTotal; factorRacion = r.factorRacion; componenteExtra = menuActual.componenteExtra;
    }
    var candidato = { principal: principal, seleccionEje: menuActual.seleccionEje, complementarias: complementarias, kcalTotal: kcalTotal, factorRacion: factorRacion, componenteExtra: componenteExtra };
    var ctx = { bancoV3: bancoV3, banco: banco, presentes: presentesNuevos, vetosViabilidad: vetosDe(presentesNuevos, fechaReferencia), vetosUnion: vetosDe(presentesNuevos, fechaReferencia), bandaSlot: banda };
    return resolverMenu(candidato, ctx);
  }

  // ---------------------------------------------------------------
  // Función LAZY: generator que produce menús YA ORDENADOS por score; el
  // caller consume 1 (flujo normal) o hasta 3 (modo nevera, top-N nativo,
  // §14 punto 7 + §12 borrador "salida top-N desde el principio"). El
  // resolverMenu (caro: nombres, pasos, ingredientes) solo corre para lo
  // que realmente se consume.
  // ---------------------------------------------------------------
  function iterarMenus(candidatosOrdenados, ctx) {
    var i = 0;
    return {
      next: function () {
        if (i >= candidatosOrdenados.length) return { done: true, value: undefined };
        var candidato = candidatosOrdenados[i++].candidato;
        return { done: false, value: resolverMenu(candidato, ctx) };
      }
    };
  }

  // ---------------------------------------------------------------
  // Memoria — contadores re-anclados a PRINCIPAL (borrador §7: "re-anclado a
  // principal", mismo mecanismo que v2 sobre plantillaId).
  // ---------------------------------------------------------------
  function contarRechazosPorPrincipal(estado) {
    var contador = {};
    var valoraciones = (estado && estado.valoraciones) || {};
    Object.keys(valoraciones).forEach(function (clave) {
      var v = valoraciones[clave];
      if (v && v.valor === 'no-gusta' && v.principalId) contador[v.principalId] = (contador[v.principalId] || 0) + 1;
    });
    return contador;
  }
  function contarGustasPorPrincipal(estado) {
    var contador = {};
    var valoraciones = (estado && estado.valoraciones) || {};
    Object.keys(valoraciones).forEach(function (clave) {
      var v = valoraciones[clave];
      if (v && v.valor === 'gusta' && v.principalId) contador[v.principalId] = (contador[v.principalId] || 0) + 1;
    });
    return contador;
  }
  function contarCambiosPorPrincipal(estado) { return (estado && estado.cambios) || {}; }

  function historialConPlan(estado, plan, lunesActualISO) {
    var historial = {};
    var previo = (estado && estado.historialPrincipales) || {};
    Object.keys(previo).forEach(function (id) { historial[id] = previo[id]; });
    if (plan && plan.dias) {
      plan.dias.forEach(function (dia) {
        ['comida', 'cena'].forEach(function (tipo) {
          var slot = dia && dia[tipo];
          if (slot && slot.menu && slot.menu.principalId) historial[slot.menu.principalId] = plan.semanaISO;
        });
      });
    }
    Object.keys(historial).forEach(function (id) { if (semanasEntre(historial[id], lunesActualISO) > HISTORIAL_SEMANAS) delete historial[id]; });
    return historial;
  }

  function usosDePlan(dias) {
    var usos = {};
    (dias || []).forEach(function (dia) {
      ['comida', 'cena'].forEach(function (tipo) {
        var slot = dia && dia[tipo];
        if (slot && slot.menu && slot.menu.principalId) usos[slot.menu.principalId] = (usos[slot.menu.principalId] || 0) + 1;
      });
    });
    return usos;
  }

  function contadorInicialDesdeDias(diasPrevios, banco) {
    var contador = {};
    (diasPrevios || []).forEach(function (dia) {
      ['comida', 'cena'].forEach(function (tipo) {
        var slot = dia && dia[tipo];
        if (slot && slot.menu) actualizarContadorCuotas(contador, idsDeMenuGuardado(slot.menu), banco);
      });
    });
    return contador;
  }

  function contadorFritosInicialDesdeDias(diasPrevios, bancoV3) {
    var n = 0;
    (diasPrevios || []).forEach(function (dia) {
      ['comida', 'cena'].forEach(function (tipo) {
        var slot = dia && dia[tipo];
        if (slot && slot.menu && slot.menu.tecnicaPrincipal === 'frito') n++;
      });
    });
    return { n: n };
  }

  // ids de un menú YA GUARDADO en el plan (shape persistido, distinto del
  // candidato en memoria durante la búsqueda) — usado para reconstruir
  // contadores desde días previos.
  function idsDeMenuGuardado(menu) {
    var ids = [];
    if (menu.seleccionEje) ids.push(menu.seleccionEje);
    (menu.complementarias || []).forEach(function (c) { if (c.seleccionEje) ids.push(c.seleccionEje); });
    if (menu.componenteExtra) ids.push(menu.componenteExtra);
    return ids;
  }

  function usadosEnDiaGuardado(dia) {
    var set = {};
    if (!dia) return set;
    ['comida', 'cena'].forEach(function (tipo) { var slot = dia[tipo]; if (slot && slot.menu) idsDeMenuGuardado(slot.menu).forEach(function (id) { set[id] = 1; }); });
    return set;
  }

  function categoriasProteinaEnDiaGuardado(dia, banco) {
    var set = {};
    if (!dia) return set;
    ['comida', 'cena'].forEach(function (tipo) {
      var slot = dia[tipo];
      if (slot && slot.menu && slot.menu.categoriaProteina) set[slot.menu.categoriaProteina] = 1;
    });
    return set;
  }

  // ---------------------------------------------------------------
  // 5. Generación de la semana completa — orquesta generarCandidatosSlot +
  // relajación + top-1 + resolverMenu, día a día, slot a slot. fechaReferencia
  // SIEMPRE inyectada (nunca new Date() interno — fuga de determinismo real
  // confirmada en v2 línea 844, corregida aquí, §14 punto 4).
  // ---------------------------------------------------------------
  function generarSemana(estado, bancoV3, banco, desde, planExistente, diaPrevio, fechaReferencia) {
    desde = desde || 0;
    var semanaISO = (planExistente && planExistente.semanaISO) || lunesDeEstaSemana(fechaReferencia);
    var cuotas = (banco && banco.categorias_cuota) || {};
    var diasAnteriores = planExistente ? planExistente.dias.slice(0, desde) : [];
    var contadorCuotas = contadorInicialDesdeDias(diasAnteriores, banco);
    var contadorFritos = contadorFritosInicialDesdeDias(diasAnteriores, bancoV3);
    var rechazosPorPrincipal = contarRechazosPorPrincipal(estado);
    var historialPrincipales = (estado && estado.historialPrincipales) || null;
    var gustasPorPrincipal = contarGustasPorPrincipal(estado);
    var cambiosPorPrincipal = contarCambiosPorPrincipal(estado);
    var estacion = estacionDelMes(new Date(semanaISO + 'T00:00:00').getMonth() + 1);
    var familiaRegion = (estado && estado.familiaRegion) || null;
    var usosSemana = usosDePlan(diasAnteriores);
    var favoritas = (estado && estado.favoritas) || [];
    var dias = [];
    var nivelesRelajacionUsados = [];
    var slotsConAlternativaNueva = []; // para la garantía de novedad, ver post-pase tras el bucle

    for (var i = 0; i < 7; i++) {
      if (i < desde && planExistente && planExistente.dias[i]) { dias.push(planExistente.dias[i]); continue; }
      var fecha = fechaISO(semanaISO, i);
      var esFinde = esFinDeSemana(i);
      var usadosAyer = i === 0 ? usadosEnDiaGuardado(diaPrevio) : usadosEnDiaGuardado(dias[i - 1]);
      var categoriasProteinaAyer = i === 0 ? {} : categoriasProteinaEnDiaGuardado(dias[i - 1], banco); // solo mismo día, no ayer — ver violaProteinaMismaCategoriaMismoDia
      var diaActual = { fecha: fecha, comida: null, cena: null };
      var usadosHoyAcumulado = {};
      var categoriasProteinaHoyAcumulado = {};

      ['comida', 'cena'].forEach(function (tipoComida) {
        var presentes = presentesEnComida(estado, fecha, i, tipoComida);
        if (!presentes.length) { diaActual[tipoComida] = null; return; }

        var coleDiaD = tipoComida === 'cena' ? ((estado.cole && estado.cole.dias && estado.cole.dias[fecha]) || null) : null;
        var coleDiaDMas1 = tipoComida === 'cena' ? ((estado.cole && estado.cole.dias && estado.cole.dias[fechaISO(fecha, 1)]) || null) : null;

        var ctxBase = {
          bancoV3: bancoV3, banco: banco, estado: estado, presentes: presentes, tipoComida: tipoComida, esFinde: esFinde,
          fechaReferencia: fechaReferencia, mes: mesDeFecha(fecha), vetosUnion: vetosDe(presentes, fechaReferencia), vetosViabilidad: vetosDe(presentes, fechaReferencia),
          usadosHoy: usadosHoyAcumulado, usadosAyer: usadosAyer, categoriasProteinaHoy: categoriasProteinaHoyAcumulado,
          contadorCuotas: contadorCuotas, cuotas: cuotas, contadorFritos: contadorFritos, cuotaFritos: bancoV3.cuota_fritos,
          ignorarEsfuerzo: false
        };

        var resultado = generarCandidatosConRelajacion(ctxBase);
        nivelesRelajacionUsados.push(resultado.nivelRelajacion);
        if (!resultado.candidatos.length) { diaActual[tipoComida] = null; return; }

        var slotsRestantes = Math.max(1, (7 - i) * 2);
        var senales = {
          slotsRestantes: slotsRestantes, rechazosPorPrincipal: rechazosPorPrincipal, historialPrincipales: historialPrincipales,
          semanaISO: semanaISO, gustasPorPrincipal: gustasPorPrincipal, usosSemana: usosSemana, estacion: estacion,
          ocasion: ocasionDeFecha(fecha), // por día (Fase 4), no por semana como estacion — la ventana es de fecha exacta
          familiaRegion: familiaRegion, cambiosPorPrincipal: cambiosPorPrincipal, coleDiaD: coleDiaD, coleDiaDMas1: coleDiaDMas1,
          favoritas: favoritas, familiaCompleta: estado.familia, diaIndex: i
        };
        resultado.ctxUsado.bandaSlot = resultado.banda;
        // candidatos "nuevos" (sin rastro en historialPrincipales) de ESTE slot, ya válidos
        // (restricciones duras cumplidas) — alimenta la garantía de novedad tras el bucle.
        var candidatosNuevosSlot = resultado.candidatos.filter(function (c) { return !estaEn(historialPrincipales || {}, c.principal.id); });
        if (candidatosNuevosSlot.length) {
          slotsConAlternativaNueva.push({ diaIndex: i, tipoComida: tipoComida, candidatos: candidatosNuevosSlot, ctxUsado: resultado.ctxUsado, senales: senales });
        }
        var top1 = elegirTopN(resultado.candidatos, resultado.ctxUsado, senales, 1);
        var menuResuelto = resolverMenu(top1[0].candidato, resultado.ctxUsado);

        var ingProteina = menuResuelto.seleccionEje ? banco.ingredientes[menuResuelto.seleccionEje] : null;
        var slotGuardado = {
          menu: Object.assign({}, menuResuelto, {
            categoriaProteina: ingProteina ? ingProteina.categoria : null,
            tecnicaPrincipal: top1[0].candidato.principal.tecnicaCoccion
          })
        };
        diaActual[tipoComida] = slotGuardado;

        idsDeMenuGuardado(slotGuardado.menu).forEach(function (id) { usadosHoyAcumulado[id] = 1; });
        if (ingProteina) categoriasProteinaHoyAcumulado[ingProteina.categoria] = 1;
        actualizarContadorCuotas(contadorCuotas, idsDeMenuGuardado(slotGuardado.menu), banco);
        if (slotGuardado.menu.tecnicaPrincipal === 'frito') contadorFritos.n = (contadorFritos.n || 0) + 1;
        usosSemana[slotGuardado.menu.principalId] = (usosSemana[slotGuardado.menu.principalId] || 0) + 1;
      });

      dias.push(diaActual);
    }

    // Garantía v3 (borrador §5 "Garantías v3", absorbe el pendiente §11.4 de MOTOR_RECETAS.md):
    // "1 elaboración PRINCIPAL nueva por semana — hueco reservado" (antes la novedad era señal
    // de desempate sin garantía). Si NINGÚN slot de la semana completa (incluidos los días
    // copiados de planExistente, i < desde) tiene ya un principal sin rastro en historial, se
    // fuerza EL PRIMER slot recién generado que tuviera una alternativa nueva entre sus propios
    // candidatos YA válidos — nunca rompe cuotas/mesa mixta/variedad porque sale del mismo pool,
    // solo se prefiere la novedad sobre el resto del scoring para ese slot. Si ningún slot
    // recién generado tenía alternativa nueva viable, no se fuerza nada — no se puede garantizar
    // lo que no existe (p. ej. familia que ya agotó su repertorio viable).
    var yaHayNovedad = dias.some(function (d) {
      return ['comida', 'cena'].some(function (t) {
        var s = d[t];
        return s && s.menu && !estaEn(historialPrincipales || {}, s.menu.principalId);
      });
    });
    if (!yaHayNovedad && slotsConAlternativaNueva.length) {
      var elegido = slotsConAlternativaNueva[0];
      var topNuevo = elegirTopN(elegido.candidatos, elegido.ctxUsado, elegido.senales, 1);
      var menuNuevo = resolverMenu(topNuevo[0].candidato, elegido.ctxUsado);
      var ingProteinaNuevo = menuNuevo.seleccionEje ? banco.ingredientes[menuNuevo.seleccionEje] : null;
      dias[elegido.diaIndex][elegido.tipoComida] = {
        menu: Object.assign({}, menuNuevo, {
          categoriaProteina: ingProteinaNuevo ? ingProteinaNuevo.categoria : null,
          tecnicaPrincipal: topNuevo[0].candidato.principal.tecnicaCoccion
        })
      };
    }

    return { semanaISO: semanaISO, dias: dias, nivelesRelajacionUsados: nivelesRelajacionUsados };
  }

  function regenerarDesde(estado, plan, diaIndex, bancoV3, banco, fechaReferencia) {
    return generarSemana(estado, bancoV3, banco, diaIndex, plan, null, fechaReferencia);
  }

  // ---------------------------------------------------------------
  // 6. Cambiar plato — 3 modos del flujo "otra cosa" (borrador §6, última
  // hora): (a) 'otro-menu' — reensambla el slot entero; (b) 'nevera' —
  // construye con lo disponible, TOP-N nativo (hasta 3, modo nevera invierte
  // el filtro); (c) 'solo-complementaria' — mantiene el principal, re-elige
  // solo hidrato/verdura.
  // ---------------------------------------------------------------
  function cambiarPlato(estado, plan, dia, tipoComida, opciones, bancoV3, banco, fechaReferencia) {
    var diaObj = plan.dias[dia];
    if (!diaObj) return null;
    var fecha = diaObj.fecha;
    var presentes = presentesEnComida(estado, fecha, dia, tipoComida);
    if (!presentes.length) return null;

    var otraComida = tipoComida === 'comida' ? diaObj.cena : diaObj.comida;
    var usadosHoy = otraComida && otraComida.menu ? usadosEnDiaGuardado({ comida: otraComida, cena: null }.comida ? { comida: otraComida } : {}) : {};
    // (recalculado abajo de forma más simple)
    usadosHoy = {};
    if (otraComida && otraComida.menu) idsDeMenuGuardado(otraComida.menu).forEach(function (id) { usadosHoy[id] = 1; });
    var usadosAyer = usadosEnDiaGuardado(plan.dias[dia - 1]);

    var cuotas = (banco && banco.categorias_cuota) || {};
    var diasParaContar = plan.dias.map(function (d, i) { if (i !== dia) return d; var copia = { fecha: d.fecha, comida: d.comida, cena: d.cena }; copia[tipoComida] = null; return copia; });
    var contadorCuotas = contadorInicialDesdeDias(diasParaContar, banco);
    var contadorFritos = contadorFritosInicialDesdeDias(diasParaContar, bancoV3);
    var esFinde = esFinDeSemana(dia);

    var coleDiaD = tipoComida === 'cena' ? ((estado.cole && estado.cole.dias && estado.cole.dias[fecha]) || null) : null;
    var coleDiaDMas1 = tipoComida === 'cena' ? ((estado.cole && estado.cole.dias && estado.cole.dias[fechaISO(fecha, 1)]) || null) : null;
    var senales = {
      slotsRestantes: Math.max(1, (7 - dia) * 2), rechazosPorPrincipal: contarRechazosPorPrincipal(estado),
      historialPrincipales: (estado && estado.historialPrincipales) || null, semanaISO: plan.semanaISO,
      gustasPorPrincipal: contarGustasPorPrincipal(estado), usosSemana: usosDePlan(diasParaContar),
      estacion: estacionDelMes(new Date(fecha + 'T00:00:00').getMonth() + 1), ocasion: ocasionDeFecha(fecha), familiaRegion: (estado && estado.familiaRegion) || null,
      cambiosPorPrincipal: contarCambiosPorPrincipal(estado), coleDiaD: coleDiaD, coleDiaDMas1: coleDiaDMas1,
      favoritas: (estado && estado.favoritas) || [], familiaCompleta: estado.familia, diaIndex: dia
    };

    var ctxBase = {
      bancoV3: bancoV3, banco: banco, estado: estado, presentes: presentes, tipoComida: tipoComida, esFinde: esFinde,
      fechaReferencia: fechaReferencia, mes: mesDeFecha(fecha), vetosUnion: vetosDe(presentes, fechaReferencia), vetosViabilidad: vetosDe(presentes, fechaReferencia),
      usadosHoy: usadosHoy, usadosAyer: usadosAyer, categoriasProteinaHoy: {},
      contadorCuotas: contadorCuotas, cuotas: cuotas, contadorFritos: contadorFritos, cuotaFritos: bancoV3.cuota_fritos,
      ignorarEsfuerzo: false
    };

    if (opciones && opciones.modo === 'solo-complementaria') {
      // mantiene el principal actual, solo pide combos de complementarias nuevos — variedad
      // relajada a propósito (es un cambio deliberado, no busca evitar repetición)
      var slotActual = diaObj[tipoComida];
      if (!slotActual || !slotActual.menu) return null;
      var principalActual = elaboracionPorId(bancoV3, estado, slotActual.menu.principalId);
      if (!principalActual) return null;
      var gruposFaltantes = ['proteina', 'hidrato', 'verdura'].filter(function (g) { return principalActual.grupos.indexOf(g) === -1; });
      var ctxSolo = Object.assign({}, ctxBase, { usadosHoy: {}, usadosAyer: {} });
      var banda = bandaAgregadaMesa(presentes, tipoComida, esFinde, fechaReferencia, MARGEN_KCAL_DEFECTO);
      var bandaPersonaFn = function (p) { return objetivoBandaPersona(p, tipoComida, esFinde, fechaReferencia, MARGEN_KCAL_DEFECTO); };
      var combos = generarCombosComplementarias(bancoV3, principalActual.id, gruposFaltantes, ctxBase.vetosUnion, ctxBase.mes);
      var idComboActual = (slotActual.menu.complementarias || []).map(function (c) { return c.seleccionEje; }).sort().join(',');
      var candidatosSolo = [];
      combos.forEach(function (combo) {
        var estructura = verificarEstructura(principalActual, combo.map(function (c) { return { elaboracion: c.elaboracion }; }));
        if (!estructura.valido) return;
        var cierre = cerrarBandaKcal(principalActual, slotActual.menu.seleccionEje, combo, presentes, banda, bandaPersonaFn, banco, bancoV3);
        if (!cierre.viable) return;
        var idCombo = combo.map(function (c) { return c.seleccionEje; }).sort().join(',');
        candidatosSolo.push({ principal: principalActual, seleccionEje: slotActual.menu.seleccionEje, complementarias: combo, kcalTotal: cierre.kcalTotal, factorRacion: cierre.factorRacion, componenteExtra: cierre.componenteExtra, faltantesNevera: [], idCombo: idCombo });
      });
      if (!candidatosSolo.length) return null;
      // no repetir la MISMA combinación de complementarias ya mostrada — si no hay otra
      // combinación viable, se acepta repetir (bug real, verificación de navegador
      // 2026-07-21: sin esto "cambiar solo el acompañamiento" podía devolver el mismo
      // arroz+verdura de antes, sin exclusión alguna).
      var candidatosSoloDistintos = candidatosSolo.filter(function (c) { return c.idCombo !== idComboActual; });
      var poolSolo = candidatosSoloDistintos.length ? candidatosSoloDistintos : candidatosSolo;
      ctxSolo.bandaSlot = banda;
      var topSolo = elegirTopN(poolSolo, ctxSolo, senales, 1);
      var menuSolo = resolverMenu(topSolo[0].candidato, ctxSolo);
      return { menu: menuSolo, opciones: null };
    }

    if (opciones && opciones.modo === 'nevera' && opciones.disponibles) {
      var ctxNevera = Object.assign({}, ctxBase, { disponibles: opciones.disponibles, usadosHoy: {}, usadosAyer: {}, ignorarEsfuerzo: true });
      var rNevera = generarCandidatosSlot(ctxNevera);
      // montables primero, luego casi-montables (falta 1) — nunca se descartan, se marcan
      var candidatosOrdenadosPorDisponibilidad = rNevera.candidatos.slice().sort(function (a, b) { return a.faltantesNevera.length - b.faltantesNevera.length; });
      ctxNevera.bandaSlot = rNevera.banda;
      var puntuadosNevera = candidatosOrdenadosPorDisponibilidad.map(function (c) { return { candidato: c, score: puntuarCandidato(c, ctxNevera, senales) - c.faltantesNevera.length * 1000, idCanonico: idCanonicoCandidato(c) }; });
      var top3Nevera = ordenarDeterminista(puntuadosNevera).slice(0, 3);
      if (!top3Nevera.length) return { menu: null, opciones: [] };
      var menusNevera = top3Nevera.map(function (p) { var m = resolverMenu(p.candidato, ctxNevera); m.faltaIngrediente = p.candidato.faltantesNevera[0] || null; return m; });
      return { menu: null, opciones: menusNevera };
    }

    if (opciones && opciones.modo === 'manual' && opciones.principalId) {
      var ctxManual = Object.assign({}, ctxBase, { usadosHoy: {}, usadosAyer: {}, ignorarEsfuerzo: true });
      var rManual = generarCandidatosSlot(ctxManual);
      var soloEste = rManual.candidatos.filter(function (c) { return c.principal.id === opciones.principalId; });
      if (!soloEste.length) return null;
      ctxManual.bandaSlot = rManual.banda;
      var topManual = elegirTopN(soloEste, ctxManual, senales, 1);
      return { menu: resolverMenu(topManual[0].candidato, ctxManual), opciones: null };
    }

    // 'otro-menu' (defecto): reensambla el slot entero con variedad activa (no repetir lo de hoy);
    // tampoco repite el propio principal ya mostrado en ESTE slot — si no tiene eje paramétrico
    // (p.ej. legumbre fija) usadosHoy no lo capta y "otra cosa" podía devolver el mismo plato
    // (bug real, hallado en verificación de navegador 2026-07-21). Se relaja junto con variedad
    // si de verdad no hay alternativa (mejor repetir que dejar el slot sin nada).
    var slotActualOtro = diaObj[tipoComida];
    ctxBase.principalExcluido = (slotActualOtro && slotActualOtro.menu) ? slotActualOtro.menu.principalId : null;
    var resultadoOtro = generarCandidatosConRelajacion(ctxBase);
    if (!resultadoOtro.candidatos.length) return null;
    resultadoOtro.ctxUsado.bandaSlot = resultadoOtro.banda;
    var topOtro = elegirTopN(resultadoOtro.candidatos, resultadoOtro.ctxUsado, senales, 1);
    return { menu: resolverMenu(topOtro[0].candidato, resultadoOtro.ctxUsado), opciones: null };
  }

  // ---------------------------------------------------------------
  // 7. Lista de la compra — agregada por ingrediente-id (idéntico espíritu a
  // v2: estable frente a regeneraciones parciales).
  // ---------------------------------------------------------------
  function diaIndexDesdeFecha(plan, fechaISOStr) {
    for (var i = 0; i < plan.dias.length; i++) { if (plan.dias[i].fecha === fechaISOStr) return i; }
    return -1;
  }

  // Redondeo "de cocina": nunca decimales y a números redondos que una persona usa de verdad al
  // comprar/servir (248 g -> 250 g, no 248). Es PRESENTACIONAL: no realimenta el kcal (que se
  // calcula siempre sobre los gramos reales, banda con margen) — solo lo que se muestra. Tramos:
  // <10 g al gramo, 10-99 g a múltiplos de 5, >=100 g a múltiplos de 10.
  function redondearCantidad(g) {
    var n = Math.round(g || 0);
    if (n <= 0) return 0;
    if (n < 10) return n;
    if (n < 100) return Math.round(n / 5) * 5;
    return Math.round(n / 10) * 10;
  }

  function listaCompra(estado, plan, rango, banco, hoy, soloCena) {
    var hoyISO = hoy || fechaLocalISO();
    var diasRango;
    if (rango === 'hoy') {
      var idx = diaIndexDesdeFecha(plan, hoyISO);
      diasRango = idx === -1 ? [] : [{ dia: plan.dias[idx], idx: idx }];
    } else {
      diasRango = plan.dias.map(function (d, idx) { return { dia: d, idx: idx }; });
    }

    // soloCena (Roger 2026-07-22): "Compra hoy" pasadas las 16h ya no necesita ingredientes de
    // comida (mediodía) — se asume ya cocinada/comprada. Presentacional: solo cambia qué se
    // ACUMULA en la lista, nunca el plan ni el kcal real de ningún menú. La decisión de LA HORA
    // vive en ui.js (real reloj, ver saludoHora) — aquí solo se aplica el flag ya calculado.
    var acumulado = {};
    diasRango.forEach(function (entry) {
      var dia = entry.dia, idx = entry.idx;
      ['comida', 'cena'].forEach(function (tipoComida) {
        if (soloCena && tipoComida === 'comida') return;
        var slot = dia[tipoComida];
        if (!slot || !slot.menu) return;
        (slot.menu.ingredientes || []).forEach(function (linea) {
          var ing = banco.ingredientes[linea.id];
          if (!acumulado[linea.id]) acumulado[linea.id] = { id: linea.id, nombre: ing ? ing.nombre : linea.id, categoria: ing ? ing.categoria : 'otro', gramos: 0, unidadG: ing && ing.unidad_g };
          acumulado[linea.id].gramos += linea.gramos;
        });
      });
      var postre = postreDelDia(banco, dia.fecha, idx);
      if (postre && postre.id) {
        var ingPostre = banco.ingredientes[postre.id];
        if (ingPostre) {
          presentesEnComida(estado, dia.fecha, idx, 'cena').forEach(function (miembro) {
            var esNino = edadEnAnios(miembro.anioNacimiento) < EDAD_MENOR;
            var gramos = esNino ? ingPostre.racion_nino_g : ingPostre.racion_adulto_g;
            if (!acumulado[postre.id]) acumulado[postre.id] = { id: postre.id, nombre: ingPostre.nombre, categoria: ingPostre.categoria, gramos: 0, unidadG: ingPostre.unidad_g };
            acumulado[postre.id].gramos += gramos;
          });
        }
      }
    });

    // "¿lo añado a la compra?" de una opción de nevera casi-montable (borrador
    // §6): entrada manual, ración estándar de adulto (no hay mesa real que
    // calcular aquí, es un recordatorio de compra, no un ingrediente de un
    // menú planificado) — se añade en CUALQUIER rango, es una intención
    // explícita del usuario, no algo que dependa de qué días se estén mirando.
    ((estado.compra && estado.compra.pendientesManual) || []).forEach(function (id) {
      var ing = banco.ingredientes[id];
      if (!ing) return;
      if (!acumulado[id]) acumulado[id] = { id: id, nombre: ing.nombre, categoria: ing.categoria, gramos: 0, unidadG: ing.unidad_g };
      acumulado[id].gramos += ing.racion_adulto_g;
    });

    // Ingrediente BASE (Roger 2026-07-21, tarea 4) + despensa de compra (tarea 3): cebolla/leche/
    // nata/mantequilla/queso rallado + los staples (aceite, sal...) NO son ración de ningún menú —
    // "¿lo tengo en casa?", no cantidad a comprar. Aparecen SIEMPRE, en cualquier rango (hoy/semana),
    // como líneas sin gramos (checkbox simple), en la MISMA categoría de compra "despensa" que los
    // staples (borrador ARQUITECTURA: "categoría propia Despensa... + las bases cebolla/leche/nata")
    // — la categoría nutricional real (lacteo/verdura) sigue intacta en banco.ingredientes, esto es
    // solo la agrupación de LA LISTA DE COMPRA, no toca cuotas/proteína/dieta.
    Object.keys(banco.ingredientes).forEach(function (id) {
      var ing = banco.ingredientes[id];
      if (ing.base && !acumulado[id]) acumulado[id] = { id: id, nombre: ing.nombre, categoria: 'despensa', gramos: null };
    });
    (banco.despensa || []).forEach(function (item) {
      if (!acumulado[item.id]) acumulado[item.id] = { id: item.id, nombre: item.nombre, categoria: 'despensa', gramos: null };
    });

    var marcados = {};
    ((estado.compra && estado.compra.marcados) || []).forEach(function (id) { marcados[id] = 1; });
    return Object.keys(acumulado).map(function (id) {
      var linea = acumulado[id];
      // unidades (huevo/yogur): presentacional, igual espíritu que redondearCantidad — no
      // realimenta el kcal (que sigue calculándose siempre sobre los gramos reales). Mínimo 1
      // unidad si hay gramos>0, para no mostrar "0 uds" por redondeo hacia abajo.
      var unidades = (linea.unidadG && linea.gramos) ? Math.max(1, Math.round(linea.gramos / linea.unidadG)) : null;
      return { id: linea.id, nombre: linea.nombre, categoria: linea.categoria, gramos: linea.gramos === null ? null : redondearCantidad(linea.gramos), unidades: unidades, marcado: !!marcados[id] };
    }).sort(function (a, b) { if (a.categoria !== b.categoria) return a.categoria.localeCompare(b.categoria); return a.nombre.localeCompare(b.nombre); });
  }

  // ---------------------------------------------------------------
  // Semáforo de equilibrio semanal — IDÉNTICO espíritu a v2 (P1, feedback
  // externo 2026-07-16): reutiliza el mismo contador que el generador.
  // fritos aparte (no es una categoría de ingrediente, es la técnica del
  // principal — no pasa por actualizarContadorCuotas).
  // ---------------------------------------------------------------
  function resumenCuotasSemana(plan, banco) {
    var cuotas = (banco && banco.categorias_cuota) || {};
    var contador = {};
    var fritos = 0;
    ((plan && plan.dias) || []).forEach(function (dia) {
      ['comida', 'cena'].forEach(function (tipo) {
        var slot = dia && dia[tipo];
        if (!slot || !slot.menu) return;
        actualizarContadorCuotas(contador, idsDeMenuGuardado(slot.menu), banco);
        if (slot.menu.tecnicaPrincipal === 'frito') fritos++;
      });
    });
    contador.fritos = fritos;
    return Object.keys(cuotas).map(function (clave) {
      var cuota = cuotas[clave];
      var cuenta = contador[clave] || 0;
      var minOk = cuota.min_sem == null || cuenta >= cuota.min_sem;
      var maxOk = cuota.max_sem == null || cuenta <= cuota.max_sem;
      return { categoria: clave, cuenta: cuenta, min_sem: cuota.min_sem, max_sem: cuota.max_sem, cumplido: minOk && maxOk };
    });
  }

  // ---------------------------------------------------------------
  // Previsualización de una elaboración SIN plan real detrás (pestañas
  // Recetas/Descubrir) — sustituye a "resolverPlato con la primera opción de
  // cada eje" de v2. Devuelve nombre + pasos resueltos con la 1ª opción de su
  // eje paramétrico (si tiene), variantes (para "también con X, Y, Z") y un
  // ejemplo de complementarias compatibles (para menús de principales con
  // grupos externos) — 1 comensal sintético, no hay mesa real que resolver.
  // ---------------------------------------------------------------
  function previsualizarElaboracion(elaboracion, banco) {
    var seleccionEje = elaboracion.ingredientes.eje ? elaboracion.ingredientes.opciones[0] : null;
    var nombre = resolverNombre(elaboracion, seleccionEje, banco);
    var pasos = pasosDeElaboracion(elaboracion, seleccionEje, banco);
    var variantes = elaboracion.ingredientes.eje
      ? elaboracion.ingredientes.opciones.slice(1, 4).map(function (id) { var ing = banco.ingredientes[id]; return ing ? ing.nombre : id; })
      : [];
    var complementariasEjemplo = [];
    (banco.compatibilidad || []).filter(function (c) { return c.principalId === elaboracion.id; }).forEach(function (c) {
      var comp = (banco.elaboraciones || []).filter(function (e) { return e.id === c.complementariaFamilia; })[0];
      if (!comp) return;
      var idEjemplo = comp.ingredientes.opciones[0];
      complementariasEjemplo.push({ id: comp.id, nombre: resolverNombre(comp, idEjemplo, banco), seleccionEje: idEjemplo });
    });
    return { id: elaboracion.id, nombre: nombre, pasos: pasos, variantes: variantes, complementariasEjemplo: complementariasEjemplo, seleccionEje: seleccionEje };
  }

  // ---------------------------------------------------------------
  // Descubrir — IDÉNTICO espíritu a v2 (categorías reales rotando por día),
  // sobre elaboraciones con roles principal/mixta (las complementarias no
  // son "recetas" navegables). Mismos campos: tematica/esfuerzo/temporada/foto.
  // ---------------------------------------------------------------
  var CATEGORIAS_DESCUBRIR = [
    { id: 'arroces', kicker: 'Arroces', titulo: 'De la paella al arroz caldoso', test: function (p) { return p.tematica === 'Arroces y fideuà'; } },
    { id: 'potajes', kicker: 'Cuchara de invierno', titulo: 'Potajes y guisos para los días fríos', test: function (p) { return p.tematica === 'Potajes y guisos' && p.temporada === 'invierno'; } },
    { id: 'ensaladas', kicker: 'Ensaladas completas', titulo: 'Platos únicos que no dan pereza', test: function (p) { return p.tematica === 'Ensaladas completas'; } },
    { id: 'cremas', kicker: 'Cremas y sopas', titulo: 'Reconfortantes, con cuchara', test: function (p) { return p.tematica === 'Cremas y sopas'; } },
    { id: 'rapidas', kicker: 'En poco tiempo', titulo: 'Ideas para cuando no hay tiempo', test: function (p) { return p.esfuerzo === 'rapido'; } }
  ];

  function categoriasDescubrir(banco, estado, fecha) {
    var disponibles = elaboracionesDisponibles(banco, estado).filter(function (e) { return e.roles.indexOf('principal') !== -1; });
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
      var foto = elegida.foto || (cat.candidatas.filter(function (p) { return p.foto; })[0] || {}).foto || null;
      return { kicker: cat.kicker, titulo: cat.titulo, foto: foto, candidatas: cat.candidatas };
    });
  }

  var E3Engine = {
    resumenCuotasSemana: resumenCuotasSemana, previsualizarElaboracion: previsualizarElaboracion,
    categoriasDescubrir: categoriasDescubrir,
    idsDeMenu: idsDeMenu, usadosEnDia: usadosEnDia, categoriasProteinaEnDia: categoriasProteinaEnDia,
    generarCombosComplementarias: generarCombosComplementarias, componentesDeCandidato: componentesDeCandidato,
    cerrarBandaKcal: cerrarBandaKcal, generarCandidatosSlot: generarCandidatosSlot,
    estacionDelMes: estacionDelMes, puntuarCandidato: puntuarCandidato, puntuarSalubridadTecnica: puntuarSalubridadTecnica,
    ocasionDeFecha: ocasionDeFecha, puntuarOcasion: puntuarOcasion, pascuaDomingo: pascuaDomingo,
    pasosDeElaboracion: pasosDeElaboracion,
    puntuarFavorita: puntuarFavorita, puntuarCole: puntuarCole, puntuarAusenciaEstructural: puntuarAusenciaEstructural,
    idCanonicoCandidato: idCanonicoCandidato, ordenarDeterminista: ordenarDeterminista, elegirTopN: elegirTopN,
    generarCandidatosConRelajacion: generarCandidatosConRelajacion, NIVELES_RELAJACION: NIVELES_RELAJACION,
    postreDelDia: postreDelDia, resolverMenu: resolverMenu, iterarMenus: iterarMenus,
    contarRechazosPorPrincipal: contarRechazosPorPrincipal, contarGustasPorPrincipal: contarGustasPorPrincipal,
    contarCambiosPorPrincipal: contarCambiosPorPrincipal, historialConPlan: historialConPlan, usosDePlan: usosDePlan,
    generarSemana: generarSemana, regenerarDesde: regenerarDesde, cambiarPlato: cambiarPlato, listaCompra: listaCompra,
    diaIndexDesdeFecha: diaIndexDesdeFecha,
    violaVariedad: violaVariedad, violaProteinaMismaCategoriaMismoDia: violaProteinaMismaCategoriaMismoDia,
    categoriasQueSuma: categoriasQueSuma, violaMaximoCuota: violaMaximoCuota,
    actualizarContadorCuotas: actualizarContadorCuotas, violaCuotaFritos: violaCuotaFritos,
    verificarEstructura: verificarEstructura,
    nuevoTrace: nuevoTrace, traceDescarta: traceDescarta, traceSobrevive: traceSobrevive,
    edadEnAnios: edadEnAnios, fechaLocalISO: fechaLocalISO, fechaISO: fechaISO,
    lunesDeEstaSemana: lunesDeEstaSemana, esFinDeSemana: esFinDeSemana, vetosDe: vetosDe,
    mesDeFecha: mesDeFecha, disponibleEnMes: disponibleEnMes,
    IDS_MERCURIO_ALTO: IDS_MERCURIO_ALTO, EDAD_MERCURIO: EDAD_MERCURIO,
    necesidadKcalDia: necesidadKcalDia, objetivoBandaPersona: objetivoBandaPersona,
    bandaAgregadaMesa: bandaAgregadaMesa, capitaliza: capitaliza,
    excluidoPorCole: excluidoPorCole, presentesEnComida: presentesEnComida,
    todasLasElaboraciones: todasLasElaboraciones, elaboracionesDisponibles: elaboracionesDisponibles,
    elaboracionPorId: elaboracionPorId, principalesMixtas: principalesMixtas,
    complementariasCompatibles: complementariasCompatibles,
    categoriaExcluidaPorDieta: categoriaExcluidaPorDieta, opcionAptaParaDieta: opcionAptaParaDieta,
    elaboracionViableParaMesa: elaboracionViableParaMesa, calcularAdaptaciones: calcularAdaptaciones,
    kcalIngredienteConTecnica: kcalIngredienteConTecnica, kcalAlinioPorRacion: kcalAlinioPorRacion,
    calcularKcalYFactor: calcularKcalYFactor, reescalarMenuParaPresentes: reescalarMenuParaPresentes,
    redondearCantidad: redondearCantidad
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = E3Engine;
  if (global) global.E3Engine = E3Engine;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
