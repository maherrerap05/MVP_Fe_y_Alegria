# MVP - Sistema de Asistencia Docente  
Unidad Educativa Fe y Alegría José María Vélaz  

## 📌 Descripción
Este proyecto es un Producto Mínimo Viable (MVP) para validar un sistema de registro de asistencia docente.

Permite:
- visualizar lista de estudiantes
- registrar asistencia
- registrar interés de docentes
- almacenar comentarios
- persistir datos en PostgreSQL

## 🧠 Arquitectura
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express
- Base de datos: PostgreSQL
- Comunicación: API REST

## 🚀 Funcionalidades
- Carga dinámica de curso y estudiantes
- Registro de asistencia por estudiante
- Persistencia en base de datos
- Formulario de interés docente
- Contador dinámico de interesados

## 📁 Estructura
client/
server/

## ⚙️ Configuración

### Backend
cd server
npm install
npm run dev

### Base de datos
Ejecutar:
- schema.sql
- seed.sql

### Frontend
Abrir con Live Server:
client/index.html

## 🌐 Endpoints
GET /api/demo  
POST /api/interesados  
POST /api/asistencias  

## 👨‍💻 Autor
Proyecto académico - Ingeniería en Sistemas de Información