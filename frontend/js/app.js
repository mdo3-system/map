// ==========================================
// app.js: メインエントリーポイント & UI統合 (SRP)
// ==========================================
import { AppState } from "./state.js";
import { GeoUtil } from "./geo.js";
import { SvgBuilder } from "./svg-builder.js";
import { MapTraceController } from "./map-trace.js";
import { EditorInteractionController } from "./editor-interaction.js";

document.addEventListener("DOMContentLoaded", () => {
  // 1. 状態管理の初期化
  const state = new AppState();

  // 2. DOM要素の取得
  const inputAddress = document.getElementById("inputAddress");
  const btnSearch = document.getElementById("btnSearch");
  const inputDestName = document.getElementById("inputDestName");
  const inputWidthMm = document.getElementById("inputWidthMm");
  const inputHeightMm = document.getElementById("inputHeightMm");
  const checkTransparentBg = document.getElementById("checkTransparentBg");
  const checkScale = document.getElementById("checkScale");
  const checkCompass = document.getElementById("checkCompass");

  // モード切り替えタブ
  const btnModeAd = document.getElementById("btnModeAd");
  const btnModePermit = document.getElementById("btnModePermit");

  // 各種申請インスペクター要素
  const inspectorPermit = document.getElementById("inspectorPermit");
  const permitTitle = document.getElementById("permitTitle");
  const permitLotNumber = document.getElementById("permitLotNumber");
  const permitAddress = document.getElementById("permitAddress");
  const permitArchitectNo = document.getElementById("permitArchitectNo");
  const permitArchitectName = document.getElementById("permitArchitectName");
  const permitBaseMap = document.getElementById("permitBaseMap");
  const permitScale = document.getElementById("permitScale");
  const permitPaperSize = document.getElementById("permitPaperSize");
  const permitBoxPosition = document.getElementById("permitBoxPosition");

  const btnUndo = document.getElementById("btnUndo");
  const btnSave = document.getElementById("btnSave");
  const btnLoad = document.getElementById("btnLoad");
  const inputLoadFile = document.getElementById("inputLoadFile");
  const btnExportSvg = document.getElementById("btnExportSvg");
  const btnExportPng = document.getElementById("btnExportPng");
  const btnClearAll = document.getElementById("btnClearAll");

  const modeHint = document.getElementById("modeHint");
  const badgeScale = document.getElementById("badgeScale");
  const previewCard = document.getElementById("previewCard");
  const svgContainer = document.getElementById("svgContainer");

  // ズームボタン
  const btnZoomIn = document.getElementById("btnZoomIn");
  const btnZoomOut = document.getElementById("btnZoomOut");
  const btnZoomFit = document.getElementById("btnZoomFit");
  const btnZoomReset = document.getElementById("btnZoomReset");
  const zoomLevel = document.getElementById("zoomLevel");

  // プロパティ・インスペクターパネル
  const inspectorSelected = document.getElementById("inspectorSelected");
  const selectedBadge = document.getElementById("selectedBadge");
  const inspectorName = document.getElementById("inspectorName");
  const inspectorFontSizeSlider = document.getElementById("inspectorFontSizeSlider");
  const inspectorFontSizeVal = document.getElementById("inspectorFontSizeVal");
  const inspectorRotationSlider = document.getElementById("inspectorRotationSlider");
  const inspectorRotationVal = document.getElementById("inspectorRotationVal");
  const inspectorLeaderLine = document.getElementById("inspectorLeaderLine");
  const inspectorLeaderLineLabel = document.getElementById("inspectorLeaderLineLabel");
  const btnInspectorDelete = document.getElementById("btnInspectorDelete");

  // 施設記号サイズ
  const inspectorIconScaleSlider = document.getElementById("inspectorIconScaleSlider");
  const inspectorIconScaleVal = document.getElementById("inspectorIconScaleVal");
  const inspectorIconScaleField = document.getElementById("inspectorIconScaleField");
  const inspectorIconScaleDivider = document.getElementById("inspectorIconScaleDivider");
  const btnOpenPropModal = document.getElementById("btnOpenPropModal");

  // プレート塗り色
  const inspectorPlateBgColor = document.getElementById("inspectorPlateBgColor");
  const inspectorPlateBgField = document.getElementById("inspectorPlateBgField");
  const inspectorPlateBgDivider = document.getElementById("inspectorPlateBgDivider");

  // 方位記号インスペクター
  const inspectorCompass = document.getElementById("inspectorCompass");
  const selectCompassDesign = document.getElementById("selectCompassDesign");
  const compassScaleSlider = document.getElementById("compassScaleSlider");
  const compassScaleVal = document.getElementById("compassScaleVal");
  const btnResetCompassPos = document.getElementById("btnResetCompassPos");

  // 敷地・多角形インスペクター要素
  const inspectorLot = document.getElementById("inspectorLot");
  const lotHasFill = document.getElementById("lotHasFill");
  const lotFillColor = document.getElementById("lotFillColor");
  const lotFillOpacity = document.getElementById("lotFillOpacity");
  const lotFillOpacityVal = document.getElementById("lotFillOpacityVal");
  const lotHasStroke = document.getElementById("lotHasStroke");
  const lotStrokeColor = document.getElementById("lotStrokeColor");
  const lotStrokeWidth = document.getElementById("lotStrokeWidth");
  const lotStrokeWidthVal = document.getElementById("lotStrokeWidthVal");
  const lotStrokeDash = document.getElementById("lotStrokeDash");
  const btnLotToggleSite = document.getElementById("btnLotToggleSite");
  const btnLotDelete = document.getElementById("btnLotDelete");

  // 文字色 & 白フチ
  const inspectorTextColorField = document.getElementById("inspectorTextColorField");
  const inspectorTextColorDivider = document.getElementById("inspectorTextColorDivider");
  const inspectorTextColor = document.getElementById("inspectorTextColor");
  const inspectorHaloLabel = document.getElementById("inspectorHaloLabel");
  const inspectorHaloDivider = document.getElementById("inspectorHaloDivider");
  const inspectorHalo = document.getElementById("inspectorHalo");
  const permitTileZoom = document.getElementById("permitTileZoom");

  // プロパティモーダル要素
  const elementPropertyModal = document.getElementById("elementPropertyModal");
  const modalElementBadge = document.getElementById("modalElementBadge");
  const modalTextInput = document.getElementById("modalTextInput");
  const modalFontSizeSlider = document.getElementById("modalFontSizeSlider");
  const modalFontSizeVal = document.getElementById("modalFontSizeVal");
  const modalRotationSlider = document.getElementById("modalRotationSlider");
  const modalRotationVal = document.getElementById("modalRotationVal");
  const modalIconScaleGroup = document.getElementById("modalIconScaleGroup");
  const modalIconScaleSlider = document.getElementById("modalIconScaleSlider");
  const modalIconScaleVal = document.getElementById("modalIconScaleVal");
  const modalPlateBgGroup = document.getElementById("modalPlateBgGroup");
  const modalPlateBgColor = document.getElementById("modalPlateBgColor");
  const modalLeaderLineCheck = document.getElementById("modalLeaderLineCheck");
  const modalLotGroup = document.getElementById("modalLotGroup");
  const modalLotIsSiteCheck = document.getElementById("modalLotIsSiteCheck");
  const modalLotLabel = document.getElementById("modalLotLabel");
  const btnModalClose = document.getElementById("btnModalClose");
  const btnModalOk = document.getElementById("btnModalOk");
  const btnModalDelete = document.getElementById("btnModalDelete");
  const btnModalClearText = document.getElementById("btnModalClearText");

  // 線路インスペクター
  const inspectorRail = document.getElementById("inspectorRail");
  const selectRailMode = document.getElementById("selectRailMode");

  // 各種インスペクターグループ
  const inspectorRoad = document.getElementById("inspectorRoad");
  const roadCasingColorInput = document.getElementById("roadCasingColor");
  const roadInnerColorInput = document.getElementById("roadInnerColor");
  const roadFilledInput = document.getElementById("roadFilled");
  const roadFillColorInput = document.getElementById("roadFillColor");
  const roadFillColorLabel = document.getElementById("roadFillColorLabel");

  const inspectorPoi = document.getElementById("inspectorPoi");
  const selectPoiType = document.getElementById("selectPoiType");
  const inputPoiName = document.getElementById("inputPoiName");

  const inspectorText = document.getElementById("inspectorText");
  const inputTextString = document.getElementById("inputTextString");

  // トースト通知関数
  let toastTimer = null;
  function showToast(message, isDanger = false) {
    let toast = document.getElementById("actionToast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "actionToast";
      document.body.appendChild(toast);
    }
    toast.className = "action-toast" + (isDanger ? " danger" : "");
    toast.textContent = message;
    toast.style.display = "flex";
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = "none"; }, 2600);
  }

  // 3. レンダリング関数
  function renderSvg() {
    const svgString = SvgBuilder.build(state);
    svgContainer.innerHTML = svgString;
    editorInteraction.bindSvgDraggables();
    state.autoSave();
  }

  function syncAll() {
    mapTrace.syncDrawnLayers();
    mapTrace.updateFramingRectangle();
    renderSvg();
    updateInspectorPanel();
  }

  // 4. コールバック連携
  const callbacks = {
    onStateChange: () => {
      syncAll();
    },
    onElementSelect: (id, type) => {
      state.selectedId = id;
      state.selectedType = type;
      renderSvg();
      updateInspectorPanel();
      if (id) {
        showToast("要素を選択しました（プロパティ設定やDeleteキーで削除可能）");
        const sel = state.getSelectedElementData();
        // テキストやラベル、目的地、施設、区画がクリック選択された場合、プロパティモーダルを表示
        if (sel && ["text", "landmark", "dest", "lot"].includes(sel.type)) {
          openPropertyModal(sel);
        }
      }
    },
    onDeleteElement: (id, type) => {
      const name = state.deleteElement(id, type);
      syncAll();
      showToast(`「${name}」を削除しました（元に戻すには Ctrl+Z）`, true);
    },
    onShowToast: (msg, isDanger) => {
      showToast(msg, isDanger);
    },
    onEditName: (id, type) => {
      state.selectedId = id;
      state.selectedType = type;
      const sel = state.getSelectedElementData();
      if (sel && ["dest", "landmark", "text", "lot"].includes(sel.type)) {
        openPropertyModal(sel);
      } else {
        handleEditNameDialog(id, type);
      }
    },
    onEditLot: (id) => {
      state.selectedId = id;
      state.selectedType = "lot";
      const sel = state.getSelectedElementData();
      if (sel) openPropertyModal(sel);
    },
    onCanvasClickAdd: (lat, lon, mode) => {
      if (mode === "text") {
        addTextAtLocation(lat, lon);
      } else if (mode === "poi") {
        addPoiAtLocation(lat, lon);
      }
    },
    onSaveProject: () => saveProject(),
    onUndo: () => handleUndo(),
    onSetMode: (newMode) => setMode(newMode)
  };

  // コントローラー初期化
  const mapTrace = new MapTraceController("referenceMap", state, callbacks);
  const editorInteraction = new EditorInteractionController(svgContainer, state, callbacks);

  // 5. プロパティ・インスペクターパネルの更新
  function updateInspectorPanel() {
    const sel = state.getSelectedElementData();

    // 一旦すべて非表示
    inspectorSelected.style.display = "none";
    if (inspectorLot) inspectorLot.style.display = "none";
    inspectorCompass.style.display = "none";
    inspectorRail.style.display = "none";
    inspectorRoad.style.display = "none";
    inspectorPoi.style.display = "none";
    inspectorText.style.display = "none";

    if (sel) {
      if (sel.type === "compass") {
        inspectorCompass.style.display = "flex";
        const cScale = state.compass.scale || 1.0;
        compassScaleSlider.value = cScale;
        compassScaleVal.textContent = `${cScale.toFixed(1)}x`;
        selectCompassDesign.value = state.compass.design || "circle_modern";
      } else if (sel.type === "rail") {
        inspectorRail.style.display = "flex";
        selectRailMode.value = sel.data.mode || state.railMode;
      } else if (sel.type === "road") {
        inspectorRoad.style.display = "flex";
      } else {
        inspectorSelected.style.display = "flex";
        
        // 施設記号サイズスライダーの表示制御
        if (sel.type === "landmark") {
          inspectorIconScaleField.style.display = "flex";
          inspectorIconScaleDivider.style.display = "block";
          const iScale = sel.data.iconScale !== undefined ? sel.data.iconScale : 1.0;
          inspectorIconScaleSlider.value = iScale;
          inspectorIconScaleVal.textContent = `${iScale.toFixed(1)}x`;
        } else {
          inspectorIconScaleField.style.display = "none";
          inspectorIconScaleDivider.style.display = "none";
        }

        // プレート塗りつぶし色の表示制御 (目的地または駅)
        const isStn = (sel.type === "landmark" && (sel.data.category === "station" || sel.data.icon_type === "station"));
        if (sel.type === "dest" || isStn) {
          inspectorPlateBgField.style.display = "flex";
          inspectorPlateBgDivider.style.display = "block";
          inspectorPlateBgColor.value = sel.type === "dest" ? (sel.data.bgColor || "#d32f2f") : (sel.data.bgColor || "#1e3a8a");
        } else {
          inspectorPlateBgField.style.display = "none";
          inspectorPlateBgDivider.style.display = "none";
        }

        if (sel.type === "dest" || sel.type === "dest-icon") {
          const isIcon = (sel.type === "dest-icon" || state.selectedId === "dest_pin" || state.selectedType === "dest-icon");
          selectedBadge.textContent = isIcon
            ? (state.appMode === "permit" ? "申請地記号(◎)" : "目的地ピン")
            : (state.appMode === "permit" ? "申請地プレート" : "目的地プレート");

          if (isIcon) {
            inspectorNameField.style.display = "none";
            inspectorFontSizeField.style.display = "none";
            inspectorRotationField.style.display = "none";
            inspectorLeaderLineLabel.style.display = "none";
            btnInspectorDelete.style.display = "inline-flex";
            btnInspectorDelete.textContent = "🗑️ 記号削除";
          } else {
            inspectorName.value = sel.data.name || (state.appMode === "permit" ? "申請地" : "現地");
            inspectorNameField.style.display = "flex";
            inspectorLeaderLineLabel.style.display = "flex";
            btnInspectorDelete.style.display = "inline-flex";
            btnInspectorDelete.textContent = "🗑️ プレート削除";
            inspectorFontSizeField.style.display = "flex";
            inspectorFontSizeSlider.value = sel.data.fontSize || 24;
            inspectorFontSizeVal.textContent = `${sel.data.fontSize || 24}px`;
            inspectorRotationField.style.display = "flex";
            inspectorRotationSlider.value = sel.data.rotation || 0;
            inspectorRotationVal.textContent = `${sel.data.rotation || 0}°`;
            inspectorLeaderLine.checked = !!sel.data.hasLeaderLine;
          }
        } else if (sel.type === "landmark") {
          selectedBadge.textContent = sel.data.category === "station" ? "駅" : sel.data.icon_type === "signal" ? "信号機" : "施設";
          inspectorName.value = sel.data.name || "";
          inspectorFontSizeSlider.value = sel.data.fontSize || (sel.data.category === "station" ? 13 : 11.5);
          inspectorFontSizeVal.textContent = `${sel.data.fontSize || (sel.data.category === "station" ? 13 : 11.5)}px`;
          inspectorRotationSlider.value = sel.data.rotation || 0;
          inspectorRotationVal.textContent = `${sel.data.rotation || 0}°`;
          inspectorLeaderLine.checked = !!sel.data.hasLeaderLine;
          inspectorLeaderLineLabel.style.display = "flex";
          btnInspectorDelete.style.display = "inline-flex";
        } else if (sel.type === "text") {
          selectedBadge.textContent = "文字";
          inspectorName.value = sel.data.text || "";
          inspectorFontSizeSlider.value = sel.data.fontSize || 12;
          inspectorFontSizeVal.textContent = `${sel.data.fontSize || 12}px`;
          inspectorRotationSlider.value = sel.data.rotation || 0;
          inspectorRotationVal.textContent = `${sel.data.rotation || 0}°`;
          inspectorLeaderLine.checked = !!sel.data.hasLeaderLine;
          inspectorLeaderLineLabel.style.display = "flex";
          btnInspectorDelete.style.display = "inline-flex";

          // 文字色 & 白フチの表示と同期
          if (inspectorTextColorField) {
            inspectorTextColorField.style.display = "flex";
            if (inspectorTextColorDivider) inspectorTextColorDivider.style.display = "block";
            inspectorTextColor.value = sel.data.color || "#0f172a";
          }
          if (inspectorHaloLabel) {
            inspectorHaloLabel.style.display = "flex";
            if (inspectorHaloDivider) inspectorHaloDivider.style.display = "block";
            inspectorHalo.checked = (sel.data.hasHalo !== false);
          }
        }
      }

      // 敷地・多角形が選択された場合
      if (sel && sel.type === "lot" && inspectorLot) {
        inspectorSelected.style.display = "none";
        inspectorLot.style.display = "flex";
        const lot = sel.data;
        const isSite = !!lot.isSite;

        if (lotHasFill) lotHasFill.checked = (lot.hasFill !== false);
        if (lotFillColor) lotFillColor.value = lot.fillColor || (isSite ? "#ef4444" : "#3b82f6");
        const op = lot.fillOpacity !== undefined ? lot.fillOpacity : (isSite ? 0.35 : 0.25);
        if (lotFillOpacity) lotFillOpacity.value = op;
        if (lotFillOpacityVal) lotFillOpacityVal.textContent = `${Math.round(op * 100)}%`;

        if (lotHasStroke) lotHasStroke.checked = (lot.hasStroke !== false);
        if (lotStrokeColor) lotStrokeColor.value = lot.strokeColor || (isSite ? "#dc2626" : "#2563eb");
        const sw = lot.strokeWidth !== undefined ? lot.strokeWidth : (isSite ? 4.0 : 2.5);
        if (lotStrokeWidth) lotStrokeWidth.value = sw;
        if (lotStrokeWidthVal) lotStrokeWidthVal.textContent = String(sw);
        if (lotStrokeDash) lotStrokeDash.value = (lot.strokeDash === "dashed") ? "dashed" : "solid";

        if (btnLotToggleSite) {
          btnLotToggleSite.textContent = isSite ? "◎ 申請地指定中 (解除)" : "◎ 申請地に指定";
          btnLotToggleSite.style.background = isSite ? "#dc2626" : "#fef2f2";
          btnLotToggleSite.style.color = isSite ? "#ffffff" : "#dc2626";
        }
      }
    } else {
      // 選択されていない時は現在のツールに応じた設定を表示
      inspectorRail.style.display = state.mode === "railway" ? "flex" : "none";
      inspectorRoad.style.display = ["major_road", "medium_road", "minor_road"].includes(state.mode) ? "flex" : "none";
      inspectorPoi.style.display = state.mode === "poi" ? "flex" : "none";
      inspectorText.style.display = state.mode === "text" ? "flex" : "none";
    }
  }

  // インスペクターの入力イベント (表示名・複数行折り返し)
  inspectorName.addEventListener("input", () => {
    const sel = state.getSelectedElementData();
    if (!sel) return;
    state.saveToHistory();
    if (sel.type === "dest") {
      sel.data.name = inspectorName.value || "現地";
      if (inputDestName) inputDestName.value = sel.data.name;
      mapTrace.updateDestPinIcon();
    } else if (sel.type === "landmark") {
      sel.data.name = inspectorName.value;
      mapTrace.syncDrawnLayers();
    } else if (sel.type === "text") {
      sel.data.text = inspectorName.value;
      mapTrace.syncDrawnLayers();
    }
    renderSvg();
  });

  // 文字サイズ
  inspectorFontSizeSlider.addEventListener("input", () => {
    const val = parseFloat(inspectorFontSizeSlider.value);
    inspectorFontSizeVal.textContent = `${val}px`;
    const sel = state.getSelectedElementData();
    if (sel) {
      sel.data.fontSize = val;
      renderSvg();
    }
  });

  document.querySelectorAll(".btn-micro[data-font]").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.dataset.font);
      inspectorFontSizeSlider.value = val;
      inspectorFontSizeVal.textContent = `${val}px`;
      const sel = state.getSelectedElementData();
      if (sel) {
        state.saveToHistory();
        sel.data.fontSize = val;
        renderSvg();
      }
    });
  });

  // 文字回転
  inspectorRotationSlider.addEventListener("input", () => {
    const val = parseFloat(inspectorRotationSlider.value);
    inspectorRotationVal.textContent = `${val}°`;
    const sel = state.getSelectedElementData();
    if (sel) {
      sel.data.rotation = val;
      renderSvg();
    }
  });

  document.querySelectorAll(".btn-micro[data-rot]").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.dataset.rot);
      inspectorRotationSlider.value = val;
      inspectorRotationVal.textContent = `${val}°`;
      const sel = state.getSelectedElementData();
      if (sel) {
        state.saveToHistory();
        sel.data.rotation = val;
        renderSvg();
      }
    });
  });

  // 施設記号サイズ
  inspectorIconScaleSlider.addEventListener("input", () => {
    const val = parseFloat(inspectorIconScaleSlider.value);
    inspectorIconScaleVal.textContent = `${val.toFixed(1)}x`;
    const sel = state.getSelectedElementData();
    if (sel && sel.type === "landmark") {
      sel.data.iconScale = val;
      renderSvg();
    }
  });

  // 引き出し線
  inspectorLeaderLine.addEventListener("change", () => {
    const sel = state.getSelectedElementData();
    if (sel) {
      state.saveToHistory();
      sel.data.hasLeaderLine = inspectorLeaderLine.checked;
      renderSvg();
    }
  });

  btnInspectorDelete.addEventListener("click", () => {
    if (state.selectedId) {
      callbacks.onDeleteElement(state.selectedId, state.selectedType);
    }
  });

  // 方位記号のデザイン・サイズ・リセット
  selectCompassDesign.addEventListener("change", () => {
    state.saveToHistory();
    state.compass.design = selectCompassDesign.value;
    renderSvg();
    showToast(`方位記号を「${selectCompassDesign.options[selectCompassDesign.selectedIndex].text}」に変更しました`);
  });

  compassScaleSlider.addEventListener("input", () => {
    const val = parseFloat(compassScaleSlider.value);
    compassScaleVal.textContent = `${val.toFixed(1)}x`;
    state.compass.scale = val;
    renderSvg();
  });

  document.querySelectorAll(".btn-micro[data-cscale]").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.dataset.cscale);
      compassScaleSlider.value = val;
      compassScaleVal.textContent = `${val.toFixed(1)}x`;
      state.saveToHistory();
      state.compass.scale = val;
      renderSvg();
    });
  });

  btnResetCompassPos.addEventListener("click", () => {
    state.saveToHistory();
    state.compass.x = null;
    state.compass.y = null;
    renderSvg();
    showToast("方位記号の位置を初期位置（右上）に戻しました");
  });

  // ==========================================
  // 要素・テキスト プロパティ編集モーダル
  // ==========================================
  function openPropertyModal(sel) {
    if (!sel) return;
    elementPropertyModal.style.display = "flex";

    let titleText = "プロパティ設定";
    let badgeText = "要素";
    let currentText = "";
    let fontSize = 12;
    let rotation = 0;
    let hasLeader = !!sel.data.hasLeaderLine;

    const isStn = (sel.type === "landmark" && (sel.data.category === "station" || sel.data.icon_type === "station"));
    const isSig = (sel.type === "landmark" && (sel.data.icon_type === "signal" || sel.data.category === "signal"));

    if (sel.type === "dest") {
      titleText = state.appMode === "permit" ? "申請地（◎記号・プレート）設定" : "目的地（ピン・プレート）設定";
      badgeText = state.appMode === "permit" ? "申請地" : "目的地";
      currentText = sel.data.name || (state.appMode === "permit" ? "申請地" : "現地");
      fontSize = sel.data.fontSize || 14;
      rotation = sel.data.rotation || 0;
      modalIconScaleGroup.style.display = "none";
      modalPlateBgGroup.style.display = "flex";
      modalPlateBgColor.value = sel.data.bgColor || "#d32f2f";
      if (modalLotGroup) modalLotGroup.style.display = "none";
      btnModalClearText.style.display = "inline-flex";
      btnModalDelete.style.display = "none";
    } else if (sel.type === "lot") {
      titleText = "区画（敷地割）設定";
      badgeText = "区画";
      currentText = sel.data.label || "";
      fontSize = 13;
      rotation = 0;
      if (modalLotGroup) {
        modalLotGroup.style.display = "block";
        if (modalLotIsSiteCheck) modalLotIsSiteCheck.checked = !!sel.data.isSite;
        if (modalLotLabel) modalLotLabel.value = sel.data.label || "";
      }
      modalIconScaleGroup.style.display = "none";
      modalPlateBgGroup.style.display = "none";
      btnModalClearText.style.display = "none";
      btnModalDelete.style.display = "inline-flex";
    } else if (sel.type === "landmark") {
      badgeText = isStn ? "駅" : isSig ? "信号機" : "施設";
      titleText = `${badgeText}（${sel.data.name || "名称未設定"}）設定`;
      currentText = sel.data.name || "";
      fontSize = sel.data.fontSize || (isStn ? 13 : 11.5);
      rotation = sel.data.rotation || 0;

      // 施設記号サイズ
      modalIconScaleGroup.style.display = "flex";
      const iScale = sel.data.iconScale !== undefined ? sel.data.iconScale : 1.0;
      modalIconScaleSlider.value = iScale;
      modalIconScaleVal.textContent = `${iScale.toFixed(1)}x`;

      // 駅名プレート色
      if (isStn) {
        modalPlateBgGroup.style.display = "flex";
        modalPlateBgColor.value = sel.data.bgColor || "#1e3a8a";
      } else {
        modalPlateBgGroup.style.display = "none";
      }

      if (modalLotGroup) modalLotGroup.style.display = "none";
      btnModalClearText.style.display = "inline-flex";
      btnModalDelete.style.display = "inline-flex";
    } else if (sel.type === "text") {
      badgeText = "文字";
      titleText = "テキスト設定";
      currentText = sel.data.text || "";
      fontSize = sel.data.fontSize || 12;
      rotation = sel.data.rotation || 0;
      modalIconScaleGroup.style.display = "none";
      modalPlateBgGroup.style.display = "none";
      if (modalLotGroup) modalLotGroup.style.display = "none";
      btnModalClearText.style.display = "none";
      btnModalDelete.style.display = "inline-flex";
    } else {
      elementPropertyModal.style.display = "none";
      return;
    }

    modalTitle.textContent = titleText;
    modalElementBadge.textContent = badgeText;
    modalTextInput.value = currentText;
    modalFontSizeSlider.value = fontSize;
    modalFontSizeVal.textContent = `${fontSize}px`;
    modalRotationSlider.value = rotation;
    modalRotationVal.textContent = `${rotation}°`;
    modalLeaderLineCheck.checked = hasLeader;

    modalTextInput.focus();
  }

  function closePropertyModal() {
    elementPropertyModal.style.display = "none";
  }

  // モーダル開くボタン（インスペクター内）
  btnOpenPropModal.addEventListener("click", () => {
    const sel = state.getSelectedElementData();
    if (sel) openPropertyModal(sel);
  });

  // モーダル閉じる
  btnModalClose.addEventListener("click", closePropertyModal);
  btnModalOk.addEventListener("click", closePropertyModal);
  elementPropertyModal.addEventListener("click", (e) => {
    if (e.target === elementPropertyModal) closePropertyModal();
  });
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && elementPropertyModal.style.display === "flex") {
      closePropertyModal();
    }
  });

  // モーダル内削除ボタン
  btnModalDelete.addEventListener("click", () => {
    if (state.selectedId) {
      callbacks.onDeleteElement(state.selectedId, state.selectedType);
      closePropertyModal();
    }
  });

  // モーダル内テキスト入力（リアルタイム反映・改行折り返し）
  modalTextInput.addEventListener("input", () => {
    const sel = state.getSelectedElementData();
    if (!sel) return;
    state.saveToHistory();
    const val = modalTextInput.value;
    if (sel.type === "dest") {
      sel.data.name = val || "現地";
      if (inputDestName) inputDestName.value = sel.data.name;
      inspectorName.value = sel.data.name;
      mapTrace.updateDestPinIcon();
    } else if (sel.type === "landmark") {
      sel.data.name = val;
      inspectorName.value = val;
      mapTrace.syncDrawnLayers();
    } else if (sel.type === "text") {
      sel.data.text = val;
      inspectorName.value = val;
      mapTrace.syncDrawnLayers();
    } else if (sel.type === "lot") {
      sel.data.label = val;
      if (modalLotLabel) modalLotLabel.value = val;
      mapTrace.syncDrawnLayers();
    }
    renderSvg();
  });

  if (modalLotIsSiteCheck) {
    modalLotIsSiteCheck.addEventListener("change", () => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        sel.data.isSite = modalLotIsSiteCheck.checked;
        renderSvg();
        mapTrace.syncDrawnLayers();
        showToast(sel.data.isSite ? "区画を「申請地（赤枠・薄赤塗りつぶし）」に指定しました" : "区画を「一般区画」に設定しました");
      }
    });
  }

  if (modalLotLabel) {
    modalLotLabel.addEventListener("input", () => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        sel.data.label = modalLotLabel.value;
        modalTextInput.value = modalLotLabel.value;
        renderSvg();
        mapTrace.syncDrawnLayers();
      }
    });
  }

  // モーダル内文字サイズスライダー
  modalFontSizeSlider.addEventListener("input", () => {
    const val = parseFloat(modalFontSizeSlider.value);
    modalFontSizeVal.textContent = `${val}px`;
    inspectorFontSizeSlider.value = val;
    inspectorFontSizeVal.textContent = `${val}px`;
    const sel = state.getSelectedElementData();
    if (sel) {
      sel.data.fontSize = val;
      renderSvg();
    }
  });

  // モーダル内文字サイズプリセット
  document.querySelectorAll(".modal-font-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.dataset.font);
      modalFontSizeSlider.value = val;
      modalFontSizeVal.textContent = `${val}px`;
      inspectorFontSizeSlider.value = val;
      inspectorFontSizeVal.textContent = `${val}px`;
      const sel = state.getSelectedElementData();
      if (sel) {
        state.saveToHistory();
        sel.data.fontSize = val;
        renderSvg();
      }
    });
  });

  // モーダル内文字回転スライダー
  modalRotationSlider.addEventListener("input", () => {
    const val = parseFloat(modalRotationSlider.value);
    modalRotationVal.textContent = `${val}°`;
    inspectorRotationSlider.value = val;
    inspectorRotationVal.textContent = `${val}°`;
    const sel = state.getSelectedElementData();
    if (sel) {
      sel.data.rotation = val;
      renderSvg();
    }
  });

  // モーダル内文字回転プリセット
  document.querySelectorAll(".modal-rot-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = parseFloat(btn.dataset.rot);
      modalRotationSlider.value = val;
      modalRotationVal.textContent = `${val}°`;
      inspectorRotationSlider.value = val;
      inspectorRotationVal.textContent = `${val}°`;
      const sel = state.getSelectedElementData();
      if (sel) {
        state.saveToHistory();
        sel.data.rotation = val;
        renderSvg();
      }
    });
  });

  // モーダル内施設記号サイズ
  modalIconScaleSlider.addEventListener("input", () => {
    const val = parseFloat(modalIconScaleSlider.value);
    modalIconScaleVal.textContent = `${val.toFixed(1)}x`;
    inspectorIconScaleSlider.value = val;
    inspectorIconScaleVal.textContent = `${val.toFixed(1)}x`;
    const sel = state.getSelectedElementData();
    if (sel && sel.type === "landmark") {
      sel.data.iconScale = val;
      renderSvg();
    }
  });

  // モーダル内引き出し線
  modalLeaderLineCheck.addEventListener("change", () => {
    const sel = state.getSelectedElementData();
    if (sel) {
      state.saveToHistory();
      sel.data.hasLeaderLine = modalLeaderLineCheck.checked;
      inspectorLeaderLine.checked = modalLeaderLineCheck.checked;
      renderSvg();
    }
  });

  // プレート塗りつぶし色 (インスペクター & モーダル)
  function applyPlateBgColor(col) {
    const sel = state.getSelectedElementData();
    if (!sel) return;
    state.saveToHistory();
    sel.data.bgColor = col;
    inspectorPlateBgColor.value = col;
    modalPlateBgColor.value = col;
    renderSvg();
  }

  inspectorPlateBgColor.addEventListener("input", () => {
    applyPlateBgColor(inspectorPlateBgColor.value);
  });

  modalPlateBgColor.addEventListener("input", () => {
    applyPlateBgColor(modalPlateBgColor.value);
  });

  document.querySelectorAll(".modal-color-preset").forEach(btn => {
    btn.addEventListener("click", () => {
      const col = btn.dataset.color;
      applyPlateBgColor(col);
    });
  });

  // モーダル内「文字のみ削除（記号を残す）」
  btnModalClearText.addEventListener("click", () => {
    const sel = state.getSelectedElementData();
    if (!sel) return;
    state.saveToHistory();
    modalTextInput.value = "";
    inspectorName.value = "";
    if (sel.type === "landmark") {
      sel.data.name = "";
      mapTrace.syncDrawnLayers();
      showToast("文字を削除し、記号（アイコン）のみ残しました");
    } else if (sel.type === "dest") {
      sel.data.name = "";
      mapTrace.updateDestPinIcon();
      showToast("目的地名称プレートを削除し、ピンのみ残しました");
    }
    renderSvg();
    closePropertyModal();
  });

  // 線路モード切り替え (JR / 私鉄)
  selectRailMode.addEventListener("change", () => {
    state.railMode = selectRailMode.value;
    const sel = state.getSelectedElementData();
    if (sel && sel.type === "rail") {
      state.saveToHistory();
      sel.data.mode = selectRailMode.value;
      renderSvg();
    }
    showToast(`線路モードを「${selectRailMode.value === 'jr' ? 'JR線 (白黒枕木)' : '私鉄線 (2重白抜き線)'}」に設定しました`);
  });

  // 6. モード切り替え（左側スリム縦型ツールバー）
  const hints = {
    select: "💡 【選択ツール (V)】要素をクリックして選択・ドラッグ微調整できます（サイズ・回転・削除可能）",
    dest: "💡 【目的地/申請地】左の地図で物件の場所をクリックして配置（記号と文字プレートを別々に移動可）",
    lot: "💡 【区画割（敷地）】敷地の四隅をクリックして多角形を描き、ダブルクリックで確定。複数描いて角から何件目を表現できます",
    major_road: "💡 【大通り (太)】クリック連打で国道・幹線道路を描画、ダブルクリックで完了",
    medium_road: "💡 【一般道 (中)】クリック連打で主要道路・県道を描画、ダブルクリックで完了",
    minor_road: "💡 【細道 (小)】クリック連打で細道・生活道路を描画、ダブルクリックで完了",
    railway: "💡 【線路】クリックで線路をつなぎ、ダブルクリックで完了",
    route: "💡 【経路 (赤点線)】クリック連打でアクセス経路を描画、ダブルクリックで完了",
    poi: "💡 【施設配置】置きたい場所をクリックして配置（記号と文字を別々にドラッグ移動可）",
    text: "💡 【文字配置】置きたい場所をクリック（道路名や「至 坂戸駅」など）",
    delete: "💡 【削除ツール】削除したい区画・施設・文字をクリックすると一撃で消去されます"
  };

  function setMode(newMode) {
    state.mode = newMode;
    document.querySelectorAll(".tool-icon-btn[data-mode]").forEach(b => {
      b.classList.toggle("active", b.dataset.mode === newMode);
    });
    modeHint.textContent = hints[newMode] || "";
    document.body.classList.toggle("delete-mode", newMode === "delete");

    finishCurrentDrawing();
    updateInspectorPanel();
  }

  document.querySelectorAll(".tool-icon-btn[data-mode]").forEach(btn => {
    btn.addEventListener("click", () => {
      setMode(btn.dataset.mode);
    });
  });

  // 7. 施設スタンプ・文字配置の追加処理
  async function addPoiAtLocation(lat, lon) {
    state.saveToHistory();
    const poiType = selectPoiType.value;
    const defaultNames = {
      signal: "交差点",
      supermarket: "スーパー",
      station: "駅",
      "7eleven": "セブン-イレブン",
      familymart: "ファミリーマート",
      lawson: "ローソン",
      fuel: "GS",
      post_office: "郵便局",
      school: "学校",
      hospital: "病院"
    };

    let initialName = (inputPoiName.value || defaultNames[poiType] || "施設").trim();
    const poiId = `poi_${Date.now()}`;

    if (poiType === "station" && (!inputPoiName.value || inputPoiName.value === "駅" || inputPoiName.value === "大宮駅")) {
      initialName = "駅検索中...";
    }

    const newPoi = {
      id: poiId,
      category: poiType === "station" ? "station" : poiType === "signal" ? "signal" : poiType === "supermarket" ? "supermarket" : poiType === "fuel" ? "fuel" : "convenience",
      icon_type: poiType,
      name: initialName,
      lat: lat,
      lon: lon,
      fontSize: poiType === "station" ? 13 : 11.5,
      rotation: 0,
      hasLeaderLine: false
    };

    state.landmarks.push(newPoi);
    syncAll();

    // 駅名の自動問い合わせ
    if (poiType === "station") {
      try {
        const res = await fetch("/api/find_poi", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon, category: "station" })
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.name) {
            newPoi.name = data.name;
            inputPoiName.value = data.name;
          } else if (newPoi.name === "駅検索中...") {
            newPoi.name = "駅";
          }
          syncAll();
        }
      } catch (err) {
        if (newPoi.name === "駅検索中...") {
          newPoi.name = "駅";
          syncAll();
        }
      }
    }
  }

  function addTextAtLocation(lat, lon) {
    let txt = (inputTextString ? inputTextString.value : "").trim();
    if (!txt) {
      txt = prompt("表示する文字を入力してください（例: 至 坂戸駅、鉄砲道、学園通り）:", "至 坂戸駅");
      if (!txt || !txt.trim()) return;
      txt = txt.trim();
      if (inputTextString) inputTextString.value = txt;
    }
    state.saveToHistory();
    state.texts.push({
      id: `txt_${Date.now()}`,
      text: txt,
      lat: lat,
      lon: lon,
      fontSize: 18, rotation: 0, hasLeaderLine: false
    });
    syncAll();
  }

  function handleEditNameDialog(id, type) {
    if (id === "dest_pin" || id === "dest_label" || type === "dest-icon" || type === "dest-label") {
      const newName = prompt("目的地名を入力してください（例: 現地、モデルハウス、新築分譲地、A区画）:", state.dest.name);
      if (newName !== null && newName.trim()) {
        state.saveToHistory();
        state.dest.name = newName.trim();
        if (inputDestName) inputDestName.value = state.dest.name;
        mapTrace.updateDestPinIcon();
        syncAll();
      }
    } else if (type === "landmark-icon" || type === "landmark-label") {
      const p = state.findLandmark(id);
      if (!p) return;
      const labelType = p.icon_type === "signal" ? "交差点名" : p.icon_type === "supermarket" ? "スーパー名 (例: ヤオコー, いなげや)" : "施設名";
      const newName = prompt(`${labelType}を入力してください:`, p.name);
      if (newName !== null && newName.trim()) {
        state.saveToHistory();
        p.name = newName.trim();
        syncAll();
      }
    } else {
      const t = state.findText(id);
      if (!t) return;
      const newTxt = prompt("表示文字を入力してください:", t.text);
      if (newTxt !== null && newTxt.trim()) {
        state.saveToHistory();
        t.text = newTxt.trim();
        syncAll();
      }
    }
  }

  // 8. 左画面 Leaflet のクリック作図イベント
  mapTrace.map.on("click", async (e) => {
    const lat = e.latlng.lat;
    const lon = e.latlng.lng;

    if (state.mode === "dest") {
      state.saveToHistory();
      state.dest.lat = lat;
      state.dest.lon = lon;
      mapTrace.destMarker.setLatLng(e.latlng);
      renderSvg();

    } else if (state.mode === "lot") {
      state.drawingPoints.push([lat, lon]);
      if (!state.activePolyline) {
        state.activePolyline = L.polygon(state.drawingPoints, {
          className: "active-drawing-line",
          color: "#dc2626",
          fillColor: "#ef4444",
          fillOpacity: 0.25,
          dashArray: "4, 4",
          interactive: false
        }).addTo(mapTrace.map);
      } else {
        state.activePolyline.setLatLngs(state.drawingPoints);
      }
    } else if (["major_road", "medium_road", "minor_road", "railway", "route"].includes(state.mode)) {
      state.drawingPoints.push([lat, lon]);

      const lineColor = state.mode === "major_road" ? "#ff9800"
        : state.mode === "medium_road" ? "#3b82f6"
        : state.mode === "minor_road" ? "#10b981"
        : state.mode === "route" ? "#e53935"
        : "#222222";

      if (!state.activePolyline) {
        state.activePolyline = L.polyline(state.drawingPoints, {
          className: "active-drawing-line",
          color: lineColor,
          dashArray: state.mode === "route" ? "8,5" : null,
          interactive: false
        }).addTo(mapTrace.map);
      } else {
        state.activePolyline.setLatLngs(state.drawingPoints);
      }

    } else if (state.mode === "poi") {
      await addPoiAtLocation(lat, lon);

    } else if (state.mode === "text") {
      addTextAtLocation(lat, lon);
    }
  });

  mapTrace.map.on("dblclick", (e) => {
    L.DomEvent.stop(e);
    finishCurrentDrawing();
  });

  // 敷地・多角形プロパティ イベントリスナー
  if (lotHasFill) {
    lotHasFill.addEventListener("change", (e) => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        sel.data.hasFill = e.target.checked;
        renderSvg();
        mapTrace.syncDrawnLayers();
      }
    });
  }
  if (lotFillColor) {
    lotFillColor.addEventListener("input", (e) => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        sel.data.fillColor = e.target.value;
        renderSvg();
        mapTrace.syncDrawnLayers();
      }
    });
  }
  if (lotFillOpacity) {
    lotFillOpacity.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      if (lotFillOpacityVal) lotFillOpacityVal.textContent = `${Math.round(val * 100)}%`;
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        sel.data.fillOpacity = val;
        renderSvg();
      }
    });
  }
  if (lotHasStroke) {
    lotHasStroke.addEventListener("change", (e) => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        sel.data.hasStroke = e.target.checked;
        renderSvg();
        mapTrace.syncDrawnLayers();
      }
    });
  }
  if (lotStrokeColor) {
    lotStrokeColor.addEventListener("input", (e) => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        sel.data.strokeColor = e.target.value;
        renderSvg();
        mapTrace.syncDrawnLayers();
      }
    });
  }
  if (lotStrokeWidth) {
    lotStrokeWidth.addEventListener("input", (e) => {
      const val = parseFloat(e.target.value);
      if (lotStrokeWidthVal) lotStrokeWidthVal.textContent = String(val);
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        sel.data.strokeWidth = val;
        renderSvg();
        mapTrace.syncDrawnLayers();
      }
    });
  }
  if (lotStrokeDash) {
    lotStrokeDash.addEventListener("change", (e) => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        sel.data.strokeDash = e.target.value;
        renderSvg();
        mapTrace.syncDrawnLayers();
      }
    });
  }
  if (btnLotToggleSite) {
    btnLotToggleSite.addEventListener("click", () => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "lot") {
        state.saveToHistory();
        const nextSite = !sel.data.isSite;
        if (nextSite) {
          state.lots.forEach(l => l.isSite = false);
        }
        sel.data.isSite = nextSite;
        updateInspectorPanel();
        renderSvg();
        mapTrace.syncDrawnLayers();
        showToast(nextSite ? "◎ この区画を申請地に設定しました" : "申請地設定を解除しました");
      }
    });
  }
  if (btnLotDelete) {
    btnLotDelete.addEventListener("click", () => {
      if (state.selectedId && state.selectedType === "lot") {
        handleDeleteElement(state.selectedId, "lot");
      }
    });
  }

  // 文字色 & 白フチの変更リスナー
  if (inspectorTextColor) {
    inspectorTextColor.addEventListener("input", (e) => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "text") {
        state.saveToHistory();
        sel.data.color = e.target.value;
        renderSvg();
      }
    });
  }
  if (inspectorHalo) {
    inspectorHalo.addEventListener("change", (e) => {
      const sel = state.getSelectedElementData();
      if (sel && sel.type === "text") {
        state.saveToHistory();
        sel.data.hasHalo = e.target.checked;
        renderSvg();
      }
    });
  }

  // 地図詳細度 (文字サイズ) の変更リスナー
  if (permitTileZoom) {
    permitTileZoom.addEventListener("change", (e) => {
      state.saveToHistory();
      if (!state.permitInfo) state.permitInfo = {};
      state.permitInfo.tileZoom = e.target.value;
      renderSvg();
      showToast(`地図詳細度を ${e.target.options[e.target.selectedIndex].text} に変更しました`);
    });
  }

  function finishCurrentDrawing() {
    if (state.mode === "lot" && state.drawingPoints.length >= 3) {
      state.saveToHistory();
      const lotId = `lot_${Date.now()}`;
      const pts = state.drawingPoints.map(p => ({ lat: p[0], lon: p[1] }));
      const lotCount = (state.lots || []).length + 1;
      const isFirst = (state.lots.length === 0);
      state.lots.push({
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
      showToast(`📐 区画「${isFirst ? '申請地' : lotCount + '号地'}」を作成しました（クリックで選択、ダブルクリックで申請地切り替え）`);
      syncAll();
    } else if (state.drawingPoints.length >= 2) {
      state.saveToHistory();
      if (["major_road", "medium_road", "minor_road"].includes(state.mode)) {
        const roadType = state.mode === "major_road" ? "major" : state.mode === "medium_road" ? "medium" : "minor";
        state.roads.push({
          id: `road_${Date.now()}`,
          type: roadType,
          points: [...state.drawingPoints],
          casingColor: state.roadCasingColor,
          innerColor: state.roadInnerColor,
          filled: state.roadFilled,
          fillColor: state.roadFillColor
        });
      } else if (state.mode === "railway") {
        state.rails.push({
          id: `rail_${Date.now()}`,
          points: [...state.drawingPoints]
        });
      } else if (state.mode === "route") {
        state.routes.push({
          id: `route_${Date.now()}`,
          points: [...state.drawingPoints]
        });
      }
      syncAll();
    }
    state.drawingPoints = [];
    if (state.activePolyline) {
      mapTrace.map.removeLayer(state.activePolyline);
      state.activePolyline = null;
    }
  }

  // 9. 道路スタイル変更連動
  if (roadCasingColorInput) {
    roadCasingColorInput.addEventListener("input", () => { state.roadCasingColor = roadCasingColorInput.value; });
  }
  if (roadInnerColorInput) {
    roadInnerColorInput.addEventListener("input", () => { state.roadInnerColor = roadInnerColorInput.value; });
  }
  if (roadFilledInput) {
    roadFilledInput.addEventListener("change", () => {
      state.roadFilled = roadFilledInput.checked;
      if (roadFillColorLabel) roadFillColorLabel.style.display = roadFilledInput.checked ? "flex" : "none";
    });
  }
  if (roadFillColorInput) {
    roadFillColorInput.addEventListener("input", () => { state.roadFillColor = roadFillColorInput.value; });
  }

  // 施設スタンプ選択イベント
  selectPoiType.addEventListener("change", () => {
    const poiType = selectPoiType.value;
    const defaultNames = {
      signal: "交差点",
      supermarket: "ヤオコー",
      station: "駅",
      "7eleven": "セブン-イレブン",
      familymart: "ファミリーマート",
      lawson: "ローソン",
      fuel: "GS",
      post_office: "郵便局",
      school: "学校",
      hospital: "病院"
    };
    if (poiType !== "station") {
      inputPoiName.value = defaultNames[poiType] || "施設";
    }
    setMode("poi");
  });

  // クイックテキストチップ
  document.querySelectorAll(".btn-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const val = chip.getAttribute("data-text");
      if (val && inputTextString) {
        inputTextString.value = val;
        setMode("text");
      }
    });
  });

  // 10. ヘッダー設定・住所検索
  inputDestName.addEventListener("input", () => {
    state.dest.name = inputDestName.value.trim() || "現地";
    mapTrace.updateDestPinIcon();
    renderSvg();
  });

  // モード切り替え関数 (案内図モード ⇄ 各種申請モード)
  function setAppMode(mode) {
    if (state.appMode === mode) return;

    // 1. state側の作図データ完全分離スワップ
    state.switchAppMode(mode);

    if (btnModeAd) btnModeAd.classList.toggle("active", mode === "ad");
    if (btnModePermit) {
      btnModePermit.classList.toggle("permit-active", mode === "permit");
      btnModePermit.classList.toggle("active", mode === "permit");
    }

    // 2. ツールバーの表示切り替え（案内図専用ツール vs 各種申請専用ツール）
    document.querySelectorAll(".tool-ad-only").forEach(el => {
      el.style.display = (mode === "ad") ? "flex" : "none";
    });
    document.querySelectorAll(".tool-permit-only").forEach(el => {
      el.style.display = (mode === "permit") ? "flex" : "none";
    });

    if (mode === "permit") {
      if (inspectorPermit) inspectorPermit.style.display = "flex";
      const scale = (state.permitInfo && state.permitInfo.scale) || 2500;
      state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(scale, state.widthMm, 10);
      if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm (1/${scale} 余白10mm)`;
      syncPermitUI();
      showToast("📑 【各種申請モード】1/2500 国土地理院白図・見取図モードに切り替えました");
    } else {
      if (inspectorPermit) inspectorPermit.style.display = "none";
      if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm`;
      if (inputWidthMm) inputWidthMm.value = state.widthMm;
      if (inputHeightMm) inputHeightMm.value = state.heightMm;
      if (inputDestName) inputDestName.value = state.dest.name || "現地";
      showToast("🏢 【案内図モード】チラシ・Web用案内図モードに切り替えました");
    }

    setMode("select");
    // 左画面地図および作図枠マーカーを中心へ完全同期
    if (mapTrace && mapTrace.map) {
      mapTrace.map.setView([state.frameCenter.lat, state.frameCenter.lon]);
      mapTrace.destMarker.setLatLng([state.dest.lat, state.dest.lon]);
      mapTrace.frameCenterMarker.setLatLng([state.frameCenter.lat, state.frameCenter.lon]);
      mapTrace.updateFramingRectangle();
      mapTrace.updateDestPinIcon();
    }
    syncAll();
  }

  function syncPermitUI() {
    const info = state.permitInfo || {};
    if (permitTitle) permitTitle.value = info.title || "付近見取図";
    if (permitLotNumber) permitLotNumber.value = info.lotNumber || "";
    if (permitAddress) permitAddress.value = info.address || "";
    if (permitArchitectNo) permitArchitectNo.value = info.architectNo || "";
    if (permitArchitectName) permitArchitectName.value = info.architectName || "";
    if (permitBaseMap) permitBaseMap.value = info.baseMapType || "pale";
    if (permitScale) permitScale.value = String(info.scale || 2500);
    if (permitPaperSize) permitPaperSize.value = info.paperSize || "A4_landscape";
    if (permitBoxPosition) permitBoxPosition.value = info.boxPosition || "bottom-right";

    if (inputWidthMm) inputWidthMm.value = state.widthMm;
    if (inputHeightMm) inputHeightMm.value = state.heightMm;
    if (inputDestName) inputDestName.value = state.dest.name || "申請地";
  }

  if (btnModeAd) {
    btnModeAd.addEventListener("click", () => setAppMode("ad"));
  }
  if (btnModePermit) {
    btnModePermit.addEventListener("click", () => setAppMode("permit"));
  }

  // 各種申請インスペクターのイベントリスナー
  if (permitTitle) {
    permitTitle.addEventListener("input", (e) => {
      state.saveToHistory();
      state.permitInfo.title = e.target.value;
      renderSvg();
    });
  }
  const btnPermitLocate = document.getElementById("btnPermitLocate");
  const checkPermitSiteMarker = document.getElementById("checkPermitSiteMarker");
  if (checkPermitSiteMarker) {
    checkPermitSiteMarker.addEventListener("change", () => {
      state.saveToHistory();
      state.dest.hidePin = !checkPermitSiteMarker.checked;
      if (state.permitScene) state.permitScene.dest.hidePin = state.dest.hidePin;
      renderSvg();
      showToast(state.dest.hidePin ? "申請地記号（◎）を非表示にしました" : "申請地記号（◎）を表示しました");
    });
  }
  async function locatePermitAddress() {
    const q = (permitAddress && permitAddress.value.trim()) || (permitLotNumber && permitLotNumber.value.trim());
    if (!q) {
      showToast("地名地番または住居表示を入力してください", true);
      return;
    }
    await searchAddress(q);
  }
  if (btnPermitLocate) {
    btnPermitLocate.addEventListener("click", locatePermitAddress);
  }
  if (permitLotNumber) {
    permitLotNumber.addEventListener("input", (e) => {
      state.saveToHistory();
      state.permitInfo.lotNumber = e.target.value;
      renderSvg();
    });
    permitLotNumber.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        locatePermitAddress();
      }
    });
  }
  if (permitAddress) {
    permitAddress.addEventListener("input", (e) => {
      state.saveToHistory();
      state.permitInfo.address = e.target.value;
      renderSvg();
    });
    permitAddress.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        locatePermitAddress();
      }
    });
  }
  if (permitArchitectNo) {
    permitArchitectNo.addEventListener("input", (e) => {
      state.saveToHistory();
      state.permitInfo.architectNo = e.target.value;
      renderSvg();
    });
  }
  if (permitArchitectName) {
    permitArchitectName.addEventListener("input", (e) => {
      state.saveToHistory();
      state.permitInfo.architectName = e.target.value;
      renderSvg();
    });
  }
  if (permitBaseMap) {
    permitBaseMap.addEventListener("change", (e) => {
      state.saveToHistory();
      state.permitInfo.baseMapType = e.target.value;
      renderSvg();
      showToast(`背景地図を「${e.target.options[e.target.selectedIndex].text}」に切り替えました`);
    });
  }
  if (permitScale) {
    permitScale.addEventListener("change", (e) => {
      state.saveToHistory();
      const s = parseInt(e.target.value) || 2500;
      state.permitInfo.scale = s;
      state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(s, state.widthMm, 10);
      if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm (1/${s} 余白10mm)`;
      mapTrace.updateFramingRectangle();
      renderSvg();
      showToast(`縮尺を「1/${s.toLocaleString()}」に設定しました`);
    });
  }
  if (permitPaperSize) {
    permitPaperSize.addEventListener("change", (e) => {
      state.saveToHistory();
      const val = e.target.value;
      state.permitInfo.paperSize = val;
      if (val === "A4_landscape") {
        state.widthMm = 297;
        state.heightMm = 210;
      } else if (val === "A4_portrait") {
        state.widthMm = 210;
        state.heightMm = 297;
      } else if (val === "B5_landscape") {
        state.widthMm = 257;
        state.heightMm = 182;
      } else if (val === "B5_portrait") {
        state.widthMm = 182;
        state.heightMm = 257;
      }
      if (inputWidthMm) inputWidthMm.value = state.widthMm;
      if (inputHeightMm) inputHeightMm.value = state.heightMm;
      const s = (state.permitInfo && state.permitInfo.scale) || 2500;
      state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(s, state.widthMm, 10);
      if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm (1/${s} 余白10mm)`;
      mapTrace.updateFramingRectangle();
      renderSvg();
      showToast(`用紙を「${e.target.options[e.target.selectedIndex].text}」に変更しました`);
    });
  }
  if (permitBoxPosition) {
    permitBoxPosition.addEventListener("change", (e) => {
      state.saveToHistory();
      state.permitInfo.boxPosition = e.target.value;
      renderSvg();
      showToast(`表題欄を「${e.target.options[e.target.selectedIndex].text}」に配置しました`);
    });
  }

  inputWidthMm.addEventListener("change", () => {
    state.widthMm = parseFloat(inputWidthMm.value) || 80;
    if (state.appMode === "permit") {
      const s = (state.permitInfo && state.permitInfo.scale) || 2500;
      state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(s, state.widthMm);
    }
    if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm`;
    mapTrace.updateFramingRectangle();
    renderSvg();
  });

  inputHeightMm.addEventListener("change", () => {
    state.heightMm = parseFloat(inputHeightMm.value) || 50;
    if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm`;
    mapTrace.updateFramingRectangle();
    renderSvg();
  });

  checkTransparentBg.addEventListener("change", () => {
    state.transparentBg = checkTransparentBg.checked;
    previewCard.classList.toggle("transparent-mode", state.transparentBg);
    renderSvg();
  });

  checkScale.addEventListener("change", () => {
    state.showScale = checkScale.checked;
    renderSvg();
  });

  checkCompass.addEventListener("change", () => {
    state.showCompass = checkCompass.checked;
    renderSvg();
  });

  async function searchAddress(targetQuery) {
    const q = (typeof targetQuery === "string" ? targetQuery : (inputAddress ? inputAddress.value : "")).trim();
    if (!q) return;

    try {
      let lat = null;
      let lon = null;

      // 1. バックエンドAPI経由
      try {
        const res = await fetch("/api/geocode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: q })
        });
        if (res.ok) {
          const d = await res.json();
          if (d.lat && d.lon) {
            lat = d.lat;
            lon = d.lon;
          }
        }
      } catch (backendErr) {
        console.log("Backend geocode unavailable, falling back:", backendErr);
      }

      // 2. 国土地理院 API (完全一致検索)
      if (lat === null || lon === null) {
        try {
          const gsiRes = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`);
          if (gsiRes.ok) {
            const gsiData = await gsiRes.json();
            if (gsiData && gsiData.length > 0 && gsiData[0].geometry) {
              lon = gsiData[0].geometry.coordinates[0];
              lat = gsiData[0].geometry.coordinates[1];
            }
          }
        } catch (e) {
          console.warn("GSI exact geocode failed:", e);
        }
      }

      // 3. 国土地理院 API (番地や数字を取り除いた段階的フォールバック)
      if (lat === null || lon === null) {
        const simplified = q.replace(/[0-9０-９]+番.*$|[0-9０-９]+-[0-9０-９].*$|[0-9０-９]+号.*$/g, "").trim();
        if (simplified && simplified !== q) {
          try {
            const gsiRes2 = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(simplified)}`);
            if (gsiRes2.ok) {
              const gsiData2 = await gsiRes2.json();
              if (gsiData2 && gsiData2.length > 0 && gsiData2[0].geometry) {
                lon = gsiData2[0].geometry.coordinates[0];
                lat = gsiData2[0].geometry.coordinates[1];
              }
            }
          } catch (e) {
            console.warn("GSI simplified geocode failed:", e);
          }
        }
      }

      // 4. OpenStreetMap Nominatim フォールバック
      if (lat === null || lon === null) {
        try {
          const nomRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=jp&limit=1`, {
            headers: { "Accept-Language": "ja" }
          });
          if (nomRes.ok) {
            const nomData = await nomRes.json();
            if (nomData && nomData.length > 0) {
              lat = parseFloat(nomData[0].lat);
              lon = parseFloat(nomData[0].lon);
            }
          }
        } catch (e) {
          console.warn("Nominatim geocode failed:", e);
        }
      }

      if (lat === null || lon === null) {
        throw new Error(`該当の住所「${q}」が見つかりませんでした。町名や大字までで検索するか、左地図で目的の場所をクリック・ドラッグしてください。`);
      }

      state.saveToHistory();

      // 新規作図のため要素クリア
      state.roads = [];
      state.rails = [];
      state.routes = [];
      state.landmarks = [];
      state.texts = [];
      state.lots = [];
      state.drawingPoints = [];

      state.dest.lat = lat;
      state.dest.lon = lon;
      const isPermit = (state.appMode === "permit");
      state.dest.name = isPermit ? "申請地" : ((inputDestName ? inputDestName.value.trim() : "") || "目的地");
      state.frameCenter.lat = lat;
      state.frameCenter.lon = lon;

      // 待機の退避シーンも最新の座標に同期
      if (state.adScene) {
        state.adScene.dest.lat = lat;
        state.adScene.dest.lon = lon;
        state.adScene.frameCenter = { lat, lon };
      }
      if (state.permitScene) {
        state.permitScene.dest.lat = lat;
        state.permitScene.dest.lon = lon;
        state.permitScene.frameCenter = { lat, lon };
      }

      if (isPermit) {
        const s = (state.permitInfo && state.permitInfo.scale) ? state.permitInfo.scale : 2500;
        state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(s, state.widthMm, 10);
        // 表題欄にも住所を自動反映
        if (!state.permitInfo.address || state.permitInfo.address.trim() === "") {
          state.permitInfo.address = q;
        }
        if (!state.permitInfo.lotNumber || state.permitInfo.lotNumber.trim() === "") {
          state.permitInfo.lotNumber = q;
        }
        if (permitAddress) permitAddress.value = state.permitInfo.address;
        if (permitLotNumber) permitLotNumber.value = state.permitInfo.lotNumber;
      } else {
        state.viewRadiusM = 450;
        state.effectiveRadiusM = 450;
      }

      // 入力バーにも同期
      if (inputAddress && inputAddress.value !== q) {
        inputAddress.value = q;
      }

      mapTrace.map.setView([lat, lon], 16);
      mapTrace.destMarker.setLatLng([lat, lon]);
      mapTrace.frameCenterMarker.setLatLng([lat, lon]);
      mapTrace.updateDestPinIcon();
      syncAll();
      showToast(`「${q}」へ移動しました`);
    } catch (e) {
      alert(e.message);
    }
  }

  btnSearch.addEventListener("click", searchAddress);
  inputAddress.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchAddress();
    }
  });

  // 11. Undo / 全消去
  function handleUndo() {
    if (state.undo()) {
      syncAll();
      showToast("直前の操作を取り消しました (Undo)");
    } else {
      showToast("これ以上戻せません");
    }
  }

  btnUndo.addEventListener("click", handleUndo);

  btnClearAll.addEventListener("click", () => {
    if (confirm("作図したすべての図形、敷地、および住所・表題欄データを消去してリセットしますか？")) {
      state.clearAll();
      if (state.permitInfo) {
        state.permitInfo.lotNumber = "";
        state.permitInfo.address = "";
      }
      if (state.permitScene && state.permitScene.permitInfo) {
        state.permitScene.permitInfo.lotNumber = "";
        state.permitScene.permitInfo.address = "";
      }
      if (permitLotNumber) permitLotNumber.value = "";
      if (permitAddress) permitAddress.value = "";
      if (inputAddress) inputAddress.value = "";
      try {
        localStorage.removeItem("annaizu_autosave_v3");
      } catch (err) {}
      syncAll();
      showToast("すべての作図・住所データを消去・リセットしました", true);
    }
  });

  // 12. 保存・読込
  function saveProject() {
    const json = state.exportJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const dateStr = new Date().toLocaleDateString("ja-JP").replace(/\//g, "-");
    a.download = `案内図_${state.dest.name}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("作図データをJSON保存しました");
  }

  function loadProject(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        state.importJson(e.target.result);
        if (inputDestName) inputDestName.value = state.dest.name;
        if (inputWidthMm) inputWidthMm.value = state.widthMm;
        if (inputHeightMm) inputHeightMm.value = state.heightMm;
        mapTrace.destMarker.setLatLng([state.dest.lat, state.dest.lon]);
        mapTrace.frameCenterMarker.setLatLng([state.frameCenter.lat, state.frameCenter.lon]);
        mapTrace.map.setView([state.frameCenter.lat, state.frameCenter.lon], 16);
        mapTrace.updateDestPinIcon();
        syncAll();
        showToast(`「${state.dest.name}」のデータを読み込みました`);
      } catch (err) {
        alert("ファイルの読み込みに失敗しました: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  btnSave.addEventListener("click", saveProject);
  btnLoad.addEventListener("click", () => {
    if (inputLoadFile) inputLoadFile.click();
  });
  inputLoadFile.addEventListener("change", (e) => {
    if (e.target.files && e.target.files[0]) {
      loadProject(e.target.files[0]);
      e.target.value = "";
    }
  });

  // 13. エクスポート (SVG / PNG)
  btnExportSvg.addEventListener("click", () => {
    const svgEl = svgContainer.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svgEl);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `案内図_${state.dest.name}_${state.widthMm}x${state.heightMm}mm.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("SVGファイルを出力しました");
  });

  // PDF出力ボタンハンドラ (jsPDF 高精細ダイレクト保存 ＆ 印刷フォールバック)
  const btnExportPdf = document.getElementById("btnExportPdf");
  if (btnExportPdf) {
    btnExportPdf.addEventListener("click", async () => {
      showToast("📄 PDF出力を準備中...");
      try {
        const svgEl = svgContainer.querySelector("svg");
        if (!svgEl) throw new Error("図面SVGが見つかりません");

        if (window.jspdf && window.jspdf.jsPDF) {
          const { jsPDF } = window.jspdf;
          const isLandscape = state.widthMm >= state.heightMm;
          const orientation = isLandscape ? "landscape" : "portrait";
          const paperFormat = [state.widthMm, state.heightMm];

          const doc = new jsPDF({
            orientation: orientation,
            unit: "mm",
            format: paperFormat,
            compress: true
          });

          const serializer = new XMLSerializer();
          const svgString = serializer.serializeToString(svgEl);
          const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(svgBlob);

          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = () => reject(new Error("SVG画像の読み込みに失敗しました"));
            img.src = url;
          });

          const scale = 3.5;
          const canvas = document.createElement("canvas");
          canvas.width = svgEl.viewBox.baseVal.width * scale;
          canvas.height = svgEl.viewBox.baseVal.height * scale;
          const ctx = canvas.getContext("2d");

          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);

          const imgData = canvas.toDataURL("image/jpeg", 0.95);
          doc.addImage(imgData, "JPEG", 0, 0, state.widthMm, state.heightMm);

          const fileTitle = state.appMode === "permit"
            ? `付近見取図_${(state.permitInfo?.title || "申請図")}_${(state.permitInfo?.lotNumber || state.dest.name || "A4")}.pdf`
            : `案内図_${state.dest.name || "物件"}.pdf`;

          doc.save(fileTitle);
          showToast(`📄 PDFファイル「${fileTitle}」を出力しました`);
          return;
        }

        // jsPDF未読込時は印刷ダイアログを起動
        window.print();
      } catch (err) {
        console.warn("Direct PDF export warning, falling back to window.print:", err);
        window.print();
      }
    });
  }

  // 申請地を中心へ瞬時同期するアシストボタン
  const btnCenterToSite = document.getElementById("btnCenterToSite");
  if (btnCenterToSite) {
    btnCenterToSite.addEventListener("click", () => {
      const c = mapTrace.map.getCenter();
      state.saveToHistory();
      state.frameCenter.lat = c.lat;
      state.frameCenter.lon = c.lng;
      state.dest.lat = c.lat;
      state.dest.lon = c.lng;
      mapTrace.destMarker.setLatLng(c);
      mapTrace.frameCenterMarker.setLatLng(c);
      mapTrace.updateFramingRectangle();
      mapTrace.updateDestPinIcon();
      syncAll();
      showToast("📍 現在の地図中心に申請地と作図枠を合わせました");
    });
  }

  btnExportPng.addEventListener("click", () => {
    const svgEl = svgContainer.querySelector("svg");
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const scale = 3.5; // 350dpi 高解像度
      const canvas = document.createElement("canvas");
      canvas.width = svgEl.viewBox.baseVal.width * scale;
      canvas.height = svgEl.viewBox.baseVal.height * scale;
      const ctx = canvas.getContext("2d");

      if (!state.transparentBg) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `案内図_${state.dest.name}_高解像度.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("PNG画像を出力しました");
    };
    img.src = url;
  });

  // 14. ズーム制御
  function updateZoom() {
    previewCard.style.transform = `scale(${state.zoom})`;
    zoomLevel.textContent = `${Math.round(state.zoom * 100)}%`;
  }
  btnZoomIn.addEventListener("click", () => {
    state.zoom = Math.min(state.zoom + 0.15, 2.5);
    updateZoom();
  });
  btnZoomOut.addEventListener("click", () => {
    state.zoom = Math.max(state.zoom - 0.15, 0.4);
    updateZoom();
  });
  btnZoomReset.addEventListener("click", () => {
    state.zoom = 1.0;
    updateZoom();
  });
  btnZoomFit.addEventListener("click", () => {
    const wrap = document.getElementById("canvasWrapper");
    if (!wrap || !previewCard) return;
    const w = wrap.clientWidth - 40;
    const pw = previewCard.offsetWidth || 680;
    state.zoom = Math.min(w / pw, 1.4);
    updateZoom();
  });

  // 15. 初期化実行
  const urlParams = new URLSearchParams(window.location.search);
  const demoScene = urlParams.get("demo_scene");

  if (demoScene === "permit_demo") {
    state.clearAll();
    state.appMode = "permit";
    state.dest.lat = 35.93022197293941;
    state.dest.lon = 139.35954567581553;
    state.dest.name = "申請地";
    state.frameCenter = { lat: 35.93022, lon: 139.35954 };
    state.widthMm = 297;
    state.heightMm = 210;
    state.permitInfo = {
      title: "付近見取図",
      lotNumber: "埼玉県坂戸市森戸字向山123番4",
      address: "埼玉県坂戸市森戸3-5-12",
      architectNo: "一級建築士 第123456号",
      architectName: "住ま居る 太郎",
      scale: 2500,
      baseMapType: "pale",
      paperSize: "A4_landscape",
      boxPosition: "bottom-right",
      siteSymbol: "double_circle",
      applicant: "住ま居る 設計部"
    };
    state.effectiveRadiusM = GeoUtil.scaleToEffectiveRadius(2500, 297, 10);

    // デモ用サンプル区画割（街中の角から2件目を表現）
    state.lots = [
      {
        id: "lot_demo_1",
        label: "1号地",
        isSite: false,
        points: [
          { lat: 35.93035, lon: 139.35925 },
          { lat: 35.93035, lon: 139.35948 },
          { lat: 35.93015, lon: 139.35948 },
          { lat: 35.93015, lon: 139.35925 }
        ]
      },
      {
        id: "lot_demo_2",
        label: "2号地(申請地)",
        isSite: true,
        points: [
          { lat: 35.93035, lon: 139.35948 },
          { lat: 35.93035, lon: 139.35970 },
          { lat: 35.93015, lon: 139.35970 },
          { lat: 35.93015, lon: 139.35948 }
        ]
      },
      {
        id: "lot_demo_3",
        label: "3号地",
        isSite: false,
        points: [
          { lat: 35.93035, lon: 139.35970 },
          { lat: 35.93035, lon: 139.35992 },
          { lat: 35.93015, lon: 139.35992 },
          { lat: 35.93015, lon: 139.35970 }
        ]
      }
    ];

    if (inputDestName) inputDestName.value = "申請地";
    if (inputWidthMm) inputWidthMm.value = 297;
    if (inputHeightMm) inputHeightMm.value = 210;
    if (inputAddress) inputAddress.value = "埼玉県坂戸市森戸 (西大家駅周辺)";

    setTimeout(() => {
      mapTrace.map.setView([state.frameCenter.lat, state.frameCenter.lon], 16);
      mapTrace.destMarker.setLatLng([state.dest.lat, state.dest.lon]);
      mapTrace.frameCenterMarker.setLatLng([state.frameCenter.lat, state.frameCenter.lon]);
      mapTrace.syncDrawnLayers();
    }, 200);
  } else if (demoScene && demoScene.startsWith("sumairu")) {
    state.clearAll();
    const sumairu = {
      "version": 3,
      "dest": {
        "lat": 35.93022197293941,
        "lon": 139.35954567581553,
        "name": "住ま居る",
        "labelOffsetX": -51.1,
        "labelOffsetY": 19.5,
        "fontSize": 14,
        "rotation": 0,
        "hasLeaderLine": false
      },
      "frameCenter": {
        "lat": 35.93146435912309,
        "lon": 139.3585036337543
      },
      "widthMm": 60,
      "heightMm": 40,
      "viewRadiusM": 450,
      "effectiveRadiusM": 450,
      "transparentBg": false,
      "showScale": true,
      "showCompass": true,
      "compass": { "x": 498.5, "y": 105.4, "scale": 1 },
      "railMode": "jr",
      "roads": [
        {
          "id": "road_1", "type": "major",
          "points": [
            [35.92988, 139.35462], [35.93014, 139.35495], [35.93065, 139.35546],
            [35.93093, 139.35563], [35.93132, 139.35570], [35.93149, 139.35574],
            [35.93156, 139.35579], [35.93199, 139.35635], [35.93256, 139.35706],
            [35.93364, 139.35851]
          ],
          "casingColor": "#666666", "innerColor": "#ffffff", "filled": false, "fillColor": "#ffe066"
        },
        {
          "id": "road_2", "type": "medium",
          "points": [
            [35.93289, 139.35574], [35.93262, 139.35581], [35.93239, 139.35594],
            [35.93226, 139.35594], [35.93216, 139.35596], [35.93198, 139.35596],
            [35.93181, 139.35591], [35.93155, 139.35576]
          ],
          "casingColor": "#666666", "innerColor": "#ffffff", "filled": false, "fillColor": "#ffe066"
        },
        {
          "id": "road_3", "type": "medium",
          "points": [
            [35.92985, 139.36145], [35.93013, 139.36066], [35.93081, 139.35848],
            [35.93006, 139.35604], [35.93015, 139.35500]
          ],
          "casingColor": "#666666", "innerColor": "#ffffff", "filled": false, "fillColor": "#ffe066"
        },
        {
          "id": "road_4", "type": "medium",
          "points": [
            [35.93153, 139.36249], [35.93013, 139.36068]
          ],
          "casingColor": "#666666", "innerColor": "#ffffff", "filled": false, "fillColor": "#ffe066"
        },
        {
          "id": "road_5", "type": "minor",
          "points": [
            [35.93212, 139.35651], [35.93181, 139.35687], [35.93159, 139.35676],
            [35.93150, 139.35683], [35.93147, 139.35690], [35.93127, 139.35739],
            [35.93097, 139.35815], [35.93081, 139.35848]
          ],
          "casingColor": "#666666", "innerColor": "#ffffff", "filled": false, "fillColor": "#ffe066"
        },
        {
          "id": "road_6", "type": "minor",
          "points": [
            [35.92983, 139.35684], [35.93043, 139.35677], [35.93083, 139.35677],
            [35.93120, 139.35681], [35.93140, 139.35687], [35.93155, 139.35698],
            [35.93167, 139.35711], [35.93178, 139.35726], [35.93196, 139.35740]
          ],
          "casingColor": "#666666", "innerColor": "#ffffff", "filled": false, "fillColor": "#ffe066"
        }
      ],
      "rails": [
        {
          "id": "rail_1",
          "points": [
            [35.93133, 139.35465], [35.93133, 139.35505], [35.93139, 139.35545],
            [35.93148, 139.35586], [35.93181, 139.35716], [35.93204, 139.35793],
            [35.93213, 139.35817], [35.93223, 139.35835], [35.93273, 139.35932]
          ]
        }
      ],
      "routes": [],
      "landmarks": [
        {
          "id": "poi_station_1", "category": "station", "icon_type": "station",
          "name": "西大家駅", "lat": 35.93164, "lon": 139.35649,
          "labelOffsetX": -16, "labelOffsetY": 22, "fontSize": 12
        },
        {
          "id": "poi_lawson_1", "category": "convenience", "icon_type": "lawson",
          "name": "ローソン", "lat": 35.93042, "lon": 139.36074,
          "labelOffsetX": 15, "labelOffsetY": -16
        },
        {
          "id": "poi_signal_1", "category": "signal", "icon_type": "signal",
          "name": "交差点", "lat": 35.93011, "lon": 139.36070,
          "labelOffsetX": 3, "labelOffsetY": 19
        },
        {
          "id": "poi_signal_2", "category": "signal", "icon_type": "signal",
          "name": "", "lat": 35.93015, "lon": 139.35497
        }
      ],
      "texts": [
        { "id": "txt_1", "text": "至 坂戸駅", "lat": 35.93271, "lon": 139.35934, "fontSize": 12 },
        { "id": "txt_2", "text": "至 川角駅", "lat": 35.93131, "lon": 139.35465, "fontSize": 12 },
        { "id": "txt_3", "text": "鉄砲道", "lat": 35.93096, "lon": 139.36150, "rotation": -45, "fontSize": 12 },
        { "id": "txt_4", "text": "東武越生線", "lat": 35.93198, "lon": 139.35827, "rotation": -30, "fontSize": 12 },
        { "id": "txt_5", "text": "東京国際大学G", "lat": 35.93308, "lon": 139.35539, "fontSize": 11 },
        { "id": "txt_6", "text": "つるゴンバス転回場", "lat": 35.93148, "lon": 139.35868, "fontSize": 11 }
      ]
    };
    state.dest = { ...sumairu.dest };
    state.frameCenter = { ...sumairu.frameCenter };
    state.widthMm = sumairu.widthMm || 60;
    state.heightMm = sumairu.heightMm || 40;
    state.viewRadiusM = sumairu.viewRadiusM || 450;
    state.effectiveRadiusM = sumairu.effectiveRadiusM || 450;
    state.roads = sumairu.roads || [];
    state.rails = sumairu.rails || [];
    state.landmarks = sumairu.landmarks || [];
    state.texts = sumairu.texts || [];

    if (inputDestName) inputDestName.value = state.dest.name;
    if (inputWidthMm) inputWidthMm.value = state.widthMm;
    if (inputHeightMm) inputHeightMm.value = state.heightMm;
    if (inputAddress) inputAddress.value = "埼玉県坂戸市森戸 (西大家駅周辺)";

    setTimeout(() => {
      mapTrace.map.setView([state.frameCenter.lat, state.frameCenter.lon], 16);
      mapTrace.destMarker.setLatLng([state.dest.lat, state.dest.lon]);
      mapTrace.frameCenterMarker.setLatLng([state.frameCenter.lat, state.frameCenter.lon]);
      mapTrace.updateDestPinIcon();
    }, 200);

    if (demoScene === "sumairu_modal") {
      state.selectedId = "poi_station_1";
      state.selectedType = "landmark";
      setTimeout(() => {
        const sel = state.getSelectedElementData();
        if (sel) openPropertyModal(sel);
      }, 500);
    } else if (demoScene === "sumairu_road") {
      setMode("major_road");
    } else if (demoScene === "sumairu_poi") {
      setMode("poi");
    } else if (demoScene === "sumairu_rail") {
      setMode("railway");
    } else if (demoScene === "sumairu_text") {
      setMode("text");
    }
  } else if (demoScene && demoScene !== "permit_demo") {
    // マニュアル作成・デモ用のサンプルシーン
    state.clearAll();
    state.dest.lat = 35.90637;
    state.dest.lon = 139.62550;
    state.dest.name = "現地\n(モデルハウス)";
    state.dest.bgColor = "#d32f2f";
    state.dest.labelOffsetX = 24;
    state.dest.labelOffsetY = -28;
    state.dest.hasLeaderLine = true;

    // 大通り
    state.roads.push({
      id: "road_major_1",
      type: "major",
      points: [[35.9035, 139.6210], [35.9065, 139.6280]],
      casingColor: "#555555",
      innerColor: "#ffffff"
    });
    // 一般道
    state.roads.push({
      id: "road_med_1",
      type: "medium",
      points: [[35.9080, 139.6220], [35.9040, 139.6260]],
      casingColor: "#666666",
      innerColor: "#ffffff"
    });
    // 線路 (私鉄 & JR)
    state.rails.push({
      id: "rail_1",
      points: [[35.9090, 139.6215], [35.9030, 139.6245]],
      mode: "private"
    });
    // 駅
    state.landmarks.push({
      id: "poi_station_1",
      category: "station",
      icon_type: "station",
      name: "大宮駅\n(東口)",
      lat: 35.9075,
      lon: 139.6225,
      labelOffsetX: 0,
      labelOffsetY: -26,
      fontSize: 13,
      hasLeaderLine: true,
      bgColor: "#1e3a8a",
      iconScale: 1.1
    });
    // 信号機（交差点名あり）
    state.landmarks.push({
      id: "poi_signal_1",
      category: "signal",
      icon_type: "signal",
      name: "大門町交差点",
      lat: 35.9055,
      lon: 139.6250,
      labelOffsetX: 0,
      labelOffsetY: -16,
      fontSize: 11
    });
    // 信号機（交差点名なし・ただの信号）
    state.landmarks.push({
      id: "poi_signal_plain",
      category: "signal",
      icon_type: "signal",
      name: "",
      lat: 35.9045,
      lon: 139.6235,
      labelOffsetX: 0,
      labelOffsetY: 0
    });
    // スーパー
    state.landmarks.push({
      id: "poi_super_1",
      category: "supermarket",
      icon_type: "supermarket",
      name: "ヤオコー",
      lat: 35.9060,
      lon: 139.6270,
      labelOffsetX: 20,
      labelOffsetY: 0,
      hasLeaderLine: true,
      iconScale: 1.2
    });
    // 自由テキスト（カギ型引き出し線付き）
    state.texts.push({
      id: "text_demo_1",
      text: "至 坂戸駅",
      lat: 35.9085,
      lon: 139.6285,
      fontSize: 12,
      rotation: -30,
      hasLeaderLine: true,
      leaderOffsetX: -35,
      leaderOffsetY: 25
    });

    if (demoScene === "modal" || demoScene === "sumairu_modal") {
      state.selectedId = "poi_station_1";
      state.selectedType = "landmark";
      setTimeout(() => {
        const sel = state.getSelectedElementData();
        if (sel) openPropertyModal(sel);
      }, 300);
    } else if (demoScene === "compass") {
      state.selectedId = "compass";
      state.selectedType = "compass";
    } else if (demoScene === "road_tool" || demoScene === "sumairu_road") {
      setMode("major_road");
    } else if (demoScene === "poi_tool" || demoScene === "sumairu_poi") {
      setMode("poi");
    } else if (demoScene === "rail_tool" || demoScene === "sumairu_rail") {
      setMode("railway");
    } else if (demoScene === "route_tool") {
      setMode("route");
    } else if (demoScene === "text_tool" || demoScene === "sumairu_text") {
      setMode("text");
    } else if (demoScene === "delete_tool") {
      setMode("delete");
    }
  } else {
    const restored = state.restoreAutoSave();
    if (restored) {
      if (inputDestName) inputDestName.value = state.dest.name;
      if (inputWidthMm) inputWidthMm.value = state.widthMm;
      if (inputHeightMm) inputHeightMm.value = state.heightMm;
      mapTrace.destMarker.setLatLng([state.dest.lat, state.dest.lon]);
      mapTrace.frameCenterMarker.setLatLng([state.frameCenter.lat, state.frameCenter.lon]);
      mapTrace.map.setView([state.frameCenter.lat, state.frameCenter.lon], 16);
      mapTrace.updateDestPinIcon();
    }
    setMode("select");
  }

  function syncPermitUI() {
    if (state.appMode === "permit") {
      if (btnModeAd) btnModeAd.classList.remove("active");
      if (btnModePermit) {
        btnModePermit.classList.add("permit-active");
        btnModePermit.classList.add("active");
      }
      if (inspectorPermit) inspectorPermit.style.display = "flex";
      if (permitTitle) permitTitle.value = state.permitInfo.title || "付近見取図";
      if (permitLotNumber) permitLotNumber.value = state.permitInfo.lotNumber || "";
      if (permitAddress) permitAddress.value = state.permitInfo.address || "";
      if (permitArchitectNo) permitArchitectNo.value = state.permitInfo.architectNo || "";
      if (permitArchitectName) permitArchitectName.value = state.permitInfo.architectName || "";
      if (permitBaseMap) permitBaseMap.value = state.permitInfo.baseMapType || "pale";
      if (permitScale) permitScale.value = state.permitInfo.scale || 2500;
      if (permitPaperSize) permitPaperSize.value = state.permitInfo.paperSize || "A4_landscape";
      if (permitBoxPosition) permitBoxPosition.value = state.permitInfo.boxPosition || "bottom-right";
    if (permitTileZoom) permitTileZoom.value = state.permitInfo.tileZoom || "17";
      const s = (state.permitInfo && state.permitInfo.scale) || 2500;
      if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm (1/${s} 余白10mm)`;
    } else {
      if (btnModeAd) btnModeAd.classList.add("active");
      if (btnModePermit) {
        btnModePermit.classList.remove("permit-active");
        btnModePermit.classList.remove("active");
      }
      if (inspectorPermit) inspectorPermit.style.display = "none";
      if (badgeScale) badgeScale.textContent = `${state.widthMm} × ${state.heightMm} mm`;
    }
  }

  syncPermitUI();
  syncAll();
});
