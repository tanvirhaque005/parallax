import rawData from "./movies_data_for_shelf.js";
let dateData = rawData.map(({ id, title, director, year, depicted, rating, tropes, location, blurb, color }) => ({
  id: id,
  label: title,
  start: depicted,
  end: year,
}));
// console.log(dateData)
export default dateData