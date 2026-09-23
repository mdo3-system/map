import math
import requests
import json
import logging
from typing import List, Dict, Any, Tuple, Optional

logger = logging.getLogger(__name__)

def deg2num(lat_deg: float, lon_deg: float, zoom: int) -> Tuple[int, int]:
    """緯度経度からタイル座標 (x, y) を計算"""
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

KNOWN_LOCATIONS = {
    "大宮駅": (35.90637, 139.62433, "埼玉県さいたま市大宮区大宮駅"),
    "大宮駅東口": (35.90637, 139.62550, "埼玉県さいたま市大宮区大門町"),
    "大宮駅西口": (35.90610, 139.62250, "埼玉県さいたま市大宮区桜木町"),
    "浦和駅": (35.85897, 139.65715, "埼玉県さいたま市浦和区高砂"),
    "浦和駅西口": (35.85897, 139.65600, "埼玉県さいたま市浦和区高砂"),
    "浦和駅東口": (35.85897, 139.65850, "埼玉県さいたま市浦和区東高砂町"),
    "新宿駅": (35.69092, 139.70025, "東京都新宿区新宿3丁目"),
    "新宿駅東口": (35.69120, 139.70150, "東京都新宿区新宿3丁目"),
    "川越駅": (35.90695, 139.48550, "埼玉県川越市脇田町"),
    "川越駅東口": (35.90695, 139.48650, "埼玉県川越市脇田町"),
}

def geocode_address(address: str) -> Optional[Tuple[float, float, str]]:
    """
    住所文字列から (lat, lon, display_name) を取得する。
    1. 主要地点キャッシュ/プリセット
    2. 国土地理院 ジオコーダー (msearch)
    3. OSM Nominatim fallback
    """
    address = address.strip()
    if not address:
        return None

    for name, loc in KNOWN_LOCATIONS.items():
        if name in address or address in name:
            return loc

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*"
    }

    # 1. 国土地理院 msearch
    try:
        url = "https://msearch.gsi.go.jp/msearch/msearch.jsp"
        res = requests.get(url, params={"q": address}, headers=headers, timeout=5)
        if res.status_code == 200:
            data = res.json()
            if data and len(data) > 0 and "geometry" in data[0]:
                coords = data[0]["geometry"]["coordinates"]
                title = data[0].get("properties", {}).get("title", address)
                return (float(coords[1]), float(coords[0]), title)
    except Exception as e:
        logger.warning(f"GSI geocode error: {e}")

    # 2. OSM Nominatim (fallback)
    try:
        url = "https://nominatim.openstreetmap.org/search"
        params = {"q": address, "format": "json", "countrycodes": "jp", "limit": 1}
        res = requests.get(url, params=params, headers=headers, timeout=6)
        if res.status_code == 200:
            data = res.json()
            if data:
                lat = float(data[0]["lat"])
                lon = float(data[0]["lon"])
                disp = data[0].get("display_name", address)
                return (lat, lon, disp)
    except Exception as e:
        logger.warning(f"OSM Nominatim error: {e}")

    return None

def fetch_gsi_vector_tiles(center_lat: float, center_lon: float, radius_m: float = 600) -> Dict[str, List[Dict[str, Any]]]:
    """
    国土地理院ベクトルタイルから中心座標周辺の道路中心線(RdEdg)および鉄道中心線(RailCL)を取得する。
    """
    zoom = 16
    cx, cy = deg2num(center_lat, center_lon, zoom)
    
    # 半径に応じたタイル探索幅 (zoom 16 では 1タイル約 500〜600m)
    tile_radius = 1
    if radius_m > 700:
        tile_radius = 2

    road_features = []
    rail_features = []
    seen_road_ids = set()
    seen_rail_ids = set()

    for dx in range(-tile_radius, tile_radius + 1):
        for dy in range(-tile_radius, tile_radius + 1):
            tx, ty = cx + dx, cy + dy
            # 道路
            url_rd = f"https://cyberjapandata.gsi.go.jp/xyz/experimental_rdcl/{zoom}/{tx}/{ty}.geojson"
            try:
                r = requests.get(url_rd, timeout=6)
                if r.status_code == 200:
                    data = r.json()
                    for feat in data.get("features", []):
                        rid = feat.get("properties", {}).get("rID") or str(feat.get("geometry", {}).get("coordinates", [])[:2])
                        if rid not in seen_road_ids:
                            seen_road_ids.add(rid)
                            road_features.append(feat)
            except Exception:
                pass

            # 鉄道
            url_rail = f"https://cyberjapandata.gsi.go.jp/xyz/experimental_railcl/{zoom}/{tx}/{ty}.geojson"
            try:
                r = requests.get(url_rail, timeout=6)
                if r.status_code == 200:
                    data = r.json()
                    for feat in data.get("features", []):
                        rid = feat.get("properties", {}).get("rID") or str(feat.get("geometry", {}).get("coordinates", [])[:2])
                        if rid not in seen_rail_ids:
                            seen_rail_ids.add(rid)
                            rail_features.append(feat)
            except Exception:
                pass

    return {
        "roads": road_features,
        "railways": rail_features
    }

