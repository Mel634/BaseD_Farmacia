/** Único correo autorizado para ingreso al ERP (personal). */
export const STAFF_EMAIL = "maalverac@puce.edu.ec";

export function esCorreoPersonal(email: string): boolean {
  return email.trim().toLowerCase() === STAFF_EMAIL;
}
