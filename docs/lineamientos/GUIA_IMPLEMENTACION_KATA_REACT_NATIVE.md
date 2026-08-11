# KATA --- Senior React Native Mobile Engineer

## Guía de implementación

> **Objetivo:** construir una feature móvil de "Bolsillo de Ahorro
> Programado" integrando React Native + WebView + `postMessage` +
> Redux + una librería React Native con código nativo real + pruebas
> unitarias.

Esta guía está basada en el requerimiento de la KATA entregada.

------------------------------------------------------------------------

## 1. Qué hay que construir

La solución debe vivir preferiblemente en un monorepo con tres
componentes:

``` text
examen-rn/
├── web/
├── libreria/
└── mobile/
```

### `web/`

Micro-app web que se renderiza dentro de un `WebView`.

Responsabilidades:

-   Recibir mensajes desde React Native.
-   Mostrar el detalle de una meta.
-   Permitir ingresar un abono.
-   Enviar eventos a React Native mediante `postMessage`.
-   No necesita pruebas unitarias.

### `libreria/`

Librería React Native independiente y reutilizable.

Debe:

-   Tener su propio `package.json`.
-   Tener API pública tipada.
-   Contener código nativo real.
-   Exponerlo hacia JavaScript.
-   Tener pruebas unitarias.
-   Tener README propio.
-   Ser consumida por `mobile/` como dependencia.

### `mobile/`

Aplicación React Native final.

Debe:

-   Ser creada con la CLI oficial de React Native.
-   Usar TypeScript.
-   Usar Redux como fuente de verdad del estado global.
-   Mostrar el listado de metas de ahorro.
-   Abrir el detalle dentro de un `WebView`.
-   Enviar información inicial al WebView.
-   Recibir eventos desde el WebView.
-   Actualizar Redux sin recargar la pantalla.
-   Consumir la librería nativa.
-   Tener pruebas unitarias.

------------------------------------------------------------------------

# 2. Arquitectura propuesta

La arquitectura recomendada es DDD ligero + separación por capas.

``` text
mobile/
└── src/
    ├── domain/
    │   ├── entities/
    │   │   └── SavingsGoal.ts
    │   ├── valueObjects/
    │   │   ├── Money.ts
    │   │   └── Progress.ts
    │   └── rules/
    │       └── savingsRules.ts
    │
    ├── application/
    │   └── useCases/
    │       ├── GetGoals.ts
    │       └── MakeDeposit.ts
    │
    ├── infrastructure/
    │   ├── repositories/
    │   │   └── InMemorySavingsGoalRepository.ts
    │   ├── webview/
    │   │   ├── postMessageAdapter.ts
    │   │   └── messageContract.ts
    │   └── native/
    │       └── savingsNotifier.ts
    │
    ├── presentation/
    │   ├── screens/
    │   │   ├── GoalsScreen.tsx
    │   │   └── GoalDetailScreen.tsx
    │   ├── components/
    │   └── hooks/
    │
    └── store/
        ├── store.ts
        ├── goalsSlice.ts
        └── selectors.ts
```

La idea es que el dominio no conozca React Native.

``` text
Presentation
     ↓
Application
     ↓
Domain
     ↑
Infrastructure
```

------------------------------------------------------------------------

# 3. Flujo funcional

## 3.1 Listado de metas

El usuario abre la aplicación.

``` text
React Native
     │
     ▼
Redux Store
     │
     ▼
GoalsScreen
     │
     ▼
Lista de metas
```

Cada meta muestra:

-   Nombre.
-   Monto objetivo.
-   Monto acumulado.
-   Porcentaje de progreso.

Ejemplo:

``` text
Viaje a Japón
Objetivo:     $5.000.000
Acumulado:    $2.500.000
Progreso:     50%
```

------------------------------------------------------------------------

# 4. Flujo React Native → WebView

Cuando el usuario selecciona una meta:

``` text
GoalsScreen
     │
     ▼
GoalDetailScreen
     │
     ▼
WebView
     │
     │ postMessage
     ▼
Micro-app web
```

