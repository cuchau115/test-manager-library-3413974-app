# AGENTS.md — repo `app` (frontend React 18 + Vite)

> **Lee primero el plan maestro completo:** `../AGENTS.md` (raíz del proyecto). Copia canónica
> versionada: `../test-manager-library-3413974-docs/AGENTS.md`. Este archivo es solo un puntero.

## Reglas duras (resumen; detalle en el maestro §1)
- Todo con **Docker** (`docker compose build app`).
- Consume `/api/v1`; **no** duplica reglas de negocio. Contrato en
  `../test-manager-library-3413974-docs/spec-python/api-contract.md`.
- Cliente HTTP único con `Authorization: Bearer` y manejo del error único `{code,message,details}`.
  En 401 → volver a login.
- **Commits pequeños** (`app(pantallas): …`) y **push** al fork `cuchau115/test-manager-library-3413974-app`.
- Toda tarea exige **evidencia** (build sin errores / recorrido manual).

## Tareas de este repo (maestro §9.8)
`APP-01`…`APP-11`. Modelo: `opencode/gemini-3.6-flash`.
Puede avanzar contra el contrato congelado antes de que `api` termine.
