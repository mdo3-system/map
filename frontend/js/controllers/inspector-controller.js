// ==========================================
// inspector-controller.js: 常駐インスペクター管理コントローラー (SRP)
// 責務: 常駐インスペクターバーの表示切替、選択要素（敷地・文字・施設・ピン等）との双方向同期
// ==========================================

export class InspectorController {
  constructor(state, callbacks = {}) {
    this.state = state;
    this.callbacks = callbacks; // { onUpdate, onDelete, showToast, mapTrace }

    // パネル要素
    this.inspectorSelected = document.getElementById("inspectorSelected");
    this.inspectorDrawing = document.getElementById("inspectorDrawing");
    this.inspectorLot = document.getElementById("inspectorLot");
    this.inspectorRail = document.getElementById("inspectorRail");
    this.inspectorRoad = document.getElementById("inspectorRoad");
    this.inspectorPoi = document.getElementById("inspectorPoi");
    this.inspectorText = document.getElementById("inspectorText");

    // 要素選択インスペクター
    this.selectedBadge = document.getElementById("selectedBadge");
    this.inspectorNameField = document.getElementById("inspectorNameField");
    this.inspectorName = document.getElementById("inspectorName");
    this.inspectorFontSizeField = document.getElementById("inspectorFontSizeField");
    this.inspectorFontSizeSlider = document.getElementById("inspectorFontSizeSlider");
    this.inspectorFontSizeVal = document.getElementById("inspectorFontSizeVal");
    this.inspectorRotationField = document.getElementById("inspectorRotationField");
    this.inspectorRotationSlider = document.getElementById("inspectorRotationSlider");
    this.inspectorRotationVal = document.getElementById("inspectorRotationVal");
    this.inspectorLeaderLineLabel = document.getElementById("inspectorLeaderLineLabel");
    this.inspectorLeaderLine = document.getElementById("inspectorLeaderLine");
    this.btnInspectorDelete = document.getElementById("btnInspectorDelete");

    // 施設記号サイズ
    this.inspectorIconScaleField = document.getElementById("inspectorIconScaleField");
    this.inspectorIconScaleDivider = document.getElementById("inspectorIconScaleDivider");
    this.inspectorIconScaleSlider = document.getElementById("inspectorIconScaleSlider");
    this.inspectorIconScaleVal = document.getElementById("inspectorIconScaleVal");

    // プレート色
    this.inspectorPlateBgField = document.getElementById("inspectorPlateBgField");
    this.inspectorPlateBgDivider = document.getElementById("inspectorPlateBgDivider");
    this.inspectorPlateBgColor = document.getElementById("inspectorPlateBgColor");

    // 文字色・白フチ
    this.inspectorTextColorField = document.getElementById("inspectorTextColorField");
    this.inspectorTextColorDivider = document.getElementById("inspectorTextColorDivider");
    this.inspectorTextColor = document.getElementById("inspectorTextColor");
    this.inspectorHaloLabel = document.getElementById("inspectorHaloLabel");
    this.inspectorHaloDivider = document.getElementById("inspectorHaloDivider");
    this.inspectorHalo = document.getElementById("inspectorHalo");

    // 敷地インスペクター
    this.lotHasFill = document.getElementById("lotHasFill");
    this.lotFillColor = document.getElementById("lotFillColor");
    this.lotFillOpacity = document.getElementById("lotFillOpacity");
    this.lotFillOpacityVal = document.getElementById("lotFillOpacityVal");
    this.lotHasStroke = document.getElementById("lotHasStroke");
    this.lotStrokeColor = document.getElementById("lotStrokeColor");
    this.lotStrokeWidth = document.getElementById("lotStrokeWidth");
    this.lotStrokeWidthVal = document.getElementById("lotStrokeWidthVal");
    this.lotStrokeDash = document.getElementById("lotStrokeDash");
    this.lotLabel = document.getElementById("lotLabel");
    this.lotFontSize = document.getElementById("lotFontSize");
    this.lotFontSizeVal = document.getElementById("lotFontSizeVal");
    this.btnLotToggleSite = document.getElementById("btnLotToggleSite");
    this.btnLotDelete = document.getElementById("btnLotDelete");

    this.bindEvents();
  }

