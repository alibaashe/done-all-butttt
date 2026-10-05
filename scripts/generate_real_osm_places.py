import json
import re
import os

with open('osm_hargeisa_places.json', 'r', encoding='utf-8') as f:
    osm_places = json.load(f)

print(f"Loaded {len(osm_places)} raw places from osm_hargeisa_places.json")

CATEGORY_META = {
    'Hotels & Hospitality': {
        'somali': 'Huteellada & Martida',
        'icon': 'Hotel',
        'general': 'Hotel'
    },
    'Universities & Education': {
        'somali': 'Jaamacadaha & Dugsiyada',
        'icon': 'GraduationCap',
        'general': 'Education'
    },
    'Transit & Services': {
        'somali': 'Istaannada & Kaalmaha Shidaalka',
        'icon': 'Navigation',
        'general': 'Transport'
    },
    'Hospitals & Healthcare': {
        'somali': 'Cusbitaallada & Caafimaadka',
        'icon': 'HeartPulse',
        'general': 'Hospital'
    },
    'Restaurants & Dining': {
        'somali': 'Maqaayadaha & Cuntada',
        'icon': 'UtensilsCrossed',
        'general': 'Dining'
    },
    'Government & Embassies': {
        'somali': "Hay'adaha Dowladda & Safaaradaha",
        'icon': 'Landmark',
        'general': 'Government'
    },
    'Markets, Malls & Supermarkets': {
        'somali': 'Suuqyada & Xarumaha Ganacsiga',
        'icon': 'ShoppingBag',
        'general': 'Market'
    },
    'Corporate & Banking': {
        'somali': 'Bangiyada & Shirkadaha',
        'icon': 'Building2',
        'general': 'Corporate'
    },
    'Mosques & Landmarks': {
        'somali': 'Masaajidda & Taallooyinka',
        'icon': 'Moon',
        'general': 'Mosque'
    }
}

seen_ids = set()
all_places = []

# Key essential anchors requested by user and core workflows
ANCHORS = [
    {
        'id': 'ina_naxar_street',
        'osm_id': 990001,
        'name': 'Ina Naxar street',
        'address': 'Ina Naxar Street, Road 1 & Road 2 Corridor, 26 June District, Hargeisa',
        'lat': 9.5605,
        'lng': 44.0750,
        'category': 'Transit & Services',
        'subCategory': 'arterial_road',
        'district': '26 June District',
        'popular': True,
        'iconName': 'Navigation',
        'generalCategory': 'Transport',
        'somaliCategory': 'Istaannada & Waddooyinka',
        'searchTerms': ['ina', 'naxar', 'street', 'ina naxar', 'ina naxar street', 'jidka ina naxar', 'road 1', 'road 2', '26 june', 'guriga', 'home']
    },
    {
        'id': 'berbera_bus_terminal',
        'osm_id': 990002,
        'name': 'Berbera Bus Terminal (Istaanka Berbera)',
        'address': 'East Highway, 26 June District, Hargeisa, Somaliland',
        'lat': 9.5680,
        'lng': 44.0850,
        'category': 'Transit & Services',
        'subCategory': 'bus_station',
        'district': '26 June District',
        'popular': True,
        'iconName': 'Navigation',
        'generalCategory': 'Transport',
        'somaliCategory': 'Istaannada & Kaalmaha Shidaalka',
        'searchTerms': ['berbera', 'bus', 'terminal', 'istaanka', 'istaanka berbera', 'east highway']
    },
    {
        'id': 'hga_airport',
        'osm_id': 990003,
        'name': 'Egal International Airport (Garoonka Cigaal)',
        'address': 'Airport Road (Wadada Garoonka), South Hargeisa, Somaliland',
        'lat': 9.5181,
        'lng': 44.0888,
        'category': 'Transit & Services',
        'subCategory': 'aerodrome',
        'district': 'Airport Road',
        'popular': True,
        'iconName': 'Navigation',
        'generalCategory': 'Transport',
        'somaliCategory': 'Istaannada & Garoomada',
        'searchTerms': ['airport', 'egal', 'garoonka', 'diyaaradaha', 'garoonka diyaaradaha', 'cigaal', 'hga']
    }
]

for a in ANCHORS:
    seen_ids.add(a['id'])
    all_places.append(a)

