/* ============================================================
   e3Foods — sync.js
   Capa de sincronización Firestore (multiusuario por código de familia).
   Local-first: localStorage sigue siendo la caché rápida/offline (ver
   app.js guardarEstado/cargarEstado); esta capa empuja los cambios locales
   a Firestore y escucha cambios remotos de otros dispositivos de la misma
   familia. apiKey de Firebase es pública por diseño (no autentica nada por
   sí sola — la seguridad real es Auth + Security Rules server-side).
   ============================================================ */
(function () {
  'use strict';

  var firebaseConfig = {
    apiKey: "AIzaSyAX9i-C7vFOdbA6LdxVuIaSUh-kc77FdhM",
    authDomain: "e3foods.firebaseapp.com",
    projectId: "e3foods",
    storageBucket: "e3foods.firebasestorage.app",
    messagingSenderId: "730055281618",
    appId: "1:730055281618:web:867c3994c2fb264e55160b"
  };
  firebase.initializeApp(firebaseConfig);

  // App Check (2026-07-17): prueba que la llamada viene de la app real, no de un
  // script con un token anónimo válido. El site key es PÚBLICO por diseño (viaja en
  // este mismo fichero, servido por GitHub Pages) — el secreto vive solo en la consola
  // de Firebase. El 2º argumento (true) refresca el token solo antes de que caduque.
  // En local (file:// o localhost) se salta: reCAPTCHA solo autoriza etrialabs.github.io,
  // y la vía oficial para local es un debug token, no meter localhost en la clave.
  var esProduccion = location.hostname === 'etrialabs.github.io';
  if (esProduccion && firebase.appCheck) {
    firebase.appCheck().activate('6LfLMlgtAAAAAEtvyh8EUWgd1hcdMVBZ5X4CYO8p', true);
  }

  var fbAuth = firebase.auth();
  var db = firebase.firestore();
  var API_BASE = "https://e3foods-api-730055281618.europe-west1.run.app";
  var FAMILY_KEY = 'e3foods_v2_family';
  var debounceTimer = null;

  // --- CUENTAS (obra auth+push, AUTH_PUSH_SPEC — ejecutada 31-jul por orden de Roger) ---
  // Fuera signInAnonymously: la cuenta es obligatoria para usar la app (dictado §12.2).
  // El uid pasa de "dispositivo" a "persona con credencial recuperable"; el código de
  // familia sigue siendo el mecanismo de unión. Anonymous se deshabilita en consola con
  // el reset (§8) — esto ya no lo usa ni de respaldo.
  function esperarSesion() {
    return new Promise(function (resolve) {
      var unsub = fbAuth.onAuthStateChanged(function (user) { unsub(); resolve(user); });
    });
  }

  function ensureSignedIn() {
    return esperarSesion().then(function (user) {
      if (!user) throw new Error('sesión requerida');
      return user;
    });
  }

  function idiomaApp() {
    try { return localStorage.getItem('e3foods_lang') || 'es'; } catch (e) { return 'es'; }
  }

  // continueUrl de vuelta a la app (verificación y reset salen del email a la página
  // alojada de Firebase y vuelven aquí)
  function urlDeVuelta() { return location.origin + location.pathname; }

  function registrarEmail(email, pass) {
    return fbAuth.createUserWithEmailAndPassword(email, pass).then(function (cred) {
      fbAuth.languageCode = idiomaApp();
      return cred.user.sendEmailVerification({ url: urlDeVuelta() })
        .catch(function () { /* el reenvío manual queda disponible en la pantalla */ })
        .then(function () { return cred.user; });
    });
  }

  function reenviarVerificacion() {
    var u = fbAuth.currentUser;
    if (!u) return Promise.reject(new Error('sesión requerida'));
    fbAuth.languageCode = idiomaApp();
    return u.sendEmailVerification({ url: urlDeVuelta() });
  }

  function loginEmail(email, pass) {
    return fbAuth.signInWithEmailAndPassword(email, pass).then(function (c) { return c.user; });
  }

  // Popup, no redirect: con authDomain (e3foods.firebaseapp.com) distinto del dominio de la
  // app, signInWithRedirect está roto en Safari/iOS por partición de almacenamiento (§1.2).
  function loginGoogle() {
    return fbAuth.signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .then(function (c) { return c.user; });
  }

  function enviarResetPassword(email) {
    fbAuth.languageCode = idiomaApp();
    return fbAuth.sendPasswordResetEmail(email, { url: urlDeVuelta() });
  }

  function recargarUsuario() {
    var u = fbAuth.currentUser;
    return u ? u.reload().then(function () { return fbAuth.currentUser; }) : Promise.resolve(null);
  }

  function usuarioActual() { return fbAuth.currentUser; }

  function cambiarPassword(actual, nueva) {
    var u = fbAuth.currentUser;
    if (!u || !u.email) return Promise.reject(new Error('sesión requerida'));
    var cred = firebase.auth.EmailAuthProvider.credential(u.email, actual);
    return u.reauthenticateWithCredential(cred).then(function () { return u.updatePassword(nueva); });
  }

  function cerrarSesion() {
    // borra el token push de ESTE navegador antes de salir (§2) — best effort
    var pushOff = (window.E3Push && window.E3Push.borrarToken)
      ? window.E3Push.borrarToken().catch(function () { return null; })
      : Promise.resolve(null);
    return pushOff.then(function () {
      try { localStorage.removeItem(FAMILY_KEY); } catch (e) { /* sin storage */ }
      return fbAuth.signOut();
    });
  }

  // Re-vinculación tras login (§2): con cuenta, la familia aparece sola — query permitida
  // por las reglas vivas (era el fallback diseñado; pasa a ser la vía normal).
  function buscarFamiliaPorUid() {
    var u = fbAuth.currentUser;
    if (!u) return Promise.resolve(null);
    return db.collection('families').where('authorizedUids', 'array-contains', u.uid)
      .limit(1).get().then(function (q) {
        if (q.empty) return null;
        setFamilyId(q.docs[0].id);
        return q.docs[0].id;
      });
  }

  function salirDeFamilia() {
    var familyId = getFamilyId();
    if (!familyId) return Promise.reject(new Error('sin familyId'));
    return apiCall('/leave-family', { familyId: familyId }).then(function (data) {
      try { localStorage.removeItem(FAMILY_KEY); } catch (e) { /* no disponible */ }
      return data;
    });
  }

  function borrarCuenta() {
    // el proxy encadena la salida de familia y borra la cuenta con Admin SDK (§5.1);
    // después la sesión local ya no vale — signOut limpia este navegador
    return apiCall('/delete-account', {}).then(function (data) {
      try { localStorage.removeItem(FAMILY_KEY); } catch (e) { /* no disponible */ }
      return fbAuth.signOut().catch(function () { return null; }).then(function () { return data; });
    });
  }

  // El SDK adjunta el token de App Check solo a los servicios de Firebase (Firestore,
  // Auth). El proxy de Cloud Run no es uno: hay que ponerlo a mano en X-Firebase-AppCheck.
  // Si falla, se devuelve null y la llamada sale sin cabecera — el backend decide qué
  // hacer con eso; así un fallo de reCAPTCHA no deja a la familia sin poder operar
  // mientras el enforcement esté en monitor.
  function tokenAppCheck() {
    if (!esProduccion || !firebase.appCheck) return Promise.resolve(null);
    return firebase.appCheck().getToken()
      .then(function (r) { return r && r.token ? r.token : null; })
      .catch(function (err) { console.warn('[appcheck] sin token', err); return null; });
  }

  function apiCall(path, body) {
    return ensureSignedIn()
      .then(function (user) { return Promise.all([user.getIdToken(), tokenAppCheck()]); })
      .then(function (tokens) {
        var headers = { 'Authorization': 'Bearer ' + tokens[0], 'Content-Type': 'application/json' };
        if (tokens[1]) headers['X-Firebase-AppCheck'] = tokens[1];
        return fetch(API_BASE + path, {
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body || {})
        }).then(function (res) {
          return res.json().catch(function () { return {}; }).then(function (data) {
            if (!res.ok) throw new Error(data.error || 'error de red');
            return data;
          });
        });
      });
  }

  function getFamilyId() {
    try { return localStorage.getItem(FAMILY_KEY) || null; } catch (e) { return null; }
  }

  function setFamilyId(id) {
    try { localStorage.setItem(FAMILY_KEY, id); } catch (e) { /* localStorage no disponible */ }
  }

  function crearFamilia(nombreFamilia, consentimiento) {
    // consentimiento (§1.5): {politica:true, salud:true} — la PRUEBA (timestamps+uid) la
    // escribe el proxy en el doc de familia; sin ambos checks el backend devuelve 400.
    return apiCall('/create-family', {
      nombreFamilia: nombreFamilia,
      consentimiento: consentimiento || {}
    }).then(function (data) {
      setFamilyId(data.familyId);
      return data; // {familyId, code}
    });
  }

  function unirseFamilia(code) {
    return apiCall('/join-family', { code: code }).then(function (data) {
      setFamilyId(data.familyId);
      return data; // {familyId}
    });
  }

  function obtenerInfoFamilia(familyId) {
    return db.collection('families').doc(familyId).get().then(function (snap) {
      if (!snap.exists) throw new Error('familia no encontrada');
      var data = snap.data();
      return { nombreFamilia: data.nombreFamilia, code: data.code };
    });
  }

  // Regenera el código de unión. Los móviles ya unidos siguen dentro: el acceso
  // vive en authorizedUids, el código solo sirve para entrar la primera vez.
  function rotarCodigo() {
    var familyId = getFamilyId();
    if (!familyId) return Promise.reject(new Error('sin familyId'));
    return apiCall('/rotate-code', { familyId: familyId }); // {code}
  }

  // Export GDPR — se sirve desde el cliente, sin endpoint: las reglas ya dejan
  // leer todo lo de la familia a un uid autorizado, así que un proxy solo añadiría
  // superficie para leer lo mismo.
  function exportarDatos() {
    var familyId = getFamilyId();
    if (!familyId) return Promise.reject(new Error('sin familyId'));
    var ref = db.collection('families').doc(familyId);
    return ensureSignedIn().then(function () {
      return Promise.all([
        ref.get(),
        ref.collection('meta').doc('estado').get(),
        ref.collection('familia').get(),
        ref.collection('plan').get(),
        ref.collection('meta').doc('historial').get(), // historial v5 (obra de encendido F1.1)
        ref.collection('meta').doc('plan').get(),      // partición 01-ago: plan operacional
        ref.collection('meta').doc('memoria').get()    // partición 01-ago: memoria del motor
      ]);
    }).then(function (r) {
      var familia = r[0].exists ? r[0].data() : {};
      var docsDe = function (q) {
        var out = {};
        q.forEach(function (d) { out[d.id] = d.data(); });
        return out;
      };
      return {
        exportadoEl: new Date().toISOString(),
        familyId: familyId,
        familia: { nombreFamilia: familia.nombreFamilia, code: familia.code, createdAt: familia.createdAt },
        estado: r[1].exists ? r[1].data() : null,
        miembros: docsDe(r[2]),
        planes: docsDe(r[3]),
        historial: r[4].exists ? r[4].data() : null,
        planOperacional: r[5].exists ? r[5].data() : null,
        memoria: r[6].exists ? r[6].data() : null
      };
    });
  }

  function borrarFamilia() {
    var familyId = getFamilyId();
    if (!familyId) return Promise.reject(new Error('sin familyId'));
    return apiCall('/delete-family', { familyId: familyId }).then(function (data) {
      try { localStorage.removeItem(FAMILY_KEY); } catch (e) { /* no disponible */ }
      return data;
    });
  }

  /* ===========================================================================
     PARTICIÓN DEL ESTADO (2026-08-01) — `02_APP/PARTICION_SPEC.md`

     Antes: TODO el estado viajaba como un solo doc `meta/estado`. Medido sobre la
     familia real (147 KB): `plan`+`planSiguiente` son el 86% y la foto de un solo
     miembro 19 KB — marcar un ítem de la compra reescribía los 147 KB enteros, y
     dos dispositivos guardando a la vez se pisaban el documento COMPLETO (LWW).

     Ahora se parte por FRECUENCIA DE ESCRITURA y por quién escribe:
       familia/{memberId}  1 doc por miembro   → editar una ficha no toca el plan
       meta/plan           plan+planSiguiente  → regenerar no toca las fichas
       meta/memoria        valoraciones…       → crece con el uso, aislada
       meta/estado         el residuo pequeño
     Cubierto por las reglas VIVAS (`familia/{memberId}` y el comodín `meta/{doc}`)
     — cero cambio de reglas.

     ⚠️ CONTRATO INNEGOCIABLE: el objeto `estado` EN MEMORIA no cambia de forma.
     Esta capa trocea al escribir y recompone al leer; motor, selector y UI no se
     enteran. `orden` es metadato de persistencia y se retira al recomponer.
     =========================================================================== */

  var CLAVES_PLAN = ['plan', 'planSiguiente'];
  var CLAVES_MEMORIA = ['valoraciones', 'historialPrincipales', 'historialPares',
                        'cambios', 'paresComplementariaCambiados'];

  function subconjunto(obj, claves) {
    var out = {};
    claves.forEach(function (k) { if (obj[k] !== undefined) out[k] = obj[k]; });
    return out;
  }

  // estado en memoria → las 4 parcelas que se persisten
  function trocear(estado) {
    var resto = {};
    Object.keys(estado || {}).forEach(function (k) {
      if (k === 'familia' || CLAVES_PLAN.indexOf(k) >= 0 || CLAVES_MEMORIA.indexOf(k) >= 0) return;
      resto[k] = estado[k];
    });
    return {
      estado: resto,
      plan: subconjunto(estado || {}, CLAVES_PLAN),
      memoria: subconjunto(estado || {}, CLAVES_MEMORIA),
      miembros: (estado && estado.familia) || []
    };
  }

  // cache de dedupe: clave lógica -> JSON de lo último que sabemos que hay en remoto.
  // Se pierde al recargar (igual que el resto de dedupes de este fichero): la 1ª
  // escritura tras cada carga puede repetir un doc idéntico — coste marginal aceptado.
  var ultimoEscrito = {};

  function refFamilia(familyId) { return db.collection('families').doc(familyId); }

  // Escribe SOLO las parcelas que cambiaron, en un batch atómico. Devuelve la promesa
  // del commit (o null si no había nada que escribir).
  function escribirParticion(familyId, estado) {
    var partes = trocear(estado);
    var ref = refFamilia(familyId);
    var batch = db.batch();
    var hay = false;

    ['estado', 'plan', 'memoria'].forEach(function (nombre) {
      var cuerpo = JSON.stringify(partes[nombre]);
      if (ultimoEscrito[nombre] === cuerpo) return;
      ultimoEscrito[nombre] = cuerpo;
      // set() SIN merge a propósito: así el doc queda exactamente con las claves de su
      // parcela — es lo que retira del viejo meta/estado los campos que ahora viven
      // fuera (la migración del blob heredado ocurre sola en la primera escritura).
      batch.set(ref.collection('meta').doc(nombre), partes[nombre]);
      hay = true;
    });

    var idsVivos = {};
    partes.miembros.forEach(function (m, i) {
      if (!m || !m.id) return;
      idsVivos[m.id] = true;
      var doc = Object.assign({}, m, { orden: i }); // `orden` mantiene el roster estable
      var cuerpo = JSON.stringify(doc);
      var clave = 'miembro:' + m.id;
      if (ultimoEscrito[clave] === cuerpo) return;
      ultimoEscrito[clave] = cuerpo;
      batch.set(ref.collection('familia').doc(m.id), doc);
      hay = true;
    });

    // miembro borrado → su doc DEBE morir, o revive en el siguiente dispositivo que lea
    Object.keys(ultimoEscrito).forEach(function (clave) {
      if (clave.indexOf('miembro:') !== 0) return;
      var id = clave.slice('miembro:'.length);
      if (idsVivos[id]) return;
      delete ultimoEscrito[clave];
      batch.delete(ref.collection('familia').doc(id));
      hay = true;
    });

    if (!hay) return null;
    return batch.commit().catch(function (err) {
      console.error('[sync] escribirParticion falló', err);
      ultimoEscrito = {}; // cache envenenada: al próximo intento se reescribe todo
    });
  }

  function subirEstadoInicial(estado) {
    var familyId = getFamilyId();
    if (!familyId) return Promise.reject(new Error('sin familyId'));
    return ensureSignedIn().then(function () {
      return escribirParticion(familyId, estado) || Promise.resolve();
    });
  }

  // getEstado es un GETTER que se evalúa al disparar el timer, no al programarlo:
  // si entre medias llega un snapshot remoto y app.js rebindea su variable de
  // estado, aquí se serializa el estado vigente, no una referencia obsoleta.
  function guardarRemotoDebounced(getEstado) {
    var familyId = getFamilyId();
    if (!familyId) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      debounceTimer = null;
      var estadoActual = typeof getEstado === 'function' ? getEstado() : getEstado;
      escribirParticion(familyId, estadoActual);
    }, 800);
  }

  // descarta un push pendiente — se llama al recibir un snapshot remoto, para no
  // escribir encima un estado anterior a lo que acaba de llegar
  function cancelarPendiente() {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  }

  // Histórico write-behind (obra motor de menús paso 3, 2026-07-23): además del
  // blob meta/estado, cada semana se congela como su propio doc plan/{semanaISO}
  // (decisión+hechos, serializados por E.serializarPlanHistorico). ADITIVO — NO
  // toca meta/estado; la partición completa del blob es el paso 5. Se activa cuanto
  // antes porque el histórico solo existe desde que se escribe (no hay backfill).
  // Las reglas §4 ya permiten write de plan/{semanaISO} a un uid autorizado
  // (idénticas a familia/meta, que llevan meses funcionando). `ultimoPlanHistorico`
  // corta las reescrituras sin cambios reales (un toggle de compra dispara
  // guardarEstado pero no cambia el plan) — se pierde al recargar, así que la 1ª
  // escritura tras cada carga puede repetir el doc idéntico: coste marginal aceptado.
  var planHistoricoTimer = null;
  var ultimoPlanHistorico = {}; // semanaISO -> JSON del último cuerpo escrito
  function guardarPlanHistoricoDebounced(getPlanes) {
    var familyId = getFamilyId();
    if (!familyId) return;
    if (planHistoricoTimer) clearTimeout(planHistoricoTimer);
    planHistoricoTimer = setTimeout(function () {
      planHistoricoTimer = null;
      var planes = typeof getPlanes === 'function' ? getPlanes() : getPlanes;
      (planes || []).forEach(function (plan) {
        if (!plan || !plan.semanaISO) return;
        var cuerpo = JSON.stringify(plan);
        if (ultimoPlanHistorico[plan.semanaISO] === cuerpo) return; // sin cambios reales — no reescribir
        ultimoPlanHistorico[plan.semanaISO] = cuerpo;
        var doc = Object.assign({}, plan, { actualizadoEl: firebase.firestore.FieldValue.serverTimestamp() });
        db.collection('families').doc(familyId).collection('plan').doc(plan.semanaISO).set(doc)
          .catch(function (err) { console.error('[sync] guardarPlanHistorico falló', err); delete ultimoPlanHistorico[plan.semanaISO]; });
      });
    }, 900);
  }

  function cancelarPlanHistoricoPendiente() {
    if (planHistoricoTimer) { clearTimeout(planHistoricoTimer); planHistoricoTimer = null; }
  }

  // Historial v5 (obra de encendido F1.1, 31-jul): doc UNICO meta/historial con forma
  // { semanas: { semanaISO: [...] } }. El write va con set({merge:true}) y SOLO las semanas
  // nuevas/cambiadas: merge por clave hace la union entre dispositivos sola (una semana ya
  // archivada es un hecho cerrado — el motor determinista + el plan compartido por el estado
  // sincronizado garantizan contenido identico si dos dispositivos archivan la misma).
  // Mismo patron debounce+dedupe que plan/{semanaISO}; cubierto por la regla meta/{doc}
  // vigente — sin cambio de reglas. JAMAS dentro del blob meta/estado.
  var historialV5Timer = null;
  var ultimoHistorialV5 = {}; // semanaISO -> JSON del ultimo contenido conocido en remoto
  function guardarHistorialV5Debounced(getSemanas) {
    var familyId = getFamilyId();
    if (!familyId) return;
    if (historialV5Timer) clearTimeout(historialV5Timer);
    historialV5Timer = setTimeout(function () {
      historialV5Timer = null;
      var semanas = typeof getSemanas === 'function' ? getSemanas() : getSemanas;
      var delta = {};
      Object.keys(semanas || {}).forEach(function (k) {
        var cuerpo = JSON.stringify(semanas[k]);
        if (ultimoHistorialV5[k] === cuerpo) return; // ya esta asi en remoto — no reescribir
        ultimoHistorialV5[k] = cuerpo;
        delta[k] = semanas[k];
      });
      if (!Object.keys(delta).length) return;
      db.collection('families').doc(familyId).collection('meta').doc('historial')
        .set({ semanas: delta }, { merge: true })
        .catch(function (err) {
          console.error('[sync] guardarHistorialV5 falló', err);
          Object.keys(delta).forEach(function (k) { delete ultimoHistorialV5[k]; });
        });
    }, 900);
  }

  function cancelarHistorialV5Pendiente() {
    if (historialV5Timer) { clearTimeout(historialV5Timer); historialV5Timer = null; }
  }

  // Siembra la cache de dedupe con lo que YA hay en remoto (snapshot) — sin esto, el primer
  // push tras cada carga reescribiria el mapa entero aunque no haya cambiado nada.
  function marcarHistorialV5Escrito(semanas) {
    Object.keys(semanas || {}).forEach(function (k) { ultimoHistorialV5[k] = JSON.stringify(semanas[k]); });
  }

  // meta/notificaciones (obra auth+push §6.2): el CLIENTE mantiene el resumen minimo
  // evaluable de la compra — {completa, pendientes, semanaISO} — y el barrido del servidor
  // lee ese doc pequeño, jamas el blob. Piggyback del debounce de sync, solo si cambia.
  var notifTimer = null;
  var ultimoNotif = null;
  function guardarNotificacionesDebounced(getResumen) {
    var familyId = getFamilyId();
    if (!familyId) return;
    if (notifTimer) clearTimeout(notifTimer);
    notifTimer = setTimeout(function () {
      notifTimer = null;
      var resumen = typeof getResumen === 'function' ? getResumen() : getResumen;
      if (!resumen) return;
      var cuerpo = JSON.stringify(resumen);
      if (ultimoNotif === cuerpo) return; // sin cambios reales — no reescribir
      ultimoNotif = cuerpo;
      resumen = Object.assign({}, resumen, { actualizadoEl: firebase.firestore.FieldValue.serverTimestamp() });
      db.collection('families').doc(familyId).collection('meta').doc('notificaciones')
        .set({ compra: resumen }, { merge: true }) // `activas` la gobierna la campana, no se pisa
        .catch(function (err) { console.error('[sync] guardarNotificaciones falló', err); ultimoNotif = null; });
    }, 1100);
  }

  function suscribirHistorialV5(familyId, onChange) {
    return db.collection('families').doc(familyId).collection('meta').doc('historial')
      .onSnapshot(function (snap) {
        if (snap.metadata.hasPendingWrites) return; // eco de nuestra propia escritura
        onChange(snap.exists ? (snap.data().semanas || {}) : {});
      }, function (err) { console.error('[sync] listener historial falló', err); });
  }

  // Suscripción a las 4 fuentes de la partición, recomponiendo el MISMO objeto que
  // recibía el caller cuando todo vivía en un doc único (contrato intacto: app.js no
  // sabe que esto está partido). Devuelve una función de baja que las corta todas.
  //
  // Dos garantías que no se pueden relajar:
  //  1. onChange NO se emite hasta que las 4 fuentes han respondido al menos una vez
  //     (incluido "no existe"). Emitir antes reintroduciría la carrera que cerró el
  //     audit del 16-jul: el gate de primer snapshot dejaría pasar un push local
  //     construido sobre una recomposición a medias, y eso BORRA lo que no había
  //     llegado todavía.
  //  2. `null` solo si TODAS están vacías (familia recién creada, nadie ha subido
  //     nada) — es la señal de "el remoto está vacío, empuja el tuyo".
  function suscribirEstado(familyId, onChange) {
    var ref = refFamilia(familyId);
    var vistas = { estado: false, plan: false, memoria: false, familia: false };
    var cache = { estado: null, plan: null, memoria: null, miembros: [] };
    var migrado = false;

    function listas() {
      return vistas.estado && vistas.plan && vistas.memoria && vistas.familia;
    }

    function emitir() {
      if (!listas()) return;
      var vacio = !cache.estado && !cache.plan && !cache.memoria && !cache.miembros.length;
      if (vacio) { onChange(null); return; }
      // BLOB HEREDADO (pre-partición): el meta/estado viejo trae dentro `familia`,
      // `plan`, etc. Se sirve tal cual — ya tiene la forma completa — y la primera
      // escritura lo deja partido y limpio (escribirParticion hace set() sin merge).
      var heredado = cache.estado && cache.estado.familia !== undefined;
      if (heredado) {
        onChange(cache.estado);
        // Migración del blob heredado: se dispara UNA vez, aquí y no en el primer
        // guardado del usuario, para que el corte no dependa de que alguien toque algo.
        // Idempotente y sin carrera real: dos dispositivos escribirían el mismo
        // contenido. El eco de esta escritura se ignora (hasPendingWrites) y el
        // snapshot siguiente ya llega partido.
        if (!migrado) {
          migrado = true;
          console.info('[sync] blob heredado detectado → migrando a partición');
          escribirParticion(familyId, cache.estado);
        }
        return;
      }
      var fusion = Object.assign({}, cache.estado || {}, cache.plan || {}, cache.memoria || {});
      fusion.familia = cache.miembros;
      onChange(fusion);
    }

    function docListener(nombre) {
      return ref.collection('meta').doc(nombre).onSnapshot(function (snap) {
        if (snap.metadata.hasPendingWrites) { vistas[nombre] = true; emitir(); return; } // eco propio
        cache[nombre] = snap.exists ? snap.data() : null;
        if (snap.exists) ultimoEscrito[nombre] = JSON.stringify(cache[nombre]); // siembra el dedupe
        vistas[nombre] = true;
        emitir();
      }, function (err) { console.error('[sync] listener ' + nombre + ' falló', err); });
    }

    var bajas = [
      docListener('estado'),
      docListener('plan'),
      docListener('memoria'),
      ref.collection('familia').onSnapshot(function (q) {
        if (q.metadata.hasPendingWrites) { vistas.familia = true; emitir(); return; }
        var ms = [];
        q.forEach(function (d) {
          var m = d.data();
          ultimoEscrito['miembro:' + d.id] = JSON.stringify(m); // siembra el dedupe
          ms.push(m);
        });
        // `orden` es metadato de persistencia: ordena y SALE del objeto en memoria
        ms.sort(function (a, b) { return (a.orden || 0) - (b.orden || 0); });
        cache.miembros = ms.map(function (m) {
          var copia = Object.assign({}, m); delete copia.orden; return copia;
        });
        vistas.familia = true;
        emitir();
      }, function (err) { console.error('[sync] listener familia falló', err); })
    ];

    return function () { bajas.forEach(function (baja) { try { baja(); } catch (e) { /* ya dada de baja */ } }); };
  }

  window.E3Sync = {
    getFamilyId: getFamilyId,
    esperarSesion: esperarSesion,
    usuarioActual: usuarioActual,
    registrarEmail: registrarEmail,
    reenviarVerificacion: reenviarVerificacion,
    loginEmail: loginEmail,
    loginGoogle: loginGoogle,
    enviarResetPassword: enviarResetPassword,
    recargarUsuario: recargarUsuario,
    cambiarPassword: cambiarPassword,
    cerrarSesion: cerrarSesion,
    buscarFamiliaPorUid: buscarFamiliaPorUid,
    salirDeFamilia: salirDeFamilia,
    borrarCuenta: borrarCuenta,
    crearFamilia: crearFamilia,
    unirseFamilia: unirseFamilia,
    obtenerInfoFamilia: obtenerInfoFamilia,
    rotarCodigo: rotarCodigo,
    exportarDatos: exportarDatos,
    borrarFamilia: borrarFamilia,
    subirEstadoInicial: subirEstadoInicial,
    guardarRemotoDebounced: guardarRemotoDebounced,
    cancelarPendiente: cancelarPendiente,
    guardarPlanHistoricoDebounced: guardarPlanHistoricoDebounced,
    cancelarPlanHistoricoPendiente: cancelarPlanHistoricoPendiente,
    guardarHistorialV5Debounced: guardarHistorialV5Debounced,
    cancelarHistorialV5Pendiente: cancelarHistorialV5Pendiente,
    marcarHistorialV5Escrito: marcarHistorialV5Escrito,
    suscribirHistorialV5: suscribirHistorialV5,
    guardarNotificacionesDebounced: guardarNotificacionesDebounced,
    suscribirEstado: suscribirEstado
  };
})();
