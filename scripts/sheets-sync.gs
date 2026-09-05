/**
 * Sincroniza las finanzas de Rosea Beauty (Supabase) hacia esta hoja de
 * calculo. La fuente de verdad sigue siendo el dashboard: este script solo
 * copia. Cada corrida reescribe las pestanas enteras (contenido y estilos),
 * asi que no hay filas duplicadas ni drift visual entre corridas.
 *
 * Instalar:
 *   1. En la Google Sheet: Extensiones > Apps Script, pegar este archivo.
 *   2. Configuracion del proyecto > Propiedades del script, cargar:
 *        SUPABASE_URL       https://TU-PROYECTO.supabase.co
 *        SUPABASE_ANON_KEY  la anon key (la misma del .env.local)
 *        SUPABASE_EMAIL     usuario de Supabase Auth con permiso de lectura
 *        SUPABASE_PASSWORD  su contrasena
 *   3. Ejecutar instalarTrigger() una vez: deja la sincro cada 1 hora.
 *
 * Se entra con email y contrasena, no con la service_role key: asi el script
 * lee exactamente lo mismo que ve ese usuario en el dashboard y las policies
 * de RLS siguen valiendo. Conviene crear un usuario aparte solo para esto.
 */

var PESTANA_PANEL = "Panel";
var PESTANA_VENTAS = "Ventas";
var PESTANA_GASTOS = "Gastos";
var PESTANA_RESUMEN = "Resumen mensual";
var PESTANA_CLIENTAS = "Clientas";
var PESTANA_PEDIDOS = "Pedidos";
var PESTANA_PUBLICACIONES = "Contenido";
var PESTANA_TAREAS = "Tareas";

// Paleta de marca (misma escala que app/globals.css: --color-rosea-*).
// Para el grafico de 2 series se reutilizan #c1554a / #4a7fb5 en vez de dos
// tonos rosea: los tonos de marca tienen muy poco croma entre si y fallaban
// el chequeo de daltonismo del dashboard web (ver GraficoEvolucion.tsx). El
// resto de la hoja — encabezados, tarjetas, bordes — si usa la paleta rosea.
var COLOR = {
  fondo: "#faf1ef", // rosea-50
  claro: "#edc7c0", // rosea-100
  medio: "#d5998f", // rosea-300
  acento: "#bd7c72", // rosea-500
  oscuro: "#8f5a52", // rosea-700
  texto: "#262626",
  textoSuave: "#8a8a8a",
  blanco: "#ffffff",
  ventas: "#c1554a",
  gastos: "#4a7fb5",
  positivo: "#2e7d4f",
  negativo: "#c0392b",
};

var FUENTE = "Jost";

var MESES_ES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

function sincronizar() {
  var config = leerConfig();
  var token = iniciarSesion(config);

  var ventas = consultar(
    config,
    token,
    "/rest/v1/ventas?select=*,venta_items(*)&order=fecha.desc"
  );
  var gastos = consultar(
    config,
    token,
    "/rest/v1/gastos?select=*&order=fecha.desc"
  );

  // El resto de la gestion (no es finanzas, pero igual necesita backup fuera
  // de Supabase): clientas, pedidos, contenido y tareas no tenian espejo.
  var clientas = consultar(
    config,
    token,
    "/rest/v1/clientas?select=*&order=nombre"
  );
  var pedidos = consultar(
    config,
    token,
    "/rest/v1/pedidos?select=*,pedido_items(*)&order=fecha.desc"
  );
  var publicaciones = consultar(
    config,
    token,
    "/rest/v1/publicaciones?select=*,publicacion_productos(producto_id)&order=fecha.desc"
  );
  var tareas = consultar(
    config,
    token,
    "/rest/v1/tareas?select=*&order=created_at.desc"
  );
  // Solo para resolver nombres (cliente_id -> nombre, producto_id -> nombre):
  // pedidos ya guarda un snapshot del nombre del producto en cada item, pero
  // publicacion_productos y pedidos.cliente_id son solo el id.
  var productos = consultar(
    config,
    token,
    "/rest/v1/productos?select=id,nombre"
  );

  // Un solo calculo mensual, reusado por la tabla de Resumen y por las
  // tarjetas + grafico del Panel: evita que las dos vistas puedan divergir.
  var mesesAsc = calcularResumenMensual(ventas, gastos);

  escribirVentas(ventas);
  escribirGastos(gastos);
  escribirResumenMensual(mesesAsc);
  escribirPanel(mesesAsc);
  escribirClientas(clientas);
  escribirPedidos(pedidos, clientas);
  escribirPublicaciones(publicaciones, productos);
  escribirTareas(tareas);
  ordenarPestanas();
  renombrarLibro();
}

function instalarTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "sincronizar") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("sincronizar").timeBased().everyHours(1).create();
  sincronizar();
}

function leerConfig() {
  var props = PropertiesService.getScriptProperties();
  // trim(): pegar en el campo de Propiedades del script suele colar un
  // espacio o salto de linea invisible al final, y eso rompe el login sin
  // ningun aviso claro (Supabase responde "invalid_credentials" igual que
  // si la contraseña estuviera mal).
  function limpio(clave) {
    var valor = props.getProperty(clave);
    return valor ? valor.trim() : valor;
  }
  var config = {
    url: limpio("SUPABASE_URL"),
    anon: limpio("SUPABASE_ANON_KEY"),
    email: limpio("SUPABASE_EMAIL"),
    password: limpio("SUPABASE_PASSWORD"),
  };
  for (var clave in config) {
    if (!config[clave]) {
      throw new Error(
        "Falta una propiedad del script. Cargá SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_EMAIL y SUPABASE_PASSWORD."
      );
    }
  }
  return config;
}

function iniciarSesion(config) {
  var respuesta = UrlFetchApp.fetch(
    config.url + "/auth/v1/token?grant_type=password",
    {
      method: "post",
      contentType: "application/json",
      headers: { apikey: config.anon },
      payload: JSON.stringify({
        email: config.email,
        password: config.password,
      }),
      muteHttpExceptions: true,
    }
  );
  if (respuesta.getResponseCode() !== 200) {
    throw new Error("No se pudo iniciar sesión en Supabase: " + respuesta.getContentText());
  }
  return JSON.parse(respuesta.getContentText()).access_token;
}

function consultar(config, token, ruta) {
  var respuesta = UrlFetchApp.fetch(config.url + ruta, {
    method: "get",
    headers: {
      apikey: config.anon,
      Authorization: "Bearer " + token,
    },
    muteHttpExceptions: true,
  });
  if (respuesta.getResponseCode() !== 200) {
    throw new Error("Error leyendo " + ruta + ": " + respuesta.getContentText());
  }
  return JSON.parse(respuesta.getContentText());
}

function nombreMes(mes) {
  var partes = mes.split("-");
  return MESES_ES[Number(partes[1]) - 1] + " " + partes[0];
}

function mesCorto(mes) {
  return MESES_ES[Number(mes.split("-")[1]) - 1].slice(0, 3);
}

// Mismo criterio que el dashboard: caja resta todo lo que salio; ganancia
// resta el costo de lo vendido mas los gastos que no son compra de stock,
// para no contar la mercaderia dos veces. Devuelve los meses en orden
// cronologico ascendente (mas viejo primero) — el orden que necesita un
// grafico de barras leido de izquierda a derecha.
function calcularResumenMensual(ventas, gastos) {
  var meses = {};

  function mesDe(fecha) {
    return String(fecha).slice(0, 7);
  }

  function fila(mes) {
    if (!meses[mes]) {
      meses[mes] = {
        mes: mes,
        ingresos: 0,
        unidades: 0,
        costoVendido: 0,
        gastosTotal: 0,
        gastosMercaderia: 0,
      };
    }
    return meses[mes];
  }

  ventas.forEach(function (venta) {
    var f = fila(mesDe(venta.fecha));
    (venta.venta_items || []).forEach(function (item) {
      f.ingresos += item.precio_unitario * item.cantidad;
      f.costoVendido += item.costo_unitario * item.cantidad;
      f.unidades += item.cantidad;
    });
  });

  gastos.forEach(function (g) {
    var f = fila(mesDe(g.fecha));
    f.gastosTotal += g.monto;
    if (g.categoria === "Mercaderia") f.gastosMercaderia += g.monto;
  });

  return Object.keys(meses)
    .sort()
    .map(function (mes) {
      var f = meses[mes];
      var operativos = f.gastosTotal - f.gastosMercaderia;
      var ganancia = f.ingresos - f.costoVendido - operativos;
      return {
        mes: mes,
        ingresos: f.ingresos,
        unidades: f.unidades,
        costoVendido: f.costoVendido,
        gastosTotal: f.gastosTotal,
        gastosMercaderia: f.gastosMercaderia,
        gastosOperativos: operativos,
        resultadoCaja: f.ingresos - f.gastosTotal,
        gananciaMargen: ganancia,
        margenPct: f.ingresos === 0 ? null : Math.round((ganancia / f.ingresos) * 100),
      };
    });
}

