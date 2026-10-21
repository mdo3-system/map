// ==========================================
// property-modal-controller.js: プロパティモーダル管理コントローラー (SRP)
// 責務: 詳細プロパティ設定モーダルの表示・初期化・各入力イベントと状態の同期
// ==========================================

export class PropertyModalController {
  constructor(state, callbacks = {}) {
    this.state = state;
    this.callbacks = callbacks; // { onUpdate, onDelete, showToast, mapTrace }

    // DOM要素の取得
    this.modal = document.getElementById("elementPropertyModal");
    this.title = document.getElementById("modalTitle");
    this.badge = document.getElementById("modalElementBadge");
    this.textInput = document.getElementById("modalTextInput");
    this.fontSizeSlider = document.getElementById("modalFontSizeSlider");
    this.fontSizeVal = document.getElementById("modalFontSizeVal");
    this.rotationSlider = document.getElementById("modalRotationSlider");
    this.rotationVal = document.getElementById("modalRotationVal");
    this.iconScaleGroup = document.getElementById("modalIconScaleGroup");
    this.iconScaleSlider = document.getElementById("modalIconScaleSlider");
    this.iconScaleVal = document.getElementById("modalIconScaleVal");
    this.plateBgGroup = document.getElementById("modalPlateBgGroup");
    this.plateBgColor = document.getElementById("modalPlateBgColor");
    this.lotGroup = document.getElementById("modalLotGroup");
    this.lotIsSiteCheck = document.getElementById("modalLotIsSiteCheck");
    this.lotLabel = document.getElementById("modalLotLabel");
    this.leaderLineCheck = document.getElementById("modalLeaderLineCheck");

    // ボタン
    this.btnClose = document.getElementById("btnModalClose");
    this.btnOk = document.getElementById("btnModalOk");
    this.btnDelete = document.getElementById("btnModalDelete");
    this.btnClearText = document.getElementById("btnModalClearText");

    this.bindEvents();
  }

  /**
   * モーダルを開いて要素データをバインド
   */
  open(sel) {
    if (!sel || !this.modal) return;
    this.modal.style.display = "flex";

    let titleText = "プロパティ設定";
    let badgeText = "要素";
    let currentText = "";
    let fontSize = 16;
    let rotation = 0;
    let hasLeader = !!sel.data.hasLeaderLine;

    const isStn = (sel.type === "landmark" && (sel.data.category === "station" || sel.data.icon_type === "station"));
    const isSig = (sel.type === "landmark" && (sel.data.icon_type === "signal" || sel.data.category === "signal"));

    if (sel.type === "dest") {
      titleText = this.state.appMode === "permit" ? "申請地（◎記号・プレート）設定" : "目的地（ピン・プレート）設定";
      badgeText = this.state.appMode === "permit" ? "申請地" : "目的地";
      currentText = sel.data.name || (this.state.appMode === "permit" ? "申請地" : "現地");
      fontSize = sel.data.fontSize || 14;
      rotation = sel.data.rotation || 0;
      if (this.iconScaleGroup) this.iconScaleGroup.style.display = "none";
      if (this.plateBgGroup) this.plateBgGroup.style.display = "flex";
      if (this.plateBgColor) this.plateBgColor.value = sel.data.bgColor || "#d32f2f";
      if (this.lotGroup) this.lotGroup.style.display = "none";
      if (this.btnClearText) this.btnClearText.style.display = "inline-flex";
      if (this.btnDelete) this.btnDelete.style.display = "none";

    } else if (sel.type === "lot" || sel.type === "lot-label") {
      titleText = "敷地・区画設定";
      badgeText = "敷地";
      currentText = sel.data.label || "";
      fontSize = sel.data.fontSize || 16;
      rotation = 0;
      hasLeader = !!sel.data.hasLeaderLine;
      if (this.lotGroup) {
        this.lotGroup.style.display = "block";
        if (this.lotIsSiteCheck) this.lotIsSiteCheck.checked = !!sel.data.isSite;
        if (this.lotLabel) this.lotLabel.value = sel.data.label || "";
      }
      if (this.iconScaleGroup) this.iconScaleGroup.style.display = "none";
      if (this.plateBgGroup) this.plateBgGroup.style.display = "none";
      if (this.btnClearText) this.btnClearText.style.display = "none";
      if (this.btnDelete) this.btnDelete.style.display = "inline-flex";

    } else if (sel.type === "landmark") {
      badgeText = isStn ? "駅" : isSig ? "信号機" : "施設";
      titleText = `${badgeText}（${sel.data.name || "名称未設定"}）設定`;
      currentText = sel.data.name || "";
      fontSize = sel.data.fontSize || (isStn ? 13 : 11.5);
      rotation = sel.data.rotation || 0;
      if (this.iconScaleGroup) {
        this.iconScaleGroup.style.display = "flex";
        const iScale = sel.data.iconScale !== undefined ? sel.data.iconScale : 1.0;
        this.iconScaleSlider.value = iScale;
        this.iconScaleVal.textContent = `${iScale.toFixed(1)}x`;
      }
      if (this.plateBgGroup) {
        this.plateBgGroup.style.display = isStn ? "flex" : "none";
        if (isStn && this.plateBgColor) this.plateBgColor.value = sel.data.bgColor || "#1e3a8a";
      }
      if (this.lotGroup) this.lotGroup.style.display = "none";
      if (this.btnClearText) this.btnClearText.style.display = "inline-flex";
      if (this.btnDelete) this.btnDelete.style.display = "inline-flex";

    } else if (sel.type === "text") {
      badgeText = "文字";
      titleText = "テキスト設定";
      currentText = sel.data.text || "";
      fontSize = sel.data.fontSize || 12;
      rotation = sel.data.rotation || 0;
      if (this.iconScaleGroup) this.iconScaleGroup.style.display = "none";
      if (this.plateBgGroup) this.plateBgGroup.style.display = "none";
      if (this.lotGroup) this.lotGroup.style.display = "none";
      if (this.btnClearText) this.btnClearText.style.display = "none";
      if (this.btnDelete) this.btnDelete.style.display = "inline-flex";
    }

    if (this.title) this.title.textContent = titleText;
    if (this.badge) this.badge.textContent = badgeText;
    if (this.textInput) this.textInput.value = currentText;
    if (this.fontSizeSlider) this.fontSizeSlider.value = fontSize;
    if (this.fontSizeVal) this.fontSizeVal.textContent = `${fontSize}px`;
    if (this.rotationSlider) this.rotationSlider.value = rotation;
    if (this.rotationVal) this.rotationVal.textContent = `${rotation}°`;
    if (this.leaderLineCheck) this.leaderLineCheck.checked = hasLeader;

    if (this.textInput) this.textInput.focus();
  }

