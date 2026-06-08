// Platform-agnostic unique id generator. crypto.randomUUID is available in
// both modern browsers and the desktop webview, so this stays portable.
export function newId(): string {
  return crypto.randomUUID();
}
