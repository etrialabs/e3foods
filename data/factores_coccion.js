/* ============================================================
   e3Foods — factores_coccion.js

   INGESTA A2 — factores de peso crudo↔cocinado, por (ingrediente banco × técnica banco).
   Fichero generado, dato INERTE: nadie lo carga todavía (no está en index.html ni referenciado
   desde ui.js/engine.js/app.js). Ver 00_Contexto_Claude/UPGRADES.md para cuándo se consume.

   QUÉ ES
   Cuánto pesa un alimento COCINADO respecto a cómo se compró CRUDO, para cada técnica de
   cocción del banco. Es el dato que falta hoy para calcular a la vez "cuánto hay que comprar"
   (crudo) y "cuánto habrá en el plato" (cocinado) — hoy el motor solo conoce raciones en crudo.

   UNIDAD
   factor = peso_cocinado / peso_crudo, ambos en gramos, del MISMO alimento.
     factor > 1  → el alimento gana peso al cocinar (absorbe agua: arroz, legumbre seca)
     factor < 1  → el alimento pierde peso al cocinar (pierde agua: carne, pescado, verdura)
     factor ≈ 1  → apenas cambia (crudo, conservas, curados)
   Para pasar de "ración cocinada deseada" a "cuánto comprar crudo": gramos_crudo = gramos_cocinado / factor.
   Para pasar de "crudo comprado" a "lo que habrá en el plato": gramos_cocinado = gramos_crudo * factor.

   QUÉ NO ES — fuera de alcance A PROPÓSITO
   NO incluye kcal cocinado ni el "Multiplicador_kcal/grasa" de la hoja "Equivalencia Cocciones"
   del mismo Excel. Esa columna es una CONSTANTE PLANA por técnica (ej. frito ×1.5-1.9, igual
   para cualquier alimento), no varía por alimento y está en revisión — se deja fuera
   deliberadamente. Este fichero es solo el FACTOR DE PESO ("Factor real"), que sí es un dato
   real y distinto por cada alimento. No incluye tampoco deltas de aceite ni nada energético.

   FUENTES
   - Excel maestro de Roger: "Master_Ingredientes_CON_PRECIOS.xlsx" (copia usada con fecha de
     modificación 2026-07-24 16:01), hoja "Tabla Master", columna "Factor real" — NO "Factor
     base", que es una estimación previa a los ajustes manuales de Roger.
   - Hoja "Equivalencia Cocciones" del mismo Excel: usada solo para entender el árbol de
     sinónimos de técnica de Roger (columna "Coccion_original"→"Coccion_estandarizada"), no
     para ningún valor numérico (su "Multiplicador_kcal/grasa" es precisamente el dato excluido
     de arriba).
   - Cruce ingrediente banco ↔ alimento Excel: reutilizado tal cual de
     01_Research/2026-07-25_MACROS_mapeo_banco_excel.json (id_banco ↔ alimento_excel), sin rehacer el cruce.
     De los 148 ingredientes del banco, 8 no tienen match en el Excel (confianza "sin_match":
     panceta, compango, ternera-rellena, edamame, tofu, hummus, espinacas-queso, bechamel) →
     no aparecen en este fichero. Los otros 140 sí, con el match ya curado (incluye casos de
     varios id_banco compartiendo un mismo alimento_excel, ej. pan/pan-pita/masa-pizza/
     pan-hamburguesa/tortilla-trigo comparten "Pan de barra / Pan de payés": los 5 reciben el
     mismo factor porque el mapeo curado ya decidió que son equivalentes a estos efectos — esta
     tarea no reabre esa decisión).
   - Catálogo de técnicas del banco: frontend/data/recetas.js → tecnicas_coccion + acabados,
     LEÍDO (no editado) en el momento de construir este fichero. Ese fichero lo edita en
     paralelo otra tarea (macros); lo de aquí es una foto fija de lo que había en recetas.js en
     el momento de generar esta tabla.

   CORRESPONDENCIA TÉCNICA EXCEL (23) → TÉCNICA BANCO (9 tecnicas_coccion + papillote + coleslaw
   + 4 acabados = 15 claves posibles). Cuando varias técnicas del Excel podían alimentar la
   misma clave del banco se usó SIEMPRE un orden de prioridad fijo (primera que tenga dato para
   ese alimento concreto) — nunca un promedio a ciegas:

   banco key    <- excel "Coccion FACTIBLE" (orden de prioridad)                   criterio / cobertura real
   -----------  ----------------------------------------------------------------  --------------------------------------------
   plancha      <- "Plancha seca (sin aceite)"                                    se prioriza sin aceite: coherente con que
                   > "Plancha con poco aceite"                                    recetas.js describe "plancha" como técnica
                   > "A la parrilla / barbacoa" (fallback de último recurso)      de referencia sin grasa añadida (salubridad
                                                                                    1). Reparto real sobre 103 ingredientes con
                                                                                    dato de plancha: seca 92 · poco aceite 3 ·
                                                                                    parrilla/barbacoa 8 (cortes de asar/guiso —
                                                                                    carrilleras, morcillo, rabo, costillas,
                                                                                    manitas, pierna cordero, pato — y patata/
                                                                                    boniato, que en el Excel solo traen dato de
                                                                                    parrilla, no de plancha)
   horno        <- "Horno / asado (poco o nada de aceite)"                        única variante en el Excel, 1:1 (112 ingr.)
   vapor        <- "Al vapor"                                                     1:1 directo (90 ingr.). NO se pliegan aquí
                                                                                    "Microondas" ni "Pochado" (ver descartes /
                                                                                    ver "hervido")
   hervido      <- "Hervido / cocido normal"                                      se prioriza el nombre directo (91 ingr.);
                   > "Pochado / hervido suave" (fallback, 3 ingr.)                pochado como aproximación razonable cuando
                                                                                    es la única cocción en agua que trae el
                                                                                    Excel para ese alimento (ej. pollo)
   guisado      <- "Guiso / estofado"                                             1:1 (82 ingr.). "Braseado" NO se pliega aquí
                                                                                    aunque es conceptualmente cercano — ver
                                                                                    descartes, el propio Excel ya lo trata como
                                                                                    fila distinta
   salteado     <- "Salteado ligero"                                              se prioriza el de menos aceite, mismo
                   > "Salteado abundante" (fallback, 2 ingr.)                     criterio que plancha (81 + 2 = 83 ingr.)
   frito        <- "Frito (sartén o freidora)"                                    1:1 (96 ingr.), SOLO fritura sin rebozar/
                                                                                    enharinar (eso va a los acabados, ver abajo)
   crudo        <- "Crudo / sin coccion / conserva"                               1:1 (10 ingr.). En el Excel esta técnica solo
                                                                                    se listó para curados/conservas/condimentos
                                                                                    (chorizo, jamón, mantequilla, anchoas...),
                                                                                    no para fruta/verdura/carne fresca — el
                                                                                    Excel no las trata como "cocción crudo"
   papillote    <- "Papillote"                                                    1:1 (62 ingr.) — el encargo de esta tarea daba
                                                                                    "papillote" como EJEMPLO de técnica a
                                                                                    descartar "por no existir en el banco", pero
                                                                                    al leer recetas.js (fuente de verdad pedida
                                                                                    explícitamente por el propio encargo) SÍ
                                                                                    existe "papillote" en tecnicas_coccion →
                                                                                    se mapea en vez de descartarse. Ver nota
                                                                                    de desviación más abajo
   ensalada     <- (sin fuente en el Excel)                                       el Excel no distingue "ensalada" de "crudo"
                                                                                    como técnica propia. Aunque conceptualmente
                                                                                    el factor sería 1.0 (igual que crudo, cero
                                                                                    cocción), NO se rellena por analogía para no
                                                                                    incumplir "no inventes factores" del encargo
                                                                                    — 0 pares, ausente del todo en el mapa
   coleslaw     <- (sin fuente en el Excel)                                       mismo caso que ensalada — 0 pares
   rebozado     <- "Rebozado + frito"                                             única variante de rebozado en el Excel, 1:1
                                                                                    (77 ingr.)
   enharinado   <- "Enharinado + frito"                                           de las 4 variantes "Enharinado + X" del Excel
                   > "Enharinado + plancha / horno" (fallback, 6 ingr.)           se prioriza "+ frito" (66 ingr.) por ser la
                   > "Enharinado + salteado" (fallback, 0 usos reales:            que recetas.js usa como referencia directa al
                     siempre que existe también existe "+ frito" o                comparar enharinado con rebozado (ambos en
                     "+ plancha/horno" con más prioridad)                         contexto de fritura); se descarta siempre
                                                                                    "Enharinado + airfryer" (ver descartes)
   empanado     <- (sin fuente en el Excel)                                       el Excel no distingue "empanado" (pan
                                                                                    rallado) de "rebozado"/"enharinado" como
                                                                                    técnica propia — 0 pares
   tempura      <- (sin fuente en el Excel)                                       el Excel no tiene tempura como técnica
                                                                                    propia — 0 pares

   TÉCNICAS DEL EXCEL DESCARTADAS POR COMPLETO (no alimentan ninguna clave del banco; las 23
   técnicas del Excel están 100% contabilizadas entre la tabla de arriba y esta lista):
     - "Airfryer (sin o con poco spray de aceite)" / "Airfryer con aceite generoso"
         → sin técnica equivalente en el banco (no hay "airfryer" en tecnicas_coccion)
     - "Enharinado + airfryer"
         → mismo motivo, dentro de la familia enharinado
     - "Confitado"
         → cocción en grasa abundante; no existe como técnica de banco
     - "Microondas (sin grasa)"
         → aparato específico, no técnica de banco; no se pliega en "vapor" para no forzar una
           equivalencia que nadie ha pedido
     - "Braseado"
         → conceptualmente cercano a "guisado", pero el propio Excel ya lo trata como fila propia
           y distinta de "Guiso / estofado": diferencia real de -0.04/-0.05 en los 87 alimentos
           donde coexisten ambas filas (nunca aparece "Braseado" en solitario sin "Guiso /
           estofado" también presente — no se pierde cobertura al descartarla). Se mantiene fuera
           en vez de mezclarla con guisado para no combinar dos filas que Roger ya distingue

   DESVIACIÓN respecto al encargo: "papillote" SÍ se mapea (ver tabla arriba). El texto del
   encargo lo ponía como ejemplo de técnica a descartar "por no existir en el banco", junto con
   airfryer/confitado/braseado/microondas — pero el propio encargo pedía leer recetas.js como
   fuente de los nombres exactos, y recetas.js sí tiene "papillote" en tecnicas_coccion (con nota
   propia: técnica añadida en Fase 3, 2026-07-21). Se sigue la fuente de verdad verificada en vez
   del ejemplo del encargo; el resto de esa lista de ejemplos (airfryer, confitado, braseado,
   microondas) sí se confirmó ausente del banco y se descarta como se pedía.

   INGREDIENTE BANCO SIN TÉCNICA DEL BANCO EN ABSOLUTO
   No aplica: los 140 ingredientes con match en el Excel obtuvieron al menos 1 técnica válida.

   USO PREVISTO (no implementado aquí — dato inerte, sin consumidor todavía)
   factores.<idIngrediente>.<tecnicaBanco> = peso_cocinado / peso_crudo para esa técnica.
   Con acabado (ej. merluza enharinada y frita): la clave "enharinado" YA es el factor total
   crudo→enharinado+frito (no un multiplicador a aplicar sobre "frito"), tal cual viene del Excel
   — un futuro motor que combine técnica+acabado debe leer la clave del acabado directamente
   cuando exista acabado, no multiplicarla por la clave de la técnica base. Así cada clave = 1
   valor real del Excel, sin factores derivados ni inventados.

   Total: 140 ingredientes con al menos 1 factor · 881 pares ingrediente×técnica.
   ============================================================ */
