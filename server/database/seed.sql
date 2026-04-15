-- =========================================================
-- DATOS INICIALES DE PRUEBA
-- =========================================================

INSERT INTO cursos (nombre, paralelo, nivel)
VALUES ('Octavo de Básica', 'A', 'Educación General Básica');

INSERT INTO estudiantes (curso_id, codigo, nombre_completo)
VALUES
(1, 'EST-001', 'Ana López'),
(1, 'EST-002', 'Carlos Pérez'),
(1, 'EST-003', 'Sofía Andrade'),
(1, 'EST-004', 'Mateo Ruiz'),
(1, 'EST-005', 'Valeria Torres');

INSERT INTO interesados (nombre, correo, comentario)
VALUES
('Docente de Matemáticas', 'matematicas@feyalegria.org.ec', 'Sería útil tener historial por fecha.'),
('Docente de Lengua', 'lengua@feyalegria.org.ec', 'La interfaz se ve clara y rápida.'),
('Docente de Ciencias', 'ciencias@feyalegria.org.ec', 'Sería bueno agregar observaciones por estudiante.');