  /**
   * モーダルを閉じる
   */
  close() {
    if (this.modal) this.modal.style.display = "none";
  }

  /**
   * 各種イベントリスナーの登録
   */
  bindEvents() {
    if (!this.modal) return;

    if (this.btnClose) this.btnClose.addEventListener("click", () => this.close());
    if (this.btnOk) this.btnOk.addEventListener("click", () => this.close());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.close();
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modal.style.display === "flex") {
        this.close();
      }
    });

    // テキスト入力
    if (this.textInput) {
      this.textInput.addEventListener("input", () => {
        const sel = this.state.getSelectedElementData();
        if (!sel) return;
        this.state.saveToHistory();
        const val = this.textInput.value;
        if (sel.type === "dest") {
          sel.data.name = val;
          const inputDest = document.getElementById("inputDestName");
          if (inputDest) inputDest.value = val;
        } else if (sel.type === "lot" || sel.type === "lot-label") {
          sel.data.label = val;
          if (this.lotLabel) this.lotLabel.value = val;
          const lotLblInput = document.getElementById("lotLabel");
          if (lotLblInput) lotLblInput.value = val;
        } else if (sel.type === "landmark") {
          sel.data.name = val;
        } else if (sel.type === "text") {
          sel.data.text = val;
        }
        if (this.callbacks.onUpdate) this.callbacks.onUpdate();
      });
    }

    // 文字サイズスライダー
    if (this.fontSizeSlider) {
      this.fontSizeSlider.addEventListener("input", () => {
        const val = parseFloat(this.fontSizeSlider.value);
        if (this.fontSizeVal) this.fontSizeVal.textContent = `${val}px`;
        const sel = this.state.getSelectedElementData();
        if (sel) {
          sel.data.fontSize = val;
          const lotFSize = document.getElementById("lotFontSize");
          const lotFSizeVal = document.getElementById("lotFontSizeVal");
          if (lotFSize) lotFSize.value = val;
          if (lotFSizeVal) lotFSizeVal.textContent = `${val}px`;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
      this.fontSizeSlider.addEventListener("change", () => {
        this.state.saveToHistory();
      });
    }

    // 引き出し線チェックボックス
    if (this.leaderLineCheck) {
      this.leaderLineCheck.addEventListener("change", () => {
        const sel = this.state.getSelectedElementData();
        if (sel) {
          this.state.saveToHistory();
          sel.data.hasLeaderLine = this.leaderLineCheck.checked;
          const inspLeader = document.getElementById("inspectorLeaderLine");
          if (inspLeader) inspLeader.checked = this.leaderLineCheck.checked;
          if ((sel.type === "lot" || sel.type === "lot-label") && sel.data.hasLeaderLine) {
            if (sel.data.labelOffsetX === undefined) sel.data.labelOffsetX = 70;
            if (sel.data.labelOffsetY === undefined) sel.data.labelOffsetY = -50;
          }
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
        }
      });
    }

    // 敷地 申請地指定チェック
    if (this.lotIsSiteCheck) {
      this.lotIsSiteCheck.addEventListener("change", () => {
        const sel = this.state.getSelectedElementData();
        if (sel && (sel.type === "lot" || sel.type === "lot-label")) {
          this.state.saveToHistory();
          sel.data.isSite = this.lotIsSiteCheck.checked;
          if (this.callbacks.onUpdate) this.callbacks.onUpdate();
          if (this.callbacks.showToast) {
            this.callbacks.showToast(sel.data.isSite ? "区画を「申請地」に指定しました" : "区画を「一般区画」に設定しました");
          }
        }
      });
    }

    // 削除ボタン
    if (this.btnDelete) {
      this.btnDelete.addEventListener("click", () => {
        if (this.state.selectedId && this.callbacks.onDelete) {
          this.callbacks.onDelete(this.state.selectedId, this.state.selectedType);
          this.close();
        }
      });
    }
  }
}
