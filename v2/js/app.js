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

  /* ============================================================
     DEV FALLBACK — se elimina cuando exista data/recetas.js
     Mini-banco de 4 plantillas + ~19 ingredientes para poder probar el
     flujo completo mientras el banco real (data/recetas.js, construido
     en paralelo) no está disponible. Respeta el esquema de SPEC.md.
     (Ampliado de ~15 a ~19 ingredientes: con solo 3 hidratos/3 verduras
     únicos la regla dura de variedad -- SPEC §6.3, no repetir eje ni
     mismo día ni día consecutivo -- agota el pool en 3-4 comidas y deja
     huecos vacíos en la semana. Es una limitación esperable de un banco
     mínimo, no un bug del motor, pero así el flujo de demo es fluido.)
     ============================================================ */
  var DEV_FALLBACK_BANCO = {
    version: 1,
    ingredientes: {
      'pollo': { nombre: 'Pollo', categoria: 'carne-blanca', kcal_100g: 165, racion_adulto_g: 150, racion_nino_g: 90 },
      'pavo': { nombre: 'Pavo', categoria: 'carne-blanca', kcal_100g: 135, racion_adulto_g: 150, racion_nino_g: 90 },
      'ternera': { nombre: 'Ternera', categoria: 'carne-roja', kcal_100g: 250, racion_adulto_g: 150, racion_nino_g: 90 },
      'merluza': { nombre: 'Merluza', categoria: 'pescado-blanco', kcal_100g: 86, racion_adulto_g: 150, racion_nino_g: 100 },
      'salmon': { nombre: 'Salmón', categoria: 'pescado-azul', kcal_100g: 208, racion_adulto_g: 150, racion_nino_g: 100 },
      'lentejas': { nombre: 'Lentejas', categoria: 'legumbre', kcal_100g: 116, racion_adulto_g: 200, racion_nino_g: 130 },
      'garbanzos': { nombre: 'Garbanzos', categoria: 'legumbre', kcal_100g: 164, racion_adulto_g: 200, racion_nino_g: 130 },
      'huevo': { nombre: 'Huevo', categoria: 'huevo', kcal_100g: 155, racion_adulto_g: 100, racion_nino_g: 53 },
      'tofu': { nombre: 'Tofu', categoria: 'otro', kcal_100g: 76, racion_adulto_g: 150, racion_nino_g: 90 },
      'arroz': { nombre: 'Arroz', categoria: 'cereal', kcal_100g: 130, racion_adulto_g: 180, racion_nino_g: 110 },
      'patata': { nombre: 'Patata', categoria: 'tuberculo', kcal_100g: 87, racion_adulto_g: 200, racion_nino_g: 130 },
      'cuscus': { nombre: 'Cuscús', categoria: 'cereal', kcal_100g: 112, racion_adulto_g: 180, racion_nino_g: 110 },
      'brocoli': { nombre: 'Brócoli', categoria: 'verdura', kcal_100g: 35, racion_adulto_g: 200, racion_nino_g: 120 },
      'judias-verdes': { nombre: 'Judías verdes', categoria: 'verdura', kcal_100g: 31, racion_adulto_g: 200, racion_nino_g: 120 },
      'calabacin': { nombre: 'Calabacín', categoria: 'verdura', kcal_100g: 17, racion_adulto_g: 200, racion_nino_g: 120 },
      'pasta': { nombre: 'Pasta', categoria: 'cereal', kcal_100g: 131, racion_adulto_g: 180, racion_nino_g: 110 },
      'boniato': { nombre: 'Boniato', categoria: 'tuberculo', kcal_100g: 90, racion_adulto_g: 200, racion_nino_g: 130 },
      'espinacas': { nombre: 'Espinacas', categoria: 'verdura', kcal_100g: 23, racion_adulto_g: 180, racion_nino_g: 100 },
      'zanahoria': { nombre: 'Zanahoria', categoria: 'verdura', kcal_100g: 41, racion_adulto_g: 150, racion_nino_g: 90 }
    },
    categorias_cuota: {
      'legumbre': { min_sem: 3, max_sem: null },
      'pescado-total': { min_sem: 3, max_sem: null },
      'pescado-azul': { min_sem: 1, max_sem: null },
      'carne-roja': { min_sem: 0, max_sem: 2 },
      'huevo': { min_sem: 3, max_sem: 4 }
    },
    plantillas: [
      {
        id: 'plancha-guarnicion', nombre_patron: '{proteina} a la plancha con {hidrato} y {verdura}', tipo: 'plantilla',
        apta: ['comida', 'cena'], tiempo_min: 25, esfuerzo: 'rapido', ninos: true,
        ejes: { proteina: ['pollo', 'pavo', 'merluza', 'salmon', 'tofu'], hidrato: ['arroz', 'patata', 'cuscus', 'pasta'], verdura: ['brocoli', 'judias-verdes', 'calabacin', 'espinacas'] },
        kcal_extra: 100, pasos: ['Salpimentar la proteína y hacer a la plancha unos minutos por cada lado.', 'Cocer el hidrato según el tipo.', 'Saltear o cocer la verdura al dente.', 'Emplatar los tres juntos con un chorrito de aceite de oliva.'], notas: ''
      },
      {
        id: 'guiso-legumbre', nombre_patron: 'Guiso de {proteina} con verduras', tipo: 'plato-unico',
        apta: ['comida', 'cena'], tiempo_min: 40, esfuerzo: 'medio', ninos: true,
        ejes: { proteina: ['lentejas', 'garbanzos'], verdura: ['judias-verdes', 'calabacin', 'zanahoria'] },
        kcal_extra: 80, pasos: ['Sofreír verduras de la base (cebolla, ajo, pimiento).', 'Añadir la legumbre y la verdura elegida.', 'Cubrir con agua o caldo y cocer a fuego lento.', 'Rectificar de sal y servir caliente.'], notas: ''
      },
      {
        id: 'carne-al-horno', nombre_patron: '{proteina} al horno con {hidrato} y {verdura}', tipo: 'plantilla',
        apta: ['comida', 'cena'], tiempo_min: 45, esfuerzo: 'medio', ninos: true,
        ejes: { proteina: ['ternera', 'pollo'], hidrato: ['patata', 'arroz', 'boniato'], verdura: ['brocoli', 'calabacin', 'zanahoria'] },
        kcal_extra: 120, pasos: ['Precalentar el horno a 200ºC.', 'Colocar la proteína con el hidrato troceado alrededor.', 'Hornear hasta que esté hecho, dando la vuelta a media cocción.', 'Añadir la verdura los últimos 15 minutos o cocerla aparte.'], notas: ''
      },
      {
        id: 'tortilla-patatas', nombre_patron: 'Tortilla de {hidrato} con {proteina}', tipo: 'plato-unico',
        apta: ['comida', 'cena'], tiempo_min: 25, esfuerzo: 'rapido', ninos: true,
        ejes: { proteina: ['huevo'], hidrato: ['patata'] },
        kcal_extra: 150, pasos: ['Cortar la patata en láminas finas y freír u hornear.', 'Batir los huevos y mezclar con la patata.', 'Cuajar la tortilla a fuego medio por ambos lados.', 'Dejar reposar un par de minutos antes de servir.'], notas: ''
      }
    ]
  }; /* FIN DEV FALLBACK */

  var BANCO = window.E3_RECETAS || DEV_FALLBACK_BANCO;

  // ---------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------
  function estadoVacio() {
    return { nombreFamilia: '', familia: [], ausenciasPuntuales: {}, plan: null, ocultas: [], propias: [], compra: { marcados: [] } };
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
  }

  function generarId(prefijo) {
    return prefijo + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function patronPorDefecto() {
    return { comida: PATRON_DEFAULT.slice(), cena: PATRON_DEFAULT.slice() };
  }

  var estado = cargarEstado();
  var vistaActual = 'semana';
  var filtroRecetas = 'todas'; // estado de UI, no persistido (SPEC: filtroRecetas)
  var rangoCompra = '7d'; // '7d' | 'hoy' — estado de UI, no persistido (SPEC: rangoCompra)
  var semanaDiaSeleccionado = null; // índice 0-6 en la vista Semana — estado de UI, no persistido; null = hoy
  var pendienteCambiar = null; // {dia, tipoComida} mientras el sheet de "cambiar" está abierto
  var pendienteRegenerar = null; // {dia, tipoComida} tras un cambio, a la espera de sí/no

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
  // Asegura que hay un plan fresco para la semana en curso
  // ---------------------------------------------------------------
  function asegurarPlanVigente() {
    if (!estado.familia.length) return;
    var lunesActual = E.lunesDeEstaSemana(new Date());
    if (!estado.plan || estado.plan.semanaISO !== lunesActual) {
      estado.plan = E.generarSemana(estado, BANCO);
      guardarEstado();
    }
  }

  // ---------------------------------------------------------------
  // Render de las 4 vistas de primer nivel
  // ---------------------------------------------------------------
  function render() {
    var cont = document.getElementById('vista-' + vistaActual);
    document.querySelectorAll('.vista').forEach(function (v) { v.hidden = (v.id !== 'vista-' + vistaActual); });
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.vista === vistaActual); b.setAttribute('aria-current', b.dataset.vista === vistaActual ? 'page' : 'false'); });
    if (vistaActual === 'semana') cont.innerHTML = UI.renderSemana(estado, estado.plan, BANCO, semanaDiaSeleccionado);
    else if (vistaActual === 'recetas') cont.innerHTML = UI.renderRecetasVista(estado, BANCO, filtroRecetas);
    else if (vistaActual === 'compra') cont.innerHTML = UI.renderCompraVista(estado, estado.plan, BANCO, rangoCompra);
    aplicarDetallesAbiertos(cont);
  }

  function irAVista(nombre) { vistaActual = nombre; render(); }

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
    abrirSheet(UI.renderSheetFamilia(estado, BANCO));
    aplicarDetallesAbiertos(document.getElementById('sheet-contenido'));
  }

  // ---------------------------------------------------------------
  // Landing → wizard (hub de alta) / HOY
  // ---------------------------------------------------------------
  function cerrarLanding() {
    document.getElementById('landing-screen').hidden = true;
    document.body.classList.remove('landing-open');
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

  // ---------------------------------------------------------------
  // Wizard — alta conversacional en 3 pasos: bienvenida (nombre de familia)
  // -> hub (quién vive en casa) -> form (ficha de una persona). Una pregunta
  // por pantalla — ver DOC_FUNCIONAL_SAAS.md §4.1 y el encargo de Roger
  // 2026-07-13 ("así quiero una app": conversacional, no formulario).
  // ---------------------------------------------------------------
  var wizardMiembros = [];
  var wizardNombreFamilia = '';

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
    el.innerHTML = UI.renderWizardBienvenida(wizardNombreFamilia);
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
    estado.familia = wizardMiembros.slice();
    estado.plan = E.generarSemana(estado, BANCO);
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
    abrirSheet('<div class="sheet-head"><h2>' + (existente ? 'Editar miembro' : 'Nuevo miembro') + '</h2>' +
      '<button type="button" class="btn-cerrar" data-action="cerrar-sheet" aria-label="Cerrar">&times;</button></div>' +
      '<div class="sheet-body">' + UI.renderFormMiembroCompleto(existente, !existente) + '</div>');
  }

  // #mf-foto-preview es un <button class="foto-tap"> con spans internos (iniciales +
  // icono cámara en vacío, o "Cambiar" superpuesto sobre la foto) — reconstruye ese
  // contenido interno en vez de tocar textContent/backgroundImage sueltos, que
  // borrarían los spans. El botón "Quitar foto" es un hermano fuera del círculo,
  // por eso se maneja aparte (mostrar/ocultar todo el nodo, no solo un flag).
  var ICONO_CAMARA_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.6l.9-1.5A1.5 1.5 0 0 1 9.29 4.75h5.42A1.5 1.5 0 0 1 16 5.5L16.9 7h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.4"/></svg>';

  function actualizarPreviewFotoForm() {
    var el = document.getElementById('mf-foto-preview');
    if (!el) return;
    var btnQuitar = document.getElementById('mf-foto-quitar');
    if (formFotoActual) {
      el.style.backgroundImage = "url('" + formFotoActual + "')";
      el.innerHTML = '<span class="foto-tap-editar">Cambiar</span>';
      el.setAttribute('aria-label', 'Cambiar foto');
      if (btnQuitar) btnQuitar.hidden = false;
    } else {
      el.style.backgroundImage = 'none';
      var nombreEl = document.getElementById('mf-nombre');
      var nombre = nombreEl ? nombreEl.value : '';
      var inicial = nombre ? nombre.trim().charAt(0).toUpperCase() : '?';
      el.innerHTML = '<span class="foto-tap-inicial">' + inicial + '</span><span class="foto-tap-icono" aria-hidden="true">' + ICONO_CAMARA_SVG + '</span>';
      el.setAttribute('aria-label', 'Añadir foto');
      if (btnQuitar) btnQuitar.hidden = true;
    }
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
    var fecha = estado.plan.dias[dia].fecha;
    if (!estado.ausenciasPuntuales[fecha]) estado.ausenciasPuntuales[fecha] = { comida: [], cena: [] };
    var lista = estado.ausenciasPuntuales[fecha][tipoComida] || [];
    var idx = lista.indexOf(miembroId);
    if (idx === -1) lista.push(miembroId); else lista.splice(idx, 1);
    estado.ausenciasPuntuales[fecha][tipoComida] = lista;
    guardarEstado();
    render();
  }

  function toggleCompraItem(ingredienteId) {
    var marcados = estado.compra.marcados || [];
    var idx = marcados.indexOf(ingredienteId);
    if (idx === -1) marcados.push(ingredienteId); else marcados.splice(idx, 1);
    estado.compra.marcados = marcados;
    guardarEstado();
    render();
  }

  function abrirCambiar(dia, tipoComida) {
    pendienteCambiar = { dia: dia, tipoComida: tipoComida };
    abrirSheet(UI.renderSheetCambiarInicio(estado, BANCO, dia, tipoComida));
  }

  function trasCambiarPlato(resultado) {
    if (!resultado) { alert('No encontramos un plato que encaje con esas condiciones.'); cerrarSheet(); render(); return; }
    estado.plan = resultado.plan;
    guardarEstado();
    pendienteRegenerar = { dia: pendienteCambiar.dia, tipoComida: pendienteCambiar.tipoComida };
    abrirSheet(UI.renderConfirmarRegenerar(resultado.resuelto.nombre));
    render();
  }

  function elegirPlantilla(dia, tipoComida, plantillaId) {
    var resultado = E.cambiarPlato(estado, estado.plan, dia, tipoComida, { modo: 'manual', plantillaId: plantillaId }, BANCO);
    trasCambiarPlato(resultado);
  }

  function confirmarNevera(dia, tipoComida) {
    var checks = document.querySelectorAll('#lista-nevera-checks input:checked');
    var disponibles = Array.prototype.map.call(checks, function (c) { return c.value; });
    if (!disponibles.length) { alert('Marca al menos un ingrediente disponible.'); return; }
    var resultado = E.cambiarPlato(estado, estado.plan, dia, tipoComida, { modo: 'nevera', disponibles: disponibles }, BANCO);
    trasCambiarPlato(resultado);
  }

  function regenerarSiguientes(si) {
    if (si && pendienteRegenerar) {
      estado.plan = E.regenerarDesde(estado, estado.plan, pendienteRegenerar.dia + 1, BANCO);
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

  function togglePatron(id, tipo, diaIdx) {
    var m = estado.familia.find(function (x) { return x.id === id; });
    if (!m) return;
    var ciclo = ['casa', 'fuera', 'cole'];
    var actual = m.patron[tipo][diaIdx];
    m.patron[tipo][diaIdx] = ciclo[(ciclo.indexOf(actual) + 1) % ciclo.length];
    guardarEstado();
    abrirSheetFamilia();
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
    'ir-vista': function (btn) { irAVista(btn.dataset.vista); },
    'abrir-familia': function () { abrirSheetFamilia(); },

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
    // chip de sexo/actividad/dieta en la card de edición del sheet Familia — mismo
    // patrón que togglePatron: guarda y re-renderiza el sheet completo (los <details>
    // abiertos se conservan vía el registro detallesAbiertos).
    'miembro-set-campo': function (btn) {
      actualizarCampoMiembro(btn.dataset.id, btn.dataset.campo, btn.dataset.valor);
      abrirSheetFamilia();
    },
    'ir-recetas-ocultas': function () { vistaActual = 'recetas'; cerrarSheet(); },

    'toggle-presente': function (btn) { togglePresente(Number(btn.dataset.dia), btn.dataset.tipo, btn.dataset.miembro); },
    'toggle-compra-item': function (btn) { toggleCompraItem(btn.dataset.id); },
    'segmento-compra': function (btn) { rangoCompra = btn.dataset.rango; render(); },
    'semana-elegir-dia': function (btn) { semanaDiaSeleccionado = parseInt(btn.dataset.dia, 10); render(); },
    'filtro-receta': function (btn) { filtroRecetas = btn.dataset.categoria; render(); },

    'abrir-cambiar': function (btn) { abrirCambiar(Number(btn.dataset.dia), btn.dataset.tipo); },
    'cerrar-sheet': function () { cerrarSheet(); },
    'modo-elegir-otro': function (btn) { abrirSheet(UI.renderListaElegirOtro(estado, BANCO, Number(btn.dataset.dia), btn.dataset.tipo)); },
    'modo-nevera': function (btn) { abrirSheet(UI.renderNevera(estado, BANCO, Number(btn.dataset.dia), btn.dataset.tipo)); },
    'elegir-plantilla': function (btn) { elegirPlantilla(Number(btn.dataset.dia), btn.dataset.tipo, btn.dataset.plantilla); },
    'confirmar-nevera': function (btn) { confirmarNevera(Number(btn.dataset.dia), btn.dataset.tipo); },
    'regenerar-si': function () { regenerarSiguientes(true); },
    'regenerar-no': function () { regenerarSiguientes(false); },

    'borrar-miembro': function (btn) { borrarMiembro(btn.dataset.id); },
    'toggle-patron': function (btn) { togglePatron(btn.dataset.id, btn.dataset.tipo, Number(btn.dataset.dia)); },
    'toggle-veto': function (btn) { toggleVeto(btn.dataset.id, btn.dataset.ingrediente); },
    'toggle-oculta-receta': function (btn) { toggleOcultaReceta(btn.dataset.plantilla); },
    'anadir-receta-propia': function () { anadirRecetaPropia(); }
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var accion = ACCIONES[btn.dataset.action];
    if (accion) accion(btn, e);
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

    var campo = t.dataset && t.dataset.campo;
    if (!campo) return;
    if (campo === 'nombreFamilia') { estado.nombreFamilia = t.value.trim(); guardarEstado(); return; }
    if (t.dataset.id) { actualizarCampoMiembro(t.dataset.id, campo, t.value); render(); }
  });

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t) return;
    if (t.id === 'wz-nombre-familia') wizardNombreFamilia = t.value;
    else if (t.id === 'mf-nombre' && !formFotoActual) actualizarPreviewFotoForm();
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
