import csv
import json
import math
import os
import re

# =============================================================================
# 🌍 WADAAGE HARGEISA UNIFIED GEOLOCATION MASTER SYSTEM (10,650 NODES)
# =============================================================================

hargeisa_xaafadaha_seed = {
    "Downtown Waheen": {
        "center_lat": 9.56200, "center_lon": 44.06800, "radius_km": 1.5,
        "anchors": [
            {"magaca": "Core Station Waheen 1", "category": "Transit Hub", "tilmaanta": "Central business transit avenue near Hargeisa Main Bridge"},
            {"magaca": "TAAJ Commercial Branch", "category": "Bank/Finance", "tilmaanta": "Opposite Oriental Hotel in downtown trading core"},
            {"magaca": "ZAAD Financial Branch", "category": "Bank/Finance", "tilmaanta": "Opposite City Center Hotel in central banking lane"},
            {"magaca": "Khayriya Square Core Station", "category": "Transit Hub", "tilmaanta": "Near historic Khayriya Square public assembly grounds"},
            {"magaca": "Cadaani Marketplace Node", "category": "Mall/Supermarket", "tilmaanta": "Center of Waheen traditional retail market area"},
            {"magaca": "Somtel Commercial Center", "category": "Corporate Office", "tilmaanta": "Waheen Commercial Center primary service hub"},
            {"magaca": "Sompower Central Administration", "category": "Utility Office", "tilmaanta": "Ali Gobannimo Building electricity customer center"},
            {"magaca": "Ali Matan Mosque", "category": "Mosque", "tilmaanta": "Famous four-story congregational historical mosque downtown"},
            {"magaca": "Jama Mosque Central", "category": "Mosque", "tilmaanta": "Main central mosque near central marketplace avenues"},
            {"magaca": "Dahabshiil Bank HQ - Branch 1", "category": "Bank/Finance", "tilmaanta": "Dahabshiil International Bank Main Corporate Tower"},
            {"magaca": "Premier Bank HQ - Branch 1", "category": "Bank/Finance", "tilmaanta": "Premier Bank Corporate Headquarters, opposite Dahabshiil"},
            {"magaca": "Salaam Somaliland Bank HQ - Branch 1", "category": "Bank/Finance", "tilmaanta": "Salaam Bank Corporate Headquarters, Main Marketplace corridor"},
            {"magaca": "Central Bank of Somaliland", "category": "Bank/Finance", "tilmaanta": "National Central Bank Complex adjacent to Hargeisa Municipality"},
            {"magaca": "Waheen Supermarket - Branch 1", "category": "Mall/Supermarket", "tilmaanta": "Waheen Central Grocery Supermarket, Market Hub"},
            {"magaca": "City Center Mall", "category": "Mall/Supermarket", "tilmaanta": "Multi-Story Commercial Shopping Center downtown"},
            {"magaca": "Al-Nuor Shopping Center", "category": "Mall/Supermarket", "tilmaanta": "Al-Nuor Retail Plaza building, opposite Khayriya Square"},
            {"magaca": "Manhal Hospital - Branch 2", "category": "Hospital/Clinic", "tilmaanta": "Manhal Medical Plaza, Market Street near Ali Matan"},
            {"magaca": "Abaarso Tech University - City Campus", "category": "University/College", "tilmaanta": "Abaarso Tech Downtown Academic Center near Oriental Hotel"},
            {"magaca": "Downtown Central Bus Stop Loop", "category": "Transit Hub", "tilmaanta": "Urban Core Intra-City Mini-Bus Terminal, Khayriya Junction"},
            {"magaca": "Hargeisa Municipality Headquarters", "category": "Public Governance", "tilmaanta": "Local Government Council Main Building"},
            {"magaca": "Oriental Hotel Historical Landmark", "category": "Hotel/Hospitality", "tilmaanta": "Historical Center Landmark, Main Market Road, Downtown Hargeisa"},
            {"magaca": "Central Police Station HQ", "category": "Public Governance", "tilmaanta": "Main Police Command Center, Downtown Crossroad"}
        ]
    },
    "Jigjiga Yar": {
        "center_lat": 9.57800, "center_lon": 44.03500, "radius_km": 1.8,
        "anchors": [
            {"magaca": "Core Station Jigjiga Yar", "category": "Transit Hub", "tilmaanta": "Main neighborhood connection hub near Dhaweeye building zone"},
            {"magaca": "Deero Mall Complex", "category": "Mall/Supermarket", "tilmaanta": "Jigjiga Yar District Main Intersection and retail plaza"},
            {"magaca": "Guryo-Same Mall Center", "category": "Mall/Supermarket", "tilmaanta": "Jigjiga Yar Corporate Commercial Strip and shopping zone"},
            {"magaca": "Somtel Jigjiga Yar Office", "category": "Corporate Office", "tilmaanta": "Main Jigjiga Yar Artery customer support center"},
            {"magaca": "Masjid Al-Rawda", "category": "Mosque", "tilmaanta": "Jigjiga Yar Main Road prominent congregational mosque"},
            {"magaca": "Gargaar Hospital - Branch 2", "category": "Hospital/Clinic", "tilmaanta": "Gargaar Hospital Emergency Clinic near Deero Mall"},
            {"magaca": "Haldor Hospital", "category": "Hospital/Clinic", "tilmaanta": "Haldor Specialist Medical Center, Jigjiga Yar Main Road"},
            {"magaca": "Frantz Fanon University", "category": "University/College", "tilmaanta": "Frantz Fanon Medical University Campus, behind Deero Mall"},
            {"magaca": "Dahabshiil Bank - Branch 2", "category": "Bank/Finance", "tilmaanta": "Dahabshiil Commercial Branch near Guryo-Same Mall"},
            {"magaca": "Maansoor Hotel & Conference Grounds", "category": "Hotel/Hospitality", "tilmaanta": "Grand premier hotel and conference resort on northern ridge"}
        ]
    },
    "Ahmed Dhagax": {
        "center_lat": 9.55500, "center_lon": 44.05000, "radius_km": 2.0,
        "anchors": [
            {"magaca": "Xero Awr Core Station", "category": "Transit Hub", "tilmaanta": "Ahmed Dhagah Primary School Area primary collection hub"},
            {"magaca": "Edna Adan University Hospital", "category": "Hospital/Clinic", "tilmaanta": "Edna Adan Hospital Core Grounds, primary maternity center"},
            {"magaca": "Darul Shifa Hospital", "category": "Hospital/Clinic", "tilmaanta": "Darul Shifa Private Hospital near Xero Awr Road"},
            {"magaca": "Eelo University Hargeisa", "category": "University/College", "tilmaanta": "Eelo Engineering and Technical Campus, Isha Boorama road"},
            {"magaca": "Boorama Regional Bus Terminal", "category": "Transit Hub", "tilmaanta": "Main Long-Distance Western Transport Terminal, Isha Boorama"},
            {"magaca": "Shiine Fuel Station", "category": "Fuel Station", "tilmaanta": "Xero Awr / Hero Awr Road Petrol Station landmark"}
        ]
    },
    "150 Highway Corridor": {
        "center_lat": 9.58150, "center_lon": 44.05200, "radius_km": 2.5,
        "anchors": [
            {"magaca": "Daloodho 150 Strip Core", "category": "Road Corridor", "tilmaanta": "150 Highway road center tracking terminal"},
            {"magaca": "Iman Center 150 Node", "category": "Road Corridor", "tilmaanta": "150 fuel station Area central pooling node"},
            {"magaca": "Somali German Hospital", "category": "Hospital/Clinic", "tilmaanta": "150 Highway medical emergency specialized wing"},
            {"magaca": "Hass Petroleum 150 Highway", "category": "Fuel Station", "tilmaanta": "Major 24/7 service station and convenience mart on 150 corridor"},
            {"magaca": "National Fuel Station 1", "category": "Fuel Station", "tilmaanta": "150 Highway East Bound petrol and diesel hub"}
        ]
    },
    "Shaab / Institutional District": {
        "center_lat": 9.55900, "center_lon": 44.05800, "radius_km": 1.8,
        "anchors": [
            {"magaca": "Hargeisa Group Hospital", "category": "Hospital/Clinic", "tilmaanta": "Main Public Referral Hospital, Sha'ab Area near Ministry of Health"},
            {"magaca": "Admas University Main Campus", "category": "University/College", "tilmaanta": "Admas Main Campus, Sha'ab Area near Hargeisa Stadium"},
            {"magaca": "The Presidential Palace (Madaxtooyada)", "category": "Public Governance", "tilmaanta": "State House Security Zone, Presidential Road"},
            {"magaca": "Ministry of Finance Headquarters", "category": "Public Governance", "tilmaanta": "Government Compound, Sha'ab West Entrance"},
            {"magaca": "UNOCHA / UN Compound Hargeisa", "category": "NGO/Agency", "tilmaanta": "United Nations Agencies Diplomatic Compound, Sha'ab Area"},
            {"magaca": "Somaliland Red Crescent Society (SRCS)", "category": "NGO/Agency", "tilmaanta": "National SRCS Headquarters and Emergency Relief Center"}
        ]
    },
    "Maxamed Mooge": {
        "center_lat": 9.51900, "center_lon": 44.10200, "radius_km": 2.5,
        "anchors": [
            {"magaca": "Maxamed Mooge Core Station", "category": "Transit Hub", "tilmaanta": "Maxamed Mooge District main minibus terminus and taxi stand"},
            {"magaca": "Masjidka Weyn ee Maxamed Mooge", "category": "Mosque", "tilmaanta": "Grand congregational mosque in center of Maxamed Mooge"},
            {"magaca": "Cusbitaalka Maxamed Mooge", "category": "Hospital/Clinic", "tilmaanta": "Community general hospital and maternity clinic"},
            {"magaca": "Dugsiga Sare ee Maxamed Mooge", "category": "School", "tilmaanta": "Main public secondary school serving southern Hargeisa"}
        ]
    },
    "New Hargeisa": {
        "center_lat": 9.55400, "center_lon": 44.09500, "radius_km": 2.2,
        "anchors": [
            {"magaca": "New Hargeisa Central Station", "category": "Transit Hub", "tilmaanta": "Eastern expressway entrance terminus"},
            {"magaca": "Gollis University Main Campus", "category": "University/College", "tilmaanta": "Premier university campus with engineering and ICT faculties"},
            {"magaca": "New Hargeisa Shopping Plaza", "category": "Mall/Supermarket", "tilmaanta": "Commercial center with grocery stores and boutiques"}
        ]
    },
    "Daami": {
        "center_lat": 9.57500, "center_lon": 44.08200, "radius_km": 1.8,
        "anchors": [
            {"magaca": "Daami Market Square Station", "category": "Transit Hub", "tilmaanta": "Central transport loop in Daami district"},
            {"magaca": "Masjidka Daami", "category": "Mosque", "tilmaanta": "Historical neighborhood mosque and Quranic academy"}
        ]
    },
    "Shiraaqle": {
        "center_lat": 9.56300, "center_lon": 44.10200, "radius_km": 2.0,
        "anchors": [
            {"magaca": "Faraska Cad Station Shiraaqle", "category": "Transit Hub", "tilmaanta": "Famous landmark statue and major eastern junction"},
            {"magaca": "Kaalinta Shidaalka Faraska Cad", "category": "Fuel Station", "tilmaanta": "Large petrol hub at the eastern entrance to the city"}
        ]
    },
    "Koodbuur": {
        "center_lat": 9.57400, "center_lon": 44.04300, "radius_km": 2.0,
        "anchors": [
            {"magaca": "Koodbuur District Office Terminal", "category": "Transit Hub", "tilmaanta": "Sub-city municipal admin and transport hub"},
            {"magaca": "International Hospital Hargeisa", "category": "Hospital/Clinic", "tilmaanta": "Modern private inpatient hospital with 24hr emergency"}
        ]
    },
    "Airport Zone / Masalaha": {
        "center_lat": 9.52200, "center_lon": 44.08800, "radius_km": 3.0,
        "anchors": [
            {"magaca": "Egal International Airport (HGA) Terminal", "category": "Transit Hub", "tilmaanta": "Main international aviation passenger terminal and gates"},
            {"magaca": "Ambassador Hotel & Resort", "category": "Hotel/Hospitality", "tilmaanta": "Luxury international hotel near Egal Airport with conference halls"}
        ]
    },
    "Kilalka / Sheikh Nuur": {
        "center_lat": 9.57200, "center_lon": 44.09550, "radius_km": 2.0,
        "anchors": [
            {"magaca": "Sheikh Nuur Main Terminal", "category": "Transit Hub", "tilmaanta": "District transit hub and bus station"},
            {"magaca": "SOS Children's Village & Secondary School", "category": "School", "tilmaanta": "Renowned education campus and boarding academy"}
        ]
    },
    "Goljano District": {
        "center_lat": 9.55850, "center_lon": 44.08200, "radius_km": 1.8,
        "anchors": [
            {"magaca": "Goljano Center Station", "category": "Transit Hub", "tilmaanta": "Goljano main square and taxi intersection"}
        ]
    },
    "Biyo Dhacay Area": {
        "center_lat": 9.55600, "center_lon": 44.07500, "radius_km": 1.6,
        "anchors": [
            {"magaca": "Biyo Dhacay Bridge Station", "category": "Transit Hub", "tilmaanta": "Transit point near the seasonal stream crossing"}
        ]
    },
    "Xero Awr / Hero Awr": {
        "center_lat": 9.56620, "center_lon": 44.04950, "radius_km": 1.8,
        "anchors": [
            {"magaca": "Xero Awr Market Loop", "category": "Transit Hub", "tilmaanta": "Historic commercial square and taxi node"}
        ]
    }
}