def fetch_osm_landmarks(center_lat: float, center_lon: float, radius_m: float = 800) -> List[Dict[str, Any]]:
    """
    OSM Overpass API を用いて指定半径内の主要ランドマーク（コンビニ、GS、駅、スーパー、郵便局、学校等）を取得。
    駅に関しては少し広めの半径（最大2000m）まで探索して確実に捕捉する。
    """
    station_radius = max(radius_m * 1.5, 1500)
    query = f"""
[out:json][timeout:15];
(
  node["shop"="convenience"](around:{radius_m},{center_lat},{center_lon});
  node["amenity"="fuel"](around:{radius_m},{center_lat},{center_lon});
  node["railway"="station"](around:{station_radius},{center_lat},{center_lon});
  way["railway"="station"](around:{station_radius},{center_lat},{center_lon});
  node["shop"="supermarket"](around:{radius_m},{center_lat},{center_lon});
  node["amenity"="post_office"](around:{radius_m},{center_lat},{center_lon});
  node["amenity"="school"](around:{radius_m},{center_lat},{center_lon});
  node["amenity"="hospital"](around:{radius_m},{center_lat},{center_lon});
  node["highway"="traffic_signals"](around:{radius_m},{center_lat},{center_lon});
);
out center body;
"""
    url = "https://overpass-api.de/api/interpreter"
    headers = {"User-Agent": "MapGuideApp/1.0"}
    landmarks = []
    try:
        res = requests.post(url, data={"data": query}, headers=headers, timeout=12)
        if res.status_code == 200:
            data = res.json()
            for el in data.get("elements", []):
                tags = el.get("tags", {})
                lat = el.get("lat") or el.get("center", {}).get("lat")
                lon = el.get("lon") or el.get("center", {}).get("lon")
                if lat is None or lon is None:
                    continue

                category = "other"
                icon_type = "landmark"
                name = tags.get("name", "")

                if tags.get("shop") == "convenience":
                    category = "convenience"
                    brand = tags.get("brand") or tags.get("operator") or ""
                    if "セブン" in brand or "7-Eleven" in brand or "セブン" in name:
                        icon_type = "7eleven"
                        if not name: name = "セブン-イレブン"
                    elif "ローソン" in brand or "Lawson" in brand or "ローソン" in name:
                        icon_type = "lawson"
                        if not name: name = "ローソン"
                    elif "ファミリーマート" in brand or "FamilyMart" in brand or "ファミマ" in name:
                        icon_type = "familymart"
                        if not name: name = "ファミリーマート"
                    elif "ミニストップ" in brand or "Ministop" in brand:
                        icon_type = "ministop"
                        if not name: name = "ミニストップ"
                    else:
                        icon_type = "convenience"
                        if not name: name = "コンビニ"

                elif tags.get("amenity") == "fuel":
                    category = "fuel"
                    icon_type = "gas_station"
                    if not name:
                        name = tags.get("brand") or "GS"

                elif tags.get("railway") == "station":
                    category = "station"
                    icon_type = "station"
                    if not name: name = "駅"
                    if not name.endswith("駅"):
                        name += "駅"

                elif tags.get("shop") == "supermarket":
                    category = "supermarket"
                    icon_type = "supermarket"
                    if not name: name = "スーパー"

                elif tags.get("amenity") == "post_office":
                    category = "post_office"
                    icon_type = "post"
                    if not name: name = "郵便局"

                elif tags.get("amenity") == "school":
                    category = "school"
                    icon_type = "school"
                    if not name: name = "学校"

                elif tags.get("amenity") == "hospital":
                    category = "hospital"
                    icon_type = "hospital"
                    if not name: name = "病院"

                elif tags.get("highway") == "traffic_signals":
                    category = "signal"
                    icon_type = "signal"
                    # 信号機は名前がある場合のみ
                    if not name:
                        continue

                landmarks.append({
                    "id": f"poi_{el['id']}",
                    "name": name,
                    "category": category,
                    "icon_type": icon_type,
                    "lat": lat,
                    "lon": lon,
                    "tags": tags
                })
    except Exception as e:
        logger.warning(f"Overpass API fetch error: {e}")

    return landmarks

def find_nearby_poi(lat: float, lon: float, category: str = "station", radius_m: float = 600) -> Optional[str]:
    """クリックした地点の周辺から該当カテゴリ（駅など）の名前を自動取得"""
    if category == "station":
        query = f"""
[out:json][timeout:6];
(
  node["railway"="station"](around:{radius_m},{lat},{lon});
  way["railway"="station"](around:{radius_m},{lat},{lon});
);
out tags center;
"""
    else:
        query = f"""
[out:json][timeout:6];
(
  node(around:{radius_m},{lat},{lon});
  way(around:{radius_m},{lat},{lon});
);
out tags center;
"""
    url = "https://overpass-api.de/api/interpreter"
    headers = {"User-Agent": "MapGuideApp/1.0"}
    try:
        res = requests.post(url, data={"data": query}, headers=headers, timeout=6)
        if res.status_code == 200:
            data = res.json()
            elements = data.get("elements", [])
            for el in elements:
                name = el.get("tags", {}).get("name")
                if name:
                    if category == "station" and not name.endswith("駅"):
                        name += "駅"
                    return name
    except Exception as e:
        logger.warning(f"find_nearby_poi error: {e}")

    # Fallback: OSM Nominatim reverse
    try:
        rev_url = f"https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json&zoom=18"
        r = requests.get(rev_url, headers=headers, timeout=4)
        if r.status_code == 200:
            d = r.json()
            namedetails = d.get("namedetails", {})
            name = namedetails.get("name") or d.get("name")
            if name:
                if category == "station" and not name.endswith("駅"):
                    name += "駅"
                return name
    except Exception:
        pass

    return None
