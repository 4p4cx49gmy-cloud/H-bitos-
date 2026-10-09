---
name: buscar-skills
description: Busca y recomienda skills según lo que el usuario necesite hacer. Úsala cuando el usuario pida buscar, encontrar, descargar o recomendar skills, pregunte "¿hay una skill para...?", o cuando una tarea sea repetitiva (reportes, revisiones, documentos, flujos de trabajo) y ninguna skill activa la cubra.
---

# Buscar skills

Objetivo: encontrar la skill que mejor encaje con lo que el usuario quiere hacer y dejarla lista para usar.

## Pasos

1. **Entender la necesidad.** Resume en una frase qué quiere lograr el usuario. Si es ambiguo, haz una sola pregunta corta.

2. **Sacar palabras clave.** Elige de 3 a 8 palabras clave en español e inglés (por ejemplo: "presentación", "slides", "pptx"; "hábitos", "habit tracker").

3. **Revisar lo que ya tiene.** Usa `ListSkills` con esas palabras clave. Si una skill activa ya lo cubre, dila y úsala con `Skill`.

4. **Buscar skills nuevas.** Si no hay ninguna activa que sirva:
   - Usa `SearchSkills` con las palabras clave.
   - Si hay resultados relevantes, usa `SuggestSkills` (trigger `user_asked`) para mostrar la tarjeta y que el usuario las agregue.
   - Si las herramientas no están cargadas, cárgalas primero con `ToolSearch` (`select:ListSkills,SearchSkills,SuggestSkills`).

5. **Buscar plugins.** Si tampoco hay skills, prueba `SearchPlugins` con las mismas palabras clave y, si algo encaja, `SuggestPluginInstall`.

6. **Si no existe nada.** Díselo al usuario en una línea y ofrécele crear una skill a medida con `anthropic-skills:skill-creator`.

## Formato de la respuesta

- Lista corta: nombre de la skill, para qué sirve (una línea) y si ya está activa.
- Recomienda una sola como la mejor opción.
- No inventes skills: menciona solo las que devolvieron las herramientas.
