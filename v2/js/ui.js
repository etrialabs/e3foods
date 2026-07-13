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
    'verdura': 'Vegetal', 'fruta': 'Fruta', 'otro': 'Otro'
  };
  var ORDEN_CATEGORIA = ['pescado-blanco', 'pescado-azul', 'marisco', 'carne-blanca', 'carne-roja', 'legumbre', 'huevo', 'lacteo', 'cereal', 'tuberculo', 'verdura', 'fruta', 'otro'];

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function capitaliza(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

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

  function fechaCorta(fechaISO) {
    var d = new Date(fechaISO + 'T00:00:00');
    return d.getDate() + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()];
  }

  function hoyISO() { return E.fechaLocalISO(new Date()); }

  // ---------------------------------------------------------------
  // Cabecera midnight compartida por HOY / SEMANA / RECETAS / COMPRA
  // ---------------------------------------------------------------
  function renderCabecera(opts) {
    opts = opts || {};
    var titulo = '<h1 class="cabecera-titulo">' + escapeHtml(opts.tituloPlain || '') +
      (opts.tituloItalico ? ' <em>' + escapeHtml(opts.tituloItalico) + '</em>' : '') + '</h1>';
    var derecha = '';
    if (opts.avatarCount != null) {
      var etiqueta = opts.avatarCount + (opts.avatarCount === 1 ? ' miembro' : ' miembros');
      derecha = '<button type="button" class="cabecera-avatar" data-action="abrir-familia" aria-label="Tu familia, ' + etiqueta + '">' + opts.avatarCount + '</button>';
    } else if (opts.contador) {
      derecha = '<span class="cabecera-contador">' + escapeHtml(opts.contador) + '</span>';
    }
    var claseFija = opts.fija ? ' cabecera-midnight-fija' : '';
    return '<header class="cabecera-midnight' + claseFija + '"><div class="cabecera-fila">' + titulo + derecha + '</div>' + (opts.extra || '') + '</header>';
  }

  // iconos de sol/luna — mismo estilo de línea que el nav (24x24, stroke)
  var ICONO_SOL = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.6M12 18.9v2.6M4.6 4.6l1.8 1.8M17.6 17.6l1.8 1.8M2.5 12h2.6M18.9 12h2.6M4.6 19.4l1.8-1.8M17.6 6.4l1.8-1.8"/></svg>';
  var ICONO_LUNA = '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.8A8.5 8.5 0 1 1 9.2 3.5a6.8 6.8 0 0 0 11.3 11.3z"/></svg>';

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
  function renderSlot(estado, banco, plan, diaIndex, tipoComida) {
    var dia = plan.dias[diaIndex];
    var slot = dia ? dia[tipoComida] : null;
    var miembrosDelSlot = (estado.familia || []).filter(function (m) {
      var patron = m.patron && m.patron[tipoComida];
      return !patron || patron[diaIndex] === 'casa';
    });
    var presentes = E.presentesEnComida(estado, dia.fecha, diaIndex, tipoComida);
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

    var resuelto = presentes.length ? E.resolverPlato(plantilla, slot.seleccion, presentes, banco) : E.resolverPlato(plantilla, slot.seleccion, miembrosDelSlot.slice(0, 1), banco);
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
    var meta = (presentes.length ? '🔥 ~' + kcalMedio + ' kcal' : '') +
      (presentes.length && plantilla.tiempo_min ? ' · ' : '') +
      (plantilla.tiempo_min ? '🕐 ' + plantilla.tiempo_min + ' min' : '');

    var nombreSplit = splitNombrePlato(resuelto.nombre);
    var fotoHtml = plantilla.foto ? '<div class="card-comida-foto" style="background-image:url(\'' + escapeHtml(plantilla.foto) + '\')"></div>' : '';

    return '<section class="card card-slot" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">' +
      cabeceraTipo +
      '<div class="card-comida-fila">' +
        fotoHtml +
        '<div class="card-comida-info">' +
          '<h2 class="card-comida-titulo">' + escapeHtml(nombreSplit.titulo) + '</h2>' +
          (nombreSplit.subtitulo ? '<p class="card-comida-subtitulo">' + escapeHtml(nombreSplit.subtitulo) + '</p>' : '') +
          (meta ? '<p class="card-comida-meta">' + meta + '</p>' : '') +
          (adaptacionesVisibles ? '<p class="card-adaptaciones">' + adaptacionesVisibles + '</p>' : '') +
          (!presentes.length ? '<p class="card-msg">Nadie confirmado para esta comida.</p>' : '') +
          '<div class="avatares" role="group" aria-label="Quién come">' + avataresHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="btn-sorprendeme" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">✨ Quiero otra cosa</button>' +
      '</section>';
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

  function renderListaCompra(items) {
    if (!items.length) return '<p class="card-msg">Nada pendiente de comprar.</p>';
    var porMarcar = items.filter(function (i) { return !i.marcado; }).length;
    return '<ul class="lista-check">' + items.map(filaCompraHtml).join('') + '</ul>' +
      '<p class="compra-resumen">' + (porMarcar ? porMarcar + ' pendientes' : 'Todo listo') + '</p>';
  }

  // ---------------------------------------------------------------
  // Vista SEMANA (única vista de primer nivel para el día a día — Hoy se
  // retiró como tab aparte, Roger 2026-07-13: el selector de día hace lo
  // mismo en una sola pantalla). Selector de día (píldoras L-D) integrado
  // en la cabecera midnight, fija arriba; debajo, el día seleccionado a
  // pantalla completa — referencia visual del handoff externo.
  // ---------------------------------------------------------------
  function renderSemana(estado, plan, banco, diaSeleccionado) {
    if (!plan) {
      var cabeceraVacia = renderCabecera({ tituloPlain: 'La semana', tituloItalico: 'en la mesa', avatarCount: (estado.familia || []).length, fija: true });
      return cabeceraVacia + '<div class="vista-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
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
    var filaPildoras = '<div class="fila-pildoras-dia fila-pildoras-dia-cabecera" role="group" aria-label="Elegir día">' + pildoras + '</div>';

    var cabecera = renderCabecera({ tituloPlain: 'La semana', tituloItalico: 'en la mesa', avatarCount: (estado.familia || []).length, fija: true, extra: filaPildoras });

    var dia = plan.dias[idx];
    return cabecera + '<div class="vista-body">' +
      '<p class="vista-fecha">' + NOMBRES_DIA[idx] + ' ' + fechaCorta(dia.fecha) + (idx === hoyIdx ? ' <span class="badge badge-hoy">HOY</span>' : '') + '</p>' +
      renderSlot(estado, banco, plan, idx, 'comida') +
      renderSlot(estado, banco, plan, idx, 'cena') +
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
    var opcionesIng = Object.keys(banco.ingredientes).sort(function (a, b) { return banco.ingredientes[a].nombre.localeCompare(banco.ingredientes[b].nombre); })
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

  function renderRecetasVista(estado, banco, filtro) {
    filtro = filtro || 'todas';
    var todas = (banco.plantillas || []).concat(estado.propias || []);
    var ocultas = estado.ocultas || [];

    var categoriasPresentes = {};
    todas.forEach(function (p) { Object.keys(categoriasDePlantilla(p, banco)).forEach(function (c) { categoriasPresentes[c] = 1; }); });
    var categorias = ORDEN_CATEGORIA.filter(function (c) { return categoriasPresentes[c]; });
    var chips = ['todas'].concat(categorias);

    var chipsHtml = chips.map(function (c) {
      var activo = c === filtro;
      var nombre = c === 'todas' ? 'Todas' : (ETIQUETAS_CATEGORIA[c] || capitaliza(c));
      return '<button type="button" class="chip-filtro' + (activo ? ' chip-filtro-activo' : '') + '" data-action="filtro-receta" data-categoria="' + c + '">' + escapeHtml(nombre) + '</button>';
    }).join('');

    var listaFiltrada = filtro === 'todas' ? todas : todas.filter(function (p) { return categoriasDePlantilla(p, banco)[filtro]; });

    var filasHtml = listaFiltrada.map(function (p) {
      var oculta = ocultas.indexOf(p.id) !== -1;
      return '<li class="fila-receta ' + (oculta ? 'receta-oculta' : '') + '">' +
        '<span class="fila-receta-nombre">' + escapeHtml(capitaliza(nombreGenerico(p.nombre_patron))) + '<span class="fila-plantilla-meta">' + (p.tiempo_min || '?') + ' min · ' + escapeHtml(p.esfuerzo || '') + '</span></span>' +
        '<button type="button" class="btn-texto" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '">' + (oculta ? 'Mostrar' : 'Ocultar') + '</button>' +
        '</li>';
    }).join('');

    var cabecera = renderCabecera({ tituloPlain: 'Banco de', tituloItalico: 'recetas', contador: todas.length + ' platos' });

    return cabecera + '<div class="vista-body">' +
      '<div class="chips-filtro">' + chipsHtml + '</div>' +
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
    return '<div class="sheet-head"><h2>Cambiar ' + (tipoComida === 'comida' ? 'comida' : 'cena') + '</h2>' +
      '<button type="button" class="btn-cerrar" data-action="cerrar-sheet" aria-label="Cerrar">&times;</button></div>' +
      '<div class="sheet-body">' +
      '<button type="button" class="btn-secondary btn-sheet-opcion" data-action="modo-elegir-otro" data-dia="' + dia + '" data-tipo="' + tipoComida + '">Elegir otro plato</button>' +
      '<button type="button" class="btn-secondary btn-sheet-opcion" data-action="modo-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">Con lo que hay en la nevera</button>' +
      '</div>';
  }

  function renderListaElegirOtro(estado, banco, dia, tipoComida) {
    var candidatas = E.plantillasDisponibles(banco, estado).filter(function (p) { return (p.apta || []).indexOf(tipoComida) !== -1; });
    if (!candidatas.length) return '<p class="card-msg">No hay recetas disponibles para esta comida.</p>';
    return '<ul class="lista-plantillas">' + candidatas.map(function (p) {
      return '<li><button type="button" class="fila-plantilla" data-action="elegir-plantilla" data-dia="' + dia + '" data-tipo="' + tipoComida + '" data-plantilla="' + p.id + '">' +
        '<span class="fila-plantilla-nombre">' + escapeHtml(capitaliza(nombreGenerico(p.nombre_patron))) + '</span>' +
        '<span class="fila-plantilla-meta">' + (p.tiempo_min || '?') + ' min · ' + escapeHtml(p.esfuerzo || '') + '</span>' +
        '</button></li>';
    }).join('') + '</ul>';
  }

  function renderNevera(estado, banco, dia, tipoComida) {
    var ids = Object.keys(banco.ingredientes).sort(function (a, b) { return banco.ingredientes[a].nombre.localeCompare(banco.ingredientes[b].nombre); });
    var filas = ids.map(function (id) {
      var ing = banco.ingredientes[id];
      return '<li><label class="fila-nevera"><input type="checkbox" value="' + id + '"> ' + escapeHtml(ing.nombre) + '</label></li>';
    }).join('');
    return '<p class="card-msg">Marca lo que tienes en casa y buscamos un plato que se pueda montar con eso.</p>' +
      '<ul class="lista-nevera" id="lista-nevera-checks">' + filas + '</ul>' +
      '<button type="button" class="btn-primary" data-action="confirmar-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">Buscar plato</button>';
  }

  function renderConfirmarRegenerar(nombrePlato) {
    return '<div class="sheet-head"><h2>Cambiado</h2></div>' +
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
        (tieneFoto ? '<span class="foto-tap-editar">Cambiar</span>' :
          '<span class="foto-tap-inicial">' + escapeHtml(iniciales(miembro.nombre)) + '</span>' +
          '<span class="foto-tap-icono" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.6l.9-1.5A1.5 1.5 0 0 1 9.29 4.75h5.42A1.5 1.5 0 0 1 16 5.5L16.9 7h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg></span>') +
      '</button>' +
      '<button type="button" class="btn-texto foto-quitar-link" id="mf-foto-quitar" data-action="mf-quitar-foto"' + (tieneFoto ? '' : ' hidden') + '>Quitar foto</button>' +
      '<input type="file" id="mf-foto-input" accept="image/*" hidden>' +
      '<label class="campo-nombre-miembro"><span class="campo-eyebrow">¿Cómo se llama?</span>' +
        '<input type="text" id="mf-nombre" class="input-editorial" maxlength="30" placeholder="Nombre" value="' + escapeHtml(miembro.nombre || '') + '" autocomplete="off"></label>' +
      '<div class="fila-sexo-anio">' +
        '<div class="campo-corto"><span class="campo-eyebrow">Sexo</span>' + chipToggle('mf-sexo', [{ valor: 'mujer', etiqueta: 'Mujer' }, { valor: 'hombre', etiqueta: 'Hombre' }], miembro.sexo, 'mujer') + '</div>' +
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
        '<span class="campo-eyebrow">Actividad</span>' + chipToggle('mf-actividad', [{ valor: 'baja', etiqueta: 'Baja' }, { valor: 'media', etiqueta: 'Media' }, { valor: 'alta', etiqueta: 'Alta' }], miembro.actividad, 'media') +
        '<span class="campo-eyebrow">Tipo de dieta</span>' + chipToggle('mf-dieta', Object.keys(ETIQUETAS_DIETA).map(function (k) { return { valor: k, etiqueta: ETIQUETAS_DIETA[k] }; }), miembro.dieta, 'omnivora') +
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
      '<button type="button" class="btn-primary wizard-cta" data-action="wizard-siguiente-bienvenida">Siguiente</button>';
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

  function renderPatronGrid(miembro, tipo) {
    var valores = (miembro.patron && miembro.patron[tipo]) || ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa'];
    return '<div class="patron-grid">' + valores.map(function (v, i) {
      var etiqueta = NOMBRES_DIA[i] + ': ' + ETIQUETAS_PATRON[v] + '. Toca para cambiar.';
      return '<button type="button" class="patron-celda patron-' + v + '" data-action="toggle-patron" data-id="' + miembro.id + '" data-tipo="' + tipo + '" data-dia="' + i + '" aria-label="' + escapeHtml(etiqueta) + '">' +
        '<span class="patron-dia">' + NOMBRES_DIA_CORTO[i] + '</span><span class="patron-valor">' + ABREV_PATRON[v] + '</span></button>';
    }).join('') + '</div>';
  }

  function renderVetos(miembro, banco) {
    var vetos = miembro.vetos || [];
    var ids = Object.keys(banco.ingredientes).sort(function (a, b) { return banco.ingredientes[a].nombre.localeCompare(banco.ingredientes[b].nombre); });
    return '<div class="vetos-grid">' + ids.map(function (id) {
      var marcado = vetos.indexOf(id) !== -1;
      return '<label class="veto-chip ' + (marcado ? 'veto-activo' : '') + '">' +
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

  function renderMiembro(miembro, banco) {
    var edad = E.edadEnAnios(miembro.anioNacimiento);
    var tieneFoto = !!miembro.foto;
    return '<details class="miembro-card" data-detalle-key="miembro-' + miembro.id + '">' +
      '<summary>' +
        '<span class="avatar avatar-presente"' + avatarEstilo(miembro) + '>' + avatarInner(miembro) + '</span>' +
        '<span class="miembro-resumen"><strong>' + escapeHtml(miembro.nombre) + '</strong><span>' + edad + ' años · ' + (ETIQUETAS_DIETA[miembro.dieta] || 'De todo') + '</span></span>' +
      '</summary>' +
      '<div class="miembro-detalle">' +
        '<button type="button" class="foto-tap foto-tap-pequena" data-action="miembro-subir-foto" data-id="' + miembro.id + '" ' +
          'aria-label="' + (tieneFoto ? 'Cambiar foto' : 'Añadir foto') + '"' + (tieneFoto ? avatarEstilo(miembro) : '') + '>' +
          (tieneFoto ? '<span class="foto-tap-editar">Cambiar</span>' :
            '<span class="foto-tap-inicial">' + escapeHtml(iniciales(miembro.nombre)) + '</span>' +
            '<span class="foto-tap-icono" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.6l.9-1.5A1.5 1.5 0 0 1 9.29 4.75h5.42A1.5 1.5 0 0 1 16 5.5L16.9 7h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg></span>') +
        '</button>' +
        (tieneFoto ? '<button type="button" class="btn-texto foto-quitar-link" data-action="miembro-quitar-foto" data-id="' + miembro.id + '">Quitar foto</button>' : '') +
        '<input type="file" accept="image/*" hidden data-foto-input="' + miembro.id + '">' +
        '<label class="campo-nombre-miembro"><span class="campo-eyebrow">Nombre</span><input type="text" class="input-editorial" data-campo="nombre" data-id="' + miembro.id + '" value="' + escapeHtml(miembro.nombre) + '" maxlength="30"></label>' +
        '<div class="fila-sexo-anio">' +
          '<div class="campo-corto"><span class="campo-eyebrow">Sexo</span>' + chipToggleMiembro('sexo', [{ valor: 'mujer', etiqueta: 'Mujer' }, { valor: 'hombre', etiqueta: 'Hombre' }], miembro.sexo || 'mujer', miembro.id) + '</div>' +
          '<div class="campo-corto"><span class="campo-eyebrow">Año de nacimiento</span><input type="number" inputmode="numeric" class="input-editorial input-corto" data-campo="anioNacimiento" data-id="' + miembro.id + '" value="' + (miembro.anioNacimiento || '') + '" min="1920" max="' + new Date().getFullYear() + '"></div>' +
        '</div>' +
        '<div class="fila-sexo-anio">' +
          '<div class="campo-corto"><span class="campo-eyebrow">Altura (cm, opcional)</span><input type="number" class="input-editorial input-corto" data-campo="altura" data-id="' + miembro.id + '" value="' + (miembro.altura || '') + '" min="30" max="230"></div>' +
          '<div class="campo-corto"><span class="campo-eyebrow">Peso (kg, opcional)</span><input type="number" class="input-editorial input-corto" data-campo="peso" data-id="' + miembro.id + '" value="' + (miembro.peso || '') + '" min="1" max="200"></div>' +
        '</div>' +
        '<span class="campo-eyebrow">Actividad</span>' + chipToggleMiembro('actividad', [{ valor: 'baja', etiqueta: 'Baja' }, { valor: 'media', etiqueta: 'Media' }, { valor: 'alta', etiqueta: 'Alta' }], miembro.actividad || 'media', miembro.id) +
        '<span class="campo-eyebrow">Tipo de dieta</span>' + chipToggleMiembro('dieta', Object.keys(ETIQUETAS_DIETA).map(function (k) { return { valor: k, etiqueta: ETIQUETAS_DIETA[k] }; }), miembro.dieta || 'omnivora', miembro.id) +
        '<p class="detalle-subtitulo">Patrón — comida</p>' + renderPatronGrid(miembro, 'comida') +
        '<p class="detalle-subtitulo">Patrón — cena</p>' + renderPatronGrid(miembro, 'cena') +
        '<p class="detalle-subtitulo">Vetos (no le gusta / alergia)</p>' + renderVetos(miembro, banco) +
        '<button type="button" class="btn-texto btn-borrar" data-action="borrar-miembro" data-id="' + miembro.id + '">Eliminar de la familia</button>' +
      '</div></details>';
  }

  function renderSheetFamilia(estado, banco) {
    var miembros = estado.familia || [];
    var pills = miembros.map(function (m) {
      var extra = (m.dieta && m.dieta !== 'omnivora') ? (' · ' + (ETIQUETAS_DIETA[m.dieta] || '')) : '';
      return '<span class="pill-miembro">' + escapeHtml(m.nombre) + ' · ' + (m.anioNacimiento || '?') + extra + '</span>';
    }).join('');
    var ocultasN = (estado.ocultas || []).length;
    var miembrosCards = miembros.map(function (m) { return renderMiembro(m, banco); }).join('');

    return '<div class="sheet-head"><h2>Tu familia</h2>' +
      '<button type="button" class="btn-cerrar" data-action="cerrar-sheet" aria-label="Cerrar">&times;</button></div>' +
      '<div class="sheet-body">' +
      '<label class="campo-nombre-familia"><span class="campo-eyebrow">Nombre de familia</span>' +
        '<input type="text" id="familia-nombre-input" class="input-editorial" data-campo="nombreFamilia" maxlength="40" value="' + escapeHtml(estado.nombreFamilia || '') + '"></label>' +
      '<div class="pills-familia">' + pills +
        '<button type="button" class="pill-anadir-miembro" data-action="familia-abrir-form-miembro">+ miembro</button>' +
      '</div>' +
      '<div class="lista-miembros">' + miembrosCards + '</div>' +
      '<div class="lista-enlaces">' +
        '<button type="button" class="fila-enlace" data-action="ir-recetas-ocultas"><span>Recetas ocultas</span><span class="fila-enlace-valor">' + ocultasN + ' ›</span></button>' +
      '</div>' +
      '</div>';
  }

  global.E3UI = {
    renderSemana: renderSemana,
    renderRecetasVista: renderRecetasVista,
    renderCompraVista: renderCompraVista,
    renderSheetCambiarInicio: renderSheetCambiarInicio,
    renderListaElegirOtro: renderListaElegirOtro,
    renderNevera: renderNevera,
    renderConfirmarRegenerar: renderConfirmarRegenerar,
    renderSheetFamilia: renderSheetFamilia,
    renderFormMiembroCompleto: renderFormMiembroCompleto,
    renderWizardBienvenida: renderWizardBienvenida,
    renderWizardHub: renderWizardHub,
    escapeHtml: escapeHtml
  };
})(typeof window !== 'undefined' ? window : this);
