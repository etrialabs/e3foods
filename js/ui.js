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
  var ETIQUETAS_CUOTA = { 'pescado-total': 'Pescado (total)' };

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

  function iniciales(nombre) {
    if (!nombre) return '?';
    return nombre.trim().charAt(0).toUpperCase();
  }

  // avatar con foto (dataURL) si existe, con fallback a iniciales — mismo patrón que el
  // motor viejo (e3foods.html): la foto sustituye el avatar de letra cuando hay una subida.
  function avatarInner(miembro) {
    return miembro.foto ? '' : escapeHtml(iniciales(miembro.nombre));
  }
  function avatarEstilo(miembro) {
    return miembro.foto ? " style=\"background-image:url('" + miembro.foto + "')\"" : '';
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

  // ---------------------------------------------------------------
  // Cabecera midnight compartida por HOY / SEMANA / RECETAS / COMPRA
  // ---------------------------------------------------------------
  function renderCabecera(opts) {
    opts = opts || {};
    var titulo = '<h1 class="cabecera-titulo">' + escapeHtml(opts.tituloPlain || '') +
      (opts.tituloItalico ? ' <em>' + escapeHtml(opts.tituloItalico) + '</em>' : '') + '</h1>';
    var derecha = opts.contador ? '<span class="cabecera-contador">' + escapeHtml(opts.contador) + '</span>' : '';
    if (opts.botonAnadir) {
      derecha = '<div class="cabecera-derecha-grupo">' + derecha +
        '<button type="button" class="cabecera-btn-anadir" data-action="' + opts.botonAnadir + '" aria-label="Añadir receta">+</button></div>';
    }
    return '<header class="cabecera-midnight"><div class="cabecera-fila">' + titulo + derecha + '</div>' + (opts.extra || '') + '</header>';
  }

  // iconos de sol/luna — mismo estilo de línea que el nav (24x24, stroke)
  var ICONO_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';
  var ICONO_LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a6.8 6.8 0 0 0 11.3 11.3z"/></svg>';
  // meta de la card (kcal/tiempo) — silueta gris, no emoji a color (Roger 2026-07-14)
  var ICONO_FUEGO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 3-3 4-3 7.5a3 3 0 0 0 6 0c0-1.5-1-2-1-3.5 1.5 1 3 3 3 5.5a5 5 0 0 1-10 0C7 8 10 6 12 3z"/></svg>';
  var ICONO_RELOJ = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>';

  // app-bar de SEMANA (Roger 2026-07-14, referencia visual externa): el menú
  // reutiliza abrir-familia (única acción real ya existente), la campana
  // queda decorativa — no hay sistema de notificaciones construido todavía.
  var ICONO_MENU = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16M4 12h16M4 17.5h16"/></svg>';
  var ICONO_CAMPANA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 10.5a6 6 0 0 1 12 0c0 4 1.4 5.3 2 6H4c.6-.7 2-2 2-6z"/><path d="M10 19a2.2 2.2 0 0 0 4 0"/></svg>';

  // RECETAS (Roger 2026-07-14): buscador, filtros colapsables, favorita/ocultar por fila
  var ICONO_BUSCAR = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.8-4.8"/></svg>';
  var ICONO_FILTRO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h16M7.5 12h9M11 17.5h2"/></svg>';
  var ICONO_OJO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  var ICONO_OJO_TACHADO = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 3.5l17 17M10.6 10.7a3 3 0 0 0 4.2 4.2M7 7.4C4.7 8.9 2.5 12 2.5 12S6 18.5 12 18.5c1.8 0 3.4-.4 4.8-1.1M17.9 16c2.3-1.6 3.6-4 3.6-4S18 5.5 12 5.5c-.9 0-1.8.1-2.6.4"/></svg>';
  var ICONO_ESTRELLA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.8l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.7z"/></svg>';
  var ICONO_ESTRELLA_LLENA = '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 3.5l2.6 5.4 5.9.7-4.3 4.1 1.1 5.9L12 16.8l-5.3 2.8 1.1-5.9-4.3-4.1 5.9-.7z"/></svg>';
  var ICONO_MIC = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5v3.5M9 21h6"/></svg>';

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

  function renderSlot(estado, banco, plan, diaIndex, tipoComida) {
    var dia = plan.dias[diaIndex];
    var slot = dia ? dia[tipoComida] : null;
    var mesa = comensalesDeSlot(estado, plan, diaIndex, tipoComida);
    var miembrosDelSlot = mesa.miembrosDelSlot;
    var presentes = mesa.presentes;
    var etiqueta = tipoComida === 'comida' ? 'COMIDA' : 'CENA';
    var icono = tipoComida === 'comida' ? ICONO_SOL : ICONO_LUNA;
    var cabeceraTipo = '<div class="card-comida-head"><span class="card-comida-icono">' + icono + '</span><span class="card-comida-etiqueta">' + etiqueta + '</span></div>';

    var avataresHtml = miembrosDelSlot.map(function (m) {
      var estaPresente = presentes.some(function (p) { return p.id === m.id; });
      return '<span class="avatar-wrap">' +
        '<button type="button" class="avatar ' + (estaPresente ? 'avatar-presente' : 'avatar-ausente') + '"' + avatarEstilo(m) + ' ' +
        'data-action="toggle-presente" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '" data-miembro="' + m.id + '" ' +
        'aria-pressed="' + estaPresente + '" aria-label="' + escapeHtml(m.nombre) + (estaPresente ? ', en casa. Toca para marcar que hoy no come.' : ', fuera hoy. Toca para marcar que sí come.') + '">' +
        avatarInner(m) + '</button>' +
        '<span class="avatar-badge ' + (estaPresente ? 'avatar-badge-ok' : 'avatar-badge-no') + '" aria-hidden="true">' + (estaPresente ? '✓' : '−') + '</span>' +
        '</span>';
    }).join('');

    if (!miembrosDelSlot.length) {
      return '<section class="card card-slot card-vacia">' + cabeceraTipo +
        '<p class="card-msg">Nadie come en casa (' + (tipoComida === 'comida' ? 'mediodía' : 'noche') + ').</p>' +
        '</section>';
    }

    if (!slot) {
      return '<section class="card card-slot card-vacia" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">' + cabeceraTipo +
        '<p class="card-msg">No encontramos un plato que encaje con los gustos/vetos actuales.</p>' +
        '<div class="avatares" role="group" aria-label="Quién come">' + avataresHtml + '</div>' +
        '<button type="button" class="btn-secondary btn-cambiar" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">Elegir plato</button>' +
        '</section>';
    }

    var plantilla = E.plantillaPorId(banco, estado, slot.plantillaId);
    if (!plantilla) {
      return '<section class="card card-slot card-vacia"><p class="card-msg">Receta no disponible.</p></section>';
    }

    var resuelto = E.resolverPlato(plantilla, slot.seleccion, mesa.comensales, banco, slot.adaptaciones);
    var adaptacionesVisibles = (slot.adaptaciones || []).filter(function (a) {
      return presentes.some(function (p) { return p.id === a.miembroId; });
    }).map(function (a) {
      var m = (estado.familia || []).find(function (mm) { return mm.id === a.miembroId; });
      var ing = banco.ingredientes[a.valor];
      return '· ' + escapeHtml(m ? m.nombre : '?') + ': ' + escapeHtml(ing ? ing.nombre : a.valor);
    }).join(' &nbsp; ');

    var kcalMedio = presentes.length ? Math.round(resuelto.kcalTotal / presentes.length) : 0;
    // proteína/comensal: sin dato todavía (no existe en el banco, ver STATUS_E3FOODS.md)
    // — se omite del meta en vez de inventar una cifra.
    var metaKcal = presentes.length ? '<span class="card-comida-meta-icono">' + ICONO_FUEGO + '</span>~' + kcalMedio + ' kcal' : '';
    var metaTiempo = plantilla.tiempo_min ? '<span class="card-comida-meta-icono">' + ICONO_RELOJ + '</span>' + plantilla.tiempo_min + ' min' : '';
    var meta = metaKcal + (presentes.length && plantilla.tiempo_min ? ' · ' : '') + metaTiempo;

    var nombreSplit = splitNombrePlato(resuelto.nombre);
    var btnSorprendeme = '<button type="button" class="btn-sorprendeme" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">✨ Me apetece otra cosa</button>';

    // Foto a la izquierda + contenido a la derecha en fila (Roger 2026-07-14,
    // 2ª corrección: ni lateral-40% ni foto-arriba, la referencia visual
    // externa lleva la foto como miniatura a la izquierda). Botón como franja
    // propia, discreta, debajo de toda la fila — no flota sobre la foto ni
    // compite en peso visual con el plato.
    var fotoHtml = plantilla.foto ? '<div class="card-foto-izq" style="background-image:url(\'' + escapeHtml(plantilla.foto) + '\')"></div>' : '';

    // Header COMIDA/CENA siempre arriba-izquierda de la card entera, no
    // dentro de la columna de contenido (Roger 2026-07-14, 3ª corrección) —
    // así el título del plato es lo primero de esa columna y queda alineado
    // con el borde superior de la foto, no debajo del eyebrow.
    var contenido = '<div class="card-comida-contenido">' +
      '<h2 class="card-comida-titulo">' + escapeHtml(nombreSplit.titulo) + '</h2>' +
      (nombreSplit.subtitulo ? '<p class="card-comida-subtitulo">' + escapeHtml(nombreSplit.subtitulo) + '</p>' : '') +
      (adaptacionesVisibles ? '<p class="card-adaptaciones">' + adaptacionesVisibles + '</p>' : '') +
      (!presentes.length ? '<p class="card-msg">Nadie confirmado para esta comida.</p>' : '') +
      (meta ? '<p class="card-comida-meta">' + meta + '</p>' : '') +
      '<div class="avatares" role="group" aria-label="Quién come">' + avataresHtml + '</div>' +
      '</div>';

    // Tocar la foto o el contenido abre la receta completa (Roger 2026-07-14:
    // el banco tiene ingredientes-por-comensales y pasos, pero no se veían en
    // ningún sitio). Los avatares y el CTA tienen su propio data-action más
    // específico y ganan el click por delegación — sin conflicto.
    return '<section class="card card-slot" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">' +
      cabeceraTipo +
      '<div class="card-comida-fila" data-action="abrir-receta" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '" role="button" tabindex="0" aria-label="Ver receta completa">' + fotoHtml + contenido + '</div>' +
      btnSorprendeme +
      '</section>';
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
  // Sheet: receta completa (ingredientes adaptados a comensales + pasos)
  // ---------------------------------------------------------------
  function renderSheetReceta(estado, banco, plan, diaIndex, tipoComida) {
    var dia = plan.dias[diaIndex];
    var slot = dia[tipoComida];
    var plantilla = E.plantillaPorId(banco, estado, slot.plantillaId);
    var comensales = comensalesDeSlot(estado, plan, diaIndex, tipoComida).comensales;
    var resuelto = E.resolverPlato(plantilla, slot.seleccion, comensales, banco, slot.adaptaciones);

    var ingredientesHtml = resuelto.ingredientes.slice().sort(function (a, b) {
      var na = banco.ingredientes[a.id] ? banco.ingredientes[a.id].nombre : a.id;
      var nb = banco.ingredientes[b.id] ? banco.ingredientes[b.id].nombre : b.id;
      return na.localeCompare(nb);
    }).map(function (item) {
      var ing = banco.ingredientes[item.id];
      return '<li class="fila-ingrediente-receta">' + escapeHtml(ing ? ing.nombre : item.id) + '<span>' + item.gramos + ' g</span></li>';
    }).join('');

    var pasosHtml = resuelto.pasos.length
      ? '<ol class="lista-pasos-receta">' + resuelto.pasos.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') + '</ol>'
      : '<p class="card-msg">Sin pasos detallados para esta receta.</p>';

    // Segunda (o tercera...) cocción por mesa mixta (Roger 2026-07-14): si a
    // alguien le toca un ingrediente distinto en el eje proteína, sus pasos
    // van aparte — antes solo constaba como nota de texto en la card, sin
    // explicar cómo cocinarlo ni sumarlo a la compra.
    var pasosAdaptadosHtml = (resuelto.pasosAdaptados || []).map(function (pa) {
      var m = (estado.familia || []).find(function (mm) { return mm.id === pa.miembroId; });
      return '<p class="detalle-subtitulo">Para ' + escapeHtml(m ? m.nombre : '?') + ' (' + escapeHtml(pa.ingrediente) + ')</p>' +
        '<ol class="lista-pasos-receta">' + pa.pasos.map(function (p) { return '<li>' + escapeHtml(p) + '</li>'; }).join('') + '</ol>';
    }).join('');

    var comensalesTexto = comensales.length + (comensales.length === 1 ? ' comensal' : ' comensales');
    var kcalMedio = comensales.length ? Math.round(resuelto.kcalTotal / comensales.length) : 0;

    return sheetHead(resuelto.nombre) +
      '<div class="sheet-body">' +
      '<p class="receta-comensales">Cantidades para ' + comensalesTexto + ' · ~' + kcalMedio + ' kcal por persona.</p>' +
      '<p class="detalle-subtitulo">Ingredientes</p>' +
      '<ul class="lista-ingredientes-receta">' + ingredientesHtml + '</ul>' +
      '<p class="detalle-subtitulo">Preparación</p>' +
      pasosHtml +
      pasosAdaptadosHtml +
      renderValoracion(estado, dia.fecha, tipoComida) +
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
      '<button type="button" class="app-bar-btn" data-action="abrir-menu-hamburguesa" aria-label="Menú">' + ICONO_MENU + '</button>' +
      '<p class="app-bar-logo"><span class="app-bar-logo-e3">e3</span><span class="app-bar-logo-foods">foods</span></p>' +
      '<button type="button" class="app-bar-btn app-bar-campana" aria-label="Notificaciones" disabled>' + ICONO_CAMPANA + '<span class="app-bar-campana-dot" aria-hidden="true"></span></button>' +
      '</header>';
  }

  // Saludo + card IA: siempre sobre HOY, independiente del día que esté
  // seleccionado en las píldoras (esas son para ojear la semana, no para
  // redefinir qué es "hoy"). Ingrediente que falta = clicable → COMPRA/hoy
  // (Roger 2026-07-14: reutiliza la vista existente, sin pieza nueva de estado).
  function renderSaludoSemana(estado, plan, banco, miembroDispositivoId) {
    // "Quién soy yo en este móvil" (Roger 2026-07-14): preferencia LOCAL al
    // dispositivo (localStorage aparte, ver DISPOSITIVO_KEY en app.js) — no
    // viaja con la familia cuando haya sync, cada móvil recuerda la suya.
    // Sin elegir todavía (o el miembro ya no existe) → cae al primero, como antes.
    var familia = estado.familia || [];
    var miembroDispositivo = miembroDispositivoId && familia.filter(function (m) { return m.id === miembroDispositivoId; })[0];
    var nombre = (miembroDispositivo || familia[0] || {}).nombre || '';
    var titulo = '<h1 class="saludo-titulo">' + saludoHora() + (nombre ? ', ' + escapeHtml(nombre) : '') + '.</h1>';

    // Roger 2026-07-14: solo 2 frases fijas, sin listar el detalle de lo que
    // falta aquí (eso vive en Compra) — "algunos ingredientes" es el link,
    // no cada nombre suelto.
    var items = E.listaCompra(estado, plan, 'hoy', banco);
    var faltan = items.filter(function (i) { return !i.marcado; });
    var fraseIngredientes = faltan.length
      ? 'Te faltan <button type="button" class="ingrediente-link" data-action="ir-compra-hoy">algunos ingredientes</button>.'
      : 'Tienes todos los ingredientes que necesitas.';

    var card = '<div class="card-ia">' +
      '<span class="card-ia-chispa" aria-hidden="true">✨</span>' +
      '<p class="card-ia-texto">Te he preparado las comidas de hoy. ' + fraseIngredientes + '</p>' +
      '</div>';

    return '<section class="saludo-semana">' + titulo + card + '</section>';
  }

  // ---------------------------------------------------------------
  // Vista SEMANA (única vista de primer nivel para el día a día — Hoy se
  // retiró como tab aparte, Roger 2026-07-13: el selector de día hace lo
  // mismo en una sola pantalla). Selector de día (píldoras L-D) sticky por
  // sí solo sobre fondo claro — referencia visual del handoff externo.
  // ---------------------------------------------------------------
  function renderSemana(estado, plan, banco, diaSeleccionado, miembroDispositivoId) {
    if (!plan) {
      return renderAppBar() + '<div class="vista-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
    }
    var hoyIdx = E.diaIndexDesdeFecha(plan, hoyISO());
    var idx = (diaSeleccionado != null && plan.dias[diaSeleccionado]) ? diaSeleccionado : (hoyIdx === -1 ? 0 : hoyIdx);

    var pildoras = plan.dias.map(function (dia, i) {
      var d = new Date(dia.fecha + 'T00:00:00');
      var clases = 'pildora-dia' + (i === idx ? ' pildora-dia-activa' : '') + (i === hoyIdx ? ' pildora-dia-hoy' : '');
      return '<button type="button" class="' + clases + '" data-action="semana-elegir-dia" data-dia="' + i + '" aria-pressed="' + (i === idx) + '">' +
        '<span class="pildora-dia-letra">' + NOMBRES_DIA_CORTO[i].charAt(0) + '</span>' +
        '<span class="pildora-dia-num">' + d.getDate() + '</span>' +
        '</button>';
    }).join('');
    var filaPildoras = '<div class="fila-pildoras-dia fila-pildoras-dia-sticky" role="group" aria-label="Elegir día">' + pildoras + '</div>';

    var dia = plan.dias[idx];
    return renderAppBar() + renderSaludoSemana(estado, plan, banco, miembroDispositivoId) + filaPildoras +
      '<div class="vista-body" data-dia-idx="' + idx + '">' +
      '<p class="vista-fecha-fila">' +
        '<span class="vista-fecha">' + NOMBRES_DIA[idx] + ' ' + fechaCorta(dia.fecha) + (idx === hoyIdx ? ' <span class="badge badge-hoy">HOY</span>' : '') + '</span>' +
        '<button type="button" class="pill-resumen" data-action="abrir-resumen-semana">Ver resumen semanal</button>' +
      '</p>' +
      renderSlot(estado, banco, plan, idx, 'comida') +
      renderSlot(estado, banco, plan, idx, 'cena') +
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
      var etiqueta = ETIQUETAS_CUOTA[r.categoria] || ETIQUETAS_CATEGORIA[r.categoria] || capitaliza(r.categoria.replace(/-/g, ' '));
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
      '<label>Proteína<select id="rp-proteina"><option value="">(sin proteína)</option>' + opcionesIng + '</select></label>' +
      '<label>Hidrato<select id="rp-hidrato"><option value="">(sin hidrato)</option>' + opcionesIng + '</select></label>' +
      '<label>Verdura<select id="rp-verdura"><option value="">(sin verdura)</option>' + opcionesIng + '</select></label>' +
      '<label>Apta para<select id="rp-apta"><option value="comida,cena">Comida y cena</option><option value="comida">Solo comida</option><option value="cena">Solo cena</option></select></label>' +
      '<label>Esfuerzo<select id="rp-esfuerzo"><option value="rapido">Rápido (≤25 min)</option><option value="medio">Medio (≤45 min)</option><option value="elaborado">Elaborado (findes)</option></select></label>' +
      '<button type="button" class="btn-primary" data-action="anadir-receta-propia">Guardar receta</button>' +
      '</div></details>';
  }

  function renderRecetasVista(estado, banco, filtro, busqueda, filtrosVisibles) {
    filtro = filtro || 'todas';
    busqueda = busqueda || '';
    var todas = E.todasLasPlantillas(banco, estado);
    var ocultas = estado.ocultas || [];
    var favoritas = estado.favoritas || [];

    var categoriasPresentes = {};
    todas.forEach(function (p) { Object.keys(categoriasDePlantilla(p, banco)).forEach(function (c) { categoriasPresentes[c] = 1; }); });
    var categorias = ORDEN_CATEGORIA.filter(function (c) { return categoriasPresentes[c]; });
    // vegetariana/sin-gluten van siempre, aunque el banco no tenga ese dato
    // todavía (Roger 2026-07-14) — al elegirlas ninguna plantilla coincide y
    // se ve el mensaje de "sin resultados" habitual: honesto, no simulado.
    var chips = ['todas'].concat(categorias, ['vegetariana', 'sin-gluten']);

    var chipsHtml = chips.map(function (c) {
      var activo = c === filtro;
      var nombre = c === 'todas' ? 'Todas' : (ETIQUETAS_CATEGORIA[c] || capitaliza(c));
      return '<button type="button" class="chip-filtro' + (activo ? ' chip-filtro-activo' : '') + '" data-action="filtro-receta" data-categoria="' + c + '">' + escapeHtml(nombre) + '</button>';
    }).join('');

    var listaFiltrada = filtro === 'todas' ? todas : todas.filter(function (p) { return categoriasDePlantilla(p, banco)[filtro]; });
    if (busqueda.trim()) {
      var q = normalizarTexto(busqueda);
      listaFiltrada = listaFiltrada.filter(function (p) { return normalizarTexto(nombreGenerico(p.nombre_patron)).indexOf(q) !== -1; });
    }

    var filasHtml = listaFiltrada.map(function (p) {
      var oculta = ocultas.indexOf(p.id) !== -1;
      var favorita = favoritas.indexOf(p.id) !== -1;
      return '<li class="fila-receta ' + (oculta ? 'receta-oculta' : '') + '">' +
        '<span class="fila-receta-nombre">' + escapeHtml(capitaliza(nombreGenerico(p.nombre_patron))) + '<span class="fila-plantilla-meta">' + (p.tiempo_min || '?') + ' min · ' + escapeHtml(p.esfuerzo || '') + '</span></span>' +
        '<span class="fila-receta-acciones">' +
          '<button type="button" class="btn-icono-fila' + (favorita ? ' btn-icono-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + p.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '">' + (favorita ? ICONO_ESTRELLA_LLENA : ICONO_ESTRELLA) + '</button>' +
          '<button type="button" class="btn-icono-fila" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '">' + (oculta ? ICONO_OJO : ICONO_OJO_TACHADO) + '</button>' +
        '</span>' +
        '</li>';
    }).join('');

    var cabecera = renderCabecera({ tituloPlain: 'Banco de', tituloItalico: 'recetas', contador: todas.length + ' platos', botonAnadir: 'abrir-form-receta-propia' });

    var buscadorFila = '<div class="recetas-buscador-fila">' +
      '<div class="buscador-wrap">' +
        '<span class="input-buscador-icono" aria-hidden="true">' + ICONO_BUSCAR + '</span>' +
        '<input type="search" id="recetas-buscador" class="input-buscador" placeholder="Buscar receta" value="' + escapeHtml(busqueda) + '">' +
      '</div>' +
      '<button type="button" class="btn-filtro-icono' + (filtrosVisibles ? ' btn-filtro-icono-activo' : '') + '" data-action="toggle-filtros-receta" aria-label="Filtros" aria-expanded="' + !!filtrosVisibles + '">' + ICONO_FILTRO + '</button>' +
      '</div>';

    return cabecera + '<div class="vista-body">' +
      buscadorFila +
      (filtrosVisibles ? '<div class="chips-filtro">' + chipsHtml + '</div>' : '') +
      '<ul class="lista-recetas">' + (filasHtml || '<p class="card-msg">No hay recetas en esta categoría.</p>') + '</ul>' +
      renderFormRecetaPropia(banco) +
      '</div>';
  }

  // ---------------------------------------------------------------
  // COMPRA — segmented control (7 días / hoy) + secciones por categoría
  // ---------------------------------------------------------------
  function renderCompraVista(estado, plan, banco, rango) {
    rango = rango || '7d';
    if (!plan) {
      return renderCabecera({ tituloPlain: 'Lista de', tituloItalico: 'compra', contador: '0/0 en el carro' }) +
        '<div class="vista-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
    }
    var items = E.listaCompra(estado, plan, rango === '7d' ? 'semana' : 'hoy', banco);
    var marcadosN = items.filter(function (i) { return i.marcado; }).length;
    var cabecera = renderCabecera({ tituloPlain: 'Lista de', tituloItalico: 'compra', contador: marcadosN + '/' + items.length + ' en el carro' });

    var porCategoria = {};
    var ordenCategorias = [];
    items.forEach(function (item) {
      if (!porCategoria[item.categoria]) { porCategoria[item.categoria] = []; ordenCategorias.push(item.categoria); }
      porCategoria[item.categoria].push(item);
    });

    var seccionesHtml = ordenCategorias.map(function (cat) {
      var nombreCat = ETIQUETAS_CATEGORIA[cat] || capitaliza(cat);
      return '<div class="seccion-compra">' +
        '<p class="seccion-compra-titulo">' + escapeHtml(nombreCat) + '</p>' +
        '<div class="card"><ul class="lista-check">' + porCategoria[cat].map(filaCompraHtml).join('') + '</ul></div>' +
        '</div>';
    }).join('');

    return cabecera + '<div class="vista-body">' +
      '<div class="segmentado">' +
        '<span class="segmento' + (rango === '7d' ? ' segmento-activo' : '') + '" data-action="segmento-compra" data-rango="7d">Próximos 7 días</span>' +
        '<span class="segmento' + (rango === 'hoy' ? ' segmento-activo' : '') + '" data-action="segmento-compra" data-rango="hoy">Solo hoy</span>' +
      '</div>' +
      (items.length ? seccionesHtml : '<p class="card-msg">Nada pendiente de comprar.</p>') +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Sheet: cambiar plato (elegir otro / nevera)
  // ---------------------------------------------------------------
  function renderSheetCambiarInicio(estado, banco, dia, tipoComida) {
    return sheetHead('Cambiar ' + (tipoComida === 'comida' ? 'comida' : 'cena')) +
      '<div class="sheet-body">' +
      '<button type="button" class="btn-secondary btn-sheet-opcion" data-action="modo-elegir-otro" data-dia="' + dia + '" data-tipo="' + tipoComida + '">Elegir otro plato</button>' +
      '<button type="button" class="btn-secondary btn-sheet-opcion" data-action="modo-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">Con lo que hay en la nevera</button>' +
      '</div>';
  }

  function renderListaElegirOtro(estado, banco, plan, dia, tipoComida) {
    // Solo plantillas que el motor puede aceptar de verdad para ESTA mesa (dieta/
    // mesa mixta y vetos) — antes se listaba todo lo 'apta' y el tap acababa en
    // "no encontramos un plato" para opciones imposibles (bug 2026-07-16). Las
    // cuotas máximas semanales no se pre-filtran: cambian con la propia elección.
    var diaObj = plan && plan.dias[dia];
    var presentes = diaObj ? E.presentesEnComida(estado, diaObj.fecha, dia, tipoComida) : [];
    var vetosUnion = E.vetosDe(presentes);
    var candidatas = E.plantillasDisponibles(banco, estado).filter(function (p) {
      return (p.apta || []).indexOf(tipoComida) !== -1 &&
        E.plantillaViableParaMesa(p, presentes, vetosUnion, banco);
    });
    var listaHtml = candidatas.length
      ? '<ul class="lista-plantillas">' + candidatas.map(function (p) {
          return '<li><button type="button" class="fila-plantilla" data-action="elegir-plantilla" data-dia="' + dia + '" data-tipo="' + tipoComida + '" data-plantilla="' + p.id + '">' +
            '<span class="fila-plantilla-nombre">' + escapeHtml(capitaliza(nombreGenerico(p.nombre_patron))) + '</span>' +
            '<span class="fila-plantilla-meta">' + (p.tiempo_min || '?') + ' min · ' + escapeHtml(p.esfuerzo || '') + '</span>' +
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
      ? '<button type="button" class="btn-filtro-icono btn-mic" data-action="nevera-voz" aria-label="Buscar por voz">' + ICONO_MIC + '</button>'
      : '';
    return sheetHead('Con lo que hay en la nevera') +
      '<div class="sheet-body">' +
      '<p class="card-msg">Marca lo que tienes en casa y buscamos un plato que se pueda montar con eso.</p>' +
      '<div class="nevera-top">' +
      '<div class="nevera-buscador-fila">' +
      '<div class="buscador-wrap">' +
      '<span class="input-buscador-icono" aria-hidden="true">' + ICONO_BUSCAR + '</span>' +
      '<input type="search" id="nevera-buscador" class="input-buscador" placeholder="Buscar ingrediente" autocomplete="off">' +
      '</div>' +
      micHtml +
      '</div>' +
      '<div class="nevera-seleccion" id="nevera-seleccion" hidden></div>' +
      '<button type="button" class="btn-primary" id="nevera-confirmar" data-action="confirmar-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">Buscar plato</button>' +
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
  function renderWizardBienvenida(nombreFamilia) {
    return '<p class="wizard-saludo">¡Bienvenidos!</p>' +
      '<h1 class="wizard-pregunta">Quiero conoceros.<br>¿Cómo os llamáis?</h1>' +
      '<label class="campo-nombre-familia"><span class="campo-eyebrow">Nombre de familia</span>' +
        '<input type="text" id="wz-nombre-familia" class="input-editorial" maxlength="40" placeholder="p.ej. Los Fernández" value="' + escapeHtml(nombreFamilia || '') + '" autofocus></label>' +
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

  function renderMiembro(miembro, banco, miembroDispositivoId) {
    var edad = E.edadEnAnios(miembro.anioNacimiento);
    var tieneFoto = !!miembro.foto;
    var esDispositivo = miembro.id === miembroDispositivoId;
    return '<details class="miembro-card" data-detalle-key="miembro-' + miembro.id + '">' +
      '<summary>' +
        '<span class="avatar avatar-presente"' + avatarEstilo(miembro) + '>' + avatarInner(miembro) + '</span>' +
        '<span class="miembro-resumen"><strong>' + escapeHtml(miembro.nombre) + '</strong><span>' + edad + ' años · ' + etiquetaDieta(miembro.dieta) + (esDispositivo ? ' · <span class="miembro-tu-badge">tú en este móvil</span>' : '') + '</span></span>' +
      '</summary>' +
      '<div class="miembro-detalle">' +
        '<div class="fila-foto-nombre">' +
        '<label class="campo-nombre-miembro"><span class="campo-eyebrow">Nombre</span><input type="text" class="input-editorial" data-campo="nombre" data-id="' + miembro.id + '" value="' + escapeHtml(miembro.nombre) + '" maxlength="30"></label>' +
        '<div class="columna-foto">' +
        '<button type="button" class="foto-tap foto-tap-pequena" data-action="miembro-subir-foto" data-id="' + miembro.id + '" ' +
          'aria-label="' + (tieneFoto ? 'Cambiar foto' : 'Añadir foto') + '"' + (tieneFoto ? avatarEstilo(miembro) : '') + '>' +
          fotoTapInner(miembro) +
        '</button>' +
        (tieneFoto ? '<button type="button" class="btn-texto foto-quitar-link" data-action="miembro-quitar-foto" data-id="' + miembro.id + '">Quitar foto</button>' : '') +
        '</div>' +
        '</div>' +
        '<input type="file" accept="image/*" hidden data-foto-input="' + miembro.id + '">' +
        '<div class="fila-sexo-anio">' +
          '<div class="campo-corto"><span class="campo-eyebrow">Sexo</span>' + chipToggleMiembro('sexo', OPCIONES_SEXO, miembro.sexo || 'mujer', miembro.id) + '</div>' +
          '<div class="campo-corto"><span class="campo-eyebrow">Año de nacimiento</span><input type="number" inputmode="numeric" class="input-editorial input-corto" data-campo="anioNacimiento" data-id="' + miembro.id + '" value="' + (miembro.anioNacimiento || '') + '" min="1920" max="' + new Date().getFullYear() + '"></div>' +
        '</div>' +
        '<div class="fila-sexo-anio">' +
          '<div class="campo-corto"><span class="campo-eyebrow">Altura (cm, opcional)</span><input type="number" class="input-editorial input-corto" data-campo="altura" data-id="' + miembro.id + '" value="' + (miembro.altura || '') + '" min="30" max="230"></div>' +
          '<div class="campo-corto"><span class="campo-eyebrow">Peso (kg, opcional)</span><input type="number" class="input-editorial input-corto" data-campo="peso" data-id="' + miembro.id + '" value="' + (miembro.peso || '') + '" min="1" max="200"></div>' +
        '</div>' +
        '<span class="campo-eyebrow">Actividad</span>' + chipToggleMiembro('actividad', OPCIONES_ACTIVIDAD, miembro.actividad || 'media', miembro.id) +
        '<span class="campo-eyebrow">Tipo de dieta</span>' + chipToggleMiembro('dieta', OPCIONES_DIETA, miembro.dieta || 'omnivora', miembro.id) +
        '<p class="detalle-subtitulo">Patrón — comida</p>' + renderPatronGrid(miembro, 'comida') +
        '<p class="detalle-subtitulo">Patrón — cena</p>' + renderPatronGrid(miembro, 'cena') +
        '<p class="detalle-subtitulo">Vetos (no le gusta / alergia)</p>' + renderVetos(miembro, banco) +
        '<button type="button" class="chip-toggle' + (esDispositivo ? ' chip-toggle-activo' : '') + '" data-action="marcar-yo-dispositivo" data-id="' + miembro.id + '" aria-pressed="' + esDispositivo + '">' + (esDispositivo ? '✓ Eres tú en este móvil' : 'Marcar como tú en este móvil') + '</button>' +
        '<button type="button" class="btn-texto btn-borrar" data-action="borrar-miembro" data-id="' + miembro.id + '">Eliminar de la familia</button>' +
      '</div></details>';
  }

  function renderSheetFamilia(estado, banco, miembroDispositivoId) {
    var miembros = estado.familia || [];
    var ocultasN = (estado.ocultas || []).length;
    var miembrosCards = miembros.map(function (m) { return renderMiembro(m, banco, miembroDispositivoId); }).join('');
    // "+ Añadir miembro" como última card de la lista (Roger 2026-07-14) —
    // sustituye a la fila de pills que duplicaba la misma info de las cards
    // de debajo.
    var tarjetaAnadir = '<button type="button" class="miembro-card-anadir" data-action="familia-abrir-form-miembro">' +
      '<span class="miembro-card-anadir-icono" aria-hidden="true">+</span>' +
      '<span>Añadir miembro</span>' +
      '</button>';

    return sheetHead('Tu familia') +
      '<div class="sheet-body">' +
      '<label class="campo-nombre-familia"><span class="campo-eyebrow">Nombre de familia</span>' +
        '<input type="text" id="familia-nombre-input" class="input-editorial" data-campo="nombreFamilia" maxlength="40" value="' + escapeHtml(estado.nombreFamilia || '') + '"></label>' +
      '<div class="lista-miembros">' + miembrosCards + tarjetaAnadir + '</div>' +
      '<div class="lista-enlaces">' +
        '<button type="button" class="fila-enlace" data-action="ir-recetas-ocultas"><span>Recetas ocultas</span><span class="fila-enlace-valor">' + ocultasN + ' ›</span></button>' +
      '</div>' +
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

  // Placeholder honesto — el parser de PDF real (heurística de columnas por
  // posición de texto, ~180 líneas) vive en v1 (e3foods.html) sin portar
  // todavía; no simular que funciona aquí.
  function renderSheetImportarCole() {
    return sheetHead('Menú del cole') +
      '<div class="sheet-body">' +
      '<p class="card-msg">Próximamente: sube el PDF del menú del cole y detectamos qué proteína/hidrato evitar repetir en la cena de casa esos días. Todavía no está construido en esta versión.</p>' +
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
      return head + '<div class="sheet-body">' +
        '<p class="card-msg">' + escapeHtml(opts.nombreFamilia || 'Tu familia') + ' está sincronizada. Comparte este código con quien quieras que vea y edite el menú desde su móvil:</p>' +
        '<p class="card-msg" style="font-size:28px;font-weight:700;letter-spacing:.08em;text-align:center;margin:16px 0;">' + escapeHtml(opts.code || '') + '</p>' +
        '<p class="card-msg">Cualquier dispositivo con este código ve y edita todo el menú — no hay permisos distintos por persona.</p>' +
        '</div>';
    }

    var errorHtml = opts.error ? '<p class="card-msg">' + escapeHtml(opts.error) + '</p>' : '';

    return head + '<div class="sheet-body">' +
      '<p class="card-msg">Activa la sincronización para ver y editar el menú desde varios móviles a la vez.</p>' +
      errorHtml +
      '<button type="button" class="btn-primary" id="sync-activar-btn" data-action="sync-activar">Activar sincronización</button>' +
      '<p class="card-msg" style="margin-top:24px">¿Ya tienes un código de otra familia?</p>' +
      '<label>Código<input type="text" id="sync-code-input" class="input-editorial" placeholder="8 caracteres" maxlength="8" autocapitalize="characters" autocomplete="off"></label>' +
      '<button type="button" class="btn-secondary" id="sync-unirse-btn" data-action="sync-unirse">Unirme con el código</button>' +
      '</div>';
  }

  global.E3UI = {
    renderSemana: renderSemana,
    renderRecetasVista: renderRecetasVista,
    renderCompraVista: renderCompraVista,
    renderSheetReceta: renderSheetReceta,
    renderSheetResumenSemana: renderSheetResumenSemana,
    renderSheetCambiarInicio: renderSheetCambiarInicio,
    renderListaElegirOtro: renderListaElegirOtro,
    renderNevera: renderNevera,
    renderConfirmarRegenerar: renderConfirmarRegenerar,
    renderSheetFamilia: renderSheetFamilia,
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
