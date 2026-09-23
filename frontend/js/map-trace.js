// ==========================================
// map-trace.js: 左画面 Leaflet 地図トレース制御 (SRP)
// ==========================================

export class MapTraceController {
  constructor(mapContainerId, state, callbacks) {
    this.state = state;
    this.callbacks = callbacks || {}; // { onStateChange, onElementSelect, onDeleteElement }

    // Leaflet 地図初期化
    this.map = L.map(mapContainerId, {
      center: [state.frameCenter.lat, state.frameCenter.lon],
      zoom: 16,
      zoomControl: true
    });

    // タイルレイヤー
    this.tileLayers = {
      satellite: L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg", {
        attribution: "国土地理院(航空写真)",
        maxZoom: 18
      }),
      osm: L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19
      })
    };
    this.tileLayers.satellite.addTo(this.map);

    L.control.layers({
      "航空写真 (国土地理院)": this.tileLayers.satellite,
      "標準地図 (OSM)": this.tileLayers.osm
    }, null, { position: "topright" }).addTo(this.map);

    // 描画済みレイヤーグループ
    this.drawnLayersGroup = L.layerGroup().addTo(this.map);

    // 枠中心マーカー（ドラッグで作図枠をパン）
    const centerIcon = L.divIcon({
      html: `<div style="background: rgba(37,99,235,0.9); color: white; border: 2px solid white; border-radius: 12px; padding: 2px 8px; font-size: 10px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.4); cursor: move;" title="ドラッグで作図エリアを移動">✥ 作図枠中心</div>`,
      iconAnchor: [38, 12],
      className: "center-handle"
    });
    this.frameCenterMarker = L.marker([state.frameCenter.lat, state.frameCenter.lon], {
      icon: centerIcon,
      draggable: true
    }).addTo(this.map);

    this.frameCenterMarker.on("drag", (e) => {
      const p = e.target.getLatLng();
      this.state.frameCenter.lat = p.lat;
      this.state.frameCenter.lon = p.lng;
      this.updateFramingRectangle();
      if (this.callbacks.onStateChange) this.callbacks.onStateChange();
    });

    // 目的地ピンマーカー
    this.destMarker = L.marker([state.dest.lat, state.dest.lon], {
      draggable: true,
      zIndexOffset: 1000
    }).addTo(this.map);

    this.updateDestPinIcon();

    this.destMarker.on("dragend", (e) => {
      const p = e.target.getLatLng();
      this.state.dest.lat = p.lat;
      this.state.dest.lon = p.lng;
      if (this.callbacks.onStateChange) this.callbacks.onStateChange();
    });

    this.destMarker.on("click", (e) => {
      L.DomEvent.stop(e);
      if (this.state.mode === "delete") {
        return; // 目的地は削除不可
      }
      if (this.callbacks.onElementSelect) {
        this.callbacks.onElementSelect("dest_pin", "dest-icon");
      }
    });

    this.framingRectangle = null;
    this.updateFramingRectangle();
  }

  updateDestPinIcon() {
    const destName = this.state.dest.name || "現地";
    const destIcon = L.divIcon({
      html: `
        <div style="display:flex; align-items:center; cursor:move;" title="ドラッグで移動・クリックで選択">
          <div style="background:#dc2626; color:white; width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 5px rgba(0,0,0,0.5); font-size:12px;">📍</div>
          <div style="background:#dc2626; color:white; border:2px solid white; border-radius:4px; padding:1px 6px; font-size:11px; font-weight:bold; white-space:nowrap; margin-left:-4px; box-shadow:0 2px 5px rgba(0,0,0,0.4);">${destName}</div>
        </div>
      `,
      iconAnchor: [11, 22],
      className: "custom-dest-pin"
    });
    this.destMarker.setIcon(destIcon);
  }

  updateFramingRectangle() {
    const aspect = this.state.heightMm / this.state.widthMm;
    const r = this.state.effectiveRadiusM || this.state.viewRadiusM;
    const rangeX = r;
    const rangeY = r * aspect;

    const mPerLat = 111132.0;
    const mPerLon = 111319.5 * Math.cos(this.state.frameCenter.lat * Math.PI / 180.0);

    const dLat = rangeY / mPerLat;
    const dLon = rangeX / mPerLon;

    const southWest = L.latLng(this.state.frameCenter.lat - dLat, this.state.frameCenter.lon - dLon);
    const northEast = L.latLng(this.state.frameCenter.lat + dLat, this.state.frameCenter.lon + dLon);
    const bounds = L.latLngBounds(southWest, northEast);

    if (this.framingRectangle) {
      this.framingRectangle.setBounds(bounds);
    } else {
      this.framingRectangle = L.rectangle(bounds, {
        className: "framing-rectangle",
        color: "#2563eb",
        weight: 2,
        dashArray: "5, 5",
        fill: false,
        interactive: false
      }).addTo(this.map);
    }
  }

  syncDrawnLayers() {
    this.drawnLayersGroup.clearLayers();

    // 1. 道路
    this.state.roads.forEach(r => {
      const isMajor = r.type === "major";
      const isMedium = r.type === "medium";
      const color = isMajor ? "#ff9800" : isMedium ? "#3b82f6" : "#ffffff";
      const weight = isMajor ? 7 : isMedium ? 5 : 3.5;

      const poly = L.polyline(r.points, {
        color: color,
        weight: weight,
        opacity: 0.9,
        lineCap: "round",
        lineJoin: "round",
        interactive: true
      }).addTo(this.drawnLayersGroup);

      poly.on("click", (ev) => {
        L.DomEvent.stop(ev);
        if (this.state.mode === "delete") {
          if (this.callbacks.onDeleteElement) this.callbacks.onDeleteElement(r.id, "road");
        } else {
          if (this.callbacks.onElementSelect) this.callbacks.onElementSelect(r.id, "road");
        }
      });
    });

    // 2. 鉄道
    this.state.rails.forEach(r => {
      const poly = L.polyline(r.points, {
        color: "#222222",
        weight: 5,
        dashArray: "6, 6",
        interactive: true
      }).addTo(this.drawnLayersGroup);

      poly.on("click", (ev) => {
        L.DomEvent.stop(ev);
        if (this.state.mode === "delete") {
          if (this.callbacks.onDeleteElement) this.callbacks.onDeleteElement(r.id, "rail");
        } else {
          if (this.callbacks.onElementSelect) this.callbacks.onElementSelect(r.id, "rail");
        }
      });
    });

    // 3. 経路（赤点線）
    this.state.routes.forEach(r => {
      const poly = L.polyline(r.points, {
        color: "#e53935",
        weight: 4,
        dashArray: "8, 5",
        lineCap: "round",
        interactive: true
      }).addTo(this.drawnLayersGroup);

      poly.on("click", (ev) => {
        L.DomEvent.stop(ev);
        if (this.state.mode === "delete") {
          if (this.callbacks.onDeleteElement) this.callbacks.onDeleteElement(r.id, "route");
        } else {
          if (this.callbacks.onElementSelect) this.callbacks.onElementSelect(r.id, "route");
        }
      });
    });

    // 4. 施設マーカー
    this.state.landmarks.forEach(p => {
      const isStation = (p.category === "station" || p.icon_type === "station");
      const isSignal = (p.icon_type === "signal" || p.category === "signal");
      const isSuper = (p.icon_type === "supermarket" || p.category === "supermarket");

      let iconHtml = "";
      let iconAnchor = [15, 12];

      if (isStation) {
        iconHtml = `<div style="background: #1e3a8a; color: white; border: 2px solid white; padding: 2px 8px; font-size: 11px; font-weight: bold; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.5); cursor: move;">🚉 ${p.name}</div>`;
        iconAnchor = [35, 12];
      } else if (isSignal) {
        iconHtml = `
          <div style="display:inline-flex; align-items:center; gap:2.5px; background:#111827; border:1.5px solid #ffffff; border-radius:4px; padding:2px 5px; box-shadow:0 2px 5px rgba(0,0,0,0.5); cursor: move;">
            <span style="width:7px; height:7px; border-radius:50%; background:#00e676; display:inline-block;"></span>
            <span style="width:7px; height:7px; border-radius:50%; background:#ffd600; display:inline-block;"></span>
            <span style="width:7px; height:7px; border-radius:50%; background:#ff1744; display:inline-block;"></span>
            <span style="margin-left:3px; color:#ffffff; font-size:10.5px; font-weight:bold; white-space:nowrap;">${p.name}</span>
          </div>
        `;
        iconAnchor = [20, 11];
      } else if (isSuper) {
        iconHtml = `<div style="background: #2e7d32; color: white; border: 1.5px solid white; border-radius: 4px; padding: 2px 6px; font-size: 11px; white-space: nowrap; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.4); cursor: move;">🛒 ${p.name}</div>`;
      } else {
        const iconSymbol = p.icon_type === "fuel" ? "⛽" : p.icon_type === "post_office" ? "📮" : p.icon_type === "school" ? "🏫" : p.icon_type === "hospital" ? "🏥" : "🏪";
        iconHtml = `<div style="background: white; border: 1.5px solid #333; border-radius: 4px; padding: 2px 5px; font-size: 11px; white-space: nowrap; font-weight: bold; box-shadow: 0 1px 3px rgba(0,0,0,0.3); cursor: move;">${iconSymbol} ${p.name}</div>`;
      }

      const icon = L.divIcon({
        html: iconHtml,
        iconAnchor: iconAnchor,
        className: "custom-poi-pin"
      });

      const m = L.marker([p.lat, p.lon], { icon, interactive: true, draggable: true });

      m.on("dragend", (ev) => {
        const pos = ev.target.getLatLng();
        p.lat = pos.lat;
        p.lon = pos.lng;
        if (this.callbacks.onStateChange) this.callbacks.onStateChange();
      });

      m.on("click", (ev) => {
        L.DomEvent.stop(ev);
        if (this.state.mode === "delete") {
          if (this.callbacks.onDeleteElement) this.callbacks.onDeleteElement(p.id, "landmark-icon");
        } else {
          if (this.callbacks.onElementSelect) this.callbacks.onElementSelect(p.id, "landmark-icon");
        }
      });

      m.on("contextmenu", (ev) => {
        L.DomEvent.stop(ev);
        if (this.callbacks.onDeleteElement) this.callbacks.onDeleteElement(p.id, "landmark-icon");
      });

      m.addTo(this.drawnLayersGroup);
    });

    // 5. テキストマーカー (削除モードでも確実に反応するようイベント統一)
    this.state.texts.forEach(t => {
      const icon = L.divIcon({
        html: `<div style="background: rgba(255,255,255,0.95); border: 1.5px solid #333; border-radius: 3px; padding: 1px 6px; font-size: 11px; font-weight: bold; white-space: nowrap; box-shadow: 0 1px 4px rgba(0,0,0,0.3); cursor: move;">${t.text}</div>`,
        iconAnchor: [20, 10],
        className: "custom-text-pin"
      });

      const m = L.marker([t.lat, t.lon], { icon, interactive: true, draggable: true });

      m.on("dragend", (ev) => {
        const pos = ev.target.getLatLng();
        t.lat = pos.lat;
        t.lon = pos.lng;
        if (this.callbacks.onStateChange) this.callbacks.onStateChange();
      });

      m.on("click", (ev) => {
        L.DomEvent.stop(ev);
        if (this.state.mode === "delete") {
          if (this.callbacks.onDeleteElement) this.callbacks.onDeleteElement(t.id, "text");
        } else {
          if (this.callbacks.onElementSelect) this.callbacks.onElementSelect(t.id, "text");
        }
      });

      m.on("contextmenu", (ev) => {
        L.DomEvent.stop(ev);
        if (this.callbacks.onDeleteElement) this.callbacks.onDeleteElement(t.id, "text");
      });

      m.addTo(this.drawnLayersGroup);
    });
  }
}
