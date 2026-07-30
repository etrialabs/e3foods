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
  var I18N = window.E3I18n;
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

  // Mismo criterio para engine/ui (audit 2026-07-20): un 404 o error de sintaxis
  // en engine.js/ui.js dejaba pantalla blanca con el error solo en consola —
  // exactamente el fallo silencioso que el guard del banco quiso evitar.
  if (!E || !UI) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.innerHTML = '<div style="padding:32px 24px;font-family:sans-serif;max-width:480px;margin:0 auto">' +
        '<h1 style="font-size:20px;margin-bottom:12px">No se pudo cargar la aplicación</h1>' +
        '<p>Recarga la página. Si el problema sigue, es un fallo del despliegue (engine.js o ui.js no responden).</p></div>';
    });
    return;
  }

  // ---------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------
  // Versión de esquema del estado persistido (UPGRADES §6 "localStorage sin versión") — sube
  // cuando el shape de `estado` cambie de una forma que necesite migración activa al cargar.
  var ESQUEMA_ESTADO = 2;

  function estadoVacio() {
    return { nombreFamilia: '', familiaRegion: null, familia: [], ausenciasPuntuales: {}, plan: null, planSiguiente: null, ocultas: [], favoritas: [], propias: [], compra: { marcados: [], marcadosSiguiente: [] }, valoraciones: {}, historialPrincipales: {}, historialPares: {}, cambios: {}, paresComplementariaCambiados: {}, cole: null, semillaRegeneracion: 0, esquemaVersion: ESQUEMA_ESTADO };
  }

  // v1 → v2 (handoff "Alta de persona", 2026-07-30). Primera migración activa
  // real del esquema. Dos cambios de forma en el miembro:
  //   · `alergias` pasa de texto libre a array de ids del catálogo → el texto de
  //     antes se conserva íntegro en `restricciones` ("Otras restricciones" de
  //     la ficha). Nada escrito por la familia se pierde.
  //   · aparece `estilo` (4 opciones del handoff), derivado del `dieta` que ya
  //     tuviera. `dieta` NO se toca: sigue siendo lo que consume el motor v3.
  function migrarPersonasV2(est) {
    (est.familia || []).forEach(function (m) {
      if (typeof m.alergias === 'string') {
        var texto = m.alergias.trim();
        if (texto && !(m.restricciones || '').trim()) m.restricciones = texto;
      }
      if (!Array.isArray(m.alergias)) m.alergias = [];
      if (!m.estilo) m.estilo = UI.estiloDeMiembro(m);
      if (!m.gustos) m.gustos = {};
      if (!m.pComida) m.pComida = 'primero-segundo';
      if (!m.pCena) m.pCena = 'ligera';
    });
    est.esquemaVersion = 2;
  }

  function cargarEstado() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return estadoVacio();
      var parsed = JSON.parse(raw);
      // La versión se lee de `parsed`, NUNCA del objeto ya fusionado: estadoVacio()
      // trae esquemaVersion = la actual, así que un estado legacy SIN la clave
      // heredaría la versión nueva y se saltaría su propia migración.
      var versionGuardada = parsed.esquemaVersion || 1;
      var estadoFinal = Object.assign(estadoVacio(), parsed);
      // Si llega una versión MAYOR que la que conoce este cliente (cliente viejo abriendo un
      // estado ya migrado por una versión nueva de la app en otro dispositivo sincronizado): NO
      // tocar nada, dejar el valor tal cual venga — un cliente viejo no debe machacar el progreso
      // de la migración de uno nuevo.
      if (versionGuardada < 2) migrarPersonasV2(estadoFinal);
      return estadoFinal;
    } catch (e) {
      return estadoVacio();
    }
  }

  function guardarEstado() {
    if (modoDemo) return; // vista de ejemplo — nunca se persiste ni sincroniza
    // try/catch (audit 2026-07-20): en modo privado de Safari/Firefox o con la
    // cuota llena, setItem lanza — la excepción abortaba el handler a medias
    // (sheet sin cerrar, sin render). El resto de accesos ya iban guardados.
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); } catch (e) { /* sin caché local — el push remoto de abajo sigue */ }
    // No empujar a remoto hasta haber visto el primer snapshot (remotoListo):
    // un push anterior al snapshot inicial machacaría en Firestore lo que otro
    // dispositivo escribió mientras este estaba cerrado. El getter se evalúa al
    // disparar el debounce, no al programarlo — si entre medias llega un snapshot
    // y `estado` se rebindea, se sube el estado vigente, no el capturado.
    if (window.E3Sync && window.E3Sync.getFamilyId() && remotoListo) {
      window.E3Sync.guardarRemotoDebounced(function () { return estado; });
      // Histórico write-behind (obra motor de menús paso 3): además del blob meta/estado,
      // congela cada semana como su propio doc plan/{semanaISO} — sustrato del histórico de 12
      // meses (F2/F5, swipe entre semanas) que hoy no existe y no se puede rellenar hacia atrás.
      // Aditivo, el getter serializa el estado vigente al disparar el debounce (igual que arriba);
      // sync.js corta las escrituras que no cambian el plan.
      if (window.E3Sync.guardarPlanHistoricoDebounced) {
        window.E3Sync.guardarPlanHistoricoDebounced(function () {
          return [E.serializarPlanHistorico(estado.plan), E.serializarPlanHistorico(estado.planSiguiente)];
        });
      }
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
  // Luz de la app según la hora (Roger 2026-07-26) — deriva pura, nunca un ajuste de
  // usuario. Un solo token opaco por momento (nunca alfa sobre --bg: no da el mismo
  // color, ver nota en styles.css) para que el degradado de #bottom-nav-fade no
  // dibuje una banda de tono distinto al fondo real.
  // bug real 2026-07-26: h<12 metía la madrugada (00:00-05:59) en "manana" (el tono
  // mas claro, casi blanco) — a la 1:56 AM Roger vio el degradado "blanco" por esto,
  // no por un fallo de cableado CSS. La madrugada sigue siendo noche.
  function momentoDelDia() { var h = new Date().getHours(); return h < 6 ? 'noche' : (h < 12 ? 'manana' : (h < 20 ? 'tarde' : 'noche')); }
  function aplicarMomentoDelDia() { document.documentElement.dataset.momento = momentoDelDia(); }
  var pagerIdx = comidaProximaPorHora() === 'cena' ? 1 : 0;
  var filtroRecetas = 'todas'; // estado de UI, no persistido (SPEC: filtroRecetas)
  var busquedaRecetas = ''; // estado de UI, no persistido
  var busquedaTimer = null; // debounce del buscador de Recetas (audit 2026-07-20)
  var rangoCompra = '7d'; // '7d' | 'hoy' — estado de UI, no persistido (SPEC: rangoCompra)
  var categoriasAbiertasCompra = {}; // grupo -> bool, estado de UI, no persistido (Roger 2026-07-26)
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
  var neveraOpcionesActuales = []; // hasta 3 menús resueltos del último "buscar plato" de nevera, para poder elegir uno sin recalcular
  var descubrirAbierto = null; // {fecha, idx} mientras el sheet de categoría de Descubrir está abierto (audit 2026-07-20)
  // Onboarding con familia demo (P1, 2026-07-16): mientras modoDemo es true, `estado`
  // apunta a una familia de ejemplo en memoria — guardarEstado() no-opea (ver arriba) y
  // el snapshot remoto se ignora (ver iniciarEscuchaRemota) para que nada de la demo
  // toque localStorage/Firestore. estadoAntesDemo guarda la referencia real para volver.
  var modoDemo = false;
  var estadoAntesDemo = null;
  // snapshot remoto recibido DURANTE la demo (audit 2026-07-20): antes se
  // descartaba y remotoListo quedaba false — al salir de la demo ningún cambio
  // volvía a subir a Firestore hasta recargar. Se bufferiza y se aplica al salir.
  var snapshotDuranteDemo = null;

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
  // una semana a la siguiente. No muta estado.historialPrincipales (ese solo se
  // actualiza de verdad al archivar una semana ya pasada, en asegurarPlanVigente).
  function generarPlanSiguiente() {
    if (!estado.plan || !estado.plan.semanaISO) { estado.planSiguiente = null; return; }
    var lunesSiguiente = E.fechaISO(estado.plan.semanaISO, 7);
    var historialTemp = E.historialConPlan(estado, estado.plan, lunesSiguiente);
    // Memoria de PARES (obra paso 2, bug B): mismo patrón temporal que historialTemp de arriba —
    // incluye los pares de la semana vigente para que puntuarRecenciaPar tampoco repita en exceso
    // de una semana a la siguiente, sin tocar estado.historialPares real (solo se archiva de
    // verdad al pasar de semana, en asegurarPlanVigente).
    var historialParesTemp = E.historialParesConPlan(estado, estado.plan, lunesSiguiente, BANCO, BANCO);
    var estadoParaSiguiente = Object.assign({}, estado, { historialPrincipales: historialTemp, historialPares: historialParesTemp });
    // diaPrevio = domingo del plan vigente: la variedad dura ahora cruza la
    // frontera dom→lun (audit 2026-07-20 — antes el lunes de la semana siguiente
    // podía repetir ingredientes del domingo, visible en la tira de 14 días).
    estado.planSiguiente = E.generarSemana(estadoParaSiguiente, BANCO, BANCO, 0, { semanaISO: lunesSiguiente, dias: [] }, estado.plan.dias[6], E.fechaLocalISO(new Date()));
  }

  // ---------------------------------------------------------------
  // Asegura que hay un plan fresco para la semana en curso + la siguiente ya
  // generada por delante (horizonte 2 semanas, Roger 2026-07-18: la compra del
  // viernes/sábado y la cena del lunes no pueden esperar a que ruede el lunes).
  // ---------------------------------------------------------------
  function asegurarPlanVigente() {
    if (!estado.familia.length) return;
    // OJO: string ISO, no new Date() — pasarle el objeto Date producía "NaN-NaN-NaN" (la función
    // concatena 'T00:00:00' a un string), con lo que la comparación de abajo SIEMPRE fallaba y
    // esta rama de rollover corría en CADA carga: regeneraba plan+planSiguiente y vaciaba
    // compra.marcados silenciosamente en cada apertura (bug pre-existente desde el tramo 1,
    // enmascarado porque el motor determinista regeneraba lo mismo; la memoria de pares del
    // paso 2 lo hizo visible al realimentar el scoring). Hallado en verificación de navegador
    // 2026-07-23. engine.lunesDeEstaSemana acepta ahora también un Date por defensa, pero el
    // contrato canónico es string ISO.
    var lunesActual = E.lunesDeEstaSemana(E.fechaLocalISO(new Date()));
    if (!estado.plan || estado.plan.semanaISO !== lunesActual) {
      // tramo 1 (2026-07-17): antes de pisar el plan saliente, archivar sus
      // plantillas en el historial — alimenta la rotación entre semanas y la
      // novedad del scoring (engine.puntuarRecencia/puntuarNovedad).
      if (estado.plan && estado.plan.semanaISO) {
        estado.historialPrincipales = E.historialConPlan(estado, estado.plan, lunesActual);
        // Memoria de PARES (obra paso 2, bug B): mismo punto de archivado que historialPrincipales
        // — al pasar de semana, el par plato+proteína de cada slot saliente queda registrado.
        estado.historialPares = E.historialParesConPlan(estado, estado.plan, lunesActual, BANCO, BANCO);
      }
      // poda de datos fechados ya consumidos (audit 2026-07-20): fechas anteriores
      // al lunes vigente no alimentan nada (presencia y cole solo miran el plan en
      // curso) y sin poda crecían para siempre, engordando cada push/snapshot del
      // sync. valoraciones y cambios NO se tocan: son memoria del motor (rechazos/
      // rotación) — recortarlos es decisión de producto, no de higiene.
      Object.keys(estado.ausenciasPuntuales || {}).forEach(function (f) {
        if (f < lunesActual) delete estado.ausenciasPuntuales[f];
      });
      if (estado.cole && estado.cole.dias) {
        Object.keys(estado.cole.dias).forEach(function (f) {
          if (f < lunesActual) delete estado.cole.dias[f];
        });
        if (!Object.keys(estado.cole.dias).length) estado.cole = null;
      }
      // si la semana siguiente ya estaba generada y ahora es la vigente,
      // ASCENDER en vez de regenerar (ya está calculada — cero espera) y
      // arrastrar sus checks de compra ya marcados a la lista de esta semana.
      if (estado.planSiguiente && estado.planSiguiente.semanaISO === lunesActual) {
        estado.plan = estado.planSiguiente;
        estado.compra.marcados = estado.compra.marcadosSiguiente || [];
      } else {
        estado.plan = E.generarSemana(estado, BANCO, BANCO, 0, null, null, E.fechaLocalISO(new Date()));
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

  // La pestaña/PWA que sobrevive la medianoche o el fin de semana (audit
  // 2026-07-20): asegurarPlanVigente solo corría en init/snapshot — una pestaña
  // viva cruzaba el lunes con la semana caducada (Compra calculaba sobre el plan
  // viejo) y "hoy" quedaba clavado en el día anterior hasta recargar. Al volver
  // a ser visible, re-evaluar; solo re-renderiza si de verdad cambió el día.
  var ultimoHoyISO = E.fechaLocalISO(new Date());
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || modoDemo) return;
    // el momento del día puede cambiar (tarde→noche) sin que cambie la fecha —
    // se refresca siempre, fuera del early-return de "mismo día" de abajo.
    aplicarMomentoDelDia();
    var hoyISOAhora = E.fechaLocalISO(new Date());
    if (hoyISOAhora === ultimoHoyISO) return;
    ultimoHoyISO = hoyISOAhora;
    if (!estado.familia.length) return;
    asegurarPlanVigente();
    diaGlobal = null; // re-ancla la Home en el "hoy" nuevo
    render();
  });

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
    else if (vistaActual === 'compra') cont.innerHTML = UI.renderCompraVista(estado, estado.plan, BANCO, rangoCompra, categoriasAbiertasCompra);
    else if (vistaActual === 'descubrir') cont.innerHTML = UI.renderDescubrirVista(estado, BANCO);
    else if (vistaActual === 'perfil') cont.innerHTML = (vistaPerfil === 'ficha' && personaDraft)
      ? UI.renderVistaMiembro(estado, BANCO, personaDraft, {
          seccion: fichaSeccion, esNueva: fichaEsNueva, guardado: fichaGuardado,
          miembroDispositivoId: obtenerMiembroDispositivo(), color: colorDeMiembro(personaDraft.id)
        })
      : UI.renderPerfilVista(estado);
    else if (vistaActual === 'batch') cont.innerHTML = UI.renderBatch();
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
    // misma razón que el pager de arriba: innerHTML resetea scrollLeft de la tira de
    // 14 días a 0. Además de restaurar, el día activo se centra siempre (Roger 2026-07-26).
    // Sin animación aquí (re-render, no navegación) — el scroll suave al TOCAR un día
    // vive en el handler semana-elegir-dia, antes de llamar a render().
    if (vistaActual === 'semana') {
      var tira = cont.querySelector('.ph-tira-wrap');
      var activa = tira && tira.querySelector('.ph-dia-activo');
      if (tira && activa) {
        // offsetLeft no es relativo al scroller sino al ancestro posicionado — con el
        // chip "Hoy" visible el desfase cambia, así que se mide contra el propio scroller.
        var destino = activa.getBoundingClientRect().left - tira.getBoundingClientRect().left + tira.scrollLeft
          - (tira.clientWidth - activa.offsetWidth) / 2;
        tira.scrollLeft = Math.max(0, Math.min(destino, tira.scrollWidth - tira.clientWidth));
      }
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
    // cada vista empieza arriba — sin esto heredaba el scroll de la anterior y
    // una receta abierta desde media Home aparecía "empezada" (audit 2026-07-20)
    window.scrollTo(0, 0);
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

  var focoAntesDeSheet = null; // a quién devolver el foco al cerrar el sheet (a11y, audit 2026-07-20)

  function abrirSheet(html) {
    if (document.getElementById('sheet-overlay').hidden) focoAntesDeSheet = document.activeElement;
    document.getElementById('sheet-contenido').innerHTML = html;
    document.getElementById('sheet-overlay').hidden = false;
    document.body.classList.add('sheet-open');
    // mover el foco DENTRO del dialog: aria-modal sin foco dentro deja a
    // VoiceOver navegando un árbol vacío (el panel lleva tabindex=-1, ver init)
    var panel = document.querySelector('#sheet-overlay .sheet-panel');
    if (panel) panel.focus();
    refrescarIconos();
  }

  // Sync (Roger 2026-07-19/20, tarea #18): tras abrirSheet(), varios estados de
  // renderSheetSync se re-pintan directamente sobre #sheet-contenido sin pasar
  // por abrirSheet() ni render() — desde el rediseño esos estados también
  // llevan <i data-lucide="…"> (refresh-cw/download/trash-2), así que cada
  // reemplazo necesita su propio refrescarIconos() o el icono se queda vacío.
  function actualizarSheet(html) {
    document.getElementById('sheet-contenido').innerHTML = html;
    refrescarIconos();
  }

  function cerrarSheet() {
    document.getElementById('sheet-overlay').hidden = true;
    document.body.classList.remove('sheet-open');
    document.getElementById('sheet-contenido').innerHTML = '';
    pendienteCambiar = null;
    pendienteRegenerar = null;
    descubrirAbierto = null;
    render(); // por si se marcó compra o se cambió algo mientras el sheet estaba abierto
    // devolver el foco a quien abrió el sheet — best effort: si el render lo
    // reconstruyó (innerHTML nuevo), el nodo viejo ya no está en el documento
    if (focoAntesDeSheet && document.contains(focoAntesDeSheet)) focoAntesDeSheet.focus();
    focoAntesDeSheet = null;
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

  // Etiquetas del nav inferior (backlog-v3 #18): viven en index.html, no en ningun
  // render() -- t() no las toca solo.
  var NAV_KEYS = { semana: 'semana', recetas: 'recetas', descubrir: 'descubrir', compra: 'nav_compra', perfil: 'familia' };
  function actualizarNavLabels() {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      var clave = NAV_KEYS[btn.dataset.vista];
      if (!clave) return;
      var label = btn.querySelector('.nav-label');
      if (label) label.textContent = I18N.t(clave);
    });
  }

  function cerrarMenuHamburguesa() {
    document.getElementById('menu-dropdown').hidden = true;
    document.getElementById('menu-dropdown-overlay').hidden = true;
  }

  function abrirImportarCole() {
    abrirSheet(UI.renderSheetImportarCole(estado));
  }

  function abrirColeSemana() {
    abrirSheet(UI.renderSheetColeSemana(estado));
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
    // Normalización + validación de vocabulario (audit 2026-07-20): puntuarCole
    // compara proteina contra la CATEGORÍA del ingrediente e hidrato contra un
    // vocabulario cerrado, en minúsculas exactas. Un JSON con "Pasta" o "pollo"
    // importaba "bien" pero la señal moría en silencio — la cena podía repetir
    // lo del cole sin que nadie lo notara. No reconocido → null + aviso.
    var PROTEINAS_COLE = { 'carne-blanca': 1, 'carne-roja': 1, 'pescado-blanco': 1, 'pescado-azul': 1, marisco: 1, huevo: 1, legumbre: 1, lacteo: 1 };
    var HIDRATOS_COLE = { pasta: 1, arroz: 1, patata: 1, pan: 1, legumbre: 1 };
    var desconocidos = [];
    Object.keys(datos.dias).forEach(function (f) {
      var d = datos.dias[f] || {};
      var prot = d.proteina ? String(d.proteina).toLowerCase().trim() : null;
      var hid = d.hidrato ? String(d.hidrato).toLowerCase().trim() : null;
      if (prot && !PROTEINAS_COLE[prot]) { desconocidos.push(f + ': proteína "' + d.proteina + '"'); prot = null; }
      if (hid && !HIDRATOS_COLE[hid]) { desconocidos.push(f + ': hidrato "' + d.hidrato + '"'); hid = null; }
      estado.cole.dias[f] = { resumen: d.resumen || '', proteina: prot, hidrato: hid, verdura: d.verdura || null };
    });
    guardarEstado();
    if (desconocidos.length) {
      alert('Menú importado. Aviso: hay valores que el motor no reconoce y no influirán en las cenas:\n' +
        desconocidos.slice(0, 6).join('\n') + (desconocidos.length > 6 ? '\n…' : ''));
    }
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
      // un push local pendiente serializaría un estado anterior a este snapshot
      // y lo escribiría encima en Firestore — se cancela: el remoto es la verdad,
      // y cualquier edición posterior re-dispara su propio push.
      window.E3Sync.cancelarPendiente();
      if (window.E3Sync.cancelarPlanHistoricoPendiente) window.E3Sync.cancelarPlanHistoricoPendiente(); // idem histórico: no escribir un plan local viejo encima del snapshot que acaba de llegar
      remotoListo = true; // también durante la demo — el gate no debe quedarse cerrado (audit 2026-07-20)
      if (modoDemo) { if (remoto) snapshotDuranteDemo = remoto; return; } // no clobbear el ejemplo; se aplica al salir
      if (remoto) {
        estado = Object.assign(estadoVacio(), remoto);
        // el snapshot puede venir de un dispositivo con la app vieja: mismo
        // enganche de migración que cargarEstado (y misma trampa: la versión se
        // lee del remoto crudo, no del fusionado) — si no, la ficha leería
        // `alergias` como texto donde ahora espera un array
        if ((remoto.esquemaVersion || 1) < 2) migrarPersonasV2(estado);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); } catch (e) { /* sin caché local */ } // sin re-disparar guardarRemotoDebounced
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
      actualizarSheet(UI.renderSheetSync({ synced: false }));
      return;
    }
    window.E3Sync.obtenerInfoFamilia(familyId).then(function (info) {
      actualizarSheet(UI.renderSheetSync({ synced: true, nombreFamilia: info.nombreFamilia, code: info.code }));
    }).catch(function () {
      actualizarSheet(UI.renderSheetSync({ synced: false, error: 'No se pudo cargar el estado de sincronización.' }));
    });
  }

  function activarSincronizacion() {
    // sin los scripts de Firebase (CDN bloqueado, file:// sin red) E3Sync no
    // existe — sin este guard el botón moría en "Activando…" con un TypeError
    // solo en consola (audit 2026-07-20). Mismo guard en unirseSincronizacion.
    if (!window.E3Sync) {
      actualizarSheet(UI.renderSheetSync({ synced: false, error: 'No hay conexión con el servicio de sincronización. Revisa la red y vuelve a intentarlo.' }));
      return;
    }
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
      actualizarSheet(UI.renderSheetSync({ synced: true, nombreFamilia: estado.nombreFamilia, code: data.code }));
    }).catch(function (err) {
      actualizarSheet(UI.renderSheetSync({ synced: false, error: 'No se pudo activar: ' + err.message }));
    });
  }

  function rotarCodigo() {
    var btn = document.getElementById('sync-rotar-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }
    window.E3Sync.rotarCodigo().then(function (data) {
      actualizarSheet(UI.renderSheetSync({
        synced: true, nombreFamilia: estado.nombreFamilia, code: data.code,
        aviso: 'Código nuevo listo. El anterior ya no sirve para unirse.'
      }));
    }).catch(function (err) {
      actualizarSheet(UI.renderSheetSync({
        synced: true, nombreFamilia: estado.nombreFamilia, code: '…',
        aviso: 'No se pudo generar: ' + err.message + '. El código anterior sigue siendo válido.'
      }));
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
    actualizarSheet(UI.renderSheetSync({
      confirmarBorrado: true, nombreFamilia: estado.nombreFamilia
    }));
  }

  function confirmarBorrado() {
    var input = document.getElementById('sync-borrar-input');
    if (!input || input.value.trim().toUpperCase() !== 'BORRAR') {
      actualizarSheet(UI.renderSheetSync({
        confirmarBorrado: true, nombreFamilia: estado.nombreFamilia,
        error: 'Escribe BORRAR para confirmar.'
      }));
      return;
    }
    var btn = document.getElementById('sync-borrar-confirmar-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Borrando…'; }
    window.E3Sync.borrarFamilia().then(function () {
      // el listener remoto apunta a un doc que ya no existe: cortarlo antes de
      // que dispare un onChange(null) y app.js crea que el remoto está vacío
      if (desuscribirRemoto) { desuscribirRemoto(); desuscribirRemoto = null; }
      remotoListo = false;
      actualizarSheet(UI.sheetHead('Familia borrada') +
        '<div class="sheet-body"><p class="card-msg">La familia y sus datos ya no están en la nube. ' +
        'Este móvil conserva su copia local: puedes seguir usándolo sin sincronizar, o activar la ' +
        'sincronización otra vez para crear una familia nueva.</p></div>');
    }).catch(function (err) {
      actualizarSheet(UI.renderSheetSync({
        confirmarBorrado: true, nombreFamilia: estado.nombreFamilia,
        error: 'No se pudo borrar: ' + err.message
      }));
    });
  }

  function unirseSincronizacion() {
    if (!window.E3Sync) {
      actualizarSheet(UI.renderSheetSync({ synced: false, error: 'No hay conexión con el servicio de sincronización. Revisa la red y vuelve a intentarlo.' }));
      return;
    }
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
          actualizarSheet(UI.renderSheetSync({ synced: true, nombreFamilia: info.nombreFamilia, code: info.code }));
        });
      });
    }).catch(function (err) {
      actualizarSheet(UI.renderSheetSync({ synced: false, error: 'Código no válido o error de red.' }));
    });
  }

  function regenerarSemanaCompleta() {
    if (!estado.familia.length) { cerrarSheet(); return; }
    // Semilla de regeneración (obra paso 2, bug C: "Regenerar" devolvía SIEMPRE lo mismo, el motor
    // es puro y determinista por diseño). Sube SOLO aquí — el flujo explícito del botón "Regenerar
    // semana" — nunca en generarPlanSiguiente ni en el primer render, que deben seguir siendo
    // deterministas frente al mismo estado.
    estado.semillaRegeneracion = (estado.semillaRegeneracion || 0) + 1;
    estado.plan = E.generarSemana(estado, BANCO, BANCO, 0, null, null, E.fechaLocalISO(new Date()));
    generarPlanSiguiente(); // datos de familia/cole cambiaron — la siguiente no puede quedarse obsoleta
    guardarEstado();
    cerrarSheet(); // ya re-renderiza
  }

  // ---------------------------------------------------------------
  // Landing → wizard (hub de alta) / HOY
  // ---------------------------------------------------------------
  function aterrizarSegunFamilia() {
    if (!estado.familia.length) {
      arrancarOnboarding();
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
    estadoDemo.plan = E.generarSemana(estadoDemo, BANCO, BANCO, 0, null, null, E.fechaLocalISO(new Date()));
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
    // si llegó un snapshot remoto mientras se miraba el ejemplo, aplicarlo ahora
    // (mismo tratamiento que en iniciarEscuchaRemota — el remoto es la verdad)
    if (snapshotDuranteDemo) {
      var versionSnapshot = snapshotDuranteDemo.esquemaVersion || 1;
      estado = Object.assign(estadoVacio(), snapshotDuranteDemo);
      if (versionSnapshot < 2) migrarPersonasV2(estado);
      snapshotDuranteDemo = null;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(estado)); } catch (e) { /* sin caché local */ }
    }
    document.getElementById('demo-banner').hidden = true;
    aterrizarSegunFamilia();
  }

  // ---------------------------------------------------------------
  // Persona — asistente de alta (onboarding) y ficha en Familia
  // ---------------------------------------------------------------
  // Handoff "Alta de persona" (Claude Design, 2026-07-30). Las dos superficies
  // editan LA MISMA persona en curso — `personaDraft` — con las mismas acciones
  // (`persona-set`, `persona-alergia`, `persona-gusto`, `persona-servicio`).
  // Lo único que cambia es quién repinta y cuándo se persiste:
  //   · onboarding → la persona no existe hasta "Añadir otra" / "Ya estamos
  //     todos"; se acumulan en onbMiembros y se escriben de golpe al terminar.
  //   · ficha → borrador sobre un miembro real; se confirma con "Guardar
  //     cambios" (que NO saca de la ficha) o "Guardar y volver a la familia".
  var ONB_PASO_NOMBRE = 1, ONB_PASO_FICHA = 7, ONB_PASO_FIN = 8; // 2-6 = pasos 1-5 de la persona
  var onbPaso = ONB_PASO_NOMBRE;
  var onbNombreFamilia = '';
  var onbRegion = '';
  var onbMiembros = [];

  var personaDraft = null;
  var personaSuperficie = 'onboarding'; // 'onboarding' | 'ficha' — a quién repinta
  var fichaSeccion = null;              // bloque abierto del acordeón (1-5) o null
  var fichaEsNueva = false;
  var fichaGuardado = false;            // confirmación inline "Cambios guardados"
  var fichaGuardadoTimer = null;

  // Mismo color de avatar que le toca en la rejilla de Familia (por posición) —
  // así la ficha no cambia de color respecto a la tarjeta desde la que se abre.
  function colorDeMiembro(id) {
    var i = estado.familia.findIndex(function (m) { return m.id === id; });
    return UI.colorMiembro(i === -1 ? estado.familia.length : i);
  }

  function personaVacia() {
    return {
      id: null, nombre: '', foto: null, sexo: 'mujer', anioNacimiento: null, altura: null, peso: null,
      actividad: 'media', objetivo: 'mantenimiento',
      estilo: '', alergias: [], restricciones: '', gustos: {}, leGusta: '', noLeGusta: '',
      pComida: 'primero-segundo', pCena: 'ligera',
      dieta: 'omnivora', vetos: [], patron: patronPorDefecto()
    };
  }

  // Un miembro guardado antes del handoff no trae los campos nuevos: se
  // completan al abrirlo (mismo criterio que la migración de esquema, pero para
  // los que llegan por sync desde un cliente viejo).
  function normalizarPersona(m) {
    var base = personaVacia();
    var d = Object.assign(base, m || {});
    d.estilo = UI.estiloDeMiembro(d);
    d.alergias = Array.isArray(d.alergias) ? d.alergias.slice() : [];
    d.gustos = Object.assign({}, d.gustos || {});
    d.vetos = Array.isArray(d.vetos) ? d.vetos.slice() : [];
    d.patron = { comida: UI.patronSeguro(d).comida.slice(), cena: UI.patronSeguro(d).cena.slice() };
    return d;
  }

  // ---------------------------------------------------------------
  // Onboarding — render de la pantalla activa
  // ---------------------------------------------------------------
  function mostrarOnboarding() {
    var pantalla = document.getElementById('wizard-screen');
    pantalla.hidden = false;
    document.body.classList.add('wizard-open');
    pantalla.classList.toggle('wizard-screen-paso', onbPaso >= 2 && onbPaso <= 6);
    if (onbPaso === ONB_PASO_NOMBRE) pantalla.innerHTML = UI.renderOnbNombreFamilia(onbNombreFamilia, onbRegion);
    else if (onbPaso === ONB_PASO_FICHA) pantalla.innerHTML = UI.renderOnbFicha(personaDraft, onbMiembros);
    else if (onbPaso === ONB_PASO_FIN) pantalla.innerHTML = UI.renderOnbFin(onbNombreFamilia, onbMiembros);
    else pantalla.innerHTML = UI.renderOnbPersona(onbPaso - 1, personaDraft, onbMiembros.length + 1);
    refrescarIconos();
    // cambiar de paso reinicia el scroll (handoff §Interactions) — el contenedor
    // que scrollea es el interior, no la ventana
    var scroller = pantalla.querySelector('.onb-scroll');
    if (scroller) scroller.scrollTop = 0;
  }

  function arrancarOnboarding() {
    onbPaso = ONB_PASO_NOMBRE;
    onbNombreFamilia = estado.nombreFamilia || '';
    onbRegion = estado.familiaRegion || '';
    onbMiembros = [];
    personaDraft = personaVacia();
    personaSuperficie = 'onboarding';
    mostrarOnboarding();
  }

  function onbFamiliaSiguiente() {
    var el = document.getElementById('onb-nombre-familia');
    onbNombreFamilia = el ? el.value.trim() : '';
    if (!onbNombreFamilia) return; // CTA en gris, sin mensaje de error (handoff)
    onbPaso = 2;
    mostrarOnboarding();
  }

  function onbPersonaSiguiente() {
    var paso = onbPaso - 1;
    if (!UI.pasoPersonaValido(paso, personaDraft)) return;
    onbPaso = onbPaso === 6 ? ONB_PASO_FICHA : onbPaso + 1;
    mostrarOnboarding();
  }

  function onbPersonaAtras() {
    onbPaso = Math.max(ONB_PASO_NOMBRE, onbPaso - 1);
    mostrarOnboarding();
  }

  // "Editar" desde la ficha resumen: salta al paso conservando lo introducido
  function onbFichaEditar(paso) {
    onbPaso = paso + 1;
    mostrarOnboarding();
  }

  // Convierte el borrador en miembro de la familia en curso. Devuelve false si
  // no hay nombre — el asistente no deja llegar aquí sin él, pero "Ya estamos
  // todos" sí puede pulsarse con el borrador a medias.
  function onbCerrarPersona() {
    var nombre = (personaDraft.nombre || '').trim();
    if (!nombre) return false;
    var miembro = Object.assign({}, personaDraft, {
      id: generarId('m'),
      nombre: nombre,
      dieta: UI.estiloADieta(personaDraft.estilo)
    });
    onbMiembros.push(miembro);
    return true;
  }

  function onbAnadirOtra() {
    if (!onbCerrarPersona()) return;
    personaDraft = personaVacia();
    onbPaso = 2;
    mostrarOnboarding();
  }

  function onbQuitarMiembro(id) {
    onbMiembros = onbMiembros.filter(function (m) { return m.id !== id; });
    mostrarOnboarding();
  }

  function onbTerminar() {
    onbCerrarPersona(); // el borrador en pantalla cuenta como una persona más
    if (!onbMiembros.length) return;
    estado.nombreFamilia = onbNombreFamilia.trim();
    estado.familiaRegion = onbRegion || null;
    estado.familia = onbMiembros.slice();
    estado.plan = E.generarSemana(estado, BANCO, BANCO, 0, null, null, E.fechaLocalISO(new Date()));
    generarPlanSiguiente();
    guardarEstado();
    personaDraft = null;
    onbPaso = ONB_PASO_FIN;
    mostrarOnboarding();
  }

  function onbVerSemana() {
    document.getElementById('wizard-screen').hidden = true;
    document.body.classList.remove('wizard-open');
    onbMiembros = [];
    irAVista('semana');
  }

  // ---------------------------------------------------------------
  // Persona — acciones compartidas por las dos superficies
  // ---------------------------------------------------------------
  function repintarPersona() {
    if (personaSuperficie === 'ficha') render();
    else mostrarOnboarding();
  }

  // Escribir en un input NO repinta (perdería el foco a media palabra). Solo se
  // refresca lo que depende del nombre en vivo: la inicial del avatar y el
  // estado del CTA (handoff: el paso 1 solo es válido con nombre).
  function refrescarPersonaLigero() {
    var inicial = (personaDraft && (personaDraft.nombre || '').trim().charAt(0).toUpperCase()) || '?';
    document.querySelectorAll('.onb-cab-avatar, .onb-foto-inicial, .per-foto-inicial').forEach(function (el) {
      if (!el.style.backgroundImage) el.textContent = inicial;
    });
    var titulo = document.querySelector('.per-identidad-nombre');
    if (titulo) titulo.textContent = (personaDraft.nombre || '').trim() || I18N.t('nuevo_miembro');
    var cta = document.querySelector('.onb-cta-midnight');
    if (cta) {
      var valido = UI.pasoPersonaValido(onbPaso - 1, personaDraft);
      cta.classList.toggle('onb-cta-off', !valido);
      if (valido) cta.removeAttribute('aria-disabled'); else cta.setAttribute('aria-disabled', 'true');
    }
  }

  function personaSet(campo, valor) {
    if (!personaDraft) return;
    personaDraft[campo] = valor;
    // el estilo de vida es el único campo del handoff que alimenta al motor hoy
    if (campo === 'estilo') personaDraft.dieta = UI.estiloADieta(valor);
    repintarPersona();
  }

  // Números: coma decimal del teclado iOS → punto; vacío borra el dato (mismo
  // criterio que actualizarCampoMiembro, que ya pagó ese bug).
  var CAMPOS_NUMERICOS = { altura: 1, peso: 1, anioNacimiento: 1 };
  function personaSetTexto(campo, valor) {
    if (!personaDraft) return;
    if (CAMPOS_NUMERICOS[campo]) {
      var n = Number(String(valor).replace(',', '.'));
      if (!valor || isNaN(n)) personaDraft[campo] = null;
      else if (campo === 'anioNacimiento' && (n < 1920 || n > new Date().getFullYear())) return;
      else personaDraft[campo] = n;
    } else personaDraft[campo] = valor;
  }

  function personaToggleAlergia(id) {
    var a = personaDraft.alergias || (personaDraft.alergias = []);
    var i = a.indexOf(id);
    if (i === -1) a.push(id); else a.splice(i, 1);
    repintarPersona();
  }

  // 3 estados por toque: neutro → 1 me encanta → 2 mejor no → neutro
  function personaCicloGusto(id) {
    var g = personaDraft.gustos || (personaDraft.gustos = {});
    var siguiente = ((g[id] || 0) + 1) % 3;
    if (siguiente === 0) delete g[id]; else g[id] = siguiente;
    repintarPersona();
  }

  function personaToggleServicio(tipo, dia) {
    var patron = UI.patronSeguro(personaDraft);
    personaDraft.patron = { comida: patron.comida.slice(), cena: patron.cena.slice() };
    personaDraft.patron[tipo][dia] = personaDraft.patron[tipo][dia] === 'casa' ? 'fuera' : 'casa';
    repintarPersona();
  }

  var TODOS_CASA = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa'];
  function personaServiciosPreset(preset) {
    var patron = UI.patronSeguro(personaDraft);
    var quitar = function (fila, desde, hasta) {
      return fila.map(function (v, i) { return (i >= desde && i <= hasta) ? 'fuera' : v; });
    };
    if (preset === 'comidas-lv') personaDraft.patron = { comida: quitar(patron.comida, 0, 4), cena: patron.cena.slice() };
    else if (preset === 'finde') personaDraft.patron = { comida: quitar(patron.comida, 5, 6), cena: quitar(patron.cena, 5, 6) };
    else personaDraft.patron = { comida: TODOS_CASA.slice(), cena: TODOS_CASA.slice() };
    repintarPersona();
  }

  // ---------------------------------------------------------------
  // Ficha de persona en Familia — borrador + guardado explícito
  // ---------------------------------------------------------------
  function abrirMiembroFicha(id) {
    var m = estado.familia.find(function (x) { return x.id === id; });
    if (!m) return;
    personaDraft = normalizarPersona(m);
    personaSuperficie = 'ficha';
    fichaEsNueva = false;
    fichaSeccion = null;
    fichaGuardado = false;
    miembroAbierto = id;
    vistaPerfil = 'ficha';
    render();
    window.scrollTo(0, 0); // ver irAVista
  }

  // Miembro nuevo desde Familia: se abre la ficha con Básicos ya desplegado
  // (handoff §Interactions) — nadie tiene que adivinar por dónde empezar.
  function nuevoMiembroFicha() {
    personaDraft = personaVacia();
    personaSuperficie = 'ficha';
    fichaEsNueva = true;
    fichaSeccion = 1;
    fichaGuardado = false;
    miembroAbierto = null;
    vistaPerfil = 'ficha';
    render();
    window.scrollTo(0, 0);
  }

  function cerrarMiembroFicha() {
    vistaPerfil = 'lista';
    miembroAbierto = null;
    personaDraft = null;
    personaSuperficie = 'onboarding';
    fichaGuardado = false;
    render();
    window.scrollTo(0, 0); // ver irAVista
  }

  function fichaToggleSeccion(n) {
    fichaSeccion = fichaSeccion === n ? null : n; // solo un bloque abierto a la vez
    render();
  }

  // Escribe el borrador sobre la familia real. Devuelve false si falta el
  // nombre — sin nombre no hay miembro que guardar.
  function fichaPersistir() {
    if (!personaDraft) return false;
    var nombre = (personaDraft.nombre || '').trim();
    if (!nombre) { alert('Ponle un nombre a esta persona antes de guardar.'); return false; }
    personaDraft.nombre = nombre;
    // el bloque Estilo de vida no es obligatorio en la ficha (sí en el asistente):
    // si no se ha tocado, se consolida el que ya implicaba su `dieta` — nunca ''
    personaDraft.estilo = UI.estiloDeMiembro(personaDraft);
    personaDraft.dieta = UI.estiloADieta(personaDraft.estilo);
    if (fichaEsNueva || !personaDraft.id) {
      personaDraft.id = personaDraft.id || generarId('m');
      estado.familia.push(Object.assign({}, personaDraft));
      miembroAbierto = personaDraft.id;
      fichaEsNueva = false;
    } else {
      var i = estado.familia.findIndex(function (x) { return x.id === personaDraft.id; });
      if (i === -1) estado.familia.push(Object.assign({}, personaDraft));
      else estado.familia[i] = Object.assign({}, estado.familia[i], personaDraft);
    }
    guardarEstado();
    return true;
  }

  // "Guardar cambios" persiste y SE QUEDA en la ficha (ajuste pedido por Roger,
  // recogido en el README del handoff): cierra el bloque abierto y muestra la
  // confirmación inline ~1,8 s para poder seguir editando otros bloques.
  function fichaGuardar() {
    if (!fichaPersistir()) return;
    fichaSeccion = null;
    fichaGuardado = true;
    render();
    clearTimeout(fichaGuardadoTimer);
    fichaGuardadoTimer = setTimeout(function () {
      fichaGuardado = false;
      if (vistaPerfil === 'ficha') render();
    }, 1800);
  }

  function fichaGuardarYVolver() {
    if (!fichaPersistir()) return;
    cerrarMiembroFicha();
  }

  function quitarFotoPersona() {
    if (!personaDraft) return;
    personaDraft.foto = null;
    repintarPersona();
  }

  // ---------------------------------------------------------------
  // Foto de miembro — recorte cuadrado centrado + resize + JPEG comprimido
  // (canibalizado de e3foods.html líneas ~1591-1610, adaptado a ES5 sin dependencias)
  // ============================================================
  // Bug real (Roger 2026-07-20): fotos de cámara con orientación EXIF (típico
  // en iPhone — sobre todo apaisadas guardadas con tag de rotación 90°) se
  // veían con la cara desplazada a un lateral. <img>+canvas ignora el EXIF y
  // dibuja el buffer CRUDO sin rotar; el recorte centrado (correcto sobre la
  // foto tal como se VE) caía sobre el encuadre sin rotar, no sobre la cara.
  // createImageBitmap({imageOrientation:'from-image'}) corrige la orientación
  // antes de que el recorte la toque — soportado en Safari/Chrome/Firefox
  // modernos desde 2021; el <img>+FileReader de antes queda como único
  // respaldo si el navegador no lo soporta (mismo resultado que antes, sin
  // el fix, mejor que nada).
  function resizeImageToDataURL(file, maxSize, quality) {
    maxSize = maxSize || 200; quality = quality || 0.7;
    function recortarYExportar(source, w, h) {
      var side = Math.min(w, h);
      var sx = (w - side) / 2, sy = (h - side) / 2;
      var canvas = document.createElement('canvas');
      canvas.width = maxSize; canvas.height = maxSize;
      canvas.getContext('2d').drawImage(source, sx, sy, side, side, 0, 0, maxSize, maxSize);
      if (source.close) source.close(); // libera el ImageBitmap decodificado
      return canvas.toDataURL('image/jpeg', quality);
    }
    return new Promise(function (resolve, reject) {
      if (window.createImageBitmap) {
        createImageBitmap(file, { imageOrientation: 'from-image' }).then(function (bitmap) {
          resolve(recortarYExportar(bitmap, bitmap.width, bitmap.height));
        }).catch(function () { reject(new Error('El archivo no es una imagen válida.')); });
        return;
      }
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('No se pudo leer el archivo.')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('El archivo no es una imagen válida.')); };
        img.onload = function () { resolve(recortarYExportar(img, img.width, img.height)); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  // ---------------------------------------------------------------
  // HOY / SEMANA — presencia, compra, cambiar plato
  // ---------------------------------------------------------------
  function togglePresente(dia, tipoComida, miembroId) {
    var plan = planActivo();
    if (!plan || !plan.dias[dia]) return; // defensa: snapshot antiguo sin planSiguiente con diaGlobal 7-13
    var fecha = plan.dias[dia].fecha;
    // Menor excluido por menú del cole: su ausencia vive en estado.cole, no en
    // ausenciasPuntuales — el toggle no podía cambiar el resultado y solo dejaba
    // una "ausencia fantasma" que reaparecía al quitar el menú (audit 2026-07-20).
    var m = estado.familia.find(function (x) { return x.id === miembroId; });
    if (m && E.excluidoPorCole(estado, m, fecha, tipoComida)) return;
    if (!estado.ausenciasPuntuales[fecha]) estado.ausenciasPuntuales[fecha] = { comida: [], cena: [] };
    var lista = estado.ausenciasPuntuales[fecha][tipoComida] || [];
    var idx = lista.indexOf(miembroId);
    if (idx === -1) lista.push(miembroId); else lista.splice(idx, 1);
    estado.ausenciasPuntuales[fecha][tipoComida] = lista;
    // Bug real (2026-07-21, hallado en uso real de la familia): marcar ausencia solo tocaba
    // ausenciasPuntuales sin recalcular el menú ya generado — las cantidades/kcal se quedaban
    // congeladas en la mesa original (2200+ kcal "por persona" al quedar 1 solo comensal, porque
    // la UI dividía el total ya calculado para 4 entre 1). Re-escala el MISMO plato (nunca elige
    // otro) para quienes están de verdad presentes ahora.
    var slot = plan.dias[dia][tipoComida];
    if (slot && slot.menu) {
      var presentesNuevos = E.presentesEnComida(estado, fecha, dia, tipoComida);
      var menuReescalado = E.reescalarMenuParaPresentes(estado, BANCO, BANCO, slot.menu, presentesNuevos, tipoComida, dia, E.fechaLocalISO(new Date()), null);
      // el menú reescalado trae su propio `resumen` canónico (resolverMenu) — ya no hay que
      // re-colgarle a mano la decoración del menú viejo
      plan.dias[dia][tipoComida] = menuReescalado
        ? { menu: menuReescalado }
        : null; // nadie presente -> hueco vacío, igual que generarSemana
    }
    guardarEstado();
    render();
  }

  // horizonte 2 semanas (Roger 2026-07-18): 'marcados' es siempre el segmento
  // de la semana VIGENTE (hoy/7d comparten array); 'marcadosSiguiente' vive
  // aparte (mismos ids de ingrediente pueden repetirse entre semanas; sin
  // escopar, marcar "pollo" en la lista de esta semana lo marcaría también en
  // la de la que viene) y se promueve solo al rollover (asegurarPlanVigente) —
  // hoy no hay control de UI para marcar directamente sobre la semana
  // siguiente, así que este helper es un alias fijo a 'marcados'.
  function campoMarcados() { return 'marcados'; }

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
    window.scrollTo(0, 0); // ver irAVista
  }

  // Desde el banco de Recetas (Roger 2026-07-19): sin día ni comensales
  // concretos detrás — ver renderVistaRecetaPlantilla. cerrarSheet() primero
  // porque desde el 2026-07-20 también se llama desde dentro del sheet de
  // categoría de Descubrir (tarjetaRecetaGrid reutilizada ahí tal cual) — sin
  // esto el sheet se queda tapando la receta. No-op seguro si no hay sheet
  // abierto (el llamador original, la pestaña Recetas, nunca lo tiene).
  function abrirRecetaBanco(plantillaId) {
    cerrarSheet();
    recetaAbierta = { plantillaId: plantillaId };
    vistaAnterior = vistaActual;
    vistaActual = 'receta';
    render();
    window.scrollTo(0, 0); // ver irAVista
  }

  function cerrarRecetaDetalle() {
    vistaActual = vistaAnterior;
    recetaAbierta = null;
    render();
    window.scrollTo(0, 0); // ver irAVista
  }

  // Feedback loop (P1, 2026-07-16): toque post-comida por slot. Toggle — tocar la
  // misma carita otra vez quita la valoración (arrepentimiento sin fricción).
  function valorarPlato(dia, tipoComida, valor) {
    var plan = planActivo();
    var slot = plan && plan.dias[dia] && plan.dias[dia][tipoComida];
    if (!slot || !slot.menu) return;
    var fecha = plan.dias[dia].fecha;
    var clave = fecha + '_' + tipoComida;
    if (!estado.valoraciones) estado.valoraciones = {};
    var actual = estado.valoraciones[clave];
    if (actual && actual.valor === valor) delete estado.valoraciones[clave];
    else estado.valoraciones[clave] = { principalId: slot.menu.principalId, valor: valor };
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

  // Inserta un menú YA RESUELTO en el slot (dia,tipoComida) del plan activo.
  // v3: E.cambiarPlato ya no devuelve el plan completo reconstruido (v2 sí) —
  // aquí se hace el reemplazo mínimo del único slot que cambió.
  function insertarMenuEnSlot(dia, tipoComida, menu) {
    var plan = planActivo();
    var diaObj = plan.dias[dia];
    var nuevoDia = { fecha: diaObj.fecha, comida: diaObj.comida, cena: diaObj.cena };
    nuevoDia[tipoComida] = { menu: menu };
    var nuevoPlan = { semanaISO: plan.semanaISO, dias: plan.dias.slice() };
    nuevoPlan.dias[dia] = nuevoDia;
    setPlanActivo(nuevoPlan);
    guardarEstado();
  }

  function trasElegirMenuUnico(menu, dia, tipoComida) {
    if (!menu) { alert('No encontramos un plato que encaje con esas condiciones.'); cerrarSheet(); render(); return; }
    insertarMenuEnSlot(dia, tipoComida, menu);
    pendienteRegenerar = { dia: dia, tipoComida: tipoComida };
    abrirSheet(UI.renderConfirmarRegenerar(menu.nombre));
    render();
  }

  // (a) "Otro menú" — el motor reensambla directo, sin lista que navegar a
  // mano (borrador §6, última hora: 3 opciones planas, no una lista + modo).
  function cambiarOtroMenu(dia, tipoComida) {
    var plan = planActivo();
    var slotPrevio = plan && plan.dias[dia] && plan.dias[dia][tipoComida];
    var previoId = slotPrevio && slotPrevio.menu && slotPrevio.menu.principalId;
    var resultado = E.cambiarPlato(estado, plan, dia, tipoComida, { modo: 'otro-menu' }, BANCO, BANCO, E.fechaLocalISO(new Date()));
    var menu = resultado && resultado.menu;
    // Registro de cambios (F1, MOTOR_RECETAS §2): el plato REEMPLAZADO acumula
    // señal suave de "me apetece otra cosa". SOLO en cambios por elección — el
    // modo nevera no registra jamás (necesidad ≠ preferencia, Roger 2026-07-17).
    if (menu && previoId && previoId !== menu.principalId) {
      if (!estado.cambios) estado.cambios = {};
      estado.cambios[previoId] = (estado.cambios[previoId] || 0) + 1;
    }
    trasElegirMenuUnico(menu, dia, tipoComida);
  }

  // (c) "Cambiar solo el acompañamiento" — mantiene el principal. Captura el
  // par (principal, complementaria) cambiado DESDE EL DÍA 1 (borrador §6:
  // "señal futura, solo se captura" — se activa como señal de scoring más
  // adelante, cuando haya datos reales; aquí solo se acumula el contador).
  function cambiarSoloComplementaria(dia, tipoComida) {
    var slotPrevio = planActivo().dias[dia][tipoComida];
    var resultado = E.cambiarPlato(estado, planActivo(), dia, tipoComida, { modo: 'solo-complementaria' }, BANCO, BANCO, E.fechaLocalISO(new Date()));
    var menu = resultado && resultado.menu;
    if (menu && slotPrevio && slotPrevio.menu) {
      if (!estado.paresComplementariaCambiados) estado.paresComplementariaCambiados = {};
      (menu.complementarias || []).forEach(function (cNueva, idx) {
        var cVieja = (slotPrevio.menu.complementarias || [])[idx];
        if (cVieja && cVieja.id !== cNueva.id) {
          var clave = menu.principalId + '|' + cNueva.id;
          estado.paresComplementariaCambiados[clave] = (estado.paresComplementariaCambiados[clave] || 0) + 1;
        }
      });
    }
    trasElegirMenuUnico(menu, dia, tipoComida);
  }

  // (b) Nevera — top-N nativo: hasta 3 menús montables/casi-montables, la
  // familia elige (borrador §6: "enseña, no decide"). Cambios nevera NUNCA
  // se registran (necesidad ≠ preferencia).
  function confirmarNevera(dia, tipoComida) {
    var checks = document.querySelectorAll('#lista-nevera-checks input:checked');
    var disponibles = Array.prototype.map.call(checks, function (c) { return c.value; });
    if (!disponibles.length) { alert('Marca al menos un ingrediente disponible.'); return; }
    var resultado = E.cambiarPlato(estado, planActivo(), dia, tipoComida, { modo: 'nevera', disponibles: disponibles }, BANCO, BANCO, E.fechaLocalISO(new Date()));
    neveraOpcionesActuales = (resultado && resultado.opciones) || [];
    pendienteCambiar = { dia: dia, tipoComida: tipoComida };
    abrirSheet(UI.renderOpcionesNevera(BANCO, neveraOpcionesActuales, dia, tipoComida));
  }

  function elegirOpcionNevera(idx, dia, tipoComida) {
    trasElegirMenuUnico(neveraOpcionesActuales[idx], dia, tipoComida);
  }

  // "¿lo añado a la compra?" de una opción de nevera casi-montable — añade el
  // ingrediente que falta como marcado-pendiente en la lista (mismo mecanismo
  // que cualquier línea de compra, solo que forzada aunque el plan no la pida
  // todavía; el usuario ya expresó la intención de comprarlo).
  function neveraAnadirCompra(idIngrediente) {
    if (!estado.compra) estado.compra = { marcados: [] };
    if (!estado.compra.pendientesManual) estado.compra.pendientesManual = [];
    if (estado.compra.pendientesManual.indexOf(idIngrediente) === -1) estado.compra.pendientesManual.push(idIngrediente);
    guardarEstado();
    alert('Añadido a la lista de la compra.');
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
      setPlanActivo(E.regenerarDesde(estado, planActivo(), pendienteRegenerar.dia + 1, BANCO, BANCO, E.fechaLocalISO(new Date())));
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
    if (campo === 'peso' || campo === 'altura' || campo === 'anioNacimiento') {
      // Sin undefined (audit 2026-07-20): asignar undefined rompía el push a
      // Firestore en silencio (el SDK compat lo rechaza) hasta recargar — vaciar
      // un campo ahora BORRA la clave, como ya hacía quitarFotoMiembro. La coma
      // decimal del teclado iOS ("62,5") se normaliza a punto. El año usa el
      // mismo rango que el form modal: un typo aquí invertía Mifflin (kcal
      // negativas que hundían el objetivo familiar sin ningún NaN visible).
      var n = Number(String(valor).replace(',', '.'));
      if (!valor || isNaN(n)) {
        if (campo === 'anioNacimiento') return; // obligatorio — vacío/typo no pisa el valor bueno
        delete m[campo];
      } else if (campo === 'anioNacimiento' && (n < 1920 || n > new Date().getFullYear())) {
        return;
      } else {
        m[campo] = n;
      }
    } else m[campo] = valor;
    guardarEstado();
  }

  function borrarMiembro(id) {
    if (!confirm('¿Eliminar a este miembro de la familia?')) return;
    estado.familia = estado.familia.filter(function (m) { return m.id !== id; });
    guardarEstado();
    vistaPerfil = 'lista';
    miembroAbierto = null;
    personaDraft = null; // si no, el borrador del miembro borrado seguiría vivo
    personaSuperficie = 'onboarding';
    render();
  }

  // el sheet de categoría de Descubrir vive fuera de render() — si el corazón/
  // ojo se toca ahí dentro, re-pintar el contenido del sheet para que el icono
  // responda: antes el estado cambiaba sin feedback visual y el usuario
  // re-tapeaba deshaciéndolo sin saberlo (audit 2026-07-20).
  function refrescarSheetDescubrir() {
    if (!descubrirAbierto) return;
    var categorias = E.categoriasDescubrir(BANCO, estado, descubrirAbierto.fecha);
    var categoria = categorias[descubrirAbierto.idx];
    if (categoria) actualizarSheet(UI.renderSheetDescubrirCategoria(categoria, estado, BANCO));
  }

  function toggleOcultaReceta(plantillaId) {
    var idx = estado.ocultas.indexOf(plantillaId);
    if (idx === -1) estado.ocultas.push(plantillaId); else estado.ocultas.splice(idx, 1);
    guardarEstado();
    render();
    refrescarSheetDescubrir();
  }

  function toggleFavoritaReceta(plantillaId) {
    var idx = estado.favoritas.indexOf(plantillaId);
    if (idx === -1) estado.favoritas.push(plantillaId); else estado.favoritas.splice(idx, 1);
    guardarEstado();
    render();
    refrescarSheetDescubrir();
  }

  // v3 (tramo 6): una receta propia es una elaboración PRINCIPAL — identidad =
  // su ingrediente principal. Hidrato/verdura ya NO se preguntan (el modelo de
  // 3 ejes fijos desaparece); el ensamblador los añade solo vía compatibilidad
  // (genérica por defecto para propias, ver complementariasCompatibles en
  // engine.js). Sin campo de técnica nuevo — 'plancha' por defecto, la más
  // neutra (cero mandos nuevos de usuario).
  function anadirRecetaPropia() {
    var val = function (id) { return document.getElementById(id).value; };
    var nombre = val('rp-nombre').trim();
    if (!nombre) { alert('Ponle un nombre al plato.'); return; }
    var idProteina = val('rp-proteina');
    if (!idProteina) { alert('Elige un ingrediente principal.'); return; }
    var apta = val('rp-apta').split(',');
    var receta = {
      id: generarId('propia'), nombre: nombre, roles: ['principal'], origen: 'propia', apta: apta,
      tiempo_min: 30, esfuerzo: val('rp-esfuerzo') || 'rapido', ninos: true, tecnicaCoccion: 'plancha', acabado: null,
      grupos: ['proteina'], ingredientes: { eje: 'proteina', opciones: [idProteina], fijos: null },
      pasos: [], foto: null
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
    'menu-ir-batch': function () { irAVista('batch'); },
    'batch-volver': function () { irAVista('semana'); },
    // Sin mapeo de las 5 bases (texto libre) a ids reales de banco.ingredientes --
    // no hay a qué articulo de la compra sumar. Placeholder honesto hasta que
    // exista esa decisión (backlog-v3 #17, cierre de sesion 2026-07-28).
    'batch-anadir-compra': function () {},
    'menu-ir-idioma': function () { abrirSheet(UI.renderSheetIdioma()); },
    'elegir-idioma': function (btn) { if (I18N.setLang(btn.dataset.lang)) { actualizarSheet(UI.renderSheetIdioma()); render(); actualizarNavLabels(); } },
    // confirmación (audit 2026-07-20): regenera las DOS semanas y pierde todos
    // los cambios manuales de plato, sin undo — un tap accidental en el dropdown
    // (el ítem va pegado a "Familia") no debe destruir el menú ya pactado.
    'menu-regenerar-semana': function () {
      abrirSheet(UI.sheetHead('Regenerar menús') +
        '<div class="sheet-body">' +
        '<p class="card-msg">Se recalculan la semana en curso y la siguiente. Los platos que hayáis cambiado a mano se pierden.</p>' +
        '<div class="fila-botones">' +
        '<button type="button" class="btn-secondary" data-action="cerrar-sheet">Cancelar</button>' +
        '<button type="button" class="btn-primary" data-action="regenerar-semana-confirmar">Sí, regenerar</button>' +
        '</div></div>');
    },
    'regenerar-semana-confirmar': function () { regenerarSemanaCompleta(); },
    'menu-importar-cole': function () { abrirImportarCole(); },
    'cole-importar': function () { importarCole(); },
    // confirmación (audit 2026-07-20): descarta el acumulado de importaciones —
    // un dato caro de reproducir (cada JSON sale del prompt de ChatGPT) — y
    // además regenera las dos semanas.
    'cole-borrar': function () {
      abrirSheet(UI.sheetHead('Quitar el menú del cole') +
        '<div class="sheet-body">' +
        '<p class="card-msg">Se quitan todos los días de cole cargados y se recalcula el menú. Para recuperarlos habría que volver a importar el JSON.</p>' +
        '<div class="fila-botones">' +
        '<button type="button" class="btn-secondary" data-action="cerrar-sheet">Cancelar</button>' +
        '<button type="button" class="btn-primary" data-action="cole-borrar-confirmar">Sí, quitarlo</button>' +
        '</div></div>');
    },
    'cole-borrar-confirmar': function () { borrarCole(); },
    // línea "…en el cole" (frase del día, "próximos días"): pantalla de solo lectura
    // (Roger 2026-07-22 — antes abría el formulario de importar/editar JSON, confuso).
    // Importar/editar el JSON sigue en el menú hamburguesa ("Importar menú del cole").
    'ir-cole': function () { abrirColeSemana(); },
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

    // Onboarding (handoff "Alta de persona"): nombre de familia -> asistente de
    // 5 pasos por persona -> ficha resumen -> fin.
    'onb-familia-siguiente': function () { onbFamiliaSiguiente(); },
    'onb-persona-siguiente': function () { onbPersonaSiguiente(); },
    'onb-persona-atras': function () { onbPersonaAtras(); },
    'onb-ficha-editar': function (btn) { onbFichaEditar(Number(btn.dataset.paso)); },
    'onb-anadir-otra': function () { onbAnadirOtra(); },
    'onb-quitar-miembro': function (btn) { onbQuitarMiembro(btn.dataset.id); },
    'onb-terminar': function () { onbTerminar(); },
    'onb-ver-semana': function () { onbVerSemana(); },

    // Controles de persona — los mismos en el asistente y en la ficha de Familia
    'persona-set': function (btn) { personaSet(btn.dataset.campo, btn.dataset.valor); },
    'persona-alergia': function (btn) { personaToggleAlergia(btn.dataset.valor); },
    'persona-sin-alergias': function () { personaDraft.alergias = []; repintarPersona(); },
    'persona-gusto': function (btn) { personaCicloGusto(btn.dataset.valor); },
    'persona-servicio': function (btn) { personaToggleServicio(btn.dataset.tipo, Number(btn.dataset.dia)); },
    'persona-servicios-preset': function (btn) { personaServiciosPreset(btn.dataset.preset); },
    'persona-foto': function () { var el = document.getElementById('onb-foto-input'); if (el) el.click(); },
    'persona-foto-quitar': function () { quitarFotoPersona(); },

    // Ficha de persona en Familia
    'familia-abrir-form-miembro': function () { nuevoMiembroFicha(); },
    'ficha-toggle-sec': function (btn) { fichaToggleSeccion(Number(btn.dataset.sec)); },
    'ficha-guardar': function () { fichaGuardar(); },
    'ficha-guardar-volver': function () { fichaGuardarYVolver(); },
    'ir-compra-hoy': function () { rangoCompra = 'hoy'; irAVista('compra'); },

    'toggle-presente': function (btn) { togglePresente(Number(btn.dataset.dia), btn.dataset.tipo, btn.dataset.miembro); },
    'toggle-compra-item': function (btn) { toggleCompraItem(btn.dataset.id); },
    'vaciar-compra': function () { vaciarCompra(); },
    'segmento-compra': function (btn) { rangoCompra = btn.dataset.rango; render(); },
    'toggle-categoria-compra': function (btn) { var g = btn.dataset.grupo; categoriasAbiertasCompra[g] = !categoriasAbiertasCompra[g]; render(); },
    // tira de 14 días de la Home (Roger 2026-07-19): data-dia-global ya
    // sincronizó diaGlobal antes de llegar aquí (ver dispatcher), así que
    // solo hace falta re-renderizar.
    'semana-elegir-dia': function () { render(); },
    'volver-a-hoy': function () { diaGlobal = null; render(); },
    'filtro-receta': function (btn) { filtroRecetas = btn.dataset.categoria; render(); },
    'recetas-vista': function (btn) { recetasView = btn.dataset.vista; render(); },

    'abrir-receta': function (btn) { abrirRecetaDetalle(Number(btn.dataset.dia), btn.dataset.tipo); },
    'abrir-receta-banco': function (btn) { abrirRecetaBanco(btn.dataset.plantilla); },
    'descubrir-abrir-categoria': function (btn) {
      // la fecha viene estampada en la ficha (data-fecha): recalcular con la
      // fecha del TAP abría la categoría equivocada si la medianoche cruzaba
      // entre el render y el toque (rotación diaria, audit 2026-07-20).
      var fecha = btn.dataset.fecha || E.fechaLocalISO(new Date());
      var idx = Number(btn.dataset.idx);
      var categorias = E.categoriasDescubrir(BANCO, estado, fecha);
      var categoria = categorias[idx];
      if (!categoria) return;
      descubrirAbierto = { fecha: fecha, idx: idx };
      abrirSheet(UI.renderSheetDescubrirCategoria(categoria, estado, BANCO));
    },
    'receta-volver': function () { cerrarRecetaDetalle(); },
    'abrir-miembro-ficha': function (btn) { abrirMiembroFicha(btn.dataset.id); },
    'miembro-volver': function () { cerrarMiembroFicha(); },
    'abrir-resumen-semana': function () { abrirResumenSemana(); },
    'valorar-plato': function (btn) { var plan = planActivo(); if (!plan) return; valorarPlato(E.diaIndexDesdeFecha(plan, btn.dataset.fecha), btn.dataset.tipo, btn.dataset.valor); },
    'abrir-cambiar': function (btn) { abrirCambiar(Number(btn.dataset.dia), btn.dataset.tipo); },
    'cerrar-sheet': function () { cerrarSheet(); },
    'modo-otro-menu': function (btn) { cerrarSheet(); cambiarOtroMenu(Number(btn.dataset.dia), btn.dataset.tipo); },
    'modo-nevera': function (btn) { abrirSheet(UI.renderNevera(estado, BANCO, Number(btn.dataset.dia), btn.dataset.tipo)); },
    'modo-solo-complementaria': function (btn) { cerrarSheet(); cambiarSoloComplementaria(Number(btn.dataset.dia), btn.dataset.tipo); },
    'confirmar-nevera': function (btn) { confirmarNevera(Number(btn.dataset.dia), btn.dataset.tipo); },
    'elegir-opcion-nevera': function (btn) { elegirOpcionNevera(Number(btn.dataset.idx), Number(btn.dataset.dia), btn.dataset.tipo); },
    'nevera-anadir-compra': function (btn) { neveraAnadirCompra(btn.dataset.id); },
    'nevera-quitar': function (btn) { quitarIngredienteNevera(btn.dataset.id); },
    'nevera-voz': function (btn) { activarVozNevera(btn); },
    'regenerar-si': function () { regenerarSiguientes(true); },
    'regenerar-no': function () { regenerarSiguientes(false); },

    'borrar-miembro': function (btn) { borrarMiembro(btn.dataset.id); },
    'marcar-yo-dispositivo': function (btn) { marcarYoDispositivo(btn.dataset.id); },
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
    // Escape cierra dropdown/sheet (a11y + teclado externo en iPad, audit 2026-07-20)
    if (e.key === 'Escape') {
      var dropdown = document.getElementById('menu-dropdown');
      if (dropdown && !dropdown.hidden) { cerrarMenuHamburguesa(); return; }
      var overlay = document.getElementById('sheet-overlay');
      if (overlay && !overlay.hidden) { cerrarSheet(); }
      return;
    }
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var btn = e.target.closest('[role="button"][data-action]');
    if (!btn) return;
    e.preventDefault();
    btn.click();
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (!t) return;

    // foto de la persona en curso (asistente o ficha) — el mismo input en los dos
    if (t.id === 'onb-foto-input') {
      var file = t.files[0]; t.value = '';
      if (!file) return;
      resizeImageToDataURL(file).then(function (dataUrl) {
        if (!personaDraft) return;
        personaDraft.foto = dataUrl;
        repintarPersona();
      }).catch(function (err) { alert('No se pudo procesar la imagen: ' + err.message); });
      return;
    }

    // checkbox de un ingrediente en el sheet "con lo que hay en la nevera"
    if (t.type === 'checkbox' && t.closest('#lista-nevera-checks')) { actualizarNeveraSeleccion(); return; }

    // veto de ingrediente dentro del bloque Alergias: escribe en el BORRADOR
    // (como el resto de la ficha) — se confirma al guardar, no en caliente.
    if (t.dataset && t.dataset.action === 'toggle-veto' && personaDraft) {
      var vetos = personaDraft.vetos || (personaDraft.vetos = []);
      var iv = vetos.indexOf(t.dataset.ingrediente);
      if (t.checked && iv === -1) vetos.push(t.dataset.ingrediente);
      else if (!t.checked && iv !== -1) vetos.splice(iv, 1);
      return;
    }

    // región de la familia en el onboarding (select dispara 'change', no 'input')
    if (t.id === 'onb-region') { onbRegion = t.value; return; }

    // idioma de la app (ficha de miembro, backlog-v3 #19) — ajuste global, no dato
    // de familia: no pasa por actualizarCampoMiembro ni necesita guardarEstado().
    if (t.id === 'mf-idioma-app') { if (I18N.setLang(t.value)) { render(); actualizarNavLabels(); } return; }

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
    if (t.id === 'onb-nombre-familia') {
      onbNombreFamilia = t.value;
      // el CTA se enciende con el primer carácter, sin repintar el campo
      var ctaFam = document.getElementById('onb-cta-familia');
      if (ctaFam) {
        var hayNombre = !!t.value.trim();
        ctaFam.classList.toggle('onb-cta-off', !hayNombre);
        if (hayNombre) ctaFam.removeAttribute('aria-disabled'); else ctaFam.setAttribute('aria-disabled', 'true');
      }
    } else if (t.dataset && t.dataset.personaCampo) {
      // campos de texto/número de la persona en curso: se escriben en el
      // borrador sin repintar (perdería el foco), solo se refresca lo derivado
      personaSetTexto(t.dataset.personaCampo, t.value);
      if (t.dataset.personaCampo === 'nombre') refrescarPersonaLigero();
    } else if (t.id === 'recetas-buscador') {
      // render() restaura por sí mismo el foco/cursor del buscador. Debounce
      // corto (audit 2026-07-20): reconstruir el grid entero (82 tarjetas + sus
      // iconos lucide) por CADA pulsación rozaba el jank en móvil y empeora al
      // crecer el banco — 120ms agrupa la ráfaga de tecleo sin sensación de lag.
      busquedaRecetas = t.value;
      clearTimeout(busquedaTimer);
      busquedaTimer = setTimeout(render, 120);
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
      // focable para recibir el foco al abrir (a11y, ver abrirSheet) sin entrar
      // en el orden de tabulación normal
      var panelSheet = sheetOverlayEl.querySelector('.sheet-panel');
      if (panelSheet) panelSheet.setAttribute('tabindex', '-1');
    }
    // catcher transparente a pantalla completa: tocar fuera del dropdown del
    // hamburguesa lo cierra (el propio dropdown no es hijo suyo, es hermano)
    var menuDropdownOverlayEl = document.getElementById('menu-dropdown-overlay');
    if (menuDropdownOverlayEl) menuDropdownOverlayEl.addEventListener('click', cerrarMenuHamburguesa);
    aplicarMomentoDelDia();
    iniciarEscuchaRemota(); // no-op si este dispositivo no tiene familyId cacheado
    asegurarPlanVigente();
    render();
    actualizarNavLabels();
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