# Add all 372 real OpenStreetMap places
for p in osm_places:
    raw_id = p['osm_id']
    base_id = f'osm_{raw_id}'
    place_id = base_id
    if place_id in seen_ids:
        dist_suffix = re.sub(r'[^a-zA-Z0-9]', '', p.get('district', 'alt')).lower()
        place_id = f'{base_id}_{dist_suffix}'
    seen_ids.add(place_id)

    name = p['name']
    cat = p['category']
    specific = p.get('specific_type', '')
    district = p.get('district', 'Hargeisa')
    lat = round(float(p['lat']), 5)
    lng = round(float(p['lng']), 5)

    meta = CATEGORY_META.get(cat, {
        'somali': cat,
        'icon': 'MapPin',
        'general': 'Place'
    })

    clean_name = re.sub(r'[^a-zA-Z0-9\s]', ' ', name.lower())
    words = [w for w in clean_name.split() if len(w) >= 2]
    terms = list(dict.fromkeys(words + [w.lower() for w in district.split() if len(w) >= 3] + ([specific.lower()] if specific else [])))

    if raw_id == 1138799309 or 'imperial' in name.lower():
        terms.extend(['imperial', 'imperial hotel', 'wda_imperial_hotel_sha_ab', 'shaab', 'sha ab'])

    popular = any(kw in name.lower() for kw in [
        'ambassador', 'imperial', 'maansoor', 'maan soor', 'oriental', 'war memorial', 
        'museum', 'bus station', 'downtown', 'cajab', 'total', 'telesom', 'dahabshiil', 
        'somtel', 'university', 'hospital', 'edna', 'siraaj', 'durdur'
    ])

    addr_district = district if district and district != 'Hargeisa' else 'Central'
    address = f"{name}, {addr_district}, Hargeisa, Somaliland"

    all_places.append({
        'id': place_id,
        'osm_id': raw_id,
        'name': name,
        'address': address,
        'lat': lat,
        'lng': lng,
        'category': cat,
        'subCategory': specific,
        'district': district,
        'popular': popular,
        'iconName': meta['icon'],
        'generalCategory': meta['general'],
        'somaliCategory': meta['somali'],
        'searchTerms': terms
    })

# Add distinct Hargeisa districts for LocationGateScreen and district selection
DISTRICT_HUBS = [
    {'name': 'Jigjiga Yar (Ibrahim Koodbuur)', 'lat': 9.5720, 'lng': 44.0750, 'address': 'Jigjiga Yar Corridor, Road 1, Hargeisa'},
    {'name': '26 June District (Degmada 26 Juun)', 'lat': 9.5630, 'lng': 44.0730, 'address': '26 June District, Road 1 & Road 2, Hargeisa'},
    {'name': 'Shacabka / Sha\'ab District', 'lat': 9.5590, 'lng': 44.0530, 'address': 'Sha\'ab Area, Government Center, Hargeisa'},
    {'name': 'Ahmed Dhagax (Axmed Dhagax)', 'lat': 9.5480, 'lng': 44.0620, 'address': 'Ahmed Dhagax District, South Hargeisa'},
    {'name': 'Maxamed Cali / Makamed Cali', 'lat': 9.5520, 'lng': 44.0678, 'address': 'Makamed Cali Area, Hargeisa'},
    {'name': 'Gacan Libaax (Goljano Area)', 'lat': 9.5660, 'lng': 44.0880, 'address': 'Gacan Libaax District, East Hargeisa'},
    {'name': '31 May District (31 May)', 'lat': 9.5550, 'lng': 44.0450, 'address': '31 May District, West Hargeisa'},
    {'name': 'Lixle District (Xaafadda Lixle)', 'lat': 9.5620, 'lng': 44.0635, 'address': 'Lixle District, Road Number 1, Hargeisa'},
    {'name': 'Texas District (Xaafadda Texas)', 'lat': 9.5615, 'lng': 44.0960, 'address': 'Texas Commercial Area, Hargeisa'},
    {'name': 'Airport Road Corridor (Wadada Garoonka)', 'lat': 9.5350, 'lng': 44.0760, 'address': 'Airport Road Highway, South Hargeisa'},
    {'name': '150 Ring Road (Wadada 150-ka)', 'lat': 9.5800, 'lng': 44.0550, 'address': '150 Ring Road Expressway, North Hargeisa'},
    {'name': 'Sheekh Madar District', 'lat': 9.5607, 'lng': 44.0650, 'address': 'Sheekh Madar Commercial District, Hargeisa'},
    {'name': 'Jameeco Weyn District', 'lat': 9.5650, 'lng': 44.0700, 'address': 'Jameeco Weyn District, Hargeisa'},
    {'name': 'Guul Ala District', 'lat': 9.5580, 'lng': 44.0640, 'address': 'Guul Ala District, Central Hargeisa'},
    {'name': 'Birjeex / Badhka Junction', 'lat': 9.5414, 'lng': 44.0872, 'address': 'Birjeex Junction, Hargeisa'}
]

