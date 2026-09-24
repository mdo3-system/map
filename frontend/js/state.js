// ==========================================
// state.js: 状態管理・データモデル・保存復元 (SRP)
// ==========================================

export class AppState {
  constructor() {
    this.mode = "select"; // select | dest | major_road | medium_road | minor_road | railway | route | poi | text | lot | delete
    this.selectedId = null;
    this.selectedType = null; // landmark-icon | landmark-label | text | dest-icon | dest-label | road | rail | route | lot

    this.dest = {
      lat: 35.90637,
      lon: 139.62550,
      name: "現地",
      labelOffsetX: 16,
      labelOffsetY: -24,
      fontSize: 14,
      rotation: 0,
      hasLeaderLine: false,
      bgColor: "#d32f2f"
    };

    this.frameCenter = { lat: 35.90637, lon: 139.62550 };
    this.widthMm = 80;
    this.heightMm = 50;
    this.viewRadiusM = 450;
    this.effectiveRadiusM = 450;
    this.transparentBg = false;
    this.showScale = true;
    this.showCompass = true;

    this.version = typeof APP_VERSION !== "undefined" ? APP_VERSION : "v0.1.12";

    // 方位記号の位置・スケール・デザイン (circle_modern | circle_classic | arrow_simple | compass_rose | real_estate)
    this.compass = {
      x: null, // nullの場合は右上デフォルト
      y: null,
      scale: 1.0,
      design: "circle_modern"
    };

    // モード切替: "ad" (チラシ・Web用案内図) | "permit" (各種申請・1/2500見取図)
    this.appMode = "ad";

    // 各種申請用情報ボックス (表題欄) 設定
    this.permitInfo = {
      title: "付近見取図",
      lotNumber: "",         // 申請地 地名地番 (例: 埼玉県坂戸市大字西坂戸三丁目123番4)
      address: "",           // 住居表示 (例: 埼玉県坂戸市西坂戸三丁目5番12号)
      architectNo: "",       // 建築士登録番号 (例: 一級建築士 第123456号)
      architectName: "",     // 氏名
      scale: 2500,           // 縮尺 (2500)
      baseMapType: "pale",   // "pale"(淡色地図) | "blank"(白地図) | "std"(標準地図)
      paperSize: "A4_landscape", // "A4_landscape" | "A4_portrait" | "B5_landscape" | "B5_portrait" | "custom"
      marginMm: 10,          // 前後左右10mm余白
      boxPosition: "bottom-right", // "bottom-right" | "bottom-left" | "top-right"
      siteSymbol: "double_circle", // "double_circle"(赤二重丸) | "pin"(ピン) | "flag"(赤旗)
      applicant: ""          // 申請者名 (任意)
    };

    // 線路モード (jr | private)
    this.railMode = "jr";

    this.roads = [];     // [{ id, type, points, casingColor, innerColor, filled, fillColor }]
    this.rails = [];     // [{ id, points, mode }]
    this.routes = [];    // [{ id, points }]
    this.landmarks = []; // [{ id, category, icon_type, name, lat, lon, labelOffsetX, labelOffsetY, fontSize, rotation, hasLeaderLine, iconScale }]
    this.texts = [];     // [{ id, text, lat, lon, fontSize, rotation, hasLeaderLine, leaderOffsetX, leaderOffsetY }]
    this.lots = [];      // [{ id, points: [{lat, lon}], isSite: boolean, label: string, fillColor, strokeColor }]

    // モード別作図データの完全分離用スロット
    this.adScene = null;
    this.permitScene = null;

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
      appMode: this.appMode,
      dest: JSON.parse(JSON.stringify(this.dest)),
      frameCenter: { ...this.frameCenter },
      widthMm: this.widthMm,
      heightMm: this.heightMm,
      compass: { ...this.compass },
      railMode: this.railMode,
      permitInfo: JSON.parse(JSON.stringify(this.permitInfo)),
      roads: JSON.parse(JSON.stringify(this.roads)),
      rails: JSON.parse(JSON.stringify(this.rails)),
      routes: JSON.parse(JSON.stringify(this.routes)),
      landmarks: JSON.parse(JSON.stringify(this.landmarks)),
      texts: JSON.parse(JSON.stringify(this.texts)),
      lots: JSON.parse(JSON.stringify(this.lots))
    });
    if (this.history.length > 25) this.history.shift();
  }

  undo() {
    if (this.history.length === 0) return false;
    const prev = this.history.pop();
    if (prev.appMode) this.appMode = prev.appMode;
    this.dest = prev.dest;
    this.frameCenter = prev.frameCenter;
    this.widthMm = prev.widthMm;
    this.heightMm = prev.heightMm;
    if (prev.compass) this.compass = prev.compass;
    if (prev.railMode) this.railMode = prev.railMode;
    if (prev.permitInfo) this.permitInfo = prev.permitInfo;
    this.roads = prev.roads || [];
    this.rails = prev.rails || [];
    this.routes = prev.routes || [];
    this.landmarks = prev.landmarks || [];
    this.texts = prev.texts || [];
    this.lots = prev.lots || [];
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
    this.lots = [];
    this.drawingPoints = [];
    this.selectedId = null;
    this.selectedType = null;
  }

  /**
   * 案内図作図モードと各種申請作図モードの完全分離スワップ
   */
  switchAppMode(newMode) {
    if (this.appMode === newMode) return;

    // 1. 現在のモードのデータを退避
    if (this.appMode === "ad") {
      this.adScene = {
        dest: JSON.parse(JSON.stringify(this.dest)),
        frameCenter: { ...this.frameCenter },
        widthMm: this.widthMm,
        heightMm: this.heightMm,
        viewRadiusM: this.viewRadiusM,
        effectiveRadiusM: this.effectiveRadiusM,
        transparentBg: this.transparentBg,
        showScale: this.showScale,
        showCompass: this.showCompass,
        compass: { ...this.compass },
        railMode: this.railMode,
        roads: JSON.parse(JSON.stringify(this.roads)),
        rails: JSON.parse(JSON.stringify(this.rails)),
        routes: JSON.parse(JSON.stringify(this.routes)),
        landmarks: JSON.parse(JSON.stringify(this.landmarks)),
        texts: JSON.parse(JSON.stringify(this.texts))
      };
    } else if (this.appMode === "permit") {
      this.permitScene = {
        dest: JSON.parse(JSON.stringify(this.dest)),
        frameCenter: { ...this.frameCenter },
        widthMm: this.widthMm,
        heightMm: this.heightMm,
        viewRadiusM: this.viewRadiusM,
        effectiveRadiusM: this.effectiveRadiusM,
        transparentBg: this.transparentBg,
        showScale: this.showScale,
        showCompass: this.showCompass,
        compass: { ...this.compass },
        permitInfo: JSON.parse(JSON.stringify(this.permitInfo)),
        lots: JSON.parse(JSON.stringify(this.lots)),
        landmarks: JSON.parse(JSON.stringify(this.landmarks)),
        texts: JSON.parse(JSON.stringify(this.texts))
      };
    }

    this.appMode = newMode;

    // 2. 切り替え先モードのデータを復元
    if (newMode === "ad") {
      const s = this.adScene;
      if (s) {
        this.dest = s.dest;
        this.frameCenter = s.frameCenter;
        this.widthMm = s.widthMm;
        this.heightMm = s.heightMm;
        this.viewRadiusM = s.viewRadiusM;
        this.effectiveRadiusM = s.effectiveRadiusM;
        this.transparentBg = s.transparentBg;
        this.showScale = s.showScale;
        this.showCompass = s.showCompass;
        this.compass = s.compass;
        this.railMode = s.railMode || "jr";
        this.roads = s.roads || [];
        this.rails = s.rails || [];
        this.routes = s.routes || [];
        this.landmarks = s.landmarks || [];
        this.texts = s.texts || [];
      } else {
        // デフォルト初期値
        this.widthMm = 80;
        this.heightMm = 50;
        this.effectiveRadiusM = 450;
        this.roads = [];
        this.rails = [];
        this.routes = [];
        this.landmarks = [];
        this.texts = [];
      }
      this.lots = []; // 案内図モードでは区画データは表示しない
    } else if (newMode === "permit") {
      const s = this.permitScene;
      if (s) {
        this.dest = s.dest;
        this.frameCenter = s.frameCenter;
        this.widthMm = s.widthMm;
        this.heightMm = s.heightMm;
        this.viewRadiusM = s.viewRadiusM;
        this.effectiveRadiusM = s.effectiveRadiusM;
        this.transparentBg = s.transparentBg;
        this.showScale = s.showScale;
        this.showCompass = s.showCompass;
        this.compass = s.compass;
        this.permitInfo = s.permitInfo;
        this.lots = s.lots || [];
        this.landmarks = s.landmarks || [];
        this.texts = s.texts || [];
      } else {
        // 各種申請の初期値 (A4横 297x210, 縮尺1/2500)
        this.widthMm = 297;
        this.heightMm = 210;
        this.permitInfo.paperSize = "A4_landscape";
        this.dest.name = "申請地";
        this.lots = [];
        this.landmarks = [];
        this.texts = [];
      }
      // 各種申請モードでは道路・線路・経路などの案内図用レイヤーは非表示（空）
      this.roads = [];
      this.rails = [];
      this.routes = [];
    }

    this.selectedId = null;
    this.selectedType = null;
    this.drawingPoints = [];
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

  findLot(id) {
    if (!id) return null;
    return this.lots.find(x => String(x.id) === String(id));
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

    const lot = this.findLot(this.selectedId);
    if (lot) return { type: "lot", data: lot };

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
    const strId = String(id).replace("label_", "").replace("icon_", "");
    let deletedName = "";

    // テキスト・ラベルのみの削除
    if (type === "landmark-label") {
      const p = this.findLandmark(strId);
      if (p) {
        deletedName = `${p.name || '施設'}の文字`;
        p.name = ""; // テキストのみ削除し、アイコン記号はそのまま残す
      }
    } else if (type === "dest-label") {
      deletedName = this.appMode === "permit" ? "申請地プレート" : "目的地プレート";
      this.dest.name = "";
    } else if (type === "text" || this.findText(strId)) {
      const t = this.findText(strId);
      deletedName = t ? t.text : "文字";
      this.texts = this.texts.filter(x => String(x.id) !== strId);
    } else if (type === "lot" || this.findLot(strId)) {
      const l = this.findLot(strId);
      deletedName = l ? (l.label || "区画") : "区画";
      this.lots = this.lots.filter(x => String(x.id) !== strId);
    } else if (type === "landmark-icon" || this.findLandmark(strId)) {
      const p = this.findLandmark(strId);
      deletedName = p ? (p.name || "施設") : "施設";
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

    if (String(this.selectedId) === strId || String(this.selectedId) === String(id)) {
      this.selectedId = null;
      this.selectedType = null;
    }
    return deletedName;
  }

  // JSON保存
  exportJson() {
    // 現在のモード状態をスロットに最新同期
    if (this.appMode === "ad") {
      this.adScene = {
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
    } else {
      this.permitScene = {
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
        permitInfo: this.permitInfo,
        lots: this.lots,
        landmarks: this.landmarks,
        texts: this.texts
      };
    }

    const data = {
      version: 5,
      appMode: this.appMode,
      adScene: this.adScene,
      permitScene: this.permitScene,
      permitInfo: this.permitInfo,
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
      texts: this.texts,
      lots: this.lots
    };
    return JSON.stringify(data, null, 2);
  }

  // JSON読み込み
  importJson(jsonString) {
    const data = JSON.parse(jsonString);
    this.saveToHistory();

    if (data.adScene) this.adScene = data.adScene;
    if (data.permitScene) this.permitScene = data.permitScene;

    if (data.appMode) this.appMode = data.appMode;
    if (data.permitInfo) this.permitInfo = { ...this.permitInfo, ...data.permitInfo };
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
    this.lots = data.lots || [];

    this.selectedId = null;
    this.selectedType = null;
  }

  // ローカルストレージ自動保存
  autoSave() {
    try {
      const json = this.exportJson();
      localStorage.setItem("annaizu_autosave_v3", json);
    } catch (e) {
      console.warn("AutoSave failed:", e);
    }
  }

  // 自動保存からの復元
  restoreAutoSave() {
    try {
      const saved = localStorage.getItem("annaizu_autosave_v3");
      if (saved) {
        this.importJson(saved);
        return true;
      }
    } catch (e) {
      console.warn("RestoreAutoSave failed:", e);
    }
    return false;
  }
}
