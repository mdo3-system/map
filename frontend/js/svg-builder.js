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
      // 水平方向が離れている場合: 斜めに出て文字の手前で水平に接続
      const midX = x1 + dx * 0.45;
      pathD = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${midX.toFixed(1)} ${y2.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
    } else {
      // 垂直方向が離れている場合
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
        // 2. クラシック4方位丸枠
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
        // 3. シンプル北矢印
        return `
          <polygon points="0,-18 6,5 0,1" fill="#dc2626"/>
          <polygon points="0,-18 -6,5 0,1" fill="#334155"/>
          <polygon points="0,1 6,5 0,13" fill="#64748b"/>
          <polygon points="0,1 -6,5 0,13" fill="#94a3b8"/>
          <text x="0" y="-21" text-anchor="middle" fill="#222222" font-size="11px" font-weight="bold" class="map-text">N</text>
        `;
      case "compass_rose":
        // 4. コンパスローズ (8方位スター)
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
        // 5. 不動産案内図風三角
        return `
          <circle cx="0" cy="4" r="8" fill="none" stroke="#222222" stroke-width="1.4"/>
          <polygon points="0,-18 7,5 0,1.5" fill="#dc2626"/>
          <polygon points="0,-18 -7,5 0,1.5" fill="#ffffff" stroke="#222222" stroke-width="1"/>
          <line x1="0" y1="-18" x2="0" y2="10" stroke="#222222" stroke-width="1.2"/>
          <text x="0" y="-21" text-anchor="middle" fill="#222222" font-size="11.5px" font-weight="900" font-family="'Times New Roman', serif" class="map-text">N</text>
        `;
      case "circle_modern":
      default:
        // 1. 丸枠モダン (デフォルト・円で囲まれたタイプ)
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
   * 案内図SVG文字列を構築して返す
   */
  static build(state) {
    const pxPerMm = 10.0;
    const wPx = state.widthMm * pxPerMm;
    const hPx = state.heightMm * pxPerMm;

    let svg = `<svg id="annaizu_canvas" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${wPx} ${hPx}" width="${wPx}" height="${hPx}" style="background: ${state.transparentBg ? 'none' : '#ffffff'}; font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif;">`;

    // 共通スタイル定義 (Defs)
    svg += `
      <defs>
        <style>
          .map-text { user-select: none; font-family: 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Meiryo', sans-serif; }
          .halo-stroke { stroke: #ffffff; stroke-width: 3.5px; stroke-linejoin: round; stroke-linecap: round; }
          .station-label { font-weight: bold; fill: #ffffff; }
          .dest-label { font-weight: bold; fill: #ffffff; }
          .credit-text { font-size: 8px; fill: #888888; }
          .leader-line { stroke: #e11d48; stroke-width: 1.5px; stroke-dasharray: 3,2; fill: none; }
          .selected-bounding-box { stroke: #2563eb; stroke-width: 1.5px; stroke-dasharray: 4,3; fill: none; }
        </style>
      </defs>
    `;

    // Layer 1: 背景
    if (!state.transparentBg) {
      svg += `<rect width="${wPx}" height="${hPx}" fill="#ffffff"/>`;
    }

    // Layer 2: 道路網 (外枠線 & 内側線/塗りつぶし)
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
      const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm));
      const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
      const casingColor = r.casingColor || "#666666";
      const isSelected = String(state.selectedId) === String(r.id);
      const strokeExtra = isSelected ? 'stroke-dasharray="6,3" stroke="#2563eb"' : `stroke="${casingColor}"`;
      svg += `<path id="road_casing_${r.id}" d="${d}" fill="none" ${strokeExtra} stroke-width="${w.casing}" stroke-linecap="round" stroke-linejoin="round"/>`;
    });

    // 2-2. 内側線 (Inner) または 塗りつぶし
    sortedRoads.forEach(r => {
      const w = roadWidths[r.type] || roadWidths.medium;
      const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm));
      const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
      const fillColor = r.filled ? (r.fillColor || "#ffe066") : (r.innerColor || "#ffffff");
      svg += `<path id="road_inner_${r.id}" d="${d}" fill="none" stroke="${fillColor}" stroke-width="${w.inner}" stroke-linecap="round" stroke-linejoin="round"/>`;
    });

    // Layer 3: 鉄道 (線路: JRモード / 私鉄モード)
    state.rails.forEach(r => {
      const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm));
      const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
      const isSelected = String(state.selectedId) === String(r.id);
      const isPrivate = (r.mode === "private" || (!r.mode && state.railMode === "private"));

      if (isPrivate) {
        // 私鉄モード: 2重白抜き実線
        svg += `<path d="${d}" fill="none" stroke="#222222" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>`;
        svg += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
      } else {
        // JRモード: 白黒枕木ストライプ
        svg += `<path d="${d}" fill="none" stroke="#333333" stroke-width="4.5" stroke-linecap="square" stroke-linejoin="round"/>`;
        svg += `<path d="${d}" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-dasharray="7,7"/>`;
      }
      if (isSelected) {
        svg += `<path d="${d}" fill="none" stroke="#2563eb" stroke-width="6.0" stroke-dasharray="4,4" opacity="0.6"/>`;
      }
    });

    // Layer 3.5: 経路（赤点線）
    (state.routes || []).forEach(r => {
      const pts = r.points.map(p => GeoUtil.geoToSvg(p[1], p[0], wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm));
      const d = "M " + pts.map(p => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" L ");
      svg += `<path d="${d}" fill="none" stroke="#e53935" stroke-width="3.5" stroke-dasharray="8,5" stroke-linecap="round" stroke-linejoin="round"/>`;
    });

    // Layer 4: 引き出し線 (Leader Lines - カギ型対応)
    // 4-1. 施設の引き出し線
    state.landmarks.forEach(p => {
      if (p.hasLeaderLine) {
        const [ix, iy] = GeoUtil.geoToSvg(p.lon, p.lat, wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm);
        const lox = p.labelOffsetX !== undefined ? p.labelOffsetX : (p.icon_type === "signal" ? 0 : 14);
        const loy = p.labelOffsetY !== undefined ? p.labelOffsetY : (p.icon_type === "signal" ? -14 : 4);
        const lx = ix + lox;
        const ly = iy + loy;
        svg += SvgBuilder.buildLeaderLine(ix, iy, lx, ly);
      }
    });

    // 4-2. 目的地の引き出し線
    if (state.dest.hasLeaderLine) {
      const [dx, dy] = GeoUtil.geoToSvg(state.dest.lon, state.dest.lat, wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm);
      const dlox = state.dest.labelOffsetX !== undefined ? state.dest.labelOffsetX : 16;
      const dloy = state.dest.labelOffsetY !== undefined ? state.dest.labelOffsetY : -24;
      const dlx = dx + dlox;
      const dly = dy + dloy;
      svg += SvgBuilder.buildLeaderLine(dx, dy, dlx, dly);
    }

    // 4-3. 自由テキストの引き出し線
    (state.texts || []).forEach(t => {
      if (t.hasLeaderLine) {
        const [tx, ty] = GeoUtil.geoToSvg(t.lon, t.lat, wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm);
        const lox = t.leaderOffsetX !== undefined ? t.leaderOffsetX : -24;
        const loy = t.leaderOffsetY !== undefined ? t.leaderOffsetY : 24;
        const ax = tx + lox;
        const ay = ty + loy;
        svg += SvgBuilder.buildLeaderLine(ax, ay, tx, ty);
      }
    });

    // Layer 5: 施設・目印（アイコンとラベルを完全分離してレンダリング）
    state.landmarks.forEach(p => {
      const [x, y] = GeoUtil.geoToSvg(p.lon, p.lat, wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm);
      const isIconSelected = (String(state.selectedId) === String(p.id) && state.selectedType === "landmark-icon");
      const isLabelSelected = (String(state.selectedId) === String(p.id) && state.selectedType === "landmark-label");

      // --- 5-1. アイコン部分 ---
      const iconSelectedClass = isIconSelected ? "is-selected" : "";
      const iconScale = p.iconScale !== undefined ? p.iconScale : 1.0;
      svg += `<g id="icon_${p.id}" data-type="landmark-icon" data-id="${p.id}" class="draggable landmark-icon-el ${iconSelectedClass}" transform="translate(${x.toFixed(1)}, ${y.toFixed(1)}) scale(${iconScale.toFixed(2)})" title="🖱️ アイコンをドラッグで位置移動 / クリックで選択">`;

      if (p.category === "station" || p.icon_type === "station") {
        svg += `
          <rect x="-18" y="-5" width="36" height="10" fill="#ffffff" stroke="#1e3a8a" stroke-width="2"/>
          <rect x="-14" y="-3" width="28" height="6" fill="#1e3a8a"/>
        `;
      } else if (p.icon_type === "signal" || p.category === "signal") {
        svg += `
          <rect x="-17" y="-8" width="34" height="16" rx="4" ry="4" fill="#1e293b" stroke="#ffffff" stroke-width="1.8"/>
          <circle cx="-10" cy="0" r="3.8" fill="#00e676" stroke="#ffffff" stroke-width="0.6"/>
          <circle cx="0" cy="0" r="3.8" fill="#ffd600" stroke="#ffffff" stroke-width="0.6"/>
          <circle cx="10" cy="0" r="3.8" fill="#ff1744" stroke="#ffffff" stroke-width="0.6"/>
        `;
      } else if (p.icon_type === "supermarket" || p.category === "supermarket") {
        svg += `
          <rect x="-10" y="-10" width="20" height="20" rx="4" ry="4" fill="#2e7d32" stroke="#ffffff" stroke-width="1.5"/>
          <text x="0" y="4" text-anchor="middle" fill="#ffffff" font-size="11px" font-weight="bold" class="map-text">🛒</text>
        `;
      } else if (p.icon_type === "7eleven") {
        svg += `<circle cx="0" cy="0" r="9.5" fill="#ff7900" stroke="#ffffff" stroke-width="1.5"/>`;
        svg += `<circle cx="0" cy="0" r="6.5" fill="#008559"/>`;
        svg += `<text x="0" y="4" text-anchor="middle" fill="#ffffff" font-size="10px" font-weight="bold" class="map-text">7</text>`;
      } else if (p.icon_type === "lawson") {
        svg += `<circle cx="0" cy="0" r="9.5" fill="#005bac" stroke="#ffffff" stroke-width="1.5"/>`;
        svg += `<text x="0" y="4" text-anchor="middle" fill="#ffffff" font-size="10px" font-weight="bold" class="map-text">L</text>`;
      } else if (p.icon_type === "familymart") {
        svg += `<circle cx="0" cy="0" r="9.5" fill="#009640" stroke="#ffffff" stroke-width="1.5"/>`;
        svg += `<circle cx="0" cy="0" r="6.5" fill="#007cc2"/>`;
        svg += `<text x="0" y="4" text-anchor="middle" fill="#ffffff" font-size="10px" font-weight="bold" class="map-text">F</text>`;
      } else if (p.icon_type === "fuel") {
        svg += `<rect x="-9" y="-9" width="18" height="18" rx="3" ry="3" fill="#c2185b" stroke="#ffffff" stroke-width="1.5"/>`;
        svg += `<text x="0" y="3.5" text-anchor="middle" fill="#ffffff" font-size="8.5px" font-weight="bold" class="map-text">GS</text>`;
      } else {
        svg += `<circle cx="0" cy="0" r="7" fill="#4b5563" stroke="#ffffff" stroke-width="1.5"/>`;
      }
      svg += `</g>`;

      // --- 5-2. ラベル部分 (文字サイズ・回転・複数行折り返し対応) ---
      const fSize = p.fontSize || 11.5;
      const rot = p.rotation || 0;
      const rotAttr = rot !== 0 ? `rotate(${rot})` : '';

      const isSignal = (p.icon_type === "signal" || p.category === "signal");
      const isStation = (p.category === "station" || p.icon_type === "station");

      const defaultLox = isSignal ? 0 : isStation ? 0 : 14;
      const defaultLoy = isSignal ? -14 : isStation ? -22 : 4;

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
        svg += `<g id="label_${p.id}" data-type="landmark-label" data-parent-id="${p.id}" class="draggable landmark-label-el ${labelSelectedClass}" transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) ${rotAttr}" title="🖱️ 駅名プレートのみドラッグで移動 / クリックで選択">
          <rect x="${-sw/2}" y="${-sh/2}" width="${sw}" height="${sh}" fill="#ffffff" stroke="#1e3a8a" stroke-width="2.5"/>
          <rect x="${-sw/2 + 2}" y="${-sh/2 + 2}" width="${sw - 4}" height="${sh - 4}" fill="#1e3a8a"/>
          <text x="0" y="0" text-anchor="middle" class="map-text station-label" fill="#ffffff" font-weight="bold" font-size="${fSize}px">${multilineSvg}</text>
        </g>`;
      } else if (isSignal) {
        const multilineSvgHalo = SvgBuilder.renderMultilineText(p.name, fSize, "middle");
        const multilineSvgMain = SvgBuilder.renderMultilineText(p.name, fSize, "middle");
        svg += `<g id="label_${p.id}" data-type="landmark-label" data-parent-id="${p.id}" class="draggable landmark-label-el ${labelSelectedClass}" transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) ${rotAttr}" title="🖱️ 交差点名のみドラッグで移動 / クリックで選択">
          <text x="0" y="0" text-anchor="middle" class="map-text poi-label halo-stroke" font-size="${fSize}px">${multilineSvgHalo}</text>
          <text x="0" y="0" text-anchor="middle" class="map-text poi-label" font-size="${fSize}px" fill="#1e293b">${multilineSvgMain}</text>
        </g>`;
      } else {
        const anchor = lox < -5 ? "end" : lox > 5 ? "start" : "middle";
        const multilineSvgHalo = SvgBuilder.renderMultilineText(p.name, fSize, anchor);
        const multilineSvgMain = SvgBuilder.renderMultilineText(p.name, fSize, anchor);
        svg += `<g id="label_${p.id}" data-type="landmark-label" data-parent-id="${p.id}" class="draggable landmark-label-el ${labelSelectedClass}" transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)}) ${rotAttr}" title="🖱️ 文字のみドラッグで移動 / クリックで選択">
          <text x="0" y="0" text-anchor="${anchor}" class="map-text poi-label halo-stroke" font-size="${fSize}px">${multilineSvgHalo}</text>
          <text x="0" y="0" text-anchor="${anchor}" class="map-text poi-label" font-size="${fSize}px" fill="#1e293b">${multilineSvgMain}</text>
        </g>`;
      }
    });

    // Layer 6: 自由文字・通称 (文字サイズ・回転・複数行折り返し対応)
    state.texts.forEach(t => {
      const [x, y] = GeoUtil.geoToSvg(t.lon, t.lat, wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm);
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

    // Layer 7: 目的地ピン & 名称プレート (完全個別移動・文字サイズ・回転・複数行折り返し対応)
    const [destX, destY] = GeoUtil.geoToSvg(state.dest.lon, state.dest.lat, wPx, hPx, state.frameCenter, state.effectiveRadiusM, state.widthMm, state.heightMm);
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

    // 7-1. ピン本体
    svg += `
      <g id="dest_pin" data-type="dest-icon" class="draggable dest-icon-el ${isDestIconSelected ? 'is-selected' : ''}" transform="translate(${destX.toFixed(1)}, ${destY.toFixed(1)})" title="🖱️ ピン本体をドラッグで位置移動 / クリックで選択">
        <path d="M 0 0 C -11 -11 -13 -22 0 -32 C 13 -22 11 -11 0 0 Z" fill="#d32f2f" stroke="#ffffff" stroke-width="2"/>
        <circle cx="0" cy="-20" r="4.5" fill="#ffffff"/>
      </g>
    `;

    // 7-2. 名称プレート (「現地」など)
    const multilineDest = SvgBuilder.renderMultilineText(destName, destFSize, "middle");
    svg += `
      <g id="dest_label" data-type="dest-label" class="draggable dest-label-el ${isDestLabelSelected ? 'is-selected' : ''}" transform="translate(${destLabelX.toFixed(1)}, ${destLabelY.toFixed(1)}) ${destRotAttr}" title="🖱️ 「${destLines[0]}」プレートのみドラッグで移動 / クリックで選択">
        <rect x="${-tW/2}" y="${-tH/2}" width="${tW}" height="${tH}" rx="6" ry="6" fill="#d32f2f" stroke="#ffffff" stroke-width="2.2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.3))"/>
        <text x="0" y="0" text-anchor="middle" class="map-text dest-label" font-size="${destFSize}px">${multilineDest}</text>
      </g>
    `;

    // Layer 8: 方位記号 (N) - 5種類デザイン・ドラッグ移動・サイズ変更対応
    if (state.showCompass) {
      const compX = (state.compass && state.compass.x !== null) ? state.compass.x : (wPx - 36);
      const compY = (state.compass && state.compass.y !== null) ? state.compass.y : 36;
      const compScale = (state.compass && state.compass.scale) ? state.compass.scale : 1.0;
      const compDesign = (state.compass && state.compass.design) ? state.compass.design : "circle_modern";
      const isCompassSelected = (state.selectedId === "compass" || state.selectedType === "compass");
      const compassGfx = SvgBuilder.renderCompassGraphic(compDesign);

      svg += `
        <g id="compass" data-type="compass" class="draggable compass-el ${isCompassSelected ? 'is-selected' : ''}" transform="translate(${compX.toFixed(1)}, ${compY.toFixed(1)}) scale(${compScale.toFixed(2)})" title="🖱️ 方位記号: ドラッグで移動 / クリックで種類・サイズ変更">
          ${compassGfx}
        </g>
      `;
    }

    // Layer 9: 縮尺スケールバー
    if (state.showScale) {
      const effRadius = state.effectiveRadiusM || state.viewRadiusM;
      const mPerPx = (effRadius * 2.0) / wPx;
      const barM = effRadius > 1000 ? 500 : effRadius > 500 ? 200 : 100;
      const barPx = Math.round(barM / mPerPx);
      const scaleX = 24;
      const scaleY = hPx - 20;

      svg += `
        <g transform="translate(${scaleX}, ${scaleY})">
          <line x1="0" y1="0" x2="${barPx}" y2="0" stroke="#333333" stroke-width="2"/>
          <line x1="0" y1="-3" x2="0" y2="3" stroke="#333333" stroke-width="2"/>
          <line x1="${barPx}" y1="-3" x2="${barPx}" y2="3" stroke="#333333" stroke-width="2"/>
          <text x="${barPx / 2}" y="-5" text-anchor="middle" font-size="9.5px" fill="#444444" class="map-text">${barM}m</text>
        </g>
      `;
    }

    // クレジット
    svg += `<text x="16" y="${hPx - 6}" class="map-text credit-text">国土地理院「基盤地図情報」及び OpenStreetMap データを元に作成</text>`;

    svg += `</svg>`;
    return svg;
  }
}
