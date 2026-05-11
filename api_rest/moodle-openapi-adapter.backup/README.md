# 🚀 Moodle OpenAPI Adapter

**A modern REST API adapter for Moodle Learning Management System**

[![Java](https://img.shields.io/badge/Java-25+-blue)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-brightgreen)](https://spring.io/projects/spring-boot)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Build](https://img.shields.io/badge/Build-Maven-orange)](https://maven.apache.org/)

---

## 📖 Documentación Completa

**👉 Ver [`DOCUMENTATION.md`](DOCUMENTATION.md)** para la documentación COMPLETA del proyecto.

El fichero `DOCUMENTATION.md` contiene:

- ✅ Arquitectura del proyecto
- ✅ Explicación detallada de la generación automática de código (JSON Schema 2 POJO + OpenAPI Generator + MapStruct)
- ✅ Sistema de tests basado en ficheros JSON
- ✅ Guía completa para agregar nuevos endpoints (12 pasos)
- ✅ Comandos útiles
- ✅ Troubleshooting

---

## 📋 Quick Reference

### Tecnologías

| Stack              | Version        |
|--------------------|----------------|
| Java               | 25             |
| Spring Boot        | 3.5.12         |
| Spring WebFlux     | 3.x (Reactivo) |
| OpenAPI Generator  | 7.2.0          |
| JSON Schema 2 POJO | 1.3.3          |
| MapStruct          | 1.6.3          |

### Endpoints Actuales

- 🔐 **Authentication** - Login y token generation
- 📚 **Courses** - Contenidos, usuarios, calificaciones
- 👥 **Users** - Información de usuarios y cursos
- 📊 **Grades** - Reportes de calificaciones
- ℹ️ **Site Info** - Configuración de Moodle

### Comandos Principales

```bash
# Generar código automático
mvn clean generate-sources

# Build completo
mvn clean package

# Ejecutar tests
mvn test

# Ejecutar aplicación
mvn spring-boot:run

# Ver API (cuando está ejecutando)
http://localhost:8080/swagger-ui.html
```

---

## 🏗️ Arquitectura

```
Cliente HTTP
    ↓
REST Controller (OpenAPI generado)
    ↓
Service Layer (Business Logic)
    ↓
MoodleEndpoint (Strategy)
    ↓
MapStruct Mapper (DTO ↔ MoodleModel)
    ↓
MoodleClient (WebClient reactivo)
    ↓
Moodle HTTP API
```

---

## 🤖 Generación Automática de Código

El proyecto usa **DOS herramientas de generación automática**:

### 1. **JSON Schema 2 POJO**

- **Entrada:** `src/main/resources/moodle/schema/`
- **Salida:** Modelos Moodle (Request/Response)
- **Ubicación generada:** `target/generated-sources/jsonschema2pojo/`

### 2. **OpenAPI Generator**

- **Entrada:** `src/main/resources/static/openapi/openapi.yaml`
- **Salida:** Controllers + DTOs REST API
- **Ubicación generada:** `target/generated-sources/openapi/`

### 3. **MapStruct**

- **Interfaz:** `src/main/java/es/ubu/lsi/moodleadapter/mapper/`
- **Generado:** Implementaciones de mappers en compilación
- **Propósito:** Convertir entre DTO REST y Modelos Moodle

**👉 Ver [`DOCUMENTATION.md`](DOCUMENTATION.md) para explicación detallada.**

---

## 🧪 Sistema de Tests

Tests basados en **ficheros JSON** (File-Driven Tests):

```
src/test/resources/adapter/
├── course_contents/test-case.json
├── course_grades/test-case.json
├── course_users/test-case.json
├── login/test-case.json
├── logs_file/test-case.json
└── site_info/test-case.json
```

Ejecutar tests:

```bash
mvn test
```

**👉 Ver [`DOCUMENTATION.md`](DOCUMENTATION.md) para explicación completa de tests.**

---

## ➕ Agregar Nuevo Endpoint

Guía de **12 pasos** en [`DOCUMENTATION.md`](DOCUMENTATION.md):

1. Investigar en Moodle docs
2. Crear JSON Schema Request
3. Crear JSON Schema Response
4. Generar código (JSON Schema 2 POJO)
5. Crear MapStruct Mapper
6. Crear Endpoint Strategy
7. Actualizar OpenAPI Spec
8. Generar código (OpenAPI)
9. Implementar Service
10. Implementar Controller
11. Agregar test-case.json
12. Ejecutar tests

**👉 Ver [`DOCUMENTATION.md`](DOCUMENTATION.md) para cada paso detallado con código.**

---

## 🚀 Quick Start

### 1. Clone el repositorio

```bash
git clone <repo-url>
cd moodle-openapi-adapter
```

### 2. Generar código automático

```bash
mvn clean generate-sources
```

### 3. Compilar

```bash
mvn clean compile
```

### 4. Ejecutar tests

```bash
mvn test
```

### 5. Ejecutar la aplicación

```bash
mvn spring-boot:run
```

### 6. Acceder a Swagger UI

```
http://localhost:8080/swagger-ui.html
```

---

## 📁 Estructura de Carpetas

```
moodle-openapi-adapter/
├── src/main/
│   ├── java/es/ubu/lsi/moodleadapter/
│   │   ├── controller/          ← Controllers REST
│   │   ├── service/             ← Business logic
│   │   ├── mapper/              ← MapStruct mappers
│   │   ├── client/              ← HTTP client
│   │   └── config/              ← Configuration
│   └── resources/
│       ├── moodle/schema/       ← JSON Schemas (entrada)
│       └── static/openapi/      ← OpenAPI spec (entrada)
├── src/test/
│   ├── java/                    ← Test utilities
│   └── resources/adapter/       ← test-case.json files
├── target/
│   └── generated-sources/
│       ├── jsonschema2pojo/     ← Generated models
│       └── openapi/             ← Generated DTOs/Controllers
├── pom.xml                      ← Maven config + plugins
├── DOCUMENTATION.md             ← Documentación completa ⭐
└── README.md                    ← Este fichero
```

---

## 📚 Documentación

- **[DOCUMENTATION.md](DOCUMENTATION.md)** - Documentación completa (👈 **LEER ESTO**)
    - Arquitectura
    - Generación automática de código explicada
    - Sistema de tests detallado
    - Agregar nuevo endpoint (12 pasos)
    - Troubleshooting
    - Y mucho más...

---

## 🔍 Concepto: Las 3 Capas de Modelos

El proyecto usa **3 capas de modelos diferentes**:

```
┌────────────────────────────────┐
│ CAPA 1: DTO REST API           │
│ (autogenerado OpenAPI)         │
│ LoginTokenRequestDto           │
│ CourseUsersResponseDto         │
└────────────────┬───────────────┘
                 │
          MapStruct mapper
                 │
                 ▼
┌────────────────────────────────┐
│ CAPA 2: Moodle Models          │
│ (autogenerado JSON Schema 2 Po)│
│ LoginTokenRequest              │
│ GetEnrolledUsersResponse       │
└────────────────┬───────────────┘
                 │
              HTTP JSON
                 │
                 ▼
┌────────────────────────────────┐
│ CAPA 3: Moodle HTTP API        │
│ POST /webservice/rest/...      │
│ (servidor Moodle externo)      │
└────────────────────────────────┘
```

**👉 Ver [`DOCUMENTATION.md`](DOCUMENTATION.md) para explicación detallada.**

---

## 💡 Conceptos Clave

- **Programación Reactiva** - Spring WebFlux (Mono/Flux)
- **Pattern Strategy** - MoodleEndpoint interface
- **Generación Automática** - JSON Schema 2 POJO + OpenAPI Generator
- **Mapeo de Modelos** - MapStruct mappers
- **Tests basados en JSON** - File-Driven Tests sin código
- **Validación automática** - Jakarta Validation

**👉 Ver [`DOCUMENTATION.md`](DOCUMENTATION.md) para cada concepto explicado.**

---

## 🚨 Troubleshooting Rápido

| Problema                 | Solución                                       |
|--------------------------|------------------------------------------------|
| No se generan clases     | `mvn clean generate-sources -X`                |
| "ClassNotFoundException" | `mvn clean compile`                            |
| Puerto 8089 en uso       | `taskkill /PID <PID> /F`                       |
| MoodleContext es null    | Verifica headers X-Moodle-Token, X-Moodle-Host |
| Tests fallan             | Verifica mockResponse en test-case.json        |

**👉 Ver [`DOCUMENTATION.md`](DOCUMENTATION.md) para troubleshooting completo.**

---

## ✨ Características Principales

✅ **API REST moderna** - Endpoints limpios y documentados  
✅ **Autogeneración de código** - JSON Schema 2 POJO + OpenAPI Generator  
✅ **MapStruct mappers** - Conversión eficiente entre capas  
✅ **Programación reactiva** - Spring WebFlux no-bloqueante  
✅ **Tests file-driven** - Tests basados en JSON sin código  
✅ **Validación automática** - Jakarta Validation  
✅ **Swagger/OpenAPI** - Documentación automática  
✅ **Type-safe** - Java generics, DTOs validados

---

## 📖 Para Entender el Proyecto

1. **Leer primero:** [`DOCUMENTATION.md`](DOCUMENTATION.md) - Sección "Bienvenida"
2. **Entender flujo:** Sección "Cómo Funciona el Sistema"
3. **Comprender generación:** Sección "Generación Automática de Código"
4. **Agregar endpoint:** Sección "Cómo Agregar Nuevos Endpoints"
5. **Troubleshoot:** Sección "Troubleshooting"

---

## 🔗 Enlaces Útiles

- [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- [Spring WebFlux](https://spring.io/projects/spring-webflux)
- [OpenAPI Generator](https://openapi-generator.tech/)
- [MapStruct](https://mapstruct.org/)
- [JSON Schema 2 POJO](https://www.jsonschema2pojo.org/)

---

## 📝 Autor

**Yi Peng Ji**

---

## 📄 License

MIT License - Ver [`LICENSE`](LICENSE)

---

## 🎯 Resumen Rápido

| Pregunta                 | Respuesta                                  |
|--------------------------|--------------------------------------------|
| ¿Qué es esto?            | API REST adapter para Moodle               |
| ¿Cómo funciona?          | Ver DOCUMENTATION.md                       |
| ¿Cómo ejecutar?          | `mvn spring-boot:run`                      |
| ¿Cómo agregar endpoint?  | 12 pasos en DOCUMENTATION.md               |
| ¿Ver API?                | http://localhost:8080/swagger-ui.html      |
| ¿Ejecutar tests?         | `mvn test`                                 |
| ¿Documentación completa? | **[DOCUMENTATION.md](DOCUMENTATION.md)** ⭐ |

---

**👉 [VER DOCUMENTACIÓN COMPLETA](DOCUMENTATION.md)**

