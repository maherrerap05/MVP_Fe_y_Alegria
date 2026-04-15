-- =========================================================
-- MVP ASISTENCIA DOCENTE - COLEGIO JOSE MARIA VELAZ
-- ESQUEMA INICIAL PostgreSQL
-- =========================================================

-- Eliminar tablas si existen (solo para pruebas iniciales)
DROP TABLE IF EXISTS asistencia_detalle CASCADE;
DROP TABLE IF EXISTS asistencias CASCADE;
DROP TABLE IF EXISTS interesados CASCADE;
DROP TABLE IF EXISTS estudiantes CASCADE;
DROP TABLE IF EXISTS cursos CASCADE;

-- =========================================================
-- TABLA: cursos
-- =========================================================
CREATE TABLE cursos (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL,
    paralelo        VARCHAR(10) NOT NULL,
    nivel           VARCHAR(50),
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- TABLA: estudiantes
-- =========================================================
CREATE TABLE estudiantes (
    id              SERIAL PRIMARY KEY,
    curso_id        INT NOT NULL,
    codigo          VARCHAR(20) NOT NULL UNIQUE,
    nombre_completo VARCHAR(150) NOT NULL,
    estado          VARCHAR(10) NOT NULL DEFAULT 'ACT',
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_estudiantes_curso
        FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_estudiantes_estado
        CHECK (estado IN ('ACT', 'INA'))
);

-- =========================================================
-- TABLA: asistencias
-- =========================================================
CREATE TABLE asistencias (
    id                  SERIAL PRIMARY KEY,
    curso_id            INT NOT NULL,
    fecha_registro      DATE NOT NULL,
    total_asistieron    INT NOT NULL DEFAULT 0,
    total_faltaron      INT NOT NULL DEFAULT 0,
    total_sin_marcar    INT NOT NULL DEFAULT 0,
    observacion_general TEXT,
    creado_en           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_asistencias_curso
        FOREIGN KEY (curso_id)
        REFERENCES cursos(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_total_asistieron
        CHECK (total_asistieron >= 0),

    CONSTRAINT ck_total_faltaron
        CHECK (total_faltaron >= 0),

    CONSTRAINT ck_total_sin_marcar
        CHECK (total_sin_marcar >= 0)
);

-- =========================================================
-- TABLA: asistencia_detalle
-- =========================================================
CREATE TABLE asistencia_detalle (
    id                  SERIAL PRIMARY KEY,
    asistencia_id       INT NOT NULL,
    estudiante_id       INT NOT NULL,
    estado_asistencia   VARCHAR(15) NOT NULL,

    CONSTRAINT fk_detalle_asistencia
        FOREIGN KEY (asistencia_id)
        REFERENCES asistencias(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_detalle_estudiante
        FOREIGN KEY (estudiante_id)
        REFERENCES estudiantes(id)
        ON DELETE CASCADE,

    CONSTRAINT ck_estado_asistencia
        CHECK (estado_asistencia IN ('ASISTIO', 'FALTO', 'SIN_MARCAR')),

    CONSTRAINT uq_asistencia_estudiante
        UNIQUE (asistencia_id, estudiante_id)
);

-- =========================================================
-- TABLA: interesados
-- =========================================================
CREATE TABLE interesados (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(150) NOT NULL,
    correo          VARCHAR(150) NOT NULL,
    comentario      TEXT,
    creado_en       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);