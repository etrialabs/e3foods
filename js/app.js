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

  // Modo de la vista Semana (Roger 2026-07-17, 2ª iteración): 'foco' (home
  // tipo informe: equilibrio + HOY + compra + semana de un vistazo) | 'semana'
  // (clásica, píldoras). Variable de SESIÓN, no localStorage — el tab Semana
  // siempre aterriza en la home Foco (ver irAVista); "Ver semana" es un
  // drill-in puntual a la clásica, no una preferencia que deba persistir.
  var vistaSemanaModo = 'foco';
  // Qué comida enseña la card HOY de Foco: null = automático por hora
  // (comidaProximaPorHora), o 'comida'/'cena' si el usuario tocó la flecha
  // lateral o hizo swipe — se resetea a null al reentrar en Semana.
  var focoComida = null;
  function comidaProximaPorHora() { return new Date().getHours() < 16 ? 'comida' : 'cena'; }
  var filtroRecetas = 'todas'; // estado de UI, no persistido (SPEC: filtroRecetas)
  var busquedaRecetas = ''; // estado de UI, no persistido
  var filtrosRecetasVisibles = false; // colapsados por defecto (Roger 2026-07-14)
  var rangoCompra = '7d'; // '7d' | 'hoy' — estado de UI, no persistido (SPEC: rangoCompra)
  var semanaDiaSeleccionado = null; // índice 0-6 en la vista Semana — estado de UI, no persistido; null = hoy
  // horizonte 2 semanas (Roger 2026-07-18): 'vigente' | 'siguiente' — qué semana se ve en la
  // vista clásica (píldoras + flechas). Foco ignora esto siempre (planActivo() lo fuerza a
  // 'vigente' en modo foco) — Foco es un dashboard de HOY, no tiene sentido para una semana futura.
  var semanaSeleccionada = 'vigente';
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
  // Horizonte 2 semanas (Roger 2026-07-18) — qué plan está "en pantalla" ahora
  // mismo, para que render() y los handlers de mutación (cambiar plato, marcar
  // presente, valorar…) lean y escriban siempre en el mismo sitio. Foco fuerza
  // vigente: es un dashboard de HOY, no existe "HOY" de una semana futura.
  // ---------------------------------------------------------------
  function planActivo() {
    if (vistaSemanaModo === 'foco') return estado.plan;
    return semanaSeleccionada === 'siguiente' ? estado.planSiguiente : estado.plan;
  }
  function setPlanActivo(nuevoPlan) {
    if (vistaSemanaModo !== 'foco' && semanaSeleccionada === 'siguiente') estado.planSiguiente = nuevoPlan;
    else estado.plan = nuevoPlan;
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
  // Render de las 4 vistas de primer nivel
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
    if (vistaActual === 'semana') cont.innerHTML = UI.renderSemana(estado, planActivo(), BANCO, semanaDiaSeleccionado, obtenerMiembroDispositivo(), vistaSemanaModo, focoComida || comidaProximaPorHora(), semanaSeleccionada);
    else if (vistaActual === 'recetas') cont.innerHTML = UI.renderRecetasVista(estado, BANCO, filtroRecetas, busquedaRecetas, filtrosRecetasVisibles);
    else if (vistaActual === 'compra') cont.innerHTML = UI.renderCompraVista(estado, rangoCompra === 'siguiente' ? estado.planSiguiente : estado.plan, BANCO, rangoCompra);
    aplicarDetallesAbiertos(cont);
    if (focoBuscador) {
      var buscador = document.getElementById('recetas-buscador');
      if (buscador) { buscador.focus(); buscador.setSelectionRange(cursorBuscador, cursorBuscador); }
    }
  }

  // Ir a 'semana' siempre aterriza en la home Foco (Roger 2026-07-17, 2ª
  // iteración) — "Ver semana"/"Ver informe" son drill-ins puntuales, no deben
  // quedar pegados al volver a tocar el tab.
  function irAVista(nombre) {
    vistaActual = nombre;
    if (nombre === 'semana') { vistaSemanaModo = 'foco'; focoComida = null; semanaSeleccionada = 'vigente'; }
    render();
  }

  // ---------------------------------------------------------------
  // Sheet genérico (bottom sheet reutilizado para familia/compra/cambiar/confirmar)
  // ---------------------------------------------------------------
  function abrirSheet(html) {
    document.getElementById('sheet-contenido').innerHTML = html;
    document.getElementById('sheet-overlay').hidden = false;
    document.body.classList.add('sheet-open');
  }

  function cerrarSheet() {
    document.getElementById('sheet-overlay').hidden = true;
    document.body.classList.remove('sheet-open');
    document.getElementById('sheet-contenido').innerHTML = '';
    pendienteCambiar = null;
    pendienteRegenerar = null;
    render(); // por si se marcó compra o se cambió algo mientras el sheet estaba abierto
  }

  function abrirSheetFamilia() {
    abrirSheet(UI.renderSheetFamilia(estado, BANCO, obtenerMiembroDispositivo()));
    aplicarDetallesAbiertos(document.getElementById('sheet-contenido'));
  }

  function marcarYoDispositivo(id) {
    fijarMiembroDispositivo(id);
    abrirSheetFamilia(); // re-pinta la sheet con el badge/chip actualizados
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
  function importarCole() {
    var ta = document.getElementById('cole-json');
    if (!ta) return;
    var datos;
    try { datos = JSON.parse(ta.value); } catch (e) { alert('Eso no es un JSON válido — copia la respuesta completa del asistente, con las llaves.'); return; }
    if (!datos || !datos.dias || typeof datos.dias !== 'object' || !Object.keys(datos.dias).length) { alert('El JSON no trae días de menú ("dias").'); return; }
    var fechasMal = Object.keys(datos.dias).filter(function (f) { return !/^\d{4}-\d{2}-\d{2}$/.test(f); });
    if (fechasMal.length) { alert('Hay fechas con formato raro: ' + fechasMal.join(', ')); return; }
    estado.cole = { semanaISO: datos.semanaISO || Object.keys(datos.dias).sort()[0], dias: datos.dias };
    guardarEstado();
    render();
    if (confirm('Menú del cole importado. ¿Regenero la semana para tenerlo en cuenta?')) {
      cerrarSheet();
      regenerarSemanaCompleta();
    } else {
      abrirSheet(UI.renderSheetImportarCole(estado));
    }
  }

  function borrarCole() {
    estado.cole = null;
    guardarEstado();
    render();
    abrirSheet(UI.renderSheetImportarCole(estado));
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
    semanaDiaSeleccionado = null;
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
      abrirSheetFamilia();
    }
  }

  function cancelarFormMiembro() {
    if (formContexto === 'wizard') mostrarWizardHub();
    else abrirSheetFamilia();
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
    abrirSheetFamilia();
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
    abrirSheet(UI.renderSheetReceta(estado, BANCO, planActivo(), dia, tipoComida));
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
    abrirSheet(UI.renderSheetReceta(estado, BANCO, planActivo(), dia, tipoComida)); // re-pinta con el estado nuevo
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
    abrirSheetFamilia();
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
    else abrirSheetFamilia();
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
    'abrir-familia': function () { abrirSheetFamilia(); },
    'abrir-menu-hamburguesa': function (btn) { abrirMenuHamburguesa(btn); },
    'menu-ir-familia': function () { abrirSheetFamilia(); },
    'menu-regenerar-semana': function () { regenerarSemanaCompleta(); },
    'menu-importar-cole': function () { abrirImportarCole(); },
    'cole-importar': function () { importarCole(); },
    'cole-borrar': function () { borrarCole(); },
    'ver-semana-clasica': function () { vistaSemanaModo = 'semana'; render(); },
    'ver-informe-foco': function () { vistaSemanaModo = 'foco'; focoComida = null; semanaSeleccionada = 'vigente'; render(); },
    'foco-flip-comida': function (btn) { focoComida = btn.dataset.comida; render(); },
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
    // chip de sexo/actividad/dieta en la card de edición del sheet Familia:
    // guarda y refresca solo las clases activas del grupo (como mf-set-campo).
    // Excepción dieta: su valor aparece también en la línea-resumen del miembro,
    // así que ahí sí se re-renderiza el sheet completo (los <details> abiertos
    // se conservan vía el registro detallesAbiertos).
    'miembro-set-campo': function (btn) {
      actualizarCampoMiembro(btn.dataset.id, btn.dataset.campo, btn.dataset.valor);
      if (btn.dataset.campo === 'dieta') { abrirSheetFamilia(); return; }
      var grupo = btn.parentElement;
      if (grupo) {
        grupo.querySelectorAll('.chip-toggle').forEach(function (b) {
          var activo = b === btn;
          b.classList.toggle('chip-toggle-activo', activo);
          b.setAttribute('aria-pressed', activo);
        });
      }
    },
    'ir-recetas-ocultas': function () { vistaActual = 'recetas'; cerrarSheet(); },
    'ir-compra-hoy': function () { rangoCompra = 'hoy'; irAVista('compra'); },

    'toggle-presente': function (btn) { togglePresente(Number(btn.dataset.dia), btn.dataset.tipo, btn.dataset.miembro); },
    'toggle-compra-item': function (btn) { toggleCompraItem(btn.dataset.id); },
    'vaciar-compra': function () { vaciarCompra(); },
    'segmento-compra': function (btn) { rangoCompra = btn.dataset.rango; render(); },
    'semana-elegir-dia': function (btn) {
      semanaDiaSeleccionado = parseInt(btn.dataset.dia, 10);
      // Tocar un día del vistazo de Foco mientras se mira "semana que viene":
      // Foco no tiene HOY de una semana futura, así que en vez de intentar
      // reflejarlo ahí, se hace drill-in directo a la vista clásica (que ya
      // respeta semanaSeleccionada) — mismo comportamiento que "Ver semana
      // completa" pero aterrizando ya en el día tocado.
      if (vistaSemanaModo === 'foco' && semanaSeleccionada === 'siguiente') vistaSemanaModo = 'semana';
      render();
    },
    'semana-pag': function (btn) { semanaSeleccionada = btn.dataset.semana; semanaDiaSeleccionado = null; render(); },
    'filtro-receta': function (btn) { filtroRecetas = btn.dataset.categoria; render(); },
    'toggle-filtros-receta': function () { filtrosRecetasVisibles = !filtrosRecetasVisibles; render(); },
    'abrir-form-receta-propia': function () {
      var det = document.querySelector('.receta-propia-form');
      if (!det) return;
      det.open = true;
      det.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    'abrir-receta': function (btn) { abrirRecetaDetalle(Number(btn.dataset.dia), btn.dataset.tipo); },
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
        if (m) { m.foto = dataUrl; guardarEstado(); abrirSheetFamilia(); }
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

  // Swipe horizontal sobre la card HOY de Foco (Roger 2026-07-17, 2ª
  // iteración) — cambia comida↔cena, alternativa táctil a la flecha lateral.
  // Umbral de 8px antes de decidir la dirección del gesto (no robar el tap,
  // UI_MOBILE §5 incidente 1); no se hace preventDefault hasta confirmar
  // gesto horizontal, para no romper el scroll vertical de la página.
  var hoyTouch = null;
  document.addEventListener('touchstart', function (e) {
    var sw = e.target.closest && e.target.closest('#hoy-swipe');
    if (!sw) { hoyTouch = null; return; }
    var t = e.touches[0];
    hoyTouch = { x: t.clientX, y: t.clientY, dir: null, dx: 0 };
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!hoyTouch) return;
    var t = e.touches[0];
    var dx = t.clientX - hoyTouch.x, dy = t.clientY - hoyTouch.y;
    if (hoyTouch.dir === null) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      hoyTouch.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v';
    }
    if (hoyTouch.dir === 'h') { e.preventDefault(); hoyTouch.dx = dx; }
  }, { passive: false });
  document.addEventListener('touchend', function () {
    if (hoyTouch && hoyTouch.dir === 'h' && Math.abs(hoyTouch.dx) > 45) {
      var sw = document.getElementById('hoy-swipe');
      var actual = sw ? sw.dataset.meal : comidaProximaPorHora();
      focoComida = actual === 'comida' ? 'cena' : 'comida';
      render();
    }
    hoyTouch = null;
  });

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

    // Swipe horizontal entre días en SEMANA (Roger 2026-07-14: v2 nunca lo
    // tuvo — codebase nueva, sin relación con el swipe de e3foods.html v1).
    // Delegado a nivel documento porque .vista-body se reconstruye entera en
    // cada render(). Cambia de semana queda fuera (pendiente diseño motor).
    (function setupSwipeDias() {
      var startX = 0, startY = 0, activo = false;
      document.addEventListener('touchstart', function (e) {
        activo = !!e.target.closest('#vista-semana .vista-body') && e.touches.length === 1;
        if (!activo) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }, { passive: true });
      document.addEventListener('touchend', function (e) {
        if (!activo) return;
        activo = false;
        var zona = document.querySelector('#vista-semana .vista-body');
        if (!zona || !e.changedTouches.length) return;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        var idx = parseInt(zona.dataset.diaIdx, 10);
        if (isNaN(idx)) return;
        var siguiente = dx < 0 ? idx + 1 : idx - 1;
        var plan = planActivo();
        if (siguiente < 0 || siguiente > 6 || !plan || !plan.dias[siguiente]) return;
        semanaDiaSeleccionado = siguiente;
        render();
      }, { passive: true });
    })();
  });
})();