React Native debe enviar un mensaje inicial similar a:

``` json
{
  "type": "SESSION_INITIALIZED",
  "payload": {
    "sessionId": "session-001",
    "goalId": "goal-001",
    "userInfo": {
      "name": "Usuario"
    }
  }
}
```

Es importante que este mensaje tenga un contrato TypeScript explícito.

------------------------------------------------------------------------

# 5. Contrato `postMessage`

Nunca se deberían manejar mensajes como objetos `any`.

Crear tipos discriminados:

``` ts
export type NativeToWebMessage =
  | {
      type: 'SESSION_INITIALIZED';
      payload: {
        sessionId: string;
        goalId: string;
        userInfo: {
          name: string;
        };
      };
    };

export type WebToNativeMessage =
  | {
      type: 'DEPOSIT_CONFIRMED';
      payload: {
        goalId: string;
        amount: number;
      };
    };
```

Esto permite:

-   Tipado.
-   Autocompletado.
-   Validación.
-   Evitar strings inconsistentes.
-   Facilitar pruebas.

------------------------------------------------------------------------

# 6. Adaptador para `postMessage`

Aquí podemos aplicar el patrón **Adapter**.

El objetivo es separar:

``` text
postMessage crudo
       ↓
Adapter
       ↓
Evento de dominio
```

Ejemplo conceptual:

``` ts
export function parseWebMessage(
  rawMessage: string,
): WebToNativeMessage | null {
  try {
    const message: unknown = JSON.parse(rawMessage);

    if (!isValidWebMessage(message)) {
      return null;
    }

    return message;
  } catch {
    return null;
  }
}
```

La función no debería modificar Redux directamente.

Su responsabilidad es convertir una entrada externa en un mensaje
válido.

------------------------------------------------------------------------

# 7. Validaciones de seguridad

Los mensajes provenientes del WebView deben considerarse **datos
externos no confiables**.

Validar como mínimo:

-   Que el mensaje sea JSON válido.
-   Que exista `type`.
-   Que `type` sea uno de los eventos permitidos.
-   Que exista `payload`.
-   Que `goalId` sea un string válido.
-   Que `amount` sea un número.
-   Que `amount` sea mayor que cero.
-   Que la meta exista.
-   Que el abono no produzca un estado inválido.

Ejemplo:

``` ts
function isValidDepositPayload(
  payload: unknown,
): payload is { goalId: string; amount: number } {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const value = payload as Record<string, unknown>;

  return (
    typeof value.goalId === 'string' &&
    value.goalId.length > 0 &&
    typeof value.amount === 'number' &&
    Number.isFinite(value.amount) &&
    value.amount > 0
  );
}
```

No confiar en que el WebView siempre enviará información correcta.

------------------------------------------------------------------------

# 8. Redux como fuente de verdad

El requerimiento establece que el listado de metas y el resultado del
abono viven en Redux.

Ejemplo de estado:

``` ts
interface GoalsState {
  goals: SavingsGoal[];
  status: 'idle' | 'loading' | 'success' | 'error';
  error?: string;
}
```

Ejemplo de slice:

``` ts
const goalsSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    depositConfirmed: (
      state,
      action: PayloadAction<{
        goalId: string;
        amount: number;
      }>,
    ) => {
      const goal = state.goals.find(
        item => item.id === action.payload.goalId,
      );

      if (!goal) {
        return;
      }

      goal.accumulatedAmount += action.payload.amount;
    },
  },
});
```

La pantalla obtiene información mediante selectors:

``` ts
export const selectGoals = (state: RootState) =>
  state.goals.goals;
```

Esto evita duplicar el estado en componentes.

------------------------------------------------------------------------

# 9. Flujo completo del abono

Este es uno de los flujos más importantes de la prueba.

