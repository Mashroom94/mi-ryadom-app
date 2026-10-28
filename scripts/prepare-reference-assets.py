"""Create clean transparent UI assets from the supplied reference-sheet crops."""

from collections import deque
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1] / "public" / "assets"


def is_sheet_background(pixel: tuple[int, int, int, int]) -> bool:
    red, green, blue, alpha = pixel
    return alpha == 0 or (min(red, green, blue) > 214 and max(red, green, blue) - min(red, green, blue) < 48)


def remove_connected_background(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    queue: deque[tuple[int, int]] = deque()
    visited: set[tuple[int, int]] = set()

    for x in range(width):
        queue.extend(((x, 0), (x, height - 1)))
    for y in range(height):
        queue.extend(((0, y), (width - 1, y)))

    while queue:
        x, y = queue.popleft()
        if (x, y) in visited or not is_sheet_background(pixels[x, y]):
            continue
        visited.add((x, y))
        pixels[x, y] = (*pixels[x, y][:3], 0)
        if x:
            queue.append((x - 1, y))
        if x + 1 < width:
            queue.append((x + 1, y))
        if y:
            queue.append((x, y - 1))
        if y + 1 < height:
            queue.append((x, y + 1))

    # A faint sheet frame can survive the flood fill because it is darker than
    # the panel. It occupies only the outer two pixels of the supplied crops.
    for x in range(width):
        for y in (0, 1, height - 2, height - 1):
            pixels[x, y] = (*pixels[x, y][:3], 0)
    for y in range(height):
        for x in (0, 1, width - 2, width - 1):
            pixels[x, y] = (*pixels[x, y][:3], 0)

    bounds = rgba.getbbox()
    if not bounds:
        return rgba
    left, top, right, bottom = bounds
    padding = 3
    return rgba.crop((max(0, left - padding), max(0, top - padding), min(width, right + padding), min(height, bottom + padding)))


def clean_folder(folder: str, crop_bottom: int) -> None:
    for path in (ROOT / folder).glob("*.png"):
        with Image.open(path) as source:
            cropped = source.crop((0, 0, source.width, min(source.height, crop_bottom)))
            remove_connected_background(cropped).save(path, optimize=True)


clean_folder("characters", 248)
clean_folder("moods", 84)
clean_folder("signals", 83)
clean_folder("stickers", 101)
