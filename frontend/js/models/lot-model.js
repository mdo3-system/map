// ==========================================
// lot-model.js: 敷地（区画）ドメインモデル (SRP)
// 責務: 敷地データの保持、重心計算、引き出し線座標算出、プロパティ検証
// ==========================================

export class LotModel {
  constructor(data = {}) {
    this.id = data.id || `lot_${Date.now()}`;
    this.points = data.points || []; // [{ lat, lon }, ...]
    this.isSite = !!data.isSite;
    this.label = data.label !== undefined ? data.label : (this.isSite ? "申請地" : "");
    this.fontSize = data.fontSize || 16;
    this.hasLeaderLine = !!data.hasLeaderLine;
    this.labelOffsetX = data.labelOffsetX !== undefined ? data.labelOffsetX : (this.isSite ? 70 : 60);
    this.labelOffsetY = data.labelOffsetY !== undefined ? data.labelOffsetY : -50;
    
    // スタイル
    this.hasFill = data.hasFill !== false;
    this.fillColor = data.fillColor || (this.isSite ? "#ef4444" : "#3b82f6");
    this.fillOpacity = data.fillOpacity !== undefined ? data.fillOpacity : (this.isSite ? 0.35 : 0.25);
    this.hasStroke = data.hasStroke !== false;
    this.strokeColor = data.strokeColor || (this.isSite ? "#dc2626" : "#2563eb");
    this.strokeWidth = data.strokeWidth !== undefined ? data.strokeWidth : (this.isSite ? 4.0 : 2.5);
    this.strokeDash = data.strokeDash || "solid";
  }

  /**
   * SVG座標系での重心 (cx, cy) を算出
   */
  getCentroidSvg(geoToSvg, wPx, hPx, frameCenter, effRadius, widthMm, heightMm) {
    if (!this.points || this.points.length === 0) return { cx: 0, cy: 0 };
    let cx = 0, cy = 0;
    this.points.forEach(p => {
      const [x, y] = geoToSvg(p.lon, p.lat, wPx, hPx, frameCenter, effRadius, widthMm, heightMm);
      cx += x;
      cy += y;
    });
    return {
      cx: cx / this.points.length,
      cy: cy / this.points.length
    };
  }

  /**
   * 地理座標（緯度経度）での重心を算出
   */
  getCentroidGeo() {
    if (!this.points || this.points.length === 0) return { lat: 0, lon: 0 };
    let lat = 0, lon = 0;
    this.points.forEach(p => {
      lat += p.lat;
      lon += p.lon;
    });
    return {
      lat: lat / this.points.length,
      lon: lon / this.points.length
    };
  }

  /**
   * 引き出し線の終点（ラベル位置）を算出
   */
  getLeaderEndPoints(cx, cy) {
    const lx = cx + (this.labelOffsetX !== undefined ? this.labelOffsetX : (this.isSite ? 70 : 60));
    const ly = cy + (this.labelOffsetY !== undefined ? this.labelOffsetY : -50);
    return { lx, ly };
  }

  /**
   * ラベルプレートの寸法 (幅, 高さ) を算出
   */
  getPlateDimensions() {
    const fSize = this.fontSize || 16;
    const lines = (this.label || "").split("\n");
    const maxLineLen = Math.max(...lines.map(l => l.length), 1);
    const width = Math.max(maxLineLen * (fSize + 4) + 24, 70);
    const height = (fSize * 1.35) * lines.length + 14;
    return { width, height, fSize };
  }
}
