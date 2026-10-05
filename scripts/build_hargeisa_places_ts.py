import json
import re
import math
import sys
import os

sys.path.append(os.path.abspath('generated'))
from wadaage_hargeisa_all_xaafadaha import hargeisa_complete_xaafadaha_db

# Specific category matching rules for names and descriptions
def categorize_place(name, description, xaafada=""):
    nl = name.lower()
    dl = description.lower()
    full = nl + " " + dl + " " + xaafada.lower()

    # 1. Hospitals & Healthcare
    if any(k in full for k in [
        "hospital", "cusbitaal", "clinic", "shifa", "manhal", "edna", "haldor",
        "somali german", "farmasi", "pharmacy", "medical", "dispensary", "caafimaad"
    ]):
        return ("Hospitals & Healthcare", "hospital", "Activity", "Hospitals & Clinics")

    # 2. Schools & Universities
    if any(k in full for k in [
        "university", "jaamacad", "school", "iskuul", "dugsi", "academy",
        "fanon", "admas", "eelo", "ilays", "college", "campus", "educational"
    ]):
        return ("Schools & Universities", "university", "GraduationCap", "Education")

    # 3. Mosques
    if any(k in full for k in [
        "mosque", "masjid", "masjidka", "jama", "rawda", "ali matan", "sheekh", "madar"
    ]):
        return ("Mosques (Masaajidda)", "place_of_worship", "Moon", "Worship")

    # 4. Fuel Stations
    if any(k in full for k in [
        "petroleum", "fuel station", "kaalinta shidaalka", "somgas", "petrol",
        "red sea", "hass", "shidaal", "gas station"
    ]):
        return ("Fuel Stations (Kaalmaha Shidaalka)", "fuel", "Fuel", "Fuel & Energy")

    # 5. Markets & Malls
    if any(k in full for k in [
        "market", "suuq", "suuqa", "mall", "supermarket", "shopping",
        "waheen", "deero", "guryo-same", "city center mall", "trading"
    ]):
        return ("Markets & Malls", "mall", "ShoppingBag", "Commercial & Shopping")

    # 6. Transport & Terminals
    if any(k in full for k in [
        "airport", "terminal", "bus station", "istaan", "transit", "crossroad",
        "isgoys", "isgoyska", "highway", "intersection", "daalo"
    ]):
        return ("Transport & Terminals", "transit_station", "Navigation", "Transport")

    # 7. Hotels & Hospitality
    if any(k in full for k in [
        "hotel", "huteel", "maansoor", "oriental", "ambassador", "imperial", "resort"
    ]):
        return ("Hotels & Hospitality", "hotel", "Hotel", "Hotels & Lodging")

    # 8. Government & Institutions
    if any(k in full for k in [
        "bank", "ministry", "parliament", "palace", "madxtooyada", "municipality",
        "police", "saldhig", "telesom", "somtel", "sompower", "court", "theatre"
    ]):
        return ("Government & Institutions", "government", "Landmark", "Institutions & Civic")

    # 9. Default: Neighborhoods & Residential Hubs
    return ("Neighborhoods & Residential Hubs", "neighborhood", "MapPin", "Residential")

formatted_places = []
seen_ids = set()

# First, process the complete 1550 locations from the master database
place_counter = 1
for xaafada, nodes in hargeisa_complete_xaafadaha_db.items():
    district_clean = xaafada.split("/")[0].strip()
    for node in nodes:
        name = node["laanta"]
        desc = node["tilmaanta"]
        lat = round(float(node["latitude"]), 5)
        lng = round(float(node["longitude"]), 5)

        category, sub_cat, icon, general_cat = categorize_place(name, desc, xaafada)

        # Generate a unique slug ID
        slug = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
        base_id = f"hga_m_{slug[:35]}"
        p_id = base_id
        suffix_id = 1
        while p_id in seen_ids:
            p_id = f"{base_id}_{suffix_id}"
            suffix_id += 1
        seen_ids.add(p_id)

        # Search terms
        terms = set([
            w for w in re.split(r'[^a-zA-Z0-9]+', (name + " " + desc + " " + xaafada + " " + category).lower())
            if len(w) > 1
        ])

        # Flag popular anchor locations
        is_pop = any(p in name.lower() for p in [
            "hospital", "airport", "hotel", "university", "mall", "market",
            "telesom", "dahabshiil", "somtel", "bank", "municipality", "edna", "manhal", "ali matan"
        ])

        formatted_places.append({
            "id": p_id,
            "name": name,
            "address": desc if "Hargeisa" in desc else f"{desc}, Hargeisa, Somaliland",
            "lat": lat,
            "lng": lng,
            "category": category,
            "subCategory": sub_cat,
            "district": district_clean,
            "popular": is_pop,
            "searchTerms": sorted(list(terms)),
            "iconName": icon
        })
        place_counter += 1

