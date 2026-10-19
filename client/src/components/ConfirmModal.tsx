import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";

/*
 * Fenêtre de confirmation de l'admin. Ne jamais utiliser window.confirm / alert / prompt :
 * toute action sensible (suppression, réinitialisation, répartition) passe par cette modale.
 */
export type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

export default function ConfirmModal({
  request,
  pending = false,
  onClose,
}: {
  request: ConfirmRequest | null;
  pending?: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-w-md rounded-3xl border-0 p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.35)]">
        {request && (
          <>
            <DialogTitle className="text-xl font-semibold">{request.title}</DialogTitle>
            <DialogDescription className="mt-2 text-[14px] leading-6 text-foreground/65">{request.description}</DialogDescription>
            <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={pending}
                className="h-11 rounded-full bg-[#f3f3f4] px-6 text-[14px] font-medium hover:bg-[#ebebec] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                autoFocus
                disabled={pending}
                onClick={() => {
                  request.onConfirm();
                  onClose();
                }}
                className={`inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14px] font-medium text-white disabled:opacity-50 ${
                  request.danger ? "bg-rose-700 hover:bg-rose-800" : "bg-admin hover:bg-admin/90"
                }`}
              >
                {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                {request.confirmLabel}
              </button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
