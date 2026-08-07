/* ============================================================
   e3Foods — ui.js
   Render puro: construye HTML a partir de (estado, plan, banco).
   No añade listeners ni muta estado — eso vive en app.js (delegación
   de eventos por data-action). Mantiene la separación presentación/
   comportamiento sin necesidad de framework.
   ============================================================ */
(function (global) {
  'use strict';

  var I18N = global.E3I18n;
  var t = I18N.t;
  // MOTOR V6 (bloque 2, 3-ago): la UI lee la semana `/2` VERBATIM — `servicio.plato[]`,
  // `opciones_eje`, `postre`, `notas`, `fracciones` — contra el banco V6. Prohibido el
  // adaptador que traduzca la forma de V6 a la de v5 (dictado de Roger: «cero rastro de v5»).
  var MOTOR = global.E3MotorV6;
  // Funciones, no arrays estaticos: el idioma puede cambiar en caliente (backlog-v3 #18)
  // y estos nombres se leen en cada render, nunca se cachean al cargar el script.
  function NOMBRES_DIA() { return I18N.diasLargo(); }
  function NOMBRES_DIA_CORTO() { return I18N.diasCorto(); }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function capitaliza(s) { if (!s) return s; return s.charAt(0).toUpperCase() + s.slice(1); }

  // ---------------------------------------------------------------
  // Fechas del producto — las traía `engine.js`, que muere con v5 (bloque 2.6). Viven aquí,
  // en UNA sola implementación que también consume app.js vía E3UI: dos copias de la misma
  // medida es el patrón de bug nº1 del proyecto.
  //   · `fechaLocalISO` es la ÚNICA que toca el reloj real.
  //   · La frontera de día del producto es Europe/Madrid (D3 §6.1, dictado de Roger): el
  //     navegador de la familia ya está en esa zona, así que la fecha local del dispositivo
  //     ES la fecha del producto. El motor, en cambio, solo opera fechas de calendario ya
  //     hechas (aritmética UTC de días exactos, inmune al DST).
  // ---------------------------------------------------------------
  function fechaLocalISO(d) {
    d = d || new Date();
    var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }
  function fechaISO(fechaBase, offsetDias) {
    var d = new Date(fechaBase + 'T00:00:00');
    d.setDate(d.getDate() + offsetDias);
    return fechaLocalISO(d);
  }
  // Defensa de contrato (bug real 2026-07-23): con un Date en vez del string ISO esperado, la
  // concatenación daba "NaN-NaN-NaN" y el caller regeneraba el plan en CADA carga.
  function lunesDeEstaSemana(fechaISOStr) {
    if (fechaISOStr instanceof Date) fechaISOStr = fechaLocalISO(fechaISOStr);
    var d = new Date((fechaISOStr || fechaLocalISO()) + 'T00:00:00');
    var diaJs = d.getDay();
    d.setDate(d.getDate() + (diaJs === 0 ? -6 : 1 - diaJs));
    return fechaLocalISO(d);
  }
  // Lunes local -> semana ISO del motor, y vuelta. El motor habla `AAAA-Www` (su jueves define
  // el año, ISO 8601) y `derivar.fechaDia` es LA definición ejecutable — no se reimplementa
  // aquí: se le pregunta. El lunes de una semana ISO es su día 1.
  function semanaIsoDeLunes(lunesISOStr) {
    var d = new Date(lunesISOStr + 'T00:00:00');
    var jue = new Date(d.getTime());
    jue.setDate(jue.getDate() + 3);                       // el jueves manda (ISO 8601)
    var anio = jue.getFullYear();
    var ene4 = new Date(anio + '-01-04T00:00:00');
    var lunesW1 = new Date(ene4.getTime());
    lunesW1.setDate(lunesW1.getDate() - ((ene4.getDay() + 6) % 7));
    var num = Math.round((d - lunesW1) / (7 * 86400000)) + 1;
    return anio + '-W' + String(num).padStart(2, '0');
  }
  function fechaDeDia(semanaIso, dia) {                   // dia 1-7 (1 = lunes)
    return MOTOR.derivar.fechaDia(semanaIso, dia).toISOString().slice(0, 10);
  }
  function edadEnAnios(anioNacimiento, hoy) {
    if (!anioNacimiento) return 30;
    return parseInt((hoy || fechaLocalISO()).slice(0, 4), 10) - anioNacimiento;
  }
  var EDAD_MENOR = 12;

  // ── Obligatoriedad de altura/peso por banda de edad (decisión de Roger, 6-ago —
  //    anexo OMS en 01_Research/RESEARCH_ALIMENTACION_ESPANA.md, commit 8deadf1):
  //    adultos SIEMPRE los dos · menor 11-17 solo peso (la OMS no publica peso-para-la-edad
  //    por encima de los 10) · menor <11 ninguno (el motor usará la mediana OMS como
  //    supuesto declarado — fallback pendiente de decisión, ver TRAMO D). Sin año de
  //    nacimiento, `edadEnAnios` ya asume 30 (adulto), así que el criterio es coherente
  //    incluso con el campo vacío.
  var EDAD_ADULTO_MEDIDAS = 18;
  var EDAD_MENOR_PESO_OBLIGATORIO = 11; // 11-17: peso obligatorio, altura sigue opcional
  function bandaMedidas(anioNacimiento) {
    var edad = edadEnAnios(anioNacimiento);
    if (edad >= EDAD_ADULTO_MEDIDAS) return 'adulto';
    if (edad >= EDAD_MENOR_PESO_OBLIGATORIO) return 'menor-11-17';
    return 'menor-3-10';
  }
  function medidasRequeridas(anioNacimiento) {
    var banda = bandaMedidas(anioNacimiento);
    return { altura: banda === 'adulto', peso: banda === 'adulto' || banda === 'menor-11-17' };
  }
  // Copy del aviso sobre los campos altura/peso — MISMA clave en asistente y ficha
  // (avisoInfo, comentario de más abajo): cambia con la banda, nunca con la pantalla.
  function claveAvisoMedidas(anioNacimiento) {
    var banda = bandaMedidas(anioNacimiento);
    if (banda === 'adulto') return 'onb_aviso_medidas_adulto';
    if (banda === 'menor-11-17') return 'onb_aviso_medidas_menor_mayor';
    return 'onb_aviso_medidas_menor';
  }
  // Nivel de actividad y objetivo de peso NO se preguntan a un menor (Roger 7-ago). El corte
  // es el mismo 18 de `bandaMedidas`, que es donde el motor cambia de fórmula (Mifflin ↔
  // Schofield). Se OCULTAN, no se desactivan: un mando que nunca se podrá tocar es ruido, y
  // «señales del motor ≠ mandos del usuario». El valor guardado NO se toca — esto quita el
  // control, no reescribe la ficha.
  function pideActividadYObjetivo(anioNacimiento) {
    return bandaMedidas(anioNacimiento) === 'adulto';
  }

  // opciones de las píldoras de miembro — compartidas por el asistente de alta y
  // la ficha en acordeón (pildorasPersona las pinta en los dos sitios)
  // Catálogos i18n (sesión higiene 30-jul): guardan CLAVES de diccionario, no texto —
  // los consumidores (pildoras/tarjetas/listas/resúmenes) aplican t() en render, así el
  // idioma cambia en caliente sin reevaluar módulos. Los ids NUNCA se traducen.
  var OPCIONES_SEXO = [{ valor: 'mujer', etiqueta: 'sexo_mujer' }, { valor: 'hombre', etiqueta: 'sexo_hombre' }];
  var OPCIONES_ACTIVIDAD = [{ valor: 'baja', etiqueta: 'actividad_baja' }, { valor: 'media', etiqueta: 'actividad_media' }, { valor: 'alta', etiqueta: 'actividad_alta' }];

  // ---------------------------------------------------------------
  // Persona — catálogos del handoff "Alta de persona" (Claude Design, 2026-07-30)
  // ---------------------------------------------------------------
  // Estilo de vida + 6 alergias + gustos + patrón de comidas. Los catálogos son
  // ÚNICOS a propósito: las dos superficies que los pintan (el asistente de 5
  // pasos del onboarding y la ficha en acordeón de Familia) leen de aquí, así
  // no pueden divergir en id, etiqueta ni orden.
  // Esta taxonomía es la MISMA que va a construir `bd_v6/dietas.js` (4 estilos +
  // 6 alergias, ver PROMPT_SESION_DIETAS_SELECTOR §2). Aquí solo se CAPTURA y se
  // persiste: el motor v3 no consume todavía `alergias`/`gustos` — lo único
  // cableado al motor es `dieta`, que se deriva de `estilo` (ver estiloADieta).
  var ESTILOS_VIDA = [
    { id: 'de-todo', etiqueta: 'cat_estilo_de_todo', desc: 'cat_estilo_de_todo_desc', icono: 'utensils-crossed' },
    { id: 'vegetariano', etiqueta: 'cat_estilo_vegetariano', desc: 'cat_estilo_vegetariano_desc', icono: 'leaf' },
    { id: 'vegano', etiqueta: 'cat_estilo_vegano', desc: 'cat_estilo_vegano_desc', icono: 'sprout' },
    { id: 'sin-cerdo', etiqueta: 'cat_estilo_sin_cerdo', desc: 'cat_estilo_sin_cerdo_desc', icono: 'ban' }
  ];
  var ETIQUETA_ESTILO = {};
  ESTILOS_VIDA.forEach(function (e) { ETIQUETA_ESTILO[e.id] = e.etiqueta; });

  // Los ids son los de `bd_v6/dietas.js` (ALERGIAS_PERFIL), no los del prototipo: ese
  // fichero es la fuente única de las reglas de dieta y lo que consumirá el selector.
  // Guardar aquí un vocabulario propio obligaría a remapear datos reales más adelante.
  // Las etiquetas visibles sí son las del handoff.
  var ALERGIAS_PERSONA = [
    { id: 'sin-gluten', etiqueta: 'cat_alergia_gluten', desc: 'cat_alergia_gluten_desc' },
    { id: 'sin-lactosa', etiqueta: 'cat_alergia_lactosa', desc: 'cat_alergia_lactosa_desc' },
    { id: 'sin-huevo', etiqueta: 'cat_alergia_huevo', desc: 'cat_alergia_huevo_desc' },
    { id: 'sin-frutos-secos', etiqueta: 'cat_alergia_frutos', desc: 'cat_alergia_frutos_desc' },
    // Pescado y marisco separados (handoff 5, 3-ago): eran una sola fila
    // ('sin-pescado-marisco') y un alérgico solo al marisco perdía también todo
    // el pescado — son alergias clínicamente distintas. Los ids nuevos ya están
    // en el motor (bd_v6/dietas.js); el id agrupado se conserva como legacy y se
    // migra marcando los dos (ver migrarAlergiaPescadoMarisco en app.js).
    { id: 'sin-pescado', etiqueta: 'cat_alergia_pescado', desc: 'cat_alergia_pescado_desc' },
    { id: 'sin-marisco', etiqueta: 'cat_alergia_marisco', desc: 'cat_alergia_marisco_desc' },
    { id: 'sin-rosaceas', etiqueta: 'cat_alergia_rosaceas', desc: 'cat_alergia_rosaceas_desc' }
  ];
  var ETIQUETA_ALERGIA = {};
  ALERGIAS_PERSONA.forEach(function (a) { ETIQUETA_ALERGIA[a.id] = a.etiqueta; });

  var GUSTOS_GRUPOS = [
    { titulo: 'gusto_grupo_proteinas', items: [['pollo', 'gusto_pollo'], ['ternera', 'gusto_ternera'], ['cerdo', 'gusto_cerdo'], ['salmon', 'gusto_salmon'], ['merluza', 'gusto_merluza'], ['atun', 'gusto_atun'], ['huevos', 'gusto_huevos'], ['lentejas', 'gusto_lentejas'], ['garbanzos', 'gusto_garbanzos'], ['tofu', 'gusto_tofu']] },
    { titulo: 'gusto_grupo_verduras', items: [['brocoli', 'gusto_brocoli'], ['espinacas', 'gusto_espinacas'], ['calabacin', 'gusto_calabacin'], ['pimiento', 'gusto_pimiento'], ['champinones', 'gusto_champinones'], ['ensalada', 'gusto_ensalada'], ['patata', 'gusto_patata'], ['arroz', 'gusto_arroz'], ['pasta', 'gusto_pasta']] },
    { titulo: 'gusto_grupo_siempre', items: [['tortilla', 'gusto_tortilla'], ['lentejas-guiso', 'gusto_lentejas_guiso'], ['paella', 'gusto_paella'], ['crema', 'gusto_crema'], ['pescado-horno', 'gusto_pescado_horno'], ['guiso', 'gusto_guiso']] }
  ];
  var ETIQUETA_GUSTO = {};
  GUSTOS_GRUPOS.forEach(function (g) { g.items.forEach(function (par) { ETIQUETA_GUSTO[par[0]] = par[1]; }); });

  var PATRONES_COMIDA = [
    { id: 'plato-unico', etiqueta: 'patron_plato_unico', desc: 'patron_comida_plato_unico_desc' },
    { id: 'primero-segundo', etiqueta: 'patron_primero_segundo', desc: 'patron_comida_primero_desc' },
    { id: 'ligera', etiqueta: 'patron_ligera', desc: 'patron_comida_ligera_desc' }
  ];
  var PATRONES_CENA = [
    { id: 'ligera', etiqueta: 'patron_ligera', desc: 'patron_cena_ligera_desc' },
    { id: 'plato-unico', etiqueta: 'patron_plato_unico', desc: 'patron_cena_plato_unico_desc' },
    { id: 'completa', etiqueta: 'patron_completa', desc: 'patron_cena_completa_desc' }
  ];
  var ETIQUETA_PATRON_COMIDA = { 'plato-unico': 'patron_plato_unico', 'primero-segundo': 'patron_primero_segundo', ligera: 'patron_ligera', completa: 'patron_completa' };

  var OPCIONES_OBJETIVO_PERSONA = [
    { valor: 'mantenimiento', etiqueta: 'objetivo_mantener' },
    { valor: 'perdida', etiqueta: 'objetivo_perder' },
    { valor: 'ganancia', etiqueta: 'objetivo_ganar' }
  ];
  var AYUDA_ACTIVIDAD = { baja: 'ayuda_actividad_baja', media: 'ayuda_actividad_media', alta: 'ayuda_actividad_alta' };

  // `dieta` es el campo que consume el motor v3 (omnivora | vegetariana |
  // sin-pescado | sin-lactosa | sin-cerdo). `estilo` es el campo nuevo del
  // handoff y el que consumirá dietas.js. Se deriva uno del otro para que el
  // rediseño no convierta un mando que HOY funciona en decoración:
  //   vegano -> 'vegetariana' porque el motor v3 no tiene dieta vegana (huevo y
  //   lácteo siguen entrando). Los vetos por ingrediente son el mecanismo con el
  //   que el propio proyecto expresa hoy "≈vegano" (tests/stress_percentil95.js:
  //   dieta vegetariana + veto de huevo) y siguen editables en el bloque Alergias.
  var ESTILO_A_DIETA = { 'de-todo': 'omnivora', vegetariano: 'vegetariana', vegano: 'vegetariana', 'sin-cerdo': 'sin-cerdo' };
  function estiloADieta(estilo) { return ESTILO_A_DIETA[estilo] || 'omnivora'; }

  // Miembro dado de alta antes del handoff: no tiene `estilo`, se infiere de su
  // `dieta` de siempre (mismo criterio que el prototipo: normDraft).
  function estiloDeMiembro(m) {
    if (m && m.estilo) return m.estilo;
    var d = ((m && m.dieta) || '').toLowerCase();
    if (d.indexOf('vegan') !== -1) return 'vegano';
    if (d.indexOf('veget') !== -1) return 'vegetariano';
    if (d.indexOf('cerdo') !== -1) return 'sin-cerdo';
    return 'de-todo';
  }

  // El grid 7×2 del handoff (comida/cena × L-D) NO es un campo nuevo: es una
  // vista binaria del `patron` que el motor ya lee (casa | fuera | cole). Marcado
  // = 'casa'; desmarcado = 'fuera'. Un 'cole' antiguo se ve desmarcado — para el
  // motor 'cole' y 'fuera' son lo mismo (presentesEnComida solo mira !== 'casa').
  function patronSeguro(m) {
    var p = (m && m.patron) || {};
    var fila = function (v) { return (v && v.length === 7) ? v : ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa']; };
    return { comida: fila(p.comida), cena: fila(p.cena) };
  }
  function serviciosEnCasa(m) {
    var p = patronSeguro(m);
    return p.comida.concat(p.cena).filter(function (v) { return v === 'casa'; }).length;
  }

  // ---------------------------------------------------------------
  // Persona — controles compartidos por el asistente y la ficha
  // ---------------------------------------------------------------
  // Los dos sitios editan LA MISMA persona en curso (`personaDraft` en app.js),
  // así que comparten acciones (`persona-set`, `persona-alergia`…). La ficha usa
  // la variante densa del handoff (celdas 38px, chips 13px, campos sobre
  // #F7F3EC): misma marca, un punto menos de escala. La pinta la clase del
  // contenedor (.per-densa), no un juego de funciones duplicado.
  // la inicial del dia vive en i18n (diasInicial) desde la sesion higiene 30-jul

  function pildorasPersona(campo, opciones, valorActual) {
    return '<div class="per-pildoras">' + opciones.map(function (o) {
      var activo = o.valor === valorActual;
      return '<button type="button" class="per-pildora' + (activo ? ' per-pildora-on' : '') + '" ' +
        'data-action="persona-set" data-campo="' + campo + '" data-valor="' + o.valor + '" aria-pressed="' + activo + '">' +
        escapeHtml(t(o.etiqueta)) + '</button>';
    }).join('') + '</div>';
  }

  // Tarjeta de selección única con check circular — estilo de vida y patrones de
  // comida/cena comparten anatomía; solo el estilo de vida lleva icono.
  function tarjetasPersona(campo, opciones, valorActual) {
    return '<div class="per-tarjetas">' + opciones.map(function (o) {
      var activo = o.id === valorActual;
      return '<button type="button" class="per-tarjeta' + (activo ? ' per-tarjeta-on' : '') + '" ' +
        'data-action="persona-set" data-campo="' + campo + '" data-valor="' + o.id + '" aria-pressed="' + activo + '">' +
        (o.icono ? '<span class="per-tarjeta-ico"><i data-lucide="' + o.icono + '"></i></span>' : '') +
        '<span class="per-tarjeta-txt"><span class="per-tarjeta-nombre">' + escapeHtml(t(o.etiqueta)) + '</span>' +
        '<span class="per-tarjeta-desc">' + escapeHtml(t(o.desc)) + '</span></span>' +
        '<span class="per-check" aria-hidden="true"><i data-lucide="check"></i></span>' +
        '</button>';
    }).join('') + '</div>';
  }

  function listaAlergias(seleccionadas, conDescripcion) {
    var sel = seleccionadas || [];
    return '<div class="per-alergias">' + ALERGIAS_PERSONA.map(function (a) {
      var activo = sel.indexOf(a.id) !== -1;
      return '<button type="button" class="per-alergia' + (activo ? ' per-alergia-on' : '') + '" ' +
        'data-action="persona-alergia" data-valor="' + a.id + '" aria-pressed="' + activo + '">' +
        '<span class="per-caja" aria-hidden="true"><i data-lucide="check"></i></span>' +
        '<span class="per-alergia-txt"><span class="per-alergia-nombre">' + escapeHtml(t(a.etiqueta)) + '</span>' +
        (conDescripcion ? '<span class="per-alergia-desc">' + escapeHtml(t(a.desc)) + '</span>' : '') + '</span>' +
        '</button>';
    }).join('') + '</div>';
  }

  // Chip de 3 estados por toque: neutro → ♥ me encanta → ✕ mejor no → neutro.
  // El símbolo va DENTRO del texto del chip (no un icono aparte) como en el
  // handoff, y el estado también viaja en aria-pressed/aria-label para que no
  // dependa solo del color (no hay hover en móvil, UI_MOBILE §6).
  function chipsGustos(gustos, items) {
    var g = gustos || {};
    return '<div class="per-chips">' + items.map(function (par) {
      var v = g[par[0]] || 0;
      var clase = v === 1 ? ' per-chip-si' : v === 2 ? ' per-chip-no' : '';
      var marca = v === 1 ? '♥ ' : v === 2 ? '✕ ' : '';
      var estado = v === 1 ? t('onb_me_encanta_min') : v === 2 ? t('onb_mejor_no_min') : '';
      return '<button type="button" class="per-chip' + clase + '" data-action="persona-gusto" data-valor="' + par[0] + '" ' +
        'aria-label="' + escapeHtml(t(par[1]) + (estado ? ': ' + estado : '')) + '">' +
        marca + escapeHtml(t(par[1])) + '</button>';
    }).join('') + '</div>';
  }

  function gridServicios(miembro) {
    var patron = patronSeguro(miembro);
    var fila = function (tipo) {
      return '<div class="per-grid">' + patron[tipo].map(function (v, i) {
        var enCasa = v === 'casa';
        var etiqueta = NOMBRES_DIA()[i] + ' · ' + (tipo === 'comida' ? 'comida' : 'cena') + ': ' + (enCasa ? 'en casa' : 'fuera') + '. Toca para cambiar.';
        return '<button type="button" class="per-celda' + (enCasa ? ' per-celda-on' : '') + '" ' +
          'data-action="persona-servicio" data-tipo="' + tipo + '" data-dia="' + i + '" ' +
          'aria-pressed="' + enCasa + '" aria-label="' + escapeHtml(etiqueta) + '">' +
          '<i data-lucide="' + (enCasa ? 'check' : 'x') + '"></i></button>';
      }).join('') + '</div>';
    };
    return '<div class="per-grid per-grid-dias" aria-hidden="true">' +
      I18N.diasInicial().map(function (d) { return '<span class="per-dia">' + d + '</span>'; }).join('') + '</div>' +
      '<div class="per-grid-tit"><i data-lucide="sun"></i>Comida</div>' + fila('comida') +
      '<div class="per-grid-tit per-grid-tit-cena"><i data-lucide="moon"></i>Cena</div>' + fila('cena');
  }

  function resumenServicios(miembro) {
    var patron = patronSeguro(miembro);
    // El prototipo devolvía 'todos' cuando no falta ningún día, y la frase salía
    // invertida ("Fuera: comidas todos" con 14 de 14 en casa). Aquí, ninguna.
    var fuera = function (tipo) {
      var f = patron[tipo].map(function (v, i) { return v === 'casa' ? null : I18N.diasInicial()[i]; }).filter(Boolean);
      return f.length ? f.join(' ') : t('res_ninguna');
    };
    return t('res_planificamos').replace('{n}', serviciosEnCasa(miembro)).replace('{c}', fuera('comida')).replace('{d}', fuera('cena'));
  }

  // Textos de resumen de los 5 bloques — los usan la ficha del onboarding (paso
  // 7) y las cabeceras del acordeón de Familia. Mismos textos en los dos sitios.
  function resumenPersona(m) {
    var gustos = m.gustos || {};
    var si = Object.keys(gustos).filter(function (k) { return gustos[k] === 1; });
    var no = Object.keys(gustos).filter(function (k) { return gustos[k] === 2; });
    var alergias = m.alergias || [];
    var restric = (m.restricciones || '').trim();
    var claveEstilo = ETIQUETA_ESTILO[estiloDeMiembro(m)];
    return {
      basicos: [
        (m.nombre || '').trim() || t('res_sin_nombre'),
        t(m.sexo === 'hombre' ? 'sexo_hombre' : 'sexo_mujer'),
        m.anioNacimiento || t('res_anio_sin'),
        m.altura ? m.altura + ' cm' : null,
        m.peso ? m.peso + ' kg' : null,
        // el resumen no puede enseñar lo que la ficha ya no pregunta
        pideActividadYObjetivo(m.anioNacimiento) ? t('res_actividad').replace('{a}', t('actividad_' + (m.actividad || 'media')).toLowerCase()) : null,
        pideActividadYObjetivo(m.anioNacimiento) ? t('objetivo_peso_' + (m.objetivo || 'mantenimiento')) : null
      ].filter(Boolean).join(' · '),
      estilo: claveEstilo ? t(claveEstilo) : t('res_sin_elegir'),
      alergias: alergias.length
        ? alergias.map(function (a) { return t(ETIQUETA_ALERGIA[a]); }).join(' · ')
        : (restric && restric.toLowerCase() !== 'ninguna' ? restric : t('ninguna_marcada')),
      gustos: (si.length ? '♥ ' + si.map(function (k) { return t(ETIQUETA_GUSTO[k]); }).join(', ') : t('res_sin_favoritos')) +
        (no.length ? '   ·   ✕ ' + no.map(function (k) { return t(ETIQUETA_GUSTO[k]); }).join(', ') : ''),
      comidas: t('boton_comida') + ' ' + t(ETIQUETA_PATRON_COMIDA[m.pComida] || 'patron_primero_segundo') +
        ' · ' + t('boton_cena') + ' ' + t(ETIQUETA_PATRON_COMIDA[m.pCena] || 'patron_ligera') +
        ' · ' + t('res_servicios_casa').replace('{n}', serviciosEnCasa(m))
    };
  }

  // Avisos reutilizados (mismo copy en asistente y ficha)
  function avisoInfo(texto) {
    return '<div class="per-aviso"><span class="per-aviso-ico"><i data-lucide="info"></i></span><span>' + escapeHtml(texto) + '</span></div>';
  }
  // Copy del aviso de medidas: 3 claves por banda de edad, ver claveAvisoMedidas() más arriba
  // ('onb_aviso_medidas_adulto' / '..._menor_mayor' / '..._menor')

  // ── CUANDO EL MOTOR NO PUEDE (§14.5 / §4.12) ──────────────────────────────────────────
  // `estado.errorMotor` es el mensaje TÉCNICO de `contrato_familia.js` (una línea
  // "· <id>: <detalle>" por miembro/problema, prefijo "contrato de familia:\n"). Nunca se
  // pinta tal cual: se traduce a frase humana si el patrón es conocido (hoy: altura_cm/
  // peso_kg fuera de rango, que es el bug real reproducido en TRAMO B del encargo), y si
  // ALGUNA línea no se reconoce se cae al genérico + el crudo plegado — nunca a medias,
  // nunca inventado (regla dura: no afirmar más de lo que la salida demuestra).
  function interpretarErrorMotor(errorMotor, familia) {
    if (!errorMotor) return null;
    var porId = {};
    (familia || []).forEach(function (m) { if (m && m.id != null) porId[m.id] = (m.nombre || m.id); });
    var lineas = String(errorMotor).split('\n')
      .map(function (l) { return l.replace(/^\s*·\s*/, '').trim(); })
      .filter(function (l) { return /^[^:]+:\s*.+$/.test(l); });
    if (!lineas.length) return null;
    var faltantes = {}; // id -> { altura: bool, peso: bool }
    var reconocidoTodo = true;
    lineas.forEach(function (linea) {
      var m = linea.match(/^([^:]+):\s*(.+)$/);
      if (!m) { reconocidoTodo = false; return; }
      var id = m[1], detalle = m[2];
      if (/^altura_cm fuera de rango/.test(detalle)) (faltantes[id] = faltantes[id] || {}).altura = true;
      else if (/^peso_kg fuera de rango/.test(detalle)) (faltantes[id] = faltantes[id] || {}).peso = true;
      else reconocidoTodo = false;
    });
    if (!reconocidoTodo || !Object.keys(faltantes).length) return null;
    return Object.keys(faltantes).map(function (id) {
      var nombre = porId[id] || id;
      var f = faltantes[id];
      var clave = (f.altura && f.peso) ? 'error_motor_faltan_medidas' : (f.peso ? 'error_motor_falta_peso' : 'error_motor_falta_altura');
      return t(clave).replace('{nombre}', nombre);
    }).join(' · ');
  }

  // Bloque visible que sustituye al genérico "todavía no hay semana generada" en las 4
  // vistas que dependen del plan (Home, Resumen semana, Recetas, Compra) cuando el motor
  // reventó de verdad. `null` si no hay error que enseñar (deja el genérico de siempre).
  // `errorMotor` = la semana no se pudo GENERAR · `errorSuperficie` = la semana existe pero el
  // motor no pudo abrir la superficie de producto (catalogo, compra, descubrir). Los dos son
  // «algo no cuadra en una ficha» y se cuentan igual; lo que no vale es callarse ninguno.
  function avisoErrorMotor(estado) {
    var error = estado && (estado.errorMotor || estado.errorSuperficie);
    if (!error) return null;
    var humano = interpretarErrorMotor(error, estado.familia);
    var cuerpo = humano
      ? escapeHtml(humano)
      : escapeHtml(t('error_motor_generico')) +
        '<details class="error-motor-detalle"><summary>' + escapeHtml(t('error_motor_ver_detalle')) + '</summary>' +
        '<pre>' + escapeHtml(error) + '</pre></details>';
    return '<div class="card-msg error-motor">' +
      '<p>' + cuerpo + '</p>' +
      '<button type="button" class="onb-btn-linea" data-action="ir-vista" data-vista="perfil">' + escapeHtml(t('error_motor_ir_familia')) + '</button>' +
      '</div>';
  }

  // alimentos del banco V6 ordenados por nombre — rejilla de vetos de la ficha
  function alimentosOrdenados(banco) {
    return banco.alimentos.slice().sort(function (a, b) { return a.nombre.localeCompare(b.nombre); });
  }

  // ---------------------------------------------------------------
  // LECTURA NATIVA DE V6 (§15) — el único sitio de la UI que conoce la forma de la semana `/2`.
  // Todo lo de abajo son lecturas del banco V6 y del servicio; ninguna re-decide nada:
  // el motor ya resolvió el plato, la política de hogar (§13) y las notas tipadas (§9.2).
  // ---------------------------------------------------------------
  var _ix = null;
  function ix(banco) {
    if (_ix && _ix.banco === banco) return _ix;
    var elab = {}, alim = {}, sust = {};
    banco.elaboraciones.forEach(function (e) { elab[e.id] = e; });
    banco.alimentos.forEach(function (a) { alim[a.id] = a; });
    (banco.sustitutos || []).forEach(function (s) { sust[s.original + '>' + s.sustituto_id] = s; });
    _ix = { banco: banco, elab: elab, alim: alim, sust: sust };
    return _ix;
  }
  function elabDe(banco, id) { return ix(banco).elab[id] || null; }
  function nombreAlimento(banco, id) { var a = ix(banco).alim[id]; return a ? a.nombre : id; }
  // la tabla `sustitutos` lleva el HUECO SEMÁNTICO de la frase (§14.2.5); la frase final es
  // capa de copy y jamás vive en el banco
  function notaSustituto(banco, original, sustitutoId) {
    var f = ix(banco).sust[original + '>' + sustitutoId];
    return (f && f.nota_card) || nombreAlimento(banco, sustitutoId).toLowerCase();
  }

  // opción del eje que le toca a un miembro en esa elaboración ('*' = toda la mesa)
  function opcionDe(item, miembroId) {
    var oe = item && item.opciones_eje;
    if (!oe) return null;
    if (miembroId && oe[miembroId]) return oe[miembroId];
    if (oe['*']) return oe['*'];
    var ks = Object.keys(oe);
    return ks.length ? oe[ks[0]] : null;
  }
  // La opción con la que la card TITULA el plato: la que come más gente en esa mesa. La card es
  // UNA (§2-bis) y la identidad para la variedad es la RECETA, no la variante — las diferencias
  // por persona ya viajan en las notas y en el detalle del badge, que es su sitio. Empate: el id
  // menor, para que el título sea determinista (mismo criterio que el desempate del motor).
  // Sin esto, una mesa mixta («pollo al horno» para tres, «tofu al horno» para la vegetariana)
  // dejaba el título sin proteína — «al horno» a secas, visto en el navegador el 3-ago.
  function opcionDeMesa(item) {
    var oe = item && item.opciones_eje;
    if (!oe) return null;
    var cuenta = {};
    Object.keys(oe).forEach(function (k) { cuenta[oe[k]] = (cuenta[oe[k]] || 0) + 1; });
    return Object.keys(cuenta).sort(function (a, b) { return cuenta[b] - cuenta[a] || (a < b ? -1 : 1); })[0] || null;
  }

  // EL PLATO PERCIBIDO (§3-M1, fila 6.2 de la lista): `nombre_por_opcion[opción]`. Sin resolverlo
  // la app enseña el nombre-plantilla del banco tal cual — «{pescado} a la plancha», 30
  // elaboraciones del banco vivo. La red de abajo cubre el hueco D5 (opción sin entrada en
  // `nombre_por_opcion`): antes de enseñar una llave, se sustituye por el nombre del alimento.
  function nombrePercibido(banco, item, miembroId) {
    var e = elabDe(banco, item.elaboracion_id);
    if (!e) return item.elaboracion_id;
    var op = miembroId === '*' ? opcionDeMesa(item) : opcionDe(item, miembroId);
    if (op && e.nombre_por_opcion && e.nombre_por_opcion[op]) return e.nombre_por_opcion[op];
    // hueco D5 (opción sin entrada en `nombre_por_opcion`): antes de enseñar la llave literal
    // —«{pescado} a la plancha», el bug de la fila 6.2— se rellena con el nombre del alimento.
    if (/\{[^}]+\}/.test(e.nombre)) {
      return op ? capitaliza(e.nombre.replace(/\{[^}]+\}/, nombreAlimento(banco, op)))
        : capitaliza(e.nombre.replace(/\{[^}]+\}\s*/, '').trim());
    }
    return e.nombre;
  }

  // el PRINCIPAL de un servicio: la primera elaboración de `plato[]` con tipo 'principal'
  // (T2 sirve 1-3 y solo una es principal). Sin plato -> null, que es el hueco declarado.
  function principalDe(banco, servicio) {
    if (!servicio || !servicio.plato || !servicio.plato.length) return null;
    for (var i = 0; i < servicio.plato.length; i++) {
      var e = elabDe(banco, servicio.plato[i].elaboracion_id);
      if (e && e.tipo === 'principal') return servicio.plato[i];
    }
    return servicio.plato[0];
  }
  function secundariasDe(banco, servicio) {
    var p = principalDe(banco, servicio);
    return (servicio && servicio.plato ? servicio.plato : []).filter(function (x) { return x !== p; });
  }

  // ── «aún no disponible en V6». Principio literal de Roger: *«quiero que lo dejes preparado
  //    desde ya, aunque el botón no responda. Ya me ha pasado con la pantalla de coste semanal:
  //    como no está conectable, no la muestras, y cae en el olvido»*. Lo que depende de las 14
  //    funciones de superficie (bloque 3, §15.2-§15.6) se enseña VISIBLE y marcado, jamás oculto.
  function pendienteV6(titulo, texto) {
    return '<div class="v6-pendiente" role="status">' +
      '<span class="v6-pendiente-badge"><i data-lucide="hard-hat"></i>' + t('v6_pendiente_badge') + '</span>' +
      '<p class="v6-pendiente-tit">' + escapeHtml(titulo) + '</p>' +
      '<p class="v6-pendiente-txt">' + escapeHtml(texto) + '</p>' +
      '</div>';
  }

  // cabecera estándar de cualquier bottom sheet (título + X de cerrar)
  // Aviso de reinicio de esquema (sesion higiene 30-jul): el estado guardado era de una
  // version anterior (o estaba corrupto) y se ha empezado de cero — sin migraciones,
  // decision de Roger. Lenguaje de alivio: informa y se descarta, no culpa ni alarma.
  function avisoReinicioHtml() {
    return '<div class="aviso-reinicio" role="status">' +
      '<p class="aviso-reinicio-texto"><b>' + t('aviso_reinicio_titulo') + '</b> ' + t('aviso_reinicio_texto') + '</p>' +
      '<button type="button" class="aviso-reinicio-cerrar" data-action="cerrar-aviso-reinicio">' + t('aviso_reinicio_cerrar') + '</button>' +
      '</div>';
  }

  function sheetHead(titulo, sinCerrar) {
    return '<div class="sheet-head"><h2>' + escapeHtml(titulo) + '</h2>' +
      (sinCerrar ? '' : '<button type="button" class="btn-cerrar" data-action="cerrar-sheet" aria-label="Cerrar">&times;</button>') +
      '</div>';
  }

  function nombreCortoIngrediente(nombre) {
    return (nombre || '').split(' (')[0];
  }

  function iniciales(nombre) {
    if (!nombre) return '?';
    return nombre.trim().charAt(0).toUpperCase();
  }

  // Solo se aceptan dataURLs de imagen — lo único que produce la app
  // (resizeImageToDataURL). La foto viaja por Firestore: un valor manipulado
  // desde otro dispositivo, interpolado en el atributo style, podía escapar de
  // la url('…') e inyectar atributos en el tag (audit 2026-07-20). Un dataURL
  // legítimo no contiene comillas ni backslash — quitarlas no rompe ninguno.
  function fotoSegura(foto) {
    if (!foto || typeof foto !== 'string' || foto.indexOf('data:image/') !== 0) return null;
    return foto.replace(/["'\\]/g, '');
  }

  // avatar con foto (dataURL) si existe, con fallback a iniciales — mismo patrón que el
  // motor viejo (e3foods.html): la foto sustituye el avatar de letra cuando hay una subida.
  function avatarInner(miembro) {
    return fotoSegura(miembro.foto) ? '' : escapeHtml(iniciales(miembro.nombre));
  }
  function avatarEstilo(miembro) {
    var foto = fotoSegura(miembro.foto);
    return foto ? " style=\"background-image:url('" + foto + "')\"" : '';
  }
  // Igual que avatarEstilo pero fusionando un color de fondo (fallback sin foto)
  // en el MISMO atributo style — bug real (Roger 2026-07-20): los 3 sitios que
  // necesitan color de fallback + foto concatenaban 'style="background:X"' y
  // luego avatarEstilo() (que emite su PROPIO style="..."), dos atributos
  // style en el mismo tag. HTML ignora el segundo duplicado silenciosamente:
  // el color se veía siempre, la foto nunca. Un solo atributo, sin este bug.
  //
  // Segundo bug real, mismo sitio (Roger 2026-07-20, hallado al reportar que la
  // foto se ve con zoom en un lateral en vez de la cara centrada): el shorthand
  // `background:COLOR` resetea IMPLÍCITAMENTE background-size/position a sus
  // valores iniciales (auto / 0% 0%) — confirmado con getComputedStyle. Al ser
  // inline, ese reset implícito gana por especificidad sobre `.ph-avatar {
  // background-size:cover; background-position:center}` del CSS externo: la
  // foto (200×200) se pintaba a tamaño nativo desde la esquina superior-
  // izquierda del círculo, no recortada ni centrada — la cara quedaba fuera
  // del recorte visible aunque estuviera centrada en la foto guardada.
  // `background-color` es longhand: no toca ningún otro sub-valor.
  function avatarEstiloColor(miembro, color) {
    var foto = fotoSegura(miembro.foto);
    return 'style="background-color:' + color + (foto ? ";background-image:url('" + foto + "')" : '') + '"';
  }

  function fechaCorta(fechaISO) {
    var d = new Date(fechaISO + 'T00:00:00');
    return d.getDate() + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()];
  }

  function hoyISO() { return fechaLocalISO(new Date()); }

  function saludoHora() {
    var h = new Date().getHours();
    if (h < 12) return t('saludo_manana');
    if (h < 20) return t('saludo_tarde');
    return t('saludo_noche');
  }

  // iconos de sol/luna — mismo estilo de línea que el nav (24x24, stroke)
  var ICONO_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';
  var ICONO_LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a6.8 6.8 0 0 0 11.3 11.3z"/></svg>';
  // handoff 7, §2.2: el chevron del badge de estado NO es Lucide — SVG en línea de 10x10,
  // stroke-width 3. La rotación al abrir la pinta la clase .ph-estado-flecha-abierta.
  var ICONO_CHEVRON_ESTADO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>';

  // Marcas reales de Google/Apple (handoff 5, §3 — "elegir vía: email, Google,
  // Apple. Marcas reales"): logomarcas oficiales, no un icono lucide genérico.
  // Handoff 6 (02-signin.md): tamaños EXACTOS del handoff horneados en el propio
  // SVG (15×15 Google dentro del chip de 25×25; Apple 13×16 — NO cuadrado, la
  // manzana es más alta que ancha) y el path de Apple sustituido por el trazado
  // oficial viewBox 0 0 814 1000 literal de reference/Onboarding.dc.html — el
  // anterior (viewBox 384 512, silueta genérica) no es el de este handoff.
  var ICONO_GOOGLE = '<svg viewBox="0 0 256 262" style="width:15px;height:15px;display:block" aria-hidden="true">' +
    '<path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.687H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.687 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.872-56.28 38.872-96.03"/>' +
    '<path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-39.9 30.89-.527 1.462C35.393 231.798 79.49 261.1 130.55 261.1"/>' +
    '<path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.66 71.7l-1.335.635C5.077 90.539 0 111.14 0 132.55s5.077 42.011 14.325 60.216z"/>' +
    '<path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 14.325 71.7l41.956 32.549c10.445-31.477 39.746-54.25 74.269-54.25"/>' +
    '</svg>';
  var ICONO_APPLE = '<svg viewBox="0 0 814 1000" style="width:13px;height:16px;display:block" aria-hidden="true">' +
    '<path fill="#1A1712" d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1-68 0-85.5-39.5-164-39.5-76.5 0-103.7 40.8-165.9 40.8-62.2 0-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zM554.1 159.4c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 6.5 1.3 13 1.9 15.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-68.3z"/>' +
    '</svg>';

  // soporte de reconocimiento de voz del navegador (nevera) — si no existe, el
  // botón de micro ni se pinta (degradación silenciosa, cero rotura)
  var TIENE_VOZ = !!(global.SpeechRecognition || global.webkitSpeechRecognition);

  // quita acentos para que "salmon" encuentre "Salmón" en el buscador
  function normalizarTexto(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }

  // "Salmón a la plancha con Patata y Calabacín" -> título + subtítulo ("con..."),
  // heurística simple sobre el patrón de nombres del banco (todos siguen "X con Y").
  function splitNombrePlato(nombre) {
    var i = nombre.indexOf(' con ');
    if (i === -1) return { titulo: nombre, subtitulo: '' };
    return { titulo: nombre.slice(0, i), subtitulo: nombre.slice(i + 1) };
  }

  // ---------------------------------------------------------------
  // Bloque de comida/cena — única vista SEMANA tras retirar HOY. Card
  // rediseñada 2026-07-13 (referencia visual externa, paleta/tipografía
  // traducidas a Etria — nunca los verdes/morados literales del handoff).
  // ---------------------------------------------------------------
  // V6: quién pertenece a un servicio sale de `semana.presencia` VERBATIM — los 14 slots de
  // cada miembro son explícitos en la semana `/2` y ya incorporan patrón, ausencias fijas y
  // cole. `presentes` le resta las ausencias PUNTUALES que la familia marca a mano después de
  // generar (estado de UI, no del motor). Re-escalar la ración con la mesa real es
  // `reescalarServicio` (§15.4) — bloque 3.
  function slotKey(diaIndex, tipoComida) { return (diaIndex + 1) + '-' + tipoComida; }

  function comensalesDeSlot(estado, plan, diaIndex, tipoComida) {
    var clave = slotKey(diaIndex, tipoComida);
    var pres = (plan && plan.presencia) || {};
    var miembrosDelSlot = (estado.familia || []).filter(function (m) {
      return pres[m.id] ? pres[m.id][clave] === true : true;
    });
    var fecha = fechaDelDia(plan, diaIndex);
    var fuera = (estado.ausenciasPuntuales && estado.ausenciasPuntuales[fecha] && estado.ausenciasPuntuales[fecha][tipoComida]) || [];
    var presentes = miembrosDelSlot.filter(function (m) { return fuera.indexOf(m.id) === -1; });
    return {
      miembrosDelSlot: miembrosDelSlot,
      presentes: presentes,
      comensales: presentes.length ? presentes : miembrosDelSlot.slice(0, 1)
    };
  }

  // la semana `/2` guarda `semana_iso`, no fechas: la fecha de cada día se DERIVA con la
  // definición ejecutable del motor (`derivar.fechaDia`), nunca se guarda en el plan.
  function fechaDelDia(plan, diaIndex) {
    return plan && plan.semana_iso ? fechaDeDia(plan.semana_iso, diaIndex + 1) : null;
  }
  function servicioDe(plan, diaIndex, tipoComida) {
    if (!plan || !plan.servicios) return null;
    for (var i = 0; i < plan.servicios.length; i++) {
      var s = plan.servicios[i];
      if (s.dia === diaIndex + 1 && s.servicio === tipoComida) return s;
    }
    return null;
  }

  // Paleta de identidad por miembro (Roger 2026-07-19, handoff Claude Design):
  // antes el avatar solo codificaba presencia (--ink/--elev3); ahora cada
  // miembro tiene un color estable propio (derivado del índice, sin campo
  // nuevo en el dato) + un check superpuesto aparte para la presencia — dos
  // señales en vez de una sola solapada.
  var PALETA_AVATAR = ['oklch(0.72 0.15 55)', 'oklch(0.6 0.09 200)', 'oklch(0.66 0.13 350)', 'oklch(0.62 0.12 150)', 'oklch(0.6 0.13 300)'];
  function colorMiembro(idx) { return PALETA_AVATAR[idx % PALETA_AVATAR.length]; }

  function avataresPager(estado, mesa, diaIndex, meal, oscuro) {
    var familia = estado.familia || [];
    return mesa.miembrosDelSlot.map(function (m) {
      var idx = familia.indexOf(m);
      var estaPresente = mesa.presentes.some(function (p) { return p.id === m.id; });
      return '<span class="ph-avatar-wrap' + (oscuro ? ' ph-avatar-wrap-oscuro' : '') + '">' +
        '<button type="button" class="ph-avatar" ' + avatarEstiloColor(m, colorMiembro(idx)) + ' ' +
        'data-action="toggle-presente" data-dia="' + diaIndex + '" data-tipo="' + meal + '" data-miembro="' + m.id + '" ' +
        'aria-pressed="' + estaPresente + '" aria-label="' + escapeHtml(m.nombre) + (estaPresente ? ', en casa. Toca para marcar que hoy no come.' : ', fuera hoy. Toca para marcar que sí come.') + '">' +
        avatarInner(m) + '</button>' +
        (estaPresente ? '<span class="ph-avatar-check" aria-hidden="true"><i data-lucide="check"></i></span>' : '') +
        '</span>';
    }).join('');
  }

  // ---------------------------------------------------------------
  // Estados de plato por persona (handoff 5, §2 — e3Foods.dc.html / sistema-color.md,
  // 3-ago 2026). Tres estados, DOS colores: la diferencia la marca el peso (píldora
  // clara vs relleno sólido), nunca un matiz nuevo. Copy: nunca "come aparte"
  // —excluye—, siempre "come otra cosa" (handoff).
  //
  // Datos reales, sin tocar el motor: mesa.presentes = quién come hoy (lo mismo que ya marca el
  // check del avatar); los AJUSTES y el «come otra cosa» salen de las notas tipadas de §9.2 —
  // aquí solo se traducen a texto y color, no se recalcula nada.
  //
  // El TERCER estado ("X come otra cosa") es la nota `sustituto`: exclusión ESTRUCTURAL, esa
  // persona deriva SU plato. El handoff 5 lo dejó preparado y ningún motor lo rellenaba; V6 sí.
  // Nunca se deriva de "no estar en presentes" — son campos independientes (aviso explícito del
  // handoff); por eso se filtra contra mesa.presentes en vez de asumir que implica ausencia.
  // ---------------------------------------------------------------
  var ESTADO_OLIVA = 'oklch(0.55 0.09 140)';
  var ESTADO_TERRACOTA = 'oklch(0.55 0.15 45)';
  var ESTADO_BLOQUEO = 'oklch(0.5 0.16 35)';

  // ── LAS NOTAS TIPADAS DE LA CARD (§9.2 del formato · spec §15.7). Ninguna es opcional de
  //    pintar. El front NO re-implementa la política de hogar (§13) ni re-comprueba alérgenos:
  //    el motor ya decidió y aquí solo se PINTA lo que llega.
  //      eliminar          la línea no se deriva para ese miembro. `miembro: '*'` = para nadie,
  //                        política de hogar — se dice UNA vez, no por persona (§13.1.3)
  //      variante-todos    la olla entera cambia de ingrediente («sin huevo en casa: empanado
  //                        con leche»); el mecanismo real es la COMPRA
  //      vehiculo-persona  el sustituto es solo de esa persona (pasta sin gluten)
  //      solo-para         esa elaboración del plato[] solo se sirve a esos miembros
  //      sustituto         exclusión estructural: esa persona come SU plato
  //      seguridad-infantil  el motor la emite; la interfaz NO la pinta (Roger 7-ago-2026)
  function notasDe(servicio, tipo) {
    return ((servicio && servicio.notas) || []).filter(function (n) { return n.tipo === tipo; });
  }
  function nombreMiembro(estado, id) {
    var m = (estado.familia || []).filter(function (x) { return x.id === id; })[0];
    return m ? m.nombre : id;
  }
  function unirNombres(estado, ids) {
    var ns = (ids || []).map(function (id) { return nombreMiembro(estado, id); });
    if (ns.length <= 1) return ns[0] || '';
    return ns.slice(0, -1).join(', ') + t('conj_y') + ns[ns.length - 1];
  }

  // una nota tipada -> su frase. Devuelve null si no toca pintarla en ese ámbito.
  function fraseNota(estado, banco, n) {
    if (n.tipo === 'eliminar') {
      return n.miembro === '*'
        ? t('nota_hogar_sin').replace('{alimento}', nombreAlimento(banco, n.alimento_id))
        : t('nota_sin_para').replace('{nombre}', nombreMiembro(estado, n.miembro))
            .replace('{alimento}', nombreAlimento(banco, n.alimento_id).toLowerCase());
    }
    if (n.tipo === 'variante-todos')
      return t('nota_variante_todos').replace('{sustituto}', notaSustituto(banco, n.alimento_id, n.sustituto_id));
    if (n.tipo === 'vehiculo-persona')
      return t('nota_vehiculo').replace('{nombre}', nombreMiembro(estado, n.miembro))
        .replace('{sustituto}', notaSustituto(banco, n.alimento_id, n.sustituto_id));
    if (n.tipo === 'solo-para') {
      var e = elabDe(banco, n.elaboracion_id);
      return t('nota_solo_para').replace('{plato}', e ? e.nombre : n.elaboracion_id)
        .replace('{nombres}', unirNombres(estado, n.miembros));
    }
    if (n.tipo === 'sustituto') {
      var piezas = n.ambito === 'postre' ? [n.postre] : (n.plato || []);
      var nombres = piezas.filter(Boolean).map(function (p) { return nombrePercibido(banco, p, n.miembro); });
      return t('nota_sustituto').replace('{nombre}', nombreMiembro(estado, n.miembro))
        .replace('{plato}', nombres.join(' · '));
    }
    // `seguridad-infantil` cae aquí a propósito: el motor la sigue emitiendo y esta capa ya no
    // la pinta (ver renderNotasCard). Devolver null la deja fuera de cualquier lista de notas.
    return null;
  }

  // Bloque de notas bajo el plato: SOLO las notas de mesa (quién come qué y con qué cambio).
  // El aviso de seguridad infantil NO se pinta — decisión explícita de Roger (7-ago-2026,
  // reafirmada): «no pondré que no se coman los lápices de dibujar». El motor sigue emitiendo
  // las notas `seguridad-infantil`; es esta capa la que no las enseña. ⚠️ El funcional §2.5
  // todavía dice «se enseña siempre»: esa línea de la biblia tiene que cambiar con esto, y la
  // biblia no se toca desde aquí — reportado al jefe de obra en el cierre.
  var ORDEN_NOTAS = ['eliminar', 'variante-todos', 'vehiculo-persona', 'solo-para', 'sustituto'];
  function renderNotasCard(estado, banco, servicio, oscuro) {
    var resto = [];
    ORDEN_NOTAS.forEach(function (tipo) {
      notasDe(servicio, tipo).forEach(function (n) {
        var f = fraseNota(estado, banco, n);
        if (f) resto.push(f);
      });
    });
    if (!resto.length) return '';
    return '<div class="ph-notas' + (oscuro ? ' ph-notas-oscuro' : '') + '">' +
      '<p class="ph-notas-tit">' + t('notas_mesa') + '</p>' +
      '<ul class="ph-notas-lista">' +
      resto.map(function (txt) {
        return '<li class="ph-nota"><i data-lucide="dot"></i><span>' + escapeHtml(txt) + '</span></li>';
      }).join('') +
      '</ul></div>';
  }

  function estadoMesaBadge(estado, banco, mesa, servicio) {
    var familia = estado.familia || [];
    // «come otra cosa» = nota `sustituto` (exclusión estructural, §9.2). Es el TERCER estado del
    // handoff 5, que hasta ahora no rellenaba ningún motor: V6 sí lo emite.
    var otraSet = {}, otraNotaDe = {}, ajusteDe = {};
    notasDe(servicio, 'sustituto').forEach(function (n) { otraSet[n.miembro] = true; otraNotaDe[n.miembro] = n; });
    // «ajuste» = cualquier nota individual que cambie SU composición sin sacarlo de la mesa
    notasDe(servicio, 'vehiculo-persona').forEach(function (n) {
      ajusteDe[n.miembro] = notaSustituto(banco, n.alimento_id, n.sustituto_id);
    });
    notasDe(servicio, 'eliminar').forEach(function (n) {
      if (n.miembro && n.miembro !== '*' && !ajusteDe[n.miembro]) ajusteDe[n.miembro] = t('nota_sin_para')
        .replace('{nombre}', '').replace(': ', '').replace('{alimento}', nombreAlimento(banco, n.alimento_id).toLowerCase()).trim();
    });
    notasDe(servicio, 'solo-para').forEach(function (n) {
      var e = elabDe(banco, n.elaboracion_id);
      mesa.presentes.forEach(function (m) {
        if ((n.miembros || []).indexOf(m.id) === -1 && !ajusteDe[m.id] && e) ajusteDe[m.id] = t('estado_ajuste_con').replace('{ingrediente}', e.nombre.toLowerCase());
      });
    });

    // filtro defensivo: "otra" solo cuenta para quien también está en mesa.presentes — nunca
    // se deriva la ausencia de "otra", son campos independientes (aviso del handoff 5).
    var otraIds = Object.keys(otraSet).filter(function (id) {
      return mesa.presentes.some(function (p) { return p.id === id; });
    });

    // handoff 7, §2.2/§2.4: avatar/nombre/nota de la fila del desplegable, con el estado
    // "fuera" completo (opacidad de avatar, tachado de nombre, color de nota propio —
    // antes reusaba --muted, que no es el rgba(26,23,18,.38) literal del handoff).
    var personas = familia.map(function (m) {
      var idx = familia.indexOf(m);
      var presente = mesa.presentes.some(function (p) { return p.id === m.id; });
      // Fuera por PATRÓN ≠ fuera por ausencia puntual, y la diferencia no es cosmética: la
      // primera la fija el MOTOR en `semana.presencia` (patrón semanal, ausencias fijas, cole)
      // y `togglePresente` —que solo escribe `ausenciasPuntuales`— no la revierte. Tocar esa
      // fila sería un mando muerto, del mismo linaje que el «hoy no come» que estuvo sin hacer
      // nada en producción (app.js §togglePresente). Se distingue y se manda a su ficha.
      var porPatron = !mesa.miembrosDelSlot.some(function (x) { return x.id === m.id; });
      var distinto = presente && otraIds.indexOf(m.id) !== -1;
      var adapt = presente && !distinto ? ajusteDe[m.id] : null;
      var nota = porPatron ? t('estado_fila_por_patron')
        : !presente ? t('estado_fuera')
        : distinto ? t('estado_otra_nota')
        : adapt ? t('estado_ajuste_con').replace('{ingrediente}', String(adapt).toLowerCase())
        : t('estado_come_todo');
      return {
        id: m.id, fuera: !presente, porPatron: porPatron,
        avatarEstilo: avatarEstiloColor(m, colorMiembro(idx)), avatarTxt: avatarInner(m), nombre: m.nombre,
        dotEstilo: !presente ? 'background:rgba(26,23,18,.22)' : distinto ? 'background:' + ESTADO_BLOQUEO : 'background:' + (adapt ? ESTADO_TERRACOTA : ESTADO_OLIVA),
        notaEstilo: !presente ? 'color:rgba(26,23,18,.38)' : distinto ? 'color:oklch(0.5 0.14 35)' : adapt ? 'color:oklch(0.48 0.14 45)' : 'color:rgba(26,23,18,.45)',
        nota: nota
      };
    });
    var adaptaciones = Object.keys(ajusteDe).filter(function (id) {
      return mesa.presentes.some(function (p) { return p.id === id; }) && otraIds.indexOf(id) === -1;
    });
    // §2.3: nMain = comen el principal, nAlt = comen el alternativo — en TODAS las ramas,
    // el chip "para {n}" de cabecera del pop (§2.4) los necesita siempre.
    var nAlt = otraIds.length;
    var nMain = mesa.presentes.length - nAlt;

    if (otraIds.length) {
      var nombresOtra = familia.filter(function (m) { return otraSet[m.id]; })
        .map(function (m) { return m.nombre; }).join(t('conj_y'));
      // "se toma el de otra[0]" (04-datos.md): el plato mostrado es el de la primera
      // persona que come otra cosa, aunque el copy nombre a todos.
      var altNota = otraNotaDe[otraIds[0]];
      var altNombre = '';
      if (altNota) {
        var altPiezas = altNota.ambito === 'postre' ? [altNota.postre] : (altNota.plato || []);
        altNombre = altPiezas.filter(Boolean).map(function (p) { return nombrePercibido(banco, p, altNota.miembro); }).join(' · ');
      }
      return {
        clase: 'otra',
        label: (otraIds.length === 1 ? t('estado_otra_1') : t('estado_otra_n')).replace(/\{nombre(s)?\}/, nombresOtra),
        popTitulo: (otraIds.length === 1 ? t('estado_pop_otra_1') : t('estado_pop_otra_n')).replace(/\{nombre(s)?\}/, nombresOtra),
        popSub: t('estado_pop_otra_sub'), personas: personas, nMain: nMain, nAlt: nAlt, altNombre: altNombre
      };
    }

    var nAjustes = adaptaciones.length;
    if (nAjustes) {
      return {
        clase: 'terracota',
        label: nAjustes === 1 ? t('estado_1_ajuste') : t('estado_n_ajustes').replace('{n}', nAjustes),
        popTitulo: nAjustes === 1 ? t('estado_pop_1_ajuste') : t('estado_pop_n_ajustes').replace('{n}', nAjustes),
        popSub: t('estado_pop_ajuste_sub'), personas: personas, nMain: nMain, nAlt: 0
      };
    }
    // gris · nadie en casa (§2.3) — fuera del código semáforo a propósito: no es una
    // advertencia, es una ausencia. Antes el badge se ocultaba entero en este caso
    // (renderEstadoBadgeYPop cortaba con `!mesa.presentes.length`); el handoff exige
    // que se vea siempre, como cuarto estado.
    if (!mesa.presentes.length) {
      return {
        clase: 'gris', label: t('estado_nadie_casa'), popTitulo: t('estado_pop_nadie_casa'),
        popSub: t('estado_pop_nadie_sub'), personas: personas, nMain: 0, nAlt: 0
      };
    }
    var todos = familia.length > 0 && nMain === familia.length;
    return {
      clase: 'oliva',
      label: todos ? t('estado_comen_todos') : t('estado_comen_n').replace('{n}', nMain),
      // §2.7: "Comen los 3 sin cambios" — el 3 es el tamaño real de la familia, no un literal.
      popTitulo: todos ? t('estado_pop_todos').replace('{n}', familia.length) : t('estado_pop_n').replace('{n}', nMain),
      popSub: t('estado_pop_todos_sub'), personas: personas, nMain: nMain, nAlt: 0
    };
  }

  // esfuerzo real de la plantilla -> etiqueta corta (Q3, Roger 2026-07-19):
  // el banco no tiene un campo "tag" (Saludable/Rápido/Ligero...) del handoff;
  // se deriva del dato real que sí existe, en vez de inventar un dato nuevo.
  var ETIQUETA_ESFUERZO = { rapido: 'Rápido', medio: 'Equilibrado', elaborado: 'De calma' };

  // Card comida/cena del pager de Home — identidades opuestas a propósito
  // (Comida blanca/editorial, Cena oscura/cinematográfica) para que se
  // reconozcan sin leer la etiqueta. Handoff: e3Foods.dc.html.
  function renderCardPager(estado, banco, plan, diaIndex, meal, popupAbierto) {
    var servicio = servicioDe(plan, diaIndex, meal);
    var mesa = comensalesDeSlot(estado, plan, diaIndex, meal);
    var esCena = meal === 'cena';
    var claseCard = esCena ? 'ph-card ph-card-cena' : 'ph-card ph-card-comida';
    var icono = esCena ? ICONO_LUNA : ICONO_SOL;
    var etiqueta = t(esCena ? 'badge_cena' : 'badge_comida');
    // handoff 7, §02 (intro): el cluster de avatares sobre la foto queda sustituido por
    // el badge de estado — sigue vivo SOLO para el estado vacío (.ph-cab), que no tiene
    // badge de estado porque no hay servicio que resolver.
    var avataresHtml = avataresPager(estado, mesa, diaIndex, meal, esCena);
    var avataresSpan = avataresHtml ? '<span class="ph-avatares">' + avataresHtml + '</span>' : '';
    var badge = '<span class="ph-badge ph-badge-' + (esCena ? 'cena' : 'comida') + '"><span class="ph-badge-icono">' + icono + '</span><span class="ph-badge-texto">' + etiqueta + '</span></span>';
    var cabeceraVacia = '<div class="ph-cab"><span class="ph-tipo ph-tipo-' + (esCena ? 'cena' : 'comida') + '">' + icono + etiqueta + '</span>' + avataresSpan + '</div>';

    // V6: el servicio trae el plato de MESA (1-3 elaboraciones) + postre + notas tipadas. El
    // nombre que se enseña es el PERCIBIDO (`nombre_por_opcion`), no el nombre-plantilla del
    // banco: sin resolverlo la card decía «{pescado} a la plancha» (fila 6.2 de la lista).
    var itemPrincipal = principalDe(banco, servicio);
    var principal = itemPrincipal ? elabDe(banco, itemPrincipal.elaboracion_id) : null;
    // el postre lo GOBIERNA el motor (§6, política): si no hay, no se inventa uno
    var postreTexto = servicio && servicio.postre ? nombrePercibido(banco, servicio.postre, '*') : '';

    if (!mesa.miembrosDelSlot.length) {
      // ⚠️ EL BADGE NO DESAPARECE (Roger 7-ago-2026). Esta rama era un callejón sin salida y
      // está medido con un fixture (`presencia['3-cena'] = false` para todos): 0 badges,
      // 0 filas, 0 controles `toggle-presente` — la card decía «nadie come en casa» y no
      // había ni un solo mando para deshacerlo ni para saber de quién venía. Ahora se pinta
      // el badge con su desplegable: se ve quién está fuera, con qué motivo, y cada fila
      // lleva a su ficha, que es donde vive el patrón semanal que lo causó.
      var badgeVacio = estadoMesaBadge(estado, banco, mesa, servicio);
      badgeVacio.popSub = t('estado_pop_patron_sub'); // «tocando su nombre» aquí seria mentira
      return '<div class="' + claseCard + ' ph-card-vacia" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' + cabeceraVacia +
        '<p class="card-msg">' + escapeHtml(t(esCena ? 'nadie_come_noche' : 'nadie_come_mediodia')) + '</p>' +
        renderEstadoBadgeYPop(banco, diaIndex, meal, popupAbierto, badgeVacio) +
        '</div>';
    }
    if (!servicio || !principal) {
      // el hueco viene DECLARADO por el motor: `no_servido` o `fallo` de semana, nunca en
      // silencio (contrato `/2` §1). Se dice lo que el motor dijo, no una frase inventada.
      var motivo = servicio && servicio.no_servido === 'no-gobernado' ? 'Este servicio no lo planificamos.'
        : (plan && plan.fallo && plan.fallo.motivo) ? 'Esta semana no ha salido menú: ' + plan.fallo.motivo
        : 'No encontramos un plato que encaje con los gustos y las alergias de esta mesa.';
      return '<div class="' + claseCard + ' ph-card-vacia" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' + cabeceraVacia +
        '<p class="card-msg">' + escapeHtml(motivo) + '</p>' +
        '<button type="button" class="btn-secondary" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + meal + '">Elegir plato</button></div>';
    }

    var subtitulo = secundariasDe(banco, servicio).map(function (x) { return nombrePercibido(banco, x, '*'); }).join(' · ');
    var tag = ETIQUETA_ESFUERZO[principal.esfuerzo] || '';
    // El hueco vacío es TRANSITORIO y honesto, no un fallo de diseño: hoy solo 4 de las 140
    // elaboraciones traen `foto` (medido, no leído de un comentario: cargar el bundle y contar
    // `elaboraciones.filter(e => e.foto)`), así que ~97% de las cards enseñan el hueco. Roger
    // (4-ago-2026): «en breves días todas las fotos estarán disponibles» — cuando el banco las
    // traiga, esto se llena solo, sin tocar una línea. NO lo tapes con un placeholder ilustrado
    // ni escondas el hueco: el layout de la card está calibrado con la foto puesta y encogerlo
    // ahora obliga a recalibrarlo dos veces.
    var fotoHtml = principal.foto ? '<img class="ph-foto" src="' + escapeHtml(principal.foto) + '" alt="">' : '<div class="ph-foto ph-foto-vacia"></div>';

    // sin kcal en la card: la energía por comensal sale del derivador del motor, que llega con
    // la lista de la compra (§15.2, bloque 3). Se dice dónde falta, en la ficha de receta.
    var metaHtml = '<div class="ph-meta">' +
      '<span class="ph-meta-item"><i data-lucide="clock"></i>' + (principal.tiempo_min || '?') + ' min</span>' +
      (tag ? '<span class="ph-meta-punto"></span><span class="ph-meta-item"><i data-lucide="leaf"></i>' + tag + '</span>' : '') +
      '</div>';

    // handoff 7, §2.3: se calcula el estado UNA vez y se reparte a la tira de plato
    // alternativo (§1.6, dentro del botón) y al badge+desplegable (§2), en vez de
    // recomputarlo dos veces con datos que podrían desincronizarse entre sí.
    var estadoBadge = estadoMesaBadge(estado, banco, mesa, servicio);
    var altTiraHtml = estadoBadge.nAlt
      ? '<div class="ph-alt-tira"><div class="ph-alt-foto"></div><span class="ph-alt-info">' +
        '<span class="ph-alt-cab">' + escapeHtml(estadoBadge.label) + ' <span class="ph-alt-cuenta">· ' + escapeHtml(t('estado_pop_count').replace('{n}', estadoBadge.nAlt)) + '</span></span>' +
        '<span class="ph-alt-plato">' + escapeHtml(estadoBadge.altNombre || '') + '</span>' +
        '</span></div>'
      : '';

    // role="button" en un <div>, no un <button>: dentro va el avatar de cada
    // comensal, que SÍ es un <button> real (toggle-presente) — un <button> no
    // puede envolver a otro <button> (HTML inválido, el navegador lo rompe).
    // Mismo patrón que ya usa el dispatcher de teclado (ver app.js, keydown).
    return '<div class="' + claseCard + '" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' +
      '<div role="button" tabindex="0" class="ph-abrir" data-action="abrir-receta" data-dia="' + diaIndex + '" data-tipo="' + meal + '" aria-label="Ver receta completa">' +
      '<div class="ph-foto-wrap">' + fotoHtml + badge + '</div>' +
      '<div class="ph-info">' +
      '<p class="ph-titulo">' + escapeHtml(nombrePercibido(banco, itemPrincipal, '*')) + '</p>' +
      (subtitulo ? '<p class="ph-subtitulo">' + escapeHtml(subtitulo) + '</p>' : '') +
      metaHtml +
      (postreTexto ? '<p class="ph-postre">' + t('de_postre') + ' ' + escapeHtml(postreTexto) + '</p>' : '') +
      altTiraHtml +
      '</div>' +
      '</div>' +
      // Sin bloque «En esta mesa» en la card (Roger, 7-ago-2026: «elimina esta parte de la
      // card, esto no se ve»). La información NO se pierde ni se esconde: el badge de estado
      // sigue diciendo «Erik come otra cosa» justo encima, su desplegable lo detalla, y
      // `renderNotasCard` se sigue pintando entera en la ficha de receta (ui.js §rv-body).
      // ⚠️ Choca con el funcional §6.8 («la salida es UNA card: plato, variante de base y
      // notas por persona»). Decisión de Roger; la ley la ajusta el jefe de obra.
      renderEstadoBadgeYPop(banco, diaIndex, meal, popupAbierto, estadoBadge) +
      '<button type="button" class="ph-cta" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + meal + '"><i data-lucide="sparkles"></i>' + t('me_apetece_otra_cosa') + '<i data-lucide="arrow-right" class="ph-cta-flecha"></i></button>' +
      '</div>';
  }

  // Badge de estado ("Comen todos" / "N ajustes") + su desplegable — botón HERMANO de
  // .ph-abrir, no anidado dentro (handoff: "no hereda el clic que abre la receta").
  // handoff 7, §2.4/regla 4 del README: el desplegable NUNCA se monta/desmonta —
  // siempre está en el DOM, solo cambia de clase (.ph-estado-pop-abierto). Montarlo
  // condicionalmente (como hacía esta función antes) rompe la animación de entrada.
  // §2.6: badge y pop llevan data-whopop="1" para el cierre por toque fuera (app.js).
  function renderEstadoBadgeYPop(banco, diaIndex, meal, popupAbierto, e) {
    var abierta = !!popupAbierto;
    var badge = '<button type="button" class="ph-estado-badge ph-estado-badge-' + e.clase + '" data-whopop="1" ' +
      'data-action="estado-toggle" data-tipo="' + meal + '" aria-expanded="' + abierta + '" ' +
      'aria-label="' + escapeHtml(e.label) + '. ' + escapeHtml(t('estado_aria_detalle')) + '">' +
      '<span class="ph-estado-dot"></span>' +
      '<span class="ph-estado-texto">' + escapeHtml(e.label) + '</span>' +
      '<span class="ph-estado-flecha' + (abierta ? ' ph-estado-flecha-abierta' : '') + '">' + ICONO_CHEVRON_ESTADO + '</span>' +
      '</button>';
    // §2.5 NO NEGOCIABLE: cada fila es un botón que quita/retoma a esa persona de ESTA
    // comida de ESTE día — reutiliza togglePresente/ausenciasPuntuales, el mismo estado
    // de sesión por comida que ya usaba el avatar (ahora retirado de la foto, §02 intro).
    var filas = e.personas.map(function (p) {
      // quien está fuera por patrón no se retoma tocando: su fila lleva a la ficha, que es
      // donde SÍ se cambia. Ver la nota de `porPatron` en estadoMesaBadge.
      var accion = p.porPatron
        ? 'data-action="abrir-miembro-ficha" data-id="' + escapeHtml(p.id) + '"'
        : 'data-action="toggle-presente" data-dia="' + diaIndex + '" data-tipo="' + meal + '" data-miembro="' + escapeHtml(p.id) + '"';
      return '<button type="button" class="ph-estado-fila" ' + accion + '>' +
        '<span class="ph-avatar ph-estado-fila-av' + (p.fuera ? ' ph-estado-fila-av-fuera' : '') + '" ' + p.avatarEstilo + '>' + p.avatarTxt + '</span>' +
        '<span class="ph-estado-fila-info"><span class="ph-estado-fila-nombre' + (p.fuera ? ' ph-estado-fila-nombre-fuera' : '') + '">' + escapeHtml(p.nombre) + '</span>' +
        '<span class="ph-estado-fila-nota" style="' + p.notaEstilo + '">' + escapeHtml(p.nota) + '</span></span>' +
        '<span class="ph-estado-fila-dot" style="' + p.dotEstilo + '"></span>' +
        '</button>';
    }).join('');
    // tira de plato alternativo del pop (§2.4): misma info que la de la card (§1.6) pero
    // miniatura de 40px y con el chip de recuento a la derecha, no en línea con el título.
    var altPopHtml = e.nAlt
      ? '<div class="ph-alt-tira ph-alt-tira-pop"><div class="ph-alt-foto"></div><span class="ph-alt-info">' +
        '<span class="ph-alt-cab">' + escapeHtml(e.label) + '</span>' +
        '<span class="ph-alt-plato">' + escapeHtml(e.altNombre || '') + '</span>' +
        '</span><span class="ph-estado-pop-count">' + escapeHtml(t('estado_pop_count').replace('{n}', e.nAlt)) + '</span></div>'
      : '';
    var pop = '<div class="ph-estado-pop' + (abierta ? ' ph-estado-pop-abierto' : '') + '" data-whopop="1">' +
      '<div class="ph-estado-pop-cab">' +
      '<span class="ph-estado-pop-titsub">' +
      '<span class="ph-estado-pop-tit ph-estado-pop-tit-' + e.clase + '">' + escapeHtml(e.popTitulo) + '</span>' +
      '<span class="ph-estado-pop-sub">' + escapeHtml(e.popSub) + '</span>' +
      '</span>' +
      '<span class="ph-estado-pop-count">' + escapeHtml(t('estado_pop_count').replace('{n}', e.nMain)) + '</span>' +
      '</div>' +
      '<div class="ph-estado-pop-lista">' + filas + '</div>' +
      '<div class="ph-estado-pop-ayuda">' + escapeHtml(t(e.personas.every(function (p) { return p.porPatron; }) ? 'estado_pop_patron_ayuda' : 'estado_pop_ayuda')) + '</div>' +
      altPopHtml +
      '<span class="ph-estado-pop-flecha" aria-hidden="true"></span>' +
      '</div>';
    return badge + pop;
  }

  // Feedback loop (P1, 2026-07-16): "¿qué tal?" post-comida, un toque por slot
  // (fecha+tipoComida) — no se puede rellenar retroactivamente, así que solo se
  // ofrece para hoy o días ya pasados (no tiene sentido valorar una cena futura).
  var VALORACIONES = [
    { valor: 'gusta', emoji: '😍', get etiqueta() { return t('valoracion_gusta'); } },
    { valor: 'neutro', emoji: '🙂', get etiqueta() { return t('valoracion_neutro'); } },
    { valor: 'no-gusta', emoji: '😕', get etiqueta() { return t('valoracion_no_gusta'); } }
  ];

  function renderValoracion(estado, fecha, tipoComida) {
    if (fecha > hoyISO()) return ''; // no se valora un plato que aún no se ha comido
    var clave = fecha + '_' + tipoComida;
    var actual = (estado.valoraciones || {})[clave];
    var botones = VALORACIONES.map(function (v) {
      var activo = actual && actual.valor === v.valor;
      return '<button type="button" class="valoracion-btn' + (activo ? ' valoracion-btn-activo' : '') + '" ' +
        'data-action="valorar-plato" data-fecha="' + fecha + '" data-tipo="' + tipoComida + '" data-valor="' + v.valor + '" ' +
        'aria-pressed="' + !!activo + '" aria-label="' + escapeHtml(v.etiqueta) + '">' + v.emoji + '</button>';
    }).join('');
    return '<div class="valoracion-fila"><p class="detalle-subtitulo">' + t('que_tal_esta_comida') + '</p>' +
      '<div class="valoracion-botones">' + botones + '</div></div>';
  }

  // ---------------------------------------------------------------
  // Vista de receta — pantalla completa (Roger 2026-07-19, handoff Claude
  // Design: e3Foods.dc.html). Sustituye al sheet antiguo: mismos datos 100%
  // reales (ingredientes adaptados, pasos, mesa mixta, valoración), el
  // handoff solo aportó el envoltorio visual — nunca tuvo un botón "añadir a
  // la compra" real (la lista se deriva sola de la semana), así que el CTA
  // final lleva a Compra en vez de inventar una acción que no existe.
  // ---------------------------------------------------------------
  function avataresReceta(estado, mesa) {
    var familia = estado.familia || [];
    return mesa.miembrosDelSlot.map(function (m) {
      var idx = familia.indexOf(m);
      var estaPresente = mesa.presentes.some(function (p) { return p.id === m.id; });
      return '<span class="ph-avatar-wrap">' +
        '<span class="ph-avatar" ' + avatarEstiloColor(m, colorMiembro(idx)) + '>' + avatarInner(m) + '</span>' +
        (estaPresente ? '<span class="ph-avatar-check" aria-hidden="true"><i data-lucide="check"></i></span>' : '') +
        '</span>';
    }).join('');
  }

  function textoComensalesReceta(estado, mesa) {
    var nombres = mesa.presentes.map(function (p) { return p.nombre; });
    if (!nombres.length) return 'Nadie marcado hoy en esta comida.';
    if (nombres.length === (estado.familia || []).length) return t('le_gusta_a_toda_la_familia');
    return t('comen_prefijo') + nombres.join(', ') + '.';
  }

  function pasosCards(lista) {
    return lista.map(function (p, i) {
      return '<div class="rv-paso"><span class="rv-paso-num">' + (i + 1) + '</span><span class="rv-paso-texto">' + escapeHtml(p) + '</span></div>';
    }).join('');
  }

  // INGREDIENTES Y CALORÍAS DE LA FICHA DEL DÍA · §15.2 (§0.5: la cantidad de receta es la SUMA
  // de las cantidades personales, jamás ración estándar × comensales). Sale de
  // `cantidadesServicio`, que es la MISMA derivación que la lista de la compra: un solo
  // derivador. Las fracciones NO se pintan (son maquinaria, §0.5) — se pinta lo que se cocina.
  function renderIngredientesServicio(estado, banco, sup, plan, diaIndex, tipoComida) {
    if (!sup || !plan) return pendienteV6(t('v6_pend_ingredientes'), t('v6_pendiente_sub'));
    var slot = (diaIndex + 1) + '-' + tipoComida;
    // LA MESA REAL manda sobre la cantidad. Las ausencias PUNTUALES («hoy Enzo no come») son
    // estado de UI, no de la semana: sin esto la ficha enseñaba comida para cuatro con tres
    // avatares marcados. Es exactamente para lo que existe `reescalarServicio` (§15.4) — mismo
    // plato, mesa real, T3 recalcula. Solo se paga cuando la mesa DIFIERE de la semana.
    var mesa = comensalesDeSlot(estado, plan, diaIndex, tipoComida);
    var presentes = mesa.presentes.map(function (m) { return m.id; });
    var deLaSemana = (estado.familia || []).map(function (m) { return m.id; })
      .filter(function (id) { return plan.presencia && plan.presencia[id] && plan.presencia[id][slot] === true; });
    var planReal = plan;
    if (presentes.length !== deLaSemana.length) {
      var r = sup.reescalarServicio(plan, slot, presentes);
      if (r.ok) planReal = r.semana;
    }
    var c = sup.cantidadesServicio(planReal, slot);
    if (!c.ingredientes.length) return '<p class="card-msg">' + t('sin_comensales_hoy') + '</p>';
    // se reutilizan las clases que ya existen (`rv-ingrediente*`, `detalle-subtitulo`,
    // `rv-variantes`): CSS nuevo solo cuando no hay nada que sirva — UI_MOBILE §1.
    var fila = function (i) {
      var cant = i.unidades != null ? i.unidades + (i.unidades === 1 ? ' ud' : ' uds') : i.gramos + ' g';
      return '<li class="rv-ingrediente"><span class="rv-ingrediente-bullet" aria-hidden="true"></span>' +
        '<span class="rv-ingrediente-nombre">' + escapeHtml(i.nombre) + '</span>' +
        '<span class="rv-ingrediente-g">' + escapeHtml(cant) + '</span></li>';
    };
    // por ELABORACIÓN cuando hay más de una (el plato de mesa son 1-3 piezas + postre + los
    // platos sustituto de la mesa mixta): una lista plana no dice qué va en qué cazuela, y los
    // pasos de abajo ya vienen separados igual. Con una sola, lista plana y sin ruido.
    var filas = c.por_elaboracion.length > 1
      ? c.por_elaboracion.map(function (p) {
        // el PERCIBIDO, con la opción de mesa ya resuelta — nunca el nombre-plantilla del banco
        return '<li class="rv-ingrediente"><span class="detalle-subtitulo">' +
          escapeHtml(nombrePercibido(banco, p.pieza, '*')) + '</span></li>' +
          p.ingredientes.map(fila).join('');
      }).join('')
      : c.ingredientes.map(fila).join('');
    // kcal POR COMENSAL: el número que la familia entiende. Sale del mismo derivador, con la
    // composición individual real de cada uno (su plato, sus notas, su cantidad).
    var kcal = c.comensales.map(function (x) {
      return '<div class="rv-stat"><span class="rv-stat-valor">' + x.kcal + ' kcal</span>' +
        '<span class="rc-fila-meta">' + escapeHtml(nombreMiembro(estado, x.miembro)) + '</span></div>';
    }).join('');
    return '<ul class="rv-ingredientes">' + filas + '</ul>' +
      (kcal ? '<div class="rv-stats rv-stats-kcal">' + kcal + '</div>' : '');
  }

  function renderVistaReceta(estado, banco, plan, diaIndex, tipoComida, sup) {
    var servicio = servicioDe(plan, diaIndex, tipoComida);
    var itemPrincipal = principalDe(banco, servicio);
    var principal = itemPrincipal ? elabDe(banco, itemPrincipal.elaboracion_id) : null;
    if (!servicio || !principal) {
      return '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos esta receta.</p></div>';
    }
    var mesa = comensalesDeSlot(estado, plan, diaIndex, tipoComida);
    var fecha = fechaDelDia(plan, diaIndex);
    var esCena = tipoComida === 'cena';
    var tag = ETIQUETA_ESFUERZO[principal.esfuerzo] || '—';
    var favorita = (estado.favoritas || []).indexOf(principal.id) !== -1;
    var oculta = (estado.ocultas || []).indexOf(principal.id) !== -1;
    var fotoHtml = principal.foto ? '<img src="' + escapeHtml(principal.foto) + '" alt="">' : '<div class="rv-foto-vacia"></div>';

    // Ingredientes en gramos y kcal por comensal: del ÚNICO derivador del motor
    // (`src/derivar.js`, §15: prohibida una segunda derivación), vía `cantidadesServicio`.
    var ingredientesHtml = renderIngredientesServicio(estado, banco, sup, plan, diaIndex, tipoComida);

    // El plato de mesa son 1-3 elaboraciones y cada una trae SUS pasos: el principal primero,
    // las secundarias detrás con su propio título (ya no un único bloque "X con Y y Z").
    var pasosHtml = (principal.pasos || []).length
      ? '<div class="rv-pasos">' + pasosCards(principal.pasos) + '</div>'
      : '<p class="card-msg">Sin pasos detallados para esta receta.</p>';
    var complementariasHtml = secundariasDe(banco, servicio).map(function (x) {
      var e = elabDe(banco, x.elaboracion_id);
      if (!e || !(e.pasos || []).length) return '';
      return '<p class="detalle-subtitulo" style="margin-top:18px">' + escapeHtml(nombrePercibido(banco, x, '*')) + '</p>' +
        '<div class="rv-pasos">' + pasosCards(e.pasos) + '</div>';
    }).join('');

    // Mesa mixta (foso #1 del producto): quien come SU plato por exclusión estructural trae
    // su propia receta — nota `sustituto` de §9.2. Sus pasos van aparte, como los del resto.
    var pasosAdaptadosHtml = notasDe(servicio, 'sustituto').map(function (n) {
      var piezas = n.ambito === 'postre' ? [n.postre] : (n.plato || []);
      return piezas.filter(Boolean).map(function (p) {
        var e = elabDe(banco, p.elaboracion_id);
        if (!e || !(e.pasos || []).length) return '';
        return '<p class="detalle-subtitulo" style="margin-top:18px">Para ' + escapeHtml(nombreMiembro(estado, n.miembro)) +
          ' (' + escapeHtml(nombrePercibido(banco, p, n.miembro)) + ')</p>' +
          '<div class="rv-pasos">' + pasosCards(e.pasos) + '</div>';
      }).join('');
    }).join('');

    var postreHtml = servicio.postre
      ? '<p class="detalle-subtitulo" style="margin-top:18px">' + t('de_postre') + ' ' + escapeHtml(nombrePercibido(banco, servicio.postre, '*')) + '</p>'
      : '';

    return '<div class="rv-hero">' + fotoHtml + '<div class="rv-hero-gradiente"></div>' +
      '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
      '<div class="rv-acciones">' +
      '<button type="button" class="rv-flotante' + (oculta ? ' rv-flotante-activo' : '') + '" data-action="toggle-oculta-receta" data-plantilla="' + principal.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '" aria-pressed="' + oculta + '"><i data-lucide="eye-off"></i></button>' +
      '<button type="button" class="rv-flotante' + (favorita ? ' rv-flotante-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + principal.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '</div></div>' +
      '<div class="rv-body">' +
      '<span class="rv-pill rv-pill-' + (esCena ? 'cena' : 'comida') + '">' + (esCena ? ICONO_LUNA : ICONO_SOL) + t(esCena ? 'badge_cena' : 'badge_comida') + '</span>' +
      '<h1 class="rv-titulo">' + escapeHtml(nombrePercibido(banco, itemPrincipal, '*')) + '</h1>' +
      (secundariasDe(banco, servicio).length ? '<p class="rv-subtitulo">' + escapeHtml(secundariasDe(banco, servicio).map(function (x) { return nombrePercibido(banco, x, '*'); }).join(' · ')) + '</p>' : '') +
      '<div class="rv-stats">' +
      '<div class="rv-stat"><i data-lucide="clock"></i><span class="rv-stat-valor">' + (principal.tiempo_min || '?') + ' min</span></div>' +
      '<div class="rv-stat"><i data-lucide="leaf"></i><span class="rv-stat-valor">' + tag + '</span></div>' +
      '</div>' +
      (mesa.miembrosDelSlot.length ? '<div class="rv-comensales"><span class="ph-avatares">' + avataresReceta(estado, mesa) + '</span><span class="rv-comensales-texto">' + escapeHtml(textoComensalesReceta(estado, mesa)) + '</span></div>' : '') +
      renderNotasCard(estado, banco, servicio, false) +
      '<p class="rv-seccion-titulo">' + t('ingredientes') + '</p>' +
      ingredientesHtml +
      '<p class="rv-seccion-titulo">' + t('preparacion') + '</p>' +
      pasosHtml +
      complementariasHtml +
      pasosAdaptadosHtml +
      postreHtml +
      (fecha ? renderValoracion(estado, fecha, tipoComida) : '') +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Cabecera clara de SEMANA — app-bar + saludo + card IA (Roger 2026-07-14,
  // referencia visual externa ~/Downloads/design_handoff_e3foods_redesign/).
  // Sustituye a renderCabecera() (oscura) SOLO en SEMANA; RECETAS/COMPRA
  // siguen con la cabecera-midnight sin cambios.
  // ---------------------------------------------------------------
  function renderAppBar() {
    // Campana REAL (obra auth+push §6.6): con push soportado (VAPID presente + navegador
    // capaz o iOS sin instalar, que tiene su pantallita) abre el sheet de avisos; si no,
    // OCULTA — mejor que decorativa (cierra la afordance falsa señalada en higiene §5.5).
    var conCampana = window.E3Push && (window.E3Push.soportado() || window.E3Push.esIosSinInstalar());
    return '<header class="app-bar">' +
      '<button type="button" class="app-bar-btn" data-action="abrir-menu-hamburguesa" aria-label="Menú"><i data-lucide="menu"></i></button>' +
      '<p class="app-bar-logo"><span class="app-bar-logo-e3">e3</span><span class="app-bar-logo-foods">foods</span></p>' +
      (conCampana
        ? '<button type="button" class="app-bar-btn app-bar-campana" data-action="campana" aria-label="Notificaciones"><i data-lucide="bell"></i><span class="app-bar-campana-dot" aria-hidden="true"></span></button>'
        : '<span class="app-bar-btn" aria-hidden="true"></span>') +
      '</header>';
  }

  // Sheet de la campana (§6.6): estados activar / iOS-sin-instalar / denegado / activadas.
  function renderSheetCampana(estadoCampana, opts) {
    opts = opts || {};
    var cuerpo;
    if (estadoCampana === 'ios') cuerpo = '<p class="card-msg">' + t('campana_ios') + '</p>';
    else if (estadoCampana === 'denegado') cuerpo = '<p class="card-msg">' + t('campana_denegado') + '</p>';
    else if (estadoCampana === 'activadas') {
      cuerpo = '<p class="card-msg">' + t('campana_activadas') + '</p>' +
        '<button type="button" class="btn-secondary btn-icono-texto" data-action="campana-familia-off"><i data-lucide="bell-off"></i>' + t('campana_familia_off') + '</button>' +
        '<button type="button" class="btn-secondary btn-icono-texto" data-action="campana-familia-on"><i data-lucide="bell-ring"></i>' + t('campana_familia_on') + '</button>';
    } else {
      cuerpo = '<p class="card-msg">' + t('campana_texto') + '</p>' +
        '<button type="button" class="btn-cta-gradiente" data-action="campana-activar">' + t('campana_cta') + '</button>';
    }
    return sheetHead(t('campana_titulo')) + '<div class="sheet-body">' +
      cuerpo +
      (opts.aviso ? '<p class="card-msg">' + escapeHtml(opts.aviso) + '</p>' : '') +
      '</div>';
  }

  // Saludo + card IA: siempre sobre HOY, independiente del día que esté
  // seleccionado en las píldoras (esas son para ojear la semana, no para
  // redefinir qué es "hoy"). Ingrediente que falta = clicable → COMPRA/hoy
  // (Roger 2026-07-14: reutiliza la vista existente, sin pieza nueva de estado).

  // Aviso de equilibrio (Roger 2026-07-17, reubicado 2026-07-19 al pie de la
  // Home nueva): SOLO si una cuota real no está cumplida esta semana — nunca
  // un swap inventado. Línea discreta + link al informe completo — decisión
  // del council del 18/19-jul: "respuesta del día primero, informe como
  // línea al final", no un bloque de chips en el cuerpo principal.
  // ⚑ SIGUE MARCADO A PROPÓSITO, y ahora con la razón MEDIDA (bloque 3, 3-ago). §15 no define
  // ninguna función de equilibrio: el recuento de cuotas es del motor (T1/T2/T4) y hoy sus dos
  // varas NO COINCIDEN — T1 reserva en SERVICIOS y T2 acumula en RACIONES (fila 5.4 de la lista).
  // Medido en la semana real de `omnivora-2a2n`: 7,9 «raciones» de huevo para un adulto contra un
  // techo de 4 tomas. Pintar hoy un semáforo de equilibrio sería enseñar a la familia un número
  // que el propio motor no usa para decidir — el patrón de bug nº1 del proyecto, en pantalla.
  // Se conecta cuando 5.4 cierre el contrato. Mientras tanto, la línea se queda AHÍ, marcada.
  function renderAvisoEquilibrio(plan, banco, estado) {
    return '<button type="button" class="ph-equilibrio-link ph-equilibrio-pendiente" data-action="abrir-resumen-semana">' +
      '<i data-lucide="hard-hat"></i><span>' + escapeHtml(t('v6_pend_equilibrio') + ' · ' + t('v6_pendiente_badge')) + '</span>' +
      '<i data-lucide="chevron-right"></i></button>';
  }

  // ---------------------------------------------------------------
  // HOME (Roger 2026-07-19, handoff Claude Design e3Foods.dc.html) — sustituye
  // Foco + vista clásica por UNA sola pantalla: saludo, tira continua de 14
  // días (vigente + siguiente concatenados), banner de despensa+cole, pager
  // swipeable comida/cena, card de importar cole, próximos días, equilibrio
  // como línea discreta al pie (decisión del council: respuesta primero,
  // informe después). Todo dato real: la semana `/2` que devuelve `generarCorrida` — nada
  // de la maqueta de Claude Design (esa usaba 3 platos fijos de mentira).
  // ---------------------------------------------------------------
  function renderHome(estado, banco, diaGlobalSel, pagerIdx, miembroDispositivoId, estadoBadgeAbierto, sup) {
    if (!estado.plan) {
      return renderAppBar() + '<div class="vista-body">' +
        (avisoErrorMotor(estado) || '<p class="card-msg">' + t('todavia_no_hay_semana_generada') + '</p>') + '</div>';
    }
    // La tira de 14 días son las DOS semanas `/2` concatenadas. La semana no guarda fechas
    // (solo `semana_iso`): se derivan con `derivar.fechaDia`, la definición ejecutable.
    var plan14 = [];
    [estado.plan, estado.planSiguiente].forEach(function (pl) {
      if (!pl || !pl.semana_iso) return;
      for (var d = 0; d < 7; d++) plan14.push({ fecha: fechaDeDia(pl.semana_iso, d + 1), plan: pl, diaLocal: d });
    });
    var hoyStr = hoyISO();
    var hoyIdxGlobal = -1;
    for (var gi = 0; gi < plan14.length; gi++) { if (plan14[gi].fecha === hoyStr) { hoyIdxGlobal = gi; break; } }
    var idx = (diaGlobalSel != null && plan14[diaGlobalSel]) ? diaGlobalSel : (hoyIdxGlobal !== -1 ? hoyIdxGlobal : 0);
    var diaObj = plan14[idx] || plan14[0];
    var planDia = diaObj.plan;
    var diaLocal = diaObj.diaLocal;
    var esHoy = idx === hoyIdxGlobal;

    // ---- saludo ----
    var familia = estado.familia || [];
    var miembroDispositivo = miembroDispositivoId && familia.filter(function (m) { return m.id === miembroDispositivoId; })[0];
    var nombre = (miembroDispositivo || familia[0] || {}).nombre || '';
    var fd = I18N.diasMinuscula();
    var subtitulo = esHoy ? t('subtitulo_hoy') : (t('subtitulo_prefijo_dia') + fd[diaLocal] + t('subtitulo_sufijo_dia'));
    // subtítulo tocable = segunda vía de vuelta a hoy, sin añadir nada a la pantalla —
    // solo cuando estás fuera de hoy (Roger 2026-07-26, refuerzo del chip, no lo sustituye)
    var subAttrs = esHoy ? '' : ' data-action="volver-a-hoy" tabindex="0" role="button"';
    var saludoHtml = '<section class="ph-saludo">' +
      '<h1 class="ph-saludo-titulo">' + escapeHtml(saludoHora() + (nombre ? ', ' + nombre : '') + '.') + '</h1>' +
      '<p class="ph-saludo-sub' + (esHoy ? '' : ' ph-saludo-sub-link') + '"' + subAttrs + '>' + escapeHtml(subtitulo) + '</p>' +
      '</section>';

    // ---- tira de 14 días ----
    var diasHtml = plan14.map(function (dia, i) {
      var d = new Date(dia.fecha + 'T00:00:00');
      var tieneCole = !!(estado.cole && estado.cole.dias && estado.cole.dias[dia.fecha]);
      var clases = 'ph-dia' + (i === idx ? ' ph-dia-activo' : '') + (i === hoyIdxGlobal ? ' ph-dia-hoy' : '');
      return '<button type="button" class="' + clases + '" data-action="semana-elegir-dia" data-dia-global="' + i + '" aria-pressed="' + (i === idx) + '">' +
        '<span class="ph-dia-letra">' + I18N.diasInicial()[i % 7] + '</span>' +
        '<span class="ph-dia-num">' + d.getDate() + '</span>' +
        // El hueco del birrete se reserva SIEMPRE (placeholder vacío sin cole) para que todos los
        // días tengan la misma altura y el número quede a la misma línea, haya cole o no (Roger 21-jul).
        (tieneCole ? '<i data-lucide="graduation-cap" class="ph-dia-cole"></i>' : '<span class="ph-dia-cole ph-dia-cole-vacio" aria-hidden="true"></span>') +
        '</button>';
    }).join('');
    // chip "Hoy": solo existe fuera de hoy, ancla en el lado donde está hoy real
    // (izquierda si hoy quedó antes que el día elegido, derecha si es al revés) —
    // columna propia FUERA del scroller, nunca overlay (tapa un día, ya descartado)
    var chipHtml = '';
    if (!esHoy && hoyIdxGlobal !== -1) {
      // el nombre del icono no puede depender del estado (lucide.createIcons() lo
      // congela en el primer pintado) — icono fijo chevron-left + rotate 180deg
      // cuando toca apuntar a la derecha, único sitio de la app con este patrón
      var chipRotado = hoyIdxGlobal >= idx;
      chipHtml = '<button type="button" class="ph-hoy-chip" data-action="volver-a-hoy" aria-label="Volver a hoy">' +
        '<span class="ph-dia-letra">HOY</span>' +
        '<i data-lucide="chevron-left" class="ph-dia-num"' + (chipRotado ? ' style="transform: rotate(180deg)"' : '') + '></i>' +
        '</button>';
    }
    var tiraHtml = '<div class="ph-tira-fila">' + chipHtml + '<div class="ph-tira-wrap scroll">' + diasHtml + '</div></div>';

    // ---- banner del día: cole + compra, UNA sola caja (Roger 7-ago) ----
    // La línea del cole la aplica el motor vía `presencia`. La de la compra sale de la MISMA
    // `listaCompra` (§15.2) que pinta la pantalla de Compra y de los MISMOS `compra.marcados`:
    // el banner y la lista no pueden decir números distintos (§4.6.3).
    var minors = familia.filter(function (m) { return edadEnAnios(m.anioNacimiento) < EDAD_MENOR; });
    var coleDiaObj = estado.cole && estado.cole.dias && estado.cole.dias[diaObj.fecha];
    var coleTextoHtml = '';
    if (coleDiaObj && minors.length) {
      var nombresMinors = minors.map(function (m) { return m.nombre; });
      var juntos = nombresMinors.length <= 1 ? (nombresMinors[0] || '') : nombresMinors.slice(0, -1).join(', ') + t('conj_y') + nombresMinors[nombresMinors.length - 1];
      // plantilla por idioma (el orden de "hoy" cambia entre lenguas) — sesion higiene 30-jul
      coleTextoHtml = t(nombresMinors.length > 1 ? 'cole_frase_plur' : 'cole_frase_sing')
        .replace('{n}', escapeHtml(juntos))
        .replace('{hoy}', esHoy ? t('cole_hoy') : '')
        .replace('{cole}', '<button type="button" class="ingrediente-link" data-action="ir-cole">' + t('cole') + '</button>');
    }
    // Solo para días de la semana VIGENTE: la pantalla de Compra pinta `estado.plan` y los
    // checks viven en `compra.marcados`. Para la semana siguiente no hay número que no sea
    // inventado, así que no se dice nada — antes que una cifra que el motor no usó (§4.6.3).
    var compraTextoHtml = '';
    var compraTodoListo = false;
    if (sup && planDia === estado.plan) {
      var lista = sup.listaCompra(planDia, { dia: diaLocal + 1, soloCena: esHoy && new Date().getHours() >= 16 }) || [];
      var marcadosCompra = {};
      ((estado.compra && estado.compra.marcados) || []).forEach(function (id) { marcadosCompra[id] = 1; });
      // la despensa («¿lo tengo en casa?») es recordatorio, no compra — igual que en el aviso
      // del barrido (app.js, `pendientesDeLista`): las dos cuentas tienen que coincidir
      var pendientes = lista.filter(function (it) { return !it.despensa && !marcadosCompra[it.id]; }).length;
      compraTodoListo = pendientes === 0;
      compraTextoHtml = pendientes
        ? escapeHtml(String(pendientes)) + escapeHtml(t(pendientes === 1 ? 'pantry_en_tu_lista_sing' : 'pantry_en_tu_lista_plur')) +
          '<button type="button" class="ingrediente-link" data-action="ir-compra-hoy">' + escapeHtml(t('revisala')) + '</button>' +
          escapeHtml(t('pantry_antes_de_cocinar'))
        : escapeHtml(t('pantry_todo_listo'));
    }

    var lineaPantry = function (icono, textoHtml, ok) {
      return '<div class="ph-pantry-linea' + (ok ? ' ph-pantry-linea-ok' : '') + '">' +
        '<span class="ph-pantry-icono"><i data-lucide="' + icono + '"></i></span>' +
        '<p class="ph-pantry-texto">' + textoHtml + '</p></div>';
    };
    var pantryLineas =
      (coleTextoHtml ? lineaPantry('graduation-cap', coleTextoHtml, false) : '') +
      (compraTextoHtml ? lineaPantry(compraTodoListo ? 'check' : 'shopping-basket', compraTextoHtml, compraTodoListo) : '');
    var pantryHtml = pantryLineas ? '<div class="ph-pantry">' + pantryLineas + '</div>' : '';

    // ---- pager comida/cena ----
    var pagerHtml = '<div id="home-pager" class="ph-pager-scroll scroll">' +
      '<div class="ph-pager-slide">' + renderCardPager(estado, banco, planDia, diaLocal, 'comida', estadoBadgeAbierto === 'comida') + '</div>' +
      '<div class="ph-pager-slide">' + renderCardPager(estado, banco, planDia, diaLocal, 'cena', estadoBadgeAbierto === 'cena') + '</div>' +
      '</div>';
    var segHtml = '<div class="ph-seg">' +
      '<button type="button" id="pager-seg-comida" class="ph-seg-btn' + (pagerIdx === 0 ? ' pager-seg-activo' : '') + '" data-action="pager-ir" data-pager="0"><i data-lucide="sun"></i>' + t('boton_comida') + '</button>' +
      '<button type="button" id="pager-seg-cena" class="ph-seg-btn' + (pagerIdx === 1 ? ' pager-seg-activo' : '') + '" data-action="pager-ir" data-pager="1"><i data-lucide="moon"></i>' + t('boton_cena') + '</button>' +
      '</div>';

    // ---- subir menú del cole ----
    // Lo que HOY hace de verdad: los peques no comen en casa ese mediodía (presencia). Lo que
    // todavía no: que la cena no repita lo del cole y que sus tomas cuenten en la semana
    // (§2-ter) — eso necesita `menu_cole` con ids de elaboración, o sea el parser (UPGRADES P1).
    var tieneCargado = !!(estado.cole && estado.cole.dias && Object.keys(estado.cole.dias).length);
    var coleCardHtml = '<button type="button" class="ph-cole-card" data-action="menu-importar-cole">' +
      '<span class="ph-cole-icono"><i data-lucide="paperclip"></i></span>' +
      '<span class="ph-cole-texto"><span class="ph-cole-titulo">' + (tieneCargado ? 'Actualizar menú del cole' : t('subir_menu_del_cole')) + '</span>' +
      '<span class="ph-cole-sub">' + escapeHtml(t('v6_pend_cole') + ' · ' + t('v6_pendiente_badge')) + '</span></span>' +
      '<i data-lucide="upload" class="ph-cole-flecha"></i></button>';

    // ---- próximos días (7, tras hoy real) ----
    var inicioProximos = (hoyIdxGlobal !== -1 ? hoyIdxGlobal : idx) + 1;
    var proximosItems = '';
    for (var p = inicioProximos; p < Math.min(inicioProximos + 7, plan14.length); p++) {
      var pd = plan14[p];
      var pLocal = pd.diaLocal;
      var pComidaNombre = nombreCortoSlot(banco, pd.plan, pd.diaLocal, 'comida');
      var pCenaNombre = nombreCortoSlot(banco, pd.plan, pd.diaLocal, 'cena');
      var pColeDia = estado.cole && estado.cole.dias && estado.cole.dias[pd.fecha];
      var pFotoPl = null; // el banco V6 todavía no lleva fotos de elaboración (0 de 140)
      proximosItems += '<div class="ph-proximo">' +
        '<div class="ph-proximo-fecha"><span>' + NOMBRES_DIA_CORTO()[pLocal].toUpperCase() + '</span><b>' + new Date(pd.fecha + 'T00:00:00').getDate() + '</b></div>' +
        '<div class="ph-proximo-info">' +
        (pColeDia && pColeDia.resumen ? '<button type="button" class="ph-proximo-linea ph-proximo-cole" data-action="ir-cole"><i data-lucide="graduation-cap"></i><span>' + escapeHtml(pColeDia.resumen) + '</span></button>' : '') +
        '<button type="button" class="ph-proximo-linea" data-action="abrir-receta" data-dia="' + pLocal + '" data-tipo="comida" data-dia-global="' + p + '"><i data-lucide="sun"></i><span>' + escapeHtml(pComidaNombre) + '</span></button>' +
        '<button type="button" class="ph-proximo-linea ph-proximo-cena" data-action="abrir-receta" data-dia="' + pLocal + '" data-tipo="cena" data-dia-global="' + p + '"><i data-lucide="moon"></i><span>' + escapeHtml(pCenaNombre) + '</span></button>' +
        '</div>' +
        (pFotoPl && pFotoPl.foto ? '<img class="ph-proximo-foto" src="' + escapeHtml(pFotoPl.foto) + '" alt="" loading="lazy" decoding="async">' : '') +
        '</div>';
    }
    var proximosHtml = proximosItems
      ? '<section class="ph-proximos"><p class="ph-proximos-titulo">' + t('proximos_dias') + '</p><div class="ph-proximos-lista">' + proximosItems + '</div></section>'
      : '';

    return renderAppBar() +
      '<div class="vista-body ph-body">' +
      saludoHtml + tiraHtml + pantryHtml + pagerHtml + segHtml + coleCardHtml + proximosHtml +
      renderAvisoEquilibrio(estado.plan, banco, estado) +
      renderLinkGastoSemanal() +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Sheet: resumen semanal — índice de equilibrio (semáforo de cuotas, dato que
  // el motor ya computa) + semana de un vistazo. Pedido convergente en la
  // valoración externa de producto (2026-07-16); el pill de arriba ya estaba
  // pintado sin acción — esta es esa acción.
  // ---------------------------------------------------------------
  // nombre corto del plato de un slot para la vista de un vistazo — el PERCIBIDO, con la
  // opción de eje ya resuelta. Sin plato, el motor dice por qué (`no_servido` / `fallo`).
  function nombreCortoSlot(banco, plan, diaIndex, tipoComida) {
    var sv = servicioDe(plan, diaIndex, tipoComida);
    if (!sv || !sv.plato) return sv && sv.no_servido === 'no-gobernado' ? 'No lo planificamos' : 'Sin plan';
    var p = principalDe(banco, sv);
    return p ? nombrePercibido(banco, p, '*') : 'Sin plan';
  }

  function renderResumenDia(banco, plan, diaIndex, hoyFecha) {
    var fecha = fechaDelDia(plan, diaIndex);
    return '<div class="resumen-semana-dia">' +
      '<p class="resumen-semana-fecha">' + NOMBRES_DIA()[diaIndex] + ' ' + fechaCorta(fecha) + (fecha === hoyFecha ? ' <span class="badge badge-hoy">HOY</span>' : '') + '</p>' +
      '<p class="resumen-semana-plato"><span class="resumen-semana-ico">' + ICONO_SOL + '</span>' + escapeHtml(nombreCortoSlot(banco, plan, diaIndex, 'comida')) + '</p>' +
      '<p class="resumen-semana-plato"><span class="resumen-semana-ico">' + ICONO_LUNA + '</span>' + escapeHtml(nombreCortoSlot(banco, plan, diaIndex, 'cena')) + '</p>' +
      '</div>';
  }

  function renderSheetResumenSemana(estado, banco, plan) {
    if (!plan) return sheetHead('Resumen de la semana') + '<div class="sheet-body">' +
      (avisoErrorMotor(estado) || '<p class="card-msg">' + t('todavia_no_hay_semana_generada') + '</p>') + '</div>';
    var hoyFecha = hoyISO();
    var dias = [0, 1, 2, 3, 4, 5, 6].map(function (i) { return renderResumenDia(banco, plan, i, hoyFecha); }).join('');
    // Relajaciones y descargos de la semana: el motor los DECLARA (`/2` §3) y hasta hoy no los
    // leía nadie. Son la frase honesta de qué cedió y por qué — se enseñan tal cual llegan.
    var frases = [];
    (plan.servicios || []).forEach(function (sv) {
      (sv.relajaciones || []).forEach(function (r) { if (r.frase && frases.indexOf(r.frase) === -1) frases.push(r.frase); });
    });
    var falloHtml = plan.fallo ? '<p class="card-msg"><strong>Esta semana no ha salido menú.</strong> ' + escapeHtml(plan.fallo.motivo) + '</p>' : '';
    var frasesHtml = frases.length
      ? '<p class="detalle-subtitulo">Lo que hemos tenido que ceder</p><ul class="equilibrio-lista">' +
        frases.map(function (f) { return '<li class="equilibrio-fila"><span class="equilibrio-etiqueta">' + escapeHtml(f) + '</span></li>'; }).join('') + '</ul>'
      : '';
    return sheetHead('Resumen de la semana') +
      '<div class="sheet-body">' +
      falloHtml +
      pendienteV6(t('v6_pend_equilibrio'), t('v6_pendiente_sub')) +
      frasesHtml +
      '<div class="resumen-semana-lista">' + dias + '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // HANDOFF 7 · §03 — Gasto semanal. Pieza NUEVA (no existía antes de este handoff).
  //
  // SIN FUENTE DE COSTE REAL — comprobado 2026-08-04:
  //   grep -n "coste\|precio\|euro" motor_v6/src/superficie.js   ->  0 resultados
  //   costes.js del motor es costeS(señales, config): el SCORING interno de blandas
  //     (§13.4), no dinero — nunca produce un precio para mostrar.
  //   El banco solo trae `coste_banda` (barato/medio/caro) en alimentos.js, jamás un
  //     precio en euros.
  // El funcional ya lo declara pendiente (§16.6: "La pantalla existe en el frontend y
  // está pendiente de dato") y fija cómo tratarlo (§16.7: precio de mercado, por
  // barrido semanal en lote — nunca inventado ni calculado a mano). Regla del método:
  // "datos: fuente verificable o no se mete" + condición 7 ("nada pendiente se oculta,
  // se deja visible y marcado pendiente"). Por eso esta hoja se pinta ENTERA y
  // pixel-exacta al handoff, con cada cifra sustituida por un guion en vez de omitirse.
  //
  // gastoSemanalMecanica() es la mecánica NO NEGOCIABLE del §3.4 (altura de barra
  // relativa al MÁXIMO de la semana, nunca a un techo fijo) ya escrita y probada con el
  // fixture del propio handoff (04-datos.md) en tests/cargar_app.js — lista para
  // conectarse el día que exista una fuente de precio real, sin tocar esta función.
  //
  // ⚠️ NO LA BORRES: hoy NO TIENE INVOCADOR y eso es DELIBERADO — dictado de Roger
  // (4-ago-2026): «el gasto existirá y se conectará donde lo dejó preparado».
  // **Esto NO es una excepción a la regla: ES la regla vigente.** Roger la cambió ese
  // mismo día — «función sin invocador → mensaje en el front de "aún no disponible"»,
  // en sustitución de la antigua «función sin invocador = función que no existe», que
  // llevaba a borrar trabajo ya pagado. Lo que valida este enchufe es que la hoja de
  // Gasto semanal se pinta ENTERA y marcada pendiente (funcional 4.12 y 16.6): lo
  // prohibido es el enchufe MUDO, sin pantalla que lo anuncie.
  // Quien conecte el coste: llamar a esta función con los días reales y quitar el
  // estado «pendiente» de renderSheetGastoSemanal().
  // ---------------------------------------------------------------
  function gastoSemanalMecanica(dias, media, mediaAnterior) {
    var valores = dias.map(function (d) { return d.price; });
    var max = Math.max.apply(null, valores);
    var min = Math.min.apply(null, valores);
    var barras = dias.map(function (d) {
      return {
        dow: d.dow, dish: d.dish, price: d.price,
        pct: Math.round(d.price / max * 100),
        esMax: d.price === max, esMin: d.price === min
      };
    });
    return {
      barras: barras, max: max, min: min,
      mediaPct: Math.round(media / max * 100),
      mediaPrevPct: Math.round(mediaAnterior / max * 100)
    };
  }

  // Enlace de home (§03: "se abre desde el enlace ... botón con icono wallet"). Mismo
  // patrón visual que .ph-equilibrio-link (icono + texto + chevron, badge "aún no
  // disponible"), pero con clase .h7-gasto-link propia: la geometría de ESTA pieza es
  // literal del handoff 7 y no debe heredar cambios futuros de la clase de equilibrio,
  // que es una pieza distinta (índice de cuotas, no coste).
  function renderLinkGastoSemanal() {
    return '<button type="button" class="h7-gasto-link" data-action="abrir-gasto-semanal">' +
      '<i data-lucide="wallet"></i>' +
      '<span>' + escapeHtml(t('gasto_semanal') + ' · ' + t('v6_pendiente_badge')) + '</span>' +
      '<i data-lucide="chevron-right"></i>' +
      '</button>';
  }

  function renderSheetGastoSemanal() {
    var dias = I18N.diasCorto().map(function (d) { return d.toUpperCase(); });
    var preciosHtml = dias.map(function () { return '<span class="h7-gasto-precio-celda">—</span>'; }).join('');
    var barrasHtml = dias.map(function () {
      return '<div class="h7-gasto-barra-btn"><div class="h7-gasto-barra h7-gasto-barra-pendiente"></div></div>';
    }).join('');
    var diasHtml = dias.map(function (d) { return '<span class="h7-gasto-dia-celda">' + escapeHtml(d) + '</span>'; }).join('');
    var tarjetaVacia = function (etiquetaKey) {
      return '<div class="h7-gasto-card"><div class="h7-gasto-card-foto"><span class="h7-gasto-card-tag">' + escapeHtml(t(etiquetaKey)) + '</span></div>' +
        '<div class="h7-gasto-card-body"><div class="h7-gasto-card-precio">—</div><div class="h7-gasto-card-plato">' + escapeHtml(t('gasto_sin_dato')) + '</div></div></div>';
    };

    return sheetHead(t('gasto_semanal')) +
      '<div class="sheet-body">' +
      pendienteV6(t('v6_pend_gasto'), t('v6_pendiente_sub')) +

      '<div class="h7-gasto-hero"><div class="h7-gasto-halo"></div><div class="h7-gasto-hero-in">' +
      '<div class="h7-gasto-cab"><span class="h7-gasto-label">' + escapeHtml(t('gasto_semanal')) + '</span><span class="h7-gasto-meta">' + escapeHtml(t('gasto_por_adulto')) + '</span></div>' +
      '<div class="h7-gasto-cifra-fila"><span class="h7-gasto-cifra">—</span><span class="h7-gasto-unidad">' + escapeHtml(t('gasto_por_semana')) + '</span></div>' +
      '<div class="h7-gasto-pie">' + escapeHtml(t('gasto_sin_dato')) + '</div>' +
      '</div></div>' +

      '<div class="h7-gasto-cards">' + tarjetaVacia('gasto_mas_caro') + tarjetaVacia('gasto_mas_barato') + '</div>' +

      '<div class="h7-gasto-chart">' +
      '<div class="h7-gasto-chart-tit">' + escapeHtml(t('gasto_coste_racion')) + '</div>' +
      '<div class="h7-gasto-precios">' + preciosHtml + '</div>' +
      '<div class="h7-gasto-barras-zona"><div class="h7-gasto-barras">' + barrasHtml + '</div></div>' +
      '<div class="h7-gasto-dias">' + diasHtml + '</div>' +
      '<div class="h7-gasto-leyenda">' +
      '<span class="h7-gasto-leyenda-item"><span class="h7-gasto-leyenda-linea h7-gasto-leyenda-linea-media"></span><span class="h7-gasto-leyenda-txt h7-gasto-leyenda-txt-media">' + escapeHtml(t('gasto_media')) + '</span></span>' +
      '<span class="h7-gasto-leyenda-item"><span class="h7-gasto-leyenda-linea h7-gasto-leyenda-linea-prev"></span><span class="h7-gasto-leyenda-txt h7-gasto-leyenda-txt-prev">' + escapeHtml(t('gasto_semana_anterior')) + '</span></span>' +
      '</div>' +
      '</div>' +

      '<button type="button" class="h7-gasto-cta" data-action="cerrar-sheet">' + escapeHtml(t('entendido')) + '</button>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // RECETAS · catálogo del hogar — §15.5
  // ---------------------------------------------------------------
  // `catalogoRecetas()` es el catálogo del HOGAR: política §13 aplicada (el alérgeno severo no
  // existe) y servibilidad recalculada contra el banco vivo, jamás un campo guardado. Aquí no se
  // filtra nada por dieta ni por alergia: el motor ya decidió qué universo tiene esta casa.
  // Los chips vegetariana/sin-gluten preguntan con `sirveAMesa` sobre mesas sintéticas de 1
  // comensal — dato real del mismo prevuelo que sirve la semana, no una simulación.
  var MESA_CHIP_VEGETARIANA = [{ estilo: 'vegetariano' }];
  var MESA_CHIP_SIN_GLUTEN = [{ alergias: ['sin-gluten'] }];
  function ETIQUETA_CHIP() {
    return { todas: t('chip_todas'), rapidas: t('chip_rapidas'), favoritas: t('chip_favoritas'),
      vegetariana: t('cat_estilo_vegetariano'), 'sin-gluten': t('cat_alergia_gluten') };
  }

  function tarjetaRecetaGrid(p, oculta, favorita) {
    var fotoHtml = p.foto ? '<img src="' + escapeHtml(p.foto) + '" alt="" loading="lazy" decoding="async">' : '<div class="rc-foto-vacia"></div>';
    var tag = ETIQUETA_ESFUERZO[p.esfuerzo] || '';
    return '<div class="rc-tarjeta' + (oculta ? ' rc-oculta' : '') + '">' +
      '<button type="button" class="rc-tarjeta-abrir" data-action="abrir-receta-banco" data-plantilla="' + p.id + '">' +
      '<span class="rc-tarjeta-foto">' + fotoHtml + (tag ? '<span class="rc-tarjeta-tag">' + escapeHtml(tag) + '</span>' : '') + '</span>' +
      '<span class="rc-tarjeta-info"><span class="rc-tarjeta-nombre">' + escapeHtml(p.nombre) + '</span></span>' +
      '</button>' +
      '<div class="rc-tarjeta-pie">' +
      '<span class="rc-tarjeta-meta"><i data-lucide="clock"></i>' + (p.tiempo_min || '?') + ' min</span>' +
      '<span class="rc-tarjeta-acciones">' +
      '<button type="button" class="rc-icono-btn' + (favorita ? ' rc-icono-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + p.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '<button type="button" class="rc-icono-btn" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '"><i data-lucide="eye-off"></i></button>' +
      '</span></div></div>';
  }

  function filaRecetaLista(p, oculta, favorita) {
    var tag = ETIQUETA_ESFUERZO[p.esfuerzo] || '';
    return '<div class="rc-fila' + (oculta ? ' rc-oculta' : '') + '">' +
      '<button type="button" class="rc-fila-abrir" data-action="abrir-receta-banco" data-plantilla="' + p.id + '">' +
      '<span class="rc-fila-foto">' + (p.foto ? '<img src="' + escapeHtml(p.foto) + '" alt="" loading="lazy" decoding="async">' : '<div class="rc-fila-foto-vacia"></div>') + '</span>' +
      '<span class="rc-fila-info"><span class="rc-fila-nombre">' + escapeHtml(p.nombre) + '</span>' +
      '<span class="rc-fila-meta"><i data-lucide="clock"></i>' + (p.tiempo_min || '?') + ' min' + (tag ? ' · ' + escapeHtml(tag) : '') + '</span></span>' +
      '</button>' +
      '<button type="button" class="rc-icono-btn' + (favorita ? ' rc-icono-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + p.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '<button type="button" class="rc-icono-btn" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '"><i data-lucide="eye-off"></i></button>' +
      '</div>';
  }

  function renderRecetasVista(estado, banco, filtro, busqueda, vista, sup) {
    filtro = filtro || 'todas';
    busqueda = busqueda || '';
    vista = vista === 'list' ? 'list' : 'grid';
    if (!sup) return '<div class="rc-cabecera"><h1 class="rc-titulo">' + t('recetas') + '</h1></div>' +
      '<div class="vista-body rc-body">' +
      (avisoErrorMotor(estado) || '<p class="card-msg">' + t('todavia_no_hay_semana_generada') + '</p>') + '</div>';
    var todas = sup.catalogoRecetas();
    var ocultas = estado.ocultas || [];
    var favoritas = estado.favoritas || [];

    var chips = ['todas', 'rapidas', 'favoritas', 'vegetariana', 'sin-gluten'];
    var chipsHtml = chips.map(function (c) {
      var activo = c === filtro;
      return '<button type="button" class="rc-chip' + (activo ? ' rc-chip-activo' : '') + '" data-action="filtro-receta" data-categoria="' + c + '" aria-pressed="' + activo + '">' +
        escapeHtml(ETIQUETA_CHIP()[c] || capitaliza(c)) + '</button>';
    }).join('');

    var lista = todas;
    if (filtro === 'rapidas') lista = todas.filter(function (p) { return p.esfuerzo === 'rapido'; });
    else if (filtro === 'favoritas') lista = todas.filter(function (p) { return favoritas.indexOf(p.id) !== -1; });
    else if (filtro === 'vegetariana') lista = todas.filter(function (p) { return sup.sirveAMesa(p.id, MESA_CHIP_VEGETARIANA); });
    else if (filtro === 'sin-gluten') lista = todas.filter(function (p) { return sup.sirveAMesa(p.id, MESA_CHIP_SIN_GLUTEN); });
    if (busqueda.trim()) {
      var q = normalizarTexto(busqueda);
      lista = lista.filter(function (p) { return normalizarTexto(p.nombre).indexOf(q) !== -1; });
    }

    var listaHtml = lista.length
      ? (vista === 'list'
        ? '<div class="rc-lista">' + lista.map(function (p) { return filaRecetaLista(p, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1); }).join('') + '</div>'
        : '<div class="rc-grid">' + lista.map(function (p) { return tarjetaRecetaGrid(p, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1); }).join('') + '</div>')
      : '<p class="card-msg">' + t('no_hay_recetas_en_esta_categoria') + '</p>';

    return '<div class="rc-cabecera">' +
      '<div><h1 class="rc-titulo">' + t('recetas') + '</h1><p class="cp-resumen">' + lista.length + ' de ' + todas.length + '</p></div>' +
      '<div class="rc-vista-toggle">' +
      '<button type="button" class="rc-vista-btn' + (vista === 'list' ? ' rc-vista-btn-activo' : '') + '" data-action="recetas-vista" data-vista="list" aria-label="Vista de lista" aria-pressed="' + (vista === 'list') + '"><i data-lucide="list"></i></button>' +
      '<button type="button" class="rc-vista-btn' + (vista === 'grid' ? ' rc-vista-btn-activo' : '') + '" data-action="recetas-vista" data-vista="grid" aria-label="Vista de cuadrícula" aria-pressed="' + (vista === 'grid') + '"><i data-lucide="layout-grid"></i></button>' +
      '</div></div>' +
      '<div class="vista-body rc-body">' +
      '<label class="rc-buscador"><i data-lucide="search"></i>' +
      '<input type="search" id="recetas-buscador" placeholder="' + t('buscar_plato_o_ingrediente') + '" value="' + escapeHtml(busqueda) + '"></label>' +
      '<div class="rc-chips scroll">' + chipsHtml + '</div>' +
      listaHtml +
      '</div>';
  }

  // Ficha de una receta del catálogo, SIN plan detrás: `previsualizarElaboracion` (§15.5) —
  // nombre con la opción resuelta, variantes reales del eje, acompañamiento de ejemplo vía
  // `combinaciones`, alérgenos del desglose REAL y las notas de seguridad infantil (2.5:
  // sanitarias, se enseñan siempre). Sin cantidades: aquí no hay mesa, y una cantidad sin mesa
  // sería inventada — la real vive en la ficha del día, que sí tiene comensales.
  function renderVistaRecetaPlantilla(estado, banco, plantillaId, sup) {
    var p = sup && sup.previsualizarElaboracion(plantillaId);
    if (!p) {
      return '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos esta receta.</p></div>';
    }
    var nombreSplit = splitNombrePlato(p.nombre);
    var esCena = p.apta.length > 0 && p.apta.indexOf('comida') === -1;
    var tag = ETIQUETA_ESFUERZO[p.esfuerzo] || '—';
    var favorita = (estado.favoritas || []).indexOf(p.id) !== -1;
    var oculta = (estado.ocultas || []).indexOf(p.id) !== -1;
    var fotoHtml = p.foto ? '<img src="' + escapeHtml(p.foto) + '" alt="">' : '<div class="rv-foto-vacia"></div>';
    var acomp = p.acompanamiento.length
      ? t('se_completa_con').replace('{platos}', p.acompanamiento.map(function (a) { return a.nombre.toLowerCase(); }).join(' + ')) : '';
    var variantes = p.variantes.length
      ? t('tambien_con').replace('{opciones}', p.variantes.slice(0, 4).map(function (v) { return nombreCortoIngrediente(v.nombre).toLowerCase(); }).join(', ')) : '';
    var pasosHtml = p.pasos.length
      ? '<div class="rv-pasos">' + pasosCards(p.pasos) + '</div>'
      : '<p class="card-msg">Sin pasos detallados para esta receta.</p>';
    var acompPasos = p.acompanamiento.map(function (a) {
      return a.pasos && a.pasos.length
        ? '<p class="detalle-subtitulo" style="margin-top:18px">' + escapeHtml(a.nombre) + '</p><div class="rv-pasos">' + pasosCards(a.pasos) + '</div>' : '';
    }).join('');
    var alergenos = p.alergenos.length
      ? '<p class="rv-variantes"><i data-lucide="alert-circle"></i>' + escapeHtml(t('contiene') + ' ' + p.alergenos.join(', ')) + '</p>' : '';

    return '<div class="rv-hero">' + fotoHtml + '<div class="rv-hero-gradiente"></div>' +
      '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
      '<div class="rv-acciones">' +
      '<button type="button" class="rv-flotante' + (oculta ? ' rv-flotante-activo' : '') + '" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '" aria-pressed="' + oculta + '"><i data-lucide="eye-off"></i></button>' +
      '<button type="button" class="rv-flotante' + (favorita ? ' rv-flotante-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + p.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '</div></div>' +
      '<div class="rv-body">' +
      '<span class="rv-pill rv-pill-' + (esCena ? 'cena' : 'comida') + '">' + (esCena ? ICONO_LUNA : ICONO_SOL) + t(esCena ? 'badge_cena' : 'badge_comida') + '</span>' +
      '<h1 class="rv-titulo">' + escapeHtml(nombreSplit.titulo) + '</h1>' +
      (nombreSplit.subtitulo ? '<p class="rv-subtitulo">' + escapeHtml(nombreSplit.subtitulo) + '</p>' : '') +
      '<div class="rv-stats">' +
      '<div class="rv-stat"><i data-lucide="clock"></i><span class="rv-stat-valor">' + (p.tiempo_min || '?') + ' min</span></div>' +
      '<div class="rv-stat"><i data-lucide="leaf"></i><span class="rv-stat-valor">' + tag + '</span></div>' +
      '</div>' +
      (acomp ? '<p class="rv-variantes"><i data-lucide="info"></i>' + escapeHtml(acomp) + '</p>' : '') +
      (variantes ? '<p class="rv-variantes"><i data-lucide="shuffle"></i>' + escapeHtml(capitaliza(variantes)) + '</p>' : '') +
      alergenos +
      '<p class="rv-seccion-titulo">' + t('preparacion') + '</p>' +
      pasosHtml + acompPasos +
      // sin CTA de «ponlo en el menú»: `cambiarPlato {modo:'asignar'}` ya existe, pero el ALCANCE
      // fino de esa acción (a qué día, si desplaza o sustituye) está declarado PENDIENTE DE ROGER
      // en §15.3. Inventarlo aquí sería decidir por él. La puerta de asignar que sí tiene día
      // conocido —el sheet de cambiar y la nevera— está conectada.
      '</div>';
  }


  // ---------------------------------------------------------------
  // COMPRA — segmentado Hoy/Próximos 7 días + grupos Frescos/Despensa/Frío
  // ---------------------------------------------------------------
  // Domingo de batch (handoff backlog-v3 #17, 2026-07-28): pantalla propia, no cabe en
  // Semana (no es receta ni menú). Contenido literal del diseño de referencia -- SIN
  // fotos (el banco solo tenía 4 y ninguna correspondía a estas bases, v2 #16) y las
  // cantidades son estimaciones de una familia de 4, declaradas como tales.
  function renderBatch() {
    var b = I18N.BATCH[I18N.getLang()];
    var statsHtml = b.stats.map(function (s) {
      return '<div class="batch-stat"><span class="batch-stat-v">' + escapeHtml(s.v) + '</span><span class="batch-stat-k">' + escapeHtml(s.k) + '</span></div>';
    }).join('');
    var basesHtml = b.bases.map(function (base) {
      var chips = base.dest.map(function (d) { return '<span class="batch-base-chip">' + escapeHtml(d) + '</span>'; }).join('');
      return '<div class="batch-base">' +
        '<div class="batch-base-cabecera"><span class="batch-base-num">' + escapeHtml(base.n) + '</span>' +
        '<span class="batch-base-info"><span class="batch-base-nombre">' + escapeHtml(base.name) + '</span><span class="batch-base-qty">' + escapeHtml(base.qty) + '</span></span></div>' +
        '<p class="batch-base-nota">' + escapeHtml(base.note) + '</p>' +
        '<div class="batch-base-chips">' + chips + '</div>' +
        '</div>';
    }).join('');
    var pasosHtml = b.pasos.map(function (p) {
      return '<div class="batch-paso' + (p.hi ? ' batch-paso-hi' : '') + '"><span class="batch-paso-hora">' + escapeHtml(p.t) + '</span><p class="batch-paso-txt">' + escapeHtml(p.txt) + '</p></div>';
    }).join('');
    var freezerHtml = b.freezer.map(function (f) {
      return '<div class="batch-freezer-fila"><i data-lucide="snowflake" class="batch-freezer-icono"></i>' +
        '<span class="batch-freezer-info"><span class="batch-freezer-label">' + escapeHtml(f.label) + '</span><span class="batch-freezer-meta">' + escapeHtml(f.qty) + ' · ' + escapeHtml(f.dura) + '</span></span></div>';
    }).join('');
    return '<div class="mf-cabecera"><button type="button" class="rv-flotante rv-volver" data-action="batch-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button></div>' +
      '<div class="vista-body batch-body">' +
      '<h1 class="batch-titulo">' + t('domingo_de_batch') + '</h1>' +
      '<p class="batch-bajada">' + t('una_tarde_de_cocina_y_media_semana_resuelt') + '</p>' +
      '<div class="batch-stats">' + statsHtml + '</div>' +
      '<p class="rv-seccion-titulo">' + t('lo_que_cocinas') + '</p>' +
      '<div class="batch-bases">' + basesHtml + '</div>' +
      '<p class="rv-seccion-titulo">' + t('el_orden_de_la_tarde') + '</p>' +
      '<div class="batch-pasos">' + pasosHtml + '</div>' +
      '<p class="rv-seccion-titulo">' + t('al_congelador') + '</p>' +
      '<div class="batch-freezer">' + freezerHtml + '</div>' +
      '<button type="button" class="btn-cta-gradiente batch-anadir-btn" data-action="batch-anadir-compra">' + t('anadir_las_bases_a_la_compra') + '</button>' +
      '<p class="batch-apoyo">' + t('las_cinco_bases_cubren_siete_comidas_de_la') + '</p>' +
      '</div>';
  }

  // COMPRA · §15.2. `listaCompra(semana, filtro)` deriva del BANCO VIVO + la semana `/2` con el
  // ÚNICO derivador del motor (`src/derivar.js`): notas incluidas —`eliminar` quita la línea a
  // quien la tiene, `variante-todos` compra el sustituto para toda la olla, `vehiculo-persona`
  // compra los dos, `solo-para` limita la elaboración a sus miembros— y redondea UNA vez sobre el
  // total. Aquí no se calcula ni un gramo: solo se AGRUPA como se compra y se pinta.
  //
  // La taxonomía de abajo es de TIENDA (carnicería · pescadería · frutería · despensa · frío), no
  // la nutricional: es cómo se compra, no cómo se cuenta la cuota. La clave es la categoría AESAN
  // que viaja en cada línea — dato del banco, no una etiqueta inventada en la pantalla.
  var GRUPO_COMPRA = {
    'carne-blanca': 'carne', 'carne-roja': 'carne', 'carne-procesada': 'carne',
    'pescado-blanco': 'pescado', 'pescado-azul': 'pescado', marisco: 'pescado',
    verdura: 'verdura', fruta: 'verdura',
    legumbre: 'otros', cereal: 'otros', tuberculo: 'otros', 'fruto-seco': 'otros',
    otros: 'otros', 'azucar-anadido': 'otros',
    huevo: 'frio', lacteo: 'frio'
  };
  var GRUPOS_COMPRA_INFO = {
    carne: { nombre: 'Carne', icono: 'beef' },
    pescado: { nombre: 'Pescado', icono: 'fish' },
    verdura: { nombre: 'Frutas y verduras', icono: 'carrot' },
    otros: { nombre: 'Otros', icono: 'wheat' },
    frio: { nombre: 'Frío', icono: 'snowflake' }
  };
  var ORDEN_GRUPO_COMPRA = ['carne', 'pescado', 'verdura', 'otros', 'frio'];

  function filaCompraHtml(item, marcado) {
    // unidades (huevo/yogur): se compra por piezas, no por gramos — «6 uds» en vez de «360 g».
    // Los de despensa (aceite, sal, ajo…) van SIN cantidad: son «¿lo tengo en casa?», no compra.
    var cantidadHtml = item.despensa ? ''
      : item.unidades != null ? '<span class="check-cantidad">' + item.unidades + (item.unidades === 1 ? ' ud' : ' uds') + '</span>'
        : '<span class="check-cantidad">' + item.gramos + ' g</span>';
    return '<li class="check-item ' + (marcado ? 'check-marcado' : '') + '">' +
      '<label>' +
      '<input type="checkbox" data-action="toggle-compra-item" data-id="' + item.id + '" ' + (marcado ? 'checked' : '') + '>' +
      '<span class="check-texto">' + escapeHtml(item.nombre) + '</span>' +
      cantidadHtml +
      '</label></li>';
  }

  function renderCompraVista(estado, plan, banco, rango, categoriasAbiertas, sup, diaHoy) {
    categoriasAbiertas = categoriasAbiertas || {};
    rango = rango === 'hoy' ? 'hoy' : '7d';
    if (!plan || !sup) {
      return '<div class="rc-cabecera"><h1 class="rc-titulo">' + t('nav_compra') + '</h1></div>' +
        '<div class="vista-body rc-body">' +
        (avisoErrorMotor(estado) || '<p class="card-msg">' + t('todavia_no_hay_semana_generada') + '</p>') + '</div>';
    }
    // Pasadas las 16 h, «Compra hoy» ya no necesita el mediodía (Roger 2026-07-22) — mismo umbral
    // que `saludoHora`, real reloj del navegador. El filtro lo aplica el motor, no esta función.
    var filtro = rango === 'hoy'
      ? { dia: diaHoy, soloCena: new Date().getHours() >= 16 }
      : null;
    var todos = diaHoy == null && rango === 'hoy' ? [] : sup.listaCompra(plan, filtro);
    var marcados = {};
    ((estado.compra && estado.compra.marcados) || []).forEach(function (id) { marcados[id] = 1; });
    var despensa = todos.filter(function (i) { return i.despensa; });
    var items = todos.filter(function (i) { return !i.despensa; });
    var marcadosN = items.filter(function (i) { return marcados[i.id]; }).length;
    var pct = items.length ? Math.round(marcadosN / items.length * 100) : 0;

    var porGrupo = {};
    items.forEach(function (item) {
      var g = GRUPO_COMPRA[item.categoria] || 'otros';
      (porGrupo[g] = porGrupo[g] || []).push(item);
    });
    // categoría completa = colapsa a una línea (progreso visible sin barra), pero SIEMPRE
    // reabrible: un check puede haber sido un error. No se persiste (al recargar vuelve plegada,
    // que es el estado real).
    var gruposHtml = ORDEN_GRUPO_COMPRA.filter(function (g) { return porGrupo[g] && porGrupo[g].length; }).map(function (g) {
      var info = GRUPOS_COMPRA_INFO[g];
      var lista = porGrupo[g];
      var completo = lista.every(function (i) { return marcados[i.id]; });
      var abierto = !completo || !!categoriasAbiertas[g];
      var cabecera = completo
        ? '<button type="button" class="cp-grupo-titulo cp-grupo-completo" data-action="toggle-categoria-compra" data-grupo="' + g + '" aria-expanded="' + abierto + '">' +
          '<i data-lucide="' + info.icono + '"></i>' + info.nombre +
          '<span class="cp-grupo-estado">' + t('completo') + '<i data-lucide="chevron-' + (abierto ? 'up' : 'down') + '"></i></span></button>'
        : '<p class="cp-grupo-titulo"><i data-lucide="' + info.icono + '"></i>' + info.nombre + '</p>';
      return '<div class="cp-grupo' + (completo ? ' cp-grupo-completo-wrap' : '') + '">' + cabecera +
        (abierto ? '<div class="cp-lista"><ul class="lista-check">' + lista.map(function (i) { return filaCompraHtml(i, !!marcados[i.id]); }).join('') + '</ul></div>' : '') +
        '</div>';
    }).join('');

    var despensaHtml = despensa.length ? '<details class="cp-despensa">' +
      '<summary>' + t('revisa_despensa') + '</summary>' +
      '<div class="cp-lista"><ul class="lista-check">' + despensa.map(function (i) { return filaCompraHtml(i, !!marcados[i.id]); }).join('') + '</ul></div>' +
      '</details>' : '';

    return '<div class="rc-cabecera">' +
      '<div><h1 class="rc-titulo">Compra</h1><p class="cp-resumen">' + marcadosN + ' de ' + items.length + ' en el carro</p></div>' +
      '<div class="cp-cabecera-derecha">' +
      (marcadosN > 0 ? '<button type="button" class="cp-vaciar" data-action="vaciar-compra" aria-label="Desmarcar todo"><i data-lucide="rotate-ccw"></i></button>' : '') +
      '<div class="cp-anillo" style="background:conic-gradient(var(--gold) ' + (pct * 3.6) + 'deg, var(--elev2) 0)"><span>' + pct + '%</span></div>' +
      '</div></div>' +
      '<div class="vista-body rc-body">' +
      '<div class="cp-seg">' +
      '<button type="button" class="cp-seg-btn' + (rango === 'hoy' ? ' cp-seg-btn-activo' : '') + '" data-action="segmento-compra" data-rango="hoy" aria-pressed="' + (rango === 'hoy') + '">Hoy</button>' +
      '<button type="button" class="cp-seg-btn' + (rango === '7d' ? ' cp-seg-btn-activo' : '') + '" data-action="segmento-compra" data-rango="7d" aria-pressed="' + (rango === '7d') + '">' + t('proximos_7_dias') + '</button>' +
      '</div>' +
      (items.length ? gruposHtml : '<p class="card-msg">Nada pendiente de comprar.</p>') +
      despensaHtml +
      '</div>';
  }

  // ---------------------------------------------------------------
  // CAMBIAR EL PLATO · §15.3 · NEVERA · §15.6
  // ---------------------------------------------------------------
  // `cambiarPlato(semana, slot, peticion, diario)` re-resuelve SOLO ese slot (T2 con el esqueleto
  // vigente, T3 re-fracciona, T4 re-audita la semana ENTERA) y devuelve `{semana, desvios[]}` —
  // AVISO, JAMÁS BLOQUEO. `opcionesNevera` ya no monta menús: los PROPONE, y elegir uno pasa por
  // `cambiarPlato {modo:'asignar'}` — una sola puerta para cambiar la semana.
  function filaCambio(accion, dia, tipoComida, icono, claseIcono, titulo, sub) {
    return '<button type="button" class="sheet-fila-opcion" data-action="' + accion + '" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
      '<span class="sheet-fila-opcion-icono ' + claseIcono + '"><i data-lucide="' + icono + '"></i></span>' +
      '<span class="sheet-fila-opcion-texto"><span class="sheet-fila-opcion-titulo">' + escapeHtml(titulo) + '</span>' +
      '<span class="sheet-fila-opcion-sub">' + escapeHtml(sub) + '</span></span>' +
      '<i data-lucide="chevron-right" class="sheet-fila-opcion-chevron"></i>' +
      '</button>';
  }

  function renderSheetCambiarInicio(estado, banco, dia, tipoComida) {
    return sheetHead('Cambiar ' + (tipoComida === 'comida' ? 'comida' : 'cena')) +
      '<div class="sheet-body">' +
      '<p class="card-msg">' + t('que_cambiamos') + '</p>' +
      filaCambio('modo-otro-menu', dia, tipoComida, 'shuffle', 'sheet-fila-opcion-icono-gold', t('otro_menu'), t('un_menu_completo_distinto')) +
      filaCambio('modo-nevera', dia, tipoComida, 'refrigerator', 'sheet-fila-opcion-icono-azul', t('con_lo_que_hay_en_la_nevera'), t('recetas_con_lo_de_tu_nevera')) +
      filaCambio('modo-solo-complementaria', dia, tipoComida, 'salad', 'sheet-fila-opcion-icono-gold', t('cambiar_solo_el_acompanamiento'), t('mismo_plato_principal_otra_guarnicion')) +
      '</div>';
  }

  // Resultado de un cambio: lo que ha pasado y lo que se ha cedido, en frase humana. Los desvíos
  // los DECLARA el motor (§15.3): aquí no se decide cuál enseñar ni se suaviza ninguno — el aviso
  // DURO (alergia o seguridad infantil de un presente) va primero y aparte, con su color de
  // bloqueo, porque nombra a una persona.
  function renderSheetCambioHecho(estado, banco, servicio, desvios) {
    var duros = (desvios || []).filter(function (d) { return d.duro; });
    var blandos = (desvios || []).filter(function (d) { return !d.duro; });
    var itemP = servicio && principalDe(banco, servicio);
    var nombre = itemP ? nombrePercibido(banco, itemP, '*') : '';
    var sec = servicio ? secundariasDe(banco, servicio).map(function (x) { return nombrePercibido(banco, x, '*'); }).join(' · ') : '';
    var lista = function (arr, clase) {
      return '<ul class="ph-notas-lista">' + arr.map(function (d) {
        return '<li class="ph-nota' + clase + '"><i data-lucide="' + (clase ? 'shield-alert' : 'dot') + '"></i><span>' + escapeHtml(d.frase) + '</span></li>';
      }).join('') + '</ul>';
    };
    return sheetHead(t('cambiado')) +
      '<div class="sheet-body">' +
      '<p class="card-msg">' + t('nuevo_plato') + ' <strong>' + escapeHtml(nombre) + '</strong>' + (sec ? ' <span class="ph-subtitulo">' + escapeHtml(sec) + '</span>' : '') + '</p>' +
      (duros.length ? '<div class="ph-notas"><p class="ph-notas-tit ph-notas-tit-sanitaria">' + t('ojo') + '</p>' + lista(duros, ' ph-nota-sanitaria') + '</div>' : '') +
      (blandos.length ? '<div class="ph-notas"><p class="ph-notas-tit">' + t('lo_que_hemos_cedido') + '</p>' + lista(blandos, '') + '</div>' : '') +
      '<button type="button" class="btn-cta-gradiente" data-action="cerrar-sheet">' + t('vale') + '</button>' +
      '</div>';
  }

  // Cuando no hay alternativa: la semana NO se toca y se dice por qué. Jamás un cambio a peor
  // sin avisar, jamás un botón que no hace nada en silencio.
  function renderSheetCambioSinSalida(desvios) {
    return sheetHead(t('cambiado')) +
      '<div class="sheet-body">' +
      '<p class="card-msg">' + escapeHtml(((desvios || [])[0] || {}).frase || t('no_hemos_encontrado_otro')) + '</p>' +
      '<button type="button" class="btn-cta-gradiente" data-action="cerrar-sheet">' + t('vale') + '</button>' +
      '</div>';
  }

  // NEVERA · §15.6 — filtro INVERTIDO: manda la disponibilidad. El checklist son los alimentos
  // que de verdad deciden si un plato se monta (`alimentosNevera`); grasa y condimento no se
  // preguntan porque se asumen en casa (supuesto declarado del motor, no de esta pantalla).
  function renderNevera(estado, banco, dia, tipoComida, sup) {
    var lista = sup ? sup.alimentosNevera() : [];
    var filas = lista.map(function (a) {
      return '<li data-buscar="' + escapeHtml(normalizarTexto(a.nombre)) + '"><label class="fila-nevera">' +
        '<input type="checkbox" value="' + a.id + '" data-nombre="' + escapeHtml(a.nombre) + '"> ' + escapeHtml(a.nombre) + '</label></li>';
    }).join('');
    // Handoff de Claude Design: junto al buscador van la CÁMARA («haz una foto de la nevera»)
    // y la VOZ («dinos qué tienes»). El reconocimiento es backend y lo lleva Roger en paralelo
    // (7-ago), así que aquí se dejan PUESTOS Y DESACTIVADOS con su marca de pendiente — §4.12:
    // lo que no se puede conectar todavía se ve y se dice, jamás se esconde.
    var botonModo = function (icono, claveAria) {
      return '<button type="button" class="nevera-modo" disabled aria-disabled="true"' +
        ' aria-label="' + escapeHtml(t(claveAria) + ' · ' + t('v6_pendiente_badge')) + '">' +
        '<i data-lucide="' + icono + '"></i></button>';
    };
    return sheetHead(t('con_lo_que_hay_en_la_nevera')) +
      '<div class="sheet-body">' +
      '<p class="card-msg">' + t('marca_lo_que_tienes_en_casa_y_buscamos_un') + '</p>' +
      '<div class="nevera-top">' +
      '<div class="nevera-buscador-fila">' +
      '<label class="rc-buscador"><i data-lucide="search"></i>' +
      '<input type="search" id="nevera-buscador" placeholder="' + t('buscar_ingrediente') + '" autocomplete="off"></label>' +
      botonModo('camera', 'nevera_foto_aria') +
      botonModo('mic', 'nevera_voz_aria') +
      '</div>' +
      '<p class="nevera-pendiente"><i data-lucide="hard-hat"></i>' + escapeHtml(t('nevera_foto_voz_pendiente')) + '</p>' +
      '<div class="nevera-seleccion" id="nevera-seleccion" hidden></div>' +
      '<button type="button" class="btn-cta-gradiente" id="nevera-confirmar" data-action="confirmar-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
      t('buscar_plato') + '<span id="nevera-cuenta" class="nevera-cuenta"></span></button>' +
      '</div>' +
      '<ul class="lista-nevera" id="lista-nevera-checks">' + filas + '</ul>' +
      '</div>';
  }

  // Lo que la nevera PROPONE: montables primero, y detrás las que necesitan UNA cosa más (con su
  // nombre, para poder decidir). Elegir una no monta nada aquí: llama a `cambiarPlato
  // {modo:'asignar'}`, la única puerta que cambia la semana.
  function renderOpcionesNevera(opciones, dia, tipoComida) {
    var todas = (opciones.montables || []).concat(opciones.casi_montables || []);
    if (!todas.length) {
      return sheetHead(t('con_lo_que_hay_en_la_nevera')) +
        '<div class="sheet-body"><p class="card-msg">' + t('nevera_sin_resultados') + '</p></div>';
    }
    var fila = function (m) {
      var falta = (m.faltan || [])[0];
      // la opción del eje VIAJA: lo que la familia elige es el plato percibido («alitas al
      // horno»), no la plantilla («asado al horno»), que sirve también dorada o pollo entero
      return '<li><button type="button" class="fila-opcion-nevera" data-action="elegir-opcion-nevera" data-plantilla="' + m.id + '"' +
        (m.opcion ? ' data-opcion="' + m.opcion + '"' : '') + ' data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
        '<span class="fila-opcion-nevera-nombre">' + escapeHtml(m.nombre) + '</span>' +
        '<span class="fila-opcion-nevera-sub">' + (m.tiempo_min || '?') + ' min' + (ETIQUETA_ESFUERZO[m.esfuerzo] ? ' · ' + ETIQUETA_ESFUERZO[m.esfuerzo] : '') + '</span>' +
        '</button>' +
        (falta ? '<p class="fila-opcion-nevera-aviso"><i data-lucide="alert-circle"></i>' +
          escapeHtml(t('te_falta').replace('{alimento}', falta.nombre)) + '</p>' : '') +
        '</li>';
    };
    return sheetHead(t('elige_un_plato')) +
      '<div class="sheet-body">' +
      '<ul class="lista-opciones-nevera">' + (opciones.montables || []).map(fila).join('') + '</ul>' +
      ((opciones.casi_montables || []).length
        ? '<p class="detalle-subtitulo">' + t('casi_montables') + '</p>' +
          '<ul class="lista-opciones-nevera">' + opciones.casi_montables.map(fila).join('') + '</ul>'
        : '') +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Formulario de miembro — compartido entre wizard (alta) y sheet Familia (+miembro)
  // ---------------------------------------------------------------
  // Onboarding — portada (landing) → nombre de familia → asistente de 5 pasos
  // por persona → ficha completa → fin (handoff "Alta de persona", 2026-07-30).
  // Sustituye al wizard conversacional de 3 pasos: la unidad ya no es "la
  // familia entera de golpe" sino UNA persona a la vez, y la ficha resumen es
  // el punto donde se decide si viene otra o ya estamos todos.
  // ---------------------------------------------------------------

  // Vocabulario de regiones (tramo 1, 2026-07-17) — research §2.1. Es un dato
  // de la familia (dónde vive), no un mando del motor: el sesgo regional del
  // scoring es interno. cantabria está en el selector aunque el banco todavía
  // no tenga platos suyos (una familia cántabra tiene que poder elegirse).
  // Orden y desglose ALINEADOS con el handoff 6 (04-familia.md — "20 opciones
  // en el orden exacto"): Castilla se separa en La Mancha/León, Navarra y La
  // Rioja dejan de ir combinadas, se añaden Ceuta y Melilla. 'euskadi' conserva
  // su id de siempre (dato interno, soft-signal del motor) — solo cambia la
  // ETIQUETA visible a "País Vasco", que es la que pide el handoff.
  var REGIONES = [
    { id: 'andalucia', nombre: 'Andalucía' },
    { id: 'aragon', nombre: 'Aragón' },
    { id: 'asturias', nombre: 'Asturias' },
    { id: 'baleares', nombre: 'Baleares' },
    { id: 'canarias', nombre: 'Canarias' },
    { id: 'cantabria', nombre: 'Cantabria' },
    { id: 'castilla-la-mancha', nombre: 'Castilla-La Mancha' },
    { id: 'castilla-y-leon', nombre: 'Castilla y León' },
    { id: 'cataluna', nombre: 'Cataluña' },
    { id: 'comunidad-valenciana', nombre: 'Comunidad Valenciana' },
    { id: 'extremadura', nombre: 'Extremadura' },
    { id: 'galicia', nombre: 'Galicia' },
    { id: 'rioja', nombre: 'La Rioja' },
    { id: 'madrid', nombre: 'Madrid' },
    { id: 'murcia', nombre: 'Murcia' },
    { id: 'navarra', nombre: 'Navarra' },
    { id: 'euskadi', nombre: 'País Vasco' },
    { id: 'ceuta', nombre: 'Ceuta' },
    { id: 'melilla', nombre: 'Melilla' }
  ];

  function opcionesRegion(seleccionada) {
    return '<option value=""' + (!seleccionada ? ' selected' : '') + '>' + escapeHtml(t('onb_prefiero_no')) + '</option>' +
      REGIONES.map(function (r) {
        return '<option value="' + r.id + '"' + (seleccionada === r.id ? ' selected' : '') + '>' + escapeHtml(r.nombre) + '</option>';
      }).join('');
  }

  // PASO 1 — nombre de familia ("Ayúdame a conoceros", handoff 6, 04-familia.md).
  // RÉPLICA EXACTA: valores literales del handoff (28px, oklch, radio 15px) — ver
  // el bloque .h6-* de styles.css. CTA habilitado solo con nombre Y consentimiento
  // de salud (nuevo en este handoff): ambos se leen aquí, la validez la decide
  // onbFamiliaSiguiente() en app.js, este render solo refleja el estado ya calculado.
  function renderOnbNombreFamilia(nombreFamilia, familiaRegion, saludConsent) {
    var listo = !!(nombreFamilia || '').trim() && !!saludConsent;
    return '<div class="onb-scroll" style="animation:e3fade .3s ease both"><div class="h6-familia-body">' +
      '<div class="h6-familia-kicker">' + escapeHtml(t('onb_bienvenidos')) + '</div>' +
      '<div class="h6-familia-titulo"><span class="h6-familia-titulo-dorado">' + escapeHtml(t('onb_titular_1')) + '</span><br>' + escapeHtml(t('onb_titular_2')) + '</div>' +
      '<div class="h6-familia-campo-nombre"><label style="display:block"><span class="h6-eyebrow">' + escapeHtml(t('onb_nombre_familia')) + '</span>' +
        '<input type="text" id="onb-nombre-familia" class="h6-familia-input" maxlength="40" placeholder="' + escapeHtml(t('onb_ph_familia')) + '" value="' + escapeHtml(nombreFamilia || '') + '" autocomplete="off"></label></div>' +
      '<div class="h6-familia-campo-region"><label style="display:block"><span class="h6-eyebrow">' + escapeHtml(t('onb_de_donde')) + '</span>' +
        '<span class="h6-familia-select-wrap"><select id="onb-region" class="h6-familia-select">' + opcionesRegion(familiaRegion) + '</select>' +
        '<i data-lucide="chevron-down" class="h6-familia-chevron" aria-hidden="true"></i></span></label></div>' +
      '<label class="h6-check h6-familia-consent"><input type="checkbox" id="onb-salud" class="h6-check-input"' + (saludConsent ? ' checked' : '') + '>' +
        '<span class="h6-check-box" aria-hidden="true"><i data-lucide="check" style="width:13px;height:13px;stroke-width:3.5"></i></span>' +
        '<span class="h6-check-txt">' + escapeHtml(t('onb_salud_consent')) + '</span></label>' +
      '<button type="button" class="h6-cta h6-cta-r15 h6-familia-cta ' + (listo ? 'h6-cta-oro12' : 'h6-cta-gris') + '" id="onb-cta-familia" data-action="onb-familia-siguiente"' + (listo ? '' : ' aria-disabled="true"') + '>' +
        '<span class="h6-cta-txt' + (listo ? '' : ' h6-cta-txt-gris') + '">' + escapeHtml(t('onb_siguiente')) + '</span></button>' +
      '<div class="h6-familia-pie"><button type="button" class="h6-familia-pie-link" data-action="landing-unirse">' + escapeHtml(t('onb_codigo')) + '</button></div>' +
      '</div></div>';
  }

  // PASOS 2-6 — asistente de UNA persona. Estructura fija cabecera / contenido
  // scrollable / pie, con la línea de avance continua arriba (no son pasos
  // clicables: solo se avanza con "Siguiente" y se vuelve con la flecha).
  var PASOS_PERSONA = ['paso_basicos', 'paso_estilo', 'paso_alergias', 'paso_gustos', 'paso_comidas'];

  function pasoPersonaValido(paso, draft) {
    if (paso === 1) {
      if (!(draft.nombre || '').trim()) return false;
      var req = medidasRequeridas(draft.anioNacimiento);
      if (req.altura && !(Number(draft.altura) > 0)) return false;
      if (req.peso && !(Number(draft.peso) > 0)) return false;
      return true;
    }
    if (paso === 2) return !!draft.estilo;
    return true;
  }

  function cabeceraPersona(paso, draft, numeroPersona) {
    var avance = ((paso - 1) / 5 * 100) + '%';
    var foto = fotoSegura(draft.foto);
    return '<div class="onb-cab">' +
      '<div class="onb-avance"><span class="onb-avance-fill" style="width:' + avance + '"></span></div>' +
      '<div class="onb-cab-fila">' +
        '<button type="button" class="onb-atras" data-action="onb-persona-atras" aria-label="' + escapeHtml(t('onb_volver')) + '"><i data-lucide="arrow-left"></i></button>' +
        '<div class="onb-cab-txt">' +
          '<span class="onb-cab-kicker">' + escapeHtml(t('onb_persona_paso').replace('{n}', numeroPersona).replace('{p}', paso)) + '</span>' +
          '<span class="onb-cab-paso">' + escapeHtml(t(PASOS_PERSONA[paso - 1])) + '</span>' +
        '</div>' +
        '<span class="onb-cab-avatar"' + (foto ? ' style="background-image:url(\'' + foto + '\')"' : '') + '>' +
          (foto ? '' : escapeHtml(iniciales(draft.nombre))) + '</span>' +
      '</div></div>';
  }

  function cuerpoPasoPersona(paso, draft) {
    if (paso === 1) {
      var foto1 = fotoSegura(draft.foto);
      return '<h2 class="onb-h2">' + escapeHtml(t('onb_quien')) + '</h2>' +
        '<p class="onb-sub">' + escapeHtml(t('onb_quien_sub')) + '</p>' +
        '<div class="onb-foto-bloque">' +
          '<button type="button" class="onb-foto" data-action="persona-foto" aria-label="' + escapeHtml(t(foto1 ? 'onb_cambiar_foto' : 'onb_anadir_foto')) + '"' +
            (foto1 ? ' style="background-image:url(\'' + foto1 + '\')"' : '') + '>' +
            (foto1 ? '' : '<span class="onb-foto-inicial">' + escapeHtml(iniciales(draft.nombre)) + '</span>') +
            '<span class="onb-foto-badge" aria-hidden="true"><i data-lucide="camera"></i></span>' +
          '</button>' +
          '<input type="file" id="onb-foto-input" accept="image/*" hidden>' +
          (foto1
            ? '<button type="button" class="onb-foto-txt onb-foto-quitar" data-action="persona-foto-quitar">' + escapeHtml(t('onb_quitar_foto')) + '</button>'
            : '<span class="onb-foto-txt">' + escapeHtml(t('onb_foto_opcional')) + '</span>') +
        '</div>' +
        '<label class="onb-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_nombre')) + '</span>' +
          '<input type="text" class="onb-input" data-persona-campo="nombre" maxlength="30" placeholder="' + escapeHtml(t('onb_ph_nombre')) + '" value="' + escapeHtml(draft.nombre || '') + '" autocomplete="off"></label>' +
        '<label class="onb-campo"><span class="onb-eyebrow">' + t('ano_de_nacimiento') + '</span>' +
          '<input type="number" inputmode="numeric" class="onb-input" data-persona-campo="anioNacimiento" min="1920" max="' + new Date().getFullYear() + '" placeholder="' + escapeHtml(t('onb_ph_anio')) + '" value="' + (draft.anioNacimiento || '') + '"></label>' +
        avisoInfo(t(claveAvisoMedidas(draft.anioNacimiento))) +
        '<div class="onb-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_sexo')) + '</span>' + pildorasPersona('sexo', OPCIONES_SEXO, draft.sexo || 'mujer') + '</div>' +
        '<div class="onb-fila-2">' +
          '<label class="onb-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_altura')) + '</span>' +
            '<input type="number" inputmode="numeric" class="onb-input" data-persona-campo="altura" min="30" max="230" placeholder="—" value="' + (draft.altura || '') + '"></label>' +
          '<label class="onb-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_peso_kg')) + '</span>' +
            '<input type="number" inputmode="numeric" class="onb-input" data-persona-campo="peso" min="1" max="200" placeholder="—" value="' + (draft.peso || '') + '"></label>' +
        '</div>' +
        (pideActividadYObjetivo(draft.anioNacimiento)
          ? '<div class="onb-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_actividad')) + '</span>' +
            pildorasPersona('actividad', OPCIONES_ACTIVIDAD, draft.actividad || 'media') +
            '<p class="onb-ayuda">' + escapeHtml(t(AYUDA_ACTIVIDAD[draft.actividad || 'media'])) + '</p></div>' +
            '<div class="onb-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_objetivo')) + '</span>' +
            pildorasPersona('objetivo', OPCIONES_OBJETIVO_PERSONA, draft.objetivo || 'mantenimiento') + '</div>'
          : avisoInfo(t('aviso_menor_sin_actividad_objetivo')));
    }
    if (paso === 2) {
      return '<h2 class="onb-h2">' + escapeHtml(t('onb_como_come')) + '</h2>' +
        '<p class="onb-sub">' + escapeHtml(t('onb_como_come_sub')) + '</p>' +
        tarjetasPersona('estilo', ESTILOS_VIDA, draft.estilo) +
        (draft.estilo === 'sin-cerdo'
          ? avisoInfo(t('onb_aviso_sin_cerdo'))
          : '');
    }
    if (paso === 3) {
      return '<span class="onb-chip-seguridad"><i data-lucide="shield-check"></i>' + escapeHtml(t('onb_seguridad')) + '</span>' +
        '<h2 class="onb-h2">' + escapeHtml(t('onb_no_comer')) + '</h2>' +
        // El handoff prometía aquí "no aparecerá nunca en sus menús". El motor v3
        // todavía no consume `alergias` (lo hará dietas.js): la exclusión dura de
        // hoy son los vetos por ingrediente de la ficha. Copy ajustado para no
        // prometer una garantía que el motor aún no da — restaurar la frase del
        // handoff el día que dietas.js entre en el motor.
        '<p class="onb-sub">' + escapeHtml(t('onb_no_comer_sub')) + '</p>' +
        listaAlergias(draft.alergias, true) +
        // La tarjeta con título + texto se consolidó en una línea al pie (handoff 5):
        // con 7 filas ya no cabía sin scroll — misma info, un tercio del alto.
        '<p class="onb-aviso-rojo">' +
          '<i data-lucide="alert-triangle" class="onb-aviso-rojo-ico"></i>' +
          '<span class="onb-aviso-rojo-txt">' + escapeHtml(t('onb_etiquetas_linea')) + '</span>' +
        '</p>' +
        '<button type="button" class="onb-btn-linea" data-action="persona-sin-alergias">' + escapeHtml(t('onb_sin_alergias')) + '</button>';
    }
    if (paso === 4) {
      return '<h2 class="onb-h2">' + escapeHtml(t('onb_gusta')) + '</h2>' +
        '<p class="onb-sub">' + t('onb_gusta_sub').replace('{me}', '<b class="onb-oro">' + escapeHtml(t('onb_me_encanta_min')) + '</b>').replace('{no}', '<b>' + escapeHtml(t('onb_mejor_no_min')) + '</b>') + '</p>' +
        '<div class="onb-aviso-oro"><span class="onb-aviso-oro-ico"><i data-lucide="sparkles"></i></span>' +
          '<span>' + escapeHtml(t('onb_aviso_gustos')) + '</span></div>' +
        GUSTOS_GRUPOS.map(function (g) {
          return '<p class="onb-eyebrow onb-eyebrow-grupo">' + escapeHtml(t(g.titulo)) + '</p>' + chipsGustos(draft.gustos, g.items);
        }).join('') +
        '<div class="onb-leyenda">' +
          '<span><span class="onb-leyenda-caja onb-leyenda-si"></span>' + escapeHtml(t('onb_me_encanta')) + '</span>' +
          '<span><span class="onb-leyenda-caja onb-leyenda-no"></span>' + escapeHtml(t('onb_mejor_no')) + '</span>' +
        '</div>';
    }
    return '<h2 class="onb-h2">' + escapeHtml(t('onb_comidas_tit')) + '</h2>' +
      '<p class="onb-sub">' + escapeHtml(t('onb_comidas_sub')) + '</p>' +
      '<p class="onb-eyebrow onb-eyebrow-grupo"><i data-lucide="sun" class="onb-eyebrow-ico onb-ico-oro"></i>' + escapeHtml(t('onb_comida_tipica')) + '</p>' +
      tarjetasPersona('pComida', PATRONES_COMIDA, draft.pComida || 'primero-segundo') +
      '<p class="onb-eyebrow onb-eyebrow-grupo"><i data-lucide="moon" class="onb-eyebrow-ico"></i>' + escapeHtml(t('onb_cena_tipica')) + '</p>' +
      tarjetasPersona('pCena', PATRONES_CENA, draft.pCena || 'ligera') +
      '<div class="onb-tarjeta-servicios">' +
        '<p class="onb-servicios-tit">' + escapeHtml(t('onb_dias_casa')) + '</p>' +
        '<p class="onb-servicios-sub">' + escapeHtml(t('onb_dias_casa_sub')) + '</p>' +
        gridServicios(draft) +
        '<div class="onb-atajos">' +
          '<button type="button" class="onb-atajo" data-action="persona-servicios-preset" data-preset="comidas-lv">' + escapeHtml(t('onb_atajo_lv')) + '</button>' +
          '<button type="button" class="onb-atajo" data-action="persona-servicios-preset" data-preset="finde">' + escapeHtml(t('onb_atajo_finde')) + '</button>' +
          '<button type="button" class="onb-atajo" data-action="persona-servicios-preset" data-preset="todo">' + escapeHtml(t('onb_atajo_todo')) + '</button>' +
        '</div>' +
        '<p class="onb-servicios-resumen">' + escapeHtml(resumenServicios(draft)) + '</p>' +
      '</div>';
  }

  function renderOnbPersona(paso, draft, numeroPersona) {
    var valido = pasoPersonaValido(paso, draft);
    return cabeceraPersona(paso, draft, numeroPersona) +
      '<div class="onb-scroll onb-scroll-paso" id="onb-scroll-paso"><div class="onb-cuerpo per">' + cuerpoPasoPersona(paso, draft) + '</div></div>' +
      '<div class="onb-pie">' +
        '<button type="button" class="onb-cta onb-cta-midnight' + (valido ? '' : ' onb-cta-off') + '" data-action="onb-persona-siguiente"' +
          (valido ? '' : ' aria-disabled="true"') + '>' + escapeHtml(t('onb_siguiente')) + '<i data-lucide="arrow-right"></i></button>' +
        (paso === 4 ? '<button type="button" class="onb-enlace onb-enlace-pie" data-action="onb-persona-siguiente">' + escapeHtml(t('onb_ahora_no')) + '</button>' : '') +
      '</div>';
  }

  // PASO 7 — ficha completa de la persona recién descrita: los 5 bloques
  // resumidos, con "Editar" que salta al paso correspondiente conservando lo
  // introducido, y la decisión de si viene otra persona o ya estamos todos.
  var BLOQUES_FICHA = [
    { clave: 'basicos', titulo: 'paso_basicos', icono: 'user', tono: 'mid', paso: 1 },
    { clave: 'estilo', titulo: 'paso_estilo', icono: 'salad', tono: 'oro', paso: 2 },
    { clave: 'alergias', titulo: 'paso_alergias', icono: 'shield-check', tono: 'rojo', paso: 3 },
    { clave: 'gustos', titulo: 'paso_gustos', icono: 'heart', tono: 'oro', paso: 4 },
    { clave: 'comidas', titulo: 'paso_comidas', icono: 'calendar-check', tono: 'mid', paso: 5 }
  ];

  function renderOnbFicha(draft, miembros) {
    var resumen = resumenPersona(draft);
    var foto = fotoSegura(draft.foto);
    var tarjetas = BLOQUES_FICHA.map(function (b) {
      return '<div class="onb-resumen' + (b.tono === 'rojo' ? ' onb-resumen-alerta' : '') + '">' +
        '<div class="onb-resumen-cab">' +
          '<span class="per-sec-ico per-sec-ico-' + b.tono + '"><i data-lucide="' + b.icono + '"></i></span>' +
          '<span class="onb-resumen-tit">' + escapeHtml(t(b.titulo)) + '</span>' +
          '<button type="button" class="onb-editar" data-action="onb-ficha-editar" data-paso="' + b.paso + '">' +
            '<i data-lucide="pencil"></i>' + escapeHtml(t('onb_editar')) + '</button>' +
        '</div>' +
        '<p class="onb-resumen-txt">' + escapeHtml(resumen[b.clave]) + '</p>' +
        '</div>';
    }).join('');

    var chipsMiembros = miembros.length
      ? '<div class="onb-yaestan"><p class="onb-eyebrow">' + escapeHtml(t('onb_ya_en_familia')) + '</p><div class="onb-yaestan-chips">' +
          miembros.map(function (m, i) {
            return '<span class="onb-miembro-chip">' +
              '<span class="onb-miembro-av" style="background-color:' + colorMiembro(i) + '">' + escapeHtml(iniciales(m.nombre)) + '</span>' +
              '<span>' + escapeHtml(m.nombre) + '</span>' +
              '<button type="button" class="onb-miembro-quitar" data-action="onb-quitar-miembro" data-id="' + m.id + '" aria-label="' + escapeHtml(t('onb_quitar_a').replace('{n}', m.nombre)) + '"><i data-lucide="x"></i></button>' +
              '</span>';
          }).join('') + '</div></div>'
      : '';

    return '<div class="onb-scroll"><div class="onb-ficha">' +
      '<div class="onb-ficha-cab">' +
        '<span class="onb-ficha-av"' + (foto ? ' style="background-image:url(\'' + foto + '\')"' : '') + '>' + (foto ? '' : escapeHtml(iniciales(draft.nombre))) + '</span>' +
        '<div><p class="onb-ficha-kicker">' + escapeHtml(t('onb_ficha_completa')) + '</p>' +
        '<h1 class="onb-ficha-nombre">' + escapeHtml((draft.nombre || '').trim() || t('onb_esta_persona')) + '</h1></div>' +
      '</div>' +
      '<div class="onb-resumenes">' + tarjetas + '</div>' +
      chipsMiembros +
      '<p class="onb-legal">' + escapeHtml(t('onb_legal')) + '</p>' +
      '<button type="button" class="onb-btn-otra" data-action="onb-anadir-otra"><i data-lucide="user-plus"></i>' + escapeHtml(t('onb_anadir_otra')) + '</button>' +
      '<button type="button" class="onb-cta onb-cta-oro" data-action="onb-terminar">' + escapeHtml(t('onb_ya_todos')) + '<i data-lucide="arrow-right"></i></button>' +
      '</div></div>';
  }

  // PASO 8 — cierre. Peak-end rule (UI_MOBILE §1): es el momento que la familia
  // recuerda, junto con la portada.
  function renderOnbFin(nombreFamilia, miembros) {
    var primero = (miembros[0] && miembros[0].nombre) || '';
    var raciones = miembros.length + ' ' + t(miembros.length === 1 ? 'persona_sing' : 'persona_plur');
    return '<div class="onb-fin">' +
      '<span class="onb-fin-check"><i data-lucide="check"></i></span>' +
      '<h1 class="onb-fin-tit">' + escapeHtml(t('onb_fin_tit').replace('{n}', primero ? ', ' + primero : '')) + '</h1>' +
      '<p class="onb-fin-sub">' + escapeHtml(t('onb_fin_sub').replace('{f}', (nombreFamilia || '').trim() || t('onb_tu_familia')).replace('{r}', raciones)) + '</p>' +
      '<button type="button" class="onb-cta onb-cta-oro" data-action="onb-ver-semana">' + escapeHtml(t('onb_ver_semana')) + '<i data-lucide="arrow-right"></i></button>' +
      '</div>';
  }

  // Vetos por ingrediente — el ÚNICO mecanismo de exclusión dura que el motor v3
  // consume hoy (engine.vetosDe). El handoff no lo dibuja porque su prototipo no
  // tenía banco detrás; se conserva dentro del bloque Alergias de la ficha, que
  // es su sitio semántico, para que el rediseño no deje a una familia con
  // alergia real sin la herramienta que sí funciona. Cuando dietas.js entre en
  // el motor, este grid es lo primero que puede desaparecer.
  // Rejilla sobre el banco V6: `alimentos` agrupados por `naturaleza`. Los ids que escribe son
  // ids reales del banco y el contrato de familia los pasa tal cual como veto duro; un id que
  // no case es AVISO, no error (`contrato_familia.js`: un gusto que no casa es una preferencia
  // que no se aplica; una alergia que no casa es un niño comiendo su alérgeno).
  var ORDEN_NATURALEZA = ['vegetal', 'carne', 'pescado', 'marisco', 'huevo', 'lacteo', 'cereal', 'grasa', 'condimento'];
  function chipVeto(miembroId, id, nombre, marcado) {
    // el estado visual del chip marcado lo lleva .veto-chip:has(input:checked) en CSS
    return '<label class="veto-chip">' +
      '<input type="checkbox" data-action="toggle-veto" data-id="' + miembroId + '" data-ingrediente="' + id + '" ' + (marcado ? 'checked' : '') + '> ' + escapeHtml(nombre) +
      '</label>';
  }

  function renderVetos(miembro, banco) {
    var vetos = miembro.vetos || [];
    var porNat = {};
    alimentosOrdenados(banco).forEach(function (a) { (porNat[a.naturaleza] = porNat[a.naturaleza] || []).push(a); });
    return ORDEN_NATURALEZA.filter(function (n) { return porNat[n]; }).map(function (n) {
      var chips = porNat[n].map(function (a) { return chipVeto(miembro.id, a.id, a.nombre, vetos.indexOf(a.id) !== -1); }).join('');
      return '<p class="onb-eyebrow onb-eyebrow-grupo">' + escapeHtml(t('nat_' + n)) + '</p>' +
        '<div class="vetos-grid">' + chips + '</div>';
    }).join('');
  }

  // Selector de idioma (handoff backlog-v3 #19, 2026-07-28): dos puntos de entrada,
  // menú hamburguesa y último campo de la ficha de miembro — opcionesIdioma() alimenta
  // el <select> de la ficha, renderSheetIdioma() la hoja completa con banderas.
  function opcionesIdioma() {
    var actual = I18N.getLang();
    return I18N.LANGUAGES.map(function (l) {
      return '<option value="' + l.code + '"' + (l.code === actual ? ' selected' : '') + '>' + escapeHtml(l.name) + '</option>';
    }).join('');
  }

  function bandaEstilo(l) {
    return l.code === 'en'
      ? 'background-color:' + I18N.FLAG_EN_BG_COLOR + ';background-image:' + I18N.FLAG_EN_BG_IMAGE
      : 'background-image:' + l.flag;
  }

  function renderSheetIdioma() {
    var actual = I18N.getLang();
    var filas = I18N.LANGUAGES.map(function (l) {
      var activo = l.code === actual;
      return '<button type="button" class="idioma-fila" data-action="elegir-idioma" data-lang="' + l.code + '" aria-pressed="' + activo + '">' +
        '<span class="idioma-bandera" style="' + bandaEstilo(l) + '"></span>' +
        '<span class="idioma-nombre">' + escapeHtml(l.name) + '</span>' +
        '<span class="idioma-check' + (activo ? ' idioma-check-activo' : '') + '" aria-hidden="true">' + (activo ? '✓' : '') + '</span>' +
        '</button>';
    }).join('');
    return sheetHead(t('idioma_titulo')) +
      '<div class="sheet-body">' +
      '<p class="detalle-subtitulo">' + t('idioma_subtitulo') + '</p>' +
      '<div class="idioma-lista">' + filas + '</div>' +
      '<button type="button" class="btn-cta-gradiente" data-action="cerrar-sheet">' + t('hecho') + '</button>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Ficha de persona dentro de la app (pestaña Familia) — handoff "Alta de
  // persona" 2026-07-30: LOS MISMOS 5 bloques del asistente, resumidos y
  // desplegables, para editar cualquier dato sin salir de la ficha. Solo uno
  // abierto a la vez. Sustituye a la ficha plana de campos sueltos del handoff
  // anterior (19-jul): mismos datos, misma fontanería de guardado, otra forma.
  //
  // A diferencia del asistente, aquí se edita un BORRADOR (personaDraft en
  // app.js) y se confirma con "Guardar cambios" — el prototipo lo pidió así
  // (ajuste de Roger recogido en el README del handoff): guardar NO saca de la
  // ficha, cierra el bloque abierto y deja seguir editando otros.
  // ---------------------------------------------------------------
  function bloqueFicha(b, abierto, resumen, cuerpo) {
    var chevron = abierto ? 'chevron-up' : 'chevron-down';
    return '<div class="per-sec' + (b.tono === 'rojo' ? ' per-sec-alerta' : '') + '">' +
      '<button type="button" class="per-sec-cab" data-action="ficha-toggle-sec" data-sec="' + b.paso + '" aria-expanded="' + abierto + '">' +
        '<span class="per-sec-ico per-sec-ico-' + b.tono + '"><i data-lucide="' + b.icono + '"></i></span>' +
        '<span class="per-sec-txt"><span class="per-sec-tit">' + escapeHtml(t(b.titulo)) + '</span>' +
        '<span class="per-sec-res">' + escapeHtml(resumen) + '</span></span>' +
        '<i data-lucide="' + chevron + '" class="per-sec-chev"></i>' +
      '</button>' +
      (abierto ? '<div class="per-sec-cuerpo">' + cuerpo + '</div>' : '') +
      '</div>';
  }

  function renderVistaMiembro(estado, banco, draft, opciones) {
    opciones = opciones || {};
    if (!draft) {
      return '<div class="mf-cabecera"><button type="button" class="rv-flotante rv-volver" data-action="miembro-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button></div>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos a este miembro.</p></div>';
    }
    var sec = opciones.seccion || null;
    var esNueva = !!opciones.esNueva;
    var resumen = resumenPersona(draft);
    var foto = fotoSegura(draft.foto);
    var esDispositivo = !esNueva && draft.id && draft.id === opciones.miembroDispositivoId;
    var anioActual = new Date().getFullYear();

    var cuerpos = {
      1: '<label class="per-campo"><span class="onb-eyebrow">' + t('nombre') + '</span>' +
           '<input type="text" class="per-input" data-persona-campo="nombre" maxlength="30" placeholder="Nombre" value="' + escapeHtml(draft.nombre || '') + '" autocomplete="off"></label>' +
         '<label class="per-campo"><span class="onb-eyebrow">' + t('ano_de_nacimiento') + '</span>' +
           '<input type="number" inputmode="numeric" class="per-input" data-persona-campo="anioNacimiento" min="1920" max="' + anioActual + '" placeholder="' + escapeHtml(t('onb_ph_anio')) + '" value="' + (draft.anioNacimiento || '') + '"></label>' +
         avisoInfo(t(claveAvisoMedidas(draft.anioNacimiento))) +
         '<div class="per-campo"><span class="onb-eyebrow">Sexo</span>' + pildorasPersona('sexo', OPCIONES_SEXO, draft.sexo || 'mujer') + '</div>' +
         '<div class="onb-fila-2">' +
           '<label class="per-campo"><span class="onb-eyebrow">Altura (cm)</span>' +
             '<input type="number" inputmode="numeric" class="per-input" data-persona-campo="altura" min="30" max="230" placeholder="—" value="' + (draft.altura || '') + '"></label>' +
           '<label class="per-campo"><span class="onb-eyebrow">Peso (kg)</span>' +
             '<input type="number" inputmode="numeric" class="per-input" data-persona-campo="peso" min="1" max="200" placeholder="—" value="' + (draft.peso || '') + '"></label>' +
         '</div>' +
         (pideActividadYObjetivo(draft.anioNacimiento)
           ? '<div class="per-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_actividad')) + '</span>' +
             pildorasPersona('actividad', OPCIONES_ACTIVIDAD, draft.actividad || 'media') + '</div>' +
             '<div class="per-campo"><span class="onb-eyebrow">' + escapeHtml(t('onb_objetivo')) + '</span>' +
             pildorasPersona('objetivo', OPCIONES_OBJETIVO_PERSONA, draft.objetivo || 'mantenimiento') + '</div>'
           : avisoInfo(t('aviso_menor_sin_actividad_objetivo'))),
      2: tarjetasPersona('estilo', ESTILOS_VIDA, estiloDeMiembro(draft)),
      3: listaAlergias(draft.alergias, false) +
         '<label class="per-campo"><span class="onb-eyebrow">Otras restricciones</span>' +
           '<input type="text" class="per-input" data-persona-campo="restricciones" maxlength="80" placeholder="' + t('ninguna') + '" value="' + escapeHtml(draft.restricciones || '') + '"></label>' +
         '<p class="onb-eyebrow onb-eyebrow-grupo">Ingredientes que nunca entran</p>' +
         '<p class="per-nota">Lo único que el motor excluye hoy plato a plato. Lo de arriba queda en su ficha.</p>' +
         (draft.id ? renderVetos(draft, banco) : '<p class="per-nota">Se podrán marcar en cuanto guardes la ficha.</p>'),
      4: '<p class="per-nota">Toca una vez para <b class="onb-oro">me encanta</b>, dos para <b>mejor no</b>.</p>' +
         GUSTOS_GRUPOS.map(function (g) {
           return '<p class="onb-eyebrow onb-eyebrow-grupo">' + escapeHtml(t(g.titulo)) + '</p>' + chipsGustos(draft.gustos, g.items);
         }).join('') +
         '<label class="per-campo"><span class="onb-eyebrow">' + t('le_gusta') + '</span>' +
           '<input type="text" class="per-input" data-persona-campo="leGusta" maxlength="120" placeholder="' + t('platos_favoritos') + '" value="' + escapeHtml(draft.leGusta || '') + '"></label>' +
         '<label class="per-campo"><span class="onb-eyebrow">' + t('no_le_gusta') + '</span>' +
           '<input type="text" class="per-input" data-persona-campo="noLeGusta" maxlength="120" placeholder="' + t('ingredientes_a_evitar') + '" value="' + escapeHtml(draft.noLeGusta || '') + '"></label>',
      5: '<p class="onb-eyebrow onb-eyebrow-grupo">Su comida típica</p>' +
         tarjetasPersona('pComida', PATRONES_COMIDA, draft.pComida || 'primero-segundo') +
         '<p class="onb-eyebrow onb-eyebrow-grupo">Su cena típica</p>' +
         tarjetasPersona('pCena', PATRONES_CENA, draft.pCena || 'ligera') +
         '<p class="onb-eyebrow onb-eyebrow-grupo">¿Qué días come en casa?</p>' +
         gridServicios(draft) +
         '<p class="onb-servicios-resumen">Planificamos ' + serviciosEnCasa(draft) + ' de 14 servicios en casa.</p>'
    };

    var bloques = BLOQUES_FICHA.map(function (b) {
      return bloqueFicha(b, sec === b.paso, resumen[b.clave], cuerpos[b.paso]);
    }).join('');

    return '<div class="mf-cabecera">' +
      '<button type="button" class="rv-flotante rv-volver" data-action="miembro-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
      '<span class="per-cab-kicker">' + (esNueva ? t('nuevo_miembro') : 'Editar ficha') + '</span>' +
      '</div>' +
      '<div class="vista-body rc-body mf-body per per-densa">' +
      '<div class="per-identidad">' +
        '<button type="button" class="per-foto" data-action="persona-foto" aria-label="' + (foto ? 'Cambiar foto' : 'Añadir foto') + '"' +
          (foto ? ' style="background-image:url(\'' + foto + '\')"' : ' style="background-color:' + (opciones.color || 'var(--gold)') + '"') + '>' +
          (foto ? '' : '<span class="per-foto-inicial">' + escapeHtml(iniciales(draft.nombre)) + '</span>') +
          '<span class="per-foto-badge" aria-hidden="true"><i data-lucide="camera"></i></span>' +
        '</button>' +
        '<input type="file" id="onb-foto-input" accept="image/*" hidden>' +
        '<h1 class="per-identidad-nombre">' + escapeHtml((draft.nombre || '').trim() || t('nuevo_miembro')) + '</h1>' +
      '</div>' +
      '<div class="per-secs">' + bloques + '</div>' +
      '<div class="per-campo per-campo-suelto"><span class="onb-eyebrow">' + t('idioma_campo') + '</span>' +
        '<span class="onb-select-wrap"><select class="per-input" id="mf-idioma-app">' + opcionesIdioma() + '</select>' +
        '<i data-lucide="chevron-down" aria-hidden="true"></i></span></div>' +
      '<button type="button" class="per-guardar" data-action="ficha-guardar"><i data-lucide="check"></i>' +
        (esNueva ? 'Crear miembro' : 'Guardar cambios') + '</button>' +
      (opciones.guardado ? '<p class="per-guardado"><i data-lucide="check-circle-2"></i>Cambios guardados · puedes seguir editando otros bloques</p>' : '') +
      '<button type="button" class="per-guardar-volver" data-action="ficha-guardar-volver"><i data-lucide="arrow-left"></i>Guardar y volver a la familia</button>' +
      (esNueva ? '' :
        '<button type="button" class="chip-toggle mf-dispositivo' + (esDispositivo ? ' chip-toggle-activo' : '') + '" data-action="marcar-yo-dispositivo" data-id="' + draft.id + '" aria-pressed="' + esDispositivo + '">' +
          (esDispositivo ? '✓ Eres tú en este móvil' : 'Marcar como tú en este móvil') + '</button>' +
        '<button type="button" class="per-eliminar" data-action="borrar-miembro" data-id="' + draft.id + '"><i data-lucide="trash-2"></i>' + t('eliminar_miembro') + '</button>') +
      '</div>';
  }

  // Menú hamburguesa (Roger 2026-07-14): dropdown pequeño anclado al botón
  // (arriba izquierda, donde se toca) — no el sheet grande de abajo. Reservado
  // para listas cortas de acciones; el sheet de abajo sigue siendo para
  // pantallas con contenido real (Familia, nevera, receta...).
  // ── VERSIÓN DEL PRODUCTO · fuente única. Dictado de Roger (3-ago): la versión y su fecha
  //    SIEMPRE visibles en Acerca de, y cada deploy suma un patch (6.0.0 → 6.0.1 → 6.0.2…).
  //    Se sube A MANO en el mismo commit que despliega: si se automatizara con la fecha del
  //    build, dejaría de decir «qué versión estoy usando» y pasaría a decir «cuándo se compiló».
  //    6.1.0 y no 6.0.3: el handoff 6 no es un parche, cambia la superficie que ve el usuario el
  //    primer día — LAUNCH sustituye a la portada rotatoria, y Sign in / Email y contraseña /
  //    Revisa tu correo / Familia se repintan enteras (4-ago-2026).
  var VERSION_APP = '6.8.1';
  var VERSION_FECHA = '04/08/2026';

  function renderAcercaDe() {
    return '<section class="pantalla pantalla-acerca">' +
      '<header class="cab-simple"><button type="button" class="btn-volver" data-action="volver-semana" aria-label="' + t('volver') + '"><i data-lucide="chevron-left"></i></button>' +
      '<h1>' + t('acerca_titulo') + '</h1></header>' +
      // el <img> de aquí apuntaba a assets/logo-e3foods.png, que NO existe (404 en cada apertura
      // de esta pantalla desde que se creó el 3-ago). El logotipo ya vive como texto en la
      // app-bar, con su tipografía de marca: se reutiliza en vez de pedir un fichero que no hay.
      '<div class="acerca-marca"><p class="app-bar-logo acerca-logo">' +
        '<span class="app-bar-logo-e3">e3</span><span class="app-bar-logo-foods">foods</span></p></div>' +
      '<p class="acerca-claim">' + t('acerca_claim') + '</p>' +
      '<dl class="acerca-datos">' +
        '<div><dt>' + t('acerca_version') + '</dt><dd class="acerca-version">v' + VERSION_APP + '</dd></div>' +
        '<div><dt>' + t('acerca_fecha') + '</dt><dd>' + VERSION_FECHA + '</dd></div>' +
        '<div><dt>' + t('acerca_motor') + '</dt><dd>' + (window.E3MotorV6 ? 'V6 · ' + window.E3MotorV6.VERSION : 'v5') + '</dd></div>' +
        '<div><dt>' + t('acerca_banco') + '</dt><dd>' + ((window.E3_BANCO_V6 && window.E3_BANCO_V6.elaboraciones) ? window.E3_BANCO_V6.elaboraciones.length + ' ' + t('acerca_platos') : '—') + '</dd></div>' +
      '</dl>' +
      '<p class="acerca-pie">' + t('acerca_pie') + '</p>' +
      '</section>';
  }

  function renderMenuHamburguesa(conCuenta) {
    // «Regenerar menús» muere bajo v5 (dictado Roger 31-jul, obra de encendido): su única
    // función real —aplicar cambios de estado— es ahora automática (miembros/elecciones
    // regeneran solos), y el re-roll por re-roll era un spin de lotería que el selector
    // determinista no admite. En v3 (red de seguridad inerte) se conserva.
    return '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-ir-familia"><i data-lucide="users"></i>' + t('familia') + '</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-ir-batch"><i data-lucide="chef-hat"></i>' + t('domingo_de_batch') + '</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-sync"><i data-lucide="refresh-cw"></i>' + t('sincronizar_familia') + '</button>' +
      (conCuenta ? '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-cuenta"><i data-lucide="user-round"></i>' + t('cta_cuenta') + '</button>' : '') +
      '<div class="menu-dropdown-sep" role="separator"></div>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-importar-cole"><i data-lucide="paperclip"></i>Importar menú del cole</button>' +
      '<div class="menu-dropdown-sep" role="separator"></div>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-ir-idioma"><i data-lucide="languages"></i>' + t('idioma_titulo') + '</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-acerca-de"><i data-lucide="info"></i>' + t('acerca_titulo') + '</button>';
  }

  // ---------------------------------------------------------------
  // CUENTAS (obra auth+push, AUTH_PUSH_SPEC §1-§3 — ejecutada 31-jul; separada en dos
  // pantallas en el handoff 6, 2026-08-03: Onboarding.dc.html trae "Entrar / Crear"
  // (elegir vía) y "Email y contraseña" como pasos independientes, no una sola pantalla
  // combinada — máx. 1 decisión por pantalla. Los errores SIEMPRE genéricos
  // (anti-enumeración §7.1). El "mira un ejemplo" sigue sin cuenta (dictado §12.2).
  //
  // La casilla de política (AUTH_PUSH_SPEC §1.5: obligatoria al crear cuenta, CUALQUIER
  // proveedor) no está en el mock de la pantalla 1 — el mock la deja solo en la de email
  // ("Prototipo: cualquier vía entra. La validación real vive en el repo."). Como Google
  // se dispara DESDE la pantalla 1 y no hay pantalla intermedia para esa vía, la casilla
  // se repite aquí en modo crear: mismo id `ac-politica`, nunca las dos pantallas a la vez
  // en el DOM, así que 'acceso-google' (que la busca por id) sigue funcionando sin tocarlo.
  // ---------------------------------------------------------------
  // Checkbox 22×22 "idéntico" en política (03-email-password.md) y salud (04-familia.md):
  // <input> real (mantiene el id y `.checked` que leen los handlers de app.js — el handoff
  // dibuja un <button> propio, pero eso rompería 'ac-politica'/`getElementById(...).checked`)
  // con appearance ocultada y la caja dorada pintada encima vía :checked ~ .h6-check-box.
  function politicaCheckbox() {
    return '<label class="h6-check" style="margin-top:22px">' +
      '<input type="checkbox" id="ac-politica" class="h6-check-input">' +
      '<span class="h6-check-box" aria-hidden="true"><i data-lucide="check" style="width:13px;height:13px;stroke-width:3.5"></i></span>' +
      '<span class="h6-check-txt">' + escapeHtml(t('ac_politica_acepto')) + ' <a href="privacy.html" target="_blank" rel="noopener">' + escapeHtml(t('politica_enlace_min')) + '</a></span>' +
      '</label>';
  }

  // cabecera compartida de las dos pantallas de acceso (handoff 6, 02-signin.md /
  // 03-email-password.md §3.1): círculo 38×38 + título centrado, margin-right:38px
  // compensa el círculo — no quitarlo o el título deja de estar centrado de verdad.
  function cabeceraAcceso(accionAtras, dataModo, titulo) {
    return '<div class="h6-acceso-cab">' +
      '<button type="button" class="h6-acceso-atras" data-action="' + accionAtras + '"' + (dataModo ? ' data-modo="' + dataModo + '"' : '') +
      ' aria-label="' + escapeHtml(t('onb_volver')) + '"><i data-lucide="arrow-left"></i></button>' +
      '<span class="h6-acceso-titulo">' + escapeHtml(titulo) + '</span>' +
      '</div>';
  }

  // ===== Pantalla 1 · Sign in / Crear cuenta — elegir vía (handoff 6, 02-signin.md) =====
  function renderAccesoElegir(pantalla, error, aviso) {
    var esCrear = pantalla === 'crear';
    var titulo = t(esCrear ? 'ac_crear_cuenta' : 'ac_entrar');
    // Sin .onb-scroll envolvente: el div raíz YA es position:absolute;inset:0 (spec) y trae
    // su propio overflow — un .onb-scroll fuera quedaría inerte (el hijo absolute no aporta
    // altura a su flujo normal). Distinto de renderOnbNombreFamilia, que sí lo necesita.
    return '<div class="h6-acceso">' +
      cabeceraAcceso('acceso-portada', null, titulo) +
      '<div class="h6-acceso-centro">' +
      '<div class="h6-acceso-logo-wrap">' +
      '<img src="assets/logo-noleaves.png" alt="e3foods" class="h6-acceso-logo-base">' +
      '<img src="assets/leaf-navy.png" alt="" class="h6-acceso-hoja" style="left:90px;top:2.4px;width:13.9px;height:auto;animation:e3sf0 1.5s linear .15s both">' +
      '<img src="assets/leaf-gold.png" alt="" class="h6-acceso-hoja" style="left:101.3px;top:17.2px;width:21.8px;height:auto;animation:e3sf1 1.5s linear .35s both">' +
      '<img src="assets/leaf-gold2.png" alt="" class="h6-acceso-hoja" style="left:96.3px;top:33.6px;width:17.5px;height:auto;animation:e3sf2 1.5s linear .55s both">' +
      '</div>' +
      '<div class="h6-acceso-sub">' + t('ac_subtitulo') + '</div>' +
      '</div>' +
      '<div class="h6-acceso-pie">' +
      '<button type="button" class="h6-btn h6-btn-oro" data-action="acceso-ir-mail" data-modo="' + (esCrear ? 'crear' : 'entrar') + '">' +
        '<span class="h6-btn-chip h6-btn-chip-oro"><i data-lucide="mail" style="width:15px;height:15px"></i></span>' +
        '<span class="h6-btn-label h6-btn-label-oro">' + escapeHtml(t(esCrear ? 'ac_crear_con_email' : 'ac_entrar_con_email')) + '</span>' +
        '</button>' +
      // Marcas reales (handoff 5 §3, conservado en handoff 6): Google navega de verdad;
      // Apple queda deshabilitado con su marca real + "pronto" (sin proveedor en Firebase Auth).
      '<button type="button" class="h6-btn h6-btn-midnight" data-action="acceso-google">' +
        '<span class="h6-btn-chip h6-btn-chip-blanco">' + ICONO_GOOGLE + '</span>' +
        '<span class="h6-btn-label h6-btn-label-midnight">' + escapeHtml(t('ac_continuar_google')) + '</span>' +
        '</button>' +
      '<button type="button" class="h6-btn-apple" disabled aria-disabled="true">' +
        '<span class="h6-btn-apple-fila">' + ICONO_APPLE + '<span class="h6-btn-apple-txt">' + escapeHtml(t('ac_continuar_apple')) + '</span></span>' +
        '<span class="h6-btn-apple-pronto">' + escapeHtml(t('ac_apple_pronto')) + '</span>' +
        '</button>' +
      // La casilla de política NO está en el mock de esta pantalla (02-signin.md), pero
      // Google se dispara DESDE aquí sin pantalla intermedia — en modo crear el consentimiento
      // RGPD (AUTH_PUSH_SPEC §1.5) tiene que poder darse antes de ese tap. Mismo id `ac-politica`
      // que en la pantalla de email: nunca coinciden las dos en el DOM a la vez.
      (esCrear ? politicaCheckbox() : '') +
      (error ? '<p class="h6-error">' + escapeHtml(error) + '</p>' : '') +
      (aviso ? '<p class="h6-aviso">' + escapeHtml(aviso) + '</p>' : '') +
      '<button type="button" class="h6-link-gold" style="margin-top:4px" data-action="acceso-toggle" data-modo="' + (esCrear ? 'entrar' : 'crear') + '">' + escapeHtml(t(esCrear ? 'ac_ya_tienes' : 'ac_no_tienes')) + '</button>' +
      '<button type="button" class="h6-link-muted" style="padding:2px" data-action="ver-demo">' + escapeHtml(t('onb_ejemplo')) + '</button>' +
      '</div></div>';
  }

  // ===== Pantalla 2 · Email y contraseña (handoff 6, 03-email-password.md §3.1) =====
  function renderAccesoMail(pantalla, error, aviso) {
    var esCrear = pantalla === 'crear-mail';
    var titulo = t(esCrear ? 'ac_crear_cuenta' : 'ac_entrar');
    return '<div class="h6-mailpass"><div class="h6-mailpass-inner">' +
      cabeceraAcceso('acceso-volver-elegir', esCrear ? 'crear' : 'entrar', titulo) +
      '<div class="h6-mailpass-body">' +
      '<label style="display:block"><span class="h6-eyebrow">' + escapeHtml(t('ac_email')) + '</span>' +
        '<input type="email" class="h6-input-line" id="ac-email" placeholder="tu@email.com" autocomplete="email" inputmode="email"></label>' +
      '<div style="height:20px"></div>' +
      '<label style="display:block"><span class="h6-eyebrow">' + escapeHtml(t('ac_password')) + '</span>' +
        '<input type="password" class="h6-input-line" id="ac-pass" placeholder="' + (esCrear ? escapeHtml(t('pass_min')) : '') + '" autocomplete="' + (esCrear ? 'new-password' : 'current-password') + '"></label>' +
      (esCrear ? politicaCheckbox() : '') +
      (error ? '<p class="h6-error">' + escapeHtml(error) + '</p>' : '') +
      (aviso ? '<p class="h6-aviso">' + escapeHtml(aviso) + '</p>' : '') +
      '<button type="button" class="h6-cta h6-cta-r100 h6-cta-oro14" style="margin-top:26px" data-action="acceso-enviar" data-modo="' + (esCrear ? 'crear' : 'entrar') + '">' +
        '<span class="h6-cta-txt">' + escapeHtml(titulo) + '</span><i data-lucide="arrow-right"></i></button>' +
      '<div style="flex:1;min-height:16px"></div>' +
      '<button type="button" class="h6-link-gold" data-action="acceso-toggle" data-modo="' + (esCrear ? 'entrar-mail' : 'crear-mail') + '">' + escapeHtml(t(esCrear ? 'ac_ya_tienes' : 'ac_no_tienes')) + '</button>' +
      (esCrear ? '' : '<button type="button" class="h6-link-muted" style="padding:4px" data-action="acceso-olvide">' + escapeHtml(t('ac_olvide')) + '</button>') +
      '</div></div></div>';
  }

  // ===== Revisa tu correo (handoff 6, 03-email-password.md §3.2) =====
  function renderRevisaCorreo(email, aviso) {
    return '<div class="h6-verify"><div class="h6-verify-body">' +
      '<span class="h6-verify-badge"><i data-lucide="mail-check"></i>' + escapeHtml(t('ver_badge')) + '</span>' +
      '<div class="h6-verify-titulo">' + escapeHtml(t('ver_titulo')) + '</div>' +
      // "{email}" en <strong> (color por CSS, .h6-verify-texto strong); sin email, ver_sin_email
      // ("tu correo") — el prototipo del handoff no cubre este caso, la app real sí puede darlo
      // (recarga tras perder la sesión, por ejemplo).
      '<div class="h6-verify-texto">' + t('ver_texto').replace('{email}', '<strong>' + escapeHtml(email || t('ver_sin_email')) + '</strong>') + '</div>' +
      (aviso ? '<p class="h6-aviso">' + escapeHtml(aviso) + '</p>' : '') +
      '<button type="button" class="h6-cta h6-cta-r15 h6-cta-oro12" style="margin-top:26px" data-action="verificar-recargar">' +
        '<span class="h6-cta-txt">' + escapeHtml(t('ver_ya')) + '</span><i data-lucide="arrow-right"></i></button>' +
      '<div style="flex:1;min-height:20px"></div>' +
      '<button type="button" class="h6-link-gold" data-action="verificar-reenviar">' + escapeHtml(t('ver_reenviar')) + '</button>' +
      '<button type="button" class="h6-link-muted" style="padding:6px" data-action="acceso-logout">' + escapeHtml(t('cta_cerrar_sesion')) + '</button>' +
      '</div></div>';
  }

  function renderOlvidePassword(enviado) {
    return '<div class="onb-scroll"><div class="onb-cuerpo" style="max-width:420px;margin:0 auto;padding-top:48px">' +
      '<h1 class="onb-h2">' + t('rec_titulo') + '</h1>' +
      '<p class="onb-sub">' + t('rec_texto') + '</p>' +
      '<label class="per-campo"><span class="onb-eyebrow">' + t('ac_email') + '</span>' +
        '<input type="email" class="per-input" id="rec-email" autocomplete="email" inputmode="email"></label>' +
      (enviado ? '<p class="card-msg">' + t('rec_texto') + '</p>' : '') +
      '<button type="button" class="onb-cta onb-cta-oro" data-action="recuperar-enviar" style="margin-top:14px">' + t('rec_enviar') + '<i data-lucide="arrow-right"></i></button>' +
      '<button type="button" class="onb-enlace onb-enlace-pie" data-action="acceso-volver">' + t('ac_ya_tienes') + '</button>' +
      '</div></div>';
  }

  // Paso de familia (§1.3): crear (nombre + consentimiento explícito de salud, art. 9 —
  // checkbox PROPIO, nunca fusionado con la política) o unirse por código.
  function renderPasoFamilia(error) {
    return '<div class="onb-scroll"><div class="onb-cuerpo" style="max-width:420px;margin:0 auto;padding-top:48px">' +
      '<h1 class="onb-h2">' + t('fam_titulo') + '</h1>' +
      '<div class="onb-tarjeta-servicios" style="margin-top:12px">' +
      '<p class="onb-servicios-tit">' + t('fam_crear') + '</p>' +
      '<label class="per-campo"><span class="onb-eyebrow">' + t('fam_nombre') + '</span>' +
        '<input type="text" class="per-input" id="fam-nombre" maxlength="40"></label>' +
      '<label class="veto-chip" style="display:flex;gap:8px;align-items:flex-start;margin-top:12px"><input type="checkbox" id="fam-consent" style="margin-top:3px">' +
        '<span>' + t('fam_consent_salud') + '</span></label>' +
      '<button type="button" class="onb-cta onb-cta-oro" data-action="familia-crear" style="margin-top:12px">' + t('fam_crear') + '<i data-lucide="arrow-right"></i></button>' +
      '</div>' +
      '<div class="onb-tarjeta-servicios" style="margin-top:16px">' +
      '<p class="onb-servicios-tit">' + t('fam_unirse_titulo') + '</p>' +
      '<label class="per-campo"><span class="onb-eyebrow">' + t('codigo') + '</span>' +
        '<input type="text" class="per-input" id="fam-codigo" maxlength="8" autocapitalize="characters" autocomplete="off" placeholder="' + t('8_caracteres') + '"></label>' +
      '<button type="button" class="onb-cta onb-cta-midnight" data-action="familia-unirse" style="margin-top:12px">' + t('unirme_con_el_codigo') + '</button>' +
      '</div>' +
      (error ? '<p class="card-msg" style="color:var(--danger);margin-top:10px">' + escapeHtml(error) + '</p>' : '') +
      '<button type="button" class="onb-enlace onb-enlace-pie" data-action="acceso-logout">' + t('cta_cerrar_sesion') + '</button>' +
      '</div></div>';
  }

  function renderCodigoFamilia(code) {
    return '<div class="onb-scroll"><div class="onb-cuerpo" style="max-width:420px;margin:0 auto;padding-top:48px;text-align:center">' +
      '<span class="onb-fin-check"><i data-lucide="check"></i></span>' +
      '<h1 class="onb-h2">' + t('fam_codigo_titulo') + '</h1>' +
      '<p class="sync-code" style="font-size:32px;letter-spacing:4px;margin:12px 0">' + escapeHtml(code || '') + '</p>' +
      '<p class="onb-sub">' + t('fam_codigo_texto') + '</p>' +
      '<button type="button" class="onb-cta onb-cta-oro" data-action="familia-codigo-continuar" style="margin-top:14px">' + t('fam_continuar') + '<i data-lucide="arrow-right"></i></button>' +
      '</div></div>';
  }

  // Ajustes de cuenta (sheet, §2/§5.4): email + cambiar contraseña (solo proveedor
  // password) + cerrar sesión + salir de familia + borrar cuenta (confirmación escrita).
  function renderSheetCuenta(info, opts) {
    opts = opts || {};
    var proveedorPass = info && info.proveedor === 'password';
    if (opts.confirmarBorrado) {
      return sheetHead(t('cta_borrar_cuenta')) + '<div class="sheet-body">' +
        '<p class="card-msg">' + t('rec_texto').replace('{email}', '') + '</p>' +
        '<p class="card-msg">Escribe <strong>BORRAR</strong> para confirmar:</p>' +
        '<label><span class="campo-eyebrow">Confirmación</span><input type="text" id="cuenta-borrar-input" class="input-editorial" placeholder="BORRAR" autocapitalize="characters" autocomplete="off"></label>' +
        (opts.error ? '<p class="card-msg" style="color:var(--danger)">' + escapeHtml(opts.error) + '</p>' : '') +
        '<button type="button" class="btn-secondary btn-icono-texto btn-danger-outline" data-action="cuenta-borrar-confirmar"><i data-lucide="trash-2"></i>' + t('cta_borrar_cuenta') + '</button>' +
        '<button type="button" class="btn-texto" data-action="menu-cuenta">Cancelar</button>' +
        '</div>';
    }
    return sheetHead(t('cta_cuenta')) + '<div class="sheet-body">' +
      '<p class="card-msg"><strong>' + escapeHtml(info && info.email || '') + '</strong>' +
      (proveedorPass ? '' : ' · Google') + '</p>' +
      (opts.aviso ? '<p class="card-msg">' + escapeHtml(opts.aviso) + '</p>' : '') +
      (opts.error ? '<p class="card-msg" style="color:var(--danger)">' + escapeHtml(opts.error) + '</p>' : '') +
      (proveedorPass
        ? '<details class="receta-propia-form" data-detalle-key="cuenta-pass"><summary>' + t('cta_cambiar_pass') + '</summary>' +
          '<div class="form-miembro">' +
          '<label>' + t('ac_password') + '<input type="password" id="cuenta-pass-actual" autocomplete="current-password"></label>' +
          '<label>' + t('cta_cambiar_pass') + ' (' + t('pass_min') + ')<input type="password" id="cuenta-pass-nueva" autocomplete="new-password"></label>' +
          '<button type="button" class="btn-primary" data-action="cuenta-cambiar-pass">' + t('cta_cambiar_pass') + '</button>' +
          '</div></details>'
        : '') +
      '<button type="button" class="btn-secondary btn-icono-texto" data-action="cuenta-logout"><i data-lucide="log-out"></i>' + t('cta_cerrar_sesion') + '</button>' +
      '<button type="button" class="btn-secondary btn-icono-texto" data-action="cuenta-salir-familia"><i data-lucide="door-open"></i>' + t('cta_salir_familia') + '</button>' +
      '<button type="button" class="btn-secondary btn-icono-texto btn-danger-outline" data-action="cuenta-borrar"><i data-lucide="trash-2"></i>' + t('cta_borrar_cuenta') + '</button>' +
      '<p class="card-msg"><a href="privacy.html" target="_blank" rel="noopener" class="ingrediente-link">' + t('politica_enlace') + '</a></p>' +
      '</div>';
  }

  // Menú del cole — vista semanal de solo lectura (Roger 2026-07-22): el enlace "cole"
  // de la frase "Erik y Enzo comen en el cole" abría el formulario de importar/editar
  // JSON — no es lo que se quiere ver desde ahí. Lista de solo lectura, un día por
  // fila, sin foto (día de la semana en su lugar) y sin favorito/ocultar (no son
  // recetas del banco, es dato importado). Importar/editar sigue en
  // renderSheetImportarCole (menú hamburguesa).
  function renderSheetColeSemana(estado) {
    var cole = estado && estado.cole;
    var dias = (cole && cole.dias) ? Object.keys(cole.dias).sort() : [];
    var filasHtml = dias.length ? '<div class="lista-cole">' + dias.map(function (f) {
      var d = cole.dias[f];
      // día de la semana desde la fecha en crudo (diaIndexDesdeFecha busca dentro de un
      // plan concreto, no sirve aquí: cole.dias puede tener fechas de cualquier semana).
      var idxSemana = (new Date(f + 'T00:00:00').getDay() + 6) % 7;
      var nombreDia = NOMBRES_DIA()[idxSemana] || '';
      return '<div class="fila-cole">' +
        '<span class="fila-cole-dia">' + escapeHtml(nombreDia) + '</span>' +
        '<span class="fila-cole-info"><span class="fila-cole-nombre">' + escapeHtml(d.resumen || '—') + '</span></span>' +
        '</div>';
    }).join('') + '</div>' : '<p class="card-msg">Todavía no hay menú del cole cargado.</p>';
    return sheetHead('Menú del cole') + '<div class="sheet-body">' + filasHtml + '</div>';
  }

  // Menú del cole (F1, 2026-07-17 — versión manual del P1 #2): se pega el JSON
  // generado con el prompt de ChatGPT (el PDF automático llegará con /ai/cole-menu).
  // Con menú cargado: los peques comen esos mediodías en el cole sin tocar su
  // patrón, y las cenas evitan repetir lo que ya comieron.
  function renderSheetImportarCole(estado) {
    var cole = estado && estado.cole;
    var cargadoHtml = '';
    if (cole && cole.dias) {
      var filas = Object.keys(cole.dias).sort().map(function (f) {
        var d = cole.dias[f];
        return '<li class="fila-ingrediente-receta">' + escapeHtml(fechaCorta(f)) + '<span>' + escapeHtml(d.resumen || '—') + '</span></li>';
      }).join('');
      cargadoHtml = '<p class="detalle-subtitulo" style="margin-top:16px">Menú cargado</p>' +
        '<ul class="lista-ingredientes-receta">' + filas + '</ul>' +
        '<button type="button" class="btn-texto" data-action="cole-borrar">Quitar el menú del cole</button>';
    }
    return sheetHead('Menú del cole') +
      '<div class="sheet-body">' +
      '<p class="card-msg">Pega aquí el menú del cole (formato JSON del asistente — pronto será subir el PDF directamente). Puedes pegar una semana o varias de golpe: se añade a lo que ya tengas cargado, no lo sustituye.</p>' +
      '<p class="card-msg">Con el menú cargado, los peques comen esos mediodías en el cole (no hay que tocar su patrón) y las cenas evitan repetir lo que ya comieron. Al importar o quitar el menú, la semana se recalcula sola.</p>' +
      '<span class="campo-eyebrow">Menú (JSON)</span>' +
      '<textarea id="cole-json" class="cole-textarea" placeholder=\'{"semanaISO":"2026-07-20","dias":{"2026-07-20":{"resumen":"...","proteina":"...","hidrato":"...","verdura":true}}}\'></textarea>' +
      '<button type="button" class="btn-cta-gradiente" data-action="cole-importar">Importar menú</button>' +
      cargadoHtml +
      '</div>';
  }

  // Sincronización multiusuario (Roger 2026-07-14, pilar de backend). Misma
  // sheet sirve desde el hamburguesa (familia ya dada de alta) y desde la
  // landing (dispositivo nuevo que solo quiere unirse con un código).
  function renderSheetSync(opts) {
    opts = opts || {};
    var head = sheetHead(t('sincronizar_familia'));

    if (opts.cargando) {
      return head + '<div class="sheet-body"><p class="card-msg">Cargando…</p></div>';
    }

    if (opts.synced) {
      var aviso = opts.aviso ? '<p class="card-msg">' + escapeHtml(opts.aviso) + '</p>' : '';
      return head + '<div class="sheet-body">' +
        '<p class="card-msg">' + escapeHtml(opts.nombreFamilia || 'Tu familia') + ' está sincronizada. Comparte este código con quien quieras que vea y edite el menú desde su móvil:</p>' +
        '<div class="sync-codigo-caja"><span class="campo-eyebrow">' + t('codigo') + '</span><p class="sync-codigo">' + escapeHtml(opts.code || '') + '</p></div>' +
        '<p class="card-msg">Cualquier dispositivo con este código ve y edita todo el menú — no hay permisos distintos por persona.</p>' +
        aviso +
        '<button type="button" class="btn-secondary btn-icono-texto" id="sync-rotar-btn" data-action="sync-rotar"><i data-lucide="refresh-cw"></i>Generar un código nuevo</button>' +
        '<p class="card-msg" style="margin-top:8px">Si el código se te ha escapado a quien no debía, genera otro: el viejo deja de servir al instante. Los móviles que ya están dentro siguen dentro.</p>' +
        '<p class="detalle-subtitulo" style="margin-top:24px">Tus datos</p>' +
        '<button type="button" class="btn-secondary btn-icono-texto" id="sync-exportar-btn" data-action="sync-exportar"><i data-lucide="download"></i>Descargar una copia</button>' +
        '<p class="card-msg" style="margin-top:8px">Un archivo con todo lo de tu familia: miembros, menús y lista de la compra.</p>' +
        '<button type="button" class="btn-secondary btn-icono-texto btn-danger-outline" id="sync-borrar-btn" data-action="sync-borrar"><i data-lucide="trash-2"></i>Borrar la familia y sus datos</button>' +
        '<p class="card-msg" style="margin-top:8px">Borra la familia de la nube para todos los móviles, sin vuelta atrás. Descarga una copia antes si la quieres.</p>' +
        '</div>';
    }

    if (opts.confirmarBorrado) {
      return head + '<div class="sheet-body">' +
        '<p class="card-msg">Vas a borrar <strong>' + escapeHtml(opts.nombreFamilia || 'tu familia') + '</strong> y todos sus datos de la nube: miembros, menús y lista de la compra. Desaparece para todos los móviles de la familia y <strong>no se puede deshacer</strong>.</p>' +
        (opts.error ? '<p class="card-msg">' + escapeHtml(opts.error) + '</p>' : '') +
        '<p class="card-msg">Escribe <strong>BORRAR</strong> para confirmar:</p>' +
        '<label><span class="campo-eyebrow">Confirmación</span><input type="text" id="sync-borrar-input" class="input-editorial" placeholder="BORRAR" autocapitalize="characters" autocomplete="off"></label>' +
        '<button type="button" class="btn-secondary btn-icono-texto btn-danger-outline" id="sync-borrar-confirmar-btn" data-action="sync-borrar-confirmar"><i data-lucide="trash-2"></i>Borrar definitivamente</button>' +
        '<button type="button" class="btn-texto" data-action="menu-sync">Cancelar</button>' +
        '</div>';
    }

    var errorHtml = opts.error ? '<p class="card-msg">' + escapeHtml(opts.error) + '</p>' : '';

    return head + '<div class="sheet-body">' +
      '<p class="card-msg">' + t('activa_la_sincronizacion_para_ver_y_editar') + '</p>' +
      errorHtml +
      '<button type="button" class="btn-sync-activar" id="sync-activar-btn" data-action="sync-activar">' + t('activar_sincronizacion') + '</button>' +
      '<p class="sync-pregunta">' + t('ya_tienes_un_codigo_de_otra_familia') + '</p>' +
      '<label><span class="campo-eyebrow">' + t('codigo') + '</span><input type="text" id="sync-code-input" class="input-editorial" placeholder="' + t('8_caracteres') + '" maxlength="8" autocapitalize="characters" autocomplete="off"></label>' +
      '<button type="button" class="btn-secondary" id="sync-unirse-btn" data-action="sync-unirse">' + t('unirme_con_el_codigo') + '</button>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // DESCUBRIR · §15.5
  // ---------------------------------------------------------------
  // `categoriasDescubrir(fechaISO, ocultas)` conserva la mecánica de siempre (temporada primero,
  // fijas delante, rotación determinista por día, SIN RNG) sobre el catálogo del HOGAR. La fecha
  // viaja en `data-fecha` (audit 2026-07-20): el handler reabre la MISMA rotación aunque la
  // medianoche cruce entre pintar y tocar.
  // Foto propia de las tres categorías FIJAS de Descubrir (§15.5 · FIJAS_DESCUBRIR). Vive aquí y
  // no en `superficie.js` a propósito: una ruta de asset es presentación, y la superficie son
  // funciones PURAS sobre semana + banco + diario — no conocen el `assets/` del frontend.
  // Solo hay estas tres en el repo; el resto de categorías siguen tomando la foto de su primera
  // candidata con foto, que es lo que ya hace el motor. Nada inventado, nada reciclado.
  var FOTO_CATEGORIA_DESCUBRIR = {
    ensaladas: 'assets/descubrir/frescas.jpg',
    rapidas: 'assets/descubrir/rapidas.jpg',
    guisos: 'assets/descubrir/potajes.jpg'
  };

  function renderDescubrirVista(estado, banco, sup) {
    var fecha = hoyISO();
    var categorias = sup ? sup.categoriasDescubrir(fecha, estado.ocultas || []) : [];
    var fichasHtml = categorias.map(function (d, idx) {
      var foto = FOTO_CATEGORIA_DESCUBRIR[d.id] || d.foto;
      return '<button type="button" class="desc-ficha" data-action="descubrir-abrir-categoria" data-idx="' + idx + '" data-fecha="' + fecha + '">' +
        (foto ? '<img src="' + escapeHtml(foto) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<div class="desc-ficha-degradado"></div>' +
        '<div class="desc-ficha-texto">' +
        '<span class="desc-kicker">' + escapeHtml(d.kicker) + '</span>' +
        '<div class="desc-titulo">' + escapeHtml(d.titulo) + '</div>' +
        '</div></button>';
    }).join('');
    // Sin superficie no es que «no haya ideas todavía»: es que el motor no ha podido abrirla.
    // Decir «muy pronto» ahí es la misma mentira que decía Compra, con otra cara.
    var vacio = avisoErrorMotor(estado) || '<p class="card-msg">' + escapeHtml(t('descubrir_muy_pronto')) + '</p>';
    return '<div class="rc-cabecera"><div><h1 class="rc-titulo">' + t('descubrir') + '</h1>' +
      '<p class="cp-resumen">' + t('ideas_nuevas_para_tu_familia') + '</p></div></div>' +
      '<div class="vista-body rc-body"><div class="desc-lista">' +
      (fichasHtml || vacio) +
      '</div></div>';
  }

  // Descubrir → detalle de categoría: las MISMAS tarjetas que Recetas (Roger 2026-07-20), sin
  // chips ni buscador — la categoría ya viene filtrada por el motor.
  function renderSheetDescubrirCategoria(categoria, estado) {
    var ocultas = estado.ocultas || [], favoritas = estado.favoritas || [];
    return sheetHead(categoria.titulo) +
      '<div class="sheet-body"><div class="rc-grid">' +
      categoria.candidatas.map(function (p) {
        return tarjetaRecetaGrid(p, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1);
      }).join('') + '</div></div>';
  }

  // Familia — lista de miembros (Roger 2026-07-19, handoff): tarjeta por
  // persona con avatar/nombre/edad/dieta, toca para abrir su ficha completa
  // (renderVistaMiembro). Sustituye al sheet "Tu familia" — nombreFamilia/
  // familiaRegion y "recetas ocultas" quedan sin superficie propia en este
  // rediseño (el dato sigue intacto, solo no hay UI para tocarlo hoy).
  // Cuadrícula de 6 cards visibles sin scroll (Roger 2026-07-25, tras 3 iteraciones) —
  // misma card que Recetas (.rc-grid/.rc-tarjeta). Tope duro: 189px de alto o la 3ª fila
  // cae bajo el nav. La edad NO va en la card a propósito (probado: engorda 181→205px y
  // deja solo 4 filas visibles en vez de 6) — ya está en la ficha del miembro.
  function renderPerfilVista(estado) {
    var familia = estado.familia || [];
    var cardsHtml = familia.map(function (m, idx) {
      // Badge de alerta: primero las alergias marcadas del handoff (dato
      // estructurado), y si no hay, el texto libre de "Otras restricciones".
      var alergias = m.alergias || [];
      var restriccion = (m.restricciones || '').trim();
      var alerta = alergias.length
        ? (alergias.length === 1 ? t(ETIQUETA_ALERGIA[alergias[0]]) : alergias.length + ' ' + t('alergias_plural'))
        : (restriccion && restriccion.toLowerCase() !== 'ninguna' ? restriccion : '');
      return '<div class="rc-tarjeta pf-tarjeta">' +
        '<button type="button" class="rc-tarjeta-abrir" data-action="abrir-miembro-ficha" data-id="' + m.id + '">' +
        '<span class="rc-tarjeta-foto pf-tarjeta-foto" ' + avatarEstiloColor(m, colorMiembro(idx)) + '>' +
        (avatarInner(m) ? '<span class="pf-tarjeta-inicial">' + avatarInner(m) + '</span>' : '') +
        (alerta ? '<span class="rc-tarjeta-tag pf-tarjeta-tag-alergia">' + escapeHtml(alerta) + '</span>' : '') +
        '</span>' +
        '<span class="rc-tarjeta-info"><span class="rc-tarjeta-nombre">' + escapeHtml(m.nombre) + '</span></span>' +
        '</button>' +
        '<div class="rc-tarjeta-pie pf-tarjeta-pie"><span class="rc-tarjeta-meta"><i data-lucide="leaf"></i>' + escapeHtml(t(ETIQUETA_ESTILO[estiloDeMiembro(m)])) + '</span></div>' +
        '</div>';
    }).join('');
    // celda de la cuadrícula, no barra a lo ancho — así no se descuadra con nº impar de miembros
    var anadirHtml = '<button type="button" class="pf-anadir-celda" data-action="familia-abrir-form-miembro">' +
      '<span class="pf-anadir-circulo"><i data-lucide="plus"></i></span>' + t('anadir_miembro') + '</button>';

    // Handoff 7: la cabecera lleva el nombre de la casa, no la etiqueta genérica. Si todavía
    // no hay nombre (familia local sin sincronizar), cae en «Familia» a secas. Y si el nombre
    // YA empieza por la palabra «familia» —la demo se llama «Familia Ejemplo», y nadie impide
    // que Roger escriba «Familia Pérez»— se pinta tal cual: medido en navegador, la plantilla
    // a secas daba «Familia Familia Ejemplo».
    var nombreCasa = (estado.nombreFamilia || '').trim();
    var yaDiceFamilia = /^(familia|familie|famille|family)\b/.test(normalizarTexto(nombreCasa));
    var tituloFamilia = !nombreCasa ? t('familia')
      : yaDiceFamilia ? nombreCasa
        : t('familia_titulada').replace('{f}', nombreCasa);

    return '<div class="rc-cabecera"><div><h1 class="rc-titulo">' + escapeHtml(tituloFamilia) + '</h1><p class="cp-resumen">' + t('personaliza_el_menu_para_cada_uno') + '</p></div></div>' +
      '<div class="vista-body rc-body">' +
      '<div class="rc-grid pf-grid">' + cardsHtml + anadirHtml + '</div>' +
      '</div>';
  }

  global.E3UI = {
    avisoReinicioHtml: avisoReinicioHtml,
    renderHome: renderHome,
    renderDescubrirVista: renderDescubrirVista,
    renderPerfilVista: renderPerfilVista,
    renderRecetasVista: renderRecetasVista,
    renderVistaRecetaPlantilla: renderVistaRecetaPlantilla,
    renderCompraVista: renderCompraVista,
    renderVistaReceta: renderVistaReceta,
    renderSheetResumenSemana: renderSheetResumenSemana,
    renderSheetGastoSemanal: renderSheetGastoSemanal,
    gastoSemanalMecanica: gastoSemanalMecanica,
    renderSheetCambiarInicio: renderSheetCambiarInicio,
    renderSheetCambioHecho: renderSheetCambioHecho,
    renderSheetCambioSinSalida: renderSheetCambioSinSalida,
    renderSheetDescubrirCategoria: renderSheetDescubrirCategoria,
    renderOpcionesNevera: renderOpcionesNevera,
    renderNevera: renderNevera,
    renderVistaMiembro: renderVistaMiembro,
    avisoErrorMotor: avisoErrorMotor,
    renderMenuHamburguesa: renderMenuHamburguesa,
    renderAcercaDe: renderAcercaDe,
    VERSION_APP: VERSION_APP,
    VERSION_FECHA: VERSION_FECHA,
    renderAccesoElegir: renderAccesoElegir,
    renderAccesoMail: renderAccesoMail,
    renderRevisaCorreo: renderRevisaCorreo,
    renderOlvidePassword: renderOlvidePassword,
    renderPasoFamilia: renderPasoFamilia,
    renderCodigoFamilia: renderCodigoFamilia,
    renderSheetCuenta: renderSheetCuenta,
    renderSheetCampana: renderSheetCampana,
    renderSheetIdioma: renderSheetIdioma,
    renderBatch: renderBatch,
    renderSheetImportarCole: renderSheetImportarCole,
    renderSheetColeSemana: renderSheetColeSemana,
    renderSheetSync: renderSheetSync,
    renderOnbNombreFamilia: renderOnbNombreFamilia,
    renderOnbPersona: renderOnbPersona,
    renderOnbFicha: renderOnbFicha,
    renderOnbFin: renderOnbFin,
    pasoPersonaValido: pasoPersonaValido,
    colorMiembro: colorMiembro,
    estiloADieta: estiloADieta,
    estiloDeMiembro: estiloDeMiembro,
    patronSeguro: patronSeguro,
    sheetHead: sheetHead,
    escapeHtml: escapeHtml,
    normalizarTexto: normalizarTexto,
    // fechas del producto (venían de engine.js, que muere con v5) + lectura de la semana `/2`:
    // app.js consume ESTA implementación, no una copia suya
    fechaLocalISO: fechaLocalISO,
    fechaISO: fechaISO,
    lunesDeEstaSemana: lunesDeEstaSemana,
    semanaIsoDeLunes: semanaIsoDeLunes,
    fechaDeDia: fechaDeDia,
    edadEnAnios: edadEnAnios,
    EDAD_MENOR: EDAD_MENOR,
    bandaMedidas: bandaMedidas,
    medidasRequeridas: medidasRequeridas,
    claveAvisoMedidas: claveAvisoMedidas,
    servicioDe: servicioDe,
    principalDe: principalDe,
    nombrePercibido: nombrePercibido
  };
})(typeof window !== 'undefined' ? window : this);
