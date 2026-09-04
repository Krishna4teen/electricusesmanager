CREATE TABLE public.analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_key text NOT NULL,
  name text NOT NULL,
  tariff_rate numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  daily_kwh numeric NOT NULL DEFAULT 0,
  monthly_kwh numeric NOT NULL DEFAULT 0,
  yearly_kwh numeric NOT NULL DEFAULT 0,
  daily_cost numeric NOT NULL DEFAULT 0,
  monthly_cost numeric NOT NULL DEFAULT 0,
  yearly_cost numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'Low',
  appliances jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX analyses_device_key_created_at_idx ON public.analyses (device_key, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read analyses" ON public.analyses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Anyone can insert analyses" ON public.analyses FOR INSERT TO anon, authenticated WITH CHECK (device_key <> '');
CREATE POLICY "Anyone can update analyses" ON public.analyses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete analyses" ON public.analyses FOR DELETE TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER analyses_set_updated_at BEFORE UPDATE ON public.analyses
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();