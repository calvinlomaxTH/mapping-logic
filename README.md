# ODIN Map Viewer

A static browser app for exploring United States boundary layers:

- States and Washington, DC
- Counties and county-equivalent areas
- Metropolitan Statistical Areas, with an optional micropolitan overlay

The app uses Leaflet, Esri Leaflet, OpenStreetMap and Esri basemap tiles, and public U.S. Census TIGERweb geography services.
Selection details are enriched with the local county and state population estimate file at `data/co-est2025-alldata.csv`.
The sidebar also includes a configurable health data layer catalog for BRFSS, CMS Care Compare, HRSA Health Center Program data, SAHIE, Medicare and Medicaid enrollment, CDC/ATSDR SVI, CMS hospital cost reports, NIH SEER cancer statistics, and CDC FluVaxView. The app filters that catalog by the active geography mode and shows an expanded dashboard for the selected boundary. Population charts are computed from the local Census CSV, and health layer values are loaded from the compact file generated at `data/health/health-layer-values.json`.

## Run

From this directory:

```sh
python3 -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173
```

## Refresh Health Data

The health layer extract can be regenerated from public agency sources:

```sh
python3 scripts/fetch_health_datasets.py
```

## Deploy to GitHub Pages

This project is configured for GitHub Pages through GitHub Actions. The workflow is in `.github/workflows/pages.yml`, and `.nojekyll` tells Pages to serve the static files exactly as they are.

### One-time GitHub setup

1. Create a new GitHub repository.
2. In the GitHub repository, go to **Settings** > **Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push this project to the `main` branch.
5. Open the **Actions** tab and wait for **Deploy GitHub Pages** to finish.
6. Open the deployed URL shown on the workflow run, or visit:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

### First push from this folder

If this folder is not already a git repository:

```sh
git init
git branch -M main
git add .
git commit -m "Add ODIN Map Viewer"
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If this folder is already connected to GitHub:

```sh
git add .
git commit -m "Configure GitHub Pages"
git push
```

## Data Sources

- Local Census county/state population estimates: `data/co-est2025-alldata.csv`
- U.S. Census TIGERweb REST services: https://tigerweb.geo.census.gov/tigerwebmain/TIGERweb_restmapservice.html
- TIGERweb current WMS MapServer: https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/tigerWMS_Current/MapServer
- OpenStreetMap basemap tiles: https://www.openstreetmap.org/copyright
- Esri World Topographic basemap tiles: https://www.esri.com/en-us/legal/terms/full-master-agreement
- CDC BRFSS annual survey data: https://www.cdc.gov/brfss/annual_data/annual_data.htm
- CMS Care Compare provider data: https://data.cms.gov/provider-data/
- HRSA Health Center Program data: https://data.hrsa.gov/tools/data-reporting/program-data
- Census SAHIE: https://www.census.gov/topics/health/sahie.html
- CMS Medicare enrollment reports: https://data.cms.gov/summary-statistics-on-beneficiary-enrollment/medicare-and-medicaid-reports
- Medicaid data: https://data.medicaid.gov/
- CDC/ATSDR Social Vulnerability Index: https://www.atsdr.cdc.gov/place-health/php/svi/index.html
- CMS Hospital Provider Cost Report data: https://data.cms.gov/provider-compliance/cost-reports/hospital-provider-cost-report
- NIH/NCI State Cancer Profiles incidence rates: https://statecancerprofiles.cancer.gov/incidencerates/
- CDC FluVaxView: https://www.cdc.gov/fluvaxview/index.html
- Generated health layer extract: `data/health/health-layer-values.json`
