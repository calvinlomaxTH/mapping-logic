# US Boundary Explorer

A static browser app for exploring United States boundary layers:

- States and Washington, DC
- Counties and county-equivalent areas
- Metropolitan Statistical Areas, with an optional micropolitan overlay

The app uses Leaflet, Esri Leaflet, OpenStreetMap tiles, and public U.S. Census TIGERweb geography services.
Selection details are enriched with the local county and state population estimate file at `data/co-est2025-alldata.csv`.

## Run

From this directory:

```sh
python3 -m http.server 5173
```

Then open:

```text
http://127.0.0.1:5173
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
git commit -m "Add US Boundary Explorer"
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
