import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function registrarLog(data: {
  usuarioId?: string;
  nombreUsuario?: string;
  rolUsuario?: string;
  accion: 'CREATE' | 'UPDATE' | 'DELETE';
  entidad: string;
  entidadId: string;
  antes?: Record<string, unknown>;
  despues?: Record<string, unknown>;
  descripcion?: string;
  ip?: string;
}) {
  console.log(data);
  await prisma.audit_log.create({
    data: {
      accion: data.accion,
      entidad: data.entidad,
      entidad_id: data.entidadId,
      usuario_id: data.usuarioId ?? null,
      nombre_usuario: data.nombreUsuario ?? null,
      rol_usuario: data.rolUsuario ?? null,
      descripcion: data.descripcion ?? null,
      ip: data.ip ?? null,
      cambios: data.antes || data.despues
        ? { antes: data.antes ?? null, despues: data.despues ?? null }
        : null,
    } as any,
  });
}