for idx, dh in enumerate(DISTRICT_HUBS):
    dist_id = f"district_{re.sub(r'[^a-zA-Z0-9]', '', dh['name']).lower()[:18]}"
    if dist_id not in seen_ids:
        seen_ids.add(dist_id)
        all_places.append({
            'id': dist_id,
            'osm_id': 995000 + idx,
            'name': dh['name'],
            'address': dh['address'],
            'lat': round(dh['lat'], 5),
            'lng': round(dh['lng'], 5),
            'category': 'District & Neighborhood',
            'subCategory': 'neighborhood',
            'district': dh['name'],
            'popular': True,
            'iconName': 'Home',
            'generalCategory': 'Xaafadaha',
            'somaliCategory': 'Xaafadaha & Degmooyinka',
            'searchTerms': [w.lower() for w in re.sub(r'[^a-zA-Z0-9\s]', ' ', dh['name']).split() if len(w) >= 2] + ['district', 'xaafad', 'degmo']
        })

print(f"Total structured places compiled: {len(all_places)}")

# Write public JSON files
public_payload = json.dumps(all_places, indent=2, ensure_ascii=False)
with open('public/hargeisa_locations.json', 'w', encoding='utf-8') as f:
    f.write(public_payload)
with open('public/hargeisa_locations_1650.json', 'w', encoding='utf-8') as f:
    f.write(public_payload)
with open('public/hargeisa_locations_1550.json', 'w', encoding='utf-8') as f:
    f.write(public_payload)

print("Updated public JSON files successfully.")

