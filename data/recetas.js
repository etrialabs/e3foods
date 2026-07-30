/* ============================================================
   e3Foods — recetas.js (v3)

   Banco unico del motor v3: ingredientes + postres + despensa (datos base, se editan
   aqui directamente) + grupos/tecnicas_coccion/acabados/elaboraciones/
   compatibilidad (GENERADOS, no editar a mano — tocar
   tests/fixtures/clasificacion_elaboraciones_v3.js y correr
   `node _build_recetas.js` desde 02_APP/). categorias_cuota = las de v2
   sin cambios + fritos (nueva, dura, 1-2/sem).
   Diseno completo y cronica de la obra: 00_Decisiones_Log/2026-07-21_e3foods-motor-v3-construccion.md.
   ============================================================ */
(function (global) {
  'use strict';
  window.E3_RECETAS = {
  "version": 3,
  "ingredientes": {
    "pollo": {
      "nombre": "Pollo (pechuga o contramuslo)",
      "categoria": "carne-blanca",
      "kcal_100g": 165,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 31,
      "grasa_g": 3.6,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "kcal_100g (165) y la columna “crudo” del Excel para Pechuga de pollo son el MISMO valor (165/31/3.6/0). Firma matematica confirmada contra USDA FDC (API, en vivo): pollo pechuga sin piel crudo real = 120/22.5/2.62; ratio Excel-crudo/USDA-raw = 1.375/1.378/1.374, practicamente identico en las 3 macros. Tanto el banco como el Excel traen en realidad pechuga de pollo YA COCINADA mal etiquetada como “crudo”. Se usan las macros de esa columna tal cual (31/3.6/0) -- coherentes con el kcal_100g existente, que no se toca.",
      "origen": "pollo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pechuga de pollo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1.01,
      "grasa_monoinsaturada_g": 1.24,
      "grasa_poliinsaturada_g": 0.77,
      "fuente_nutri_ext": "USDA FoodData Central: Chicken, broilers or fryers, breast, meat only, cooked, roasted (fdcId 171477, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "pavo": {
      "nombre": "Pavo (filete o picado)",
      "categoria": "carne-blanca",
      "kcal_100g": 110,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 29,
      "grasa_g": 1.5,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Mismo patron que pollo (misma pieza, pechuga de ave) pero con evidencia mas debil: Excel crudo Pechuga de pavo = 149/29/1.5; ratio frente a referencia externa de pavo crudo (~110/24/<2, busqueda web sin BEDCA directo ni verificacion en fuente primaria) = 1.355/1.208/~2.3 -- mismo sentido en las 3 macros pero no tan limpio como pollo. AVISO: a diferencia de pollo, el kcal_100g del banco (110) NO coincide con la columna crudo del Excel (149) usada aqui para las macros -- son numeros de fuentes distintas que se asume describen el mismo estado (pavo cocinado). Decision heredada de la sesion de analisis previa (01_Research/2026-07-25_MACROS_ingesta_analisis.md §3a), con respaldo mas debil que pollo -- recomendable que Roger la revise.",
      "origen": "pavo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pechuga de pavo/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.593,
      "grasa_monoinsaturada_g": 0.626,
      "grasa_poliinsaturada_g": 0.528,
      "fuente_nutri_ext": "USDA FoodData Central: Turkey, whole, breast, meat only, cooked, roasted (fdcId 171496, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "conejo": {
      "nombre": "Conejo",
      "categoria": "carne-blanca",
      "kcal_100g": 130,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 23,
      "grasa_g": 5,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "conejo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Conejo troceado / Lomo de conejo / Muslos de conejo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1.66,
      "grasa_monoinsaturada_g": 1.5,
      "grasa_poliinsaturada_g": 1.08,
      "fuente_nutri_ext": "USDA FoodData Central: Game meat, rabbit, domesticated, composite of cuts, raw (fdcId 172521, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "ternera-picada": {
      "nombre": "Carne picada de ternera",
      "categoria": "carne-roja",
      "kcal_100g": 240,
      "racion_adulto_g": 130,
      "racion_nino_g": 80,
      "coste_banda": 2,
      "proteina_g": 17.7,
      "grasa_g": 18.1,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "ternera",
      "fuente_macros": "USDA FoodData Central fdcId 173068 (Beef, ground, 85% lean/15% fat, raw)",
      "confianza_macros": "alta",
      "grasa_saturada_g": 7.94,
      "grasa_monoinsaturada_g": 7.97,
      "grasa_poliinsaturada_g": 0.699,
      "fuente_nutri_ext": "USDA FoodData Central: Beef, Australian, imported, grass-fed, ground, 85% lean / 15% fat, raw (fdcId 173068, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 26/8/0 -> Atwater 176 vs 240 (-26,7%). INCOHERENCIA INTERNA DEL PROPIO FICHERO: el registro YA citaba fdcId 173068 en fuente_nutri_ext (de ahi salio el desglose sat/mono/poli, que suma ~16,6 g y es coherente con 18,1 g de grasa total), pero proteina_g/grasa_g venian del Excel, de otra referencia mas magra que nunca cuadro con 240 kcal. Ahora las dos mitades del registro usan la misma fuente."
    },
    "ternera": {
      "nombre": "Ternera (filete o para guisar)",
      "categoria": "carne-roja",
      "kcal_100g": 200,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "proteina_g": 26,
      "grasa_g": 11,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "ternera",
      "fuente_macros": "Excel maestro Roger 2026-07 · Filete de ternera/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1.7,
      "grasa_monoinsaturada_g": 1.7,
      "grasa_poliinsaturada_g": 0.238,
      "fuente_nutri_ext": "USDA FoodData Central: Beef, round, top round, boneless, choice, raw (fdcId 2646173, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "cerdo": {
      "nombre": "Cerdo (lomo o solomillo)",
      "categoria": "carne-roja",
      "kcal_100g": 180,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 27,
      "grasa_g": 7,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cerdo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Lomo de cerdo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 3.28,
      "grasa_monoinsaturada_g": 3.95,
      "grasa_poliinsaturada_g": 1.38,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, loin, boneless, raw (fdcId 2646168, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "chorizo": {
      "nombre": "Chorizo",
      "categoria": "carne-roja",
      "kcal_100g": 323,
      "racion_adulto_g": 60,
      "racion_nino_g": 30,
      "coste_banda": 2,
      "proteina_g": 27,
      "grasa_g": 23,
      "hidratos_g": 2,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Embutido curado que se compra listo para comer, sin coccion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada).",
      "origen": "chorizo",
      "fuente_macros": "BEDCA (AESAN/BEDCA v1.0, 2010) · Chorizo curado estándar",
      "confianza_macros": "alta",
      "grasa_saturada_g": 8.6,
      "grasa_monoinsaturada_g": 10.6,
      "grasa_poliinsaturada_g": 4.3,
      "fuente_nutri_ext": "USDA FoodData Central: Sausage, pork, chorizo, link or ground, raw (fdcId 173859, SR Legacy)",
      "confianza_nutri_ext": "alta - coincide nombre exacto, aunque banco modela cocido",
      "nota_macros": "Excel daba 22/38/3 -> Atwater 442 vs kcal_100g 323 (+36,8%). La grasa del Excel (38 g) corresponde a una variante mas grasa (tabla FEN/Moreiras \"chorizo 32% de grasa\", 385 kcal). BEDCA generico reconcilia exacto con el 323 ya fijado."
    },
    "panceta": {
      "nombre": "Panceta de cerdo",
      "categoria": "carne-roja",
      "kcal_100g": 467,
      "racion_adulto_g": 50,
      "racion_nino_g": 25,
      "coste_banda": 2,
      "proteina_g": null,
      "grasa_g": null,
      "hidratos_g": null,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": null,
      "confianza_macros": "sin_match",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, belly, with skin, raw (fdcId 2727576, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "jamon-serrano": {
      "nombre": "Jamón serrano",
      "categoria": "carne-roja",
      "kcal_100g": 319,
      "racion_adulto_g": 40,
      "racion_nino_g": 25,
      "coste_banda": 2,
      "proteina_g": 28.8,
      "grasa_g": 22.6,
      "hidratos_g": 0.2,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Curado que se compra listo para comer (loncheado), sin coccion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila, sin alternativa cocinada).",
      "origen": "jamon",
      "fuente_macros": "BEDCA (AESAN/BEDCA v1.0, 2010) · Jamon serrano",
      "confianza_macros": "alta",
      "grasa_saturada_g": 7.14,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: TAPAS ESSENTIALS, SERRANO HAM, SLICED SPANISH DRY-CURED HAM (fdcId 518712, Branded)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 30/14/0 -> Atwater 246 vs 319 (-22,9%). UNICO caso del grupo con Atwater por DEBAJO: aqui la grasa estaba INFRAestimada (14 g cuando la real es 22,6), no sobrestimada. La proteina ya era casi correcta."
    },
    "compango": {
      "nombre": "Compango asturiano (chorizo, morcilla y lacón)",
      "categoria": "carne-roja",
      "kcal_100g": 287,
      "racion_adulto_g": 80,
      "racion_nino_g": 40,
      "coste_banda": 2,
      "proteina_g": null,
      "grasa_g": null,
      "hidratos_g": null,
      "fibra_g": null,
      "base_nutricional": "cocido",
      "nota_base": "Sin match en el Excel (mezcla sin proporcion fija). Mezcla de embutidos curados/cocidos para cocido/fabada (chorizo+morcilla+lacon) -- cada componente individual se compra curado/listo (ver chorizo, morcilla, jamon-serrano en este mismo banco, todos 'cocido'), se declara igual por composicion aunque sin macros propios.",
      "origen": null,
      "confianza_macros": "sin_match",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "plato compuesto (chorizo+morcilla+lacon) - sin ingrediente unico USDA aplicable"
    },
    "ternera-rellena": {
      "nombre": "Ternera rellena de jamón y queso (cachopo)",
      "categoria": "carne-roja",
      "kcal_100g": 195,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 3,
      "proteina_g": null,
      "grasa_g": null,
      "hidratos_g": null,
      "fibra_g": null,
      "base_nutricional": "cocido",
      "nota_base": "Sin match en el Excel (plato compuesto). Cachopo: ternera rebozada y frita, rellena de jamon y queso -- no existe un estado “crudo” del plato tal como se sirve, se consume ya cocinado.",
      "origen": null,
      "confianza_macros": "sin_match",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "plato compuesto (cachopo) - sin ingrediente unico USDA aplicable"
    },
    "merluza": {
      "nombre": "Merluza",
      "categoria": "pescado-blanco",
      "kcal_100g": 90,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3,
      "proteina_g": 18,
      "grasa_g": 0.9,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "merluza",
      "fuente_macros": "Excel maestro Roger 2026-07 · Merluza/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.35,
      "grasa_monoinsaturada_g": 0.43,
      "grasa_poliinsaturada_g": 0.46,
      "fuente_nutri_ext": "BEDCA (Base de Datos Española de Composición de Alimentos): Merluza fresca / Hake, raw (Merluccius merluccius) - fibra ya confirmada en 0 vía USDA, coincide",
      "confianza_nutri_ext": "alta - dato español directo, sustituye proxy USDA (haddock)"
    },
    "bacalao": {
      "nombre": "Bacalao desalado",
      "categoria": "pescado-blanco",
      "kcal_100g": 110,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 26,
      "grasa_g": 0.4,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "nota_base": "Banco = “Bacalao desalado” (bacalao en salazon tras remojo para quitar sal), un estado intermedio que el Excel no modela (solo trae “Bacalao fresco”, 80kcal, nunca salado, y “Bacalao en salazon”, 95kcal, antes de desalar). El desalado NO es coccion (no se aplica calor, solo se retira la sal por remojo en agua) -- el pescado sigue crudo y se cocina despues en casa, por eso se declara 'crudo' pese a no encajar exacto en ninguna fila del Excel. Macros = columna crudo de 'Bacalao fresco' (proxy mas cercano disponible), sin ajustar por el desalado (no hay dato verificable de cuanto cambia).",
      "origen": "bacalao",
      "fuente_macros": "Bacalao salado-remojado (desalado), 2 agregadores coincidentes (109 kcal / 26 / 0,4)",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.044,
      "grasa_monoinsaturada_g": 0.026,
      "grasa_poliinsaturada_g": 0.081,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, cod, Atlantic, wild caught, raw (fdcId 2684444, Foundation)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 17,5/0,7/0 -> Atwater 76,3 vs 110 (-31%). EL BUG DE ESTA AUDITORIA EN ESTADO PURO, pero por ESTADO del producto y no por especie: el banco ya documentaba que uso \"bacalao fresco\" como proxy porque el Excel no tiene fila \"desalado\", pero su kcal_100g (110) SI refleja el estado desalado (mas concentrado), mientras las macros eran del fresco (78-82 kcal). Ahora ambos describen el mismo producto."
    },
    "lubina": {
      "nombre": "Lubina",
      "categoria": "pescado-blanco",
      "kcal_100g": 118,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3,
      "proteina_g": 19.5,
      "grasa_g": 1.3,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "lubina",
      "fuente_macros": "Excel maestro Roger 2026-07 · Lubina/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.511,
      "grasa_monoinsaturada_g": 0.424,
      "grasa_poliinsaturada_g": 0.743,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, sea bass, mixed species, raw (fdcId 175142, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "gallo": {
      "nombre": "Gallo (filetes)",
      "categoria": "pescado-blanco",
      "kcal_100g": 80,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3,
      "proteina_g": 17,
      "grasa_g": 1,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "lenguado",
      "fuente_macros": "Excel maestro Roger 2026-07 · Lenguado/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.441,
      "grasa_monoinsaturada_g": 0.535,
      "grasa_poliinsaturada_g": 0.374,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, flatfish (flounder and sole species), raw (fdcId 174196, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "salmon": {
      "nombre": "Salmón",
      "categoria": "pescado-azul",
      "kcal_100g": 200,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "proteina_g": 20,
      "grasa_g": 13,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "salmon",
      "fuente_macros": "Excel maestro Roger 2026-07 · Salmón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 2.28,
      "grasa_monoinsaturada_g": 5.01,
      "grasa_poliinsaturada_g": 4.06,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, salmon, Atlantic, farm raised, raw (fdcId 2684441, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "atun": {
      "nombre": "Atún fresco",
      "categoria": "pescado-azul",
      "kcal_100g": 130,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "proteina_g": 23.3,
      "grasa_g": 4.9,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "atun",
      "fuente_macros": "USDA FoodData Central fdcId 173706 (Tuna, bluefin, raw) + ANFACO/MAPA-CECOPESCA 2012 (columna ATUN ROJO), coincidentes",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1.26,
      "grasa_monoinsaturada_g": 1.6,
      "grasa_poliinsaturada_g": 1.43,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, tuna, fresh, bluefin, raw (fdcId 173706, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 25/9/0 -> Atwater 181 vs 130 (+39%). Dos fuentes independientes coinciden casi al decimal en 23,3/4,9. Las macros anteriores no correspondian al perfil del atun rojo que si encaja con el kcal fijado."
    },
    "sardinas": {
      "nombre": "Sardinas",
      "categoria": "pescado-azul",
      "kcal_100g": 170,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 21,
      "grasa_g": 10,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "sardina",
      "fuente_macros": "Excel maestro Roger 2026-07 · Sardina fresca/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 3.26,
      "grasa_monoinsaturada_g": 5.46,
      "grasa_poliinsaturada_g": 3.35,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, mackerel, Atlantic, raw (fdcId 175119, SR Legacy)",
      "confianza_nutri_ext": "media - proxy caballa, sardina fresca cruda no existe en USDA"
    },
    "boquerones": {
      "nombre": "Boquerones",
      "categoria": "pescado-azul",
      "kcal_100g": 130,
      "racion_adulto_g": 120,
      "racion_nino_g": 70,
      "coste_banda": 1,
      "proteina_g": 20,
      "grasa_g": 7,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "boqueron",
      "fuente_macros": "Excel maestro Roger 2026-07 · Boquerón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1.28,
      "grasa_monoinsaturada_g": 1.18,
      "grasa_poliinsaturada_g": 1.64,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, anchovy, european, raw (fdcId 174182, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "bonito": {
      "nombre": "Bonito del norte fresco",
      "categoria": "pescado-azul",
      "kcal_100g": 138,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 24.7,
      "grasa_g": 5.5,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "bonito",
      "fuente_macros": "ANFACO/MAPA-CECOPESCA 2012 + EROSKI Consumer (proteina y kcal coincidentes en ambas)",
      "confianza_macros": "media",
      "grasa_saturada_g": 1.26,
      "grasa_monoinsaturada_g": 1.6,
      "grasa_poliinsaturada_g": 1.43,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, tuna, fresh, bluefin, raw (fdcId 173706, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 24/10/0 -> Atwater 186 vs 138 (+35%). Mismo patron que los embutidos: grasa sobrestimada (10 -> ~5,5 g). La grasa del bonito oscila 2-5% por estacionalidad, de ahi confianza media."
    },
    "trucha": {
      "nombre": "Trucha",
      "categoria": "pescado-azul",
      "kcal_100g": 90,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 15.7,
      "grasa_g": 3,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "trucha",
      "fuente_macros": "BEDCA (AESAN/BEDCA v1.0, 2010) · Trucha",
      "confianza_macros": "media",
      "grasa_saturada_g": 1.15,
      "grasa_monoinsaturada_g": 3.25,
      "grasa_poliinsaturada_g": 1.5,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, trout, mixed species, raw (fdcId 175153, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 20/5/0 -> Atwater 125 vs 90 (+39%). Reconcilia casi perfecto (-0,2%), PERO implica una trucha mucho mas magra que la que sugiere su categoria pescado-azul y que la propia fuente USDA ya citada en el fichero (fdcId 175153: 148 kcal / 20,8 / 6,6). Probablemente describe trucha de rio salvaje (Salmo trutta), no la de piscifactoria (Oncorhynchus mykiss) que es la que se vende. Confianza media por esa ambiguedad de producto: si el banco pretendia la de piscifactoria, el numero a revisar seria el kcal_100g."
    },
    "gambas": {
      "nombre": "Gambas o langostinos",
      "categoria": "marisco",
      "kcal_100g": 90,
      "racion_adulto_g": 130,
      "racion_nino_g": 80,
      "coste_banda": 3,
      "proteina_g": 24,
      "grasa_g": 0.5,
      "hidratos_g": 0.5,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "gamba",
      "fuente_macros": "Excel maestro Roger 2026-07 · Gambas/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Crustaceans, shrimp, farm raised, raw (fdcId 2684443, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "mejillones": {
      "nombre": "Mejillones",
      "categoria": "marisco",
      "kcal_100g": 85,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 2,
      "proteina_g": 12,
      "grasa_g": 2,
      "hidratos_g": 3,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "mejillon",
      "fuente_macros": "Excel maestro Roger 2026-07 · Mejillones/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.425,
      "grasa_monoinsaturada_g": 0.507,
      "grasa_poliinsaturada_g": 0.606,
      "fuente_nutri_ext": "USDA FoodData Central: Mollusks, mussel, blue, raw (fdcId 174216, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "huevo": {
      "nombre": "Huevo",
      "categoria": "huevo",
      "kcal_100g": 155,
      "racion_adulto_g": 120,
      "racion_nino_g": 60,
      "coste_banda": 1,
      "unidad_g": 60,
      "proteina_g": 12.5,
      "grasa_g": 10,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "huevo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Huevos/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 3.13,
      "grasa_monoinsaturada_g": 3.66,
      "grasa_poliinsaturada_g": 1.91,
      "fuente_nutri_ext": "USDA FoodData Central: Egg, whole, raw, fresh (fdcId 171287, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "entrecot-ternera": {
      "nombre": "Entrecot de ternera",
      "categoria": "carne-roja",
      "kcal_100g": 180,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "proteina_g": 25,
      "grasa_g": 12,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "ternera",
      "fuente_macros": "Excel maestro Roger 2026-07 · Entrecot de ternera/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 2.38,
      "grasa_monoinsaturada_g": 2.59,
      "grasa_poliinsaturada_g": 0.278,
      "fuente_nutri_ext": "USDA FoodData Central: Beef, short loin (NY strip steak), raw (fdcId 2727572, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "solomillo-ternera": {
      "nombre": "Solomillo de ternera",
      "categoria": "carne-roja",
      "kcal_100g": 126,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "proteina_g": 27,
      "grasa_g": 5,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "ternera",
      "fuente_macros": "Excel maestro Roger 2026-07 · Solomillo de ternera/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 2.12,
      "grasa_monoinsaturada_g": 2.34,
      "grasa_poliinsaturada_g": 0.45,
      "fuente_nutri_ext": "USDA FoodData Central: Beef, tenderloin steak, raw (fdcId 2727573, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "carrillera-ternera": {
      "nombre": "Carrillera de ternera",
      "categoria": "carne-roja",
      "kcal_100g": 130,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 26,
      "grasa_g": 5,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "ternera",
      "fuente_macros": "Cluster de tablas espanolas (carrillada/carrillera de ternera cruda), sin cita primaria unica confirmada",
      "confianza_macros": "media",
      "grasa_saturada_g": 6.34,
      "grasa_monoinsaturada_g": 7.02,
      "grasa_poliinsaturada_g": 0.556,
      "fuente_nutri_ext": "USDA FoodData Central: Beef, chuck, roast, boneless, choice, raw (fdcId 2646174, Foundation)",
      "confianza_nutri_ext": "media - proxy chuck, no existe corte exacto carrillera en USDA",
      "nota_macros": "Excel daba 20/11/0 -> Atwater 179 vs 130 (+37,7%). La correccion baja a 149 (+14,6%): mejora fuerte pero NO llega al objetivo de ~12% y sin cita primaria. Confianza media. Candidata a revision en BEDCA."
    },
    "rabo-ternera": {
      "nombre": "Rabo de ternera",
      "categoria": "carne-roja",
      "kcal_100g": 200,
      "racion_adulto_g": 180,
      "racion_nino_g": 110,
      "coste_banda": 2,
      "proteina_g": 19,
      "grasa_g": 14,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "ternera",
      "fuente_macros": "BEDCA (AESAN/BEDCA v1.0, 2010) · Rabo de toro, crudo (2 mirrors independientes)",
      "confianza_macros": "alta",
      "grasa_saturada_g": 6.73,
      "grasa_monoinsaturada_g": 7.35,
      "grasa_poliinsaturada_g": 0.727,
      "fuente_nutri_ext": "USDA FoodData Central: Beef, oxtails (fdcId 2705843, Survey (FNDDS))",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 19/20/0 -> Atwater 256 vs 200 (+28%). Solo sobraba grasa (20 -> 14 g); la proteina ya era correcta."
    },
    "chuletas-cerdo": {
      "nombre": "Chuletas de cerdo",
      "categoria": "carne-roja",
      "kcal_100g": 180,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 1,
      "proteina_g": 24,
      "grasa_g": 12,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cerdo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Chuletas de cerdo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 2.99,
      "grasa_monoinsaturada_g": 3.55,
      "grasa_poliinsaturada_g": 1.19,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, fresh, loin, center loin (chops), bone-in, separable lean and fat, raw (fdcId 168238, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "costillas-cerdo": {
      "nombre": "Costillas de cerdo",
      "categoria": "carne-roja",
      "kcal_100g": 250,
      "racion_adulto_g": 220,
      "racion_nino_g": 130,
      "coste_banda": 1,
      "proteina_g": 20,
      "grasa_g": 20,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cerdo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Costillas de cerdo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 6.28,
      "grasa_monoinsaturada_g": 7.78,
      "grasa_poliinsaturada_g": 2.55,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, ground, raw (fdcId 2514745, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "secreto-iberico": {
      "nombre": "Secreto ibérico",
      "categoria": "carne-roja",
      "kcal_100g": 290,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 20,
      "grasa_g": 25,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cerdo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Secreto de cerdo/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 6.24,
      "grasa_monoinsaturada_g": 8.01,
      "grasa_poliinsaturada_g": 1.92,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, fresh, shoulder, whole, separable lean and fat, raw (fdcId 167843, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "presa-iberica": {
      "nombre": "Presa ibérica",
      "categoria": "carne-roja",
      "kcal_100g": 210,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 17.7,
      "grasa_g": 15.7,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cerdo",
      "fuente_macros": "Etiqueta comercial \"Presa Iberica de Cerdo\" (Lidl Espana) via FatSecret",
      "confianza_macros": "media",
      "grasa_saturada_g": 6.24,
      "grasa_monoinsaturada_g": 8.01,
      "grasa_poliinsaturada_g": 1.92,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, fresh, shoulder, whole, separable lean and fat, raw (fdcId 167843, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 21/23/0 -> Atwater 291 vs 210 (+38,6%). Reconcilia al 1%, pero es etiqueta de UN producto concreto, no media poblacional: la presa iberica varia mucho por grado (bellota/cebo) y trim. Confianza media a proposito."
    },
    "salchichas-cerdo": {
      "nombre": "Salchichas frescas",
      "categoria": "carne-roja",
      "kcal_100g": 168,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 17.9,
      "grasa_g": 10.3,
      "hidratos_g": 0.9,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cerdo",
      "fuente_macros": "FEN-FEDECARNE (2009), \"Determinacion de macronutrientes y micronutrientes en el despiece de carne\" · SALCHICHAS FRESCAS, PORCINO",
      "confianza_macros": "alta",
      "grasa_saturada_g": 8.62,
      "grasa_monoinsaturada_g": 11,
      "grasa_poliinsaturada_g": 4.39,
      "fuente_nutri_ext": "USDA FoodData Central: Sausage, Italian, pork, mild, raw (fdcId 171631, SR Legacy)",
      "confianza_nutri_ext": "media - proxy salchicha italiana",
      "nota_macros": "Excel daba 14/25/1 -> Atwater 285 vs kcal_100g 168 (+69,6%), la peor divergencia del banco. Estudio institucional de laboratorio para esta categoria exacta (no proxy): kcal identico (168) y grasa real 10,3 g, no 25 g."
    },
    "butifarra-fresca": {
      "nombre": "Butifarra fresca",
      "categoria": "carne-roja",
      "kcal_100g": 230,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 14,
      "grasa_g": 25,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cerdo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Butifarra fresca / Salchichas frescas/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 8.62,
      "grasa_monoinsaturada_g": 11,
      "grasa_poliinsaturada_g": 4.39,
      "fuente_nutri_ext": "USDA FoodData Central: Sausage, Italian, pork, mild, raw (fdcId 171631, SR Legacy)",
      "confianza_nutri_ext": "media - proxy salchicha italiana, butifarra no existe en USDA"
    },
    "butifarra-blanca": {
      "nombre": "Butifarra blanca",
      "categoria": "carne-roja",
      "kcal_100g": 240,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 10,
      "grasa_g": 20,
      "hidratos_g": 5.5,
      "fibra_g": null,
      "base_nutricional": "crudo",
      "nota_base": "Pese a ser un embutido, el Excel la modela con tecnicas de coccion (plancha/horno/parrilla/guiso/frito), NO con “Crudo / sin cocción / conserva” como fuet/salchichon/morcilla/sobrasada -- la butifarra blanca cruda se cocina en casa (no se come tal cual se compra). Ademas kcal_100g del banco (240) esta POR DEBAJO de la propia columna crudo del Excel (320) y muy por debajo de todas sus columnas cocinado (427-522), señal consistente con que el banco referencia un embutido fresco sin cocinar, no uno listo para comer.",
      "origen": "cerdo",
      "fuente_macros": "BEDCA (AESAN/BEDCA v1.0, 2010) · Butifarra",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "embutido especifico cat/es - sin match USDA fiable",
      "nota_macros": "Excel daba 15/27/1,5 -> Atwater 309 vs 240 (+28,7%). La entrada BEDCA \"Butifarra\" no distingue blanca/negra, pero su kcal (240) coincide EXACTO con el fijado aqui (y no con los 290 de la negra), lo que resuelve a que variante corresponde."
    },
    "butifarra-negra": {
      "nombre": "Butifarra negra",
      "categoria": "carne-roja",
      "kcal_100g": 290,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": 18,
      "grasa_g": 23,
      "hidratos_g": 4,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "nota_base": "Mismo caso que butifarra-blanca: el Excel la modela con tecnicas de coccion (plancha/horno/parrilla/guiso/frito), a diferencia de morcilla (que en el Excel SI es “Crudo / sin cocción / conserva”) pese a ser un embutido de sangre muy similar -- se respeta la distincion que hace el propio Excel. kcal_100g del banco (290) esta por debajo de la columna crudo del Excel (380) y de todas las cocinado (502-595), consistente con estado crudo.",
      "origen": "cerdo",
      "fuente_macros": "Etiqueta BonArea \"Butifarra negra\" via Open Food Facts (2 codigos de producto independientes, cifras identicas)",
      "confianza_macros": "media",
      "grasa_saturada_g": 13.4,
      "grasa_monoinsaturada_g": 15.9,
      "grasa_poliinsaturada_g": 3.46,
      "fuente_nutri_ext": "USDA FoodData Central: Blood sausage (fdcId 171618, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 12/35/2 -> Atwater 371 vs 290 (+27,9%). AVISO: dato de ETIQUETA de una marca, no media poblacional. Variabilidad real enorme entre marcas (Hacendado 321 kcal, Subirats 425) por la proporcion arroz/cebolla/sangre. Se eligio BonArea por reconciliar al 1,7% con el kcal ya fijado -- criterio explicito, no \"la correcta\". Confianza rebajada a media por eso."
    },
    "cordero-pierna": {
      "nombre": "Pierna de cordero",
      "categoria": "carne-roja",
      "kcal_100g": 182,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 3,
      "proteina_g": 22,
      "grasa_g": 14,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cordero",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pierna de cordero/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 7.43,
      "grasa_monoinsaturada_g": 7,
      "grasa_poliinsaturada_g": 1.35,
      "fuente_nutri_ext": "USDA FoodData Central: Lamb, leg, whole (shank and sirloin), separable lean and fat, trimmed to 1/4\" fat, choice, raw (fdcId 174311, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "cordero-paletilla": {
      "nombre": "Paletilla de cordero",
      "categoria": "carne-roja",
      "kcal_100g": 205,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 2,
      "proteina_g": 21,
      "grasa_g": 15,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cordero",
      "fuente_macros": "Excel maestro Roger 2026-07 · Paletilla de cordero/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 9.28,
      "grasa_monoinsaturada_g": 8.79,
      "grasa_poliinsaturada_g": 1.71,
      "fuente_nutri_ext": "USDA FoodData Central: Lamb, shoulder, whole (arm and blade), separable lean and fat, trimmed to 1/4\" fat, choice, raw (fdcId 172496, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "cordero-chuletas": {
      "nombre": "Chuletas de cordero",
      "categoria": "carne-roja",
      "kcal_100g": 228,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 3,
      "proteina_g": 23,
      "grasa_g": 17,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cordero",
      "fuente_macros": "Excel maestro Roger 2026-07 · Chuletas de cordero/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 11.2,
      "grasa_monoinsaturada_g": 7.46,
      "grasa_poliinsaturada_g": 0.967,
      "fuente_nutri_ext": "USDA FoodData Central: Lamb, New Zealand, imported, loin chop, separable lean and fat, raw (fdcId 172517, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "cordero-cuello": {
      "nombre": "Cuello de cordero",
      "categoria": "carne-roja",
      "kcal_100g": 275,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 2,
      "proteina_g": 19,
      "grasa_g": 14,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "cordero",
      "fuente_macros": "Excel maestro Roger 2026-07 · Cuello de cordero/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 7.51,
      "grasa_monoinsaturada_g": 4.99,
      "grasa_poliinsaturada_g": 0.683,
      "fuente_nutri_ext": "USDA FoodData Central: Lamb, New Zealand, imported, neck chops, separable lean and fat, raw (fdcId 172637, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "alitas-pollo": {
      "nombre": "Alitas de pollo",
      "categoria": "carne-blanca",
      "kcal_100g": 217,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 1,
      "proteina_g": 19,
      "grasa_g": 13,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "pollo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Alitas de pollo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 3.54,
      "grasa_monoinsaturada_g": 5.42,
      "grasa_poliinsaturada_g": 2.5,
      "fuente_nutri_ext": "USDA FoodData Central: Chicken, wing, meat and skin, raw (fdcId 2727568, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "carne-picada-mixta": {
      "nombre": "Carne picada mixta",
      "categoria": "carne-roja",
      "kcal_100g": 190,
      "racion_adulto_g": 130,
      "racion_nino_g": 80,
      "coste_banda": 1,
      "proteina_g": 26,
      "grasa_g": 8,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "ternera",
      "fuente_macros": "Excel maestro Roger 2026-07 · Carne picada de ternera/crudo",
      "confianza_macros": "baja",
      "grasa_saturada_g": 6.28,
      "grasa_monoinsaturada_g": 7.78,
      "grasa_poliinsaturada_g": 2.55,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, ground, raw (fdcId 2514745, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "jamon-cocido": {
      "nombre": "Jamón cocido",
      "categoria": "carne-roja",
      "kcal_100g": 106,
      "racion_adulto_g": 50,
      "racion_nino_g": 30,
      "coste_banda": 2,
      "proteina_g": 20,
      "grasa_g": 4,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Jamon cocido (york) es por nombre y proceso un producto YA cocido de fabrica (no jamon crudo) que se consume habitualmente en frio, sin coccion adicional en casa -- se usa la referencia base del Excel (columna “crudo” = 120kcal/20/4/1, el estado “tal cual se compra” antes de las tecnicas OPCIONALES de plancha/horno que el Excel tambien modela para quien decide calentarlo).",
      "origen": "jamon cocido",
      "fuente_macros": "Excel maestro Roger 2026-07 · Jamón cocido/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.87,
      "grasa_monoinsaturada_g": 1.24,
      "grasa_poliinsaturada_g": 0.23,
      "fuente_nutri_ext": "USDA FoodData Central: Ham, honey, smoked, cooked (fdcId 174611, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "fuet": {
      "nombre": "Fuet",
      "categoria": "carne-roja",
      "kcal_100g": 473,
      "racion_adulto_g": 30,
      "racion_nino_g": 20,
      "coste_banda": 2,
      "proteina_g": 25,
      "grasa_g": 32,
      "hidratos_g": 2,
      "fibra_g": null,
      "base_nutricional": "cocido",
      "nota_base": "Embutido curado que se compra listo para comer, sin coccion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada).",
      "origen": "fuet",
      "fuente_macros": "Excel maestro Roger 2026-07 · Fuet/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "embutido curado especifico cat/es - sin match USDA fiable"
    },
    "salchichon": {
      "nombre": "Salchichón",
      "categoria": "carne-roja",
      "kcal_100g": 438,
      "racion_adulto_g": 30,
      "racion_nino_g": 20,
      "coste_banda": 2,
      "proteina_g": 24,
      "grasa_g": 35,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Embutido curado que se compra listo para comer, sin coccion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada).",
      "origen": "salchichon",
      "fuente_macros": "Excel maestro Roger 2026-07 · Salchichón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 9.86,
      "grasa_monoinsaturada_g": 10.6,
      "grasa_poliinsaturada_g": 1.04,
      "fuente_nutri_ext": "USDA FoodData Central: Salami, cooked, beef (fdcId 172935, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "morcilla": {
      "nombre": "Morcilla",
      "categoria": "carne-roja",
      "kcal_100g": 323,
      "racion_adulto_g": 60,
      "racion_nino_g": 30,
      "coste_banda": 1,
      "proteina_g": 14,
      "grasa_g": 33,
      "hidratos_g": 4,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Embutido curado que se compra listo para comer, sin coccion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada).",
      "origen": "morcilla",
      "fuente_macros": "Excel maestro Roger 2026-07 · Morcilla/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 13.4,
      "grasa_monoinsaturada_g": 15.9,
      "grasa_poliinsaturada_g": 3.46,
      "fuente_nutri_ext": "USDA FoodData Central: Blood sausage (fdcId 171618, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "sobrasada": {
      "nombre": "Sobrasada",
      "categoria": "carne-roja",
      "kcal_100g": 608,
      "racion_adulto_g": 30,
      "racion_nino_g": 20,
      "coste_banda": 2,
      "proteina_g": 10,
      "grasa_g": 60,
      "hidratos_g": 2,
      "fibra_g": null,
      "base_nutricional": "cocido",
      "nota_base": "Embutido curado que se compra listo para comer, sin coccion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada).",
      "origen": "sobrasada",
      "fuente_macros": "Excel maestro Roger 2026-07 · Sobrasada/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "embutido untable especifico balear - sin match USDA fiable"
    },
    "lomo-embuchado": {
      "nombre": "Lomo embuchado",
      "categoria": "carne-roja",
      "kcal_100g": 321,
      "racion_adulto_g": 30,
      "racion_nino_g": 20,
      "coste_banda": 3,
      "proteina_g": 35,
      "grasa_g": 22,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Embutido curado que se compra listo para comer, sin coccion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada).",
      "origen": "lomo embuchado",
      "fuente_macros": "Excel maestro Roger 2026-07 · Lomo embuchado/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1.6,
      "grasa_monoinsaturada_g": 2.49,
      "grasa_poliinsaturada_g": 0.44,
      "fuente_nutri_ext": "USDA FoodData Central: Pork, cured, ham, extra lean (approximately 4% fat), canned, roasted (fdcId 168280, SR Legacy)",
      "confianza_nutri_ext": "media - proxy jamon curado enlatado extra magro, no existe lomo embuchado en USDA"
    },
    "queso-curado": {
      "nombre": "Queso curado",
      "categoria": "lacteo",
      "kcal_100g": 448,
      "racion_adulto_g": 40,
      "racion_nino_g": 25,
      "coste_banda": 3,
      "proteina_g": 32,
      "grasa_g": 32,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Producto que se compra listo (queso), no se cocina en casa en el uso habitual de la app -- se usa la columna “crudo” del Excel, que para queso es la referencia “tal cual se compra” (las tecnicas de horno/plancha/parrilla del Excel modelan un gratinado opcional, no el consumo por defecto).",
      "origen": "queso",
      "fuente_macros": "Excel maestro Roger 2026-07 · Queso manchego/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 14.8,
      "grasa_monoinsaturada_g": 7.52,
      "grasa_poliinsaturada_g": 0.569,
      "fuente_nutri_ext": "USDA FoodData Central: Cheese, parmesan, hard (fdcId 170848, SR Legacy)",
      "confianza_nutri_ext": "media - proxy parmesano, no existe queso curado espanol generico"
    },
    "dorada": {
      "nombre": "Dorada",
      "categoria": "pescado-blanco",
      "kcal_100g": 125,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 19,
      "grasa_g": 1.2,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "dorada",
      "fuente_macros": "Excel maestro Roger 2026-07 · Dorada/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.511,
      "grasa_monoinsaturada_g": 0.424,
      "grasa_poliinsaturada_g": 0.743,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, sea bass, mixed species, raw (fdcId 175142, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "lenguado": {
      "nombre": "Lenguado",
      "categoria": "pescado-blanco",
      "kcal_100g": 79,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3,
      "proteina_g": 17,
      "grasa_g": 1,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "lenguado",
      "fuente_macros": "Excel maestro Roger 2026-07 · Lenguado/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.441,
      "grasa_monoinsaturada_g": 0.535,
      "grasa_poliinsaturada_g": 0.374,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, flatfish (flounder and sole species), raw (fdcId 174196, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "rape": {
      "nombre": "Rape",
      "categoria": "pescado-blanco",
      "kcal_100g": 70,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3,
      "proteina_g": 16,
      "grasa_g": 0.8,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "rape",
      "fuente_macros": "Excel maestro Roger 2026-07 · Rape/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.34,
      "grasa_monoinsaturada_g": 0.24,
      "grasa_poliinsaturada_g": 0.61,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, monkfish, raw (fdcId 173676, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "calamar": {
      "nombre": "Calamar",
      "categoria": "marisco",
      "kcal_100g": 72,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 16,
      "grasa_g": 1,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "calamar",
      "fuente_macros": "Excel maestro Roger 2026-07 · Calamar/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.358,
      "grasa_monoinsaturada_g": 0.107,
      "grasa_poliinsaturada_g": 0.524,
      "fuente_nutri_ext": "USDA FoodData Central: Mollusks, squid, mixed species, raw (fdcId 174223, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "sepia": {
      "nombre": "Sepia",
      "categoria": "marisco",
      "kcal_100g": 80,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 16,
      "grasa_g": 1,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "sepia",
      "fuente_macros": "Excel maestro Roger 2026-07 · Sepia/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.118,
      "grasa_monoinsaturada_g": 0.081,
      "grasa_poliinsaturada_g": 0.134,
      "fuente_nutri_ext": "USDA FoodData Central: Mollusks, cuttlefish, mixed species, raw (fdcId 174215, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "chipiron": {
      "nombre": "Chipirón",
      "categoria": "marisco",
      "kcal_100g": 72,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3,
      "proteina_g": 16,
      "grasa_g": 1.5,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "chipiron",
      "fuente_macros": "Excel maestro Roger 2026-07 · Chipirón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.358,
      "grasa_monoinsaturada_g": 0.107,
      "grasa_poliinsaturada_g": 0.524,
      "fuente_nutri_ext": "USDA FoodData Central: Mollusks, squid, mixed species, raw (fdcId 174223, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "pulpo": {
      "nombre": "Pulpo",
      "categoria": "marisco",
      "kcal_100g": 91,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 15,
      "grasa_g": 1,
      "hidratos_g": 2,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "pulpo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pulpo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.227,
      "grasa_monoinsaturada_g": 0.162,
      "grasa_poliinsaturada_g": 0.239,
      "fuente_nutri_ext": "USDA FoodData Central: Mollusks, octopus, common, raw (fdcId 174218, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "almejas": {
      "nombre": "Almejas",
      "categoria": "marisco",
      "kcal_100g": 48,
      "racion_adulto_g": 180,
      "racion_nino_g": 110,
      "coste_banda": 3,
      "proteina_g": 10,
      "grasa_g": 0.5,
      "hidratos_g": 2,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "almeja",
      "fuente_macros": "Excel maestro Roger 2026-07 · Almejas/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.187,
      "grasa_monoinsaturada_g": 0.12,
      "grasa_poliinsaturada_g": 0.192,
      "fuente_nutri_ext": "USDA FoodData Central: Mollusks, clam, mixed species, raw (fdcId 174214, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "atun-conserva": {
      "nombre": "Atún en conserva",
      "categoria": "pescado-azul",
      "kcal_100g": 101,
      "racion_adulto_g": 65,
      "racion_nino_g": 40,
      "coste_banda": 2,
      "proteina_g": 25,
      "grasa_g": 1,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Conserva comprada lista para comer, sin transformacion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada), coincide con el estado del kcal_100g del banco.",
      "origen": "atun",
      "fuente_macros": "Excel maestro Roger 2026-07 · Atún en conserva/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.224,
      "grasa_monoinsaturada_g": 0.114,
      "grasa_poliinsaturada_g": 0.259,
      "fuente_nutri_ext": "USDA FoodData Central: Fish, tuna, light, canned in water, drained solids (fdcId 334194, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "anchoas-conserva": {
      "nombre": "Anchoas en conserva",
      "categoria": "pescado-azul",
      "kcal_100g": 203,
      "racion_adulto_g": 25,
      "racion_nino_g": 15,
      "coste_banda": 3,
      "proteina_g": 29,
      "grasa_g": 9,
      "hidratos_g": 0,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Conserva comprada lista para comer, sin transformacion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila para este alimento, sin alternativa cocinada), coincide con el estado del kcal_100g del banco.",
      "origen": "anchoa conserva",
      "fuente_macros": "Excel maestro Roger 2026-07 · Anchoas en conserva/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 2.2,
      "grasa_monoinsaturada_g": 3.77,
      "grasa_poliinsaturada_g": 2.56,
      "fuente_nutri_ext": "USDA FoodData Central: Anchovies, canned in olive oil, with salt, drained (fdcId 2747652, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "col": {
      "nombre": "Col",
      "categoria": "verdura",
      "kcal_100g": 25,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 1,
      "proteina_g": 1.3,
      "grasa_g": 0.1,
      "hidratos_g": 5,
      "fibra_g": 2.5,
      "base_nutricional": "crudo",
      "origen": "col",
      "fuente_macros": "Excel maestro Roger 2026-07 · Col/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Cabbage, green, raw (fdcId 2346407, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "habas-tiernas": {
      "nombre": "Habas tiernas",
      "categoria": "verdura",
      "kcal_100g": 60,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "temporada": [
        2,
        3,
        4,
        5
      ],
      "proteina_g": 6,
      "grasa_g": 0.5,
      "hidratos_g": 11,
      "fibra_g": 3.3,
      "base_nutricional": "crudo",
      "origen": "haba tierna",
      "fuente_macros": "Excel maestro Roger 2026-07 · Habas tiernas/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.088,
      "grasa_monoinsaturada_g": 0.095,
      "grasa_poliinsaturada_g": 0.008,
      "fuente_nutri_ext": "USDA FoodData Central: Hyacinth-beans, immature seeds, raw (fdcId 169234, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "esparrago-blanco": {
      "nombre": "Espárrago blanco",
      "categoria": "verdura",
      "kcal_100g": 20,
      "racion_adulto_g": 125,
      "racion_nino_g": 75,
      "coste_banda": 2,
      "proteina_g": 1.8,
      "grasa_g": 0.2,
      "hidratos_g": 2.5,
      "fibra_g": 1.88,
      "base_nutricional": "crudo",
      "origen": "esparrago",
      "fuente_macros": "Excel maestro Roger 2026-07 · Espárrago blanco/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Asparagus, green, raw (fdcId 2710823, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "esparrago-verde": {
      "nombre": "Espárrago verde",
      "categoria": "verdura",
      "kcal_100g": 22,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "temporada": [
        3,
        4,
        5,
        6
      ],
      "proteina_g": 2.2,
      "grasa_g": 0.2,
      "hidratos_g": 2,
      "fibra_g": 1.88,
      "base_nutricional": "crudo",
      "origen": "esparrago",
      "fuente_macros": "Excel maestro Roger 2026-07 · Espárrago verde/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Asparagus, green, raw (fdcId 2710823, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "niscalos": {
      "nombre": "Níscalos",
      "categoria": "verdura",
      "kcal_100g": 24,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "temporada": [
        9,
        10,
        11,
        12
      ],
      "proteina_g": 2,
      "grasa_g": 0.3,
      "hidratos_g": 3,
      "fibra_g": 3.8,
      "base_nutricional": "crudo",
      "origen": "niscalo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Níscalo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Mushrooms, Chanterelle, raw (fdcId 168422, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "boletus": {
      "nombre": "Boletus",
      "categoria": "verdura",
      "kcal_100g": 30,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3,
      "temporada": [
        9,
        10,
        11
      ],
      "proteina_g": 3,
      "grasa_g": 0.5,
      "hidratos_g": 3,
      "fibra_g": 1.3,
      "base_nutricional": "crudo",
      "origen": "boletus",
      "fuente_macros": "Excel maestro Roger 2026-07 · Boletus/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.01,
      "grasa_monoinsaturada_g": 0.044,
      "grasa_poliinsaturada_g": 0.296,
      "fuente_nutri_ext": "USDA FoodData Central: Mushrooms, portabella, raw (fdcId 169255, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "cebolla": {
      "nombre": "Cebolla",
      "categoria": "verdura",
      "kcal_100g": 28,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 1,
      "base": true,
      "proteina_g": 1.1,
      "grasa_g": 0.1,
      "hidratos_g": 7,
      "fibra_g": 2.2,
      "base_nutricional": "crudo",
      "origen": "cebolla",
      "fuente_macros": "Excel maestro Roger 2026-07 · Cebolla/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Onions, red, raw (fdcId 790577, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "cebolleta": {
      "nombre": "Cebolleta",
      "categoria": "verdura",
      "kcal_100g": 32,
      "racion_adulto_g": 40,
      "racion_nino_g": 25,
      "coste_banda": 1,
      "base": true,
      "proteina_g": 1,
      "grasa_g": 0.1,
      "hidratos_g": 6,
      "fibra_g": 2.3,
      "base_nutricional": "crudo",
      "origen": "cebolleta",
      "fuente_macros": "Excel maestro Roger 2026-07 · Cebolleta/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Green onion, (scallion), bulb and greens, root removed, raw (fdcId 2727585, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "aguacate": {
      "nombre": "Aguacate",
      "categoria": "verdura",
      "kcal_100g": 145,
      "racion_adulto_g": 90,
      "racion_nino_g": 55,
      "coste_banda": 2,
      "proteina_g": 2,
      "grasa_g": 15,
      "hidratos_g": 2,
      "fibra_g": 6.7,
      "base_nutricional": "crudo",
      "origen": "aguacate",
      "fuente_macros": "Excel maestro Roger 2026-07 · Aguacate/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 2.13,
      "grasa_monoinsaturada_g": 9.8,
      "grasa_poliinsaturada_g": 1.82,
      "fuente_nutri_ext": "USDA FoodData Central: Avocado, Hass, peeled, raw (fdcId 2710824, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "masa-empanada": {
      "nombre": "Masa de empanada",
      "categoria": "cereal",
      "kcal_100g": 385,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 2,
      "proteina_g": 6,
      "grasa_g": 15,
      "hidratos_g": 35,
      "fibra_g": 1.8,
      "base_nutricional": "crudo",
      "origen": "masa",
      "fuente_macros": "Excel maestro Roger 2026-07 · Masa de empanada/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 9.6,
      "grasa_monoinsaturada_g": 10.2,
      "grasa_poliinsaturada_g": 3.29,
      "fuente_nutri_ext": "USDA FoodData Central: Pie crust, refrigerated, regular, unbaked (fdcId 167932, SR Legacy)",
      "confianza_nutri_ext": "media - proxy generico masa laminada, no existe empanada en USDA"
    },
    "noquis": {
      "nombre": "Ñoquis",
      "categoria": "cereal",
      "kcal_100g": 160,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 2,
      "proteina_g": 3.5,
      "grasa_g": 0.5,
      "hidratos_g": 33,
      "fibra_g": null,
      "base_nutricional": "crudo",
      "origen": "pasta",
      "fuente_macros": "Excel maestro Roger 2026-07 · Ñoquis/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "USDA solo tiene marcas comerciales (Branded) para gnocchi, sin entrada generica fiable"
    },
    "maiz": {
      "nombre": "Maíz dulce",
      "categoria": "cereal",
      "kcal_100g": 85,
      "racion_adulto_g": 60,
      "racion_nino_g": 40,
      "coste_banda": 1,
      "proteina_g": 3.3,
      "grasa_g": 1.2,
      "hidratos_g": 17,
      "fibra_g": 2.43,
      "base_nutricional": "crudo",
      "origen": "maiz",
      "fuente_macros": "Excel maestro Roger 2026-07 · Maíz/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Corn, sweet, yellow and white kernels,  fresh, raw (fdcId 2710826, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "arroz-bomba": {
      "nombre": "Arroz bomba",
      "categoria": "cereal",
      "kcal_100g": 350,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 2,
      "proteina_g": 6.5,
      "grasa_g": 0.7,
      "hidratos_g": 80,
      "fibra_g": 0.149,
      "base_nutricional": "crudo",
      "origen": "arroz",
      "fuente_macros": "Excel maestro Roger 2026-07 · Arroz arborio / Arroz bomba / Arroz redondo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Rice, white, long grain, unenriched, raw (fdcId 2512381, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "garbanzos": {
      "nombre": "Garbanzos cocidos",
      "categoria": "legumbre",
      "kcal_100g": 120,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1,
      "proteina_g": 6.3,
      "grasa_g": 2,
      "hidratos_g": 19.2,
      "fibra_g": 7.6,
      "base_nutricional": "cocido",
      "nota_base": "Banco mide legumbre YA COCIDA (nombre + racion_adulto_g≈200g solo tienen sentido cocida; 120kcal_100g actual no se toca). El Excel no trae fila de legumbre YA cocida como tal, pero SI trae la tecnica “Hervido / cocido normal” con columna cocinado propia por alimento (no es el factor generico de la hoja 'Equivalencia Cocciones', es un valor calculado por fila en Tabla Master) -- se usa esa columna cocinado de Garbanzo castellano / Garbanzo pedrosillano/Hervido, que ademas valida bien contra el kcal_100g ya existente del banco.",
      "origen": "garbanzo",
      "fuente_macros": "USDA FoodData Central fdcId 173757 (Chickpeas, mature seeds, cooked, boiled) escalado al kcal del banco",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.269,
      "grasa_monoinsaturada_g": 0.583,
      "grasa_poliinsaturada_g": 1.16,
      "fuente_nutri_ext": "USDA FoodData Central: Chickpeas (garbanzo beans, bengal gram), mature seeds, cooked, boiled, without salt (fdcId 173757, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Atwater daba 103,2 vs 120 (-14%). Proteina y grasa ya estaban en rango; el hueco vivia en hidratos, el macro \"por diferencia\" mas sensible a la dilucion de agua. El kcal del banco (120) es plausible como punto intermedio entre el USDA hervido-desde-seco (164) y la legumbre de bote espanola (Hacendado 83, Consum 96), que esta mas diluida."
    },
    "lentejas": {
      "nombre": "Lentejas cocidas",
      "categoria": "legumbre",
      "kcal_100g": 116,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1,
      "proteina_g": 8.3,
      "grasa_g": 0.3,
      "hidratos_g": 20,
      "fibra_g": 7.9,
      "base_nutricional": "cocido",
      "nota_base": "Banco mide legumbre YA COCIDA (nombre + racion_adulto_g≈200g solo tienen sentido cocida; 116kcal_100g actual no se toca). El Excel no trae fila de legumbre YA cocida como tal, pero SI trae la tecnica “Hervido / cocido normal” con columna cocinado propia por alimento (no es el factor generico de la hoja 'Equivalencia Cocciones', es un valor calculado por fila en Tabla Master) -- se usa esa columna cocinado de Lenteja pardina/Hervido, que ademas valida bien contra el kcal_100g ya existente del banco.",
      "origen": "lenteja",
      "fuente_macros": "USDA FoodData Central fdcId 172421 (Lentils, mature seeds, cooked, boiled)",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.053,
      "grasa_monoinsaturada_g": 0.064,
      "grasa_poliinsaturada_g": 0.175,
      "fuente_nutri_ext": "USDA FoodData Central: Lentils, mature seeds, cooked, boiled, without salt (fdcId 172421, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Atwater daba 107,9 vs 116 (-7%). EL CASO MEJOR CORROBORADO de las 4 legumbres: el kcal_100g (116) y la fibra (7,9) del banco YA eran identicos a la ficha USDA cocida real, sin escalar nada. Solo faltaba subir hidratos de 18 al 20,1 de la propia ficha. Confianza sube de baja a alta."
    },
    "alubias-blancas": {
      "nombre": "Alubias blancas cocidas",
      "categoria": "legumbre",
      "kcal_100g": 120,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1,
      "proteina_g": 7.3,
      "grasa_g": 0.5,
      "hidratos_g": 21.6,
      "fibra_g": 6.3,
      "base_nutricional": "cocido",
      "nota_base": "Banco mide legumbre YA COCIDA (nombre + racion_adulto_g≈200g solo tienen sentido cocida; 120kcal_100g actual no se toca). El Excel no trae fila de legumbre YA cocida como tal, pero SI trae la tecnica “Hervido / cocido normal” con columna cocinado propia por alimento (no es el factor generico de la hoja 'Equivalencia Cocciones', es un valor calculado por fila en Tabla Master) -- se usa esa columna cocinado de Judía blanca/Hervido, que ademas valida bien contra el kcal_100g ya existente del banco.",
      "origen": "judia blanca",
      "fuente_macros": "USDA FoodData Central fdcId 175203 (Beans, white, mature seeds, cooked, boiled) escalado al kcal del banco",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.091,
      "grasa_monoinsaturada_g": 0.031,
      "grasa_poliinsaturada_g": 0.152,
      "fuente_nutri_ext": "USDA FoodData Central: Beans, white, mature seeds, cooked, boiled, without salt (fdcId 175203, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Atwater daba 106,9 vs 120 (-11%). Requiere un paso de escalado (USDA 139 -> 120 kcal, factor 0,863), a diferencia de lentejas que coincidia 1:1 -- de ahi confianza media y no alta."
    },
    "edamame": {
      "nombre": "Edamame (soja verde)",
      "categoria": "legumbre",
      "kcal_100g": 120,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 11.9,
      "grasa_g": 5.2,
      "hidratos_g": 8.9,
      "fibra_g": 6.23,
      "base_nutricional": "crudo",
      "nota_base": "Sin match en el Excel. Se compra congelado (en vaina o desgranado) y se hierve brevemente antes de comer -- se declara 'crudo' por defecto (estado de compra habitual, congelado sin cocer) a falta de dato que permita verificar lo contrario; sin impacto numerico real porque no hay macros (sin_match).",
      "origen": null,
      "confianza_macros": "media",
      "grasa_saturada_g": 1.15,
      "grasa_monoinsaturada_g": 2.22,
      "grasa_poliinsaturada_g": 4.07,
      "fuente_nutri_ext": "USDA FoodData Central: Edamame, frozen, prepared (fdcId 2758981, Foundation)",
      "confianza_nutri_ext": "alta",
      "fuente_macros": "USDA FoodData Central · Edamame, frozen, prepared (3 mirrors independientes coincidentes)",
      "nota_macros": "Antes sin macros. Grano desvainado (no la vaina, que no se come y distorsionaria el peso). AVISO: el banco declara base_nutricional \"crudo\", pero el kcal_100g (120) encaja mucho mejor con la variedad \"prepared/cocida\" (121 kcal, -0,8%) que con la cruda (109, -9,2%) -- esa etiqueta \"crudo\" es un default no verificado."
    },
    "tofu": {
      "nombre": "Tofu",
      "categoria": "legumbre",
      "kcal_100g": 90,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "proteina_g": null,
      "grasa_g": null,
      "hidratos_g": null,
      "fibra_g": 2.3,
      "base_nutricional": "crudo",
      "nota_base": "Sin match en el Excel. El tofu es un producto procesado (soja cuajada, cocida durante la produccion) que se compra listo para comer -- caso ambiguo (mas cerca de 'producto ya elaborado' que de 'ingrediente crudo que se cocina'), pero se declara 'crudo' por defecto ante la falta de dato Excel que lo confirme como 'cocido' (mismo criterio conservador que edamame); sin impacto numerico real porque no hay macros (sin_match).",
      "origen": null,
      "confianza_macros": "sin_match",
      "grasa_saturada_g": 1.26,
      "grasa_monoinsaturada_g": 1.92,
      "grasa_poliinsaturada_g": 4.92,
      "fuente_nutri_ext": "USDA FoodData Central: Tofu, raw, firm, prepared with calcium sulfate (fdcId 172475, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "hummus": {
      "nombre": "Hummus",
      "categoria": "legumbre",
      "kcal_100g": 170,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 2,
      "proteina_g": 7.9,
      "grasa_g": 9.6,
      "hidratos_g": 14.3,
      "fibra_g": 5.5,
      "base_nutricional": "cocido",
      "nota_base": "Sin match en el Excel (plato compuesto sin receta fija). Preparacion lista para comer (garbanzo cocido + tahini + aceite + limon triturados) -- no existe “hummus crudo”, es un plato ya elaborado.",
      "origen": null,
      "confianza_macros": "media",
      "grasa_saturada_g": 2.56,
      "grasa_monoinsaturada_g": 5.34,
      "grasa_poliinsaturada_g": 8.81,
      "fuente_nutri_ext": "USDA FoodData Central: Hummus, commercial (fdcId 174289, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "fuente_macros": "USDA FoodData Central fdcId 174289 (Hummus, commercial)",
      "nota_macros": "Antes sin macros (sin_match). La fibra que ya tenia el banco (5,5) coincide EXACTA con esta ficha USDA, senal de que ya era la fuente usada. Residuo +3,1%: la propia ficha USDA tiene ~+5,5% de holgura Atwater intrinseca (tipico de platos compuestos analizados directamente); apretar mas exigiria falsear la grasa real, que en hummus es alta por el tahini y el aceite."
    },
    "legumbres-variadas": {
      "nombre": "Legumbres variadas cocidas",
      "categoria": "legumbre",
      "kcal_100g": 119,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1,
      "proteina_g": 7.3,
      "grasa_g": 0.9,
      "hidratos_g": 20.3,
      "fibra_g": 7.3,
      "base_nutricional": "cocido",
      "nota_base": "Banco mide legumbre YA COCIDA (nombre + racion_adulto_g≈200g solo tienen sentido cocida; 119kcal_100g actual no se toca). El Excel no trae fila de legumbre YA cocida como tal, pero SI trae la tecnica “Hervido / cocido normal” con columna cocinado propia por alimento (no es el factor generico de la hoja 'Equivalencia Cocciones', es un valor calculado por fila en Tabla Master) -- se usa esa columna cocinado de Lenteja pardina/Hervido, que ademas valida bien contra el kcal_100g ya existente del banco.",
      "origen": "lenteja",
      "fuente_macros": "Promedio de las 3 fichas especificas ya corregidas (garbanzos + lentejas + alubias-blancas)",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.026,
      "grasa_monoinsaturada_g": 0.009,
      "grasa_poliinsaturada_g": 0.042,
      "fuente_nutri_ext": "USDA FoodData Central: Yardlong bean, cooked, boiled, drained, with salt (fdcId 169359, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Ficha generica. Su kcal (119) y fibra (7,3) YA se comportaban como promedio de las 3 legumbres especificas, pero proteina y grasa eran copia literal de lentejas (8,3/0,3) en vez del promedio. Ahora los 4 macros siguen el mismo criterio."
    },
    "arroz": {
      "nombre": "Arroz",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 1,
      "proteina_g": 6.5,
      "grasa_g": 0.7,
      "hidratos_g": 80,
      "fibra_g": 0.149,
      "base_nutricional": "crudo",
      "origen": "arroz",
      "fuente_macros": "Excel maestro Roger 2026-07 · Arroz arborio / Arroz bomba / Arroz redondo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Rice, white, long grain, unenriched, raw (fdcId 2512381, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "pasta": {
      "nombre": "Pasta",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 1,
      "proteina_g": 13,
      "grasa_g": 1.5,
      "hidratos_g": 74,
      "fibra_g": 3.2,
      "base_nutricional": "crudo",
      "origen": "pasta",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pasta seca/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.277,
      "grasa_monoinsaturada_g": 0.171,
      "grasa_poliinsaturada_g": 0.564,
      "fuente_nutri_ext": "USDA FoodData Central: Pasta, dry, enriched (fdcId 169736, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "cuscus": {
      "nombre": "Cuscús",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 70,
      "racion_nino_g": 45,
      "coste_banda": 1,
      "proteina_g": 12,
      "grasa_g": 2,
      "hidratos_g": 68,
      "fibra_g": 5,
      "base_nutricional": "crudo",
      "origen": "cuscus",
      "fuente_macros": "Excel maestro Roger 2026-07 · Cuscús/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.117,
      "grasa_monoinsaturada_g": 0.089,
      "grasa_poliinsaturada_g": 0.252,
      "fuente_nutri_ext": "USDA FoodData Central: Couscous, dry (fdcId 169699, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "quinoa": {
      "nombre": "Quinoa",
      "categoria": "cereal",
      "kcal_100g": 370,
      "racion_adulto_g": 70,
      "racion_nino_g": 45,
      "coste_banda": 2,
      "proteina_g": 14,
      "grasa_g": 6,
      "hidratos_g": 52,
      "fibra_g": 7,
      "base_nutricional": "crudo",
      "origen": "quinoa",
      "fuente_macros": "Excel maestro Roger 2026-07 · Quinoa/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.706,
      "grasa_monoinsaturada_g": 1.61,
      "grasa_poliinsaturada_g": 3.29,
      "fuente_nutri_ext": "USDA FoodData Central: Quinoa, uncooked (fdcId 168874, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "pan-integral": {
      "nombre": "Pan integral",
      "categoria": "cereal",
      "kcal_100g": 250,
      "racion_adulto_g": 60,
      "racion_nino_g": 40,
      "coste_banda": 1,
      "proteina_g": 13,
      "grasa_g": 4,
      "hidratos_g": 41,
      "fibra_g": 6,
      "base_nutricional": "crudo",
      "origen": "pan integral",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pan integral/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Bread, 100% whole wheat, commercial (fdcId 2758994, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "fideos": {
      "nombre": "Fideos",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 70,
      "racion_nino_g": 45,
      "coste_banda": 1,
      "proteina_g": 12,
      "grasa_g": 1.5,
      "hidratos_g": 73,
      "fibra_g": 3.2,
      "base_nutricional": "crudo",
      "origen": "pasta",
      "fuente_macros": "Excel maestro Roger 2026-07 · Fideos cabello / Fideos nº0 / Fideos para fideuá/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.277,
      "grasa_monoinsaturada_g": 0.171,
      "grasa_poliinsaturada_g": 0.564,
      "fuente_nutri_ext": "USDA FoodData Central: Pasta, dry, enriched (fdcId 169736, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "masa-empanadilla": {
      "nombre": "Masa de empanadilla",
      "categoria": "cereal",
      "kcal_100g": 310,
      "racion_adulto_g": 90,
      "racion_nino_g": 60,
      "coste_banda": 2,
      "proteina_g": 6,
      "grasa_g": 18,
      "hidratos_g": 38,
      "fibra_g": 1.8,
      "base_nutricional": "crudo",
      "origen": "masa",
      "fuente_macros": "Excel maestro Roger 2026-07 · Masa de empanadilla / Oblea de empanadilla/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 9.6,
      "grasa_monoinsaturada_g": 10.2,
      "grasa_poliinsaturada_g": 3.29,
      "fuente_nutri_ext": "USDA FoodData Central: Pie crust, refrigerated, regular, unbaked (fdcId 167932, SR Legacy)",
      "confianza_nutri_ext": "media - proxy generico masa laminada, no existe empanadilla en USDA"
    },
    "tortilla-trigo": {
      "nombre": "Tortilla de trigo (wrap)",
      "categoria": "cereal",
      "kcal_100g": 290,
      "racion_adulto_g": 70,
      "racion_nino_g": 40,
      "coste_banda": 2,
      "proteina_g": 9,
      "grasa_g": 1.5,
      "hidratos_g": 55,
      "fibra_g": 3.5,
      "base_nutricional": "crudo",
      "origen": "pan",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pan de barra / Pan de payés/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 4.1,
      "grasa_monoinsaturada_g": 4.54,
      "grasa_poliinsaturada_g": 1.52,
      "fuente_nutri_ext": "USDA FoodData Central: Wheat flour, white, tortilla mix, enriched (fdcId 169724, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "pan-hamburguesa": {
      "nombre": "Pan de hamburguesa",
      "categoria": "cereal",
      "kcal_100g": 260,
      "racion_adulto_g": 60,
      "racion_nino_g": 45,
      "coste_banda": 2,
      "proteina_g": 9,
      "grasa_g": 1.5,
      "hidratos_g": 55,
      "fibra_g": 1.8,
      "base_nutricional": "crudo",
      "origen": "pan",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pan de barra / Pan de payés/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.842,
      "grasa_monoinsaturada_g": 0.748,
      "grasa_poliinsaturada_g": 1.78,
      "fuente_nutri_ext": "USDA FoodData Central: Rolls, hamburger or hotdog, plain (fdcId 172796, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "masa-pizza": {
      "nombre": "Masa de pizza",
      "categoria": "cereal",
      "kcal_100g": 270,
      "racion_adulto_g": 150,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 9,
      "grasa_g": 1.5,
      "hidratos_g": 55,
      "fibra_g": 1.8,
      "base_nutricional": "crudo",
      "origen": "pan",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pan de barra / Pan de payés/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 9.6,
      "grasa_monoinsaturada_g": 10.2,
      "grasa_poliinsaturada_g": 3.29,
      "fuente_nutri_ext": "USDA FoodData Central: Pie crust, refrigerated, regular, unbaked (fdcId 167932, SR Legacy)",
      "confianza_nutri_ext": "media - proxy masa generica, no existe masa de pizza cruda especifica"
    },
    "placas-lasana": {
      "nombre": "Placas de lasaña",
      "categoria": "cereal",
      "kcal_100g": 350,
      "racion_adulto_g": 90,
      "racion_nino_g": 60,
      "coste_banda": 2,
      "proteina_g": 13,
      "grasa_g": 1.5,
      "hidratos_g": 74,
      "fibra_g": 3.2,
      "base_nutricional": "crudo",
      "origen": "pasta",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pasta seca/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.277,
      "grasa_monoinsaturada_g": 0.171,
      "grasa_poliinsaturada_g": 0.564,
      "fuente_nutri_ext": "USDA FoodData Central: Pasta, dry, enriched (fdcId 169736, SR Legacy)",
      "confianza_nutri_ext": "media - proxy pasta generica, no existe placa de lasana especifica"
    },
    "pan-pita": {
      "nombre": "Pan de pita",
      "categoria": "cereal",
      "kcal_100g": 275,
      "racion_adulto_g": 60,
      "racion_nino_g": 40,
      "coste_banda": 2,
      "proteina_g": 9,
      "grasa_g": 1.5,
      "hidratos_g": 55,
      "fibra_g": 2.2,
      "base_nutricional": "crudo",
      "origen": "pan",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pan de barra / Pan de payés/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Bread, white, commercial (fdcId 2758993, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "pan": {
      "nombre": "Pan (barra)",
      "categoria": "cereal",
      "kcal_100g": 240,
      "racion_adulto_g": 60,
      "racion_nino_g": 40,
      "coste_banda": 1,
      "proteina_g": 9,
      "grasa_g": 1.5,
      "hidratos_g": 55,
      "fibra_g": 2.9,
      "base_nutricional": "crudo",
      "origen": "pan",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pan de barra / Pan de payés/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Bread, white, commercial (fdcId 2758993, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "patata": {
      "nombre": "Patata",
      "categoria": "tuberculo",
      "kcal_100g": 77,
      "racion_adulto_g": 220,
      "racion_nino_g": 130,
      "coste_banda": 1,
      "proteina_g": 2,
      "grasa_g": 0.1,
      "hidratos_g": 17,
      "fibra_g": 2.1,
      "base_nutricional": "crudo",
      "origen": "patata",
      "fuente_macros": "Excel maestro Roger 2026-07 · Patata/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.025,
      "grasa_monoinsaturada_g": 0.002,
      "grasa_poliinsaturada_g": 0.042,
      "fuente_nutri_ext": "USDA FoodData Central: Potatoes, flesh and skin, raw (fdcId 170026, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "boniato": {
      "nombre": "Boniato",
      "categoria": "tuberculo",
      "kcal_100g": 86,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 1,
      "proteina_g": 1.6,
      "grasa_g": 0.1,
      "hidratos_g": 20,
      "fibra_g": 3,
      "base_nutricional": "crudo",
      "origen": "boniato",
      "fuente_macros": "Excel maestro Roger 2026-07 · Boniato/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Sweet potatoes, orange flesh, without skin, raw (fdcId 2346404, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "brocoli": {
      "nombre": "Brócoli",
      "categoria": "verdura",
      "kcal_100g": 34,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "proteina_g": 2.8,
      "grasa_g": 0.4,
      "hidratos_g": 4,
      "fibra_g": 2.4,
      "base_nutricional": "crudo",
      "origen": "brocoli",
      "fuente_macros": "Excel maestro Roger 2026-07 · Brócoli/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.039,
      "grasa_monoinsaturada_g": 0.011,
      "grasa_poliinsaturada_g": 0.017,
      "fuente_nutri_ext": "USDA FoodData Central: Broccoli, raw (fdcId 747447, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "judias-verdes": {
      "nombre": "Judías verdes",
      "categoria": "verdura",
      "kcal_100g": 31,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "proteina_g": 1.8,
      "grasa_g": 0.2,
      "hidratos_g": 5,
      "fibra_g": 3.01,
      "base_nutricional": "crudo",
      "origen": "judia verde",
      "fuente_macros": "Excel maestro Roger 2026-07 · Judía verde/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Beans, snap, green, raw (fdcId 2346400, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "calabacin": {
      "nombre": "Calabacín",
      "categoria": "verdura",
      "kcal_100g": 17,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 1,
      "proteina_g": 1.2,
      "grasa_g": 0.3,
      "hidratos_g": 2.2,
      "fibra_g": 0.752,
      "base_nutricional": "crudo",
      "origen": "calabacin",
      "fuente_macros": "Excel maestro Roger 2026-07 · Calabacín/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Squash, summer, green, zucchini, includes skin, raw (fdcId 2685568, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "zanahoria": {
      "nombre": "Zanahoria",
      "categoria": "verdura",
      "kcal_100g": 41,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 0.9,
      "grasa_g": 0.2,
      "hidratos_g": 8,
      "fibra_g": 2.69,
      "base_nutricional": "crudo",
      "origen": "zanahoria",
      "fuente_macros": "Excel maestro Roger 2026-07 · Zanahoria/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Carrots, baby, raw (fdcId 2258587, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "pimiento": {
      "nombre": "Pimiento",
      "categoria": "verdura",
      "kcal_100g": 30,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 1,
      "grasa_g": 0.3,
      "hidratos_g": 5,
      "fibra_g": 1.16,
      "base_nutricional": "crudo",
      "origen": "pimiento",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pimiento rojo/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Peppers, bell, red, raw (fdcId 2258590, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "espinacas": {
      "nombre": "Espinacas",
      "categoria": "verdura",
      "kcal_100g": 23,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 2.9,
      "grasa_g": 0.4,
      "hidratos_g": 1.4,
      "fibra_g": 2.2,
      "base_nutricional": "crudo",
      "origen": "espinaca",
      "fuente_macros": "Excel maestro Roger 2026-07 · Espinacas/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.063,
      "grasa_monoinsaturada_g": 0.01,
      "grasa_poliinsaturada_g": 0.165,
      "fuente_nutri_ext": "USDA FoodData Central: Spinach, raw (fdcId 168462, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "champinones": {
      "nombre": "Champiñones",
      "categoria": "verdura",
      "kcal_100g": 22,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 2.5,
      "grasa_g": 0.3,
      "hidratos_g": 3,
      "fibra_g": 1,
      "base_nutricional": "crudo",
      "origen": "champinon",
      "fuente_macros": "Excel maestro Roger 2026-07 · Champiñón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.05,
      "grasa_monoinsaturada_g": 0,
      "grasa_poliinsaturada_g": 0.16,
      "fuente_nutri_ext": "USDA FoodData Central: Mushrooms, white, raw (fdcId 169251, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "berenjena": {
      "nombre": "Berenjena",
      "categoria": "verdura",
      "kcal_100g": 25,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "proteina_g": 1,
      "grasa_g": 0.2,
      "hidratos_g": 5.4,
      "fibra_g": 2.45,
      "base_nutricional": "crudo",
      "origen": "berenjena",
      "fuente_macros": "USDA FoodData Central fdcId 2685577 (Eggplant, raw, Foundation)",
      "confianza_macros": "media",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Eggplant, raw (fdcId 2685577, Foundation)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Atwater daba 17,8 vs 25 (-28,8%). Mismo fdcId ya citado en fuente_nutri_ext, y su fibra (2,4) ya coincidia con la del banco (2,45) -- confirmando que era la fuente correcta y que solo faltaba corregir hidratos (3 -> 5,4). Ninguna fuente USDA da hidratos=3."
    },
    "tomate": {
      "nombre": "Tomate",
      "categoria": "verdura",
      "kcal_100g": 18,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1,
      "proteina_g": 0.9,
      "grasa_g": 0.2,
      "hidratos_g": 3.5,
      "fibra_g": 1.2,
      "base_nutricional": "crudo",
      "origen": "tomate",
      "fuente_macros": "Excel maestro Roger 2026-07 · Tomate pera/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.028,
      "grasa_monoinsaturada_g": 0.031,
      "grasa_poliinsaturada_g": 0.083,
      "fuente_nutri_ext": "USDA FoodData Central: Tomatoes, red, ripe, raw, year round average (fdcId 170457, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "guisantes": {
      "nombre": "Guisantes",
      "categoria": "verdura",
      "kcal_100g": 80,
      "racion_adulto_g": 120,
      "racion_nino_g": 80,
      "coste_banda": 1,
      "proteina_g": 5,
      "grasa_g": 0.4,
      "hidratos_g": 12,
      "fibra_g": 5.7,
      "base_nutricional": "crudo",
      "origen": "guisante",
      "fuente_macros": "Excel maestro Roger 2026-07 · Guisante fresco/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.071,
      "grasa_monoinsaturada_g": 0.035,
      "grasa_poliinsaturada_g": 0.187,
      "fuente_nutri_ext": "USDA FoodData Central: Peas, green, raw (fdcId 170419, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "coliflor": {
      "nombre": "Coliflor",
      "categoria": "verdura",
      "kcal_100g": 25,
      "racion_adulto_g": 200,
      "racion_nino_g": 110,
      "coste_banda": 1,
      "proteina_g": 1.9,
      "grasa_g": 0.3,
      "hidratos_g": 3,
      "fibra_g": 1.95,
      "base_nutricional": "crudo",
      "origen": "coliflor",
      "fuente_macros": "Excel maestro Roger 2026-07 · Coliflor/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Cauliflower, raw (fdcId 2685573, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "puerro": {
      "nombre": "Puerro",
      "categoria": "verdura",
      "kcal_100g": 61,
      "racion_adulto_g": 120,
      "racion_nino_g": 70,
      "coste_banda": 1,
      "proteina_g": 1.5,
      "grasa_g": 0.3,
      "hidratos_g": 14.1,
      "fibra_g": 3,
      "base_nutricional": "crudo",
      "origen": "puerro",
      "fuente_macros": "USDA FoodData Central SR Legacy · Leeks (bulb and lower leaf-portion), raw",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Leeks, bulb and greens, root removed, raw (fdcId 2727584, Foundation)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Atwater daba 28,7 vs kcal_100g 61 (-53%), la peor del banco. kcal, proteina y grasa YA coincidian exactos con esta fuente; solo hidratos_g estaba mal transcrito (5 en vez de 14,1)."
    },
    "acelgas": {
      "nombre": "Acelgas",
      "categoria": "verdura",
      "kcal_100g": 19,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "proteina_g": 1.8,
      "grasa_g": 0.2,
      "hidratos_g": 3,
      "fibra_g": 1.6,
      "base_nutricional": "crudo",
      "origen": "acelga",
      "fuente_macros": "Excel maestro Roger 2026-07 · Acelgas/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.03,
      "grasa_monoinsaturada_g": 0.04,
      "grasa_poliinsaturada_g": 0.07,
      "fuente_nutri_ext": "USDA FoodData Central: Chard, swiss, raw (fdcId 169991, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "alcachofa": {
      "nombre": "Alcachofa",
      "categoria": "verdura",
      "kcal_100g": 47,
      "racion_adulto_g": 200,
      "racion_nino_g": 110,
      "coste_banda": 2,
      "proteina_g": 3.2,
      "grasa_g": 0.15,
      "hidratos_g": 10.5,
      "fibra_g": 5.4,
      "base_nutricional": "crudo",
      "origen": "alcachofa",
      "fuente_macros": "USDA FoodData Central fdcId 169205 (Artichokes, globe or french, raw)",
      "confianza_macros": "media",
      "grasa_saturada_g": 0.036,
      "grasa_monoinsaturada_g": 0.005,
      "grasa_poliinsaturada_g": 0.064,
      "fuente_nutri_ext": "USDA FoodData Central: Artichokes, (globe or french), raw (fdcId 169205, SR Legacy)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Atwater daba 33,8 vs 47 (-28,1%). Mismo fdcId que ya citaba fuente_nutri_ext. Hidratos casi el doble de lo transcrito (5 -> 10,5). RESIDUO CONOCIDO: queda en ~+18% porque USDA calcula el kcal de esta verdura con factores Atwater especificos (ajustados por su fibra ~5,4 g), no con los genericos 4/9/4 -- no es mala fuente, es un limite del test. Por eso confianza media, no alta."
    },
    "calabaza": {
      "nombre": "Calabaza",
      "categoria": "verdura",
      "kcal_100g": 26,
      "racion_adulto_g": 200,
      "racion_nino_g": 110,
      "coste_banda": 1,
      "proteina_g": 1,
      "grasa_g": 0.1,
      "hidratos_g": 6,
      "fibra_g": 0.5,
      "base_nutricional": "crudo",
      "origen": "calabaza",
      "fuente_macros": "Excel maestro Roger 2026-07 · Calabaza/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.052,
      "grasa_monoinsaturada_g": 0.013,
      "grasa_poliinsaturada_g": 0.005,
      "fuente_nutri_ext": "USDA FoodData Central: Winter squash, raw (fdcId 2709693, Survey (FNDDS))",
      "confianza_nutri_ext": "alta"
    },
    "lechuga": {
      "nombre": "Lechuga",
      "categoria": "verdura",
      "kcal_100g": 15,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 1,
      "proteina_g": 1.4,
      "grasa_g": 0.2,
      "hidratos_g": 1.5,
      "fibra_g": 1.2,
      "base_nutricional": "crudo",
      "origen": "lechuga",
      "fuente_macros": "Excel maestro Roger 2026-07 · Lechuga/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Lettuce, iceberg, raw (fdcId 2346388, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "pepino": {
      "nombre": "Pepino",
      "categoria": "verdura",
      "kcal_100g": 12,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 1,
      "proteina_g": 0.7,
      "grasa_g": 0.1,
      "hidratos_g": 2,
      "fibra_g": 0.7,
      "base_nutricional": "crudo",
      "origen": "pepino",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pepino/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Cucumber, with peel, raw (fdcId 2346406, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "espinacas-queso": {
      "nombre": "Relleno de espinacas y queso",
      "categoria": "verdura",
      "kcal_100g": 120,
      "racion_adulto_g": 90,
      "racion_nino_g": 60,
      "coste_banda": 2,
      "proteina_g": null,
      "grasa_g": null,
      "hidratos_g": null,
      "fibra_g": null,
      "base_nutricional": "cocido",
      "nota_base": "Sin match en el Excel (relleno compuesto sin receta fija). Relleno ya cocinado (espinacas salteadas + queso) tal como se usa en el plato -- no existe un estado crudo del relleno como ingrediente independiente.",
      "origen": null,
      "confianza_macros": "sin_match",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "relleno compuesto - sin ingrediente unico USDA aplicable"
    },
    "queso-fresco": {
      "nombre": "Queso fresco",
      "categoria": "lacteo",
      "kcal_100g": 110,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 2,
      "proteina_g": 8,
      "grasa_g": 7,
      "hidratos_g": 3,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Producto que se compra listo (queso), no se cocina en casa en el uso habitual de la app -- se usa la columna “crudo” del Excel, que para queso es la referencia “tal cual se compra” (las tecnicas de horno/plancha/parrilla del Excel modelan un gratinado opcional, no el consumo por defecto).",
      "origen": "queso",
      "fuente_macros": "Excel maestro Roger 2026-07 · Queso fresco / Mató/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 12.9,
      "grasa_monoinsaturada_g": 5.97,
      "grasa_poliinsaturada_g": 1.11,
      "fuente_nutri_ext": "USDA FoodData Central: Cheese, fresh, queso fresco (fdcId 172223, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "parmesano": {
      "nombre": "Queso parmesano (virutas)",
      "categoria": "lacteo",
      "kcal_100g": 392,
      "racion_adulto_g": 25,
      "racion_nino_g": 15,
      "coste_banda": 3,
      "proteina_g": 35.8,
      "grasa_g": 25,
      "hidratos_g": 3.22,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Producto que se compra listo (queso), no se cocina en casa — misma convención que queso-rallado/feta. Alta 30-jul-2026 (sesión higiene, rehacer el alta de la ensalada de calabacín con OK de Roger): el plato usaba `queso-rallado`, que es base:true y no puede ser fijo de una elaboración.",
      "origen": "queso",
      "fuente_macros": "Ingrediente nuevo (30-jul-2026) — macros directos de la fuente externa, verificada por API en la sesión",
      "confianza_macros": "alta",
      "grasa_saturada_g": 14.8,
      "grasa_monoinsaturada_g": 7.52,
      "grasa_poliinsaturada_g": 0.569,
      "fuente_nutri_ext": "USDA FoodData Central: Cheese, parmesan, hard (fdcId 170848, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "queso-feta": {
      "nombre": "Queso feta",
      "categoria": "lacteo",
      "kcal_100g": 260,
      "racion_adulto_g": 50,
      "racion_nino_g": 30,
      "coste_banda": 3,
      "proteina_g": 22,
      "grasa_g": 22,
      "hidratos_g": 2,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Producto que se compra listo (queso), no se cocina en casa en el uso habitual de la app -- se usa la columna “crudo” del Excel, que para queso es la referencia “tal cual se compra” (las tecnicas de horno/plancha/parrilla del Excel modelan un gratinado opcional, no el consumo por defecto).",
      "origen": "queso",
      "fuente_macros": "Excel maestro Roger 2026-07 · Queso en lonchas/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 11.2,
      "grasa_monoinsaturada_g": 4.18,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Cheese, feta, whole milk, crumbled (fdcId 2259796, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "yogur": {
      "nombre": "Yogur natural",
      "categoria": "lacteo",
      "kcal_100g": 57,
      "racion_adulto_g": 125,
      "racion_nino_g": 125,
      "coste_banda": 1,
      "unidad_g": 125,
      "proteina_g": 4,
      "grasa_g": 3,
      "hidratos_g": 4.5,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "yogur",
      "fuente_macros": "Excel maestro Roger 2026-07 · Yogur natural/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 2.32,
      "grasa_monoinsaturada_g": 0.874,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Yogurt, plain, whole milk (fdcId 2259793, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "bechamel": {
      "nombre": "Bechamel casera (leche, harina y mantequilla)",
      "categoria": "otro",
      "kcal_100g": 152,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 1,
      "proteina_g": null,
      "grasa_g": null,
      "hidratos_g": null,
      "fibra_g": null,
      "base_nutricional": "cocido",
      "nota_base": "Sin match en el Excel (plato compuesto sin receta fija). Salsa cocinada (roux de mantequilla+harina+leche) -- no existe “bechamel cruda”, es una preparacion que por definicion ya esta cocinada.",
      "origen": null,
      "confianza_macros": "sin_match",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": null,
      "confianza_nutri_ext": null,
      "nota_nutri_ext": "salsa compuesta (leche+harina+mantequilla) - sin ingrediente unico USDA aplicable"
    },
    "leche": {
      "nombre": "Leche entera",
      "categoria": "lacteo",
      "kcal_100g": 63,
      "racion_adulto_g": 220,
      "racion_nino_g": 200,
      "coste_banda": 1,
      "base": true,
      "proteina_g": 3.3,
      "grasa_g": 3.6,
      "hidratos_g": 4.8,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "leche",
      "fuente_macros": "Excel maestro Roger 2026-07 · Leche entera/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1.86,
      "grasa_monoinsaturada_g": 0.688,
      "grasa_poliinsaturada_g": 0.108,
      "fuente_nutri_ext": "USDA FoodData Central: Milk, whole, 3.25% milkfat, with added vitamin D (fdcId 746782, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "nata": {
      "nombre": "Nata líquida para cocinar",
      "categoria": "lacteo",
      "kcal_100g": 190,
      "racion_adulto_g": 40,
      "racion_nino_g": 30,
      "coste_banda": 2,
      "base": true,
      "proteina_g": 2.4,
      "grasa_g": 18,
      "hidratos_g": 4.4,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "nata",
      "fuente_macros": "Central Lechera Asturiana \"Nata para cocinar\" 18% M.G. (FatSecret + Open Food Facts, cifras identicas)",
      "confianza_macros": "alta",
      "grasa_saturada_g": 20.4,
      "grasa_monoinsaturada_g": 7.34,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Cream, heavy (fdcId 2346386, Foundation)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 2/35/3 -> Atwater 335 vs 190 (+76,3%), la mayor divergencia relativa del banco. La grasa de 35 g es NATA DE MONTAR; el kcal_100g de 190 ya indicaba nata para COCINAR (18% MG). No era un error de medida sino de que producto se estaba describiendo."
    },
    "mantequilla": {
      "nombre": "Mantequilla",
      "categoria": "lacteo",
      "kcal_100g": 730,
      "racion_adulto_g": 12,
      "racion_nino_g": 8,
      "coste_banda": 2,
      "base": true,
      "proteina_g": 0.6,
      "grasa_g": 81,
      "hidratos_g": 0.6,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Producto que se compra ya elaborado (batido de nata en fabrica), sin transformacion en casa -- tecnica Excel = “Crudo / sin cocción / conserva” (unica fila), mismo patron que jamon/embutidos curados.",
      "origen": "mantequilla",
      "fuente_macros": "Excel maestro Roger 2026-07 · Mantequilla/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 45.6,
      "grasa_monoinsaturada_g": 16.9,
      "grasa_poliinsaturada_g": 2.52,
      "fuente_nutri_ext": "USDA FoodData Central: Butter, stick, salted (fdcId 790508, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "queso-rallado": {
      "nombre": "Queso rallado para gratinar",
      "categoria": "lacteo",
      "kcal_100g": 380,
      "racion_adulto_g": 25,
      "racion_nino_g": 15,
      "coste_banda": 2,
      "base": true,
      "proteina_g": 25,
      "grasa_g": 28,
      "hidratos_g": 1,
      "fibra_g": 0,
      "base_nutricional": "cocido",
      "nota_base": "Producto que se compra listo (queso), no se cocina en casa en el uso habitual de la app -- se usa la columna “crudo” del Excel, que para queso es la referencia “tal cual se compra” (las tecnicas de horno/plancha/parrilla del Excel modelan un gratinado opcional, no el consumo por defecto).",
      "origen": "queso",
      "fuente_macros": "Excel maestro Roger 2026-07 · Queso rallado/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 11.5,
      "grasa_monoinsaturada_g": 5.1,
      "grasa_poliinsaturada_g": 0.861,
      "fuente_nutri_ext": "USDA FoodData Central: Cheese, mozzarella, low moisture, part-skim, shredded (fdcId 170900, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "nuez": {
      "nombre": "Nueces",
      "categoria": "otro",
      "kcal_100g": 689,
      "racion_adulto_g": 20,
      "racion_nino_g": 12,
      "coste_banda": 3,
      "proteina_g": 15.23,
      "grasa_g": 65.21,
      "hidratos_g": 7.01,
      "fibra_g": 6.7,
      "base_nutricional": "crudo",
      "origen": "nuez",
      "fuente_macros": "Ingrediente nuevo (28-jul-2026, para 'Ensalada de calabacín, nueces y parmesano') -- no viene del Excel maestro de Roger, macros tomados directos de la fuente externa verificada",
      "confianza_macros": "alta",
      "grasa_saturada_g": 6.126,
      "grasa_monoinsaturada_g": 8.933,
      "grasa_poliinsaturada_g": 47.174,
      "fuente_nutri_ext": "USDA FoodData Central: Nuts, walnuts, english (fdcId 170187, SR Legacy) -- mismo registro ya usado en bd_v5/datos/nutricion.js para este alimento",
      "confianza_nutri_ext": "alta"
    },
    "leche-sin-lactosa": {
      "nombre": "Leche sin lactosa",
      "categoria": "lacteo",
      "kcal_100g": 63,
      "racion_adulto_g": 220,
      "racion_nino_g": 200,
      "coste_banda": 1,
      "proteina_g": 3.2,
      "grasa_g": 1.5,
      "hidratos_g": 5,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "leche",
      "fuente_macros": "Excel maestro Roger 2026-07 · Leche sin lactosa/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 1.25,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: LACTOSE FREE REDUCED FAT MILK (fdcId 2466947, Branded)",
      "confianza_nutri_ext": "alta"
    },
    "bebida-avena": {
      "nombre": "Bebida de avena",
      "categoria": "lacteo",
      "kcal_100g": 40,
      "racion_adulto_g": 220,
      "racion_nino_g": 200,
      "coste_banda": 2,
      "proteina_g": 2,
      "grasa_g": 1.5,
      "hidratos_g": 5,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "leche vegetal",
      "fuente_macros": "Excel maestro Roger 2026-07 · Leche vegetal (avena/soja)/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Oat milk, unsweetened, plain, refrigerated (fdcId 2257046, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "bebida-soja": {
      "nombre": "Bebida de soja",
      "categoria": "lacteo",
      "kcal_100g": 40,
      "racion_adulto_g": 220,
      "racion_nino_g": 200,
      "coste_banda": 1,
      "proteina_g": 2,
      "grasa_g": 1.5,
      "hidratos_g": 5,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "leche vegetal",
      "fuente_macros": "Excel maestro Roger 2026-07 · Leche vegetal (avena/soja)/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.314,
      "grasa_monoinsaturada_g": 0.416,
      "grasa_poliinsaturada_g": 1.15,
      "fuente_nutri_ext": "USDA FoodData Central: Soy milk, unsweetened, plain, shelf stable (fdcId 1999630, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "yogur-sin-lactosa": {
      "nombre": "Yogur sin lactosa",
      "categoria": "lacteo",
      "kcal_100g": 60,
      "racion_adulto_g": 125,
      "racion_nino_g": 125,
      "coste_banda": 2,
      "proteina_g": 4,
      "grasa_g": 2,
      "hidratos_g": 5,
      "fibra_g": 0,
      "base_nutricional": "crudo",
      "origen": "yogur",
      "fuente_macros": "Excel maestro Roger 2026-07 · Yogur sin lactosa/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 1,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: PLAIN LACTOSE FREE YOGURT, PLAIN (fdcId 2266947, Branded)",
      "confianza_nutri_ext": "media - fuente Branded, marca unica no generico"
    },
    "helado": {
      "nombre": "Helado (vainilla o chocolate)",
      "categoria": "otro",
      "kcal_100g": 190,
      "racion_adulto_g": 70,
      "racion_nino_g": 50,
      "coste_banda": 2,
      "proteina_g": 3.5,
      "grasa_g": 11,
      "hidratos_g": 23,
      "fibra_g": 0.7,
      "base_nutricional": "crudo",
      "nota_base": "Postre elaborado que se compra listo (no se 'cocina' en casa), pero el Excel lo modela con tecnicas de vapor/microondas/horno (no con 'Crudo / sin cocción / conserva' como jamon/embutidos/mantequilla) -- se mantiene 'crudo' por defecto siguiendo la clasificacion tecnica del propio Excel, aunque es un caso limitrofe (ver informe final: decision de criterio sin cobertura explicita de la spec).",
      "origen": "helado",
      "fuente_macros": "Excel maestro Roger 2026-07 · Helado vainilla/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": 6.79,
      "grasa_monoinsaturada_g": 2.97,
      "grasa_poliinsaturada_g": 0.452,
      "fuente_nutri_ext": "USDA FoodData Central: Ice creams, vanilla (fdcId 167575, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "compota": {
      "nombre": "Compota de manzana o pera",
      "categoria": "otro",
      "kcal_100g": 70,
      "racion_adulto_g": 110,
      "racion_nino_g": 80,
      "coste_banda": 2,
      "proteina_g": 0.3,
      "grasa_g": 0.2,
      "hidratos_g": 17,
      "fibra_g": 1.1,
      "base_nutricional": "cocido",
      "nota_base": "Compota es por definicion fruta ya cocinada/reducida con azucar -- no existe “compota cruda”, y la fruta sin cocinar ya se traza aparte en el banco (manzana, pera, con su propia ficha). La columna “crudo” del Excel para “Compota de manzana/pera” representa ya el preparado cocinado de base (70kcal), antes de tecnicas de reduccion adicional (Hervido/Vapor/Horno, que suben a 74-96kcal) que no son el uso por defecto.",
      "origen": "compota",
      "fuente_macros": "Excel maestro Roger 2026-07 · Compota de manzana / Compota de pera/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Applesauce, unsweetened, with added vitamin C (fdcId 2346414, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "naranja": {
      "nombre": "Naranja",
      "categoria": "fruta",
      "kcal_100g": 38,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        1,
        2,
        3,
        4,
        5,
        6,
        10,
        11,
        12
      ],
      "proteina_g": 0.9,
      "grasa_g": 0.1,
      "hidratos_g": 10,
      "fibra_g": 2,
      "base_nutricional": "crudo",
      "origen": "naranja",
      "fuente_macros": "Excel maestro Roger 2026-07 · Naranja/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Oranges, raw, navels (fdcId 746771, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "mandarina": {
      "nombre": "Mandarina",
      "categoria": "fruta",
      "kcal_100g": 40,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        1,
        2,
        3,
        4,
        5,
        9,
        10,
        11,
        12
      ],
      "proteina_g": 0.8,
      "grasa_g": 0.2,
      "hidratos_g": 11,
      "fibra_g": 1.8,
      "base_nutricional": "crudo",
      "origen": "mandarina",
      "fuente_macros": "Excel maestro Roger 2026-07 · Mandarina/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.039,
      "grasa_monoinsaturada_g": 0.06,
      "grasa_poliinsaturada_g": 0.065,
      "fuente_nutri_ext": "USDA FoodData Central: Tangerines, (mandarin oranges), raw (fdcId 169105, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "fresa": {
      "nombre": "Fresas",
      "categoria": "fruta",
      "kcal_100g": 36,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        1,
        2,
        3,
        4,
        5
      ],
      "proteina_g": 0.7,
      "grasa_g": 0.3,
      "hidratos_g": 6,
      "fibra_g": 2,
      "base_nutricional": "crudo",
      "origen": "fresa",
      "fuente_macros": "Excel maestro Roger 2026-07 · Fresa / Fresón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Strawberries, raw (fdcId 2346409, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "cereza": {
      "nombre": "Cerezas",
      "categoria": "fruta",
      "kcal_100g": 63,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "temporada": [
        4,
        5,
        6,
        7,
        8
      ],
      "proteina_g": 1,
      "grasa_g": 0.2,
      "hidratos_g": 13,
      "fibra_g": 2.1,
      "base_nutricional": "crudo",
      "origen": "cereza",
      "fuente_macros": "Excel maestro Roger 2026-07 · Cereza / Picota/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Cherries, sweet, dark red, raw (fdcId 2346399, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "albaricoque": {
      "nombre": "Albaricoques",
      "categoria": "fruta",
      "kcal_100g": 42,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        5,
        6,
        7,
        8
      ],
      "proteina_g": 1.4,
      "grasa_g": 0.1,
      "hidratos_g": 8,
      "fibra_g": 1.51,
      "base_nutricional": "crudo",
      "origen": "albaricoque",
      "fuente_macros": "Excel maestro Roger 2026-07 · Albaricoque/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Apricot, with skin, raw (fdcId 2710815, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "melocoton": {
      "nombre": "Melocotón",
      "categoria": "fruta",
      "kcal_100g": 39,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "proteina_g": 0.9,
      "grasa_g": 0.2,
      "hidratos_g": 9,
      "fibra_g": 1.5,
      "base_nutricional": "crudo",
      "origen": "melocoton",
      "fuente_macros": "Excel maestro Roger 2026-07 · Melocotón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Peaches, yellow, raw (fdcId 325430, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "sandia": {
      "nombre": "Sandía",
      "categoria": "fruta",
      "kcal_100g": 20,
      "racion_adulto_g": 250,
      "racion_nino_g": 150,
      "coste_banda": 1,
      "temporada": [
        5,
        6,
        7,
        8,
        9
      ],
      "proteina_g": 0.4,
      "grasa_g": 0.1,
      "hidratos_g": 4.5,
      "fibra_g": 0.4,
      "base_nutricional": "crudo",
      "origen": "sandia",
      "fuente_macros": "BEDCA (AESAN/BEDCA v1.0, 2010) · Sandia",
      "confianza_macros": "media",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Watermelon, seedless, flesh only, raw (fdcId 2747675, Foundation)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Excel daba 0,6/0,2/6 -> Atwater 28,2 vs 20 (+41%). BEDCA da 20 kcal con 0,4/0,1/4,5: reconcilia casi exacto. USDA da ~30 kcal para sandia (dato real tambien), pero sus macros no sirven aqui porque el kcal fijado es el de BEDCA -- no mezclar fuentes."
    },
    "melon": {
      "nombre": "Melón",
      "categoria": "fruta",
      "kcal_100g": 27,
      "racion_adulto_g": 250,
      "racion_nino_g": 150,
      "coste_banda": 1,
      "temporada": [
        5,
        6,
        7,
        8,
        9
      ],
      "proteina_g": 0.6,
      "grasa_g": 0.2,
      "hidratos_g": 7,
      "fibra_g": 0.8,
      "base_nutricional": "crudo",
      "origen": "melon",
      "fuente_macros": "Excel maestro Roger 2026-07 · Melón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Melons, cantaloupe, raw (fdcId 746770, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "uva": {
      "nombre": "Uvas",
      "categoria": "fruta",
      "kcal_100g": 68,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "temporada": [
        8,
        9,
        10,
        11,
        12
      ],
      "proteina_g": 0.6,
      "grasa_g": 0.2,
      "hidratos_g": 16,
      "fibra_g": 0.9,
      "base_nutricional": "crudo",
      "origen": "uva",
      "fuente_macros": "Excel maestro Roger 2026-07 · Uva tinta/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.054,
      "grasa_monoinsaturada_g": 0.007,
      "grasa_poliinsaturada_g": 0.048,
      "fuente_nutri_ext": "USDA FoodData Central: Grapes, red or green (European type, such as Thompson seedless), raw (fdcId 174683, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "caqui": {
      "nombre": "Caqui",
      "categoria": "fruta",
      "kcal_100g": 67,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        1,
        9,
        10,
        11,
        12
      ],
      "proteina_g": 0.6,
      "grasa_g": 0.2,
      "hidratos_g": 16,
      "fibra_g": 3.6,
      "base_nutricional": "crudo",
      "origen": "caqui",
      "fuente_macros": "Excel maestro Roger 2026-07 · Caqui / Persimón/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.02,
      "grasa_monoinsaturada_g": 0.037,
      "grasa_poliinsaturada_g": 0.043,
      "fuente_nutri_ext": "USDA FoodData Central: Persimmons, japanese, raw (fdcId 169941, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "manzana": {
      "nombre": "Manzana",
      "categoria": "fruta",
      "kcal_100g": 50,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "proteina_g": 0.3,
      "grasa_g": 0.2,
      "hidratos_g": 12,
      "fibra_g": 2.08,
      "base_nutricional": "crudo",
      "origen": "manzana",
      "fuente_macros": "Excel maestro Roger 2026-07 · Manzana golden/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Apples, fuji, with skin, raw (fdcId 1750340, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "pera": {
      "nombre": "Pera",
      "categoria": "fruta",
      "kcal_100g": 45,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        1,
        2,
        3,
        4,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      "proteina_g": 0.4,
      "grasa_g": 0.1,
      "hidratos_g": 13,
      "fibra_g": 3.1,
      "base_nutricional": "crudo",
      "origen": "pera",
      "fuente_macros": "Excel maestro Roger 2026-07 · Pera conferencia/crudo",
      "confianza_macros": "media",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Pears, raw, bartlett (fdcId 746773, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "platano": {
      "nombre": "Plátano",
      "categoria": "fruta",
      "kcal_100g": 89,
      "racion_adulto_g": 120,
      "racion_nino_g": 80,
      "coste_banda": 1,
      "proteina_g": 1.1,
      "grasa_g": 0.3,
      "hidratos_g": 20,
      "fibra_g": 1.7,
      "base_nutricional": "crudo",
      "origen": "platano",
      "fuente_macros": "Excel maestro Roger 2026-07 · Plátano / Banana/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Bananas, overripe, raw (fdcId 1105073, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "kiwi": {
      "nombre": "Kiwi",
      "categoria": "fruta",
      "kcal_100g": 52,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        1,
        2,
        3,
        4,
        9,
        10,
        11,
        12
      ],
      "proteina_g": 1.1,
      "grasa_g": 0.5,
      "hidratos_g": 13,
      "fibra_g": 3,
      "base_nutricional": "crudo",
      "origen": "kiwi",
      "fuente_macros": "Excel maestro Roger 2026-07 · Kiwi/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Kiwifruit, green, raw (fdcId 327046, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "ciruela": {
      "nombre": "Ciruelas",
      "categoria": "fruta",
      "kcal_100g": 46,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        5,
        6,
        7,
        8,
        9
      ],
      "proteina_g": 0.7,
      "grasa_g": 0.3,
      "hidratos_g": 10,
      "fibra_g": 1.35,
      "base_nutricional": "crudo",
      "origen": "ciruela",
      "fuente_macros": "Excel maestro Roger 2026-07 · Ciruela/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Plum, black, with skin, raw (fdcId 2710837, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "pina": {
      "nombre": "Piña",
      "categoria": "fruta",
      "kcal_100g": 50,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 0.5,
      "grasa_g": 0.1,
      "hidratos_g": 11,
      "fibra_g": 0.935,
      "base_nutricional": "crudo",
      "origen": "pina",
      "fuente_macros": "Excel maestro Roger 2026-07 · Piña/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Pineapple, raw (fdcId 2346398, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "granada": {
      "nombre": "Granada",
      "categoria": "fruta",
      "kcal_100g": 65,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "temporada": [
        9,
        10,
        11
      ],
      "proteina_g": 1,
      "grasa_g": 1,
      "hidratos_g": 15,
      "fibra_g": 4,
      "base_nutricional": "crudo",
      "origen": "granada",
      "fuente_macros": "Excel maestro Roger 2026-07 · Granada/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.12,
      "grasa_monoinsaturada_g": 0.093,
      "grasa_poliinsaturada_g": 0.079,
      "fuente_nutri_ext": "USDA FoodData Central: Pomegranates, raw (fdcId 169134, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "higo": {
      "nombre": "Higos",
      "categoria": "fruta",
      "kcal_100g": 66,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2,
      "temporada": [
        6,
        7,
        8,
        9,
        10
      ],
      "proteina_g": 0.8,
      "grasa_g": 0.3,
      "hidratos_g": 16,
      "fibra_g": 2.9,
      "base_nutricional": "crudo",
      "origen": "higo",
      "fuente_macros": "Excel maestro Roger 2026-07 · Higo/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0.06,
      "grasa_monoinsaturada_g": 0.066,
      "grasa_poliinsaturada_g": 0.144,
      "fuente_nutri_ext": "USDA FoodData Central: Figs, raw (fdcId 173021, SR Legacy)",
      "confianza_nutri_ext": "alta"
    },
    "mango": {
      "nombre": "Mango",
      "categoria": "fruta",
      "kcal_100g": 60,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 2,
      "proteina_g": 0.8,
      "grasa_g": 0.4,
      "hidratos_g": 13,
      "fibra_g": 1.29,
      "base_nutricional": "crudo",
      "origen": "mango",
      "fuente_macros": "Excel maestro Roger 2026-07 · Mango/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Mango, Ataulfo, peeled, raw (fdcId 2710834, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "nectarina": {
      "nombre": "Nectarinas",
      "categoria": "fruta",
      "kcal_100g": 44,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1,
      "temporada": [
        4,
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "proteina_g": 1.1,
      "grasa_g": 0.3,
      "hidratos_g": 9,
      "fibra_g": 1.5,
      "base_nutricional": "crudo",
      "origen": "nectarina",
      "fuente_macros": "Excel maestro Roger 2026-07 · Nectarina/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": 0,
      "grasa_monoinsaturada_g": 0,
      "grasa_poliinsaturada_g": 0,
      "fuente_nutri_ext": "USDA FoodData Central: Nectarines, raw (fdcId 327357, Foundation)",
      "confianza_nutri_ext": "alta"
    },
    "frambuesa": {
      "nombre": "Frambuesas",
      "categoria": "fruta",
      "kcal_100g": 40,
      "racion_adulto_g": 120,
      "racion_nino_g": 80,
      "coste_banda": 3,
      "proteina_g": 1.2,
      "grasa_g": 0.5,
      "hidratos_g": 7,
      "fibra_g": 6.5,
      "base_nutricional": "crudo",
      "origen": "frambuesa",
      "fuente_macros": "BEDCA (AESAN/BEDCA v1.0, 2010) · Frambuesa",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Raspberries, raw (fdcId 2346410, Foundation)",
      "confianza_nutri_ext": "alta",
      "nota_macros": "Atwater daba 29,3 vs 40 (-26,7%). La proteina (1,2) coincidia exacta con BEDCA Y con USDA. El error: hidratos_g=5 no recogia el total de carbohidratos (que incluye la fibra en el computo por diferencia); el valor completo es 7. La fibra (6,5) ya era correcta."
    },
    "arandanos": {
      "nombre": "Arándanos",
      "categoria": "fruta",
      "kcal_100g": 45,
      "racion_adulto_g": 120,
      "racion_nino_g": 80,
      "coste_banda": 3,
      "proteina_g": 1,
      "grasa_g": 0.5,
      "hidratos_g": 8,
      "fibra_g": 2.4,
      "base_nutricional": "crudo",
      "origen": "arandano",
      "fuente_macros": "Excel maestro Roger 2026-07 · Arándanos/crudo",
      "confianza_macros": "alta",
      "grasa_saturada_g": null,
      "grasa_monoinsaturada_g": null,
      "grasa_poliinsaturada_g": null,
      "fuente_nutri_ext": "USDA FoodData Central: Blueberries, raw (fdcId 2346411, Foundation)",
      "confianza_nutri_ext": "alta"
    }
  },
  "categorias_cuota": {
    "legumbre": {
      "min_sem": 3,
      "max_sem": 4
    },
    "pescado-total": {
      "min_sem": 2,
      "max_sem": null
    },
    "pescado-azul": {
      "min_sem": 1,
      "max_sem": 2
    },
    "carne-roja": {
      "min_sem": 0,
      "max_sem": 2
    },
    "huevo": {
      "min_sem": 3,
      "max_sem": 4
    },
    "fritos": {
      "min_sem": 0,
      "max_sem": 2
    }
  },
  "grupos": {
    "proteina": [
      "carne-blanca",
      "carne-roja",
      "pescado-blanco",
      "pescado-azul",
      "marisco",
      "huevo",
      "legumbre",
      "otro"
    ],
    "hidrato": [
      "cereal",
      "tuberculo",
      "legumbre",
      "pan"
    ],
    "verdura": [
      "verdura"
    ]
  },
  "tecnicas_coccion": {
    "plancha": {
      "salubridad": 1,
      "fuente": "AC25 (2025) p.31: \"Se dará prioridad a utilizar técnicas culinarias más saludables como horno, vapor, hervido, plancha...\"",
      "factor_kcal": null,
      "kcal_extra_racion": null
    },
    "horno": {
      "salubridad": 1,
      "fuente": "AC25 (2025) p.31 (misma cita)",
      "factor_kcal": null,
      "kcal_extra_racion": null
    },
    "vapor": {
      "salubridad": 1,
      "fuente": "AC25 (2025) p.31 (misma cita)",
      "factor_kcal": null,
      "kcal_extra_racion": null
    },
    "hervido": {
      "salubridad": 1,
      "fuente": "AC25 (2025) p.31 (misma cita)",
      "factor_kcal": null,
      "kcal_extra_racion": null
    },
    "guisado": {
      "salubridad": null,
      "fuente": "HUECO — AI22 (2022) p.33 lista \"el guiso\" junto a \"la fritura\" sin jerarquía; el sofrito (base del guiso) sí es nivel 1 en AC25/SENC25, pero no se extrapola al guisado terminado",
      "factor_kcal": null,
      "kcal_extra_racion": 90
    },
    "salteado": {
      "salubridad": null,
      "fuente": "HUECO — sin cita de ranking en AI22/AC25/SENC25 ni en búsqueda ampliada",
      "factor_kcal": null,
      "kcal_extra_racion": 90
    },
    "frito": {
      "salubridad": 3,
      "fuente": "AC25 (2025) p.30-31: \"cuanto menos mejor: ...frituras...\" + \"frente a otras [técnicas] como frituras, rebozados...\"",
      "factor_kcal": {
        "hidrato": 3.8,
        "proteina": 1.3,
        "verdura": null
      },
      "kcal_extra_racion": null
    },
    "crudo": {
      "salubridad": null,
      "fuente": "HUECO en el eje calórico — únicas citas encontradas (SENC25 p.7 mercurio pescado azul crudo, AC25 p.38 alergenicidad huevo crudo) son de seguridad alimentaria, no de salubridad calórica",
      "factor_kcal": null,
      "kcal_extra_racion": null
    },
    "ensalada": {
      "salubridad": 1,
      "fuente": "AC25 (2025) p.31: verdura cruda aliñada con aceite de oliva = ideal saludable (misma cita que plancha/horno/vapor/hervido). Preparación PROPIA, distinta de \"crudo\" (Roger 2026-07-21): la ensalada siempre lleva ≥2 verduras salvo tomate/pepino que valen solos, y SIEMPRE va aliñada",
      "factor_kcal": null,
      "kcal_extra_racion": 45
    },
    "papillote": {
      "salubridad": 1,
      "fuente": "AC25 (2025) p.31 (misma cita que horno/vapor/plancha/hervido) — envuelto y cocido en su propio jugo, sin grasa añadida; técnica NUEVA (Fase 3, Roger 2026-07-21, borrador §Preparaciones·PESCADO+HUEVOS: \"papillote, o plegar en horno\"), tratada como variante de horno sin factor propio",
      "factor_kcal": null,
      "kcal_extra_racion": null
    },
    "coleslaw": {
      "salubridad": null,
      "fuente": "HUECO — sin cita AC25/AI22/SENC25 propia; la col cruda es saludable pero el aliño de mayonesa (alto en grasa) no encaja en la cita de \"verdura cruda con aceite de oliva\" que sustenta salubridad=1 en ensalada",
      "factor_kcal": null,
      "kcal_extra_racion": 150
    }
  },
  "acabados": {
    "rebozado": {
      "salubridad": 3,
      "fuente": "AC25 (2025) p.31: \"...frituras, rebozados...\" — nombrado explícito",
      "factor_kcal": {
        "proteina": 2.3
      }
    },
    "empanado": {
      "salubridad": 3,
      "fuente": "HUECO cita directa — nivel heredado por analogía con rebozado (misma familia: cubrir+freír)",
      "factor_kcal": {
        "proteina": 2.3
      }
    },
    "tempura": {
      "salubridad": 3,
      "fuente": "HUECO cita directa — nivel heredado por analogía con rebozado",
      "factor_kcal": {
        "proteina": 2.3
      }
    },
    "enharinado": {
      "salubridad": 2,
      "fuente": "research 2026-07-21 §Enharinado vs rebozado: velo de harina, poca absorción de aceite, \"~mitad de kcal extra que el rebozado\" (+50-80 kcal/ración vs +120-200 del rebozado). factor_kcal derivado: mismo extra ABSOLUTO que rebozado (kcal_100g×2.3 − kcal_100g) partido por 2, sobre la referencia merluza (90 kcal/100g): extra rebozado 117 → mitad 58.5 → factor 1.65. Salubridad intermedia (2, no 3 como rebozado/empanado): mucha menos grasa retenida",
      "factor_kcal": {
        "proteina": 1.65
      }
    }
  },
  "elaboraciones": [
    {
      "id": "plancha-guarnicion",
      "nombre": "{proteina} a la plancha",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "A la plancha o al horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Salpimentar {proteina} y dejar atemperar 10 minutos.",
        "Cocer {hidrato} según su tiempo y reservar.",
        "Saltear o cocer al vapor {verdura} con un chorrito de aceite de oliva.",
        "Hacer {proteina} a la plancha vuelta y vuelta hasta que esté hecho por dentro.",
        "Emplatar {proteina} con {hidrato} y {verdura} al lado."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "pavo",
          "merluza",
          "salmon",
          "cerdo",
          "ternera",
          "entrecot-ternera",
          "solomillo-ternera",
          "secreto-iberico",
          "presa-iberica"
        ],
        "fijos": null
      }
    },
    {
      "id": "horno-bandeja",
      "nombre": "{proteina} al horno",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "A la plancha o al horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} y {verdura} en trozos similares y repartir en la bandeja con aceite y sal.",
        "Colocar {proteina} sobre las verduras, salpimentar y regar con un poco de aceite.",
        "Hornear 30-35 minutos hasta que {proteina} esté hecho y {hidrato} tierno.",
        "Dejar reposar 5 minutos antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "cerdo",
          "merluza",
          "salmon",
          "lubina",
          "costillas-cerdo",
          "cordero-pierna",
          "cordero-paletilla",
          "cordero-chuletas"
        ],
        "fijos": null
      }
    },
    {
      "id": "lentejas-guiso",
      "nombre": "Lentejas guisadas con verduras",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír ajo y cebolla en la olla con un poco de aceite de oliva.",
        "Añadir {verdura} en trozos pequeños y rehogar 5 minutos.",
        "Incorporar las lentejas y cubrir con caldo o agua.",
        "Cocer a fuego medio 20-25 minutos removiendo de vez en cuando.",
        "Rectificar de sal y dejar reposar antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "zanahoria",
          "puerro",
          "calabaza",
          "pimiento"
        ],
        "fijos": {
          "proteina": [
            "lentejas"
          ],
          "hidrato": [
            "lentejas"
          ]
        }
      }
    },
    {
      "id": "garbanzos-guiso",
      "nombre": "Garbanzos guisados con verduras",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír ajo, cebolla y un poco de pimentón dulce en la olla.",
        "Añadir {verdura} troceada y rehogar unos minutos.",
        "Incorporar los garbanzos cocidos y cubrir con caldo.",
        "Cocer 15-20 minutos a fuego suave para que se integren los sabores.",
        "Servir bien caliente."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "zanahoria",
          "acelgas",
          "calabaza"
        ],
        "fijos": {
          "proteina": [
            "garbanzos"
          ],
          "hidrato": [
            "garbanzos"
          ]
        }
      }
    },
    {
      "id": "cocido-simplificado",
      "nombre": "Cocido simplificado de garbanzos con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 90,
      "esfuerzo": "elaborado",
      "temporada": "invierno",
      "region": "madrid",
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Poner en la olla {proteina}, hueso de rodilla o similar (opcional) y cubrir con agua fría.",
        "Llevar a hervor, espumar y añadir {verdura} en trozos grandes.",
        "Cocer a fuego lento 1 hora aproximadamente.",
        "Añadir los garbanzos (previamente en remojo o de bote) y cocer 20 minutos más.",
        "Servir el caldo aparte como sopa y el resto como plato único."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "ternera"
        ],
        "fijos": {
          "hidrato": [
            "garbanzos"
          ],
          "verdura": [
            "zanahoria",
            "puerro"
          ]
        }
      }
    },
    {
      "id": "alubias-guiso",
      "nombre": "Alubias blancas guisadas con verduras",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír ajo y cebolla en una cazuela con aceite de oliva.",
        "Añadir {verdura} troceada y rehogar 5 minutos.",
        "Incorporar las alubias cocidas y un poco de caldo o agua.",
        "Cocer 15 minutos a fuego suave, moviendo la cazuela (no remover con cuchara) para que ligue.",
        "Dejar reposar unos minutos antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "zanahoria",
          "puerro",
          "calabaza"
        ],
        "fijos": {
          "proteina": [
            "alubias-blancas"
          ],
          "hidrato": [
            "alubias-blancas"
          ]
        }
      }
    },
    {
      "id": "paella-sencilla",
      "nombre": "Paella sencilla de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 60,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "comunidad-valenciana",
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír {proteina} en la paellera con aceite de oliva hasta dorar.",
        "Añadir {verdura} y un sofrito de tomate y ajo, rehogar bien.",
        "Incorporar el arroz y nacarar 2 minutos.",
        "Añadir el caldo caliente con azafrán o colorante y cocer 18-20 minutos sin remover.",
        "Dejar reposar 5 minutos tapada con un paño antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "gambas",
          "conejo"
        ],
        "fijos": {
          "hidrato": [
            "arroz"
          ],
          "verdura": [
            "judias-verdes",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "arroz-horno",
      "nombre": "Arroz al horno con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 55,
      "esfuerzo": "elaborado",
      "temporada": "invierno",
      "region": "comunidad-valenciana",
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Dorar {proteina} en una cazuela apta para horno con aceite de oliva.",
        "Añadir {verdura} y un sofrito de tomate y ajo, rehogar.",
        "Incorporar el arroz, mezclar bien y cubrir con caldo caliente.",
        "Hornear a 200°C durante 20-25 minutos hasta que el arroz esté hecho y dorado por arriba.",
        "Dejar reposar 5 minutos antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "cerdo"
        ],
        "fijos": {
          "hidrato": [
            "arroz"
          ],
          "verdura": [
            "tomate",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "arroz-caldoso",
      "nombre": "Arroz caldoso de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 50,
      "esfuerzo": "elaborado",
      "temporada": "invierno",
      "region": null,
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír {proteina} y {verdura} en una olla con aceite de oliva.",
        "Añadir un sofrito de tomate y ajo y rehogar 2 minutos.",
        "Incorporar el arroz y cubrir generosamente con caldo caliente.",
        "Cocer 18-20 minutos a fuego medio removiendo de vez en cuando, debe quedar caldoso.",
        "Servir inmediatamente en plato hondo."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "gambas",
          "merluza"
        ],
        "fijos": {
          "hidrato": [
            "arroz"
          ],
          "verdura": [
            "judias-verdes",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "arroz-verduras",
      "nombre": "Arroz con verduras y {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer el arroz en abundante agua con sal y escurrir.",
        "Saltear {verdura} en una sartén amplia con un poco de aceite.",
        "Añadir {proteina} y cocinar hasta que esté hecho.",
        "Incorporar el arroz cocido y saltear todo junto 2-3 minutos.",
        "Rectificar de sal y servir caliente."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "gambas",
          "tofu",
          "huevo"
        ],
        "fijos": {
          "hidrato": [
            "arroz"
          ],
          "verdura": [
            "pimiento",
            "guisantes",
            "zanahoria",
            "calabacin"
          ]
        }
      }
    },
    {
      "id": "arroz-cubana",
      "nombre": "Arroz a la cubana con huevo y tomate",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer el arroz blanco en agua con sal y escurrir bien.",
        "Preparar una salsa de {verdura} frito o triturado, calentar.",
        "Freír {proteina} con la yema jugosa.",
        "Emplatar el arroz en molde, la salsa de tomate al lado y el huevo por encima."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "arroz"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "pasta-bolonesa",
      "nombre": "Boloñesa de ternera y cerdo",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Pasta",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Picar la zanahoria, el calabacín y la cebolla muy finos y sofreír con ajo.",
        "Añadir la carne picada mixta de ternera y cerdo y dorar bien deshaciendo los grumos.",
        "Incorporar el tomate triturado y cocer a fuego lento 15-20 minutos."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "carne-picada-mixta"
          ],
          "verdura": [
            "zanahoria",
            "tomate",
            "calabacin"
          ]
        }
      }
    },
    {
      "id": "pasta-verduras-salteadas",
      "nombre": "Pasta con {proteina} y verduras salteadas",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pasta",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer {hidrato} al dente y reservar con un poco de su agua.",
        "Saltear {verdura} en una sartén amplia con aceite de oliva.",
        "Añadir {proteina} y cocinar hasta que esté hecho.",
        "Incorporar {hidrato} escurrida y saltear todo junto 2 minutos.",
        "Añadir un chorrito de aceite en crudo y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "gambas",
          "tofu",
          "huevo"
        ],
        "fijos": {
          "hidrato": [
            "pasta"
          ],
          "verdura": [
            "brocoli",
            "calabacin",
            "champinones",
            "pimiento",
            "espinacas"
          ]
        }
      }
    },
    {
      "id": "pasta-atun",
      "nombre": "Pasta con atún y tomate",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pasta",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer la pasta al dente en agua con sal.",
        "Calentar el tomate con un poco de ajo y aceite de oliva.",
        "Añadir el atún desmenuzado y calentar 2-3 minutos.",
        "Mezclar con la pasta escurrida y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "atun"
          ],
          "hidrato": [
            "pasta"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "lasana-verduras",
      "nombre": "Lasaña de {proteina} con verduras",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 65,
      "esfuerzo": "elaborado",
      "temporada": "invierno",
      "region": null,
      "tematica": "Pasta",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Sofreír {verdura} picada con ajo y cebolla.",
        "Añadir {proteina} y dorar bien; incorporar tomate triturado y cocer 15 minutos.",
        "Hidratar o precocer {hidrato} según el fabricante.",
        "Montar capas alternando {hidrato}, el relleno y bechamel en una fuente.",
        "Cubrir con queso rallado y hornear a 200°C 20-25 minutos hasta gratinar."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "ternera-picada",
          "pavo"
        ],
        "fijos": {
          "hidrato": [
            "placas-lasana"
          ],
          "verdura": [
            "calabacin",
            "espinacas",
            "zanahoria"
          ]
        }
      }
    },
    {
      "id": "pollo-asado-horno",
      "nombre": "{proteina} asado al horno",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 70,
      "esfuerzo": "elaborado",
      "temporada": "invierno",
      "region": null,
      "tematica": "A la plancha o al horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Precalentar el horno a 190°C.",
        "Salpimentar {proteina} y colocar en la bandeja con {hidrato} y {verdura} cortados en trozos grandes.",
        "Regar con aceite de oliva y un chorrito de vino blanco o limón.",
        "Hornear 50-55 minutos, dando la vuelta a media cocción, hasta dorar.",
        "Dejar reposar 10 minutos antes de trinchar y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "conejo"
        ],
        "fijos": null
      }
    },
    {
      "id": "pescado-horno-limon",
      "nombre": "{proteina} al horno con limón",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} en láminas finas y colocar de base en la bandeja con aceite.",
        "Añadir {verdura} y hornear 10 minutos antes de poner el pescado.",
        "Colocar {proteina} encima, salpimentar, rociar con limón y aceite.",
        "Hornear 15-18 minutos más hasta que el pescado esté hecho."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "merluza",
          "lubina",
          "salmon",
          "bacalao"
        ],
        "fijos": null
      }
    },
    {
      "id": "verduras-horno-huevo",
      "nombre": "Verduras al horno con huevo",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "cena",
        "comida"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": "verano",
      "region": null,
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} y {verdura} en rodajas y colocar en la bandeja con aceite y sal.",
        "Hornear 25-30 minutos hasta que estén tiernas.",
        "Hacer un hueco y cascar {proteina} encima, u hornear los huevos aparte al gusto.",
        "Hornear 5-8 minutos más hasta cuajar la clara y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "patata",
          "boniato"
        ],
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "verdura": [
            "berenjena",
            "calabacin",
            "pimiento",
            "tomate"
          ]
        }
      }
    },
    {
      "id": "tortilla-patata",
      "nombre": "Tortilla de patata",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Pelar y cortar {hidrato} en láminas finas.",
        "Confitar {hidrato} en abundante aceite a fuego suave hasta que estén tiernas.",
        "Escurrir bien y mezclar con {proteina} batido y sal.",
        "Cuajar en sartén antiadherente por ambos lados al punto deseado.",
        "Dejar reposar unos minutos antes de cortar."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "tortilla-francesa-verdura",
      "nombre": "Tortilla francesa con {verdura}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Saltear {verdura} en una sartén con un poco de aceite hasta que esté tierna.",
        "Batir {proteina} con una pizca de sal.",
        "Añadir {verdura} salteada al huevo batido y mezclar.",
        "Cuajar en la sartén por ambos lados y servir caliente."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "calabacin",
          "espinacas",
          "champinones",
          "pimiento"
        ],
        "fijos": {
          "proteina": [
            "huevo"
          ]
        }
      }
    },
    {
      "id": "revuelto-champinones",
      "nombre": "Revuelto de huevo con {verdura}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Saltear {verdura} con ajo en una sartén con aceite de oliva.",
        "Batir {proteina} ligeramente y añadir a la sartén.",
        "Remover a fuego suave hasta que cuaje cremoso, sin dejar secar.",
        "Servir enseguida con pan si se desea."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "champinones",
          "espinacas",
          "calabacin"
        ],
        "fijos": {
          "proteina": [
            "huevo"
          ]
        }
      }
    },
    {
      "id": "crema-calabacin",
      "nombre": "Crema de calabacín",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Sofreír cebolla y puerro en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 15-18 minutos hasta que todo esté tierno.",
        "Triturar hasta obtener una crema fina y rectificar de sal.",
        "Servir con {proteina} picado o rallado por encima."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "queso-fresco"
        ],
        "fijos": {
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "calabacin"
          ]
        }
      }
    },
    {
      "id": "crema-zanahoria",
      "nombre": "Crema de zanahoria",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 18-20 minutos hasta que estén muy tiernas.",
        "Triturar hasta obtener una crema fina.",
        "Servir con {proteina} como topping."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "queso-fresco"
        ],
        "fijos": {
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "zanahoria"
          ]
        }
      }
    },
    {
      "id": "crema-verduras-variadas",
      "nombre": "Crema de {verdura}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 20 minutos hasta que estén muy tiernas.",
        "Triturar hasta obtener una crema homogénea, ajustando de líquido si hace falta.",
        "Servir con {proteina} por encima."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "calabaza",
          "puerro",
          "brocoli",
          "zanahoria"
        ],
        "fijos": {
          "proteina": [
            "huevo",
            "queso-fresco"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "crema-calabaza-boniato",
      "nombre": "Crema de calabaza y boniato",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 20 minutos hasta que estén tiernos.",
        "Triturar hasta obtener una crema fina y rectificar de sal.",
        "Servir con {proteina} picado por encima si se desea."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "boniato"
          ],
          "verdura": [
            "calabaza"
          ]
        }
      }
    },
    {
      "id": "ensalada-completa",
      "nombre": "Ensalada completa de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer {hidrato} y dejar enfriar.",
        "Lavar y cortar {verdura} en trozos pequeños.",
        "Preparar {proteina} (cocer, cocinar a la plancha o escurrir según el caso).",
        "Mezclar todo en una fuente grande y aliñar con aceite, vinagre y sal.",
        "Servir templado o frío."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun-conserva",
          "huevo",
          "pollo",
          "queso-feta",
          "garbanzos"
        ],
        "fijos": null
      }
    },
    {
      "id": "ensalada-pasta",
      "nombre": "Ensalada de pasta con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-pasta.jpg",
      "pasos": [
        "Cocer {hidrato} al dente, escurrir y enfriar bajo el grifo.",
        "Cortar {verdura} en trozos pequeños.",
        "Preparar {proteina} y añadir a la pasta.",
        "Mezclar todo con {verdura} y aliñar con aceite de oliva y sal.",
        "Dejar reposar en la nevera 10 minutos antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun-conserva",
          "pollo",
          "queso-feta",
          "huevo"
        ],
        "fijos": {
          "hidrato": [
            "pasta"
          ]
        }
      }
    },
    {
      "id": "ensalada-garbanzos",
      "nombre": "Ensalada de garbanzos con {verdura}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Escurrir y enjuagar los garbanzos cocidos.",
        "Cortar {verdura} en dados pequeños.",
        "Mezclar los garbanzos con {verdura} en una fuente.",
        "Aliñar con aceite de oliva, vinagre y sal.",
        "Dejar reposar 10 minutos para que se integren los sabores."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "tomate",
          "pimiento",
          "pepino"
        ],
        "fijos": {
          "proteina": [
            "garbanzos"
          ],
          "hidrato": [
            "garbanzos"
          ]
        }
      }
    },
    {
      "id": "ensalada-lentejas",
      "nombre": "Ensalada de lentejas con {verdura}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Escurrir las lentejas cocidas.",
        "Cortar {verdura} en dados pequeños.",
        "Mezclar las lentejas con {verdura}.",
        "Aliñar con aceite de oliva, vinagre y sal.",
        "Servir a temperatura ambiente o fría."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "tomate",
          "pimiento",
          "zanahoria"
        ],
        "fijos": {
          "proteina": [
            "lentejas"
          ],
          "hidrato": [
            "lentejas"
          ]
        }
      }
    },
    {
      "id": "ensalada-cesar-casera",
      "nombre": "Ensalada César casera con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Cortar {hidrato} en dados y tostar en la sartén o el horno para hacer picatostes.",
        "Cocinar {proteina} a la plancha y cortar en tiras o dados.",
        "Lavar y trocear {verdura}.",
        "Mezclar {verdura}, {proteina} y los picatostes.",
        "Aliñar con una salsa ligera de yogur o mostaza y aceite, y queso rallado por encima."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "huevo"
        ],
        "fijos": null
      }
    },
    {
      "id": "quinoa-ensalada",
      "nombre": "Ensalada de quinoa con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Lavar la quinoa bajo el grifo con un colador fino unos segundos.",
        "Hervir el doble de agua que de quinoa, con una pizca de sal, y cocer 12-15 minutos hasta que absorba el agua; dejar reposar 5 minutos y soltar los granos con un tenedor.",
        "Preparar {proteina}.",
        "Mezclar todo en una fuente con la quinoa templada y aliñar con aceite de oliva, zumo de limón y sal.",
        "Servir fría o templada."
      ],
      "pasosPorOpcion": {
        "huevo": [
          "Cocer los huevos en un cazo con agua fría; cuando rompa a hervir, contar 10 minutos.",
          "Enfriarlos bajo el grifo, pelarlos y trocearlos o desmenuzarlos con un tenedor."
        ],
        "atun-conserva": [
          "Escurrir el atún en conserva y desmigarlo con un tenedor."
        ],
        "pollo": [
          "Salpimentar la pechuga de pollo y hacerla a la plancha 4-5 minutos por cada lado.",
          "Dejar templar y cortar en dados o tiras."
        ],
        "garbanzos": [
          "Escurrir y aclarar los garbanzos cocidos bajo el grifo."
        ]
      },
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun-conserva",
          "pollo",
          "huevo",
          "garbanzos"
        ],
        "fijos": {
          "hidrato": [
            "quinoa"
          ]
        }
      }
    },
    {
      "id": "merluza-salsa-verde",
      "nombre": "{proteina} en salsa verde",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "euskadi",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír ajo picado en una cazuela con aceite de oliva.",
        "Añadir un poco de harina, rehogar y mojar con caldo y perejil picado.",
        "Incorporar {hidrato} cortada en trozos y cocer 10 minutos.",
        "Añadir {proteina} y {verdura}, cocinar 8-10 minutos moviendo la cazuela suavemente.",
        "Servir bien caliente con la salsa verde."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "merluza",
          "bacalao"
        ],
        "fijos": {
          "verdura": [
            "guisantes",
            "judias-verdes"
          ]
        }
      }
    },
    {
      "id": "salmon-salsa",
      "nombre": "Salmón en salsa",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cocer o saltear {hidrato}.",
        "Saltear {verdura} en una sartén con un poco de aceite.",
        "Marcar el salmón a la plancha por ambos lados.",
        "Preparar una salsa ligera con un poco de nata o caldo y hierbas.",
        "Servir el salmón napado con la salsa junto a {hidrato} y {verdura}."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "salmon"
        ],
        "fijos": null
      }
    },
    {
      "id": "bacalao-tomate",
      "nombre": "{proteina} con tomate",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír ajo y {verdura} en una sartén con aceite de oliva.",
        "Añadir tomate triturado y cocer 15 minutos a fuego suave.",
        "Cocer {hidrato} aparte y reservar.",
        "Añadir {proteina} a la salsa y cocinar 6-8 minutos hasta que esté hecho.",
        "Servir con {hidrato} de acompañamiento."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "bacalao",
          "merluza"
        ],
        "fijos": {
          "verdura": [
            "pimiento",
            "tomate"
          ]
        }
      }
    },
    {
      "id": "marmitako-atun",
      "nombre": "Marmitako de atún y patata",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": "verano",
      "region": "euskadi",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír ajo, cebolla y {verdura} en una olla con aceite de oliva.",
        "Añadir {hidrato} cascada en trozos irregulares (para que suelte almidón) y rehogar.",
        "Cubrir con caldo o fumet y cocer 20 minutos hasta que la patata esté tierna.",
        "Añadir {proteina} en dados y cocinar 4-5 minutos, apagando el fuego para que se haga con el calor residual.",
        "Dejar reposar unos minutos antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "pimiento",
          "tomate"
        ],
        "fijos": {
          "proteina": [
            "atun"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "pescaditos-plancha",
      "nombre": "{proteina} a la plancha",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": false,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Limpiar {proteina} si no vienen ya limpios.",
        "Cocer o asar {hidrato}.",
        "Preparar {verdura} en crudo tipo ensalada sencilla.",
        "Hacer {proteina} a la plancha con un poco de aceite y sal, vuelta y vuelta.",
        "Servir con {hidrato} y {verdura} de acompañamiento."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "sardinas",
          "boquerones"
        ],
        "fijos": null
      }
    },
    {
      "id": "gallo-plancha",
      "nombre": "Filetes de gallo a la plancha",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer o saltear {hidrato}.",
        "Cocer al vapor o saltear {verdura}.",
        "Salpimentar los filetes de gallo.",
        "Hacer a la plancha 1-2 minutos por lado, son filetes finos y se hacen rápido.",
        "Servir enseguida con {hidrato} y {verdura}."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "gallo"
        ],
        "fijos": null
      }
    },
    {
      "id": "gambas-ajillo",
      "nombre": "Gambas al ajillo",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Preparar {hidrato} como acompañamiento.",
        "Calentar aceite de oliva con ajo laminado en una cazuela de barro o sartén.",
        "Añadir las gambas cuando el ajo empiece a dorarse.",
        "Saltear 2-3 minutos hasta que las gambas cambien de color, sin pasarse de fuego.",
        "Servir muy caliente con {hidrato}."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "gambas"
          ]
        }
      }
    },
    {
      "id": "mejillones-marinera",
      "nombre": "Mejillones a la marinera",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": false,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Limpiar bien los mejillones, retirando barbas e impurezas.",
        "Sofreír ajo y cebolla, añadir {verdura} triturado y cocer 10 minutos.",
        "Añadir un chorrito de vino blanco y dejar reducir.",
        "Incorporar los mejillones y tapar hasta que se abran, unos 5-6 minutos.",
        "Servir con {hidrato} para mojar en la salsa."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "mejillones"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "empanadillas-caseras",
      "nombre": "Empanadillas caseras de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Preparar el relleno de {proteina} con tomate frito y un sofrito de cebolla.",
        "Extender los discos de {hidrato} sobre una superficie limpia.",
        "Rellenar cada disco con una cucharada del relleno y cerrar sellando los bordes con un tenedor.",
        "Pintar con huevo batido si se van a hornear.",
        "Hornear a 200°C 15-18 minutos hasta dorar, u freír en aceite caliente."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun",
          "pollo",
          "ternera-picada",
          "espinacas-queso"
        ],
        "fijos": {
          "hidrato": [
            "masa-empanadilla"
          ]
        }
      }
    },
    {
      "id": "wrap-casero",
      "nombre": "Wrap casero de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Preparar {proteina} (a la plancha, cocido o directamente si es hummus).",
        "Cortar {verdura} en tiras finas.",
        "Calentar ligeramente {hidrato} para que sea más flexible.",
        "Rellenar con {proteina} y {verdura}.",
        "Enrollar apretando bien y cortar por la mitad para servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "atun",
          "huevo",
          "hummus"
        ],
        "fijos": {
          "hidrato": [
            "tortilla-trigo"
          ],
          "verdura": [
            "lechuga",
            "tomate",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "hummus-plato",
      "nombre": "Plato de hummus",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 10,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cortar {verdura} en bastones para mojar.",
        "Calentar ligeramente {hidrato} si se desea.",
        "Servir el hummus en un plato con un chorrito de aceite de oliva por encima.",
        "Acompañar con {hidrato} y {verdura} en bastones."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "hummus"
          ]
        }
      }
    },
    {
      "id": "tofu-plancha-verduras",
      "nombre": "Tofu a la plancha",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "A la plancha o al horno",
      "ocasion": null,
      "ninos": false,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Escurrir bien el tofu y cortar en dados o filetes.",
        "Cocer {hidrato} según el envase.",
        "Saltear {verdura} en una sartén con un poco de aceite.",
        "Marcar el tofu a la plancha hasta que quede dorado por fuera.",
        "Servir todo junto con un chorrito de salsa de soja."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "tofu"
        ],
        "fijos": null
      }
    },
    {
      "id": "salteado-wok",
      "nombre": "Salteado de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer {hidrato} y reservar.",
        "Cortar {verdura} en tiras o dados pequeños para que se hagan rápido.",
        "Saltear {proteina} a fuego fuerte en wok o sartén amplia con un poco de aceite.",
        "Añadir {verdura} y saltear 3-4 minutos sin dejar que se ablanden del todo.",
        "Incorporar {hidrato}, un chorrito de salsa de soja y saltear todo junto 1-2 minutos."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "gambas",
          "tofu",
          "ternera",
          "edamame"
        ],
        "fijos": {
          "hidrato": [
            "arroz",
            "fideos"
          ],
          "verdura": [
            "pimiento",
            "calabacin",
            "brocoli",
            "zanahoria",
            "champinones"
          ]
        }
      }
    },
    {
      "id": "hamburguesa-casera",
      "nombre": "Hamburguesa casera de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Mezclar {proteina} con sal, pimienta y un poco de ajo picado, formar hamburguesas.",
        "Tostar ligeramente {hidrato} por dentro en la sartén o plancha.",
        "Hacer las hamburguesas a la plancha 3-4 minutos por lado.",
        "Lavar y cortar {verdura}.",
        "Montar la hamburguesa con {hidrato}, {verdura} y la carne."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "ternera-picada",
          "pavo"
        ],
        "fijos": {
          "verdura": [
            "lechuga",
            "tomate"
          ]
        }
      }
    },
    {
      "id": "pizza-casera",
      "nombre": "Pizza de atún",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Precalentar el horno a la temperatura máxima con la bandeja dentro.",
        "Estirar la masa de pizza sobre papel de horno.",
        "Cubrir con salsa de tomate, el atún en conserva escurrido y el tomate troceado.",
        "Añadir queso rallado por encima.",
        "Hornear 10-12 minutos hasta que el borde esté dorado y el queso fundido."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "atun-conserva"
          ],
          "hidrato": [
            "masa-pizza"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "sopa-fideos",
      "nombre": "Sopa de fideos con verduras",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "invierno",
      "region": null,
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Poner a hervir un buen caldo de verduras o pollo.",
        "Añadir {verdura} cortada muy fina y cocer 10 minutos.",
        "Incorporar {hidrato} y cocer 5-6 minutos más.",
        "Añadir {proteina} batido en forma de hilos removiendo el caldo (huevo hilado), opcional.",
        "Servir bien caliente."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "zanahoria",
          "puerro",
          "judias-verdes"
        ],
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "fideos"
          ]
        }
      }
    },
    {
      "id": "menestra-verduras",
      "nombre": "Menestra de verduras con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": false,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer o blanquear cada {verdura} por separado hasta que estén tiernas.",
        "Sofreír ajo en una sartén con aceite de oliva.",
        "Añadir {verdura} cocida y rehogar 5 minutos para que coja sabor.",
        "Preparar {proteina} (huevo duro cortado o pollo a la plancha) como acompañamiento.",
        "Servir la menestra con {proteina} por encima o al lado."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "pollo"
        ],
        "fijos": {
          "verdura": [
            "judias-verdes",
            "zanahoria",
            "guisantes",
            "alcachofa",
            "coliflor"
          ]
        }
      }
    },
    {
      "id": "garbanzos-espinacas",
      "nombre": "Garbanzos con espinacas y {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Sofreír ajo en una sartén con aceite de oliva hasta dorar.",
        "Añadir {verdura} y rehogar hasta que reduzca.",
        "Incorporar los garbanzos cocidos y un poco de caldo, cocer 10 minutos.",
        "Añadir {proteina} (huevo escalfado o bacalao en trozos) y cocinar unos minutos más.",
        "Servir bien caliente."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "bacalao"
        ],
        "fijos": {
          "hidrato": [
            "garbanzos"
          ],
          "verdura": [
            "espinacas"
          ]
        }
      }
    },
    {
      "id": "albondigas-salsa",
      "nombre": "Albóndigas de {proteina} en salsa",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Mezclar {proteina} con pan remojado en leche, ajo y perejil picado; formar bolas.",
        "Enharinar ligeramente y dorar las albóndigas en una sartén con aceite.",
        "Preparar una salsa con {verdura} triturado, cebolla y un poco de caldo.",
        "Cocer las albóndigas en la salsa 15-20 minutos a fuego suave.",
        "Servir con {hidrato} de acompañamiento."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "ternera-picada",
          "pavo"
        ],
        "fijos": {
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "patatas-guisadas",
      "nombre": "Patatas guisadas con {proteina} y verduras",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Dorar {proteina} en una olla con aceite de oliva.",
        "Añadir {verdura} y rehogar unos minutos.",
        "Incorporar {hidrato} cascada en trozos irregulares.",
        "Cubrir con caldo y cocer a fuego medio 25-30 minutos hasta que todo esté tierno.",
        "Rectificar de sal y dejar reposar antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "ternera",
          "cerdo"
        ],
        "fijos": {
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "zanahoria",
            "guisantes",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "coliflor-gratinada",
      "nombre": "Coliflor gratinada con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": null,
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": false,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer {verdura} y {hidrato} en agua con sal hasta que estén tiernos.",
        "Escurrir bien y colocar en una fuente apta para horno.",
        "Preparar una bechamel ligera y cubrir las verduras.",
        "Añadir {proteina} rallado o picado por encima.",
        "Gratinar en el horno 8-10 minutos hasta dorar."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "queso-fresco"
        ],
        "fijos": {
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "coliflor"
          ]
        }
      }
    },
    {
      "id": "gazpacho-andaluz",
      "nombre": "Gazpacho andaluz con huevo picado",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": "andalucia",
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Remojar el pan en agua unos minutos.",
        "Triturar el tomate maduro con el pan, un diente de ajo, aceite de oliva y un chorrito de vinagre (si tienes medio pimiento o pepino, añádelos).",
        "Colar si se quiere más fino y enfriar en la nevera al menos 30 minutos.",
        "Cocer el huevo 10 minutos, picarlo y servirlo por encima."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "pan"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "salmorejo-cordobes",
      "nombre": "Salmorejo cordobés con huevo",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": "andalucia",
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Remojar pan abundante en agua.",
        "Triturar el tomate con el pan, un diente de ajo pequeño y aceite de oliva hasta que quede una crema espesa y lisa.",
        "Enfriar en la nevera al menos 30 minutos.",
        "Servir con huevo duro picado por encima (y virutas de jamón serrano si tienes)."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "pan"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "pisto-manchego",
      "nombre": "Pisto manchego con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": "verano",
      "region": "castilla",
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír cebolla y ajo picados en aceite de oliva.",
        "Añadir {verdura} en dados pequeños y rehogar 10 minutos.",
        "Incorporar tomate triturado y cocinar 15 minutos a fuego medio hasta que pierda el agua.",
        "Rematar con {proteina} (huevo frito o escalfado encima, o atún integrado).",
        "Servir con pan."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "atun"
        ],
        "fijos": {
          "hidrato": [
            "pan"
          ],
          "verdura": [
            "calabacin",
            "berenjena",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "croquetas-caseras",
      "nombre": "Croquetas caseras de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": "rebozado",
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Hacer una bechamel espesa: mantequilla, harina y leche, removiendo 8-10 minutos.",
        "Picar muy fino {proteina} e integrarlo en la bechamel; salpimentar.",
        "Enfriar la masa en la nevera (mínimo 2 horas, mejor de víspera).",
        "Formar las croquetas y pasarlas por huevo y pan rallado.",
        "Freír en aceite caliente hasta dorar (o al horno/airfryer con un hilo de aceite)."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "jamon-serrano",
          "pollo",
          "champinones"
        ],
        "fijos": {
          "hidrato": [
            "bechamel"
          ]
        }
      }
    },
    {
      "id": "fideua",
      "nombre": "Fideuà de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "comunidad-valenciana",
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír {proteina} en la paellera o sartén amplia y reservar.",
        "En el mismo aceite, hacer un sofrito con ajo y {verdura}.",
        "Tostar los fideos 2 minutos en el sofrito.",
        "Cubrir con caldo caliente y cocer 8-10 minutos sin remover.",
        "Devolver {proteina}, apagar y reposar 3 minutos."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "gambas",
          "gallo"
        ],
        "fijos": {
          "hidrato": [
            "fideos"
          ],
          "verdura": [
            "tomate",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "pollo-al-chilindron",
      "nombre": "Pollo al chilindrón",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "aragon",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Dorar el pollo troceado y salpimentado; reservar.",
        "En el mismo aceite, sofreír cebolla, ajo y {verdura} en tiras.",
        "Devolver el pollo, mojar con medio vaso de agua (o vino blanco) y guisar tapado 20-25 minutos.",
        "Servir con {hidrato}."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "pimiento",
          "tomate"
        ],
        "fijos": {
          "proteina": [
            "pollo"
          ]
        }
      }
    },
    {
      "id": "pochas-con-chorizo",
      "nombre": "Pochas guisadas con chorizo",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "navarra-rioja",
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír cebolla, ajo y {verdura} picadas en la cazuela.",
        "Añadir el chorizo en rodajas y dar unas vueltas.",
        "Incorporar las pochas (o alubias cocidas) y cubrir justo de agua.",
        "Cocer suave 15-20 minutos moviendo la cazuela, sin remover con cuchara.",
        "Reposar unos minutos antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "pimiento",
          "zanahoria"
        ],
        "fijos": {
          "proteina": [
            "chorizo"
          ],
          "hidrato": [
            "alubias-blancas"
          ]
        }
      }
    },
    {
      "id": "fabada-asturiana",
      "nombre": "Fabada asturiana",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 90,
      "esfuerzo": "elaborado",
      "temporada": "invierno",
      "region": "asturias",
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Si las fabes son secas, remojo de la víspera (con bote, saltar este paso).",
        "Poner las fabes cubiertas de agua fría con el compango entero.",
        "Llevar a hervor, espumar y cocer a fuego muy suave 1h30 (bote: 40 minutos), moviendo la olla de vez en cuando, sin remover.",
        "\"Asustar\" con un chorrito de agua fría un par de veces durante la cocción.",
        "Reposar 10 minutos, trocear el compango y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "compango"
          ],
          "hidrato": [
            "alubias-blancas"
          ]
        }
      }
    },
    {
      "id": "cachopo",
      "nombre": "Cachopo de ternera con jamón y queso",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": "empanado",
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 50,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "asturias",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Salpimentar dos filetes finos de ternera por cachopo.",
        "Montar jamón y queso entre los dos filetes y sellar bien los bordes.",
        "Empanar: harina, huevo batido y pan rallado.",
        "Freír en aceite caliente 3-4 minutos por cara hasta dorar; escurrir sobre papel.",
        "Acompañar con {hidrato} y {verdura}."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "ternera-rellena"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "empanada-gallega",
      "nombre": "Empanada gallega de atún",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "galicia",
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Hacer un sofrito lento de cebolla abundante y {verdura}.",
        "Mezclar el sofrito con el atún desmigado.",
        "Extender una lámina de masa, repartir el relleno y cubrir con la otra lámina, sellando los bordes.",
        "Pintar con huevo batido y pinchar el centro.",
        "Hornear 30-35 minutos a 180°C hasta dorar."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "pimiento",
          "tomate"
        ],
        "fijos": {
          "proteina": [
            "atun-conserva"
          ],
          "hidrato": [
            "masa-empanadilla"
          ]
        }
      }
    },
    {
      "id": "porrusalda-con-bacalao",
      "nombre": "Porrusalda con bacalao",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "invierno",
      "region": "euskadi",
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Rehogar el puerro en rodajas con un poco de aceite.",
        "Añadir la patata en trozos cascados (no cortados del todo, para que suelte fécula).",
        "Cubrir con agua o caldo y cocer 15 minutos.",
        "Añadir el bacalao desmigado, cocer 5 minutos más y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "bacalao"
          ],
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "puerro"
          ]
        }
      }
    },
    {
      "id": "piperrada-con-huevo",
      "nombre": "Piperrada con huevo",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": "euskadi",
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír cebolla y el pimiento en tiras a fuego medio hasta que estén muy tiernos.",
        "Añadir tomate rallado y reducir 10 minutos.",
        "Hacer los huevos encima (escalfados en la propia salsa o a la plancha).",
        "Servir con pan."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "verdura": [
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "zarangollo",
      "nombre": "Zarangollo murciano de calabacín",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": "murcia",
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Pochar cebolla picada en aceite de oliva.",
        "Añadir el calabacín en medias lunas finas y hacer a fuego medio hasta muy tierno.",
        "Batir los huevos, añadirlos y cuajar removiendo suave — queda cremoso, no tortilla.",
        "Salpimentar y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "verdura": [
            "calabacin"
          ]
        }
      }
    },
    {
      "id": "ensalada-murciana",
      "nombre": "Ensalada murciana de tomate y {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 15,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": "murcia",
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Escurrir y trocear el tomate (pelado en conserva, la versión clásica) en un bol.",
        "Añadir {proteina} y cebolla tierna picada.",
        "Aliñar con aceite de oliva y sal (un puñado de aceitunas negras si tienes).",
        "Servir fría con pan."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun-conserva",
          "huevo"
        ],
        "fijos": {
          "hidrato": [
            "pan"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "fricando-de-ternera",
      "nombre": "Fricandó de ternera con setas",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 80,
      "esfuerzo": "elaborado",
      "temporada": "invierno",
      "region": "cataluna",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Enharinar filetes finos de ternera y dorarlos; reservar.",
        "Hacer un sofrito lento de cebolla y tomate rallado.",
        "Devolver la carne con las setas y cubrir con caldo.",
        "Guisar tapado 45-60 minutos hasta que la carne esté melosa.",
        "Servir con {hidrato}."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "ternera"
          ],
          "verdura": [
            "champinones"
          ]
        }
      }
    },
    {
      "id": "tumbet-mallorquin",
      "nombre": "Tumbet mallorquín con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": "verano",
      "region": "baleares",
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Freír la patata en rodajas y colocarla de base en una fuente.",
        "Freír {verdura} en rodajas y montar capas encima.",
        "Cubrir con salsa de tomate.",
        "Hornear 10 minutos para asentar.",
        "Rematar con {proteina} (huevo frito o bacalao a la plancha)."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "bacalao"
        ],
        "fijos": {
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "berenjena",
            "calabacin"
          ]
        }
      }
    },
    {
      "id": "papas-arrugadas-con-mojo",
      "nombre": "Papas arrugadas con mojo rojo y {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "canarias",
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cocer papas pequeñas con piel en agua muy salada hasta que estén tiernas.",
        "Escurrir y secar al fuego un par de minutos hasta que la piel se arrugue.",
        "Mojo rojo: triturar el pimiento con ajo, pimentón, comino, vinagre y aceite.",
        "Hacer {proteina} (huevo duro o merluza a la plancha).",
        "Servir todo junto, con el mojo por encima de las papas."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "huevo",
          "merluza"
        ],
        "fijos": {
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "ropa-vieja-canaria",
      "nombre": "Ropa vieja canaria de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "canarias",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Dorar {proteina} en tiras o desmenuzada.",
        "Sofreír cebolla, ajo y {verdura}.",
        "Añadir los garbanzos cocidos y un toque de pimentón.",
        "Saltear todo junto 10 minutos (con patata frita en dados si quieres la versión completa).",
        "Rectificar de sal y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "cerdo"
        ],
        "fijos": {
          "hidrato": [
            "garbanzos"
          ],
          "verdura": [
            "pimiento",
            "tomate"
          ]
        }
      }
    },
    {
      "id": "atascaburras",
      "nombre": "Atascaburras de bacalao y patata",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": "castilla",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Cocer la patata y, los últimos 5 minutos, el bacalao desalado.",
        "Machacar la patata con ajo y el bacalao desmigado.",
        "Ligar con aceite de oliva a hilo fino hasta conseguir un puré meloso.",
        "Probar de sal y servir templado, con huevo duro en rodajas y nueces si tienes."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "bacalao"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "sopa-castellana",
      "nombre": "Sopa castellana de ajo con huevo",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "invierno",
      "region": "castilla",
      "tematica": "Cremas y sopas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Dorar láminas de ajo en aceite de oliva en una cazuela.",
        "Añadir pimentón, remover y echar el pan en láminas finas.",
        "Mojar con caldo o agua y hervir 10 minutos.",
        "Escalfar los huevos dentro 3-4 minutos y servir muy caliente."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "pan"
          ]
        }
      }
    },
    {
      "id": "migas-extremenas",
      "nombre": "Migas extremeñas con {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": "extremadura",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "La víspera, trocear el pan asentado y humedecerlo con agua y un paño.",
        "Freír {proteina} en trozos y reservar.",
        "En esa misma grasa, dorar ajos enteros y el pimiento en tiras.",
        "Añadir el pan y mover sin parar 15-20 minutos hasta que queden migas sueltas.",
        "Devolver {proteina}, mezclar y servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "panceta",
          "chorizo"
        ],
        "fijos": {
          "hidrato": [
            "pan"
          ],
          "verdura": [
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "bonito-encebollado",
      "nombre": "Bonito encebollado",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Pochar cebolla abundante en juliana a fuego suave 15 minutos.",
        "Añadir el pimiento en tiras y hacer 5 minutos más.",
        "Subir el fuego y añadir el bonito en tacos, vuelta y vuelta — que quede jugoso.",
        "Un chorrito de vinagre o vino blanco, mezclar y servir con {hidrato}."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "bonito"
          ],
          "verdura": [
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "salpicon-de-pollo",
      "nombre": "Salpicón de pollo con verduras",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer el pollo (o aprovechar restos de asado) y desmenuzarlo.",
        "Cocer la patata en dados hasta que esté tierna.",
        "Picar {verdura} fina.",
        "Mezclar todo con una vinagreta de aceite, vinagre y sal.",
        "Enfriar 15 minutos en la nevera y servir frío."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "tomate",
          "pimiento",
          "pepino"
        ],
        "fijos": {
          "proteina": [
            "pollo"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "olleta-alicantina",
      "nombre": "Olleta alicantina de legumbres y arroz",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": "invierno",
      "region": "comunidad-valenciana",
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír cebolla, ajo y una cucharadita de pimentón.",
        "Añadir {verdura} troceada y rehogar unos minutos.",
        "Incorporar las legumbres cocidas y cubrir con agua o caldo.",
        "Añadir un puñado de arroz y cocer 15-18 minutos.",
        "Reposar 5 minutos antes de servir."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "calabaza",
          "acelgas"
        ],
        "fijos": {
          "proteina": [
            "legumbres-variadas"
          ],
          "hidrato": [
            "arroz"
          ]
        }
      }
    },
    {
      "id": "soldaditos-de-pavia",
      "nombre": "Soldaditos de Pavía - Bacalao rebozado",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": "rebozado",
      "apta": [
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": "madrid",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cortar el bacalao desalado en tiras y secarlas bien.",
        "Rebozar en harina y huevo batido (o gabardina con un poco de levadura).",
        "Freír en aceite bien caliente hasta dorar.",
        "Escurrir sobre papel y servir con tiras de pimiento asado y pan."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "bacalao"
          ]
        }
      }
    },
    {
      "id": "merluza-a-la-sidra",
      "nombre": "{proteina} a la sidra",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "asturias",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Dorar la patata en rodajas finas y el puerro en una cazuela amplia.",
        "Colocar {proteina} encima y salpimentar.",
        "Regar con un buen vaso de sidra natural.",
        "Cocer tapado 8-10 minutos hasta que el pescado esté jugoso.",
        "Servir con el jugo de la cazuela."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "merluza",
          "gallo"
        ],
        "fijos": {
          "verdura": [
            "puerro"
          ]
        }
      }
    },
    {
      "id": "trucha-a-la-navarra",
      "nombre": "Trucha a la navarra con jamón",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": "navarra-rioja",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Limpiar las truchas abiertas y salpimentar.",
        "Rellenar cada una con un par de lonchas de jamón serrano.",
        "Enharinar ligero y freír 3-4 minutos por lado.",
        "Acompañar con {hidrato} cocida o panadera."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "trucha"
        ],
        "fijos": null
      }
    },
    {
      "id": "huevos-fritos-con-patatas",
      "nombre": "Huevos fritos con patatas",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cortar la patata en bastones o rodajas finas y salar.",
        "Freír la patata en aceite abundante a fuego medio hasta que esté tierna; subir el fuego al final para dorarla y escurrir sobre papel.",
        "En el mismo aceite bien caliente, freír los huevos de uno en uno regando la yema con la puntilla hecha.",
        "Servir los huevos sobre las patatas y romper la yema en la mesa."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "judias-verdes-con-patatas",
      "nombre": "Judías verdes con patatas",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Quitar las puntas y los hilos de las judías y trocearlas.",
        "Cocer las judías con la patata en dados en agua con sal, 15-18 minutos, hasta que ambas estén tiernas.",
        "Cocer el huevo aparte 10 minutos y pelarlo.",
        "Escurrir, aliñar en caliente con un buen chorro de aceite de oliva crudo y servir con el huevo en cuartos por encima."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "judias-verdes"
          ]
        }
      }
    },
    {
      "id": "cena-de-tabla",
      "nombre": "Tabla de {proteina} y queso con pan con tomate",
      "roles": [
        "principal"
      ],
      "origen": "migrado",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "cena"
      ],
      "tiempo_min": 10,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cortar el pan en rebanadas, mejor un poco tostadas.",
        "Frotar con tomate maduro, un hilo de aceite y una pizca de sal.",
        "Montar la tabla: {proteina} y el queso que os guste.",
        "A la mesa — cero fogones."
      ],
      "pasosPorOpcion": null,
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "jamon-serrano",
          "chorizo"
        ],
        "fijos": {
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "pizza-margarita",
      "nombre": "Pizza margarita",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Precalentar el horno a la temperatura máxima con la bandeja dentro.",
        "Estirar la masa de pizza sobre papel de horno.",
        "Cubrir con salsa de tomate y el tomate troceado.",
        "Repartir el queso feta y un poco de queso rallado por encima.",
        "Hornear 10-12 minutos hasta que el borde esté dorado y el queso fundido."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "queso-feta"
          ],
          "hidrato": [
            "masa-pizza"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "pizza-jamon-queso",
      "nombre": "Pizza de jamón york y queso",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Precalentar el horno a la temperatura máxima con la bandeja dentro.",
        "Estirar la masa de pizza sobre papel de horno.",
        "Cubrir con salsa de tomate y el jamón cocido en tiras.",
        "Añadir queso rallado por encima.",
        "Hornear 10-12 minutos hasta que el borde esté dorado y el queso fundido."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "jamon-cocido"
          ],
          "hidrato": [
            "masa-pizza"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "pizza-barbacoa",
      "nombre": "Pizza barbacoa",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Precalentar el horno a la temperatura máxima con la bandeja dentro.",
        "Estirar la masa de pizza sobre papel de horno.",
        "Cubrir con salsa barbacoa, el pollo troceado y el pimiento en tiras.",
        "Añadir queso rallado por encima.",
        "Hornear 10-12 minutos hasta que el borde esté dorado y el queso fundido."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "pollo"
          ],
          "hidrato": [
            "masa-pizza"
          ],
          "verdura": [
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "pizza-cuatro-quesos",
      "nombre": "Pizza cuatro quesos",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Precalentar el horno a la temperatura máxima con la bandeja dentro.",
        "Estirar la masa de pizza sobre papel de horno.",
        "Cubrir con salsa de tomate y láminas de queso curado.",
        "Añadir una mezcla de quesos rallados por encima.",
        "Hornear 10-12 minutos hasta que el borde esté dorado y los quesos fundidos."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "queso-curado"
          ],
          "hidrato": [
            "masa-pizza"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "pollo-pepitoria",
      "nombre": "Pollo en pepitoria",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 50,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar y dorar el pollo troceado en una cazuela con aceite; reservar.",
        "Sofreír cebolla y ajo en el mismo aceite hasta que estén tiernos.",
        "Machacar almendras tostadas, ajo, azafrán y perejil en un mortero.",
        "Devolver el pollo a la cazuela, añadir vino blanco y caldo, y cocer tapado 30 minutos.",
        "Incorporar el majado de almendras y azafrán, y cocer 10 minutos más hasta espesar."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo"
        ],
        "fijos": null
      }
    },
    {
      "id": "escabechado",
      "nombre": "{proteina} en escabeche",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Dorar {proteina} troceado en aceite de oliva; reservar.",
        "Sofreír cebolla, zanahoria y ajo laminado en el mismo aceite.",
        "Añadir vino blanco, vinagre, laurel y pimienta en grano; llevar a hervor.",
        "Devolver {proteina} a la cazuela, cubrir con caldo y cocer tapado 25 minutos.",
        "Dejar enfriar en su propio escabeche antes de servir (se sirve frío o templado)."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "conejo"
        ],
        "fijos": null
      }
    },
    {
      "id": "estofado-ternera",
      "nombre": "Estofado de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 90,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar y dorar {proteina} troceado en una cazuela con aceite; reservar.",
        "Sofreír cebolla, zanahoria y ajo en el mismo aceite hasta que estén tiernos.",
        "Añadir un chorro de vino tinto y dejar reducir.",
        "Devolver {proteina} a la cazuela, cubrir con caldo y cocer tapado a fuego lento 1 hora y media hasta que esté tierno."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "carrillera-ternera",
          "rabo-ternera",
          "ternera"
        ],
        "fijos": null
      }
    },
    {
      "id": "magro-tomate",
      "nombre": "Magro de cerdo con tomate",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar y dorar el cerdo troceado en una cazuela con aceite; reservar.",
        "Sofreír cebolla y ajo en el mismo aceite hasta que estén tiernos.",
        "Añadir tomate triturado y cocer a fuego lento 10 minutos.",
        "Devolver el cerdo a la cazuela y cocer 15 minutos más hasta que la salsa espese."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "cerdo"
        ],
        "fijos": null
      }
    },
    {
      "id": "costillas-salsa-barbacoa",
      "nombre": "Costillas en salsa barbacoa",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 60,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar las costillas y pincelarlas con salsa barbacoa.",
        "Colocar en una bandeja de horno cubierta con papel de aluminio.",
        "Hornear a 160°C durante 45 minutos tapadas.",
        "Destapar, pincelar con más salsa barbacoa y hornear 15 minutos más hasta que se doren."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "costillas-cerdo"
        ],
        "fijos": null
      }
    },
    {
      "id": "caldereta-cordero",
      "nombre": "Caldereta de cordero",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 90,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "extremadura",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar y dorar {proteina} troceado en una cazuela con aceite; reservar.",
        "Sofreír cebolla, ajo y pimiento en el mismo aceite hasta que estén tiernos.",
        "Añadir tomate triturado, vino blanco y una hoja de laurel; dejar reducir.",
        "Devolver {proteina} a la cazuela, cubrir con caldo y cocer tapado a fuego lento 1 hora y media."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "cordero-paletilla",
          "cordero-cuello"
        ],
        "fijos": null
      }
    },
    {
      "id": "cordero-asado",
      "nombre": "Cordero asado",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 90,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "castilla",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar {proteina} y colocarlo en una fuente de horno con manteca o aceite.",
        "Añadir un fondo de agua o caldo con ajo y hoja de laurel.",
        "Hornear a 180°C durante 1 hora, regando de vez en cuando con su jugo.",
        "Subir la temperatura a 200°C los últimos 15-20 minutos hasta que la piel quede dorada y crujiente."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "cordero-pierna",
          "cordero-paletilla"
        ],
        "fijos": null
      }
    },
    {
      "id": "solomillo-pedro-ximenez",
      "nombre": "Solomillo al Pedro Ximénez",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "andalucia",
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar y marcar {proteina} en una sartén con aceite bien caliente; reservar.",
        "Sofreír cebolla y ajo en la misma sartén hasta que estén tiernos.",
        "Añadir vino Pedro Ximénez y dejar reducir a fuego medio 5 minutos.",
        "Devolver {proteina} a la sartén y cocinar 5-8 minutos más hasta que la salsa espese y nape la carne."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "cerdo",
          "solomillo-ternera"
        ],
        "fijos": null
      }
    },
    {
      "id": "brochetas-carne",
      "nombre": "Brochetas de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "A la plancha o al horno",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/brochetas-carne.jpg",
      "pasos": [
        "Cortar {proteina} en dados y marinar 15 minutos con aceite, ajo y pimentón.",
        "Montar en brochetas alternando con trozos de pimiento y cebolla.",
        "Hacer a la plancha o parrilla, girando hasta que estén doradas por todos los lados."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "cerdo",
          "ternera"
        ],
        "fijos": null
      }
    },
    {
      "id": "pollo-salsa-champinones",
      "nombre": "Pollo en salsa de champiñones",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 35,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Carnes de cuchara y horno",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar y dorar el pollo en una cazuela con aceite; reservar.",
        "Sofreír cebolla y ajo en el mismo aceite hasta que estén tiernos.",
        "Añadir los champiñones laminados y saltear hasta que suelten su agua.",
        "Incorporar un chorro de nata líquida o caldo y devolver el pollo a la cazuela.",
        "Cocer 10-15 minutos a fuego lento hasta que la salsa espese."
      ],
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "pollo"
          ],
          "verdura": [
            "champinones"
          ]
        }
      }
    },
    {
      "id": "escalope-empanado",
      "nombre": "{proteina} empanado",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "frito",
      "acabado": "empanado",
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar el filete de {proteina} y aplanarlo un poco si es grueso.",
        "Pasar por harina, huevo batido y pan rallado.",
        "Freír en aceite bien caliente 2-3 minutos por cada lado hasta dorar.",
        "Escurrir sobre papel absorbente antes de servir."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "pavo",
          "cerdo"
        ],
        "fijos": null
      }
    },
    {
      "id": "san-jacobo",
      "nombre": "San Jacobo",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "frito",
      "acabado": "empanado",
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Colocar una loncha de jamón serrano y otra de queso curado entre dos filetes finos de cerdo.",
        "Sellar bien los bordes y pasar por harina, huevo batido y pan rallado.",
        "Freír en aceite bien caliente 3-4 minutos por cada lado hasta dorar.",
        "Escurrir sobre papel absorbente antes de servir."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "cerdo",
            "jamon-serrano",
            "queso-curado"
          ]
        }
      }
    },
    {
      "id": "flamenquin",
      "nombre": "Flamenquín",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "frito",
      "acabado": "empanado",
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": "andalucia",
      "tematica": "Comida rápida e informal",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Envolver una tira de jamón serrano dentro de un filete fino de cerdo, enrollando bien.",
        "Pasar por harina, huevo batido y pan rallado.",
        "Freír en aceite bien caliente 3-4 minutos, girando hasta dorar por todos los lados.",
        "Escurrir sobre papel absorbente y cortar en rodajas antes de servir."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "cerdo",
            "jamon-serrano"
          ]
        }
      }
    },
    {
      "id": "pescado-romana",
      "nombre": "{proteina} a la romana",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "frito",
      "acabado": "rebozado",
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Salpimentar los filetes de {proteina}.",
        "Pasar por harina y huevo batido (rebozado clásico a la romana).",
        "Freír en aceite bien caliente 2-3 minutos por cada lado hasta dorar.",
        "Escurrir sobre papel absorbente antes de servir."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "merluza",
          "gallo"
        ],
        "fijos": null
      }
    },
    {
      "id": "pescado-papillote",
      "nombre": "{proteina} en papillote",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "papillote",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Cortar el calabacín, la zanahoria y el puerro en juliana fina.",
        "Colocar {proteina} sobre un rectángulo de papel de horno con la verdura por encima.",
        "Añadir un chorrito de aceite de oliva, sal y un poco de vino blanco; cerrar el paquete bien sellado.",
        "Hornear a 200°C durante 15-18 minutos hasta que el pescado esté hecho al vapor en su propio jugo."
      ],
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "merluza",
          "dorada",
          "lubina"
        ],
        "fijos": {
          "verdura": [
            "calabacin",
            "zanahoria",
            "puerro"
          ]
        }
      }
    },
    {
      "id": "bacalao-pil-pil",
      "nombre": "Bacalao al pil pil",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 40,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "euskadi",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Confitar el bacalao a fuego muy suave en abundante aceite de oliva con ajo laminado, 8-10 minutos.",
        "Retirar el bacalao y reservar el aceite con los jugos de la piel.",
        "Ligar el aceite moviendo la cazuela en círculos (o batiendo) hasta que emulsione y espese en una salsa pil-pil.",
        "Devolver el bacalao a la cazuela y napar con la salsa antes de servir."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "bacalao"
        ],
        "fijos": null
      }
    },
    {
      "id": "bacalao-vizcaina",
      "nombre": "Bacalao a la vizcaína",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "euskadi",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír cebolla y ajo en aceite de oliva hasta que estén muy tiernos.",
        "Añadir el pimiento y el tomate troceados y cocer a fuego lento 20 minutos hasta formar una salsa.",
        "Triturar la salsa hasta que quede fina.",
        "Añadir el bacalao a la salsa y cocer 8-10 minutos a fuego suave hasta que esté hecho."
      ],
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "bacalao"
          ],
          "verdura": [
            "pimiento",
            "tomate"
          ]
        }
      }
    },
    {
      "id": "calamares-plancha",
      "nombre": "Calamares a la plancha",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Limpiar y cortar el calamar en anillas o tiras.",
        "Salpimentar y marcar a la plancha con un chorrito de aceite muy caliente, 2-3 minutos.",
        "Añadir un toque de ajo y perejil picado al final y servir enseguida."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "calamar"
        ],
        "fijos": null
      }
    },
    {
      "id": "calamares-romana",
      "nombre": "Calamares a la romana",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "frito",
      "acabado": "rebozado",
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 25,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Limpiar y cortar el calamar en anillas.",
        "Pasar por harina y huevo batido.",
        "Freír en aceite bien caliente hasta dorar, 2-3 minutos.",
        "Escurrir sobre papel absorbente y servir con un gajo de limón."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "calamar"
        ],
        "fijos": null
      }
    },
    {
      "id": "sepia-plancha",
      "nombre": "Sepia a la plancha",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Limpiar y cortar la sepia en trozos o tiras.",
        "Salpimentar y marcar a la plancha con un chorrito de aceite muy caliente, 3-4 minutos.",
        "Añadir un toque de ajo y perejil picado al final y servir enseguida."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "sepia"
        ],
        "fijos": null
      }
    },
    {
      "id": "chipirones-plancha",
      "nombre": "Chipirones a la plancha",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "plancha",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Limpiar los chipirones enteros.",
        "Salpimentar y marcar a la plancha con un chorrito de aceite muy caliente, 2-3 minutos por lado.",
        "Añadir un toque de ajo y perejil picado al final y servir enseguida."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "chipiron"
        ],
        "fijos": null
      }
    },
    {
      "id": "pulpo-a-feira",
      "nombre": "Pulpo á feira",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 45,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "galicia",
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Cocer el pulpo en agua abundante 35-40 minutos hasta que esté tierno.",
        "Cocer la patata con piel en agua con sal y cortarla en rodajas.",
        "Cortar el pulpo en rodajas con unas tijeras y disponerlo sobre las rodajas de patata.",
        "Aliñar con aceite de oliva, sal gruesa y pimentón dulce y picante."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "pulpo"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "almejas-marinera",
      "nombre": "Almejas a la marinera",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Pescado y marisco",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír ajo picado en aceite de oliva.",
        "Añadir un poco de harina, rehogar y mojar con vino blanco y perejil picado.",
        "Incorporar las almejas y tapar la cazuela.",
        "Cocinar 3-4 minutos, moviendo la cazuela, hasta que las almejas se abran."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "almejas"
        ],
        "fijos": null
      }
    },
    {
      "id": "huevos-al-plato",
      "nombre": "Huevos al plato",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 20,
      "esfuerzo": "rapido",
      "temporada": null,
      "region": null,
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Repartir salsa de tomate en cazuelitas individuales aptas para horno.",
        "Cascar un huevo sobre la salsa de tomate en cada cazuelita.",
        "Hornear a 200°C 8-10 minutos hasta que la clara esté cuajada y la yema aún líquida."
      ],
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "verdura": [
            "tomate"
          ]
        }
      }
    },
    {
      "id": "huevos-flamenca",
      "nombre": "Huevos a la flamenca",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 30,
      "esfuerzo": "medio",
      "temporada": null,
      "region": "andalucia",
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír pimiento en aceite de oliva y repartir en cazuelitas individuales con salsa de tomate.",
        "Añadir los guisantes por encima.",
        "Cascar un huevo sobre cada cazuelita.",
        "Hornear a 200°C 10-12 minutos hasta que la clara esté cuajada y las verduras tiernas."
      ],
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "verdura": [
            "guisantes",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "verduras-rellenas",
      "nombre": "{verdura} rellena",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 60,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Verduras y platos de verdura",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Cortar {verdura} por la mitad y vaciar la pulpa, reservando las pieles como base para rellenar.",
        "Sofreír cebolla y la pulpa reservada, picada, en aceite de oliva.",
        "Añadir la carne picada mixta y el arroz, y rehogar unos minutos con un poco de tomate triturado.",
        "Rellenar las pieles de {verdura} con la mezcla y colocarlas en una bandeja de horno.",
        "Hornear a 180°C durante 30-35 minutos hasta que la verdura esté tierna y el relleno dorado."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "berenjena",
          "calabacin",
          "pimiento"
        ],
        "fijos": {
          "proteina": [
            "carne-picada-mixta"
          ],
          "hidrato": [
            "arroz"
          ]
        }
      }
    },
    {
      "id": "canelones-carne",
      "nombre": "Canelones de carne",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 75,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "cataluna",
      "tematica": "Pasta",
      "ocasion": "sant-esteve",
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír cebolla y la carne picada mixta, dorando bien y deshaciendo los grumos.",
        "Añadir un chorro de vino blanco y dejar reducir; salpimentar.",
        "Cocer las placas de canelón según su tiempo y rellenarlas con la carne.",
        "Colocar los canelones en una fuente, cubrir con bechamel y queso rallado.",
        "Gratinar al horno 15 minutos hasta que la superficie esté dorada."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "carne-picada-mixta"
          ],
          "hidrato": [
            "placas-lasana"
          ]
        }
      }
    },
    {
      "id": "escudella",
      "nombre": "Escudella",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 120,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "cataluna",
      "tematica": "Potajes y guisos",
      "ocasion": "navidad",
      "ninos": true,
      "foto": null,
      "pasos": [
        "Poner a cocer el pollo y la ternera en una olla grande con agua abundante y sal.",
        "Añadir la zanahoria y el puerro y cocer a fuego lento 1 hora y media hasta que las carnes estén tiernas.",
        "Colar el caldo resultante y cocer la pasta (galets) en él aparte.",
        "Servir primero la sopa con la pasta y después las carnes y verduras como segundo plato."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "pollo",
            "ternera"
          ],
          "hidrato": [
            "pasta"
          ],
          "verdura": [
            "zanahoria",
            "puerro"
          ]
        }
      }
    },
    {
      "id": "potaje-vigilia",
      "nombre": "Potaje de vigilia",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 60,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Potajes y guisos",
      "ocasion": "semana-santa",
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír cebolla y ajo en aceite de oliva con un poco de pimentón.",
        "Añadir los garbanzos cocidos, el bacalao desmigado y las espinacas.",
        "Cubrir con caldo o agua y cocer a fuego lento 20-25 minutos hasta que espese.",
        "Rectificar de sal (el bacalao ya aporta salazón) y servir bien caliente."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "garbanzos",
            "bacalao"
          ],
          "hidrato": [
            "garbanzos"
          ],
          "verdura": [
            "espinacas"
          ]
        }
      }
    },
    {
      "id": "carbonara",
      "nombre": "Pasta carbonara",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 25,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Pasta",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Cocer la pasta al dente en agua con sal.",
        "Dorar la panceta en una sartén hasta que quede crujiente.",
        "Batir los huevos con queso rallado y pimienta negra molida.",
        "Fuera del fuego, mezclar la pasta escurrida con la panceta y el batido de huevo, removiendo rápido para que cree una crema sin cuajar."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "panceta",
            "huevo"
          ],
          "hidrato": [
            "pasta"
          ]
        }
      }
    },
    {
      "id": "arroz-negro",
      "nombre": "Arroz negro",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 45,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "comunidad-valenciana",
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír cebolla y ajo en aceite de oliva; añadir el calamar y la sepia troceados.",
        "Incorporar el arroz y rehogar 1-2 minutos.",
        "Disolver la tinta de calamar en el caldo caliente y añadirlo al arroz.",
        "Cocer 18-20 minutos sin remover hasta que el arroz absorba el caldo."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "calamar",
            "sepia"
          ],
          "hidrato": [
            "arroz"
          ]
        }
      }
    },
    {
      "id": "arroz-tres-delicias",
      "nombre": "Arroz tres delicias",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 25,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Cocer el arroz y dejarlo enfriar (mejor de un día para otro para que quede suelto).",
        "Hacer un revuelto con el huevo batido y trocearlo.",
        "Saltear en un wok o sartén amplia el jamón cocido en dados, las gambas y los guisantes.",
        "Añadir el arroz frío y el huevo troceado, y saltear todo junto 3-4 minutos con un chorrito de salsa de soja."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo",
            "jamon-cocido",
            "gambas"
          ],
          "hidrato": [
            "arroz"
          ],
          "verdura": [
            "guisantes"
          ]
        }
      }
    },
    {
      "id": "patatas-riojana",
      "nombre": "Patatas a la riojana",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 50,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "navarra-rioja",
      "tematica": "Potajes y guisos",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír cebolla y ajo en aceite de oliva.",
        "Añadir el chorizo troceado y rehogar unos minutos hasta que suelte su grasa.",
        "Incorporar la patata \"chascada\" (cascada con la punta del cuchillo) y cubrir con caldo.",
        "Cocer a fuego lento 30-35 minutos hasta que la patata esté tierna y el caldo haya espesado."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "chorizo"
          ],
          "hidrato": [
            "patata"
          ]
        }
      }
    },
    {
      "id": "fideos-cazuela",
      "nombre": "Fideos a la cazuela",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 45,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": "cataluna",
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Dorar las costillas troceadas en una cazuela con aceite de oliva; reservar.",
        "Sofreír cebolla, ajo y tomate triturado en el mismo aceite.",
        "Devolver las costillas a la cazuela, cubrir con caldo y cocer 20 minutos hasta que estén tiernas.",
        "Añadir los fideos y cocer 8-10 minutos más hasta que estén hechos y hayan absorbido el caldo."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "costillas-cerdo"
          ],
          "hidrato": [
            "fideos"
          ]
        }
      }
    },
    {
      "id": "risotto",
      "nombre": "Risotto de {proteina}",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "guisado",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 40,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Arroces y fideuà",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Sofreír cebolla en mantequilla o aceite hasta que esté tierna.",
        "Añadir el arroz y nacararlo 1-2 minutos removiendo.",
        "Incorporar los champiñones y {proteina}, y mojar con un chorro de vino blanco.",
        "Añadir caldo caliente poco a poco, removiendo sin parar, hasta que el arroz esté cremoso y en su punto (18-20 minutos)."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pollo",
          "gambas"
        ],
        "fijos": {
          "hidrato": [
            "arroz"
          ],
          "verdura": [
            "champinones"
          ]
        }
      }
    },
    {
      "id": "tortilla-paisana",
      "nombre": "Tortilla paisana",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "apta": [
        "comida"
      ],
      "tiempo_min": 30,
      "esfuerzo": "elaborado",
      "temporada": null,
      "region": null,
      "tematica": "Huevos y tortillas",
      "ocasion": null,
      "ninos": true,
      "foto": null,
      "pasos": [
        "Confitar la patata en dados en abundante aceite a fuego suave hasta que esté tierna.",
        "Saltear el pimiento y los guisantes en un poco de aceite aparte.",
        "Batir los huevos y mezclar con la patata escurrida y las verduras salteadas.",
        "Cuajar la mezcla en una sartén antiadherente, dando la vuelta a la tortilla para que se haga por los dos lados."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "huevo"
          ],
          "hidrato": [
            "patata"
          ],
          "verdura": [
            "guisantes",
            "pimiento"
          ]
        }
      }
    },
    {
      "id": "ensalada-calabacin-nueces-parmesano",
      "nombre": "Ensalada de calabacín, nueces y parmesano",
      "roles": [
        "principal"
      ],
      "origen": "nuevo",
      "tecnicaCoccion": "crudo",
      "acabado": null,
      "apta": [
        "comida",
        "cena"
      ],
      "tiempo_min": 10,
      "esfuerzo": "rapido",
      "temporada": "verano",
      "region": null,
      "tematica": "Ensaladas completas",
      "ocasion": null,
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-pasta.jpg",
      "pasos": [
        "Cortar el calabacín en láminas muy finas, con mandolina o pelador.",
        "Tostar las nueces ligeramente en una sartén sin aceite, 2-3 minutos, y trocearlas.",
        "Disponer las láminas de calabacín en un plato y repartir las nueces troceadas por encima.",
        "Aliñar con aceite de oliva, un chorrito de limón, sal y pimienta.",
        "Terminar con virutas de queso parmesano por encima."
      ],
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": null,
        "opciones": null,
        "fijos": {
          "proteina": [
            "nuez",
            "parmesano"
          ],
          "verdura": [
            "calabacin"
          ]
        }
      }
    },
    {
      "id": "hidrato-cocido",
      "nombre": "Guarnición de {hidrato}",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "arroz",
          "patata",
          "cuscus",
          "quinoa",
          "pasta"
        ],
        "fijos": null
      },
      "familia": "hidrato-cocido"
    },
    {
      "id": "hidrato-horno",
      "nombre": "{hidrato} al horno",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "patata",
          "boniato"
        ],
        "fijos": null
      },
      "familia": "hidrato-horno"
    },
    {
      "id": "hidrato-frito",
      "nombre": "Patatas fritas",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "frito",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "patata"
        ],
        "fijos": null
      },
      "familia": "hidrato-frito"
    },
    {
      "id": "hidrato-salteado",
      "nombre": "Arroz salteado",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "arroz"
        ],
        "fijos": null
      },
      "familia": "hidrato-salteado"
    },
    {
      "id": "hidrato-pure",
      "nombre": "Puré de patata",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "hervido",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "patata"
        ],
        "fijos": null
      },
      "familia": "hidrato-pure"
    },
    {
      "id": "hidrato-panadera",
      "nombre": "Patatas panaderas",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "patata"
        ],
        "fijos": null
      },
      "familia": "hidrato-panadera"
    },
    {
      "id": "hidrato-asada",
      "nombre": "Patata asada",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "patata"
        ],
        "fijos": null
      },
      "familia": "hidrato-asada"
    },
    {
      "id": "hidrato-gajos",
      "nombre": "Patatas en gajos",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "patata"
        ],
        "fijos": null
      },
      "familia": "hidrato-gajos"
    },
    {
      "id": "pan-mojar",
      "nombre": "Pan",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": null,
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "pan",
          "pan-integral",
          "pan-pita"
        ],
        "fijos": null
      },
      "familia": "pan-mojar"
    },
    {
      "id": "pan-tostado",
      "nombre": "Picatostes de pan tostado",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "grupos": [
        "hidrato"
      ],
      "ingredientes": {
        "eje": "hidrato",
        "opciones": [
          "pan-integral"
        ],
        "fijos": null
      },
      "familia": "pan-tostado"
    },
    {
      "id": "verdura-salteada-vapor",
      "nombre": "Salteado de {verdura}",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "brocoli",
          "judias-verdes",
          "calabacin",
          "zanahoria",
          "pimiento",
          "espinacas",
          "champinones",
          "col"
        ],
        "fijos": null
      },
      "familia": "verdura-salteada-vapor"
    },
    {
      "id": "verdura-horno",
      "nombre": "{verdura} al horno",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "brocoli",
          "coliflor",
          "zanahoria",
          "pimiento",
          "calabacin",
          "tomate"
        ],
        "fijos": null
      },
      "familia": "verdura-horno"
    },
    {
      "id": "verdura-vapor",
      "nombre": "{verdura} al vapor",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "vapor",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "brocoli",
          "judias-verdes",
          "calabacin",
          "zanahoria"
        ],
        "fijos": null
      },
      "familia": "verdura-vapor"
    },
    {
      "id": "escalivada",
      "nombre": "Escalivada",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "horno",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "berenjena",
          "pimiento"
        ],
        "fijos": null
      },
      "familia": "escalivada"
    },
    {
      "id": "espinacas-catalana",
      "nombre": "Espinacas a la catalana",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "salteado",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "espinacas"
        ],
        "fijos": null
      },
      "familia": "espinacas-catalana"
    },
    {
      "id": "coleslaw",
      "nombre": "Coleslaw",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "coleslaw",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "col"
        ],
        "fijos": {
          "verdura": [
            "zanahoria"
          ]
        }
      },
      "familia": "ensalada"
    },
    {
      "id": "ensalada-solo",
      "nombre": "Ensalada de {verdura}",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "ensalada",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "tomate",
          "pepino"
        ],
        "fijos": null
      },
      "familia": "ensalada"
    },
    {
      "id": "ensalada-mixta",
      "nombre": "Ensalada mixta con {verdura}",
      "roles": [
        "complementaria"
      ],
      "origen": "nativo",
      "tecnicaCoccion": "ensalada",
      "acabado": null,
      "grupos": [
        "verdura"
      ],
      "ingredientes": {
        "eje": "verdura",
        "opciones": [
          "pepino",
          "zanahoria",
          "pimiento"
        ],
        "fijos": {
          "verdura": [
            "lechuga",
            "tomate"
          ]
        }
      },
      "familia": "ensalada"
    }
  ],
  "compatibilidad": [
    {
      "principalId": "plancha-guarnicion",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "plancha-guarnicion",
      "complementariaFamilia": "verdura-salteada-vapor"
    },
    {
      "principalId": "horno-bandeja",
      "complementariaFamilia": "hidrato-horno"
    },
    {
      "principalId": "horno-bandeja",
      "complementariaFamilia": "verdura-horno"
    },
    {
      "principalId": "pasta-bolonesa",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "pollo-asado-horno",
      "complementariaFamilia": "hidrato-horno"
    },
    {
      "principalId": "pollo-asado-horno",
      "complementariaFamilia": "verdura-horno"
    },
    {
      "principalId": "pescado-horno-limon",
      "complementariaFamilia": "hidrato-horno"
    },
    {
      "principalId": "pescado-horno-limon",
      "complementariaFamilia": "verdura-horno"
    },
    {
      "principalId": "tortilla-patata",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "tortilla-patata",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "tortilla-patata",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "tortilla-francesa-verdura",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "revuelto-champinones",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "ensalada-completa",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "ensalada-completa",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "ensalada-completa",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "ensalada-completa",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "ensalada-pasta",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "ensalada-pasta",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "ensalada-pasta",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "ensalada-cesar-casera",
      "complementariaFamilia": "pan-tostado"
    },
    {
      "principalId": "ensalada-cesar-casera",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "ensalada-cesar-casera",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "ensalada-cesar-casera",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "quinoa-ensalada",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "quinoa-ensalada",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "quinoa-ensalada",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "merluza-salsa-verde",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "salmon-salsa",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "salmon-salsa",
      "complementariaFamilia": "verdura-salteada-vapor"
    },
    {
      "principalId": "bacalao-tomate",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "pescaditos-plancha",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "pescaditos-plancha",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "pescaditos-plancha",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "pescaditos-plancha",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "gallo-plancha",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "gallo-plancha",
      "complementariaFamilia": "verdura-salteada-vapor"
    },
    {
      "principalId": "gambas-ajillo",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "gambas-ajillo",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "gambas-ajillo",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "gambas-ajillo",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "mejillones-marinera",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "empanadillas-caseras",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "empanadillas-caseras",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "empanadillas-caseras",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "hummus-plato",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "hummus-plato",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "hummus-plato",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "hummus-plato",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "tofu-plancha-verduras",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "tofu-plancha-verduras",
      "complementariaFamilia": "verdura-salteada-vapor"
    },
    {
      "principalId": "hamburguesa-casera",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "menestra-verduras",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "albondigas-salsa",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "croquetas-caseras",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "croquetas-caseras",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "croquetas-caseras",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "pollo-al-chilindron",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "fabada-asturiana",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "fabada-asturiana",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "fabada-asturiana",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "cachopo",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "cachopo",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "cachopo",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "piperrada-con-huevo",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "zarangollo",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "fricando-de-ternera",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "atascaburras",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "atascaburras",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "atascaburras",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "sopa-castellana",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "sopa-castellana",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "sopa-castellana",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "bonito-encebollado",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "soldaditos-de-pavia",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "soldaditos-de-pavia",
      "complementariaFamilia": "verdura-horno"
    },
    {
      "principalId": "merluza-a-la-sidra",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "trucha-a-la-navarra",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "trucha-a-la-navarra",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "trucha-a-la-navarra",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "trucha-a-la-navarra",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "huevos-fritos-con-patatas",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "huevos-fritos-con-patatas",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "huevos-fritos-con-patatas",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "cena-de-tabla",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "pollo-pepitoria",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "pollo-pepitoria",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "pollo-pepitoria",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "pollo-pepitoria",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "escabechado",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "escabechado",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "escabechado",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "escabechado",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "estofado-ternera",
      "complementariaFamilia": "hidrato-pure"
    },
    {
      "principalId": "estofado-ternera",
      "complementariaFamilia": "verdura-salteada-vapor"
    },
    {
      "principalId": "magro-tomate",
      "complementariaFamilia": "hidrato-frito"
    },
    {
      "principalId": "magro-tomate",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "magro-tomate",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "magro-tomate",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "costillas-salsa-barbacoa",
      "complementariaFamilia": "hidrato-gajos"
    },
    {
      "principalId": "costillas-salsa-barbacoa",
      "complementariaFamilia": "verdura-horno"
    },
    {
      "principalId": "caldereta-cordero",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "caldereta-cordero",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "caldereta-cordero",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "caldereta-cordero",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "cordero-asado",
      "complementariaFamilia": "hidrato-panadera"
    },
    {
      "principalId": "cordero-asado",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "cordero-asado",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "cordero-asado",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "solomillo-pedro-ximenez",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "solomillo-pedro-ximenez",
      "complementariaFamilia": "escalivada"
    },
    {
      "principalId": "brochetas-carne",
      "complementariaFamilia": "hidrato-salteado"
    },
    {
      "principalId": "brochetas-carne",
      "complementariaFamilia": "verdura-salteada-vapor"
    },
    {
      "principalId": "pollo-salsa-champinones",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "escalope-empanado",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "escalope-empanado",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "escalope-empanado",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "escalope-empanado",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "san-jacobo",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "san-jacobo",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "san-jacobo",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "san-jacobo",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "flamenquin",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "flamenquin",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "flamenquin",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "flamenquin",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "pescado-romana",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "pescado-romana",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "pescado-romana",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "pescado-romana",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "pescado-papillote",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "bacalao-pil-pil",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "bacalao-pil-pil",
      "complementariaFamilia": "espinacas-catalana"
    },
    {
      "principalId": "bacalao-vizcaina",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "calamares-plancha",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "calamares-plancha",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "calamares-plancha",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "calamares-plancha",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "calamares-romana",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "calamares-romana",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "calamares-romana",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "calamares-romana",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "sepia-plancha",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "sepia-plancha",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "sepia-plancha",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "sepia-plancha",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "chipirones-plancha",
      "complementariaFamilia": "hidrato-cocido"
    },
    {
      "principalId": "chipirones-plancha",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "chipirones-plancha",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "chipirones-plancha",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "pulpo-a-feira",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "pulpo-a-feira",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "pulpo-a-feira",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "almejas-marinera",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "almejas-marinera",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "almejas-marinera",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "almejas-marinera",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "huevos-al-plato",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "huevos-flamenca",
      "complementariaFamilia": "pan-mojar"
    },
    {
      "principalId": "canelones-carne",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "canelones-carne",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "canelones-carne",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "carbonara",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "carbonara",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "carbonara",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "arroz-negro",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "arroz-negro",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "arroz-negro",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "patatas-riojana",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "patatas-riojana",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "patatas-riojana",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "fideos-cazuela",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "fideos-cazuela",
      "complementariaFamilia": "ensalada-mixta"
    },
    {
      "principalId": "fideos-cazuela",
      "complementariaFamilia": "coleslaw"
    },
    {
      "principalId": "ensalada-calabacin-nueces-parmesano",
      "complementariaFamilia": "hidrato-cocido"
    }
  ],
  "postres": {
    "lacteo": "yogur",
    "tradicionales": [
      {
        "nombre": "Arroz con leche",
        "region": "asturias",
        "temporada": "invierno"
      },
      {
        "nombre": "Natillas caseras",
        "region": null,
        "temporada": "invierno"
      },
      {
        "nombre": "Flan de huevo",
        "region": null,
        "temporada": null
      },
      {
        "nombre": "Macedonia de frutas",
        "region": null,
        "temporada": "verano"
      },
      {
        "nombre": "Torrijas",
        "region": null,
        "temporada": "invierno"
      },
      {
        "nombre": "Crema catalana",
        "region": "cataluna",
        "temporada": null
      },
      {
        "nombre": "Mel i mató",
        "region": "cataluna",
        "temporada": null
      },
      {
        "nombre": "Cuajada con miel",
        "region": "navarra-rioja",
        "temporada": "invierno"
      }
    ]
  },
  "despensa": [
    {
      "id": "st-aceite",
      "nombre": "Aceite de oliva"
    },
    {
      "id": "st-sal",
      "nombre": "Sal"
    },
    {
      "id": "st-vinagre",
      "nombre": "Vinagre"
    },
    {
      "id": "st-harina",
      "nombre": "Harina"
    },
    {
      "id": "st-pan-rallado",
      "nombre": "Pan rallado"
    },
    {
      "id": "st-caldo",
      "nombre": "Caldo (pollo o verduras)"
    },
    {
      "id": "st-pimenton",
      "nombre": "Pimentón"
    },
    {
      "id": "st-azafran",
      "nombre": "Azafrán"
    },
    {
      "id": "st-laurel",
      "nombre": "Laurel"
    },
    {
      "id": "st-perejil",
      "nombre": "Perejil"
    },
    {
      "id": "st-comino",
      "nombre": "Comino"
    },
    {
      "id": "st-oregano",
      "nombre": "Orégano"
    },
    {
      "id": "st-pimienta",
      "nombre": "Pimienta"
    },
    {
      "id": "st-nora-choricero",
      "nombre": "Ñora / pimiento choricero"
    },
    {
      "id": "st-salsa-barbacoa",
      "nombre": "Salsa barbacoa"
    },
    {
      "id": "st-mayonesa",
      "nombre": "Mayonesa"
    }
  ]
};
  if (typeof module !== 'undefined' && module.exports) module.exports = window.E3_RECETAS;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
