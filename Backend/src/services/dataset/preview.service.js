function getPreviewRows(rows, { page = 1, limit = 20, search = '', sortColumn = '', sortOrder = 'asc' }) {
  let filtered = [...rows];

  if (search) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(row =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchLower)
      )
    );
  }

  if (sortColumn && filtered.length > 0 && sortColumn in filtered[0]) {
    const sanitizedOrder = sortOrder.toUpperCase() === 'DESC' ? -1 : 1;
    filtered.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * sanitizedOrder;
      }
      return String(aVal).localeCompare(String(bVal)) * sanitizedOrder;
    });
  }

  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedRows = filtered.slice(startIndex, startIndex + limit);

  return {
    rows: paginatedRows,
    total,
    page,
    limit,
    totalPages
  };
}

module.exports = { getPreviewRows };