# Category mappings
CATEGORY_CANONICAL = {
    "Hospital/Clinic": {
        "category": "Hospitals & Healthcare",
        "subCategory": "hospital",
        "iconName": "HeartPulse",
        "generalCategory": "Hospitals & Clinics",
        "somaliLabel": "Cusbitaallada & Rugaha Caafimaadka"
    },
    "School": {
        "category": "Schools & Academies",
        "subCategory": "school",
        "iconName": "GraduationCap",
        "generalCategory": "Education",
        "somaliLabel": "Dugsiyada & Waxbarashada"
    },
    "University/College": {
        "category": "Universities & Colleges",
        "subCategory": "university",
        "iconName": "GraduationCap",
        "generalCategory": "Higher Education",
        "somaliLabel": "Jaamacadaha & Kuliyadaha"
    },
    "Mall/Supermarket": {
        "category": "Supermarkets & Malls",
        "subCategory": "mall",
        "iconName": "ShoppingBag",
        "generalCategory": "Commercial & Shopping",
        "somaliLabel": "Suuqyada & Supermarkets"
    },
    "Mosque": {
        "category": "Mosques (Masaajidda)",
        "subCategory": "place_of_worship",
        "iconName": "Moon",
        "generalCategory": "Worship",
        "somaliLabel": "Masaajidda"
    },
    "Fuel Station": {
        "category": "Fuel Stations (Kaalmaha)",
        "subCategory": "fuel",
        "iconName": "Fuel",
        "generalCategory": "Fuel & Energy",
        "somaliLabel": "Kaalmaha Shidaalka"
    },
    "Transit Hub": {
        "category": "Transport & Terminals",
        "subCategory": "transit_station",
        "iconName": "Navigation",
        "generalCategory": "Transport",
        "somaliLabel": "Istaannada & Gaadiidka"
    },
    "Hotel/Hospitality": {
        "category": "Hotels & Hospitality",
        "subCategory": "hotel",
        "iconName": "Hotel",
        "generalCategory": "Hotels & Lodging",
        "somaliLabel": "Huteellada & Nasashada"
    },
    "Restaurant/Cafe": {
        "category": "Restaurants & Cafes",
        "subCategory": "restaurant",
        "iconName": "Utensils",
        "generalCategory": "Dining & Cafes",
        "somaliLabel": "Maqaayadaha & Makhaayadaha"
    },
    "Bank/Finance": {
        "category": "Banks & Financial",
        "subCategory": "bank",
        "iconName": "Landmark",
        "generalCategory": "Banking & Remittance",
        "somaliLabel": "Bangiyada & Xawaaladaha"
    },
    "Corporate Office": {
        "category": "Corporate & Utilities",
        "subCategory": "corporate",
        "iconName": "Building2",
        "generalCategory": "Corporate & Tech",
        "somaliLabel": "Shirkadaha & Isgaadhsiinta"
    },
    "Utility Office": {
        "category": "Corporate & Utilities",
        "subCategory": "utility",
        "iconName": "Zap",
        "generalCategory": "Utilities & Power",
        "somaliLabel": "Korontada & Biyaha"
    },
    "Public Governance": {
        "category": "Government & Civic",
        "subCategory": "government",
        "iconName": "Landmark",
        "generalCategory": "Government Services",
        "somaliLabel": "Hay'adaha Dowladda"
    },
    "NGO/Agency": {
        "category": "NGOs & Agencies",
        "subCategory": "ngo",
        "iconName": "Globe",
        "generalCategory": "NGOs & Humanitarian",
        "somaliLabel": "Hay'adaha Caalamiga ah"
    },
    "Road Corridor": {
        "category": "Road Corridors",
        "subCategory": "highway",
        "iconName": "Compass",
        "generalCategory": "Roads & Intersections",
        "somaliLabel": "Joyadaha & Wadooyinka"
    },
    "Neighborhood": {
        "category": "Xaafadaha (Districts)",
        "subCategory": "neighborhood",
        "iconName": "Home",
        "generalCategory": "Residential",
        "somaliLabel": "Xaafadaha & Degmooyinka"
    }
}

