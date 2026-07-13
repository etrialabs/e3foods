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

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function capitaliza(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

  var NOMBRES_EJE = { proteina: 'proteína', hidrato: 'hidrato', verdura: 'verdura' };

  // nombre de plantilla sin comprometer ingrediente concreto — para listas de elección
  // ("Elegir otro plato", Recetas de Mi Familia) donde aún no hay una selección de ejes.
  function nombreGenerico(nombrePatron) {
    return nombrePatron.replace(/\{([a-z]+)\}/g, function (_, eje) { return NOMBRES_EJE[eje] || eje; });
  }

  function iniciales(nombre) {
    if (!nombre) return '?';
    return nombre.trim().charAt(0).toUpperCase();
  }

  function fechaCorta(fechaISO) {
    var d = new Date(fechaISO + 'T00:00:00');
    return d.getDate() + ' ' + ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][d.getMonth()];
  }

  function hoyISO() { return E.fechaLocalISO(new Date()); }

  // ---------------------------------------------------------------
  // Bloque de comida/cena reutilizado en HOY y SEMANA
  // ---------------------------------------------------------------
  function renderSlot(estado, banco, plan, diaIndex, tipoComida, compacto) {
    var claseCompacta = compacto ? ' card-slot-compacta' : '';
    var dia = plan.dias[diaIndex];
    var slot = dia ? dia[tipoComida] : null;
    var miembrosDelSlot = (estado.familia || []).filter(function (m) {
      var patron = m.patron && m.patron[tipoComida];
      return !patron || patron[diaIndex] === 'casa';
    });
    var presentes = E.presentesEnComida(estado, dia.fecha, diaIndex, tipoComida);
    var etiqueta = tipoComida === 'comida' ? 'COMIDA' : 'CENA';

    var avataresHtml = miembrosDelSlot.map(function (m) {
      var estaPresente = presentes.some(function (p) { return p.id === m.id; });
      return '<button type="button" class="avatar ' + (estaPresente ? 'avatar-presente' : 'avatar-ausente') + '" ' +
        'data-action="toggle-presente" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '" data-miembro="' + m.id + '" ' +
        'aria-pressed="' + estaPresente + '" aria-label="' + escapeHtml(m.nombre) + (estaPresente ? ', en casa. Toca para marcar que hoy no come.' : ', fuera hoy. Toca para marcar que sí come.') + '">' +
        escapeHtml(iniciales(m.nombre)) + '</button>';
    }).join('');

    if (!miembrosDelSlot.length) {
      return '<section class="card card-slot card-vacia' + claseCompacta + '">' +
        '<header class="card-head"><span class="card-eyebrow">' + etiqueta + '</span></header>' +
        '<p class="card-msg">Nadie come en casa (' + (tipoComida === 'comida' ? 'mediodía' : 'noche') + ').</p>' +
        '</section>';
    }

    if (!slot) {
      return '<section class="card card-slot card-vacia' + claseCompacta + '" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">' +
        '<header class="card-head"><span class="card-eyebrow">' + etiqueta + '</span></header>' +
        '<p class="card-msg">No encontramos un plato que encaje con los gustos/vetos actuales.</p>' +
        '<div class="avatares" role="group" aria-label="Quién come">' + avataresHtml + '</div>' +
        '<button type="button" class="btn-secondary btn-cambiar" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">Elegir plato</button>' +
        '</section>';
    }

    var plantilla = E.plantillaPorId(banco, estado, slot.plantillaId);
    if (!plantilla) {
      return '<section class="card card-slot card-vacia' + claseCompacta + '"><p class="card-msg">Receta no disponible.</p></section>';
    }

    var resuelto = presentes.length ? E.resolverPlato(plantilla, slot.seleccion, presentes, banco) : E.resolverPlato(plantilla, slot.seleccion, miembrosDelSlot.slice(0, 1), banco);
    var adaptacionesVisibles = (slot.adaptaciones || []).filter(function (a) {
      return presentes.some(function (p) { return p.id === a.miembroId; });
    }).map(function (a) {
      var m = (estado.familia || []).find(function (mm) { return mm.id === a.miembroId; });
      var ing = banco.ingredientes[a.valor];
      return '· ' + escapeHtml(m ? m.nombre : '?') + ': ' + escapeHtml(ing ? ing.nombre : a.valor);
    }).join(' &nbsp; ');

    return '<section class="card card-slot' + claseCompacta + '" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">' +
      '<header class="card-head">' +
        '<span class="card-eyebrow">' + etiqueta + '</span>' +
        (presentes.length ? '<span class="badge badge-kcal">~' + resuelto.kcalTotal + ' kcal</span>' : '') +
      '</header>' +
      '<h2 class="card-title">' + escapeHtml(resuelto.nombre) + '</h2>' +
      (adaptacionesVisibles ? '<p class="card-adaptaciones">' + adaptacionesVisibles + '</p>' : '') +
      (!presentes.length ? '<p class="card-msg">Nadie confirmado para esta comida.</p>' : '') +
      '<div class="avatares" role="group" aria-label="Quién come">' + avataresHtml + '</div>' +
      '<button type="button" class="btn-secondary btn-cambiar" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + tipoComida + '">Cambiar</button>' +
      '</section>';
  }

  // ---------------------------------------------------------------
  // Franja "¿Qué me falta hoy?"
  // ---------------------------------------------------------------
  function renderListaCompra(items, rango) {
    if (!items.length) return '<p class="card-msg">Nada pendiente de comprar.</p>';
    var porMarcar = items.filter(function (i) { return !i.marcado; }).length;
    return '<ul class="lista-check">' + items.map(function (item) {
      return '<li class="check-item ' + (item.marcado ? 'check-marcado' : '') + '">' +
        '<label>' +
        '<input type="checkbox" data-action="toggle-compra-item" data-rango="' + rango + '" data-id="' + item.id + '" ' + (item.marcado ? 'checked' : '') + '>' +
        '<span class="check-texto">' + escapeHtml(item.nombre) + '</span>' +
        '<span class="check-cantidad">' + item.gramos + ' g</span>' +
        '</label></li>';
    }).join('') + '</ul>' +
    '<p class="compra-resumen">' + (porMarcar ? porMarcar + ' pendientes' : 'Todo listo') + '</p>';
  }

  function renderFranjaHoy(estado, plan, banco) {
    var items = E.listaCompra(estado, plan, 'hoy', banco);
    return '<section class="franja-compra">' +
      '<h3 class="franja-titulo">¿Qué me falta hoy?</h3>' +
      renderListaCompra(items, 'hoy') +
      '</section>';
  }

  // ---------------------------------------------------------------
  // Vista HOY
  // ---------------------------------------------------------------
  function renderHoy(estado, plan, banco) {
    if (!plan) return '<p class="card-msg">Todavía no hay semana generada.</p>';
    var idx = E.diaIndexDesdeFecha(plan, hoyISO());
    if (idx === -1) idx = 0; // fuera de la semana generada (p.ej. domingo pasada la semana) -> mostrar el primer día como referencia
    return '<div class="vista-hoy">' +
      '<p class="vista-fecha">' + NOMBRES_DIA[idx] + ' ' + fechaCorta(plan.dias[idx].fecha) + '</p>' +
      renderSlot(estado, banco, plan, idx, 'comida', false) +
      renderSlot(estado, banco, plan, idx, 'cena', false) +
      renderFranjaHoy(estado, plan, banco) +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Vista SEMANA
  // ---------------------------------------------------------------
  function renderSemana(estado, plan, banco) {
    if (!plan) return '<p class="card-msg">Todavía no hay semana generada.</p>';
    var hoyIdx = E.diaIndexDesdeFecha(plan, hoyISO());
    var dias = plan.dias.map(function (dia, i) {
      var esHoy = i === hoyIdx;
      return '<div class="dia-semana ' + (esHoy ? 'dia-semana-hoy' : '') + '">' +
        '<p class="dia-semana-titulo">' + NOMBRES_DIA_CORTO[i] + ' <span class="dia-semana-fecha">' + fechaCorta(dia.fecha) + '</span>' + (esHoy ? ' <span class="badge badge-hoy">HOY</span>' : '') + '</p>' +
        renderSlot(estado, banco, plan, i, 'comida', true) +
        renderSlot(estado, banco, plan, i, 'cena', true) +
        '</div>';
    }).join('');
    return '<div class="vista-semana">' +
      '<button type="button" class="btn-primary btn-compra-semana" data-action="abrir-compra-semana">Compra de la semana</button>' +
      dias +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Sheet: compra (hoy o semana), reutilizado desde HOY/SEMANA
  // ---------------------------------------------------------------
  function renderSheetCompra(estado, plan, banco, rango) {
    var items = E.listaCompra(estado, plan, rango, banco);
    return '<div class="sheet-head"><h2>Compra de ' + (rango === 'hoy' ? 'hoy' : 'la semana') + '</h2>' +
      '<button type="button" class="btn-cerrar" data-action="cerrar-sheet" aria-label="Cerrar">&times;</button></div>' +
      '<div class="sheet-body">' + renderListaCompra(items, rango) + '</div>';
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
  // Vista MI FAMILIA
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

  function renderMiembro(miembro, banco) {
    var edad = E.edadEnAnios(miembro.nacimiento);
    return '<details class="miembro-card" data-detalle-key="miembro-' + miembro.id + '">' +
      '<summary>' +
        '<span class="avatar avatar-presente">' + escapeHtml(iniciales(miembro.nombre)) + '</span>' +
        '<span class="miembro-resumen"><strong>' + escapeHtml(miembro.nombre) + '</strong><span>' + edad + ' años · ' + (ETIQUETAS_DIETA[miembro.dieta] || 'De todo') + '</span></span>' +
      '</summary>' +
      '<div class="miembro-detalle">' +
        '<label>Nombre<input type="text" data-campo="nombre" data-id="' + miembro.id + '" value="' + escapeHtml(miembro.nombre) + '" maxlength="30"></label>' +
        '<label>Sexo<select data-campo="sexo" data-id="' + miembro.id + '">' +
          '<option value="mujer" ' + (miembro.sexo === 'mujer' ? 'selected' : '') + '>Mujer</option>' +
          '<option value="hombre" ' + (miembro.sexo === 'hombre' ? 'selected' : '') + '>Hombre</option>' +
        '</select></label>' +
        '<label>Fecha de nacimiento<input type="date" data-campo="nacimiento" data-id="' + miembro.id + '" value="' + (miembro.nacimiento || '') + '"></label>' +
        '<label>Peso (kg, opcional)<input type="number" data-campo="peso" data-id="' + miembro.id + '" value="' + (miembro.peso || '') + '" min="1" max="200"></label>' +
        '<label>Altura (cm, opcional)<input type="number" data-campo="altura" data-id="' + miembro.id + '" value="' + (miembro.altura || '') + '" min="30" max="230"></label>' +
        '<label>Actividad<select data-campo="actividad" data-id="' + miembro.id + '">' +
          '<option value="baja" ' + (miembro.actividad === 'baja' ? 'selected' : '') + '>Baja</option>' +
          '<option value="media" ' + (miembro.actividad === 'media' ? 'selected' : '') + '>Media</option>' +
          '<option value="alta" ' + (miembro.actividad === 'alta' ? 'selected' : '') + '>Alta</option>' +
        '</select></label>' +
        '<label>Dieta<select data-campo="dieta" data-id="' + miembro.id + '">' +
          Object.keys(ETIQUETAS_DIETA).map(function (k) { return '<option value="' + k + '" ' + (miembro.dieta === k ? 'selected' : '') + '>' + ETIQUETAS_DIETA[k] + '</option>'; }).join('') +
        '</select></label>' +
        '<p class="detalle-subtitulo">Patrón — comida</p>' + renderPatronGrid(miembro, 'comida') +
        '<p class="detalle-subtitulo">Patrón — cena</p>' + renderPatronGrid(miembro, 'cena') +
        '<p class="detalle-subtitulo">Vetos (no le gusta / alergia)</p>' + renderVetos(miembro, banco) +
        '<button type="button" class="btn-texto btn-borrar" data-action="borrar-miembro" data-id="' + miembro.id + '">Eliminar de la familia</button>' +
      '</div></details>';
  }

  function renderFormNuevoMiembro(idContenedor, prefijo) {
    prefijo = prefijo || 'nm';
    return '<div class="form-miembro" id="' + idContenedor + '">' +
      '<label>Nombre<input type="text" id="' + prefijo + '-nombre" maxlength="30" placeholder="Nombre"></label>' +
      '<label>Sexo<select id="' + prefijo + '-sexo"><option value="mujer">Mujer</option><option value="hombre">Hombre</option></select></label>' +
      '<label>Fecha de nacimiento<input type="date" id="' + prefijo + '-nacimiento"></label>' +
      '<label>Actividad<select id="' + prefijo + '-actividad"><option value="baja">Baja</option><option value="media" selected>Media</option><option value="alta">Alta</option></select></label>' +
      '<label>Dieta<select id="' + prefijo + '-dieta">' + Object.keys(ETIQUETAS_DIETA).map(function (k) { return '<option value="' + k + '">' + ETIQUETAS_DIETA[k] + '</option>'; }).join('') + '</select></label>' +
      '</div>';
  }

  function renderRecetas(estado, banco) {
    var todas = (banco.plantillas || []).concat(estado.propias || []);
    var ocultas = estado.ocultas || [];
    return '<ul class="lista-recetas">' + todas.map(function (p) {
      var oculta = ocultas.indexOf(p.id) !== -1;
      return '<li class="fila-receta ' + (oculta ? 'receta-oculta' : '') + '">' +
        '<span class="fila-receta-nombre">' + escapeHtml(capitaliza(nombreGenerico(p.nombre_patron))) + '<span class="fila-plantilla-meta">' + (p.tiempo_min || '?') + ' min · ' + escapeHtml(p.esfuerzo || '') + '</span></span>' +
        '<button type="button" class="btn-texto" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '">' + (oculta ? 'Mostrar' : 'Ocultar') + '</button>' +
        '</li>';
    }).join('') + '</ul>';
  }

  function renderFormRecetaPropia(banco) {
    var opcionesIng = Object.keys(banco.ingredientes).sort(function (a, b) { return banco.ingredientes[a].nombre.localeCompare(banco.ingredientes[b].nombre); })
      .map(function (id) { return '<option value="' + id + '">' + escapeHtml(banco.ingredientes[id].nombre) + '</option>'; }).join('');
    return '<details class="receta-propia-form" data-detalle-key="receta-propia">' +
      '<summary>Añadir receta propia</summary>' +
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

  function renderFamilia(estado, banco) {
    var miembros = (estado.familia || []).map(function (m) { return renderMiembro(m, banco); }).join('');
    return '<div class="vista-familia">' +
      '<h2 class="seccion-titulo">Miembros</h2>' +
      '<div class="lista-miembros">' + miembros + '</div>' +
      '<details class="nuevo-miembro-form" data-detalle-key="nuevo-miembro"><summary>Añadir miembro</summary>' +
        renderFormNuevoMiembro('familia-nuevo-miembro', 'fm') +
        '<button type="button" class="btn-primary" data-action="familia-anadir-miembro">Añadir</button>' +
      '</details>' +
      '<h2 class="seccion-titulo">Recetas</h2>' +
      renderRecetas(estado, banco) +
      renderFormRecetaPropia(banco) +
      '<h2 class="seccion-titulo">Cómo funciona</h2>' +
      '<div class="como-funciona">' +
        '<p>1. Defines tu familia una vez: edades, gustos y quién come en casa cada día.</p>' +
        '<p>2. El motor genera la semana solo, cuidando el equilibrio y sin repetir de más.</p>' +
        '<p>3. Cambias un plato cuando quieras y decides si el resto de la semana se reajusta.</p>' +
      '</div>' +
      '</div>';
  }

  global.E3UI = {
    renderHoy: renderHoy,
    renderSemana: renderSemana,
    renderFamilia: renderFamilia,
    renderSheetCompra: renderSheetCompra,
    renderSheetCambiarInicio: renderSheetCambiarInicio,
    renderListaElegirOtro: renderListaElegirOtro,
    renderNevera: renderNevera,
    renderConfirmarRegenerar: renderConfirmarRegenerar,
    renderFormNuevoMiembro: renderFormNuevoMiembro,
    escapeHtml: escapeHtml
  };
})(typeof window !== 'undefined' ? window : this);
