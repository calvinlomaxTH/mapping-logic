(function () {
  const appShell = document.querySelector(".app-shell");
  const mapElement = document.getElementById("map");
  const statusElement = document.getElementById("mapStatus");
  const legendElement = document.getElementById("legend");
  const selectionTitle = document.getElementById("selectionTitle");
  const selectionSubtitle = document.getElementById("selectionSubtitle");
  const detailsList = document.getElementById("detailsList");
  const expandedDataButton = document.getElementById("expandedDataButton");
  const expandedDataDashboard = document.getElementById("expandedDataDashboard");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchMessage = document.getElementById("searchMessage");
  const searchResults = document.getElementById("searchResults");
  const dataLayerList = document.getElementById("dataLayerList");
  const dataLayerSummary = document.getElementById("dataLayerSummary");
  const includeMicroInput = document.getElementById("includeMicro");
  const panelToggle = document.getElementById("panelToggle");
  const basemapControl = document.getElementById("basemapControl");
  const basemapButton = document.getElementById("basemapButton");
  const basemapMenu = document.getElementById("basemapMenu");
  const basemapLabel = document.getElementById("basemapLabel");

  if (!window.L || !window.L.esri) {
    mapElement.innerHTML =
      '<div class="library-error"><p>Map libraries could not load. Start a local server and make sure this browser can reach unpkg.com and Census TIGERweb.</p></div>';
    statusElement.textContent = "Map libraries unavailable.";
    return;
  }

  const CURRENT_WMS =
    "https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer";
  const POPULATION_DATA_PATHS = ["data/co-est2025-alldata.csv", "data/co-est-alldata.csv"];
  const HEALTH_DATA_PATH = "data/health/health-layer-values.json";
  const CDC_SVI_COUNTY_LAYER_URL =
    "https://onemap.cdc.gov/onemapservices/rest/services/SVI/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer/1";
  const CMS_MEDICARE_ENROLLMENT_API =
    "https://data.cms.gov/data-api/v1/dataset/d7fabe1e-d19b-4333-9eff-e80e0643f2fd/data-viewer";
  const DYNAMIC_LAYER_DPI = 24;
  const SQ_METERS_PER_SQ_MILE = 2589988.110336;
  const BASEMAPS = {
    street: {
      label: "Street",
      status: "Street basemap active.",
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      options: {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      },
    },
    geographic: {
      label: "Geographic",
      status: "Geographic basemap active.",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
      options: {
        maxZoom: 19,
        attribution:
          "Tiles &copy; Esri, Garmin, FAO, NOAA, USGS, EPA, NPS, and the GIS User Community",
      },
    },
  };
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
      color: "#213F56",
      weight: 1.7,
      opacity: 0.95,
      fillColor: "#E3DED1",
      fillOpacity: 0.42,
    },
    counties: {
      color: "#214D8A",
      weight: 0.75,
      opacity: 0.9,
      fillColor: "#F1F1F1",
      fillOpacity: 0.36,
    },
    metro: {
      color: "#F7C560",
      weight: 1.35,
      opacity: 0.96,
      fillColor: "#F7C560",
      fillOpacity: 0.32,
    },
    micro: {
      color: "#686668",
      weight: 1.15,
      opacity: 0.92,
      dashArray: "5 4",
      fillColor: "#D0D0D0",
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

  const HEALTH_DATA_LAYERS = [
    {
      key: "brfss",
      label: "BRFSS",
      sourceName: "CDC",
      sourceUrl: "https://www.cdc.gov/brfss/annual_data/annual_data.htm",
      modes: ["states"],
      coverage: "State",
      selectionNotes: {
        states: "State annual survey indicators",
        counties: "State survey context; county extract needed",
        metros: "Selected metro indicators where available",
      },
    },
    {
      key: "cms-care-compare",
      label: "CMS Care Compare",
      sourceName: "CMS",
      sourceUrl: "https://data.cms.gov/provider-data/",
      modes: ["states", "counties", "metros"],
      coverage: "Provider locations",
      selectionNotes: {
        states: "Providers by state",
        counties: "Providers by county",
        metros: "Providers matched to MSA footprint",
      },
    },
    {
      key: "hrsa-health-center-program",
      label: "HRSA Health Center Program Data",
      sourceName: "HRSA",
      sourceUrl: "https://data.hrsa.gov/tools/data-reporting/program-data",
      modes: ["states", "counties", "metros"],
      coverage: "State; sites",
      selectionNotes: {
        states: "UDS health center totals by state",
        counties: "Health center sites by county",
        metros: "Sites rolled up to MSA footprint",
      },
    },
    {
      key: "sahie",
      label: "SAHIE",
      sourceName: "Census",
      sourceUrl: "https://www.census.gov/topics/health/sahie.html",
      modes: ["states", "counties", "metros"],
      coverage: "State; county",
      selectionNotes: {
        states: "Health insurance estimates by state",
        counties: "Health insurance estimates by county",
        metros: "County estimates rolled up to MSA",
      },
    },
    {
      key: "cms-medicare-enrollment",
      label: "CMS Medicare Enrollment Data",
      sourceName: "CMS",
      sourceUrl: "https://data.cms.gov/summary-statistics-on-beneficiary-enrollment/medicare-and-medicaid-reports",
      modes: ["states", "counties", "metros"],
      coverage: "State; county",
      liveModes: ["states", "counties"],
      selectionNotes: {
        states: "Beneficiary enrollment by state",
        counties: "Beneficiary enrollment by county",
        metros: "County enrollment rolled up to MSA",
      },
    },
    {
      key: "medicaid-enrollment",
      label: "Medicaid Enrollment Data",
      sourceName: "CMS",
      sourceUrl: "https://data.medicaid.gov/",
      modes: ["states"],
      coverage: "State",
      selectionNotes: {
        states: "Medicaid and CHIP enrollment by state",
        counties: "State enrollment context",
        metros: "State enrollment context",
      },
    },
    {
      key: "cdc-atsdr-svi",
      label: "CDC/ATSDR Social Vulnerability Index",
      sourceName: "CDC/ATSDR",
      sourceUrl: "https://www.atsdr.cdc.gov/place-health/php/svi/index.html",
      modes: ["states", "counties", "metros"],
      coverage: "County; tract",
      liveModes: ["states", "counties"],
      selectionNotes: {
        states: "County and tract vulnerability indexes",
        counties: "County and tract vulnerability indexes",
        metros: "County indexes rolled up to MSA",
      },
    },
    {
      key: "cms-hospital-cost-reports",
      label: "CMS Hospital Cost Reports",
      sourceName: "CMS",
      sourceUrl: "https://data.cms.gov/provider-compliance/cost-reports/hospital-provider-cost-report",
      modes: ["states", "counties", "metros"],
      coverage: "Hospital providers",
      selectionNotes: {
        states: "Hospital reports by provider state",
        counties: "Hospital reports by provider county",
        metros: "Hospital reports matched to MSA footprint",
      },
    },
    {
      key: "nih-seer-cancer-statistics",
      label: "NIH SEER Cancer Statistics",
      sourceName: "NIH/NCI",
      sourceUrl: "https://statecancerprofiles.cancer.gov/incidencerates/",
      modes: ["states", "counties", "metros"],
      coverage: "Registry; state; county",
      selectionNotes: {
        states: "Cancer statistics by registry and state",
        counties: "Cancer statistics where county data is available",
        metros: "County or registry statistics where available",
      },
    },
    {
      key: "cdc-fluvaxview",
      label: "CDC FluVaxView",
      sourceName: "CDC",
      sourceUrl: "https://www.cdc.gov/fluvaxview/index.html",
      modes: ["states"],
      coverage: "National; state",
      selectionNotes: {
        states: "Seasonal vaccination coverage by state",
        counties: "State vaccination coverage context",
        metros: "State or selected local coverage context",
      },
    },
  ];

  let currentMode = "states";
  let activeLayers = [];
  let highlightLayer = null;
  let locateMarker = null;
  let selectionToken = 0;
  let currentSelection = null;
  let dashboardExpanded = false;
  let dashboardDataToken = 0;
  const msaEstimateCache = new Map();
  let populationDataPromise = null;
  let healthDataPromise = null;
  const dataLayerValueCache = new Map();
  const selectedHealthLayerKeys = new Set(HEALTH_DATA_LAYERS.map((layer) => layer.key));

  const map = L.map("map", {
    center: [39.5, -98.35],
    zoom: getHomeZoom(),
    minZoom: 3,
    maxZoom: 13,
    zoomControl: false,
    preferCanvas: true,
  });

  const basemapLayers = Object.fromEntries(
    Object.entries(BASEMAPS).map(([key, config]) => [key, L.tileLayer(config.url, config.options)]),
  );
  let currentBasemapKey = "street";
  basemapLayers[currentBasemapKey].addTo(map);

  map.setMaxBounds(
    L.latLngBounds(
      L.latLng(14.5, -179.9),
      L.latLng(72.5, -52.0),
    ).pad(0.12),
  );

  renderDataLayerControls();
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

    dataLayerList.addEventListener("change", handleDataLayerToggle);
    expandedDataButton.addEventListener("click", toggleExpandedDashboard);

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
      setBasemapMenuOpen(basemapMenu.classList.contains("is-hidden"));
    });

    basemapMenu.addEventListener("click", (event) => {
      const option = event.target.closest("[data-basemap]");
      if (!option) {
        return;
      }
      setBasemap(option.dataset.basemap);
      setBasemapMenuOpen(false);
    });

    document.addEventListener("click", (event) => {
      if (!basemapControl.contains(event.target)) {
        setBasemapMenuOpen(false);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        setBasemapMenuOpen(false);
      }
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
        color: "#214D8A",
        weight: 3,
        fillColor: "#FFFFFF",
        fillOpacity: 0.95,
      }).addTo(map);
      setStatus("Location found.");
    });

    map.on("locationerror", (event) => {
      setStatus(event.message || "Location unavailable.");
    });

    map.on("click", handleMapClick);
  }

  function setBasemapMenuOpen(open) {
    basemapMenu.classList.toggle("is-hidden", !open);
    basemapButton.setAttribute("aria-expanded", String(open));
  }

  function setBasemap(key) {
    if (!BASEMAPS[key] || key === currentBasemapKey) {
      return;
    }

    const previousLayer = basemapLayers[currentBasemapKey];
    if (previousLayer && map.hasLayer(previousLayer)) {
      map.removeLayer(previousLayer);
    }

    currentBasemapKey = key;
    basemapLayers[currentBasemapKey].addTo(map);
    basemapLabel.textContent = BASEMAPS[currentBasemapKey].label;
    basemapButton.title = `Basemap: ${BASEMAPS[currentBasemapKey].label}`;

    basemapMenu.querySelectorAll("[data-basemap]").forEach((option) => {
      const active = option.dataset.basemap === currentBasemapKey;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-checked", String(active));
    });

    setStatus(BASEMAPS[currentBasemapKey].status);
  }

  function renderDataLayerControls() {
    dataLayerList.replaceChildren();

    const applicableLayers = getApplicableHealthLayers(currentMode);

    applicableLayers.forEach((layer) => {
      const item = document.createElement("div");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const copy = document.createElement("span");
      const name = document.createElement("span");
      const meta = document.createElement("span");
      const sourceLink = document.createElement("a");

      item.className = "data-layer-item";
      item.classList.toggle("is-active", selectedHealthLayerKeys.has(layer.key));

      label.className = "data-layer-option";
      checkbox.type = "checkbox";
      checkbox.value = layer.key;
      checkbox.checked = selectedHealthLayerKeys.has(layer.key);
      checkbox.setAttribute("aria-label", layer.label);

      copy.className = "data-layer-copy";
      name.className = "data-layer-name";
      meta.className = "data-layer-meta";
      name.textContent = layer.label;
      meta.textContent = `${layer.sourceName} - ${layer.coverage}`;
      copy.append(name, meta);
      label.append(checkbox, copy);

      sourceLink.className = "data-layer-source";
      sourceLink.href = layer.sourceUrl;
      sourceLink.target = "_blank";
      sourceLink.rel = "noreferrer";
      sourceLink.title = `Open ${layer.label} source`;
      sourceLink.setAttribute("aria-label", `Open ${layer.label} source`);
      sourceLink.innerHTML = '<i data-lucide="external-link"></i>';

      item.append(label, sourceLink);
      dataLayerList.append(item);
    });

    updateDataLayerSummary();
    refreshIcons();
  }

  function handleDataLayerToggle(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") {
      return;
    }

    const layer = HEALTH_DATA_LAYERS.find((item) => item.key === input.value);
    if (!layer) {
      return;
    }

    if (input.checked) {
      selectedHealthLayerKeys.add(layer.key);
    } else {
      selectedHealthLayerKeys.delete(layer.key);
    }

    const item = input.closest(".data-layer-item");
    if (item) {
      item.classList.toggle("is-active", input.checked);
    }
    updateDataLayerSummary();
    refreshCurrentSelectionDetails();
    setStatus(`${layer.label} ${input.checked ? "active" : "hidden"}.`);
  }

  function updateDataLayerSummary() {
    const applicableLayers = getApplicableHealthLayers(currentMode);
    const activeCount = getSelectedApplicableHealthLayers(currentMode).length;
    dataLayerSummary.textContent = `${numberFormatter.format(activeCount)}/${numberFormatter.format(applicableLayers.length)} active`;
  }

  function getApplicableHealthLayers(mode) {
    return HEALTH_DATA_LAYERS.filter((layer) => layer.modes.includes(mode));
  }

  function getSelectedApplicableHealthLayers(mode) {
    return getApplicableHealthLayers(mode).filter((layer) => selectedHealthLayerKeys.has(layer.key));
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

    renderDataLayerControls();
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
    const layer = L.esri.dynamicMapLayer({
      url: CURRENT_WMS,
      layers: [config.layerId],
      layerDefs: {
        [config.layerId]: config.where,
      },
      format: "png32",
      transparent: true,
      requestParams: {
        dpi: DYNAMIC_LAYER_DPI,
      },
      opacity: 0.88,
    });

    layer.on("load", () => {
      setStatus(`${getVisibleLabel()} ready. Click a boundary for details.`);
    });

    layer.on("requesterror", () => {
      setStatus(`Could not load ${config.label}. Check the Census TIGERweb connection.`);
    });

    return layer;
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
      geometryPrecision: "5",
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

  async function arcgisQuery(url, params, options) {
    const query = new URLSearchParams(params);
    const usePost = Boolean(options && options.forcePost) || query.toString().length > 1800;
    const response = usePost
      ? await fetch(`${url}/query`, { method: "POST", body: query })
      : await fetch(`${url}/query?${query.toString()}`);
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

  async function handleMapClick(event) {
    const token = ++selectionToken;
    setStatus(`Finding ${getVisibleLabel()} at click...`);

    try {
      const result = await findFeatureAtLatLng(event.latlng);
      if (token !== selectionToken) {
        return;
      }
      if (result) {
        selectFeature(result.feature, result.config, { fit: false });
      } else {
        setStatus(`No ${getVisibleLabel()} boundary found at that point.`);
      }
    } catch (error) {
      if (token === selectionToken) {
        setStatus("Could not query the selected point.");
      }
    }
  }

  async function findFeatureAtLatLng(latlng) {
    for (const config of getVisibleConfigs()) {
      const feature = await queryFeatureAtLatLng(config, latlng);
      if (feature) {
        return { feature, config };
      }
    }
    return null;
  }

  async function queryFeatureAtLatLng(config, latlng) {
    const data = await arcgisQuery(config.url, {
      f: "geojson",
      where: config.where,
      geometry: `${latlng.lng},${latlng.lat}`,
      geometryType: "esriGeometryPoint",
      inSR: "4326",
      spatialRel: "esriSpatialRelIntersects",
      outFields: "*",
      returnGeometry: "true",
      outSR: "4326",
      geometryPrecision: "5",
      resultRecordCount: "1",
    });
    return (data.features || [])[0] || null;
  }

  function selectFeature(feature, config, options) {
    const shouldFit = Boolean(options && options.fit);
    const token = ++selectionToken;
    dashboardExpanded = false;

    if (highlightLayer) {
      map.removeLayer(highlightLayer);
    }

    highlightLayer = L.geoJSON(feature, {
      interactive: false,
      style: {
        color: "#213F56",
        weight: 3,
        opacity: 1,
        fillColor: "#F7C560",
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

    currentSelection = {
      feature,
      config,
      populationContext: {
        populationMessage: "Loading local estimate data...",
      },
    };

    renderDetails(feature.properties, config, {
      populationMessage: "Loading local estimate data...",
    });
    hydratePopulationDetails(feature, config, token);
  }

  function clearSelection() {
    selectionToken += 1;
    dashboardDataToken += 1;
    currentSelection = null;
    dashboardExpanded = false;
    if (highlightLayer) {
      map.removeLayer(highlightLayer);
      highlightLayer = null;
    }
    selectionTitle.textContent = "Nothing selected";
    selectionSubtitle.textContent = "Click a boundary or choose a search result.";
    detailsList.replaceChildren();
    expandedDataButton.classList.add("is-hidden");
    expandedDataButton.setAttribute("aria-expanded", "false");
    const buttonText = expandedDataButton.querySelector("span");
    if (buttonText) {
      buttonText.textContent = "Expanded data";
    }
    expandedDataDashboard.classList.add("is-hidden");
    expandedDataDashboard.replaceChildren();
  }

  async function hydratePopulationDetails(feature, config, token) {
    let summary;
    try {
      summary = await getPopulationSummaryForFeature(feature, config);
    } catch (error) {
      summary = { populationMessage: "Estimate data could not be added for this selection." };
    }
    if (token !== selectionToken) {
      return;
    }
    currentSelection = {
      feature,
      config,
      populationContext: summary,
    };
    renderDetails(feature.properties, config, summary);
  }

  async function getPopulationSummaryForFeature(feature, config) {
    const store = await getPopulationData();
    if (!store) {
      return { populationMessage: "Local estimate data could not be loaded." };
    }

    if (config.key === "states") {
      const stateId = padCode(feature.properties.GEOID || feature.properties.STATE, 2);
      const record = store.byState.get(stateId);
      return record
        ? { populationSummary: buildPopulationSummary([record], store) }
        : { populationMessage: `No ${store.latestYear} estimate found in ${store.sourcePath}.` };
    }

    if (config.key === "counties") {
      const countyId =
        feature.properties.GEOID ||
        `${padCode(feature.properties.STATE, 2)}${padCode(feature.properties.COUNTY, 3)}`;
      const record = store.byCounty.get(countyId);
      return record
        ? { populationSummary: buildPopulationSummary([record], store) }
        : { populationMessage: `No ${store.latestYear} estimate found in ${store.sourcePath}.` };
    }

    return getMsaPopulationSummary(feature, store);
  }

  function getPopulationData() {
    if (!populationDataPromise) {
      populationDataPromise = loadPopulationData().catch(() => null);
    }
    return populationDataPromise;
  }

  async function getMsaPopulationSummary(feature, store) {
    const cacheKey = feature.properties.CBSA || feature.properties.GEOID || getFeatureName(feature.properties);
    if (msaEstimateCache.has(cacheKey)) {
      return { populationSummary: msaEstimateCache.get(cacheKey) };
    }

    if (!window.L.esri.Util || !window.L.esri.Util.geojsonToArcGIS) {
      return { populationMessage: "MSA estimate aggregation is unavailable in this browser." };
    }

    setStatus("Summing county estimates for the selected MSA...");
    const countyFeatures = await getMsaCountyFeatures(feature);
    const countyIds = Array.from(
      new Set(countyFeatures.map((item) => item.attributes && item.attributes.GEOID).filter(Boolean)),
    );
    const records = countyIds.map((id) => store.byCounty.get(id)).filter(Boolean);
    if (!records.length) {
      return { populationMessage: `No county-level ${store.latestYear} estimates found for this MSA.` };
    }

    const summary = buildPopulationSummary(records, store, {
      componentCount: records.length,
      sourceNote: "Summed from county estimates",
      countyIds,
    });
    msaEstimateCache.set(cacheKey, summary);
    return { populationSummary: summary };
  }

  async function getMsaCountyFeatures(feature) {
    return queryMsaCountyFeatures(feature, "esriSpatialRelIntersects");
  }

  async function queryMsaCountyFeatures(feature, spatialRel) {
    const geometry = window.L.esri.Util.geojsonToArcGIS(feature.geometry);
    const data = await arcgisQuery(
      DATASETS.counties.url,
      {
        f: "json",
        where: US_STATE_WHERE,
        geometry: JSON.stringify(geometry),
        geometryType: "esriGeometryPolygon",
        inSR: "4326",
        spatialRel,
        outFields: "GEOID",
        returnGeometry: "false",
        resultRecordCount: "5000",
      },
      { forcePost: true },
    );
    return data.features || [];
  }

  function refreshCurrentSelectionDetails() {
    if (!currentSelection) {
      return;
    }

    renderDetails(
      currentSelection.feature.properties,
      currentSelection.config,
      currentSelection.populationContext,
    );
  }

  function toggleExpandedDashboard() {
    if (!currentSelection) {
      return;
    }

    dashboardExpanded = !dashboardExpanded;
    refreshCurrentSelectionDetails();
  }

  function updateExpandedDashboard(properties, config, populationContext) {
    expandedDataButton.classList.remove("is-hidden");
    expandedDataButton.setAttribute("aria-expanded", String(dashboardExpanded));
    const buttonText = expandedDataButton.querySelector("span");
    if (buttonText) {
      buttonText.textContent = dashboardExpanded ? "Hide expanded data" : "Expanded data";
    }

    if (!dashboardExpanded) {
      dashboardDataToken += 1;
      expandedDataDashboard.classList.add("is-hidden");
      expandedDataDashboard.replaceChildren();
      return;
    }

    expandedDataDashboard.classList.remove("is-hidden");
    renderExpandedDashboard(properties, config, populationContext);
  }

  function renderDetails(properties, config, populationContext) {
    selectionTitle.textContent = getFeatureName(properties);
    selectionSubtitle.textContent = getFeatureSubtitle(properties, config);
    detailsList.replaceChildren();

    const rows = [
      ...getPopulationRows(populationContext),
      ["Type", config.singular],
      ["GEOID", properties.GEOID],
      ["CBSA", properties.CBSA],
      ["CSA", properties.CSA],
      ["State", getStateLabel(properties)],
      ["County code", properties.COUNTY],
      ["Housing units", getHousingUnitsValue(properties, populationContext)],
      ["Land area", formatArea(properties.AREALAND)],
      ["Water area", formatArea(properties.AREAWATER)],
      ["Center", formatPoint(properties.INTPTLAT || properties.CENTLAT, properties.INTPTLON || properties.CENTLON)],
      ...getHealthDataRows(config, properties),
    ].filter((row) => hasDisplayValue(row[1]));

    rows.forEach(([label, value]) => {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      detailsList.append(term, description);
    });

    updateExpandedDashboard(properties, config, populationContext);
  }

  function renderExpandedDashboard(properties, config, populationContext) {
    expandedDataDashboard.replaceChildren();

    const summary = populationContext && populationContext.populationSummary;
    const loadingMessage = populationContext && populationContext.populationMessage;
    const dashboardToken = ++dashboardDataToken;
    const kpiGrid = document.createElement("div");
    kpiGrid.className = "dashboard-kpis";

    const kpis = summary
      ? [
          ["Population", formatNumberValue(summary.estimate)],
          ["Growth", formatSignedPercent(summary.percentChange)],
          ["Net migration", formatSignedNumber(summary.netMigration)],
          ["Births / deaths", `${formatNumberValue(summary.births)} / ${formatNumberValue(summary.deaths)}`],
        ]
      : [["Population", loadingMessage || "No local population record"], ["Data layers", `${getSelectedApplicableHealthLayers(config.mode).length} active`]];

    kpis.forEach(([label, value]) => {
      kpiGrid.append(createDashboardKpi(label, value));
    });
    expandedDataDashboard.append(kpiGrid);

    if (summary) {
      expandedDataDashboard.append(createPopulationTrendPanel(summary));
      expandedDataDashboard.append(createPopulationDriverPanel(summary));
    } else {
      expandedDataDashboard.append(createDashboardMessage(loadingMessage || "Population data is not available for this selection."));
    }

    expandedDataDashboard.append(createDataLayerDashboard(properties, config));
    hydrateDataLayerValues(properties, config, dashboardToken);
  }

  function createDashboardKpi(label, value) {
    const card = document.createElement("div");
    const valueElement = document.createElement("strong");
    const labelElement = document.createElement("span");

    card.className = "dashboard-kpi";
    valueElement.textContent = value || "--";
    labelElement.textContent = label;
    card.append(valueElement, labelElement);
    return card;
  }

  function createPopulationTrendPanel(summary) {
    const panel = createDashboardPanel("Population trend");
    const chart = document.createElement("div");
    const series = (summary.estimateSeries || []).filter((item) => Number.isFinite(item.value));
    const values = series.map((item) => item.value);

    if (!values.length) {
      panel.append(createDashboardMessage("No estimate series is available."));
      return panel;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const span = max - min || 1;

    chart.className = "mini-bar-chart";
    series.forEach((item) => {
      const bar = document.createElement("div");
      const fill = document.createElement("span");
      const label = document.createElement("em");
      const height = 18 + ((item.value - min) / span) * 72;

      bar.className = "mini-bar";
      fill.style.height = `${Math.round(height)}%`;
      fill.title = `${item.year}: ${formatNumberValue(item.value)}`;
      label.textContent = String(item.year).slice(-2);
      bar.append(fill, label);
      chart.append(bar);
    });

    panel.append(chart);
    return panel;
  }

  function createPopulationDriverPanel(summary) {
    const panel = createDashboardPanel(`${summary.latestYear} change drivers`);
    const rows = [
      ["Natural", summary.naturalChange],
      ["Domestic", summary.domesticMigration],
      ["International", summary.internationalMigration],
    ];
    const max = Math.max(...rows.map(([, value]) => Math.abs(Number(value) || 0)), 1);
    const list = document.createElement("div");

    list.className = "driver-list";
    rows.forEach(([label, value]) => {
      const row = document.createElement("div");
      const name = document.createElement("span");
      const track = document.createElement("div");
      const fill = document.createElement("span");
      const number = document.createElement("strong");
      const numericValue = Number(value) || 0;

      row.className = "driver-row";
      name.textContent = label;
      track.className = "driver-track";
      fill.className = numericValue < 0 ? "is-negative" : "is-positive";
      fill.style.width = `${Math.max(6, Math.round((Math.abs(numericValue) / max) * 100))}%`;
      number.textContent = formatSignedNumber(value);
      track.append(fill);
      row.append(name, track, number);
      list.append(row);
    });

    panel.append(list);
    return panel;
  }

  function createDataLayerDashboard(properties, config) {
    const panel = createDashboardPanel("Applicable data layers");
    const layers = getSelectedApplicableHealthLayers(config.mode);

    if (!layers.length) {
      panel.append(createDashboardMessage("No applicable data layers are active for this boundary type."));
      return panel;
    }

    const grid = document.createElement("div");
    grid.className = "dashboard-layer-grid";
    layers.forEach((layer) => {
      grid.append(createDataLayerCard(layer, properties, config));
    });
    panel.append(grid);
    return panel;
  }

  function createDataLayerCard(layer, properties, config) {
    const card = document.createElement("article");
    const header = document.createElement("div");
    const title = document.createElement("h4");
    const source = document.createElement("span");
    const match = document.createElement("p");
    const status = document.createElement("div");
    const metrics = document.createElement("div");
    const link = document.createElement("a");

    card.className = "dashboard-layer-card";
    card.dataset.layerKey = layer.key;
    header.className = "dashboard-layer-header";
    title.textContent = layer.label;
    source.textContent = layer.sourceName;
    header.append(title, source);
    match.textContent = getHealthLayerNote(layer, config, properties);
    status.className = "dashboard-layer-status";
    status.textContent = getDataLayerStatus(layer, properties, config);
    metrics.className = "dashboard-layer-metrics";
    getDefaultLayerMetrics(layer, properties, config).forEach((metric) => {
      metrics.append(createLayerMetric(metric.label, metric.value));
    });
    link.href = layer.sourceUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Source";
    card.append(header, match, status, metrics, link);
    return card;
  }

  function getDataLayerStatus(layer, properties, config) {
    const matchKey = getDataLayerMatchKey(properties, config);
    const hasLiveEndpoint = layer.liveModes && layer.liveModes.includes(config.mode);
    return hasLiveEndpoint
      ? `Matched to ${matchKey}; source endpoint available.`
      : `Matched to ${matchKey}; source link ready.`;
  }

  function getDefaultLayerMetrics(layer, properties, config) {
    return [
      { label: "Join", value: getDataLayerMatchKey(properties, config) },
      { label: "Level", value: config.singular },
      { label: "Coverage", value: layer.coverage },
    ];
  }

  function createLayerMetric(label, value) {
    const metric = document.createElement("div");
    const term = document.createElement("span");
    const detail = document.createElement("strong");

    metric.className = "dashboard-layer-metric";
    term.textContent = label;
    detail.textContent = value || "--";
    metric.append(term, detail);
    return metric;
  }

  async function hydrateDataLayerValues(properties, config, dashboardToken) {
    let store;
    try {
      store = await getHealthData();
    } catch (error) {
      if (dashboardToken === dashboardDataToken) {
        setDataLayerCardsMessage("Could not load local health layer values.");
      }
      return;
    }

    if (dashboardToken !== dashboardDataToken || !store) {
      return;
    }

    getSelectedApplicableHealthLayers(config.mode).forEach((layer) => {
      const record = getHealthLayerRecord(store, layer, properties, config);
      updateDataLayerCard(layer.key, record, store.sources && store.sources[layer.key]);
    });
  }

  function getHealthData() {
    if (!healthDataPromise) {
      healthDataPromise = fetch(HEALTH_DATA_PATH).then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load ${HEALTH_DATA_PATH}`);
        }
        return response.json();
      });
    }
    return healthDataPromise;
  }

  function getHealthLayerRecord(store, layer, properties, config) {
    if (config.mode === "states") {
      const stateId = getStateIdForProperties(properties);
      return (store.states && store.states[stateId] && store.states[stateId][layer.key]) || null;
    }

    if (config.mode === "counties") {
      const countyId = getCountyIdForProperties(properties);
      return (store.counties && store.counties[countyId] && store.counties[countyId][layer.key]) || null;
    }

    const cbsa = properties.CBSA || properties.GEOID;
    const directRecord = store.cbsas && store.cbsas[cbsa] && store.cbsas[cbsa][layer.key];
    if (directRecord) {
      return directRecord;
    }
    return aggregateHealthLayerForMsa(store, layer);
  }

  function aggregateHealthLayerForMsa(store, layer) {
    const summary =
      currentSelection &&
      currentSelection.populationContext &&
      currentSelection.populationContext.populationSummary;
    const countyIds = summary && Array.isArray(summary.countyIds) ? summary.countyIds : [];
    const records = countyIds
      .map((countyId) => store.counties && store.counties[countyId] && store.counties[countyId][layer.key])
      .filter(Boolean);

    if (!records.length) {
      return null;
    }

    const metricGroups = new Map();
    records.forEach((record) => {
      (record.metrics || []).forEach((metricItem) => {
        const key = metricItem.label;
        if (!metricGroups.has(key)) {
          metricGroups.set(key, {
            label: metricItem.label,
            kind: metricItem.kind,
            aggregate: metricItem.aggregate || "sum",
            values: [],
          });
        }
        const value = Number(metricItem.raw);
        if (Number.isFinite(value)) {
          metricGroups.get(key).values.push(value);
        }
      });
    });

    const metrics = Array.from(metricGroups.values()).filter((group) => group.values.length).map((group) => {
      const raw =
        group.aggregate === "average"
          ? group.values.reduce((total, value) => total + value, 0) / group.values.length
          : group.values.reduce((total, value) => total + value, 0);
      return {
        label: group.label,
        raw,
        kind: group.kind,
        aggregate: group.aggregate,
        value: formatHealthMetricValue(raw, group.kind),
      };
    });

    return {
      title: layer.label,
      period: Array.from(new Set(records.map((record) => record.period).filter(Boolean))).join(", "),
      source: records[0].source,
      metrics,
      note: `Aggregated from ${numberFormatter.format(records.length)} counties`,
    };
  }

  function updateDataLayerCard(layerKey, record, source) {
    const card = Array.from(expandedDataDashboard.querySelectorAll(".dashboard-layer-card")).find(
      (item) => item.dataset.layerKey === layerKey,
    );
    if (!card) {
      return;
    }

    const status = card.querySelector(".dashboard-layer-status");
    const metrics = card.querySelector(".dashboard-layer-metrics");
    if (!status || !metrics) {
      return;
    }

    metrics.replaceChildren();
    if (record && record.metrics && record.metrics.length) {
      status.textContent = record.note || `Loaded ${record.period || "current"} values.`;
      record.metrics.forEach((metricItem) => {
        metrics.append(createLayerMetric(metricItem.label, metricItem.value));
      });
      return;
    }

    const statusText = source && source.status === "source-only"
      ? source.note || "Source linked; bulk data requires source terms."
      : "No matching local value for this geography.";
    status.textContent = statusText;
  }

  function setDataLayerCardsMessage(message) {
    expandedDataDashboard.querySelectorAll(".dashboard-layer-status").forEach((status) => {
      status.textContent = message;
    });
  }

  function getStateIdForProperties(properties) {
    return padCode(properties.STATE || properties.GEOID, 2);
  }

  function getCountyIdForProperties(properties) {
    return properties.GEOID || `${padCode(properties.STATE, 2)}${padCode(properties.COUNTY, 3)}`;
  }

  function formatHealthMetricValue(value, kind) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    if (kind === "percent") {
      return `${number.toFixed(1)}%`;
    }
    if (kind === "decimal") {
      return number.toFixed(2);
    }
    return numberFormatter.format(Math.round(number));
  }

  function createDashboardPanel(title) {
    const panel = document.createElement("section");
    const heading = document.createElement("h3");

    panel.className = "dashboard-panel";
    heading.textContent = title;
    panel.append(heading);
    return panel;
  }

  function createDashboardMessage(message) {
    const element = document.createElement("div");
    element.className = "dashboard-message";
    element.textContent = message;
    return element;
  }

  function getPopulationRows(context) {
    if (!context) {
      return [];
    }
    if (context.populationMessage) {
      return [["Estimate data", context.populationMessage]];
    }
    if (!context.populationSummary) {
      return [];
    }

    const summary = context.populationSummary;
    const year = summary.latestYear;
    const previousYear = summary.previousYear;
    return [
      [`${year} estimate`, formatNumberValue(summary.estimate)],
      [`${previousYear}-${year} change`, formatSignedNumber(summary.change)],
      [`${previousYear}-${year} growth`, formatSignedPercent(summary.percentChange)],
      [`Births ${year}`, formatNumberValue(summary.births)],
      [`Deaths ${year}`, formatNumberValue(summary.deaths)],
      [`Natural change ${year}`, formatSignedNumber(summary.naturalChange)],
      [`Net migration ${year}`, formatSignedNumber(summary.netMigration)],
      [`Domestic migration ${year}`, formatSignedNumber(summary.domesticMigration)],
      [`International migration ${year}`, formatSignedNumber(summary.internationalMigration)],
      ["County components", summary.componentCount ? numberFormatter.format(summary.componentCount) : ""],
      ["Estimate source", summary.sourceNote || summary.sourcePath],
    ];
  }

  function getHealthDataRows(config, properties) {
    const layers = getSelectedApplicableHealthLayers(config.mode);
    if (!layers.length) {
      return [];
    }

    return [
      ["Data layers", `${numberFormatter.format(layers.length)} active for ${config.singular.toLowerCase()}`],
      ...layers.map((layer) => [layer.label, getHealthLayerNote(layer, config, properties)]),
    ];
  }

  function getHealthLayerNote(layer, config, properties) {
    const note = layer.selectionNotes[config.mode] || "";
    return `${layer.sourceName} - ${note}${properties ? ` (${getDataLayerMatchKey(properties, config)})` : ""}`;
  }

  function getDataLayerMatchKey(properties, config) {
    if (config.mode === "states") {
      const stateId = properties.STATE || properties.GEOID || "";
      return stateId ? `STATE ${stateId}` : "State boundary";
    }
    if (config.mode === "counties") {
      const countyId =
        properties.GEOID ||
        `${padCode(properties.STATE, 2)}${padCode(properties.COUNTY, 3)}`;
      return countyId ? `COUNTY ${countyId}` : "County boundary";
    }
    const cbsaId = properties.CBSA || properties.GEOID || "";
    return cbsaId ? `CBSA ${cbsaId}` : "MSA boundary";
  }

  function getHousingUnitsValue(properties, context) {
    const summary = context && context.populationSummary;
    const summaryHousingUnits = summary ? parseNumeric(summary.housingUnits) : null;
    const value = summaryHousingUnits && summaryHousingUnits > 0 ? summaryHousingUnits : properties.HU100;
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? numberFormatter.format(number) : "";
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

  async function loadPopulationData() {
    let lastError = null;
    for (const path of POPULATION_DATA_PATHS) {
      try {
        const response = await fetch(path);
        if (!response.ok) {
          throw new Error(`Could not load ${path}`);
        }
        const csvText = await response.text();
        return buildPopulationStore(csvText, path);
      } catch (error) {
        lastError = error;
      }
    }
    throw lastError || new Error("No population estimate CSV found.");
  }

  function buildPopulationStore(csvText, sourcePath) {
    const rows = parseCsv(csvText);
    if (!rows.length) {
      throw new Error("Population estimate CSV is empty.");
    }

    const headers = rows.shift().map((header) => header.trim());
    const estimateYears = headers
      .map((header) => {
        const match = header.match(/^POPESTIMATE(\d{4})$/);
        return match ? Number(match[1]) : null;
      })
      .filter((year) => Number.isFinite(year))
      .sort((a, b) => a - b);

    const latestYear = estimateYears[estimateYears.length - 1];
    const previousYear = estimateYears[estimateYears.length - 2] || latestYear;
    const byState = new Map();
    const byCounty = new Map();

    rows.forEach((row) => {
      const record = {};
      headers.forEach((header, index) => {
        record[header] = String(row[index] || "").trim();
      });

      if (record.SUMLEV === "40") {
        byState.set(padCode(record.STATE, 2), record);
      }
      if (record.SUMLEV === "50") {
        byCounty.set(`${padCode(record.STATE, 2)}${padCode(record.COUNTY, 3)}`, record);
      }
    });

    return {
      sourcePath,
      estimateYears,
      latestYear,
      previousYear,
      byState,
      byCounty,
    };
  }

  function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let inQuotes = false;

    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];

      if (inQuotes) {
        if (char === '"') {
          if (text[index + 1] === '"') {
            field += '"';
            index += 1;
          } else {
            inQuotes = false;
          }
        } else {
          field += char;
        }
        continue;
      }

      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        row.push(field);
        field = "";
      } else if (char === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (char !== "\r") {
        field += char;
      }
    }

    if (field || row.length) {
      row.push(field);
      rows.push(row);
    }

    return rows;
  }

  function buildPopulationSummary(records, store, options) {
    const latestYear = store.latestYear;
    const previousYear = store.previousYear;
    const estimate = sumRecords(records, `POPESTIMATE${latestYear}`);
    const previousEstimate = sumRecords(records, `POPESTIMATE${previousYear}`);
    const change = sumRecords(records, `NPOPCHG${latestYear}`);

    return {
      latestYear,
      previousYear,
      estimate,
      estimateSeries: store.estimateYears.map((year) => ({
        year,
        value: sumRecords(records, `POPESTIMATE${year}`),
      })),
      previousEstimate,
      change,
      percentChange: previousEstimate ? (change / previousEstimate) * 100 : null,
      births: sumRecords(records, `BIRTHS${latestYear}`),
      deaths: sumRecords(records, `DEATHS${latestYear}`),
      naturalChange: sumRecords(records, `NATURALCHG${latestYear}`),
      netMigration: sumRecords(records, `NETMIG${latestYear}`),
      domesticMigration: sumRecords(records, `DOMESTICMIG${latestYear}`),
      internationalMigration: sumRecords(records, `INTERNATIONALMIG${latestYear}`),
      componentCount: options && options.componentCount,
      countyIds: options && options.countyIds,
      sourceNote: options && options.sourceNote,
      sourcePath: store.sourcePath,
    };
  }

  function sumRecords(records, field) {
    const values = records.map((record) => parseNumeric(record[field])).filter((value) => value !== null);
    if (!values.length) {
      return null;
    }
    return values.reduce((total, value) => total + value, 0);
  }

  function parseNumeric(value) {
    const number = Number(String(value || "").trim());
    return Number.isFinite(number) ? number : null;
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

  function formatSignedNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    const sign = number > 0 ? "+" : "";
    return `${sign}${numberFormatter.format(number)}`;
  }

  function formatSignedPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    const sign = number > 0 ? "+" : "";
    return `${sign}${number.toFixed(2)}%`;
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

  function padCode(value, length) {
    const digits = String(value || "").trim();
    return digits ? digits.padStart(length, "0") : "";
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
