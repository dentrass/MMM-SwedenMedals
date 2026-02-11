const NodeHelper = require("node_helper");
const axios = require("axios");
const cheerio = require("cheerio");

/* =========================
   ÖVERSÄTTNING TILL SVENSKA
   ========================= */
function translateEvent(text) {
  let t = text;

  const map = [
    [/Cross-country skiing/gi, "Längdskidor"],
    [/Biathlon/gi, "Skidskytte"],
    [/Alpine skiing/gi, "Alpint"],
    [/Ski jumping/gi, "Backhoppning"],
    [/Nordic combined/gi, "Nordisk kombination"],
    [/Freestyle skiing/gi, "Freestyle"],
    [/Snowboarding/gi, "Snowboard"],
    [/Speed skating/gi, "Skridsko"],
    [/Short track speed skating/gi, "Short track"],
    [/Figure skating/gi, "Konståkning"],
    [/Ice hockey/gi, "Ishockey"],
    [/Curling/gi, "Curling"],
    [/Bobsleigh/gi, "Bob"],
    [/Skeleton/gi, "Skeleton"],
    [/Luge/gi, "Rodel"]
  ];

  map.forEach(([regex, sv]) => {
    t = t.replace(regex, sv);
  });

  return t
    .replace(/\bMen's\b/gi, "herrar")
    .replace(/\bWomen's\b/gi, "damer")
    .replace(/\bMixed\b/gi, "mix")
    .replace(/\s+-\s+/g, " – ")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================
   RENSNING AV NAMN (RADBRYT)
   ========================= */
function splitNames(raw) {
  if (!raw) return [];

  // Ta bort Sweden
  const cleaned = raw.replace(/\bSweden\b/gi, "").trim();

  // Matcha fullständiga namn
  const names = cleaned.match(
    /[A-ZÅÄÖ][a-zåäöéè\-]+ [A-ZÅÄÖ][a-zåäöéè\-]+/g
  );

  return names || [];
}

module.exports = NodeHelper.create({

  async socketNotificationReceived(notification) {
    if (notification !== "FETCH_MEDALS") return;

    const data = {
      totals: { guld: 0, silver: 0, brons: 0 },
      medalists: []
    };

    try {
      const url =
        "https://en.wikipedia.org/wiki/List_of_2026_Winter_Olympics_medal_winners";

      const res = await axios.get(url, {
        headers: { "User-Agent": "MagicMirror" },
        timeout: 15000
      });

      const $ = cheerio.load(res.data);

      $("table.wikitable tbody tr").each((_, row) => {
        const cells = $(row).find("td");
        if (cells.length < 4) return;

        const event = translateEvent(
          cells.eq(0)
            .clone()
            .find("a")
            .remove()
            .end()
            .text()
            .replace(/\s+/g, " ")
            .trim()
        );

        const medalMap = [
          { idx: 1, medal: "🥇" },
          { idx: 2, medal: "🥈" },
          { idx: 3, medal: "🥉" }
        ];

        medalMap.forEach(({ idx, medal }) => {
          const cell = cells.eq(idx);

          const isSweden =
            cell.find('img[src*="Flag_of_Sweden.svg"]').length > 0 ||
            cell.find('img[alt="Sweden"]').length > 0 ||
            cell.find('a[title="Sweden"]').length > 0;

          if (!isSweden) return;

          const rawText = cell
            .clone()
            .find("img, span.flagicon")
            .remove()
            .end()
            .text();

          const persons = splitNames(rawText);
          if (persons.length === 0) return;

          if (medal === "🥇") data.totals.guld++;
          if (medal === "🥈") data.totals.silver++;
          if (medal === "🥉") data.totals.brons++;

          data.medalists.push({
            medal,
            names: persons,
            sport: event
          });
        });
      });

    } catch (err) {
      console.error("MMM-SwedenMedals ERROR:", err.message);
    }

    this.sendSocketNotification("MEDALS_DATA", data);
  }
});
