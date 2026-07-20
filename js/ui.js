/* ============================================================
   e3Foods — ui.js
   Render puro: construye HTML a partir de (estado, plan, banco).
   No añade listeners ni muta estado — eso vive en app.js (delegación
   de eventos por data-action). Mantiene la separación presentación/
   comportamiento sin necesidad de framework.
   ============================================================ */
(function (global) {
  'use strict';

  var E = global.E3Engine;
  var NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  var NOMBRES_DIA_CORTO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  var ETIQUETAS_DIETA = { omnivora: 'De todo', vegetariana: 'Vegetariana', 'sin-pescado': 'Sin pescado', 'sin-cerdo': 'Sin cerdo' };
  var ETIQUETAS_PATRON = { casa: 'Casa', fuera: 'Fuera', cole: 'Cole' };

  // categoría de ingrediente -> etiqueta ES, para chips de RECETAS y secciones de COMPRA
  var ETIQUETAS_CATEGORIA = {
    'pescado-blanco': 'Pescado blanco', 'pescado-azul': 'Pescado azul', 'marisco': 'Marisco',
    'carne-blanca': 'Carne blanca', 'carne-roja': 'Carne roja', 'legumbre': 'Legumbre',
    'huevo': 'Huevo', 'lacteo': 'Lácteo', 'cereal': 'Cereal', 'tuberculo': 'Tubérculo',
    'verdura': 'Vegetal', 'fruta': 'Fruta', 'otro': 'Otro',
    // Roger 2026-07-14: chips presentes aunque el banco no tiene el dato para
    // filtrar de verdad todavía — ver nota en renderRecetasVista.
    'vegetariana': 'Vegetariana', 'sin-gluten': 'Sin gluten'
  };
  var ORDEN_CATEGORIA = ['pescado-blanco', 'pescado-azul', 'marisco', 'carne-blanca', 'carne-roja', 'legumbre', 'huevo', 'lacteo', 'cereal', 'tuberculo', 'verdura', 'fruta', 'otro'];
  // claves de categorias_cuota que no son una categoría de ingrediente real (agregado
  // pescado-total) — ETIQUETAS_CATEGORIA no las cubre, etiqueta aparte para el resumen semanal
  // renombrada de ETIQUETAS_CUOTA (audit 2026-07-20): casi-colisión con la
  // ETIQUETA_CUOTA (singular) de más abajo — mismo prefijo, contenidos
  // distintos, riesgo real de editar la equivocada por error.
  var ETIQUETA_CUOTA_AGREGADA = { 'pescado-total': 'Pescado (total)' };

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  var capitaliza = E.capitaliza;

  // opciones de los chip-toggle de miembro — compartidas entre el formulario de
  // alta/edición (chipToggle) y el editor inline del sheet Familia (chipToggleMiembro)
  var OPCIONES_SEXO = [{ valor: 'mujer', etiqueta: 'Mujer' }, { valor: 'hombre', etiqueta: 'Hombre' }];
  var OPCIONES_ACTIVIDAD = [{ valor: 'baja', etiqueta: 'Baja' }, { valor: 'media', etiqueta: 'Media' }, { valor: 'alta', etiqueta: 'Alta' }];
  var OPCIONES_DIETA = Object.keys(ETIQUETAS_DIETA).map(function (k) { return { valor: k, etiqueta: ETIQUETAS_DIETA[k] }; });

  function etiquetaDieta(valor) { return ETIQUETAS_DIETA[valor] || 'De todo'; }

  // ids de ingrediente del banco ordenados por nombre — listas de nevera, vetos y
  // selects de receta propia
  function idsIngredientesOrdenados(banco) {
    return Object.keys(banco.ingredientes).sort(function (a, b) {
      return banco.ingredientes[a].nombre.localeCompare(banco.ingredientes[b].nombre);
    });
  }

  // cabecera estándar de cualquier bottom sheet (título + X de cerrar)
  function sheetHead(titulo, sinCerrar) {
    return '<div class="sheet-head"><h2>' + escapeHtml(titulo) + '</h2>' +
      (sinCerrar ? '' : '<button type="button" class="btn-cerrar" data-action="cerrar-sheet" aria-label="Cerrar">&times;</button>') +
      '</div>';
  }

  var NOMBRES_EJE = { proteina: 'proteína', hidrato: 'hidrato', verdura: 'verdura' };

  // nombre de plantilla sin comprometer ingrediente concreto — para listas de elección
  // ("Elegir otro plato", banco de Recetas) donde aún no hay una selección de ejes.
  function nombreGenerico(nombrePatron) {
    return nombrePatron.replace(/\{([a-z]+)\}/g, function (_, eje) { return NOMBRES_EJE[eje] || eje; });
  }

  function nombreCortoIngrediente(nombre) {
    return (nombre || '').split(' (')[0];
  }

  // F1 (Roger 2026-07-17, MOTOR_RECETAS §7): el usuario nunca ve el álgebra
  // "{proteína} con hidrato". Cada plantilla se presenta por su combinación más
  // icónica — la primera opción de cada eje, que en el banco es la canónica a
  // propósito. La variabilidad se cuenta aparte (variantesProteina), en llano.
  function nombreEjemplo(p, banco) {
    return p.nombre_patron.replace(/\{([a-z]+)\}/g, function (_, eje) {
      var id = p.ejes && p.ejes[eje] && p.ejes[eje][0];
      var ing = id && banco.ingredientes[id];
      return ing ? nombreCortoIngrediente(ing.nombre).toLowerCase() : (NOMBRES_EJE[eje] || eje);
    });
  }

  function variantesProteina(p, banco) {
    var ops = (p.ejes && p.ejes.proteina) || [];
    if (p.tipo !== 'plantilla' || ops.length < 2) return '';
    var otras = ops.slice(1, 4).map(function (id) {
      var ing = banco.ingredientes[id];
      return ing ? nombreCortoIngrediente(ing.nombre).toLowerCase() : id;
    });
    return 'también con ' + otras.join(', ') + (ops.length > 4 ? '…' : '');
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
  function avatarEstiloColor(miembro, color) {
    var foto = fotoSegura(miembro.foto);
    return 'style="background:' + color + (foto ? ";background-image:url('" + foto + "')" : '') + '"';
  }

  var ICONO_CAMARA = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.6l.9-1.5A1.5 1.5 0 0 1 9.29 4.75h5.42A1.5 1.5 0 0 1 16 5.5L16.9 7h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg>';

  // contenido interno del botón de foto (.foto-tap): overlay "Cambiar" si hay foto,
  // o inicial + icono de cámara si no — compartido por el formulario de miembro,
  // la card del sheet Familia y el preview en vivo de app.js (actualizarPreviewFotoForm)
  function fotoTapInner(miembro) {
    if (miembro && miembro.foto) return '<span class="foto-tap-editar">Cambiar</span>';
    return '<span class="foto-tap-inicial">' + escapeHtml(iniciales(miembro ? miembro.nombre : '')) + '</span>' +
      '<span class="foto-tap-icono" aria-hidden="true">' + ICONO_CAMARA + '</span>';
  }

  function fechaCorta(fechaISO) {
    var d = new Date(fechaISO + 'T00:00:00');
    return d.getDate() + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()];
  }

  function hoyISO() { return E.fechaLocalISO(new Date()); }

  function saludoHora() {
    var h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 20) return 'Buenas tardes';
    return 'Buenas noches';
  }

  // iconos de sol/luna — mismo estilo de línea que el nav (24x24, stroke)
  var ICONO_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';
  var ICONO_LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a6.8 6.8 0 0 0 11.3 11.3z"/></svg>';

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
  // quién pertenece estructuralmente a una comida (patrón), quién está presente hoy
  // (patrón + ausencia puntual) y con quién se resuelve la receta si nadie confirmó —
  // compartido por la card de comida y el sheet de receta completa.
  function comensalesDeSlot(estado, plan, diaIndex, tipoComida) {
    var dia = plan.dias[diaIndex];
    var miembrosDelSlot = (estado.familia || []).filter(function (m) {
      var patron = m.patron && m.patron[tipoComida];
      return !patron || patron[diaIndex] === 'casa';
    });
    var presentes = E.presentesEnComida(estado, dia.fecha, diaIndex, tipoComida);
    return {
      miembrosDelSlot: miembrosDelSlot,
      presentes: presentes,
      comensales: presentes.length ? presentes : miembrosDelSlot.slice(0, 1)
    };
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

  // esfuerzo real de la plantilla -> etiqueta corta (Q3, Roger 2026-07-19):
  // el banco no tiene un campo "tag" (Saludable/Rápido/Ligero...) del handoff;
  // se deriva del dato real que sí existe, en vez de inventar un dato nuevo.
  var ETIQUETA_ESFUERZO = { rapido: 'Rápido', medio: 'Equilibrado', elaborado: 'De calma' };

  // Card comida/cena del pager de Home — identidades opuestas a propósito
  // (Comida blanca/editorial, Cena oscura/cinematográfica) para que se
  // reconozcan sin leer la etiqueta. Handoff: e3Foods.dc.html.
  function renderCardPager(estado, banco, plan, diaIndex, meal) {
    var dia = plan.dias[diaIndex];
    var slot = dia ? dia[meal] : null;
    var mesa = comensalesDeSlot(estado, plan, diaIndex, meal);
    var esCena = meal === 'cena';
    var claseCard = esCena ? 'ph-card ph-card-cena' : 'ph-card ph-card-comida';
    var icono = esCena ? ICONO_LUNA : ICONO_SOL;
    var etiqueta = esCena ? 'CENA' : 'COMIDA';
    var avataresHtml = avataresPager(estado, mesa, diaIndex, meal, esCena);
    var avataresSpan = avataresHtml ? '<span class="ph-avatares">' + avataresHtml + '</span>' : '';
    // Handoff (e3Foods.dc.html líneas 85-93): badge y avatares van ENCIMA de
    // la foto (position:absolute), no en una fila aparte. Solo en el estado
    // vacío (sin foto que enseñar) cae al .ph-cab de siempre.
    var badge = '<span class="ph-badge ph-badge-' + (esCena ? 'cena' : 'comida') + '"><span class="ph-badge-icono">' + icono + '</span><span class="ph-badge-texto">' + etiqueta + '</span></span>';
    var cabeceraVacia = '<div class="ph-cab"><span class="ph-tipo ph-tipo-' + (esCena ? 'cena' : 'comida') + '">' + icono + etiqueta + '</span>' + avataresSpan + '</div>';

    var plantilla = slot ? E.plantillaPorId(banco, estado, slot.plantillaId) : null;
    // postreDelDia() es del DÍA, no de la comida — sin filtro por esCena
    // (handoff líneas 105/142: "De postre" aparece igual en las dos cards).
    var postre = E.postreDelDia(banco, dia.fecha, diaIndex);
    var postreTexto = postre ? (postre.tipo === 'tradicional' ? postre.nombre + ' (receta de finde)' : postre.nombre) : '';

    if (!mesa.miembrosDelSlot.length) {
      return '<div class="' + claseCard + ' ph-card-vacia" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' + cabeceraVacia +
        '<p class="card-msg">Nadie come en casa (' + (esCena ? 'noche' : 'mediodía') + ').</p></div>';
    }
    if (!slot || !plantilla) {
      return '<div class="' + claseCard + ' ph-card-vacia" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' + cabeceraVacia +
        '<p class="card-msg">No encontramos un plato que encaje con los gustos/vetos actuales.</p>' +
        '<button type="button" class="btn-secondary" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + meal + '">Elegir plato</button></div>';
    }

    var resuelto = E.resolverPlato(plantilla, slot.seleccion, mesa.comensales, banco, slot.adaptaciones);
    var nombreSplit = splitNombrePlato(resuelto.nombre);
    var kcalMedio = mesa.presentes.length ? Math.round(resuelto.kcalTotal / mesa.presentes.length) : 0;
    var tag = ETIQUETA_ESFUERZO[plantilla.esfuerzo] || '';
    var fotoHtml = plantilla.foto ? '<img class="ph-foto" src="' + escapeHtml(plantilla.foto) + '" alt="">' : '<div class="ph-foto ph-foto-vacia"></div>';

    var metaHtml = '<div class="ph-meta">' +
      (mesa.presentes.length ? '<span class="ph-meta-item"><i data-lucide="flame"></i>~' + kcalMedio + ' kcal<span class="ph-meta-sub">/pers</span></span><span class="ph-meta-punto"></span>' : '') +
      '<span class="ph-meta-item"><i data-lucide="clock"></i>' + (plantilla.tiempo_min || '?') + ' min</span>' +
      (tag ? '<span class="ph-meta-punto"></span><span class="ph-meta-item"><i data-lucide="leaf"></i>' + tag + '</span>' : '') +
      '</div>';

    // role="button" en un <div>, no un <button>: dentro va el avatar de cada
    // comensal, que SÍ es un <button> real (toggle-presente) — un <button> no
    // puede envolver a otro <button> (HTML inválido, el navegador lo rompe).
    // Mismo patrón que ya usa el dispatcher de teclado (ver app.js, keydown).
    return '<div class="' + claseCard + '" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' +
      '<div role="button" tabindex="0" class="ph-abrir" data-action="abrir-receta" data-dia="' + diaIndex + '" data-tipo="' + meal + '" aria-label="Ver receta completa">' +
      '<div class="ph-foto-wrap">' + fotoHtml + badge + avataresSpan + '</div>' +
      '<div class="ph-info">' +
      '<p class="ph-titulo">' + escapeHtml(nombreSplit.titulo) + '</p>' +
      (nombreSplit.subtitulo ? '<p class="ph-subtitulo">' + escapeHtml(nombreSplit.subtitulo) + '</p>' : '') +
      metaHtml +
      (postreTexto ? '<p class="ph-postre">De postre: ' + escapeHtml(postreTexto) + '</p>' : '') +
      '</div>' +
      '</div>' +
      '<button type="button" class="ph-cta" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + meal + '"><i data-lucide="sparkles"></i>Me apetece otra cosa<i data-lucide="arrow-right" class="ph-cta-flecha"></i></button>' +
      '</div>';
  }

  // Feedback loop (P1, 2026-07-16): "¿qué tal?" post-comida, un toque por slot
  // (fecha+tipoComida) — no se puede rellenar retroactivamente, así que solo se
  // ofrece para hoy o días ya pasados (no tiene sentido valorar una cena futura).
  var VALORACIONES = [
    { valor: 'gusta', emoji: '😍', etiqueta: 'Les encantó' },
    { valor: 'neutro', emoji: '🙂', etiqueta: 'Bien' },
    { valor: 'no-gusta', emoji: '😕', etiqueta: 'No tanto' }
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
    return '<div class="valoracion-fila"><p class="detalle-subtitulo">¿Qué tal esta comida?</p>' +
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
    if (nombres.length === (estado.familia || []).length) return 'Le gusta a toda la familia.';
    return 'Comen: ' + nombres.join(', ') + '.';
  }

  function renderVistaReceta(estado, banco, plan, diaIndex, tipoComida) {
    var dia = plan && plan.dias[diaIndex];
    var slot = dia ? dia[tipoComida] : null;
    var plantilla = slot ? E.plantillaPorId(banco, estado, slot.plantillaId) : null;
    if (!dia || !slot || !plantilla) {
      return '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos esta receta.</p></div>';
    }
    var mesa = comensalesDeSlot(estado, plan, diaIndex, tipoComida);
    var resuelto = E.resolverPlato(plantilla, slot.seleccion, mesa.comensales, banco, slot.adaptaciones);
    var nombreSplit = splitNombrePlato(resuelto.nombre);
    var esCena = tipoComida === 'cena';
    var kcalMedio = mesa.presentes.length ? Math.round(resuelto.kcalTotal / mesa.presentes.length) : 0;
    var tag = ETIQUETA_ESFUERZO[plantilla.esfuerzo] || '—';
    var favorita = (estado.favoritas || []).indexOf(plantilla.id) !== -1;
    var oculta = (estado.ocultas || []).indexOf(plantilla.id) !== -1;
    var fotoHtml = plantilla.foto ? '<img src="' + escapeHtml(plantilla.foto) + '" alt="">' : '<div class="rv-foto-vacia"></div>';

    var ingredientesHtml = resuelto.ingredientes.slice().sort(function (a, b) {
      var na = banco.ingredientes[a.id] ? banco.ingredientes[a.id].nombre : a.id;
      var nb = banco.ingredientes[b.id] ? banco.ingredientes[b.id].nombre : b.id;
      return na.localeCompare(nb);
    }).map(function (item) {
      var ing = banco.ingredientes[item.id];
      return '<div class="rv-ingrediente"><span class="rv-ingrediente-bullet"></span><span class="rv-ingrediente-nombre">' + escapeHtml(ing ? ing.nombre : item.id) + '</span><span class="rv-ingrediente-g">' + item.gramos + ' g</span></div>';
    }).join('');

    function pasosCards(lista) {
      return lista.map(function (p, i) {
        return '<div class="rv-paso"><span class="rv-paso-num">' + (i + 1) + '</span><span class="rv-paso-texto">' + escapeHtml(p) + '</span></div>';
      }).join('');
    }

    var pasosHtml = resuelto.pasos.length
      ? '<div class="rv-pasos">' + pasosCards(resuelto.pasos) + '</div>'
      : '<p class="card-msg">Sin pasos detallados para esta receta.</p>';

    // Segunda (o tercera...) cocción por mesa mixta (Roger 2026-07-14): si a
    // alguien le toca un ingrediente distinto en el eje proteína, sus pasos
    // van aparte — el handoff no conocía esta pieza (foso #1 del producto),
    // se preserva tal cual con el mismo estilo de card que el resto.
    var pasosAdaptadosHtml = (resuelto.pasosAdaptados || []).map(function (pa) {
      var m = (estado.familia || []).find(function (mm) { return mm.id === pa.miembroId; });
      return '<p class="detalle-subtitulo" style="margin-top:18px">Para ' + escapeHtml(m ? m.nombre : '?') + ' (' + escapeHtml(pa.ingrediente) + ')</p>' +
        '<div class="rv-pasos">' + pasosCards(pa.pasos) + '</div>';
    }).join('');

    return '<div class="rv-hero">' + fotoHtml + '<div class="rv-hero-gradiente"></div>' +
      '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
      '<div class="rv-acciones">' +
      '<button type="button" class="rv-flotante' + (oculta ? ' rv-flotante-activo' : '') + '" data-action="toggle-oculta-receta" data-plantilla="' + plantilla.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '" aria-pressed="' + oculta + '"><i data-lucide="eye-off"></i></button>' +
      '<button type="button" class="rv-flotante' + (favorita ? ' rv-flotante-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + plantilla.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '</div></div>' +
      '<div class="rv-body">' +
      '<span class="rv-pill rv-pill-' + (esCena ? 'cena' : 'comida') + '">' + (esCena ? ICONO_LUNA : ICONO_SOL) + (esCena ? 'CENA' : 'COMIDA') + '</span>' +
      '<h1 class="rv-titulo">' + escapeHtml(nombreSplit.titulo) + '</h1>' +
      (nombreSplit.subtitulo ? '<p class="rv-subtitulo">' + escapeHtml(nombreSplit.subtitulo) + '</p>' : '') +
      '<div class="rv-stats">' +
      '<div class="rv-stat"><i data-lucide="clock"></i><span class="rv-stat-valor">' + (plantilla.tiempo_min || '?') + ' min</span></div>' +
      (mesa.presentes.length ? '<div class="rv-stat"><i data-lucide="flame"></i><span class="rv-stat-valor">~' + kcalMedio + ' kcal</span></div>' : '') +
      '<div class="rv-stat"><i data-lucide="leaf"></i><span class="rv-stat-valor">' + tag + '</span></div>' +
      '</div>' +
      (mesa.miembrosDelSlot.length ? '<div class="rv-comensales"><span class="ph-avatares">' + avataresReceta(estado, mesa) + '</span><span class="rv-comensales-texto">' + escapeHtml(textoComensalesReceta(estado, mesa)) + '</span></div>' : '') +
      '<p class="rv-seccion-titulo">Ingredientes</p>' +
      '<div class="rv-ingredientes">' + ingredientesHtml + '</div>' +
      '<p class="rv-seccion-titulo">Preparación</p>' +
      pasosHtml +
      pasosAdaptadosHtml +
      renderValoracion(estado, dia.fecha, tipoComida) +
      '<button type="button" class="rv-cta" data-action="ir-vista" data-vista="compra"><i data-lucide="shopping-basket"></i>Ver en la lista de la compra</button>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Listas de compra (filas de check) — reutilizadas en franja HOY y tab COMPRA
  // ---------------------------------------------------------------
  function filaCompraHtml(item) {
    return '<li class="check-item ' + (item.marcado ? 'check-marcado' : '') + '">' +
      '<label>' +
      '<input type="checkbox" data-action="toggle-compra-item" data-id="' + item.id + '" ' + (item.marcado ? 'checked' : '') + '>' +
      '<span class="check-texto">' + escapeHtml(item.nombre) + '</span>' +
      '<span class="check-cantidad">' + item.gramos + ' g</span>' +
      '</label></li>';
  }

  // ---------------------------------------------------------------
  // Cabecera clara de SEMANA — app-bar + saludo + card IA (Roger 2026-07-14,
  // referencia visual externa ~/Downloads/design_handoff_e3foods_redesign/).
  // Sustituye a renderCabecera() (oscura) SOLO en SEMANA; RECETAS/COMPRA
  // siguen con la cabecera-midnight sin cambios.
  // ---------------------------------------------------------------
  function renderAppBar() {
    return '<header class="app-bar">' +
      '<button type="button" class="app-bar-btn" data-action="abrir-menu-hamburguesa" aria-label="Menú"><i data-lucide="menu"></i></button>' +
      '<p class="app-bar-logo"><span class="app-bar-logo-e3">e3</span><span class="app-bar-logo-foods">foods</span></p>' +
      '<button type="button" class="app-bar-btn app-bar-campana" aria-label="Notificaciones" disabled><i data-lucide="bell"></i><span class="app-bar-campana-dot" aria-hidden="true"></span></button>' +
      '</header>';
  }

  // Saludo + card IA: siempre sobre HOY, independiente del día que esté
  // seleccionado en las píldoras (esas son para ojear la semana, no para
  // redefinir qué es "hoy"). Ingrediente que falta = clicable → COMPRA/hoy
  // (Roger 2026-07-14: reutiliza la vista existente, sin pieza nueva de estado).
  var ETIQUETA_CUOTA = { legumbre: 'Legumbres', 'pescado-total': 'Pescado', 'carne-roja': 'Carne roja', huevo: 'Huevos' };

  // Aviso de equilibrio (Roger 2026-07-17, reubicado 2026-07-19 al pie de la
  // Home nueva): SOLO si una cuota real no está cumplida esta semana — nunca
  // un swap inventado. Línea discreta + link al informe completo — decisión
  // del council del 18/19-jul: "respuesta del día primero, informe como
  // línea al final", no un bloque de chips en el cuerpo principal.
  function renderAvisoEquilibrio(plan, banco) {
    var resumen = E.resumenCuotasSemana(plan, banco);
    var fallo = resumen.filter(function (r) { return !r.cumplido && ETIQUETA_CUOTA[r.categoria]; })[0];
    var texto = !fallo
      ? 'Semana equilibrada: las 5 categorías están al día.'
      : (fallo.max_sem != null && fallo.cuenta > fallo.max_sem
        ? 'Esta semana hay más ' + ETIQUETA_CUOTA[fallo.categoria].toLowerCase() + ' de lo recomendado (' + fallo.cuenta + ' de ' + fallo.max_sem + ').'
        : 'Esta semana falta ' + ETIQUETA_CUOTA[fallo.categoria].toLowerCase() + ' para llegar al mínimo (' + fallo.cuenta + ' de ' + fallo.min_sem + ').');
    return '<button type="button" class="ph-equilibrio-link" data-action="abrir-resumen-semana">' +
      '<i data-lucide="sparkles"></i><span>' + escapeHtml(texto) + '</span><i data-lucide="chevron-right"></i>' +
      '</button>';
  }

  // ---------------------------------------------------------------
  // HOME (Roger 2026-07-19, handoff Claude Design e3Foods.dc.html) — sustituye
  // Foco + vista clásica por UNA sola pantalla: saludo, tira continua de 14
  // días (vigente + siguiente concatenados), banner de despensa+cole, pager
  // swipeable comida/cena, card de importar cole, próximos días, equilibrio
  // como línea discreta al pie (decisión del council: respuesta primero,
  // informe después). Todo dato real: E.generarSemana/listaCompra/etc — nada
  // de la maqueta de Claude Design (esa usaba 3 platos fijos de mentira).
  // ---------------------------------------------------------------
  function renderHome(estado, banco, diaGlobalSel, pagerIdx, miembroDispositivoId) {
    if (!estado.plan) {
      return renderAppBar() + '<div class="vista-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
    }
    var plan14 = (estado.plan.dias || []).concat(estado.planSiguiente ? estado.planSiguiente.dias : []);
    var hoyStr = hoyISO();
    var hoyIdxGlobal = -1;
    for (var gi = 0; gi < plan14.length; gi++) { if (plan14[gi].fecha === hoyStr) { hoyIdxGlobal = gi; break; } }
    var idx = (diaGlobalSel != null && plan14[diaGlobalSel]) ? diaGlobalSel : (hoyIdxGlobal !== -1 ? hoyIdxGlobal : 0);
    var planDia = idx < 7 ? estado.plan : estado.planSiguiente;
    var diaLocal = idx % 7;
    var diaObj = plan14[idx];
    var esHoy = idx === hoyIdxGlobal;

    // ---- saludo ----
    var familia = estado.familia || [];
    var miembroDispositivo = miembroDispositivoId && familia.filter(function (m) { return m.id === miembroDispositivoId; })[0];
    var nombre = (miembroDispositivo || familia[0] || {}).nombre || '';
    var fd = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];
    var subtitulo = esHoy ? 'Hoy, ya decidido.' : ('El ' + fd[diaLocal] + ', ya decidido.');
    var saludoHtml = '<section class="ph-saludo">' +
      '<h1 class="ph-saludo-titulo">' + escapeHtml(saludoHora() + (nombre ? ', ' + nombre : '') + '.') + '</h1>' +
      '<p class="ph-saludo-sub">' + escapeHtml(subtitulo) + '</p>' +
      '</section>';

    // ---- tira de 14 días ----
    var diasHtml = plan14.map(function (dia, i) {
      var d = new Date(dia.fecha + 'T00:00:00');
      var tieneCole = !!(estado.cole && estado.cole.dias && estado.cole.dias[dia.fecha]);
      var clases = 'ph-dia' + (i === idx ? ' ph-dia-activo' : '') + (i === hoyIdxGlobal ? ' ph-dia-hoy' : '');
      return '<button type="button" class="' + clases + '" data-action="semana-elegir-dia" data-dia-global="' + i + '" aria-pressed="' + (i === idx) + '">' +
        '<span class="ph-dia-letra">' + NOMBRES_DIA_CORTO[i % 7].charAt(0) + '</span>' +
        '<span class="ph-dia-num">' + d.getDate() + '</span>' +
        (tieneCole ? '<i data-lucide="graduation-cap" class="ph-dia-cole"></i>' : '') +
        '</button>';
    }).join('');
    var tiraHtml = '<div class="ph-tira-wrap scroll">' + diasHtml + '</div>';

    // ---- banner despensa + cole (cole = día que se está mirando; compra = SIEMPRE hoy real) ----
    var minors = familia.filter(function (m) { return E.edadEnAnios(m.anioNacimiento) < 12; });
    var coleDiaObj = estado.cole && estado.cole.dias && estado.cole.dias[diaObj.fecha];
    var coleTextoHtml = '';
    if (coleDiaObj && minors.length) {
      var nombresMinors = minors.map(function (m) { return m.nombre; });
      var juntos = nombresMinors.length <= 1 ? (nombresMinors[0] || '') : nombresMinors.slice(0, -1).join(', ') + ' y ' + nombresMinors[nombresMinors.length - 1];
      coleTextoHtml = escapeHtml(juntos) + ' ' + (nombresMinors.length > 1 ? 'comen' : 'come') + (esHoy ? ' hoy' : '') + ' en el <button type="button" class="ingrediente-link" data-action="ir-cole">cole</button>. ';
    }
    var itemsHoyReal = E.listaCompra(estado, estado.plan, 'hoy', banco);
    var faltanHoyReal = itemsHoyReal.filter(function (i) { return !i.marcado; });
    var pantryTexto;
    if (!itemsHoyReal.length) pantryTexto = '';
    else if (!faltanHoyReal.length) pantryTexto = 'Tienes todo lo que necesitas para cocinar hoy.';
    else pantryTexto = faltanHoyReal.length + ' ingrediente' + (faltanHoyReal.length === 1 ? '' : 's') + ' en tu lista — <button type="button" class="ingrediente-link" data-action="ir-compra-hoy">revísala</button> antes de cocinar.';
    var pantryOk = itemsHoyReal.length > 0 && !faltanHoyReal.length;
    var pantryHtml = (coleTextoHtml || pantryTexto)
      ? '<div class="ph-pantry' + (pantryOk ? ' ph-pantry-ok' : '') + '"><span class="ph-pantry-icono"><i data-lucide="shopping-basket"></i></span>' +
        '<p class="ph-pantry-texto">' + coleTextoHtml + pantryTexto + '</p></div>'
      : '';

    // ---- pager comida/cena ----
    var pagerHtml = '<div id="home-pager" class="ph-pager-scroll scroll">' +
      '<div class="ph-pager-slide">' + renderCardPager(estado, banco, planDia, diaLocal, 'comida') + '</div>' +
      '<div class="ph-pager-slide">' + renderCardPager(estado, banco, planDia, diaLocal, 'cena') + '</div>' +
      '</div>';
    var segHtml = '<div class="ph-seg">' +
      '<button type="button" id="pager-seg-comida" class="ph-seg-btn' + (pagerIdx === 0 ? ' pager-seg-activo' : '') + '" data-action="pager-ir" data-pager="0"><i data-lucide="sun"></i>Comida</button>' +
      '<button type="button" id="pager-seg-cena" class="ph-seg-btn' + (pagerIdx === 1 ? ' pager-seg-activo' : '') + '" data-action="pager-ir" data-pager="1"><i data-lucide="moon"></i>Cena</button>' +
      '</div>';

    // ---- subir menú del cole ----
    var tieneCargado = !!(estado.cole && estado.cole.dias && Object.keys(estado.cole.dias).length);
    var coleCardHtml = '<button type="button" class="ph-cole-card" data-action="menu-importar-cole">' +
      '<span class="ph-cole-icono"><i data-lucide="paperclip"></i></span>' +
      '<span class="ph-cole-texto"><span class="ph-cole-titulo">' + (tieneCargado ? 'Actualizar menú del cole' : 'Subir menú del cole') + '</span>' +
      '<span class="ph-cole-sub">Ajustamos las cenas para compensar</span></span>' +
      '<i data-lucide="upload" class="ph-cole-flecha"></i></button>';

    // ---- próximos días (4, tras hoy real) ----
    var inicioProximos = (hoyIdxGlobal !== -1 ? hoyIdxGlobal : idx) + 1;
    var proximosItems = '';
    for (var p = inicioProximos; p < Math.min(inicioProximos + 4, plan14.length); p++) {
      var pd = plan14[p];
      var pLocal = p % 7;
      var pComidaPl = pd.comida ? E.plantillaPorId(banco, estado, pd.comida.plantillaId) : null;
      var pCenaPl = pd.cena ? E.plantillaPorId(banco, estado, pd.cena.plantillaId) : null;
      var pComidaNombre = pComidaPl ? splitNombrePlato(E.resolverPlato(pComidaPl, pd.comida.seleccion, [], banco).nombre).titulo : 'Sin plan';
      var pCenaNombre = pCenaPl ? splitNombrePlato(E.resolverPlato(pCenaPl, pd.cena.seleccion, [], banco).nombre).titulo : 'Sin plan';
      var pColeDia = estado.cole && estado.cole.dias && estado.cole.dias[pd.fecha];
      var pFotoPl = pCenaPl || pComidaPl;
      proximosItems += '<div class="ph-proximo">' +
        '<div class="ph-proximo-fecha"><span>' + NOMBRES_DIA_CORTO[pLocal].toUpperCase() + '</span><b>' + new Date(pd.fecha + 'T00:00:00').getDate() + '</b></div>' +
        '<div class="ph-proximo-info">' +
        (pColeDia && pColeDia.resumen ? '<button type="button" class="ph-proximo-linea ph-proximo-cole" data-action="ir-cole"><i data-lucide="graduation-cap"></i><span>' + escapeHtml(pColeDia.resumen) + '</span></button>' : '') +
        '<button type="button" class="ph-proximo-linea" data-action="abrir-receta" data-dia="' + pLocal + '" data-tipo="comida" data-dia-global="' + p + '"><i data-lucide="sun"></i><span>' + escapeHtml(pComidaNombre) + '</span></button>' +
        '<button type="button" class="ph-proximo-linea ph-proximo-cena" data-action="abrir-receta" data-dia="' + pLocal + '" data-tipo="cena" data-dia-global="' + p + '"><i data-lucide="moon"></i><span>' + escapeHtml(pCenaNombre) + '</span></button>' +
        '</div>' +
        (pFotoPl && pFotoPl.foto ? '<img class="ph-proximo-foto" src="' + escapeHtml(pFotoPl.foto) + '" alt="" loading="lazy" decoding="async">' : '') +
        '</div>';
    }
    var proximosHtml = proximosItems
      ? '<section class="ph-proximos"><p class="ph-proximos-titulo">Próximos días</p><div class="ph-proximos-lista">' + proximosItems + '</div></section>'
      : '';

    return renderAppBar() +
      '<div class="vista-body ph-body">' +
      saludoHtml + tiraHtml + pantryHtml + pagerHtml + segHtml + coleCardHtml + proximosHtml +
      renderAvisoEquilibrio(estado.plan, banco) +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Sheet: resumen semanal — índice de equilibrio (semáforo de cuotas, dato que
  // el motor ya computa) + semana de un vistazo. Pedido convergente en la
  // valoración externa de producto (2026-07-16); el pill de arriba ya estaba
  // pintado sin acción — esta es esa acción.
  // ---------------------------------------------------------------
  function renderEquilibrioSemana(plan, banco) {
    var resumen = E.resumenCuotasSemana(plan, banco);
    if (!resumen.length) return '';
    var cumplidas = resumen.filter(function (r) { return r.cumplido; }).length;
    var filas = resumen.map(function (r) {
      var etiqueta = ETIQUETA_CUOTA_AGREGADA[r.categoria] || ETIQUETAS_CATEGORIA[r.categoria] || capitaliza(r.categoria.replace(/-/g, ' '));
      // min_sem=0 (p.ej. carne-roja) significa "sin mínimo, solo techo" — mostrar
      // "N de 0" leería como un objetivo incumplido cuando en realidad no hay suelo;
      // el dato relevante ahí es el máximo, no el mínimo trivial.
      var meta = r.min_sem ? (r.cuenta + ' de ' + r.min_sem) : (r.cuenta + (r.max_sem != null ? ' (máx ' + r.max_sem + ')' : ''));
      return '<li class="equilibrio-fila">' +
        '<span class="equilibrio-marca ' + (r.cumplido ? 'equilibrio-marca-ok' : 'equilibrio-marca-no') + '" aria-hidden="true">' + (r.cumplido ? '✓' : '!') + '</span>' +
        '<span class="equilibrio-etiqueta">' + escapeHtml(etiqueta) + '</span>' +
        '<span class="equilibrio-cuenta">' + escapeHtml(meta) + '</span>' +
        '</li>';
    }).join('');
    return '<div class="equilibrio-semana">' +
      '<p class="detalle-subtitulo">Equilibrio semanal — ' + cumplidas + ' de ' + resumen.length + '</p>' +
      '<ul class="equilibrio-lista">' + filas + '</ul>' +
      '</div>';
  }

  // nombre corto de un plato para la vista de un vistazo — presentes=[] es
  // intencional: resolverPlato calcula el nombre sin depender de comensales,
  // así se evita recalcular presencia solo para un texto.
  function nombreCortoSlot(estado, banco, slot) {
    if (!slot) return 'Sin plan';
    var plantilla = E.plantillaPorId(banco, estado, slot.plantillaId);
    if (!plantilla) return '?';
    return E.resolverPlato(plantilla, slot.seleccion, [], banco).nombre;
  }

  function renderResumenDia(estado, banco, plan, diaIndex, hoyIdx) {
    var dia = plan.dias[diaIndex];
    var esHoy = diaIndex === hoyIdx;
    return '<div class="resumen-semana-dia">' +
      '<p class="resumen-semana-fecha">' + NOMBRES_DIA[diaIndex] + ' ' + fechaCorta(dia.fecha) + (esHoy ? ' <span class="badge badge-hoy">HOY</span>' : '') + '</p>' +
      '<p class="resumen-semana-plato"><span class="resumen-semana-ico">' + ICONO_SOL + '</span>' + escapeHtml(nombreCortoSlot(estado, banco, dia.comida)) + '</p>' +
      '<p class="resumen-semana-plato"><span class="resumen-semana-ico">' + ICONO_LUNA + '</span>' + escapeHtml(nombreCortoSlot(estado, banco, dia.cena)) + '</p>' +
      '</div>';
  }

  function renderSheetResumenSemana(estado, banco, plan) {
    if (!plan) return sheetHead('Resumen de la semana') + '<div class="sheet-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
    var hoyIdx = E.diaIndexDesdeFecha(plan, hoyISO());
    var diasHtml = plan.dias.map(function (d, i) { return renderResumenDia(estado, banco, plan, i, hoyIdx); }).join('');
    return sheetHead('Resumen de la semana') +
      '<div class="sheet-body">' +
      renderEquilibrioSemana(plan, banco) +
      '<div class="resumen-semana-lista">' + diasHtml + '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // RECETAS — banco con chips de filtro por categoría
  // ---------------------------------------------------------------
  function categoriasDePlantilla(p, banco) {
    var set = {};
    Object.keys(p.ejes || {}).forEach(function (eje) {
      (p.ejes[eje] || []).forEach(function (id) {
        var ing = banco.ingredientes[id];
        if (ing) set[ing.categoria] = 1;
      });
    });
    return set;
  }

  function renderFormRecetaPropia(banco) {
    var opcionesIng = idsIngredientesOrdenados(banco)
      .map(function (id) { return '<option value="' + id + '">' + escapeHtml(banco.ingredientes[id].nombre) + '</option>'; }).join('');
    return '<details class="receta-propia-form" data-detalle-key="receta-propia">' +
      '<summary>+ Añadir receta propia</summary>' +
      '<div class="form-miembro">' +
      '<label>Nombre del plato<input type="text" id="rp-nombre" maxlength="60" placeholder="p.ej. Salmón con puré"></label>' +
      '<label>Lo principal<select id="rp-proteina"><option value="">(nada en concreto)</option>' + opcionesIng + '</select></label>' +
      '<label>El acompañamiento<select id="rp-hidrato"><option value="">(sin acompañamiento)</option>' + opcionesIng + '</select></label>' +
      '<label>La verdura<select id="rp-verdura"><option value="">(sin verdura)</option>' + opcionesIng + '</select></label>' +
      '<label>Apta para<select id="rp-apta"><option value="comida,cena">Comida y cena</option><option value="comida">Solo comida</option><option value="cena">Solo cena</option></select></label>' +
      '<label>Esfuerzo<select id="rp-esfuerzo"><option value="rapido">Rápido (≤25 min)</option><option value="medio">Medio (≤45 min)</option><option value="elaborado">Elaborado (findes)</option></select></label>' +
      '<button type="button" class="btn-primary" data-action="anadir-receta-propia">Guardar receta</button>' +
      '</div></details>';
  }

  // Etiquetas de los chips especiales que no son una categoría de ingrediente
  // (Roger 2026-07-19, handoff): "Rápidas" deriva de esfuerzo (dato real, mismo
  // patrón que la etiqueta de la card de Home) y "Favoritas" de estado.favoritas
  // — ambos reales. El mock también pedía "Saludables", pero el banco no tiene
  // ese dato y UI_MOBILE.md prohíbe lenguaje de dieta ("healthy"): se omite en
  // vez de simularlo.
  var ETIQUETA_CHIP_ESPECIAL = { todas: 'Todas', rapidas: 'Rápidas', favoritas: 'Favoritas' };

  function tarjetaRecetaGrid(p, banco, oculta, favorita) {
    // lazy (audit 2026-07-20): el grid pinta hasta 82 <img> de golpe — hoy son 4
    // ficheros únicos, pero con fotos por receta (UPGRADES §3) serían 82 requests
    var fotoHtml = p.foto ? '<img src="' + escapeHtml(p.foto) + '" alt="" loading="lazy" decoding="async">' : '<div class="rc-foto-vacia"></div>';
    var tag = ETIQUETA_ESFUERZO[p.esfuerzo] || '';
    return '<div class="rc-tarjeta' + (oculta ? ' rc-oculta' : '') + '">' +
      '<button type="button" class="rc-tarjeta-abrir" data-action="abrir-receta-banco" data-plantilla="' + p.id + '">' +
      '<span class="rc-tarjeta-foto">' + fotoHtml + (tag ? '<span class="rc-tarjeta-tag">' + escapeHtml(tag) + '</span>' : '') + '</span>' +
      '<span class="rc-tarjeta-info"><span class="rc-tarjeta-nombre">' + escapeHtml(capitaliza(nombreEjemplo(p, banco))) + '</span>' +
      '<span class="rc-tarjeta-meta"><i data-lucide="clock"></i>' + (p.tiempo_min || '?') + ' min</span></span>' +
      '</button>' +
      '<span class="rc-tarjeta-acciones">' +
      '<button type="button" class="rc-icono-btn' + (favorita ? ' rc-icono-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + p.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '<button type="button" class="rc-icono-btn" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '"><i data-lucide="eye-off"></i></button>' +
      '</span></div>';
  }

  function filaRecetaLista(p, banco, oculta, favorita) {
    var fotoHtml = p.foto ? '<img src="' + escapeHtml(p.foto) + '" alt="" loading="lazy" decoding="async">' : '<div class="rc-fila-foto-vacia"></div>';
    var tag = ETIQUETA_ESFUERZO[p.esfuerzo] || '';
    return '<div class="rc-fila' + (oculta ? ' rc-oculta' : '') + '">' +
      '<button type="button" class="rc-fila-abrir" data-action="abrir-receta-banco" data-plantilla="' + p.id + '">' +
      '<span class="rc-fila-foto">' + fotoHtml + '</span>' +
      '<span class="rc-fila-info"><span class="rc-fila-nombre">' + escapeHtml(capitaliza(nombreEjemplo(p, banco))) + '</span>' +
      '<span class="rc-fila-meta"><i data-lucide="clock"></i>' + (p.tiempo_min || '?') + ' min' + (tag ? ' · ' + escapeHtml(tag) : '') + '</span></span>' +
      '</button>' +
      '<button type="button" class="rc-icono-btn' + (favorita ? ' rc-icono-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + p.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '<button type="button" class="rc-icono-btn" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '"><i data-lucide="eye-off"></i></button>' +
      '</div>';
  }

  function renderRecetasVista(estado, banco, filtro, busqueda, vista) {
    filtro = filtro || 'todas';
    busqueda = busqueda || '';
    vista = vista === 'list' ? 'list' : 'grid';
    var todas = E.todasLasPlantillas(banco, estado);
    var ocultas = estado.ocultas || [];
    var favoritas = estado.favoritas || [];

    var categoriasPresentes = {};
    todas.forEach(function (p) { Object.keys(categoriasDePlantilla(p, banco)).forEach(function (c) { categoriasPresentes[c] = 1; }); });
    var categorias = ORDEN_CATEGORIA.filter(function (c) { return categoriasPresentes[c]; });
    // vegetariana/sin-gluten van siempre, aunque el banco no tenga ese dato
    // todavía (Roger 2026-07-14) — al elegirlas ninguna plantilla coincide y
    // se ve el mensaje de "sin resultados" habitual: honesto, no simulado.
    var chips = ['todas', 'rapidas', 'favoritas'].concat(categorias, ['vegetariana', 'sin-gluten']);

    var chipsHtml = chips.map(function (c) {
      var activo = c === filtro;
      var nombre = ETIQUETA_CHIP_ESPECIAL[c] || ETIQUETAS_CATEGORIA[c] || capitaliza(c);
      return '<button type="button" class="rc-chip' + (activo ? ' rc-chip-activo' : '') + '" data-action="filtro-receta" data-categoria="' + c + '" aria-pressed="' + activo + '">' + escapeHtml(nombre) + '</button>';
    }).join('');

    var listaFiltrada = todas;
    if (filtro === 'rapidas') listaFiltrada = todas.filter(function (p) { return p.esfuerzo === 'rapido'; });
    else if (filtro === 'favoritas') listaFiltrada = todas.filter(function (p) { return favoritas.indexOf(p.id) !== -1; });
    else if (filtro !== 'todas') listaFiltrada = todas.filter(function (p) { return categoriasDePlantilla(p, banco)[filtro]; });
    if (busqueda.trim()) {
      var q = normalizarTexto(busqueda);
      listaFiltrada = listaFiltrada.filter(function (p) { return normalizarTexto(nombreEjemplo(p, banco)).indexOf(q) !== -1; });
    }

    var listaHtml = listaFiltrada.length
      ? (vista === 'list'
        ? '<div class="rc-lista">' + listaFiltrada.map(function (p) { return filaRecetaLista(p, banco, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1); }).join('') + '</div>'
        : '<div class="rc-grid">' + listaFiltrada.map(function (p) { return tarjetaRecetaGrid(p, banco, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1); }).join('') + '</div>')
      : '<p class="card-msg">No hay recetas en esta categoría.</p>';

    return '<div class="rc-cabecera">' +
      '<h1 class="rc-titulo">Recetas</h1>' +
      '<div class="rc-vista-toggle">' +
      '<button type="button" class="rc-vista-btn' + (vista === 'list' ? ' rc-vista-btn-activo' : '') + '" data-action="recetas-vista" data-vista="list" aria-label="Vista de lista" aria-pressed="' + (vista === 'list') + '"><i data-lucide="list"></i></button>' +
      '<button type="button" class="rc-vista-btn' + (vista === 'grid' ? ' rc-vista-btn-activo' : '') + '" data-action="recetas-vista" data-vista="grid" aria-label="Vista de cuadrícula" aria-pressed="' + (vista === 'grid') + '"><i data-lucide="layout-grid"></i></button>' +
      '</div></div>' +
      '<div class="vista-body rc-body">' +
      '<label class="rc-buscador"><i data-lucide="search"></i>' +
      '<input type="search" id="recetas-buscador" placeholder="Buscar plato o ingrediente" value="' + escapeHtml(busqueda) + '"></label>' +
      '<div class="rc-chips scroll">' + chipsHtml + '</div>' +
      listaHtml +
      renderFormRecetaPropia(banco) +
      '</div>';
  }

  // Vista de receta a partir de una plantilla del banco (Roger 2026-07-19):
  // se abre desde Recetas, sin día ni comensales concretos — a diferencia de
  // renderVistaReceta (slot ya resuelto del plan), aquí no hay "quién come
  // esto hoy" ni valoración ni CTA de compra porque no hay plan real detrás.
  // Ingredientes/pasos con la combinación de ejemplo (nombreEjemplo), igual
  // que ya hacía la lista del banco.
  function renderVistaRecetaPlantilla(estado, banco, plantillaId) {
    var plantilla = E.plantillaPorId(banco, estado, plantillaId);
    if (!plantilla) {
      return '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos esta receta.</p></div>';
    }
    // Sin día ni familia detrás: seleccion "de ejemplo" (primera opción de
    // cada eje, igual criterio que nombreEjemplo) y UN comensal adulto
    // sintético solo para poder enseñar una ración de referencia — resolverPlato
    // deja ingredientes/pasos vacíos si seleccion/presentes llegan vacíos.
    var seleccionEjemplo = {};
    Object.keys(plantilla.ejes || {}).forEach(function (eje) {
      if (plantilla.ejes[eje] && plantilla.ejes[eje].length) seleccionEjemplo[eje] = plantilla.ejes[eje][0];
    });
    var resuelto = E.resolverPlato(plantilla, seleccionEjemplo, [{ id: '_preview' }], banco, []);
    var nombreSplit = splitNombrePlato(resuelto.nombre);
    var esCena = !!(plantilla.apta && plantilla.apta.indexOf('comida') === -1);
    var tag = ETIQUETA_ESFUERZO[plantilla.esfuerzo] || '—';
    var favorita = (estado.favoritas || []).indexOf(plantilla.id) !== -1;
    var oculta = (estado.ocultas || []).indexOf(plantilla.id) !== -1;
    var fotoHtml = plantilla.foto ? '<img src="' + escapeHtml(plantilla.foto) + '" alt="">' : '<div class="rv-foto-vacia"></div>';
    var variantes = variantesProteina(plantilla, banco);

    var ingredientesHtml = resuelto.ingredientes.slice().sort(function (a, b) {
      var na = banco.ingredientes[a.id] ? banco.ingredientes[a.id].nombre : a.id;
      var nb = banco.ingredientes[b.id] ? banco.ingredientes[b.id].nombre : b.id;
      return na.localeCompare(nb);
    }).map(function (item) {
      var ing = banco.ingredientes[item.id];
      return '<div class="rv-ingrediente"><span class="rv-ingrediente-bullet"></span><span class="rv-ingrediente-nombre">' + escapeHtml(ing ? ing.nombre : item.id) + '</span><span class="rv-ingrediente-g">' + item.gramos + ' g</span></div>';
    }).join('');

    var pasosHtml = resuelto.pasos.length
      ? '<div class="rv-pasos">' + resuelto.pasos.map(function (p, i) {
          return '<div class="rv-paso"><span class="rv-paso-num">' + (i + 1) + '</span><span class="rv-paso-texto">' + escapeHtml(p) + '</span></div>';
        }).join('') + '</div>'
      : '<p class="card-msg">Sin pasos detallados para esta receta.</p>';

    return '<div class="rv-hero">' + fotoHtml + '<div class="rv-hero-gradiente"></div>' +
      '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
      '<div class="rv-acciones">' +
      '<button type="button" class="rv-flotante' + (oculta ? ' rv-flotante-activo' : '') + '" data-action="toggle-oculta-receta" data-plantilla="' + plantilla.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '" aria-pressed="' + oculta + '"><i data-lucide="eye-off"></i></button>' +
      '<button type="button" class="rv-flotante' + (favorita ? ' rv-flotante-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + plantilla.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '</div></div>' +
      '<div class="rv-body">' +
      '<span class="rv-pill rv-pill-' + (esCena ? 'cena' : 'comida') + '">' + (esCena ? ICONO_LUNA : ICONO_SOL) + (esCena ? 'CENA' : 'COMIDA') + '</span>' +
      '<h1 class="rv-titulo">' + escapeHtml(nombreSplit.titulo) + '</h1>' +
      (nombreSplit.subtitulo ? '<p class="rv-subtitulo">' + escapeHtml(nombreSplit.subtitulo) + '</p>' : '') +
      '<div class="rv-stats">' +
      '<div class="rv-stat"><i data-lucide="clock"></i><span class="rv-stat-valor">' + (plantilla.tiempo_min || '?') + ' min</span></div>' +
      '<div class="rv-stat"><i data-lucide="flame"></i><span class="rv-stat-valor">~' + resuelto.kcalTotal + ' kcal</span></div>' +
      '<div class="rv-stat"><i data-lucide="leaf"></i><span class="rv-stat-valor">' + tag + '</span></div>' +
      '</div>' +
      '<p class="rv-variantes"><i data-lucide="info"></i>Ingredientes y cantidades para 1 ración de ejemplo.</p>' +
      (variantes ? '<p class="rv-variantes"><i data-lucide="shuffle"></i>' + escapeHtml(capitaliza(variantes)) + '</p>' : '') +
      '<p class="rv-seccion-titulo">Ingredientes</p>' +
      '<div class="rv-ingredientes">' + ingredientesHtml + '</div>' +
      '<p class="rv-seccion-titulo">Preparación</p>' +
      pasosHtml +
      '</div>';
  }

  // Frescos/Despensa/Frío (Roger 2026-07-19, handoff + decisión explícita):
  // taxonomía de conservación, no la nutricional real de categoriasDePlantilla
  // — deliberadamente distinta, es cómo se compra, no cómo se cuenta la cuota.
  // Solo agrupa la MISMA lista real (E.listaCompra); "Semana que viene" (3er
  // segmento) se retira de esta pantalla por decisión de Roger 2026-07-19,
  // pero estado.compra.marcadosSiguiente y generarPlanSiguiente() no se tocan.
  var GRUPO_COMPRA = {
    'pescado-blanco': 'frescos', 'pescado-azul': 'frescos', marisco: 'frescos',
    'carne-blanca': 'frescos', 'carne-roja': 'frescos', verdura: 'frescos', fruta: 'frescos',
    legumbre: 'despensa', cereal: 'despensa', tuberculo: 'despensa', otro: 'despensa',
    huevo: 'frio', lacteo: 'frio'
  };
  var GRUPOS_COMPRA_INFO = {
    frescos: { nombre: 'Frescos', icono: 'carrot' },
    despensa: { nombre: 'Despensa', icono: 'wheat' },
    frio: { nombre: 'Frío', icono: 'snowflake' }
  };
  var ORDEN_GRUPO_COMPRA = ['frescos', 'despensa', 'frio'];

  // ---------------------------------------------------------------
  // COMPRA — segmentado Hoy/Próximos 7 días + grupos Frescos/Despensa/Frío
  // ---------------------------------------------------------------
  function renderCompraVista(estado, plan, banco, rango) {
    rango = rango === 'hoy' ? 'hoy' : '7d';
    if (!plan) {
      return '<div class="rc-cabecera"><h1 class="rc-titulo">Compra</h1></div>' +
        '<div class="vista-body rc-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
    }
    var items = E.listaCompra(estado, plan, rango === 'hoy' ? 'hoy' : 'semana', banco);
    var marcadosN = items.filter(function (i) { return i.marcado; }).length;
    var pct = items.length ? Math.round(marcadosN / items.length * 100) : 0;

    var porGrupo = {};
    items.forEach(function (item) {
      var g = GRUPO_COMPRA[item.categoria] || 'despensa';
      if (!porGrupo[g]) porGrupo[g] = [];
      porGrupo[g].push(item);
    });

    var gruposHtml = ORDEN_GRUPO_COMPRA.filter(function (g) { return porGrupo[g] && porGrupo[g].length; }).map(function (g) {
      var info = GRUPOS_COMPRA_INFO[g];
      return '<div class="cp-grupo">' +
        '<p class="cp-grupo-titulo"><i data-lucide="' + info.icono + '"></i>' + info.nombre + '</p>' +
        '<div class="cp-lista"><ul class="lista-check">' + porGrupo[g].map(filaCompraHtml).join('') + '</ul></div>' +
        '</div>';
    }).join('');

    return '<div class="rc-cabecera">' +
      '<div><h1 class="rc-titulo">Compra</h1><p class="cp-resumen">' + marcadosN + ' de ' + items.length + ' en el carro</p></div>' +
      '<div class="cp-cabecera-derecha">' +
      (marcadosN > 0 ? '<button type="button" class="cp-vaciar" data-action="vaciar-compra" aria-label="Desmarcar todo"><i data-lucide="rotate-ccw"></i></button>' : '') +
      '<div class="cp-anillo" style="background:conic-gradient(var(--gold) ' + (pct * 3.6) + 'deg, var(--elev2) 0)"><span>' + pct + '%</span></div>' +
      '</div></div>' +
      '<div class="vista-body rc-body">' +
      '<div class="cp-seg">' +
      '<button type="button" class="cp-seg-btn' + (rango === 'hoy' ? ' cp-seg-btn-activo' : '') + '" data-action="segmento-compra" data-rango="hoy" aria-pressed="' + (rango === 'hoy') + '">Hoy</button>' +
      '<button type="button" class="cp-seg-btn' + (rango === '7d' ? ' cp-seg-btn-activo' : '') + '" data-action="segmento-compra" data-rango="7d" aria-pressed="' + (rango === '7d') + '">Próximos 7 días</button>' +
      '</div>' +
      (items.length ? gruposHtml : '<p class="card-msg">Nada pendiente de comprar.</p>') +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Sheet: cambiar plato (elegir otro / nevera) — lenguaje visual v3
  // (Roger 2026-07-19/20, handoff e3Foods.dc.html ~L541-554, tarea #18)
  // ---------------------------------------------------------------
  function renderSheetCambiarInicio(estado, banco, dia, tipoComida) {
    return sheetHead('Cambiar ' + (tipoComida === 'comida' ? 'comida' : 'cena')) +
      '<div class="sheet-body">' +
      '<p class="card-msg">¿De dónde sacamos la alternativa?</p>' +
      '<button type="button" class="sheet-fila-opcion" data-action="modo-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
      '<span class="sheet-fila-opcion-icono sheet-fila-opcion-icono-azul"><i data-lucide="refrigerator"></i></span>' +
      '<span class="sheet-fila-opcion-texto"><span class="sheet-fila-opcion-titulo">Con lo que hay en la nevera</span><span class="sheet-fila-opcion-sub">Recetas con lo de tu nevera</span></span>' +
      '<i data-lucide="chevron-right" class="sheet-fila-opcion-chevron"></i>' +
      '</button>' +
      '<button type="button" class="sheet-fila-opcion" data-action="modo-elegir-otro" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
      '<span class="sheet-fila-opcion-icono sheet-fila-opcion-icono-gold"><i data-lucide="book-open"></i></span>' +
      '<span class="sheet-fila-opcion-texto"><span class="sheet-fila-opcion-titulo">Elegir otro plato</span><span class="sheet-fila-opcion-sub">Explora el recetario completo</span></span>' +
      '<i data-lucide="chevron-right" class="sheet-fila-opcion-chevron"></i>' +
      '</button>' +
      '</div>';
  }

  function renderListaElegirOtro(estado, banco, plan, dia, tipoComida) {
    // Solo plantillas que el motor puede aceptar de verdad para ESTA mesa (dieta/
    // mesa mixta y vetos) — antes se listaba todo lo 'apta' y el tap acababa en
    // "no encontramos un plato" para opciones imposibles (bug 2026-07-16). Las
    // cuotas máximas también se pre-filtran desde el audit 2026-07-20: el modo
    // manual las mantiene (protegen salud) y ofrecer un plato que solo computa
    // una categoría ya saturada (p.ej. tabla de embutido con carne-roja al máximo)
    // repetía la misma clase de alert sin explicación.
    var diaObj = plan && plan.dias[dia];
    var presentes = diaObj ? E.presentesEnComida(estado, diaObj.fecha, dia, tipoComida) : [];
    var vetosUnion = E.vetosDe(presentes);
    var contadorCuotas = diaObj ? E.contadorSemanaSinSlot(plan, dia, tipoComida, banco) : {};
    var cuotas = (banco && banco.categorias_cuota) || {};
    var candidatas = E.plantillasDisponibles(banco, estado).filter(function (p) {
      return (p.apta || []).indexOf(tipoComida) !== -1 &&
        E.plantillaViableParaMesa(p, presentes, vetosUnion, banco) &&
        E.plantillaPasaCuotas(p, vetosUnion, contadorCuotas, cuotas, banco);
    });
    var listaHtml = candidatas.length
      ? '<ul class="lista-plantillas">' + candidatas.map(function (p) {
          return '<li><button type="button" class="fila-plantilla" data-action="elegir-plantilla" data-dia="' + dia + '" data-tipo="' + tipoComida + '" data-plantilla="' + p.id + '">' +
            '<span class="fila-plantilla-nombre">' + escapeHtml(capitaliza(nombreEjemplo(p, banco))) + '</span>' +
            '<span class="fila-plantilla-meta">' + (p.tiempo_min || '?') + ' min · ' + escapeHtml(ETIQUETA_ESFUERZO[p.esfuerzo] || p.esfuerzo || '') + '</span>' +
            '</button></li>';
        }).join('') + '</ul>'
      : '<p class="card-msg">No hay recetas disponibles para esta comida.</p>';
    return sheetHead('Elegir otro plato') +
      '<div class="sheet-body">' + listaHtml + '</div>';
  }

  function renderNevera(estado, banco, dia, tipoComida) {
    var filas = idsIngredientesOrdenados(banco).map(function (id) {
      var ing = banco.ingredientes[id];
      return '<li data-buscar="' + escapeHtml(normalizarTexto(ing.nombre)) + '"><label class="fila-nevera"><input type="checkbox" value="' + id + '" data-nombre="' + escapeHtml(ing.nombre) + '"> ' + escapeHtml(ing.nombre) + '</label></li>';
    }).join('');
    var micHtml = TIENE_VOZ
      ? '<button type="button" class="btn-filtro-icono btn-mic" data-action="nevera-voz" aria-label="Buscar por voz"><i data-lucide="mic"></i></button>'
      : '';
    return sheetHead('Con lo que hay en la nevera') +
      '<div class="sheet-body">' +
      '<p class="card-msg">Marca lo que tienes en casa y buscamos un plato que se pueda montar con eso.</p>' +
      '<div class="nevera-top">' +
      '<div class="nevera-buscador-fila">' +
      '<label class="rc-buscador"><i data-lucide="search"></i>' +
      '<input type="search" id="nevera-buscador" placeholder="Buscar ingrediente" autocomplete="off"></label>' +
      micHtml +
      '</div>' +
      '<div class="nevera-seleccion" id="nevera-seleccion" hidden></div>' +
      '<button type="button" class="btn-cta-gradiente" id="nevera-confirmar" data-action="confirmar-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">Buscar plato</button>' +
      '</div>' +
      '<ul class="lista-nevera" id="lista-nevera-checks">' + filas + '</ul>' +
      '</div>';
  }

  function renderConfirmarRegenerar(nombrePlato) {
    return sheetHead('Cambiado', true) +
      '<div class="sheet-body">' +
      '<p class="card-msg">Nuevo plato: <strong>' + escapeHtml(nombrePlato) + '</strong>.</p>' +
      '<p class="card-msg">¿Regenero los días siguientes para que el resto de la semana se reajuste?</p>' +
      '<div class="fila-botones">' +
      '<button type="button" class="btn-secondary" data-action="regenerar-no">No, dejarlo así</button>' +
      '<button type="button" class="btn-primary" data-action="regenerar-si">Sí, regenerar</button>' +
      '</div></div>';
  }

  // ---------------------------------------------------------------
  // Formulario de miembro — compartido entre wizard (alta) y sheet Familia (+miembro)
  // ---------------------------------------------------------------
  // chip-toggle genérico: fila de opciones excluyentes que sincronizan un input
  // hidden (mismo id que antes leía un <select>, para no tocar el guardado en app.js)
  function chipToggle(idHidden, opciones, valorActual, valorDefecto) {
    var actual = valorActual || valorDefecto;
    var input = '<input type="hidden" id="' + idHidden + '" value="' + actual + '">';
    var chips = opciones.map(function (o) {
      var activo = o.valor === actual;
      return '<button type="button" class="chip-toggle' + (activo ? ' chip-toggle-activo' : '') + '" ' +
        'data-action="mf-set-campo" data-campo-id="' + idHidden + '" data-valor="' + o.valor + '" ' +
        'aria-pressed="' + activo + '">' + escapeHtml(o.etiqueta) + '</button>';
    }).join('');
    return input + '<div class="fila-chips">' + chips + '</div>';
  }

  function renderFormMiembroCompleto(miembro, esAltaNueva) {
    miembro = miembro || {};
    var anioActual = new Date().getFullYear();
    var tieneFoto = !!miembro.foto;
    return '<div class="form-miembro-completo">' +
      (esAltaNueva ? '<p class="wizard-mini-titular">Solo te pido tres cosas.</p>' : '') +
      '<button type="button" class="foto-tap" id="mf-foto-preview" data-action="mf-subir-foto" ' +
        'aria-label="' + (tieneFoto ? 'Cambiar foto' : 'Añadir foto') + '"' + (tieneFoto ? avatarEstilo(miembro) : '') + '>' +
        fotoTapInner(miembro) +
      '</button>' +
      '<button type="button" class="btn-texto foto-quitar-link" id="mf-foto-quitar" data-action="mf-quitar-foto"' + (tieneFoto ? '' : ' hidden') + '>Quitar foto</button>' +
      '<input type="file" id="mf-foto-input" accept="image/*" hidden>' +
      '<label class="campo-nombre-miembro"><span class="campo-eyebrow">¿Cómo se llama?</span>' +
        '<input type="text" id="mf-nombre" class="input-editorial" maxlength="30" placeholder="Nombre" value="' + escapeHtml(miembro.nombre || '') + '" autocomplete="off"></label>' +
      '<div class="fila-sexo-anio">' +
        '<div class="campo-corto"><span class="campo-eyebrow">Sexo</span>' + chipToggle('mf-sexo', OPCIONES_SEXO, miembro.sexo, 'mujer') + '</div>' +
        '<div class="campo-corto"><span class="campo-eyebrow">Año de nacimiento</span>' +
          '<input type="number" inputmode="numeric" id="mf-anio" class="input-editorial input-corto" placeholder="p.ej. 1985" min="1920" max="' + anioActual + '" value="' + (miembro.anioNacimiento || '') + '"></div>' +
      '</div>' +
      '<p class="wizard-incentivo">Si me cuentas un poco más, te ayudaré mejor.</p>' +
      '<details class="mas-detalles">' +
        '<summary><span class="mas-detalles-texto">Añadir más detalles</span><span class="mas-detalles-icono" aria-hidden="true"></span></summary>' +
        '<div class="mas-detalles-cuerpo">' +
        '<div class="fila-sexo-anio">' +
          '<div class="campo-corto"><span class="campo-eyebrow">Altura (cm)</span><input type="number" id="mf-altura" class="input-editorial input-corto" min="30" max="230" value="' + (miembro.altura || '') + '"></div>' +
          '<div class="campo-corto"><span class="campo-eyebrow">Peso (kg)</span><input type="number" id="mf-peso" class="input-editorial input-corto" min="1" max="200" value="' + (miembro.peso || '') + '"></div>' +
        '</div>' +
        '<span class="campo-eyebrow">Actividad</span>' + chipToggle('mf-actividad', OPCIONES_ACTIVIDAD, miembro.actividad, 'media') +
        '<span class="campo-eyebrow">Tipo de dieta</span>' + chipToggle('mf-dieta', OPCIONES_DIETA, miembro.dieta, 'omnivora') +
        '</div>' +
      '</details>' +
      '<div class="fila-botones">' +
        '<button type="button" class="btn-secondary" data-action="mf-cancelar">Cancelar</button>' +
        '<button type="button" class="btn-primary" data-action="mf-guardar">Guardar</button>' +
      '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Wizard — alta conversacional en 3 pasos (una pregunta por pantalla)
  // ---------------------------------------------------------------

  // PASO 1 — saludo + "¿cómo os llamáis?" (nombre de familia). Sin campos de
  // miembro todavía: una sola pregunta, una sola respuesta, como pediría
  // alguien al conoceros de verdad.
  // Vocabulario de regiones (tramo 1, 2026-07-17) — research §2.1. Es un dato
  // de la familia (dónde vive), no un mando del motor: el sesgo regional del
  // scoring es interno. cantabria está en el selector aunque el banco todavía
  // no tenga platos suyos (una familia cántabra tiene que poder elegirse).
  var REGIONES = [
    { id: 'andalucia', nombre: 'Andalucía' },
    { id: 'aragon', nombre: 'Aragón' },
    { id: 'asturias', nombre: 'Asturias' },
    { id: 'baleares', nombre: 'Baleares' },
    { id: 'canarias', nombre: 'Canarias' },
    { id: 'cantabria', nombre: 'Cantabria' },
    { id: 'castilla', nombre: 'Castilla' },
    { id: 'cataluna', nombre: 'Cataluña' },
    { id: 'comunidad-valenciana', nombre: 'Comunidad Valenciana' },
    { id: 'euskadi', nombre: 'Euskadi' },
    { id: 'extremadura', nombre: 'Extremadura' },
    { id: 'galicia', nombre: 'Galicia' },
    { id: 'madrid', nombre: 'Madrid' },
    { id: 'murcia', nombre: 'Murcia' },
    { id: 'navarra-rioja', nombre: 'Navarra / La Rioja' }
  ];

  function opcionesRegion(seleccionada) {
    return '<option value=""' + (!seleccionada ? ' selected' : '') + '>Prefiero no decirlo</option>' +
      REGIONES.map(function (r) {
        return '<option value="' + r.id + '"' + (seleccionada === r.id ? ' selected' : '') + '>' + escapeHtml(r.nombre) + '</option>';
      }).join('');
  }

  function renderWizardBienvenida(nombreFamilia, familiaRegion) {
    return '<p class="wizard-saludo">¡Bienvenidos!</p>' +
      '<h1 class="wizard-pregunta">Quiero conoceros.<br>¿Cómo os llamáis?</h1>' +
      '<label class="campo-nombre-familia"><span class="campo-eyebrow">Nombre de familia</span>' +
        '<input type="text" id="wz-nombre-familia" class="input-editorial" maxlength="40" placeholder="p.ej. Los Fernández" value="' + escapeHtml(nombreFamilia || '') + '" autofocus></label>' +
      '<label class="campo-nombre-familia"><span class="campo-eyebrow">¿De dónde sois? (opcional)</span>' +
        '<select id="wz-region" class="input-editorial">' + opcionesRegion(familiaRegion) + '</select></label>' +
      '<button type="button" class="btn-primary wizard-cta" data-action="wizard-siguiente-bienvenida">Siguiente</button>' +
      '<button type="button" class="btn-texto" data-action="landing-unirse">¿Ya tienes un código de familia?</button>' +
      '<button type="button" class="btn-texto" data-action="ver-demo">O mira un ejemplo primero</button>';
  }

  // PASO 2 — "¿quién vive en casa de los X?" (usa el nombre ya dado, paso 1,
  // para que se note que la app escuchó). Lista vacía: el "+" es el único
  // foco posible de la pantalla, centrado, no una esquina discreta.
  function renderWizardHub(nombreFamilia, miembros) {
    var nombreLimpio = (nombreFamilia || '').trim();
    var titulo = nombreLimpio ? ('¿Quién vive en casa de los <em>' + escapeHtml(nombreLimpio) + '</em>?') : '¿Quién vive en tu casa?';

    if (!miembros.length) {
      return '<button type="button" class="wizard-volver" data-action="wizard-volver-bienvenida">‹ Cambiar nombre de familia</button>' +
        '<h1 class="wizard-pregunta">' + titulo + '</h1>' +
        '<div class="wizard-vacio-centro">' +
          '<button type="button" class="btn-anadir-miembro btn-anadir-miembro-grande" data-action="wizard-abrir-form" aria-label="Añadir el primer miembro">+</button>' +
          '<p class="wizard-vacio">Añade al primero para empezar.</p>' +
        '</div>';
    }

    var listaHtml = '<ul class="wizard-lista-miembros">' + miembros.map(function (m) {
      return '<li class="wizard-miembro-card">' +
        '<span class="avatar avatar-presente"' + avatarEstilo(m) + '>' + avatarInner(m) + '</span>' +
        '<span class="wizard-miembro-info"><strong>' + escapeHtml(m.nombre) + '</strong><span>' + (m.anioNacimiento || '?') + '</span></span>' +
        '<span class="wizard-miembro-acciones">' +
          '<button type="button" class="btn-texto" data-action="wizard-editar-miembro" data-id="' + m.id + '">Editar</button>' +
          '<button type="button" class="btn-texto btn-borrar" data-action="wizard-quitar-miembro" data-id="' + m.id + '">Quitar</button>' +
        '</span>' +
        '</li>';
    }).join('') + '</ul>';

    return '<button type="button" class="wizard-volver" data-action="wizard-volver-bienvenida">‹ Cambiar nombre de familia</button>' +
      '<h1 class="wizard-pregunta">' + titulo + '</h1>' +
      listaHtml +
      '<button type="button" class="btn-anadir-miembro" data-action="wizard-abrir-form" aria-label="Añadir otro miembro">+</button>' +
      '<button type="button" class="btn-primary wizard-cta" id="wizard-generar" data-action="wizard-generar">Crear nuestro menú</button>';
  }

  // ---------------------------------------------------------------
  // Sheet "Tu familia" (vía avatar en cabecera de HOY/SEMANA)
  // ---------------------------------------------------------------
  var ABREV_PATRON = { casa: 'Cas', fuera: 'Fue', cole: 'Col' };
  var PATRON_TODO_CASA = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa'];

  function renderPatronGrid(miembro, tipo) {
    var valores = (miembro.patron && miembro.patron[tipo]) || PATRON_TODO_CASA;
    return '<div class="patron-grid">' + valores.map(function (v, i) {
      var etiqueta = NOMBRES_DIA[i] + ': ' + ETIQUETAS_PATRON[v] + '. Toca para cambiar.';
      return '<button type="button" class="patron-celda patron-' + v + '" data-action="toggle-patron" data-id="' + miembro.id + '" data-tipo="' + tipo + '" data-dia="' + i + '" aria-label="' + escapeHtml(etiqueta) + '">' +
        '<span class="patron-dia">' + NOMBRES_DIA_CORTO[i] + '</span><span class="patron-valor">' + ABREV_PATRON[v] + '</span></button>';
    }).join('') + '</div>';
  }

  function renderVetos(miembro, banco) {
    var vetos = miembro.vetos || [];
    // el estado visual del chip marcado lo lleva .veto-chip:has(input:checked) en CSS
    return '<div class="vetos-grid">' + idsIngredientesOrdenados(banco).map(function (id) {
      var marcado = vetos.indexOf(id) !== -1;
      return '<label class="veto-chip">' +
        '<input type="checkbox" data-action="toggle-veto" data-id="' + miembro.id + '" data-ingrediente="' + id + '" ' + (marcado ? 'checked' : '') + '> ' + escapeHtml(banco.ingredientes[id].nombre) +
        '</label>';
    }).join('') + '</div>';
  }

  // chip-toggle ligado a data-campo/data-id (edición in-place de un miembro ya
  // existente) — mismo look que chipToggle(), distinta fontanería de guardado.
  function chipToggleMiembro(campo, opciones, valorActual, id) {
    return '<div class="fila-chips">' + opciones.map(function (o) {
      var activo = o.valor === valorActual;
      return '<button type="button" class="chip-toggle' + (activo ? ' chip-toggle-activo' : '') + '" ' +
        'data-action="miembro-set-campo" data-campo="' + campo + '" data-id="' + id + '" data-valor="' + o.valor + '" ' +
        'aria-pressed="' + activo + '">' + escapeHtml(o.etiqueta) + '</button>';
    }).join('') + '</div>';
  }

  // Ficha de miembro — pantalla completa (Roger 2026-07-19, handoff Claude
  // Design). Sustituye al <details> dentro del sheet Familia: mismos campos
  // reales (nombre/foto/sexo/año/altura/peso/actividad/dieta/patrón/vetos,
  // guardado en vivo por campo vía data-campo/data-id — actualizarCampoMiembro
  // es genérica) + 3 campos de texto libre nuevos del handoff (alergias,
  // leGusta, noLeGusta) que se guardan igual pero NO alimentan el motor
  // todavía (decisión de Roger, Q1 de la sesión del redisño).
  function renderVistaMiembro(estado, banco, miembroId, miembroDispositivoId) {
    var miembro = (estado.familia || []).find(function (m) { return m.id === miembroId; });
    if (!miembro) {
      return '<button type="button" class="rv-flotante rv-volver" data-action="miembro-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos a este miembro.</p></div>';
    }
    var esDispositivo = miembro.id === miembroDispositivoId;
    var tieneFoto = !!miembro.foto;
    return '<div class="mf-cabecera">' +
      '<button type="button" class="rv-flotante rv-volver" data-action="miembro-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
      '</div>' +
      '<div class="vista-body rc-body mf-body">' +
      '<div class="mf-foto-fila">' +
      '<button type="button" class="foto-tap" data-action="miembro-subir-foto" data-id="' + miembro.id + '" ' +
        'aria-label="' + (tieneFoto ? 'Cambiar foto' : 'Añadir foto') + '"' + (tieneFoto ? avatarEstilo(miembro) : '') + '>' +
        fotoTapInner(miembro) +
      '</button>' +
      (tieneFoto ? '<button type="button" class="btn-texto foto-quitar-link" data-action="miembro-quitar-foto" data-id="' + miembro.id + '">Quitar foto</button>' : '') +
      '<input type="file" accept="image/*" hidden data-foto-input="' + miembro.id + '">' +
      '<h1 class="mf-nombre-titulo">' + escapeHtml(miembro.nombre) + '</h1>' +
      '</div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">Nombre</span><input type="text" class="input-editorial" data-campo="nombre" data-id="' + miembro.id + '" value="' + escapeHtml(miembro.nombre) + '" maxlength="30"></div>' +
      '<div class="mf-fila-2">' +
      '<div class="mf-campo"><span class="campo-eyebrow">Sexo</span>' + chipToggleMiembro('sexo', OPCIONES_SEXO, miembro.sexo || 'mujer', miembro.id) + '</div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">Año de nacimiento</span><input type="number" inputmode="numeric" class="input-editorial" data-campo="anioNacimiento" data-id="' + miembro.id + '" value="' + (miembro.anioNacimiento || '') + '" min="1920" max="' + new Date().getFullYear() + '"></div>' +
      '</div>' +
      '<div class="mf-fila-2">' +
      '<div class="mf-campo"><span class="campo-eyebrow">Altura (cm, opcional)</span><input type="number" class="input-editorial" data-campo="altura" data-id="' + miembro.id + '" value="' + (miembro.altura || '') + '" min="30" max="230"></div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">Peso (kg, opcional)</span><input type="number" class="input-editorial" data-campo="peso" data-id="' + miembro.id + '" value="' + (miembro.peso || '') + '" min="1" max="200"></div>' +
      '</div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">Actividad</span>' + chipToggleMiembro('actividad', OPCIONES_ACTIVIDAD, miembro.actividad || 'media', miembro.id) + '</div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">Tipo de dieta</span>' + chipToggleMiembro('dieta', OPCIONES_DIETA, miembro.dieta || 'omnivora', miembro.id) + '</div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">Alergias / restricciones</span><input type="text" class="input-editorial" data-campo="alergias" data-id="' + miembro.id + '" value="' + escapeHtml(miembro.alergias || '') + '" placeholder="Ninguna"></div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">Le gusta</span><input type="text" class="input-editorial" data-campo="leGusta" data-id="' + miembro.id + '" value="' + escapeHtml(miembro.leGusta || '') + '" placeholder="Platos favoritos"></div>' +
      '<div class="mf-campo"><span class="campo-eyebrow">No le gusta</span><input type="text" class="input-editorial" data-campo="noLeGusta" data-id="' + miembro.id + '" value="' + escapeHtml(miembro.noLeGusta || '') + '" placeholder="Ingredientes a evitar"></div>' +
      '<p class="rv-seccion-titulo">Patrón — comida</p>' + renderPatronGrid(miembro, 'comida') +
      '<p class="rv-seccion-titulo">Patrón — cena</p>' + renderPatronGrid(miembro, 'cena') +
      '<p class="rv-seccion-titulo">Vetos (no le gusta / alergia)</p>' + renderVetos(miembro, banco) +
      '<button type="button" class="chip-toggle mf-dispositivo' + (esDispositivo ? ' chip-toggle-activo' : '') + '" data-action="marcar-yo-dispositivo" data-id="' + miembro.id + '" aria-pressed="' + esDispositivo + '">' + (esDispositivo ? '✓ Eres tú en este móvil' : 'Marcar como tú en este móvil') + '</button>' +
      '<button type="button" class="btn-texto btn-borrar mf-eliminar" data-action="borrar-miembro" data-id="' + miembro.id + '">Eliminar de la familia</button>' +
      '</div>';
  }

  // Menú hamburguesa (Roger 2026-07-14): dropdown pequeño anclado al botón
  // (arriba izquierda, donde se toca) — no el sheet grande de abajo. Reservado
  // para listas cortas de acciones; el sheet de abajo sigue siendo para
  // pantallas con contenido real (Familia, nevera, receta...).
  function renderMenuHamburguesa() {
    return '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-ir-familia">Familia</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-regenerar-semana">Regenerar menús</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-importar-cole">Importar menú del cole</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-sync">Sincronizar familia</button>';
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
    var head = sheetHead('Sincronizar familia');

    if (opts.cargando) {
      return head + '<div class="sheet-body"><p class="card-msg">Cargando…</p></div>';
    }

    if (opts.synced) {
      var aviso = opts.aviso ? '<p class="card-msg">' + escapeHtml(opts.aviso) + '</p>' : '';
      return head + '<div class="sheet-body">' +
        '<p class="card-msg">' + escapeHtml(opts.nombreFamilia || 'Tu familia') + ' está sincronizada. Comparte este código con quien quieras que vea y edite el menú desde su móvil:</p>' +
        '<div class="sync-codigo-caja"><span class="campo-eyebrow">Código</span><p class="sync-codigo">' + escapeHtml(opts.code || '') + '</p></div>' +
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
      '<p class="card-msg">Activa la sincronización para ver y editar el menú desde varios móviles a la vez.</p>' +
      errorHtml +
      '<button type="button" class="btn-sync-activar" id="sync-activar-btn" data-action="sync-activar">Activar sincronización</button>' +
      '<p class="sync-pregunta">¿Ya tienes un código de otra familia?</p>' +
      '<label><span class="campo-eyebrow">Código</span><input type="text" id="sync-code-input" class="input-editorial" placeholder="8 caracteres" maxlength="8" autocapitalize="characters" autocomplete="off"></label>' +
      '<button type="button" class="btn-secondary" id="sync-unirse-btn" data-action="sync-unirse">Unirme con el código</button>' +
      '</div>';
  }

  // Descubrir — 3 fichas de categorías REALES rotando a diario (Roger
  // 2026-07-20: sustituye el placeholder de mentira de la sesión anterior).
  // `E.categoriasDescubrir` hace todo el trabajo de datos (filtros sobre el
  // banco real, rotación determinista por día) — aquí solo se renderiza.
  // Cada ficha abre su lista de recetas (Roger 2026-07-20: tocaba la ficha y
  // no pasaba nada — las candidatas ya las calculaba el motor, solo faltaba
  // exponerlas y pintarlas en un sheet).
  function renderDescubrirVista(estado, banco) {
    // la fecha del render viaja en data-fecha (audit 2026-07-20): el handler
    // reabre la MISMA rotación aunque la medianoche cruce entre pintar y tocar.
    // d.foto puede ser null (categoría sin ninguna candidata con foto) — la
    // ficha tiene altura fija y el degradado + texto siguen legibles sin <img>.
    var fecha = hoyISO();
    var categorias = E.categoriasDescubrir(banco, estado, fecha);
    var fichasHtml = categorias.map(function (d, idx) {
      return '<button type="button" class="desc-ficha" data-action="descubrir-abrir-categoria" data-idx="' + idx + '" data-fecha="' + fecha + '">' +
        (d.foto ? '<img src="' + escapeHtml(d.foto) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<div class="desc-ficha-degradado"></div>' +
        '<div class="desc-ficha-texto">' +
        '<span class="desc-kicker">' + escapeHtml(d.kicker) + '</span>' +
        '<div class="desc-titulo">' + escapeHtml(d.titulo) + '</div>' +
        '</div></button>';
    }).join('');
    return '<div class="rc-cabecera"><div><h1 class="rc-titulo">Descubrir</h1><p class="cp-resumen">Ideas nuevas para tu familia</p></div></div>' +
      '<div class="vista-body rc-body"><div class="desc-lista">' +
      (fichasHtml || '<p class="card-msg">Muy pronto: ideas nuevas para tu familia.</p>') +
      '</div></div>';
  }

  // Descubrir → detalle de categoría: mismas tarjetas que la pestaña Recetas
  // (Roger 2026-07-20: "quiero pagina de recetas como la generica") — reutiliza
  // tarjetaRecetaGrid tal cual (foto, badge de esfuerzo, favorita/ocultar) en
  // vez de inventar una fila propia. Sin chips ni buscador: la categoría ya
  // viene filtrada por el motor, no hace falta volver a filtrar 7 platos.
  // Corazón/ojo tocan el mismo estado.favoritas/ocultas que Recetas — apto
  // porque es la MISMA plantilla, no una copia con su propio estado.
  function renderSheetDescubrirCategoria(categoria, estado, banco) {
    var ocultas = estado.ocultas || [];
    var favoritas = estado.favoritas || [];
    var tarjetasHtml = categoria.candidatas.map(function (p) {
      return tarjetaRecetaGrid(p, banco, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1);
    }).join('');
    return sheetHead(categoria.titulo) +
      '<div class="sheet-body"><div class="rc-grid">' + tarjetasHtml + '</div></div>';
  }

  // Familia — lista de miembros (Roger 2026-07-19, handoff): tarjeta por
  // persona con avatar/nombre/edad/dieta, toca para abrir su ficha completa
  // (renderVistaMiembro). Sustituye al sheet "Tu familia" — nombreFamilia/
  // familiaRegion y "recetas ocultas" quedan sin superficie propia en este
  // rediseño (el dato sigue intacto, solo no hay UI para tocarlo hoy).
  function renderPerfilVista(estado) {
    var familia = estado.familia || [];
    var filasHtml = familia.map(function (m, idx) {
      var edad = E.edadEnAnios(m.anioNacimiento);
      return '<button type="button" class="pf-fila" data-action="abrir-miembro-ficha" data-id="' + m.id + '">' +
        '<span class="pf-avatar" ' + avatarEstiloColor(m, colorMiembro(idx)) + '>' + avatarInner(m) + '</span>' +
        '<span class="pf-info"><span class="pf-nombre">' + escapeHtml(m.nombre) + '</span><span class="pf-meta">' + edad + ' años · ' + escapeHtml(etiquetaDieta(m.dieta)) + '</span></span>' +
        '<i data-lucide="chevron-right"></i>' +
        '</button>';
    }).join('');

    return '<div class="rc-cabecera"><div><h1 class="rc-titulo">Familia</h1><p class="cp-resumen">Personaliza el menú para cada uno</p></div></div>' +
      '<div class="vista-body rc-body">' +
      '<div class="pf-lista">' + filasHtml + '</div>' +
      '<button type="button" class="pf-anadir" data-action="familia-abrir-form-miembro"><i data-lucide="plus"></i>Añadir miembro</button>' +
      '</div>';
  }

  global.E3UI = {
    renderHome: renderHome,
    renderDescubrirVista: renderDescubrirVista,
    renderSheetDescubrirCategoria: renderSheetDescubrirCategoria,
    renderPerfilVista: renderPerfilVista,
    renderRecetasVista: renderRecetasVista,
    renderVistaRecetaPlantilla: renderVistaRecetaPlantilla,
    renderCompraVista: renderCompraVista,
    renderVistaReceta: renderVistaReceta,
    renderSheetResumenSemana: renderSheetResumenSemana,
    renderSheetCambiarInicio: renderSheetCambiarInicio,
    renderListaElegirOtro: renderListaElegirOtro,
    renderNevera: renderNevera,
    renderConfirmarRegenerar: renderConfirmarRegenerar,
    renderVistaMiembro: renderVistaMiembro,
    renderPatronGrid: renderPatronGrid,
    renderMenuHamburguesa: renderMenuHamburguesa,
    renderSheetImportarCole: renderSheetImportarCole,
    renderSheetSync: renderSheetSync,
    renderFormMiembroCompleto: renderFormMiembroCompleto,
    renderWizardBienvenida: renderWizardBienvenida,
    renderWizardHub: renderWizardHub,
    sheetHead: sheetHead,
    fotoTapInner: fotoTapInner,
    escapeHtml: escapeHtml,
    normalizarTexto: normalizarTexto
  };
})(typeof window !== 'undefined' ? window : this);