  /**
   * 選択状態またはモードに応じたインスペクターの更新
   */
  update() {
    // 全インスペクターを一旦非表示
    if (this.inspectorSelected) this.inspectorSelected.style.display = "none";
    if (this.inspectorDrawing) this.inspectorDrawing.style.display = "none";
    if (this.inspectorLot) this.inspectorLot.style.display = "none";
    if (this.inspectorRail) this.inspectorRail.style.display = "none";
    if (this.inspectorRoad) this.inspectorRoad.style.display = "none";
    if (this.inspectorPoi) this.inspectorPoi.style.display = "none";
    if (this.inspectorText) this.inspectorText.style.display = "none";

    // 作図中判定
    const isDrawingMode = ["lot", "major_road", "medium_road", "minor_road", "railway", "route"].includes(this.state.mode);
    if (isDrawingMode && (this.state.drawingPoints || []).length > 0) {
      if (this.inspectorDrawing) {
        this.inspectorDrawing.style.display = "flex";
        const countEl = document.getElementById("drawingPointCount");
        if (countEl) countEl.textContent = this.state.drawingPoints.length;
      }
      return;
    }

    if (this.state.mode === "select" && this.state.selectedId) {
      const sel = this.state.getSelectedElementData();
      if (!sel) return;

      if (sel.type === "road" || sel.type === "rail" || sel.type === "route") {
        if (sel.type === "road" && this.inspectorRoad) this.inspectorRoad.style.display = "flex";
        if (sel.type === "rail" && this.inspectorRail) this.inspectorRail.style.display = "flex";
        return;
      }

      // 敷地（lot）の場合
      if (sel.type === "lot" || sel.type === "lot-label") {
        if (this.inspectorLot) {
          this.inspectorLot.style.display = "flex";
          const lot = sel.data;
          const isSite = !!lot.isSite;

          if (this.lotHasFill) this.lotHasFill.checked = (lot.hasFill !== false);
          if (this.lotFillColor) this.lotFillColor.value = lot.fillColor || (isSite ? "#ef4444" : "#3b82f6");
          const op = lot.fillOpacity !== undefined ? lot.fillOpacity : (isSite ? 0.35 : 0.25);
          if (this.lotFillOpacity) this.lotFillOpacity.value = op;
          if (this.lotFillOpacityVal) this.lotFillOpacityVal.textContent = `${Math.round(op * 100)}%`;

          if (this.lotHasStroke) this.lotHasStroke.checked = (lot.hasStroke !== false);
          if (this.lotStrokeColor) this.lotStrokeColor.value = lot.strokeColor || (isSite ? "#dc2626" : "#2563eb");
          const sw = lot.strokeWidth !== undefined ? lot.strokeWidth : (isSite ? 4.0 : 2.5);
          if (this.lotStrokeWidth) this.lotStrokeWidth.value = sw;
          if (this.lotStrokeWidthVal) this.lotStrokeWidthVal.textContent = String(sw);
          if (this.lotStrokeDash) this.lotStrokeDash.value = (lot.strokeDash === "dashed") ? "dashed" : "solid";

          if (this.btnLotToggleSite) {
            this.btnLotToggleSite.textContent = isSite ? "◎ 申請地指定中 (解除)" : "◎ 申請地に指定";
            this.btnLotToggleSite.style.background = isSite ? "#dc2626" : "#fef2f2";
            this.btnLotToggleSite.style.color = isSite ? "#ffffff" : "#dc2626";
          }
          if (this.lotLabel) this.lotLabel.value = lot.label || "";
          const fSize = lot.fontSize || 16;
          if (this.lotFontSize) this.lotFontSize.value = fSize;
          if (this.lotFontSizeVal) this.lotFontSizeVal.textContent = `${fSize}px`;
        }
        return;
      }

      // 汎用要素（目的地・施設・テキスト）の場合
      if (this.inspectorSelected) {
        this.inspectorSelected.style.display = "flex";

        // 施設記号サイズ
        if (sel.type === "landmark" && this.inspectorIconScaleField) {
          this.inspectorIconScaleField.style.display = "flex";
          if (this.inspectorIconScaleDivider) this.inspectorIconScaleDivider.style.display = "block";
          const iScale = sel.data.iconScale !== undefined ? sel.data.iconScale : 1.0;
          if (this.inspectorIconScaleSlider) this.inspectorIconScaleSlider.value = iScale;
          if (this.inspectorIconScaleVal) this.inspectorIconScaleVal.textContent = `${iScale.toFixed(1)}x`;
        } else {
          if (this.inspectorIconScaleField) this.inspectorIconScaleField.style.display = "none";
          if (this.inspectorIconScaleDivider) this.inspectorIconScaleDivider.style.display = "none";
        }

        // プレート背景色
        const isStn = (sel.type === "landmark" && (sel.data.category === "station" || sel.data.icon_type === "station"));
        if ((sel.type === "dest" || isStn) && this.inspectorPlateBgField) {
          this.inspectorPlateBgField.style.display = "flex";
          if (this.inspectorPlateBgDivider) this.inspectorPlateBgDivider.style.display = "block";
          if (this.inspectorPlateBgColor) {
            this.inspectorPlateBgColor.value = sel.type === "dest" ? (sel.data.bgColor || "#d32f2f") : (sel.data.bgColor || "#1e3a8a");
          }
        } else {
          if (this.inspectorPlateBgField) this.inspectorPlateBgField.style.display = "none";
          if (this.inspectorPlateBgDivider) this.inspectorPlateBgDivider.style.display = "none";
        }

        if (sel.type === "dest" || sel.type === "dest-icon") {
          const isIcon = (sel.type === "dest-icon" || this.state.selectedId === "dest_pin" || this.state.selectedType === "dest-icon");
          if (this.selectedBadge) {
            this.selectedBadge.textContent = isIcon
              ? (this.state.appMode === "permit" ? "申請地記号(◎)" : "目的地ピン")
              : (this.state.appMode === "permit" ? "申請地プレート" : "目的地プレート");
          }
          if (isIcon) {
            if (this.inspectorNameField) this.inspectorNameField.style.display = "none";
            if (this.inspectorFontSizeField) this.inspectorFontSizeField.style.display = "none";
            if (this.inspectorRotationField) this.inspectorRotationField.style.display = "none";
            if (this.inspectorLeaderLineLabel) this.inspectorLeaderLineLabel.style.display = "none";
            if (this.btnInspectorDelete) {
              this.btnInspectorDelete.style.display = "inline-flex";
              this.btnInspectorDelete.textContent = "🗑️ 記号削除";
            }
          } else {
            if (this.inspectorName) this.inspectorName.value = sel.data.name || (this.state.appMode === "permit" ? "申請地" : "現地");
            if (this.inspectorNameField) this.inspectorNameField.style.display = "flex";
            if (this.inspectorLeaderLineLabel) this.inspectorLeaderLineLabel.style.display = "flex";
            if (this.inspectorFontSizeField) this.inspectorFontSizeField.style.display = "flex";
            if (this.inspectorFontSizeSlider) this.inspectorFontSizeSlider.value = sel.data.fontSize || 24;
            if (this.inspectorFontSizeVal) this.inspectorFontSizeVal.textContent = `${sel.data.fontSize || 24}px`;
            if (this.inspectorRotationField) this.inspectorRotationField.style.display = "flex";
            if (this.inspectorRotationSlider) this.inspectorRotationSlider.value = sel.data.rotation || 0;
            if (this.inspectorRotationVal) this.inspectorRotationVal.textContent = `${sel.data.rotation || 0}°`;
            if (this.inspectorLeaderLine) this.inspectorLeaderLine.checked = !!sel.data.hasLeaderLine;
            if (this.btnInspectorDelete) {
              this.btnInspectorDelete.style.display = "inline-flex";
              this.btnInspectorDelete.textContent = "🗑️ プレート削除";
            }
          }
        } else if (sel.type === "landmark") {
          if (this.selectedBadge) {
            this.selectedBadge.textContent = sel.data.category === "station" ? "駅" : sel.data.icon_type === "signal" ? "信号機" : "施設";
          }
          if (this.inspectorName) this.inspectorName.value = sel.data.name || "";
          if (this.inspectorNameField) this.inspectorNameField.style.display = "flex";
          const fSize = sel.data.fontSize || (sel.data.category === "station" ? 13 : 11.5);
          if (this.inspectorFontSizeField) this.inspectorFontSizeField.style.display = "flex";
          if (this.inspectorFontSizeSlider) this.inspectorFontSizeSlider.value = fSize;
          if (this.inspectorFontSizeVal) this.inspectorFontSizeVal.textContent = `${fSize}px`;
          if (this.inspectorRotationField) this.inspectorRotationField.style.display = "flex";
          if (this.inspectorRotationSlider) this.inspectorRotationSlider.value = sel.data.rotation || 0;
          if (this.inspectorRotationVal) this.inspectorRotationVal.textContent = `${sel.data.rotation || 0}°`;
          if (this.inspectorLeaderLine) this.inspectorLeaderLine.checked = !!sel.data.hasLeaderLine;
          if (this.inspectorLeaderLineLabel) this.inspectorLeaderLineLabel.style.display = "flex";
          if (this.btnInspectorDelete) {
            this.btnInspectorDelete.style.display = "inline-flex";
            this.btnInspectorDelete.textContent = "🗑️ 削除";
          }
        } else if (sel.type === "text") {
          if (this.selectedBadge) this.selectedBadge.textContent = "文字";
          if (this.inspectorName) this.inspectorName.value = sel.data.text || "";
          if (this.inspectorNameField) this.inspectorNameField.style.display = "flex";
          const fSize = sel.data.fontSize || 12;
          if (this.inspectorFontSizeField) this.inspectorFontSizeField.style.display = "flex";
          if (this.inspectorFontSizeSlider) this.inspectorFontSizeSlider.value = fSize;
          if (this.inspectorFontSizeVal) this.inspectorFontSizeVal.textContent = `${fSize}px`;
          if (this.inspectorRotationField) this.inspectorRotationField.style.display = "flex";
          if (this.inspectorRotationSlider) this.inspectorRotationSlider.value = sel.data.rotation || 0;
          if (this.inspectorRotationVal) this.inspectorRotationVal.textContent = `${sel.data.rotation || 0}°`;
          if (this.inspectorLeaderLine) this.inspectorLeaderLine.checked = !!sel.data.hasLeaderLine;
          if (this.inspectorLeaderLineLabel) this.inspectorLeaderLineLabel.style.display = "flex";
          if (this.btnInspectorDelete) {
            this.btnInspectorDelete.style.display = "inline-flex";
            this.btnInspectorDelete.textContent = "🗑️ 削除";
          }

          if (this.inspectorTextColorField) {
            this.inspectorTextColorField.style.display = "flex";
            if (this.inspectorTextColorDivider) this.inspectorTextColorDivider.style.display = "block";
            if (this.inspectorTextColor) this.inspectorTextColor.value = sel.data.color || "#0f172a";
          }
          if (this.inspectorHaloLabel) {
            this.inspectorHaloLabel.style.display = "flex";
            if (this.inspectorHaloDivider) this.inspectorHaloDivider.style.display = "block";
            if (this.inspectorHalo) this.inspectorHalo.checked = (sel.data.hasHalo !== false);
          }
        }
      }
    } else {
      // 選択解除時: 現在のモードに応じた設定パネルを表示
      if (this.inspectorRail) this.inspectorRail.style.display = this.state.mode === "railway" ? "flex" : "none";
      if (this.inspectorRoad) this.inspectorRoad.style.display = ["major_road", "medium_road", "minor_road"].includes(this.state.mode) ? "flex" : "none";
      if (this.inspectorPoi) this.inspectorPoi.style.display = this.state.mode === "poi" ? "flex" : "none";
      if (this.inspectorText) this.inspectorText.style.display = this.state.mode === "text" ? "flex" : "none";
    }
  }