// --- Helpers de estilo, reusados por las 4 pestañas ---

// Toma o crea la pestaña y la deja en blanco: contenido, formato Y
// bandas/filtros/merges previos. hoja.clear() borra contenido y formato pero
// NO bandas, filtros ni celdas combinadas — sin esto, la segunda corrida
// tira error "ya existe una banda en ese rango" o deja merges fantasma.
function prepararHoja(nombre) {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(nombre);
  if (!hoja) hoja = libro.insertSheet(nombre);
  hoja.clear();
  hoja.getBandings().forEach(function (b) {
    b.remove();
  });
  if (hoja.getFilter()) hoja.getFilter().remove();
  hoja.getCharts().forEach(function (c) {
    hoja.removeChart(c);
  });
  var filas = Math.max(hoja.getMaxRows(), 1);
  var cols = Math.max(hoja.getMaxColumns(), 1);
  hoja.getRange(1, 1, filas, cols).breakApart();
  return hoja;
}

function estilarEncabezado(rango) {
  rango
    .setBackground(COLOR.oscuro)
    .setFontColor(COLOR.blanco)
    .setFontWeight("bold")
    .setFontFamily(FUENTE)
    .setVerticalAlignment("middle");
}

function formatoMoneda(rango) {
  rango.setNumberFormat("$#,##0");
}

// Bandas alternadas en la paleta de marca en vez del gris por defecto de
// Sheets — blanco / rosea-50, con el encabezado ya pintado por separado.
function aplicarBandas(rango) {
  var banda = rango.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, true, false);
  banda.setHeaderRowColor(COLOR.oscuro);
  banda.setFirstRowColor(COLOR.blanco);
  banda.setSecondRowColor(COLOR.fondo);
}

// Alto de fila mas generoso que el default de Sheets (21px): con encabezado
// a 30px y filas de datos al default, el contenido tocaba el borde de la
// celda y se veia amontonado apenas se completaba con datos reales.
function ajustarFilasDatos(hoja, cantidadFilas) {
  if (cantidadFilas === 0) return;
  hoja.setRowHeights(2, cantidadFilas, 26);
  hoja.getRange(2, 1, cantidadFilas, hoja.getMaxColumns()).setVerticalAlignment("middle");
}

// autoResizeColumns ajusta cada columna al pixel justo del contenido, sin
// margen alrededor. Se llama al final, despues de cualquier ancho manual
// (ej: Nota, Producto), para que tambien esas columnas queden con aire.
function agregarAireColumnas(hoja, cols) {
  for (var c = 1; c <= cols; c++) {
    hoja.setColumnWidth(c, hoja.getColumnWidth(c) + 16);
  }
}

