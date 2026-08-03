/* ============================================================
   e3Foods — app.js
   Init, estado (localStorage), routing de pestañas y wiring de eventos
   (delegación por data-action). ui.js solo construye HTML; aquí se
   decide qué pasa cuando el usuario toca algo.
   ============================================================ */
(function () {
  'use strict';

  var UI = window.E3UI;
  var I18N = window.E3I18n;
  var STORAGE_KEY = 'e3foods_v2';
  var PATRON_DEFAULT = ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa'];

  // ---------------------------------------------------------------
  // MOTOR V6 · conexión NATIVA (bloque 2 de la obra, 2026-08-03)
  // ---------------------------------------------------------------
  // `generarCorrida(familia, semanaISO, 1, banco, config, diario)` es la entrada ÚNICA
  // (spec §15.1) y `estado.plan` es su semana `/2` VERBATIM: ni adaptador, ni espejo, ni
  // «forma de v5». Se genera SEMANA A SEMANA y la memoria NO se persiste jamás — se DERIVA
  // del diario D3 en cada generación (diario → memoria → semana).
  var MOTOR = window.E3MotorV6;
  var BANCO = window.E3_BANCO_V6;
  // las fechas del producto viven en UNA implementación, la de ui.js (E3UI), que también las
  // usa para pintar: dos copias de la misma medida es el patrón de bug nº1 del proyecto
  var fechaLocalISO, lunesDeEstaSemana, fechaISO, semanaIsoDeLunes, fechaDeDia;

  // ---------------------------------------------------------------
  // DIARIO D3 en localStorage (§15.1 · D3_DIARIO_SERVIDO.md) — la pieza sin la cual V6 arranca
  // con memoria FRÍA cada semana y devuelve SIEMPRE el mismo menú. Clave versionada propia,
  // FUERA del blob de estado a propósito (el blob es LWW y el diario se fusiona por clave
  // natural: meterlo dentro haría que un dispositivo machacase las semanas del otro).
  // Tres operaciones y ninguna más, todas del motor: apendizar · podar · fusionar.
  // ---------------------------------------------------------------
  var DIARIO_KEY = 'e3foods_diario_v1';
  var diario = (function () {
    try {
      var raw = JSON.parse(localStorage.getItem(DIARIO_KEY) || 'null');
      return raw && Array.isArray(raw.servicios) ? raw : MOTOR.diario.diarioVacio();
    } catch (e) { return MOTOR.diario.diarioVacio(); }
  })();
  function guardarDiario() {
    try { localStorage.setItem(DIARIO_KEY, JSON.stringify(diario)); } catch (e) { /* sin caché local */ }
  }
  // archivar lo SERVIDO. La poda la hace quien ESCRIBE (D3 §6.2) y es idempotente por la clave
  // natural fecha|servicio: re-archivar la misma semana sustituye, jamás duplica.
  // El hash de las 8 tablas de generación viaja con cada servicio: es lo que hace AUDITABLE el
  // pasado (D3 §5 — con el diario y este hash se re-deriva meses después lo que se sirvió de
  // verdad). Es constante de build, no resultado de una generación: se pregunta al motor, que
  // si no el primer archivado de la sesión —el del arranque, antes de generar nada— iría vacío.
  function archivarSemana(semana) {
    if (!semana || !semana.semana_iso || modoDemo) return;
    diario = MOTOR.diario.podarDiario(
      MOTOR.diario.apendizarSemana(diario, semana, MOTOR.hashGeneracion()), MOTOR.config);
    guardarDiario();
  }
  // el diario que ve una generación: lo archivado + las semanas vivas que aún no lo están (la
  // vigente cuando se genera la siguiente). Mismo criterio que el `historialTemp` de antes.
  function diarioCon(semanasExtra) {
    var d = diario;
    (semanasExtra || []).forEach(function (sem) {
      if (sem && sem.semana_iso) d = MOTOR.diario.apendizarSemana(d, sem, null);
    });
    return d;
  }

  // ---------------------------------------------------------------
  // La familia que come el motor: la FICHA DEL FRONTEND TAL CUAL. `contrato_familia.js` es la
  // frontera única (sexo mujer/hombre, anioNacimiento, altura, peso, estilo, alergias del
  // vocabulario del front) y traduce una sola vez — por eso aquí no se traduce nada.
  //   · `ausencias_fijas`: el patrón de la ficha (casa | fuera) + las ausencias PUNTUALES de
  //     esa semana + los mediodías con menú del cole de los menores. Son de ESA semana, y por
  //     eso la familia se compone por semana: el motor las aplica a todas las que genere.
  //   · `no_gusta`: los gustos marcados en ✕. Un id que el banco no conozca queda INERTE con
  //     aviso, nunca revienta (severidad declarada del contrato).
  // ---------------------------------------------------------------
  function familiaParaSemana(semanaIso) {
    var ausencias = [];
    (estado.familia || []).forEach(function (m) {
      var patron = UI.patronSeguro(m);
      ['comida', 'cena'].forEach(function (turno) {
        for (var d = 0; d < 7; d++) {
          var fecha = fechaDeDia(semanaIso, d + 1);
          var puntual = (estado.ausenciasPuntuales && estado.ausenciasPuntuales[fecha] && estado.ausenciasPuntuales[fecha][turno]) || [];
          var esCole = turno === 'comida' && !!(estado.cole && estado.cole.dias && estado.cole.dias[fecha]) &&
            UI.edadEnAnios(m.anioNacimiento, fecha) < UI.EDAD_MENOR;
          if (patron[turno][d] !== 'casa' || puntual.indexOf(m.id) !== -1 || esCole)
            ausencias.push({ miembro: m.id, slot: (d + 1) + '-' + turno });
        }
      });
    });
    return {
      id: 'familia',
      gobierno: null,
      ausencias_fijas: ausencias,
      anclas: [],
      miembros: (estado.familia || []).map(function (m) {
        var gustos = m.gustos || {};
        return {
          id: m.id, nombre: m.nombre, sexo: m.sexo, anioNacimiento: m.anioNacimiento,
          altura: m.altura, peso: m.peso, actividad: m.actividad || 'media',
          estilo: UI.estiloDeMiembro(m), alergias: (m.alergias || []).slice(),
          objetivo: m.objetivo || 'mantenimiento',
          vetos: (m.vetos || []).slice(),
          no_gusta: Object.keys(gustos).filter(function (k) { return gustos[k] === 2; })
        };
      })
    };
  }

  // Genera UNA semana. Devuelve la semana `/2` verbatim, o null si la familia no es válida
  // para el contrato — que es un error DURO y visible, no un menú degradado en silencio.
  var errorMotor = null;
  function generarSemanaV6(lunesISO, semanasExtra) {
    var iso = semanaIsoDeLunes(lunesISO);
    try {
      var corrida = MOTOR.generarCorrida(familiaParaSemana(iso), iso, 1, BANCO, MOTOR.config, diarioCon(semanasExtra));
      errorMotor = null;
      return corrida.semanas[0];
    } catch (e) {
      // el contrato de familia revienta a propósito ante un dato duro que no casa (§ severidad):
      // se enseña, no se traga. Sin esto la app arrancaría con la semana anterior y nadie sabría.
      errorMotor = e && e.message ? e.message : String(e);
      return null;
    }
  }

  // Banco y motor se cargan siempre antes que este script (index.html). Si falta alguno (404,
  // error de sintaxis tras una edición), fallar VISIBLE en vez de arrancar degradado en
  // silencio — antes había aquí un mini-banco de desarrollo que enmascaraba justo ese fallo de
  // despliegue. Mismo criterio para banco/motor/ui (audit 2026-07-20): un 404 o error de sintaxis
  // dejaba pantalla blanca con el error solo en consola — el fallo silencioso que el guard
  // del banco quiso evitar. No hay banco ni motor de respaldo: sin ellos no se arranca.
  if (!BANCO || !MOTOR || !UI) {
    document.addEventListener('DOMContentLoaded', function () {
      document.body.innerHTML = '<div style="padding:32px 24px;font-family:sans-serif;max-width:480px;margin:0 auto">' +
        '<h1 style="font-size:20px;margin-bottom:12px">No se pudo cargar la aplicación</h1>' +
        '<p>Recarga la página. Si el problema sigue, es un fallo del despliegue (data/banco_v6.js, js/motor_v6.js o js/ui.js no responden).</p></div>';
    });
    return;
  }
  fechaLocalISO = UI.fechaLocalISO;
  lunesDeEstaSemana = UI.lunesDeEstaSemana;
  fechaISO = UI.fechaISO;
  semanaIsoDeLunes = UI.semanaIsoDeLunes;
  fechaDeDia = UI.fechaDeDia;

  // ---------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------
  // Versión de esquema del estado persistido (UPGRADES §6 "localStorage sin versión") — sube
  // cuando el shape de `estado` cambie de una forma que necesite migración activa al cargar.
  // Sube a 3 con el switch a V6 (bloque 2, 3-ago): `plan`/`planSiguiente` dejan de ser el plan
  // de v5 (`{motor, semanaISO, dias[], servicios[]}`) y pasan a ser la semana `e3f-menu-neutro/2`
  // VERBATIM (`{semana_iso, presencia, servicios[14], fallo}`). Mueren con él `historialPrincipales`,
  // `historialPares`, `paresComplementariaCambiados`, `propias` y `semillaRegeneracion`: el
  // historial lo sustituye el diario D3 y las recetas propias eran del banco v3.
  var ESQUEMA_ESTADO = 3;

  function estadoVacio() {
    return { nombreFamilia: '', familiaRegion: null, familia: [], ausenciasPuntuales: {}, plan: null, planSiguiente: null, ocultas: [], favoritas: [], compra: { marcados: [], marcadosSiguiente: [] }, valoraciones: {}, cambios: {}, cole: null, esquemaVersion: ESQUEMA_ESTADO };
  }

  // SIN MIGRACIONES (Roger, 30-jul — sesión de higiene): un estado con esquema anterior
  // al vigente no se migra — se detecta, se resetea limpio y se AVISA (re-onboarding
  // asumido, decisión explícita). Un esquema MAYOR (otro dispositivo con app más nueva
  // escribió primero) se deja tal cual: este cliente no machaca el progreso del nuevo.
  // La versión se lee SIEMPRE del objeto crudo, nunca del fusionado con estadoVacio()
  // (trampa ya pagada: el fusionado trae la versión actual y el legacy se colaría).
  var avisoReinicio = false;

  // Split de la alergia pescado/marisco (handoff 5, 3-ago): 'sin-pescado-marisco'
  // pasa a dos ids, 'sin-pescado' y 'sin-marisco' (ya en el motor, bd_v6/dietas.js).
  // No es un cambio de esquema (ESQUEMA_ESTADO no sube, no hay reset ni aviso de
  // reinicio) — es una normalización de valor dentro del esquema vigente, mismo
  // criterio que el compat 'cole'≈'fuera' de patron: se resuelve marcando los dos
  // ids nuevos, nunca se pierde el dato de que la persona tenía esa alergia.
  function migrarAlergiaPescadoMarisco(familia) {
    (familia || []).forEach(function (m) {
      var a = m.alergias;
      if (!Array.isArray(a) || a.indexOf('sin-pescado-marisco') === -1) return;
      a.splice(a.indexOf('sin-pescado-marisco'), 1);
      ['sin-pescado', 'sin-marisco'].forEach(function (id) { if (a.indexOf(id) === -1) a.push(id); });
    });
  }

  function hidratarEstado(crudo) {
    if (!crudo || typeof crudo !== 'object' || Array.isArray(crudo)) { avisoReinicio = true; return estadoVacio(); }
    if ((crudo.esquemaVersion || 1) < ESQUEMA_ESTADO) { avisoReinicio = true; return estadoVacio(); }
    var hidratado = Object.assign(estadoVacio(), crudo);
    migrarAlergiaPescadoMarisco(hidratado.familia);
    return hidratado;
  }

  function cargarEstado() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return estadoVacio();
      return hidratarEstado(JSON.parse(raw));
    } catch (e) {
      // JSON corrupto (o localStorage roto): reset limpio con aviso, nunca crashear
      avisoReinicio = true;
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
      // congela cada semana como su propio doc plan/{semanaISO}. Con V6 ya NO hace falta
      // serializar un espejo: la semana `/2` canónica ES el formato de persistencia (§15.1) —
      // por eso mueren las cinco funciones de historial de v5, esta incluida.
      if (window.E3Sync.guardarPlanHistoricoDebounced) {
        window.E3Sync.guardarPlanHistoricoDebounced(function () { return [estado.plan, estado.planSiguiente]; });
      }
      // meta/notificaciones (obra auth+push §6.2): resumen mínimo de la compra para el barrido
      // del servidor. Sale de `listaCompra` (§15.2) — bloque 3: hasta entonces no se escribe un
      // resumen inventado, se deja de escribir. El barrido está PAUSED desde el 1-ago.
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
  // Badge de estado de plato por persona (handoff 5, §2): 'comida' | 'cena' | null —
  // qué tarjeta secundaria está desplegada en la card del día activo. Estado de UI
  // puro, nunca persistido; se cierra al cambiar de día/pager/vista o al reabrirse
  // a sí mismo (un solo desplegable a la vez, mismo criterio que el handoff).
  var estadoBadgeAbierto = null;
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
  function diaIndexEnSemana(plan, fechaISOStr) {
    if (!plan || !plan.semana_iso) return -1;
    for (var i = 0; i < 7; i++) if (fechaDeDia(plan.semana_iso, i + 1) === fechaISOStr) return i;
    return -1;
  }
  function diaGlobalDeHoy() {
    var hoyISOStr = fechaLocalISO(new Date());
    var i = diaIndexEnSemana(estado.plan, hoyISOStr);
    if (i !== -1) return i;
    var j = diaIndexEnSemana(estado.planSiguiente, hoyISOStr);
    return j !== -1 ? j + 7 : null;
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
  // el lunes local de una semana `/2` — la semana no guarda fechas, se derivan (§15.1)
  function lunesDe(plan) { return plan && plan.semana_iso ? fechaDeDia(plan.semana_iso, 1) : null; }

  // Genera la semana siguiente pasándole la VIGENTE como diario extra: sin eso la memoria de
  // la semana N+1 no vería lo servido en la N y las dos se parecerían demasiado (la variedad
  // dura cruza la frontera dom→lun, audit 2026-07-20 — ahora la cruza el propio diario).
  function generarPlanSiguiente() {
    if (!estado.plan || !estado.plan.semana_iso) { estado.planSiguiente = null; return; }
    estado.planSiguiente = generarSemanaV6(fechaISO(lunesDe(estado.plan), 7), [estado.plan]);
  }

  // ---------------------------------------------------------------
  // Asegura que hay un plan fresco para la semana en curso + la siguiente ya
  // generada por delante (horizonte 2 semanas, Roger 2026-07-18: la compra del
  // viernes/sábado y la cena del lunes no pueden esperar a que ruede el lunes).
  // ---------------------------------------------------------------
  function asegurarPlanVigente() {
    if (!estado.familia.length) return;
    // OJO: string ISO, no new Date() — pasarle el objeto Date producía "NaN-NaN-NaN" y la
    // comparación de abajo SIEMPRE fallaba: esta rama de rollover corría en CADA carga y
    // vaciaba compra.marcados en cada apertura (bug real, hallado 2026-07-23).
    var lunesActual = lunesDeEstaSemana(fechaLocalISO(new Date()));
    if (!estado.plan || lunesDe(estado.plan) !== lunesActual) {
      // antes de pisar la semana saliente, ARCHIVARLA en el diario: es la materia prima de la
      // memoria (§15.1) y sin este punto V6 volvería a arrancar frío cada lunes.
      if (estado.plan) archivarSemana(estado.plan);
      // poda de datos fechados ya consumidos (audit 2026-07-20): fechas anteriores al lunes
      // vigente no alimentan nada y sin poda crecían para siempre, engordando cada push del
      // sync. valoraciones y cambios NO se tocan: son señal, no higiene.
      Object.keys(estado.ausenciasPuntuales || {}).forEach(function (f) {
        if (f < lunesActual) delete estado.ausenciasPuntuales[f];
      });
      if (estado.cole && estado.cole.dias) {
        Object.keys(estado.cole.dias).forEach(function (f) {
          if (f < lunesActual) delete estado.cole.dias[f];
        });
        if (!Object.keys(estado.cole.dias).length) estado.cole = null;
      }
      // si la semana siguiente ya estaba generada y ahora es la vigente, ASCENDER en vez de
      // regenerar (ya está calculada — cero espera) y arrastrar sus checks de compra.
      if (estado.planSiguiente && lunesDe(estado.planSiguiente) === lunesActual) {
        estado.plan = estado.planSiguiente;
        estado.compra.marcados = estado.compra.marcadosSiguiente || [];
      } else {
        estado.plan = generarSemanaV6(lunesActual);
        estado.compra.marcados = [];
      }
      estado.compra.marcadosSiguiente = [];
      generarPlanSiguiente();
      guardarEstado();
    } else if (!estado.planSiguiente || lunesDe(estado.planSiguiente) !== fechaISO(lunesActual, 7)) {
      generarPlanSiguiente();
      guardarEstado();
    }
  }

  // La pestaña/PWA que sobrevive la medianoche o el fin de semana (audit
  // 2026-07-20): asegurarPlanVigente solo corría en init/snapshot — una pestaña
  // viva cruzaba el lunes con la semana caducada (Compra calculaba sobre el plan
  // viejo) y "hoy" quedaba clavado en el día anterior hasta recargar. Al volver
  // a ser visible, re-evaluar; solo re-renderiza si de verdad cambió el día.
  var ultimoHoyISO = fechaLocalISO(new Date());
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible' || modoDemo) return;
    // el momento del día puede cambiar (tarde→noche) sin que cambie la fecha —
    // se refresca siempre, fuera del early-return de "mismo día" de abajo.
    aplicarMomentoDelDia();
    var hoyISOAhora = fechaLocalISO(new Date());
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
    if (vistaActual === 'semana') cont.innerHTML = UI.renderHome(estado, BANCO, diaGlobalActivo(), pagerIdx, obtenerMiembroDispositivo(), estadoBadgeAbierto);
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
      UI.renderVistaReceta(estado, BANCO, planActivo(), recetaAbierta.dia, recetaAbierta.tipo);
    // aviso de reinicio de esquema (descartable): el estado guardado era de una version
    // anterior o estaba corrupto y se ha empezado de cero — sin migrar, decision de Roger
    // 30-jul. Se antepone a CUALQUIER vista (tambien al onboarding, que es donde aterriza
    // una familia reseteada).
    if (avisoReinicio) cont.insertAdjacentHTML('afterbegin', UI.avisoReinicioHtml());
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
    estadoBadgeAbierto = null;
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
    dropdown.innerHTML = UI.renderMenuHamburguesa(window.E3Sync && !!window.E3Sync.usuarioActual());
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
        // el snapshot puede venir de un dispositivo con la app vieja: mismo trato que
        // cargarEstado (esquema viejo → reset con aviso; NO se re-empuja el vacío —
        // el re-onboarding escribirá el estado nuevo cuando la familia se recree)
        estado = hidratarEstado(remoto);
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
    // V6 es DETERMINISTA puro (spec §0.2): misma familia + mismo diario ⇒ misma semana. Lo que
    // hace que una regeneración devuelva algo distinto es el DIARIO, no una semilla — por eso
    // esta función solo se usa cuando cambia el dato de entrada (familia, cole), nunca como
    // re-roll de lotería. El botón "Regenerar menús" murió con ese razonamiento (dictado 31-jul).
    estado.plan = generarSemanaV6(lunesDeEstaSemana(fechaLocalISO(new Date())));
    generarPlanSiguiente(); // datos de familia/cole cambiaron — la siguiente no puede quedarse obsoleta
    guardarEstado();
    cerrarSheet(); // ya re-renderiza
  }

  // ---------------------------------------------------------------
  // Landing → wizard (hub de alta) / HOY
  // ---------------------------------------------------------------
  // Destino pedido por la URL — hoy solo lo usa el clic en la notificación push, que abre
  // `?tab=compra&rango=hoy` (fcm_options.link del barrido). Se consume UNA vez y se limpia
  // de la barra con replaceState: sin eso, recargar la app volvería a saltar a Compra para
  // siempre. Se lee al aterrizar (no al cargar el script) porque antes del primer snapshot
  // todavía no hay ni familia ni plan que enseñar.
  function destinoDeLaUrl() {
    var p;
    try { p = new URLSearchParams(location.search); } catch (e) { return null; }
    var tab = p.get('tab');
    if (!tab) return null;
    var d = { tab: tab, rango: p.get('rango') };
    p.delete('tab'); p.delete('rango');
    var q = p.toString();
    try { history.replaceState(null, '', location.pathname + (q ? '?' + q : '')); } catch (e) { /* sin history */ }
    return d;
  }

  function aterrizarSegunFamilia() {
    if (!estado.familia.length) {
      arrancarOnboarding();
    } else {
      asegurarPlanVigente();
      var destino = destinoDeLaUrl();
      if (destino && destino.tab === 'compra') {
        if (destino.rango === 'hoy') rangoCompra = 'hoy';
        irAVista('compra');
        return; // irAVista ya renderiza
      }
      render();
    }
  }

  function cerrarLanding() {
    document.getElementById('landing-screen').hidden = true;
    document.body.classList.remove('landing-open');
    aterrizarConSesion();
  }

  // ---------------------------------------------------------------
  // GATE DE CUENTA (obra auth+push, AUTH_PUSH_SPEC — ejecutada 31-jul por orden de Roger).
  // Cuenta obligatoria para USAR la app (dictado §12.2); miembro = ficha sin cuenta. El
  // "mira un ejemplo" sigue sin cuenta. Fuera del gate: un
  // arranque sin Firebase (file:// sin red) — ahí la app se comporta como siempre.
  // ---------------------------------------------------------------
  var accesoCodigoPendiente = null; // código recién acuñado, para la pantalla de código

  function pantallaAcceso() { return document.getElementById('acceso-screen'); }

  function mostrarAcceso(pantalla, opts) {
    opts = opts || {};
    var el = pantallaAcceso();
    if (!el) { aterrizarSegunFamilia(); return; }
    document.getElementById('wizard-screen').hidden = true;
    document.body.classList.add('wizard-open');
    el.hidden = false;
    if (pantalla === 'crear' || pantalla === 'entrar') el.innerHTML = UI.renderAccesoElegir(pantalla, opts.error, opts.aviso);
    else if (pantalla === 'crear-mail' || pantalla === 'entrar-mail') el.innerHTML = UI.renderAccesoMail(pantalla, opts.error, opts.aviso);
    else if (pantalla === 'verificar') {
      var u = window.E3Sync.usuarioActual();
      el.innerHTML = UI.renderRevisaCorreo(u ? u.email : '', opts.aviso);
    } else if (pantalla === 'olvide') el.innerHTML = UI.renderOlvidePassword(opts.enviado);
    else if (pantalla === 'familia') el.innerHTML = UI.renderPasoFamilia(opts.error);
    else if (pantalla === 'codigo') el.innerHTML = UI.renderCodigoFamilia(accesoCodigoPendiente);
    refrescarIconos();
  }

  function ocultarAcceso() {
    var el = pantallaAcceso();
    if (el) { el.hidden = true; el.innerHTML = ''; }
    document.body.classList.remove('wizard-open');
  }

  function aterrizarConSesion() {
    if (!window.E3Sync || !window.E3Sync.esperarSesion) { aterrizarSegunFamilia(); return; }
    window.E3Sync.esperarSesion().then(function (user) {
      // sesion ANONIMA heredada (todos los dispositivos de la era pre-cuentas la tienen
      // persistida): se cierra y se trata como sin sesion — sin esto caerian en la
      // pantalla de verificacion sin email (el proveedor por defecto es password)
      if (user && user.isAnonymous) {
        return window.E3Sync.cerrarSesion().catch(function () { return null; })
          .then(function () { mostrarAcceso('entrar'); });
      }
      if (!user) { mostrarAcceso('entrar'); return; }
      continuarTrasLogin(user);
    });
  }

  function proveedorDe(user) {
    return (user && user.providerData && user.providerData[0] && user.providerData[0].providerId) || 'password';
  }

  function continuarTrasLogin(user) {
    // verificación obligatoria (dictado §12.3) — solo el proveedor password; Google llega
    // verificado. El proxy la exige de verdad (§5.1); esta pantalla es la UX.
    if (proveedorDe(user) === 'password' && !user.emailVerified) { mostrarAcceso('verificar'); return; }
    if (window.E3Sync.getFamilyId()) { entrarEnApp(); return; }
    window.E3Sync.buscarFamiliaPorUid().then(function (fid) {
      if (fid) entrarEnApp(); else mostrarAcceso('familia');
    }).catch(function () { mostrarAcceso('familia'); });
  }

  function entrarEnApp() {
    ocultarAcceso();
    var fid = window.E3Sync.getFamilyId();
    if (!fid) { aterrizarSegunFamilia(); return; }
    var aterrizado = false;
    var unaVez = function () { if (!aterrizado) { aterrizado = true; aterrizarSegunFamilia(); } };
    iniciarEscuchaRemota(unaVez);
    // offline o snapshot lento: arrancar con el estado local cacheado (local-first);
    // cuando llegue el snapshot, el listener re-renderiza como siempre
    setTimeout(function () { if (!remotoListo) unaVez(); }, 2500);
    // push (§6.1): con permiso ya concedido, refrescar token al abrir (throttle 1/día)
    if (window.E3Push) window.E3Push.refrescarSiProcede(fid);
  }

  // Logout: limpia el estado local cacheado (dispositivo compartible, §2) y vuelve al acceso.
  function cerrarSesionYLimpiar() {
    window.E3Sync.cerrarSesion().catch(function () { return null; }).then(function () {
      if (desuscribirRemoto) { desuscribirRemoto(); desuscribirRemoto = null; }
      remotoListo = false;
      estado = estadoVacio();
      diario = MOTOR.diario.diarioVacio();
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(DIARIO_KEY);
      } catch (e) { /* sin storage */ }
      cerrarSheet();
      mostrarAcceso('entrar');
    });
  }

  // ---------------------------------------------------------------
  // Onboarding con familia demo (P1, 2026-07-16): "ver un ejemplo" antes de
  // rellenar nada — familia y semana generadas en memoria, nunca persistidas
  // (guardarEstado/iniciarEscuchaRemota/abrirSheetSync están guardados arriba).
  // Plenamente interactiva: como toda la app lee/escribe el `estado` del
  // closure, tocar avatares o cambiar un plato en la demo funciona igual que
  // en la app real — solo que se descarta entero al salir.
  // ---------------------------------------------------------------
  // La demo la genera el motor REAL, así que la ficha tiene que ser válida para el contrato:
  // altura y peso son OBLIGATORIOS (alimentan Mifflin/Schofield y un `undefined` sale por NaN).
  // Marta vegetariana y Lucas sin gluten no son adorno: son lo que hace que la demo enseñe la
  // MESA MIXTA —el foso #1 del producto— con notas reales del motor en vez de inventadas.
  var DEMO_FAMILIA_DATOS = [
    { nombre: 'Marta', sexo: 'mujer', anioNacimiento: 1985, peso: 62, altura: 165, actividad: 'media', estilo: 'vegetariano', alergias: [] },
    { nombre: 'Javier', sexo: 'hombre', anioNacimiento: 1983, peso: 80, altura: 178, actividad: 'media', estilo: 'de-todo', alergias: [] },
    { nombre: 'Lucas', sexo: 'hombre', anioNacimiento: 2019, peso: 21, altura: 112, actividad: 'media', estilo: 'de-todo', alergias: ['sin-gluten'] }
  ];

  function crearFamiliaDemo() {
    return DEMO_FAMILIA_DATOS.map(function (datos, i) {
      return Object.assign({ id: 'demo-' + i, vetos: [], patron: patronPorDefecto() }, datos);
    });
  }

  // La familia demo la genera el MOTOR REAL, igual que una familia de verdad: desde V6 no hace
  // falta inyectar a mano ni el "N ajustes" ni el "come otra cosa" (lo hacía el handoff 6 porque
  // ningún motor rellenaba esos campos). Las notas tipadas de §9.2 salen solas en cuanto la mesa
  // tiene una restricción — y la demo trae una vegetariana y una celíaca justo para eso.
  function mostrarDemo() {
    estadoAntesDemo = estado;
    var estadoDemo = Object.assign(estadoVacio(), { nombreFamilia: 'Familia Ejemplo', familia: crearFamiliaDemo() });
    estado = estadoDemo;                 // familiaParaSemana lee de `estado`
    estadoDemo.plan = generarSemanaV6(lunesDeEstaSemana(fechaLocalISO(new Date())));
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
      estado = hidratarEstado(snapshotDuranteDemo); // mismo trato que iniciarEscuchaRemota
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
    // una familia reseteada por esquema viejo aterriza AQUI (sin familia -> onboarding):
    // el aviso de reinicio se muestra en el paso 1, no solo en las vistas de la app
    if (avisoReinicio && onbPaso === ONB_PASO_NOMBRE) pantalla.insertAdjacentHTML('afterbegin', UI.avisoReinicioHtml());
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
    estado.plan = generarSemanaV6(lunesDeEstaSemana(fechaLocalISO(new Date())));
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

  // Resumen mínimo evaluable de la compra para meta/notificaciones (§6.2): pendientes =
  // ítems con cantidad real sin marcar (la despensa "¿lo tengo en casa?" no cuenta).
  // Resumen mínimo que lee el barrido del servidor (AUTH_PUSH_SPEC §6.2).
  // ⚠️ POR FECHA, no un número suelto (bug reportado por Roger 01-ago): el aviso habla de
  // "hoy", pero este doc lo escribe el CLIENTE cuando guarda — si solo guardáramos el
  // pendiente de hoy, a medianoche el dato pasa a ser de ayer sin que nadie lo reescriba
  // El resumen de la compra que consume el barrido de push (§6.2 de AUTH_PUSH_SPEC) sale de
  // `listaCompra` (§15.2) — bloque 3. Hasta entonces NO se escribe un resumen inventado: se deja
  // de escribir, que es lo honesto (y el scheduler está PAUSED desde el 1-ago de todas formas).

  // Regeneración AUTOMÁTICA por cambio de estado (dictado Roger 31-jul, obra de encendido):
  // altas/ediciones de miembros y elecciones (vetos, alergias, estilo, gustos, ocultas)
  // recalculan la semana en curso y la siguiente SIN preguntar — los platos cambiados a
  // mano se pierden, decisión explícita. Las señales blandas (favoritas, caritas) NO
  // regeneran: alimentan el scoring de la próxima generación.
  function regenerarPorCambioDeEstado() {
    if (!estado.familia.length || modoDemo || !estado.plan) { guardarEstado(); return; }
    estado.plan = generarSemanaV6(lunesDeEstaSemana(fechaLocalISO(new Date())));
    generarPlanSiguiente();
    guardarEstado();
  }

  // "Guardar cambios" persiste y SE QUEDA en la ficha (ajuste pedido por Roger,
  // recogido en el README del handoff): cierra el bloque abierto y muestra la
  // confirmación inline ~1,8 s para poder seguir editando otros bloques.
  function fichaGuardar() {
    if (!fichaPersistir()) return;
    regenerarPorCambioDeEstado();
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
    regenerarPorCambioDeEstado();
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
    var enElCole = tipoComida === 'comida' && !!(estado.cole && estado.cole.dias && estado.cole.dias[fecha]) &&
      m && UI.edadEnAnios(m.anioNacimiento, fecha) < UI.EDAD_MENOR;
    if (enElCole) return;
    if (!estado.ausenciasPuntuales[fecha]) estado.ausenciasPuntuales[fecha] = { comida: [], cena: [] };
    var lista = estado.ausenciasPuntuales[fecha][tipoComida] || [];
    var idx = lista.indexOf(miembroId);
    if (idx === -1) lista.push(miembroId); else lista.splice(idx, 1);
    estado.ausenciasPuntuales[fecha][tipoComida] = lista;
    // La presencia se CAPTURA aquí y la card la lee al pintar (`comensalesDeSlot`). Re-escalar
    // la ración con la mesa real —mismo plato, mesa distinta— es `reescalarServicio` (§15.4),
    // bloque 3: hoy la card no enseña cantidades, así que no hay número que quede mal.
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

  // ---------------------------------------------------------------
  // CAMBIAR EL PLATO · §15.3 · NEVERA · §15.6 — BLOQUE 3
  // ---------------------------------------------------------------
  // Aquí vivían `insertarMenuEnSlot`, `cambiarOtroMenu`, `cambiarSoloComplementaria`,
  // `confirmarNevera`, `elegirOpcionNevera` y `regenerarSiguientes`. Las seis montaban a mano
  // un plan nuevo desde fuera del motor — exactamente lo que §15.3 prohíbe: `cambiarPlato`
  // re-resuelve SOLO ese slot (T2 con el esqueleto vigente, T3 re-fracciona, T4 re-audita la
  // semana entera) y devuelve `{semana, desvios[]}`; los demás slots quedan VERBATIM. La
  // pregunta "¿regenero los días siguientes?" muere con ella: v5 re-derivaba los slots
  // siguientes y eso es justo lo que la spec retira («la familia pidió cambiar un plato, no
  // media semana»). El sheet se queda a la vista, marcado (ver ui.js).

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
    regenerarPorCambioDeEstado(); // la mesa cambió → semana recalculada sin preguntar (dictado 31-jul)
    vistaPerfil = 'lista';
    miembroAbierto = null;
    personaDraft = null; // si no, el borrador del miembro borrado seguiría vivo
    personaSuperficie = 'onboarding';
    render();
  }

  function toggleOcultaReceta(plantillaId) {
    var idx = estado.ocultas.indexOf(plantillaId);
    if (idx === -1) estado.ocultas.push(plantillaId); else estado.ocultas.splice(idx, 1);
    // elección dura → la semana se recalcula sola (dictado 31-jul); favoritas no (señal blanda)
    regenerarPorCambioDeEstado();
    render();
  }

  function toggleFavoritaReceta(plantillaId) {
    var idx = estado.favoritas.indexOf(plantillaId);
    if (idx === -1) estado.favoritas.push(plantillaId); else estado.favoritas.splice(idx, 1);
    guardarEstado();
    render();
  }

  // Las RECETAS PROPIAS mueren con el banco v3: creaban elaboraciones con esquema e ids de v3
  // que V6 ni sirve ni lista (el formulario ya estaba oculto bajo v5). Volver a tenerlas exige
  // darlas de alta en el banco de verdad, con sus líneas, gramos y alérgenos — que es una alta
  // de `/alta-e3foods`, no un formulario de tres campos.

  // ---------------------------------------------------------------
  // Delegación de eventos
  // ---------------------------------------------------------------
  var ACCIONES = {
    'empezar': function () { cerrarLanding(); },
    'ver-demo': function () { ocultarAcceso(); mostrarDemo(); },
    'salir-demo': function () { salirDemo(); },

    // --- CUENTAS (obra auth+push, 31-jul; dos pantallas desde el handoff 6, 2026-08-03) ---
    'acceso-toggle': function (btn) { mostrarAcceso(btn.dataset.modo); },
    // pantalla 1 (elegir vía) -> pantalla 2 (email/contraseña) y vuelta; y "atrás" de
    // la 1 a la portada (Onboarding.dc.html: acIrMail / acVolverElegir / acAtras).
    'acceso-ir-mail': function (btn) { mostrarAcceso(btn.dataset.modo === 'crear' ? 'crear-mail' : 'entrar-mail'); },
    'acceso-volver-elegir': function (btn) { mostrarAcceso(btn.dataset.modo === 'crear' ? 'crear' : 'entrar'); },
    'acceso-portada': function () {
      ocultarAcceso();
      var landing = document.getElementById('landing-screen');
      if (landing) { landing.hidden = false; document.body.classList.add('landing-open'); }
    },
    'acceso-olvide': function () { mostrarAcceso('olvide'); },
    // vuelve al formulario de email (no a "elegir vía"): quien pidió recuperar
    // contraseña ya estaba tecleando su email, no hace falta que reelija la vía.
    'acceso-volver': function () { mostrarAcceso('entrar-mail'); },
    'acceso-logout': function () { cerrarSesionYLimpiar(); },
    'acceso-google': function () {
      // la política se exige al CREAR (modo crear); un login de cuenta existente no re-consiente
      var esCrear = !!document.getElementById('ac-politica');
      if (esCrear && !document.getElementById('ac-politica').checked) {
        mostrarAcceso('crear', { error: I18N.t('ac_marca_politica') });
        return;
      }
      window.E3Sync.loginGoogle().then(function (user) { continuarTrasLogin(user); })
        .catch(function () { mostrarAcceso(esCrear ? 'crear' : 'entrar', { error: I18N.t('ac_error_red') }); });
    },
    'acceso-enviar': function (btn) {
      var modo = btn.dataset.modo;
      var email = (document.getElementById('ac-email') || {}).value || '';
      var pass = (document.getElementById('ac-pass') || {}).value || '';
      email = email.trim();
      if (!email || !pass) return;
      if (modo === 'crear') {
        var politica = document.getElementById('ac-politica');
        if (politica && !politica.checked) { mostrarAcceso('crear-mail', { error: I18N.t('ac_marca_politica') }); return; }
        if (pass.length < 8) { mostrarAcceso('crear-mail', { error: I18N.t('pass_min') }); return; }
        window.E3Sync.registrarEmail(email, pass)
          .then(function () { mostrarAcceso('verificar'); })
          .catch(function () { mostrarAcceso('crear-mail', { error: I18N.t('ac_error_alta') }); });
      } else {
        window.E3Sync.loginEmail(email, pass)
          .then(function (user) { continuarTrasLogin(user); })
          .catch(function () { mostrarAcceso('entrar-mail', { error: I18N.t('ac_error_generico') }); });
      }
    },
    'recuperar-enviar': function () {
      var email = ((document.getElementById('rec-email') || {}).value || '').trim();
      if (!email) return;
      // copy SIEMPRE genérico (anti-enumeración §7.1): mismo mensaje exista o no la cuenta
      window.E3Sync.enviarResetPassword(email)
        .catch(function () { return null; })
        .then(function () { mostrarAcceso('olvide', { enviado: true }); });
    },
    'verificar-recargar': function () {
      window.E3Sync.recargarUsuario().then(function (user) {
        if (user && user.emailVerified) continuarTrasLogin(user);
        else mostrarAcceso('verificar', { aviso: I18N.t('ver_pendiente') });
      });
    },
    'verificar-reenviar': function () {
      window.E3Sync.reenviarVerificacion()
        .catch(function () { return null; })
        .then(function () { mostrarAcceso('verificar', { aviso: I18N.t('ver_reenviado') }); });
    },
    'familia-crear': function () {
      var nombre = ((document.getElementById('fam-nombre') || {}).value || '').trim();
      var consent = document.getElementById('fam-consent');
      if (!nombre) return;
      if (!consent || !consent.checked) { mostrarAcceso('familia', { error: I18N.t('fam_consent_falta') }); return; }
      estado = Object.assign(estadoVacio(), { nombreFamilia: nombre });
      guardarEstado();
      window.E3Sync.crearFamilia(nombre, { politica: true, salud: true })
        .then(function (data) {
          accesoCodigoPendiente = data.code;
          return window.E3Sync.subirEstadoInicial(estado).catch(function () { return null; });
        })
        .then(function () { remotoListo = true; mostrarAcceso('codigo'); })
        .catch(function (err) { mostrarAcceso('familia', { error: (err && err.message) || I18N.t('ac_error_red') }); });
    },
    'familia-unirse': function () {
      var code = ((document.getElementById('fam-codigo') || {}).value || '').trim().toUpperCase();
      if (!code) return;
      window.E3Sync.unirseFamilia(code)
        .then(function () { entrarEnApp(); })
        .catch(function (err) { mostrarAcceso('familia', { error: (err && err.message) || I18N.t('ac_error_red') }); });
    },
    'familia-codigo-continuar': function () { accesoCodigoPendiente = null; entrarEnApp(); },
    'campana': function () {
      var P = window.E3Push;
      if (!P) return;
      var pantallaC = P.esIosSinInstalar() ? 'ios'
        : P.permiso() === 'denied' ? 'denegado'
        : P.permiso() === 'granted' ? 'activadas' : 'activar';
      abrirSheet(UI.renderSheetCampana(pantallaC));
    },
    'campana-activar': function () {
      var fid = window.E3Sync ? window.E3Sync.getFamilyId() : null;
      if (!window.E3Push || !fid) return;
      window.E3Push.activar(fid)
        .then(function () { actualizarSheet(UI.renderSheetCampana('activadas')); })
        .catch(function () { actualizarSheet(UI.renderSheetCampana(window.E3Push.permiso() === 'denied' ? 'denegado' : 'activar', { aviso: I18N.t('ac_error_red') })); });
    },
    'campana-familia-off': function () {
      var fid = window.E3Sync ? window.E3Sync.getFamilyId() : null;
      if (!window.E3Push || !fid) return;
      window.E3Push.setActivas(fid, false).then(function () { actualizarSheet(UI.renderSheetCampana('activadas', { aviso: I18N.t('campana_familia_off') + ' ✓' })); });
    },
    'campana-familia-on': function () {
      var fid = window.E3Sync ? window.E3Sync.getFamilyId() : null;
      if (!window.E3Push || !fid) return;
      window.E3Push.setActivas(fid, true).then(function () { actualizarSheet(UI.renderSheetCampana('activadas', { aviso: I18N.t('campana_familia_on') + ' ✓' })); });
    },
    'menu-cuenta': function () {
      cerrarMenuHamburguesa();
      var u = window.E3Sync.usuarioActual();
      if (!u) return;
      abrirSheet(UI.renderSheetCuenta({ email: u.email, proveedor: proveedorDe(u) }));
    },
    'cuenta-logout': function () { cerrarSesionYLimpiar(); },
    'cuenta-cambiar-pass': function () {
      var actual = (document.getElementById('cuenta-pass-actual') || {}).value || '';
      var nueva = (document.getElementById('cuenta-pass-nueva') || {}).value || '';
      var u = window.E3Sync.usuarioActual();
      if (!u) return;
      if (nueva.length < 8) { actualizarSheet(UI.renderSheetCuenta({ email: u.email, proveedor: proveedorDe(u) }, { error: I18N.t('pass_min') })); return; }
      window.E3Sync.cambiarPassword(actual, nueva)
        .then(function () { actualizarSheet(UI.renderSheetCuenta({ email: u.email, proveedor: proveedorDe(u) }, { aviso: 'OK' })); })
        .catch(function () { actualizarSheet(UI.renderSheetCuenta({ email: u.email, proveedor: proveedorDe(u) }, { error: I18N.t('ac_error_generico') })); });
    },
    'cuenta-salir-familia': function () {
      var u = window.E3Sync.usuarioActual();
      window.E3Sync.salirDeFamilia().then(function () {
        if (desuscribirRemoto) { desuscribirRemoto(); desuscribirRemoto = null; }
        remotoListo = false;
        estado = estadoVacio();
        try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(DIARIO_KEY); } catch (e) { /* sin storage */ }
        cerrarSheet();
        mostrarAcceso('familia');
      }).catch(function (err) {
        actualizarSheet(UI.renderSheetCuenta({ email: u && u.email, proveedor: proveedorDe(u) }, { error: (err && err.message) || I18N.t('ac_error_red') }));
      });
    },
    'cuenta-borrar': function () {
      var u = window.E3Sync.usuarioActual();
      actualizarSheet(UI.renderSheetCuenta({ email: u && u.email, proveedor: proveedorDe(u) }, { confirmarBorrado: true }));
    },
    'cuenta-borrar-confirmar': function () {
      var input = document.getElementById('cuenta-borrar-input');
      var u = window.E3Sync.usuarioActual();
      if (!input || input.value.trim().toUpperCase() !== 'BORRAR') {
        actualizarSheet(UI.renderSheetCuenta({ email: u && u.email, proveedor: proveedorDe(u) }, { confirmarBorrado: true, error: 'Escribe BORRAR para confirmar.' }));
        return;
      }
      window.E3Sync.borrarCuenta().then(function () {
        estado = estadoVacio();
        try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(DIARIO_KEY); } catch (e) { /* sin storage */ }
        cerrarSheet();
        mostrarAcceso('entrar');
      }).catch(function (err) {
        actualizarSheet(UI.renderSheetCuenta({ email: u && u.email, proveedor: proveedorDe(u) }, { confirmarBorrado: true, error: (err && err.message) || I18N.t('ac_error_red') }));
      });
    },
    'ir-vista': function (btn) { irAVista(btn.dataset.vista); },
    'abrir-menu-hamburguesa': function (btn) { abrirMenuHamburguesa(btn); },
    'menu-ir-familia': function () { irAVista('perfil'); },
    'cerrar-aviso-reinicio': function () {
      avisoReinicio = false;
      var wizard = document.getElementById('wizard-screen');
      if (wizard && !wizard.hidden) mostrarOnboarding(); else render();
    },
    'menu-ir-batch': function () { irAVista('batch'); },
    'batch-volver': function () { irAVista('semana'); },
    // Sin mapeo de las 5 bases (texto libre) a ids reales de banco.ingredientes --
    // no hay a qué articulo de la compra sumar. Placeholder honesto hasta que
    // exista esa decisión (backlog-v3 #17, cierre de sesion 2026-07-28).
    'batch-anadir-compra': function () {},
    'menu-ir-idioma': function () { abrirSheet(UI.renderSheetIdioma()); },
    // Acerca de (dictado Roger 3-ago): version y fecha de puesta en servicio SIEMPRE visibles.
    'menu-acerca-de': function () { abrirSheet(UI.renderAcercaDe()); },
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
    'semana-elegir-dia': function () { estadoBadgeAbierto = null; render(); },
    'volver-a-hoy': function () { diaGlobal = null; estadoBadgeAbierto = null; render(); },
    // Badge de estado de plato (handoff 5, §2): botón hermano del área que abre la
    // receta, nunca anidado (sistema-color.md: "no hereda el clic que abre la
    // receta"). Reabrir el mismo tipo lo cierra; abrir el otro lo sustituye.
    'estado-toggle': function (btn) {
      var tipo = btn.dataset.tipo;
      estadoBadgeAbierto = estadoBadgeAbierto === tipo ? null : tipo;
      render();
    },
    'filtro-receta': function (btn) { filtroRecetas = btn.dataset.categoria; render(); },
    'recetas-vista': function (btn) { recetasView = btn.dataset.vista; render(); },

    'abrir-receta': function (btn) { estadoBadgeAbierto = null; abrirRecetaDetalle(Number(btn.dataset.dia), btn.dataset.tipo); },
    'receta-volver': function () { cerrarRecetaDetalle(); },
    'abrir-miembro-ficha': function (btn) { abrirMiembroFicha(btn.dataset.id); },
    'miembro-volver': function () { cerrarMiembroFicha(); },
    'abrir-resumen-semana': function () { abrirResumenSemana(); },
    'valorar-plato': function (btn) { var plan = planActivo(); if (!plan) return; valorarPlato(diaIndexEnSemana(plan, btn.dataset.fecha), btn.dataset.tipo, btn.dataset.valor); },
    'abrir-cambiar': function (btn) { estadoBadgeAbierto = null; abrirCambiar(Number(btn.dataset.dia), btn.dataset.tipo); },
    'cerrar-sheet': function () { cerrarSheet(); },

    'borrar-miembro': function (btn) { borrarMiembro(btn.dataset.id); },
    'marcar-yo-dispositivo': function (btn) { marcarYoDispositivo(btn.dataset.id); },
    'toggle-oculta-receta': function (btn) { toggleOcultaReceta(btn.dataset.plantilla); },
    'toggle-favorita-receta': function (btn) { toggleFavoritaReceta(btn.dataset.plantilla); }
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
  document.addEventListener('DOMContentLoaded', bootApp);

  function bootApp() {
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
    // Gate de cuenta: la escucha remota solo arranca con SESIÓN válida (sin ella el
    // listener moriría contra las reglas con permission-denied en consola). El warm-up
    // corre con la landing en pantalla; el gate real vive en cerrarLanding.
    if (V5_DEV || !window.E3Sync || !window.E3Sync.esperarSesion) {
      iniciarEscuchaRemota(); // sandbox/flujo antiguo: no-op sin familyId cacheado
    } else {
      window.E3Sync.esperarSesion().then(function (user) {
        if (user && window.E3Sync.getFamilyId()) iniciarEscuchaRemota();
      });
    }
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

  }
})();
