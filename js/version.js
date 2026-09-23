/**
 * スマート案内図エディタ バージョン一元管理ファイル
 * 
 * 【バージョン更新履歴】
 * - v0.1.11: 1/2500国土地理院白図による確認申請添付図面(付近見取図)作図機能(地名地番・住居表示表題欄・モード切替)新設
 * - v0.1.10: マニュアルページ(manual.html)の縦スクロールバグ修正(style.css依存解除とoverflow-y解放)
 * - v0.1.9: 実例「住ま居る」案内図に基づく完全図解マニュアル(manual.html / MANUAL.md)の再構築
 * - v0.1.8: 操作マニュアル(manual.html)のWeb公開およびヘッダー「📖 マニュアル」閲覧ボタン新設
 * - v0.1.7: Surface Pro 7および中画面幅(1280px〜1400px)向けヘッダーレイアウト最適化(画像保存ボタンの画面内収束対応)
 * - v0.1.6: map.mdo3.com直下URLアクセス対応(ルート直下配置)およびNginx配信最適化
 * - v0.1.5: Xserver本番同期規約(DEPLOY_RULES.md)策定、version.jsによるバージョン一元管理化、map.mdo3.comルート自動転送対応
 * - v0.1.4: 道路・線路の流心なぞり描き(トレース)の詳述、Xserver静的ホスティング対応(国土地理院API直叩きフォールバック)
 * - v0.1.3: マニュアル(MANUAL.md)作成、実画面キャプチャ配置
 * - v0.1.2: カギ型引き出し線両端ドラッグ、色ピッカー、駅名引き出し線、施設テキスト分離
 * - v0.1.1: 方位5種デザイン、施設記号スライダー、プロパティモーダル、GitHub連携
 */
const APP_VERSION = "v0.1.11";

if (typeof window !== "undefined") {
  window.APP_VERSION = APP_VERSION;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { APP_VERSION };
}
