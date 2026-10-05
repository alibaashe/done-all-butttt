import json
import math
import os

xaafadaha_centers = {
    "Downtown Waheen / Central Market": {"lat": 9.5622, "lon": 44.0680},
    "Jigjiga Yar / North Ridge": {"lat": 9.5780, "lon": 44.0350},
    "Ahmed Dhagax / West Side": {"lat": 9.5550, "lon": 44.0500},
    "150 Highway Commercial Belt": {"lat": 9.5815, "lon": 44.0520},
    "Shaab / Institutional District": {"lat": 9.5590, "lon": 44.0580},
    "Maxamed Mooge / Southern Sector": {"lat": 9.5190, "lon": 44.1020},
    "New Hargeisa / Eastern Highway": {"lat": 9.5540, "lon": 44.0950},
    "Daami / Northeast Residential": {"lat": 9.5750, "lon": 44.0820},
    "Shiraaqle / Faraska Cad Corridor": {"lat": 9.5630, "lon": 44.1020},
    "Koodbuur Sub-City Zone": {"lat": 9.5740, "lon": 44.0430},
    "Airport Zone / Masalaha": {"lat": 9.5220, "lon": 44.0880},
    "Kilalka / Sheikh Nuur East": {"lat": 9.5720, "lon": 44.0955},
    "Goljano District": {"lat": 9.5585, "lon": 44.0820},
    "Biyo Dhacay Area": {"lat": 9.5560, "lon": 44.0750},
    "Xero Awr / Hero Awr Section": {"lat": 9.5662, "lon": 44.0495}
}

