/* ============================================================
   e3Foods — app.js
   Init, estado (localStorage), routing de pestañas y wiring de eventos
   (delegación por data-action). ui.js solo construye HTML; aquí se
   decide qué pasa cuando el usuario toca algo.
   ============================================================ */
(function () {
  'use strict';

  var E = window.E3Engine;
  var UI = window.E3UI;
  var STORAGE_KEY = 'e3foods_v2';
  var PATRON_DEFAULT = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa'];

  // El banco real (data/recetas.js) se carga siempre antes que este script. Si
  // falta (404, error de sintaxis tras una edición), fallar VISIBLE en vez de
  // arrancar degradado en silencio — antes había un mini-banco de desarrollo
  // aquí que enmascaraba justo ese fallo de despliegue.
  var BANCO = window.E3_RECETAS;
  if (!BANCO) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.innerHTML = '<div style="padding:32px 24px;font-family:sans-serif;max-width:480px;margin:0 auto">' +
        '<h1 style="font-size:20px;margin-bottom:12px">No se pudo cargar el banco de recetas</h1>' +
        '<p>Recarga la página. Si el problema sigue, es un fallo del despliegue (data/recetas.js no responde).</p></div>';
    });
    return;
  }

  // ---------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------
  function estadoVacio() {
    return { nombreFamilia: '', familiaRegion: null, familia: [], ausenciasPuntuales: {}, plan: null, planSiguiente: null, ocultas: [], favoritas: [], propias: [], compra: { marcados: [], marcadosSiguiente: [] }, valoraciones: {}, historialPlantillas: {}, cambios: {}, cole: null };
  }

  function cargarEstado() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return estadoVacio();
      var parsed = JSON.parse(raw);
      return Object.assign(estadoVacio(), parsed);
    } catch (e) {
      return estadoVacio();
    }
  }

  function guardarEstado() {
    if (modoDemo) return; // vista de ejemplo — nunca se persiste ni sincroniza
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
    // No empujar a remoto hasta haber visto el primer snapshot (remotoListo):
    // un push anterior al snapshot inicial machacaría en Firestore lo que otro
    // dispositivo escribió mientras este estaba cerrado. El getter se evalúa al
    // disparar el debounce, no al programarlo — si entre medias llega un snapshot
    // y `estado` se rebindea, se sube el estado vigente, no el capturado.
    if (window.E3Sync && window.E3Sync.getFamilyId() && remotoListo) {
      window.E3Sync.guardarRemotoDebounced(function () { return estado; });
    }
  }

  // "Quién soy yo en este móvil" (Roger 2026-07-14): clave de localStorage
  // APARTE de STORAGE_KEY a propósito — es una preferencia del dispositivo,
  // no de la familia. Cuando exista sync remoto, todo lo de estado viaja a
  // Firestore; esto se queda siempre solo en este navegador, para que cada
  // móvil pueda "ser" un miembro distinto de la misma familia compartida.
  var DISPOSITIVO_KEY = 'e3foods_v2_yo';
  function obtenerMiembroDispositivo() {
    try { return localStorage.getItem(DISPOSITIVO_KEY) || null; } catch (e) { return null; }
  }
  function fijarMiembroDispositivo(id) {
    try {
      if (obtenerMiembroDispositivo() === id) localStorage.removeItem(DISPOSITIVO_KEY);
      else localStorage.setItem(DISPOSITIVO_KEY, id);
    } catch (e) { /* localStorage no disponible — sin preferencia, cae al primero */ }
  }

  function generarId(prefijo) {
    return prefijo + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function patronPorDefecto() {
    return { comida: PATRON_DEFAULT.slice(), cena: PATRON_DEFAULT.slice() };
  }

  var estado = cargarEstado();
  var vistaActual = 'semana';

  // Rediseño Home (Roger 2026-07-19, handoff Claude Design e3Foods.dc.html):
  // Foco y la vista clásica se funden en UNA sola Home — tira continua de 14
  // días (vigente + siguiente concatenados) + pager swipeable comida/cena.
  // diaGlobal: índice 0-13 en esa tira; null = "hoy" (auto). 0-6 = estado.plan,
  // 7-13 = estado.planSiguiente (ver diaGlobalActivo/planActivo más abajo).
  var diaGlobal = null;
  // pagerIdx: 0 = comida, 1 = cena — qué card del pager está centrada.
  // Por defecto según la hora (mismo criterio que antes en Foco), no fijo.
  function comidaProximaPorHora() { return new Date().getHours() < 16 ? 'comida' : 'cena'; }
  var pagerIdx = comidaProximaPorHora() === 'cena' ? 1 : 0;
  var filtroRecetas = 'todas'; // estado de UI, no persistido (SPEC: filtroRecetas)
  var busquedaRecetas = ''; // estado de UI, no persistido
  var rangoCompra = '7d'; // '7d' | 'hoy' — estado de UI, no persistido (SPEC: rangoCompra)
  var recetasView = 'grid'; // 'grid' | 'list' — toggle nuevo del handoff, solo visual
  var vistaPerfil = 'lista'; // 'lista' | futuro detalle-miembro — estado de UI, no persistido
  // Receta a pantalla completa (Roger 2026-07-19, sustituye al sheet): dia/tipo
  // del slot abierto + a qué vista volver con la flecha atrás. planActivo() ya
  // resuelve plan vigente/siguiente vía diaGlobal (sincronizado antes del click
  // por data-dia-global), igual que hacía el sheet — no hace falta duplicarlo.
  var recetaAbierta = null; // { dia, tipo } | null
  var vistaAnterior = 'semana';
  var miembroAbierto = null; // id del miembro cuya ficha está abierta, o null
  var pendienteCambiar = null; // {dia, tipoComida} mientras el sheet de "cambiar" está abierto
  var pendienteRegenerar = null; // {dia, tipoComida} tras un cambio, a la espera de sí/no
  // Onboarding con familia demo (P1, 2026-07-16): mientras modoDemo es true, `estado`
  // apunta a una familia de ejemplo en memoria — guardarEstado() no-opea (ver arriba) y
  // el snapshot remoto se ignora (ver iniciarEscuchaRemota) para que nada de la demo
  // toque localStorage/Firestore. estadoAntesDemo guarda la referencia real para volver.
  var modoDemo = false;
  var estadoAntesDemo = null;

  // qué <details> están abiertos (miembros del sheet Familia, receta propia) — un
  // re-render reconstruye el HTML entero; sin esto, cada toque colapsaría el panel abierto.
  var detallesAbiertos = {};
  document.addEventListener('toggle', function (e) {
    var el = e.target;
    if (!el.matches || !el.matches('[data-detalle-key]')) return;
    var key = el.dataset.detalleKey;
    if (el.open) detallesAbiertos[key] = true; else delete detallesAbiertos[key];
  }, true);

  function aplicarDetallesAbiertos(root) {
    if (!root) return;
    root.querySelectorAll('[data-detalle-key]').forEach(function (el) {
      if (detallesAbiertos[el.dataset.detalleKey]) el.open = true;
    });
  }

  // ---------------------------------------------------------------
  // Horizonte 2 semanas + Home única (Roger 2026-07-18/19) — qué plan y qué día
  // local está "en pantalla" ahora mismo, para que render() y los handlers de
  // mutación (cambiar plato, marcar presente, valorar…) lean y escriban siempre
  // en el mismo sitio. diaGlobal 0-6 → estado.plan; 7-13 → estado.planSiguiente.
  // ---------------------------------------------------------------
  function diaGlobalDeHoy() {
    var hoyISOStr = E.fechaLocalISO(new Date());
    if (estado.plan) { var i = E.diaIndexDesdeFecha(estado.plan, hoyISOStr); if (i !== -1) return i; }
    if (estado.planSiguiente) { var j = E.diaIndexDesdeFecha(estado.planSiguiente, hoyISOStr); if (j !== -1) return j + 7; }
    return null;
  }
  function diaGlobalActivo() {
    if (diaGlobal != null) return diaGlobal;
    var hoy = diaGlobalDeHoy();
    return hoy != null ? hoy : 0;
  }
  function diaLocalActivo() { return diaGlobalActivo() % 7; }
  function planActivo() {
    return diaGlobalActivo() < 7 ? estado.plan : estado.planSiguiente;
  }
  function setPlanActivo(nuevoPlan) {
    if (diaGlobalActivo() < 7) estado.plan = nuevoPlan; else estado.planSiguiente = nuevoPlan;
  }

  // Genera (o regenera) la semana siguiente a partir de estado.plan — con
  // historial TEMPORAL que incluye las elecciones de la semana vigente, para
  // que la rotación (puntuarRecencia/puntuarNovedad) no repita en exceso de
  // una semana a la siguiente. No muta estado.historialPlantillas (ese solo se
  // actualiza de verdad al archivar una semana ya pasada, en asegurarPlanVigente).
  function generarPlanSiguiente() {
    if (!estado.plan || !estado.plan.semanaISO) { estado.planSiguiente = null; return; }
    var lunesSiguiente = E.fechaISO(estado.plan.semanaISO, 7);
    var historialTemp = E.historialConPlan(estado, estado.plan, lunesSiguiente);
    var estadoParaSiguiente = Object.assign({}, estado, { historialPlantillas: historialTemp });
    estado.planSiguiente = E.generarSemana(estadoParaSiguiente, BANCO, 0, { semanaISO: lunesSiguiente, dias: [] });
  }

  // ---------------------------------------------------------------
  // Asegura que hay un plan fresco para la semana en curso + la siguiente ya
  // generada por delante (horizonte 2 semanas, Roger 2026-07-18: la compra del
  // viernes/sábado y la cena del lunes no pueden esperar a que ruede el lunes).
  // ---------------------------------------------------------------
  function asegurarPlanVigente() {
    if (!estado.familia.length) return;
    var lunesActual = E.lunesDeEstaSemana(new Date());
    if (!estado.plan || estado.plan.semanaISO !== lunesActual) {
      // tramo 1 (2026-07-17): antes de pisar el plan saliente, archivar sus
      // plantillas en el historial — alimenta la rotación entre semanas y la
      // novedad del scoring (engine.puntuarRecencia/puntuarNovedad).
      if (estado.plan && estado.plan.semanaISO) {
        estado.historialPlantillas = E.historialConPlan(estado, estado.plan, lunesActual);
      }
      // si la semana siguiente ya estaba generada y ahora es la vigente,
      // ASCENDER en vez de regenerar (ya está calculada — cero espera) y
      // arrastrar sus checks de compra ya marcados a la lista de esta semana.
      if (estado.planSiguiente && estado.planSiguiente.semanaISO === lunesActual) {
        estado.plan = estado.planSiguiente;
        estado.compra.marcados = estado.compra.marcadosSiguiente || [];
      } else {
        estado.plan = E.generarSemana(estado, BANCO);
        estado.compra.marcados = [];
      }
      estado.compra.marcadosSiguiente = [];
      generarPlanSiguiente();
      guardarEstado();
    } else if (!estado.planSiguiente || estado.planSiguiente.semanaISO !== E.fechaISO(lunesActual, 7)) {
      generarPlanSiguiente();
      guardarEstado();
    }
  }

  // ---------------------------------------------------------------
  // Render de las 5 vistas de primer nivel (Roger 2026-07-19: Semana, Recetas,
  // Descubrir, Compra, Familia — Descubrir y Familia son pestañas nuevas)
  // ---------------------------------------------------------------
  function render() {
    var cont = document.getElementById('vista-' + vistaActual);
    // render() reconstruye el <input> del buscador entero — si tenía el foco
    // (tecleo local O re-render por snapshot remoto), restaurar foco y cursor
    // para no cortar la escritura (Roger 2026-07-14, buscador vivo).
    var focoBuscador = document.activeElement && document.activeElement.id === 'recetas-buscador';
    var cursorBuscador = focoBuscador ? document.activeElement.selectionStart : 0;
    document.querySelectorAll('.vista').forEach(function (v) { v.hidden = (v.id !== 'vista-' + vistaActual); });
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.vista === vistaActual); b.setAttribute('aria-current', b.dataset.vista === vistaActual ? 'page' : 'false'); });
    if (vistaActual === 'semana') cont.innerHTML = UI.renderHome(estado, BANCO, diaGlobalActivo(), pagerIdx, obtenerMiembroDispositivo());
    else if (vistaActual === 'recetas') cont.innerHTML = UI.renderRecetasVista(estado, BANCO, filtroRecetas, busquedaRecetas, recetasView);
    else if (vistaActual === 'compra') cont.innerHTML = UI.renderCompraVista(estado, estado.plan, BANCO, rangoCompra);
    else if (vistaActual === 'descubrir') cont.innerHTML = UI.renderDescubrirVista();
    else if (vistaActual === 'perfil') cont.innerHTML = (vistaPerfil === 'ficha' && miembroAbierto) ? UI.renderVistaMiembro(estado, BANCO, miembroAbierto, obtenerMiembroDispositivo()) : UI.renderPerfilVista(estado);
    else if (vistaActual === 'receta') cont.innerHTML = !recetaAbierta ? '' :
      (recetaAbierta.plantillaId ? UI.renderVistaRecetaPlantilla(estado, BANCO, recetaAbierta.plantillaId) : UI.renderVistaReceta(estado, BANCO, planActivo(), recetaAbierta.dia, recetaAbierta.tipo));
    aplicarDetallesAbiertos(cont);
    if (focoBuscador) {
      var buscador = document.getElementById('recetas-buscador');
      if (buscador) { buscador.focus(); buscador.setSelectionRange(cursorBuscador, cursorBuscador); }
    }
    // el scroll-snap nativo del pager se resetea a 0 en cada innerHTML nuevo —
    // saltar (sin animación, esto es re-render, no navegación) a pagerIdx=1
    // si tocaba estar en cena. Sin setTimeout: el layout ya existe tras innerHTML.
    if (vistaActual === 'semana' && pagerIdx === 1) {
      var pagerEl = document.getElementById('home-pager');
      if (pagerEl) pagerEl.scrollLeft = pagerEl.clientWidth + 12;
    }
    refrescarIconos();
  }

  // Ir a 'semana' siempre aterriza en HOY (Roger 2026-07-19) — vuelve al día
  // actual y a la comida que toque por hora, no deja pegada la última mirada.
  function irAVista(nombre) {
    vistaActual = nombre;
    recetaAbierta = null;
    if (nombre === 'semana') { diaGlobal = null; pagerIdx = comidaProximaPorHora() === 'cena' ? 1 : 0; }
    if (nombre === 'perfil') { vistaPerfil = 'lista'; miembroAbierto = null; }
    render();
  }

  // ---------------------------------------------------------------
  // Sheet genérico (bottom sheet reutilizado para familia/compra/cambiar/confirmar)
  // ---------------------------------------------------------------
  // Lucide (Roger 2026-07-19): los iconos se inyectan como <i data-lucide="…">
  // y hace falta pedirle a la librería que los convierta a SVG tras CADA
  // inyección de HTML nueva — idempotente, solo toca los que aún no lo son.
  function refrescarIconos() {
    if (window.lucide) window.lucide.createIcons();
  }

  function abrirSheet(html) {
    document.getElementById('sheet-contenido').innerHTML = html;
    document.getElementById('sheet-overlay').hidden = false;
    document.body.classList.add('sheet-open');
    refrescarIconos();
  }

  function cerrarSheet() {
    document.getElementById('sheet-overlay').hidden = true;
    document.body.classList.remove('sheet-open');
    document.getElementById('sheet-contenido').innerHTML = '';
    pendienteCambiar = null;
    pendienteRegenerar = null;
    render(); // por si se marcó compra o se cambió algo mientras el sheet estaba abierto
  }

  function marcarYoDispositivo(id) {
    fijarMiembroDispositivo(id);
    render(); // re-pinta la ficha con el badge/chip actualizados
  }

  // Menú hamburguesa (Roger 2026-07-14, rehecho igual día): dropdown pequeño
  // anclado al botón (arriba izquierda) en vez del sheet grande de abajo —
  // el sheet queda para pantallas con contenido real, no para 3 líneas de
  // acciones. Posición calculada en el momento del tap (getBoundingClientRect),
  // no CSS fijo, porque el app-bar no es sticky y el botón se desplaza con el scroll.
  function abrirMenuHamburguesa(btn) {
    var dropdown = document.getElementById('menu-dropdown');
    var overlay = document.getElementById('menu-dropdown-overlay');
    if (!dropdown || !overlay || !btn) return;
    dropdown.innerHTML = UI.renderMenuHamburguesa();
    var r = btn.getBoundingClientRect();
    dropdown.style.top = Math.round(r.bottom + 6) + 'px';
    dropdown.style.left = Math.round(r.left) + 'px';
    dropdown.hidden = false;
    overlay.hidden = false;
    refrescarIconos();
  }

  function cerrarMenuHamburguesa() {
    document.getElementById('menu-dropdown').hidden = true;
    document.getElementById('menu-dropdown-overlay').hidden = true;
  }

  function abrirImportarCole() {
    abrirSheet(UI.renderSheetImportarCole(estado));
  }

  // Importa el menú del cole (F1, 2026-07-17 — versión manual del P1 #2): Roger
  // genera el JSON con el prompt de ChatGPT y se pega aquí, hasta que exista
  // /ai/cole-menu. Al cargar: los menores comen esos mediodías en el cole
  // (presentesEnComida) y las cenas evitan repetir proteína/hidrato del día.
  //
  // Horizonte 2 semanas + carga mensual (Roger 2026-07-18): cada importación
  // ACUMULA en estado.cole.dias en vez de reemplazarlo entero — así una
  // semana suelta, varias semanas pegadas una a una, o un mes entero del PDF
  // (el prompt sigue siendo semanal; ampliarlo es tarea aparte) se guardan
  // todas para el día que corresponda, sin perder lo ya cargado. Mismo id de
  // fecha en dos importaciones → gana la más reciente. Recalcular es SIEMPRE
  // automático, no una pregunta — Roger: "cuando se sube menú del cole
  // siempre se recalcula la semana".
  function importarCole() {
    var ta = document.getElementById('cole-json');
    if (!ta) return;
    var datos;
    try { datos = JSON.parse(ta.value); } catch (e) { alert('Eso no es un JSON válido — copia la respuesta completa del asistente, con las llaves.'); return; }
    if (!datos || !datos.dias || typeof datos.dias !== 'object' || !Object.keys(datos.dias).length) { alert('El JSON no trae días de menú ("dias").'); return; }
    var fechasMal = Object.keys(datos.dias).filter(function (f) { return !/^\d{4}-\d{2}-\d{2}$/.test(f); });
    if (fechasMal.length) { alert('Hay fechas con formato raro: ' + fechasMal.join(', ')); return; }
    if (!estado.cole || !estado.cole.dias) estado.cole = { dias: {} };
    Object.keys(datos.dias).forEach(function (f) { estado.cole.dias[f] = datos.dias[f]; });
    guardarEstado();
    regenerarSemanaCompleta(); // siempre, sin preguntar — cierra el sheet y re-renderiza (vigente + siguiente)
  }

  function borrarCole() {
    estado.cole = null;
    guardarEstado();
    regenerarSemanaCompleta(); // el dato del cole cambió (a "nada") — recalcula igual que al importar,
    // si no los niños quedarían "fuera" de comidas de días que ya no tienen menú cargado
  }

  // ---------------------------------------------------------------
  // Sincronización multiusuario (Roger 2026-07-14, pilar de backend).
  // Local-first: localStorage sigue siendo la fuente rápida/offline
  // (guardarEstado arriba); esto solo añade el empuje a Firestore + la
  // escucha de cambios remotos cuando hay una familia sincronizada.
  // ---------------------------------------------------------------
  var desuscribirRemoto = null;
  // true cuando ya se ha visto el primer snapshot remoto (o se acaba de subir el
  // estado inicial al crear la familia) — hasta entonces no se empuja nada a
  // Firestore para no pisar cambios de otros dispositivos con el estado local viejo.
  var remotoListo = false;

  function mostrarAppPrincipal() {
    document.getElementById('landing-screen').hidden = true;
    document.body.classList.remove('landing-open');
    document.getElementById('wizard-screen').hidden = true;
    document.body.classList.remove('wizard-open');
    asegurarPlanVigente();
    render();
  }

  function iniciarEscuchaRemota(onPrimerSnapshot) {
    if (!window.E3Sync) return;
    if (desuscribirRemoto) { if (onPrimerSnapshot) onPrimerSnapshot(); return; }
    var familyId = window.E3Sync.getFamilyId();
    if (!familyId) return;
    var primera = true;
    desuscribirRemoto = window.E3Sync.suscribirEstado(familyId, function (remoto) {
      if (modoDemo) return; // no clobbear la vista de ejemplo con datos reales
      // un push local pendiente serializaría un estado anterior a este snapshot
      // y lo escribiría encima en Firestore — se cancela: el remoto es la verdad,
      // y cualquier edición posterior re-dispara su propio push.
      window.E3Sync.cancelarPendiente();
      remotoListo = true;
      if (remoto) {
        estado = Object.assign(estadoVacio(), remoto);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); // caché local, sin re-disparar guardarRemotoDebounced
      }
      if (primera && onPrimerSnapshot) { primera = false; onPrimerSnapshot(); }
      else if (remoto) { asegurarPlanVigente(); render(); }
    });
  }

  function abrirSheetSync() {
    // la sincronización subiría la familia de ejemplo a Firestore como si fuera
    // real — inalcanzable en el uso normal (el hamburguesa vive dentro de SEMANA,
    // que sí se muestra en demo), así que se corta aquí en vez de ocultar el menú.
    if (modoDemo) {
      abrirSheet(UI.sheetHead('Ejemplo') + '<div class="sheet-body"><p class="card-msg">' +
        'La sincronización no está disponible en la vista de ejemplo. Sal del ejemplo ' +
        'y crea tu familia real para activarla.</p></div>');
      return;
    }
    abrirSheet(UI.renderSheetSync({ cargando: true }));
    var familyId = window.E3Sync ? window.E3Sync.getFamilyId() : null;
    if (!familyId) {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({ synced: false });
      return;
    }
    window.E3Sync.obtenerInfoFamilia(familyId).then(function (info) {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({ synced: true, nombreFamilia: info.nombreFamilia, code: info.code });
    }).catch(function () {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({ synced: false, error: 'No se pudo cargar el estado de sincronización.' });
    });
  }

  function activarSincronizacion() {
    var btn = document.getElementById('sync-activar-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Activando…'; }
    // Si ya hay familyId (p.ej. la creación anterior falló a medias al subir el
    // estado), NO crear otra familia — reintentar solo la subida y recuperar el
    // código existente. Sin este guard, cada reintento acuñaba una familia nueva
    // huérfana con código distinto.
    var familyIdPrevio = window.E3Sync.getFamilyId();
    var promesa = familyIdPrevio
      ? window.E3Sync.subirEstadoInicial(estado).then(function () {
          return window.E3Sync.obtenerInfoFamilia(familyIdPrevio);
        })
      : window.E3Sync.crearFamilia(estado.nombreFamilia || 'Mi familia').then(function (data) {
          return window.E3Sync.subirEstadoInicial(estado).then(function () { return data; });
        });
    promesa.then(function (data) {
      remotoListo = true; // el doc remoto acaba de escribirse con este estado
      iniciarEscuchaRemota();
      mostrarAppPrincipal();
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({ synced: true, nombreFamilia: estado.nombreFamilia, code: data.code });
    }).catch(function (err) {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({ synced: false, error: 'No se pudo activar: ' + err.message });
    });
  }

  function rotarCodigo() {
    var btn = document.getElementById('sync-rotar-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }
    window.E3Sync.rotarCodigo().then(function (data) {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({
        synced: true, nombreFamilia: estado.nombreFamilia, code: data.code,
        aviso: 'Código nuevo listo. El anterior ya no sirve para unirse.'
      });
    }).catch(function (err) {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({
        synced: true, nombreFamilia: estado.nombreFamilia, code: '…',
        aviso: 'No se pudo generar: ' + err.message + '. El código anterior sigue siendo válido.'
      });
    });
  }

  function exportarDatos() {
    var btn = document.getElementById('sync-exportar-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Preparando…'; }
    window.E3Sync.exportarDatos().then(function (datos) {
      var blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'e3foods-' + (estado.nombreFamilia || 'familia').replace(/[^\w-]+/g, '-').toLowerCase() + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      if (btn) { btn.disabled = false; btn.textContent = 'Descargar una copia'; }
    }).catch(function (err) {
      if (btn) { btn.disabled = false; btn.textContent = 'No se pudo descargar — reintentar'; }
      console.error('[sync] export falló', err);
    });
  }

  function pedirConfirmacionBorrado() {
    document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({
      confirmarBorrado: true, nombreFamilia: estado.nombreFamilia
    });
  }

  function confirmarBorrado() {
    var input = document.getElementById('sync-borrar-input');
    if (!input || input.value.trim().toUpperCase() !== 'BORRAR') {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({
        confirmarBorrado: true, nombreFamilia: estado.nombreFamilia,
        error: 'Escribe BORRAR para confirmar.'
      });
      return;
    }
    var btn = document.getElementById('sync-borrar-confirmar-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Borrando…'; }
    window.E3Sync.borrarFamilia().then(function () {
      // el listener remoto apunta a un doc que ya no existe: cortarlo antes de
      // que dispare un onChange(null) y app.js crea que el remoto está vacío
      if (desuscribirRemoto) { desuscribirRemoto(); desuscribirRemoto = null; }
      remotoListo = false;
      document.getElementById('sheet-contenido').innerHTML = UI.sheetHead('Familia borrada') +
        '<div class="sheet-body"><p class="card-msg">La familia y sus datos ya no están en la nube. ' +
        'Este móvil conserva su copia local: puedes seguir usándolo sin sincronizar, o activar la ' +
        'sincronización otra vez para crear una familia nueva.</p></div>';
    }).catch(function (err) {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({
        confirmarBorrado: true, nombreFamilia: estado.nombreFamilia,
        error: 'No se pudo borrar: ' + err.message
      });
    });
  }

  function unirseSincronizacion() {
    var input = document.getElementById('sync-code-input');
    var code = input ? input.value.trim() : '';
    if (!code) return;
    var btn = document.getElementById('sync-unirse-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Uniéndome…'; }
    window.E3Sync.unirseFamilia(code).then(function () {
      iniciarEscuchaRemota(function () {
        mostrarAppPrincipal();
        var familyId = window.E3Sync.getFamilyId();
        window.E3Sync.obtenerInfoFamilia(familyId).then(function (info) {
          document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({ synced: true, nombreFamilia: info.nombreFamilia, code: info.code });
        });
      });
    }).catch(function (err) {
      document.getElementById('sheet-contenido').innerHTML = UI.renderSheetSync({ synced: false, error: 'Código no válido o error de red.' });
    });
  }

  function regenerarSemanaCompleta() {
    if (!estado.familia.length) { cerrarSheet(); return; }
    estado.plan = E.generarSemana(estado, BANCO);
    generarPlanSiguiente(); // datos de familia/cole cambiaron — la siguiente no puede quedarse obsoleta
    guardarEstado();
    cerrarSheet(); // ya re-renderiza
  }

  // ---------------------------------------------------------------
  // Landing → wizard (hub de alta) / HOY
  // ---------------------------------------------------------------
  function aterrizarSegunFamilia() {
    if (!estado.familia.length) {
      document.getElementById('wizard-screen').hidden = false;
      document.body.classList.add('wizard-open');
      wizardNombreFamilia = '';
      wizardMiembros = [];
      mostrarWizardBienvenida();
    } else {
      asegurarPlanVigente();
      render();
    }
  }

  function cerrarLanding() {
    document.getElementById('landing-screen').hidden = true;
    document.body.classList.remove('landing-open');
    aterrizarSegunFamilia();
  }

  // ---------------------------------------------------------------
  // Onboarding con familia demo (P1, 2026-07-16): "ver un ejemplo" antes de
  // rellenar nada — familia y semana generadas en memoria, nunca persistidas
  // (guardarEstado/iniciarEscuchaRemota/abrirSheetSync están guardados arriba).
  // Plenamente interactiva: como toda la app lee/escribe el `estado` del
  // closure, tocar avatares o cambiar un plato en la demo funciona igual que
  // en la app real — solo que se descarta entero al salir.
  // ---------------------------------------------------------------
  var DEMO_FAMILIA_DATOS = [
    { nombre: 'Marta', sexo: 'mujer', anioNacimiento: 1985, peso: 62, altura: 165, actividad: 'media', dieta: 'omnivora' },
    { nombre: 'Javier', sexo: 'hombre', anioNacimiento: 1983, peso: 80, altura: 178, actividad: 'media', dieta: 'omnivora' },
    { nombre: 'Lucas', sexo: 'hombre', anioNacimiento: 2019, actividad: 'media', dieta: 'omnivora' }
  ];

  function crearFamiliaDemo() {
    return DEMO_FAMILIA_DATOS.map(function (datos, i) {
      return Object.assign({ id: 'demo-' + i, vetos: [], patron: patronPorDefecto() }, datos);
    });
  }

  function mostrarDemo() {
    estadoAntesDemo = estado;
    var estadoDemo = Object.assign(estadoVacio(), { nombreFamilia: 'Familia Ejemplo', familia: crearFamiliaDemo() });
    estadoDemo.plan = E.generarSemana(estadoDemo, BANCO);
    estado = estadoDemo;
    generarPlanSiguiente(); // horizonte 2 semanas también en la demo — es interactiva de verdad
    modoDemo = true;
    document.getElementById('landing-screen').hidden = true;
    document.body.classList.remove('landing-open');
    document.getElementById('wizard-screen').hidden = true;
    document.body.classList.remove('wizard-open');
    document.getElementById('demo-banner').hidden = false;
    vistaActual = 'semana';
    diaGlobal = null;
    render();
  }

  function salirDemo() {
    modoDemo = false;
    estado = estadoAntesDemo || estadoVacio();
    estadoAntesDemo = null;
    document.getElementById('demo-banner').hidden = true;
    aterrizarSegunFamilia();
  }

  // ---------------------------------------------------------------
  // Wizard — alta conversacional en 3 pasos: bienvenida (nombre de familia)
  // -> hub (quién vive en casa) -> form (ficha de una persona). Una pregunta
  // por pantalla — ver DOC_FUNCIONAL_SAAS.md §4.1 y el encargo de Roger
  // 2026-07-13 ("así quiero una app": conversacional, no formulario).
  // ---------------------------------------------------------------
  var wizardMiembros = [];
  var wizardNombreFamilia = '';
  var wizardRegion = ''; // región opcional del paso 1 (tramo 1, 2026-07-17)

  // contexto compartido del formulario de miembro (wizard hub vs sheet Familia)
  var formContexto = 'wizard'; // 'wizard' | 'familia'
  var formEditId = null;
  var formFotoActual = null;

  function ocultarPasosWizard() {
    document.getElementById('wizard-bienvenida').hidden = true;
    document.getElementById('wizard-hub').hidden = true;
    document.getElementById('wizard-form').hidden = true;
  }

  function mostrarWizardBienvenida() {
    ocultarPasosWizard();
    var el = document.getElementById('wizard-bienvenida');
    el.hidden = false;
    el.innerHTML = UI.renderWizardBienvenida(wizardNombreFamilia, wizardRegion);
  }

  function wizardSiguienteBienvenida() {
    var el = document.getElementById('wz-nombre-familia');
    wizardNombreFamilia = el ? el.value.trim() : '';
    mostrarWizardHub();
  }

  function mostrarWizardHub() {
    ocultarPasosWizard();
    var el = document.getElementById('wizard-hub');
    el.hidden = false;
    el.innerHTML = UI.renderWizardHub(wizardNombreFamilia, wizardMiembros);
  }

  function mostrarWizardForm(miembroId) {
    formContexto = 'wizard';
    formEditId = miembroId || null;
    var existente = miembroId ? wizardMiembros.find(function (m) { return m.id === miembroId; }) : null;
    formFotoActual = existente ? (existente.foto || null) : null;
    ocultarPasosWizard();
    var formEl = document.getElementById('wizard-form');
    formEl.hidden = false;
    var tituloExtra = existente ? '<h1 class="wizard-pregunta">Editar a ' + UI.escapeHtml(existente.nombre) + '</h1>' : '';
    formEl.innerHTML = tituloExtra + UI.renderFormMiembroCompleto(existente, !existente);
  }

  function wizardQuitarMiembro(id) {
    wizardMiembros = wizardMiembros.filter(function (m) { return m.id !== id; });
    mostrarWizardHub();
  }

  function wizardGenerar() {
    if (!wizardMiembros.length) return;
    estado.nombreFamilia = wizardNombreFamilia.trim();
    estado.familiaRegion = wizardRegion || null;
    estado.familia = wizardMiembros.slice();
    estado.plan = E.generarSemana(estado, BANCO);
    generarPlanSiguiente();
    guardarEstado();
    document.getElementById('wizard-screen').hidden = true;
    document.body.classList.remove('wizard-open');
    wizardMiembros = [];
    irAVista('semana');
  }

  // ---------------------------------------------------------------
  // Formulario de miembro compartido — leer/guardar/cancelar (wizard y sheet Familia)
  // ---------------------------------------------------------------
  function leerFormMiembroCompleto() {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var nombre = val('mf-nombre').trim();
    var sexo = val('mf-sexo') || 'mujer';
    var anioActual = new Date().getFullYear();
    var anio = parseInt(val('mf-anio'), 10);
    if (!nombre || !anio || isNaN(anio) || anio < 1920 || anio > anioActual) return null;
    var datos = {
      nombre: nombre, sexo: sexo, anioNacimiento: anio,
      actividad: val('mf-actividad') || 'media', dieta: val('mf-dieta') || 'omnivora',
      foto: formFotoActual || null
    };
    var altura = val('mf-altura'); if (altura) datos.altura = Number(altura);
    var peso = val('mf-peso'); if (peso) datos.peso = Number(peso);
    return datos;
  }

  function guardarFormMiembro() {
    var datos = leerFormMiembroCompleto();
    if (!datos) { alert('Nombre, sexo y año de nacimiento son obligatorios.'); return; }
    if (formContexto === 'wizard') {
      if (formEditId) {
        var m = wizardMiembros.find(function (x) { return x.id === formEditId; });
        if (m) Object.assign(m, datos);
      } else {
        wizardMiembros.push(Object.assign({ id: generarId('m'), vetos: [], patron: patronPorDefecto() }, datos));
      }
      mostrarWizardHub();
    } else {
      if (formEditId) {
        var m2 = estado.familia.find(function (x) { return x.id === formEditId; });
        if (m2) Object.assign(m2, datos);
      } else {
        estado.familia.push(Object.assign({ id: generarId('m'), vetos: [], patron: patronPorDefecto() }, datos));
      }
      guardarEstado();
      cerrarSheet();
    }
  }

  function cancelarFormMiembro() {
    if (formContexto === 'wizard') mostrarWizardHub();
    else cerrarSheet();
  }

  function abrirFormMiembroEnSheet(miembroId) {
    formContexto = 'familia';
    formEditId = miembroId || null;
    var existente = miembroId ? estado.familia.find(function (m) { return m.id === miembroId; }) : null;
    formFotoActual = existente ? (existente.foto || null) : null;
    abrirSheet(UI.sheetHead(existente ? 'Editar miembro' : 'Nuevo miembro') +
      '<div class="sheet-body">' + UI.renderFormMiembroCompleto(existente, !existente) + '</div>');
  }

  // #mf-foto-preview es un <button class="foto-tap"> con spans internos (iniciales +
  // icono cámara en vacío, o "Cambiar" superpuesto sobre la foto) — el contenido
  // interno lo construye UI.fotoTapInner (el mismo helper de los renders), aquí
  // solo se gestiona el background y el botón "Quitar foto", que es un hermano
  // fuera del círculo (mostrar/ocultar todo el nodo, no solo un flag).
  function actualizarPreviewFotoForm() {
    var el = document.getElementById('mf-foto-preview');
    if (!el) return;
    var btnQuitar = document.getElementById('mf-foto-quitar');
    var nombreEl = document.getElementById('mf-nombre');
    el.style.backgroundImage = formFotoActual ? "url('" + formFotoActual + "')" : 'none';
    el.innerHTML = UI.fotoTapInner({ foto: formFotoActual, nombre: nombreEl ? nombreEl.value : '' });
    el.setAttribute('aria-label', formFotoActual ? 'Cambiar foto' : 'Añadir foto');
    if (btnQuitar) btnQuitar.hidden = !formFotoActual;
  }

  function quitarFotoMiembro(id) {
    var m = estado.familia.find(function (x) { return x.id === id; });
    if (!m) return;
    delete m.foto;
    guardarEstado();
    render();
  }

  // ---------------------------------------------------------------
  // Foto de miembro — recorte cuadrado centrado + resize + JPEG comprimido
  // (canibalizado de e3foods.html líneas ~1591-1610, adaptado a ES5 sin dependencias)
  // ============================================================
  function resizeImageToDataURL(file, maxSize, quality) {
    maxSize = maxSize || 200; quality = quality || 0.7;
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('El archivo no es una imagen válida.')); };
        img.onload = function () {
          var side = Math.min(img.width, img.height);
          var sx = (img.width - side) / 2, sy = (img.height - side) / 2;
          var canvas = document.createElement('canvas');
          canvas.width = maxSize; canvas.height = maxSize;
          canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------------------------------------------------------------
  // HOY / SEMANA — presencia, compra, cambiar plato
  // ---------------------------------------------------------------
  function togglePresente(dia, tipoComida, miembroId) {
    var fecha = planActivo().dias[dia].fecha;
    if (!estado.ausenciasPuntuales[fecha]) estado.ausenciasPuntuales[fecha] = { comida: [], cena: [] };
    var lista = estado.ausenciasPuntuales[fecha][tipoComida] || [];
    var idx = lista.indexOf(miembroId);
    if (idx === -1) lista.push(miembroId); else lista.splice(idx, 1);
    estado.ausenciasPuntuales[fecha][tipoComida] = lista;
    guardarEstado();
    render();
  }

  // horizonte 2 semanas (Roger 2026-07-18): marcados vive por semana —
  // 'marcados' (vigente, comparte hoy/7d como siempre) vs 'marcadosSiguiente'
  // (mismos ids de ingrediente pueden repetirse entre semanas; sin escopar,
  // marcar "pollo" en la lista de esta semana lo marcaría también en la de
  // la que viene).
  function campoMarcados() { return rangoCompra === 'siguiente' ? 'marcadosSiguiente' : 'marcados'; }

  function toggleCompraItem(ingredienteId) {
    var campo = campoMarcados();
    var marcados = estado.compra[campo] || [];
    var idx = marcados.indexOf(ingredienteId);
    if (idx === -1) marcados.push(ingredienteId); else marcados.splice(idx, 1);
    estado.compra[campo] = marcados;
    guardarEstado();
    render();
  }

  // "Vaciar" (Roger 2026-07-17): desmarca TODO el segmento de semana visible,
  // sin importar el sub-segmento (7 días / hoy) — esos dos comparten el mismo
  // array, solo "semana que viene" tiene el suyo aparte. Sin confirmación a
  // propósito: es un toggle reversible con un toque (igual que marcar un
  // ítem), no un borrado — sube en la próxima carta al súper.
  function vaciarCompra() {
    estado.compra[campoMarcados()] = [];
    guardarEstado();
    render();
  }

  function abrirRecetaDetalle(dia, tipoComida) {
    recetaAbierta = { dia: dia, tipo: tipoComida };
    vistaAnterior = vistaActual;
    vistaActual = 'receta';
    render();
  }

  // Desde el banco de Recetas (Roger 2026-07-19): sin día ni comensales
  // concretos detrás — ver renderVistaRecetaPlantilla.
  function abrirRecetaBanco(plantillaId) {
    recetaAbierta = { plantillaId: plantillaId };
    vistaAnterior = vistaActual;
    vistaActual = 'receta';
    render();
  }

  function cerrarRecetaDetalle() {
    vistaActual = vistaAnterior;
    recetaAbierta = null;
    render();
  }

  function abrirMiembroFicha(id) {
    miembroAbierto = id;
    vistaPerfil = 'ficha';
    render();
  }

  function cerrarMiembroFicha() {
    vistaPerfil = 'lista';
    miembroAbierto = null;
    render();
  }

  // Feedback loop (P1, 2026-07-16): toque post-comida por slot. Toggle — tocar la
  // misma carita otra vez quita la valoración (arrepentimiento sin fricción).
  function valorarPlato(dia, tipoComida, valor) {
    var plan = planActivo();
    var slot = plan && plan.dias[dia] && plan.dias[dia][tipoComida];
    if (!slot) return;
    var fecha = plan.dias[dia].fecha;
    var clave = fecha + '_' + tipoComida;
    if (!estado.valoraciones) estado.valoraciones = {};
    var actual = estado.valoraciones[clave];
    if (actual && actual.valor === valor) delete estado.valoraciones[clave];
    else estado.valoraciones[clave] = { plantillaId: slot.plantillaId, valor: valor };
    guardarEstado();
    render(); // vistaActual ya es 'receta' — repinta con el estado nuevo
  }

  function abrirResumenSemana() {
    abrirSheet(UI.renderSheetResumenSemana(estado, BANCO, planActivo()));
  }

  function abrirCambiar(dia, tipoComida) {
    pendienteCambiar = { dia: dia, tipoComida: tipoComida };
    abrirSheet(UI.renderSheetCambiarInicio(estado, BANCO, dia, tipoComida));
  }

  function trasCambiarPlato(resultado) {
    if (!resultado) { alert('No encontramos un plato que encaje con esas condiciones.'); cerrarSheet(); render(); return; }
    setPlanActivo(resultado.plan);
    guardarEstado();
    pendienteRegenerar = { dia: pendienteCambiar.dia, tipoComida: pendienteCambiar.tipoComida };
    abrirSheet(UI.renderConfirmarRegenerar(resultado.resuelto.nombre));
    render();
  }

  function elegirPlantilla(dia, tipoComida, plantillaId) {
    var plan = planActivo();
    var slotPrevio = plan && plan.dias[dia] && plan.dias[dia][tipoComida];
    var previoId = slotPrevio && slotPrevio.plantillaId;
    var resultado = E.cambiarPlato(estado, plan, dia, tipoComida, { modo: 'manual', plantillaId: plantillaId }, BANCO);
    // Registro de cambios (F1, MOTOR_RECETAS §2): el plato REEMPLAZADO acumula
    // señal suave de "me apetece otra cosa". SOLO en cambios por elección — el
    // modo nevera no registra jamás (necesidad ≠ preferencia, Roger 2026-07-17).
    if (resultado && previoId && previoId !== plantillaId) {
      if (!estado.cambios) estado.cambios = {};
      estado.cambios[previoId] = (estado.cambios[previoId] || 0) + 1;
    }
    trasCambiarPlato(resultado);
  }

  function confirmarNevera(dia, tipoComida) {
    var checks = document.querySelectorAll('#lista-nevera-checks input:checked');
    var disponibles = Array.prototype.map.call(checks, function (c) { return c.value; });
    if (!disponibles.length) { alert('Marca al menos un ingrediente disponible.'); return; }
    var resultado = E.cambiarPlato(estado, planActivo(), dia, tipoComida, { modo: 'nevera', disponibles: disponibles }, BANCO);
    trasCambiarPlato(resultado);
  }

  // chips de seleccionados + contador en el botón, arriba del todo (sheet nevera)
  function actualizarNeveraSeleccion() {
    var caja = document.getElementById('nevera-seleccion');
    var boton = document.getElementById('nevera-confirmar');
    if (!caja || !boton) return;
    var checks = document.querySelectorAll('#lista-nevera-checks input:checked');
    if (!checks.length) {
      caja.hidden = true;
      caja.innerHTML = '';
      boton.textContent = 'Buscar plato';
      return;
    }
    caja.hidden = false;
    caja.innerHTML = Array.prototype.map.call(checks, function (c) {
      return '<button type="button" class="nevera-chip" data-action="nevera-quitar" data-id="' + c.value + '">' +
        UI.escapeHtml(c.dataset.nombre) + '<span class="nevera-chip-x" aria-hidden="true">&times;</span></button>';
    }).join('');
    boton.textContent = 'Buscar plato (' + checks.length + ')';
  }

  function quitarIngredienteNevera(id) {
    var check = document.querySelector('#lista-nevera-checks input[value="' + id + '"]');
    if (!check) return;
    check.checked = false;
    actualizarNeveraSeleccion();
  }

  // dictado por voz del navegador (Web Speech API) — sin coste, sin servidor;
  // si el navegador no lo soporta el botón de micro ni se pinta (ver TIENE_VOZ en ui.js)
  function activarVozNevera(btn) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var input = document.getElementById('nevera-buscador');
    if (!SR || !input) return;
    var reconocedor = new SR();
    reconocedor.lang = 'es-ES';
    reconocedor.interimResults = false;
    reconocedor.maxAlternatives = 1;
    btn.classList.add('btn-filtro-icono-activo');
    reconocedor.onresult = function (e) {
      input.value = e.results[0][0].transcript;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };
    reconocedor.onerror = function () { btn.classList.remove('btn-filtro-icono-activo'); };
    reconocedor.onend = function () { btn.classList.remove('btn-filtro-icono-activo'); };
    reconocedor.start();
  }

  function regenerarSiguientes(si) {
    if (si && pendienteRegenerar) {
      setPlanActivo(E.regenerarDesde(estado, planActivo(), pendienteRegenerar.dia + 1, BANCO));
      guardarEstado();
    }
    cerrarSheet(); // ya re-renderiza
  }

  // ---------------------------------------------------------------
  // MI FAMILIA (sheet) — CRUD miembros existentes, patrón, vetos, recetas
  // ---------------------------------------------------------------
  function actualizarCampoMiembro(id, campo, valor) {
    var m = estado.familia.find(function (x) { return x.id === id; });
    if (!m) return;
    if (campo === 'peso' || campo === 'altura' || campo === 'anioNacimiento') m[campo] = valor ? Number(valor) : undefined;
    else m[campo] = valor;
    guardarEstado();
  }

  function borrarMiembro(id) {
    if (!confirm('¿Eliminar a este miembro de la familia?')) return;
    estado.familia = estado.familia.filter(function (m) { return m.id !== id; });
    guardarEstado();
    vistaPerfil = 'lista';
    miembroAbierto = null;
    render();
  }

  function togglePatron(id, tipo, diaIdx, btn) {
    var m = estado.familia.find(function (x) { return x.id === id; });
    if (!m) return;
    var ciclo = ['casa', 'fuera', 'cole'];
    var actual = m.patron[tipo][diaIdx];
    m.patron[tipo][diaIdx] = ciclo[(ciclo.indexOf(actual) + 1) % ciclo.length];
    guardarEstado();
    // re-pintar SOLO el grid tocado — reconstruir el sheet entero por cada tap
    // (con vetos de 57 ingredientes × miembro) hacía lag en taps consecutivos
    var grid = btn && btn.closest('.patron-grid');
    if (grid) grid.outerHTML = UI.renderPatronGrid(m, tipo);
    else render();
  }

  function toggleVeto(miembroId, ingredienteId) {
    var m = estado.familia.find(function (x) { return x.id === miembroId; });
    if (!m) return;
    var idx = m.vetos.indexOf(ingredienteId);
    if (idx === -1) m.vetos.push(ingredienteId); else m.vetos.splice(idx, 1);
    guardarEstado();
  }

  function toggleOcultaReceta(plantillaId) {
    var idx = estado.ocultas.indexOf(plantillaId);
    if (idx === -1) estado.ocultas.push(plantillaId); else estado.ocultas.splice(idx, 1);
    guardarEstado();
    render();
  }

  function toggleFavoritaReceta(plantillaId) {
    var idx = estado.favoritas.indexOf(plantillaId);
    if (idx === -1) estado.favoritas.push(plantillaId); else estado.favoritas.splice(idx, 1);
    guardarEstado();
    render();
  }

  function anadirRecetaPropia() {
    var val = function (id) { return document.getElementById(id).value; };
    var nombre = val('rp-nombre').trim();
    if (!nombre) { alert('Ponle un nombre al plato.'); return; }
    var ejes = {};
    ['proteina', 'hidrato', 'verdura'].forEach(function (eje) {
      var v = val('rp-' + eje);
      if (v) ejes[eje] = [v];
    });
    if (!Object.keys(ejes).length) { alert('Elige al menos un ingrediente.'); return; }
    var apta = val('rp-apta').split(',');
    var receta = {
      id: generarId('propia'), nombre_patron: nombre, tipo: 'plantilla', apta: apta,
      tiempo_min: 30, esfuerzo: val('rp-esfuerzo') || 'rapido', ninos: true,
      ejes: ejes, kcal_extra: 100, pasos: [], notas: 'Receta propia'
    };
    estado.propias.push(receta);
    guardarEstado();
    render();
  }

  // ---------------------------------------------------------------
  // Delegación de eventos
  // ---------------------------------------------------------------
  var ACCIONES = {
    'empezar': function () { cerrarLanding(); },
    'ver-demo': function () { mostrarDemo(); },
    'salir-demo': function () { salirDemo(); },
    'ir-vista': function (btn) { irAVista(btn.dataset.vista); },
    'abrir-menu-hamburguesa': function (btn) { abrirMenuHamburguesa(btn); },
    'menu-ir-familia': function () { irAVista('perfil'); },
    'menu-regenerar-semana': function () { regenerarSemanaCompleta(); },
    'menu-importar-cole': function () { abrirImportarCole(); },
    'cole-importar': function () { importarCole(); },
    'cole-borrar': function () { borrarCole(); },
    // línea "…en el cole" (banner de despensa, próximos días): no hay pantalla
    // dedicada de cole todavía, abre el sheet real que ya lista los días
    // cargados (Roger 2026-07-19: reutilizar, no construir una pantalla nueva
    // para esto sin que lo pida).
    'ir-cole': function () { abrirImportarCole(); },
    // pager comida/cena de la Home (Roger 2026-07-19, reemplaza foco-flip-comida):
    // el scroll real lo lleva onPagerScroll (gesto), esto es para el segmentado y los puntos.
    'pager-ir': function (btn) { irPager(Number(btn.dataset.pager)); },
    'menu-sync': function () { abrirSheetSync(); },
    'landing-unirse': function () { abrirSheetSync(); },
    'sync-activar': function () { activarSincronizacion(); },
    'sync-unirse': function () { unirseSincronizacion(); },
    'sync-rotar': function () { rotarCodigo(); },
    'sync-exportar': function () { exportarDatos(); },
    'sync-borrar': function () { pedirConfirmacionBorrado(); },
    'sync-borrar-confirmar': function () { confirmarBorrado(); },

    'wizard-siguiente-bienvenida': function () { wizardSiguienteBienvenida(); },
    'wizard-volver-bienvenida': function () { mostrarWizardBienvenida(); },
    'wizard-abrir-form': function () { mostrarWizardForm(null); },
    'wizard-editar-miembro': function (btn) { mostrarWizardForm(btn.dataset.id); },
    'wizard-quitar-miembro': function (btn) { wizardQuitarMiembro(btn.dataset.id); },
    'wizard-generar': function () { wizardGenerar(); },

    'mf-guardar': function () { guardarFormMiembro(); },
    'mf-cancelar': function () { cancelarFormMiembro(); },
    'mf-subir-foto': function () { var el = document.getElementById('mf-foto-input'); if (el) el.click(); },
    'mf-quitar-foto': function () { formFotoActual = null; actualizarPreviewFotoForm(); },
    // chip de sexo/actividad/dieta en el form modal (alta/edición): sin re-render —
    // solo escribe el input hidden y refresca las clases activas del propio grupo
    // (mismo data-campo-id), así el usuario no pierde el resto del form a medio rellenar.
    'mf-set-campo': function (btn) {
      var campoId = btn.dataset.campoId;
      var hidden = document.getElementById(campoId);
      if (hidden) hidden.value = btn.dataset.valor;
      var grupo = btn.parentElement;
      if (grupo) {
        grupo.querySelectorAll('[data-campo-id="' + campoId + '"]').forEach(function (b) {
          var activo = b === btn;
          b.classList.toggle('chip-toggle-activo', activo);
          b.setAttribute('aria-pressed', activo);
        });
      }
    },

    'familia-abrir-form-miembro': function () { abrirFormMiembroEnSheet(null); },
    'miembro-subir-foto': function (btn) {
      var input = btn.parentElement.querySelector('[data-foto-input="' + btn.dataset.id + '"]');
      if (input) input.click();
    },
    'miembro-quitar-foto': function (btn) { quitarFotoMiembro(btn.dataset.id); },
    // chip de sexo/actividad/dieta en la ficha de miembro: guarda y refresca
    // solo las clases activas del grupo, sin repintar toda la pantalla.
    'miembro-set-campo': function (btn) {
      actualizarCampoMiembro(btn.dataset.id, btn.dataset.campo, btn.dataset.valor);
      var grupo = btn.parentElement;
      if (grupo) {
        grupo.querySelectorAll('.chip-toggle').forEach(function (b) {
          var activo = b === btn;
          b.classList.toggle('chip-toggle-activo', activo);
          b.setAttribute('aria-pressed', activo);
        });
      }
    },
    'ir-compra-hoy': function () { rangoCompra = 'hoy'; irAVista('compra'); },

    'toggle-presente': function (btn) { togglePresente(Number(btn.dataset.dia), btn.dataset.tipo, btn.dataset.miembro); },
    'toggle-compra-item': function (btn) { toggleCompraItem(btn.dataset.id); },
    'vaciar-compra': function () { vaciarCompra(); },
    'segmento-compra': function (btn) { rangoCompra = btn.dataset.rango; render(); },
    // tira de 14 días de la Home (Roger 2026-07-19): data-dia-global ya
    // sincronizó diaGlobal antes de llegar aquí (ver dispatcher), así que
    // solo hace falta re-renderizar.
    'semana-elegir-dia': function () { render(); },
    'filtro-receta': function (btn) { filtroRecetas = btn.dataset.categoria; render(); },
    'recetas-vista': function (btn) { recetasView = btn.dataset.vista; render(); },
    'abrir-form-receta-propia': function () {
      var det = document.querySelector('.receta-propia-form');
      if (!det) return;
      det.open = true;
      det.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    'abrir-receta': function (btn) { abrirRecetaDetalle(Number(btn.dataset.dia), btn.dataset.tipo); },
    'abrir-receta-banco': function (btn) { abrirRecetaBanco(btn.dataset.plantilla); },
    'receta-volver': function () { cerrarRecetaDetalle(); },
    'abrir-miembro-ficha': function (btn) { abrirMiembroFicha(btn.dataset.id); },
    'miembro-volver': function () { cerrarMiembroFicha(); },
    'abrir-resumen-semana': function () { abrirResumenSemana(); },
    'valorar-plato': function (btn) { valorarPlato(E.diaIndexDesdeFecha(planActivo(), btn.dataset.fecha), btn.dataset.tipo, btn.dataset.valor); },
    'abrir-cambiar': function (btn) { abrirCambiar(Number(btn.dataset.dia), btn.dataset.tipo); },
    'cerrar-sheet': function () { cerrarSheet(); },
    'modo-elegir-otro': function (btn) { abrirSheet(UI.renderListaElegirOtro(estado, BANCO, planActivo(), Number(btn.dataset.dia), btn.dataset.tipo)); },
    'modo-nevera': function (btn) { abrirSheet(UI.renderNevera(estado, BANCO, Number(btn.dataset.dia), btn.dataset.tipo)); },
    'elegir-plantilla': function (btn) { elegirPlantilla(Number(btn.dataset.dia), btn.dataset.tipo, btn.dataset.plantilla); },
    'confirmar-nevera': function (btn) { confirmarNevera(Number(btn.dataset.dia), btn.dataset.tipo); },
    'nevera-quitar': function (btn) { quitarIngredienteNevera(btn.dataset.id); },
    'nevera-voz': function (btn) { activarVozNevera(btn); },
    'regenerar-si': function () { regenerarSiguientes(true); },
    'regenerar-no': function () { regenerarSiguientes(false); },

    'borrar-miembro': function (btn) { borrarMiembro(btn.dataset.id); },
    'marcar-yo-dispositivo': function (btn) { marcarYoDispositivo(btn.dataset.id); },
    'toggle-patron': function (btn) { togglePatron(btn.dataset.id, btn.dataset.tipo, Number(btn.dataset.dia), btn); },
    'toggle-veto': function (btn) { toggleVeto(btn.dataset.id, btn.dataset.ingrediente); },
    'toggle-oculta-receta': function (btn) { toggleOcultaReceta(btn.dataset.plantilla); },
    'toggle-favorita-receta': function (btn) { toggleFavoritaReceta(btn.dataset.plantilla); },
    'anadir-receta-propia': function () { anadirRecetaPropia(); }
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    // Home única (2026-07-19): cualquier control que se refiera a un día concreto de
    // la tira de 14 lleva data-dia-global — sincroniza diaGlobal ANTES de despachar,
    // así planActivo() resuelve el plan correcto aunque el control esté en una card
    // de "próximos días" distinta a la actualmente seleccionada.
    if (btn.dataset.diaGlobal != null) diaGlobal = parseInt(btn.dataset.diaGlobal, 10);
    var accion = ACCIONES[btn.dataset.action];
    if (accion) accion(btn, e);
    // cualquier ítem del dropdown del hamburguesa cierra el dropdown al elegirlo
    if (btn.closest('#menu-dropdown')) cerrarMenuHamburguesa();
  });

  // Enter/espacio activan [role="button"] (p.ej. .card-comida-fila, un <div>
  // porque contiene botones anidados de avatares — un <button> real no puede
  // envolver otros botones). Los <button> normales ya tienen esto gratis.
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var btn = e.target.closest('[role="button"][data-action]');
    if (!btn) return;
    e.preventDefault();
    btn.click();
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t) return;

    // foto de un miembro YA existente (sheet Familia, input por-miembro con data-foto-input)
    if (t.dataset && t.dataset.fotoInput) {
      var miembroId = t.dataset.fotoInput;
      var file = t.files[0]; t.value = '';
      if (!file) return;
      resizeImageToDataURL(file).then(function (dataUrl) {
        var m = estado.familia.find(function (x) { return x.id === miembroId; });
        if (m) { m.foto = dataUrl; guardarEstado(); render(); }
      }).catch(function (err) { alert('No se pudo procesar la imagen: ' + err.message); });
      return;
    }

    // foto en el formulario compartido de alta/edición (wizard o sheet Familia)
    if (t.id === 'mf-foto-input') {
      var file2 = t.files[0]; t.value = '';
      if (!file2) return;
      resizeImageToDataURL(file2).then(function (dataUrl) {
        formFotoActual = dataUrl;
        actualizarPreviewFotoForm();
      }).catch(function (err) { alert('No se pudo procesar la imagen: ' + err.message); });
      return;
    }

    // checkbox de un ingrediente en el sheet "con lo que hay en la nevera"
    if (t.type === 'checkbox' && t.closest('#lista-nevera-checks')) { actualizarNeveraSeleccion(); return; }

    // región del wizard (select dispara 'change', no 'input')
    if (t.id === 'wz-region') { wizardRegion = t.value; return; }

    var campo = t.dataset && t.dataset.campo;
    if (!campo) return;
    if (campo === 'nombreFamilia') { estado.nombreFamilia = t.value.trim(); guardarEstado(); return; }
    // región de la familia (Ajustes): señal del motor en la próxima generación — no regenera en caliente
    if (campo === 'familiaRegion') { estado.familiaRegion = t.value || null; guardarEstado(); return; }
    if (t.dataset.id) { actualizarCampoMiembro(t.dataset.id, campo, t.value); render(); }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'wz-nombre-familia') wizardNombreFamilia = t.value;
    else if (t.id === 'mf-nombre' && !formFotoActual) actualizarPreviewFotoForm();
    else if (t.id === 'recetas-buscador') {
      // render() restaura por sí mismo el foco/cursor del buscador
      busquedaRecetas = t.value;
      render();
    } else if (t.id === 'nevera-buscador') {
      // filtro directo sobre el DOM del sheet (no pasa por render()) — el
      // sheet vive fuera de las 3 vistas principales y así el input nunca
      // pierde el foco al teclear.
      var q = UI.normalizarTexto(t.value);
      document.querySelectorAll('#lista-nevera-checks li').forEach(function (li) {
        li.hidden = !!q && li.dataset.buscar.indexOf(q) === -1;
      });
    }
  });

  // Pager comida/cena de la Home (Roger 2026-07-19) — scroll-snap NATIVO
  // (CSS scroll-snap-type, sin math de gesto manual: el navegador hace el
  // swipe). Solo hace falta: (a) botón/segmentado que haga scrollTo, (b) un
  // listener de scroll que mantenga pagerIdx al día para el segmentado y los
  // puntos. Delegado en fase de captura porque 'scroll' no burbujea en todos
  // los navegadores — la captura sí ve el evento del contenedor con overflow.
  function irPager(i) {
    var el = document.getElementById('home-pager');
    if (!el) { pagerIdx = i; render(); return; }
    var paso = el.clientWidth + 12;
    el.scrollTo({ left: i * paso, behavior: 'smooth' });
    pagerIdx = i;
    actualizarSegmentadoPager();
  }
  // Actualiza SOLO las clases del segmentado (sin render() completo) — un
  // render a mitad de gesto de scroll reconstruiría el contenedor y cortaría
  // la animación nativa.
  function actualizarSegmentadoPager() {
    var seg = document.getElementById('pager-seg-comida');
    var sec = document.getElementById('pager-seg-cena');
    if (seg) { seg.classList.toggle('pager-seg-activo', pagerIdx === 0); }
    if (sec) { sec.classList.toggle('pager-seg-activo', pagerIdx === 1); }
  }
  document.addEventListener('scroll', function (e) {
    var el = e.target;
    if (!el || el.id !== 'home-pager') return;
    var paso = el.clientWidth + 12;
    var idx = Math.round(el.scrollLeft / Math.max(1, paso));
    if (idx !== pagerIdx && (idx === 0 || idx === 1)) { pagerIdx = idx; actualizarSegmentadoPager(); }
  }, true);

  // ---------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', function () {
    // cerrar el sheet al tocar el fondo (fuera del panel) — sin esto, solo la X cierra
    var sheetOverlayEl = document.getElementById('sheet-overlay');
    if (sheetOverlayEl) {
      sheetOverlayEl.addEventListener('click', function (e) {
        if (e.target === e.currentTarget) cerrarSheet();
      });
    }
    // catcher transparente a pantalla completa: tocar fuera del dropdown del
    // hamburguesa lo cierra (el propio dropdown no es hijo suyo, es hermano)
    var menuDropdownOverlayEl = document.getElementById('menu-dropdown-overlay');
    if (menuDropdownOverlayEl) menuDropdownOverlayEl.addEventListener('click', cerrarMenuHamburguesa);
    iniciarEscuchaRemota(); // no-op si este dispositivo no tiene familyId cacheado
    asegurarPlanVigente();
    render();
    document.body.classList.add('landing-open');

    // nav se encoge a solo-iconos al bajar y recupera al subir — puerto directo de
    // e3foods.html (setupNavShrink), mismo throttle por tiempo (rAF no siempre dispara
    // en WebViews sin compositor activo — hallazgo ya verificado ahí).
    (function setupNavShrink() {
      var nav = document.querySelector('.bottom-nav');
      if (!nav) return;
      var lastY = window.scrollY, lastRun = 0;
      function onScroll() {
        var y = Math.max(0, window.scrollY);
        var dy = y - lastY;
        if (y < 40) nav.classList.remove('compact');
        else if (dy > 12) nav.classList.add('compact');
        else if (dy < -12) nav.classList.remove('compact');
        if (Math.abs(dy) > 12) lastY = y;
      }
      window.addEventListener('scroll', function () {
        var now = Date.now();
        if (now - lastRun < 32) return;
        lastRun = now;
        onScroll();
      }, { passive: true });
    })();

  });
})();
