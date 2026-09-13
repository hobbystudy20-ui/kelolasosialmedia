import { Pencil, Trash2, Copy } from 'lucide-react';

interface RowActionsProps {
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}

export default function RowActions({ onEdit, onDelete, onDuplicate }: RowActionsProps) {
  return (
    <div className="flex items-center gap-1">
      {onEdit && (
        <button
          onClick={onEdit}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-[#FB5EA8] transition-colors"
          title="Edit"
        >
          <Pencil size={16} />
        </button>
      )}
      {onDuplicate && (
        <button
          onClick={onDuplicate}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-500 transition-colors"
          title="Duplikat"
        >
          <Copy size={16} />
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-500 transition-colors"
          title="Hapus"
        >
          <Trash2 size={16} />
        </button>
      )}
    </div>
  );
}
