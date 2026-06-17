(function () {
  const appShell = document.querySelector(".app-shell");
  const mapElement = document.getElementById("map");
  const statusElement = document.getElementById("mapStatus");
  const legendElement = document.getElementById("legend");
  const selectionTitle = document.getElementById("selectionTitle");
  const selectionSubtitle = document.getElementById("selectionSubtitle");
  const detailsList = document.getElementById("detailsList");
  const expandedDataButton = document.getElementById("expandedDataButton");
  const exportLocaleButton = document.getElementById("exportLocaleButton");
  const expandedDataDashboard = document.getElementById("expandedDataDashboard");
  const searchForm = document.getElementById("searchForm");
  const searchInput = document.getElementById("searchInput");
  const searchMessage = document.getElementById("searchMessage");
  const searchResults = document.getElementById("searchResults");
  const dataLayerList = document.getElementById("dataLayerList");
  const dataLayerSummary = document.getElementById("dataLayerSummary");
  const dataLayerSection = document.getElementById("dataLayerSection");
  const dataLayerPanelToggle = document.getElementById("dataLayerPanelToggle");
  const facilityLayerList = document.getElementById("facilityLayerList");
  const facilityLayerSummary = document.getElementById("facilityLayerSummary");
  const facilityLayerSection = document.getElementById("facilityLayerSection");
  const facilityLayerPanelToggle = document.getElementById("facilityLayerPanelToggle");
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
  const SVG_NS = "http://www.w3.org/2000/svg";
  const HIFLD_HOSPITALS_FEATURESERVER =
    "https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/Hospitals_hifld/FeatureServer/0";
  const HIFLD_MEDICAL_FACILITIES_FEATURESERVER =
    "https://services9.arcgis.com/FF3qnCUixr5w9JQi/ArcGIS/rest/services/US_HIFLD_Assets/FeatureServer/2";
  const HRSA_PRIMARY_HEALTH_MAPSERVER =
    "https://gisportal.hrsa.gov/server/rest/services/HealthCareFacilities/PrimaryHealthCareFacilities_FS/MapServer";
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
  const currencyFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

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

  const FACILITY_SITE_LAYERS = [
    {
      key: "hifld-hospitals",
      label: "Hospitals",
      sourceName: "HIFLD",
      sourceUrl: HIFLD_HOSPITALS_FEATURESERVER,
      coverage: "Hospital facility points with operations and source metadata",
      url: HIFLD_HOSPITALS_FEATURESERVER,
      color: "#ff6b6b",
      legend: "Hospitals",
      titleFields: ["NAME", "Name", "name"],
      popupFields: [
        { label: "Hospital type", fields: ["TYPE", "FacilityType"] },
        { label: "Status", fields: ["STATUS"] },
        { label: "Beds", fields: ["BEDS"], format: "integer" },
        { label: "Total staff", fields: ["TTL_STAFF"], format: "integer" },
        { label: "Trauma designation", fields: ["TRAUMA"] },
        { label: "Helipad", fields: ["HELIPAD"] },
        { label: "Owner", fields: ["OWNER"] },
        { label: "Address", fields: ["ADDRESS"] },
        { label: "City", fields: ["CITY"] },
        { label: "State", fields: ["STATE"] },
        { label: "ZIP", fields: ["ZIP", "ZIP4"] },
        { label: "County", fields: ["COUNTY"] },
        { label: "County FIPS", fields: ["COUNTYFIPS"] },
        { label: "Phone", fields: ["TELEPHONE"] },
        { label: "Website", fields: ["WEBSITE"], link: true },
        { label: "NAICS", fields: ["NAICS_DESC", "NAICS_CODE"] },
        { label: "Source", fields: ["SOURCE"] },
        { label: "Source date", fields: ["SOURCEDATE"] },
        { label: "Validation", fields: ["VAL_METHOD"] },
        { label: "Validation date", fields: ["VAL_DATE"] },
        { label: "State ID", fields: ["STATE_ID", "ID"] },
        { label: "Alternate name", fields: ["ALT_NAME"] },
        { label: "Coordinates", fields: ["LATITUDE", "LONGITUDE"], format: "coordinates" },
      ],
    },
    {
      key: "hrsa-health-centers",
      label: "Clinics / Health Centers",
      sourceName: "HRSA",
      sourceUrl: `${HRSA_PRIMARY_HEALTH_MAPSERVER}/0`,
      coverage: "HRSA service delivery sites",
      url: `${HRSA_PRIMARY_HEALTH_MAPSERVER}/0`,
      color: "#42d6d0",
      legend: "HRSA health centers",
      titleFields: ["SITE_NM"],
      popupFields: [
        { label: "Type", fields: ["HCC_TYP_DESC", "HCC_LOC_DESC"] },
        { label: "Status", fields: ["HCC_STATUS_DESC"] },
        { label: "Address", fields: ["SITE_ADDRESS"] },
        { label: "City", fields: ["SITE_CITY"] },
        { label: "State", fields: ["SITE_STATE_ABBR"] },
        { label: "County", fields: ["COUNTY_NM", "COUNTY_DESC"] },
        { label: "Phone", fields: ["SITE_PHONE_NUM"] },
        { label: "Hours / week", fields: ["TOT_OPER_HR_PER_WEEK"] },
        { label: "Population", fields: ["SITE_POP_TYP_DESC"] },
        { label: "Operator", fields: ["GRANTEE_NM"] },
        { label: "Website", fields: ["SITE_URL"], link: true },
      ],
    },
    {
      key: "hifld-urgent-care",
      label: "Urgent Care",
      sourceName: "HIFLD",
      sourceUrl: HIFLD_MEDICAL_FACILITIES_FEATURESERVER,
      coverage: "Urgent care facility points",
      url: HIFLD_MEDICAL_FACILITIES_FEATURESERVER,
      where: "AssetType = 'Urgent Care'",
      color: "#f7c560",
      legend: "Urgent care",
      titleFields: ["Name", "name", "NAME"],
      popupFields: [
        { label: "Asset type", fields: ["AssetType"] },
        { label: "Facility type", fields: ["FacilityType"] },
      ],
    },
    {
      key: "hifld-other-medical",
      label: "Other Medical Facilities",
      sourceName: "HIFLD",
      sourceUrl: HIFLD_MEDICAL_FACILITIES_FEATURESERVER,
      coverage: "VA health and EMS facility points",
      url: HIFLD_MEDICAL_FACILITIES_FEATURESERVER,
      where: "AssetType IN ('VA Health Facility', 'EMS')",
      color: "#8fd14f",
      legend: "Other medical facilities",
      titleFields: ["Name", "name", "NAME"],
      popupFields: [
        { label: "Asset type", fields: ["AssetType"] },
        { label: "Facility type", fields: ["FacilityType"] },
      ],
    },
  ];

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
      directCbsaOnly: true,
      selectionNotes: {
        states: "Hospital reports by provider state",
        counties: "Hospital reports by provider county",
        metros: "Hospital reports matched by CMS Medicare CBSA Number",
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

  const METRIC_EXPLANATIONS = {
    Join: "Identifier used to match the selected geography to the local extract.",
    Level: "Geographic level used for this card.",
    Coverage: "Smallest geography or source footprint available for this layer.",
    "Heart attack": "Percent of BRFSS adult respondents who reported ever being told they had a heart attack.",
    Depression: "Percent of BRFSS adult respondents who reported ever being told they had a depressive disorder.",
    Diabetes: "Percent of BRFSS adult respondents who reported ever being told they had diabetes.",
    "High blood pressure": "Percent of BRFSS adult respondents who reported ever being told they had high blood pressure.",
    "Health coverage": "Percent of BRFSS adult respondents with any kind of health care coverage.",
    Hospitals: "Number of hospitals in the CMS Care Compare extract matched to this geography.",
    "Avg overall rating": "Average CMS hospital overall star rating for matched hospitals with a numeric rating.",
    "Service delivery sites": "Number of HRSA Health Center Program service delivery or look-alike sites matched to this geography.",
    Uninsured: "Estimated number or percent of people without health insurance, depending on the source metric.",
    Insured: "Estimated number of people with health insurance.",
    "Uninsured rate": "Estimated percent of people without health insurance.",
    "Insured rate": "Estimated percent of people with health insurance.",
    Beneficiaries: "Total Medicare beneficiaries in the CMS enrollment extract.",
    "Medicare Advantage": "Medicare beneficiaries enrolled in Medicare Advantage or other managed care plans.",
    "MA share": "Medicare Advantage beneficiaries divided by total Medicare beneficiaries.",
    Medicaid: "People enrolled in Medicaid in the latest imported Medicaid enrollment period.",
    CHIP: "People enrolled in the Children's Health Insurance Program in the latest imported period.",
    Unknown: "Enrollment records whose source program type was not specified.",
    "Overall SVI percentile": "CDC/ATSDR overall Social Vulnerability Index percentile; higher values mean greater relative vulnerability.",
    "Socioeconomic theme": "SVI percentile for socioeconomic status indicators.",
    "Household theme": "SVI percentile for household characteristics indicators.",
    "Poverty 150%": "Percent of people living below 150 percent of the poverty level in the SVI extract.",
    Unemployment: "Percent unemployed in the SVI extract.",
    "Latest provider reports": "Number of latest CMS hospital cost report records matched to this geography after keeping one current report per provider. For MSAs, records are matched by the CMS Medicare CBSA Number field.",
    Beds: "Total hospital beds reported in matched CMS hospital cost reports. For MSAs, this is the sum of reports whose CMS Medicare CBSA Number matches the selected CBSA, not a county-footprint rollup.",
    "Total costs": "Total costs reported across matched CMS hospital cost reports.",
    "Net patient revenue": "Net patient revenue reported across matched CMS hospital cost reports.",
    "All-cancer incidence rate": "Age-adjusted all-cancer incidence rate per 100,000 people.",
    "Average annual cases": "Average annual number of cancer cases in the reporting period.",
    "Recent 5-year trend": "Annual percent change in the recent five-year cancer incidence trend.",
    "Trend classification": "Whether the recent cancer incidence trend is rising, falling, or stable.",
    "Flu vaccine coverage": "Percent with influenza vaccination coverage in the latest imported FluVaxView estimate.",
  };

  const PER_CAPITA_METRICS = {
    Hospitals: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    "Service delivery sites": { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    Uninsured: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    Insured: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    Beneficiaries: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    "Medicare Advantage": { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    Medicaid: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    CHIP: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    Unknown: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    Beds: { scale: 100000, unit: "per 100k residents", kind: "decimal" },
    "Total costs": { scale: 1, unit: "per resident", kind: "currency" },
    "Net patient revenue": { scale: 1, unit: "per resident", kind: "currency" },
    "Average annual cases": { scale: 100000, unit: "per 100k residents", kind: "decimal" },
  };

  let currentMode = "states";
  let activeLayers = [];
  let highlightLayer = null;
  let locateMarker = null;
  let selectionToken = 0;
  let currentSelection = null;
  let dashboardExpanded = false;
  let mapFocus = "healthcare-sites";
  let dashboardDataToken = 0;
  const msaEstimateCache = new Map();
  let populationDataPromise = null;
  let healthDataPromise = null;
  const dataLayerValueCache = new Map();
  const selectedHealthLayerKeys = new Set(HEALTH_DATA_LAYERS.map((layer) => layer.key));
  const selectedFacilityLayerKeys = new Set(FACILITY_SITE_LAYERS.map((layer) => layer.key));
  const facilityLayersByKey = new Map();

  const map = L.map("map", {
    center: [39.5, -98.35],
    zoom: getHomeZoom(),
    minZoom: 3,
    maxZoom: 18,
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
  renderFacilityLayerControls();
  wireControls();
  refreshIcons();
  setMode("states");
  syncFacilitySiteLayers();
  updateCounts();

  function wireControls() {
    document.querySelectorAll("[data-mode]").forEach((button) => {
      button.addEventListener("click", () => setMode(button.dataset.mode));
    });

    document.querySelectorAll("[data-map-focus]").forEach((button) => {
      button.addEventListener("click", () => setMapFocus(button.dataset.mapFocus));
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
    facilityLayerList.addEventListener("change", handleFacilityLayerToggle);
    dataLayerPanelToggle.addEventListener("click", () => toggleCollapsibleSection(dataLayerSection, dataLayerPanelToggle, "data layers"));
    facilityLayerPanelToggle.addEventListener("click", () => toggleCollapsibleSection(facilityLayerSection, facilityLayerPanelToggle, "healthcare sites"));
    expandedDataButton.addEventListener("click", toggleExpandedDashboard);
    exportLocaleButton.addEventListener("click", exportCurrentLocaleData);

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
        closeMetricHelp();
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

  function toggleCollapsibleSection(section, button, label) {
    if (!section || !button) {
      return;
    }
    const collapsed = !section.classList.contains("is-collapsed");
    section.classList.toggle("is-collapsed", collapsed);
    button.setAttribute("aria-expanded", String(!collapsed));
    button.title = `${collapsed ? "Show" : "Hide"} ${label}`;
    const content = document.getElementById(button.getAttribute("aria-controls"));
    if (content) {
      content.hidden = collapsed;
    }
    button.innerHTML = `<i data-lucide="${collapsed ? "chevron-down" : "chevron-up"}"></i>`;
    refreshIcons();
  }

  function setMapFocus(nextFocus) {
    if (!["healthcare-sites", "location-data"].includes(nextFocus) || nextFocus === mapFocus) {
      return;
    }
    mapFocus = nextFocus;
    document.querySelectorAll("[data-map-focus]").forEach((button) => {
      const active = button.dataset.mapFocus === mapFocus;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    if (mapFocus === "healthcare-sites") {
      setCollapsibleSection(dataLayerSection, dataLayerPanelToggle, true, "data layers");
      setCollapsibleSection(facilityLayerSection, facilityLayerPanelToggle, false, "healthcare sites");
      syncFacilitySiteLayers();
      setStatus("Healthcare site overlays visible.");
    } else {
      setCollapsibleSection(dataLayerSection, dataLayerPanelToggle, false, "data layers");
      setCollapsibleSection(facilityLayerSection, facilityLayerPanelToggle, true, "healthcare sites");
      syncFacilitySiteLayers();
      setStatus("Healthcare site overlays hidden. Location data layers are active for selections.");
    }
    updateFacilityLayerSummary();
    updateLegend();
  }

  function setCollapsibleSection(section, button, collapsed, label) {
    if (!section || !button) {
      return;
    }
    section.classList.toggle("is-collapsed", collapsed);
    button.setAttribute("aria-expanded", String(!collapsed));
    button.title = `${collapsed ? "Show" : "Hide"} ${label}`;
    const content = document.getElementById(button.getAttribute("aria-controls"));
    if (content) {
      content.hidden = collapsed;
    }
    button.innerHTML = `<i data-lucide="${collapsed ? "chevron-down" : "chevron-up"}"></i>`;
    refreshIcons();
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

  function renderFacilityLayerControls() {
    facilityLayerList.replaceChildren();

    FACILITY_SITE_LAYERS.forEach((layer) => {
      const item = document.createElement("div");
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      const copy = document.createElement("span");
      const name = document.createElement("span");
      const meta = document.createElement("span");
      const sourceLink = document.createElement("a");

      item.className = "data-layer-item facility-layer-item";
      item.classList.toggle("is-active", selectedFacilityLayerKeys.has(layer.key));
      item.style.setProperty("--facility-layer-color", layer.color);

      label.className = "data-layer-option facility-layer-option";
      checkbox.type = "checkbox";
      checkbox.value = layer.key;
      checkbox.checked = selectedFacilityLayerKeys.has(layer.key);
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
      facilityLayerList.append(item);
    });

    updateFacilityLayerSummary();
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

  function handleFacilityLayerToggle(event) {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "checkbox") {
      return;
    }

    const layer = FACILITY_SITE_LAYERS.find((item) => item.key === input.value);
    if (!layer) {
      return;
    }

    if (input.checked) {
      selectedFacilityLayerKeys.add(layer.key);
    } else {
      selectedFacilityLayerKeys.delete(layer.key);
    }

    const item = input.closest(".data-layer-item");
    if (item) {
      item.classList.toggle("is-active", input.checked);
    }
    syncFacilitySiteLayers();
    updateFacilityLayerSummary();
    updateLegend();
    const visibleText = mapFocus === "healthcare-sites" && input.checked ? "visible" : input.checked ? "selected" : "hidden";
    setStatus(`${layer.label} site layer ${visibleText}.`);
  }

  function updateDataLayerSummary() {
    const applicableLayers = getApplicableHealthLayers(currentMode);
    const activeCount = getSelectedApplicableHealthLayers(currentMode).length;
    dataLayerSummary.textContent = `${numberFormatter.format(activeCount)}/${numberFormatter.format(applicableLayers.length)} active`;
  }

  function updateFacilityLayerSummary() {
    const label = mapFocus === "healthcare-sites" ? "visible" : "selected";
    facilityLayerSummary.textContent = `${numberFormatter.format(selectedFacilityLayerKeys.size)}/${numberFormatter.format(FACILITY_SITE_LAYERS.length)} ${label}`;
  }

  function getApplicableHealthLayers(mode) {
    return HEALTH_DATA_LAYERS.filter((layer) => layer.modes.includes(mode));
  }

  function getSelectedApplicableHealthLayers(mode) {
    return getApplicableHealthLayers(mode).filter((layer) => selectedHealthLayerKeys.has(layer.key));
  }

  function syncFacilitySiteLayers() {
    FACILITY_SITE_LAYERS.forEach((config) => {
      const visible = mapFocus === "healthcare-sites" && selectedFacilityLayerKeys.has(config.key);
      const existingLayer = facilityLayersByKey.get(config.key);

      if (visible && !existingLayer) {
        const layer = createFacilitySiteLayer(config);
        facilityLayersByKey.set(config.key, layer);
        layer.addTo(map);
      } else if (!visible && existingLayer) {
        map.removeLayer(existingLayer);
        facilityLayersByKey.delete(config.key);
      }
    });
    bringFacilityLayersToFront();
  }

  function createFacilitySiteLayer(config) {
    const layer = L.esri.featureLayer({
      url: config.url,
      where: config.where || "1=1",
      fields: ["*"],
      simplifyFactor: 0.3,
      precision: 5,
      pointToLayer: (feature, latlng) => L.circleMarker(latlng, getFacilityMarkerStyle(config)),
    });
    let loaded = false;
    layer.on("load", () => {
      if (!loaded) {
        loaded = true;
        setStatus(`${config.label} site layer ready.`);
      }
    });
    layer.on("requesterror", () => {
      setStatus(`Could not load ${config.label} site layer.`);
    });
    layer.on("click", (event) => selectFacilitySite(config, event));
    return layer;
  }

  function getFacilityMarkerStyle(config, selected) {
    return {
      radius: selected ? 8 : 5,
      color: selected ? "#000000" : "#ffffff",
      weight: selected ? 2.5 : 1.4,
      fillColor: config.color,
      fillOpacity: selected ? 0.98 : 0.82,
      opacity: 0.95,
      bubblingMouseEvents: false,
    };
  }

  function selectFacilitySite(config, event) {
    if (event.originalEvent) {
      L.DomEvent.stop(event.originalEvent);
    }
    const featureLayer = event.layer;
    const properties = (featureLayer && featureLayer.feature && featureLayer.feature.properties) || {};
    const title = getFacilityFieldValue(properties, config.titleFields) || config.label;
    if (featureLayer && typeof featureLayer.setStyle === "function") {
      featureLayer.setStyle(getFacilityMarkerStyle(config, true));
      map.once("popupclose", () => {
        if (typeof featureLayer.setStyle === "function") {
          featureLayer.setStyle(getFacilityMarkerStyle(config));
        }
      });
    }

    L.popup({
      className: "facility-popup",
      maxWidth: 460,
    })
      .setLatLng(event.latlng)
      .setContent(createFacilityPopupContent(config, properties, title))
      .openOn(map);
    setStatus(`${config.label}: ${title}`);
  }

  function createFacilityPopupContent(config, properties, title) {
    const container = document.createElement("div");
    const heading = document.createElement("h3");
    const source = document.createElement("p");
    const facts = document.createElement("dl");

    container.className = "facility-popup-content";
    heading.textContent = title;
    source.textContent = `${config.sourceName} - ${config.coverage}`;
    facts.className = "facility-popup-facts";

    config.popupFields.forEach((item) => {
      const value = getFacilityPopupFieldValue(properties, item);
      if (!value) {
        return;
      }
      const term = document.createElement("dt");
      const detail = document.createElement("dd");
      term.textContent = item.label;
      if (item.link && isLikelyUrl(value)) {
        const link = document.createElement("a");
        link.href = createFacilityLinkHref(value);
        link.target = "_blank";
        link.rel = "noreferrer";
        link.textContent = value;
        detail.append(link);
      } else {
        detail.textContent = value;
      }
      facts.append(term, detail);
    });
    appendFacilityContextFacts(facts, config, properties);

    container.append(heading, source);
    if (facts.children.length) {
      container.append(facts);
    }
    return container;
  }

  function appendFacilityContextFacts(facts, config, properties) {
    if (config.key !== "hifld-hospitals") {
      return;
    }

    const countyFips = normalizeCountyFips(getFacilityFieldValue(properties, ["COUNTYFIPS"]));
    if (!countyFips) {
      return;
    }

    const term = document.createElement("dt");
    const detail = document.createElement("dd");
    term.textContent = "County population";
    detail.textContent = "Loading...";
    facts.append(term, detail);

    getPopulationData()
      .then((store) => {
        const record = store && store.byCounty && store.byCounty.get(countyFips);
        const estimate = record ? parseNumeric(record[`POPESTIMATE${store.latestYear}`]) : null;
        if (estimate === null) {
          term.remove();
          detail.remove();
          return;
        }
        detail.textContent = `${numberFormatter.format(estimate)} (${store.latestYear} estimate)`;
      })
      .catch(() => {
        term.remove();
        detail.remove();
      });
  }

  function normalizeCountyFips(value) {
    const digits = String(value || "").replace(/\D/g, "");
    return digits.length === 5 ? digits : "";
  }

  function getFacilityPopupFieldValue(properties, item) {
    if (item.format === "coordinates") {
      const latitude = Number(getFacilityFieldValue(properties, [item.fields[0]]));
      const longitude = Number(getFacilityFieldValue(properties, [item.fields[1]]));
      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return "";
      }
      return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
    }

    const value = getFacilityFieldValue(properties, item.fields);
    if (!value) {
      return "";
    }

    if (item.format === "integer") {
      const number = Number(String(value).replace(/,/g, ""));
      return Number.isFinite(number) && number > 0 ? numberFormatter.format(number) : "";
    }

    return value;
  }

  function getFacilityFieldValue(properties, fields) {
    for (const field of fields || []) {
      const value = properties[field];
      if (value === null || value === undefined) {
        continue;
      }
      const text = String(value).trim();
      if (!text || text === "0" || isEmptyFacilityValue(text)) {
        continue;
      }
      return text;
    }
    return "";
  }

  function isEmptyFacilityValue(value) {
    const normalized = String(value || "").trim().toUpperCase();
    return ["-999", "N/A", "NA", "NULL", "NONE", "UNKNOWN", "NOT AVAILABLE", "NOT REPORTED", "NOT PROVIDED"].includes(normalized);
  }

  function isLikelyUrl(value) {
    const text = String(value || "").trim();
    return /^https?:\/\//i.test(text) || /^[a-z0-9.-]+\.[a-z]{2,}(?:\/|$)/i.test(text);
  }

  function createFacilityLinkHref(value) {
    const text = String(value || "").trim();
    return /^https?:\/\//i.test(text) ? text : `https://${text}`;
  }

  function bringFacilityLayersToFront() {
    facilityLayersByKey.forEach((layer) => {
      if (layer && typeof layer.bringToFront === "function") {
        layer.bringToFront();
      }
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
    bringFacilityLayersToFront();
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
    closeMetricHelp();

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
    closeMetricHelp();
    if (highlightLayer) {
      map.removeLayer(highlightLayer);
      highlightLayer = null;
    }
    selectionTitle.textContent = "Nothing selected";
    selectionSubtitle.textContent = "Click a boundary or choose a search result.";
    detailsList.replaceChildren();
    expandedDataButton.classList.add("is-hidden");
    expandedDataButton.setAttribute("aria-expanded", "false");
    exportLocaleButton.classList.add("is-hidden");
    exportLocaleButton.disabled = false;
    const buttonText = expandedDataButton.querySelector("span");
    if (buttonText) {
      buttonText.textContent = "Selection details";
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
    exportLocaleButton.classList.remove("is-hidden");
    expandedDataButton.setAttribute("aria-expanded", String(dashboardExpanded));
    const buttonText = expandedDataButton.querySelector("span");
    if (buttonText) {
      buttonText.textContent = dashboardExpanded ? "Hide selection details" : "Selection details";
    }

    if (!dashboardExpanded) {
      expandedDataDashboard.classList.add("is-hidden");
      expandedDataDashboard.replaceChildren();
      return;
    }

    expandedDataDashboard.classList.remove("is-hidden");
    renderExpandedDetails(properties, config, populationContext);
  }

  async function exportCurrentLocaleData() {
    if (!currentSelection) {
      return;
    }

    const selection = currentSelection;
    exportLocaleButton.disabled = true;
    setStatus("Preparing locale export...");

    try {
      const populationContext = await ensureSelectionPopulationContext(selection);
      const rows = await buildLocaleExportRows(selection.feature.properties, selection.config, populationContext);
      const csv = createCsv(rows);
      const filename = `${slugifyFilename(getFeatureName(selection.feature.properties))}-${selection.config.key}-data.csv`;
      downloadTextFile(filename, csv, "text/csv;charset=utf-8");
      setStatus(`Exported ${getFeatureName(selection.feature.properties)} data.`);
    } catch (error) {
      setStatus("Could not export the selected locale data.");
    } finally {
      exportLocaleButton.disabled = false;
    }
  }

  async function ensureSelectionPopulationContext(selection) {
    const context = selection.populationContext;
    if (context && context.populationSummary) {
      return context;
    }
    const summary = await getPopulationSummaryForFeature(selection.feature, selection.config);
    if (selection === currentSelection) {
      currentSelection = {
        ...currentSelection,
        populationContext: summary,
      };
      renderDetails(selection.feature.properties, selection.config, summary);
    }
    return summary;
  }

  async function buildLocaleExportRows(properties, config, populationContext) {
    const populationStore = await getPopulationData();
    let healthStore = null;
    try {
      healthStore = await getHealthData();
    } catch (error) {
      healthStore = null;
    }

    const locale = {
      name: getFeatureName(properties),
      type: config.singular,
      id: getLocaleExportId(properties, config),
      matchKey: getDataLayerMatchKey(properties, config),
    };
    const rows = [];

    appendLocaleExportRow(rows, locale, {
      section: "Locale",
      metric: "Name",
      value: locale.name,
    });
    appendLocaleExportRow(rows, locale, {
      section: "Locale",
      metric: "Type",
      value: locale.type,
    });
    appendLocaleExportRow(rows, locale, {
      section: "Locale",
      metric: "Match key",
      value: locale.matchKey,
    });
    getSelectionDetailRows(properties, config, populationContext)
      .filter(([label]) => !String(label).startsWith("Data layers"))
      .forEach(([label, value]) => {
        appendLocaleExportRow(rows, locale, {
          section: "Selection details",
          metric: label,
          value,
        });
      });

    const summary = populationContext && populationContext.populationSummary;
    if (summary && Array.isArray(summary.estimateSeries)) {
      summary.estimateSeries.forEach((point) => {
        appendLocaleExportRow(rows, locale, {
          section: "Population trend",
          metric: "Population estimate",
          value: formatNumberValue(point.value),
          raw: point.value,
          period: point.year,
          source: summary.sourcePath,
        });
      });
    }

    if (!healthStore) {
      appendLocaleExportRow(rows, locale, {
        section: "Data layer",
        metric: "Status",
        value: "Could not load local health layer values.",
      });
      return rows;
    }

    getApplicableHealthLayers(config.mode).forEach((layer) => {
      const record = getHealthLayerRecord(healthStore, layer, properties, config, populationStore);
      if (!record || !record.metrics || !record.metrics.length) {
        appendLocaleExportRow(rows, locale, {
          section: "Data layer",
          layerKey: layer.key,
          layer: layer.label,
          metric: "Status",
          value: getMissingHealthLayerStatus(layer, healthStore.sources && healthStore.sources[layer.key], config),
          source: layer.sourceUrl,
        });
        return;
      }

      record.metrics.forEach((metricItem) => {
        appendLocaleExportRow(rows, locale, {
          section: "Data layer",
          layerKey: layer.key,
          layer: record.title || layer.label,
          metric: metricItem.label,
          value: metricItem.value,
          raw: metricItem.raw,
          kind: metricItem.kind,
          aggregate: metricItem.aggregate,
          period: record.period,
          source: record.source || layer.sourceUrl,
          note: record.note,
        });
      });

      Object.entries(record.history || {}).forEach(([metricLabel, points]) => {
        points.forEach((point) => {
          appendLocaleExportRow(rows, locale, {
            section: "Data layer history",
            layerKey: layer.key,
            layer: record.title || layer.label,
            metric: metricLabel,
            value: point.value,
            raw: point.raw,
            kind: point.kind,
            period: point.period,
            source: record.source || layer.sourceUrl,
            note: record.note,
          });
        });
      });
    });

    return rows;
  }

  function appendLocaleExportRow(rows, locale, values) {
    rows.push({
      locale_name: locale.name,
      locale_type: locale.type,
      locale_id: locale.id,
      match_key: locale.matchKey,
      section: values.section || "",
      layer_key: values.layerKey || "",
      layer: values.layer || "",
      metric: values.metric || "",
      value: values.value === null || values.value === undefined ? "" : values.value,
      raw: values.raw === null || values.raw === undefined ? "" : values.raw,
      kind: values.kind || "",
      aggregate: values.aggregate || "",
      period: values.period === null || values.period === undefined ? "" : values.period,
      source: values.source || "",
      note: values.note || "",
    });
  }

  function getLocaleExportId(properties, config) {
    if (config.mode === "states") {
      return getStateIdForProperties(properties);
    }
    if (config.mode === "counties") {
      return getCountyIdForProperties(properties);
    }
    return properties.CBSA || properties.GEOID || "";
  }

  function createCsv(rows) {
    const columns = [
      "locale_name",
      "locale_type",
      "locale_id",
      "match_key",
      "section",
      "layer_key",
      "layer",
      "metric",
      "value",
      "raw",
      "kind",
      "aggregate",
      "period",
      "source",
      "note",
    ];
    return [
      columns.join(","),
      ...rows.map((row) => columns.map((column) => csvCell(row[column])).join(",")),
    ].join("\n");
  }

  function csvCell(value) {
    const text = String(value === null || value === undefined ? "" : value);
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadTextFile(filename, text, type) {
    const blob = new Blob([text], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function slugifyFilename(value) {
    const slug = String(value || "locale")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return slug || "locale";
  }

  function renderDetails(properties, config, populationContext) {
    selectionTitle.textContent = getFeatureName(properties);
    selectionSubtitle.textContent = getFeatureSubtitle(properties, config);
    detailsList.replaceChildren();
    renderSelectionDashboard(detailsList, properties, config, populationContext);
    updateExpandedDashboard(properties, config, populationContext);
  }

  function getSelectionDetailRows(properties, config, populationContext) {
    return [
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
  }

  function renderExpandedDetails(properties, config, populationContext) {
    expandedDataDashboard.replaceChildren();
    const list = document.createElement("dl");
    list.className = "details-list";
    const rows = getSelectionDetailRows(properties, config, populationContext);

    rows.forEach(([label, value]) => {
      const term = document.createElement("dt");
      const description = document.createElement("dd");
      term.textContent = label;
      description.textContent = value;
      list.append(term, description);
    });

    expandedDataDashboard.append(list);
  }

  function renderSelectionDashboard(container, properties, config, populationContext) {
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
    container.append(kpiGrid);

    if (summary) {
      container.append(createPopulationTrendPanel(summary));
      container.append(createPopulationDriverPanel(summary));
    } else {
      container.append(createDashboardMessage(loadingMessage || "Population data is not available for this selection."));
    }

    container.append(createDataLayerDashboard(properties, config));
    hydrateDataLayerValues(properties, config, dashboardToken, container);
    refreshIcons();
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
    const panel = createDashboardPanel("Population growth");
    const chart = document.createElement("div");
    const series = (summary.estimateSeries || []).filter((item) => Number.isFinite(item.value));
    const growthSeries = series.slice(1).map((item, index) => ({
      year: item.year,
      value: item.value - series[index].value,
      previousValue: series[index].value,
    }));
    const values = growthSeries.map((item) => item.value).filter(Number.isFinite);

    if (!values.length) {
      panel.append(createDashboardMessage("No growth series is available."));
      return panel;
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const hasContraction = min < 0;
    const maxAbs = Math.max(Math.abs(min), Math.abs(max), 1);
    const zeroLine = hasContraction ? 50 : 0;
    const maxBarHeight = hasContraction ? 47 : 88;
    const axisValues = hasContraction
      ? [maxAbs, 0, -maxAbs]
      : [max, Math.round(max / 2), 0];
    const axisLabels = document.createElement("div");
    const plot = document.createElement("div");
    const zero = document.createElement("div");
    const bars = document.createElement("div");
    const years = document.createElement("div");

    chart.className = "growth-chart";
    axisLabels.className = "growth-axis-labels";
    axisValues.forEach((value) => {
      const label = document.createElement("span");
      label.textContent = formatCompactSignedNumber(value);
      axisLabels.append(label);
    });

    plot.className = "growth-plot";
    zero.className = "growth-zero-line";
    zero.style.bottom = `${zeroLine}%`;
    bars.className = "growth-bars";
    years.className = "growth-years";

    growthSeries.forEach((item) => {
      const column = document.createElement("div");
      const fill = document.createElement("span");
      const label = document.createElement("em");
      const magnitude = Math.min(maxBarHeight, (Math.abs(item.value) / maxAbs) * maxBarHeight);
      const bottom = item.value < 0 ? zeroLine - magnitude : zeroLine;

      column.className = "growth-bar-column";
      fill.className = item.value < 0 ? "is-negative" : "is-positive";
      fill.style.height = `${Math.max(2, magnitude)}%`;
      fill.style.bottom = `${bottom}%`;
      fill.title = `${item.year}: ${formatSignedNumber(item.value)} (${formatSignedPercent((item.value / item.previousValue) * 100)})`;
      label.textContent = String(item.year).slice(-2);
      column.append(fill);
      bars.append(column);
      years.append(label);
    });

    plot.append(zero, bars);
    chart.append(axisLabels, plot, document.createElement("span"), years);
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
    const footer = document.createElement("div");
    const link = document.createElement("a");
    const expandButton = document.createElement("button");

    card.className = "dashboard-layer-card";
    card.dataset.layerKey = layer.key;
    card._defaultMetrics = getDefaultLayerMetrics(layer, properties, config);
    header.className = "dashboard-layer-header";
    title.textContent = layer.label;
    source.textContent = layer.sourceName;
    header.append(title, source);
    match.textContent = getHealthLayerNote(layer, config, properties);
    status.className = "dashboard-layer-status";
    status.textContent = getDataLayerStatus(layer, properties, config);
    metrics.className = "dashboard-layer-metrics";
    card._defaultMetrics.forEach((metric) => {
      metrics.append(createLayerMetric(metric.label, metric.value));
    });
    footer.className = "dashboard-layer-footer";
    link.href = layer.sourceUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "Source";
    expandButton.className = "metric-expand-button";
    expandButton.type = "button";
    expandButton.title = `Expand ${layer.label} metrics`;
    expandButton.setAttribute("aria-label", `Expand ${layer.label} metrics`);
    expandButton.innerHTML = '<i data-lucide="maximize-2"></i><span>Expand</span>';
    expandButton.addEventListener("click", () => openMetricHelp(card, layer, config));
    footer.append(link, expandButton);
    card.append(header, match, status, metrics, footer);
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

  async function hydrateDataLayerValues(properties, config, dashboardToken, container) {
    let store;
    try {
      store = await getHealthData();
    } catch (error) {
      if (dashboardToken === dashboardDataToken) {
        setDataLayerCardsMessage("Could not load local health layer values.", container);
      }
      return;
    }

    if (dashboardToken !== dashboardDataToken || !store) {
      return;
    }

    const populationStore = await getPopulationData();
    if (dashboardToken !== dashboardDataToken) {
      return;
    }
    getSelectedApplicableHealthLayers(config.mode).forEach((layer) => {
      const record = getHealthLayerRecord(store, layer, properties, config, populationStore);
      updateDataLayerCard(layer, record, store.sources && store.sources[layer.key], container, store, config, populationStore, properties);
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

  function getHealthLayerRecord(store, layer, properties, config, populationStore) {
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
    if (layer.directCbsaOnly) {
      return null;
    }
    return aggregateHealthLayerForMsa(store, layer, populationStore);
  }

  function aggregateHealthLayerForMsa(store, layer, populationStore) {
    const summary =
      currentSelection &&
      currentSelection.populationContext &&
      currentSelection.populationContext.populationSummary;
    const countyIds = summary && Array.isArray(summary.countyIds) ? summary.countyIds : [];
    const recordEntries = countyIds
      .map((countyId) => [countyId, store.counties && store.counties[countyId] && store.counties[countyId][layer.key]])
      .filter(([, record]) => Boolean(record));
    const records = recordEntries.map(([, record]) => record);

    if (!records.length) {
      return null;
    }

    const metricGroups = new Map();
    recordEntries.forEach(([countyId, record]) => {
      const population = getComparisonPopulation("counties", countyId, populationStore);
      (record.metrics || []).forEach((metricItem) => {
        const key = metricItem.label;
        if (!metricGroups.has(key)) {
          metricGroups.set(key, {
            label: metricItem.label,
            kind: metricItem.kind,
            aggregate: metricItem.aggregate || "sum",
            values: [],
            weightedTotal: 0,
            weightTotal: 0,
          });
        }
        const value = Number(metricItem.raw);
        if (Number.isFinite(value)) {
          const group = metricGroups.get(key);
          group.values.push(value);
          if (population && shouldPopulationWeightMetric(metricItem)) {
            group.weightedTotal += value * population;
            group.weightTotal += population;
          }
        }
      });
    });

    const metrics = Array.from(metricGroups.values()).filter((group) => group.values.length).map((group) => {
      const raw =
        group.aggregate === "average"
          ? group.weightTotal
            ? group.weightedTotal / group.weightTotal
            : group.values.reduce((total, value) => total + value, 0) / group.values.length
          : group.values.reduce((total, value) => total + value, 0);
      return {
        label: group.label,
        raw,
        kind: group.kind,
        aggregate: group.aggregate,
        value: formatHealthMetricValue(raw, group.kind),
      };
    });
    applyDerivedAggregateMetrics(metrics);
    return {
      title: layer.label,
      period: Array.from(new Set(records.map((record) => record.period).filter(Boolean))).join(", "),
      source: records[0].source,
      metrics,
      note: `Aggregated from ${numberFormatter.format(records.length)} counties`,
      comparisonLabel: "selected MSA component counties",
      metricComparisons: buildIqrByMetric(
        recordEntries,
        "counties",
        populationStore,
        { metrics },
        null,
        summary && summary.estimate,
      ),
      history: buildAggregatedMetricHistory(recordEntries, populationStore),
    };
  }

  function buildMetricComparisonData(store, layer, config, record, populationStore, properties) {
    if (record && record.metricComparisons) {
      return {
        scopeLabel: record.comparisonLabel || "matched component records",
        metrics: record.metricComparisons,
      };
    }

    const scope = getComparisonScope(config);
    const recordEntries = Object.entries((store && store[scope.key]) || {})
      .map(([geoid, item]) => [geoid, item && item[layer.key]])
      .filter(([, item]) => Boolean(item));

    return {
      scopeLabel: scope.label,
      metrics: buildIqrByMetric(
        recordEntries,
        scope.key,
        populationStore,
        record,
        getSelectedComparisonGeoid(properties, config),
        getSelectedPopulationEstimate(),
      ),
    };
  }

  function getSelectedPopulationEstimate() {
    return (
      currentSelection &&
      currentSelection.populationContext &&
      currentSelection.populationContext.populationSummary &&
      currentSelection.populationContext.populationSummary.estimate
    );
  }

  function shouldPopulationWeightMetric(metricItem) {
    return (
      metricItem.kind === "percent" ||
      metricItem.label.includes("SVI percentile") ||
      metricItem.label.includes("theme") ||
      metricItem.label === "All-cancer incidence rate"
    );
  }

  function applyDerivedAggregateMetrics(metrics) {
    const uninsured = getMetricRaw(metrics, "Uninsured");
    const insured = getMetricRaw(metrics, "Insured");
    const insuranceTotal = Number(uninsured) + Number(insured);
    if (Number.isFinite(uninsured) && Number.isFinite(insured) && Number.isFinite(insuranceTotal) && insuranceTotal > 0) {
      setMetricRaw(metrics, "Uninsured rate", (uninsured / insuranceTotal) * 100, "percent");
      setMetricRaw(metrics, "Insured rate", (insured / insuranceTotal) * 100, "percent");
    }

    const beneficiaries = getMetricRaw(metrics, "Beneficiaries");
    const medicareAdvantage = getMetricRaw(metrics, "Medicare Advantage");
    if (Number.isFinite(beneficiaries) && beneficiaries > 0 && Number.isFinite(medicareAdvantage)) {
      setMetricRaw(metrics, "MA share", (medicareAdvantage / beneficiaries) * 100, "percent");
    }
  }

  function getMetricRaw(metrics, label) {
    const metricItem = metrics.find((item) => item.label === label);
    return metricItem ? Number(metricItem.raw) : null;
  }

  function setMetricRaw(metrics, label, raw, kind) {
    const metricItem = metrics.find((item) => item.label === label);
    if (!metricItem || !Number.isFinite(raw)) {
      return;
    }
    metricItem.raw = raw;
    metricItem.kind = kind || metricItem.kind;
    metricItem.value = formatHealthMetricValue(raw, metricItem.kind);
  }

  function buildAggregatedMetricHistory(recordEntries, populationStore) {
    const periodGroups = new Map();
    recordEntries.forEach(([countyId, record]) => {
      Object.entries(record.history || {}).forEach(([label, points]) => {
        points.forEach((point) => {
          const period = String(point.period);
          if (!periodGroups.has(period)) {
            periodGroups.set(period, []);
          }
          let periodRecord = periodGroups.get(period).find((item) => item.countyId === countyId);
          if (!periodRecord) {
            periodRecord = { countyId, metrics: [] };
            periodGroups.get(period).push(periodRecord);
          }
          periodRecord.metrics.push({
            label,
            raw: point.raw,
            kind: point.kind,
            aggregate: getMetricAggregate(record, label),
            value: point.value,
          });
        });
      });
    });

    const history = {};
    Array.from(periodGroups.entries()).sort(([a], [b]) => String(a).localeCompare(String(b))).forEach(([period, periodEntries]) => {
      const syntheticRecord = aggregateHistoryPeriod(periodEntries, populationStore);
      syntheticRecord.metrics.forEach((metricItem) => {
        history[metricItem.label] = history[metricItem.label] || [];
        history[metricItem.label].push({
          period,
          raw: metricItem.raw,
          value: metricItem.value,
          kind: metricItem.kind,
        });
      });
    });
    return history;
  }

  function getMetricAggregate(record, label) {
    const metricItem = (record.metrics || []).find((item) => item.label === label);
    return (metricItem && metricItem.aggregate) || "sum";
  }

  function aggregateHistoryPeriod(periodEntries, populationStore) {
    const metricGroups = new Map();
    periodEntries.forEach(({ countyId, metrics }) => {
      const population = getComparisonPopulation("counties", countyId, populationStore);
      metrics.forEach((metricItem) => {
        if (!metricGroups.has(metricItem.label)) {
          metricGroups.set(metricItem.label, {
            label: metricItem.label,
            kind: metricItem.kind,
            aggregate: metricItem.aggregate || "sum",
            values: [],
            weightedTotal: 0,
            weightTotal: 0,
          });
        }
        const value = Number(metricItem.raw);
        if (!Number.isFinite(value)) {
          return;
        }
        const group = metricGroups.get(metricItem.label);
        group.values.push(value);
        if (population && shouldPopulationWeightMetric(metricItem)) {
          group.weightedTotal += value * population;
          group.weightTotal += population;
        }
      });
    });
    const metrics = Array.from(metricGroups.values()).filter((group) => group.values.length).map((group) => {
      const raw =
        group.aggregate === "average"
          ? group.weightTotal
            ? group.weightedTotal / group.weightTotal
            : group.values.reduce((total, value) => total + value, 0) / group.values.length
          : group.values.reduce((total, value) => total + value, 0);
      return {
        label: group.label,
        raw,
        kind: group.kind,
        aggregate: group.aggregate,
        value: formatHealthMetricValue(raw, group.kind),
      };
    });
    applyDerivedAggregateMetrics(metrics);
    return { metrics };
  }

  function getSelectedComparisonGeoid(properties, config) {
    if (!properties) {
      return null;
    }
    if (config.mode === "states") {
      return getStateIdForProperties(properties);
    }
    if (config.mode === "counties") {
      return getCountyIdForProperties(properties);
    }
    return properties.CBSA || properties.GEOID || null;
  }

  function getComparisonScope(config) {
    if (config.mode === "states") {
      return { key: "states", label: "state records" };
    }
    if (config.mode === "counties") {
      return { key: "counties", label: "county records" };
    }
    return { key: "cbsas", label: "CBSA records" };
  }

  function buildIqrByMetric(recordEntries, scopeKey, populationStore, selectedRecord, selectedGeoid, selectedPopulation) {
    const groups = new Map();
    const selectedMetricValues = new Map(
      ((selectedRecord && selectedRecord.metrics) || [])
        .filter((metricItem) => Number.isFinite(Number(metricItem.raw)))
        .map((metricItem) => [metricItem.label, Number(metricItem.raw)]),
    );
    recordEntries.forEach(([geoid, record]) => {
      (record.metrics || []).forEach((metricItem) => {
        const value = Number(metricItem.raw);
        if (!Number.isFinite(value)) {
          return;
        }
        if (!groups.has(metricItem.label)) {
          groups.set(metricItem.label, {
            values: [],
            kind: metricItem.kind,
            perCapitaValues: [],
            perCapitaRule: getPerCapitaRule(metricItem),
          });
        }
        const group = groups.get(metricItem.label);
        group.values.push(value);
        const population = getComparisonPopulation(scopeKey, geoid, populationStore);
        if (group.perCapitaRule && population) {
          group.perCapitaValues.push((value / population) * group.perCapitaRule.scale);
        }
      });
    });

    return Object.fromEntries(
      Array.from(groups.entries()).map(([label, group]) => [
        label,
        {
          raw: buildIqrSummary(group.values, group.kind, selectedMetricValues.get(label)),
          perCapita: buildIqrSummary(
            group.perCapitaValues,
            group.perCapitaRule && group.perCapitaRule.kind,
            getSelectedPerCapitaValue(
              selectedMetricValues.get(label),
              group.perCapitaRule,
              selectedPopulation || getComparisonPopulation(scopeKey, selectedGeoid, populationStore),
            ),
          ),
          perCapitaRule: group.perCapitaRule,
        },
      ]),
    );
  }

  function buildIqrSummary(values, kind, selectedValue) {
    const sorted = values.map(Number).filter(Number.isFinite).sort((a, b) => a - b);
    if (!sorted.length) {
      return null;
    }

    return {
      q1: quantile(sorted, 0.25),
      q3: quantile(sorted, 0.75),
      count: sorted.length,
      kind,
      percentile: percentileRank(sorted, selectedValue),
    };
  }

  function getSelectedPerCapitaValue(raw, rule, population) {
    if (!rule || !Number.isFinite(raw) || !population) {
      return null;
    }
    return (raw / population) * rule.scale;
  }

  function getPerCapitaRule(metricItem) {
    if (!metricItem || metricItem.kind === "percent" || metricItem.kind === "text") {
      return null;
    }
    return PER_CAPITA_METRICS[metricItem.label] || null;
  }

  function getComparisonPopulation(scopeKey, geoid, populationStore) {
    if (!populationStore || !geoid) {
      return null;
    }

    const populationField = `POPESTIMATE${populationStore.latestYear}`;
    let populationRecord = null;
    if (scopeKey === "states") {
      populationRecord = populationStore.byState.get(padCode(geoid, 2));
    } else if (scopeKey === "counties") {
      populationRecord = populationStore.byCounty.get(String(geoid).padStart(5, "0"));
    }

    const population = populationRecord ? parseNumeric(populationRecord[populationField]) : null;
    return population && population > 0 ? population : null;
  }

  function quantile(sortedValues, probability) {
    if (sortedValues.length === 1) {
      return sortedValues[0];
    }
    const position = (sortedValues.length - 1) * probability;
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    const weight = position - lowerIndex;
    return sortedValues[lowerIndex] * (1 - weight) + sortedValues[upperIndex] * weight;
  }

  function percentileRank(sortedValues, value) {
    const number = Number(value);
    if (!Number.isFinite(number) || !sortedValues.length) {
      return null;
    }
    let below = 0;
    let equal = 0;
    sortedValues.forEach((item) => {
      if (item < number) {
        below += 1;
      } else if (item === number) {
        equal += 1;
      }
    });
    return ((below + equal * 0.5) / sortedValues.length) * 100;
  }

  function updateDataLayerCard(layer, record, source, container, store, config, populationStore, properties) {
    const card = Array.from(container.querySelectorAll(".dashboard-layer-card")).find(
      (item) => item.dataset.layerKey === layer.key,
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
    card._healthRecord = record || null;
    card._healthComparison = buildMetricComparisonData(store, layer, config, record, populationStore, properties);
    if (record && record.metrics && record.metrics.length) {
      status.textContent = record.note || `Loaded ${record.period || "current"} values.`;
      record.metrics.forEach((metricItem) => {
        metrics.append(createLayerMetric(metricItem.label, metricItem.value));
      });
      return;
    }

    const statusText = getMissingHealthLayerStatus(layer, source, config);
    status.textContent = statusText;
  }

  function getMissingHealthLayerStatus(layer, source, config) {
    if (source && source.status === "source-only") {
      return source.note || "Source linked; bulk data requires source terms.";
    }
    if (config.mode === "metros" && layer.directCbsaOnly) {
      return "No CMS records matched this CBSA directly; county-footprint rollup is intentionally not used for this layer.";
    }
    return "No matching local value for this geography.";
  }

  function setDataLayerCardsMessage(message, container) {
    container.querySelectorAll(".dashboard-layer-status").forEach((status) => {
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

  function openMetricHelp(card, layer, config) {
    closeMetricHelp();

    const overlay = document.createElement("div");
    const dialog = document.createElement("section");
    const header = document.createElement("div");
    const title = document.createElement("h2");
    const closeButton = document.createElement("button");
    const summary = document.createElement("p");
    const list = document.createElement("div");
    const record = card._healthRecord;
    const metrics = record && record.metrics && record.metrics.length ? record.metrics : card._defaultMetrics || [];
    const comparison = card._healthComparison || {};
    const history = (record && record.history) || {};

    overlay.className = "metric-help-overlay";
    overlay.dataset.metricHelpOverlay = "true";
    dialog.className = "metric-help-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "metricHelpTitle");
    header.className = "metric-help-header";
    title.id = "metricHelpTitle";
    title.textContent = layer.label;
    closeButton.className = "metric-help-close";
    closeButton.type = "button";
    closeButton.title = "Close";
    closeButton.setAttribute("aria-label", "Close expanded metrics");
    closeButton.innerHTML = '<i data-lucide="x"></i>';
    closeButton.addEventListener("click", closeMetricHelp);
    header.append(title, closeButton);

    summary.className = "metric-help-summary";
    summary.textContent = record
      ? `IQR and percentile values compare this selection with ${comparison.scopeLabel || "comparable local records"}. Five-year trend charts appear when the local extract has comparable prior periods.`
      : "Local values have not loaded for this geography yet; the descriptions below explain the visible card fields.";

    list.className = "metric-help-list";
    list.dataset.dynamicLayout = "true";
    const layoutClass = getMetricHelpLayoutClass(metrics.length);
    if (layoutClass) {
      list.classList.add(layoutClass);
    }
    metrics.forEach((metricItem) => {
      list.append(createMetricHelpItem(
        metricItem,
        comparison.metrics && comparison.metrics[metricItem.label],
        history[metricItem.label],
      ));
    });

    dialog.append(header, summary, list);
    overlay.append(dialog);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        closeMetricHelp();
      }
    });
    document.body.append(overlay);
    refreshIcons();
    const fitLayout = () => fitMetricHelpDialog(dialog, list, metrics.length);
    overlay._metricHelpResizeHandler = fitLayout;
    window.addEventListener("resize", fitLayout);
    requestAnimationFrame(fitLayout);
    closeButton.focus();
  }

  function fitMetricHelpDialog(dialog, list, count) {
    if (!dialog || !list) {
      return;
    }

    const maxColumns = getMetricHelpMaxColumns(dialog, count);
    const preferredColumns = Math.min(getPreferredMetricHelpColumns(count), maxColumns);
    const columnCandidates = buildMetricHelpColumnCandidates(preferredColumns, maxColumns);
    const densityClasses = ["", "metric-help-dialog--compact", "metric-help-dialog--dense"];

    dialog.classList.remove("metric-help-dialog--compact", "metric-help-dialog--dense", "metric-help-dialog--scrollable");
    for (const densityClass of densityClasses) {
      applyMetricHelpDensity(dialog, densityClass);
      for (const columns of columnCandidates) {
        list.style.setProperty("--metric-help-columns", String(columns));
        if (!metricHelpNeedsScroll(dialog)) {
          return;
        }
      }
    }

    applyMetricHelpDensity(dialog, "metric-help-dialog--dense");
    list.style.setProperty("--metric-help-columns", String(maxColumns));
    if (metricHelpNeedsScroll(dialog)) {
      dialog.classList.add("metric-help-dialog--scrollable");
    }
  }

  function getPreferredMetricHelpColumns(count) {
    if (count === 4) {
      return 2;
    }
    if (count === 3 || count === 6) {
      return 3;
    }
    if (count >= 5) {
      return Math.min(count, 5);
    }
    return Math.max(1, count);
  }

  function getMetricHelpMaxColumns(dialog, count) {
    const availableWidth = Math.max(280, dialog.clientWidth - 32);
    const minColumnWidth = availableWidth >= 1380 ? 255 : availableWidth >= 1100 ? 285 : 320;
    return Math.max(1, Math.min(count || 1, 6, Math.floor(availableWidth / minColumnWidth)));
  }

  function buildMetricHelpColumnCandidates(preferredColumns, maxColumns) {
    const candidates = [];
    for (let columns = preferredColumns; columns <= maxColumns; columns += 1) {
      candidates.push(columns);
    }
    for (let columns = preferredColumns - 1; columns >= 1; columns -= 1) {
      candidates.push(columns);
    }
    return Array.from(new Set(candidates));
  }

  function applyMetricHelpDensity(dialog, densityClass) {
    dialog.classList.remove("metric-help-dialog--compact", "metric-help-dialog--dense");
    if (densityClass) {
      dialog.classList.add(densityClass);
    }
  }

  function metricHelpNeedsScroll(dialog) {
    return dialog.scrollHeight > dialog.clientHeight + 2 || dialog.scrollWidth > dialog.clientWidth + 2;
  }

  function getMetricHelpLayoutClass(count) {
    if (count === 3) {
      return "metric-help-list--three";
    }
    if (count === 4) {
      return "metric-help-list--four";
    }
    if (count === 6) {
      return "metric-help-list--six";
    }
    return "";
  }

  function closeMetricHelp() {
    document.querySelectorAll("[data-metric-help-overlay='true']").forEach((overlay) => {
      if (overlay._metricHelpResizeHandler) {
        window.removeEventListener("resize", overlay._metricHelpResizeHandler);
      }
      overlay.remove();
    });
  }

  function createMetricHelpItem(metricItem, comparison, historyPoints) {
    const item = document.createElement("article");
    const heading = document.createElement("h3");
    const description = document.createElement("p");
    const facts = document.createElement("dl");
    const historyChart = createMetricHistoryChart(metricItem, historyPoints);

    item.className = "metric-help-item";
    heading.textContent = metricItem.label;
    description.textContent = getMetricExplanation(metricItem.label, metricItem.kind);
    facts.className = "metric-help-facts";
    appendHelpFact(facts, "Shown value", metricItem.value || "--");
    appendHelpFact(facts, "Interquartile range", formatIqr(comparison));
    if (comparison && comparison.raw && Number.isFinite(comparison.raw.percentile)) {
      appendHelpFact(facts, "Raw percentile", formatPercentile(comparison.raw.percentile));
    }
    if (comparison && comparison.perCapitaRule) {
      appendHelpFact(facts, "Shown per capita", formatShownPerCapita(metricItem, comparison.perCapitaRule));
      appendHelpFact(facts, "Per-capita IQR", formatPerCapitaIqr(comparison));
      if (comparison.perCapita && Number.isFinite(comparison.perCapita.percentile)) {
        appendHelpFact(facts, "Per-capita percentile", formatPercentile(comparison.perCapita.percentile));
      }
    }
    const comparisonCount = getComparisonCount(comparison);
    if (comparisonCount) {
      appendHelpFact(facts, "Comparison records", numberFormatter.format(comparisonCount));
    }
    item.append(heading, description, facts);
    if (historyChart) {
      item.append(historyChart);
    }
    return item;
  }

  function createMetricHistoryChart(metricItem, historyPoints) {
    const points = normalizeMetricHistory(historyPoints);
    if (points.length < 2) {
      return null;
    }

    const section = document.createElement("div");
    const header = document.createElement("div");
    const title = document.createElement("span");
    const caption = document.createElement("strong");
    const chart = createMetricHistorySvg(points, metricItem.kind);

    section.className = "metric-history";
    header.className = "metric-history-header";
    title.textContent = "Five-year change";
    caption.textContent = formatHistoryChange(points, metricItem.kind);
    header.append(title, caption);
    section.append(header, chart);
    return section;
  }

  function normalizeMetricHistory(historyPoints) {
    return (Array.isArray(historyPoints) ? historyPoints : [])
      .map((point) => ({
        period: String(point.period || "").trim(),
        raw: Number(point.raw),
        kind: point.kind,
      }))
      .filter((point) => point.period && Number.isFinite(point.raw))
      .sort((a, b) => getHistorySortValue(a.period) - getHistorySortValue(b.period))
      .slice(-5);
  }

  function getHistorySortValue(period) {
    const text = String(period || "");
    const yearMatch = text.match(/\d{4}/);
    if (yearMatch) {
      return Number(yearMatch[0]);
    }
    const number = Number(text.replace(/[^\d.-]/g, ""));
    return Number.isFinite(number) ? number : 0;
  }

  function createMetricHistorySvg(points, kind) {
    const width = 360;
    const height = 138;
    const margin = { top: 12, right: 12, bottom: 26, left: 46 };
    const plotWidth = width - margin.left - margin.right;
    const plotHeight = height - margin.top - margin.bottom;
    const values = points.map((point) => point.raw);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (min === max) {
      const spread = Math.max(Math.abs(max) * 0.08, kind === "percent" ? 1 : 1);
      min -= spread;
      max += spread;
    } else if (min < 0 && max > 0) {
      min = Math.min(min, 0);
      max = Math.max(max, 0);
    }

    const range = max - min || 1;
    const xFor = (index) => margin.left + (points.length === 1 ? plotWidth / 2 : (plotWidth * index) / (points.length - 1));
    const yFor = (value) => margin.top + ((max - value) / range) * plotHeight;
    const svg = svgElement("svg", {
      class: "metric-history-chart",
      viewBox: `0 0 ${width} ${height}`,
      role: "img",
      "aria-label": `Five-year ${points[0].period} to ${points[points.length - 1].period} trend`,
    });
    const yTicks = [max, min + range / 2, min];

    yTicks.forEach((value) => {
      const y = yFor(value);
      svg.append(svgElement("line", {
        class: "metric-history-grid",
        x1: margin.left,
        x2: width - margin.right,
        y1: y,
        y2: y,
      }));
      const label = svgElement("text", {
        class: "metric-history-y-label",
        x: margin.left - 8,
        y: y + 3,
        "text-anchor": "end",
      });
      label.textContent = formatHistoryAxisValue(value, kind);
      svg.append(label);
    });

    if (min < 0 && max > 0) {
      const zeroY = yFor(0);
      svg.append(svgElement("line", {
        class: "metric-history-zero",
        x1: margin.left,
        x2: width - margin.right,
        y1: zeroY,
        y2: zeroY,
      }));
    }

    svg.append(svgElement("line", {
      class: "metric-history-axis",
      x1: margin.left,
      x2: margin.left,
      y1: margin.top,
      y2: height - margin.bottom,
    }));
    svg.append(svgElement("line", {
      class: "metric-history-axis",
      x1: margin.left,
      x2: width - margin.right,
      y1: height - margin.bottom,
      y2: height - margin.bottom,
    }));

    const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${xFor(index).toFixed(2)} ${yFor(point.raw).toFixed(2)}`).join(" ");
    svg.append(svgElement("path", {
      class: "metric-history-line",
      d: path,
    }));

    points.forEach((point, index) => {
      const x = xFor(index);
      const y = yFor(point.raw);
      const marker = svgElement("circle", {
        class: "metric-history-point",
        cx: x,
        cy: y,
        r: 3.4,
      });
      const tooltip = svgElement("title");
      tooltip.textContent = `${point.period}: ${formatHealthMetricValue(point.raw, point.kind || kind)}`;
      marker.append(tooltip);
      svg.append(marker);

      const label = svgElement("text", {
        class: "metric-history-x-label",
        x,
        y: height - 7,
        "text-anchor": "middle",
      });
      label.textContent = formatHistoryPeriodLabel(point.period);
      svg.append(label);
    });

    return svg;
  }

  function svgElement(name, attributes = {}) {
    const element = document.createElementNS(SVG_NS, name);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, String(value));
    });
    return element;
  }

  function formatHistoryChange(points, kind) {
    const first = points[0];
    const last = points[points.length - 1];
    const change = last.raw - first.raw;
    const relative = first.raw ? formatSignedPercent((change / Math.abs(first.raw)) * 100) : "";
    return `${first.period} to ${last.period}: ${formatSignedHealthMetricChange(change, kind)}${relative ? ` (${relative})` : ""}`;
  }

  function formatSignedHealthMetricChange(value, kind) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    const sign = number > 0 ? "+" : "";
    if (kind === "percent") {
      return `${sign}${number.toFixed(1)} pp`;
    }
    if (kind === "decimal") {
      const precision = Math.abs(number) < 10 ? 2 : 1;
      return `${sign}${number.toFixed(precision)}`;
    }
    return `${sign}${numberFormatter.format(Math.round(number))}`;
  }

  function formatHistoryAxisValue(value, kind) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    if (kind === "percent") {
      const precision = Math.abs(number) < 10 ? 1 : 0;
      return `${number.toFixed(precision)}%`;
    }
    if (kind === "decimal") {
      const precision = Math.abs(number) < 10 ? 2 : Math.abs(number) < 100 ? 1 : 0;
      return number.toFixed(precision);
    }
    return formatCompactNumber(number);
  }

  function formatHistoryPeriodLabel(period) {
    const text = String(period || "");
    return text.length > 7 ? text.replace(/^20/, "'") : text;
  }

  function appendHelpFact(container, label, value) {
    const term = document.createElement("dt");
    const description = document.createElement("dd");
    term.textContent = label;
    description.textContent = value;
    container.append(term, description);
  }

  function getMetricExplanation(label, kind) {
    if (METRIC_EXPLANATIONS[label]) {
      return METRIC_EXPLANATIONS[label];
    }
    if (kind === "percent") {
      return "A percentage value imported from the source extract.";
    }
    if (kind === "decimal") {
      return "A decimal score or rate imported from the source extract.";
    }
    if (kind === "text") {
      return "A text classification imported from the source extract.";
    }
    return "A numeric value imported from the source extract.";
  }

  function formatIqr(comparison) {
    const rawComparison = comparison && (comparison.raw || comparison);
    if (!rawComparison || !Number.isFinite(rawComparison.q1) || !Number.isFinite(rawComparison.q3)) {
      return "Not available";
    }
    return `${formatHealthMetricValue(rawComparison.q1, rawComparison.kind)} to ${formatHealthMetricValue(rawComparison.q3, rawComparison.kind)}`;
  }

  function formatPercentile(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    const rounded = Math.max(0, Math.min(100, Math.round(number)));
    const mod100 = rounded % 100;
    const suffix =
      mod100 >= 11 && mod100 <= 13
        ? "th"
        : rounded % 10 === 1
          ? "st"
          : rounded % 10 === 2
            ? "nd"
            : rounded % 10 === 3
              ? "rd"
              : "th";
    return `${rounded}${suffix} percentile`;
  }

  function formatShownPerCapita(metricItem, rule) {
    const raw = Number(metricItem.raw);
    const population =
      currentSelection &&
      currentSelection.populationContext &&
      currentSelection.populationContext.populationSummary &&
      currentSelection.populationContext.populationSummary.estimate;
    if (!rule || !Number.isFinite(raw) || !population) {
      return "Not available";
    }
    return formatPerCapitaValue((raw / population) * rule.scale, rule);
  }

  function formatPerCapitaIqr(comparison) {
    if (
      !comparison ||
      !comparison.perCapitaRule ||
      !comparison.perCapita ||
      !Number.isFinite(comparison.perCapita.q1) ||
      !Number.isFinite(comparison.perCapita.q3)
    ) {
      return "Not available";
    }
    const rule = comparison.perCapitaRule;
    return `${formatPerCapitaNumber(comparison.perCapita.q1, rule)} to ${formatPerCapitaNumber(comparison.perCapita.q3, rule)} ${rule.unit}`;
  }

  function formatPerCapitaValue(value, rule) {
    if (!Number.isFinite(value) || !rule) {
      return "Not available";
    }
    return `${formatPerCapitaNumber(value, rule)} ${rule.unit}`;
  }

  function formatPerCapitaNumber(value, rule) {
    if (!Number.isFinite(value) || !rule) {
      return "Not available";
    }
    if (rule.kind === "currency") {
      return currencyFormatter.format(value);
    }
    const precision = Math.abs(value) < 10 ? 2 : Math.abs(value) < 100 ? 1 : 0;
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: precision }).format(value);
  }

  function getComparisonCount(comparison) {
    if (!comparison) {
      return null;
    }
    if (comparison.raw && comparison.raw.count) {
      return comparison.raw.count;
    }
    if (comparison.perCapita && comparison.perCapita.count) {
      return comparison.perCapita.count;
    }
    return comparison.count || null;
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

    FACILITY_SITE_LAYERS.filter((config) => mapFocus === "healthcare-sites" && selectedFacilityLayerKeys.has(config.key)).forEach((config) => {
      const row = document.createElement("div");
      const swatch = document.createElement("span");
      const label = document.createElement("span");

      row.className = "legend-row";
      swatch.className = "legend-swatch legend-swatch-site";
      swatch.style.border = `2px solid ${config.color}`;
      swatch.style.background = config.color;
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

  function formatCompactSignedNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    if (number === 0) {
      return "0";
    }
    const formatter = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: Math.abs(number) < 10000 ? 1 : 0,
    });
    return `${number > 0 ? "+" : ""}${formatter.format(number)}`;
  }

  function formatCompactNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return "";
    }
    const formatter = new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: Math.abs(number) < 10000 ? 1 : 0,
    });
    return formatter.format(number);
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
