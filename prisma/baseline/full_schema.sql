-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('SUPERADMIN', 'ADMIN_EMPRESA', 'EMPLEADO', 'CLIENTE', 'ADMINISTRADOR', 'GERENTE', 'CAJERO', 'RECEPCION', 'MARKETING', 'SUPERVISOR');

-- CreateEnum
CREATE TYPE "NotifTipo" AS ENUM ('PAGO_APROBADO', 'PAGO_RECHAZADO', 'NUEVO_COMPROBANTE', 'MEMBRESIA_POR_VENCER', 'MEMBRESIA_ACTIVADA', 'PROMOCION_NUEVA', 'RECOMPENSA_REFERIDO', 'SISTEMA', 'TICKET_NUEVO', 'TICKET_RESPUESTA', 'TICKET_ACTUALIZADO');

-- CreateEnum
CREATE TYPE "TicketEstado" AS ENUM ('NUEVO', 'EN_PROCESO', 'ESPERANDO_CLIENTE', 'RESUELTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "TicketCategoria" AS ENUM ('PAGO', 'MEMBRESIA', 'BENEFICIOS', 'APP', 'OTRO');

-- CreateEnum
CREATE TYPE "TicketAutor" AS ENUM ('CLIENTE', 'ADMIN', 'SISTEMA');

-- CreateEnum
CREATE TYPE "MembershipEstado" AS ENUM ('PENDIENTE', 'PENDIENTE_PAGO', 'RECHAZADA', 'ACTIVA', 'VENCIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "MetodoPagoTipo" AS ENUM ('TRANSFERENCIA', 'PRESENCIAL');

-- CreateEnum
CREATE TYPE "InvitacionEstado" AS ENUM ('PENDIENTE', 'ACEPTADA', 'CANCELADA', 'EXPIRADA');

-- CreateEnum
CREATE TYPE "AuditAccion" AS ENUM ('VISITA_CONFIRMADA', 'PAGO_APROBADO', 'PAGO_RECHAZADO', 'MEMBRESIA_CANCELADA', 'MEMBRESIA_RENOVADA', 'QR_GENERADO', 'QR_USADO', 'QR_COMPARTIDO', 'COMPROBANTE_IMPRESO', 'REFERIDO_COMPLETADO', 'RECOMPENSA_OTORGADA', 'NOTA_INTERNA');

-- CreateEnum
CREATE TYPE "ReferidoEstado" AS ENUM ('PENDIENTE', 'COMPLETADO');

-- CreateEnum
CREATE TYPE "CondicionRecompensa" AS ENUM ('N_REFERIDOS_COMPLETADOS');

-- CreateEnum
CREATE TYPE "TipoRecompensa" AS ENUM ('LAVADOS_GRATIS', 'DESCUENTO_PORCENTAJE', 'DESCUENTO_MONTO');

-- CreateEnum
CREATE TYPE "ReferralEventTipo" AS ENUM ('SHARE', 'CLICK', 'REGISTRO', 'MEMBRESIA', 'REGISTRO_GLOBAL', 'MEMBRESIA_GLOBAL');

-- CreateEnum
CREATE TYPE "PostTipo" AS ENUM ('EVENTO', 'NOTICIA', 'BENEFICIO');

-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "RuleMatchType" AS ENUM ('ALL', 'ANY');

-- CreateEnum
CREATE TYPE "RuleLogicalOperator" AS ENUM ('AND', 'OR', 'NOT', 'XOR');

-- CreateEnum
CREATE TYPE "PromotionStatus" AS ENUM ('DRAFT', 'PENDING', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'ENDED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DictionaryVariableStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'DISABLED');

-- CreateEnum
CREATE TYPE "MembershipPlanType" AS ENUM ('UNLIMITED', 'CREDITS', 'HYBRID', 'TIER', 'FAMILY', 'FLEET', 'CORPORATE', 'SEASONAL', 'PREMIUM', 'MAINTENANCE', 'PAY_PER_VISIT', 'LOYALTY', 'PREPAID', 'VIP', 'REWARDS', 'TRIAL', 'STUDENT', 'DRIVER', 'SUBSCRIPTION_BOX', 'CUSTOM');

-- CreateEnum
CREATE TYPE "MembershipPeriodicity" AS ENUM ('NONE', 'ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUAL', 'ANNUAL', 'SEASONAL');

-- CreateEnum
CREATE TYPE "MembershipInstanceStatus" AS ENUM ('PENDING', 'ACTIVE', 'PAUSED', 'SUSPENDED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BenefitType" AS ENUM ('SERVICE_FREE', 'DISCOUNT', 'UPGRADE', 'PRODUCT', 'POINTS', 'CREDIT', 'TIME', 'EXPERIENCE', 'ACCESS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "BenefitGrantStatus" AS ENUM ('GRANTED', 'REDEEMED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "ReferralModel" AS ENUM ('CLASSIC', 'REFERRER_ONLY', 'REFERRED_ONLY', 'BOTH', 'PROGRESSIVE', 'AMBASSADOR', 'INFLUENCER', 'CORPORATE', 'EMPLOYEE', 'TEAM');

-- CreateEnum
CREATE TYPE "ReferralParticipantStatus" AS ENUM ('ACTIVE', 'PAUSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "AutomationRunStatus" AS ENUM ('RUNNING', 'WAITING', 'SUCCESS', 'FAILED', 'SKIPPED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AppRole" NOT NULL DEFAULT 'CLIENTE',
    "companyId" TEXT,
    "termsAcceptedAt" TIMESTAMP(3),
    "termsVersion" TEXT,
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "marketingConsentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_company_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_company_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "email" TEXT,
    "telefono" TEXT,
    "direccion" TEXT,
    "ciudad" TEXT,
    "categoria" TEXT,
    "website" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER,
    "bannerUrl" TEXT,
    "galleryImages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "provincia" TEXT,
    "pais" TEXT,
    "razonSocial" TEXT,
    "codigoPostal" TEXT,
    "latitud" DOUBLE PRECISION,
    "longitud" DOUBLE PRECISION,
    "zonaCobertura" TEXT,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "zonaHoraria" TEXT NOT NULL DEFAULT 'America/Santo_Domingo',
    "idioma" TEXT NOT NULL DEFAULT 'es-DO',
    "colorPrimario" TEXT,
    "politicaCancelacion" TEXT,
    "politicaPrivacidad" TEXT,
    "terminosEmpresa" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "facebook" TEXT,
    "tiktok" TEXT,
    "googleMapsUrl" TEXT,
    "horario" TEXT,
    "totalMembersCount" INTEGER NOT NULL DEFAULT 0,
    "activePromotionsCount" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DECIMAL(3,2),
    "bienvenidaActiva" BOOLEAN NOT NULL DEFAULT false,
    "bienvenidaTipo" TEXT NOT NULL DEFAULT 'PORCENTAJE',
    "bienvenidaValor" DECIMAL(10,2),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sucursales" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sucursales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metodos_pago" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" "MetodoPagoTipo" NOT NULL,
    "nombre" TEXT NOT NULL,
    "titular" TEXT,
    "numeroCuenta" TEXT,
    "tipoCuenta" TEXT,
    "instrucciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "metodos_pago_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "vigenciaDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenciaHasta" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "publicadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT,
    "tipo" TEXT NOT NULL DEFAULT 'general',
    "descuento" INTEGER,
    "codigo" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredOrder" INTEGER,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "shareCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "visibilidad" TEXT NOT NULL DEFAULT 'publica',
    "maxCanjes" INTEGER,
    "campanaId" TEXT,
    "canjes" INTEGER NOT NULL DEFAULT 0,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "archivada" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "promociones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "lavadosIncluidos" INTEGER NOT NULL DEFAULT 0,
    "esIlimitado" BOOLEAN NOT NULL DEFAULT false,
    "descripcion" TEXT,
    "beneficios" TEXT[],
    "vigenciaDias" INTEGER NOT NULL DEFAULT 30,
    "condiciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitaciones" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "AppRole" NOT NULL,
    "token" TEXT NOT NULL,
    "estado" "InvitacionEstado" NOT NULL DEFAULT 'PENDIENTE',
    "invitadoPor" TEXT,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "aceptadaEn" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invitaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "supabaseId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT NOT NULL,
    "fechaNacimiento" TIMESTAMP(3),
    "avatarUrl" TEXT,
    "ciudad" TEXT,
    "genero" TEXT,
    "idioma" TEXT,
    "notifPromos" BOOLEAN NOT NULL DEFAULT true,
    "notifRecordatorios" BOOLEAN NOT NULL DEFAULT true,
    "codigoReferido" TEXT NOT NULL,
    "codigoCorto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" "ReferralEventTipo" NOT NULL,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "canal" TEXT,
    "meta" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "referral_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referidos" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "referenteClienteId" TEXT NOT NULL,
    "referidoClienteId" TEXT NOT NULL,
    "estado" "ReferidoEstado" NOT NULL DEFAULT 'PENDIENTE',
    "recompensaAplicada" BOOLEAN NOT NULL DEFAULT false,
    "sospechoso" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completadoEn" TIMESTAMP(3),

    CONSTRAINT "referidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reglas_recompensa" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "condicion" "CondicionRecompensa" NOT NULL,
    "valorCondicion" INTEGER NOT NULL,
    "tipoRecompensa" "TipoRecompensa" NOT NULL,
    "valorRecompensa" DECIMAL(10,2) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reglas_recompensa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_config" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "codigoPais" TEXT NOT NULL DEFAULT '+1',
    "numero" TEXT NOT NULL,
    "mensajePlantilla" TEXT NOT NULL DEFAULT 'Hola, quisiera más información.',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "correoSoporte" TEXT,
    "horaInicio" TEXT,
    "horaCierre" TEXT,
    "diasLaborales" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_items" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "pregunta" TEXT NOT NULL,
    "respuesta" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faq_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "asunto" TEXT NOT NULL,
    "categoria" "TicketCategoria" NOT NULL DEFAULT 'OTRO',
    "estado" "TicketEstado" NOT NULL DEFAULT 'NUEVO',
    "adjuntoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_mensajes" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "autorTipo" "TicketAutor" NOT NULL,
    "autorNombre" TEXT NOT NULL,
    "cuerpo" TEXT NOT NULL,
    "esNotaInterna" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_mensajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehiculos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "placa" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vehiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "memberships" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "planIdSolicitado" TEXT,
    "userId" TEXT,
    "metodoPagoId" TEXT,
    "estado" "MembershipEstado" NOT NULL DEFAULT 'PENDIENTE',
    "comprobanteUrl" TEXT,
    "comprobanteNota" TEXT,
    "rechazadoReason" TEXT,
    "adminNota" TEXT,
    "pagoConfirmado" BOOLEAN NOT NULL DEFAULT false,
    "montoPagado" DECIMAL(10,2),
    "descuentoBienvenida" DECIMAL(10,2),
    "fechaInicio" TIMESTAMP(3),
    "fechaVencimiento" TIMESTAMP(3),
    "lavadosRestantes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_tokens" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "membresiaId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "compartidoCount" INTEGER NOT NULL DEFAULT 0,
    "ultimoCompartido" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visits" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "vehiculoId" TEXT,
    "membershipId" TEXT NOT NULL,
    "sucursalId" TEXT,
    "empleadoId" TEXT,
    "servicio" TEXT NOT NULL,
    "descontado" BOOLEAN NOT NULL DEFAULT false,
    "fechaVisita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notas" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comprobantes" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "impresiones" INTEGER NOT NULL DEFAULT 0,
    "ultimaImpresion" TIMESTAMP(3),
    "creadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comprobantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "userId" TEXT,
    "accion" "AuditAccion" NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificaciones" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" "NotifTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "href" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_to_categories" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_to_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_ratings" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_follows" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "esFavorita" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_follows_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promociones_guardadas" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promocionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promociones_guardadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company_posts" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "tipo" "PostTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "imagenUrl" TEXT,
    "fechaEvento" TIMESTAMP(3),
    "lugar" TEXT,
    "campanaId" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "publicadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente_notas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "autorId" TEXT,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cliente_notas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanas" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "fechaInicio" TIMESTAMP(3),
    "fechaFin" TIMESTAMP(3),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "campanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_intereses" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_intereses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_groups" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rules" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "groupId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "matchType" "RuleMatchType" NOT NULL DEFAULT 'ALL',
    "validoDesde" TIMESTAMP(3),
    "validoHasta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_conditions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "groupId" TEXT,
    "campo" TEXT NOT NULL,
    "operador" TEXT NOT NULL,
    "valor" JSONB NOT NULL DEFAULT 'null',
    "tipoValor" TEXT NOT NULL DEFAULT 'STRING',
    "conditionType" TEXT NOT NULL DEFAULT 'field',
    "dataType" TEXT NOT NULL DEFAULT 'TEXT',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_conditions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_condition_groups" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "parentId" TEXT,
    "operator" "RuleLogicalOperator" NOT NULL DEFAULT 'AND',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_condition_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_actions" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "maxReintentos" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rule_execution_logs" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "companyId" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "resultado" JSONB NOT NULL DEFAULT '{}',
    "contexto" JSONB NOT NULL DEFAULT '{}',
    "duracionMs" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_execution_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotions" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT,
    "status" "PromotionStatus" NOT NULL DEFAULT 'DRAFT',
    "prioridad" INTEGER NOT NULL DEFAULT 0,
    "inicioEn" TIMESTAMP(3),
    "finEn" TIMESTAMP(3),
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "creadoPorId" TEXT,
    "editadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_rules" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_actions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "params" JSONB NOT NULL DEFAULT '{}',
    "orden" INTEGER NOT NULL DEFAULT 0,
    "obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "maxReintentos" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_restrictions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "valor" INTEGER,
    "config" JSONB NOT NULL DEFAULT '{}',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_restrictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_versions" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "resumen" TEXT,
    "creadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promotion_audits" (
    "id" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT,
    "accion" TEXT NOT NULL,
    "estadoAnterior" "PromotionStatus",
    "estadoNuevo" "PromotionStatus",
    "cambios" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotion_audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_dictionary_variables" (
    "id" TEXT NOT NULL,
    "companyId" TEXT,
    "key" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "semanticType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "ownerModule" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CONTEXT',
    "contextPath" TEXT,
    "format" TEXT,
    "unit" TEXT,
    "aliases" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "DictionaryVariableStatus" NOT NULL DEFAULT 'ACTIVE',
    "version" INTEGER NOT NULL DEFAULT 1,
    "validation" JSONB NOT NULL DEFAULT '{}',
    "i18n" JSONB NOT NULL DEFAULT '{}',
    "calculated" JSONB,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_dictionary_variables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_dictionary_variable_versions" (
    "id" TEXT NOT NULL,
    "variableId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "data_dictionary_variable_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_plans" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "tipo" "MembershipPlanType" NOT NULL,
    "precio" DECIMAL(10,2) NOT NULL,
    "moneda" TEXT NOT NULL DEFAULT 'DOP',
    "periodicidad" "MembershipPeriodicity" NOT NULL DEFAULT 'MONTHLY',
    "duracionDias" INTEGER,
    "creditos" INTEGER,
    "ilimitado" BOOLEAN NOT NULL DEFAULT false,
    "templateKey" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_instances" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscriberKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "status" "MembershipInstanceStatus" NOT NULL DEFAULT 'PENDING',
    "inicioEn" TIMESTAMP(3),
    "finEn" TIMESTAMP(3),
    "renuevaEn" TIMESTAMP(3),
    "autoRenovar" BOOLEAN NOT NULL DEFAULT false,
    "creditosRestantes" INTEGER,
    "vehiculos" JSONB NOT NULL DEFAULT '[]',
    "config" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "membership_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membership_usage" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "servicio" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "vehiculo" TEXT,
    "usadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "membership_usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefits" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "code" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "categoria" TEXT NOT NULL,
    "tipo" "BenefitType" NOT NULL,
    "valorPercibido" DECIMAL(10,2),
    "costoReal" DECIMAL(10,2),
    "templateKey" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "benefit_grants" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "benefitId" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "subscriberKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "sourceModule" TEXT NOT NULL,
    "status" "BenefitGrantStatus" NOT NULL DEFAULT 'GRANTED',
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "benefit_grants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_programs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "objetivo" TEXT,
    "type" "ReferralModel" NOT NULL,
    "templateKey" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_participants" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referrerKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "code" TEXT NOT NULL,
    "status" "ReferralParticipantStatus" NOT NULL DEFAULT 'ACTIVE',
    "level" INTEGER NOT NULL DEFAULT 0,
    "referralsCount" INTEGER NOT NULL DEFAULT 0,
    "convertedCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "referral_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referral_referrals" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "referredId" TEXT,
    "referredKind" TEXT NOT NULL DEFAULT 'CLIENT',
    "state" TEXT NOT NULL DEFAULT 'INVITED',
    "history" JSONB NOT NULL DEFAULT '[]',
    "suspicious" BOOLEAN NOT NULL DEFAULT false,
    "fraudReasons" JSONB NOT NULL DEFAULT '[]',
    "rewardReleased" BOOLEAN NOT NULL DEFAULT false,
    "rewardGrantId" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "referral_referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automations" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "objetivo" TEXT,
    "templateKey" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerEvent" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_runs" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "status" "AutomationRunStatus" NOT NULL DEFAULT 'RUNNING',
    "subjectId" TEXT,
    "subjectKind" TEXT,
    "triggeredBy" TEXT,
    "rulesEvaluated" JSONB NOT NULL DEFAULT '[]',
    "actionsRun" JSONB NOT NULL DEFAULT '[]',
    "result" JSONB NOT NULL DEFAULT '{}',
    "error" TEXT,
    "durationMs" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "meta" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "automation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "automation_events" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subjectId" TEXT,
    "subjectKind" TEXT DEFAULT 'CLIENT',
    "payload" JSONB NOT NULL DEFAULT '{}',
    "source" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "automation_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_companyId_idx" ON "users"("companyId");

-- CreateIndex
CREATE INDEX "user_company_access_companyId_idx" ON "user_company_access"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "user_company_access_userId_companyId_key" ON "user_company_access"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "companies_slug_key" ON "companies"("slug");

-- CreateIndex
CREATE INDEX "companies_isPublished_isFeatured_idx" ON "companies"("isPublished", "isFeatured");

-- CreateIndex
CREATE INDEX "companies_ciudad_provincia_idx" ON "companies"("ciudad", "provincia");

-- CreateIndex
CREATE INDEX "companies_type_idx" ON "companies"("type");

-- CreateIndex
CREATE INDEX "companies_createdAt_idx" ON "companies"("createdAt");

-- CreateIndex
CREATE INDEX "sucursales_companyId_idx" ON "sucursales"("companyId");

-- CreateIndex
CREATE INDEX "metodos_pago_companyId_idx" ON "metodos_pago"("companyId");

-- CreateIndex
CREATE INDEX "promociones_companyId_activo_idx" ON "promociones"("companyId", "activo");

-- CreateIndex
CREATE INDEX "promociones_isFeatured_vigenciaHasta_idx" ON "promociones"("isFeatured", "vigenciaHasta");

-- CreateIndex
CREATE INDEX "promociones_tipo_idx" ON "promociones"("tipo");

-- CreateIndex
CREATE INDEX "promociones_createdAt_idx" ON "promociones"("createdAt");

-- CreateIndex
CREATE INDEX "promociones_activo_archivada_visibilidad_publicadaEn_idx" ON "promociones"("activo", "archivada", "visibilidad", "publicadaEn");

-- CreateIndex
CREATE INDEX "plans_companyId_idx" ON "plans"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "invitaciones_token_key" ON "invitaciones"("token");

-- CreateIndex
CREATE INDEX "invitaciones_companyId_estado_idx" ON "invitaciones"("companyId", "estado");

-- CreateIndex
CREATE INDEX "invitaciones_email_idx" ON "invitaciones"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigoReferido_key" ON "clientes"("codigoReferido");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_codigoCorto_key" ON "clientes"("codigoCorto");

-- CreateIndex
CREATE INDEX "clientes_companyId_idx" ON "clientes"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_supabaseId_companyId_key" ON "clientes"("supabaseId", "companyId");

-- CreateIndex
CREATE INDEX "referral_events_clienteId_companyId_idx" ON "referral_events"("clienteId", "companyId");

-- CreateIndex
CREATE INDEX "referral_events_companyId_tipo_createdAt_idx" ON "referral_events"("companyId", "tipo", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "referidos_referidoClienteId_key" ON "referidos"("referidoClienteId");

-- CreateIndex
CREATE INDEX "referidos_companyId_referenteClienteId_idx" ON "referidos"("companyId", "referenteClienteId");

-- CreateIndex
CREATE INDEX "referidos_companyId_sospechoso_idx" ON "referidos"("companyId", "sospechoso");

-- CreateIndex
CREATE INDEX "reglas_recompensa_companyId_activo_idx" ON "reglas_recompensa"("companyId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_config_companyId_key" ON "whatsapp_config"("companyId");

-- CreateIndex
CREATE INDEX "faq_items_companyId_activo_idx" ON "faq_items"("companyId", "activo");

-- CreateIndex
CREATE INDEX "support_tickets_companyId_estado_idx" ON "support_tickets"("companyId", "estado");

-- CreateIndex
CREATE INDEX "support_tickets_clienteId_idx" ON "support_tickets"("clienteId");

-- CreateIndex
CREATE INDEX "ticket_mensajes_ticketId_idx" ON "ticket_mensajes"("ticketId");

-- CreateIndex
CREATE INDEX "vehiculos_clienteId_idx" ON "vehiculos"("clienteId");

-- CreateIndex
CREATE INDEX "memberships_estado_idx" ON "memberships"("estado");

-- CreateIndex
CREATE INDEX "memberships_clienteId_idx" ON "memberships"("clienteId");

-- CreateIndex
CREATE INDEX "memberships_companyId_idx" ON "memberships"("companyId");

-- CreateIndex
CREATE INDEX "memberships_planId_idx" ON "memberships"("planId");

-- CreateIndex
CREATE INDEX "memberships_companyId_estado_fechaVencimiento_idx" ON "memberships"("companyId", "estado", "fechaVencimiento");

-- CreateIndex
CREATE UNIQUE INDEX "memberships_clienteId_companyId_key" ON "memberships"("clienteId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "qr_tokens_token_key" ON "qr_tokens"("token");

-- CreateIndex
CREATE INDEX "qr_tokens_clienteId_activo_idx" ON "qr_tokens"("clienteId", "activo");

-- CreateIndex
CREATE INDEX "qr_tokens_membresiaId_idx" ON "qr_tokens"("membresiaId");

-- CreateIndex
CREATE INDEX "visits_clienteId_idx" ON "visits"("clienteId");

-- CreateIndex
CREATE INDEX "visits_membershipId_idx" ON "visits"("membershipId");

-- CreateIndex
CREATE INDEX "visits_fechaVisita_idx" ON "visits"("fechaVisita");

-- CreateIndex
CREATE INDEX "visits_vehiculoId_idx" ON "visits"("vehiculoId");

-- CreateIndex
CREATE INDEX "visits_sucursalId_idx" ON "visits"("sucursalId");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_visitId_key" ON "comprobantes"("visitId");

-- CreateIndex
CREATE UNIQUE INDEX "comprobantes_numero_key" ON "comprobantes"("numero");

-- CreateIndex
CREATE INDEX "comprobantes_membershipId_idx" ON "comprobantes"("membershipId");

-- CreateIndex
CREATE INDEX "audit_logs_companyId_idx" ON "audit_logs"("companyId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_accion_idx" ON "audit_logs"("accion");

-- CreateIndex
CREATE INDEX "audit_logs_entidadTipo_entidadId_idx" ON "audit_logs"("entidadTipo", "entidadId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "notificaciones_userId_leida_idx" ON "notificaciones"("userId", "leida");

-- CreateIndex
CREATE INDEX "notificaciones_userId_createdAt_idx" ON "notificaciones"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "business_categories_name_key" ON "business_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "business_categories_slug_key" ON "business_categories"("slug");

-- CreateIndex
CREATE INDEX "business_categories_active_order_idx" ON "business_categories"("active", "order");

-- CreateIndex
CREATE INDEX "company_to_categories_companyId_idx" ON "company_to_categories"("companyId");

-- CreateIndex
CREATE INDEX "company_to_categories_categoryId_idx" ON "company_to_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "company_to_categories_companyId_categoryId_key" ON "company_to_categories"("companyId", "categoryId");

-- CreateIndex
CREATE INDEX "company_ratings_companyId_idx" ON "company_ratings"("companyId");

-- CreateIndex
CREATE INDEX "company_ratings_rating_idx" ON "company_ratings"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "company_ratings_companyId_clienteId_key" ON "company_ratings"("companyId", "clienteId");

-- CreateIndex
CREATE INDEX "company_follows_companyId_idx" ON "company_follows"("companyId");

-- CreateIndex
CREATE INDEX "company_follows_userId_esFavorita_idx" ON "company_follows"("userId", "esFavorita");

-- CreateIndex
CREATE UNIQUE INDEX "company_follows_userId_companyId_key" ON "company_follows"("userId", "companyId");

-- CreateIndex
CREATE INDEX "promociones_guardadas_userId_createdAt_idx" ON "promociones_guardadas"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "promociones_guardadas_promocionId_idx" ON "promociones_guardadas"("promocionId");

-- CreateIndex
CREATE UNIQUE INDEX "promociones_guardadas_userId_promocionId_key" ON "promociones_guardadas"("userId", "promocionId");

-- CreateIndex
CREATE INDEX "company_posts_companyId_tipo_activo_idx" ON "company_posts"("companyId", "tipo", "activo");

-- CreateIndex
CREATE INDEX "company_posts_tipo_fechaEvento_idx" ON "company_posts"("tipo", "fechaEvento");

-- CreateIndex
CREATE INDEX "cliente_notas_clienteId_createdAt_idx" ON "cliente_notas"("clienteId", "createdAt");

-- CreateIndex
CREATE INDEX "campanas_companyId_activo_idx" ON "campanas"("companyId", "activo");

-- CreateIndex
CREATE INDEX "user_intereses_categoryId_idx" ON "user_intereses"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "user_intereses_userId_categoryId_key" ON "user_intereses"("userId", "categoryId");

-- CreateIndex
CREATE INDEX "rule_groups_companyId_activo_idx" ON "rule_groups"("companyId", "activo");

-- CreateIndex
CREATE UNIQUE INDEX "rule_groups_companyId_key_key" ON "rule_groups"("companyId", "key");

-- CreateIndex
CREATE INDEX "rules_companyId_status_activo_idx" ON "rules"("companyId", "status", "activo");

-- CreateIndex
CREATE INDEX "rules_groupId_idx" ON "rules"("groupId");

-- CreateIndex
CREATE INDEX "rules_companyId_prioridad_idx" ON "rules"("companyId", "prioridad");

-- CreateIndex
CREATE INDEX "rule_conditions_ruleId_orden_idx" ON "rule_conditions"("ruleId", "orden");

-- CreateIndex
CREATE INDEX "rule_conditions_groupId_idx" ON "rule_conditions"("groupId");

-- CreateIndex
CREATE INDEX "rule_condition_groups_ruleId_idx" ON "rule_condition_groups"("ruleId");

-- CreateIndex
CREATE INDEX "rule_condition_groups_parentId_idx" ON "rule_condition_groups"("parentId");

-- CreateIndex
CREATE INDEX "rule_actions_ruleId_orden_idx" ON "rule_actions"("ruleId", "orden");

-- CreateIndex
CREATE INDEX "rule_execution_logs_companyId_createdAt_idx" ON "rule_execution_logs"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "rule_execution_logs_ruleId_idx" ON "rule_execution_logs"("ruleId");

-- CreateIndex
CREATE INDEX "promotions_companyId_status_idx" ON "promotions"("companyId", "status");

-- CreateIndex
CREATE INDEX "promotions_companyId_prioridad_idx" ON "promotions"("companyId", "prioridad");

-- CreateIndex
CREATE INDEX "promotions_companyId_status_inicioEn_finEn_idx" ON "promotions"("companyId", "status", "inicioEn", "finEn");

-- CreateIndex
CREATE INDEX "promotion_rules_ruleId_idx" ON "promotion_rules"("ruleId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_rules_promotionId_ruleId_key" ON "promotion_rules"("promotionId", "ruleId");

-- CreateIndex
CREATE INDEX "promotion_actions_promotionId_orden_idx" ON "promotion_actions"("promotionId", "orden");

-- CreateIndex
CREATE INDEX "promotion_restrictions_promotionId_idx" ON "promotion_restrictions"("promotionId");

-- CreateIndex
CREATE INDEX "promotion_versions_promotionId_idx" ON "promotion_versions"("promotionId");

-- CreateIndex
CREATE UNIQUE INDEX "promotion_versions_promotionId_version_key" ON "promotion_versions"("promotionId", "version");

-- CreateIndex
CREATE INDEX "promotion_audits_promotionId_createdAt_idx" ON "promotion_audits"("promotionId", "createdAt");

-- CreateIndex
CREATE INDEX "promotion_audits_companyId_createdAt_idx" ON "promotion_audits"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "data_dictionary_variables_companyId_category_idx" ON "data_dictionary_variables"("companyId", "category");

-- CreateIndex
CREATE INDEX "data_dictionary_variables_category_idx" ON "data_dictionary_variables"("category");

-- CreateIndex
CREATE INDEX "data_dictionary_variables_status_idx" ON "data_dictionary_variables"("status");

-- CreateIndex
CREATE UNIQUE INDEX "data_dictionary_variables_companyId_key_key" ON "data_dictionary_variables"("companyId", "key");

-- CreateIndex
CREATE INDEX "data_dictionary_variable_versions_variableId_idx" ON "data_dictionary_variable_versions"("variableId");

-- CreateIndex
CREATE UNIQUE INDEX "data_dictionary_variable_versions_variableId_version_key" ON "data_dictionary_variable_versions"("variableId", "version");

-- CreateIndex
CREATE INDEX "membership_plans_companyId_tipo_idx" ON "membership_plans"("companyId", "tipo");

-- CreateIndex
CREATE INDEX "membership_plans_companyId_status_idx" ON "membership_plans"("companyId", "status");

-- CreateIndex
CREATE INDEX "membership_instances_companyId_status_idx" ON "membership_instances"("companyId", "status");

-- CreateIndex
CREATE INDEX "membership_instances_planId_idx" ON "membership_instances"("planId");

-- CreateIndex
CREATE INDEX "membership_instances_subscriberId_idx" ON "membership_instances"("subscriberId");

-- CreateIndex
CREATE INDEX "membership_usage_instanceId_usadoEn_idx" ON "membership_usage"("instanceId", "usadoEn");

-- CreateIndex
CREATE INDEX "membership_usage_companyId_usadoEn_idx" ON "membership_usage"("companyId", "usadoEn");

-- CreateIndex
CREATE INDEX "benefits_companyId_status_idx" ON "benefits"("companyId", "status");

-- CreateIndex
CREATE INDEX "benefits_companyId_categoria_idx" ON "benefits"("companyId", "categoria");

-- CreateIndex
CREATE INDEX "benefits_companyId_tipo_idx" ON "benefits"("companyId", "tipo");

-- CreateIndex
CREATE INDEX "benefit_grants_companyId_status_idx" ON "benefit_grants"("companyId", "status");

-- CreateIndex
CREATE INDEX "benefit_grants_benefitId_status_idx" ON "benefit_grants"("benefitId", "status");

-- CreateIndex
CREATE INDEX "benefit_grants_subscriberId_idx" ON "benefit_grants"("subscriberId");

-- CreateIndex
CREATE INDEX "benefit_grants_companyId_sourceModule_idx" ON "benefit_grants"("companyId", "sourceModule");

-- CreateIndex
CREATE INDEX "referral_programs_companyId_status_idx" ON "referral_programs"("companyId", "status");

-- CreateIndex
CREATE INDEX "referral_programs_companyId_type_idx" ON "referral_programs"("companyId", "type");

-- CreateIndex
CREATE INDEX "referral_participants_companyId_programId_idx" ON "referral_participants"("companyId", "programId");

-- CreateIndex
CREATE INDEX "referral_participants_referrerId_idx" ON "referral_participants"("referrerId");

-- CreateIndex
CREATE UNIQUE INDEX "referral_participants_programId_code_key" ON "referral_participants"("programId", "code");

-- CreateIndex
CREATE INDEX "referral_referrals_companyId_programId_state_idx" ON "referral_referrals"("companyId", "programId", "state");

-- CreateIndex
CREATE INDEX "referral_referrals_participantId_state_idx" ON "referral_referrals"("participantId", "state");

-- CreateIndex
CREATE INDEX "referral_referrals_referredId_idx" ON "referral_referrals"("referredId");

-- CreateIndex
CREATE INDEX "automations_companyId_status_idx" ON "automations"("companyId", "status");

-- CreateIndex
CREATE INDEX "automations_companyId_triggerType_idx" ON "automations"("companyId", "triggerType");

-- CreateIndex
CREATE INDEX "automations_companyId_triggerEvent_idx" ON "automations"("companyId", "triggerEvent");

-- CreateIndex
CREATE INDEX "automation_runs_companyId_automationId_status_idx" ON "automation_runs"("companyId", "automationId", "status");

-- CreateIndex
CREATE INDEX "automation_runs_companyId_startedAt_idx" ON "automation_runs"("companyId", "startedAt");

-- CreateIndex
CREATE INDEX "automation_runs_subjectId_idx" ON "automation_runs"("subjectId");

-- CreateIndex
CREATE INDEX "automation_events_companyId_type_processed_idx" ON "automation_events"("companyId", "type", "processed");

-- CreateIndex
CREATE INDEX "automation_events_companyId_occurredAt_idx" ON "automation_events"("companyId", "occurredAt");

-- CreateIndex
CREATE INDEX "automation_events_subjectId_idx" ON "automation_events"("subjectId");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_company_access" ADD CONSTRAINT "user_company_access_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sucursales" ADD CONSTRAINT "sucursales_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metodos_pago" ADD CONSTRAINT "metodos_pago_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones" ADD CONSTRAINT "promociones_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "plans" ADD CONSTRAINT "plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitaciones" ADD CONSTRAINT "invitaciones_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_events" ADD CONSTRAINT "referral_events_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_referenteClienteId_fkey" FOREIGN KEY ("referenteClienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referidos" ADD CONSTRAINT "referidos_referidoClienteId_fkey" FOREIGN KEY ("referidoClienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reglas_recompensa" ADD CONSTRAINT "reglas_recompensa_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_config" ADD CONSTRAINT "whatsapp_config_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "faq_items" ADD CONSTRAINT "faq_items_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_mensajes" ADD CONSTRAINT "ticket_mensajes_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehiculos" ADD CONSTRAINT "vehiculos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_planIdSolicitado_fkey" FOREIGN KEY ("planIdSolicitado") REFERENCES "plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_metodoPagoId_fkey" FOREIGN KEY ("metodoPagoId") REFERENCES "metodos_pago"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_tokens" ADD CONSTRAINT "qr_tokens_membresiaId_fkey" FOREIGN KEY ("membresiaId") REFERENCES "memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_vehiculoId_fkey" FOREIGN KEY ("vehiculoId") REFERENCES "vehiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "sucursales"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "memberships"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificaciones" ADD CONSTRAINT "notificaciones_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_to_categories" ADD CONSTRAINT "company_to_categories_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_to_categories" ADD CONSTRAINT "company_to_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "business_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_ratings" ADD CONSTRAINT "company_ratings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_ratings" ADD CONSTRAINT "company_ratings_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_follows" ADD CONSTRAINT "company_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_follows" ADD CONSTRAINT "company_follows_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones_guardadas" ADD CONSTRAINT "promociones_guardadas_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promociones_guardadas" ADD CONSTRAINT "promociones_guardadas_promocionId_fkey" FOREIGN KEY ("promocionId") REFERENCES "promociones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_posts" ADD CONSTRAINT "company_posts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "company_posts" ADD CONSTRAINT "company_posts_campanaId_fkey" FOREIGN KEY ("campanaId") REFERENCES "campanas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_notas" ADD CONSTRAINT "cliente_notas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cliente_notas" ADD CONSTRAINT "cliente_notas_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campanas" ADD CONSTRAINT "campanas_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_intereses" ADD CONSTRAINT "user_intereses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_intereses" ADD CONSTRAINT "user_intereses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "business_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_groups" ADD CONSTRAINT "rule_groups_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rules" ADD CONSTRAINT "rules_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "rule_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_conditions" ADD CONSTRAINT "rule_conditions_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "rule_condition_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_condition_groups" ADD CONSTRAINT "rule_condition_groups_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_condition_groups" ADD CONSTRAINT "rule_condition_groups_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "rule_condition_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_actions" ADD CONSTRAINT "rule_actions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_execution_logs" ADD CONSTRAINT "rule_execution_logs_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rule_execution_logs" ADD CONSTRAINT "rule_execution_logs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_rules" ADD CONSTRAINT "promotion_rules_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_actions" ADD CONSTRAINT "promotion_actions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_restrictions" ADD CONSTRAINT "promotion_restrictions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_versions" ADD CONSTRAINT "promotion_versions_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_audits" ADD CONSTRAINT "promotion_audits_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_audits" ADD CONSTRAINT "promotion_audits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_dictionary_variables" ADD CONSTRAINT "data_dictionary_variables_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_dictionary_variable_versions" ADD CONSTRAINT "data_dictionary_variable_versions_variableId_fkey" FOREIGN KEY ("variableId") REFERENCES "data_dictionary_variables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_plans" ADD CONSTRAINT "membership_plans_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_instances" ADD CONSTRAINT "membership_instances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_instances" ADD CONSTRAINT "membership_instances_planId_fkey" FOREIGN KEY ("planId") REFERENCES "membership_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membership_usage" ADD CONSTRAINT "membership_usage_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "membership_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefits" ADD CONSTRAINT "benefits_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "benefit_grants" ADD CONSTRAINT "benefit_grants_benefitId_fkey" FOREIGN KEY ("benefitId") REFERENCES "benefits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_participants" ADD CONSTRAINT "referral_participants_programId_fkey" FOREIGN KEY ("programId") REFERENCES "referral_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_referrals" ADD CONSTRAINT "referral_referrals_programId_fkey" FOREIGN KEY ("programId") REFERENCES "referral_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_referrals" ADD CONSTRAINT "referral_referrals_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "referral_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automations" ADD CONSTRAINT "automations_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "automation_runs" ADD CONSTRAINT "automation_runs_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

