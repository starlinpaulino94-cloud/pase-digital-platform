-- CampanaInvitacion: toggle para mostrar la página de presentación (banner)
-- antes del formulario de registro. Por defecto false = registro directo.
ALTER TABLE "campanas_invitacion"
  ADD COLUMN "usarBanner" BOOLEAN NOT NULL DEFAULT false;
