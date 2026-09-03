/**
 * Sincroniza las finanzas de Rosea Beauty (Supabase) hacia esta hoja de
 * calculo. La fuente de verdad sigue siendo el dashboard: este script solo
 * copia. Cada corrida reescribe las pestanas enteras, asi que no hay filas
 * duplicadas ni estado que mantener.
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

var PESTANA_VENTAS = "Ventas";
var PESTANA_GASTOS = "Gastos";
var PESTANA_RESUMEN = "Resumen mensual";

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

  escribir(PESTANA_VENTAS, filasVentas(ventas));
  escribir(PESTANA_GASTOS, filasGastos(gastos));
  escribir(PESTANA_RESUMEN, filasResumen(ventas, gastos));

  SpreadsheetApp.getActiveSpreadsheet().rename(
    "Rosea Beauty · Finanzas (actualizado " +
      Utilities.formatDate(new Date(), "America/Argentina/Buenos_Aires", "dd/MM HH:mm") +
      ")"
  );
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
  var config = {
    url: props.getProperty("SUPABASE_URL"),
    anon: props.getProperty("SUPABASE_ANON_KEY"),
    email: props.getProperty("SUPABASE_EMAIL"),
    password: props.getProperty("SUPABASE_PASSWORD"),
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

// Una fila por renglon de venta: asi la hoja sirve para tabla dinamica.
function filasVentas(ventas) {
  var filas = [
    [
      "Fecha",
      "Clienta",
      "Canal",
      "Producto",
      "Cantidad",
      "Precio unitario",
      "Total renglón",
      "Costo unitario",
      "Ganancia renglón",
      "Nota",
      "ID venta",
    ],
  ];
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
  return filas;
}

function filasGastos(gastos) {
  var filas = [["Fecha", "Categoría", "Descripción", "Monto"]];
  gastos.forEach(function (g) {
    filas.push([g.fecha, g.categoria, g.descripcion, g.monto]);
  });
  return filas;
}

// Mismo criterio que el dashboard: caja resta todo lo que salio; ganancia
// resta el costo de lo vendido mas los gastos que no son compra de stock,
// para no contar la mercaderia dos veces.
function filasResumen(ventas, gastos) {
  var meses = {};

  function mesDe(fecha) {
    return String(fecha).slice(0, 7);
  }

  function fila(mes) {
    if (!meses[mes]) {
      meses[mes] = {
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

  var filas = [
    [
      "Mes",
      "Ventas",
      "Unidades",
      "Costo vendido",
      "Gastos totales",
      "Gastos mercadería",
      "Gastos operativos",
      "Resultado de caja",
      "Ganancia (margen)",
      "Margen %",
    ],
  ];

  Object.keys(meses)
    .sort()
    .reverse()
    .forEach(function (mes) {
      var f = meses[mes];
      var operativos = f.gastosTotal - f.gastosMercaderia;
      var ganancia = f.ingresos - f.costoVendido - operativos;
      filas.push([
        mes,
        f.ingresos,
        f.unidades,
        f.costoVendido,
        f.gastosTotal,
        f.gastosMercaderia,
        operativos,
        f.ingresos - f.gastosTotal,
        ganancia,
        f.ingresos === 0 ? "" : Math.round((ganancia / f.ingresos) * 100) + "%",
      ]);
    });

  return filas;
}

function escribir(nombre, filas) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  if (!hoja) hoja = SpreadsheetApp.getActiveSpreadsheet().insertSheet(nombre);
  hoja.clear();
  if (filas.length === 0) return;
  hoja.getRange(1, 1, filas.length, filas[0].length).setValues(filas);
  hoja.getRange(1, 1, 1, filas[0].length).setFontWeight("bold");
  hoja.setFrozenRows(1);
  hoja.autoResizeColumns(1, filas[0].length);
}