# Write TypeScript file
ts_code = '''import { LocationNode } from '../types';

export interface HargeisaPlace extends LocationNode {
  category: string;
  subCategory?: string;
  district?: string;
  searchTerms: string[];
  popular?: boolean;
  iconName?: string;
  somaliCategory?: string;
  generalCategory?: string;
  osm_id?: number;
}

// Authoritative Master Database of Real OpenStreetMap Hargeisa Places
export const HARGEISA_PLACES: HargeisaPlace[] = ''' + json.dumps(all_places, indent=2, ensure_ascii=False) + ''';

export interface CategoryMeta {
  id: string;
  label: string;
  somaliLabel: string;
  icon: string;
  count: number;
}

export const HARGEISA_CATEGORIES: CategoryMeta[] = [
  { id: 'all', label: 'All Places', somaliLabel: 'Dhammaan', icon: 'Sparkles', count: HARGEISA_PLACES.length },
  { id: 'hotel', label: 'Hotels & Hospitality', somaliLabel: 'Huteellada', icon: 'Hotel', count: HARGEISA_PLACES.filter(p => p.category.includes('Hotel')).length },
  { id: 'education', label: 'Schools & Universities', somaliLabel: 'Dugsiyada & Jaamacadaha', icon: 'GraduationCap', count: HARGEISA_PLACES.filter(p => p.category.includes('Education') || p.category.includes('School')).length },
  { id: 'transit', label: 'Transport & Fuel', somaliLabel: 'Istaannada & Kaalmaha', icon: 'Navigation', count: HARGEISA_PLACES.filter(p => p.category.includes('Transit') || p.category.includes('Transport')).length },
  { id: 'hospital', label: 'Hospitals & Healthcare', somaliLabel: 'Cusbitaallada', icon: 'HeartPulse', count: HARGEISA_PLACES.filter(p => p.category.includes('Hospital')).length },
  { id: 'dining', label: 'Restaurants & Dining', somaliLabel: 'Maqaayadaha', icon: 'UtensilsCrossed', count: HARGEISA_PLACES.filter(p => p.category.includes('Restaurant') || p.category.includes('Dining')).length },
  { id: 'government', label: 'Government & Embassies', somaliLabel: "Hay'adaha Dowladda", icon: 'Landmark', count: HARGEISA_PLACES.filter(p => p.category.includes('Government')).length },
  { id: 'market', label: 'Markets & Malls', somaliLabel: 'Suuqyada & Xarumaha', icon: 'ShoppingBag', count: HARGEISA_PLACES.filter(p => p.category.includes('Market') || p.category.includes('Mall')).length },
  { id: 'corporate', label: 'Corporate & Banking', somaliLabel: 'Bangiyada & Shirkadaha', icon: 'Building2', count: HARGEISA_PLACES.filter(p => p.category.includes('Corporate') || p.category.includes('Bank')).length },
  { id: 'mosque', label: 'Mosques & Landmarks', somaliLabel: 'Masaajidda & Taallooyinka', icon: 'Moon', count: HARGEISA_PLACES.filter(p => p.category.includes('Mosque') || p.category.includes('Landmark')).length },
  { id: 'district', label: 'Xaafadaha (Districts)', somaliLabel: 'Xaafadaha', icon: 'Home', count: HARGEISA_PLACES.filter(p => p.category.includes('District') || p.category.includes('Xaafad')).length },
];

export function searchHargeisaPlaces(query: string, categoryFilter?: string): HargeisaPlace[] {
  const q = (query || '').trim().toLowerCase();
  const cat = (categoryFilter || '').trim().toLowerCase();

  return HARGEISA_PLACES.filter((place) => {
    // Category Matching
    if (cat && cat !== 'all' && cat !== 'dhammaan') {
      const pCat = (place.category || '').toLowerCase();
      const pSub = (place.subCategory || '').toLowerCase();
      const pSomali = (place.somaliCategory || '').toLowerCase();
      const pGen = (place.generalCategory || '').toLowerCase();

      if (cat === 'hotel' || cat.includes('hotel') || cat.includes('huteel')) {
        if (!pCat.includes('hotel') && !pSub.includes('hotel') && !pGen.includes('hotel') && !pSomali.includes('huteel')) return false;
      } else if (cat === 'education' || cat.includes('school') || cat.includes('universit') || cat.includes('dugsi')) {
        if (!pCat.includes('education') && !pCat.includes('school') && !pSub.includes('university') && !pSub.includes('school') && !pSomali.includes('dugsi') && !pSomali.includes('jaamacad')) return false;
      } else if (cat === 'transit' || cat.includes('transport') || cat.includes('fuel') || cat.includes('istaan') || cat.includes('shidaal')) {
        if (!pCat.includes('transit') && !pCat.includes('transport') && !pSub.includes('fuel') && !pSub.includes('bus') && !pSomali.includes('istaan') && !pSomali.includes('shidaal')) return false;
      } else if (cat === 'hospital' || cat.includes('health') || cat.includes('cusbitaal')) {
        if (!pCat.includes('hospital') && !pSub.includes('hospital') && !pSub.includes('clinic') && !pSub.includes('pharmacy') && !pSomali.includes('cusbitaal')) return false;
      } else if (cat === 'dining' || cat.includes('restaurant') || cat.includes('cunto') || cat.includes('maqaayad')) {
        if (!pCat.includes('restaurant') && !pCat.includes('dining') && !pSub.includes('cafe') && !pSomali.includes('maqaayad')) return false;
      } else if (cat === 'government' || cat.includes('gov') || cat.includes('dowladd') || cat.includes('safarrad')) {
        if (!pCat.includes('government') && !pSub.includes('diplomatic') && !pSub.includes('police') && !pSomali.includes('dowladd')) return false;
      } else if (cat === 'market' || cat.includes('market') || cat.includes('mall') || cat.includes('suuq')) {
        if (!pCat.includes('market') && !pCat.includes('mall') && !pSub.includes('supermarket') && !pSomali.includes('suuq')) return false;
      } else if (cat === 'corporate' || cat.includes('bank') || cat.includes('bangi') || cat.includes('shirkad')) {
        if (!pCat.includes('corporate') && !pCat.includes('bank') && !pSub.includes('bank') && !pSomali.includes('bangi') && !pSomali.includes('shirkad')) return false;
      } else if (cat === 'mosque' || cat.includes('mosque') || cat.includes('masjid')) {
        if (!pCat.includes('mosque') && !pSub.includes('worship') && !pSomali.includes('masjid')) return false;
      } else if (cat === 'district' || cat.includes('xaafad') || cat.includes('degmo') || cat.includes('neighbor')) {
        if (!pCat.includes('district') && !pSub.includes('neighborhood') && !pSomali.includes('xaafad')) return false;
      } else {
        if (!pCat.includes(cat) && !pSomali.includes(cat) && !pSub.includes(cat)) return false;
      }
    }

    if (!q) return true;

    if (place.name.toLowerCase().includes(q)) return true;
    if (place.address.toLowerCase().includes(q)) return true;
    if (place.district && place.district.toLowerCase().includes(q)) return true;
    if (place.subCategory && place.subCategory.toLowerCase().includes(q)) return true;
    if (place.category && place.category.toLowerCase().includes(q)) return true;
    if (place.somaliCategory && place.somaliCategory.toLowerCase().includes(q)) return true;
    if (place.searchTerms && place.searchTerms.some(t => t.includes(q))) return true;

    return false;
  });
}
'''

with open('src/data/hargeisaPlaces.ts', 'w', encoding='utf-8') as f:
    f.write(ts_code)

print("Successfully written src/data/hargeisaPlaces.ts")
