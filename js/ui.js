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
  var I18N = global.E3I18n;
  var t = I18N.t;
  // Funciones, no arrays estaticos: el idioma puede cambiar en caliente (backlog-v3 #18)
  // y estos nombres se leen en cada render, nunca se cachean al cargar el script.
  function NOMBRES_DIA() { return I18N.diasLargo(); }
  function NOMBRES_DIA_CORTO() { return I18N.diasCorto(); }

  // categoría de ingrediente -> etiqueta, para chips de RECETAS y secciones de COMPRA.
  // Función, no objeto estático (backlog-v3 #18): el idioma cambia en caliente. 'fruta'
  // sin traducción fuente (no está en el diseño de referencia) -- se queda en castellano.
  function ETIQUETAS_CATEGORIA() {
    return {
      'pescado-blanco': t('cat_pescado_blanco'), 'pescado-azul': t('cat_pescado_azul'), 'marisco': t('cat_marisco'),
      'carne-blanca': t('cat_carne_blanca'), 'carne-roja': t('cat_carne_roja'), 'legumbre': t('cat_legumbre'),
      'huevo': t('cat_huevo'), 'lacteo': t('cat_lacteo'), 'cereal': t('cat_cereal'), 'tuberculo': t('cat_tuberculo'),
      'verdura': t('cat_verdura'), 'fruta': 'Fruta', 'otro': t('cat_otro'),
      // Roger 2026-07-14: chips presentes aunque el banco no tiene el dato para
      // filtrar de verdad todavía — ver nota en renderRecetasVista.
      'vegetariana': t('cat_vegetariana'), 'sin-gluten': t('cat_sin_gluten')
    };
  }
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

  // opciones de las píldoras de miembro — compartidas por el asistente de alta y
  // la ficha en acordeón (pildorasPersona las pinta en los dos sitios)
  var OPCIONES_SEXO = [{ valor: 'mujer', etiqueta: 'Mujer' }, { valor: 'hombre', etiqueta: 'Hombre' }];
  var OPCIONES_ACTIVIDAD = [{ valor: 'baja', etiqueta: 'Baja' }, { valor: 'media', etiqueta: 'Media' }, { valor: 'alta', etiqueta: 'Alta' }];

  // ---------------------------------------------------------------
  // Persona — catálogos del handoff "Alta de persona" (Claude Design, 2026-07-30)
  // ---------------------------------------------------------------
  // Estilo de vida + 6 alergias + gustos + patrón de comidas. Los catálogos son
  // ÚNICOS a propósito: las dos superficies que los pintan (el asistente de 5
  // pasos del onboarding y la ficha en acordeón de Familia) leen de aquí, así
  // no pueden divergir en id, etiqueta ni orden.
  // Esta taxonomía es la MISMA que va a construir `bd_v5/dietas.js` (4 estilos +
  // 6 alergias, ver PROMPT_SESION_DIETAS_SELECTOR §2). Aquí solo se CAPTURA y se
  // persiste: el motor v3 no consume todavía `alergias`/`gustos` — lo único
  // cableado al motor es `dieta`, que se deriva de `estilo` (ver estiloADieta).
  var ESTILOS_VIDA = [
    { id: 'de-todo', etiqueta: 'De todo', desc: 'Sin restricciones: pescado, carne, verdura y legumbre.', icono: 'utensils-crossed' },
    { id: 'vegetariano', etiqueta: 'Vegetariano', desc: 'Sin carne ni pescado; con lácteos y huevo.', icono: 'leaf' },
    { id: 'vegano', etiqueta: 'Vegano', desc: 'Nada de origen animal.', icono: 'sprout' },
    { id: 'sin-cerdo', etiqueta: 'Sin cerdo', desc: 'Ni cerdo ni sus derivados.', icono: 'ban' }
  ];
  var ETIQUETA_ESTILO = {};
  ESTILOS_VIDA.forEach(function (e) { ETIQUETA_ESTILO[e.id] = e.etiqueta; });

  // Los ids son los de `bd_v5/dietas.js` (ALERGIAS_PERFIL), no los del prototipo: ese
  // fichero es la fuente única de las reglas de dieta y lo que consumirá el selector.
  // Guardar aquí un vocabulario propio obligaría a remapear datos reales más adelante.
  // Las etiquetas visibles sí son las del handoff.
  var ALERGIAS_PERSONA = [
    { id: 'sin-gluten', etiqueta: 'Sin gluten', desc: 'Celiaquía o sensibilidad al gluten.' },
    { id: 'sin-lactosa', etiqueta: 'Sin lactosa / lácteos', desc: 'Leche, quesos, yogures y nata.' },
    { id: 'sin-huevo', etiqueta: 'Huevo', desc: 'Huevo y preparados con huevo.' },
    { id: 'sin-frutos-secos', etiqueta: 'Frutos secos y/o cacahuete', desc: 'Nueces, almendras, cacahuete…' },
    { id: 'sin-pescado-marisco', etiqueta: 'Pescado y/o marisco', desc: 'Pescado, gambas, mejillones…' },
    { id: 'sin-rosaceas', etiqueta: 'Frutas clave', desc: 'Melocotón y familia (nectarina, albaricoque).' }
  ];
  var ETIQUETA_ALERGIA = {};
  ALERGIAS_PERSONA.forEach(function (a) { ETIQUETA_ALERGIA[a.id] = a.etiqueta; });

  var GUSTOS_GRUPOS = [
    { titulo: 'Proteínas', items: [['pollo', 'Pollo'], ['ternera', 'Ternera'], ['cerdo', 'Cerdo'], ['salmon', 'Salmón'], ['merluza', 'Merluza'], ['atun', 'Atún'], ['huevos', 'Huevos'], ['lentejas', 'Lentejas'], ['garbanzos', 'Garbanzos'], ['tofu', 'Tofu']] },
    { titulo: 'Verduras y guarniciones', items: [['brocoli', 'Brócoli'], ['espinacas', 'Espinacas'], ['calabacin', 'Calabacín'], ['pimiento', 'Pimiento'], ['champinones', 'Champiñones'], ['ensalada', 'Ensalada'], ['patata', 'Patata'], ['arroz', 'Arroz'], ['pasta', 'Pasta']] },
    { titulo: 'Platos de siempre', items: [['tortilla', 'Tortilla de patata'], ['lentejas-guiso', 'Lentejas guisadas'], ['paella', 'Arroz de domingo'], ['crema', 'Crema de verduras'], ['pescado-horno', 'Pescado al horno'], ['guiso', 'Guisos de cuchara']] }
  ];
  var ETIQUETA_GUSTO = {};
  GUSTOS_GRUPOS.forEach(function (g) { g.items.forEach(function (par) { ETIQUETA_GUSTO[par[0]] = par[1]; }); });

  var PATRONES_COMIDA = [
    { id: 'plato-unico', etiqueta: 'Plato único', desc: 'Un plato completo y fruta.' },
    { id: 'primero-segundo', etiqueta: 'Primero y segundo', desc: 'Verdura o cuchara + proteína.' },
    { id: 'ligera', etiqueta: 'Ligera', desc: 'Algo rápido, poca cantidad.' }
  ];
  var PATRONES_CENA = [
    { id: 'ligera', etiqueta: 'Ligera', desc: 'Crema, ensalada o verdura + algo de proteína.' },
    { id: 'plato-unico', etiqueta: 'Plato único', desc: 'Un plato y ya está.' },
    { id: 'completa', etiqueta: 'Completa', desc: 'Como una comida: primero y segundo.' }
  ];
  var ETIQUETA_PATRON_COMIDA = { 'plato-unico': 'Plato único', 'primero-segundo': 'Primero y segundo', ligera: 'Ligera', completa: 'Completa' };

  var OPCIONES_OBJETIVO_PERSONA = [
    { valor: 'mantenimiento', etiqueta: 'Mantener' },
    { valor: 'perdida', etiqueta: 'Perder' },
    { valor: 'ganancia', etiqueta: 'Ganar' }
  ];
  var AYUDA_ACTIVIDAD = {
    baja: 'Trabajo sentado, poco ejercicio.',
    media: 'Camina a diario o hace ejercicio 2-3 días.',
    alta: 'Trabajo físico o deporte casi diario.'
  };

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
  var DIAS_INICIAL = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  function pildorasPersona(campo, opciones, valorActual) {
    return '<div class="per-pildoras">' + opciones.map(function (o) {
      var activo = o.valor === valorActual;
      return '<button type="button" class="per-pildora' + (activo ? ' per-pildora-on' : '') + '" ' +
        'data-action="persona-set" data-campo="' + campo + '" data-valor="' + o.valor + '" aria-pressed="' + activo + '">' +
        escapeHtml(o.etiqueta) + '</button>';
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
        '<span class="per-tarjeta-txt"><span class="per-tarjeta-nombre">' + escapeHtml(o.etiqueta) + '</span>' +
        '<span class="per-tarjeta-desc">' + escapeHtml(o.desc) + '</span></span>' +
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
        '<span class="per-alergia-txt"><span class="per-alergia-nombre">' + escapeHtml(a.etiqueta) + '</span>' +
        (conDescripcion ? '<span class="per-alergia-desc">' + escapeHtml(a.desc) + '</span>' : '') + '</span>' +
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
      var estado = v === 1 ? 'le encanta' : v === 2 ? 'mejor no' : 'sin marcar';
      return '<button type="button" class="per-chip' + clase + '" data-action="persona-gusto" data-valor="' + par[0] + '" ' +
        'aria-label="' + escapeHtml(par[1] + ': ' + estado + '. Toca para cambiar.') + '">' +
        marca + escapeHtml(par[1]) + '</button>';
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
      DIAS_INICIAL.map(function (d) { return '<span class="per-dia">' + d + '</span>'; }).join('') + '</div>' +
      '<div class="per-grid-tit"><i data-lucide="sun"></i>Comida</div>' + fila('comida') +
      '<div class="per-grid-tit per-grid-tit-cena"><i data-lucide="moon"></i>Cena</div>' + fila('cena');
  }

  function resumenServicios(miembro) {
    var patron = patronSeguro(miembro);
    // El prototipo devolvía 'todos' cuando no falta ningún día, y la frase salía
    // invertida ("Fuera: comidas todos" con 14 de 14 en casa). Aquí, ninguna.
    var fuera = function (tipo) {
      var f = patron[tipo].map(function (v, i) { return v === 'casa' ? null : DIAS_INICIAL[i]; }).filter(Boolean);
      return f.length ? f.join(' ') : 'ninguna';
    };
    return 'Planificamos ' + serviciosEnCasa(miembro) + ' de 14 servicios. Fuera: comidas ' + fuera('comida') + ' · cenas ' + fuera('cena') + '.';
  }

  // Textos de resumen de los 5 bloques — los usan la ficha del onboarding (paso
  // 7) y las cabeceras del acordeón de Familia. Mismos textos en los dos sitios.
  function resumenPersona(m) {
    var gustos = m.gustos || {};
    var si = Object.keys(gustos).filter(function (k) { return gustos[k] === 1; });
    var no = Object.keys(gustos).filter(function (k) { return gustos[k] === 2; });
    var alergias = m.alergias || [];
    var restric = (m.restricciones || '').trim();
    var objetivo = (OPCIONES_OBJETIVO_PERSONA.find(function (o) { return o.valor === (m.objetivo || 'mantenimiento'); }) || OPCIONES_OBJETIVO_PERSONA[0]).etiqueta;
    return {
      basicos: [
        (m.nombre || '').trim() || 'Sin nombre',
        (m.sexo === 'hombre' ? 'Hombre' : 'Mujer'),
        m.anioNacimiento || 'Año sin indicar',
        m.altura ? m.altura + ' cm' : null,
        m.peso ? m.peso + ' kg' : null,
        'Actividad ' + (m.actividad || 'media'),
        objetivo + ' peso'
      ].filter(Boolean).join(' · '),
      estilo: ETIQUETA_ESTILO[estiloDeMiembro(m)] || 'Sin elegir',
      alergias: alergias.length
        ? alergias.map(function (a) { return ETIQUETA_ALERGIA[a]; }).join(' · ')
        : (restric && restric.toLowerCase() !== 'ninguna' ? restric : 'Ninguna marcada'),
      gustos: (si.length ? '♥ ' + si.map(function (k) { return ETIQUETA_GUSTO[k]; }).join(', ') : 'Sin favoritos') +
        (no.length ? '   ·   ✕ ' + no.map(function (k) { return ETIQUETA_GUSTO[k]; }).join(', ') : ''),
      comidas: 'Comida ' + (ETIQUETA_PATRON_COMIDA[m.pComida] || 'Primero y segundo') +
        ' · Cena ' + (ETIQUETA_PATRON_COMIDA[m.pCena] || 'Ligera') +
        ' · ' + serviciosEnCasa(m) + ' de 14 servicios en casa'
    };
  }

  // Avisos reutilizados (mismo copy en asistente y ficha)
  function avisoInfo(texto) {
    return '<div class="per-aviso"><span class="per-aviso-ico"><i data-lucide="info"></i></span><span>' + escapeHtml(texto) + '</span></div>';
  }
  var TEXTO_AVISO_MEDIDAS = 'Estos datos son opcionales, pero nos ayudan a ajustar sus cantidades adecuadas.';

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

  function nombreCortoIngrediente(nombre) {
    return (nombre || '').split(' (')[0];
  }

  // v3: el motor ya resuelve nombre/pasos/variantes de una elaboración sin plan
  // real detrás (E.previsualizarElaboracion) — sustituye a nombreEjemplo/
  // variantesProteina de v2 (que leían plantilla.ejes/nombre_patron a mano).
  // Cachea por id dentro de una misma pasada de render (varias tarjetas piden
  // la misma elaboración: grid + chips + búsqueda).
  var _cachePrevisualizacion = {};
  function previsualizar(p, banco) {
    if (!_cachePrevisualizacion[p.id]) _cachePrevisualizacion[p.id] = E.previsualizarElaboracion(p, banco);
    return _cachePrevisualizacion[p.id];
  }

  function nombreEjemplo(p, banco) { return previsualizar(p, banco).nombre; }

  function variantesTexto(p, banco) {
    var variantes = previsualizar(p, banco).variantes;
    if (!variantes.length) return '';
    var opciones = p.ingredientes && p.ingredientes.opciones;
    return 'también con ' + variantes.map(function (n) { return nombreCortoIngrediente(n).toLowerCase(); }).join(', ') + (opciones && opciones.length > 4 ? '…' : '');
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

  function hoyISO() { return E.fechaLocalISO(new Date()); }

  function saludoHora() {
    var h = new Date().getHours();
    if (h < 12) return t('saludo_manana');
    if (h < 20) return t('saludo_tarde');
    return t('saludo_noche');
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

    // v3: el slot ya trae el menú COMPLETO resuelto (nombre/kcal/complementarias)
    // desde que se generó — no hace falta volver a llamar al motor en cada render
    // (antes resolverPlato se invocaba aquí cada vez; ahora es un simple read).
    var principal = slot ? E.elaboracionPorId(banco, estado, slot.menu.principalId) : null;
    // postreDelDia() es del DÍA, no de la comida — sin filtro por esCena
    // (handoff líneas 105/142: "De postre" aparece igual en las dos cards).
    var postre = E.postreDelDia(banco, dia.fecha, diaIndex);
    var postreTexto = postre ? (postre.tipo === 'tradicional' ? postre.nombre + ' (receta de finde)' : postre.nombre) : '';

    if (!mesa.miembrosDelSlot.length) {
      return '<div class="' + claseCard + ' ph-card-vacia" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' + cabeceraVacia +
        '<p class="card-msg">Nadie come en casa (' + (esCena ? 'noche' : 'mediodía') + ').</p></div>';
    }
    if (!slot || !principal) {
      return '<div class="' + claseCard + ' ph-card-vacia" data-dia="' + diaIndex + '" data-tipo="' + meal + '">' + cabeceraVacia +
        '<p class="card-msg">No encontramos un plato que encaje con los gustos/vetos actuales.</p>' +
        '<button type="button" class="btn-secondary" data-action="abrir-cambiar" data-dia="' + diaIndex + '" data-tipo="' + meal + '">Elegir plato</button></div>';
    }

    var subtitulo = (slot.menu.complementariasResueltas || []).map(function (c) { return c.nombre; }).join(' · ');
    var kcalMedio = mesa.presentes.length ? Math.round(slot.menu.kcalTotal / mesa.presentes.length) : 0;
    var tag = ETIQUETA_ESFUERZO[principal.esfuerzo] || '';
    var fotoHtml = principal.foto ? '<img class="ph-foto" src="' + escapeHtml(principal.foto) + '" alt="">' : '<div class="ph-foto ph-foto-vacia"></div>';

    var metaHtml = '<div class="ph-meta">' +
      (mesa.presentes.length ? '<span class="ph-meta-item"><i data-lucide="flame"></i>~' + kcalMedio + ' kcal<span class="ph-meta-sub">/pers</span></span><span class="ph-meta-punto"></span>' : '') +
      '<span class="ph-meta-item"><i data-lucide="clock"></i>' + (principal.tiempo_min || '?') + ' min</span>' +
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
      '<p class="ph-titulo">' + escapeHtml(slot.menu.nombre) + '</p>' +
      (subtitulo ? '<p class="ph-subtitulo">' + escapeHtml(subtitulo) + '</p>' : '') +
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

  function renderVistaReceta(estado, banco, plan, diaIndex, tipoComida) {
    var dia = plan && plan.dias[diaIndex];
    var slot = dia ? dia[tipoComida] : null;
    var principal = slot ? E.elaboracionPorId(banco, estado, slot.menu.principalId) : null;
    if (!dia || !slot || !principal) {
      return '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos esta receta.</p></div>';
    }
    var mesa = comensalesDeSlot(estado, plan, diaIndex, tipoComida);
    var menu = slot.menu;
    var esCena = tipoComida === 'cena';
    var kcalMedio = mesa.presentes.length ? Math.round(menu.kcalTotal / mesa.presentes.length) : 0;
    var tag = ETIQUETA_ESFUERZO[principal.esfuerzo] || '—';
    var favorita = (estado.favoritas || []).indexOf(principal.id) !== -1;
    var oculta = (estado.ocultas || []).indexOf(principal.id) !== -1;
    var fotoHtml = principal.foto ? '<img src="' + escapeHtml(principal.foto) + '" alt="">' : '<div class="rv-foto-vacia"></div>';

    var ingredientesHtml = menu.ingredientes.slice().sort(function (a, b) {
      var na = banco.ingredientes[a.id] ? banco.ingredientes[a.id].nombre : a.id;
      var nb = banco.ingredientes[b.id] ? banco.ingredientes[b.id].nombre : b.id;
      return na.localeCompare(nb);
    }).map(function (item) {
      var ing = banco.ingredientes[item.id];
      return '<div class="rv-ingrediente"><span class="rv-ingrediente-bullet"></span><span class="rv-ingrediente-nombre">' + escapeHtml(ing ? ing.nombre : item.id) + '</span><span class="rv-ingrediente-g">' + E.redondearCantidad(item.gramos) + ' g</span></div>';
    }).join('');

    // v3: el menú es principal + complementarias, cada una con su propia
    // preparación — ya no un único bloque "X con Y y Z" (borrador §2).
    var pasosHtml = menu.pasos.length
      ? '<div class="rv-pasos">' + pasosCards(menu.pasos) + '</div>'
      : '<p class="card-msg">Sin pasos detallados para esta receta.</p>';
    var complementariasHtml = (menu.complementariasResueltas || []).map(function (c) {
      return '<p class="detalle-subtitulo" style="margin-top:18px">' + escapeHtml(c.nombre) + '</p>' +
        '<div class="rv-pasos">' + pasosCards(c.pasos) + '</div>';
    }).join('');

    // Segunda (o tercera...) cocción por mesa mixta (Roger 2026-07-14): si a
    // alguien le toca un ingrediente distinto en el eje proteína, sus pasos
    // van aparte — foso #1 del producto, se preserva tal cual.
    var pasosAdaptadosHtml = (menu.pasosAdaptados || []).map(function (pa) {
      var m = (estado.familia || []).find(function (mm) { return mm.id === pa.miembroId; });
      return '<p class="detalle-subtitulo" style="margin-top:18px">Para ' + escapeHtml(m ? m.nombre : '?') + ' (' + escapeHtml(pa.ingrediente) + ')</p>' +
        '<div class="rv-pasos">' + pasosCards(pa.pasos) + '</div>';
    }).join('');

    return '<div class="rv-hero">' + fotoHtml + '<div class="rv-hero-gradiente"></div>' +
      '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
      '<div class="rv-acciones">' +
      '<button type="button" class="rv-flotante' + (oculta ? ' rv-flotante-activo' : '') + '" data-action="toggle-oculta-receta" data-plantilla="' + principal.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '" aria-pressed="' + oculta + '"><i data-lucide="eye-off"></i></button>' +
      '<button type="button" class="rv-flotante' + (favorita ? ' rv-flotante-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + principal.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '</div></div>' +
      '<div class="rv-body">' +
      '<span class="rv-pill rv-pill-' + (esCena ? 'cena' : 'comida') + '">' + (esCena ? ICONO_LUNA : ICONO_SOL) + (esCena ? 'CENA' : 'COMIDA') + '</span>' +
      '<h1 class="rv-titulo">' + escapeHtml(menu.nombre) + '</h1>' +
      (menu.complementariasResueltas.length ? '<p class="rv-subtitulo">' + escapeHtml(menu.complementariasResueltas.map(function (c) { return c.nombre; }).join(' · ')) + '</p>' : '') +
      '<div class="rv-stats">' +
      '<div class="rv-stat"><i data-lucide="clock"></i><span class="rv-stat-valor">' + (principal.tiempo_min || '?') + ' min</span></div>' +
      (mesa.presentes.length ? '<div class="rv-stat"><i data-lucide="flame"></i><span class="rv-stat-valor">~' + kcalMedio + ' kcal</span></div>' : '') +
      '<div class="rv-stat"><i data-lucide="leaf"></i><span class="rv-stat-valor">' + tag + '</span></div>' +
      '</div>' +
      (mesa.miembrosDelSlot.length ? '<div class="rv-comensales"><span class="ph-avatares">' + avataresReceta(estado, mesa) + '</span><span class="rv-comensales-texto">' + escapeHtml(textoComensalesReceta(estado, mesa)) + '</span></div>' : '') +
      '<p class="rv-seccion-titulo">' + t('ingredientes') + '</p>' +
      '<div class="rv-ingredientes">' + ingredientesHtml + '</div>' +
      '<p class="rv-seccion-titulo">' + t('preparacion') + '</p>' +
      pasosHtml +
      complementariasHtml +
      pasosAdaptadosHtml +
      renderValoracion(estado, dia.fecha, tipoComida) +
      '<button type="button" class="rv-cta" data-action="ir-vista" data-vista="compra"><i data-lucide="shopping-basket"></i>' + t('ver_en_la_lista_de_la_compra') + '</button>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // Listas de compra (filas de check) — reutilizadas en franja HOY y tab COMPRA
  // ---------------------------------------------------------------
  function filaCompraHtml(item) {
    // gramos null = ítem "¿lo tengo en casa?" (base de despensa/staple, Roger 2026-07-21): sin
    // cantidad real que comprar, solo el check — no se muestra "0 g" ni ninguna cifra inventada.
    // unidades (huevo/yogur): se compra por piezas, no por gramos — "6 uds" en vez de "750 g".
    var cantidadHtml = item.unidades != null ? '<span class="check-cantidad">' + item.unidades + (item.unidades === 1 ? ' ud' : ' uds') + '</span>'
      : item.gramos == null ? '' : '<span class="check-cantidad">' + item.gramos + ' g</span>';
    return '<li class="check-item ' + (item.marcado ? 'check-marcado' : '') + '">' +
      '<label>' +
      '<input type="checkbox" data-action="toggle-compra-item" data-id="' + item.id + '" ' + (item.marcado ? 'checked' : '') + '>' +
      '<span class="check-texto">' + escapeHtml(item.nombre) + '</span>' +
      cantidadHtml +
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
  function renderAvisoEquilibrio(plan, banco, estado) {
    var resumen = E.resumenCuotasSemana(plan, banco, estado);
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
        '<span class="ph-dia-letra">' + NOMBRES_DIA_CORTO()[i % 7].charAt(0) + '</span>' +
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

    // ---- banner despensa + cole (cole = día que se está mirando; compra = SIEMPRE hoy real) ----
    var minors = familia.filter(function (m) { return E.edadEnAnios(m.anioNacimiento) < 12; });
    var coleDiaObj = estado.cole && estado.cole.dias && estado.cole.dias[diaObj.fecha];
    var coleTextoHtml = '';
    if (coleDiaObj && minors.length) {
      var nombresMinors = minors.map(function (m) { return m.nombre; });
      var juntos = nombresMinors.length <= 1 ? (nombresMinors[0] || '') : nombresMinors.slice(0, -1).join(', ') + ' y ' + nombresMinors[nombresMinors.length - 1];
      coleTextoHtml = escapeHtml(juntos) + ' ' + (nombresMinors.length > 1 ? 'comen' : 'come') + (esHoy ? ' hoy' : '') + ' en el <button type="button" class="ingrediente-link" data-action="ir-cole">cole</button>. ';
    }
    // Despensa (staples/recordatorio) fuera del contador de HOY — mismo criterio que renderCompraVista.
    var itemsHoyReal = E.listaCompra(estado, estado.plan, 'hoy', banco, null, new Date().getHours() >= 16).filter(function (i) { return i.categoria !== 'despensa'; });
    var faltanHoyReal = itemsHoyReal.filter(function (i) { return !i.marcado; });
    var pantryTexto;
    if (!itemsHoyReal.length) pantryTexto = '';
    else if (!faltanHoyReal.length) pantryTexto = t('pantry_todo_listo');
    else pantryTexto = faltanHoyReal.length + ' ingrediente' + (faltanHoyReal.length === 1 ? '' : 's') + ' en tu lista — <button type="button" class="ingrediente-link" data-action="ir-compra-hoy">' + t('revisala') + '</button>' + t('pantry_antes_de_cocinar');
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
      '<button type="button" id="pager-seg-comida" class="ph-seg-btn' + (pagerIdx === 0 ? ' pager-seg-activo' : '') + '" data-action="pager-ir" data-pager="0"><i data-lucide="sun"></i>' + t('boton_comida') + '</button>' +
      '<button type="button" id="pager-seg-cena" class="ph-seg-btn' + (pagerIdx === 1 ? ' pager-seg-activo' : '') + '" data-action="pager-ir" data-pager="1"><i data-lucide="moon"></i>' + t('boton_cena') + '</button>' +
      '</div>';

    // ---- subir menú del cole ----
    var tieneCargado = !!(estado.cole && estado.cole.dias && Object.keys(estado.cole.dias).length);
    var coleCardHtml = '<button type="button" class="ph-cole-card" data-action="menu-importar-cole">' +
      '<span class="ph-cole-icono"><i data-lucide="paperclip"></i></span>' +
      '<span class="ph-cole-texto"><span class="ph-cole-titulo">' + (tieneCargado ? 'Actualizar menú del cole' : t('subir_menu_del_cole')) + '</span>' +
      '<span class="ph-cole-sub">' + t('ajustamos_las_cenas_para_compensar') + '</span></span>' +
      '<i data-lucide="upload" class="ph-cole-flecha"></i></button>';

    // ---- próximos días (7, tras hoy real) ----
    var inicioProximos = (hoyIdxGlobal !== -1 ? hoyIdxGlobal : idx) + 1;
    var proximosItems = '';
    for (var p = inicioProximos; p < Math.min(inicioProximos + 7, plan14.length); p++) {
      var pd = plan14[p];
      var pLocal = p % 7;
      var pComidaPl = pd.comida ? E.elaboracionPorId(banco, estado, pd.comida.menu.principalId) : null;
      var pCenaPl = pd.cena ? E.elaboracionPorId(banco, estado, pd.cena.menu.principalId) : null;
      var pComidaNombre = pd.comida ? pd.comida.menu.nombre : 'Sin plan';
      var pCenaNombre = pd.cena ? pd.cena.menu.nombre : 'Sin plan';
      var pColeDia = estado.cole && estado.cole.dias && estado.cole.dias[pd.fecha];
      var pFotoPl = pCenaPl || pComidaPl;
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
      '</div>';
  }

  // ---------------------------------------------------------------
  // Sheet: resumen semanal — índice de equilibrio (semáforo de cuotas, dato que
  // el motor ya computa) + semana de un vistazo. Pedido convergente en la
  // valoración externa de producto (2026-07-16); el pill de arriba ya estaba
  // pintado sin acción — esta es esa acción.
  // ---------------------------------------------------------------
  function renderEquilibrioSemana(plan, banco, estado) {
    var resumen = E.resumenCuotasSemana(plan, banco, estado);
    if (!resumen.length) return '';
    var cumplidas = resumen.filter(function (r) { return r.cumplido; }).length;
    var filas = resumen.map(function (r) {
      var etiqueta = ETIQUETA_CUOTA_AGREGADA[r.categoria] || ETIQUETAS_CATEGORIA()[r.categoria] || capitaliza(r.categoria.replace(/-/g, ' '));
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

  // nombre corto de un plato para la vista de un vistazo — v3: el slot ya
  // trae el nombre resuelto, no hace falta volver a llamar al motor.
  function nombreCortoSlot(estado, banco, slot) {
    if (!slot || !slot.menu) return 'Sin plan';
    return slot.menu.nombre;
  }

  function renderResumenDia(estado, banco, plan, diaIndex, hoyIdx) {
    var dia = plan.dias[diaIndex];
    var esHoy = diaIndex === hoyIdx;
    return '<div class="resumen-semana-dia">' +
      '<p class="resumen-semana-fecha">' + NOMBRES_DIA()[diaIndex] + ' ' + fechaCorta(dia.fecha) + (esHoy ? ' <span class="badge badge-hoy">HOY</span>' : '') + '</p>' +
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
      renderEquilibrioSemana(plan, banco, estado) +
      '<div class="resumen-semana-lista">' + diasHtml + '</div>' +
      '</div>';
  }

  // ---------------------------------------------------------------
  // RECETAS — banco con chips de filtro por categoría
  // ---------------------------------------------------------------
  // Vegetariana en Recetas (Roger, UPGRADES §2/§6, punto 8): reutiliza la misma lógica de dieta
  // del motor (categoriaExcluidaPorDieta/opcionAptaParaDieta) en vez de simular un dato nuevo.
  // Si la proteína es eje (varias opciones), basta con que UNA sea apta (la familia la elige,
  // igual que mesa mixta real). Si es fija (fijoTodo, p.ej. boloñesa), TODAS las fijas deben ser
  // aptas — a diferencia de elaboracionViableParaMesa (pensada para vetos/temporada de un
  // candidato ya resuelto), aquí sí hace falta este caso: una proteína fija de carne no es
  // vegetariana solo porque no haya eje que adaptar.
  function esVegetarianaApta(p, banco) {
    var fijoProteina = (p.ingredientes.fijos || {}).proteina;
    if (fijoProteina) {
      return fijoProteina.every(function (id) { var ing = banco.ingredientes[id]; return ing && !E.categoriaExcluidaPorDieta(ing.categoria, 'vegetariana', id); });
    }
    if (p.ingredientes.eje === 'proteina') return !!E.opcionAptaParaDieta(p.ingredientes.opciones, 'vegetariana', banco, [], null);
    return true; // sin grupo proteina interno (lo cubre una complementaria externa) -> no bloquea
  }

  function categoriasDePlantilla(p, banco) {
    var set = {};
    var ids = (p.ingredientes.opciones || []).slice();
    Object.keys(p.ingredientes.fijos || {}).forEach(function (g) { ids = ids.concat(p.ingredientes.fijos[g]); });
    ids.forEach(function (id) {
      var ing = banco.ingredientes[id];
      if (ing) set[ing.categoria] = 1;
    });
    return set;
  }

  function renderFormRecetaPropia(banco) {
    // v3 (tramo 6): el modelo ya no es 3 ejes fijos — una receta propia es una
    // elaboración PRINCIPAL (identidad = su ingrediente principal); hidrato y
    // verdura los añade el ensamblador solo, vía compatibilidad genérica (misma
    // familia que cualquier plancha/horno). Sin campo de técnica nuevo (cero
    // mandos nuevos, principio del proyecto) — se asume 'plancha', la más neutra.
    var categoriasProteina = {};
    (banco.grupos && banco.grupos.proteina || []).forEach(function (c) { categoriasProteina[c] = 1; });
    var opcionesIng = idsIngredientesOrdenados(banco)
      .filter(function (id) { return categoriasProteina[banco.ingredientes[id].categoria]; })
      .map(function (id) { return '<option value="' + id + '">' + escapeHtml(banco.ingredientes[id].nombre) + '</option>'; }).join('');
    return '<details class="receta-propia-form" data-detalle-key="receta-propia">' +
      '<summary>+ Añadir receta propia</summary>' +
      '<div class="form-miembro">' +
      '<label>Nombre del plato<input type="text" id="rp-nombre" maxlength="60" placeholder="p.ej. Salmón con puré"></label>' +
      '<label>Lo principal<select id="rp-proteina"><option value="">(elige un ingrediente)</option>' + opcionesIng + '</select></label>' +
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
  function ETIQUETA_CHIP_ESPECIAL() { return { todas: t('chip_todas'), rapidas: t('chip_rapidas'), favoritas: t('chip_favoritas') }; }

  function tarjetaRecetaGrid(p, banco, oculta, favorita) {
    // lazy (audit 2026-07-20): el grid pinta hasta 82 <img> de golpe — hoy son 4
    // ficheros únicos, pero con fotos por receta (UPGRADES §3) serían 82 requests
    var fotoHtml = p.foto ? '<img src="' + escapeHtml(p.foto) + '" alt="" loading="lazy" decoding="async">' : '<div class="rc-foto-vacia"></div>';
    var tag = ETIQUETA_ESFUERZO[p.esfuerzo] || '';
    return '<div class="rc-tarjeta' + (oculta ? ' rc-oculta' : '') + '">' +
      '<button type="button" class="rc-tarjeta-abrir" data-action="abrir-receta-banco" data-plantilla="' + p.id + '">' +
      '<span class="rc-tarjeta-foto">' + fotoHtml + (tag ? '<span class="rc-tarjeta-tag">' + escapeHtml(tag) + '</span>' : '') + '</span>' +
      '<span class="rc-tarjeta-info"><span class="rc-tarjeta-nombre">' + escapeHtml(nombreEjemplo(p, banco)) + '</span></span>' +
      '</button>' +
      '<div class="rc-tarjeta-pie">' +
      '<span class="rc-tarjeta-meta"><i data-lucide="clock"></i>' + (p.tiempo_min || '?') + ' min</span>' +
      '<span class="rc-tarjeta-acciones">' +
      '<button type="button" class="rc-icono-btn' + (favorita ? ' rc-icono-activo' : '') + '" data-action="toggle-favorita-receta" data-plantilla="' + p.id + '" aria-label="' + (favorita ? 'Quitar de favoritas' : 'Marcar como favorita') + '" aria-pressed="' + favorita + '"><i data-lucide="heart"' + (favorita ? ' style="fill:currentColor"' : '') + '></i></button>' +
      '<button type="button" class="rc-icono-btn" data-action="toggle-oculta-receta" data-plantilla="' + p.id + '" aria-label="' + (oculta ? 'Mostrar receta' : 'Ocultar receta') + '"><i data-lucide="eye-off"></i></button>' +
      '</span></div></div>';
  }

  function filaRecetaLista(p, banco, oculta, favorita) {
    var fotoHtml = p.foto ? '<img src="' + escapeHtml(p.foto) + '" alt="" loading="lazy" decoding="async">' : '<div class="rc-fila-foto-vacia"></div>';
    var tag = ETIQUETA_ESFUERZO[p.esfuerzo] || '';
    return '<div class="rc-fila' + (oculta ? ' rc-oculta' : '') + '">' +
      '<button type="button" class="rc-fila-abrir" data-action="abrir-receta-banco" data-plantilla="' + p.id + '">' +
      '<span class="rc-fila-foto">' + fotoHtml + '</span>' +
      '<span class="rc-fila-info"><span class="rc-fila-nombre">' + escapeHtml(nombreEjemplo(p, banco)) + '</span>' +
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
    // solo principales/mixtas son "recetas" navegables — las complementarias
    // (guarnición de arroz, ensalada de tomate...) son piezas internas del
    // ensamblador, no algo que la familia elija/oculte/marque favorito.
    var todas = E.todasLasElaboraciones(banco, estado).filter(function (p) { return p.roles.indexOf('principal') !== -1; });
    var ocultas = estado.ocultas || [];
    var favoritas = estado.favoritas || [];

    var categoriasPresentes = {};
    todas.forEach(function (p) { Object.keys(categoriasDePlantilla(p, banco)).forEach(function (c) { categoriasPresentes[c] = 1; }); });
    var categorias = ORDEN_CATEGORIA.filter(function (c) { return categoriasPresentes[c]; });
    // vegetariana ya filtra de verdad (2026-07-22, UPGRADES §2/§6 punto 8: reutiliza
    // categoriaExcluidaPorDieta/opcionAptaParaDieta, cero dato nuevo). sin-gluten sigue sin dato
    // en el banco (Roger 2026-07-14) — al elegirla ninguna plantilla coincide y se ve el mensaje
    // de "sin resultados" habitual: honesto, no simulado.
    var chips = ['todas', 'rapidas', 'favoritas'].concat(categorias, ['vegetariana', 'sin-gluten']);

    var chipsHtml = chips.map(function (c) {
      var activo = c === filtro;
      var nombre = ETIQUETA_CHIP_ESPECIAL()[c] || ETIQUETAS_CATEGORIA()[c] || capitaliza(c);
      return '<button type="button" class="rc-chip' + (activo ? ' rc-chip-activo' : '') + '" data-action="filtro-receta" data-categoria="' + c + '" aria-pressed="' + activo + '">' + escapeHtml(nombre) + '</button>';
    }).join('');

    var listaFiltrada = todas;
    if (filtro === 'rapidas') listaFiltrada = todas.filter(function (p) { return p.esfuerzo === 'rapido'; });
    else if (filtro === 'favoritas') listaFiltrada = todas.filter(function (p) { return favoritas.indexOf(p.id) !== -1; });
    else if (filtro === 'vegetariana') listaFiltrada = todas.filter(function (p) { return esVegetarianaApta(p, banco); });
    else if (filtro !== 'todas') listaFiltrada = todas.filter(function (p) { return categoriasDePlantilla(p, banco)[filtro]; });
    if (busqueda.trim()) {
      var q = normalizarTexto(busqueda);
      listaFiltrada = listaFiltrada.filter(function (p) { return normalizarTexto(nombreEjemplo(p, banco)).indexOf(q) !== -1; });
    }

    var listaHtml = listaFiltrada.length
      ? (vista === 'list'
        ? '<div class="rc-lista">' + listaFiltrada.map(function (p) { return filaRecetaLista(p, banco, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1); }).join('') + '</div>'
        : '<div class="rc-grid">' + listaFiltrada.map(function (p) { return tarjetaRecetaGrid(p, banco, ocultas.indexOf(p.id) !== -1, favoritas.indexOf(p.id) !== -1); }).join('') + '</div>')
      : '<p class="card-msg">' + t('no_hay_recetas_en_esta_categoria') + '</p>';

    return '<div class="rc-cabecera">' +
      '<h1 class="rc-titulo">' + t('recetas') + '</h1>' +
      '<div class="rc-vista-toggle">' +
      '<button type="button" class="rc-vista-btn' + (vista === 'list' ? ' rc-vista-btn-activo' : '') + '" data-action="recetas-vista" data-vista="list" aria-label="Vista de lista" aria-pressed="' + (vista === 'list') + '"><i data-lucide="list"></i></button>' +
      '<button type="button" class="rc-vista-btn' + (vista === 'grid' ? ' rc-vista-btn-activo' : '') + '" data-action="recetas-vista" data-vista="grid" aria-label="Vista de cuadrícula" aria-pressed="' + (vista === 'grid') + '"><i data-lucide="layout-grid"></i></button>' +
      '</div></div>' +
      '<div class="vista-body rc-body">' +
      '<label class="rc-buscador"><i data-lucide="search"></i>' +
      '<input type="search" id="recetas-buscador" placeholder="' + t('buscar_plato_o_ingrediente') + '" value="' + escapeHtml(busqueda) + '"></label>' +
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
    var plantilla = E.elaboracionPorId(banco, estado, plantillaId);
    if (!plantilla) {
      return '<button type="button" class="rv-flotante rv-volver" data-action="receta-volver" aria-label="Volver"><i data-lucide="arrow-left"></i></button>' +
        '<div class="rv-body rv-body-vacia"><p class="card-msg">No encontramos esta receta.</p></div>';
    }
    // Sin día ni familia detrás: E.previsualizarElaboracion resuelve nombre/pasos
    // con la 1ª opción del eje paramétrico (si tiene) — sin kcal/gramos reales
    // (no hay mesa real que calcular; el motor los da al ensamblar de verdad).
    var previa = previsualizar(plantilla, banco);
    var nombreSplit = splitNombrePlato(previa.nombre);
    var esCena = !!(plantilla.apta && plantilla.apta.indexOf('comida') === -1);
    var tag = ETIQUETA_ESFUERZO[plantilla.esfuerzo] || '—';
    var favorita = (estado.favoritas || []).indexOf(plantilla.id) !== -1;
    var oculta = (estado.ocultas || []).indexOf(plantilla.id) !== -1;
    var fotoHtml = plantilla.foto ? '<img src="' + escapeHtml(plantilla.foto) + '" alt="">' : '<div class="rv-foto-vacia"></div>';
    var variantes = variantesTexto(plantilla, banco);
    var acompText = previa.complementariasEjemplo.length
      ? 'Se completa con ' + previa.complementariasEjemplo.map(function (c) { return c.nombre.toLowerCase(); }).join(' y ') + '.'
      : '';

    var pasosHtml = previa.pasos.length
      ? '<div class="rv-pasos">' + pasosCards(previa.pasos) + '</div>'
      : '<p class="card-msg">Sin pasos detallados para esta receta.</p>';
    // Pasos de cada complementaria de ejemplo, mismo patrón que renderVistaReceta (Roger
    // 2026-07-23) — sin esto la preparación de hidrato/verdura desaparecía sin rastro.
    var complementariasPasosHtml = previa.complementariasEjemplo.map(function (c) {
      return c.pasos && c.pasos.length
        ? '<p class="detalle-subtitulo" style="margin-top:18px">' + escapeHtml(c.nombre) + '</p>' +
          '<div class="rv-pasos">' + pasosCards(c.pasos) + '</div>'
        : '';
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
      '<div class="rv-stat"><i data-lucide="leaf"></i><span class="rv-stat-valor">' + tag + '</span></div>' +
      '</div>' +
      (acompText ? '<p class="rv-variantes"><i data-lucide="info"></i>' + escapeHtml(acompText) + '</p>' : '') +
      (variantes ? '<p class="rv-variantes"><i data-lucide="shuffle"></i>' + escapeHtml(capitaliza(variantes)) + '</p>' : '') +
      '<p class="rv-seccion-titulo">' + t('preparacion') + '</p>' +
      pasosHtml +
      complementariasPasosHtml +
      '</div>';
  }

  // Carne/Pescado/Frutas y verduras/Despensa/Frío (Roger 2026-07-19, ampliado 2026-07-22 a
  // petición de Roger: "frescos" único no reflejaba cómo se compra de verdad — carnicería,
  // pescadería y frutería son secciones/tiendas distintas). Taxonomía de conservación+tienda, no
  // la nutricional real de categoriasDePlantilla — deliberadamente distinta, es cómo se compra, no
  // cómo se cuenta la cuota. Solo agrupa la MISMA lista real (E.listaCompra); "Semana que viene"
  // (3er segmento) se retira de esta pantalla por decisión de Roger 2026-07-19, pero
  // estado.compra.marcadosSiguiente y generarPlanSiguiente() no se tocan.
  // 'otros' (Roger 2026-07-23: antes 'despensa' — colisionaba de nombre con la despensa REAL
  // de abajo, el checklist "¿lo tengo en casa?". Estos sí son cantidad real a comprar
  // (legumbre/cereal/tubérculo sueltos, ej. lentejas/arroz/patata), no un recordatorio).
  var GRUPO_COMPRA = {
    'carne-blanca': 'carne', 'carne-roja': 'carne',
    'pescado-blanco': 'pescado', 'pescado-azul': 'pescado', marisco: 'pescado',
    verdura: 'verdura', fruta: 'verdura',
    legumbre: 'otros', cereal: 'otros', tuberculo: 'otros', otro: 'otros',
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

  function renderCompraVista(estado, plan, banco, rango, categoriasAbiertas) {
    categoriasAbiertas = categoriasAbiertas || {};
    rango = rango === 'hoy' ? 'hoy' : '7d';
    if (!plan) {
      return '<div class="rc-cabecera"><h1 class="rc-titulo">Compra</h1></div>' +
        '<div class="vista-body rc-body"><p class="card-msg">Todavía no hay semana generada.</p></div>';
    }
    // Pasadas las 16h, "Compra hoy" ya no necesita ingredientes de comida (Roger 2026-07-22) —
    // mismo umbral que comidaProximaPorHora (app.js) y saludoHora (arriba), real reloj del navegador.
    var soloCena = rango === 'hoy' && new Date().getHours() >= 16;
    var todosLosItems = E.listaCompra(estado, plan, rango === 'hoy' ? 'hoy' : 'semana', banco, null, soloCena);
    // Despensa real (Roger 2026-07-23): categoria==='despensa' son los staples + ingrediente
    // base (aceite, sal, mayonesa, cebolla, leche...) — gramos siempre null, "¿lo tengo en
    // casa?", NO cantidad real a comprar. Fuera del contador de pendientes y de los grupos de
    // arriba; van en su propia sección desplegable al final (no son lo mismo que lentejas/
    // arroz/patata sueltos, que SÍ son compra real aunque compartieran nombre de grupo antes).
    var itemsDespensa = todosLosItems.filter(function (i) { return i.categoria === 'despensa'; });
    var items = todosLosItems.filter(function (i) { return i.categoria !== 'despensa'; });
    var marcadosN = items.filter(function (i) { return i.marcado; }).length;
    var pct = items.length ? Math.round(marcadosN / items.length * 100) : 0;

    var porGrupo = {};
    items.forEach(function (item) {
      var g = GRUPO_COMPRA[item.categoria] || 'otros';
      if (!porGrupo[g]) porGrupo[g] = [];
      porGrupo[g].push(item);
    });

    // categoría completa = colapsa a una línea (progreso visible sin barra de progreso,
    // Roger 2026-07-26) — pero SIEMPRE reabrible, un check puede haber sido un error y
    // sin forma de reabrir ese ingrediente queda inalcanzable. No persistido (mismo
    // criterio que rangoCompra/filtroRecetas): al recargar vuelve a estar plegada, que
    // es lo correcto porque el estado real es "completa".
    var gruposHtml = ORDEN_GRUPO_COMPRA.filter(function (g) { return porGrupo[g] && porGrupo[g].length; }).map(function (g) {
      var info = GRUPOS_COMPRA_INFO[g];
      var lista = porGrupo[g];
      var completo = lista.every(function (i) { return i.marcado; });
      var abierto = !completo || !!categoriasAbiertas[g];
      var cabecera = completo
        ? '<button type="button" class="cp-grupo-titulo cp-grupo-completo" data-action="toggle-categoria-compra" data-grupo="' + g + '" aria-expanded="' + abierto + '">' +
          '<i data-lucide="' + info.icono + '"></i>' + info.nombre +
          '<span class="cp-grupo-estado">' + t('completo') + '<i data-lucide="chevron-' + (abierto ? 'up' : 'down') + '"></i></span>' +
          '</button>'
        : '<p class="cp-grupo-titulo"><i data-lucide="' + info.icono + '"></i>' + info.nombre + '</p>';
      return '<div class="cp-grupo' + (completo ? ' cp-grupo-completo-wrap' : '') + '">' + cabecera +
        (abierto ? '<div class="cp-lista"><ul class="lista-check">' + lista.map(filaCompraHtml).join('') + '</ul></div>' : '') +
        '</div>';
    }).join('');

    var despensaHtml = itemsDespensa.length ? '<details class="cp-despensa">' +
      '<summary>Revisa si te falta algo de despensa</summary>' +
      '<div class="cp-lista"><ul class="lista-check">' + itemsDespensa.map(filaCompraHtml).join('') + '</ul></div>' +
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
  // Sheet: cambiar plato (elegir otro / nevera) — lenguaje visual v3
  // (Roger 2026-07-19/20, handoff e3Foods.dc.html ~L541-554, tarea #18)
  // ---------------------------------------------------------------
  // 3 opciones (borrador §6, última hora): (a) otro menú completo — el motor
  // reensambla directo, sin lista de 40 platos que navegar a mano (antes
  // "elegir otro" abría el recetario entero; el ensamblador ya rankea, así
  // que un solo botón que reensambla es MENOS mandos, no más); (b) nevera —
  // ahora con hasta 3 opciones nativas; (c) solo el acompañamiento — mantiene
  // el principal, cambia hidrato/verdura.
  function renderSheetCambiarInicio(estado, banco, dia, tipoComida) {
    return sheetHead('Cambiar ' + (tipoComida === 'comida' ? 'comida' : 'cena')) +
      '<div class="sheet-body">' +
      '<p class="card-msg">' + t('que_cambiamos') + '</p>' +
      '<button type="button" class="sheet-fila-opcion" data-action="modo-otro-menu" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
      '<span class="sheet-fila-opcion-icono sheet-fila-opcion-icono-gold"><i data-lucide="shuffle"></i></span>' +
      '<span class="sheet-fila-opcion-texto"><span class="sheet-fila-opcion-titulo">' + t('otro_menu') + '</span><span class="sheet-fila-opcion-sub">' + t('un_menu_completo_distinto') + '</span></span>' +
      '<i data-lucide="chevron-right" class="sheet-fila-opcion-chevron"></i>' +
      '</button>' +
      '<button type="button" class="sheet-fila-opcion" data-action="modo-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
      '<span class="sheet-fila-opcion-icono sheet-fila-opcion-icono-azul"><i data-lucide="refrigerator"></i></span>' +
      '<span class="sheet-fila-opcion-texto"><span class="sheet-fila-opcion-titulo">' + t('con_lo_que_hay_en_la_nevera') + '</span><span class="sheet-fila-opcion-sub">Recetas con lo de tu nevera</span></span>' +
      '<i data-lucide="chevron-right" class="sheet-fila-opcion-chevron"></i>' +
      '</button>' +
      '<button type="button" class="sheet-fila-opcion" data-action="modo-solo-complementaria" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
      '<span class="sheet-fila-opcion-icono sheet-fila-opcion-icono-gold"><i data-lucide="salad"></i></span>' +
      '<span class="sheet-fila-opcion-texto"><span class="sheet-fila-opcion-titulo">' + t('cambiar_solo_el_acompanamiento') + '</span><span class="sheet-fila-opcion-sub">' + t('mismo_plato_principal_otra_guarnicion') + '</span></span>' +
      '<i data-lucide="chevron-right" class="sheet-fila-opcion-chevron"></i>' +
      '</button>' +
      '</div>';
  }

  function renderNevera(estado, banco, dia, tipoComida) {
    var filas = idsIngredientesOrdenados(banco).map(function (id) {
      var ing = banco.ingredientes[id];
      return '<li data-buscar="' + escapeHtml(normalizarTexto(ing.nombre)) + '"><label class="fila-nevera"><input type="checkbox" value="' + id + '" data-nombre="' + escapeHtml(ing.nombre) + '"> ' + escapeHtml(ing.nombre) + '</label></li>';
    }).join('');
    var micHtml = TIENE_VOZ
      ? '<button type="button" class="btn-filtro-icono btn-mic" data-action="nevera-voz" aria-label="Buscar por voz"><i data-lucide="mic"></i></button>'
      : '';
    return sheetHead(t('con_lo_que_hay_en_la_nevera')) +
      '<div class="sheet-body">' +
      '<p class="card-msg">' + t('marca_lo_que_tienes_en_casa_y_buscamos_un') + '</p>' +
      '<div class="nevera-top">' +
      '<div class="nevera-buscador-fila">' +
      '<label class="rc-buscador"><i data-lucide="search"></i>' +
      '<input type="search" id="nevera-buscador" placeholder="' + t('buscar_ingrediente') + '" autocomplete="off"></label>' +
      micHtml +
      '</div>' +
      '<div class="nevera-seleccion" id="nevera-seleccion" hidden></div>' +
      '<button type="button" class="btn-cta-gradiente" id="nevera-confirmar" data-action="confirmar-nevera" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' + t('buscar_plato') + '</button>' +
      '</div>' +
      '<ul class="lista-nevera" id="lista-nevera-checks">' + filas + '</ul>' +
      '</div>';
  }

  // Resultado del modo nevera — HASTA 3 opciones nativas (borrador §6, última
  // hora: "la nevera enseña, no decide"). Cada opción es un menú completo ya
  // resuelto; si le falta exactamente 1 ingrediente de los marcados como
  // disponibles, aviso + CTA para añadirlo a la compra en vez de descartarla.
  function renderOpcionesNevera(banco, opciones, dia, tipoComida) {
    if (!opciones || !opciones.length) {
      return sheetHead(t('con_lo_que_hay_en_la_nevera')) +
        '<div class="sheet-body"><p class="card-msg">No encontramos ningún menú que se pueda montar con eso — prueba a marcar algún ingrediente más.</p></div>';
    }
    var filas = opciones.map(function (m, i) {
      var subtitulo = (m.complementariasResueltas || []).map(function (c) { return c.nombre; }).join(' · ');
      var nombreFalta = m.faltaIngrediente && banco.ingredientes[m.faltaIngrediente] ? banco.ingredientes[m.faltaIngrediente].nombre : m.faltaIngrediente;
      var avisoHtml = m.faltaIngrediente
        ? '<p class="fila-opcion-nevera-aviso"><i data-lucide="alert-circle"></i>Te falta ' + escapeHtml(nombreFalta) + ' — <button type="button" class="ingrediente-link" data-action="nevera-anadir-compra" data-id="' + m.faltaIngrediente + '">¿lo añado a la compra?</button></p>'
        : '';
      return '<li><button type="button" class="fila-opcion-nevera" data-action="elegir-opcion-nevera" data-idx="' + i + '" data-dia="' + dia + '" data-tipo="' + tipoComida + '">' +
        '<span class="fila-opcion-nevera-nombre">' + escapeHtml(m.nombre) + '</span>' +
        (subtitulo ? '<span class="fila-opcion-nevera-sub">' + escapeHtml(subtitulo) + '</span>' : '') +
        '</button>' + avisoHtml + '</li>';
    }).join('');
    return sheetHead('Elige un menú') +
      '<div class="sheet-body"><ul class="lista-opciones-nevera">' + filas + '</ul></div>';
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

  // PASO 1 — nombre de familia. Una sola pregunta, una sola respuesta.
  function renderOnbNombreFamilia(nombreFamilia, familiaRegion) {
    var listo = !!(nombreFamilia || '').trim();
    return '<div class="onb-scroll"><div class="onb-nombre">' +
      '<p class="onb-saludo">¡Bienvenidos!</p>' +
      '<h1 class="onb-titular">Quiero conoceros.<br>¿Cómo os llamáis?</h1>' +
      '<label class="onb-campo-linea"><span class="onb-eyebrow">Nombre de familia</span>' +
        '<input type="text" id="onb-nombre-familia" class="onb-input-serif" maxlength="40" placeholder="p.ej. Los Fernández" value="' + escapeHtml(nombreFamilia || '') + '" autocomplete="off"></label>' +
      '<label class="onb-campo-linea"><span class="onb-eyebrow">¿De dónde sois? (opcional)</span>' +
        '<span class="onb-select-wrap"><select id="onb-region" class="onb-input-select">' + opcionesRegion(familiaRegion) + '</select>' +
        '<i data-lucide="chevron-down" aria-hidden="true"></i></span></label>' +
      '<button type="button" class="onb-cta onb-cta-oro' + (listo ? '' : ' onb-cta-off') + '" id="onb-cta-familia" data-action="onb-familia-siguiente"' + (listo ? '' : ' aria-disabled="true"') + '>Siguiente</button>' +
      '<button type="button" class="onb-enlace" data-action="landing-unirse">¿Ya tienes un código de familia?</button>' +
      '<button type="button" class="onb-enlace" data-action="ver-demo">O mira un ejemplo primero</button>' +
      '</div></div>';
  }

  // PASOS 2-6 — asistente de UNA persona. Estructura fija cabecera / contenido
  // scrollable / pie, con la línea de avance continua arriba (no son pasos
  // clicables: solo se avanza con "Siguiente" y se vuelve con la flecha).
  var PASOS_PERSONA = ['Básicos', 'Estilo de vida', 'Alergias e intolerancias', 'Gustos', 'Comidas de la semana'];

  function pasoPersonaValido(paso, draft) {
    if (paso === 1) return !!(draft.nombre || '').trim();
    if (paso === 2) return !!draft.estilo;
    return true;
  }

  function cabeceraPersona(paso, draft, numeroPersona) {
    var avance = ((paso - 1) / 5 * 100) + '%';
    var foto = fotoSegura(draft.foto);
    return '<div class="onb-cab">' +
      '<div class="onb-avance"><span class="onb-avance-fill" style="width:' + avance + '"></span></div>' +
      '<div class="onb-cab-fila">' +
        '<button type="button" class="onb-atras" data-action="onb-persona-atras" aria-label="Volver al paso anterior"><i data-lucide="arrow-left"></i></button>' +
        '<div class="onb-cab-txt">' +
          '<span class="onb-cab-kicker">Persona ' + numeroPersona + ' · paso ' + paso + ' de 5</span>' +
          '<span class="onb-cab-paso">' + escapeHtml(PASOS_PERSONA[paso - 1]) + '</span>' +
        '</div>' +
        '<span class="onb-cab-avatar"' + (foto ? ' style="background-image:url(\'' + foto + '\')"' : '') + '>' +
          (foto ? '' : escapeHtml(iniciales(draft.nombre))) + '</span>' +
      '</div></div>';
  }

  function cuerpoPasoPersona(paso, draft) {
    if (paso === 1) {
      var foto1 = fotoSegura(draft.foto);
      return '<h2 class="onb-h2">¿Quién es?</h2>' +
        '<p class="onb-sub">Con esto ajustamos las raciones y la energía de sus menús.</p>' +
        '<div class="onb-foto-bloque">' +
          '<button type="button" class="onb-foto" data-action="persona-foto" aria-label="' + (foto1 ? 'Cambiar foto' : 'Añadir foto') + '"' +
            (foto1 ? ' style="background-image:url(\'' + foto1 + '\')"' : '') + '>' +
            (foto1 ? '' : '<span class="onb-foto-inicial">' + escapeHtml(iniciales(draft.nombre)) + '</span>') +
            '<span class="onb-foto-badge" aria-hidden="true"><i data-lucide="camera"></i></span>' +
          '</button>' +
          '<input type="file" id="onb-foto-input" accept="image/*" hidden>' +
          (foto1
            ? '<button type="button" class="onb-foto-txt onb-foto-quitar" data-action="persona-foto-quitar">Quitar foto</button>'
            : '<span class="onb-foto-txt">Añadir foto (opcional)</span>') +
        '</div>' +
        '<label class="onb-campo"><span class="onb-eyebrow">Nombre</span>' +
          '<input type="text" class="onb-input" data-persona-campo="nombre" maxlength="30" placeholder="Escribe su nombre" value="' + escapeHtml(draft.nombre || '') + '" autocomplete="off"></label>' +
        '<label class="onb-campo"><span class="onb-eyebrow">' + t('ano_de_nacimiento') + '</span>' +
          '<input type="number" inputmode="numeric" class="onb-input" data-persona-campo="anioNacimiento" min="1920" max="' + new Date().getFullYear() + '" placeholder="p. ej. 1985" value="' + (draft.anioNacimiento || '') + '"></label>' +
        avisoInfo(TEXTO_AVISO_MEDIDAS) +
        '<div class="onb-campo"><span class="onb-eyebrow">Sexo</span>' + pildorasPersona('sexo', OPCIONES_SEXO, draft.sexo || 'mujer') + '</div>' +
        '<div class="onb-fila-2">' +
          '<label class="onb-campo"><span class="onb-eyebrow">Altura (cm)</span>' +
            '<input type="number" inputmode="numeric" class="onb-input" data-persona-campo="altura" min="30" max="230" placeholder="—" value="' + (draft.altura || '') + '"></label>' +
          '<label class="onb-campo"><span class="onb-eyebrow">Peso (kg)</span>' +
            '<input type="number" inputmode="numeric" class="onb-input" data-persona-campo="peso" min="1" max="200" placeholder="—" value="' + (draft.peso || '') + '"></label>' +
        '</div>' +
        '<div class="onb-campo"><span class="onb-eyebrow">Nivel de actividad</span>' +
          pildorasPersona('actividad', OPCIONES_ACTIVIDAD, draft.actividad || 'media') +
          '<p class="onb-ayuda">' + escapeHtml(AYUDA_ACTIVIDAD[draft.actividad || 'media']) + '</p></div>' +
        '<div class="onb-campo"><span class="onb-eyebrow">Objetivo de peso</span>' +
          pildorasPersona('objetivo', OPCIONES_OBJETIVO_PERSONA, draft.objetivo || 'mantenimiento') + '</div>';
    }
    if (paso === 2) {
      return '<h2 class="onb-h2">¿Cómo come?</h2>' +
        '<p class="onb-sub">Elige una. Es la base sobre la que construimos todos sus platos.</p>' +
        tarjetasPersona('estilo', ESTILOS_VIDA, draft.estilo) +
        (draft.estilo === 'sin-cerdo'
          ? avisoInfo('Excluimos cerdo y derivados (jamón, embutidos, manteca). No podemos garantizar certificación halal.')
          : '');
    }
    if (paso === 3) {
      return '<span class="onb-chip-seguridad"><i data-lucide="shield-check"></i>Seguridad</span>' +
        '<h2 class="onb-h2">¿Hay algo que no puede comer?</h2>' +
        // El handoff prometía aquí "no aparecerá nunca en sus menús". El motor v3
        // todavía no consume `alergias` (lo hará dietas.js): la exclusión dura de
        // hoy son los vetos por ingrediente de la ficha. Copy ajustado para no
        // prometer una garantía que el motor aún no da — restaurar la frase del
        // handoff el día que dietas.js entre en el motor.
        '<p class="onb-sub">Lo apuntamos en su ficha y lo tenemos en cuenta al montar sus menús. Marca todo lo que aplique.</p>' +
        listaAlergias(draft.alergias, true) +
        '<div class="onb-aviso-rojo">' +
          '<span class="onb-aviso-rojo-ico"><i data-lucide="alert-triangle"></i></span>' +
          '<div><p class="onb-aviso-rojo-tit">Revisad siempre las etiquetas</p>' +
          '<p class="onb-aviso-rojo-txt">Esto excluye ingredientes de sus menús, pero la app no controla vuestra compra ni las trazas de los productos.</p></div>' +
        '</div>' +
        '<button type="button" class="onb-btn-linea" data-action="persona-sin-alergias">No tiene ninguna alergia</button>';
    }
    if (paso === 4) {
      return '<h2 class="onb-h2">¿Qué le encanta y qué no?</h2>' +
        '<p class="onb-sub">Toca una vez para <b class="onb-oro">me encanta</b>, dos para <b>mejor no</b>. Esto se puede cambiar cuando quieras.</p>' +
        '<div class="onb-aviso-oro"><span class="onb-aviso-oro-ico"><i data-lucide="sparkles"></i></span>' +
          '<span>Esto no es una alergia: los usaremos menos, pero pueden aparecer alguna vez.</span></div>' +
        GUSTOS_GRUPOS.map(function (g) {
          return '<p class="onb-eyebrow onb-eyebrow-grupo">' + escapeHtml(g.titulo) + '</p>' + chipsGustos(draft.gustos, g.items);
        }).join('') +
        '<div class="onb-leyenda">' +
          '<span><span class="onb-leyenda-caja onb-leyenda-si"></span>Me encanta</span>' +
          '<span><span class="onb-leyenda-caja onb-leyenda-no"></span>Mejor no</span>' +
        '</div>';
    }
    return '<h2 class="onb-h2">¿Cómo son sus comidas?</h2>' +
      '<p class="onb-sub">Así montamos el plato a su medida y planificamos solo los servicios que hace en casa.</p>' +
      '<p class="onb-eyebrow onb-eyebrow-grupo"><i data-lucide="sun" class="onb-eyebrow-ico onb-ico-oro"></i>Su comida típica</p>' +
      tarjetasPersona('pComida', PATRONES_COMIDA, draft.pComida || 'primero-segundo') +
      '<p class="onb-eyebrow onb-eyebrow-grupo"><i data-lucide="moon" class="onb-eyebrow-ico"></i>Su cena típica</p>' +
      tarjetasPersona('pCena', PATRONES_CENA, draft.pCena || 'ligera') +
      '<div class="onb-tarjeta-servicios">' +
        '<p class="onb-servicios-tit">¿Qué días come en casa?</p>' +
        '<p class="onb-servicios-sub">Vienen todos marcados. Desmarca los servicios que normalmente no hace en casa.</p>' +
        gridServicios(draft) +
        '<div class="onb-atajos">' +
          '<button type="button" class="onb-atajo" data-action="persona-servicios-preset" data-preset="comidas-lv">Come fuera L-V</button>' +
          '<button type="button" class="onb-atajo" data-action="persona-servicios-preset" data-preset="finde">Fines de semana fuera</button>' +
          '<button type="button" class="onb-atajo" data-action="persona-servicios-preset" data-preset="todo">Marcar todo</button>' +
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
          (valido ? '' : ' aria-disabled="true"') + '>Siguiente<i data-lucide="arrow-right"></i></button>' +
        (paso === 4 ? '<button type="button" class="onb-enlace onb-enlace-pie" data-action="onb-persona-siguiente">Ahora no, seguir</button>' : '') +
      '</div>';
  }

  // PASO 7 — ficha completa de la persona recién descrita: los 5 bloques
  // resumidos, con "Editar" que salta al paso correspondiente conservando lo
  // introducido, y la decisión de si viene otra persona o ya estamos todos.
  var BLOQUES_FICHA = [
    { clave: 'basicos', titulo: 'Básicos', icono: 'user', tono: 'mid', paso: 1 },
    { clave: 'estilo', titulo: 'Estilo de vida', icono: 'salad', tono: 'oro', paso: 2 },
    { clave: 'alergias', titulo: 'Alergias e intolerancias', icono: 'shield-check', tono: 'rojo', paso: 3 },
    { clave: 'gustos', titulo: 'Gustos', icono: 'heart', tono: 'oro', paso: 4 },
    { clave: 'comidas', titulo: 'Comidas de la semana', icono: 'calendar-check', tono: 'mid', paso: 5 }
  ];

  function renderOnbFicha(draft, miembros) {
    var resumen = resumenPersona(draft);
    var foto = fotoSegura(draft.foto);
    var tarjetas = BLOQUES_FICHA.map(function (b) {
      return '<div class="onb-resumen' + (b.tono === 'rojo' ? ' onb-resumen-alerta' : '') + '">' +
        '<div class="onb-resumen-cab">' +
          '<span class="per-sec-ico per-sec-ico-' + b.tono + '"><i data-lucide="' + b.icono + '"></i></span>' +
          '<span class="onb-resumen-tit">' + escapeHtml(b.titulo) + '</span>' +
          '<button type="button" class="onb-editar" data-action="onb-ficha-editar" data-paso="' + b.paso + '">' +
            '<i data-lucide="pencil"></i>Editar</button>' +
        '</div>' +
        '<p class="onb-resumen-txt">' + escapeHtml(resumen[b.clave]) + '</p>' +
        '</div>';
    }).join('');

    var chipsMiembros = miembros.length
      ? '<div class="onb-yaestan"><p class="onb-eyebrow">Ya en la familia</p><div class="onb-yaestan-chips">' +
          miembros.map(function (m, i) {
            return '<span class="onb-miembro-chip">' +
              '<span class="onb-miembro-av" style="background-color:' + colorMiembro(i) + '">' + escapeHtml(iniciales(m.nombre)) + '</span>' +
              '<span>' + escapeHtml(m.nombre) + '</span>' +
              '<button type="button" class="onb-miembro-quitar" data-action="onb-quitar-miembro" data-id="' + m.id + '" aria-label="Quitar a ' + escapeHtml(m.nombre) + '"><i data-lucide="x"></i></button>' +
              '</span>';
          }).join('') + '</div></div>'
      : '';

    return '<div class="onb-scroll"><div class="onb-ficha">' +
      '<div class="onb-ficha-cab">' +
        '<span class="onb-ficha-av"' + (foto ? ' style="background-image:url(\'' + foto + '\')"' : '') + '>' + (foto ? '' : escapeHtml(iniciales(draft.nombre))) + '</span>' +
        '<div><p class="onb-ficha-kicker">Ficha completa</p>' +
        '<h1 class="onb-ficha-nombre">' + escapeHtml((draft.nombre || '').trim() || 'Esta persona') + '</h1></div>' +
      '</div>' +
      '<div class="onb-resumenes">' + tarjetas + '</div>' +
      chipsMiembros +
      '<p class="onb-legal">Planificamos menús, no pautas médicas. Ante una condición médica grave, consultad con vuestro médico.</p>' +
      '<button type="button" class="onb-btn-otra" data-action="onb-anadir-otra"><i data-lucide="user-plus"></i>Añadir otra persona</button>' +
      '<button type="button" class="onb-cta onb-cta-oro" data-action="onb-terminar">Ya estamos todos<i data-lucide="arrow-right"></i></button>' +
      '</div></div>';
  }

  // PASO 8 — cierre. Peak-end rule (UI_MOBILE §1): es el momento que la familia
  // recuerda, junto con la portada.
  function renderOnbFin(nombreFamilia, miembros) {
    var primero = (miembros[0] && miembros[0].nombre) || '';
    var raciones = miembros.length + (miembros.length === 1 ? ' persona' : ' personas');
    return '<div class="onb-fin">' +
      '<span class="onb-fin-check"><i data-lucide="check"></i></span>' +
      '<h1 class="onb-fin-tit">¡Listo' + (primero ? ', ' + escapeHtml(primero) : '') + '!</h1>' +
      '<p class="onb-fin-sub">' + escapeHtml((nombreFamilia || '').trim() || 'Tu familia') + ' ya tiene su primera semana lista para ' + raciones + '.</p>' +
      '<button type="button" class="onb-cta onb-cta-oro" data-action="onb-ver-semana">Ver mi semana<i data-lucide="arrow-right"></i></button>' +
      '</div>';
  }

  // Vetos por ingrediente — el ÚNICO mecanismo de exclusión dura que el motor v3
  // consume hoy (engine.vetosDe). El handoff no lo dibuja porque su prototipo no
  // tenía banco detrás; se conserva dentro del bloque Alergias de la ficha, que
  // es su sitio semántico, para que el rediseño no deje a una familia con
  // alergia real sin la herramienta que sí funciona. Cuando dietas.js entre en
  // el motor, este grid es lo primero que puede desaparecer.
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
        '<span class="per-sec-txt"><span class="per-sec-tit">' + escapeHtml(b.titulo) + '</span>' +
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
           '<input type="number" inputmode="numeric" class="per-input" data-persona-campo="anioNacimiento" min="1920" max="' + anioActual + '" placeholder="p. ej. 1985" value="' + (draft.anioNacimiento || '') + '"></label>' +
         avisoInfo(TEXTO_AVISO_MEDIDAS) +
         '<div class="per-campo"><span class="onb-eyebrow">Sexo</span>' + pildorasPersona('sexo', OPCIONES_SEXO, draft.sexo || 'mujer') + '</div>' +
         '<div class="onb-fila-2">' +
           '<label class="per-campo"><span class="onb-eyebrow">Altura (cm)</span>' +
             '<input type="number" inputmode="numeric" class="per-input" data-persona-campo="altura" min="30" max="230" placeholder="—" value="' + (draft.altura || '') + '"></label>' +
           '<label class="per-campo"><span class="onb-eyebrow">Peso (kg)</span>' +
             '<input type="number" inputmode="numeric" class="per-input" data-persona-campo="peso" min="1" max="200" placeholder="—" value="' + (draft.peso || '') + '"></label>' +
         '</div>' +
         '<div class="per-campo"><span class="onb-eyebrow">Nivel de actividad</span>' +
           pildorasPersona('actividad', OPCIONES_ACTIVIDAD, draft.actividad || 'media') + '</div>' +
         '<div class="per-campo"><span class="onb-eyebrow">Objetivo de peso</span>' +
           pildorasPersona('objetivo', OPCIONES_OBJETIVO_PERSONA, draft.objetivo || 'mantenimiento') + '</div>',
      2: tarjetasPersona('estilo', ESTILOS_VIDA, estiloDeMiembro(draft)),
      3: listaAlergias(draft.alergias, false) +
         '<label class="per-campo"><span class="onb-eyebrow">Otras restricciones</span>' +
           '<input type="text" class="per-input" data-persona-campo="restricciones" maxlength="80" placeholder="' + t('ninguna') + '" value="' + escapeHtml(draft.restricciones || '') + '"></label>' +
         '<p class="onb-eyebrow onb-eyebrow-grupo">Ingredientes que nunca entran</p>' +
         '<p class="per-nota">Lo único que el motor excluye hoy plato a plato. Lo de arriba queda en su ficha.</p>' +
         (draft.id ? renderVetos(draft, banco) : '<p class="per-nota">Se podrán marcar en cuanto guardes la ficha.</p>'),
      4: '<p class="per-nota">Toca una vez para <b class="onb-oro">me encanta</b>, dos para <b>mejor no</b>.</p>' +
         GUSTOS_GRUPOS.map(function (g) {
           return '<p class="onb-eyebrow onb-eyebrow-grupo">' + escapeHtml(g.titulo) + '</p>' + chipsGustos(draft.gustos, g.items);
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
  function renderMenuHamburguesa() {
    return '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-ir-familia"><i data-lucide="users"></i>' + t('familia') + '</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-ir-batch"><i data-lucide="chef-hat"></i>' + t('domingo_de_batch') + '</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-sync"><i data-lucide="refresh-cw"></i>' + t('sincronizar_familia') + '</button>' +
      '<div class="menu-dropdown-sep" role="separator"></div>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-regenerar-semana"><i data-lucide="sparkles"></i>Regenerar menús</button>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-importar-cole"><i data-lucide="paperclip"></i>Importar menú del cole</button>' +
      '<div class="menu-dropdown-sep" role="separator"></div>' +
      '<button type="button" class="menu-dropdown-item" role="menuitem" data-action="menu-ir-idioma"><i data-lucide="languages"></i>' + t('idioma_titulo') + '</button>';
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
    return '<div class="rc-cabecera"><div><h1 class="rc-titulo">' + t('descubrir') + '</h1><p class="cp-resumen">' + t('ideas_nuevas_para_tu_familia') + '</p></div></div>' +
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
        ? (alergias.length === 1 ? ETIQUETA_ALERGIA[alergias[0]] : alergias.length + ' alergias')
        : (restriccion && restriccion.toLowerCase() !== 'ninguna' ? restriccion : '');
      return '<div class="rc-tarjeta pf-tarjeta">' +
        '<button type="button" class="rc-tarjeta-abrir" data-action="abrir-miembro-ficha" data-id="' + m.id + '">' +
        '<span class="rc-tarjeta-foto pf-tarjeta-foto" ' + avatarEstiloColor(m, colorMiembro(idx)) + '>' +
        (avatarInner(m) ? '<span class="pf-tarjeta-inicial">' + avatarInner(m) + '</span>' : '') +
        (alerta ? '<span class="rc-tarjeta-tag pf-tarjeta-tag-alergia">' + escapeHtml(alerta) + '</span>' : '') +
        '</span>' +
        '<span class="rc-tarjeta-info"><span class="rc-tarjeta-nombre">' + escapeHtml(m.nombre) + '</span></span>' +
        '</button>' +
        '<div class="rc-tarjeta-pie pf-tarjeta-pie"><span class="rc-tarjeta-meta"><i data-lucide="leaf"></i>' + escapeHtml(ETIQUETA_ESTILO[estiloDeMiembro(m)]) + '</span></div>' +
        '</div>';
    }).join('');
    // celda de la cuadrícula, no barra a lo ancho — así no se descuadra con nº impar de miembros
    var anadirHtml = '<button type="button" class="pf-anadir-celda" data-action="familia-abrir-form-miembro">' +
      '<span class="pf-anadir-circulo"><i data-lucide="plus"></i></span>' + t('anadir_miembro') + '</button>';

    return '<div class="rc-cabecera"><div><h1 class="rc-titulo">' + t('familia') + '</h1><p class="cp-resumen">' + t('personaliza_el_menu_para_cada_uno') + '</p></div></div>' +
      '<div class="vista-body rc-body">' +
      '<div class="rc-grid pf-grid">' + cardsHtml + anadirHtml + '</div>' +
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
    renderNevera: renderNevera,
    renderOpcionesNevera: renderOpcionesNevera,
    renderConfirmarRegenerar: renderConfirmarRegenerar,
    renderVistaMiembro: renderVistaMiembro,
    renderMenuHamburguesa: renderMenuHamburguesa,
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
    normalizarTexto: normalizarTexto
  };
})(typeof window !== 'undefined' ? window : this);
