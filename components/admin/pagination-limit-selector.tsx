'use client';

import { useRouter, useSearchParams } from 'next/navigation';

interface PaginationLimitSelectorProps {
  currentLimit: number;
}

export function PaginationLimitSelector({ currentLimit }: PaginationLimitSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleLimitChange = (newLimit: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('limit', newLimit);
    params.set('page', '1'); // Reset to first page when changing limit
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Afficher:</span>
      <select
        value={currentLimit}
        onChange={(e) => handleLimitChange(e.target.value)}
        className="px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="5">5</option>
        <option value="10">10</option>
        <option value="20">20</option>
        <option value="50">50</option>
      </select>
    </div>
  );
}
