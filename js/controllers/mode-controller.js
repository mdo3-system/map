// ==========================================
// mode-controller.js: アプリ動作モード管理コントローラー (SRP)
// 責務: 案内図モード ⇄ 各種申請モードの切替、ツールバー出し分け、用紙サイズ・縮尺同期のみを担当
// ==========================================

import { GeoUtil } from "../geo.js";

export class ModeController {
  constructor(state, mapTrace, callbacks = {}) {
    this.state = state;
    this.mapTrace = mapTrace;
    this.callbacks = callbacks; // { renderSvg, syncAll, setMode, showToast }
  }

  /**
   * アプリケーションのモードを切り替え
   * @param {"ad" | "permit"} mode 
   */
  setAppMode(mode) {
    if (this.state.appMode === mode) return;

    // 1. state側の作図データ完全分離スワップ
    this.state.switchAppMode(mode);

    // 2. ツールバー・UIの表示同期
    this.applyToolbarVisibility(mode);
    this.syncUI();

    if (mode === "permit") {
      const scale = (this.state.permitInfo && this.state.permitInfo.scale) || 2500;
      this.state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(scale, this.state.widthMm, 10);
      if (this.callbacks.showToast) {
        this.callbacks.showToast("📑 【各種申請モード】1/2500 国土地理院白図・見取図モードに切り替えました");
      }
    } else {
      if (this.callbacks.showToast) {
        this.callbacks.showToast("🏢 【案内図モード】チラシ・Web用案内図モードに切り替えました");
      }
    }

    if (this.callbacks.setMode) {
      this.callbacks.setMode("select");
    }

    // 左画面地図および作図枠マーカーを中心へ完全同期
    if (this.mapTrace && this.mapTrace.map) {
      this.mapTrace.map.setView([this.state.frameCenter.lat, this.state.frameCenter.lon]);
      this.mapTrace.destMarker.setLatLng([this.state.dest.lat, this.state.dest.lon]);
      this.mapTrace.frameCenterMarker.setLatLng([this.state.frameCenter.lat, this.state.frameCenter.lon]);
      this.mapTrace.updateFramingRectangle();
      this.mapTrace.updateDestPinIcon();
    }

    if (this.callbacks.syncAll) {
      this.callbacks.syncAll();
    }
  }

  /**
   * ツールバーボタンやインスペクターの可視性制御
   */
  applyToolbarVisibility(mode) {
    const isPermit = (mode === "permit");
    const btnModeAd = document.getElementById("btnModeAd");
    const btnModePermit = document.getElementById("btnModePermit");
    const inspectorPermit = document.getElementById("inspectorPermit");

    if (btnModeAd) btnModeAd.classList.toggle("active", !isPermit);
    if (btnModePermit) {
      btnModePermit.classList.toggle("permit-active", isPermit);
      btnModePermit.classList.toggle("active", isPermit);
    }
    if (inspectorPermit) {
      inspectorPermit.style.display = isPermit ? "flex" : "none";
    }

    document.querySelectorAll(".tool-ad-only").forEach(el => {
      el.style.display = isPermit ? "none" : "flex";
    });
    document.querySelectorAll(".tool-permit-only").forEach(el => {
      el.style.display = isPermit ? "flex" : "none";
    });
  }