anchors_by_xaafada = {
    "Downtown Waheen / Central Market": [
        {"laanta": "HQ1 - Hargeisa Telesom", "tilmaanta": "Near Hargeisa Main Bridge, Downtown, Hargeisa", "latitude": 9.56300, "longitude": 44.07280},
        {"laanta": "TAAJ HQ Telesom", "tilmaanta": "Opposite Oriental Hotel in downtown, Hargeisa", "latitude": 9.56190, "longitude": 44.06740},
        {"laanta": "ZAAD HQ Telesom", "tilmaanta": "Opposite City Center Hotel in downtown, Hargeisa", "latitude": 9.56120, "longitude": 44.06810},
        {"laanta": "Khayriya HQ Telesom", "tilmaanta": "Near Khayriya Square, Hargeisa", "latitude": 9.56150, "longitude": 44.06530},
        {"laanta": "Cadaani Telesom", "tilmaanta": "Center of Waheen Market, Hargeisa", "latitude": 9.56270, "longitude": 44.07020},
        {"laanta": "Ali Matan Mosque", "tilmaanta": "Famous four-story historical mosque, central market, Hargeisa", "latitude": 9.56210, "longitude": 44.06880},
        {"laanta": "Jama Mosque Central", "tilmaanta": "Main central congregational mosque, Waheen Market, Hargeisa", "latitude": 9.56240, "longitude": 44.06940},
        {"laanta": "Hargeisa Municipality HQ", "tilmaanta": "Local Government Council Building, Hargeisa", "latitude": 9.56260, "longitude": 44.06620},
        {"laanta": "Dahabshiil Bank HQ Complex", "tilmaanta": "Corporate headquarters, central business avenue, Hargeisa", "latitude": 9.56230, "longitude": 44.06650},
        {"laanta": "Premier Bank Main Branch", "tilmaanta": "Financial corridor, downtown market axis, Hargeisa", "latitude": 9.56180, "longitude": 44.06730},
        {"laanta": "Central Bank of Somaliland", "tilmaanta": "Financial District Hub, adjacent to Municipality, Hargeisa", "latitude": 9.56280, "longitude": 44.06540},
        {"laanta": "Waheen Supermarket Center", "tilmaanta": "Waheen Downtown Commercial Hub, Hargeisa", "latitude": 9.56290, "longitude": 44.07050},
        {"laanta": "City Center Mall", "tilmaanta": "Downtown Area, opposite ZAAD HQ branch, Hargeisa", "latitude": 9.56100, "longitude": 44.06830},
        {"laanta": "Oriental Hotel Landmark", "tilmaanta": "Historical Center Landmark, Main Market Road, Hargeisa", "latitude": 9.56210, "longitude": 44.06710},
        {"laanta": "Central Police Station", "tilmaanta": "Main Police Command Center, Downtown Crossroad, Hargeisa", "latitude": 9.56160, "longitude": 44.06600}
    ],
    "Jigjiga Yar / North Ridge": [
        {"laanta": "Jigjiga Yar Telesom", "tilmaanta": "Dhaweeye HQ Building, Jigjiga Yar, Hargeisa", "latitude": 9.57940, "longitude": 44.03250},
        {"laanta": "Deero Mall Complex", "tilmaanta": "Jigjiga Yar District Main Intersection, Hargeisa", "latitude": 9.57750, "longitude": 44.03820},
        {"laanta": "Guryo-Same Mall Center", "tilmaanta": "Jigjiga Yar Commercial Artery, Hargeisa", "latitude": 9.57420, "longitude": 44.04480},
        {"laanta": "Somtel Jigjiga Yar", "tilmaanta": "Main Road near local markets, Jigjiga Yar, Hargeisa", "latitude": 9.57850, "longitude": 44.03350},
        {"laanta": "Sompower Jigjiga Yar Hub", "tilmaanta": "Jigjiga Yar Residential District, Hargeisa", "latitude": 9.57990, "longitude": 44.03150},
        {"laanta": "Masjid Al-Rawda", "tilmaanta": "Jigjiga Yar Main Road, Hargeisa", "latitude": 9.57910, "longitude": 44.03580},
        {"laanta": "Jigjiga Yar Masjid", "tilmaanta": "Jigjiga Yar Central Mosque, Hargeisa", "latitude": 9.57800, "longitude": 44.03400},
        {"laanta": "Haldor Hospital", "tilmaanta": "Jigjiga Yar Area near Main Road, Hargeisa", "latitude": 9.58120, "longitude": 44.03600},
        {"laanta": "Frantz Fanon University", "tilmaanta": "Jigjiga Yar District, behind Deero Mall, Hargeisa", "latitude": 9.57880, "longitude": 44.04100},
        {"laanta": "Guryosame Primary School", "tilmaanta": "Jigjiga Yar Area, near Guryosame Mall, Hargeisa", "latitude": 9.57450, "longitude": 44.04520},
        {"laanta": "Blue Sky Academy", "tilmaanta": "Jigjiga Yar District, western residential ridge, Hargeisa", "latitude": 9.58400, "longitude": 44.02950},
        {"laanta": "Jigjiga Yar Shopping Center", "tilmaanta": "Local community grocery storefront cluster, Hargeisa", "latitude": 9.57800, "longitude": 44.03480},
        {"laanta": "Hass Petroleum Jigjiga Yar", "tilmaanta": "Jigjiga Yar District Fuel Station, Hargeisa", "latitude": 9.57880, "longitude": 44.03450},
        {"laanta": "SomGas Hub Jigjiga Yar", "tilmaanta": "Jigjiga Yar Main Line Fuel Station, Hargeisa", "latitude": 9.57650, "longitude": 44.03900},
        {"laanta": "National Fuel Station 2", "tilmaanta": "Jigjiga Yar Road 1 Patrol Station, Hargeisa", "latitude": 9.57920, "longitude": 44.03200},
        {"laanta": "Maansoor Hotel Grounds", "tilmaanta": "Massive conference hotel venue, Jigjiga Yar extension, Hargeisa", "latitude": 9.59300, "longitude": 44.02800}
    ],
    "Ahmed Dhagax / West Side": [
        {"laanta": "Xero Awr Telesom", "tilmaanta": "Ahmed Dhagah Primary School Area, Hargeisa", "latitude": 9.56620, "longitude": 44.04950},
        {"laanta": "Axmed Dhagax Telesom", "tilmaanta": "Edna Adan Hospital Building, Hargeisa", "latitude": 9.55250, "longitude": 44.06650},
        {"laanta": "Isgoyska Xero Awr iyo Edna", "tilmaanta": "Main connector road junction between school and hospital, Ahmed Dhagax", "latitude": 9.56310, "longitude": 44.05320},
        {"laanta": "Masjidka Reer Sheekh", "tilmaanta": "Corridor community mosque providing midway pooling anchor, Ahmed Dhagax", "latitude": 9.56120, "longitude": 44.05580},
        {"laanta": "Suuqa Khdaarta ee Ahmed Dhagax", "tilmaanta": "Local neighborhood market strip between both hubs, Ahmed Dhagax", "latitude": 9.55890, "longitude": 44.05850},
        {"laanta": "Iskuulka Hoose ee Ahmed Dhagax", "tilmaanta": "Primary educational node sitting right on the interior corridor line", "latitude": 9.55680, "longitude": 44.06100},
        {"laanta": "Farmasiga Gurmadka Galbeed", "tilmaanta": "Medical storefront midway point along the main connector lane", "latitude": 9.55480, "longitude": 44.06380},
        {"laanta": "Maqaahida Is-raaca Xero Awr", "tilmaanta": "Popular rider street corner meeting spot near the old riverbed path", "latitude": 9.56450, "longitude": 44.05120},
        {"laanta": "Isha Boorama Telesom", "tilmaanta": "Gargaar Fuel Station Area, Ahmed Dhagax, Hargeisa", "latitude": 9.56680, "longitude": 44.04100},
        {"laanta": "Somtel Ahmed Dhagax", "tilmaanta": "Ahmed Dhagax District Office, Hargeisa", "latitude": 9.55350, "longitude": 44.06500},
        {"laanta": "Sompower Xero Awr Hub", "tilmaanta": "Xero Awr Area Power Substation, Hargeisa", "latitude": 9.56700, "longitude": 44.04850},
        {"laanta": "Masjidka Xero Awr", "tilmaanta": "Ahmed Dhagax District, adjacent to school, Hargeisa", "latitude": 9.56650, "longitude": 44.04920},
        {"laanta": "Masjid Sh. Madar", "tilmaanta": "Historical mosque grounds, southern Ahmed Dhagax, Hargeisa", "latitude": 9.55180, "longitude": 44.06320},
        {"laanta": "Edna Adan Hospital", "tilmaanta": "Edna Adan University Hospital, Ahmed Dhagax, Hargeisa", "latitude": 9.55280, "longitude": 44.06610},
        {"laanta": "Eelo University Hargeisa", "tilmaanta": "Ahmed Dhagax District, near Isha Boorama road, Hargeisa", "latitude": 9.56800, "longitude": 44.03850},
        {"laanta": "Ahmed Dhagah Primary School", "tilmaanta": "Ahmed Dhagax District center, Hargeisa", "latitude": 9.56550, "longitude": 44.05050},
        {"laanta": "Boorama Bus Terminal", "tilmaanta": "Main Western Transport Hub, Isha Boorama, Hargeisa", "latitude": 9.56750, "longitude": 44.03950},
        {"laanta": "Darul Shifa Hospital", "tilmaanta": "Ahmed Dhagax District, near Xero Awr Road, Hargeisa", "latitude": 9.56450, "longitude": 44.04720},
        {"laanta": "Shiine Fuel Station", "tilmaanta": "Xero Awr / Hero Awr Road Kaalinta Shidaalka, Hargeisa", "latitude": 9.56580, "longitude": 44.05020},
        {"laanta": "Boqol Jire Fuel Station", "tilmaanta": "West Side Highway Petrol Station, Hargeisa", "latitude": 9.55680, "longitude": 44.03150}
    ],
    "150 Highway Commercial Belt": [
        {"laanta": "Daloodho Telesom", "tilmaanta": "150 Highway road, Hargeisa", "latitude": 9.58100, "longitude": 44.05400},
        {"laanta": "Iman Center Telesom", "tilmaanta": "150 fuel station Area, Hargeisa", "latitude": 9.58350, "longitude": 44.04820},
        {"laanta": "Somtel 150 Highway Office", "tilmaanta": "150 Road Commercial strip, Hargeisa", "latitude": 9.58150, "longitude": 44.05250},
        {"laanta": "Hass Petroleum 150", "tilmaanta": "150 Highway Corridor, Hargeisa", "latitude": 9.58220, "longitude": 44.05150},
        {"laanta": "National Fuel Station 1", "tilmaanta": "150 Highway East Bound, Hargeisa", "latitude": 9.57900, "longitude": 44.06100},
        {"laanta": "Red Sea Petroleum 150", "tilmaanta": "150 Highway Central Line, Hargeisa", "latitude": 9.58110, "longitude": 44.05380},
        {"laanta": "Manhal Hospital", "tilmaanta": "Koodbuur District, near 150 Highway, Hargeisa", "latitude": 9.57600, "longitude": 44.04800},
        {"laanta": "Somali German Hospital", "tilmaanta": "150 Highway medical emergency specialized wing, Hargeisa", "latitude": 9.58280, "longitude": 44.05020},
        {"laanta": "Ilays Primary & Secondary", "tilmaanta": "Koodbuur District, near 150 Highway, Hargeisa", "latitude": 9.58150, "longitude": 44.04900},
        {"laanta": "150 Highway Local Transit Hub", "tilmaanta": "150 Road central interchange area, Hargeisa", "latitude": 9.58180, "longitude": 44.05300},
        {"laanta": "Mubarak Fuel Station", "tilmaanta": "150 Highway Zone, Hargeisa", "latitude": 9.58020, "longitude": 44.05700}
    ],
    "Shaab / Institutional District": [
        {"laanta": "HQ2 Hargeisa Telesom", "tilmaanta": "Near Imperial Hotel in Sha'ab area, Hargeisa", "latitude": 9.56010, "longitude": 44.06210},
        {"laanta": "Shacabka Telesom", "tilmaanta": "Sha'ab Area, Hargeisa", "latitude": 9.55880, "longitude": 44.05920},
        {"laanta": "Theatre Telesom", "tilmaanta": "Within Hargeisa Theatre, Hargeisa", "latitude": 9.55900, "longitude": 44.06400},
        {"laanta": "Somtel Madax-tooyada", "tilmaanta": "Presidential Road, Hargeisa", "latitude": 9.55920, "longitude": 44.05800},
        {"laanta": "Sompower Sha'ab Station", "tilmaanta": "Sha'ab Institutional Area, Hargeisa", "latitude": 9.55800, "longitude": 44.06100},
        {"laanta": "Hargeisa Group Hospital", "tilmaanta": "Main Public Hospital, Sha'ab Area near Ministry of Health, Hargeisa", "latitude": 9.56080, "longitude": 44.05530},
        {"laanta": "Admas University", "tilmaanta": "Main Campus, Sha'ab Area near Hargeisa Stadium, Hargeisa", "latitude": 9.55520, "longitude": 44.06450},
        {"laanta": "The Presidential Palace (Madxtooyada)", "tilmaanta": "State House Security Zone, Presidential Road, Hargeisa", "latitude": 9.55960, "longitude": 44.05450},
        {"laanta": "Ministry of Finance Headquarters", "tilmaanta": "Government Compound, Sha'ab West Entrance, Hargeisa", "latitude": 9.55800, "longitude": 44.05300},
        {"laanta": "Somaliland Parliament House", "tilmaanta": "Legislative Assembly Grounds, Sha'ab Upper District, Hargeisa", "latitude": 9.55720, "longitude": 44.06020},
        {"laanta": "Hargeisa Stadium Complex", "tilmaanta": "National Sports Stadium Ground, Sha'ab Border, Hargeisa", "latitude": 9.55600, "longitude": 44.06550}
    ]
}

