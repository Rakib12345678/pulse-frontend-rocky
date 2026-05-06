import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Trash2 } from "lucide-react"
import { useAuthStore } from "@/features/auth/stores/authStore"
import { useCurrentUser } from "@/features/profile/services/profile.service"

export const AccountSuspendedModal = () => {
  const showSuspendedModal = useAuthStore((s) => s.showSuspendedModal)
  const setShowSuspendedModal = useAuthStore((s) => s.setShowSuspendedModal)

  useCurrentUser()

  const handleDismiss = () => {
    setShowSuspendedModal(false)
  }

  return (
    <Dialog open={showSuspendedModal} onOpenChange={handleDismiss}>
      <DialogContent
        showCloseButton={false}
        className="sm:max-w-lg bg-[#1A1C1E] border border-white/10 rounded-2xl p-8"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex flex-col items-center text-center gap-6">

          {/* Icon */}
          <div className="bg-[#121314] p-5 rounded-full">
            <Trash2 className="w-14 h-14 text-red-500" />
          </div>

          {/* Text */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Account Suspended
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Your account has been suspended due to policy violations.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full pt-4 flex-col sm:flex-row">
            <a
              href="mailto:support@pulselive.com"
              className="
      w-full sm:flex-1 text-center
      py-2.5 sm:py-3
      px-4 sm:px-6
      rounded-lg sm:rounded-full
      font-semibold
      bg-[#FF7A00] text-black
      hover:bg-[#ff922e]
      transition
    "
            >
              Contact Support
            </a>

            <button
              onClick={handleDismiss}
              className="
      w-full sm:flex-1
      py-2.5 sm:py-3
      px-4 sm:px-6
      rounded-lg sm:rounded-full
      font-semibold
      border-2 border-[#FF7A00]
      text-[#FF7A00]
      hover:bg-white/5
      transition
    "
            >
              Cancel
            </button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}