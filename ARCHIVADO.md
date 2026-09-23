# encuestaClientes está en pausa (2026-09-23)

Se borraron el KV `ENCUESTA_KV` (id `b3e32656361c47718d08b28182633254`) y el
worker `encuesta-worker` (con su secret `ADMIN_KEY`) para ordenar la cuenta de
Cloudflare. El front apunta a `encuesta-worker.manuellatourf.workers.dev`: al
volver a desplegar con el mismo nombre, la URL es la misma. Idea para más adelante: reseñas de clientes
en la web de meowrhino.studio (becasDigMeow).

El contenido (5 clientes, 3 cupones, 3 encuestas, una de ellas real) está en
`~/cloudflare-backups/2026-09-23/ENCUESTA_KV/`, **fuera del repo a propósito**:
este repo es público y son datos de clientes.

## Cómo revivirlo

```bash
cd worker
npx wrangler kv namespace create ENCUESTA_KV   # el id nuevo va en wrangler.toml
npx wrangler secret put ADMIN_KEY
npx wrangler deploy
```

Para recuperar los datos viejos, sube cada archivo del backup con
`npx wrangler kv key put "<prefijo>:<resto>" --path=<archivo> --binding=ENCUESTA_KV --remote`
(el nombre del archivo es la clave con `:` cambiado por `_`).

Ojo: el comentario largo de la encuesta real llegó cortado en 1000 caracteres
(`worker/worker.js:112`). Súbelo antes de volver a usarlo.