(function (global) {
  'use strict';
  window.E3_FACTORES_COCCION = {
    "version": 1,
    "factores": {
      "acelgas": { "horno": 0.77, "vapor": 0.85, "hervido": 0.85, "salteado": 0.9 },
      "aguacate": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "albaricoque": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "alcachofa": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "alitas-pollo": { "plancha": 0.75, "horno": 0.72, "vapor": 0.75, "hervido": 0.68, "guisado": 0.68, "frito": 0.82, "rebozado": 1.02 },
      "almejas": { "plancha": 0.83, "horno": 0.77, "vapor": 0.8, "hervido": 0.7 },
      "alubias-blancas": { "vapor": 3, "hervido": 3, "guisado": 3.03 },
      "anchoas-conserva": { "crudo": 1 },
      "arandanos": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "arroz": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "arroz-bomba": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "atun": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 0.99 },
      "atun-conserva": { "crudo": 1 },
      "bacalao": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "hervido": 0.8, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 1.14 },
      "bebida-avena": { "hervido": 1 },
      "bebida-soja": { "hervido": 1 },
      "berenjena": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "boletus": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "boniato": { "plancha": 0.78, "horno": 0.87, "hervido": 1, "guisado": 0.98, "salteado": 0.95, "frito": 0.77, "rebozado": 0.97 },
      "bonito": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 0.99 },
      "boquerones": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 0.99 },
      "brocoli": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "butifarra-blanca": { "plancha": 0.75, "horno": 0.72, "guisado": 0.78, "frito": 0.82 },
      "butifarra-fresca": { "plancha": 0.75, "horno": 0.72, "guisado": 0.78, "frito": 0.82 },
      "butifarra-negra": { "plancha": 0.75, "horno": 0.72, "guisado": 0.78, "frito": 0.82 },
      "calabacin": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "calabaza": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "calamar": { "plancha": 0.7, "horno": 0.72, "vapor": 0.8, "hervido": 0.65, "salteado": 0.85, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.09 },
      "caqui": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "carne-picada-mixta": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02 },
      "carrillera-ternera": { "plancha": 0.58, "horno": 0.67, "hervido": 0.65, "guisado": 0.68, "frito": 0.82 },
      "cebolla": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "cebolleta": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "cerdo": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.04 },
      "cereza": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "champinones": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "chipiron": { "plancha": 0.7, "horno": 0.72, "vapor": 0.8, "hervido": 0.65, "salteado": 0.85, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.09 },
      "chorizo": { "crudo": 1 },
      "chuletas-cerdo": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.04 },
      "ciruela": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "col": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "coliflor": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "compota": { "horno": 0.92, "vapor": 0.85, "hervido": 0.95 },
      "conejo": { "plancha": 0.75, "horno": 0.72, "vapor": 0.75, "hervido": 0.7, "salteado": 0.83, "frito": 0.82, "papillote": 0.78, "rebozado": 1.02, "enharinado": 1.04 },
      "cordero-chuletas": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.04 },
      "cordero-cuello": { "plancha": 0.58, "horno": 0.67, "hervido": 0.65, "guisado": 0.68, "frito": 0.82 },
      "cordero-paletilla": { "plancha": 0.58, "horno": 0.67, "hervido": 0.65, "guisado": 0.68, "frito": 0.82 },
      "cordero-pierna": { "plancha": 0.58, "horno": 0.67, "hervido": 0.65, "guisado": 0.68, "frito": 0.82 },
      "costillas-cerdo": { "plancha": 0.58, "horno": 0.67, "hervido": 0.65, "guisado": 0.68, "frito": 0.82 },
      "cuscus": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "dorada": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "hervido": 0.8, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 1.14 },
      "entrecot-ternera": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.04 },
      "esparrago-blanco": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "esparrago-verde": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "espinacas": { "horno": 0.77, "vapor": 0.85, "hervido": 0.85, "salteado": 0.9 },
      "fideos": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "frambuesa": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "fresa": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "fuet": { "crudo": 1 },
      "gallo": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "hervido": 0.8, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 1.14 },
      "gambas": { "plancha": 0.7, "horno": 0.72, "vapor": 0.8, "hervido": 0.65, "salteado": 0.85, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.09 },
      "garbanzos": { "vapor": 3, "hervido": 3, "guisado": 3.03 },
      "granada": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "guisantes": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "habas-tiernas": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "helado": { "horno": 0.92, "vapor": 0.85 },
      "higo": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "huevo": { "plancha": 0.9, "horno": 0.92, "hervido": 1, "salteado": 1, "frito": 0.97 },
      "jamon-cocido": { "plancha": 0.85, "horno": 0.82 },
      "jamon-serrano": { "crudo": 1 },
      "judias-verdes": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "kiwi": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "leche": { "hervido": 1 },
      "leche-sin-lactosa": { "hervido": 1 },
      "lechuga": { "vapor": 0.85, "hervido": 0.9, "salteado": 0.9 },
      "legumbres-variadas": { "vapor": 3, "hervido": 3, "guisado": 3.03 },
      "lenguado": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "hervido": 0.8, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 1.14 },
      "lentejas": { "vapor": 3, "hervido": 3, "guisado": 3.03 },
      "lomo-embuchado": { "crudo": 1 },
      "lubina": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "hervido": 0.8, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 1.14 },
      "maiz": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "mandarina": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "mango": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "mantequilla": { "crudo": 1 },
      "manzana": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "masa-empanada": { "horno": 0.92, "frito": 0.97 },
      "masa-empanadilla": { "horno": 0.92, "frito": 0.97 },
      "masa-pizza": { "plancha": 0.9, "horno": 0.92, "frito": 0.97 },
      "mejillones": { "plancha": 0.83, "horno": 0.77, "vapor": 0.8, "hervido": 0.7 },
      "melocoton": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "melon": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "merluza": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "hervido": 0.8, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 1.14 },
      "morcilla": { "crudo": 1 },
      "naranja": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "nata": { "hervido": 1, "salteado": 1.05 },
      "nectarina": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "niscalos": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "noquis": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "pan": { "plancha": 0.9, "horno": 0.92, "frito": 0.97 },
      "pan-hamburguesa": { "plancha": 0.9, "horno": 0.92, "frito": 0.97 },
      "pan-integral": { "plancha": 0.9, "horno": 0.92, "frito": 0.97 },
      "pan-pita": { "plancha": 0.9, "horno": 0.92, "frito": 0.97 },
      "pasta": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "patata": { "plancha": 0.78, "horno": 0.87, "hervido": 1, "guisado": 0.98, "salteado": 0.95, "frito": 0.77, "rebozado": 0.97 },
      "pavo": { "plancha": 0.75, "horno": 0.72, "vapor": 0.75, "hervido": 0.7, "salteado": 0.83, "frito": 0.82, "papillote": 0.78, "rebozado": 1.02, "enharinado": 1.04 },
      "pepino": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "pera": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "pimiento": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "pina": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "placas-lasana": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "platano": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "pollo": { "plancha": 0.75, "horno": 0.72, "vapor": 0.75, "hervido": 0.7, "salteado": 0.83, "frito": 0.82, "papillote": 0.78, "rebozado": 1.02, "enharinado": 1.04 },
      "presa-iberica": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.85 },
      "puerro": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "pulpo": { "plancha": 0.83, "horno": 0.77, "vapor": 0.8, "hervido": 0.7, "guisado": 0.78 },
      "queso-curado": { "plancha": 0.9, "horno": 0.87 },
      "queso-feta": { "plancha": 0.9, "horno": 0.87 },
      "queso-fresco": { "horno": 0.92, "vapor": 0.85 },
      "queso-rallado": { "plancha": 0.9, "horno": 0.87 },
      "quinoa": { "vapor": 2.8, "hervido": 2.8, "guisado": 3.03 },
      "rabo-ternera": { "plancha": 0.58, "horno": 0.67, "hervido": 0.65, "guisado": 0.68, "frito": 0.82 },
      "rape": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "hervido": 0.8, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 1.14 },
      "salchichas-cerdo": { "plancha": 0.75, "horno": 0.72, "guisado": 0.78, "frito": 0.82 },
      "salchichon": { "crudo": 1 },
      "salmon": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 0.99 },
      "sandia": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "sardinas": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 0.99 },
      "secreto-iberico": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.85 },
      "sepia": { "plancha": 0.7, "horno": 0.72, "vapor": 0.8, "hervido": 0.65, "salteado": 0.85, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.09 },
      "sobrasada": { "crudo": 1 },
      "solomillo-ternera": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.04 },
      "ternera": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02, "enharinado": 1.04 },
      "ternera-picada": { "plancha": 0.7, "horno": 0.67, "guisado": 0.68, "salteado": 0.8, "frito": 0.82, "rebozado": 1.02 },
      "tomate": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "tortilla-trigo": { "plancha": 0.9, "horno": 0.92, "frito": 0.97 },
      "trucha": { "plancha": 0.8, "horno": 0.82, "vapor": 0.85, "salteado": 0.9, "frito": 0.87, "papillote": 0.85, "rebozado": 1.07, "enharinado": 0.99 },
      "uva": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 },
      "yogur": { "horno": 0.92, "vapor": 0.85 },
      "yogur-sin-lactosa": { "horno": 0.92, "vapor": 0.85 },
      "zanahoria": { "plancha": 0.7, "horno": 0.72, "vapor": 0.9, "hervido": 0.88, "guisado": 0.88, "salteado": 0.85, "frito": 0.82, "papillote": 0.9, "rebozado": 1.07, "enharinado": 1.09 }
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = window.E3_FACTORES_COCCION;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
