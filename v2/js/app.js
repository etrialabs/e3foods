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
    return { familia: [], ausenciasPuntuales: {}, plan: null, ocultas: [], propias: [], compra: { marcados: [] } };
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

  var estado = cargarEstado();
  var vistaActual = 'hoy';
  var pendienteCambiar = null; // {dia, tipoComida} mientras el sheet de "cambiar" está abierto
  var pendienteRegenerar = null; // {dia, tipoComida} tras un cambio, a la espera de sí/no

  // qué <details> de MI FAMILIA están abiertos — un re-render (patrón, vetos, ocultar
  // receta) reconstruye el HTML entero; sin esto, cada toque colapsaría el panel del
  // miembro que se está editando.
  var detallesAbiertos = {};
  document.addEventListener('toggle', function (e) {
    var el = e.target;
    if (!el.matches || !el.matches('[data-detalle-key]')) return;
    var key = el.dataset.detalleKey;
    if (el.open) detallesAbiertos[key] = true; else delete detallesAbiertos[key];
  }, true);

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
  // Render
  // ---------------------------------------------------------------
  function render() {
    var cont = document.getElementById('vista-' + vistaActual);
    document.querySelectorAll('.vista').forEach(function (v) { v.hidden = (v.id !== 'vista-' + vistaActual); });
    document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.vista === vistaActual); b.setAttribute('aria-current', b.dataset.vista === vistaActual ? 'page' : 'false'); });
    if (vistaActual === 'hoy') cont.innerHTML = UI.renderHoy(estado, estado.plan, BANCO);
    else if (vistaActual === 'semana') cont.innerHTML = UI.renderSemana(estado, estado.plan, BANCO);
    else if (vistaActual === 'familia') {
      cont.innerHTML = UI.renderFamilia(estado, BANCO);
      cont.querySelectorAll('[data-detalle-key]').forEach(function (el) {
        if (detallesAbiertos[el.dataset.detalleKey]) el.open = true;
      });
    }
  }

  function irAVista(nombre) { vistaActual = nombre; render(); }

  // ---------------------------------------------------------------
  // Sheet genérico (bottom sheet reutilizado para compra/cambiar/confirmar)
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

  // ---------------------------------------------------------------
  // Landing → wizard/HOY
  // ---------------------------------------------------------------
  function cerrarLanding() {
    document.getElementById('landing-screen').hidden = true;
    document.body.classList.remove('landing-open');
    if (!estado.familia.length) {
      document.getElementById('wizard-screen').hidden = false;
      document.body.classList.add('wizard-open');
      renderWizardLista();
    } else {
      asegurarPlanVigente();
      render();
    }
  }

  // ---------------------------------------------------------------
  // Wizard
  // ---------------------------------------------------------------
  var wizardMiembros = [];

  function leerFormMiembro(prefijo) {
    var val = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var nombre = val(prefijo + '-nombre').trim();
    var nacimiento = val(prefijo + '-nacimiento');
    if (!nombre || !nacimiento) return null;
    return {
      id: generarId('m'),
      nombre: nombre,
      sexo: val(prefijo + '-sexo') || 'mujer',
      nacimiento: nacimiento,
      actividad: val(prefijo + '-actividad') || 'media',
      dieta: val(prefijo + '-dieta') || 'omnivora',
      vetos: [],
      patron: { comida: ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa'], cena: ['casa', 'casa', 'casa', 'casa', 'casa', 'casa', 'casa'] }
    };
  }

  function renderWizardLista() {
    var cont = document.getElementById('wizard-lista');
    if (!cont) return;
    cont.innerHTML = wizardMiembros.map(function (m, i) {
      return '<li>' + UI.escapeHtml(m.nombre) + ' <button type="button" class="btn-texto" data-action="wizard-quitar-miembro" data-idx="' + i + '">Quitar</button></li>';
    }).join('');
    document.getElementById('wizard-generar').disabled = wizardMiembros.length === 0;
  }

  function wizardAnadirMiembro() {
    var m = leerFormMiembro('nm');
    if (!m) { alert('Al menos el nombre y la fecha de nacimiento son necesarios.'); return; }
    wizardMiembros.push(m);
    ['nm-nombre', 'nm-nacimiento'].forEach(function (id) { document.getElementById(id).value = ''; });
    renderWizardLista();
  }

  function wizardQuitarMiembro(idx) {
    wizardMiembros.splice(idx, 1);
    renderWizardLista();
  }

  function wizardGenerar() {
    if (!wizardMiembros.length) return;
    estado.familia = wizardMiembros.slice();
    estado.plan = E.generarSemana(estado, BANCO);
    guardarEstado();
    document.getElementById('wizard-screen').hidden = true;
    document.body.classList.remove('wizard-open');
    wizardMiembros = [];
    irAVista('hoy');
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

  function toggleCompraItem(rango, ingredienteId) {
    var marcados = estado.compra.marcados || [];
    var idx = marcados.indexOf(ingredienteId);
    if (idx === -1) marcados.push(ingredienteId); else marcados.splice(idx, 1);
    estado.compra.marcados = marcados;
    guardarEstado();
    if (!document.getElementById('sheet-overlay').hidden) {
      abrirSheet(UI.renderSheetCompra(estado, estado.plan, BANCO, rango));
    } else {
      render();
    }
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
  // MI FAMILIA — CRUD miembros, patrón, vetos, recetas
  // ---------------------------------------------------------------
  function actualizarCampoMiembro(id, campo, valor) {
    var m = estado.familia.find(function (x) { return x.id === id; });
    if (!m) return;
    if (campo === 'peso' || campo === 'altura') m[campo] = valor ? Number(valor) : undefined;
    else m[campo] = valor;
    guardarEstado();
  }

  function borrarMiembro(id) {
    if (!confirm('¿Eliminar a este miembro de la familia?')) return;
    estado.familia = estado.familia.filter(function (m) { return m.id !== id; });
    guardarEstado();
    render();
  }

  function togglePatron(id, tipo, diaIdx) {
    var m = estado.familia.find(function (x) { return x.id === id; });
    if (!m) return;
    var ciclo = ['casa', 'fuera', 'cole'];
    var actual = m.patron[tipo][diaIdx];
    m.patron[tipo][diaIdx] = ciclo[(ciclo.indexOf(actual) + 1) % ciclo.length];
    guardarEstado();
    render();
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

  function familiaAnadirMiembro() {
    var m = leerFormMiembro('fm');
    if (!m) { alert('Al menos el nombre y la fecha de nacimiento son necesarios.'); return; }
    estado.familia.push(m);
    guardarEstado();
    render();
  }

  // ---------------------------------------------------------------
  // Delegación de eventos
  // ---------------------------------------------------------------
  var ACCIONES = {
    'empezar': function () { cerrarLanding(); },
    'ir-vista': function (btn) { irAVista(btn.dataset.vista); },
    'wizard-anadir-miembro': function () { wizardAnadirMiembro(); },
    'wizard-quitar-miembro': function (btn) { wizardQuitarMiembro(Number(btn.dataset.idx)); },
    'wizard-generar': function () { wizardGenerar(); },
    'toggle-presente': function (btn) { togglePresente(Number(btn.dataset.dia), btn.dataset.tipo, btn.dataset.miembro); },
    'toggle-compra-item': function (btn) { toggleCompraItem(btn.dataset.rango, btn.dataset.id); },
    'abrir-cambiar': function (btn) { abrirCambiar(Number(btn.dataset.dia), btn.dataset.tipo); },
    'abrir-compra-semana': function () { abrirSheet(UI.renderSheetCompra(estado, estado.plan, BANCO, 'semana')); },
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
    'anadir-receta-propia': function () { anadirRecetaPropia(); },
    'familia-anadir-miembro': function () { familiaAnadirMiembro(); }
  };

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var accion = ACCIONES[btn.dataset.action];
    if (accion) accion(btn, e);
  });

  document.addEventListener('change', function (e) {
    var campo = e.target.dataset && e.target.dataset.campo;
    if (campo && e.target.dataset.id) {
      actualizarCampoMiembro(e.target.dataset.id, campo, e.target.value);
      render();
    }
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
  });
})();