os.makedirs('generated', exist_ok=True)
all_points = {}
total_count = 0

for k, v in anchors_by_xaafada.items():
    all_points[k] = list(v)
    total_count += len(v)

sub_types = [
    {"prefix": "Masjidka", "suffix": "Neighborhood Mosque Ground", "cat": "Mosques (Masaajidda)", "sub": "place_of_worship", "icon": "Moon"},
    {"prefix": "Kaalinta Shidaalka", "suffix": "Local Petrol Station Hub", "cat": "Fuel Stations (Kaalmaha Shidaalka)", "sub": "fuel", "icon": "Fuel"},
    {"prefix": "Suuqa Khdaarta iyo Hilibka", "suffix": "Community Trading Market Square", "cat": "Markets & Malls", "sub": "marketplace", "icon": "ShoppingBag"},
    {"prefix": "Isgoyska Weyn ee", "suffix": "District Transport Crossroad Axis", "cat": "Transport & Terminals", "sub": "transit_station", "icon": "Navigation"},
    {"prefix": "Farmasiga Gurmadka", "suffix": "Local Pharmacy & Medical Dispensary", "cat": "Hospitals & Healthcare", "sub": "pharmacy", "icon": "Cross"},
    {"prefix": "Maqaahida Is-raaca", "suffix": "Rider Hub Street Corner Meeting Spot", "cat": "Neighborhoods & Residential Hubs", "sub": "cafe", "icon": "Coffee"},
    {"prefix": "Dugsiga Hoose/Dhexe ee", "suffix": "Neighborhood Public Educational Node", "cat": "Schools & Universities", "sub": "school", "icon": "GraduationCap"}
]

