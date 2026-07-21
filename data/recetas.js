/* ============================================================
   e3Foods — recetas.js (v3)

   Banco unico del motor v3: ingredientes + postres (datos base, se editan
   aqui directamente) + grupos/tecnicas_coccion/acabados/elaboraciones/
   compatibilidad (GENERADOS, no editar a mano — tocar
   tests/fixtures/clasificacion_elaboraciones_v3.js y correr
   `node _build_recetas.js` desde 02_APP/). categorias_cuota = las de v2
   sin cambios + fritos (nueva, dura, 1-2/sem).
   Ver 02_APP/_REVISION_MOTOR_borrador.md para el diseno completo.
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
      "coste_banda": 2
    },
    "pavo": {
      "nombre": "Pavo (filete o picado)",
      "categoria": "carne-blanca",
      "kcal_100g": 110,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2
    },
    "conejo": {
      "nombre": "Conejo",
      "categoria": "carne-blanca",
      "kcal_100g": 130,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2
    },
    "ternera-picada": {
      "nombre": "Carne picada de ternera",
      "categoria": "carne-roja",
      "kcal_100g": 240,
      "racion_adulto_g": 130,
      "racion_nino_g": 80,
      "coste_banda": 2
    },
    "ternera": {
      "nombre": "Ternera (filete o para guisar)",
      "categoria": "carne-roja",
      "kcal_100g": 200,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3
    },
    "cerdo": {
      "nombre": "Cerdo (lomo o solomillo)",
      "categoria": "carne-roja",
      "kcal_100g": 180,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2
    },
    "chorizo": {
      "nombre": "Chorizo",
      "categoria": "carne-roja",
      "kcal_100g": 323,
      "racion_adulto_g": 60,
      "racion_nino_g": 30,
      "coste_banda": 2
    },
    "panceta": {
      "nombre": "Panceta de cerdo",
      "categoria": "carne-roja",
      "kcal_100g": 467,
      "racion_adulto_g": 50,
      "racion_nino_g": 25,
      "coste_banda": 2
    },
    "jamon-serrano": {
      "nombre": "Jamón serrano",
      "categoria": "carne-roja",
      "kcal_100g": 319,
      "racion_adulto_g": 40,
      "racion_nino_g": 25,
      "coste_banda": 2
    },
    "compango": {
      "nombre": "Compango asturiano (chorizo, morcilla y lacón)",
      "categoria": "carne-roja",
      "kcal_100g": 287,
      "racion_adulto_g": 80,
      "racion_nino_g": 40,
      "coste_banda": 2
    },
    "ternera-rellena": {
      "nombre": "Ternera rellena de jamón y queso (cachopo)",
      "categoria": "carne-roja",
      "kcal_100g": 195,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 3
    },
    "merluza": {
      "nombre": "Merluza",
      "categoria": "pescado-blanco",
      "kcal_100g": 90,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3
    },
    "bacalao": {
      "nombre": "Bacalao desalado",
      "categoria": "pescado-blanco",
      "kcal_100g": 110,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2
    },
    "lubina": {
      "nombre": "Lubina",
      "categoria": "pescado-blanco",
      "kcal_100g": 118,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3
    },
    "gallo": {
      "nombre": "Gallo (filetes)",
      "categoria": "pescado-blanco",
      "kcal_100g": 80,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 3
    },
    "salmon": {
      "nombre": "Salmón",
      "categoria": "pescado-azul",
      "kcal_100g": 200,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3
    },
    "atun": {
      "nombre": "Atún fresco",
      "categoria": "pescado-azul",
      "kcal_100g": 130,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 3
    },
    "sardinas": {
      "nombre": "Sardinas",
      "categoria": "pescado-azul",
      "kcal_100g": 170,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2
    },
    "boquerones": {
      "nombre": "Boquerones",
      "categoria": "pescado-azul",
      "kcal_100g": 130,
      "racion_adulto_g": 120,
      "racion_nino_g": 70,
      "coste_banda": 1
    },
    "bonito": {
      "nombre": "Bonito del norte fresco",
      "categoria": "pescado-azul",
      "kcal_100g": 138,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2
    },
    "trucha": {
      "nombre": "Trucha",
      "categoria": "pescado-azul",
      "kcal_100g": 90,
      "racion_adulto_g": 160,
      "racion_nino_g": 100,
      "coste_banda": 2
    },
    "gambas": {
      "nombre": "Gambas o langostinos",
      "categoria": "marisco",
      "kcal_100g": 90,
      "racion_adulto_g": 130,
      "racion_nino_g": 80,
      "coste_banda": 3
    },
    "mejillones": {
      "nombre": "Mejillones",
      "categoria": "marisco",
      "kcal_100g": 85,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 2
    },
    "huevo": {
      "nombre": "Huevo",
      "categoria": "huevo",
      "kcal_100g": 155,
      "racion_adulto_g": 120,
      "racion_nino_g": 60,
      "coste_banda": 1
    },
    "garbanzos": {
      "nombre": "Garbanzos cocidos",
      "categoria": "legumbre",
      "kcal_100g": 120,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1
    },
    "lentejas": {
      "nombre": "Lentejas cocidas",
      "categoria": "legumbre",
      "kcal_100g": 116,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1
    },
    "alubias-blancas": {
      "nombre": "Alubias blancas cocidas",
      "categoria": "legumbre",
      "kcal_100g": 120,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1
    },
    "edamame": {
      "nombre": "Edamame (soja verde)",
      "categoria": "legumbre",
      "kcal_100g": 120,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1
    },
    "tofu": {
      "nombre": "Tofu",
      "categoria": "legumbre",
      "kcal_100g": 90,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 2
    },
    "hummus": {
      "nombre": "Hummus",
      "categoria": "legumbre",
      "kcal_100g": 170,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 2
    },
    "legumbres-variadas": {
      "nombre": "Legumbres variadas cocidas",
      "categoria": "legumbre",
      "kcal_100g": 119,
      "racion_adulto_g": 200,
      "racion_nino_g": 130,
      "coste_banda": 1
    },
    "arroz": {
      "nombre": "Arroz",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 1
    },
    "pasta": {
      "nombre": "Pasta",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 1
    },
    "cuscus": {
      "nombre": "Cuscús",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 70,
      "racion_nino_g": 45,
      "coste_banda": 1
    },
    "quinoa": {
      "nombre": "Quinoa",
      "categoria": "cereal",
      "kcal_100g": 370,
      "racion_adulto_g": 70,
      "racion_nino_g": 45,
      "coste_banda": 2
    },
    "pan-integral": {
      "nombre": "Pan integral",
      "categoria": "cereal",
      "kcal_100g": 250,
      "racion_adulto_g": 60,
      "racion_nino_g": 40,
      "coste_banda": 1
    },
    "fideos": {
      "nombre": "Fideos",
      "categoria": "cereal",
      "kcal_100g": 360,
      "racion_adulto_g": 70,
      "racion_nino_g": 45,
      "coste_banda": 1
    },
    "masa-empanadilla": {
      "nombre": "Masa de empanadilla",
      "categoria": "cereal",
      "kcal_100g": 310,
      "racion_adulto_g": 90,
      "racion_nino_g": 60,
      "coste_banda": 2
    },
    "tortilla-trigo": {
      "nombre": "Tortilla de trigo (wrap)",
      "categoria": "cereal",
      "kcal_100g": 290,
      "racion_adulto_g": 70,
      "racion_nino_g": 40,
      "coste_banda": 2
    },
    "pan-hamburguesa": {
      "nombre": "Pan de hamburguesa",
      "categoria": "cereal",
      "kcal_100g": 260,
      "racion_adulto_g": 60,
      "racion_nino_g": 45,
      "coste_banda": 2
    },
    "masa-pizza": {
      "nombre": "Masa de pizza",
      "categoria": "cereal",
      "kcal_100g": 270,
      "racion_adulto_g": 150,
      "racion_nino_g": 100,
      "coste_banda": 2
    },
    "placas-lasana": {
      "nombre": "Placas de lasaña",
      "categoria": "cereal",
      "kcal_100g": 350,
      "racion_adulto_g": 90,
      "racion_nino_g": 60,
      "coste_banda": 2
    },
    "pan-pita": {
      "nombre": "Pan de pita",
      "categoria": "cereal",
      "kcal_100g": 275,
      "racion_adulto_g": 60,
      "racion_nino_g": 40,
      "coste_banda": 2
    },
    "pan": {
      "nombre": "Pan (barra)",
      "categoria": "cereal",
      "kcal_100g": 240,
      "racion_adulto_g": 60,
      "racion_nino_g": 40,
      "coste_banda": 1
    },
    "patata": {
      "nombre": "Patata",
      "categoria": "tuberculo",
      "kcal_100g": 77,
      "racion_adulto_g": 220,
      "racion_nino_g": 130,
      "coste_banda": 1
    },
    "boniato": {
      "nombre": "Boniato",
      "categoria": "tuberculo",
      "kcal_100g": 86,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 1
    },
    "brocoli": {
      "nombre": "Brócoli",
      "categoria": "verdura",
      "kcal_100g": 34,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "judias-verdes": {
      "nombre": "Judías verdes",
      "categoria": "verdura",
      "kcal_100g": 31,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "calabacin": {
      "nombre": "Calabacín",
      "categoria": "verdura",
      "kcal_100g": 17,
      "racion_adulto_g": 200,
      "racion_nino_g": 120,
      "coste_banda": 1
    },
    "zanahoria": {
      "nombre": "Zanahoria",
      "categoria": "verdura",
      "kcal_100g": 41,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1
    },
    "pimiento": {
      "nombre": "Pimiento",
      "categoria": "verdura",
      "kcal_100g": 30,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1
    },
    "espinacas": {
      "nombre": "Espinacas",
      "categoria": "verdura",
      "kcal_100g": 23,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1
    },
    "champinones": {
      "nombre": "Champiñones",
      "categoria": "verdura",
      "kcal_100g": 22,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1
    },
    "berenjena": {
      "nombre": "Berenjena",
      "categoria": "verdura",
      "kcal_100g": 25,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "tomate": {
      "nombre": "Tomate",
      "categoria": "verdura",
      "kcal_100g": 18,
      "racion_adulto_g": 150,
      "racion_nino_g": 90,
      "coste_banda": 1
    },
    "guisantes": {
      "nombre": "Guisantes",
      "categoria": "verdura",
      "kcal_100g": 80,
      "racion_adulto_g": 120,
      "racion_nino_g": 80,
      "coste_banda": 1
    },
    "coliflor": {
      "nombre": "Coliflor",
      "categoria": "verdura",
      "kcal_100g": 25,
      "racion_adulto_g": 200,
      "racion_nino_g": 110,
      "coste_banda": 1
    },
    "puerro": {
      "nombre": "Puerro",
      "categoria": "verdura",
      "kcal_100g": 61,
      "racion_adulto_g": 120,
      "racion_nino_g": 70,
      "coste_banda": 1
    },
    "acelgas": {
      "nombre": "Acelgas",
      "categoria": "verdura",
      "kcal_100g": 19,
      "racion_adulto_g": 180,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "alcachofa": {
      "nombre": "Alcachofa",
      "categoria": "verdura",
      "kcal_100g": 47,
      "racion_adulto_g": 200,
      "racion_nino_g": 110,
      "coste_banda": 2
    },
    "calabaza": {
      "nombre": "Calabaza",
      "categoria": "verdura",
      "kcal_100g": 26,
      "racion_adulto_g": 200,
      "racion_nino_g": 110,
      "coste_banda": 1
    },
    "lechuga": {
      "nombre": "Lechuga",
      "categoria": "verdura",
      "kcal_100g": 15,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 1
    },
    "pepino": {
      "nombre": "Pepino",
      "categoria": "verdura",
      "kcal_100g": 12,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 1
    },
    "espinacas-queso": {
      "nombre": "Relleno de espinacas y queso",
      "categoria": "verdura",
      "kcal_100g": 120,
      "racion_adulto_g": 90,
      "racion_nino_g": 60,
      "coste_banda": 2
    },
    "queso-fresco": {
      "nombre": "Queso fresco",
      "categoria": "lacteo",
      "kcal_100g": 110,
      "racion_adulto_g": 80,
      "racion_nino_g": 50,
      "coste_banda": 2
    },
    "queso-feta": {
      "nombre": "Queso feta",
      "categoria": "lacteo",
      "kcal_100g": 260,
      "racion_adulto_g": 50,
      "racion_nino_g": 30,
      "coste_banda": 3
    },
    "yogur": {
      "nombre": "Yogur natural",
      "categoria": "lacteo",
      "kcal_100g": 57,
      "racion_adulto_g": 125,
      "racion_nino_g": 125,
      "coste_banda": 1
    },
    "bechamel": {
      "nombre": "Bechamel casera (leche, harina y mantequilla)",
      "categoria": "otro",
      "kcal_100g": 152,
      "racion_adulto_g": 100,
      "racion_nino_g": 60,
      "coste_banda": 1
    },
    "naranja": {
      "nombre": "Naranja",
      "categoria": "fruta",
      "kcal_100g": 38,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "mandarina": {
      "nombre": "Mandarina",
      "categoria": "fruta",
      "kcal_100g": 40,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "fresa": {
      "nombre": "Fresas",
      "categoria": "fruta",
      "kcal_100g": 36,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "cereza": {
      "nombre": "Cerezas",
      "categoria": "fruta",
      "kcal_100g": 63,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 2
    },
    "albaricoque": {
      "nombre": "Albaricoques",
      "categoria": "fruta",
      "kcal_100g": 42,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "melocoton": {
      "nombre": "Melocotón",
      "categoria": "fruta",
      "kcal_100g": 39,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "sandia": {
      "nombre": "Sandía",
      "categoria": "fruta",
      "kcal_100g": 20,
      "racion_adulto_g": 250,
      "racion_nino_g": 150,
      "coste_banda": 1
    },
    "melon": {
      "nombre": "Melón",
      "categoria": "fruta",
      "kcal_100g": 27,
      "racion_adulto_g": 250,
      "racion_nino_g": 150,
      "coste_banda": 1
    },
    "uva": {
      "nombre": "Uvas",
      "categoria": "fruta",
      "kcal_100g": 68,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 2
    },
    "caqui": {
      "nombre": "Caqui",
      "categoria": "fruta",
      "kcal_100g": 67,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "manzana": {
      "nombre": "Manzana",
      "categoria": "fruta",
      "kcal_100g": 50,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "pera": {
      "nombre": "Pera",
      "categoria": "fruta",
      "kcal_100g": 45,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
    },
    "platano": {
      "nombre": "Plátano",
      "categoria": "fruta",
      "kcal_100g": 89,
      "racion_adulto_g": 120,
      "racion_nino_g": 80,
      "coste_banda": 1
    },
    "kiwi": {
      "nombre": "Kiwi",
      "categoria": "fruta",
      "kcal_100g": 52,
      "racion_adulto_g": 170,
      "racion_nino_g": 100,
      "coste_banda": 1
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Salpimentar {proteina} y dejar atemperar 10 minutos.",
        "Cocer {hidrato} según su tiempo y reservar.",
        "Saltear o cocer al vapor {verdura} con un chorrito de aceite de oliva.",
        "Hacer {proteina} a la plancha vuelta y vuelta hasta que esté hecho por dentro.",
        "Emplatar {proteina} con {hidrato} y {verdura} al lado."
      ],
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
          "ternera"
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} y {verdura} en trozos similares y repartir en la bandeja con aceite y sal.",
        "Colocar {proteina} sobre las verduras, salpimentar y regar con un poco de aceite.",
        "Hornear 30-35 minutos hasta que {proteina} esté hecho y {hidrato} tierno.",
        "Dejar reposar 5 minutos antes de servir."
      ],
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
          "lubina"
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír ajo y cebolla en la olla con un poco de aceite de oliva.",
        "Añadir {verdura} en trozos pequeños y rehogar 5 minutos.",
        "Incorporar las lentejas y cubrir con caldo o agua.",
        "Cocer a fuego medio 20-25 minutos removiendo de vez en cuando.",
        "Rectificar de sal y dejar reposar antes de servir."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír ajo, cebolla y un poco de pimentón dulce en la olla.",
        "Añadir {verdura} troceada y rehogar unos minutos.",
        "Incorporar los garbanzos cocidos y cubrir con caldo.",
        "Cocer 15-20 minutos a fuego suave para que se integren los sabores.",
        "Servir bien caliente."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Poner en la olla {proteina}, hueso de rodilla o similar (opcional) y cubrir con agua fría.",
        "Llevar a hervor, espumar y añadir {verdura} en trozos grandes.",
        "Cocer a fuego lento 1 hora aproximadamente.",
        "Añadir los garbanzos (previamente en remojo o de bote) y cocer 20 minutos más.",
        "Servir el caldo aparte como sopa y el resto como plato único."
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír ajo y cebolla en una cazuela con aceite de oliva.",
        "Añadir {verdura} troceada y rehogar 5 minutos.",
        "Incorporar las alubias cocidas y un poco de caldo o agua.",
        "Cocer 15 minutos a fuego suave, moviendo la cazuela (no remover con cuchara) para que ligue.",
        "Dejar reposar unos minutos antes de servir."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír {proteina} en la paellera con aceite de oliva hasta dorar.",
        "Añadir {verdura} y un sofrito de tomate y ajo, rehogar bien.",
        "Incorporar el arroz y nacarar 2 minutos.",
        "Añadir el caldo caliente con azafrán o colorante y cocer 18-20 minutos sin remover.",
        "Dejar reposar 5 minutos tapada con un paño antes de servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Dorar {proteina} en una cazuela apta para horno con aceite de oliva.",
        "Añadir {verdura} y un sofrito de tomate y ajo, rehogar.",
        "Incorporar el arroz, mezclar bien y cubrir con caldo caliente.",
        "Hornear a 200°C durante 20-25 minutos hasta que el arroz esté hecho y dorado por arriba.",
        "Dejar reposar 5 minutos antes de servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír {proteina} y {verdura} en una olla con aceite de oliva.",
        "Añadir un sofrito de tomate y ajo y rehogar 2 minutos.",
        "Incorporar el arroz y cubrir generosamente con caldo caliente.",
        "Cocer 18-20 minutos a fuego medio removiendo de vez en cuando, debe quedar caldoso.",
        "Servir inmediatamente en plato hondo."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer el arroz en abundante agua con sal y escurrir.",
        "Saltear {verdura} en una sartén amplia con un poco de aceite.",
        "Añadir {proteina} y cocinar hasta que esté hecho.",
        "Incorporar el arroz cocido y saltear todo junto 2-3 minutos.",
        "Rectificar de sal y servir caliente."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer el arroz blanco en agua con sal y escurrir bien.",
        "Preparar una salsa de {verdura} frito o triturado, calentar.",
        "Freír {proteina} con la yema jugosa.",
        "Emplatar el arroz en molde, la salsa de tomate al lado y el huevo por encima."
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
      "nombre": "Boloñesa de {proteina}",
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Picar {verdura} muy fina y sofreír con ajo y cebolla.",
        "Añadir {proteina} y dorar bien deshaciendo los grumos.",
        "Incorporar tomate triturado y cocer a fuego lento 15-20 minutos.",
        "Cocer {hidrato} al dente en agua con sal.",
        "Mezclar o servir la boloñesa sobre {hidrato}."
      ],
      "grupos": [
        "proteina",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "pavo",
          "ternera-picada"
        ],
        "fijos": {
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer {hidrato} al dente y reservar con un poco de su agua.",
        "Saltear {verdura} en una sartén amplia con aceite de oliva.",
        "Añadir {proteina} y cocinar hasta que esté hecho.",
        "Incorporar {hidrato} escurrida y saltear todo junto 2 minutos.",
        "Añadir un chorrito de aceite en crudo y servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer la pasta al dente en agua con sal.",
        "Calentar el tomate con un poco de ajo y aceite de oliva.",
        "Añadir el atún desmenuzado y calentar 2-3 minutos.",
        "Mezclar con la pasta escurrida y servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Sofreír {verdura} picada con ajo y cebolla.",
        "Añadir {proteina} y dorar bien; incorporar tomate triturado y cocer 15 minutos.",
        "Hidratar o precocer {hidrato} según el fabricante.",
        "Montar capas alternando {hidrato}, el relleno y bechamel en una fuente.",
        "Cubrir con queso rallado y hornear a 200°C 20-25 minutos hasta gratinar."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Precalentar el horno a 190°C.",
        "Salpimentar {proteina} y colocar en la bandeja con {hidrato} y {verdura} cortados en trozos grandes.",
        "Regar con aceite de oliva y un chorrito de vino blanco o limón.",
        "Hornear 50-55 minutos, dando la vuelta a media cocción, hasta dorar.",
        "Dejar reposar 10 minutos antes de trinchar y servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} en láminas finas y colocar de base en la bandeja con aceite.",
        "Añadir {verdura} y hornear 10 minutos antes de poner el pescado.",
        "Colocar {proteina} encima, salpimentar, rociar con limón y aceite.",
        "Hornear 15-18 minutos más hasta que el pescado esté hecho."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Precalentar el horno a 200°C.",
        "Cortar {hidrato} y {verdura} en rodajas y colocar en la bandeja con aceite y sal.",
        "Hornear 25-30 minutos hasta que estén tiernas.",
        "Hacer un hueco y cascar {proteina} encima, u hornear los huevos aparte al gusto.",
        "Hornear 5-8 minutos más hasta cuajar la clara y servir."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Pelar y cortar {hidrato} en láminas finas.",
        "Confitar {hidrato} en abundante aceite a fuego suave hasta que estén tiernas.",
        "Escurrir bien y mezclar con {proteina} batido y sal.",
        "Cuajar en sartén antiadherente por ambos lados al punto deseado.",
        "Dejar reposar unos minutos antes de cortar."
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Saltear {verdura} en una sartén con un poco de aceite hasta que esté tierna.",
        "Batir {proteina} con una pizca de sal.",
        "Añadir {verdura} salteada al huevo batido y mezclar.",
        "Cuajar en la sartén por ambos lados y servir caliente."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Saltear {verdura} con ajo en una sartén con aceite de oliva.",
        "Batir {proteina} ligeramente y añadir a la sartén.",
        "Remover a fuego suave hasta que cuaje cremoso, sin dejar secar.",
        "Servir enseguida con pan si se desea."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Sofreír cebolla y puerro en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 15-18 minutos hasta que todo esté tierno.",
        "Triturar hasta obtener una crema fina y rectificar de sal.",
        "Servir con {proteina} picado o rallado por encima."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 18-20 minutos hasta que estén muy tiernas.",
        "Triturar hasta obtener una crema fina.",
        "Servir con {proteina} como topping."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 20 minutos hasta que estén muy tiernas.",
        "Triturar hasta obtener una crema homogénea, ajustando de líquido si hace falta.",
        "Servir con {proteina} por encima."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír cebolla en una olla con aceite de oliva.",
        "Añadir {verdura} y {hidrato} troceados y rehogar 5 minutos.",
        "Cubrir con caldo y cocer 20 minutos hasta que estén tiernos.",
        "Triturar hasta obtener una crema fina y rectificar de sal.",
        "Servir con {proteina} picado por encima si se desea."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer {hidrato} y dejar enfriar.",
        "Lavar y cortar {verdura} en trozos pequeños.",
        "Preparar {proteina} (cocer, cocinar a la plancha o escurrir según el caso).",
        "Mezclar todo en una fuente grande y aliñar con aceite, vinagre y sal.",
        "Servir templado o frío."
      ],
      "grupos": [
        "proteina"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun",
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cocer {hidrato} al dente, escurrir y enfriar bajo el grifo.",
        "Cortar {verdura} en trozos pequeños.",
        "Preparar {proteina} y añadir a la pasta.",
        "Mezclar todo con {verdura} y aliñar con aceite de oliva y sal.",
        "Dejar reposar en la nevera 10 minutos antes de servir."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun",
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Escurrir y enjuagar los garbanzos cocidos.",
        "Cortar {verdura} en dados pequeños.",
        "Mezclar los garbanzos con {verdura} en una fuente.",
        "Aliñar con aceite de oliva, vinagre y sal.",
        "Dejar reposar 10 minutos para que se integren los sabores."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Escurrir las lentejas cocidas.",
        "Cortar {verdura} en dados pequeños.",
        "Mezclar las lentejas con {verdura}.",
        "Aliñar con aceite de oliva, vinagre y sal.",
        "Servir a temperatura ambiente o fría."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Cortar {hidrato} en dados y tostar en la sartén o el horno para hacer picatostes.",
        "Cocinar {proteina} a la plancha y cortar en tiras o dados.",
        "Lavar y trocear {verdura}.",
        "Mezclar {verdura}, {proteina} y los picatostes.",
        "Aliñar con una salsa ligera de yogur o mostaza y aceite, y queso rallado por encima."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cocer {hidrato} según el envase y dejar enfriar.",
        "Cortar {verdura} en dados pequeños.",
        "Preparar {proteina} y desmenuzar o trocear.",
        "Mezclar todo en una fuente y aliñar con aceite de oliva, limón y sal.",
        "Servir fría o templada."
      ],
      "grupos": [
        "proteina",
        "hidrato"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun",
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír ajo picado en una cazuela con aceite de oliva.",
        "Añadir un poco de harina, rehogar y mojar con caldo y perejil picado.",
        "Incorporar {hidrato} cortada en trozos y cocer 10 minutos.",
        "Añadir {proteina} y {verdura}, cocinar 8-10 minutos moviendo la cazuela suavemente.",
        "Servir bien caliente con la salsa verde."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cocer o saltear {hidrato}.",
        "Saltear {verdura} en una sartén con un poco de aceite.",
        "Marcar el salmón a la plancha por ambos lados.",
        "Preparar una salsa ligera con un poco de nata o caldo y hierbas.",
        "Servir el salmón napado con la salsa junto a {hidrato} y {verdura}."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír ajo y {verdura} en una sartén con aceite de oliva.",
        "Añadir tomate triturado y cocer 15 minutos a fuego suave.",
        "Cocer {hidrato} aparte y reservar.",
        "Añadir {proteina} a la salsa y cocinar 6-8 minutos hasta que esté hecho.",
        "Servir con {hidrato} de acompañamiento."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír ajo, cebolla y {verdura} en una olla con aceite de oliva.",
        "Añadir {hidrato} cascada en trozos irregulares (para que suelte almidón) y rehogar.",
        "Cubrir con caldo o fumet y cocer 20 minutos hasta que la patata esté tierna.",
        "Añadir {proteina} en dados y cocinar 4-5 minutos, apagando el fuego para que se haga con el calor residual.",
        "Dejar reposar unos minutos antes de servir."
      ],
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
      "ninos": false,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Limpiar {proteina} si no vienen ya limpios.",
        "Cocer o asar {hidrato}.",
        "Preparar {verdura} en crudo tipo ensalada sencilla.",
        "Hacer {proteina} a la plancha con un poco de aceite y sal, vuelta y vuelta.",
        "Servir con {hidrato} y {verdura} de acompañamiento."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer o saltear {hidrato}.",
        "Cocer al vapor o saltear {verdura}.",
        "Salpimentar los filetes de gallo.",
        "Hacer a la plancha 1-2 minutos por lado, son filetes finos y se hacen rápido.",
        "Servir enseguida con {hidrato} y {verdura}."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Preparar {hidrato} como acompañamiento.",
        "Calentar aceite de oliva con ajo laminado en una cazuela de barro o sartén.",
        "Añadir las gambas cuando el ajo empiece a dorarse.",
        "Saltear 2-3 minutos hasta que las gambas cambien de color, sin pasarse de fuego.",
        "Servir muy caliente con {hidrato}."
      ],
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
      "ninos": false,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Limpiar bien los mejillones, retirando barbas e impurezas.",
        "Sofreír ajo y cebolla, añadir {verdura} triturado y cocer 10 minutos.",
        "Añadir un chorrito de vino blanco y dejar reducir.",
        "Incorporar los mejillones y tapar hasta que se abran, unos 5-6 minutos.",
        "Servir con {hidrato} para mojar en la salsa."
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Preparar el relleno de {proteina} con tomate frito y un sofrito de cebolla.",
        "Extender los discos de {hidrato} sobre una superficie limpia.",
        "Rellenar cada disco con una cucharada del relleno y cerrar sellando los bordes con un tenedor.",
        "Pintar con huevo batido si se van a hornear.",
        "Hornear a 200°C 15-18 minutos hasta dorar, u freír en aceite caliente."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Preparar {proteina} (a la plancha, cocido o directamente si es hummus).",
        "Cortar {verdura} en tiras finas.",
        "Calentar ligeramente {hidrato} para que sea más flexible.",
        "Rellenar con {proteina} y {verdura}.",
        "Enrollar apretando bien y cortar por la mitad para servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cortar {verdura} en bastones para mojar.",
        "Calentar ligeramente {hidrato} si se desea.",
        "Servir el hummus en un plato con un chorrito de aceite de oliva por encima.",
        "Acompañar con {hidrato} y {verdura} en bastones."
      ],
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
      "ninos": false,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Escurrir bien el tofu y cortar en dados o filetes.",
        "Cocer {hidrato} según el envase.",
        "Saltear {verdura} en una sartén con un poco de aceite.",
        "Marcar el tofu a la plancha hasta que quede dorado por fuera.",
        "Servir todo junto con un chorrito de salsa de soja."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer {hidrato} y reservar.",
        "Cortar {verdura} en tiras o dados pequeños para que se hagan rápido.",
        "Saltear {proteina} a fuego fuerte en wok o sartén amplia con un poco de aceite.",
        "Añadir {verdura} y saltear 3-4 minutos sin dejar que se ablanden del todo.",
        "Incorporar {hidrato}, un chorrito de salsa de soja y saltear todo junto 1-2 minutos."
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Mezclar {proteina} con sal, pimienta y un poco de ajo picado, formar hamburguesas.",
        "Tostar ligeramente {hidrato} por dentro en la sartén o plancha.",
        "Hacer las hamburguesas a la plancha 3-4 minutos por lado.",
        "Lavar y cortar {verdura}.",
        "Montar la hamburguesa con {hidrato}, {verdura} y la carne."
      ],
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
      "nombre": "Pizza casera de {proteina}",
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Precalentar el horno a la temperatura máxima con la bandeja dentro.",
        "Estirar {hidrato} sobre papel de horno.",
        "Cubrir con salsa de tomate, {proteina} y {verdura} troceada.",
        "Añadir queso rallado por encima.",
        "Hornear 10-12 minutos hasta que el borde esté dorado y el queso fundido."
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
          "atun",
          "queso-feta"
        ],
        "fijos": {
          "hidrato": [
            "masa-pizza"
          ],
          "verdura": [
            "champinones",
            "pimiento",
            "tomate",
            "calabacin"
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Poner a hervir un buen caldo de verduras o pollo.",
        "Añadir {verdura} cortada muy fina y cocer 10 minutos.",
        "Incorporar {hidrato} y cocer 5-6 minutos más.",
        "Añadir {proteina} batido en forma de hilos removiendo el caldo (huevo hilado), opcional.",
        "Servir bien caliente."
      ],
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
      "ninos": false,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Cocer o blanquear cada {verdura} por separado hasta que estén tiernas.",
        "Sofreír ajo en una sartén con aceite de oliva.",
        "Añadir {verdura} cocida y rehogar 5 minutos para que coja sabor.",
        "Preparar {proteina} (huevo duro cortado o pollo a la plancha) como acompañamiento.",
        "Servir la menestra con {proteina} por encima o al lado."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Sofreír ajo en una sartén con aceite de oliva hasta dorar.",
        "Añadir {verdura} y rehogar hasta que reduzca.",
        "Incorporar los garbanzos cocidos y un poco de caldo, cocer 10 minutos.",
        "Añadir {proteina} (huevo escalfado o bacalao en trozos) y cocinar unos minutos más.",
        "Servir bien caliente."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Mezclar {proteina} con pan remojado en leche, ajo y perejil picado; formar bolas.",
        "Enharinar ligeramente y dorar las albóndigas en una sartén con aceite.",
        "Preparar una salsa con {verdura} triturado, cebolla y un poco de caldo.",
        "Cocer las albóndigas en la salsa 15-20 minutos a fuego suave.",
        "Servir con {hidrato} de acompañamiento."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Dorar {proteina} en una olla con aceite de oliva.",
        "Añadir {verdura} y rehogar unos minutos.",
        "Incorporar {hidrato} cascada en trozos irregulares.",
        "Cubrir con caldo y cocer a fuego medio 25-30 minutos hasta que todo esté tierno.",
        "Rectificar de sal y dejar reposar antes de servir."
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
      "ninos": false,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer {verdura} y {hidrato} en agua con sal hasta que estén tiernos.",
        "Escurrir bien y colocar en una fuente apta para horno.",
        "Preparar una bechamel ligera y cubrir las verduras.",
        "Añadir {proteina} rallado o picado por encima.",
        "Gratinar en el horno 8-10 minutos hasta dorar."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Remojar el pan en agua unos minutos.",
        "Triturar el tomate maduro con el pan, un diente de ajo, aceite de oliva y un chorrito de vinagre (si tienes medio pimiento o pepino, añádelos).",
        "Colar si se quiere más fino y enfriar en la nevera al menos 30 minutos.",
        "Cocer el huevo 10 minutos, picarlo y servirlo por encima."
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Remojar pan abundante en agua.",
        "Triturar el tomate con el pan, un diente de ajo pequeño y aceite de oliva hasta que quede una crema espesa y lisa.",
        "Enfriar en la nevera al menos 30 minutos.",
        "Servir con huevo duro picado por encima (y virutas de jamón serrano si tienes)."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír cebolla y ajo picados en aceite de oliva.",
        "Añadir {verdura} en dados pequeños y rehogar 10 minutos.",
        "Incorporar tomate triturado y cocinar 15 minutos a fuego medio hasta que pierda el agua.",
        "Rematar con {proteina} (huevo frito o escalfado encima, o atún integrado).",
        "Servir con pan."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Hacer una bechamel espesa: mantequilla, harina y leche, removiendo 8-10 minutos.",
        "Picar muy fino {proteina} e integrarlo en la bechamel; salpimentar.",
        "Enfriar la masa en la nevera (mínimo 2 horas, mejor de víspera).",
        "Formar las croquetas y pasarlas por huevo y pan rallado.",
        "Freír en aceite caliente hasta dorar (o al horno/airfryer con un hilo de aceite)."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír {proteina} en la paellera o sartén amplia y reservar.",
        "En el mismo aceite, hacer un sofrito con ajo y {verdura}.",
        "Tostar los fideos 2 minutos en el sofrito.",
        "Cubrir con caldo caliente y cocer 8-10 minutos sin remover.",
        "Devolver {proteina}, apagar y reposar 3 minutos."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Dorar el pollo troceado y salpimentado; reservar.",
        "En el mismo aceite, sofreír cebolla, ajo y {verdura} en tiras.",
        "Devolver el pollo, mojar con medio vaso de agua (o vino blanco) y guisar tapado 20-25 minutos.",
        "Servir con {hidrato}."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Sofreír cebolla, ajo y {verdura} picadas en la cazuela.",
        "Añadir el chorizo en rodajas y dar unas vueltas.",
        "Incorporar las pochas (o alubias cocidas) y cubrir justo de agua.",
        "Cocer suave 15-20 minutos moviendo la cazuela, sin remover con cuchara.",
        "Reposar unos minutos antes de servir."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Si las fabes son secas, remojo de la víspera (con bote, saltar este paso).",
        "Poner las fabes cubiertas de agua fría con el compango entero.",
        "Llevar a hervor, espumar y cocer a fuego muy suave 1h30 (bote: 40 minutos), moviendo la olla de vez en cuando, sin remover.",
        "\"Asustar\" con un chorrito de agua fría un par de veces durante la cocción.",
        "Reposar 10 minutos, trocear el compango y servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Salpimentar dos filetes finos de ternera por cachopo.",
        "Montar jamón y queso entre los dos filetes y sellar bien los bordes.",
        "Empanar: harina, huevo batido y pan rallado.",
        "Freír en aceite caliente 3-4 minutos por cara hasta dorar; escurrir sobre papel.",
        "Acompañar con {hidrato} y {verdura}."
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Hacer un sofrito lento de cebolla abundante y {verdura}.",
        "Mezclar el sofrito con el atún desmigado.",
        "Extender una lámina de masa, repartir el relleno y cubrir con la otra lámina, sellando los bordes.",
        "Pintar con huevo batido y pinchar el centro.",
        "Hornear 30-35 minutos a 180°C hasta dorar."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Rehogar el puerro en rodajas con un poco de aceite.",
        "Añadir la patata en trozos cascados (no cortados del todo, para que suelte fécula).",
        "Cubrir con agua o caldo y cocer 15 minutos.",
        "Añadir el bacalao desmigado, cocer 5 minutos más y servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Sofreír cebolla y el pimiento en tiras a fuego medio hasta que estén muy tiernos.",
        "Añadir tomate rallado y reducir 10 minutos.",
        "Hacer los huevos encima (escalfados en la propia salsa o a la plancha).",
        "Servir con pan."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Pochar cebolla picada en aceite de oliva.",
        "Añadir el calabacín en medias lunas finas y hacer a fuego medio hasta muy tierno.",
        "Batir los huevos, añadirlos y cuajar removiendo suave — queda cremoso, no tortilla.",
        "Salpimentar y servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Escurrir y trocear el tomate (pelado en conserva, la versión clásica) en un bol.",
        "Añadir {proteina} y cebolla tierna picada.",
        "Aliñar con aceite de oliva y sal (un puñado de aceitunas negras si tienes).",
        "Servir fría con pan."
      ],
      "grupos": [
        "proteina",
        "hidrato",
        "verdura"
      ],
      "ingredientes": {
        "eje": "proteina",
        "opciones": [
          "atun",
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Enharinar filetes finos de ternera y dorarlos; reservar.",
        "Hacer un sofrito lento de cebolla y tomate rallado.",
        "Devolver la carne con las setas y cubrir con caldo.",
        "Guisar tapado 45-60 minutos hasta que la carne esté melosa.",
        "Servir con {hidrato}."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Freír la patata en rodajas y colocarla de base en una fuente.",
        "Freír {verdura} en rodajas y montar capas encima.",
        "Cubrir con salsa de tomate.",
        "Hornear 10 minutos para asentar.",
        "Rematar con {proteina} (huevo frito o bacalao a la plancha)."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cocer papas pequeñas con piel en agua muy salada hasta que estén tiernas.",
        "Escurrir y secar al fuego un par de minutos hasta que la piel se arrugue.",
        "Mojo rojo: triturar el pimiento con ajo, pimentón, comino, vinagre y aceite.",
        "Hacer {proteina} (huevo duro o merluza a la plancha).",
        "Servir todo junto, con el mojo por encima de las papas."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Dorar {proteina} en tiras o desmenuzada.",
        "Sofreír cebolla, ajo y {verdura}.",
        "Añadir los garbanzos cocidos y un toque de pimentón.",
        "Saltear todo junto 10 minutos (con patata frita en dados si quieres la versión completa).",
        "Rectificar de sal y servir."
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Cocer la patata y, los últimos 5 minutos, el bacalao desalado.",
        "Machacar la patata con ajo y el bacalao desmigado.",
        "Ligar con aceite de oliva a hilo fino hasta conseguir un puré meloso.",
        "Probar de sal y servir templado, con huevo duro en rodajas y nueces si tienes."
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Dorar láminas de ajo en aceite de oliva en una cazuela.",
        "Añadir pimentón, remover y echar el pan en láminas finas.",
        "Mojar con caldo o agua y hervir 10 minutos.",
        "Escalfar los huevos dentro 3-4 minutos y servir muy caliente."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "La víspera, trocear el pan asentado y humedecerlo con agua y un paño.",
        "Freír {proteina} en trozos y reservar.",
        "En esa misma grasa, dorar ajos enteros y el pimiento en tiras.",
        "Añadir el pan y mover sin parar 15-20 minutos hasta que queden migas sueltas.",
        "Devolver {proteina}, mezclar y servir."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Pochar cebolla abundante en juliana a fuego suave 15 minutos.",
        "Añadir el pimiento en tiras y hacer 5 minutos más.",
        "Subir el fuego y añadir el bonito en tacos, vuelta y vuelta — que quede jugoso.",
        "Un chorrito de vinagre o vino blanco, mezclar y servir con {hidrato}."
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cocer el pollo (o aprovechar restos de asado) y desmenuzarlo.",
        "Cocer la patata en dados hasta que esté tierna.",
        "Picar {verdura} fina.",
        "Mezclar todo con una vinagreta de aceite, vinagre y sal.",
        "Enfriar 15 minutos en la nevera y servir frío."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/crema-zanahoria.jpg",
      "pasos": [
        "Sofreír cebolla, ajo y una cucharadita de pimentón.",
        "Añadir {verdura} troceada y rehogar unos minutos.",
        "Incorporar las legumbres cocidas y cubrir con agua o caldo.",
        "Añadir un puñado de arroz y cocer 15-18 minutos.",
        "Reposar 5 minutos antes de servir."
      ],
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
      "nombre": "Soldaditos de Pavía (bacalao rebozado)",
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cortar el bacalao desalado en tiras y secarlas bien.",
        "Rebozar en harina y huevo batido (o gabardina con un poco de levadura).",
        "Freír en aceite bien caliente hasta dorar.",
        "Escurrir sobre papel y servir con tiras de pimiento asado y pan."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Dorar la patata en rodajas finas y el puerro en una cazuela amplia.",
        "Colocar {proteina} encima y salpimentar.",
        "Regar con un buen vaso de sidra natural.",
        "Cocer tapado 8-10 minutos hasta que el pescado esté jugoso.",
        "Servir con el jugo de la cazuela."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Limpiar las truchas abiertas y salpimentar.",
        "Rellenar cada una con un par de lonchas de jamón serrano.",
        "Enharinar ligero y freír 3-4 minutos por lado.",
        "Acompañar con {hidrato} cocida o panadera."
      ],
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
      "ninos": true,
      "foto": "assets/banco-fotos/plancha-guarnicion.jpg",
      "pasos": [
        "Cortar la patata en bastones o rodajas finas y salar.",
        "Freír la patata en aceite abundante a fuego medio hasta que esté tierna; subir el fuego al final para dorarla y escurrir sobre papel.",
        "En el mismo aceite bien caliente, freír los huevos de uno en uno regando la yema con la puntilla hecha.",
        "Servir los huevos sobre las patatas y romper la yema en la mesa."
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
      "ninos": true,
      "foto": "assets/banco-fotos/salteado-wok.jpg",
      "pasos": [
        "Quitar las puntas y los hilos de las judías y trocearlas.",
        "Cocer las judías con la patata en dados en agua con sal, 15-18 minutos, hasta que ambas estén tiernas.",
        "Cocer el huevo aparte 10 minutos y pelarlo.",
        "Escurrir, aliñar en caliente con un buen chorro de aceite de oliva crudo y servir con el huevo en cuartos por encima."
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
      "ninos": true,
      "foto": "assets/banco-fotos/ensalada-lentejas.jpg",
      "pasos": [
        "Cortar el pan en rebanadas, mejor un poco tostadas.",
        "Frotar con tomate maduro, un hilo de aceite y una pizca de sal.",
        "Montar la tabla: {proteina} y el queso que os guste.",
        "A la mesa — cero fogones."
      ],
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
          "champinones"
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
      "id": "ensalada-verde",
      "nombre": "Ensalada de lechuga y {verdura}",
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
          "pepino",
          "zanahoria",
          "pimiento"
        ],
        "fijos": {
          "verdura": [
            "lechuga"
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
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
    },
    {
      "principalId": "ensalada-pasta",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "ensalada-pasta",
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
    },
    {
      "principalId": "quinoa-ensalada",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "quinoa-ensalada",
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
    },
    {
      "principalId": "cachopo",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "cachopo",
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
    },
    {
      "principalId": "sopa-castellana",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "sopa-castellana",
      "complementariaFamilia": "ensalada-verde"
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
      "complementariaFamilia": "ensalada-verde"
    },
    {
      "principalId": "huevos-fritos-con-patatas",
      "complementariaFamilia": "ensalada-solo"
    },
    {
      "principalId": "huevos-fritos-con-patatas",
      "complementariaFamilia": "ensalada-verde"
    },
    {
      "principalId": "cena-de-tabla",
      "complementariaFamilia": "pan-mojar"
    }
  ],
  "postres": {
    "frutas_mes": {
      "1": [
        "naranja",
        "mandarina",
        "kiwi",
        "manzana",
        "pera",
        "platano"
      ],
      "2": [
        "naranja",
        "mandarina",
        "kiwi",
        "fresa"
      ],
      "3": [
        "fresa",
        "naranja",
        "kiwi"
      ],
      "4": [
        "fresa",
        "kiwi",
        "platano"
      ],
      "5": [
        "fresa",
        "cereza",
        "albaricoque",
        "melon"
      ],
      "6": [
        "cereza",
        "albaricoque",
        "melon",
        "sandia"
      ],
      "7": [
        "sandia",
        "melon",
        "melocoton",
        "cereza"
      ],
      "8": [
        "sandia",
        "melon",
        "melocoton",
        "uva"
      ],
      "9": [
        "uva",
        "melocoton",
        "manzana",
        "pera"
      ],
      "10": [
        "uva",
        "caqui",
        "manzana",
        "pera",
        "mandarina"
      ],
      "11": [
        "mandarina",
        "naranja",
        "caqui",
        "manzana",
        "pera"
      ],
      "12": [
        "mandarina",
        "naranja",
        "caqui",
        "manzana",
        "pera"
      ]
    },
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
  }
};
  if (typeof module !== 'undefined' && module.exports) module.exports = window.E3_RECETAS;
})(typeof window !== 'undefined' ? window : (typeof global !== 'undefined' ? global : this));
