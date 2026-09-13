interface LoadingSpinnerProps {
  message?: string;
}

export default function LoadingSpinner({ message = 'Memuat data...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-[#FB5EA8]" />
      <p className="mt-3 text-sm text-gray-400">{message}</p>
    </div>
  );
}
