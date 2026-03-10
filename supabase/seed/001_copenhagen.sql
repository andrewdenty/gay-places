-- Gay Places: seed Copenhagen (development)

do $$
declare
  copenhagen_id uuid;
begin
  insert into public.cities (slug, name, country, center_lat, center_lng, published)
  values ('copenhagen', 'Copenhagen', 'Denmark', 55.6761, 12.5683, true)
  on conflict (slug) do update
    set name = excluded.name,
        country = excluded.country,
        center_lat = excluded.center_lat,
        center_lng = excluded.center_lng,
        published = excluded.published
  returning id into copenhagen_id;

  delete from public.venues
  where city_id = copenhagen_id
    and name in (
      'Centralhjørnet',
      'Jailhouse CPH',
      'Never Mind',
      'Masken Bar & Café',
      'Bar Bitch',
      'Café Intime',
      'Oscar Bar & Café',
      'Copenhagen Eagle',
      'Jolene Bar'
    );

  insert into public.venues (
    city_id,
    name,
    address,
    lat,
    lng,
    venue_type,
    description,
    tags,
    website_url,
    google_maps_url,
    opening_hours,
    published
  )
  values
  (
    copenhagen_id,
    'Centralhjørnet',
    'Kattesundet 18, 1458 København',
    55.6776,
    12.5730,
    'bar',
    'Classic, cozy gay bar in the old town—welcoming crowd and timeless Copenhagen charm.',
    array['classic','cocktail bar','lgbtq+'],
    'https://centralhjornet.dk/',
    'https://www.google.com/maps/search/?api=1&query=Centralhj%C3%B8rnet%20Kattesundet%2018%201458%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'mon', jsonb_build_array(jsonb_build_object('start','16:00','end','02:00')),
      'tue', jsonb_build_array(jsonb_build_object('start','16:00','end','02:00')),
      'wed', jsonb_build_array(jsonb_build_object('start','16:00','end','02:00')),
      'thu', jsonb_build_array(jsonb_build_object('start','16:00','end','02:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','16:00','end','04:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','14:00','end','04:00')),
      'sun', jsonb_build_array(jsonb_build_object('start','14:00','end','02:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Jailhouse CPH',
    'Studiestræde 33, 1455 København',
    55.6769,
    12.5716,
    'bar',
    'Leather-inspired bar vibe with a friendly, no-fuss atmosphere—great for a late drink.',
    array['leather','cruise','lgbtq+'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Jailhouse%20CPH%20Studiestr%C3%A6de%2033%201455%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'tue', jsonb_build_array(jsonb_build_object('start','18:00','end','02:00')),
      'wed', jsonb_build_array(jsonb_build_object('start','18:00','end','02:00')),
      'thu', jsonb_build_array(jsonb_build_object('start','18:00','end','03:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','18:00','end','04:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','18:00','end','04:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Never Mind',
    'Axeltorv 6, 1609 København',
    55.6737,
    12.5632,
    'club',
    'High-energy gay nightclub with DJs, dancefloor and late nights near Tivoli.',
    array['dance club','late night','lgbtq+'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Never%20Mind%20Axeltorv%206%201609%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'wed', jsonb_build_array(jsonb_build_object('start','22:00','end','05:00')),
      'thu', jsonb_build_array(jsonb_build_object('start','22:00','end','05:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','22:00','end','06:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','22:00','end','06:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Masken Bar & Café',
    'Studiestræde 33B, 1455 København',
    55.6769,
    12.5717,
    'bar',
    'Relaxed gay-friendly bar & café with drag-friendly energy and a mixed crowd.',
    array['drag','cafe','lgbtq+'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Masken%20Bar%20%26%20Caf%C3%A9%20Studiestr%C3%A6de%2033B%201455%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'mon', jsonb_build_array(jsonb_build_object('start','16:00','end','01:00')),
      'tue', jsonb_build_array(jsonb_build_object('start','16:00','end','01:00')),
      'wed', jsonb_build_array(jsonb_build_object('start','16:00','end','02:00')),
      'thu', jsonb_build_array(jsonb_build_object('start','16:00','end','03:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','16:00','end','04:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','16:00','end','04:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Bar Bitch',
    'Studiestræde 5, 1455 København',
    55.6765,
    12.5712,
    'bar',
    'Playful, upbeat LGBTQ+ bar with good music and an easygoing vibe.',
    array['party','cocktails','lgbtq+'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Bar%20Bitch%20Studiestr%C3%A6de%205%201455%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'thu', jsonb_build_array(jsonb_build_object('start','18:00','end','02:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','18:00','end','04:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','18:00','end','04:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Café Intime',
    'Frederiksberg Allé 25, 1820 Frederiksberg',
    55.6731,
    12.5354,
    'cafe',
    'Intimate piano bar and café with singalongs—cozy and iconic.',
    array['piano bar','singalong','cozy'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Caf%C3%A9%20Intime%20Frederiksberg%20All%C3%A9%2025%201820%20Frederiksberg',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'wed', jsonb_build_array(jsonb_build_object('start','19:00','end','01:00')),
      'thu', jsonb_build_array(jsonb_build_object('start','19:00','end','01:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','19:00','end','02:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','19:00','end','02:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Oscar Bar & Café',
    'Regnbuepladsen 5, 1550 København',
    55.6759,
    12.5688,
    'bar',
    'Friendly bar & café at the Rainbow Square—great for daytime coffee or evening drinks.',
    array['terrace','cocktail bar','lgbtq+'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Oscar%20Bar%20%26%20Caf%C3%A9%20Regnbuepladsen%205%201550%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'mon', jsonb_build_array(jsonb_build_object('start','12:00','end','00:00')),
      'tue', jsonb_build_array(jsonb_build_object('start','12:00','end','00:00')),
      'wed', jsonb_build_array(jsonb_build_object('start','12:00','end','00:00')),
      'thu', jsonb_build_array(jsonb_build_object('start','12:00','end','02:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','12:00','end','03:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','12:00','end','03:00')),
      'sun', jsonb_build_array(jsonb_build_object('start','12:00','end','00:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Copenhagen Eagle',
    'Gothersgade 111, 1123 København',
    55.6834,
    12.5712,
    'bar',
    'Classic gay bar with DJs and a lively crowd—popular late-night stop.',
    array['dance','late night','lgbtq+'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Copenhagen%20Eagle%20Gothersgade%20111%201123%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'thu', jsonb_build_array(jsonb_build_object('start','20:00','end','03:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','20:00','end','05:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','20:00','end','05:00'))
    ),
    true
  ),
  (
    copenhagen_id,
    'Jolene Bar',
    'Flæsketorvet 81-85, 1711 København',
    55.6683,
    12.5524,
    'bar',
    'Queer-friendly late-night bar in Kødbyen—excellent music and dancey nights.',
    array['queer','late night','music'],
    null,
    'https://www.google.com/maps/search/?api=1&query=Jolene%20Bar%20Fl%C3%A6sketorvet%2081%201711%20K%C3%B8benhavn',
    jsonb_build_object(
      'tz','Europe/Copenhagen',
      'thu', jsonb_build_array(jsonb_build_object('start','20:00','end','03:00')),
      'fri', jsonb_build_array(jsonb_build_object('start','20:00','end','05:00')),
      'sat', jsonb_build_array(jsonb_build_object('start','20:00','end','05:00'))
    ),
    true
  );
end $$;

