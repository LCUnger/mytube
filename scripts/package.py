"""Build the unpacked extension into a reproducible store ZIP (standard library)."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "extension"


def build():
    manifest = json.loads((SOURCE / "manifest.json").read_text())
    files = [
        path for path in sorted(SOURCE.rglob("*"))
        if path.is_file() and "_metadata" not in path.relative_to(SOURCE).parts
    ]
    if any(path.suffix.lower() in {".pem", ".crx"} for path in files):
        raise ValueError("Move signing keys and signed packages out of extension/ before building.")

    target = ROOT / "dist" / f"mytube-{manifest['version']}.zip"
    target.parent.mkdir(exist_ok=True)
    with ZipFile(target, "w") as archive:
        for path in files:
            entry = ZipInfo(path.relative_to(SOURCE).as_posix())
            entry.create_system = 3
            entry.external_attr = 0o100644 << 16
            archive.writestr(entry, path.read_bytes(), compress_type=ZIP_DEFLATED)
    return target


if __name__ == "__main__":
    print(build())
