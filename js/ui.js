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
    var extras = '';
    if (opts.botonAnadir) {
      extras += '<button type="button" class="cabecera-btn-anadir" data-action="' + opts.botonAnadir + '" aria-label="Añadir receta">+</button>';
    }
    if (opts.linkVaciar) {
      extras += '<button type="button" class="cabecera-btn-vaciar" data-action="' + opts.linkVaciar + '" aria-label="Vaciar la lista de la compra">' + ICONO_VACIAR + '</button>';
    }
    if (extras) derecha = '<div class="cabecera-derecha-grupo">' + derecha + extras + '</div>';
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
  // flecha circular estándar (reset/vaciar) — arco casi cerrado + flecha en la punta
  var ICONO_VACIAR = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.34-5.66"/><path d="M20 4v4h-4"/></svg>';

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

  // Card de comida/cena — pieza ÚNICA compartida por Foco (una a la vez, con
  // flecha de swipe) y la vista clásica (comida+cena juntas, sin flecha:
  // Roger 2026-07-18, "no puede copiar el código de la card de FOCO
  // directamente en lugar de cambiar pieza a pieza" — antes eran dos
  // funciones paralelas que se iban desincronizando (postre, espaciados).
  // opts.conFlecha=true → añade el botón de flip y el id de swipe (solo
  // tiene sentido cuando se muestra UNA comida a la vez, nunca con las dos
  // juntas: el id sería duplicado en el DOM).
  function renderCardComida(estado, banco, plan, diaIndex, meal, opts) {
    opts = opts || {};
    var dia = plan.dias[diaIndex];
    var slot = dia ? dia[meal] : null;
    var mesa = comensalesDeSlot(estado, plan, diaIndex, meal);
    var icono = meal === 'comida' ? ICONO_SOL : ICONO_LUNA;
    var etiqueta = meal === 'comida' ? 'COMIDA' : 'CENA';
    var otra = meal === 'comida' ? 'cena' : 'comida';

    // Badge "nuevo para probar" (tramo 1): plantilla sin rastro en el historial
    // de rotación. Solo cuando ya existe historial — en una familia recién dada
    // de alta todo sería "nuevo" y el badge no significaría nada.
    var historialRot = estado.historialPlantillas || {};
    var esNueva = !!slot && !!Object.keys(historialRot).length && !historialRot[slot.plantillaId];
    var badgeNuevo = esNueva ? '<span class="badge-nuevo">Nuevo para probar</span>' : '';

    var avataresHtml = mesa.miembrosDelSlot.map(function (m) {
      var estaPresente = mesa.presentes.some(function (p) { return p.id === m.id; });
      return '<span class="avatar-wrap avatar-wrap-sm">' +
        '<button type="button" class="avatar avatar-sm ' + (estaPresente ? 'avatar-presente' : 'avatar-ausente') + '"' + avatarEstilo(m) + ' ' +
        'data-action="toggle-presente" data-dia="' + diaIndex + '" data-tipo="' + meal + '" data-miembro="' + m.id + '" ' +
        'aria-pressed="' + estaPresente + '" aria-label="' + escapeHtml(m.nombre) + (estaPresente ? ', en casa. Toca para marcar que hoy no come.' : ', fuera hoy. Toca para marcar que sí come.') + '">' +
        avatarInner(m) + '</button>' +
        '<span class="avatar-badge ' + (estaPresente ? 'avatar-badge-ok' : 'avatar-badge-no') + '" aria-hidden="true">' + (estaPresente ? '✓' : '−') + '</span>' +
        '</span>';
    }).join('');
    var cabecera = '<div class="hoy2-cab"><span class="hoy2-tipo">' + icono + etiqueta + '</span>' + badgeNuevo +
      (avataresHtml ? '<span class="avatares avatares-sm">' + avataresHtml + '</span>' : '') + '</div>';

    var plantilla = slot ? E.plantillaPorId(banco, estado, slot.plantillaId) : null;
    var postre = meal === 'cena' ? E.postreDelDia(banco, dia.fecha, diaIndex) : null;
    var postreTexto = postre
      ? (postre.tipo === 'tradicional' ? 'Sugerencia de postre: ' + postre.nombre + ' (receta de finde)' : 'De postre: ' + postre.nombre)
      : '';

    var cuerpo, flechaHtml = '', vacia = '';
    if (!mesa.miembrosDelSlot.length) {
      vacia = ' card-vacia';
      cuerpo = '<p class="card-msg">Nadie come en casa (' + (meal === 'comida' ? 'mediodía' : 'noche') + ').</p>';
    } else if (!slot || !plantilla) {
      vacia = ' card-vacia';
      cuerpo = '<p class="card-msg">No encontramos un plato que encaje con los gustos/vetos actuales.</p>' +
        '<button type="button" class="btn-secondary btn-cambiar" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + meal + '">Elegir plato</button>';
    } else {
      var resuelto = E.resolverPlato(plantilla, slot.seleccion, mesa.comensales, banco, slot.adaptaciones);
      var nombreSplit = splitNombrePlato(resuelto.nombre);
      var kcalMedio = mesa.presentes.length ? Math.round(resuelto.kcalTotal / mesa.presentes.length) : 0;
      var fotoHtml = plantilla.foto ? '<div class="hoy2-foto" style="background-image:url(\'' + escapeHtml(plantilla.foto) + '\')"></div>' : '';
      var adaptacionesVisibles = (slot.adaptaciones || []).filter(function (a) {
        return mesa.presentes.some(function (p) { return p.id === a.miembroId; });
      }).map(function (a) {
        var m = (estado.familia || []).find(function (mm) { return mm.id === a.miembroId; });
        var ing = banco.ingredientes[a.valor];
        return '· ' + escapeHtml(m ? m.nombre : '?') + ': ' + escapeHtml(ing ? ing.nombre : a.valor);
      }).join(' &nbsp; ');
      if (opts.conFlecha) flechaHtml = '<button type="button" class="hoy-flecha-inline" data-action="foco-flip-comida" data-comida="' + otra + '" aria-label="Ver la otra comida">›</button>';
      cuerpo = '<div class="hoy2-fila" data-action="abrir-receta" data-dia="' + diaIndex + '" data-tipo="' + meal + '" role="button" tabindex="0" aria-label="Ver receta completa">' +
        fotoHtml +
        '<div class="hoy2-info">' +
        '<p class="hoy2-titulo">' + escapeHtml(nombreSplit.titulo) + (nombreSplit.subtitulo ? '<span class="hoy2-subtitulo">' + escapeHtml(nombreSplit.subtitulo) + '</span>' : '') + '</p>' +
        (postreTexto ? '<p class="hoy2-postre">' + escapeHtml(postreTexto) + '</p>' : '') +
        (adaptacionesVisibles ? '<p class="hoy2-postre">' + adaptacionesVisibles + '</p>' : '') +
        (!mesa.presentes.length ? '<p class="card-msg">Nadie confirmado para esta comida.</p>' : '') +
        '<div class="hoy2-meta-fila"><span class="hoy2-meta">' +
        (mesa.presentes.length ? '<span class="hoy2-meta-icono">' + ICONO_FUEGO + '</span>~' + kcalMedio + ' kcal · ' : '') +
        '<span class="hoy2-meta-icono">' + ICONO_RELOJ + '</span>' + (plantilla.tiempo_min || '?') + ' min</span>' +
        '</div></div></div>' +
        '<button type="button" class="btn-sorprendeme" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + meal + '">✨ Me apetece otra cosa</button>';
    }

    return '<section class="card hoy2' + vacia + '"' + (opts.conFlecha ? ' id="hoy-swipe"' : '') + ' data-dia="' + diaIndex + '" data-tipo="' + meal + '" data-meal="' + meal + '">' +
      cabecera + cuerpo + flechaHtml + '</section>';
  }

  function renderSlot(estado, banco, plan, diaIndex, tipoComida) {
    return renderCardComida(estado, banco, plan, diaIndex, tipoComida, { conFlecha: false });
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
  function renderSaludoSemana(estado, plan, banco, miembroDispositivoId, sinCardIA) {
    // "Quién soy yo en este móvil" (Roger 2026-07-14): preferencia LOCAL al
    // dispositivo (localStorage aparte, ver DISPOSITIVO_KEY en app.js) — no
    // viaja con la familia cuando haya sync, cada móvil recuerda la suya.
    // Sin elegir todavía (o el miembro ya no existe) → cae al primero, como antes.
    var familia = estado.familia || [];
    var miembroDispositivo = miembroDispositivoId && familia.filter(function (m) { return m.id === miembroDispositivoId; })[0];
    var nombre = (miembroDispositivo || familia[0] || {}).nombre || '';
    var titulo = '<h1 class="saludo-titulo">' + saludoHora() + (nombre ? ', ' + escapeHtml(nombre) : '') + '.</h1>';

    // sinCardIA (modo Foco, Roger 2026-07-17): la referencia no lleva la card
    // oscura de "faltan ingredientes" — esa señal la da ahora la card de
    // Compra semanal, más abajo. En su lugar: subtítulo con el rango de la
    // semana + pill "Ver semana" (drill-in a la vista clásica), en la misma
    // fila que el saludo. En Clásica se mantiene igual que siempre.
    if (sinCardIA) {
      var subtitulo = '';
      if (plan && plan.dias && plan.dias.length) {
        var diaIni = plan.dias[0], diaFin = plan.dias[plan.dias.length - 1];
        var mesFin = fechaCorta(diaFin.fecha).split(' ')[1];
        subtitulo = 'Semana del ' + new Date(diaIni.fecha + 'T00:00:00').getDate() + ' – ' +
          new Date(diaFin.fecha + 'T00:00:00').getDate() + ' ' + mesFin;
      }
      return '<section class="saludo-semana saludo-semana-foco">' +
        '<div class="saludo-semana-fila">' +
        '<div class="saludo-semana-textos">' + titulo +
        (subtitulo ? '<p class="saludo-semana-sub">' + escapeHtml(subtitulo) + '</p>' : '') +
        '</div>' +
        '<button type="button" class="pill-resumen" data-action="ver-semana-clasica">Semana</button>' +
        '</div>' +
        '</section>';
    }

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
  // Vista SEMANA — dos modos (Roger 2026-07-17), 'foco' por defecto en cada
  // entrada al tab (vistaSemanaModo en app.js, variable de sesión — ya no
  // localStorage):
  //   'foco'   → home tipo informe (réplica de la referencia de Roger, sin el
  //              anillo de "% semana"): equilibrio + HOY (UNA comida —
  //              comida o cena, con flecha lateral para pasar a la otra)
  //              + compra + semana de un vistazo + aviso si algo desequilibra.
  //              "Ver semana" (en el saludo) hace drill-in a la clásica.
  //   'semana' → la vista clásica: píldoras L-D + comida+cena del día elegido
  //              (Hoy se retiró como tab aparte, Roger 2026-07-13). Su pill
  //              "Ver informe" vuelve a la home Foco.
  // Todo dato mostrado en Foco sale de datos reales del plan (resumenCuotasSemana,
  // listaCompra) — nada inventado. Dos piezas de la referencia NO se replican
  // por eso: el bloque "Batch Cooking" (90 min/6 preparaciones/5 días — la
  // feature no existe, es F4 de MOTOR_RECETAS) y la sugerencia de IA con swap
  // concreto ("sustituye el jueves por merluza" — exigiría lógica de detección+
  // sustitución que no está construida). El aviso de equilibrio si se sustituye
  // por un mensaje honesto derivado de resumenCuotasSemana, sin plato inventado.
  // ---------------------------------------------------------------

  // filaVista — SOLO la usa ya la vista clásica (píldoras); Foco tiene su
  // propio saludo con el pill "Ver semana" (renderSaludoSemana, sinCardIA).
  // Su pill vuelve a la home Foco.
  function filaVista(fechaHtml) {
    return '<p class="vista-fecha-fila">' +
      '<span class="vista-fecha">' + fechaHtml + '</span>' +
      '<button type="button" class="pill-resumen" data-action="ver-informe-foco">Ver informe</button>' +
      '</p>';
  }

  function renderSemana(estado, plan, banco, diaSeleccionado, miembroDispositivoId, modoVista, focoComida, semanaSeleccionada) {
    if (!plan) {
      return renderAppBar() + '<div class="vista-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
    }
    var hoyIdx = E.diaIndexDesdeFecha(plan, hoyISO());
    if (modoVista === 'foco') return renderSemanaFoco(estado, plan, banco, miembroDispositivoId, hoyIdx, focoComida, diaSeleccionado, semanaSeleccionada);

    var idx = (diaSeleccionado != null && plan.dias[diaSeleccionado]) ? diaSeleccionado : (hoyIdx === -1 ? 0 : hoyIdx);
    var pildoras = plan.dias.map(function (dia, i) {
      var d = new Date(dia.fecha + 'T00:00:00');
      var clases = 'pildora-dia' + (i === idx ? ' pildora-dia-activa' : '') + (i === hoyIdx ? ' pildora-dia-hoy' : '');
      return '<button type="button" class="' + clases + '" data-action="semana-elegir-dia" data-dia="' + i + '" aria-pressed="' + (i === idx) + '">' +
        '<span class="pildora-dia-letra">' + NOMBRES_DIA_CORTO[i].charAt(0) + '</span>' +
        '<span class="pildora-dia-num">' + d.getDate() + '</span>' +
        '</button>';
    }).join('');
    // horizonte 2 semanas (Roger 2026-07-18): paginador de 2 posiciones (vigente
    // ⇄ siguiente, no navegación libre — solo existen esas dos semanas
    // materializadas) recuperando el patrón visual de v1 (_legacy_v1, nav-chev)
    // que se perdió al reconstruir v2. La fila de píldoras no cambia.
    var enVigente = (semanaSeleccionada || 'vigente') !== 'siguiente';
    var flechaIzq = enVigente
      ? '<span class="nav-chev-semana nav-chev-semana-disabled" aria-hidden="true">‹</span>'
      : '<button type="button" class="nav-chev-semana" data-action="semana-pag" data-semana="vigente" aria-label="Semana actual">‹</button>';
    var flechaDer = enVigente
      ? '<button type="button" class="nav-chev-semana" data-action="semana-pag" data-semana="siguiente" aria-label="Semana que viene">›</button>'
      : '<span class="nav-chev-semana nav-chev-semana-disabled" aria-hidden="true">›</span>';
    var filaPildoras = '<div class="fila-pildoras-dia fila-pildoras-dia-sticky" role="group" aria-label="Elegir día">' + flechaIzq + pildoras + flechaDer + '</div>';

    var dia = plan.dias[idx];
    var fechaHtml = NOMBRES_DIA[idx] + ' ' + fechaCorta(dia.fecha) + (idx === hoyIdx ? ' <span class="badge badge-hoy">HOY</span>' : '');
    return renderAppBar() + renderSaludoSemana(estado, plan, banco, miembroDispositivoId) + filaPildoras +
      '<div class="vista-body" data-dia-idx="' + idx + '">' +
      filaVista(fechaHtml) +
      renderColeDia(estado, plan, idx, hoyIdx) +
      renderSlot(estado, banco, plan, idx, 'comida') +
      renderSlot(estado, banco, plan, idx, 'cena') +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Modo Foco — piezas del informe (Roger 2026-07-17)
  // ---------------------------------------------------------------

  var ICONO_CATEGORIA = {
    'pescado-blanco': '🐟', 'pescado-azul': '🐟', marisco: '🦐',
    huevo: '🥚', 'carne-roja': '🥩', 'carne-blanca': '🍗',
    legumbre: '🌱', otro: '🍽️'
  };
  var ETIQUETA_CUOTA = { legumbre: 'Legumbres', 'pescado-total': 'Pescado', 'carne-roja': 'Carne roja', huevo: 'Huevos' };
  var COLOR_CUOTA = { legumbre: 'verde', 'pescado-total': 'azul', 'carne-roja': 'rojo', huevo: 'amarillo' };

  // Icono representativo de un plato resuelto: la categoría del primer
  // ingrediente del eje proteína (si existe), si no el primero de cualquier eje.
  function iconoDePlato(seleccion, banco) {
    var ids = idsUnicosSeleccionOrdenados(seleccion);
    for (var i = 0; i < ids.length; i++) {
      var ing = banco.ingredientes[ids[i]];
      if (ing && ICONO_CATEGORIA[ing.categoria]) return ICONO_CATEGORIA[ing.categoria];
    }
    return ICONO_CATEGORIA.otro;
  }

  function idsUnicosSeleccionOrdenados(seleccion) {
    var orden = ['proteina', 'hidrato', 'verdura'];
    var vistos = {}, lista = [];
    orden.concat(Object.keys(seleccion || {})).forEach(function (eje) {
      var id = seleccion && seleccion[eje];
      if (id && !vistos[id]) { vistos[id] = true; lista.push(id); }
    });
    return lista;
  }

  // Iconos blancos de los chips de equilibrio (Roger 2026-07-17): la referencia
  // usa icono blanco sobre círculo sólido de color — un emoji no se puede
  // recolorear a blanco por CSS, así que estos 4+1 son SVG de línea propios
  // (stroke:currentColor), solo para este componente.
  // Iconos de los chips de equilibrio (Roger 2026-07-17): los SVG de línea
  // dibujados a mano resultaron irreconocibles (4ª iteración) — vuelta a
  // emoji (ya usados en ICONO_CATEGORIA en otras partes de la app), que sí
  // se identifican de un vistazo, sobre el círculo sólido de color.
  var ICONO_CHIP = { legumbre: '🌱', pescado: '🐟', 'carne-roja': '🥩', huevo: '🥚', variedad: '🔀' };

  // Chips de equilibrio semanal (Roger 2026-07-17): 4 cuotas reales del banco
  // (`banco.categorias_cuota`) + 1 quinta calculada, "Variedad" (plantillas
  // únicas / huecos rellenados esta semana) — no es una cuota AESAN, es un
  // conteo honesto sobre el propio plan, coherente con la promesa de variedad.
  // Reutiliza EXACTAMENTE E.resumenCuotasSemana — el mismo dato que ya arma
  // el sheet "Ver resumen semanal" — para no divergir de lo que decide el motor.
  function renderEquilibrioChips(estado, plan, banco) {
    var resumen = E.resumenCuotasSemana(plan, banco);
    var chips = ['legumbre', 'pescado-total', 'carne-roja', 'huevo'].map(function (clave) {
      var fila = resumen.filter(function (r) { return r.categoria === clave; })[0];
      if (!fila) return '';
      var objetivo = fila.max_sem != null ? fila.max_sem : fila.min_sem;
      var pct = objetivo ? Math.min(100, Math.round(fila.cuenta / objetivo * 100)) : 0;
      var color = COLOR_CUOTA[clave];
      var iconoClave = clave === 'pescado-total' ? 'pescado' : clave;
      return '<div class="chip-equilibrio">' +
        '<span class="chip-equilibrio-icono chip-equilibrio-solido-' + color + '">' + ICONO_CHIP[iconoClave] + '</span>' +
        '<span class="chip-equilibrio-nombre">' + ETIQUETA_CUOTA[clave] + '</span>' +
        '<span class="chip-equilibrio-fraccion chip-equilibrio-fraccion-' + color + '">' + fila.cuenta + ' / ' + objetivo + '</span>' +
        '<span class="chip-equilibrio-barra"><span class="chip-equilibrio-barra-fill chip-equilibrio-barra-' + color + '" style="width:' + pct + '%"></span></span>' +
        '</div>';
    }).join('');

    // Variedad: plantillas únicas sobre huecos rellenados — dato del propio plan
    var idsUsados = [], huecos = 0;
    plan.dias.forEach(function (dia) {
      ['comida', 'cena'].forEach(function (t) {
        if (dia[t]) { huecos++; if (idsUsados.indexOf(dia[t].plantillaId) === -1) idsUsados.push(dia[t].plantillaId); }
      });
    });
    var pctVariedad = huecos ? Math.min(100, Math.round(idsUsados.length / huecos * 100)) : 0;
    var chipVariedad = '<div class="chip-equilibrio">' +
      '<span class="chip-equilibrio-icono chip-equilibrio-solido-morado">' + ICONO_CHIP.variedad + '</span>' +
      '<span class="chip-equilibrio-nombre">Variedad</span>' +
      '<span class="chip-equilibrio-fraccion chip-equilibrio-fraccion-morado">' + idsUsados.length + ' / ' + huecos + '</span>' +
      '<span class="chip-equilibrio-barra"><span class="chip-equilibrio-barra-fill chip-equilibrio-barra-morado" style="width:' + pctVariedad + '%"></span></span>' +
      '</div>';

    var totalCumplidas = resumen.filter(function (r) { return ['legumbre', 'pescado-total', 'carne-roja', 'huevo'].indexOf(r.categoria) !== -1 && r.cumplido; }).length
      + (idsUsados.length === huecos && huecos > 0 ? 1 : 0);
    return '<section class="bloque-equilibrio">' +
      '<p class="bloque-equilibrio-titulo">Equilibrio semanal<span class="bloque-equilibrio-ok">' + totalCumplidas + ' de 5 categorías OK</span></p>' +
      '<div class="fila-chips-equilibrio">' + chips + chipVariedad + '</div>' +
      '</section>';
  }

  // Card única de HOY (Roger 2026-07-17, 2ª iteración): UNA sola comida a la
  // vez (antes mostraba comida+cena juntas) — el parámetro `meal` decide cuál
  // (comida antes de las 16h / cena después, o lo que el usuario eligió con la
  // flecha). Flecha lateral circular para pasar a la otra comida — Roger
  // rechazó explícitamente un botón inferior tipo "Ver la cena ›" ("come
  // pantalla"), así que el único control de cambio es esa flecha (y el swipe
  // horizontal sobre la card, ver #hoy-swipe en app.js).
  // Card HOY (Roger 2026-07-17): UNA sola comida (la próxima por hora), con
  // los mismos datos que la card clásica (foto, título, kcal, tiempo, quién
  // come) pero en formato compacto propio de Foco — avatares arriba a la
  // altura de la etiqueta COMIDA/CENA (Roger: "podrían ir en la parte
  // superior, alineados a la derecha") y flecha INLINE junto al tiempo, no
  // flotando en una columna vacía a lo alto de toda la card.
  function renderTarjetaHoy(estado, banco, plan, diaIndex, meal, hoyIdx) {
    var dia = plan.dias[diaIndex];
    var prefijoDia = diaIndex === hoyIdx ? 'HOY · ' : '';
    return '<div class="hoy-bloque">' +
      '<p class="hoy-eyebrow">' + prefijoDia + NOMBRES_DIA[diaIndex].toUpperCase() + ' ' + fechaCorta(dia.fecha) + '</p>' +
      renderCardComida(estado, banco, plan, diaIndex, meal, { conFlecha: true }) +
      '</div>';
  }

  // Card batch cooking (Roger 2026-07-17): mostrada pero DESACTIVADA — la feature
  // no está construida (es F4 del cerebro). Los números (90/6/5) son ilustrativos
  // del diseño, no datos de la familia: la card se ve claramente "Próximamente"
  // y su botón está deshabilitado, así que no simula un dato real.
  // Iconos de línea 24x24, mismo estilo que ICONO_SOL/LUNA/RELOJ/FUEGO — para
  // los 3 pasos del batch (olla/tarros/calendario) y la bolsa de la compra.
  var ICONO_OLLA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 11h16v3a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-3z"/><path d="M2 11h20"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var ICONO_TARROS = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="9" width="7" height="11" rx="1.5"/><path d="M5 9V6a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 9 6v3"/><rect x="13" y="6" width="8" height="14" rx="1.5"/><path d="M15.5 6V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v2"/></svg>';
  var ICONO_CALENDARIO_OK = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17"/><path d="M8 3v3.3"/><path d="M16 3v3.3"/><path d="M8.5 14.5l2 2 4.5-4.5"/></svg>';
  var ICONO_BOLSA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 8h11l-1 11.5h-9L6.5 8z"/><path d="M9 8V6.3a3 3 0 016 0V8"/></svg>';
  // Ilustración bolsa+planta de la card Compra semanal (Roger 2026-07-17,
  // 5ª iteración): la referencia lleva un dibujo decorativo a la derecha,
  // ausente hasta ahora — bolsa de papel con brotes verdes asomando.
  var ILUSTRACION_BOLSA_PLANTA = '<svg viewBox="0 0 100 100" fill="none">' +
    '<path d="M40 42 C36 24 24 15 13 17 C15 30 24 41 40 42 Z" fill="#9CBB93"/>' +
    '<path d="M50 42 C50 20 50 6 50 1 C55 10 57 27 50 42 Z" fill="#7FA377"/>' +
    '<path d="M59 42 C64 27 76 18 87 20 C83 32 74 41 59 42 Z" fill="#8FB086"/>' +
    '<path d="M21 43 L79 43 L70 97 L30 97 Z" fill="#EDEAE1" stroke="#D8D3C6" stroke-width="1.5"/>' +
    '<path d="M21 43 L30 97 M50 43 L50 97 M79 43 L70 97" stroke="#D8D3C6" stroke-width="1.2"/>' +
    '</svg>';

  // Card batch cooking (Roger 2026-07-17): mostrada pero DESACTIVADA — la feature
  // no está construida (es F4 del cerebro). Los números (90/6/5) son ilustrativos
  // del diseño, no datos de la familia: la card se ve claramente "Próximamente"
  // y su botón está deshabilitado, así que no simula un dato real.
  function renderBatchCard() {
    return '<section class="card card-batch">' +
      '<p class="card-batch-eyebrow">SEMANA RESUELTA</p>' +
      '<p class="card-batch-titulo">Cocina el domingo, disfruta toda la semana</p>' +
      '<div class="card-batch-pasos">' +
      '<span class="card-batch-paso"><span class="card-batch-paso-icono">' + ICONO_OLLA + '</span><b>90</b>mins</span>' +
      '<span class="card-batch-flecha">→</span>' +
      '<span class="card-batch-paso"><span class="card-batch-paso-icono">' + ICONO_TARROS + '</span><b>6</b>preps.</span>' +
      '<span class="card-batch-flecha">→</span>' +
      '<span class="card-batch-paso"><span class="card-batch-paso-icono">' + ICONO_CALENDARIO_OK + '</span><b>5</b>dias</span>' +
      '</div>' +
      '<button type="button" class="card-batch-btn card-batch-btn-solido" disabled aria-label="Batch cooking, próximamente">Ver plan <span aria-hidden="true">›</span></button>' +
      '</section>';
  }

  // Card de compra (Roger 2026-07-17): % real ya marcado + nº de productos
  // pendientes, de E.listaCompra — mismo dato que la pestaña Compra.
  function renderCompraResumenCard(estado, plan, banco) {
    var items = E.listaCompra(estado, plan, 'hoy', banco);
    if (!items.length) return '';
    var marcados = items.filter(function (i) { return i.marcado; }).length;
    var pct = Math.round(marcados / items.length * 100);
    var titulo = marcados === items.length ? 'Ya tienes todo lo necesario para hoy' : 'Ya tienes el ' + pct + '% de lo necesario';
    return '<section class="card card-compra-resumen">' +
      '<div class="card-compra-resumen-ilustracion" aria-hidden="true">' + ILUSTRACION_BOLSA_PLANTA + '</div>' +
      '<p class="card-compra-resumen-eyebrow">COMPRA DIARIA</p>' +
      '<p class="card-compra-resumen-titulo">' + titulo + '</p>' +
      '<div class="card-compra-resumen-barra"><span style="width:' + pct + '%"></span></div>' +
      '<p class="card-compra-resumen-sub"><span class="card-compra-resumen-sub-icono">' + ICONO_BOLSA + '</span>' + (items.length - marcados) + ' producto' + (items.length - marcados === 1 ? '' : 's') + ' por comprar</p>' +
      '<button type="button" class="card-batch-btn card-batch-btn-solido card-batch-btn-verde" data-action="ir-vista" data-vista="compra">Ver lista de la compra <span aria-hidden="true">›</span></button>' +
      '</section>';
  }

  // Tira "tu semana de un vistazo" (Roger 2026-07-17): 7 días con hasta 2
  // iconos de categoría por día (de las proteínas realmente usadas ese día).
  // "Ver semana completa" cambia al modo Semana (reutiliza el toggle).
  function renderSemanaVistazo(estado, plan, banco, hoyIdx, diaSeleccionadoIdx, semanaSeleccionada) {
    var dias = plan.dias.map(function (dia, i) {
      var vistos = [];
      ['comida', 'cena'].forEach(function (t) {
        if (!dia[t]) return;
        var ic = iconoDePlato(dia[t].seleccion, banco);
        if (vistos.indexOf(ic) === -1) vistos.push(ic);
      });
      var clases = 'dia-vistazo' + (i === hoyIdx ? ' dia-vistazo-hoy' : '');
      return '<button type="button" class="' + clases + '" data-action="semana-elegir-dia" data-dia="' + i + '" aria-pressed="' + (i === diaSeleccionadoIdx) + '" aria-label="Ver menú de ' + NOMBRES_DIA[i] + '">' +
        '<span class="dia-vistazo-letra">' + NOMBRES_DIA_CORTO[i] + ' ' + new Date(dia.fecha + 'T00:00:00').getDate() + '</span>' +
        '<span class="dia-vistazo-iconos">' + vistos.slice(0, 2).join(' ') + '</span>' +
        '</button>';
    }).join('');
    // horizonte 2 semanas (Roger 2026-07-18, 2ª petición): mismo paginador de 2
    // posiciones que la vista clásica, en versión compacta para esta tira densa
    // (reutiliza semanaSeleccionada — comparte estado con la clásica a propósito,
    // así "Ver semana completa" aterriza en la misma semana que se estaba mirando).
    var enVigente = (semanaSeleccionada || 'vigente') !== 'siguiente';
    var flechaIzq = enVigente
      ? '<span class="nav-chev-semana nav-chev-vistazo nav-chev-semana-disabled" aria-hidden="true">‹</span>'
      : '<button type="button" class="nav-chev-semana nav-chev-vistazo" data-action="semana-pag" data-semana="vigente" aria-label="Semana actual">‹</button>';
    var flechaDer = enVigente
      ? '<button type="button" class="nav-chev-semana nav-chev-vistazo" data-action="semana-pag" data-semana="siguiente" aria-label="Semana que viene">›</button>'
      : '<span class="nav-chev-semana nav-chev-vistazo nav-chev-semana-disabled" aria-hidden="true">›</span>';
    return '<section class="bloque-vistazo">' +
      '<p class="bloque-vistazo-titulo">Tu semana de un vistazo<button type="button" class="bloque-vistazo-link" data-action="ver-semana-clasica">Ver semana completa</button></p>' +
      '<div class="fila-vistazo-nav">' + flechaIzq + '<div class="fila-vistazo">' + dias + '</div>' + flechaDer + '</div>' +
      '</section>';
  }

  // Aviso de equilibrio (Roger 2026-07-17): SOLO si una cuota real no está
  // cumplida esta semana — nunca un swap concreto inventado (eso exigiría
  // lógica de sustitución que no existe). Si todo cumple, no se muestra nada:
  // más honesto que fabricar un mensaje positivo.
  function renderAvisoEquilibrio(plan, banco) {
    var resumen = E.resumenCuotasSemana(plan, banco);
    var fallo = resumen.filter(function (r) { return !r.cumplido && ETIQUETA_CUOTA[r.categoria]; })[0];
    var texto = !fallo
      ? 'Semana equilibrada: las 5 categorías están al día.'
      : (fallo.max_sem != null && fallo.cuenta > fallo.max_sem
        ? 'Esta semana hay más ' + ETIQUETA_CUOTA[fallo.categoria].toLowerCase() + ' de lo recomendado (' + fallo.cuenta + ' de ' + fallo.max_sem + ').'
        : 'Esta semana falta ' + ETIQUETA_CUOTA[fallo.categoria].toLowerCase() + ' para llegar al mínimo (' + fallo.cuenta + ' de ' + fallo.min_sem + ').');
    return '<div class="aviso-equilibrio">' +
      '<span class="aviso-equilibrio-icono" aria-hidden="true">🤖</span>' +
      '<p class="aviso-equilibrio-texto">' + escapeHtml(texto) + '</p>' +
      '<button type="button" class="pill-resumen" data-action="abrir-resumen-semana">Ver equilibrio</button>' +
      '</div>';
  }

  function renderSemanaFoco(estado, plan, banco, miembroDispositivoId, hoyIdx, focoComida, diaSeleccionado, semanaSeleccionada) {
    var idx = (diaSeleccionado != null && plan.dias[diaSeleccionado]) ? diaSeleccionado : (hoyIdx === -1 ? 0 : hoyIdx);
    var meal = focoComida === 'cena' ? 'cena' : 'comida';
    // horizonte 2 semanas: SOLO la tira "de un vistazo" puede pasar a la semana
    // siguiente — HOY/equilibrio/cole/compra de Foco se quedan siempre en
    // `plan` (vigente, ya forzado por planActivo() en app.js): "HOY" no
    // significa nada en una semana que no ha empezado.
    var enSiguiente = semanaSeleccionada === 'siguiente';
    var planVistazo = (enSiguiente && estado.planSiguiente) ? estado.planSiguiente : plan;
    var hoyIdxVistazo = enSiguiente ? -1 : hoyIdx;
    return renderAppBar() + renderSaludoSemana(estado, plan, banco, miembroDispositivoId, true) +
      '<div class="vista-body">' +
      renderEquilibrioChips(estado, plan, banco) +
      renderColeDia(estado, plan, idx, hoyIdx) +
      renderTarjetaHoy(estado, banco, plan, idx, meal, hoyIdx) +
      '<div class="fila-batch-compra">' + renderBatchCard() + renderCompraResumenCard(estado, plan, banco) + '</div>' +
      renderSemanaVistazo(estado, planVistazo, banco, hoyIdxVistazo, idx, semanaSeleccionada) +
      renderAvisoEquilibrio(plan, banco) +
      '</div>';
  }

  // Menú del cole (F1): la cara visible del dato — sin esta línea el "cena
  // pensada contra el cole" pierde la mitad del valor percibido (research).
  function renderColeDia(estado, plan, diaIndex, hoyIdx) {
    var dia = plan.dias[diaIndex];
    var coleDia = dia && estado.cole && estado.cole.dias && estado.cole.dias[dia.fecha];
    if (!coleDia || !coleDia.resumen) return '';
    var prefijo = diaIndex === hoyIdx ? 'Hoy en el cole: ' : 'En el cole: ';
    return '<p class="cole-linea">' + escapeHtml(prefijo + coleDia.resumen) + '</p>';
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
      '<label>Lo principal<select id="rp-proteina"><option value="">(nada en concreto)</option>' + opcionesIng + '</select></label>' +
      '<label>El acompañamiento<select id="rp-hidrato"><option value="">(sin acompañamiento)</option>' + opcionesIng + '</select></label>' +
      '<label>La verdura<select id="rp-verdura"><option value="">(sin verdura)</option>' + opcionesIng + '</select></label>' +
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
      listaFiltrada = listaFiltrada.filter(function (p) { return normalizarTexto(nombreEjemplo(p, banco)).indexOf(q) !== -1; });
    }

    var filasHtml = listaFiltrada.map(function (p) {
      var oculta = ocultas.indexOf(p.id) !== -1;
      var favorita = favoritas.indexOf(p.id) !== -1;
      return '<li class="fila-receta ' + (oculta ? 'receta-oculta' : '') + '">' +
        '<span class="fila-receta-nombre">' + escapeHtml(capitaliza(nombreEjemplo(p, banco))) +
          (variantesProteina(p, banco) ? '<span class="fila-receta-variantes">' + escapeHtml(variantesProteina(p, banco)) + '</span>' : '') +
          '<span class="fila-plantilla-meta">' + (p.tiempo_min || '?') + ' min · ' + escapeHtml(p.esfuerzo || '') + '</span></span>' +
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
    // horizonte 2 semanas (Roger 2026-07-18): "Semana que viene" usa el plan
    // siguiente entero (no tiene sentido un sub-segmento "solo hoy" de una
    // semana que no ha empezado) y sus propios marcados — mismos ids de
    // ingrediente que la semana vigente pueden repetirse, así que listaCompra()
    // necesita ver marcadosSiguiente en vez de marcados para no cruzar checks
    // entre las dos semanas.
    var estadoParaLista = estado;
    if (rango === 'siguiente') {
      estadoParaLista = Object.assign({}, estado, {
        compra: Object.assign({}, estado.compra, { marcados: (estado.compra && estado.compra.marcadosSiguiente) || [] })
      });
    }
    var items = E.listaCompra(estadoParaLista, plan, rango === 'hoy' ? 'hoy' : 'semana', banco);
    var marcadosN = items.filter(function (i) { return i.marcado; }).length;
    // "Vaciar" desmarca SIEMPRE los marcados del segmento de SEMANA visible (Roger
    // 2026-07-17, ampliado 2026-07-18): "hoy"/"7 días" comparten un único array (no
    // hay "marcados de hoy" vs "de la semana"), pero "semana que viene" tiene el
    // suyo aparte. La lista no es editable — se deriva del plan, así que "vaciar"
    // solo puede significar desmarcar. Oculto si no hay nada marcado.
    var cabecera = renderCabecera({
      tituloPlain: 'Lista de', tituloItalico: 'compra',
      contador: marcadosN + '/' + items.length + ' en el carro',
      linkVaciar: marcadosN > 0 ? 'vaciar-compra' : null
    });

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
        '<span class="segmento' + (rango === 'hoy' ? ' segmento-activo' : '') + '" data-action="segmento-compra" data-rango="hoy">Solo hoy</span>' +
        '<span class="segmento' + (rango === '7d' ? ' segmento-activo' : '') + '" data-action="segmento-compra" data-rango="7d">Próximos 7 días</span>' +
        '<span class="segmento' + (rango === 'siguiente' ? ' segmento-activo' : '') + '" data-action="segmento-compra" data-rango="siguiente">Semana que viene</span>' +
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
            '<span class="fila-plantilla-nombre">' + escapeHtml(capitaliza(nombreEjemplo(p, banco))) + '</span>' +
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
      '<label class="campo-nombre-familia"><span class="campo-eyebrow">¿De dónde sois? (opcional)</span>' +
        '<select id="familia-region-select" class="input-editorial" data-campo="familiaRegion">' + opcionesRegion(estado.familiaRegion) + '</select></label>' +
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
      '<p class="card-msg">Pega aquí el menú semanal del cole (formato JSON del asistente — pronto será subir el PDF directamente).</p>' +
      '<p class="card-msg">Con el menú cargado, los peques comen esos mediodías en el cole (no hay que tocar su patrón) y las cenas evitan repetir lo que ya comieron.</p>' +
      '<textarea id="cole-json" class="cole-textarea" placeholder=\'{"semanaISO":"2026-07-20","dias":{"2026-07-20":{"resumen":"...","proteina":"...","hidrato":"...","verdura":true}}}\'></textarea>' +
      '<button type="button" class="btn-primary" data-action="cole-importar">Importar menú</button>' +
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
        '<p class="card-msg" style="font-size:28px;font-weight:700;letter-spacing:.08em;text-align:center;margin:16px 0;">' + escapeHtml(opts.code || '') + '</p>' +
        '<p class="card-msg">Cualquier dispositivo con este código ve y edita todo el menú — no hay permisos distintos por persona.</p>' +
        aviso +
        '<button type="button" class="btn-secondary" id="sync-rotar-btn" data-action="sync-rotar">Generar un código nuevo</button>' +
        '<p class="card-msg" style="margin-top:8px">Si el código se te ha escapado a quien no debía, genera otro: el viejo deja de servir al instante. Los móviles que ya están dentro siguen dentro.</p>' +
        '<p class="card-msg" style="margin-top:24px">Tus datos</p>' +
        '<button type="button" class="btn-secondary" id="sync-exportar-btn" data-action="sync-exportar">Descargar una copia</button>' +
        '<p class="card-msg" style="margin-top:8px">Un archivo con todo lo de tu familia: miembros, menús y lista de la compra.</p>' +
        '<button type="button" class="btn-secondary" id="sync-borrar-btn" data-action="sync-borrar" style="margin-top:16px;color:var(--danger);border-color:var(--danger)">Borrar la familia y sus datos</button>' +
        '<p class="card-msg" style="margin-top:8px">Borra la familia de la nube para todos los móviles, sin vuelta atrás. Descarga una copia antes si la quieres.</p>' +
        '</div>';
    }

    if (opts.confirmarBorrado) {
      return head + '<div class="sheet-body">' +
        '<p class="card-msg">Vas a borrar <strong>' + escapeHtml(opts.nombreFamilia || 'tu familia') + '</strong> y todos sus datos de la nube: miembros, menús y lista de la compra. Desaparece para todos los móviles de la familia y <strong>no se puede deshacer</strong>.</p>' +
        (opts.error ? '<p class="card-msg">' + escapeHtml(opts.error) + '</p>' : '') +
        '<p class="card-msg" style="margin-top:16px">Escribe <strong>BORRAR</strong> para confirmar:</p>' +
        '<label>Confirmación<input type="text" id="sync-borrar-input" class="input-editorial" placeholder="BORRAR" autocapitalize="characters" autocomplete="off"></label>' +
        '<button type="button" class="btn-secondary" id="sync-borrar-confirmar-btn" data-action="sync-borrar-confirmar" style="color:var(--danger);border-color:var(--danger)">Borrar definitivamente</button>' +
        '<button type="button" class="btn-texto" data-action="menu-sync" style="margin-top:8px">Cancelar</button>' +
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