function estilarFilaTotal(rango) {
  rango
    .setFontWeight("bold")
    .setFontFamily(FUENTE)
    .setBackground(COLOR.claro)
    .setBorder(true, null, null, null, null, null, COLOR.oscuro, SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
}

// --- Ventas ---

function escribirVentas(ventas) {
  var encabezados = [
    "Fecha", "Clienta", "Canal", "Producto", "Cantidad",
    "Precio unitario", "Total renglón", "Costo unitario",
    "Ganancia renglón", "Nota", "ID venta",
  ];
  var filas = [];
  ventas.forEach(function (venta) {
    (venta.venta_items || []).forEach(function (item) {
      filas.push([
        venta.fecha,
        venta.cliente || "",
        venta.canal,
        item.nombre,
        item.cantidad,
        item.precio_unitario,
        item.precio_unitario * item.cantidad,
        item.costo_unitario,
        (item.precio_unitario - item.costo_unitario) * item.cantidad,
        venta.nota || "",
        venta.id,
      ]);
    });
  });

  var hoja = prepararHoja(PESTANA_VENTAS);
  var cols = encabezados.length;
  hoja.getRange(1, 1, 1, cols).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, cols).setValues(filas);
    ajustarFilasDatos(hoja, filas.length);

    var totalCant = 0, totalVenta = 0, totalGanancia = 0;
    filas.forEach(function (f) {
      totalCant += f[4];
      totalVenta += f[6];
      totalGanancia += f[8];
    });
    var filaTotal = filas.length + 2;
    hoja.getRange(filaTotal, 1, 1, 4).merge().setValue("TOTAL").setHorizontalAlignment("right");
    hoja.getRange(filaTotal, 5).setValue(totalCant);
    hoja.getRange(filaTotal, 7).setValue(totalVenta);
    hoja.getRange(filaTotal, 9).setValue(totalGanancia);
    estilarFilaTotal(hoja.getRange(filaTotal, 1, 1, cols));
    formatoMoneda(hoja.getRange(filaTotal, 6, 1, 4));

    formatoMoneda(hoja.getRange(2, 6, filas.length, 4));
    // ID venta es un dato tecnico de cruce, no algo que se lea: se achica y
    // se apaga para que no compita visualmente con las columnas que importan.
    hoja.getRange(2, 11, filas.length, 1).setFontColor(COLOR.textoSuave).setFontSize(9);

    aplicarBandas(hoja.getRange(1, 1, filas.length + 1, cols));
    hoja.getRange(1, 1, filas.length + 1, cols).createFilter();
  }

  estilarEncabezado(hoja.getRange(1, 1, 1, cols));
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).setFontFamily(FUENTE);
  hoja.setFrozenRows(1);
  hoja.setFrozenColumns(1);
  hoja.setRowHeight(1, 30);
  hoja.autoResizeColumns(1, cols);
  hoja.setColumnWidth(4, Math.max(hoja.getColumnWidth(4), 200)); // Producto
  hoja.setColumnWidth(10, Math.max(hoja.getColumnWidth(10), 160)); // Nota
  agregarAireColumnas(hoja, cols);
}

// --- Gastos ---

function escribirGastos(gastos) {
  var encabezados = ["Fecha", "Categoría", "Descripción", "Monto"];
  var filas = gastos.map(function (g) {
    return [g.fecha, g.categoria, g.descripcion, g.monto];
  });

  var hoja = prepararHoja(PESTANA_GASTOS);
  var cols = encabezados.length;
  hoja.getRange(1, 1, 1, cols).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, cols).setValues(filas);
    ajustarFilasDatos(hoja, filas.length);

    var totalMonto = filas.reduce(function (t, f) { return t + f[3]; }, 0);
    var filaTotal = filas.length + 2;
    hoja.getRange(filaTotal, 1, 1, 3).merge().setValue("TOTAL").setHorizontalAlignment("right");
    hoja.getRange(filaTotal, 4).setValue(totalMonto);
    estilarFilaTotal(hoja.getRange(filaTotal, 1, 1, cols));
    formatoMoneda(hoja.getRange(filaTotal, 4));

    formatoMoneda(hoja.getRange(2, 4, filas.length, 1));
    aplicarBandas(hoja.getRange(1, 1, filas.length + 1, cols));
    hoja.getRange(1, 1, filas.length + 1, cols).createFilter();
  }

  estilarEncabezado(hoja.getRange(1, 1, 1, cols));
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).setFontFamily(FUENTE);
  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 30);
  hoja.autoResizeColumns(1, cols);
  hoja.setColumnWidth(3, Math.max(hoja.getColumnWidth(3), 220)); // Descripción
  agregarAireColumnas(hoja, cols);
}

// --- Resumen mensual ---

