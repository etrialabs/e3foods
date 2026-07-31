/* ============================================================
   e3Foods — push.js (obra auth+push, AUTH_PUSH_SPEC §6 — 2026-07-31)
   Avisos de la lista de la compra: máx. 2/día (10h/17h), JAMÁS marketing
   (dictado §12.5). FCM Web Push + service worker propio
   (firebase-messaging-sw.js). El permiso se pide SIEMPRE tras gesto del
   usuario (un prompt al cargar quema el permiso para siempre).
   E3_VAPID_KEY vive en index.html: sin clave, la campana ni aparece
   (§6.6.5 — mejor oculta que decorativa).
   ============================================================ */
(function () {
  'use strict';

  var TOKEN_KEY = 'e3foods_push_token';
  var REFRESCO_KEY = 'e3foods_push_refresco';

  function vapid() { return (typeof window.E3_VAPID_KEY === 'string' && window.E3_VAPID_KEY) || null; }

  function soportado() {
    return !!(vapid() && 'Notification' in window && 'serviceWorker' in navigator &&
      window.firebase && firebase.messaging && firebase.messaging.isSupported &&
      firebase.messaging.isSupported());
  }

  // iOS Safari sin instalar: los avisos exigen la PWA en pantalla de inicio (§6.6.2)
  function esIosSinInstalar() {
    var ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
    var instalada = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
    return ios && !instalada;
  }

  function permiso() { return ('Notification' in window) ? Notification.permission : 'unsupported'; }

  function idiomaApp() {
    try { return localStorage.getItem('e3foods_lang') || 'es'; } catch (e) { return 'es'; }
  }

  function plataforma() {
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) return 'ios-pwa';
    if (/android/i.test(navigator.userAgent)) return 'android';
    return 'desktop';
  }

  function docToken(familyId, token) {
    return firebase.firestore().collection('families').doc(familyId)
      .collection('pushTokens').doc(token);
  }

  function guardarToken(familyId, token) {
    var uid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;
    // upsert idempotente: el token ES el id del doc (§6.1)
    return docToken(familyId, token).set({
      uid: uid, idioma: idiomaApp(), plataforma: plataforma(),
      creadoEl: firebase.firestore.FieldValue.serverTimestamp(),
      renovadoEl: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).then(function () {
      try { localStorage.setItem(TOKEN_KEY, token); } catch (e) { /* sin storage */ }
    });
  }

  // Activación (SIEMPRE tras gesto): SW → permiso → token → doc en Firestore
  function activar(familyId) {
    if (!soportado()) return Promise.reject(new Error('no soportado'));
    return navigator.serviceWorker.register('firebase-messaging-sw.js').then(function (reg) {
      return Notification.requestPermission().then(function (p) {
        if (p !== 'granted') throw new Error('denegado');
        return firebase.messaging().getToken({ vapidKey: vapid(), serviceWorkerRegistration: reg });
      });
    }).then(function (token) {
      if (!token) throw new Error('sin token');
      return guardarToken(familyId, token);
    });
  }

  // Refresco al abrir con permiso ya concedido (§6.1) — throttle 1/día
  function refrescarSiProcede(familyId) {
    if (!soportado() || permiso() !== 'granted' || !familyId) return Promise.resolve(null);
    var ahora = Date.now();
    try {
      var ultimo = Number(localStorage.getItem(REFRESCO_KEY) || 0);
      if (ahora - ultimo < 24 * 3600 * 1000) return Promise.resolve(null);
      localStorage.setItem(REFRESCO_KEY, String(ahora));
    } catch (e) { /* sin storage: refrescar igualmente */ }
    return navigator.serviceWorker.register('firebase-messaging-sw.js').then(function (reg) {
      return firebase.messaging().getToken({ vapidKey: vapid(), serviceWorkerRegistration: reg });
    }).then(function (token) {
      return token ? guardarToken(familyId, token) : null;
    }).catch(function () { return null; });
  }

  // Logout / salir de familia (§2): borra token FCM + su doc
  function borrarToken() {
    var token = null;
    try { token = localStorage.getItem(TOKEN_KEY); } catch (e) { /* sin storage */ }
    var familyId = window.E3Sync ? window.E3Sync.getFamilyId() : null;
    var borraDoc = (token && familyId)
      ? docToken(familyId, token).delete().catch(function () { return null; })
      : Promise.resolve(null);
    return borraDoc.then(function () {
      try { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(REFRESCO_KEY); } catch (e) { /* sin storage */ }
      return (soportado() && firebase.messaging().deleteToken)
        ? firebase.messaging().deleteToken().catch(function () { return null; })
        : null;
    });
  }

  // Interruptor de FAMILIA (§6.6.4): apaga los avisos para todos sin tocar permisos
  function setActivas(familyId, activas) {
    return firebase.firestore().collection('families').doc(familyId)
      .collection('meta').doc('notificaciones').set({ activas: !!activas }, { merge: true });
  }

  // En primer plano: punto en la campana, sin notificación de sistema duplicada (§6.5)
  function alRecibir(cb) {
    if (!soportado()) return;
    try { firebase.messaging().onMessage(function (payload) { cb(payload); }); } catch (e) { /* sin messaging */ }
  }

  window.E3Push = {
    soportado: soportado,
    esIosSinInstalar: esIosSinInstalar,
    permiso: permiso,
    activar: activar,
    refrescarSiProcede: refrescarSiProcede,
    borrarToken: borrarToken,
    setActivas: setActivas,
    alRecibir: alRecibir
  };
})();
