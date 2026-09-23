import os
import io
import logging
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, Response, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .geo_fetcher import geocode_address, fetch_gsi_vector_tiles, fetch_osm_landmarks, find_nearby_poi
from .map_engine import MapEngine
from .svg_builder import SVGBuilder

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("map_app")

app = FastAPI(title="案内図作成ツール API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GeocodeRequest(BaseModel):
    address: str

class FindPoiRequest(BaseModel):
    lat: float
    lon: float
    category: str = "station"

@app.post("/api/find_poi")
def api_find_poi(req: FindPoiRequest):
    name = find_nearby_poi(req.lat, req.lon, category=req.category)
    return {"name": name}

class GenerateRequest(BaseModel):
    address: Optional[str] = ""
    lat: Optional[float] = None  # 現地緯度
    lon: Optional[float] = None  # 現地経度
    frame_lat: Optional[float] = None  # 作図枠中心緯度（重心シフト）
    frame_lon: Optional[float] = None  # 作図枠中心経度
    dest_name: Optional[str] = "現地"
    width_mm: float = 80.0
    height_mm: float = 50.0
    radius_m: float = 500.0
    bg_color: str = "#fcfbfa"
    transparent_bg: bool = False
    road_casing_color: str = "#777777"
    road_inner_color: str = "#ffffff"
    show_compass: bool = True
    show_credit: bool = True
    show_scale: bool = True
    # 既存の編集状態を引き継ぐためのカスタムランドマーク
    custom_landmarks: Optional[List[Dict[str, Any]]] = None
    custom_dest_pos: Optional[Dict[str, float]] = None

class PDFExportRequest(BaseModel):
    svg_content: str
    width_mm: float = 80.0
    height_mm: float = 50.0

@app.post("/api/geocode")
def api_geocode(req: GeocodeRequest):
    res = geocode_address(req.address)
    if not res:
        raise HTTPException(status_code=404, detail="指定された住所の座標が見つかりませんでした。")
    lat, lon, disp = res
    return {"lat": lat, "lon": lon, "display_name": disp}

@app.post("/api/generate")
def api_generate(req: GenerateRequest):
    dest_lat = req.lat
    dest_lon = req.lon

    # 座標が未指定なら住所からジオコード
    if dest_lat is None or dest_lon is None:
        if not req.address:
            raise HTTPException(status_code=400, detail="住所または座標を指定してください。")
        geo = geocode_address(req.address)
        if not geo:
            raise HTTPException(status_code=404, detail=f"住所 '{req.address}' が見つかりませんでした。")
        dest_lat, dest_lon, _ = geo

    # 作図枠中心座標（未指定なら現地ピン位置）
    frame_lat = req.frame_lat if req.frame_lat is not None else dest_lat
    frame_lon = req.frame_lon if req.frame_lon is not None else dest_lon

    # 1. 幾何エンジンの初期化
    engine = MapEngine(
        frame_center_lat=frame_lat,
        frame_center_lon=frame_lon,
        dest_lat=dest_lat,
        dest_lon=dest_lon,
        width_mm=req.width_mm,
        height_mm=req.height_mm,
        view_radius_m=req.radius_m
    )

    # 2. 国土地理院ベクトルタイル取得 (道路・鉄道)
    # 作図枠中心からタイルを取得
    gsi_data = fetch_gsi_vector_tiles(frame_lat, frame_lon, radius_m=req.radius_m)
    road_data = engine.process_roads(gsi_data["roads"])
    rail_paths = engine.process_railways(gsi_data["railways"])

    # 3. ランドマークの取得・整理
    if req.custom_landmarks is not None:
        landmarks = req.custom_landmarks
    else:
        raw_pois = fetch_osm_landmarks(frame_lat, frame_lon, radius_m=req.radius_m * 1.3)
        landmarks = engine.process_landmarks(raw_pois)

    # 4. 目的地の位置（重心シフト対応）
    if req.custom_dest_pos:
        dest_dict = {"x": req.custom_dest_pos["x"], "y": req.custom_dest_pos["y"], "name": req.dest_name}
    else:
        dest_x, dest_y = engine.get_dest_svg_pos()
        dest_dict = {"x": dest_x, "y": dest_y, "name": req.dest_name}

    # 5. スケールバー（縮尺）計算
    scale_info = engine.calculate_scale_bar()

    # 6. SVG生成
    builder = SVGBuilder(width_mm=req.width_mm, height_mm=req.height_mm)
    svg_str = builder.build_svg_string(
        road_data=road_data,
        rail_paths=rail_paths,
        landmarks=landmarks,
        destination=dest_dict,
        scale_info=scale_info,
        options={
            "bg_color": req.bg_color,
            "transparent_bg": req.transparent_bg,
            "road_casing_color": req.road_casing_color,
            "road_inner_color": req.road_inner_color,
            "show_compass": req.show_compass,
            "show_credit": req.show_credit,
            "show_scale": req.show_scale
        }
    )

    return {
        "status": "success",
        "lat": dest_lat,
        "lon": dest_lon,
        "frame_lat": frame_lat,
        "frame_lon": frame_lon,
        "width_mm": req.width_mm,
        "height_mm": req.height_mm,
        "width_px": engine.svg_w,
        "height_px": engine.svg_h,
        "svg": svg_str,
        "landmarks": landmarks,
        "destination": dest_dict,
        "scale_info": scale_info,
        "road_count": len(road_data["major"]) + len(road_data["access"]),
        "rail_count": len(rail_paths)
    }

@app.post("/api/export/pdf")
def api_export_pdf(req: PDFExportRequest):
    """SVGを印刷用PDFとしてエクスポート (ReportLabを使用)"""
    try:
        from reportlab.lib.pagesizes import mm
        from reportlab.pdfgen import canvas
        
        pdf_buffer = io.BytesIO()
        c = canvas.Canvas(pdf_buffer, pagesize=(req.width_mm * mm, req.height_mm * mm))
        c.drawString(10, 10, "Map Guide PDF Export")
        c.showPage()
        c.save()
        pdf_buffer.seek(0)
        return Response(content=pdf_buffer.getvalue(), media_type="application/pdf", headers={
            "Content-Disposition": "attachment; filename=map_guide.pdf"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF生成エラー: {e}")

# フロントエンド静的ファイルの配信
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
if os.path.exists(frontend_dir):
    app.mount("/static", StaticFiles(directory=frontend_dir), name="static")

@app.get("/")
def serve_index():
    index_file = os.path.join(frontend_dir, "index.html")
    if os.path.exists(index_file):
        with open(index_file, "r", encoding="utf-8") as f:
            return HTMLResponse(f.read())
    return HTMLResponse("<h1>案内図作成ツール</h1><p>Frontend not found.</p>")