function escribirResumenMensual(mesesAsc) {
  var encabezados = [
    "Mes", "Ventas", "Unidades", "Costo vendido", "Gastos totales",
    "Gastos mercadería", "Gastos operativos", "Resultado de caja",
    "Ganancia (margen)", "Margen %",
  ];
  // Descendente para la tabla: el mes mas reciente arriba, igual que Ventas
  // y Gastos.
  var desc = mesesAsc.slice().reverse();
  var filas = desc.map(function (f) {
    return [
      nombreMes(f.mes), f.ingresos, f.unidades, f.costoVendido, f.gastosTotal,
      f.gastosMercaderia, f.gastosOperativos, f.resultadoCaja, f.gananciaMargen,
      f.margenPct === null ? "" : f.margenPct + "%",
    ];
  });

  var hoja = prepararHoja(PESTANA_RESUMEN);
  var cols = encabezados.length;
  hoja.getRange(1, 1, 1, cols).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, cols).setValues(filas);
    ajustarFilasDatos(hoja, filas.length);
    formatoMoneda(hoja.getRange(2, 2, filas.length, 1));
    formatoMoneda(hoja.getRange(2, 4, filas.length, 5));

    // Meses en rojo si dieron negativo: es la fila que mas importa detectar
    // rapido al abrir la hoja, no algo que haya que ponerse a leer numero
    // por numero.
    desc.forEach(function (f, i) {
      var fila = i + 2;
      if (f.resultadoCaja < 0) {
        hoja.getRange(fila, 8).setFontColor(COLOR.negativo).setFontWeight("bold");
      }
      if (f.gananciaMargen < 0) {
        hoja.getRange(fila, 9).setFontColor(COLOR.negativo).setFontWeight("bold");
      }
    });

    aplicarBandas(hoja.getRange(1, 1, filas.length + 1, cols));
    hoja.getRange(1, 1, filas.length + 1, cols).createFilter();
  }

  estilarEncabezado(hoja.getRange(1, 1, 1, cols));
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).setFontFamily(FUENTE);
  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 30);
  hoja.autoResizeColumns(1, cols);
  agregarAireColumnas(hoja, cols);
}

// --- Panel: portada con KPIs del mes y grafico de evolucion ---