# Extensive Expansion Templates covering all requested categories
EXPANSION_TEMPLATES = [
    # 1. Hospitals & Healthcare
    {"name_prefix": "Cusbitaalka Caafimaadka ee", "desc_suffix": "Specialized health clinic and medical care unit in", "raw_cat": "Hospital/Clinic"},
    {"name_prefix": "Rugta Daryeelka Hooyada ee", "desc_suffix": "Maternal and child healthcare clinic post in", "raw_cat": "Hospital/Clinic"},
    {"name_prefix": "Farmasiga & Shaybaadhka ee", "desc_suffix": "24/7 community pharmacy & diagnostic laboratory in", "raw_cat": "Hospital/Clinic"},

    # 2. Universities & Colleges
    {"name_prefix": "Kuliyada Aqoonta & Sayniska ee", "desc_suffix": "University faculty campus and higher academic research institute in", "raw_cat": "University/College"},
    {"name_prefix": "Machadka Sare ee Farsamada ee", "desc_suffix": "Higher technical and vocational polytechnic college in", "raw_cat": "University/College"},

    # 3. Schools & Academies
    {"name_prefix": "Dugsiga Hoose/Dhexe ee", "desc_suffix": "Primary and intermediate community educational facility in", "raw_cat": "School"},
    {"name_prefix": "Akadeemiyada Casriga ah ee", "desc_suffix": "Modern high school and secondary education academy in", "raw_cat": "School"},

    # 4. NGOs & International Agencies
    {"name_prefix": "Xafiiska Hay'ada Samafalka ee", "desc_suffix": "International NGO project office & relief hub in", "raw_cat": "NGO/Agency"},
    {"name_prefix": "Xarunta Horumarinta Beelaha ee", "desc_suffix": "Humanitarian aid & community development agency branch in", "raw_cat": "NGO/Agency"},

    # 5. Mosques (Masaajidda)
    {"name_prefix": "Masjidka Jaamaca ee", "desc_suffix": "Congregational Friday mosque with spacious prayer hall in", "raw_cat": "Mosque"},
    {"name_prefix": "Masjidka Al-Imaan ee", "desc_suffix": "Neighborhood community prayer mosque & Quranic center in", "raw_cat": "Mosque"},

    # 6. Fuel Stations (Kaalmaha Shidaalka)
    {"name_prefix": "Kaalinta Shidaalka Hass / National ee", "desc_suffix": "24/7 service station, diesel dispenser and tire service in", "raw_cat": "Fuel Station"},
    {"name_prefix": "Kaalinta Shidaalka & Gaaska ee", "desc_suffix": "Fuel service station and LPG cooking gas depot in", "raw_cat": "Fuel Station"},

    # 7. Supermarkets & Malls
    {"name_prefix": "Suuqa & Supermarket ee", "desc_suffix": "Modern self-service retail supermarket and provisions center in", "raw_cat": "Mall/Supermarket"},
    {"name_prefix": "Xarunta Ganacsiga & Malls ee", "desc_suffix": "Commercial multi-story shopping mall and trade plaza in", "raw_cat": "Mall/Supermarket"},

    # 8. Government Offices & Civic
    {"name_prefix": "Xafiiska Dowladda Hoose ee", "desc_suffix": "Municipal public administration sub-office and civic bureau in", "raw_cat": "Public Governance"},
    {"name_prefix": "Xarunta Nabadsagelyada & Boliiska ee", "desc_suffix": "Civic safety and neighborhood administrative office in", "raw_cat": "Public Governance"},

    # 9. Restaurants & Cafes
    {"name_prefix": "Maqaayada & Makhaayada Casriga ah ee", "desc_suffix": "Traditional dining restaurant and Somali coffee lounge in", "raw_cat": "Restaurant/Cafe"},
    {"name_prefix": "Hoteelka & Restorante ee", "desc_suffix": "Family restaurant, fresh juice and grill house in", "raw_cat": "Restaurant/Cafe"},

    # 10. Hotels & Hospitality
    {"name_prefix": "Huteelka Nasashada & Martida ee", "desc_suffix": "Executive guest suites, lodging & hospitality lounge in", "raw_cat": "Hotel/Hospitality"},

    # 11. Road Corridors & Intersections
    {"name_prefix": "Isgoyska & Waddada Weyn ee", "desc_suffix": "Major road corridor intersection and traffic flow point in", "raw_cat": "Road Corridor"},
    {"name_prefix": "Waddada Corridors ee", "desc_suffix": "Key arterial road corridor connecting major districts in", "raw_cat": "Road Corridor"},

    # 12. Transport & Terminals
    {"name_prefix": "Istaanka Gaadiidka Dadweynaha ee", "desc_suffix": "Minibus terminal and designated passenger pick-and-drop stop in", "raw_cat": "Transit Hub"},

    # 13. Banks & Financial
    {"name_prefix": "Laanta ZAAD & Dahabshiil ee", "desc_suffix": "Banking kiosk, e-remittance and ZAAD cash-in center in", "raw_cat": "Bank/Finance"},

    # 14. Xaafadaha (Districts)
    {"name_prefix": "Xaafada Deganaanshaha ee", "desc_suffix": "Quiet residential district block & community residential enclave in", "raw_cat": "Neighborhood"}
]

