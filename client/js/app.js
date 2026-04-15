const API_URL =
  window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : window.location.origin + '/api';

let estudiantes = [];
let cursoActual = null;

const studentList = document.getElementById('studentList');
const contadorProfesores = document.getElementById('contadorProfesores');
const contadorDestacado = document.getElementById('contadorDestacado');
const cursoInfo = document.getElementById('cursoInfo');
const formSuccess = document.getElementById('formSuccess');
const demoSuccess = document.getElementById('demoSuccess');
const resumenAsistencia = document.getElementById('resumenAsistencia');

async function cargarDemo() {
  try {
    const response = await fetch(`${API_URL}/demo`);
    const data = await response.json();

    if (!data.ok) {
      throw new Error(data.message || 'No se pudieron cargar los datos demo');
    }

    estudiantes = data.estudiantes.map(est => ({
      ...est,
      estado: null
    }));

    cursoActual = data.curso;
    cursoInfo.textContent = `Curso: ${data.curso.nombre} — Paralelo ${data.curso.paralelo}`;
    contadorProfesores.textContent = data.profesoresInteresados;
    contadorDestacado.textContent = data.profesoresInteresados;

    renderEstudiantes();
  } catch (error) {
    console.error('Error al cargar demo:', error);
    cursoInfo.textContent = 'Curso: Error al cargar información';
    studentList.innerHTML = '<p>No se pudieron cargar los estudiantes.</p>';
  }
}

function renderEstudiantes() {
  studentList.innerHTML = '';

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
    if (!cursoActual?.id) {
      throw new Error('No se encontró el curso actual');
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
        fechaRegistro: fechaActual,
        observacionGeneral: 'Registro generado desde la landing del MVP',
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
  } catch (error) {
    console.error('Error al guardar asistencia:', error);
    alert(error.message);
  }
}

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

cargarDemo();