function escribirPanel(mesesAsc) {
  var hoja = prepararHoja(PESTANA_PANEL);
  var ULTIMA_COL = 8; // A..H

  hoja.getRange(1, 1, hoja.getMaxRows(), ULTIMA_COL).setFontFamily(FUENTE);

  // Barra de titulo.
  hoja.getRange(1, 1, 1, ULTIMA_COL).merge();
  hoja.getRange(1, 1)
    .setValue("Rosea Beauty · Panel de finanzas")
    .setFontFamily(FUENTE)
    .setFontSize(20)
    .setFontWeight("bold")
    .setFontColor(COLOR.blanco)
    .setBackground(COLOR.oscuro)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("left");
  hoja.setRowHeight(1, 48);

  hoja.getRange(2, 1, 1, ULTIMA_COL).merge();
  hoja.getRange(2, 1)
    .setValue(
      "Actualizado " +
        Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "dd/MM/yyyy HH:mm")
    )
    .setFontStyle("italic")
    .setFontColor(COLOR.textoSuave)
    .setFontSize(10);
  hoja.setRowHeight(2, 22);

  if (mesesAsc.length === 0) {
    hoja.getRange(4, 1)
      .setValue("Todavía no hay ventas ni gastos cargados.")
      .setFontColor(COLOR.textoSuave);
    hoja.setColumnWidth(1, 220);
    return;
  }

  var actual = mesesAsc[mesesAsc.length - 1];
  var anterior = mesesAsc.length > 1 ? mesesAsc[mesesAsc.length - 2] : null;

  function variacion(nuevo, viejo) {
    if (!viejo || viejo === 0) return null;
    return Math.round(((nuevo - viejo) / Math.abs(viejo)) * 100);
  }

  var tarjetas = [
    {
      titulo: "VENTAS · " + nombreMes(actual.mes).toUpperCase(),
      valor: actual.ingresos,
      variacion: anterior ? variacion(actual.ingresos, anterior.ingresos) : null,
    },
    {
      titulo: "GANANCIA (MARGEN)",
      valor: actual.gananciaMargen,
      sufijo: actual.margenPct === null ? "sin ventas todavía" : actual.margenPct + "% de lo vendido",
    },
    {
      titulo: "GASTOS DEL MES",
      valor: actual.gastosTotal,
      variacion: anterior ? variacion(actual.gastosTotal, anterior.gastosTotal) : null,
    },
    {
      titulo: "RESULTADO DE CAJA",
      valor: actual.resultadoCaja,
      sufijo: actual.unidades + " unidad" + (actual.unidades === 1 ? "" : "es") + " vendidas",
    },
  ];

  // 4 tarjetas en fila, 2 columnas de ancho cada una (A-B, C-D, E-F, G-H).
  var filaInicio = 4;
  var altoTarjeta = 4;
  tarjetas.forEach(function (t, i) {
    var col = i * 2 + 1;
    hoja.getRange(filaInicio, col, 1, 2).merge()
      .setValue(t.titulo)
      .setFontSize(9)
      .setFontWeight("bold")
      .setFontColor(COLOR.oscuro)
      .setBackground(COLOR.fondo)
      .setHorizontalAlignment("center");

    hoja.getRange(filaInicio + 1, col, 2, 2).merge()
      .setValue(t.valor)
      .setNumberFormat("$#,##0")
      .setFontSize(22)
      .setFontWeight("bold")
      .setFontColor(t.valor < 0 ? COLOR.negativo : COLOR.texto)
      .setBackground(COLOR.fondo)
      .setHorizontalAlignment("center")
      .setVerticalAlignment("middle");

    var pie = "";
    if (t.sufijo) pie = t.sufijo;
    else if (t.variacion !== null && t.variacion !== undefined) {
      pie = (t.variacion >= 0 ? "▲ " : "▼ ") + Math.abs(t.variacion) + "% vs mes anterior";
    } else {
      pie = "sin mes anterior";
    }
    var celdaPie = hoja.getRange(filaInicio + 3, col, 1, 2).merge()
      .setValue(pie)
      .setFontSize(9)
      .setBackground(COLOR.fondo)
      .setHorizontalAlignment("center");
    if (t.variacion !== null && t.variacion !== undefined) {
      celdaPie.setFontColor(t.variacion >= 0 ? COLOR.positivo : COLOR.negativo);
    } else {
      celdaPie.setFontColor(COLOR.textoSuave);
    }
  });
  for (var r = filaInicio; r < filaInicio + altoTarjeta; r++) hoja.setRowHeight(r, r === filaInicio + 1 ? 30 : 22);
  hoja.getRange(filaInicio, 1, altoTarjeta, ULTIMA_COL)
    .setBorder(true, true, true, true, true, true, COLOR.claro, SpreadsheetApp.BorderStyle.SOLID);

  // Mini tabla de evolucion (hasta 6 meses, cronologico) que alimenta el
  // grafico de abajo — a la vista, no oculta, para que tambien se pueda leer
  // el numero exacto sin entrar a Resumen mensual.
  var filaTabla = filaInicio + altoTarjeta + 2;
  hoja.getRange(filaTabla, 1)
    .setValue("Evolución (últimos meses)")
    .setFontWeight("bold")
    .setFontColor(COLOR.oscuro)
    .setFontSize(12);

  var ultimos = mesesAsc.slice(Math.max(mesesAsc.length - 6, 0));
  var filaEncabezado = filaTabla + 1;
  hoja.getRange(filaEncabezado, 1, 1, 3).setValues([["Mes", "Ventas", "Gastos"]]);
  var datosGrafico = ultimos.map(function (f) {
    return [mesCorto(f.mes), f.ingresos, f.gastosTotal];
  });
  hoja.getRange(filaEncabezado + 1, 1, datosGrafico.length, 3).setValues(datosGrafico);

  var rangoTabla = hoja.getRange(filaEncabezado, 1, datosGrafico.length + 1, 3);
  estilarEncabezado(hoja.getRange(filaEncabezado, 1, 1, 3));
  formatoMoneda(hoja.getRange(filaEncabezado + 1, 2, datosGrafico.length, 2));
  aplicarBandas(rangoTabla);

  var grafico = hoja.newChart()
    .setChartType(Charts.ChartType.COLUMN)
    .addRange(rangoTabla)
    .setNumHeaders(1)
    .setPosition(filaTabla, 5, 0, 0)
    .setOption("title", "Ventas y gastos por mes")
    .setOption("titleTextStyle", { color: COLOR.oscuro, bold: true, fontName: FUENTE })
    .setOption("colors", [COLOR.ventas, COLOR.gastos])
    .setOption("legend", { position: "top" })
    .setOption("backgroundColor", COLOR.blanco)
    .setOption("width", 460)
    .setOption("height", 260)
    .build();
  hoja.insertChart(grafico);

  hoja.setColumnWidths(1, ULTIMA_COL, 110);
}

