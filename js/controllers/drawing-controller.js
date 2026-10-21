// ==========================================
// drawing-controller.js: 作図フロー制御コントローラー (SRP)
// 責務: 敷地・道路・線路・ルートの作図中頂点管理、完了判定、完了/取消の状態遷移のみを担当
// ==========================================

export class DrawingController {
  constructor(state, mapTrace, callbacks = {}) {
    this.state = state;
    this.mapTrace = mapTrace;
    this.callbacks = callbacks; // { onFinish, onCancel, onModeChange, showToast, syncAll, updateActionBar }
  }

  /**
   * 現在の作図をキャンセルして選択モードへ復帰
   */
  cancel() {
    this.state.drawingPoints = [];
    if (this.state.activePolyline) {
      this.mapTrace.map.removeLayer(this.state.activePolyline);
      this.state.activePolyline = null;
    }
    this.updateActionBar();
    if (this.callbacks.setMode) {
      this.callbacks.setMode("select");
    }
    if (this.callbacks.showToast) {
      this.callbacks.showToast("作図を取り消しました（選択モードに戻りました）");
    }
    if (this.callbacks.syncAll) {
      this.callbacks.syncAll();
    }
  }

  /**
   * 現在の作図を完了して図形データを生成
   */
  finish() {
    let createdId = null;
    let createdType = null;

    if (this.state.mode === "lot" && (this.state.drawingPoints || []).length >= 3) {
      this.state.saveToHistory();
      const lotId = `lot_${Date.now()}`;
      const pts = this.state.drawingPoints.map(p => ({ lat: p[0], lon: p[1] }));
      const lotCount = (this.state.lots || []).length + 1;
      const isFirst = ((this.state.lots || []).length === 0);

      this.state.lots.push({
        id: lotId,
        points: pts,
        isSite: isFirst,
        label: isFirst ? "申請地" : `${lotCount}号地`,
        hasFill: true,
        fillColor: isFirst ? "#ef4444" : "#3b82f6",
        fillOpacity: isFirst ? 0.35 : 0.25,
        hasStroke: true,
        strokeColor: isFirst ? "#dc2626" : "#2563eb",
        strokeWidth: isFirst ? 4.0 : 2.5,
        strokeDash: "solid"
      });

      // 敷地を作図した場合は、既存の現地ピン・丸印を自動非表示にして二重表示を解消
      if (this.state.appMode === "permit" || isFirst) {
        this.state.dest.hidePin = true;
        if (this.state.permitScene && this.state.permitScene.dest) {
          this.state.permitScene.dest.hidePin = true;
        }
        const chk = document.getElementById("checkPermitSiteMarker");
        if (chk) chk.checked = false;
      }

      createdId = lotId;
      createdType = "lot";
      if (this.callbacks.showToast) {
        this.callbacks.showToast(`📐 敷地「${isFirst ? '申請地' : lotCount + '号地'}」を作図しました（選択・編集モードに切り替えました）`);
      }
    } else if ((this.state.drawingPoints || []).length >= 2) {
      this.state.saveToHistory();
      if (["major_road", "medium_road", "minor_road"].includes(this.state.mode)) {
        const roadType = this.state.mode === "major_road" ? "major" : this.state.mode === "medium_road" ? "medium" : "minor";
        const roadId = `road_${Date.now()}`;
        this.state.roads.push({
          id: roadId,
          type: roadType,
          points: [...this.state.drawingPoints],
          casingColor: this.state.roadCasingColor,
          innerColor: this.state.roadInnerColor,
          filled: this.state.roadFilled,
          fillColor: this.state.roadFillColor
        });
        createdId = roadId;
        createdType = "road";
      } else if (this.state.mode === "railway") {
        const railId = `rail_${Date.now()}`;
        this.state.rails.push({
          id: railId,
          points: [...this.state.drawingPoints]
        });
        createdId = railId;
        createdType = "rail";
      } else if (this.state.mode === "route") {
        const routeId = `route_${Date.now()}`;
        this.state.routes.push({
          id: routeId,
          points: [...this.state.drawingPoints]
        });
        createdId = routeId;
        createdType = "route";
      }
    }

    this.state.drawingPoints = [];
    if (this.state.activePolyline) {
      this.mapTrace.map.removeLayer(this.state.activePolyline);
      this.state.activePolyline = null;
    }
    this.updateActionBar();

    // 作図完了後は必ず選択モード（select）に切り替え！
    if (this.callbacks.setMode) {
      this.callbacks.setMode("select");
    }
    if (createdId) {
      this.state.selectedId = createdId;
      this.state.selectedType = createdType;
      if (this.callbacks.updateInspector) {
        this.callbacks.updateInspector();
      }
    }
    if (this.callbacks.syncAll) {
      this.callbacks.syncAll();
    }
  }

  /**
   * 作図アクションバーの表示・頂点数更新
   */
  updateActionBar() {
    const bar = document.getElementById("inspectorDrawing");
    const countEl = document.getElementById("drawingPointCount");
    const pts = this.state.drawingPoints || [];
    const isDrawingMode = ["lot", "major_road", "medium_road", "minor_road", "railway", "route"].includes(this.state.mode);

    if (bar && countEl) {
      if (isDrawingMode && pts.length > 0) {
        bar.style.display = "flex";
        countEl.textContent = pts.length;
      } else {
        bar.style.display = "none";
      }
    }
  }
}
