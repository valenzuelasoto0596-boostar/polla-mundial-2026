# Polla Mundial 2026 ⚽

Webapp para ver la tabla de posiciones (liguilla) de la polla del Mundial 2026 y
el detalle de puntos de cada participante partido por partido.

## Cómo funciona

- **Inicio (`/`)**: tabla de posiciones de los 21 participantes, ordenada por puntos.
- **Participante (`/p/[id]`)**: detalle con tus marcadores vs. los reales, puntos por
  partido, aciertos de avance por fase y cuadro de honor.
- **Resultados (`/admin`)**: el administrador ingresa los marcadores reales; la tabla
  se recalcula automáticamente.

## Reglas de puntuación

| Concepto | Puntos |
|---|---|
| Resultado exacto del partido | 3 |
| Acertar el ganador | 1 |
| Equipo que pasa a Dieciseisavos | 2 c/u |
| Equipo que pasa a Octavos | 2 c/u |
| Equipo que pasa a Cuartos | 3 c/u |
| Equipo que pasa a Semifinal | 3 c/u |
| Equipo que pasa a la Final | 4 c/u |
| Campeón / Subcampeón / 3.er puesto | 5 c/u |
| Bota de oro / plata / bronce | 2 c/u |
| Balón de oro / plata / bronce | 2 c/u |

## Datos

Las predicciones de cada participante se extrajeron de los Excel originales con
`extract.py` y viven en `data/participants.json` y `data/fixtures.json`.

## Desarrollo

```bash
npm install
npm run dev
```

## Variables de entorno

- `ADMIN_PASSWORD`: protege la página `/admin`.
- `BLOB_READ_WRITE_TOKEN`: almacenamiento de resultados (Vercel Blob).

Sin `BLOB_READ_WRITE_TOKEN` la app funciona pero no se pueden guardar resultados.
