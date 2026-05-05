# 📚 Moodle OpenAPI Adapter - Documentación Completa

**Autor:** Yi Peng Ji  
**Fecha:** March 22, 2026  
**Versión:** 1.0

---

## 📖 Tabla de Contenidos

1. [Bienvenida](#bienvenida)
2. [Para Consumidores del API](#-para-consumidores-del-api)
    - [Autenticación](#autenticación)
    - [Headers Requeridos](#headers-requeridos)
    - [Estructura de Respuestas](#estructura-de-respuestas)
    - [Ejemplos de Uso](#ejemplos-de-uso)
    - [Manejo de Errores](#manejo-de-errores)
    - [Generación Automática de Clientes OpenAPI](#-generación-automática-de-clientes-openapi)
3. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
4. [Tecnologías Utilizadas](#tecnologías-utilizadas)
5. [Estructura de Carpetas](#estructura-de-carpetas)
6. [Generación Automática de Código](#generación-automática-de-código)
    - [JSON Schema 2 POJO](#json-schema-2-pojo)
    - [OpenAPI Generator](#openapi-generator)
    - [MapStruct - Transformación de Modelos](#mapstruct---transformación-de-modelos)
    - [Flujo Completo de Generación](#flujo-completo-de-generación)
7. [Conceptos Clave](#conceptos-clave)
8. [Cómo Funciona el Sistema](#cómo-funciona-el-sistema)
9. [Sistema de Tests Basado en Ficheros JSON](#sistema-de-tests-basado-en-ficheros-json)
10. [Cómo Agregar Nuevos Endpoints](#cómo-agregar-nuevos-endpoints)
11. [Comandos Útiles](#comandos-útiles)
12. [Troubleshooting](#troubleshooting)

---

# 🎯 Bienvenida

Este documento explica de forma **completa y único** el proyecto **Moodle OpenAPI Adapter**.

## ¿Qué hace?

Proporciona una **API REST moderna** que conecta con **Moodle** y expone sus funciones mediante **OpenAPI 3.0**.

## ¿Por qué es necesario?

- Moodle tiene web services complejos y poco intuitivos
- Las respuestas de Moodle son inconsistentes
- Faltan validaciones en la entrada
- Este adaptador:
    - ✅ Simplifica los endpoints
    - ✅ Ofrece interfaz REST estándar
    - ✅ Valida automáticamente con Jakarta Validation
    - ✅ Mapea automáticamente datos
    - ✅ Documenta con Swagger/OpenAPI

---

# 👨‍💻 Para Consumidores del API

Si eres un **cliente/consumidor** de este API REST, esta sección te muestra cómo usar los endpoints.

## 🔐 Autenticación

### Paso 1: Obtener Token

**Primero**, haz login en Moodle para obtener un token:

```http
POST /api/public/login HTTP/1.1
Host: localhost:8080
Content-Type: application/json

{
    "host": "https://your-moodle.com",
    "username": "admin",
    "password": "password123"
}
```

**Response:**

```json
{
    "token": "abc123def456ghi789",
    "privatetoken": "abc123def456ghi789"
}
```

**Guarda el token** - lo necesitarás para todos los siguientes requests.

### Paso 2: Usar Token en Headers

Para **todos los siguientes requests**, incluye estos headers:

```
X-Moodle-Token: abc123def456ghi789
X-Moodle-Host: https://your-moodle.com
```

## 📋 Headers Requeridos

### Headers de Autenticación (Obligatorios)

| Header           | Tipo   | Descripción                                  |
|------------------|--------|----------------------------------------------|
| `X-Moodle-Token` | String | Token obtenido en el login                   |
| `X-Moodle-Host`  | URI    | URL del Moodle (ej: `https://moodle.ubu.es`) |

### Headers Estándar (Recomendados)

| Header         | Tipo   | Descripción        |
|----------------|--------|--------------------|
| `Content-Type` | String | `application/json` |
| `Accept`       | String | `application/json` |
| `User-Agent`   | String | Tu aplicación      |

## 📨 Estructura de Respuestas

### Respuesta Exitosa (200 OK)

```json
{
    "data": {
        // Contenido específico del endpoint
    },
    "warnings": []
}
```

O directamente (según endpoint):

```json
{
    "users": [
        {
            "id": 4,
            "username": "student1",
            "firstname": "John",
            "lastname": "Doe",
            "email": "john@example.com"
        }
    ],
    "warnings": []
}
```

### Respuesta con Error

```json
{
    "error": {
        "code": 401,
        "message": "Unauthorized - Invalid token"
    }
}
```

## 💻 Ejemplos de Uso

### 1️⃣ CURL

#### Login

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "host": "https://moodle.example.com",
    "username": "admin",
    "password": "password123"
  }'
```

#### Obtener Cursos (con token)

```bash
curl -X GET http://localhost:8080/courses \
  -H "X-Moodle-Token: abc123def456ghi789" \
  -H "X-Moodle-Host: https://moodle.example.com"
```

#### Obtener Usuarios del Curso

```bash
curl -X GET "http://localhost:8080/courses/69/users" \
  -H "X-Moodle-Token: abc123def456ghi789" \
  -H "X-Moodle-Host: https://moodle.example.com"
```

---

### 2️⃣ JavaScript / Fetch API

```javascript
// Token global
let token = null;
let moodleHost = null;

// 1. Login
async function login(host, username, password) {
    const response = await fetch('http://localhost:8080/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            host: host,
            username: username,
            password: password
        })
    });

    const data = await response.json();
    token = data.token;
    moodleHost = host;
    
    console.log('Token obtenido:', token);
    return data;
}

// 2. Función auxiliar para hacer requests
async function apiRequest(endpoint, method = 'GET', body = null) {
    if (!token) {
        throw new Error('No autenticado. Haz login primero.');
    }

    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
            'X-Moodle-Token': token,
            'X-Moodle-Host': moodleHost
        }
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(
        `http://localhost:8080${endpoint}`,
        options
    );

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

// 3. Uso

// Login
await login(
    'https://moodle.example.com',
    'admin',
    'password123'
);

// Obtener cursos
const courses = await apiRequest('/courses');
console.log('Cursos:', courses);

// Obtener usuarios del curso 69
const users = await apiRequest('/courses/69/users');
console.log('Usuarios:', users);

// Obtener contenidos del curso
const contents = await apiRequest('/courses/69/contents');
console.log('Contenidos:', contents);
```

---

### 3️⃣ Python

```python
import requests
import json

class MoodleAPI:
    def __init__(self, api_url='http://localhost:8080'):
        self.api_url = api_url
        self.token = None
        self.moodle_host = None
        self.session = requests.Session()
    
    def login(self, host, username, password):
        """Obtener token de autenticación"""
        response = self.session.post(
            f'{self.api_url}/login',
            json={
                'host': host,
                'username': username,
                'password': password
            }
        )
        response.raise_for_status()
        
        data = response.json()
        self.token = data['token']
        self.moodle_host = host
        
        print(f'✅ Token obtenido: {self.token[:10]}...')
        return data
    
    def _make_request(self, endpoint, method='GET', json_data=None):
        """Hacer request con headers de autenticación"""
        if not self.token:
            raise ValueError('No autenticado. Haz login primero.')
        
        headers = {
            'X-Moodle-Token': self.token,
            'X-Moodle-Host': self.moodle_host,
            'Content-Type': 'application/json'
        }
        
        url = f'{self.api_url}{endpoint}'
        
        if method == 'GET':
            response = self.session.get(url, headers=headers)
        elif method == 'POST':
            response = self.session.post(url, headers=headers, json=json_data)
        else:
            raise ValueError(f'Método no soportado: {method}')
        
        response.raise_for_status()
        return response.json()
    
    def get_courses(self):
        """Obtener todos los cursos"""
        return self._make_request('/courses')
    
    def get_course_users(self, course_id):
        """Obtener usuarios del curso"""
        return self._make_request(f'/courses/{course_id}/users')
    
    def get_course_contents(self, course_id):
        """Obtener contenidos del curso"""
        return self._make_request(f'/courses/{course_id}/contents')
    
    def get_course_grades(self, course_id):
        """Obtener calificaciones del curso"""
        return self._make_request(f'/courses/{course_id}/grades')
    
    def get_site_info(self):
        """Obtener información del sitio"""
        return self._make_request('/site/info')

# Uso
if __name__ == '__main__':
    api = MoodleAPI('http://localhost:8080')
    
    # Login
    api.login(
        host='https://moodle.example.com',
        username='admin',
        password='password123'
    )
    
    # Obtener cursos
    courses = api.get_courses()
    print('📚 Cursos:', json.dumps(courses, indent=2))
    
    # Obtener usuarios del curso 69
    users = api.get_course_users(69)
    print('👥 Usuarios:', json.dumps(users, indent=2))
    
    # Obtener contenidos
    contents = api.get_course_contents(69)
    print('📄 Contenidos:', json.dumps(contents, indent=2))
    
    # Obtener calificaciones
    grades = api.get_course_grades(69)
    print('⭐ Calificaciones:', json.dumps(grades, indent=2))
    
    # Información del sitio
    info = api.get_site_info()
    print('ℹ️ Info Sitio:', json.dumps(info, indent=2))
```

---

### 4️⃣ JavaScript / Axios

```javascript
import axios from 'axios';

class MoodleAPIClient {
    constructor(apiUrl = 'http://localhost:8080') {
        this.apiUrl = apiUrl;
        this.client = axios.create({
            baseURL: apiUrl,
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    async login(host, username, password) {
        try {
            const response = await this.client.post('/login', {
                host,
                username,
                password
            });
            
            this.token = response.data.token;
            this.moodleHost = host;
            
            // Agregar headers a todas las siguientes requests
            this.client.defaults.headers['X-Moodle-Token'] = this.token;
            this.client.defaults.headers['X-Moodle-Host'] = this.moodleHost;
            
            console.log('✅ Autenticado');
            return response.data;
        } catch (error) {
            console.error('❌ Login fallido:', error.response?.data);
            throw error;
        }
    }

    async getCourses() {
        return (await this.client.get('/courses')).data;
    }

    async getCourseUsers(courseId) {
        return (await this.client.get(`/courses/${courseId}/users`)).data;
    }

    async getCourseContents(courseId) {
        return (await this.client.get(`/courses/${courseId}/contents`)).data;
    }

    async getGrades(courseId) {
        return (await this.client.get(`/courses/${courseId}/grades`)).data;
    }

    async getSiteInfo() {
        return (await this.client.get('/site/info')).data;
    }
}

// Uso
const api = new MoodleAPIClient('http://localhost:8080');

await api.login(
    'https://moodle.example.com',
    'admin',
    'password123'
);

const courses = await api.getCourses();
console.log('Cursos:', courses);

const users = await api.getCourseUsers(69);
console.log('Usuarios:', users);
```

---

### 5️⃣ C# / HttpClient

```csharp
using System;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

public class MoodleAPIClient
{
    private readonly HttpClient _httpClient;
    private string _token;
    private string _moodleHost;
    
    public MoodleAPIClient(string apiUrl = "http://localhost:8080")
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(apiUrl)
        };
    }
    
    public async Task LoginAsync(string host, string username, string password)
    {
        var loginData = new
        {
            host = host,
            username = username,
            password = password
        };
        
        var json = JsonSerializer.Serialize(loginData);
        var content = new StringContent(json, Encoding.UTF8, "application/json");
        
        var response = await _httpClient.PostAsync("/login", content);
        response.EnsureSuccessStatusCode();
        
        var jsonResponse = await response.Content.ReadAsStringAsync();
        var loginResponse = JsonSerializer.Deserialize<JsonElement>(jsonResponse);
        
        _token = loginResponse.GetProperty("token").GetString();
        _moodleHost = host;
        
        // Agregar headers
        _httpClient.DefaultRequestHeaders.Add("X-Moodle-Token", _token);
        _httpClient.DefaultRequestHeaders.Add("X-Moodle-Host", _moodleHost);
        
        Console.WriteLine("✅ Autenticado");
    }
    
    public async Task<string> GetCoursesAsync()
    {
        var response = await _httpClient.GetAsync("/courses");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }
    
    public async Task<string> GetCourseUsersAsync(int courseId)
    {
        var response = await _httpClient.GetAsync($"/courses/{courseId}/users");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadAsStringAsync();
    }
}

// Uso
var client = new MoodleAPIClient("http://localhost:8080");

await client.LoginAsync(
    "https://moodle.example.com",
    "admin",
    "password123"
);

var courses = await client.GetCoursesAsync();
Console.WriteLine("Cursos: " + courses);

var users = await client.GetCourseUsersAsync(69);
Console.WriteLine("Usuarios: " + users);
```

---

## ⚠️ Manejo de Errores

### Errores Comunes y Soluciones

#### 1. 401 Unauthorized - Token Inválido

```json
{
    "error": {
        "code": 401,
        "message": "Invalid or expired token"
    }
}
```

**Solución:**

- Verifica que el token no haya expirado
- Vuelve a hacer login
- Comprueba que incluyes el header `X-Moodle-Token`

#### 2. 400 Bad Request - Parámetros Inválidos

```json
{
    "error": {
        "code": 400,
        "message": "Invalid courseId format"
    }
}
```

**Solución:**

- Verifica que los parámetros sean del tipo correcto
- Consulta la documentación del endpoint
- Usa Swagger para ver el esquema esperado

#### 3. 404 Not Found - Recurso No Existe

```json
{
    "error": {
        "code": 404,
        "message": "Course not found"
    }
}
```

**Solución:**

- Verifica que la ID del recurso sea correcta
- Asegúrate que tienes acceso al recurso
- Consulta con el administrador de Moodle

#### 4. 500 Internal Server Error

```json
{
    "error": {
        "code": 500,
        "message": "Internal server error"
    }
}
```

**Solución:**

- Verifica los logs del servidor
- Contacta al administrador
- Retry con backoff exponencial

### Reintentos (Retry Logic)

```javascript
async function apiRequestWithRetry(endpoint, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await apiRequest(endpoint);
        } catch (error) {
            if (attempt === maxRetries) throw error;
            
            console.log(`Intento ${attempt} fallido, reintentando en ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Backoff exponencial
        }
    }
}
```

---

## 📚 Documentación Interactiva

### Swagger UI

```
http://localhost:8080/swagger-ui.html
```

**Puedes:**

- ✅ Ver todos los endpoints
- ✅ Hacer requests directamente
- ✅ Ver esquemas de request/response
- ✅ Probar autenticación

### ReDoc

```
http://localhost:8080/redoc.html
```

**Mejor para:**

- 📖 Lectura de documentación limpia
- 🔍 Búsqueda de endpoints
- 📊 Visualización de esquemas

---

## 🤖 Generación Automática de Clientes OpenAPI

**La forma más profesional** es descargar el spec OpenAPI y generar el cliente automáticamente. ¡No necesitas escribir
código HTTP manualmente!

### Paso 1: Descargar el OpenAPI Spec

#### Opción A: JSON

```
http://localhost:8080/v3/api-docs
```

O directamente:

```bash
curl http://localhost:8080/v3/api-docs > openapi.json
```

#### Opción B: YAML

```
http://localhost:8080/v3/api-docs.yaml
```

O directamente:

```bash
curl http://localhost:8080/v3/api-docs.yaml > openapi.yaml
```

### Paso 2: Usar OpenAPI Generator

**OpenAPI Generator** genera clientes automáticamente en **20+ lenguajes**.

#### Instalación

```bash
# Mac / Linux
npm install -g @openapitools/openapi-generator-cli

# O con Homebrew (Mac)
brew install openapi-generator

# O con Docker
docker pull openapitools/openapi-generator-cli
```

#### Generar Cliente TypeScript / JavaScript

```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-fetch \
  -o ./generated-client
```

O con variables de configuración:

```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g typescript-fetch \
  -o ./generated-client \
  -p packageName=MoodleAdapter \
  -p packageVersion=1.0.0 \
  -p supportsES6=true
```

#### Generar Cliente Python

```bash
openapi-generator-cli generate \
  -i openapi.yaml \
  -g python \
  -o ./generated-client \
  -p packageName=moodle_adapter
```

#### Generar Cliente Java

```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g java \
  -o ./generated-client \
  -p groupId=com.example \
  -p artifactId=moodle-adapter \
  -p packageName=com.example.moodle
```

#### Generar Cliente C#

```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g csharp \
  -o ./generated-client \
  -p packageName=MoodleAdapter
```

#### Generar Cliente Go

```bash
openapi-generator-cli generate \
  -i openapi.json \
  -g go \
  -o ./generated-client \
  -p packageName=moodleadapter
```

#### ☕ Java con Maven (Recomendado para Java)

**La forma profesional en Java es usar Maven + plugin de OpenAPI Generator con archivo local.**

##### Paso 0: Descargar el OpenAPI Spec

**Primero**, descarga el spec y guárdalo en tu proyecto:

```bash
# Crear carpeta
mkdir -p src/main/resources/openapi

# Descargar (elije una opción)
# Opción A: YAML (recomendado)
curl http://localhost:8080/v3/api-docs.yaml > src/main/resources/openapi/openapi.yaml

# Opción B: JSON
curl http://localhost:8080/v3/api-docs > src/main/resources/openapi/openapi.json
```

**Resultado:** Archivo `openapi.yaml` en `src/main/resources/openapi/`

##### Paso 1: Crear proyecto Maven

```bash
mvn archetype:generate \
  -DgroupId=com.example \
  -DartifactId=moodle-client \
  -DarchetypeArtifactId=maven-archetype-quickstart \
  -DinteractiveMode=false

cd moodle-client

# Copiar el spec descargado
mkdir -p src/main/resources/openapi
cp ../openapi.yaml src/main/resources/openapi/
```

##### Paso 2: Configurar `pom.xml`

Agrega el plugin (usa el archivo local de `resources`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.example</groupId>
    <artifactId>moodle-client</artifactId>
    <version>1.0.0</version>
    <packaging>jar</packaging>

    <name>Moodle OpenAPI Client</name>
    <description>Cliente generado automáticamente para Moodle OpenAPI</description>

    <properties>
        <maven.compiler.source>11</maven.compiler.source>
        <maven.compiler.target>11</maven.compiler.target>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <dependencies>
        <!-- HTTP Client -->
        <dependency>
            <groupId>com.squareup.okhttp3</groupId>
            <artifactId>okhttp</artifactId>
            <version>4.11.0</version>
        </dependency>

        <!-- JSON -->
        <dependency>
            <groupId>com.google.code.gson</groupId>
            <artifactId>gson</artifactId>
            <version>2.10.1</version>
        </dependency>

        <!-- Logging -->
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
            <version>2.0.7</version>
        </dependency>

        <!-- Testing -->
        <dependency>
            <groupId>junit</groupId>
            <artifactId>junit</artifactId>
            <version>4.13.2</version>
            <scope>test</scope>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- OpenAPI Generator Plugin -->
            <plugin>
                <groupId>org.openapitools</groupId>
                <artifactId>openapi-generator-maven-plugin</artifactId>
                <version>7.2.0</version>
                <executions>
                    <execution>
                        <goals>
                            <goal>generate</goal>
                        </goals>
                        <configuration>
                            <!-- Usar archivo local -->
                            <inputSpec>${project.basedir}/src/main/resources/openapi/openapi.yaml</inputSpec>

                            <!-- Tipo de generador -->
                            <generatorName>java</generatorName>

                            <!-- Dónde generar -->
                            <output>${project.build.directory}/generated-sources/openapi</output>

                            <!-- Configuración del cliente Java -->
                            <configOptions>
                                <packageName>com.example.moodle.client</packageName>
                                <groupId>com.example</groupId>
                                <artifactId>moodle-client</artifactId>
                                <artifactVersion>1.0.0</artifactVersion>
                                <library>okhttp-gson</library>
                            </configOptions>
                        </configuration>
                    </execution>
                </executions>
            </plugin>

            <!-- Maven Compiler Plugin -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.11.0</version>
                <configuration>
                    <source>11</source>
                    <target>11</target>
                </configuration>
            </plugin>

            <!-- Build Helper Plugin (para agregar generated sources) -->
            <plugin>
                <groupId>org.codehaus.mojo</groupId>
                <artifactId>build-helper-maven-plugin</artifactId>
                <version>3.4.0</version>
                <executions>
                    <execution>
                        <phase>generate-sources</phase>
                        <goals>
                            <goal>add-source</goal>
                        </goals>
                        <configuration>
                            <sources>
                                <source>${project.build.directory}/generated-sources/openapi/src/main/java</source>
                            </sources>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

##### Paso 3: Generar el cliente

```bash
mvn clean generate-sources
```

**Resultado:**

- Código generado en: `target/generated-sources/openapi/`
- Automáticamente compilado con Maven
- Listo para usar

##### Paso 4: Usar el cliente generado

Crea una clase `MoodleClientExample.java`:

**Nota Importante:** Los tipos de respuesta son **específicos y generados automáticamente**:

- `LoginResponse` - para login
- `CoursesResponseDto` - para obtener cursos
- `CourseUsersResponseDto` - para usuarios del curso
- `CourseContentsResponseDto` - para contenidos
- `CourseGradesResponseDto` - para calificaciones

**Nunca uses `Object`** - OpenAPI Generator genera clases tipadas para cada response.

```java
package com.example.moodle;

import com.example.moodle.client.ApiClient;
import com.example.moodle.client.api.DefaultApi;
import com.example.moodle.client.model.LoginRequest;
import com.example.moodle.client.model.LoginResponse;
import com.example.moodle.client.model.CoursesResponseDto;
import com.example.moodle.client.model.CourseUsersResponseDto;
import com.example.moodle.client.model.CourseContentsResponseDto;
import com.example.moodle.client.model.CourseGradesResponseDto;

public class MoodleClientExample {
    
    public static void main(String[] args) throws Exception {
        // Crear cliente
        ApiClient apiClient = new ApiClient();
        apiClient.setBasePath("http://localhost:8080");
        
        DefaultApi api = new DefaultApi(apiClient);
        
        // Login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setHost("https://moodle.example.com");
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password123");
        
        try {
            LoginResponse loginResponse = api.login(loginRequest);
            String token = loginResponse.getToken();
            
            System.out.println("✅ Token obtenido: " + token);
            
            // Configurar headers para próximas requests
            apiClient.addDefaultHeader("X-Moodle-Token", token);
            apiClient.addDefaultHeader("X-Moodle-Host", "https://moodle.example.com");
            
            // Obtener cursos
            CoursesResponseDto courses = api.getCourses();
            System.out.println("📚 Cursos: " + courses.getCourses().size() + " cursos encontrados");
            courses.getCourses().forEach(course -> 
                System.out.println("  - " + course.getId() + ": " + course.getFullname())
            );
            
            // Obtener usuarios del curso 69
            CourseUsersResponseDto users = api.getCourseUsers(69);
            System.out.println("👥 Usuarios del curso: " + users.getUsers().size() + " usuarios");
            users.getUsers().forEach(user -> 
                System.out.println("  - " + user.getId() + ": " + user.getFirstname() + " " + user.getLastname())
            );
            
            // Obtener contenidos
            CourseContentsResponseDto contents = api.getCourseContents(69);
            System.out.println("📄 Contenidos: " + contents.getContents().size() + " módulos");
            contents.getContents().forEach(module -> 
                System.out.println("  - Módulo " + module.getId())
            );
            
            // Obtener calificaciones
            CourseGradesResponseDto grades = api.getCourseGrades(69);
            System.out.println("⭐ Calificaciones: " + grades.getGrades().size() + " estudiantes");
            grades.getGrades().forEach(grade -> 
                System.out.println("  - Usuario " + grade.getUserId() + ": " + grade.getRawgrade())
            );
            
        } catch (Exception e) {
            System.err.println("❌ Error: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

##### Paso 5: Ejecutar

```bash
# Compilar
mvn clean compile

# Ejecutar la aplicación
mvn exec:java -Dexec.mainClass="com.example.moodle.MoodleClientExample"
```

##### Ventajas de Maven + OpenAPI Generator

✅ **Integración Maven** - Generación automática con `mvn clean generate-sources`
✅ **Reproducible** - Mismo resultado siempre
✅ **Versionable** - pom.xml en git = cliente versionado
✅ **CI/CD listo** - Funciona en pipelines
✅ **Dependencias automáticas** - Maven las maneja
✅ **Multi-módulo** - Puedes tener múltiples clients
✅ **Offline** - No necesita conexión a Moodle
✅ **Archivo Local** ⭐ - El spec en `src/main/resources/` se versionea con el código

##### ℹ️ Por qué Archivo Local (recomendado)

El pom.xml que vimos **usa `src/main/resources/openapi/openapi.yaml`** (archivo local).

**Ventajas:**

```
✅ Reproducible       - Todos generan igual (mismo spec)
✅ Versionable        - El spec está en git
✅ Offline            - No necesita conectar al servidor Moodle
✅ CI/CD              - Funciona en pipelines sin acceso a Moodle
✅ Sincronizado       - Sabes exactamente qué versión usas
✅ Actualizable       - Descargas nuevo spec cuando quieras
```

**Proceso:**

```
1. Descargar spec: curl http://localhost:8080/v3/api-docs.yaml > src/main/resources/openapi/openapi.yaml
2. Guardar en git
3. Ejecutar: mvn clean generate-sources
4. Listo - no necesita conexión a Moodle
```

---

```javascript
import { DefaultApi, LoginRequest } from './generated-client';

const api = new DefaultApi();

// Login
const loginRequest = new LoginRequest();
loginRequest.host = 'https://moodle.example.com';
loginRequest.username = 'admin';
loginRequest.password = 'password123';

const response = await api.login(loginRequest);
console.log('Token:', response.token);

// Usar el token
api.setApiKeyHeader('X-Moodle-Token', response.token);
api.setApiKeyHeader('X-Moodle-Host', 'https://moodle.example.com');

// Obtener cursos
const courses = await api.getCourses();
console.log('Cursos:', courses);
```

#### Python

```python
from generated_client.api.default_api import DefaultApi
from generated_client.model.login_request import LoginRequest
from generated_client.configuration import Configuration

# Configurar
config = Configuration()
config.host = 'http://localhost:8080'

# Crear cliente
api = DefaultApi(api_client=Client(configuration=config))

# Login
login_req = LoginRequest(
    host='https://moodle.example.com',
    username='admin',
    password='password123'
)

response = api.login(login_req)
print(f'Token: {response.token}')

# Configurar headers
config.api_key_prefix['X-Moodle-Token'] = response.token
config.api_key_prefix['X-Moodle-Host'] = 'https://moodle.example.com'

# Obtener cursos
courses = api.get_courses()
print(f'Cursos: {courses}')
```

#### Java

```java
import com.example.moodle.ApiClient;
import com.example.moodle.api.DefaultApi;
import com.example.moodle.model.LoginRequest;
import com.example.moodle.model.LoginResponse;

public class MoodleExample {
    public static void main(String[] args) throws Exception {
        // Configurar cliente
        ApiClient defaultClient = new ApiClient();
        defaultClient.setBasePath("http://localhost:8080");
        
        DefaultApi api = new DefaultApi(defaultClient);
        
        // Login
        LoginRequest loginRequest = new LoginRequest();
        loginRequest.setHost("https://moodle.example.com");
        loginRequest.setUsername("admin");
        loginRequest.setPassword("password123");
        
        LoginResponse response = api.login(loginRequest);
        System.out.println("Token: " + response.getToken());
        
        // Configurar headers
        defaultClient.addDefaultHeader("X-Moodle-Token", response.getToken());
        defaultClient.addDefaultHeader("X-Moodle-Host", "https://moodle.example.com");
        
        // Obtener cursos con tipo específico
        CoursesResponseDto courses = api.getCourses();
        System.out.println("Cursos: " + courses.getCourses().size());
        courses.getCourses().forEach(c -> System.out.println("  - " + c.getFullname()));
    }
}
```

#### C#

```csharp
using MoodleAdapter.Api;
using MoodleAdapter.Model;

class Program {
    static async Task Main() {
        // Configurar cliente
        var config = new Configuration();
        config.BasePath = "http://localhost:8080";
        
        var api = new DefaultApi(config);
        
        // Login
        var loginRequest = new LoginRequest {
            Host = "https://moodle.example.com",
            Username = "admin",
            Password = "password123"
        };
        
        var response = await api.LoginAsync(loginRequest);
        Console.WriteLine($"Token: {response.Token}");
        
        // Configurar headers
        config.AddDefaultHeader("X-Moodle-Token", response.Token);
        config.AddDefaultHeader("X-Moodle-Host", "https://moodle.example.com");
        
        // Obtener cursos
        var courses = await api.GetCoursesAsync();
        Console.WriteLine($"Cursos: {courses}");
    }
}
```

### Ventajas de Usar OpenAPI Generator

✅ **Código generado automáticamente** - No escribes cliente HTTP manualmente
✅ **Type-safe** - Modelos tipados con validaciones
✅ **Sincronizado** - Siempre usa la versión actual del API
✅ **Multiplataforma** - Genera en 20+ lenguajes
✅ **Documentación automática** - Includes docstrings
✅ **Manejo de errores** - Ya incluido en el código generado

### Alternativas Populares

| Herramienta                     | Lenguajes        | Sitio Web                                | Nota                         |
|---------------------------------|------------------|------------------------------------------|------------------------------|
| **OpenAPI Generator (CLI)**     | 20+              | https://openapi-generator.tech           | Línea de comandos            |
| **OpenAPI Generator (Maven)** ⭐ | Todos            | https://openapi-generator.tech           | Ver ejemplo arriba para Java |
| **Swagger Codegen**             | 15+              | https://swagger.io/tools/swagger-codegen | Anterior, menos mantenido    |
| **AutoRest** (Microsoft)        | 5+               | https://github.com/Azure/autorest        | Para Azure                   |
| **NSwag** (.NET)                | C#, TypeScript   | https://github.com/RicoSuter/NSwag       | Especializado en .NET        |
| **Kiota** (Microsoft)           | C#, Java, Python | https://microsoft.github.io/kiota        | Reemplazo de AutoRest        |

### Configuración Avanzada

Puedes personalizar la generación creando un archivo `openapi-generator-config.yaml`:

```yaml
# openapi-generator-config.yaml
packageName: my-moodle-client
packageVersion: 1.0.0
generatorName: typescript-fetch

# Opciones específicas
withInterfaces: true
validateSpec: true
```

Y luego:

```bash
openapi-generator-cli generate \
  -i openapi.json \
  -c openapi-generator-config.yaml \
  -o ./generated-client
```

---

```
┌─────────────────────────────────────────┐
│ CLIENTE                                 │
└──────────────┬──────────────────────────┘
               │
               ▼
    1️⃣ POST /login
       {host, username, password}
               │
               ▼
    Response: {token, userId, warnings}
    Guardar: token ← "abc123..."
               │
               ▼
    2️⃣ GET /courses
       Headers:
       - X-Moodle-Token: abc123...
       - X-Moodle-Host: https://moodle.com
               │
               ▼
    Response: {courses: [...]}
               │
               ▼
    3️⃣ GET /courses/69/users
       Headers:
       - X-Moodle-Token: abc123...
       - X-Moodle-Host: https://moodle.com
               │
               ▼
    Response: {users: [...], warnings: []}
               │
               ▼
    4️⃣ GET /courses/69/contents
    5️⃣ GET /courses/69/grades
    ... (más requests)
```

---

## Flujo General de una Request

```
┌─────────────────┐
│ Cliente HTTP    │
│  GET /api/...   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│ REST Controller (OpenAPI Gen)   │
│ - Recibe request                │
│ - Valida parámetros (@Valid)    │
└────────┬────────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Service Layer (Business)     │
│ - Lógica de negocio          │
│ - Orquesta operaciones       │
└────────┬─────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ MoodleEndpoint (Strategy)      │
│ - Construye request Moodle     │
│ - Define tipo respuesta        │
│ - Mapea response               │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ MapStruct Mapper               │
│ DTO → MoodleRequest            │
│ MoodleResponse → DTO           │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ MoodleClient (WebClient)       │
│ - HTTP POST/GET reactivo       │
│ - Propaga context (token)      │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Moodle API (HTTP)              │
│ POST /webservice/rest/...      │
│ Core_xxx_yyy funciones         │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Moodle Response (Bruta)        │
│ - Con todos los campos         │
│ - Poco estructurada            │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ MapStruct Mapper (salida)      │
│ Limpia y estructura            │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ DTO Response (REST API)        │
│ - Limpio para cliente          │
│ - Solo campos necesarios       │
└────────┬───────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│ Response HTTP JSON              │
│ {                               │
│   "users": [...],               │
│   "warnings": [...]             │
│ }                               │
└─────────────────────────────────┘
```

## Componentes Principales

### 1. **Controllers**

Implementan interfaces delegadas generadas por OpenAPI Generator.

```java

@RestController
public class CoursesController implements CoursesApi {
    private final CoursesApiDelegate delegate;

    public Mono<ResponseEntity<CourseUsersResponseDto>> getCourseUsers(...) {
        return delegate.getCourseUsers(...);
    }
}
```

### 2. **Services**

Contienen lógica de negocio e implementan delegates.

```java

@Service
public class CourseService implements CoursesApiDelegate {
    private final MoodleService moodleService;
    private final GetCourseUsersEndpoint endpoint;

    public Mono<CourseUsersResponseDto> getCourseUsers(...) {
        return moodleService.callEndpoint(endpoint, courseId);
    }
}
```

### 3. **Mappers (MapStruct)**

Transforman entre capas de modelos.

```java

@Mapper(componentModel = "spring")
public interface CourseUsersMapper {
    GetEnrolledUsersRequest toMoodleRequest(Integer courseId, Options options);

    CourseUsersResponseDto toDto(GetEnrolledUsersResponse response);
}
```

### 4. **Endpoints (Strategy Pattern)**

Define cómo construir y procesar requests a Moodle.

```java
public interface MoodleEndpoint<R, S, T> {
    R buildRequest(Object... params);

    ParameterizedTypeReference<S> getResponseType();

    T mapResponse(S response, Object... params);
}
```

### 5. **MoodleClient**

Cliente HTTP reactivo que comunica con Moodle.

```java

@Component
public class MoodleClient {
    public <T> Mono<T> callMoodleApi(MoodleContext ctx, Object request) {
        return webClient.post()
            .uri(ctx.getHost() + "/webservice/rest/server.php")
            .header("Authorization", "Bearer " + ctx.getToken())
            .bodyValue(request)
            .retrieve()
            .bodyToMono(responseType);
    }
}
```

---

# 💻 Tecnologías Utilizadas

| Tecnología             | Versión | Propósito                      |
|------------------------|---------|--------------------------------|
| **Java**               | 25      | Lenguaje de programación       |
| **Spring Boot**        | 3.5.12  | Framework backend              |
| **WebFlux**            | 3.5.12  | Programación reactiva          |
| **OpenAPI Generator**  | 7.2.0   | Generar controllers + DTOs     |
| **JSON Schema 2 POJO** | 1.3.3   | Generar modelos Moodle         |
| **MapStruct**          | 1.6.3   | Mapeo automático entre modelos |
| **Lombok**             | 1.18.42 | Reduce boilerplate             |
| **Jakarta Validation** | -       | Validación de datos            |
| **SpringDoc OpenAPI**  | 2.8.16  | Documentación Swagger/OpenAPI  |
| **WireMock**           | 3.13.2  | Mock HTTP para tests           |
| **JSON Unit**          | 5.1.0   | Assertions para JSON en tests  |

---

# 📁 Estructura de Carpetas

## Árbol de Directorios

```
moodle-openapi-adapter/
│
├── src/main/
│   │
│   ├── java/es/ubu/lsi/moodleadapter/
│   │   ├── Application.java                 ← PUNTO DE ENTRADA
│   │   │
│   │   ├── client/
│   │   │   └── MoodleClient.java            ← HTTP client reactivo
│   │   │
│   │   ├── config/
│   │   │   ├── MoodleContext.java           ← Token + Host
│   │   │   ├── HeaderWebFilter.java         ← Extrae headers
│   │   │   ├── WebClientConfig.java        ← Configura HTTP
│   │   │   └── (más configs)
│   │   │
│   │   ├── exception/
│   │   │   ├── MoodleApiException.java      ← Padre
│   │   │   ├── UnauthorizedException.java
│   │   │   ├── NotFoundException.java
│   │   │   └── (más excepciones)
│   │   │
│   │   ├── mapper/                          ← MAPSTRUCT MAPPERS
│   │   │   ├── LoginMapper.java
│   │   │   ├── MapperUtils.java
│   │   │   ├── course/
│   │   │   ├── site/
│   │   │   └── user/
│   │   │
│   │   ├── service/
│   │   │   ├── login/
│   │   │   ├── course/
│   │   │   ├── user/
│   │   │   ├── site/
│   │   │   └── moodle/
│   │   │       ├── MoodleService.java
│   │   │       ├── MoodleEndpoint.java
│   │   │       └── endpoint/
│   │   │
│   │   └── utils/
│   │
│   └── resources/
│       ├── application.yml
│       ├── logback-spring.xml
│       ├── moodle/schema/                   ← JSON SCHEMAS (ENTRADA)
│       │   ├── core/
│       │   ├── gradereport/
│       │   └── login/
│       └── static/openapi/
│           ├── openapi.yaml                 ← OPENAPI SPEC (ENTRADA)
│           └── (componentes y paths)
│
├── target/
│   └── generated-sources/
│       ├── jsonschema2pojo/                 ← SALIDA: MODELOS MOODLE
│       │   └── es/ubu/lsi/moodleadapter/moodle/model/
│       └── openapi/                         ← SALIDA: DTOS API REST
│           └── src/main/java/es/ubu/lsi/moodleadapter/
│               ├── controller/
│               └── dto/
│
├── src/test/
│   ├── java/es/ubu/lsi/moodleadapter/
│   │   ├── AdapterIntegrationTest.java      ← TEST PRINCIPAL
│   │   ├── RequestExecutor.java
│   │   ├── ResponseAsserter.java
│   │   ├── WireMockManager.java
│   │   └── (más utilidades)
│   └── resources/adapter/                   ← TEST CASES EN JSON
│       ├── course_contents/test-case.json
│       ├── course_grades/test-case.json
│       ├── course_users/test-case.json
│       ├── login/test-case.json
│       ├── logs_file/test-case.json
│       └── site_info/test-case.json
│
├── pom.xml                                  ← CONFIGURACIÓN MAVEN + PLUGINS
├── DOCUMENTATION.md                         ← ✅ TÚ ESTÁS AQUÍ (ÚNICO)
└── LICENSE
```

---

# 🤖 Generación Automática de Código

## Concepto Principal: DOS Herramientas de Generación

**Este proyecto NO codifica manualmente los modelos de datos.**

En su lugar, **dos herramientas Maven generan automáticamente** las clases:

1. **JSON Schema 2 POJO** → Modelos de Moodle (Request/Response)
2. **OpenAPI Generator** → Controllers + DTOs REST API

**¿Por qué?**

- ✅ No repites código
- ✅ Los cambios en schemas se reflejan automáticamente
- ✅ Especificación es la fuente de verdad
- ✅ DTOs siempre sincronizados

---

## JSON Schema 2 POJO

### ¿Qué es?

**Herramienta Maven** que lee ficheros **JSON Schema** y genera **clases POJO Java**.

Estas clases representan los **modelos de Request/Response de Moodle API**.

### Ubicación de Schemas

```
src/main/resources/moodle/schema/
├── core/
│   ├── course/getcontents/
│   │   ├── request/GetCourseContentsRequest.json
│   │   └── response/GetCourseContentsResponse.json
│   ├── enrol/getenrolledusers/
│   │   ├── request/GetEnrolledUsersRequest.json
│   │   └── response/GetEnrolledUsersResponse.json
│   └── webservice/
├── gradereport/user/
│   ├── get/
│   │   ├── request/GetGradeReportUserRequest.json
│   │   └── response/GetGradeReportUserResponse.json
│   └── getrange/
└── login/token/
    ├── request/LoginTokenRequest.json
    └── response/LoginTokenResponse.json
```

### Ejemplo de Schema: LoginTokenRequest.json

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "LoginTokenRequest",
    "description": "Request para obtener token de Moodle",
    "type": "object",
    "properties": {
        "wsfunction": {
            "type": "string",
            "description": "Función web service",
            "default": "core_auth_get_login_page"
        },
        "username": {
            "type": "string",
            "description": "Usuario Moodle"
        },
        "password": {
            "type": "string",
            "description": "Contraseña"
        },
        "moodlewsrestformat": {
            "type": "string",
            "description": "Formato respuesta",
            "default": "json"
        }
    },
    "required": [
        "wsfunction",
        "username",
        "password"
    ]
}
```

### Clase Generada: LoginTokenRequest.java

```java
package es.ubu.lsi.moodleadapter.moodle.model.login.token.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;

import javax.annotation.processing.Generated;

/**
 * LoginTokenRequest
 * AUTO-GENERADA por JSON Schema 2 POJO
 * NO EDITAR MANUALMENTE
 */
@Generated("jsonschema2pojo")
public class LoginTokenRequest {

    @JsonProperty("wsfunction")
    private String wsfunction = "core_auth_get_login_page";

    @JsonProperty("username")
    @NotNull
    private String username;

    @JsonProperty("password")
    @NotNull
    private String password;

    @JsonProperty("moodlewsrestformat")
    private String moodlewsrestformat = "json";

    // Getters y setters autogenerados
}
```

### Configuración en pom.xml

```xml

<plugin>
    <groupId>org.jsonschema2pojo</groupId>
    <artifactId>jsonschema2pojo-maven-plugin</artifactId>
    <version>1.3.3</version>
    <configuration>
        <sourceDirectory>${basedir}/src/main/resources/moodle/schema</sourceDirectory>
        <targetPackage>es.ubu.lsi.moodleadapter.moodle.model</targetPackage>
        <outputDirectory>${project.build.directory}/generated-sources/jsonschema2pojo</outputDirectory>
        <addCompileSourceRoot>true</addCompileSourceRoot>
        <useTitleAsClassname>true</useTitleAsClassname>
        <annotationStyle>jackson2</annotationStyle>
        <includeJsr303Annotations>true</includeJsr303Annotations>
        <useJakartaValidation>true</useJakartaValidation>
    </configuration>
    <executions>
        <execution>
            <goals>
                <goal>generate</goal>
            </goals>
        </execution>
    </executions>
</plugin>
```

---

## OpenAPI Generator

### ¿Qué es?

**Herramienta Maven** que lee una **especificación OpenAPI 3.0** y genera:

- **Controllers** (interfaz delegada - TÚ implementas)
- **DTOs** (modelos REST API)
- **Anotaciones Swagger** para documentación

### Especificación OpenAPI

Ubicación: `src/main/resources/static/openapi/openapi.yaml`

```yaml
openapi: 3.0.0
info:
    title: Moodle Adapter API
    version: 1.0.0
    description: REST API para Moodle

servers:
    -   url: http://localhost:8080

paths:
    /login:
        post:
            tags: [ Authentication ]
            summary: Login to Moodle
            requestBody:
                required: true
                content:
                    application/json:
                        schema:
                            $ref: '#/components/schemas/LoginTokenRequest'
            responses:
                '200':
                    description: Login successful
                    content:
                        application/json:
                            schema:
                                $ref: '#/components/schemas/LoginTokenResponse'

    /courses/{courseId}/users:
        get:
            tags: [ Courses ]
            summary: Get enrolled users
            parameters:
                -   name: courseId
                    in: path
                    required: true
                    schema:
                        type: integer
            responses:
                '200':
                    description: Success
                    content:
                        application/json:
                            schema:
                                $ref: '#/components/schemas/CourseUsersResponse'

components:
    schemas:
        LoginTokenRequest:
            type: object
            required: [ username, password, host ]
            properties:
                username:
                    type: string
                password:
                    type: string
                host:
                    type: string
                    format: uri
```

### Clases Generadas

**Ubicación:** `target/generated-sources/openapi/src/main/java/`

#### Interfaz Controller

```java
package es.ubu.lsi.moodleadapter.controller;

/**
 * AUTO-GENERADA por OpenAPI Generator
 * Usar @RestController + LoginApiDelegate para implementar
 */
public interface LoginApi {

    default Mono<ResponseEntity<LoginTokenResponseDto>> login(
        LoginTokenRequestDto loginTokenRequest,
        ServerWebExchange exchange) {
        return Mono.error(new RuntimeException("POST /login - Not implemented"));
    }
}
```

#### DTO Response

```java
package es.ubu.lsi.moodleadapter.dto;

@Schema(description = "Token response from Moodle login")
public class LoginTokenResponseDto {

    @JsonProperty("token")
    private String token;

    @JsonProperty("userId")
    private Integer userId;

    @JsonProperty("warnings")
    @Valid
    private List<WarningDto> warnings;

    // Getters y setters
}
```

### Configuración en pom.xml

```xml

<plugin>
    <groupId>org.openapitools</groupId>
    <artifactId>openapi-generator-maven-plugin</artifactId>
    <version>7.2.0</version>
    <executions>
        <execution>
            <id>generate-moodle-api</id>
            <goals>
                <goal>generate</goal>
            </goals>
            <configuration>
                <inputSpec>${project.basedir}/src/main/resources/static/openapi/openapi.yaml</inputSpec>
                <generatorName>spring</generatorName>
                <library>spring-boot</library>
                <apiPackage>es.ubu.lsi.moodleadapter.controller</apiPackage>
                <modelPackage>es.ubu.lsi.moodleadapter.dto</modelPackage>
                <output>${project.build.directory}/generated-sources/openapi</output>
                <modelNameSuffix>Dto</modelNameSuffix>
                <configOptions>
                    <delegatePattern>true</delegatePattern>
                    <reactive>true</reactive>
                    <useJakartaEe>true</useJakartaEe>
                    <useBeanValidation>true</useBeanValidation>
                    <useResponseEntity>true</useResponseEntity>
                    <jackson>true</jackson>
                </configOptions>
            </configuration>
        </execution>
    </executions>
</plugin>
```

---

## MapStruct - Transformación de Modelos

### El Problema: Tres Capas de Modelos

```
┌────────────────────────────────┐
│ CAPA 1: DTO REST API           │
│ Generado por OpenAPI Gen       │
│ LoginTokenRequestDto           │
│ CourseUsersResponseDto         │
└────────────────┬───────────────┘
                 │
                 │ MapStruct mapper
                 ▼
┌────────────────────────────────┐
│ CAPA 2: Moodle Models          │
│ Generado por JSON Schema 2 POJO│
│ LoginTokenRequest              │
│ GetEnrolledUsersResponse       │
└────────────────┬───────────────┘
                 │
                 │ HTTP POST JSON
                 ▼
┌────────────────────────────────┐
│ CAPA 3: Moodle HTTP API        │
│ POST /webservice/rest/server.php
│ Respuesta JSON bruta           │
└────────────────────────────────┘
```

### La Solución: MapStruct

**MapStruct** genera código que crea **mappers automáticamente** en tiempo de compilación.

```java

@Mapper(componentModel = "spring")
public interface LoginMapper {

    // Convierte DTO REST → Request Moodle
    LoginTokenRequest toRequest(LoginTokenRequestDto dto);

    // Convierte Response Moodle → DTO REST
    LoginTokenResponseDto toResponse(LoginTokenResponse response);
}
```

### Ejemplo Completo: CourseUsersMapper.java

```java
package es.ubu.lsi.moodleadapter.mapper.course;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct Mapper para usuarios de cursos
 *
 * Convierte entre:
 * - GetCourseUsersOptionsParameterDto (filtros cliente)
 * - GetEnrolledUsersRequest (request Moodle)
 * - GetEnrolledUsersResponse (respuesta bruta)
 * - CourseUsersResponseDto (respuesta limpia)
 *
 * @author Yi Peng Ji
 * @version 1.0
 */
@Mapper(componentModel = "spring", uses = MapperUtils.class)
public interface CourseUsersMapper {

    /**
     * Construye Request para Moodle
     */
    @Mapping(target = "wsfunction", ignore = true)
    @Mapping(target = "courseid", source = "courseId")
    @Mapping(target = "options", source = "options")
    GetEnrolledUsersRequest toMoodleRequest(
        Integer courseId,
        GetCourseUsersOptionsParameterDto options);

    /**
     * Convierte opciones a formato Moodle
     */
    default List<Option> map(GetCourseUsersOptionsParameterDto dto) {
        return Stream.of(
                option(Option.Name.WITHCAPABILITY, dto.getWithcapability()),
                option(Option.Name.GROUPID, dto.getGroupid()),
                option(Option.Name.ONLYACTIVE, MapperUtils.booleanToInteger(dto.getOnlyactive())),
                option(Option.Name.ONLYSUSPENDED, MapperUtils.booleanToInteger(dto.getOnlysuspended())),
                option(Option.Name.USERFIELDS, dto.getUserfields()),
                option(Option.Name.LIMITFROM, dto.getLimitfrom()),
                option(Option.Name.LIMITNUMBER, dto.getLimitnumber()),
                option(Option.Name.SORTBY, dto.getSortby()),
                option(Option.Name.SORTDIRECTION, dto.getSortdirection())
            )
            .filter(Objects::nonNull)
            .toList();
    }

    /**
     * Helper para crear Option
     */
    default Option option(Option.Name name, Object value) {
        if (value == null) {
            return null;
        }
        Option opt = new Option();
        opt.setName(name);
        opt.setValue(value);
        return opt;
    }

    /**
     * Mapea response completa
     */
    CourseUsersResponseDto toResponse(GetEnrolledUsersResponse response);

    /**
     * Mapea usuario individual
     */
    EnrolledUserDto toUserDto(GetEnrolledUsersResponse.User user);
}
```

### MapperUtils.java

```java
package es.ubu.lsi.moodleadapter.mapper;

/**
 * Utilidades comunes para todos los mappers
 *
 * @author Yi Peng Ji
 * @version 1.0
 */
public class MapperUtils {

    /**
     * Convierte Boolean → Integer (0 = false, 1 = true)
     * Moodle espera enteros para booleanos
     */
    public static Integer booleanToInteger(Boolean value) {
        if (value == null) {
            return null;
        }
        return value ? 1 : 0;
    }

    /**
     * Convierte Integer → Boolean
     */
    public static Boolean integerToBoolean(Integer value) {
        if (value == null) {
            return null;
        }
        return value != 0;
    }

    /**
     * Limpia espacios en blanco
     */
    public static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
```

### Configuración en pom.xml

```xml

<dependency>
    <groupId>org.mapstruct</groupId>
    <artifactId>mapstruct</artifactId>
    <version>1.6.3</version>
    <scope>provided</scope>
</dependency>

<dependency>
<groupId>org.mapstruct</groupId>
<artifactId>mapstruct-processor</artifactId>
<version>1.6.3</version>
<scope>provided</scope>
</dependency>
```

---

## Flujo Completo de Generación

```
mvn clean generate-sources
        ↓
    ┌───┴───┐
    │       │
    ▼       ▼
[JSON     [OpenAPI
 Schema    Spec
 2 POJO]   Generator]
    │       │
    ▼       ▼
[Models]  [DTOs +
 Request  Controllers]
 Response
    │       │
    └───┬───┘
        ▼
target/generated-sources/
├── jsonschema2pojo/
│   └── es/ubu/lsi/moodleadapter/moodle/model/
└── openapi/
    └── src/main/java/es/ubu/lsi/moodleadapter/
        ├── controller/
        └── dto/
        
        ↓ (Ambos se agregan al classpath)
        
mvn clean compile
        ↓
[Compila modelos + 
 MapStruct procesa +
 Genera implementations]
        ↓
target/classes/
(Clases compiladas)
```

---

# 💡 Conceptos Clave

## 1. Programación Reactiva

```java
// No-bloqueante con Project Reactor
Mono<User> getUser(Integer id)   // 0 o 1 resultado

Flux<User> getAllUsers()          // Múltiples resultados
```

## 2. Pattern Strategy (Endpoints)

```java
public interface MoodleEndpoint<R, S, T> {
    R buildRequest(Object... params);

    ParameterizedTypeReference<S> getResponseType();

    T mapResponse(S response, Object... params);
}
```

## 3. Context (Autenticación)

```java

@Data
public class MoodleContext {
    private String token;    // Token de Moodle
    private URI host;        // URL de Moodle
}

// Se propaga en headers HTTP:
X-Moodle-Token:abc123
X-Moodle-Host:https://moodle.example.com
```

## 4. Validación con Jakarta Validation

```java
public class LoginTokenRequestDto {

    @NotNull
    @Valid
    private URI host;

    @NotBlank
    private String username;

    @NotBlank
    private String password;
}
```

---

# 🔄 Cómo Funciona el Sistema

## Ejemplo Completo: GET /api/courses/69/users

### PASO 1: Request HTTP

```http
GET /api/courses/69/users HTTP/1.1
X-Moodle-Token: abc123
X-Moodle-Host: https://moodle.example.com
```

### PASO 2: HeaderWebFilter extrae Context

```java
MoodleContext context = new MoodleContext();
context.

setToken("abc123");
context.

setHost(URI.create("https://moodle.example.com"));
```

### PASO 3: Controller recibe (autogenerado OpenAPI)

```java

@RestController
public class CoursesController implements CoursesApi {
    public Mono<ResponseEntity<CourseUsersResponseDto>> getCourseUsers(
        Integer courseId,  // 69
        ServerWebExchange exchange) {
        return delegate.getCourseUsers(courseId, exchange);
    }
}
```

### PASO 4: Service (nuestro código)

```java

@Service
public class CourseService implements CoursesApiDelegate {
    public Mono<CourseUsersResponseDto> getCourseUsers(Integer courseId, ...) {
        return moodleService.callEndpoint(getCourseUsersEndpoint, courseId);
    }
}
```

### PASO 5: MoodleService orquesta

```java
public <R, S, T> Mono<T> callEndpoint(MoodleEndpoint<R, S, T> endpoint, Object... params) {
    R request = endpoint.buildRequest(params);  // Construye request
    return moodleClient.callMoodleApi(request)
        .map(response -> endpoint.mapResponse(response, params));  // Mapea response
}
```

### PASO 6: Endpoint Strategy

```java

@Component
public class GetCourseUsersEndpoint
    implements MoodleEndpoint<GetEnrolledUsersRequest, GetEnrolledUsersResponse, CourseUsersResponseDto> {

    private static final ParameterizedTypeReference<GetEnrolledUsersResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    private final GetCourseUsersMapper mapper;

    @Override
    public GetEnrolledUsersRequest buildRequest(Object... params) {
        Integer courseId = (Integer) params[0];
        return mapper.toMoodleRequest(courseId);  // DTO → Request Moodle
    }

    @Override
    public ParameterizedTypeReference<GetEnrolledUsersResponse> getResponseType() {
        return RESPONSE_TYPE;
    }

    @Override
    public CourseUsersResponseDto mapResponse(GetEnrolledUsersResponse response, Object... params) {
        return mapper.toDto(response);  // Response Moodle → DTO
    }
}
```

### PASO 7: MapStruct Mapper

```java
// Entrada: DTO REST (cliente)
GetCourseUsersOptionsParameterDto optionsDto = ...

// toMoodleRequest(): DTO REST → Request Moodle
GetEnrolledUsersRequest request = mapper.toMoodleRequest(69, optionsDto);
// Result: {
//   "wsfunction": "core_enrol_get_enrolled_users",
//   "courseid": 69,
//   "options": [...]
// }
```

### PASO 8: MoodleClient HTTP

```java
webClient.post()
    .

uri("https://moodle.example.com/webservice/rest/server.php")
    .

header("Authorization","Bearer abc123")
    .

bodyValue(request)  // GetEnrolledUsersRequest → JSON
    .

retrieve()
    .

bodyToMono(GetEnrolledUsersResponse .class);
```

### PASO 9: Respuesta de Moodle (bruta)

```json
{
    "users": [
        {
            "id": 4,
            "username": "student1",
            "firstname": "John",
            ...
        },
        {
            "id": 5,
            "username": "student2",
            "firstname": "Jane",
            ...
        }
    ],
    "warnings": []
}
```

### PASO 10: Mapper mapea Response

```java
// Entrada: Response Moodle (bruta)
GetEnrolledUsersResponse moodleResponse = ...

// toDto(): Response Moodle → DTO REST (limpio)
CourseUsersResponseDto dto = mapper.toDto(moodleResponse);
// Result: {
//   "users": [
//     {"id": 4, "username": "student1", "firstname": "John"},
//     {"id": 5, "username": "student2", "firstname": "Jane"}
//   ]
// }
```

### PASO 11: Response HTTP al Cliente

```json
HTTP/1.1 200 OK
Content-Type: application/json

{
"users": [
{"id": 4, "username": "student1", "firstname": "John", "lastname": "Doe", "email": "john@example.com"},
{"id": 5, "username": "student2", "firstname": "Jane", "lastname": "Smith", "email": "jane@example.com"}
],
"warnings": []
}
```

---

# 🧪 Sistema de Tests Basado en Ficheros JSON

## Importante: NO HAY TESTS UNITARIOS NI TESTS TRADICIONALES

Este proyecto usa **File-Driven Tests** - tests basados en ficheros JSON.

### Estructura de Test

```
test-case.json (JSON Schema)
    ↓
AdapterIntegrationTest.java (@TestFactory)
    ↓
runFileDrivenTests() crea DynamicTest por cada JSON
    ↓
Para cada test-case.json:
  1. Carga JSON
  2. Reemplaza {{TOKEN}}, {{HOST}}
  3. Inicia WireMock (simula Moodle)
  4. Envía HTTP request real
  5. Valida response == expected
```

### Ficheros de Test

```
src/test/resources/adapter/
├── course_contents/test-case.json      ← Test 1
├── course_grades/test-case.json        ← Test 2
├── course_users/test-case.json         ← Test 3
├── login/test-case.json                ← Test 4
├── logs_file/test-case.json            ← Test 5
└── site_info/test-case.json            ← Test 6

Total: 6 tests
```

### Estructura de test-case.json

```json
{
    "description": "Test case for get course users",
    "request": {
        "method": "GET",
        "path": "/courses/69/users",
        "headers": [
            {
                "name": "X-Moodle-Token",
                "value": "{{TOKEN}}"
            },
            {
                "name": "X-Moodle-Host",
                "value": "{{HOST}}"
            }
        ]
    },
    "expectedResponse": {
        "status": 200,
        "body": {
            "users": [
                {
                    "id": 4,
                    "username": "student1",
                    "firstname": "John",
                    "lastname": "Doe",
                    "email": "john@example.com"
                }
            ]
        }
    },
    "mockResponse": {
        "statusCode": 200,
        "body": {
            "users": [
                {
                    "id": 4,
                    "username": "student1",
                    "firstname": "John",
                    "lastname": "Doe",
                    "email": "john@example.com"
                }
            ]
        }
    }
}
```

### Test Principal: AdapterIntegrationTest.java

```java
/**
 * Test de integración principal
 * Lee TODOS los test-case.json en resources/adapter/*/
 *Crea un
DynamicTest para
cada uno
 *
     *
@author
Yi Peng
Ji
 *@version 1.0
    */

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class AdapterIntegrationTest {

    public static final String TOKEN = "abc123";

    @LocalServerPort
    private int port;

    @Autowired
    private WebTestClient webTestClient;

    private WireMockManager wireMockManager;
    private RequestExecutor requestExecutor;
    private ResponseAsserter responseAsserter;

    @BeforeAll
    void setUp() {
        wireMockManager = new WireMockManager(TOKEN);
        wireMockManager.start();

        variables.put("HOST", wireMockManager.getBaseUrl());
        variables.put("TOKEN", TOKEN);

        requestExecutor = new RequestExecutor(webTestClient, port);
        responseAsserter = new ResponseAsserter();
    }

    @TestFactory
    Stream<DynamicTest> runFileDrivenTests() throws IOException {
        return Arrays.stream(
                resolver.getResources("classpath:/adapter/**/test-case.json")
            )
            .map(resource -> DynamicTest.dynamicTest(
                extractFolderName(resource),
                () -> runTest(resource)
            ));
    }

    private void runTest(Resource resource) throws Exception {
        Cases testCase = loadTestCase(resource);
        wireMockManager.resetAndConfigure(testCase);
        var response = requestExecutor.sendRequest(testCase.getRequest());
        responseAsserter.assertResponse(response, testCase);
    }
}
```

### Ejecutar Tests

```bash
mvn test
```

---

# ➕ Cómo Agregar Nuevos Endpoints

## Paso 1: Investigar en Moodle

Accede: `https://your-moodle.com/admin/webservice/documentation.php`

Busca la función (ej: `core_user_get_users`)

## Paso 2: Crear JSON Schema Request

`src/main/resources/moodle/schema/core/user/getuser/request/GetUserRequest.json`

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "GetUserRequest",
    "type": "object",
    "properties": {
        "wsfunction": {
            "type": "string",
            "default": "core_user_get_users"
        },
        "userid": {
            "type": "integer"
        },
        "moodlewsrestformat": {
            "type": "string",
            "default": "json"
        }
    },
    "required": [
        "wsfunction",
        "userid"
    ]
}
```

## Paso 3: Crear JSON Schema Response

`src/main/resources/moodle/schema/core/user/getuser/response/GetUserResponse.json`

```json
{
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "GetUserResponse",
    "type": "object",
    "properties": {
        "id": {
            "type": "integer"
        },
        "username": {
            "type": "string"
        },
        "firstname": {
            "type": "string"
        },
        "lastname": {
            "type": "string"
        },
        "email": {
            "type": "string"
        }
    },
    "required": [
        "id",
        "username"
    ]
}
```

## Paso 4: Generar Código

```bash
mvn clean generate-sources
```

Se crean en `target/generated-sources/jsonschema2pojo/`

## Paso 5: Crear MapStruct Mapper

`src/main/java/es/ubu/lsi/moodleadapter/mapper/user/GetUserMapper.java`

```java

@Mapper(componentModel = "spring")
public interface GetUserMapper {

    @Mapping(target = "wsfunction", constant = "core_user_get_users")
    @Mapping(target = "moodlewsrestformat", constant = "json")
    GetUserRequest toRequest(Integer userId);

    UserResponseDto toDto(GetUserResponse response);
}
```

## Paso 6: Crear Endpoint Strategy

`src/main/java/es/ubu/lsi/moodleadapter/service/moodle/endpoint/user/GetUserEndpoint.java`

```java

@Component
@RequiredArgsConstructor
public class GetUserEndpoint
    implements MoodleEndpoint<GetUserRequest, GetUserResponse, UserResponseDto> {

    private static final ParameterizedTypeReference<GetUserResponse> RESPONSE_TYPE =
        new ParameterizedTypeReference<>() {
        };

    private final GetUserMapper mapper;

    @Override
    public GetUserRequest buildRequest(Object... params) {
        Integer userId = (Integer) params[0];
        return mapper.toRequest(userId);
    }

    @Override
    public ParameterizedTypeReference<GetUserResponse> getResponseType() {
        return RESPONSE_TYPE;
    }

    @Override
    public UserResponseDto mapResponse(GetUserResponse response, Object... params) {
        return mapper.toDto(response);
    }
}
```

## Paso 7: Actualizar OpenAPI Spec

`src/main/resources/static/openapi/openapi.yaml`

```yaml
paths:
    /users/{userId}:
        get:
            tags: [ Users ]
            summary: Get user by ID
            parameters:
                -   name: userId
                    in: path
                    required: true
                    schema:
                        type: integer
            responses:
                '200':
                    description: Success
                    content:
                        application/json:
                            schema:
                                $ref: '#/components/schemas/UserResponseDto'

components:
    schemas:
        UserResponseDto:
            type: object
            properties:
                id: { type: integer }
                username: { type: string }
                firstname: { type: string }
                lastname: { type: string }
                email: { type: string }
```

## Paso 8: Generar OpenAPI

```bash
mvn clean generate-sources
```

Se crean DTOs y Controllers en `target/generated-sources/openapi/`

## Paso 9: Implementar Service

`src/main/java/es/ubu/lsi/moodleadapter/service/user/UsersService.java`

```java

@Service
@RequiredArgsConstructor
public class UsersService implements UsersApiDelegate {

    private final MoodleService moodleService;
    private final GetUserEndpoint getUserEndpoint;

    @Override
    public Mono<ResponseEntity<UserResponseDto>> getUser(
        Integer userId,
        ServerWebExchange exchange) {
        return moodleService.callEndpoint(getUserEndpoint, userId)
            .map(ResponseEntity::ok);
    }
}
```

## Paso 10: Implementar Controller

`src/main/java/es/ubu/lsi/moodleadapter/controller/UsersController.java`

```java

@RestController
@RequiredArgsConstructor
public class UsersController implements UsersApi {

    private final UsersApiDelegate delegate;

    @Override
    public Mono<ResponseEntity<UserResponseDto>> getUser(
        Integer userId,
        ServerWebExchange exchange) {
        return delegate.getUser(userId, exchange);
    }
}
```

## Paso 11: Agregar Test

`src/test/resources/adapter/user/test-case.json`

```json
{
    "description": "Test get user",
    "request": {
        "method": "GET",
        "path": "/users/1",
        "headers": [
            {
                "name": "X-Moodle-Token",
                "value": "{{TOKEN}}"
            },
            {
                "name": "X-Moodle-Host",
                "value": "{{HOST}}"
            }
        ]
    },
    "expectedResponse": {
        "status": 200,
        "body": {
            "id": 1,
            "username": "admin",
            "firstname": "Admin",
            "lastname": "User",
            "email": "admin@example.com"
        }
    },
    "mockResponse": {
        "statusCode": 200,
        "body": {
            "id": 1,
            "username": "admin",
            "firstname": "Admin",
            "lastname": "User",
            "email": "admin@example.com"
        }
    }
}
```

## Paso 12: Ejecutar Tests

```bash
mvn test
```


