/**
 * Avatar Utilities & Config
 * Manages player profile picture (PFP) avatars from public/PFP Avatars/
 */

// Available avatar filenames located in public/PFP Avatars/
export const AVAILABLE_AVATARS = [
  'frame_001.png',
  'frame_002.png',
  'frame_003.png',
  'frame_004.png',
  'frame_005.png',
  'frame_006.png',
  'frame_007.png',
  'frame_008.png',
  'frame_009.png',
  'frame_010.png',
  'frame_011.png',
  'frame_012.png',
  'frame_013.png',
  'frame_014.png',
  'frame_015.png',
  'frame_016.png',
  'frame_017.png',
  'frame_018.png',
  'frame_019.png',
  'frame_020.png',
];

export const DEFAULT_AVATAR = 'frame_001.png';

/**
 * Returns clean web URL for an avatar ID or filename.
 * Handles paths like 'frame_001.png', '/PFP Avatars/frame_001.png', or legacy IDs.
 */
export function getAvatarUrl(avatarId) {
  const rawBase = import.meta.env?.BASE_URL || '/';
  const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

  if (!avatarId) {
    return encodeURI(`${base}PFP Avatars/${DEFAULT_AVATAR}`);
  }

  // Already a full path or data URI
  if (avatarId.startsWith('http://') || avatarId.startsWith('https://') || avatarId.startsWith('data:')) {
    return avatarId;
  }

  // If already prefixed with /PFP Avatars/ or PFP Avatars/
  if (avatarId.includes('PFP Avatars/')) {
    const filename = avatarId.split('PFP Avatars/').pop();
    return encodeURI(`${base}PFP Avatars/${filename}`);
  }

  // If matches one of the frame filenames directly
  if (avatarId.endsWith('.png') || avatarId.endsWith('.jpg') || avatarId.endsWith('.webp')) {
    return encodeURI(`${base}PFP Avatars/${avatarId}`);
  }

  // If frame number format like 'frame_001' without extension
  if (/^frame_\d+$/i.test(avatarId)) {
    return encodeURI(`${base}PFP Avatars/${avatarId}.png`);
  }

  // Fallback to default
  return encodeURI(`${base}PFP Avatars/${DEFAULT_AVATAR}`);
}
