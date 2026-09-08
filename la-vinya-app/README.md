# La Vinya — guia de publicació (gratis)

Aquest projecte és una web React (Vite) connectada a Firebase (base de dades gratuïta)
i pensada per publicar-se a Vercel amb un subdomini gratuït tipus `la-vinya.vercel.app`.

## Pas 1 — Crear el projecte de Firebase (base de dades, gratis)
1. Vés a https://console.firebase.google.com i inicia sessió amb un compte de Google.
2. "Crear un proyecto" → posa-li un nom (p. ex. "la-vinya") → segueix l'assistent (pots desactivar Google Analytics, no cal).
3. Un cop dins, al menú esquerre: "Compilación" → "Firestore Database" → "Crear base de datos".
   - Selecciona "Modo de producción" o "Modo de prueba" (prova és més ràpid per començar).
   - Tria una regió (qualsevol d'Europa, p. ex. `eur3`).
4. Ves a "Configuración del proyecto" (icona d'engranatge) → baixa fins a "Tus apps" → clica la icona `</>` (Web) → posa-li un nom → "Registrar app".
5. Firebase et mostrarà un objecte `firebaseConfig` amb 6 valors (apiKey, authDomain, projectId, etc). **Copia'ls.**

## Pas 2 — Enganxar la configuració al codi
Obre el fitxer `src/firebase.js` d'aquest projecte i substitueix els valors
`POSA_AQUI_...` pels que t'ha donat Firebase al pas anterior.

## Pas 3 — Regles de Firestore (perquè els 13 membres puguin llegir i escriure)
A la consola de Firebase: Firestore Database → pestanya "Reglas", i enganxa:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /la-vinya/{doc} {
      allow read, write: if true;
    }
  }
}
```

(Això deixa la col·lecció "la-vinya" oberta a qui tingui l'enllaç de la web —
igual de privat que compartir la contrasenya/PIN dins la colla. No cal compte
de Google per part dels membres.)

## Pas 4 — Pujar el codi a GitHub
1. Crea un compte a https://github.com si no en tens.
2. Crea un repositori nou (p. ex. "la-vinya"), buit.
3. Des d'aquesta carpeta del projecte, al terminal:
   ```
   git init
   git add .
   git commit -m "Primera versió de La Vinya"
   git branch -M main
   git remote add origin https://github.com/EL_TEU_USUARI/la-vinya.git
   git push -u origin main
   ```

## Pas 5 — Publicar a Vercel (domini gratuït)
1. Vés a https://vercel.com i registra't (pots fer-ho directament amb el compte de GitHub).
2. "Add New..." → "Project" → selecciona el repositori "la-vinya" que acabes de pujar.
3. Vercel detecta automàticament que és un projecte Vite — no cal tocar res, clica "Deploy".
4. En un minut tindràs la web publicada a una adreça tipus:
   `la-vinya.vercel.app` (o similar, Vercel te la mostrarà en acabar).

## I ja està
A partir d'aquí, cada cop que facis `git push` amb canvis, Vercel actualitza
la web automàticament sola.

Per provar-ho abans de publicar-ho, també pots fer-ho en local:
```
npm install
npm run dev
```
