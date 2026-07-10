-- FASE D (Referral Engine). Solo AÑADE: enums ReferralModel /
-- ReferralParticipantStatus y tablas referral_programs, referral_participants,
-- referral_referrals. Coexiste con el sistema de referidos en vivo
-- (referidos/referral_events) sin tocarlo. Ningún flujo lo consume aún.

-- CreateEnum
CREATE TYPE "ReferralModel" AS ENUM ('CLASSIC', 'REFERRER_ONLY', 'REFERRED_ONLY', 'BOTH', 'PROGRESSIVE', 'AMBASSADOR', 'INFLUENCER', 'CORPORATE', 'EMPLOYEE', 'TEAM');

-- CreateEnum
CREATE TYPE "ReferralParticipantStatus" AS ENUM ('ACTIVE', 'PAUSED', 'BLOCKED');

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

-- AddForeignKey
ALTER TABLE "referral_programs" ADD CONSTRAINT "referral_programs_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_participants" ADD CONSTRAINT "referral_participants_programId_fkey" FOREIGN KEY ("programId") REFERENCES "referral_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_referrals" ADD CONSTRAINT "referral_referrals_programId_fkey" FOREIGN KEY ("programId") REFERENCES "referral_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral_referrals" ADD CONSTRAINT "referral_referrals_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "referral_participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
