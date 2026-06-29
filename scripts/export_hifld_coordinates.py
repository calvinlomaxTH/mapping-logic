#!/usr/bin/env python3
"""Export HIFLD healthcare facility layers to one coordinate table."""

import argparse
import csv
import json
import re
import sys
import urllib.parse
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "data" / "hifld" / "hifld_facility_coordinates.csv"
USER_AGENT = "ODIN Map Viewer HIFLD exporter"

HIFLD_HOSPITALS_FEATURESERVER = (
    "https://services.arcgis.com/XG15cJAlne2vxtgt/ArcGIS/rest/services/"
    "Hospitals_hifld/FeatureServer/0"
)
HIFLD_MEDICAL_FACILITIES_FEATURESERVER = (
    "https://services9.arcgis.com/FF3qnCUixr5w9JQi/ArcGIS/rest/services/"
    "US_HIFLD_Assets/FeatureServer/2"
)

COMPACT_COLUMNS = [
    "layer",
    "facility_category",
    "name",
    "asset_type",
    "facility_type",
    "hospital_type",
    "status",
    "beds",
    "total_staff",
    "trauma",
    "helipad",
    "owner",
    "address",
    "city",
    "state",
    "zip",
    "county",
    "county_fips",
    "phone",
    "website",
    "latitude",
    "longitude",
    "original_object_id",
]

RAW_REFERENCE_COLUMNS = [
    "source",
    "source_url",
]

BASE_COLUMNS = RAW_REFERENCE_COLUMNS[:1] + COMPACT_COLUMNS[:-1] + RAW_REFERENCE_COLUMNS[1:] + COMPACT_COLUMNS[-1:]

MEDICAL_ASSET_TYPES = ["Urgent Care", "VA Health Facility", "EMS"]


def fetch_json(url, params=None, timeout=120):
    target = url
    if params:
        target = f"{url}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(target, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8", "replace"))


def arcgis_features(layer_url, where="1=1", page_size=2000, limit=None):
    offset = 0
    yielded = 0
    while True:
        params = {
            "where": where,
            "outFields": "*",
            "returnGeometry": "true",
            "outSR": "4326",
            "f": "json",
            "resultOffset": offset,
            "resultRecordCount": page_size,
        }
        payload = fetch_json(f"{layer_url}/query", params=params)
        if "error" in payload:
            message = payload["error"].get("message") or payload["error"]
            raise RuntimeError(f"ArcGIS query failed for {layer_url}: {message}")

        features = payload.get("features") or []
        if not features:
            break

        for feature in features:
            yield feature
            yielded += 1
            if limit is not None and yielded >= limit:
                return

        if len(features) < page_size:
            break
        offset += len(features)


def value(attributes, *names):
    normalized = {normalize_key(key): raw for key, raw in attributes.items()}
    for name in names:
        raw = normalized.get(normalize_key(name))
        if raw is None:
            continue
        text = str(raw).strip()
        if text and text.upper() not in {"N/A", "NA", "NULL", "NONE", "UNKNOWN", "NOT AVAILABLE"}:
            return text
    return ""


def normalize_key(text):
    return re.sub(r"[^a-z0-9]", "", str(text or "").lower())


def number(value_text):
    text = str(value_text or "").replace(",", "").strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def coordinates(feature, attributes):
    geometry = feature.get("geometry") or {}
    longitude = number(geometry.get("x"))
    latitude = number(geometry.get("y"))

    if latitude is None:
        latitude = number(value(attributes, "LATITUDE", "Latitude", "lat"))
    if longitude is None:
        longitude = number(value(attributes, "LONGITUDE", "Longitude", "lon", "lng"))

    if not valid_coordinates(latitude, longitude):
        return "", ""
    return f"{latitude:.8f}", f"{longitude:.8f}"


def valid_coordinates(latitude, longitude):
    return (
        latitude is not None
        and longitude is not None
        and -90 <= latitude <= 90
        and -180 <= longitude <= 180
    )


