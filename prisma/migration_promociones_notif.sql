-- Migration: add PROMOCION_NUEVA to NotifTipo enum
-- Run this in the Supabase SQL editor

ALTER TYPE "NotifTipo" ADD VALUE 'PROMOCION_NUEVA';
