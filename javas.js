const equipos = [];
const equiposData = {
    // potencia W, nombre
    "Bombillo LED 9W": 9,
    "Ventilador 50W": 50,
    "Refrigeradora 150W": 150,
    "Televisor LED 80W": 80,
    "Cargador celular 10W": 10,
    "Laptop 60W": 60,
    "Microondas 1000W": 1000,
    "Bomba de agua 500W": 500,
    "Lavadora 200W": 200
  };

  const precios = {
    AGM: { bateria: 280, panel: 320, inversor: 500, controlador: 180 },
    Gel: { bateria: 300, panel: 320, inversor: 500, controlador: 180 },
    Litio: { bateria: 600, panel: 350, inversor: 600, controlador: 200 }
  };

  const capacidadBateriaUtil = {
    AGM: 1.2,  // kWh por bateria
    Gel: 1.2,
    Litio: 1.35
  };

  document.getElementById('addEquipoBtn').addEventListener('click', () => {
    const equipoSelect = document.getElementById('equipoSelect');
    const cantidadInput = document.getElementById('cantidadInput');
    const horasInput = document.getElementById('horasInput');
    if (!equipoSelect.value) {
      alert("Selecciona un equipo.");
      return;
    }
    const potencia = parseFloat(equipoSelect.value.split('|')[0]);
    const nombre = equipoSelect.options[equipoSelect.selectedIndex].text;
    const cantidad = parseInt(cantidadInput.value);
    const horas = parseFloat(horasInput.value);

    if (cantidad <= 0 || horas <= 0) {
      alert("Cantidad y horas deben ser mayores a cero.");
      return;
    }

    equipos.push({nombre, potencia, cantidad, horas});
    actualizarTabla();
  });

  function actualizarTabla() {
    const tabla = document.getElementById('listaEquipos');
    const tbody = tabla.querySelector('tbody');
    tbody.innerHTML = '';
    if (equipos.length === 0) {
      tabla.style.display = 'none';
      return;
    }
    tabla.style.display = 'table';
    equipos.forEach((eq, i) => {
      const row = document.createElement('tr');
      const consumo = eq.potencia * eq.cantidad * eq.horas;
      row.innerHTML = `
        <td>${eq.nombre}</td>
        <td>${eq.potencia}</td>
        <td>${eq.cantidad}</td>
        <td>${eq.horas}</td>
        <td>${consumo.toFixed(0)}</td>
        <td><button onclick="quitarEquipo(${i})">X</button></td>
      `;
      tbody.appendChild(row);
    });
  }

  function quitarEquipo(index) {
    equipos.splice(index, 1);
    actualizarTabla();
  }

  document.getElementById('calcularBtn').addEventListener('click', () => {
    if (equipos.length === 0) {
      alert("Agrega al menos un equipo para calcular.");
      return;
    }

    const bateriaTipo = document.getElementById('bateriaTipo').value;
    const bateriaCantidad = parseInt(document.getElementById('bateriaCantidad').value);
    const autonomia = parseFloat(document.getElementById('autonomiaInput').value);
    const voltajeSistema = parseInt(document.getElementById('voltajeSistema').value);

    if (bateriaCantidad <= 0 || autonomia <= 0) {
      alert("Cantidad de baterías y autonomía deben ser mayores a cero.");
      return;
    }

    // Calculo consumo total diario (Wh)
    const consumoTotalWh = equipos.reduce((sum, eq) => sum + eq.potencia * eq.cantidad * eq.horas, 0);

    // Energía útil necesaria (Wh)
    const energiaNecesariaWh = consumoTotalWh * autonomia;

    // Energía por bateria util (Wh)
    const energiaBateriaUtilWh = capacidadBateriaUtil[bateriaTipo] * 1000;

    // Energia nominal bateria total (Wh)
    const energiaNominalBateriasWh = bateriaCantidad * energiaBateriaUtilWh / (bateriaTipo === "Litio" ? 0.9 : 0.5);

    // Paneles solares - horas pico sol y margen pérdidas
    const horasSolPico = 4.5;
    const margenPerdidas = 1.3;

    // Potencia paneles necesaria (W)
    const potenciaPanelesW = consumoTotalWh / horasSolPico * margenPerdidas;

    // Cantidad paneles (redondeo hacia arriba)
    const potenciaPanel = precios[bateriaTipo].panel; // asumimos panel de ~320W
    const panelesCantidad = Math.ceil(potenciaPanelesW / potenciaPanel);

    // Inversor
    // Potencia máxima simultánea estimada (suponemos 1.5x consumo medio)
    const potenciaMaxW = consumoTotalWh / 24 * 1.5;
    let inversorPotencia = 1000;
    if (potenciaMaxW > 1500) inversorPotencia = 2000;
    else if (potenciaMaxW > 1000) inversorPotencia = 1500;

    // Costos aproximados
    const costoBaterias = precios[bateriaTipo].bateria * bateriaCantidad;
    const costoPaneles = precios[bateriaTipo].panel * panelesCantidad;
    const costoInversor = precios[bateriaTipo].inversor;
    const costoControlador = precios[bateriaTipo].controlador;
    const costoOtros = 500; // cables, estructura, protecciones (estimado fijo)

    const costoTotalMin = costoBaterias + costoPaneles + costoInversor + costoControlador + costoOtros;
    const costoTotalMax = costoTotalMin * 1.3;

    // Mostrar resultados
    const resConsumo = `<strong>Consumo total diario:</strong> ${ (consumoTotalWh/1000).toFixed(2) } kWh`;
    const resBaterias = `<strong>Baterías recomendadas:</strong> ${bateriaCantidad} × ${bateriaTipo} (${capacidadBateriaUtil[bateriaTipo]} kWh útiles c/u)`;
    const resPaneles = `<strong>Paneles solares recomendados:</strong> ${panelesCantidad} panel(es) (~${(panelesCantidad*potenciaPanel)} W total)`;
    const resInversor = `<strong>Inversor recomendado:</strong> ${inversorPotencia} W, sistema ${voltajeSistema} V`;
    const resCostos = `<strong>Rango aproximado de costos:</strong> $${costoTotalMin.toFixed(0)} – $${costoTotalMax.toFixed(0)} USD`;

    const esquema = `
      <strong>Esquema básico:</strong><br>
      ☀️ Paneles solares (${panelesCantidad} × ${potenciaPanel}W) → Controlador MPPT → Banco baterías (${bateriaCantidad} × ${bateriaTipo}) → Inversor ${inversorPotencia}W → Cargas domésticas
    `;

    document.getElementById('resultado').style.display = 'block';
    document.getElementById('resumenConsumo').innerHTML = resConsumo;
    document.getElementById('resumenBaterias').innerHTML = resBaterias;
    document.getElementById('resumenPaneles').innerHTML = resPaneles;
    document.getElementById('resumenInversor').innerHTML = resInversor;
    document.getElementById('resumenCostos').innerHTML = resCostos;
    document.getElementById('esquemaSimple').innerHTML = esquema;
  });
