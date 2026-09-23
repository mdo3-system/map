// ==========================================
// state.js: 状態管理・データモデル・保存復元 (SRP)
// ==========================================

export class AppState {
  constructor() {
    this.mode = "select"; // select | dest | major_road | medium_road | minor_road | railway | route | poi | text | delete
    this.selectedId = null;
    this.selectedType = null; // landmark-icon | landmark-label | text | dest-icon | dest-label | road | rail | route

    this.dest = {
      lat: 35.90637,
      lon: 139.62550,
      name: "現地",
      labelOffsetX: 16,
      labelOffsetY: -24,
      fontSize: 14,
      rotation: 0,
      hasLeaderLine: false
    };

    this.frameCenter = { lat: 35.90637, lon: 139.62550 };
    this.widthMm = 80;
    this.heightMm = 50;
    this.viewRadiusM = 450;
    this.effectiveRadiusM = 450;
    this.transparentBg = false;
    this.showScale = true;
    this.showCompass = true;

    this.version = "v0.1.1";

    // 方位記号の位置・スケール・デザイン (circle_modern | circle_classic | arrow_simple | compass_rose | real_estate)
    this.compass = {
      x: null, // nullの場合は右上デフォルト
      y: null,
      scale: 1.0,
      design: "circle_modern"
    };

    // 線路モード (jr | private)
    this.railMode = "jr";

    this.roads = [];     // [{ id, type, points, casingColor, innerColor, filled, fillColor }]
    this.rails = [];     // [{ id, points, mode }]
    this.routes = [];    // [{ id, points }]
    this.landmarks = []; // [{ id, category, icon_type, name, lat, lon, labelOffsetX, labelOffsetY, fontSize, rotation, hasLeaderLine, iconScale }]
    this.texts = [];     // [{ id, text, lat, lon, fontSize, rotation, hasLeaderLine, leaderOffsetX, leaderOffsetY }]

    this.drawingPoints = [];
    this.activePolyline = null;
    this.history = [];
    this.zoom = 1.0;

    // SVGドラッグ状態
    this.isDraggingSvg = false;
    this.dragSvgTarget = null;
    this.dragSvgStart = { x: 0, y: 0 };
    this.elementSvgStart = { x: 0, y: 0 };
    this.hasMoved = false;

    // 道路スタイル初期設定
    this.roadCasingColor = "#666666";
    this.roadInnerColor = "#ffffff";
    this.roadFilled = false;
    this.roadFillColor = "#ffe066";
  }

  saveToHistory() {
    this.history.push({
      dest: JSON.parse(JSON.stringify(this.dest)),
      frameCenter: { ...this.frameCenter },
      widthMm: this.widthMm,
      heightMm: this.heightMm,
      compass: { ...this.compass },
      railMode: this.railMode,
      roads: JSON.parse(JSON.stringify(this.roads)),
      rails: JSON.parse(JSON.stringify(this.rails)),
      routes: JSON.parse(JSON.stringify(this.routes)),
      landmarks: JSON.parse(JSON.stringify(this.landmarks)),
      texts: JSON.parse(JSON.stringify(this.texts))
    });
    if (this.history.length > 25) this.history.shift();
  }

  undo() {
    if (this.history.length === 0) return false;
    const prev = this.history.pop();
    this.dest = prev.dest;
    this.frameCenter = prev.frameCenter;
    this.widthMm = prev.widthMm;
    this.heightMm = prev.heightMm;
    if (prev.compass) this.compass = prev.compass;
    if (prev.railMode) this.railMode = prev.railMode;
    this.roads = prev.roads || [];
    this.rails = prev.rails || [];
    this.routes = prev.routes || [];
    this.landmarks = prev.landmarks || [];
    this.texts = prev.texts || [];
    this.selectedId = null;
    this.selectedType = null;
    return true;
  }

  clearAll() {
    this.saveToHistory();
    this.roads = [];
    this.rails = [];
    this.routes = [];
    this.landmarks = [];
    this.texts = [];
    this.drawingPoints = [];
    this.selectedId = null;
    this.selectedType = null;
  }

  // 要素の検索 (型不一致に対処)
  findLandmark(id) {
    if (!id) return null;
    return this.landmarks.find(x => String(x.id) === String(id));
  }

  findText(id) {
    if (!id) return null;
    return this.texts.find(x => String(x.id) === String(id));
  }

  // 選択中要素のデータ取得
  getSelectedElementData() {
    if (!this.selectedId) return null;
    if (this.selectedId === "compass" || this.selectedType === "compass") {
      return { type: "compass", data: this.compass };
    }
    if (this.selectedId === "dest_pin" || this.selectedId === "dest_label" || this.selectedType === "dest-icon" || this.selectedType === "dest-label") {
      return { type: "dest", data: this.dest };
    }
    const landmark = this.findLandmark(this.selectedId);
    if (landmark) return { type: "landmark", data: landmark };

    const txt = this.findText(this.selectedId);
    if (txt) return { type: "text", data: txt };

    const road = this.roads.find(x => String(x.id) === String(this.selectedId));
    if (road) return { type: "road", data: road };

    const rail = this.rails.find(x => String(x.id) === String(this.selectedId));
    if (rail) return { type: "rail", data: rail };

    const route = this.routes.find(x => String(x.id) === String(this.selectedId));
    if (route) return { type: "route", data: route };

    return null;
  }