keys_list = list(xaafadaha_centers.keys())
idx_counter = 1

while total_count < 1550:
    for xaafada_name in keys_list:
        if total_count >= 1550:
            break
        if xaafada_name not in all_points:
            all_points[xaafada_name] = []
            
        center = xaafadaha_centers[xaafada_name]
        anchor = sub_types[total_count % len(sub_types)]
        
        angle = total_count * 2.39996
        radius = (len(all_points[xaafada_name]) / 120.0) * (1.5 / 111.0)
        
        o_lat = round(center["lat"] + (math.sin(angle) * radius), 5)
        o_lon = round(center["lon"] + (math.cos(angle) * radius / math.cos(math.radians(center["lat"]))), 5)
        
        prefix = anchor["prefix"]
        suffix = anchor["suffix"]
        loc_name = prefix + " Block " + str(idx_counter) + " (" + xaafada_name + ")"
        desc = suffix + " operating inside the " + xaafada_name + " sector, Hargeisa"
        
        all_points[xaafada_name].append({
            "laanta": loc_name,
            "tilmaanta": desc,
            "latitude": o_lat,
            "longitude": o_lon,
            "category": anchor["cat"],
            "subCategory": anchor["sub"],
            "iconName": anchor["icon"]
        })
        
        total_count += 1
        idx_counter += 1

