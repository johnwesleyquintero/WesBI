import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from './Icons';
import { useAppContext } from '../state/appContext';

interface PaginationProps {
    totalPages: number;
}

const Pagination: React.FC<PaginationProps> = ({ totalPages }) => {
    const { state, dispatch } = useAppContext();
    const { currentPage, itemsPerPage } = state;
    
    const onPageChange = (page: number) => {
        dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    };

    const onItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_ITEMS_PER_PAGE', payload: Number(e.target.value) });
    };

    if (totalPages <= 1) return null;

    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    let startPage = Math.max(1, currentPage - halfPagesToShow);
    let endPage = Math.min(totalPages, currentPage + halfPagesToShow);

    if (currentPage <= halfPagesToShow) {
        endPage = Math.min(totalPages, maxPagesToShow);
    }
    if (currentPage + halfPagesToShow >= totalPages) {
        startPage = Math.max(1, totalPages - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
    }

    const renderPageButton = (page: number | '...', key: string | number) => {
        const isActive = page === currentPage;
        const isDisabled = page === '...';
        return (
            <button
                key={key}
                onClick={() => typeof page === 'number' && onPageChange(page)}
                disabled={isDisabled}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                    isActive ? 'bg-[#9c4dff] text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                } ${isDisabled ? 'cursor-default' : ''}`}
            >
                {page}
            </button>
        );
    };

    return (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-gray-50 border-t border-gray-200">
             <div className="flex items-center gap-2">
                <label htmlFor="items-per-page" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                    Rows per page:
                </label>
                <select
                    id="items-per-page"
                    value={itemsPerPage}
                    onChange={onItemsPerPageChange}
                    className="p-1.5 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#9c4dff] focus:outline-none bg-white"
                    aria-label="Select number of rows per page"
                >
                    <option value={30}>30</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                </select>
            </div>
            <div className="flex justify-center items-center gap-2 flex-wrap">
                <button 
                    onClick={() => onPageChange(currentPage - 1)} 
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-1" />
                    Prev
                </button>
                
                {startPage > 1 && renderPageButton(1, 1)}
                {startPage > 2 && renderPageButton('...', 'start-ellipsis')}
                
                {pageNumbers.map(num => renderPageButton(num, num))}

                {endPage < totalPages - 1 && renderPageButton('...', 'end-ellipsis')}
                {endPage < totalPages && renderPageButton(totalPages, totalPages)}
                
                <button 
                    onClick={() => onPageChange(currentPage + 1)} 
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
                >
                    Next
                    <ArrowRightIcon className="w-4 h-4 ml-1" />
                </button>
            </div>
        </div>
    );
};

export default Pagination;