  // 要素の削除
  deleteElement(id, type) {
    this.saveToHistory();
    const strId = String(id);
    let deletedName = "";

    if (type === "text" || this.findText(strId)) {
      const t = this.findText(strId);
      deletedName = t ? t.text : "文字";
      this.texts = this.texts.filter(x => String(x.id) !== strId);
    } else if (type === "landmark-icon" || type === "landmark-label" || this.findLandmark(strId)) {
      const p = this.findLandmark(strId);
      deletedName = p ? p.name : "施設";
      this.landmarks = this.landmarks.filter(x => String(x.id) !== strId);
    } else if (this.roads.some(x => String(x.id) === strId)) {
      deletedName = "道路";
      this.roads = this.roads.filter(x => String(x.id) !== strId);
    } else if (this.rails.some(x => String(x.id) === strId)) {
      deletedName = "線路";
      this.rails = this.rails.filter(x => String(x.id) !== strId);
    } else if (this.routes.some(x => String(x.id) === strId)) {
      deletedName = "経路";
      this.routes = this.routes.filter(x => String(x.id) !== strId);
    }

    if (String(this.selectedId) === strId) {
      this.selectedId = null;
      this.selectedType = null;
    }
    return deletedName;
  }

  // JSON保存
  exportJson() {
    const data = {
      version: 3,
      dest: this.dest,
      frameCenter: this.frameCenter,
      widthMm: this.widthMm,
      heightMm: this.heightMm,
      viewRadiusM: this.viewRadiusM,
      effectiveRadiusM: this.effectiveRadiusM,
      transparentBg: this.transparentBg,
      showScale: this.showScale,
      showCompass: this.showCompass,
      compass: this.compass,
      railMode: this.railMode,
      roads: this.roads,
      rails: this.rails,
      routes: this.routes,
      landmarks: this.landmarks,
      texts: this.texts
    };
    return JSON.stringify(data, null, 2);
  }

  // JSON読み込み
  importJson(jsonString) {
    const data = JSON.parse(jsonString);
    this.saveToHistory();
    if (data.dest) this.dest = { ...this.dest, ...data.dest };
    if (data.frameCenter) this.frameCenter = { ...this.frameCenter, ...data.frameCenter };
    if (data.widthMm) this.widthMm = data.widthMm;
    if (data.heightMm) this.heightMm = data.heightMm;
    if (data.viewRadiusM) this.viewRadiusM = data.viewRadiusM;
    if (data.effectiveRadiusM) this.effectiveRadiusM = data.effectiveRadiusM;
    if (data.transparentBg !== undefined) this.transparentBg = data.transparentBg;
    if (data.showScale !== undefined) this.showScale = data.showScale;
    if (data.showCompass !== undefined) this.showCompass = data.showCompass;
    if (data.compass) this.compass = { ...this.compass, ...data.compass };
    if (data.railMode) this.railMode = data.railMode;
    this.roads = data.roads || [];
    this.rails = data.rails || [];
    this.routes = data.routes || [];
    this.landmarks = data.landmarks || [];
    this.texts = data.texts || [];
    this.selectedId = null;
    this.selectedType = null;
  }

  // localStorage への自動保存
  autoSave() {
    try {
      const data = {
        dest: this.dest,
        frameCenter: this.frameCenter,
        widthMm: this.widthMm,
        heightMm: this.heightMm,
        compass: this.compass,
        railMode: this.railMode,
        roads: this.roads,
        rails: this.rails,
        routes: this.routes,
        landmarks: this.landmarks,
        texts: this.texts
      };
      localStorage.setItem("annaizu_autosave_v3", JSON.stringify(data));
    } catch (e) { /* 容量オーバー時は無視 */ }
  }

  // localStorage からの復元
  restoreAutoSave() {
    try {
      const saved = localStorage.getItem("annaizu_autosave_v3") || localStorage.getItem("annaizu_autosave_v2");
      if (!saved) return false;
      const data = JSON.parse(saved);
      const hasContent = (data.roads && data.roads.length > 0) ||
                         (data.rails && data.rails.length > 0) ||
                         (data.routes && data.routes.length > 0) ||
                         (data.landmarks && data.landmarks.length > 0) ||
                         (data.texts && data.texts.length > 0);
      if (!hasContent) return false;
      if (data.dest) this.dest = { ...this.dest, ...data.dest };
      if (data.frameCenter) this.frameCenter = { ...this.frameCenter, ...data.frameCenter };
      if (data.widthMm) this.widthMm = data.widthMm;
      if (data.heightMm) this.heightMm = data.heightMm;
      if (data.compass) this.compass = { ...this.compass, ...data.compass };
      if (data.railMode) this.railMode = data.railMode;
      this.roads = data.roads || [];
      this.rails = data.rails || [];
      this.routes = data.routes || [];
      this.landmarks = data.landmarks || [];
      this.texts = data.texts || [];
      return true;
    } catch (e) {
      return false;
    }
  }
}