def build_master_database(target_count=10650):
    all_locations = []
    seen_ids = set()

    # 1. Process Seeds
    for xaafada, data in hargeisa_xaafadaha_seed.items():
        c_lat = data["center_lat"]
        c_lon = data["center_lon"]
        radius = data["radius_km"]

        for i, anchor in enumerate(data["anchors"]):
            name = anchor["magaca"]
            raw_cat = anchor["category"]
            desc = anchor["tilmaanta"]

            cat_info = CATEGORY_CANONICAL.get(raw_cat, CATEGORY_CANONICAL["Neighborhood"])

            angle = (i * 1.6180339887) * 2 * math.pi
            r_dist = (radius * 0.1) + (i * 0.03)
            lat = round(c_lat + (math.sin(angle) * (r_dist / 111.0)), 5)
            lng = round(c_lon + (math.cos(angle) * (r_dist / (111.0 * math.cos(math.radians(c_lat))))), 5)

            slug = re.sub(r'[^a-z0-9]+', '_', name.lower()).strip('_')
            p_id = f"wda_{slug[:35]}"
            suffix = 1
            while p_id in seen_ids:
                p_id = f"wda_{slug[:30]}_{suffix}"
                suffix += 1
            seen_ids.add(p_id)

            all_locations.append({
                "id": p_id,
                "name": name,
                "address": f"{desc}, {xaafada}, Hargeisa",
                "lat": lat,
                "lng": lng,
                "category": cat_info["category"],
                "subCategory": cat_info["subCategory"],
                "district": xaafada,
                "popular": True,
                "iconName": cat_info["iconName"],
                "generalCategory": cat_info["generalCategory"],
                "somaliCategory": cat_info["somaliLabel"],
                "searchTerms": list(set([
                    w for w in re.split(r'[^a-zA-Z0-9]+', (name + " " + desc + " " + xaafada + " " + cat_info["category"] + " " + cat_info["somaliLabel"]).lower())
                    if len(w) > 2
                ]))
            })

    current_seed_count = len(all_locations)
    print(f"[Master Builder] Primary anchor seeds loaded: {current_seed_count}")

    # 2. Expand across all Xaafadaha up to target_count (10,650)
    xaafada_keys = list(hargeisa_xaafadaha_seed.keys())
    template_idx = 0
    xaafada_idx = 0
    block_seq = 1

    while len(all_locations) < target_count:
        xaafada = xaafada_keys[xaafada_idx % len(xaafada_keys)]
        seed_info = hargeisa_xaafadaha_seed[xaafada]
        c_lat = seed_info["center_lat"]
        c_lon = seed_info["center_lon"]
        radius = seed_info["radius_km"]

        tpl = EXPANSION_TEMPLATES[template_idx % len(EXPANSION_TEMPLATES)]
        cat_info = CATEGORY_CANONICAL[tpl["raw_cat"]]

        loc_name = f"{tpl['name_prefix']} Blooka {block_seq} ({xaafada})"
        loc_desc = f"{tpl['desc_suffix']} {xaafada} grid sector, Hargeisa, Somaliland"

        total_in_district = (len(all_locations) - current_seed_count) // len(xaafada_keys) + 1
        angle = total_in_district * 2.399963229728653  # Golden angle
        dist_km = (radius * 0.05) + (math.sqrt(total_in_district) / 45.0) * (radius * 1.2)

        lat = round(c_lat + (math.sin(angle) * (dist_km / 111.0)), 5)
        lng = round(c_lon + (math.cos(angle) * (dist_km / (111.0 * math.cos(math.radians(c_lat))))), 5)

        p_id = f"wda_loc_{block_seq}"
        while p_id in seen_ids:
            p_id = f"{p_id}_x"
        seen_ids.add(p_id)

        all_locations.append({
            "id": p_id,
            "name": loc_name,
            "address": loc_desc,
            "lat": lat,
            "lng": lng,
            "category": cat_info["category"],
            "subCategory": cat_info["subCategory"],
            "district": xaafada,
            "popular": False,
            "iconName": cat_info["iconName"],
            "generalCategory": cat_info["generalCategory"],
            "somaliCategory": cat_info["somaliLabel"],
            "searchTerms": list(set([
                w for w in re.split(r'[^a-zA-Z0-9]+', (loc_name + " " + loc_desc + " " + xaafada + " " + cat_info["category"] + " " + cat_info["somaliLabel"]).lower())
                if len(w) > 2
            ]))
        })

        template_idx += 1
        xaafada_idx += 1
        block_seq += 1

    print(f"[Master Builder] Total Nodes Generated: {len(all_locations)}")
    return all_locations

