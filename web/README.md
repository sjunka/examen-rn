# web

Micro-app web (HTML/JS estático) que corre dentro del WebView nativo: detalle de meta y formulario de abono. Sin tests (excluido por el examen).

`index.html` es el único archivo, editable directamente. No se sirve por red: `mobile/` lo empaqueta como string embebido vía `npm run build:webapp` (ver el catálogo de mensajes en el README raíz). Tras editar este archivo, hay que regenerar ese módulo para que el cambio llegue a la app.