``` text
Usuario
  │
  ▼
WebView
  │
  │ POST_MESSAGE
  ▼
React Native
  │
  ▼
Parser / Adapter
  │
  ▼
Validación
  │
  ▼
Dispatch Redux
  │
  ▼
MakeDeposit
  │
  ▼
Redux Store actualizado
  │
  ▼
GoalsScreen
  │
  ▼
Nuevo acumulado
```

No se debe recargar la aplicación.

------------------------------------------------------------------------

# 10. Dominio

Crear una entidad `SavingsGoal`.

``` ts
export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  accumulatedAmount: number;
}
```

El porcentaje de progreso debe ser una regla del dominio:

``` ts
export function calculateProgress(
  accumulated: number,
  target: number,
): number {
  if (target <= 0) {
    return 0;
  }

  return Math.min(
    100,
    Math.round((accumulated / target) * 100),
  );
}
```

Estas funciones deben poder probarse sin montar React Native.

Esto demuestra una de las ideas centrales de DDD:

> Las reglas de negocio deben estar aisladas de la infraestructura.

------------------------------------------------------------------------

# 11. Caso de uso `MakeDeposit`

El caso de uso representa la acción del negocio:

``` text
MakeDeposit
    │
    ├── valida meta
    ├── valida monto
    ├── calcula nuevo acumulado
    └── devuelve resultado
```

Ejemplo:

``` ts
export class MakeDeposit {
  constructor(
    private readonly repository: SavingsGoalRepository,
  ) {}

  execute(goalId: string, amount: number) {
    if (amount <= 0) {
      throw new Error('Deposit amount must be greater than zero');
    }

    const goal = this.repository.findById(goalId);

    if (!goal) {
      throw new Error('Savings goal not found');
    }

    const updatedGoal = {
      ...goal,
      accumulatedAmount:
        goal.accumulatedAmount + amount,
    };

    this.repository.save(updatedGoal);

    return updatedGoal;
  }
}
```

------------------------------------------------------------------------

# 12. Repository Pattern

Aplicar **Repository** permite que el dominio no dependa de dónde vienen
los datos.

Contrato:

``` ts
export interface SavingsGoalRepository {
  findAll(): SavingsGoal[];
  findById(id: string): SavingsGoal | undefined;
  save(goal: SavingsGoal): void;
}
```

Implementación inicial:

``` ts
export class InMemorySavingsGoalRepository
  implements SavingsGoalRepository {

  private goals: SavingsGoal[] = [];

  findAll() {
    return this.goals;
  }

  findById(id: string) {
    return this.goals.find(goal => goal.id === id);
  }

  save(goal: SavingsGoal) {
    const index = this.goals.findIndex(
      item => item.id === goal.id,
    );

    if (index >= 0) {
      this.goals[index] = goal;
    }
  }
}
```

Esto deja abierta la posibilidad de reemplazar posteriormente la
implementación por una API real.

------------------------------------------------------------------------

# 13. WebView

La pantalla de detalle debe contener un `WebView`.

Conceptualmente:

``` tsx
<WebView
  source={{ uri: WEB_APP_URL }}
  onMessage={handleWebMessage}
/>
```

Para enviar información:

``` ts
webViewRef.current?.postMessage(
  JSON.stringify(message),
);
```

Para recibir:

``` ts
const handleWebMessage = (
  event: WebViewMessageEvent,
) => {
  const message = parseWebMessage(
    event.nativeEvent.data,
  );

  if (!message) {
    return;
  }

  handleMessage(message);
};
```

La comunicación debe ser exclusivamente mediante `postMessage`.

------------------------------------------------------------------------

# 14. Micro-app web

La web puede ser un HTML/JavaScript sencillo.

Ejemplo:

``` html
<input id="amount" type="number" />
<button id="deposit">
  Abonar
</button>
```

JavaScript:

``` js
document
  .getElementById('deposit')
  .addEventListener('click', () => {
    const amount = Number(
      document.getElementById('amount').value,
    );

    window.ReactNativeWebView.postMessage(
      JSON.stringify({
        type: 'DEPOSIT_CONFIRMED',
        payload: {
          goalId: currentGoalId,
          amount,
        },
      }),
    );
  });
```

