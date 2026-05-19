(function () {
  const appShell = document.querySelector(".app-shell");
  const mapElement = document.getElementById("map");
  const statusElement = document.getElementById("mapStatus");
  const legendElement = document.getElementById("legend");
  const selectionTitle = document.getElementById("selectionTitle");
  const selectionSubtitle = document.getElementById("selectionSubtitle");
  const detailsList = document.getElementById("detailsList");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchMessage = document.getElementById("searchMessage");
  const searchResults = document.getElementById("searchResults");
  const includeMicroInput = document.getElementById("includeMicro");
  const panelToggle = document.getElementById("panelToggle");
  const basemapButton = document.getElementById("basemapButton");

  if (!window.L || !window.L.esri) {
    mapElement.innerHTML =
      '<div class="library-error"><p>Map libraries could not load. Start a local server and make sure this browser can reach unpkg.com and Census TIGERweb.</p></div>';
    statusElement.textContent = "Map libraries unavailable.";
    return;
  }

  const CURRENT_WMS =
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer";
  const SQ_METERS_PER_SQ_MILE = 2589988.110336;
  const US_STATE_CODES = [
    "01",
    "02",
    "04",
    "05",
    "06",
    "08",
    "09",
    "10",
    "11",
    "12",
    "13",
    "15",
    "16",
    "17",
    "18",
    "19",
    "20",
    "21",
    "22",
    "23",
    "24",
    "25",
    "26",
    "27",
    "28",
    "29",
    "30",
    "31",
    "32",
    "33",
    "34",
    "35",
    "36",
    "37",
    "38",
    "39",
    "40",
    "41",
    "42",
    "44",
    "45",
    "46",
    "47",
    "48",
    "49",
    "50",
    "51",
    "53",
    "54",
    "55",
    "56",
  ];
  const US_STATE_WHERE = `STATE IN (${US_STATE_CODES.map((code) => `'${code}'`).join(",")})`;
  const STATE_ABBR = {
    "01": "AL",
    "02": "AK",
    "04": "AZ",
    "05": "AR",
    "06": "CA",
    "08": "CO",
    "09": "CT",
    "10": "DE",
    "11": "DC",
    "12": "FL",
    "13": "GA",
    "15": "HI",
    "16": "ID",
    "17": "IL",
    "18": "IN",
    "19": "IA",
    "20": "KS",
    "21": "KY",
    "22": "LA",
    "23": "ME",
    "24": "MD",
    "25": "MA",
    "26": "MI",
    "27": "MN",
    "28": "MS",
    "29": "MO",
    "30": "MT",
    "31": "NE",
    "32": "NV",
    "33": "NH",
    "34": "NJ",
    "35": "NM",
    "36": "NY",
    "37": "NC",
    "38": "ND",
    "39": "OH",
    "40": "OK",
    "41": "OR",
    "42": "PA",
    "44": "RI",
    "45": "SC",
    "46": "SD",
    "47": "TN",
    "48": "TX",
    "49": "UT",
    "50": "VT",
    "51": "VA",
    "53": "WA",
    "54": "WV",
    "55": "WI",
    "56": "WY",
  };
  const numberFormatter = new Intl.NumberFormat("en-US");

  const STYLE = {
    states: {
      color: "#276ef1",
      weight: 1.7,
      opacity: 0.95,
      fillColor: "#dceaff",
      fillOpacity: 0.42,
    },
    counties: {
      color: "#2f7d51",
      weight: 0.75,
      opacity: 0.9,
      fillColor: "#e4f3e8",
      fillOpacity: 0.36,
    },
    metro: {
      color: "#b85c22",
      weight: 1.35,
      opacity: 0.96,
      fillColor: "#f4bd7c",
      fillOpacity: 0.32,
    },
    micro: {
      color: "#73518b",
      weight: 1.15,
      opacity: 0.92,
      dashArray: "5 4",
      fillColor: "#e8d7f0",
      fillOpacity: 0.24,
    },
  };

  const DATASETS = {
    states: {
      mode: "states",
      key: "states",
      label: "States",
      singular: "State",
      layerId: 80,
      url: `${CURRENT_WMS}/80`,
      where: US_STATE_WHERE,
      idField: "GEOID",
      idLength: 2,
      style: STYLE.states,
      fitMaxZoom: 6,
      legend: "State boundary",
      searchAbbreviation: true,
    },
    counties: {
      mode: "counties",
      key: "counties",
      label: "Counties",
      singular: "County",
      layerId: 82,
      url: `${CURRENT_WMS}/82`,
      where: US_STATE_WHERE,
      idField: "GEOID",
      idLength: 5,
      style: STYLE.counties,
      fitMaxZoom: 9,
      legend: "County or equivalent",
    },
    metro: {
      mode: "metros",
      key: "metro",
      label: "Metropolitan Statistical Areas",
      singular: "Metropolitan Statistical Area",
      layerId: 93,
      url: `${CURRENT_WMS}/93`,
      where: "1=1",
      idField: "CBSA",
      idLength: 5,
      style: STYLE.metro,
      fitMaxZoom: 8,
      legend: "MSA boundary",
    },
    micro: {
      mode: "metros",
      key: "micro",
      label: "Micropolitan Statistical Areas",
      singular: "Micropolitan Statistical Area",
      layerId: 91,
      url: `${CURRENT_WMS}/91`,
      where: "1=1",
      idField: "CBSA",
      idLength: 5,
      style: STYLE.micro,
      fitMaxZoom: 8,
      legend: "Micropolitan boundary",
    },
  };

  let currentMode = "states";
  let activeLayers = [];
  let highlightLayer = null;
  let locateMarker = null;

  const map = L.map("map", {
    center: [39.5, -98.35],
    zoom: getHomeZoom(),
    minZoom: 3,
    maxZoom: 13,
    zoomControl: false,
    preferCanvas: true,
  });

  const basemapLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap contributors",
  }).addTo(map);

  map.setMaxBounds(
    L.latLngBounds(
      L.latLng(14.5, -179.9),
      L.latLng(72.5, -52.0),
    ).pad(0.12),
  );

  wireControls();
  refreshIcons();
  setMode("states");
  updateCounts();

  function wireControls() {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    includeMicroInput.addEventListener("change", () => {
      if (currentMode === "metros") {
        rebuildActiveLayers();
        clearSearch();
        clearSelection();
        updateLegend();
      }
    });

    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      runSearch(searchInput.value);
    });

    document.getElementById("homeButton").addEventListener("click", () => {
      map.flyTo([39.5, -98.35], getHomeZoom(), { duration: 0.35 });
    });

    document.getElementById("zoomInButton").addEventListener("click", () => map.zoomIn());
    document.getElementById("zoomOutButton").addEventListener("click", () => map.zoomOut());
    document.getElementById("locateButton").addEventListener("click", locateUser);

    basemapButton.addEventListener("click", () => {
      const visible = map.hasLayer(basemapLayer);
      if (visible) {
        map.removeLayer(basemapLayer);
      } else {
        basemapLayer.addTo(map);
      }
      basemapButton.setAttribute("aria-pressed", String(!visible));
      setStatus(!visible ? "Basemap visible." : "Basemap hidden.");
    });

    panelToggle.addEventListener("click", () => {
      appShell.classList.toggle("panel-collapsed");
      const collapsed = appShell.classList.contains("panel-collapsed");
      panelToggle.innerHTML = `<i data-lucide="${collapsed ? "panel-left-open" : "panel-left-close"}"></i>`;
      refreshIcons();
      window.setTimeout(() => map.invalidateSize(), 190);
    });

    map.on("locationfound", (event) => {
      if (locateMarker) {
        map.removeLayer(locateMarker);
      }
      locateMarker = L.circleMarker(event.latlng, {
        radius: 8,
        color: "#0f6bff",
        weight: 3,
        fillColor: "#ffffff",
        fillOpacity: 0.95,
      }).addTo(map);
      setStatus("Location found.");
    });

    map.on("locationerror", (event) => {
      setStatus(event.message || "Location unavailable.");
    });
  }

  function setMode(mode) {
    currentMode = mode;
    document.querySelectorAll("[data-mode]").forEach((button) => {
      const active = button.dataset.mode === mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const microEnabled = mode === "metros";
    includeMicroInput.disabled = !microEnabled;
    includeMicroInput.closest(".toggle").classList.toggle("is-disabled", !microEnabled);

    rebuildActiveLayers();
    clearSearch();
    clearSelection();
    updateLegend();
  }

  function rebuildActiveLayers() {
    activeLayers.forEach((layer) => map.removeLayer(layer));
    activeLayers = [];

    const configs = getVisibleConfigs();
    setStatus(`Loading ${getVisibleLabel()}...`);
    configs.forEach((config) => {
      const layer = createBoundaryLayer(config);
      activeLayers.push(layer);
      layer.addTo(map);
    });
  }

  function createBoundaryLayer(config) {
    const layer = L.esri.featureLayer({
      url: config.url,
      where: config.where,
      fields: ["*"],
      simplifyFactor: 0.4,
      precision: 5,
      style: () => ({ ...config.style }),
    });

    layer.on("createfeature", (event) => {
      const featureLayer = event.layer;
      const name = getFeatureName(event.feature.properties);

      featureLayer.bindTooltip(name, {
        className: "boundary-tooltip",
        direction: "top",
        opacity: 0.95,
        sticky: true,
      });

      featureLayer.on("mouseover", () => {
        featureLayer.setStyle(getHoverStyle(config));
        featureLayer.bringToFront();
      });

      featureLayer.on("mouseout", () => {
        featureLayer.setStyle({ ...config.style });
      });

      featureLayer.on("click", () => {
        selectFeature(event.feature, config, { fit: false });
      });
    });

    layer.on("load", () => {
      setStatus(`${getVisibleLabel()} ready. Click a boundary for details.`);
    });

    layer.on("requesterror", () => {
      setStatus(`Could not load ${config.label}. Check the Census TIGERweb connection.`);
    });

    return layer;
  }

  function getHoverStyle(config) {
    return {
      ...config.style,
      color: "#171a21",
      weight: Math.max(config.style.weight * 1.8, 2.2),
      fillOpacity: Math.min((config.style.fillOpacity || 0.25) + 0.14, 0.62),
    };
  }

  function getVisibleConfigs() {
    if (currentMode === "states") {
      return [DATASETS.states];
    }
    if (currentMode === "counties") {
      return [DATASETS.counties];
    }
    return includeMicroInput.checked ? [DATASETS.metro, DATASETS.micro] : [DATASETS.metro];
  }

  function getSearchConfigs() {
    return getVisibleConfigs();
  }

  function getVisibleLabel() {
    if (currentMode === "metros" && includeMicroInput.checked) {
      return "MSA and micropolitan layers";
    }
    return getVisibleConfigs()[0].label;
  }

  async function updateCounts() {
    const countTargets = [
      ["stateCount", DATASETS.states],
      ["countyCount", DATASETS.counties],
      ["metroCount", DATASETS.metro],
      ["microCount", DATASETS.micro],
    ];

    await Promise.all(
      countTargets.map(async ([elementId, config]) => {
        const element = document.getElementById(elementId);
        try {
          const count = await fetchCount(config);
          element.textContent = numberFormatter.format(count);
        } catch (error) {
          element.textContent = "--";
        }
      }),
    );
  }

  async function fetchCount(config) {
    const data = await arcgisQuery(config.url, {
      f: "json",
      where: config.where,
      returnCountOnly: "true",
    });
    return Number(data.count || 0);
  }

  async function runSearch(rawQuery) {
    const query = rawQuery.trim();
    clearSearch();

    if (!query) {
      searchMessage.textContent = "Enter a name, abbreviation, GEOID, or CBSA code.";
      return;
    }

    setStatus(`Searching ${getVisibleLabel()}...`);
    searchMessage.textContent = "Searching...";

    const settled = await Promise.allSettled(
      getSearchConfigs().map((config) => searchDataset(config, query)),
    );

    const results = settled
      .filter((item) => item.status === "fulfilled")
      .flatMap((item) => item.value)
      .slice(0, 12);
    const failed = settled.some((item) => item.status === "rejected");

    renderSearchResults(results);
    if (results.length) {
      searchMessage.textContent = `${numberFormatter.format(results.length)} result${results.length === 1 ? "" : "s"}.`;
      setStatus("Search complete.");
      return;
    }

    searchMessage.textContent = failed
      ? "Search failed for one or more layers."
      : "No matches in the active layer.";
    setStatus(searchMessage.textContent);
  }

  async function searchDataset(config, query) {
    const where = buildSearchWhere(config, query);
    const data = await arcgisQuery(config.url, {
      f: "geojson",
      where,
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      orderByFields: "NAME ASC",
      resultRecordCount: "8",
    });

    return (data.features || []).map((feature) => ({ feature, config }));
  }

  function buildSearchWhere(config, query) {
    const raw = query.trim();
    const upper = escapeSql(raw.toUpperCase());
    const clauses = [
      `UPPER(NAME) LIKE '%${upper}%'`,
      `UPPER(BASENAME) LIKE '%${upper}%'`,
    ];

    if (config.searchAbbreviation) {
      clauses.push(`UPPER(STUSAB) = '${upper}'`);
    }

    if (/^\d+$/.test(raw)) {
      const padded = raw.padStart(config.idLength, "0");
      clauses.push(`${config.idField} = '${escapeSql(raw)}'`);
      clauses.push(`${config.idField} = '${escapeSql(padded)}'`);
      if (config.idField !== "GEOID") {
        clauses.push(`GEOID = '${escapeSql(raw)}'`);
        clauses.push(`GEOID = '${escapeSql(padded)}'`);
      }
    }

    const deduped = Array.from(new Set(clauses));
    return `(${config.where}) AND (${deduped.join(" OR ")})`;
  }

  async function arcgisQuery(url, params) {
    const response = await fetch(`${url}/query?${new URLSearchParams(params).toString()}`);
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message || "ArcGIS query error");
    }
    return data;
  }

  function renderSearchResults(results) {
    searchResults.replaceChildren();

    results.forEach(({ feature, config }) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      const name = document.createElement("strong");
      const meta = document.createElement("span");

      button.className = "result-item";
      button.type = "button";
      name.textContent = getFeatureName(feature.properties);
      meta.textContent = getFeatureSubtitle(feature.properties, config);
      button.append(name, meta);
      button.addEventListener("click", () => selectFeature(feature, config, { fit: true }));
      item.append(button);
      searchResults.append(item);
    });
  }

  function clearSearch() {
    searchResults.replaceChildren();
    searchMessage.textContent = "Search the active layer.";
  }

  function selectFeature(feature, config, options) {
    const shouldFit = Boolean(options && options.fit);

    if (highlightLayer) {
      map.removeLayer(highlightLayer);
    }

    highlightLayer = L.geoJSON(feature, {
      interactive: false,
      style: {
        color: "#171a21",
        weight: 3,
        opacity: 1,
        fillColor: "#ffd166",
        fillOpacity: 0.34,
      },
    }).addTo(map);
    highlightLayer.bringToFront();

    if (shouldFit) {
      const bounds = highlightLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.12), {
          animate: true,
          duration: 0.35,
          maxZoom: config.fitMaxZoom,
        });
      }
    }

    renderDetails(feature.properties, config);
  }

  function clearSelection() {
    if (highlightLayer) {
      map.removeLayer(highlightLayer);
      highlightLayer = null;
    }
    selectionTitle.textContent = "Nothing selected";
    selectionSubtitle.textContent = "Click a boundary or choose a search result.";
    detailsList.replaceChildren();
  }

  function renderDetails(properties, config) {
    selectionTitle.textContent = getFeatureName(properties);
    selectionSubtitle.textContent = getFeatureSubtitle(properties, config);
    detailsList.replaceChildren();

    const rows = [
      ["Type", config.singular],
      ["GEOID", properties.GEOID],
      ["CBSA", properties.CBSA],
      ["CSA", properties.CSA],
      ["State", getStateLabel(properties)],
      ["County code", properties.COUNTY],
      ["Population", formatNumberValue(properties.POP100)],
      ["Housing units", formatNumberValue(properties.HU100)],
      ["Land area", formatArea(properties.AREALAND)],
      ["Water area", formatArea(properties.AREAWATER)],
      ["Center", formatPoint(properties.INTPTLAT || properties.CENTLAT, properties.INTPTLON || properties.CENTLON)],
    ].filter((row) => hasDisplayValue(row[1]));

    rows.forEach(([label, value]) => {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      detailsList.append(term, description);
    });
  }

  function updateLegend() {
    legendElement.replaceChildren();

    const title = document.createElement("div");
    title.className = "legend-title";
    title.textContent = currentMode === "metros" ? "MSA" : DATASETS[currentMode].label;
    legendElement.append(title);

    getVisibleConfigs().forEach((config) => {
      const row = document.createElement("div");
      const swatch = document.createElement("span");
      const label = document.createElement("span");

      row.className = "legend-row";
      swatch.className = "legend-swatch";
      swatch.style.border = `${Math.max(config.style.weight, 1)}px solid ${config.style.color}`;
      swatch.style.background = config.style.fillColor;
      swatch.style.opacity = String(Math.max(config.style.fillOpacity + 0.25, 0.55));
      if (config.style.dashArray) {
        swatch.style.borderStyle = "dashed";
      }
      label.textContent = config.legend;
      row.append(swatch, label);
      legendElement.append(row);
    });
  }

  function locateUser() {
    setStatus("Finding your location...");
    map.locate({
      setView: true,
      maxZoom: 8,
      enableHighAccuracy: true,
      timeout: 9000,
    });
  }

  function getHomeZoom() {
    return window.innerWidth < 700 ? 3 : 4;
  }

  function setStatus(message) {
    statusElement.textContent = message;
  }

  function getFeatureName(properties) {
    return properties.NAME || properties.BASENAME || properties.GEOID || properties.CBSA || "Boundary";
  }

  function getFeatureSubtitle(properties, config) {
    const parts = [config.singular];
    const stateLabel = getStateLabel(properties);
    const idValue = properties[config.idField] || properties.GEOID;

    if (stateLabel) {
      parts.push(stateLabel);
    }
    if (idValue) {
      parts.push(`${config.idField} ${idValue}`);
    }

    return parts.join(" - ");
  }

  function getStateLabel(properties) {
    if (properties.STUSAB && properties.STATE) {
      return `${properties.STUSAB} (${properties.STATE})`;
    }
    if (properties.STUSAB) {
      return properties.STUSAB;
    }
    if (properties.STATE && STATE_ABBR[properties.STATE]) {
      return `${STATE_ABBR[properties.STATE]} (${properties.STATE})`;
    }
    return properties.STATE || "";
  }

  function formatArea(value) {
    const meters = Number(value);
    if (!Number.isFinite(meters)) {
      return "";
    }
    const squareMiles = meters / SQ_METERS_PER_SQ_MILE;
    const rounded = squareMiles >= 100 ? Math.round(squareMiles) : Math.round(squareMiles * 10) / 10;
    return `${numberFormatter.format(rounded)} sq mi`;
  }

  function formatNumberValue(value) {
    const number = Number(value);
    return Number.isFinite(number) ? numberFormatter.format(number) : "";
  }

  function formatPoint(lat, lon) {
    const latitude = Number(lat);
    const longitude = Number(lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return "";
    }
    return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  }

  function hasDisplayValue(value) {
    return value !== undefined && value !== null && value !== "";
  }

  function escapeSql(value) {
    return value.replace(/'/g, "''");
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons({
        attrs: {
          "stroke-width": 2,
          "aria-hidden": "true",
        },
      });
    }
  }
})();
