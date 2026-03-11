/**
 * Seed script: Prague, Berlin, Barcelona, London
 * Run with: npx tsx scripts/seed-cities.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  "https://oxdlypfblekvcsfarghv.supabase.co",
  // Service role key – bypasses RLS
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94ZGx5cGZibGVrdmNzZmFyZ2h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzEzMzE0MiwiZXhwIjoyMDg4NzA5MTQyfQ.tGSt1EmAhDidEeozAQnlZJJh-FOWJ-37e32loonADzc"
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VenueInsert = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  venue_type: "bar" | "club" | "cafe" | "sauna" | "restaurant" | "event_space" | "other";
  description: string;
  tags: string[];
  website_url: string | null;
  google_maps_url: string | null;
  opening_hours: Record<string, unknown>;
  published: boolean;
};

type CityDef = {
  slug: string;
  name: string;
  country: string;
  center_lat: number;
  center_lng: number;
  venues: VenueInsert[];
};

function mapsUrl(query: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function hours(
  tz: string,
  schedule: Partial<Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", [string, string]>>
) {
  const out: Record<string, unknown> = { tz };
  for (const [day, times] of Object.entries(schedule)) {
    if (times) out[day] = [{ start: times[0], end: times[1] }];
  }
  return out;
}

// ---------------------------------------------------------------------------
// BERLIN
// ---------------------------------------------------------------------------
const berlin: CityDef = {
  slug: "berlin",
  name: "Berlin",
  country: "Germany",
  center_lat: 52.5094,
  center_lng: 13.3880,
  venues: [
    {
      name: "Hafen",
      address: "Motzstr. 19, 10777 Berlin",
      lat: 52.4993,
      lng: 13.3527,
      venue_type: "bar",
      description:
        "Hafen is the quintessential Schöneberg local — a warm, reliably packed bar that has been drawing gay Berliners to Motzstraße since 1990. Come for the no-fuss atmosphere, stay for the quiz nights, the friendly regulars, and the feeling that you've found exactly the right room. The music stays on the right side of loud, the staff know how to run a busy bar without the stress, and the crowd is as mixed as Berlin itself. If you're new to the city, this is where you should come first.",
      tags: ["schöneberg", "classic", "quiz nights", "lgbtq+"],
      website_url: "https://hafen-berlin.de/",
      google_maps_url: mapsUrl("Hafen Motzstr. 19 10777 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        mon: ["19:00", "04:00"],
        tue: ["19:00", "04:00"],
        wed: ["19:00", "04:00"],
        thu: ["19:00", "04:00"],
        fri: ["19:00", "04:00"],
        sat: ["19:00", "04:00"],
        sun: ["19:00", "04:00"],
      }),
      published: true,
    },
    {
      name: "Berghain",
      address: "Am Wriezener Bahnhof, 10243 Berlin",
      lat: 52.5113,
      lng: 13.4436,
      venue_type: "club",
      description:
        "Few places are as genuinely legendary as Berghain. Housed in a monumental former power station on the border of Kreuzberg and Friedrichshain, it opens on Friday night and doesn't close until Monday morning. The techno is uncompromising, the main room is cathedral-dark, and the queues are famously selective — come dressed in black and avoid eye contact with the bouncers. Panorama Bar upstairs has panoramic windows and a slightly more accessible sound. The Lab.oratory in the basement hosts leather and fetish nights. If you get in, you'll understand why people talk about it in hushed tones.",
      tags: ["techno", "iconic", "dark", "panorama bar"],
      website_url: "https://berghain.berlin/",
      google_maps_url: mapsUrl("Berghain Am Wriezener Bahnhof 10243 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        fri: ["23:59", "10:00"],
        sat: ["00:00", "23:59"],
        sun: ["00:00", "10:00"],
      }),
      published: true,
    },
    {
      name: "KitKatClub",
      address: "Köpenicker Str. 76, 10179 Berlin",
      lat: 52.5148,
      lng: 13.4078,
      venue_type: "club",
      description:
        "KitKatClub is Berlin's hedonistic alter ego — an institution of queer freedom and sexual liberation that has been going since the 1990s. The dress code is strictly enforced (fetish, fantasy, or nearly nothing) and the result is a crowd that's present, uninhibited, and dancing from late on Friday well into the weekend. The music spans techno to electro depending on the night, and the various rooms give you every option from dancefloor to dark area. Berlin's original and most enduring playground.",
      tags: ["fetish", "techno", "queer", "dress code"],
      website_url: "https://kitkatclub.org/",
      google_maps_url: mapsUrl("KitKatClub Köpenicker Str. 76 10179 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        fri: ["22:00", "10:00"],
        sat: ["22:00", "10:00"],
      }),
      published: true,
    },
    {
      name: "Lab.oratory",
      address: "Am Wriezener Bahnhof, 10243 Berlin",
      lat: 52.5113,
      lng: 13.4440,
      venue_type: "bar",
      description:
        "Lab.oratory lives inside the Berghain complex and opens on its own schedule for leather and fetish nights — some of the rawest queer events in the city. A darkly-lit space with a stripped-back industrial feel, it's a place where the crowd is serious about what it's here for. Fetish gear is the norm rather than the exception, and the nights carry a focused, charged energy that's hard to replicate elsewhere. Not a venue for the uninitiated, but unmistakably Berlin.",
      tags: ["leather", "fetish", "cruising", "dark room"],
      website_url: "https://www.laboratory.de/",
      google_maps_url: mapsUrl("Lab.oratory Am Wriezener Bahnhof 10243 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        fri: ["22:00", "06:00"],
        sat: ["22:00", "06:00"],
      }),
      published: true,
    },
    {
      name: "WOOF Berlin",
      address: "Fuggerstraße 37, 10777 Berlin",
      lat: 52.4993,
      lng: 13.3536,
      venue_type: "bar",
      description:
        "WOOF is Schöneberg's beloved bear bar — a warm, unpretentious hangout that has been welcoming bears, cubs, and the men who love them since 2006. The beer garden is one of the neighbourhood's best-kept secrets in summer, and inside the room is always friendly and unhurried. Drinks are honestly priced and there's usually a jovial crowd no matter what night of the week it is. If you're a bear or just prefer a pub where nobody takes themselves too seriously, WOOF is exactly your spot.",
      tags: ["bears", "beer garden", "schöneberg", "lgbtq+"],
      website_url: "https://www.woofberlin.com/",
      google_maps_url: mapsUrl("WOOF Berlin Fuggerstraße 37 10777 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        mon: ["20:00", "03:00"],
        tue: ["20:00", "03:00"],
        wed: ["20:00", "03:00"],
        thu: ["20:00", "03:00"],
        fri: ["20:00", "04:00"],
        sat: ["20:00", "04:00"],
        sun: ["20:00", "03:00"],
      }),
      published: true,
    },
    {
      name: "Prinzknecht",
      address: "Fuggerstraße 33, 10777 Berlin",
      lat: 52.4992,
      lng: 13.3532,
      venue_type: "bar",
      description:
        "Prinzknecht is the classic Nollendorfkiez men's pub — a solid, unpretentious bar on Fuggerstraße that has been a reliable part of the Schöneberg gay village for years. High tables, cold draughts, DJs on busy nights, and a crowd that ranges from fresh off the plane to long-established regulars. It's not flashy, it's not trying to be, and that's precisely the point. The kind of place you come back to every time you're in Berlin.",
      tags: ["bears", "pub", "schöneberg", "men only"],
      website_url: "https://www.prinzknecht.de/",
      google_maps_url: mapsUrl("Prinzknecht Fuggerstraße 33 10777 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        mon: ["20:00", "02:00"],
        tue: ["20:00", "02:00"],
        wed: ["20:00", "02:00"],
        thu: ["20:00", "02:00"],
        fri: ["20:00", "03:00"],
        sat: ["20:00", "03:00"],
        sun: ["20:00", "02:00"],
      }),
      published: true,
    },
    {
      name: "Der Boiler",
      address: "Mehringdamm 34, 10961 Berlin",
      lat: 52.4887,
      lng: 13.3887,
      venue_type: "sauna",
      description:
        "Der Boiler is Berlin's flagship gay sauna — a sprawling 1,500m² space across three floors on Mehringdamm in Kreuzberg. The facilities are genuinely first-rate: Finnish sauna, steam room, whirlpool, multiple dark areas, private cabins, massage rooms, and a clean, well-maintained changing area. The crowd is mixed in age and type, and the relaxed atmosphere means it works as well for a solo afternoon as it does for a charged Saturday night. By Berlin standards, this is as good as it gets.",
      tags: ["sauna", "steam room", "kreuzberg", "cruising"],
      website_url: "https://www.boiler.de/",
      google_maps_url: mapsUrl("Der Boiler Mehringdamm 34 10961 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        mon: ["12:00", "23:00"],
        tue: ["12:00", "23:00"],
        wed: ["12:00", "23:00"],
        thu: ["12:00", "23:00"],
        fri: ["12:00", "23:59"],
        sat: ["12:00", "23:59"],
        sun: ["12:00", "23:00"],
      }),
      published: true,
    },
    {
      name: "Café Neues Ufer",
      address: "Hauptstraße 157, 10827 Berlin",
      lat: 52.4851,
      lng: 13.3582,
      venue_type: "cafe",
      description:
        "Café Neues Ufer is one of Berlin's most historically layered gay cafés — a relaxed Hauptstraße institution that was a regular haunt of David Bowie and Iggy Pop during their Berlin years in the late 1970s. Today it's a welcoming all-day café with a loyal gay crowd, good coffee, and the kind of easy, unhurried atmosphere that's increasingly rare. Come early for coffee, come late for a nightcap before the bars — it works at every hour and at every stage of the evening.",
      tags: ["historic", "daytime", "coffee", "schöneberg"],
      website_url: null,
      google_maps_url: mapsUrl("Café Neues Ufer Hauptstraße 157 10827 Berlin"),
      opening_hours: hours("Europe/Berlin", {
        mon: ["10:00", "00:00"],
        tue: ["10:00", "00:00"],
        wed: ["10:00", "00:00"],
        thu: ["10:00", "00:00"],
        fri: ["10:00", "01:00"],
        sat: ["10:00", "01:00"],
        sun: ["10:00", "00:00"],
      }),
      published: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// LONDON
// ---------------------------------------------------------------------------
const london: CityDef = {
  slug: "london",
  name: "London",
  country: "United Kingdom",
  center_lat: 51.5074,
  center_lng: -0.1278,
  venues: [
    {
      name: "Comptons of Soho",
      address: "51-53 Old Compton Street, London W1D 4UD",
      lat: 51.5130,
      lng: -0.1318,
      venue_type: "bar",
      description:
        "Comptons has been at the heart of Old Compton Street — London's most storied gay thoroughfare — since 1986. It's a two-floor pub with a proper draught-beer culture and a crowd that spans generations and types, which gives it an easy, inclusive energy you can't manufacture. Weekend nights get packed and loud; weekday afternoons are ideal for a quieter pint. Whether you're a Soho regular or visiting for the first time, Comptons is a genuine pillar of the London scene.",
      tags: ["classic", "soho", "pub", "lgbtq+"],
      website_url: "https://www.comptonsofsoho.co.uk/",
      google_maps_url: mapsUrl("Comptons of Soho 51 Old Compton Street London W1D 4UD"),
      opening_hours: hours("Europe/London", {
        mon: ["12:00", "23:30"],
        tue: ["12:00", "23:30"],
        wed: ["12:00", "23:30"],
        thu: ["12:00", "23:30"],
        fri: ["12:00", "00:00"],
        sat: ["11:00", "00:00"],
        sun: ["12:00", "22:30"],
      }),
      published: true,
    },
    {
      name: "Admiral Duncan",
      address: "54 Old Compton Street, London W1D 4UD",
      lat: 52.5129,
      lng: -0.1319,
      venue_type: "bar",
      description:
        "The Admiral Duncan carries one of the heaviest legacies in London's queer history — it was the target of a nail bomb attack in 1999 and has since become a symbol of resilience, community, and defiance. Today it's a warm, lively pub on Old Compton Street with resident drag queens, regular cabaret nights, and a crowd that knows it's somewhere that matters. The music is fun, the welcome is genuine, and every drink here carries a quiet sense of solidarity.",
      tags: ["iconic", "drag", "cabaret", "soho"],
      website_url: "https://www.admiral-duncan.co.uk/",
      google_maps_url: mapsUrl("Admiral Duncan 54 Old Compton Street London W1D 4UD"),
      opening_hours: hours("Europe/London", {
        mon: ["13:00", "23:30"],
        tue: ["13:00", "23:30"],
        wed: ["13:00", "23:30"],
        thu: ["13:00", "23:30"],
        fri: ["12:00", "00:00"],
        sat: ["12:00", "00:00"],
        sun: ["12:00", "22:30"],
      }),
      published: true,
    },
    {
      name: "Ku Bar",
      address: "30 Lisle Street, London WC2H 7BA",
      lat: 51.5104,
      lng: -0.1283,
      venue_type: "bar",
      description:
        "Ku Bar is one of London's largest and most reliably packed LGBTQ+ bars, spread across three floors just off Leicester Square on Lisle Street. The ground floor is a spacious bar with a friendly mixed crowd, while the basement Klub goes late with DJs and a proper dancefloor. It works at any time — afternoon drinks or late-night dancing — and the central location makes it a natural gathering point. Unpretentious, good-natured, and always busy.",
      tags: ["central london", "dancefloor", "three floors", "lgbtq+"],
      website_url: "https://ku-bar.co.uk/",
      google_maps_url: mapsUrl("Ku Bar 30 Lisle Street London WC2H 7BA"),
      opening_hours: hours("Europe/London", {
        mon: ["12:00", "03:00"],
        tue: ["12:00", "03:00"],
        wed: ["12:00", "03:00"],
        thu: ["12:00", "03:00"],
        fri: ["12:00", "03:00"],
        sat: ["12:00", "03:00"],
        sun: ["12:00", "22:30"],
      }),
      published: true,
    },
    {
      name: "Freedom Bar",
      address: "66 Wardour Street, London W1F 0TA",
      lat: 51.5129,
      lng: -0.1347,
      venue_type: "bar",
      description:
        "Freedom is one of Soho's sleekest gay bars — a two-floor venue on Wardour Street with contemporary design: wooden floors, living walls, and illuminated artwork. The soundtrack tilts toward pop and R&B rather than techno, and the basement club stays open until 3am most nights. The crowd skews younger and stylish; the atmosphere is more lounge than local pub. If you want a polished night in the middle of Soho with a proper dancefloor later on, Freedom is the reliable option.",
      tags: ["soho", "design", "dancefloor", "late night"],
      website_url: "https://freedombarsoho.com/",
      google_maps_url: mapsUrl("Freedom Bar 66 Wardour Street London W1F 0TA"),
      opening_hours: hours("Europe/London", {
        mon: ["16:00", "03:00"],
        tue: ["16:00", "03:00"],
        wed: ["16:00", "03:00"],
        thu: ["16:00", "03:00"],
        fri: ["14:00", "03:00"],
        sat: ["14:00", "03:00"],
        sun: ["14:00", "22:30"],
      }),
      published: true,
    },
    {
      name: "Royal Vauxhall Tavern",
      address: "372 Kennington Lane, London SE11 5HY",
      lat: 51.4842,
      lng: -0.1224,
      venue_type: "bar",
      description:
        "The Royal Vauxhall Tavern is the most culturally significant LGBTQ+ venue in London — a Grade II-listed building that became the first in the country to be listed in recognition of its importance to queer history. The RVT has been a home for cabaret, drag, and queer performance since the 1950s and continues to host some of the city's most creative and irreverent nights. The room is intimate and buzzing, the performances are world-class, and the legendary Saturday nights are unlike anything else in the capital. Come to be surprised.",
      tags: ["historic", "cabaret", "drag", "vauxhall"],
      website_url: "https://www.vauxhalltavern.com/",
      google_maps_url: mapsUrl("Royal Vauxhall Tavern 372 Kennington Lane London SE11 5HY"),
      opening_hours: hours("Europe/London", {
        tue: ["19:00", "23:00"],
        wed: ["19:00", "23:00"],
        thu: ["19:00", "23:00"],
        fri: ["18:00", "02:00"],
        sat: ["16:00", "02:00"],
        sun: ["16:00", "23:00"],
      }),
      published: true,
    },
    {
      name: "Eagle London",
      address: "349 Kennington Lane, London SE11 5QY",
      lat: 51.4843,
      lng: -0.1222,
      venue_type: "bar",
      description:
        "Eagle London is the definitive South London gay bar — a large, stylish venue under a railway arch in Vauxhall with a horseshoe bar, dancefloor, and a garden that fills up on summer evenings. The crowd is a broad mix of gay men, fetish-friendly regulars, and neighbourhood locals. Saturday afternoons bring the cult Duckie alternative cabaret, while Sunday's Horse Meat Disco is one of the best parties in London — five hours of deep funk, disco, and soul on vinyl. Unmissable if you're in the city on a Sunday.",
      tags: ["vauxhall", "horse meat disco", "garden", "fetish friendly"],
      website_url: "https://www.eaglelondon.com/",
      google_maps_url: mapsUrl("Eagle London 349 Kennington Lane London SE11 5QY"),
      opening_hours: hours("Europe/London", {
        thu: ["21:00", "02:00"],
        fri: ["21:00", "03:00"],
        sat: ["15:00", "03:00"],
        sun: ["15:00", "00:00"],
      }),
      published: true,
    },
    {
      name: "Fire",
      address: "39 Parry Street, London SW8 1RT",
      lat: 51.4840,
      lng: -0.1217,
      venue_type: "club",
      description:
        "Fire is the beating heart of London's Vauxhall club scene — an industrial-scale nightclub set beneath multiple railway arches on Parry Street, with four rooms, a yard, and one of the best sound systems in the city. The weekend nights are large-capacity affairs with internationally-booked DJs and a crowd that expects serious dancing. The energy peaks between 3am and 7am. If you're in London and want a proper big night out in a gay-friendly space with no compromises on sound quality, this is where you end up.",
      tags: ["vauxhall", "techno", "four rooms", "late night"],
      website_url: "https://www.firelondon.net/",
      google_maps_url: mapsUrl("Fire Nightclub 39 Parry Street London SW8 1RT"),
      opening_hours: hours("Europe/London", {
        fri: ["22:00", "09:00"],
        sat: ["22:00", "09:00"],
      }),
      published: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// BARCELONA
// ---------------------------------------------------------------------------
const barcelona: CityDef = {
  slug: "barcelona",
  name: "Barcelona",
  country: "Spain",
  center_lat: 41.3851,
  center_lng: 2.1734,
  venues: [
    {
      name: "La Sastrería",
      address: "Carrer del Consell de Cent 245 bis, 08011 Barcelona",
      lat: 41.3847,
      lng: 2.1556,
      venue_type: "bar",
      description:
        "La Sastrería is one of the most enjoyable gay bars in the Gaixample — a lively, performance-forward space on Consell de Cent that packs in drag shows, a small dancefloor, and a reliably enthusiastic crowd. The interior is theatrical and colourful, the shows usually start late and run with real energy, and the cocktails are good enough to keep you there between acts. It's at its best when you've already had a couple of drinks elsewhere and want something with more electricity.",
      tags: ["drag shows", "dancefloor", "gaixample", "cocktails"],
      website_url: "https://www.lasastreriabcn.com/",
      google_maps_url: mapsUrl("La Sastrería Carrer del Consell de Cent 245 Barcelona"),
      opening_hours: hours("Europe/Madrid", {
        mon: ["19:00", "02:00"],
        tue: ["19:00", "02:00"],
        wed: ["19:00", "02:30"],
        thu: ["19:00", "02:30"],
        fri: ["19:00", "03:00"],
        sat: ["19:00", "03:00"],
        sun: ["19:00", "02:00"],
      }),
      published: true,
    },
    {
      name: "Sky Bar",
      address: "Carrer d'Aribau 33, 08011 Barcelona",
      lat: 41.3855,
      lng: 2.1574,
      venue_type: "bar",
      description:
        "Sky Bar sits on the rooftop of the Axel Hotel — Barcelona's most famous gay hotel — and is one of the best places in the Eixample for an evening drink with a view. The terrace overlooks the rooftops of the city; the indoor bar is sophisticated and more intimate. The crowd is a mix of hotel guests and in-the-know locals; the music stays at cocktail-bar volume. It's refined, relaxed, and entirely worth going to even if you're not staying at the hotel. Come at golden hour and stay for the night.",
      tags: ["rooftop", "cocktails", "gaixample", "views"],
      website_url: "https://www.axelhotels.com/en/axel-hotel-barcelona/",
      google_maps_url: mapsUrl("Sky Bar Axel Hotel Carrer d'Aribau 33 Barcelona"),
      opening_hours: hours("Europe/Madrid", {
        mon: ["19:30", "03:00"],
        tue: ["19:30", "03:00"],
        wed: ["19:30", "03:00"],
        thu: ["19:30", "03:00"],
        fri: ["19:30", "03:00"],
        sat: ["19:30", "03:00"],
        sun: ["19:30", "03:00"],
      }),
      published: true,
    },
    {
      name: "Plata Bar",
      address: "Carrer del Consell de Cent 233, 08011 Barcelona",
      lat: 41.3847,
      lng: 2.1553,
      venue_type: "bar",
      description:
        "Plata is a well-loved cocktail bar on Consell de Cent — a sleek, colourful space with a friendly staff and a cocktail list that actually deserves your attention. The crowd is relaxed and mixed; the music sits nicely between bar and pre-club. It's a good-looking room that doesn't take itself too seriously, and the drinks are well-made at a fair price for the neighbourhood. One of the more satisfying bars in the Gaixample for a proper cocktail before the night moves on.",
      tags: ["cocktails", "gaixample", "pre-club", "lgbtq+"],
      website_url: null,
      google_maps_url: mapsUrl("Plata Bar Carrer del Consell de Cent 233 Barcelona"),
      opening_hours: hours("Europe/Madrid", {
        mon: ["18:00", "02:30"],
        tue: ["18:00", "02:30"],
        wed: ["18:00", "02:30"],
        thu: ["18:00", "03:00"],
        fri: ["18:00", "03:00"],
        sat: ["18:00", "03:00"],
        sun: ["18:00", "02:30"],
      }),
      published: true,
    },
    {
      name: "Boys Bar BCN",
      address: "Carrer de la Diputació 174, 08011 Barcelona",
      lat: 41.3849,
      lng: 2.1582,
      venue_type: "bar",
      description:
        "Boys Bar BCN is a high-energy bar on Carrer de la Diputació in the heart of the Gaixample — a modern venue with a long bar, go-go dancers most nights, and a crowd that comes to dance from fairly early in the evening. The music is mainstream pop and commercial dance, the lighting is right, and the atmosphere builds well across the night. It's the kind of Gaixample bar that's genuinely fun rather than just serviceable — a good place to start a night or sustain it well into the small hours.",
      tags: ["go-go dancers", "gaixample", "pop music", "lgbtq+"],
      website_url: null,
      google_maps_url: mapsUrl("Boys Bar BCN Carrer de la Diputació 174 Barcelona"),
      opening_hours: hours("Europe/Madrid", {
        tue: ["18:00", "02:30"],
        wed: ["18:00", "02:30"],
        thu: ["18:00", "03:00"],
        fri: ["18:00", "03:30"],
        sat: ["18:00", "03:30"],
        sun: ["18:00", "02:30"],
      }),
      published: true,
    },
    {
      name: "Arena Classic",
      address: "Carrer de la Diputació 233, 08007 Barcelona",
      lat: 41.3849,
      lng: 2.1614,
      venue_type: "club",
      description:
        "Arena Classic is the anchor of Barcelona's Gaixample club scene — the most established of the Arena group's venues and the one that has reliably filled its dancefloor with commercial pop and dance classics for years. It opens late (2:30am) and closes at first light, which means it's where you end up when everywhere else has run out. The music is accessible and fun, the crowd is a solid mix of locals and visitors, and the energy is reliably high. For sheer dancefloor longevity in Barcelona, this is the standard.",
      tags: ["late night", "gaixample", "commercial pop", "dancefloor"],
      website_url: "https://grupoarena.com/",
      google_maps_url: mapsUrl("Arena Classic Carrer de la Diputació 233 Barcelona"),
      opening_hours: hours("Europe/Madrid", {
        fri: ["02:30", "06:00"],
        sat: ["02:30", "06:00"],
      }),
      published: true,
    },
    {
      name: "Sala Diana",
      address: "Carrer de la Diputació 233, 08007 Barcelona",
      lat: 41.3850,
      lng: 2.1617,
      venue_type: "club",
      description:
        "Sala Diana — part of the Arena group — is Barcelona's most established lesbian and queer nightclub, running across most nights of the week. The crowd is broadly queer and welcoming of everyone across the LGBTQ+ spectrum, with the music leaning toward commercial dance and pop. Many nights feature themed events and parties. If you want to dance somewhere that feels genuinely inclusive and consistently well-attended, Sala Diana is the reliable anchor of queer nightlife in the Gaixample.",
      tags: ["lesbian", "queer", "dancefloor", "gaixample"],
      website_url: "https://grupoarena.com/",
      google_maps_url: mapsUrl("Sala Diana Aire Carrer de la Diputació 233 Barcelona"),
      opening_hours: hours("Europe/Madrid", {
        wed: ["23:00", "03:00"],
        thu: ["23:00", "03:00"],
        fri: ["23:00", "03:30"],
        sat: ["23:00", "03:30"],
        sun: ["23:00", "03:00"],
      }),
      published: true,
    },
    {
      name: "Bunker Club",
      address: "Carrer del Consell de Cent 288, 08007 Barcelona",
      lat: 41.3848,
      lng: 2.1620,
      venue_type: "club",
      description:
        "Bunker Club is one of the Gaixample's more intense late-night options — a darkly-lit underground venue on Consell de Cent with a strong cruising culture and a crowd that knows what it's looking for. Dark rooms, a compact dancefloor, and a charged atmosphere make it one of the more distinctive spaces in the neighbourhood. It's not for a casual night out, but if you're specifically looking for a gay men's club with that edge, Bunker delivers reliably and without pretension.",
      tags: ["cruising", "dark room", "gaixample", "late night"],
      website_url: null,
      google_maps_url: mapsUrl("Bunker Club Carrer del Consell de Cent 288 Barcelona"),
      opening_hours: hours("Europe/Madrid", {
        thu: ["22:00", "04:00"],
        fri: ["22:00", "05:00"],
        sat: ["22:00", "05:00"],
        sun: ["22:00", "04:00"],
      }),
      published: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// PRAGUE
// ---------------------------------------------------------------------------
const prague: CityDef = {
  slug: "prague",
  name: "Prague",
  country: "Czech Republic",
  center_lat: 50.0755,
  center_lng: 14.4378,
  venues: [
    {
      name: "Club Termix",
      address: "Třebízského 4a, 120 00 Praha 2",
      lat: 50.0760,
      lng: 14.4536,
      venue_type: "club",
      description:
        "Club Termix is the beating heart of Prague's gay nightlife — a stylish underground club in the heart of Vinohrady with an intimate dancefloor, a dark room, karaoke, and a chill-out area upstairs. The crowd is largely local, young, and here to have a genuinely good time. Thursdays bring karaoke nights; weekends get properly packed from around midnight. It's not the biggest club you'll ever visit, but the intimacy works strongly in its favour — when it's full, the energy is electric and the atmosphere hard to beat.",
      tags: ["vinohrady", "dancefloor", "dark room", "karaoke"],
      website_url: "https://club-termix.cz/",
      google_maps_url: mapsUrl("Club Termix Třebízského 4a Praha 2"),
      opening_hours: hours("Europe/Prague", {
        thu: ["21:00", "04:00"],
        fri: ["21:00", "05:00"],
        sat: ["21:00", "05:00"],
      }),
      published: true,
    },
    {
      name: "Saints Bar",
      address: "Polská 32, 120 00 Praha 2",
      lat: 50.0764,
      lng: 14.4537,
      venue_type: "bar",
      description:
        "Saints is the essential English-friendly bar in Prague's Vinohrady gay quarter — a compact, warmly-lit space on Polská with an international staff who know the city's scene inside out. The clientele is a warm mix of expats, tourists, and Czech locals; there's a monthly trivia night, regular parties, and a shelf of gay magazines if you just want to sit quietly. An ideal first stop if you're new to Prague, or the kind of reliable local bar you quickly come to depend on.",
      tags: ["vinohrady", "expat friendly", "trivia nights", "lgbtq+"],
      website_url: "https://www.praguesaints.cz/",
      google_maps_url: mapsUrl("Saints Bar Polská 32 Praha 2"),
      opening_hours: hours("Europe/Prague", {
        mon: ["19:00", "02:00"],
        tue: ["19:00", "02:00"],
        wed: ["19:00", "02:00"],
        thu: ["19:00", "02:00"],
        fri: ["19:00", "04:00"],
        sat: ["19:00", "04:00"],
        sun: ["19:00", "02:00"],
      }),
      published: true,
    },
    {
      name: "Piano Bar",
      address: "Milešovská 10, 130 00 Praha 3",
      lat: 50.0755,
      lng: 14.4535,
      venue_type: "bar",
      description:
        "Piano Bar is one of Prague's oldest and most characterful gay establishments — a British-owned pub on Milešovská that has been a fixture of the Vinohrady scene since 1996. The interior is traditional pub rather than club, the music is a comfortable mix of pop and Czech hits, and the crowd is largely local and loyal. It opens early enough to be an afternoon-friendly option and runs late enough to finish a night there. Unpretentious, honest, and a little bit timeless — the kind of bar that's exactly what it says it is.",
      tags: ["vinohrady", "classic", "pub", "lgbtq+"],
      website_url: null,
      google_maps_url: mapsUrl("Piano Bar Milešovská 10 Praha 3"),
      opening_hours: hours("Europe/Prague", {
        mon: ["17:00", "02:00"],
        tue: ["17:00", "02:00"],
        wed: ["17:00", "02:00"],
        thu: ["17:00", "02:00"],
        fri: ["17:00", "03:00"],
        sat: ["17:00", "03:00"],
        sun: ["17:00", "02:00"],
      }),
      published: true,
    },
    {
      name: "Celebrity Café",
      address: "Vinohradská 40, 120 00 Praha 2",
      lat: 50.0770,
      lng: 14.4499,
      venue_type: "cafe",
      description:
        "Celebrity Café on Vinohradská is an all-day gay café that anchors the daytime social life of the Vinohrady neighbourhood. Cheap beer, solid coffee, and a crowd that covers the full spectrum from morning regulars to evening pre-drinkers. The staff are friendly, the terrace is worth using when the weather allows, and the pricing is more Central European than tourist-facing. A completely unpretentious gay space that treats being gay as the most normal thing in the world — which of course it is.",
      tags: ["vinohrady", "daytime", "coffee", "terrace"],
      website_url: null,
      google_maps_url: mapsUrl("Celebrity Café Vinohradská 40 Praha 2"),
      opening_hours: hours("Europe/Prague", {
        mon: ["08:00", "23:00"],
        tue: ["08:00", "23:00"],
        wed: ["08:00", "23:00"],
        thu: ["08:00", "23:00"],
        fri: ["08:00", "01:00"],
        sat: ["10:00", "01:00"],
        sun: ["10:00", "23:00"],
      }),
      published: true,
    },
    {
      name: "Drake's Club",
      address: "Zborovská 50, 150 00 Praha 5",
      lat: 50.0750,
      lng: 14.4107,
      venue_type: "bar",
      description:
        "Drake's Club is Prague's long-running gay cruising bar — a venue in Smíchov open around the clock, seven days a week. The club features a large dungeon area with a maze and darkroom that fills up on weekends with themed parties and strip shows. It's not a subtle venue, but it's competently run with a long-established clientele. If you're specifically looking for a cruising-oriented space in Prague, Drake's is the standard reference point.",
      tags: ["cruising", "dark room", "24 hours", "smíchov"],
      website_url: null,
      google_maps_url: mapsUrl("Drake's Club Zborovská 50 Praha 5"),
      opening_hours: hours("Europe/Prague", {
        mon: ["00:00", "23:59"],
        tue: ["00:00", "23:59"],
        wed: ["00:00", "23:59"],
        thu: ["00:00", "23:59"],
        fri: ["00:00", "23:59"],
        sat: ["00:00", "23:59"],
        sun: ["00:00", "23:59"],
      }),
      published: true,
    },
    {
      name: "Klub 21",
      address: "Rimská 21, 120 00 Praha 2",
      lat: 50.0762,
      lng: 14.4548,
      venue_type: "bar",
      description:
        "Klub 21 is a compact, no-fuss gay bar on Rimská in Vinohrady — the kind of small local venue that fills its single room with regulars and does exactly what it promises without any pretension. Drinks are priced for a neighbourhood crowd, the music is background rather than dancefloor, and the atmosphere is easy and unhurried. It works best late in the evening when the area is out and in relaxed mood. A good unpretentious spot to find yourself after dinner and before Termix.",
      tags: ["vinohrady", "local", "laid back", "lgbtq+"],
      website_url: null,
      google_maps_url: mapsUrl("Klub 21 Rimská Praha 2"),
      opening_hours: hours("Europe/Prague", {
        mon: ["18:00", "00:00"],
        tue: ["18:00", "00:00"],
        wed: ["18:00", "00:00"],
        thu: ["18:00", "00:00"],
        fri: ["18:00", "02:00"],
        sat: ["18:00", "02:00"],
        sun: ["18:00", "00:00"],
      }),
      published: true,
    },
  ],
};

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

async function seedCity(city: CityDef) {
  console.log(`\n→ Seeding ${city.name}...`);

  // Upsert city
  const { data: cityData, error: cityError } = await supabase
    .from("cities")
    .upsert(
      {
        slug: city.slug,
        name: city.name,
        country: city.country,
        center_lat: city.center_lat,
        center_lng: city.center_lng,
        published: true,
      },
      { onConflict: "slug" }
    )
    .select("id")
    .single();

  if (cityError) {
    console.error(`  ✗ City upsert failed:`, cityError.message);
    return;
  }

  const cityId = cityData.id;
  console.log(`  ✓ City: ${city.name} (${cityId})`);

  // Delete existing venues for this city (by name) so we can re-run cleanly
  const venueNames = city.venues.map((v) => v.name);
  await supabase
    .from("venues")
    .delete()
    .eq("city_id", cityId)
    .in("name", venueNames);

  // Insert venues
  const venuesWithCity = city.venues.map((v) => ({ ...v, city_id: cityId }));
  const { error: venuesError, data: venuesData } = await supabase
    .from("venues")
    .insert(venuesWithCity)
    .select("id, name");

  if (venuesError) {
    console.error(`  ✗ Venues insert failed:`, venuesError.message);
    return;
  }

  for (const v of venuesData ?? []) {
    console.log(`    + ${v.name}`);
  }
  console.log(`  ✓ ${venuesData?.length ?? 0} venues inserted`);
}

async function main() {
  console.log("Gay Places — City Seed Script");
  console.log("================================");

  for (const city of [berlin, london, barcelona, prague]) {
    await seedCity(city);
  }

  console.log("\n✅ Done!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
