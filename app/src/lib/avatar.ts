// Avatar URL helpers. X (Twitter) profile images are served through the API's resizing route,
// and avatars the API hosts itself are addressed relative to this site so they go through its proxy.
const X_PROFILE_IMAGE = /^https:\/\/pbs\.twimg\.com\/profile_images\/(\d+)\/([\w-]+?)(?:_(?:normal|bigger|mini|400x400|200x200))?\.(\w+)$/;
const UPSTREAM_API = /^https:\/\/(?:www\.)?predicting\.top(\/api\/.*)$/;

export type XAvatarSize = "bigger" | "400x400";

export function avatarUrl(url: string, size: XAvatarSize): string {
  const x = url.match(X_PROFILE_IMAGE);
  if (x) return `/api/x-avatar/${x[1]}/${x[2]}_${size}.${x[3]}`;
  const own = url.match(UPSTREAM_API);
  return own ? own[1] : url;
}

/** 73px variant, for table rows. */
export function smallAvatar(url: string): string {
  return avatarUrl(url, "bigger");
}

/** 400px variant, for profile headers. */
export function largeAvatar(url: string): string {
  return avatarUrl(url, "400x400");
}

/** The letter shown when a trader has no picture or the picture fails to load. */
export function avatarInitial(name: string | null | undefined): string {
  return name?.charAt(0).toUpperCase() || "?";
}