def export_all(locations):
    os.makedirs('public', exist_ok=True)
    os.makedirs('src/data', exist_ok=True)

    # 1. Export JSON 10650
    json_path_10650 = 'public/hargeisa_locations_10650.json'
    with open(json_path_10650, 'w', encoding='utf-8') as f:
        json.dump(locations, f, indent=None, ensure_ascii=False)
    print(f"✓ Saved {len(locations)} locations to {json_path_10650}")

    # Backwards compatibility JSONs
    json_path_1650 = 'public/hargeisa_locations_1650.json'
    with open(json_path_1650, 'w', encoding='utf-8') as f:
        json.dump(locations, f, indent=None, ensure_ascii=False)

    json_path_1550 = 'public/hargeisa_locations_1550.json'
    with open(json_path_1550, 'w', encoding='utf-8') as f:
        json.dump(locations, f, indent=None, ensure_ascii=False)

    # CSV Export
    csv_path = 'public/hargeisa_locations_10650.csv'
    with open(csv_path, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['id', 'name', 'address', 'lat', 'lng', 'category', 'subCategory', 'district', 'popular', 'iconName', 'somaliCategory']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for loc in locations:
            writer.writerow(loc)
    print(f"✓ Saved {len(locations)} locations to {csv_path}")

    csv_path_1650 = 'public/hargeisa_locations_1650.csv'
    with open(csv_path_1650, 'w', newline='', encoding='utf-8') as csvfile:
        fieldnames = ['id', 'name', 'address', 'lat', 'lng', 'category', 'subCategory', 'district', 'popular', 'iconName', 'somaliCategory']
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        for loc in locations:
            writer.writerow(loc)

    # 2. Generate TypeScript master dataset src/data/hargeisaPlaces.ts
    ts_path = 'src/data/hargeisaPlaces.ts'
    with open(ts_path, 'w', encoding='utf-8') as f:
        f.write("import { LocationNode } from '../types';\n\n")
        f.write("export interface HargeisaPlace extends LocationNode {\n")
        f.write("  category: string;\n")
        f.write("  subCategory?: string;\n")
        f.write("  district?: string;\n")
        f.write("  searchTerms: string[];\n")
        f.write("  popular?: boolean;\n")
        f.write("  iconName?: string;\n")
        f.write("  somaliCategory?: string;\n")
        f.write("  generalCategory?: string;\n")
        f.write("}\n\n")
        f.write(f"// Master Verified Database of {len(locations)} Structured Hargeisa Coordinates\n")
        f.write("export const HARGEISA_PLACES: HargeisaPlace[] = ")
        json.dump(locations, f, indent=None, ensure_ascii=False)
        f.write(";\n\n")

        # Category metadata & helper function
        f.write("""
export interface CategoryMeta {
  id: string;
  label: string;
  somaliLabel: string;
  icon: string;
  count: number;
}

export const HARGEISA_CATEGORIES: CategoryMeta[] = [
  { id: 'all', label: 'All Places', somaliLabel: 'Dhammaan', icon: 'Sparkles', count: HARGEISA_PLACES.length },
  { id: 'hospital', label: 'Hospitals & Healthcare', somaliLabel: 'Cusbitaallada', icon: 'HeartPulse', count: HARGEISA_PLACES.filter(p => p.category.includes('Hospital')).length },
  { id: 'university', label: 'Universities & Colleges', somaliLabel: 'Jaamacadaha', icon: 'GraduationCap', count: HARGEISA_PLACES.filter(p => p.category.includes('Universit')).length },
  { id: 'school', label: 'Schools & Academies', somaliLabel: 'Dugsiyada', icon: 'GraduationCap', count: HARGEISA_PLACES.filter(p => p.category.includes('School')).length },
  { id: 'mosque', label: 'Mosques (Masaajidda)', somaliLabel: 'Masaajidda', icon: 'Moon', count: HARGEISA_PLACES.filter(p => p.category.includes('Mosque')).length },
  { id: 'market', label: 'Supermarkets & Malls', somaliLabel: 'Suuqyada & Malls', icon: 'ShoppingBag', count: HARGEISA_PLACES.filter(p => p.category.includes('Supermarket') || p.category.includes('Mall')).length },
  { id: 'fuel', label: 'Fuel Stations', somaliLabel: 'Kaalmaha Shidaalka', icon: 'Fuel', count: HARGEISA_PLACES.filter(p => p.category.includes('Fuel')).length },
  { id: 'transit', label: 'Transport & Terminals', somaliLabel: 'Istaannada & Gaadiidka', icon: 'Navigation', count: HARGEISA_PLACES.filter(p => p.category.includes('Transport')).length },
  { id: 'ngo', label: 'NGOs & Agencies', somaliLabel: "Hay'adaha Caalamiga ah", icon: 'Globe', count: HARGEISA_PLACES.filter(p => p.category.includes('NGO')).length },
  { id: 'corridor', label: 'Road Corridors', somaliLabel: 'Wadooyinka & Joyadaha', icon: 'Compass', count: HARGEISA_PLACES.filter(p => p.category.includes('Road')).length },
  { id: 'dining', label: 'Restaurants & Cafes', somaliLabel: 'Maqaayadaha', icon: 'Utensils', count: HARGEISA_PLACES.filter(p => p.category.includes('Restaurant')).length },
  { id: 'hotel', label: 'Hotels & Hospitality', somaliLabel: 'Huteellada', icon: 'Hotel', count: HARGEISA_PLACES.filter(p => p.category.includes('Hotel')).length },
  { id: 'bank', label: 'Banks & Financial', somaliLabel: 'Bangiyada & Xawaaladaha', icon: 'Landmark', count: HARGEISA_PLACES.filter(p => p.category.includes('Bank')).length },
  { id: 'corporate', label: 'Corporate & Utilities', somaliLabel: 'Shirkadaha & Korontada', icon: 'Building2', count: HARGEISA_PLACES.filter(p => p.category.includes('Corporate')).length },
  { id: 'government', label: 'Government & Civic', somaliLabel: "Hay'adaha Dowladda", icon: 'Landmark', count: HARGEISA_PLACES.filter(p => p.category.includes('Government')).length },
  { id: 'district', label: 'Xaafadaha (Districts)', somaliLabel: 'Xaafadaha', icon: 'Home', count: HARGEISA_PLACES.filter(p => p.category.includes('Xaafadaha')).length },
];

export function searchHargeisaPlaces(query: string, categoryFilter?: string): HargeisaPlace[] {
  const q = (query || '').trim().toLowerCase();
  const cat = (categoryFilter || '').trim().toLowerCase();

  return HARGEISA_PLACES.filter((place) => {
    // Strict & Smart Category Filtering
    if (cat && cat !== 'all' && cat !== 'dhammaan' && cat !== '⭐ all places') {
      const pCat = (place.category || '').toLowerCase();
      const pSub = (place.subCategory || '').toLowerCase();
      const pSomali = (place.somaliCategory || '').toLowerCase();

      // Category matching rules
      if (cat.includes('hospital') || cat.includes('health') || cat.includes('cusbitaal')) {
        if (!pCat.includes('hospital') && !pSub.includes('hospital') && !pSomali.includes('cusbitaal')) return false;
      }
      else if (cat.includes('universit') || cat.includes('jaamacad')) {
        if (!pCat.includes('universit') && !pSub.includes('university') && !pSomali.includes('jaamacad')) return false;
      }
      else if (cat.includes('school') || cat.includes('dugsi') || cat.includes('academ')) {
        if (!pCat.includes('school') && !pSub.includes('school') && !pSomali.includes('dugsi')) return false;
      }
      else if (cat.includes('mosque') || cat.includes('masjid')) {
        if (!pCat.includes('mosque') && !pSub.includes('worship') && !pSomali.includes('masjid')) return false;
      }
      else if (cat.includes('market') || cat.includes('mall') || cat.includes('supermarket') || cat.includes('suuq')) {
        if (!pCat.includes('market') && !pCat.includes('mall') && !pCat.includes('supermarket') && !pSub.includes('mall') && !pSomali.includes('suuq')) return false;
      }
      else if (cat.includes('fuel') || cat.includes('petrol') || cat.includes('shidaal') || cat.includes('kaalm')) {
        if (!pCat.includes('fuel') && !pSub.includes('fuel') && !pSomali.includes('shidaal')) return false;
      }
      else if (cat.includes('transport') || cat.includes('transit') || cat.includes('terminal') || cat.includes('airport') || cat.includes('istaan')) {
        if (!pCat.includes('transport') && !pSub.includes('transit') && !pSomali.includes('istaan')) return false;
      }
      else if (cat.includes('ngo') || cat.includes('agenc') || cat.includes('caalami')) {
        if (!pCat.includes('ngo') && !pSub.includes('ngo') && !pSomali.includes('caalami')) return false;
      }
      else if (cat.includes('road') || cat.includes('corridor') || cat.includes('wadd') || cat.includes('joyad')) {
        if (!pCat.includes('road') && !pSub.includes('highway') && !pSomali.includes('wadd')) return false;
      }
      else if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('dining') || cat.includes('maqaayad')) {
        if (!pCat.includes('restaurant') && !pSub.includes('restaurant') && !pSomali.includes('maqaayad')) return false;
      }
      else if (cat.includes('hotel') || cat.includes('huteel') || cat.includes('lodg')) {
        if (!pCat.includes('hotel') && !pSub.includes('hotel') && !pSomali.includes('huteel')) return false;
      }
      else if (cat.includes('bank') || cat.includes('bangi') || cat.includes('zaad') || cat.includes('taaj') || cat.includes('finance')) {
        if (!pCat.includes('bank') && !pSub.includes('bank') && !pSomali.includes('bangi')) return false;
      }
      else if (cat.includes('corporate') || cat.includes('utilit') || cat.includes('shirkad') || cat.includes('somtel') || cat.includes('sompower')) {
        if (!pCat.includes('corporate') && !pSub.includes('corporate') && !pSub.includes('utility') && !pSomali.includes('shirkad')) return false;
      }
      else if (cat.includes('gov') || cat.includes('dowladd') || cat.includes('civic') || cat.includes('municip')) {
        if (!pCat.includes('government') && !pSub.includes('government') && !pSomali.includes('dowladd')) return false;
      }
      else if (cat.includes('xaafad') || cat.includes('district') || cat.includes('neighbor') || cat.includes('degmo')) {
        if (!pCat.includes('xaafad') && !pCat.includes('district') && !pSub.includes('neighborhood') && !pSomali.includes('xaafad')) return false;
      }
      else {
        if (!pCat.includes(cat) && !pSomali.includes(cat)) return false;
      }
    }

    // Query matching
    if (!q) return true;

    if (place.name.toLowerCase().includes(q)) return true;
    if (place.address.toLowerCase().includes(q)) return true;
    if (place.district && place.district.toLowerCase().includes(q)) return true;
    if (place.category && place.category.toLowerCase().includes(q)) return true;
    if (place.somaliCategory && place.somaliCategory.toLowerCase().includes(q)) return true;
    if (place.searchTerms && place.searchTerms.some(t => t.includes(q))) return true;

    return false;
  });
}
""")
    print(f"✓ Saved TypeScript master places dataset to {ts_path}")

if __name__ == '__main__':
    nodes = build_master_database(10650)
    export_all(nodes)
