# Lector de markdown

Pega markdown (o abre/arrastra un archivo `.md`) y léelo con formato: índice lateral con sección activa, conteo de palabras y tiempo de lectura, código resaltado y copiable, tablas, tareas y enlaces ancla.
Aislado de `faro-app`. Es una app 100 % estática: el borrador se guarda solo en el `localStorage` del navegador.

## Desarrollo

```
pnpm install
pnpm dev
pnpm build   # genera dist/
```

## Despliegue en Vercel

Importa la carpeta como proyecto: Vercel detecta Vite solo (build `pnpm build`, salida `dist`).
