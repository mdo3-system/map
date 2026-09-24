// ==========================================
// svg-builder.js: 案内図SVGレンダラー (SRP)
// ==========================================
import { GeoUtil } from "./geo.js";

export class SvgBuilder {
  /**
   * 複数行テキストを <tspan> でレンダリング
   */
  static renderMultilineText(text, fontSize, anchor = "middle") {
    const lines = (text || "").split("\n");
    if (lines.length <= 1) {
      return text;
    }
    const lineHeight = fontSize * 1.25;
    const totalHeight = (lines.length - 1) * lineHeight;
    const startY = -(totalHeight / 2);

    return lines.map((line, idx) => {
      const y = startY + idx * lineHeight;
      return `<tspan x="0" y="${y.toFixed(1)}" text-anchor="${anchor}">${line}</tspan>`;
    }).join("");
  }

  /**
   * カギ型・折れ線の引き出し線パスを生成
   */
  static buildLeaderLine(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let pathD = "";

    if (Math.abs(dx) > Math.abs(dy)) {
      const midX = x1 + dx * 0.45;
      pathD = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${midX.toFixed(1)} ${y2.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    } else {
      const midY = y1 + dy * 0.45;
      pathD = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${midY.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    }

    return `
      <g class="leader-line-group" pointer-events="none">
        <path d="${pathD}" class="leader-line" stroke="#e11d48" stroke-width="1.5" stroke-dasharray="3,2" fill="none"/>
        <circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="2.5" fill="#e11d48"/>
      </g>
    `;
  }

  /**
   * 5種類の方位記号グラフィックを生成
   */
  static renderCompassGraphic(design = "circle_modern") {
    switch (design) {
      case "circle_classic":
        return `
          <circle cx="0" cy="0" r="19" fill="#ffffff" stroke="#333333" stroke-width="1.8"/>
          <circle cx="0" cy="0" r="16" fill="none" stroke="#94a3b8" stroke-width="0.8"/>
          <line x1="0" y1="-16" x2="0" y2="16" stroke="#94a3b8" stroke-width="0.8"/>
          <line x1="-16" y1="0" x2="16" y2="0" stroke="#94a3b8" stroke-width="0.8"/>
          <polygon points="0,-15 3.5,0 0,-1.5" fill="#dc2626"/>
          <polygon points="0,-15 -3.5,0 0,-1.5" fill="#334155"/>
          <polygon points="0,15 3.5,0 0,1.5" fill="#94a3b8"/>
          <polygon points="0,15 -3.5,0 0,1.5" fill="#cbd5e1"/>
          <polygon points="15,0 0,3.5 1.5,0" fill="#94a3b8"/>
          <polygon points="15,0 0,-3.5 1.5,0" fill="#cbd5e1"/>
          <polygon points="-15,0 0,3.5 -1.5,0" fill="#94a3b8"/>
          <polygon points="-15,0 0,-3.5 -1.5,0" fill="#cbd5e1"/>
          <circle cx="0" cy="0" r="2" fill="#334155"/>
          <text x="0" y="-7.5" text-anchor="middle" fill="#dc2626" font-size="7.5px" font-weight="900" class="map-text">N</text>
        `;
      case "arrow_simple":
        return `
          <polygon points="0,-18 6,5 0,1" fill="#dc2626"/>
          <polygon points="0,-18 -6,5 0,1" fill="#334155"/>
          <polygon points="0,1 6,5 0,13" fill="#64748b"/>
          <polygon points="0,1 -6,5 0,13" fill="#94a3b8"/>
          <text x="0" y="-21" text-anchor="middle" fill="#222222" font-size="11px" font-weight="bold" class="map-text">N</text>
        `;
      case "compass_rose":
        return `
          <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#1e293b" stroke-width="1.6"/>
          <circle cx="0" cy="0" r="14" fill="none" stroke="#e2e8f0" stroke-width="0.8"/>
          <polygon points="0,-15 2.5,-3 0,0" fill="#dc2626"/>
          <polygon points="0,-15 -2.5,-3 0,0" fill="#334155"/>
          <polygon points="15,0 3,2.5 0,0" fill="#475569"/>
          <polygon points="15,0 3,-2.5 0,0" fill="#94a3b8"/>
          <polygon points="0,15 2.5,3 0,0" fill="#94a3b8"/>
          <polygon points="0,15 -2.5,3 0,0" fill="#cbd5e1"/>
          <polygon points="-15,0 -3,2.5 0,0" fill="#cbd5e1"/>
          <polygon points="-15,0 -3,-2.5 0,0" fill="#64748b"/>
          <polygon points="9,-9 2,-2 0,0" fill="#94a3b8"/>
          <polygon points="-9,-9 -2,-2 0,0" fill="#94a3b8"/>
          <polygon points="9,9 2,2 0,0" fill="#cbd5e1"/>
          <polygon points="-9,9 -2,2 0,0" fill="#cbd5e1"/>
          <circle cx="0" cy="0" r="2" fill="#dc2626"/>
          <text x="0" y="-7.5" text-anchor="middle" fill="#dc2626" font-size="7.5px" font-weight="900" class="map-text">N</text>
        `;
      case "real_estate":
        return `
          <circle cx="0" cy="4" r="8" fill="none" stroke="#222222" stroke-width="1.4"/>
          <polygon points="0,-18 7,5 0,1.5" fill="#dc2626"/>
          <polygon points="0,-18 -7,5 0,1.5" fill="#ffffff" stroke="#222222" stroke-width="1"/>
          <line x1="0" y1="-18" x2="0" y2="10" stroke="#222222" stroke-width="1.2"/>
          <text x="0" y="-21" text-anchor="middle" fill="#222222" font-size="11.5px" font-weight="900" font-family="'Times New Roman', serif" class="map-text">N</text>
        `;
      case "circle_modern":
      default:
        return `
          <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#222222" stroke-width="1.8"/>
          <circle cx="0" cy="0" r="15" fill="none" stroke="#e2e8f0" stroke-width="1"/>
          <polygon points="0,-14 4,2 0,0" fill="#dc2626"/>
          <polygon points="0,-14 -4,2 0,0" fill="#334155"/>
          <polygon points="0,0 4,2 0,11" fill="#94a3b8"/>
          <polygon points="0,0 -4,2 0,11" fill="#cbd5e1"/>
          <circle cx="0" cy="0" r="1.5" fill="#ffffff"/>
          <text x="0" y="-6.5" text-anchor="middle" fill="#dc2626" font-size="8px" font-weight="900" class="map-text">N</text>
        `;
    }
  }

  /**
   * 国土地理院タイルを背景レイヤーとしてSVG内に合成配置
   */
  static renderBackgroundTiles(state, wPx, hPx, widthMm, heightMm, effRadius) {
    const info = state.permitInfo || {};
    const baseType = info.baseMapType || "pale";
    const zoom = (baseType === "blank") ? 14 : 16;

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

        const tileUrl = `https://cyberjapandata.gsi.go.jp/xyz/${baseType}/${zoom}/${tx}/${ty}.png`;
        tileSvg += `<image href="${tileUrl}" x="${tileX.toFixed(1)}" y="${tileY.toFixed(1)}" width="${tileW.toFixed(1)}" height="${tileH.toFixed(1)}" preserveAspectRatio="none" crossorigin="anonymous"/>`;
      }
    }
    tileSvg += `</g>`;
    return tileSvg;
  }