La web no debe contener la lógica global de Redux.

------------------------------------------------------------------------

# 15. Librería nativa

La librería es un requisito central.

Debe ser un paquete independiente:

``` text
libreria/
├── android/
├── ios/
├── src/
├── __tests__/
├── package.json
└── README.md
```

Debe construirse usando `react-native-builder-bob`.

Debe existir código nativo real en al menos una plataforma.

------------------------------------------------------------------------

# 16. API propuesta de la librería

Una opción sencilla es crear:

``` ts
notifyGoalCompleted(goalName: string): void;
```

La aplicación podría usar:

``` ts
import {
  notifyGoalCompleted,
} from '@company/savings-notifier';

notifyGoalCompleted('Viaje a Japón');
```

La implementación JavaScript delega al código nativo.

``` text
React Native JS
      │
      ▼
Library API
      │
      ▼
TurboModule / NativeModule
      │
      ▼
Android Kotlin / iOS Swift
      │
      ▼
Notificación / Toast / feedback nativo
```

El requerimiento permite un componente o módulo nativo con
UI/funcionalidad. También se pueden implementar opciones como input +
botón, diálogo nativo o notificación local.

------------------------------------------------------------------------

# 17. TurboModule vs NativeModule

La opción preferida por la KATA es **TurboModule**.

En la sustentación hay que explicar la decisión.

Una respuesta razonable:

> Elegí TurboModule porque es la alternativa alineada con la
> arquitectura moderna de React Native y con la versión solicitada. El
> objetivo es tener una frontera explícita y tipada entre JavaScript y
> código nativo. Un NativeModule clásico también sería válido si se
> justifica, pero para este proyecto prioricé la arquitectura
> recomendada para RN moderno.

No basta con decir "porque es más nuevo".

Hay que explicar el trade-off:

``` text
TurboModule
+ Arquitectura moderna
+ Mejor integración con New Architecture
+ Contrato más explícito
- Mayor complejidad inicial

NativeModule
+ Más sencillo de implementar
+ Amplio conocimiento/ecosistema
- Arquitectura legacy
```

------------------------------------------------------------------------

# 18. Cuándo llamar al módulo nativo

La historia de usuario indica que cuando una meta llega al 100% se debe
producir una confirmación local.

Flujo:

``` text
Deposit confirmed
       │
       ▼
Calculate progress
       │
       ├── < 100% → no notification
       │
       └── >= 100%
               │
               ▼
       Native module
               │
               ▼
       Local notification / Toast
```

Debe evitarse disparar la notificación si el porcentaje todavía no llegó
al 100%.

------------------------------------------------------------------------

# 19. SOLID

## Single Responsibility

Cada clase o módulo tiene una responsabilidad.

Mal:

``` text
GoalScreen
 ├── valida dinero
 ├── procesa mensajes
 ├── modifica Redux
 ├── llama al módulo nativo
 └── calcula progreso
```

Mejor:

``` text
GoalScreen
   ↓
MessageAdapter
   ↓
UseCase
   ↓
Domain
   ↓
NativeNotifier
```

## Open/Closed

El Repository permite agregar:

``` text
InMemoryRepository
ApiRepository
SQLiteRepository
```

sin modificar el dominio.

## Liskov

Las implementaciones del repository deben respetar el contrato.

## Interface Segregation

Evitar interfaces gigantes.

## Dependency Inversion

El dominio depende de abstracciones:

``` ts
SavingsGoalRepository
```

y no directamente de:

``` text
fetch
Redux
WebView
NativeModules
```

------------------------------------------------------------------------

# 20. DRY

Evitar duplicar:

-   Contratos de mensajes.
-   Validaciones.
-   Cálculo de progreso.
-   Formateo de dinero.
-   Identificación de eventos.
-   Manejo de errores.

Por ejemplo, no escribir el mismo cálculo en tres pantallas:

``` ts
(accumulated / target) * 100
```

