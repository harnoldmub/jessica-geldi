import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

type GalleryItem = {
  src: string;
  alt: string;
  caption: string;
};

type GalleryLightboxProps = {
  item: GalleryItem | null;
  onClose: () => void;
};

export default function GalleryLightbox({ item, onClose }: GalleryLightboxProps) {
  return (
    <AnimatePresence>
      {item ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#120d0a]/88 px-6 py-8 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center border border-white/20 bg-white/10 text-white transition-colors hover:bg-white hover:text-foreground"
            aria-label="Fermer la galerie"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <X className="h-5 w-5" strokeWidth={1.6} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={item.src}
              alt={item.alt}
              className="max-h-[78vh] w-full object-cover shadow-2xl"
            />
            <div className="border border-t-0 border-white/12 bg-white/8 p-6 text-white">
              <p className="text-[10px] uppercase tracking-[0.45em] text-white/60">
                Laeticia & Maxime
              </p>
              <p className="mt-3 font-serif text-2xl">{item.caption}</p>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
