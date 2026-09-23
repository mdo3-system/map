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
        // テキストやラベル、目的地、施設がクリック選択された場合、プロパティモーダルを直接表示
        if (sel && ["text", "landmark", "dest"].includes(sel.type)) {
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
      if (sel && ["dest", "landmark", "text"].includes(sel.type)) {
        openPropertyModal(sel);
      } else {
        handleEditNameDialog(id, type);
      }
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

        if (sel.type === "dest") {
          selectedBadge.textContent = "目的地";
          inspectorName.value = sel.data.name || "現地";
          inspectorFontSizeSlider.value = sel.data.fontSize || 14;
          inspectorFontSizeVal.textContent = `${sel.data.fontSize || 14}px`;
          inspectorRotationSlider.value = sel.data.rotation || 0;
          inspectorRotationVal.textContent = `${sel.data.rotation || 0}°`;
          inspectorLeaderLine.checked = !!sel.data.hasLeaderLine;
          inspectorLeaderLineLabel.style.display = "flex";
          btnInspectorDelete.style.display = "none"; // 目的地ピン本体は全消去以外削除不可
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
      titleText = "目的地（ピン・プレート）設定";
      badgeText = "目的地";
      currentText = sel.data.name || "現地";
      fontSize = sel.data.fontSize || 14;
      rotation = sel.data.rotation || 0;
      modalIconScaleGroup.style.display = "none";
      modalPlateBgGroup.style.display = "flex";
      modalPlateBgColor.value = sel.data.bgColor || "#d32f2f";
      btnModalClearText.style.display = "inline-flex";
      btnModalDelete.style.display = "none";
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
    }
    renderSvg();
  });

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
    dest: "💡 【目的地ピン】左の地図で物件の場所をクリックして配置（案内図上でピンと文字プレートを別々に移動可）",
    major_road: "💡 【大通り (太)】クリック連打で国道・幹線道路を描画、ダブルクリックで完了",
    medium_road: "💡 【一般道 (中)】クリック連打で主要道路・県道を描画、ダブルクリックで完了",
    minor_road: "💡 【細道 (小)】クリック連打で細道・生活道路を描画、ダブルクリックで完了",
    railway: "💡 【線路】クリックで線路をつなぎ、ダブルクリックで完了（JR風枕木パターン）",
    route: "💡 【経路 (赤点線)】クリック連打でアクセス経路を描画、ダブルクリックで完了",
    poi: "💡 【施設配置】置きたい場所をクリックして配置（右の完成図でアイコンと文字を別々にドラッグ移動可）",
    text: "💡 【文字配置】置きたい場所をクリック（線路先の「至 坂戸駅」や道路通称「鉄砲道」など）",
    delete: "💡 【削除ツール】削除したい施設・文字・道路・線路をクリックすると一撃で消去されます"
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
      fontSize: 12,
      rotation: 0,
      hasLeaderLine: false
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

  function finishCurrentDrawing() {
    if (state.drawingPoints.length >= 2) {
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

  inputWidthMm.addEventListener("change", () => {
    state.widthMm = parseFloat(inputWidthMm.value) || 80;
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

  async function searchAddress() {
    const q = inputAddress.value.trim();
    if (!q) return;

    try {
      const res = await fetch("/api/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: q })
      });
      if (!res.ok) throw new Error("住所が見つかりませんでした");
      const d = await res.json();
      state.saveToHistory();

      // 新規作図のため要素クリア
      state.roads = [];
      state.rails = [];
      state.routes = [];
      state.landmarks = [];
      state.texts = [];
      state.drawingPoints = [];

      state.dest.lat = d.lat;
      state.dest.lon = d.lon;
      state.dest.name = (inputDestName ? inputDestName.value.trim() : "") || "現地";
      state.frameCenter.lat = d.lat;
      state.frameCenter.lon = d.lon;
      state.viewRadiusM = 450;
      state.effectiveRadiusM = 450;

      mapTrace.map.setView([d.lat, d.lon], 16);
      mapTrace.destMarker.setLatLng([d.lat, d.lon]);
      mapTrace.frameCenterMarker.setLatLng([d.lat, d.lon]);
      mapTrace.updateDestPinIcon();
      syncAll();
      showToast(`「${q}」を表示しました`);
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
    if (confirm("描画したすべての道路、線路、施設、文字を削除してリセットしますか？")) {
      state.clearAll();
      syncAll();
      showToast("すべての作図を消去しました", true);
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

  setMode("select"); // デフォルトは安全な選択ツール
  syncAll();
});
