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


def fetch_api_rows(url, params=None, page_size=5000, timeout=120, max_pages=100):
    rows = []
    offset = 0
    params = dict(params or {})
    for _ in range(max_pages):
        page_params = {**params, "size": str(page_size), "offset": str(offset)}
        batch = fetch_json(url, page_params, timeout=timeout)
        if not batch:
            break
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


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


def clean_metrics(metrics):
    clean = []
    for item in metrics:
        if item.get("kind") == "text":
            value = str(item.get("value") or "").strip()
            if value and value.upper() not in ("--", "N/A", "NA", "NOT AVAILABLE", "SUPPRESSED"):
                clean.append(item)
            continue
        if item.get("raw") is not None:
            clean.append(item)
    return clean


def add(target, scope, geoid, layer, title, metrics, period="", source=""):
    metrics = clean_metrics(metrics)
    if not geoid or not metrics:
        return
    bucket = target[scope].setdefault(str(geoid), {})
    bucket[layer] = {"title": title, "period": period, "source": source or SOURCES.get(layer, ""), "metrics": metrics}


def attach_history(target, scope, geoid, layer, period, metrics):
    metrics = clean_metrics(metrics)
    record = target[scope].get(str(geoid), {}).get(layer)
    if not record or not period or not metrics:
        return
    history = record.setdefault("history", {})
    for item in metrics:
        if item.get("kind") == "text" or item.get("raw") is None:
            continue
        history.setdefault(item["label"], []).append({
            "period": str(period),
            "raw": item["raw"],
            "value": item["value"],
            "kind": item["kind"],
        })


def add_series(target, scope, geoid, layer, title, period_metrics, source=""):
    if not period_metrics:
        return
    latest_period = sorted(period_metrics.keys())[-1]
    add(target, scope, geoid, layer, title, period_metrics[latest_period], str(latest_period), source)
    for period in sorted(period_metrics.keys())[-5:]:
        attach_history(target, scope, geoid, layer, period, period_metrics[period])


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


def weighted_average(pairs):
    total_weight = 0
    total = 0
    for value, weight in pairs:
        if value is None or weight is None or weight <= 0:
            continue
        total += value * weight
        total_weight += weight
    return total / total_weight if total_weight else None


def sum_or_none(values):
    values = [value for value in values if value is not None]
    return sum(values) if values else None


def date_key(value):
    parts = [int(part) for part in re.findall(r"\d+", str(value or ""))]
    if len(parts) >= 3 and parts[0] > 1900:
        return (parts[0], parts[1], parts[2])
    if len(parts) >= 3:
        return (parts[2], parts[0], parts[1])
    return tuple(parts)


def ingest_brfss(data):
    years = [str(year) for year in range(2020, 2025)]
    params = {
        "$limit": "50000",
        "$select": "year,locationabbr,locationdesc,questionid,question,response,data_value,data_value_unit",
        "$where": f"year in({','.join(repr(year) for year in years)}) AND break_out='Overall' AND response='Yes'",
    }
    wanted = {
        "ADDEPEV3": "Depression",
        "BPHIGH6": "High blood pressure",
        "CVDINFR4": "Heart attack",
        "DIABETE4": "Diabetes",
        "HLTHPLN1": "Health coverage",
    }
    rows = fetch_json(SOURCES["brfss"], params)
    grouped = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    for row in rows:
        state = ABBR_STATE.get(str(row.get("locationabbr", "")).upper())
        year = str(row.get("year", "")).strip()
        label = wanted.get(row.get("questionid"))
        value = number(row.get("data_value"))
        if state and year and label and value is not None:
            grouped[state][year][label].append(value)
    for state, years_by_label in grouped.items():
        period_metrics = {
            year: [
                metric(label, average(values), "percent", "average")
                for label, values in labels.items()
            ]
            for year, labels in years_by_label.items()
        }
        add_series(data, "states", state, "brfss", "BRFSS", period_metrics)


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
            metric("Rated hospitals", len(values["ratings"])),
            metric("Avg overall rating", average(values["ratings"]), "decimal", "average"),
        ], "current")


