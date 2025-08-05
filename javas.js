const equiposDisponibles = [
  { nombre: "Bombillo LED 9W", potencia: 9 },
  { nombre: "Ventilador 50W", potencia: 50 },
  { nombre: "Refrigeradora 150W", potencia: 150 },
  { nombre: "Televisor 100W", potencia: 100 },
  { nombre: "Laptop 60W", potencia: 60 },
  { nombre: "Microondas 800W", potencia: 800 },
  { nombre: "Bomba de agua 400W", potencia: 400 }
];

let equiposSeleccionados = [];

function agregarEquipo() {
  const select = document.getElementById("equipo");
  const equipo = equiposDisponibles[select.selectedIndex];
  const horas = parseFloat(document.getElementById("horas").value);
  const cantidad = parseInt(document.getElementById("cantidad").value);

  if (!isNaN(horas) && !isNaN(cantidad)) {
    equiposSeleccionados.push({ ...equipo, horas, cantidad });
    mostrarEquipos();
  }
}

function eliminarEquipo(index) {
  equiposSeleccionados.splice(index, 1);
  mostrarEquipos();
}

function mostrarEquipos() {
  const tabla = document.getElementById("tablaEquipos");
  tabla.innerHTML = "";
  equiposSeleccionados.forEach((eq, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td>${eq.nombre}</td>
      <td>${eq.potencia} W</td>
      <td>${eq.horas}</td>
      <td>${eq.cantidad}</td>
      <td><button onclick="eliminarEquipo(${index})">Eliminar</button></td>
    `;
    tabla.appendChild(fila);
  });
}

function calcularConsumo() {
  const autonomia = parseFloat(document.getElementById("autonomia").value);
  if (isNaN(autonomia)) return;

  const consumoDiario = equiposSeleccionados.reduce(
    (total, eq) => total + eq.potencia * eq.horas * eq.cantidad,
    0
  );
  const energiaNecesaria = consumoDiario * autonomia;

  const escenarios = calcularEscenarios(consumoDiario, energiaNecesaria);
  mostrarResultados(consumoDiario, energiaNecesaria, escenarios);
}

function calcularEscenarios(consumoDiario, energiaWh) {
  const escenarios = [];

  const tipos = [
    { voltaje: 12, tipo: "Plomo-ácido" },
    { voltaje: 24, tipo: "Plomo-ácido" },
    { voltaje: 12, tipo: "Litio" },
    { voltaje: 24, tipo: "Litio" }
  ];

  tipos.forEach(({ voltaje, tipo }) => {
    const profundidadDescarga = tipo === "Litio" ? 0.9 : 0.5;
    const capacidadAh = energiaWh / (voltaje * profundidadDescarga);
    const cantidadBaterias = Math.ceil(capacidadAh / 150); // suponiendo baterías de 150Ah
    const panelesW = Math.ceil(consumoDiario / 4);
    const cantidadPaneles = Math.ceil(panelesW / 450); // paneles de 450W
    const inversorW = Math.ceil(consumoDiario * 1.3);
    const controladorA = Math.ceil((panelesW / voltaje) * 1.25);

    const precioBateria = tipo === "Litio" ? 500 : 200;
    const precioInversor = Math.ceil(inversorW / 1000) * 300;
    const precioControlador = 100;
    const precioPanel = 200;

    const precioTotal = cantidadBaterias * precioBateria + cantidadPaneles * precioPanel + precioInversor + precioControlador;

    escenarios.push({
      voltaje,
      tipo,
      capacidadAh: Math.ceil(capacidadAh),
      cantidadBaterias,
      cantidadPaneles,
      panelesW: cantidadPaneles * 450,
      inversorW,
      controladorA,
      precioTotal
    });
  });

  return escenarios;
}

function mostrarResultados(consumo, energia, escenarios) {
  const resultado = document.getElementById("resultado");
  resultado.innerHTML = `<h3>Consumo diario: ${Math.round(consumo)} Wh</h3>`;
  resultado.innerHTML += `<h4>Energía para ${document.getElementById("autonomia").value} días de autonomía: ${Math.round(energia)} Wh</h4>`;

  escenarios.forEach((esc, index) => {
    resultado.innerHTML += `
      <div style="margin-bottom: 1em; padding: 10px; border: 1px solid #ccc;">
        <strong>Escenario ${index + 1}:</strong><br>
        - Sistema: ${esc.voltaje}V / Baterías de ${esc.tipo}<br>
        - Capacidad requerida: ${esc.capacidadAh} Ah<br>
        - Cantidad de baterías (150Ah): ${esc.cantidadBaterias}<br>
        - Paneles solares requeridos: ${esc.cantidadPaneles} x 450W = ${esc.panelesW} W<br>
        - Inversor sugerido: ${esc.inversorW} W<br>
        - Controlador sugerido: ${esc.controladorA} A<br>
        - Costo estimado del sistema: $${esc.precioTotal}<br>
      </div>
    `;
  });
}

async function generarPDF(datos) {
  // 1. Llenamos el contenido del reporte
  document.querySelector('#reporte-pdf').innerHTML = `
    <h1 style="text-align: center;">Informe del Sistema Solar Fotovoltaico</h1>

    <h2>1. Resumen de Consumo y Autonomía</h2>
    <p><strong>Consumo diario:</strong> ${datos.consumoDiario} Wh</p>
    <p><strong>Días de autonomía:</strong> ${datos.autonomia} días</p>
    <p><strong>Energía total requerida:</strong> ${datos.totalEnergia} Wh</p>

    <h2>2. Escenario Seleccionado</h2>
    <ul>
      <li><strong>Voltaje:</strong> ${datos.voltaje} V</li>
      <li><strong>Tipo de batería:</strong> ${datos.tipoBateria}</li>
      <li><strong>Capacidad total requerida:</strong> ${datos.capacidadTotalAh} Ah</li>
      <li><strong>Cantidad de baterías:</strong> ${datos.numBaterias}</li>
      <li><strong>Paneles solares:</strong> ${datos.numPaneles} x 450W = ${datos.potenciaPaneles} W</li>
      <li><strong>Inversor sugerido:</strong> ${datos.inversor} W</li>
      <li><strong>Controlador sugerido:</strong> ${datos.controlador} A</li>
      <li><strong>Precio total estimado:</strong> $${datos.precioMin} - $${datos.precioMax}</li>
    </ul>

    <h2>3. Lista de Materiales</h2>
    <table border="1" cellspacing="0" cellpadding="5" width="100%">
      <thead>
        <tr style="background-color: #eee;">
          <th>Componente</th>
          <th>Descripción</th>
          <th>Cantidad</th>
          <th>Rango de precio (USD)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Panel solar 450W</td>
          <td>Panel monocristalino estándar</td>
          <td>${datos.numPaneles}</td>
          <td>$180 - $220</td>
        </tr>
        <tr>
          <td>Batería ${datos.tipoBateria} (150Ah)</td>
          <td>Batería de ciclo profundo</td>
          <td>${datos.numBaterias}</td>
          <td>${datos.rangoPrecioBaterias}</td>
        </tr>
        <tr>
          <td>Inversor ${datos.inversor}W</td>
          <td>Inversor de onda pura</td>
          <td>1</td>
          <td>${datos.rangoPrecioInversor}</td>
        </tr>
        <tr>
          <td>Controlador ${datos.controlador}A</td>
          <td>Controlador MPPT</td>
          <td>1</td>
          <td>${datos.rangoPrecioControlador}</td>
        </tr>
      </tbody>
    </table>

    <h2>4. Diagrama del Sistema</h2>
    <img src="${datos.imgDiagrama}" alt="Diagrama del sistema solar" style="width: 100%; max-width: 700px; display: block; margin: 10px auto;">

    <h2>5. Guía de Instalación Básica</h2>
    <ol>
      <li><strong>Ubicación:</strong> Paneles en lugar soleado y sin sombras.</li>
      <li><strong>Cableado:</strong> Uso de cables DC con protecciones.</li>
      <li><strong>Conexión:</strong> Conectar: paneles → controlador → baterías → inversor.</li>
      <li><strong>Pruebas:</strong> Verificar funcionamiento antes de conectar equipos.</li>
    </ol>

    <h2>6. Consejos de Seguridad</h2>
    <ul>
      <li>Usar fusibles y breakers en DC.</li>
      <li>Desconectar el sistema al manipular.</li>
      <li>Consultar técnicos si no se tiene experiencia.</li>
    </ul>

    <h2>7. Normativa en Panamá</h2>
    <p>Debe cumplir la regulación de ASEP y el Reglamento Eléctrico vigente. Requiere evaluación para conexión a red.</p>
  `;

  // 2. Generamos el PDF
  const pdfContainer = document.getElementById("reporte-pdf");

  const canvas = await html2canvas(pdfContainer, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');

  const imgProps = pdf.getImageProperties(imgData);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  pdf.save("informe_sistema_solar.pdf");
}
