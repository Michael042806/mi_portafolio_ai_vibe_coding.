# Guía de Testing y Validación - PLAN RM

Esta guía detalla la estrategia de pruebas para asegurar la integridad financiera y la usabilidad de PLAN RM.

## 🧪 Estrategia de Pruebas

### 1. Pruebas Unitarias (`src/lib/calculations.test.ts`)
Se enfocan en la lógica pura de negocio:
- **Cálculo de Ahorro Sugerido:** Verifica que la división por meses sea correcta y maneje fechas pasadas.
- **Saldos de Deuda:** Asegura que un pago no pueda dejar el saldo en negativo (lógica de UI y Backend).
- **Presupuesto Disponible:** Valida la resta de ingresos menos gastos y ahorros.
- **Porcentajes:** Verifica el cálculo de peso de cada categoría sobre el ingreso total.

### 2. Validación de Esquemas (`src/lib/validation.test.ts`)
Uso de **Zod** para garantizar que los datos que entran al sistema son válidos:
- Montos siempre positivos.
- Descripciones obligatorias.
- Formatos de fecha válidos.
- Tipos de ingresos restringidos a valores permitidos.

### 3. Pruebas de Integración (Propuestas)
- **Flujo de Pago de Deuda:** Verificar que al registrar un pago, el `currentBalance` en la base de datos se actualice correctamente y no baje de cero.
- **Actualización de Dashboard:** Asegurar que al añadir un ingreso, el "Total Income" se refresque.

---

## 🚩 Casos Borde Cubiertos

| Caso Borde | Comportamiento Esperado |
| :--- | :--- |
| **Pago mayor al saldo** | El sistema ajusta el pago al saldo restante y deja la deuda en $0. |
| **Fecha de meta ya pasada** | El cálculo de ahorro mensual usa 1 mes como mínimo para evitar errores. |
| **Ingreso total es cero** | Los cálculos de porcentaje devuelven 0% en lugar de error de división por cero. |
| **Gasto mayor al ingreso** | El presupuesto disponible muestra un valor negativo (déficit). |

---

## ✅ Checklist de Errores Comunes (Evitados)

- [x] **División por cero:** Controlado en cálculos de porcentaje y ahorro mensual.
- [x] **Saldos negativos:** La lógica de `calculateNewDebtBalance` y el endpoint `/api/debt-payments` previenen deudas negativas.
- [x] **Precisión Decimal:** Uso de `decimal.js` para evitar errores de redondeo de punto flotante (ej. `0.1 + 0.2 != 0.3`).
- [x] **Fechas Inválidas:** Validación estricta en el esquema de Metas de Ahorro.
- [x] **XSS en Descripciones:** Sanitización automática mediante el uso de React y validación de strings en Zod.
- [x] **Inyección SQL:** Uso de Prisma ORM que parametriza todas las consultas por defecto.

---

## 🚀 Cómo ejecutar los tests

```bash
npm test
```
*(Nota: Asegúrate de tener vitest configurado en package.json)*
