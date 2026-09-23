// ==========================================
// editor-interaction.js: キャンバス操作・ドラッグ＆選択制御 (SRP)
// ==========================================
import { GeoUtil } from "./geo.js";

export class EditorInteractionController {
  constructor(svgContainer, state, callbacks) {
    this.svgContainer = svgContainer;
    this.state = state;
    this.callbacks = callbacks || {}; // { onStateChange, onElementSelect, onDeleteElement, onShowToast, onEditName }

    this.bindWindowEvents();
  }

  getSvgPoint(evt, svg) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX;
    pt.y = evt.clientY;
    const transformed = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: transformed.x, y: transformed.y };
  }

  bindSvgDraggables() {
    const svgEl = this.svgContainer.querySelector("svg");
    if (!svgEl) return;

    svgEl.querySelectorAll(".draggable").forEach(el => {
      // 1. ドラッグ開始
      el.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return; // 左クリックのみ
        e.preventDefault();
        e.stopPropagation();

        this.state.isDraggingSvg = true;
        this.state.dragSvgTarget = el;
        this.state.hasMoved = false;

        const transform = el.getAttribute("transform") || "";
        const match = /translate\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(transform);
        this.state.elementSvgStart = match ? { x: parseFloat(match[1]), y: parseFloat(match[2]) } : { x: 0, y: 0 };
        this.state.dragSvgStart = this.getSvgPoint(e, svgEl);
      });

      // 2. クリック（選択または削除）
      el.addEventListener("click", (e) => {
        if (this.state.hasMoved) return; // 移動後のクリックは無視
        e.preventDefault();
        e.stopPropagation();

        const elType = el.getAttribute("data-type");
        let actualId = el.getAttribute("data-id") || el.id;
        if (elType === "landmark-label") {
          actualId = el.getAttribute("data-parent-id");
        }

        // 削除モード時
        if (this.state.mode === "delete") {
          if (!actualId || actualId === "dest_pin" || actualId === "dest_label") return;
          if (this.callbacks.onDeleteElement) {
            this.callbacks.onDeleteElement(actualId, elType);
          }
          return;
        }

        // 選択ツールまたはその他モード時の選択処理
        if (this.callbacks.onElementSelect) {
          this.callbacks.onElementSelect(actualId, elType);
        }
      });

      // 3. ダブルクリック（名称変更）
      el.addEventListener("dblclick", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const elType = el.getAttribute("data-type");
        const elId = el.getAttribute("data-id") || el.id;
        if (this.callbacks.onEditName) {
          this.callbacks.onEditName(elId, elType);
        }
      });

      // 4. 右クリック（即座削除）
      el.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const elType = el.getAttribute("data-type");
        let actualId = el.getAttribute("data-id") || el.id;
        if (elType === "landmark-label") {
          actualId = el.getAttribute("data-parent-id");
        }
        if (!actualId || actualId === "dest_pin" || actualId === "dest_label") return;

        if (this.callbacks.onDeleteElement) {
          this.callbacks.onDeleteElement(actualId, elType);
        }
      });
    });

    // キャンバス背景クリック（選択解除 / クリック配置）
    svgEl.addEventListener("click", (e) => {
      if (this.state.hasMoved) return;

      // 施設や文字以外の背景クリック時は選択解除
      if (!e.target.closest(".draggable")) {
        if (this.callbacks.onElementSelect) {
          this.callbacks.onElementSelect(null, null);
        }
      }

      // 新規文字または施設スタンプの直接配置
      if (this.state.mode === "text" || this.state.mode === "poi") {
        const pt = this.getSvgPoint(e, svgEl);
        const pxPerMm = 10.0;
        const wPx = this.state.widthMm * pxPerMm;
        const hPx = this.state.heightMm * pxPerMm;
        const [lon, lat] = GeoUtil.svgToGeo(pt.x, pt.y, wPx, hPx, this.state.frameCenter, this.state.effectiveRadiusM, this.state.widthMm, this.state.heightMm);

        if (this.callbacks.onCanvasClickAdd) {
          this.callbacks.onCanvasClickAdd(lat, lon, this.state.mode);
        }
      }
    });
  }

  bindWindowEvents() {
    // マウスドラッグ移動
    window.addEventListener("mousemove", (e) => {
      if (!this.state.isDraggingSvg || !this.state.dragSvgTarget) return;
      const svgEl = this.svgContainer.querySelector("svg");
      if (!svgEl) return;

      const currentPt = this.getSvgPoint(e, svgEl);
      const dx = currentPt.x - this.state.dragSvgStart.x;
      const dy = currentPt.y - this.state.dragSvgStart.y;

      if (Math.abs(dx) > 3.5 || Math.abs(dy) > 3.5) {
        this.state.hasMoved = true;
      }

      const newX = this.state.elementSvgStart.x + dx;
      const newY = this.state.elementSvgStart.y + dy;

      // 回転属性・スケール属性の維持
      const origTransform = this.state.dragSvgTarget.getAttribute("transform") || "";
      const rotMatch = /rotate\([^)]+\)/.exec(origTransform);
      const rotStr = rotMatch ? ` ${rotMatch[0]}` : "";
      const scaleMatch = /scale\([^)]+\)/.exec(origTransform);
      const scaleStr = scaleMatch ? ` ${scaleMatch[0]}` : "";

      this.state.dragSvgTarget.setAttribute("transform", `translate(${newX.toFixed(1)}, ${newY.toFixed(1)})${rotStr}${scaleStr}`);
    });

    // マウスドラッグ終了
    window.addEventListener("mouseup", () => {
      if (this.state.isDraggingSvg && this.state.dragSvgTarget && this.state.hasMoved) {
        const target = this.state.dragSvgTarget;
        const transform = target.getAttribute("transform") || "";
        const match = /translate\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/.exec(transform);

        if (match) {
          const finalX = parseFloat(match[1]);
          const finalY = parseFloat(match[2]);
          const pxPerMm = 10.0;
          const wPx = this.state.widthMm * pxPerMm;
          const hPx = this.state.heightMm * pxPerMm;

          const elId = target.id || target.getAttribute("data-id");
          const elType = target.getAttribute("data-type");

          this.state.saveToHistory();

          // 0. 方位記号
          if (elId === "compass" || elType === "compass") {
            this.state.compass.x = finalX;
            this.state.compass.y = finalY;
            if (this.callbacks.onShowToast) this.callbacks.onShowToast("方位記号の位置を更新しました");

          // 1. 目的地ピン本体
          } else if (elId === "dest_pin" || elType === "dest-icon") {
            const [newLon, newLat] = GeoUtil.svgToGeo(finalX, finalY, wPx, hPx, this.state.frameCenter, this.state.effectiveRadiusM, this.state.widthMm, this.state.heightMm);
            this.state.dest.lat = newLat;
            this.state.dest.lon = newLon;
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(`「${this.state.dest.name}」の位置を更新しました`);

          // 2. 目的地「現地」プレート
          } else if (elId === "dest_label" || elType === "dest-label") {
            const [destSvgX, destSvgY] = GeoUtil.geoToSvg(this.state.dest.lon, this.state.dest.lat, wPx, hPx, this.state.frameCenter, this.state.effectiveRadiusM, this.state.widthMm, this.state.heightMm);
            this.state.dest.labelOffsetX = finalX - destSvgX;
            this.state.dest.labelOffsetY = finalY - destSvgY;
            if (this.callbacks.onShowToast) this.callbacks.onShowToast(`「${this.state.dest.name}」プレートの位置を調整しました`);

          // 3. 施設ラベル (交差点名・駅名・スーパー名等) ★重要: 型不一致を確実に解消
          } else if (elType === "landmark-label") {
            const parentId = target.getAttribute("data-parent-id");
            const landmark = this.state.findLandmark(parentId);
            if (landmark) {
              const [iconSvgX, iconSvgY] = GeoUtil.geoToSvg(landmark.lon, landmark.lat, wPx, hPx, this.state.frameCenter, this.state.effectiveRadiusM, this.state.widthMm, this.state.heightMm);
              landmark.labelOffsetX = finalX - iconSvgX;
              landmark.labelOffsetY = finalY - iconSvgY;
              if (this.callbacks.onShowToast) this.callbacks.onShowToast(`「${landmark.name}」の文字位置を更新しました`);
            }

          // 4. 施設アイコン
          } else if (elType === "landmark-icon") {
            const actualId = target.getAttribute("data-id") || elId.replace("icon_", "");
            const [newLon, newLat] = GeoUtil.svgToGeo(finalX, finalY, wPx, hPx, this.state.frameCenter, this.state.effectiveRadiusM, this.state.widthMm, this.state.heightMm);
            const landmark = this.state.findLandmark(actualId);
            if (landmark) {
              landmark.lat = newLat;
              landmark.lon = newLon;
              if (this.callbacks.onShowToast) this.callbacks.onShowToast(`「${landmark.name}」の位置を更新しました`);
            }

          // 5. 自由テキスト・通称
          } else if (elType === "text") {
            const [newLon, newLat] = GeoUtil.svgToGeo(finalX, finalY, wPx, hPx, this.state.frameCenter, this.state.effectiveRadiusM, this.state.widthMm, this.state.heightMm);
            const txt = this.state.findText(elId);
            if (txt) {
              txt.lat = newLat;
              txt.lon = newLon;
              if (this.callbacks.onShowToast) this.callbacks.onShowToast(`「${txt.text}」の位置を更新しました`);
            }

          // 6. 自由テキストの引き出し線対象地点アンカー (両端ドラッグ)
          } else if (elType === "text-anchor") {
            const parentId = target.getAttribute("data-parent-id");
            const txt = this.state.findText(parentId);
            if (txt) {
              const [txtSvgX, txtSvgY] = GeoUtil.geoToSvg(txt.lon, txt.lat, wPx, hPx, this.state.frameCenter, this.state.effectiveRadiusM, this.state.widthMm, this.state.heightMm);
              txt.leaderOffsetX = finalX - txtSvgX;
              txt.leaderOffsetY = finalY - txtSvgY;
              if (this.callbacks.onShowToast) this.callbacks.onShowToast("引き出し線の対象地点を更新しました");
            }
          }

          if (this.callbacks.onStateChange) this.callbacks.onStateChange();
        }
      }

      this.state.isDraggingSvg = false;
      this.state.dragSvgTarget = null;
      setTimeout(() => { this.state.hasMoved = false; }, 50);
    });

    // キーボードショートカット
    window.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : "";
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") return;

      if (e.ctrlKey && e.key === "s") {
        e.preventDefault();
        if (this.callbacks.onSaveProject) this.callbacks.onSaveProject();
      } else if (e.ctrlKey && e.key === "z") {
        e.preventDefault();
        if (this.callbacks.onUndo) this.callbacks.onUndo();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (this.state.selectedId) {
          e.preventDefault();
          if (this.callbacks.onDeleteElement) {
            this.callbacks.onDeleteElement(this.state.selectedId, this.state.selectedType);
          }
        }
      } else if (e.key === "Escape") {
        if (this.callbacks.onElementSelect) {
          this.callbacks.onElementSelect(null, null);
        }
      } else if (e.key === "v" || e.key === "V") {
        // Vキーで選択ツールに切り替え
        if (this.callbacks.onSetMode) {
          this.callbacks.onSetMode("select");
        }
      }
    });
  }
}
