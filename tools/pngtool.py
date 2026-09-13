# -*- coding: utf-8 -*-
"""Trim transparent margins from a PNG and downscale it, using only the stdlib.

Pillow is not installed in this environment, so this decodes the PNG by hand:
inflate the IDAT stream, undo the per-scanline filters, box-sample down, then
re-encode. Handles 8-bit truecolour-with-alpha, non-interlaced, which is what
the supplied logo is.
"""
import zlib, struct, sys


def read_png(path):
    d = open(path, "rb").read()
    assert d[:8] == b"\x89PNG\r\n\x1a\n", "not a PNG"
    pos, idat, ihdr = 8, [], None
    while pos < len(d):
        ln = struct.unpack(">I", d[pos:pos + 4])[0]
        typ = d[pos + 4:pos + 8]
        body = d[pos + 8:pos + 8 + ln]
        if typ == b"IHDR":
            ihdr = struct.unpack(">IIBBBBB", body)
        elif typ == b"IDAT":
            idat.append(body)
        elif typ == b"IEND":
            break
        pos += 12 + ln

    w, h, depth, ctype, comp, filt, interlace = ihdr
    assert depth == 8, "expected 8-bit, got %d" % depth
    assert ctype == 6, "expected RGBA (colour type 6), got %d" % ctype
    assert interlace == 0, "interlaced PNGs not supported"

    raw = zlib.decompress(b"".join(idat))
    stride = w * 4
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        f = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        if f == 1:
            for i in range(4, stride):
                line[i] = (line[i] + line[i - 4]) & 255
        elif f == 2:
            for i in range(stride):
                line[i] = (line[i] + prev[i]) & 255
        elif f == 3:
            for i in range(stride):
                a = line[i - 4] if i >= 4 else 0
                line[i] = (line[i] + ((a + prev[i]) >> 1)) & 255
        elif f == 4:
            for i in range(stride):
                a = line[i - 4] if i >= 4 else 0
                c = prev[i - 4] if i >= 4 else 0
                b = prev[i]
                pa, pb, pc = abs(b - c), abs(a - c), abs(a + b - 2 * c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line
    return w, h, out


def alpha_bbox(w, h, px, thresh=10):
    minx, miny, maxx, maxy = w, h, -1, -1
    for y in range(h):
        base = y * w * 4
        for x in range(w):
            if px[base + x * 4 + 3] > thresh:
                if x < minx: minx = x
                if x > maxx: maxx = x
                if y < miny: miny = y
                if y > maxy: maxy = y
    return minx, miny, maxx, maxy


def resize_box(sw, sh, px, x0, y0, x1, y1, dw, dh):
    """Box-average downscale of the crop region, alpha-premultiplied so that
    transparent pixels don't bleed dark fringes into the edges."""
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    out = bytearray(dw * dh * 4)
    for dy in range(dh):
        sy0 = y0 + dy * ch // dh
        sy1 = max(sy0 + 1, y0 + (dy + 1) * ch // dh)
        for dx in range(dw):
            sx0 = x0 + dx * cw // dw
            sx1 = max(sx0 + 1, x0 + (dx + 1) * cw // dw)
            r = g = b = a = n = 0
            for yy in range(sy0, sy1):
                row = yy * sw * 4
                for xx in range(sx0, sx1):
                    i = row + xx * 4
                    al = px[i + 3]
                    r += px[i] * al; g += px[i + 1] * al; b += px[i + 2] * al
                    a += al; n += 1
            o = (dy * dw + dx) * 4
            if a:
                out[o] = min(255, r // a); out[o + 1] = min(255, g // a); out[o + 2] = min(255, b // a)
            out[o + 3] = a // n if n else 0
    return out


def write_png(path, w, h, px):
    raw = bytearray()
    stride = w * 4
    for y in range(h):
        raw.append(0)                      # filter 0 (None)
        raw += px[y * stride:(y + 1) * stride]

    def chunk(typ, data):
        return (struct.pack(">I", len(data)) + typ + data
                + struct.pack(">I", zlib.crc32(typ + data) & 0xffffffff))

    png = (b"\x89PNG\r\n\x1a\n"
           + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
           + chunk(b"IDAT", zlib.compress(bytes(raw), 9))
           + chunk(b"IEND", b""))
    open(path, "wb").write(png)
    return len(png)


if __name__ == "__main__":
    src, dst, target_h = sys.argv[1], sys.argv[2], int(sys.argv[3])
    w, h, px = read_png(src)
    x0, y0, x1, y1 = alpha_bbox(w, h, px)
    cw, ch = x1 - x0 + 1, y1 - y0 + 1
    dh = target_h
    dw = max(1, round(cw * dh / ch))
    out = resize_box(w, h, px, x0, y0, x1, y1, dw, dh)
    size = write_png(dst, dw, dh, out)
    print("source      %dx%d" % (w, h))
    print("content box %dx%d at (%d,%d)" % (cw, ch, x0, y0))
    print("written     %dx%d -> %s (%.1f KB)" % (dw, dh, dst, size / 1024.0))