print(f"Total structured places compiled: {len(formatted_places)}")

# Write to public/hargeisa_locations_1550.json
with open('public/hargeisa_locations_1550.json', 'w', encoding='utf-8') as f:
    json.dump(formatted_places, f, indent=2, ensure_ascii=False)

# Write to src/data/hargeisaPlaces.ts
ts_content = """import { LocationNode } from '../types';

export interface HargeisaPlace extends LocationNode {
  category: string;
  subCategory?: string;
  district?: string;
  searchTerms: string[];
  popular?: boolean;
  iconName?: string;
}

export const HARGEISA_PLACES: HargeisaPlace[] = """ + json.dumps(formatted_places, indent=2, ensure_ascii=False) + """;

export function searchHargeisaPlaces(query: string, categoryFilter?: string): HargeisaPlace[] {
  const q = (query || '').trim().toLowerCase();
  const cat = (categoryFilter || '').trim().toLowerCase();

  return HARGEISA_PLACES.filter((place) => {
    // Category match
    if (cat && cat !== 'all') {
      const pCat = (place.category || '').toLowerCase();
      const pSub = (place.subCategory || '').toLowerCase();
      
      const isHospital = cat.includes('hospital') || cat.includes('health');
      if (isHospital && !(pCat.includes('hospital') || pCat.includes('health') || pSub.includes('hospital') || pSub.includes('pharmacy'))) {
        return false;
      }
      
      const isSchool = cat.includes('school') || cat.includes('universit') || cat.includes('education');
      if (isSchool && !(pCat.includes('school') || pCat.includes('universit') || pSub.includes('school') || pSub.includes('university'))) {
        return false;
      }
      
      const isMosque = cat.includes('mosque') || cat.includes('masjid');
      if (isMosque && !(pCat.includes('mosque') || pSub.includes('worship'))) {
        return false;
      }

      const isMarket = cat.includes('market') || cat.includes('mall') || cat.includes('shop');
      if (isMarket && !(pCat.includes('market') || pCat.includes('mall') || pSub.includes('mall') || pSub.includes('market'))) {
        return false;
      }

      const isFuel = cat.includes('fuel') || cat.includes('petrol') || cat.includes('kaalm');
      if (isFuel && !(pCat.includes('fuel') || pSub.includes('fuel'))) {
        return false;
      }

      const isHotel = cat.includes('hotel') || cat.includes('hospit');
      if (isHotel && !isHospital && !(pCat.includes('hotel') || pSub.includes('hotel'))) {
        return false;
      }

      const isTransport = cat.includes('transport') || cat.includes('transit') || cat.includes('airport');
      if (isTransport && !(pCat.includes('transport') || pSub.includes('transit'))) {
        return false;
      }

      const isGov = cat.includes('gov') || cat.includes('institution') || cat.includes('bank');
      if (isGov && !(pCat.includes('gov') || pSub.includes('gov') || pSub.includes('bank'))) {
        return false;
      }

      const isDistrict = cat.includes('xaafad') || cat.includes('district') || cat.includes('neighbor');
      if (isDistrict && !(pCat.includes('neighbor') || pSub.includes('neighbor'))) {
        return false;
      }
    }

    // Query match
    if (!q) return true;

    if (place.name.toLowerCase().includes(q)) return true;
    if (place.address.toLowerCase().includes(q)) return true;
    if (place.district && place.district.toLowerCase().includes(q)) return true;
    if (place.category && place.category.toLowerCase().includes(q)) return true;
    if (place.searchTerms && place.searchTerms.some(t => t.includes(q))) return true;

    return false;
  });
}
"""

with open('src/data/hargeisaPlaces.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Successfully generated src/data/hargeisaPlaces.ts with {len(formatted_places)} categorized locations!")