Debe existir una única regla de dominio:

``` ts
calculateProgress(...)
```

------------------------------------------------------------------------

# 21. Pruebas unitarias

Las pruebas son obligatorias en `libreria/` y `mobile/`.

## Domain

Probar:

``` text
calculateProgress
```

Casos:

``` text
0 / 100       → 0%
50 / 100      → 50%
100 / 100     → 100%
150 / 100     → 100%
target = 0    → 0%
```

## MakeDeposit

Probar:

``` text
abono válido
meta inexistente
monto 0
monto negativo
actualización del acumulado
```

## postMessage parser

Probar:

``` text
JSON válido
JSON inválido
type desconocido
payload inválido
amount inválido
goalId inválido
```

## Redux

Probar:

``` text
depositConfirmed
selector de metas
actualización del acumulado
```

## Librería

Probar:

``` text
API pública
validación de argumentos
invocación del módulo nativo
```

## Componente/hook

Probar al menos un componente o hook importante.

------------------------------------------------------------------------

# 22. Ejemplo de test

``` ts
describe('calculateProgress', () => {
  it('returns 50 when half of the goal is completed', () => {
    expect(
      calculateProgress(50, 100),
    ).toBe(50);
  });

  it('caps progress at 100', () => {
    expect(
      calculateProgress(150, 100),
    ).toBe(100);
  });

  it('returns 0 when target is invalid', () => {
    expect(
      calculateProgress(50, 0),
    ).toBe(0);
  });
});
```

------------------------------------------------------------------------

# 23. Cobertura

La KATA solicita una cobertura razonable del core.

Una meta práctica puede ser:

``` text
Domain:       > 90%
Application:  > 80%
Infrastructure:
              cubrir los parsers/adapters críticos
Presentation:
              cubrir componentes/hooks relevantes
```

La cifra exacta debe documentarse en el README y debe corresponder a la
cobertura real obtenida.

No conviene escribir tests únicamente para subir el porcentaje.

------------------------------------------------------------------------

# 24. Estructura completa del monorepo

Una estructura final posible:

``` text
examen-rn/
│
├── README.md
├── package.json
├── .gitignore
│
├── docs/
│   └── ia/
│       └── USO_IA.md
│
├── web/
│   ├── index.html
│   ├── app.js
│   └── README.md
│
├── libreria/
│   ├── src/
│   │   ├── index.ts
│   │   └── SavingsNotifier.ts
│   ├── android/
│   ├── ios/
│   ├── __tests__/
│   ├── package.json
│   ├── README.md
│   └── .claude/
│       └── skills/
│
└── mobile/
    ├── android/
    ├── ios/
    ├── src/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   ├── presentation/
    │   └── store/
    ├── __tests__/
    ├── package.json
    ├── README.md
    └── .claude/
        └── skills/
```

------------------------------------------------------------------------

# 25. Uso de IA

El requerimiento exige documentar el uso de IA en `libreria/` y
`mobile/`.

Debe existir al menos:

-   Un skill propio.
-   Un agent/subagent con propósito claro.
-   `docs/ia/USO_IA.md`.

Ejemplo de skill:

``` text
.claude/
└── skills/
    └── redux-feature/
        └── SKILL.md
```

Propósito:

> Generar una feature Redux siguiendo la convención del proyecto.

Ejemplo de agent:

``` text
.claude/
└── agents/
    └── test-reviewer.md
```

Propósito:

> Revisar tests, detectar casos faltantes y verificar convenciones.

------------------------------------------------------------------------

# 26. `USO_IA.md`

Debe explicar:

``` md
# Uso de IA

## Qué generó la IA

- Estructura inicial del slice Redux.
- Casos iniciales de pruebas.
- Borrador del adapter de postMessage.

## Qué escribí/modifiqué manualmente

- Contratos finales.
- Validaciones.
- Arquitectura.
- Integración con WebView.
- Implementación nativa.
- Casos de error.

## Prompts utilizados

Documentar los prompts relevantes.

## Qué rechacé o corregí

- Código que utilizaba `any`.
- Validaciones insuficientes.
- Acoplamiento de Redux con el parser.
- Tests que solo comprobaban implementación interna.

## Criterio aplicado

La IA fue utilizada como asistente, pero cada fragmento generado fue revisado,
probado y adaptado a la arquitectura del proyecto.
```