def normalized_row(source, layer, category, source_url, feature):
    attributes = feature.get("attributes") or {}
    latitude, longitude = coordinates(feature, attributes)
    object_id = value(attributes, "OBJECTID_1", "OBJECTID", "FID")

    row = {
        "source": source,
        "layer": layer,
        "facility_category": category,
        "name": value(attributes, "NAME", "Name", "SITE_NM"),
        "asset_type": value(attributes, "AssetType"),
        "facility_type": value(attributes, "FacilityType"),
        "hospital_type": value(attributes, "TYPE"),
        "status": value(attributes, "STATUS"),
        "beds": value(attributes, "BEDS"),
        "total_staff": value(attributes, "TTL_STAFF"),
        "trauma": value(attributes, "TRAUMA"),
        "helipad": value(attributes, "HELIPAD"),
        "owner": value(attributes, "OWNER"),
        "address": value(attributes, "ADDRESS", "Address"),
        "city": value(attributes, "CITY", "City"),
        "state": value(attributes, "STATE", "State"),
        "zip": value(attributes, "ZIP", "Zip", "ZIP4"),
        "county": value(attributes, "COUNTY", "County"),
        "county_fips": value(attributes, "COUNTYFIPS", "CountyFIPS"),
        "phone": value(attributes, "TELEPHONE", "Phone"),
        "website": value(attributes, "WEBSITE", "Website"),
        "latitude": latitude,
        "longitude": longitude,
        "source_url": source_url,
        "original_object_id": object_id,
    }

    for key, raw in attributes.items():
        row[f"attr_{key}"] = "" if raw is None else str(raw).strip()
    return row


def export_rows(include_medical_hospitals=False, page_size=2000, limit=None):
    rows = []

    for feature in arcgis_features(HIFLD_HOSPITALS_FEATURESERVER, page_size=page_size, limit=limit):
        rows.append(
            normalized_row(
                "HIFLD",
                "Hospitals_hifld",
                "Hospitals",
                HIFLD_HOSPITALS_FEATURESERVER,
                feature,
            )
        )

    asset_types = list(MEDICAL_ASSET_TYPES)
    if include_medical_hospitals:
        asset_types.insert(0, "Hospital")

    for asset_type in asset_types:
        escaped_asset_type = asset_type.replace("'", "''")
        where = f"AssetType = '{escaped_asset_type}'"
        for feature in arcgis_features(HIFLD_MEDICAL_FACILITIES_FEATURESERVER, where=where, page_size=page_size, limit=limit):
            rows.append(
                normalized_row(
                    "HIFLD",
                    "US_HIFLD_Assets",
                    asset_type,
                    HIFLD_MEDICAL_FACILITIES_FEATURESERVER,
                    feature,
                )
            )

    return rows


def write_csv(rows, out_path, include_raw_attributes=False):
    if include_raw_attributes:
        extra_columns = sorted({key for row in rows for key in row if key not in BASE_COLUMNS})
        fieldnames = BASE_COLUMNS + extra_columns
    else:
        fieldnames = COMPACT_COLUMNS
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("w", newline="", encoding="utf-8") as output:
        writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def parse_args(argv):
    parser = argparse.ArgumentParser(description="Export HIFLD healthcare facilities with coordinates to CSV.")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT, help=f"Output CSV path. Default: {DEFAULT_OUT}")
    parser.add_argument("--page-size", type=int, default=2000, help="ArcGIS page size. Default: 2000")
    parser.add_argument("--limit", type=int, help="Optional per-layer limit for quick testing.")
    parser.add_argument(
        "--include-medical-hospitals",
        action="store_true",
        help="Also include Hospital records from the broad US_HIFLD_Assets layer. This may duplicate richer Hospitals_hifld rows.",
    )
    parser.add_argument(
        "--include-raw-attributes",
        action="store_true",
        help="Include all raw source attributes and reference URL columns. The default compact CSV is much smaller for GitHub.",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv or sys.argv[1:])
    rows = export_rows(
        include_medical_hospitals=args.include_medical_hospitals,
        page_size=args.page_size,
        limit=args.limit,
    )
    write_csv(rows, args.out, include_raw_attributes=args.include_raw_attributes)
    print(f"Wrote {len(rows):,} HIFLD rows to {args.out}")


if __name__ == "__main__":
    main()
