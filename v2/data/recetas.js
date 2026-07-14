// e3Foods — Banco de recetas semilla
// Cocina española/mediterránea familiar. kcal orientativas (NO app médica).
// Convención de peso: carnes/pescados/marisco = crudo; cereales (arroz, pasta...) = en seco;
// legumbres = cocidas/de bote listas para comer; verdura/tubérculo = en crudo tal cual se compra.
window.E3_RECETAS = {
  version: 1,

  ingredientes: {
    // ---- carne-blanca ----
    "pollo": { nombre: "Pollo (pechuga o contramuslo)", categoria: "carne-blanca", kcal_100g: 165, racion_adulto_g: 150, racion_nino_g: 90 },
    "pavo": { nombre: "Pavo (filete o picado)", categoria: "carne-blanca", kcal_100g: 110, racion_adulto_g: 150, racion_nino_g: 90 },
    "conejo": { nombre: "Conejo", categoria: "carne-blanca", kcal_100g: 130, racion_adulto_g: 150, racion_nino_g: 90 },

    // ---- carne-roja ----
    "ternera-picada": { nombre: "Carne picada de ternera", categoria: "carne-roja", kcal_100g: 240, racion_adulto_g: 130, racion_nino_g: 80 },
    "ternera": { nombre: "Ternera (filete o para guisar)", categoria: "carne-roja", kcal_100g: 200, racion_adulto_g: 150, racion_nino_g: 90 },
    "cerdo": { nombre: "Cerdo (lomo o solomillo)", categoria: "carne-roja", kcal_100g: 180, racion_adulto_g: 150, racion_nino_g: 90 },

    // ---- pescado-blanco ----
    "merluza": { nombre: "Merluza", categoria: "pescado-blanco", kcal_100g: 90, racion_adulto_g: 160, racion_nino_g: 100 },
    "bacalao": { nombre: "Bacalao desalado", categoria: "pescado-blanco", kcal_100g: 110, racion_adulto_g: 160, racion_nino_g: 100 },
    "lubina": { nombre: "Lubina", categoria: "pescado-blanco", kcal_100g: 118, racion_adulto_g: 160, racion_nino_g: 100 },
    "gallo": { nombre: "Gallo (filetes)", categoria: "pescado-blanco", kcal_100g: 80, racion_adulto_g: 160, racion_nino_g: 100 },

    // ---- pescado-azul ----
    "salmon": { nombre: "Salmón", categoria: "pescado-azul", kcal_100g: 200, racion_adulto_g: 150, racion_nino_g: 90 },
    "atun": { nombre: "Atún fresco", categoria: "pescado-azul", kcal_100g: 130, racion_adulto_g: 150, racion_nino_g: 90 },
    "sardinas": { nombre: "Sardinas", categoria: "pescado-azul", kcal_100g: 170, racion_adulto_g: 150, racion_nino_g: 90 },
    "boquerones": { nombre: "Boquerones", categoria: "pescado-azul", kcal_100g: 130, racion_adulto_g: 120, racion_nino_g: 70 },

    // ---- marisco ----
    "gambas": { nombre: "Gambas o langostinos", categoria: "marisco", kcal_100g: 90, racion_adulto_g: 130, racion_nino_g: 80 },
    "mejillones": { nombre: "Mejillones", categoria: "marisco", kcal_100g: 85, racion_adulto_g: 200, racion_nino_g: 120 },

    // ---- huevo ----
    "huevo": { nombre: "Huevo", categoria: "huevo", kcal_100g: 155, racion_adulto_g: 120, racion_nino_g: 60 },

    // ---- legumbre (incluye soja/tofu como proteína vegetal asimilada) ----
    "garbanzos": { nombre: "Garbanzos cocidos", categoria: "legumbre", kcal_100g: 120, racion_adulto_g: 200, racion_nino_g: 130 },
    "lentejas": { nombre: "Lentejas cocidas", categoria: "legumbre", kcal_100g: 116, racion_adulto_g: 200, racion_nino_g: 130 },
    "alubias-blancas": { nombre: "Alubias blancas cocidas", categoria: "legumbre", kcal_100g: 120, racion_adulto_g: 200, racion_nino_g: 130 },
    "edamame": { nombre: "Edamame (soja verde)", categoria: "legumbre", kcal_100g: 120, racion_adulto_g: 150, racion_nino_g: 90 },
    "tofu": { nombre: "Tofu", categoria: "legumbre", kcal_100g: 90, racion_adulto_g: 150, racion_nino_g: 90 },
    "hummus": { nombre: "Hummus", categoria: "legumbre", kcal_100g: 170, racion_adulto_g: 100, racion_nino_g: 60 },

    // ---- cereal ----
    "arroz": { nombre: "Arroz", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 80, racion_nino_g: 50 },
    "pasta": { nombre: "Pasta", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 80, racion_nino_g: 50 },
    "cuscus": { nombre: "Cuscús", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 70, racion_nino_g: 45 },
    "quinoa": { nombre: "Quinoa", categoria: "cereal", kcal_100g: 370, racion_adulto_g: 70, racion_nino_g: 45 },
    "pan-integral": { nombre: "Pan integral", categoria: "cereal", kcal_100g: 250, racion_adulto_g: 60, racion_nino_g: 40 },
    "fideos": { nombre: "Fideos", categoria: "cereal", kcal_100g: 360, racion_adulto_g: 70, racion_nino_g: 45 },
    "masa-empanadilla": { nombre: "Masa de empanadilla", categoria: "cereal", kcal_100g: 310, racion_adulto_g: 90, racion_nino_g: 60 },
    "tortilla-trigo": { nombre: "Tortilla de trigo (wrap)", categoria: "cereal", kcal_100g: 290, racion_adulto_g: 70, racion_nino_g: 40 },
    "pan-hamburguesa": { nombre: "Pan de hamburguesa", categoria: "cereal", kcal_100g: 260, racion_adulto_g: 60, racion_nino_g: 45 },
    "masa-pizza": { nombre: "Masa de pizza", categoria: "cereal", kcal_100g: 270, racion_adulto_g: 150, racion_nino_g: 100 },
    "placas-lasana": { nombre: "Placas de lasaña", categoria: "cereal", kcal_100g: 350, racion_adulto_g: 90, racion_nino_g: 60 },
    "pan-pita": { nombre: "Pan de pita", categoria: "cereal", kcal_100g: 275, racion_adulto_g: 60, racion_nino_g: 40 },

    // ---- tuberculo ----
    "patata": { nombre: "Patata", categoria: "tuberculo", kcal_100g: 77, racion_adulto_g: 220, racion_nino_g: 130 },
    "boniato": { nombre: "Boniato", categoria: "tuberculo", kcal_100g: 86, racion_adulto_g: 200, racion_nino_g: 120 },

    // ---- verdura ----
    "brocoli": { nombre: "Brócoli", categoria: "verdura", kcal_100g: 34, racion_adulto_g: 180, racion_nino_g: 100 },
    "judias-verdes": { nombre: "Judías verdes", categoria: "verdura", kcal_100g: 31, racion_adulto_g: 180, racion_nino_g: 100 },
    "calabacin": { nombre: "Calabacín", categoria: "verdura", kcal_100g: 17, racion_adulto_g: 200, racion_nino_g: 120 },
    "zanahoria": { nombre: "Zanahoria", categoria: "verdura", kcal_100g: 41, racion_adulto_g: 150, racion_nino_g: 90 },
    "pimiento": { nombre: "Pimiento", categoria: "verdura", kcal_100g: 30, racion_adulto_g: 150, racion_nino_g: 90 },
    "espinacas": { nombre: "Espinacas", categoria: "verdura", kcal_100g: 23, racion_adulto_g: 150, racion_nino_g: 90 },
    "champinones": { nombre: "Champiñones", categoria: "verdura", kcal_100g: 22, racion_adulto_g: 150, racion_nino_g: 90 },
    "berenjena": { nombre: "Berenjena", categoria: "verdura", kcal_100g: 25, racion_adulto_g: 180, racion_nino_g: 100 },
    "tomate": { nombre: "Tomate", categoria: "verdura", kcal_100g: 18, racion_adulto_g: 150, racion_nino_g: 90 },
    "guisantes": { nombre: "Guisantes", categoria: "verdura", kcal_100g: 80, racion_adulto_g: 120, racion_nino_g: 80 },
    "coliflor": { nombre: "Coliflor", categoria: "verdura", kcal_100g: 25, racion_adulto_g: 200, racion_nino_g: 110 },
    "puerro": { nombre: "Puerro", categoria: "verdura", kcal_100g: 61, racion_adulto_g: 120, racion_nino_g: 70 },
    "acelgas": { nombre: "Acelgas", categoria: "verdura", kcal_100g: 19, racion_adulto_g: 180, racion_nino_g: 100 },
    "alcachofa": { nombre: "Alcachofa", categoria: "verdura", kcal_100g: 47, racion_adulto_g: 200, racion_nino_g: 110 },
    "calabaza": { nombre: "Calabaza", categoria: "verdura", kcal_100g: 26, racion_adulto_g: 200, racion_nino_g: 110 },
    "lechuga": { nombre: "Lechuga", categoria: "verdura", kcal_100g: 15, racion_adulto_g: 100, racion_nino_g: 60 },
    "pepino": { nombre: "Pepino", categoria: "verdura", kcal_100g: 12, racion_adulto_g: 100, racion_nino_g: 60 },
    "espinacas-queso": { nombre: "Relleno de espinacas y queso", categoria: "verdura", kcal_100g: 120, racion_adulto_g: 90, racion_nino_g: 60 },

    // ---- lacteo ----
    "queso-fresco": { nombre: "Queso fresco", categoria: "lacteo", kcal_100g: 110, racion_adulto_g: 80, racion_nino_g: 50 },
    "queso-feta": { nombre: "Queso feta", categoria: "lacteo", kcal_100g: 260, racion_adulto_g: 50, racion_nino_g: 30 }
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
      notas: ""
    },
    {
      id: "lentejas-guiso",
      nombre_patron: "Lentejas guisadas con verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "garbanzos-guiso",
      nombre_patron: "Garbanzos guisados con verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "cocido-simplificado",
      nombre_patron: "Cocido simplificado de garbanzos con {proteina}",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 90,
      esfuerzo: "elaborado",
      ninos: true,
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
      notas: "Versión simplificada de un solo vuelco, sin fideos ni pelota."
    },
    {
      id: "alubias-guiso",
      nombre_patron: "Alubias blancas guisadas con verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "paella-sencilla",
      nombre_patron: "Paella sencilla de {proteina}",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 60,
      esfuerzo: "elaborado",
      ninos: true,
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
      notas: ""
    },
    {
      id: "arroz-horno",
      nombre_patron: "Arroz al horno con {proteina}",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 55,
      esfuerzo: "elaborado",
      ninos: true,
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
      notas: ""
    },
    {
      id: "arroz-caldoso",
      nombre_patron: "Arroz caldoso de {proteina}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 50,
      esfuerzo: "elaborado",
      ninos: true,
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
      notas: ""
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
      notas: ""
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
      notas: "Clásico infantil: plátano frito opcional de acompañamiento (no incluido en el cálculo)."
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
      notas: ""
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
      notas: ""
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
      notas: ""
    },
    {
      id: "lasana-verduras",
      nombre_patron: "Lasaña de {proteina} con verduras",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 65,
      esfuerzo: "elaborado",
      ninos: true,
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
      notas: ""
    },
    {
      id: "pollo-asado-horno",
      nombre_patron: "{proteina} asado al horno con {hidrato} y verduras",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 70,
      esfuerzo: "elaborado",
      ninos: true,
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
      notas: ""
    },
    {
      id: "pescado-horno-limon",
      nombre_patron: "{proteina} al horno con limón y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "verduras-horno-huevo",
      nombre_patron: "Verduras al horno con huevo",
      tipo: "plato-unico",
      apta: ["cena", "comida"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
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
      notas: ""
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
      notas: ""
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
      notas: ""
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
      notas: ""
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
      notas: ""
    },
    {
      id: "crema-calabaza-boniato",
      nombre_patron: "Crema de calabaza y boniato",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 30,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "ensalada-completa",
      nombre_patron: "Ensalada completa de {proteina} con {hidrato}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
    },
    {
      id: "ensalada-pasta",
      nombre_patron: "Ensalada de pasta con {proteina} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
    },
    {
      id: "ensalada-garbanzos",
      nombre_patron: "Ensalada de garbanzos con {verdura}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
    },
    {
      id: "ensalada-lentejas",
      nombre_patron: "Ensalada de lentejas con {verdura}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
    },
    {
      id: "quinoa-ensalada",
      nombre_patron: "Ensalada de quinoa con {proteina} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
    },
    {
      id: "merluza-salsa-verde",
      nombre_patron: "{proteina} en salsa verde con {verdura}",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
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
      notas: ""
    },
    {
      id: "bacalao-tomate",
      nombre_patron: "{proteina} con tomate y {verdura}",
      tipo: "plantilla",
      apta: ["comida"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "marmitako-atun",
      nombre_patron: "Marmitako de atún y patata",
      tipo: "plato-unico",
      apta: ["comida"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "pescaditos-plancha",
      nombre_patron: "{proteina} a la plancha con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 20,
      esfuerzo: "rapido",
      ninos: false,
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
      notas: "Espinas pequeñas: revisar bien si lo va a comer un niño pequeño."
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
      notas: ""
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
      notas: "Omitir la guindilla para que sea apto para niños."
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
      notas: "Descartar los mejillones que no se abran al cocinar."
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
      notas: ""
    },
    {
      id: "wrap-casero",
      nombre_patron: "Wrap casero de {proteina} con {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 15,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
    },
    {
      id: "hummus-plato",
      nombre_patron: "Plato de hummus con {hidrato} y {verdura}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 10,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
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
      notas: "Sazonar suave (poca salsa de soja) para que resulte más amable a los niños."
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
      notas: ""
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
      notas: ""
    },
    {
      id: "sopa-fideos",
      nombre_patron: "Sopa de fideos con verduras",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 25,
      esfuerzo: "rapido",
      ninos: true,
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
      notas: ""
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
      notas: "Combinación de sabores variados: algunos niños la resisten mejor si las verduras se sirven por separado."
    },
    {
      id: "garbanzos-espinacas",
      nombre_patron: "Garbanzos con espinacas y {proteina}",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "albondigas-salsa",
      nombre_patron: "Albóndigas de {proteina} en salsa con {hidrato}",
      tipo: "plantilla",
      apta: ["comida", "cena"],
      tiempo_min: 40,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "patatas-guisadas",
      nombre_patron: "Patatas guisadas con {proteina} y verduras",
      tipo: "plato-unico",
      apta: ["comida", "cena"],
      tiempo_min: 45,
      esfuerzo: "medio",
      ninos: true,
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
      notas: ""
    },
    {
      id: "coliflor-gratinada",
      nombre_patron: "Coliflor gratinada con {proteina}",
      tipo: "plato-unico",
      apta: ["cena"],
      tiempo_min: 35,
      esfuerzo: "medio",
      ninos: false,
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
      notas: "Sabor fuerte de la coliflor: no siempre triunfa entre los más pequeños."
    }
  ]
};
