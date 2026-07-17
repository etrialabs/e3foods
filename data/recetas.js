// e3Foods — Banco de recetas semilla
// Cocina española/mediterránea familiar. kcal orientativas (NO app médica).
// Convención de peso: carnes/pescados/marisco = crudo; cereales (arroz, pasta...) = en seco;
// legumbres = cocidas/de bote listas para comer; verdura/tubérculo = en crudo tal cual se compra.
window.E3_RECETAS = {
  version: 2, // v2 = tramo 1 regional/estacional/postres (2026-07-17)

  ingredientes: {
    // ---- carne-blanca ----
    "pollo": { nombre: "Pollo (pechuga o contramuslo)", categoria: "carne-blanca", kcal_100g: 165, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 2 },
    "pavo": { nombre: "Pavo (filete o picado)", categoria: "carne-blanca", kcal_100g: 110, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 2 },
    "conejo": { nombre: "Conejo", categoria: "carne-blanca", kcal_100g: 130, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 2 },

    // ---- carne-roja ----
    "ternera-picada": { nombre: "Carne picada de ternera", categoria: "carne-roja", kcal_100g: 240, racion_adulto_g: 130, racion_nino_g: 80, coste_banda: 2 },
    "ternera": { nombre: "Ternera (filete o para guisar)", categoria: "carne-roja", kcal_100g: 200, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 3 },
    "cerdo": { nombre: "Cerdo (lomo o solomillo)", categoria: "carne-roja", kcal_100g: 180, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 2 },
    // -- procesados/curados de cerdo (tramo 1, 2026-07-17) — kcal BEDCA (API XML, jul-2026). Categoría
    //    carne-roja a propósito: la carne procesada computa junto a la roja en las cuotas estilo AESAN/OMS.
    //    Ración pequeña: son compango/condimento de plato, no proteína de ración completa.
    "chorizo": { nombre: "Chorizo", categoria: "carne-roja", kcal_100g: 323, racion_adulto_g: 60, racion_nino_g: 30, coste_banda: 2 }, // BEDCA "Chorizo" (f_id 2264)
    "panceta": { nombre: "Panceta de cerdo", categoria: "carne-roja", kcal_100g: 467, racion_adulto_g: 50, racion_nino_g: 25, coste_banda: 2 }, // BEDCA "Cerdo, panceta, cruda" (f_id 2260)
    "jamon-serrano": { nombre: "Jamón serrano", categoria: "carne-roja", kcal_100g: 319, racion_adulto_g: 40, racion_nino_g: 25, coste_banda: 2 }, // BEDCA "Jamón serrano" (f_id 2273)
    "compango": { nombre: "Compango asturiano (chorizo, morcilla y lacón)", categoria: "carne-roja", kcal_100g: 287, racion_adulto_g: 80, racion_nino_g: 40, coste_banda: 2 }, // media BEDCA chorizo 323 + morcilla 324 + lacón 214 — ⚠ morcilla/lacón con fiabilidad reducida (discrepancia FEN), ver 01_Research/2026-07-17_RESEARCH_BANCO_AMPLIACION.md
    "ternera-rellena": { nombre: "Ternera rellena de jamón y queso (cachopo)", categoria: "carne-roja", kcal_100g: 195, racion_adulto_g: 200, racion_nino_g: 120, coste_banda: 3 }, // ponderado 60% ternera (200, banco) + 15% jamón serrano (319, BEDCA) + 25% queso fresco (110, banco)

    // ---- pescado-blanco ----
    "merluza": { nombre: "Merluza", categoria: "pescado-blanco", kcal_100g: 90, racion_adulto_g: 160, racion_nino_g: 100, coste_banda: 3 },
    "bacalao": { nombre: "Bacalao desalado", categoria: "pescado-blanco", kcal_100g: 110, racion_adulto_g: 160, racion_nino_g: 100, coste_banda: 2 },
    "lubina": { nombre: "Lubina", categoria: "pescado-blanco", kcal_100g: 118, racion_adulto_g: 160, racion_nino_g: 100, coste_banda: 3 },
    "gallo": { nombre: "Gallo (filetes)", categoria: "pescado-blanco", kcal_100g: 80, racion_adulto_g: 160, racion_nino_g: 100, coste_banda: 3 },

    // ---- pescado-azul ----
    "salmon": { nombre: "Salmón", categoria: "pescado-azul", kcal_100g: 200, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 3 },
    "atun": { nombre: "Atún fresco", categoria: "pescado-azul", kcal_100g: 130, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 3 },
    "sardinas": { nombre: "Sardinas", categoria: "pescado-azul", kcal_100g: 170, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 2 },
    "boquerones": { nombre: "Boquerones", categoria: "pescado-azul", kcal_100g: 130, racion_adulto_g: 120, racion_nino_g: 70, coste_banda: 1 },
    "bonito": { nombre: "Bonito del norte fresco", categoria: "pescado-azul", kcal_100g: 138, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 2 }, // FEN "Bonito" (T. alalunga) — BEDCA no tiene la especie en crudo
    "trucha": { nombre: "Trucha", categoria: "pescado-azul", kcal_100g: 90, racion_adulto_g: 160, racion_nino_g: 100, coste_banda: 2 }, // FEN "Trucha" (arcoíris, O. mykiss); semigrasa (3%), agrupada con azul por perfil omega-3

    // ---- marisco ----
    "gambas": { nombre: "Gambas o langostinos", categoria: "marisco", kcal_100g: 90, racion_adulto_g: 130, racion_nino_g: 80, coste_banda: 3 },
    "mejillones": { nombre: "Mejillones", categoria: "marisco", kcal_100g: 85, racion_adulto_g: 200, racion_nino_g: 120, coste_banda: 2 },

    // ---- huevo ----
    "huevo": { nombre: "Huevo", categoria: "huevo", kcal_100g: 155, racion_adulto_g: 120, racion_nino_g: 60, coste_banda: 1 },

    // ---- legumbre (incluye soja/tofu como proteína vegetal asimilada) ----
    "garbanzos": { nombre: "Garbanzos cocidos", categoria: "legumbre", kcal_100g: 120, racion_adulto_g: 200, racion_nino_g: 130, coste_banda: 1 },
    "lentejas": { nombre: "Lentejas cocidas", categoria: "legumbre", kcal_100g: 116, racion_adulto_g: 200, racion_nino_g: 130, coste_banda: 1 },
    "alubias-blancas": { nombre: "Alubias blancas cocidas", categoria: "legumbre", kcal_100g: 120, racion_adulto_g: 200, racion_nino_g: 130, coste_banda: 1 },
    "edamame": { nombre: "Edamame (soja verde)", categoria: "legumbre", kcal_100g: 120, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 1 },
    "tofu": { nombre: "Tofu", categoria: "legumbre", kcal_100g: 90, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 2 },
    "hummus": { nombre: "Hummus", categoria: "legumbre", kcal_100g: 170, racion_adulto_g: 100, racion_nino_g: 60, coste_banda: 2 },
    "legumbres-variadas": { nombre: "Legumbres variadas cocidas", categoria: "legumbre", kcal_100g: 119, racion_adulto_g: 200, racion_nino_g: 130, coste_banda: 1 }, // media del propio banco (garbanzos 120 + lentejas 116 + alubias 120) — para la olleta

    // ---- cereal ----
    "arroz": { nombre: "Arroz", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 80, racion_nino_g: 50, coste_banda: 1 },
    "pasta": { nombre: "Pasta", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 80, racion_nino_g: 50, coste_banda: 1 },
    "cuscus": { nombre: "Cuscús", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 70, racion_nino_g: 45, coste_banda: 1 },
    "quinoa": { nombre: "Quinoa", categoria: "cereal", kcal_100g: 370, racion_adulto_g: 70, racion_nino_g: 45, coste_banda: 2 },
    "pan-integral": { nombre: "Pan integral", categoria: "cereal", kcal_100g: 250, racion_adulto_g: 60, racion_nino_g: 40, coste_banda: 1 },
    "fideos": { nombre: "Fideos", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 70, racion_nino_g: 45, coste_banda: 1 },
    "masa-empanadilla": { nombre: "Masa de empanadilla", categoria: "cereal", kcal_100g: 310, racion_adulto_g: 90, racion_nino_g: 60, coste_banda: 2 },
    "tortilla-trigo": { nombre: "Tortilla de trigo (wrap)", categoria: "cereal", kcal_100g: 290, racion_adulto_g: 70, racion_nino_g: 40, coste_banda: 2 },
    "pan-hamburguesa": { nombre: "Pan de hamburguesa", categoria: "cereal", kcal_100g: 260, racion_adulto_g: 60, racion_nino_g: 45, coste_banda: 2 },
    "masa-pizza": { nombre: "Masa de pizza", categoria: "cereal", kcal_100g: 270, racion_adulto_g: 150, racion_nino_g: 100, coste_banda: 2 },
    "placas-lasana": { nombre: "Placas de lasaña", categoria: "cereal", kcal_100g: 350, racion_adulto_g: 90, racion_nino_g: 60, coste_banda: 2 },
    "pan-pita": { nombre: "Pan de pita", categoria: "cereal", kcal_100g: 275, racion_adulto_g: 60, racion_nino_g: 40, coste_banda: 2 },
    "pan": { nombre: "Pan (barra)", categoria: "cereal", kcal_100g: 240, racion_adulto_g: 60, racion_nino_g: 40, coste_banda: 1 }, // BEDCA "Pan blanco, de barra" (f_id 2160) — migas, gazpacho, salmorejo, sopa castellana

    // ---- tuberculo ----
    "patata": { nombre: "Patata", categoria: "tuberculo", kcal_100g: 77, racion_adulto_g: 220, racion_nino_g: 130, coste_banda: 1 },
    "boniato": { nombre: "Boniato", categoria: "tuberculo", kcal_100g: 86, racion_adulto_g: 200, racion_nino_g: 120, coste_banda: 1 },

    // ---- verdura ----
    "brocoli": { nombre: "Brócoli", categoria: "verdura", kcal_100g: 34, racion_adulto_g: 180, racion_nino_g: 100, coste_banda: 1 },
    "judias-verdes": { nombre: "Judías verdes", categoria: "verdura", kcal_100g: 31, racion_adulto_g: 180, racion_nino_g: 100, coste_banda: 1 },
    "calabacin": { nombre: "Calabacín", categoria: "verdura", kcal_100g: 17, racion_adulto_g: 200, racion_nino_g: 120, coste_banda: 1 },
    "zanahoria": { nombre: "Zanahoria", categoria: "verdura", kcal_100g: 41, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 1 },
    "pimiento": { nombre: "Pimiento", categoria: "verdura", kcal_100g: 30, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 1 },
    "espinacas": { nombre: "Espinacas", categoria: "verdura", kcal_100g: 23, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 1 },
    "champinones": { nombre: "Champiñones", categoria: "verdura", kcal_100g: 22, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 1 },
    "berenjena": { nombre: "Berenjena", categoria: "verdura", kcal_100g: 25, racion_adulto_g: 180, racion_nino_g: 100, coste_banda: 1 },
    "tomate": { nombre: "Tomate", categoria: "verdura", kcal_100g: 18, racion_adulto_g: 150, racion_nino_g: 90, coste_banda: 1 },
    "guisantes": { nombre: "Guisantes", categoria: "verdura", kcal_100g: 80, racion_adulto_g: 120, racion_nino_g: 80, coste_banda: 1 },
    "coliflor": { nombre: "Coliflor", categoria: "verdura", kcal_100g: 25, racion_adulto_g: 200, racion_nino_g: 110, coste_banda: 1 },
    "puerro": { nombre: "Puerro", categoria: "verdura", kcal_100g: 61, racion_adulto_g: 120, racion_nino_g: 70, coste_banda: 1 },
    "acelgas": { nombre: "Acelgas", categoria: "verdura", kcal_100g: 19, racion_adulto_g: 180, racion_nino_g: 100, coste_banda: 1 },
    "alcachofa": { nombre: "Alcachofa", categoria: "verdura", kcal_100g: 47, racion_adulto_g: 200, racion_nino_g: 110, coste_banda: 2 },
    "calabaza": { nombre: "Calabaza", categoria: "verdura", kcal_100g: 26, racion_adulto_g: 200, racion_nino_g: 110, coste_banda: 1 },
    "lechuga": { nombre: "Lechuga", categoria: "verdura", kcal_100g: 15, racion_adulto_g: 100, racion_nino_g: 60, coste_banda: 1 },
    "pepino": { nombre: "Pepino", categoria: "verdura", kcal_100g: 12, racion_adulto_g: 100, racion_nino_g: 60, coste_banda: 1 },
    "espinacas-queso": { nombre: "Relleno de espinacas y queso", categoria: "verdura", kcal_100g: 120, racion_adulto_g: 90, racion_nino_g: 60, coste_banda: 2 },

    // ---- lacteo ----
    "queso-fresco": { nombre: "Queso fresco", categoria: "lacteo", kcal_100g: 110, racion_adulto_g: 80, racion_nino_g: 50, coste_banda: 2 },
    "queso-feta": { nombre: "Queso feta", categoria: "lacteo", kcal_100g: 260, racion_adulto_g: 50, racion_nino_g: 30, coste_banda: 3 },
    "yogur": { nombre: "Yogur natural", categoria: "lacteo", kcal_100g: 57, racion_adulto_g: 125, racion_nino_g: 125, coste_banda: 1 }, // FEN "Yogur entero natural" — ración = 1 unidad; postre del sábado

    // ---- otro (tramo 1) ----
    "bechamel": { nombre: "Bechamel casera (leche, harina y mantequilla)", categoria: "otro", kcal_100g: 152, racion_adulto_g: 100, racion_nino_g: 60, coste_banda: 1 }, // BEDCA "Salsa bechamel" (f_id 2580) — base de croquetas

    // ---- fruta (tramo 1, postre por defecto — rotación por mes con el calendario oficial MAPA) ----
    // kcal BEDCA (API XML, jul-2026); ración fruta AESAN 120-200 g → 170/100 estándar,
    // sandía/melón en rodaja 250/150, plátano por pieza 120/80.
    "naranja": { nombre: "Naranja", categoria: "fruta", kcal_100g: 38, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "mandarina": { nombre: "Mandarina", categoria: "fruta", kcal_100g: 40, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "fresa": { nombre: "Fresas", categoria: "fruta", kcal_100g: 36, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "cereza": { nombre: "Cerezas", categoria: "fruta", kcal_100g: 63, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 2 },
    "albaricoque": { nombre: "Albaricoques", categoria: "fruta", kcal_100g: 42, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "melocoton": { nombre: "Melocotón", categoria: "fruta", kcal_100g: 39, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "sandia": { nombre: "Sandía", categoria: "fruta", kcal_100g: 20, racion_adulto_g: 250, racion_nino_g: 150, coste_banda: 1 },
    "melon": { nombre: "Melón", categoria: "fruta", kcal_100g: 27, racion_adulto_g: 250, racion_nino_g: 150, coste_banda: 1 },
    "uva": { nombre: "Uvas", categoria: "fruta", kcal_100g: 68, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 2 },
    "caqui": { nombre: "Caqui", categoria: "fruta", kcal_100g: 67, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "manzana": { nombre: "Manzana", categoria: "fruta", kcal_100g: 50, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "pera": { nombre: "Pera", categoria: "fruta", kcal_100g: 45, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 },
    "platano": { nombre: "Plátano", categoria: "fruta", kcal_100g: 89, racion_adulto_g: 120, racion_nino_g: 80, coste_banda: 1 },
    "kiwi": { nombre: "Kiwi", categoria: "fruta", kcal_100g: 52, racion_adulto_g: 170, racion_nino_g: 100, coste_banda: 1 }
  },

  // Cuotas semanales — RESEARCH_ALIMENTACION_ESPANA.md §3.2 (adultos, A22) y §3.3 (niños, AI22/AC25).
  // Regla: cuando la fuente da un rango explícito de ambas poblaciones se toma la intersección
  // (mínimo común más alto, máximo común más bajo); cuando la fuente solo da un suelo ("≥X"),
  // se deja sin techo (max_sem: null) porque ninguna fuente marca ese grupo como problema por exceso.
  categorias_cuota: {
    // Legumbre: adultos 2-4 raciones/sem (A22) · niños 3-4/sem (AI22) → intersección 3-4.
    "legumbre": { min_sem: 3, max_sem: 4 },
    // Pescado total: adultos ≥2/sem (A22) · niños 2-3/sem (AI22) → suelo compartido 2, sin techo.
    "pescado-total": { min_sem: 2, max_sem: null },
    // Pescado azul: 1-2 raciones/sem dentro del total, igual para adultos y niños (A22 / AI22).
    "pescado-azul": { min_sem: 1, max_sem: 2 },
    // Carne roja: máx. 2/sem adultos (A22). AC25 (niños 1-3 años, comedor, más reciente) es más
    // estricto (máx. 1/sem) — no se fuerza aquí porque el plan es de toda la familia junta;
    // 2/sem es el techo que no debe superarse ni para el miembro adulto de la mesa.
    "carne-roja": { min_sem: 0, max_sem: 2 },
    // Huevo: adultos 2-4/sem (A22) · niños 3-4/sem (AI22) → intersección 3-4.
    "huevo": { min_sem: 3, max_sem: 4 }
  },

  plantillas: [
    {
      id: "plancha-guarnicion",
      nombre_patron: "{proteina} a la plancha con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["pollo", "pavo", "merluza", "salmon", "cerdo", "ternera"],
        hidrato: ["arroz", "patata", "cuscus", "quinoa"],
        verdura: ["brocoli", "judias-verdes", "calabacin", "zanahoria", "pimiento"]
      },
      kcal_extra: 100,
      pasos: [
        "Salpimentar {proteina} y dejar atemperar 10 minutos.",
        "Cocer {hidrato} según su tiempo y reservar.",
        "Saltear o cocer al vapor {verdura} con un chorrito de aceite de oliva.",
        "Hacer {proteina} a la plancha vuelta y vuelta hasta que esté hecho por dentro.",
        "Emplatar {proteina} con {hidrato} y {verdura} al lado."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // piloto 2026-07-13 (Roger) — foto real de salmón; genérica para el resto de proteínas del eje, no coincide ingrediente a ingrediente
    },
    {
      id: "horno-bandeja",
      nombre_patron: "{proteina} al horno con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["pollo", "cerdo", "merluza", "salmon", "lubina"],
        hidrato: ["patata", "boniato"],
        verdura: ["brocoli", "coliflor", "zanahoria", "pimiento"]
      },
      kcal_extra: 110,
      pasos: [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} y {verdura} en trozos similares y repartir en la bandeja con aceite y sal.",
        "Colocar {proteina} sobre las verduras, salpimentar y regar con un poco de aceite.",
        "Hornear 30-35 minutos hasta que {proteina} esté hecho y {hidrato} tierno.",
        "Dejar reposar 5 minutos antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "lentejas-guiso",
      nombre_patron: "Lentejas guisadas con verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["lentejas"],
        hidrato: ["lentejas"],
        verdura: ["zanahoria", "puerro", "calabaza", "pimiento"]
      },
      kcal_extra: 80,
      pasos: [
        "Sofreír ajo y cebolla en la olla con un poco de aceite de oliva.",
        "Añadir {verdura} en trozos pequeños y rehogar 5 minutos.",
        "Incorporar las lentejas y cubrir con caldo o agua.",
        "Cocer a fuego medio 20-25 minutos removiendo de vez en cuando.",
        "Rectificar de sal y dejar reposar antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "garbanzos-guiso",
      nombre_patron: "Garbanzos guisados con verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["garbanzos"],
        hidrato: ["garbanzos"],
        verdura: ["zanahoria", "acelgas", "calabaza"]
      },
      kcal_extra: 80,
      pasos: [
        "Sofreír ajo, cebolla y un poco de pimentón dulce en la olla.",
        "Añadir {verdura} troceada y rehogar unos minutos.",
        "Incorporar los garbanzos cocidos y cubrir con caldo.",
        "Cocer 15-20 minutos a fuego suave para que se integren los sabores.",
        "Servir bien caliente."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "cocido-simplificado",
      nombre_patron: "Cocido simplificado de garbanzos con {proteina}",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 90,
      esfuerzo: "elaborado",
      ninos: true,
      temporada: "invierno",
      region: "madrid",
      ejes: {
        proteina: ["pollo", "ternera"],
        hidrato: ["garbanzos"],
        verdura: ["zanahoria", "puerro"]
      },
      kcal_extra: 100,
      pasos: [
        "Poner en la olla {proteina}, hueso de rodilla o similar (opcional) y cubrir con agua fría.",
        "Llevar a hervor, espumar y añadir {verdura} en trozos grandes.",
        "Cocer a fuego lento 1 hora aproximadamente.",
        "Añadir los garbanzos (previamente en remojo o de bote) y cocer 20 minutos más.",
        "Servir el caldo aparte como sopa y el resto como plato único."
      ],
      notas: "Versión simplificada de un solo vuelco, sin fideos ni pelota.",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "alubias-guiso",
      nombre_patron: "Alubias blancas guisadas con verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["alubias-blancas"],
        hidrato: ["alubias-blancas"],
        verdura: ["zanahoria", "puerro", "calabaza"]
      },
      kcal_extra: 90,
      pasos: [
        "Sofreír ajo y cebolla en una cazuela con aceite de oliva.",
        "Añadir {verdura} troceada y rehogar 5 minutos.",
        "Incorporar las alubias cocidas y un poco de caldo o agua.",
        "Cocer 15 minutos a fuego suave, moviendo la cazuela (no remover con cuchara) para que ligue.",
        "Dejar reposar unos minutos antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "paella-sencilla",
      nombre_patron: "Paella sencilla de {proteina}",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 60,
      esfuerzo: "elaborado",
      ninos: true,
      region: "comunidad-valenciana",
      ejes: {
        proteina: ["pollo", "gambas", "conejo"],
        hidrato: ["arroz"],
        verdura: ["judias-verdes", "pimiento"]
      },
      kcal_extra: 150,
      pasos: [
        "Sofreír {proteina} en la paellera con aceite de oliva hasta dorar.",
        "Añadir {verdura} y un sofrito de tomate y ajo, rehogar bien.",
        "Incorporar el arroz y nacarar 2 minutos.",
        "Añadir el caldo caliente con azafrán o colorante y cocer 18-20 minutos sin remover.",
        "Dejar reposar 5 minutos tapada con un paño antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "arroz-horno",
      nombre_patron: "Arroz al horno con {proteina}",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 55,
      esfuerzo: "elaborado",
      ninos: true,
      temporada: "invierno",
      region: "comunidad-valenciana",
      ejes: {
        proteina: ["pollo", "cerdo"],
        hidrato: ["arroz"],
        verdura: ["tomate", "pimiento"]
      },
      kcal_extra: 120,
      pasos: [
        "Dorar {proteina} en una cazuela apta para horno con aceite de oliva.",
        "Añadir {verdura} y un sofrito de tomate y ajo, rehogar.",
        "Incorporar el arroz, mezclar bien y cubrir con caldo caliente.",
        "Hornear a 200°C durante 20-25 minutos hasta que el arroz esté hecho y dorado por arriba.",
        "Dejar reposar 5 minutos antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "arroz-caldoso",
      nombre_patron: "Arroz caldoso de {proteina}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 50,
      esfuerzo: "elaborado",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["pollo", "gambas", "merluza"],
        hidrato: ["arroz"],
        verdura: ["judias-verdes", "pimiento"]
      },
      kcal_extra: 110,
      pasos: [
        "Sofreír {proteina} y {verdura} en una olla con aceite de oliva.",
        "Añadir un sofrito de tomate y ajo y rehogar 2 minutos.",
        "Incorporar el arroz y cubrir generosamente con caldo caliente.",
        "Cocer 18-20 minutos a fuego medio removiendo de vez en cuando, debe quedar caldoso.",
        "Servir inmediatamente en plato hondo."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "arroz-verduras",
      nombre_patron: "Arroz con verduras y {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["pollo", "gambas", "tofu", "huevo"],
        hidrato: ["arroz"],
        verdura: ["pimiento", "guisantes", "zanahoria", "calabacin"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer el arroz en abundante agua con sal y escurrir.",
        "Saltear {verdura} en una sartén amplia con un poco de aceite.",
        "Añadir {proteina} y cocinar hasta que esté hecho.",
        "Incorporar el arroz cocido y saltear todo junto 2-3 minutos.",
        "Rectificar de sal y servir caliente."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "arroz-cubana",
      nombre_patron: "Arroz a la cubana con huevo y tomate",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["huevo"],
        hidrato: ["arroz"],
        verdura: ["tomate"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer el arroz blanco en agua con sal y escurrir bien.",
        "Preparar una salsa de {verdura} frito o triturado, calentar.",
        "Freír {proteina} con la yema jugosa.",
        "Emplatar el arroz en molde, la salsa de tomate al lado y el huevo por encima."
      ],
      notas: "Clásico infantil: plátano frito opcional de acompañamiento (no incluido en el cálculo).",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "pasta-bolonesa",
      nombre_patron: "{hidrato} con boloñesa de {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["pavo", "ternera-picada"],
        hidrato: ["pasta"],
        verdura: ["zanahoria", "tomate", "calabacin"]
      },
      kcal_extra: 100,
      pasos: [
        "Picar {verdura} muy fina y sofreír con ajo y cebolla.",
        "Añadir {proteina} y dorar bien deshaciendo los grumos.",
        "Incorporar tomate triturado y cocer a fuego lento 15-20 minutos.",
        "Cocer {hidrato} al dente en agua con sal.",
        "Mezclar o servir la boloñesa sobre {hidrato}."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "pasta-verduras-salteadas",
      nombre_patron: "{hidrato} con {proteina} y verduras salteadas",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["pollo", "gambas", "tofu", "huevo"],
        hidrato: ["pasta"],
        verdura: ["brocoli", "calabacin", "champinones", "pimiento", "espinacas"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer {hidrato} al dente y reservar con un poco de su agua.",
        "Saltear {verdura} en una sartén amplia con aceite de oliva.",
        "Añadir {proteina} y cocinar hasta que esté hecho.",
        "Incorporar {hidrato} escurrida y saltear todo junto 2 minutos.",
        "Añadir un chorrito de aceite en crudo y servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "pasta-atun",
      nombre_patron: "Pasta con atún y tomate",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["atun"],
        hidrato: ["pasta"],
        verdura: ["tomate"]
      },
      kcal_extra: 80,
      pasos: [
        "Cocer la pasta al dente en agua con sal.",
        "Calentar el tomate con un poco de ajo y aceite de oliva.",
        "Añadir el atún desmenuzado y calentar 2-3 minutos.",
        "Mezclar con la pasta escurrida y servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "lasana-verduras",
      nombre_patron: "Lasaña de {proteina} con verduras",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 65,
      esfuerzo: "elaborado",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["ternera-picada", "pavo"],
        hidrato: ["placas-lasana"],
        verdura: ["calabacin", "espinacas", "zanahoria"]
      },
      kcal_extra: 130,
      pasos: [
        "Sofreír {verdura} picada con ajo y cebolla.",
        "Añadir {proteina} y dorar bien; incorporar tomate triturado y cocer 15 minutos.",
        "Hidratar o precocer {hidrato} según el fabricante.",
        "Montar capas alternando {hidrato}, el relleno y bechamel en una fuente.",
        "Cubrir con queso rallado y hornear a 200°C 20-25 minutos hasta gratinar."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "pollo-asado-horno",
      nombre_patron: "{proteina} asado al horno con {hidrato} y verduras",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 70,
      esfuerzo: "elaborado",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["pollo", "conejo"],
        hidrato: ["patata", "boniato"],
        verdura: ["pimiento", "zanahoria"]
      },
      kcal_extra: 100,
      pasos: [
        "Precalentar el horno a 190°C.",
        "Salpimentar {proteina} y colocar en la bandeja con {hidrato} y {verdura} cortados en trozos grandes.",
        "Regar con aceite de oliva y un chorrito de vino blanco o limón.",
        "Hornear 50-55 minutos, dando la vuelta a media cocción, hasta dorar.",
        "Dejar reposar 10 minutos antes de trinchar y servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "pescado-horno-limon",
      nombre_patron: "{proteina} al horno con limón y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["merluza", "lubina", "salmon", "bacalao"],
        hidrato: ["patata"],
        verdura: ["pimiento", "calabacin", "tomate"]
      },
      kcal_extra: 90,
      pasos: [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} en láminas finas y colocar de base en la bandeja con aceite.",
        "Añadir {verdura} y hornear 10 minutos antes de poner el pescado.",
        "Colocar {proteina} encima, salpimentar, rociar con limón y aceite.",
        "Hornear 15-18 minutos más hasta que el pescado esté hecho."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "verduras-horno-huevo",
      nombre_patron: "Verduras al horno con huevo",
      tipo: "plato-unico",
      apta: ["cena", "comida"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["huevo"],
        hidrato: ["patata", "boniato"],
        verdura: ["berenjena", "calabacin", "pimiento", "tomate"]
      },
      kcal_extra: 90,
      pasos: [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} y {verdura} en rodajas y colocar en la bandeja con aceite y sal.",
        "Hornear 25-30 minutos hasta que estén tiernas.",
        "Hacer un hueco y cascar {proteina} encima, u hornear los huevos aparte al gusto.",
        "Hornear 5-8 minutos más hasta cuajar la clara y servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "tortilla-patata",
      nombre_patron: "Tortilla de patata",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["huevo"],
        hidrato: ["patata"]
      },
      kcal_extra: 120,
      pasos: [
        "Pelar y cortar {hidrato} en láminas finas.",
        "Confitar {hidrato} en abundante aceite a fuego suave hasta que estén tiernas.",
        "Escurrir bien y mezclar con {proteina} batido y sal.",
        "Cuajar en sartén antiadherente por ambos lados al punto deseado.",
        "Dejar reposar unos minutos antes de cortar."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "tortilla-francesa-verdura",
      nombre_patron: "Tortilla francesa con {verdura}",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["huevo"],
        verdura: ["calabacin", "espinacas", "champinones", "pimiento"]
      },
      kcal_extra: 60,
      pasos: [
        "Saltear {verdura} en una sartén con un poco de aceite hasta que esté tierna.",
        "Batir {proteina} con una pizca de sal.",
        "Añadir {verdura} salteada al huevo batido y mezclar.",
        "Cuajar en la sartén por ambos lados y servir caliente."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "revuelto-champinones",
      nombre_patron: "Revuelto de huevo con {verdura}",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["huevo"],
        verdura: ["champinones", "espinacas", "calabacin"]
      },
      kcal_extra: 70,
      pasos: [
        "Saltear {verdura} con ajo en una sartén con aceite de oliva.",
        "Batir {proteina} ligeramente y añadir a la sartén.",
        "Remover a fuego suave hasta que cuaje cremoso, sin dejar secar.",
        "Servir enseguida con pan si se desea."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "crema-calabacin",
      nombre_patron: "Crema de calabacín",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["huevo", "queso-fresco"],
        hidrato: ["patata"],
        verdura: ["calabacin"]
      },
      kcal_extra: 60,
      pasos: [
        "Sofreír cebolla y puerro en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 15-18 minutos hasta que todo esté tierno.",
        "Triturar hasta obtener una crema fina y rectificar de sal.",
        "Servir con {proteina} picado o rallado por encima."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "crema-zanahoria",
      nombre_patron: "Crema de zanahoria",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["huevo", "queso-fresco"],
        hidrato: ["patata"],
        verdura: ["zanahoria"]
      },
      kcal_extra: 60,
      pasos: [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 18-20 minutos hasta que estén muy tiernas.",
        "Triturar hasta obtener una crema fina.",
        "Servir con {proteina} como topping."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, banco de fotos ampliado) — genérica, no coincide ingrediente a ingrediente
    },
    {
      id: "crema-verduras-variadas",
      nombre_patron: "Crema de {verdura}",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["huevo", "queso-fresco"],
        hidrato: ["patata"],
        verdura: ["calabaza", "puerro", "brocoli", "zanahoria"]
      },
      kcal_extra: 60,
      pasos: [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 20 minutos hasta que estén muy tiernas.",
        "Triturar hasta obtener una crema homogénea, ajustando de líquido si hace falta.",
        "Servir con {proteina} por encima."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "crema-calabaza-boniato",
      nombre_patron: "Crema de calabaza y boniato",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["huevo"],
        hidrato: ["boniato"],
        verdura: ["calabaza"]
      },
      kcal_extra: 60,
      pasos: [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 20 minutos hasta que estén tiernos.",
        "Triturar hasta obtener una crema fina y rectificar de sal.",
        "Servir con {proteina} picado por encima si se desea."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "ensalada-completa",
      nombre_patron: "Ensalada completa de {proteina} con {hidrato}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["atun", "huevo", "pollo", "queso-feta", "garbanzos"],
        hidrato: ["patata", "arroz", "pasta", "cuscus"],
        verdura: ["lechuga", "tomate", "pimiento", "zanahoria"]
      },
      kcal_extra: 80,
      pasos: [
        "Cocer {hidrato} y dejar enfriar.",
        "Lavar y cortar {verdura} en trozos pequeños.",
        "Preparar {proteina} (cocer, cocinar a la plancha o escurrir según el caso).",
        "Mezclar todo en una fuente grande y aliñar con aceite, vinagre y sal.",
        "Servir templado o frío."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "ensalada-pasta",
      nombre_patron: "Ensalada de pasta con {proteina} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["atun", "pollo", "queso-feta", "huevo"],
        hidrato: ["pasta"],
        verdura: ["tomate", "pimiento", "zanahoria"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer {hidrato} al dente, escurrir y enfriar bajo el grifo.",
        "Cortar {verdura} en trozos pequeños.",
        "Preparar {proteina} y añadir a la pasta.",
        "Mezclar todo con {verdura} y aliñar con aceite de oliva y sal.",
        "Dejar reposar en la nevera 10 minutos antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "ensalada-garbanzos",
      nombre_patron: "Ensalada de garbanzos con {verdura}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["garbanzos"],
        hidrato: ["garbanzos"],
        verdura: ["tomate", "pimiento", "pepino"]
      },
      kcal_extra: 60,
      pasos: [
        "Escurrir y enjuagar los garbanzos cocidos.",
        "Cortar {verdura} en dados pequeños.",
        "Mezclar los garbanzos con {verdura} en una fuente.",
        "Aliñar con aceite de oliva, vinagre y sal.",
        "Dejar reposar 10 minutos para que se integren los sabores."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "ensalada-lentejas",
      nombre_patron: "Ensalada de lentejas con {verdura}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["lentejas"],
        hidrato: ["lentejas"],
        verdura: ["tomate", "pimiento", "zanahoria"]
      },
      kcal_extra: 60,
      pasos: [
        "Escurrir las lentejas cocidas.",
        "Cortar {verdura} en dados pequeños.",
        "Mezclar las lentejas con {verdura}.",
        "Aliñar con aceite de oliva, vinagre y sal.",
        "Servir a temperatura ambiente o fría."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, banco de fotos ampliado) — genérica, no coincide ingrediente a ingrediente
    },
    {
      id: "ensalada-cesar-casera",
      nombre_patron: "Ensalada César casera con {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["pollo", "huevo"],
        hidrato: ["pan-integral"],
        verdura: ["lechuga"]
      },
      kcal_extra: 100,
      pasos: [
        "Cortar {hidrato} en dados y tostar en la sartén o el horno para hacer picatostes.",
        "Cocinar {proteina} a la plancha y cortar en tiras o dados.",
        "Lavar y trocear {verdura}.",
        "Mezclar {verdura}, {proteina} y los picatostes.",
        "Aliñar con una salsa ligera de yogur o mostaza y aceite, y queso rallado por encima."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "quinoa-ensalada",
      nombre_patron: "Ensalada de quinoa con {proteina} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["atun", "pollo", "huevo", "garbanzos"],
        hidrato: ["quinoa"],
        verdura: ["tomate", "pimiento", "pepino"]
      },
      kcal_extra: 80,
      pasos: [
        "Cocer {hidrato} según el envase y dejar enfriar.",
        "Cortar {verdura} en dados pequeños.",
        "Preparar {proteina} y desmenuzar o trocear.",
        "Mezclar todo en una fuente y aliñar con aceite de oliva, limón y sal.",
        "Servir fría o templada."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "merluza-salsa-verde",
      nombre_patron: "{proteina} en salsa verde con {verdura}",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      region: "euskadi",
      ejes: {
        proteina: ["merluza", "bacalao"],
        hidrato: ["patata"],
        verdura: ["guisantes", "judias-verdes"]
      },
      kcal_extra: 90,
      pasos: [
        "Sofreír ajo picado en una cazuela con aceite de oliva.",
        "Añadir un poco de harina, rehogar y mojar con caldo y perejil picado.",
        "Incorporar {hidrato} cortada en trozos y cocer 10 minutos.",
        "Añadir {proteina} y {verdura}, cocinar 8-10 minutos moviendo la cazuela suavemente.",
        "Servir bien caliente con la salsa verde."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "salmon-salsa",
      nombre_patron: "Salmón en salsa con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["salmon"],
        hidrato: ["patata", "arroz"],
        verdura: ["espinacas", "brocoli"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer o saltear {hidrato}.",
        "Saltear {verdura} en una sartén con un poco de aceite.",
        "Marcar el salmón a la plancha por ambos lados.",
        "Preparar una salsa ligera con un poco de nata o caldo y hierbas.",
        "Servir el salmón napado con la salsa junto a {hidrato} y {verdura}."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "bacalao-tomate",
      nombre_patron: "{proteina} con tomate y {verdura}",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["bacalao", "merluza"],
        hidrato: ["patata"],
        verdura: ["pimiento", "tomate"]
      },
      kcal_extra: 90,
      pasos: [
        "Sofreír ajo y {verdura} en una sartén con aceite de oliva.",
        "Añadir tomate triturado y cocer 15 minutos a fuego suave.",
        "Cocer {hidrato} aparte y reservar.",
        "Añadir {proteina} a la salsa y cocinar 6-8 minutos hasta que esté hecho.",
        "Servir con {hidrato} de acompañamiento."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "marmitako-atun",
      nombre_patron: "Marmitako de atún y patata",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      temporada: "verano",
      region: "euskadi",
      ejes: {
        proteina: ["atun"],
        hidrato: ["patata"],
        verdura: ["pimiento", "tomate"]
      },
      kcal_extra: 90,
      pasos: [
        "Sofreír ajo, cebolla y {verdura} en una olla con aceite de oliva.",
        "Añadir {hidrato} cascada en trozos irregulares (para que suelte almidón) y rehogar.",
        "Cubrir con caldo o fumet y cocer 20 minutos hasta que la patata esté tierna.",
        "Añadir {proteina} en dados y cocinar 4-5 minutos, apagando el fuego para que se haga con el calor residual.",
        "Dejar reposar unos minutos antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "pescaditos-plancha",
      nombre_patron: "{proteina} a la plancha con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: false,
      temporada: "verano",
      ejes: {
        proteina: ["sardinas", "boquerones"],
        hidrato: ["patata"],
        verdura: ["pimiento", "tomate", "lechuga"]
      },
      kcal_extra: 70,
      pasos: [
        "Limpiar {proteina} si no vienen ya limpios.",
        "Cocer o asar {hidrato}.",
        "Preparar {verdura} en crudo tipo ensalada sencilla.",
        "Hacer {proteina} a la plancha con un poco de aceite y sal, vuelta y vuelta.",
        "Servir con {hidrato} y {verdura} de acompañamiento."
      ],
      notas: "Espinas pequeñas: revisar bien si lo va a comer un niño pequeño.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "gallo-plancha",
      nombre_patron: "Filetes de gallo a la plancha con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["gallo"],
        hidrato: ["patata", "arroz"],
        verdura: ["judias-verdes", "zanahoria"]
      },
      kcal_extra: 70,
      pasos: [
        "Cocer o saltear {hidrato}.",
        "Cocer al vapor o saltear {verdura}.",
        "Salpimentar los filetes de gallo.",
        "Hacer a la plancha 1-2 minutos por lado, son filetes finos y se hacen rápido.",
        "Servir enseguida con {hidrato} y {verdura}."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "gambas-ajillo",
      nombre_patron: "Gambas al ajillo con {hidrato}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["gambas"],
        hidrato: ["arroz", "pan-integral"]
      },
      kcal_extra: 90,
      pasos: [
        "Preparar {hidrato} como acompañamiento.",
        "Calentar aceite de oliva con ajo laminado en una cazuela de barro o sartén.",
        "Añadir las gambas cuando el ajo empiece a dorarse.",
        "Saltear 2-3 minutos hasta que las gambas cambien de color, sin pasarse de fuego.",
        "Servir muy caliente con {hidrato}."
      ],
      notas: "Omitir la guindilla para que sea apto para niños.",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "mejillones-marinera",
      nombre_patron: "Mejillones a la marinera con {hidrato}",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: false,
      ejes: {
        proteina: ["mejillones"],
        hidrato: ["pan-integral", "arroz"],
        verdura: ["tomate"]
      },
      kcal_extra: 80,
      pasos: [
        "Limpiar bien los mejillones, retirando barbas e impurezas.",
        "Sofreír ajo y cebolla, añadir {verdura} triturado y cocer 10 minutos.",
        "Añadir un chorrito de vino blanco y dejar reducir.",
        "Incorporar los mejillones y tapar hasta que se abran, unos 5-6 minutos.",
        "Servir con {hidrato} para mojar en la salsa."
      ],
      notas: "Descartar los mejillones que no se abran al cocinar.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "empanadillas-caseras",
      nombre_patron: "Empanadillas caseras de {proteina}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["atun", "pollo", "ternera-picada", "espinacas-queso"],
        hidrato: ["masa-empanadilla"]
      },
      kcal_extra: 60,
      pasos: [
        "Preparar el relleno de {proteina} con tomate frito y un sofrito de cebolla.",
        "Extender los discos de {hidrato} sobre una superficie limpia.",
        "Rellenar cada disco con una cucharada del relleno y cerrar sellando los bordes con un tenedor.",
        "Pintar con huevo batido si se van a hornear.",
        "Hornear a 200°C 15-18 minutos hasta dorar, u freír en aceite caliente."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "wrap-casero",
      nombre_patron: "Wrap casero de {proteina} con {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["pollo", "atun", "huevo", "hummus"],
        hidrato: ["tortilla-trigo"],
        verdura: ["lechuga", "tomate", "pimiento"]
      },
      kcal_extra: 60,
      pasos: [
        "Preparar {proteina} (a la plancha, cocido o directamente si es hummus).",
        "Cortar {verdura} en tiras finas.",
        "Calentar ligeramente {hidrato} para que sea más flexible.",
        "Rellenar con {proteina} y {verdura}.",
        "Enrollar apretando bien y cortar por la mitad para servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "hummus-plato",
      nombre_patron: "Plato de hummus con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 10,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["hummus"],
        hidrato: ["pan-integral", "pan-pita"],
        verdura: ["zanahoria", "pepino", "pimiento"]
      },
      kcal_extra: 50,
      pasos: [
        "Cortar {verdura} en bastones para mojar.",
        "Calentar ligeramente {hidrato} si se desea.",
        "Servir el hummus en un plato con un chorrito de aceite de oliva por encima.",
        "Acompañar con {hidrato} y {verdura} en bastones."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "tofu-plancha-verduras",
      nombre_patron: "Tofu a la plancha con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: false,
      ejes: {
        proteina: ["tofu"],
        hidrato: ["arroz", "quinoa", "cuscus"],
        verdura: ["brocoli", "calabacin", "pimiento", "champinones"]
      },
      kcal_extra: 80,
      pasos: [
        "Escurrir bien el tofu y cortar en dados o filetes.",
        "Cocer {hidrato} según el envase.",
        "Saltear {verdura} en una sartén con un poco de aceite.",
        "Marcar el tofu a la plancha hasta que quede dorado por fuera.",
        "Servir todo junto con un chorrito de salsa de soja."
      ],
      notas: "Sazonar suave (poca salsa de soja) para que resulte más amable a los niños.",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "salteado-wok",
      nombre_patron: "Salteado de {proteina} con {verdura} y {hidrato}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["pollo", "gambas", "tofu", "ternera", "edamame"],
        hidrato: ["arroz", "fideos"],
        verdura: ["pimiento", "calabacin", "brocoli", "zanahoria", "champinones"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer {hidrato} y reservar.",
        "Cortar {verdura} en tiras o dados pequeños para que se hagan rápido.",
        "Saltear {proteina} a fuego fuerte en wok o sartén amplia con un poco de aceite.",
        "Añadir {verdura} y saltear 3-4 minutos sin dejar que se ablanden del todo.",
        "Incorporar {hidrato}, un chorrito de salsa de soja y saltear todo junto 1-2 minutos."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // piloto 2026-07-13 (Roger) — foto real de edamame+zanahoria+fideos; genérica para el resto de combinaciones del eje
    },
    {
      id: "hamburguesa-casera",
      nombre_patron: "Hamburguesa casera de {proteina} con {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["ternera-picada", "pavo"],
        hidrato: ["pan-hamburguesa"],
        verdura: ["lechuga", "tomate"]
      },
      kcal_extra: 90,
      pasos: [
        "Mezclar {proteina} con sal, pimienta y un poco de ajo picado, formar hamburguesas.",
        "Tostar ligeramente {hidrato} por dentro en la sartén o plancha.",
        "Hacer las hamburguesas a la plancha 3-4 minutos por lado.",
        "Lavar y cortar {verdura}.",
        "Montar la hamburguesa con {hidrato}, {verdura} y la carne."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "pizza-casera",
      nombre_patron: "Pizza casera de {proteina} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["pollo", "atun", "queso-feta"],
        hidrato: ["masa-pizza"],
        verdura: ["champinones", "pimiento", "tomate", "calabacin"]
      },
      kcal_extra: 130,
      pasos: [
        "Precalentar el horno a la temperatura máxima con la bandeja dentro.",
        "Estirar {hidrato} sobre papel de horno.",
        "Cubrir con salsa de tomate, {proteina} y {verdura} troceada.",
        "Añadir queso rallado por encima.",
        "Hornear 10-12 minutos hasta que el borde esté dorado y el queso fundido."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "sopa-fideos",
      nombre_patron: "Sopa de fideos con verduras",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["huevo"],
        hidrato: ["fideos"],
        verdura: ["zanahoria", "puerro", "judias-verdes"]
      },
      kcal_extra: 40,
      pasos: [
        "Poner a hervir un buen caldo de verduras o pollo.",
        "Añadir {verdura} cortada muy fina y cocer 10 minutos.",
        "Incorporar {hidrato} y cocer 5-6 minutos más.",
        "Añadir {proteina} batido en forma de hilos removiendo el caldo (huevo hilado), opcional.",
        "Servir bien caliente."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "menestra-verduras",
      nombre_patron: "Menestra de verduras con {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: false,
      ejes: {
        proteina: ["huevo", "pollo"],
        verdura: ["judias-verdes", "zanahoria", "guisantes", "alcachofa", "coliflor"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer o blanquear cada {verdura} por separado hasta que estén tiernas.",
        "Sofreír ajo en una sartén con aceite de oliva.",
        "Añadir {verdura} cocida y rehogar 5 minutos para que coja sabor.",
        "Preparar {proteina} (huevo duro cortado o pollo a la plancha) como acompañamiento.",
        "Servir la menestra con {proteina} por encima o al lado."
      ],
      notas: "Combinación de sabores variados: algunos niños la resisten mejor si las verduras se sirven por separado.",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "garbanzos-espinacas",
      nombre_patron: "Garbanzos con espinacas y {proteina}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["huevo", "bacalao"],
        hidrato: ["garbanzos"],
        verdura: ["espinacas"]
      },
      kcal_extra: 90,
      pasos: [
        "Sofreír ajo en una sartén con aceite de oliva hasta dorar.",
        "Añadir {verdura} y rehogar hasta que reduzca.",
        "Incorporar los garbanzos cocidos y un poco de caldo, cocer 10 minutos.",
        "Añadir {proteina} (huevo escalfado o bacalao en trozos) y cocinar unos minutos más.",
        "Servir bien caliente."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "albondigas-salsa",
      nombre_patron: "Albóndigas de {proteina} en salsa con {hidrato}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["ternera-picada", "pavo"],
        hidrato: ["arroz", "patata", "pasta"],
        verdura: ["tomate"]
      },
      kcal_extra: 100,
      pasos: [
        "Mezclar {proteina} con pan remojado en leche, ajo y perejil picado; formar bolas.",
        "Enharinar ligeramente y dorar las albóndigas en una sartén con aceite.",
        "Preparar una salsa con {verdura} triturado, cebolla y un poco de caldo.",
        "Cocer las albóndigas en la salsa 15-20 minutos a fuego suave.",
        "Servir con {hidrato} de acompañamiento."
      ],
      notas: "",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "patatas-guisadas",
      nombre_patron: "Patatas guisadas con {proteina} y verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      ejes: {
        proteina: ["pollo", "ternera", "cerdo"],
        hidrato: ["patata"],
        verdura: ["zanahoria", "guisantes", "pimiento"]
      },
      kcal_extra: 90,
      pasos: [
        "Dorar {proteina} en una olla con aceite de oliva.",
        "Añadir {verdura} y rehogar unos minutos.",
        "Incorporar {hidrato} cascada en trozos irregulares.",
        "Cubrir con caldo y cocer a fuego medio 25-30 minutos hasta que todo esté tierno.",
        "Rectificar de sal y dejar reposar antes de servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    {
      id: "coliflor-gratinada",
      nombre_patron: "Coliflor gratinada con {proteina}",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: false,
      temporada: "invierno",
      ejes: {
        proteina: ["huevo", "queso-fresco"],
        hidrato: ["patata"],
        verdura: ["coliflor"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer {verdura} y {hidrato} en agua con sal hasta que estén tiernos.",
        "Escurrir bien y colocar en una fuente apta para horno.",
        "Preparar una bechamel ligera y cubrir las verduras.",
        "Añadir {proteina} rallado o picado por encima.",
        "Gratinar en el horno 8-10 minutos hasta dorar."
      ],
      notas: "Sabor fuerte de la coliflor: no siempre triunfa entre los más pequeños.",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación random 2026-07-14 (Roger, cobertura total del banco) — no coincide ingrediente a ingrediente
    },
    // ================================================================
    // Tramo 1 — ampliación regional/estacional (2026-07-17)
    // Research y curación: 01_Research/2026-07-17_RESEARCH_BANCO_AMPLIACION.md
    // ================================================================
    {
      id: "gazpacho-andaluz",
      nombre_patron: "Gazpacho andaluz con huevo picado",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      region: "andalucia",
      ejes: {
        proteina: ["huevo"],
        hidrato: ["pan"],
        verdura: ["tomate"]
      },
      kcal_extra: 90,
      pasos: [
        "Remojar el pan en agua unos minutos.",
        "Triturar el tomate maduro con el pan, un diente de ajo, aceite de oliva y un chorrito de vinagre (si tienes medio pimiento o pepino, añádelos).",
        "Colar si se quiere más fino y enfriar en la nevera al menos 30 minutos.",
        "Cocer el huevo 10 minutos, picarlo y servirlo por encima."
      ],
      notas: "Servir bien frío. El huevo picado lo convierte en cena completa.",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "salmorejo-cordobes",
      nombre_patron: "Salmorejo cordobés con huevo",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      region: "andalucia",
      ejes: {
        proteina: ["huevo"],
        hidrato: ["pan"],
        verdura: ["tomate"]
      },
      kcal_extra: 110,
      pasos: [
        "Remojar pan abundante en agua.",
        "Triturar el tomate con el pan, un diente de ajo pequeño y aceite de oliva hasta que quede una crema espesa y lisa.",
        "Enfriar en la nevera al menos 30 minutos.",
        "Servir con huevo duro picado por encima (y virutas de jamón serrano si tienes)."
      ],
      notas: "Más espeso que el gazpacho — se come con cuchara.",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "pisto-manchego",
      nombre_patron: "Pisto manchego con {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
      temporada: "verano",
      region: "castilla",
      ejes: {
        proteina: ["huevo", "atun"],
        hidrato: ["pan"],
        verdura: ["calabacin", "berenjena", "pimiento"]
      },
      kcal_extra: 110,
      pasos: [
        "Sofreír cebolla y ajo picados en aceite de oliva.",
        "Añadir {verdura} en dados pequeños y rehogar 10 minutos.",
        "Incorporar tomate triturado y cocinar 15 minutos a fuego medio hasta que pierda el agua.",
        "Rematar con {proteina} (huevo frito o escalfado encima, o atún integrado).",
        "Servir con pan."
      ],
      notas: "La base es el sofrito de tomate — añade tomate triturado a tu compra si no tienes.",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "croquetas-caseras",
      nombre_patron: "Croquetas caseras de {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      ejes: {
        proteina: ["jamon-serrano", "pollo", "champinones"],
        hidrato: ["bechamel"]
      },
      kcal_extra: 130,
      pasos: [
        "Hacer una bechamel espesa: mantequilla, harina y leche, removiendo 8-10 minutos.",
        "Picar muy fino {proteina} e integrarlo en la bechamel; salpimentar.",
        "Enfriar la masa en la nevera (mínimo 2 horas, mejor de víspera).",
        "Formar las croquetas y pasarlas por huevo y pan rallado.",
        "Freír en aceite caliente hasta dorar (o al horno/airfryer con un hilo de aceite)."
      ],
      notas: "El tiempo no cuenta el enfriado de la masa. Huevo y pan rallado de despensa.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "fideua",
      nombre_patron: "Fideuà de {proteina}",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      region: "comunidad-valenciana",
      ejes: {
        proteina: ["gambas", "gallo"],
        hidrato: ["fideos"],
        verdura: ["tomate", "pimiento"]
      },
      kcal_extra: 130,
      pasos: [
        "Sofreír {proteina} en la paellera o sartén amplia y reservar.",
        "En el mismo aceite, hacer un sofrito con ajo y {verdura}.",
        "Tostar los fideos 2 minutos en el sofrito.",
        "Cubrir con caldo caliente y cocer 8-10 minutos sin remover.",
        "Devolver {proteina}, apagar y reposar 3 minutos."
      ],
      notas: "Caldo de pescado si tienes; agua con una pastilla también vale.",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "pollo-al-chilindron",
      nombre_patron: "Pollo al chilindrón",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      region: "aragon",
      ejes: {
        proteina: ["pollo"],
        hidrato: ["patata", "pan"],
        verdura: ["pimiento", "tomate"]
      },
      kcal_extra: 100,
      pasos: [
        "Dorar el pollo troceado y salpimentado; reservar.",
        "En el mismo aceite, sofreír cebolla, ajo y {verdura} en tiras.",
        "Devolver el pollo, mojar con medio vaso de agua (o vino blanco) y guisar tapado 20-25 minutos.",
        "Servir con {hidrato}."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "pochas-con-chorizo",
      nombre_patron: "Pochas guisadas con chorizo",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      region: "navarra-rioja",
      ejes: {
        proteina: ["chorizo"],
        hidrato: ["alubias-blancas"],
        verdura: ["pimiento", "zanahoria"]
      },
      kcal_extra: 80,
      pasos: [
        "Sofreír cebolla, ajo y {verdura} picadas en la cazuela.",
        "Añadir el chorizo en rodajas y dar unas vueltas.",
        "Incorporar las pochas (o alubias cocidas) y cubrir justo de agua.",
        "Cocer suave 15-20 minutos moviendo la cazuela, sin remover con cuchara.",
        "Reposar unos minutos antes de servir."
      ],
      notas: "Con pochas frescas (agosto-octubre) es otro nivel; con bote funciona igual.",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "fabada-asturiana",
      nombre_patron: "Fabada asturiana",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 90,
      esfuerzo: "elaborado",
      ninos: true,
      temporada: "invierno",
      region: "asturias",
      ejes: {
        proteina: ["compango"],
        hidrato: ["alubias-blancas"]
      },
      kcal_extra: 60,
      pasos: [
        "Si las fabes son secas, remojo de la víspera (con bote, saltar este paso).",
        "Poner las fabes cubiertas de agua fría con el compango entero.",
        "Llevar a hervor, espumar y cocer a fuego muy suave 1h30 (bote: 40 minutos), moviendo la olla de vez en cuando, sin remover.",
        "\"Asustar\" con un chorrito de agua fría un par de veces durante la cocción.",
        "Reposar 10 minutos, trocear el compango y servir."
      ],
      notas: "De finde. Con alubia cocida de bote se queda en ~45 minutos.",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "cachopo",
      nombre_patron: "Cachopo de ternera con jamón y queso",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 50,
      esfuerzo: "elaborado",
      ninos: true,
      region: "asturias",
      ejes: {
        proteina: ["ternera-rellena"],
        hidrato: ["patata"],
        verdura: ["pimiento", "lechuga"]
      },
      kcal_extra: 150,
      pasos: [
        "Salpimentar dos filetes finos de ternera por cachopo.",
        "Montar jamón y queso entre los dos filetes y sellar bien los bordes.",
        "Empanar: harina, huevo batido y pan rallado.",
        "Freír en aceite caliente 3-4 minutos por cara hasta dorar; escurrir sobre papel.",
        "Acompañar con {hidrato} y {verdura}."
      ],
      notas: "Ración generosa — un cachopo grande da para dos. Harina, huevo y pan rallado de despensa.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "empanada-gallega",
      nombre_patron: "Empanada gallega de atún",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
      region: "galicia",
      ejes: {
        proteina: ["atun"],
        hidrato: ["masa-empanadilla"],
        verdura: ["pimiento", "tomate"]
      },
      kcal_extra: 100,
      pasos: [
        "Hacer un sofrito lento de cebolla abundante y {verdura}.",
        "Mezclar el sofrito con el atún desmigado.",
        "Extender una lámina de masa, repartir el relleno y cubrir con la otra lámina, sellando los bordes.",
        "Pintar con huevo batido y pinchar el centro.",
        "Hornear 30-35 minutos a 180°C hasta dorar."
      ],
      notas: "Vale masa de empanada comprada (formato grande de la de empanadillas).",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "porrusalda-con-bacalao",
      nombre_patron: "Porrusalda con bacalao",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "invierno",
      region: "euskadi",
      ejes: {
        proteina: ["bacalao"],
        hidrato: ["patata"],
        verdura: ["puerro"]
      },
      kcal_extra: 60,
      pasos: [
        "Rehogar el puerro en rodajas con un poco de aceite.",
        "Añadir la patata en trozos cascados (no cortados del todo, para que suelte fécula).",
        "Cubrir con agua o caldo y cocer 15 minutos.",
        "Añadir el bacalao desmigado, cocer 5 minutos más y servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "piperrada-con-huevo",
      nombre_patron: "Piperrada con huevo",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      region: "euskadi",
      ejes: {
        proteina: ["huevo"],
        hidrato: ["pan"],
        verdura: ["pimiento"]
      },
      kcal_extra: 80,
      pasos: [
        "Sofreír cebolla y el pimiento en tiras a fuego medio hasta que estén muy tiernos.",
        "Añadir tomate rallado y reducir 10 minutos.",
        "Hacer los huevos encima (escalfados en la propia salsa o a la plancha).",
        "Servir con pan."
      ],
      notas: "Con virutas de jamón por encima gana (opcional).",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "zarangollo",
      nombre_patron: "Zarangollo murciano de calabacín",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      region: "murcia",
      ejes: {
        proteina: ["huevo"],
        verdura: ["calabacin"]
      },
      kcal_extra: 60,
      pasos: [
        "Pochar cebolla picada en aceite de oliva.",
        "Añadir el calabacín en medias lunas finas y hacer a fuego medio hasta muy tierno.",
        "Batir los huevos, añadirlos y cuajar removiendo suave — queda cremoso, no tortilla.",
        "Salpimentar y servir."
      ],
      notas: "",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "ensalada-murciana",
      nombre_patron: "Ensalada murciana de tomate y {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      region: "murcia",
      ejes: {
        proteina: ["atun", "huevo"],
        hidrato: ["pan"],
        verdura: ["tomate"]
      },
      kcal_extra: 70,
      pasos: [
        "Escurrir y trocear el tomate (pelado en conserva, la versión clásica) en un bol.",
        "Añadir {proteina} y cebolla tierna picada.",
        "Aliñar con aceite de oliva y sal (un puñado de aceitunas negras si tienes).",
        "Servir fría con pan."
      ],
      notas: "Con tomate entero pelado de bote es la receta clásica del moje.",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "fricando-de-ternera",
      nombre_patron: "Fricandó de ternera con setas",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 80,
      esfuerzo: "elaborado",
      ninos: true,
      temporada: "invierno",
      region: "cataluna",
      ejes: {
        proteina: ["ternera"],
        hidrato: ["patata", "pan"],
        verdura: ["champinones"]
      },
      kcal_extra: 100,
      pasos: [
        "Enharinar filetes finos de ternera y dorarlos; reservar.",
        "Hacer un sofrito lento de cebolla y tomate rallado.",
        "Devolver la carne con las setas y cubrir con caldo.",
        "Guisar tapado 45-60 minutos hasta que la carne esté melosa.",
        "Servir con {hidrato}."
      ],
      notas: "De finde. Con setas de temporada (rovellons) gana mucho.",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "tumbet-mallorquin",
      nombre_patron: "Tumbet mallorquín con {proteina}",
      tipo: "plantilla",
      apta: ["cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      temporada: "verano",
      region: "baleares",
      ejes: {
        proteina: ["huevo", "bacalao"],
        hidrato: ["patata"],
        verdura: ["berenjena", "calabacin"]
      },
      kcal_extra: 120,
      pasos: [
        "Freír la patata en rodajas y colocarla de base en una fuente.",
        "Freír {verdura} en rodajas y montar capas encima.",
        "Cubrir con salsa de tomate.",
        "Hornear 10 minutos para asentar.",
        "Rematar con {proteina} (huevo frito o bacalao a la plancha)."
      ],
      notas: "Salsa de tomate frito casera o comprada — añádela a la compra.",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "papas-arrugadas-con-mojo",
      nombre_patron: "Papas arrugadas con mojo rojo y {proteina}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      region: "canarias",
      ejes: {
        proteina: ["huevo", "merluza"],
        hidrato: ["patata"],
        verdura: ["pimiento"]
      },
      kcal_extra: 90,
      pasos: [
        "Cocer papas pequeñas con piel en agua muy salada hasta que estén tiernas.",
        "Escurrir y secar al fuego un par de minutos hasta que la piel se arrugue.",
        "Mojo rojo: triturar el pimiento con ajo, pimentón, comino, vinagre y aceite.",
        "Hacer {proteina} (huevo duro o merluza a la plancha).",
        "Servir todo junto, con el mojo por encima de las papas."
      ],
      notas: "",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "ropa-vieja-canaria",
      nombre_patron: "Ropa vieja canaria de {proteina}",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      region: "canarias",
      ejes: {
        proteina: ["pollo", "cerdo"],
        hidrato: ["garbanzos"],
        verdura: ["pimiento", "tomate"]
      },
      kcal_extra: 110,
      pasos: [
        "Dorar {proteina} en tiras o desmenuzada.",
        "Sofreír cebolla, ajo y {verdura}.",
        "Añadir los garbanzos cocidos y un toque de pimentón.",
        "Saltear todo junto 10 minutos (con patata frita en dados si quieres la versión completa).",
        "Rectificar de sal y servir."
      ],
      notas: "Plato de aprovechamiento: perfecto con restos de pollo asado del finde.",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "atascaburras",
      nombre_patron: "Atascaburras de bacalao y patata",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      region: "castilla",
      ejes: {
        proteina: ["bacalao"],
        hidrato: ["patata"]
      },
      kcal_extra: 120,
      pasos: [
        "Cocer la patata y, los últimos 5 minutos, el bacalao desalado.",
        "Machacar la patata con ajo y el bacalao desmigado.",
        "Ligar con aceite de oliva a hilo fino hasta conseguir un puré meloso.",
        "Probar de sal y servir templado, con huevo duro en rodajas y nueces si tienes."
      ],
      notas: "",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "sopa-castellana",
      nombre_patron: "Sopa castellana de ajo con huevo",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "invierno",
      region: "castilla",
      ejes: {
        proteina: ["huevo"],
        hidrato: ["pan"]
      },
      kcal_extra: 70,
      pasos: [
        "Dorar láminas de ajo en aceite de oliva en una cazuela.",
        "Añadir pimentón, remover y echar el pan en láminas finas.",
        "Mojar con caldo o agua y hervir 10 minutos.",
        "Escalfar los huevos dentro 3-4 minutos y servir muy caliente."
      ],
      notas: "Con taquitos de jamón, mejor (opcional).",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "migas-extremenas",
      nombre_patron: "Migas extremeñas con {proteina}",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      region: "extremadura",
      ejes: {
        proteina: ["panceta", "chorizo"],
        hidrato: ["pan"],
        verdura: ["pimiento"]
      },
      kcal_extra: 110,
      pasos: [
        "La víspera, trocear el pan asentado y humedecerlo con agua y un paño.",
        "Freír {proteina} en trozos y reservar.",
        "En esa misma grasa, dorar ajos enteros y el pimiento en tiras.",
        "Añadir el pan y mover sin parar 15-20 minutos hasta que queden migas sueltas.",
        "Devolver {proteina}, mezclar y servir."
      ],
      notas: "El pan tiene que ser del día anterior.",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "bonito-encebollado",
      nombre_patron: "Bonito encebollado",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["bonito"],
        hidrato: ["pan", "patata"],
        verdura: ["pimiento"]
      },
      kcal_extra: 80,
      pasos: [
        "Pochar cebolla abundante en juliana a fuego suave 15 minutos.",
        "Añadir el pimiento en tiras y hacer 5 minutos más.",
        "Subir el fuego y añadir el bonito en tacos, vuelta y vuelta — que quede jugoso.",
        "Un chorrito de vinagre o vino blanco, mezclar y servir con {hidrato}."
      ],
      notas: "La cebolla es la clave: abundante y bien pochada. Temporada de bonito: junio-septiembre.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "salpicon-de-pollo",
      nombre_patron: "Salpicón de pollo con verduras",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      temporada: "verano",
      ejes: {
        proteina: ["pollo"],
        hidrato: ["patata"],
        verdura: ["tomate", "pimiento", "pepino"]
      },
      kcal_extra: 70,
      pasos: [
        "Cocer el pollo (o aprovechar restos de asado) y desmenuzarlo.",
        "Cocer la patata en dados hasta que esté tierna.",
        "Picar {verdura} fina.",
        "Mezclar todo con una vinagreta de aceite, vinagre y sal.",
        "Enfriar 15 minutos en la nevera y servir frío."
      ],
      notas: "Ideal con sobras de pollo del finde.",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "olleta-alicantina",
      nombre_patron: "Olleta alicantina de legumbres y arroz",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
      temporada: "invierno",
      region: "comunidad-valenciana",
      ejes: {
        proteina: ["legumbres-variadas"],
        hidrato: ["arroz"],
        verdura: ["calabaza", "acelgas"]
      },
      kcal_extra: 90,
      pasos: [
        "Sofreír cebolla, ajo y una cucharadita de pimentón.",
        "Añadir {verdura} troceada y rehogar unos minutos.",
        "Incorporar las legumbres cocidas y cubrir con agua o caldo.",
        "Añadir un puñado de arroz y cocer 15-18 minutos.",
        "Reposar 5 minutos antes de servir."
      ],
      notas: "Versión rápida con legumbre de bote; la tradicional es de cocción larga.",
      foto: "assets/banco-fotos/crema-zanahoria.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "soldaditos-de-pavia",
      nombre_patron: "Soldaditos de Pavía (bacalao rebozado)",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      region: "madrid",
      ejes: {
        proteina: ["bacalao"],
        hidrato: ["pan"],
        verdura: ["pimiento"]
      },
      kcal_extra: 130,
      pasos: [
        "Cortar el bacalao desalado en tiras y secarlas bien.",
        "Rebozar en harina y huevo batido (o gabardina con un poco de levadura).",
        "Freír en aceite bien caliente hasta dorar.",
        "Escurrir sobre papel y servir con tiras de pimiento asado y pan."
      ],
      notas: "Harina y huevo de despensa. Formato palitos: triunfa con los niños.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "merluza-a-la-sidra",
      nombre_patron: "{proteina} a la sidra",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
      region: "asturias",
      ejes: {
        proteina: ["merluza", "gallo"],
        hidrato: ["patata"],
        verdura: ["puerro"]
      },
      kcal_extra: 90,
      pasos: [
        "Dorar la patata en rodajas finas y el puerro en una cazuela amplia.",
        "Colocar {proteina} encima y salpimentar.",
        "Regar con un buen vaso de sidra natural.",
        "Cocer tapado 8-10 minutos hasta que el pescado esté jugoso.",
        "Servir con el jugo de la cazuela."
      ],
      notas: "Añade una botella pequeña de sidra natural a la compra.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "trucha-a-la-navarra",
      nombre_patron: "Trucha a la navarra con jamón",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      region: "navarra-rioja",
      ejes: {
        proteina: ["trucha"],
        hidrato: ["patata"]
      },
      kcal_extra: 100,
      pasos: [
        "Limpiar las truchas abiertas y salpimentar.",
        "Rellenar cada una con un par de lonchas de jamón serrano.",
        "Enharinar ligero y freír 3-4 minutos por lado.",
        "Acompañar con {hidrato} cocida o panadera."
      ],
      notas: "Añade unas lonchas de jamón serrano a la compra.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    // ---- Huecos del Top 15 real de hogares españoles (MAPA/Kantar, Panel de Usos) ----
    // Research → 01_Research/2026-07-17_RESEARCH_PLATOS_HOGAR_REPERTORIO.md §1: el banco cubría
    // 13 de las 15 recetas más cocinadas de España; estas dos eran los huecos. Cero ingredientes
    // nuevos — son de los platos más comunes del país, no exotismo.
    {
      id: "huevos-fritos-con-patatas",
      nombre_patron: "Huevos fritos con patatas",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["huevo"],
        hidrato: ["patata"]
      },
      kcal_extra: 140,
      pasos: [
        "Cortar la patata en bastones o rodajas finas y salar.",
        "Freír la patata en aceite abundante a fuego medio hasta que esté tierna; subir el fuego al final para dorarla y escurrir sobre papel.",
        "En el mismo aceite bien caliente, freír los huevos de uno en uno regando la yema con la puntilla hecha.",
        "Servir los huevos sobre las patatas y romper la yema en la mesa."
      ],
      notas: "El #12 de España (MAPA). Un huevo por niño, dos por adulto.",
      foto: "assets/banco-fotos/plancha-guarnicion.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    {
      id: "judias-verdes-con-patatas",
      nombre_patron: "Judías verdes con patatas",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["huevo"],
        hidrato: ["patata"],
        verdura: ["judias-verdes"]
      },
      kcal_extra: 80,
      pasos: [
        "Quitar las puntas y los hilos de las judías y trocearlas.",
        "Cocer las judías con la patata en dados en agua con sal, 15-18 minutos, hasta que ambas estén tiernas.",
        "Cocer el huevo aparte 10 minutos y pelarlo.",
        "Escurrir, aliñar en caliente con un buen chorro de aceite de oliva crudo y servir con el huevo en cuartos por encima."
      ],
      notas: "El #13 de España (MAPA). Un refrito de ajo y pimentón por encima lo levanta.",
      foto: "assets/banco-fotos/salteado-wok.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    },
    // Regla de Roger 2026-07-17 (UPGRADES §3): España es cultura de queso y embutido —
    // sin esta plantilla el formato de cena más común del país quedaba excluido de facto.
    // La cuota de carne roja lo dosifica sola; nada de sermones.
    {
      id: "cena-de-tabla",
      nombre_patron: "Tabla de {proteina} y queso con pan con tomate",
      tipo: "plantilla",
      apta: ["cena"],
      tiempo_min: 10,
      esfuerzo: "rapido",
      ninos: true,
      ejes: {
        proteina: ["jamon-serrano", "chorizo"],
        hidrato: ["pan"],
        verdura: ["tomate"]
      },
      kcal_extra: 150, // el queso al gusto + el aceite del pan con tomate
      pasos: [
        "Cortar el pan en rebanadas, mejor un poco tostadas.",
        "Frotar con tomate maduro, un hilo de aceite y una pizca de sal.",
        "Montar la tabla: {proteina} y el queso que os guste.",
        "A la mesa — cero fogones."
      ],
      notas: "La cena más rápida de España. Añade el queso que os guste a la compra.",
      foto: "assets/banco-fotos/ensalada-lentejas.jpg" // asignación aproximada 2026-07-17 (pool de 4 fotos) — no coincide ingrediente a ingrediente
    }
  ],

  // ---- Postres (tramo 1, 2026-07-17) ----
  // Modelo AESAN (Documento de Consenso comedores escolares 2010: fruta fresca
  // 4-5/5 días, otros postres máx. 1/semana, yogur priorizado sobre dulces)
  // trasladado a la semana familiar: L-V fruta de temporada, sábado lácteo,
  // domingo dulce tradicional como sugerencia. Rotación de fruta por mes según
  // el calendario oficial MAPA (01_Research/2026-07-17_RESEARCH_BANCO_AMPLIACION.md §3-4).
  // Lo resuelve engine.postreDelDia(); fruta y yogur entran en la lista de compra.
  postres: {
    frutas_mes: {
      1: ["naranja", "mandarina", "kiwi", "manzana", "pera", "platano"],
      2: ["naranja", "mandarina", "kiwi", "fresa"],
      3: ["fresa", "naranja", "kiwi"],
      4: ["fresa", "kiwi", "platano"],
      5: ["fresa", "cereza", "albaricoque", "melon"],
      6: ["cereza", "albaricoque", "melon", "sandia"],
      7: ["sandia", "melon", "melocoton", "cereza"],
      8: ["sandia", "melon", "melocoton", "uva"],
      9: ["uva", "melocoton", "manzana", "pera"],
      10: ["uva", "caqui", "manzana", "pera", "mandarina"],
      11: ["mandarina", "naranja", "caqui", "manzana", "pera"],
      12: ["mandarina", "naranja", "caqui", "manzana", "pera"]
    },
    lacteo: "yogur", // sábado — id de ingrediente (entra en compra)
    tradicionales: [ // domingo — sugerencia con receta aparte, no entra en compra
      { nombre: "Arroz con leche", region: "asturias", temporada: "invierno" },
      { nombre: "Natillas caseras", region: null, temporada: "invierno" },
      { nombre: "Flan de huevo", region: null, temporada: null },
      { nombre: "Macedonia de frutas", region: null, temporada: "verano" },
      { nombre: "Torrijas", region: null, temporada: "invierno" },
      { nombre: "Crema catalana", region: "cataluna", temporada: null },
      { nombre: "Mel i mató", region: "cataluna", temporada: null },
      { nombre: "Cuajada con miel", region: "navarra-rioja", temporada: "invierno" }
    ]
  }
};
