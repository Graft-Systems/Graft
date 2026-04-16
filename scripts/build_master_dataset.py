from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path

from PIL import Image


COLUMNS = [
    "image_id",
    "image_path",
    "depth_path",
    "weight_g",
    "grape_variety",
    "clone_type",
    "source_dataset",
    "split",
    "maturity",
    "has_depth",
    "has_weight",
    "notes",
]

MATURITY_MAP = {
    1: "immature",
    2: "semi-mature",
    3: "mature",
}

WGISD_VARIETY_MAP = {
    "CDY": "Chardonnay",
    "CFR": "Cabernet Franc",
    "CSV": "Cabernet Sauvignon",
    "SVB": "Sauvignon Blanc",
    "SYH": "Syrah",
}


def read_lines(path: Path) -> list[str]:
    return [line.strip() for line in path.read_text().splitlines() if line.strip()]


def bool_text(value: bool) -> str:
    return "true" if value else "false"


def copy_if_needed(src: Path, dst: Path) -> None:
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not dst.exists():
        shutil.copy2(src, dst)


def is_readable_image(path: Path) -> bool:
    try:
        with Image.open(path) as img:
            img.verify()
        return True
    except Exception:
        return False


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def build_certh_rows(repo_root: Path, out_images_dir: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    annotation_specs = [
        (
            repo_root / "annotations" / "mimc_train_images.json",
            "train",
            repo_root / "images" / "multiple-instance-multiple-class" / "train_set",
        ),
        (
            repo_root / "annotations" / "mimc_valid_images.json",
            "val",
            repo_root / "images" / "multiple-instance-multiple-class" / "valid_set",
        ),
        (
            repo_root / "annotations" / "mimc_test_images.json",
            "test",
            repo_root / "images" / "multiple-instance-multiple-class" / "test_set",
        ),
    ]

    for annotation_path, split, source_image_dir in annotation_specs:
        payload = json.loads(annotation_path.read_text())
        images_by_id = {img["id"]: img for img in payload["images"]}

        for img in payload["images"]:
            src_image = source_image_dir / img["file_name"]
            dst_image = out_images_dir / img["file_name"]
            copy_if_needed(src_image, dst_image)

        for ann in payload["annotations"]:
            img = images_by_id[ann["image_id"]]
            maturity = MATURITY_MAP.get(ann["category_id"], "")
            rows.append(
                {
                    "image_id": f"CERTH:{split}:ann:{ann['id']}",
                    "image_path": f"master_dataset/images/CERTH/{img['file_name']}",
                    "depth_path": "",
                    "weight_g": "",
                    "grape_variety": "",
                    "clone_type": "",
                    "source_dataset": "CERTH",
                    "split": split,
                    "maturity": maturity,
                    "has_depth": bool_text(False),
                    "has_weight": bool_text(False),
                    "notes": "",
                }
            )

    return rows


def build_wgisd_rows(repo_root: Path, out_images_dir: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    data_dir = repo_root / "thsant-wgisd-ab223e5" / "data"
    train = set(read_lines(repo_root / "thsant-wgisd-ab223e5" / "train.txt"))
    test = set(read_lines(repo_root / "thsant-wgisd-ab223e5" / "test.txt"))

    for image_path in sorted(data_dir.glob("*.jpg")):
        stem = image_path.stem
        split = "unspecified"
        if stem in train:
            split = "train"
        elif stem in test:
            split = "test"

        prefix = stem[:3]
        variety = WGISD_VARIETY_MAP.get(prefix, "")
        note_parts: list[str] = []
        if not (data_dir / f"{stem}.npz").exists():
            note_parts.append("no_instance_mask")

        dst_image = out_images_dir / image_path.name
        copy_if_needed(image_path, dst_image)

        rows.append(
            {
                "image_id": f"Embrapa_WGISD:{stem}",
                "image_path": f"master_dataset/images/Embrapa_WGISD/{image_path.name}",
                "depth_path": "",
                "weight_g": "",
                "grape_variety": variety,
                "clone_type": "",
                "source_dataset": "Embrapa_WGISD",
                "split": split,
                "maturity": "",
                "has_depth": bool_text(False),
                "has_weight": bool_text(False),
                "notes": ";".join(note_parts),
            }
        )

    return rows


def build_grapesnet_rows(repo_root: Path, out_images_dir: Path, out_depth_dir: Path) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    base = repo_root / "GrapesNet Indian Grape Clusters RGB & RGB-D Image Datasets" / "GrapesNet" / "Dataset 4" / "RGB-D"
    gt_path = base / "Ground Truth for Dataset 4.csv"

    with gt_path.open(newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            image_name = row["Image No."].strip()
            stem = image_name.replace("_Color.png", "")

            src_image = base / image_name
            dst_image = out_images_dir / image_name
            copy_if_needed(src_image, dst_image)

            depth_png_name = f"{stem}_Depth.png"
            src_depth_png = base / depth_png_name

            has_depth = src_depth_png.exists()
            depth_rel = ""
            note_parts: list[str] = []
            if has_depth:
                if is_readable_image(src_depth_png):
                    dst_depth = out_depth_dir / depth_png_name
                    copy_if_needed(src_depth_png, dst_depth)
                    depth_rel = f"master_dataset/depth/GrapesNet/{depth_png_name}"
                else:
                    has_depth = False
                    note_parts.append("corrupted_depth_png")
            else:
                note_parts.append("missing_depth_png")

            metadata_path = base / f"{stem}_Depth_metadata.csv"
            if not metadata_path.exists():
                note_parts.append("missing_depth_metadata")

            duplicate_meta = base / f"{stem}_Depth_metadata(1).csv"
            if duplicate_meta.exists():
                note_parts.append("duplicate_metadata_file_present")

            weight_kg = float(row["Ground truth:Weight(kg)"])
            weight_g = round(weight_kg * 1000.0, 3)

            rows.append(
                {
                    "image_id": f"GrapesNet:{stem}",
                    "image_path": f"master_dataset/images/GrapesNet/{image_name}",
                    "depth_path": depth_rel,
                    "weight_g": str(weight_g),
                    "grape_variety": "Sonaka",
                    "clone_type": "",
                    "source_dataset": "GrapesNet",
                    "split": "unspecified",
                    "maturity": "",
                    "has_depth": bool_text(has_depth),
                    "has_weight": bool_text(True),
                    "notes": ";".join(note_parts),
                }
            )

    return rows


def validate_rows(repo_root: Path, rows: list[dict[str, str]]) -> dict[str, object]:
    duplicate_ids = len(rows) - len({row["image_id"] for row in rows})

    missing_image_paths: list[str] = []
    missing_depth_paths: list[str] = []
    bad_images: list[str] = []

    all_image_paths = sorted({row["image_path"] for row in rows if row["image_path"]})
    all_depth_paths = sorted({row["depth_path"] for row in rows if row["depth_path"]})

    for rel_path in all_image_paths:
        abs_path = repo_root / rel_path
        if not abs_path.exists():
            missing_image_paths.append(rel_path)
            continue
        try:
            with Image.open(abs_path) as img:
                img.verify()
        except Exception:
            bad_images.append(rel_path)

    for rel_path in all_depth_paths:
        abs_path = repo_root / rel_path
        if not abs_path.exists():
            missing_depth_paths.append(rel_path)
            continue
        try:
            with Image.open(abs_path) as img:
                img.verify()
        except Exception:
            bad_images.append(rel_path)

    return {
        "total_rows": len(rows),
        "duplicate_image_ids": duplicate_ids,
        "missing_image_paths": missing_image_paths,
        "missing_depth_paths": missing_depth_paths,
        "corrupted_or_unreadable_images": bad_images,
    }


def main() -> None:
    repo_root = Path(__file__).resolve().parent.parent
    master_root = repo_root / "master_dataset"
    if master_root.exists():
        shutil.rmtree(master_root)
    images_root = master_root / "images"
    depth_root = master_root / "depth"

    certh_img_dir = images_root / "CERTH"
    wgisd_img_dir = images_root / "Embrapa_WGISD"
    grapesnet_img_dir = images_root / "GrapesNet"
    grapesnet_depth_dir = depth_root / "GrapesNet"

    certh_rows = build_certh_rows(repo_root, certh_img_dir)
    wgisd_rows = build_wgisd_rows(repo_root, wgisd_img_dir)
    grapesnet_rows = build_grapesnet_rows(repo_root, grapesnet_img_dir, grapesnet_depth_dir)

    write_csv(master_root / "certh_labels.csv", certh_rows)
    write_csv(master_root / "embrapa_wgisd_labels.csv", wgisd_rows)
    write_csv(master_root / "grapesnet_labels.csv", grapesnet_rows)

    master_rows = certh_rows + wgisd_rows + grapesnet_rows
    write_csv(master_root / "master_labels.csv", master_rows)

    report = validate_rows(repo_root, master_rows)
    (master_root / "validation_report.json").write_text(json.dumps(report, indent=2))

    readme_src = Path(__file__).resolve().parent.parent / "master_dataset" / "README.md"
    if readme_src.exists():
        shutil.copy2(readme_src, master_root / "README.md")

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
