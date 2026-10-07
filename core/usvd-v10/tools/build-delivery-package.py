"""Build a creator ZIP from an explicit JSON file list; no recursive source pickup.

Input JSON: {"project_id":"...", "status":"PARTIAL|COMPLETE", "production_gate":"...",
             "files":[{"source":"absolute-or-input-relative", "path":"inside/zip.ext",
                       "artifact_id":"...", "revision":4, "episode_scope":"EP01-EP48",
                       "source_digest":"...", "language_coverage":["zh-CN","en-US"]}],
             "missing_assets":[]}
Usage: python build-delivery-package.py input.json output.zip
"""

import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import sys
from datetime import datetime, timezone
from zipfile import ZipFile, ZIP_DEFLATED


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python build-delivery-package.py input.json output.zip")
    spec_path = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    spec = json.loads(spec_path.read_text(encoding="utf-8"))
    if not spec.get("project_id") or not isinstance(spec.get("files"), list):
        raise ValueError("project_id and files are required")
    if spec.get("status") not in {"PARTIAL", "COMPLETE"}:
        raise ValueError("status must be PARTIAL or COMPLETE")
    entries = []
    seen = {"manifest.json"}
    for item in spec["files"]:
        source = Path(item["source"])
        if not source.is_absolute():
            source = spec_path.parent / source
        source = source.resolve(strict=True)
        if not source.is_file() or source == output_path:
            raise ValueError(f"Invalid source: {source}")
        target = PurePosixPath(item["path"])
        if target.is_absolute() or ".." in target.parts or not target.parts or str(target) in seen:
            raise ValueError(f"Unsafe or duplicate archive path: {target}")
        seen.add(str(target))
        blob = source.read_bytes()
        record = {key: value for key, value in item.items() if key != "source"}
        record["path"] = str(target)
        record["sha256"] = hashlib.sha256(blob).hexdigest()
        record["bytes"] = len(blob)
        entries.append((source, record))
    manifest = {
        "project_id": spec["project_id"],
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
        "status": spec["status"],
        "production_gate": spec.get("production_gate", "UNKNOWN"),
        "missing_assets": spec.get("missing_assets", []),
        "notes": spec.get("notes", []),
        "files": [record for _, record in entries],
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = output_path.with_name(output_path.name + ".tmp")
    try:
        with ZipFile(temporary, "w", ZIP_DEFLATED) as archive:
            archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")
            for source, record in entries:
                archive.write(source, record["path"])
        os.replace(temporary, output_path)
    finally:
        if temporary.exists():
            temporary.unlink()
    print(output_path)


if __name__ == "__main__":
    main()
