#!/usr/bin/env python3
import csv
import io
import json
import re
import time
import urllib.parse
import urllib.request
import zipfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "health" / "health-layer-values.json"
POPULATION_CSV = ROOT / "data" / "co-est2025-alldata.csv"

STATE_ABBR = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT",
    "10": "DE", "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL",
    "18": "IN", "19": "IA", "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD",
    "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT", "31": "NE",
    "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND",
    "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD",
    "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA", "54": "WV",
    "55": "WI", "56": "WY",
}
ABBR_STATE = {value: key for key, value in STATE_ABBR.items()}

SOURCES = {
    "brfss": "https://data.cdc.gov/resource/dttw-5yxu.json",
    "cms-care-compare": "https://data.cms.gov/provider-data/sites/default/files/resources/893c372430d9d71a1c52737d01239d47_1777413958/Hospital_General_Information.csv",
    "hrsa-health-center-program": "https://data.hrsa.gov/DataDownload/DD_Files/Health_Center_Service_Delivery_and_LookAlike_Sites.csv",
    "sahie": "https://www2.census.gov/programs-surveys/sahie/datasets/time-series/estimates-acs/sahie-2023-csv.zip",
    "cms-medicare-enrollment": "https://data.cms.gov/data-api/v1/dataset/d7fabe1e-d19b-4333-9eff-e80e0643f2fd/data",
    "medicaid-enrollment": "https://data.medicaid.gov/api/1/datastore/query/3da9f4e6-7976-43a8-8d1b-72f2c557a5ca/0",
    "cdc-atsdr-svi": "https://onemap.cdc.gov/onemapservices/rest/services/SVI/CDC_ATSDR_Social_Vulnerability_Index_2022_USA/FeatureServer/1/query",
    "cms-hospital-cost-reports": "https://data.cms.gov/data-api/v1/dataset/44060663-47d8-4ced-a115-b53b4c270acb/data",
    "nih-seer-cancer-statistics": "https://statecancerprofiles.cancer.gov/incidencerates/",
    "cdc-fluvaxview": "https://data.cdc.gov/resource/rdng-ki53.json",
}


def fetch_text(url, params=None, timeout=90):
    if params:
        url = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"User-Agent": "ODIN Map Viewer data fetcher"})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return response.read().decode("utf-8", "replace")


def fetch_json(url, params=None, timeout=90):
    return json.loads(fetch_text(url, params, timeout))


