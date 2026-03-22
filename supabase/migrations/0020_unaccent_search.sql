CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE OR REPLACE FUNCTION search_global(q text)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  WITH
    norm AS (
      SELECT unaccent(lower(trim(q))) AS nq
    ),
    countries_raw AS (
      SELECT c.country, COUNT(v.id) AS venue_count
      FROM cities c
      LEFT JOIN venues v ON v.city_id = c.id AND v.published = true
      WHERE c.published = true
        AND unaccent(lower(c.country)) LIKE '%' || (SELECT nq FROM norm) || '%'
      GROUP BY c.country
      ORDER BY c.country
      LIMIT 5
    ),
    cities_raw AS (
      SELECT c.id, c.slug, c.name, c.country, COUNT(v.id) AS venue_count
      FROM cities c
      LEFT JOIN venues v ON v.city_id = c.id AND v.published = true
      WHERE c.published = true
        AND unaccent(lower(c.name)) LIKE '%' || (SELECT nq FROM norm) || '%'
      GROUP BY c.id
      ORDER BY c.name
      LIMIT 5
    ),
    venues_raw AS (
      SELECT v.id, v.slug, v.name, v.venue_type, c.slug AS city_slug, c.name AS city_name
      FROM venues v
      JOIN cities c ON c.id = v.city_id
      WHERE v.published = true
        AND unaccent(lower(v.name)) LIKE '%' || (SELECT nq FROM norm) || '%'
      LIMIT 8
    )
  SELECT json_build_object(
    'countries', COALESCE((SELECT json_agg(json_build_object('name', country, 'venueCount', venue_count)) FROM countries_raw), '[]'::json),
    'cities',    COALESCE((SELECT json_agg(json_build_object('id', id, 'slug', slug, 'name', name, 'country', country, 'venueCount', venue_count)) FROM cities_raw), '[]'::json),
    'venues',    COALESCE((SELECT json_agg(json_build_object('id', id, 'slug', slug, 'name', name, 'venue_type', venue_type, 'city_slug', city_slug, 'city_name', city_name)) FROM venues_raw), '[]'::json)
  );
$$;
