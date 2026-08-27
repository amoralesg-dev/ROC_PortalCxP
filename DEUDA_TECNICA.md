# Deuda Técnica - ROC Portal CxP

Se registran los siguientes puntos de deuda técnica identificados durante la implementación del selector de unidades de negocio:

## Compilación y Bundles (Angular)
* **Coexistencia de Frameworks UI**: Actualmente conviven en el frontend las dependencias de **Angular Material** y **PrimeNG**, lo que incrementa el peso del bundle inicial.
* **Presupuestos de Compilación (Budgets)**: El budget en `angular.json` se incrementó temporalmente (`maximumWarning: 3MB`, `maximumError: 5MB`) para permitir la compilación del proyecto debido a la coexistencia de ambos frameworks.
* **Acciones Futuras**:
  1. Cuando finalice la migración completa a PrimeNG y se retire Angular Material por completo del proyecto, deberá revaluarse el tamaño real del bundle generado.
  2. Revisar si es posible volver a reducir los budgets en `angular.json` una vez eliminadas las dependencias que ya no se utilicen.

## Manejo de Montos y Precisión Financiera (Backend)
* **Uso de Double para Sumatorias**: Actualmente se utiliza la precisión de punto flotante `double` / `Double` en Java para acumular las sumatorias de montos monetarios en las búsquedas y visualizaciones del portal.
* **Campo Monto en VARCHAR**: El campo `monto` en la base de datos está almacenado bajo un tipo de dato `VARCHAR` (cadena de texto) en lugar de una representación decimal exacta.
* **Acciones Futuras**:
  1. Evaluar la migración del campo `monto` a un tipo de dato numérico exacto de base de datos como `DECIMAL(15,2)`.
  2. Modificar la lógica de mapeo de la entidad en Java para mapearlo como `BigDecimal`.
  3. Reemplazar la acumulación aritmética por `Double` en la clase de servicio `PagoServiceImpl` por acumulación exacta basada en sumatorias de objetos `BigDecimal`.