  /**
   * 街区・区画割（敷地ポリゴン）レイヤーのレンダリング
   */
  static renderLots(state, wPx, hPx, widthMm, heightMm, effRadius) {
    if (!state.lots || state.lots.length === 0) return "";
    let svg = `<g id="permit_lots_layer" class="permit-lots-layer">`;
    state.lots.forEach(lot => {
      if (!lot.points || lot.points.length < 3) return;
      const pts = lot.points.map(p => {
        const [x, y] = GeoUtil.geoToSvg(p.lon, p.lat, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      }).join(" ");

      const isSelected = (String(state.selectedId) === String(lot.id) && state.selectedType === "lot");
      const isSite = !!lot.isSite;
      const strokeCol = isSite ? "#dc2626" : (lot.strokeColor || "#475569");
      const strokeWidth = isSite ? 3.0 : 1.8;
      const fillCol = isSite ? (lot.fillColor || "rgba(220, 38, 38, 0.28)") : (lot.fillColor || "rgba(255, 255, 255, 0.75)");

      // 重心計算 (ラベル配置用)
      let cx = 0, cy = 0;
      lot.points.forEach(p => {
        const [x, y] = GeoUtil.geoToSvg(p.lon, p.lat, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);
        cx += x;
        cy += y;
      });
      cx /= lot.points.length;
      cy /= lot.points.length;

      svg += `
        <g id="${lot.id}" data-type="lot" data-id="${lot.id}" class="draggable lot-polygon-el ${isSelected ? 'is-selected' : ''}" title="🖱️ 区画: クリックで選択 / ダブルクリックで申請地・設定変更">
          <polygon points="${pts}" fill="${fillCol}" stroke="${strokeCol}" stroke-width="${strokeWidth}" stroke-linejoin="round"/>
          ${isSelected ? `<polygon points="${pts}" fill="none" stroke="#2563eb" stroke-width="${strokeWidth + 2.5}" stroke-dasharray="6,3" opacity="0.8"/>` : ''}
          ${isSite ? `
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" fill="#ffffff" stroke="#dc2626" stroke-width="2.2" pointer-events="none"/>
            <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="#dc2626" pointer-events="none"/>
          ` : ''}
          ${lot.label ? `
            <text x="${cx.toFixed(1)}" y="${(cy + (isSite ? 18 : 4)).toFixed(1)}" text-anchor="middle" font-size="12.5px" font-weight="bold" fill="${isSite ? '#dc2626' : '#1e293b'}" class="map-text halo-stroke" pointer-events="none">${lot.label}</text>
            <text x="${cx.toFixed(1)}" y="${(cy + (isSite ? 18 : 4)).toFixed(1)}" text-anchor="middle" font-size="12.5px" font-weight="bold" fill="${isSite ? '#dc2626' : '#1e293b'}" class="map-text" pointer-events="none">${lot.label}</text>
          ` : ''}
        </g>
      `;
    });
    svg += `</g>`;
    return svg;
  }

  /**
   * 各種申請用 表題欄（情報ボックス）のレンダリング
   */
  static renderPermitTitleBox(state, wPx, hPx) {
    const info = state.permitInfo || {};
    const title = info.title || "付近見取図";
    const lotNumber = info.lotNumber || "（地名地番未入力）";
    const address = info.address || "（住居表示未入力）";
    const architectNo = info.architectNo || "";
    const architectName = info.architectName || "";
    const scale = info.scale || 2500;
    const scaleText = `1 / ${scale.toLocaleString()}`;
    const dateText = info.createdDate || new Date().toLocaleDateString("ja-JP");
    const applicant = info.applicant || "";

    const hasArchitect = (architectNo || architectName);
    const boxW = 410;
    let boxH = 30 + 32 + 32 + 28;
    if (hasArchitect) boxH += 30;
    if (applicant) boxH += 28;

    const pos = info.boxPosition || "bottom-right";
    let bx = wPx - boxW - 20;
    let by = hPx - boxH - 20;
    if (pos === "bottom-left") {
      bx = 20;
      by = hPx - boxH - 20;
    } else if (pos === "top-right") {
      bx = wPx - boxW - 20;
      by = 20;
    }

    let curY = 30;
    let rowsSvg = "";

    // 項目1: 申請地 地名地番 (文字拡大: 14.5px 太字)
    rowsSvg += `
      <rect x="0" y="${curY}" width="80" height="32" fill="#f8fafc"/>
      <text x="40" y="${curY + 21}" text-anchor="middle" font-size="11.5px" font-weight="bold" fill="#475569" class="map-text">地名地番</text>
      <text x="92" y="${curY + 21}" font-size="14.5px" font-weight="bold" fill="#0f172a" class="map-text">${lotNumber}</text>
      <line x1="0" y1="${curY + 32}" x2="${boxW}" y2="${curY + 32}" stroke="#e2e8f0" stroke-width="1"/>
    `;
    curY += 32;

    // 項目2: 住居表示 (文字拡大: 14.5px 太字)
    rowsSvg += `
      <rect x="0" y="${curY}" width="80" height="32" fill="#f8fafc"/>
      <text x="40" y="${curY + 21}" text-anchor="middle" font-size="11.5px" font-weight="bold" fill="#475569" class="map-text">住居表示</text>
      <text x="92" y="${curY + 21}" font-size="14.5px" font-weight="bold" fill="#0f172a" class="map-text">${address}</text>
      <line x1="0" y1="${curY + 32}" x2="${boxW}" y2="${curY + 32}" stroke="#e2e8f0" stroke-width="1"/>
    `;
    curY += 32;

    // 項目3: 建築士情報
    if (hasArchitect) {
      const archText = [architectNo, architectName].filter(Boolean).join("　");
      rowsSvg += `
        <rect x="0" y="${curY}" width="80" height="30" fill="#f8fafc"/>
        <text x="40" y="${curY + 20}" text-anchor="middle" font-size="11px" font-weight="bold" fill="#475569" class="map-text">設 計 者</text>
        <text x="92" y="${curY + 20}" font-size="13px" font-weight="600" fill="#0f172a" class="map-text">${archText}</text>
        <line x1="0" y1="${curY + 30}" x2="${boxW}" y2="${curY + 30}" stroke="#e2e8f0" stroke-width="1"/>
      `;
      curY += 30;
    }

    // 項目4: 縮尺 & 作成日
    rowsSvg += `
      <rect x="0" y="${curY}" width="80" height="28" fill="#f8fafc" rx="${applicant ? '' : '0 0 0 5'}"/>
      <text x="40" y="${curY + 19}" text-anchor="middle" font-size="11px" font-weight="bold" fill="#475569" class="map-text">縮　　尺</text>
      <text x="92" y="${curY + 19}" font-size="13.5px" font-weight="bold" fill="#dc2626" class="map-text">${scaleText}</text>
      <text x="260" y="${curY + 19}" font-size="11px" fill="#64748b" class="map-text">作成日: ${dateText}</text>
    `;
    curY += 28;

    // 項目5: 申請者 (任意)
    if (applicant) {
      rowsSvg += `
        <line x1="0" y1="${curY}" x2="${boxW}" y2="${curY}" stroke="#e2e8f0" stroke-width="1"/>
        <rect x="0" y="${curY}" width="80" height="28" fill="#f8fafc" rx="0 0 0 5"/>
        <text x="40" y="${curY + 19}" text-anchor="middle" font-size="11px" font-weight="bold" fill="#475569" class="map-text">申 請 者</text>
        <text x="92" y="${curY + 19}" font-size="12px" fill="#0f172a" class="map-text">${applicant}</text>
      `;
    }

    return `
      <g id="permit_title_block" class="permit-title-block" transform="translate(${bx.toFixed(1)}, ${by.toFixed(1)})" pointer-events="all">
        <!-- 外枠・白下地 (シャドウ付き) -->
        <rect width="${boxW}" height="${boxH}" fill="#ffffff" stroke="#1e293b" stroke-width="2.0" rx="5" filter="drop-shadow(0 3px 12px rgba(0,0,0,0.18))"/>
        <!-- 表題ヘッダーバー -->
        <rect x="0" y="0" width="${boxW}" height="30" fill="#1e293b" rx="5 5 0 0"/>
        <text x="${boxW / 2}" y="21" text-anchor="middle" font-size="15px" font-weight="bold" fill="#ffffff" letter-spacing="3px" class="map-text">${title}</text>
        
        <!-- 垂直ラベル仕切り線 -->
        <line x1="80" y1="30" x2="80" y2="${boxH}" stroke="#e2e8f0" stroke-width="1"/>

        ${rowsSvg}
      </g>
    `;
  }

  /**
   * 各種申請用 厳密縮尺スケールバー (1/2500)
   */
  static renderPermitScaleBar(state, wPx, hPx, effRadius) {
    const info = state.permitInfo || {};
    const scale = info.scale || 2500;
    const pxPerMeter = (wPx / 2.0) / effRadius;

    const bar50m = 50 * pxPerMeter;
    const bar100m = 100 * pxPerMeter;
    const bar200m = 200 * pxPerMeter;

    const sx = 20;
    const sy = hPx - 36;

    return `
      <g id="permit_scale_bar" class="permit-scale-bar" transform="translate(${sx}, ${sy})" pointer-events="none">
        <rect x="-8" y="-20" width="${bar200m + 36}" height="36" fill="rgba(255,255,255,0.94)" stroke="#1e293b" stroke-width="1.2" rx="4" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.15))"/>
        <text x="0" y="-7" font-size="11.5px" font-weight="bold" fill="#1e293b" class="map-text">縮尺 1 : ${scale.toLocaleString()}</text>
        <!-- 目盛バー -->
        <rect x="0" y="0" width="${bar100m}" height="5.5" fill="#1e293b"/>
        <rect x="${bar100m}" y="0" width="${bar100m}" height="5.5" fill="#64748b"/>
        <line x1="0" y1="-2" x2="0" y2="10" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${bar50m}" y1="-2" x2="${bar50m}" y2="8" stroke="#1e293b" stroke-width="1.0"/>
        <line x1="${bar100m}" y1="-2" x2="${bar100m}" y2="10" stroke="#1e293b" stroke-width="1.5"/>
        <line x1="${bar200m}" y1="-2" x2="${bar200m}" y2="10" stroke="#1e293b" stroke-width="1.5"/>
        <text x="0" y="21" text-anchor="middle" font-size="9.5px" font-weight="bold" fill="#334155" class="map-text">0</text>
        <text x="${bar50m}" y="21" text-anchor="middle" font-size="9.5px" font-weight="bold" fill="#334155" class="map-text">50</text>
        <text x="${bar100m}" y="21" text-anchor="middle" font-size="9.5px" font-weight="bold" fill="#334155" class="map-text">100</text>
        <text x="${bar200m}" y="21" text-anchor="middle" font-size="9.5px" font-weight="bold" fill="#334155" class="map-text">200m</text>
      </g>
    `;
  }

  /**
   * 各種申請用 申請地シンボル（記号とテキストを独立レンダリング）
   */
  static renderPermitSiteMarker(state, wPx, hPx, widthMm, heightMm, effRadius) {
    const [dx, dy] = GeoUtil.geoToSvg(state.dest.lon, state.dest.lat, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);
    const destName = (state.dest && state.dest.name) ? state.dest.name : "申請地";
    const destFSize = state.dest.fontSize || 13;
    const destRot = state.dest.rotation || 0;
    const destRotAttr = destRot !== 0 ? `rotate(${destRot})` : '';

    const isDestIconSelected = (state.selectedType === "dest-icon" || state.selectedId === "dest_pin");
    const isDestLabelSelected = (state.selectedType === "dest-label" || state.selectedId === "dest_label");

    let markerSvg = "";

    // 1. 申請地記号（◎ 赤二重丸）- 独立ドラッグ可能
    markerSvg += `
      <g id="dest_pin" data-type="dest-icon" class="draggable dest-icon-el ${isDestIconSelected ? 'is-selected' : ''}" transform="translate(${dx.toFixed(1)}, ${dy.toFixed(1)})" title="🖱️ 申請地記号（◎）: ドラッグで移動 / クリックで選択 / ダブルクリックで編集">
        <circle cx="0" cy="0" r="16" fill="rgba(220, 38, 38, 0.18)" stroke="#dc2626" stroke-width="2.2" stroke-dasharray="4,2"/>
        <circle cx="0" cy="0" r="9" fill="#ffffff" stroke="#dc2626" stroke-width="2.5"/>
        <circle cx="0" cy="0" r="4.5" fill="#dc2626"/>
      </g>
    `;

    // 2. 申請地プレート/バッジ - 独立ドラッグ可能
    if (destName && destName.trim()) {
      const destLines = destName.split("\n");
      const maxDestLineLen = Math.max(...destLines.map(l => l.length), 1);
      const tW = Math.max(maxDestLineLen * (destFSize + 2) + 20, 56);
      const tH = (destFSize * 1.25) * destLines.length + 10;

      const destLox = state.dest.labelOffsetX !== undefined ? state.dest.labelOffsetX : 20;
      const destLoy = state.dest.labelOffsetY !== undefined ? state.dest.labelOffsetY : -20;
      const dlx = dx + destLox;
      const dly = dy + destLoy;

      if (state.dest.hasLeaderLine) {
        markerSvg += SvgBuilder.buildLeaderLine(dx, dy, dlx, dly);
      }

      const multilineDest = SvgBuilder.renderMultilineText(destName, destFSize, "middle");
      const destBg = state.dest.bgColor || "#dc2626";

      markerSvg += `
        <g id="dest_label" data-type="dest-label" class="draggable dest-label-el ${isDestLabelSelected ? 'is-selected' : ''}" transform="translate(${dlx.toFixed(1)}, ${dly.toFixed(1)}) ${destRotAttr}" title="🖱️ 申請地プレート: ドラッグで移動 / ダブルクリックで編集">
          <rect x="${-tW/2}" y="${-tH/2}" width="${tW}" height="${tH}" rx="5" ry="5" fill="${destBg}" stroke="#ffffff" stroke-width="2.0" filter="drop-shadow(0 2px 5px rgba(0,0,0,0.3))"/>
          <text x="0" y="0" text-anchor="middle" class="map-text dest-label" font-size="${destFSize}px">${multilineDest}</text>
        </g>
      `;
    }

    return markerSvg;
  }

  /**
   * 案内図・各種申請SVG文字列を構築して返す
   */
  static build(state) {
    const pxPerMm = 10.0;
    const wPx = state.widthMm * pxPerMm;
    const hPx = state.heightMm * pxPerMm;

    // 余白10mm（前後左右）の計算（各種申請モード時）
    const isPermit = (state.appMode === "permit");
    const marginMm = isPermit ? (state.permitInfo?.marginMm !== undefined ? state.permitInfo.marginMm : 10) : 0;
    const marginPx = marginMm * pxPerMm;

    const plotW = wPx - marginPx * 2;
    const plotH = hPx - marginPx * 2;
    const plotWMm = state.widthMm - marginMm * 2;
    const plotHMm = state.heightMm - marginMm * 2;

    const effRadius = isPermit 
      ? GeoUtil.scaleToEffectiveRadius(state.permitInfo?.scale || 2500, state.widthMm, marginMm)
      : (state.effectiveRadiusM || state.viewRadiusM);

    let svg = `<svg id="annaizu_canvas" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wPx} ${hPx}" width="${wPx}" height="${hPx}" style="background: ${state.transparentBg ? 'none' : '#ffffff'}; font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;">`;

    // 共通スタイル定義 (Defs)
    svg += `
      <defs>
        <style>
          .map-text { user-select: none; font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif; }
          .halo-stroke { stroke: #ffffff; stroke-width: 3.5px; stroke-linejoin: round; stroke-linecap: round; }
          .station-label { font-weight: bold; fill: #ffffff; }
          .dest-label { font-weight: bold; fill: #ffffff; }
          .credit-text { font-size: 8.5px; fill: #64748b; }
          .leader-line { stroke: #e11d48; stroke-width: 1.5px; stroke-dasharray: 3,2; fill: none; }
          .selected-bounding-box { stroke: #2563eb; stroke-width: 1.5px; stroke-dasharray: 4,3; fill: none; }
        </style>
        ${isPermit ? `<clipPath id="permit_plot_clip"><rect x="0" y="0" width="${plotW}" height="${plotH}" /></clipPath>` : ''}
      </defs>
    `;

    // Layer 1: 用紙全体背景
    if (!state.transparentBg) {
      svg += `<rect width="${wPx}" height="${hPx}" fill="#ffffff"/>`;
    }

    // 作図領域グループ（各種申請モードでは translate(marginPx, marginPx) 内にクリップ配置）
    if (isPermit) {
      svg += `<g id="permit_plot_wrapper" transform="translate(${marginPx}, ${marginPx})">`;
      // 作図枠内下地白
      svg += `<rect width="${plotW}" height="${plotH}" fill="#ffffff"/>`;
      // 作図枠内クリッピンググループ
      svg += `<g id="permit_plot_content" clip-path="url(#permit_plot_clip)">`;
    }

    // 【各種申請モード】国土地理院白図 / 淡色地図タイルの合成
    if (isPermit) {
      svg += SvgBuilder.renderBackgroundTiles(state, plotW, plotH, plotWMm, plotHMm, effRadius);
    }

    // Layer 2: 道路網 (案内図モード)
    if (!isPermit) {
      const roadWidths = {
        major: { casing: 15.0, inner: 10.5 },
        medium: { casing: 9.5, inner: 6.5 },
        minor: { casing: 6.0, inner: 4.0 }
      };

      const sortedRoads = [...state.roads].sort((a, b) => {
        const order = { minor: 1, medium: 2, major: 3 };
        return (order[a.type] || 2) - (order[b.type] || 2);
      });

      // 2-1. 外枠線 (Casing)
      sortedRoads.forEach(r => {
        const w = roadWidths[r.type] || roadWidths.medium;
        const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, effRadius, state.widthMm, state.heightMm));
        const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
        const casingColor = r.casingColor || "#666666";
        const isSelected = String(state.selectedId) === String(r.id);
        const strokeExtra = isSelected ? 'stroke-dasharray="6,3" stroke="#2563eb"' : `stroke="${casingColor}"`;
        svg += `<path id="road_casing_${r.id}" d="${d}" fill="none" ${strokeExtra} stroke-width="${w.casing}" stroke-linecap="round" stroke-linejoin="round"/>`;
      });

      // 2-2. 内側線 (Inner) または 塗りつぶし
      sortedRoads.forEach(r => {
        const w = roadWidths[r.type] || roadWidths.medium;
        const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, effRadius, state.widthMm, state.heightMm));
        const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
        const fillColor = r.filled ? (r.fillColor || "#ffe066") : (r.innerColor || "#ffffff");
        svg += `<path id="road_inner_${r.id}" d="${d}" fill="none" stroke="${fillColor}" stroke-width="${w.inner}" stroke-linecap="round" stroke-linejoin="round"/>`;
      });

      // Layer 3: 鉄道 (線路)
      state.rails.forEach(r => {
        const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, effRadius, state.widthMm, state.heightMm));
        const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
        const isSelected = String(state.selectedId) === String(r.id);
        const isPrivate = (r.mode === "private" || (!r.mode && state.railMode === "private"));

        if (isPrivate) {
          svg += `<path d="${d}" fill="none" stroke="#222222" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`;
          svg += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        } else {
          svg += `<path d="${d}" fill="none" stroke="#333333" stroke-width="4.5" stroke-linecap="square" stroke-linejoin="round"/>`;
          svg += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="7,7"/>`;
        }
        if (isSelected) {
          svg += `<path d="${d}" fill="none" stroke="#2563eb" stroke-width="6.0" stroke-dasharray="4,4" opacity="0.6"/>`;
        }
      });

      // Layer 3.5: 経路（赤点線）
      (state.routes || []).forEach(r => {
        const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, effRadius, state.widthMm, state.heightMm));
        const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
        svg += `<path d="${d}" fill="none" stroke="#e53935" stroke-width="3.5" stroke-dasharray="8,5" stroke-linecap="round" stroke-linejoin="round"/>`;
      });
    }

    // 【各種申請モード】街区・区画割ポリゴン描画
    if (isPermit) {
      svg += SvgBuilder.renderLots(state, plotW, plotH, plotWMm, plotHMm, effRadius);
    }

    // 描画基準サイズ (内寸 or 全体)
    const curW = isPermit ? plotW : wPx;
    const curH = isPermit ? plotH : hPx;
    const curWMm = isPermit ? plotWMm : state.widthMm;
    const curHMm = isPermit ? plotHMm : state.heightMm;

    // Layer 4: 引き出し線
    state.landmarks.forEach(p => {
      if (p.hasLeaderLine && p.name && p.name.trim()) {
        const [ix, iy] = GeoUtil.geoToSvg(p.lon, p.lat, curW, curH, state.frameCenter, effRadius, curWMm, curHMm);
        const lox = p.labelOffsetX !== undefined ? p.labelOffsetX : (p.icon_type === "signal" ? 0 : p.category === "station" ? 0 : 14);
        const loy = p.labelOffsetY !== undefined ? p.labelOffsetY : (p.icon_type === "signal" ? -14 : p.category === "station" ? -22 : 4);
        const lx = ix + lox;
        const ly = iy + loy;
        svg += SvgBuilder.buildLeaderLine(ix, iy, lx, ly);
      }
    });

    if (!isPermit && state.dest.hasLeaderLine && state.dest.name && state.dest.name.trim()) {
      const [dx, dy] = GeoUtil.geoToSvg(state.dest.lon, state.dest.lat, curW, curH, state.frameCenter, effRadius, curWMm, curHMm);
      const dlox = state.dest.labelOffsetX !== undefined ? state.dest.labelOffsetX : 16;
      const dloy = state.dest.labelOffsetY !== undefined ? state.dest.labelOffsetY : -24;
      const dlx = dx + dlox;
      const dly = dy + dloy;
      svg += SvgBuilder.buildLeaderLine(dx, dy, dlx, dly);
    }

    (state.texts || []).forEach(t => {
      if (t.hasLeaderLine) {
        const [tx, ty] = GeoUtil.geoToSvg(t.lon, t.lat, curW, curH, state.frameCenter, effRadius, curWMm, curHMm);
        const lox = t.leaderOffsetX !== undefined ? t.leaderOffsetX : -30;
        const loy = t.leaderOffsetY !== undefined ? t.leaderOffsetY : 30;
        const ax = tx + lox;
        const ay = ty + loy;
        svg += SvgBuilder.buildLeaderLine(ax, ay, tx, ty);

        const isAnchorSelected = (String(state.selectedId) === `anchor_${t.id}`);
        svg += `
          <g id="anchor_${t.id}" data-type="text-anchor" data-parent-id="${t.id}" class="draggable leader-anchor-el ${isAnchorSelected ? 'is-selected' : ''}" transform="translate(${ax.toFixed(1)}, ${ay.toFixed(1)})" title="🖱️ 引き出し線の対象地点をドラッグして移動">
            <circle cx="0" cy="0" r="5.5" fill="#e11d48" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.3))"/>
            <circle cx="0" cy="0" r="2" fill="#ffffff"/>
          </g>
        `;
      }
    });

    // Layer 5: 施設・目印（アイコンとラベルを完全分離してレンダリング）
    state.landmarks.forEach(p => {
      const [x, y] = GeoUtil.geoToSvg(p.lon, p.lat, curW, curH, state.frameCenter, effRadius, curWMm, curHMm);
      const isIconSelected = (String(state.selectedId) === String(p.id) && state.selectedType === "landmark-icon");
      const isLabelSelected = (String(state.selectedId) === String(p.id) && state.selectedType === "landmark-label");

      const iconSelectedClass = isIconSelected ? "is-selected" : "";
      const iconScale = p.iconScale !== undefined ? p.iconScale : 1.0;
      svg += `<g id="icon_${p.id}" data-type="landmark-icon" data-id="${p.id}" class="draggable landmark-icon-el ${iconSelectedClass}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${iconScale.toFixed(2)})" title="🖱️ アイコンをドラッグで位置移動 / クリックで選択">`;

      if (p.category === "station" || p.icon_type === "station") {
        svg += `<circle cx="0" cy="0" r="11" fill="#ffffff" stroke="#1e3a8a" stroke-width="3"/>`;
        svg += `<circle cx="0" cy="0" r="6" fill="#1e3a8a"/>`;
      } else if (p.icon_type === "signal" || p.category === "signal") {
        svg += `
          <rect x="-14" y="-7" width="28" height="14" rx="7" ry="7" fill="#1e293b" stroke="#ffffff" stroke-width="1.5" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.3))"/>
          <circle cx="-7.5" cy="0" r="3.6" fill="#22c55e"/>
          <circle cx="0" cy="0" r="3.6" fill="#eab308"/>
          <circle cx="7.5" cy="0" r="3.6" fill="#ef4444"/>
        `;
      } else {
        const catColors = {
          convenience: "#0284c7",
          supermarket: "#16a34a",
          fuel: "#ea580c",
          post_office: "#dc2626",
          school: "#9333ea",
          bank: "#475569"
        };
        const cBg = catColors[p.category] || "#475569";
        svg += `<circle cx="0" cy="0" r="10" fill="${cBg}" stroke="#ffffff" stroke-width="2" filter="drop-shadow(0 1px 3px rgba(0,0,0,0.25))"/>`;

        const iconSymbols = {
          "7eleven": "7",
          familymart: "F",
          lawson: "L",
          supermarket: "S",
          fuel: "GS",
          post_office: "〒",
          school: "文",
          bank: "B"
        };
        const sym = iconSymbols[p.icon_type] || iconSymbols[p.category] || "●";
        const symSize = sym.length >= 2 ? "9px" : "11px";
        svg += `<text x="0" y="3.5" text-anchor="middle" fill="#ffffff" font-size="${symSize}" font-weight="bold" class="map-text">${sym}</text>`;
      }
      svg += `</g>`;

      // 5-2. ラベル部分 (独立配置)
      const fSize = p.fontSize || 12;
      const rot = p.rotation || 0;
      const rotAttr = rot !== 0 ? `rotate(${rot})` : '';
      const isStation = (p.category === "station" || p.icon_type === "station");
      const isSignal = (p.icon_type === "signal" || p.category === "signal");

      const defaultLox = isStation ? 0 : isSignal ? 0 : 14;
      const defaultLoy = isStation ? -22 : isSignal ? -14 : 4;
      const lox = p.labelOffsetX !== undefined ? p.labelOffsetX : defaultLox;
      const loy = p.labelOffsetY !== undefined ? p.labelOffsetY : defaultLoy;
      const lx = x + lox;
      const ly = y + loy;

      const labelSelectedClass = isLabelSelected ? "is-selected" : "";
      const textLines = (p.name || "").split("\n");
      const maxLineLen = Math.max(...textLines.map(l => l.length), 1);

      if (isStation) {
        const sw = Math.max(maxLineLen * (fSize + 2) + 20, 70);
        const sh = (fSize * 1.25) * textLines.length + 10;
        const multilineSvg = SvgBuilder.renderMultilineText(p.name, fSize, "middle");
        const stnBg = p.bgColor || "#1e3a8a";
        svg += `<g id="label_${p.id}" data-type="landmark-label" data-parent-id="${p.id}" class="draggable landmark-label-el ${labelSelectedClass}" transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) ${rotAttr}" title="🖱️ 駅名プレートのみドラッグで移動 / クリックで選択">
          <rect x="${-sw/2}" y="${-sh/2}" width="${sw}" height="${sh}" fill="#ffffff" stroke="${stnBg}" stroke-width="2.5"/>
          <rect x="${-sw/2 + 2}" y="${-sh/2 + 2}" width="${sw - 4}" height="${sh - 4}" fill="${stnBg}"/>
          <text x="0" y="0" text-anchor="middle" class="map-text station-label" fill="#ffffff" font-weight="bold" font-size="${fSize}px">${multilineSvg}</text>
        </g>`;
      } else {
        const multilineSvgHalo = SvgBuilder.renderMultilineText(p.name, fSize, "middle");
        const multilineSvgMain = SvgBuilder.renderMultilineText(p.name, fSize, "middle");
        svg += `<g id="label_${p.id}" data-type="landmark-label" data-parent-id="${p.id}" class="draggable landmark-label-el ${labelSelectedClass}" transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) ${rotAttr}" title="🖱️ 文字のみドラッグで移動 / クリックで選択">
          <text x="0" y="0" text-anchor="middle" class="map-text poi-label halo-stroke" font-size="${fSize}px">${multilineSvgHalo}</text>
          <text x="0" y="0" text-anchor="middle" class="map-text poi-label" font-size="${fSize}px" fill="#1e293b">${multilineSvgMain}</text>
        </g>`;
      }
    });

    // Layer 6: 自由文字・通称
    state.texts.forEach(t => {
      const [x, y] = GeoUtil.geoToSvg(t.lon, t.lat, curW, curH, state.frameCenter, effRadius, curWMm, curHMm);
      const isSelected = (String(state.selectedId) === String(t.id) && state.selectedType === "text");
      const fSize = t.fontSize || 12;
      const rot = t.rotation || 0;
      const rotAttr = rot !== 0 ? `rotate(${rot})` : '';
      const selectedClass = isSelected ? "is-selected" : "";
      const multilineHalo = SvgBuilder.renderMultilineText(t.text, fSize, "middle");
      const multilineMain = SvgBuilder.renderMultilineText(t.text, fSize, "middle");

      svg += `
        <g id="${t.id}" data-type="text" data-id="${t.id}" class="draggable text-el ${selectedClass}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) ${rotAttr}" title="🖱️ ドラッグで移動 / クリックで選択">
          <text x="0" y="0" text-anchor="middle" font-size="${fSize}px" font-weight="bold" class="map-text halo-stroke">${multilineHalo}</text>
          <text x="0" y="0" text-anchor="middle" font-size="${fSize}px" font-weight="bold" fill="#1e293b" class="map-text">${multilineMain}</text>
        </g>
      `;
    });

    // Layer 7: 目的地ピン & 名称プレート
    if (isPermit) {
      svg += SvgBuilder.renderPermitSiteMarker(state, curW, curH, curWMm, curHMm, effRadius);
    } else {
      const [destX, destY] = GeoUtil.geoToSvg(state.dest.lon, state.dest.lat, curW, curH, state.frameCenter, effRadius, curWMm, curHMm);
      const destName = state.dest.name || "現地";
      const destFSize = state.dest.fontSize || 14;
      const destRot = state.dest.rotation || 0;
      const destRotAttr = destRot !== 0 ? `rotate(${destRot})` : '';

      const destLines = destName.split("\n");
      const maxDestLineLen = Math.max(...destLines.map(l => l.length), 1);
      const tW = Math.max(maxDestLineLen * (destFSize + 2) + 20, 56);
      const tH = (destFSize * 1.25) * destLines.length + 12;

      const destLox = state.dest.labelOffsetX !== undefined ? state.dest.labelOffsetX : 16;
      const destLoy = state.dest.labelOffsetY !== undefined ? state.dest.labelOffsetY : -24;
      const destLabelX = destX + destLox;
      const destLabelY = destY + destLoy;

      const isDestIconSelected = (state.selectedType === "dest-icon" || state.selectedId === "dest_pin");
      const isDestLabelSelected = (state.selectedType === "dest-label" || state.selectedId === "dest_label");
      const destBg = state.dest.bgColor || "#d32f2f";

      svg += `
        <g id="dest_pin" data-type="dest-icon" class="draggable dest-icon-el ${isDestIconSelected ? 'is-selected' : ''}" transform="translate(${destX.toFixed(1)}, ${destY.toFixed(1)})" title="🖱️ ピン本体をドラッグで位置移動 / クリックで選択">
          <path d="M 0 0 C -11 -11 -13 -22 0 -32 C 13 -22 11 -11 0 0 Z" fill="${destBg}" stroke="#ffffff" stroke-width="2"/>
          <circle cx="0" cy="-20" r="4.5" fill="#ffffff"/>
        </g>
      `;

      if (destName && destName.trim()) {
        const multilineDest = SvgBuilder.renderMultilineText(destName, destFSize, "middle");
        svg += `
          <g id="dest_label" data-type="dest-label" class="draggable dest-label-el ${isDestLabelSelected ? 'is-selected' : ''}" transform="translate(${destLabelX.toFixed(1)}, ${destLabelY.toFixed(1)}) ${destRotAttr}" title="🖱️ 「${destLines[0]}」プレートのみドラッグで移動 / クリックで選択">
            <rect x="${-tW/2}" y="${-tH/2}" width="${tW}" height="${tH}" rx="6" ry="6" fill="${destBg}" stroke="#ffffff" stroke-width="2.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
            <text x="0" y="0" text-anchor="middle" class="map-text dest-label" font-size="${destFSize}px">${multilineDest}</text>
          </g>
        `;
      }
    }

    // 各種申請モード時のクリッピンググループ終了
    if (isPermit) {
      svg += `</g>`; // permit_plot_content
      // 外周枠線（図面枠・四方10mm余白の内側境界線）
      svg += `<rect width="${plotW}" height="${plotH}" fill="none" stroke="#1e293b" stroke-width="2.0" pointer-events="none"/>`;
    }

    // Layer 8: 方位記号 (N)
    if (state.showCompass) {
      const compX = (state.compass && state.compass.x !== null) ? state.compass.x : (curW - 40);
      const compY = (state.compass && state.compass.y !== null) ? state.compass.y : 40;
      const compScale = (state.compass && state.compass.scale) ? state.compass.scale : 1.0;
      const compDesign = (state.compass && state.compass.design) ? state.compass.design : (isPermit ? "arrow_simple" : "circle_modern");
      const isCompassSelected = (state.selectedId === "compass" || state.selectedType === "compass");
      const compassGfx = SvgBuilder.renderCompassGraphic(compDesign);

      svg += `
        <g id="compass" data-type="compass" class="draggable compass-el ${isCompassSelected ? 'is-selected' : ''}" transform="translate(${compX.toFixed(1)}, ${compY.toFixed(1)}) scale(${compScale.toFixed(2)})" title="🖱️ 方位記号: ドラッグで移動 / クリックで種類・サイズ変更">
          ${compassGfx}
        </g>
      `;
    }

    // Layer 9: 縮尺スケールバー
    if (isPermit) {
      svg += SvgBuilder.renderPermitScaleBar(state, curW, curH, effRadius);
    } else if (state.showScale) {
      const mPerPx = (effRadius * 2.0) / curW;
      const barM = effRadius > 1000 ? 500 : effRadius > 500 ? 200 : 100;
      const barPx = Math.round(barM / mPerPx);
      const scaleX = 24;
      const scaleY = curH - 20;

      svg += `
        <g transform="translate(${scaleX}, ${scaleY})">
          <line x1="0" y1="0" x2="${barPx}" y2="0" stroke="#333333" stroke-width="2"/>
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#333333" stroke-width="2"/>
          <line x1="${barPx}" y1="-3" x2="${barPx}" y2="3" stroke="#333333" stroke-width="2"/>
          <text x="${barPx / 2}" y="-5" text-anchor="middle" font-size="9.5px" fill="#444444" class="map-text">${barM}m</text>
        </g>
      `;
    }

    // Layer 10: 【各種申請モード】表題欄（情報ボックス）
    if (isPermit) {
      svg += SvgBuilder.renderPermitTitleBox(state, curW, curH);
    }

    // クレジット
    const creditText = isPermit 
      ? "背景地図: 国土地理院タイル (白地図 / 淡色地図) 縮尺 1/2,500 準拠" 
      : "国土地理院「基盤地図情報」及び OpenStreetMap データを元に作成";
    svg += `<text x="16" y="${curH - 6}" class="map-text credit-text">${creditText}</text>`;

    if (isPermit) {
      svg += `</g>`; // permit_plot_wrapper
    }

    svg += `</svg>`;
    return svg;
  }
}
