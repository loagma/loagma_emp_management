import { useState } from "react";
import Modal from "./Modal";
import Textarea from "../ui/form/Textarea";
import Button from "../ui/Button";

export default function PauseTaskModal({ isOpen, onClose, onConfirm, taskTitle }) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason("");
      onClose();
    } catch (error) {
      console.error("Failed to pause task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setReason("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal onClose={handleClose} title="Pause Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-4">
            You are about to pause: <span className="font-semibold text-gray-800">{taskTitle}</span>
          </p>
          
          <Textarea
            label="Reason for Pausing"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please provide a reason for pausing this task..."
            rows={4}
            required
          />
          
          <p className="text-xs text-gray-500 mt-2">
            💡 This reason will be logged and visible to managers
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting || !reason.trim()}
          >
            {isSubmitting ? "Pausing..." : "Pause Task"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
