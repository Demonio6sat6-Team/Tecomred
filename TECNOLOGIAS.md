# Tecnologías utilizadas en TecomRed

Este documento resume las tecnologías que aparecen en los manifiestos, el código y la configuración del proyecto.

## Frontend

- **React 19** y **React DOM 19**: construcción y renderizado de la interfaz.
- **TypeScript 6**: desarrollo con tipado estático.
- **Vite 8**: servidor de desarrollo y herramienta de compilación.
- **HTML5 y CSS**: estructura y estilos de la aplicación.
- **Tailwind CSS 4**: estilos utilitarios, integrado con Vite.
- **React Router 7**: navegación entre páginas.
- **Lucide React**: iconos.
- **SweetAlert2**: diálogos y alertas.
- **Zod 4**: validación de datos.

## Backend y API

- **Node.js**: entorno de ejecución del servidor y los scripts.
- **TypeScript 5**: desarrollo y compilación del backend.
- **Express 5**: servidor y API HTTP de estilo REST.
- **MySQL**: base de datos relacional.
- **mysql2**: conexión y consultas a MySQL.
- **JWT (`jsonwebtoken`)**: emisión y validación de tokens de autenticación.
- **bcryptjs**: hash y verificación de contraseñas.
- **Multer**: recepción de archivos subidos.
- **Zod**: validación de datos de entrada.
- **CORS**: configuración de acceso entre frontend y API.
- **Helmet**: encabezados HTTP de seguridad.
- **express-rate-limit**: limitación de solicitudes.
- **Morgan**: registro de solicitudes HTTP.
- **dotenv**: carga de variables de entorno.
- **UUID**: generación de identificadores únicos.

## Herramientas de desarrollo y calidad

- **ESLint 9** con complementos para React Hooks, React Refresh y TypeScript: análisis estático y linting.
- **TypeScript Compiler (`tsc`)**: comprobación de tipos y compilación.
- **tsx**: ejecución y recarga del backend durante el desarrollo.
- **Concurrently**: ejecución simultánea del frontend y backend desde la raíz.
- **Sharp**: procesamiento de imágenes en las herramientas del frontend.
- **npm**: administración de dependencias y ejecución de scripts.

## Despliegue e integración

- **Vercel**: configuración de publicación del frontend, rutas de la SPA y redirección de `/api` y `/uploads`.
- **Railway**: destino configurado para la API de producción (`tecomred-production.up.railway.app`).
- **Vite Proxy**: reenvío local de `/api` y `/uploads` al backend durante el desarrollo.

## Resumen de arquitectura

La aplicación es una SPA de React y TypeScript compilada con Vite. El frontend consume una API REST desarrollada con Express y TypeScript; el backend persiste datos en MySQL. La configuración actual separa el despliegue del frontend (Vercel) del backend (Railway).
