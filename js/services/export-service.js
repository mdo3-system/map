// ==========================================
// export-service.js: 図面出力サービス (SRP)
// 責務: SVG, PNG, PDF のファイル生成・ダウンロード処理のみを担当
// ==========================================

export class ExportService {
  /**
   * SVGファイルをダウンロード
   */
  static exportSvg(svgEl, state) {
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgString = '<?xml version="1.0" encoding="UTF-8"?>\n' + serializer.serializeToString(svgEl);
    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const prefix = state.appMode === "permit" ? "見取図" : "案内図";
    a.download = `${prefix}_${state.dest.name || "物件"}_${state.widthMm}x${state.heightMm}mm.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * PNG高解像度画像をダウンロード (デフォルト350dpi相当: scale=3.5)
   */
  static exportPng(svgEl, state, scale = 3.5) {
    return new Promise((resolve, reject) => {
      if (!svgEl) return reject(new Error("SVG要素が見つかりません"));
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgEl);
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        try {
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
          const prefix = state.appMode === "permit" ? "見取図" : "案内図";
          a.download = `${prefix}_${state.dest.name || "物件"}_高解像度.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          resolve();
        } catch (e) {
          reject(e);
        }
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("SVG画像の読み込みに失敗しました"));
      };
      img.src = url;
    });
  }

  /**
   * 高精細PDFを直接ダウンロード (jsPDF使用、未ロード時はwindow.printフォールバック)
   */
  static async exportPdf(svgEl, state, scale = 3.5) {
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
      return fileTitle;
    }

    // jsPDF未読込時は印刷ダイアログ
    window.print();
    return null;
  }
}
