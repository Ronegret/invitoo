import { redirect } from "next/navigation";

/** `/cuenta` a secas: el panel decide adónde ir (o pide entrar). */
export default function Cuenta() {
  redirect("/panel");
}
