/**
 * StaffOrderForm - Re-export from refactored module.
 * The component has been split into section components under ./StaffOrderForm/
 *
 * Section components:
 *   - StaffOrderForm/index.jsx        - Main form orchestrator (state + submit logic)
 *   - StaffOrderForm/CustomerSection.jsx  - Customer name and phone input
 *   - StaffOrderForm/VehicleSection.jsx   - Vehicle type, size, image, multi-vehicle
 *   - StaffOrderForm/LocationSection.jsx  - Area, emirate, street, villa
 *   - StaffOrderForm/OrderSummary.jsx     - Payment, price, notes, submit, confirmation modal
 */
export { default } from './StaffOrderForm/index';
