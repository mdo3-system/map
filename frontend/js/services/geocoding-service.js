// ==========================================
// geocoding-service.js: 住所検索・ジオコーディングサービス (SRP)
// 責務: 住所文字列から緯度経度への多段階フォールバック解決のみを担当
// ==========================================

export class GeocodingService {
  /**
   * 住所・地番文字列から緯度経度を解決
   * @param {string} rawAddress 検索文字列
   * @returns {Promise<{lat: number, lon: number, source: string}>}
   */
  static async search(rawAddress) {
    const q = (rawAddress || "").trim();
    if (!q) {
      throw new Error("検索住所が指定されていません");
    }

    let lat = null;
    let lon = null;
    let source = "";

    // 1. 自前バックエンドAPI (もしあれば)
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
          source = "backend";
        }
      }
    } catch (backendErr) {
      // フォールバックへ移行
    }

    // 2. 国土地理院 API (完全一致)
    if (lat === null || lon === null) {
      try {
        const gsiRes = await fetch(`https://msearch.gsi.go.jp/address-search/AddressSearch?q=${encodeURIComponent(q)}`);
        if (gsiRes.ok) {
          const gsiData = await gsiRes.json();
          if (gsiData && gsiData.length > 0 && gsiData[0].geometry) {
            lon = gsiData[0].geometry.coordinates[0];
            lat = gsiData[0].geometry.coordinates[1];
            source = "gsi-exact";
          }
        }
      } catch (e) {
        console.warn("GSI exact geocode failed:", e);
      }
    }

    // 3. 国土地理院 API (枝番・号除去による丁目・字レベルの段階的フォールバック)
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
              source = "gsi-simplified";
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
            source = "nominatim";
          }
        }
      } catch (e) {
        console.warn("Nominatim geocode failed:", e);
      }
    }

    if (lat === null || lon === null) {
      throw new Error(`該当の住所「${q}」が見つかりませんでした。番地までで検索するか、地図上で目的地を手動指定してください。`);
    }

    return { lat, lon, source };
  }
}
