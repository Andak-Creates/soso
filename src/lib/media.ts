/**
 * Optimizes Cloudinary URLs with automatic format and quality.
 */
export function getOptimizedImageUrl(url: string | null, width?: number) {
  if (!url) return null;

  // Don't treat video files as images
  const lowerUrl = url.toLowerCase();
  if (
    lowerUrl.endsWith('.mp4') ||
    lowerUrl.endsWith('.mov') ||
    lowerUrl.endsWith('.webm') ||
    lowerUrl.includes('/video/upload/')
  ) {
    return null;
  }
  
  // If it's not a Cloudinary URL, return as is
  if (!url.includes('res.cloudinary.com')) return url;

  // Add f_auto (auto format) and q_auto (auto quality)
  // Also add width if provided
  const transformation = width ? `f_auto,q_auto,w_${width}` : 'f_auto,q_auto';
  
  // Cloudinary URLs look like: https://res.cloudinary.com/cloud_name/image/upload/v123/path
  // We want to insert the transformation after /upload/
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/${transformation}/`);
  }
  
  return url;
}
