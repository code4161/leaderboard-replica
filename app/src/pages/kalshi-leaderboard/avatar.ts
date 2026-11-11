// Page-local copy of the avatar URL helper (the shared one in lib/avatar.ts is being written elsewhere; merge afterwards).
// X profile images are served through the site's own avatar route at a fixed size; anything else is used as given.
const X_AVATAR = /^https:\/\/pbs\.twimg\.com\/profile_images\/(\d+)\/([\w-]+?)(?:_(?:normal|bigger|mini|400x400|200x200))?\.(\w+)$/;

function sized(url: string, size: string): string {
  const m = url.match(X_AVATAR);
  return m ? `/api/x-avatar/${m[1]}/${m[2]}_${size}.${m[3]}` : url;
}

export const smallAvatar = (url: string): string => sized(url, "bigger");
export const largeAvatar = (url: string): string => sized(url, "400x400");
