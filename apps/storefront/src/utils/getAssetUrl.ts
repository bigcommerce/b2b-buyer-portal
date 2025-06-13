export const getAssetUrl = (assetName: string) => new URL(assetName, import.meta.url).href;
