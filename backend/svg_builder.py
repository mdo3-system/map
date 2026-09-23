import io
import math
from typing import List, Dict, Any, Tuple, Optional
import svgwrite

class SVGBuilder:
    def __init__(self, width_mm: float, height_mm: float, px_per_mm: float = 10.0):
        self.width_mm = width_mm
        self.height_mm = height_mm
        self.px_per_mm = px_per_mm
        self.width_px = width_mm * px_per_mm
        self.height_px = height_mm * px_per_mm

    def build_svg_string(
        self,
        road_data: Dict[str, List[str]],  # {"major": [...], "access": [...]}
        rail_paths: List[str],
        landmarks: List[Dict[str, Any]],
        destination: Dict[str, Any],
        scale_info: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        DTP・印刷クオリティの構造化SVGを生成。
        交差点はストローク重ね合わせにより100%滑らかに一体化される。
        """
        options = options or {}
        bg_color = options.get("bg_color", "#fcfbfa")
        transparent_bg = options.get("transparent_bg", False)
        road_casing_color = options.get("road_casing_color", "#777777")
        road_inner_color = options.get("road_inner_color", "#ffffff")
        show_compass = options.get("show_compass", True)
        show_credit = options.get("show_credit", True)
        show_scale = options.get("show_scale", True)

        dwg = svgwrite.Drawing(
            size=(f"{self.width_mm}mm", f"{self.height_mm}mm"),
            viewBox=f"0 0 {self.width_px} {self.height_px}",
            debug=False
        )

        dwg.defs.add(dwg.style("""
            .map-text { font-family: 'Hiragino Kaku Gothic ProN', 'Meiryo', 'Yu Gothic', 'Noto Sans JP', sans-serif; }
            .dest-box { filter: drop-shadow(0 2px 5px rgba(0,0,0,0.3)); }
            .station-box { filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); }
            .poi-label { font-size: 11px; fill: #222222; font-weight: 500; }
            .scale-text { font-size: 10px; fill: #555555; font-weight: bold; }
            .credit-text { font-size: 8.5px; fill: #999999; }
            .draggable { cursor: move; }
        """))

        # Layer 1: 背景
        layer_bg = dwg.g(id="layer_background")
        if not transparent_bg:
            layer_bg.add(dwg.rect(insert=(0, 0), size=(self.width_px, self.height_px), fill=bg_color, stroke="#cccccc", stroke_width=1))
        dwg.add(layer_bg)

        # Layer 2: 道路網（ストローク重ね合わせ方式：交差点完全結合）
        layer_roads = dwg.g(id="layer_roads")
        major_paths = road_data.get("major", [])
        access_paths = road_data.get("access", [])

        # 1. 外フチ線（Casing）: まず細道、次に大通りのフチを描く
        # 端点と接続部を round にすることで、交差点・T字路の隙間が完全に溶接される！
        for d in access_paths:
            layer_roads.add(dwg.path(d=d, stroke=road_casing_color, stroke_width=8.0, stroke_linecap="round", stroke_linejoin="round", fill="none"))
        for d in major_paths:
            layer_roads.add(dwg.path(d=d, stroke=road_casing_color, stroke_width=13.0, stroke_linecap="round", stroke_linejoin="round", fill="none"))

        # 2. 内側白中抜き（Inner）: 上から白で塗りつぶすことで、交差点でフチが消えて中抜き道路が完成！
        for d in access_paths:
            layer_roads.add(dwg.path(d=d, stroke=road_inner_color, stroke_width=5.5, stroke_linecap="round", stroke_linejoin="round", fill="none"))
        for d in major_paths:
            layer_roads.add(dwg.path(d=d, stroke=road_inner_color, stroke_width=9.5, stroke_linecap="round", stroke_linejoin="round", fill="none"))

        dwg.add(layer_roads)

        # Layer 3: 鉄道
        layer_rails = dwg.g(id="layer_railways")
        for d_str in rail_paths:
            # 下地レール（濃いグレー）
            layer_rails.add(dwg.path(d=d_str, stroke="#333333", stroke_width=4.5, stroke_linecap="square", stroke_linejoin="round", fill="none"))
            # 枕木破線（白）
            layer_rails.add(dwg.path(d=d_str, stroke="#ffffff", stroke_width=2.5, stroke_dasharray="7,7", fill="none"))
        dwg.add(layer_rails)

        # Layer 4: ランドマーク（目印）
        layer_poi = dwg.g(id="layer_landmarks")
        for poi in landmarks:
            if not poi.get("visible", True):
                continue
            x, y = poi["x"], poi["y"]
            name = poi["name"]
            cat = poi.get("category", "")
            icon_type = poi.get("icon_type", "")

            poi_group = dwg.g(id=poi["id"], class_="poi-item draggable", transform=f"translate({x}, {y})")

            if cat == "station":
                # 駅名プレート（濃紺ブルーの角丸長方形＋ハッキリした白文字）
                # 不動産案内図で最も目立つべき最寄り駅
                w = max(len(name) * 14 + 20, 65)
                poi_group.add(dwg.rect(insert=(-w/2, -12), size=(w, 24), rx=5, ry=5, fill="#0d47a1", stroke="#ffffff", stroke_width=1.8, class_="station-box"))
                poi_group.add(dwg.text(name, insert=(0, 5), text_anchor="middle", fill="#ffffff", font_size="13px", font_weight="bold", class_="map-text"))

            elif icon_type == "7eleven":
                poi_group.add(dwg.circle(center=(0, 0), r=9.5, fill="#ff7900", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.circle(center=(0, 0), r=6.5, fill="#008559"))
                poi_group.add(dwg.text("7", insert=(0, 4), text_anchor="middle", fill="#ffffff", font_size="10px", font_weight="bold", class_="map-text"))
                # 白フチ付きテキスト（文字被り防止）
                self._add_halo_text(poi_group, dwg, name, 13, 4, font_size="11px")

            elif icon_type == "lawson":
                poi_group.add(dwg.circle(center=(0, 0), r=9.5, fill="#005bac", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.text("L", insert=(0, 4), text_anchor="middle", fill="#ffffff", font_size="10px", font_weight="bold", class_="map-text"))
                self._add_halo_text(poi_group, dwg, name, 13, 4, font_size="11px")

            elif icon_type == "familymart":
                poi_group.add(dwg.circle(center=(0, 0), r=9.5, fill="#009640", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.circle(center=(0, 0), r=6.5, fill="#007cc2"))
                poi_group.add(dwg.text("F", insert=(0, 4), text_anchor="middle", fill="#ffffff", font_size="10px", font_weight="bold", class_="map-text"))
                self._add_halo_text(poi_group, dwg, name, 13, 4, font_size="11px")

            elif cat == "fuel":
                poi_group.add(dwg.rect(insert=(-9, -9), size=(18, 18), rx=3, ry=3, fill="#c2185b", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.text("GS", insert=(0, 3.5), text_anchor="middle", fill="#ffffff", font_size="8.5px", font_weight="bold", class_="map-text"))
                self._add_halo_text(poi_group, dwg, name, 13, 4, font_size="11px")

            elif cat == "supermarket":
                poi_group.add(dwg.circle(center=(0, 0), r=8.5, fill="#2e7d32", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.text("S", insert=(0, 3.5), text_anchor="middle", fill="#ffffff", font_size="9px", font_weight="bold", class_="map-text"))
                self._add_halo_text(poi_group, dwg, name, 12, 4, font_size="11px")

            elif cat == "post_office":
                poi_group.add(dwg.circle(center=(0, 0), r=8.5, fill="#d32f2f", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.text("〒", insert=(0, 3), text_anchor="middle", fill="#ffffff", font_size="9px", class_="map-text"))
                self._add_halo_text(poi_group, dwg, name, 12, 4, font_size="11px")

            elif cat == "school":
                poi_group.add(dwg.circle(center=(0, 0), r=8.5, fill="#ef6c00", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.text("文", insert=(0, 3.5), text_anchor="middle", fill="#ffffff", font_size="9.5px", font_weight="bold", class_="map-text"))
                self._add_halo_text(poi_group, dwg, name, 12, 4, font_size="11px")

            elif cat == "hospital":
                poi_group.add(dwg.circle(center=(0, 0), r=8.5, fill="#c62828", stroke="#ffffff", stroke_width=1.5))
                poi_group.add(dwg.text("+", insert=(0, 4), text_anchor="middle", fill="#ffffff", font_size="12px", font_weight="bold", class_="map-text"))
                self._add_halo_text(poi_group, dwg, name, 12, 4, font_size="11px")

            elif cat == "signal":
                # 信号機アイコン（黒枠に横3つの丸：青・黄・赤ランプ）
                poi_group.add(dwg.rect(insert=(-17, -8), size=(34, 16), rx=4, ry=4, fill="#1e293b", stroke="#ffffff", stroke_width=1.8))
                poi_group.add(dwg.circle(center=(-10, 0), r=3.8, fill="#00e676", stroke="#ffffff", stroke_width=0.6))
                poi_group.add(dwg.circle(center=(0, 0), r=3.8, fill="#ffd600", stroke="#ffffff", stroke_width=0.6))
                poi_group.add(dwg.circle(center=(10, 0), r=3.8, fill="#ff1744", stroke="#ffffff", stroke_width=0.6))
                self._add_halo_text(poi_group, dwg, name, 0, -12, font_size="11px")

            else:
                poi_group.add(dwg.circle(center=(0, 0), r=6, fill="#616161", stroke="#ffffff", stroke_width=1))
                self._add_halo_text(poi_group, dwg, name, 10, 3.5, font_size="10.5px")

            layer_poi.add(poi_group)
        dwg.add(layer_poi)

        # Layer 5: 目的地（現地）ピン ＆ ラベル
        layer_dest = dwg.g(id="layer_destination")
        dest_x = destination.get("x", self.width_px / 2.0)
        dest_y = destination.get("y", self.height_px / 2.0)
        dest_name = destination.get("name", "現地")

        dest_group = dwg.g(id="dest_pin", class_="destination-item draggable", transform=f"translate({dest_x}, {dest_y})")
        
        # 1. 赤い位置ピン
        dest_group.add(dwg.path(
            d="M 0 0 C -11 -11 -13 -22 0 -32 C 13 -22 11 -11 0 0 Z",
            fill="#d32f2f",
            stroke="#ffffff",
            stroke_width=2.0
        ))
        dest_group.add(dwg.circle(center=(0, -20), r=4.5, fill="#ffffff"))
        
        # 2. 「現地」ラベルプレート（文字潰れを完全に防ぐ大きめの白抜き太字プレート）
        t_w = max(len(dest_name) * 16 + 22, 60)
        dest_group.add(dwg.rect(insert=(12, -34), size=(t_w, 28), rx=6, ry=6, fill="#d32f2f", stroke="#ffffff", stroke_width=2.2, class_="dest-box"))
        dest_group.add(dwg.text(dest_name, insert=(12 + t_w/2, -15), text_anchor="middle", fill="#ffffff", font_size="15px", font_weight="bold", class_="map-text"))

        layer_dest.add(dest_group)
        dwg.add(layer_dest)

        # Layer 6: 方位記号
        if show_compass:
            layer_compass = dwg.g(id="layer_compass")
            comp_x = self.width_px - 32
            comp_y = 32
            comp_group = dwg.g(transform=f"translate({comp_x}, {comp_y})", class_="draggable")
            comp_group.add(dwg.polygon(points=[(0, -18), (6, 5), (0, 1)], fill="#d32f2f"))
            comp_group.add(dwg.polygon(points=[(0, -18), (-6, 5), (0, 1)], fill="#444444"))
            comp_group.add(dwg.text("N", insert=(0, -21), text_anchor="middle", fill="#222222", font_size="11px", font_weight="bold", class_="map-text"))
            layer_compass.add(comp_group)
            dwg.add(layer_compass)

        # Layer 7: スケールバー（縮尺・長さの目安）
        if show_scale and scale_info:
            layer_scale = dwg.g(id="layer_scale")
            bar_px = scale_info.get("bar_px", 80)
            label = scale_info.get("label", "約100m")
            sc_x = 16
            sc_y = self.height_px - 22
            scale_group = dwg.g(transform=f"translate({sc_x}, {sc_y})", class_="draggable")
            
            # 白背景下地
            scale_group.add(dwg.rect(insert=(-4, -14), size=(bar_px + 8, 22), rx=3, ry=3, fill="rgba(255,255,255,0.85)", stroke="none"))
            # スケール目盛りバー
            scale_group.add(dwg.line(start=(0, 2), end=(bar_px, 2), stroke="#333333", stroke_width=2.5))
            scale_group.add(dwg.line(start=(0, -2), end=(0, 6), stroke="#333333", stroke_width=2))
            scale_group.add(dwg.line(start=(bar_px, -2), end=(bar_px, 6), stroke="#333333", stroke_width=2))
            scale_group.add(dwg.text(label, insert=(bar_px / 2, -3), text_anchor="middle", class_="map-text scale-text"))
            layer_scale.add(scale_group)
            dwg.add(layer_scale)

        # Layer 8: クレジット注記
        if show_credit:
            layer_credit = dwg.g(id="layer_credit")
            credit_text = "国土地理院「基盤地図情報」及び OpenStreetMap データを元に作成"
            layer_credit.add(dwg.text(credit_text, insert=(16, self.height_px - 6), class_="map-text credit-text"))
            dwg.add(layer_credit)

        return dwg.tostring()

    def _add_halo_text(self, parent_group: Any, dwg: Any, text: str, x: float, y: float, font_size: str = "11px"):
        """文字の下に白フチ（Halo）を敷いて文字の視認性を劇的に向上させる"""
        # 1. 白フチ用ストロークテキスト
        parent_group.add(dwg.text(
            text,
            insert=(x, y),
            fill="none",
            stroke="#ffffff",
            stroke_width=3.2,
            stroke_linejoin="round",
            font_size=font_size,
            font_weight="bold",
            class_="map-text"
        ))
        # 2. 本文テキスト
        parent_group.add(dwg.text(
            text,
            insert=(x, y),
            fill="#222222",
            font_size=font_size,
            class_="map-text"
        ))
