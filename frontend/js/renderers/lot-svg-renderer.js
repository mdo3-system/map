// ==========================================
// lot-svg-renderer.js: 敷地（区画）SVG描画レンダラー (SRP)
// 責務: LotModelデータからSVGポリゴン・引き出し線・ラベルプレートを生成
// ==========================================

import { LotModel } from "../models/lot-model.js";

export class LotSvgRenderer {
  /**
   * 単一敷地のSVG文字列を構築
   */
  static renderLot(lot, state, geoToSvg, buildLeaderLine, wPx, hPx, effRadius, widthMm, heightMm) {
    if (!lot.points || lot.points.length < 3) return "";

    const model = (lot instanceof LotModel) ? lot : new LotModel(lot);
    const pts = model.points.map(p => {
      const [x, y] = geoToSvg(p.lon, p.lat, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");

    const isSelected = (String(state.selectedId) === String(model.id) && state.selectedType === "lot");
    const isSite = !!model.isSite;

    // スタイル属性
    const fillAttr = model.hasFill ? `fill="${model.fillColor}" fill-opacity="${model.fillOpacity}"` : `fill="none"`;
    const strokeDash = model.strokeDash === "dashed" ? 'stroke-dasharray="8,5"' : '';
    const strokeAttr = model.hasStroke ? `stroke="${model.strokeColor}" stroke-width="${model.strokeWidth}" ${strokeDash}` : `stroke="none"`;

    // 重心 (cx, cy)
    const { cx, cy } = model.getCentroidSvg(geoToSvg, wPx, hPx, state.frameCenter, effRadius, widthMm, heightMm);
    const fSize = model.fontSize || 16;
    const hasLeader = !!model.hasLeaderLine;

    let svg = "";

    // 1. 敷地ポリゴン
    svg += `
      <g id="${model.id}" data-type="lot" data-id="${model.id}" class="draggable lot-polygon-el ${isSelected ? 'is-selected' : ''}" title="🖱️ 敷地・図形: クリックで選択 / プロパティ編集">
        <polygon points="${pts}" ${fillAttr} ${strokeAttr} stroke-linejoin="round" stroke-linecap="round"/>
        ${isSelected ? `<polygon points="${pts}" fill="none" stroke="#2563eb" stroke-width="${Math.max(model.strokeWidth + 3, 5)}" stroke-dasharray="6,4" opacity="0.9"/>` : ''}
        ${(isSite && (!state.dest || state.dest.hidePin !== true)) ? `
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="7" fill="#ffffff" stroke="#dc2626" stroke-width="2.2" pointer-events="none"/>
          <circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="3" fill="#dc2626" pointer-events="none"/>
        ` : ''}
      </g>
    `;

    // 2. 敷地ラベルおよびカギ型引き出し線
    if (model.label) {
      const isLabelSelected = (String(state.selectedId) === String(model.id) && (state.selectedType === "lot" || state.selectedType === "lot-label"));
      if (hasLeader) {
        const { lx, ly } = model.getLeaderEndPoints(cx, cy);

        // カギ型引き出し線
        svg += buildLeaderLine(cx, cy, lx, ly);

        // 重心ポインタ点
        svg += `<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="4.5" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" pointer-events="none"/>`;

        // ドラッグ可能ラベルプレート
        const { width: pW, height: pH } = model.getPlateDimensions();

        svg += `
          <g id="lot_label_${model.id}" data-type="lot-label" data-parent-id="${model.id}" class="draggable lot-label-el ${isLabelSelected ? 'is-selected' : ''}" transform="translate(${lx.toFixed(1)}, ${ly.toFixed(1)})" title="🖱️ 敷地ラベル: ドラッグで位置移動 / クリックで選択">
            <rect x="${(-pW/2).toFixed(1)}" y="${(-pH/2).toFixed(1)}" width="${pW.toFixed(1)}" height="${pH.toFixed(1)}" rx="6" ry="6" fill="${isSite ? '#dc2626' : '#ffffff'}" stroke="${isSite ? '#ffffff' : '#1e293b'}" stroke-width="${isSite ? 3.0 : 1.8}" filter="drop-shadow(0 3px 8px rgba(0,0,0,0.3))"/>
            <text x="0" y="${(fSize * 0.35).toFixed(1)}" text-anchor="middle" font-size="${fSize}px" font-weight="bold" fill="${isSite ? '#ffffff' : '#0f172a'}" class="map-text" pointer-events="none">${model.label}</text>
          </g>
        `;
      } else {
        // 引き出し線なし（中央直接配置）
        svg += `
          <g id="lot_label_${model.id}" data-type="lot-label" data-parent-id="${model.id}" class="draggable lot-label-el ${isLabelSelected ? 'is-selected' : ''}" transform="translate(${cx.toFixed(1)}, ${(cy + (isSite && (!state.dest || state.dest.hidePin !== true) ? fSize * 0.9 : fSize * 0.35)).toFixed(1)})" title="🖱️ 敷地ラベル: クリックで選択 / ドラッグで引き出し線">
            <text x="0" y="0" text-anchor="middle" font-size="${fSize}px" font-weight="bold" fill="${(isSite && (!state.dest || state.dest.hidePin !== true)) ? '#dc2626' : '#1e293b'}" class="map-text halo-stroke">${model.label}</text>
            <text x="0" y="0" text-anchor="middle" font-size="${fSize}px" font-weight="bold" fill="${(isSite && (!state.dest || state.dest.hidePin !== true)) ? '#dc2626' : '#1e293b'}" class="map-text">${model.label}</text>
          </g>
        `;
      }
    }

    return svg;
  }

  /**
   * 全敷地のSVGレイヤーを構築
   */
  static renderAll(state, wPx, hPx, effRadius, widthMm, heightMm, geoToSvg, buildLeaderLine) {
    if (!state.lots || state.lots.length === 0) return "";
    let svg = `<g id="permit_lots_layer" class="permit-lots-layer">`;
    state.lots.forEach(lot => {
      svg += LotSvgRenderer.renderLot(lot, state, geoToSvg, buildLeaderLine, wPx, hPx, effRadius, widthMm, heightMm);
    });
    svg += `</g>`;
    return svg;
  }
}
