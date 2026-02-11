Module.register("MMM-SwedenMedals", {
  defaults: {
    updateInterval: 5 * 60 * 1000,
    maxMedals: 9
  },

  start() {
    this.dataResult = null;
    this.lastUpdated = null;
    this.sendSocketNotification("FETCH_MEDALS");
    setInterval(() => {
      this.sendSocketNotification("FETCH_MEDALS");
    }, this.config.updateInterval);
  },

  getStyles() {
    return ["MMM-SwedenMedals.css"];
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "MEDALS_DATA") {
      this.dataResult = payload;
      this.lastUpdated = new Date();
      this.updateDom(300);
    }
  },

  getDom() {
    const wrapper = document.createElement("div");
    wrapper.className = "MMM-SwedenMedals bottom-right";

    /* ===== CENTRERAD HEADER ===== */
    wrapper.innerHTML += `
      <div class="header">
        <span class="flag">🇸🇪</span>
        <span class="header-text">Sveriges medaljer</span>
      </div>
    `;

    if (!this.dataResult) {
      wrapper.innerHTML += `<div class="no-medals">Hämtar medaljer…</div>`;
      return wrapper;
    }

    wrapper.innerHTML += `
      <div class="totals-row">
        <img class="os-rings" src="modules/MMM-SwedenMedals/os-rings.png">
        <div class="medals">
          <span class="medal-gold">🥇 ${this.dataResult.totals.guld}</span>
          <span class="divider">│</span>
          <span class="medal-silver">🥈 ${this.dataResult.totals.silver}</span>
          <span class="divider">│</span>
          <span class="medal-bronze">🥉 ${this.dataResult.totals.brons}</span>
        </div>
      </div>
      <div class="separator"></div>
    `;

    const ul = document.createElement("ul");
    ul.className = "medal-list";

    this.dataResult.medalists
      .slice(0, this.config.maxMedals)
      .forEach(m => {
        const li = document.createElement("li");
        li.className =
          m.medal === "🥇" ? "pill medal-gold" :
          m.medal === "🥈" ? "pill medal-silver" :
          "pill medal-bronze";

        li.innerHTML = `
          <div class="medal-line">${m.medal}</div>
          <div class="names">
            ${m.names.map(n => `<div>${n}</div>`).join("")}
          </div>
          <div class="sport-text">${m.sport}</div>
        `;

        ul.appendChild(li);
      });

    wrapper.appendChild(ul);

    wrapper.innerHTML += `
      <div class="updated">
        Uppdaterad ${this.lastUpdated.toLocaleTimeString("sv-SE", {
          hour: "2-digit",
          minute: "2-digit"
        })}
      </div>
    `;

    return wrapper;
  }
});