En la sustentación debes poder explicar cualquier código generado por
IA.

------------------------------------------------------------------------

# 27. Seguridad

Checklist:

-   [ ] No subir tokens.
-   [ ] No subir credenciales.
-   [ ] No subir información personal real.
-   [ ] Validar mensajes del WebView.
-   [ ] No usar `any` sin justificación.
-   [ ] Validar montos.
-   [ ] Validar IDs.
-   [ ] Manejar JSON inválido.
-   [ ] Manejar eventos desconocidos.
-   [ ] No confiar en datos provenientes del WebView.
-   [ ] No introducir HTML inseguro innecesariamente.
-   [ ] Mantener secretos fuera del repositorio.

El repositorio es público, por lo que nunca se deben incluir secretos.

------------------------------------------------------------------------

# 28. README raíz

El README debe contener:

``` md
# Savings Goal Wallet

## Arquitectura

Descripción de DDD + capas.

## Estructura

web/
libreria/
mobile/

## Requisitos

Node
React Native
Android Studio
Xcode

## Instalación

Pasos para instalar dependencias.

## Ejecutar

### Mobile

comando para Android
comando para iOS

### Tests

comando para ejecutar tests.

### Coverage

comando para coverage.

## Comunicación postMessage

Tabla de eventos.

## Librería

Cómo instalar y consumir la librería.

## Decisiones arquitectónicas

- DDD
- Adapter
- Repository
- Redux
- WebView
- Native module

## Uso de IA

Link o referencia a:

docs/ia/USO_IA.md
```

------------------------------------------------------------------------

# 29. Catálogo de mensajes

Recomiendo documentarlo en el README como una tabla.

  -----------------------------------------------------------------------
  Dirección               Evento                  Payload
  ----------------------- ----------------------- -----------------------
  Native → Web            `SESSION_INITIALIZED`   `sessionId`, `goalId`,
                                                  `userInfo`

  Web → Native            `DEPOSIT_CONFIRMED`     `goalId`, `amount`
  -----------------------------------------------------------------------

La ventaja de esto es que durante la sustentación puedes mostrar
inmediatamente el contrato de integración.

------------------------------------------------------------------------

# 30. Orden recomendado de implementación

No intentar construir todo simultáneamente.

## Paso 1 --- Crear repositorio

``` text
examen-rn/
```

Crear commits pequeños y descriptivos.

Ejemplo:

``` text
chore: initialize monorepo
feat: add savings goal domain
feat: add redux goals slice
feat: add webview message contract
feat: add deposit flow
feat: add native savings notifier
test: cover deposit use case
docs: add architecture documentation
```

------------------------------------------------------------------------

## Paso 2 --- Crear `mobile`

Usar la CLI oficial de React Native.

No utilizar Expo porque el requerimiento explícitamente lo prohíbe.

Verificar la versión de React Native elegida y documentarla.

------------------------------------------------------------------------

## Paso 3 --- Implementar dominio

Primero:

``` text
SavingsGoal
Money
Progress
calculateProgress
```

Luego probarlo.

Esto reduce el riesgo porque las reglas centrales quedan verificadas
desde temprano.

------------------------------------------------------------------------

## Paso 4 --- Implementar Redux

Crear:

``` text
goalsSlice
selectors
store
```

Agregar tests.

------------------------------------------------------------------------

## Paso 5 --- Implementar WebView

Crear la micro-app.

Implementar:

``` text
Native → Web
Web → Native
```

Primero hacer funcionar el contrato más pequeño posible.

------------------------------------------------------------------------

## Paso 6 --- Implementar Adapter

Separar:

``` text
WebView event
      ↓
parse
      ↓
validate
      ↓
domain event
```

Agregar tests.

------------------------------------------------------------------------

## Paso 7 --- Implementar abono

Conectar:

``` text
Web
 ↓
postMessage
 ↓
Adapter
 ↓
UseCase
 ↓
Redux
 ↓
UI
```

Este es el core que debe quedar sólido.

------------------------------------------------------------------------

## Paso 8 --- Crear librería

Crear el paquete independiente con `react-native-builder-bob`.

Implementar el módulo nativo.

Exponer una API pequeña y clara.

Ejemplo:

``` ts
notifyGoalCompleted(goalName: string)
```

Agregar tests.

------------------------------------------------------------------------

## Paso 9 --- Consumir la librería

`mobile` debe importar la librería como dependencia.

No copiar archivos de la librería dentro de `mobile`.

Esto demuestra que realmente se construyó un paquete reutilizable.

------------------------------------------------------------------------

## Paso 10 --- Integrar finalización de meta

Cuando:

``` text
progress >= 100
```

invocar:

``` ts
notifyGoalCompleted(goal.name);
```

------------------------------------------------------------------------

## Paso 11 --- Tests y cobertura

Ejecutar todos los tests.

Revisar cobertura.

Corregir casos faltantes.

------------------------------------------------------------------------

## Paso 12 --- Documentación

Completar:

``` text
README.md
web/README.md
libreria/README.md
mobile/README.md
docs/ia/USO_IA.md
```

------------------------------------------------------------------------

# 31. Qué NO hacer

Evitar una solución como:

``` text
GoalScreen.tsx
 ├── fetch
 ├── Redux
 ├── WebView parser
 ├── validaciones
 ├── reglas de negocio
 ├── native module
 └── JSX
```

Eso genera alto acoplamiento y será difícil de defender.

También evitar:

``` ts
const message: any = JSON.parse(data);
```

sin validación.

Y evitar:

``` text
mobile/
└── copied-library-code/
```

porque la KATA exige que la librería sea consumida como dependencia.

------------------------------------------------------------------------

# 32. Guion para la sustentación

## Minutos 0--3 --- Problema

Explicar:

> Construí una aplicación de metas de ahorro donde la lista vive en
> React Native y el detalle/abono vive dentro de una micro-app WebView.

------------------------------------------------------------------------

## Minutos 3--7 --- Arquitectura

Mostrar:

``` text
Presentation
     ↓
Application
     ↓
Domain
     ↑
Infrastructure

Redux
WebView
Native Library
```

Explicar por qué las responsabilidades están separadas.

------------------------------------------------------------------------

## Minutos 7--12 --- Demo

Mostrar:

1.  Listado.
2.  Selección de meta.
3.  WebView.
4.  Abono.
5.  `postMessage`.
6.  Redux actualizado.
7.  Pantalla mostrando nuevo acumulado.

------------------------------------------------------------------------

## Minutos 12--15 --- Librería nativa

Mostrar:

``` text
JS
 ↓
Library
 ↓
TurboModule
 ↓
Kotlin/Swift
```

Explicar qué parte es realmente nativa.

------------------------------------------------------------------------

## Minutos 15--20 --- Tests + IA + decisiones

Mostrar:

-   Tests.
-   Cobertura.
-   Skill.
-   Agent.
-   `USO_IA.md`.
-   Correcciones hechas al código generado por IA.

------------------------------------------------------------------------

# 33. Preguntas que probablemente debes poder responder

### ¿Por qué Redux?

Porque el requerimiento exige Redux como fuente de verdad global y
porque permite que el resultado del abono recibido desde el WebView
actualice el listado sin recargarlo.

### ¿Por qué WebView?

Porque la KATA exige que el detalle y formulario de abono sean una
micro-app web dentro de un WebView.

### ¿Por qué `postMessage`?

Porque es el mecanismo obligatorio de comunicación bidireccional entre
web y capa nativa.

### ¿Por qué Adapter?

