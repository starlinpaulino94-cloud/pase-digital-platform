import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, createSession, setSessionCookie } from "@/lib/auth";
import { ok, err, apiError, ensureQrToken } from "@/lib/api";
import { syncEvent } from "@/lib/integration";
import { checkRateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const registerSchema = z.object({
  nombre: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  telefono: z.string().optional(),
  fechaNacimiento: z.string().optional(),
  tipoNegocioId: z.string().min(1),
  empresaId: z.string().min(1),
  estrategiaId: z.string().optional(),
  campos: z.record(z.string(), z.string()).optional(),
});

// POST /api/auth/register
// Registro de cliente: crea User (CLIENTE) + Cliente (+ campos dinámicos) y opcionalmente asigna estrategia.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    if (!checkRateLimit(`register:${ip}`, 5, 10 * 60 * 1000)) {
      return err("Demasiadas solicitudes. Intenta más tarde.", 429);
    }
    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) return err("Datos inválidos", 422);
    const { nombre, email, password, telefono, fechaNacimiento, tipoNegocioId, empresaId, estrategiaId, campos } = parsed.data;
    const existe = await db.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (existe) return err("Ya existe una cuenta con ese email", 409);

    const empresa = await db.empresa.findUnique({ where: { id: empresaId } });
    if (!empresa || empresa.estado !== "ACTIVA") return err("Empresa no disponible", 422);
    if (empresa.tipoNegocioId !== tipoNegocioId) return err("El tipo de negocio no coincide con la empresa", 422);

    const user = await db.user.create({
      data: {
        email: String(email).toLowerCase(),
        password: hashPassword(password),
        nombre,
        telefono: telefono || null,
        rol: "CLIENTE",
      },
    });

    // Si ya existe un cliente para ese user+empresa, evita duplicados
    const clienteExistente = await db.cliente.findFirst({ where: { userId: user.id, empresaId } });
    if (clienteExistente) return err("Ya estás registrado en esta empresa", 409);

    const cliente = await db.cliente.create({
      data: {
        userId: user.id,
        nombre,
        telefono: telefono || null,
        email: String(email).toLowerCase(),
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null,
        empresaId,
        tipoNegocioId,
        estado: "ACTIVO",
      },
    });

    // Campos dinámicos
    if (campos && typeof campos === "object") {
      const defs = await db.campoDef.findMany({ where: { tipoNegocioId } });
      const validKeys = new Set(defs.map((d) => d.clave));
      const data = Object.entries(campos)
        .filter(([k, v]) => validKeys.has(k) && v !== undefined && v !== null && v !== "")
        .map(([clave, valor]) => ({ clienteId: cliente.id, clave, valor: String(valor) }));
      if (data.length) await db.clienteCampo.createMany({ data });
    }

    // Generar QR único
    const qr = await ensureQrToken(cliente.id, empresaId);

    // Asignar estrategia si fue seleccionada
    let clienteEstrategia = null;
    if (estrategiaId) {
      const estrategia = await db.estrategia.findUnique({ where: { id: estrategiaId } });
      if (!estrategia || estrategia.empresaId !== empresaId || estrategia.estado !== "ACTIVA") {
        return err("Estrategia no válida", 422);
      }
      const requierePago = estrategia.requierePago;
      const estadoCE = requierePago ? "PENDIENTE" : "ACTIVA";
      const fechaInicio = requierePago ? null : new Date();
      const fechaVencimiento = requierePago
        ? null
        : new Date(Date.now() + estrategia.duracionDias * 24 * 60 * 60 * 1000);
      clienteEstrategia = await db.clienteEstrategia.create({
        data: {
          clienteId: cliente.id,
          estrategiaId: estrategia.id,
          empresaId,
          estado: estadoCE,
          fechaInicio,
          fechaVencimiento,
          usosDisponibles: estrategia.tipoEstrategia === "MEMBRESIA" ? estrategia.cantidadUsos : 0,
          pagoConfirmado: !requierePago,
          montoPagado: requierePago ? 0 : estrategia.precio,
        },
      });
      if (!requierePago) {
        await syncEvent(empresaId, "MEMBRESIA_ACTIVADA", { clienteId: cliente.id, estrategiaId: estrategia.id });
      }
    }

    await syncEvent(empresaId, "CLIENTE_CREADO", { clienteId: cliente.id, nombre, email });

    const token = await createSession(user.id);
    await setSessionCookie(token);
    return ok({
      user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol, empresaId: null, telefono: user.telefono },
      cliente,
      qr,
      clienteEstrategia,
    });
  } catch (e) {
    return apiError(e);
  }
}
