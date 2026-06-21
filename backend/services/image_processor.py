import cv2
import numpy as np


def remove_watermark_image(input_path: str, output_path: str, method: str = "inpaint", coords: dict = None):
    img = cv2.imread(input_path)
    if img is None:
        raise ValueError("Could not read image")

    if coords and all(k in coords for k in ("x", "y", "w", "h")):
        _remove_from_region(img, int(coords["x"]), int(coords["y"]), int(coords["w"]), int(coords["h"]), output_path)
    elif method == "inpaint":
        _inpaint_method(img, output_path)
    elif method == "threshold":
        _threshold_method(img, output_path)
    elif method == "frequency":
        _frequency_method(img, output_path)
    else:
        _inpaint_method(img, output_path)


def _detect_watermark_mask(region: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(region, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    mean = float(np.mean(gray))
    std = float(np.std(gray))

    edges = cv2.Canny(gray, 30, 90)
    edges_mask = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=2)

    if std < 8:
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(edges_mask, cv2.MORPH_CLOSE, kernel)
        mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
        return mask

    low = max(0, mean - 1.0 * std)
    high = min(255, mean + 1.0 * std)
    _, bright = cv2.threshold(gray, int(high), 255, cv2.THRESH_BINARY)
    _, dark = cv2.threshold(gray, int(low), 255, cv2.THRESH_BINARY_INV)

    _, otsu_fg = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    _, otsu_bg = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    otsu = otsu_fg if np.sum(otsu_fg) < np.sum(otsu_bg) else otsu_bg

    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 5)

    mask = cv2.bitwise_or(bright, dark)
    mask = cv2.bitwise_or(mask, otsu)
    mask = cv2.bitwise_or(mask, edges_mask)
    mask = cv2.bitwise_or(mask, adaptive)

    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered = np.zeros_like(mask)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 20:
            cv2.drawContours(filtered, [cnt], -1, 255, -1)

    return cv2.dilate(filtered, np.ones((5, 5), np.uint8), iterations=2)


def _remove_from_region(img: np.ndarray, x: int, y: int, w: int, h: int, output_path: str):
    h_img, w_img = img.shape[:2]
    x, y = max(0, x), max(0, y)
    w = min(w, w_img - x)
    h = min(h, h_img - y)
    if w <= 0 or h <= 0:
        cv2.imwrite(output_path, img)
        return

    region = img[y:y + h, x:x + w]
    mask_region = _detect_watermark_mask(region)

    if np.sum(mask_region) < 255 * 3:
        cv2.imwrite(output_path, img)
        return

    full_mask = np.zeros((h_img, w_img), dtype=np.uint8)
    full_mask[y:y + h, x:x + w] = mask_region

    full_mask = cv2.dilate(full_mask, np.ones((5, 5), np.uint8), iterations=2)
    result = cv2.inpaint(img, full_mask, inpaintRadius=5, flags=cv2.INPAINT_NS)
    cv2.imwrite(output_path, result)


def _inpaint_method(img: np.ndarray, output_path: str):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    _, bright = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    _, dark = cv2.threshold(gray, 60, 255, cv2.THRESH_BINARY_INV)
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 25, 4)
    edges = cv2.Canny(gray, 50, 150)
    edges = cv2.dilate(edges, np.ones((3, 3), np.uint8), iterations=2)

    mask = cv2.bitwise_or(bright, dark)
    mask = cv2.bitwise_or(mask, adaptive)
    mask = cv2.bitwise_or(mask, edges)

    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filtered = np.zeros_like(mask)
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area > 30:
            cv2.drawContours(filtered, [cnt], -1, 255, -1)

    filtered = cv2.dilate(filtered, np.ones((5, 5), np.uint8), iterations=2)
    result = cv2.inpaint(img, filtered, inpaintRadius=5, flags=cv2.INPAINT_NS)
    cv2.imwrite(output_path, result)


def _threshold_method(img: np.ndarray, output_path: str):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    lower_white = np.array([0, 0, 180])
    upper_white = np.array([180, 40, 255])
    lower_black = np.array([0, 0, 0])
    upper_black = np.array([180, 255, 60])

    mask_white = cv2.inRange(hsv, lower_white, upper_white)
    mask_black = cv2.inRange(hsv, lower_black, upper_black)
    mask = cv2.bitwise_or(mask_white, mask_black)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    adaptive = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 25, 4)
    mask = cv2.bitwise_or(mask, adaptive)

    mask = cv2.dilate(mask, np.ones((5, 5), np.uint8), iterations=2)
    result = cv2.inpaint(img, mask, inpaintRadius=5, flags=cv2.INPAINT_NS)
    cv2.imwrite(output_path, result)


def _frequency_method(img: np.ndarray, output_path: str):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    dft = cv2.dft(np.float32(gray), flags=cv2.DFT_COMPLEX_OUTPUT)
    dft_shift = np.fft.fftshift(dft)
    crow, ccol = h // 2, w // 2

    dft_shift[crow - 15:crow + 15, ccol - 15:ccol + 15] = 0
    for r in range(10, min(h, w) // 3, 20):
        cv2.circle(dft_shift, (ccol, crow), r, (0, 0), -1)

    f_ishift = np.fft.ifftshift(dft_shift)
    img_back = cv2.idft(f_ishift)
    img_back = cv2.magnitude(img_back[:, :, 0], img_back[:, :, 1])
    img_back = cv2.normalize(img_back, None, 0, 255, cv2.NORM_MINMAX)
    img_back = np.uint8(img_back)

    result_color = cv2.cvtColor(img_back, cv2.COLOR_GRAY2BGR)

    cv2.imwrite(output_path, result_color)
