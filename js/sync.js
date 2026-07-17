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

  function ensureSignedIn() {
    return new Promise(function (resolve, reject) {
      var unsub = fbAuth.onAuthStateChanged(function (user) {
        unsub();
        if (user) return resolve(user);
        fbAuth.signInAnonymously().then(function (cred) { resolve(cred.user); }).catch(reject);
      });
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

  function crearFamilia(nombreFamilia) {
    return apiCall('/create-family', { nombreFamilia: nombreFamilia }).then(function (data) {
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
        ref.collection('plan').get()
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
        planes: docsDe(r[3])
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

  function subirEstadoInicial(estado) {
    var familyId = getFamilyId();
    if (!familyId) return Promise.reject(new Error('sin familyId'));
    return ensureSignedIn().then(function () {
      return db.collection('families').doc(familyId).collection('meta').doc('estado').set(estado);
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
      db.collection('families').doc(familyId).collection('meta').doc('estado')
        .set(estadoActual)
        .catch(function (err) { console.error('[sync] guardarRemoto falló', err); });
    }, 800);
  }

  // descarta un push pendiente — se llama al recibir un snapshot remoto, para no
  // escribir encima un estado anterior a lo que acaba de llegar
  function cancelarPendiente() {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null; }
  }

  function suscribirEstado(familyId, onChange) {
    return db.collection('families').doc(familyId).collection('meta').doc('estado')
      .onSnapshot(function (snap) {
        if (snap.metadata.hasPendingWrites) return; // eco de nuestra propia escritura, ignorar
        // doc inexistente → onChange(null): el caller sabe así que el remoto está
        // vacío (familia recién creada sin estado subido) y puede empujar el suyo
        onChange(snap.exists ? snap.data() : null);
      }, function (err) { console.error('[sync] listener falló', err); });
  }

  window.E3Sync = {
    getFamilyId: getFamilyId,
    crearFamilia: crearFamilia,
    unirseFamilia: unirseFamilia,
    obtenerInfoFamilia: obtenerInfoFamilia,
    rotarCodigo: rotarCodigo,
    exportarDatos: exportarDatos,
    borrarFamilia: borrarFamilia,
    subirEstadoInicial: subirEstadoInicial,
    guardarRemotoDebounced: guardarRemotoDebounced,
    cancelarPendiente: cancelarPendiente,
    suscribirEstado: suscribirEstado
  };
})();
