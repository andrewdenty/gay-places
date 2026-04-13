-- Helper function used by the admin app to cascade a city's timezone to all
-- of its venues' opening_hours JSONB. Called whenever a city's timezone is
-- saved so that venues always stay in sync with their parent city.
create or replace function public.cascade_city_timezone(p_city_id uuid, p_tz text)
returns void
language sql
security definer
as $$
  update public.venues
  set opening_hours = jsonb_set(opening_hours, '{tz}', to_jsonb(p_tz), true)
  where city_id = p_city_id;
$$;