Porque evita que el resto de la aplicación conozca el formato crudo de
los mensajes externos.

### ¿Por qué Repository?

Porque desacopla el dominio de la implementación concreta de
persistencia.

### ¿Por qué DDD?

Porque permite separar las reglas del negocio de React Native, WebView y
módulos nativos.

### ¿Qué pasa si llega un mensaje inválido?

Se rechaza antes de llegar al estado global.

### ¿Qué pasa si el monto es negativo?

El caso de uso lo rechaza.

### ¿Qué pasa si no existe la meta?

El caso de uso devuelve/erroriza el resultado y Redux no debe modificar
una meta inexistente.

### ¿Por qué una librería separada?

Porque el requerimiento exige demostrar que puedes empaquetar y consumir
código nativo como una dependencia reutilizable.

### ¿Qué generó la IA?

Debes responder exactamente qué partes generaste, qué revisaste y qué
rechazaste.

------------------------------------------------------------------------

# 34. Checklist final

``` text
[ ] Repositorio GitHub público
[ ] Historial incremental de commits
[ ] web/
[ ] libreria/
[ ] mobile/

[ ] React Native CLI
[ ] Sin Expo
[ ] TypeScript
[ ] Redux
[ ] WebView
[ ] postMessage bidireccional
[ ] Contrato tipado

[ ] DDD
[ ] Domain
[ ] Application
[ ] Infrastructure
[ ] Presentation

[ ] Adapter
[ ] Repository
[ ] Otro patrón justificado

[ ] Librería independiente
[ ] package.json propio
[ ] Código nativo real
[ ] TurboModule o NativeModule justificado
[ ] API pública tipada
[ ] README de librería
[ ] Librería consumida desde mobile

[ ] Tests de domain
[ ] Tests de use cases
[ ] Tests de parser
[ ] Tests Redux
[ ] Test de componente/hook
[ ] Tests librería
[ ] Coverage documentado

[ ] Skill de IA
[ ] Agent/subagent
[ ] docs/ia/USO_IA.md

[ ] README raíz
[ ] Arquitectura documentada
[ ] Contratos postMessage documentados
[ ] Instalación documentada
[ ] Tests documentados
[ ] Uso de IA documentado

[ ] Sin secretos
[ ] Validaciones
[ ] Manejo de errores
[ ] Seguridad del WebView
```

------------------------------------------------------------------------

# 35. Estrategia recomendada

La prioridad no debería ser terminar muchas pantallas.

El propio requerimiento indica que un **core sólido y probado vale más
que una feature incompleta pero grande**.

Por eso la estrategia sería:

``` text
1. Arquitectura
       ↓
2. Domain
       ↓
3. Tests
       ↓
4. Redux
       ↓
5. WebView + postMessage
       ↓
6. Tests
       ↓
7. Librería nativa
       ↓
8. Integración
       ↓
9. Tests + coverage
       ↓
10. Documentación
       ↓
11. Preparar sustentación
```

El flujo que debe quedar impecable es:

``` text
                    ┌──────────────┐
                    │ React Native │
                    │    Redux     │
                    └──────┬───────┘
                           │
                           │ postMessage
                           ▼
                    ┌──────────────┐
                    │   WebView    │
                    │   Micro-app  │
                    └──────┬───────┘
                           │
                           │ DEPOSIT_CONFIRMED
                           ▼
                    ┌──────────────┐
                    │   Adapter    │
                    │  + Validación│
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  MakeDeposit │
                    │   Use Case   │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │    Redux     │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Nuevo estado │
                    │   en lista   │
                    └──────────────┘

                           │
                     si llega al 100%
                           │
                           ▼
                    ┌──────────────┐
                    │  Librería    │
                    │    Nativa    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │ Kotlin/Swift│
                    │   Feedback  │
                    └──────────────┘
```

> **Regla de oro para la sustentación:** cada decisión importante debe
> poder responderse con tres cosas: **qué problema resuelve, qué
> alternativa descartaste y qué trade-off aceptaste.**