// --- Clientas ---

function escribirClientas(clientas) {
  var encabezados = ["Nombre", "Contacto", "Nota"];
  var filas = clientas.map(function (c) {
    return [c.nombre, c.contacto || "", c.nota || ""];
  });

  var hoja = prepararHoja(PESTANA_CLIENTAS);
  var cols = encabezados.length;
  hoja.getRange(1, 1, 1, cols).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, cols).setValues(filas);
    ajustarFilasDatos(hoja, filas.length);
    aplicarBandas(hoja.getRange(1, 1, filas.length + 1, cols));
    hoja.getRange(1, 1, filas.length + 1, cols).createFilter();
  }

  estilarEncabezado(hoja.getRange(1, 1, 1, cols));
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).setFontFamily(FUENTE);
  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 30);
  hoja.autoResizeColumns(1, cols);
  hoja.setColumnWidth(3, Math.max(hoja.getColumnWidth(3), 220)); // Nota
  agregarAireColumnas(hoja, cols);
}

// --- Pedidos ---

// Una fila por pedido (no por item, a diferencia de Ventas): la seña y el
// saldo son datos del pedido entero, repetirlos por renglon de item
// insinuaria que se pueden sumar y duplicaria el total.
function escribirPedidos(pedidos, clientas) {
  var encabezados = [
    "Fecha", "Cliente", "Estado", "Productos", "Total estimado",
    "Seña", "Saldo", "Nota", "ID venta vinculada",
  ];

  function nombreDe(p) {
    if (p.cliente_id) {
      var c = clientas.filter(function (x) { return x.id === p.cliente_id; })[0];
      return c ? c.nombre : "Sin nombre";
    }
    return p.cliente_texto || "Sin nombre";
  }

  var filas = pedidos.map(function (p) {
    var items = p.pedido_items || [];
    var total = items.reduce(function (t, i) {
      return t + i.precio_estimado * i.cantidad;
    }, 0);
    var textoItems = items
      .map(function (i) { return i.cantidad + "× " + i.nombre; })
      .join(", ");
    return [
      p.fecha,
      nombreDe(p),
      p.estado,
      textoItems,
      total,
      p.sena,
      Math.max(total - p.sena, 0),
      p.nota || "",
      p.venta_id || "",
    ];
  });

  var hoja = prepararHoja(PESTANA_PEDIDOS);
  var cols = encabezados.length;
  hoja.getRange(1, 1, 1, cols).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, cols).setValues(filas);
    ajustarFilasDatos(hoja, filas.length);
    formatoMoneda(hoja.getRange(2, 5, filas.length, 3));
    // ID venta vinculada es un dato tecnico de cruce, igual que ID venta en
    // la pestaña Ventas: se achica para no competir con las columnas que
    // se leen de verdad.
    hoja.getRange(2, 9, filas.length, 1).setFontColor(COLOR.textoSuave).setFontSize(9);
    aplicarBandas(hoja.getRange(1, 1, filas.length + 1, cols));
    hoja.getRange(1, 1, filas.length + 1, cols).createFilter();
  }

  estilarEncabezado(hoja.getRange(1, 1, 1, cols));
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).setFontFamily(FUENTE);
  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 30);
  hoja.autoResizeColumns(1, cols);
  hoja.setColumnWidth(4, Math.max(hoja.getColumnWidth(4), 220)); // Productos
  agregarAireColumnas(hoja, cols);
}

// --- Contenido ---

