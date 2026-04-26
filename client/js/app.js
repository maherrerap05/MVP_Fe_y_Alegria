const API_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : window.location.origin + '/api';

let estudiantes = [];
let cursoActual = null;
let horarioActual = null;

const studentList = document.getElementById('studentList');
const contadorProfesores = document.getElementById('contadorProfesores');
const contadorDestacado = document.getElementById('contadorDestacado');
const cursoInfo = document.getElementById('cursoInfo');
const formSuccess = document.getElementById('formSuccess');
const demoSuccess = document.getElementById('demoSuccess');
const resumenAsistencia = document.getElementById('resumenAsistencia');
const horarioSelect = document.getElementById('horarioSelect');

async function cargarDatosIniciales() {
  await cargarContadorInteresados();
  await cargarHorarios();
}

async function cargarContadorInteresados() {
  try {
    const response = await fetch(`${API_URL}/interesados/count`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'No se pudo cargar el contador');
    }

    contadorProfesores.textContent = data.total;
    contadorDestacado.textContent = data.total;
  } catch (error) {
    console.error('Error al cargar contador:', error);
    contadorProfesores.textContent = '0';
    contadorDestacado.textContent = '0';
  }
}

async function cargarHorarios() {
  try {
    const response = await fetch(`${API_URL}/horarios`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'No se pudieron cargar los horarios');
    }

    horarioSelect.innerHTML = '<option value="">Seleccione un horario...</option>';

    data.data.forEach(horario => {
      const option = document.createElement('option');
      option.value = horario.id;
      option.textContent = `${horario.dia_semana} ${horario.hora_inicio} - ${horario.hora_fin} | ${horario.materia} | ${horario.curso_nombre} ${horario.paralelo}`;
      horarioSelect.appendChild(option);
    });
  } catch (error) {
    console.error('Error al cargar horarios:', error);
    horarioSelect.innerHTML = '<option value="">No se pudieron cargar los horarios</option>';
  }
}

async function cargarEstudiantesPorHorario(horarioId) {
  try {
    if (!horarioId) {
      horarioActual = null;
      cursoActual = null;
      estudiantes = [];
      cursoInfo.textContent = 'Seleccione un horario para cargar la lista de estudiantes.';
      studentList.innerHTML = '';
      resumenAsistencia.innerHTML = 'Aún no se ha guardado la asistencia del curso.';
      demoSuccess.style.display = 'none';
      return;
    }

    const response = await fetch(`${API_URL}/horarios/${horarioId}/estudiantes`);
    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'No se pudieron cargar los estudiantes del horario');
    }

    horarioActual = data.horario;
    cursoActual = {
      id: data.horario.curso_id,
      nombre: data.horario.curso_nombre,
      paralelo: data.horario.paralelo
    };

    estudiantes = data.estudiantes.map(est => ({
      ...est,
      estado: null
    }));

    cursoInfo.textContent =
      `Curso: ${data.horario.curso_nombre} — Paralelo ${data.horario.paralelo} | ` +
      `${data.horario.materia} | ${data.horario.dia_semana} ${data.horario.hora_inicio} - ${data.horario.hora_fin}`;

    resumenAsistencia.innerHTML = 'Aún no se ha guardado la asistencia del curso.';
    demoSuccess.style.display = 'none';

    renderEstudiantes();
  } catch (error) {
    console.error('Error al cargar estudiantes por horario:', error);
    cursoInfo.textContent = 'Error al cargar estudiantes del horario.';
    studentList.innerHTML = '<p>No se pudieron cargar los estudiantes.</p>';
  }
}

function renderEstudiantes() {
  studentList.innerHTML = '';

  if (estudiantes.length === 0) {
    studentList.innerHTML = '<p>Seleccione un horario para visualizar estudiantes.</p>';
    return;
  }

  estudiantes.forEach((estudiante, index) => {
    const row = document.createElement('div');
    row.className = 'student-row';

    row.innerHTML = `
      <div>
        <div class="student-name">${estudiante.nombre_completo}</div>
        <div class="student-id">${estudiante.codigo}</div>
      </div>
      <div class="actions">
        <button type="button" class="toggle-btn ${estudiante.estado === 'asistio' ? 'active-present' : ''}" onclick="marcarEstado(${index}, 'asistio')">Asistió</button>
        <button type="button" class="toggle-btn ${estudiante.estado === 'falto' ? 'active-absent' : ''}" onclick="marcarEstado(${index}, 'falto')">No asistió</button>
      </div>
    `;

    studentList.appendChild(row);
  });
}

function marcarEstado(index, estado) {
  estudiantes[index].estado = estado;
  renderEstudiantes();
}

async function guardarAsistencia() {
  try {
    if (!cursoActual?.id || !horarioActual?.id) {
      throw new Error('Debe seleccionar un horario antes de guardar la asistencia');
    }

    if (estudiantes.length === 0) {
      throw new Error('No existen estudiantes cargados para este horario');
    }

    const estudiantesPayload = estudiantes.map(est => ({
      estudianteId: est.id,
      estado:
        est.estado === 'asistio'
          ? 'ASISTIO'
          : est.estado === 'falto'
          ? 'FALTO'
          : 'SIN_MARCAR'
    }));

    const fechaActual = new Date().toISOString().split('T')[0];

    const response = await fetch(`${API_URL}/asistencias`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cursoId: cursoActual.id,
        horarioId: horarioActual.id,
        fechaRegistro: fechaActual,
        observacionGeneral: `Registro generado desde horario ${horarioActual.materia}`,
        estudiantes: estudiantesPayload
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'No se pudo registrar la asistencia');
    }

    resumenAsistencia.innerHTML = `
      <strong>Resumen:</strong><br>
      Asistieron: ${data.resumen.asistieron}<br>
      No asistieron: ${data.resumen.faltaron}<br>
      Sin marcar: ${data.resumen.sinMarcar}
    `;

    demoSuccess.style.display = 'block';
    mostrarBotonReporte(data.asistenciaId);
  } catch (error) {
    console.error('Error al guardar asistencia:', error);
    alert(error.message);
  }
}

horarioSelect.addEventListener('change', function () {
  cargarEstudiantesPorHorario(this.value);
});

document.getElementById('interestForm').addEventListener('submit', async function (event) {
  event.preventDefault();

  const nombre = document.getElementById('nombre').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const comentarios = document.getElementById('comentarios').value.trim();

  try {
    const response = await fetch(`${API_URL}/interesados`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nombre,
        correo,
        comentario: comentarios
      })
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      throw new Error(data.message || 'No se pudo registrar el interés');
    }

    contadorProfesores.textContent = data.nuevoTotal;
    contadorDestacado.textContent = data.nuevoTotal;
    formSuccess.style.display = 'block';
    this.reset();
  } catch (error) {
    console.error('Error al registrar interés:', error);
    alert(error.message);
  }
});

cargarDatosIniciales();

function mostrarBotonReporte(asistenciaId) {
  let reporteBtn = document.getElementById('reporteBtn');

  if (!reporteBtn) {
    reporteBtn = document.createElement('button');
    reporteBtn.id = 'reporteBtn';
    reporteBtn.className = 'btn btn-secondary';
    reporteBtn.style.marginTop = '12px';
    reporteBtn.textContent = 'Descargar reporte PDF';

    resumenAsistencia.parentElement.appendChild(reporteBtn);
  }

  reporteBtn.onclick = () => {
    window.open(`${API_URL}/asistencias/${asistenciaId}/reporte`, '_blank');
  };
}