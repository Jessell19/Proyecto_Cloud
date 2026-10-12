import Link from "next/link";

export default function Inicio() {
  return (
    <>
      <span className="etiqueta-demo">Datos de demostración</span>
      <h1>Cuenta lo que vendiste y gastaste. Revisa y confirma.</h1>
      <p>
        Aplicación para micro y pequeños negocios de Guatemala. Más adelante podrás escribir
        “Vendí 10 aguas a Q5 cada una” y revisar lo que se registrará antes de confirmarlo.
      </p>
      <h2>Qué funciona en esta versión</h2>
      <ul>
        <li>El servicio responde en <code>/api/health</code>.</li>
        <li>Los comprobantes de prueba se guardan y se leen desde un bucket privado de Cloud Storage.</li>
      </ul>
      <p>
        La interpretación con IA, el inventario y el dashboard todavía no están construidos.
      </p>
      <p><Link href="/comprobantes">Ir a comprobantes de prueba</Link></p>
    </>
  );
}
