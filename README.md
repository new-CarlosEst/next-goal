# Next Goal - Componentes para OBS

Componentes para mostrar partidos de fútbol en vivo en OBS Studio con datos de la API de ESPN.

## Componentes

- **Selector.html**: Panel de control para seleccionar partidos (solo visible para el streamer)
- **scoreboard.html**: Componente para mostrar el resultado del partido seleccionado

## Instalación en OBS Studio

### 1. Añadir el Selector (Panel de Control)

1. Abre OBS Studio
2. En el panel "Fuentes", haz clic en el botón **"+"**
3. Selecciona **"Navegador"**
4. Ponle un nombre: `Selector de Partidos`
5. Haz clic en "Aceptar"

6. **Configura la fuente:**
   - **URL**: `file:///` + la ruta completa del archivo
   - Ejemplo: `file:///c:/lenguajesProgramacion/compmonentsObs/next-goal/Selector.html`
   - **Ancho**: `600`
   - **Alto**: `800`
   - Haz clic en "Aceptar"

7. **IMPORTANTE - Habilitar interacción:**
   - Haz clic derecho sobre la fuente "Selector de Partidos"
   - Selecciona **"Interactuar"**
   - Esto te permitirá hacer clic en los selectores y botones
   - Cuando termines de usarlo, vuelve a hacer clic derecho y desmarca "Interactuar"

### 2. Añadir el Scoreboard (Visualizador de Resultados)

1. En el panel "Fuentes", haz clic en el botón **"+"**
2. Selecciona **"Navegador"**
3. Ponle un nombre: `Scoreboard`
4. Haz clic en "Aceptar"

5. **Configura la fuente:**
   - **URL**: `file:///` + la ruta completa del archivo
   - Ejemplo: `file:///c:/lenguajesProgramacion/compmonentsObs/next-goal/scoreboard.html`
   - **Ancho**: `200`
   - **Alto**: `800`
   - Haz clic en "Aceptar"

### 3. Configuración para Streamer

**Opción A - Fuente oculta:**
- Coloca el "Selector de Partidos" fuera del área de transmisión
- Solo tú lo verás en el editor de OBS
- La audiencia no lo verá

**Opción B - Escena separada:**
- Crea una escena nueva llamada "Control Panel"
- Añade solo el "Selector de Partidos" a esta escena
- Cambia a esta escena cuando necesites seleccionar partidos
- Vuelve a tu escena principal para transmitir

## Uso

1. **Seleccionar competición:**
   - En el Selector, elige la competición (Mundial, La Liga, Premier League, etc.)
   - Los partidos se cargarán automáticamente

2. **Seleccionar fecha:**
   - Elige entre "Hoy", "Mañana" o fechas específicas
   - Los partidos se actualizarán automáticamente

3. **Seleccionar partido:**
   - Haz clic en el botón "Añadir" junto al partido que quieres mostrar
   - El partido se guardará y aparecerá en el componente scoreboard.html
   - Puedes añadir múltiples partidos a la lista

4. **Actualización automática:**
   - Los partidos se actualizan cada 15 segundos
   - Los marcadores, tiempo y estados se actualizan automáticamente
   - No necesitas recargar la página

## Estados del Partido

El sistema muestra automáticamente:
- **1ª XX'**: Primera parte con el minuto actual
- **2ª XX'**: Segunda parte con el minuto actual
- **DESCANSO**: Medio tiempo
- **PRÓRROGA 1ª**: Primera parte de prórroga
- **PRÓRROGA 2ª**: Segunda parte de prórroga
- **PENALTIS**: Tanda de penaltis
- **FINAL**: Partido finalizado
- **HH:MM**: Hora del partido (si no ha empezado)

## Competiciones Disponibles

- Mundial 2026 (fifa.world)
- Premier League (eng.1)
- La Liga (esp.1)
- Segunda División (esp.2)
- Bundesliga (ger.1)
- Serie A (ita.1)
- Ligue 1 (fra.1)
- Liga Portuguesa (por.1)
- Championship (eng.2)
- Eurocopa (uefa.euro)
- Copa América (conmebol.america)

## Notas

- Asegúrate de usar barras inclinadas hacia adelante (`/`) en la ruta del archivo, incluso en Windows
- El Selector usa `localStorage` para guardar los partidos seleccionados
- Los datos se obtienen de la API de ESPN en tiempo real
- Requiere conexión a internet para funcionar

## Soporte

Si tienes problemas:
- Verifica que la ruta del archivo sea correcta
- Asegúrate de haber habilitado la opción "Interactuar" en el Selector
- Comprueba que tienes conexión a internet
- Revisa la consola del navegador (F12) para ver errores
# next-goal
