// ==========================================
// tile-renderer.js: 背景地図タイル合成レンダラー (SRP)
// 責務: 国土地理院タイルおよびOSMタイルのWebメルカトル計算・ズーム上限クランプ・SVG <image> 生成のみを担当
// ==========================================

import { GeoUtil } from "../geo.js";

export class TileRenderer {
  /**
   * 各種申請用 作図枠内に配置する背景タイルのSVG文字列を生成
   */
  static render(state, wPx, hPx, widthMm, heightMm, effRadius) {
    const info = state.permitInfo || {};
    const baseType = info.baseMapType || "osm";
    let defaultZoom = 17;
    if (baseType === "blank") defaultZoom = 14;
    let zoom = info.tileZoom ? parseInt(info.tileZoom, 10) : defaultZoom;
    if (isNaN(zoom)) zoom = defaultZoom;

    // タイル上限ズームの厳格なクランプ（404全滅・地図消失バグの防止）
    if (baseType === "blank") {
      zoom = Math.min(zoom, 14); // 国土地理院白地図はズーム14が上限
    } else if (baseType !== "osm") {
      zoom = Math.min(zoom, 18); // 国土地理院淡色・標準・写真はズーム18が上限
    } else {
      zoom = Math.min(zoom, 19); // OSMはズーム19が上限
    }

    // キャンバス四隅の緯度経度
    const [leftLon, topLat] = GeoUtil.svgToGeo(0, 0, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);
    const [rightLon, bottomLat] = GeoUtil.svgToGeo(wPx, hPx, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);

    const minTile = GeoUtil.lonLatToTile(Math.min(leftLon, rightLon), Math.max(topLat, bottomLat), zoom);
    const maxTile = GeoUtil.lonLatToTile(Math.max(leftLon, rightLon), Math.min(topLat, bottomLat), zoom);

    const tileMinX = minTile.x - 1;
    const tileMaxX = maxTile.x + 1;
    const tileMinY = minTile.y - 1;
    const tileMaxY = maxTile.y + 1;

    let tileSvg = `<g id="permit_background_tiles" class="permit-bg-tiles" opacity="0.95">`;

    for (let ty = tileMinY; ty <= tileMaxY; ty++) {
      for (let tx = tileMinX; tx <= tileMaxX; tx++) {
        const nw = GeoUtil.tileToLonLat(tx, ty, zoom);
        const se = GeoUtil.tileToLonLat(tx + 1, ty + 1, zoom);

        const [x1, y1] = GeoUtil.geoToSvg(nw.lon, nw.lat, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);
        const [x2, y2] = GeoUtil.geoToSvg(se.lon, se.lat, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);

        const tileW = Math.abs(x2 - x1);
        const tileH = Math.abs(y2 - y1);
        const tileX = Math.min(x1, x2);
        const tileY = Math.min(y1, y2);

        let tileUrl = "";
        if (baseType === "osm") {
          tileUrl = `https://tile.openstreetmap.org/${zoom}/${tx}/${ty}.png`;
        } else {
          const ext = (baseType === "seamlessphoto") ? "jpg" : "png";
          tileUrl = `https://cyberjapandata.gsi.go.jp/xyz/${baseType}/${zoom}/${tx}/${ty}.${ext}`;
        }
        tileSvg += `<image href="${tileUrl}" x="${tileX.toFixed(1)}" y="${tileY.toFixed(1)}" width="${tileW.toFixed(1)}" height="${tileH.toFixed(1)}" preserveAspectRatio="none"/>`;
      }
    }
    tileSvg += `</g>`;
    return tileSvg;
  }
}