def ingest_hrsa(data, county_index):
    text = fetch_text(SOURCES["hrsa-health-center-program"], timeout=120)
    reader = csv.DictReader(io.StringIO(text))
    grouped = defaultdict(int)
    for row in reader:
        status = str(row_value(row, "Site Status Description", "Health Center Status", "Status")).strip().upper()
        if status and status not in ("ACTIVE", "OPEN"):
            continue
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
    grouped = defaultdict(dict)
    for year in range(2019, 2024):
        url = SOURCES["sahie"].replace("sahie-2023-csv.zip", f"sahie-{year}-csv.zip")
        try:
            raw = urllib.request.urlopen(url, timeout=120).read()
        except Exception:
            continue
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
            grouped[(scope, geoid)][year] = [
                metric("Uninsured", number(row.get("NUI"))),
                metric("Insured", number(row.get("NIC"))),
                metric("Uninsured rate", number(row.get("PCTUI")), "percent", "average"),
                metric("Insured rate", number(row.get("PCTIC")), "percent", "average"),
            ]
    for (scope, geoid), period_metrics in grouped.items():
        add_series(data, scope, geoid, "sahie", "SAHIE", period_metrics, SOURCES["sahie"])


def ingest_medicare(data):
    grouped = defaultdict(dict)
    for year in range(2021, 2026):
        rows = fetch_json(SOURCES["cms-medicare-enrollment"], {
            "size": "10000",
            "filter[YEAR]": str(year),
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
            grouped[(scope, geoid)][year] = [
                metric("Beneficiaries", total),
                metric("Medicare Advantage", ma),
                metric("MA share", (ma / total * 100) if total and ma is not None else None, "percent", "average"),
            ]
    for (scope, geoid), period_metrics in grouped.items():
        add_series(data, scope, geoid, "cms-medicare-enrollment", "CMS Medicare Enrollment", period_metrics)


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
    yearly = {}
    for row in rows:
        state = state_names.get(str(row.get("state", "")).strip().upper())
        program = str(row.get("programtype", "")).strip()
        month = int(digits(row.get("month")) or 0)
        year = month // 100 if month >= 10000 else None
        if state and program:
            key = (state, program)
            if key not in latest or month > latest[key]["month"]:
                latest[key] = {"month": month, "value": number(row.get("countenrolled"))}
            if year:
                yearly_key = (state, program, year)
                if yearly_key not in yearly or month > yearly[yearly_key]["month"]:
                    yearly[yearly_key] = {"month": month, "value": number(row.get("countenrolled"))}
    by_state = defaultdict(list)
    for (state, program), item in latest.items():
        by_state[state].append(metric(program, item["value"]))
    for state, metrics in by_state.items():
        add(data, "states", state, "medicaid-enrollment", "Medicaid Enrollment", metrics, "latest")
    by_state_year = defaultdict(lambda: defaultdict(list))
    for (state, program, year), item in yearly.items():
        by_state_year[state][year].append(metric(program, item["value"]))
    for state, period_metrics in by_state_year.items():
        latest_record = data["states"].get(state, {}).get("medicaid-enrollment")
        if latest_record:
            for year in sorted(period_metrics.keys())[-5:]:
                attach_history(data, "states", state, "medicaid-enrollment", year, period_metrics[year])


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
        population = number(attrs.get("E_TOTPOP"))
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
            state_values[state][metric_item["label"]].append((metric_item["raw"], population))
    for state, values in state_values.items():
        add(data, "states", state, "cdc-atsdr-svi", "CDC/ATSDR SVI", [
            metric(label, weighted_average(raw_values), "percent" if "%" in label or label in ("Uninsured", "Unemployment") else "decimal", "average")
            for label, raw_values in values.items()
        ], "2022")


def ingest_hospital_cost_reports(data, county_index):
    rows = fetch_api_rows(SOURCES["cms-hospital-cost-reports"], {"sort": "-Fiscal Year End Date"}, timeout=120)
    latest_by_provider = {}
    latest_by_provider_year = {}
    for row in rows:
        provider_id = str(row_value(row, "Provider CCN", "CMS Certification Number (CCN)", "Provider Number", "Provider ID")).strip()
        report_id = str(row_value(row, "Report Record Number", "RPT_REC_NUM", "Report ID")).strip()
        key = provider_id or report_id
        if not key:
            continue
        current_date = date_key(row_value(row, "Fiscal Year End Date"))
        if key not in latest_by_provider or current_date > latest_by_provider[key]["date"]:
            latest_by_provider[key] = {"date": current_date, "row": row}
        if current_date:
            year_key = (key, current_date[0])
            if year_key not in latest_by_provider_year or current_date > latest_by_provider_year[year_key]["date"]:
                latest_by_provider_year[year_key] = {"date": current_date, "row": row}

    def scope_ids(row):
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
        return (("states", state), ("counties", county), ("cbsas", cbsa))

    def new_group():
        return {"count": 0, "beds": [], "costs": [], "revenue": []}

    def add_report(grouped, row):
        for scope, geoid in scope_ids(row):
            if geoid:
                grouped[(scope, geoid)]["count"] += 1
                for key, field in (
                    ("beds", "Number of Beds"),
                    ("costs", "Total Costs"),
                    ("revenue", "Net Patient Revenue"),
                ):
                    value = number(row_value(row, field))
                    if value is not None and value >= 0:
                        grouped[(scope, geoid)][key].append(value)

    def metrics_for(values):
        return [
            metric("Latest provider reports", values["count"]),
            metric("Beds", sum_or_none(values["beds"])),
            metric("Total costs", sum_or_none(values["costs"])),
            metric("Net patient revenue", sum_or_none(values["revenue"])),
        ]

    grouped = defaultdict(new_group)
    for row in (item["row"] for item in latest_by_provider.values()):
        add_report(grouped, row)
    for (scope, geoid), values in grouped.items():
        add(data, scope, geoid, "cms-hospital-cost-reports", "CMS Hospital Cost Reports", metrics_for(values), "latest report per provider")

    all_years = sorted({year for (_, year) in latest_by_provider_year.keys()})[-5:]
    yearly_grouped = {year: defaultdict(new_group) for year in all_years}
    for (_, year), item in latest_by_provider_year.items():
        if year in yearly_grouped:
            add_report(yearly_grouped[year], item["row"])
    for year in all_years:
        for (scope, geoid), values in yearly_grouped[year].items():
            attach_history(data, scope, geoid, "cms-hospital-cost-reports", year, metrics_for(values))


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
        "$limit": "50000",
        "$select": "geography_name,curr_season,curr_estimate,current_season_week_ending",
        "$where": "geographic_level='State' AND comparison_type='Overall'",
        "$order": "current_season_week_ending DESC",
    }, timeout=120)
    latest_by_state_season = {}
    for row in rows:
        state_name = str(row.get("geography_name", "")).strip().upper()
        state = STATE_NAMES.get(state_name)
        season = str(row.get("curr_season") or "").strip()
        week = str(row.get("current_season_week_ending") or "").strip()
        if state and season:
            key = (state, season)
            if key not in latest_by_state_season or week > latest_by_state_season[key]["week"]:
                latest_by_state_season[key] = {"week": week, "value": number(row.get("curr_estimate"))}
    by_state = defaultdict(dict)
    for (state, season), item in latest_by_state_season.items():
        by_state[state][season] = [
            metric("Flu vaccine coverage", item["value"], "percent", "average"),
        ]
    for state, period_metrics in by_state.items():
        add_series(data, "states", state, "cdc-fluvaxview", "CDC FluVaxView", period_metrics)


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
