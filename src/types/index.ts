// ============================================================
// TYPE DEFINITIONS
// ============================================================
// Cloudinary folder structure:
//   Jewellery/          ← ROOT
//     Anklets/          ← Category
//       Adjustable Anklets/  ← Product
//         photo1.jpg
//
// On each Cloudinary resource:
//   public_id    = "cover_dpocvu"           (bare filename)
//   asset_folder = "Jewellery/Anklets/Adjustable Anklets"

export interface CloudinaryImage {
  publicId: string;
  alt:      string;
  width?:   number;
  height?:  number;
  format?:  string;
}

export interface CloudinaryVideo {
  publicId: string;
  title?:   string;
}

// One Product = one subfolder e.g. "Adjustable Anklets"
export interface Product {
  id:           string;   // "anklets--adjustable-anklets"
  productName:  string;   // "Adjustable Anklets"
  categoryId:   string;   // "anklets"
  categoryName: string;   // "Anklets"
  folderPath:   string;   // "Jewellery/Anklets/Adjustable Anklets"
  images:       CloudinaryImage[];
  videos:       CloudinaryVideo[];
  description?: string;
  featured?:    boolean;
  tags?:        string[];
}

// One Category = one subfolder of Jewellery/
export interface Category {
  id:         string;   // "anklets"
  name:       string;   // "Anklets"
  folderPath: string;   // "Jewellery/Anklets"
  products:   Product[];
}

export interface Catalog {
  categories: Category[];
  fetchedAt:  string;
}

export interface CloudinaryTransformOptions {
  width?:       number;
  height?:      number;
  quality?:     'auto' | 'auto:best' | 'auto:eco' | number;
  format?:      'auto' | 'webp' | 'jpg' | 'png';
  crop?:        'fill' | 'fit' | 'scale' | 'thumb' | 'crop';
  gravity?:     'auto' | 'center' | 'face';
  aspectRatio?: string;
  blur?:        number;
}

// Keyed by product id e.g. "anklets--adjustable-anklets"
export interface ProductOverride {
  description?: string;
  featured?:    boolean;
  tags?:        string[];
}