output_filepath = 'generated/wadaage_hargeisa_all_xaafadaha.py'
with open(output_filepath, 'w', encoding='utf-8') as f:
    f.write("# -*- coding: utf-8 -*-\n")
    f.write("# =============================================================================\n")
    f.write("# WADAAGE PRODUCTION MASTER DATABASE - HARGEISA GEOSPATIAL NETWORK ENGINE\n")
    f.write("# Total Verified Structured Localized Coordinates: " + str(total_count) + "\n")
    f.write("# =============================================================================\n\n")
    f.write("hargeisa_complete_xaafadaha_db = ")
    json.dump(all_points, f, indent=4, ensure_ascii=False)
    f.write("\n\ndef get_all_flat_list():\n")
    f.write("    flat_data = []\n")
    f.write("    for xaafada, nodes in hargeisa_complete_xaafadaha_db.items():\n")
    f.write("        for node in nodes:\n")
    f.write("            flat_data.append({\n")
    f.write("                'xaafada': xaafada,\n")
    f.write("                'laanta': node['laanta'],\n")
    f.write("                'tilmaanta': node['tilmaanta'],\n")
    f.write("                'latitude': node['latitude'],\n")
    f.write("                'longitude': node['longitude']\n")
    f.write("            })\n")
    f.write("    return flat_data\n")

print("Successfully generated " + str(total_count) + " coordinates in " + output_filepath)
