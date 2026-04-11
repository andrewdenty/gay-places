-- Add hotel and shop to the venue_type enum.
ALTER TYPE public.venue_type ADD VALUE IF NOT EXISTS 'hotel';
ALTER TYPE public.venue_type ADD VALUE IF NOT EXISTS 'shop';
