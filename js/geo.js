// ==========================================
// geo.js: 座標変換・幾何計算ユーティリティ (SRP)
// ==========================================

export const GeoUtil = {
  /**
   * 緯度経度を SVG キャンバス上のピクセル座標 [x, y] に変換
   * @param {number} lon 経度
   * @param {number} lat 緯度
   * @param {number} wPx キャンバス幅 (px)
   * @param {number} hPx キャンバス高 (px)
   * @param {object} frameCenter 中心座標 { lat, lon }
   * @param {number} effectiveRadiusM 実効視野半径 (m)
   * @param {number} widthMm 用紙幅 (mm)
   * @param {number} heightMm 用紙高 (mm)
   */
  geoToSvg(lon, lat, wPx, hPx, frameCenter, effectiveRadiusM, widthMm, heightMm) {
    const aspect = heightMm / widthMm;
    const rangeX = effectiveRadiusM;
    const rangeY = effectiveRadiusM * aspect;

    const mPerLat = 111132.0;
    const mPerLon = 111319.5 * Math.cos(frameCenter.lat * Math.PI / 180.0);

    const dxM = (lon - frameCenter.lon) * mPerLon;
    const dyM = (lat - frameCenter.lat) * mPerLat;

    const x = (wPx / 2.0) + (dxM / rangeX) * (wPx / 2.0);
    const y = (hPx / 2.0) - (dyM / rangeY) * (hPx / 2.0);

    return [x, y];
  },

  /**
   * SVG キャンバスピクセル座標 [x, y] を緯度経度 [lon, lat] に逆変換
   */
  svgToGeo(x, y, wPx, hPx, frameCenter, effectiveRadiusM, widthMm, heightMm) {
    const aspect = heightMm / widthMm;
    const rangeX = effectiveRadiusM;
    const rangeY = effectiveRadiusM * aspect;

    const mPerLat = 111132.0;
    const mPerLon = 111319.5 * Math.cos(frameCenter.lat * Math.PI / 180.0);

    const dxM = ((x - wPx / 2.0) / (wPx / 2.0)) * rangeX;
    const dyM = -((y - hPx / 2.0) / (hPx / 2.0)) * rangeY;

    const lon = frameCenter.lon + dxM / mPerLon;
    const lat = frameCenter.lat + dyM / mPerLat;

    return [lon, lat];
  },

  /**
   * 2点間の距離 (m)
   */
  distanceMeters(lat1, lon1, lat2, lon2) {
    const mPerLat = 111132.0;
    const mPerLon = 111319.5 * Math.cos(((lat1 + lat2) / 2.0) * Math.PI / 180.0);
    const dy = (lat2 - lat1) * mPerLat;
    const dx = (lon2 - lon1) * mPerLon;
    return Math.sqrt(dx * dx + dy * dy);
  },

  /**
   * 縮尺 1/scale と 用紙幅 widthMm (mm) から厳密な実効視野半径 (m) を算出
   * 例: scale=2500, widthMm=297 (A4横) -> 297 * 2.5 / 2 = 371.25m
   */
  scaleToEffectiveRadius(scale, widthMm) {
    const metersPerMm = scale / 1000.0;
    const totalWidthMeters = widthMm * metersPerMm;
    return totalWidthMeters / 2.0;
  },

  /**
   * 緯度経度を Webメルカトル タイル座標 (x, y) に変換
   */
  lonLatToTile(lon, lat, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180.0) / 360.0 * n);
    const latRad = (lat * Math.PI) / 180.0;
    const y = Math.floor((1.0 - Math.asinh(Math.tan(latRad)) / Math.PI) / 2.0 * n);
    return { x, y, z: zoom };
  },

  /**
   * タイル座標 (x, y, zoom) の北西端（左上）の緯度経度 [lon, lat]
   */
  tileToLonLat(x, y, zoom) {
    const n = Math.pow(2, zoom);
    const lon = (x / n) * 360.0 - 180.0;
    const latRad = Math.atan(Math.sinh(Math.PI * (1.0 - (2.0 * y) / n)));
    const lat = (latRad * 180.0) / Math.PI;
    return { lon, lat };
  }
};
