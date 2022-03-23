function verifyUrlIsValid(url: string): boolean {
  return !!(
    url &&
    url.includes("://") &&
    (url.includes("http") ||
      url.includes("https") ||
      url.includes("ws") ||
      url.includes("wss"))
  );
}

export { verifyUrlIsValid };
