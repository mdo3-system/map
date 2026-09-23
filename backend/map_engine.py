import math
from typing import List, Dict, Any, Tuple, Optional
from shapely.geometry import LineString, MultiLineString, Point, box

class MapEngine:
    def __init__(
        self,
        frame_center_lat: float,
        frame_center_lon: float,
        dest_lat: float,
        dest_lon: float,
        width_mm: float = 80.0,
        height_mm: float = 50.0,
        view_radius_m: float = 500.0,
        px_per_mm: float = 10.0  # 1mm = 10px (80mm -> 800px, 50mm -> 500px)
    ):
        self.frame_center_lat = frame_center_lat
        self.frame_center_lon = frame_center_lon
        self.dest_lat = dest_lat
        self.dest_lon = dest_lon
        self.width_mm = width_mm
        self.height_mm = height_mm
        self.px_per_mm = px_per_mm
        
        self.svg_w = width_mm * px_per_mm
        self.svg_h = height_mm * px_per_mm
        self.view_radius_m = view_radius_m
        
        aspect = self.svg_h / self.svg_w
        self.range_m_x = view_radius_m
        self.range_m_y = view_radius_m * aspect

        self.m_per_lat = 111132.0
        self.m_per_lon = 111319.5 * math.cos(math.radians(frame_center_lat))

    def geo_to_svg(self, lon: float, lat: float) -> Tuple[float, float]:
        """緯度経度を作図枠（SVGキャンバス）座標 (x, y) に投影"""
        dx_m = (lon - self.frame_center_lon) * self.m_per_lon
        dy_m = (lat - self.frame_center_lat) * self.m_per_lat
        x = self.svg_w / 2.0 + (dx_m / self.range_m_x) * (self.svg_w / 2.0)
        y = self.svg_h / 2.0 - (dy_m / self.range_m_y) * (self.svg_h / 2.0)
        return (x, y)

    def is_point_in_canvas(self, x: float, y: float, margin: float = 40.0) -> bool:
        return -margin <= x <= self.svg_w + margin and -margin <= y <= self.svg_h + margin

    def get_dest_svg_pos(self) -> Tuple[float, float]:
        """現地のSVG座標を取得"""
        return self.geo_to_svg(self.dest_lon, self.dest_lat)

    def process_roads(self, road_features: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        道路網を「主要幹線」と「現地へのアクセス道路」に厳選し、
        交差点が100%完全に滑らかにつながるストローク重ね合わせ用パス（d属性）を生成する。
        """
        dest_x, dest_y = self.get_dest_svg_pos()
        dest_pt = Point(dest_x, dest_y)

        major_paths = []
        access_paths = []

        for feat in road_features:
            geom = feat.get("geometry", {})
            props = feat.get("properties", {})
            coords = geom.get("coordinates", [])
            gtype = geom.get("type")

            lines_coords = []
            if gtype == "LineString":
                lines_coords.append(coords)
            elif gtype == "MultiLineString":
                lines_coords.extend(coords)

            for c_list in lines_coords:
                if len(c_list) < 2:
                    continue
                pts = [self.geo_to_svg(p[0], p[1]) for p in c_list]
                
                # キャンバス範囲に全く入っていない線分は除外
                if not any(self.is_point_in_canvas(p[0], p[1], margin=60.0) for p in pts):
                    continue

                line = LineString(pts)
                line_len = line.length
                dist_to_dest = line.distance(dest_pt)

                width_val = float(props.get("Width", 0) or 0)
                rnk_width = props.get("rnkWidth", "")
                rd_ctg = props.get("rdCtg", "")

                # 主要道路判定: 幅員5.5m以上、国道、県道、主要地方道
                is_major = (
                    width_val >= 5.5 or
                    any(rw in rnk_width for rw in ["5.5m", "13.0m", "19.5m"]) or
                    any(kw in rd_ctg for kw in ["国道", "主要地方道", "県道", "主要"])
                )

                # 現地へのアクセス道路判定: 現地から180px以内の接道・連絡路
                is_access = (dist_to_dest < 180.0 and width_val >= 3.0) or (dist_to_dest < 90.0)

                # 案内図の視認性を劇的に高める間引きフィルタ:
                # 主要道路でもなく、現地へのアクセス道でもない枝道・路地はバッサリ削除！
                if not is_major and not is_access:
                    continue

                # 短すぎる袋小路も削除
                if not is_major and line_len < 35.0:
                    continue

                d_str = "M " + " L ".join(f"{p[0]:.2f} {p[1]:.2f}" for p in pts)
                if is_major:
                    major_paths.append(d_str)
                else:
                    access_paths.append(d_str)

        return {
            "major": major_paths,
            "access": access_paths
        }

    def process_railways(self, rail_features: List[Dict[str, Any]]) -> List[str]:
        """鉄道中心線のSVGパスを生成"""
        rail_paths = []
        for feat in rail_features:
            geom = feat.get("geometry", {})
            coords = geom.get("coordinates", [])
            gtype = geom.get("type")

            lines_coords = []
            if gtype == "LineString":
                lines_coords.append(coords)
            elif gtype == "MultiLineString":
                lines_coords.extend(coords)

            for c_list in lines_coords:
                if len(c_list) < 2:
                    continue
                pts = [self.geo_to_svg(p[0], p[1]) for p in c_list]
                if any(self.is_point_in_canvas(p[0], p[1], margin=50.0) for p in pts):
                    d_str = "M " + " L ".join(f"{p[0]:.2f} {p[1]:.2f}" for p in pts)
                    rail_paths.append(d_str)

        return rail_paths

    def process_landmarks(self, raw_landmarks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        ランドマークを画面内にプロット。駅・コンビニ・GS・スーパーの重なりを解消。
        """
        processed = []
        priority_map = {
            "station": 1,
            "convenience": 2,
            "fuel": 3,
            "supermarket": 4,
            "post_office": 5,
            "school": 6,
            "hospital": 7,
            "signal": 8,
            "other": 9
        }
        sorted_raw = sorted(raw_landmarks, key=lambda x: priority_map.get(x.get("category", ""), 10))

        occupied_boxes = []

        for item in sorted_raw:
            x, y = self.geo_to_svg(item["lon"], item["lat"])
            # 作図枠の内側（少し余白あり）にあるか
            if not (15.0 <= x <= self.svg_w - 15.0 and 15.0 <= y <= self.svg_h - 15.0):
                continue

            too_close = False
            for bx, by, br in occupied_boxes:
                if math.hypot(x - bx, y - by) < br:
                    too_close = True
                    break

            if too_close and item.get("category") != "station":
                continue

            radius_protect = 40.0 if item.get("category") == "station" else 24.0
            occupied_boxes.append((x, y, radius_protect))

            processed.append({
                "id": item["id"],
                "name": item["name"],
                "category": item["category"],
                "icon_type": item["icon_type"],
                "x": round(x, 1),
                "y": round(y, 1),
                "visible": True
            })

        return processed

    def calculate_scale_bar(self) -> Dict[str, Any]:
        """作図枠に合わせた縮尺・スケールバー（長さの目安）の長さを計算"""
        # 1ピクセルあたりのメートル長
        m_per_px = (self.range_m_x * 2.0) / self.svg_w
        
        # 目安として 50m, 100m, 200m, 500m のうち、バー長が 60〜140px に収まる値を選択
        target_meters = [50, 100, 200, 300, 500, 1000]
        best_m = 100
        for m in target_meters:
            px = m / m_per_px
            if 50.0 <= px <= 140.0:
                best_m = m
                break

        bar_px = best_m / m_per_px
        label = f"約{best_m}m" if best_m < 1000 else f"約{best_m//1000}km"

        return {
            "meters": best_m,
            "bar_px": round(bar_px, 1),
            "label": label
        }
