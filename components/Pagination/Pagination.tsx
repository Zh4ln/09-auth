"use client";

import ReactPaginateImport from "react-paginate";
import css from "./Pagination.module.css";

// react-paginate 8 is packaged as CommonJS and may expose its component under .default.
// Normalize both module shapes so React always receives a component function.
const ReactPaginate =
  (ReactPaginateImport as unknown as { default?: typeof ReactPaginateImport })
    .default ?? ReactPaginateImport;

interface PaginationProps {
  pageCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  pageCount,
  currentPage,
  onPageChange,
}: PaginationProps) {
  return (
    <ReactPaginate
      previousLabel="←"
      nextLabel="→"
      breakLabel="…"
      pageCount={pageCount}
      forcePage={currentPage - 1}
      onPageChange={({ selected }) => onPageChange(selected + 1)}
      pageRangeDisplayed={3}
      marginPagesDisplayed={1}
      containerClassName={css.pagination}
      pageClassName={css.page}
      pageLinkClassName={css.pageLink}
      previousClassName={css.page}
      previousLinkClassName={css.pageLink}
      nextClassName={css.page}
      nextLinkClassName={css.pageLink}
      breakClassName={css.page}
      breakLinkClassName={css.pageLink}
      activeClassName={css.active}
      disabledClassName={css.disabled}
      renderOnZeroPageCount={null}
    />
  );
}
