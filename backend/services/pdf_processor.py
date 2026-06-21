import fitz
import cv2
import numpy as np


def remove_watermark_pdf(input_path: str, output_path: str, method: str = "inpaint", coords: dict = None):
    doc = fitz.open(input_path)
    new_doc = fitz.open()

    for page_num in range(len(doc)):
        page = doc[page_num]
        pix = page.get_pixmap(dpi=200)
        img_bytes = pix.tobytes("png")
        nparr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        processed = _process_page_image(img, method, coords)

        _, buffer = cv2.imencode(".png", processed)
        img_pil = fitz.Pixmap(
            fitz.csRGB,
            fitz.samples_from_buffer(buffer.tobytes(), processed.shape[1], processed.shape[0]),
        )
        rect = page.rect
        new_page = new_doc.new_page(width=rect.width, height=rect.height)
        new_page.insert_image(rect, pixmap=img_pil)

    new_doc.save(output_path)
    doc.close()
    new_doc.close()


def _detect_watermark(region: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    mean = float(np.mean(gray))
    std = float(np.std(gray))

    edges = cv2.Canny(gray, 30, 90)
    edges_mask = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=1)

    if std < 8:
        kernel = np.ones((3, 3), np.uint8)
        return cv2.morphologyEx(edges_mask, cv2.MORPH_CLOSE, kernel)

    _, otsu_fg = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    _, otsu_bg = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu = otsu_fg if np.sum(otsu_fg) < np.sum(otsu_bg) else otsu_bg

    lower = max(0, mean - 1.5 * std)
    upper = min(255, mean + 1.5 * std)
    _, bright = cv2.threshold(gray, int(upper), 255, cv2.THRESH_BINARY)
    _, dark = cv2.threshold(gray, int(lower), 255, cv2.THRESH_BINARY_INV)

    mask = cv2.bitwise_or(bright, dark)
    mask = cv2.bitwise_or(mask, otsu)
    mask = cv2.bitwise_or(mask, edges_mask)

    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    return mask


def _fill_nearest(region: np.ndarray, mask: np.ndarray) -> np.ndarray:
    result = region.copy()
    current_mask = mask.copy().astype(np.uint8)
    h, w = mask.shape
    offsets = [(-1, -1), (-1, 0), (-1, 1), (0, -1), (0, 1), (1, -1), (1, 0), (1, 1)]

    kernel = np.ones((3, 3), np.uint8)

    while cv2.countNonZero(current_mask) > 0:
        eroded = cv2.erode(current_mask, kernel, iterations=1)
        border = cv2.subtract(current_mask, eroded)
        ys, xs = np.where(border > 0)
        if len(ys) == 0:
            ys, xs = np.where(current_mask > 0)

        filled_any = False
        for my, mx in zip(ys, xs):
            colors = []
            for dy, dx in offsets:
                ny, nx = my + dy, mx + dx
                if 0 <= ny < h and 0 <= nx < w and current_mask[ny, nx] == 0:
                    colors.append(result[ny, nx])
            if colors:
                result[my, mx] = np.median(colors, axis=0).astype(np.uint8)
                current_mask[my, mx] = 0
                filled_any = True

        if not filled_any:
            remaining_ys, remaining_xs = np.where(current_mask > 0)
            for my, mx in zip(remaining_ys, remaining_xs):
                colors = []
                for dy, dx in offsets:
                    ny, nx = my + dy, mx + dx
                    if 0 <= ny < h and 0 <= nx < w:
                        colors.append(result[ny, nx])
                if colors:
                    result[my, mx] = np.median(colors, axis=0).astype(np.uint8)
            break

    return result


def _process_page_image(img: np.ndarray, method: str, coords: dict = None) -> np.ndarray:
    if coords and all(k in coords for k in ("x", "y", "w", "h")):
        return _page_region(img, coords)
    if method == "inpaint":
        return _page_inpaint(img)
    return _page_threshold(img)


def _page_region(img: np.ndarray, coords: dict) -> np.ndarray:
    x, y = int(coords["x"]), int(coords["y"])
    w, h = int(coords["w"]), int(coords["h"])
    h_img, w_img = img.shape[:2]
    x, y = max(0, x), max(0, y)
    w, h = min(w, w_img - x), min(h, h_img - y)
    if w <= 0 or h <= 0:
        return img

    region = img[y:y + h, x:x + w]
    mask_region = _detect_watermark(region)
    if np.sum(mask_region) < 255 * 3:
        return img

    filled = _fill_nearest(region, mask_region)
    result = img.copy()
    result[y:y + h, x:x + w] = filled
    return result


def _page_inpaint(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 220, 255, cv2.THRESH_BINARY)
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=1)
    return cv2.inpaint(img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)


def _page_threshold(img: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower = np.array([0, 0, 200])
    upper = np.array([180, 30, 255])
    mask = cv2.inRange(hsv, lower, upper)
    mask = cv2.dilate(mask, np.ones((3, 3), np.uint8), iterations=1)
    return cv2.inpaint(img, mask, inpaintRadius=3, flags=cv2.INPAINT_TELEA)