  /**
   * 各種申請インスペクターおよびヘッダー入力欄と state の双方向同期
   */
  syncUI() {
    const isPermit = (this.state.appMode === "permit");
    this.applyToolbarVisibility(this.state.appMode);

    const permitTitle = document.getElementById("permitTitle");
    const permitLotNumber = document.getElementById("permitLotNumber");
    const permitAddress = document.getElementById("permitAddress");
    const permitArchitectNo = document.getElementById("permitArchitectNo");
    const permitArchitectName = document.getElementById("permitArchitectName");
    const permitBaseMap = document.getElementById("permitBaseMap");
    const permitScale = document.getElementById("permitScale");
    const permitPaperSize = document.getElementById("permitPaperSize");
    const permitBoxPosition = document.getElementById("permitBoxPosition");
    const permitTileZoom = document.getElementById("permitTileZoom");
    const checkPermitSiteMarker = document.getElementById("checkPermitSiteMarker");
    const inputWidthMm = document.getElementById("inputWidthMm");
    const inputHeightMm = document.getElementById("inputHeightMm");
    const inputDestName = document.getElementById("inputDestName");
    const badgeScale = document.getElementById("badgeScale");

    const info = this.state.permitInfo || {};
    if (permitTitle) permitTitle.value = info.title || "付近見取図";
    if (permitLotNumber) permitLotNumber.value = info.lotNumber || "";
    if (permitAddress) permitAddress.value = info.address || "";
    if (permitArchitectNo) permitArchitectNo.value = info.architectNo || "";
    if (permitArchitectName) permitArchitectName.value = info.architectName || "";
    if (permitBaseMap) permitBaseMap.value = info.baseMapType || "osm";
    if (permitScale) permitScale.value = String(info.scale || 2500);
    if (permitPaperSize) permitPaperSize.value = info.paperSize || "A4_landscape";
    if (permitBoxPosition) permitBoxPosition.value = info.boxPosition || "bottom-right";
    if (permitTileZoom) permitTileZoom.value = info.tileZoom || "17";

    if (checkPermitSiteMarker) {
      checkPermitSiteMarker.checked = !(this.state.dest && this.state.dest.hidePin === true);
    }

    if (inputWidthMm) inputWidthMm.value = this.state.widthMm;
    if (inputHeightMm) inputHeightMm.value = this.state.heightMm;
    if (inputDestName) inputDestName.value = this.state.dest.name !== undefined ? this.state.dest.name : (isPermit ? "申請地" : "現地");

    if (isPermit) {
      const s = info.scale || 2500;
      if (badgeScale) badgeScale.textContent = `${this.state.widthMm} × ${this.state.heightMm} mm (1/${s} 余白10mm)`;
    } else {
      if (badgeScale) badgeScale.textContent = `${this.state.widthMm} × ${this.state.heightMm} mm`;
    }
  }

  /**
   * 用紙サイズ変更イベントハンドラ
   */
  handlePaperSizeChange(paperVal, optionText = "") {
    this.state.saveToHistory();
    if (!this.state.permitInfo) this.state.permitInfo = {};
    this.state.permitInfo.paperSize = paperVal;

    if (paperVal === "A4_landscape") {
      this.state.widthMm = 297;
      this.state.heightMm = 210;
    } else if (paperVal === "A4_portrait") {
      this.state.widthMm = 210;
      this.state.heightMm = 297;
    } else if (paperVal === "B5_landscape") {
      this.state.widthMm = 257;
      this.state.heightMm = 182;
    } else if (paperVal === "B5_portrait") {
      this.state.widthMm = 182;
      this.state.heightMm = 257;
    }

    if (this.state.permitScene) {
      this.state.permitScene.widthMm = this.state.widthMm;
      this.state.permitScene.heightMm = this.state.heightMm;
      if (!this.state.permitScene.permitInfo) this.state.permitScene.permitInfo = {};
      this.state.permitScene.permitInfo.paperSize = paperVal;
    }

    const inputWidthMm = document.getElementById("inputWidthMm");
    const inputHeightMm = document.getElementById("inputHeightMm");
    const badgeScale = document.getElementById("badgeScale");
    if (inputWidthMm) inputWidthMm.value = this.state.widthMm;
    if (inputHeightMm) inputHeightMm.value = this.state.heightMm;

    const s = (this.state.permitInfo && this.state.permitInfo.scale) || 2500;
    this.state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(s, this.state.widthMm, 10);
    if (badgeScale) badgeScale.textContent = `${this.state.widthMm} × ${this.state.heightMm} mm (1/${s} 余白10mm)`;

    if (this.mapTrace) this.mapTrace.updateFramingRectangle();
    if (this.callbacks.renderSvg) this.callbacks.renderSvg();
    if (this.callbacks.showToast && optionText) {
      this.callbacks.showToast(`用紙を「${optionText}」に変更しました`);
    }
  }
}
