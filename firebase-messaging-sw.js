/* e3Foods — service worker de FCM (obra auth+push, AUTH_PUSH_SPEC §6.5 — 2026-07-31).
   En la RAÍZ de frontend/ a propósito: el scope debe cubrir /e3foods/ entero.
   App cerrada/segundo plano: la notificación la pinta el navegador con el payload
   `webpush.notification` del barrido — aquí solo hace falta inicializar FCM; el click
   abre/enfoca la app en Compra vía fcm_options.link. Sin lógica propia adicional. */
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAX9i-C7vFOdbA6LdxVuIaSUh-kc77FdhM',
  authDomain: 'e3foods.firebaseapp.com',
  projectId: 'e3foods',
  storageBucket: 'e3foods.firebasestorage.app',
  messagingSenderId: '730055281618',
  appId: '1:730055281618:web:867c3994c2fb264e55160b'
});

firebase.messaging();
