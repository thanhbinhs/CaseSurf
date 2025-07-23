import { useState, useEffect, useCallback } from 'react';

// Custom hook để quản lý việc hiển thị dữ liệu theo từng trang
export function useInfiniteScroll<T>(items: T[], itemsPerPage: number = 20) {
    const [page, setPage] = useState(1);
    const [visibleItems, setVisibleItems] = useState<T[]>(() => items.slice(0, itemsPerPage));

    // Cập nhật lại visibleItems khi danh sách gốc (đã lọc/sắp xếp) thay đổi
    useEffect(() => {
        setPage(1); // Reset lại trang về 1
        setVisibleItems(items.slice(0, itemsPerPage));
    }, [items, itemsPerPage]);

    const loadMoreItems = useCallback(() => {
        const nextPage = page + 1;
        const newItems = items.slice(0, nextPage * itemsPerPage);
        setVisibleItems(newItems);
        setPage(nextPage);
    }, [page, items, itemsPerPage]);

    const hasMore = visibleItems.length < items.length;

    return { visibleItems, loadMoreItems, hasMore };
}