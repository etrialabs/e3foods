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

  function apiCall(path, body) {
    return ensureSignedIn().then(function (user) { return user.getIdToken(); }).then(function (token) {
      return fetch(API_BASE + path, {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
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

  function subirEstadoInicial(estado) {
    var familyId = getFamilyId();
    if (!familyId) return Promise.reject(new Error('sin familyId'));
    return ensureSignedIn().then(function () {
      return db.collection('families').doc(familyId).collection('meta').doc('estado').set(estado);
    });
  }

  function guardarRemotoDebounced(estadoActual) {
    var familyId = getFamilyId();
    if (!familyId) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      db.collection('families').doc(familyId).collection('meta').doc('estado')
        .set(estadoActual)
        .catch(function (err) { console.error('[sync] guardarRemoto falló', err); });
    }, 800);
  }

  function suscribirEstado(familyId, onChange) {
    return db.collection('families').doc(familyId).collection('meta').doc('estado')
      .onSnapshot(function (snap) {
        if (snap.metadata.hasPendingWrites) return; // eco de nuestra propia escritura, ignorar
        if (snap.exists) onChange(snap.data());
      }, function (err) { console.error('[sync] listener falló', err); });
  }

  window.E3Sync = {
    getFamilyId: getFamilyId,
    ensureSignedIn: ensureSignedIn,
    crearFamilia: crearFamilia,
    unirseFamilia: unirseFamilia,
    obtenerInfoFamilia: obtenerInfoFamilia,
    subirEstadoInicial: subirEstadoInicial,
    guardarRemotoDebounced: guardarRemotoDebounced,
    suscribirEstado: suscribirEstado
  };
})();
