const MONTHS = [
  ["01", "January"], ["02", "February"], ["03", "March"],
  ["04", "April"], ["05", "May"], ["06", "June"],
  ["07", "July"], ["08", "August"], ["09", "September"],
  ["10", "October"], ["11", "November"], ["12", "December"],
];

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: CURRENT_YEAR - 1990 + 1 }, (_, index) => CURRENT_YEAR - index);

// A select-based picker keeps the date range consistent across browsers and
// avoids the browser-native month picker limiting selectable years.
export default function MonthYearPicker({ value = "", onChange, disabled = false, className = "" }) {
  const [year = "", month = ""] = value.split("-");
  const update = (nextYear, nextMonth) => onChange?.(nextYear && nextMonth ? `${nextYear}-${nextMonth}` : "");

  return (
    <div className="grid grid-cols-2 gap-2">
      <select value={month} disabled={disabled} onChange={(e) => update(year, e.target.value)} className={className}>
        <option value="">Month</option>
        {MONTHS.map(([number, label]) => <option key={number} value={number}>{label}</option>)}
      </select>
      <select value={year} disabled={disabled} onChange={(e) => update(e.target.value, month)} className={className}>
        <option value="">Year</option>
        {YEARS.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}
