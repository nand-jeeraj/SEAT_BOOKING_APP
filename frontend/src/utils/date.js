import moment from 'moment'

export function toIST(dateInput) {
  if (!dateInput) return null;

 
  const d = dateInput instanceof Date ? new Date(dateInput) : new Date(dateInput);
  if (isNaN(d)) return null;


  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = utc + 5.5 * 60 * 60000;
  return new Date(ist);
}

export function formatIndianTime(dateInput) {
  // const d = toIST(dateInput);
  if (!dateInput) return "";

  // const d = new Date(dateInput)

  // const day = String(d.getDate()).padStart(2, "0");
  // // const month = d.toLocaleString("en-IN", { month: "short" });
  // const month = d.getMonth();
  // const year = d.getFullYear();

  // let hours = d.getHours();
  // const minutes = String(d.getMinutes()).padStart(2, "0");
  // const ampm = hours >= 12 ? "PM" : "AM";
  // hours = hours % 12 || 12;

  return `${moment(dateInput).format('DD-MM-YYYY hh:mm A')} (IST)`;
}
