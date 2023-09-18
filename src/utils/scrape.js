const axios = require("axios");
const cheerio = require("cheerio");

const fetchRadio = async (page = 0) => {
  const BASE_URL = `https://onlineradiobox.com/id/?p=${page}`;

  let arr = [];

  const radio = await axios.get(BASE_URL);
  const $ = cheerio.load(radio.data);

  $("#stations")
    .find(".stations__station")
    .each((i, el) => {
      const findStation = $(el).find(".station_play");

      const getRadioName = $(el).find(".station__title__name").text();
      const getRadioId = $(el).attr("radioid");
      const getRadioStream = findStation.attr("stream");
      const getRadioImg = findStation.attr("radioimg");

      const radioObjects = {
        nativeRadioName: getRadioName,
        radioName: getRadioName.toLowerCase().replace(/ /g, "_"),
        radioId: getRadioId,
        streamURL: getRadioStream,
        radioImg: "https:" + getRadioImg,
      };

      arr.push(radioObjects);
    });

  return arr;
};

module.exports = { fetchRadio };
