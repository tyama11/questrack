/**
 * デスクトップ (Tauri) 実行時のみ、GitHub Releases の latest.json を参照して
 * アプリの自動アップデートを確認する。ブラウザ / Pages ビルドでは何もしない。
 */
export async function checkForAppUpdate(): Promise<void> {
  if (typeof window === 'undefined' || !('__TAURI_INTERNALS__' in window)) {
    return;
  }
  try {
    const { check } = await import('@tauri-apps/plugin-updater');
    const update = await check();
    if (!update) return;

    const ok = window.confirm(
      `新しいバージョン ${update.version} が利用可能です（現在: ${update.currentVersion}）。\n今すぐダウンロードしてインストールしますか？`
    );
    if (!ok) return;

    await update.downloadAndInstall();
    const { relaunch } = await import('@tauri-apps/plugin-process');
    await relaunch();
  } catch (err) {
    console.warn('アップデートの確認に失敗しました:', err);
  }
}