def clean_name(value):
    text = str(value or "").strip().upper()
    text = re.sub(r"\b(COUNTY|PARISH|BOROUGH|CENSUS AREA|MUNICIPALITY|CITY AND BOROUGH)\b", "", text)
    text = re.sub(r"[^A-Z0-9 ]+", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def row_value(row, *names):
    normalized = {re.sub(r"[^a-z0-9]", "", key.lower()): value for key, value in row.items() if key}
    for name in names:
        key = re.sub(r"[^a-z0-9]", "", name.lower())
        if key in normalized:
            return normalized[key]
    return ""


def digits(value):
    return re.sub(r"\D", "", str(value or ""))


def fips_from_value(value, width):
    text = digits(value)
    if not text:
        return ""
    return text.zfill(width)[-width:]


def number(value):
    text = str(value or "").replace(",", "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def fmt_value(value, kind="number"):
    if value is None:
        return ""
    if kind == "percent":
        return f"{value:.1f}%"
    if kind == "decimal":
        return f"{value:.2f}"
    if abs(value - round(value)) < 0.00001:
        return f"{int(round(value)):,}"
    return f"{value:,.1f}"


def metric(label, value, kind="number", aggregate="sum"):
    return {"label": label, "value": fmt_value(value, kind), "raw": value, "kind": kind, "aggregate": aggregate}


def text_metric(label, value):
    return {"label": label, "value": str(value or "").strip() or "--", "raw": None, "kind": "text", "aggregate": "first"}


def add(target, scope, geoid, layer, title, metrics, period="", source=""):
    if not geoid or not metrics:
        return
    bucket = target[scope].setdefault(str(geoid), {})
    bucket[layer] = {"title": title, "period": period, "source": source or SOURCES.get(layer, ""), "metrics": metrics}


def build_geo_indexes():
    by_county_name = {}
    state_names = {}
    with POPULATION_CSV.open(newline="", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            state = str(row_value(row, "STATE")).strip().zfill(2)
            county = str(row_value(row, "COUNTY")).strip().zfill(3)
            summary_level = str(row_value(row, "SUMLEV")).strip().zfill(3)
            abbr = STATE_ABBR.get(state)
            if summary_level == "040":
                state_names[str(row_value(row, "STNAME")).strip().upper()] = state
            if summary_level == "050" and abbr:
                by_county_name[(abbr, clean_name(row_value(row, "CTYNAME")))] = f"{state}{county}"
    return by_county_name, state_names


def average(values):
    values = [value for value in values if value is not None]
    return sum(values) / len(values) if values else None


def ingest_brfss(data):
    params = {
        "$limit": "50000",
        "$select": "locationabbr,locationdesc,questionid,question,response,data_value,data_value_unit",
        "$where": "year='2024' AND break_out='Overall' AND response='Yes'",
    }
    wanted = {
        "ADDEPEV3": "Depression",
        "BPHIGH6": "High blood pressure",
        "CVDINFR4": "Heart attack",
        "DIABETE4": "Diabetes",
        "HLTHPLN1": "Health coverage",
    }
    rows = fetch_json(SOURCES["brfss"], params)
    grouped = defaultdict(list)
    for row in rows:
        state = ABBR_STATE.get(str(row.get("locationabbr", "")).upper())
        label = wanted.get(row.get("questionid"))
        value = number(row.get("data_value"))
        if state and label and value is not None:
            grouped[state].append(metric(label, value, "percent", "average"))
    for state, metrics in grouped.items():
        add(data, "states", state, "brfss", "BRFSS", metrics, "2024")


def ingest_care_compare(data, county_index):
    text = fetch_text(SOURCES["cms-care-compare"], timeout=120)
    reader = csv.DictReader(io.StringIO(text))
    grouped = defaultdict(lambda: {"count": 0, "ratings": []})
    for row in reader:
        abbr = str(row_value(row, "State")).upper().strip()
        state = ABBR_STATE.get(abbr)
        county = county_index.get((abbr, clean_name(row_value(row, "County/Parish", "County Name", "County"))))
        rating = number(row_value(row, "Hospital overall rating"))
        for scope, geoid in (("states", state), ("counties", county)):
            if geoid:
                grouped[(scope, geoid)]["count"] += 1
                if rating is not None:
                    grouped[(scope, geoid)]["ratings"].append(rating)
    for (scope, geoid), values in grouped.items():
        add(data, scope, geoid, "cms-care-compare", "CMS Care Compare", [
            metric("Hospitals", values["count"]),
            metric("Avg overall rating", average(values["ratings"]), "decimal", "average"),
        ], "current")


def ingest_hrsa(data, county_index):
    text = fetch_text(SOURCES["hrsa-health-center-program"], timeout=120)
    reader = csv.DictReader(io.StringIO(text))
    grouped = defaultdict(int)
    for row in reader:
        abbr = str(row_value(
            row,
            "state",
            "site state",
            "state abbreviation",
            "site_state_abbreviation",
            "site state abbreviation",
        )).upper().strip()
        state = ABBR_STATE.get(abbr)
        county_fips = fips_from_value(row_value(
            row,
            "county fips",
            "county_fips",
            "site county fips",
            "site_county_fips",
            "state and county federal information processing standard code",
            "FIPS",
        ), 5)
        county = county_fips if len(county_fips) == 5 else county_index.get((abbr, clean_name(row_value(
            row,
            "county",
            "site county",
            "site_county",
            "county name",
            "complete county name",
            "county equivalent name",
        ))))
        for scope, geoid in (("states", state), ("counties", county)):
            if geoid:
                grouped[(scope, geoid)] += 1
    for (scope, geoid), count in grouped.items():
        add(data, scope, geoid, "hrsa-health-center-program", "HRSA Health Center Program", [
            metric("Service delivery sites", count),
        ], "current")


def ingest_sahie(data):
    raw = urllib.request.urlopen(SOURCES["sahie"], timeout=120).read()
    archive = zipfile.ZipFile(io.BytesIO(raw))
    lines = io.TextIOWrapper(archive.open(archive.namelist()[0]), encoding="latin1").read().splitlines()
    header_index = next(index for index, line in enumerate(lines) if line.startswith("year,version,"))
    reader = csv.DictReader(lines[header_index:])
    for row in reader:
        if row.get("agecat") != "0" or row.get("racecat") != "0" or row.get("sexcat") != "0" or row.get("iprcat") != "0":
            continue
        state = str(row.get("statefips", "")).zfill(2)
        county = str(row.get("countyfips", "")).zfill(3)
        scope = "states" if row.get("geocat") == "40" else "counties"
        geoid = state if scope == "states" else f"{state}{county}"
        add(data, scope, geoid, "sahie", "SAHIE", [
            metric("Uninsured", number(row.get("NUI"))),
            metric("Insured", number(row.get("NIC"))),
            metric("Uninsured rate", number(row.get("PCTUI")), "percent", "average"),
            metric("Insured rate", number(row.get("PCTIC")), "percent", "average"),
        ], "2023")


def ingest_medicare(data):
    rows = fetch_json(SOURCES["cms-medicare-enrollment"], {
        "size": "10000",
        "filter[YEAR]": "2025",
        "filter[MONTH]": "Year",
    }, timeout=120)
    for row in rows:
        level = row.get("BENE_GEO_LVL")
        fips = digits(row.get("BENE_FIPS_CD", ""))
        if level == "State" and 1 <= len(fips) <= 2:
            scope, geoid = "states", fips.zfill(2)
        elif level == "County" and len(fips) >= 4:
            scope, geoid = "counties", fips.zfill(5)[-5:]
        else:
            continue
        total = number(row.get("TOT_BENES"))
        ma = number(row.get("MA_AND_OTH_BENES"))
        add(data, scope, geoid, "cms-medicare-enrollment", "CMS Medicare Enrollment", [
            metric("Beneficiaries", total),
            metric("Medicare Advantage", ma),
            metric("MA share", (ma / total * 100) if total and ma is not None else None, "percent", "average"),
        ], "2025")


def ingest_medicaid(data, state_names):
    rows = []
    offset = 0
    while True:
        batch = fetch_json(SOURCES["medicaid-enrollment"], {"limit": "5000", "offset": str(offset)}, timeout=120).get("results", [])
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < 5000:
            break
        offset += 5000
    latest = {}
    for row in rows:
        state = state_names.get(str(row.get("state", "")).strip().upper())
        program = str(row.get("programtype", "")).strip()
        month = int(str(row.get("month", "0")).strip() or 0)
        if state and program:
            key = (state, program)
            if key not in latest or month > latest[key]["month"]:
                latest[key] = {"month": month, "value": number(row.get("countenrolled"))}
    by_state = defaultdict(list)
    for (state, program), item in latest.items():
        by_state[state].append(metric(program, item["value"]))
    for state, metrics in by_state.items():
        add(data, "states", state, "medicaid-enrollment", "Medicaid Enrollment", metrics, "latest")


def ingest_svi(data):
    rows = []
    offset = 0
    page_size = 2000
    while True:
        params = {
            "f": "json",
            "where": "1=1",
            "outFields": "ST,STCNTY,RPL_THEMES,RPL_THEME1,RPL_THEME2,RPL_THEME3,RPL_THEME4,EP_POV150,EP_UNINSUR,EP_UNEMP,E_TOTPOP",
            "returnGeometry": "false",
            "resultOffset": str(offset),
            "resultRecordCount": str(page_size),
        }
        page = fetch_json(SOURCES["cdc-atsdr-svi"], params, timeout=120).get("features", [])
        rows.extend(page)
        if len(page) < page_size:
            break
        offset += page_size
    state_values = defaultdict(lambda: defaultdict(list))
    for item in rows:
        attrs = item.get("attributes", {})
        county = attrs.get("STCNTY")
        state = attrs.get("ST")
        metrics = [
            metric("Overall SVI percentile", number(attrs.get("RPL_THEMES")), "decimal", "average"),
            metric("Socioeconomic theme", number(attrs.get("RPL_THEME1")), "decimal", "average"),
            metric("Household theme", number(attrs.get("RPL_THEME2")), "decimal", "average"),
            metric("Poverty 150%", number(attrs.get("EP_POV150")), "percent", "average"),
            metric("Uninsured", number(attrs.get("EP_UNINSUR")), "percent", "average"),
            metric("Unemployment", number(attrs.get("EP_UNEMP")), "percent", "average"),
        ]
        add(data, "counties", county, "cdc-atsdr-svi", "CDC/ATSDR SVI", metrics, "2022")
        for metric_item in metrics:
            state_values[state][metric_item["label"]].append(metric_item["raw"])
    for state, values in state_values.items():
        add(data, "states", state, "cdc-atsdr-svi", "CDC/ATSDR SVI", [
            metric(label, average(raw_values), "percent" if "%" in label or label in ("Uninsured", "Unemployment") else "decimal", "average")
            for label, raw_values in values.items()
        ], "2022")


def ingest_hospital_cost_reports(data, county_index):
    rows = fetch_json(SOURCES["cms-hospital-cost-reports"], {"size": "5000", "sort": "-Fiscal Year End Date"}, timeout=120)
    grouped = defaultdict(lambda: {"count": 0, "beds": 0, "costs": 0, "revenue": 0})
    for row in rows:
        abbr = str(row_value(row, "State Code", "Provider State", "State")).upper().strip()
        state = ABBR_STATE.get(abbr)
        county_text = row_value(row, "County FIPS", "Provider County FIPS", "County Code", "County")
        county_digits = digits(county_text)
        if len(county_digits) == 5:
            county = county_digits
        elif len(county_digits) == 3 and state:
            county = f"{state}{county_digits}"
        else:
            county = county_index.get((abbr, clean_name(row_value(row, "County", "Provider County", "County Name"))))
        cbsa = fips_from_value(row_value(row, "Medicare CBSA Number", "CBSA Number", "CBSA"), 5)
        cbsa = cbsa if cbsa and cbsa != "00000" and cbsa != "99999" else ""
        for scope, geoid in (("states", state), ("counties", county), ("cbsas", cbsa)):
            if geoid:
                grouped[(scope, geoid)]["count"] += 1
                grouped[(scope, geoid)]["beds"] += number(row_value(row, "Number of Beds")) or 0
                grouped[(scope, geoid)]["costs"] += number(row_value(row, "Total Costs")) or 0
                grouped[(scope, geoid)]["revenue"] += number(row_value(row, "Net Patient Revenue")) or 0
    for (scope, geoid), values in grouped.items():
        add(data, scope, geoid, "cms-hospital-cost-reports", "CMS Hospital Cost Reports", [
            metric("Reports", values["count"]),
            metric("Beds", values["beds"]),
            metric("Total costs", values["costs"]),
            metric("Net patient revenue", values["revenue"]),
        ], "latest 5,000 reports")


def ingest_seer_cancer(data):
    base_params = {
        "stateFIPS": "00",
        "age": "001",
        "cancer": "001",
        "graph": "1",
        "output": "1",
        "race": "00",
        "ruralurban": "0",
        "sex": "0",
        "sortOrder": "desc",
        "sortVariableName": "rate",
        "type": "incd",
    }
    urls = {
        "states": f"{SOURCES['nih-seer-cancer-statistics']}index.php?{urllib.parse.urlencode({**base_params, 'areatype': 'state'})}",
        "counties": f"{SOURCES['nih-seer-cancer-statistics']}index.php?{urllib.parse.urlencode({**base_params, 'areatype': 'county'})}",
    }
    for scope, url in urls.items():
        text = fetch_text(url, timeout=120)
        lines = text.splitlines()
        header_index = next((index for index, line in enumerate(lines) if line.startswith("State,FIPS") or line.startswith("County,FIPS")), -1)
        if header_index < 0:
            continue
        reader = csv.reader(lines[header_index:])
        next(reader, None)
        for row in reader:
            if not row or row[0].startswith("Notes:"):
                break
            if scope == "states":
                if len(row) < 11:
                    continue
                fips = fips_from_value(row[1], 5)
                geoid = fips[:2]
                if geoid not in STATE_ABBR:
                    continue
                rate, annual_count, trend_label, trend_value = row[2], row[8], row[9], row[10]
            else:
                if len(row) < 12:
                    continue
                geoid = fips_from_value(row[1], 5)
                rate, annual_count, trend_label, trend_value = row[3], row[9], row[10], row[11]
            add(data, scope, geoid, "nih-seer-cancer-statistics", "NIH/NCI Cancer Statistics", [
                metric("All-cancer incidence rate", number(rate), "decimal", "average"),
                metric("Average annual cases", number(annual_count)),
                metric("Recent 5-year trend", number(trend_value), "percent", "average"),
                text_metric("Trend classification", trend_label),
            ], "2018-2022", url)


def ingest_fluvaxview(data):
    rows = fetch_json(SOURCES["cdc-fluvaxview"], {
        "$limit": "10000",
        "$select": "geography_name,curr_season,curr_estimate,current_season_week_ending",
        "$where": "geographic_level='State' AND comparison_type='Overall'",
        "$order": "current_season_week_ending DESC",
    }, timeout=120)
    seen = set()
    for row in rows:
        state_name = str(row.get("geography_name", "")).strip().upper()
        state = STATE_NAMES.get(state_name)
        if state and state not in seen:
            seen.add(state)
            add(data, "states", state, "cdc-fluvaxview", "CDC FluVaxView", [
                metric("Flu vaccine coverage", number(row.get("curr_estimate")), "percent", "average"),
            ], row.get("curr_season", "latest"))


STATE_NAMES = {}


def main():
    county_index, state_names = build_geo_indexes()
    global STATE_NAMES
    STATE_NAMES = state_names
    data = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sources": {key: {"url": value, "status": "pending"} for key, value in SOURCES.items()},
        "states": {},
        "counties": {},
        "cbsas": {},
    }
    tasks = [
        ("brfss", lambda: ingest_brfss(data)),
        ("cms-care-compare", lambda: ingest_care_compare(data, county_index)),
        ("hrsa-health-center-program", lambda: ingest_hrsa(data, county_index)),
        ("sahie", lambda: ingest_sahie(data)),
        ("cms-medicare-enrollment", lambda: ingest_medicare(data)),
        ("medicaid-enrollment", lambda: ingest_medicaid(data, state_names)),
        ("cdc-atsdr-svi", lambda: ingest_svi(data)),
        ("cms-hospital-cost-reports", lambda: ingest_hospital_cost_reports(data, county_index)),
        ("nih-seer-cancer-statistics", lambda: ingest_seer_cancer(data)),
        ("cdc-fluvaxview", lambda: ingest_fluvaxview(data)),
    ]
    for key, task in tasks:
        start = time.time()
        try:
            task()
            data["sources"][key]["status"] = "loaded"
            data["sources"][key]["seconds"] = round(time.time() - start, 2)
        except Exception as error:
            data["sources"][key]["status"] = "error"
            data["sources"][key]["error"] = str(error)
    OUT.write_text(json.dumps(data, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {OUT.relative_to(ROOT)}")
    print(json.dumps({key: value["status"] for key, value in data["sources"].items()}, indent=2))


if __name__ == "__main__":
    main()