  /**
   * イベントリスナーの登録
   */
  bindEvents() {
    // 汎用要素インスペクター: 名前変更
    if (this.inspectorName) {
      this.inspectorName.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (!sel) return;
        this.state.saveToHistory();
        const val = e.target.value;
        if (sel.type === "dest") {
          sel.data.name = val;
          const inputDest = document.getElementById("inputDestName");
          if (inputDest) inputDest.value = val;
        } else if (sel.type === "landmark") {
          sel.data.name = val;
        } else if (sel.type === "text") {
          sel.data.text = val;
        }
        if (this.callbacks.onUpdate) this.callbacks.onUpdate();
      });
    }

    // 文字サイズスライダー
    if (this.inspectorFontSizeSlider) {
      this.inspectorFontSizeSlider.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (!sel) return;
        const val = parseFloat(e.target.value);
        sel.data.fontSize = val;
        if (this.inspectorFontSizeVal) this.inspectorFontSizeVal.textContent = `${val}px`;
        if (this.callbacks.onUpdate) this.callbacks.onUpdate();
      });
      this.inspectorFontSizeSlider.addEventListener("change", () => this.state.saveToHistory());
    }

    // 引き出し線チェック
    if (this.inspectorLeaderLine) {
      this.inspectorLeaderLine.addEventListener("change", (e) => {
        const sel = this.state.getSelectedElementData();
        if (!sel) return;
        this.state.saveToHistory();
        sel.data.hasLeaderLine = e.target.checked;
        if (this.callbacks.onUpdate) this.callbacks.onUpdate();
      });
    }

    // 敷地インスペクター: ラベル文字
    if (this.lotLabel) {
      this.lotLabel.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && (sel.type === "lot" || sel.type === "lot-label")) {
          this.state.saveToHistory();
          sel.data.label = e.target.value;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
    }

    // 敷地インスペクター: 文字サイズ
    if (this.lotFontSize) {
      this.lotFontSize.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && (sel.type === "lot" || sel.type === "lot-label")) {
          const val = parseInt(e.target.value, 10) || 16;
          sel.data.fontSize = val;
          if (this.lotFontSizeVal) this.lotFontSizeVal.textContent = `${val}px`;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
      this.lotFontSize.addEventListener("change", () => this.state.saveToHistory());
    }

    // 敷地インスペクター: 塗りつぶし・枠線
    if (this.lotHasFill) {
      this.lotHasFill.addEventListener("change", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && sel.type === "lot") {
          this.state.saveToHistory();
          sel.data.hasFill = e.target.checked;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
    }

    if (this.lotFillColor) {
      this.lotFillColor.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && sel.type === "lot") {
          sel.data.fillColor = e.target.value;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
      this.lotFillColor.addEventListener("change", () => this.state.saveToHistory());
    }

    if (this.lotFillOpacity) {
      this.lotFillOpacity.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && sel.type === "lot") {
          const val = parseFloat(e.target.value);
          sel.data.fillOpacity = val;
          if (this.lotFillOpacityVal) this.lotFillOpacityVal.textContent = `${Math.round(val * 100)}%`;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
      this.lotFillOpacity.addEventListener("change", () => this.state.saveToHistory());
    }

    if (this.lotHasStroke) {
      this.lotHasStroke.addEventListener("change", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && sel.type === "lot") {
          this.state.saveToHistory();
          sel.data.hasStroke = e.target.checked;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
    }

    if (this.lotStrokeColor) {
      this.lotStrokeColor.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && sel.type === "lot") {
          sel.data.strokeColor = e.target.value;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
      this.lotStrokeColor.addEventListener("change", () => this.state.saveToHistory());
    }

    if (this.lotStrokeWidth) {
      this.lotStrokeWidth.addEventListener("input", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && sel.type === "lot") {
          const val = parseFloat(e.target.value);
          sel.data.strokeWidth = val;
          if (this.lotStrokeWidthVal) this.lotStrokeWidthVal.textContent = String(val);
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
      this.lotStrokeWidth.addEventListener("change", () => this.state.saveToHistory());
    }

    if (this.lotStrokeDash) {
      this.lotStrokeDash.addEventListener("change", (e) => {
        const sel = this.state.getSelectedElementData();
        if (sel && sel.type === "lot") {
          this.state.saveToHistory();
          sel.data.strokeDash = e.target.value;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
    }

    // 敷地 申請地トグル
    if (this.btnLotToggleSite) {
      this.btnLotToggleSite.addEventListener("click", () => {
        const sel = this.state.getSelectedElementData();
        if (sel && (sel.type === "lot" || sel.type === "lot-label")) {
          this.state.saveToHistory();
          sel.data.isSite = !sel.data.isSite;
          this.update();
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
          if (this.callbacks.showToast) {
            this.callbacks.showToast(sel.data.isSite ? "区画を「申請地」に指定しました" : "区画を「一般区画」に設定しました");
          }
        }
      });
    }

    // 敷地削除
    if (this.btnLotDelete) {
      this.btnLotDelete.addEventListener("click", () => {
        if (this.state.selectedId && this.callbacks.onDelete) {
          this.callbacks.onDelete(this.state.selectedId, "lot");
        }
      });
    }

    // 汎用要素削除
    if (this.btnInspectorDelete) {
      this.btnInspectorDelete.addEventListener("click", () => {
        if (this.state.selectedId && this.callbacks.onDelete) {
          this.callbacks.onDelete(this.state.selectedId, this.state.selectedType);
        }
      });
    }
  }
}