function escribirPublicaciones(publicaciones, productos) {
  var encabezados = [
    "Fecha", "Red", "Formato", "Título", "Estado",
    "Checklist", "Productos", "Copy", "Nota",
  ];

  function nombresProductos(pub) {
    var ids = (pub.publicacion_productos || []).map(function (x) {
      return x.producto_id;
    });
    return ids
      .map(function (id) {
        var p = productos.filter(function (x) { return x.id === id; })[0];
        return p ? p.nombre : null;
      })
      .filter(function (n) { return n; })
      .join(", ");
  }

  function progreso(pub) {
    var pasos = pub.checklist || [];
    if (pasos.length === 0) return "";
    var hechos = pasos.filter(function (p) { return p.hecho; }).length;
    return hechos + "/" + pasos.length;
  }

  var filas = publicaciones.map(function (p) {
    return [
      // Sin fecha = todavia es una idea suelta en el banco de ideas.
      p.fecha || "Idea",
      p.red,
      p.formato,
      p.titulo,
      p.estado,
      progreso(p),
      nombresProductos(p),
      p.copy || "",
      p.nota || "",
    ];
  });

  var hoja = prepararHoja(PESTANA_PUBLICACIONES);
  var cols = encabezados.length;
  hoja.getRange(1, 1, 1, cols).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, cols).setValues(filas);
    ajustarFilasDatos(hoja, filas.length);
    aplicarBandas(hoja.getRange(1, 1, filas.length + 1, cols));
    hoja.getRange(1, 1, filas.length + 1, cols).createFilter();
  }

  estilarEncabezado(hoja.getRange(1, 1, 1, cols));
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).setFontFamily(FUENTE);
  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 30);
  hoja.autoResizeColumns(1, cols);
  hoja.setColumnWidth(4, Math.max(hoja.getColumnWidth(4), 200)); // Título
  hoja.setColumnWidth(8, Math.max(hoja.getColumnWidth(8), 220)); // Copy
  agregarAireColumnas(hoja, cols);
}

// --- Tareas ---

function escribirTareas(tareas) {
  var encabezados = ["Texto", "Hecha", "Fecha límite", "Vencida"];
  var hoy = Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "yyyy-MM-dd");

  var filas = tareas.map(function (t) {
    var vencida = !t.hecha && t.fecha_limite && t.fecha_limite < hoy;
    return [t.texto, t.hecha ? "Sí" : "No", t.fecha_limite || "", vencida ? "Sí" : "No"];
  });

  var hoja = prepararHoja(PESTANA_TAREAS);
  var cols = encabezados.length;
  hoja.getRange(1, 1, 1, cols).setValues([encabezados]);

  if (filas.length > 0) {
    hoja.getRange(2, 1, filas.length, cols).setValues(filas);
    ajustarFilasDatos(hoja, filas.length);

    // Igual que en Resumen mensual: lo urgente en rojo, para no tener que
    // leer fila por fila.
    filas.forEach(function (f, i) {
      if (f[3] === "Sí") {
        hoja.getRange(i + 2, 3, 1, 2).setFontColor(COLOR.negativo).setFontWeight("bold");
      }
    });

    aplicarBandas(hoja.getRange(1, 1, filas.length + 1, cols));
    hoja.getRange(1, 1, filas.length + 1, cols).createFilter();
  }

  estilarEncabezado(hoja.getRange(1, 1, 1, cols));
  hoja.getRange(1, 1, hoja.getMaxRows(), cols).setFontFamily(FUENTE);
  hoja.setFrozenRows(1);
  hoja.setRowHeight(1, 30);
  hoja.autoResizeColumns(1, cols);
  hoja.setColumnWidth(1, Math.max(hoja.getColumnWidth(1), 260)); // Texto
  agregarAireColumnas(hoja, cols);
}

function ordenarPestanas() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var panel = libro.getSheetByName(PESTANA_PANEL);
  if (panel) {
    libro.setActiveSheet(panel);
    libro.moveActiveSheet(1);
  }
}

function renombrarLibro() {
  SpreadsheetApp.getActiveSpreadsheet().rename(
    "Rosea Beauty · Finanzas (actualizado " +
      Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "dd/MM HH:mm") +
      ")"
  );
}
