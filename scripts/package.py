"""Build the unpacked extension into a reproducible store ZIP (standard library)."""
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile, ZipInfo

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "extension"


def build():
    manifest = json.loads((SOURCE / "manifest.json").read_text())
    target = ROOT / "dist" / f"mytube-{manifest['version']}.zip"
    target.parent.mkdir(exist_ok=True)
    with ZipFile(target, "w") as archive:
        for path in sorted(SOURCE.rglob("*")):
            if path.is_file():
                entry = ZipInfo(path.relative_to(SOURCE).as_posix())
                entry.create_system = 3
                entry.external_attr = 0o100644 << 16
                archive.writestr(entry, path.read_bytes(), compress_type=ZIP_DEFLATED)
    return target


if __name__ == "__main__":
    print(build())
